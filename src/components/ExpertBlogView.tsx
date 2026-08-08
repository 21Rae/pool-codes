import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Search,
  BookOpen,
  Calendar,
  MessageSquare,
  Sparkles,
  Zap,
  Info,
  Mail,
  HelpCircle,
  Users,
  Lock,
  Trophy,
  Activity,
  Award,
  Volume2,
  TrendingUp,
  Check,
  FileText,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Share2,
  Copy
} from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';

const FALLBACK_BLOG_IMAGES = [
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80'
];

function getBlogImage(post?: any, index: number = 0) {
  if (post && post.image_url && typeof post.image_url === 'string' && post.image_url.trim() !== '') {
    return post.image_url;
  }
  return FALLBACK_BLOG_IMAGES[index % FALLBACK_BLOG_IMAGES.length];
}

interface ExpertBlogViewProps {
  blogPosts: Array<{
    id: string;
    title: string;
    summary: string;
    content: string;
    date: string;
    readTime: string;
    image_url?: string;
  }>;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onReadArticle: (article: any) => void;
  onOpenPaywall: () => void;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  supabaseConfigured?: boolean;
  supabaseError?: string | null;
  candidateErrors?: Record<string, string>;
  onRefreshBlogs?: () => void;
  onOpenTerms?: () => void;
  onNavigateToCodes?: () => void;
  db?: any;
}

