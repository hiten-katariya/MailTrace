export type RiskCategory = 'legitimate' | 'suspicious' | 'phishing' | 'bec';
export type ProtocolStatus = 'pass' | 'fail' | 'none' | 'softfail' | 'neutral';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ScoreSignal {
  signal: string;
  weight: number;
  contribution: number;
  reason?: string;
  sourceModule?: 'header' | 'nlp' | 'origin' | 'domain' | 'correlation';
}

export type CaseSource = 'upload' | 'gmail';

export interface CaseSummary {
  case_id: string;
  subject: string;
  sender: string;
  received_at: string;
  fraud_score: number;
  risk_category: RiskCategory;
  status?: string;
  spf: ProtocolStatus;
  dkim: ProtocolStatus;
  dmarc: ProtocolStatus;
  source?: CaseSource;
  gmail_account?: string | null;
  gmail_message_id?: string | null;
}

export interface GmailStatus {
  connected: boolean;
  email?: string | null;
  status: string;
  connected_at?: string | null;
  last_polled_at?: string | null;
  error_message?: string | null;
}

export interface CaseDetail extends CaseSummary {
  file_hash: string;
  confidence: ConfidenceLevel;
  verdict_summary: string;
  score_breakdown: ScoreSignal[];
}

export interface RelayHop {
  hop: number;
  ip: string;
  timestamp: string;
  server: string;
  spf_status?: ProtocolStatus;
  delay_ms?: number;
  country?: string;
}

export interface CaseHeaders {
  spf: {
    result: ProtocolStatus;
    record: string;
    sender_ip?: string;
  };
  dkim: {
    result: ProtocolStatus;
    domain: string;
    selector?: string;
    signature_present?: boolean;
  };
  dmarc: {
    result: ProtocolStatus;
    policy: 'none' | 'quarantine' | 'reject' | 'absent';
    disposition?: string;
  };
  relay_chain: RelayHop[];
  anomalies: string[];
}

export interface FlaggedUrl {
  original: string;
  resolved: string;
  flagged: boolean;
  reason: string;
  reputation_score?: number;
}

export interface AttachmentFinding {
  filename: string;
  declared_content_type?: string;
  detected_file_type?: string;
  file_size: number;
  file_hash: string;
  is_flagged: boolean;
  flag_reason?: string;
}

export interface CaseContent {
  classification: RiskCategory;
  classification_confidence: number;
  flagged_phrases: string[];
  bec_indicators: string[];
  urls: FlaggedUrl[];
  attachments?: AttachmentFinding[];
  sentiment_urgency_score?: number;
  impersonation_target?: string;
}

export interface DomainIntel {
  domain: string;
  registrar: string;
  registered_on: string;
  domain_age_days: number;
  mx_valid: boolean;
  name_servers?: string[];
  punycode_detected?: boolean;
}

export interface CaseOrigin {
  originating_ip: string;
  geolocation: {
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
    precision_confidence: string;
  };
  isp: string;
  vpn_tor_flag: boolean;
  flag_source: string;
  domain_intel: DomainIntel;
}

export interface ThreatIntelMatch {
  indicator: string;
  source: string;
  abuse_score: number;
  last_reported?: string;
  categories?: string[];
}

export interface CaseCorrelation {
  threat_intel_matches: ThreatIntelMatch[];
  campaign_id?: string;
  linked_cases: string[];
  shared_indicator: string;
  attribution_type?: 'compromised_account' | 'spoofed_domain' | 'anonymized_infrastructure' | 'actor_controlled';
  attribution_confidence?: ConfidenceLevel;
}
