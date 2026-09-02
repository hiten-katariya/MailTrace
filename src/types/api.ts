import { CaseSummary, RiskCategory } from './case';

export interface CasesResponse {
  total: number;
  page: number;
  limit: number;
  cases: CaseSummary[];
}

export interface CasesQueryParams {
  page?: number;
  limit?: number;
  min_score?: number;
  risk_category?: RiskCategory | 'all';
  sort_by?: 'score' | 'date' | 'sender';
  sort_order?: 'asc' | 'desc';
  search?: string;
  spf?: string;
  dkim?: string;
  dmarc?: string;
}

export interface IngestResponse {
  case_id: string;
  status: 'processing' | 'completed' | 'failed';
  submitted_at: string;
  file_hash: string;
  filename?: string;
}

export interface PipelineProgressState {
  header_analysis: 'pending' | 'in_progress' | 'done' | 'failed';
  nlp_analysis: 'pending' | 'in_progress' | 'done' | 'failed';
  geolocation: 'pending' | 'in_progress' | 'done' | 'failed';
  domain_intel: 'pending' | 'in_progress' | 'done' | 'failed';
  scoring: 'pending' | 'in_progress' | 'done' | 'failed';
}

export interface CaseStatusResponse {
  case_id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: PipelineProgressState;
}

export interface AlertItem {
  alert_id: string;
  case_id: string;
  fraud_score: number;
  risk_category: RiskCategory;
  subject: string;
  sender: string;
  triggered_at: string;
}

export interface RetentionSettings {
  retention_days: number;
  auto_purge: boolean;
  mask_pii: boolean;
  export_compliance_level: 'standard' | 'restricted' | 'law_enforcement';
}

export interface AuditLogEntry {
  id: string | number;
  timestamp: string;
  user: string;
  action: string;
  case_id?: string;
  details: string;
}

export interface ScoreBracket {
  range: string;
  count: number;
  color: string;
}

export interface RiskCategoryCount {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DetectionTrendDay {
  date: string;
  phishing: number;
  bec: number;
  suspicious: number;
  legitimate: number;
}

export interface CasesStatsResponse {
  total_cases: number;
  high_risk_cases: number;
  suspicious_cases: number;
  legitimate_cases: number;
  average_score: number;
  by_risk_category: RiskCategoryCount[];
  score_brackets: ScoreBracket[];
  detection_trends: DetectionTrendDay[];
}
