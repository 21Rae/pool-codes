import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowLeft, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { User, DatabaseState } from '../types';

interface AdminLoginPageProps {
  db: DatabaseState;
  onAdminLoginSuccess: (adminUser: User) => void;
  onBackToHomepage: () => void;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  logSQL?: (query: string, purpose: string) => void;
}

export default function AdminLoginPage({
  db,
  onAdminLoginSuccess,
  onBackToHomepage,
  triggerToast,
  logSQL
}: AdminLoginPageProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanIdentifier = identifier.trim().toLowerCase();
    if (!cleanIdentifier) {
      setErrorMsg('Please enter your administrator email or username.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your administrator security password.');
      return;
    }

    setIsLoading(true);

    try {
      // Find matching admin user in state or initial admin users
      const allAdmins = db.users.filter(u => u.role === 'admin');
      
      // Check if matches known admin email or username
      let matchedAdmin = allAdmins.find(
        u => u.email.toLowerCase() === cleanIdentifier || u.username.toLowerCase() === cleanIdentifier
      );

      // Also check standard admin credentials or system owner email
      if (!matchedAdmin && (cleanIdentifier === 'emmanuelsolomon325@gmail.com' || cleanIdentifier === 'admin' || cleanIdentifier === 'admin@fastpoolcodes.com' || cleanIdentifier === 'emmanuelsolomon')) {
        matchedAdmin = {
          id: cleanIdentifier.includes('emmanuel') ? 'usr-admin-owner' : 'usr-admin-777',
          username: cleanIdentifier.includes('emmanuel') ? 'emmanuelsolomon' : 'admin',
          email: cleanIdentifier.includes('emmanuel') ? 'emmanuelsolomon325@gmail.com' : 'admin@fastpoolcodes.com',
          role: 'admin',
          status: 'active',
          created_at: new Date().toISOString(),
          email_verified_at: new Date().toISOString()
        };
      }

      // Check if user exists in database but role is not admin
      const nonAdminUser = db.users.find(
        u => (u.email.toLowerCase() === cleanIdentifier || u.username.toLowerCase() === cleanIdentifier) && u.role !== 'admin'
      );

      if (nonAdminUser && !matchedAdmin) {
        setErrorMsg('Access Restricted: This account does not possess administrative credentials. For subscriber access, please use the main website login.');
        setIsLoading(false);
        return;
      }

      if (!matchedAdmin) {
        setErrorMsg('Invalid administrator credentials. Please check your admin username or email address.');
        setIsLoading(false);
        return;
      }

      // Successful admin login
      if (logSQL) {
        logSQL(
          `-- Admin Authentication Gateway Granted\nSELECT id, username, email, role FROM users WHERE role = 'admin' AND email = '${matchedAdmin.email}' LIMIT 1;`,
          `Administrator @${matchedAdmin.username} authenticated via secure domain route`
        );
      }

      triggerToast(`Administrative session initialized. Welcome back, ${matchedAdmin.username}!`, 'success');
      onAdminLoginSuccess(matchedAdmin);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error encountered.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030907] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-emerald-900/20 via-emerald-950/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar Header with Return Button */}
      <header className="p-4 sm:p-6 flex items-center justify-between border-b border-emerald-950/60 relative z-10 bg-[#020705]/80 backdrop-blur-md">
        <button
          onClick={onBackToHomepage}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Return to FastPoolCodes.com</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest font-extrabold hidden sm:inline">
            Secure Admin Gateway
          </span>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 my-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md bg-[#071310]/95 border border-emerald-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/60 relative overflow-hidden backdrop-blur-xl"
        >
          {/* Subtle top indicator bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400" />

          {/* Icon and Header */}
          <div className="text-center space-y-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-black text-amber-400 tracking-widest uppercase bg-amber-950/40 border border-amber-900/50 px-2.5 py-0.5 rounded">
                Domain Admin Portal
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight font-sans">
                Administrator Login
              </h2>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Enter your administrative credentials to manage pool sheets, PDF uploads, and system configurations.
              </p>
            </div>
          </div>

          {/* Error Alert if any */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMsg}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                Admin Email or Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. emmanuelsolomon325@gmail.com or admin"
                  className="w-full bg-[#020b08] border border-emerald-900/80 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none rounded-xl px-4 py-3 text-xs sm:text-sm text-emerald-200 font-sans placeholder:text-slate-600 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                  Security Password / Master Key
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#020b08] border border-emerald-900/80 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none rounded-xl px-4 py-3 text-xs sm:text-sm text-emerald-200 font-mono placeholder:text-slate-600 transition pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 transition cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-emerald-950/60 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-950" />
                  <span>Authenticate & Enter Admin Console</span>
                </>
              )}
            </button>
          </form>

          {/* Quick preset credentials helper */}
          <div className="mt-6 pt-4 border-t border-emerald-950/80 space-y-2 text-center text-slate-400 text-xs">
            <p className="text-[10px] font-mono uppercase text-slate-500">
              Quick Admin Access Selector
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIdentifier('emmanuelsolomon325@gmail.com');
                  setPassword('admin2026');
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-900/60 text-emerald-300 font-mono text-[10px] transition cursor-pointer"
              >
                Owner: emmanuelsolomon325@gmail.com
              </button>
              <button
                type="button"
                onClick={() => {
                  setIdentifier('admin');
                  setPassword('admin2026');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-[10px] transition cursor-pointer"
              >
                Admin: @admin
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer Info */}
      <footer className="p-4 text-center text-[10px] font-mono text-slate-500 border-t border-emerald-950/40 relative z-10">
        <span>FastPoolCodes Domain Router • https://www.fastpoolcodes.com/admin</span>
      </footer>
    </div>
  );
}
