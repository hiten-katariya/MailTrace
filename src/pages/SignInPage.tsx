import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export const SignInPage: React.FC = () => {
  const { login, loginWithGoogle, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    setErrorMessage(null);
    setIsGoogleSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not connect to Google OAuth service.');
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Access Forensic Station"
      subtitle="Sign in with your Google workspace account or institutional credentials."
    >
      {errorMessage && (
        <div className="mb-5 p-3 rounded bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={isGoogleSubmitting || isSubmitting}
        className="w-full py-2.5 px-4 rounded bg-[#0D1524] hover:bg-[#121E33] border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 text-xs font-mono font-medium flex items-center justify-center gap-3 transition-all cursor-pointer shadow-soc-subtle group"
      >
        {isGoogleSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
            />
          </svg>
        )}
        <span className="group-hover:text-cyan-300 transition-colors">
          {isGoogleSubmitting ? 'Redirecting to Google...' : 'Continue with Google'}
        </span>
      </button>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800/80" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-mono">
          <span className="bg-[#090E17] px-3 text-slate-500">or sign in with email</span>
        </div>
      </div>

      {/* Email & Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="analyst@organization.gov"
              className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-800 focus:border-cyan-500 focus:outline-none rounded text-xs font-mono text-slate-100 placeholder:text-slate-600 transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-mono uppercase text-slate-400">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-800 focus:border-cyan-500 focus:outline-none rounded text-xs font-mono text-slate-100 placeholder:text-slate-600 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isGoogleSubmitting}
          className="w-full mt-2 py-2.5 px-4 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-soc-subtle disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Footer Navigation */}
      <div className="mt-6 pt-5 border-t border-slate-800/60 text-center text-xs text-slate-400">
        Don&apos;t have an account?{' '}
        <Link to="/sign-up" className="text-cyan-400 hover:text-cyan-300 font-mono font-medium underline-offset-2 hover:underline">
          Create account
        </Link>
      </div>
    </AuthLayout>
  );
};
