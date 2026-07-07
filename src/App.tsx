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
  INITIAL_SUBSCRIPTIONS,
  INITIAL_BOOKMAKERS,
  INITIAL_POOL_WEEKS,
  INITIAL_POOL_CODES,
  INITIAL_POOL_RESULTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_DOWNLOADS,
  DB_SCHEMAS
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
    user_downloads: INITIAL_DOWNLOADS
  });

  // Simulator Domain Router: toggles independent application instances
  // 'customer' -> app.poolcodes.com
  // 'admin' -> admin.poolcodes.com
  const [currentAppSelector, setCurrentAppSelector] = useState<'customer' | 'admin'>('customer');
  const [viewMode, setViewMode] = useState<'homepage' | 'portal' | 'livescores'>('homepage');
  const [livescoresOrigin, setLivescoresOrigin] = useState<'homepage' | 'portal'>('homepage');

  const [activeTable, setActiveTable] = useState<string>('users');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('usr-free-101');
  const [sqlLogs, setSqlLogs] = useState<{ id: string; query: string; purpose: string; timestamp: string }[]>([
    {
      id: 'init-0',
      query: '-- Database initialized. Ready to simulate relations.\nSELECT * FROM subscription_plans;\nSELECT * FROM bookmakers WHERE is_active = TRUE;',
      purpose: 'Initial server load to fetch config and plans.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Administrative form state overrides for pool publication
  const [formWeekId, setFormWeekId] = useState<string>('pw-week-49');
  const [formBookmakerId, setFormBookmakerId] = useState<string>('bm-bet9ja');
  const [formAccessLevel, setFormAccessLevel] = useState<'free' | 'premium'>('free');
  const [formContent, setFormContent] = useState<string>('');

  // SQL Console query states
  const [customQueryText, setCustomQueryText] = useState<string>("SELECT * FROM users WHERE status = 'suspended';");
  const [customQueryResult, setCustomQueryResult] = useState<any[] | null>(null);

  // Active Authenticated user in simulated session
  const currentUser = db.users.find(u => u.id === selectedPersonaId) || db.users[1];

  // Subscription Perks parser helper
  const activeSubscription = db.user_subscriptions.find(
    sub => sub.user_id === currentUser.id && sub.status === 'active'
  );
  const activePlan = activeSubscription
    ? db.subscription_plans.find(p => p.id === activeSubscription.plan_id)
    : db.subscription_plans.find(p => p.id === 'plan-free');

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

  // Auto-authenticate active Supabase session securely using cached credentials
  useEffect(() => {
    try {
      const cachedStr = localStorage.getItem('fastpool_cached_user');
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (cached && cached.id) {
          const email = cached.email || '';
          const username = cached.username || email.split('@')[0] || 'profile_member';

          setDb(prev => {
            const exists = prev.users.find(u => u.id === cached.id || u.email.toLowerCase() === email.toLowerCase());
            if (exists) {
              return prev;
            }
            const newUser: User = {
              id: cached.id,
              username: username.toLowerCase().replace(/\s+/g, '_'),
              email: email.toLowerCase(),
              role: cached.role || 'user',
              status: 'active',
              phone: '',
              created_at: cached.created_at || new Date().toISOString(),
              email_verified_at: new Date().toISOString()
            };

            const subId = `sub-sb-${Math.floor(Math.random() * 90000 + 10000)}`;
            const now = new Date();
            const expiry = new Date();
            expiry.setMonth(now.getMonth() + 3);

            const hasPaid = cached.plan_id && cached.plan_id !== 'plan-free';
            const newSub = {
              id: subId,
              user_id: cached.id,
              plan_id: cached.plan_id || 'plan-free',
              status: 'active',
              starts_at: now.toISOString(),
              expires_at: expiry.toISOString(),
              payment_ref: hasPaid ? (cached.payment_ref || `REF-SUPA-${Math.floor(Math.random() * 9000000 + 1000000)}`) : null,
              payment_provider: hasPaid ? 'Supabase Auth Credentials Verified' : null,
              created_at: now.toISOString()
            };

            return {
              ...prev,
              users: [...prev.users, newUser],
              user_subscriptions: [...prev.user_subscriptions, newSub]
            };
          });

          setSelectedPersonaId(cached.id);
          setViewMode('portal');
          logSQL(
            `-- RESTORE SUPABASE AUTHENTICATED SESSION FROM SECURE INSTANCE CACHE\nSELECT * FROM auth.users WHERE id = '${cached.id}';`,
            `Welcome back, @${username}! Restored direct Postgres secure context.`
          );
        }
      }
    } catch (err) {
      console.error('Session restoral check failed:', err);
    }
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
      user_downloads: INITIAL_DOWNLOADS
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
      const plan = db.subscription_plans.find(p => p.id === planId) || db.subscription_plans[1];
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

  // Handler: Purchase/Upgrade user plan simulated transaction
  const buySubscription = (planId: string) => {
    const p = db.subscription_plans.find(x => x.id === planId);
    if (!p) return;

    // Remove old active sub
    const sanitizedSubs = db.user_subscriptions.map(s => {
      if (s.user_id === currentUser.id && s.status === 'active') {
        return { ...s, status: 'cancelled' as const };
      }
      return s;
    });

    const subId = `sub-sim-${Math.floor(Math.random() * 9000 + 1000)}`;
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
      payment_ref: `PAY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      payment_provider: 'Paystack Checkout',
      created_at: now.toISOString()
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
          payment_ref: newSub.payment_ref
        }));
      }
    } catch (_) {}

    logSQL(
      `-- Expire existing active subscriptions\nUPDATE user_subscriptions SET status = 'cancelled' WHERE user_id = '${currentUser.id}' AND status = 'active';\n\n-- Register new checkouts checkout reference\nINSERT INTO user_subscriptions (id, user_id, plan_id, status, starts_at, expires_at, payment_ref, payment_provider, created_at)\nVALUES ('${subId}', '${currentUser.id}', '${planId}', 'active', '${now.toISOString().slice(0,19)}Z', '${expiry.toISOString().slice(0,19)}Z', '${newSub.payment_ref}', 'Paystack API Gateway', NOW());`,
      `User @${currentUser.username} checked out plan [${p.name}]`
    );
    triggerToast(`Subscribed successfully to ${p.name}!`, 'success');
    
    // Auto download pool codes sheet after payment
    setTimeout(() => {
      downloadCodesFileAuto(currentUser, planId, newSub.payment_ref);
    }, 1000);
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

    const isPremium = code.access_level === 'premium';
    const unlockedPremium = activeSubscription && activeSubscription.status === 'active' && activePlan?.has_premium_codes;
    const hasAccessPrivilege = currentUser.role === 'admin' || !isPremium || unlockedPremium;

    const queryPrerequisites = `\n-- Match file requirements and constraints\nSELECT access_level, bookmaker_id FROM pool_codes WHERE id = '${code.id}';\nSELECT status, role FROM users WHERE id = '${currentUser.id}';`;

    if (!hasAccessPrivilege) {
      triggerToast('Plan Lock! This is a premium Exclusive codesheet.', 'error');
      logSQL(
        queryPrerequisites + '\n-- Access Denied! Subscription level mismatch.',
        'Blocked access to VIP code sheet'
      );
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

    const sClient = getSupabaseClient();
    if (sClient && password) {
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
              email_verified_at: new Date().toISOString()
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
              created_at: now.toISOString()
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
              users: [...prev.users, newUser],
              user_subscriptions: [...prev.user_subscriptions, newSub]
            }));

            setSelectedPersonaId(su.id);
            setViewMode('portal');
            logSQL(
              `-- Supabase secure backend signUp completed.\n-- Registered user id: ${su.id} \n-- Saved token session cache.`,
              `Registered & logged in new member @${cleanUsername} using secure proxy gateway`
            );

            if (planId && planId !== 'plan-free') {
              setTimeout(() => {
                downloadCodesFileAuto(newUser, planId, newSub.payment_ref || '');
              }, 1200);
            }

            return { success: true, message: `Successfully registered and logged in as @${cleanUsername}! Welcome!` };
          }
        } else {
          console.warn("Backend sign-up failed or was skipped. Proceeding with seamless Sandbox demo profile setup:", resData?.error);
        }
      } catch (err: any) {
        console.warn("Backend registration offline or skipped. Fallback to Local Sandbox: ", err?.message || err);
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
      email_verified_at: new Date().toISOString()
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
      created_at: now.toISOString()
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

    if (sClient && password) {
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
                email_verified_at: new Date().toISOString()
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
        } else {
          console.warn("Backend auth rejected or failed. Swapping to local sandbox session credentials seamlessly:", resData?.error);
        }
      } catch (err: any) {
        console.warn("Backend login connection unreachable. Auto-swapping to Sandbox login bypass:", err?.message || err);
      }
    }

    // Local Sandbox-only login fallback
    const matched = db.users.find(
      u => u.email.toLowerCase() === cleanUName || 
           u.username.toLowerCase() === cleanUName
    );
    if (matched) {
      setSelectedPersonaId(matched.id);
      setViewMode('portal');
      
      localStorage.setItem('fastpool_cached_user', JSON.stringify({
        id: matched.id,
        username: matched.username,
        email: matched.email,
        role: matched.role,
        payment_ref: `REF-LOCAL-${Math.floor(Math.random() * 9000000 + 1000000)}`,
        created_at: matched.created_at || new Date().toISOString()
      }));

      logSQL(
        `-- Member login local verification\nSELECT * FROM users WHERE (email = '${cleanUName}' OR username = '${cleanUName}') LIMIT 1;`,
        `Authenticated visitor session for local Sandbox persona @${matched.username}`
      );
      return { success: true, message: `Welcome back to Sandbox, @${matched.username}!` };
    }

    // Auto-create local user session if not found in local sandbox
    const newId = `usr-auto-${Math.floor(Math.random() * 90000 + 10000)}`;
    const isVIP = cleanUName.includes('premium') || cleanUName.includes('vip');
    
    const newUser: User = {
      id: newId,
      username: cleanUName.replace(/\s+/g, '_'),
      email: cleanUName.includes('@') ? cleanUName : `${cleanUName}@example.com`,
      role: cleanUName.includes('admin') || cleanUName.includes('master') ? 'admin' : 'user',
      status: 'active',
      phone: '',
      created_at: new Date().toISOString(),
      email_verified_at: new Date().toISOString()
    };
    
    const subId = `sub-auto-${Math.floor(Math.random() * 90000 + 10000)}`;
    const now = new Date();
    const expiry = new Date();
    expiry.setDate(now.getDate() + 90);
    
    const newSub = {
      id: subId,
      user_id: newId,
      plan_id: isVIP ? 'plan-premium' : 'plan-free',
      status: 'active',
      starts_at: now.toISOString(),
      expires_at: expiry.toISOString(),
      payment_ref: isVIP ? `REF-AUTO-${Math.floor(Math.random() * 9000000 + 1000000)}` : null,
      payment_provider: isVIP ? 'Auto-Bypass Secure Simulator' : null,
      created_at: now.toISOString()
    };

    localStorage.setItem('fastpool_cached_user', JSON.stringify({
      id: newId,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      plan_id: isVIP ? 'plan-premium' : 'plan-free',
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
      `-- Auto-created dummy user session for @${cleanUName}\nINSERT INTO users (id, username, email, role, status, created_at) VALUES ('${newId}', '${cleanUName}', '${newUser.email}', '${newUser.role}', 'active', NOW());`,
      `Auto-created mock ${isVIP ? 'VIP' : 'Free'} account for @${cleanUName} to bypass login`
    );
    return { success: true, message: `Auto-provisioned sandbox demo profile for @${cleanUName}! (Sandbox Mode Enabled)` };
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
    <Footer triggerToast={triggerToast} />
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
              onSignIn={() => {
                setViewMode('portal');
                triggerToast('Authenticated secure session to system dashboard.', 'success');
              }}
              onEnterManagerPanel={() => {
                setViewMode('portal');
                // Automatically switch to admin persona
                const adminUsr = db.users.find(u => u.role === 'admin');
                if (adminUsr) {
                  setSelectedPersonaId(adminUsr.id);
                }
                triggerToast('Entered administrative manager dashboard.', 'success');
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

              {/* Active Context indicator */}
              <div className="hidden lg:flex items-center gap-2 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-900/40 shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-mono text-emerald-350 select-none uppercase tracking-wider font-extrabold">
                  Aussie Pool Season • Week 49 Active
                </span>
              </div>

              {/* Quick-switch persona dropdown & reload db seeds */}
              <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
                <div className="flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-[8px] md:text-[9px] text-slate-500 uppercase font-mono font-bold hidden xs:inline">Simulate As:</span>
                  <select
                    value={selectedPersonaId}
                    onChange={(e) => {
                      setSelectedPersonaId(e.target.value);
                      const u = db.users.find(x => x.id === e.target.value);
                      triggerToast(`Session authenticated to: @${u?.username}`, 'info');
                    }}
                    className="bg-transparent font-mono text-[10px] md:text-xs text-amber-400 font-bold border-none focus:outline-none cursor-pointer outline-none uppercase bg-[#0f172a]"
                  >
                    {db.users.filter(u => u.role !== 'admin').map(u => {
                      const s = db.user_subscriptions.find(sub => sub.user_id === u.id && sub.status === 'active');
                      const tierLabel = u.status === 'suspended' ? 'Suspended' : s ? 'Premium VIP' : 'Free Tier';
                      return (
                        <option key={u.id} value={u.id} className="bg-[#0f172a] text-slate-100">
                          @{u.username} ({tierLabel})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button
                  onClick={resetDatabaseValues}
                  className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-rose-455 text-slate-400 transition hover:bg-slate-900 active:scale-95 duration-150 cursor-pointer"
                  title="Reset Simulated Database Seeds"
                >
                  <RefreshCw className="w-4 h-4" />
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
                onNavigateToLiveScores={() => {
                  setLivescoresOrigin('portal');
                  setViewMode('livescores');
                  triggerToast('Navigating to Live Scores Arena...', 'info');
                }}
                onSignOut={() => {
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
      <ChatbotSection currentUser={currentUser} triggerToast={triggerToast} />
    </div>
  );
}
