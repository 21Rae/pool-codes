import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  RefreshCw,
  Table as TableIcon,
  Star,
  Info,
  Layers,
  ChevronDown,
  Calendar,
  Sparkles
} from 'lucide-react';

export interface ParsedPoolPick {
  pool_no: number;
  bet_code: string;
  home: string;
  away: string;
  home_win: number | string;
  draw_x: number | string;
  away_win: number | string;
  bet: string;
  status: string;
  kick_off: string;
  week?: number | string;
  is_banker?: boolean;
  notes?: string;
  league?: string;
}

interface PoolPicksCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (picks: any[], bookmaker: string, table: string) => void;
  triggerToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  initialBookmaker?: string;
  initialTable?: string;
  initialWeek?: number | string;
}

export default function PoolPicksCsvModal({
  isOpen,
  onClose,
  onUploadSuccess,
  triggerToast,
  initialBookmaker = 'bet9ja',
  initialTable,
  initialWeek = 7
}: PoolPicksCsvModalProps) {
  const [selectedBookmaker, setSelectedBookmaker] = useState<string>(initialBookmaker);
  const [activeWeek, setActiveWeek] = useState<number>(Number(initialWeek) || 7);
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedPicks, setParsedPicks] = useState<ParsedPoolPick[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replaceAll, setReplaceAll] = useState(true);
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'paste'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive target table name based on bookmaker
  const getResolvedTableName = (bm: string) => {
    if (initialTable && initialTable.includes(bm)) return initialTable;
    if (bm === 'bet9ja') return 'weekly pool picks(Bet9ja)';
    if (bm === 'betking') return 'weekly pool picks(betking)';
    return 'weekly pool picks';
  };

  // Helper to parse CSV string into structured pool pick rows
  const parseCsvContent = (content: string) => {
    setParseError(null);
    try {
      const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        setParseError('The CSV file must contain at least a header row and one fixture row.');
        setParsedPicks([]);
        return;
      }

      // Determine delimiter (comma, tab, or semicolon)
      const firstLine = lines[0];
      let delimiter = ',';
      if (firstLine.includes('\t')) delimiter = '\t';
      else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

      // Parse headers
      const rawHeaders = firstLine.split(delimiter).map((h) =>
        h.replace(/^["']|["']$/g, '').trim().toLowerCase()
      );

      // Flexible column matcher
      const findIndex = (patterns: string[]) => {
        return rawHeaders.findIndex((h) =>
          patterns.some(
            (p) =>
              h === p ||
              h.includes(p) ||
              h.replace(/[^a-z0-9]/g, '') === p.replace(/[^a-z0-9]/g, '')
          )
        );
      };

      const poolIdx = findIndex(['pool_no', 'pool', 'pool_number', 'poolno', 'match_no', 'sn', 's/n', 's_n', 'item_no']);
      const codeIdx = findIndex(['bet_code', 'betcode', 'bet code', 'booking_code', 'code', 'ticket_code']);
      const homeIdx = findIndex(['home', 'home_team', 'home team', 'hometeam', 'team1', 'team_1']);
      const awayIdx = findIndex(['away', 'away_team', 'away team', 'awayteam', 'team2', 'team_2']);
      const homeWinIdx = findIndex(['home_win', 'homewin', 'home win', 'home_odds', '1', 'odd_1', 'odds_1']);
      const drawIdx = findIndex(['draw_x', 'draw', 'draw (x)', 'draw(x)', 'draw_odds', 'x', 'odd_x', 'odds_x']);
      const awayWinIdx = findIndex(['away_win', 'awaywin', 'away win', 'away_odds', '2', 'odd_2', 'odds_2']);
      const betIdx = findIndex(['bet', 'tip', 'prediction', 'pick', 'recommendation']);
      const statusIdx = findIndex(['status', 'day', 'match_status', 'match_day']);
      const kickOffIdx = findIndex(['kick_off', 'kick off', 'kickoff', 'time', 'match_time', 'kick_off (w.a.t)']);
      const weekIdx = findIndex(['week', 'week_no', 'week_number', 'wk']);
      const bankerIdx = findIndex(['is_banker', 'banker', 'nap', 'star', 'isbanker']);
      const notesIdx = findIndex(['notes', 'note', 'analysis', 'comment', 'description']);
      const leagueIdx = findIndex(['league', 'competition', 'division']);

      if (homeIdx === -1 || awayIdx === -1) {
        setParseError("Could not identify Home Team or Away Team columns. Expected headers like 'home' and 'away'.");
        setParsedPicks([]);
        return;
      }

      const picksList: ParsedPoolPick[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        // CSV token parser respecting double quotes
        const tokens: string[] = [];
        let current = '';
        let insideQuotes = false;
        for (let c = 0; c < line.length; c++) {
          const char = line[c];
          if (char === '"' || char === "'") {
            insideQuotes = !insideQuotes;
          } else if (char === delimiter && !insideQuotes) {
            tokens.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        tokens.push(current.trim());

        const cleanToken = (idx: number) => {
          if (idx === -1 || idx >= tokens.length) return '';
          return tokens[idx].replace(/^["']|["']$/g, '').trim();
        };

        const homeTeam = cleanToken(homeIdx);
        const awayTeam = cleanToken(awayIdx);

        if (!homeTeam || !awayTeam) continue;

        // Resolve pool number
        let poolNo = i;
        const rawPool = cleanToken(poolIdx);
        if (rawPool && !isNaN(Number(rawPool))) {
          poolNo = Number(rawPool);
        }

        // Odds resolution with sane fallbacks
        const rawHomeWin = cleanToken(homeWinIdx);
        const rawDraw = cleanToken(drawIdx);
        const rawAwayWin = cleanToken(awayWinIdx);

        const homeWin = !isNaN(Number(rawHomeWin)) && Number(rawHomeWin) > 0 ? Number(rawHomeWin).toFixed(2) : '2.50';
        const drawOdds = !isNaN(Number(rawDraw)) && Number(rawDraw) > 0 ? Number(rawDraw).toFixed(2) : '3.20';
        const awayWin = !isNaN(Number(rawAwayWin)) && Number(rawAwayWin) > 0 ? Number(rawAwayWin).toFixed(2) : '2.80';

        // Banker check
        const rawBanker = cleanToken(bankerIdx).toLowerCase();
        const isBanker =
          rawBanker === 'true' ||
          rawBanker === '1' ||
          rawBanker === 'yes' ||
          rawBanker === 'banker' ||
          rawBanker === 'nap';

        // Week number
        const rawWk = cleanToken(weekIdx);
        const pickWeek = rawWk && !isNaN(Number(rawWk)) ? Number(rawWk) : activeWeek;

        // Bet Code default prefix if missing
        let betCode = cleanToken(codeIdx);
        if (!betCode) {
          const prefix = selectedBookmaker === 'bet9ja' ? '9JA-' : selectedBookmaker === 'betking' ? 'BK-' : '';
          betCode = `${prefix}${1000 + poolNo * 35}`;
        }

        picksList.push({
          pool_no: poolNo,
          bet_code: betCode,
          home: homeTeam,
          away: awayTeam,
          home_win: homeWin,
          draw_x: drawOdds,
          away_win: awayWin,
          bet: cleanToken(betIdx) || 'X',
          status: cleanToken(statusIdx) || 'Saturday',
          kick_off: cleanToken(kickOffIdx) || '3:00 PM',
          week: pickWeek,
          is_banker: isBanker,
          notes: cleanToken(notesIdx) || '',
          league: cleanToken(leagueIdx) || 'Official Pool League'
        });
      }

      if (picksList.length === 0) {
        setParseError('No valid fixture rows could be extracted from the CSV file.');
      } else {
        // Sort ascending by pool_no
        picksList.sort((a, b) => a.pool_no - b.pool_no);
        setParsedPicks(picksList);
      }
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse CSV file content.');
      setParsedPicks([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      parseCsvContent(content);
    };
    reader.onerror = () => {
      setParseError('Unable to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCsvText(text);
    if (text.trim().length > 0) {
      parseCsvContent(text);
    } else {
      setParsedPicks([]);
      setParseError(null);
    }
  };

  // Sample CSV generator for admin reference and download
  const handleDownloadSampleCsv = () => {
    const isBetking = selectedBookmaker === 'betking';
    const sampleHeaders = 'pool,bet_code,home,away,home_win,draw_x,away_win,bet,status,kick_off,is_banker,week_no,bookmaker';
    const sampleRows = [
      `1,${isBetking ? 'BK-1592' : '1592'},Brentford,Liverpool,2.48,3.7,2.7,X,Saturday,3:00 PM,FALSE,16,${selectedBookmaker}`,
      `7,${isBetking ? 'BK-2175' : '2175'},Derby,Stoke City,2.5,3.15,2.9,X,Saturday,3:00 PM,FALSE,16,${selectedBookmaker}`,
      `22,${isBetking ? 'BK-2273' : '2273'},Accrington,Gillingham,2.35,3.4,2.8,X,Saturday,3:00 PM,FALSE,16,${selectedBookmaker}`,
      `23,${isBetking ? 'BK-2341' : '2341'},Colchester,Exeter City,2.05,3.35,3.4,X,Saturday,3:00 PM,FALSE,16,${selectedBookmaker}`,
      `30,${isBetking ? 'BK-2355' : '2355'},Swindon Town,Walsall,2.65,3.35,2.46,X,Saturday,3:00 PM,FALSE,16,${selectedBookmaker}`,
      `34,${isBetking ? 'BK-2678' : '2678'},Kilmarnock,Motherwell,3.3,3.7,2.06,X,Saturday,3:00 PM,FALSE,16,${selectedBookmaker}`,
      `38,${isBetking ? 'BK-2760' : '2760'},Morton,Queen's Park,2.66,3.15,2.67,X,Saturday,3:00 PM,FALSE,16,${selectedBookmaker}`,
      `41,${isBetking ? 'BK-2764' : '2764'},East Fife,Alloa Athletic,2.45,3.1,2.86,X,Saturday,3:00 PM,TRUE,16,${selectedBookmaker}`
    ];

    const blob = new Blob([[sampleHeaders, ...sampleRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FastPoolCodes_${selectedBookmaker.toUpperCase()}_Week_${activeWeek}_Template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast?.(`Downloaded sample CSV template for ${selectedBookmaker}!`, 'success');
  };

  // Submit CSV payload to backend API
  const handleUploadSubmit = async () => {
    if (parsedPicks.length === 0) {
      triggerToast?.('Please upload or paste valid CSV fixture rows first.', 'error');
      return;
    }

    setIsSubmitting(true);
    const targetTable = getResolvedTableName(selectedBookmaker);

    try {
      const response = await fetch('/api/pool-picks/upload-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          picks: parsedPicks,
          targetTable,
          bookmaker: selectedBookmaker,
          week: activeWeek,
          replaceAll
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to import CSV fixtures into the pool picks database.');
      }

      // Update local storage for seamless immediate feedback
      const storageKey =
        selectedBookmaker === 'bet9ja'
          ? 'fastpool_weekly_picks_bet9ja'
          : selectedBookmaker === 'betking'
          ? 'fastpool_weekly_picks_betking'
          : 'fastpool_weekly_picks_general';

      try {
        localStorage.setItem(storageKey, JSON.stringify(data.picks || parsedPicks));
        // Broadcast custom window event for instant table refresh across tabs
        window.dispatchEvent(
          new CustomEvent('fastpool_pool_picks_updated', {
            detail: {
              bookmaker: selectedBookmaker,
              table: targetTable,
              week: activeWeek,
              count: data.count || parsedPicks.length,
              picks: data.picks || parsedPicks
            }
          })
        );
      } catch (_) {}

      triggerToast?.(
        `Successfully imported ${data.count || parsedPicks.length} fixtures into ${targetTable} (Week ${activeWeek})!`,
        'success'
      );

      if (onUploadSuccess) {
        onUploadSuccess(data.picks || parsedPicks, selectedBookmaker, targetTable);
      }

      onClose();
    } catch (err: any) {
      triggerToast?.(err.message || 'Error occurred while uploading CSV.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const bankersCount = parsedPicks.filter((p) => p.is_banker).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-[#0B1120] border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-left font-sans"
        >
          {/* MODAL HEADER */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white font-mono uppercase tracking-wide truncate">
                    Upload Pool Picks CSV
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                    ADMIN
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Synchronize weekly banker draws, match odds, bet codes, and kickoff times directly to PostgreSQL.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer shrink-0"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MAIN MODAL BODY */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* 1. CONFIGURATION STRIP: BOOKMAKER & WEEK SELECTOR */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
              <div>
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Target Bookmaker Table</span>
                </label>
                <select
                  value={selectedBookmaker}
                  onChange={(e) => setSelectedBookmaker(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs font-bold px-3 py-2 rounded-xl focus:border-emerald-500 outline-none cursor-pointer"
                >
                  <option value="bet9ja">Bet9ja • weekly pool picks(Bet9ja)</option>
                  <option value="betking">BetKing • weekly pool picks(betking)</option>
                  <option value="general">Master Sheet • weekly pool picks</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Active Coupon Week</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveWeek((w) => Math.max(1, w - 1))}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-bold transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={activeWeek}
                    onChange={(e) => setActiveWeek(Number(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs font-bold px-3 py-2 rounded-xl text-center focus:border-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setActiveWeek((w) => w + 1)}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-bold transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sync Policy</span>
                </label>
                <div className="flex items-center gap-2 h-9">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-300">
                    <input
                      type="checkbox"
                      checked={replaceAll}
                      onChange={(e) => setReplaceAll(e.target.checked)}
                      className="rounded accent-emerald-500 cursor-pointer w-4 h-4"
                    />
                    <span>Overwrite existing rows</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 2. INPUT METHOD TABS (FILE UPLOAD VS RAW PASTE) */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveInputTab('upload')}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                    activeInputTab === 'upload'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload .CSV File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInputTab('paste')}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                    activeInputTab === 'paste'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Paste CSV Text</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Sample CSV Template</span>
              </button>
            </div>

            {/* TAB CONTENT: UPLOAD FILE */}
            {activeInputTab === 'upload' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                  <Upload className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-white font-mono">
                    {fileName ? `Selected file: ${fileName}` : 'Click to choose or drag & drop CSV file here'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Supports Comma-Separated, Semicolon, or Tab-Delimited weekly pool fixtures (.csv, .txt)
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: PASTE TEXT */}
            {activeInputTab === 'paste' && (
              <div className="space-y-2">
                <textarea
                  value={csvText}
                  onChange={handleTextChange}
                  rows={6}
                  placeholder={`pool_no,bet_code,home,away,home_win,draw_x,away_win,bet,status,kick_off,week,is_banker\n2,9JA-2110,Everton,Crystal P.,2.23,3.40,3.35,X,Saturday,3:00 PM,7,TRUE\n14,9JA-4565,Swansea,Sheff Utd.,2.57,3.30,2.70,X,Saturday,3:00 PM,7,FALSE\n19,9JA-1072,Wimbledon,Reading,2.50,3.20,2.60,X,Saturday,3:00 PM,7,TRUE`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:border-emerald-500 outline-none resize-y"
                />
                <p className="text-[10px] text-slate-500 font-mono">
                  Tip: Copy directly from Microsoft Excel, Google Sheets, or Notepad and paste above.
                </p>
              </div>
            )}

            {/* ERROR ALERT */}
            {parseError && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* PARSED PICKS SUMMARY & PREVIEW TABLE */}
            {parsedPicks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-xs">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-slate-300">
                      Total Fixtures: <strong className="text-white">{parsedPicks.length}</strong>
                    </span>
                    <span className="text-amber-400 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{bankersCount} Bankers Identified</span>
                    </span>
                    <span className="text-emerald-400">
                      Target: <code className="bg-slate-950 px-1.5 py-0.5 rounded border border-emerald-500/30">{getResolvedTableName(selectedBookmaker)}</code>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Week {activeWeek}
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner">
                  <div className="overflow-x-auto max-h-60">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold sticky top-0">
                        <tr>
                          <th className="p-2.5 text-center w-12">Pool #</th>
                          <th className="p-2.5">Bet Code</th>
                          <th className="p-2.5">Fixture</th>
                          <th className="p-2.5 text-center">1 (Home)</th>
                          <th className="p-2.5 text-center">X (Draw)</th>
                          <th className="p-2.5 text-center">2 (Away)</th>
                          <th className="p-2.5 text-center">Banker</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Kickoff</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {parsedPicks.map((p, idx) => (
                          <tr key={`csv_preview_${p.pool_no}_${idx}`} className="hover:bg-slate-900/50">
                            <td className="p-2.5 text-center font-bold text-blue-400">
                              {p.pool_no}
                            </td>
                            <td className="p-2.5 font-bold text-amber-300">
                              {p.bet_code}
                            </td>
                            <td className="p-2.5 text-white font-semibold">
                              {p.home} <span className="text-slate-500 font-normal">vs</span> {p.away}
                            </td>
                            <td className="p-2.5 text-center text-slate-300">
                              {Number(p.home_win).toFixed(2)}
                            </td>
                            <td className="p-2.5 text-center font-bold text-emerald-400 bg-emerald-950/30">
                              {Number(p.draw_x).toFixed(2)}
                            </td>
                            <td className="p-2.5 text-center text-slate-300">
                              {Number(p.away_win).toFixed(2)}
                            </td>
                            <td className="p-2.5 text-center">
                              {p.is_banker ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold">
                                  <Star className="w-3 h-3 fill-current text-amber-400" />
                                  <span>NAP</span>
                                </span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-400">
                              {p.status}
                            </td>
                            <td className="p-2.5 text-slate-400">
                              {p.kick_off}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MODAL FOOTER ACTIONS */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              Data persists immediately to Supabase and updates customer portal tables.
            </span>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={isSubmitting || parsedPicks.length === 0}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-mono font-black uppercase rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synchronizing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Import {parsedPicks.length > 0 ? `${parsedPicks.length} Fixtures` : 'Picks'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
