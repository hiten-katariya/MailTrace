import React, { useState } from 'react';
import {
  ShieldAlert,
  Upload,
  Layers,
  Sliders,
  LogOut,
  Bell,
  LayoutDashboard,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAlerts } from '../../mocks/api';
import { ScoreBadge } from './ScoreBadge';

interface NavbarProps {
  currentTab: 'dashboard' | 'upload' | 'campaigns' | 'settings' | 'case-detail';
  onNavigate: (tab: 'dashboard' | 'upload' | 'campaigns' | 'settings') => void;
  onSelectCase?: (caseId: string) => void;
  onLogout: () => void;
  activeAnalystName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onSelectCase,
  onLogout,
  activeAnalystName = 'Alex Rivera (Analyst-01)',
}) => {
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);

  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 10000,
  });

  const alerts = alertsData?.alerts || [];
  const criticalCount = alerts.length;

  return (
    <header className="sticky top-0 z-50 bg-soc-panel/95 backdrop-blur-md border-b border-soc-border">
      {/* Top Telemetry & Status Beacon Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-soc-subtle/80 border-b border-slate-800/80 text-[11px] font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping-slow" />
            <span className="font-semibold tracking-wider">MTA SENSOR ACTIVE</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">NODE: <span className="text-slate-200">fra01-forensics-mta</span></span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">LATENCY: <span className="text-cyan-300">14ms</span></span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">PIPELINE: <span className="text-emerald-400">v2.0 (FUSION ENG)</span></span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">MODE: <span className="text-slate-200 uppercase">Forensic / SOC</span></span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="flex items-center justify-between px-5 py-3">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded bg-cyan-950/60 border border-cyan-500/40 group-hover:border-cyan-400 transition-colors shadow-soc-subtle">
              <ShieldAlert className="w-5 h-5 text-cyan-400 group-hover:scale-105 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-wider text-slate-100 font-mono">
                  MAIL<span className="text-cyan-400">TRACE</span>
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono uppercase font-bold tracking-widest bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 rounded">
                  FORENSICS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-tight">
                Trace the origin, expose the fraud.
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-soc-border">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium tracking-wide transition-colors ${
                currentTab === 'dashboard' || currentTab === 'case-detail'
                  ? 'bg-soc-raised text-cyan-300 border border-cyan-500/40 shadow-soc-subtle'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-soc-hover'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Case Triage</span>
            </button>

            <button
              onClick={() => onNavigate('upload')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium tracking-wide transition-colors ${
                currentTab === 'upload'
                  ? 'bg-soc-raised text-cyan-300 border border-cyan-500/40 shadow-soc-subtle'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-soc-hover'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Ingest / Submit .EML</span>
            </button>

            <button
              onClick={() => onNavigate('campaigns')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium tracking-wide transition-colors ${
                currentTab === 'campaigns'
                  ? 'bg-soc-raised text-cyan-300 border border-cyan-500/40 shadow-soc-subtle'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-soc-hover'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Campaign Clusters</span>
            </button>

            <button
              onClick={() => onNavigate('settings')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium tracking-wide transition-colors ${
                currentTab === 'settings'
                  ? 'bg-soc-raised text-cyan-300 border border-cyan-500/40 shadow-soc-subtle'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-soc-hover'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Compliance & Audit</span>
            </button>
          </nav>
        </div>

        {/* Right Section: Alert Center & User Session */}
        <div className="flex items-center gap-3">
          {/* Real-time High Risk Alert Drawer */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsMenu(!showAlertsMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-soc-raised hover:bg-soc-hover border border-soc-border hover:border-slate-600 transition-colors text-xs font-mono"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300 hidden sm:inline">Alerts</span>
              {criticalCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-500/40">
                  {criticalCount}
                </span>
              )}
            </button>

            {/* Alerts Dropdown Modal */}
            {showAlertsMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-soc-panel border border-soc-border rounded-md shadow-soc-card z-50 p-3">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-soc-border">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-mono font-bold text-slate-100">
                      HIGH-RISK THREAT ALERTS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-soc-muted">
                    {criticalCount} active
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {alerts.map((alert) => (
                    <div
                      key={alert.alert_id}
                      onClick={() => {
                        setShowAlertsMenu(false);
                        if (onSelectCase) onSelectCase(alert.case_id);
                      }}
                      className="p-2 rounded bg-soc-raised/80 hover:bg-soc-hover border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <ScoreBadge score={alert.fraud_score} size="sm" />
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(alert.triggered_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-200 line-clamp-1">
                        {alert.subject}
                      </p>
                      <p className="text-[11px] font-mono text-soc-muted truncate mt-0.5">
                        {alert.sender}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Analyst Session Info */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-soc-raised border border-soc-border rounded text-xs">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-300 font-mono">{activeAnalystName}</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title="Sign Out of Forensic Console"
            className="flex items-center gap-1 p-1.5 rounded bg-soc-raised hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-soc-border hover:border-red-500/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
