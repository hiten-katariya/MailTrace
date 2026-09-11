import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Upload,
  Layers,
  Sliders,
  LogOut,
  Bell,
  LayoutDashboard,
  Shield,
  Activity,
  Terminal,
  Mail,
  Crown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAlerts } from '../../mocks/api';
import { ScoreBadge } from './ScoreBadge';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  currentTab?: 'dashboard' | 'live-mailbox' | 'upload' | 'campaigns' | 'settings' | 'case-detail';
  onNavigate?: (tab: 'dashboard' | 'live-mailbox' | 'upload' | 'campaigns' | 'settings') => void;
  onSelectCase?: (caseId: string) => void;
  onLogout?: () => void;
  activeAnalystName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab: propTab,
  onNavigate,
  onSelectCase,
  onLogout,
  activeAnalystName,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const [timeUtc, setTimeUtc] = useState(new Date().toISOString().substring(11, 19) + ' UTC');

  // Determine active tab from location or prop
  const currentPath = location.pathname;
  let activeTab = propTab;
  if (!activeTab) {
    if (currentPath.startsWith('/dashboard') || currentPath.startsWith('/case/')) activeTab = 'dashboard';
    else if (currentPath.startsWith('/live-mailbox')) activeTab = 'live-mailbox';
    else if (currentPath.startsWith('/upload')) activeTab = 'upload';
    else if (currentPath.startsWith('/campaigns')) activeTab = 'campaigns';
    else if (currentPath.startsWith('/settings')) activeTab = 'settings';
    else activeTab = 'dashboard';
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUtc(new Date().toISOString().substring(11, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 10000,
  });

  const alerts = alertsData?.alerts || [];
  const criticalCount = alerts.length;

  const handleNavClick = (tab: 'dashboard' | 'live-mailbox' | 'upload' | 'campaigns' | 'settings') => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      navigate(`/${tab}`);
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      navigate('/sign-in');
    }
  };

  const displayName = activeAnalystName || user?.name || user?.username || 'Security Analyst';

  return (
    <header className="sticky top-0 z-50 bg-[#0A0F18]/95 backdrop-blur-md border-b border-slate-800/40">
      {/* 1. Compact Security Operations Status Strip */}
      <div className="flex items-center justify-between px-4 py-1 bg-[#070B12] border-b border-slate-800/30 text-[10px] font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping-slow" />
            <span className="font-bold tracking-wider">SENSOR ONLINE</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">NODE: <span className="text-slate-200">fra01-forensics-mta</span></span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">PIPELINE: <span className="text-cyan-300">FUSION v2.0</span></span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400 hidden sm:inline">LATENCY: <span className="text-emerald-400">14ms</span></span>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">LAST SYNC: <span className="text-slate-200">12s ago</span></span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-slate-300 font-mono tracking-widest">{timeUtc}</div>
          <span className="text-slate-700 hidden md:inline">|</span>
          <span className="text-slate-400 hidden md:inline">MODE: <span className="text-cyan-400 uppercase font-semibold">SOC / FORENSIC</span></span>
        </div>
      </div>

      {/* 2. Main Enterprise SOC Navigation Bar */}
      <div className="flex items-center justify-between px-5 py-2.5">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded bg-cyan-500/10 border border-cyan-500/30 group-hover:border-cyan-400 transition-colors shadow-soc-subtle">
              <Shield className="w-4 h-4 text-cyan-400 group-hover:scale-105 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-wider text-slate-100 font-mono">
                  MAIL<span className="text-cyan-400">TRACE</span>
                </span>
                <span className="px-1 py-0.2 text-[8px] font-mono uppercase font-bold tracking-widest bg-slate-800/80 text-slate-300 border border-slate-700/60 rounded">
                  v2.0
                </span>
              </div>
              <p className="text-[9px] font-mono text-slate-400 tracking-tight hidden sm:block">
                Trace the origin, expose the fraud.
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono tracking-wide transition-colors cursor-pointer ${
                activeTab === 'dashboard' || activeTab === 'case-detail'
                  ? 'bg-cyan-500/10 text-cyan-300 font-semibold border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400/80" />
              <span>Case Triage</span>
            </button>

            <button
              onClick={() => handleNavClick('live-mailbox')}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono tracking-wide transition-colors cursor-pointer ${
                activeTab === 'live-mailbox'
                  ? 'bg-cyan-500/10 text-cyan-300 font-semibold border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Mailbox</span>
            </button>

            <button
              onClick={() => handleNavClick('upload')}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono tracking-wide transition-colors cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-cyan-500/10 text-cyan-300 font-semibold border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Ingest / Submit .EML</span>
            </button>

            <button
              onClick={() => handleNavClick('campaigns')}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono tracking-wide transition-colors cursor-pointer ${
                activeTab === 'campaigns'
                  ? 'bg-cyan-500/10 text-cyan-300 font-semibold border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Campaign Clusters</span>
            </button>

            {/* PART 7: Hide Compliance & Audit from non-admin users */}
            {isAdmin && (
              <button
                onClick={() => handleNavClick('settings')}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono tracking-wide transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-cyan-500/10 text-cyan-300 font-semibold border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Compliance & Audit</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right Section: Alert Center & User Session */}
        <div className="flex items-center gap-2.5">
          {/* Real-time High Risk Alert Drawer */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsMenu(!showAlertsMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-soc-panel hover:bg-soc-hover border border-slate-800/60 hover:border-slate-700 transition-colors text-xs font-mono cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300 hidden sm:inline">Alerts</span>
              {criticalCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  {criticalCount}
                </span>
              )}
            </button>

            {/* Alerts Dropdown Modal */}
            {showAlertsMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-soc-panel border border-slate-800/80 rounded shadow-soc-card z-50 p-3">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60">
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

                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {alerts.map((alert) => (
                    <div
                      key={alert.alert_id}
                      onClick={() => {
                        setShowAlertsMenu(false);
                        if (onSelectCase) {
                          onSelectCase(alert.case_id);
                        } else {
                          navigate(`/case/${alert.case_id}`);
                        }
                      }}
                      className="p-2 rounded bg-soc-inset hover:bg-soc-hover border border-slate-800/60 hover:border-slate-700 cursor-pointer transition-colors"
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
                      <p className="text-[10px] font-mono text-soc-muted truncate mt-0.5">
                        {alert.sender}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active User Session Info */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-soc-panel border border-slate-800/60 rounded text-xs">
            <div className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-amber-400' : 'bg-cyan-400'}`} />
            <span className="text-slate-300 font-mono text-[11px] truncate max-w-[140px]">{displayName}</span>
            {isAdmin && (
              <span className="px-1 py-0.2 text-[8px] font-mono uppercase font-bold tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded flex items-center gap-0.5">
                <Crown className="w-2.5 h-2.5" />
                ADMIN
              </span>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogoutClick}
            title="Sign Out of Forensic Console"
            className="flex items-center gap-1 p-1.5 rounded bg-soc-panel hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800/60 hover:border-red-500/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
