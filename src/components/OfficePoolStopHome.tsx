import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Users,
  Globe,
  ChevronRight,
  Play,
  Lock,
  Sparkles,
  Zap,
  Award,
  X,
  RefreshCw,
  Mail,
  ShieldCheck,
  Check,
  CheckCircle2,
  Calendar,
  MessageSquare,
  HelpCircle,
  Hash,
  Star,
  Activity,
  ArrowRight,
  BookOpen,
  Home,
  FileText,
  Info,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ExpertBlogView from './ExpertBlogView';
import { getSupabaseClient } from '../lib/supabase';

interface OfficePoolStopHomeProps {
  onSignIn: () => void;
  onEnterManagerPanel: () => void;
  onNavigateToCodes: () => void;
  onNavigateToLiveScores: () => void;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  db: any;
  onRegisterUser?: (username: string, email: string, password?: string, planId?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  onLoginUser?: (usernameOrEmail: string, password?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
}

const staticBlogPosts = [
  {
    id: 'blog-1',
    title: 'Aussie Pools 2026 Season: Keys to Decrypting Major Fixture Draws',
    summary: 'FastPoolCodes has unlocked full-season decoder keys. Aussie coupon sheets and major bookmaker feeds have been registered. Our upgraded calculation engine computes maximum double-chance combinations instantly.',
    content: `Let's make football pool perming effortless. Our Aussie Pool Decryptor gives players total control over their coupon selections, sequences, and confidence weights. Whether you are placing a 3-draw perm or a long-stretch 10-match slip, our verified key sequence renders clearly cross-device.\n\nKey features include group-by-bookmaker codes, live draw result comparison, unauthenticated preview boards, and integration with top bookies to update winner tables immediately. Experience why serious coupon players trust FastPoolCodes.`,
    date: 'June 8, 2026',
    readTime: '3 min read'
  },
  {
    id: 'blog-2',
    title: 'Are You Ready for the 2026 UK Football Pools Season?',
    summary: 'Are you prepared to check verified weekly codes? Yes! We have launched substantial code pipeline upgrades to deliver weekly forecast numbers with zero delay.',
    content: `The 2026 UK Football Pools are shaping up to be legendary, and our forecasting team has been run-testing data streams to deliver error-free codes. This year, we are proud to launch predictive margin filters and automated odds integration.\n\nPlayers now have instant access to custom filters to locate the highest-vibe key numbers, track draw probabilities, and generate clean perming slips. Experience our zero-latency coupon decryptor and watch your predictions match afternoon results!`,
    date: 'June 1, 2026',
    readTime: '5 min read'
  },
  {
    id: 'blog-3',
    title: 'Double-Chance Perming: Maximize Return on Aussie Match Coupons',
    summary: 'Aussie pools are getting more exciting this winter! We break down the absolute best tie-breaking and point-allocation strategy to capture the maximum payout multiplier.',
    content: `With the expanded fixture lists, tracking football draws looks more complex than ever. Selecting correct high-odds draws requires disciplined forecasting. We recommend starting with a balanced 5-game slip.\n\nAt FastPoolCodes, we've integrated specific Aussie and UK coupon filters that automatically calculate payout potential in real-time, letting you watch your custom stats update as games finish. Check back every Tuesday for new keys!`,
    date: 'May 24, 2026',
    readTime: '4 min read'
  },
  {
    id: 'blog-4',
    title: "How Aussie Pools became UK & Nigeria's biggest coupon forecasting attraction of 2026",
    summary: "As traditional fixed odd sports tickets get tighter, football draw pools are capturing the minds of serious perming experts. We investigate the numerical phenomenon sweep.",
    content: `With standard single-match betting margins increasing, African and European players are rediscovering the timeless mathematical logic behind pool coupons and perming combinations. Let's look closer.\n\nAt FastPoolCodes, we have seen registrations double this month as customers discover deep double-chance matrices and reward pools. Learn how using verified coupon codes minimizes risk and creates steady, systematic perming strategies that align perfectly with coupon releases. Check back every Tuesday for pre-release keys and pointers.`,
    date: 'May 18, 2026',
    readTime: '6 min read'
  }
];

function formatBlogRows(rows: any[]) {
  return rows.map((b: any) => ({
    id: b.id,
    title: b.title || b.name || b.heading || b.subject || 'Untitled Analysis',
    summary: b.summary || b.description || b.content?.slice(0, 150) || b.body?.slice(0, 150) || 'No summary available.',
    content: b.content || b.body || b.text || b.article_content || '',
    date: b.date || (b.created_at ? new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })),
    readTime: b.read_time || b.readTime || b.read_duration || b.readTimeMinutes || '5 min read',
    image_url: b.image_url || b.imageUrl || b.image_link || b.imageLink || b.image || b.img || b.img_url || ''
  }));
}

