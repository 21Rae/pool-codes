import React, { useState } from 'react';
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
  Check
} from 'lucide-react';

interface ExpertBlogViewProps {
  blogPosts: Array<{
    id: string;
    title: string;
    summary: string;
    content: string;
    date: string;
    readTime: string;
  }>;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onReadArticle: (article: any) => void;
  onOpenPaywall: () => void;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function ExpertBlogView({
  blogPosts,
  onOpenAuth,
  onReadArticle,
  onOpenPaywall,
  triggerToast
}: ExpertBlogViewProps) {
  const [selectedEdition, setSelectedEdition] = useState('NGR VIP');
  const [searchQuery, setSearchQuery] = useState('');

  // Extracted games list representing the Top Score ticker on the screenshot
  const scoreboardGames = [
    { type: 'Aussie • FT', team1: 'MELB', score1: '2', team2: 'SYD', score2: '1', status: 'COMPLETED' },
    { type: 'UK • FT', team1: 'CHE', score1: '1', team2: 'ARS', score2: '1', status: 'COMPLETED' },
    { type: 'Aussie • FT', team1: 'BRIS', score1: '1', team2: 'ADEL', score2: '1', status: 'COMPLETED' },
    { type: 'UK • FT', team1: 'TOT', score1: '0', team2: 'MUN', score2: '2', status: 'COMPLETED' },
    { type: 'Gilas • LIVE', team1: 'NGR', score1: '84', team2: 'GHA', score2: '79', status: 'Q4 2:15' },
    { type: 'PBA • LIVE', team1: 'SMB', score1: '95', team2: 'BGSM', score2: '93', status: 'Q4 0:42' },
  ];

  return (
    <div className="bg-[#f3f4f6] text-[#1c1c1e] min-h-screen font-sans flex flex-col antialiased">
      
      {/* 1. TOP SCOREBOARD STRIP (PREMIUM STYLE) */}
      <div className="bg-[#1c1c1e] border-b border-[#2c2c2e] text-[11px] h-11 flex items-center overflow-x-auto whitespace-nowrap pl-4 pr-4 select-none scrollbar-hide shrink-0 text-white shadow-inner">
        <div 
          onClick={() => triggerToast('Opening full Match Dashboard...', 'info')}
          className="flex items-center gap-2 pr-4 border-r border-[#2c2c2e] hover:bg-neutral-800 transition cursor-pointer h-full px-2 font-black text-rose-500 uppercase tracking-widest text-[9.5px]"
        >
          <span>FPCODES CODES TICKER</span>
          <ChevronDown className="w-3 h-3 text-neutral-400" />
        </div>

        <div className="flex items-center gap-1.5 h-full">
          {scoreboardGames.map((game, idx) => (
            <div 
              key={idx}
              onClick={() => triggerToast(`Match details: ${game.team1} vs ${game.team2}`, 'info')}
              className="flex items-center border-r border-[#2c2c2e] pr-4 pl-3 hover:bg-neutral-800/60 transition cursor-pointer h-full gap-4 text-left"
            >
              <div className="flex flex-col justify-center">
                <span className={`text-[8.5px] font-black tracking-wider ${game.type.includes('LIVE') ? 'text-amber-400' : 'text-neutral-400'}`}>
                  {game.type}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-extrabold text-neutral-200">{game.team1}</span> 
                  <span className="text-zinc-400 font-bold text-[10px]">{game.score1}</span>
                  <span className="text-zinc-500 text-[9px] font-mono">-</span>
                  <span className="font-extrabold text-neutral-200">{game.team2}</span> 
                  <span className="text-zinc-400 font-bold text-[10px]">{game.score2}</span>
                </div>
              </div>
              {game.type.includes('LIVE') && (
                <span className="bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse">
                  {game.status}
                </span>
              )}
            </div>
          ))}
        </div>

        <div 
          onClick={() => triggerToast('Loading all registered bookmaker live indicators...', 'success')}
          className="ml-auto font-black text-rose-400 text-[10px] hover:text-rose-300 transition cursor-pointer uppercase tracking-wider pl-4"
        >
          ALL SCORES & STANDINGS »
        </div>
      </div>

      {/* 2. MAIN NAVIGATION STRIP (BAR 1 - BRAND FOCUS) */}
      <div className="bg-[#1a1a1c] border-b border-zinc-900 text-white shrink-0 select-none">
        <div className="max-w-[1360px] mx-auto px-4 flex items-center justify-between h-14">
          
          {/* Logo Brand with red banner backing */}
          <div className="flex items-center">
            <div 
              onClick={() => triggerToast('FASTPOOLCODES Official Blog Portal', 'info')}
              className="bg-[#fa3e65] text-white font-black px-4 py-2 text-xl tracking-tighter italic mr-6 skew-x-[-12deg] inline-block shadow-md select-none cursor-pointer hover:bg-[#ff4e75] transition"
            >
              <span className="tracking-tight block select-none">FPCODES</span>
            </div>

            {/* Menu Items */}
            <nav className="hidden lg:flex items-center gap-5 text-xs font-black uppercase tracking-wider text-neutral-300">
              <span onClick={() => triggerToast('Loading Football Pools Home...', 'info')} className="hover:text-white transition cursor-pointer text-white border-b-2 border-rose-500 pb-4 pt-4 block">Football Pools</span>
              <span onClick={() => { triggerToast('Showing Aussie Keys directory...', 'info'); }} className="hover:text-white transition cursor-pointer pb-4 pt-4 block">Aussie Keys</span>
              <span onClick={() => { triggerToast('Showing UK Draw matrix...', 'info'); }} className="hover:text-white transition cursor-pointer pb-4 pt-4 block">UK Coupon Matrix</span>
              <span onClick={() => { triggerToast('Opening bet365 matching files...', 'info'); }} className="hover:text-[#fa3e65] transition cursor-pointer pb-4 pt-4 block text-[#fa3e65]/90 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#fa3e65] animate-pulse" /> bet365 Special
              </span>
              <span onClick={() => { triggerToast('Showing MSport Indicator streams...', 'info'); }} className="hover:text-white transition cursor-pointer pb-4 pt-4 block">MSport Indicators</span>
              <span onClick={() => { triggerToast('Showing BetKing verified codes...', 'info'); }} className="hover:text-white transition cursor-pointer pb-4 pt-4 block">BetKing Pointers</span>
              <span onClick={() => triggerToast('Opening premium analysis archives...', 'info')} className="hover:text-white transition cursor-pointer flex items-center gap-1 pb-4 pt-4 block">
                More <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </span>
            </nav>
          </div>

          {/* Right side utilities */}
          <div className="flex items-center gap-4 text-xs font-bold text-neutral-300">
            <span onClick={() => triggerToast('Opening live audio stream...', 'info')} className="hover:text-white cursor-pointer transition flex items-center gap-1.5 bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded border border-zinc-700/30">
              <Volume2 className="w-3.5 h-3.5 text-[#fa3e65]" />
              <span>Listen Live</span>
            </span>
            <span onClick={() => triggerToast('Loading FastPoolCodes Fantasy coupon contest...', 'success')} className="hover:text-white cursor-pointer transition flex items-center gap-1.5 bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded border border-zinc-700/30">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Fantasy League</span>
            </span>
            <span onClick={onOpenPaywall} className="hover:text-amber-400 text-amber-300 cursor-pointer transition flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/35 px-2.5 py-1 rounded-full shadow-sm animate-pulse">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>VIP Premium Pass</span>
            </span>
          </div>

        </div>
      </div>

      {/* 3. SUB-CATEGORY NAVIGATION STRIP (BAR 2) */}
      <div className="bg-white border-b border-zinc-200 shadow-sm text-zinc-900 shrink-0 select-none">
        <div className="max-w-[1360px] mx-auto px-4 flex items-center justify-between h-10 text-xs">
          <div className="flex items-center gap-4 font-bold">
            <span className="font-extrabold uppercase text-[#1c1c1e] flex items-center gap-2">
              <span className="bg-rose-500 text-white p-1 rounded-md flex items-center justify-center shadow-sm">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
              Football Pools Forecasts
            </span>
            <span className="text-zinc-300">|</span>
            <span className="text-rose-600 border-b-2 border-rose-600 font-extrabold h-10 flex items-center px-1">Blog Home</span>
            <span onClick={() => triggerToast('Opening weekly schedule sheet...', 'info')} className="hover:text-[#fa3e65] cursor-pointer transition text-zinc-600 font-medium leading-none">Weekly Sheets</span>
            <span onClick={() => triggerToast('Opening Aussie perming matrices...', 'info')} className="hover:text-[#fa3e65] cursor-pointer transition text-zinc-600 font-medium leading-none">Aussie Decrypters</span>
            <span onClick={() => triggerToast('Opening UK code archives...', 'info')} className="hover:text-[#fa3e65] cursor-pointer transition text-zinc-600 font-medium leading-none">UK Matrices</span>
            <span onClick={onOpenPaywall} className="hover:text-[#fa3e65] cursor-pointer transition text-[#fa3e65] font-black leading-none flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#fa3e65] animate-pulse" /> Join VIP Pass
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-zinc-500 font-medium">Edition:</span>
            <select 
              value={selectedEdition} 
              onChange={(e) => {
                setSelectedEdition(e.target.value);
                triggerToast(`Switched view edition to ${e.target.value}`, 'success');
              }}
              className="bg-zinc-100 hover:bg-zinc-200 font-bold border-none rounded py-1 px-2.5 text-[11px] text-zinc-800 outline-none cursor-pointer"
            >
              <option value="NGR VIP">NGR - Lagos Hub</option>
              <option value="UK PREMIUM">UK - London Direct</option>
              <option value="GHA STANDARD">GHA - Accra Free</option>
              <option value="GLOBAL PRESET">Global Decrypt</option>
            </select>
          </div>
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
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
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
                  <div className="absolute inset-0 bg-gradient-to-br from-[#fa3e65]/35 via-zinc-950 to-emerald-950/20 z-0"></div>
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
                  <span>•</span>
                  <span onClick={() => triggerToast('Opening Terms of Service...', 'info')} className="hover:underline cursor-pointer">Terms of Use</span>
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

      {/* 5. AUTHENTIC LIGHT THEME FOOTER REPLICATION */}
      <footer className="bg-white border-t border-zinc-200 text-zinc-500 py-12 px-6 select-none font-sans mt-auto">
        <div className="max-w-[1360px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start text-left text-xs">
          
          <div className="md:col-span-5 space-y-3.5">
            <div 
              onClick={() => triggerToast('FASTPOOLCODES Marketplace & Editorial Desk', 'info')}
              className="bg-[#fa3e65] text-white font-black px-3 py-1 text-sm tracking-tighter italic skew-x-[-10deg] inline-block cursor-pointer select-none"
            >
              FPCODES BRAND
            </div>
            <p className="leading-relaxed text-zinc-500 font-medium max-w-sm">
              The world's highest-fidelity online pool codes portal, delivering verified Aussie weekly coupon checklists, UK draw matrix, and bet365 matches forecasts instantly.
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-extrabold text-zinc-800 tracking-widest uppercase mb-3.5 text-[10.5px]">
              QUICK SECTIONS
            </h4>
            <div className="space-y-2 text-zinc-600 font-bold select-none">
              <div onClick={() => triggerToast('Loading UK weekly coupon sheets...', 'info')} className="hover:text-[#fa3e65] cursor-pointer transition">UK weekly codes</div>
              <div onClick={() => triggerToast('Loading Aussie coupon sheets...', 'info')} className="hover:text-[#fa3e65] cursor-pointer transition">Aussie perming codes</div>
              <div onClick={() => triggerToast('Loading bet365 files...', 'info')} className="hover:text-[#fa3e65] cursor-pointer transition">bet365 matcher feed</div>
              <div onClick={() => triggerToast('Opening customer service knowledgebase...', 'info')} className="hover:text-[#fa3e65] cursor-pointer transition">Help Center</div>
            </div>
          </div>

          <div className="md:col-span-4">
            <h4 className="font-extrabold text-zinc-800 tracking-widest uppercase mb-3.5 text-[10.5px]">
              SUPPORT CHAT
            </h4>
            <div className="space-y-2 font-bold text-zinc-600">
              <a href="mailto:info@fastpoolcodes.com" className="hover:text-[#fa3e65] transition block">
                info@fastpoolcodes.com
              </a>
              <p className="text-zinc-400 font-medium select-none">
                VIP live support active 24/7 during football pool week sessions (Tuesday to Monday).
              </p>
            </div>
          </div>

        </div>

        <div className="max-w-[1360px] mx-auto mt-10 pt-6 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center text-[10.5px] font-medium text-zinc-400 gap-4">
          <span>© 1995-2026 FastPoolCodes Inc. All Rights Reserved. Built for serious pool combinations.</span>
          <div className="flex gap-4">
            <span onClick={() => triggerToast('Opening Privacy Policy contract...', 'info')} className="hover:text-zinc-700 cursor-pointer transition">Privacy Policy</span>
            <span>•</span>
            <span onClick={() => triggerToast('Opening Terms of Service...', 'info')} className="hover:text-zinc-700 cursor-pointer transition">Terms of Use</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
