import { RiskCategory } from './case';

export interface CampaignSummary {
  campaign_id: string;
  name?: string;
  case_count: number;
  shared_indicator: string;
  indicator_type?: 'ip_address' | 'domain_family' | 'phishing_kit' | 'subject_pattern';
  first_seen: string;
  last_seen: string;
  primary_risk_category?: RiskCategory;
  average_fraud_score?: number;
}

export interface CampaignDetail extends CampaignSummary {
  description: string;
  linked_case_ids: string[];
  infrastructure_nodes: {
    type: 'domain' | 'ip' | 'mailserver' | 'payload_url';
    value: string;
    first_observed: string;
  }[];
  timeline_events: {
    timestamp: string;
    case_id: string;
    subject: string;
    target_recipient: string;
  }[];
}
