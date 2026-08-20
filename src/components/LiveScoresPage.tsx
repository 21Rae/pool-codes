import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Activity,
  Check,
  Tv,
  ArrowLeft,
  RefreshCw,
  Trash2,
  Play,
  CheckCircle,
  AlertTriangle,
  Flame,
  Plus,
  ShieldAlert,
  Terminal,
  Clock,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabaseClient } from '../lib/supabase';
import GoogleAdBanner from './GoogleAdBanner';
import LiveScoresComments from './LiveScoresComments';

interface LiveScoresPageProps {
  currentUser: any;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onBack: () => void;
  isInsidePortal?: boolean;
}

export default function LiveScoresPage({
  currentUser,
  triggerToast,
  onBack,
  isInsidePortal = false
}: LiveScoresPageProps) {
  const [liveScoresData, setLiveScoresData] = useState<any[]>([]);
  const [liveLogData, setLiveLogData] = useState<string[]>([]);
  const [isCheckingLive, setIsCheckingLive] = useState(false);
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [newMatchStatus, setNewMatchStatus] = useState("not_started");
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);
  const [isRefreshingLiveScores, setIsRefreshingLiveScores] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'finished'>('all');

  const isAdmin = currentUser?.role === 'admin';

  const fetchLiveScores = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/livescores");
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const json = await response.json();
      if (json.success) {
        setLiveScoresData(json.matches || []);
        setLiveLogData(json.logs || []);
        setIsCheckingLive(json.isChecking || false);
        setIsAgentActive(json.agentActive || false);
      }
    } catch (err) {
      console.warn("Graceful notice: Live scores not yet loaded in stand-alone page (standard behavior).");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopAgent = async () => {
    try {
      const res = await fetch("/api/livescores/agent/stop", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setIsAgentActive(false);
        triggerToast("LiveScore AI Agent has been stopped 🛑", "info");
        fetchLiveScores();
      }
    } catch (err: any) {
      triggerToast(err?.message || "Failed to stop agent", "error");
    }
  };

  const handleStartAgent = async () => {
    try {
      const res = await fetch("/api/livescores/agent/start", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setIsAgentActive(true);
        triggerToast("LiveScore AI Agent has been started ▶️", "success");
        fetchLiveScores();
      }
    } catch (err: any) {
      triggerToast(err?.message || "Failed to start agent", "error");
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const container = document.getElementById('standalone-live-scores-arena')?.parentElement;
    if (container) {
      container.scrollTo({ top: 0, behavior: 'instant' });
    }
    fetchLiveScores();

    // Event-driven WebSocket push notifications (zero continuous CPU polling)
    const supabase = getSupabaseClient();
    let channel: any = null;
    if (supabase) {
      try {
        channel = supabase
          .channel('realtime-livescores')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'livescores' },
            () => { fetchLiveScores(); }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'live_scores' },
            () => { fetchLiveScores(); }
          )
          .subscribe();
      } catch (_) {}
    }

    return () => {
      if (supabase && channel) {
        try { supabase.removeChannel(channel); } catch (_) {}
      }
    };
  }, []);

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
        fetchLiveScores();
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
        fetchLiveScores();
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
        fetchLiveScores();
      } else {
        triggerToast(data.error || "Failed to update match.", "error");
      }
    } catch (err: any) {
      triggerToast(err?.message || "Error updating match status.", "error");
    }
  };

  const handleForceUpdateScores = async () => {
    setIsRefreshingLiveScores(true);
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

  // Filter matches based on selected tab
  const filteredMatches = liveScoresData.filter(match => {
    if (activeTab === 'live') return match.status === 'live';
    if (activeTab === 'finished') return match.status === 'finished';
    return true; // 'all'
  });

  return (
    <div className="w-full bg-[#030d0a] text-emerald-100 py-6 px-4 md:px-8 flex flex-col font-sans select-none flex-1" id="standalone-live-scores-arena">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
        
        {/* Navigation back and title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-950 pb-6">
          <div className="flex items-center gap-4 text-left">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-mono font-black text-emerald-400 tracking-wider">
                  ⚽️Real-time livescores
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-wide mt-1">
                Pool matches livescore
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => {
                fetchLiveScores();
                triggerToast("Fetching latest live scores from database...", "info");
              }}
              disabled={isLoading}
              className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 hover:border-emerald-400 px-4 py-3 rounded-xl transition duration-150 cursor-pointer active:scale-95 shadow-md"
              title="Fetch latest scores from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Fetching...' : 'Fetch Latest Records'}</span>
            </button>

            <button
              onClick={onBack}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/20 hover:border-emerald-500/40 px-5 py-3 rounded-xl transition duration-150 cursor-pointer group active:scale-95 text-center font-mono"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>{isInsidePortal ? 'Return to Portal' : 'Return to Home'}</span>
            </button>
          </div>
        </div>

        {/* Google AdSense Banner */}
        <GoogleAdBanner className="bg-emerald-950/20 border border-emerald-900/30 p-2 rounded-2xl" />

        {/* ADMIN CONTROL SECTION */}
        {isAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-[#0a1512] border border-emerald-500/20 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col gap-4 text-left"
          >
            <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-mono font-black uppercase text-amber-400 tracking-widest">
                  ADMIN CORE MATCH ENGINE CONTROLLER
                </h3>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAddMatch} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-emerald-950/15 p-4 rounded-xl border border-emerald-900/35">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-mono font-bold text-emerald-400/80 uppercase tracking-wider">
                  Home Team
                </label>
                <input
                  type="text"
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  placeholder="e.g. Manchester City"
                  className="bg-slate-950 border border-emerald-950 focus:border-emerald-500 outline-none rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-mono font-bold text-emerald-400/80 uppercase tracking-wider">
                  Away Team
                </label>
                <input
                  type="text"
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  placeholder="e.g. Chelsea"
                  className="bg-slate-950 border border-emerald-950 focus:border-emerald-500 outline-none rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-mono font-bold text-emerald-400/80 uppercase tracking-wider">
                  Scores
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={homeScore}
                    onChange={(e) => setHomeScore(Number(e.target.value) || 0)}
                    className="bg-slate-950 border border-emerald-950 focus:border-emerald-500 outline-none rounded-lg px-2 py-2 text-xs text-white w-1/2 text-center"
                    placeholder="Home"
                  />
                  <span className="text-slate-500 font-bold font-mono">-</span>
                  <input
                    type="number"
                    min="0"
                    value={awayScore}
                    onChange={(e) => setAwayScore(Number(e.target.value) || 0)}
                    className="bg-slate-950 border border-emerald-950 focus:border-emerald-500 outline-none rounded-lg px-2 py-2 text-xs text-white w-1/2 text-center"
                    placeholder="Away"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-mono font-bold text-emerald-400/80 uppercase tracking-wider">
                  Initial Status
                </label>
                <div className="flex gap-2">
                  <select
                    value={newMatchStatus}
                    onChange={(e) => setNewMatchStatus(e.target.value)}
                    className="bg-slate-950 border border-emerald-950 focus:border-emerald-500 outline-none rounded-lg px-3 py-2 text-xs text-white flex-1"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="live">Live Now</option>
                    <option value="finished">Finished</option>
                    <option value="postponed">Postponed</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isSubmittingMatch}
                    className="bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950 text-xs font-black uppercase px-4 py-2 rounded-lg transition font-mono cursor-pointer disabled:bg-slate-800 shadow"
                  >
                    ADD
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* MAIN BODY SCOREBOARD PANEL */}
        <div className="w-full bg-[#051310]/60 border border-emerald-950/60 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col gap-6 text-left">
          
          {/* Tabs Filter and Active State indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/40 pb-4">
            <div className="flex gap-2 bg-slate-950/80 p-1 rounded-xl border border-emerald-950/40 max-w-sm">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition ${
                  activeTab === 'all' 
                    ? 'bg-emerald-500 text-slate-950 font-black shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ALL FIXTURES
              </button>
              <button
                onClick={() => setActiveTab('live')}
                className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition flex items-center gap-1.5 ${
                  activeTab === 'live' 
                    ? 'bg-[#FA3E65] text-white font-black shadow' 
                    : 'text-slate-400 hover:text-[#FA3E65]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                LIVE
              </button>
              <button
                onClick={() => setActiveTab('finished')}
                className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition ${
                  activeTab === 'finished' 
                    ? 'bg-emerald-950 text-emerald-400 font-black shadow border border-emerald-900/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                FINISHED
              </button>
            </div>

            <div className="flex items-center gap-3">
              {isCheckingLive && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  <span>AI Grounding Deep Search Active...</span>
                </div>
              )}
              <span className="text-[10px] text-slate-400 font-mono">
                Showing {filteredMatches.length} of {liveScoresData.length} games
              </span>
            </div>
          </div>

          {/* SCORE LISTING */}
          {filteredMatches.length === 0 ? (
            <div className="py-16 text-center rounded-xl border border-dashed border-emerald-950/60 bg-emerald-950/5">
              <Tv className="w-12 h-12 text-emerald-900/60 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-300">No matches found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                {activeTab === 'live' 
                  ? 'There are currently no matches playing live. Keep checking back during weekends!' 
                  : activeTab === 'finished' 
                    ? 'No tracked matches have finished yet.'
                    : 'No matches are currently loaded in the database.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMatches.map((match, idx) => {
                const isLiveStatus = match.status === 'live';
                const isFinished = match.status === 'finished';
                const isPostponed = match.status === 'postponed';

                const scoreParts = (match.score || "0 - 0").split(" - ");
                const scoreHome = scoreParts[0]?.trim() || "0";
                const scoreAway = scoreParts[1]?.trim() || "0";

                const fixtureParts = (match.fixture || "").split(" vs ");
                const teamHome = fixtureParts[0]?.trim() || "Home Team";
                const teamAway = fixtureParts[1]?.trim() || "Away Team";

                return (
                  <div
                    key={`live_match_${idx}_${match.id || ''}`}
                    className={`relative overflow-hidden rounded-2xl border p-4 transition duration-200 flex flex-col justify-between min-h-[140px] ${
                      isLiveStatus
                        ? 'bg-gradient-to-br from-[#FA3E65]/10 via-slate-950 to-slate-950 border-[#FA3E65]/35 shadow-lg shadow-red-950/20'
                        : isFinished
                          ? 'bg-slate-950/40 border-emerald-950/50 hover:border-emerald-900/30'
                          : 'bg-slate-950/25 border-emerald-950/20 hover:border-emerald-900/20'
                    }`}
                  >
                      {/* Top ribbon: Status Indicator */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {isLiveStatus ? 'Live Stream Active' : isFinished ? 'Full Time' : isPostponed ? 'Postponed' : 'Upcoming Fixture'}
                        </span>

                        {isLiveStatus ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-widest bg-emerald-950/70 text-emerald-400 border border-emerald-900/40 shadow-sm">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
                            <span>LIVE NOW</span>
                          </span>
                        ) : isFinished ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-widest bg-emerald-900/20 text-emerald-400 border border-emerald-900/30">
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                            <span>FINISHED</span>
                          </span>
                        ) : isPostponed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-widest bg-amber-950/60 text-amber-500 border border-amber-900/30">
                            <span>PPD</span>
                          </span>
                        ) : null}
                      </div>

                      {/* Middle: Teams and Scoreboard */}
                      <div className="flex items-center justify-between gap-4 my-2">
                        <div className="flex-1 flex flex-col gap-1 text-left min-w-0">
                          <span className="text-sm font-extrabold text-white truncate leading-tight font-sans">
                            {teamHome}
                          </span>
                          <span className="text-sm font-extrabold text-white truncate leading-tight font-sans">
                            {teamAway}
                          </span>
                        </div>

                        {/* Scores */}
                        <div className="flex items-center gap-1 font-mono font-black text-xl shrink-0">
                          <span className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                            isLiveStatus 
                              ? 'bg-[#FA3E65]/15 text-[#FA3E65] border-[#FA3E65]/40 animate-pulse' 
                              : 'bg-slate-950 text-amber-300 border-emerald-950/60'
                          }`}>
                            {scoreHome}
                          </span>
                          <span className="text-slate-600 px-0.5 font-sans font-bold">-</span>
                          <span className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                            isLiveStatus 
                              ? 'bg-[#FA3E65]/15 text-[#FA3E65] border-[#FA3E65]/40 animate-pulse' 
                              : 'bg-slate-950 text-amber-300 border-emerald-950/60'
                          }`}>
                            {scoreAway}
                          </span>
                        </div>
                      </div>

                      {/* Bottom ribbon: Admin actions when logged in as admin */}
                      {isAdmin && (
                        <div className="mt-3 pt-2.5 border-t border-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
                          <div className="flex items-center gap-1">
                            <span className="text-xs">⚽</span>
                            <span className="font-semibold text-[10.5px] text-slate-350">Pool League Match</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {!isLiveStatus && !isFinished && (
                              <button
                                onClick={() => handleUpdateMatchStatus(match.id, 'live', '0 - 0')}
                                className="text-[9px] font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 cursor-pointer transition"
                              >
                                Start
                              </button>
                            )}
                            {isLiveStatus && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    const nextHome = Number(scoreHome) + 1;
                                    handleUpdateMatchStatus(match.id, 'live', `${nextHome} - ${scoreAway}`);
                                  }}
                                  className="text-[9px] font-bold bg-slate-950 hover:bg-slate-900 text-amber-300 px-1.5 py-1 rounded border border-emerald-900/30 cursor-pointer transition"
                                  title="Add Home Goal"
                                >
                                  H+1
                                </button>
                                <button
                                  onClick={() => {
                                    const nextAway = Number(scoreAway) + 1;
                                    handleUpdateMatchStatus(match.id, 'live', `${scoreHome} - ${nextAway}`);
                                  }}
                                  className="text-[9px] font-bold bg-slate-950 hover:bg-slate-900 text-amber-300 px-1.5 py-1 rounded border border-emerald-900/30 cursor-pointer transition"
                                  title="Add Away Goal"
                                >
                                  A+1
                                </button>
                                <button
                                  onClick={() => handleUpdateMatchStatus(match.id, 'finished')}
                                  className="text-[9px] font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-2 py-1 rounded cursor-pointer transition"
                                >
                                  Finish
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => handleDeleteMatch(match.id)}
                              className="text-[9px] font-bold bg-red-950/40 hover:bg-red-900/40 text-red-400 p-1 rounded border border-red-500/20 cursor-pointer transition"
                              title="Delete tracker"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Live Match Comments & Fan Discussions */}
        <LiveScoresComments
          currentUser={currentUser}
          triggerToast={triggerToast}
        />

        {/* Informative Tip Box */}
        <div className="w-full p-4 bg-emerald-950/10 border border-emerald-950 rounded-2xl flex items-start gap-3 text-left">
          <span className="text-lg">📢</span>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-emerald-400">Public Live Score Casting System</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This matchcast runs independently of logged-in sessions. Bookmark this page to get automatic, zero-delay real-time results updates of premium pool weekend fixtures without needing any registration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
