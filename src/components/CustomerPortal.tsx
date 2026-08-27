import React, { useState, useEffect, useRef, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Home,
  Check,
  Download,
  Bell,
  BellRing,
  Clock,
  Timer,
  AlertTriangle,
  User as UserIcon,
  CreditCard,
  Target,
  Trophy,
  Lock,
  Unlock,
  ChevronRight,
  ChevronLeft,
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
  Database,
  BookOpen,
  Share2,
  Sliders,
  CheckCircle2,
  FileSpreadsheet,
  Table,
  LayoutList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseState, User, SubscriptionPlan, UserSubscription, PoolCode, parseComponents } from '../types';
import WeeklyPoolPicksTable from './WeeklyPoolPicksTable';
import { getSupabaseClient } from '../lib/supabase';
import GoogleAdBanner from './GoogleAdBanner';
import LiveScoresComments from './LiveScoresComments';
import {
  INITIAL_PLANS,
  isGhanaPlan,
  getMergedSubscriptionPlans,
  getSortedComparisonPlans,
  isGhanaBookmaker,
  isPaymentDisabledBookmaker,
  getMergedBookmakers,
  getBookmakersByCountry,
  normalizeBookmakerKey,
  matchBookmakerComponent,
  INITIAL_BET9JA,
  INITIAL_BETKING,
  INITIAL_SPORTYBET,
  INITIAL_PREMIERBET,
  INITIAL_BETWAY,
  INITIAL_SOCCABET,
  INITIAL_MSPORT,
  INITIAL_POOL_CODES_COMPARISON
} from '../initialData';
import PoolCodesComparisonTable from './PoolCodesComparisonTable';

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
  onNavigateToContact?: () => void;
  onNavigateToAbout?: () => void;
  confirmedPaymentMail?: { subject: string; body: string; pdfUrl: string; pdfName: string; fetchedFromSupabase: boolean; queryDetails: string } | null;
  setConfirmedPaymentMail?: (val: any) => void;
  showSimulatedEmailModal?: boolean;
  setShowSimulatedEmailModal?: (val: boolean) => void;
  isSyncingSupabase?: boolean;
  fetchRealSupabaseData?: (silent: boolean) => Promise<void>;
  discoveredDbTables?: any[];
  bypassPremium?: boolean;
  onToggleBypassPremium?: () => void;
  onDownloadReceipt?: (userObj: any, planId: string, paymentRef: string) => void;
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
  onNavigateToContact,
  onNavigateToAbout,
  confirmedPaymentMail,
  setConfirmedPaymentMail,
  showSimulatedEmailModal: showSimulatedEmailModalProp,
  setShowSimulatedEmailModal: setShowSimulatedEmailModalProp,
  isSyncingSupabase = false,
  fetchRealSupabaseData,
  discoveredDbTables = [],
  bypassPremium = false,
  onToggleBypassPremium,
  onDownloadReceipt
}: CustomerPortalProps) {
  const [remoteLogs, setRemoteLogs] = useState<any[]>([]);

  useEffect(() => {
    // Fetch purchase and subscription records across access logs (purchases_access_log, subscriptions_access_log, plan_purchased, user_subscriptions)
    const tablesToQuery = [
      'purchases_access_log',
      'subscriptions_access_log',
      'plan_purchased',
      'plans_purchased',
      'user_subscriptions',
      'users_subscriptions',
      'subscriptions'
    ];

    const uid = currentUser?.id || '';
    const uname = currentUser?.username || '';

    Promise.all(
      tablesToQuery.map(tbl =>
        fetch(`/api/tables/${tbl}?user_id=${encodeURIComponent(uid)}&username=${encodeURIComponent(uname)}`, {
          headers: {
            'x-user-id': uid,
            'x-username': uname
          }
        })
          .then(res => res.json())
          .then(data => {
            const list = data?.data || data?.rows || (Array.isArray(data) ? data : []);
            return Array.isArray(list) ? list : [];
          })
          .catch(() => [])
      )
    ).then(results => {
      const combined = results.flat().filter(Boolean);
      setRemoteLogs(combined);
    }).catch(err => console.warn('Purchases table fetch error:', err));
  }, [currentUser?.id, currentUser?.username, currentUser?.email]);

  const getItemGrantedTables = (item: any): string[] => {
    if (!item) return [];
    
    // 1. Direct components / tables field
    const rawComps: any = item.components || item.granted_tables || item.granted_components || item.tables;
    const parsed = parseComponents(rawComps);

    const granted = new Set<string>(parsed.map(p => normalizeBookmakerKey(p)).filter(Boolean));

    // 2. Inspect plan_purchased, item_name, plan_title, plan_name, plan_id text strings
    const ptitle = String(item.plan_purchased || item.item_name || item.plan_name || item.plan_title || '').toLowerCase();
    const pid = String(item.plan_id || '').toLowerCase();
    const fullText = `${ptitle} ${pid}`.trim();

    // Check for explicit "all" / "vip" / "unlimited"
    if (
      granted.has('all') ||
      fullText.includes('all bookmaker') ||
      fullText.includes('all table') ||
      fullText.includes('vip unlimited') ||
      fullText.includes('unlimited') ||
      fullText.includes('all-tables') ||
      fullText.includes('yearly')
    ) {
      return ['all'];
    }

    // Check for specific bookmaker names in plan_purchased or title
    // Ghana SportyBet must be checked before generic SportyBet to prevent false sharing
    if (fullText.includes('sporty') && (fullText.includes('ghana') || fullText.includes('gh') || fullText.includes('sportybet-ghana') || fullText.includes('sportybet_ghana'))) {
      granted.add('sportybet-ghana');
    } else if (fullText.includes('sporty') || fullText.includes('sportybet')) {
      granted.add('sportybet');
    }

    if (fullText.includes('bet9ja')) granted.add('bet9ja');
    if (fullText.includes('betking')) granted.add('betking');
    if (fullText.includes('msport')) granted.add('msport');
    if (fullText.includes('betway')) granted.add('betway');
    if (fullText.includes('premierbet')) granted.add('premierbet');
    if (fullText.includes('soccabet')) granted.add('soccabet');

    // 3. If still empty, check features from subscription_plans definition
    if (granted.size === 0 && item.plan_id) {
      const plan: any = db.subscription_plans?.find((p: any) => p.id === item.plan_id);
      if (plan && plan.features) {
        const planFeatures = parseComponents(plan.features);
        planFeatures.forEach(f => {
          const normKey = normalizeBookmakerKey(f);
          if (normKey === 'all') granted.add('all');
          else if (normKey) granted.add(normKey);
        });
      }
    }

    return Array.from(granted);
  };

  const userSubs = db.user_subscriptions.filter(s => 
    s && (
      (s.user_id && currentUser?.id && String(s.user_id).toLowerCase() === String(currentUser.id).toLowerCase()) ||
      (s.username && currentUser?.username && s.username.toLowerCase() === currentUser.username.toLowerCase()) ||
      ((s as any).email && currentUser?.email && (s as any).email.toLowerCase() === currentUser.email.toLowerCase())
    )
  );
  const latestSub = userSubs.length > 0 
    ? [...userSubs].sort((a, b) => new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime())[0]
    : undefined;

  const userActiveSubs = db.user_subscriptions.filter(s => 
    s && 
    (
      (s.user_id && currentUser?.id && String(s.user_id).toLowerCase() === String(currentUser.id).toLowerCase()) ||
      (s.username && currentUser?.username && s.username.toLowerCase() === currentUser.username.toLowerCase()) ||
      ((s as any).email && currentUser?.email && (s as any).email.toLowerCase() === currentUser.email.toLowerCase())
    ) && 
    s.status === 'active' && 
    new Date(s.expires_at) > new Date()
  );

  const isLoggedIn = currentUser && currentUser.id !== 'guest';
  const isVerified = currentUser && currentUser.status !== 'suspended';

  // Check active remote logs from Supabase purchases_access_log & plan_purchased tables
  const activeRemoteLogs = (remoteLogs || []).filter(item => {
    if (!item) return false;
    const matchesUser = 
      (item.user_id && currentUser?.id && String(item.user_id).toLowerCase() === String(currentUser.id).toLowerCase()) ||
      (item.username && currentUser?.username && String(item.username).toLowerCase() === String(currentUser.username).toLowerCase()) ||
      (item.email && currentUser?.email && String(item.email).toLowerCase() === String(currentUser.email).toLowerCase());
    if (!matchesUser) return false;

    const expDate = item.expiry_date || item.expires_at || item.access_expires_at;
    const statusStr = String(item.access_status || item.status || 'active').toLowerCase();
    const isStatusActive = statusStr === 'active' || statusStr === 'successful' || statusStr === 'completed' || statusStr === 'paid';
    return isStatusActive && (!expDate || new Date(expDate) > new Date());
  });

  const isPaidUser = currentUser.role === 'admin' || bypassPremium || activeRemoteLogs.length > 0 || (
    userActiveSubs.length > 0 && userActiveSubs.some(s => s.plan_id !== 'plan-free')
  );

  const isSubscriptionExpired = !isPaidUser && latestSub && (
    latestSub.status === 'expired' || 
    new Date(latestSub.expires_at) < new Date()
  );

  const isFreeTier = bypassPremium ? false : (!isPaidUser);
  const isLockedOut = bypassPremium ? false : (!isLoggedIn || !isVerified);

  const isBookieAllowed = (bookieName: string) => {
    if (currentUser.role === 'admin' || bypassPremium) return true;
    if (!bookieName) return false;

    const targetKey = normalizeBookmakerKey(bookieName);

    // FREE ACCESS TABLE: "Pool Codes Comparison" is open to all users (free tier, guests, and registered users)
    const targetSlug = (bookieName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (
      targetSlug.includes('poolcodescomparison') ||
      targetSlug.includes('poolcodecomparison') ||
      targetSlug.includes('poolcomparison') ||
      targetSlug === 'comparison'
    ) {
      return true;
    }

    // 1. Check active remote logs from Supabase purchases_access_log / plan_purchased
    for (const logItem of activeRemoteLogs) {
      const granted = getItemGrantedTables(logItem);
      if (granted.includes('all')) return true;
      const match = granted.some((comp: string) => matchBookmakerComponent(comp, targetKey));
      if (match) return true;
    }

    // 2. Check local active user subscriptions
    for (const sub of userActiveSubs) {
      const plan = db.subscription_plans.find(p => p.id === sub.plan_id);
      if (plan && plan.id === 'plan-free') continue;

      const userComponents = getItemGrantedTables(sub);
      if (
        userComponents.includes('all') || 
        (plan && (plan.id.includes('yearly') || plan.id.includes('unlimited') || plan.id.includes('all')))
      ) {
        return true;
      }

      const match = userComponents.some((comp: string) => matchBookmakerComponent(comp, targetKey));
      if (match) return true;
    }

    return false;
  };

  if (!currentUser || currentUser.id === 'guest') {
    return (
      <div className="w-full h-screen bg-[#030d0a] text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-amber-400 shadow-xl">
          <Lock className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">Subscriber Dashboard Protected</h2>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
            You must be signed up and logged into your FastPoolCodes account to access the subscriber dashboard, view live match feeds, and download pool codes.
          </p>
        </div>
        <button
          onClick={() => {
            if (onSignOut) onSignOut();
          }}
          className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer"
        >
          Sign Up / Log In Now
        </button>
      </div>
    );
  }

  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'picks' | 'picks_bet9ja' | 'picks_betking' | 'comparison' | 'streaming' | 'results' | 'subscription' | 'profile'>('dashboard');

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

  // Dashboard Header Posts Carousel & Selection Management
  const [allAvailableBlogs, setAllAvailableBlogs] = useState<any[]>([]);
  const [showCarouselManager, setShowCarouselManager] = useState(false);
  const [carouselSearchFilter, setCarouselSearchFilter] = useState('');
  const [selectedCarouselIds, setSelectedCarouselIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fastpool_carousel_selected_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [];
  });

  const [dashboardBlogs, setDashboardBlogs] = useState<any[]>([
    {
      id: 'week-43-sportybet-header-post',
      title: 'Download Week 43 Sportybet Pool Codes (Nigeria): UK Pool Fixtures & Banker Codes',
      summary: 'Verified Sportybet pool codes, weekly coupon draws, and high-probability bankers for coupon players.',
      content: `### Download Week 43 Sportybet Pool Codes (Nigeria): UK Pool Fixtures [PREMIUM CONTENT]\n\nWelcome to FastPoolCodes official decrypted Sportybet pool codes for Week 43. Below you will find key numbers, match numbers, odds, and predictions for this week's UK Pool fixtures.\n\n#### Key Highlights:\n- **Official UK Fixtures**: Decrypted directly from primary UK football pool papers.\n- **Sportybet Booking Codes**: Instant access to verified Sportybet booking codes for fast placement.\n- **High Precision Odds**: Comprehensive odds analysis across all matches.`,
      date: 'Apr 25, 2026',
      readTime: '2 mins',
      image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
      category: 'ARTICLE',
      badge: '★ COVER STORY',
      bookmaker: 'SportyBet',
      week_number: 43
    },
    {
      id: 'week-43-bet9ja-header-post',
      title: 'Decrypted Week 43 Bet9ja Pool Codes & Banker Pairings – UK Pool Fixtures',
      summary: 'Verified Week 43 Bet9ja coupon codes, dead games, and high-probability bankers for coupon players.',
      content: `### Decrypted Week 43 Bet9ja Pool Codes & Banker Pairings\n\nOfficial decrypted Bet9ja table fixtures with high confidence draw probabilities, key codes, and banker pairings.\n\n- **100% Validated Codes**: Matched with Saturday pool sheets.\n- **Instant Bet9ja Booking**: Copy codes directly into your ticket.`,
      date: 'Apr 24, 2026',
      readTime: '3 mins',
      image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
      category: 'ANALYSIS',
      badge: '★ TRENDING',
      bookmaker: 'Bet9ja',
      week_number: 43
    },
    {
      id: 'week-43-betking-header-post',
      title: 'Week 43 BetKing Pool Codes & Telegraph Matrix Summary (Classified)',
      summary: 'Complete BetKing UK pools fixture breakdown with telegraph matrix analysis and verified odds.',
      content: `### Week 43 BetKing Pool Codes & Telegraph Matrix Summary\n\nAccess our classified BetKing codes and analysis for this week's coupon games.`,
      date: 'Apr 23, 2026',
      readTime: '2 mins',
      image_url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
      category: 'PREDICTION',
      badge: '★ EXCLUSIVE',
      bookmaker: 'BetKing',
      week_number: 43
    }
  ]);
  const [activeCarouselIdx, setActiveCarouselIdx] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const [selectedDashboardArticle, setSelectedDashboardArticle] = useState<any | null>(null);

  // Sync Carousel items whenever available blogs or selection IDs change
  const syncCarouselItems = (available: any[], chosenIds: string[]) => {
    if (!available || available.length === 0) return;
    
    if (chosenIds && chosenIds.length > 0) {
      const matched = chosenIds
        .map(id => available.find(b => String(b.id) === String(id)))
        .filter(Boolean);
      if (matched.length > 0) {
        setDashboardBlogs(matched);
        setActiveCarouselIdx(0);
        return;
      }
    }
    
    // Default to newest published blogs (top 3-5)
    setDashboardBlogs(available.slice(0, 5));
    setActiveCarouselIdx(0);
  };

  useEffect(() => {
    const loadDashboardBlogs = async () => {
      try {
        const res = await fetch('/api/blogs');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const parsedBlogs = json.data.map((b: any, idx: number) => {
              const rawUrl = b.image_url || b.imageUrl || b.cover || b.banner || b.thumbnail;
              const fallbackUrl = idx === 0 
                ? 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80' 
                : idx === 1 
                  ? 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80' 
                  : 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80';

              return {
                id: String(b.id || `blog-${idx}`),
                title: b.title || b.heading || `Weekly Pool Codes & Analysis #${idx + 1}`,
                summary: b.summary || b.description || b.excerpt || 'Verified pool codes and expert match predictions. Log in to download the full decrypted codesheet.',
                content: b.content || b.body || 'Classified pool codes details and predictions.',
                date: b.date || (b.created_at ? new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Apr 25, 2026'),
                readTime: b.read_time || b.readTime || '2 mins',
                image_url: rawUrl && String(rawUrl).trim() !== '' ? rawUrl : fallbackUrl,
                category: b.category || (idx === 0 ? 'ARTICLE' : idx === 1 ? 'ANALYSIS' : 'PREDICTION'),
                badge: idx === 0 ? '★ COVER STORY' : idx === 1 ? '★ TRENDING' : '★ EXCLUSIVE',
                bookmaker: b.bookmaker || 'SportyBet',
                week_number: b.week_number || 43
              };
            });

            setAllAvailableBlogs(parsedBlogs);
            syncCarouselItems(parsedBlogs, selectedCarouselIds);
          }
        }
      } catch (_) {}
    };
    loadDashboardBlogs();
  }, []);

  // Save Carousel selection handler
  const handleSaveCarouselSelection = (newSelectedIds: string[]) => {
    setSelectedCarouselIds(newSelectedIds);
    try {
      localStorage.setItem('fastpool_carousel_selected_ids', JSON.stringify(newSelectedIds));
    } catch (_) {}
    syncCarouselItems(allAvailableBlogs.length > 0 ? allAvailableBlogs : dashboardBlogs, newSelectedIds);
    setShowCarouselManager(false);
    triggerToast('Carousel articles updated successfully!', 'success');
  };

  // Auto-scroll carousel every 5 seconds (paused when hovered)
  useEffect(() => {
    if (dashboardBlogs.length <= 1 || isCarouselHovered) return;

    const timer = setInterval(() => {
      setActiveCarouselIdx((prev) => (prev + 1) % dashboardBlogs.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [dashboardBlogs.length, isCarouselHovered]);

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
    bookmakerFilter: 'Bet9ja',
    theme: 'classic', // 'classic' | 'emerald' | 'compact'
    customNote: 'Decrypted with Premium VIP Authorization. FastPoolCodes All rights reserved.'
  });

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
  const [portalResultsViewMode, setPortalResultsViewMode] = useState<'table' | 'cards'>('table');
  const [portalOutcomeFilter, setPortalOutcomeFilter] = useState<'all' | 'draws' | 'home' | 'away'>('all');

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

  // Real-time listener for Database Explorer view (Event-driven only, no continuous interval polling)
  useEffect(() => {
    if ((activeSubTab as string) !== 'db_explorer') return;

    // Refresh initially when tab opens or table changes
    refreshDbExplorer(dbExplorerSelectedTable);

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

  // Helper to clean up any previous print containers or style overrides to prevent duplicates
  const cleanupExistingPrintNodes = () => {
    const staleDivs = document.querySelectorAll('.printable-dynamic-container, #printable-coupon-pdf, #printable-dynamic-table-sheet, #printable-coupon-modal-sheet');
    staleDivs.forEach(node => node.remove());
    const staleStyles = document.querySelectorAll('#print-coupon-override, #print-terms-override');
    staleStyles.forEach(style => style.remove());
  };

  // Reusable lightweight PDF/Print generation engine for data tables
  const printTable = (title: string, headers: string[], rows: any[][]) => {
    // 1. Immediately purge any existing dynamic print nodes to guarantee a clean single-snapshot print
    cleanupExistingPrintNodes();

    const printDiv = document.createElement('div');
    printDiv.id = 'printable-dynamic-table-sheet';
    printDiv.className = 'printable-dynamic-container';
    printDiv.style.position = 'fixed';
    printDiv.style.left = '0';
    printDiv.style.top = '0';
    printDiv.style.width = '100%';
    printDiv.style.boxSizing = 'border-box';
    printDiv.style.backgroundColor = 'white';
    printDiv.style.color = 'black';
    printDiv.style.zIndex = '9999999';
    printDiv.style.padding = '20px';
    printDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    // Snapshot rows to ensure pure single-state snapshot without array mutation
    const snapshotRows = Array.isArray(rows) ? [...rows] : [];
    const rowCount = snapshotRows.length;
    const fontSize = rowCount > 25 ? '8px' : rowCount > 15 ? '9px' : '10px';
    const cellPadding = rowCount > 25 ? '3px 5px' : rowCount > 15 ? '4px 6px' : '5px 8px';

    const innerContentHtml = `
      <div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.025; display: flex; flex-wrap: wrap; justify-content: space-around; align-content: space-around; z-index: 0; user-select: none;">
        ${Array.from({ length: 24 }).map(() => `
          <div style="font-family: monospace; font-weight: 800; font-size: 13px; text-transform: uppercase; color: #94a3b8; white-space: nowrap; margin: 35px; transform: rotate(-25deg);">
            fastpoolcodes • ${currentUser.email}
          </div>
        `).join('')}
      </div>
      <div style="position: relative; z-index: 10; width: 100%; box-sizing: border-box;">
        <div style="border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; font-family: system-ui, -apple-system, sans-serif; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <h2 style="margin: 0; text-transform: uppercase; font-size: 14px; font-weight: 900; letter-spacing: -0.3px; color: #0f172a;">⚽ FASTPOOLCODES // OFFICIAL REPORT</h2>
              <h3 style="margin: 3px 0 0 0; text-transform: uppercase; font-size: 11px; font-weight: 700; color: #059669;">${title}</h3>
            </div>
            <div style="text-align: right; font-size: 9px; color: #475569; font-family: monospace;">
              <span>User: @${currentUser.username} (${currentUser.email})</span><br/>
              <span>Date: ${new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: ${fontSize}; text-align: left; font-family: system-ui, -apple-system, sans-serif; line-height: 1.35; page-break-inside: avoid;">
          <thead>
            <tr style="background-color: #0f172a; color: white;">
              ${headers.map(h => `<th style="border: 1px solid #0f172a; padding: ${cellPadding}; text-transform: uppercase; font-size: ${fontSize}; font-weight: 800; letter-spacing: 0.3px;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${snapshotRows.map((row, rIdx) => `
              <tr style="background-color: ${rIdx % 2 === 0 ? '#f8fafc' : '#ffffff'}; page-break-inside: avoid; break-inside: avoid;">
                ${row.map(cell => `<td style="border: 1px solid #cbd5e1; padding: ${cellPadding}; color: #0f172a; font-weight: 500; word-break: break-word;">${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 15px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 8px; color: #64748b; text-align: center; font-family: system-ui, -apple-system, sans-serif;">
          © 2026 FastPoolCodes. Verified A4 Printable Document License for @${currentUser.username}.
        </div>
      </div>
    `;

    printDiv.innerHTML = innerContentHtml;
    document.body.appendChild(printDiv);

    const printStyle = document.createElement('style');
    printStyle.id = 'print-coupon-override';
    printStyle.innerHTML = `
      @media print {
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body * {
          visibility: hidden !important;
        }
        #printable-dynamic-table-sheet, #printable-dynamic-table-sheet * {
          visibility: visible !important;
        }
        #printable-dynamic-table-sheet {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 190mm !important;
          margin: 0 auto !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
        }
      }
    `;
    document.head.appendChild(printStyle);

    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.warn('window.print blocked or failed:', err);
      }

      triggerToast('Report print dialog launched.', 'success');

      setTimeout(() => {
        cleanupExistingPrintNodes();
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
      const headers = ['id', 'home_team', 'away_team', 'status', 'pool_result'];
      const rows = (result.results_table || []).map((row: any, idx: number) => {
        const homeTeam = row.home_team || row.Home_Team || row.homeTeam || '';
        const awayTeam = row.away_team || row.Away_Team || row.awayTeam || '';
        const status = row.status || 'Home';
        const poolResult = row.pool_result || '0-:-0';
        return [
          row.id ?? row.matchNo ?? (idx + 1),
          `"${homeTeam}"`,
          `"${awayTeam}"`,
          `"${status}"`,
          `"${poolResult}"`
        ];
      });
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `pool_result_week_${result.week_number || 43}.csv`);
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

  // Helper to extract and map bookmaker games from global db state
  const extractAndMapBookmakerGames = (dbState: DatabaseState) => {
    const getVal = (row: any, ...keys: string[]) => {
      if (!row || typeof row !== 'object') return undefined;
      // 1. Direct key match
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
          return row[k];
        }
      }
      // 2. Case-insensitive and symbol-stripped match
      const normKeys = keys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
      for (const rowKey of Object.keys(row)) {
        const normRowKey = rowKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normKeys.includes(normRowKey)) {
          if (row[rowKey] !== undefined && row[rowKey] !== null && String(row[rowKey]).trim() !== '') {
            return row[rowKey];
          }
        }
      }
      return undefined;
    };

    const mapBookieRows = (rows: any[] | undefined, prefix: string, defaultName: string) => {
      return (rows || []).map((r, idx) => {
        const rawId = r.id !== undefined && r.id !== null ? String(r.id) : String(idx);
        
        // Exact raw table values with strict NULL handling
        const rawPool = getVal(r, 'pool', 'pool_no', 'pool_number', 'poolno');
        const rawBetCode = getVal(r, 'betcode', 'bet_code', 'betCode', 'code', 'booking_code');
        const rawLeague = getVal(r, 'league', 'match_league', 'match-league', 'matchleague', 'leagues', 'competition');
        const rawHome = getVal(r, 'home', 'home_team', 'homeTeam', 'hometeam');
        const rawAway = getVal(r, 'away', 'away_team', 'awayTeam', 'awayteam');
        const rawHomeWin = getVal(r, 'homewin', 'home_win', 'homeWin', 'home_odds', '1');
        const rawDraw = getVal(r, 'draw', 'draw_x', 'draw_odds', 'drawOdds', 'x', 'X');
        const rawAwayWin = getVal(r, 'awaywin', 'away_win', 'awayWin', 'away_odds', '2');
        const rawBetTips = getVal(r, 'bet-tips', 'bet_tips', 'betTips', 'bettips', 'bet', 'bet_tip', 'bettip', 'tip', 'tips', 'prediction');
        const rawStatus = getVal(r, 'status', 'match_status', 'day');
        const rawKickOff = getVal(r, 'kickoff', 'kick_off', 'kickOff', 'time');
        const rawWeekNo = getVal(r, 'week_no', 'weekno', 'week_number', 'weekNumber', 'week');
        const rawBookmaker = getVal(r, 'bookmaker', 'bookie', 'provider') || defaultName;

        // Render as literal text or NULL if not in the database row
        return {
          id: `${prefix}_${rawId}`,
          rawId,
          sourceTable: prefix,
          poolNo: rawPool !== undefined && rawPool !== null && String(rawPool).trim() !== '' ? String(rawPool) : 'NULL',
          betCode: rawBetCode !== undefined && rawBetCode !== null && String(rawBetCode).trim() !== '' ? String(rawBetCode) : 'NULL',
          home: rawHome !== undefined && rawHome !== null && String(rawHome).trim() !== '' ? String(rawHome) : 'NULL',
          away: rawAway !== undefined && rawAway !== null && String(rawAway).trim() !== '' ? String(rawAway) : 'NULL',
          league: rawLeague !== undefined && rawLeague !== null && String(rawLeague).trim() !== '' ? String(rawLeague) : 'NULL',
          matchLeague: (rawHome || rawAway) ? `${rawHome || 'NULL'} vs ${rawAway || 'NULL'}` : 'NULL',
          homeWin: rawHomeWin !== undefined && rawHomeWin !== null && String(rawHomeWin).trim() !== '' ? String(rawHomeWin) : 'NULL',
          draw: rawDraw !== undefined && rawDraw !== null && String(rawDraw).trim() !== '' ? String(rawDraw) : 'NULL',
          awayWin: rawAwayWin !== undefined && rawAwayWin !== null && String(rawAwayWin).trim() !== '' ? String(rawAwayWin) : 'NULL',
          betTips: rawBetTips !== undefined && rawBetTips !== null && String(rawBetTips).trim() !== '' ? String(rawBetTips) : 'NULL',
          status: rawStatus !== undefined && rawStatus !== null && String(rawStatus).trim() !== '' ? String(rawStatus) : 'NULL',
          kickOff: rawKickOff !== undefined && rawKickOff !== null && String(rawKickOff).trim() !== '' ? String(rawKickOff) : 'NULL',
          bookmaker: String(rawBookmaker),
          week: rawWeekNo !== undefined && rawWeekNo !== null && String(rawWeekNo).trim() !== '' ? `Week ${rawWeekNo}` : 'NULL',
          weekNo: rawWeekNo !== undefined && rawWeekNo !== null && String(rawWeekNo).trim() !== '' ? String(rawWeekNo) : 'NULL'
        };
      });
    };

    const b9Rows = (dbState.bet9ja && dbState.bet9ja.length > 0) ? dbState.bet9ja : [];
    const bkRows = (dbState.betking && dbState.betking.length > 0) ? dbState.betking : [];
    const sbRows = (dbState.sportybet && dbState.sportybet.length > 0) ? dbState.sportybet : [];
    const pbRows = (dbState.premierbet && dbState.premierbet.length > 0) ? dbState.premierbet : [];
    const bwRows = (dbState.betway && dbState.betway.length > 0) ? dbState.betway : [];
    const scRows = (dbState.soccabet && dbState.soccabet.length > 0) ? dbState.soccabet : [];
    const msRows = ((dbState as any).msport && (dbState as any).msport.length > 0) ? (dbState as any).msport : [];
    const agRows = (dbState as any).arena_games && (dbState as any).arena_games.length > 0 ? (dbState as any).arena_games : [];

    const b9 = mapBookieRows(b9Rows, 'bet9ja', 'Bet9ja');
    const bk = mapBookieRows(bkRows, 'betking', 'BetKing');
    const sb = mapBookieRows(sbRows, 'sportybet', 'SportyBet');
    const pb = mapBookieRows(pbRows, 'premierbet', 'PremierBet');
    const bw = mapBookieRows(bwRows, 'betway', 'Betway');
    const sc = mapBookieRows(scRows, 'soccabet', 'Soccabet');
    const ms = mapBookieRows(msRows, 'msport', 'MSport');
    const ag = mapBookieRows(agRows, 'arena_games', 'Bet9ja');

    return [...b9, ...bk, ...sb, ...pb, ...bw, ...sc, ...ms, ...ag];
  };

  // Dynamic posted games coupon states
  const [postedGames, setPostedGames] = useState(() => {
    return extractAndMapBookmakerGames(db);
  });
  
  // Synchronize postedGames when database state updates from Supabase (fetching real tables)
  useEffect(() => {
    setPostedGames(extractAndMapBookmakerGames(db));
  }, [
    db.bet9ja,
    db.betking,
    db.sportybet,
    db.premierbet,
    db.betway,
    db.soccabet,
    (db as any).msport,
    (db as any).arena_games,
    db.bookmakers
  ]);

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
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.results_table?.[0]?.home_team === 'Bristol C.') {
          return parsed;
        }
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
  const [vipViewMode, setVipViewMode] = useState<'standalone' | 'matrix' | 'custom'>('standalone');
  const [vipBookmakerFilter, setVipBookmakerFilter] = useState<string>('all');

  // Dynamically compute the active week number from the database bookmaker columns
  const activeWeekNumber = useMemo(() => {
    // 1. Try finding week number from current selected bookmaker in postedGames
    const normStr = (s: string) => (s || '').replace(/\s+/g, '').toLowerCase();
    const targetNorm = normStr(dashboardBookmakerFilter);
    const selectedBookieGameWithWeek = postedGames.find(g => {
      const gBookie = normStr(g.bookmaker || '');
      const gSource = normStr(g.sourceTable || '');
      const matches = targetNorm === 'all' || gBookie === targetNorm || gSource === targetNorm;
      return matches && g.weekNo && g.weekNo !== 'NULL' && String(g.weekNo).trim() !== '';
    });
    if (selectedBookieGameWithWeek?.weekNo && selectedBookieGameWithWeek.weekNo !== 'NULL') {
      return selectedBookieGameWithWeek.weekNo;
    }

    // 2. Try finding week number from any games in postedGames
    const anyGameWithWeek = postedGames.find(g => g.weekNo && g.weekNo !== 'NULL' && String(g.weekNo).trim() !== '');
    if (anyGameWithWeek?.weekNo && anyGameWithWeek.weekNo !== 'NULL') {
      return anyGameWithWeek.weekNo;
    }

    // 3. Try checking raw database tables (bet9ja, betking, sportybet, etc.)
    const allDbTables = [
      db.bet9ja,
      db.betking,
      db.sportybet,
      db.premierbet,
      db.betway,
      db.soccabet,
      (db as any).msport,
      (db as any).arena_games
    ];
    for (const table of allDbTables) {
      if (Array.isArray(table)) {
        for (const row of table) {
          if (row && typeof row === 'object') {
            const rawWk = row.week_no ?? row.weekno ?? row.week_number ?? row.weekNumber ?? row.week;
            if (rawWk !== undefined && rawWk !== null && String(rawWk).trim() !== '' && String(rawWk).toUpperCase() !== 'NULL') {
              return String(rawWk).replace(/^week\s*/i, '').trim();
            }
          }
        }
      }
    }

    return 'NULL';
  }, [postedGames, dashboardBookmakerFilter, db]);

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

  // Admin form state for registering new bookmakers
  const [newBmkName, setNewBmkName] = useState('');
  const [newBmkSlug, setNewBmkSlug] = useState('');
  const [newBmkCountry, setNewBmkCountry] = useState<'Nigeria' | 'Ghana'>('Nigeria');
  const [newBmkLogo, setNewBmkLogo] = useState('');

  const handleAddBookmaker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBmkName.trim()) {
      triggerToast('Please enter a valid bookmaker name.', 'error');
      return;
    }
    const slug = (newBmkSlug || newBmkName).toLowerCase().replace(/[^a-z0-9]/g, '');
    const countryCode = newBmkCountry === 'Ghana' ? 'GH' : 'NG';
    const newBookieObj = {
      id: `bm-${slug}`,
      name: newBmkName.trim(),
      slug: slug,
      logo_url: newBmkLogo || 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=100&h=100&fit=crop&q=80',
      country: countryCode,
      is_active: true
    };

    try {
      const res = await fetch('/api/tables/bookmakers/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBookieObj)
      });
      const resData = await res.json();
      if (resData.success) {
        triggerToast(`New Bookmaker '${newBmkName}' (${newBmkCountry}) added successfully!`, 'success');
      } else {
        triggerToast(`Bookmaker '${newBmkName}' registered.`, 'success');
      }
    } catch (err) {
      console.warn('Error inserting bookmaker:', err);
      triggerToast(`Bookmaker '${newBmkName}' added.`, 'success');
    }

    if (fetchRealSupabaseData) {
      await fetchRealSupabaseData(true);
    }
    setNewBmkName('');
    setNewBmkSlug('');
    setNewBmkLogo('');
  };

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

    // Persist row to corresponding Supabase bookmaker table for real-time live sync
    const targetTable = adminBookmakerCode.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bet9ja';
    const insertPayload = {
      pool: Number(adminPoolNo) || (postedGames.length + 1),
      betcode: adminBetCode,
      home: adminHome,
      away: adminAway,
      homewin: adminHomeWin || '1.00',
      draw: adminDraw || '1.00',
      awaywin: adminAwayWin || '1.05',
      bet: adminBetTips || 'X',
      bet_tips: adminBetTips || 'X',
      betTips: adminBetTips || 'X',
      status: adminStatus,
      kickoff: adminKickOff,
      bookmaker: adminBookmakerCode,
      week: 'Week 49 Aussie'
    };
    fetch(`/api/tables/${targetTable}/insert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(insertPayload)
    }).then(res => res.json()).then(resJson => {
      if (resJson.success && fetchRealSupabaseData) {
        fetchRealSupabaseData(true);
      }
    }).catch(err => console.warn('Supabase fixture insert error:', err));
    
    // Auto increment default pool No for ease-of-use
    setAdminPoolNo(String(newGame.poolNo + 1));
    setAdminBetCode('');
    setAdminHome('');
    setAdminAway('');
  };

  const handleDeleteGame = async (id: string, matchName: string) => {
    setPostedGames(prev => prev.filter(g => g.id !== id));
    triggerToast(`Removed game: ${matchName}`, 'info');

    if (id.includes('_')) {
      const parts = id.split('_');
      const table = parts[0];
      const rawId = parts.slice(1).join('_');
      if (table && rawId) {
        try {
          await fetch(`/api/tables/${table}/${rawId}`, { method: 'DELETE' });
          if (fetchRealSupabaseData) {
            await fetchRealSupabaseData(true);
          }
        } catch (e) {
          console.warn('Delete row error:', e);
        }
      }
    }
  };

  const handleResetGames = () => {
    const allGames = extractAndMapBookmakerGames(db);
    setPostedGames(allGames);
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



  // Interactive Notification Drawer & Expiry Alerts State
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isExpiryBannerDismissed, setIsExpiryBannerDismissed] = useState(false);
  const [activeExpiryDetailsModal, setActiveExpiryDetailsModal] = useState<any | null>(null);

  // Calculate detailed subscription expiration & days remaining
  const subscriptionExpiries = useMemo(() => {
    const list: Array<{
      id: string;
      planName: string;
      bookmakers: string[];
      expiresAt: Date;
      startDate: Date;
      daysRemaining: number;
      hoursRemaining: number;
      totalDays: number;
      percentRemaining: number;
      status: 'active' | 'expiring_soon' | 'critical' | 'expired';
      paymentRef: string;
      amount?: number;
      currency?: string;
      source: 'supabase' | 'local';
    }> = [];

    const seenRefs = new Set<string>();

    const matchUser = (item: any) => item && (
      currentUser?.role === 'admin' ||
      (item.user_id && currentUser?.id && String(item.user_id).toLowerCase() === String(currentUser.id).toLowerCase()) ||
      (item.username && currentUser?.username && String(item.username).toLowerCase() === String(currentUser.username).toLowerCase()) ||
      (item.email && currentUser?.email && String(item.email).toLowerCase() === String(currentUser.email).toLowerCase())
    );

    // 1. Check remote Supabase logs
    (remoteLogs || []).filter(matchUser).forEach((item: any) => {
      const expDateStr = item.expiry_date || item.expires_at || item.access_expires_at;
      if (!expDateStr) return;
      const expDate = new Date(expDateStr);
      if (isNaN(expDate.getTime())) return;

      const ref = item.payment_ref || item.payment_reference || item.id || `remote-${item.id}`;
      if (seenRefs.has(ref)) return;
      seenRefs.add(ref);

      const startDateStr = item.paid_date || item.access_start_at || item.starts_at || item.created_at;
      const startDate = startDateStr ? new Date(startDateStr) : new Date(expDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const now = new Date();
      const diffMs = expDate.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const hoursRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
      const totalMs = Math.max(1, expDate.getTime() - startDate.getTime());
      const totalDays = Math.max(1, Math.round(totalMs / (1000 * 60 * 60 * 24)));
      const percentRemaining = Math.min(100, Math.max(0, Math.round((diffMs / totalMs) * 100)));

      let status: 'active' | 'expiring_soon' | 'critical' | 'expired' = 'active';
      const statusStr = String(item.access_status || item.status || 'active').toLowerCase();
      if (diffMs <= 0 || statusStr === 'expired') {
        status = 'expired';
      } else if (daysRemaining <= 2) {
        status = 'critical';
      } else if (daysRemaining <= 7) {
        status = 'expiring_soon';
      }

      const plan = getMergedSubscriptionPlans(db.subscription_plans).find(p => p.id === item.plan_id);
      const planName = item.plan_purchased || item.item_name || plan?.name || 'VIP Subscription';
      const bookmakers = getItemGrantedTables(item);

      list.push({
        id: ref,
        planName,
        bookmakers,
        expiresAt: expDate,
        startDate,
        daysRemaining,
        hoursRemaining,
        totalDays,
        percentRemaining,
        status,
        paymentRef: ref,
        amount: item.amount,
        currency: item.currency || 'NGN',
        source: 'supabase'
      });
    });

    // 2. Check local user_subscriptions
    (db.user_subscriptions || []).filter(matchUser).forEach((sub: any) => {
      const expDateStr = sub.expires_at;
      if (!expDateStr) return;
      const expDate = new Date(expDateStr);
      if (isNaN(expDate.getTime())) return;

      const ref = sub.payment_reference || sub.payment_ref || sub.id;
      if (seenRefs.has(ref)) return;
      seenRefs.add(ref);

      const startDateStr = sub.starts_at || sub.created_at;
      const startDate = startDateStr ? new Date(startDateStr) : new Date(expDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const now = new Date();
      const diffMs = expDate.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const hoursRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
      const totalMs = Math.max(1, expDate.getTime() - startDate.getTime());
      const totalDays = Math.max(1, Math.round(totalMs / (1000 * 60 * 60 * 24)));
      const percentRemaining = Math.min(100, Math.max(0, Math.round((diffMs / totalMs) * 100)));

      let status: 'active' | 'expiring_soon' | 'critical' | 'expired' = 'active';
      if (diffMs <= 0 || sub.status === 'expired') {
        status = 'expired';
      } else if (daysRemaining <= 2) {
        status = 'critical';
      } else if (daysRemaining <= 7) {
        status = 'expiring_soon';
      }

      const plan = getMergedSubscriptionPlans(db.subscription_plans).find(p => p.id === sub.plan_id);
      const planName = sub.item_name || plan?.name || (sub.plan_id === 'plan-free' ? 'Free Trial' : 'VIP Subscription');
      const bookmakers = getItemGrantedTables(sub);

      list.push({
        id: ref,
        planName,
        bookmakers,
        expiresAt: expDate,
        startDate,
        daysRemaining,
        hoursRemaining,
        totalDays,
        percentRemaining,
        status,
        paymentRef: ref,
        amount: sub.amount_paid,
        currency: sub.currency || 'NGN',
        source: 'local'
      });
    });

    return list.sort((a, b) => {
      // Active/expiring ones first, sorted by days remaining ascending
      if (a.status !== 'expired' && b.status === 'expired') return -1;
      if (a.status === 'expired' && b.status !== 'expired') return 1;
      return a.daysRemaining - b.daysRemaining;
    });
  }, [remoteLogs, db.user_subscriptions, db.subscription_plans, currentUser]);

  // Primary active subscription with the closest expiry date
  const activeSubsList = subscriptionExpiries.filter(s => s.status !== 'expired' && s.daysRemaining > 0);
  const primaryActiveSub = activeSubsList.length > 0 ? activeSubsList[0] : undefined;
  const soonestExpiringSub = activeSubsList.find(s => s.status === 'critical' || s.status === 'expiring_soon') || primaryActiveSub;

  // Dynamic notifications enriched with subscription alerts
  const subscriptionAlertNotifs = useMemo(() => {
    const alerts: Array<{
      id: string;
      user_id: string;
      title: string;
      message: string;
      type: 'subscription_expiring' | 'system' | 'new_codes';
      created_at: string;
      is_read: boolean;
      daysRemaining?: number;
      subId?: string;
    }> = [];

    activeSubsList.forEach(sub => {
      if (sub.status === 'critical') {
        alerts.push({
          id: `notif-sub-crit-${sub.id}`,
          user_id: currentUser.id,
          title: `🚨 Urgent: ${sub.planName} Expiring in ${sub.daysRemaining} Day(s)`,
          message: `Your VIP access for ${sub.bookmakers.join(', ')} expires on ${sub.expiresAt.toLocaleDateString()} (${sub.hoursRemaining} hours left). Renew today to maintain uninterrupted access.`,
          type: 'subscription_expiring',
          created_at: new Date().toISOString(),
          is_read: false,
          daysRemaining: sub.daysRemaining,
          subId: sub.id
        });
      } else if (sub.status === 'expiring_soon') {
        alerts.push({
          id: `notif-sub-warn-${sub.id}`,
          user_id: currentUser.id,
          title: `⚠️ ${sub.planName} Expires in ${sub.daysRemaining} Days`,
          message: `You have ${sub.daysRemaining} days of VIP membership remaining. Valid until ${sub.expiresAt.toLocaleDateString()}.`,
          type: 'subscription_expiring',
          created_at: new Date().toISOString(),
          is_read: false,
          daysRemaining: sub.daysRemaining,
          subId: sub.id
        });
      } else if (sub.status === 'active') {
        alerts.push({
          id: `notif-sub-act-${sub.id}`,
          user_id: currentUser.id,
          title: `🛡️ VIP Access Active (${sub.daysRemaining} Days Left)`,
          message: `Your subscription for ${sub.planName} (${sub.bookmakers.join(', ')}) is active and valid until ${sub.expiresAt.toLocaleDateString()}.`,
          type: 'subscription_expiring',
          created_at: new Date().toISOString(),
          is_read: false,
          daysRemaining: sub.daysRemaining,
          subId: sub.id
        });
      }
    });

    return alerts;
  }, [activeSubsList, currentUser]);

  // Notifications logic
  const myNotifications = db.notifications.filter(n => n.user_id === currentUser.id);
  const allCombinedNotifications = useMemo(() => {
    return [...subscriptionAlertNotifs, ...myNotifications];
  }, [subscriptionAlertNotifs, myNotifications]);
  const totalUnreadCount = allCombinedNotifications.filter(n => !n.is_read).length;
  const unreadCount = myNotifications.filter(n => !n.is_read).length;

  // Session toast notification alerting user on login / mount
  const hasTriggeredExpiryToastRef = useRef(false);
  useEffect(() => {
    if (hasTriggeredExpiryToastRef.current || !currentUser || currentUser.id === 'guest') return;
    hasTriggeredExpiryToastRef.current = true;

    if (soonestExpiringSub) {
      if (soonestExpiringSub.status === 'critical') {
        triggerToast(
          `🚨 URGENT: Only ${soonestExpiringSub.daysRemaining} day(s) (${soonestExpiringSub.hoursRemaining} hrs) remaining on your ${soonestExpiringSub.planName}! Renew now to maintain uninterrupted access.`,
          'error'
        );
      } else if (soonestExpiringSub.status === 'expiring_soon') {
        triggerToast(
          `⚠️ Subscription Notice: You have ${soonestExpiringSub.daysRemaining} days remaining on your ${soonestExpiringSub.planName}.`,
          'info'
        );
      } else if (soonestExpiringSub.status === 'active') {
        triggerToast(
          `🛡️ VIP Access Active: ${soonestExpiringSub.daysRemaining} days remaining on your subscription.`,
          'success'
        );
      }
    }
  }, [soonestExpiringSub, currentUser, triggerToast]);

  // Downloads history
  const myDownloads = db.user_downloads.filter(d => 
    d && (d.user_id === currentUser.id || (d.username && d.username.toLowerCase() === currentUser.username.toLowerCase()))
  );

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
      const bookie = db.bookmakers.find(b => b.id === code.bookmaker_id);
      const bookieName = bookie?.name || code.bookmaker_id.replace('bm-', '');
      if (!isBookieAllowed(bookieName)) return false;
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
              {activeSubTab === 'dashboard'
                ? 'Arena Dashboard'
                : activeSubTab === 'picks_bet9ja'
                ? 'Picks (Bet9ja)'
                : activeSubTab === 'picks_betking'
                ? 'Picks (BetKing)'
                : activeSubTab === 'picks'
                ? 'Weekly Pool Picks'
                : activeSubTab === 'comparison'
                ? 'Codes Comparison'
                : activeSubTab === 'streaming'
                ? 'Live Scores'
                : activeSubTab === 'results'
                ? 'Pool Results'
                : activeSubTab === 'subscription'
                ? 'VIP Premium'
                : 'User Profile'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 min-w-0 shrink">
          {/* Mobile Notification Bell button */}
          <button
            onClick={() => setIsNotificationDrawerOpen(true)}
            className="relative p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/50 transition cursor-pointer"
            title="Subscription Notifications & Days Remaining"
          >
            {totalUnreadCount > 0 ? (
              <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
            ) : (
              <Bell className="w-4 h-4 text-slate-400" />
            )}
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border border-slate-950">
                {totalUnreadCount}
              </span>
            )}
          </button>

          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[80px] sm:max-w-[150px]" title={currentUser?.username}>@{currentUser?.username}</span>
          <div className="w-7 h-7 rounded-full bg-slate-900 border border-emerald-550 flex items-center justify-center font-bold text-emerald-400 text-xs shrink-0">
            {(currentUser?.username?.[0] || 'U').toUpperCase()}
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
                    {(currentUser?.username?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-black text-slate-100 block truncate">@{currentUser?.username || 'user'}</span>
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

                  {/* WEEKLY POOL PICKS (BET9JA) */}
                  <button
                    onClick={() => {
                      setActiveSubTab('picks_bet9ja');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                      activeSubTab === 'picks_bet9ja'
                        ? 'bg-gradient-to-r from-emerald-555/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span>PICKS (BET9JA)</span>
                    </span>
                    {isPaidUser ? (
                      <span className="text-[8.5px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-black font-mono tracking-widest leading-none uppercase">
                        VIP
                      </span>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    )}
                  </button>

                  {/* WEEKLY POOL PICKS (BETKING) */}
                  <button
                    onClick={() => {
                      setActiveSubTab('picks_betking');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                      activeSubTab === 'picks_betking'
                        ? 'bg-gradient-to-r from-blue-500/15 to-blue-500/5 text-amber-400 border-l-4 border-amber-400 pl-2.5'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-amber-400" />
                      <span>PICKS (BETKING)</span>
                    </span>
                    {isPaidUser ? (
                      <span className="text-[8.5px] bg-amber-500/20 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded font-black font-mono tracking-widest leading-none uppercase">
                        VIP
                      </span>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    )}
                  </button>

                  {/* WEEKLY POOL PICKS (ALL / UK) */}
                  <button
                    onClick={() => {
                      setActiveSubTab('picks');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                      activeSubTab === 'picks'
                        ? 'bg-gradient-to-r from-emerald-555/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span>WEEKLY POOL PICKS</span>
                    </span>
                    {isPaidUser ? (
                      <span className="text-[8.5px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-black font-mono tracking-widest leading-none uppercase">
                        VIP
                      </span>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setActiveSubTab('comparison');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                      activeSubTab === 'comparison'
                        ? 'bg-gradient-to-r from-emerald-555/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>CODES COMPARISON</span>
                    </span>
                    <span className="text-[8.5px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-black font-mono tracking-widest leading-none uppercase">
                      FREE
                    </span>
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

                  {/* Mobile Contact Us Shortcut Card */}
                  <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[9px] font-mono font-bold text-emerald-400 tracking-wider uppercase">CONTACT FASTPOOLCODES</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Get in touch with our forecasting desk, 24/7 customer support, and enquiries team.
                    </p>
                    <a
                      href="#contact"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        if (onNavigateToContact) {
                          onNavigateToContact();
                        } else if (onNavigateToAbout) {
                          onNavigateToAbout();
                        }
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-sm cursor-pointer"
                    >
                      <span>📞 CONTACT US</span>
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
              {(currentUser?.username?.[0] || 'U').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black text-slate-100 block truncate">@{currentUser?.username || 'user'}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
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

            {/* WEEKLY POOL PICKS (BET9JA) */}
            <button
              onClick={() => setActiveSubTab('picks_bet9ja')}
              className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                activeSubTab === 'picks_bet9ja'
                  ? 'bg-gradient-to-r from-emerald-550/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
              }`}
            >
              <span className="flex items-center gap-3">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>PICKS (BET9JA)</span>
              </span>
              {isPaidUser ? (
                <span className="text-[8.5px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-black font-mono tracking-widest leading-none uppercase">
                  VIP
                </span>
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              )}
            </button>

            {/* WEEKLY POOL PICKS (BETKING) */}
            <button
              onClick={() => setActiveSubTab('picks_betking')}
              className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                activeSubTab === 'picks_betking'
                  ? 'bg-gradient-to-r from-blue-500/15 to-blue-500/5 text-amber-400 border-l-4 border-amber-400 pl-2.5'
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
              }`}
            >
              <span className="flex items-center gap-3">
                <Target className="w-4 h-4 text-amber-400" />
                <span>PICKS (BETKING)</span>
              </span>
              {isPaidUser ? (
                <span className="text-[8.5px] bg-amber-500/20 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded font-black font-mono tracking-widest leading-none uppercase">
                  VIP
                </span>
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              )}
            </button>



            <button
              onClick={() => setActiveSubTab('comparison')}
              className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 ${
                activeSubTab === 'comparison'
                  ? 'bg-gradient-to-r from-emerald-550/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 pl-2.5'
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-150'
              }`}
            >
              <span className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>CODES COMPARISON</span>
              </span>
              <span className="text-[8.5px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-black font-mono tracking-widest leading-none uppercase">
                FREE
              </span>
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

          {/* Desktop Contact Us Shortcut Card */}
          <div className="mt-4 p-3.5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase">CONTACT FASTPOOLCODES</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Need assistance? Connect directly with our 24/7 forecasting support desk and enquiries team.
            </p>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigateToContact) {
                  onNavigateToContact();
                } else if (onNavigateToAbout) {
                  onNavigateToAbout();
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:text-slate-950 transition cursor-pointer text-center"
            >
              <span>📞</span>
              <span>CONTACT US</span>
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
        
        {/* Top Desktop Action & Notification Bar */}
        <div className="hidden md:flex items-center justify-between bg-slate-900/70 border border-slate-800/80 rounded-2xl px-5 py-3.5 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-bold text-xs">
              {activeSubTab === 'dashboard' ? <Home className="w-4 h-4" /> : activeSubTab === 'picks' ? <Target className="w-4 h-4" /> : activeSubTab === 'comparison' ? <Layers className="w-4 h-4" /> : activeSubTab === 'results' ? <Trophy className="w-4 h-4" /> : activeSubTab === 'subscription' ? <CreditCard className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {activeSubTab === 'dashboard' ? 'Codes Arena Dashboard' : activeSubTab === 'picks' ? 'Weekly Pool Picks' : activeSubTab === 'comparison' ? 'Codes Comparison Matrix' : activeSubTab === 'streaming' ? 'Live Scores Arena' : activeSubTab === 'results' ? 'Pool Results Archive' : activeSubTab === 'subscription' ? 'VIP Membership & Billing' : 'Account Profile'}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded font-bold border border-slate-700/50">
                  {activeWeekNumber === 'NULL' ? 'WEEK NULL' : `WEEK ${activeWeekNumber}`}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Decrypted Football Pool Fixtures & Official Banker Pairings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Days Remaining Pill Trigger */}
            {primaryActiveSub ? (
              <button
                onClick={() => setIsNotificationDrawerOpen(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition shadow-sm cursor-pointer ${
                  primaryActiveSub.status === 'critical'
                    ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 hover:bg-rose-900/60 animate-pulse'
                    : primaryActiveSub.status === 'expiring_soon'
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                    : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                }`}
                title="Click to view subscription days remaining breakdown & alerts"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {primaryActiveSub.daysRemaining > 0
                    ? `${primaryActiveSub.daysRemaining} Days VIP Left`
                    : 'VIP Expired'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              </button>
            ) : (
              <button
                onClick={() => setActiveSubTab('subscription')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-500/30 text-amber-300 hover:bg-slate-900 text-xs font-mono font-bold transition cursor-pointer"
                title="Upgrade to VIP membership"
              >
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>Free Trial Tier</span>
              </button>
            )}

            {/* Quick Manual Fetch Latest Records Button in Top Bar */}
            <button
              onClick={async () => {
                if (fetchRealSupabaseData) {
                  triggerToast('Fetching latest records from database...', 'info');
                  await fetchRealSupabaseData(true);
                  triggerToast('Database refreshed with latest verified records!', 'success');
                }
              }}
              disabled={isSyncingSupabase}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-white hover:bg-emerald-900/90 text-xs font-mono font-bold transition cursor-pointer shadow-md active:scale-95"
              title="Fetch latest verified records from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncingSupabase ? 'Fetching...' : 'Fetch Latest Records'}</span>
            </button>

            {/* Notification Bell Button with Glow & Unread Count */}
            <button
              onClick={() => setIsNotificationDrawerOpen(true)}
              className="relative p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/50 hover:bg-slate-900 transition cursor-pointer flex items-center justify-center shadow-sm"
              title="Notifications & Subscription Center"
            >
              {totalUnreadCount > 0 ? (
                <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
              ) : (
                <Bell className="w-4 h-4 text-slate-400" />
              )}
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-slate-950 shadow-md">
                  {totalUnreadCount}
                </span>
              )}
            </button>

            {/* VIP Quick Upgrade CTA */}
            {(!primaryActiveSub || primaryActiveSub.status === 'critical' || primaryActiveSub.status === 'expired') && (
              <button
                onClick={() => setActiveSubTab('subscription')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>{primaryActiveSub?.status === 'critical' ? 'Renew VIP' : 'Upgrade VIP'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Subtle Compact Google AdSense Unit */}
        <GoogleAdBanner 
          compact={true}
          adFormat="horizontal"
          fullWidthResponsive={false}
          className="bg-slate-900/40 border border-slate-800/60 rounded-xl px-3 py-1 max-w-2xl mx-auto my-2" 
        />



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
              
              {isLockedOut && activeSubTab === 'results' ? (
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
                      {!isLoggedIn ? 'AUTHENTICATION REQUIRED' : isSubscriptionExpired ? 'PREMIUM ACCESS EXPIRED' : 'STRICT MODE: PAID VIP REQUIRED'}
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                      {!isLoggedIn ? 'Please Log In To Access Tables' : isSubscriptionExpired ? 'Your Subscription Has Expired!' : 'Paid VIP Membership Required!'}
                    </h3>
                  </div>

                  <div className="w-full max-w-md mt-2">
                    <button
                      onClick={() => setActiveSubTab('subscription')}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{isSubscriptionExpired ? 'Renew Subscription' : 'Upgrade to VIP'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* SUBTAB 1: SPORT CODES DASHBOARD CONTAINER */}
                  {activeSubTab === 'dashboard' && (
                <div className="flex flex-col gap-6">
                  {/* Free-tier Dashboard Welcome & Table Subscription Notice */}
                  {activePlan?.id === 'plan-free' && !bypassPremium && (
                    <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-[#0F172A] border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                          <UserIcon className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-100 uppercase font-mono tracking-wide">
                              Signed In as @{currentUser.username}
                            </span>
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold uppercase">
                              Dashboard Active
                            </span>
                          </div>
                          <p className="text-[11.5px] text-slate-300 mt-1 leading-snug">
                            Welcome to your User Dashboard! You have access to all dashboard tools. To view and download decrypted pool codes for specific bookmaker tables (Nigeria: Bet9ja, BetKing, SportyBet, MSport; Ghana: Betway Ghana, PremierBet Ghana, Soccabet Ghana, SportyBet Ghana), please subscribe to your preferred pool code tables below.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveSubTab('subscription')}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md shrink-0 flex items-center gap-1.5 font-mono"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Subscribe to Tables</span>
                      </button>
                    </div>
                  )}
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

                  {/* SLEEK COMPACT DASHBOARD CAROUSEL */}
                  {dashboardBlogs.length > 0 && (() => {
                    const currentBlog = dashboardBlogs[activeCarouselIdx] || dashboardBlogs[0];
                    return (
                      <div 
                        onMouseEnter={() => setIsCarouselHovered(true)}
                        onMouseLeave={() => setIsCarouselHovered(false)}
                        className="bg-white dark:bg-[#111827] border border-zinc-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition duration-300 group relative"
                      >
                        <div className="flex flex-col sm:flex-row items-stretch">
                          {/* Compact Left Banner Image (Height constrained to h-40 on mobile, h-44 on desktop) */}
                          <div 
                            onClick={() => setSelectedDashboardArticle(currentBlog)}
                            className="w-full sm:w-64 md:w-80 h-36 sm:h-44 shrink-0 relative bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 overflow-hidden cursor-pointer select-none"
                          >
                            <AnimatePresence mode="wait">
                              <motion.img 
                                key={`compact_img_${currentBlog.id || activeCarouselIdx}`}
                                src={currentBlog.image_url} 
                                alt={currentBlog.title}
                                referrerPolicy="no-referrer"
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 0.9, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80';
                                }}
                                className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500"
                              />
                            </AnimatePresence>

                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none"></div>

                            {/* Badge */}
                            <div className="absolute top-2.5 left-2.5 pointer-events-auto">
                              <span className="bg-[#fa3e65] text-white text-[9px] font-black px-2 py-0.5 rounded shadow tracking-widest uppercase">
                                {currentBlog.badge || '★ FEATURED'}
                              </span>
                            </div>

                            {/* Navigation controls on image */}
                            {dashboardBlogs.length > 1 && (
                              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveCarouselIdx((prev) => (prev - 1 + dashboardBlogs.length) % dashboardBlogs.length);
                                  }}
                                  aria-label="Previous article"
                                  className="w-6 h-6 rounded-full bg-black/70 hover:bg-black/95 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition cursor-pointer active:scale-90"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveCarouselIdx((prev) => (prev + 1) % dashboardBlogs.length);
                                  }}
                                  aria-label="Next article"
                                  className="w-6 h-6 rounded-full bg-black/70 hover:bg-black/95 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition cursor-pointer active:scale-90"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Compact Right Content Area */}
                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between text-left gap-2 min-w-0">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded font-mono uppercase tracking-wide">
                                    {currentBlog.category || 'ARTICLE'}
                                  </span>
                                  <span className="text-slate-400 text-[11px] font-semibold font-mono">
                                    {currentBlog.date}
                                  </span>
                                </div>

                                {/* Step Dots Indicator */}
                                {dashboardBlogs.length > 1 && (
                                  <div className="flex items-center gap-1">
                                    {dashboardBlogs.map((b: any, idx: number) => (
                                      <button
                                        key={`dot_compact_${b.id || idx}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveCarouselIdx(idx);
                                        }}
                                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                          activeCarouselIdx === idx ? 'w-4 bg-[#FA3E65]' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                                        }`}
                                        title={`Go to Blog ${idx + 1}`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>

                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={`compact_text_${currentBlog.id || activeCarouselIdx}`}
                                  initial={{ opacity: 0, y: 3 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -3 }}
                                  transition={{ duration: 0.25 }}
                                  className="space-y-1"
                                >
                                  <h2 
                                    onClick={() => setSelectedDashboardArticle(currentBlog)}
                                    className="font-sans font-black text-zinc-900 dark:text-white text-sm sm:text-base tracking-tight leading-snug group-hover:text-[#fa3e65] transition cursor-pointer line-clamp-1"
                                  >
                                    {currentBlog.title}
                                  </h2>
                                  <p 
                                    onClick={() => setSelectedDashboardArticle(currentBlog)}
                                    className="text-zinc-600 dark:text-slate-400 font-normal text-xs leading-relaxed cursor-pointer line-clamp-2"
                                  >
                                    {currentBlog.summary}
                                  </p>
                                </motion.div>
                              </AnimatePresence>
                            </div>

                            {/* Compact Action Footer */}
                            <div className="pt-2 border-t border-zinc-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-slate-400">
                              <div 
                                onClick={() => setSelectedDashboardArticle(currentBlog)}
                                className="flex items-center gap-2 cursor-pointer hover:text-emerald-400 transition text-[11px]"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="font-bold text-slate-300">Read Article</span>
                                <span>•</span>
                                <span className="text-rose-400 font-mono font-bold text-[10px]">{currentBlog.readTime}</span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (navigator.clipboard) {
                                    navigator.clipboard.writeText(window.location.href);
                                    triggerToast('Article link copied to clipboard!', 'success');
                                  } else {
                                    triggerToast(`Share: ${currentBlog.title}`, 'info');
                                  }
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-zinc-700 rounded-lg transition text-[10px] font-bold uppercase cursor-pointer border border-zinc-200 dark:border-slate-700 active:scale-95"
                                title="Share Article"
                              >
                                <Share2 className="w-3 h-3 text-rose-500" />
                                <span>Share</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* LIVE ARENA SPORTS SCORE TICKER (FULLY RESPONSIVE & MOBILE SWEET SWIPER) */}
                  <div className="bg-[#111827] rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FA3E65] animate-ping shrink-0"></span>
                        <h2 className="text-xs font-black font-sans uppercase tracking-widest text-[#FA3E65] flex items-center gap-1.5">
                          LIVESCORES
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

                          let typeStr = '';
                          let typeColor = 'text-slate-500';
                          if (isLiveStatus) {
                            typeStr = match.minute ? `${match.minute}' LIVE` : 'LIVE';
                            typeColor = 'text-[#FA3E65]';
                          } else if (isFinished) {
                            typeStr = 'FT';
                            typeColor = 'text-emerald-400';
                          } else if (isPostponed) {
                            typeStr = 'PPD';
                            typeColor = 'text-amber-500';
                          } else if (match.time || match.kickoff) {
                            typeStr = match.time || match.kickoff;
                            typeColor = 'text-slate-500';
                          }

                          return (
                            <div 
                              key={`live_match_portal_${idx}_${match.id || ''}`}
                              onClick={() => triggerToast(`Match Details: ${team1} vs ${team2}${typeStr ? ` (${typeStr})` : ''}`, 'info')}
                              className="flex items-center bg-[#070B14] border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-2.5 transition cursor-pointer gap-4 text-left shadow-md select-none shrink-0"
                            >
                              <div className="flex flex-col justify-center">
                                {typeStr ? (
                                  <span className={`text-[9px] font-mono font-black tracking-widest ${typeColor}`}>
                                    {typeStr}
                                  </span>
                                ) : null}
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
                    <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center w-full min-w-0">
                      
                      {/* Bookmaker Selector Tabs */}
                      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0 max-w-full">
                        <span className="text-xs font-mono text-slate-400 mr-1 hidden sm:inline">BOOKMAKER:</span>
                        {(() => {
                          const mergedBookmakers = getMergedBookmakers(db.bookmakers).filter(b => b && b.is_active !== false);
                          const setNames = new Map<string, string>();
                          mergedBookmakers.forEach(b => {
                            if (b && b.name) {
                              const normKey = b.name.toLowerCase().trim();
                              if (!setNames.has(normKey)) setNames.set(normKey, b.name.trim());
                            }
                          });
                          postedGames.forEach(g => {
                            if (g && g.bookmaker) {
                              const normKey = g.bookmaker.toLowerCase().trim();
                              if (!setNames.has(normKey)) setNames.set(normKey, g.bookmaker.trim());
                            }
                          });
                          let allBookies = Array.from(setNames.values());
                          if (allBookies.length === 0) {
                            allBookies = ['Bet9ja', 'BetKing', 'SportyBet', 'PremierBet Ghana', 'Betway Ghana', 'Soccabet Ghana', 'SportyBet Ghana', 'MSport'];
                          }
                          return (
                            <>
                              <button
                                key="bookie_filter_tab_pool_codes_comparison"
                                disabled={isSyncingSupabase}
                                onClick={async () => {
                                  setDashboardBookmakerFilter('Pool Codes Comparison');
                                  if (fetchRealSupabaseData) {
                                    await fetchRealSupabaseData(true);
                                  }
                                }}
                                className={`px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wide rounded-lg transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                                  dashboardBookmakerFilter.toLowerCase().includes('comparison')
                                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                    : 'bg-slate-900 text-amber-400 hover:bg-slate-800 border border-amber-500/30'
                                }`}
                              >
                                <span className="text-[11px]">⚡</span>
                                <span>Comparison (Free)</span>
                              </button>
                              {allBookies.map((bookie, bIdx) => {
                                const isSelected = dashboardBookmakerFilter.toLowerCase().trim() === bookie.toLowerCase().trim();
                                const isSubscribed = isBookieAllowed(bookie);
                                return (
                                  <button
                                    key={`bookie_filter_tab_${bookie.toLowerCase().replace(/[^a-z0-9]/g, '')}_${bIdx}`}
                                    disabled={isSyncingSupabase}
                                    onClick={async () => {
                                      setDashboardBookmakerFilter(bookie);
                                      if (fetchRealSupabaseData) {
                                        await fetchRealSupabaseData(true);
                                      }
                                    }}
                                    className={`px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wide rounded-lg transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                                      isSelected
                                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                        : isSubscribed
                                        ? 'bg-slate-900 text-emerald-400 hover:bg-slate-800 border border-emerald-500/30'
                                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800 opacity-90'
                                    } ${isSyncingSupabase ? 'opacity-80' : ''}`}
                                  >
                                    {isSyncingSupabase && isSelected && (
                                      <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    )}
                                    <span className="text-[11px]">{isSubscribed ? '🔓' : '🔒'}</span>
                                    <span>{bookie}</span>
                                  </button>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>

                      {/* Right-aligned Actions */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto shrink-0 justify-start xl:justify-end">
                        {/* Download PDF Customizer Button with Strict Table Access Check */}
                        {(() => {
                          const isTableAllowed = isBookieAllowed(dashboardBookmakerFilter);
                          if (isTableAllowed) {
                            return (
                              <button
                                onClick={() => {
                                  setPdfConfig(prev => ({
                                    ...prev,
                                    bookmakerFilter: dashboardBookmakerFilter || 'Bet9ja'
                                  }));
                                  setShowPdfPrintModal(true);
                                }}
                                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 shrink-0 font-mono"
                                title={`Download official ${dashboardBookmakerFilter} PDF`}
                              >
                                <Download className="w-4 h-4" />
                                <span>Download PDF</span>
                              </button>
                            );
                          }
                          return (
                            <button
                              onClick={() => {
                                triggerToast(`Access Restricted: @${currentUser.username} (ID: ${currentUser.id}) has not purchased access to the ${dashboardBookmakerFilter} Table in plan_purchased.`, 'error');
                                setActiveSubTab('subscription');
                              }}
                              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 active:scale-95 text-amber-400 border border-amber-500/30 hover:border-amber-500/60 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shrink-0 font-mono"
                              title={`Subscription required to download ${dashboardBookmakerFilter} PDF`}
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Download PDF (Locked)</span>
                            </button>
                          );
                        })()}

                        {/* Direct Fetch Latest Records Button above Table */}
                        <button
                          onClick={async () => {
                            if (fetchRealSupabaseData) {
                              triggerToast(`Fetching latest ${dashboardBookmakerFilter} records from database...`, 'info');
                              await fetchRealSupabaseData(true);
                              triggerToast(`Updated with latest records for ${dashboardBookmakerFilter}!`, 'success');
                            }
                          }}
                          disabled={isSyncingSupabase}
                          className="px-4 py-2.5 bg-emerald-950/80 hover:bg-emerald-900 active:scale-95 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shrink-0 font-mono"
                          title={`Fetch latest ${dashboardBookmakerFilter} records from database`}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
                          <span>{isSyncingSupabase ? 'Fetching...' : 'Fetch Latest Records'}</span>
                        </button>
                      </div>
                    </div>

                    {/* THE TABLE CANVAS CONTAINER (COUPON RENDERER) */}
                    <div>
                      {(() => {
                        if (dashboardBookmakerFilter.toLowerCase().includes('comparison')) {
                          return (
                            <div className="pt-1">
                              <PoolCodesComparisonTable
                                comparisonRows={db.pool_codes_comparison}
                                triggerToast={triggerToast}
                                currentUser={currentUser}
                                onOpenVipSubscription={() => setActiveSubTab('subscription')}
                              />
                            </div>
                          );
                        }

                        const isTabAllowed = isBookieAllowed(dashboardBookmakerFilter);

                        if (!isTabAllowed) {
                          return (
                            <div className="p-8 text-center flex flex-col items-center justify-center bg-slate-950/60 border border-slate-800 rounded-2xl py-14 my-4 shadow-2xl relative overflow-hidden">
                              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-4 text-amber-400 shadow-inner">
                                <Lock className="w-8 h-8 animate-pulse text-amber-400" />
                              </div>
                              <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest px-3 py-1 bg-amber-950/40 border border-amber-900/50 rounded-full mb-3">
                                TABLE ACCESS RESTRICTED
                              </span>
                              <h3 className="text-xl font-extrabold text-slate-100 uppercase tracking-tight font-mono">
                                {dashboardBookmakerFilter} Pool Code Table Locked
                              </h3>
                              <p className="text-xs text-slate-300 max-w-lg mt-3 leading-relaxed font-sans">
                                You are signed in as <strong className="text-emerald-400 font-bold">@{currentUser.username}</strong>. Signing up gives you full access to the User Dashboard, but viewing or downloading the <strong className="text-amber-400 font-bold">{dashboardBookmakerFilter}</strong> pool code table requires a subscription to this table.
                              </p>
                              <button
                                onClick={() => {
                                  setActiveSubTab('subscription');
                                  triggerToast(`Select and subscribe to the ${dashboardBookmakerFilter} pool code table!`, 'info');
                                }}
                                className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl uppercase transition tracking-wider shadow-lg shadow-emerald-950/50 cursor-pointer flex items-center gap-2"
                              >
                                <CreditCard className="w-4 h-4" />
                                <span>Subscribe to {dashboardBookmakerFilter} Pool Code Table</span>
                              </button>
                            </div>
                          );
                        }

                        const normStr = (s: string) => (s || '').replace(/\s+/g, '').toLowerCase();
                        const targetBookieNorm = normStr(dashboardBookmakerFilter);

                        const filteredList = postedGames.filter(game => {
                          const gameBookieNorm = normStr(game.bookmaker);
                          const gameSourceNorm = normStr(game.sourceTable || '');
                          
                          // Match if either bookmaker name or source table matches selected tab
                          const matchesBookie = gameBookieNorm === targetBookieNorm || gameSourceNorm === targetBookieNorm;
                          if (!matchesBookie) return false;

                          const matchesSearch = dashboardGameSearch === '' ||
                            game.home.toLowerCase().includes(dashboardGameSearch.toLowerCase()) ||
                            game.away.toLowerCase().includes(dashboardGameSearch.toLowerCase()) ||
                            game.betCode.toLowerCase().includes(dashboardGameSearch.toLowerCase()) ||
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
                                <div className="p-12 text-center flex items-center justify-center">
                                  <p className={`text-sm font-mono ${isPaperMode ? 'text-gray-600' : 'text-slate-400'}`}>
                                    No rows to display
                                  </p>
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
                                      <th className={`px-2 py-2.5 sm:px-3 sm:py-3 text-center border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950 font-black text-slate-900' : 'border-slate-800 text-sky-400'}`}>LEAGUE</th>
                                      <th className={`px-2.5 py-2.5 sm:px-4 sm:py-3 text-left border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950 font-black' : 'border-slate-800'}`}>HOME</th>
                                      <th className={`px-2.5 py-2.5 sm:px-4 sm:py-3 text-left border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950 font-black' : 'border-slate-800'}`}>AWAY</th>
                                      <th className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950' : 'border-slate-800'}`}>HOME WIN</th>
                                      <th className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950 bg-amber-100 text-amber-950' : 'border-slate-800'}`}>DRAW (X)</th>
                                      <th className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950' : 'border-slate-800'}`}>AWAY WIN</th>
                                      <th className={`px-2 py-2.5 sm:px-3 sm:py-3 text-center border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950 font-bold text-emerald-800' : 'border-slate-800 text-amber-400'}`}>BET Tips</th>
                                      <th className={`px-2 py-2.5 sm:px-3 sm:py-3 text-center border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950' : 'border-slate-800'}`}>STATUS</th>
                                      <th className={`px-2 py-2.5 sm:px-3 sm:py-3 text-center border-r font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950' : 'border-slate-800'}`}>KICK OFF</th>
                                      <th className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center font-bold transition-all duration-300 ${isPaperMode ? 'border-slate-950 font-black text-indigo-900' : 'text-indigo-400'}`}>WEEK NO</th>
                                      
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
                                          <span className={game.poolNo === 'NULL' ? 'text-slate-500 font-mono italic text-xs' : ''}>{game.poolNo}</span>
                                        </td>
                                        
                                        {/* BET CODE */}
                                        <td className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center font-bold border-r transition-all duration-300 ${
                                          isPaperMode 
                                            ? 'border-r border-slate-950 text-[#C21C2F] text-base font-black' 
                                            : 'border-r border-slate-800/60 text-amber-400 font-extrabold bg-slate-950/40'
                                        }`}>
                                          <span className="flex items-center justify-center gap-1">
                                            <span className={game.betCode === 'NULL' ? 'text-slate-500 font-mono italic text-xs' : ''}>{game.betCode}</span>
                                            {game.betCode !== 'NULL' && (
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
                                            )}
                                          </span>
                                        </td>

                                         {/* LEAGUE */}
                                         <td className={`px-2 py-2 sm:px-3 sm:py-2.5 text-center border-r transition-all duration-300 ${
                                           isPaperMode ? 'border-r border-slate-950 text-slate-900 font-bold' : 'border-r border-slate-800/60'
                                         }`}>
                                           <span className={`inline-block px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate max-w-[130px] ${
                                             game.league === 'NULL'
                                               ? (isPaperMode ? 'text-slate-400 font-mono italic' : 'text-slate-500 font-mono italic')
                                               : (isPaperMode 
                                                   ? 'bg-slate-200 text-slate-900 border border-slate-400 font-black' 
                                                   : 'bg-sky-950/40 text-sky-300 border border-sky-500/30')
                                           }`}>
                                             {game.league}
                                           </span>
                                         </td>

                                        {/* HOME NAME */}
                                        <td className={`px-2.5 py-2.5 sm:px-4 sm:py-3 text-left font-bold border-r transition-all duration-300 ${
                                          isPaperMode ? 'border-r border-slate-950 text-sm font-black text-slate-950 uppercase' : 'border-r border-slate-800/60 font-semibold'
                                        }`}>
                                          <span className={game.home === 'NULL' ? 'text-slate-500 font-mono italic text-xs' : ''}>{game.home}</span>
                                        </td>

                                        {/* AWAY NAME */}
                                        <td className={`px-2.5 py-2.5 sm:px-4 sm:py-3 text-left font-bold border-r transition-all duration-300 ${
                                          isPaperMode ? 'border-r border-slate-950 text-sm font-black text-slate-950 uppercase' : 'border-r border-slate-800/60 font-semibold'
                                        }`}>
                                          <span className={game.away === 'NULL' ? 'text-slate-500 font-mono italic text-xs' : ''}>{game.away}</span>
                                        </td>

                                        {/* HOME WIN ODDS */}
                                        <td className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center border-r transition-all duration-300 ${
                                          isPaperMode ? 'border-r border-slate-950 text-gray-800' : 'border-r border-slate-800/60 font-mono text-slate-400'
                                        }`}>
                                          <span className={game.homeWin === 'NULL' ? 'text-slate-500 font-mono italic text-[10px]' : ''}>{game.homeWin}</span>
                                        </td>

                                        {/* DRAW (X) ODDS */}
                                        <td className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center border-r font-bold transition-all duration-300 ${
                                          isPaperMode 
                                            ? 'border-r border-slate-950 bg-[#FFFFE3] text-[#0F172A] font-black' 
                                            : 'border-r border-slate-800/60 bg-emerald-950/15 text-emerald-400 font-extrabold'
                                        }`}>
                                          <span className={game.draw === 'NULL' ? 'text-slate-500 font-mono italic text-[10px]' : ''}>{game.draw}</span>
                                        </td>

                                        {/* AWAY WIN ODDS */}
                                        <td className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center border-r transition-all duration-300 ${
                                          isPaperMode ? 'border-r border-slate-950 text-gray-800' : 'border-r border-slate-800/60 font-mono text-slate-400'
                                        }`}>
                                          <span className={game.awayWin === 'NULL' ? 'text-slate-500 font-mono italic text-[10px]' : ''}>{game.awayWin}</span>
                                        </td>

                                        {/* BET TIPS */}
                                        <td className={`px-2 py-2 sm:px-3 sm:py-2.5 text-center font-bold border-r transition-all duration-300 ${
                                          isPaperMode 
                                            ? 'border-r border-slate-950 text-emerald-950 font-extrabold' 
                                            : 'border-r border-slate-800/60 font-black text-amber-400'
                                        }`}>
                                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${
                                            game.betTips === 'NULL'
                                              ? (isPaperMode ? 'text-slate-400 font-mono italic' : 'text-slate-500 font-mono italic')
                                              : (isPaperMode 
                                                  ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' 
                                                  : 'bg-amber-400/15 text-amber-300 border border-amber-400/30')
                                          }`}>
                                            {game.betTips}
                                          </span>
                                        </td>

                                        {/* STATUS */}
                                        <td className={`px-2 py-2.5 sm:px-3 sm:py-3 text-center border-r font-semibold transition-all duration-300 ${
                                          isPaperMode ? 'border-r border-slate-950 text-gray-800' : 'border-r border-slate-800/60 font-mono'
                                        }`}>
                                          <span className={game.status === 'NULL' ? 'text-slate-500 font-mono italic text-[10px]' : ''}>{game.status}</span>
                                        </td>

                                        {/* KICK OFF */}
                                        <td className={`px-2 py-2.5 sm:px-3 sm:py-3 text-center border-r font-bold transition-all duration-300 ${
                                          isPaperMode ? 'border-r border-slate-950 text-slate-950' : 'border-r border-slate-800/60 font-mono text-slate-300'
                                        }`}>
                                          <div className="flex items-center justify-center gap-1.5">
                                            <span className={game.kickOff === 'NULL' ? 'text-slate-500 font-mono italic text-[10px]' : ''}>{game.kickOff}</span>
                                            {currentUser.role === 'admin' && (
                                              <button
                                                onClick={() => handleDeleteGame(game.id, `${game.home} vs ${game.away}`)}
                                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 text-xs px-1 transition"
                                                title="Delete fixture"
                                              >
                                                ✕
                                              </button>
                                            )}
                                          </div>
                                        </td>

                                        {/* WEEK NO */}
                                        <td className={`px-1.5 py-2.5 sm:px-2 sm:py-3 text-center font-bold transition-all duration-300 ${
                                          isPaperMode ? 'text-slate-950 font-black' : 'font-mono text-indigo-400'
                                        }`}>
                                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold ${
                                            game.weekNo === 'NULL'
                                              ? (isPaperMode ? 'text-slate-400 font-mono italic' : 'text-slate-500 font-mono italic')
                                              : (isPaperMode
                                                  ? 'bg-slate-200 text-slate-950 font-black'
                                                  : 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/30')
                                          }`}>
                                            {game.weekNo}
                                          </span>
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
                              {getMergedBookmakers(db.bookmakers)
                                .filter(b => b && b.is_active !== false)
                                .map((b, idx) => (
                                  <option key={`admin_bmk_opt_${b.id || b.slug || b.name}_${idx}`} value={b.name}>
                                    {b.name} ({isGhanaBookmaker(b) ? 'Ghana' : 'Nigeria'})
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div className="flex items-end">
                            <button
                              type="submit"
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg transition cursor-pointer"
                            >
                              ⚡ POST TO LIVE BULLETIN
                            </button>
                          </div>
                        </form>

                        {/* ADMIN SECTION: REGISTER NEW BOOKMAKER BRAND */}
                        <div className="mt-4 pt-4 border-t border-slate-800">
                          <h5 className="text-xs font-black font-mono text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <span>➕ REGISTER NEW BOOKMAKER BRAND</span>
                          </h5>
                          <form onSubmit={handleAddBookmaker} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
                            <div>
                              <label className="block text-slate-400 mb-1">BOOKMAKER NAME</label>
                              <input
                                type="text"
                                value={newBmkName}
                                onChange={(e) => {
                                  setNewBmkName(e.target.value);
                                  if (!newBmkSlug) {
                                    setNewBmkSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                                  }
                                }}
                                placeholder="e.g. 1xBet"
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-slate-400 mb-1">SYSTEM SLUG</label>
                              <input
                                type="text"
                                value={newBmkSlug}
                                onChange={(e) => setNewBmkSlug(e.target.value)}
                                placeholder="e.g. 1xbet"
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-slate-400 mb-1 text-amber-300">TARGET COUNTRY</label>
                              <select
                                value={newBmkCountry}
                                onChange={(e) => setNewBmkCountry(e.target.value as 'Nigeria' | 'Ghana')}
                                className="w-full bg-slate-950 border border-amber-500/50 rounded px-2.5 py-1.5 text-white"
                              >
                                <option value="Nigeria">🇳🇬 Nigeria</option>
                                <option value="Ghana">🇬🇭 Ghana</option>
                              </select>
                            </div>

                            <div className="flex items-end">
                              <button
                                type="submit"
                                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-1.5 px-3 rounded transition uppercase text-xs cursor-pointer"
                              >
                                ➕ ADD BOOKMAKER
                              </button>
                            </div>
                          </form>
                        </div>
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
                const bookieObj = associatedCode ? db.bookmakers.find(b => b.id === associatedCode.bookmaker_id) : null;
                const targetBookieName = bookieObj?.name || bookmakerSlug;
                const hasComponentAccess = !isPremium || currentUser.role === 'admin' || bypassPremium || isBookieAllowed(targetBookieName);

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
                                            <span className="text-xs text-slate-100 font-mono font-black mt-1 block">A365-LNK-{(associatedCode?.id || '').toUpperCase()}</span>
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

              {/* SUBTAB: WEEKLY POOL PICKS (BET9JA) */}
              {activeSubTab === 'picks_bet9ja' && (
                <div className="flex flex-col gap-6" id="weekly-pool-picks-bet9ja-container">
                  <WeeklyPoolPicksTable
                    currentUser={currentUser}
                    activePlan={activePlan}
                    isPaidUser={isPaidUser}
                    bypassPremium={bypassPremium}
                    activeWeekNumber={activeWeekNumber}
                    triggerToast={triggerToast}
                    onUpgradeClick={() => setActiveSubTab('subscription')}
                    tableName="weekly pool picks(Bet9ja)"
                    tableDisplayName="Weekly Pool Picks (Bet9ja)"
                    bookmakerBrand="bet9ja"
                  />
                </div>
              )}

              {/* SUBTAB: WEEKLY POOL PICKS (BETKING) */}
              {activeSubTab === 'picks_betking' && (
                <div className="flex flex-col gap-6" id="weekly-pool-picks-betking-container">
                  <WeeklyPoolPicksTable
                    currentUser={currentUser}
                    activePlan={activePlan}
                    isPaidUser={isPaidUser}
                    bypassPremium={bypassPremium}
                    activeWeekNumber={activeWeekNumber}
                    triggerToast={triggerToast}
                    onUpgradeClick={() => setActiveSubTab('subscription')}
                    tableName="weekly pool picks(betking)"
                    tableDisplayName="Weekly Pool Picks (BetKing)"
                    bookmakerBrand="betking"
                  />
                </div>
              )}

              {/* SUBTAB: WEEKLY POOL PICKS (GENERAL / ALL) */}
              {activeSubTab === 'picks' && (
                <div className="flex flex-col gap-6" id="weekly-pool-picks-tab-container">
                  <WeeklyPoolPicksTable
                    currentUser={currentUser}
                    activePlan={activePlan}
                    isPaidUser={isPaidUser}
                    bypassPremium={bypassPremium}
                    activeWeekNumber={activeWeekNumber}
                    triggerToast={triggerToast}
                    onUpgradeClick={() => setActiveSubTab('subscription')}
                    tableName="weekly pool picks"
                    tableDisplayName="Weekly Pool Picks"
                    bookmakerBrand="general"
                  />
                </div>
              )}

              {/* SUBTAB: POOL CODES COMPARISON (FREE TO ALL USERS) */}
              {activeSubTab === 'comparison' && (
                <div className="flex flex-col gap-6" id="pool-codes-comparison-section">
                  <PoolCodesComparisonTable
                    comparisonRows={db.pool_codes_comparison}
                    triggerToast={triggerToast}
                    currentUser={currentUser}
                    onOpenVipSubscription={() => setActiveSubTab('subscription')}
                  />
                </div>
              )}

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
                                    {isLiveStatus ? (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-black tracking-widest bg-emerald-950/70 text-emerald-400 border border-emerald-900/40">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                        <span>LIVE</span>
                                      </span>
                                    ) : isFinished ? (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-black tracking-widest bg-slate-850 text-slate-400">
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span>FT</span>
                                      </span>
                                    ) : isPostponed ? (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-black tracking-widest bg-amber-950/60 text-amber-500 border border-amber-900/30">
                                        <span>PPD</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-600 font-mono text-[11px]">-</span>
                                    )}
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

                  {/* Live Match Comments & Fan Discussions */}
                  <LiveScoresComments
                    currentUser={currentUser}
                    triggerToast={triggerToast}
                  />

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
                const effectiveWeek = (activeWeekNumber && activeWeekNumber !== 'NULL') ? activeWeekNumber : '49';
                const uniqueSeasons = Array.from(new Set(poolResults.map((r: any) => String(r.season_year || 2026)))).sort();
                const uniqueWeeks = Array.from(new Set(poolResults.map((r: any) => Number((activeWeekNumber && activeWeekNumber !== 'NULL') ? activeWeekNumber : (r.week_number || 49))))).sort((a: any, b: any) => Number(a) - Number(b));

                const filteredResults = poolResults.map((sheet: any) => {
                  const resolvedWeek = (activeWeekNumber && activeWeekNumber !== 'NULL') ? Number(activeWeekNumber) : (sheet.week_number || 49);
                  return {
                    ...sheet,
                    week_number: resolvedWeek,
                    title: sheet.title ? sheet.title.replace(/Week\s*\d+/i, `Week ${resolvedWeek}`) : `Week ${resolvedWeek} UK Pool results: Official pool_result Table Matches`
                  };
                }).filter((sheet: any) => {
                  if (filterSeason !== 'all') {
                    if (String(sheet.season_year || 2026) !== filterSeason) return false;
                  }
                  if (filterWeek !== 'all') {
                    if (String(sheet.week_number || 49) !== filterWeek) return false;
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
                    {/* Selector & Search Filters Bar */}
                    <div className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                      {/* Week Select Dropdown */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                          Select Pool Results Sheet
                        </label>
                        <div className="relative">
                          <select
                            value={activeResult ? activeResult.id : ''}
                            onChange={(e) => {
                              setSelectedResultId(e.target.value);
                              setChampionshipSearchQuery('');
                            }}
                            className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 transition cursor-pointer appearance-none pr-10"
                          >
                            {filteredResults.map((res: any) => {
                              const draws = (res.results_table || []).filter((x: any) => {
                                const st = x.status || '';
                                return st === 'ScoreDraw' || st === 'noScoreDraw';
                              }).length;
                              const wkDisplay = (activeWeekNumber && activeWeekNumber !== 'NULL') ? activeWeekNumber : (res.week_number || 49);
                              const titleDisplay = (res.title || `Week ${wkDisplay} UK Pool results`).replace(/Week\s*\d+/i, `Week ${wkDisplay}`);
                              return (
                                <option key={res.id} value={res.id} className="bg-slate-950 text-white py-2">
                                  WEEK {wkDisplay} • Year {res.season_year || 2026} ({res.pool_type?.toUpperCase() || 'UK'}) — {titleDisplay} [{draws} Draws]
                                </option>
                              );
                            })}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-emerald-400">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Quick Fixtures & Teams Search Input */}
                      <div className="w-full md:w-80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            Filter Fixtures / Teams
                          </label>
                          {activeResult && (
                            <button
                              onClick={() => exportResultToCSV(activeResult)}
                              className="text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition"
                              title="Download spreadsheet in CSV format"
                            >
                              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                              <span>CSV Export</span>
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Filter by team, status or match ID..."
                            value={championshipSearchQuery}
                            onChange={(e) => setChampionshipSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono placeholder:text-slate-600"
                          />
                          {championshipSearchQuery && (
                            <button
                              onClick={() => setChampionshipSearchQuery('')}
                              className="absolute right-3 top-2.5 text-[10px] text-slate-400 hover:text-white uppercase font-mono font-bold"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Summary Quick Stats Bar */}
                    {activeResult && (() => {
                      const baseRows = activeResult.results_table || [];
                      let scoreDraws = 0;
                      let noScoreDraws = 0;
                      let homeWins = 0;
                      let awayWins = 0;
                      baseRows.forEach((r: any) => {
                        const status = r.status || '';
                        if (status === 'ScoreDraw') scoreDraws++;
                        else if (status === 'noScoreDraw') noScoreDraws++;
                        else if (status === 'Home') homeWins++;
                        else if (status === 'Away') awayWins++;
                        else {
                          // Fallback check
                          if (r.pool_result === '0-:-0') noScoreDraws++;
                          else scoreDraws++;
                        }
                      });

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
                          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL MATCHES</span>
                            <span className="text-lg font-black text-white mt-1">{baseRows.length}</span>
                          </div>
                          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3 flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">SCORE DRAWS</span>
                            <span className="text-lg font-black text-emerald-300 mt-1">{scoreDraws}</span>
                          </div>
                          <div className="bg-teal-950/20 border border-teal-900/40 rounded-xl p-3 flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">NO-SCORE DRAWS</span>
                            <span className="text-lg font-black text-teal-300 mt-1">{noScoreDraws}</span>
                          </div>
                          <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-3 flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">HOME WINS</span>
                            <span className="text-lg font-black text-blue-300 mt-1">{homeWins}</span>
                          </div>
                          <div className="bg-purple-950/20 border border-purple-900/40 rounded-xl p-3 flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">AWAY WINS</span>
                            <span className="text-lg font-black text-purple-300 mt-1">{awayWins}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Interactive Pool Result Table Component */}
                    {activeResult && (() => {
                      const baseRows = activeResult.results_table || [];
                      let scoreDraws = 0;
                      let noScoreDraws = 0;
                      let homeWins = 0;
                      let awayWins = 0;
                      baseRows.forEach((r: any) => {
                        const status = r.status || (r.outcome === 'DRAW' ? 'ScoreDraw' : (r.outcome === 'HOME WIN' ? 'Home' : 'Away'));
                        if (status === 'ScoreDraw') scoreDraws++;
                        else if (status === 'noScoreDraw') noScoreDraws++;
                        else if (status === 'Home') homeWins++;
                        else if (status === 'Away') awayWins++;
                      });

                      const filtered = baseRows.filter((row: any) => {
                        const status = row.status || (row.outcome === 'DRAW' ? 'ScoreDraw' : (row.outcome === 'HOME WIN' ? 'Home' : 'Away'));
                        const isDraw = status === 'ScoreDraw' || status === 'noScoreDraw' || row.outcome === 'DRAW';

                        if (portalOutcomeFilter === 'draws' && !isDraw) return false;
                        if (portalOutcomeFilter === 'home' && status !== 'Home' && row.outcome !== 'HOME WIN') return false;
                        if (portalOutcomeFilter === 'away' && status !== 'Away' && row.outcome !== 'AWAY WIN') return false;

                        if (!championshipSearchQuery) return true;
                        const q = championshipSearchQuery.toLowerCase().trim();
                        const home = (row.home_team || row.Home_Team || row.homeTeam || '').toLowerCase();
                        const away = (row.away_team || row.Away_Team || row.awayTeam || '').toLowerCase();
                        const st = String(status).toLowerCase();
                        const resStr = String(row.pool_result || '').toLowerCase();
                        const rowId = String(row.id ?? row.matchNo ?? '');
                        return (
                          home.includes(q) ||
                          away.includes(q) ||
                          st.includes(q) ||
                          resStr.includes(q) ||
                          rowId.includes(q)
                        );
                      });

                      const getStatusBadge = (st: string) => {
                        if (st === 'ScoreDraw') {
                          return (
                            <span className="px-1 sm:px-2 py-0.5 rounded text-[7.5px] sm:text-[10px] font-black font-mono tracking-tighter sm:tracking-wider uppercase bg-emerald-950/90 text-emerald-300 border border-emerald-700/80 inline-flex items-center justify-center gap-0.5 sm:gap-1 shadow-sm whitespace-nowrap">
                              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                              <span className="hidden xs:inline sm:inline">ScoreDraw</span>
                              <span className="xs:hidden">Draw</span>
                            </span>
                          );
                        }
                        if (st === 'noScoreDraw') {
                          return (
                            <span className="px-1 sm:px-2 py-0.5 rounded text-[7.5px] sm:text-[10px] font-black font-mono tracking-tighter sm:tracking-wider uppercase bg-teal-950/90 text-teal-300 border border-teal-700/80 inline-flex items-center justify-center gap-0.5 sm:gap-1 shadow-sm whitespace-nowrap">
                              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-teal-400 shrink-0"></span>
                              <span className="hidden xs:inline sm:inline">noScore</span>
                              <span className="xs:hidden">0-0</span>
                            </span>
                          );
                        }
                        if (st === 'Home') {
                          return (
                            <span className="px-1 sm:px-2 py-0.5 rounded text-[7.5px] sm:text-[10px] font-black font-mono tracking-tighter sm:tracking-wider uppercase bg-blue-950/90 text-blue-300 border border-blue-700/80 inline-flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap">
                              Home
                            </span>
                          );
                        }
                        if (st === 'Away') {
                          return (
                            <span className="px-1 sm:px-2 py-0.5 rounded text-[7.5px] sm:text-[10px] font-black font-mono tracking-tighter sm:tracking-wider uppercase bg-purple-950/90 text-purple-300 border border-purple-700/80 inline-flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap">
                              Away
                            </span>
                          );
                        }
                        return (
                          <span className="px-1 sm:px-2 py-0.5 rounded text-[7.5px] sm:text-[10px] font-bold font-mono tracking-tighter sm:tracking-wider uppercase bg-slate-900 text-slate-300 border border-slate-700 whitespace-nowrap">
                            {st}
                          </span>
                        );
                      };

                      return (
                        <div className="flex flex-col gap-3 mt-1">
                          <div className="w-full rounded-xl border border-slate-800/80 shadow-2xl overflow-hidden bg-[#0B0F19]">
                            {/* Title Banner */}
                            <div className="flex border-b border-slate-800">
                              <div className="w-8 sm:w-12 shrink-0 bg-[#0F172A] border-r border-slate-800 flex items-center justify-center font-mono text-[9px] sm:text-xs text-slate-500 select-none">
                                #
                              </div>
                              <div className="flex-grow bg-[#004D40] text-slate-100 flex flex-col items-start md:items-center justify-center py-2.5 sm:py-4 px-2.5 sm:px-6 text-left md:text-center relative">
                                <div className="absolute inset-0 bg-[#10B981]/15 mix-blend-overlay"></div>
                                <h1 className="font-black text-xs sm:text-base md:text-xl tracking-tight sm:tracking-widest text-[#FFF] uppercase leading-tight drop-shadow-md">
                                  WEEKLY POOL RESULTS
                                </h1>
                                <p className="text-[8px] sm:text-xs tracking-wide sm:tracking-wider text-emerald-300 font-bold mt-0.5 drop-shadow-sm font-mono uppercase">
                                  CURRENT `pool_result` CARDS: id • home_team • pool_result • away_team • status
                                </p>
                              </div>
                            </div>

                            {/* Cards Display Only */}
                            <div className="p-2.5 sm:p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 bg-[#070b13]">
                              {filtered.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-slate-500 italic text-xs font-mono">
                                  {baseRows.length === 0 ? 'No match records in pool_result table yet.' : 'No matches found matching your filter criteria.'}
                                </div>
                              ) : (
                                filtered.map((row: any, idx: number) => {
                                  const rowId = row.id ?? row.matchNo ?? (idx + 1);
                                  const homeTeam = row.home_team || row.Home_Team || row.homeTeam || '';
                                  const awayTeam = row.away_team || row.Away_Team || row.awayTeam || '';
                                  const status = row.status || (row.outcome === 'DRAW' ? 'ScoreDraw' : (row.outcome === 'HOME WIN' ? 'Home' : 'Away'));
                                  const poolResult = row.pool_result || (row.Home_Team_Score !== undefined ? `${row.Home_Team_Score}-:-${row.Away_Team_Score}` : row.fullTimeScore?.replace(' - ', '-:-')) || '0-:-0';
                                  const isDraw = status === 'ScoreDraw' || status === 'noScoreDraw' || row.outcome === 'DRAW';

                                  return (
                                    <div
                                      key={idx}
                                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                                        isDraw
                                          ? 'bg-[#051812] border-emerald-600/90 shadow-md ring-1 ring-emerald-500/20'
                                          : 'bg-[#0B0F19] border-slate-800 hover:border-slate-700'
                                      }`}
                                    >
                                      {/* Header: #ID and Status Badge */}
                                      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/80">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono text-xs font-black text-amber-400 bg-black/60 px-2 py-0.5 rounded border border-slate-800">
                                            #{rowId}
                                          </span>
                                          <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">Match</span>
                                        </div>
                                        {getStatusBadge(status)}
                                      </div>

                                      {/* Matchup: Home Team - Score - Away Team */}
                                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1.5">
                                        <div className="text-right flex flex-col items-end justify-center">
                                          <div className="font-extrabold text-white text-xs sm:text-sm leading-snug break-words">
                                            {homeTeam}
                                          </div>
                                          <span className="text-[8px] sm:text-[9px] font-mono text-emerald-400/70 uppercase font-semibold">Home</span>
                                        </div>

                                        <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono font-black text-xs sm:text-sm text-center min-w-[54px] shadow-inner tracking-wider">
                                          {poolResult}
                                        </div>

                                        <div className="text-left flex flex-col items-start justify-center">
                                          <div className="font-extrabold text-white text-xs sm:text-sm leading-snug break-words">
                                            {awayTeam}
                                          </div>
                                          <span className="text-[8px] sm:text-[9px] font-mono text-blue-400/70 uppercase font-semibold">Away</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

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

                  {/* Active Subscriptions & Days Remaining Live Countdown Dashboard */}
                  <div className="bg-gradient-to-b from-[#0F172A] to-[#0A101D] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                          <Timer className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-white text-sm sm:text-base uppercase tracking-tight flex items-center gap-2">
                            <span>Active Subscription Days Remaining</span>
                            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                              LIVE COUNTER
                            </span>
                          </h3>
                          <p className="text-[11px] text-slate-400 font-mono">
                            Real-time countdown and expiration tracker for @{currentUser.username}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                          {activeSubsList.length} Active Plan(s)
                        </span>
                      </div>
                    </div>

                    {activeSubsList.length === 0 ? (
                      <div className="p-6 bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl text-center space-y-2">
                        <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="text-xs font-mono text-slate-400">
                          No active VIP subscription currently found for @{currentUser.username}.
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Select one of the VIP plans below to unlock immediate access to decrypted fixture codes.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeSubsList.map((sub, sIdx) => {
                          const isCrit = sub.status === 'critical';
                          const isWarn = sub.status === 'expiring_soon';

                          return (
                            <div
                              key={`active_sub_card_${sub.id}_${sIdx}`}
                              className={`p-4 rounded-2xl border transition shadow-lg relative overflow-hidden flex flex-col justify-between gap-3 ${
                                isCrit
                                  ? 'bg-gradient-to-br from-rose-950/50 via-slate-950 to-slate-900 border-rose-500/40'
                                  : isWarn
                                  ? 'bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-900 border-amber-500/40'
                                  : 'bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-900 border-emerald-500/40'
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <span className="text-xs font-black text-white uppercase tracking-tight block">
                                      {sub.planName}
                                    </span>
                                    <span className="text-[9.5px] font-mono text-slate-400 block mt-0.5">
                                      Ref: {sub.paymentRef}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                                      isCrit
                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                                        : isWarn
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    }`}
                                  >
                                    {isCrit ? 'CRITICAL' : isWarn ? 'EXPIRING SOON' : 'ACTIVE'}
                                  </span>
                                </div>

                                {/* Large Days Remaining Gauge */}
                                <div className="my-3 flex items-baseline gap-2 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                                  <span
                                    className={`text-3xl font-black font-mono tracking-tight ${
                                      isCrit
                                        ? 'text-rose-400'
                                        : isWarn
                                        ? 'text-amber-400'
                                        : 'text-emerald-400'
                                    }`}
                                  >
                                    {sub.daysRemaining}
                                  </span>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-mono font-bold uppercase text-slate-300">
                                      Days Remaining
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-500">
                                      ({sub.hoursRemaining} hours total)
                                    </span>
                                  </div>
                                </div>

                                {/* Progress meter */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[9.5px] font-mono text-slate-400">
                                    <span>Time Left: {sub.percentRemaining}%</span>
                                    <span>Total: {sub.totalDays} days</span>
                                  </div>
                                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        isCrit
                                          ? 'bg-rose-500'
                                          : isWarn
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${sub.percentRemaining}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Bookmaker chips */}
                                <div className="mt-3 flex flex-wrap gap-1">
                                  {sub.bookmakers.map((bm, bIdx) => (
                                    <span
                                      key={`card_bm_${bm}_${bIdx}`}
                                      className="text-[9px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300 px-1.5 py-0.5 rounded uppercase"
                                    >
                                      {bm}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                                <span className="text-slate-400">
                                  Expires: <strong className="text-white">{sub.expiresAt.toLocaleDateString()}</strong>
                                </span>
                                <button
                                  onClick={() => {
                                    const planEl = document.getElementById('pricing-matrix-section');
                                    if (planEl) {
                                      planEl.scrollIntoView({ behavior: 'smooth' });
                                    }
                                  }}
                                  className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline cursor-pointer"
                                >
                                  + Extend Access
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Purchases & Code Unlocks Audit Ledger for @username */}
                  <div id="pricing-matrix-section" className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                          <span>🧾 PURCHASES & CODE ACCESS LOG FOR</span>
                          <span className="text-emerald-400">@{currentUser.username}</span>
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Tracking all paid transactions, payment receipts, and code sheet downloads matched with user @{currentUser.username}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-900 text-slate-300 px-2.5 py-1 rounded border border-slate-800">
                        {((db.user_payments || []).filter(p => p && (p.user_id === currentUser?.id || (p.username && currentUser?.username && p.username.toLowerCase() === currentUser.username.toLowerCase()))).length + userSubs.length)} Subscription(s) Recorded
                      </span>
                    </div>

                    {/* Subscriptions Transactions Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                            <th className="p-3">User Matched</th>
                            <th className="p-3">Plan Purchased</th>
                            <th className="p-3 text-emerald-400 font-extrabold">Granted Database Table(s) Access</th>
                            <th className="p-3">Payment Ref</th>
                            <th className="p-3">Paid Date</th>
                            <th className="p-3">Expiry Date</th>
                            <th className="p-3 text-right">Access Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {(() => {
                            const matchUser = (item: any) => item && (
                              currentUser?.role === 'admin' ||
                              (item.user_id && currentUser?.id && String(item.user_id).toLowerCase() === String(currentUser.id).toLowerCase()) ||
                              (item.username && currentUser?.username && String(item.username.toLowerCase()) === String(currentUser.username.toLowerCase()))
                            );

                            const combinedMap = new Map<string, any>();

                            // 1. Direct Supabase Table remoteLogs
                            (remoteLogs || []).filter(matchUser).forEach((item: any) => {
                              const ref = item.payment_ref || item.payment_reference || item.id;
                              combinedMap.set(ref, item);
                            });

                            // 2. Local Purchases Access Log
                            (db.purchases_access_log || []).filter(matchUser).forEach((item: any) => {
                              const ref = item.payment_ref || item.payment_reference || item.id;
                              if (!combinedMap.has(ref)) {
                                combinedMap.set(ref, item);
                              }
                            });

                            // 3. User Payments
                            (db.user_payments || []).filter(matchUser).forEach((item: any) => {
                              const ref = item.payment_reference || item.payment_ref || item.id;
                              if (!combinedMap.has(ref)) {
                                combinedMap.set(ref, item);
                              }
                            });

                            // 4. User Subscriptions
                            (db.user_subscriptions || []).filter(matchUser).forEach((sub: any) => {
                              const ref = sub.payment_reference || sub.payment_ref || sub.id;
                              if (!combinedMap.has(ref)) {
                                combinedMap.set(ref, {
                                  id: sub.id,
                                  user_id: sub.user_id,
                                  username: sub.username || currentUser.username,
                                  plan_id: sub.plan_id,
                                  plan_purchased: sub.item_name || 'Subscription Plan',
                                  payment_ref: ref,
                                  amount: sub.amount_paid || 0,
                                  currency: sub.currency || 'NGN',
                                  access_status: sub.status,
                                  paid_date: sub.starts_at,
                                  expiry_date: sub.expires_at,
                                  created_at: sub.starts_at || sub.created_at
                                });
                              }
                            });

                            const finalLogs = Array.from(combinedMap.values());
                            const sortedLogs = finalLogs.sort((a, b) => 
                              new Date(b.created_at || b.paid_date || b.access_start_at || b.starts_at || 0).getTime() - 
                              new Date(a.created_at || a.paid_date || a.access_start_at || a.starts_at || 0).getTime()
                            );

                            if (sortedLogs.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={7} className="p-4 text-center text-slate-500 italic">
                                    No purchase transactions recorded in purchases_access_log for @{currentUser.username}. Select a subscription plan below to subscribe.
                                  </td>
                                </tr>
                              );
                            }

                            return sortedLogs.map((item: any, idx: number) => {
                              const plan = getMergedSubscriptionPlans(db.subscription_plans).find(p => p.id === item.plan_id);
                              const expDate = item.expiry_date || item.access_expires_at || item.expires_at;
                              const startDate = item.paid_date || item.access_start_at || item.starts_at || item.created_at;
                              const statusStr = item.access_status || item.status || 'active';
                              const isSubActive = (statusStr === 'active' || statusStr === 'successful') && new Date(expDate) > new Date();
                              const payRef = item.payment_ref || item.payment_reference || 'N/A';
                              const planTitle = item.plan_purchased || item.item_name || plan?.name || item.plan_id;
                              const uname = item.username || currentUser.username;
                              const grantedTables = getItemGrantedTables(item);

                              return (
                                <tr key={`log_row_${item.id}_${idx}`} className="hover:bg-slate-900/50">
                                  <td className="p-3 font-bold text-emerald-400">@{uname}</td>
                                  <td className="p-3 font-bold text-white">{planTitle}</td>
                                  <td className="p-3">
                                    <div className="flex flex-wrap gap-1 items-center">
                                      {grantedTables.map((gt: string, gIdx: number) => (
                                        <span
                                          key={`gt_${gt}_${gIdx}`}
                                          className="bg-emerald-950/90 text-emerald-400 border border-emerald-800/80 font-mono text-[9.5px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 uppercase"
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                          <span>{gt}</span>
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-400 text-[11px] font-mono">{payRef}</td>
                                  <td className="p-3 text-slate-400 text-[11px]">{startDate ? new Date(startDate).toLocaleDateString() : 'N/A'}</td>
                                  <td className="p-3 text-slate-400 text-[11px]">{expDate ? new Date(expDate).toLocaleDateString() : 'N/A'}</td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {isSubActive ? (
                                        <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded text-[9.5px] font-extrabold border border-emerald-800">
                                          ACTIVE✓
                                        </span>
                                      ) : (
                                        <span className="bg-rose-950 text-rose-400 px-2 py-0.5 rounded text-[9.5px] font-extrabold border border-rose-800">
                                          EXPIRED
                                        </span>
                                      )}
                                      <button
                                        onClick={() => {
                                          if (onDownloadReceipt) {
                                            onDownloadReceipt(currentUser, item.plan_id, payRef);
                                          }
                                        }}
                                        className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 hover:text-emerald-300 text-[10px] font-mono px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer"
                                        title="Download License Receipt & Codesheet (.txt)"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span>Receipt</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Purchased/Downloaded Codes Log */}
                    {myDownloads.length > 0 && (
                      <div className="pt-3 border-t border-slate-800/80">
                        <span className="text-[10.5px] font-mono text-slate-400 uppercase font-bold block mb-2">
                          🔓 UNLOCKED CODE SHEETS FOR @{currentUser.username} ({myDownloads.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {myDownloads.map((dl, dIdx) => {
                            const code = db.pool_codes.find(c => c.id === dl.pool_code_id);
                            const bookmaker = db.bookmakers.find(b => b.id === code?.bookmaker_id);
                            return (
                              <div key={`dl_card_${dl.id}_${dIdx}`} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
                                <div>
                                  <span className="text-white font-bold block">{bookmaker?.name || 'Pool Code Sheet'}</span>
                                  <span className="text-[10px] text-slate-500 block">Unlocked: {new Date(dl.downloaded_at).toLocaleDateString()}</span>
                                </div>
                                <span className="text-[9px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-extrabold">
                                  UNLOCKED
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Redesigned VIP Membership Section */}
                  <div className="border border-slate-800/80 p-5 md:p-6 rounded-2xl bg-[#111827] shadow-xl flex flex-col gap-6">
                    {/* Header Bar with Regional Switcher */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-mono text-xs font-black uppercase tracking-widest bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-1 rounded-md">
                            VIP ACCESS HUB
                          </span>
                          <span className="text-xs font-mono text-slate-400 font-bold uppercase">VIP BOOKMAKER SUBSCRIPTIONS</span>
                        </div>
                        <h3 className="font-extrabold text-white text-lg md:text-xl uppercase tracking-tight mt-1.5 flex items-center gap-2">
                          👑 VIP Membership & Bookmaker Subscriptions
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                          Select any bookmaker subscription plan using the comparison matrix below for instant automated access.
                        </p>
                      </div>

                      {/* Regional Tab Selector */}
                      <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800/80 self-start lg:self-auto shrink-0 shadow-inner">
                        <button
                          onClick={() => {
                            setPricingRegionFilter('nigeria');
                            setVipBookmakerFilter('all');
                          }}
                          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all duration-150 flex items-center gap-2 ${
                            pricingRegionFilter === 'nigeria'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                          }`}
                        >
                          <span>🇳🇬</span>
                          <span>Nigeria Standalone Plans</span>
                        </button>
                        <button
                          onClick={() => {
                            setPricingRegionFilter('ghana');
                            setVipBookmakerFilter('all');
                          }}
                          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all duration-150 flex items-center gap-2 ${
                            pricingRegionFilter === 'ghana'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                          }`}
                        >
                          <span>🇬🇭</span>
                          <span>Ghana Standalone Plans</span>
                        </button>
                      </div>
                    </div>

                    {/* View Controls & Bookmaker Filters */}
                    {(() => {
                      const isGhana = pricingRegionFilter === 'ghana';
                      const currencySymbol = isGhana ? 'GH₵' : '₦';
                      const countryKey = isGhana ? 'ghana' : 'nigeria';

                      const countryBookies = getBookmakersByCountry(db.bookmakers, countryKey);
                      const rawComps = countryBookies.length > 0
                        ? countryBookies.map(b => ({
                            slug: (b.slug || b.name || b.id).toLowerCase().trim(),
                            name: b.name,
                            id: b.id
                          }))
                        : (isGhana
                            ? [
                                { slug: 'betway', name: 'Betway Ghana', id: 'betway' },
                                { slug: 'premierbet', name: 'PremierBet Ghana', id: 'premierbet' },
                                { slug: 'soccabet', name: 'Soccabet Ghana', id: 'soccabet' },
                                { slug: 'sportybet-ghana', name: 'SportyBet Ghana', id: 'sportybet-ghana' }
                              ]
                            : [
                                { slug: 'bet9ja', name: 'Bet9ja', id: 'bet9ja' },
                                { slug: 'betking', name: 'BetKing', id: 'betking' },
                                { slug: 'sportybet', name: 'SportyBet', id: 'sportybet' },
                                { slug: 'msport', name: 'MSport', id: 'msport' }
                              ]
                          );

                      const bookmakersList = Array.from(
                        new Map(rawComps.map(item => [item.slug, item])).values()
                      );

                      const displayPlans = getSortedComparisonPlans(db.subscription_plans, isGhana);

                      const getPlanDisplayMeta = (p: SubscriptionPlan) => {
                        const cycle = (p.billing_cycle || '').toLowerCase();
                        const name = (p.name || '').toLowerCase();
                        if (cycle === 'weekly' || name.includes('weekly')) {
                          return { title: 'Weekly Plan', cycleName: 'Weekly', duration: '1 Week Access', bonus: '1 Week', highlight: false };
                        }
                        if (cycle === 'monthly' || name.includes('monthly')) {
                          return { title: 'Monthly Plan', cycleName: 'Monthly', duration: '4 Wks + 1 Wk Bonus', bonus: '+1 Wk Free', highlight: false };
                        }
                        if (cycle === 'quarterly' || name.includes('quarterly')) {
                          return { title: 'Quarterly Plan', cycleName: 'Quarterly', duration: '12 Wks + 1 Wk Bonus', bonus: '+1 Wk Free', highlight: true };
                        }
                        if (cycle === 'biannual' || cycle === 'bi-annual' || (name.includes('annual') && name.includes('bi'))) {
                          return { title: 'Bi-Annual Plan', cycleName: 'Bi-Annual', duration: '24 Wks + 2 Wks Bonus', bonus: '+2 Wks Free', highlight: false };
                        }
                        if (cycle === 'yearly' || name.includes('yearly') || name.includes('annual')) {
                          return { title: 'Yearly Plan', cycleName: 'Yearly', duration: '48 Wks + 4 Wks Bonus', bonus: '+4 Wks Free', highlight: false };
                        }
                        return { title: p.name, cycleName: p.billing_cycle || 'Custom', duration: p.description || 'Standard Access', bonus: '', highlight: false };
                      };

                      const activeBookmakers = vipBookmakerFilter === 'all'
                        ? bookmakersList
                        : bookmakersList.filter(b => b.slug === vipBookmakerFilter.toLowerCase());

                      const checkActiveSub = (bmkSlug: string, planId: string) => {
                        return userActiveSubs.some(sub => {
                          const comps = parseComponents(sub.components);
                          const matchesComp = comps.includes('all') || comps.some(c => matchBookmakerComponent(c, bmkSlug));
                          return matchesComp && sub.plan_id === planId && new Date(sub.expires_at) > new Date();
                        });
                      };

                      return (
                        <div className="flex flex-col gap-5">
                          {/* MASTER COMPARISON MATRIX */}
                          <div className="border border-slate-800 bg-[#070B14] rounded-2xl overflow-hidden shadow-xl">
                            <div className="bg-slate-950 p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                                  <span>📊</span>
                                  <span>Bookmaker x Billing Cycle Comparison Matrix</span>
                                </h4>
                                <p className="text-xs text-slate-400 font-mono mt-1">
                                  Pick any bookmaker and billing duration cell starting from Weekly up to Yearly to activate instant access.
                                </p>
                              </div>

                              {/* Bookmaker Filter Pills */}
                              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80 scrollbar-thin">
                                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold shrink-0 mr-1">Filter:</span>
                                <button
                                  onClick={() => setVipBookmakerFilter('all')}
                                  className={`px-3 py-1 text-[11px] font-mono rounded-lg font-bold transition shrink-0 ${
                                    vipBookmakerFilter === 'all'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                                  }`}
                                >
                                  ALL BOOKMAKERS
                                </button>
                                {bookmakersList.map((bmk, bIdx) => (
                                  <button
                                    key={`bmk_pill_${bmk.slug}_${bIdx}`}
                                    onClick={() => setVipBookmakerFilter(bmk.slug)}
                                    className={`px-3 py-1 text-[11px] font-mono rounded-lg font-bold transition shrink-0 uppercase ${
                                      vipBookmakerFilter === bmk.slug
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                                    }`}
                                  >
                                    {bmk.name}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800">
                              <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                  <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono font-bold border-b border-slate-800">
                                    <th className="p-3.5 pl-4 w-44">Bookmaker</th>
                                    {displayPlans.map((p, idx) => {
                                      const meta = getPlanDisplayMeta(p);
                                      return (
                                        <th key={`matrix_head_${p.id}_${idx}`} className="p-3 text-center border-l border-slate-900">
                                          <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-xs font-black text-white uppercase tracking-wider font-mono">
                                              {meta.cycleName}
                                            </span>
                                            <span className="text-[9.5px] text-emerald-400/90 font-medium lowercase font-mono">
                                              {meta.duration}
                                            </span>
                                          </div>
                                        </th>
                                      );
                                    })}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 text-xs">
                                  {activeBookmakers.map((bmk, bIdx) => (
                                    <tr key={`matrix_row_${bmk.slug}_${bIdx}`} className="hover:bg-slate-900/50 transition-colors">
                                      <td className="p-3.5 pl-4 font-bold text-white font-sans">
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-7 h-7 rounded-lg bg-emerald-950/80 text-emerald-400 font-mono font-black text-xs flex items-center justify-center border border-emerald-800/80 shadow-sm shrink-0">
                                            {(bmk.name || 'B').charAt(0).toUpperCase()}
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="font-bold text-slate-100">{bmk.name}</span>
                                            <span className="text-[10px] font-mono text-slate-500 uppercase">Single Table</span>
                                          </div>
                                        </div>
                                      </td>
                                      {displayPlans.map((p, pIdx) => {
                                        const isActive = checkActiveSub(bmk.slug, p.id);
                                        const unitPrice = Number(p.price || 0);
                                        return (
                                          <td key={`matrix_cell_${bmk.slug}_${p.id}_${pIdx}`} className="p-3 text-center font-mono border-l border-slate-900/60">
                                            <div className="flex flex-col items-center gap-1.5">
                                              <span className="text-sm font-black text-emerald-400">
                                                {currencySymbol}{unitPrice.toLocaleString()}
                                              </span>
                                              {isActive ? (
                                                <span className="bg-emerald-950 text-emerald-400 text-[9px] font-black px-2.5 py-1 rounded-md border border-emerald-800 uppercase tracking-wider shadow-sm">
                                                  ACTIVE ✓
                                                </span>
                                              ) : isPaymentDisabledBookmaker(bmk) ? (
                                                <button
                                                  onClick={() => triggerToast(`Payment portal for ${bmk.name} is currently disabled.`, 'info')}
                                                  className="bg-slate-900/90 hover:bg-slate-850 text-slate-400 border border-slate-750 text-[9px] font-bold uppercase px-2.5 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-1 shadow-inner"
                                                  title={`Payment portal for ${bmk.name} is currently disabled`}
                                                >
                                                  <span>🔒</span>
                                                  <span>PORTAL DISABLED</span>
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => buySubscription(p.id, [bmk.slug])}
                                                  className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-[10px] uppercase px-3 py-1.5 rounded-lg transition shadow-md shadow-emerald-500/10 cursor-pointer whitespace-nowrap"
                                                  title={`Subscribe to ${bmk.name} for ${currencySymbol}${unitPrice.toLocaleString()}`}
                                                >
                                                  BUY {bmk.name.toUpperCase()}
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
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

      {/* DASHBOARD COVER STORY ARTICLE READER MODAL */}
      <AnimatePresence>
        {selectedDashboardArticle && (
          <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c1322] border border-slate-800 text-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative my-auto text-left"
            >
              {/* Modal Close Button */}
              <button 
                onClick={() => setSelectedDashboardArticle(null)}
                className="absolute top-4 right-4 z-30 bg-black/70 hover:bg-rose-600 text-white p-2 rounded-full border border-white/20 transition cursor-pointer shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Banner */}
              <div className="h-64 sm:h-72 w-full relative bg-slate-900 overflow-hidden">
                <img 
                  src={selectedDashboardArticle.image_url} 
                  alt={selectedDashboardArticle.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1322] via-[#0c1322]/50 to-black/30"></div>

                <div className="absolute top-4 left-4 bg-[#fa3e65] text-white text-[10px] font-black px-2.5 py-1 rounded shadow-lg tracking-widest uppercase flex items-center gap-1">
                  <span>★</span>
                  <span>{selectedDashboardArticle.badge || 'COVER STORY'}</span>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 sm:p-8 space-y-4 text-left -mt-8 relative z-10">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span className="bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded uppercase">
                    {selectedDashboardArticle.category || 'ARTICLE'}
                  </span>
                  <span>{selectedDashboardArticle.date}</span>
                  <span>•</span>
                  <span className="text-rose-400 font-extrabold">{selectedDashboardArticle.readTime}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {selectedDashboardArticle.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed bg-slate-900/80 p-4 rounded-xl border border-slate-800/80">
                  {selectedDashboardArticle.summary}
                </p>

                <div className="prose prose-invert prose-xs text-slate-300 leading-relaxed space-y-3 font-sans text-xs sm:text-sm pt-2">
                  {(selectedDashboardArticle.content || '').split('\n\n').map((paragraph: string, pIdx: number) => (
                    <p key={pIdx} className="leading-relaxed">{paragraph}</p>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      if (selectedDashboardArticle.bookmaker) {
                        setDashboardBookmakerFilter(selectedDashboardArticle.bookmaker);
                      }
                      setSelectedDashboardArticle(null);
                      setTimeout(() => {
                        const el = document.getElementById('posted-games-bulletin');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 font-mono"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Week {selectedDashboardArticle.week_number || 43} {selectedDashboardArticle.bookmaker || 'Pool'} Codes</span>
                  </button>

                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        triggerToast('Article link copied to clipboard!', 'success');
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 font-mono"
                  >
                    <Share2 className="w-4 h-4 text-rose-500" />
                    <span>Share Article</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DASHBOARD CAROUSEL MANAGER MODAL */}
      <AnimatePresence>
        {showCarouselManager && (
          <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f172a] border border-slate-700 text-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative my-auto text-left flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Decide Dashboard Carousel Posts
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Select and organize which articles appear in the top dashboard banner
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCarouselManager(false)}
                  className="bg-slate-800 hover:bg-rose-600 text-white p-2 rounded-full border border-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Controls & Search */}
              <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={carouselSearchFilter}
                    onChange={(e) => setCarouselSearchFilter(e.target.value)}
                    placeholder="Filter articles by title or bookmaker..."
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-hidden font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const allIds = (allAvailableBlogs.length > 0 ? allAvailableBlogs : dashboardBlogs).slice(0, 3).map(b => String(b.id));
                      setSelectedCarouselIds(allIds);
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                  >
                    Select Top 3
                  </button>
                  <button
                    onClick={() => {
                      const allIds = (allAvailableBlogs.length > 0 ? allAvailableBlogs : dashboardBlogs).map(b => String(b.id));
                      setSelectedCarouselIds(allIds);
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCarouselIds([]);
                      try {
                        localStorage.removeItem('fastpool_carousel_selected_ids');
                      } catch (_) {}
                    }}
                    className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-[11px] font-mono font-bold rounded-xl border border-rose-800/40 transition cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Scrollable Blog List with Selection Toggles */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-800/40">
                {(() => {
                  const sourceList = allAvailableBlogs.length > 0 ? allAvailableBlogs : dashboardBlogs;
                  const filtered = sourceList.filter(b => 
                    !carouselSearchFilter || 
                    (b.title || '').toLowerCase().includes(carouselSearchFilter.toLowerCase()) ||
                    (b.bookmaker || '').toLowerCase().includes(carouselSearchFilter.toLowerCase())
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-10 text-slate-400 text-xs font-mono">
                        No articles match the current filter.
                      </div>
                    );
                  }

                  return filtered.map((b) => {
                    const isSelected = selectedCarouselIds.length > 0 
                      ? selectedCarouselIds.includes(String(b.id))
                      : dashboardBlogs.some(d => String(d.id) === String(b.id));

                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          let currentIds = selectedCarouselIds.length > 0 
                            ? [...selectedCarouselIds] 
                            : dashboardBlogs.map(d => String(d.id));
                          
                          if (currentIds.includes(String(b.id))) {
                            currentIds = currentIds.filter(id => id !== String(b.id));
                          } else {
                            currentIds.push(String(b.id));
                          }
                          setSelectedCarouselIds(currentIds);
                        }}
                        className={`pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-3 rounded-2xl cursor-pointer transition select-none ${
                          isSelected 
                            ? 'bg-emerald-950/30 border border-emerald-500/40' 
                            : 'bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={b.image_url}
                            alt={b.title}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-slate-800 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                                {b.category || 'ARTICLE'}
                              </span>
                              <span className="text-slate-400 text-[10px] font-mono">
                                Week {b.week_number || 43} • {b.date}
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                              {b.title}
                            </h4>
                          </div>
                        </div>

                        <div className="shrink-0 pl-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                            isSelected 
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950' 
                              : 'border-slate-700 bg-slate-800/60 text-transparent'
                          }`}>
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3 shrink-0">
                <div className="text-xs font-mono text-slate-400">
                  <span className="text-emerald-400 font-black">
                    {selectedCarouselIds.length > 0 ? selectedCarouselIds.length : dashboardBlogs.length}
                  </span>{' '}
                  articles active in dashboard carousel
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCarouselManager(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveCarouselSelection(selectedCarouselIds)}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black font-mono text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-emerald-950/20 active:scale-95"
                  >
                    Apply Carousel Selection
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF PRINT CUSTOMIZER & GENERATOR MODAL */}
      <AnimatePresence>
        {showPdfPrintModal && (() => {
          const activeBookmaker = pdfConfig.bookmakerFilter || dashboardBookmakerFilter || 'Bet9ja';
          const isTableAllowed = isBookieAllowed(activeBookmaker);

          return (
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
                    {isTableAllowed ? (
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
                            <span>BOOKMAKER TABLE:</span>
                            <span className="text-emerald-400 font-bold uppercase">{activeBookmaker} Table</span>
                          </div>
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
                            <span className="text-amber-400 font-bold truncate max-w-[130px]">@{currentUser?.username || 'user'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 bg-slate-950/90 border border-amber-500/30 p-5 rounded-2xl">
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-2">
                          <Lock className="w-6 h-6 text-amber-400" />
                        </div>
                        <h4 className="text-center text-xs font-mono font-black text-amber-400 uppercase tracking-wider">Table Access Restricted</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed text-center">
                          User <strong className="text-white font-bold">@{currentUser?.username || 'user'}</strong> (ID: <code className="text-amber-400">{currentUser?.id || 'guest'}</code>) has not purchased access to the <strong className="text-amber-400 font-bold">{activeBookmaker}</strong> table in the <strong>plan_purchased</strong> log.
                        </p>
                        <div className="border-t border-slate-900 pt-3 space-y-2">
                          <button
                            onClick={() => {
                              setShowPdfPrintModal(false);
                              setActiveSubTab('subscription');
                            }}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 font-mono"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Subscribe to {activeBookmaker} Table</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Print & PDF Export Action Controls */}
                  <div className="p-5 border-t border-slate-800/85 bg-slate-950 flex flex-col gap-2.5 shrink-0">
                    {/* Primary PDF Download Button */}
                    {isTableAllowed ? (
                      <button
                        onClick={async () => {
                          if (!isBookieAllowed(activeBookmaker)) {
                            triggerToast(`Access Denied: @${currentUser?.username || 'user'} (ID: ${currentUser?.id}) has zero access records for ${activeBookmaker} in purchases_access_log.`, 'error');
                            return;
                          }

                          // Server-Side Verification before generating or downloading PDF
                          try {
                            const verifyRes = await fetch('/api/pdf/verify-access', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'x-user-id': currentUser?.id || '',
                                'x-username': currentUser?.username || ''
                              },
                              body: JSON.stringify({
                                user_id: currentUser?.id,
                                username: currentUser?.username,
                                bookmaker: activeBookmaker
                              })
                            });
                            const verifyData = await verifyRes.json();
                            if (!verifyRes.ok || !verifyData.allowed) {
                              triggerToast(verifyData.error || `PDF Download Rejected: No active purchases_access_log entry found for @${currentUser?.username}.`, 'error');
                              return;
                            }
                          } catch (vErr) {
                            if (currentUser.role !== 'admin' && !bypassPremium) {
                              triggerToast('PDF Access check failed. Please check your purchases_access_log record.', 'error');
                              return;
                            }
                          }

                          triggerToast('Generating official PDF document...', 'info');

                          try {
                            const normStr = (s: string) => (s || '').replace(/\s+/g, '').toLowerCase();
                            const targetNorm = normStr(activeBookmaker);

                            const rawList = postedGames.filter(game => {
                              if (activeBookmaker === 'all') return true;
                              const gameBookieNorm = normStr(game.bookmaker);
                              const gameSourceNorm = normStr(game.sourceTable || '');
                              return gameBookieNorm === targetNorm || gameSourceNorm === targetNorm;
                            });

                            const seenPools = new Map<string, typeof rawList[0]>();
                            rawList.forEach(game => {
                              const key = game.poolNo !== undefined && game.poolNo !== null && String(game.poolNo).trim() !== ''
                                ? String(game.poolNo)
                                : game.id;
                              if (!seenPools.has(key)) {
                                seenPools.set(key, game);
                              }
                            });

                            const pdfFilteredGames = Array.from(seenPools.values());
                            pdfFilteredGames.sort((a, b) => (Number(a.poolNo) || 0) - (Number(b.poolNo) || 0));

                            const doc = new jsPDF({
                              orientation: 'portrait',
                              unit: 'mm',
                              format: 'a4',
                            });

                            const pageWidth = doc.internal.pageSize.getWidth();
                            const pageHeight = doc.internal.pageSize.getHeight();

                            // Top compact header banner (Height: 7mm)
                            doc.setFillColor(15, 23, 42); // slate-900
                            doc.rect(5, 3.5, pageWidth - 10, 7, 'F');
                            
                            doc.setTextColor(255, 255, 255);
                            doc.setFontSize(10);
                            doc.setFont('helvetica', 'bold');
                            doc.text('FASTPOOLCODES', 8, 8.2);
                            
                            doc.setTextColor(52, 211, 153); // emerald-400
                            doc.setFontSize(7.5);
                            doc.setFont('helvetica', 'bold');
                            doc.text(`[${activeBookmaker.toUpperCase()}] OFFICIAL WEEK ${activeWeekNumber} SHEET (49 FIXTURES)`, pageWidth - 8, 8.2, { align: 'right' });

                            // Metadata 1-line bar (Height: 3.8mm)
                            doc.setFillColor(248, 250, 252);
                            doc.setDrawColor(226, 232, 240);
                            doc.rect(5, 11, pageWidth - 10, 3.8, 'FD');

                            doc.setFontSize(6.5);
                            doc.setTextColor(100, 116, 139);
                            doc.setFont('helvetica', 'normal');
                            doc.text('LICENSEE:', 7, 13.7);
                            doc.setTextColor(15, 23, 42);
                            doc.setFont('helvetica', 'bold');
                            doc.text(`@${currentUser?.username || 'user'}`, 20, 13.7);

                            doc.setFont('helvetica', 'normal');
                            doc.setTextColor(100, 116, 139);
                            doc.text('EMAIL:', 50, 13.7);
                            doc.setTextColor(15, 23, 42);
                            doc.setFont('helvetica', 'bold');
                            doc.text(currentUser?.email || 'user@fastpoolcodes.com', 60, 13.7);

                            doc.setFont('helvetica', 'normal');
                            doc.setTextColor(100, 116, 139);
                            doc.text('SEASON:', 118, 13.7);
                            doc.setTextColor(5, 150, 105);
                            doc.setFont('helvetica', 'bold');
                            doc.text(`WEEK ${activeWeekNumber} (2026)`, 131, 13.7);

                            doc.setFont('helvetica', 'normal');
                            doc.setTextColor(100, 116, 139);
                            doc.text('KEY:', 162, 13.7);
                            doc.setTextColor(15, 23, 42);
                            doc.setFont('helvetica', 'bold');
                            doc.text(`SHA256:FPC-${(currentUser?.id || 'guest').slice(0, 5).toUpperCase()}`, 168, 13.7);

                            // Compiled By & Contact Enquiries Header Line (Height: 3.5mm)
                            doc.setFontSize(7);
                            doc.setTextColor(15, 23, 42);
                            doc.setFont('helvetica', 'bold');
                            doc.text('Compiled by Fastpoolcodes.com • Enquiries / WhatsApp: +234 8030587933, +234 9037595705', 5, 17.8);

                            // Table Columns Setup (Strict 12 Bookmaker Columns)
                            const tableHeaders: string[] = [
                              'POOL',
                              'BET CODE',
                              'LEAGUE',
                              'HOME',
                              'AWAY',
                              '1',
                              'X',
                              '2',
                              'BET TIPS',
                              'STATUS',
                              'KICK OFF',
                              'WEEK NO'
                            ];

                            const tableData = pdfFilteredGames.map(game => [
                              String(game.poolNo ?? 'NULL'),
                              String(game.betCode ?? 'NULL'),
                              String(game.league ?? 'NULL'),
                              String(game.home ?? 'NULL'),
                              String(game.away ?? 'NULL'),
                              String(game.homeWin ?? 'NULL'),
                              String(game.draw ?? 'NULL'),
                              String(game.awayWin ?? 'NULL'),
                              String(game.betTips ?? 'NULL'),
                              String(game.status ?? 'NULL'),
                              String(game.kickOff ?? 'NULL'),
                              String(game.weekNo ?? 'NULL')
                            ]);

                            autoTable(doc, {
                              startY: 18.5,
                              head: [tableHeaders],
                              body: tableData.length > 0 ? tableData : [['NULL', 'NULL', 'No classified fixtures found', ...tableHeaders.slice(3).map(() => 'NULL')]],
                              theme: 'grid',
                              margin: { top: 18.5, bottom: 4.5, left: 4.5, right: 4.5 },
                              headStyles: {
                                fillColor: [15, 23, 42],
                                textColor: [255, 255, 255],
                                fontSize: 6.2,
                                fontStyle: 'bold',
                                halign: 'center',
                                cellPadding: [0.5, 0.4],
                                minCellHeight: 3.8,
                              },
                              bodyStyles: {
                                fillColor: false,
                                fontSize: 5.8,
                                textColor: [15, 23, 42],
                                cellPadding: [0.35, 0.35],
                                minCellHeight: 4.2,
                              },
                              alternateRowStyles: {
                                fillColor: false,
                              },
                              columnStyles: {
                                0: { halign: 'center', fontStyle: 'bold', cellWidth: 10 },
                                1: { halign: 'center', fontStyle: 'bold', cellWidth: 15 },
                                2: { halign: 'center', cellWidth: 18 },
                                3: { halign: 'left', fontStyle: 'bold', cellWidth: 29 },
                                4: { halign: 'left', fontStyle: 'bold', cellWidth: 29 },
                                5: { halign: 'center', cellWidth: 11 },
                                6: { halign: 'center', fontStyle: 'bold', textColor: [5, 150, 105], cellWidth: 11 },
                                7: { halign: 'center', cellWidth: 11 },
                                8: { halign: 'center', fontStyle: 'bold', textColor: [180, 83, 9], cellWidth: 19 },
                                9: { halign: 'center', cellWidth: 15 },
                                10: { halign: 'center', cellWidth: 17 },
                                11: { halign: 'center', cellWidth: 16 },
                              },
                              didParseCell: (hookData) => {
                                if (hookData.section === 'body') {
                                  if (hookData.cell.raw === 'NULL') {
                                    hookData.cell.styles.textColor = [148, 163, 184];
                                    hookData.cell.styles.fontStyle = 'italic';
                                  }
                                }
                              },
                              willDrawPage: () => {
                                // Soft security watermark placed strictly BEHIND the table cells and text
                                doc.saveGraphicsState();
                                doc.setTextColor(240, 244, 248); // Soft, faint watermark contrast under data
                                doc.setFontSize(10.5);
                                doc.setFont('helvetica', 'normal');
                                const watermarkText = `FASTPOOLCODES • ${currentUser?.email || 'user@fastpoolcodes.com'}`;
                                for (let y = 30; y < pageHeight; y += 65) {
                                  for (let x = -15; x < pageWidth + 30; x += 140) {
                                    doc.text(watermarkText, x, y, { angle: -25 });
                                  }
                                }
                                doc.restoreGraphicsState();
                              },
                              didDrawPage: () => {
                                // Security trace footer strictly BELOW the codes on page bottom
                                doc.setFontSize(6.5);
                                doc.setTextColor(148, 163, 184);
                                doc.text(
                                  `FastPoolCodes Official Classified Coupon • Week ${activeWeekNumber} • Licensed to ${currentUser?.email || 'user'} • Single Page Verified Sheet`,
                                  5,
                                  pageHeight - 2.5
                                );
                                doc.text(
                                  'Compiled by Fastpoolcodes.com (Call/WhatsApp: +234 8030587933, +234 9037595705)',
                                  pageWidth - 5,
                                  pageHeight - 2.5,
                                  { align: 'right' }
                                );
                              }
                            });

                            const filename = `FastPoolCodes_${activeBookmaker}_Week_${activeWeekNumber}.pdf`;
                            doc.save(filename);
                            triggerToast('PDF document downloaded successfully!', 'success');
                          } catch (err) {
                            console.error('PDF generation error:', err);
                            triggerToast('Failed to generate PDF document.', 'error');
                          }
                        }}
                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 font-mono"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PDF File (.pdf)</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-3.5 bg-slate-900 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg opacity-80 cursor-not-allowed font-mono"
                      >
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span>Subscription Required to Download ({activeBookmaker})</span>
                      </button>
                    )}

                    <p className="text-[10px] text-slate-500 font-mono leading-relaxed text-center mt-1">
                      {isTableAllowed ? (
                        <>💡 <span className="text-emerald-400 font-extrabold">Pro Tip:</span> Click <span className="text-white font-extrabold">"Download PDF File (.pdf)"</span> to save your 1-page coupon sheet.</>
                      ) : (
                        <span className="text-amber-400/90 font-semibold">🔒 Table access is restricted. Please purchase a plan for this bookmaker table to unlock PDF downloads.</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right Column: Live Sheet Preview (Scrollable wrapper mimicking A4) */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-900/90 flex justify-center items-start scrollbar-thin scrollbar-thumb-slate-800 select-text relative">
                  <div
                    id="printable-coupon-modal-sheet"
                    className={`w-full max-w-[210mm] bg-white text-slate-950 p-3 sm:p-5 shadow-2xl rounded border flex flex-col justify-between font-sans relative ${
                      pdfConfig.theme === 'emerald' ? 'border-t-8 border-t-emerald-700' : ''
                    }`}
                  >
                    {/* Locked Watermark Overlay for Unlicensed Tables */}
                    {!isTableAllowed && (
                      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center space-y-4 rounded">
                        <div className="w-16 h-16 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 shadow-xl">
                          <Lock className="w-8 h-8 text-amber-400 animate-pulse" />
                        </div>
                        <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest px-3 py-1 bg-amber-950/60 border border-amber-900/60 rounded-full">
                          PDF EXPORT RESTRICTED
                        </span>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight font-mono">
                          {activeBookmaker} Pool Sheet Locked
                        </h3>
                        <p className="text-xs text-slate-300 max-w-sm leading-relaxed font-sans">
                          User <strong className="text-emerald-400 font-bold">@{currentUser?.username || 'user'}</strong> (ID: <code className="text-slate-200">{currentUser?.id || 'guest'}</code>) has no active access record for the <strong className="text-amber-400 font-bold">{activeBookmaker}</strong> table in the <strong>purchases_access_log</strong> or <strong>subscriptions_access_log</strong> database.
                        </p>
                        <button
                          onClick={() => {
                            setShowPdfPrintModal(false);
                            setActiveSubTab('subscription');
                            triggerToast(`Subscribe to ${activeBookmaker} Table to download this PDF.`, 'info');
                          }}
                          className="mt-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2 font-mono"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Purchase Access to {activeBookmaker} Table</span>
                        </button>
                      </div>
                    )}
                  {/* Decorative background grid overlay for print preview (removed during print automatically via CSS) */}
                  <div className="absolute inset-0 bg-grid opacity-[0.01] pointer-events-none print:hidden"></div>

                  {/* Watermark layer: "fastpoolcodes" and user email repeating softly beneath the table */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-[0.025] print:opacity-[0.03] z-0 flex flex-wrap justify-around items-center content-around">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="text-xs sm:text-sm font-mono font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap select-none p-4 rotate-[-25deg]"
                        style={{ transform: 'rotate(-25deg)' }}
                      >
                        fastpoolcodes • {currentUser?.email || 'user@fastpoolcodes.com'}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 relative z-10">
                    {/* Header Block */}
                    <div className="border-b border-slate-950 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black tracking-tighter uppercase font-sans">
                            ⚽ FAST<span className="text-emerald-700">POOL</span>CODES
                          </span>
                          <span className="text-[7.5px] font-mono uppercase bg-slate-950 text-white px-1.5 py-0.5 rounded font-black select-none">
                            VIP CERTIFIED
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-mono font-black text-emerald-800 uppercase">
                            [{activeBookmaker.toUpperCase()}] WEEK {activeWeekNumber} OFFICIAL
                          </span>
                        </div>
                      </div>

                      {/* Header Table Metadata Info Bar */}
                      <div className="grid grid-cols-4 gap-1 border-t border-slate-200 mt-1.5 pt-1.5 text-[8.5px] font-mono text-slate-700">
                        <div>
                          <span className="text-slate-400 block text-[7px] uppercase">LICENSEE:</span>
                          <span className="font-extrabold text-slate-900 truncate block">@{currentUser?.username || 'user'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[7px] uppercase">EMAIL:</span>
                          <span className="font-extrabold text-slate-900 truncate block">{currentUser?.email || 'user@fastpoolcodes.com'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[7px] uppercase">SEASON:</span>
                          <span className="font-extrabold text-slate-900">WEEK {activeWeekNumber} (2026)</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[7px] uppercase">KEY:</span>
                          <span className="font-extrabold text-slate-900 truncate block">SHA256:FPC-{(currentUser?.id || 'guest').slice(0, 5).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Classified Coupon Table (12 Official Columns) */}
                    <div className="space-y-1.5 overflow-x-auto">
                      <div className="text-[9.5px] font-mono font-black uppercase text-slate-900 tracking-wide flex justify-between items-center">
                        <span>📋 Compiled by Fastpoolcodes.com • WhatsApp/Enquiries: +234 8030587933, +234 9037595705</span>
                        <span className="text-[8.5px] text-emerald-700 font-bold">1-PAGE A4 FORMAT (49 ROWS)</span>
                      </div>

                      <table className="w-full text-left font-sans text-[8.5px] border-collapse">
                        <thead>
                          <tr className="bg-slate-950 text-white font-mono uppercase text-[7.5px] tracking-wider border border-slate-950">
                            <th className="py-1 px-1 border text-center w-[5%]">Pool</th>
                            <th className="py-1 px-1 border text-center w-[8%]">Bet Code</th>
                            <th className="py-1 px-1 border text-center w-[9%]">League</th>
                            <th className="py-1 px-1 border w-[15%]">Home</th>
                            <th className="py-1 px-1 border w-[15%]">Away</th>
                            <th className="py-1 px-0.5 border text-center w-[5%]">1</th>
                            <th className="py-1 px-0.5 border text-center w-[5%]">X</th>
                            <th className="py-1 px-0.5 border text-center w-[5%]">2</th>
                            <th className="py-1 px-1 border text-center w-[10%]">Bet Tips</th>
                            <th className="py-1 px-1 border text-center w-[8%]">Status</th>
                            <th className="py-1 px-1 border text-center w-[8%]">Kick Off</th>
                            <th className="py-1 px-1 border text-center w-[7%]">Week No</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 border">
                          {(() => {
                            const activeBookmaker = pdfConfig.bookmakerFilter || dashboardBookmakerFilter || 'Bet9ja';
                            const normStr = (s: string) => (s || '').replace(/\s+/g, '').toLowerCase();
                            const targetNorm = normStr(activeBookmaker);

                            // Filter games according to selected bookmaker table
                            const rawList = postedGames.filter(game => {
                              if (activeBookmaker === 'all') return true;

                              const gameBookieNorm = normStr(game.bookmaker);
                              const gameSourceNorm = normStr(game.sourceTable || '');
                              return gameBookieNorm === targetNorm || gameSourceNorm === targetNorm;
                            });

                            // Deduplicate strictly by pool number so pool numbers (1 to 50) are NEVER repeated
                            const seenPools = new Map<string, typeof rawList[0]>();
                            rawList.forEach(game => {
                              const key = game.poolNo !== undefined && game.poolNo !== null && String(game.poolNo).trim() !== ''
                                ? String(game.poolNo)
                                : game.id;
                              if (!seenPools.has(key)) {
                                seenPools.set(key, game);
                              }
                            });

                            const pdfFilteredGames = Array.from(seenPools.values());
                            pdfFilteredGames.sort((a, b) => (Number(a.poolNo) || 0) - (Number(b.poolNo) || 0));

                            if (pdfFilteredGames.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={12} className="p-4 text-center text-slate-400 font-mono italic text-[9px]">
                                    No classified fixtures found for the selected bookmaker ({activeBookmaker}).
                                  </td>
                                </tr>
                              );
                            }

                            return pdfFilteredGames.map((game, idx) => (
                              <tr 
                                key={game.id || idx} 
                                className={`text-[8.5px] leading-tight transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}`}
                              >
                                <td className="py-0.5 px-0.5 border text-center font-mono font-black text-slate-900 bg-slate-100/70">
                                  <span className={game.poolNo === 'NULL' ? 'text-slate-400 font-mono italic text-[7.5px]' : ''}>{game.poolNo}</span>
                                </td>
                                <td className="py-0.5 px-0.5 border text-center font-mono font-black text-slate-800 bg-slate-100/50">
                                  <span className={game.betCode === 'NULL' ? 'text-slate-400 font-mono italic text-[7.5px]' : ''}>{game.betCode}</span>
                                </td>
                                <td className="py-0.5 px-0.5 border text-center font-bold text-slate-800 text-[8px] bg-slate-100/30">
                                  <span className={game.league === 'NULL' ? 'text-slate-400 font-mono italic text-[7.5px]' : ''}>{game.league}</span>
                                </td>
                                <td className="py-0.5 px-1 border font-bold text-slate-900 bg-inherit truncate max-w-[110px]">
                                  <span className={game.home === 'NULL' ? 'text-slate-400 font-mono italic text-[7.5px]' : ''}>{game.home}</span>
                                </td>
                                <td className="py-0.5 px-1 border font-bold text-slate-900 bg-inherit truncate max-w-[110px]">
                                  <span className={game.away === 'NULL' ? 'text-slate-400 font-mono italic text-[7.5px]' : ''}>{game.away}</span>
                                </td>
                                <td className="py-0.5 px-0.5 border text-center font-mono text-slate-600 text-[8px] bg-inherit">
                                  <span className={game.homeWin === 'NULL' ? 'text-slate-400 font-mono italic text-[7.5px]' : ''}>{game.homeWin}</span>
                                </td>
                                <td className="py-0.5 px-0.5 border text-center font-mono font-bold text-emerald-700 text-[8px] bg-inherit">
                                  <span className={game.draw === 'NULL' ? 'text-slate-400 font-mono italic text-[7.5px]' : ''}>{game.draw}</span>
                                </td>
                                <td className="py-0.5 px-0.5 border text-center font-mono text-slate-600 text-[8px] bg-inherit">
                                  <span className={game.awayWin === 'NULL' ? 'text-slate-400 font-mono italic text-[7.5px]' : ''}>{game.awayWin}</span>
                                </td>
                                <td className="py-0.5 px-0.5 border text-center font-mono font-black text-amber-800 text-[8px] uppercase bg-inherit">
                                  <span className={game.betTips === 'NULL' ? 'text-slate-400 font-mono italic text-[7.5px]' : ''}>{game.betTips}</span>
                                </td>
                                <td className="py-0.5 px-0.5 border text-center font-mono text-slate-600 text-[8px] bg-inherit">
                                  <span className={game.status === 'NULL' ? 'text-slate-400 font-mono italic text-[7.5px]' : ''}>{game.status}</span>
                                </td>
                                <td className="py-0.5 px-0.5 border text-center font-mono text-slate-600 text-[8px] bg-inherit">
                                  <span className={game.kickOff === 'NULL' ? 'text-slate-400 font-mono italic text-[7.5px]' : ''}>{game.kickOff}</span>
                                </td>
                                <td className="py-0.5 px-0.5 border text-center font-mono text-slate-600 text-[8px] bg-inherit">
                                  <span className={game.weekNo === 'NULL' ? 'text-slate-400 font-mono italic text-[7.5px]' : ''}>{game.weekNo}</span>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Coupon Sheet Footer */}
                  <div className="border-t border-slate-200 pt-1.5 mt-2 flex items-center justify-between text-[8px] font-mono text-slate-400 relative z-10">
                    <span>© 2026 FastPoolCodes Syndicate • Single Page Verified Sheet</span>
                    <span>Compiled by Fastpoolcodes.com • Enquiries: +234 8030587933, +234 9037595705</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })()}
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
                    {confirmedPaymentMail ? confirmedPaymentMail.subject : `📧 [FastPoolCodes Premium Delivery] Week ${activeWeekNumber} Classified Coupon Codes & Verified Slip Keys (PDF Attached)`}
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
                        Congratulations on maintaining your active <strong>{activePlan?.name || 'VIP'} Subscription License</strong> for the current Week {activeWeekNumber} pools league season!
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
                        {confirmedPaymentMail ? confirmedPaymentMail.pdfName : `FastPoolCodes_Week_${activeWeekNumber}_Classified_Coupon.pdf`}
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
                        const planId = activePlan?.id || 'plan-monthly';
                        if (onDownloadReceipt) {
                          onDownloadReceipt(currentUser, planId, activeSubscription?.payment_ref || '');
                        } else {
                          buySubscription(planId);
                        }
                      }}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-[10px] uppercase tracking-wider p-2 rounded-lg transition cursor-pointer flex items-center justify-center"
                      title="Download License Receipt & Codesheet (.txt)"
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
      {/* NOTIFICATIONS & SUBSCRIPTION DAYS REMAINING CENTER MODAL / DRAWER */}
      <AnimatePresence>
        {isNotificationDrawerOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-2 sm:p-4 select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#0b101d] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative text-left text-slate-100"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <BellRing className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
                      <span>Notifications & Subscriptions</span>
                      {totalUnreadCount > 0 && (
                        <span className="text-[10px] font-mono bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">
                          {totalUnreadCount} New
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Subscription days remaining, access alerts, and pool updates for @{currentUser.username}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsNotificationDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Close Notifications Center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
                {/* 1. Subscription Expiration & Days Remaining Live Gauge */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Active Subscriptions & Days Remaining</span>
                    </span>
                    <button
                      onClick={() => {
                        setIsNotificationDrawerOpen(false);
                        setActiveSubTab('subscription');
                      }}
                      className="text-[11px] font-mono font-bold text-emerald-400 hover:text-emerald-300 transition"
                    >
                      + Manage Plans
                    </button>
                  </div>

                  {activeSubsList.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-1.5">
                      <p className="text-xs text-slate-300 font-mono">
                        No active VIP membership found.
                      </p>
                      <button
                        onClick={() => {
                          setIsNotificationDrawerOpen(false);
                          setActiveSubTab('subscription');
                        }}
                        className="text-xs font-black text-emerald-400 hover:underline uppercase font-mono"
                      >
                        Upgrade to VIP to unlock full fixtures
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeSubsList.map((sub, sIdx) => {
                        const isCrit = sub.status === 'critical';
                        const isWarn = sub.status === 'expiring_soon';

                        return (
                          <div
                            key={`modal_sub_${sub.id}_${sIdx}`}
                            className={`p-4 rounded-2xl border transition relative overflow-hidden space-y-3 ${
                              isCrit
                                ? 'bg-gradient-to-r from-rose-950/40 via-slate-950 to-slate-900 border-rose-500/40'
                                : isWarn
                                ? 'bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-900 border-amber-500/40'
                                : 'bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-900 border-emerald-500/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-white uppercase tracking-tight">
                                    {sub.planName}
                                  </span>
                                  <span
                                    className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                                      isCrit
                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                                        : isWarn
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    }`}
                                  >
                                    {isCrit
                                      ? `🚨 ${sub.daysRemaining} DAY(S) LEFT`
                                      : isWarn
                                      ? `⚠️ ${sub.daysRemaining} DAYS LEFT`
                                      : `🛡️ ${sub.daysRemaining} DAYS LEFT`}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  Valid until {sub.expiresAt.toLocaleDateString()} ({sub.hoursRemaining} hours remaining)
                                </p>
                              </div>

                              <button
                                onClick={() => {
                                  setIsNotificationDrawerOpen(false);
                                  setActiveSubTab('subscription');
                                }}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase font-mono rounded-lg transition cursor-pointer shrink-0"
                              >
                                Extend
                              </button>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                <span>{sub.percentRemaining}% Validity Remaining</span>
                                <span>{sub.bookmakers.join(', ')}</span>
                              </div>
                              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isCrit
                                      ? 'bg-rose-500'
                                      : isWarn
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${sub.percentRemaining}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Notification Alerts List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Inbox className="w-3.5 h-3.5 text-blue-400" />
                      <span>Activity & Access Alerts ({allCombinedNotifications.length})</span>
                    </span>
                    {totalUnreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] font-mono font-bold text-slate-400 hover:text-white transition underline"
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>

                  {allCombinedNotifications.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs font-mono text-slate-500">
                      No notifications yet for @{currentUser.username}.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {allCombinedNotifications.map((notif, nIdx) => {
                        const isSubNotif = notif.type === 'subscription_expiring';

                        return (
                          <div
                            key={`notif_item_${notif.id}_${nIdx}`}
                            className={`p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                              !notif.is_read
                                ? notif.type === 'subscription_expired' || notif.type === 'payment_failed'
                                  ? 'bg-slate-900/90 border-rose-500/30'
                                  : notif.type === 'subscription_expiring'
                                  ? 'bg-slate-900/90 border-amber-500/30'
                                  : 'bg-slate-900/80 border-emerald-500/30'
                                : 'bg-slate-950/60 border-slate-800 opacity-85'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                                notif.type === 'subscription_expired' || notif.type === 'payment_failed'
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : notif.type === 'subscription_expiring'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : notif.type === 'subscription_activated'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {notif.type === 'subscription_activated' ? '🎉' : notif.type === 'subscription_expiring' ? <Clock className="w-4 h-4" /> : notif.type === 'subscription_expired' ? '⏳' : notif.type === 'payment_failed' ? '⚠️' : <Sparkles className="w-4 h-4" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-white truncate">
                                  {notif.title}
                                </h4>
                                {!notif.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-300 font-mono mt-1 leading-relaxed">
                                {notif.message || notif.body}
                              </p>
                              <span className="text-[9.5px] font-mono text-slate-500 mt-1 block">
                                {notif.created_at ? new Date(notif.created_at).toLocaleString() : 'Recent'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-800 bg-[#0F172A] flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsNotificationDrawerOpen(false);
                    setActiveSubTab('subscription');
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md font-mono"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>VIP Subscriptions & Pricing</span>
                </button>

                <button
                  onClick={() => setIsNotificationDrawerOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold rounded-xl border border-slate-800 transition cursor-pointer"
                >
                  Close
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
