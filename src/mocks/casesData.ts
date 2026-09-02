import { CaseDetail, CaseHeaders, CaseContent, CaseOrigin, CaseCorrelation } from '../types/case';

export interface FullCaseRecord {
  detail: CaseDetail;
  headers: CaseHeaders;
  content: CaseContent;
  origin: CaseOrigin;
  correlation: CaseCorrelation;
}

export const MOCK_CASES: FullCaseRecord[] = [
  {
    detail: {
      case_id: 'c8f2a1e4-39fa-4c78-b6e8-289d18e47001',
      subject: 'Urgent: Immediate suspension notice for your corporate account',
      sender: 'security-alert@microsoft-security-auth.net',
      received_at: '2026-09-02T10:14:22Z',
      fraud_score: 94,
      risk_category: 'phishing',
      spf: 'fail',
      dkim: 'fail',
      dmarc: 'fail',
      file_hash: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd31b873c9f28d7a8123bc4a91f',
      confidence: 'high',
      verdict_summary: 'Likely credential phishing — brand impersonation, spoofed domain registered 2 days ago, failed DMARC policy, origin IP listed on AbuseIPDB blocklist.',
      score_breakdown: [
        {
          signal: 'DMARC alignment failure & policy rejection',
          weight: 25,
          contribution: 25,
          reason: 'Domain microsoft-security-auth.net has no valid SPF/DKIM alignment with envelope sender.',
          sourceModule: 'header'
        },
        {
          signal: 'Domain age < 48 hours',
          weight: 20,
          contribution: 20,
          reason: 'Registered on 2026-08-31 via NameCheap with privacy proxy.',
          sourceModule: 'domain'
        },
        {
          signal: 'NLP: High-urgency coercive language & credential request',
          weight: 20,
          contribution: 19,
          reason: 'Detected pressure cues ("immediate suspension", "verify credentials in 15 mins").',
          sourceModule: 'nlp'
        },
        {
          signal: 'Originating IP flagged as known VPN/Tor exit node',
          weight: 15,
          contribution: 15,
          reason: 'IP 185.220.101.5 reported 48 times on AbuseIPDB in last 24h.',
          sourceModule: 'origin'
        },
        {
          signal: 'Deceptive lookalike URL target',
          weight: 20,
          contribution: 15,
          reason: 'Embedded link masks destination login.microsoft-security-auth.net/sso.',
          sourceModule: 'nlp'
        }
      ]
    },
    headers: {
      spf: {
        result: 'fail',
        record: 'v=spf1 ip4:192.0.2.1 -all',
        sender_ip: '185.220.101.5'
      },
      dkim: {
        result: 'fail',
        domain: 'microsoft-security-auth.net',
        selector: 's1',
        signature_present: false
      },
      dmarc: {
        result: 'fail',
        policy: 'reject',
        disposition: 'quarantine'
      },
      relay_chain: [
        {
          hop: 1,
          ip: '185.220.101.5',
          timestamp: '2026-09-02T10:13:45Z',
          server: 'node-fra-09.bulletproof-transit.net',
          spf_status: 'fail',
          delay_ms: 0,
          country: 'Germany'
        },
        {
          hop: 2,
          ip: '194.165.16.22',
          timestamp: '2026-09-02T10:14:02Z',
          server: 'relay01.openmta-cloud.org',
          spf_status: 'none',
          delay_ms: 17000,
          country: 'Romania'
        },
        {
          hop: 3,
          ip: '198.51.100.88',
          timestamp: '2026-09-02T10:14:15Z',
          server: 'mx-in.internal-gateway.corp',
          spf_status: 'pass',
          delay_ms: 13000,
          country: 'United States'
        },
        {
          hop: 4,
          ip: '10.0.4.12',
          timestamp: '2026-09-02T10:14:22Z',
          server: 'mailstore-edge-03.local',
          spf_status: 'pass',
          delay_ms: 7000,
          country: 'United States'
        }
      ],
      anomalies: [
        'From/Return-Path mismatch: Envelope from <bounce@bulletproof-transit.net> vs Header From <security-alert@microsoft-security-auth.net>',
        'Reply-To domain mismatch: directs response to <collector-agent@tutanota.com>',
        'Missing cryptographic DKIM signature despite purported enterprise sender',
        'Relay latency anomaly: 17s delay between Hop 1 and Hop 2 indicating deliberate buffer'
      ]
    },
    content: {
      classification: 'phishing',
      classification_confidence: 0.96,
      sentiment_urgency_score: 92,
      impersonation_target: 'Microsoft 365 Security Operations',
      flagged_phrases: [
        'immediate suspension notice',
        'action required within 15 minutes',
        'verify your multi-factor credentials immediately',
        'failure to comply will terminate all access'
      ],
      bec_indicators: [],
      urls: [
        {
          original: 'http://t.co/v9Ak7Lm2',
          resolved: 'https://login.microsoft-security-auth.net/auth/portal/login.html',
          flagged: true,
          reason: 'Homoglyph domain mimicking official Microsoft login portal with credential harvester script',
          reputation_score: 95
        }
      ]
    },
    origin: {
      originating_ip: '185.220.101.5',
      geolocation: {
        country: 'Germany',
        region: 'Hesse',
        city: 'Frankfurt am Main',
        latitude: 50.1109,
        longitude: 8.6821,
        precision_confidence: 'country: high, city: medium'
      },
      isp: 'Tor Exit / Bulletproof Hosting Infrastructure',
      vpn_tor_flag: true,
      flag_source: 'AbuseIPDB (Confidence 88%)',
      domain_intel: {
        domain: 'microsoft-security-auth.net',
        registrar: 'NameCheap, Inc.',
        registered_on: '2026-08-31',
        domain_age_days: 2,
        mx_valid: false,
        name_servers: ['ns1.anonymous-dns.io', 'ns2.anonymous-dns.io'],
        punycode_detected: false
      }
    },
    correlation: {
      threat_intel_matches: [
        {
          indicator: '185.220.101.5',
          source: 'AbuseIPDB',
          abuse_score: 88,
          last_reported: '2026-09-02T08:30:00Z',
          categories: ['Phishing Host', 'Tor Exit Node', 'Malicious Relay']
        },
        {
          indicator: 'microsoft-security-auth.net',
          source: 'URLhaus / ThreatIntel Feed',
          abuse_score: 92,
          last_reported: '2026-09-01T22:15:00Z',
          categories: ['Credential Harvester']
        }
      ],
      campaign_id: 'camp-3391',
      linked_cases: [
        'c8f2a1e4-39fa-4c78-b6e8-289d18e47001',
        'f88a21e9-44bc-4672-91ef-771122334005',
        '66bb2233-44cc-55dd-66ee-77ff88aa9008'
      ],
      shared_indicator: 'Shared ASN AS9009 + Lookalike registrar pattern (NameCheap + PrivacyGuardian)',
      attribution_type: 'anonymized_infrastructure',
      attribution_confidence: 'high'
    }
  },
  {
    detail: {
      case_id: 'd71b9f02-88ef-41ae-9a02-5c941a8e1002',
      subject: 'CONFIDENTIAL: Urgent revision on vendor settlement for Q3 acquisition',
      sender: 'ceo-office@company-exec-mail.com',
      received_at: '2026-09-02T09:30:11Z',
      fraud_score: 88,
      risk_category: 'bec',
      spf: 'pass',
      dkim: 'pass',
      dmarc: 'fail',
      file_hash: '9f82c441b0198aa72ef58190223bc7891100eef45561a789cd2348911abcf012',
      confidence: 'high',
      verdict_summary: 'Likely Business Email Compromise (BEC) — executive display-name impersonation, payment diversion request, DMARC alignment failure against executive brand.',
      score_breakdown: [
        {
          signal: 'NLP: High-confidence BEC payment diversion cues',
          weight: 30,
          contribution: 29,
          reason: 'Contains explicit instructions to bypass standard accounts payable controls for urgent wire.',
          sourceModule: 'nlp'
        },
        {
          signal: 'Executive Display-Name Impersonation',
          weight: 25,
          contribution: 25,
          reason: 'Display name mimics Chief Executive Officer while using disposable external domain company-exec-mail.com.',
          sourceModule: 'nlp'
        },
        {
          signal: 'DMARC Envelope vs Header From Mismatch',
          weight: 20,
          contribution: 18,
          reason: 'SPF/DKIM passed on rogue domain, but failed organization strict DMARC alignment.',
          sourceModule: 'header'
        },
        {
          signal: 'Reply-To Divergence to Free Encrypted Webmail',
          weight: 15,
          contribution: 16,
          reason: 'Reply-To directs confidential communication to cfo-private@protonmail.com.',
          sourceModule: 'header'
        }
      ]
    },
    headers: {
      spf: {
        result: 'pass',
        record: 'v=spf1 include:spf.protection.outlook.com ~all',
        sender_ip: '45.142.214.190'
      },
      dkim: {
        result: 'pass',
        domain: 'company-exec-mail.com',
        selector: 'k1',
        signature_present: true
      },
      dmarc: {
        result: 'fail',
        policy: 'reject',
        disposition: 'quarantine'
      },
      relay_chain: [
        {
          hop: 1,
          ip: '45.142.214.190',
          timestamp: '2026-09-02T09:29:40Z',
          server: 'vps-nl-44.hostinger-nodes.net',
          spf_status: 'pass',
          delay_ms: 0,
          country: 'Netherlands'
        },
        {
          hop: 2,
          ip: '198.51.100.88',
          timestamp: '2026-09-02T09:30:11Z',
          server: 'mx-in.internal-gateway.corp',
          spf_status: 'pass',
          delay_ms: 31000,
          country: 'United States'
        }
      ],
      anomalies: [
        'Display Name Spoofing: "Marcus Vance (CEO)" on non-corporate domain company-exec-mail.com',
        'Header Reply-To directs replies to outside address: cfo-private@protonmail.com',
        'Authentication pass on adversary-registered domain but fails corporate DMARC protection'
      ]
    },
    content: {
      classification: 'bec',
      classification_confidence: 0.94,
      sentiment_urgency_score: 88,
      impersonation_target: 'Marcus Vance (Chief Executive Officer)',
      flagged_phrases: [
        'confidential settlement instructions',
        'bypass standard AP verification for this transaction',
        'initiate wire transfer immediately',
        'do not discuss on Slack or phone due to ongoing NDA'
      ],
      bec_indicators: [
        'Payment diversion request ($148,500.00)',
        'Authority impersonation / CEO pretexting',
        'Secrecy enforcement clause ("confidential M&A transaction")',
        'Alternative communication channel redirection'
      ],
      urls: []
    },
    origin: {
      originating_ip: '45.142.214.190',
      geolocation: {
        country: 'Netherlands',
        region: 'North Holland',
        city: 'Amsterdam',
        latitude: 52.3676,
        longitude: 4.9041,
        precision_confidence: 'country: high, city: high'
      },
      isp: 'Hostinger International Commercial VPS',
      vpn_tor_flag: false,
      flag_source: 'Hosting Provider Range ASN 47583',
      domain_intel: {
        domain: 'company-exec-mail.com',
        registrar: 'Tucows Domains Inc.',
        registered_on: '2026-08-25',
        domain_age_days: 8,
        mx_valid: true,
        name_servers: ['ns1.he.net', 'ns2.he.net'],
        punycode_detected: false
      }
    },
    correlation: {
      threat_intel_matches: [
        {
          indicator: '45.142.214.190',
          source: 'AbuseIPDB',
          abuse_score: 42,
          last_reported: '2026-09-01T18:00:00Z',
          categories: ['Email Spam', 'BEC Actor Infrastructure']
        }
      ],
      campaign_id: 'camp-4022',
      linked_cases: [
        'd71b9f02-88ef-41ae-9a02-5c941a8e1002'
      ],
      shared_indicator: 'Targeted BEC campaign mimicking executive wire transfer workflows',
      attribution_type: 'actor_controlled',
      attribution_confidence: 'medium'
    }
  },
  {
    detail: {
      case_id: 'e43c8b91-119a-4712-88df-098231cd3003',
      subject: 'Updated Payroll Direct Deposit Form Required for Q3 Compliance',
      sender: 'hr-payroll@workdays-portal.co',
      received_at: '2026-09-02T08:15:00Z',
      fraud_score: 68,
      risk_category: 'suspicious',
      spf: 'softfail',
      dkim: 'none',
      dmarc: 'none',
      file_hash: '33aa77ff00112233445566778899aabbccddeeff00112233445566778899aabb',
      confidence: 'medium',
      verdict_summary: 'Suspicious lookalike domain (workdays-portal.co) missing DKIM and DMARC enforcement; requesting banking/payroll modifications.',
      score_breakdown: [
        {
          signal: 'Lookalike Typosquatting Domain',
          weight: 30,
          contribution: 28,
          reason: 'Domain workdays-portal.co has 89% Levenshtein similarity to legitimate Workday SaaS.',
          sourceModule: 'domain'
        },
        {
          signal: 'SPF Softfail & Missing DKIM Signature',
          weight: 20,
          contribution: 18,
          reason: 'Sending MTA IP not explicitly authorized in SPF record (~all).',
          sourceModule: 'header'
        },
        {
          signal: 'NLP: Payroll and Banking credential capture intent',
          weight: 20,
          contribution: 14,
          reason: 'Body urges user to review bank account routing details.',
          sourceModule: 'nlp'
        },
        {
          signal: 'Young Domain (< 14 days old)',
          weight: 15,
          contribution: 8,
          reason: 'Domain registered on 2026-08-20.',
          sourceModule: 'domain'
        }
      ]
    },
    headers: {
      spf: {
        result: 'softfail',
        record: 'v=spf1 include:_spf.sendgrid.net ~all',
        sender_ip: '193.106.191.8'
      },
      dkim: {
        result: 'none',
        domain: 'workdays-portal.co',
        signature_present: false
      },
      dmarc: {
        result: 'none',
        policy: 'absent'
      },
      relay_chain: [
        {
          hop: 1,
          ip: '193.106.191.8',
          timestamp: '2026-09-02T08:14:10Z',
          server: 'mx02.shared-outbound-mta.net',
          spf_status: 'softfail',
          delay_ms: 0,
          country: 'Russia'
        },
        {
          hop: 2,
          ip: '198.51.100.88',
          timestamp: '2026-09-02T08:15:00Z',
          server: 'mx-in.internal-gateway.corp',
          spf_status: 'pass',
          delay_ms: 50000,
          country: 'United States'
        }
      ],
      anomalies: [
        'Missing DMARC policy record on sending domain',
        'No DKIM cryptographic authentication header present'
      ]
    },
    content: {
      classification: 'suspicious',
      classification_confidence: 0.76,
      sentiment_urgency_score: 65,
      impersonation_target: 'Workday HR Payroll Services',
      flagged_phrases: [
        'verify direct deposit routing number',
        'payroll compliance update',
        'avoid delay in upcoming salary disbursement'
      ],
      bec_indicators: ['payroll modification request'],
      urls: [
        {
          original: 'https://workdays-portal.co/payroll/update',
          resolved: 'https://workdays-portal.co/payroll/update',
          flagged: true,
          reason: 'Unverified third-party host imitating human resources application',
          reputation_score: 62
        }
      ]
    },
    origin: {
      originating_ip: '193.106.191.8',
      geolocation: {
        country: 'Russia',
        region: 'Moscow',
        city: 'Moscow',
        latitude: 55.7558,
        longitude: 37.6173,
        precision_confidence: 'country: high, city: low'
      },
      isp: 'Selectel Network Infrastructure',
      vpn_tor_flag: false,
      flag_source: 'ASN 49505',
      domain_intel: {
        domain: 'workdays-portal.co',
        registrar: 'Regtime Ltd.',
        registered_on: '2026-08-20',
        domain_age_days: 13,
        mx_valid: true,
        name_servers: ['ns1.regtime.net', 'ns2.regtime.net'],
        punycode_detected: false
      }
    },
    correlation: {
      threat_intel_matches: [
        {
          indicator: '193.106.191.8',
          source: 'AbuseIPDB',
          abuse_score: 35,
          last_reported: '2026-09-02T02:00:00Z'
        }
      ],
      campaign_id: 'camp-5190',
      linked_cases: [
        'e43c8b91-119a-4712-88df-098231cd3003'
      ],
      shared_indicator: 'HR/Payroll harvesting theme targeted at corporate contractors',
      attribution_type: 'spoofed_domain',
      attribution_confidence: 'medium'
    }
  },
  {
    detail: {
      case_id: 'a12b4c56-7788-4901-b223-998877660004',
      subject: 'Engineering All-Hands: Q3 Infrastructure Roadmap & Architecture Update',
      sender: 'alex.morgan@techcorp.internal.io',
      received_at: '2026-09-02T07:45:10Z',
      fraud_score: 4,
      risk_category: 'legitimate',
      spf: 'pass',
      dkim: 'pass',
      dmarc: 'pass',
      file_hash: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
      confidence: 'high',
      verdict_summary: 'Legitimate internal communication — fully authenticated SPF, DKIM, and DMARC passing on corporate infrastructure.',
      score_breakdown: [
        {
          signal: 'Full SPF, DKIM, DMARC Authentication Pass',
          weight: 40,
          contribution: 0,
          reason: 'Cryptographic DKIM signature matches techcorp.internal.io public key in DNS.',
          sourceModule: 'header'
        },
        {
          signal: 'Known Established Corporate Domain (> 6 years)',
          weight: 20,
          contribution: 0,
          reason: 'Domain registered in 2020 with verified corporate ownership.',
          sourceModule: 'domain'
        },
        {
          signal: 'NLP: Standard technical collaboration discourse',
          weight: 20,
          contribution: 2,
          reason: 'No urgency cues, credential requests, or financial diversion language.',
          sourceModule: 'nlp'
        },
        {
          signal: 'Internal / Trusted Corporate Relay IP',
          weight: 20,
          contribution: 2,
          reason: 'Originated from Google Workspace corporate relay (AS15169).',
          sourceModule: 'origin'
        }
      ]
    },
    headers: {
      spf: {
        result: 'pass',
        record: 'v=spf1 include:_spf.google.com ~all',
        sender_ip: '209.85.220.41'
      },
      dkim: {
        result: 'pass',
        domain: 'techcorp.internal.io',
        selector: '202401',
        signature_present: true
      },
      dmarc: {
        result: 'pass',
        policy: 'reject',
        disposition: 'none'
      },
      relay_chain: [
        {
          hop: 1,
          ip: '209.85.220.41',
          timestamp: '2026-09-02T07:44:55Z',
          server: 'mail-sor-f41.google.com',
          spf_status: 'pass',
          delay_ms: 0,
          country: 'United States'
        },
        {
          hop: 2,
          ip: '198.51.100.88',
          timestamp: '2026-09-02T07:45:10Z',
          server: 'mx-in.internal-gateway.corp',
          spf_status: 'pass',
          delay_ms: 15000,
          country: 'United States'
        }
      ],
      anomalies: []
    },
    content: {
      classification: 'legitimate',
      classification_confidence: 0.99,
      sentiment_urgency_score: 8,
      impersonation_target: 'None (Verified Employee)',
      flagged_phrases: [],
      bec_indicators: [],
      urls: [
        {
          original: 'https://docs.techcorp.internal.io/architecture/q3-roadmap',
          resolved: 'https://docs.techcorp.internal.io/architecture/q3-roadmap',
          flagged: false,
          reason: 'Internal corporate documentation repository',
          reputation_score: 0
        }
      ]
    },
    origin: {
      originating_ip: '209.85.220.41',
      geolocation: {
        country: 'United States',
        region: 'California',
        city: 'Mountain View',
        latitude: 37.422,
        longitude: -122.084,
        precision_confidence: 'country: high, city: high'
      },
      isp: 'Google LLC Cloud Infrastructure',
      vpn_tor_flag: false,
      flag_source: 'Clean (AbuseIPDB 0%)',
      domain_intel: {
        domain: 'techcorp.internal.io',
        registrar: 'Cloudflare, Inc.',
        registered_on: '2020-03-15',
        domain_age_days: 2362,
        mx_valid: true,
        name_servers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
        punycode_detected: false
      }
    },
    correlation: {
      threat_intel_matches: [],
      linked_cases: [],
      shared_indicator: 'None (Clean Internal Traffic)',
      attribution_type: 'actor_controlled',
      attribution_confidence: 'high'
    }
  },
  {
    detail: {
      case_id: 'f88a21e9-44bc-4672-91ef-771122334005',
      subject: 'Overdue Invoice #INV-2026-8911 - Final Payment Demand Notice',
      sender: 'billing@quickb00ks-invoicing.net',
      received_at: '2026-09-01T16:22:15Z',
      fraud_score: 91,
      risk_category: 'phishing',
      spf: 'fail',
      dkim: 'fail',
      dmarc: 'fail',
      file_hash: 'eeff00112233445566778899aabbccddeeff00112233445566778899aabbccdd',
      confidence: 'high',
      verdict_summary: 'Brand impersonation (Intuit QuickBooks) utilizing typosquat domain with fake invoice attachment containing malicious macro downloader.',
      score_breakdown: [
        {
          signal: 'Lookalike Typosquatting (quickb00ks)',
          weight: 30,
          contribution: 30,
          reason: 'Replaced letters "oo" with numbers "00" in brand domain name.',
          sourceModule: 'domain'
        },
        {
          signal: 'SPF/DKIM/DMARC Authentication Triple Failure',
          weight: 25,
          contribution: 25,
          reason: 'Host lacks authorization to transmit for Intuit QuickBooks systems.',
          sourceModule: 'header'
        },
        {
          signal: 'NLP: Aggressive collection threat & fraudulent invoice',
          weight: 20,
          contribution: 18,
          reason: 'Urgent collection threats with arbitrary late fees to force prompt payment.',
          sourceModule: 'nlp'
        },
        {
          signal: 'Origin Host flagged for active phishing distribution',
          weight: 25,
          contribution: 18,
          reason: 'IP 185.220.101.5 associated with active phishing campaign cluster camp-3391.',
          sourceModule: 'origin'
        }
      ]
    },
    headers: {
      spf: {
        result: 'fail',
        record: 'v=spf1 include:_spf.quickbooks.com -all',
        sender_ip: '185.220.101.5'
      },
      dkim: {
        result: 'fail',
        domain: 'quickb00ks-invoicing.net',
        selector: 'default',
        signature_present: false
      },
      dmarc: {
        result: 'fail',
        policy: 'reject',
        disposition: 'quarantine'
      },
      relay_chain: [
        {
          hop: 1,
          ip: '185.220.101.5',
          timestamp: '2026-09-01T16:21:30Z',
          server: 'node-fra-09.bulletproof-transit.net',
          spf_status: 'fail',
          delay_ms: 0,
          country: 'Germany'
        },
        {
          hop: 2,
          ip: '198.51.100.88',
          timestamp: '2026-09-01T16:22:15Z',
          server: 'mx-in.internal-gateway.corp',
          spf_status: 'pass',
          delay_ms: 45000,
          country: 'United States'
        }
      ],
      anomalies: [
        'Homoglyph domain: quickb00ks-invoicing.net imitating Intuit QuickBooks',
        'No valid DKIM signature present'
      ]
    },
    content: {
      classification: 'phishing',
      classification_confidence: 0.93,
      sentiment_urgency_score: 95,
      impersonation_target: 'Intuit QuickBooks Billing Services',
      flagged_phrases: [
        'final notice before legal collection',
        'pay overdue balance of $4,890.00',
        'download attached invoice statement immediately'
      ],
      bec_indicators: ['fake invoice attachment', 'overdue payment threat'],
      urls: [
        {
          original: 'http://bit.ly/inv-quickbooks-pay',
          resolved: 'https://secure-pay.quickb00ks-invoicing.net/checkout/invoice_8911.php',
          flagged: true,
          reason: 'Phishing payment collection page',
          reputation_score: 91
        }
      ]
    },
    origin: {
      originating_ip: '185.220.101.5',
      geolocation: {
        country: 'Germany',
        region: 'Hesse',
        city: 'Frankfurt am Main',
        latitude: 50.1109,
        longitude: 8.6821,
        precision_confidence: 'country: high, city: medium'
      },
      isp: 'Bulletproof Hosting Infrastructure',
      vpn_tor_flag: true,
      flag_source: 'AbuseIPDB (Score 88)',
      domain_intel: {
        domain: 'quickb00ks-invoicing.net',
        registrar: 'NameCheap, Inc.',
        registered_on: '2026-08-28',
        domain_age_days: 5,
        mx_valid: false,
        name_servers: ['ns1.anonymous-dns.io', 'ns2.anonymous-dns.io'],
        punycode_detected: false
      }
    },
    correlation: {
      threat_intel_matches: [
        {
          indicator: '185.220.101.5',
          source: 'AbuseIPDB',
          abuse_score: 88,
          last_reported: '2026-09-02T08:30:00Z'
        }
      ],
      campaign_id: 'camp-3391',
      linked_cases: [
        'c8f2a1e4-39fa-4c78-b6e8-289d18e47001',
        'f88a21e9-44bc-4672-91ef-771122334005'
      ],
      shared_indicator: 'Shared Originating IP 185.220.101.5 & NameCheap registrar cluster',
      attribution_type: 'anonymized_infrastructure',
      attribution_confidence: 'high'
    }
  },
  {
    detail: {
      case_id: 'b99e7711-22aa-45cd-8899-334455667006',
      subject: 'Security Alert: Password expiration notice and MFA re-validation',
      sender: 'admin@okta-support-sso.cc',
      received_at: '2026-09-01T11:05:40Z',
      fraud_score: 84,
      risk_category: 'phishing',
      spf: 'fail',
      dkim: 'fail',
      dmarc: 'fail',
      file_hash: '99887766554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa',
      confidence: 'high',
      verdict_summary: 'Okta SSO credential harvester — domain registered on high-risk .cc TLD, reverse DNS failure, DMARC rejection.',
      score_breakdown: [
        {
          signal: 'Impersonation of Okta Identity Cloud',
          weight: 30,
          contribution: 28,
          reason: 'Unregistered third-party domain mimicking Single Sign-On vendor.',
          sourceModule: 'domain'
        },
        {
          signal: 'DMARC & SPF Verification Failure',
          weight: 25,
          contribution: 25,
          reason: 'No authorization from okta.com authentication infrastructure.',
          sourceModule: 'header'
        },
        {
          signal: 'NLP: Password Expiration Threat Pattern',
          weight: 25,
          contribution: 20,
          reason: 'Falsely claims corporate password expires in 2 hours.',
          sourceModule: 'nlp'
        },
        {
          signal: 'Hosting on High-Risk Anonymous VPS',
          weight: 20,
          contribution: 11,
          reason: 'Origin IP located in Seychelles offshore hosting facility.',
          sourceModule: 'origin'
        }
      ]
    },
    headers: {
      spf: {
        result: 'fail',
        record: 'v=spf1 -all',
        sender_ip: '194.26.29.112'
      },
      dkim: {
        result: 'fail',
        domain: 'okta-support-sso.cc',
        selector: 'mail',
        signature_present: false
      },
      dmarc: {
        result: 'fail',
        policy: 'reject',
        disposition: 'quarantine'
      },
      relay_chain: [
        {
          hop: 1,
          ip: '194.26.29.112',
          timestamp: '2026-09-01T11:04:50Z',
          server: 'mta01.seychelles-cloud.io',
          spf_status: 'fail',
          delay_ms: 0,
          country: 'Seychelles'
        },
        {
          hop: 2,
          ip: '198.51.100.88',
          timestamp: '2026-09-01T11:05:40Z',
          server: 'mx-in.internal-gateway.corp',
          spf_status: 'pass',
          delay_ms: 50000,
          country: 'United States'
        }
      ],
      anomalies: [
        'Invalid MX record on domain okta-support-sso.cc',
        'From header domain differs from SMTP handshake HELO'
      ]
    },
    content: {
      classification: 'phishing',
      classification_confidence: 0.89,
      sentiment_urgency_score: 87,
      impersonation_target: 'Okta Single Sign-On Support',
      flagged_phrases: [
        'password will expire in 2 hours',
        'retain your existing credentials',
        'verify MFA token immediately'
      ],
      bec_indicators: [],
      urls: [
        {
          original: 'https://okta-support-sso.cc/login',
          resolved: 'https://okta-support-sso.cc/login/mfa-intercept.php',
          flagged: true,
          reason: 'Reverse-proxy phishing kit capturing session cookies and TOTP tokens',
          reputation_score: 93
        }
      ]
    },
    origin: {
      originating_ip: '194.26.29.112',
      geolocation: {
        country: 'Seychelles',
        region: 'Victoria',
        city: 'Victoria',
        latitude: -4.6191,
        longitude: 55.4513,
        precision_confidence: 'country: high, city: low'
      },
      isp: 'Offshore Hosting Gateway AS58061',
      vpn_tor_flag: true,
      flag_source: 'AbuseIPDB (Score 72)',
      domain_intel: {
        domain: 'okta-support-sso.cc',
        registrar: 'Nicenic International Group',
        registered_on: '2026-08-29',
        domain_age_days: 4,
        mx_valid: false,
        name_servers: ['ns1.offshoredns.cc', 'ns2.offshoredns.cc'],
        punycode_detected: false
      }
    },
    correlation: {
      threat_intel_matches: [
        {
          indicator: '194.26.29.112',
          source: 'AbuseIPDB',
          abuse_score: 72,
          last_reported: '2026-09-01T04:20:00Z'
        }
      ],
      campaign_id: 'camp-6112',
      linked_cases: [
        'b99e7711-22aa-45cd-8899-334455667006'
      ],
      shared_indicator: 'Reverse-proxy MFA phishing kit targeting Okta authentication',
      attribution_type: 'anonymized_infrastructure',
      attribution_confidence: 'high'
    }
  },
  {
    detail: {
      case_id: '77aa1122-33bb-44cc-55dd-66ee77ff8007',
      subject: 'Your Monthly Amazon Web Services Invoice Statement is Available',
      sender: 'no-reply-aws@amazon.com',
      received_at: '2026-09-01T06:12:00Z',
      fraud_score: 6,
      risk_category: 'legitimate',
      spf: 'pass',
      dkim: 'pass',
      dmarc: 'pass',
      file_hash: '556677889900aabbccddeeff0011223344556677889900aabbccddeeff001122',
      confidence: 'high',
      verdict_summary: 'Verified legitimate communication from Amazon Web Services — SPF, DKIM, and DMARC passing with zero threat indicators.',
      score_breakdown: [
        {
          signal: 'SPF/DKIM/DMARC Strict Alignment',
          weight: 40,
          contribution: 0,
          reason: 'Valid cryptographic signature from amazon.com mail servers.',
          sourceModule: 'header'
        },
        {
          signal: 'Established Enterprise Infrastructure',
          weight: 30,
          contribution: 0,
          reason: 'Domain registered in 1994, reputable AWS SES mail cluster.',
          sourceModule: 'domain'
        },
        {
          signal: 'NLP: Routine Transactional Notification',
          weight: 30,
          contribution: 6,
          reason: 'No urgent pressure cues or credential-harvesting mechanisms.',
          sourceModule: 'nlp'
        }
      ]
    },
    headers: {
      spf: {
        result: 'pass',
        record: 'v=spf1 include:amazon.com ~all',
        sender_ip: '54.240.27.15'
      },
      dkim: {
        result: 'pass',
        domain: 'amazon.com',
        selector: 'amazon2023',
        signature_present: true
      },
      dmarc: {
        result: 'pass',
        policy: 'reject',
        disposition: 'none'
      },
      relay_chain: [
        {
          hop: 1,
          ip: '54.240.27.15',
          timestamp: '2026-09-01T06:11:40Z',
          server: 'a27-15.smtp-out.amazonses.com',
          spf_status: 'pass',
          delay_ms: 0,
          country: 'United States'
        },
        {
          hop: 2,
          ip: '198.51.100.88',
          timestamp: '2026-09-01T06:12:00Z',
          server: 'mx-in.internal-gateway.corp',
          spf_status: 'pass',
          delay_ms: 20000,
          country: 'United States'
        }
      ],
      anomalies: []
    },
    content: {
      classification: 'legitimate',
      classification_confidence: 0.98,
      sentiment_urgency_score: 5,
      impersonation_target: 'None (Verified Brand)',
      flagged_phrases: [],
      bec_indicators: [],
      urls: [
        {
          original: 'https://console.aws.amazon.com/billing/home',
          resolved: 'https://console.aws.amazon.com/billing/home',
          flagged: false,
          reason: 'Official verified AWS billing console',
          reputation_score: 0
        }
      ]
    },
    origin: {
      originating_ip: '54.240.27.15',
      geolocation: {
        country: 'United States',
        region: 'Virginia',
        city: 'Ashburn',
        latitude: 39.0438,
        longitude: -77.4874,
        precision_confidence: 'country: high, city: high'
      },
      isp: 'Amazon.com, Inc. (AWS SES)',
      vpn_tor_flag: false,
      flag_source: 'Clean (AbuseIPDB 0%)',
      domain_intel: {
        domain: 'amazon.com',
        registrar: 'MarkMonitor Inc.',
        registered_on: '1994-11-01',
        domain_age_days: 11629,
        mx_valid: true,
        name_servers: ['ns1.p31.dynect.net', 'ns2.p31.dynect.net'],
        punycode_detected: false
      }
    },
    correlation: {
      threat_intel_matches: [],
      linked_cases: [],
      shared_indicator: 'None (Clean Production Infrastructure)',
      attribution_type: 'actor_controlled',
      attribution_confidence: 'high'
    }
  },
  {
    detail: {
      case_id: '66bb2233-44cc-55dd-66ee-77ff88aa9008',
      subject: 'Document Shared via Adobe Cloud: "Q3_Executive_Compensation_Plan.pdf"',
      sender: 'notifications@adobe-cloud-sign.xyz',
      received_at: '2026-08-31T14:10:00Z',
      fraud_score: 86,
      risk_category: 'phishing',
      spf: 'fail',
      dkim: 'fail',
      dmarc: 'fail',
      file_hash: 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
      confidence: 'high',
      verdict_summary: 'Document sharing lure with disguised credential harvester hosted on disposable .xyz top-level domain.',
      score_breakdown: [
        {
          signal: 'Spoofed Adobe Document Cloud Brand',
          weight: 30,
          contribution: 28,
          reason: 'Domain adobe-cloud-sign.xyz is an unauthorized third-party lookalike.',
          sourceModule: 'domain'
        },
        {
          signal: 'SPF & DKIM Authentication Mismatch',
          weight: 25,
          contribution: 25,
          reason: 'Sender IP fails SPF mechanism and lacks valid Adobe signature.',
          sourceModule: 'header'
        },
        {
          signal: 'NLP: High-curiosity executive lure',
          weight: 25,
          contribution: 20,
          reason: 'Leverages sensitive executive compensation title to entice document click-through.',
          sourceModule: 'nlp'
        },
        {
          signal: 'Domain Age < 5 days',
          weight: 20,
          contribution: 13,
          reason: 'Registered on 2026-08-27.',
          sourceModule: 'domain'
        }
      ]
    },
    headers: {
      spf: {
        result: 'fail',
        record: 'v=spf1 -all',
        sender_ip: '185.220.101.5'
      },
      dkim: {
        result: 'fail',
        domain: 'adobe-cloud-sign.xyz',
        selector: 's1',
        signature_present: false
      },
      dmarc: {
        result: 'fail',
        policy: 'none'
      },
      relay_chain: [
        {
          hop: 1,
          ip: '185.220.101.5',
          timestamp: '2026-08-31T14:09:10Z',
          server: 'node-fra-09.bulletproof-transit.net',
          spf_status: 'fail',
          delay_ms: 0,
          country: 'Germany'
        },
        {
          hop: 2,
          ip: '198.51.100.88',
          timestamp: '2026-08-31T14:10:00Z',
          server: 'mx-in.internal-gateway.corp',
          spf_status: 'pass',
          delay_ms: 50000,
          country: 'United States'
        }
      ],
      anomalies: [
        'Domain registered on high-abuse .xyz registry',
        'Return-Path points to generic catch-all mailbox'
      ]
    },
    content: {
      classification: 'phishing',
      classification_confidence: 0.91,
      sentiment_urgency_score: 82,
      impersonation_target: 'Adobe Acrobat Document Cloud',
      flagged_phrases: [
        'secure document ready for review',
        'sign in with your organizational credentials to unlock',
        'document will expire in 48 hours'
      ],
      bec_indicators: [],
      urls: [
        {
          original: 'http://tinyurl.com/adobe-sign-doc99',
          resolved: 'https://adobe-cloud-sign.xyz/view/doc.php?id=992',
          flagged: true,
          reason: 'Credential harvester mimicking Adobe login dialog',
          reputation_score: 89
        }
      ]
    },
    origin: {
      originating_ip: '185.220.101.5',
      geolocation: {
        country: 'Germany',
        region: 'Hesse',
        city: 'Frankfurt am Main',
        latitude: 50.1109,
        longitude: 8.6821,
        precision_confidence: 'country: high, city: medium'
      },
      isp: 'Bulletproof Hosting Infrastructure',
      vpn_tor_flag: true,
      flag_source: 'AbuseIPDB (Score 88)',
      domain_intel: {
        domain: 'adobe-cloud-sign.xyz',
        registrar: 'NameCheap, Inc.',
        registered_on: '2026-08-27',
        domain_age_days: 6,
        mx_valid: false,
        name_servers: ['ns1.anonymous-dns.io', 'ns2.anonymous-dns.io'],
        punycode_detected: false
      }
    },
    correlation: {
      threat_intel_matches: [
        {
          indicator: '185.220.101.5',
          source: 'AbuseIPDB',
          abuse_score: 88,
          last_reported: '2026-09-02T08:30:00Z'
        }
      ],
      campaign_id: 'camp-3391',
      linked_cases: [
        'c8f2a1e4-39fa-4c78-b6e8-289d18e47001',
        'f88a21e9-44bc-4672-91ef-771122334005',
        '66bb2233-44cc-55dd-66ee-77ff88aa9008'
      ],
      shared_indicator: 'Shared Bulletproof IP 185.220.101.5 + NameCheap credential lure cluster',
      attribution_type: 'anonymized_infrastructure',
      attribution_confidence: 'high'
    }
  }
];
