import {
  CasesResponse,
  CasesQueryParams,
  IngestResponse,
  CaseStatusResponse,
  AlertItem,
  RetentionSettings,
  AuditLogEntry,
  CasesStatsResponse,
} from '../types/api';
import {
  CaseDetail,
  CaseHeaders,
  CaseContent,
  CaseOrigin,
  CaseCorrelation,
} from '../types/case';
import { CampaignSummary, CampaignDetail } from '../types/campaign';
import { LoginResponse, SignupResponse, User } from '../types/auth';
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

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem('mailtrace_token');
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem('mailtrace_token', token);
    } else {
      localStorage.removeItem('mailtrace_token');
    }
  } catch (e) {
    console.warn('Unable to access localStorage:', e);
  }
}

export function getAuthHeaders(customHeaders?: Record<string, string>): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(customHeaders || {}),
  };
}

/**
 * POST /auth/login
 */
export async function login(identifier: string, password: string): Promise<LoginResponse> {
  const isEmail = identifier.includes('@');
  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: isEmail ? identifier : undefined,
          username: !isEmail ? identifier : undefined,
          password,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.access_token) {
          setAuthToken(data.access_token);
        }
        return data;
      } else {
        const err = await resp.json().catch(() => ({ detail: 'Invalid credentials' }));
        throw new Error(err.detail || 'Authentication failed');
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        throw e;
      }
      console.warn('Backend unavailable, falling back to mock login:', e);
    }
  }

  await delay(200);
  if (!identifier || !password) {
    throw new Error('Email/Username and password are required');
  }

  const token = `mock_jwt_token_${identifier}_${Date.now()}`;
  setAuthToken(token);
  const isAdmin = identifier.toLowerCase() === 'hiten8411jdrravi@gmail.com';
  return {
    access_token: token,
    token_type: 'bearer',
    expires_in: 28800,
    user: {
      username: isEmail ? identifier.split('@')[0] : identifier,
      email: isEmail ? identifier : `${identifier}@mailtrace.local`,
      name: isEmail ? identifier.split('@')[0] : 'Alex Rivera (Analyst-01)',
      role: isAdmin ? 'admin' : 'user',
      is_admin: isAdmin,
      gmail_connected: false,
      auth_provider: 'local',
    },
  };
}

/**
 * POST /auth/signup
 */
export async function signup(name: string, email: string, password: string): Promise<SignupResponse> {
  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.access_token) {
          setAuthToken(data.access_token);
        }
        return data;
      } else {
        const err = await resp.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(err.detail || 'Signup failed');
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        throw e;
      }
      console.warn('Backend unavailable, falling back to mock signup:', e);
    }
  }

  await delay(200);
  const token = `mock_jwt_token_${email}_${Date.now()}`;
  setAuthToken(token);
  const isAdmin = email.toLowerCase() === 'hiten8411jdrravi@gmail.com';
  return {
    access_token: token,
    token_type: 'bearer',
    expires_in: 28800,
    user: {
      username: email.split('@')[0],
      email,
      name,
      role: isAdmin ? 'admin' : 'user',
      is_admin: isAdmin,
      gmail_connected: false,
      auth_provider: 'local',
    },
  };
}

/**
 * GET /auth/me
 */
export async function getCurrentUser(): Promise<User> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders(),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('Backend /auth/me unavailable, using fallback mock user:', e);
    }
  }

  await delay(100);
  return {
    username: 'sec_operator',
    email: 'operator@mailtrace.local',
    name: 'Security Operator',
    role: 'user',
    is_admin: false,
    gmail_connected: false,
    auth_provider: 'local',
  };
}

/**
 * GET /auth/google/auth-url
 */
export async function getGoogleSignInUrl(): Promise<{ auth_url: string; state: string }> {
  const resp = await fetch(`${API_BASE_URL}/auth/google/auth-url`);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: 'Failed to fetch Google auth URL' }));
    throw new Error(err.detail || 'Failed to fetch Google sign-in URL');
  }
  return await resp.json();
}

/**
 * POST /auth/google/callback
 */