export default function OfficePoolStopHome({
  onSignIn,
  onEnterManagerPanel,
  onNavigateToCodes,
  onNavigateToLiveScores,
  triggerToast,
  db,
  onRegisterUser,
  onLoginUser
}: OfficePoolStopHomeProps) {
  // Navigation & interaction states
  const [currentView, setCurrentView] = useState<'blog' | 'livescores' | 'results' | 'about' | 'contact'>('blog');
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [resultsSearchQuery, setResultsSearchQuery] = useState('');
  const [resultsTableSearch, setResultsTableSearch] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [showSystemAuth, setShowSystemAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authFields, setAuthFields] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Paywall states
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallPlan, setPaywallPlan] = useState<string>('plan-monthly');
  const [paywallForm, setPaywallForm] = useState({
    cardholder: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [pendingUser, setPendingUser] = useState<{ username: string; email: string; password?: string } | null>(null);

  // Blog states
  const [blogPosts, setBlogPosts] = useState<any[]>(() => {
    return getSupabaseClient() ? [] : staticBlogPosts;
  });
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [candidateErrors, setCandidateErrors] = useState<Record<string, string>>({});
  const [isBlogsLoading, setIsBlogsLoading] = useState(false);
  const [fetchCount, setFetchCount] = useState(0);
  const [blogModalArticle, setBlogModalArticle] = useState<any | null>(null);

  // Scoreboard horizontal ticker state
  const [liveScoresData, setLiveScoresData] = useState<any[]>([]);

  useEffect(() => {
    const fetchLiveScores = async () => {
      try {
        const response = await fetch("/api/livescores");
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        if (json.success) {
          setLiveScoresData(json.matches || []);
        }
      } catch (err) {
        console.warn("Graceful notice: Live scores not yet loaded from backend (standard polling behavior).");
      }
    };
    fetchLiveScores();
    const interval = setInterval(fetchLiveScores, 15000);
    return () => clearInterval(interval);
  }, []);

  const scoreboardRef = useRef<HTMLDivElement>(null);
  const [isScoreboardHovered, setIsScoreboardHovered] = useState(false);

  // Scroll implementation for scoreboard games ticker
  useEffect(() => {
    const container = scoreboardRef.current;
    if (!container) return;

    let iframeId: number;
    const scrollSpeed = 0.45;

    const runScroll = () => {
      if (!isScoreboardHovered) {
        container.scrollLeft += scrollSpeed;
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
      iframeId = requestAnimationFrame(runScroll);
    };

    iframeId = requestAnimationFrame(runScroll);
    return () => cancelAnimationFrame(iframeId);
  }, [isScoreboardHovered]);

  // Master fetch blogs function designed by the system and optimized by the user
  const fetchBlogs = async () => {
    setIsBlogsLoading(true);

    // Try secure Full-Stack server route first (bypasses browser mixed content / SSL constraints)
    try {
      const serverRes = await fetch('/api/blogs');
      if (serverRes.ok) {
        const json = await serverRes.json();
        if (json.success && json.data && json.data.length > 0) {
          const formatted = formatBlogRows(json.data);
          setBlogPosts(formatted);
          setSupabaseError(null);
          setIsBlogsLoading(false);
          return; // ✅ successful server-side proxy loading
        }
      }
    } catch (err) {
      console.warn('Backend proxy fetch unavailable, fell back to static list...', err);
    }

    // Default Fallback guaranteed
    setBlogPosts(staticBlogPosts);
    setIsBlogsLoading(false);
  };

  useEffect(() => {
    fetchBlogs();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    let activeChannel: any = null;
    try {
      // Set up real-time postgres subscription dynamically (bypassed on HTTPS client pages to avoid mixed-content ws rules blocks)
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
        activeChannel = supabase
          .channel('realtime-blogs-home')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'blogs'
            },
            () => {
              console.log('Real-time update on blogs table detected. Re-fetching.');
              fetchBlogs();
            }
          )
          .subscribe();
      }
    } catch (realtimeErr) {
      console.warn('Real-time subscription channel omitted in this secure client frame context:', realtimeErr);
    }

    return () => {
      if (activeChannel) {
        try {
          supabase.removeChannel(activeChannel);
        } catch (_) {}
      }
    };
  }, [fetchCount]);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthFields({ username: '', email: '', password: '' });
    setShowPassword(false);
    setShowSystemAuth(true);
    triggerToast(`Directing to ${mode === 'signup' ? 'Create Premium Account' : 'Sign In'} portal...`, 'info');
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'signup') {
      if (!authFields.username || !authFields.email || !authFields.password) {
        triggerToast('Please fill in all details (email, username, and password).', 'error');
        return;
      }
      if (!authFields.email.includes('@')) {
        triggerToast('Please provide a valid email address containing @.', 'error');
        return;
      }
      if (authFields.username.length < 3) {
        triggerToast('Username needs to be at least 3 characters.', 'error');
        return;
      }
      if (authFields.password.length < 5) {
        triggerToast('Security password must be at least 5 characters.', 'error');
        return;
      }

      if (onRegisterUser) {
        setIsBlogsLoading(true);
        triggerToast('Establishing your account on standard Free Plan...', 'info');
        onRegisterUser(authFields.username, authFields.email, authFields.password, 'plan-free')
          .then((res) => {
            setIsBlogsLoading(false);
            if (res.success) {
              triggerToast(res.message || `Account created successfully on Free Plan! Welcome!`, 'success');
              setShowSystemAuth(false);
            } else {
              triggerToast(res.error || 'Registration failed.', 'error');
            }
          })
          .catch((err) => {
            setIsBlogsLoading(false);
            triggerToast(err.message || 'Registration connection failed.', 'error');
          });
      } else {
        triggerToast('Local sandbox registration successful.', 'success');
        setShowSystemAuth(false);
        onSignIn();
      }
    } else {
      if (!authFields.username || !authFields.password) {
        triggerToast('Please fill in both username/email and password.', 'error');
        return;
      }
      if (onLoginUser) {
        setIsBlogsLoading(true);
        triggerToast('Verifying security session keys...', 'info');
        onLoginUser(authFields.username, authFields.password)
          .then((res) => {
            setIsBlogsLoading(false);
            if (res.success) {
              triggerToast(res.message || `Successfully logged in as @${authFields.username}!`, 'success');
              setShowSystemAuth(false);
            } else {
              triggerToast(res.error || `Authentication failed. Check your password or try signing up!`, 'error');
            }
          })
          .catch((err) => {
            setIsBlogsLoading(false);
            triggerToast(err.message || 'Login connection failed.', 'error');
          });
      } else {
        onSignIn();
      }
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paywallForm.cardholder || !paywallForm.cardNumber || !paywallForm.expiry || !paywallForm.cvv) {
      triggerToast('Please enter all credit card details to authorize access.', 'error');
      return;
    }

    setIsProcessingPayment(true);
    triggerToast('Connecting to payment gateways & establishing user profile...', 'info');

    const username = pendingUser?.username || authFields.username || 'VIP_User';
    const email = pendingUser?.email || authFields.email || 'vip@fastpoolcodes.com';
    const password = pendingUser?.password || authFields.password;

    setTimeout(() => {
      if (onRegisterUser) {
        onRegisterUser(username, email, password, paywallPlan)
          .then((res) => {
            setIsProcessingPayment(false);
            if (res.success) {
              triggerToast(res.message || `Payment Authorized! Premium account registered for @${username}. Welcome!`, 'success');
              setShowPaywall(false);
              setPendingUser(null);
            } else {
              triggerToast(res.error || 'Registration failed.', 'error');
            }
          })
          .catch((err) => {
            setIsProcessingPayment(false);
            triggerToast(err.message || 'Payment processing failed.', 'error');
          });
      } else {
        setIsProcessingPayment(false);
        triggerToast(`Payment Authorized! Premium access package activated.`, 'success');
        setShowPaywall(false);
        setPendingUser(null);
        onSignIn();
      }
    }, 1800);
  };

  return (
    <div className="w-full bg-[#030d0a] text-emerald-100 min-h-screen relative overflow-x-hidden">
      
      {/* 1. BRAND HEADER & EMBEDDED REAL-TIME SCORESSTICKER */}
      <header className="bg-gradient-to-b from-[#071310] to-[#030907] text-white border-b border-emerald-950/80 sticky top-0 z-40 shadow-xl flex flex-col">
        {/* Main Logo and Links Line */}
        <div className="w-full px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center justify-between lg:justify-start gap-8">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setCurrentView('blog'); triggerToast('Welcome to FastPoolCodes!', 'info'); }}>
              <div className="relative flex items-center justify-center font-black text-white text-xl md:text-2xl tracking-tighter bg-gradient-to-r from-emerald-400 to-teal-500 px-3 py-1 rounded-lg shadow-md shadow-emerald-950/40">
                <Zap className="w-5 h-5 text-slate-950 fill-current animate-pulse mr-1 inline" /> 
                <span className="text-slate-950 drop-shadow-sm truncate">FAST</span>
              </div>
              <div className="text-left">
                <span className="font-mono text-[9px] text-emerald-400 leading-none tracking-widest block font-black">SPORTS VERIFIED</span>
                <span className="font-sans font-extrabold text-[#FBBF24] text-sm tracking-wide leading-none block uppercase">Pool Codes</span>
              </div>
            </div>
          </div>

          {/* Navigation links - highly styled and responsive */}
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1 border-y lg:border-none border-emerald-950/50">
            {[
              { id: 'blog', label: 'HOME', icon: Home },
              { id: 'livescores', label: 'LIVE SCORES', icon: Activity },
              { id: 'results', label: 'POOL RESULTS', icon: Trophy },
              { id: 'about', label: 'ABOUT US', icon: Info },
              { id: 'contact', label: 'CONTACT US', icon: Phone },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = currentView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCurrentView(tab.id as any);
                    setSelectedResultId(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition whitespace-nowrap flex items-center gap-1.5 select-none cursor-pointer ${
                    active 
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25 scale-[1.03]' 
                      : 'text-slate-300 hover:text-white hover:bg-emerald-950/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-slate-950' : 'text-emerald-400/80'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions button group */}
          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={() => setCurrentView('livescores')}
              className="flex items-center gap-1.5 border border-amber-500/30 hover:border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 text-[11px] font-black uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all duration-150 cursor-pointer select-none"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Live Cast</span>
            </button>
            
            <button
              onClick={() => handleOpenAuth('login')}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-lg transition-all duration-150 shadow-md cursor-pointer select-none"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Real-time Sub-Header Scoreboard Ticker */}
        <div className="bg-[#020b08] border-t border-emerald-950/60 py-2.5 px-6 flex items-center">
          <span className="text-[9px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1 shrink-0 border-r border-emerald-950 pr-4 mr-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Sports Casting
          </span>
          <div 
            ref={scoreboardRef}
            onMouseEnter={() => setIsScoreboardHovered(true)}
            onMouseLeave={() => setIsScoreboardHovered(false)}
            className="flex-1 flex text-[11px] md:text-xs items-center select-none text-white overflow-x-auto scrollbar-none"
          >
            {liveScoresData.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-500/80 font-mono text-[9px] uppercase tracking-widest pl-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500/30 animate-pulse"></span>
                <span>Pre-season fixtures indexing... Week 49 starts soon</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 whitespace-nowrap h-full">
                {(liveScoresData.length < 4 ? [...liveScoresData, ...liveScoresData, ...liveScoresData, ...liveScoresData] : [...liveScoresData, ...liveScoresData]).map((match: any, idx: number) => {
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
                  let typeColor = 'text-slate-400';
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
                      key={idx}
                      onClick={() => {
                        setCurrentView('livescores');
                        triggerToast(`Loading matchcast: ${team1} vs ${team2}`, 'info');
                      }}
                      className="flex items-center border-r border-emerald-950/60 pr-5 pl-2 hover:bg-emerald-950/40 transition cursor-pointer h-full gap-3 text-left shrink-0"
                    >
                      <div className="flex flex-col justify-center">
                        <span className={`text-[8.5px] font-black tracking-widest font-mono ${typeColor}`}>
                          {typeStr}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5 font-bold text-slate-100">
                          <span className="text-[11.5px] tracking-wide">{team1}</span> 
                          <span className="text-amber-300 font-black text-[11px]">{score1}</span>
                          <span className="text-slate-650 text-[10px]">-</span>
                          <span className="text-[11.5px] tracking-wide">{team2}</span> 
                          <span className="text-amber-300 font-black text-[11px]">{score2}</span>
                        </div>
                      </div>
                      {isLiveStatus && (
                        <span className="bg-[#FA3E65]/15 border border-[#FA3E65]/20 text-[#FA3E65] text-[8px] font-black px-1.5 py-0.5 rounded shadow animate-pulse font-mono">
                          LIVE
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* WhatsApp Community Invitation Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#04150f] to-emerald-950 border-b border-emerald-500/25 py-3.5 px-4 md:px-8 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25D366]"></span>
          </span>
          <p className="text-xs font-semibold text-emerald-100 flex flex-wrap items-center gap-1.5 justify-center sm:justify-start">
            <span>Get instantly notified of Aussie, UK & local coupon pool code releases!</span>
            <span className="text-amber-300 font-extrabold uppercase font-mono text-[9px] tracking-wider px-2 py-0.5 bg-amber-950/40 rounded border border-amber-900/40">
              OFFICIAL COMMUNITY FEED
            </span>
          </p>
        </div>
        <a
          href="https://whatsapp.com/channel/0029VanbsS4EawdxbTTkgc3D"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-slate-950 text-xs font-extrabold uppercase tracking-wider px-5 py-2 rounded-full shadow-lg transition-all duration-150 cursor-pointer select-none font-mono"
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.739-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.637-1.03-5.114-2.905-6.99C16.554 1.875 14.075 1.83 11.445 1.83c-5.436 0-9.852 4.417-9.855 9.861-.001 1.77.464 3.497 1.349 5.031l-.995 3.637 3.703-.972zm11.366-5.835c-.322-.162-1.912-.944-2.207-1.052-.296-.108-.512-.162-.728.162-.216.324-.836 1.052-1.025 1.267-.19.215-.38.243-.703.081-.322-.162-1.362-.502-2.595-1.602-.958-.854-1.605-1.91-1.794-2.233-.19-.323-.02-.497.14-.658.145-.145.323-.377.484-.566.162-.188.216-.324.323-.539.108-.216.054-.404-.027-.566-.08-.162-.728-1.752-.998-2.4-.263-.633-.527-.547-.728-.557-.188-.01-.404-.01-.62-.01-.216 0-.566.081-.863.404-.296.324-1.132 1.105-1.132 2.694 0 1.59 1.159 3.127 1.32 3.342.162.216 2.28 3.483 5.526 4.883.772.333 1.375.53 1.844.68.776.246 1.482.211 2.041.127.622-.093 1.912-.782 2.181-1.5.27-.72.27-1.34.19-1.472-.081-.132-.296-.216-.62-.378z"/>
          </svg>
          <span>JOIN FREE CHANNEL</span>
        </a>
      </div>

      {/* 3. CORE VIEWS GENERATOR */}
      <div className="flex-1">
        {(() => {
          switch (currentView) {
            case 'blog':
            default:
              return (
                <ExpertBlogView
                  blogPosts={blogPosts}
                  onOpenAuth={handleOpenAuth}
                  onReadArticle={(article) => setBlogModalArticle(article)}
                  onOpenPaywall={() => setShowPaywall(true)}
                  triggerToast={triggerToast}
                  supabaseConfigured={getSupabaseClient() !== null}
                  supabaseError={supabaseError}
                  candidateErrors={candidateErrors}
                  onRefreshBlogs={fetchBlogs}
                />
              );

            case 'livescores': {
              const activeMatches = liveScoresData.length > 0 ? liveScoresData : [
                { id: '1', fixture: 'Arsenal vs Chelsea', score: '1 - 1', status: 'live', pool_number: '3' },
                { id: '2', fixture: 'Man City vs Everton', score: '2 - 2', status: 'live', pool_number: '12' },
                { id: '3', fixture: 'Leicester vs West Ham', score: '1 - 1', status: 'finished', pool_number: '26' },
                { id: '4', fixture: 'Aston Villa vs Wolves', score: '0 - 0', status: 'finished', pool_number: '7' },
                { id: '5', fixture: 'Roma vs Milan', score: '2 - 2', status: 'live', pool_number: '10' },
                { id: '6', fixture: 'Liverpool vs Leeds', score: '2 - 0', status: 'finished', pool_number: '2' },
                { id: '7', fixture: 'Tottenham vs Brentford', score: '1 - 0', status: 'finished', pool_number: '8' },
              ];

              return (
                <div className="max-w-7xl mx-auto px-6 py-12 space-y-8 text-left">
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/40 border border-emerald-900/40 px-3 py-1 rounded-full">
                      ⚽ Real-Time Soccer Cast
                    </span>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                      Official Pool Match Live Scores
                    </h2>
                    <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed font-semibold">
                      Follow the live statuses of active coupon fixtures. Matches are tracked in real-time, displaying official draw statuses to keep your perms synchronized instantly.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                    {activeMatches.map((match, idx) => {
                      const isLive = match.status === 'live';
                      const isFinished = match.status === 'finished';
                      return (
                        <div key={idx} className="bg-gradient-to-b from-[#071310] to-[#020705] border border-emerald-950 p-5 rounded-2xl space-y-4 hover:border-emerald-800 transition">
                          <div className="flex items-center justify-between border-b border-emerald-950/50 pb-3">
                            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-950/40 px-2.5 py-1 rounded border border-amber-900/30">
                              Pool Match #{match.pool_number || idx + 1}
                            </span>
                            <span className="flex items-center gap-1">
                              {isLive && (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-[#FA3E65] animate-ping"></span>
                                  <span className="text-[10px] font-mono font-black text-[#FA3E65] uppercase">Live</span>
                                </>
                              )}
                              {isFinished && (
                                <span className="text-[10px] font-mono font-black text-emerald-400 uppercase">Full Time</span>
                              )}
                              {!isLive && !isFinished && (
                                <span className="text-[10px] font-mono font-black text-slate-400 uppercase">Upcoming</span>
                              )}
                            </span>
                          </div>

                          <div className="py-2 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-white text-sm tracking-wide">{match.fixture.split(' vs ')[0]}</span>
                              <span className="font-black text-xl text-amber-400 font-mono">{match.score.split(' - ')[0] || '0'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-white text-sm tracking-wide">{match.fixture.split(' vs ')[1]}</span>
                              <span className="font-black text-xl text-amber-400 font-mono">{match.score.split(' - ')[1] || '0'}</span>
                            </div>
                          </div>

                          {/* Quick Simulated Goal Adjusters */}
                          <div className="flex items-center gap-1.5 pt-2 border-t border-emerald-950/40 justify-between">
                            <span className="text-[9px] font-mono text-slate-500 uppercase font-black">Admin Simulation</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  const parts = match.score.split(' - ');
                                  const n1 = parseInt(parts[0]) || 0;
                                  const n2 = parseInt(parts[1]) || 0;
                                  match.score = `${n1 + 1} - ${n2}`;
                                  setLiveScoresData([...activeMatches]);
                                  triggerToast(`Goal scored! ${match.fixture.split(' vs ')[0]} goes up.`, 'success');
                                }}
                                className="px-2 py-1 bg-emerald-950 text-emerald-400 hover:bg-emerald-900 text-[10px] font-bold rounded cursor-pointer transition border border-emerald-900/30 font-mono"
                              >
                                H+1
                              </button>
                              <button
                                onClick={() => {
                                  const parts = match.score.split(' - ');
                                  const n1 = parseInt(parts[0]) || 0;
                                  const n2 = parseInt(parts[1]) || 0;
                                  match.score = `${n1} - ${n2 + 1}`;
                                  setLiveScoresData([...activeMatches]);
                                  triggerToast(`Goal scored! ${match.fixture.split(' vs ')[1]} goes up.`, 'success');
                                }}
                                className="px-2 py-1 bg-emerald-950 text-emerald-400 hover:bg-emerald-900 text-[10px] font-bold rounded cursor-pointer transition border border-emerald-900/30 font-mono"
                              >
                                A+1
                              </button>
                              <button
                                onClick={() => {
                                  match.status = match.status === 'finished' ? 'live' : 'finished';
                                  setLiveScoresData([...activeMatches]);
                                  triggerToast(`Match status toggled to: ${match.status.toUpperCase()}`, 'info');
                                }}
                                className="px-2 py-1 bg-slate-900 text-slate-300 hover:bg-slate-800 text-[10px] font-bold rounded cursor-pointer transition border border-slate-800 font-mono"
                              >
                                FT
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pool disclaimer */}
                  <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-2xl p-6 flex items-start gap-4 mt-8">
                    <span className="text-2xl">📢</span>
                    <div className="space-y-1">
                      <h4 className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest">
                        Aussie & UK Pool Coupon Matching Policy
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                        Pool numbers correspond strictly to the official weekend coupon sheet lists. If a match is marked postponed (PPD), our real-time feed updates instantly. Draw results are verified by official pools adjudicators before final payments trigger.
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            case 'results': {
              const resultsList = db.pool_results || [];

              const filteredResults = resultsList.filter(r => 
                r.title?.toLowerCase().includes(resultsSearchQuery.toLowerCase()) || 
                r.week_number?.toString().includes(resultsSearchQuery)
              );

              // CSV Exporter Helper
              const handleExportCSV = (result: any) => {
                try {
                  const headers = 'Match No,Home Team,Away Team,Full Time Score,Outcome,Payout Status\n';
                  const baseRows = result.results_table || [];
                  const filtered = baseRows.filter((row: any) => {
                    if (!resultsTableSearch) return true;
                    const s = resultsTableSearch.toLowerCase();
                    return (
                      row.homeTeam?.toLowerCase().includes(s) ||
                      row.awayTeam?.toLowerCase().includes(s) ||
                      row.outcome?.toLowerCase().includes(s) ||
                      row.payoutStatus?.toLowerCase().includes(s) ||
                      row.matchNo?.toString().includes(s) ||
                      row.fullTimeScore?.toString().includes(s)
                    );
                  });
                  const rows = filtered.map((row: any) => 
                    `"${row.matchNo}","${row.homeTeam}","${row.awayTeam}","${row.fullTimeScore}","${row.outcome}","${row.payoutStatus}"`
                  ).join('\n');
                  
                  const blob = new Blob([headers + rows], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.setAttribute('href', url);
                  a.setAttribute('download', `FastPoolCodes_Week_${result.week_number}_Results.csv`);
                  a.click();
                  triggerToast(`Week ${result.week_number} results spreadsheet (.csv) downloaded successfully (${filtered.length} rows)!`, 'success');
                } catch (e) {
                  triggerToast('Export failed. Please try again.', 'error');
                }
              };

              return (
                <div className="max-w-7xl mx-auto px-6 py-12 space-y-8 text-left">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                      <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/40 border border-emerald-900/40 px-3 py-1 rounded-full">
                        🏆 Adjudicated Archives
                      </span>
                      <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                        Official Weekly Pool Results
                      </h2>
                      <p className="text-slate-400 text-xs md:text-sm max-w-xl leading-relaxed font-semibold">
                        Verify payouts and coupon draw codes from completed seasons. Click on any week to view individual full-fixture outcomes.
                      </p>
                    </div>

                    {/* Search Field */}
                    <div className="w-full md:w-80">
                      <input
                        type="text"
                        placeholder="Search by week or title..."
                        value={resultsSearchQuery}
                        onChange={(e) => setResultsSearchQuery(e.target.value)}
                        className="w-full bg-[#071310] border border-emerald-950 rounded-xl px-4.5 py-3 text-xs text-white focus:outline-none focus:border-emerald-600 transition font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                    {/* List of weeks */}
                    <div className="lg:col-span-5 space-y-4">
                      {filteredResults.length === 0 ? (
                        <div className="p-8 text-center bg-[#071310]/50 border border-emerald-950 rounded-2xl text-slate-500 text-xs font-bold">
                          No results found matching search terms.
                        </div>
                      ) : (
                        filteredResults.map((result: any) => {
                          const isSelected = selectedResultId === result.id || (!selectedResultId && filteredResults[0].id === result.id);
                          const totalDraws = (result.results_table || []).filter((x: any) => x.outcome === 'DRAW').length;
                          return (
                            <div 
                              key={result.id}
                              onClick={() => setSelectedResultId(result.id)}
                              className={`p-5 rounded-2xl border transition cursor-pointer text-left relative overflow-hidden flex flex-col gap-3 ${
                                isSelected 
                                  ? 'bg-gradient-to-r from-emerald-950/50 to-[#04150f] border-emerald-500/50' 
                                  : 'bg-gradient-to-r from-zinc-950 to-zinc-900/10 border-emerald-950 hover:border-emerald-900/40'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider">
                                  Week {result.week_number} • Year {result.season_year}
                                </span>
                                <span className="bg-emerald-950 text-emerald-400 text-[9px] font-mono font-black px-2 py-0.5 rounded border border-emerald-900/30">
                                  {totalDraws} DRAWS CLEARED
                                </span>
                              </div>
                              <h3 className="font-extrabold text-white text-sm uppercase leading-tight font-sans tracking-wide">
                                {result.title}
                              </h3>
                              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold border-t border-emerald-950/40 pt-3 mt-1">
                                <span>Fixture Date: {result.fixture_date || 'N/A'}</span>
                                <span className="text-amber-300 flex items-center gap-1">
                                  View details <span>→</span>
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Week Details Table */}
                    <div className="lg:col-span-7">
                      {(() => {
                        const activeResult = resultsList.find(x => x.id === (selectedResultId || (filteredResults[0] && filteredResults[0].id)));
                        if (!activeResult) {
                          return (
                            <div className="p-12 text-center bg-[#071310]/30 border border-emerald-950 rounded-2xl text-slate-500 text-xs font-bold">
                              Select a week to view comprehensive draw listings.
                            </div>
                          );
                        }

                        const activeResultRows = (activeResult.results_table || []).filter((row: any) => {
                          if (!resultsTableSearch) return true;
                          const s = resultsTableSearch.toLowerCase();
                          return (
                            row.homeTeam?.toLowerCase().includes(s) ||
                            row.awayTeam?.toLowerCase().includes(s) ||
                            row.outcome?.toLowerCase().includes(s) ||
                            row.payoutStatus?.toLowerCase().includes(s) ||
                            row.matchNo?.toString().includes(s) ||
                            row.fullTimeScore?.toString().includes(s)
                          );
                        });

                        return (
                          <div className="bg-[#071310]/60 border border-emerald-950/80 rounded-2xl overflow-hidden shadow-xl flex flex-col">
                            <div className="p-5 border-b border-emerald-950 flex items-center justify-between bg-gradient-to-r from-[#071310] to-[#040e0b]">
                              <div className="text-left">
                                <span className="text-[9px] font-mono font-black text-amber-400 uppercase tracking-widest block">
                                  Active Record Sheet
                                </span>
                                <h3 className="text-white font-extrabold text-sm uppercase tracking-wide mt-0.5">
                                  {activeResult.title}
                                </h3>
                              </div>
                              <button
                                onClick={() => handleExportCSV(activeResult)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow shadow-emerald-500/10"
                              >
                                <span>📥 Export Excel</span>
                              </button>
                            </div>

                            {/* Detailed Results Table Search Filter */}
                            <div className="px-5 py-3 border-b border-emerald-950/45 bg-[#030a07] flex items-center justify-between gap-3">
                              <input
                                type="text"
                                placeholder="Filter fixtures (e.g. Arsenal, Chelsea, DRAW)..."
                                value={resultsTableSearch}
                                onChange={(e) => setResultsTableSearch(e.target.value)}
                                className="w-full bg-[#071310] border border-emerald-950/80 rounded-lg px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-emerald-600 transition font-mono"
                              />
                              {resultsTableSearch && (
                                <button
                                  onClick={() => setResultsTableSearch('')}
                                  className="text-[10px] text-slate-400 hover:text-white uppercase font-mono font-bold shrink-0"
                                >
                                  Clear
                                </button>
                              )}
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-[#020b08] text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-widest border-b border-emerald-950">
                                    <th className="py-3.5 px-4 text-center">No</th>
                                    <th className="py-3.5 px-4">Match Fixture</th>
                                    <th className="py-3.5 px-4 text-center">FT Score</th>
                                    <th className="py-3.5 px-4 text-center">Outcome</th>
                                    <th className="py-3.5 px-4 text-right">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-950/35 font-semibold text-slate-300">
                                  {activeResultRows.map((row: any, rIdx: number) => {
                                    const isDraw = row.outcome === 'DRAW';
                                    return (
                                      <tr key={rIdx} className={`hover:bg-emerald-950/20 transition ${isDraw ? 'bg-amber-950/10' : ''}`}>
                                        <td className="py-3 px-4 text-center text-amber-300 font-mono font-bold">
                                          {row.matchNo}
                                        </td>
                                        <td className="py-3 px-4 text-white">
                                          {row.homeTeam} <span className="text-slate-550 font-medium">vs</span> {row.awayTeam}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono font-black text-amber-300">
                                          {row.fullTimeScore}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                          <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded border ${
                                            isDraw 
                                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' 
                                              : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                                          }`}>
                                            {row.outcome}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-right text-slate-400 font-mono text-[10px]">
                                          {row.payoutStatus || 'CLEARED'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            }

            case 'about':
              return (
                <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 text-left">
                  {/* Editorial Title */}
                  <div className="space-y-4 text-center md:text-left max-w-3xl">
                    <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/40 border border-emerald-900/40 px-3.5 py-1.5 rounded-full inline-block">
                      📖 FastPool Library & Story
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-white leading-tight uppercase tracking-tight">
                      About FastPool.com
                    </h2>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed font-semibold">
                      FastPool.com is the ultimate premium analytics and forecasting database designed to decode weekly football pool coupons across the UK, Australian, and Nigerian combined pool seasons.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4 items-start">
                    <div className="space-y-6">
                      <h3 className="text-white text-lg font-black uppercase tracking-wider border-b border-emerald-950 pb-2 flex items-center gap-2">
                        <span className="text-amber-400">01.</span> Our Legacy & Vision
                      </h3>
                      <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                        FastPoolCodes was founded in Lagos, Nigeria, originally as a printed weekly forecasting journal for serious pool stakers who permed combinations on local coupons. Over two decades, our forecasting methodology grew from paper calculations into a robust relational digital matrix.
                      </p>
                      <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-semibold">
                        In 2026, we launched our digital portal to bypass traditional delay structures. By publishing expert checklists and keys directly to stakers' devices, we empower players across UK, Australian, and West African markets with mathematically sound, verified double-chance forecasts.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-white text-lg font-black uppercase tracking-wider border-b border-emerald-950 pb-2 flex items-center gap-2">
                        <span className="text-amber-400">02.</span> Mathematical Sequence Analysis
                      </h3>
                      <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                        Unlike fixed odds betting, pool perming is a game of combination filtering and mathematical sequence tracking. Each coupon week has an active spacing sequence, a layout keyset, and historical draw matrices.
                      </p>
                      <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-semibold">
                        Our internal decoders verify these sequences using historical data going back to the 1990s. We then compile this intelligence into a single highly encrypted <span className="text-amber-400 font-mono">.txt</span> codesheet, pushing it directly to paid stakers immediately upon release.
                      </p>
                    </div>
                  </div>

                  {/* Core Values Bento Grid */}
                  <div className="bg-[#071310]/40 border border-emerald-950 rounded-3xl p-8 space-y-6">
                    <h3 className="text-white text-base font-black uppercase tracking-wider text-center">
                      Our Guiding Principles
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-[#020b08] p-5 rounded-2xl border border-emerald-950/80">
                        <span className="text-2xl">⚡</span>
                        <h4 className="text-white text-xs font-black uppercase mt-3">Zero Delay Deliveries</h4>
                        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                          We understand that stakers need codes immediately when coupons are printed. We guarantee instant file delivery inside the dashboard.
                        </p>
                      </div>
                      <div className="bg-[#020b08] p-5 rounded-2xl border border-emerald-950/80">
                        <span className="text-2xl">🔒</span>
                        <h4 className="text-white text-xs font-black uppercase mt-3">Verified Calculations</h4>
                        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                          Every key sequence published on our blog is double-checked by senior forecasting experts to filter out high-risk variations.
                        </p>
                      </div>
                      <div className="bg-[#020b08] p-5 rounded-2xl border border-emerald-950/80">
                        <span className="text-2xl">🌍</span>
                        <h4 className="text-white text-xs font-black uppercase mt-3">Global Community Support</h4>
                        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                          From Lagos to London, we support stakers with reliable WhatsApp feeds, email helplines, and offline code-sheet verification.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Team Placeholder Grid (Google SEO Friendly) */}
                  <div className="space-y-6">
                    <div className="text-center md:text-left">
                      <h3 className="text-white text-lg font-black uppercase tracking-wider">
                        Meet the Expert Forecasting Decoders
                      </h3>
                      <p className="text-slate-400 text-xs mt-1">
                        Our administrative panel consists of mathematical modelers, historical analysts, and community advocates.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { name: 'Chief forecaster Emmanuel', role: 'Head Decryptor & Technical Architect', bio: 'Specialist in Australian spacing sequences and UK winter coupon draw calculations.' },
                        { name: 'Solomon Davies', role: 'Senior Database Analyst', bio: 'Manages relational databases and real-time live match integrations.' },
                        { name: 'Agent FastPool Support', role: 'Community & Customer Advocate', bio: 'Guarantees direct staker communications and WhatsApp community notifications.' }
                      ].map((member, mIdx) => (
                        <div key={mIdx} className="bg-gradient-to-b from-[#071310] to-[#020705] border border-emerald-950 p-6 rounded-2xl flex flex-col items-center text-center space-y-4">
                          <div className="w-24 h-24 rounded-full bg-emerald-950/80 border-2 border-emerald-500/30 flex items-center justify-center relative group overflow-hidden">
                            <Users className="w-8 h-8 text-emerald-400" />
                            <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-350">
                              <span className="text-[9px] font-mono font-black text-amber-300">FastPool Staff</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-white text-sm font-black uppercase tracking-wider">{member.name}</h4>
                            <span className="text-[9.5px] font-mono text-emerald-400 font-extrabold uppercase mt-0.5 block">{member.role}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-normal font-semibold">
                            {member.bio}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );

            case 'contact': {
              const handleContactSubmit = (e: React.FormEvent) => {
                e.preventDefault();
                if (!contactForm.name || !contactForm.email || !contactForm.message) {
                  triggerToast('Please provide your name, email, and detailed message.', 'error');
                  return;
                }
                setIsSendingContact(true);
                setTimeout(() => {
                  setIsSendingContact(false);
                  triggerToast(`Ticket received successfully! We will contact you at ${contactForm.email} shortly.`, 'success');
                  setContactForm({ name: '', email: '', subject: '', message: '' });
                }, 1400);
              };

              return (
                <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 text-left">
                  <div className="space-y-2 text-center md:text-left">
                    <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/40 border border-emerald-900/40 px-3 py-1 rounded-full">
                      ✉️ Helpdesk & support
                    </span>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                      Contact FastPool.com
                    </h2>
                    <p className="text-slate-400 text-xs md:text-sm max-w-xl leading-relaxed font-semibold">
                      Need help decrypting coupons or retrieving premium files? Get in touch directly via Email or WhatsApp. Our forecasters are online 24/7.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
                    {/* Contact details */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="bg-gradient-to-b from-[#071310] to-[#020705] border border-emerald-950 p-6 rounded-2xl space-y-5">
                        <h3 className="text-white text-xs font-mono font-black uppercase tracking-widest border-b border-emerald-950/60 pb-3">
                          Direct Communication Pathways
                        </h3>
                        
                        <div className="space-y-4 font-semibold text-xs text-slate-300">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase font-mono block">Official Support Email</span>
                            <a 
                              href="mailto:Fastpoolcodes@gmail.com" 
                              className="text-white hover:text-[#fa3e65] text-sm font-extrabold transition block"
                            >
                              📧 Fastpoolcodes@gmail.com
                            </a>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase font-mono block">WhatsApp Hotline Support</span>
                            <a 
                              href="https://wa.me/2348030587933" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-white hover:text-emerald-500 text-sm font-extrabold transition block"
                            >
                              💬 +234 803 058 7933 (WhatsApp Only)
                            </a>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase font-mono block">Active Forecasting Office Hours</span>
                            <p className="text-white">
                              Tuesday 9:00 AM — Sunday 6:00 PM (GMT +1)
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-emerald-950/20 border border-emerald-950 p-6 rounded-2xl flex items-start gap-3">
                        <span className="text-2xl">🔒</span>
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-white uppercase font-sans">Security Notice</h4>
                          <p className="text-[11px] text-slate-400 leading-normal font-semibold">
                            FastPoolCodes never asks for account passwords or credit card PIN codes over WhatsApp. All billing transactions are encrypted securely on our platform.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Direct inquiry Form */}
                    <div className="lg:col-span-7 bg-gradient-to-b from-[#071310] to-[#020705] border border-emerald-950 p-6 rounded-2xl">
                      <form onSubmit={handleContactSubmit} className="space-y-5">
                        <h3 className="text-white text-xs font-mono font-black uppercase tracking-widest border-b border-emerald-950/60 pb-3">
                          Send a Direct Inquiry Message
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">Your Full Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. John Doe"
                              value={contactForm.name}
                              onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                              className="w-full bg-[#030d0a] border border-emerald-950 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-white font-semibold transition"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">Email Address</label>
                            <input
                              type="email"
                              required
                              placeholder="e.g. john@example.com"
                              value={contactForm.email}
                              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                              className="w-full bg-[#030d0a] border border-emerald-950 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-white font-semibold transition"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">Inquiry Subject</label>
                          <input
                            type="text"
                            placeholder="e.g. Premium Subscription File Access"
                            value={contactForm.subject}
                            onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                            className="w-full bg-[#030d0a] border border-emerald-950 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-white font-semibold transition"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">Detailed Message Description</label>
                          <textarea
                            required
                            rows={4}
                            placeholder="Write your questions or feedback here..."
                            value={contactForm.message}
                            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                            className="w-full bg-[#030d0a] border border-emerald-950 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-white font-semibold transition resize-none font-semibold"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSendingContact}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-900/40 text-slate-950 font-black text-xs uppercase tracking-wider py-4.5 rounded-xl transition cursor-pointer select-none shadow-md"
                        >
                          {isSendingContact ? 'PROCESSING MESSAGE FEEDBACK...' : 'SUBMIT SUPPORT TICKETS'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            }


          }
        })()}
      </div>

      {/* 4. SYSTEM DETAIL ARTICLE MODAL DIALOG OVERLAY */}
      <AnimatePresence>
        {blogModalArticle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[99] backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#111] text-zinc-100 max-w-xl w-full rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Image banner header within Modal */}
              <div className="relative h-44 w-full bg-zinc-900 border-b border-zinc-800 shrink-0">
                {blogModalArticle.image_url ? (
                  <img 
                    src={blogModalArticle.image_url} 
                    alt={blogModalArticle.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-zinc-900 to-black flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-emerald-800 animate-pulse" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                
                {/* Close Button */}
                <button 
                  onClick={() => setBlogModalArticle(null)}
                  className="absolute top-4 right-4 w-9 h-9 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center border border-zinc-700/60 transition active:scale-95 cursor-pointer shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-4 left-5 text-left">
                  <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider block w-fit">
                    ANALYSIS DETAILED VIEW
                  </span>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="p-6 overflow-y-auto text-left space-y-4 font-sans">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 text-[11px] font-bold text-zinc-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {blogModalArticle.date}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-extrabold">{blogModalArticle.readTime}</span>
                  </div>
                  <h3 className="font-sans font-black text-white text-xl md:text-2xl leading-tight tracking-tight">
                    {blogModalArticle.title}
                  </h3>
                </div>

                <div className="h-px bg-zinc-800 w-full my-3"></div>

                <div className="text-zinc-300 text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                  {blogModalArticle.content || blogModalArticle.summary}
                </div>

                {/* Additional footer warning promo */}
                <div className="bg-emerald-950/25 border border-emerald-900/40 rounded-xl p-4.5 space-y-2 mt-6">
                  <h5 className="font-extrabold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Unlock Live API Code Feeds
                  </h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
                    This analysis is verified by Australian draw calculators. Unlock the actual betting sequences keys inside our members section to maximize perming rates.
                  </p>
                  <button 
                    onClick={() => {
                      setBlogModalArticle(null);
                      setShowPaywall(true);
                    }}
                    className="mt-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[10px] uppercase py-2 px-4 rounded-lg tracking-wider transition active:scale-95 cursor-pointer block text-center"
                  >
                    Unlock VIP Code Sheets Now
                  </button>
                </div>
              </div>

              {/* Bottom close CTA */}
              <div className="bg-zinc-950 p-4 border-t border-zinc-800 shrink-0 flex justify-end gap-3 select-none">
                <button 
                  onClick={() => setBlogModalArticle(null)}
                  className="bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-black uppercase px-6 py-2.5 rounded-lg transition active:scale-95 cursor-pointer"
                >
                  Close Analysis
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. PAYWALL CHECKOUT GATE MODAL DIALOG OVERLAY */}
      <AnimatePresence>
        {showPaywall && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[99] backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#05110e] text-emerald-100 max-w-md w-full rounded-2xl border-2 border-amber-400 p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative text-left"
            >
              <button 
                onClick={() => {
                  setShowPaywall(false);
                  setPendingUser(null);
                }}
                className="absolute top-4 right-4 text-emerald-550 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2 mb-6 select-none">
                <Award className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
                <h3 className="font-sans font-black text-xl text-white tracking-tight uppercase">VIP Premium Pass Checkout</h3>
                <p className="text-[11px] text-emerald-400 font-bold max-w-xs mx-auto">
                  Authorize payment to register access account on fastpoolcodes.com and access daily secret keys!
                </p>
              </div>

              {/* Plans selector inside Paywall Checkout */}
              <div className="grid grid-cols-2 gap-2.5 mb-5 select-none text-xs">
                {(db.subscription_plans || []).filter((p: any) => p.id !== 'plan-free').map((p: any) => {
                  const isActive = paywallPlan === p.id;
                  const cycleAbbr = p.billing_cycle === 'biannual' ? '6mo' : p.billing_cycle === 'quarterly' ? '3mo' : p.billing_cycle === 'weekly' ? 'wk' : p.billing_cycle === 'monthly' ? 'mo' : 'yr';
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPaywallPlan(p.id)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition ${
                        isActive
                          ? 'border-amber-400 bg-amber-400/10 text-white'
                          : 'border-emerald-950 hover:bg-emerald-950/20 text-slate-400'
                      }`}
                    >
                      <span className="font-black font-mono block text-xs tracking-tight text-amber-300">₦{p.price.toLocaleString()} / {cycleAbbr}</span>
                      <span className="text-[9.5px] mt-1 font-bold block leading-none">{p.name}</span>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="space-y-1.5 text-xs">
                  <label className="block text-slate-300 font-extrabold font-mono tracking-wider uppercase text-[10px]">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={paywallForm.cardholder}
                    onChange={(e) => setPaywallForm({ ...paywallForm, cardholder: e.target.value })}
                    className="w-full bg-[#020b08] border border-emerald-900 rounded-lg p-3 text-[#A7F3D0] focus:ring-1 focus:ring-amber-400 focus:outline-none placeholder:text-emerald-950"
                    placeholder="e.g. Mikhail de Guzman"
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="block text-slate-300 font-extrabold font-mono tracking-wider uppercase text-[10px]">Card Number</label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    value={paywallForm.cardNumber}
                    onChange={(e) => setPaywallForm({ ...paywallForm, cardNumber: e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim() })}
                    className="w-full bg-[#020b08] border border-emerald-900 rounded-lg p-3 text-[#A7F3D0] focus:ring-1 focus:ring-amber-400 focus:outline-none font-mono placeholder:text-emerald-950"
                    placeholder="4000 1234 5678 9010"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-slate-300 font-extrabold font-mono tracking-wider uppercase text-[10px]">Expiry (MM / YY)</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={paywallForm.expiry}
                      onChange={(e) => setPaywallForm({ ...paywallForm, expiry: e.target.value.replace(/(\d{2})(\d)/, '$1/$2') })}
                      className="w-full bg-[#020b08] border border-emerald-900 rounded-lg p-3 text-center text-[#A7F3D0] focus:ring-1 focus:ring-amber-400 focus:outline-none font-mono placeholder:text-emerald-950"
                      placeholder="12/28"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-slate-300 font-extrabold font-mono tracking-wider uppercase text-[10px]">CVV Code</label>
                    <input
                      type="password"
                      required
                      maxLength={3}
                      value={paywallForm.cvv}
                      onChange={(e) => setPaywallForm({ ...paywallForm, cvv: e.target.value.replace(/\D/g, '') })}
                      className="w-full bg-[#020b08] border border-emerald-900 rounded-lg p-3 text-center text-[#A7F3D0] focus:ring-1 focus:ring-amber-400 focus:outline-none font-mono placeholder:text-emerald-950"
                      placeholder="***"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="w-full mt-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-slate-950 font-black text-xs uppercase py-4 rounded-xl shadow-lg shadow-amber-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Authorizing Secure Deposit...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Unlock VIP Season Feed Access</span>
                    </>
                  )}
                </button>

                <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-xl flex items-start gap-2 text-left">
                  <span className="text-sm">📥</span>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-mono font-black text-[#FBBF24] uppercase">Instant Phone/PC Download Active</p>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Upon subscription completion, the complete premium decrypted pool codesheet file (.txt) will automatically trigger a download to your device (mobile phone, tablet, or PC) immediately.
                    </p>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. PROFILE AUTH DIALOG OVERLAY */}
      <AnimatePresence>
        {showSystemAuth && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[99] backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#05110e] border border-emerald-900 rounded-2xl max-w-sm w-full p-6 text-left relative shadow-2xl"
            >
              <button 
                onClick={() => setShowSystemAuth(false)}
                className="absolute top-4 right-4 text-emerald-555 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6 select-none space-y-1.5">
                <Zap className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
                <h3 className="font-sans font-black text-lg text-white tracking-tight uppercase">
                  {authMode === 'signup' ? 'Create Free Account' : 'Access Member Account'}
                </h3>
                <p className="text-[10px] text-emerald-400/80 font-semibold max-w-xs mx-auto leading-relaxed">
                  FastPoolCodes simulator systems securely encrypt identity codes for active sheets access.
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-1 text-xs">
                  <label className="block text-slate-300 font-extrabold font-mono tracking-wider uppercase text-[10px]">
                    {authMode === 'signup' ? 'Enter Username' : 'Username or Email'}
                  </label>
                  <input
                    type="text"
                    required
                    value={authFields.username}
                    onChange={(e) => setAuthFields({ ...authFields, username: e.target.value })}
                    className="w-full bg-[#020b08] border border-emerald-950 rounded-lg p-3 text-[#A7F3D0] focus:ring-1 focus:ring-emerald-400 focus:outline-none placeholder:text-emerald-950 font-semibold"
                    placeholder="e.g. john_doe_forecaster"
                  />
                  {authMode === 'login' && (
                    <span 
                      onClick={() => {
                        setAuthFields({ ...authFields, username: 'john_doe_free' });
                        triggerToast('Demo Free profile set up correctly.', 'success');
                      }}
                      className="text-[9.5px] text-amber-500 font-black uppercase cursor-pointer block text-right mt-1 hover:underline"
                    >
                      Bypass using demo free: "john_doe_free"? Or "vip_admin_2026"?
                    </span>
                  )}
                </div>

                {authMode === 'signup' && (
                  <div className="space-y-1 text-xs">
                    <label className="block text-slate-300 font-extrabold font-mono tracking-wider uppercase text-[10px]">Your Email Address</label>
                    <input
                      type="email"
                      required
                      value={authFields.email}
                      onChange={(e) => setAuthFields({ ...authFields, email: e.target.value })}
                      className="w-full bg-[#020b08] border border-emerald-950 rounded-lg p-3 text-[#A7F3D0] focus:ring-1 focus:ring-emerald-400 focus:outline-none placeholder:text-emerald-950 font-semibold"
                      placeholder="e.g. john@fastpoolcodes.com"
                    />
                  </div>
                )}

                <div className="space-y-1 text-xs">
                  <label className="block text-slate-300 font-extrabold font-mono tracking-wider uppercase text-[10px]">Security Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={authFields.password}
                    onChange={(e) => setAuthFields({ ...authFields, password: e.target.value })}
                    className="w-full bg-[#020b08] border border-emerald-955 rounded-lg p-3 text-[#A7F3D0] focus:ring-1 focus:ring-emerald-400 focus:outline-none placeholder:text-[#062017]"
                    placeholder="••••••••"
                  />
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <label className="flex items-center gap-1.5 text-slate-405 font-medium cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showPassword} 
                        onChange={() => setShowPassword(!showPassword)}
                        className="rounded border-emerald-900 bg-[#020b08] text-emerald-500 focus:ring-0"
                      />
                      <span>Show Characters</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-xs uppercase py-3.5 rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer mt-2 text-center"
                >
                  {authMode === 'signup' ? 'Create Free Account' : 'Access Portal Dashboard'}
                </button>
              </form>

              {/* Toggle mode links */}
              <div className="mt-5 text-center text-xs text-slate-400 select-none">
                {authMode === 'signup' ? (
                  <>
                    Already signed up?{' '}
                    <span 
                      onClick={() => setAuthMode('login')}
                      className="text-emerald-400 font-black cursor-pointer hover:underline"
                    >
                      Login Profile
                    </span>
                  </>
                ) : (
                  <>
                    New coupon forecast user?{' '}
                    <span 
                      onClick={() => setAuthMode('signup')}
                      className="text-emerald-400 font-black cursor-pointer hover:underline"
                    >
                      Create Free Account
                    </span>
                  </>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
