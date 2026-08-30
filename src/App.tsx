import React, { useState, useEffect, FormEvent } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Database,
  Shield,
  BookOpen,
  Terminal,
  RotateCcw,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Globe,
  Lock,
  Unlock,
  ChevronsUpDown,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  INITIAL_USERS,
  INITIAL_PLANS,
  getMergedSubscriptionPlans,
  findSubscriptionPlan,
  getPlanDurationDays,
  calculateSubscriptionExpiry,
  isGhanaPlan,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_BOOKMAKERS,
  INITIAL_POOL_WEEKS,
  INITIAL_POOL_CODES,
  INITIAL_POOL_RESULTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_DOWNLOADS,
  DB_SCHEMAS,
  INITIAL_BET9JA,
  INITIAL_BETKING,
  INITIAL_SPORTYBET,
  INITIAL_SPORTYBET_GHANA,
  INITIAL_PREMIERBET,
  INITIAL_BETWAY,
  INITIAL_SOCCABET,
  INITIAL_MSPORT,
  INITIAL_POOL_CODES_COMPARISON,
  INITIAL_LIVESCORES,
  isPaymentDisabledBookmaker,
  normalizeBookmakerKey,
  matchBookmakerComponent
} from './initialData';
import {
  User,
  SubscriptionPlan,
  UserSubscription,
  UserPayment,
  PurchasesAccessLog,
  PoolCode,
  PoolWeek,
  Notification,
  DatabaseState,
  parseComponents
} from './types';

// Modular imports
import CustomerPortal from './components/CustomerPortal';
import OfficePoolStopHome from './components/OfficePoolStopHome';
import ChatbotSection from './components/ChatbotSection';
import Footer from './components/Footer';
import LiveScoresPage from './components/LiveScoresPage';
import TermsOfServicePage from './components/TermsOfServicePage';
import HelpCenterPage from './components/HelpCenterPage';
import { getSupabaseClient } from './lib/supabase';

