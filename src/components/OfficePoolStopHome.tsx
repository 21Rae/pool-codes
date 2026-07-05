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
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ExpertBlogView from './ExpertBlogView';
import { getSupabaseClient } from '../lib/supabase';

interface OfficePoolStopHomeProps {
  onSignIn: () => void;
  onEnterManagerPanel: () => void;
  onNavigateToCodes: () => void;
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
  triggerToast,
  db,
  onRegisterUser,
  onLoginUser
}: OfficePoolStopHomeProps) {
  // Navigation & interaction states
  const [currentView, setCurrentView] = useState<'marketing' | 'blog'>('blog');
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
  const [paywallPlan, setPaywallPlan] = useState<'weekly' | 'monthly' | 'quarterly' | 'biannual' | 'yearly'>('monthly');
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
        const json = await response.json();
        if (json.success) {
          setLiveScoresData(json.matches || []);
        }
      } catch (err) {
        console.error("Error loading live scores on home:", err);
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
        onRegisterUser(username, email, password)
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
      <header className="bg-gradient-to-r from-[#071310] via-[#030907] to-[#05110e] text-white border-b border-emerald-950 px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => triggerToast('Welcome to FastPoolCodes!', 'info')}>
            <div className="relative flex items-center justify-center font-black text-white text-xl md:text-2xl tracking-tighter bg-gradient-to-r from-emerald-400 to-teal-500 px-3 py-1 rounded-lg shadow-md shadow-emerald-950/40">
              <Zap className="w-5 h-5 text-slate-950 fill-current animate-pulse mr-1 inline" /> 
              <span className="text-slate-950 drop-shadow-sm truncate">FAST</span>
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-mono text-[9px] text-emerald-400 leading-none tracking-widest block font-black">SPORTS VERIFIED</span>
              <span className="font-sans font-extrabold text-[#FBBF24] text-sm tracking-wide leading-none block uppercase">Pool Codes</span>
            </div>
          </div>
        </div>

        {/* Scoreboard ticker */}
        <div 
          ref={scoreboardRef}
          onMouseEnter={() => setIsScoreboardHovered(true)}
          onMouseLeave={() => setIsScoreboardHovered(false)}
          className="flex flex-1 mx-2 md:mx-8 text-[11px] md:text-sm h-11 md:h-12 items-center select-none text-white border-l border-emerald-800/60 px-2 md:px-6 overflow-x-auto scrollbar-none"
        >
          {liveScoresData.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-500/80 font-mono text-[10px] uppercase tracking-widest pl-4">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse"></span>
              <span>No active live match trackers in database</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 h-full whitespace-nowrap">
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
                    onClick={() => triggerToast(`Match details: ${team1} vs ${team2} (${typeStr})`, 'info')}
                    className="flex items-center border-r border-emerald-950/60 pr-5 pl-2 hover:bg-emerald-950/40 transition cursor-pointer h-full gap-4 text-left shrink-0"
                  >
                    <div className="flex flex-col justify-center">
                      <span className={`text-[9.5px] font-black tracking-widest ${typeColor}`}>
                        {typeStr}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 font-extrabold">
                        <span className="text-neutral-100 text-[12.5px] tracking-wide">{team1}</span> 
                        <span className="text-amber-300 font-black text-[11.5px]">{score1}</span>
                        <span className="text-emerald-500 text-[10px]">-</span>
                        <span className="text-neutral-100 text-[12.5px] tracking-wide">{team2}</span> 
                        <span className="text-amber-300 font-black text-[11.5px]">{score2}</span>
                      </div>
                    </div>
                    {isLiveStatus && (
                      <span className="bg-[#FA3E65]/15 border border-[#FA3E65]/20 text-[#FA3E65] text-[9px] font-black px-2 py-0.5 rounded shadow animate-pulse font-mono">
                        LIVE
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleOpenAuth('login')}
            className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all duration-150 shadow-md cursor-pointer select-none"
          >
            Sign In
          </button>
        </div>
      </header>



      {/* 3. CORE VIEWS GENERATOR */}
      {currentView === 'blog' ? (
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
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-20">
          
          {/* HERO PREVIEW BLOCK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-left">
              <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-500/25 px-3.5 py-1.5 rounded-full inline-flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5" /> Sports Forecasting 2026 Core
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                Instantly Decode Verified <span className="text-amber-400 drop-shadow">Sports Pool Codes</span>
              </h1>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed font-semibold">
                Gain competitive metrics on coupon draws, double-chance sequences, and pool forecasting lines. Instantly download fully-encrypted betting guides compatible with top bookmaker terminals across UK, Aussie, and West Africa.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider px-8 py-4 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  Create Premium Account
                </button>
                <button
                  onClick={() => {
                    setCurrentView('blog');
                    triggerToast('Scanning real-time expert tables...');
                  }}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white border border-emerald-900 font-black text-xs uppercase tracking-wider px-8 py-4 rounded-xl transition"
                >
                  Read Free Previews
                </button>
              </div>
            </div>

            <div className="relative group rounded-3xl overflow-hidden border-4 border-emerald-500/20 shadow-2xl shadow-emerald-950/30">
              <img
                src="https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=700"
                alt="Pro Sports Turf"
                className="w-full h-80 object-cover brightness-75 contrast-110 group-hover:scale-105 transition duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-left">
                <span className="bg-[#111] text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded text-[10px] font-black uppercase font-mono tracking-widest inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Real-Time Feed
                </span>
                <h4 className="text-white font-black text-lg mt-2 font-sans">Aussie Pools Code Calculator</h4>
              </div>
            </div>
          </div>

          {/* BENEFIT BENTO BENCH GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-gradient-to-br from-zinc-950 to-emerald-950/25 border border-emerald-950 p-6 rounded-2xl relative overflow-hidden">
              <div className="w-10 h-10 bg-amber-400/10 text-amber-400 rounded-lg flex items-center justify-center font-bold mb-4 font-mono">
                01
              </div>
              <h3 className="text-white font-black text-base uppercase">Premium Keys</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Expert analyzed sports codes with maximum combinations filtered to minimize staking risks.
              </p>
            </div>
            <div className="bg-gradient-to-br from-zinc-950 to-[#fa3e65]/10 border border-[#fa3e65]/20 p-6 rounded-2xl relative overflow-hidden">
              <div className="w-10 h-10 bg-[#fa3e65]/10 text-[#fa3e65] rounded-lg flex items-center justify-center font-bold mb-4 font-mono">
                02
              </div>
              <h3 className="text-white font-black text-base uppercase">Bypass RLS</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                We pull data directly from public blogs table instantly to feed visitors maximum perming values without delay.
              </p>
            </div>
            <div className="bg-gradient-to-br from-zinc-950 to-teal-950/25 border border-emerald-950 p-6 rounded-2xl relative overflow-hidden">
              <div className="w-10 h-10 bg-emerald-400/10 text-emerald-400 rounded-lg flex items-center justify-center font-bold mb-4 font-mono">
                03
              </div>
              <h3 className="text-white font-black text-base uppercase">Real-Time sync</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Integrated Postgres socket hooks trigger instantly on data updates to deliver instant results.
              </p>
            </div>
          </div>

          {/* HOW TO PERM TUTORIAL GRAPHICS */}
          <div className="bg-gradient-to-b from-[#0c1f19] to-[#040c0a] border border-emerald-900/35 rounded-3xl p-8 text-center space-y-6 max-w-2xl mx-auto">
            <Trophy className="w-12 h-12 text-amber-300 animate-bounce mx-auto" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Need help decoding sheets?</h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
              Every Australian sequence depends on key numbers and special spacing. Click to open our live walk-through tutorial and become a perming master today.
            </p>
            <button
              onClick={() => triggerToast('Interactive walk-through guide successfully queued! Check back shortly.', 'success')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase px-7 py-3 rounded-full shadow-lg cursor-pointer transform hover:scale-105 transition"
            >
              Start Interactive Guide
            </button>
          </div>

        </div>
      )}

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
                {[
                  { key: 'weekly', val: '$15 / wk', label: 'Starter Weekly' },
                  { key: 'monthly', val: '$35 / mo', label: 'Popular Monthly (70% Off)' },
                  { key: 'yearly', val: '$199 / yr', label: 'Maximum Annual (85% Off)' }
                ].map((plan) => {
                  const isActive = paywallPlan === plan.key;
                  return (
                    <button
                      key={plan.key}
                      onClick={() => setPaywallPlan(plan.key as any)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition ${
                        isActive
                          ? 'border-amber-400 bg-amber-400/10 text-white'
                          : 'border-emerald-950 hover:bg-emerald-950/20 text-slate-400'
                      }`}
                    >
                      <span className="font-black font-mono block text-xs tracking-tight text-amber-300">{plan.val}</span>
                      <span className="text-[9.5px] mt-1 font-bold block leading-none">{plan.label}</span>
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
