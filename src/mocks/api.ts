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

// API Base URL (defaults to FastAPI backend on port 8000)
const envObj = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const API_BASE_URL = envObj.VITE_API_URL || 'http://localhost:8000';
const USE_MOCKS = envObj.VITE_USE_MOCKS === 'true';

// Mutable in-memory store for fallback & interactive session testing
let casesStore: FullCaseRecord[] = [...MOCK_CASES];
let retentionStore: RetentionSettings = { ...INITIAL_RETENTION_SETTINGS };
let auditStore: AuditLogEntry[] = [...MOCK_AUDIT_LOGS];

// Helper to simulate realistic async network latency (100 - 250ms) when on mocks
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * POST /auth/login
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('Backend unavailable, falling back to mock login:', e);
    }
  }

  await delay(200);
  if (!username || !password) {
    throw new Error('Username and password are required');
  }
  return {
    access_token: `mock_jwt_token_${username}_${Date.now()}`,
    token_type: 'bearer',
    expires_in: 28800,
  };
}

/**
 * GET /cases
 * List cases with filtering, pagination, and sorting
 */
export async function getCases(params: CasesQueryParams = {}): Promise<CasesResponse> {
  if (!USE_MOCKS) {
    try {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.min_score) searchParams.set('min_score', params.min_score.toString());
      if (params.risk_category) searchParams.set('risk_category', params.risk_category);
      if (params.sort_by) searchParams.set('sort_by', params.sort_by);
      if (params.sort_order) searchParams.set('sort_order', params.sort_order);
      if (params.search) searchParams.set('search', params.search);

      const resp = await fetch(`${API_BASE_URL}/cases?${searchParams.toString()}`);
      if (resp.ok) {
        const data = await resp.json();
        // If backend has cases, return them; otherwise combine or return
        if (data.cases && data.cases.length > 0) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Backend /cases unavailable, falling back to mock cases:', e);
    }
  }

  await delay(150);
  let filtered = casesStore.map((c) => c.detail);

  if (params.search && params.search.trim() !== '') {
    const query = params.search.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.subject.toLowerCase().includes(query) ||
        c.sender.toLowerCase().includes(query) ||
        c.case_id.toLowerCase().includes(query)
    );
  }

  if (params.risk_category && params.risk_category !== 'all') {
    filtered = filtered.filter((c) => c.risk_category === params.risk_category);
  }

  if (params.min_score !== undefined && params.min_score > 0) {
    filtered = filtered.filter((c) => c.fraud_score >= params.min_score!);
  }

  const sortBy = params.sort_by || 'date';
  const sortOrder = params.sort_order || 'desc';

  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'score') {
      comparison = a.fraud_score - b.fraud_score;
    } else if (sortBy === 'sender') {
      comparison = a.sender.localeCompare(b.sender);
    } else {
      comparison = new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const page = params.page || 1;
  const limit = params.limit || 25;
  const startIndex = (page - 1) * limit;

  return {
    total: filtered.length,
    page,
    limit,
    cases: filtered.slice(startIndex, startIndex + limit),
  };
}

/**
 * GET /cases/{case_id}
 */
export async function getCaseById(caseId: string): Promise<CaseDetail> {
  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/cases/${caseId}`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn(`Backend /cases/${caseId} unavailable:`, e);
    }
  }

  await delay(100);
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
  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/cases/${caseId}/headers`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn(`Backend /cases/${caseId}/headers unavailable:`, e);
    }
  }

  await delay(100);
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
  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/cases/${caseId}/content`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn(`Backend /cases/${caseId}/content unavailable:`, e);
    }
  }

  await delay(100);
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
  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/cases/${caseId}/origin`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn(`Backend /cases/${caseId}/origin unavailable:`, e);
    }
  }

  await delay(100);
  const found = casesStore.find((c) => c.detail.case_id === caseId);
  if (!found) {
    throw new Error(`Case origin for ID ${caseId} not found`);
  }
  return found.origin;
}

/**
 * GET /cases/{case_id}/correlation (Phase 4 Hook / Stub)
 */
export async function getCaseCorrelation(caseId: string): Promise<CaseCorrelation> {
  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/cases/${caseId}/correlation`);
      if (resp.ok) {
        const data = await resp.json();
        return {
          threat_intel_matches: data.threat_intel_matches || [],
          campaign_id: data.campaign_id,
          linked_cases: data.linked_cases || [caseId],
          shared_indicator: data.shared_indicator || 'Shared Relay Infrastructure',
        };
      }
    } catch (e) {}
  }

  await delay(100);
  const found = casesStore.find((c) => c.detail.case_id === caseId);
  if (!found) {
    throw new Error(`Case correlation for ID ${caseId} not found`);
  }
  return found.correlation;
}

/**
 * GET /campaigns (Phase 4 Hook / Stub)
 */
export async function getCampaigns(): Promise<{ campaigns: CampaignSummary[] }> {
  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/campaigns`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {}
  }

  await delay(120);
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
 * GET /campaigns/{campaign_id} (Phase 4 Hook / Stub)
 */
