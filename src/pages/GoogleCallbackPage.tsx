import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export const GoogleCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      setError('Invalid or incomplete OAuth callback parameters. Missing code or state.');
      return;
    }

    const processAuth = async () => {
      try {
        const user = await handleGoogleCallback(code, state);
        if (user.gmail_connected) {
          navigate('/dashboard', { replace: true });
        } else {
          // If Gmail scope wasn't authorized during Google signin, offer onboarding
          navigate('/gmail-onboarding', { replace: true });
        }
      } catch (err: any) {
        console.error('Google OAuth callback processing error:', err);
        setError(err.message || 'Failed to exchange authorization token with Google.');
      }
    };

    processAuth();
  }, [searchParams, handleGoogleCallback, navigate]);

  return (
    <div className="min-h-screen bg-[#06090F] flex flex-col items-center justify-center p-4 font-mono text-slate-200">
      <div className="max-w-md w-full bg-[#090E17] border border-slate-800 rounded-lg p-8 text-center shadow-2xl">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-4 shadow-soc-subtle">
          <Shield className="w-6 h-6" />
        </div>

        {error ? (
          <div>
            <div className="flex items-center justify-center gap-2 text-red-400 text-sm font-semibold mb-2">
              <AlertCircle className="w-4 h-4" />
              <span>Authentication Error</span>
            </div>
            <p className="text-xs text-slate-400 font-sans mb-6 leading-relaxed">
              {error}
            </p>
            <Link
              to="/sign-in"
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider hover:bg-cyan-500/25 transition-colors"
            >
              <span>Return to Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center gap-2.5 text-xs text-cyan-300 font-bold tracking-wider mb-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>ESTABLISHING CRYPTOGRAPHIC SESSION...</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Verifying Google OAuth tokens, initializing user session, and connecting forensic sensors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
