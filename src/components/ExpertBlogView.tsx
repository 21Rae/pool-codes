import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Users,
  Lock,
  Trophy,
  Activity,
  Award,
  Volume2,
  TrendingUp,
  Check,
  FileText
} from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';

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
  db
}: ExpertBlogViewProps) {

  const [probeTableName, setProbeTableName] = useState('');
  const [probeResult, setProbeResult] = useState<string | null>(null);
  const [probeLoading, setProbeLoading] = useState(false);

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
              
              {/* Quick Links Box */}
              <div className="bg-white border border-zinc-200 rounded shadow-sm text-left">
                <div className="border-b border-zinc-100 p-3 bg-zinc-50/55">
                  <span className="font-black text-[10px] tracking-widest text-[#1c1c1e] uppercase">Quick Links</span>
                </div>
                <div className="divide-y divide-zinc-100 text-xs text-zinc-700 font-extrabold select-none">
                  <div 
                    onClick={() => triggerToast('Loading Aussie Season Power Rankings...', 'info')}
                    className="p-3 hover:bg-zinc-50 hover:text-rose-600 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-sm group-hover:bg-amber-500 group-hover:text-white transition duration-200 shrink-0">
                        <Trophy className="w-3.5 h-3.5" />
                      </span>
                      <span>Aussie Power Rankings</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition" />
                  </div>
                  <div 
                    onClick={() => triggerToast('Loading Chelsea vs Arsenal Weekly final indicators...', 'info')}
                    className="p-3 hover:bg-zinc-50 hover:text-rose-600 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20 shadow-sm group-hover:bg-blue-500 group-hover:text-white transition duration-200 shrink-0">
                        <Activity className="w-3.5 h-3.5" />
                      </span>
                      <span>UK Coupon Finals</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition" />
                  </div>
                  <div 
                    onClick={() => triggerToast('Loading bet365 Core draft tables...', 'info')}
                    className="p-3 hover:bg-zinc-50 hover:text-rose-600 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition duration-200 shrink-0">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </span>
                      <span>bet365 Core Draft</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition" />
                  </div>
                  <div 
                    onClick={() => triggerToast('Opening MSport Forecast matrix wizard...', 'info')}
                    className="p-3 hover:bg-zinc-50 hover:text-rose-600 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-md bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20 shadow-sm group-hover:bg-rose-500 group-hover:text-white transition duration-200 shrink-0">
                        <Award className="w-3.5 h-3.5" />
                      </span>
                      <span>MSport Forecast Matrix</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              </div>

              {/* Customise Box (Auth Promo Card) */}
              <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 border border-zinc-200 rounded p-4 text-left shadow-sm">
                <h5 className="font-black text-xs text-zinc-900 uppercase tracking-wide">Customise FPCODES</h5>
                <p className="text-[11px] text-zinc-500 font-medium leading-relaxed mt-1.5 mb-3.5">
                  Sign in or register a private profile record in our simulator system to instantly download and copy sheet perming codes.
                </p>
                <div className="space-y-2">
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
                    Access Account
                  </button>
                </div>
              </div>

              {/* Follow Box */}
              <div className="bg-white border border-zinc-200 rounded p-4 text-left shadow-sm">
                <span className="font-black text-[10px] tracking-widest text-zinc-400 uppercase">Follow FPCODES</span>
                <div className="grid grid-cols-2 gap-2 mt-3 select-none text-[11px] font-bold text-zinc-700">
                  <span onClick={() => triggerToast('Opening Facebook Account...', 'info')} className="flex items-center gap-1.5 p-1.5 hover:bg-zinc-50 rounded cursor-pointer transition">
                    <span className="text-blue-600 text-sm">f</span> Facebook
                  </span>
                  <span onClick={() => triggerToast('Opening X Account...', 'info')} className="flex items-center gap-1.5 p-1.5 hover:bg-zinc-50 rounded cursor-pointer transition">
                    <span className="text-zinc-900 font-mono text-xs">𝕏</span> Twitter/X
                  </span>
                  <span onClick={() => triggerToast('Opening Instagram feed...', 'info')} className="flex items-center gap-1.5 p-1.5 hover:bg-zinc-50 rounded cursor-pointer transition">
                    <span className="text-pink-600 text-[10px] font-serif">IG</span> Instagram
                  </span>
                  <span onClick={() => triggerToast('Opening YouTube channel...', 'info')} className="flex items-center gap-1.5 p-1.5 hover:bg-zinc-50 rounded cursor-pointer transition">
                    <span className="text-red-600 font-black">▶</span> YouTube
                  </span>
                </div>
              </div>

              {/* Sites directory */}
              <div className="bg-white border border-zinc-200 rounded text-left p-3.5 shadow-sm text-[11px]">
                <span className="font-extrabold text-zinc-400 uppercase tracking-wider block mb-2 text-[9px]">SISTER PORTALS</span>
                <div className="space-y-1.5 font-bold text-zinc-700">
                  <div onClick={() => triggerToast('Redirecting to womens pools sub-portal mockup...', 'info')} className="flex items-center justify-between hover:text-[#fa3e65] cursor-pointer transition">
                    <span>Women's Pools Directory</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </div>
                  <div onClick={() => triggerToast('Redirecting to SEC Network...', 'info')} className="flex items-center justify-between hover:text-[#fa3e65] cursor-pointer transition">
                    <span>SEC Sports Combinations</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </div>
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
              {blogPosts[0] && (
                <div 
                  onClick={() => onReadArticle(blogPosts[0])}
                  className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  {/* High Quality Abstract Stadium Banner Representation */}
                  <div className="h-72 w-full relative bg-gradient-to-br from-indigo-900 via-neutral-900 to-emerald-900 overflow-hidden">
                    {blogPosts[0].image_url ? (
                      <img 
                        src={blogPosts[0].image_url} 
                        alt={blogPosts[0].title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
                    
                    {/* Floating verified badge */}
                    <div className="absolute top-4 left-4 bg-[#fa3e65] text-white text-[9px] font-black px-2 py-1 rounded shadow tracking-widest uppercase">
                      ★ COVER STORY
                    </div>

                    {/* Meta stamp */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wide">
                          AUSSIE SPECIAL
                        </span>
                        <span className="text-neutral-300 text-[10px] font-bold">WEEK 49 CODES INSTANT</span>
                      </div>
                      <span className="text-[10px] text-zinc-300 font-mono font-bold">12h • Mikhail de Guzman</span>
                    </div>
                  </div>

                  {/* Body textual block */}
                  <div className="p-5 space-y-2.5">
                    <h2 className="font-sans font-black text-zinc-900 text-xl md:text-2xl tracking-tight leading-tight group-hover:text-[#fa3e65] transition">
                      {blogPosts[0].title}
                    </h2>
                    <p className="text-zinc-500 font-medium text-xs leading-relaxed">
                      {blogPosts[0].summary}
                    </p>
                    <div className="pt-2 flex items-center gap-4 text-[11px] font-bold text-zinc-500">
                      <span className="flex items-center gap-1 hover:text-zinc-800">
                        <BookOpen className="w-3.5 h-3.5" /> Read Full Analysis
                      </span>
                      <span>•</span>
                      <span className="text-rose-500 font-black">{blogPosts[0].readTime}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD 2: HIGHLIGHT SECTION 1 (AUSSIE GRAPHICS CARD) */}
              {blogPosts[1] && (
                <div 
                  onClick={() => onReadArticle(blogPosts[1])}
                  className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer grid grid-cols-1 md:grid-cols-12 group"
                >
                  <div className="md:col-span-5 h-48 md:h-full relative bg-gradient-to-br from-[#0c243c] via-black to-[#fa3e65]/40 overflow-hidden">
                    {blogPosts[1].image_url ? (
                      <img 
                        src={blogPosts[1].image_url} 
                        alt={blogPosts[1].title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/30"></div>
                    <div className="absolute top-3 left-3 bg-[#111] text-white text-[9px] font-black px-2 py-0.5 rounded border border-neutral-700">
                      UK SPECIAL W49
                    </div>
                  </div>
                  <div className="md:col-span-7 p-5 flex flex-col justify-between text-left space-y-3">
                    <div className="space-y-1.5">
                      <span className="font-extrabold text-[10px] uppercase text-[#fa3e65] tracking-widest block font-mono">
                        ⚽ UK FOOTBALL POOLS DECRYPTED
                      </span>
                      <h3 className="font-black text-zinc-900 text-base leading-snug group-hover:text-[#fa3e65] transition">
                        {blogPosts[1].title}
                      </h3>
                      <p className="text-zinc-500 font-medium text-[11.5px] leading-relaxed">
                        {blogPosts[1].summary}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
                      <span>1d • Mikhail de Guzman</span>
                      <span className="text-[#fa3e65] font-black">{blogPosts[1].readTime}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD 3: SPOTLIGHT SECTION 2 (NIGERIA SPOTLIGHT CARD) */}
              {blogPosts[2] && (
                <div 
                  onClick={() => onReadArticle(blogPosts[2])}
                  className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer grid grid-cols-1 md:grid-cols-12 group"
                >
                  <div className="md:col-span-5 h-48 md:h-full relative bg-gradient-to-br from-[#024424] via-black to-slate-900 overflow-hidden">
                    {blogPosts[2].image_url ? (
                      <img 
                        src={blogPosts[2].image_url} 
                        alt={blogPosts[2].title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/30"></div>
                    <div className="absolute top-3 left-3 bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded">
                      VERIFIED REWARD
                    </div>
                  </div>
                  <div className="md:col-span-7 p-5 flex flex-col justify-between text-left space-y-3">
                    <div className="space-y-1.5">
                      <span className="font-extrabold text-[10px] uppercase text-emerald-600 tracking-widest block font-mono">
                        ⚡ WEST AFRICAN CUP TIPS
                      </span>
                      <h3 className="font-black text-zinc-900 text-base leading-snug group-hover:text-emerald-600 transition">
                        {blogPosts[2].title}
                      </h3>
                      <p className="text-zinc-500 font-medium text-[11.5px] leading-relaxed">
                        {blogPosts[2].summary}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
                      <span>11h • Miguel Alfonso Caramoan</span>
                      <span className="text-emerald-600 font-black">{blogPosts[2].readTime}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD 4: FINAL BULK OVERLAY COVER CARD */}
              {blogPosts[3] && (
                <div 
                  onClick={() => onReadArticle(blogPosts[3])}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden relative shadow-lg hover:shadow-xl transition h-72 cursor-pointer group flex flex-col justify-end"
                >
                  {/* Decorative stadium gradient underlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#fa3e65]/35 via-zinc-950 to-emerald-950/20 z-0 overflow-hidden">
                    {blogPosts[3].image_url ? (
                      <img 
                        src={blogPosts[3].image_url} 
                        alt={blogPosts[3].title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105 opacity-40"
                      />
                    ) : null}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
                  
                  <div className="p-6 relative z-20 space-y-2 text-left">
                    <span className="bg-amber-400 text-slate-950 text-[8.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider block w-fit">
                      FORECAST TRENDING
                    </span>
                    <h3 className="text-white font-black text-lg md:text-xl leading-snug group-hover:text-amber-300 transition">
                      {blogPosts[3].title}
                    </h3>
                    <p className="text-zinc-400 text-xs font-medium max-w-2xl leading-relaxed">
                      {blogPosts[3].summary}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-zinc-400 font-mono">
                      <span>14d • Miguel Alfonso Caramoan</span>
                      <span className="text-amber-400 font-black">{blogPosts[3].readTime}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* EMPTY STATE WHEN ZERO BLOGS EXISITING: WITH DETAILED SUPABASE CONNECTION DIAGNOSTICS */}
              {blogPosts.length === 0 && (
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
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
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
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
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
                              Checked {Object.keys(candidateErrors).length} Candidates
                            </span>
                          </div>
                          <div className="font-mono text-[10px] space-y-1.5 bg-zinc-950 text-emerald-400 p-3 rounded-lg max-h-48 overflow-y-auto shadow-inner leading-normal">
                            {Object.keys(candidateErrors).length > 0 ? (
                              Object.entries(candidateErrors).map(([tableName, errMsg]) => {
                                const isTableMissing = errMsg.includes('does not exist') || errMsg.includes('not found') || errMsg.includes('404') || errMsg.includes('not find');
                                return (
                                  <div key={tableName} className="border-b border-zinc-800 pb-1.5 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className={isTableMissing ? "text-zinc-600 font-black" : "text-emerald-500 font-black"}>
                                        {isTableMissing ? '×' : '✓'}
                                      </span>
                                      <span className={`font-bold text-white px-1 py-0.2 rounded font-sans text-[9px] uppercase tracking-wider ${isTableMissing ? 'bg-zinc-800' : 'bg-emerald-800'}`}>
                                        TABLE: "{tableName}"
                                      </span>
                                    </div>
                                    <p className="text-zinc-400 pl-3.5 mt-0.5">
                                      Response: <span className={isTableMissing ? "text-zinc-500 font-semibold" : "text-amber-300 font-semibold"}>
                                        {errMsg}
                                      </span>
                                    </p>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-zinc-500">
                                # No scan records found yet. Querying in progress...
                              </div>
                            )}
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
              {blogPosts.length > 4 && (
                <div className="space-y-4 pt-6 border-t border-zinc-150">
                  <h4 className="text-zinc-400 text-[10.5px] tracking-widest font-black uppercase font-mono">
                    More Published Analyses
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {blogPosts.slice(4).map((post, idx) => (
                      <div 
                        key={post.id || idx}
                        onClick={() => onReadArticle(post)}
                        className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="h-44 relative bg-gradient-to-br from-indigo-950 via-zinc-950 to-emerald-950 overflow-hidden">
                          {post.image_url ? (
                            <img 
                              src={post.image_url} 
                              alt={post.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]"></div>
                          )}
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
                            <span className="text-[#fa3e65] font-black">{post.readTime}</span>
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
                        <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                            <div className="space-y-1 shrink-0">
                              <span className="text-[8.5px] font-mono font-black text-rose-600 uppercase tracking-widest block">
                                Select Results Week
                              </span>
                              <select
                                value={selectedResultId || (filteredResults[0] && filteredResults[0].id) || ''}
                                onChange={(e) => setSelectedResultId(e.target.value)}
                                className="mt-1 bg-white border-2 border-zinc-250 text-zinc-800 text-xs font-black rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-rose-500 cursor-pointer font-sans min-w-[280px] shadow-sm uppercase tracking-wide transition-all"
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

                            <div className="hidden sm:block border-l border-zinc-200 h-10 self-end"></div>

                            <div className="text-left min-w-0 self-end sm:self-auto">
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
                            className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition shrink-0 shadow-sm self-start md:self-auto"
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
              
              {/* Partner bet365 Bookmaker Promo */}
              <div 
                onClick={() => triggerToast('Redirecting securely to bet365 Pool coupon list & codes register...', 'success')}
                className="bg-[#005a36] text-white rounded p-5 text-left border-l-4 border-[#ffdf1b] relative overflow-hidden font-sans cursor-pointer shadow-sm hover:translate-y-[-2px] transition-all"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full filter blur-md pointer-events-none"></div>
                <span className="text-[8.5px] tracking-widest text-[#ffdf1b] font-black uppercase font-mono">Sponsor Partner</span>
                <h3 className="font-sans font-black text-2xl tracking-tighter text-[#ffdf1b] mt-1">
                  bet365
                </h3>
                <h4 className="font-extrabold text-[#fff] text-xs leading-tight mt-1.5 uppercase">
                  NGR & UK MATCH CODES DECRYPTED
                </h4>
                <p className="text-[10px] text-zinc-200 mt-1 font-medium leading-normal">
                  Maximize your tie draw perms! Tap to join with validated bookie odds sequences.
                </p>
                <div className="mt-4 bg-[#ffdf1b] hover:bg-yellow-400 text-[#005a36] font-black text-[10.5px] py-1.5 px-3.5 rounded-full text-center tracking-widest uppercase transition inline-block">
                  JOIN NOW
                </div>
              </div>

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