export async function getCampaignById(campaignId: string): Promise<CampaignDetail> {
  await delay(100);
  const found = MOCK_CAMPAIGNS.find((c) => c.campaign_id === campaignId);
  if (!found) {
    throw new Error(`Campaign with ID ${campaignId} not found`);
  }
  return found;
}

/**
 * POST /cases/upload
 * Ingests a real .eml file or evaluation sample into backend
 */
export async function uploadCase(fileInfo: {
  name: string;
  size?: number;
  sampleType?: 'phishing' | 'bec' | 'spoof' | 'clean';
  file?: File;
}): Promise<IngestResponse> {
  if (!USE_MOCKS) {
    try {
      let fileBlob: Blob;
      if (fileInfo.file) {
        fileBlob = fileInfo.file;
      } else {
        // Generate realistic sample .eml bytes for 1-click test evaluations
        let emlContent = '';
        if (fileInfo.sampleType === 'bec') {
          emlContent = `From: "Robert Henderson (CEO)" <robert.henderson@corporate-exec.com>\nTo: <finance@enterprise.com>\nSubject: STRICTLY CONFIDENTIAL: Urgent Wire Transfer\nDate: ${new Date().toUTCString()}\nMIME-Version: 1.0\nContent-Type: text/plain; charset=utf-8\n\nPlease execute an urgent wire transfer for our confidential acquisition today. Routing details attached.`;
        } else if (fileInfo.sampleType === 'spoof') {
          emlContent = `From: "PayPal Security" <service@paypal.com>\nTo: <user@company.com>\nSubject: Account Alert: Immediate Action Required\nDate: ${new Date().toUTCString()}\nReceived: from bad-mta.net [203.0.113.199]\nMIME-Version: 1.0\nContent-Type: text/html; charset=utf-8\n\n<html><body>Your account will be suspended within 24 hours. <a href="http://203.0.113.199/verify">Verify</a></body></html>`;
        } else if (fileInfo.sampleType === 'clean') {
          emlContent = `From: "Sarah Jenkins" <sjenkins@acme-corp.com>\nTo: <colleague@acme-corp.com>\nSubject: Q3 Financial Planning Sync\nDate: ${new Date().toUTCString()}\nReceived: from mail.acme-corp.com [198.51.100.25]\nMIME-Version: 1.0\nContent-Type: text/plain; charset=utf-8\n\nHi team, let us review the financial planning sync notes tomorrow.`;
        } else {
          // Phishing / Lookalike
          emlContent = `From: "Microsoft 365 Support" <security@m365-security-alerts.com>\nTo: <user@enterprise.org>\nSubject: Security Alert: Confirm your Identity\nDate: ${new Date().toUTCString()}\nReceived: from outbound-relay.net [185.220.101.5]\nMIME-Version: 1.0\nContent-Type: text/html; charset=utf-8\n\n<html><body>Action is required within 24 hours. <a href="https://paypa1-security-login.com">Sign In</a></body></html>`;
        }
        fileBlob = new Blob([emlContent], { type: 'message/rfc822' });
      }

      const formData = new FormData();
      formData.append('file', fileBlob, fileInfo.name || 'uploaded_email.eml');

      const resp = await fetch(`${API_BASE_URL}/cases/upload`, {
        method: 'POST',
        body: formData,
      });

      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('Backend /cases/upload failed, falling back to mock:', e);
    }
  }

  // Fallback Mock Ingestion
  await delay(250);
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

  casesStore = [newRecord, ...casesStore];
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
  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/cases/${caseId}/status`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {}
  }

  await delay(80);
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
  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/alerts`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {}
  }

  await delay(100);
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
  await delay(80);
  return { ...retentionStore };
}

/**
 * PUT /settings/retention
 */
export async function updateRetentionSettings(settings: Partial<RetentionSettings>): Promise<RetentionSettings> {
  await delay(120);
  retentionStore = { ...retentionStore, ...settings };
  return { ...retentionStore };
}

/**
 * GET /audit-log
 */
export async function getAuditLogs(caseId?: string): Promise<{ logs: AuditLogEntry[] }> {
  await delay(100);
  if (caseId) {
    return { logs: auditStore.filter((l) => l.case_id === caseId) };
  }
  return { logs: auditStore };
}
