import {
  CasesResponse,
  CasesQueryParams,
  IngestResponse,
  CaseStatusResponse,
  AlertItem,
  RetentionSettings,
  AuditLogEntry,
} from '../types/api';
import {
  CaseDetail,
  CaseHeaders,
  CaseContent,
  CaseOrigin,
  CaseCorrelation,
} from '../types/case';
import { CampaignSummary, CampaignDetail } from '../types/campaign';
import { LoginResponse } from '../types/auth';
import { MOCK_CASES, FullCaseRecord } from './casesData';
import { MOCK_CAMPAIGNS } from './campaignsData';
import { MOCK_AUDIT_LOGS, INITIAL_RETENTION_SETTINGS } from './auditData';

// Mutable in-memory store for interactive session changes
let casesStore: FullCaseRecord[] = [...MOCK_CASES];
let retentionStore: RetentionSettings = { ...INITIAL_RETENTION_SETTINGS };
let auditStore: AuditLogEntry[] = [...MOCK_AUDIT_LOGS];

// Helper to simulate realistic async network latency (100 - 250ms)
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * POST /auth/login
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  await delay(200);
  if (!username || !password) {
    throw new Error('Username and password are required');
  }
  return {
    access_token: `mock_jwt_token_${username}_${Date.now()}`,
    token_type: 'bearer',
    expires_in: 3600,
  };
}

/**
 * GET /cases
 * List cases with filtering, pagination, and sorting
 */
export async function getCases(params: CasesQueryParams = {}): Promise<CasesResponse> {
  await delay(180);

  let filtered = casesStore.map((c) => c.detail);

  // Search filter
  if (params.search && params.search.trim() !== '') {
    const query = params.search.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.subject.toLowerCase().includes(query) ||
        c.sender.toLowerCase().includes(query) ||
        c.case_id.toLowerCase().includes(query)
    );
  }

  // Risk category filter
  if (params.risk_category && params.risk_category !== 'all') {
    filtered = filtered.filter((c) => c.risk_category === params.risk_category);
  }

  // Minimum score filter
  if (params.min_score !== undefined && params.min_score > 0) {
    filtered = filtered.filter((c) => c.fraud_score >= params.min_score!);
  }

  // SPF filter
  if (params.spf && params.spf !== 'all') {
    filtered = filtered.filter((c) => c.spf === params.spf);
  }

  // DKIM filter
  if (params.dkim && params.dkim !== 'all') {
    filtered = filtered.filter((c) => c.dkim === params.dkim);
  }

  // DMARC filter
  if (params.dmarc && params.dmarc !== 'all') {
    filtered = filtered.filter((c) => c.dmarc === params.dmarc);
  }

  // Sorting
  const sortBy = params.sort_by || 'date';
  const sortOrder = params.sort_order || 'desc';

  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'score') {
      comparison = a.fraud_score - b.fraud_score;
    } else if (sortBy === 'sender') {
      comparison = a.sender.localeCompare(b.sender);
    } else {
      // date
      comparison = new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const page = params.page || 1;
  const limit = params.limit || 25;
  const startIndex = (page - 1) * limit;
  const paginatedCases = filtered.slice(startIndex, startIndex + limit);

  return {
    total: filtered.length,
    page,
    limit,
    cases: paginatedCases,
  };
}

/**
 * GET /cases/{case_id}
 */
export async function getCaseById(caseId: string): Promise<CaseDetail> {
  await delay(120);
  const found = casesStore.find((c) => c.detail.case_id === caseId);
  if (!found) {
    throw new Error(`Case with ID ${caseId} not found`);
  }
  return found.detail;
}

/**
 * GET /cases/{case_id}/headers
 */
export async function getCaseHeaders(caseId: string): Promise<CaseHeaders> {
  await delay(120);
  const found = casesStore.find((c) => c.detail.case_id === caseId);
  if (!found) {
    throw new Error(`Case headers for ID ${caseId} not found`);
  }
  return found.headers;
}

/**
 * GET /cases/{case_id}/content
 */
export async function getCaseContent(caseId: string): Promise<CaseContent> {
  await delay(120);
  const found = casesStore.find((c) => c.detail.case_id === caseId);
  if (!found) {
    throw new Error(`Case content for ID ${caseId} not found`);
  }
  return found.content;
}

/**
 * GET /cases/{case_id}/origin
 */
export async function getCaseOrigin(caseId: string): Promise<CaseOrigin> {
  await delay(120);
  const found = casesStore.find((c) => c.detail.case_id === caseId);
  if (!found) {
    throw new Error(`Case origin for ID ${caseId} not found`);
  }
  return found.origin;
}

/**
 * GET /cases/{case_id}/correlation
 */
export async function getCaseCorrelation(caseId: string): Promise<CaseCorrelation> {
  await delay(120);
  const found = casesStore.find((c) => c.detail.case_id === caseId);
  if (!found) {
    throw new Error(`Case correlation for ID ${caseId} not found`);
  }
  return found.correlation;
}

