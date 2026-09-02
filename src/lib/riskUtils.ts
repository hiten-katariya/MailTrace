import { RiskCategory, ProtocolStatus, ConfidenceLevel } from '../types/case';

export function getRiskLevelFromScore(score: number): {
  category: RiskCategory;
  label: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  barColor: string;
} {
  if (score >= 70) {
    return {
      category: 'phishing',
      label: 'High Risk / Phishing',
      badgeBg: 'bg-threat-high/15',
      textColor: 'text-threat-high',
      borderColor: 'border-threat-high/40',
      barColor: '#EF4444',
    };
  }
  if (score >= 40) {
    return {
      category: 'suspicious',
      label: 'Suspicious / Anomaly',
      badgeBg: 'bg-threat-suspicious/15',
      textColor: 'text-threat-suspicious',
      borderColor: 'border-threat-suspicious/40',
      barColor: '#F59E0B',
    };
  }
  return {
    category: 'legitimate',
    label: 'Legitimate / Verified',
    badgeBg: 'bg-threat-clean/15',
    textColor: 'text-threat-clean',
    borderColor: 'border-threat-clean/40',
    barColor: '#10B981',
  };
}

export function getRiskCategoryConfig(category: RiskCategory) {
  switch (category) {
    case 'phishing':
      return {
        label: 'Phishing',
        badgeBg: 'bg-red-950/60',
        textColor: 'text-red-400',
        borderColor: 'border-red-500/30',
        dotColor: 'bg-red-500',
        chipClass: 'bg-red-950/40 text-red-300 border-red-500/40',
      };
    case 'bec':
      return {
        label: 'BEC / Impersonation',
        badgeBg: 'bg-rose-950/60',
        textColor: 'text-rose-400',
        borderColor: 'border-rose-500/40',
        dotColor: 'bg-rose-500',
        chipClass: 'bg-rose-950/40 text-rose-300 border-rose-500/40',
      };
    case 'suspicious':
      return {
        label: 'Suspicious',
        badgeBg: 'bg-amber-950/50',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/30',
        dotColor: 'bg-amber-500',
        chipClass: 'bg-amber-950/40 text-amber-300 border-amber-500/40',
      };
    case 'legitimate':
    default:
      return {
        label: 'Legitimate',
        badgeBg: 'bg-emerald-950/40',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
        dotColor: 'bg-emerald-500',
        chipClass: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40',
      };
  }
}

export function getProtocolStatusConfig(status: ProtocolStatus) {
  switch (status) {
    case 'pass':
      return {
        label: 'PASS',
        badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
        iconType: 'check',
      };
    case 'fail':
      return {
        label: 'FAIL',
        badgeClass: 'bg-red-950/60 text-red-300 border-red-500/40',
        iconType: 'x',
      };
    case 'softfail':
      return {
        label: 'SOFTFAIL',
        badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
        iconType: 'alert',
      };
    case 'neutral':
      return {
        label: 'NEUTRAL',
        badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
        iconType: 'minus',
      };
    case 'none':
    default:
      return {
        label: 'NONE',
        badgeClass: 'bg-slate-900/80 text-slate-400 border-slate-800',
        iconType: 'help',
      };
  }
}

export function getConfidenceConfig(confidence: ConfidenceLevel) {
  switch (confidence) {
    case 'high':
      return {
        label: 'Confidence: High',
        tagClass: 'bg-cyan-950/50 text-cyan-300 border-cyan-500/30',
        dots: '●●●',
      };
    case 'medium':
      return {
        label: 'Confidence: Med',
        tagClass: 'bg-slate-800/80 text-amber-300 border-amber-500/30',
        dots: '●●○',
      };
    case 'low':
      return {
        label: 'Confidence: Low',
        tagClass: 'bg-slate-900/90 text-slate-400 border-slate-700',
        dots: '●○○',
      };
  }
}