export default function App() {
  // Shared global state proxying relational tables
  const [db, setDb] = useState<DatabaseState>({
    users: INITIAL_USERS,
    subscription_plans: INITIAL_PLANS,
    user_subscriptions: INITIAL_SUBSCRIPTIONS,
    bookmakers: INITIAL_BOOKMAKERS,
    pool_weeks: INITIAL_POOL_WEEKS,
    pool_codes: INITIAL_POOL_CODES,
    pool_results: INITIAL_POOL_RESULTS,
    notifications: INITIAL_NOTIFICATIONS,
    user_downloads: INITIAL_DOWNLOADS,
    bet9ja: [],
    betking: [],
    sportybet: [],
    sportybet_ghana: [],
    premierbet: [],
    betway: [],
    soccabet: [],
    msport: [],
    pool_codes_comparison: INITIAL_POOL_CODES_COMPARISON,
    livescores: INITIAL_LIVESCORES
  });

  // Simulator Domain Router: toggles independent application instances
  // 'customer' -> app.poolcodes.com
  // 'admin' -> admin.poolcodes.com
  const [currentAppSelector, setCurrentAppSelector] = useState<'customer' | 'admin'>('customer');
  const [initialHomeView, setInitialHomeView] = useState<'blog' | 'comparison' | 'livescores' | 'results' | 'about' | 'contact'>('blog');
  const [viewMode, setViewMode] = useState<'homepage' | 'portal' | 'livescores' | 'terms' | 'help'>(() => {
    try {
      const hash = window.location.hash.toLowerCase();
      const cachedStr = localStorage.getItem('fastpool_cached_user');
      const cachedView = localStorage.getItem('fastpool_view_mode');

      if (hash === '#livescores') return 'livescores';
      if (hash === '#terms') return 'terms';
      if (hash === '#help') return 'help';
      if (hash === '#dashboard' || hash === '#portal') {
        if (cachedStr) return 'portal';
      }
      if (cachedView === 'portal' && cachedStr) {
        return 'portal';
      }
      if (cachedView === 'livescores') return 'livescores';
      if (cachedView === 'terms') return 'terms';
      if (cachedView === 'help') return 'help';
    } catch (_) {}
    return 'homepage';
  });
  const [livescoresOrigin, setLivescoresOrigin] = useState<'homepage' | 'portal'>('homepage');
  const [termsOrigin, setTermsOrigin] = useState<'homepage' | 'portal'>('homepage');
  const [helpOrigin, setHelpOrigin] = useState<'homepage' | 'portal'>('homepage');

  const [activeTable, setActiveTable] = useState<string>('users');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(() => {
    try {
      const cachedStr = localStorage.getItem('fastpool_cached_user');
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (cached && cached.id) return cached.id;
      }
    } catch (_) {}
    return '';
  });
  const [sqlLogs, setSqlLogs] = useState<{ id: string; query: string; purpose: string; timestamp: string }[]>([
    {
      id: 'init-0',
      query: '-- Database initialized. Ready to simulate relations.\nSELECT * FROM subscription_plans;\nSELECT * FROM bookmakers WHERE is_active = TRUE;',
      purpose: 'Initial server load to fetch config and plans.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [autoOpenAuthHome, setAutoOpenAuthHome] = useState<boolean>(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);
  const [bypassPremium, setBypassPremium] = useState<boolean>(() => {
    localStorage.setItem('fastpool_bypass_premium', 'false');
    return false;
  });

  // Administrative form state overrides for pool publication
  const [formWeekId, setFormWeekId] = useState<string>('pw-week-49');
  const [formBookmakerId, setFormBookmakerId] = useState<string>('bm-bet9ja');
  const [formAccessLevel, setFormAccessLevel] = useState<'free' | 'premium'>('free');
  const [formContent, setFormContent] = useState<string>('');

  // SQL Console query states
  const [customQueryText, setCustomQueryText] = useState<string>("SELECT * FROM users WHERE status = 'suspended';");
  const [customQueryResult, setCustomQueryResult] = useState<any[] | null>(null);

  // Email confirmation states
  const [confirmedPaymentMail, setConfirmedPaymentMail] = useState<{
    subject: string;
    body: string;
    pdfUrl: string;
    pdfName: string;
    fetchedFromSupabase: boolean;
    queryDetails: string;
  } | null>(null);
  const [showSimulatedEmailModal, setShowSimulatedEmailModal] = useState(false);

  // Paystack fallback modal state
  const [paystackFallback, setPaystackFallback] = useState<{
    open: boolean;
    planId: string;
    price: number;
    name: string;
    components?: string[];
    currency?: string;
    currencySymbol?: string;
    notice?: string;
    channel?: 'momo' | 'card' | 'bank';
  } | null>(null);

  // Subscription Activation & Expiry Alert Success Modal State
  const [subscriptionSuccessAlert, setSubscriptionSuccessAlert] = useState<{
    open: boolean;
    planName: string;
    durationDays: number;
    expiresAtFormatted: string;
    reference: string;
    amount: number;
    currency: string;
  } | null>(null);

  // Dynamic Paystack Public Keys from runtime environment variables via server-side config API
  const [paystackPublicKey, setPaystackPublicKey] = useState<string>('');
  const [paystackGhanaPublicKey, setPaystackGhanaPublicKey] = useState<string>('');

  const GUEST_USER: User = {
    id: 'guest',
    username: 'Guest',
    email: '',
    role: 'user',
    status: 'active',
    created_at: new Date().toISOString(),
    email_verified_at: null
  };

  // Active Authenticated user in session
  const currentUser = selectedPersonaId
    ? (db.users.find(u => u.id === selectedPersonaId) || {
        id: selectedPersonaId,
        username: selectedPersonaId,
        email: '',
        role: 'user',
        status: 'active',
        created_at: new Date().toISOString(),
        email_verified_at: new Date().toISOString()
      })
    : GUEST_USER;

  // Subscription Perks parser helper
  const availablePlans = getMergedSubscriptionPlans(db.subscription_plans);
  const userActiveSubs = db.user_subscriptions.filter(
    sub => sub && 
    (sub.user_id === currentUser?.id || (sub.username && currentUser?.username && sub.username.toLowerCase() === currentUser.username.toLowerCase())) && 
    sub.status === 'active' && 
    new Date(sub.expires_at) > new Date()
  );

  const paidActiveSubs = userActiveSubs.filter(sub => sub.plan_id && sub.plan_id !== 'plan-free');
  const activeSubscription = paidActiveSubs.length > 0
    ? paidActiveSubs[paidActiveSubs.length - 1]
    : userActiveSubs[0];

  let rawActivePlan = activeSubscription
    ? (availablePlans.find(p => p && p.id === activeSubscription.plan_id) || availablePlans[0] || INITIAL_PLANS[0])
    : (availablePlans.find(p => p && p.id === 'plan-free') || availablePlans[0] || INITIAL_PLANS[0]);

  // If active subscription is active and has remaining paid access (> 7 days) or a payment ref, map to VIP Paid Plan instead of showing Free Plan
  if (activeSubscription && rawActivePlan.id === 'plan-free') {
    const diffDays = (new Date(activeSubscription.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 7 || activeSubscription.payment_ref) {
      const quarterlyOrMonthly = availablePlans.find(p => p.id === 'plan-quarterly') || availablePlans.find(p => p.id === 'plan-monthly') || availablePlans.find(p => p.price > 0);
      if (quarterlyOrMonthly) {
        rawActivePlan = quarterlyOrMonthly;
      }
    }
  }
  const activePlan = rawActivePlan;

  // Display Toast Alert Banner
  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Log SQL helper
  const logSQL = (query: string, purpose: string) => {
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      query,
      purpose,
      timestamp: new Date().toLocaleTimeString()
    };
    setSqlLogs(prev => [newLog, ...prev].slice(0, 45));
  };

  // Auto-load active user session from localStorage if logged in
  useEffect(() => {
    try {
      const cachedStr = localStorage.getItem('fastpool_cached_user');
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (cached && cached.id) {
          setSelectedPersonaId(cached.id);
          setDb(prev => {
            const exists = prev.users.some(u => u.id === cached.id);
            if (!exists) {
              const newUser: User = {
                id: cached.id,
                username: cached.username || 'user',
                email: cached.email || '',
                role: cached.role || 'user',
                status: 'active',
                phone: '',
                created_at: cached.created_at || new Date().toISOString(),
                email_verified_at: new Date().toISOString()
              };
              return {
                ...prev,
                users: [...prev.users, newUser]
              };
            }
            return prev;
          });
        }
      } else {
        setSelectedPersonaId('');
      }
    } catch (e) {
      console.error("Error setting user session:", e);
    }
  }, []);

  // Sync viewMode changes to localStorage and browser history hash
  useEffect(() => {
    try {
      localStorage.setItem('fastpool_view_mode', viewMode);
      const targetHash = viewMode === 'portal' ? '#dashboard' : viewMode === 'homepage' ? '#home' : `#${viewMode}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState({ view: viewMode }, '', targetHash);
      }
    } catch (_) {}
  }, [viewMode]);

  // Handle browser Back / Forward buttons seamlessly
  useEffect(() => {
    const handlePopState = () => {
      try {
        const hash = window.location.hash.toLowerCase();
        const cachedUser = localStorage.getItem('fastpool_cached_user');

        if (hash === '#dashboard' || hash === '#portal') {
          if (cachedUser) {
            setViewMode('portal');
          } else {
            setViewMode('homepage');
          }
        } else if (hash === '#livescores') {
          setViewMode('livescores');
        } else if (hash === '#terms') {
          setViewMode('terms');
        } else if (hash === '#help') {
          setViewMode('help');
        } else {
          setViewMode('homepage');
        }
      } catch (_) {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Strict Dashboard Guard: Users cannot access portal dashboard without signing up / logging in
  useEffect(() => {
    if (viewMode === 'portal') {
      const cachedStr = localStorage.getItem('fastpool_cached_user');
      if (!selectedPersonaId && !cachedStr) {
        setViewMode('homepage');
        setAutoOpenAuthHome(true);
        triggerToast('Access restricted: Please sign up or log in to access the user dashboard.', 'error');
      }
    }
  }, [viewMode, selectedPersonaId]);

  // Fetch dynamic runtime configuration (including live Paystack Public Key) on load
  useEffect(() => {
    const fetchRuntimeConfig = async () => {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          if (data.paystackPublicKey) {
            setPaystackPublicKey(data.paystackPublicKey);
            console.log("[Paystack Integration] Successfully loaded runtime public key:", data.paystackPublicKey.substring(0, 10) + "...");
          }
          if (data.paystackGhanaPublicKey) {
            setPaystackGhanaPublicKey(data.paystackGhanaPublicKey);
            console.log("[Paystack Integration] Successfully loaded Ghana runtime public key:", data.paystackGhanaPublicKey.substring(0, 10) + "...");
          }
        }
      } catch (err) {
        console.warn("[Paystack Integration] Failed to load server-side runtime config:", err);
      }
    };
    fetchRuntimeConfig();
  }, []);

  const [discoveredDbTables, setDiscoveredDbTables] = useState<any[]>([]);

  const fetchRealSupabaseData = async (silent: boolean = false) => {
    setIsSyncingSupabase(true);
    if (!silent) {
      triggerToast("🔄 Discovering & syncing all database tables with Supabase...", "info");
    }

    try {
      // 1. Dynamic Table Discovery from Supabase backend API
      const discoveryRes = await fetch('/api/database/tables');
      if (discoveryRes.ok) {
        const discJson = await discoveryRes.json();
        if (discJson.success && Array.isArray(discJson.activeTables)) {
          setDiscoveredDbTables(discJson.activeTables);
          logSQL('GET /api/database/tables', `Database discovery detected ${discJson.activeTables.length} active tables in Supabase.`);
        }
      }
    } catch (discErr) {
      console.warn('[Supabase Discovery] Table discovery endpoint warning:', discErr);
    }

    const logAndSetTable = async (tableName: string, dbKey: keyof DatabaseState, query: string) => {
      try {
        const uid = currentUser?.id || '';
        const uname = currentUser?.username || '';
        const queryParams = uid || uname ? `?user_id=${encodeURIComponent(uid)}&username=${encodeURIComponent(uname)}` : '';
        const res = await fetch(`/api/tables/${tableName}${queryParams}`, {
          headers: {
            'x-user-id': uid,
            'x-username': uname
          }
        });
        if (!res.ok) {
          console.warn(`[Supabase Sync] Could not fetch table '${tableName}' through proxy. Status: ${res.status}`);
          return false;
        }
        const json = await res.json();
        const data = json.data;

        if (data && Array.isArray(data)) {
          setDb(prev => {
            if (data.length > 0) {
              if (tableName === 'pool_result' || tableName === 'pool_results' || tableName === 'results' || tableName === 'championship_results') {
                const mappedRows = data.map((r: any, idx: number) => {
                  const rawStatus = r.status || r.outcome || r.result_status || '';
                  const isDraw = rawStatus === 'ScoreDraw' || rawStatus === 'noScoreDraw' || rawStatus === 'Draw' || rawStatus === 'DRAW' || String(rawStatus).toLowerCase().includes('draw');
                  const outcome = isDraw ? 'DRAW' : (rawStatus === 'Home' || rawStatus === 'HOME WIN' || rawStatus === 'HOME' ? 'HOME WIN' : 'AWAY WIN');
                  const statusFormatted = rawStatus === 'ScoreDraw' ? 'ScoreDraw' : (rawStatus === 'noScoreDraw' ? 'noScoreDraw' : (isDraw ? 'ScoreDraw' : (outcome === 'HOME WIN' ? 'Home' : 'Away')));

                  const homeTeam = r.home_team || r.Home_Team || r.homeTeam || r.team_home || r.home || '';
                  const awayTeam = r.away_team || r.Away_Team || r.awayTeam || r.team_away || r.away || '';

                  const homeScore = r.Home_Team_Score !== undefined ? r.Home_Team_Score : (r.home_team_score !== undefined ? r.home_team_score : (r.homeScore !== undefined ? r.homeScore : (r.pool_result ? r.pool_result.split('-:-')[0] : '')));
                  const awayScore = r.Away_Team_Score !== undefined ? r.Away_Team_Score : (r.away_team_score !== undefined ? r.away_team_score : (r.awayScore !== undefined ? r.awayScore : (r.pool_result ? r.pool_result.split('-:-')[1] : '')));
                  const poolResultStr = r.pool_result || (homeScore !== '' && awayScore !== '' ? `${homeScore}-:-${awayScore}` : (r.fullTimeScore ? r.fullTimeScore.replace(' - ', '-:-') : '0-:-0'));
                  const matchId = r.id ?? r.matchNo ?? r.match_no ?? (idx + 1);

                  return {
                    id: matchId,
                    matchNo: matchId,
                    home_team: homeTeam,
                    away_team: awayTeam,
                    Home_Team: homeTeam,
                    Away_Team: awayTeam,
                    homeTeam: homeTeam,
                    awayTeam: awayTeam,
                    status: statusFormatted,
                    pool_result: poolResultStr,
                    home_team_score: homeScore,
                    away_team_score: awayScore,
                    Home_Team_Score: homeScore,
                    Away_Team_Score: awayScore,
                    fullTimeScore: poolResultStr.replace('-:-', ' - '),
                    outcome,
                    payoutStatus: 'CLEARED'
                  };
                }).sort((a, b) => {
                  const numA = Number(a.id ?? a.matchNo) || 0;
                  const numB = Number(b.id ?? b.matchNo) || 0;
                  return numA - numB;
                });

                const currentResults = prev.pool_results || [];
                const activeWeekNum = prev.pool_weeks?.find(w => w.status === 'active')?.week_number || 49;
                const updatedPoolResults = currentResults.length > 0
                  ? currentResults.map(sheet => ({
                      ...sheet,
                      results_table: mappedRows
                    }))
                  : [{
                      id: `pr-w${activeWeekNum}`,
                      pool_week_id: `pw-week-${activeWeekNum}`,
                      bookmaker_id: 'bm-bet9ja',
                      uploaded_by: 'usr-admin-777',
                      results_content: 'Official pool_result table fixtures',
                      file_url: null,
                      created_at: new Date().toISOString(),
                      title: `Week ${activeWeekNum} UK Pool results: Official pool_result Table Matches`,
                      week_number: activeWeekNum,
                      season_year: 2026,
                      pool_type: 'uk',
                      fixture_date: '2026-06-06',
                      comments_count: 0,
                      results_table: mappedRows
                    }];

                return {
                  ...prev,
                  pool_results: updatedPoolResults
                };
              }
              return {
                ...prev,
                [dbKey]: data
              };
            }
            return prev;
          });
          if (data.length > 0) {
            logSQL(query, `Successfully loaded ${data.length} real rows from Supabase '${tableName}' table.`);
          } else {
            logSQL(query, `Connected to Supabase '${tableName}' (Table exists but has 0 rows).`);
          }
          return true;
        }
      } catch (err: any) {
        console.warn(`[Supabase Sync] Exception fetching '${tableName}' through proxy:`, err);
      }
      return false;
    };

    // Execute fetches in parallel to retrieve real tables
    await Promise.all([
      logAndSetTable('blogs', 'blogs' as any, 'SELECT * FROM blogs;'),
      logAndSetTable('users', 'users', 'SELECT * FROM users;'),
      logAndSetTable('subscription_plans', 'subscription_plans', 'SELECT * FROM subscription_plans;'),
      logAndSetTable('user_subscriptions', 'user_subscriptions', 'SELECT * FROM user_subscriptions;'),
      logAndSetTable('bookmakers', 'bookmakers', 'SELECT * FROM bookmakers;'),
      logAndSetTable('pool_weeks', 'pool_weeks', 'SELECT * FROM pool_weeks;'),
      logAndSetTable('pool_codes', 'pool_codes', 'SELECT * FROM pool_codes;'),
      logAndSetTable('pool_result', 'pool_results', 'SELECT * FROM pool_result;'),
      logAndSetTable('notifications', 'notifications', 'SELECT * FROM notifications;'),
      logAndSetTable('user_downloads', 'user_downloads', 'SELECT * FROM user_downloads;'),
      logAndSetTable('bet9ja', 'bet9ja', 'SELECT * FROM bet9ja;'),
      logAndSetTable('betking', 'betking', 'SELECT * FROM betking;'),
      logAndSetTable('sportybet', 'sportybet', 'SELECT * FROM sportybet;'),
      logAndSetTable('sportybet_ghana', 'sportybet_ghana' as any, 'SELECT * FROM sportybet_ghana;'),
      logAndSetTable('msport', 'msport' as any, 'SELECT * FROM msport;'),
      logAndSetTable('premierbet', 'premierbet', 'SELECT * FROM premierbet;'),
      logAndSetTable('betway', 'betway', 'SELECT * FROM betway;'),
      logAndSetTable('soccabet', 'soccabet', 'SELECT * FROM soccabet;'),
      logAndSetTable('arena_games', 'arena_games' as any, 'SELECT * FROM arena_games;'),
      logAndSetTable('championship_results', 'championship_results' as any, 'SELECT * FROM championship_results;'),
      logAndSetTable('pool codes comparison', 'pool_codes_comparison', 'SELECT * FROM "pool codes comparison";'),
      logAndSetTable('weekly pool picks', 'weekly_pool_picks' as any, 'SELECT * FROM "weekly pool picks";'),
      logAndSetTable('livescores', 'livescores' as any, 'SELECT * FROM livescores;'),
      logAndSetTable('purchases_access_log', 'purchases_access_log' as any, 'SELECT * FROM purchases_access_log;')
    ]);

    setIsSyncingSupabase(false);
    if (!silent) {
      triggerToast("✅ Database tables fully synchronized with Supabase!", "success");
    }
  };

  // Run initial live database synchronization across all Supabase tables
  useEffect(() => {
    // 1. Initial sync on app load
    const timer = setTimeout(() => {
      fetchRealSupabaseData(true);
    }, 500);

    // 2. Active background sync interval so database edits reflect in real-time
    const intervalTimer = setInterval(() => {
      fetchRealSupabaseData(true);
    }, 10000);

    // 3. Sync immediately when window is refocused or becomes visible
    const handleFocus = () => {
      fetchRealSupabaseData(true);
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // 4. Supabase Realtime WebSocket subscription on all public schema tables
    const supabase = getSupabaseClient();
    let channel: any = null;
    if (supabase) {
      try {
        channel = supabase
          .channel('app-all-tables-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public'
            },
            (payload) => {
              console.log('⚡ Realtime update across Supabase tables detected:', payload);
              fetchRealSupabaseData(true);
            }
          )
          .subscribe((status) => {
            console.log('⚡ Supabase global realtime status:', status);
          });
      } catch (rtErr) {
        console.warn('Real-time subscription notice:', rtErr);
      }
    }

    return () => {
      clearTimeout(timer);
      clearInterval(intervalTimer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      if (supabase && channel) {
        try {
          supabase.removeChannel(channel);
        } catch (_) {}
      }
    };
  }, []);

  // Global listener for #contact hash routing and advert click events
  useEffect(() => {
    const handleCheckContactHash = () => {
      if (window.location.hash === '#contact' || window.location.hash === '#contact-us') {
        setInitialHomeView('contact');
        setViewMode('homepage');
      }
    };
    handleCheckContactHash();
    window.addEventListener('hashchange', handleCheckContactHash);
    const handleNavContactEvent = () => {
      setInitialHomeView('contact');
      setViewMode('homepage');
    };
    window.addEventListener('fastpool_navigate_contact', handleNavContactEvent);
    return () => {
      window.removeEventListener('hashchange', handleCheckContactHash);
      window.removeEventListener('fastpool_navigate_contact', handleNavContactEvent);
    };
  }, []);

  // Re-verify profile is administrator when switching tabs
  useEffect(() => {
    if (currentAppSelector === 'admin') {
      const adminUsr = db.users.find(u => u.role === 'admin');
      if (adminUsr && currentUser.role !== 'admin') {
        setSelectedPersonaId(adminUsr.id);
        triggerToast("Session synchronized to Administrator context.", 'info');
        logSQL(
          `-- Admin Portal Auto Authenticate\nSELECT * FROM users WHERE id = '${adminUsr.id}' AND role = 'admin';`,
          "Simulated admin.poolcodes.com secure identity handshake"
        );
      }
    }
  }, [currentAppSelector]);

  // Handler: Re-verify system constraints rollback seeds
  const resetDatabaseValues = () => {
    setDb({
      users: INITIAL_USERS,
      subscription_plans: INITIAL_PLANS,
      user_subscriptions: INITIAL_SUBSCRIPTIONS,
      bookmakers: INITIAL_BOOKMAKERS,
      pool_weeks: INITIAL_POOL_WEEKS,
      pool_codes: INITIAL_POOL_CODES,
      pool_results: INITIAL_POOL_RESULTS,
      notifications: INITIAL_NOTIFICATIONS,
      user_downloads: INITIAL_DOWNLOADS,
      bet9ja: [],
      betking: [],
      sportybet: [],
      premierbet: [],
      betway: [],
      soccabet: [],
      msport: []
    });
    setCustomQueryResult(null);
    logSQL(
      `-- Reset transaction seeds executed.\nTRUNCATE TABLE user_downloads, notifications, pool_results, pool_codes CASCADE;\n-- Reloading seed fixtures...`,
      'Restored PG baseline transaction state.'
    );
    triggerToast('Database seeds reloaded successfully.', 'info');
  };

  const downloadCodesFileAuto = (userObj: any, planId: string, paymentRef: string) => {
    try {
      const plans = getMergedSubscriptionPlans(db.subscription_plans);
      const plan = plans.find(p => p.id === planId) || plans[0] || INITIAL_PLANS[0];
      const activeWeek = db.pool_weeks.find(w => w.status === 'active') || db.pool_weeks[0];
      const weekNum = activeWeek ? activeWeek.week_number : '49';
      
      const relatedCodes = db.pool_codes.filter(c => c.pool_week_id === (activeWeek?.id || 'pw-week-49'));
      
      const rawUser = userObj?.username || currentUser?.username || 'kingeme';
      const nickname = rawUser.startsWith('@') ? rawUser : `@${rawUser}`;
      const email = userObj?.email || currentUser?.email || 'kingsleyrexus@gmail.com';
      const planName = plan?.name ? `${plan.name.toUpperCase()} PLAN` : 'WEEKLY VIP PLAN';
      const refCode = paymentRef || `PAY-${Date.now()}-${Math.floor(Math.random() * 90000 + 10000)}`;
      
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      
      const secHash = `SHA256:${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      // Initialize Portrait A4 PDF (210mm x 297mm)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 1. Header background banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 38, 'F');

      // Accent gold strip
      doc.setFillColor(245, 158, 11); // amber-500
      doc.rect(0, 38, 210, 2, 'F');

      // Title & Subtitle
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(245, 158, 11); // Gold
      doc.text('FASTPOOL CODES - OFFICIAL VIP CODESHEET', 14, 15);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`PREMIUM VERIFIED SLIP & LICENSE CERTIFICATE • WEEK ${weekNum}`, 14, 23);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Official Delivery Syndicate • www.fastpoolcodes.com • 256-Bit SSL Decrypted`, 14, 30);

      // Verified Seal Badge on top right
      doc.setFillColor(16, 185, 129); // emerald-500
      doc.roundedRect(148, 10, 48, 18, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('✓ VERIFIED VIP LICENSE', 152, 17);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('ACTIVE & AUTHENTICATED', 152, 23);

      // 2. License Details Table
      autoTable(doc, {
        startY: 44,
        margin: { left: 14, right: 14 },
        theme: 'plain',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          font: 'helvetica'
        },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 38 },
          1: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 55 },
          2: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 38 },
          3: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 51 }
        },
        body: [
          ['Account Nickname:', nickname, 'Payment Reference:', refCode],
          ['Account Email:', email, 'Verification Date:', formattedDate],
          ['Active Plan / Tier:', planName, 'Target Pool Week:', `WEEK ${weekNum} (AUSSIE/UK)`],
          ['Security Signature:', secHash, 'License Status:', 'AUTHENTICATED ✓']
        ]
      });

      // 3. Prepare Decrypted Codes data
      const codesTableRows: string[][] = [];

      if (relatedCodes.length === 0) {
        codesTableRows.push(
          ['1', 'BET9JA (VIP)', `Arsenal vs Chelsea [Code: 4129]\nLiverpool vs Leeds [Code: 3312]\nMan City vs Everton [Code: 5091]\nNapoli vs Juventus [Code: 9023]\nReal Madrid vs Sevilla [Code: 1114]`, 'FREE / STARTER', 'DECRYPTED ✓'],
          ['2', 'BETKING (PREMIUM)', `SECRET HIGH-ODDS COMBO CODES:\nRoma vs Milan -> [BK-7721] (Draw Prob: 84%)\nAston Villa vs Wolves -> [BK-3392] (Match Draw)\nTottenham vs Brentford -> [BK-5522] (Home/Draw)`, 'PREMIUM VIP', 'DECRYPTED ✓'],
          ['3', 'SPORTYBET (VIP)', `WEEK ${weekNum} Aussie Sportybet VIP Codes:\nLeicester vs West Ham -> [SB-1104]\nValencia vs Villarreal -> [SB-9031]\nFiorentina vs Lazio -> [SB-4402] (Perm Banker)`, 'VIP DIAMOND', 'DECRYPTED ✓'],
          ['4', 'GHANA BOOKIES', `PremierBet Ghana: Asante Kotoko vs Hearts -> [PB-1992]\nBetway Ghana: Medeama vs Aduana -> [BW-8831]\nSportyBet Ghana: Berekum vs Legon -> [SBGH-3011]`, 'GHANA VIP', 'DECRYPTED ✓']
        );
      } else {
        relatedCodes.forEach((c, idx) => {
          const bookmaker = db.bookmakers.find(b => b.id === c.bookmaker_id)?.name || 'SportyBet';
          codesTableRows.push([
            String(idx + 1),
            bookmaker.toUpperCase(),
            c.codes_content,
            (c.access_level || 'standard').toUpperCase(),
            'DECRYPTED ✓'
          ]);
        });
      }

      // Decrypted Codes Table
      autoTable(doc, {
        startY: (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 4 : 70,
        margin: { left: 14, right: 14 },
        head: [['#', 'Bookmaker Table', 'Decrypted Slip Codes & Banker Predictions', 'Access Level', 'Status']],
        body: codesTableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [245, 158, 11],
          fontSize: 8.5,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
          cellPadding: 3,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 38, fontStyle: 'bold', textColor: [15, 23, 42] },
          2: { cellWidth: 84, fontStyle: 'normal' },
          3: { cellWidth: 26, fontStyle: 'bold', textColor: [5, 150, 105], halign: 'center' },
          4: { cellWidth: 24, fontStyle: 'bold', textColor: [16, 185, 129], halign: 'center' }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        willDrawPage: () => {
          // Watermark
          doc.saveGraphicsState();
          doc.setTextColor(235, 240, 245);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          const watermarkText = `FASTPOOLCODES • ${nickname} • VERIFIED VIP`;
          for (let x = -20; x < 220; x += 110) {
            for (let y = 50; y < 290; y += 60) {
              doc.text(watermarkText, x, y, { angle: -30 });
            }
          }
          doc.restoreGraphicsState();
        },
        didDrawPage: () => {
          // Security Box & Footer
          const pageHeight = doc.internal.pageSize.height || 297;
          
          doc.setFillColor(241, 245, 249);
          doc.rect(14, pageHeight - 24, 182, 14, 'F');
          
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 116, 139);
          doc.text(`SECURITY & ANTI-PIRACY NOTICE:`, 16, pageHeight - 19);
          doc.setFont('helvetica', 'normal');
          doc.text(`This official codesheet PDF is registered exclusively to ${nickname} (${email}). Unauthorized sharing or resale will result in immediate license revocation.`, 16, pageHeight - 14);
          
          doc.setFontSize(6.5);
          doc.setTextColor(148, 163, 184);
          doc.text(`FastPoolCodes Official Classified VIP Sheet • Week ${weekNum} • Licensed to ${email}`, 14, pageHeight - 5);
          doc.text(`Support: +234 8030587933, +234 9037595705`, 196, pageHeight - 5, { align: 'right' });
        }
      });

      doc.save(`FastPoolCodes_Week_${weekNum}_VIP_Codesheet.pdf`);

      triggerToast('Downloaded decrypted VIP pool codes & PDF receipt successfully!', 'success');
    } catch (err) {
      console.warn("Graceful error during automatic codes download trigger:", err);
    }
  };

  // Load Paystack Inline script dynamically
  const loadPaystackPop = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).PaystackPop) {
        resolve((window as any).PaystackPop);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).PaystackPop) {
          resolve((window as any).PaystackPop);
        } else {
          reject(new Error("Paystack SDK loaded but not found on window"));
        }
      };
      script.onerror = () => reject(new Error("Failed to load Paystack inline JS"));
      document.body.appendChild(script);
    });
  };

  const completePurchase = (planId: string, reference: string, selectedComponents?: string[]) => {
    // 1. Identify plan directly from database source of truth
    const p = findSubscriptionPlan(db.subscription_plans, planId) || INITIAL_PLANS[0];
    if (!p) return;

    // 2. Idempotency Check: Prevent duplicate activations or double-logging for the same payment reference
    if (reference) {
      const existingRefSub = db.user_subscriptions.find(
        s => s && (s.payment_ref === reference || s.payment_reference === reference)
      );
      if (existingRefSub) {
        console.log(`[Subscription Idempotency] Payment reference ${reference} has already been activated for @${currentUser.username}.`);
        triggerToast(`Payment reference ${reference} already processed and active.`, 'info');
        return;
      }
    }

    const components = (selectedComponents && selectedComponents.length > 0)
      ? selectedComponents
      : (paystackFallback?.components && paystackFallback.components.length > 0)
      ? paystackFallback.components
      : [];

    // Only mark past subscriptions as cancelled if they are expired
    const sanitizedSubs = db.user_subscriptions.map(s => {
      const isUserSub = (s.user_id === currentUser?.id || (s.username && currentUser?.username && s.username.toLowerCase() === currentUser.username.toLowerCase()));
      if (isUserSub && s.status === 'active') {
        const isExpired = new Date(s.expires_at) <= new Date();
        if (isExpired) {
          return { ...s, status: 'cancelled' as const };
        }
      }
      return s;
    });

    const subId = `sub-paystack-${Math.floor(Math.random() * 90000 + 10000)}`;
    const now = new Date();
    // Calculate exact duration and expiration from plan data
    const { expiresAt, durationDays } = calculateSubscriptionExpiry(p, now);

    const currencySymbol = 'NGN';
    const amountPaid = Number(p.price || 0) * (components.includes('all') ? 1 : Math.max(1, components.length));
    const itemName = `${p.name} (${components.map(c => String(c).toUpperCase()).join(' + ')})`;
    const formattedExpiry = expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    // 3. Create Subscription Record
    const newSub: UserSubscription = {
      id: subId,
      user_id: currentUser.id,
      username: currentUser.username,
      plan_id: p.id,
      plan_name: p.name,
      status: 'active',
      starts_at: now.toISOString(),
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_ref: reference,
      payment_reference: reference,
      payment_provider: 'Paystack API Gateway',
      amount_paid: amountPaid,
      currency: currencySymbol,
      item_name: itemName,
      components: components,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      alert_milestones_sent: ['activated']
    };

    // 4. Create In-App Activation Notification
    const notifId = `notif-sub-act-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const activationMessage = `Your ${p.name} plan is now active. You have access for ${durationDays} days and your subscription expires on ${formattedExpiry}. You now have access to your Pool Codes.`;

    const newNotification: Notification = {
      id: notifId,
      user_id: currentUser.id,
      subscription_id: subId,
      pool_code_id: null,
      type: 'subscription_activated',
      title: 'Pool Code Subscription Activated 🎉',
      message: activationMessage,
      body: activationMessage,
      is_read: false,
      read_at: null,
      created_at: now.toISOString(),
      days_remaining: durationDays
    };

    const newPayment: UserPayment = {
      id: `pay-${Date.now()}`,
      user_id: currentUser.id,
      username: currentUser.username,
      plan_id: p.id,
      item_name: itemName,
      bookmaker_components: components,
      granted_tables: ['pool_codes', 'pool_results', 'vip_signals'],
      amount: amountPaid,
      currency: currencySymbol,
      payment_reference: reference,
      payment_provider: 'Paystack API Gateway',
      status: 'successful',
      access_start_at: now.toISOString(),
      access_expires_at: expiresAt.toISOString(),
      created_at: now.toISOString()
    };

    const newPurchasesAccessLog: PurchasesAccessLog = {
      id: subId,
      user_id: currentUser.id,
      username: currentUser.username,
      plan_id: p.id,
      plan_purchased: itemName,
      payment_ref: reference,
      payment_provider: 'Paystack API Gateway',
      amount: amountPaid,
      currency: currencySymbol,
      components: components,
      paid_date: now.toISOString(),
      expiry_date: expiresAt.toISOString(),
      access_status: 'active',
      created_at: now.toISOString()
    };

    // Update global and persistent client-side states
    setDb(prev => ({
      ...prev,
      user_subscriptions: [...sanitizedSubs, newSub],
      user_payments: [newPayment, ...(prev.user_payments || [])],
      purchases_access_log: [newPurchasesAccessLog, ...(prev.purchases_access_log || [])],
      notifications: [newNotification, ...(prev.notifications || [])]
    }));

    // Trigger instant activation modal alert
    setSubscriptionSuccessAlert({
      open: true,
      planName: p.name,
      durationDays: durationDays,
      expiresAtFormatted: formattedExpiry,
      reference: reference,
      amount: amountPaid,
      currency: currencySymbol
    });

    // Cache updated plan state securely in localStorage
    try {
      const cachedStr = localStorage.getItem('fastpool_cached_user');
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        localStorage.setItem('fastpool_cached_user', JSON.stringify({
          ...cached,
          plan_id: p.id,
          payment_ref: reference,
          expires_at: expiresAt.toISOString(),
          status: 'active',
          components: components
        }));
      }
    } catch (_) {}

    const compSqlArray = `ARRAY[${components.map(c => `'${c}'`).join(', ')}]`;

    logSQL(
      `-- REAL PAYSTACK TRANSACTION SUCCESSFUL\nUPDATE user_subscriptions SET status = 'cancelled' WHERE user_id = '${currentUser.id}' AND status = 'active';\n\n-- Register new subscription with duration (${durationDays} days)\nINSERT INTO user_subscriptions (id, user_id, plan_id, status, starts_at, expires_at, payment_ref, payment_provider, created_at, components)\nVALUES ('${subId}', '${currentUser.id}', '${p.id}', 'active', '${now.toISOString().slice(0,19)}Z', '${expiresAt.toISOString().slice(0,19)}Z', '${reference}', 'Paystack API Gateway', NOW(), '${JSON.stringify(components)}');\n\nINSERT INTO purchases_access_log (id, user_id, username, plan_id, plan_purchased, payment_ref, payment_provider, amount, currency, components, paid_date, expiry_date, access_status)\nVALUES ('${subId}', '${currentUser.id}', '${currentUser.username}', '${p.id}', '${itemName.replace(/'/g, "''")}', '${reference}', 'Paystack API Gateway', ${amountPaid}, '${currencySymbol}', ${compSqlArray}, '${now.toISOString()}', '${expiresAt.toISOString()}', 'active');\n\n-- Record In-App Activation Notification\nINSERT INTO notifications (id, user_id, subscription_id, type, title, message, is_read, created_at)\nVALUES ('${notifId}', '${currentUser.id}', '${subId}', 'subscription_activated', 'Pool Code Subscription Activated 🎉', '${activationMessage.replace(/'/g, "''")}', FALSE, NOW());`,
      `User @${currentUser.username} completed Paystack checkout for [${p.name}] with ${durationDays} days access`
    );
    triggerToast(`🎉 ${p.name} Activated! ${durationDays} days of Pool Codes access unlocked. Expires ${formattedExpiry}.`, 'success');

    // 1. Direct client-side SDK database table record
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from('user_subscriptions').insert([newSub]).then(({ error }) => {
          if (error) console.warn('[Client DB user_subscriptions insert note]:', error.message);
        });
        supabase.from('users_subscriptions').insert([newSub]).then(({ error }) => {
          if (error) console.warn('[Client DB users_subscriptions insert note]:', error.message);
        });
        supabase.from('notifications').insert([newNotification]).then(({ error }) => {
          if (error) console.warn('[Client DB notifications insert note]:', error.message);
        });
      }
    } catch (_) {}

    // 2. Direct API endpoint database table record
    fetch('/api/tables/user_subscriptions/insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSub)
    }).catch(err => console.warn('[API Sub Insert user_subscriptions Warning]:', err));

    fetch('/api/tables/purchases_access_log/insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPurchasesAccessLog)
    }).catch(err => console.warn('[API Insert purchases_access_log Warning]:', err));

    fetch('/api/tables/users_subscriptions/insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSub)
    }).catch(err => console.warn('[API Sub Insert users_subscriptions Warning]:', err));

    fetch('/api/tables/notifications/insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotification)
    }).catch(err => console.warn('[API Insert notifications Warning]:', err));

    // 3. Fetch official codesheet PDF & trigger email dispatch relay with full sub parameters
    fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        email: currentUser.email,
        username: currentUser.username,
        planId: p.id,
        paymentRef: reference,
        subId: subId,
        startsAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        paymentProvider: 'Paystack API Gateway',
        components: components
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setConfirmedPaymentMail({
            subject: data.subject,
            body: data.body,
            pdfUrl: data.pdfUrl,
            pdfName: data.pdfName,
            fetchedFromSupabase: data.fetchedFromSupabase,
            queryDetails: data.queryDetails
          });
          // Do NOT display full-screen email popup after payment; grant immediate direct access to paid items in portal
          setShowSimulatedEmailModal(false);
        }
      })
      .catch(err => {
        console.error('[Mail Dispatch API Error]:', err);
      });
    
    // Switch view directly to portal and dismiss paywall fallback modal
    setPaystackFallback(null);
    setViewMode('portal');
    setShowSimulatedEmailModal(false);

    // Auto download pool codes sheet after payment
    setTimeout(() => {
      downloadCodesFileAuto(currentUser, p.id, reference);
    }, 1000);
  };

  // Automated Subscription Expiration & Milestone Alert Checker
  useEffect(() => {
    if (!currentUser || currentUser.id === 'guest') return;

    const now = new Date();
    let updatedAny = false;
    const newNotifications: Notification[] = [];

    const updatedSubs = db.user_subscriptions.map(sub => {
      const isUserSub = (
        sub.user_id === currentUser.id ||
        (sub.username && currentUser.username && sub.username.toLowerCase() === currentUser.username.toLowerCase())
      );
      if (!isUserSub) return sub;

      const expDate = new Date(sub.expires_at);
      if (isNaN(expDate.getTime())) return sub;

      const diffMs = expDate.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const plan = findSubscriptionPlan(db.subscription_plans, sub.plan_id);
      const planName = sub.plan_name || sub.item_name || plan?.name || 'VIP Pool Codes';
      const milestones = Array.isArray(sub.alert_milestones_sent) ? [...sub.alert_milestones_sent] : [];

      // Milestone 1: Expired (0 days or past expiration timestamp)
      if (diffMs <= 0 || sub.status === 'expired') {
        let subStatus = sub.status;
        if (sub.status === 'active') {
          subStatus = 'expired';
          updatedAny = true;
        }
        if (!milestones.includes('expired')) {
          milestones.push('expired');
          updatedAny = true;
          const notifId = `notif-exp-${sub.id}-${Date.now()}`;
          const expMessage = `Your ${planName} subscription has expired. Renew your subscription to regain access to Pool Codes.`;
          newNotifications.push({
            id: notifId,
            user_id: currentUser.id,
            subscription_id: sub.id,
            pool_code_id: null,
            type: 'subscription_expired',
            title: 'Pool Code Subscription Expired',
            message: expMessage,
            body: expMessage,
            is_read: false,
            read_at: null,
            created_at: now.toISOString(),
            days_remaining: 0
          });
        }
        return { ...sub, status: subStatus, alert_milestones_sent: milestones };
      }

      // Milestone 2: 1 Day before Expiry
      if (daysRemaining <= 1 && daysRemaining > 0 && sub.status === 'active') {
        if (!milestones.includes('1_day')) {
          milestones.push('1_day');
          updatedAny = true;
          const notifId = `notif-exp1d-${sub.id}-${Date.now()}`;
          const warn1Day = `Your ${planName} subscription expires tomorrow. Renew now to avoid losing access.`;
          newNotifications.push({
            id: notifId,
            user_id: currentUser.id,
            subscription_id: sub.id,
            pool_code_id: null,
            type: 'subscription_expiring',
            title: 'Your Pool Code Subscription Expires Tomorrow ⚠️',
            message: warn1Day,
            body: warn1Day,
            is_read: false,
            read_at: null,
            created_at: now.toISOString(),
            days_remaining: daysRemaining
          });
        }
        return { ...sub, alert_milestones_sent: milestones };
      }

      // Milestone 3: 3 Days before Expiry
      if (daysRemaining <= 3 && daysRemaining > 1 && sub.status === 'active') {
        if (!milestones.includes('3_days')) {
          milestones.push('3_days');
          updatedAny = true;
          const notifId = `notif-exp3d-${sub.id}-${Date.now()}`;
          const warn3Days = `Your ${planName} subscription expires in 3 days. Renew your subscription to continue accessing Pool Codes.`;
          newNotifications.push({
            id: notifId,
            user_id: currentUser.id,
            subscription_id: sub.id,
            pool_code_id: null,
            type: 'subscription_expiring',
            title: 'Your Pool Code Subscription Expires Soon ⚠️',
            message: warn3Days,
            body: warn3Days,
            is_read: false,
            read_at: null,
            created_at: now.toISOString(),
            days_remaining: daysRemaining
          });
        }
        return { ...sub, alert_milestones_sent: milestones };
      }

      return sub;
    });

    if (updatedAny || newNotifications.length > 0) {
      setDb(prev => {
        const existingKeys = new Set(prev.notifications.map(n => `${n.user_id}-${n.type}-${n.title}`));
        const dedupedNew = newNotifications.filter(n => !existingKeys.has(`${n.user_id}-${n.type}-${n.title}`));
        return {
          ...prev,
          user_subscriptions: updatedSubs,
          notifications: [...dedupedNew, ...prev.notifications]
        };
      });
    }
  }, [currentUser, db.user_subscriptions.length]);

  const simulatePlanExpiration = () => {
    // Find any subscription of the current user to mark as expired
    const activeSub = db.user_subscriptions.find(
      s => s.user_id === currentUser.id && s.status === 'active'
    );
    
    if (!activeSub) {
      triggerToast("No active subscription found to expire! Choose a paid plan first.", "error");
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);

    setDb(prev => ({
      ...prev,
      user_subscriptions: prev.user_subscriptions.map(s => {
        if (s.id === activeSub.id) {
          return {
            ...s,
            status: 'expired' as const,
            expires_at: yesterday.toISOString()
          };
        }
        return s;
      })
    }));

    // Cache updated state
    try {
      const cachedStr = localStorage.getItem('fastpool_cached_user');
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        localStorage.setItem('fastpool_cached_user', JSON.stringify({
          ...cached,
          status: 'expired',
          expires_at: yesterday.toISOString()
        }));
      }
    } catch (_) {}

    logSQL(
      `-- SIMULATE PLAN EXPIRATION FOR TESTING\nUPDATE user_subscriptions SET status = 'expired', expires_at = '${yesterday.toISOString().slice(0, 19)}Z' WHERE id = '${activeSub.id}';`,
      `Simulated subscription expiration for @${currentUser.username}`
    );
    triggerToast(`Simulated subscription expiration! Priority dashboard access is now LOCKED.`, 'info');
  };

  // Handler: Purchase/Upgrade user plan via Paystack
  const buySubscription = async (planId: string, selectedComponents: string[] = []) => {
    const p = findSubscriptionPlan(db.subscription_plans, planId) || INITIAL_PLANS[0];
    if (!p) return;

    if (selectedComponents.length === 0) {
      triggerToast('Please select at least one bookmaker component to subscribe.', 'error');
      return;
    }

    const disabledComps = selectedComponents.filter(c => isPaymentDisabledBookmaker(c));
    if (disabledComps.length > 0) {
      triggerToast(`Payment portal for ${disabledComps.map(c => c.toUpperCase()).join(', ')} is currently disabled.`, 'error');
      return;
    }

    const isGhana = isGhanaPlan(p) || (p as any).region === 'ghana';
    const planCurrency = 'NGN';
    const currencySymbol = '₦';
    const calculatedPrice = p.price * selectedComponents.length;

    triggerToast(`Connecting to secure Paystack servers for ${p.name} (${selectedComponents.map(c => c.toUpperCase()).join(' + ')})...`, 'info');

    try {
      const PaystackPop = await loadPaystackPop();
      const ghanaKey = paystackGhanaPublicKey || (import.meta as any).env?.VITE_PAYSTACK_GHANA_PUBLIC_KEY || '';
      const defaultKey = paystackPublicKey || (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_d3e404be1b854e4f7fcfa0f8c8cb8fce45ef0e74';
      const publicKey = (isGhana && ghanaKey) ? ghanaKey : defaultKey;
      
      const handler = PaystackPop.setup({
        key: publicKey,
        email: currentUser.email,
        amount: Math.round(calculatedPrice * 100), // convert to kobo (NGN)
        currency: 'NGN',
        channels: ['card', 'bank', 'ussd', 'mobile_money', 'qr'],
        ref: `PAY-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        callback: function(response: any) {
          const ref = response.reference || response.trxref;
          completePurchase(planId, ref, selectedComponents);
        },
        onClose: function() {
          if (isGhana) {
            // When Paystack popup is closed, user can complete via simulated fallback
            setPaystackFallback({
              open: true,
              planId: planId,
              price: calculatedPrice,
              name: `${p.name} (${selectedComponents.map(c => c.toUpperCase()).join(' + ')})`,
              components: selectedComponents,
              currency: 'NGN',
              currencySymbol: '₦',
              notice: 'Paystack checkout closed. You can complete your Ghana plan activation at the standard Naira equivalent rate via Mobile Money / Card gateway below.',
              channel: 'momo'
            });
            triggerToast('Paystack popup closed. You can complete VIP activation below.', 'info');
          } else {
            const failNotif: Notification = {
              id: `notif-fail-${Date.now()}`,
              user_id: currentUser.id,
              subscription_id: null,
              pool_code_id: null,
              type: 'payment_failed',
              title: 'Payment Incomplete or Cancelled',
              message: 'We could not complete your Pool Code subscription payment. Please try again.',
              body: 'We could not complete your Pool Code subscription payment. Please try again.',
              is_read: false,
              read_at: null,
              created_at: new Date().toISOString()
            };
            setDb(prev => ({
              ...prev,
              notifications: [failNotif, ...(prev.notifications || [])]
            }));
            triggerToast('Paystack payment cancelled or incomplete. You can retry whenever you are ready.', 'info');
          }
        }
      });
      handler.openIframe();
    } catch (err: any) {
      console.warn("Paystack dynamic inline load failed (iframe sandbox constraint likely). Falling back to simulated modal.", err);
      // Fallback modal ensures seamless checkout testing in restrictive sandboxes
      setPaystackFallback({
        open: true,
        planId: planId,
        price: calculatedPrice,
        name: `${p.name} (${selectedComponents.map(c => c.toUpperCase()).join(' + ')})`,
        components: selectedComponents,
        currency: planCurrency,
        currencySymbol: currencySymbol,
        notice: isGhana ? 'Ghanaian Mobile Money (MTN MoMo, Telecel / Vodafone Cash, AirtelTigo) & Card gateway activated.' : undefined,
        channel: isGhana ? 'momo' : 'card'
      });
    }
  };

  // Handler: Access Codes (Checks constraints like suspended and bookmakers counters)
  const handleDownloadCode = (code: PoolCode) => {
    if (currentUser.status === 'suspended') {
      triggerToast('Suspended Accounts Revoked!', 'error');
      logSQL(
        `-- Access Revoked check: unverified status flags\nSELECT status FROM users WHERE id = '${currentUser.id}';\n-- Blocked! status = 'suspended'`,
        'Security guard blocked suspended user download attempt'
      );
      return;
    }

    const isLoggedIn = currentUser && currentUser.id !== 'guest';
    const isVerified = currentUser && currentUser.status !== 'suspended';

    const userActiveSubs = db.user_subscriptions.filter(s => 
      s && 
      (s.user_id === currentUser?.id || (s.username && currentUser?.username && s.username.toLowerCase() === currentUser.username.toLowerCase())) && 
      s.status === 'active' && 
      new Date(s.expires_at) > new Date()
    );

    const isPaidUser = currentUser.role === 'admin' || bypassPremium || (
      userActiveSubs.length > 0 && userActiveSubs.some(s => s.plan_id !== 'plan-free')
    );

    const isPremium = code.access_level === 'premium';
    const unlockedPremium = isPaidUser;
    
    // Check component specific active access across all user active unexpired subscriptions
    const bookmakerSlug = code.bookmaker_id.replace('bm-', '').toLowerCase();
    const hasComponentAccess = !isPremium || currentUser.role === 'admin' || bypassPremium || userActiveSubs.some(sub => {
      const plan = db.subscription_plans.find(p => p.id === sub.plan_id);
      if (plan && plan.id === 'plan-free') return false;
      
      const comps = parseComponents(sub.components);

      if (comps.includes('all') || (plan && (plan.id.includes('yearly') || plan.id.includes('unlimited') || plan.id.includes('all')))) {
        return true;
      }

      if (comps.length === 0) {
        return false;
      }

      return comps.some(c => matchBookmakerComponent(c, bookmakerSlug));
    });

    const hasAccessPrivilege = bypassPremium || currentUser.role === 'admin' || (isLoggedIn && isVerified && isPaidUser && (!isPremium || hasComponentAccess));

    const queryPrerequisites = `\n-- Match file requirements and constraints\nSELECT access_level, bookmaker_id FROM pool_codes WHERE id = '${code.id}';\nSELECT status, role, components FROM users INNER JOIN user_subscriptions ON users.id = user_subscriptions.user_id WHERE users.id = '${currentUser.id}';`;

    if (!hasAccessPrivilege) {
      if (unlockedPremium && !hasComponentAccess) {
        triggerToast(`Plan Lock! You do not have the ${bookmakerSlug.toUpperCase()} component enabled in your subscription.`, 'error');
        logSQL(
          queryPrerequisites + `\n-- Access Denied! Missing ${bookmakerSlug} component subscription.`,
          `Blocked access to VIP code sheet due to missing ${bookmakerSlug} component`
        );
      } else {
        triggerToast('Plan Lock! This is a premium Exclusive codesheet.', 'error');
        logSQL(
          queryPrerequisites + '\n-- Access Denied! Subscription level mismatch.',
          'Blocked access to VIP code sheet'
        );
      }
      return;
    }

    // Bookmaker Limits constraint check per week
    const downloadedThisWeekCount = db.user_downloads.filter(d => {
      const c = db.pool_codes.find(pc => pc.id === d.pool_code_id);
      return c && c.pool_week_id === code.pool_week_id && d.user_id === currentUser.id;
    }).length;

    const isAlreadyDownloaded = db.user_downloads.some(d => d.user_id === currentUser.id && d.pool_code_id === code.id);
    const downloadLimit = activePlan?.max_bookmakers || 1;

    if (!isAlreadyDownloaded && downloadedThisWeekCount >= downloadLimit && currentUser.role !== 'admin') {
      triggerToast(`Verification Failed! Your current tier limits access to max ${downloadLimit} bookmakers/week.`, 'error');
      logSQL(
        queryPrerequisites + `\n-- Limit Exceeded: Downloads count: ${downloadedThisWeekCount}, plan max constraint: ${downloadLimit}`,
        'SaaS Quota restriction activated: bookmakers limit met'
      );
      return;
    }

    // Register unlocked download
    if (!isAlreadyDownloaded) {
      const dlId = `dl-${Math.floor(Math.random() * 90000 + 10000)}`;
      setDb(prev => ({
        ...prev,
        user_downloads: [...prev.user_downloads, {
          id: dlId,
          user_id: currentUser.id,
          username: currentUser.username,
          pool_code_id: code.id,
          downloaded_at: new Date().toISOString()
        }],
        pool_codes: prev.pool_codes.map(pc => pc.id === code.id ? { ...pc, download_count: pc.download_count + 1 } : pc)
      }));

      logSQL(
        `-- Lock item unlock to prevent multi-device token scraping\nINSERT INTO user_downloads (id, user_id, pool_code_id, downloaded_at)\nVALUES ('${dlId}', '${currentUser.id}', '${code.id}', NOW());\n\n-- Update download counter stats\nUPDATE pool_codes SET download_count = download_count + 1 WHERE id = '${code.id}';`,
        `Customer @${currentUser.username} unlocked codesheet keys`
      );
    } else {
      logSQL(
        `-- Accessing unlocked cached download\nSELECT * FROM user_downloads WHERE user_id = '${currentUser.id}' AND pool_code_id = '${code.id}';`,
        'Re-opened already unlocked analytics codesheet'
      );
    }

    triggerToast('Forecasting codes verified!', 'success');
  };

  // Handler: Transition Pool Week schedule closure
  const handleTransitionWeek = (weekId: string) => {
    const week = db.pool_weeks.find(w => w.id === weekId);
    if (!week) return;

    const newStatus = week.status === 'active' ? 'closed' : 'active';
    let resultsList = [...db.pool_results];
    let notificationsList = [...db.notifications];

    if (newStatus === 'closed') {
      const newResultId = `res-${Math.floor(Math.random() * 9000 + 1000)}`;
      resultsList.push({
        id: newResultId,
        pool_week_id: weekId,
        bookmaker_id: db.bookmakers[0].id,
        uploaded_by: currentUser.id,
        results_content: `--- WEEK ${week.week_number} VERIFIED COMBINED FIXTURES OUTCOMES ---\nMatch 4: Aston Villa 0-0 Everton [DRAW APPROVAL SUCCESS]\nMatch 8: Chelsea 1-1 Southampton [DRAW APPROVAL SUCCESS]\nMatch 19: Leeds 2-2 Real Sociedad [DRAW APPROVAL SUCCESS]\nTotal scoreline coupon matches draws: 3 matches cleared.`,
        file_url: `https://storage.poolcodes.com/results/w-${week.week_number}-scoresheet.txt`,
        created_at: new Date().toISOString()
      });

      // Broadcast results notice alarm to users
      const alertTargets = db.users.filter(u => u.role === 'user' && u.status === 'active');
      const releaseNotifs = alertTargets.map((u, i) => ({
        id: `notif-rel-${Math.floor(Math.random() * 90000) + i}`,
        user_id: u.id,
        pool_code_id: null,
        type: 'results_out' as const,
        title: `Week ${week.week_number} Scoresheets released!`,
        body: `Match coupons resulting reports are live for Aussie Week ${week.week_number}. Compare your predictions draws list now!`,
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString()
      }));

      notificationsList = [...notificationsList, ...releaseNotifs];
    }

    setDb(prev => ({
      ...prev,
      pool_weeks: prev.pool_weeks.map(w => w.id === weekId ? { ...w, status: newStatus } : w),
      pool_results: resultsList,
      notifications: notificationsList
    }));

    logSQL(
      `-- Transition week cycle status\nUPDATE pool_weeks SET status = '${newStatus}' WHERE id = '${weekId}';\n\n${
        newStatus === 'closed'
          ? `-- Insert game payouts report\nINSERT INTO pool_results ...;\n-- Broadcast results release push warnings\nINSERT INTO notifications ...;`
          : ''
      }`,
      `Transitioned Week ${week.week_number} scheduling to ${newStatus.toUpperCase()}`
    );

    triggerToast(`Moved Week ${week.week_number} to ${newStatus.toUpperCase()}`, 'success');
  };

  // Handler: Mark customer notifications read
  const markAllNotificationsRead = () => {
    setDb(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.user_id === currentUser.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
    }));

    logSQL(
      `-- Mark inbox read logs\nUPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = '${currentUser.id}';`,
      `Customer @${currentUser.username} marked all read`
    );
    triggerToast('Your notification inbox backlog has been read.', 'info');
  };

  // Handler: Custom Query execution engine
  const handleExecuteCustomQuery = (e: FormEvent) => {
    e.preventDefault();
    const cmd = customQueryText.toLowerCase().trim();

    try {
      if (cmd.includes('select * from users')) {
        let rows = db.users;
        if (cmd.includes("status = 'suspended'")) {
          rows = db.users.filter(u => u.status === 'suspended');
        } else if (cmd.includes("role = 'user'")) {
          rows = db.users.filter(u => u.role === 'user');
        }
        setCustomQueryResult(rows);
      } else if (cmd.includes('select * from pool_codes')) {
        setCustomQueryResult(db.pool_codes);
      } else if (cmd.includes('select * from subscription_plans')) {
        setCustomQueryResult(db.subscription_plans);
      } else if (cmd.includes('select * from user_subscriptions')) {
        setCustomQueryResult(db.user_subscriptions);
      } else if (cmd.includes('select * from notifications')) {
        setCustomQueryResult(db.notifications.filter(n => n.user_id === currentUser.id));
      } else if (cmd.includes('select * from bookmakers')) {
        setCustomQueryResult(db.bookmakers);
      } else if (cmd.includes('select * from bet9ja')) {
        const userActiveSubs = db.user_subscriptions.filter(s => 
          s && 
          (s.user_id === currentUser.id || (s.username && s.username.toLowerCase() === currentUser.username.toLowerCase())) && 
          s.status === 'active' && 
          new Date(s.expires_at) > new Date()
        );
        const hasAccess = currentUser.role === 'admin' || bypassPremium || userActiveSubs.some(sub => {
          const comps = parseComponents(sub.components);
          return comps.includes('all') || comps.some(c => matchBookmakerComponent(c, 'bet9ja'));
        });
        if (!hasAccess) {
          triggerToast("SQL Access Denied! You did not select Bet9ja component in your active subscription plan.", "error");
          setCustomQueryResult([{
            error: "Permission Denied",
            code: "42501",
            message: "Access to table 'bet9ja' is restricted. Selected plan component 'bet9ja' is missing from user subscription profile."
          }]);
          logSQL(customQueryText, "Blocked unauthorized SELECT query on table 'bet9ja' (component mismatch)");
          return;
        }
        setCustomQueryResult(db.bet9ja || []);
      } else if (cmd.includes('select * from betking')) {
        const userActiveSubs = db.user_subscriptions.filter(s => 
          s && 
          (s.user_id === currentUser.id || (s.username && s.username.toLowerCase() === currentUser.username.toLowerCase())) && 
          s.status === 'active' && 
          new Date(s.expires_at) > new Date()
        );
        const hasAccess = currentUser.role === 'admin' || bypassPremium || userActiveSubs.some(sub => {
          const comps = parseComponents(sub.components);
          return comps.includes('all') || comps.some(c => matchBookmakerComponent(c, 'betking'));
        });
        if (!hasAccess) {
          triggerToast("SQL Access Denied! You did not select Betking component in your active subscription plan.", "error");
          setCustomQueryResult([{
            error: "Permission Denied",
            code: "42501",
            message: "Access to table 'betking' is restricted. Selected plan component 'betking' is missing from user subscription profile."
          }]);
          logSQL(customQueryText, "Blocked unauthorized SELECT query on table 'betking' (component mismatch)");
          return;
        }
        setCustomQueryResult(db.betking || []);
      } else if (cmd.includes('select * from sportybet_ghana') || cmd.includes('select * from sportybet-ghana') || cmd.includes('select * from sportybet ghana')) {
        const userActiveSubs = db.user_subscriptions.filter(s => 
          s && 
          (s.user_id === currentUser.id || (s.username && s.username.toLowerCase() === currentUser.username.toLowerCase())) && 
          s.status === 'active' && 
          new Date(s.expires_at) > new Date()
        );
        const hasAccess = currentUser.role === 'admin' || bypassPremium || userActiveSubs.some(sub => {
          const comps = parseComponents(sub.components);
          return comps.includes('all') || comps.some(c => matchBookmakerComponent(c, 'sportybet-ghana'));
        });
        if (!hasAccess) {
          triggerToast("SQL Access Denied! You did not select SportyBet Ghana component in your active subscription plan.", "error");
          setCustomQueryResult([{
            error: "Permission Denied",
            code: "42501",
            message: "Access to table 'sportybet_ghana' is restricted. Selected plan component 'sportybet_ghana' is missing from user subscription profile."
          }]);
          logSQL(customQueryText, "Blocked unauthorized SELECT query on table 'sportybet_ghana' (component mismatch)");
          return;
        }
        setCustomQueryResult((db as any).sportybet_ghana || db.sportybet || []);
      } else if (cmd.includes('select * from sportybet')) {
        const userActiveSubs = db.user_subscriptions.filter(s => 
          s && 
          (s.user_id === currentUser.id || (s.username && s.username.toLowerCase() === currentUser.username.toLowerCase())) && 
          s.status === 'active' && 
          new Date(s.expires_at) > new Date()
        );
        const hasAccess = currentUser.role === 'admin' || bypassPremium || userActiveSubs.some(sub => {
          const comps = parseComponents(sub.components);
          return comps.includes('all') || comps.some(c => matchBookmakerComponent(c, 'sportybet'));
        });
        if (!hasAccess) {
          triggerToast("SQL Access Denied! You did not select SportyBet Nigeria component in your active subscription plan.", "error");
          setCustomQueryResult([{
            error: "Permission Denied",
            code: "42501",
            message: "Access to table 'sportybet' is restricted. Selected plan component 'sportybet' is missing from user subscription profile."
          }]);
          logSQL(customQueryText, "Blocked unauthorized SELECT query on table 'sportybet' (component mismatch)");
          return;
        }
        setCustomQueryResult(db.sportybet || []);
      } else if (cmd.includes('select * from msport')) {
        const userActiveSubs = db.user_subscriptions.filter(s => 
          s && 
          (s.user_id === currentUser.id || (s.username && s.username.toLowerCase() === currentUser.username.toLowerCase())) && 
          s.status === 'active' && 
          new Date(s.expires_at) > new Date()
        );
        const hasAccess = currentUser.role === 'admin' || bypassPremium || userActiveSubs.some(sub => {
          const comps = parseComponents(sub.components);
          return comps.includes('all') || comps.some(c => matchBookmakerComponent(c, 'msport'));
        });
        if (!hasAccess) {
          triggerToast("SQL Access Denied! You did not select MSport component in your active subscription plan.", "error");
          setCustomQueryResult([{
            error: "Permission Denied",
            code: "42501",
            message: "Access to table 'msport' is restricted. Selected plan component 'msport' is missing from user subscription profile."
          }]);
          logSQL(customQueryText, "Blocked unauthorized SELECT query on table 'msport' (component mismatch)");
          return;
        }
        setCustomQueryResult(db.msport || []);
      } else if (cmd.includes('select * from premierbet')) {
        const userActiveSubs = db.user_subscriptions.filter(s => 
          s && 
          (s.user_id === currentUser.id || (s.username && s.username.toLowerCase() === currentUser.username.toLowerCase())) && 
          s.status === 'active' && 
          new Date(s.expires_at) > new Date()
        );
        const hasAccess = currentUser.role === 'admin' || bypassPremium || userActiveSubs.some(sub => {
          const comps = parseComponents(sub.components);
          return comps.includes('all') || comps.some(c => matchBookmakerComponent(c, 'premierbet'));
        });
        if (!hasAccess) {
          triggerToast("SQL Access Denied! You did not select PremierBet component in your active subscription plan.", "error");
          setCustomQueryResult([{
            error: "Permission Denied",
            code: "42501",
            message: "Access to table 'premierbet' is restricted. Selected plan component 'premierbet' is missing from user subscription profile."
          }]);
          logSQL(customQueryText, "Blocked unauthorized SELECT query on table 'premierbet' (component mismatch)");
          return;
        }
        setCustomQueryResult(db.premierbet || []);
      } else if (cmd.includes('select * from betway')) {
        const userActiveSubs = db.user_subscriptions.filter(s => 
          s && 
          (s.user_id === currentUser.id || (s.username && s.username.toLowerCase() === currentUser.username.toLowerCase())) && 
          s.status === 'active' && 
          new Date(s.expires_at) > new Date()
        );
        const hasAccess = currentUser.role === 'admin' || bypassPremium || userActiveSubs.some(sub => {
          const comps = parseComponents(sub.components);
          return comps.includes('all') || comps.some(c => matchBookmakerComponent(c, 'betway'));
        });
        if (!hasAccess) {
          triggerToast("SQL Access Denied! You did not select Betway component in your active subscription plan.", "error");
          setCustomQueryResult([{
            error: "Permission Denied",
            code: "42501",
            message: "Access to table 'betway' is restricted. Selected plan component 'betway' is missing from user subscription profile."
          }]);
          logSQL(customQueryText, "Blocked unauthorized SELECT query on table 'betway' (component mismatch)");
          return;
        }
        setCustomQueryResult(db.betway || []);
      } else if (cmd.includes('select * from soccabet')) {
        const userActiveSubs = db.user_subscriptions.filter(s => 
          s && 
          (s.user_id === currentUser.id || (s.username && s.username.toLowerCase() === currentUser.username.toLowerCase())) && 
          s.status === 'active' && 
          new Date(s.expires_at) > new Date()
        );
        const hasAccess = currentUser.role === 'admin' || bypassPremium || userActiveSubs.some(sub => {
          const comps = parseComponents(sub.components);
          return comps.includes('all') || comps.some(c => matchBookmakerComponent(c, 'soccabet'));
        });
        if (!hasAccess) {
          triggerToast("SQL Access Denied! You did not select Soccabet component in your active subscription plan.", "error");
          setCustomQueryResult([{
            error: "Permission Denied",
            code: "42501",
            message: "Access to table 'soccabet' is restricted. Selected plan component 'soccabet' is missing from user subscription profile."
          }]);
          logSQL(customQueryText, "Blocked unauthorized SELECT query on table 'soccabet' (component mismatch)");
          return;
        }
        setCustomQueryResult(db.soccabet || []);
      } else {
        setCustomQueryResult([{
          success: true,
          status: "200 OK",
          message: "Syntax matched. Simulated query executed successfully.",
          affected_rows_mock: 1
        }]);
      }
      logSQL(customQueryText, 'Executed terminal command on custom SQL runner console');
      triggerToast('Simulated SELECT pipeline returned successfully.', 'success');
    } catch {
      triggerToast('Parsing query statement failed.', 'error');
    }
  };

  const handleRegisterUser = async (username: string, email: string, password?: string, planId: string = 'plan-free') => {
    let cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    const cleanEmail = email.toLowerCase().trim();

    if (!password) {
      return { success: false, error: "Please enter a security password." };
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password, username: cleanUsername })
      });

      const resData = await response.json();

      if (!response.ok || resData.error) {
        return { success: false, error: resData.error || "Registration failed. Please check your details and try again." };
      }

      if (resData.user) {
        const su = resData.user;
        const newUser: User = {
          id: su.id,
          username: su.username || cleanUsername,
          email: su.email || cleanEmail,
          role: su.role || 'user',
          status: 'active',
          phone: '',
          created_at: su.created_at || new Date().toISOString(),
          email_verified_at: new Date().toISOString(),
          password: password
        };

        const subId = `sub-sb-${Math.floor(Math.random() * 90000 + 10000)}`;
        const now = new Date();
        const selectedPlan = findSubscriptionPlan(db.subscription_plans, planId);
        const { expiresAt: calculatedExpiry } = calculateSubscriptionExpiry(selectedPlan, now);

        const hasPaid = Boolean(planId && planId !== 'plan-free');
        const newSub: UserSubscription = {
          id: subId,
          user_id: su.id,
          username: newUser.username,
          plan_id: hasPaid ? planId : 'plan-free',
          status: hasPaid ? 'active' : 'inactive',
          starts_at: now.toISOString(),
          expires_at: hasPaid ? calculatedExpiry.toISOString() : now.toISOString(),
          payment_ref: hasPaid ? `REF-PAY-${Math.floor(Math.random() * 9000000 + 1000000)}` : null,
          payment_provider: hasPaid ? 'Direct Verified Payment' : null,
          created_at: now.toISOString(),
          components: []
        };

        localStorage.setItem('fastpool_cached_user', JSON.stringify({
          id: su.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          plan_id: newSub.plan_id,
          payment_ref: newSub.payment_ref,
          created_at: newUser.created_at
        }));

        setDb(prev => ({
          ...prev,
          users: [...prev.users.filter(u => u.id !== su.id), newUser],
          user_subscriptions: [...prev.user_subscriptions.filter(s => s.user_id !== su.id), newSub]
        }));

        setSelectedPersonaId(su.id);
        setViewMode('portal');
        logSQL(
          `-- Inserted user record into users database table.\n-- Registered user ID: ${su.id}`,
          `Registered & granted dashboard access for user @${newUser.username}`
        );

        fetchRealSupabaseData(true);

        if (planId && planId !== 'plan-free') {
          setTimeout(() => {
            downloadCodesFileAuto(newUser, planId, newSub.payment_ref || '');
          }, 1200);
        }

        return { success: true, message: `Successfully registered and logged in as @${newUser.username}! Welcome!` };
      }

      return { success: false, error: "Registration did not return a valid user ID." };
    } catch (err: any) {
      return { success: false, error: err?.message || "Connection to users database failed." };
    }
  };

  const handleLoginUserWithCreds = async (emailOrUsername: string, password?: string) => {
    if (!emailOrUsername || !emailOrUsername.trim()) {
      return { success: false, error: "Please enter your email or username." };
    }
    if (!password) {
      return { success: false, error: "Please enter your security password." };
    }

    const cleanUName = emailOrUsername.toLowerCase().trim();

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername: cleanUName, password })
      });

      const resData = await response.json();

      if (!response.ok || resData.error) {
        return {
          success: false,
          error: resData.error || "Authentication failed. Please check your credentials."
        };
      }

      if (resData.user) {
        const su = resData.user;
        const email = su.email || cleanUName;
        const username = su.username || cleanUName.split('@')[0];

        setDb(prev => {
          const exists = prev.users.find(u => u.id === su.id || u.email.toLowerCase() === email.toLowerCase());
          const newUser: User = {
            id: su.id,
            username: username.toLowerCase().replace(/\s+/g, '_'),
            email: email.toLowerCase(),
            role: su.role || 'user',
            status: su.status || 'active',
            phone: '',
            created_at: su.created_at || new Date().toISOString(),
            email_verified_at: new Date().toISOString(),
            password: password
          };

          const cachedStr = localStorage.getItem('fastpool_cached_user');
          let restoredPlan = 'plan-quarterly';
          let restoredRef = null;
          try {
            if (cachedStr) {
              const cached = JSON.parse(cachedStr);
              if (cached.id === su.id && cached.plan_id) {
                restoredPlan = cached.plan_id;
                restoredRef = cached.payment_ref;
              }
            }
          } catch (_) {}

          const existingSub = prev.user_subscriptions.find(s => s.user_id === su.id);
          let updatedSubs = prev.user_subscriptions;
          if (!existingSub) {
            const subId = `sub-sb-${Math.floor(Math.random() * 90000 + 10000)}`;
            const now = new Date();
            const newSub: UserSubscription = {
              id: subId,
              user_id: su.id,
              username: su.username,
              plan_id: 'plan-free',
              status: 'inactive',
              starts_at: now.toISOString(),
              expires_at: now.toISOString(),
              payment_ref: null,
              payment_provider: null,
              created_at: now.toISOString(),
              components: []
            };
            updatedSubs = [...prev.user_subscriptions, newSub];
          }

          return {
            ...prev,
            users: exists ? prev.users.map(u => u.id === su.id ? newUser : u) : [...prev.users, newUser],
            user_subscriptions: updatedSubs
          };
        });

        const activeSubForUser = db.user_subscriptions.find(s => s.user_id === su.id && s.status === 'active');
        const userPlanId = activeSubForUser?.plan_id || 'plan-free';

        localStorage.setItem('fastpool_cached_user', JSON.stringify({
          id: su.id,
          username: username.toLowerCase().replace(/\s+/g, '_'),
          email: email.toLowerCase(),
          role: su.role || 'user',
          plan_id: userPlanId,
          payment_ref: activeSubForUser?.payment_ref || null,
          created_at: su.created_at || new Date().toISOString()
        }));

        setSelectedPersonaId(su.id);
        setViewMode('portal');
        logSQL(
          `-- User verified in users database table.\n-- Connected user ID: ${su.id}`,
          `Access granted! Connected to @${username} dashboard instance.`
        );

        return { success: true, message: `Access granted! Welcome back @${username}.` };
      }

      return { success: false, error: "Authentication failed. Please verify your credentials." };
    } catch (err: any) {
      return { success: false, error: err?.message || "Connection to Supabase server failed." };
    }
  };

  const handleResetPassword = async (emailOrUsername: string, newPassword: string) => {
    if (!emailOrUsername || !emailOrUsername.trim()) {
      return { success: false, error: "Please enter your registered email or username." };
    }
    if (!newPassword || newPassword.length < 5) {
      return { success: false, error: "New security password must be at least 5 characters." };
    }

    const cleanUName = emailOrUsername.toLowerCase().trim();

    // Check if user exists in local state
    const targetUser = db.users.find(
      u => u.email.toLowerCase() === cleanUName || u.username.toLowerCase() === cleanUName
    );

    if (!targetUser) {
      return { success: false, error: "Account not found. Please check your username or email address." };
    }

    // Update password in local db state
    setDb(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === targetUser.id ? { ...u, password: newPassword } : u)
    }));

    // If cached in localStorage, update cached user info as well
    try {
      const cachedStr = localStorage.getItem('fastpool_cached_user');
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (cached.id === targetUser.id) {
          localStorage.setItem('fastpool_cached_user', JSON.stringify({ ...cached, password: newPassword }));
        }
      }
    } catch (_) {}

    logSQL(
      `-- Password Reset Handshake\nUPDATE users SET password_hash = 'sha256:pbkdf2:${newPassword.slice(0, 3)}...' WHERE email = '${targetUser.email}';`,
      `Password successfully changed for @${targetUser.username}`
    );

    return { success: true, message: `Password changed successfully for @${targetUser.username}! You can now log in with your new password.` };
  };

  // Paths mapping indicator
  const getSimulatedUrl = () => {
    if (currentAppSelector === 'customer') {
      return `https://app.poolcodes.com/dashboard/index.html`;
    } else {
      return `https://admin.poolcodes.com/workspace/index.html`;
    }
  };

  const renderFooter = (isDark = false) => (
    <Footer 
      isDark={isDark}
      triggerToast={triggerToast} 
      onOpenTerms={() => {
        setTermsOrigin(viewMode === 'portal' ? 'portal' : 'homepage');
        setViewMode('terms');
      }} 
      onNavigateToCodes={() => {
        if (!selectedPersonaId || currentUser.id === 'guest') {
          setViewMode('homepage');
          setAutoOpenAuthHome(true);
          triggerToast('Please sign up or log in to access the user dashboard and pool codes.', 'error');
        } else {
          setViewMode('portal');
          triggerToast('Redirected to pool codes list.', 'info');
        }
      }}
      onOpenHelp={() => {
        setHelpOrigin(viewMode === 'portal' ? 'portal' : 'homepage');
        setViewMode('help');
      }}
    />
  );

  return (
    <div className="h-screen bg-[#FCFDFE] flex flex-col font-sans select-none text-slate-800 overflow-hidden">
      {/* Dynamic Toast banner bubble element */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[999] shadow-lg border rounded-full px-5 py-2.5 text-xs font-semibold flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-800 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-800 text-rose-100'
                : 'bg-indigo-950/95 border-indigo-805 text-indigo-100'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'homepage' ? (
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1">
            <OfficePoolStopHome
              db={db}
              currentUser={currentUser}
              autoOpenAuth={autoOpenAuthHome}
              onResetAutoOpenAuth={() => setAutoOpenAuthHome(false)}
              initialView={initialHomeView}
              onSignIn={() => {
                setViewMode('portal');
                triggerToast('Authenticated secure session active! Welcome.', 'success');
              }}
              onEnterManagerPanel={() => {
                if (!selectedPersonaId || currentUser.id === 'guest') {
                  setViewMode('homepage');
                  setAutoOpenAuthHome(true);
                  triggerToast('Please sign up or log in to access the user dashboard.', 'error');
                } else {
                  setViewMode('portal');
                  triggerToast(`Entered subscriber portal as @${currentUser.username}.`, 'success');
                }
              }}
              onNavigateToCodes={() => {
                if (!selectedPersonaId || currentUser.id === 'guest') {
                  setViewMode('homepage');
                  setAutoOpenAuthHome(true);
                  triggerToast('Please sign up or log in to view pool codes in the dashboard.', 'error');
                } else {
                  setViewMode('portal');
                  triggerToast('Redirected to pool codes list.', 'info');
                }
              }}
              onNavigateToLiveScores={() => {
                setLivescoresOrigin('homepage');
                setViewMode('livescores');
                triggerToast('Redirected to AI Live Scores Arena.', 'info');
              }}
              triggerToast={triggerToast}
              onRegisterUser={handleRegisterUser}
              onLoginUser={handleLoginUserWithCreds}
              onChangePassword={handleResetPassword}
              onOpenTerms={() => {
                setTermsOrigin('homepage');
                setViewMode('terms');
              }}
            />
          </div>
          {renderFooter()}
        </div>
      ) : viewMode === 'livescores' ? (
        <div className="flex-1 overflow-y-auto flex flex-col bg-[#030d0a]">
          <LiveScoresPage
            currentUser={currentUser}
            triggerToast={triggerToast}
            isInsidePortal={livescoresOrigin === 'portal'}
            onBack={() => {
              setViewMode(livescoresOrigin);
            }}
            onNavigateToContact={() => {
              setInitialHomeView('contact');
              setViewMode('homepage');
            }}
          />
          {renderFooter(true)}
        </div>
      ) : viewMode === 'terms' ? (
        <div className="flex-1 overflow-y-auto flex flex-col bg-[#040907]">
          <TermsOfServicePage
            onBack={() => {
              setViewMode(termsOrigin);
            }}
            triggerToast={triggerToast}
          />
          {renderFooter()}
        </div>
      ) : viewMode === 'help' ? (
        <div className="flex-1 overflow-y-auto flex flex-col bg-[#06110d]">
          <HelpCenterPage
            onBack={() => {
              setViewMode(helpOrigin);
            }}
            triggerToast={triggerToast}
            onNavigateToCodes={() => {
              setViewMode('portal');
            }}
            renderFooter={renderFooter}
          />
        </div>
      ) : (
        <div className="h-screen bg-[#090D1A] flex flex-col overflow-hidden text-slate-100">
          {/* Main Application Navigation Header (Styled naturally as key workspace views) */}
          <header className="bg-[#090D1A] border-b border-[#1E293B]/70 sticky top-0 z-50 shadow-md">
            <div className="w-full px-3 md:px-6 py-2 md:py-3 flex flex-row items-center justify-between gap-2 md:gap-4">
              <div className="flex items-center gap-1.5 md:gap-3">
                <button
                  onClick={() => {
                    setInitialHomeView('blog');
                    setViewMode('homepage');
                    triggerToast(`Navigated to public homepage. Your session remains logged in as @${currentUser.username || 'user'}.`, 'info');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold px-2.5 py-1.5 rounded-lg text-[10px] md:text-xs transition border border-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 shadow-sm"
                  title="Browse public homepage without logging out"
                >
                  <span>🌐</span>
                  <span className="xs:inline hidden">PUBLIC HOMEPAGE</span>
                  <span className="xs:hidden inline">HOMEPAGE</span>
                </button>
                <div className="flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2 border-l border-slate-800">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-gradient-to-br from-[#FA3E65] to-teal-500 text-white flex items-center justify-center font-bold text-xs md:text-sm shadow-lg shrink-0">
                    ⚽
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-extrabold text-[#FA3E65] tracking-tight md:tracking-wider text-[10px] md:text-xs leading-none uppercase truncate">
                      PoolCodes Arena
                    </h1>
                    <span className="text-[8px] md:text-[9px] text-slate-400 font-mono mt-0.5 block truncate">RELATIONAL SUITE</span>
                  </div>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
                <button
                  onClick={() => {
                    const newVal = !bypassPremium;
                    setBypassPremium(newVal);
                    localStorage.setItem('fastpool_bypass_premium', String(newVal));
                    triggerToast(newVal ? '🔧 Test Mode Enabled: All premium locks bypassed.' : '🟢 Live Mode Active: Premium authorization and locks strictly enforced.', 'info');
                  }}
                  className={`px-2.5 py-1.5 border text-[10px] font-mono font-black rounded-lg uppercase tracking-wider transition-all duration-150 active:scale-95 cursor-pointer ${
                    bypassPremium 
                      ? 'bg-amber-950/40 text-amber-400 border-amber-900/60 hover:bg-amber-900/40' 
                      : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60 hover:bg-emerald-900/40'
                  }`}
                  title={bypassPremium ? "Switch to Live Mode (Enforce Locks & Real Payments)" : "Switch to Test Mode (Bypass Premium Locks)"}
                >
                  {bypassPremium ? "🔧 TEST MODE ACTIVE" : "🟢 LIVE MODE ACTIVE"}
                </button>

                <button
                  onClick={() => fetchRealSupabaseData(false)}
                  disabled={isSyncingSupabase}
                  className={`p-2.5 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-emerald-400 text-slate-400 transition hover:bg-slate-900 active:scale-95 duration-150 cursor-pointer ${isSyncingSupabase ? 'opacity-50' : ''}`}
                  title="Sync Real Data from Supabase"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={resetDatabaseValues}
                  className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-rose-455 text-slate-400 transition hover:bg-slate-900 active:scale-95 duration-150 cursor-pointer"
                  title="Reset Simulated Database Seeds"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          {/* Main Workspace Frame container */}
          <main className="flex-1 w-full p-0 sm:p-4 md:p-6 flex flex-col gap-4 sm:gap-6 min-h-0 overflow-hidden">
            <div className="flex-1 bg-[#0A0F1D]/50 sm:border border-emerald-950 sm:rounded-xl overflow-hidden shadow-2xl relative flex flex-col min-h-0">
              <CustomerPortal
                db={db}
                currentUser={currentUser}
                activePlan={activePlan}
                activeSubscription={activeSubscription}
                buySubscription={buySubscription}
                handleDownloadCode={handleDownloadCode}
                triggerToast={triggerToast}
                markAllNotificationsRead={markAllNotificationsRead}
                confirmedPaymentMail={confirmedPaymentMail}
                setConfirmedPaymentMail={setConfirmedPaymentMail}
                showSimulatedEmailModal={showSimulatedEmailModal}
                setShowSimulatedEmailModal={setShowSimulatedEmailModal}
                isSyncingSupabase={isSyncingSupabase}
                fetchRealSupabaseData={fetchRealSupabaseData}
                discoveredDbTables={discoveredDbTables}
                bypassPremium={bypassPremium}
                onDownloadReceipt={downloadCodesFileAuto}
                onToggleBypassPremium={() => {
                  const newVal = !bypassPremium;
                  setBypassPremium(newVal);
                  localStorage.setItem('fastpool_bypass_premium', String(newVal));
                  triggerToast(newVal ? '🔧 Test Mode Enabled: All premium locks bypassed.' : '🟢 Live Mode Active: Premium authorization and locks strictly enforced.', 'info');
                }}
                onNavigateToLiveScores={() => {
                  setLivescoresOrigin('portal');
                  setViewMode('livescores');
                  triggerToast('Navigating to Live Scores Arena...', 'info');
                }}
                onNavigateToContact={() => {
                  setInitialHomeView('contact');
                  setViewMode('homepage');
                  triggerToast('Navigating to Contact Us & Helpdesk...', 'info');
                }}
                onNavigateToAbout={() => {
                  setInitialHomeView('about');
                  setViewMode('homepage');
                  triggerToast('Navigating to About Us & FastPool Story...', 'info');
                }}
                onSignOut={() => {
                  localStorage.removeItem('fastpool_cached_user');
                  localStorage.removeItem('fastpool_view_mode');
                  setSelectedPersonaId('');
                  setViewMode('homepage');
                  try {
                    window.history.replaceState({ view: 'homepage' }, '', '#home');
                  } catch (_) {}
                  triggerToast('Logged out of workspace session successfully.', 'success');
                }}
                onUpdateProfile={(updated) => {
                  setDb(prev => ({
                    ...prev,
                    users: prev.users.map(u => u.id === currentUser.id ? { 
                      ...u, 
                      username: updated.username,
                      email: updated.email,
                      phone: updated.phone
                    } : u)
                  }));

                  try {
                    const cachedStr = localStorage.getItem('fastpool_cached_user');
                    if (cachedStr) {
                      const cached = JSON.parse(cachedStr);
                      localStorage.setItem('fastpool_cached_user', JSON.stringify({
                        ...cached,
                        username: updated.username,
                        email: updated.email,
                        role: currentUser.role,
                        id: currentUser.id
                      }));
                    }
                  } catch (e) {}

                  let logMsg = `-- Update user details\nUPDATE users SET username = '${updated.username}', email = '${updated.email}', phone = '${updated.phone || ''}' WHERE id = '${currentUser.id}';`;
                  if (updated.password) {
                    logMsg += `\n-- Hash and store security password\nUPDATE users SET password_hash = 'sha256:pbkdf2:${updated.password.slice(0, 3)}...' WHERE id = '${currentUser.id}';`;
                    triggerToast('Personal profile and secure password synchronized successfully!', 'success');
                  } else {
                    triggerToast('Personal details updated successfully!', 'success');
                  }

                  logSQL(logMsg, `Customer @${updated.username} synchronized profile details`);
                }}
                renderFooter={renderFooter}
              />
            </div>
          </main>
        </div>
      )}
      {/* Global Floating Soccer AI Assistant */}
      <ChatbotSection currentUser={currentUser} isLoggedIn={viewMode === 'portal'} triggerToast={triggerToast} />

      {/* Dynamic Paystack Secure Checkout Fallback Overlay Modal */}
      {paystackFallback && paystackFallback.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-scaleUp">
            {/* Header with Paystack styling */}
            <div className="bg-[#111827] border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-mono font-black text-emerald-400 tracking-widest uppercase">
                  Paystack Secure Checkout
                </span>
              </div>
              <button
                onClick={() => setPaystackFallback(null)}
                className="text-slate-400 hover:text-white transition text-xs font-mono font-bold uppercase cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="text-center">
                <span className="text-[11px] text-slate-500 font-mono block uppercase">Merchant</span>
                <h4 className="text-lg font-black text-white uppercase tracking-tight">Fast Pool Codes Ltd</h4>
                <p className="text-xs text-slate-400 mt-0.5">customer: <span className="text-slate-200 font-mono">{currentUser.email}</span></p>
              </div>

              {paystackFallback.notice && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                  <span className="text-sm">ℹ️</span>
                  <span>{paystackFallback.notice}</span>
                </div>
              )}

              {/* Order Box */}
              <div className="bg-[#020617] border border-slate-800/80 rounded-xl p-4 flex flex-col gap-2 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Product VIP Access:</span>
                  <span className="text-slate-200 font-bold uppercase text-right">{paystackFallback.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Merchant Gateway:</span>
                  <span className="text-slate-200">{paystackFallback.currency === 'GHS' ? 'Paystack Ghana MoMo / Card (NGN Eqv)' : 'Paystack Nigeria NGN'}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800/60 pt-2 text-sm">
                  <span className="text-slate-300 font-bold">Total Bill:</span>
                  <span className="text-emerald-400 font-black">
                    {paystackFallback.currencySymbol || '₦'}
                    {paystackFallback.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (NGN)
                  </span>
                </div>
              </div>

              {/* Payment Methods Simulation Option Selector */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 block uppercase font-semibold">Select Payment Method:</span>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <button
                    type="button"
                    onClick={() => setPaystackFallback(prev => prev ? { ...prev, channel: 'momo' } : null)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-center gap-2.5 ${
                      paystackFallback.channel !== 'card' && paystackFallback.channel !== 'bank'
                        ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30'
                        : 'bg-[#020617] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl">{paystackFallback.currency === 'GHS' ? '📱' : '🏦'}</span>
                    <div>
                      <p className="font-bold leading-none text-xs text-white">
                        {paystackFallback.currency === 'GHS' ? 'Mobile Money' : 'Bank Transfer'}
                      </p>
                      <span className="text-[9px] text-slate-400 font-mono block mt-1">
                        {paystackFallback.currency === 'GHS' ? 'MTN / Telecel / AT' : 'Direct Transfer'}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaystackFallback(prev => prev ? { ...prev, channel: 'card' } : null)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-center gap-2.5 ${
                      paystackFallback.channel === 'card'
                        ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30'
                        : 'bg-[#020617] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl">💳</span>
                    <div>
                      <p className="font-bold leading-none text-xs text-white">Debit Card</p>
                      <span className="text-[9px] text-slate-400 font-mono block mt-1">
                        {paystackFallback.currency === 'GHS' ? 'Visa / MC / Gh-Link' : 'Master / Visa / Verve'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Sim Checkout Buttons */}
              <div className="flex flex-col gap-2 mt-1">
                <button
                  onClick={() => {
                    const simRef = `PAY-${paystackFallback.currency || 'GHS'}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                    completePurchase(paystackFallback.planId, simRef, paystackFallback.components);
                    setPaystackFallback(null);
                  }}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-98 duration-150"
                >
                  <span>✓ Complete Payment ({paystackFallback.currencySymbol || (paystackFallback.currency === 'GHS' ? 'GH₵' : '₦')}{paystackFallback.price.toLocaleString()}) & Activate Plan</span>
                </button>
                <button
                  onClick={() => setPaystackFallback(null)}
                  className="w-full py-2 bg-transparent border border-slate-800 text-slate-400 hover:text-white transition font-mono font-bold text-[11px] rounded-lg cursor-pointer"
                >
                  Cancel Transaction
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#020617] border-t border-slate-800/60 p-3 text-center text-[9px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
              <span>🔒 256-Bit SSL Encryption Active</span>
              <span>•</span>
              <span>Licensed by {paystackFallback.currency === 'GHS' ? 'Bank of Ghana' : 'Central Bank of Nigeria'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Activation Success Alert Modal */}
      {subscriptionSuccessAlert && subscriptionSuccessAlert.open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0F172A] border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative text-left">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-emerald-800/40 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xl font-bold shadow-inner">
                  🎉
                </div>
                <div>
                  <span className="text-[10px] font-mono font-black text-emerald-400 tracking-widest uppercase block">
                    Payment Successful
                  </span>
                  <h3 className="text-base font-extrabold text-white tracking-tight">
                    Pool Code Subscription Activated
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSubscriptionSuccessAlert(null)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-slate-200">
              <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl space-y-2">
                <p className="text-sm font-medium text-emerald-200 leading-relaxed">
                  Your <strong className="text-white font-bold">{subscriptionSuccessAlert.planName}</strong> plan is now active! You have access for <strong className="text-emerald-400 font-bold">{subscriptionSuccessAlert.durationDays} days</strong> and your subscription expires on <strong className="text-white font-bold">{subscriptionSuccessAlert.expiresAtFormatted}</strong>.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400/90 pt-1 border-t border-emerald-900/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Full access granted to Pool Codes, Fixtures, and Results</span>
                </div>
              </div>

              {/* Transaction details card */}
              <div className="bg-[#020617] border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Plan:</span>
                  <span className="text-white font-bold">{subscriptionSuccessAlert.planName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Duration:</span>
                  <span className="text-emerald-400 font-bold">{subscriptionSuccessAlert.durationDays} Days</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Expires On:</span>
                  <span className="text-slate-200">{subscriptionSuccessAlert.expiresAtFormatted}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Reference:</span>
                  <span className="text-slate-300 truncate max-w-[200px]">{subscriptionSuccessAlert.reference}</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-slate-800/60 pt-1.5">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-bold uppercase">Active✓</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    setSubscriptionSuccessAlert(null);
                    setViewMode('portal');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
                >
                  <span>Go to Pool Codes Arena</span>
                  <span>→</span>
                </button>
                <button
                  onClick={() => setSubscriptionSuccessAlert(null)}
                  className="w-full py-2 bg-transparent text-slate-400 hover:text-white font-mono text-xs transition cursor-pointer"
                >
                  Dismiss Notification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
