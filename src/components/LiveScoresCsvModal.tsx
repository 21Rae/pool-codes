import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Download, RefreshCw, Table, Info } from 'lucide-react';

export interface ParsedCsvMatch {
  pool_number?: number;
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  score?: string;
  status: 'not_started' | 'live' | 'finished' | 'postponed';
  minute?: string;
  league?: string;
}

interface LiveScoresCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (matches: any[]) => void;
  triggerToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function LiveScoresCsvModal({
  isOpen,
  onClose,
  onUploadSuccess,
  triggerToast
}: LiveScoresCsvModalProps) {
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedMatches, setParsedMatches] = useState<ParsedCsvMatch[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replaceAll, setReplaceAll] = useState(true);
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'paste'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to parse CSV string into structured match rows
  const parseCsvContent = (content: string) => {
    setParseError(null);
    try {
      const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        setParseError('The CSV file must contain at least a header row and one match row.');
        setParsedMatches([]);
        return;
      }

      // Determine delimiter (comma, semicolon, or tab)
      const firstLine = lines[0];
      let delimiter = ',';
      if (firstLine.includes('\t')) delimiter = '\t';
      else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

      // Parse headers
      const rawHeaders = firstLine.split(delimiter).map((h) =>
        h.replace(/^["']|["']$/g, '').trim().toLowerCase()
      );

      // Find column indices
      const findIndex = (patterns: string[]) => {
        return rawHeaders.findIndex((h) =>
          patterns.some((p) => h === p || h.includes(p) || h.replace(/[^a-z0-9]/g, '') === p.replace(/[^a-z0-9]/g, ''))
        );
      };

      const homeIdx = findIndex(['home_team', 'home team', 'hometeam', 'home', 'team1', 'team 1']);
      const awayIdx = findIndex(['away_team', 'away team', 'awayteam', 'away', 'team2', 'team 2']);
      const scoreIdx = findIndex(['score', 'fulltime', 'full_time', 'ft', 'result', 'pool_result']);
      const homeScoreIdx = findIndex(['home_team_score', 'home_score', 'homescore', 'h_score']);
      const awayScoreIdx = findIndex(['away_team_score', 'away_score', 'awayscore', 'a_score']);
      const statusIdx = findIndex(['live_score_status', 'status', 'match_status', 'state']);
      const poolNumIdx = findIndex(['pool_number', 'pool_no', 'poolnum', 'match_no', 'game_no', 'id']);
      const leagueIdx = findIndex(['league', 'competition', 'division']);

      if (homeIdx === -1 || awayIdx === -1) {
        setParseError("Could not identify Home Team or Away Team columns. Expected headers like 'home_team' and 'away_team'.");
        setParsedMatches([]);
        return;
      }

      const matches: ParsedCsvMatch[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        // Simple CSV splitter that respects basic quotes
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

        // Scores
        let hScore: number | undefined = undefined;
        let aScore: number | undefined = undefined;
        let scoreStr = '0 - 0';

        const rawHomeScore = cleanToken(homeScoreIdx);
        const rawAwayScore = cleanToken(awayScoreIdx);
        const rawScore = cleanToken(scoreIdx);

        if (rawHomeScore !== '' && !isNaN(Number(rawHomeScore))) {
          hScore = Number(rawHomeScore);
        }
        if (rawAwayScore !== '' && !isNaN(Number(rawAwayScore))) {
          aScore = Number(rawAwayScore);
        }

        if (hScore !== undefined && aScore !== undefined) {
          scoreStr = `${hScore} - ${aScore}`;
        } else if (rawScore) {
          const cleanedScore = rawScore.replace(/-:-/g, '-').replace(/:/g, '-');
          const parts = cleanedScore.split('-');
          if (parts.length === 2 && !isNaN(Number(parts[0].trim())) && !isNaN(Number(parts[1].trim()))) {
            hScore = Number(parts[0].trim());
            aScore = Number(parts[1].trim());
            scoreStr = `${hScore} - ${aScore}`;
          } else {
            scoreStr = rawScore;
          }
        }

        // Status normalization
        const rawStatus = cleanToken(statusIdx).toLowerCase();
        let status: 'not_started' | 'live' | 'finished' | 'postponed' = 'not_started';
        let minute = '';

        if (
          rawStatus === 'finished' ||
          rawStatus === 'ft' ||
          rawStatus === 'full time' ||
          rawStatus === 'fulltime' ||
          rawStatus === 'scoredraw' ||
          rawStatus === 'noscoredraw' ||
          rawStatus === 'draw' ||
          rawStatus === 'home' ||
          rawStatus === 'away'
        ) {
          status = 'finished';
          minute = 'FT';
        } else if (
          rawStatus === 'live' ||
          rawStatus === 'in play' ||
          rawStatus === '1h' ||
          rawStatus === '2h' ||
          rawStatus === 'ht' ||
          rawStatus === 'running'
        ) {
          status = 'live';
          minute = 'Live';
        } else if (
          rawStatus.includes('postp') ||
          rawStatus === 'ppd' ||
          rawStatus === 'p-p' ||
          rawScore === 'P-P'
        ) {
          status = 'postponed';
          minute = 'PPD';
          scoreStr = 'P - P';
        }

        const poolNoVal = cleanToken(poolNumIdx);
        const poolNum = poolNoVal && !isNaN(Number(poolNoVal)) ? Number(poolNoVal) : matches.length + 1;
        const league = cleanToken(leagueIdx) || 'Pool Weekend Fixture';

        matches.push({
          pool_number: poolNum,
          home_team: homeTeam,
          away_team: awayTeam,
          home_score: hScore ?? 0,
          away_score: aScore ?? 0,
          score: scoreStr,
          status,
          minute,
          league
        });
      }

      if (matches.length === 0) {
        setParseError('No valid fixture rows could be extracted from the CSV.');
      } else {
        setParsedMatches(matches);
      }
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse CSV file content.');
      setParsedMatches([]);
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
      setParsedMatches([]);
      setParseError(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (parsedMatches.length === 0) {
      triggerToast?.('Please provide valid CSV matches first.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/livescores/upload-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matches: parsedMatches,
          replaceAll
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save CSV to livescores database.');
      }

      const updatedList = data.matches || parsedMatches;
      try {
        localStorage.setItem('fastpool_live_scores_data', JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent('fastpool_livescores_updated', { detail: updatedList }));
      } catch (_) {}

      triggerToast?.(
        `Successfully imported ${data.count || parsedMatches.length} matches into the livescores table and updated UI!`,
        'success'
      );
      onUploadSuccess(updatedList);
      onClose();
    } catch (err: any) {
      triggerToast?.(err.message || 'Failed to upload CSV to livescore table.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const sampleCsv = `pool_number,home_team,away_team,home_team_score,away_team_score,live_score_status,league
1,Arsenal,Chelsea,2,1,finished,Premier League
2,Aston Villa,Brentford,2,2,finished,Premier League
3,Everton,Liverpool,0,0,live,Premier League
4,Fulham,Brighton,1,1,live,Premier League
5,Man City,Man Utd,3,0,finished,Premier League
6,Newcastle,Tottenham,2,2,finished,Premier League
7,Nottingham Forest,Wolves,1,0,not_started,Premier League
8,West Ham,Crystal Palace,1,1,finished,Premier League
9,Bournemouth,Southampton,0,0,not_started,Premier League
10,Ipswich,Leicester,1,2,finished,Premier League
11,Blackburn,Leeds,0,1,finished,Championship
12,Bristol City,Burnley,1,1,finished,Championship
13,Coventry,Sheffield Utd,0,0,postponed,Championship
14,Derby,Preston,2,1,finished,Championship
15,Hull City,Middlesbrough,1,3,finished,Championship`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'livescores_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast?.('Downloaded sample livescores CSV template.', 'info');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl p-6 text-left flex flex-col gap-5 my-8 max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Upload className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase font-mono tracking-wider flex items-center gap-2">
                  Upload CSV to Live Scores Table
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                    Supabase & UI Sync
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">
                  Import coupon match fixtures, scores, and statuses directly into the Live Scores database.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Tabs: File Upload vs Direct Text Paste */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveInputTab('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeInputTab === 'upload'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Upload CSV File</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveInputTab('paste')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeInputTab === 'paste'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Paste CSV Data</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/50 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Template</span>
            </button>
          </div>

          {/* Body Content based on tab */}
          <div className="flex flex-col gap-4">
            {activeInputTab === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,text/csv,text/plain"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white font-mono">
                    {fileName ? fileName : 'Click or Drag & Drop CSV File Here'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Accepts comma-delimited (.csv) files with headers like{' '}
                    <code className="text-emerald-300 font-mono">home_team, away_team, score, status</code>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase">
                  Paste Raw CSV or Tab-Separated Data:
                </label>
                <textarea
                  value={csvText}
                  onChange={handleTextChange}
                  rows={6}
                  placeholder={`home_team,away_team,home_team_score,away_team_score,live_score_status\nArsenal,Chelsea,2,1,finished\nAston Villa,Brentford,2,2,live`}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-600 outline-none resize-y"
                />
              </div>
            )}

            {/* Parse Error Box */}
            {parseError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-2.5 text-xs text-rose-300 font-mono">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Parsed Preview Table */}
            {parsedMatches.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {parsedMatches.length} Matches Detected & Ready
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Previewing first 5 rows:
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase font-black">
                      <tr>
                        <th className="p-2.5 text-center">#</th>
                        <th className="p-2.5">Home Team</th>
                        <th className="p-2.5">Away Team</th>
                        <th className="p-2.5 text-center">Score</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {parsedMatches.slice(0, 5).map((m, idx) => (
                        <tr key={`csv_prev_${idx}`} className="hover:bg-slate-900/50">
                          <td className="p-2 text-center text-slate-500 font-bold">
                            {m.pool_number || idx + 1}
                          </td>
                          <td className="p-2 font-semibold text-white">{m.home_team}</td>
                          <td className="p-2 font-semibold text-white">{m.away_team}</td>
                          <td className="p-2 text-center text-amber-400 font-bold">{m.score}</td>
                          <td className="p-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                m.status === 'live'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : m.status === 'finished'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : m.status === 'postponed'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Import Options */}
                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none font-mono">
                    <input
                      type="checkbox"
                      checked={replaceAll}
                      onChange={(e) => setReplaceAll(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Replace all existing matches (Clean overwrite with this CSV)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Direct Supabase table sync + Live UI broadcast</span>
            </div>

            <div className="flex items-center gap-3">
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
                disabled={isSubmitting || parsedMatches.length === 0}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 text-xs font-mono font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing with Database...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Update UI ({parsedMatches.length})</span>
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