/**
 * GET /campaigns
 */
export async function getCampaigns(): Promise<{ campaigns: CampaignSummary[] }> {
  await delay(150);
  const list: CampaignSummary[] = MOCK_CAMPAIGNS.map((camp) => ({
    campaign_id: camp.campaign_id,
    name: camp.name,
    case_count: camp.case_count,
    shared_indicator: camp.shared_indicator,
    indicator_type: camp.indicator_type,
    first_seen: camp.first_seen,
    last_seen: camp.last_seen,
    primary_risk_category: camp.primary_risk_category,
    average_fraud_score: camp.average_fraud_score,
  }));
  return { campaigns: list };
}

/**
 * GET /campaigns/{campaign_id}
 */
export async function getCampaignById(campaignId: string): Promise<CampaignDetail> {
  await delay(120);
  const found = MOCK_CAMPAIGNS.find((c) => c.campaign_id === campaignId);
  if (!found) {
    throw new Error(`Campaign with ID ${campaignId} not found`);
  }
  return found;
}

/**
 * POST /cases/upload
 * Simulates parsing and ingestion of an email file or sample
 */
export async function uploadCase(fileInfo: {
  name: string;
  size?: number;
  sampleType?: 'phishing' | 'bec' | 'spoof' | 'clean';
}): Promise<IngestResponse> {
  await delay(300);

  const sampleType = fileInfo.sampleType || 'phishing';
  let matchedTemplate = MOCK_CASES[0];

  if (sampleType === 'bec') matchedTemplate = MOCK_CASES[1];
  else if (sampleType === 'spoof') matchedTemplate = MOCK_CASES[2];
  else if (sampleType === 'clean') matchedTemplate = MOCK_CASES[3];

  const newId = `c${Math.random().toString(16).substring(2, 10)}-${Date.now().toString(16).substring(4)}`;
  const nowIso = new Date().toISOString();
  const rawHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  const newRecord: FullCaseRecord = {
    detail: {
      ...matchedTemplate.detail,
      case_id: newId,
      subject: fileInfo.name.replace('.eml', '') || matchedTemplate.detail.subject,
      received_at: nowIso,
      file_hash: rawHash,
    },
    headers: { ...matchedTemplate.headers },
    content: { ...matchedTemplate.content },
    origin: { ...matchedTemplate.origin },
    correlation: { ...matchedTemplate.correlation },
  };

  // Add to top of cases store
  casesStore = [newRecord, ...casesStore];

  // Log in audit trail
  auditStore.unshift({
    id: `log-${Date.now()}`,
    timestamp: nowIso,
    user: 'current_analyst',
    action: 'upload',
    case_id: newId,
    details: `Ingested .eml file '${fileInfo.name}' (SHA-256: ${rawHash.substring(0, 16)}...)`,
  });

  return {
    case_id: newId,
    status: 'processing',
    submitted_at: nowIso,
    file_hash: rawHash,
    filename: fileInfo.name,
  };
}

/**
 * GET /cases/{case_id}/status
 */
export async function getCaseStatus(caseId: string): Promise<CaseStatusResponse> {
  await delay(100);
  return {
    case_id: caseId,
    status: 'completed',
    progress: {
      header_analysis: 'done',
      nlp_analysis: 'done',
      geolocation: 'done',
      domain_intel: 'done',
      scoring: 'done',
    },
  };
}

/**
 * GET /alerts
 */
export async function getAlerts(): Promise<{ alerts: AlertItem[] }> {
  await delay(120);
  const highRiskCases = casesStore.filter((c) => c.detail.fraud_score >= 80);
  const alerts: AlertItem[] = highRiskCases.map((c, i) => ({
    alert_id: `alert-${i + 1}`,
    case_id: c.detail.case_id,
    fraud_score: c.detail.fraud_score,
    risk_category: c.detail.risk_category,
    subject: c.detail.subject,
    sender: c.detail.sender,
    triggered_at: c.detail.received_at,
  }));
  return { alerts };
}

/**
 * GET /settings/retention
 */
export async function getRetentionSettings(): Promise<RetentionSettings> {
  await delay(100);
  return { ...retentionStore };
}

/**
 * PUT /settings/retention
 */
export async function updateRetentionSettings(settings: Partial<RetentionSettings>): Promise<RetentionSettings> {
  await delay(150);
  retentionStore = { ...retentionStore, ...settings };
  auditStore.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: 'current_analyst',
    action: 'change_retention',
    details: `Updated retention policy: ${retentionStore.retention_days} days, Mask PII: ${retentionStore.mask_pii}`,
  });
  return { ...retentionStore };
}

/**
 * GET /audit-log
 */
export async function getAuditLogs(caseId?: string): Promise<{ logs: AuditLogEntry[] }> {
  await delay(120);
  if (caseId) {
    return { logs: auditStore.filter((l) => l.case_id === caseId) };
  }
  return { logs: auditStore };
}
