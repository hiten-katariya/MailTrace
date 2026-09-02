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
      label: 'Critical Phish',
      badgeBg: 'bg-red-500/10',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/25',
      barColor: '#EF4444',
    };
  }
  if (score >= 40) {
    return {
      category: 'suspicious',
      label: 'Suspicious',
      badgeBg: 'bg-amber-500/10',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/25',
      barColor: '#F59E0B',
    };
  }
  return {
    category: 'legitimate',
    label: 'Verified Clean',
    badgeBg: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/25',
    barColor: '#10B981',
  };
}

export function getRiskCategoryConfig(category: RiskCategory) {
  switch (category) {
    case 'phishing':
      return {
        label: 'PHISHING',
        badgeBg: 'bg-red-500/10',
        textColor: 'text-red-400',
        borderColor: 'border-red-500/25',
        dotColor: 'bg-red-400',
        chipClass: 'bg-red-500/10 text-red-300 border-red-500/25',
      };
    case 'bec':
      return {
        label: 'BEC / IMPERSONATION',
        badgeBg: 'bg-rose-500/10',
        textColor: 'text-rose-400',
        borderColor: 'border-rose-500/25',
        dotColor: 'bg-rose-400',
        chipClass: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
      };
    case 'suspicious':
      return {
        label: 'SUSPICIOUS',
        badgeBg: 'bg-amber-500/10',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/25',
        dotColor: 'bg-amber-400',
        chipClass: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
      };
    case 'legitimate':
    default:
      return {
        label: 'LEGITIMATE',
        badgeBg: 'bg-emerald-500/10',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/25',
        dotColor: 'bg-emerald-400',
        chipClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
      };
  }
}

export function getProtocolStatusConfig(status: ProtocolStatus) {
  switch (status) {
    case 'pass':
      return {
        label: 'PASS',
        badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
        iconType: 'check',
        symbol: '✓',
      };
    case 'fail':
      return {
        label: 'FAIL',
        badgeClass: 'bg-red-500/10 text-red-300 border-red-500/25',
        iconType: 'x',
        symbol: '×',
      };
    case 'softfail':
      return {
        label: 'SOFTFAIL',
        badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
        iconType: 'alert',
        symbol: '!',
      };
    case 'neutral':
      return {
        label: 'NEUTRAL',
        badgeClass: 'bg-slate-800/60 text-slate-300 border-slate-700/50',
        iconType: 'minus',
        symbol: '—',
      };
    case 'none':
    default:
      return {
        label: 'NONE',
        badgeClass: 'bg-slate-800/40 text-slate-400 border-slate-800/60',
        iconType: 'help',
        symbol: '—',
      };
  }
}

export function getConfidenceConfig(confidence: ConfidenceLevel) {
  switch (confidence) {
    case 'high':
      return {
        label: 'CONFIDENCE: HIGH',
        tagClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
        dots: '●●●',
      };
    case 'medium':
      return {
        label: 'CONFIDENCE: MED',
        tagClass: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
        dots: '●●○',
      };
    case 'low':
      return {
        label: 'CONFIDENCE: LOW',
        tagClass: 'bg-slate-800/60 text-slate-400 border-slate-700/40',
        dots: '●○○',
      };
  }
}
