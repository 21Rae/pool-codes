import React, { useState, useEffect, useRef } from 'react';
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
  Globe,
  ChevronDown,
  ChevronUp,
  Star,
  X,
  Info,
  Play,
  Menu,
  Tv,
  LogOut,
  Printer,
  Mail,
  FileText,
  CheckCircle,
  RefreshCw,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseState, User, SubscriptionPlan, UserSubscription, PoolCode } from '../types';
import { getSupabaseClient } from '../lib/supabase';

interface CustomerPortalProps {
  db: DatabaseState;
  currentUser: User;
  activePlan: SubscriptionPlan | undefined;
  activeSubscription: UserSubscription | undefined;
  buySubscription: (planId: string, selectedComponents?: string[]) => void;
  handleDownloadCode: (code: PoolCode) => void;
  triggerToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  markAllNotificationsRead: () => void;
  onSignOut?: () => void;
  onUpdateProfile?: (updated: { username: string; email: string; phone?: string; password?: string }) => void;
  renderFooter?: () => React.ReactNode;
  onNavigateToLiveScores?: () => void;
  confirmedPaymentMail?: { subject: string; body: string; pdfUrl: string; pdfName: string; fetchedFromSupabase: boolean; queryDetails: string } | null;
  setConfirmedPaymentMail?: (val: any) => void;
  showSimulatedEmailModal?: boolean;
  setShowSimulatedEmailModal?: (val: boolean) => void;
  isSyncingSupabase?: boolean;
  fetchRealSupabaseData?: (silent: boolean) => Promise<void>;
  discoveredDbTables?: any[];
  bypassPremium?: boolean;
  onToggleBypassPremium?: () => void;
}