export async function sendGoogleSignInCallback(code: string, state: string): Promise<SignupResponse> {
  const resp = await fetch(`${API_BASE_URL}/auth/google/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: 'Google authorization failed' }));
    throw new Error(err.detail || 'Failed to authenticate with Google');
  }
  const data = await resp.json();
  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
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
      if (params.source) searchParams.set('source', params.source);

      const resp = await fetch(`${API_BASE_URL}/cases?${searchParams.toString()}`);
      if (resp.ok) {
        const data = await resp.json();
        return data;
      }
    } catch (e) {
      console.warn('Backend /cases unavailable, falling back to mock cases:', e);
    }
  }

  await delay(150);
  let filtered = casesStore.map((c) => c.detail);

  if (params.source && params.source !== 'all') {
    filtered = filtered.filter((c) => c.source === params.source);
  }

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
 * DELETE /cases/{case_id}
 */
export async function deleteCase(caseId: string): Promise<{ success: boolean; message: string; case_id: string }> {
  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        casesStore = casesStore.filter((c) => c.detail.case_id !== caseId);
        return await resp.json();
      }
    } catch (e) {
      console.warn(`Backend DELETE /cases/${caseId} failed, falling back to local store:`, e);
    }
  }

  await delay(120);
  casesStore = casesStore.filter((c) => c.detail.case_id !== caseId);

  auditStore.unshift({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: 'analyst',
    action: 'delete_case',
    case_id: caseId,
    details: `Deleted case ${caseId} from incident queue`,
  });

  return {
    success: true,
    message: `Case ${caseId} successfully deleted`,
    case_id: caseId,
  };
}

/**
 * POST /cases/batch-delete
 */
export async function deleteCases(caseIds: string[]): Promise<{ success: boolean; deleted_count: number; case_ids: string[] }> {
  if (!caseIds || caseIds.length === 0) {
    return { success: true, deleted_count: 0, case_ids: [] };
  }

  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/cases/batch-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_ids: caseIds }),
      });
      if (resp.ok) {
        const idSet = new Set(caseIds);
        casesStore = casesStore.filter((c) => !idSet.has(c.detail.case_id));
        return await resp.json();
      }
    } catch (e) {
      console.warn('Backend POST /cases/batch-delete failed, falling back to local store:', e);
    }
  }

  await delay(150);
  const idSet = new Set(caseIds);
  const prevLen = casesStore.length;
  casesStore = casesStore.filter((c) => !idSet.has(c.detail.case_id));
  const deletedCount = prevLen - casesStore.length;

  auditStore.unshift({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: 'analyst',
    action: 'batch_delete_cases',
    case_id: caseIds[0],
    details: `Batch deleted ${caseIds.length} cases from incident queue`,
  });

  return {
    success: true,
    deleted_count: deletedCount,
    case_ids: caseIds,
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

  await delay(80);
  const found = casesStore.find((c) => c.detail.case_id === caseId) || MOCK_CASES.find((c) => c.detail.case_id === caseId);
  if (found) {
    return found.detail;
  }
  return {
    ...MOCK_CASES[0].detail,
    case_id: caseId,
    subject: `Case ${caseId.substring(0, 8)}`,
  };
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

  await delay(80);
  const found = casesStore.find((c) => c.detail.case_id === caseId) || MOCK_CASES.find((c) => c.detail.case_id === caseId);
  return found ? found.headers : MOCK_CASES[0].headers;
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

  await delay(80);
  const found = casesStore.find((c) => c.detail.case_id === caseId) || MOCK_CASES.find((c) => c.detail.case_id === caseId);
  return found ? found.content : MOCK_CASES[0].content;
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

  await delay(80);
  const found = casesStore.find((c) => c.detail.case_id === caseId) || MOCK_CASES.find((c) => c.detail.case_id === caseId);
  return found ? found.origin : MOCK_CASES[0].origin;
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
          shared_indicator: data.shared_indicator || 'Isolated Investigation (No Cluster Match)',
          attribution_type: data.attribution_type,
          attribution_confidence: data.attribution_confidence,
        };
      }
    } catch (e) {
      console.warn(`Backend /cases/${caseId}/correlation unavailable:`, e);
    }
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
    } catch (e) {
      console.warn('Backend /campaigns unavailable:', e);
    }
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
  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/campaigns/${campaignId}`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn(`Backend /campaigns/${campaignId} unavailable:`, e);
    }
  }

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

  const highRiskCases = casesStore.filter((c) => c.detail.fraud_score >= 70 || c.detail.risk_category === 'bec');
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
 * GET /cases/stats
 */
