import { useState } from 'react';
import { Navbar } from './components/common/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { CampaignPage } from './pages/CampaignPage';
import { UploadPage } from './pages/UploadPage';
import { SettingsPage } from './pages/SettingsPage';

export type NavigationTab = 'dashboard' | 'upload' | 'campaigns' | 'settings' | 'case-detail';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [activeAnalyst, setActiveAnalyst] = useState<string>('Alex Rivera (Analyst-01)');
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>(undefined);

  const handleLoginSuccess = (analystName: string) => {
    setActiveAnalyst(analystName);
    setIsAuthenticated(true);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentTab('case-detail');
  };

  const handleViewCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setCurrentTab('campaigns');
  };

  const handleCaseCreated = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentTab('case-detail');
  };

  const handleNavigate = (tab: 'dashboard' | 'upload' | 'campaigns' | 'settings') => {
    if (tab === 'dashboard') {
      setSelectedCaseId(null);
    }
    setCurrentTab(tab);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-soc-bg text-soc-text font-sans flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top SOC Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onSelectCase={handleSelectCase}
        onLogout={handleLogout}
        activeAnalystName={activeAnalyst}
      />

      {/* Main Content View */}
      <main className="flex-1 pb-12">
        {currentTab === 'dashboard' && (
          <DashboardPage onSelectCase={handleSelectCase} />
        )}

        {currentTab === 'case-detail' && selectedCaseId && (
          <CaseDetailPage
            caseId={selectedCaseId}
            onBack={() => setCurrentTab('dashboard')}
            onSelectCase={handleSelectCase}
            onViewCampaign={handleViewCampaign}
          />
        )}

        {currentTab === 'campaigns' && (
          <CampaignPage
            initialCampaignId={selectedCampaignId}
            onSelectCase={handleSelectCase}
          />
        )}

        {currentTab === 'upload' && (
          <UploadPage onCaseCreated={handleCaseCreated} />
        )}

        {currentTab === 'settings' && <SettingsPage />}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-soc-border bg-soc-subtle/60 text-center font-mono text-[11px] text-soc-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            MAIL<span className="text-cyan-400">TRACE</span> Forensic Intelligence Station • Version 2.0
          </div>
          <div className="text-[10px] text-slate-500">
            Explainable Signal Fusion • Evidence Hash Integrity • Geolocation & Campaign Attribution
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
