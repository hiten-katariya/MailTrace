import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/common/Navbar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { GoogleCallbackPage } from './pages/GoogleCallbackPage';
import { GmailOnboarding } from './components/auth/GmailOnboarding';
import { DashboardPage } from './pages/DashboardPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { CampaignPage } from './pages/CampaignPage';
import { UploadPage } from './pages/UploadPage';
import { LiveMailboxPage } from './pages/LiveMailboxPage';
import { SettingsPage } from './pages/SettingsPage';

/**
 * Enterprise SOC Application Shell
 * Wraps protected authenticated routes with the real-time SOC status Navbar and footer.
 */
function AppShell() {
  return (
    <div className="min-h-screen bg-soc-bg text-soc-text font-sans flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300">
      <Navbar />

      <main className="flex-1 pb-12">
        <Outlet />
      </main>

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

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Unauthenticated Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

          {/* Onboarding Route (requires active session) */}
          <Route
            path="/gmail-onboarding"
            element={
              <ProtectedRoute>
                <GmailOnboarding />
              </ProtectedRoute>
            }
          />

          {/* Protected SOC Console Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/live-mailbox" element={<LiveMailboxPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/campaigns" element={<CampaignPage />} />
            <Route path="/case/:caseId" element={<CaseDetailPage />} />

            {/* Admin-only Route */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute requireAdmin>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