export async function getCasesStats(): Promise<CasesStatsResponse> {
  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/cases/stats`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('Backend /cases/stats unavailable, using fallback stats:', e);
    }
  }

  await delay(100);
  const total = casesStore.length || 1;
  const phishingCount = casesStore.filter((c) => c.detail.risk_category === 'phishing').length;
  const becCount = casesStore.filter((c) => c.detail.risk_category === 'bec').length;
  const suspiciousCount = casesStore.filter((c) => c.detail.risk_category === 'suspicious').length;
  const legitCount = casesStore.filter((c) => c.detail.risk_category === 'legitimate').length;
  const highRisk = phishingCount + becCount;
  const avgScore = Math.round(casesStore.reduce((acc, c) => acc + c.detail.fraud_score, 0) / total);

  return {
    total_cases: total,
    high_risk_cases: highRisk,
    suspicious_cases: suspiciousCount,
    legitimate_cases: legitCount,
    average_score: avgScore,
    by_risk_category: [
      { category: 'phishing', count: phishingCount, percentage: Math.round((phishingCount / total) * 100), color: '#EF4444' },
      { category: 'bec', count: becCount, percentage: Math.round((becCount / total) * 100), color: '#F43F5E' },
      { category: 'suspicious', count: suspiciousCount, percentage: Math.round((suspiciousCount / total) * 100), color: '#F59E0B' },
      { category: 'legitimate', count: legitCount, percentage: Math.round((legitCount / total) * 100), color: '#10B981' },
    ],
    score_brackets: [
      { range: '0–20', count: casesStore.filter((c) => c.detail.fraud_score <= 20).length, color: '#10B981' },
      { range: '21–40', count: casesStore.filter((c) => c.detail.fraud_score > 20 && c.detail.fraud_score <= 40).length, color: '#28C7E8' },
      { range: '41–60', count: casesStore.filter((c) => c.detail.fraud_score > 40 && c.detail.fraud_score <= 60).length, color: '#F59E0B' },
      { range: '61–80', count: casesStore.filter((c) => c.detail.fraud_score > 60 && c.detail.fraud_score <= 80).length, color: '#F97316' },
      { range: '81–100', count: casesStore.filter((c) => c.detail.fraud_score > 80).length, color: '#EF4444' },
    ],
    detection_trends: [
      { date: '2026-08-30', phishing: 4, bec: 1, suspicious: 2, legitimate: 8 },
      { date: '2026-08-31', phishing: 6, bec: 2, suspicious: 4, legitimate: 11 },
      { date: '2026-09-01', phishing: 7, bec: 2, suspicious: 5, legitimate: 14 },
      { date: '2026-09-02', phishing: 8, bec: 3, suspicious: 4, legitimate: 12 },
    ],
  };
}

/**
 * GET /cases/{case_id}/report?format=pdf|json
 */
export async function getCaseReport(caseId: string, format: 'pdf' | 'json' = 'json'): Promise<any> {
  const url = `${API_BASE_URL}/cases/${caseId}/report?format=${format}`;
  if (format === 'pdf') {
    window.open(url, '_blank');
    return { status: 'opened' };
  }
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch report for case ${caseId}`);
  }
  return await resp.json();
}

/**
 * GET /settings/retention
 */
export async function getRetentionSettings(): Promise<RetentionSettings> {
  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/settings/retention`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('Backend /settings/retention unavailable:', e);
    }
  }

  await delay(80);
  return { ...retentionStore };
}

/**
 * PUT /settings/retention
 */
export async function updateRetentionSettings(settings: Partial<RetentionSettings>): Promise<RetentionSettings> {
  if (!USE_MOCKS) {
    try {
      const resp = await fetch(`${API_BASE_URL}/settings/retention`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (resp.ok) {
        const data = await resp.json();
        retentionStore = { ...retentionStore, ...data };
        return data;
      }
    } catch (e) {
      console.warn('Backend PUT /settings/retention unavailable:', e);
    }
  }

  await delay(120);
  retentionStore = { ...retentionStore, ...settings };
  return { ...retentionStore };
}

/**
 * GET /audit-log
 */
export async function getAuditLogs(caseId?: string): Promise<{ logs: AuditLogEntry[] }> {
  if (!USE_MOCKS) {
    try {
      const url = caseId ? `${API_BASE_URL}/audit-log?case_id=${caseId}` : `${API_BASE_URL}/audit-log`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        return {
          logs: (data.logs || []).map((l: any) => ({
            id: l.id,
            timestamp: l.timestamp,
            user: l.username,
            action: l.action,
            case_id: l.case_id,
            details: l.details || '',
          })),
        };
      }
    } catch (e) {
      console.warn('Backend /audit-log unavailable, using mock audit log:', e);
    }
  }

  await delay(100);
  if (caseId) {
    return { logs: auditStore.filter((l) => l.case_id === caseId) };
  }
  return { logs: auditStore };
}

/**
 * Gmail Integration Endpoints
 */

export function getLiveStreamUrl(): string {
  return `${API_BASE_URL}/cases/stream`;
}

export async function getGmailAuthUrl(): Promise<{ auth_url: string; state: string }> {
  const resp = await fetch(`${API_BASE_URL}/gmail/auth-url`);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: 'Failed to fetch auth URL' }));
    throw new Error(err.detail || 'Failed to fetch Google auth URL');
  }
  return await resp.json();
}

export async function sendGmailCallback(code: string, state: string): Promise<any> {
  const resp = await fetch(`${API_BASE_URL}/gmail/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: 'Failed to exchange OAuth code' }));
    throw new Error(err.detail || 'Failed to exchange authorization code');
  }
  return await resp.json();
}

export async function getGmailStatus(): Promise<{
  connected: boolean;
  email?: string | null;
  status: string;
  connected_at?: string | null;
  last_polled_at?: string | null;
  error_message?: string | null;
}> {
  try {
    const resp = await fetch(`${API_BASE_URL}/gmail/status`);
    if (resp.ok) {
      return await resp.json();
    }
  } catch (e) {
    console.warn('Backend /gmail/status unavailable:', e);
  }
  return {
    connected: false,
    email: null,
    status: 'disconnected',
    connected_at: null,
    last_polled_at: null,
    error_message: null,
  };
}

export async function disconnectGmail(): Promise<{ success: boolean; message: string }> {
  const resp = await fetch(`${API_BASE_URL}/gmail/disconnect`, {
    method: 'POST',
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: 'Failed to disconnect Gmail' }));
    throw new Error(err.detail || 'Failed to disconnect Gmail');
  }
  return await resp.json();
}

