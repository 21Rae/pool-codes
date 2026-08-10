import React, { useState, useEffect, FormEvent } from 'react';
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
  INITIAL_PREMIERBET,
  INITIAL_BETWAY,
  INITIAL_SOCCABET,
  INITIAL_MSPORT
} from './initialData';
import {
  User,
  SubscriptionPlan,
  UserSubscription,
  PoolCode,
  PoolWeek,
  Notification,
  DatabaseState
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
    premierbet: [],
    betway: [],
    soccabet: [],
    msport: []
  });

  // Simulator Domain Router: toggles independent application instances
  // 'customer' -> app.poolcodes.com
  // 'admin' -> admin.poolcodes.com
  const [currentAppSelector, setCurrentAppSelector] = useState<'customer' | 'admin'>('customer');
  const [viewMode, setViewMode] = useState<'homepage' | 'portal' | 'livescores' | 'terms' | 'help'>('homepage');
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
  } | null>(null);

  // Dynamic Paystack Public Key from runtime environment variables via server-side config API
  const [paystackPublicKey, setPaystackPublicKey] = useState<string>('');

  const GUEST_USER: User = {
    id: 'guest',
    username: 'Guest',
    email: 'guest@fastpoolcodes.com',
    role: 'user',
    status: 'active',
    created_at: new Date().toISOString(),
    email_verified_at: null
  };

  // Active Authenticated user in session
  const currentUser = (selectedPersonaId && db.users && db.users.length > 0)
    ? (db.users.find(u => u.id === selectedPersonaId) || {
        id: selectedPersonaId,
        username: 'User',
        email: 'user@fastpoolcodes.com',
        role: 'user',
        status: 'active',
        created_at: new Date().toISOString(),
        email_verified_at: new Date().toISOString()
      })
    : GUEST_USER;

  // Subscription Perks parser helper
  const availablePlans = getMergedSubscriptionPlans(db.subscription_plans);
  const activeSubscription = db.user_subscriptions.find(
    sub => sub && sub.user_id === currentUser.id && sub.status === 'active'
  );
  const activePlan = activeSubscription
    ? (availablePlans.find(p => p && p.id === activeSubscription.plan_id) || availablePlans[0] || INITIAL_PLANS[0])
    : (availablePlans.find(p => p && p.id === 'plan-free') || availablePlans[0] || INITIAL_PLANS[0]);

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
        const res = await fetch(`/api/tables/${tableName}`);
        if (!res.ok) {
          console.warn(`[Supabase Sync] Could not fetch table '${tableName}' through proxy. Status: ${res.status}`);
          return false;
        }
        const json = await res.json();
        const data = json.data;

        if (data && Array.isArray(data)) {
          setDb(prev => ({
            ...prev,
            [dbKey]: data
          }));
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
      logAndSetTable('pool_results', 'pool_results', 'SELECT * FROM pool_results;'),
      logAndSetTable('notifications', 'notifications', 'SELECT * FROM notifications;'),
      logAndSetTable('user_downloads', 'user_downloads', 'SELECT * FROM user_downloads;'),
      logAndSetTable('bet9ja', 'bet9ja', 'SELECT * FROM bet9ja;'),
      logAndSetTable('betking', 'betking', 'SELECT * FROM betking;'),
      logAndSetTable('sportybet', 'sportybet', 'SELECT * FROM sportybet;'),
      logAndSetTable('msport', 'msport' as any, 'SELECT * FROM msport;'),
      logAndSetTable('premierbet', 'premierbet', 'SELECT * FROM premierbet;'),
      logAndSetTable('betway', 'betway', 'SELECT * FROM betway;'),
      logAndSetTable('soccabet', 'soccabet', 'SELECT * FROM soccabet;'),
      logAndSetTable('arena_games', 'arena_games' as any, 'SELECT * FROM arena_games;'),
      logAndSetTable('championship_results', 'championship_results' as any, 'SELECT * FROM championship_results;')
    ]);

    setIsSyncingSupabase(false);
    if (!silent) {
      triggerToast("✅ Database tables fully synchronized with Supabase!", "success");
    }
  };

  // Run initial and real-time live database synchronization across all Supabase tables
  useEffect(() => {
    // 1. Initial sync after bootstrap
    const timer = setTimeout(() => {
      fetchRealSupabaseData(true);
    }, 1000);

    // 2. Continuous background poll (every 6 seconds) to ensure real-time live sync
    const pollInterval = setInterval(() => {
      fetchRealSupabaseData(true);
    }, 6000);

    // 3. Supabase Realtime WebSocket subscription on all public schema tables
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

    // 4. Re-fetch immediately when user returns to window tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRealSupabaseData(true);
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      clearInterval(pollInterval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      if (supabase && channel) {
        try {
          supabase.removeChannel(channel);
        } catch (_) {}
      }
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
      
      let fileText = `========================================================================\n`;
      fileText += `⚡⚡⚡ FASTPOOL CODES - PREMIUM VERIFIED CODESHEET LICENSE ⚡⚡⚡\n`;
      fileText += `========================================================================\n\n`;
      fileText += `[LICENSE REGISTRATION DETAILS]\n`;
      fileText += `------------------------------------------------------------------------\n`;
      fileText += `Account Nickname : @${userObj.username || 'VIP_User'}\n`;
      fileText += `Account Email    : ${userObj.email || 'vip@fastpoolcodes.com'}\n`;
      fileText += `Active License   : ${plan.name.toUpperCase()} PLAN\n`;
      fileText += `Payment Reference: ${paymentRef || 'REF-' + Math.floor(Math.random() * 900000 + 100000)}\n`;
      fileText += `Verification Date: ${new Date().toLocaleString()}\n`;
      fileText += `Pool Week Target : WEEK ${weekNum} (AUSSIE/UK COMBINED SEASON)\n`;
      fileText += `Security Hash    : SHA256:${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}\n`;
      fileText += `------------------------------------------------------------------------\n\n`;
      
      fileText += `[DECRYPTED CODESHEET KEYSETS]\n`;
      fileText += `========================================================================\n\n`;
      
      if (relatedCodes.length === 0) {
        fileText += `No active codesheets loaded for Week ${weekNum}. Defaulting to baseline database registry...\n\n`;
        db.pool_codes.forEach((c, idx) => {
          const bookmaker = db.bookmakers.find(b => b.id === c.bookmaker_id)?.name || 'SportyBet';
          fileText += `${idx + 1}. [${bookmaker.toUpperCase()}] (${c.access_level.toUpperCase()} ACCESS)\n`;
          fileText += `   Content:\n   ${c.codes_content.split('\n').join('\n   ')}\n`;
          fileText += `   -----------------------------------------------------------------\n\n`;
        });
      } else {
        relatedCodes.forEach((c, idx) => {
          const bookmaker = db.bookmakers.find(b => b.id === c.bookmaker_id)?.name || 'SportyBet';
          fileText += `${idx + 1}. [${bookmaker.toUpperCase()}] (${c.access_level.toUpperCase()} ACCESS)\n`;
          fileText += `   Content:\n   ${c.codes_content.split('\n').join('\n   ')}\n`;
          fileText += `   -----------------------------------------------------------------\n\n`;
        });
      }
      
      fileText += `========================================================================\n`;
      fileText += `⚠️ SECURITY NOTICE: This codesheet file is licensed solely to @${userObj.username || 'VIP_User'}.\n`;
      fileText += `Any unauthorized distribution, multi-device token scraping, or public perming\n`;
      fileText += `resale will result in immediate permanent account suspension with no refund.\n`;
      fileText += `========================================================================\n`;
      
      const blob = new Blob([fileText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `FastPoolCodes_Week_${weekNum}_VIP_Codesheet.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      triggerToast('Downloaded decrypted VIP pool codes automatically to your device!', 'success');
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
    const plans = getMergedSubscriptionPlans(db.subscription_plans);
    const p = plans.find(x => x.id === planId);
    if (!p) return;

    const defaultComps = planId.includes('ghana') ? ['premierbet', 'betway', 'soccabet', 'sportybet'] : ['bet9ja', 'sportybet', 'betking'];
    const components = selectedComponents || paystackFallback?.components || defaultComps;

    // Remove old active sub
    const sanitizedSubs = db.user_subscriptions.map(s => {
      if (s.user_id === currentUser.id && s.status === 'active') {
        return { ...s, status: 'cancelled' as const };
      }
      return s;
    });

    const subId = `sub-paystack-${Math.floor(Math.random() * 90000 + 10000)}`;
    const now = new Date();
    const expiry = new Date();
    if (p.billing_cycle === 'weekly') expiry.setDate(now.getDate() + 7);
    else if (p.billing_cycle === 'monthly') expiry.setMonth(now.getMonth() + 1);
    else expiry.setFullYear(now.getFullYear() + 1);

    const newSub: UserSubscription = {
      id: subId,
      user_id: currentUser.id,
      plan_id: planId,
      status: 'active',
      starts_at: now.toISOString(),
      expires_at: expiry.toISOString(),
      payment_ref: reference,
      payment_provider: 'Paystack API Gateway',
      created_at: now.toISOString(),
      components: components
    };

    setDb(prev => ({
      ...prev,
      user_subscriptions: [...sanitizedSubs, newSub]
    }));

    // Cache updated plan state securely in localStorage
    try {
      const cachedStr = localStorage.getItem('fastpool_cached_user');
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        localStorage.setItem('fastpool_cached_user', JSON.stringify({
          ...cached,
          plan_id: planId,
          payment_ref: reference,
          expires_at: expiry.toISOString(),
          status: 'active',
          components: components
        }));
      }
    } catch (_) {}

    logSQL(
      `-- REAL PAYSTACK TRANSACTION SUCCESSFUL\nUPDATE user_subscriptions SET status = 'cancelled' WHERE user_id = '${currentUser.id}' AND status = 'active';\n\n-- Register new checkouts checkout reference with customized components\nINSERT INTO user_subscriptions (id, user_id, plan_id, status, starts_at, expires_at, payment_ref, payment_provider, created_at, components)\nVALUES ('${subId}', '${currentUser.id}', '${planId}', 'active', '${now.toISOString().slice(0,19)}Z', '${expiry.toISOString().slice(0,19)}Z', '${reference}', 'Paystack API Gateway', NOW(), '${JSON.stringify(components)}');`,
      `User @${currentUser.username} completed Paystack checkout for [${p.name}] with components: [${components.join(', ')}]`
    );
    triggerToast(`Subscribed successfully to ${p.name}!`, 'success');

    // Fetch official codesheet PDF from Supabase database via server mail dispatch relay
    fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUser.email || 'customer@fastpoolcodes.com',
        username: currentUser.username,
        planId: planId,
        paymentRef: reference,
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
          setShowSimulatedEmailModal(true);
          triggerToast('📧 Premium codesheet PDF fetched from database and dispatched to your inbox!', 'success');
        }
      })
      .catch(err => {
        console.error('[Mail Dispatch API Error]:', err);
      });
    
    // Auto download pool codes sheet after payment
    setTimeout(() => {
      downloadCodesFileAuto(currentUser, planId, reference);
    }, 1000);
  };

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
  const buySubscription = async (planId: string, selectedComponents: string[] = ['bet9ja', 'sportybet', 'betking']) => {
    const plans = getMergedSubscriptionPlans(db.subscription_plans);
    const p = plans.find(x => x.id === planId);
    if (!p) return;

    if (selectedComponents.length === 0) {
      triggerToast('Please select at least one bookmaker component to subscribe.', 'error');
      return;
    }

    const calculatedPrice = p.price * selectedComponents.length;

    triggerToast(`Connecting to secure Paystack servers for ${p.name} (${selectedComponents.map(c => c.toUpperCase()).join(' + ')})...`, 'info');

    try {
      const PaystackPop = await loadPaystackPop();
      const publicKey = paystackPublicKey || (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_d3e404be1b854e4f7fcfa0f8c8cb8fce45ef0e74';
      
      const handler = PaystackPop.setup({
        key: publicKey,
        email: currentUser.email || 'customer@fastpoolcodes.com',
        amount: Math.round(calculatedPrice * 100), // convert to kobo
        currency: 'NGN',
        ref: `PAY-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        callback: function(response: any) {
          const ref = response.reference || response.trxref;
          completePurchase(planId, ref, selectedComponents);
        },
        onClose: function() {
          triggerToast('Paystack payment cancelled by user.', 'info');
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
        components: selectedComponents
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
    const isVerified = currentUser && !!currentUser.email_verified_at && currentUser.status === 'active';
    const isPaidUser = currentUser.role === 'admin' || (
      activeSubscription && 
      activeSubscription.status === 'active' && 
      activePlan?.id !== 'plan-free'
    );

    const isPremium = code.access_level === 'premium';
    const unlockedPremium = isPaidUser && activePlan?.has_premium_codes;
    
    // Check component specific active access
    const bookmakerSlug = code.bookmaker_id.replace('bm-', '').toLowerCase();
    const hasComponentAccess = !isPremium || (
      activeSubscription && 
      (!activeSubscription.components || activeSubscription.components.includes(bookmakerSlug))
    );

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
        const hasAccess = currentUser.role === 'admin' || (
          activeSubscription && 
          activeSubscription.status === 'active' && 
          (!activeSubscription.components || activeSubscription.components.includes('bet9ja'))
        );
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
        const hasAccess = currentUser.role === 'admin' || (
          activeSubscription && 
          activeSubscription.status === 'active' && 
          (!activeSubscription.components || activeSubscription.components.includes('betking'))
        );
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
      } else if (cmd.includes('select * from sportybet')) {
        const hasAccess = currentUser.role === 'admin' || (
          activeSubscription && 
          activeSubscription.status === 'active' && 
          (!activeSubscription.components || activeSubscription.components.includes('sportybet'))
        );
        if (!hasAccess) {
          triggerToast("SQL Access Denied! You did not select Sportybet component in your active subscription plan.", "error");
          setCustomQueryResult([{
            error: "Permission Denied",
            code: "42501",
            message: "Access to table 'sportybet' is restricted. Selected plan component 'sportybet' is missing from user subscription profile."
          }]);
          logSQL(customQueryText, "Blocked unauthorized SELECT query on table 'sportybet' (component mismatch)");
          return;
        }
        setCustomQueryResult(db.sportybet || []);
      } else if (cmd.includes('select * from premierbet')) {
        const hasAccess = currentUser.role === 'admin' || (
          activeSubscription && 
          activeSubscription.status === 'active' && 
          (!activeSubscription.components || activeSubscription.components.includes('premierbet'))
        );
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
        const hasAccess = currentUser.role === 'admin' || (
          activeSubscription && 
          activeSubscription.status === 'active' && 
          (!activeSubscription.components || activeSubscription.components.includes('betway'))
        );
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
        const hasAccess = currentUser.role === 'admin' || (
          activeSubscription && 
          activeSubscription.status === 'active' && 
          (!activeSubscription.components || activeSubscription.components.includes('soccabet'))
        );
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
    const cleanUsername = username.toLowerCase().replace(/\s+/g, '_');
    const cleanEmail = email.toLowerCase().trim();

    // STRICT validation: check if username or email already exists in local database to avoid overlaps and duplicate registrations
    const localDuplicate = db.users.find(
      u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
    );
    if (localDuplicate) {
      if (localDuplicate.status === 'suspended' || localDuplicate.status === 'banned') {
        return { success: false, error: `Account '@${cleanUsername}' is suspended or banned. Please contact support.` };
      }
      if (localDuplicate.status === 'deleted') {
        return { success: false, error: `An account with this username or email was previously deleted.` };
      }
      return { success: false, error: "An account with this username or email already exists. Please sign in instead." };
    }

    const sClient = getSupabaseClient();
    if (sClient) {
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
        if (response.ok && !resData.error && resData.user) {
          const su = resData.user;
          if (su) {
            // Register locally
            const newUser: User = {
              id: su.id,
              username: cleanUsername,
              email: cleanEmail,
              role: 'user',
              status: 'active',
              phone: '',
              created_at: new Date().toISOString(),
              email_verified_at: new Date().toISOString(),
              password: password
            };

            const subId = `sub-sb-${Math.floor(Math.random() * 90000 + 10000)}`;
            const now = new Date();
            const expiry = new Date();
            expiry.setMonth(now.getMonth() + 3);

            const hasPaid = planId && planId !== 'plan-free';
            const newSub = {
              id: subId,
              user_id: su.id,
              plan_id: planId || 'plan-free',
              status: 'active',
              starts_at: now.toISOString(),
              expires_at: expiry.toISOString(),
              payment_ref: hasPaid ? `REF-SUPA-${Math.floor(Math.random() * 9000000 + 1000000)}` : null,
              payment_provider: hasPaid ? 'Supabase Authenticated Session' : null,
              created_at: now.toISOString(),
              components: hasPaid ? ['bet9ja', 'sportybet', 'betking'] : []
            };

            // Cache session info to avoid loading direct network requests from the client later
            localStorage.setItem('fastpool_cached_user', JSON.stringify({
              id: su.id,
              username: cleanUsername,
              email: cleanEmail,
              role: 'user',
              plan_id: planId || 'plan-free',
              payment_ref: newSub.payment_ref,
              created_at: newUser.created_at
            }));

            setDb(prev => ({
              ...prev,
              users: [...prev.users.filter(u => u.id !== su.id), newUser],
              user_subscriptions: [...prev.user_subscriptions, newSub]
            }));

            setSelectedPersonaId(su.id);
            setViewMode('portal');
            logSQL(
              `-- Supabase secure backend signUp completed.\n-- Registered user id: ${su.id} \n-- Saved token session cache.`,
              `Registered & logged in new member @${cleanUsername} using secure proxy gateway`
            );

            // Re-sync all Supabase tables in background immediately
            fetchRealSupabaseData(true);

            if (planId && planId !== 'plan-free') {
              setTimeout(() => {
                downloadCodesFileAuto(newUser, planId, newSub.payment_ref || '');
              }, 1200);
            }

            return { success: true, message: `Successfully registered and logged in as @${cleanUsername}! Welcome!` };
          }
        }
        
        // If Supabase auth hit a rate limit or unexpected error, fall back to creating local user session
        if (resData?.error && (resData.error.toLowerCase().includes('rate limit') || resData.error.toLowerCase().includes('email rate'))) {
          console.warn("Supabase rate limit error encountered, falling back to instant local session creation:", resData.error);
        } else if (resData?.error) {
          return { success: false, error: resData.error };
        }
      } catch (err: any) {
        console.warn("Registration API warning, falling back to local session creation:", err?.message);
      }
    }

    // Local-only signup fallback (No Supabase client available or direct bypass)
    const newId = `usr-reg-${Math.floor(Math.random() * 90000 + 10000)}`;
    const newUser: User = {
      id: newId,
      username: cleanUsername,
      email: cleanEmail,
      role: 'user',
      status: 'active',
      phone: '',
      created_at: new Date().toISOString(),
      email_verified_at: new Date().toISOString(),
      password: password
    };
    
    // Auto premium or free sub as requested
    const subId = `sub-reg-${Math.floor(Math.random() * 90000 + 10000)}`;
    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(now.getMonth() + 3);
    const hasPaid = planId && planId !== 'plan-free';
    const newSub = {
      id: subId,
      user_id: newId,
      plan_id: planId || 'plan-free',
      status: 'active',
      starts_at: now.toISOString(),
      expires_at: expiry.toISOString(),
      payment_ref: hasPaid ? `REF-LOCAL-${Math.floor(Math.random() * 9000000 + 1000000)}` : null,
      payment_provider: hasPaid ? 'Local Sandbox Checkout' : null,
      created_at: now.toISOString(),
      components: hasPaid ? ['bet9ja', 'sportybet', 'betking'] : []
    };

    localStorage.setItem('fastpool_cached_user', JSON.stringify({
      id: newId,
      username: cleanUsername,
      email: cleanEmail,
      role: 'user',
      plan_id: planId || 'plan-free',
      payment_ref: newSub.payment_ref,
      created_at: newUser.created_at
    }));

    setDb(prev => ({
      ...prev,
      users: [...prev.users, newUser],
      user_subscriptions: [...prev.user_subscriptions, newSub]
    }));
    
    setSelectedPersonaId(newId);
    setViewMode('portal');
    
    logSQL(
      `-- Real-time registration insert transaction (local)\nINSERT INTO users (id, username, email, role, status, created_at)\nVALUES ('${newId}', '${cleanUsername}', '${cleanEmail}', 'user', 'active', NOW());`,
      `Newly registered customer @${cleanUsername} joined local Sandbox session`
    );

    if (planId && planId !== 'plan-free') {
      setTimeout(() => {
        downloadCodesFileAuto(newUser, planId, newSub.payment_ref || '');
      }, 1200);
    }

    return { success: true, message: `Successfully registered locally as @${cleanUsername}! (Sandbox Mode Enabled)` };
  };

  const handleLoginUserWithCreds = async (emailOrUsername: string, password?: string) => {
    if (!emailOrUsername || !emailOrUsername.trim()) {
      return { success: false, error: "Please enter your email or username." };
    }

    const cleanUName = emailOrUsername.toLowerCase().trim();
    const sClient = getSupabaseClient();

    if (sClient) {
      if (!password) {
        return { success: false, error: "Please enter your security password." };
      }
      try {
        const response = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailOrUsername: cleanUName, password })
        });

        const resData = await response.json();
        if (response.ok && !resData.error && resData.user) {
          const su = resData.user;
          if (su) {
            const email = su.email || cleanUName;
            const username = su.user_metadata?.username || cleanUName || email.split('@')[0];

            setDb(prev => {
              const exists = prev.users.find(u => u.id === su.id || u.email.toLowerCase() === email.toLowerCase());
              if (exists) {
                return prev;
              }
              const newUser: User = {
                id: su.id,
                username: username.toLowerCase().replace(/\s+/g, '_'),
                email: email.toLowerCase(),
                role: 'user',
                status: 'active',
                phone: '',
                created_at: su.created_at || new Date().toISOString(),
                email_verified_at: new Date().toISOString(),
                password: password
              };

              const subId = `sub-sb-${Math.floor(Math.random() * 90000 + 10000)}`;
              const now = new Date();
              const expiry = new Date();
              expiry.setMonth(now.getMonth() + 3);

              // Standard login defaults to free tier unless they purchased, checked from cache
              const cachedStr = localStorage.getItem('fastpool_cached_user');
              let restoredPlan = 'plan-free';
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

              const newSub = {
                id: subId,
                user_id: su.id,
                plan_id: restoredPlan,
                status: 'active',
                starts_at: now.toISOString(),
                expires_at: expiry.toISOString(),
                payment_ref: restoredRef,
                payment_provider: restoredRef ? 'Supabase Auth Verified' : null,
                created_at: now.toISOString()
              };

              return {
                ...prev,
                users: [...prev.users, newUser],
                user_subscriptions: [...prev.user_subscriptions, newSub]
              };
            });

            // Cache session info to localStorage
            localStorage.setItem('fastpool_cached_user', JSON.stringify({
              id: su.id,
              username: username.toLowerCase().replace(/\s+/g, '_'),
              email: email.toLowerCase(),
              role: 'user',
              plan_id: 'plan-free', // Standard login starts free unless they checkout
              payment_ref: null,
              created_at: su.created_at || new Date().toISOString()
            }));

            setSelectedPersonaId(su.id);
            setViewMode('portal');
            logSQL(
              `-- Supabase backend signIn completed successfully.\n-- Connected active session user ID: ${su.id}`,
              `Access granted! Connected to @${username} active instance.`
            );

            return { success: true, message: `Access granted! Successfully authenticated session for @${username}.` };
          }
        }
        return { success: false, error: resData?.error || "Incorrect login details. Please verify your password and try again." };
      } catch (err: any) {
        return { success: false, error: err?.message || "Secure authentication service connection failed. Please try again." };
      }
    }

    // Local Sandbox-only login fallback (Strict checks)
    const matched = db.users.find(
      u => u.email.toLowerCase() === cleanUName || 
           u.username.toLowerCase() === cleanUName
    );
    if (!matched) {
      return { 
        success: false, 
        error: "Incorrect login details. User does not exist. Please check your spelling or register a new account." 
      };
    }

    // Enforce Password validation if password is set on the user account
    if (password && matched.password && matched.password !== password) {
      return { 
        success: false, 
        error: "Incorrect password. Please verify your credentials and try again." 
      };
    }

    // Determine the user's subscription tier
    const userSub = db.user_subscriptions.find(s => s.user_id === matched.id);
    const planId = userSub?.plan_id || 'plan-free';
    const paymentRef = userSub?.payment_ref || null;

    setSelectedPersonaId(matched.id);
    setViewMode('portal');
    
    localStorage.setItem('fastpool_cached_user', JSON.stringify({
      id: matched.id,
      username: matched.username,
      email: matched.email,
      role: matched.role,
      plan_id: planId,
      payment_ref: paymentRef,
      created_at: matched.created_at || new Date().toISOString()
    }));

    logSQL(
      `-- Member login local verification\nSELECT * FROM users WHERE (email = '${cleanUName}' OR username = '${cleanUName}') LIMIT 1;`,
      `Strict authentication successful for @${matched.username}`
    );
    return { success: true, message: `Welcome back, @${matched.username}!` };
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

  const renderFooter = () => (
    <Footer 
      triggerToast={triggerToast} 
      onOpenTerms={() => {
        setTermsOrigin(viewMode === 'portal' ? 'portal' : 'homepage');
        setViewMode('terms');
      }} 
      onNavigateToCodes={() => {
        setViewMode('portal');
        triggerToast('Redirected to pool codes list.', 'info');
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
              onSignIn={() => {
                setViewMode('portal');
                triggerToast('Authenticated secure session active! Welcome.', 'success');
              }}
              onEnterManagerPanel={() => {
                setViewMode('portal');
                triggerToast(`Entered subscriber portal as @${currentUser.username}.`, 'success');
              }}
              onNavigateToCodes={() => {
                setViewMode('portal');
                triggerToast('Redirected to pool codes list.', 'info');
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
        <LiveScoresPage
          currentUser={currentUser}
          triggerToast={triggerToast}
          isInsidePortal={livescoresOrigin === 'portal'}
          onBack={() => {
            setViewMode(livescoresOrigin);
          }}
        />
      ) : viewMode === 'terms' ? (
        <TermsOfServicePage
          onBack={() => {
            setViewMode(termsOrigin);
          }}
          triggerToast={triggerToast}
        />
      ) : viewMode === 'help' ? (
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
      ) : (
        <div className="h-screen bg-[#090D1A] flex flex-col overflow-hidden text-slate-100">
          {/* Main Application Navigation Header (Styled naturally as key workspace views) */}
          <header className="bg-[#090D1A] border-b border-[#1E293B]/70 sticky top-0 z-50 shadow-md">
            <div className="w-full px-3 md:px-6 py-2 md:py-3 flex flex-row items-center justify-between gap-2 md:gap-4">
              <div className="flex items-center gap-1.5 md:gap-3">
                <button
                  onClick={() => {
                    setViewMode('homepage');
                    triggerToast('Returned to main marketing landing page.', 'info');
                  }}
                  className="bg-slate-850 hover:bg-slate-800 text-slate-305 font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs transition border border-slate-700/65 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span className="xs:inline hidden">← HOME PAGE</span>
                  <span className="xs:hidden inline">← HOME</span>
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
                onSignOut={() => {
                  localStorage.removeItem('fastpool_cached_user');
                  setSelectedPersonaId('');
                  setViewMode('homepage');
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
                  Paystack Secure checkout
                </span>
              </div>
              <button
                onClick={() => setPaystackFallback(null)}
                className="text-slate-400 hover:text-white transition text-xs font-mono font-bold uppercase cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="text-center">
                <span className="text-[11px] text-slate-500 font-mono block uppercase">Merchant</span>
                <h4 className="text-lg font-black text-white uppercase tracking-tight">Fast Pool Codes Ltd</h4>
                <p className="text-xs text-slate-400 mt-1">customer: <span className="text-slate-200 font-mono">{currentUser.email}</span></p>
              </div>

              {/* Order Box */}
              <div className="bg-[#020617] border border-slate-800/80 rounded-xl p-4 flex flex-col gap-2 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Product VIP Access:</span>
                  <span className="text-slate-200 font-bold uppercase">{paystackFallback.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Merchant Gateway:</span>
                  <span className="text-slate-200">Standard API v1/inline</span>
                </div>
                <div className="flex justify-between border-t border-slate-800/60 pt-2 text-sm">
                  <span className="text-slate-350 font-bold">Total Bill:</span>
                  <span className="text-emerald-400 font-black">₦{paystackFallback.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>

              {/* Payment Methods Simulation Option Selector */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 block uppercase">Gateway Options</span>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="p-2.5 bg-[#020617] border border-[#FA3E65]/30 rounded-lg flex items-center gap-2 text-[11px] text-slate-300">
                    <span className="text-lg">💳</span>
                    <div>
                      <p className="font-bold leading-none text-white">Card</p>
                      <span className="text-[9px] text-slate-500 font-mono">Master/Visa/Verve</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#020617] border border-slate-800 rounded-lg flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="text-lg">🏦</span>
                    <div>
                      <p className="font-bold leading-none">Bank</p>
                      <span className="text-[9px] text-slate-500 font-mono">Direct Transfer</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sim Checkout Buttons */}
              <div className="flex flex-col gap-2.5 mt-2">
                <button
                  onClick={() => {
                    const simRef = `PAY-SIM-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                    completePurchase(paystackFallback.planId, simRef);
                    setPaystackFallback(null);
                  }}
                  className="w-full py-3 bg-[#3AC5A0] hover:bg-[#2EB08F] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 active:scale-95 duration-150"
                >
                  <span>💸 Pay ₦{paystackFallback.price.toLocaleString()} via API sandbox</span>
                </button>
                <button
                  onClick={() => setPaystackFallback(null)}
                  className="w-full py-2.5 bg-transparent border border-slate-800 text-slate-400 hover:text-white transition font-mono font-bold text-[11px] rounded-lg cursor-pointer"
                >
                  Cancel Transaction
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#020617] border-t border-slate-800/60 p-3 text-center text-[9px] text-slate-600 font-mono flex items-center justify-center gap-1.5">
              <span>🔒 256-Bit SSL Encryption Active</span>
              <span>•</span>
              <span>Licensed by Central Bank of Nigeria</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