export default function CustomerPortal({
  db,
  currentUser,
  activePlan,
  activeSubscription,
  buySubscription,
  handleDownloadCode,
  triggerToast,
  markAllNotificationsRead,
  onSignOut,
  onUpdateProfile,
  renderFooter,
  onNavigateToLiveScores,
  confirmedPaymentMail,
  setConfirmedPaymentMail,
  showSimulatedEmailModal: showSimulatedEmailModalProp,
  setShowSimulatedEmailModal: setShowSimulatedEmailModalProp,
  isSyncingSupabase = false,
  fetchRealSupabaseData,
  discoveredDbTables = [],
  bypassPremium = false,
  onToggleBypassPremium
}: CustomerPortalProps) {
  const userSubs = db.user_subscriptions.filter(s => s.user_id === currentUser.id);
  const latestSub = userSubs.length > 0 
    ? [...userSubs].sort((a, b) => new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime())[0]
    : undefined;

  const isLoggedIn = currentUser && currentUser.id !== 'guest';
  const isVerified = currentUser && !!currentUser.email_verified_at && currentUser.status === 'active';
  const isPaidUser = currentUser.role === 'admin' || (
    activeSubscription && 
    activeSubscription.status === 'active' && 
    activePlan?.id !== 'plan-free'
  );

  const isSubscriptionExpired = latestSub && (
    latestSub.status === 'expired' || 
    new Date(latestSub.expires_at) < new Date()
  );

  const isFreeTier = bypassPremium ? false : (!isPaidUser);
  const isLockedOut = bypassPremium ? false : (!isLoggedIn || !isVerified || !isPaidUser || !!isSubscriptionExpired);

  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'streaming' | 'results' | 'subscription' | 'profile'>('dashboard');

  // Component customization states for plans
  const [selectedComponents, setSelectedComponents] = useState<Record<string, string[]>>({
    'plan-weekly': ['bet9ja', 'sportybet', 'betking'],
    'plan-monthly': ['bet9ja', 'sportybet', 'betking'],
    'plan-quarterly': ['bet9ja', 'sportybet', 'betking'],
    'plan-biannual': ['bet9ja', 'sportybet', 'betking'],
    'plan-yearly': ['bet9ja', 'sportybet', 'betking'],
    'plan-ghana-weekly': ['premierbet', 'betway', 'soccabet', 'sportybet'],
    'plan-ghana': ['premierbet', 'betway', 'soccabet', 'sportybet'],
    'plan-ghana-quarterly': ['premierbet', 'betway', 'soccabet', 'sportybet'],
    'plan-ghana-biannual': ['premierbet', 'betway', 'soccabet', 'sportybet'],
    'plan-ghana-yearly': ['premierbet', 'betway', 'soccabet', 'sportybet'],
  });

  const toggleComponentSelection = (planId: string, component: string) => {
    setSelectedComponents(prev => {
      const current = prev[planId] || (planId.includes('ghana') ? ['premierbet', 'betway', 'soccabet', 'sportybet'] : ['bet9ja', 'sportybet', 'betking']);
      const updated = current.includes(component)
        ? current.filter(c => c !== component)
        : [...current, component];
      return { ...prev, [planId]: updated };
    });
  };

  const [codeTypeFilter, setCodeTypeFilter] = useState<'all' | 'uk' | 'aussie' | 'international'>('all');
  const [bookmakerFilter, setBookmakerFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'portal' | 'decryptor'>('portal');
  const [selectedResultId, setSelectedResultId] = useState<string>('pr-w43');
  const [filterSeason, setFilterSeason] = useState<string>('all');
  const [filterWeek, setFilterWeek] = useState<string>('all');
  const [filterFixtureDate, setFilterFixtureDate] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [streamAlertEmail, setStreamAlertEmail] = useState(currentUser?.email || '');
  const [streamSubscribed, setStreamSubscribed] = useState(false);
  const [streamReminders, setStreamReminders] = useState<Record<string, boolean>>({});

  // PDF Customization & Printing states
  const [showPdfPrintModal, setShowPdfPrintModal] = useState(false);
  const [localShowSimulatedEmailModal, setLocalShowSimulatedEmailModal] = useState(false);
  const showSimulatedEmailModal = showSimulatedEmailModalProp !== undefined ? showSimulatedEmailModalProp : localShowSimulatedEmailModal;
  const setShowSimulatedEmailModal = setShowSimulatedEmailModalProp !== undefined ? setShowSimulatedEmailModalProp : setLocalShowSimulatedEmailModal;
  const [pdfConfig, setPdfConfig] = useState({
    title: 'FASTPOOLCODES PREMIUM EXCLUSIVE COUPON',
    subtitle: 'Official Decrypted Classified Fixtures & Key Codes',
    showBookmaker: true,
    showTips: true,
    showOdds: true,
    showVerificationStamp: true,
    theme: 'classic', // 'classic' | 'emerald' | 'compact'
    customNote: 'Decrypted with Premium VIP Authorization. FastPoolCodes All rights reserved.'
  });
  const activeWeekNumber = 43;

  // Personal Info & Password edit states
  const [profileUsername, setProfileUsername] = useState(currentUser.username);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');

  // Table specific search filters
  const [standingsSearchQuery, setStandingsSearchQuery] = useState('');
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');
  const [trackedMatchesSearch, setTrackedMatchesSearch] = useState('');
  const [championshipSearchQuery, setChampionshipSearchQuery] = useState('');

  // Database Schema & Table Explorer state
  const [dbExplorerTables, setDbExplorerTables] = useState<any[]>(discoveredDbTables || []);
  const [dbExplorerSelectedTable, setDbExplorerSelectedTable] = useState<string>('blogs');
  const [dbExplorerRows, setDbExplorerRows] = useState<any[]>([]);
  const [dbExplorerLoading, setDbExplorerLoading] = useState<boolean>(false);
  const [dbExplorerNewRowJson, setDbExplorerNewRowJson] = useState<string>('{\n  "title": "New Post",\n  "content": "Database entry sample"\n}');
  const [dbExplorerError, setDbExplorerError] = useState<string | null>(null);

  const refreshDbExplorer = async (selectedTable?: string) => {
    setDbExplorerLoading(true);
    setDbExplorerError(null);
    try {
      const res = await fetch('/api/database/tables');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.activeTables)) {
          setDbExplorerTables(json.activeTables);
          const targetTable = selectedTable || dbExplorerSelectedTable || (json.activeTables[0]?.name || 'blogs');
          setDbExplorerSelectedTable(targetTable);
          
          const rowsRes = await fetch(`/api/tables/${targetTable}`);
          if (rowsRes.ok) {
            const rowsJson = await rowsRes.json();
            setDbExplorerRows(rowsJson.data || []);
          } else {
            setDbExplorerError(`Failed to fetch rows for table '${targetTable}'.`);
          }
        }
      }
    } catch (err: any) {
      setDbExplorerError(err?.message || String(err));
    } finally {
      setDbExplorerLoading(false);
    }
  };

  useEffect(() => {
    if (discoveredDbTables && discoveredDbTables.length > 0) {
      setDbExplorerTables(discoveredDbTables);
    }
  }, [discoveredDbTables]);

  // Real-time listener and background poll for Database Explorer view
  useEffect(() => {
    if ((activeSubTab as string) !== 'db_explorer') return;

    // Refresh initially when tab opens or table changes
    refreshDbExplorer(dbExplorerSelectedTable);

    // Auto-poll every 5 seconds for real-time changes
    const interval = setInterval(() => {
      refreshDbExplorer(dbExplorerSelectedTable);
    }, 5000);

    const supabase = getSupabaseClient();
    let channel: any = null;
    if (supabase) {
      try {
        channel = supabase
          .channel(`db-explorer-${dbExplorerSelectedTable}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public' },
            () => {
              refreshDbExplorer(dbExplorerSelectedTable);
            }
          )
          .subscribe();
      } catch (_) {}
    }

    return () => {
      clearInterval(interval);
      if (supabase && channel) {
        try { supabase.removeChannel(channel); } catch (_) {}
      }
    };
  }, [activeSubTab, dbExplorerSelectedTable]);

  useEffect(() => {
    setProfileUsername(currentUser.username);
    setProfileEmail(currentUser.email);
    setProfilePhone(currentUser.phone || '');
    setProfilePassword('');
    setProfileConfirmPassword('');
  }, [currentUser]);

  const handleSavePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUsername.trim()) {
      triggerToast('Username cannot be empty!', 'error');
      return;
    }
    if (!profileEmail.trim() || !profileEmail.includes('@')) {
      triggerToast('Please specify a valid email address!', 'error');
      return;
    }
    if (onUpdateProfile) {
      onUpdateProfile({
        username: profileUsername.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim()
      });
    } else {
      triggerToast('Simulated profile database update successful!', 'success');
    }
  };

  // Reusable lightweight PDF/Print generation engine for data tables
  const printTable = (title: string, headers: string[], rows: any[][]) => {
    const printDiv = document.createElement('div');
    printDiv.id = 'printable-coupon-pdf';
    printDiv.style.position = 'fixed';
    printDiv.style.left = '0';
    printDiv.style.top = '0';
    printDiv.style.width = '100%';
    printDiv.style.backgroundColor = 'white';
    printDiv.style.color = 'black';
    printDiv.style.zIndex = '9999999';
    printDiv.style.padding = '30px';
    printDiv.style.fontFamily = 'monospace';

    printDiv.innerHTML = `
      <div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.18; display: flex; flex-wrap: wrap; justify-content: space-around; align-content: space-around; z-index: 0; pointer-events: none; user-select: none;">
        ${Array.from({ length: 40 }).map(() => `
          <div style="font-family: monospace; font-weight: 950; font-size: 13px; text-transform: uppercase; color: #0f172a; white-space: nowrap; margin: 25px; transform: rotate(-30deg); transform-origin: center;">
            fastpoolcodes ${currentUser.email}
          </div>
        `).join('')}
      </div>
      <div style="position: relative; z-index: 10;">
        <div style="border-bottom: 2px solid black; padding-bottom: 15px; margin-bottom: 20px; font-family: sans-serif; text-align: left;">
          <h2 style="margin: 0; text-transform: uppercase; font-size: 16px; letter-spacing: -0.5px;">⚽ FASTPOOLCODES // PRINT SERVICE</h2>
          <h3 style="margin: 5px 0 0 0; text-transform: uppercase; font-size: 12px; color: #10b981;">${title}</h3>
          <p style="margin: 5px 0 0 0; font-size: 10px; color: #555;">Generated for: @${currentUser.username} (${currentUser.email}) on ${new Date().toLocaleDateString()}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: left; font-family: monospace;">
          <thead>
            <tr style="background-color: #0f172a; color: white;">
              ${headers.map(h => `<th style="border: 1px solid #cbd5e1; padding: 6px; text-transform: uppercase;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, rIdx) => `
              <tr style="background-color: ${rIdx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
                ${row.map(cell => `<td style="border: 1px solid #cbd5e1; padding: 6px; color: #0f172a;">${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 8px; color: #64748b; text-align: center; font-family: sans-serif;">
          © 2026 FastPoolCodes. Secure printable document license for @${currentUser.username}.
        </div>
      </div>
    `;

    document.body.appendChild(printDiv);

    const printStyle = document.createElement('style');
    printStyle.id = 'print-coupon-override';
    printStyle.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        #printable-coupon-pdf, #printable-coupon-pdf * {
          visibility: visible !important;
        }
      }
    `;
    document.head.appendChild(printStyle);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        printDiv.remove();
        printStyle.remove();
      }, 500);
    }, 100);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilePassword) {
      triggerToast('Please enter your new security password.', 'error');
      return;
    }
    if (profilePassword.length < 5) {
      triggerToast('Security requirements fail: Password must be at least 5 characters long.', 'error');
      return;
    }
    if (profilePassword !== profileConfirmPassword) {
      triggerToast('Validation discrepancy: Input password confirmation does not match.', 'error');
      return;
    }
    if (onUpdateProfile) {
      onUpdateProfile({
        username: profileUsername.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim(),
        password: profilePassword
      });
      setProfilePassword('');
      setProfileConfirmPassword('');
    } else {
      triggerToast('Simulated password key synchronized successfully!', 'success');
      setProfilePassword('');
      setProfileConfirmPassword('');
    }
  };

  const exportResultToCSV = (result: typeof db.pool_results[0]) => {
    try {
      const headers = ['Season', 'Active Week', 'Fixture Date', 'Match No', 'Home Team Selection', 'Away Team Companion', 'Score FT', 'POOL Outcome', 'PAY Status'];
      const rows = (result.results_table || []).map(row => [
        `"${result.season_year || 2026}"`,
        `"WEEK #${result.week_number || 43}"`,
        `"${result.fixture_date || '2026-04-25'}"`,
        row.matchNo,
        `"${row.homeTeam}"`,
        `"${row.awayTeam}"`,
        `"${row.fullTimeScore}"`,
        `"${row.outcome}"`,
        `"${row.payoutStatus}"`
      ]);
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Pool_Results_Week_${result.week_number || 43}_${(result.pool_type || 'UK').toUpperCase()}_Pool.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast('Spreadsheet exported successfully as CSV!', 'success');
    } catch (error) {
      triggerToast('Could not export spreadsheet.', 'error');
    }
  };

  const downloadTableAsExcel = (filename: string, headers: string[], rows: any[][]) => {
    try {
      const escapeCSVCell = (val: any) => {
        if (val === null || val === undefined) return '';
        let str = String(val);
        // Replace inner quotes with double quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const csvContent = [
        headers.map(escapeCSVCell).join(','),
        ...rows.map(row => row.map(escapeCSVCell).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast(`${filename} exported to Excel spreadsheet successfully!`, 'success');
    } catch (error) {
      triggerToast('Could not export spreadsheet.', 'error');
    }
  };

  // Dynamic sports score auto-scroll ticker control
  const arenaScoreboardRef = useRef<HTMLDivElement>(null);
  const [isArenaScoreboardHovered, setIsArenaScoreboardHovered] = useState(false);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    setIsArenaScoreboardHovered(true);
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
  };

  const handleTouchEnd = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
    touchTimeoutRef.current = setTimeout(() => {
      setIsArenaScoreboardHovered(false);
    }, 800);
  };

  useEffect(() => {
    const container = arenaScoreboardRef.current;
    if (!container) return;

    let animationFrameId: number;
    let scrollPos = container.scrollLeft;
    const speed = 0.65; 

    const scroll = () => {
      if (!isArenaScoreboardHovered && container.scrollWidth > container.clientWidth) {
        scrollPos += speed;
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (scrollPos >= container.scrollWidth / 2 || (maxScroll > 0 && scrollPos >= maxScroll - 2)) {
          scrollPos = 0;
        }
        container.scrollLeft = scrollPos;
      } else {
        scrollPos = container.scrollLeft;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    const handleScroll = () => {
      if (isArenaScoreboardHovered) {
        scrollPos = container.scrollLeft;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('scroll', handleScroll);
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, [isArenaScoreboardHovered]);

  // Dynamic posted games coupon states
  const [postedGames, setPostedGames] = useState(() => {
    try {
      const stored = localStorage.getItem('fastpool_posted_games_list');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('LocalStorage read omitted in this frame context:', e);
    }
    const mapBookieRows = (rows: any[] | undefined, prefix: string, name: string) => {
      return (rows || []).map(r => ({
        id: `${prefix}_${r.id}`,
        poolNo: r.pool !== undefined ? r.pool : (r['pool '] !== undefined ? r['pool '] : undefined),
        betCode: r.betcode !== undefined ? r.betcode : (r['betcode '] !== undefined ? r['betcode '] : undefined),
        home: r.home,
        away: r.away,
        homeWin: String(r.homewin !== undefined ? r.homewin : ''),
        draw: String(r.draw !== undefined ? r.draw : ''),
        awayWin: String(r.awaywin !== undefined ? r.awaywin : ''),
        betTips: r.bet,
        status: r.status,
        kickOff: r.kickoff,
        bookmaker: name,
        week: 'Week 49 Aussie'
      }));
    };

    const b9 = mapBookieRows(db.bet9ja, 'bet9ja', 'Bet9ja');
    const bk = mapBookieRows(db.betking, 'betking', 'BetKing');
    const sb = mapBookieRows(db.sportybet, 'sportybet', 'SportyBet');
    const pb = mapBookieRows(db.premierbet, 'premierbet', 'PremierBet');
    const bw = mapBookieRows(db.betway, 'betway', 'Betway');
    const sc = mapBookieRows(db.soccabet, 'soccabet', 'Soccabet');
    return [...b9, ...bk, ...sb, ...pb, ...bw, ...sc];
  });
  
  // Synchronize postedGames when database state updates from Supabase (fetching real tables)
  useEffect(() => {
    const mapBookieRows = (rows: any[] | undefined, prefix: string, name: string) => {
      return (rows || []).map(r => ({
        id: `${prefix}_${r.id}`,
        poolNo: r.pool !== undefined ? r.pool : (r['pool '] !== undefined ? r['pool '] : undefined),
        betCode: r.betcode !== undefined ? r.betcode : (r['betcode '] !== undefined ? r['betcode '] : undefined),
        home: r.home,
        away: r.away,
        homeWin: String(r.homewin !== undefined ? r.homewin : ''),
        draw: String(r.draw !== undefined ? r.draw : ''),
        awayWin: String(r.awaywin !== undefined ? r.awaywin : ''),
        betTips: r.bet,
        status: r.status,
        kickOff: r.kickoff,
        bookmaker: name,
        week: 'Week 49 Aussie'
      }));
    };

    const b9 = mapBookieRows(db.bet9ja, 'bet9ja', 'Bet9ja');
    const bk = mapBookieRows(db.betking, 'betking', 'BetKing');
    const sb = mapBookieRows(db.sportybet, 'sportybet', 'SportyBet');
    const pb = mapBookieRows(db.premierbet, 'premierbet', 'PremierBet');
    const bw = mapBookieRows(db.betway, 'betway', 'Betway');
    const sc = mapBookieRows(db.soccabet, 'soccabet', 'Soccabet');

    const allGames = [...b9, ...bk, ...sb, ...pb, ...bw, ...sc];
    setPostedGames(allGames);
  }, [db.bet9ja, db.betking, db.sportybet, db.premierbet, db.betway, db.soccabet]);

  // Persist modifications immediately and dispatch reactive real-time custom notification events
  useEffect(() => {
    try {
      localStorage.setItem('fastpool_posted_games_list', JSON.stringify(postedGames));
      // Dispatch a client-wide update event for internal component routing
      window.dispatchEvent(new CustomEvent('fastpool_arena_games_synced', { detail: postedGames }));
    } catch (err) {
      console.warn('LocalStorage persistence error on active sandbox state:', err);
    }
  }, [postedGames]);

  // Listen to storage synchronization triggers and custom broadcast events for zero-delay cross-context reactivity
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'fastpool_posted_games_list' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setPostedGames(parsed);
        } catch (err) {
          console.error('Real-time sync parsed conversion exception:', err);
        }
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setPostedGames(customEvt.detail);
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('fastpool_arena_games_synced', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('fastpool_arena_games_synced', handleCustomEvent);
    };
  }, []);

  // Dynamic pool results championship sheets states
  const [poolResults, setPoolResults] = useState(() => {
    try {
      const stored = localStorage.getItem('fastpool_pool_results_list');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('LocalStorage read omitted for pool results:', e);
    }
    return db.pool_results;
  });

  // Persist results immediately and dispatch reactive real-time custom notification events
  useEffect(() => {
    try {
      localStorage.setItem('fastpool_pool_results_list', JSON.stringify(poolResults));
      // Dispatch a client-wide update event for zero-delay cross-tab rendering
      window.dispatchEvent(new CustomEvent('fastpool_results_synced', { detail: poolResults }));
    } catch (err) {
      console.warn('LocalStorage write error for pool results:', err);
    }
  }, [poolResults]);

  // Listen to storage synchronization triggers and custom broadcast events for results sheets
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'fastpool_pool_results_list' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setPoolResults(parsed);
        } catch (err) {
          console.error('Real-time sync parsed conversion exception for results:', err);
        }
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setPoolResults(customEvt.detail);
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('fastpool_results_synced', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('fastpool_results_synced', handleCustomEvent);
    };
  }, []);

  // Admin result row inputs state
  const [adminResMatchNo, setAdminResMatchNo] = useState('');
  const [adminResHome, setAdminResHome] = useState('');
  const [adminResAway, setAdminResAway] = useState('');
  const [adminResScore, setAdminResScore] = useState('');
  const [adminResOutcome, setAdminResOutcome] = useState('DRAW');
  const [adminResPayStatus, setAdminResPayStatus] = useState('CLEARED');

  // Admin custom sheet attributes
  const [adminSheetWeek, setAdminSheetWeek] = useState('44');
  const [adminSheetYear, setAdminSheetYear] = useState('2026');
  const [adminSheetType, setAdminSheetType] = useState('uk');
  const [adminSheetDate, setAdminSheetDate] = useState('2026-05-02');
  const [adminSheetTitle, setAdminSheetTitle] = useState('');

  const [dashboardGameSearch, setDashboardGameSearch] = useState('');
  const [dashboardBookmakerFilter, setDashboardBookmakerFilter] = useState('Bet9ja');
  const [dashboardTheme, setDashboardTheme] = useState<'paper' | 'dark'>('dark');
  const [pricingRegionFilter, setPricingRegionFilter] = useState<'nigeria' | 'ghana'>('nigeria');

  // Admin form state for posting games
  const [adminPoolNo, setAdminPoolNo] = useState<string>('9');
  const [adminBetCode, setAdminBetCode] = useState('');
  const [adminHome, setAdminHome] = useState('');
  const [adminAway, setAdminAway] = useState('');
  const [adminHomeWin, setAdminHomeWin] = useState('1.50');
  const [adminDraw, setAdminDraw] = useState('4.00');
  const [adminAwayWin, setAdminAwayWin] = useState('5.50');
  const [adminBetTips, setAdminBetTips] = useState('Ov 2.5');
  const [adminStatus, setAdminStatus] = useState('Friday');
  const [adminKickOff, setAdminKickOff] = useState('04:00 PM');
  const [adminBookmakerCode, setAdminBookmakerCode] = useState('Bet9ja');
  const [showAdminForm, setShowAdminForm] = useState(false);

  // Event handlers for dashboard posted games board
  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminBetCode || !adminHome || !adminAway) {
      triggerToast('Please fill in Bet Code, Home, and Away team fields.', 'error');
      return;
    }
    const newGame = {
      id: `g-${Date.now()}`,
      poolNo: Number(adminPoolNo) || (postedGames.length + 1),
      betCode: adminBetCode,
      home: adminHome,
      away: adminAway,
      homeWin: adminHomeWin || '1.00',
      draw: adminDraw || '1.00',
      awayWin: adminAwayWin || '1.05',
      betTips: adminBetTips || 'X',
      status: adminStatus,
      kickOff: adminKickOff,
      bookmaker: adminBookmakerCode,
      week: 'Week 49 Aussie'
    };
    setPostedGames(prev => [...prev, newGame]);
    triggerToast(`Game #${newGame.poolNo} [${newGame.home} vs ${newGame.away}] posted live!`, 'success');
    
    // Auto increment default pool No for ease-of-use
    setAdminPoolNo(String(newGame.poolNo + 1));
    setAdminBetCode('');
    setAdminHome('');
    setAdminAway('');
  };

  const handleDeleteGame = (id: string, matchName: string) => {
    setPostedGames(prev => prev.filter(g => g.id !== id));
    triggerToast(`Removed game: ${matchName}`, 'info');
  };

  const handleResetGames = () => {
    const mapBookieRows = (rows: any[] | undefined, prefix: string, name: string) => {
      return (rows || []).map(r => ({
        id: `${prefix}_${r.id}`,
        poolNo: r.pool !== undefined ? r.pool : (r['pool '] !== undefined ? r['pool '] : undefined),
        betCode: r.betcode !== undefined ? r.betcode : (r['betcode '] !== undefined ? r['betcode '] : undefined),
        home: r.home,
        away: r.away,
        homeWin: String(r.homewin !== undefined ? r.homewin : ''),
        draw: String(r.draw !== undefined ? r.draw : ''),
        awayWin: String(r.awaywin !== undefined ? r.awaywin : ''),
        betTips: r.bet,
        status: r.status,
        kickOff: r.kickoff,
        bookmaker: name,
        week: 'Week 49 Aussie'
      }));
    };

    const b9 = mapBookieRows(db.bet9ja, 'bet9ja', 'Bet9ja');
    const bk = mapBookieRows(db.betking, 'betking', 'BetKing');
    const sb = mapBookieRows(db.sportybet, 'sportybet', 'SportyBet');
    const pb = mapBookieRows(db.premierbet, 'premierbet', 'PremierBet');
    const bw = mapBookieRows(db.betway, 'betway', 'Betway');
    const sc = mapBookieRows(db.soccabet, 'soccabet', 'Soccabet');

    setPostedGames([...b9, ...bk, ...sb, ...pb, ...bw, ...sc]);
    setAdminPoolNo('9');
    triggerToast('Games list reset to database default tables!', 'info');
  };

  // Interactive Live Scoreboard States
  const [selectedSport, setSelectedSport] = useState<string>('Football');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [selectedCompFilter, setSelectedCompFilter] = useState<string>('all');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('all');
  const [selectedMatchFixtureId, setSelectedMatchFixtureId] = useState<string>('f-1');
  const [matchActiveTab, setMatchActiveTab] = useState<'info' | 'lineups' | 'table' | 'h2h'>('info');
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);
  const [favoritesList, setFavoritesList] = useState<string[]>(['f-1']);

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

  // --- LIVESCORES DASHBOARD ENGINE STATES & ACTIONS ---
  const [liveScoresData, setLiveScoresData] = useState<any[]>([]);
  const [liveLogData, setLiveLogData] = useState<string[]>([]);
  const [isCheckingLive, setIsCheckingLive] = useState(false);
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [newMatchStatus, setNewMatchStatus] = useState("not_started");
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);
  const [isRefreshingLiveScores, setIsRefreshingLiveScores] = useState(false);

  useEffect(() => {
    if (activeSubTab !== 'streaming' && activeSubTab !== 'dashboard') return;

    const fetchLiveScores = async () => {
      try {
        const response = await fetch("/api/livescores");
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        if (json.success) {
          const rawMatches = json.matches || [];
          const seen = new Set();
          const uniqueMatches = rawMatches.filter((m: any) => {
            const key = m.id || m.fixture;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setLiveScoresData(uniqueMatches);
          setLiveLogData(json.logs || []);
          setIsCheckingLive(json.isChecking || false);
        }
      } catch (err) {
        console.warn("Graceful notice: Live scores loading bypassed (polling behavior).");
      }
    };

    fetchLiveScores();
    const interval = setInterval(fetchLiveScores, 10000); // UI poll fast every 10 seconds
    return () => clearInterval(interval);
  }, [activeSubTab]);

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeam.trim() || !awayTeam.trim()) {
      triggerToast("Please enter both Home Team and Away Team names.", "error");
      return;
    }
    setIsSubmittingMatch(true);
    try {
      const response = await fetch("/api/livescores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          home_team: homeTeam.trim(), 
          away_team: awayTeam.trim(), 
          home_score: Number(homeScore) || 0,
          away_score: Number(awayScore) || 0,
          status: newMatchStatus 
        })
      });
      const data = await response.json();
      if (data.success) {
        triggerToast(`Added "${homeTeam} vs ${awayTeam}" to live score tracking board!`, "success");
        setHomeTeam("");
        setAwayTeam("");
        setHomeScore(0);
        setAwayScore(0);
        setNewMatchStatus("not_started");
        // Reload immediately
        const scoreRes = await fetch("/api/livescores");
        const scoreJson = await scoreRes.json();
        if (scoreJson.success) {
          setLiveScoresData(scoreJson.matches || []);
          setLiveLogData(scoreJson.logs || []);
        }
      } else {
        triggerToast(data.error || "Failed to add match.", "error");
      }
    } catch (err: any) {
      triggerToast(err?.message || "Failed to add match.", "error");
    } finally {
      setIsSubmittingMatch(false);
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this match from the tracker?")) return;
    try {
      const response = await fetch("/api/livescores/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (data.success) {
        triggerToast("Match deleted successfully from database list.", "success");
        // Reload immediately
        const scoreRes = await fetch("/api/livescores");
        const scoreJson = await scoreRes.json();
        if (scoreJson.success) {
          setLiveScoresData(scoreJson.matches || []);
          setLiveLogData(scoreJson.logs || []);
        }
      } else {
        triggerToast(data.error || "Failed to delete match.", "error");
      }
    } catch (err: any) {
      triggerToast(err?.message || "Error deleting match.", "error");
    }
  };

  const handleUpdateMatchStatus = async (id: string, status: string, score?: string) => {
    try {
      const response = await fetch("/api/livescores/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, score })
      });
      const data = await response.json();
      if (data.success) {
        triggerToast(`Match status updated successfully to ${status.toUpperCase()}!`, "success");
        // Reload immediately
        const scoreRes = await fetch("/api/livescores");
        const scoreJson = await scoreRes.json();
        if (scoreJson.success) {
          setLiveScoresData(scoreJson.matches || []);
          setLiveLogData(scoreJson.logs || []);
        }
      } else {
        triggerToast(data.error || "Failed to update match.", "error");
      }
    } catch (err: any) {
      triggerToast(err?.message || "Error updating match status.", "error");
    }
  };

  const handleForceUpdateScores = async () => {
    setIsRefreshingLiveScores(true);
    // Trigger toast
    triggerToast("Initiating real-time AI web search check for all matches...", "info");
    try {
      const response = await fetch("/api/livescores/trigger-update", {
        method: "POST"
      });
      const data = await response.json();
      if (data.success) {
        setLiveScoresData(data.matches || []);
        setLiveLogData(data.logs || []);
        triggerToast("Live scores verified & synced with web channels!", "success");
      } else {
        triggerToast(data.error || "Failed to run current matches check.", "error");
      }
    } catch (err: any) {
      triggerToast(err?.message || "Error during match updates check.", "error");
    } finally {
      setIsRefreshingLiveScores(false);
    }
  };

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
    
    // Strict component-level subscription access filtering
    if (!bypassPremium && code.access_level === 'premium' && currentUser.role !== 'admin') {
      if (!activeSubscription || activeSubscription.status !== 'active') return false;
      if (activeSubscription.components) {
        const compSlug = code.bookmaker_id.replace('bm-', '').toLowerCase();
        if (!activeSubscription.components.includes(compSlug)) return false;
      }
    }

    // Search Term match
    if (searchTerm) {
      const matchLabel = `${bookmaker.name} ${week.week_number} ${week.pool_type}`.toLowerCase();
      if (!matchLabel.includes(searchTerm.toLowerCase())) return false;
    }

    return true;
  });

  return (
    <div id="customer-portal-app" className="flex-1 flex flex-col md:flex-row bg-[#0A0F1D] text-slate-100 font-sans min-h-0 h-full">

      {/* Mobile Sticky Navigation header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0F172A] border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div>
            <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 uppercase tracking-wider block">
              {activeSubTab === 'dashboard' ? 'Arena Dashboard' : activeSubTab === 'results' ? 'Pool Results' : activeSubTab === 'subscription' ? 'VIP Premium' : 'User Profile'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 min-w-0 shrink">
          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[110px] sm:max-w-[200px]" title={currentUser.username}>@{currentUser.username}</span>
          <div className="w-7 h-7 rounded-full bg-slate-900 border border-emerald-550 flex items-center justify-center font-bold text-emerald-400 text-xs shrink-0">
            {currentUser.username[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar sliding drawer overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[100] flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/80"
            />
            
            {/* Drawer Body */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 max-w-[85vw] h-full bg-gradient-to-b from-[#0F172A] to-[#0D1527] text-slate-300 p-5 flex flex-col justify-between border-r border-slate-800/80 shadow-2xl overflow-y-auto"
            >
              {/* Close Button Inside Drawer */}
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-450 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col gap-6 mt-6">
                {/* Sports branding design */}
                <div className="flex items-center gap-3 pb-5 border-b border-emerald-950/40">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    <Trophy className="w-5 h-5 text-white stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 tracking-tight block text-sm">
                      POOL CODES PORTAL
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      portal v4.9
                    </span>
                  </div>
                </div>

                {/* User Profile identity Badge */}
                <div className="p-3.5 bg-gradient-to-r from-[#172540]/80 to-[#121F38]/80 rounded-xl border border-emerald-600/20 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center font-bold text-emerald-400 text-sm font-mono shadow-inner">
                    {currentUser.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-black text-slate-5 block truncate">@{currentUser.username}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span className="text-[9.5px] font-mono text-emerald-350 tracking-wider uppercase font-semibold">
                        {bypassPremium ? '★ VIP Member (Test Mode)' : (activePlan?.id !== 'plan-free' ? '★ VIP Member' : 'Free Trial Tier')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Navigation inside Drawer */}
                <nav className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setActiveSubTab('dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                      activeSubTab === 'dashboard'
                        ? 'bg-gradient-to-r from-emerald-555/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Home className="w-4 h-4" />
                      <span>DASHBOARD</span>
                    </span>
                    {activePlan?.id === 'plan-free' && !bypassPremium && (
                      <Lock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (onNavigateToLiveScores) {
                        onNavigateToLiveScores();
                      } else {
                        setActiveSubTab('streaming');
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 hover:bg-slate-800/60 text-slate-400 hover:text-slate-150"
                  >
                    <span className="flex items-center gap-3">
                      <Tv className="w-4 h-4 text-[#FA3E65] animate-pulse" />
                      <span className="flex items-center gap-2">
                        <span>LIVE SCORES ARENA</span>
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold tracking-widest leading-none uppercase">LIVE NOW</span>
                      </span>
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveSubTab('results');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                      activeSubTab === 'results'
                        ? 'bg-gradient-to-r from-emerald-555/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Trophy className="w-4 h-4" />
                      <span>POOL RESULTS</span>
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveSubTab('subscription');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                      activeSubTab === 'subscription'
                        ? 'bg-gradient-to-r from-emerald-555/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>VIP PREMIUM MEMBERSHIP</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveSubTab('profile');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                      activeSubTab === 'profile'
                        ? 'bg-gradient-to-r from-emerald-555/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
                    }`}
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>USER PROFILE</span>
                  </button>

                  {/* Mobile WhatsApp Shortcut Card */}
                  <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
                      <span className="text-[9px] font-mono font-bold text-emerald-400 tracking-wider">WHATSAPP CHANNEL</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Get instant verified pool codes, draws, and predictions directly on your phone.
                    </p>
                    <a
                      href="https://whatsapp.com/channel/0029VanbsS4EawdxbTTkgc3D"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black bg-[#25D366] hover:bg-[#20BA56] text-white transition shadow-sm cursor-pointer"
                    >
                      <span>✆ JOIN CHANNEL</span>
                    </a>
                  </div>

                  {onSignOut && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onSignOut();
                      }}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide text-rose-455 hover:text-rose-400 hover:bg-rose-500/10 transition duration-150 mt-4 border border-rose-500/20 w-full justify-center"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>LOG OUT SESSION</span>
                    </button>
                  )}
                </nav>
              </div>


            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Interactive Stadium Locker-Room Sidebar (Desktop) */}
      <aside className="hidden md:flex w-68 bg-gradient-to-b from-[#0F172A] to-[#0D1527] text-slate-300 p-5 flex-col justify-between border-r border-slate-800/80 shrink-0 overflow-y-auto">
        <div className="flex flex-col gap-6">
          {/* Sports branding design */}
          <div className="flex items-center gap-3 pb-5 border-b border-emerald-950/40">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-emerald-500/20">
              <Trophy className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 tracking-tight block text-sm">
                POOL CODES PORTAL
              </span>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                portal v4.9
              </span>
            </div>
          </div>

          {/* User Profile identity Badge */}
          <div className="p-3.5 bg-gradient-to-r from-[#172540]/80 to-[#121F38]/80 rounded-xl border border-emerald-600/20 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center font-bold text-emerald-400 text-sm font-mono shadow-inner">
              {currentUser.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black text-slate-5 block truncate">@{currentUser.username}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[9.5px] font-mono text-emerald-350 tracking-wider uppercase font-semibold">
                  {bypassPremium ? '★ VIP Member (Test Mode)' : (activePlan?.id !== 'plan-free' ? '★ VIP Member' : 'Free Trial Tier')}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveSubTab('dashboard')}
              className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                activeSubTab === 'dashboard'
                  ? 'bg-gradient-to-r from-emerald-550/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
              }`}
            >
              <span className="flex items-center gap-3">
                <Home className="w-4 h-4" />
                <span>DASHBOARD</span>
              </span>
              {activePlan?.id === 'plan-free' && !bypassPremium && (
                <Lock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => {
                if (onNavigateToLiveScores) {
                  onNavigateToLiveScores();
                } else {
                  setActiveSubTab('streaming');
                }
              }}
              className="flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 hover:bg-slate-800/60 text-slate-400 hover:text-slate-150"
            >
              <span className="flex items-center gap-3">
                <Tv className="w-4 h-4 text-[#FA3E65] animate-pulse" />
                <span>LIVE SCORES ARENA</span>
              </span>
              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold tracking-widest leading-none uppercase">LIVE NOW</span>
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
                <span>POOL RESULTS</span>
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

          {/* Desktop WhatsApp Shortcut Card */}
          <div className="mt-4 p-3.5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#25D366] rounded-full animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">WHATSAPP CHANNEL</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Join our official channel for verified weekly pool codes, draws, and predictions directly in WhatsApp.
            </p>
            <a
              href="https://whatsapp.com/channel/0029VanbsS4EawdxbTTkgc3D"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold bg-[#25D366] hover:bg-[#20BA56] text-[#070B14] hover:text-[#070B14] transition cursor-pointer text-center"
            >
              <span className="font-sans">✆</span>
              <span>JOIN CHANNEL</span>
            </a>
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center gap-2.5 px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide text-rose-455 hover:text-rose-400 hover:bg-rose-500/10 transition duration-150 border border-rose-500/20 cursor-pointer text-center"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>LOG OUT SESSION</span>
            </button>
          )}
        </div>


      </aside>

      {/* Main Panel View Area */}
      <main className="flex-1 p-3 sm:p-5 md:p-8 bg-[#070B14] flex flex-col gap-4 sm:gap-6 overflow-x-hidden overflow-y-auto min-h-0">
        
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
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSubTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6"
            >
              
              {isLockedOut && (activeSubTab === 'dashboard' || activeSubTab === 'streaming' || activeSubTab === 'results') ? (
                <div className="bg-slate-900/40 border border-rose-900/30 rounded-2xl p-6 md:p-12 text-center max-w-2xl mx-auto my-8 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col items-center gap-6">
                  {/* Decorative Lock Header */}
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-rose-500/10 rounded-full blur-2xl w-24 h-24 -translate-y-2"></div>
                    <div className="w-16 h-16 rounded-full bg-rose-950/50 border border-rose-500/30 flex items-center justify-center text-rose-455 relative">
                      <Lock className="w-8 h-8 animate-pulse text-rose-500" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-mono font-black text-rose-455 uppercase tracking-widest px-3 py-1 bg-rose-950/40 border border-rose-900/50 rounded-full">
                      {!isLoggedIn ? 'AUTHENTICATION REQUIRED' : !isVerified ? 'VERIFICATION REQUIRED' : isSubscriptionExpired ? 'PREMIUM ACCESS EXPIRED' : 'STRICT MODE: PAID VIP REQUIRED'}
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                      {!isLoggedIn ? 'Please Log In To Access Tables' : !isVerified ? 'Account Verification Pending' : isSubscriptionExpired ? 'Your Subscription Has Expired!' : 'Paid VIP Membership Required!'}
                    </h3>
                    <p className="text-slate-350 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
                      {!isLoggedIn 
                        ? 'Access to classified tables, match matrices, coupon sheets, and subscription plans requires an authenticated account. Please log in or register.'
                        : !isVerified
                        ? 'Your user account email must be verified to unlock access to classified tables (Bet9ja, BetKing, SportyBet, PremierBet, Betway, Soccabet).'
                        : isSubscriptionExpired 
                        ? 'Access to priority PoolCodes Arena Dashboard tables and weekly coupon sheets has been suspended due to plan expiration. Please renew.'
                        : 'Access to priority PoolCodes Arena Dashboard tables, real-time coupon code sheets, and match matrices is strictly restricted to verified, paid subscribers.'}
                    </p>
                  </div>

                  {/* Plan Details */}
                  {!isLoggedIn ? (
                    <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 text-left font-mono text-[11px] text-slate-400">
                      <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                        <span>User Session:</span>
                        <span className="text-rose-400 font-bold uppercase">Guest / Unauthenticated</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Requirement:</span>
                        <span className="text-emerald-400 font-bold uppercase font-mono">Sign In / Register</span>
                      </div>
                    </div>
                  ) : !isVerified ? (
                    <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 text-left font-mono text-[11px] text-slate-400">
                      <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                        <span>User Email:</span>
                        <span className="text-amber-400 font-bold">{currentUser.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verification Status:</span>
                        <span className="text-rose-400 font-bold uppercase font-mono">Pending Verification</span>
                      </div>
                    </div>
                  ) : isSubscriptionExpired && latestSub ? (
                    <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 text-left font-mono text-[11px] text-slate-400">
                      <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                        <span>Expired Plan:</span>
                        <span className="text-rose-400 font-bold uppercase">
                          {db.subscription_plans.find(p => p.id === latestSub.plan_id)?.name || 'Weekly VIP'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                        <span>Expiry Date:</span>
                        <span className="text-slate-200">
                          {new Date(latestSub.expires_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reference Ref:</span>
                        <span className="text-amber-500 font-bold">{latestSub.payment_ref || 'N/A'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 text-left font-mono text-[11px] text-slate-400">
                      <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                        <span>Current Plan:</span>
                        <span className="text-amber-500 font-bold uppercase">{activePlan?.name || 'Free Tier Access'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                        <span>Status:</span>
                        <span className="text-rose-400 font-bold uppercase font-mono">Unpaid / Restricted</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Requirement:</span>
                        <span className="text-emerald-400 font-bold uppercase font-mono">Paid VIP Subscription</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mt-2">
                    <button
                      onClick={() => setActiveSubTab('subscription')}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{isSubscriptionExpired ? 'Renew Subscription' : 'Upgrade to VIP'}</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        const planId = latestSub?.plan_id || 'plan-weekly';
                        buySubscription(planId);
                      }}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border border-slate-700/60 flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>{isSubscriptionExpired ? 'Instant 1-Click Pay' : 'Instant VIP Activation'}</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 font-mono mt-2">
                    Secured by Paystack Standard Payment Gateway. Activation is fully automated.
                  </p>
                </div>
              ) : (
                <>
                  {/* SUBTAB 1: SPORT CODES DASHBOARD CONTAINER */}
                  {activeSubTab === 'dashboard' && (
                <div className="flex flex-col gap-6">
                  {bypassPremium && (
                    <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-emerald-300 text-xs shadow-lg shadow-emerald-950/20">
                      <div className="flex items-center gap-3">
                        <span className="flex h-2.5 w-2.5 relative shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <div className="text-left">
                          <strong className="text-slate-100 block mb-0.5">🔧 Testing Mode Active (Premium Bypassed)</strong>
                          <span className="text-slate-300">All VIP locks and premium subscription validations are temporarily disabled. You can view all codesheets, download packages, and customize PDF templates for free.</span>
                        </div>
                      </div>
                      {onToggleBypassPremium && (
                        <button
                          onClick={onToggleBypassPremium}
                          className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800/90 hover:text-emerald-250 text-emerald-300 border border-emerald-700/50 rounded-xl text-[10.5px] font-black font-mono transition active:scale-95 duration-100 uppercase tracking-wider shrink-0 cursor-pointer shadow-md select-none"
                        >
                          Enable Normal Locks
                        </button>
                      )}
                    </div>
                  )}

                  {/* LIVE ARENA SPORTS SCORE TICKER (FULLY RESPONSIVE & MOBILE SWEET SWIPER) */}
                  <div className="bg-[#111827] rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FA3E65] animate-ping shrink-0"></span>
                        <h2 className="text-xs font-black font-sans uppercase tracking-widest text-[#FA3E65] flex items-center gap-1.5">
                          LIVE Arena Sports Scores
                        </h2>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase">Swipe Left/Right to browse</span>
                    </div>

                    <div 
                      ref={arenaScoreboardRef}
                      onMouseEnter={() => setIsArenaScoreboardHovered(true)}
                      onMouseLeave={() => setIsArenaScoreboardHovered(false)}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                      className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1 whitespace-nowrap"
                    >
                      {liveScoresData.length === 0 ? (
                        <div className="flex items-center justify-center py-4 px-6 text-slate-500 text-xs font-mono w-full">
                          <span>No live tracked games active in database. Manage games via the Live Match Cast tab.</span>
                        </div>
                      ) : (
                        Array.from({ length: 12 })
                          .flatMap(() => liveScoresData)
                          .map((match: any, idx: number) => {
                          const parts = (match.fixture || "").split(" vs ");
                          const team1 = parts[0]?.trim() || "Home";
                          const team2 = parts[1]?.trim() || "Away";
                          
                          const scoreParts = (match.score || "0 - 0").split(" - ");
                          const score1 = scoreParts[0]?.trim() || "0";
                          const score2 = scoreParts[1]?.trim() || "0";

                          const isLiveStatus = match.status === 'live';
                          const isFinished = match.status === 'finished';
                          const isPostponed = match.status === 'postponed';

                          let typeStr = 'NOT STARTED';
                          let typeColor = 'text-slate-500';
                          if (isLiveStatus) {
                            typeStr = 'LIVE';
                            typeColor = 'text-[#FA3E65]';
                          } else if (isFinished) {
                            typeStr = 'FT';
                            typeColor = 'text-emerald-400';
                          } else if (isPostponed) {
                            typeStr = 'PPD';
                            typeColor = 'text-amber-500';
                          }

                          return (
                            <div 
                              key={`live_match_portal_${idx}_${match.id || ''}`}
                              onClick={() => triggerToast(`Match Details: ${team1} vs ${team2} (${typeStr})`, 'info')}
                              className="flex items-center bg-[#070B14] border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-2.5 transition cursor-pointer gap-4 text-left shadow-md select-none shrink-0"
                            >
                              <div className="flex flex-col justify-center">
                                <span className={`text-[9px] font-mono font-black tracking-widest ${typeColor}`}>
                                  {typeStr}
                                </span>
                                <div className="flex items-center gap-2 mt-1 font-black">
                                  <span className="text-neutral-250 text-xs tracking-wide">{team1}</span> 
                                  <span className="text-amber-400 font-black text-xs">{score1}</span>
                                  <span className="text-slate-600 text-[10px]">-</span>
                                  <span className="text-neutral-250 text-xs tracking-wide">{team2}</span> 
                                  <span className="text-amber-400 font-black text-xs">{score2}</span>
                                </div>
                              </div>
                              {isLiveStatus && (
                                <span className="bg-[#FA3E65]/15 border border-[#FA3E65]/20 text-[#FA3E65] text-[8.5px] font-black px-1.5 py-0.5 rounded shadow animate-pulse uppercase tracking-wider font-mono">
                                  LIVE
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* WEEKLY POSTED COUPONS SECTION (SCREENSHOT ALIGNED LAYOUT) */}
                  <div className="bg-[#111827] rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col gap-6" id="posted-games-bulletin">

                    {/* Interactive Filter Strip */}
                    <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                      
                      {/* Bookmaker Selector Tabs */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 mr-1 hidden sm:inline">BOOKMAKER:</span>
                        {['Bet9ja', 'BetKing', 'SportyBet', 'PremierBet', 'Betway', 'Soccabet'].map((bookie) => (
                          <button
                            key={bookie}
                            disabled={isSyncingSupabase}
                            onClick={async () => {
                              setDashboardBookmakerFilter(bookie);
                              if (fetchRealSupabaseData) {
                                await fetchRealSupabaseData(false);
                              }
                            }}
                            className={`px-3.5 py-1.5 text-xs font-bold font-mono uppercase tracking-wide rounded-lg transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                              dashboardBookmakerFilter === bookie
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : 'bg-slate-900 text-slate-350 hover:bg-slate-800 border border-slate-800'
                            } ${isSyncingSupabase ? 'opacity-80' : ''}`}
                          >
                            {isSyncingSupabase && dashboardBookmakerFilter === bookie && (
                              <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            )}
                            {bookie}
                          </button>
                        ))}
                      </div>

                      {/* Right-aligned Search and Export */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        {/* Real-time search */}
                        <div className="relative w-full lg:w-72">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={dashboardGameSearch}
                            onChange={(e) => setDashboardGameSearch(e.target.value)}
                            placeholder="Search Team, Bet tip, Bet code..."
                            className="w-full bg-slate-950/95 text-slate-200 text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition font-mono placeholder:text-slate-600"
                          />
                          {dashboardGameSearch && (
                            <button 
                              onClick={() => setDashboardGameSearch('')}
                              className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300 uppercase font-mono"
                            >
                              clear
                            </button>
                          )}
                        </div>

                        {/* Download PDF Customizer Button */}
                        <button
                          onClick={() => {
                            setShowPdfPrintModal(true);
                          }}
                          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow shadow-emerald-500/10 shrink-0 font-mono animate-pulse"
                        >
                          <span>📄 Download PDF</span>
                        </button>
                      </div>
                    </div>

                    {/* THE TABLE CANVAS CONTAINER (COUPON RENDERER) */}
                    <div>
                      {(() => {
                        const userComponents = activeSubscription?.components || [];
                        const isBookieAllowed = (bookieName: string) => {
                          if (bypassPremium) return true;
                          if (currentUser.role === 'admin') return true;
                          if (!isLoggedIn || !isVerified || !isPaidUser) return false;
                          if (!activeSubscription || activeSubscription.status !== 'active') return false;
                          if (activePlan?.id === 'plan-free') return false;
                          return userComponents.map(c => c.toLowerCase()).includes(bookieName.toLowerCase());
                        };

                        const isTabAllowed = isBookieAllowed(dashboardBookmakerFilter);

                        if (!isTabAllowed) {
                          return (
                            <div className="p-8 text-center flex flex-col items-center justify-center bg-slate-950/40 border border-slate-800 rounded-2xl py-14">
                              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                                <Lock className="w-8 h-8 text-amber-500" />
                              </div>
                              <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wider font-mono">
                                {dashboardBookmakerFilter} Table Access Restricted
                              </h3>
                              <p className="text-sm text-slate-400 max-w-md mt-2 leading-relaxed">
                                You do not have access to the <strong>{dashboardBookmakerFilter}</strong> classified table. This component is not enabled in your current membership.
                              </p>
                              <button
                                onClick={() => {
                                  setActiveSubTab('subscription');
                                  triggerToast('Enable this bookmaker on your subscription page!', 'info');
                                }}
                                className="mt-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-6 py-3 rounded-xl uppercase transition tracking-wider shadow shadow-amber-500/10"
                              >
                                Upgrade Plan / Select Components
                              </button>
                            </div>
                          );
                        }

                        const filteredList = postedGames.filter(game => {
                          // Only include games matching allowed bookmaker components
                          if (game.bookmaker.toLowerCase() !== dashboardBookmakerFilter.toLowerCase()) return false;

                          const matchesSearch = dashboardGameSearch === '' ||
                            game.home.toLowerCase().includes(dashboardGameSearch.toLowerCase()) ||
                            game.away.toLowerCase().includes(dashboardGameSearch.toLowerCase()) ||
                            game.betCode.includes(dashboardGameSearch) ||
                            game.betTips.toLowerCase().includes(dashboardGameSearch.toLowerCase()) ||
                            game.status.toLowerCase().includes(dashboardGameSearch.toLowerCase());
                          return matchesSearch;
                        });

                        const isPaperMode = dashboardTheme === 'paper';

                        return (
                          <div className="w-full overflow-hidden rounded-xl">
                            {/* Visual Coupon Frame Wrapper */}
                            <div className={`p-1 pt-1.5 rounded-xl transition-all duration-300 ${
                              isPaperMode 
                                ? 'bg-[#FFFFFA] text-[#0A0D14] border-4 border-[#161D2E] p-4 font-sans select-text shadow-2xl' 
                                : 'bg-slate-950/40 text-slate-100 border border-slate-800 shadow-inner'
                            }`}>
                              
                              {/* Small Paper Header Indicator */}
                              {isPaperMode && (
                                <div className="border-b-4 border-[#161D2E] pb-3 mb-4 text-center">
                                  <div className="text-xl font-extrabold tracking-widest font-serif text-slate-950 uppercase italic">
                                    ★★★ WEEK 49 AUTHENTIC DRAW CLASSIFICATION SHEET ★★★
                                  </div>
                                  <div className="text-[11px] font-mono font-bold text-gray-700 tracking-wider mt-1">
                                    FAST POOL OFFICIAL FIXTURE RELEASE — AUSSIE FOOTBALL POOLS
                                  </div>
                                </div>
                              )}

                              {filteredList.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center justify-center">
                                  <div className="text-3xl">📭</div>
                                  <p className={`text-sm mt-2 font-mono ${isPaperMode ? 'text-gray-600' : 'text-slate-400'}`}>
                                    No posted fixtures match your filter or search query.
                                  </p>
                                  {(dashboardBookmakerFilter !== 'Bet9ja' || dashboardGameSearch !== '') && (
                                    <button
                                      onClick={() => {
                                        setDashboardBookmakerFilter('Bet9ja');
                                        setDashboardGameSearch('');
                                      }}
                                      className="mt-3 text-xs text-emerald-400 hover:underline font-mono"
                                    >
                                      Reset filters
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  {/* Mobile Swipe Helper Alert banner */}
                                  <div className="md:hidden flex items-center justify-between bg-slate-900/40 border border-slate-800/60 rounded-lg p-2.5 px-3 text-[10.5px] text-slate-300">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                      <span>Swipe matrix left/right ↔ to explore full odds, status & bookmakers</span>
                                    </div>
                                    <span className="text-[9px] bg-[#10B981]/15 text-emerald-450 px-2 py-0.5 rounded font-mono font-bold">GRID</span>
                                  </div>

                                  <div className="overflow-x-auto custom-scrollbar rounded-lg border border-slate-800/10">
                                    <table className={`w-full min-w-[750px] sm:min-w-[850px] border-collapse transition-all duration-300 ${
                                      isPaperMode 
                                        ? 'border-4 border-slate-950 text-slate-950 font-sans' 
                                        : 'border border-slate-800 text-slate-250 font-mono text-[11px] sm:text-xs'
                                    }`}>
                                  
                                  {/* Table Header exactly matching the layout columns: */}
                                  {/* POOL No. / BET CODE / HOME / AWAY / HOME WIN / DRAW (X) / AWAY WIN / BET Tips / STATUS / KICK OFF (W.A.T) */}
                                  <thead>
                                    <tr className={`transition-all duration-300 ${
                                      isPaperMode 
                                        ? 'bg-[#EFECE3] border-b-4 border-slate-950 text-slate-950 text-xs sm:text-sm font-extrabold uppercase' 
                                        : 'bg-slate-900/80 border-b border-slate-800 text-emerald-400 uppercase text-[9.5px] sm:text-[10.5px] tracking-wider'
                                    }`}>
                                      <th className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950 font-black' : 'border-slate-800'}`}>POOL No.</th>
                                      <th className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950 font-black text-rose-700' : 'border-slate-800'}`}>BET CODE</th>
                                      <th className={`px-2.5 py-2.5 sm:px-4 sm:py-3 text-left border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950 font-black' : 'border-slate-800'}`}>HOME</th>
                                      <th className={`px-2.5 py-2.5 sm:px-4 sm:py-3 text-left border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950 font-black' : 'border-slate-800'}`}>AWAY</th>
                                      <th className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950' : 'border-slate-800'}`}>HOME WIN</th>
                                      <th className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950 bg-amber-100 text-amber-950' : 'border-slate-800'}`}>DRAW (X)</th>
                                      <th className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950' : 'border-slate-800'}`}>AWAY WIN</th>
                                      <th className={`px-2 py-2.5 sm:px-3 sm:py-3 text-center border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950 font-bold text-emerald-800' : 'border-slate-800 text-amber-400'}`}>BET Tips</th>
                                      <th className={`px-2 py-2.5 sm:px-3 sm:py-3 text-center border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950' : 'border-slate-800'}`}>STATUS</th>
                                      <th className={`px-2 py-2.5 sm:px-3 sm:py-3 text-center border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950' : 'border-slate-800'}`}>KICK OFF</th>
                                      <th className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950' : 'border-slate-800'}`}>SYSTEM</th>
                                    </tr>
                                  </thead>

                                  {/* Table Body */}
                                  <tbody className={`divide-y transition-all duration-300 ${
                                    isPaperMode 
                                      ? 'divide-slate-950/80 text-slate-950 font-semibold bg-white' 
                                      : 'divide-slate-800/60 bg-slate-950/20'
                                  }`}>
                                    {filteredList.map((game) => (
                                      <tr 
                                        key={game.id} 
                                        className={`transition-all duration-150 group ${
                                          isPaperMode 
                                            ? 'hover:bg-[#FFF9EA]' 
                                            : 'hover:bg-slate-900/60 text-slate-300'
                                        }`}
                                      >
                                        {/* POOL NO */}
                                        <td className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center font-bold border-r transition-all duration-300 ${
                                          isPaperMode ? 'border-r border-slate-950 text-base font-black' : 'border-r border-slate-800/60'
                                        }`}>
                                          {game.poolNo}
                                        </td>
                                        
                                        {/* BET CODE */}
                                        <td className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center font-bold border-r transition-all duration-300 ${
                                          isPaperMode 
                                            ? 'border-r border-slate-950 text-[#C21C2F] text-base font-black' 
                                            : 'border-r border-slate-800/60 text-amber-400 font-extrabold bg-slate-950/40'
                                        }`}>
                                          <span className="flex items-center justify-center gap-1">
                                            {game.betCode}
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(game.betCode);
                                                triggerToast(`Bet Code [${game.betCode}] copied to clipboard!`, 'success');
                                              }}
                                              title="Copy Code"
                                              className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-slate-350/20 rounded shrink-0"
                                            >
                                              <span className="text-[10px] block text-slate-400">📋</span>
                                            </button>
                                          </span>
                                        </td>

                                        {/* HOME NAME */}
                                        <td className={`px-2.5 py-2.5 sm:px-4 sm:py-3 text-left font-bold border-r transition-all duration-300 ${
                                          isPaperMode ? 'border-r border-slate-950 text-sm font-black text-slate-950 uppercase' : 'border-r border-slate-800/60 font-semibold'
                                        }`}>
                                          {game.home}
                                        </td>

                                        {/* AWAY NAME */}
                                        <td className={`px-2.5 py-2.5 sm:px-4 sm:py-3 text-left font-bold border-r transition-all duration-300 ${
                                          isPaperMode ? 'border-r border-slate-950 text-sm font-black text-slate-950 uppercase' : 'border-r border-slate-800/60 font-semibold'
                                        }`}>
                                          {game.away}
                                        </td>

                                        {/* HOME WIN ODDS */}
                                        <td className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center border-r transition-all duration-300 ${
                                          isPaperMode ? 'border-r border-slate-950 text-gray-800' : 'border-r border-slate-800/60 font-mono text-slate-400'
                                        }`}>
                                          {game.homeWin}
                                        </td>

                                        {/* DRAW (X) ODDS */}
                                        <td className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center border-r font-bold transition-all duration-300 ${
                                          isPaperMode 
                                            ? 'border-r border-slate-950 bg-[#FFFFE3] text-[#0F172A] font-black' 
                                            : 'border-r border-slate-800/60 bg-emerald-950/15 text-emerald-400 font-extrabold'
                                        }`}>
                                          {game.draw}
                                        </td>

                                        {/* AWAY WIN ODDS */}
                                        <td className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center border-r transition-all duration-300 ${
                                          isPaperMode ? 'border-r border-slate-950 text-gray-800' : 'border-r border-slate-800/60 font-mono text-slate-400'
                                        }`}>
                                          {game.awayWin}
                                        </td>

                                        {/* BET TIPS */}
                                        <td className={`px-2 py-2.5 sm:px-3 sm:py-3 text-center font-bold border-r transition-all duration-300 ${
                                          isPaperMode 
                                            ? 'border-r border-slate-950 text-emerald-900 font-extrabold' 
                                            : 'border-r border-slate-800/60 font-black text-yellow-400'
                                        }`}>
                                          {game.betTips}
                                        </td>

                                        {/* STATUS */}
                                        <td className={`px-2 py-2.5 sm:px-3 sm:py-3 text-center border-r font-semibold transition-all duration-300 ${
                                          isPaperMode ? 'border-r border-slate-950 text-gray-800' : 'border-r border-slate-800/60 font-mono'
                                        }`}>
                                          {game.status}
                                        </td>

                                        {/* KICK OFF */}
                                        <td className={`px-2 py-2.5 sm:px-3 sm:py-3 text-center border-r font-bold transition-all duration-300 ${
                                          isPaperMode ? 'border-r border-slate-950' : 'border-r border-slate-800/60 font-mono'
                                        }`}>
                                          {game.kickOff}
                                        </td>

                                        {/* SYSTEM / ACTION */}
                                        <td className="px-1.5 py-2.5 sm:px-2 sm:py-3 text-center font-mono">
                                          <div className="flex items-center justify-center gap-1">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${
                                              isPaperMode 
                                                ? 'bg-slate-200 text-slate-900 border border-slate-350' 
                                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                                            }`}>
                                              {game.bookmaker[0].toUpperCase()}
                                            </span>

                                            {currentUser.role === 'admin' && (
                                              <button
                                                onClick={() => handleDeleteGame(game.id, `${game.home} vs ${game.away}`)}
                                                className="px-1 text-red-500 hover:text-red-400 transition"
                                                title="Delete fixture"
                                              >
                                                ✕
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                </div>
                                </div>
                              )}

                              {isPaperMode && (
                                <div className="mt-4 border-t-2 border-slate-950 pt-2 text-center text-[10px] font-mono text-gray-850 font-bold">
                                  * AUTHENTIC FASTPOOL TELECOMMUNICATIONS WORKSPACE PROTOCOL. UNAUTHORIZED DUPLICATION STRICTLY FORBIDDEN.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* ADMIN PANEL FORM: DYNAMIC POSTER BULLETINS */}
                    {currentUser.role === 'admin' && (
                      <div className="bg-slate-900/95 border-2 border-emerald-500/30 p-5 rounded-2xl flex flex-col gap-6 animate-fadeIn mb-6">
                        {/* DATABASE SCHEMA & TABLE EXPLORER HEADER */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <h4 className="text-sm font-black font-mono text-emerald-400 uppercase tracking-wider">
                                🗄️ SUPABASE DATABASE TABLE EXPLORER & SCHEMA SYNCHRONIZER
                              </h4>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              Detects, queries, inserts, and synchronizes ALL active database tables directly from Supabase.
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              refreshDbExplorer();
                              if (fetchRealSupabaseData) fetchRealSupabaseData(false);
                            }}
                            disabled={dbExplorerLoading || isSyncingSupabase}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black font-mono text-xs rounded-xl transition flex items-center gap-2 shadow-lg cursor-pointer"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${(dbExplorerLoading || isSyncingSupabase) ? 'animate-spin' : ''}`} />
                            Re-Scan & Sync Database Tables
                          </button>
                        </div>

                        {/* DISCOVERED TABLES STRIP */}
                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-300 mb-2 uppercase tracking-wide">
                            DISCOVERED SUPABASE TABLES ({dbExplorerTables.length} Active):
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            {dbExplorerTables.length === 0 ? (
                              <button
                                onClick={() => refreshDbExplorer()}
                                className="text-xs text-amber-400 font-mono bg-amber-950/40 border border-amber-800/50 px-3 py-1.5 rounded-lg"
                              >
                                ⚠️ No tables cached yet. Click here to scan database schema.
                              </button>
                            ) : (
                              dbExplorerTables.map((tbl) => {
                                const isSelected = dbExplorerSelectedTable === tbl.name;
                                return (
                                  <button
                                    key={`db_tbl_${tbl.name}`}
                                    onClick={() => refreshDbExplorer(tbl.name)}
                                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-500 text-slate-950 font-black ring-2 ring-emerald-300'
                                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                                    }`}
                                  >
                                    <Database className="w-3 h-3" />
                                    <span>{tbl.name}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                                      {tbl.count ?? 0} rows
                                    </span>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* SELECTED TABLE DATA VIEWER */}
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
                          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-slate-400 uppercase">ACTIVE TABLE:</span>
                              <span className="text-sm font-mono font-black text-amber-400 uppercase tracking-wider">{dbExplorerSelectedTable}</span>
                              <span className="text-xs text-slate-500 font-mono">({dbExplorerRows.length} rows loaded)</span>
                            </div>
                            <button
                              onClick={() => refreshDbExplorer(dbExplorerSelectedTable)}
                              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 underline"
                            >
                              Reload Rows
                            </button>
                          </div>

                          {dbExplorerError && (
                            <div className="bg-rose-950/40 border border-rose-800/50 text-rose-300 p-3 rounded-lg text-xs font-mono">
                              ⚠️ {dbExplorerError}
                            </div>
                          )}

                          {dbExplorerLoading ? (
                            <div className="py-8 text-center text-xs font-mono text-slate-400 animate-pulse">
                              Fetching live rows for table '{dbExplorerSelectedTable}' from Supabase...
                            </div>
                          ) : dbExplorerRows.length === 0 ? (
                            <div className="py-6 text-center text-xs font-mono text-slate-500">
                              No rows found in table '{dbExplorerSelectedTable}'. You can insert a row below using the JSON form.
                            </div>
                          ) : (
                            <div className="overflow-x-auto max-h-72 border border-slate-800 rounded-lg">
                              <table className="w-full text-left text-xs font-mono text-slate-300">
                                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] sticky top-0">
                                  <tr>
                                    {Object.keys(dbExplorerRows[0] || {}).slice(0, 7).map((col) => (
                                      <th key={col} className="p-2.5 border-b border-slate-800 font-black">{col}</th>
                                    ))}
                                    <th className="p-2.5 border-b border-slate-800 text-right font-black">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                  {dbExplorerRows.map((row, rIdx) => {
                                    const rowId = row.id || row._id || rIdx;
                                    return (
                                      <tr key={`tbl_row_${rIdx}`} className="hover:bg-slate-900/50 transition">
                                        {Object.keys(dbExplorerRows[0] || {}).slice(0, 7).map((col) => {
                                          const val = row[col];
                                          const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
                                          return (
                                            <td key={`${rIdx}_${col}`} className="p-2.5 text-[11px] truncate max-w-[200px]" title={displayVal}>
                                              {displayVal}
                                            </td>
                                          );
                                        })}
                                        <td className="p-2.5 text-right whitespace-nowrap">
                                          {row.id && (
                                            <button
                                              onClick={async () => {
                                                if (confirm(`Delete row ID '${row.id}' from table '${dbExplorerSelectedTable}'?`)) {
                                                  try {
                                                    const res = await fetch(`/api/tables/${dbExplorerSelectedTable}/${row.id}`, { method: 'DELETE' });
                                                    const resJson = await res.json();
                                                    if (resJson.success) {
                                                      triggerToast(`Row ${row.id} deleted!`, 'success');
                                                      refreshDbExplorer(dbExplorerSelectedTable);
                                                    } else {
                                                      triggerToast(`Delete error: ${resJson.error}`, 'error');
                                                    }
                                                  } catch (e: any) {
                                                    triggerToast(`Delete error: ${e?.message || e}`, 'error');
                                                  }
                                                }
                                              }}
                                              className="text-rose-400 hover:text-rose-300 font-bold hover:underline"
                                            >
                                              Delete
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* INSERT ROW JSON FORM */}
                          <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-2">
                            <label className="text-xs font-mono font-bold text-amber-400 uppercase">
                              ➕ Insert Row into '{dbExplorerSelectedTable}' (JSON Payload):
                            </label>
                            <textarea
                              rows={3}
                              value={dbExplorerNewRowJson}
                              onChange={(e) => setDbExplorerNewRowJson(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                              placeholder='{ "title": "Example", "status": "active" }'
                            />
                            <div className="flex justify-end">
                              <button
                                onClick={async () => {
                                  try {
                                    const parsed = JSON.parse(dbExplorerNewRowJson);
                                    const res = await fetch(`/api/tables/${dbExplorerSelectedTable}/insert`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(parsed)
                                    });
                                    const resJson = await res.json();
                                    if (resJson.success) {
                                      triggerToast(`Successfully inserted row into '${dbExplorerSelectedTable}'!`, 'success');
                                      refreshDbExplorer(dbExplorerSelectedTable);
                                    } else {
                                      triggerToast(`Insert failed: ${resJson.error}`, 'error');
                                    }
                                  } catch (err: any) {
                                    triggerToast(`Invalid JSON format: ${err?.message || err}`, 'error');
                                  }
                                }}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black text-xs rounded-lg transition shadow cursor-pointer"
                              >
                                Insert Record into {dbExplorerSelectedTable}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ADMIN PANEL FORM: DYNAMIC POSTER BULLETINS */}
                    {currentUser.role === 'admin' && showAdminForm && (
                      <div className="bg-slate-900/95 border-2 border-amber-500/30 p-5 rounded-2xl flex flex-col gap-4 animate-fadeIn">
                        <div className="border-b border-slate-800 pb-2">
                          <h4 className="text-sm font-black font-mono text-amber-400 uppercase tracking-wider">
                            🛡️ ADMIN CONSOLE: POST / RE-PUBLISH FIXTURES BULLETIN
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Updates live predictions instantly for all logged in subscribers. Check layout formatting.
                          </p>
                        </div>

                        <form onSubmit={handleAddGame} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs font-mono">
                          <div>
                            <label className="block text-slate-400 mb-1">POOL No.</label>
                            <input
                              type="number"
                              value={adminPoolNo}
                              onChange={(e) => setAdminPoolNo(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1 text-amber-300 font-bold">BET CODE (REQUIRED)</label>
                            <input
                              type="text"
                              value={adminBetCode}
                              onChange={(e) => setAdminBetCode(e.target.value)}
                              placeholder="e.g. 2531"
                              className="w-full bg-slate-950 border border-[#D97706]/60 rounded px-2.5 py-1.5 text-white placeholder:text-slate-700"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1 text-emerald-400 font-bold">HOME TEAM</label>
                            <input
                              type="text"
                              value={adminHome}
                              onChange={(e) => setAdminHome(e.target.value)}
                              placeholder="e.g. Marconi S."
                              className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-white placeholder:text-slate-700"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1 text-emerald-400 font-bold">AWAY TEAM</label>
                            <input
                              type="text"
                              value={adminAway}
                              onChange={(e) => setAdminAway(e.target.value)}
                              placeholder="e.g. Sydney FC"
                              className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-white placeholder:text-slate-700"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">HOME WIN ODDS</label>
                            <input
                              type="text"
                              value={adminHomeWin}
                              onChange={(e) => setAdminHomeWin(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">DRAW ODDS (X)</label>
                            <input
                              type="text"
                              value={adminDraw}
                              onChange={(e) => setAdminDraw(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">AWAY WIN ODDS</label>
                            <input
                              type="text"
                              value={adminAwayWin}
                              onChange={(e) => setAdminAwayWin(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">BET Tips</label>
                            <input
                              type="text"
                              value={adminBetTips}
                              onChange={(e) => setAdminBetTips(e.target.value)}
                              placeholder="Ov 2.5 / Un 2.5 / X"
                              className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">STATUS DAY</label>
                            <select
                              value={adminStatus}
                              onChange={(e) => setAdminStatus(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-white"
                            >
                              <option value="Friday">Friday</option>
                              <option value="Saturday">Saturday</option>
                              <option value="Sunday">Sunday</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">KICK OFF TIME</label>
                            <input
                              type="text"
                              value={adminKickOff}
                              onChange={(e) => setAdminKickOff(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">BOOKMAKER CODES SYSTEM</label>
                            <select
                              value={adminBookmakerCode}
                              onChange={(e) => setAdminBookmakerCode(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-white"
                            >
                              <option value="Bet9ja">Bet9ja</option>
                              <option value="BetKing">BetKing</option>
                              <option value="SportyBet">SportyBet</option>
                              <option value="MSport">MSport</option>
                              <option value="PremierBet">PremierBet</option>
                              <option value="Betway">Betway</option>
                              <option value="Soccabet">Soccabet</option>
                            </select>
                          </div>

                          <div className="flex items-end">
                            <button
                              type="submit"
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg transition"
                            >
                              ⚡ POST TO LIVE BULLETIN
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>




                </div>
              )}

              {/* SUBTAB 2: POOL CODES BROWSER (IMMERSIBLE LIVE SCOREBOARD AND DECRYPTOR SYSTEM) */}
              {false && (() => {
                // Static high-fidelity scoreboard fixtures
                const stadiumMatches = [
                  {
                    id: 'f-1',
                    sport: 'Football',
                    competition: 'World Cup 2026',
                    region: 'International',
                    group: 'Group A',
                    homeTeam: 'Mexico',
                    awayTeam: 'South Africa',
                    homeLogo: '🇲🇽',
                    awayLogo: '🇿🇦',
                    time: '20:00',
                    status: 'Today',
                    date: '11 Jun 2026',
                    referee: 'Wilton Sampaio (Brazil)',
                    venue: 'Estadio Azteca (Mexico City)',
                    matchingCodeId: 'pc-001',
                    bookmaker: 'Bet9ja',
                    week: 'Week 49 Aussie'
                  },
                  {
                    id: 'f-2',
                    sport: 'Football',
                    competition: 'Premier League',
                    region: 'England',
                    group: 'Matchday 38',
                    homeTeam: 'Arsenal',
                    awayTeam: 'Chelsea',
                    homeLogo: '🔴',
                    awayLogo: '🔵',
                    time: '16:00',
                    status: 'FT 2-1',
                    date: '12 Jun 2026',
                    referee: 'Michael Oliver (England)',
                    venue: 'Emirates Stadium (London)',
                    matchingCodeId: 'pc-001',
                    bookmaker: 'Bet9ja',
                    week: 'Week 49 Aussie'
                  },
                  {
                    id: 'f-3',
                    sport: 'Football',
                    competition: 'Premier League',
                    region: 'England',
                    group: 'Matchday 38',
                    homeTeam: 'Liverpool',
                    awayTeam: 'Leeds',
                    homeLogo: '🔴',
                    awayLogo: '🟡',
                    time: '18:30',
                    status: 'Tomorrow',
                    date: '13 Jun 2026',
                    referee: 'Anthony Taylor (England)',
                    venue: 'Anfield (Liverpool)',
                    matchingCodeId: 'pc-002',
                    bookmaker: 'BetKing',
                    week: 'Week 49 Aussie'
                  },
                  {
                    id: 'f-4',
                    sport: 'Football',
                    competition: 'Serie A 25/26',
                    region: 'Italy',
                    group: 'Matchday 35',
                    homeTeam: 'Napoli',
                    awayTeam: 'Juventus',
                    homeLogo: '🔵',
                    awayLogo: '⚫',
                    time: '20:45',
                    status: 'Completed',
                    date: '14 Jun 2026',
                    referee: 'Daniele Orsato (Italy)',
                    venue: 'Diego Armando Maradona (Naples)',
                    matchingCodeId: 'pc-003',
                    bookmaker: 'SportyBet',
                    week: 'Week 49 Aussie'
                  },
                  {
                    id: 'f-5',
                    sport: 'Football',
                    competition: 'LaLiga',
                    region: 'Spain',
                    group: 'Matchday 37',
                    homeTeam: 'Real Madrid',
                    awayTeam: 'Sevilla',
                    homeLogo: '⚪',
                    awayLogo: '🔴',
                    time: '21:00',
                    status: 'Friday',
                    date: '15 Jun 2026',
                    referee: 'Jesús Gil Manzano (Spain)',
                    venue: 'Santiago Bernabéu (Madrid)',
                    matchingCodeId: 'pc-old',
                    bookmaker: 'Bet9ja',
                    week: 'Week 48'
                  },
                  {
                    id: 'f-6',
                    sport: 'Football',
                    competition: 'Bundesliga',
                    region: 'Germany',
                    group: 'Matchday 34',
                    homeTeam: 'Bayern Munich',
                    awayTeam: 'Dortmund',
                    homeLogo: '🔴',
                    awayLogo: '🟡',
                    time: '15:30',
                    status: 'Today',
                    date: '11 Jun 2026',
                    referee: 'Felix Zwayer (Germany)',
                    venue: 'Allianz Arena (Munich)',
                    matchingCodeId: 'pc-001',
                    bookmaker: 'Bet9ja',
                    week: 'Week 49 Aussie'
                  },
                  {
                    id: 'f-7',
                    sport: 'Football',
                    competition: 'Africa Cup of Nations',
                    region: 'Africa',
                    group: 'Group C',
                    homeTeam: 'Nigeria',
                    awayTeam: 'Ivory Coast',
                    homeLogo: '🇳🇬',
                    awayLogo: '🇨🇮',
                    time: '17:00',
                    status: 'Today',
                    date: '11 Jun 2026',
                    referee: 'Mustapha Ghorbal',
                    venue: 'Cairo International Stadium',
                    matchingCodeId: 'pc-001',
                    bookmaker: 'Bet9ja',
                    week: 'Week 49'
                  },
                  {
                    id: 'f-8',
                    sport: 'Football',
                    competition: 'Africa Cup of Nations',
                    region: 'Africa',
                    group: 'Group C',
                    homeTeam: 'Ghana',
                    awayTeam: 'Cameroon',
                    homeLogo: '🇬🇭',
                    awayLogo: '🇨🇲',
                    time: '20:00',
                    status: 'Tomorrow',
                    date: '12 Jun 2026',
                    referee: 'Bakary Gassama',
                    venue: 'Cairo International Stadium',
                    matchingCodeId: 'pc-002',
                    bookmaker: 'BetKing',
                    week: 'Week 49 Aussie'
                  },
                  {
                    id: 'f-9',
                    sport: 'Football',
                    competition: 'Africa Cup of Nations',
                    region: 'Africa',
                    group: 'Group B',
                    homeTeam: 'Algeria',
                    awayTeam: 'Egypt',
                    homeLogo: '🇩🇿',
                    awayLogo: '🇪🇬',
                    time: '19:30',
                    status: 'Sunday',
                    date: '14 Jun 2026',
                    referee: 'Victor Gomes',
                    venue: 'Stade du 5 Juillet (Algiers)',
                    matchingCodeId: 'pc-003',
                    bookmaker: 'SportyBet',
                    week: 'Week 49 Aussie'
                  },
                  {
                    id: 'h-1',
                    sport: 'Hockey',
                    competition: 'NHL Season',
                    region: 'USA',
                    group: 'Semifinals',
                    homeTeam: 'Bruins',
                    awayTeam: 'Red Wings',
                    homeLogo: '🐻',
                    awayLogo: '🐙',
                    time: '19:00',
                    status: 'Today',
                    date: '11 Jun 2026',
                    referee: 'Kelly Sutherland',
                    venue: 'TD Garden (Boston)',
                    matchingCodeId: 'pc-001',
                    bookmaker: 'Bet9ja',
                    week: 'Week 49 Aussie'
                  },
                  {
                    id: 'b-1',
                    sport: 'Basketball',
                    competition: 'NBA Finals 2026',
                    region: 'USA',
                    group: 'Game 5',
                    homeTeam: 'Celtics',
                    awayTeam: 'Lakers',
                    homeLogo: '☘️',
                    awayLogo: '🏆',
                    time: '21:30',
                    status: 'Tomorrow',
                    date: '12 Jun 2026',
                    referee: 'Scott Foster',
                    venue: 'Crypto.com Arena (LA)',
                    matchingCodeId: 'pc-002',
                    bookmaker: 'BetKing',
                    week: 'Week 49 Aussie'
                  },
                  {
                    id: 't-1',
                    sport: 'Tennis',
                    competition: 'Wimbledon',
                    region: 'England',
                    group: 'Quarterfinals',
                    homeTeam: 'Alcaraz',
                    awayTeam: 'Djokovic',
                    homeLogo: '🎾',
                    awayLogo: '🏆',
                    time: '14:00',
                    status: 'Today',
                    date: '11 Jun 2026',
                    referee: 'Lars Graff',
                    venue: 'Center Court (London)',
                    matchingCodeId: 'pc-003',
                    bookmaker: 'SportyBet',
                    week: 'Week 49 Aussie'
                  },
                  {
                    id: 'c-1',
                    sport: 'Cricket',
                    competition: 'IPL 2026',
                    region: 'India',
                    group: 'Grand Finale',
                    homeTeam: 'Mumbai Indians',
                    awayTeam: 'Chennai Super Kings',
                    homeLogo: '🏏',
                    awayLogo: '🦁',
                    time: '15:30',
                    status: 'Sunday',
                    date: '14 Jun 2026',
                    referee: 'Nitin Menon',
                    venue: 'Wankhede Stadium (Mumbai)',
                    matchingCodeId: 'pc-001',
                    bookmaker: 'Bet9ja',
                    week: 'Week 49 Aussie'
                  }
                ];

                // Filter matches dynamically
                const filteredMatches = stadiumMatches.filter(m => {
                  if (m.sport !== selectedSport) return false;

                  if (selectedTeamFilter !== 'all') {
                    if (m.homeTeam !== selectedTeamFilter && m.awayTeam !== selectedTeamFilter) return false;
                  }

                  if (selectedCompFilter !== 'all') {
                    if (m.competition !== selectedCompFilter) return false;
                  }

                  if (selectedRegionFilter !== 'all') {
                    if (m.region !== selectedRegionFilter) return false;
                  }

                  if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    const hasMatch = m.homeTeam.toLowerCase().includes(term) ||
                                     m.awayTeam.toLowerCase().includes(term) ||
                                     m.competition.toLowerCase().includes(term) ||
                                     (m.bookmaker && m.bookmaker.toLowerCase().includes(term));
                    if (!hasMatch) return false;
                  }

                  return true;
                });

                // Retrieve active selected match
                const activeMatch = filteredMatches.find(m => m.id === selectedMatchFixtureId) || filteredMatches[0] || stadiumMatches[0];

                // Associated code sheet details
                const associatedCodeId = activeMatch?.matchingCodeId;
                const associatedCode = db.pool_codes.find(c => c.id === associatedCodeId);
                const isCodeUnlocked = associatedCode ? isAlreadyUnlocked(associatedCode.id) : false;
                const isPremium = associatedCode?.access_level === 'premium';
                
                const bookmakerSlug = (associatedCode?.bookmaker_id || '').replace('bm-', '').toLowerCase();
                const hasComponentAccess = !isPremium || currentUser.role === 'admin' || (
                  activeSubscription && 
                  activeSubscription.status === 'active' &&
                  (!activeSubscription.components || activeSubscription.components.includes(bookmakerSlug))
                );

                const isLocked = !bypassPremium && currentUser.role !== 'admin' && (
                  !isLoggedIn ||
                  !isVerified ||
                  !isPaidUser ||
                  (isPremium && !hasComponentAccess)
                );
                const bookmaker = db.bookmakers.find(b => b.id === associatedCode?.bookmaker_id);

                return (
                  <div className="flex flex-col gap-5 text-slate-100 select-none">
                    
                    {/* Master Layout: 2 Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      
                      {/* Left Column: Explorer Directory Filter (3 Cols on large) */}
                      <div className="lg:col-span-4 bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-5">
                        
                        {/* Search Bar matching screenshot exactly */}
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                            <Search className="w-4 h-4 text-slate-400" />
                          </span>
                          <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full text-xs font-sans py-2.5 pl-9 pr-3 border border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 bg-[#060810] text-slate-100 placeholder-slate-500 transition-colors"
                          />
                        </div>

                        {/* Accordion Categories */}
                        <div className="space-y-4">
                          
                          {/* TEAMS Category */}
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-mono tracking-widest uppercase text-slate-400 font-bold mb-2 cursor-pointer hover:text-white transition-colors">
                              <span>TEAMS</span>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                              <div
                                onClick={() => setSelectedTeamFilter('all')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left cursor-pointer transition-all flex items-center gap-2 ${
                                  selectedTeamFilter === 'all'
                                    ? 'bg-[#1A253C]/60 text-emerald-400 border-l-2 border-emerald-500'
                                    : 'hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <span className="text-slate-500 text-xs text-center w-5">★</span>
                                <span className="uppercase text-[10.5px]">All Teams Directory</span>
                              </div>
                              {[
                                { name: 'Nigeria', icon: '🇳🇬', country: 'Nigeria' },
                                { name: 'Cameroon', icon: '🇨🇲', country: 'Cameroon' },
                                { name: 'Ivory Coast', icon: '🇨🇮', country: 'Ivory Coast' },
                                { name: 'Ghana', icon: '🇬🇭', country: 'Ghana' },
                                { name: 'Algeria', icon: '🇩🇿', country: 'Algeria' }
                              ].map((team) => {
                                const isSel = selectedTeamFilter === team.name;
                                return (
                                  <div
                                    key={team.name}
                                    onClick={() => {
                                      setSelectedTeamFilter(isSel ? 'all' : team.name);
                                      const matching = stadiumMatches.find(m => m.sport === selectedSport && (m.homeTeam === team.name || m.awayTeam === team.name));
                                      if (matching) {
                                        setSelectedMatchFixtureId(matching.id);
                                      }
                                    }}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left cursor-pointer transition-all flex items-center justify-between ${
                                      isSel
                                        ? 'bg-[#1A253C] text-emerald-400 border-l-2 border-emerald-400'
                                        : 'hover:bg-slate-900/40 text-slate-350 hover:text-slate-100'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="shrink-0 text-sm select-none">{team.icon}</span>
                                      <span className="truncate">{team.name}</span>
                                    </div>
                                    <span className="text-[9px] text-slate-500 uppercase">{team.country}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* COMPETITIONS Category */}
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-mono tracking-widest uppercase text-slate-400 font-bold mb-2 cursor-pointer hover:text-white transition-colors">
                              <span>COMPETITIONS</span>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <div className="space-y-1">
                              <div
                                onClick={() => setSelectedCompFilter('all')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left cursor-pointer transition-all flex items-center gap-2 ${
                                  selectedCompFilter === 'all'
                                    ? 'bg-[#1A253C]/60 text-emerald-400 border-l-2 border-emerald-500'
                                    : 'hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <span className="text-slate-500 text-xs text-center w-5">★</span>
                                <span className="uppercase text-[10.5px]">All Tournaments</span>
                              </div>
                              {[
                                { name: 'World Cup 2026', flag: '🏆', origin: 'International' },
                                { name: 'Premier League', flag: '🇬🇧', origin: 'England' },
                                { name: 'Serie A 25/26', flag: '🇮🇹', origin: 'Italy' },
                                { name: 'LaLiga', flag: '🇪🇸', origin: 'Spain' },
                                { name: 'Bundesliga', flag: '🇩🇪', origin: 'Germany' }
                              ].map((comp) => {
                                const isSel = selectedCompFilter === comp.name;
                                return (
                                  <div
                                    key={comp.name}
                                    onClick={() => {
                                      setSelectedCompFilter(isSel ? 'all' : comp.name);
                                      const matching = stadiumMatches.find(m => m.sport === selectedSport && m.competition === comp.name);
                                      if (matching) {
                                        setSelectedMatchFixtureId(matching.id);
                                      }
                                    }}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left cursor-pointer transition-all flex items-center justify-between ${
                                      isSel
                                        ? 'bg-[#1A253C] text-emerald-400 border-l-2 border-emerald-400'
                                        : 'hover:bg-slate-900/40 text-slate-350 hover:text-slate-100'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-slate-500 font-mono text-[10px] w-5 text-center shrink-0">{comp.flag}</span>
                                      <span className="truncate">{comp.name}</span>
                                    </div>
                                    <span className="text-[9px] text-slate-500 uppercase">{comp.origin}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* REGION Category */}
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-mono tracking-widest uppercase text-slate-400 font-bold mb-2 cursor-pointer hover:text-white transition-colors">
                              <span>REGION</span>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <div className="space-y-1">
                              <div
                                onClick={() => setSelectedRegionFilter('all')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left cursor-pointer transition-all flex items-center gap-2 ${
                                  selectedRegionFilter === 'all'
                                    ? 'bg-[#1A253C]/60 text-emerald-400 border-l-2 border-emerald-500'
                                    : 'hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <span className="text-slate-500 text-xs text-center w-5">★</span>
                                <span className="uppercase text-[10.5px]">All Regions</span>
                              </div>
                              {[
                                { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', code: 'ENG' },
                                { name: 'Champions League', flag: '🇪🇺', code: 'UEFA' },
                                { name: 'Spain', flag: '🇪🇸', code: 'ESP' },
                                { name: 'Italy', flag: '🇮🇹', code: 'ITA' },
                                { name: 'Germany', flag: '🇩🇪', code: 'GER' }
                              ].map((region) => {
                                const isSel = selectedRegionFilter === region.name;
                                return (
                                  <div
                                    key={region.name}
                                    onClick={() => setSelectedRegionFilter(isSel ? 'all' : region.name)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left cursor-pointer transition-all flex items-center justify-between ${
                                      isSel
                                        ? 'bg-[#1A253C] text-emerald-400 border-l-2 border-emerald-400'
                                        : 'hover:bg-slate-900/40 text-slate-350 hover:text-slate-100'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-slate-500 font-mono text-[10px] w-5 text-center shrink-0">{region.flag}</span>
                                      <span className="truncate">{region.name}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-mono font-black">{region.code}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>

                        {/* Fast matches browser selector */}
                        <div className="border-t border-slate-800/60 pt-4">
                          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block mb-2.5">
                            📚 Matches list ({filteredMatches.length})
                          </span>
                          {filteredMatches.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic block py-2 text-center">No matching matches found</p>
                          ) : (
                            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                              {filteredMatches.map((m) => {
                                const isActive = activeMatch?.id === m.id;
                                return (
                                  <div
                                    key={m.id}
                                    onClick={() => {
                                      setSelectedMatchFixtureId(m.id);
                                    }}
                                    className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 text-left border ${
                                      isActive
                                        ? 'border-emerald-500/50 bg-[#162035]/65'
                                        : 'border-slate-800 bg-[#060810]/40 hover:bg-slate-900/40 hover:border-slate-700/60'
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] bg-slate-800 text-slate-400 font-mono px-1 py-0.2 rounded uppercase block select-none border border-slate-750 font-semibold">
                                          {m.competition}
                                        </span>
                                        {m.time && (
                                          <span className="text-[9px] text-[#A78BFA] font-mono font-bold select-none">{m.status}</span>
                                        )}
                                      </div>
                                      <div className="text-[11.5px] font-bold text-slate-200 mt-1 block truncate">
                                        {m.homeTeam} vs {m.awayTeam}
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-[10px] font-mono text-emerald-400 font-black tracking-tighter uppercase whitespace-nowrap block">
                                        {m.bookmaker}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Right Column: Scoreboard Hero Match Layout (8 Cols on large) */}
                      <div className="lg:col-span-8 flex flex-col gap-4">
                        
                        {/* Scoreboard Hero Container matching screenshot exactly */}
                        <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                          
                          {/* Upper Header strip: WC Logo/Title and Star icon */}
                          <div className="px-5 py-3.5 border-b border-slate-900 bg-[#121827]/60 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Representative Shield */}
                              <div className="w-8 h-8 rounded bg-[#101422] border border-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-400 font-mono select-none">
                                WC
                              </div>
                              <div className="text-left">
                                <span className="text-xs font-black text-slate-100 block tracking-wider uppercase font-sans">
                                  {activeMatch?.competition || 'World Cup 2026'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono tracking-tight block">
                                  {activeMatch?.group || 'Group A'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Star Icon for favorite status toggle */}
                            <button
                              onClick={() => {
                                if (!activeMatch?.id) return;
                                const matchId = activeMatch.id;
                                const isFav = favoritesList.includes(matchId);
                                if (isFav) {
                                  setFavoritesList(prev => prev.filter(id => id !== matchId));
                                  triggerToast('Fixture removed from favorites!', 'info');
                                } else {
                                  setFavoritesList(prev => [...prev, matchId]);
                                  triggerToast('Fixture saved to your favorite pool codes!', 'success');
                                }
                              }}
                              className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center transition-colors"
                            >
                              <Star className={`w-4 h-4 ${activeMatch?.id && favoritesList.includes(activeMatch.id) ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                            </button>
                          </div>

                          {/* Scoreboard Center Panel (Team Mexico vs team South Africa) */}
                          <div className="p-6 md:p-8 bg-gradient-to-b from-[#0e1424] via-[#090d18] to-[#060810] flex items-center justify-between text-center select-none relative">
                            
                            {/* Left Team (Mexico style layout) */}
                            <div className="flex-1 min-w-0 flex flex-col items-center gap-3.5">
                              <div className="w-16 h-16 rounded-full bg-[#121A30]/60 border-2 border-slate-800 flex items-center justify-center text-3xl shadow-xl transition-transform hover:scale-105 duration-300 relative overflow-hidden">
                                <div className="absolute inset-0 bg-emerald-500/5"></div>
                                <span className="relative z-10 select-none">{activeMatch?.homeLogo}</span>
                              </div>
                              <span className="font-extrabold text-white text-xs sm:text-sm tracking-wide block uppercase truncate">
                                {activeMatch?.homeTeam}
                              </span>
                            </div>

                            {/* Center Status & Clock time matching screenshot "20:00 Today" */}
                            <div className="px-4 flex flex-col justify-center items-center shrink-0 min-w-[120px] sm:min-w-[160px]">
                              <span className="font-mono text-xl sm:text-2xl font-black text-white tracking-widest block font-sans">
                                {activeMatch?.time || '20:00'}
                              </span>
                              <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-900/60 font-mono text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest mt-2 block shadow-sm select-none">
                                {activeMatch?.status || 'Today'}
                              </span>
                            </div>

                            {/* Right Team (South Africa style layout) */}
                            <div className="flex-1 min-w-0 flex flex-col items-center gap-3.5">
                              <div className="w-16 h-16 rounded-full bg-[#121A30]/60 border-2 border-slate-800 flex items-center justify-center text-3xl shadow-xl transition-transform hover:scale-105 duration-300 relative overflow-hidden">
                                <div className="absolute inset-0 bg-yellow-500/5"></div>
                                <span className="relative z-10 select-none">{activeMatch?.awayLogo}</span>
                              </div>
                              <span className="font-extrabold text-white text-xs sm:text-sm tracking-wide block uppercase truncate">
                                {activeMatch?.awayTeam}
                              </span>
                            </div>

                          </div>

                          {/* Sub Scoreboard Info, Line-ups, Table, H2H navigation bars */}
                          <div className="flex border-t border-slate-900 bg-[#0B0F19] text-xs font-bold leading-none select-none scrollbar-none overflow-x-auto">
                            {([
                              { id: 'info', label: 'Info' },
                              { id: 'lineups', label: 'Line-ups' },
                              { id: 'table', label: 'Table' },
                              { id: 'h2h', label: 'H2H' }
                            ] as const).map((tab) => {
                              const isActiv = matchActiveTab === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  onClick={() => setMatchActiveTab(tab.id)}
                                  className={`flex-1 text-center py-4 border-b-2 font-black uppercase tracking-wider transition-all duration-150 min-w-[70px] whitespace-nowrap px-4 ${
                                    isActiv
                                      ? 'border-white text-white bg-slate-900/30'
                                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10'
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              );
                            })}
                          </div>

                        </div>

                        {/* Interactive Banner: Win with your favorite team! styled like mock 1xBet */}
                        {!isBannerDismissed && (
                          <div className="bg-[#121A2E] border border-blue-500/15 p-4 rounded-xl relative flex items-center gap-4 text-left shadow-lg overflow-hidden select-none animate-fade-in group">
                            {/* Blue Accent background light effect */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_60%)]"></div>
                            
                            {/* 1X bet styled logo container */}
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center font-black italic tracking-tighter text-white shrink-0 text-sm shadow-md shadow-blue-500/10 border border-blue-400/20">
                              1X
                            </div>

                            <div className="flex-1 min-w-0 relative z-10">
                              <span className="text-white font-extrabold text-[12px] sm:text-xs block leading-tight">
                                Win with your favorite team!
                              </span>
                              <span className="text-[10px] text-[#93C5FD] block mt-0.5 font-sans leading-normal">
                                Make your predictions and pick a winner! Play on soccer coupons with FastPool verification codes.
                              </span>
                              <span className="text-[9px] text-[#A78BFA] font-mono mt-1 font-bold block select-none uppercase tracking-wider">
                                Bet sasa! • 105% Multi-Coupon Bonus Active
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                setIsBannerDismissed(true);
                                triggerToast('Promotional advisory closed.', 'info');
                              }}
                              className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-950/20 hover:bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Orange strip banner block */}
                        <div className="h-2.5 bg-gradient-to-r from-orange-400 via-orange-500 to-red-600 rounded-full w-full select-none shadow"></div>

                        {/* Active tab content viewport details */}
                        <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-xl text-left select-text">
                          
                          {/* TAB 1: INFO DIRECTORY (Matches Referee, Stadium details, PLUS central pool codes) */}
                          {matchActiveTab === 'info' && (
                            <div className="space-y-5 animate-fade-in">
                              
                              <div>
                                <span className="text-xs font-mono font-black uppercase text-slate-400 block tracking-widest mb-3">
                                  MATCH INFO
                                </span>
                                
                                <div className="p-4 bg-[#060810]/50 rounded-xl border border-slate-850 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-[11px] text-slate-300">
                                  
                                  {/* Date element */}
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-[#111827] border border-slate-800 flex items-center justify-center shrink-0">
                                      <Calendar className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="truncate">
                                      <span className="text-slate-500 text-[9px] block uppercase font-bold">MATCH DATE</span>
                                      <span className="font-bold text-slate-200 block mt-0.5">{activeMatch?.date || '11 Jun 2026'}</span>
                                    </div>
                                  </div>

                                  {/* Referee element */}
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-[#111827] border border-slate-800 flex items-center justify-center shrink-0">
                                      <Activity className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="truncate">
                                      <span className="text-slate-500 text-[9px] block uppercase font-bold">MATCH REFEREE</span>
                                      <span className="font-bold text-slate-200 block mt-0.5">{activeMatch?.referee || 'Wilton Sampaio (Brazil)'}</span>
                                    </div>
                                  </div>

                                  {/* Venue elements */}
                                  <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-1">
                                    <div className="w-8 h-8 rounded bg-[#111827] border border-slate-800 flex items-center justify-center shrink-0">
                                      <Compass className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="truncate">
                                      <span className="text-slate-500 text-[9px] block uppercase font-bold">MATCH VENUE</span>
                                      <span className="font-bold text-slate-200 block mt-0.5">{activeMatch?.venue || 'Estadio Azteca (Mexico City)'}</span>
                                    </div>
                                  </div>

                                </div>
                              </div>

                              {/* Pool coupon decryption panel inside Info tab */}
                              <div className="border-t border-slate-800/80 pt-4">
                                <div className="flex items-center justify-between mb-3.5">
                                  <div>
                                    <span className="text-xs font-mono font-black uppercase text-emerald-450 block tracking-widest">
                                      🔒 Verification Decryptor Panel
                                    </span>
                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                      RSA-encrypted verified coupon drawn indicators
                                    </p>
                                  </div>
                                  {associatedCode && isCodeUnlocked && (
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(associatedCode.codes_content);
                                        triggerToast('Pool codes copied to clipboard!', 'success');
                                      }}
                                      className="text-[9.5px] text-emerald-400 hover:text-emerald-300 font-mono font-black flex items-center gap-1 bg-emerald-950/60 border border-emerald-900/50 px-2 py-1 rounded transition-all"
                                    >
                                      <Copy className="w-3 h-3" /> COPY KEY
                                    </button>
                                  )}
                                </div>

                                {associatedCode ? (
                                  <div>
                                    {isLocked ? (
                                      <div className="p-6 bg-[#060810]/80 border border-amber-900/40 rounded-xl text-center flex flex-col items-center gap-2">
                                        <Lock className="w-7 h-7 text-amber-500 stroke-[2.5]" />
                                        <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest font-mono">Premium Forecast Codes Locked</span>
                                        <p className="text-[11px] text-slate-400 max-w-sm mt-0.5 font-sans leading-relaxed">
                                          {activePlan?.id === 'plan-free' ? (
                                            `This is a premium high-odds coupon validation indicator sheet. Revealing is locked to VIP Arena members on the active ${associatedCode.access_level} plan.`
                                          ) : (
                                            `This premium codesheet is locked because you do not have the ${bookmakerSlug.toUpperCase()} bookmaker component enabled in your active subscription. Please configure your components in the subscription page.`
                                          )}
                                        </p>
                                        <button
                                          onClick={() => {
                                            setActiveSubTab('subscription');
                                            triggerToast(activePlan?.id === 'plan-free' ? 'Choose an upgrade plan to reveal premium sheets!' : 'Configure your subscribed components!', 'info');
                                          }}
                                          className="mt-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs px-5 py-2 rounded-xl transition shadow-md shadow-amber-500/10 uppercase"
                                        >
                                          {activePlan?.id === 'plan-free' ? 'Upgrade Membership Plan' : 'Manage Subscribed Components'}
                                        </button>
                                      </div>
                                    ) : isCodeUnlocked ? (
                                      <div className="space-y-3">
                                        {/* Decoder indicators box */}
                                        <div className="bg-[#03060C] border border-[#0B1E28]/60 p-4 rounded-xl font-mono text-[11.5px] leading-relaxed block relative select-text border-l-4 border-l-emerald-500">
                                          <div className="text-[8px] text-slate-500 uppercase font-black mb-1.5 pb-1 border-b border-slate-850/60 font-mono tracking-widest">
                                            ✓ {activeMatch?.bookmaker || 'BET9JA'} VERIFIED POOL SEQUENCE DETAILS ({activeMatch?.week || 'Week 49'})
                                          </div>
                                          <div className="text-emerald-400 select-text font-medium font-sans whitespace-pre-wrap leading-relaxed">
                                            {associatedCode.codes_content}
                                          </div>
                                        </div>

                                        {/* Perm indicators key figures */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                          <div className="p-3 bg-slate-900/30 border border-slate-800/60 rounded-xl text-left">
                                            <span className="text-[8.5px] text-slate-500 font-mono font-bold uppercase tracking-wider block">VERIFICATION KEY</span>
                                            <span className="text-xs text-slate-100 font-mono font-black mt-1 block">A365-LNK-{associatedCode.id.toUpperCase()}</span>
                                          </div>
                                          <div className="p-3 bg-slate-900/30 border border-slate-800/60 rounded-xl text-left">
                                            <span className="text-[8.5px] text-slate-500 font-mono font-bold uppercase tracking-wider block">ACCESSED LEVEL</span>
                                            <span className="text-xs text-emerald-400 font-mono font-black mt-1 block uppercase">✓ FREE PUBLIC USE PASS</span>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-6 bg-[#060810]/80 border border-slate-800 rounded-xl text-center flex flex-col items-center gap-2">
                                        <Unlock className="w-7 h-7 text-emerald-500 stroke-[2.5]" />
                                        <span className="text-xs font-extrabold text-slate-350 uppercase tracking-widest font-mono">Unlock Indicators Key Block</span>
                                        <p className="text-[11px] text-slate-500 max-w-sm mt-0.5">
                                          Please decrypt to register validation token and reveal codes sheet.
                                        </p>
                                        <button
                                          onClick={() => {
                                            handleDownloadCode(associatedCode);
                                            triggerToast('Registering token...', 'info');
                                          }}
                                          className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2 rounded-xl transition uppercase shadow-md shadow-emerald-555/15 flex items-center gap-1.5"
                                        >
                                          <Unlock className="w-3.5 h-3.5" />
                                          <span>Decrypt Match Codes</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-4 bg-[#060810]/60 border border-slate-800 rounded-xl text-center text-slate-400 text-xs font-mono select-none">
                                    No custom code sheet attached to this live scoreboard match fixture. Defaulting to free public decrypt rules.
                                  </div>
                                )}
                              </div>

                            </div>
                          )}

                          {/* TAB 2: LINEUPS (Tactical football field rendering) */}
                          {matchActiveTab === 'lineups' && (
                            <div className="space-y-4 animate-fade-in text-center">
                              <span className="text-xs font-mono font-black uppercase text-slate-400 block tracking-widest mb-1">
                                TACTICAL FIELD FORMATIONS
                              </span>
                              
                              <div className="grid grid-cols-2 gap-4 font-mono text-[10.5px] text-slate-400 mb-4 bg-[#060810]/40 p-3 rounded-lg border border-slate-850">
                                <div>
                                  <span className="text-white block font-black uppercase">{activeMatch?.homeTeam} Formation</span>
                                  <span className="text-emerald-450 font-black block mt-1">4-3-3 Attacking</span>
                                </div>
                                <div className="border-l border-slate-800">
                                  <span className="text-white block font-black uppercase">{activeMatch?.awayTeam} Formation</span>
                                  <span className="text-[#A78BFA] font-black block mt-1">4-2-3-1 Defensive</span>
                                </div>
                              </div>

                              {/* Canvas Pitch Graphic */}
                              <div className="w-full h-80 bg-gradient-to-b from-emerald-950 via-emerald-900 to-[#122A1E] rounded-xl border border-emerald-800/50 p-4 relative flex flex-col justify-between overflow-hidden shadow-inner">
                                {/* Grid field lines */}
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b border-white/10 w-full z-0"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border border-white/10 rounded-full z-0"></div>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-14 border border-white/10 rounded-b-lg z-0"></div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-14 border-t border-x border-white/10 rounded-t-lg z-0"></div>

                                {/* Home Team on Top Field */}
                                <div className="relative z-10 flex flex-col gap-4">
                                  {/* Forwards */}
                                  <div className="flex justify-around px-8 mt-2">
                                    <div className="flex flex-col items-center">
                                      <div className="w-6 h-6 rounded-full bg-emerald-600 border border-white text-white flex items-center justify-center text-[10px] font-black">11</div>
                                      <span className="text-[9px] text-white/80 font-mono font-bold mt-1 shadow-sm">L. Lozano</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <div className="w-6 h-6 rounded-full bg-emerald-600 border border-white text-white flex items-center justify-center text-[10px] font-black">9</div>
                                      <span className="text-[9px] text-white/80 font-mono font-bold mt-1 shadow-sm">R. Jimenez</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <div className="w-6 h-6 rounded-full bg-emerald-600 border border-white text-white flex items-center justify-center text-[10px] font-black">17</div>
                                      <span className="text-[9px] text-white/80 font-mono font-bold mt-1 shadow-sm">H. Martin</span>
                                    </div>
                                  </div>

                                  {/* Midfielders */}
                                  <div className="flex justify-around px-12">
                                    <div className="flex flex-col items-center">
                                      <div className="w-6 h-6 rounded-full bg-emerald-700/80 border border-white/50 text-white flex items-center justify-center text-[10px]">8</div>
                                      <span className="text-[9px] text-white/70 font-mono mt-1">E. Alvarez</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <div className="w-6 h-6 rounded-full bg-emerald-700/80 border border-white/50 text-white flex items-center justify-center text-[10px]">10</div>
                                      <span className="text-[9px] text-white/70 font-mono mt-1">L. Chavez</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <div className="w-6 h-6 rounded-full bg-emerald-700/80 border border-white/50 text-white flex items-center justify-center text-[10px]">6</div>
                                      <span className="text-[9px] text-white/70 font-mono mt-1">E. Sanchez</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Away Team on Bottom Field */}
                                <div className="relative z-10 flex flex-col-reverse gap-4">
                                  {/* Defenders */}
                                  <div className="flex justify-around px-6 mb-2">
                                    <div className="flex flex-col items-center">
                                      <div className="w-6 h-6 rounded-full bg-[#1e293b] border border-[#a78bfa] text-white flex items-center justify-center text-[10px] font-black">2</div>
                                      <span className="text-[9px] text-white/80 font-mono font-bold mt-1 shadow-sm">S. Mobara</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <div className="w-6 h-6 rounded-full bg-[#1e293b] border border-[#a78bfa] text-white flex items-center justify-center text-[10px] font-black">4</div>
                                      <span className="text-[9px] text-white/80 font-mono font-bold mt-1 shadow-sm">M. Mvala</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <div className="w-6 h-6 rounded-full bg-[#1e293b] border border-[#a78bfa] text-white flex items-center justify-center text-[10px] font-black">5</div>
                                      <span className="text-[9px] text-white/80 font-mono font-bold mt-1 shadow-sm font-sans">A. Modiba</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <div className="w-6 h-6 rounded-full bg-[#1e293b] border border-[#a78bfa] text-white flex items-center justify-center text-[10px] font-black">20</div>
                                      <span className="text-[9px] text-white/80 font-mono font-bold mt-1 shadow-sm">K. Mudau</span>
                                    </div>
                                  </div>

                                  {/* Midfield Anchor */}
                                  <div className="flex justify-around px-16">
                                    <div className="flex flex-col items-center">
                                      <div className="w-6 h-6 rounded-full bg-slate-800/80 border border-slate-700 text-white flex items-center justify-center text-[10px]">14</div>
                                      <span className="text-[9px] text-slate-400 font-mono mt-1">T. Mokoena</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <div className="w-6 h-6 rounded-full bg-slate-800/80 border border-slate-700 text-white flex items-center justify-center text-[10px]">15</div>
                                      <span className="text-[9px] text-slate-400 font-mono mt-1">S. Sithole</span>
                                    </div>
                                  </div>
                                </div>

                              </div>
                              <p className="text-[10px] text-slate-500 font-mono italic mt-1 text-center">
                                Real-time dynamic lineup data synced directly with the respective team rosters.
                              </p>
                            </div>
                          )}

                          {/* TAB 3: TABLE (League standings standings metrics) */}
                          {matchActiveTab === 'table' && (() => {
                            const standingsData = [
                              { pos: 1, team: 'Mexico 🇲🇽', mp: 12, w: 7, d: 4, l: 1, dr: '33%', pts: 25 },
                              { pos: 2, team: 'South Africa 🇿🇦', mp: 12, w: 6, d: 5, l: 1, dr: '41.6%', pts: 23, highlighted: true },
                              { pos: 3, team: 'Nigeria 🇳🇬', mp: 12, w: 5, d: 5, l: 2, dr: '41.6%', pts: 20 },
                              { pos: 4, team: 'Ivory Coast 🇨🇮', mp: 12, w: 4, d: 4, l: 4, dr: '33.3%', pts: 16 },
                              { pos: 5, team: 'Cameroon 🇨🇲', mp: 12, w: 3, d: 6, l: 3, dr: '50.0%', pts: 15 }
                            ];

                            const filteredStandings = standingsData.filter(row => {
                              if (!standingsSearchQuery) return true;
                              const s = standingsSearchQuery.toLowerCase();
                              return row.team.toLowerCase().includes(s) || row.dr.toLowerCase().includes(s);
                            });

                            return (
                              <div className="space-y-4 animate-fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <span className="text-xs font-mono font-black uppercase text-slate-400 block tracking-widest">
                                    STANDINGS & DRAW RATIO STATISTICS
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      placeholder="Filter team..."
                                      value={standingsSearchQuery}
                                      onChange={(e) => setStandingsSearchQuery(e.target.value)}
                                      className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[10px] text-white focus:outline-none focus:border-emerald-500 transition font-mono w-40"
                                    />
                                    {standingsSearchQuery && (
                                      <button onClick={() => setStandingsSearchQuery('')} className="text-[10px] text-slate-400 hover:text-white uppercase font-mono mr-1">
                                        Clear
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        const headers = ['Pos', 'Team', 'MP', 'Wins', 'Draws', 'Loss', 'Dr% Ratio', 'PTS'];
                                        const rows = filteredStandings.map(row => [
                                          String(row.pos),
                                          row.team,
                                          String(row.mp),
                                          String(row.w),
                                          String(row.d),
                                          String(row.l),
                                          row.dr,
                                          String(row.pts)
                                        ]);
                                        printTable('Standings and Draw Ratio Statistics', headers, rows);
                                      }}
                                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded cursor-pointer transition font-mono shrink-0 flex items-center gap-1 shadow shadow-emerald-500/10"
                                    >
                                      <span>📄 Download PDF</span>
                                    </button>
                                  </div>
                                </div>

                                <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-[#060810]/30">
                                  <table className="w-full text-left font-mono text-[11px] divide-y divide-slate-800">
                                    <thead className="bg-[#121827]/80 text-slate-400 font-extrabold uppercase text-[9.5px]">
                                      <tr>
                                        <th className="p-3 text-center">Pos</th>
                                        <th className="p-3">Team</th>
                                        <th className="p-3 text-center">MP</th>
                                        <th className="p-3 text-center">Wins</th>
                                        <th className="p-3 text-center">Draws</th>
                                        <th className="p-3 text-center">Loss</th>
                                        <th className="p-3 text-[#10B981] text-center">Dr% Ratio</th>
                                        <th className="p-3 text-center">PTS</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-850/80">
                                      {filteredStandings.map((row) => (
                                        <tr
                                          key={row.pos}
                                          className={`hover:bg-slate-900/30 ${
                                            row.highlighted ? 'bg-emerald-950/10 border-emerald-900/10' : ''
                                          }`}
                                        >
                                          <td className="p-3 text-center text-slate-500 font-black">{row.pos}</td>
                                          <td className="p-3 font-bold text-slate-200">{row.team}</td>
                                          <td className="p-3 text-center text-slate-400">{row.mp}</td>
                                          <td className="p-3 text-center text-slate-400">{row.w}</td>
                                          <td className="p-3 text-center text-slate-400">{row.d}</td>
                                          <td className="p-3 text-center text-slate-400">{row.l}</td>
                                          <td className="p-3 text-center font-black text-emerald-400">{row.dr}</td>
                                          <td className="p-3 text-center text-slate-100 font-bold">{row.pts}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono italic">
                                  *Dr% represents the pool draw frequency. Higher frequency matches are premium targets for soccer coupon perms.
                                </p>
                              </div>
                            );
                          })()}

                          {/* TAB 4: H2H (Historical meets) */}
                          {matchActiveTab === 'h2h' && (
                            <div className="space-y-4 animate-fade-in">
                              <span className="text-xs font-mono font-black uppercase text-slate-400 block tracking-widest">
                                HEAD TO HEAD HISTORICAL ANALYSIS
                              </span>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3.5 bg-slate-900/20 border border-slate-800 rounded-xl text-left">
                                  <span className="text-[10px] text-slate-500 font-mono font-bold block uppercase tracking-wider">LCR DRAW PROBABILITY</span>
                                  <span className="text-2xl font-mono text-emerald-400 font-black block mt-1.5">65.8%</span>
                                  <p className="text-[9.5px] text-slate-450 font-sans mt-1 leading-normal">
                                    Highly correlated draw sequence verified. Excellent candidate for Aussie draw-perming checklist combinations.
                                  </p>
                                </div>
                                <div className="p-3.5 bg-slate-900/20 border border-slate-800 rounded-xl text-left">
                                  <span className="text-[10px] text-slate-500 font-mono font-bold block uppercase tracking-wider">MUTUAL HISTORY</span>
                                  <span className="text-xs text-white font-mono font-black mt-2 block">TOTAL MATCHES PLAYED: 5</span>
                                  <div className="flex flex-col gap-1 mt-1 font-mono text-[10px] text-slate-400">
                                    <span className="flex justify-between"><span>Mexico Wins:</span> <span className="font-bold text-slate-300">1</span></span>
                                    <span className="flex justify-between"><span>South Africa Wins:</span> <span className="font-bold text-slate-300">1</span></span>
                                    <span className="flex justify-between text-emerald-400 font-bold"><span>Draws Recorded:</span> <span>3 (60.0%)</span></span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">PREVIOUS MEETING SCORES</span>
                                <div className="space-y-1.5">
                                  {[
                                    { date: '18 Nov 2024', home: 'South Africa', away: 'Mexico', score: '2 - 2', outcome: 'DRAW' },
                                    { date: '14 Jun 2022', home: 'Mexico', away: 'South Africa', score: '1 - 1', outcome: 'DRAW' },
                                    { date: '10 Oct 2021', home: 'Mexico', away: 'South Africa', score: '1 - 0', outcome: 'MEXICO WIN' },
                                    { date: '11 Jun 2010', home: 'South Africa', away: 'Mexico', score: '1 - 1', outcome: 'DRAW' }
                                  ].map((meet, idx) => (
                                    <div key={idx} className="p-2.5 rounded-lg bg-[#060810]/35 border border-slate-850 flex items-center justify-between text-[11px] font-mono font-bold">
                                      <span className="text-slate-550 font-normal select-none">{meet.date}</span>
                                      <span className="text-slate-200">{meet.home} {meet.score} {meet.away}</span>
                                      <span className={`text-[9.5px] px-2 py-0.2 rounded font-black ${
                                        meet.outcome === 'DRAW' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                                      }`}>
                                        {meet.outcome}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          )}

                        </div>

                      </div>

                    </div>

                  </div>
                );
              })()}

              {/* SUBTAB: POOL CODES (INTERNATIONAL) */}
              {false && (() => {
                const activeIntl = intlCodes.find(c => c.id === selectedIntlId) || intlCodes[0];

                return (
                  <div className="flex flex-col gap-6" id="intl-codes-arena">
                    {/* Header title mimicking screenshot style */}
                    <div className="border-b border-slate-800 pb-4 mb-2">
                       <h2 className="text-xl font-extrabold tracking-wider text-slate-100 font-mono uppercase">
                        AUSSIE CODES
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
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121B2E]/20 border border-slate-800 p-3.5 rounded-xl">
                                <div className="space-y-1">
                                  <div className="text-xs text-slate-200 font-bold font-mono">
                                    Comparing relative 1X2 coupon multiplier weights across premium betting agencies.
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    Use the search input to filter matches by team name, number, or odds value.
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="text-[10px] bg-emerald-950/60 border border-emerald-900 text-emerald-400 font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                    HIGHEST ODDS HIGHLIGHTED
                                  </span>
                                </div>
                              </div>

                              {/* Search and Export Row */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/10 border border-slate-850 p-3 rounded-lg">
                                <div className="flex flex-1 items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Search matrix team, match number, odds..."
                                    value={matrixSearchQuery}
                                    onChange={(e) => setMatrixSearchQuery(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono w-full sm:max-w-xs"
                                  />
                                  {matrixSearchQuery && (
                                    <button 
                                      onClick={() => setMatrixSearchQuery('')} 
                                      className="text-xs text-slate-400 hover:text-white uppercase font-mono px-1"
                                    >
                                      Clear
                                    </button>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    const baseData = activeIntl.oddsData || [];
                                    const filtered = baseData.filter((m: any) => {
                                      if (!matrixSearchQuery) return true;
                                      const s = matrixSearchQuery.toLowerCase();
                                      return (
                                        m.teams?.toLowerCase().includes(s) ||
                                        m.matchNo?.toString().includes(s) ||
                                        m.bet9ja?.toString().includes(s) ||
                                        m.betking?.toString().includes(s) ||
                                        m.sportybet?.toString().includes(s) ||
                                        m.msport?.toString().includes(s) ||
                                        m.oneXbet?.toString().includes(s)
                                      );
                                    });

                                    const headers = ['Match No', 'Fixture Teams', 'Bet9ja', 'BetKing', 'SportyBet', 'MSport', '1xBet'];
                                    const rows = filtered.map((m: any) => [
                                      String(m.matchNo),
                                      m.teams,
                                      String(m.bet9ja),
                                      String(m.betking),
                                      String(m.sportybet),
                                      String(m.msport),
                                      String(m.oneXbet)
                                    ]);
                                    printTable(`Odds Comparison Week ${activeIntl.week_number}`, headers, rows);
                                  }}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer transition font-mono shrink-0 flex items-center justify-center gap-1.5 shadow shadow-emerald-500/10"
                                >
                                  <span>📄 Download PDF</span>
                                </button>
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
                                    {(() => {
                                      const baseData = activeIntl.oddsData || [];
                                      const filtered = baseData.filter((m: any) => {
                                        if (!matrixSearchQuery) return true;
                                        const s = matrixSearchQuery.toLowerCase();
                                        return (
                                          m.teams?.toLowerCase().includes(s) ||
                                          m.matchNo?.toString().includes(s) ||
                                          m.bet9ja?.toString().includes(s) ||
                                          m.betking?.toString().includes(s) ||
                                          m.sportybet?.toString().includes(s) ||
                                          m.msport?.toString().includes(s) ||
                                          m.oneXbet?.toString().includes(s)
                                        );
                                      });

                                      return filtered.map((match) => (
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
                                      ));
                                    })()}
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
                                    {activeIntl.codeDetails?.keyNumbers.map((num, idx) => (
                                      <span 
                                        key={`key_num_${idx}_${num}`}
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

              {/* SUBTAB: LIVE MATCH CAST */}
              {activeSubTab === 'streaming' && (
                <div className="flex flex-col gap-6" id="live-matchcast-arena">
                  {/* Header title */}
                  <div className="border-b border-slate-800 pb-4 mb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold tracking-wider text-slate-100 font-mono uppercase">
                        AI LIVE REAL-TIME SCORES
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Web-grounded live updates synced via Gemini AI and Real-time Web Search every 30 seconds.
                      </p>
                    </div>

                    {/* Quick Trigger Force Refresh */}
                    <button
                      onClick={handleForceUpdateScores}
                      disabled={isRefreshingLiveScores}
                      className="flex items-center gap-2 bg-[#10B981] hover:bg-emerald-600 disabled:bg-emerald-950 disabled:text-slate-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs tracking-wider transition-all cursor-pointer shadow-md uppercase font-mono"
                    >
                      <Activity className={`w-3.5 h-3.5 ${isRefreshingLiveScores ? 'animate-spin' : ''}`} />
                      {isRefreshingLiveScores ? 'Searching Web...' : 'FORCE AI REFRESH NOW'}
                    </button>
                  </div>

                  {/* ADMIN CONTROL TOWER PANEL */}
                  {currentUser.role === 'admin' && (
                    <div className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <h3 className="text-xs font-mono font-black uppercase text-emerald-400 tracking-widest">
                            ADMIN LIVE TRACKER CONTROL TOWER
                          </h3>
                        </div>
                        <span className="text-[10px] bg-slate-800 text-slate-350 px-2.5 py-0.5 rounded font-mono font-bold">
                          Total: {liveScoresData.length} games tracked
                        </span>
                      </div>

                      {/* Add Match Form */}
                      <form onSubmit={handleAddMatch} className="flex flex-col gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="flex flex-col gap-1.5 col-span-1 text-left">
                            <label className="text-[10px] font-mono font-bold text-slate-350 uppercase tracking-wider">
                              Home Team Name
                            </label>
                            <input
                              type="text"
                              value={homeTeam}
                              onChange={(e) => setHomeTeam(e.target.value)}
                              placeholder="e.g. Manchester City"
                              className="bg-slate-950 border border-slate-850 focus:border-emerald-500 outline-none rounded-lg px-3 py-2 text-xs text-white"
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-1.5 col-span-1 text-left">
                            <label className="text-[10px] font-mono font-bold text-slate-350 uppercase tracking-wider">
                              Away Team Name
                            </label>
                            <input
                              type="text"
                              value={awayTeam}
                              onChange={(e) => setAwayTeam(e.target.value)}
                              placeholder="e.g. Chelsea"
                              className="bg-slate-950 border border-slate-850 focus:border-emerald-500 outline-none rounded-lg px-3 py-2 text-xs text-white"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 col-span-1 text-left">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-mono font-bold text-slate-350 uppercase tracking-wider">
                                Home Score
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={homeScore}
                                onChange={(e) => setHomeScore(Number(e.target.value) || 0)}
                                className="bg-slate-950 border border-slate-850 focus:border-emerald-500 outline-none rounded-lg px-3 py-2 text-xs text-white text-center font-mono font-bold"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-mono font-bold text-slate-350 uppercase tracking-wider">
                                Away Score
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={awayScore}
                                onChange={(e) => setAwayScore(Number(e.target.value) || 0)}
                                className="bg-slate-950 border border-slate-850 focus:border-emerald-500 outline-none rounded-lg px-3 py-2 text-xs text-white text-center font-mono font-bold"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 col-span-1 text-left">
                            <label className="text-[10px] font-mono font-bold text-slate-350 uppercase tracking-wider">
                              Initial Status
                            </label>
                            <div className="flex gap-2">
                              <select
                                value={newMatchStatus}
                                onChange={(e) => setNewMatchStatus(e.target.value)}
                                className="bg-slate-950 border border-slate-850 focus:border-emerald-500 outline-none rounded-lg px-3 py-2 text-xs text-white flex-1"
                              >
                                <option value="not_started">Not Started</option>
                                <option value="live">Live Now</option>
                                <option value="finished">Finished</option>
                                <option value="postponed">Postponed</option>
                              </select>
                              <button
                                type="submit"
                                disabled={isSubmittingMatch}
                                className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-xs font-black uppercase px-4 py-2 rounded-lg transition font-mono cursor-pointer disabled:bg-slate-800 shadow"
                              >
                                ADD
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>

                      {/* Display live server-side task logs */}
                      <div className="w-full bg-slate-950 rounded-lg p-3 border border-slate-850">
                        <span className="text-[10px] font-mono font-bold text-[#FA3E65] uppercase block mb-1">
                          SYSTEM POLLING LOGS (60s cron interval)
                        </span>
                        <div className="max-h-24 overflow-y-auto text-[10px] font-mono text-slate-400 space-y-1 pr-2 scrollbar-thin">
                          {liveLogData.length === 0 ? (
                            <div className="text-slate-500 italic">No logs recorded yet. Polling starting in 1 minute...</div>
                          ) : (
                            liveLogData.map((log, idx) => (
                              <div key={idx} className="flex gap-2 border-b border-slate-900 pb-0.5 whitespace-pre-wrap text-left">
                                <span className="text-[#10B981] min-w-[70px] select-none">↳ [SYSTEM]</span>
                                <span className="text-slate-300">{log}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* REALSCORES BOARD TABLE */}
                  <div className="w-full bg-[#111827] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col gap-4 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs font-mono font-black uppercase text-slate-200 tracking-widest">
                          TRACKED MATCHES SCOREBOARD
                        </h3>
                      </div>
                      {isCheckingLive && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                          <span>AI Grounding Deep Search Active...</span>
                        </div>
                      )}
                    </div>

                    {/* Search and Export Bar */}
                    {liveScoresData.length > 0 && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/10 border border-slate-850 p-3 rounded-lg">
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            type="text"
                            placeholder="Filter scoreboard by team or status..."
                            value={trackedMatchesSearch}
                            onChange={(e) => setTrackedMatchesSearch(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono w-full sm:max-w-xs"
                          />
                          {trackedMatchesSearch && (
                            <button 
                              onClick={() => setTrackedMatchesSearch('')} 
                              className="text-xs text-slate-400 hover:text-white uppercase font-mono px-1"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const filtered = liveScoresData.filter((match: any) => {
                              if (!trackedMatchesSearch) return true;
                              const s = trackedMatchesSearch.toLowerCase();
                              return (
                                match.fixture?.toLowerCase().includes(s) ||
                                match.status?.toLowerCase().includes(s) ||
                                match.score?.toLowerCase().includes(s)
                              );
                            });

                            const headers = ['Fixture / Game', 'Score', 'Status'];
                            const rows = filtered.map((match: any) => [
                              match.fixture,
                              match.score,
                              match.status
                            ]);
                            printTable('Tracked Matches Scoreboard', headers, rows);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer transition font-mono shrink-0 flex items-center justify-center gap-1.5 shadow shadow-emerald-500/10"
                        >
                          <span>📄 Download PDF</span>
                        </button>
                      </div>
                    )}

                    {liveScoresData.length === 0 ? (
                      <div className="py-12 text-center rounded-lg border border-dashed border-slate-800 bg-slate-900/10">
                        <Tv className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-60" />
                        <h4 className="text-sm font-bold text-slate-350">No games currently tracked</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-snug">
                          {currentUser.role === 'admin' 
                            ? 'Use the Control Tower above to enter names of matches you want to live-track.' 
                            : 'An admin has not initiated any live trackers yet. Check back during fixture weekends!'}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto min-w-full">
                        <table className="min-w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-850 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                              <th className="py-3 px-4 font-bold">Game / Fixture</th>
                              <th className="py-3 px-4 font-bold text-center">Score</th>
                              <th className="py-3 px-4 font-bold text-center">Status</th>
                              {currentUser.role === 'admin' && <th className="py-3 px-4 font-bold text-right">Action</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                            {(() => {
                              const filtered = liveScoresData.filter((match: any) => {
                                if (!trackedMatchesSearch) return true;
                                const s = trackedMatchesSearch.toLowerCase();
                                return (
                                  match.fixture?.toLowerCase().includes(s) ||
                                  match.status?.toLowerCase().includes(s) ||
                                  match.score?.toLowerCase().includes(s)
                                );
                              });

                              return filtered.map((match: any, idx: number) => {
                                const isLiveStatus = match.status === 'live';
                                const isFinished = match.status === 'finished';
                                const isPostponed = match.status === 'postponed';

                                return (
                                  <tr key={`tracked_match_${idx}_${match.id || ''}`} className="hover:bg-slate-900/40 transition">
                                  <td className="py-3.5 px-4 font-semibold font-sans text-slate-100">
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-400">🥅</span>
                                      <span>{match.fixture}</span>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 text-center font-mono font-bold">
                                    <span className={`px-2.5 py-1 rounded text-sm ${
                                      isLiveStatus 
                                        ? 'bg-[#FA3E65]/15 text-[#FA3E65] border border-[#FA3E65]/30 shadow-sm animate-pulse' 
                                        : isFinished 
                                          ? 'bg-slate-850 text-slate-400 border border-slate-800' 
                                          : 'bg-slate-950 text-slate-500 border border-slate-900'
                                    }`}>
                                      {match.score}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-center">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-black tracking-widest ${
                                      isLiveStatus 
                                        ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-900/40' 
                                        : isFinished 
                                          ? 'bg-slate-850 text-slate-400' 
                                          : isPostponed
                                            ? 'bg-amber-950/60 text-amber-500 border border-amber-900/30'
                                            : 'bg-slate-900/40 text-slate-500'
                                    }`}>
                                      {isLiveStatus ? (
                                        <>
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                          <span>LIVE</span>
                                        </>
                                      ) : isFinished ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-400" />
                                          <span>FT</span>
                                        </>
                                      ) : isPostponed ? (
                                        <span>PPD</span>
                                      ) : (
                                        <span>NOT STARTED</span>
                                      )}
                                    </span>
                                  </td>
                                  {currentUser.role === 'admin' && (
                                    <td className="py-3.5 px-4 text-right">
                                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                        {!isLiveStatus && (
                                          <button
                                            onClick={() => handleUpdateMatchStatus(match.id, 'live', '0 - 0')}
                                            className="text-[10px] font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 px-2 py-1 rounded-md border border-emerald-500/20 cursor-pointer transition-all"
                                            title="Restart match simulation as live"
                                          >
                                            Start Live
                                          </button>
                                        )}
                                        {isLiveStatus && (
                                          <>
                                            <button
                                              onClick={() => handleUpdateMatchStatus(match.id, 'finished')}
                                              className="text-[10px] font-black uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-md border border-slate-700 cursor-pointer transition-all"
                                              title="End match to FT"
                                            >
                                              End (FT)
                                            </button>
                                            <button
                                              onClick={() => handleUpdateMatchStatus(match.id, 'postponed')}
                                              className="text-[10px] font-black uppercase tracking-wider text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 px-2 py-1 rounded-md border border-amber-500/20 cursor-pointer transition-all"
                                              title="Postpone match"
                                            >
                                              Postpone
                                            </button>
                                          </>
                                        )}
                                        <button
                                          onClick={() => handleDeleteMatch(match.id)}
                                          className="text-[#FA3E65] hover:text-[#E11D48] hover:bg-[#FA3E65]/10 p-1.5 rounded-md border border-transparent hover:border-[#FA3E65]/20 cursor-pointer inline-flex items-center justify-center transition-all"
                                          title="Delete live tracker"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                          })()}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Left: Interactive Broadcast Player Mockup */}
                  <div className="max-w-4xl mx-auto w-full">
                    <div className="w-full bg-[#111827] rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col gap-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#FA3E65] animate-ping shrink-0"></span>
                          <h3 className="text-xs font-black font-sans uppercase tracking-widest text-[#FA3E65] flex items-center gap-1.5">
                            LIVE STREAM BROADCAST PIPELINE
                          </h3>
                        </div>
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/30 uppercase font-bold">Secure Feed</span>
                      </div>

                      {/* Mock Player Screen */}
                      <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-6 text-center group shadow-inner">
                        {/* Static/interference grid animation effect */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,62,101,0.05)_0%,transparent_100%)] pointer-events-none"></div>
                        <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#fa3e65]/[0.01] to-transparent bg-[length:100%_4px] pointer-events-none opacity-40"></div>
                        
                        {/* Animated signal graphic */}
                        <div className="w-16 h-16 rounded-full bg-[#FA3E65]/10 border border-[#FA3E65]/30 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105 animate-pulse">
                          <Tv className="w-8 h-8 text-[#FA3E65]" />
                        </div>

                        <span className="bg-[#FA3E65]/15 text-[#FA3E65] text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full mb-2.5 border border-[#FA3E65]/25">
                          🔴 PIPELINE IN ASSEMBLY
                        </span>

                        <h4 className="text-white font-extrabold text-sm md:text-base max-w-md uppercase tracking-wide leading-tight">
                          Premium Matchcast Stream Server Coming Soon
                        </h4>

                        <p className="text-slate-400 text-xs mt-2 max-w-md leading-relaxed">
                          We are currently securing high-speed satellite feeds to stream UK and Aussie pool matches directly to active subscribers. Real-time draw verification will sync with your decrypter keys automatically.
                        </p>

                        {/* Interactive subscriber container inside player */}
                        <div className="mt-5 w-full max-w-sm bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-md">
                          {streamSubscribed ? (
                            <div className="flex flex-col items-center gap-1.5 py-1 text-emerald-400">
                              <span className="text-xs font-black uppercase tracking-wider">✓ Registered in Queue</span>
                              <span className="text-[10px] text-slate-400 font-medium font-sans">We will notify {streamAlertEmail} once the video stream server fires up.</span>
                            </div>
                          ) : (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!streamAlertEmail) {
                                  triggerToast('Please provide a valid email structure.', 'error');
                                  return;
                                }
                                setStreamSubscribed(true);
                                triggerToast(`Success! Enrolled "${streamAlertEmail}" in the Live Stream private beta queue.`, 'success');
                              }}
                              className="flex flex-col gap-2"
                            >
                              <label className="text-[10px] font-mono font-black text-slate-400 text-left uppercase pl-0.5">
                                Notify me on deployment
                              </label>
                              <div className="flex items-center gap-2">
                                <input 
                                  value={streamAlertEmail}
                                  onChange={(e) => setStreamAlertEmail(e.target.value)}
                                  placeholder="Forecasting email address..."
                                  type="email"
                                  className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 outline-hidden flex-1 font-sans"
                                />
                                <button 
                                  type="submit"
                                  className="bg-[#FA3E65] hover:bg-[#E11D48] active:scale-95 text-white text-xs font-black uppercase px-4 py-1.5 rounded transition font-sans cursor-pointer shadow"
                                >
                                  SUBSCRIBE
                                </button>
                              </div>
                            </form>
                          )}
                        </div>

                        {/* Technical telemetry metrics footer */}
                        <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between text-[8px] font-mono text-slate-500">
                          <span>SATELLITE: GE-23 / APSTAR-6</span>
                          <span>BANDWIDTH: PENDING ALLOCATION</span>
                          <span>ENCRYPTION: SHIELD-E8782</span>
                        </div>
                      </div>

                      {/* Info alerts list */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 font-sans">
                          <span className="text-[10px] uppercase font-mono font-black text-emerald-400 tracking-wider">01. IN-PLAYER CALCULATION MATRICES</span>
                          <p className="text-slate-400 text-xs mt-1 leading-snug">
                            Once live, players can trigger automated double-chance and perm layout forecasts directly from active match timelines.
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 font-sans">
                          <span className="text-[10px] uppercase font-mono font-black text-[#FA3E65] tracking-wider">02. SATELLITE CONCURRENT STREAMS</span>
                          <p className="text-slate-400 text-xs mt-1 leading-snug">
                            No buffered feeds or delay penalization. Stream key sequences simultaneously with zero regional geolocation lock restrictions.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 3: RESULTS CENTER OF GAME PAYOUTS */}
              {activeSubTab === 'results' && (() => {
                const uniqueSeasons = Array.from(new Set(poolResults.map((r: any) => String(r.season_year || 2026)))).sort();
                const uniqueWeeks = Array.from(new Set(poolResults.map((r: any) => Number(r.week_number || 43)))).sort((a: any, b: any) => Number(a) - Number(b));

                const filteredResults = poolResults.filter((sheet: any) => {
                  if (filterSeason !== 'all') {
                    if (String(sheet.season_year || 2026) !== filterSeason) return false;
                  }
                  if (filterWeek !== 'all') {
                    if (String(sheet.week_number || 43) !== filterWeek) return false;
                  }
                  if (filterFixtureDate !== '') {
                    if (sheet.fixture_date !== filterFixtureDate) return false;
                  }
                  return true;
                });

                let activeResult = filteredResults.find((r: any) => r.id === selectedResultId);
                if (!activeResult && filteredResults.length > 0) {
                  activeResult = filteredResults[0];
                }
                const selectedWeek = activeResult ? db.pool_weeks.find(w => w.id === activeResult.pool_week_id) : undefined;

                const handleAddResultRowLocal = (e: React.FormEvent) => {
                  e.preventDefault();
                  if (!activeResult) {
                    triggerToast('No active results sheet selected. Please adjust your filters or create a sheet.', 'error');
                    return;
                  }
                  if (!adminResHome || !adminResAway || !adminResScore) {
                    triggerToast('Please fill in home selection, away selection, and full-time score.', 'error');
                    return;
                  }
                  const matchNumber = Number(adminResMatchNo) || (activeResult?.results_table || []).length + 1;
                  const newRow = {
                    matchNo: matchNumber,
                    homeTeam: adminResHome,
                    awayTeam: adminResAway,
                    fullTimeScore: adminResScore,
                    outcome: adminResOutcome || 'DRAW',
                    payoutStatus: adminResPayStatus || 'CLEARED'
                  };

                  const updatedResults = poolResults.map(sheet => {
                    if (activeResult && sheet.id === activeResult.id) {
                      return {
                        ...sheet,
                        results_table: [...(sheet.results_table || []), newRow]
                      };
                    }
                    return sheet;
                  });

                  setPoolResults(updatedResults);
                  triggerToast(`Success! Appended Match No. ${matchNumber} [${adminResHome} vs ${adminResAway}] to current sheet!`, 'success');

                  // Clear inputs / auto-increment
                  setAdminResMatchNo(String(matchNumber + 1));
                  setAdminResHome('');
                  setAdminResAway('');
                  setAdminResScore('');
                };

                const handleCreateNewSheetLocal = (e: React.FormEvent) => {
                  e.preventDefault();
                  const wkNum = Number(adminSheetWeek) || 44;
                  const yrNum = Number(adminSheetYear) || 2026;
                  const newId = `pr-w${wkNum}-${adminSheetType}`;

                  if (poolResults.some(r => r.id === newId)) {
                    triggerToast(`Pool Results Sheet for Week ${wkNum} (${adminSheetType.toUpperCase()}) already exists!`, 'error');
                    return;
                  }

                  const titleText = adminSheetTitle || `Week ${wkNum} ${adminSheetType.toUpperCase()} Pool results: Pool results for the week - ${adminSheetDate}`;

                  const newSheet = {
                    id: newId,
                    pool_week_id: `pw-week-${wkNum}`,
                    bookmaker_id: 'bm-bet9ja',
                    uploaded_by: 'usr-admin-777',
                    results_content: `--- WEEK ${wkNum} OFFICIAL RESULTS ---`,
                    file_url: `https://storage.poolcodes.com/results/w${wkNum}-results.pdf`,
                    created_at: new Date().toISOString(),
                    title: titleText,
                    week_number: wkNum,
                    season_year: yrNum,
                    pool_type: adminSheetType,
                    fixture_date: adminSheetDate,
                    comments_count: 0,
                    results_table: []
                  };

                  setPoolResults([newSheet, ...poolResults]);
                  setSelectedResultId(newId);
                  triggerToast(`Created new empty Pool Results Sheet for Week ${wkNum} (${adminSheetType.toUpperCase()})!`, 'success');
                  setAdminSheetTitle('');
                };

                const handleResetResultsLocal = () => {
                  if (confirm('Are you sure you want to reset all pool results sheets to default professional seeds?')) {
                    setPoolResults(db.pool_results);
                    setSelectedResultId('pr-w43');
                    triggerToast('Resetted Pool Results database in local storage!', 'info');
                  }
                };

                return (
                  <div className="flex flex-col gap-6" id="pool-results-arena">
                    {/* Header Banner */}
                    <div className="border-b border-slate-800 pb-4 mb-2 flex items-center justify-between">
                      <h2 className="text-xl font-extrabold tracking-wider text-slate-100 font-mono uppercase">
                        POOL RESULTS
                      </h2>
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={handleResetResultsLocal}
                          className="bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 text-[10px] font-mono font-bold tracking-wider px-3 py-1.5 rounded-lg uppercase"
                        >
                          Reset Database
                        </button>
                      )}
                    </div>

                    {/* Sheet Selection Selector with Filters */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
                      {/* Section Title */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block">POOL RESULTS DIRECTORY</span>
                          <h4 className="text-sm font-bold text-slate-100 font-sans mt-0.5">Filter & Select Active Results Sheet</h4>
                        </div>
                        {(filterSeason !== 'all' || filterWeek !== 'all' || filterFixtureDate !== '') && (
                          <button
                            onClick={() => {
                              setFilterSeason('all');
                              setFilterWeek('all');
                              setFilterFixtureDate('');
                              triggerToast('All directory filters cleared.', 'info');
                            }}
                            className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 px-2.5 py-1 rounded transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                          >
                            <span>✕ Clear All Filters</span>
                          </button>
                        )}
                      </div>

                      {/* Filters Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {/* 1. Season Filter */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Season</label>
                          <select
                            value={filterSeason}
                            onChange={(e) => {
                              setFilterSeason(e.target.value);
                            }}
                            className="bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs px-3 py-2 rounded-lg focus:border-emerald-500 cursor-pointer focus:ring-1 focus:ring-emerald-500/20 font-bold"
                          >
                            <option value="all">ALL SEASONS</option>
                            {uniqueSeasons.map((yr: string) => (
                              <option key={yr} value={yr}>{yr} season</option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Active Week Filter */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Active Week</label>
                          <select
                            value={filterWeek}
                            onChange={(e) => {
                              setFilterWeek(e.target.value);
                            }}
                            className="bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs px-3 py-2 rounded-lg focus:border-emerald-500 cursor-pointer focus:ring-1 focus:ring-emerald-500/20 font-bold"
                          >
                            <option value="all">ALL WEEKS</option>
                            {uniqueWeeks.map((wk: number) => (
                              <option key={wk} value={String(wk)}>WEEK #{wk}</option>
                            ))}
                          </select>
                        </div>

                        {/* 3. Fixture Date (Date Type) Filter */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Fixture Date</label>
                          <input
                            type="date"
                            value={filterFixtureDate}
                            onChange={(e) => {
                              setFilterFixtureDate(e.target.value);
                            }}
                            className="bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs px-3 py-1.5 rounded-lg focus:border-emerald-500 cursor-pointer focus:ring-1 focus:ring-emerald-500/20 [color-scheme:dark] font-bold"
                          />
                        </div>

                        {/* 4. Active Sheet Selector */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Select Sheet</label>
                          <select
                            value={activeResult ? activeResult.id : ''}
                            onChange={(e) => {
                              if (e.target.value) setSelectedResultId(e.target.value);
                            }}
                            disabled={filteredResults.length === 0}
                            className="bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs px-3 py-2 rounded-lg focus:border-emerald-500 cursor-pointer font-black tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {filteredResults.length === 0 ? (
                              <option value="">No sheets match</option>
                            ) : (
                              filteredResults.map((sheet: any) => (
                                <option key={sheet.id} value={sheet.id}>
                                  Wk {sheet.week_number} ({(sheet.pool_type || 'uk').toUpperCase()})
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Filter stats helper with Search and Export to CSV */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                          <span>Directory count:</span>
                          <span className="font-extrabold text-emerald-400 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded">
                            {filteredResults.length} of {poolResults.length} Sheets Matching
                          </span>
                        </div>

                        {activeResult && (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                            {/* Filter input */}
                            <div className="relative w-full sm:w-64">
                              <input
                                type="text"
                                placeholder="Filter active sheet by team or code..."
                                value={championshipSearchQuery}
                                onChange={(e) => setChampionshipSearchQuery(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[10px] text-white focus:outline-none focus:border-emerald-500 transition font-mono w-full"
                              />
                              {championshipSearchQuery && (
                                <button
                                  onClick={() => setChampionshipSearchQuery('')}
                                  className="absolute right-2 top-1.5 text-[9px] text-slate-400 hover:text-white uppercase font-mono"
                                >
                                  Clear
                                </button>
                              )}
                            </div>

                            {/* Download CSV button */}
                            <button
                              onClick={() => {
                                const baseRows = activeResult.results_table || [];
                                const filtered = baseRows.filter((row: any) => {
                                  if (!championshipSearchQuery) return true;
                                  const q = championshipSearchQuery.toLowerCase();
                                  return (
                                    row.homeTeam?.toLowerCase().includes(q) ||
                                    row.awayTeam?.toLowerCase().includes(q) ||
                                    row.matchNo?.toString().includes(q) ||
                                    row.outcome?.toLowerCase().includes(q)
                                  );
                                });

                                const headers = ['Season', 'Active Week', 'Fixture Date', 'Match No', 'Home Team Selection', 'Away Team Companion', 'Score FT', 'POOL Outcome', 'PAY Status'];
                                const csvRows = filtered.map((row: any) => [
                                  String(activeResult.season_year || 2026),
                                  `WEEK #${activeResult.week_number || 43}`,
                                  activeResult.fixture_date || '2026-04-25',
                                  String(row.matchNo),
                                  row.homeTeam,
                                  row.awayTeam,
                                  row.fullTimeScore,
                                  row.outcome,
                                  row.payoutStatus
                                ]);
                                printTable(`Pool Results Week ${activeResult.week_number}`, headers, csvRows);
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded cursor-pointer transition font-mono shrink-0 flex items-center justify-center gap-1.5 shadow shadow-emerald-500/10 active:scale-95"
                            >
                              <span>📄 Download PDF</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Interactive Excel/Spreadsheet Sheet Component */}
                    {activeResult && (
                      <div className="flex flex-col mt-2">
                        <div className="w-full overflow-x-auto custom-scrollbar rounded-xl border border-slate-800/80 shadow-2xl">
                          <div className="flex flex-col bg-[#0B0F19] min-w-[1000px]">

                        {/* Spreadsheet Grid Container */}
                        <div className="flex flex-col">
                          
                          {/* Row 1: Tai-Chi green title banner mockup! */}
                          <div className="flex border-b border-slate-800">
                            {/* Spreadsheet row number index column */}
                            <div className="w-[45px] shrink-0 bg-[#0F172A] border-r border-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-500 select-none">
                              1
                            </div>
                            
                            {/* The giant emerald center header */}
                            <div className="flex-grow bg-[#004D40] text-slate-100 flex flex-col items-start md:items-center justify-center py-6 px-4 md:px-10 text-left md:text-center relative">
                              {/* Glowing overlay */}
                              <div className="absolute inset-0 bg-[#10B981]/15 mix-blend-overlay"></div>
                              <h1 className="font-black text-lg md:text-2xl tracking-tight md:tracking-widest text-[#FFF] uppercase leading-none drop-shadow-md whitespace-normal break-words max-w-[240px] xs:max-w-[300px] sm:max-w-none">
                                {activeResult.pool_type?.toUpperCase() === 'AUSSIE' ? 'AUSSIE' : 'UK'} POOL DRAW SHEET
                              </h1>
                              <p className="text-[10px] md:text-xs tracking-wider text-emerald-300 font-bold mt-1.5 drop-shadow-sm font-mono uppercase whitespace-normal break-words max-w-[240px] xs:max-w-[300px] sm:max-w-none">
                                OFFICIAL RECORD OF CONFIRMED fixtures SCORE OUTCOMES
                              </p>
                            </div>
                          </div>

                          {/* Row 2: Column header tags */}
                          <div className="flex border-b border-slate-800 bg-slate-900/60 font-mono text-[11px] font-extrabold text-slate-300">
                            <div className="w-[45px] shrink-0 bg-[#0F172A] border-r border-slate-800 flex items-center justify-center text-[10px] text-slate-500 select-none">
                              2
                            </div>
                            <div className="w-[80px] shrink-0 border-r border-slate-800 p-2 text-center uppercase tracking-wider">Season</div>
                            <div className="w-[85px] shrink-0 border-r border-slate-800 p-2 text-center uppercase tracking-wider">Active Week</div>
                            <div className="w-[105px] shrink-0 border-r border-slate-800 p-2 text-center uppercase tracking-wider">Fixture Date</div>
                            <div className="w-[70px] shrink-0 border-r border-slate-800 p-2 text-center uppercase tracking-wider bg-slate-950/25">Match No</div>
                            <div className="flex-1 min-w-[150px] border-r border-slate-800 p-2 text-left pl-4 uppercase tracking-wider">Home Team Selection</div>
                            <div className="flex-1 min-w-[150px] border-r border-slate-800 p-2 text-left pl-4 uppercase tracking-wider">Away Team Companion</div>
                            <div className="w-[80px] shrink-0 border-r border-slate-800 p-2 text-center uppercase tracking-wider">Score FT</div>
                            <div className="w-[110px] shrink-0 border-r border-slate-800 p-2 text-center uppercase tracking-wider bg-slate-950/25">POOL Outcome</div>
                            <div className="w-[140px] shrink-0 p-2 text-center uppercase tracking-wider">PAY Status</div>
                          </div>

                          {/* Rows: Results rows representing the actual football matches */}
                          {(() => {
                            const baseRows = activeResult.results_table || [];
                            const filtered = baseRows.filter((row: any) => {
                              if (!championshipSearchQuery) return true;
                              const q = championshipSearchQuery.toLowerCase();
                              return (
                                row.homeTeam?.toLowerCase().includes(q) ||
                                row.awayTeam?.toLowerCase().includes(q) ||
                                row.matchNo?.toString().includes(q) ||
                                row.outcome?.toLowerCase().includes(q)
                              );
                            });

                            if (filtered.length === 0) {
                              return (
                                <div className="flex border-b border-slate-800 font-mono text-xs text-center py-10 justify-center text-slate-500 italic">
                                  <div className="w-[45px] shrink-0 bg-[#0F172A] border-r border-slate-800 select-none">3</div>
                                  <div className="flex-1">
                                    {baseRows.length === 0
                                      ? "No match records added to this Pool Results Sheet yet. Use the admin panel below to fill outcomes."
                                      : "No matches found matching your filters."}
                                  </div>
                                </div>
                              );
                            }

                            return filtered.map((row, idx) => {
                              const isDraw = row.outcome === 'DRAW';
                              const rowId = idx + 3; // Excel row numbering starts at row 3 now!
                              
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
                                  
                                  {/* A: Season */}
                                  <div className="w-[80px] shrink-0 border-r border-slate-800 p-3 text-center text-slate-300 font-medium flex items-center justify-center">
                                    {activeResult.season_year || 2026}
                                  </div>

                                  {/* B: Active Week */}
                                  <div className="w-[85px] shrink-0 border-r border-slate-800 p-3 text-center text-emerald-400 font-bold flex items-center justify-center">
                                    WEEK #{activeResult.week_number || 43}
                                  </div>

                                  {/* C: Fixture Date */}
                                  <div className="w-[105px] shrink-0 border-r border-slate-800 p-3 text-center text-slate-300 font-mono text-[10.5px] flex items-center justify-center">
                                    {activeResult.fixture_date || '2026-04-25'}
                                  </div>

                                  {/* D: Match No */}
                                  <div className="w-[70px] shrink-0 border-r border-slate-800 p-3 text-center text-slate-400 font-black flex items-center justify-center bg-slate-950/15">
                                    {row.matchNo}
                                  </div>
                                  
                                  {/* E: Home Team */}
                                  <div className="flex-1 min-w-[150px] border-r border-slate-800 p-3 text-left pl-4 font-bold text-slate-100 flex items-center">
                                    {row.homeTeam}
                                  </div>

                                  {/* F: Away Team */}
                                  <div className="flex-1 min-w-[150px] border-r border-slate-800 p-3 text-left pl-4 font-bold text-slate-100 flex items-center">
                                    {row.awayTeam}
                                  </div>

                                  {/* G: Score FT */}
                                  <div className="w-[80px] shrink-0 border-r border-slate-800 p-3 text-center text-[#10B981] font-extrabold flex items-center justify-center">
                                    {row.fullTimeScore}
                                  </div>

                                  {/* H: Outcome Badge */}
                                  <div className="w-[110px] shrink-0 border-r border-slate-800 p-3 text-center flex items-center justify-center bg-slate-950/15">
                                    {isDraw ? (
                                      <span className="w-full bg-[#E11D48] text-[#FFF] font-black tracking-widest text-[9.5px] py-1 rounded-sm shadow-sm select-none uppercase text-center">
                                        {row.outcome}
                                      </span>
                                    ) : (
                                      <span className="w-full bg-slate-800 text-slate-400 font-bold tracking-tight text-[9.5px] px-2.5 py-1 rounded-sm select-none text-center">
                                        {row.outcome}
                                      </span>
                                    )}
                                  </div>

                                  {/* I: Pay status */}
                                  <div className="w-[140px] shrink-0 p-3 text-center flex items-center justify-between font-bold text-[10px]">
                                    {row.payoutStatus === 'CLEARED' ? (
                                      <span className="text-emerald-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        CLEARED
                                      </span>
                                    ) : (
                                      <span className="text-slate-500 uppercase">{row.payoutStatus}</span>
                                    )}

                                    {currentUser.role === 'admin' && (
                                      <button
                                        onClick={() => {
                                          const updatedTable = (activeResult.results_table || []).filter(r => r.matchNo !== row.matchNo);
                                          setPoolResults(prev => prev.map(sheet => {
                                            if (sheet.id === activeResult.id) return { ...sheet, results_table: updatedTable };
                                            return sheet;
                                          }));
                                          triggerToast(`Removed Match #${row.matchNo} from results.`, 'info');
                                        }}
                                        className="text-red-500 hover:text-red-400 font-bold font-mono px-2 py-1 hover:bg-slate-950/60 rounded"
                                        title="Delete Row"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        </div>
                        </div>

                        {/* ADMIN PANEL FOR RESULT SHEETS */}
                        {currentUser.role === 'admin' && (
                          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                            {/* Column 1: Fill outcome record to active sheet */}
                            <div className="bg-slate-900/95 border-2 border-amber-500/20 p-5 rounded-2xl flex flex-col gap-4 font-mono text-xs">
                              <div className="border-b border-slate-800 pb-2">
                                <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                                  🛡️ ADMIN: APPEND ROW TO ACTIVE SHEET
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Insert or overwrite match scoreline results in active drawing sheet: <span className="text-emerald-400">Week {activeResult.week_number} ({(activeResult.pool_type || 'UK').toUpperCase()})</span>.
                                </p>
                              </div>

                              <form onSubmit={handleAddResultRowLocal} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-slate-400 mb-1">MATCH NO.</label>
                                    <input 
                                      type="number"
                                      value={adminResMatchNo}
                                      onChange={e => setAdminResMatchNo(e.target.value)}
                                      placeholder={`Default: ${(activeResult.results_table?.length || 0) + 1}`}
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-slate-400 mb-1 text-emerald-400 font-bold">SCORE FT (FT)</label>
                                    <input 
                                      type="text"
                                      value={adminResScore}
                                      onChange={e => setAdminResScore(e.target.value)}
                                      placeholder="e.g. 1-1 or 2-0"
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                                      required
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-slate-400 mb-1 text-emerald-400 font-bold">HOME TEAM SELECTION</label>
                                    <input 
                                      type="text"
                                      value={adminResHome}
                                      onChange={e => setAdminResHome(e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                                      placeholder="e.g. Arsenal"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-slate-400 mb-1 text-emerald-400 font-bold">AWAY TEAM COMPANION</label>
                                    <input 
                                      type="text"
                                      value={adminResAway}
                                      onChange={e => setAdminResAway(e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                                      placeholder="e.g. Chelsea"
                                      required
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pb-2">
                                  <div>
                                    <label className="block text-slate-400 mb-1">POOL OUTCOME</label>
                                    <select
                                      value={adminResOutcome}
                                      onChange={e => setAdminResOutcome(e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                                    >
                                      <option value="DRAW">DRAW (X)</option>
                                      <option value="HOME WIN">HOME WIN (1)</option>
                                      <option value="AWAY WIN">AWAY WIN (2)</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-slate-400 mb-1">PAYOUT STATUS</label>
                                    <select
                                      value={adminResPayStatus}
                                      onChange={e => setAdminResPayStatus(e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                                    >
                                      <option value="CLEARED">CLEARED (GREEN)</option>
                                      <option value="PENDING">PENDING</option>
                                    </select>
                                  </div>
                                </div>

                                <button
                                  type="submit"
                                  className="w-full bg-emerald-600 hover:bg-emerald-505 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition active:scale-[0.99] uppercase tracking-wider text-[11px]"
                                >
                                  Append Match Outcomes Row
                                </button>
                              </form>
                            </div>

                            {/* Column 2: Build new empty Pool Results drawing sheet */}
                            <div className="bg-slate-900/95 border-2 border-indigo-500/20 p-5 rounded-2xl flex flex-col gap-4 font-mono text-xs">
                              <div className="border-b border-slate-800 pb-2">
                                <h4 className="text-sm font-black text-indigo-400 uppercase tracking-wider">
                                  🛡️ ADMIN: BUILD NEW DRAWING SHEET
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Generate a brand new empty Week Results Sheet for any season type calendar.
                                </p>
                              </div>

                              <form onSubmit={handleCreateNewSheetLocal} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-slate-400 mb-1">WEEK NUMBER</label>
                                    <input 
                                      type="number"
                                      value={adminSheetWeek}
                                      onChange={e => setAdminSheetWeek(e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-slate-400 mb-1">SEASON YEAR</label>
                                    <input 
                                      type="number"
                                      value={adminSheetYear}
                                      onChange={e => setAdminSheetYear(e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                                      required
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-slate-400 mb-1">POOL TYPE</label>
                                    <select
                                      value={adminSheetType}
                                      onChange={e => setAdminSheetType(e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                                    >
                                      <option value="uk">UK POOL</option>
                                      <option value="aussie">AUSSIE POOL</option>
                                      <option value="international">INTERNATIONAL</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-slate-400 mb-1">FIXTURE DATE</label>
                                    <input 
                                      type="date"
                                      value={adminSheetDate}
                                      onChange={e => setAdminSheetDate(e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                                      required
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-slate-400 mb-1">CUSTOM SHEET TITLE (OPTIONAL)</label>
                                  <input 
                                    type="text"
                                    value={adminSheetTitle}
                                    onChange={e => setAdminSheetTitle(e.target.value)}
                                    placeholder="e.g. Week 44 UK Pool results..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                                  />
                                </div>

                                <button
                                  type="submit"
                                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition active:scale-[0.99] uppercase tracking-wider text-[11px]"
                                >
                                  Deploy New Results Sheet
                                </button>
                              </form>
                            </div>
                          </div>
                        )}

                      </div>
                    )}

                    {!activeResult && (
                      <div className="flex flex-col items-center justify-center text-center p-12 bg-slate-900/40 border border-slate-800 rounded-2xl gap-3 animate-fadeIn mt-2">
                        <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-slate-500 font-mono text-xl font-bold select-none">
                          ?
                        </div>
                        <div className="max-w-md">
                          <h4 className="text-sm font-bold text-slate-200 font-sans">No Matching Results Sheets</h4>
                          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                            We couldn't find any Pool Results Sheets matching your select filters:
                            {filterSeason !== 'all' && <span className="text-emerald-400 font-bold ml-1">Season {filterSeason}</span>}
                            {filterWeek !== 'all' && <span className="text-emerald-400 font-bold ml-1">Week #{filterWeek}</span>}
                            {filterFixtureDate !== '' && <span className="text-emerald-400 font-bold ml-1">Fixture Date: {filterFixtureDate}</span>}
                          </p>
                          <button
                            onClick={() => {
                              setFilterSeason('all');
                              setFilterWeek('all');
                              setFilterFixtureDate('');
                            }}
                            className="mt-4 px-4 py-1.5 text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-900/40 rounded transition cursor-pointer"
                          >
                            Reset Directory Filters
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
                </>
              )}

              {/* SUBTAB 4: SUBSCRIPTION BILLING MATRIX */}
              {activeSubTab === 'subscription' && (
                <div className="flex flex-col gap-6">
                  
                  {/* Subscriber license identity display card */}
                  <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap gap-4 items-center justify-between">
                    <div>
                      <span className="text-[9.5px] font-mono text-emerald-400 block uppercase tracking-wide font-extrabold">ACCOUNT STATUS</span>
                      <h4 className="text-sm sm:text-base font-black text-white mt-1 uppercase tracking-wide break-all sm:break-normal">
                        Username: {currentUser.username} ({currentUser.email})
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Role: <span className="text-[#10B981] font-mono font-bold uppercase">{currentUser.role}</span> • Status: <span className="text-amber-400 font-mono uppercase font-black">{currentUser.status}</span>
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950/90 text-white rounded-xl border border-[#334155]/20 text-xs font-mono flex flex-col items-end">
                      <div>CURRENT PLAN: <span className="text-amber-400 font-extrabold uppercase">{activePlan?.name}</span></div>
                      {activeSubscription && (
                        <span className="text-[10px] text-slate-400 mt-1 text-right">Receipt ID: {activeSubscription.payment_ref}</span>
                      )}
                    </div>
                  </div>

                  {/* High fidelity pricing layout */}
                  <div className="border border-slate-800/80 p-5 rounded-xl bg-[#111827] shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/60">
                      <h3 className="font-extrabold text-[#10B981] text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                        ★ UPGRADE SUBSCRIPTION
                      </h3>

                      {/* Regional Tab Selector */}
                      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80 self-start sm:self-auto">
                        <button
                          onClick={() => setPricingRegionFilter('nigeria')}
                          className={`px-4 py-1.5 text-xs font-mono font-bold uppercase rounded-lg transition-all duration-150 ${
                            pricingRegionFilter === 'nigeria'
                              ? 'bg-[#10B981] text-slate-950 font-black shadow shadow-emerald-500/20'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                          }`}
                        >
                          🇳🇬 Nigeria Plans
                        </button>
                        <button
                          onClick={() => setPricingRegionFilter('ghana')}
                          className={`px-4 py-1.5 text-xs font-mono font-bold uppercase rounded-lg transition-all duration-150 ${
                            pricingRegionFilter === 'ghana'
                              ? 'bg-[#10B981] text-slate-950 font-black shadow shadow-emerald-500/20'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                          }`}
                        >
                          🇬🇭 Ghana Plans
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {db.subscription_plans
                        .filter(p => p.id !== 'plan-free')
                        .filter(p => pricingRegionFilter === 'ghana' ? p.id.includes('ghana') : !p.id.includes('ghana'))
                        .map((p) => {
                          const isCurrentPlan = activePlan?.id === p.id;
                          const pComponents = selectedComponents[p.id] || (p.id.includes('ghana') ? ['premierbet', 'betway', 'soccabet', 'sportybet'] : ['bet9ja', 'sportybet', 'betking']);
                          const calculatedCustomPrice = pComponents.length * p.price;
                          const currencySymbol = p.id.includes('ghana') ? 'GH₵' : '₦';
                          return (
                            <div
                              key={p.id}
                              className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 ${
                                isCurrentPlan
                                  ? 'ring-2 ring-emerald-500 border-emerald-500 bg-[#122A1E]/30'
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

                                <div className="mt-5 pb-5 border-b border-slate-800 flex justify-between items-end">
                                  <div>
                                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Unit Price</span>
                                    <span className="text-xl font-mono font-black text-emerald-400">
                                      {currencySymbol}{p.price.toLocaleString()}
                                    </span>
                                    <span className="text-[10.5px] text-slate-400 font-mono"> / {p.billing_cycle.toUpperCase()}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Components</span>
                                    <span className="text-sm font-mono font-bold text-slate-200">{pComponents.length} Selected</span>
                                  </div>
                                </div>

                                {/* Bookmaker Component Customization Selectors */}
                                <div className="mt-5 pt-4 border-b border-slate-800/60 pb-5 text-left">
                                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2.5 tracking-wider">
                                    Custom Plan Components:
                                  </span>
                                  <div className="space-y-2">
                                    {(p.id.includes('ghana') 
                                      ? ['premierbet', 'betway', 'soccabet', 'sportybet'] 
                                      : ['bet9ja', 'sportybet', 'betking']
                                    ).map((comp) => {
                                      const isSel = pComponents.includes(comp);
                                      const compLabel = comp === 'bet9ja' ? 'Bet9ja' : comp === 'sportybet' ? 'SportyBet' : comp === 'betking' ? 'BetKing' : comp === 'premierbet' ? 'PremierBet' : comp === 'betway' ? 'Betway' : comp === 'soccabet' ? 'Soccabet' : comp;
                                      return (
                                        <label
                                          key={comp}
                                          className={`flex items-center justify-between p-2 rounded-lg border transition cursor-pointer select-none ${
                                            isSel 
                                              ? 'border-emerald-800/40 bg-emerald-950/20 text-slate-100'
                                              : 'border-slate-800/60 bg-[#030712] text-slate-500'
                                          } hover:border-slate-700/60`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              checked={isSel}
                                              disabled={isCurrentPlan}
                                              onChange={() => toggleComponentSelection(p.id, comp)}
                                              className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-opacity-20 cursor-pointer shrink-0"
                                            />
                                            <span className="text-xs font-bold font-sans">{compLabel}</span>
                                          </div>
                                          <span className="text-[10.5px] font-mono">
                                            {currencySymbol}{p.price.toLocaleString()}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                  <div className="mt-4 bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 flex justify-between items-center">
                                    <span className="text-[10px] text-slate-400 font-mono">Total Price:</span>
                                    <span className="text-base font-mono font-black text-amber-400">
                                      {currencySymbol}{calculatedCustomPrice.toLocaleString()}
                                    </span>
                                  </div>
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
                                onClick={() => buySubscription(p.id, pComponents)}
                                disabled={isCurrentPlan || currentUser.role === 'admin' || pComponents.length === 0}
                                className={`w-full mt-6 text-xs font-black uppercase py-3 rounded-lg transition-all ${
                                  isCurrentPlan
                                    ? 'bg-emerald-900/40 text-emerald-400 font-bold border border-emerald-800/40 pointer-events-none'
                                    : pComponents.length === 0
                                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-850/20 active:scale-95 cursor-pointer'
                                }`}
                              >
                                {isCurrentPlan ? '✓ Subscribed Active' : pComponents.length === 0 ? 'Select Components' : `Buy ${p.name} PRO • ${currencySymbol}${calculatedCustomPrice.toLocaleString()}`}
                              </button>
                            </div>
                          );
                        })}
                    </div>


                  </div>
                </div>
              )}

               {/* SUBTAB 7: USER PROFILE INFORMATION */}
              {activeSubTab === 'profile' && (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Column 2: Edit Personal Information */}
                    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-lg">
                      <h3 className="font-extrabold text-[#10B981] text-xs uppercase tracking-wider font-mono border-b border-slate-800 mb-5 pb-2.5 flex items-center gap-2">
                        ✍️ EDIT PERSONAL INFORMATION
                      </h3>

                      <form onSubmit={handleSavePersonalInfo} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono font-black text-slate-400 uppercase pl-0.5">
                            Username / Nickname
                          </label>
                          <input
                            value={profileUsername}
                            onChange={(e) => setProfileUsername(e.target.value)}
                            placeholder="Unique nickname..."
                            type="text"
                            className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-hidden font-mono"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono font-black text-slate-400 uppercase pl-0.5">
                            Email Address ID
                          </label>
                          <input
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                            placeholder="Primary email ID..."
                            type="email"
                            className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-hidden font-mono"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono font-black text-slate-400 uppercase pl-0.5">
                            Secure Phone Number
                          </label>
                          <input
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            placeholder="e.g. +234 801 234 5678"
                            type="text"
                            className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-hidden font-mono"
                          />
                        </div>

                        <button
                          type="submit"
                          className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-955 font-black text-xs uppercase py-3 rounded-xl transition duration-150 cursor-pointer shadow-lg shadow-emerald-950/20 text-center mt-3 font-mono"
                        >
                          SAVE PERSONAL DETAILS
                        </button>
                      </form>
                    </div>

                    {/* Column 3: Change Protection Password */}
                    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-lg">
                      <h3 className="font-extrabold text-[#FA3E65] text-xs uppercase tracking-wider font-mono border-b border-slate-800 mb-5 pb-2.5 flex items-center gap-2">
                        🔐 CHANGE PROTECTION PASSWORD
                      </h3>

                      <form onSubmit={handleSavePassword} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono font-black text-slate-400 uppercase pl-0.5">
                            New Encryption Password
                          </label>
                          <input
                            value={profilePassword}
                            onChange={(e) => setProfilePassword(e.target.value)}
                            placeholder="At least 5 characters..."
                            type="password"
                            className="bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-hidden font-mono"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono font-black text-slate-400 uppercase pl-0.5">
                            Confirm New Password
                          </label>
                          <input
                            value={profileConfirmPassword}
                            onChange={(e) => setProfileConfirmPassword(e.target.value)}
                            placeholder="Must match exactly..."
                            type="password"
                            className="bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-hidden font-mono"
                          />
                        </div>

                        <div className="text-[10px] text-slate-400 leading-normal font-mono select-none my-1">
                          🔒 Updating password commits your credentials across both the active login session and the relational memory state.
                        </div>

                        <button
                          type="submit"
                          className="bg-rose-500 hover:bg-rose-450 active:scale-95 text-slate-950 font-black text-xs uppercase py-3 rounded-xl transition duration-150 cursor-pointer shadow-lg shadow-rose-950/20 text-center mt-1 font-mono"
                        >
                          SYNCHRONIZE NEW PASSWORD
                        </button>
                      </form>
                    </div>

                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
        {/* Render footer inline at the bottom of content scroller */}
        <div className="-mx-3 sm:-mx-5 md:-mx-8 mt-auto pt-12 shrink-0">
          {renderFooter && renderFooter()}
        </div>
      </main>

      {/* PDF PRINT CUSTOMIZER & GENERATOR MODAL */}
      <AnimatePresence>
        {showPdfPrintModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-2 sm:p-4 select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative text-left"
            >
              {/* Close button */}
              <button
                onClick={() => setShowPdfPrintModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1.5 hover:bg-slate-900 rounded-xl z-20 cursor-pointer"
                title="Close Customizer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Column: Secure Premium Document Details */}
              <div className="w-full md:w-[38%] border-b md:border-b-0 md:border-r border-slate-800 flex flex-col h-1/2 md:h-full bg-[#090E1A]/60 shrink-0">
                <div className="p-5 border-b border-slate-800/80 bg-slate-950 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/15 rounded-lg text-emerald-400">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-black text-emerald-400 tracking-wider uppercase">PDF Export</h4>
                      <h3 className="text-sm font-sans font-black text-white uppercase tracking-tight">Secure Document</h3>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-center scrollbar-thin scrollbar-thumb-slate-800">
                  <div className="space-y-4 bg-slate-950/80 border border-slate-850/60 p-5 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-2">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <h4 className="text-center text-xs font-mono font-black text-white uppercase tracking-wider">Verified Premium Layout</h4>
                    <p className="text-[11px] text-slate-450 leading-relaxed text-center">
                      This document is automatically compiled using secure, official high-fidelity premium styles, licensing footers, and a personalized anti-piracy trace watermark.
                    </p>
                    <div className="border-t border-slate-900 pt-4 space-y-2.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>FORMAT TYPE:</span>
                        <span className="text-white font-bold uppercase">A4 PDF Print-Ready</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>ANTI-PIRACY TRACE:</span>
                        <span className="text-emerald-400 font-bold uppercase">Active Watermark</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>LICENSED SUBSCRIBER:</span>
                        <span className="text-amber-400 font-bold truncate max-w-[130px]">@{currentUser.username}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print Trigger block */}
                <div className="p-5 border-t border-slate-800/85 bg-slate-950 flex flex-col gap-3 shrink-0">
                  <button
                    onClick={() => {
                      // Dynamically create temporary style sheet for printing to isolate our specific printable sheet
                      const printStyle = document.createElement('style');
                      printStyle.id = 'print-coupon-override';
                      printStyle.innerHTML = `
                        @media print {
                          body * {
                            visibility: hidden !important;
                          }
                          #printable-coupon-pdf, #printable-coupon-pdf * {
                            visibility: visible !important;
                          }
                          #printable-coupon-pdf {
                            position: fixed !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            height: auto !important;
                            background: white !important;
                            color: black !important;
                            z-index: 9999999 !important;
                            padding: 20px !important;
                            margin: 0 !important;
                          }
                        }
                      `;
                      document.head.appendChild(printStyle);
                      
                      setTimeout(() => {
                        window.print();
                        setTimeout(() => {
                          const styleNode = document.getElementById('print-coupon-override');
                          if (styleNode) {
                            styleNode.remove();
                          }
                        }, 500);
                      }, 100);
                      
                      triggerToast('Opening printer preferences to save PDF...', 'success');
                    }}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 font-mono"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print or Save PDF</span>
                  </button>

                  <p className="text-[10px] text-slate-500 font-mono leading-relaxed text-center">
                    💡 <span className="text-emerald-400 font-extrabold">Pro Tip:</span> In the printing dialogue, set your destination to <span className="text-white font-extrabold">"Save as PDF"</span> to download this customized coupon directly.
                  </p>
                </div>
              </div>

              {/* Right Column: Live Sheet Preview (Scrollable wrapper mimicking A4) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900/90 flex justify-center items-start scrollbar-thin scrollbar-thumb-slate-800 select-text">
                <div
                  id="printable-coupon-pdf"
                  className={`w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-950 p-6 sm:p-10 shadow-2xl rounded border flex flex-col justify-between font-sans relative ${
                    pdfConfig.theme === 'emerald' ? 'border-t-8 border-t-emerald-700' : ''
                  }`}
                >
                  {/* Decorative background grid overlay for print preview (removed during print automatically via CSS) */}
                  <div className="absolute inset-0 bg-grid opacity-[0.01] pointer-events-none print:hidden"></div>

                  {/* Watermark layer: "fastpoolcodes" and user email repeating all over */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-[0.18] print:opacity-[0.24] z-0 flex flex-wrap justify-around items-center content-around">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <div
                        key={i}
                        className="text-[12px] sm:text-[14px] font-mono font-black text-slate-950 uppercase tracking-widest whitespace-nowrap select-none p-6 rotate-[-30deg]"
                        style={{ transform: 'rotate(-30deg)' }}
                      >
                        fastpoolcodes • {currentUser.email}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6 relative z-10">
                    {/* Header Block */}
                    <div className="border-b-2 border-slate-950 pb-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-black tracking-tighter uppercase font-sans">
                              ⚽ FAST<span className="text-emerald-700">POOL</span>CODES
                            </span>
                            <span className="text-[8.5px] font-mono uppercase bg-slate-950 text-white px-2 py-0.5 rounded font-black select-none">
                              VIP CERTIFIED
                            </span>
                          </div>
                          <h1 className="text-base font-extrabold font-mono tracking-tight text-slate-900">
                            {pdfConfig.title}
                          </h1>
                          <p className="text-xs text-slate-600 font-sans italic">
                            {pdfConfig.subtitle}
                          </p>
                        </div>

                        {/* Security Verification Stamp */}
                        {pdfConfig.showVerificationStamp && (
                          <div className="border-2 border-emerald-600 text-emerald-700 p-2 text-center rounded uppercase select-none font-black font-mono text-[9px] tracking-wider bg-emerald-50/50 flex flex-col items-center">
                            <span>🛡️ VERIFIED LICENSED KEY</span>
                            <span className="text-[7.5px] font-normal text-slate-500 lowercase mt-0.5">
                              id: fp-sec-{Math.random().toString(36).substring(2, 7)}-{(currentUser?.id || 'guest').slice(0,4)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Header Table Metadata Info Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200 mt-4 pt-3 text-[10.5px] font-mono text-slate-700">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">LICENSEE NICK:</span>
                          <span className="font-extrabold text-slate-900">@{currentUser.username}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">EMAIL REGISTERED:</span>
                          <span className="font-extrabold text-slate-900 truncate block max-w-[150px]">{currentUser.email}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">VERIFIED ACTIVE:</span>
                          <span className="font-extrabold text-slate-900">WEEK {activeWeekNumber || 43} (2026)</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">COMPLIANCE CODE:</span>
                          <span className="font-extrabold text-slate-900">SHA256:FPC-{(currentUser?.id || 'guest').slice(0, 5).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Warning Notice Box */}
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded text-[10px] text-slate-600 leading-relaxed font-mono">
                      <strong>⚠️ VIP PRINT LICENSE CLAUSE:</strong> This classified match coupon is generated and optimized specifically for subscriber <strong>@{currentUser.username}</strong> ({currentUser.email}). Distributing, photocopying, digital scanning, or public uploading of this document is fully trace-monitored. Infringements will violate Terms of Service Clause 6 (Intellectual Property) and lead to direct account closure without appeal.
                    </div>

                    {/* Classified Coupon Table */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-mono font-black uppercase text-slate-900 tracking-wide">
                        📋 Compiled Weekly Classified Coupon Match-ups
                      </h3>

                      <table className="w-full text-left font-sans text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-950 text-white font-mono uppercase text-[9px] tracking-wider border border-slate-950">
                            <th className="p-2 border text-center w-[10%]">Pool No</th>
                            <th className="p-2 border text-center w-[15%]">Bet Code</th>
                            <th className="p-2 border w-[40%]">Match Details (Home vs Away)</th>
                            
                            {pdfConfig.showOdds && (
                              <>
                                <th className="p-2 border text-center w-[7%]">Home (1)</th>
                                <th className="p-2 border text-center w-[7%]">Draw (X)</th>
                                <th className="p-2 border text-center w-[7%]">Away (2)</th>
                              </>
                            )}

                            {pdfConfig.showTips && (
                              <th className="p-2 border text-center w-[15%]">Expert Tip</th>
                            )}

                            {pdfConfig.showBookmaker && (
                              <th className="p-2 border text-center w-[12%]">Bookmaker</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 border">
                          {(() => {
                            const pdfFilteredGames = postedGames.filter(game => {
                              if (bypassPremium) return true;
                              if (currentUser.role === 'admin') return true;
                              if (!isLoggedIn || !isVerified || !isPaidUser) return false;
                              if (!activeSubscription || activeSubscription.status !== 'active') return false;
                              if (activePlan?.id === 'plan-free') return false;
                              const userComponents = activeSubscription?.components || [];
                              return userComponents.map(c => c.toLowerCase()).includes(game.bookmaker.toLowerCase());
                            });

                            if (pdfFilteredGames.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={7} className="p-8 text-center text-slate-400 font-mono italic">
                                    No classified fixtures match your subscribed bookmaker components.
                                  </td>
                                </tr>
                              );
                            }

                            return pdfFilteredGames.map((game, idx) => (
                              <tr 
                                key={game.id || idx} 
                                className={`text-[11px] hover:bg-slate-50 transition-colors ${
                                  pdfConfig.theme === 'compact' ? 'py-1' : 'py-2.5'
                                }`}
                              >
                                <td className="p-2 border text-center font-mono font-black text-slate-900 bg-slate-50">
                                  {game.poolNo}
                                </td>
                                <td className="p-2 border text-center font-mono font-black text-slate-800 bg-slate-100/50">
                                  {game.betCode}
                                </td>
                                <td className="p-2 border font-extrabold text-slate-900">
                                  {game.home} <span className="font-normal text-slate-400">vs</span> {game.away}
                                </td>

                                {pdfConfig.showOdds && (
                                  <>
                                    <td className="p-2 border text-center font-mono text-slate-600">{game.homeWin}</td>
                                    <td className="p-2 border text-center font-mono text-slate-600">{game.draw}</td>
                                    <td className="p-2 border text-center font-mono text-slate-600">{game.awayWin}</td>
                                  </>
                                )}

                                {pdfConfig.showTips && (
                                  <td className="p-2 border text-center font-mono font-black text-emerald-800 text-[10px] uppercase">
                                    {game.betTips || 'DRAW (X)'}
                                  </td>
                                )}

                                {pdfConfig.showBookmaker && (
                                  <td className="p-2 border text-center font-mono text-[9.5px] text-slate-500 uppercase">
                                    {game.bookmaker}
                                  </td>
                                )}
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Coupon Sheet Footer */}
                  <div className="border-t border-slate-300 pt-5 mt-8 flex flex-col gap-2.5 text-center sm:text-left relative z-10">
                    <p className="text-[10px] text-slate-700 italic leading-relaxed font-sans">
                      "{pdfConfig.customNote}"
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-between text-[8px] font-mono text-slate-400 mt-2 border-t border-slate-100 pt-2 gap-2">
                      <span>© 2026 FastPoolCodes Compliance & Decryption Syndicate.</span>
                      <span>Verified Download Path: {currentUser?.email} • fpc-user-key-{(currentUser?.id || 'guest').slice(0,8)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SIMULATED INBOX EMAIL PREVIEW MODAL */}
      <AnimatePresence>
        {showSimulatedEmailModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-2 sm:p-4 select-none">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-[#0b101d] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative text-left text-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Mail browser window decorations bar */}
              <div className="bg-[#12192a] border-b border-slate-800 px-4 py-3 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 bg-rose-500 rounded-full inline-block"></span>
                    <span className="w-3 h-3 bg-amber-500 rounded-full inline-block"></span>
                    <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block"></span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest pl-2">
                    FPC-MAILBOX-GATEWAY // SUBSCRIBER PREVIEW
                  </span>
                </div>
                <button
                  onClick={() => setShowSimulatedEmailModal(false)}
                  className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
                  title="Close Mail"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Email meta information panel */}
              <div className="p-5 border-b border-slate-850 bg-[#090d18] shrink-0 space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono block">SUBJECT:</span>
                  <h3 className="text-xs sm:text-sm font-sans font-extrabold text-white">
                    {confirmedPaymentMail ? confirmedPaymentMail.subject : `📧 [FastPoolCodes Premium Delivery] Week ${activeWeekNumber || 43} Classified Coupon Codes & Verified Slip Keys (PDF Attached)`}
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-850 gap-2">
                  <div>
                    <span className="text-slate-500">From:</span> <span className="text-emerald-400">FastPoolCodes VIP Dispatch &lt;noreply@fastpoolcodes.com&gt;</span>
                  </div>
                  <div>
                    <span className="text-slate-500">To:</span> <span className="text-blue-300">You &lt;{currentUser.email}&gt;</span>
                  </div>
                </div>
              </div>

              {/* Email Content Box */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans bg-[#0c1221]">
                <div className="space-y-3">
                  <p className="font-extrabold text-white text-sm">Hi @{currentUser.username},</p>
                  
                  {confirmedPaymentMail ? (
                    <div className="whitespace-pre-line space-y-3">
                      {confirmedPaymentMail.body.replace(`Hi @${currentUser.username},\n\n`, '')}
                    </div>
                  ) : (
                    <>
                      <p>
                        Congratulations on maintaining your active <strong>{activePlan?.name || 'VIP'} Subscription License</strong> for the current Week {activeWeekNumber || 43} pools league season!
                      </p>

                      <p>
                        As part of your automated fast-delivery experience, our backend compiled, decrypted, and signed your customized weekly coupon code sheet. We have compiled these fixtures into a high-fidelity, print-ready document and attached it to this mailbox dispatch as a secure, compact PDF file.
                      </p>

                      <p>
                        You can print it out for physical bookmakers, or save it to your phone for quick reference during coupon matching weekends.
                      </p>
                    </>
                  )}
                </div>

                {/* Simulated PDF Attachment file */}
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-500/10 rounded-xl text-red-500">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-mono font-bold text-slate-200 text-xs break-all">
                        {confirmedPaymentMail ? confirmedPaymentMail.pdfName : `FastPoolCodes_Week_${activeWeekNumber || 43}_Classified_Coupon.pdf`}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {confirmedPaymentMail ? (
                          <>Size: 420 KB • Mime: application/pdf • Status: Scanned Secure ✓ {confirmedPaymentMail.fetchedFromSupabase ? "• Source: Supabase Table" : "• Offline Cache fallback"}</>
                        ) : (
                          <>Size: 342 KB • Mime: application/pdf • Status: Scanned Secure ✓</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {confirmedPaymentMail ? (
                      <a
                        href={confirmedPaymentMail.pdfUrl}
                        download={confirmedPaymentMail.pdfName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black font-mono text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Supabase PDF</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          setShowSimulatedEmailModal(false);
                          setShowPdfPrintModal(true);
                        }}
                        className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black font-mono text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Open & Print</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        // Triggers the standard text codesheet download as fallback
                        const planId = activePlan?.id || 'plan-monthly';
                        buySubscription(planId); // mock trigger download
                        triggerToast('Downloading copy of the weekly codes list...', 'success');
                      }}
                      className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-mono text-[10px] uppercase tracking-wider p-2 rounded-lg transition cursor-pointer flex items-center justify-center"
                      title="Download Fallback text list"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-5 space-y-2">
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Disclaimer: This automated correspondence is powered by FastPoolCodes SMTP secure relays. FastPoolCodes does not solicit or promote gambling. Pool codes are strictly for statistical and coupon historical reference under the laws of your local jurisdiction.
                  </p>
                  <p className="text-[10.5px] font-mono text-slate-500">
                    FastPoolCodes Delivery Syndicate. admin@Fastpoolcodes.com
                  </p>
                </div>
              </div>

              {/* Bottom email dispatch control */}
              <div className="p-4 bg-[#12192a] border-t border-slate-800 shrink-0 flex items-center justify-between">
                <button
                  onClick={() => {
                    triggerToast('Automated email PDF re-dispatched to mail relay queues...', 'success');
                  }}
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/25 font-black font-mono text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Re-Send To My Inbox</span>
                </button>

                <button
                  onClick={() => setShowSimulatedEmailModal(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg transition border border-slate-800 cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
    } else if (lowercaseName.includes('premier')) {
      cardBg = "from-purple-950 via-[#150B26] to-[#0A111F]";
      brandColor = "text-purple-400";
      accentText = "PREMIERBET MATCH";
    } else if (lowercaseName.includes('way')) {
      cardBg = "from-slate-900 via-[#0F172A] to-[#0A111F]";
      brandColor = "text-emerald-300";
      accentText = "BETWAY MATCH";
    } else if (lowercaseName.includes('socca')) {
      cardBg = "from-cyan-950 via-[#0B1A26] to-[#0A111F]";
      brandColor = "text-cyan-400";
      accentText = "SOCCABET MATCH";
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
