import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070B12] flex flex-col items-center justify-center text-slate-300 font-mono">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-4 animate-pulse">
          <Shield className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-xs text-cyan-300 tracking-wider">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>VERIFYING SECURITY CREDENTIALS...</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 font-mono">MailTrace Cryptographic Session Boundary</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
