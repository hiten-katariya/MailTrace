import { AuditLogEntry, RetentionSettings } from '../types/api';

export const INITIAL_RETENTION_SETTINGS: RetentionSettings = {
  retention_days: 90,
  auto_purge: true,
  mask_pii: true,
  export_compliance_level: 'standard',
};

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-101',
    timestamp: '2026-09-02T10:15:20Z',
    user: 'analyst1 (Alex Rivera)',
    action: 'view',
    case_id: 'c8f2a1e4-39fa-4c78-b6e8-289d18e47001',
    details: 'Accessed forensic overview & header inspection for Case c8f2a1e4',
  },
  {
    id: 'log-102',
    timestamp: '2026-09-02T09:45:11Z',
    user: 'analyst1 (Alex Rivera)',
    action: 'export_report',
    case_id: 'd71b9f02-88ef-41ae-9a02-5c941a8e1002',
    details: 'Generated and exported forensic incident PDF report (hash verified)',
  },
  {
    id: 'log-103',
    timestamp: '2026-09-02T09:30:15Z',
    user: 'system_pipeline',
    action: 'upload',
    case_id: 'd71b9f02-88ef-41ae-9a02-5c941a8e1002',
    details: 'Automated MIME ingestion and forensic signal fusion completed',
  },
  {
    id: 'log-104',
    timestamp: '2026-09-01T17:10:00Z',
    user: 'admin_lead (Sarah Chen)',
    action: 'change_retention',
    details: 'Updated retention period to 90 days with automatic GDPR PII masking enabled',
  },
  {
    id: 'log-105',
    timestamp: '2026-09-01T16:25:00Z',
    user: 'analyst2 (David Kim)',
    action: 'annotate',
    case_id: 'f88a21e9-44bc-4672-91ef-771122334005',
    details: 'Added threat actor annotation: Linked to PhantomRelay campaign cluster',
  },
];