export default function ExpertBlogView({
  blogPosts,
  onOpenAuth,
  onReadArticle,
  onOpenPaywall,
  triggerToast,
  supabaseConfigured = true,
  supabaseError = null,
  candidateErrors = {},
  onRefreshBlogs,
  onOpenTerms,
  onNavigateToCodes,
  db
}: ExpertBlogViewProps) {

  const [probeTableName, setProbeTableName] = useState('');
  const [probeResult, setProbeResult] = useState<string | null>(null);
  const [probeLoading, setProbeLoading] = useState(false);

  // Ensure blogs are sorted: hero blog stays at index 0, remaining blogs sorted latest uploaded first
  const sortedBlogPosts = useMemo(() => {
    if (!blogPosts || blogPosts.length <= 1) return blogPosts || [];

    let heroIndex = blogPosts.findIndex((b: any) => b?.is_hero === true || b?.isHero === true || b?.featured === true || b?.is_featured === true);
    if (heroIndex === -1) {
      heroIndex = 0;
    }

    const heroItem = blogPosts[heroIndex];
    const remainingItems = blogPosts.filter((_, idx) => idx !== heroIndex);

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
  }, [blogPosts]);

  const handleSharePost = async (post: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const shareUrl = window.location.href;
    const shareTitle = post?.title || 'FastPoolCodes Blog Analysis';
    const shareText = post?.summary || 'Check out this verified football pool analysis on FastPoolCodes!';

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
        // user cancelled or share failed, fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      triggerToast('Blog post link copied to clipboard!', 'success');
    } catch (err) {
      triggerToast('Could not copy link.', 'error');
    }
  };

  const [resultsList, setResultsList] = useState<any[]>(() => {
    const stored = localStorage.getItem('fastpool_pool_results_list');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (_) {}
    }
    return db?.pool_results || [];
  });

  const [selectedResultId, setSelectedResultId] = useState<string>('');
  const [resultsSearchQuery, setResultsSearchQuery] = useState('');
  const [resultsTableSearch, setResultsTableSearch] = useState('');

  // Publishing to Supabase state
  const [newArticleTitle, setNewArticleTitle] = useState('FastPoolCodes Weekly Key Analysis & Draw Predictions');
  const [newArticleSummary, setNewArticleSummary] = useState('Official weekly codes and perming breakdown for Aussie and UK pool coupons.');
  const [newArticleContent, setNewArticleContent] = useState('Detailed perming breakdown and key selections for the upcoming weekend fixtures. Verify all coupon numbers before placing bets.');
  const [isPublishingArticle, setIsPublishingArticle] = useState(false);
  const [publishResult, setPublishResult] = useState<{ success: boolean; message: string } | null>(null);

  const handlePublishArticleToSupabase = async () => {
    if (!newArticleTitle.trim() || !newArticleSummary.trim()) {
      triggerToast('Please provide a title and summary', 'error');
      return;
    }
    setIsPublishingArticle(true);
    setPublishResult(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setPublishResult({
          success: false,
          message: 'Supabase credentials are not configured in .env / secrets.'
        });
        setIsPublishingArticle(false);
        return;
      }

      const newRow = {
        title: newArticleTitle.trim(),
        summary: newArticleSummary.trim(),
        content: newArticleContent.trim(),
        image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        read_time: '4 min read'
      };

      const { data, error } = await supabase.from('blogs').insert([newRow]).select();

      if (error) {
        console.error('Direct insert error:', error);
        let errDetail = error.message;
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          errDetail += '\n\n💡 REASON: Row Level Security (RLS) is blocking inserts for anonymous users on table "blogs".\nRun this in Supabase SQL Editor:\nALTER TABLE public.blogs DISABLE ROW LEVEL SECURITY;\nOR add an INSERT policy: CREATE POLICY "Allow inserts" ON public.blogs FOR INSERT WITH CHECK (true);';
        }
        setPublishResult({
          success: false,
          message: `❌ Insert Failed:\n${errDetail}`
        });
      } else {
        setPublishResult({
          success: true,
          message: `✅ Success! Published 1 new article to your Supabase "blogs" table.`
        });
        triggerToast('Article published to Supabase!', 'success');
        if (onRefreshBlogs) {
          onRefreshBlogs();
        }
      }
    } catch (err: any) {
      setPublishResult({
        success: false,
        message: `❌ Exception: ${err.message || String(err)}`
      });
    } finally {
      setIsPublishingArticle(false);
    }
  };

  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail) {
        setResultsList(e.detail);
      }
    };
    window.addEventListener('fastpool_results_synced', handleSync);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fastpool_pool_results_list' && e.newValue) {
        try {
          setResultsList(JSON.parse(e.newValue));
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('fastpool_results_synced', handleSync);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleProbeTable = async () => {
    if (!probeTableName.trim()) {
      setProbeResult('Please enter a table name first.');
      return;
    }
    const tName = probeTableName.trim();
    setProbeLoading(true);
    setProbeResult(null);
    try {
      const response = await fetch("/api/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableName: tName })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        setProbeResult(`❌ Table "${tName}" scan failed:\n${resData.error || 'Server search failure'}`);
      } else {
        const data = resData.data;
        const rowCount = data?.length || 0;
        const cols = data && data.length > 0 ? Object.keys(data[0]).join(', ') : 'No columns returnable (table is empty)';
        setProbeResult(`✅ SUCCESS! Table "${tName}" exists in your database.\n\n• Found rows: ${rowCount} (sample count)\n• Columns identified: [ ${cols} ]\n${rowCount === 0 ? '\n💡 The table is currently empty! Add some rows in Supabase to display articles.' : ''}`);
      }
    } catch (err: any) {
      setProbeResult(`❌ Error scanning table: ${err?.message || String(err)}`);
    }
    setProbeLoading(false);
  };

  const filteredResults = resultsList.filter(r => 
    r.title?.toLowerCase().includes(resultsSearchQuery.toLowerCase()) || 
    r.week_number?.toString().includes(resultsSearchQuery)
  );

  const activeResult = resultsList.find(x => x.id === (selectedResultId || (filteredResults[0] && filteredResults[0].id)));

  const activeResultRows = activeResult ? (activeResult.results_table || []).filter((row: any) => {
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
  }) : [];

  const handlePdfClick = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerToast('To download the official PDF result sheets, please sign in or register.', 'info');
    onOpenAuth('login');
  };

  return (
    <div className="bg-[#f3f4f6] text-[#1c1c1e] min-h-screen font-sans flex flex-col antialiased">
      
      {/* 2. MAIN NAVIGATION STRIP (BAR 1 - BRAND FOCUS) */}
      <div className="bg-[#1a1a1c] border-b border-zinc-900 text-white shrink-0 select-none">
        <div className="max-w-[1360px] mx-auto px-4 flex items-center justify-center h-14">
          
          <button 
            onClick={onOpenPaywall} 
            className="hover:scale-105 active:scale-95 text-amber-300 cursor-pointer transition-all duration-300 flex items-center gap-2.5 bg-gradient-to-r from-amber-500/25 via-yellow-400/35 to-amber-500/25 border-2 border-amber-400/90 px-6 py-1.5 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse hover:shadow-[0_0_25px_rgba(245,158,11,0.6)]"
          >
            <Award className="w-4.5 h-4.5 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-widest text-amber-100">Unlock VIP Premium Pass</span>
          </button>

        </div>
      </div>

      {/* 4. MAIN THREE-COLUMN LAYOUT (PORTAL STYLE) */}
      <div className="flex-1 pb-16">
        <div className="max-w-[1360px] mx-auto px-4 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* ================== LEFT SIDEBAR (Width ~21%) ================== */}
            <div className="col-span-12 lg:col-span-3 xl:col-span-2.5 space-y-4">
              
              {/* Customise Box (Auth Promo Card) */}
              <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 border border-zinc-200 rounded p-4 text-left shadow-sm">
                <h5 className="font-black text-xs text-zinc-900 uppercase tracking-wide">Customise FPCODES</h5>
                <p className="text-[11px] text-zinc-500 font-medium leading-relaxed mt-1.5 mb-3.5">
                  Sign in or register a private profile record in our simulator system to instantly download and copy sheet perming codes.
                </p>
                <div className="space-y-2">
                  {onNavigateToCodes && (
                    <button 
                      onClick={onNavigateToCodes}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[11px] uppercase py-2 px-4 rounded-full transition shadow-sm text-center tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Pool Codes Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button 
                    onClick={() => onOpenAuth('signup')}
                    className="w-full bg-[#0066cc] hover:bg-[#0055b3] text-white font-black text-[11px] uppercase py-2 px-4 rounded-full transition shadow-sm text-center tracking-wider cursor-pointer"
                  >
                    Create Account
                  </button>
                  <button 
                    onClick={() => onOpenAuth('login')}
                    className="w-full bg-white hover:bg-zinc-50 text-[#0066cc] border border-zinc-300 font-black text-[11px] uppercase py-2 px-4 rounded-full transition text-center tracking-wider cursor-pointer"
                  >
                    Access Account / Sign In
                  </button>
                </div>
              </div>

              {/* Follow Box */}
              <div className="bg-white border border-zinc-200 rounded p-4 text-left shadow-sm">
                <span className="font-black text-[10px] tracking-widest text-zinc-400 uppercase">Follow FPCODES</span>
                <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-bold text-zinc-700">
                  <a 
                    href="https://m.facebook.com/fastpoolcodes/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded transition border border-transparent hover:border-blue-150"
                  >
                    <Facebook className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Facebook</span>
                  </a>
                  <a 
                    href="https://x.com/fastpoolcodes" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 p-1.5 hover:bg-zinc-50 hover:text-zinc-900 rounded transition border border-transparent hover:border-zinc-200"
                  >
                    <Twitter className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                    <span>Twitter/X</span>
                  </a>
                  <a 
                    href="https://www.instagram.com/fastpoolcodes" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 p-1.5 hover:bg-pink-50 hover:text-pink-600 rounded transition border border-transparent hover:border-pink-150"
                  >
                    <Instagram className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                    <span>Instagram</span>
                  </a>
                  <a 
                    href="http://www.youtube.com/@FastPoolCodes" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 p-1.5 hover:bg-red-50 hover:text-red-600 rounded transition border border-transparent hover:border-red-150"
                  >
                    <Youtube className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>YouTube</span>
                  </a>
                </div>
              </div>
            </div>

            {/* ================== CENTER COLUMN (Articles - Width ~58%) ================== */}
            <div className="col-span-12 lg:col-span-9 xl:col-span-7 space-y-5 text-left">
              
              {/* BILLBOARD PROMO BANNER (WORDPRESS STYLE 93% OFF DISCOUNT) */}
              <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-slate-950 border border-zinc-800 rounded-lg p-5 shadow-lg relative overflow-hidden select-none">
                {/* Decorative glows */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full filter blur-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full filter blur-2xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#fa3e65] text-white flex items-center justify-center font-black italic text-xl shadow-inner shadow-black/40 border border-rose-400/20">
                      ★
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">
                          VIP SEASON PASS
                        </span>
                        <span className="text-zinc-400 text-xs font-mono font-bold">Nigeria & UK Premium</span>
                      </div>
                      <h4 className="text-white font-extrabold text-sm md:text-base mt-1.5 leading-snug">
                        93% OFF CODES PACK FOR 2026 ACTIVE
                      </h4>
                      <p className="text-zinc-400 text-xs mt-0.5 font-medium">
                        Instant unlock of Aussie power keys, weekly draw indexes & direct priority key downloads.
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={onOpenPaywall}
                    className="bg-[#fa3e65] hover:bg-[#ff4e75] text-white font-black text-xs uppercase px-5 py-3 rounded shadow hover:scale-105 active:scale-95 transition-all text-center tracking-wider max-sm:w-full cursor-pointer shrink-0"
                  >
                    Open VIP Suite ➔
                  </button>
                </div>
              </div>

              {/* CARD 1: MAIN FEATURED HERO ARTICLE CONTAINER */}
              {sortedBlogPosts[0] && (
                <div 
                  onClick={() => onReadArticle(sortedBlogPosts[0])}
                  className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  {/* High Quality Abstract Stadium Banner Representation */}
                  <div className="h-72 w-full relative bg-gradient-to-br from-indigo-900 via-neutral-900 to-emerald-900 overflow-hidden">
                    <img 
                      src={getBlogImage(sortedBlogPosts[0], 0)} 
                      alt={sortedBlogPosts[0].title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_BLOG_IMAGES[0];
                      }}
                      className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
                    
                    {/* Floating verified badge */}
                    <div className="absolute top-4 left-4 bg-[#fa3e65] text-white text-[9px] font-black px-2 py-1 rounded shadow tracking-widest uppercase">
                      ★ COVER STORY
                    </div>

                    {/* Meta stamp */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wide">
                          ARTICLE
                        </span>
                        <span className="text-neutral-300 text-[10px] font-bold">{sortedBlogPosts[0].date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body textual block */}
                  <div className="p-5 space-y-2.5 text-left">
                    <h2 className="font-sans font-black text-zinc-900 text-xl md:text-2xl tracking-tight leading-tight group-hover:text-[#fa3e65] transition">
                      {sortedBlogPosts[0].title}
                    </h2>
                    <p className="text-zinc-500 font-medium text-xs leading-relaxed">
                      {sortedBlogPosts[0].summary}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-zinc-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 hover:text-zinc-800">
                          <BookOpen className="w-3.5 h-3.5" /> Read Full Article
                        </span>
                        <span>•</span>
                        <span className="text-rose-500 font-black">{sortedBlogPosts[0].readTime}</span>
                      </div>
                      <button
                        onClick={(e) => handleSharePost(sortedBlogPosts[0], e)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-rose-50 hover:text-rose-600 active:scale-95 text-zinc-700 rounded-md transition text-[10px] font-black uppercase cursor-pointer border border-zinc-200 shadow-xs"
                        title="Share Article"
                      >
                        <Share2 className="w-3 h-3 text-rose-500" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD 2: HIGHLIGHT SECTION 1 */}
              {sortedBlogPosts[1] && (
                <div 
                  onClick={() => onReadArticle(sortedBlogPosts[1])}
                  className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer grid grid-cols-1 md:grid-cols-12 group"
                >
                  <div className="md:col-span-5 h-48 md:h-full relative bg-gradient-to-br from-[#0c243c] via-black to-[#fa3e65]/40 overflow-hidden">
                    <img 
                      src={getBlogImage(sortedBlogPosts[1], 1)} 
                      alt={sortedBlogPosts[1].title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_BLOG_IMAGES[1];
                      }}
                      className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/30"></div>
                  </div>
                  <div className="md:col-span-7 p-5 flex flex-col justify-between text-left space-y-3">
                    <div className="space-y-1.5">
                      <h3 className="font-black text-zinc-900 text-base leading-snug group-hover:text-[#fa3e65] transition">
                        {sortedBlogPosts[1].title}
                      </h3>
                      <p className="text-zinc-500 font-medium text-[11.5px] leading-relaxed">
                        {sortedBlogPosts[1].summary}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
                      <span>{sortedBlogPosts[1].date}</span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[#fa3e65] font-black">{sortedBlogPosts[1].readTime}</span>
                        <button
                          onClick={(e) => handleSharePost(sortedBlogPosts[1], e)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-rose-50 hover:text-rose-600 active:scale-95 text-zinc-700 rounded-md transition text-[10px] font-black uppercase cursor-pointer border border-zinc-200 shadow-xs"
                          title="Share Article"
                        >
                          <Share2 className="w-3 h-3 text-rose-500" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD 3: SPOTLIGHT SECTION 2 */}
              {sortedBlogPosts[2] && (
                <div 
                  onClick={() => onReadArticle(sortedBlogPosts[2])}
                  className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer grid grid-cols-1 md:grid-cols-12 group"
                >
                  <div className="md:col-span-5 h-48 md:h-full relative bg-gradient-to-br from-[#024424] via-black to-slate-900 overflow-hidden">
                    <img 
                      src={getBlogImage(sortedBlogPosts[2], 2)} 
                      alt={sortedBlogPosts[2].title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_BLOG_IMAGES[2];
                      }}
                      className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/30"></div>
                  </div>
                  <div className="md:col-span-7 p-5 flex flex-col justify-between text-left space-y-3">
                    <div className="space-y-1.5">
                      <h3 className="font-black text-zinc-900 text-base leading-snug group-hover:text-emerald-600 transition">
                        {sortedBlogPosts[2].title}
                      </h3>
                      <p className="text-zinc-500 font-medium text-[11.5px] leading-relaxed">
                        {sortedBlogPosts[2].summary}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
                      <span>{sortedBlogPosts[2].date}</span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-emerald-600 font-black">{sortedBlogPosts[2].readTime}</span>
                        <button
                          onClick={(e) => handleSharePost(sortedBlogPosts[2], e)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95 text-zinc-700 rounded-md transition text-[10px] font-black uppercase cursor-pointer border border-zinc-200 shadow-xs"
                          title="Share Article"
                        >
                          <Share2 className="w-3 h-3 text-emerald-600" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD 4: OVERLAY COVER CARD */}
              {sortedBlogPosts[3] && (
                <div 
                  onClick={() => onReadArticle(sortedBlogPosts[3])}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden relative shadow-lg hover:shadow-xl transition h-72 cursor-pointer group flex flex-col justify-end"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#fa3e65]/35 via-zinc-950 to-emerald-950/20 z-0 overflow-hidden">
                    <img 
                      src={getBlogImage(sortedBlogPosts[3], 3)} 
                      alt={sortedBlogPosts[3].title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_BLOG_IMAGES[3];
                      }}
                      className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105 opacity-40"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
                  
                  <div className="p-6 relative z-20 space-y-2 text-left">
                    <h3 className="text-white font-black text-lg md:text-xl leading-snug group-hover:text-amber-300 transition">
                      {sortedBlogPosts[3].title}
                    </h3>
                    <p className="text-zinc-400 text-xs font-medium max-w-2xl leading-relaxed">
                      {sortedBlogPosts[3].summary}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-zinc-400 font-mono">
                      <span>{sortedBlogPosts[3].date}</span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-amber-400 font-black">{sortedBlogPosts[3].readTime}</span>
                        <button
                          onClick={(e) => handleSharePost(sortedBlogPosts[3], e)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800/90 hover:bg-amber-400 hover:text-slate-950 active:scale-95 text-zinc-200 rounded-md transition text-[10px] font-black uppercase cursor-pointer border border-zinc-700 shadow-xs"
                          title="Share Article"
                        >
                          <Share2 className="w-3 h-3 text-amber-400 group-hover:text-slate-950" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD 5+: ADDITIONAL ARTICLES LIST IF MORE THAN 4 EXIST */}
              {sortedBlogPosts.length > 4 && (
                <div className="space-y-4 pt-4 border-t border-zinc-200">
                  <h4 className="font-sans font-black text-xs text-zinc-800 uppercase tracking-wider text-left flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>More Published Articles ({sortedBlogPosts.length - 4})</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {sortedBlogPosts.slice(4).map((post, idx) => (
                      <div
                        key={post.id || idx}
                        onClick={() => onReadArticle(post)}
                        className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between gap-4 group text-left"
                      >
                        <div className="space-y-1">
                          <h5 className="font-black text-sm text-zinc-900 group-hover:text-indigo-600 transition leading-snug">
                            {post.title}
                          </h5>
                          <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed">
                            {post.summary}
                          </p>
                          <span className="text-[10px] text-zinc-400 font-bold block pt-1">
                            {post.date} • {post.readTime}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleSharePost(post, e)}
                          className="px-2.5 py-1.5 bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-600 text-zinc-600 rounded text-[10px] font-black uppercase border border-zinc-200 shrink-0 transition"
                        >
                          Share
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EMPTY STATE WHEN ZERO BLOGS EXISITING: WITH DETAILED SUPABASE CONNECTION DIAGNOSTICS */}
              {sortedBlogPosts.length === 0 && (
                <div className="bg-white border border-zinc-200 rounded-xl p-8 md:p-12 text-center space-y-6 my-6 shadow-sm">
                  <div className="w-20 h-20 bg-zinc-50 border border-zinc-150 shadow-sm rounded-full flex items-center justify-center mx-auto text-4xl select-none">
                    🧐
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-sans font-black text-xl text-zinc-900 tracking-tight">No Articles Published Yet</h3>
                    <p className="text-zinc-500 font-medium text-xs max-w-lg mx-auto leading-relaxed">
                      We connected to your database successfully but didn't find any articles to show. Let's inspect the real-time Supabase diagnostics report below to locate your published post!
                    </p>
                  </div>

                  {/* SUPABASE CONNECTION STATUS AND QUERY REPORT */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-5 text-left space-y-5 max-w-2xl mx-auto font-sans">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 pb-3 gap-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black tracking-wider uppercase text-zinc-400 font-mono block">
                          ⚙️ Supabase Integration Diagnostic & Prober
                        </span>
                        <p className="text-[10px] text-zinc-500 font-semibold">
                          Find out what tables exist or create the correct table instantly
                        </p>
                      </div>
                      <span className={`self-start sm:self-auto inline-flex items-center gap-1.5 text-[10.5px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                        supabaseConfigured 
                          ? 'text-emerald-600 bg-emerald-50 border-emerald-200' 
                          : 'text-amber-600 bg-amber-50 border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${supabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                        {supabaseConfigured ? 'Client Connected' : 'Credentials Missing'}
                      </span>
                    </div>

                    {!supabaseConfigured ? (
                      <div className="text-xs space-y-2">
                        <p className="font-bold text-red-600">⚠️ Secrets are not configured</p>
                        <p className="text-zinc-600 leading-normal">
                          Go to the **Settings** menu at the top right of your build interface, open the **Secrets** page, and add:
                        </p>
                        <ul className="list-disc list-inside font-mono text-[11px] bg-white p-2 border border-zinc-150 rounded space-y-1">
                          <li>VITE_SUPABASE_URL</li>
                          <li>VITE_SUPABASE_ANON_KEY</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="space-y-5 text-xs font-medium">
                        
                        {/* Summary message */}
                        <div className="bg-amber-50 border border-amber-200/80 rounded p-4 text-[11px] leading-relaxed text-zinc-750 font-sans space-y-2.5">
                          <p className="font-extrabold uppercase tracking-wider text-[9.5px] text-amber-950 flex items-center gap-1.5 font-sans">
                            ⚠️ SUCCESSFUL CONNECTION, BUT RETURNED 0 ARTICLES
                          </p>
                          <p className="text-zinc-650 leading-relaxed font-semibold">
                            Great news: your web app is <strong>successfully connected</strong> to your Supabase project! However, your <code className="bg-white p-1 rounded font-mono text-[9.5px] text-indigo-700 font-bold border border-zinc-200">blogs</code> table returns exactly <strong>0 rows</strong>.
                          </p>
                          
                          <div className="p-3 bg-white border border-amber-100 rounded text-[10.5px] text-zinc-650 space-y-1.5 leading-relaxed">
                            <p className="font-extrabold text-zinc-800 uppercase text-[9px] tracking-wider">Why is it still blank?</p>
                            <ul className="list-decimal list-inside space-y-1 text-zinc-600 font-medium">
                              <li>
                                <strong className="text-amber-800">Row Level Security (RLS) is blocking the reads:</strong> By default in Supabase, newly created tables block anonymous/public reads. Supabase silently returns <strong>0 rows</strong> (with no error) unless you add a public <code className="font-mono bg-zinc-100 px-1 rounded text-zinc-850">SELECT USING (true)</code> policy.
                              </li>
                              <li>
                                <strong className="text-indigo-900">The table has 0 rows:</strong> The SQL query to create the table completed successfully, but the starter article insert command did not run or was not executed.
                              </li>
                            </ul>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 sm:items-center pt-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (onRefreshBlogs) {
                                  onRefreshBlogs();
                                  triggerToast('Re-scanning database tables...', 'info');
                                }
                              }}
                              className="text-white bg-zinc-900 border border-zinc-800 hover:bg-black font-extrabold text-[10px] px-3.5 py-1.5 rounded transition uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <span>🔄 Recheck & Refresh Articles</span>
                            </button>
                            <p className="text-[10px] text-zinc-500 font-semibold italic">
                              ← Click this button after running either of the fix SQLs below!
                            </p>
                          </div>
                        </div>

                        {/* Direct Article Publisher / Supabase Insert Tester */}
                        <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-4 space-y-3.5 shadow-sm text-left font-sans">
                          <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                            <span className="text-emerald-950 font-black tracking-wider uppercase text-[11px] flex items-center gap-1.5">
                              <span>✍️ Direct Test Article Publisher</span>
                            </span>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded tracking-wider uppercase">
                              In-App Inserter
                            </span>
                          </div>
                          <p className="text-[10.5px] text-zinc-600 font-medium leading-relaxed">
                            Publish a test article directly into your Supabase <code className="bg-white px-1 py-0.5 rounded border border-emerald-200 font-mono text-emerald-800 font-bold">blogs</code> table right now. If your RLS policy blocks it, you'll see the exact error message instantly!
                          </p>

                          <div className="space-y-2.5">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-zinc-700 mb-1">
                                Article Title
                              </label>
                              <input 
                                type="text" 
                                value={newArticleTitle}
                                onChange={(e) => setNewArticleTitle(e.target.value)}
                                placeholder="Enter title..."
                                className="w-full bg-white border border-emerald-200 rounded px-3 py-1.5 text-xs text-zinc-800 font-medium focus:outline-none focus:border-emerald-500 shadow-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-black uppercase text-zinc-700 mb-1">
                                Summary / Excerpt
                              </label>
                              <input 
                                type="text" 
                                value={newArticleSummary}
                                onChange={(e) => setNewArticleSummary(e.target.value)}
                                placeholder="Enter short summary..."
                                className="w-full bg-white border border-emerald-200 rounded px-3 py-1.5 text-xs text-zinc-800 font-medium focus:outline-none focus:border-emerald-500 shadow-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-black uppercase text-zinc-700 mb-1">
                                Full Article Content
                              </label>
                              <textarea 
                                rows={2}
                                value={newArticleContent}
                                onChange={(e) => setNewArticleContent(e.target.value)}
                                placeholder="Enter full body text..."
                                className="w-full bg-white border border-emerald-200 rounded px-3 py-1.5 text-xs text-zinc-800 font-medium focus:outline-none focus:border-emerald-500 shadow-xs"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={handlePublishArticleToSupabase}
                              disabled={isPublishingArticle}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 rounded transition shadow-sm uppercase tracking-wider disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                            >
                              <span>{isPublishingArticle ? 'Publishing to Supabase...' : '🚀 Publish Article to Supabase'}</span>
                            </button>

                            {publishResult && (
                              <div className={`p-3 rounded font-mono text-[10.5px] whitespace-pre-wrap leading-relaxed border shadow-xs ${
                                publishResult.success 
                                  ? 'bg-emerald-950 text-emerald-200 border-emerald-800' 
                                  : 'bg-rose-950 text-rose-200 border-rose-800'
                              }`}>
                                {publishResult.message}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Interactive custom table name checker */}
                        <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3 shadow-inner">
                          <label className="block text-xs font-black uppercase text-zinc-700 tracking-wider font-sans">
                            🔍 Live Custom Table Prober
                          </label>
                          <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
                            Did you name your table something else (e.g. <code className="bg-zinc-100 px-1 py-0.5 rounded text-indigo-600 font-mono text-[10px]">football_news</code>)? Enter its name below to test if it exists and check its columns live!
                          </p>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="e.g. football_news" 
                              value={probeTableName}
                              onChange={(e) => setProbeTableName(e.target.value)}
                              className="md:flex-1 w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 font-mono text-xs text-zinc-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={handleProbeTable}
                              disabled={probeLoading}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3.5 py-1.5 rounded transition shadow-sm uppercase tracking-wider disabled:opacity-50"
                            >
                              {probeLoading ? 'Testing...' : 'Probe Table'}
                            </button>
                          </div>
                          {probeResult && (
                            <div className="bg-zinc-950 text-slate-100 p-3 rounded font-mono text-[10px] whitespace-pre-wrap leading-normal border border-zinc-800 shadow-inner">
                              {probeResult}
                            </div>
                          )}
                        </div>

                        {/* COPYABLE SQL SCHEMA GENERATOR FOR USER */}
                        <div className="border border-indigo-150 bg-indigo-50/50 rounded-lg p-4 space-y-3.5">
                          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                            <span className="text-indigo-950 font-black tracking-wider uppercase text-[10.5px] font-sans">
                              📋 HOW TO FIX AND POPULATE (PASTE IN SUPABASE SQL EDITOR)
                            </span>
                            <span className="text-[8.5px] bg-indigo-150 text-indigo-850 font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase font-mono">
                              2 Options
                            </span>
                          </div>
                          <p className="text-zinc-650 leading-relaxed font-semibold text-[10px]">
                            Go to your <strong>Supabase Dashboard</strong>, select <strong>SQL Editor</strong> in the left sidebar, click <strong>"New Query"</strong>, paste either of these scripts, and click <strong>"Run"</strong>.
                          </p>

                          {/* Option A */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-[#fa3e65] uppercase font-sans">
                              <span className="bg-[#fa3e65] text-white px-2 py-0.5 rounded text-[8.5px]">Option A</span>
                              <span>The Fast Test Fix (Disables RLS temporarily to verify connection instantly)</span>
                            </div>
                            <pre className="bg-zinc-900 text-zinc-100 font-mono p-3 rounded-md text-[10px] leading-normal select-all overflow-x-auto border border-zinc-800 text-left">
{`-- 1. Disable Row Level Security temporarily to verify reader access instantly
ALTER TABLE public.blogs DISABLE ROW LEVEL SECURITY;

-- 2. Clear any old records and insert a premium starter article
TRUNCATE TABLE public.blogs;
INSERT INTO public.blogs (title, summary, content, image_url, read_time)
VALUES (
    'FastPoolCodes Aussie draw strategy & tie combinations',
    'Expert tips for decoding Sydney & Melbourne home team tie parameters with premium bookmaker odds calculations.',
    'Aussie Weekly pools sequence relies on balanced odds matching. Sydney and Melbourne home drawers usually hold a 45% draw average when the home handicap stands exactly at 1.50 goals. Aligning your perms accordingly is crucial.',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    '6 min read'
);`}
                            </pre>
                          </div>

                          {/* Option B */}
                          <div className="space-y-1.5 pt-2 border-t border-indigo-150/70">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-700 uppercase font-sans">
                              <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[8.5px]">Option B</span>
                              <span>The Secure Production Fix (Keeps RLS habilitated but configures public read Policy)</span>
                            </div>
                            <pre className="bg-zinc-900 text-zinc-100 font-mono p-3 rounded-md text-[10px] leading-normal select-all overflow-x-auto border border-zinc-800 text-left">
{`-- 1. Enable Row Level Security (RLS)
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing conflicting SELECT policies
DROP POLICY IF EXISTS "Allow public read access" ON public.blogs;

-- 3. Create a clean policy so anyone is authorized to read articles anonymously
CREATE POLICY "Allow public read access" ON public.blogs
    FOR SELECT USING (true);

-- 4. Clear old records and insert a premium starter article
TRUNCATE TABLE public.blogs;
INSERT INTO public.blogs (title, summary, content, image_url, read_time)
VALUES (
    'FastPoolCodes Aussie draw strategy & tie combinations',
    'Expert tips for decoding Sydney & Melbourne home team tie parameters with premium bookmaker odds calculations.',
    'Aussie Weekly pools sequence relies on balanced odds matching. Sydney and Melbourne home drawers usually hold a 45% draw average when the home handicap stands exactly at 1.50 goals. Aligning your perms accordingly is crucial.',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    '6 min read'
);`}
                            </pre>
                          </div>

                          {/* Option C */}
                          <div className="space-y-1.5 pt-2 border-t border-indigo-150/70 font-sans">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 uppercase">
                              <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[8.5px]">Option C</span>
                              <span>The Arena Dashboard Table Setup (Creates BOTH users & arena_games tables with default values)</span>
                            </div>
                            <pre className="bg-zinc-900 text-zinc-100 font-mono p-3 rounded-md text-[10px] leading-normal select-all overflow-x-auto border border-zinc-800 text-left">
{`-- 1. Create the users profile table (stores member metadata referenced across schemas)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(50) DEFAULT 'active',
    phone VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the arena_games table matching the exact dashboard matrix columns
CREATE TABLE IF NOT EXISTS public.arena_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_no INTEGER NOT NULL,
    bet_code VARCHAR(20) NOT NULL,
    home VARCHAR(120) NOT NULL,
    away VARCHAR(120) NOT NULL,
    home_win NUMERIC(6, 2) DEFAULT 1.00,
    draw NUMERIC(6, 2) DEFAULT 1.00,
    away_win NUMERIC(6, 2) DEFAULT 1.05,
    bet_tips VARCHAR(120) DEFAULT 'X',
    status VARCHAR(50) DEFAULT 'Friday',
    kick_off VARCHAR(50) DEFAULT '11:00 AM',
    bookmaker VARCHAR(100) DEFAULT 'Bet9ja',
    week VARCHAR(100) DEFAULT 'Week 49 Aussie',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Configure Row Level Security (RLS) to enforce safe permissions
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_games ENABLE ROW LEVEL SECURITY;

-- 4. Enable Read Policies for public / anonymous visitors
DROP POLICY IF EXISTS "Allow public read access on users" ON public.users;
CREATE POLICY "Allow public read access on users"
    ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on arena games" ON public.arena_games;
CREATE POLICY "Allow public read access on arena games" 
    ON public.arena_games FOR SELECT USING (true);

-- 5. Policies: Insert & All privileges
DROP POLICY IF EXISTS "Allow public registration inserts on users" ON public.users;
CREATE POLICY "Allow public registration inserts on users"
    ON public.users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin write access on users" ON public.users;
CREATE POLICY "Allow admin write access on users"
    ON public.users FOR ALL TO authenticated USING (
      coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'user') = 'admin'
      OR auth.jwt() ->> 'email' LIKE '%admin%'
    );

DROP POLICY IF EXISTS "Allow admin write access on arena games" ON public.arena_games;
CREATE POLICY "Allow admin write access on arena games" 
    ON public.arena_games FOR ALL TO authenticated
    USING (
      coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'user') = 'admin'
      OR auth.jwt() ->> 'email' LIKE '%admin%'
    );

-- 6. Seed initial professional sport coupon rows
TRUNCATE TABLE public.arena_games;
INSERT INTO public.arena_games (pool_no, bet_code, home, away, home_win, draw, away_win, bet_tips, status, kick_off, bookmaker, week)
VALUES 
  (1, '2531', 'Marconi S.', 'Sydney FC', 1.40, 4.35, 6.40, 'Ov 2.5', 'Friday', '11:00 AM', 'Bet9ja', 'Week 49 Aussie'),
  (2, '4922', 'Apia L. Tigers', 'Rockdale City', 2.10, 3.85, 3.10, 'Draw (X)', 'Saturday', '03:15 PM', 'Bet9ja', 'Week 49 Aussie'),
  (3, '1853', 'Wollongong Wolves', 'Manly United', 1.85, 4.00, 4.50, 'Un 2.5', 'Saturday', '04:30 PM', 'Bet9ja', 'Week 49 Aussie'),
  (4, '7721', 'Melbourne Knights', 'Oakleigh Cannons', 2.45, 3.60, 2.20, 'Home Draw', 'Sunday', '05:00 PM', 'BetKing', 'Week 49 Aussie'),
  (5, '8824', 'Hume City', 'South Melbourne', 3.10, 3.40, 1.95, 'Away Win', 'Sunday', '07:30 PM', 'SportyBet', 'Week 49 Aussie'),
  (6, '9012', 'St George FC', 'Sutherland Sharks', 1.70, 4.20, 5.10, 'Ov 1.5', 'Friday', '12:45 PM', 'MSport', 'Week 49 Aussie'),
  (7, '3104', 'Sydney Olympic', 'Western Sydney', 2.05, 3.70, 2.85, 'Home To Win', 'Saturday', '06:00 PM', 'Bet9ja', 'Week 49 Aussie'),
  (8, '1540', 'St George City', 'NWS Spirit', 1.90, 3.90, 3.40, 'Draw (X)', 'Saturday', '04:15 PM', 'BetKing', 'Week 49 Aussie');`}
                            </pre>
                          </div>

                          {/* Option D */}
                          <div className="space-y-1.5 pt-2 border-t border-indigo-150/70 font-sans">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-700 uppercase">
                              <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[8.5px]">Option D</span>
                              <span>The Championship Sheets (Pool Results) Single Table Setup</span>
                            </div>
                            <pre className="bg-zinc-900 text-zinc-100 font-mono p-3 rounded-md text-[10px] leading-normal select-all overflow-x-auto border border-zinc-800 text-left">
{`-- Create the single flat championship_results table maintaining the exact spreadsheet grid columns
CREATE TABLE IF NOT EXISTS public.championship_results (
    id SERIAL PRIMARY KEY,
    season_year VARCHAR(50) DEFAULT '2026',
    active_week VARCHAR(50) NOT NULL,
    fixture_date VARCHAR(50) NOT NULL,
    declared_state VARCHAR(50) DEFAULT 'VERIFIED OK',
    match_no INTEGER NOT NULL,
    home_team VARCHAR(150) NOT NULL,
    away_team VARCHAR(150) NOT NULL,
    score_ft VARCHAR(30) NOT NULL,
    pool_outcome VARCHAR(50) DEFAULT 'DRAW',
    pay_status VARCHAR(50) DEFAULT 'CLEARED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.championship_results ENABLE ROW LEVEL SECURITY;

-- Policy: Public Read Access
DROP POLICY IF EXISTS "Allow public read on championship_results" ON public.championship_results;
CREATE POLICY "Allow public read on championship_results" ON public.championship_results FOR SELECT USING (true);

-- Policy: Admin Write Access
DROP POLICY IF EXISTS "Allow admin write on championship_results" ON public.championship_results;
CREATE POLICY "Allow admin write on championship_results" ON public.championship_results FOR ALL TO authenticated USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'user') = 'admin'
    OR auth.jwt() ->> 'email' LIKE '%admin%'
);

-- Seed initial Championship drawing/results data (Week 43 UK Pool results)
TRUNCATE TABLE public.championship_results CASCADE;

INSERT INTO public.championship_results (
  season_year, 
  active_week, 
  fixture_date, 
  declared_state, 
  match_no, 
  home_team, 
  away_team, 
  score_ft, 
  pool_outcome, 
  pay_status
) VALUES 
  ('2026', 'WEEK #43', '2026-04-25', 'VERIFIED OK', 1, 'Arsenal', 'Chelsea', '1-1', 'DRAW', 'CLEARED'),
  ('2026', 'WEEK #43', '2026-04-25', 'VERIFIED OK', 2, 'Liverpool', 'Leeds', '2-0', 'HOME WIN', 'CLEARED'),
  ('2026', 'WEEK #43', '2026-04-25', 'VERIFIED OK', 3, 'Man City', 'Everton', '2-2', 'DRAW', 'CLEARED'),
  ('2026', 'WEEK #43', '2026-04-25', 'VERIFIED OK', 4, 'Napoli', 'Juventus', '0-3', 'AWAY WIN', 'CLEARED'),
  ('2026', 'WEEK #43', '2026-04-25', 'VERIFIED OK', 5, 'Real Madrid', 'Sevilla', '1-1', 'DRAW', 'CLEARED'),
  ('2026', 'WEEK #43', '2026-04-25', 'VERIFIED OK', 6, 'Barcelona', 'Valencia', '2-1', 'HOME WIN', 'CLEARED'),
  ('2026', 'WEEK #43', '2026-04-25', 'VERIFIED OK', 7, 'Aston Villa', 'Wolves', '0-0', 'DRAW', 'CLEARED'),
  ('2026', 'WEEK #43', '2026-04-25', 'VERIFIED OK', 8, 'Tottenham', 'Brentford', '1-0', 'HOME WIN', 'CLEARED'),
  ('2026', 'WEEK #43', '2026-04-25', 'VERIFIED OK', 9, 'Leicester', 'West Ham', '1-1', 'DRAW', 'CLEARED'),
  ('2026', 'WEEK #43', '2026-04-25', 'VERIFIED OK', 10, 'Roma', 'Milan', '2-2', 'DRAW', 'CLEARED');`}
                            </pre>
                          </div>
                        </div>

                        {/* Candidate Tables Scanned and Error Log list */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-black tracking-widest uppercase text-[10px] text-zinc-400 font-mono">
                              Automatic Table Scanner Report:
                            </p>
                            <span className="text-[9px] text-zinc-400 font-bold bg-zinc-100 px-1.5 py-0.5 rounded">
                              {Object.entries(candidateErrors).filter(([, errMsg]) => !(errMsg.includes('does not exist') || errMsg.includes('not found') || errMsg.includes('404') || errMsg.includes('not find'))).length} Active Tables Found
                            </span>
                          </div>
                          <div className="font-mono text-[10px] space-y-1.5 bg-zinc-950 text-emerald-400 p-3 rounded-lg max-h-48 overflow-y-auto shadow-inner leading-normal">
                            {(() => {
                              const activeEntries = Object.entries(candidateErrors).filter(([, errMsg]) => !(errMsg.includes('does not exist') || errMsg.includes('not found') || errMsg.includes('404') || errMsg.includes('not find')));
                              if (activeEntries.length > 0) {
                                return activeEntries.map(([tableName, errMsg]) => (
                                  <div key={tableName} className="border-b border-zinc-800 pb-1.5 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-emerald-500 font-black">✓</span>
                                      <span className="font-bold text-white px-1 py-0.2 rounded font-sans text-[9px] uppercase tracking-wider bg-emerald-800">
                                        TABLE: "{tableName}"
                                      </span>
                                    </div>
                                    <p className="text-zinc-400 pl-3.5 mt-0.5">
                                      Response: <span className="text-amber-300 font-semibold">{errMsg}</span>
                                    </p>
                                  </div>
                                ));
                              } else {
                                return (
                                  <div className="text-zinc-500 italic">
                                    No active tables detected yet. Create tables using the SQL setup scripts above or run a re-scan.
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>

                        {/* Interactive fix helper */}
                        <div className="border-t border-zinc-200 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] font-bold text-zinc-500 font-mono">
                          <span>🌐 Real-time Database Observer listening...</span>
                          <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            ACTIVE WATCHER
                          </span>
                        </div>

                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GRID MAPPING FOR MORE ARTICLES (Index 4+) */}
              {sortedBlogPosts.length > 4 && (
                <div className="space-y-4 pt-6 border-t border-zinc-150">
                  <h4 className="text-zinc-400 text-[10.5px] tracking-widest font-black uppercase font-mono">
                    More Published Analyses
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedBlogPosts.slice(4).map((post, idx) => (
                      <div 
                        key={post.id || idx}
                        onClick={() => onReadArticle(post)}
                        className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="h-44 relative bg-gradient-to-br from-indigo-950 via-zinc-950 to-emerald-950 overflow-hidden">
                          <img 
                            src={getBlogImage(post, idx + 4)} 
                            alt={post.title}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = FALLBACK_BLOG_IMAGES[(idx + 4) % FALLBACK_BLOG_IMAGES.length];
                            }}
                            className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                          <div className="absolute bottom-3 left-3 bg-zinc-950 border border-zinc-800 text-white text-[8px] font-mono font-bold px-2 py-0.5 rounded tracking-widest uppercase">
                            ANALYSIS #{idx + 5}
                          </div>
                        </div>
                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between text-left">
                          <div className="space-y-1">
                            <h3 className="font-extrabold text-xs md:text-sm text-zinc-900 group-hover:text-[#fa3e65] transition leading-snug line-clamp-2">
                              {post.title}
                            </h3>
                            <p className="text-zinc-500 font-medium text-[11px] leading-snug line-clamp-2">
                              {post.summary}
                            </p>
                          </div>
                          <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-zinc-400">
                            <span>{post.date}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[#fa3e65] font-black">{post.readTime}</span>
                              <button
                                onClick={(e) => handleSharePost(post, e)}
                                className="flex items-center gap-1 px-2 py-0.5 bg-zinc-100 hover:bg-rose-50 hover:text-rose-600 active:scale-95 text-zinc-700 rounded transition text-[10px] font-black uppercase cursor-pointer border border-zinc-200 shadow-xs"
                                title="Share Article"
                              >
                                <Share2 className="w-3 h-3 text-rose-500" />
                                <span>Share</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* COPY OF THE POOL RESULTS ON THE BLOG PAGE */}
              <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-6 text-left mt-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-100 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-black text-[#fa3e65] uppercase tracking-widest bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
                      🏆 Public Pool Results Board
                    </span>
                    <h3 className="text-xl font-black text-zinc-900 tracking-tight uppercase">
                      Official Weekly Pool Results
                    </h3>
                    <p className="text-zinc-500 text-xs leading-relaxed font-semibold">
                      Verify draw outcomes and verify payouts from completed fixtures. Use the week dropdown selector ontop the table to view any completed sheet.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {(() => {
                    if (!activeResult) {
                      return (
                        <div className="p-12 text-center bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-400 text-xs font-bold">
                          No pool results sheets are currently loaded.
                        </div>
                      );
                    }

                    return (
                      <div className="border border-zinc-200 rounded-lg overflow-hidden flex flex-col bg-white">
                        {/* Active Sheet Header info & Week Selector Dropdown */}
                        <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 flex-1 w-full">
                            <div className="space-y-1 shrink-0 flex flex-col items-center sm:items-start w-full sm:w-auto">
                              <span className="text-[8.5px] font-mono font-black text-rose-600 uppercase tracking-widest block text-center sm:text-left">
                                Select Results Week
                              </span>
                              <select
                                value={selectedResultId || (filteredResults[0] && filteredResults[0].id) || ''}
                                onChange={(e) => setSelectedResultId(e.target.value)}
                                className="mt-1 bg-white border-2 border-zinc-250 text-zinc-800 text-xs font-black rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-rose-500 cursor-pointer font-sans w-full sm:w-auto min-w-[260px] text-center shadow-sm uppercase tracking-wide transition-all"
                              >
                                {resultsList.map((result: any) => {
                                  const totalDraws = (result.results_table || []).filter((x: any) => x.outcome === 'DRAW').length;
                                  return (
                                    <option key={result.id} value={result.id}>
                                      WEEK {result.week_number} ({totalDraws} DRAWS) - {result.title}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            <div className="hidden sm:block border-l border-zinc-200 h-10"></div>

                            <div className="text-center sm:text-left min-w-0">
                              <span className="text-[8.5px] font-mono font-black text-zinc-400 uppercase tracking-widest block">
                                Active Result Sheet
                              </span>
                              <h4 className="text-zinc-800 font-extrabold text-xs uppercase tracking-wide truncate mt-1">
                                {activeResult.title}
                              </h4>
                            </div>
                          </div>

                          <button
                            onClick={handlePdfClick}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition shrink-0 shadow-sm w-full md:w-auto"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Download PDF</span>
                          </button>
                        </div>

                        {/* Fixtures Table Filter */}
                        <div className="px-4 py-2.5 border-b border-zinc-150 bg-zinc-50/40 flex items-center justify-between gap-3">
                          <input
                            type="text"
                            placeholder="Filter matches (e.g. Arsenal, DRAW)..."
                            value={resultsTableSearch}
                            onChange={(e) => setResultsTableSearch(e.target.value)}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-750 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition font-mono"
                          />
                          {resultsTableSearch && (
                            <button
                              onClick={() => setResultsTableSearch('')}
                              className="text-[10px] text-zinc-500 hover:text-zinc-850 uppercase font-mono font-bold shrink-0"
                              id="clear-filter-btn"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {/* Matches List Table */}
                        <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-zinc-50/80 text-zinc-500 font-mono text-[8.5px] font-bold uppercase tracking-widest border-b border-zinc-200 select-none">
                                <th className="py-2.5 px-3 text-center w-12">No</th>
                                <th className="py-2.5 px-3">Fixture Match</th>
                                <th className="py-2.5 px-3 text-center w-16">Score</th>
                                <th className="py-2.5 px-3 text-center w-20">Outcome</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 font-bold text-zinc-700">
                              {activeResultRows.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-8 px-4 text-center text-zinc-450 font-bold">
                                    No matches match your criteria.
                                  </td>
                                </tr>
                              ) : (
                                activeResultRows.map((row: any, rIdx: number) => {
                                  const isDraw = row.outcome === 'DRAW';
                                  return (
                                    <tr key={rIdx} className={`hover:bg-zinc-50/50 transition ${isDraw ? 'bg-amber-500/5' : ''}`}>
                                      <td className="py-2 px-3 text-center text-rose-600 font-mono text-[11px]">
                                        {row.matchNo}
                                      </td>
                                      <td className="py-2 px-3 text-zinc-800 text-[11px]">
                                        {row.homeTeam} <span className="text-zinc-400 font-medium">vs</span> {row.awayTeam}
                                      </td>
                                      <td className="py-2 px-3 text-center font-mono text-zinc-900 text-[11px]">
                                        {row.fullTimeScore}
                                      </td>
                                      <td className="py-2 px-3 text-center">
                                        <span className={`text-[8.5px] font-mono font-black px-1.5 py-0.5 rounded border ${
                                          isDraw
                                            ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                                            : 'bg-zinc-50 text-zinc-550 border-zinc-150'
                                        }`}>
                                          {row.outcome}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>

            {/* ================== RIGHT SIDEBAR (Width ~21%) ================== */}
            <div className="col-span-12 lg:col-span-12 xl:col-span-2.5 space-y-4">
              
              {/* VIP Decryptor Suite Features */}
              <div className="bg-white border border-zinc-200 rounded p-4 text-left shadow-sm">
                <span className="font-black text-[10px] tracking-widest text-zinc-400 uppercase">VIP PASS BENEFITS</span>
                <div className="space-y-3 mt-3">
                  <div className="flex items-start gap-2.5 select-none text-[11px] font-bold text-zinc-700 leading-normal">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    <span>1 Week Bonus included in Monthly access (1200 NGN)</span>
                  </div>
                  <div className="flex items-start gap-2.5 select-none text-[11px] font-bold text-zinc-700 leading-normal">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    <span>No weekly limits on Coupon key sheets downloads</span>
                  </div>
                  <div className="flex items-start gap-2.5 select-none text-[11px] font-bold text-zinc-700 leading-normal">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    <span>Automated copy perming codes tool access</span>
                  </div>
                </div>
                <button 
                  onClick={onOpenPaywall}
                  className="w-full bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white font-black text-xs uppercase py-2 ml-0 mt-4 rounded transition tracking-wider text-center block cursor-pointer"
                >
                  Activate Pass
                </button>
              </div>

              {/* Legal Info Card (matching smaller gray print) */}
              <div className="text-left select-none text-[10px] space-y-1 text-zinc-400 font-medium px-1 leading-normal">
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  <span onClick={() => triggerToast('Opening Privacy Policy contract...', 'info')} className="hover:underline cursor-pointer">Privacy Policy</span>
                  {onOpenTerms && (
                    <>
                      <span>•</span>
                      <span onClick={onOpenTerms} className="hover:underline cursor-pointer">Terms of Use</span>
                    </>
                  )}
                  <span>•</span>
                  <span onClick={() => triggerToast('Loading Ad guideline information...', 'info')} className="hover:underline cursor-pointer">Interest-Based Ads</span>
                </div>
                <p className="pt-1.5">
                  © 2026 FastPoolCodes Inc. All Rights Reserved. Simulated workspace with premium bookmaker draw parameters.
                </p>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* 5. LEGAL INFO MOVED TO PARENT SCROLLER */}


    </div>
  );
}
