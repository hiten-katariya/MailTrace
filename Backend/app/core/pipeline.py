import os
import traceback
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import select, update
from backend.app.database import AsyncSessionLocal
from backend.app.models.case import Case
from backend.app.models.header import Headers, RelayHop
from backend.app.models.content import NLPFinding, URLFinding
from backend.app.models.origin import Geolocation, DomainIntel, IPReputationCache
from backend.app.models.audit import AuditLog
from backend.app.models.attachment import Attachment

from backend.app.core.ingestion import ParsedEmail
from backend.app.core.header_analysis import analyze_email_headers
from backend.app.core.content_analysis import analyze_email_content
from backend.app.core.attachment_analysis import analyze_attachments
from backend.app.core.url_analysis import analyze_urls
from backend.app.core.geolocation import geolocate_ip
from backend.app.core.ip_reputation import query_abuseipdb
from backend.app.core.domain_intel import analyze_domain_intel
from backend.app.core.scoring import calculate_composite_score
from backend.app.core.attribution import determine_attribution
from backend.app.core.correlation import compute_body_hash, correlate_and_cluster_case, populate_threat_intel_matches
from backend.app.core.retention import get_or_create_retention_policy, execute_retention_purge

_last_purge_timestamp: Optional[datetime] = None

async def execute_case_pipeline(case_id: str, parsed_email: ParsedEmail, raw_eml_bytes: bytes):
    async with AsyncSessionLocal() as db:
        try:
            # 1. Fetch Case record
            result = await db.execute(select(Case).where(Case.id == case_id))
            case = result.scalar_one_or_none()
            if not case:
                print(f"Case {case_id} not found for background pipeline.")
                return

            progress = {
                "header_analysis": "in_progress",
                "nlp_analysis": "pending",
                "geolocation": "pending",
                "domain_intel": "pending",
                "scoring": "pending",
            }
            case.pipeline_progress = progress
            case.body_hash = compute_body_hash(parsed_email.body_text)
            await db.commit()

            # STAGE 1: Header & Protocol Analysis
            headers_res = analyze_email_headers(
                raw_headers_dict=parsed_email.headers_dict,
                raw_eml_bytes=raw_eml_bytes,
                sender=parsed_email.sender,
                sender_domain=parsed_email.sender_domain,
            )

            # Persist Headers row
            db_headers = Headers(
                case_id=case_id,
                spf_result=headers_res.spf_result,
                spf_record=headers_res.spf_record,
                spf_sender_ip=headers_res.spf_sender_ip,
                dkim_result=headers_res.dkim_result,
                dkim_domain=headers_res.dkim_domain,
                dkim_selector=headers_res.dkim_selector,
                dkim_signature_present=headers_res.dkim_signature_present,
                dmarc_result=headers_res.dmarc_result,
                dmarc_policy=headers_res.dmarc_policy,
                dmarc_disposition=headers_res.dmarc_disposition,
                anomalies=headers_res.anomalies,
                raw_headers=parsed_email.raw_headers_text,
            )
            db.add(db_headers)

            # Persist Relay Hops
            for hop in headers_res.relay_chain:
                db_hop = RelayHop(
                    case_id=case_id,
                    hop_number=hop["hop"],
                    ip=hop["ip"],
                    server=hop.get("server"),
                    by_server=hop.get("by_server"),
                    timestamp=hop.get("timestamp_dt"),
                    delay_ms=hop.get("delay_ms", 0),
                    spf_status=hop.get("spf_status"),
                    country=hop.get("country", "Unknown"),
                    is_earliest_origin=hop.get("is_earliest_origin", False),
                )
                db.add(db_hop)

            progress["header_analysis"] = "done"
            progress["nlp_analysis"] = "in_progress"
            case.pipeline_progress = progress
            await db.commit()

            # STAGE 2: Content & URL Analysis
            content_res = analyze_email_content(
                subject=parsed_email.subject,
                body_text=parsed_email.body_text,
                sender=parsed_email.sender,
            )

            # URL Sandboxing
            url_findings = await analyze_urls(parsed_email.extracted_urls)

            # Persist NLP findings
            db_nlp = NLPFinding(
                case_id=case_id,
                classification=content_res.classification,
                classification_confidence=content_res.classification_confidence,
                sentiment_urgency_score=content_res.sentiment_urgency_score,
                impersonation_target=content_res.impersonation_target,
                flagged_phrases=content_res.flagged_phrases,
                bec_indicators=content_res.bec_indicators,
            )
            db.add(db_nlp)

            # Persist URLs
            for u in url_findings:
                db_url = URLFinding(
                    case_id=case_id,
                    original_url=u["original"],
                    resolved_url=u.get("resolved"),
                    domain=u.get("domain"),
                    is_flagged=u.get("is_flagged", False),
                    reason=u.get("reason"),
                    redirect_hops=u.get("redirect_hops", 0),
                    status_code=u.get("status_code"),
                )
                db.add(db_url)

            progress["nlp_analysis"] = "done"
            progress["geolocation"] = "in_progress"
            case.pipeline_progress = progress

            # STAGE 2.5: Attachment Analysis & Malware Inspection
            attachment_findings = analyze_attachments(parsed_email.attachments)
            for att in attachment_findings:
                db_att = Attachment(
                    case_id=case_id,
                    filename=att.filename,
                    declared_content_type=att.declared_content_type,
                    detected_file_type=att.detected_file_type,
                    file_size=att.file_size,
                    file_hash=att.file_hash,
                    is_flagged=att.is_flagged,
                    flag_reason=att.flag_reason,
                )
                db.add(db_att)

            await db.commit()

            # STAGE 3: IP Geolocation & IP Reputation
            origin_ip = headers_res.earliest_origin_ip or "127.0.0.1"
            geo_res = geolocate_ip(origin_ip)
            ip_rep_res = await query_abuseipdb(origin_ip)

            db_geo = Geolocation(
                case_id=case_id,
                originating_ip=origin_ip,
                country=geo_res.country,
                region=geo_res.region,
                city=geo_res.city,
                latitude=geo_res.latitude,
                longitude=geo_res.longitude,
                precision_confidence=geo_res.precision_confidence,
                isp=ip_rep_res.isp or geo_res.isp,
                asn=geo_res.asn,
            )
            db.add(db_geo)

            # Persist / Update IP Reputation Cache
            existing_cache = await db.execute(select(IPReputationCache).where(IPReputationCache.ip == origin_ip))
            cache_row = existing_cache.scalar_one_or_none()
            if not cache_row:
                cache_row = IPReputationCache(
                    ip=origin_ip,
                    abuse_score=ip_rep_res.abuse_score,
                    is_vpn_tor=ip_rep_res.is_vpn_tor,
                    flag_source=ip_rep_res.flag_source,
                    isp=ip_rep_res.isp or geo_res.isp,
                )
                db.add(cache_row)
            else:
                cache_row.abuse_score = ip_rep_res.abuse_score
                cache_row.is_vpn_tor = ip_rep_res.is_vpn_tor
                cache_row.flag_source = ip_rep_res.flag_source
                cache_row.isp = ip_rep_res.isp or geo_res.isp

            progress["geolocation"] = "done"
            progress["domain_intel"] = "in_progress"
            case.pipeline_progress = progress
            await db.commit()

            # STAGE 4: Domain Intelligence (WHOIS & DNS MX)
            domain_res = analyze_domain_intel(parsed_email.sender_domain)

            db_domain = DomainIntel(
                case_id=case_id,
                domain=domain_res.domain,
                registrar=domain_res.registrar,
                registered_on=domain_res.registered_on,
                domain_age_days=domain_res.domain_age_days,
                registrant_country=domain_res.registrant_country,
                mx_valid=domain_res.mx_valid,
                raw_whois=domain_res.raw_whois,
            )
            db.add(db_domain)

            progress["domain_intel"] = "done"
            progress["scoring"] = "in_progress"
            case.pipeline_progress = progress
            await db.commit()

            # STAGE 5: Multi-Signal Composite Scoring Engine
            scoring_res = calculate_composite_score(
                headers_res=headers_res,
                content_res=content_res,
                url_results=url_findings,
                domain_res=domain_res,
                geo_res=geo_res,
                ip_rep_res=ip_rep_res,
                attachment_results=attachment_findings,
            )

            # Update Case record with final score and verdict
            case.fraud_score = scoring_res.fraud_score
            case.risk_category = scoring_res.risk_category
            case.confidence = scoring_res.confidence
            case.verdict_summary = scoring_res.verdict_summary
            case.score_breakdown = [s.to_dict() for s in scoring_res.score_breakdown]
            case.status = "completed"

            progress["scoring"] = "done"
            case.pipeline_progress = progress

            # STAGE 6: Identity Attribution (STRICTLY AFTER final score/risk_category)
            attr_type, attr_conf, attr_reason = determine_attribution(
                spf_result=headers_res.spf_result,
                dkim_result=headers_res.dkim_result,
                dmarc_result=headers_res.dmarc_result,
                domain_age_days=domain_res.domain_age_days,
                is_vpn_tor=ip_rep_res.is_vpn_tor,
                anomalies=headers_res.anomalies,
                fraud_score=scoring_res.fraud_score,
                risk_category=scoring_res.risk_category,
                bec_indicators=content_res.bec_indicators,
            )
            case.attribution_type = attr_type
            case.attribution_confidence = attr_conf

            # STAGE 7: Campaign Clustering Across Shared Infrastructure
            campaign = await correlate_and_cluster_case(
                db=db,
                case=case,
                origin_ip=origin_ip,
                domain_name=parsed_email.sender_domain,
                target_brand=content_res.impersonation_target,
            )
            if campaign:
                case.campaign_id = campaign.id

            # STAGE 8: Threat Intelligence Feed Matching
            await populate_threat_intel_matches(
                db=db,
                case_id=case_id,
                origin_ip=origin_ip,
                domain_name=parsed_email.sender_domain,
                abuse_score=ip_rep_res.abuse_score or 0,
                is_vpn_tor=ip_rep_res.is_vpn_tor,
            )

            # Audit Log Entry
            audit_entry = AuditLog(
                username="system_pipeline",
                action="ingest_completed",
                case_id=case_id,
                details=f"Completed forensic analysis for '{parsed_email.subject}' (Score: {scoring_res.fraud_score}, Risk: {scoring_res.risk_category}, Attribution: {attr_type})",
            )
            db.add(audit_entry)

            # STAGE 9: Throttled Retention Auto-Purge Check (Max once per hour)
            global _last_purge_timestamp
            now_utc = datetime.now(timezone.utc)
            if _last_purge_timestamp is None or (now_utc - _last_purge_timestamp).total_seconds() > 3600:
                try:
                    retention_policy = await get_or_create_retention_policy(db)
                    if retention_policy.auto_purge:
                        await execute_retention_purge(db, retention_policy.retention_days)
                    _last_purge_timestamp = now_utc
                except Exception as pe:
                    print(f"[-] Retention auto-purge check warning: {pe}")

            await db.commit()
            print(f"[+] Case {case_id} pipeline completed successfully. Score: {scoring_res.fraud_score}/100 ({scoring_res.risk_category}, {attr_type})")

        except Exception as e:
            traceback.print_exc()
            print(f"[-] Pipeline failed for case {case_id}: {e}")
            try:
                result = await db.execute(select(Case).where(Case.id == case_id))
                case = result.scalar_one_or_none()
                if case:
                    case.status = "failed"
                    case.verdict_summary = f"Pipeline execution error: {str(e)}"
                    await db.commit()
            except Exception:
                pass
