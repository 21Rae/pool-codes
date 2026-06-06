import React, { useState } from 'react';
import {
  Home,
  Check,
  Download,
  Bell,
  User as UserIcon,
  CreditCard,
  Target,
  Trophy,
  Lock,
  Unlock,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Layers,
  History,
  TrendingUp,
  Inbox,
  Sparkles,
  Zap,
  Flame,
  Award,
  Activity,
  Compass,
  Volume2,
  MessageSquare,
  Grid,
  List,
  Eye,
  Copy,
  Search,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseState, User, SubscriptionPlan, UserSubscription, PoolCode } from '../types';

interface CustomerPortalProps {
  db: DatabaseState;
  currentUser: User;
  activePlan: SubscriptionPlan | undefined;
  activeSubscription: UserSubscription | undefined;
  buySubscription: (planId: string) => void;
  handleDownloadCode: (code: PoolCode) => void;
  triggerToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  markAllNotificationsRead: () => void;
}

export default function CustomerPortal({
  db,
  currentUser,
  activePlan,
  activeSubscription,
  buySubscription,
  handleDownloadCode,
  triggerToast,
  markAllNotificationsRead
}: CustomerPortalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'codes' | 'international' | 'results' | 'subscription' | 'notifications' | 'downloads' | 'profile'>('dashboard');
  const [codeTypeFilter, setCodeTypeFilter] = useState<'all' | 'uk' | 'aussie' | 'international'>('all');
  const [bookmakerFilter, setBookmakerFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'portal' | 'decryptor'>('portal');
  const [selectedResultId, setSelectedResultId] = useState<string>('pr-w43');

  const [intlCodes, setIntlCodes] = useState([
    {
      id: 'intl-w29',
      title: 'Week 29 Pool Odds Comparison: Bet9ja, BetKing and more — January 17th, 2026',
      date: 'January 12th, 2026',
      comments_count: 0,
      likes: 34,
      isLiked: false,
      pool_type: 'international',
      week_number: 29,
      isOddsComparison: true,
      hasPdf: true,
      oddsData: [
        { matchNo: 1, teams: 'Arsenal vs Chelsea', bet9ja: '1.95', betking: '1.90', sportybet: '2.00', msport: '1.92', oneXbet: '2.05' },
        { matchNo: 2, teams: 'Liverpool vs Leeds', bet9ja: '3.20', betking: '3.15', sportybet: '3.30', msport: '3.25', oneXbet: '3.40' },
        { matchNo: 3, teams: 'Napoli vs Juventus', bet9ja: '4.10', betking: '4.25', sportybet: '3.95', msport: '4.15', oneXbet: '3.80' },
        { matchNo: 4, teams: 'Real Madrid vs Barcelona', bet9ja: '1.45', betking: '1.42', sportybet: '1.48', msport: '1.44', oneXbet: '1.50' },
        { matchNo: 5, teams: 'Aston Villa vs Wolves', bet9ja: '2.10', betking: '2.15', sportybet: '2.08', msport: '2.12', oneXbet: '2.18' }
      ]
    },
    {
      id: 'intl-w48',
      title: 'Week 48 Bet365 Pool Codes: Aussie Pool Codes 2022/23 – June 3rd, 2023',
      date: 'May 30, 2023',
      comments_count: 89,
      likes: 112,
      isLiked: false,
      pool_type: 'aussie',
      week_number: 48,
      brand: 'bet365',
      codeDetails: {
        sequence: 'A365-PR-889-X',
        keyNumbers: [14, 22, 33, 41],
        decoderKey: 'LNK-992-BETA'
      }
    },
    {
      id: 'intl-w47',
      title: 'Week 47 Bet365 Pool Codes: UK Pool Codes 2022/23 – May 27th, 2023',
      date: 'May 25, 2023',
      comments_count: 12,
      likes: 45,
      isLiked: false,
      pool_type: 'uk',
      week_number: 47,
      brand: 'bet365',
      codeDetails: {
        sequence: 'A365-UK-120-Z',
        keyNumbers: [4, 18, 29, 30],
        decoderKey: 'LNK-854-THETA'
      }
    },
    {
      id: 'intl-w46',
      title: 'Week 46 Bet365 Pool Codes: UK Pool Codes 2022/23 – May 20th, 2023',
      date: 'May 15, 2023',
      comments_count: 1,
      likes: 24,
      isLiked: false,
      pool_type: 'uk',
      week_number: 46,
      brand: 'bet365',
      codeDetails: {
        sequence: 'A365-UK-109-Y',
        keyNumbers: [1, 9, 12, 45],
        decoderKey: 'LNK-771-ALPHA'
      }
    },
    {
      id: 'intl-w45',
      title: 'Week 45 Bet365 Pool Codes: UK Pool Codes 2022/23 – May 13th, 2023',
      date: 'May 9, 2023',
      comments_count: 0,
      likes: 19,
      isLiked: false,
      pool_type: 'uk',
      week_number: 45,
      brand: 'bet365',
      codeDetails: {
        sequence: 'A365-UK-088-W',
        keyNumbers: [6, 15, 24, 38],
        decoderKey: 'LNK-530-GAMMA'
      }
    }
  ]);
  const [selectedIntlId, setSelectedIntlId] = useState<string>('intl-w29');

  const handleLikeIntlCode = (id: string) => {
    setIntlCodes(prev => prev.map(code => {
      if (code.id === id) {
        const nextLiked = !code.isLiked;
        return {
          ...code,
          isLiked: nextLiked,
          likes: nextLiked ? code.likes + 1 : code.likes - 1
        };
      }
      return code;
    }));
  };



  // Notifications logic
  const myNotifications = db.notifications.filter(n => n.user_id === currentUser.id);
  const unreadCount = myNotifications.filter(n => !n.is_read).length;

  // Downloads history
  const myDownloads = db.user_downloads.filter(d => d.user_id === currentUser.id);

  // Active codes filtering
  const filteredCodes = db.pool_codes.filter(code => {
    const week = db.pool_weeks.find(w => w.id === code.pool_week_id);
    const bookmaker = db.bookmakers.find(b => b.id === code.bookmaker_id);
    if (!week || !bookmaker) return false;

    // Filter deactivated bookmakers
    if (!bookmaker.is_active) return false;

    if (codeTypeFilter !== 'all' && week.pool_type !== codeTypeFilter) return false;
    if (bookmakerFilter !== 'all' && code.bookmaker_id !== bookmakerFilter) return false;
    
    // Search Term match
    if (searchTerm) {
      const matchLabel = `${bookmaker.name} ${week.week_number} ${week.pool_type}`.toLowerCase();
      if (!matchLabel.includes(searchTerm.toLowerCase())) return false;
    }

    return true;
  });



  return (
    <div id="customer-portal-app" className="flex-1 flex flex-col md:flex-row bg-[#0A0F1D] text-slate-100 font-sans min-h-0 h-full">
      
      {/* Interactive Stadium Locker-Room Sidebar */}
      <aside className="w-full md:w-68 bg-gradient-to-b from-[#0F172A] to-[#0D1527] text-slate-300 p-5 flex flex-col justify-between border-right border-slate-800/80 shrink-0 overflow-y-auto">
        <div className="flex flex-col gap-6">
          {/* Sports branding design */}
          <div className="flex items-center gap-3 pb-5 border-b border-emerald-950/40">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-emerald-500/20">
              ⚽
            </div>
            <div>
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 tracking-tight block text-sm">
                POOLCODES ARENA
              </span>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                stadium-client v4.9
              </span>
            </div>
          </div>

          {/* User Profile identity Badge */}
          <div className="p-3.5 bg-gradient-to-r from-[#172540]/80 to-[#121F38]/80 rounded-xl border border-emerald-600/20 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center font-bold text-emerald-400 text-sm font-mono shadow-inner">
              {currentUser.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black text-slate-50 block truncate">@{currentUser.username}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[9.5px] font-mono text-emerald-350 tracking-wider uppercase font-semibold">
                  {activePlan?.id !== 'plan-free' ? '★ VIP Arena Member' : 'Free Trial Tier'}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveSubTab('dashboard')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                activeSubTab === 'dashboard'
                  ? 'bg-gradient-to-r from-emerald-550/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>DASHBOARD ARENA</span>
            </button>

            <button
              onClick={() => setActiveSubTab('codes')}
              className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                activeSubTab === 'codes'
                  ? 'bg-gradient-to-r from-emerald-550/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
              }`}
            >
              <span className="flex items-center gap-3">
                <Target className="w-4 h-4" />
                <span>POOL CODES</span>
              </span>
              <span className="bg-emerald-950/80 text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-900/40">
                {db.pool_codes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('international')}
              className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                activeSubTab === 'international'
                  ? 'bg-gradient-to-r from-emerald-550/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
              }`}
            >
              <span className="flex items-center gap-3">
                <Globe className="w-4 h-4" />
                <span>INTERNATIONAL CODES</span>
              </span>
              <span className="bg-emerald-950/80 text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-900/40">
                {intlCodes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('results')}
              className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                activeSubTab === 'results'
                  ? 'bg-gradient-to-r from-emerald-550/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
              }`}
            >
              <span className="flex items-center gap-3">
                <Trophy className="w-4 h-4" />
                <span>CHAMPIONS RESULT SHEETS</span>
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('subscription')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                activeSubTab === 'subscription'
                  ? 'bg-gradient-to-r from-emerald-550/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>VIP PREMIUM MEMBERSHIP</span>
            </button>

            <button
              onClick={() => setActiveSubTab('notifications')}
              className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                activeSubTab === 'notifications'
                  ? 'bg-gradient-to-r from-emerald-550/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
              }`}
            >
              <span className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                <span>ALERTS TELECOM</span>
              </span>
              {unreadCount > 0 && (
                <span className="bg-rose-600 text-white text-[9.5px] font-bold h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('downloads')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                activeSubTab === 'downloads'
                  ? 'bg-gradient-to-r from-emerald-550/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
              }`}
            >
              <History className="w-4 h-4" />
              <span>KEY ACCESS LOGS</span>
            </button>

            <button
              onClick={() => setActiveSubTab('profile')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                activeSubTab === 'profile'
                  ? 'bg-gradient-to-r from-emerald-550/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>USER PROFILE</span>
            </button>
          </nav>
        </div>

        {/* Security Encryption Badge Footer */}
        <div className="pt-4 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono space-y-1">
          <div className="flex items-center gap-1.5 text-[#10B981]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>SECURE STADIUM ENCRYPTED</span>
          </div>
          <p className="text-slate-600">RSA 2048-Bit Draw Verifications Active</p>
        </div>
      </aside>

      {/* Main Panel View Area */}
      <main className="flex-1 p-5 md:p-8 bg-[#070B14] flex flex-col gap-6 overflow-x-hidden overflow-y-auto min-h-0">
        
        {/* Revocation Warning Alert */}
        {currentUser.status === 'suspended' && (
          <div className="bg-gradient-to-r from-rose-950/80 to-[#1C1014] border border-rose-800/60 text-rose-300 p-4 rounded-xl flex items-center gap-3 text-xs shadow-lg">
            <ShieldAlert className="w-6 h-6 text-rose-500 animate-bounce shrink-0" />
            <div>
              <span className="font-extrabold uppercase block tracking-wider text-rose-455">User account suspended</span>
              Your prediction access codes have been suspended. Submit unban claims to verify your identity.
            </div>
          </div>
        )}

        {/* Active Sub Tabs Presentation Screen */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSubTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6"
            >
              
              {/* SUBTAB 1: SPORT CODES DASHBOARD CONTAINER */}
              {activeSubTab === 'dashboard' && (
                <div className="flex flex-col gap-6">
                  
                  {/* Dynamic Matchday Hero Boardroom Widget */}
                  <div className="bg-gradient-to-br from-[#1E3A24] via-[#0E1F13] to-[#0D1527] border border-emerald-500/20 text-slate-100 p-6 rounded-2xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-2xl">
                    <div className="absolute top-0 right-0 opacity-[0.03] select-none pointer-events-none -mr-9 -mt-10">
                      <svg width="400" height="400" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1"/>
                        <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="1"/>
                        <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    </div>

                    <div className="relative z-10 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-955 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md font-mono">
                          {activePlan?.id !== 'plan-free' ? '🏆 ARENA VIP STADIUM MASTER' : '⚽ STANDARD PITCH SEAT'}
                        </span>
                        <span className="text-xs text-emerald-350 font-mono font-bold select-none">[Verified Draw Forecaster]</span>
                      </div>
                      <h2 className="text-2xl font-black italic tracking-wide text-white mt-3 uppercase">
                        Welcome back, {currentUser.username}!
                      </h2>
                      <p className="text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
                        Access real-time bookmaker pool codes, secret forecast draw worksheets, & historical fixtures summaries.
                      </p>
                    </div>

                    {/* Arena live stats countdown banner */}
                    <div className="p-4 bg-slate-950/90 rounded-2xl border-2 border-emerald-500/40 text-xs w-full lg:w-68 shadow-inner flex flex-col justify-between">
                      <span className="text-[#10B981] font-mono font-bold text-[9.5px] tracking-wide uppercase block">● ARENA PITCH ACTIVE</span>
                      <div className="my-2">
                        <span className="text-[10px] text-slate-400 font-mono block">CURRENT WORKSPACE</span>
                        <span className="font-black text-white text-base block tracking-wide italic">Week 49 (Aussie Pools)</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800/85 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
                        <span>Fixtures: SATURDAY 16:00</span>
                        <span>ACTIVE✓</span>
                      </div>
                    </div>
                  </div>





                  {/* Hot fixtures download dashboard section */}
                  <div className="bg-[#111827] rounded-xl border border-slate-800 p-5 shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                      <h4 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-400" /> Hot forecast sheets this fixture week
                      </h4>
                      <button
                        onClick={() => setActiveSubTab('codes')}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider transition font-mono"
                      >
                        Browse all sheets →
                      </button>
                    </div>

                    <div className="divide-y divide-slate-800/80">
                      {db.pool_codes.slice(0, 3).map((code) => {
                        const bookmaker = db.bookmakers.find(b => b.id === code.bookmaker_id);
                        const week = db.pool_weeks.find(w => w.id === code.pool_week_id);
                        const isDownloaded = myDownloads.some(d => d.pool_code_id === code.id);
                        const isPremium = code.access_level === 'premium';
                        const isLocked = isPremium && activePlan?.id === 'plan-free' && currentUser.role !== 'admin';

                        return (
                          <div key={code.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 font-mono text-center flex items-center justify-center font-black text-sm text-emerald-400 shadow-md">
                                {bookmaker?.name[0].toUpperCase()}
                              </div>
                              <div>
                                <span className="text-sm font-extrabold text-white block uppercase tracking-wide">{bookmaker?.name} VIP Forecast Codes</span>
                                <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
                                  Aussie Season Week {week?.week_number} • {week?.pool_type.toUpperCase()} Pool Matches
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                              <span className={`text-[10px] font-black font-mono uppercase px-2.5 py-1 rounded ${
                                isPremium ? 'bg-amber-950/85 text-amber-400 border border-amber-900/40' : 'bg-emerald-950/85 text-emerald-400 border border-emerald-900/40'
                              }`}>
                                {code.access_level.toUpperCase()} MODULE
                              </span>

                              <button
                                onClick={() => handleDownloadCode(code)}
                                className={`text-[11.5px] font-bold px-3.5 py-2 rounded-lg transition ${
                                  isLocked
                                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950'
                                    : isDownloaded
                                    ? 'bg-emerald-900/30 text-emerald-350 border border-emerald-800/40'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-700/10'
                                }`}
                              >
                                {isLocked ? (
                                  <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> LOCKED KEY</span>
                                ) : isDownloaded ? (
                                  '✓ VIEW DECRYPTED KEY'
                                ) : (
                                  'DECRYPT CODE-SHEET'
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* SUBTAB 2: POOL CODES BROWSER (DECRYPTORS LIST) */}
              {activeSubTab === 'codes' && (
                <div className="flex flex-col gap-6">
                  
                  {/* Neatly Organized Header Card */}
                  <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col gap-5">
                    
                    {/* Top Row: Search and Pool Type Filter */}
                    <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-550 text-slate-500">
                          <Search className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          placeholder="Search codes (e.g. Bet9ja, sporty)..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full text-xs font-sans p-3 pl-9 border border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 bg-[#070B14] text-slate-100 placeholder-slate-500"
                        />
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        <span className="text-[10px] text-slate-500 font-mono uppercase font-bold hidden sm:inline">TYPE:</span>
                        <select
                          value={codeTypeFilter}
                          onChange={(e) => setCodeTypeFilter(e.target.value as any)}
                          className="bg-[#070B14] border border-slate-800 text-xs text-slate-300 py-2.5 px-3 rounded-lg focus:outline-none focus:border-emerald-500 font-bold"
                        >
                          <option value="all">ALL POOL CODES TYPES</option>
                          <option value="uk">UK POOL MATCHES</option>
                          <option value="aussie">AUSSIE LEAGUE POOLS</option>
                          <option value="international">INTERNATIONAL MATCH FIXTURES</option>
                        </select>
                      </div>
                    </div>

                    {/* Bottom Row: Neat Bookie Filters */}
                    <div className="border-t border-slate-800/50 pt-4 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400">
                          ⚡ Quick Bookmaker Selection:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <button
                          onClick={() => setBookmakerFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            bookmakerFilter === 'all'
                              ? 'bg-emerald-600 text-white border-emerald-500 font-extrabold shadow-sm shadow-emerald-955/40'
                              : 'bg-[#070B14] text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          Show All
                        </button>
                        {db.bookmakers.filter(b => b.is_active).map(bm => {
                          const isSelected = bookmakerFilter === bm.id;
                          let activeStyle = "bg-emerald-600 text-white border-emerald-500";
                          
                          const lowercaseName = bm.name.toLowerCase();
                          if (lowercaseName.includes('9ja')) {
                            activeStyle = "bg-emerald-600 text-white border-emerald-500";
                          } else if (lowercaseName.includes('sporty')) {
                            activeStyle = "bg-rose-600 text-white border-rose-500";
                          } else if (lowercaseName.includes('king')) {
                            activeStyle = "bg-blue-600 text-white border-blue-500";
                          } else if (lowercaseName.includes('msport')) {
                            activeStyle = "bg-amber-600 text-slate-950 border-amber-500";
                          }

                          return (
                            <button
                              key={bm.id}
                              onClick={() => setBookmakerFilter(bm.id)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border uppercase ${
                                isSelected 
                                  ? `${activeStyle} font-black shadow-md` 
                                  : 'bg-[#070B14] text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                              }`}
                            >
                              {bm.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Clean List Items Container */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="font-extrabold text-white text-xs tracking-widest uppercase font-mono flex items-center gap-1.5">
                        <span>📋 Neat Pool Codes Directory</span>
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Showing {filteredCodes.length} matches
                      </span>
                    </div>

                    {filteredCodes.length === 0 ? (
                      <div className="text-center py-16 bg-[#111827] border border-slate-800 rounded-2xl p-5 text-slate-400 font-mono text-xs">
                        No active pool fixtures or code sheets found matching the active bookmaker filters.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3.5">
                        {filteredCodes.map((code) => {
                          const bookmaker = db.bookmakers.find(b => b.id === code.bookmaker_id);
                          const week = db.pool_weeks.find(w => w.id === code.pool_week_id);
                          const isDownloaded = myDownloads.some(d => d.pool_code_id === code.id);
                          const isPremium = code.access_level === 'premium';
                          const isLocked = isPremium && activePlan?.id === 'plan-free' && currentUser.role !== 'admin';
                          
                          const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
                          const dateString = new Date(code.created_at).toLocaleDateString('en-US', options);
                          
                          // Determine bookie active styles
                          const norm = (bookmaker?.name || '').toLowerCase();
                          let borderLeft = 'border-l-slate-700';
                          let bgBadge = 'bg-slate-900 border-slate-800 text-slate-300';
                          if (norm.includes('9ja')) {
                            borderLeft = 'border-l-emerald-500';
                            bgBadge = 'bg-emerald-950/80 border-emerald-900/60 text-emerald-400';
                          } else if (norm.includes('sporty')) {
                            borderLeft = 'border-l-rose-500';
                            bgBadge = 'bg-rose-950/80 border-rose-900/60 text-rose-400';
                          } else if (norm.includes('king')) {
                            borderLeft = 'border-l-blue-500';
                            bgBadge = 'bg-blue-950/80 border-blue-900/60 text-blue-400';
                          } else if (norm.includes('msport')) {
                            borderLeft = 'border-l-amber-500';
                            bgBadge = 'bg-amber-955/80 border-amber-900/60 text-amber-500';
                          }

                          return (
                            <div
                              key={code.id}
                              className={`bg-[#111827] border ${isAlreadyUnlocked(code.id) ? 'border-emerald-500/25' : 'border-slate-800/80'} rounded-xl p-4 flex flex-col md:flex-row gap-5 items-stretch md:items-center justify-between transition-all hover:bg-slate-900/30 font-sans border-l-4 ${borderLeft} relative`}
                            >
                              {/* Left & Middle details: Bookmaker, Week, fixture parameters */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
                                
                                {/* Bookie Primary Info */}
                                <div className="sm:w-44 shrink-0 flex flex-col gap-1">
                                  <span className={`text-[10px] font-mono font-black tracking-widest px-2.5 py-0.5 rounded border inline-block text-center uppercase ${bgBadge}`}>
                                    {bookmaker?.name || 'BOOKMAKER'}
                                  </span>
                                  <span className="text-[9.5px] text-slate-500 font-mono block text-center uppercase md:text-left md:pl-1">
                                    {bookmaker?.country || 'International'} Fixtures
                                  </span>
                                </div>

                                {/* Main Title Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="font-extrabold text-[#38BDF8] text-sm md:text-sm tracking-wide select-text leading-tight uppercase">
                                      Week {week?.week_number || 49} pool match fixtures codes
                                    </h4>
                                    <span className={`text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                                      isPremium
                                        ? 'bg-amber-955/80 text-amber-400 border-amber-900/35 bg-amber-950/65'
                                        : 'bg-emerald-955/80 text-emerald-400 border-emerald-900/35 bg-emerald-950/65'
                                    }`}>
                                      {code.access_level.toUpperCase()}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400 text-[10px] font-mono">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                      Released {dateString}
                                    </span>
                                    <span className="text-slate-700">•</span>
                                    <span className="text-[9px] text-emerald-400 font-bold uppercase">{week?.pool_type} LEAGUE POOL</span>
                                    <span className="text-slate-700">•</span>
                                    <span className="text-slate-500">unzipped {code.download_count} times</span>
                                  </div>
                                </div>

                              </div>

                              {/* Codes content or decryption controls container */}
                              <div className="md:w-80 w-full shrink-0 flex flex-col justify-center gap-1.5">
                                {isLocked ? (
                                  <div className="bg-[#070B14] border border-slate-850 p-3 rounded-lg text-amber-500 text-center text-[10px] font-mono flex flex-col items-center gap-1 select-none">
                                    <span className="flex items-center gap-1.5 font-bold">
                                      <Lock className="w-3.5 h-3.5 text-amber-500" /> PREMIUM SHEET SECURED
                                    </span>
                                    <button
                                      onClick={() => setActiveSubTab('subscription')}
                                      className="mt-1.5 w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-[9.5px] py-1.5 px-3 rounded uppercase transition shadow-sm"
                                    >
                                      Upgrade to Reveal Coupon
                                    </button>
                                  </div>
                                ) : isAlreadyUnlocked(code.id) ? (
                                  <div className="bg-[#070B14] border border-slate-850 p-2.5 rounded-lg font-mono text-[11px] text-emerald-400 leading-normal block relative">
                                    <div className="flex justify-between items-center mb-1 pb-1 border-b border-slate-850 text-[9px] text-slate-500 select-none">
                                      <span>🔑 DECRYPTED COUPON LEDGER</span>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(code.codes_content || '');
                                          triggerToast('Pool codes copied to clipboard!', 'success');
                                        }}
                                        className="hover:text-emerald-400 text-slate-500 font-bold flex items-center gap-1 transition-colors"
                                      >
                                        <Copy className="w-2.5 h-2.5" /> COPY
                                      </button>
                                    </div>
                                    <div className="max-h-24 overflow-y-auto select-text pr-1 font-semibold scrollbar-thin scrollbar-thumb-slate-800">
                                      {code.codes_content}
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleDownloadCode(code)}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold uppercase py-3 px-4 rounded-lg transition text-xs flex items-center justify-center gap-2 shadow-sm"
                                  >
                                    <Unlock className="w-4 h-4" />
                                    <span>Decrypt & Reveal Codes</span>
                                  </button>
                                )}
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>

                </div>
              )}

              {/* SUBTAB: POOL CODES (INTERNATIONAL) */}
              {activeSubTab === 'international' && (() => {
                const activeIntl = intlCodes.find(c => c.id === selectedIntlId) || intlCodes[0];

                return (
                  <div className="flex flex-col gap-6" id="intl-codes-arena">
                    {/* Header title mimicking screenshot style */}
                    <div className="border-b border-slate-800 pb-4 mb-2">
                      <h2 className="text-xl font-extrabold tracking-wider text-slate-100 font-mono uppercase">
                        POOL CODES (INTERNATIONAL)
                      </h2>
                    </div>

                    {/* Posts Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {intlCodes.map((item) => {
                        const isSelected = item.id === selectedIntlId;
                        
                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedIntlId(item.id)}
                            className={`flex gap-4 p-3.5 rounded-lg bg-[#111827]/85 border text-left cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? 'border-emerald-500 shadow-md shadow-emerald-500/10 scale-[1.02] bg-[#111827]'
                                : 'border-slate-800/80 hover:border-slate-700/80 hover:bg-[#141E33]'
                            }`}
                          >
                            {/* FastPoolCodes.com style Thumbnail matching screenshot exactly */}
                            <div className="w-28 h-20 shrink-0 rounded bg-gradient-to-br from-[#0B1528] to-[#040810] border border-slate-700/60 p-2 flex flex-col justify-between items-center shadow-inner relative overflow-hidden select-none">
                              {/* Background color filter */}
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_80%)]"></div>
                              
                              {/* Left branding layout for odds/bet365 */}
                              {item.isOddsComparison ? (
                                <div className="absolute inset-0 p-1 flex flex-col justify-between">
                                  <div className="grid grid-cols-3 gap-0.5 text-[7px] font-mono leading-none text-center font-bold text-slate-300">
                                    <span className="bg-[#1E3A8A]/30 px-0.5 py-0.2 rounded font-sans border border-[#3B82F6]/20">9ja</span>
                                    <span className="bg-[#B45309]/30 px-0.5 py-0.2 rounded font-sans border border-[#F59E0B]/20">King</span>
                                    <span className="bg-[#047857]/30 px-0.5 py-0.2 rounded font-sans border border-[#10B981]/20">Sporty</span>
                                  </div>
                                  <div className="text-center my-auto leading-[0.95]">
                                    <span className="text-[7.5px] font-bold text-[#38BDF8] block">WEEK {item.week_number}</span>
                                    <span className="text-[9.5px] font-black text-slate-100 tracking-tighter">ODDS</span>
                                  </div>
                                  <span className="text-[6.5px] text-slate-400 text-center font-mono block">fastpoolcodes.com</span>
                                </div>
                              ) : (
                                <div className="absolute inset-0 p-1 flex flex-col justify-between">
                                  {/* bet365 emerald badge */}
                                  <div className="flex justify-between items-center">
                                    <span className="text-[7px] font-mono text-emerald-400 tracking-widest font-black uppercase bg-emerald-950/40 px-1 py-0.2 rounded border border-emerald-900/30">
                                      bet365
                                    </span>
                                    <span className="text-[7px] text-slate-400 font-mono">W{item.week_number}</span>
                                  </div>
                                  <div className="text-center my-auto leading-none">
                                    <span className="text-[7px] text-slate-400 font-mono tracking-tight block">OFFICIAL CODES</span>
                                    <span className="text-[10px] font-black text-slate-100 tracking-tight font-sans">FastPool</span>
                                  </div>
                                  <span className="text-[6.5px] text-slate-500 text-center font-mono block">fastpoolcodes.com</span>
                                </div>
                              )}
                            </div>

                            {/* Feed Article Information */}
                            <div className="flex flex-col justify-between min-w-0">
                              <h3 className="font-bold text-xs text-slate-100 hover:text-emerald-400 leading-snug tracking-normal line-clamp-2 transition-colors">
                                {item.title}
                              </h3>
                              
                              <div className="flex flex-col gap-1 mt-1 font-mono text-[10px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                                  {item.date}
                                </span>
                                <span className="flex items-center gap-1 text-slate-500">
                                  <MessageSquare className="w-3 h-3 shrink-0" />
                                  <span>{item.comments_count} Comments</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Interactive Active details panel viewport */}
                    {activeIntl && (
                      <div className="mt-4 flex flex-col bg-[#0B0F19] rounded-xl border border-slate-800/80 shadow-2xl overflow-hidden">
                        
                        {/* Upper Details Header */}
                        <div className="p-5 border-b border-slate-850 bg-[#121B2E]/25">
                          <div className="flex flex-wrap gap-2 items-center justify-between pb-2 mb-2 border-b border-slate-800/60 font-mono text-xs text-slate-400">
                            <span className="flex items-center gap-1 bg-emerald-950/60 text-emerald-400 font-black px-2.5 py-0.5 rounded border border-emerald-900/30">
                              ⚡ Week {activeIntl.week_number} International Feed
                            </span>
                            <span className="text-slate-450 italic">Published: {activeIntl.date}</span>
                          </div>
                          
                          <h2 className="text-sm md:text-base font-black text-slate-100 leading-snug">
                            {activeIntl.title}
                          </h2>
                        </div>

                        {/* Middle Workspace depending on post type */}
                        <div className="p-5 bg-slate-950/40">
                          {activeIntl.isOddsComparison ? (
                            <div className="flex flex-col gap-4">
                              <div className="flex justify-between items-center bg-slate-900/10 border border-slate-800 p-3 rounded">
                                <span className="text-xs text-slate-400 font-mono">
                                  Comparing relative 1X2 coupon multiplier weights across premium betting agencies.
                                </span>
                                <span className="text-[10px] bg-emerald-950/60 border border-emerald-900 text-emerald-400 font-mono px-2 py-0.5 rounded">
                                  HIGHEST ODDS HIGHLIGHTED
                                </span>
                              </div>

                              {/* Matrix Comparison Table */}
                              <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
                                <table className="w-full text-left font-mono text-xs divide-y divide-slate-800">
                                  <thead className="bg-[#1E293B]/40 text-slate-300 font-extrabold uppercase text-[10px] tracking-wider divide-x divide-slate-800">
                                    <tr>
                                      <th className="p-3">Match</th>
                                      <th className="p-3">Fixture Teams</th>
                                      <th className="p-3 text-center">Bet9ja</th>
                                      <th className="p-3 text-center">BetKing</th>
                                      <th className="p-3 text-center">SportyBet</th>
                                      <th className="p-3 text-center">MSport</th>
                                      <th className="p-3 text-center">1xBet</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-850 bg-[#111827]/30">
                                    {activeIntl.oddsData?.map((match) => (
                                      <tr key={match.matchNo} className="hover:bg-slate-900/30 divide-x divide-slate-850">
                                        <td className="p-3 text-slate-450 font-black text-center">{match.matchNo}</td>
                                        <td className="p-3 font-bold text-slate-200">{match.teams}</td>
                                        
                                        {/* Bet9ja */}
                                        <td className="p-3 text-center text-slate-300">
                                          <span className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800">{match.bet9ja}</span>
                                        </td>
                                        
                                        {/* BetKing */}
                                        <td className="p-3 text-center text-slate-300">
                                          <span className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800">{match.betking}</span>
                                        </td>
                                        
                                        {/* SportyBet */}
                                        <td className="p-3 text-center text-slate-300">
                                          <span className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800">{match.sportybet}</span>
                                        </td>
                                        
                                        {/* MSport */}
                                        <td className="p-3 text-center text-slate-300">
                                          <span className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800">{match.msport}</span>
                                        </td>
                                        
                                        {/* 1xBet */}
                                        <td className="p-3 text-center text-emerald-400 font-extrabold bg-emerald-950/10">
                                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-900/50">{match.oneXbet} 🔥</span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                                
                                {/* Segment 1: Decryption Sequence key */}
                                <div className="bg-[#111827] border border-slate-850 rounded p-4 flex flex-col justify-between gap-2 text-left">
                                  <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-black block">DECRYPT ALGORITHM</span>
                                    <span className="font-extrabold text-slate-200 block mt-1 tracking-wider text-sm">
                                      {activeIntl.codeDetails?.sequence}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(activeIntl.codeDetails?.sequence || '');
                                      triggerToast('Copied bet365 validation code to clipboard!', 'success');
                                    }}
                                    className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white py-1.5 px-3 rounded text-[10.5px] transition flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                                  >
                                    <Copy className="w-3.5 h-3.5" /> Copy Sequence
                                  </button>
                                </div>

                                {/* Segment 2: Key Numbers list */}
                                <div className="bg-[#111827] border border-slate-850 rounded p-4 text-left">
                                  <span className="text-[10px] text-slate-500 uppercase font-black block">VERIFIED LCR KEY NUMBERS</span>
                                  <div className="flex flex-wrap gap-2 mt-2.5">
                                    {activeIntl.codeDetails?.keyNumbers.map((num) => (
                                      <span 
                                        key={num}
                                        className="w-9 h-9 rounded-full bg-[#004D40]/30 text-emerald-400 border border-emerald-900/40 flex items-center justify-center font-black select-none text-xs"
                                      >
                                        {num}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Segment 3: Decoder Coefficient */}
                                <div className="bg-[#111827] border border-slate-850 rounded p-4 flex flex-col justify-between gap-1 text-left">
                                  <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-black block">COEFFICIENT KEY</span>
                                    <span className="font-bold text-[#E11D48] text-xs mt-1 block">
                                      {activeIntl.codeDetails?.decoderKey}
                                    </span>
                                  </div>
                                  <span className="text-[9.5px] text-slate-400 italic leading-snug">
                                    This verification matrix is authenticated for UK/Aussie fixtures calculation.
                                  </span>
                                </div>

                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interactive Share social bar matching exact structure in screenshot */}
                        <div className="p-4 bg-[#111827] border-t border-slate-850 flex items-center justify-between flex-wrap gap-4 select-none">
                          <span className="text-xs uppercase font-black tracking-widest text-slate-400 font-mono">
                            SHARE CODES
                          </span>

                          <div className="flex flex-wrap items-center gap-3">
                            {/* Like Toggle Counter */}
                            <button
                              onClick={() => {
                                handleLikeIntlCode(activeIntl.id);
                                triggerToast(activeIntl.isLiked ? 'Removed recommendation.' : 'Thank you for your rating recommendation!', 'success');
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-bold transition duration-150 cursor-pointer ${
                                activeIntl.isLiked
                                  ? 'bg-rose-950/30 border-rose-600/50 text-rose-400'
                                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                              }`}
                            >
                              <span>👍 {activeIntl.likes}</span>
                            </button>

                            {/* Facebook Box with royal blue branding color */}
                            <button
                              onClick={() => {
                                triggerToast('Sharing comparison sheet to Facebook...', 'info');
                                navigator.clipboard.writeText(`Check out these professional Pool Codes on FastPoolCodes: ${activeIntl.title}`);
                              }}
                              className="w-10 h-8 rounded bg-[#1877F2] hover:bg-[#166FE5] text-white flex items-center justify-center transition shadow-md hover:scale-[1.05] cursor-pointer font-black"
                              title="Share on Facebook"
                            >
                              <span>f</span>
                            </button>

                            {/* Twitter Box with light blue branding color */}
                            <button
                              onClick={() => {
                                triggerToast('Sharing comparison sheet to Twitter/X...', 'info');
                                navigator.clipboard.writeText(`Verified Pool Codes: ${activeIntl.title}`);
                              }}
                              className="w-10 h-8 rounded bg-[#1DA1F2] hover:bg-[#1A91DA] text-white flex items-center justify-center transition shadow-md hover:scale-[1.05] cursor-pointer font-black"
                              title="Share on Twitter"
                            >
                              <span>𝕏</span>
                            </button>

                            {/* WhatsApp Box with green branding color */}
                            <button
                              onClick={() => {
                                triggerToast('Preparing WhatsApp direct share contents...', 'info');
                                navigator.clipboard.writeText(`*FastPool Codes Update* ⚽\n${activeIntl.title}\nPublished on ${activeIntl.date}`);
                              }}
                              className="w-10 h-8 rounded bg-[#25D366] hover:bg-[#20BA56] text-white flex items-center justify-center transition shadow-md hover:scale-[1.05] cursor-pointer font-black"
                              title="Share on WhatsApp"
                            >
                              <span>✆</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })()}

              {/* SUBTAB 3: RESULTS CENTER OF GAME PAYOUTS */}
              {activeSubTab === 'results' && (() => {
                const activeResult = db.pool_results.find(r => r.id === selectedResultId) || db.pool_results[0];
                const selectedWeek = db.pool_weeks.find(w => w.id === activeResult?.pool_week_id);

                return (
                  <div className="flex flex-col gap-6" id="pool-results-arena">
                    {/* Header Banner */}
                    <div className="border-b border-slate-800 pb-4 mb-2">
                      <h2 className="text-xl font-extrabold tracking-wider text-slate-100 font-mono uppercase">
                        POOL RESULTS
                      </h2>
                    </div>

                    {/* Posts Browser Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {db.pool_results.map((res) => {
                        const isSelected = res.id === selectedResultId;
                        const weekNo = res.week_number || 43;
                        const typeLabel = (res.pool_type || 'uk').toUpperCase();
                        
                        // Parse mock display dates from publication/creation
                        const displayDate = new Date(res.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        });

                        return (
                          <div 
                            key={res.id}
                            onClick={() => setSelectedResultId(res.id)}
                            className={`flex gap-4 p-3 rounded-lg bg-[#111827]/85 border text-left cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? 'border-emerald-500 shadow-md shadow-emerald-500/10 scale-[1.02] bg-[#111827]' 
                                : 'border-slate-800/80 hover:border-slate-700/80 hover:bg-[#141E33]'
                            }`}
                          >
                            {/* FastPoolCodes.com Style Thumbnail */}
                            <div className="w-28 h-20 shrink-0 rounded bg-gradient-to-br from-[#0F1D36] to-[#070B14] border border-slate-700/60 p-2 flex flex-col justify-between items-center shadow-inner relative overflow-hidden select-none">
                              {/* Background ambient texture */}
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_80%)]"></div>
                              
                              <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest bg-slate-900/60 px-1 py-0.5 rounded border border-slate-800/40 z-10">
                                Week {weekNo}
                              </span>
                              
                              <div className="flex flex-col items-center z-10 leading-none my-0.5">
                                <span className="text-[10px] font-mono tracking-tight font-black text-emerald-400">POOL</span>
                                <span className="text-[11px] font-sans font-black tracking-wider text-slate-100">RESULT</span>
                              </div>
                              
                              <span className="text-[7.5px] font-mono text-slate-500 tracking-tight z-10">
                                fastpoolcodes.com
                              </span>
                            </div>

                            {/* Post Meta Side Info */}
                            <div className="flex flex-col justify-between min-w-0">
                              <h3 className="font-bold text-xs text-slate-100 hover:text-emerald-450 leading-snug tracking-normal line-clamp-2 transition-colors">
                                {res.title || `Week ${weekNo} ${typeLabel} Pool results: Pool results for the week`}
                              </h3>
                              
                              <div className="flex flex-col gap-1 mt-1 font-mono text-[10.5px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                                  {displayDate}
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                                  <MessageSquare className="w-3 h-3 text-slate-500" />
                                  <span>{res.comments_count || 0} Comments</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Interactive Excel/Spreadsheet Sheet Component */}
                    {activeResult && (
                      <div className="mt-6 flex flex-col bg-[#0B0F19] rounded-xl border border-slate-800/80 shadow-2xl overflow-hidden">
                        {/* Fake spreadsheet browser column index labels row: A B C D E F G H I j */}
                        <div className="flex bg-[#1E293B]/70 border-b border-slate-800 text-[10.5px] font-mono text-slate-400 select-none text-center">
                          <div className="w-[45px] shrink-0 border-r border-slate-800 py-1.5 bg-slate-900/40"></div>
                          <div className="flex-1 min-w-[70px] border-r border-slate-800 py-1.5">A</div>
                          <div className="flex-[3] min-w-[150px] border-r border-slate-800 py-1.5">B</div>
                          <div className="flex-[3] min-w-[150px] border-r border-slate-800 py-1.5">C</div>
                          <div className="flex-1.5 min-w-[80px] border-r border-slate-800 py-1.5">D</div>
                          <div className="flex-2 min-w-[110px] border-r border-slate-800 py-1.5">E</div>
                          <div className="flex-2 min-w-[110px] py-1.5">F</div>
                        </div>

                        {/* Spreadsheet Grid Container */}
                        <div className="flex flex-col">
                          
                          {/* Row 1: Tai-Chi green title banner mockup! */}
                          <div className="flex border-b border-slate-800">
                            {/* Spreadsheet row number index column */}
                            <div className="w-[45px] shrink-0 bg-[#0F172A] border-r border-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-500 select-none">
                              1
                            </div>
                            
                            {/* The giant emerald center header */}
                            <div className="flex-grow bg-[#004D40] text-slate-100 flex flex-col items-center justify-center py-6 px-10 text-center relative">
                              {/* Glowing overlay */}
                              <div className="absolute inset-0 bg-[#10B981]/15 mix-blend-overlay"></div>
                              <h1 className="font-black text-xl md:text-2xl tracking-widest text-[#FFF] uppercase leading-none drop-shadow-md">
                                {activeResult.pool_type?.toUpperCase() === 'AUSSIE' ? 'AUSSIE' : 'UK'} POOL DRAW SHEET
                              </h1>
                              <p className="text-xs tracking-wider text-emerald-300 font-bold mt-1.5 drop-shadow-sm font-mono uppercase">
                                OFFICIAL RECORD OF CONFIRMED fixtures SCORE OUTCOMES
                              </p>
                            </div>
                          </div>

                          {/* Row 2: Metadata labels sheet */}
                          <div className="flex border-b border-slate-800">
                            <div className="w-[45px] shrink-0 bg-[#0F172A] border-r border-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-500 select-none">
                              2
                            </div>
                            
                            {/* Spreadsheet cell fields replica */}
                            <div className="flex-grow grid grid-cols-2 md:grid-cols-4 bg-[#111827] text-xs divide-x divide-slate-800 font-mono">
                              <div className="p-3.5 flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 uppercase">Season Year:</span>
                                <span className="font-extrabold text-[#FFF]">{activeResult.season_year || 2026} season</span>
                              </div>
                              <div className="p-3.5 flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 uppercase">ACTIVE Week:</span>
                                <span className="font-extrabold text-[#10B981]">WEEK #{activeResult.week_number || 43}</span>
                              </div>
                              <div className="p-3.5 flex flex-col gap-1">
                                <span className="text-[10px] text-slate-450 text-slate-400 uppercase">Fixture Date:</span>
                                <span className="font-bold text-slate-200">{activeResult.fixture_date || selectedWeek?.fixture_date || 'N/A'}</span>
                              </div>
                              <div className="p-3.5 flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 uppercase">DECLARED STATE:</span>
                                <span className="font-black px-2 py-0.5 rounded bg-amber-950/20 text-amber-400 border border-amber-900/40 text-center w-fit">
                                  VERIFIED OK
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Row 3: Column header tags */}
                          <div className="flex border-b border-slate-800 bg-slate-900/60 font-mono text-[11px] font-extrabold text-slate-300">
                            <div className="w-[45px] shrink-0 bg-[#0F172A] border-r border-slate-800 flex items-center justify-center text-[10px] text-slate-500 select-none">
                              3
                            </div>
                            <div className="flex-1 min-w-[70px] border-r border-slate-800 p-2 text-center uppercase tracking-wider bg-slate-950/25">Match No</div>
                            <div className="flex-[3] min-w-[150px] border-r border-slate-800 p-2 text-left pl-4 uppercase tracking-wider">Home Team Selection</div>
                            <div className="flex-[3] min-w-[150px] border-r border-slate-800 p-2 text-left pl-4 uppercase tracking-wider">Away Team Companion</div>
                            <div className="flex-1.5 min-w-[80px] border-r border-slate-800 p-2 text-center uppercase tracking-wider">Score FT</div>
                            <div className="flex-2 min-w-[110px] border-r border-slate-800 p-2 text-center uppercase tracking-wider bg-slate-950/25">POOL Outcome</div>
                            <div className="flex-2 min-w-[110px] p-2 text-center uppercase tracking-wider">PAY Status</div>
                          </div>

                          {/* Rows: Results rows representing the actual football matches */}
                          {(activeResult.results_table || []).map((row, idx) => {
                            const isDraw = row.outcome === 'DRAW';
                            const rowId = idx + 4; // Excel row numbering starts at row 4 now!
                            
                            return (
                              <div 
                                key={idx} 
                                className={`flex border-b border-slate-800 font-mono text-xs items-stretch transition-colors ${
                                  isDraw ? 'bg-emerald-950/10' : 'hover:bg-slate-900/35'
                                }`}
                              >
                                {/* Excel row number prefix */}
                                <div className="w-[45px] shrink-0 bg-[#0F172A] border-r border-slate-800 flex items-center justify-center text-[10px] text-slate-500 select-none shrink-0">
                                  {rowId}
                                </div>
                                
                                {/* A: Match No */}
                                <div className="flex-1 min-w-[70px] border-r border-slate-800 p-3 text-center text-slate-400 font-black flex items-center justify-center bg-slate-950/15">
                                  {row.matchNo}
                                </div>
                                
                                {/* B: Home Team */}
                                <div className="flex-[3] min-w-[150px] border-r border-slate-800 p-3 text-left pl-4 font-bold text-slate-100 flex items-center">
                                  {row.homeTeam}
                                </div>

                                {/* C: Away Team */}
                                <div className="flex-[3] min-w-[150px] border-r border-slate-800 p-3 text-left pl-4 font-bold text-slate-100 flex items-center">
                                  {row.awayTeam}
                                </div>

                                {/* D: Score FT */}
                                <div className="flex-1.5 min-w-[80px] border-r border-slate-800 p-3 text-center text-[#10B981] font-extrabold flex items-center justify-center">
                                  {row.fullTimeScore}
                                </div>

                                {/* E: Outcome Badge */}
                                <div className="flex-2 min-w-[110px] border-r border-slate-800 p-3 text-center flex items-center justify-center bg-slate-950/15">
                                  {isDraw ? (
                                    <span className="w-full bg-[#E11D48] text-[#FFF] font-black tracking-widest text-[9.5px] px-2.5 py-1 rounded-sm shadow-sm select-none uppercase">
                                      {row.outcome}
                                    </span>
                                  ) : (
                                    <span className="w-full bg-slate-800 text-slate-400 font-bold tracking-tight text-[9.5px] px-2.5 py-1 rounded-sm select-none">
                                      {row.outcome}
                                    </span>
                                  )}
                                </div>

                                {/* F: Pay status */}
                                <div className="flex-2 min-w-[110px] p-3 text-center flex items-center justify-center font-bold text-[10px]">
                                  {row.payoutStatus === 'CLEARED' ? (
                                    <span className="text-emerald-400 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      CLEARED
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 uppercase">{row.payoutStatus}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Raw representation box */}
                          <div className="flex border-b border-slate-800 bg-[#070C15]/80">
                            <div className="w-[45px] shrink-0 bg-[#0F172A] border-r border-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-500 select-none">
                              {/* Auto increment row index */}
                              {(activeResult.results_table || []).length + 4}
                            </div>
                            <div className="flex-grow p-4">
                              <span className="text-[10px] text-slate-400 font-mono block mb-2 uppercase tracking-wide">
                                📝 PLAIN DOCUMENT SOURCE ARCHIVE:
                              </span>
                              <pre className="p-3 bg-[#02050A] text-[#10B981] font-mono text-[11px] rounded border border-slate-850 overflow-x-auto whitespace-pre-wrap select-text text-left">
                                {activeResult.results_content}
                              </pre>
                            </div>
                          </div>

                        </div>

                        {/* Excel bottom layout row button mimicking 'PRINT NOW' yellow buttons */}
                        <button 
                          onClick={() => {
                            triggerToast(`Preparing print pool draw result ledger for Week ${activeResult.week_number || 43}...`, 'success');
                            window.print();
                          }}
                          className="w-full bg-[#FFE600] hover:bg-[#E2CC00] text-[#0A0F1D] font-black text-xs py-4 transition-colors duration-150 uppercase tracking-widest flex items-center justify-center gap-2 select-none cursor-pointer border-t border-slate-850"
                        >
                          <span>PRINT RESULTS LEDGER SHEET</span>
                          <span className="text-sm">🖨️</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* SUBTAB 4: SUBSCRIPTION BILLING MATRIX */}
              {activeSubTab === 'subscription' && (
                <div className="flex flex-col gap-6">
                  
                  {/* Subscriber license identity display card */}
                  <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap gap-4 items-center justify-between">
                    <div>
                      <span className="text-[9.5px] font-mono text-emerald-400 block uppercase tracking-wide font-extrabold">USER BILLING VERIFICATIONS</span>
                      <h4 className="text-base font-black text-white mt-1 uppercase tracking-wide">
                        Licensee: {currentUser.username} ({currentUser.email})
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Role Group: <span className="text-[#10B981] font-mono font-bold uppercase">{currentUser.role}</span> • Verification Link Status: <span className="text-amber-400 font-mono uppercase font-black">{currentUser.status}</span>
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950/90 text-white rounded-xl border border-[#334155]/20 text-xs font-mono flex flex-col items-end">
                      <div>PERMITTED LEVEL: <span className="text-amber-400 font-extrabold uppercase">{activePlan?.name}</span></div>
                      {activeSubscription && (
                        <span className="text-[10px] text-slate-400 mt-1 text-right">Receipt Ref: {activeSubscription.payment_ref}</span>
                      )}
                    </div>
                  </div>

                  {/* High fidelity pricing layout */}
                  <div className="border border-slate-800/80 p-5 rounded-xl bg-[#111827] shadow-lg">
                    <h3 className="font-extrabold text-[#10B981] text-xs uppercase tracking-wider font-mono mb-5 flex items-center gap-1.5">
                      ★ UPGRADE LICENSE: UNLOCK STADIUM VIP MEMBERSHIPS
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {db.subscription_plans.filter(p => p.id !== 'plan-free').map((p) => {
                        const isCurrentPlan = activePlan?.id === p.id;
                        return (
                          <div
                            key={p.id}
                            className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 ${
                              isCurrentPlan
                                ? 'ring-2 ring-emerald-500 border-emerald-555 bg-[#122A1E]/30'
                                : 'border-slate-800 bg-[#070B14]/80 hover:border-slate-700'
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-black uppercase text-white tracking-wide">{p.name} PRO</span>
                                {isCurrentPlan && (
                                  <span className="bg-emerald-950 text-emerald-400 text-[8.5px] font-black px-2.5 py-1 rounded border border-emerald-800 uppercase font-mono">
                                    ACTIVE✓
                                  </span>
                                )}
                              </div>

                              <p className="text-[11.5px] text-slate-350 mt-3 min-h-[40px] leading-relaxed">
                                {p.description}
                              </p>

                              <div className="mt-5 pb-5 border-b border-slate-800">
                                <span className="text-2xl font-mono font-black text-emerald-400">
                                  ₦{p.price.toLocaleString()}
                                </span>
                                <span className="text-[10.5px] text-slate-400 font-mono"> / {p.billing_cycle.toUpperCase()}</span>
                              </div>

                              {/* Pro perks specs indicators */}
                              <div className="mt-5 flex flex-col gap-3.5 text-xs text-slate-300 font-mono">
                                <div className="flex items-center gap-1.5">
                                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span>Premium decryption key: {p.has_premium_codes ? 'YES' : 'NO'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span>Bookmakers capacity limits: max {p.max_bookmakers}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span>Automated Alerts Telecom: Yes</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => buySubscription(p.id)}
                              disabled={isCurrentPlan || currentUser.role === 'admin'}
                              className={`w-full mt-6 text-xs font-black uppercase py-3 rounded-lg transition-all ${
                                isCurrentPlan
                                  ? 'bg-emerald-900/40 text-emerald-400 font-bold border border-emerald-800/40 pointer-events-none'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-850/20 active:scale-95'
                              }`}
                            >
                              {isCurrentPlan ? '✓ Subscribed Active' : `Buy ${p.name}`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 5: SYSTEM NOTIFICATION LIVE TELETEX */}
              {activeSubTab === 'notifications' && (
                <div className="flex flex-col gap-5">
                  <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-lg flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <h3 className="font-extrabold text-[#10B981] text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                        🔔 LIVE STADIUM TELECOM ALERT BROADCASTS ({myNotifications.length} feeds)
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Log system signals, score disclosures, and verification notifications.
                      </p>
                    </div>

                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-mono font-bold uppercase transition"
                    >
                      Clear Alert mailbox read log →
                    </button>
                  </div>

                  <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-850">
                    {myNotifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-450 text-xs italic font-mono text-slate-450">
                        Teletex alerts inbox is currently empty. No stadium signals broadcast yet.
                      </div>
                    ) : (
                      myNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-5 transition-all flex items-start gap-4 justify-between ${
                            notif.is_read ? 'bg-[#0E1424]/40 opacity-70' : 'bg-emerald-950/20'
                          }`}
                        >
                          <div className="flex gap-3 items-start">
                            <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${notif.is_read ? 'bg-slate-700' : 'bg-emerald-400 animate-pulse'}`}></span>
                            <div>
                              <span className="font-black text-xs text-white uppercase tracking-wider block">{notif.title}</span>
                              <p className="text-slate-300 text-xs mt-1.5 leading-normal font-sans">{notif.body}</p>
                              <span className="text-[10px] text-slate-500 font-mono mt-2 block">
                                Trigger Timestamp: {new Date(notif.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] uppercase font-mono bg-[#070B14] border border-slate-800 px-2 py-0.5 rounded text-slate-400 shrink-0">
                            {notif.type.toUpperCase()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB 6: KEY DOWNLOAD ACCOUNTABILITY REVIEWS */}
              {activeSubTab === 'downloads' && (
                <div className="flex flex-col gap-5">
                  <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
                    <div className="absolute right-4 top-4 text-emerald-500/10">
                      <History className="w-12 h-12" />
                    </div>
                    <h3 className="font-extrabold text-[#10B981] text-xs uppercase tracking-wider font-mono">
                      📥 ACCESSED BOOKMAKER KEYS LOGS
                    </h3>
                    <p className="text-xs text-slate-350 leading-relaxed max-w-xl mt-1">
                      Historical tracking of verified decrypted codesheet unlocks. Protected against mechanical scrape crawlers.
                    </p>
                  </div>

                  <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#070B14] border-b border-slate-850 text-slate-450 font-mono text-[9.5px] uppercase tracking-wider text-slate-400">
                          <tr>
                            <th className="p-4">Simulated Key ID</th>
                            <th className="p-4">Decrypted Bookmaker Match</th>
                            <th className="p-4">Key Verification Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {myDownloads.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="p-8 text-center text-slate-450 italic font-mono text-slate-500">
                                You have not unlocked any game coupon key decryptions yet today. Keep scouting!
                              </td>
                            </tr>
                          ) : (
                            myDownloads.map((dl) => {
                              const codeRecord = db.pool_codes.find(c => c.id === dl.pool_code_id);
                              const bookmaker = db.bookmakers.find(b => b.id === codeRecord?.bookmaker_id);
                              return (
                                <tr key={dl.id} className="hover:bg-[#070B14]/40 font-mono text-[11px] text-slate-300">
                                  <td className="p-4 text-emerald-400 font-bold">{dl.id}</td>
                                  <td className="p-4 font-sans text-slate-100 text-xs font-black uppercase tracking-wide">{bookmaker?.name || 'GENERIC'} CODESHEET</td>
                                  <td className="p-4 text-slate-400">{new Date(dl.downloaded_at).toLocaleString()}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 7: USER PROFILE INFORMATION */}
              {activeSubTab === 'profile' && (
                <div className="flex flex-col gap-6">
                  <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-extrabold text-[#10B981] text-xs uppercase tracking-wider font-mono border-b border-slate-820 mb-4 pb-2.5 flex items-center gap-2">
                        👤 USER PROFILE DETAILS
                      </h3>

                      <div className="flex flex-col gap-4 font-mono text-xs">
                        <div>
                          <span className="text-slate-500 select-none text-[10px] block uppercase">Simulated UUID Handle Code</span>
                          <p className="font-bold text-slate-200 mt-1">{currentUser.id}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 select-none text-[10px] block uppercase">Registrar Email ID</span>
                          <p className="font-bold text-slate-200 mt-1">{currentUser.email}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 select-none text-[10px] block uppercase">Emergency Phone Line</span>
                          <p className="font-bold text-slate-200 mt-1">{currentUser.phone || 'NO SECURE PHONE SPECIFIED'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-[#10B981] text-xs uppercase tracking-wider font-mono border-b border-slate-820 mb-4 pb-2.5 flex items-center gap-2">
                        🔐 PLATFORM SESSION SECURITY ENUM
                      </h3>

                      <div className="flex flex-col gap-4 font-mono text-xs">
                        <div>
                          <span className="text-slate-500 select-none text-[10px] block uppercase">Privilege Level ENUM</span>
                          <p className="text-emerald-400 font-extrabold mt-1 text-xs uppercase">{currentUser.role}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 select-none text-[10px] block uppercase">Client Link Status</span>
                          <span className="inline-block mt-1 uppercase font-mono text-[10px] font-black text-emerald-450 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-900">
                            {currentUser.status}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 select-none text-[10px] block uppercase">License Email Handshake time</span>
                          <p className="text-slate-400 mt-1">
                            {currentUser.email_verified_at ? new Date(currentUser.email_verified_at).toUTCString() : 'Pending handshakes verify'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );

  // Render beautiful mock graphic banner mimicking the requested POOL CODES screenshot style
  function renderFastPoolThumbnail(bookmakerName: string) {
    const lowercaseName = bookmakerName.toLowerCase();
    
    // Choose base color scheme
    let cardBg = "from-[#0F172A] via-[#090D1A] to-[#0A0F1D]";
    let brandColor = "text-emerald-400";
    let accentText = "BET9JA & CO";
    
    if (lowercaseName.includes('9ja')) {
      cardBg = "from-emerald-950 via-[#0C150E] to-[#0A111F]";
      brandColor = "text-emerald-400";
      accentText = "BET9JA MATCH";
    } else if (lowercaseName.includes('sporty')) {
      cardBg = "from-rose-950 via-[#1A0C0E] to-[#0A111F]";
      brandColor = "text-rose-500";
      accentText = "SPORTYBET MATCH";
    } else if (lowercaseName.includes('king')) {
      cardBg = "from-blue-950 via-[#0B1526] to-[#0A111F]";
      brandColor = "text-blue-400";
      accentText = "BETKING MATCH";
    } else if (lowercaseName.includes('msport')) {
      cardBg = "from-amber-950 via-[#19150C] to-[#0A111F]";
      brandColor = "text-amber-500";
      accentText = "MSPORT MATCH";
    }

    return (
      <div className={`md:w-56 w-full h-40 bg-gradient-to-br ${cardBg} border-r md:border-b-0 border-b border-slate-800/80 p-4 relative flex flex-col justify-between overflow-hidden group-hover:shadow-inner select-none transition-all duration-300 shrink-0`}>
        {/* Subtle decorative stadium grid overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* FastPool banner text matching the image */}
        <div className="flex items-center justify-between">
          <span className="bg-[#050B14] border border-emerald-500/25 text-emerald-400 text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded tracking-wider">
            FastPool Codes
          </span>
          <span className="text-[8.5px] text-slate-500 font-mono tracking-widest uppercase">
            ...assured
          </span>
        </div>

        {/* Center label block of the graphic thumbnail */}
        <div className="my-2 text-center relative z-10 transition-transform group-hover:scale-105 duration-300">
          <p className="text-[9.5px] text-slate-400 uppercase tracking-widest font-mono select-none">
            This WEEK
          </p>
          <h5 className="text-[15px] font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 uppercase leading-none mt-1">
            FastPool Codes
          </h5>
          <p className="text-[8.5px] text-sky-400 font-mono tracking-tight mt-1 bg-sky-950/40 px-2 py-0.5 rounded-full inline-block border border-sky-900/30">
            {accentText}
          </p>
        </div>

        {/* Brand logo list simulation on footer of the graphic banner */}
        <div className="flex items-center justify-between text-[8px] border-t border-slate-800/60 pt-1.5 font-mono text-slate-500">
          <span className={lowercaseName.includes('9ja') ? 'text-emerald-400 font-extrabold' : ''}>
            Bet9ja
          </span>
          <span className={lowercaseName.includes('king') ? 'text-blue-400 font-extrabold' : ''}>
            BetKing
          </span>
          <span className={lowercaseName.includes('sporty') ? 'text-rose-500 font-extrabold' : ''}>
            SportyBet
          </span>
          <span className={lowercaseName.includes('msport') ? 'text-amber-500 font-extrabold' : ''}>
            MSport
          </span>
        </div>
      </div>
    );
  }

  // Checks already unlocked codes
  function isAlreadyUnlocked(codeId: string) {
    return myDownloads.some(d => d.pool_code_id === codeId) || currentUser.role === 'admin';
  }
}
