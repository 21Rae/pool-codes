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
  Phone,
  Share2,
  Copy,
  KeyRound,
  Layers,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ExpertBlogView from './ExpertBlogView';
import GoogleAdBanner from './GoogleAdBanner';
import PoolCodesComparisonTable from './PoolCodesComparisonTable';
import LiveScoresComments from './LiveScoresComments';
import { getSupabaseClient } from '../lib/supabase';
import { INITIAL_PLANS, isGhanaPlan, getMergedSubscriptionPlans, getSortedComparisonPlans, getBookmakersByCountry, isGhanaBookmaker, isPaymentDisabledBookmaker } from '../initialData';

interface OfficePoolStopHomeProps {
  onSignIn: () => void;
  onEnterManagerPanel: () => void;
  onNavigateToCodes: () => void;
  onNavigateToLiveScores: () => void;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  db: any;
  currentUser?: any;
  onRegisterUser?: (username: string, email: string, password?: string, planId?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  onLoginUser?: (usernameOrEmail: string, password?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  onChangePassword?: (usernameOrEmail: string, newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  onOpenTerms?: () => void;
  autoOpenAuth?: boolean;
  onResetAutoOpenAuth?: () => void;
  initialView?: 'blog' | 'comparison' | 'livescores' | 'results' | 'about' | 'contact';
}

const FALLBACK_BLOG_IMAGES = [
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80'
];

function sortBlogPosts(posts: any[]) {
  if (!posts || posts.length <= 1) return posts || [];

  // Identify hero blog: explicit is_hero flag, or default to first blog at index 0
  let heroIndex = posts.findIndex((b: any) => b?.is_hero === true || b?.isHero === true || b?.featured === true || b?.is_featured === true);
  if (heroIndex === -1) {
    heroIndex = 0;
  }

  const heroItem = posts[heroIndex];
  const remainingItems = posts.filter((_, idx) => idx !== heroIndex);

  const getTimestamp = (item: any) => {
    if (!item) return 0;
    if (item.created_at) {
      const t = new Date(item.created_at).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (item.createdAt) {
      const t = new Date(item.createdAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (item.date) {
      const t = new Date(item.date).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (typeof item.raw_id === 'number') return item.raw_id;
    if (typeof item.id === 'number') return item.id;
    if (typeof item.id === 'string') {
      const num = parseInt(item.id.replace(/\D/g, ''), 10);
      if (!isNaN(num)) return num;
    }
    return 0;
  };

  remainingItems.sort((a: any, b: any) => {
    const timeA = getTimestamp(a);
    const timeB = getTimestamp(b);
    if (timeA !== timeB) {
      return timeB - timeA; // Descending: latest uploaded comes first
    }
    return 0;
  });

  return [heroItem, ...remainingItems];
}

function getPostShareUrl(post: any) {
  const domain = 'https://fastpoolcodes.com';
  if (!post) return domain;
  const identifier = post.id || post.raw_id || post.title || '';
  return `${domain}?blog=${encodeURIComponent(identifier)}`;
}

function findBlogPostByUrlParam(posts: any[], param: string | null) {
  if (!posts || !posts.length || !param) return null;
  const rawParam = param.trim();
  const decodedParam = decodeURIComponent(rawParam).trim().toLowerCase();

  return posts.find((p: any) => {
    if (!p) return false;
    const pid = String(p.id || '').trim().toLowerCase();
    const rawId = String(p.raw_id || '').trim().toLowerCase();
    const title = String(p.title || '').trim().toLowerCase();

    if (pid === decodedParam || rawId === decodedParam || pid === rawParam || rawId === rawParam) {
      return true;
    }
    if (title === decodedParam) {
      return true;
    }

    const slugifiedTitle = title.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const slugifiedParam = decodedParam.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (slugifiedTitle && slugifiedParam && slugifiedTitle === slugifiedParam) {
      return true;
    }

    if (title.length > 5 && (title.includes(decodedParam) || decodedParam.includes(title))) {
      return true;
    }

    return false;
  }) || null;
}

function formatBlogRows(rows: any[]) {
  if (!rows || !Array.isArray(rows)) return [];
  const formatted = rows.map((b: any, idx: number) => {
    const rawUrl = b.image_url || b.imageUrl || b.image_link || b.imageLink || b.image || b.img || b.img_url || b.cover || b.cover_image || b.banner || b.thumbnail || b.pic || b.photo;
    const finalUrl = rawUrl && String(rawUrl).trim() !== '' ? String(rawUrl).trim() : FALLBACK_BLOG_IMAGES[idx % FALLBACK_BLOG_IMAGES.length];
    return {
      id: b.id || `blog-${idx}`,
      title: b.title || b.name || b.heading || b.subject || b.title_text || 'Untitled Article',
      summary: b.summary || b.description || b.excerpt || b.content?.slice(0, 150) || b.body?.slice(0, 150) || 'No summary available.',
      content: b.content || b.body || b.text || b.article_content || b.details || '',
      date: b.date || (b.created_at ? new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })),
      readTime: b.read_time || b.readTime || b.read_duration || b.readTimeMinutes || '5 min read',
      image_url: finalUrl,
      created_at: b.created_at || b.createdAt || b.date || null,
      is_hero: b.is_hero || b.isHero || b.featured || b.is_featured || false,
      raw_id: b.id
    };
  });

  return sortBlogPosts(formatted);
}

export default function OfficePoolStopHome({
  onSignIn,
  onEnterManagerPanel,
  onNavigateToCodes,
  onNavigateToLiveScores,
  triggerToast,
  db,
  currentUser,
  onRegisterUser,
  onLoginUser,
  onChangePassword,
  onOpenTerms,
  autoOpenAuth,
  onResetAutoOpenAuth,
  initialView
}: OfficePoolStopHomeProps) {
  // Navigation & interaction states
  const [currentView, setCurrentView] = useState<'blog' | 'comparison' | 'livescores' | 'results' | 'about' | 'contact'>(initialView || 'blog');

  useEffect(() => {
    if (initialView) {
      setCurrentView(initialView);
    }
  }, [initialView]);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [resultsSearchQuery, setResultsSearchQuery] = useState('');
  const [resultsTableSearch, setResultsTableSearch] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [showSystemAuth, setShowSystemAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'change_password'>('signup');

  useEffect(() => {
    if (autoOpenAuth) {
      setShowSystemAuth(true);
      setAuthMode('signup');
      if (onResetAutoOpenAuth) {
        onResetAutoOpenAuth();
      }
    }
  }, [autoOpenAuth, onResetAutoOpenAuth]);
  const [authFields, setAuthFields] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [resetFields, setResetFields] = useState({
    usernameOrEmail: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Paywall states
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallRegionFilter, setPaywallRegionFilter] = useState<'nigeria' | 'ghana'>('nigeria');
  const [paywallPlan, setPaywallPlan] = useState<string>('plan-monthly');
  const [vipBookmakerFilter, setVipBookmakerFilter] = useState<string>('all');
  const [selectedPaywallBookmaker, setSelectedPaywallBookmaker] = useState<string>('bet9ja');
  const [paywallForm, setPaywallForm] = useState({
    cardholder: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [pendingUser, setPendingUser] = useState<{ username: string; email: string; password?: string } | null>(null);

  // Blog states
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [candidateErrors, setCandidateErrors] = useState<Record<string, string>>({});
  const [isBlogsLoading, setIsBlogsLoading] = useState(false);
  const [fetchCount, setFetchCount] = useState(0);
  const [blogModalArticle, setBlogModalArticle] = useState<any | null>(null);
  const [hasAutoOpenedSharedBlog, setHasAutoOpenedSharedBlog] = useState(false);

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
          const rawMatches = json.matches || [];
          const seen = new Set();
          const uniqueMatches = rawMatches.filter((m: any) => {
            const key = m.id || m.fixture;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setLiveScoresData(uniqueMatches);
        }
      } catch (err) {
        console.warn("Graceful notice: Live scores not yet loaded from backend (standard polling behavior).");
      }
    };
    fetchLiveScores();
  }, []);

  const scoreboardRef = useRef<HTMLDivElement>(null);
  const [isScoreboardHovered, setIsScoreboardHovered] = useState(false);
  const touchTimeoutRef = useRef<any>(null);

  // Scroll implementation for scoreboard games ticker (supports mobile fractional scroll)
  useEffect(() => {
    const container = scoreboardRef.current;
    if (!container) return;

    let iframeId: number;
    let scrollPos = container.scrollLeft;
    const scrollSpeed = 0.75;

    const runScroll = () => {
      if (!isScoreboardHovered && container.scrollWidth > container.clientWidth) {
        scrollPos += scrollSpeed;
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (
          scrollPos >= container.scrollWidth / 2 ||
          (maxScroll > 0 && scrollPos >= maxScroll - 2)
        ) {
          scrollPos = 0;
        }
        container.scrollLeft = scrollPos;
      } else {
        scrollPos = container.scrollLeft;
      }
      iframeId = requestAnimationFrame(runScroll);
    };

    const handleScroll = () => {
      if (isScoreboardHovered) {
        scrollPos = container.scrollLeft;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    iframeId = requestAnimationFrame(runScroll);
    return () => {
      cancelAnimationFrame(iframeId);
      container.removeEventListener('scroll', handleScroll);
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, [isScoreboardHovered, liveScoresData.length]);

  // Master fetch blogs function designed by the system and optimized by the user
  const fetchBlogs = async () => {
    setIsBlogsLoading(true);

    // Try secure Full-Stack server route first (bypasses browser mixed content / SSL constraints)
    try {
      const serverRes = await fetch('/api/blogs');
      if (serverRes.ok) {
        const json = await serverRes.json();
        if (json && json.success && Array.isArray(json.data)) {
          const formatted = formatBlogRows(json.data);
          setBlogPosts(formatted);
          setSupabaseError(null);
          setIsBlogsLoading(false);
          return; // ✅ successful server-side proxy loading
        }
      }
    } catch (err) {
      console.warn('Backend proxy fetch unavailable, checking direct client...', err);
    }

    // Direct client SDK fallback
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('blogs').select('*');
        if (!error && Array.isArray(data)) {
          setBlogPosts(formatBlogRows(data));
          setSupabaseError(null);
          setIsBlogsLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Direct Supabase query failed:', e);
      }
    }

    // If fetch failed completely or returned no data, set empty state
    setBlogPosts([]);
    setIsBlogsLoading(false);
  };

  useEffect(() => {
    fetchBlogs();

    // 1. Set up Supabase Realtime WebSocket channel
    const supabase = getSupabaseClient();
    let activeChannel: any = null;

    if (supabase) {
      try {
        activeChannel = supabase
          .channel('realtime-blogs-home')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'blogs'
            },
            (payload) => {
              console.log('Real-time update on blogs table detected:', payload);
              fetchBlogs();
            }
          )
          .subscribe((status) => {
            console.log('Supabase real-time channel status:', status);
          });
      } catch (realtimeErr) {
        console.warn('Real-time subscription error:', realtimeErr);
      }
    }

    return () => {
      if (supabase && activeChannel) {
        try {
          supabase.removeChannel(activeChannel);
        } catch (_) {}
      }
    };
  }, []);

  // Deep-link auto-open for shared blog post links
  useEffect(() => {
    if (blogPosts && blogPosts.length > 0 && !hasAutoOpenedSharedBlog) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const targetParam = urlParams.get('blog') || urlParams.get('post') || urlParams.get('article');
        let hashParam: string | null = null;
        if (window.location.hash && window.location.hash.includes('blog=')) {
          const match = window.location.hash.match(/blog=([^&]+)/);
          if (match && match[1]) hashParam = decodeURIComponent(match[1]);
        }
        const blogIdToFind = targetParam || hashParam;

        if (blogIdToFind) {
          const matched = findBlogPostByUrlParam(blogPosts, blogIdToFind);
          if (matched) {
            setCurrentView('blog');
            setBlogModalArticle(matched);
            setHasAutoOpenedSharedBlog(true);
          }
        }
      } catch (_) {}
    }
  }, [blogPosts, hasAutoOpenedSharedBlog]);

  // Keep browser address bar URL in sync with active blog article modal
  useEffect(() => {
    if (blogModalArticle) {
      const identifier = blogModalArticle.id || blogModalArticle.raw_id || blogModalArticle.title || '';
      const relativePath = `?blog=${encodeURIComponent(identifier)}`;
      try {
        window.history.replaceState({}, '', relativePath);
      } catch (_) {}
    } else if (hasAutoOpenedSharedBlog) {
      try {
        window.history.replaceState({}, '', window.location.origin + window.location.pathname);
      } catch (_) {}
    }
  }, [blogModalArticle, hasAutoOpenedSharedBlog]);

  const handleShareBlogArticle = async (article: any) => {
    const shareUrl = getPostShareUrl(article);
    const shareTitle = article?.title || 'FastPoolCodes Analysis';
    const shareText = article?.summary || article?.title || 'Check out this football pool article!';

    if (navigator.share && navigator.canShare && navigator.canShare({ title: shareTitle, text: shareText, url: shareUrl })) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        triggerToast('Article shared successfully!', 'success');
        return;
      } catch (err) {
        // user cancelled
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      triggerToast('Blog post link copied to clipboard!', 'success');
    } catch (err) {
      triggerToast('Failed to copy link.', 'error');
    }
  };

  const handleOpenAuth = (mode: 'login' | 'signup' | 'change_password') => {
    setAuthMode(mode);
    setAuthFields({ username: '', email: '', password: '' });
    setResetFields({ usernameOrEmail: '', newPassword: '', confirmPassword: '' });
    setShowPassword(false);
    setAgreeTerms(true);
    setShowSystemAuth(true);
    triggerToast(`Directing to ${mode === 'signup' ? 'Create Premium Account' : mode === 'change_password' ? 'Change Password' : 'Sign In'} portal...`, 'info');
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'change_password') {
      if (!resetFields.usernameOrEmail || !resetFields.newPassword || !resetFields.confirmPassword) {
        triggerToast('Please fill in all details to change your password.', 'error');
        return;
      }
      if (resetFields.newPassword.length < 5) {
        triggerToast('New security password must be at least 5 characters.', 'error');
        return;
      }
      if (resetFields.newPassword !== resetFields.confirmPassword) {
        triggerToast('Confirm password does not match new password.', 'error');
        return;
      }

      if (onChangePassword) {
        setIsBlogsLoading(true);
        triggerToast('Updating account security password...', 'info');
        onChangePassword(resetFields.usernameOrEmail, resetFields.newPassword)
          .then((res) => {
            setIsBlogsLoading(false);
            if (res.success) {
              triggerToast(res.message || 'Password updated successfully!', 'success');
              setAuthFields({
                username: resetFields.usernameOrEmail,
                email: '',
                password: resetFields.newPassword
              });
              setAuthMode('login');
            } else {
              triggerToast(res.error || 'Password update failed.', 'error');
            }
          })
          .catch((err) => {
            setIsBlogsLoading(false);
            triggerToast(err.message || 'Password update failed.', 'error');
          });
      } else {
        triggerToast('Password updated successfully.', 'success');
        setAuthFields({
          username: resetFields.usernameOrEmail,
          email: '',
          password: resetFields.newPassword
        });
        setAuthMode('login');
      }
      return;
    }

    if (authMode === 'signup') {
      if (!agreeTerms) {
        triggerToast('Please confirm you are 18+ and accept the Terms of Service to proceed.', 'error');
        return;
      }
      if (!authFields.email || !authFields.password) {
        triggerToast('Please fill in both your email address and password.', 'error');
        return;
      }
      if (!authFields.email.includes('@')) {
        triggerToast('Please provide a valid email address containing @.', 'error');
        return;
      }
      if (authFields.password.length < 6) {
        triggerToast('Security password must be at least 6 characters.', 'error');
        return;
      }

      const derivedUsername = authFields.username?.trim() || authFields.email.split('@')[0] || 'user';

      if (onRegisterUser) {
        setIsBlogsLoading(true);
        triggerToast('Establishing your account on standard Free Plan...', 'info');
        onRegisterUser(derivedUsername, authFields.email, authFields.password, 'plan-free')
          .then((res) => {
            setIsBlogsLoading(false);
            if (res.success) {
              triggerToast(res.message || `Account created successfully on Free Plan! Welcome!`, 'success');
              setShowSystemAuth(false);
              onSignIn();
            } else {
              triggerToast(res.error || 'Registration failed.', 'error');
              if (res.error && res.error.toLowerCase().includes('already exists')) {
                setAuthMode('login');
                setAuthFields(prev => ({ ...prev, username: prev.email }));
              }
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
              onSignIn();
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
    if (isPaymentDisabledBookmaker(selectedPaywallBookmaker)) {
      triggerToast(`Payment portal for selected bookmaker (${selectedPaywallBookmaker}) is currently disabled. Please choose another bookmaker.`, 'error');
      return;
    }
    if (!paywallForm.cardholder || !paywallForm.cardNumber || !paywallForm.expiry || !paywallForm.cvv) {
      triggerToast('Please enter all credit card details to authorize access.', 'error');
      return;
    }

    setIsProcessingPayment(true);
    triggerToast('Connecting to payment gateways & establishing user profile...', 'info');

    const username = pendingUser?.username || authFields.username || 'VIP_User';
    const email = pendingUser?.email || authFields.email;
    if (!email) {
      triggerToast('Please provide a valid email to complete subscription.', 'error');
      setIsProcessingPayment(false);
      return;
    }
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
              onSignIn();
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
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { setCurrentView('blog'); triggerToast('Welcome to FastPoolCodes!', 'info'); }}>
              <div className="relative flex items-center gap-2.5 font-black bg-slate-950 px-3.5 py-2 rounded-lg shadow-md shadow-emerald-950/80 border border-emerald-500/40 select-none">
                <Zap className="w-5 h-5 text-amber-400 fill-current animate-pulse shrink-0" /> 
                <div className="flex flex-col text-left">
                  <span className="text-amber-400 font-black text-lg md:text-xl tracking-tight leading-none uppercase drop-shadow-sm">FAST</span>
                  <span className="text-slate-100 font-extrabold text-[10px] md:text-[11px] tracking-widest leading-none uppercase mt-0.5">POOL CODES</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation links - highly styled and responsive */}
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1 border-y lg:border-none border-emerald-950/50">
            {[
              { id: 'blog', label: 'HOME', icon: Home },
              { id: 'comparison', label: 'CODES COMPARISON', icon: Layers },
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

          <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
            {currentUser && currentUser.id && currentUser.id !== 'guest' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onSignIn}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 px-4 py-2 rounded-xl transition duration-150 cursor-pointer active:scale-95 shadow-md shadow-emerald-500/20 border border-emerald-300/40"
                  title="Return to your Pool Codes Dashboard"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>MY DASHBOARD</span>
                </button>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="truncate max-w-[110px]">@{currentUser.username}</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowSystemAuth(true);
                  setAuthMode('login');
                }}
                className="flex items-center gap-1.5 text-xs font-bold font-mono uppercase tracking-wider text-emerald-400 hover:text-white bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 hover:border-emerald-400 px-3.5 py-2 rounded-xl transition duration-150 cursor-pointer active:scale-95 shadow-sm"
                title="Sign in to your account"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>SIGN IN</span>
              </button>
            )}

            <button
              onClick={async () => {
                triggerToast('Fetching latest records from database...', 'info');
                await fetchBlogs();
                triggerToast('Homepage feeds & records successfully updated!', 'success');
              }}
              disabled={isBlogsLoading}
              className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 hover:border-emerald-400 px-3.5 py-2 rounded-xl transition duration-150 cursor-pointer active:scale-95 shadow-md"
              title="Fetch latest verified records from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isBlogsLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isBlogsLoading ? 'Fetching...' : 'Fetch Latest Records'}</span>
            </button>
          </div>

        </div>

        {/* Real-time Sub-Header Scoreboard Ticker */}
        <div className="bg-[#020b08] border-t border-emerald-950/60 py-2.5 px-6 flex items-center">
          <span className="text-[9px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1 shrink-0 border-r border-emerald-950 pr-4 mr-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            LIVE pool matche
          </span>
          <div 
            ref={scoreboardRef}
            onMouseEnter={() => setIsScoreboardHovered(true)}
            onMouseLeave={() => setIsScoreboardHovered(false)}
            onTouchStart={() => {
              if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
              setIsScoreboardHovered(true);
            }}
            onTouchEnd={() => {
              if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
              touchTimeoutRef.current = setTimeout(() => {
                setIsScoreboardHovered(false);
              }, 1800);
            }}
            className="flex-1 flex text-[11px] md:text-xs items-center select-none text-white overflow-x-auto scrollbar-none touch-pan-x"
          >
            {liveScoresData.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-500/80 font-mono text-[9px] uppercase tracking-widest pl-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500/30 animate-pulse"></span>
                <span>Pre-season fixtures indexing... Week 49 starts soon</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 whitespace-nowrap h-full">
                {Array.from({ length: 12 })
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
                  let typeColor = 'text-slate-400';
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
                    typeColor = 'text-slate-400';
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
                        {typeStr ? (
                          <span className={`text-[8.5px] font-black tracking-widest font-mono ${typeColor}`}>
                            {typeStr}
                          </span>
                        ) : null}
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



      {/* Top Page Header Ad Banner */}
      <div className="max-w-[1360px] mx-auto px-4 pt-4">
        <GoogleAdBanner className="bg-[#020b08] border border-emerald-950/80 rounded-xl p-2 shadow-md" />
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
                  onOpenTerms={onOpenTerms}
                  onNavigateToCodes={onNavigateToCodes}
                  db={db}
                />
              );

            case 'comparison':
              return (
                <div className="max-w-[1360px] mx-auto px-4 py-8 text-left">
                  <PoolCodesComparisonTable
                    comparisonRows={db?.pool_codes_comparison}
                    triggerToast={triggerToast}
                    currentUser={currentUser}
                    onOpenVipSubscription={() => {
                      setShowSystemAuth(true);
                      setAuthMode('signup');
                    }}
                  />
                </div>
              );

            case 'livescores': {
              const activeMatches = liveScoresData;

              return (
                <div className="max-w-7xl mx-auto px-6 py-12 space-y-8 text-left">
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-black text-emerald-400 tracking-widest bg-emerald-950/40 border border-emerald-900/40 px-3 py-1 rounded-full inline-block">
                      ⚽️Real-time livescores
                    </span>
                    <h2 className="text-3xl font-black text-white tracking-tight">
                      Pool matches livescore
                    </h2>
                    <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed font-semibold">
                      Follow pool matches live. Matches are tracked in real-time, displaying official draw statuses to keep your perms synchronized instantly.
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

                  {/* Live Match Comments & Fan Discussion */}
                  <LiveScoresComments
                    currentUser={currentUser}
                    triggerToast={triggerToast}
                  />

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

              // PDF Exporter Helper
              const handleExportPDF = (result: any) => {
                try {
                  const headers = ['Match No', 'Home Team', 'Away Team', 'FT Score', 'Outcome', 'Payout Status'];
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

                  // Purge any stale print nodes first
                  const staleDivs = document.querySelectorAll('.printable-dynamic-container, #printable-coupon-pdf, #printable-home-results-sheet');
                  staleDivs.forEach(node => node.remove());
                  const staleStyles = document.querySelectorAll('#print-coupon-override, #print-terms-override');
                  staleStyles.forEach(style => style.remove());

                  const rows = filtered.map((row: any) => [
                    String(row.matchNo),
                    row.homeTeam || '',
                    row.awayTeam || '',
                    row.fullTimeScore || '',
                    row.outcome || '',
                    row.payoutStatus || ''
                  ]);

                  const snapshotRows = [...rows];
                  const rowCount = snapshotRows.length;
                  const fontSize = rowCount > 35 ? '9.5px' : rowCount > 20 ? '10.5px' : '11.5px';
                  const cellPadding = rowCount > 35 ? '3.5px 6px' : rowCount > 20 ? '5px 7px' : '6px 8px';

                  const printDiv = document.createElement('div');
                  printDiv.id = 'printable-home-results-sheet';
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

                  printDiv.innerHTML = `
                    <div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.04; display: flex; flex-wrap: wrap; justify-content: space-around; align-content: space-around; z-index: 0; user-select: none;">
                      ${Array.from({ length: 24 }).map(() => `
                        <div style="font-family: monospace; font-weight: 900; font-size: 11px; text-transform: uppercase; color: #0f172a; white-space: nowrap; margin: 35px; transform: rotate(-25deg);">
                          fastpoolcodes official result
                        </div>
                      `).join('')}
                    </div>
                    <div style="position: relative; z-index: 10; width: 100%; box-sizing: border-box;">
                      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; font-family: system-ui, -apple-system, sans-serif; text-align: left; display: flex; justify-content: space-between; align-items: flex-end;">
                        <div>
                          <h2 style="margin: 0; text-transform: uppercase; font-size: 14px; font-weight: 900; letter-spacing: -0.3px; color: #0f172a;">⚽ FASTPOOLCODES // PRINT SERVICE</h2>
                          <h3 style="margin: 3px 0 0 0; text-transform: uppercase; font-size: 11px; font-weight: 700; color: #059669;">WEEK ${result.week_number} POOL RESULTS - ${result.title}</h3>
                        </div>
                        <div style="text-align: right; font-size: 9px; color: #475569; font-family: monospace;">
                          <span>Generated: ${new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                      <table style="width: 100%; border-collapse: collapse; font-size: ${fontSize}; text-align: left; font-family: system-ui, -apple-system, sans-serif; line-height: 1.35; page-break-inside: avoid;">
                        <thead>
                          <tr style="background-color: #0f172a; color: white;">
                            ${headers.map(h => `<th style="border: 1px solid #0f172a; padding: ${cellPadding}; text-transform: uppercase; font-size: ${fontSize}; font-weight: 800;">${h}</th>`).join('')}
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
                        © 2026 FastPoolCodes. Secure printable document license.
                      </div>
                    </div>
                  `;

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
                      #printable-home-results-sheet, #printable-home-results-sheet * {
                        visibility: visible !important;
                      }
                      #printable-home-results-sheet {
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
                    } catch (e) {}
                    setTimeout(() => {
                      printDiv.remove();
                      printStyle.remove();
                      triggerToast(`Week ${result.week_number} results PDF document opened successfully (${filtered.length} rows)!`, 'success');
                    }, 500);
                  }, 100);

                } catch (e) {
                  triggerToast('Export to PDF failed. Please try again.', 'error');
                }
              };

              return (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6 text-left">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-emerald-950/40">
                    <div className="space-y-2">
                      <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/40 border border-emerald-900/40 px-3 py-1 rounded-full inline-block">
                        🏆 Adjudicated Archives
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                        Official Weekly Pool Results
                      </h2>
                      <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed font-semibold">
                        Verify payouts and coupon draw codes from completed seasons. Select any week from the dropdown below to view individual full-fixture outcomes.
                      </p>
                    </div>
                  </div>

                  {(() => {
                    const activeResult = resultsList.find(x => x.id === (selectedResultId || (filteredResults[0] && filteredResults[0].id) || (resultsList[0] && resultsList[0].id)));
                    
                    if (!activeResult) {
                      return (
                        <div className="p-12 text-center bg-[#071310]/50 border border-emerald-950 rounded-2xl text-slate-500 text-xs font-bold font-mono">
                          No pool results sheets are currently loaded in the system.
                        </div>
                      );
                    }

                    const totalDraws = (activeResult.results_table || []).filter((x: any) => x.outcome === 'DRAW').length;
                    const totalMatches = (activeResult.results_table || []).length;

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
                      <div className="space-y-5">
                        {/* Dropdown Selector Bar & Fixtures Search */}
                        <div className="bg-[#071310]/80 border border-emerald-950/90 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                          {/* Week Dropdown */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <label className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider block">
                              Select Pool Results Week
                            </label>
                            <div className="relative">
                              <select
                                value={activeResult.id}
                                onChange={(e) => {
                                  setSelectedResultId(e.target.value);
                                  setResultsTableSearch('');
                                }}
                                className="w-full bg-[#030a07] text-white border border-emerald-900/60 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer appearance-none pr-10"
                              >
                                {resultsList.map((res: any) => {
                                  const draws = (res.results_table || []).filter((x: any) => x.outcome === 'DRAW').length;
                                  return (
                                    <option key={res.id} value={res.id} className="bg-slate-950 text-white py-2">
                                      WEEK {res.week_number} • Year {res.season_year || 2026} — {res.title} ({draws} Draws)
                                    </option>
                                  );
                                })}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-emerald-400">
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          {/* Fixtures Search in Active Sheet */}
                          <div className="w-full lg:w-80 space-y-1.5">
                            <label className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">
                              Filter Fixtures / Teams
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Filter e.g. Arsenal, Chelsea, DRAW..."
                                value={resultsTableSearch}
                                onChange={(e) => setResultsTableSearch(e.target.value)}
                                className="w-full bg-[#030a07] border border-emerald-900/60 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono placeholder:text-slate-600"
                              />
                              {resultsTableSearch && (
                                <button
                                  onClick={() => setResultsTableSearch('')}
                                  className="absolute right-3 top-3 text-[10px] text-slate-400 hover:text-white uppercase font-mono font-bold"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Active Result Card & Table */}
                        <div className="bg-[#071310]/60 border border-emerald-950/80 rounded-2xl overflow-hidden shadow-xl flex flex-col">
                          {/* Active Header with Badges */}
                          <div className="p-4 sm:p-5 border-b border-emerald-950/80 bg-gradient-to-r from-[#071310] via-[#04120e] to-[#020b08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[9px] font-mono font-black text-amber-400 uppercase tracking-widest bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded">
                                  Active Record Sheet
                                </span>
                                <span className="text-[10px] font-mono font-black text-emerald-400">
                                  Week {activeResult.week_number} • Year {activeResult.season_year || 2026}
                                </span>
                              </div>
                              <h3 className="text-white font-extrabold text-base sm:text-lg uppercase tracking-wide">
                                {activeResult.title}
                              </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                              <span className="bg-emerald-950/80 text-emerald-400 text-[10px] font-black px-2.5 py-1.5 rounded-lg border border-emerald-900/40">
                                {totalDraws} DRAWS CLEARED
                              </span>
                              <span className="bg-slate-900 text-slate-300 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-800">
                                {totalMatches} FIXTURES
                              </span>
                              {activeResult.fixture_date && (
                                <span className="bg-slate-900/80 text-slate-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-800">
                                  {activeResult.fixture_date}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Full Width Fixtures Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-[#020b08] text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-widest border-b border-emerald-950">
                                  <th className="py-3.5 px-4 text-center w-14">No</th>
                                  <th className="py-3.5 px-4">Match Fixture</th>
                                  <th className="py-3.5 px-4 text-center w-28">FT Score</th>
                                  <th className="py-3.5 px-4 text-center w-28">Outcome</th>
                                  <th className="py-3.5 px-4 text-right w-28">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-emerald-950/35 font-semibold text-slate-300">
                                {activeResultRows.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="py-10 text-center text-slate-500 font-mono text-xs">
                                      No matches found matching filter "{resultsTableSearch}".
                                    </td>
                                  </tr>
                                ) : (
                                  activeResultRows.map((row: any, rIdx: number) => {
                                    const isDraw = row.outcome === 'DRAW';
                                    return (
                                      <tr key={rIdx} className={`hover:bg-emerald-950/20 transition ${isDraw ? 'bg-amber-950/15' : ''}`}>
                                        <td className="py-3.5 px-4 text-center text-amber-300 font-mono font-bold">
                                          {row.matchNo}
                                        </td>
                                        <td className="py-3.5 px-4 text-white font-medium">
                                          {row.homeTeam} <span className="text-slate-500 font-normal mx-1">vs</span> {row.awayTeam}
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-mono font-black text-amber-300 text-sm">
                                          {row.fullTimeScore}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                          <span className={`text-[9px] font-mono font-black px-2.5 py-1 rounded border ${
                                            isDraw 
                                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-extrabold' 
                                              : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                                          }`}>
                                            {row.outcome}
                                          </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[10px]">
                                          {row.payoutStatus || 'CLEARED'}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            }

            case 'about':
              return (
                <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 text-left" id="about-us-page">
                  {/* Hero & WHO WE ARE */}
                  <div className="space-y-6 max-w-4xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/40 border border-emerald-900/40 px-3.5 py-1.5 rounded-full inline-block">
                        📖 FastPool Library & Heritage
                      </span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white leading-tight uppercase tracking-tight">
                      WHO WE ARE
                    </h2>
                    <div className="space-y-4 text-slate-300 text-sm md:text-base leading-relaxed">
                      <p>
                        <strong className="text-white font-black">Fastpoolcodes.com</strong> is Africa’s premier digital bridge between traditional pool staking and the modern sports betting ecosystem. Originally founded in Lagos, Nigeria as a printed weekly pool journal for punters perming combinations at local retail kiosks, we are duly registered and trademarked and have evolved into a comprehensive digital sports data platform. We integrate African pool punters and retail shop operators into high-yield digital betting networks across West Africa and the continent at large.
                      </p>
                      <p className="text-slate-400">
                        By combining decades of deep-rooted pool heritage with advanced data analytics, we deliver carefully curated weekly soccer pool fixtures, betting codes, real-time match data, and cross-platform odds comparisons tailored to specific betting agencies and independent shop owners.
                      </p>
                    </div>
                  </div>

                  {/* OUR CORE PILLARS & OPERATIONAL CAPABILITIES */}
                  <div className="space-y-8">
                    <div className="border-b border-emerald-950/80 pb-3">
                      <h3 className="text-xl md:text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2">
                        <span className="text-emerald-400">⚡</span>
                        OUR CORE PILLARS & OPERATIONAL CAPABILITIES
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-[#051310]/70 border border-emerald-950/80 p-6 rounded-2xl space-y-3 hover:border-emerald-800 transition">
                        <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 font-black text-sm">
                          01
                        </div>
                        <h4 className="text-white text-sm font-black uppercase tracking-wide">
                          Comprehensive Data Compilation & Fixture Engineering
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          We collate, structure, and distribute future match schedules and pool fixtures—including UK, Australian, and global soccer leagues—alongside non-soccer sporting events tailored for retail and digital staking.
                        </p>
                      </div>

                      <div className="bg-[#051310]/70 border border-emerald-950/80 p-6 rounded-2xl space-y-3 hover:border-emerald-800 transition">
                        <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 font-black text-sm">
                          02
                        </div>
                        <h4 className="text-white text-sm font-black uppercase tracking-wide">
                          Odds Comparison & Market Analysis
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          We analyze real-time odds, statistical parameters, and global match trends across major African and international bookmakers to help punters make informed predictions and optimize yield.
                        </p>
                      </div>

                      <div className="bg-[#051310]/70 border border-emerald-950/80 p-6 rounded-2xl space-y-3 hover:border-emerald-800 transition">
                        <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 font-black text-sm">
                          03
                        </div>
                        <h4 className="text-white text-sm font-black uppercase tracking-wide">
                          Automated Code Translation & Digital Distribution
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          We map weekly pool fixtures directly to native booking codes for leading West African betting platforms, streamlining transaction flow for bet shop owners and individual punters alike.
                        </p>
                      </div>

                      <div className="bg-[#051310]/70 border border-emerald-950/80 p-6 rounded-2xl space-y-3 hover:border-emerald-800 transition">
                        <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 font-black text-sm">
                          04
                        </div>
                        <h4 className="text-white text-sm font-black uppercase tracking-wide">
                          Live Match Tracking & Global Results Aggregation
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Our platform processes live scores, historical outcome data, and real-time match statistics across diverse sports disciplines to provide immediate post-match verification.
                        </p>
                      </div>

                      <div className="bg-[#051310]/70 border border-emerald-950/80 p-6 rounded-2xl space-y-3 hover:border-emerald-800 transition">
                        <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 font-black text-sm">
                          05
                        </div>
                        <h4 className="text-white text-sm font-black uppercase tracking-wide">
                          Community & Social Interaction Networks
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          We host digital discussion hubs where sports enthusiasts, seasoned forecasters, and retail agents connect, analyze fixtures, and debate strategy in real time.
                        </p>
                      </div>

                      <div className="bg-[#051310]/70 border border-emerald-950/80 p-6 rounded-2xl space-y-3 hover:border-emerald-800 transition">
                        <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 font-black text-sm">
                          06
                        </div>
                        <h4 className="text-white text-sm font-black uppercase tracking-wide">
                          Broadcast & Digital Media Rights Management
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          We hold and exploit digital rights to stream, broadcast, and display live global sporting events across our web and mobile applications.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* WHAT WE DELIVER EVERY WEEK */}
                  <div className="bg-[#040f0c] border border-emerald-950/80 rounded-3xl p-8 space-y-6">
                    <div className="border-b border-emerald-950 pb-3">
                      <h3 className="text-xl md:text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2">
                        <span className="text-amber-400">📅</span>
                        WHAT WE DELIVER EVERY WEEK
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex gap-4 items-start bg-[#020705] p-5 rounded-2xl border border-emerald-950/60">
                        <span className="text-emerald-400 text-xl font-bold">✓</span>
                        <div className="space-y-1">
                          <h4 className="text-white text-xs md:text-sm font-black uppercase">
                            UK & Australian Pool Key Fixtures
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Standardized weekly coupon releases accompanied by validated matrix codes for instant booking across top-tier bookmakers.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start bg-[#020705] p-5 rounded-2xl border border-emerald-950/60">
                        <span className="text-emerald-400 text-xl font-bold">✓</span>
                        <div className="space-y-1">
                          <h4 className="text-white text-xs md:text-sm font-black uppercase">
                            High-Accuracy Bet Tips & Permutation Matrices
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Expert mathematical projections designed to boost weekly sales for retail agents and improve hit rates for punters.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start bg-[#020705] p-5 rounded-2xl border border-emerald-950/60">
                        <span className="text-emerald-400 text-xl font-bold">✓</span>
                        <div className="space-y-1">
                          <h4 className="text-white text-xs md:text-sm font-black uppercase">
                            Cross-Market Intelligence
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            In-depth breakdowns of team form, head-to-head metrics, and market movements ahead of every major pool weekend.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start bg-[#020705] p-5 rounded-2xl border border-emerald-950/60">
                        <span className="text-emerald-400 text-xl font-bold">✓</span>
                        <div className="space-y-1">
                          <h4 className="text-white text-xs md:text-sm font-black uppercase">
                            Instant Digital Access
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Seamless multi-channel delivery of fixture lists, print-ready PDF formats, and live digital feeds directly to mobile devices and retail terminals.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* OUR LEGACY & VISION */}
                  <div className="bg-gradient-to-r from-[#061813] to-[#020705] border border-emerald-900/40 rounded-3xl p-8 space-y-4">
                    <h3 className="text-xl md:text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2">
                      <span className="text-emerald-400">🌟</span>
                      OUR LEGACY & VISION
                    </h3>
                    <div className="space-y-3 text-slate-300 text-xs md:text-sm leading-relaxed">
                      <p>
                        From our beginnings as a printed paper circulating through neighborhood kiosks in Lagos to becoming a pan-African sports analytics network, our core mission has remained constant: driving profitability for the African betting community through access, precision, and speed.
                      </p>
                      <p className="text-slate-400 font-medium">
                        As digital adoption accelerates across the continent, Fastpoolcodes.com continues to pioneer tools that empower retail shop owners to scale their revenue while giving punters the data edge required to navigate modern sports markets.
                      </p>
                    </div>
                  </div>

                  {/* JOIN THE NETWORK */}
                  <div className="bg-gradient-to-br from-[#0c2820] to-[#030e0b] border-2 border-emerald-500/40 rounded-3xl p-8 md:p-10 space-y-6 text-center shadow-2xl">
                    <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 px-4 py-1.5 rounded-full text-xs font-mono font-black text-emerald-400 uppercase tracking-widest">
                      🤝 Join FastPoolCodes Today
                    </div>
                    <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight uppercase">
                      JOIN THE NETWORK
                    </h3>
                    <p className="text-slate-300 text-xs md:text-sm max-w-2xl mx-auto leading-relaxed">
                      Sign up to our sports community today to receive weekly football pool fixtures, cross-agency betting codes, expert match projections, and live data feeds built to power your betting shop or personal forecasting strategy.
                    </p>
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
                      <button
                        onClick={() => {
                          setShowSystemAuth(true);
                          setAuthMode('signup');
                        }}
                        className="bg-[#fa3e65] hover:bg-[#e03055] text-white font-black text-xs md:text-sm uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-lg shadow-rose-950/40 transition active:scale-95 cursor-pointer"
                      >
                        Create Free Account
                      </button>
                      <button
                        onClick={() => {
                          if (onNavigateToCodes) {
                            onNavigateToCodes();
                          } else {
                            triggerToast('Navigating to pool coupon codes...', 'info');
                          }
                        }}
                        className="bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 font-bold text-xs md:text-sm uppercase tracking-wider px-7 py-3.5 rounded-xl transition cursor-pointer"
                      >
                        Explore Coupon Codes
                      </button>
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
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_BLOG_IMAGES[0];
                    }}
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {blogModalArticle.date}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-extrabold">{blogModalArticle.readTime}</span>
                    </div>

                    <button
                      onClick={() => handleShareBlogArticle(blogModalArticle)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-black text-xs transition active:scale-95 cursor-pointer shadow-xs"
                      title="Share Article"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Share Post</span>
                    </button>
                  </div>

                  <h3 className="font-sans font-black text-white text-xl md:text-2xl leading-tight tracking-tight">
                    {blogModalArticle.title}
                  </h3>
                </div>

                {/* Quick Share Bar */}
                <div className="flex flex-wrap items-center gap-2 bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-xl text-xs font-semibold text-zinc-300">
                  <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
                    <Share2 className="w-3.5 h-3.5 text-rose-500" /> Share:
                  </span>
                  
                  <button
                    onClick={() => handleShareBlogArticle(blogModalArticle)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-[11px] font-bold transition cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-emerald-400" />
                    <span>Copy Link</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent((blogModalArticle.title || 'FastPoolCodes Analysis') + ' - ' + getPostShareUrl(blogModalArticle))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-md text-[11px] font-bold transition"
                  >
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blogModalArticle.title || 'FastPoolCodes Analysis')}&url=${encodeURIComponent(getPostShareUrl(blogModalArticle))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 rounded-md text-[11px] font-bold transition"
                  >
                    <span>X / Twitter</span>
                  </a>

                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getPostShareUrl(blogModalArticle))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-md text-[11px] font-bold transition"
                  >
                    <span>Facebook</span>
                  </a>
                </div>

                <div className="h-px bg-zinc-800 w-full my-3"></div>

                <div className="text-zinc-300 text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                  {blogModalArticle.content || blogModalArticle.summary}
                </div>

                {/* Additional footer warning promo */}
                <div className="bg-emerald-950/25 border border-emerald-900/40 rounded-xl p-4.5 space-y-2 mt-6">
                  <h5 className="font-extrabold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Decrypted Pool Codes & Live API Feeds
                  </h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
                    This analysis is verified by Australian draw calculators. View full betting sequences and decrypted codes inside our pool codes dashboard.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
                    <button 
                      onClick={() => {
                        setBlogModalArticle(null);
                        onNavigateToCodes();
                      }}
                      className="w-full sm:flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase py-2.5 px-4 rounded-lg tracking-wider transition active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      <span>Open Pool Codes Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => {
                        setBlogModalArticle(null);
                        setShowPaywall(true);
                      }}
                      className="w-full sm:w-auto bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[10px] uppercase py-2.5 px-4 rounded-lg tracking-wider transition active:scale-95 cursor-pointer text-center"
                    >
                      Unlock VIP Keys
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom close CTA */}
              <div className="bg-zinc-950 p-4 border-t border-zinc-800 shrink-0 flex justify-end gap-3 select-none">
                <button 
                  onClick={() => setBlogModalArticle(null)}
                  className="bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-black uppercase px-6 py-2.5 rounded-lg transition active:scale-95 cursor-pointer"
                >
                  Close
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
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[99] backdrop-blur-md overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#080E1E] text-emerald-100 max-w-4xl w-full rounded-2xl border-2 border-emerald-500/50 p-6 shadow-[0_0_50px_rgba(16,185,129,0.2)] relative text-left my-8 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => {
                  setShowPaywall(false);
                  setPendingUser(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2 mb-6 select-none">
                <Award className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
                <h3 className="font-sans font-black text-xl text-white tracking-tight uppercase">👑 VIP Membership & Bookmaker Subscriptions</h3>
                <p className="text-xs text-emerald-400 font-bold max-w-lg mx-auto">
                  Select any bookmaker subscription plan using the comparison matrix below for instant automated access.
                </p>
              </div>

              {/* Regional Tab Selector */}
              <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 mb-5 max-w-md mx-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setPaywallRegionFilter('nigeria');
                    setPaywallPlan('plan-monthly');
                    setVipBookmakerFilter('all');
                  }}
                  className={`flex-1 text-center py-2 px-3 text-xs font-mono font-bold uppercase rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
                    paywallRegionFilter === 'nigeria'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🇳🇬</span>
                  <span>Nigeria Standalone Plans</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaywallRegionFilter('ghana');
                    setPaywallPlan('plan-ghana');
                    setVipBookmakerFilter('all');
                  }}
                  className={`flex-1 text-center py-2 px-3 text-xs font-mono font-bold uppercase rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
                    paywallRegionFilter === 'ghana'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🇬🇭</span>
                  <span>Ghana Standalone Plans</span>
                </button>
              </div>

              {/* Bookmaker x Billing Cycle Comparison Matrix */}
              {(() => {
                const isGhana = paywallRegionFilter === 'ghana';
                const currencySymbol = isGhana ? 'GH₵' : '₦';
                const countryKey = isGhana ? 'ghana' : 'nigeria';

                const countryBookies = getBookmakersByCountry(db.bookmakers, countryKey);
                const rawComps = countryBookies.length > 0
                  ? countryBookies.map((b: any) => ({
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

                const getPlanDisplayMeta = (p: any) => {
                  const cycle = (p.billing_cycle || '').toLowerCase();
                  const name = (p.name || '').toLowerCase();
                  if (cycle === 'weekly' || name.includes('weekly')) {
                    return { cycleName: 'Weekly', duration: '1 Week Access' };
                  }
                  if (cycle === 'monthly' || name.includes('monthly')) {
                    return { cycleName: 'Monthly', duration: '4 Wks + 1 Wk Bonus' };
                  }
                  if (cycle === 'quarterly' || name.includes('quarterly')) {
                    return { cycleName: 'Quarterly', duration: '12 Wks + 1 Wk Bonus' };
                  }
                  if (cycle === 'biannual' || cycle === 'bi-annual' || (name.includes('annual') && name.includes('bi'))) {
                    return { cycleName: 'Bi-Annual', duration: '24 Wks + 2 Wks Bonus' };
                  }
                  if (cycle === 'yearly' || name.includes('yearly') || name.includes('annual')) {
                    return { cycleName: 'Yearly', duration: '48 Wks + 4 Wks Bonus' };
                  }
                  return { cycleName: p.billing_cycle || p.name, duration: p.description || 'Standard Access' };
                };

                const activeBookmakers = vipBookmakerFilter === 'all'
                  ? bookmakersList
                  : bookmakersList.filter(b => b.slug === vipBookmakerFilter.toLowerCase());

                return (
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="border border-slate-800 bg-[#070B14] rounded-2xl overflow-hidden shadow-xl">
                      <div className="bg-slate-950 p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                            <span>📊</span>
                            <span>Bookmaker x Billing Cycle Comparison Matrix</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Select any duration cell from Weekly to Yearly to activate access for that bookmaker table.
                          </p>
                        </div>

                        {/* Bookmaker Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 md:pt-0 scrollbar-thin">
                          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold shrink-0 mr-1">Filter:</span>
                          <button
                            type="button"
                            onClick={() => setVipBookmakerFilter('all')}
                            className={`px-2.5 py-1 text-[10px] font-mono rounded-lg font-bold transition shrink-0 ${
                              vipBookmakerFilter === 'all'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                            }`}
                          >
                            ALL
                          </button>
                          {bookmakersList.map((bmk, bIdx) => (
                            <button
                              key={`pw_bmk_pill_${bmk.slug}_${bIdx}`}
                              type="button"
                              onClick={() => setVipBookmakerFilter(bmk.slug)}
                              className={`px-2.5 py-1 text-[10px] font-mono rounded-lg font-bold transition shrink-0 uppercase ${
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
                        <table className="w-full text-left border-collapse min-w-[650px]">
                          <thead>
                            <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono font-bold border-b border-slate-800">
                              <th className="p-3 pl-4 w-44">Bookmaker</th>
                              {displayPlans.map((p, idx) => {
                                const meta = getPlanDisplayMeta(p);
                                return (
                                  <th key={`pw_matrix_head_${p.id}_${idx}`} className="p-3 text-center border-l border-slate-900">
                                    <div className="flex flex-col items-center gap-0.5">
                                      <span className="text-[11px] font-black text-white uppercase tracking-wider font-mono">
                                        {meta.cycleName}
                                      </span>
                                      <span className="text-[9px] text-emerald-400/90 font-medium lowercase font-mono">
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
                              <tr key={`pw_matrix_row_${bmk.slug}_${bIdx}`} className="hover:bg-slate-900/50 transition-colors">
                                <td className="p-3 pl-4 font-bold text-white font-sans">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-emerald-950 text-emerald-400 font-mono font-black text-[10px] flex items-center justify-center border border-emerald-800">
                                      {(bmk.name || 'B').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-slate-200">{bmk.name}</span>
                                  </div>
                                </td>
                                {displayPlans.map((p, pIdx) => {
                                  const isSelected = paywallPlan === p.id && selectedPaywallBookmaker === bmk.slug;
                                  const unitPrice = Number(p.price || 0);
                                  return (
                                    <td key={`pw_matrix_cell_${bmk.slug}_${p.id}_${pIdx}`} className="p-3 text-center font-mono border-l border-slate-900/60">
                                      <div className="flex flex-col items-center gap-1.5">
                                        <span className="text-xs font-black text-emerald-400">
                                          {currencySymbol}{unitPrice.toLocaleString()}
                                        </span>
                                        {isPaymentDisabledBookmaker(bmk) ? (
                                          <button
                                            type="button"
                                            onClick={() => triggerToast(`Payment portal for ${bmk.name} is currently disabled.`, 'info')}
                                            className="bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-750 font-bold text-[9px] uppercase px-2 py-1 rounded-md transition cursor-pointer whitespace-nowrap"
                                            title={`Payment portal for ${bmk.name} is currently disabled`}
                                          >
                                            🔒 PORTAL DISABLED
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPaywallPlan(p.id);
                                              setSelectedPaywallBookmaker(bmk.slug);
                                            }}
                                            className={`font-black text-[9.5px] uppercase px-2.5 py-1 rounded-md transition cursor-pointer active:scale-95 whitespace-nowrap ${
                                              isSelected
                                                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                                                : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                                            }`}
                                          >
                                            {isSelected ? 'SELECTED ✓' : `BUY ${(bmk.name || 'BOOKMAKER').toUpperCase()}`}
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

              <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2 border-t border-slate-800">
                <div className="text-xs font-mono font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>AUTHORIZE PAYMENT DEPOSIT FOR SELECTED PACKAGE ({selectedPaywallBookmaker.toUpperCase()})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                {authMode === 'change_password' ? (
                  <KeyRound className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
                ) : (
                  <Zap className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
                )}
                <h3 className="font-sans font-black text-lg text-white tracking-tight uppercase">
                  {authMode === 'signup' 
                    ? 'Create Free Account' 
                    : authMode === 'change_password'
                    ? 'Change Password'
                    : 'Access Member Account'}
                </h3>
                <p className="text-[10px] text-emerald-400/80 font-semibold max-w-xs mx-auto leading-relaxed">
                  {authMode === 'change_password'
                    ? 'Provide your registered username or email to set a new security password.'
                    : 'FastPoolCodes simulator systems securely encrypt identity codes for active sheets access.'}
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'change_password' ? (
                  <>
                    <div className="space-y-1 text-xs">
                      <label className="block text-slate-300 font-extrabold font-mono tracking-wider uppercase text-[10px]">
                        Username or Email Address
                      </label>
                      <input
                        type="text"
                        required
                        value={resetFields.usernameOrEmail}
                        onChange={(e) => setResetFields({ ...resetFields, usernameOrEmail: e.target.value })}
                        className="w-full bg-[#020b08] border border-emerald-950 rounded-lg p-3 text-[#A7F3D0] focus:ring-1 focus:ring-emerald-400 focus:outline-none placeholder:text-emerald-950 font-semibold"
                        placeholder="e.g. john_doe_forecaster or john@email.com"
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="block text-slate-300 font-extrabold font-mono tracking-wider uppercase text-[10px]">
                        New Security Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={resetFields.newPassword}
                        onChange={(e) => setResetFields({ ...resetFields, newPassword: e.target.value })}
                        className="w-full bg-[#020b08] border border-emerald-955 rounded-lg p-3 text-[#A7F3D0] focus:ring-1 focus:ring-emerald-400 focus:outline-none placeholder:text-[#062017]"
                        placeholder="Minimum 5 characters"
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="block text-slate-300 font-extrabold font-mono tracking-wider uppercase text-[10px]">
                        Confirm New Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={resetFields.confirmPassword}
                        onChange={(e) => setResetFields({ ...resetFields, confirmPassword: e.target.value })}
                        className="w-full bg-[#020b08] border border-emerald-955 rounded-lg p-3 text-[#A7F3D0] focus:ring-1 focus:ring-emerald-400 focus:outline-none placeholder:text-[#062017]"
                        placeholder="Re-enter new password"
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
                      className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs uppercase py-3.5 rounded-xl shadow-lg shadow-amber-950/40 transition-all cursor-pointer mt-2 text-center"
                    >
                      Update & Save Password
                    </button>
                  </>
                ) : authMode === 'signup' ? (
                  <>
                    <div className="space-y-1 text-xs">
                      <label className="block text-slate-300 font-extrabold font-mono tracking-wider uppercase text-[10px]">Username (Optional)</label>
                      <input
                        type="text"
                        value={authFields.username || ''}
                        onChange={(e) => setAuthFields({ ...authFields, username: e.target.value })}
                        className="w-full bg-[#020b08] border border-emerald-950 rounded-lg p-3 text-[#A7F3D0] focus:ring-1 focus:ring-emerald-400 focus:outline-none placeholder:text-emerald-900 font-semibold"
                        placeholder="Choose a username (e.g. pool_master)"
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="block text-slate-300 font-extrabold font-mono tracking-wider uppercase text-[10px]">Your Email Address</label>
                      <input
                        type="email"
                        required
                        value={authFields.email}
                        onChange={(e) => setAuthFields({ ...authFields, email: e.target.value })}
                        className="w-full bg-[#020b08] border border-emerald-950 rounded-lg p-3 text-[#A7F3D0] focus:ring-1 focus:ring-emerald-400 focus:outline-none placeholder:text-emerald-900 font-semibold"
                        placeholder="e.g. john@fastpoolcodes.com"
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="block text-slate-300 font-extrabold font-mono tracking-wider uppercase text-[10px]">
                        Security Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={authFields.password}
                        onChange={(e) => setAuthFields({ ...authFields, password: e.target.value })}
                        className="w-full bg-[#020b08] border border-emerald-955 rounded-lg p-3 text-[#A7F3D0] focus:ring-1 focus:ring-emerald-400 focus:outline-none placeholder:text-[#062017]"
                        placeholder="Minimum 6 characters"
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

                    <div className="flex items-start gap-2 text-[10px] text-slate-400 font-sans leading-relaxed select-none bg-emerald-950/20 border border-emerald-950/40 p-2.5 rounded-lg">
                      <input 
                        type="checkbox" 
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        id="agreeTerms" 
                        className="rounded border-emerald-900 bg-[#020b08] text-emerald-500 focus:ring-0 mt-0.5 h-3.5 w-3.5 cursor-pointer" 
                      />
                      <label htmlFor="agreeTerms" className="cursor-pointer">
                        I am <span className="text-amber-400 font-black">18 years of age or older</span>, and agree to the{' '}
                        <span 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onOpenTerms) onOpenTerms();
                          }}
                          className="text-emerald-400 font-black underline hover:text-emerald-300 transition"
                        >
                          Terms of Service
                        </span>{' '}
                        of FastPoolCodes.
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-xs uppercase py-3.5 rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer mt-2 text-center"
                    >
                      Create Free Account
                    </button>
                  </>
                ) : (
                  <>
                    <div className="space-y-1 text-xs">
                      <label className="block text-slate-300 font-extrabold font-mono tracking-wider uppercase text-[10px]">
                        Email or Username
                      </label>
                      <input
                        type="text"
                        required
                        value={authFields.username}
                        onChange={(e) => setAuthFields({ ...authFields, username: e.target.value })}
                        className="w-full bg-[#020b08] border border-emerald-950 rounded-lg p-3 text-[#A7F3D0] focus:ring-1 focus:ring-emerald-400 focus:outline-none placeholder:text-emerald-950 font-semibold"
                        placeholder="e.g. john@fastpoolcodes.com or john_doe"
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <label className="block text-slate-300 font-extrabold font-mono tracking-wider uppercase text-[10px]">
                          Security Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('change_password');
                            setResetFields({ usernameOrEmail: authFields.username, newPassword: '', confirmPassword: '' });
                          }}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase font-mono tracking-wide cursor-pointer hover:underline"
                        >
                          Change Password?
                        </button>
                      </div>
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
                      Access Portal Dashboard
                    </button>
                  </>
                )}
              </form>

              {/* Toggle mode links */}
              <div className="mt-5 text-center text-xs text-slate-400 select-none space-y-1.5">
                {authMode === 'signup' ? (
                  <div>
                    Already signed up?{' '}
                    <span 
                      onClick={() => setAuthMode('login')}
                      className="text-emerald-400 font-black cursor-pointer hover:underline"
                    >
                      Login Profile
                    </span>
                  </div>
                ) : authMode === 'change_password' ? (
                  <div>
                    Remembered your password?{' '}
                    <span 
                      onClick={() => setAuthMode('login')}
                      className="text-emerald-400 font-black cursor-pointer hover:underline"
                    >
                      Back to Login Profile
                    </span>
                  </div>
                ) : (
                  <>
                    <div>
                      New coupon forecast user?{' '}
                      <span 
                        onClick={() => setAuthMode('signup')}
                        className="text-emerald-400 font-black cursor-pointer hover:underline"
                      >
                        Create Free Account
                      </span>
                    </div>
                    <div>
                      Forgot or need to update key?{' '}
                      <span 
                        onClick={() => {
                          setAuthMode('change_password');
                          setResetFields({ usernameOrEmail: authFields.username, newPassword: '', confirmPassword: '' });
                        }}
                        className="text-amber-400 font-black cursor-pointer hover:underline"
                      >
                        Change Password
                      </span>
                    </div>
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
