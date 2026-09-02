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
  id: string;
  timestamp: string;
  user: string;
  action: 'view' | 'export_report' | 'annotate' | 'upload' | 'change_retention';
  case_id?: string;
  details: string;
}
