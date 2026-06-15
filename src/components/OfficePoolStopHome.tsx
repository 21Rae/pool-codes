import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Users,
  Globe,
  Star,
  Activity,
  Heart,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowRight,
  Play,
  FileText,
  Lock,
  Unlock,
  Wrench,
  CheckCircle2,
  ListFilter,
  BarChart4,
  Layout,
  UserCheck,
  Search,
  BookOpen,
  Calendar,
  MessageSquare,
  HelpCircle,
  Hash,
  Share2,
  X,
  Sparkles,
  Zap,
  Info,
  ShieldCheck,
  Check,
  Mail,
  Smartphone,
  CheckSquare,
  Compass,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ExpertBlogView from './ExpertBlogView';

interface OfficePoolStopHomeProps {
  onSignIn: () => void;
  onEnterManagerPanel: () => void;
  onNavigateToCodes: () => void;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  db: any;
  onRegisterUser?: (username: string, email: string) => void;
  onLoginUser?: (usernameOrEmail: string) => boolean;
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
  // Navigation states & interactive mockup states
  const [showSystemAuth, setShowSystemAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authFields, setAuthFields] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Secure Paywall state triggers immediately after account registration
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallPlan, setPaywallPlan] = useState<'weekly' | 'monthly' | 'quarterly' | 'biannual' | 'yearly'>('monthly');
  const [paywallForm, setPaywallForm] = useState({
    cardholder: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [pendingUser, setPendingUser] = useState<{ username: string; email: string } | null>(null);

  const [activeAccordion, setActiveAccordion] = useState<string | null>('nfl');
  const [blogModalArticle, setBlogModalArticle] = useState<any | null>(null);
  const [currentView, setCurrentView] = useState<'marketing' | 'blog'>('blog');
  const [customizationTab, setCustomizationTab] = useState<'home' | 'standings' | 'picks' | 'stats' | 'manager'>('home');
  const [demoBracketTeams, setDemoBracketTeams] = useState<string[]>([
    'Dallas', 'Philadelphia', 'San Francisco', 'Green Bay',
    'Kansas City', 'Buffalo', 'Baltimore', 'Houston'
  ]);
  const [bracketScores, setBracketScores] = useState<Record<string, string>>({
    'Dallas-vs-Philadelphia-Dallas': '28', 'Dallas-vs-Philadelphia-Philadelphia': '24',
    'SanFrancisco-vs-GreenBay-SanFrancisco': '31', 'SanFrancisco-vs-GreenBay-GreenBay': '17',
    'KansasCity-vs-Buffalo-KansasCity': '24', 'KansasCity-vs-Buffalo-Buffalo': '27',
    'Baltimore-vs-Houston-Baltimore': '35', 'Baltimore-vs-Houston-Houston': '20',
    'SF-vs-Dallas-SF': '14', 'SF-vs-Dallas-Dallas': '17',
    'Baltimore-vs-Buffalo-Baltimore': '28', 'Baltimore-vs-Buffalo-Buffalo': '24',
    'Dallas-vs-Baltimore-Dallas': '21', 'Dallas-vs-Baltimore-Baltimore': '24'
  });
  const [bracketWinners, setBracketWinners] = useState<Record<string, string>>({
    round1_match1: 'Dallas',
    round1_match2: 'San Francisco',
    round1_match3: 'Buffalo',
    round1_match4: 'Baltimore',
    round2_match1: 'Dallas',
    round2_match2: 'Baltimore',
    champion: 'Baltimore'
  });

  // League wizard states
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    name: 'Weekly Premium Alert',
    sport: 'UK Football Pools',
    format: 'Weekly Sheet',
    startWeek: 'Week 49',
    access: 'VIP Tier',
    theme: '#10B981'
  });

  // Demo NFL Pick Sheet state
  const [userPicks, setUserPicks] = useState<Record<string, string>>({
    match1: 'Home',
    match2: 'Away',
    match3: 'Home'
  });

  // Demo blog articles data based exactly on the image
  const blogPosts = [
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

  // Extracted games list representing the Top Score ticker on the screenshot
  const scoreboardGames = [
    { type: 'Aussie • FT', team1: 'MELB', score1: '2', team2: 'SYD', score2: '1', status: 'COMPLETED' },
    { type: 'UK • FT', team1: 'CHE', score1: '1', team2: 'ARS', score2: '1', status: 'COMPLETED' },
    { type: 'Aussie • FT', team1: 'BRIS', score1: '1', team2: 'ADEL', score2: '1', status: 'COMPLETED' },
    { type: 'UK • FT', team1: 'TOT', score1: '0', team2: 'MUN', score2: '2', status: 'COMPLETED' },
    { type: 'Gilas • LIVE', team1: 'NGR', score1: '84', team2: 'GHA', score2: '79', status: 'Q4 2:15' },
    { type: 'PBA • LIVE', team1: 'SMB', score1: '95', team2: 'BGSM', score2: '93', status: 'Q4 0:42' },
  ];

  const homeScoreboardRef = useRef<HTMLDivElement>(null);
  const [isHomeScoreboardHovered, setIsHomeScoreboardHovered] = useState(false);

  useEffect(() => {
    const container = homeScoreboardRef.current;
    if (!container) return;

    let animationFrameId: number;
    const speed = 0.45; // Pixels per frame

    const scroll = () => {
      if (!isHomeScoreboardHovered) {
        container.scrollLeft += speed;
        // Reset when reaching halfway of duplicated list content
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHomeScoreboardHovered]);

  // Simulated live picks statistics
  const [pickStats, setPickStats] = useState({
    match1: { Home: 72, Away: 28 },
    match2: { Home: 41, Away: 59 },
    match3: { Home: 85, Away: 15 }
  });

  // Carousel interactive state
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [carouselFilter, setCarouselFilter] = useState("All");

  const carouselItems = [
    {
      id: 1,
      title: "Week 49 Aussie Golden Key",
      category: "Aussie Keys",
      description: "Match 08 & 19 verified sequence using bet365 Aussie decryption keys.",
      verifiedOdds: "High Confidence",
      releaseDate: "Released June 08",
      hotFactor: "🔥 98% Perm Accuracy"
    },
    {
      id: 2,
      title: "UK FIXED Draw Trio",
      category: "UK Pools",
      description: "Matches 03, 14, and 28 mathematically secured with direct UK pool formulas.",
      verifiedOdds: "3-Draw Sequence",
      releaseDate: "Released June 09",
      hotFactor: "⚡ Trending No. 1"
    },
    {
      id: 3,
      title: "SportyBet 18-Week Loop",
      category: "SportyBet",
      description: "Decrypted sequence matching Sportybet Nigeria and Ghana pool code lines.",
      verifiedOdds: "Perm 3 of 4",
      releaseDate: "Released June 10",
      hotFactor: "📈 High Volume"
    },
    {
      id: 4,
      title: "bet365 Special Aussie Sequence",
      category: "bet365 Keys",
      description: "Formula block X-19 targeting Aussie fixtures with high margin multipliers.",
      verifiedOdds: "Aussie Major Key",
      releaseDate: "Released June 10",
      hotFactor: "🎯 Verified Target"
    },
    {
      id: 5,
      title: "BetKing Week 50 Draw Pointer",
      category: "BetKing",
      description: "Advanced numerical offsets for matches 21 and 42 based on key series.",
      verifiedOdds: "2-Over-2 Match",
      releaseDate: "Early Release",
      hotFactor: "💎 Premium Only"
    },
    {
      id: 6,
      title: "MSport Super Fast Permer",
      category: "MSport",
      description: "Automated sequence matrix for high stake perms in the MSport terminal layout.",
      verifiedOdds: "8-Lines Combo",
      releaseDate: "Just Added",
      hotFactor: "🚀 Instant Load"
    }
  ];

  const handlePickSelection = (match: string, side: 'Home' | 'Away') => {
    setUserPicks(prev => ({ ...prev, [match]: side }));
    triggerToast(`Logged pick: ${side} for ${match === 'match1' ? 'Cowboys vs Giants' : match === 'match2' ? 'Eagles vs Chiefs' : 'Packers vs Bears'}`, 'success');
  };

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
      
      // Store pending profile info and redirect immediately to Paywall Gate!
      setPendingUser({
        username: authFields.username,
        email: authFields.email
      });
      setShowSystemAuth(false);
      setShowPaywall(true);
      triggerToast('Profile created. Premium checkout step initialized to unlock the live feeds.', 'success');
    } else {
      if (!authFields.username || !authFields.password) {
        triggerToast('Please fill in both username/email and password.', 'error');
        return;
      }
      if (onLoginUser) {
        const ok = onLoginUser(authFields.username);
        if (ok) {
          triggerToast(`Successfully authenticated as @${authFields.username}! Session ready.`, 'success');
          setShowSystemAuth(false);
        } else {
          triggerToast(`Account not found matching "${authFields.username}"! Feel free to Sign Up new account, or type trial user: "john_doe_free".`, 'error');
        }
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
    triggerToast('Connecting to payment gateways...', 'info');

    setTimeout(() => {
      setIsProcessingPayment(false);
      
      const username = pendingUser?.username || authFields.username || 'VIP_User';
      const email = pendingUser?.email || authFields.email || 'vip@fastpoolcodes.com';

      if (onRegisterUser) {
        onRegisterUser(username, email);
      } else {
        onSignIn();
      }

      triggerToast(`Payment Authorized! Premium access package activated for @${username}. Welcome to FastPoolCodes!`, 'success');
      setShowPaywall(false);
      setPendingUser(null);
    }, 2200);
  };

  const handleCreateLeagueSubmit = () => {
    setShowWizard(false);
    triggerToast(`Congratulations! "${wizardData.name}" has been registered using the ${wizardData.format} format.`, 'success');
    // Navigate straight to simulated user portal
    onEnterManagerPanel();
  };

  const handleAdvanceBracket = (round: string, match: string, team: string) => {
    if (round === 'round1_m1') {
      setBracketWinners(prev => ({ ...prev, round2_match1: team }));
      triggerToast(`${team} advanced to Semifinals!`, 'info');
    } else if (round === 'round1_m2') {
      setBracketWinners(prev => ({ ...prev, round2_match2: team }));
      triggerToast(`${team} advanced to Semifinals!`, 'info');
    } else if (round === 'round2') {
      setBracketWinners(prev => ({ ...prev, champion: team }));
      triggerToast(`🏆 ${team} has been declared Champion of the Interactive Bracket!`, 'success');
    }
  };

  return (
    <div className="w-full bg-[#030d0a] text-emerald-100 min-h-screen relative overflow-x-hidden">
      
      {/* HEADER exactly mimicking screenshot */}
      <header className="bg-gradient-to-r from-[#071310] via-[#030907] to-[#05110e] text-white border-b border-emerald-950 px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-8">
          {/* Logo FastPoolCodes */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => triggerToast('Welcome to FastPoolCodes!', 'info')}>
            <div className="relative flex items-center justify-center font-black text-white text-xl md:text-2xl tracking-tighter bg-gradient-to-r from-emerald-400 to-teal-500 px-3 py-1 rounded-lg shadow-md shadow-emerald-950/40">
              <Zap className="w-5 h-5 text-slate-950 fill-current animate-pulse mr-1 inline" /> <span className="text-slate-950 drop-shadow-sm truncate" style={{ fontFamily: 'sans-serif' }}>FAST</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-mono text-[9px] text-emerald-400 leading-none tracking-widest block font-black">SPORTS VERIFIED</span>
              <span className="font-sans font-extrabold text-[#FBBF24] text-sm tracking-wide leading-none block uppercase">Pool Codes</span>
            </div>
          </div>
        </div>

        {/* TOP SCOREBOARD STRIP (PREMIUM STYLE) - MOVED IN-BETWEEN */}
        <div 
          ref={homeScoreboardRef}
          onMouseEnter={() => setIsHomeScoreboardHovered(true)}
          onMouseLeave={() => setIsHomeScoreboardHovered(false)}
          onTouchStart={() => setIsHomeScoreboardHovered(true)}
          onTouchEnd={() => setIsHomeScoreboardHovered(false)}
          className="flex flex-1 mx-2 md:mx-8 text-[11px] md:text-sm h-11 md:h-12 items-center select-none text-white border-l border-emerald-800/60 px-2 md:px-6 overflow-x-auto scrollbar-none"
        >
          <div className="flex items-center gap-3 h-full whitespace-nowrap">
            {[...scoreboardGames, ...scoreboardGames].map((game, idx) => (
              <div 
                key={idx}
                onClick={() => triggerToast(`Match details: ${game.team1} vs ${game.team2}`, 'info')}
                className="flex items-center border-r border-emerald-950/60 pr-5 pl-2 hover:bg-emerald-950/40 transition cursor-pointer h-full gap-4 text-left"
              >
                <div className="flex flex-col justify-center">
                  <span className={`text-[9.5px] font-black tracking-widest ${game.type.includes('LIVE') ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {game.type.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 font-extrabold">
                    <span className="text-neutral-100 text-[12.5px] tracking-wide">{game.team1}</span> 
                    <span className="text-amber-300 font-black text-[11.5px]">{game.score1}</span>
                    <span className="text-emerald-500 text-[10px]">-</span>
                    <span className="text-neutral-100 text-[12.5px] tracking-wide">{game.team2}</span> 
                    <span className="text-amber-300 font-black text-[11.5px]">{game.score2}</span>
                  </div>
                </div>
                {game.type.includes('LIVE') && (
                  <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded shadow animate-pulse">
                    {game.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Header CTA action */}
        <div className="flex items-center gap-4">


          <button
            onClick={() => handleOpenAuth('login')}
            className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all duration-150 shadow-md cursor-pointer select-none"
          >
            Sign In
          </button>
        </div>
      </header>

      {currentView === 'marketing' ? (
        <>
          {/* HERO SECTION MATCHING SCREENSHOT GRAPHICS AND COLOR TONE */}
          <section className="bg-[#030d0a] text-white pt-8 pb-20 px-6 relative border-b border-emerald-950/40 select-none">
        
        {/* Subtle decorative background pitch grid pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start relative z-10">
          
          {/* Hero Left Column contents */}
          <div className="flex flex-col items-center text-center gap-6 lg:pt-4 w-full">
            
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-black tracking-tight leading-tight text-white select-none">
              Unlock Verified Weekly<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-300 font-black" style={{ textShadow: '0 0 35px rgba(16, 185, 129, 0.15)' }}>
                Sports Pool Codes
              </span>
            </h1>

            <div className="space-y-2 flex flex-col items-center">
              <p className="text-emerald-400 text-xs font-black tracking-widest uppercase select-none bg-emerald-950/80 border border-emerald-500/35 px-4.5 py-2 rounded-full inline-flex items-center gap-2 shadow-inner">
                <Trophy className="w-4 h-4 text-emerald-400 animate-pulse" /> PREMIUM SPORTS POOL CODES STORE
              </p>
              <p className="text-slate-300 text-base md:text-lg font-bold select-none leading-relaxed">
                Instant secure delivery of UK & Aussie football pool codes.
              </p>
            </div>

            {/* Direct primary CTA Actions - Center-focused for maximum accessibility */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full mt-2">
              <button
                onClick={() => {
                  handleOpenAuth('signup');
                }}
                className="bg-amber-400 hover:bg-amber-500 scale-105 hover:scale-110 text-slate-950 font-black text-sm tracking-wider uppercase px-12 py-5 rounded-2xl shadow-2xl shadow-amber-950/50 transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer duration-150 animate-bounce"
              >
                Get Pool Codes <ArrowRight className="w-5 h-5 animate-pulse" />
              </button>
            </div>

            {/* Video Helper Indicator */}
            <button
              onClick={() => {
                triggerToast('Demo Video: "How to Decode & Perm Pool Key Numbers" launched successfully.', 'success');
              }}
              className="flex items-center justify-center gap-2.5 text-xs font-semibold text-slate-300 hover:text-white transition duration-150 cursor-pointer mt-1 group"
            >
              <span className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 hover:border-emerald-400 flex items-center justify-center text-emerald-500 shadow-lg group-hover:scale-105 transition">
                <Play className="w-3 h-3 fill-emerald-500" />
              </span>
              <span className="underline decoration-slate-600 hover:decoration-emerald-400">
                Watch: How to Decode & Perm Pool Key Numbers
              </span>
            </button>

          </div>

          {/* Interactive Bracket Graphic Mockup on the right */}
          <div className="flex flex-col items-center lg:items-stretch gap-6 relative w-full">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-96 bg-emerald-500/10 rounded-full filter blur-3xl -z-10 animate-pulse"></div>
            
            {/* Elegant Hero Image Frame - REALLY BIG & BOLD */}
            <div className="w-full bg-[#030d0a]/90 rounded-2xl border-4 border-emerald-500 p-3 shadow-[0_0_60px_rgba(16,185,129,0.3)] relative overflow-hidden group">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1569531955323-33c6b2dca44b?q=80&w=692&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Sports Stadium Turf Pitch"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-all duration-1000 brightness-[0.95] contrast-[1.10]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030d0a] via-transparent to-transparent opacity-80"></div>
                
                {/* Visual indicator tag */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-slate-950/95 px-3.5 py-1.5 rounded-lg text-[10px] font-mono tracking-widest font-black uppercase text-emerald-400 border border-emerald-400/50 shadow-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  LIVE VERIFIED CODES READY
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EMERALD SPORTS CODES SHOWCASE */}
      <section className="bg-[#04100D] text-white py-20 px-6 relative overflow-hidden border-b border-emerald-950/40">
        
        {/* Subtle decorative grid/dot background */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dot-matrix" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-matrix)" />
          </svg>
        </div>

        {/* Ambient background glows */}
        <div className="absolute -left-1/4 -top-1/4 w-[600px] h-[600px] bg-emerald-950/20 rounded-full filter blur-[150px] pointer-events-none animate-pulse"></div>
        <div className="absolute -right-1/4 -bottom-1/4 w-[600px] h-[600px] bg-teal-950/15 rounded-full filter blur-[150px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          {/* Left Column Content */}
          <div className="flex flex-col items-start gap-8">
            
            {/* Top plus symbols and intro badge */}
            <div className="flex flex-col gap-3">
              <div className="text-emerald-400/30 text-sm font-mono tracking-[0.4em] select-none">
                + + + + + + +
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-300 bg-emerald-950/45 border border-emerald-500/35 px-3 py-1 rounded">
                  VERIFIED SPORTS POOL MARKET
                </span>
                <div className="flex gap-1 text-emerald-400">
                  <span className="text-[10px] animate-pulse">▶</span>
                  <span className="text-[10px] animate-pulse delay-100">▶</span>
                  <span className="text-[10px] animate-pulse delay-200">▶</span>
                </div>
              </div>
            </div>

            {/* Slogan */}
            <div className="space-y-2 text-left">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-wider text-transparent select-none leading-none" style={{ WebkitTextStroke: "1px rgba(16, 185, 129, 0.7)" }}>
                DECODE AND WIN
              </h2>
              <h3 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white uppercase tracking-tight select-none">
                WEEKLY COUPONS
              </h3>
            </div>

            {/* Paragraph Description */}
            <p className="text-emerald-100/80 text-sm md:text-base max-w-lg leading-relaxed text-left font-medium">
              We provide verified weekly coupon codes, Aussie codes, and UK football forecasting sheets for serious bookmaker players. Increase your perming accuracy with expert-verified math codes.
            </p>

            {/* Interactive Rounded Action Button with lower plus indicators */}
            <div className="flex items-center justify-center gap-6 mt-4 w-full">
              <button
                onClick={() => {
                  handleOpenAuth('signup');
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs tracking-wider uppercase px-8 py-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.03] active:scale-95 duration-150 cursor-pointer"
              >
                GET WEEKLY CODES
              </button>

              <div className="text-emerald-400/30 text-sm font-mono tracking-[0.4em] select-none hidden sm:block">
                + + + + + + +
              </div>
            </div>

          </div>

          {/* Right Column Player Composition and Concentric Circles */}
          <div className="relative flex items-center justify-center min-h-[400px] lg:min-h-[500px] w-full">
            
            {/* Concentric Decorative Rings */}
            <div className="absolute w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] md:w-[440px] md:h-[440px] border border-emerald-500/10 rounded-full flex items-center justify-center pointer-events-none">
              <div className="w-[180px] h-[180px] sm:w-[260px] sm:h-[260px] md:w-[320px] md:h-[320px] border border-emerald-500/5 rounded-full flex items-center justify-center">
                <div className="w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] md:w-[200px] md:h-[200px] border border-emerald-500/5 rounded-full"></div>
              </div>
            </div>

            {/* Concentric Circle accents outside */}
            <div className="absolute w-[400px] h-[400px] md:w-[520px] md:h-[520px] border border-dashed border-emerald-900/15 rounded-full pointer-events-none"></div>

            {/* Collage Container */}
            <div className="relative w-full max-w-lg h-full flex items-center justify-center gap-4 sm:gap-6 z-10 p-4">
              
              {/* Dynamic Sports Graphic 1: Soccer player */}
              <div className="relative w-[150px] sm:w-[210px] aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-emerald-500/20 -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-500 group cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600"
                  alt="Soccer Pro Action"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale contrast-[1.2] brightness-[0.7] group-hover:grayscale-0 group-hover:brightness-[0.95] group-hover:scale-105 transition-all duration-700"
                />
                {/* Emerald green gradient overlay */}
                <div className="absolute inset-0 bg-emerald-500/10 mix-blend-color group-hover:opacity-0 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#030d0a] via-transparent to-transparent opacity-80"></div>
                <div className="absolute bottom-3 left-3 text-left">
                  <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold block">PITCH ZONE</span>
                  <span className="text-xs font-black text-white block mt-0.5">SOCCER PRO</span>
                </div>
              </div>

              {/* Dynamic Sports Graphic 2: Basketball player */}
              <div className="relative w-[150px] sm:w-[210px] aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-emerald-500/20 rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-500 group mt-12 cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=600"
                  alt="Basketball Pro Action"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale contrast-[1.1] brightness-[0.7] group-hover:grayscale-0 group-hover:brightness-[0.95] group-hover:scale-105 transition-all duration-700"
                />
                {/* Gold tint overlay */}
                <div className="absolute inset-0 bg-amber-500/10 mix-blend-color group-hover:opacity-0 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#030d0a] via-transparent to-transparent opacity-80"></div>
                <div className="absolute bottom-3 left-3 text-left">
                  <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold block">COURT ZONE</span>
                  <span className="text-xs font-black text-white block mt-0.5">SLAM DUNK</span>
                </div>
              </div>

              {/* Floating Ball decoration replaced with premium styled Trophy */}
              <div className="absolute bg-[#03110d] w-14 h-14 rounded-full border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.5)] animate-bounce pointer-events-none select-none z-20">
                <Trophy className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>

              {/* Arrow design accents */}
              <div className="absolute bottom-4 right-1/4 flex gap-1 text-emerald-400 opacity-50 z-20">
                <span>▲</span>
                <span>▲</span>
                <span>▲</span>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* DYNAMIC FORECAST CAROUSEL SECTION */}
      <section className="bg-[#020a08] border-t border-emerald-950/60 border-b border-purple-950/20 py-20 px-6 select-none relative overflow-hidden">
        {/* Subtle radial lights background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div className="text-left">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-[10px] tracking-widest uppercase font-black">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Active Live Feed</span>
              </div>
              <h3 className="text-3xl font-black text-white mt-1 uppercase tracking-tight">
                Trending Coupon Decrypters
              </h3>
              <p className="text-xs text-emerald-400/70 mt-1.5 max-w-md">
                Scroll through premium perming lists and verified key sheets updated just minutes ago by our global forecasting network.
              </p>
            </div>

            {/* Filter Pill Controls */}
            <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-emerald-950/55">
              {["All", "Aussie Keys", "UK Pools", "bet365 Keys", "Special"].map((cat) => {
                const isActive = carouselFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setCarouselFilter(cat);
                      setCarouselActiveIndex(0);
                      triggerToast(`Switched feed view to: ${cat}`, 'info');
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                      isActive 
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Carousel Layout Box */}
          {(() => {
            const filteredCarousel = carouselFilter === "All" 
              ? carouselItems 
              : carouselItems.filter(item => {
                  if (carouselFilter === "Special") {
                    return item.category !== "Aussie Keys" && item.category !== "UK Pools" && item.category !== "bet365 Keys";
                  }
                  return item.category === carouselFilter;
                });

            if (filteredCarousel.length === 0) {
              return (
                <div className="py-16 text-center text-slate-500 font-mono text-xs">
                  No active keys found matching this category filter.
                </div>
              );
            }

            // Ensure index is in safe boundaries
            const safeIdx = carouselActiveIndex >= filteredCarousel.length ? 0 : carouselActiveIndex;
            const currentItem = filteredCarousel[safeIdx];

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left Controller Pillar */}
                <div className="lg:col-span-1 flex lg:flex-col justify-center items-center gap-4">
                  <button
                    onClick={() => {
                      const prevIdx = (safeIdx - 1 + filteredCarousel.length) % filteredCarousel.length;
                      setCarouselActiveIndex(prevIdx);
                    }}
                    className="w-12 h-12 rounded-full border border-emerald-900/40 bg-slate-950 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 flex items-center justify-center transition duration-150 active:scale-95 shadow-xl font-bold text-lg"
                  >
                    ←
                  </button>
                  <span className="font-mono text-xs text-emerald-500/60 tracking-wider">
                    {safeIdx + 1} / {filteredCarousel.length}
                  </span>
                  <button
                    onClick={() => {
                      const nextIdx = (safeIdx + 1) % filteredCarousel.length;
                      setCarouselActiveIndex(nextIdx);
                    }}
                    className="w-12 h-12 rounded-full border border-emerald-900/40 bg-slate-950 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 flex items-center justify-center transition duration-150 active:scale-95 shadow-xl font-bold text-lg"
                  >
                    →
                  </button>
                </div>

                {/* Primary Spotlight Carousel Frame */}
                <div className="lg:col-span-11 relative min-h-[300px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentItem.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center shadow-2xl relative overflow-hidden group"
                    >
                      {/* Live flashing tag badge on the card */}
                      <div className="absolute top-4 right-4 bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest font-mono animate-pulse">
                        {currentItem.hotFactor}
                      </div>

                      {/* Left Visual Info Section */}
                      <div className="md:col-span-8 space-y-4 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-[#FBBF24] bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                            {currentItem.category}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">• {currentItem.releaseDate}</span>
                        </div>

                        <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                          {currentItem.title}
                        </h4>

                        <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                          {currentItem.description}
                        </p>

                        <div className="flex flex-wrap gap-4 text-[11px] font-mono font-bold text-emerald-400">
                          <span className="flex items-center gap-1.5 bg-[#030e0b] border border-emerald-950 px-3 py-1.5 rounded-lg">
                            ⭐ Confidence: <span className="text-white">{currentItem.verifiedOdds}</span>
                          </span>
                          <span className="flex items-center gap-1.5 bg-[#030e0b] border border-emerald-950 px-3 py-1.5 rounded-lg text-amber-400">
                            ✓ Status: <span className="text-white">Active Feed</span>
                          </span>
                        </div>
                      </div>

                      {/* Right Quick Action Console */}
                      <div className="md:col-span-4 bg-[#03110d] rounded-xl p-5 border border-emerald-950 flex flex-col justify-between h-full min-h-[160px]">
                        <div className="space-y-2 text-left">
                          <div className="font-mono text-[9px] uppercase tracking-wider text-slate-400">PREVIEW LEVEL</div>
                          <div className="text-white font-black text-base">VIP Level Decrypter</div>
                          <p className="text-[10.5px] text-slate-400 leading-tight">
                            Requires free FastPoolCodes registered membership to download copyable perming codes.
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            handleOpenAuth('signup');
                          }}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase py-3 rounded-lg text-center tracking-wider transition-all hover:scale-[1.02] shadow shadow-emerald-500/20 cursor-pointer mt-4"
                        >
                          Unlock Sheet Code
                        </button>
                      </div>

                    </motion.div>
                  </AnimatePresence>
                </div>

              </div>
            );
          })()}

          {/* Quick Info Dot indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-8">
            {carouselItems
              .filter(item => {
                if (carouselFilter === "Special") {
                  return item.category !== "Aussie Keys" && item.category !== "UK Pools" && item.category !== "bet365 Keys";
                }
                return carouselFilter === "All" || item.category === carouselFilter;
              }).map((item, idx) => {
                const isActive = carouselActiveIndex === idx;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCarouselActiveIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isActive ? 'w-8 bg-emerald-400 shadow shadow-emerald-400/50' : 'w-2 bg-slate-800 hover:bg-slate-700'
                    }`}
                    title={item.title}
                  />
                );
              })}
          </div>

        </div>
      </section>



      {/* THREE COLUMN COHESIVE DARK FOOTER MATCHING SCREENSHOT EXACTLY */}
      <footer className="bg-[#050114] text-purple-300 py-16 px-6 border-t border-purple-950/40 select-none">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          
          {/* Column 1: Brand description & Socials */}
          <div className="md:col-span-12 lg:col-span-5 flex flex-col items-start gap-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center shadow-lg">
                <Trophy className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="font-sans font-black text-white uppercase text-sm tracking-widest">
                FASTPOOLCODES
              </span>
            </div>
            <p className="text-xs leading-relaxed text-emerald-300/60 text-left max-w-sm">
              The world's most trusted online pool codes marketplace, providing accurate Aussie weekly football coupon sheets, UK pools codes, and bet365 matching decryption files safely and instantly.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span 
                onClick={() => triggerToast('Opening Facebook Page...', 'success')} 
                className="w-8 h-8 rounded-full bg-emerald-500/10 hover:bg-emerald-550 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 flex items-center justify-center font-black text-xs cursor-pointer hover:scale-110 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all duration-200"
              >
                f
              </span>
              <span 
                onClick={() => triggerToast('Opening Twitter Page...', 'success')} 
                className="w-8 h-8 rounded-full bg-emerald-500/10 hover:bg-emerald-550 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 flex items-center justify-center font-black text-xs cursor-pointer hover:scale-110 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all duration-200"
              >
                𝕏
              </span>
              <span 
                onClick={() => triggerToast('Opening Instagram feed...', 'success')} 
                className="w-8 h-8 rounded-full bg-emerald-500/10 hover:bg-emerald-550 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 flex items-center justify-center font-bold text-[10px] cursor-pointer hover:scale-110 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all duration-200 font-mono"
              >
                IG
              </span>
            </div>
          </div>

          {/* Column 2: Key Action Pages */}
          <div className="md:col-span-6 lg:col-span-3 text-left">
            <h4 className="font-bold text-white text-[11px] uppercase tracking-widest mb-4 font-mono text-emerald-400/80">
              COUPONS & DECODERS
            </h4>
            <ul className="space-y-3 text-xs font-medium text-emerald-300/75">
              <li onClick={() => handleOpenAuth('signup')} className="hover:text-amber-400 transition cursor-pointer flex items-center gap-2 group">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-200 shadow-sm shrink-0">
                  <Sparkles className="w-3 h-3" />
                </span>
                <span>Generate Code Pack</span>
              </li>
              <li onClick={onNavigateToCodes} className="hover:text-amber-400 transition cursor-pointer flex items-center gap-2 group">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-200 shadow-sm shrink-0">
                  <Compass className="w-3 h-3" />
                </span>
                <span>Browse Coupons</span>
              </li>
              <li onClick={() => { document.getElementById('spotlight-arena')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-amber-400 transition cursor-pointer flex items-center gap-2 group">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-200 shadow-sm shrink-0">
                  <BookOpen className="w-3 h-3" />
                </span>
                <span>Sports Blog</span>
              </li>
              <li onClick={() => { setActiveAccordion('brackets'); }} className="hover:text-amber-400 transition cursor-pointer flex items-center gap-2 group">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-200 shadow-sm shrink-0">
                  <Wrench className="w-3 h-3" />
                </span>
                <span>Perming Guides</span>
              </li>
              <li onClick={onNavigateToCodes} className="hover:text-amber-400 transition cursor-pointer flex items-center gap-2 group">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-200 shadow-sm shrink-0">
                  <Lock className="w-3 h-3" />
                </span>
                <span>Decoder Keys</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Important Info & Links */}
          <div className="md:col-span-6 lg:col-span-4 text-left space-y-4">
            <h4 className="font-bold text-white text-[11px] uppercase tracking-widest mb-4 font-mono text-emerald-400/80">
              SUPPORT & CONTACT
            </h4>
            <ul className="space-y-3.5 text-xs font-medium text-emerald-300/75">
              <li onClick={() => triggerToast('Loading About Us directory...', 'info')} className="hover:text-amber-400 transition cursor-pointer flex items-center gap-2 group">
                <ChevronRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-1 transition shrink-0" />
                <span>About The Marketplace</span>
              </li>
              <li onClick={() => triggerToast('Opening online FAQ knowledgebase...', 'info')} className="hover:text-amber-400 transition cursor-pointer flex items-center gap-2 group">
                <ChevronRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-1 transition shrink-0" />
                <span>Frequently Asked Questions</span>
              </li>
              <li onClick={() => triggerToast('Loading Term of Use contract...', 'info')} className="hover:text-amber-400 transition cursor-pointer flex items-center gap-2 group">
                <ChevronRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-1 transition shrink-0" />
                <span>Terms & Agreements</span>
              </li>
              <li onClick={() => triggerToast('Loading Privacy Policy guidelines...', 'info')} className="hover:text-amber-400 transition cursor-pointer flex items-center gap-2 group">
                <ChevronRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-1 transition shrink-0" />
                <span>Privacy Protection</span>
              </li>
            </ul>

            <div className="pt-4 border-t border-emerald-950/40 space-y-2">
              <a href="mailto:info@fastpoolcodes.com" className="flex items-center gap-2 hover:text-white text-xs font-medium text-emerald-300/80 transition">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">info@fastpoolcodes.com</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-emerald-950/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-emerald-500/80">
          <span>© 2026 fastpoolcodes.com • Built for premium bookmaker decryptions</span>
          <div className="flex gap-4">
            <span className="hover:text-emerald-300 cursor-pointer transition" onClick={() => triggerToast('Opening Privacy Policy...', 'info')}>Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-emerald-300 cursor-pointer transition" onClick={() => triggerToast('Opening Terms of Service...', 'info')}>Terms of Use</span>
          </div>
        </div>
      </footer>
        </>
      ) : (
        <ExpertBlogView
          blogPosts={blogPosts}
          onOpenAuth={handleOpenAuth}
          onReadArticle={setBlogModalArticle}
          onOpenPaywall={() => setShowPaywall(true)}
          triggerToast={triggerToast}
        />
      )}

      {/* BLOG READ MODAL INTERACTIVITY */}
      <AnimatePresence>
        {blogModalArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden relative text-left"
            >
              
              {/* Header */}
              <div className="p-5 border-b border-emerald-950/55 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 font-bold">
                  <BookOpen className="w-4 h-4" />
                  <span>FASTPOOLCODES SPORTS BLOG</span>
                </div>
                <button
                  onClick={() => setBlogModalArticle(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-full transition text-slate-500 hover:text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content body */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <span className="text-[10px] font-mono text-slate-400 font-bold block">{blogModalArticle.date} • {blogModalArticle.readTime}</span>
                <h3 className="font-extrabold text-slate-900 text-lg md:text-xl leading-snug">
                  {blogModalArticle.title}
                </h3>
                <p className="text-xs text-[#FA3E65] font-extrabold italic leading-relaxed">
                  {blogModalArticle.summary}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-medium">
                  {blogModalArticle.content}
                </p>
              </div>

              {/* Action */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button
                  onClick={() => setBlogModalArticle(null)}
                  className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold px-4 py-2 rounded-lg"
                >
                  Close Reader
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE LEAGUE MODAL WIZARD INTERACTIVITY */}
      <AnimatePresence>
        {showSystemAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020706]/90 backdrop-blur-md select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#030e0b] border-2 border-emerald-500/50 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(16,185,129,0.3)] overflow-hidden text-left"
            >
              {/* Card top banner with branding */}
              <div className="p-6 border-b border-emerald-950/65 bg-gradient-to-r from-[#071310] to-[#030907] relative">
                <div className="absolute top-5 right-5">
                  <button
                    onClick={() => setShowSystemAuth(false)}
                    className="p-1.5 hover:bg-emerald-950/50 rounded-full transition text-[#94a3b8] hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center shadow">
                    <Trophy className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-white text-base tracking-widest uppercase leading-none">
                      FASTPOOLCODES
                    </h3>
                    <span className="text-[10px] text-emerald-400/80 font-mono tracking-wider block mt-1">PREMIUM DECRYPTION HUB</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Tabs */}
              <div className="p-1 mx-6 mt-6 bg-[#010504] rounded-xl border border-emerald-950/60 flex select-none">
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg text-center transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Premium Account
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg text-center transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Access Account
                </button>
              </div>

              {/* Input Forms */}
              <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
                
                {authMode === 'signup' && (
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-300 block">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. bettor@fastpoolcodes.com"
                        value={authFields.email}
                        onChange={(e) => setAuthFields({ ...authFields, email: e.target.value })}
                        className="w-full bg-[#05110e] border border-emerald-950 rounded-xl p-3 pl-10 text-xs text-white outline-none focus:border-emerald-500/70 focus:bg-[#061814] transition font-medium"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-300 block">
                    {authMode === 'signup' ? 'Username' : 'Username or Registered Email'}
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder={authMode === 'signup' ? "e.g. pool_master_99" : "Enter username or email"}
                      value={authFields.username}
                      onChange={(e) => setAuthFields({ ...authFields, username: e.target.value })}
                      className="w-full bg-[#05110e] border border-emerald-950 rounded-xl p-3 pl-10 text-xs text-white outline-none focus:border-emerald-500/70 focus:bg-[#061814] transition font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-300 block">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={authFields.password}
                      onChange={(e) => setAuthFields({ ...authFields, password: e.target.value })}
                      className="w-full bg-[#05110e] border border-emerald-950 rounded-xl p-3 pl-10 pr-10 text-xs text-white outline-none focus:border-emerald-500/70 focus:bg-[#061814] transition font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-emerald-500 hover:text-emerald-400 transition"
                    >
                      {showPassword ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4 text-slate-500" />}
                    </button>
                  </div>
                  
                  {authMode === 'signup' && authFields.password.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono justify-start text-left">
                      <span className="text-slate-400">Strength:</span>
                      <span className={`font-bold uppercase ${
                        authFields.password.length < 5 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {authFields.password.length < 5 ? 'Weak (min 5 chars)' : 'Strong ✓'}
                      </span>
                    </div>
                  )}
                </div>



                {/* Submission CTA */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs uppercase py-3.5 rounded-xl text-center tracking-widest transition-all duration-150 hover:scale-[1.01] active:scale-95 shadow cursor-pointer"
                >
                  {authMode === 'signup' ? 'Create VIP Pass & Access Hub' : 'Secure Authenticated Access'}
                </button>

                {/* Bottom Toggle label */}
                <div className="text-center pt-2">
                  <span
                    onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer transition underline decoration-dotted"
                  >
                    {authMode === 'signup' 
                      ? 'Already have an active account? Log in' 
                      : "New to the platform? Create private account"}
                  </span>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECURE CHECKOUT PAYMENT WALL MODAL */}
      <AnimatePresence>
        {showPaywall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010605]/95 backdrop-blur-xl select-none overflow-y-auto overflow-x-hidden">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 20 }}
              className="bg-[#030e0b] border-2 border-emerald-500 rounded-2xl w-full max-w-4xl shadow-[0_0_80px_rgba(16,185,129,0.4)] overflow-hidden text-left my-4 max-h-[96vh] md:max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-4 md:p-5 border-b border-emerald-950/65 bg-gradient-to-r from-[#071310] to-[#010504] relative shrink-0">
                <button
                  onClick={() => {
                    setShowPaywall(false);
                    setPendingUser(null);
                    triggerToast("Payment cancelled. Please activate premium pass to access decoder data.", "info");
                  }}
                  className="absolute top-4 right-4 p-1.5 hover:bg-emerald-950/60 rounded-full transition text-[#94a3b8] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xl shadow-lg shrink-0">
                    🔐
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-mono tracking-widest text-[#FBBF24] uppercase font-black bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
                        STEP 2 of 2: VIP GATEWAY
                      </span>
                    </div>
                    <h3 className="font-sans font-black text-white text-lg md:text-xl uppercase tracking-tight">
                      Activate Decryption License
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Complete checkout to instantly unlock verified Week 49/50 Aussie sheets, UK Pools, and bet365 prediction algorithms for <strong className="text-emerald-400">@{pendingUser?.username || 'member'}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid Body */}
              <div className="p-5 md:p-6 overflow-y-auto overflow-x-hidden flex-1 bg-[#030e0b]">
                <form onSubmit={handlePaymentSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    
                    {/* Left Column: Select Access Plan */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 text-left">
                        Select Access Plan
                      </h4>
                      <div className="space-y-2.5 max-h-[260px] md:max-h-[340px] overflow-y-auto overflow-x-hidden pr-2 select-none scrollbar-thin scrollbar-thumb-emerald-800 scrollbar-track-[#020706]">
                        
                        {/* Weekly Plan */}
                        <div
                          onClick={() => setPaywallPlan('weekly')}
                          className={`border px-3.5 py-2.5 cursor-pointer transition-all duration-200 rounded-xl flex items-center justify-between gap-3 relative ${
                            paywallPlan === 'weekly'
                              ? 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                              : 'border-emerald-950/30 bg-[#020706] hover:border-emerald-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Custom Styled Radio */}
                            <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              paywallPlan === 'weekly' ? 'border-emerald-500 bg-emerald-950' : 'border-slate-700 bg-slate-900'
                            }`}>
                              {paywallPlan === 'weekly' && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                            </div>
                            <div className="min-w-0 text-left">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-white font-black text-xs uppercase tracking-wide">Weekly Plan</span>
                                <span className="bg-slate-800 text-slate-300 text-[7.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider border border-slate-700">1 WEEK</span>
                              </div>
                              <p className="text-[9.5px] text-zinc-400 mt-0.5 truncate max-w-[180px] sm:max-w-[240px] leading-snug">
                                1 week Only. Full features checklist codes. Ideal for temporary coupon.
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs md:text-sm font-mono text-emerald-400 font-extrabold whitespace-nowrap">
                              300 NGN
                            </div>
                            <div className="text-[7.5px] text-slate-500 font-mono font-bold uppercase tracking-widest block mt-0.5">
                              7 DAYS PASS
                            </div>
                          </div>
                        </div>

                        {/* Monthly Plan */}
                        <div
                          onClick={() => setPaywallPlan('monthly')}
                          className={`border px-3.5 py-2.5 cursor-pointer transition-all duration-200 rounded-xl flex items-center justify-between gap-3 relative ${
                            paywallPlan === 'monthly'
                              ? 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                              : 'border-emerald-950/30 bg-[#020706] hover:border-emerald-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Custom Styled Radio */}
                            <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              paywallPlan === 'monthly' ? 'border-emerald-500 bg-emerald-950' : 'border-slate-700 bg-slate-900'
                            }`}>
                              {paywallPlan === 'monthly' && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                            </div>
                            <div className="min-w-0 text-left">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-white font-black text-xs uppercase tracking-wide">Monthly Plan</span>
                                <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[7.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow">POPULAR</span>
                              </div>
                              <p className="text-[9.5px] text-zinc-400 mt-0.5 truncate max-w-[180px] sm:max-w-[240px] leading-snug">
                                4 weeks + 1 week bonus key sheets. Active perming suite access.
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs md:text-sm font-mono text-emerald-400 font-extrabold whitespace-nowrap">
                              1,200 NGN
                            </div>
                            <div className="text-[7.5px] text-slate-500 font-mono font-bold uppercase tracking-widest block mt-0.5">
                              35 DAYS PASS
                            </div>
                          </div>
                        </div>

                        {/* Quarterly Plan */}
                        <div
                          onClick={() => setPaywallPlan('quarterly')}
                          className={`border px-3.5 py-2.5 cursor-pointer transition-all duration-200 rounded-xl flex items-center justify-between gap-3 relative ${
                            paywallPlan === 'quarterly'
                              ? 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                              : 'border-emerald-950/30 bg-[#020706] hover:border-emerald-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Custom Styled Radio */}
                            <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              paywallPlan === 'quarterly' ? 'border-emerald-500 bg-emerald-950' : 'border-slate-700 bg-slate-900'
                            }`}>
                              {paywallPlan === 'quarterly' && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                            </div>
                            <div className="min-w-0 text-left">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-white font-black text-xs uppercase tracking-wide">Quarterly Plan</span>
                                <span className="bg-gradient-to-r from-rose-500 to-red-600 text-white text-[7.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow">NEW SEASON</span>
                              </div>
                              <p className="text-[9.5px] text-zinc-400 mt-0.5 truncate max-w-[180px] sm:max-w-[240px] leading-snug">
                                12 weeks + 1 week bonus indicators. Standard seasonal length.
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs md:text-sm font-mono text-emerald-400 font-extrabold whitespace-nowrap">
                              3,600 NGN
                            </div>
                            <div className="text-[7.5px] text-slate-500 font-mono font-bold uppercase tracking-widest block mt-0.5">
                              91 DAYS PASS
                            </div>
                          </div>
                        </div>

                        {/* BI - Annual Plan */}
                        <div
                          onClick={() => setPaywallPlan('biannual')}
                          className={`border px-3.5 py-2.5 cursor-pointer transition-all duration-200 rounded-xl flex items-center justify-between gap-3 relative ${
                            paywallPlan === 'biannual'
                              ? 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                              : 'border-emerald-950/30 bg-[#020706] hover:border-emerald-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Custom Styled Radio */}
                            <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              paywallPlan === 'biannual' ? 'border-emerald-500 bg-emerald-950' : 'border-slate-700 bg-slate-900'
                            }`}>
                              {paywallPlan === 'biannual' && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                            </div>
                            <div className="min-w-0 text-left">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-white font-black text-xs uppercase tracking-wide">Bi-Annual Plan</span>
                                <span className="bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 text-[7.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow">SAVINGS</span>
                              </div>
                              <p className="text-[9.5px] text-zinc-400 mt-0.5 truncate max-w-[180px] sm:max-w-[240px] leading-snug">
                                24 weeks + 2 weeks free bonus. Half-year coverage of draw sequences.
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs md:text-sm font-mono text-emerald-400 font-extrabold whitespace-nowrap">
                              7,800 NGN
                            </div>
                            <div className="text-[7.5px] text-slate-500 font-mono font-bold uppercase tracking-widest block mt-0.5">
                              182 DAYS PASS
                            </div>
                          </div>
                        </div>

                        {/* Yearly Plan */}
                        <div
                          onClick={() => setPaywallPlan('yearly')}
                          className={`border px-3.5 py-2.5 cursor-pointer transition-all duration-200 rounded-xl flex items-center justify-between gap-3 relative ${
                            paywallPlan === 'yearly'
                              ? 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                              : 'border-emerald-950/30 bg-[#020706] hover:border-emerald-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Custom Styled Radio */}
                            <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              paywallPlan === 'yearly' ? 'border-emerald-500 bg-emerald-950' : 'border-slate-700 bg-slate-900'
                            }`}>
                              {paywallPlan === 'yearly' && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                            </div>
                            <div className="min-w-0 text-left">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-white font-black text-xs uppercase tracking-wide">Yearly Plan</span>
                                <span className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[7.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow">ELITE UNLIMITED</span>
                              </div>
                              <p className="text-[9.5px] text-zinc-400 mt-0.5 truncate max-w-[180px] sm:max-w-[240px] leading-snug">
                                48 weeks + 4 weeks free bonus. Elite multi-season VIP privileges.
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs md:text-sm font-mono text-emerald-400 font-extrabold whitespace-nowrap">
                              15,600 NGN
                            </div>
                            <div className="text-[7.5px] text-slate-500 font-mono font-bold uppercase tracking-widest block mt-0.5">
                              364 DAYS PASS
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Right Column: Secure Billing Checkout & Card Details */}
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 text-left">
                          Secure Billing & Card Details
                        </h4>
                        
                        <div className="space-y-2.5">
                          
                          {/* Cardholder Name */}
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cardholder Name</label>
                            <input
                              type="text"
                              required
                              value={paywallForm.cardholder}
                              onChange={(e) => setPaywallForm({ ...paywallForm, cardholder: e.target.value })}
                              placeholder="e.g. John Doe"
                              className="w-full bg-[#05110e] border border-emerald-950 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500/70 focus:bg-[#061814] transition font-medium"
                            />
                          </div>

                          {/* Card Number */}
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Card Number</label>
                            <input
                              type="text"
                              required
                              value={paywallForm.cardNumber}
                              onChange={(e) => {
                                // clean non-digits and format nicely with space grouping
                                const cleaned = e.target.value.replace(/\D/g, '').substring(0, 16);
                                const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
                                setPaywallForm({ ...paywallForm, cardNumber: formatted });
                              }}
                              placeholder="4000 1234 5678 9010"
                              className="w-full bg-[#05110e] border border-emerald-950 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500/70 focus:bg-[#061814] transition font-mono tracking-wider"
                            />
                          </div>

                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          
                          {/* Expiry */}
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Expiry (MM/YY)</label>
                            <input
                              type="text"
                              required
                              value={paywallForm.expiry}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').substring(0, 4);
                                const formatted = val.length >= 3 ? `${val.substring(0, 2)}/${val.substring(2)}` : val;
                                setPaywallForm({ ...paywallForm, expiry: formatted });
                              }}
                              placeholder="12/27"
                              className="w-full bg-[#05110e] border border-emerald-950 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500/70 focus:bg-[#061814] transition font-mono"
                            />
                          </div>

                          {/* CVV */}
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">CVV Code</label>
                            <input
                              type="password"
                              required
                              maxLength={4}
                              value={paywallForm.cvv}
                              onChange={(e) => setPaywallForm({ ...paywallForm, cvv: e.target.value.replace(/\D/g, '') })}
                              placeholder="•••"
                              className="w-full bg-[#05110e] border border-emerald-950 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500/70 focus:bg-[#061814] transition font-mono"
                            />
                          </div>

                        </div>
                      </div>

                      {/* Compact Guaranteed Trust Marks */}
                      <div className="bg-[#020806] border border-emerald-950/80 p-2 md:p-2.5 rounded-xl grid grid-cols-3 gap-2 text-center text-emerald-400 text-[8.5px] font-mono select-none">
                        <div className="flex items-center gap-1.5 justify-center">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>SSL Encrypted</span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-center">
                          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Instant VIP</span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>100% Verified</span>
                        </div>
                      </div>

                      {/* Submit & Cancel Area */}
                      <div className="pt-1.5">
                        <button
                          type="submit"
                          disabled={isProcessingPayment}
                          className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-[12.5px] uppercase py-3 rounded-xl text-center tracking-widest transition-all duration-150 active:scale-95 shadow-xl shadow-emerald-950/40 cursor-pointer disabled:opacity-50 select-none font-sans"
                        >
                          {isProcessingPayment 
                            ? 'Connecting Gateway Secure Sockets...' 
                            : `Authorize Payment • ${
                                paywallPlan === 'weekly' ? '300 NGN' :
                                paywallPlan === 'monthly' ? '1,200 NGN' :
                                paywallPlan === 'quarterly' ? '3,600 NGN' :
                                paywallPlan === 'biannual' ? '7,800 NGN' :
                                '15,600 NGN'
                              }`
                          }
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setShowPaywall(false);
                            setPendingUser(null);
                            triggerToast("Dismissed checkout flow.", "info");
                          }}
                          className="w-full mt-2.5 text-center text-slate-500 hover:text-slate-400 text-[10.5px] font-bold cursor-pointer block hover:underline"
                        >
                          Bypass & Go Back
                        </button>
                      </div>
                    </div>

                  </div>
                </form>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE LEAGUE MODAL WIZARD INTERACTIVITY */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white border border-slate-250 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-left"
            >
              
              {/* Wizard Title Bar */}
              <div className="p-5 border-b border-emerald-950/40 flex justify-between items-center bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-800/40 flex items-center justify-center text-emerald-400 font-extrabold">⚡</span>
                  <div>
                    <span className="font-mono text-[9px] text-emerald-400/80 font-black block uppercase">Step {wizardStep} of 3</span>
                    <span className="font-sans font-black text-white text-sm block">Generate Premium Coupon Code Pack</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowWizard(false)}
                  className="p-1 text-slate-400 hover:bg-slate-800 rounded-full transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Steps Layout */}
              <div className="p-6 space-y-4 bg-slate-900 text-slate-100">
                
                {wizardStep === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <span className="text-[10px] font-mono tracking-widest text-[#FBBF24] font-black block uppercase">
                      1. Premium Pack Identity
                    </span>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Custom Pack Description/Name:</label>
                      <input
                        type="text"
                        value={wizardData.name}
                        onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                        className="w-full border border-emerald-950/60 p-3 text-xs rounded-xl outline-none focus:border-emerald-500 bg-slate-950 text-white transition font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Primary Coupon Association:</label>
                      <select
                        value={wizardData.sport}
                        onChange={(e) => setWizardData({ ...wizardData, sport: e.target.value })}
                        className="w-full border border-emerald-950/60 p-2 text-xs rounded-xl outline-none focus:border-emerald-500 font-bold bg-slate-950 text-white"
                      >
                        <option>Aussie Pool Codes (Weekly Key Sheets)</option>
                        <option>UK Football Pools (Coupon Sheets)</option>
                        <option>bet365 Aussie Decrypter sequences</option>
                        <option>bet365 UK Decrypter sequences</option>
                        <option>Bet9ja Pool Codes Comparison</option>
                        <option>BetKing Pool Codes Sheet</option>
                        <option>SportyBet Active Forecast Sheets</option>
                        <option>Custom / Other Bookie Sheets</option>
                      </select>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                    <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-black block uppercase">
                      2. Decoder Key Format Config
                    </span>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Coupon Perming Format:</label>
                      <select
                        value={wizardData.format}
                        onChange={(e) => setWizardData({ ...wizardData, format: e.target.value })}
                        className="w-full border border-emerald-950/60 p-2 text-xs rounded-xl outline-none focus:border-emerald-500 bg-slate-950 text-white font-bold"
                      >
                        <option>Draw Perming Sheet (Standard keys)</option>
                        <option>Double-Chance Combo Matrix</option>
                        <option>High-Odds Long Stretch coupon</option>
                        <option>System Bets & Full Perming Sequence</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Coupon Target Week Period:</label>
                      <select
                        value={wizardData.startWeek}
                        onChange={(e) => setWizardData({ ...wizardData, startWeek: e.target.value })}
                        className="w-full border border-emerald-950/60 p-2 text-xs rounded-xl bg-slate-950 text-white outline-none focus:border-emerald-500 font-medium"
                      >
                        <option>Current Week (Aussie Season Ongoing)</option>
                        <option>Current Week (UK Season Ongoing)</option>
                        <option>Next Week (Early Bird Codes)</option>
                        <option>Custom Code Block Range</option>
                      </select>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4 animate-fadeIn">
                    <span className="text-[10px] font-mono tracking-widest text-amber-400 font-black block uppercase">
                      3. Key Selection & Review
                    </span>
                    
                    <div className="bg-slate-950 border border-emerald-950 p-4 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between font-bold border-b border-emerald-950/40 pb-2">
                        <span className="text-slate-400">Pack Description:</span>
                        <span className="text-white">{wizardData.name}</span>
                      </div>
                      <div className="flex justify-between font-bold border-b border-emerald-950/40 pb-2">
                        <span className="text-slate-400">Coupon Association:</span>
                        <span className="text-white">{wizardData.sport}</span>
                      </div>
                      <div className="flex justify-between font-bold border-b border-emerald-950/40 pb-2">
                        <span className="text-slate-400">Perming Format:</span>
                        <span className="text-emerald-400 font-black">{wizardData.format}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-400">Verified Access:</span>
                        <span className="text-amber-400 font-black">Instant Download Ready ✓</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Select visual indicator priority:</label>
                      <div className="flex items-center gap-3">
                        {['#10B981', '#3B82F6', '#F59E0B', '#EF4444'].map((color) => (
                          <button
                            key={color}
                            onClick={() => setWizardData({ ...wizardData, theme: color })}
                            className={`w-7 h-7 rounded-full border-2 transition ${wizardData.theme === color ? 'border-white scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* Wizard Nav Panel */}
              <div className="p-4 border-t border-emerald-950/40 bg-slate-950/60 flex items-center justify-between">
                {wizardStep > 1 ? (
                  <button
                    onClick={() => setWizardStep(wizardStep - 1)}
                    className="p-2 border border-slate-700 hover:bg-slate-800 text-xs font-bold text-white rounded-lg transition"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {wizardStep < 3 ? (
                  <button
                    onClick={() => setWizardStep(wizardStep + 1)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleCreateLeagueSubmit}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black px-5 py-2 rounded-lg transition shadow"
                  >
                    Generate Coupons
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
