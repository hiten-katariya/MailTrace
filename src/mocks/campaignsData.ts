import { CampaignDetail } from '../types/campaign';

export const MOCK_CAMPAIGNS: CampaignDetail[] = [
  {
    campaign_id: 'camp-3391',
    name: 'PhantomRelay Credential Phish Cluster',
    case_count: 3,
    shared_indicator: 'IP 185.220.101.5 (AS9009 Tor Exit/Bulletproof)',
    indicator_type: 'ip_address',
    first_seen: '2026-08-31T14:09:10Z',
    last_seen: '2026-09-02T10:14:22Z',
    primary_risk_category: 'phishing',
    average_fraud_score: 90.3,
    description: 'A coordinated credential phishing operation targeting enterprise identity portals (Microsoft 365, QuickBooks, Adobe Cloud) utilizing freshly registered typosquat domains through NameCheap privacy proxies routed through Frankfurt bulletproof transit nodes.',
    linked_case_ids: [
      'c8f2a1e4-39fa-4c78-b6e8-289d18e47001',
      'f88a21e9-44bc-4672-91ef-771122334005',
      '66bb2233-44cc-55dd-66ee-77ff88aa9008'
    ],
    infrastructure_nodes: [
      { type: 'ip', value: '185.220.101.5', first_observed: '2026-08-31' },
      { type: 'domain', value: 'microsoft-security-auth.net', first_observed: '2026-08-31' },
      { type: 'domain', value: 'quickb00ks-invoicing.net', first_observed: '2026-08-28' },
      { type: 'domain', value: 'adobe-cloud-sign.xyz', first_observed: '2026-08-27' },
      { type: 'mailserver', value: 'node-fra-09.bulletproof-transit.net', first_observed: '2026-08-31' },
      { type: 'payload_url', value: 'https://login.microsoft-security-auth.net/auth', first_observed: '2026-09-02' }
    ],
    timeline_events: [
      {
        timestamp: '2026-08-31T14:10:00Z',
        case_id: '66bb2233-44cc-55dd-66ee-77ff88aa9008',
        subject: 'Document Shared via Adobe Cloud: "Q3_Executive_Compensation_Plan.pdf"',
        target_recipient: 'finance-director@target-corp.com'
      },
      {
        timestamp: '2026-09-01T16:22:15Z',
        case_id: 'f88a21e9-44bc-4672-91ef-771122334005',
        subject: 'Overdue Invoice #INV-2026-8911 - Final Payment Demand Notice',
        target_recipient: 'ap-billing@target-corp.com'
      },
      {
        timestamp: '2026-09-02T10:14:22Z',
        case_id: 'c8f2a1e4-39fa-4c78-b6e8-289d18e47001',
        subject: 'Urgent: Immediate suspension notice for your corporate account',
        target_recipient: 'secops-team@target-corp.com'
      }
    ]
  },
  {
    campaign_id: 'camp-4022',
    name: 'ApexWire Executive Impersonation (M&A Pretext)',
    case_count: 1,
    shared_indicator: 'Hostinger VPS 45.142.214.190 + ProtonMail Reply-To',
    indicator_type: 'phishing_kit',
    first_seen: '2026-09-02T09:29:40Z',
    last_seen: '2026-09-02T09:30:11Z',
    primary_risk_category: 'bec',
    average_fraud_score: 88.0,
    description: 'Targeted spear-phishing / Business Email Compromise operation spoofing C-suite executive display names to divert wire transfers under the guise of strictly confidential acquisition settlements.',
    linked_case_ids: [
      'd71b9f02-88ef-41ae-9a02-5c941a8e1002'
    ],
    infrastructure_nodes: [
      { type: 'ip', value: '45.142.214.190', first_observed: '2026-09-02' },
      { type: 'domain', value: 'company-exec-mail.com', first_observed: '2026-08-25' },
      { type: 'mailserver', value: 'vps-nl-44.hostinger-nodes.net', first_observed: '2026-09-02' }
    ],
    timeline_events: [
      {
        timestamp: '2026-09-02T09:30:11Z',
        case_id: 'd71b9f02-88ef-41ae-9a02-5c941a8e1002',
        subject: 'CONFIDENTIAL: Urgent revision on vendor settlement for Q3 acquisition',
        target_recipient: 'treasury-ops@target-corp.com'
      }
    ]
  },
  {
    campaign_id: 'camp-6112',
    name: 'OktaProxy MFA Reverse Intercept Campaign',
    case_count: 1,
    shared_indicator: 'Offshore Seychelles VPS 194.26.29.112 (.cc TLD)',
    indicator_type: 'domain_family',
    first_seen: '2026-09-01T11:04:50Z',
    last_seen: '2026-09-01T11:05:40Z',
    primary_risk_category: 'phishing',
    average_fraud_score: 84.0,
    description: 'Adversary-in-the-Middle (AiTM) reverse proxy infrastructure deploying customized Evilginx2 instances to capture real-time session tokens and bypass hardware MFA challenges.',
    linked_case_ids: [
      'b99e7711-22aa-45cd-8899-334455667006'
    ],
    infrastructure_nodes: [
      { type: 'ip', value: '194.26.29.112', first_observed: '2026-09-01' },
      { type: 'domain', value: 'okta-support-sso.cc', first_observed: '2026-08-29' }
    ],
    timeline_events: [
      {
        timestamp: '2026-09-01T11:05:40Z',
        case_id: 'b99e7711-22aa-45cd-8899-334455667006',
        subject: 'Security Alert: Password expiration notice and MFA re-validation',
        target_recipient: 'it-support@target-corp.com'
      }
    ]
  }
];
