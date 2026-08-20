import React, { useState, useMemo, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Search,
  Download,
  Printer,
  Copy,
  Check,
  Sparkles,
  TrendingUp,
  Clock,
  Calendar,
  Layers,
  ArrowUpDown,
  Filter,
  ShieldCheck,
  Zap,
  Info,
  RefreshCw,
  Radio,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PoolCodesComparisonRecord, User } from '../types';
import { INITIAL_POOL_CODES_COMPARISON } from '../initialData';
import { getSupabaseClient, initSupabaseConfig } from '../lib/supabase';

interface PoolCodesComparisonTableProps {
  comparisonRows?: PoolCodesComparisonRecord[];
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  currentUser?: User;
  compact?: boolean;
  onOpenVipSubscription?: () => void;
}

/**
 * Helper to retrieve a value from an object regardless of uppercase/lowercase/symbols
 */
function getCaseInsensitiveValue(obj: any, candidateKeys: string[]): any {
  if (!obj || typeof obj !== 'object') return undefined;

  // 1. Direct key matches
  for (const key of candidateKeys) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
      return obj[key];
    }
  }

  // 2. Case-insensitive & symbol-stripped matching
  const objKeys = Object.keys(obj);
  for (const candidate of candidateKeys) {
    const cleanCandidate = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const objKey of objKeys) {
      if (objKey.toLowerCase() === candidate.toLowerCase()) {
        if (obj[objKey] !== undefined && obj[objKey] !== null && String(obj[objKey]).trim() !== '') {
          return obj[objKey];
        }
      }
      const cleanObjKey = objKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanObjKey === cleanCandidate) {
        if (obj[objKey] !== undefined && obj[objKey] !== null && String(obj[objKey]).trim() !== '') {
          return obj[objKey];
        }
      }
    }
  }

  return undefined;
}

/**
 * Normalizes raw records from Supabase public."pool codes comparison" or API payloads
 * to ensure consistent field names regardless of database column casing/naming.
 */
function normalizeComparisonRecord(raw: any, index: number): PoolCodesComparisonRecord {
  if (!raw || typeof raw !== 'object') {
    return {
      id: index + 1,
      pool: index + 1,
      home: 'Unknown',
      away: 'Unknown',
      'bet9ja (draw)': '-',
      'betking (draw)': '-',
      'sportybet (draw)': '-',
      status: 'Saturday',
      kickoff: '3:00 PM'
    };
  }

  // Extract pool number (handles POOL, pool, pool_no, etc.)
  const rawPool = getCaseInsensitiveValue(raw, ['pool', 'pool_no', 'pool_number', 'fixture_no', 'match_no', 'id']);
  const pool = rawPool !== undefined ? String(rawPool).trim() : String(index + 1);

  // Extract home & away teams (handles HOME, home, home_team, etc.)
  const home = getCaseInsensitiveValue(raw, ['home', 'home_team', 'homeTeam', 'home team', 'hometeam']) || '';
  const away = getCaseInsensitiveValue(raw, ['away', 'away_team', 'awayTeam', 'away team', 'awayteam']) || '';

  // Extract bookmaker draw odds (handles "BET9JA (DRAW)", "bet9ja (draw)", "bet9ja_draw", "bet9ja", etc.)
  const bet9ja = getCaseInsensitiveValue(raw, [
    'bet9ja (draw)', 'BET9JA (DRAW)', 'bet9ja_draw', 'bet9ja', 'bet9jadraw', 'b9_draw', 'b9'
  ]) || '-';

  const betking = getCaseInsensitiveValue(raw, [
    'betking (draw)', 'BETKING (DRAW)', 'betking_draw', 'betking', 'betkingdraw', 'bk_draw', 'bk'
  ]) || '-';

  const sportybet = getCaseInsensitiveValue(raw, [
    'sportybet (draw)', 'SPORTYBET (DRAW)', 'sportybet_draw', 'sportybet', 'sportybetdraw', 'sb_draw', 'sb'
  ]) || '-';

  // Extract status & kickoff
  const status = getCaseInsensitiveValue(raw, ['status', 'STATUS', 'match_status', 'day']) || 'Saturday';
  const kickoff = getCaseInsensitiveValue(raw, ['kickoff', 'KICKOFF', 'kick_off', 'kickoff_time', 'time']) || '3:00 PM';

  return {
    ...raw,
    id: raw.id ?? `${pool}_${home}_${away}` ?? index + 1,
    pool,
    home,
    away,
    'bet9ja (draw)': bet9ja,
    'betking (draw)': betking,
    'sportybet (draw)': sportybet,
    status,
    kickoff,
    created_at: raw.created_at
  };
}

export default function PoolCodesComparisonTable({
  comparisonRows,
  triggerToast,
  currentUser,
  compact = false,
  onOpenVipSubscription
}: PoolCodesComparisonTableProps) {
  // Local live state to ensure real-time responsiveness
  const [liveRows, setLiveRows] = useState<PoolCodesComparisonRecord[]>(() => {
    if (comparisonRows && comparisonRows.length > 0) {
      return comparisonRows.map((r, i) => normalizeComparisonRecord(r, i));
    }
    return INITIAL_POOL_CODES_COMPARISON.map((r, i) => normalizeComparisonRecord(r, i));
  });

  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString());
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false);
  const [sourceTableName, setSourceTableName] = useState<string>('public.pool codes comparison');

  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState<'all' | 'Saturday' | 'Sunday' | 'LKO'>('all');
  const [copiedFixtureId, setCopiedFixtureId] = useState<number | string | null>(null);
  const [sortBy, setSortBy] = useState<'pool' | 'home' | 'highestDraw'>('pool');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Sync prop updates if parent passes new rows
  useEffect(() => {
    if (comparisonRows && comparisonRows.length > 0) {
      const normalized = comparisonRows.map((r, i) => normalizeComparisonRecord(r, i));
      setLiveRows(normalized);
      setLastSyncTime(new Date().toLocaleTimeString());
    }
  }, [comparisonRows]);

  /**
   * Fetch live records directly from Supabase public."pool codes comparison" table or API proxy
   */
  const fetchLiveComparisonData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoadingLive(true);

    try {
      await initSupabaseConfig();
      const supabase = getSupabaseClient();
      let fetchedRows: any[] | null = null;
      let usedTable = 'pool codes comparison';

      // 1. Direct Supabase Query on "pool codes comparison"
      if (supabase) {
        try {
          const res1 = await supabase.from('pool codes comparison').select('*');
          if (!res1.error && res1.data && res1.data.length > 0) {
            fetchedRows = res1.data;
            usedTable = 'public.pool codes comparison';
          } else {
            // Check fallback table name "pool_codes_comparison"
            const res2 = await supabase.from('pool_codes_comparison').select('*');
            if (!res2.error && res2.data && res2.data.length > 0) {
              fetchedRows = res2.data;
              usedTable = 'public.pool_codes_comparison';
            }
          }
        } catch (sbErr) {
          console.warn('[PoolCodesComparison] Direct Supabase query error, falling back to API proxy:', sbErr);
        }
      }

      // 2. Server API Route Proxy Fallback
      if (!fetchedRows || fetchedRows.length === 0) {
        try {
          const apiRes = await fetch('/api/tables/pool%20codes%20comparison');
          if (apiRes.ok) {
            const json = await apiRes.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
              fetchedRows = json.data;
              usedTable = 'public.pool codes comparison';
            }
          }
        } catch (apiErr) {
          console.warn('[PoolCodesComparison] API proxy fetch error:', apiErr);
        }
      }

      // Update state with normalized rows if data retrieved
      if (fetchedRows && fetchedRows.length > 0) {
        const normalized = fetchedRows
          .filter(r => r && (r.home || r.pool !== null && r.pool !== undefined))
          .map((r, i) => normalizeComparisonRecord(r, i));

        if (normalized.length > 0) {
          setLiveRows(normalized);
          setSourceTableName(usedTable);
          setLastSyncTime(new Date().toLocaleTimeString());
          if (!isSilent) {
            triggerToast(`✅ Loaded ${normalized.length} real-time rows from ${usedTable}`, 'success');
          }
        }
      }
    } catch (err: any) {
      console.error('[PoolCodesComparison] Live fetch exception:', err);
    } finally {
      if (!isSilent) setIsLoadingLive(false);
    }
  }, [triggerToast]);

  /**
   * Set up Realtime WebSocket subscription on public."pool codes comparison" and periodic polling
   */
  useEffect(() => {
    // Initial fetch
    fetchLiveComparisonData(true);

    // Realtime WebSocket Subscription (Push notifications on db changes, zero continuous CPU polling)
    let channel: any = null;
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        channel = supabase
          .channel('realtime-pool-codes-comparison-channel')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'pool codes comparison'
            },
            (payload) => {
              console.log('⚡ Real-time update on public.pool codes comparison:', payload);
              fetchLiveComparisonData(true);
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'pool_codes_comparison'
            },
            (payload) => {
              console.log('⚡ Real-time update on public.pool_codes_comparison:', payload);
              fetchLiveComparisonData(true);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setRealtimeConnected(true);
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              setRealtimeConnected(false);
            }
          });
      }
    } catch (wsErr) {
      console.warn('[PoolCodesComparison] WebSocket subscription error:', wsErr);
    }

    return () => {
      if (channel) {
        try {
          const supabase = getSupabaseClient();
          if (supabase) supabase.removeChannel(channel);
        } catch (_) {}
      }
    };
  }, [fetchLiveComparisonData]);

  // Clean data: eliminate empty or null entries and normalize all field casings
  const rawData: PoolCodesComparisonRecord[] = useMemo(() => {
    const source = (liveRows && liveRows.length > 0)
      ? liveRows
      : (comparisonRows && comparisonRows.length > 0 ? comparisonRows : INITIAL_POOL_CODES_COMPARISON);
    return source
      .map((r, i) => normalizeComparisonRecord(r, i))
      .filter(r => r && (r.home || r.away || (r.pool !== null && r.pool !== undefined)));
  }, [liveRows, comparisonRows]);

  // Helper to parse numeric odds
  const parseOdds = (val?: string | number): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).trim().toUpperCase();
    if (cleaned === 'NA' || cleaned === 'N/A' || cleaned === '' || cleaned === '-') return 0;
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Helper to find highest draw odds among the three bookmakers
  const getBestDrawOdds = (row: PoolCodesComparisonRecord) => {
    const b9 = parseOdds(row['bet9ja (draw)']);
    const bk = parseOdds(row['betking (draw)']);
    const sb = parseOdds(row['sportybet (draw)']);
    const maxVal = Math.max(b9, bk, sb);

    return {
      maxVal: maxVal > 0 ? maxVal.toFixed(2) : null,
      bestBookies: {
        bet9ja: b9 > 0 && b9 === maxVal,
        betking: bk > 0 && bk === maxVal,
        sportybet: sb > 0 && sb === maxVal
      }
    };
  };

  // Filtered and sorted dataset
  const filteredRows = useMemo(() => {
    return rawData
      .filter(row => {
        // Day / Status filter
        if (dayFilter !== 'all') {
          const st = String(row.status || '').toUpperCase();
          if (dayFilter === 'LKO' && !st.includes('LKO')) return false;
          if (dayFilter === 'Saturday' && !st.includes('SATURDAY')) return false;
          if (dayFilter === 'Sunday' && !st.includes('SUNDAY')) return false;
        }

        // Text search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchPool = String(row.pool || '').toLowerCase().includes(q);
          const matchHome = String(row.home || '').toLowerCase().includes(q);
          const matchAway = String(row.away || '').toLowerCase().includes(q);
          const matchStatus = String(row.status || '').toLowerCase().includes(q);
          const matchKickoff = String(row.kickoff || '').toLowerCase().includes(q);
          const matchB9 = String(row['bet9ja (draw)'] || '').toLowerCase().includes(q);
          const matchBk = String(row['betking (draw)'] || '').toLowerCase().includes(q);
          const matchSb = String(row['sportybet (draw)'] || '').toLowerCase().includes(q);

          if (
            !matchPool &&
            !matchHome &&
            !matchAway &&
            !matchStatus &&
            !matchKickoff &&
            !matchB9 &&
            !matchBk &&
            !matchSb
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'pool') {
          const pA = Number(a.pool) || 0;
          const pB = Number(b.pool) || 0;
          return sortOrder === 'asc' ? pA - pB : pB - pA;
        }
        if (sortBy === 'home') {
          const hA = String(a.home || '');
          const hB = String(b.home || '');
          return sortOrder === 'asc' ? hA.localeCompare(hB) : hB.localeCompare(hA);
        }
        if (sortBy === 'highestDraw') {
          const maxA = Math.max(parseOdds(a['bet9ja (draw)']), parseOdds(a['betking (draw)']), parseOdds(a['sportybet (draw)']));
          const maxB = Math.max(parseOdds(b['bet9ja (draw)']), parseOdds(b['betking (draw)']), parseOdds(b['sportybet (draw)']));
          return sortOrder === 'asc' ? maxA - maxB : maxB - maxA;
        }
        return 0;
      });
  }, [rawData, dayFilter, searchQuery, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    let satCount = 0;
    let sunCount = 0;
    let lkoCount = 0;
    let highestDraw = 0;
    let highestDrawMatch = '';

    rawData.forEach(r => {
      const st = String(r.status || '').toUpperCase();
      if (st.includes('SATURDAY')) satCount++;
      if (st.includes('SUNDAY')) sunCount++;
      if (st.includes('LKO')) lkoCount++;

      const b9 = parseOdds(r['bet9ja (draw)']);
      const bk = parseOdds(r['betking (draw)']);
      const sb = parseOdds(r['sportybet (draw)']);
      const m = Math.max(b9, bk, sb);
      if (m > highestDraw) {
        highestDraw = m;
        highestDrawMatch = `${r.home} vs ${r.away}`;
      }
    });

    return {
      total: rawData.length,
      satCount,
      sunCount,
      lkoCount,
      highestDraw: highestDraw > 0 ? highestDraw.toFixed(2) : '6.30',
      highestDrawMatch: highestDrawMatch || 'Casa Pia AC vs Benfica'
    };
  }, [rawData]);

  // Copy single fixture
  const handleCopyFixture = (row: PoolCodesComparisonRecord) => {
    const text = `[Pool ${row.pool}] ${row.home} vs ${row.away} | Bet9ja: ${row['bet9ja (draw)']} | BetKing: ${row['betking (draw)']} | SportyBet: ${row['sportybet (draw)']} (${row.status || ''} ${row.kickoff || ''}) - FastPoolCodes.com`;
    navigator.clipboard.writeText(text);
    setCopiedFixtureId(row.id);
    triggerToast(`Copied Pool #${row.pool} (${row.home} vs ${row.away})`, 'info');
    setTimeout(() => setCopiedFixtureId(null), 2000);
  };

  // Download PDF (Free Access for All Users) - Compact Single-Page Layout
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Top compact header banner (Height: 8mm)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(6, 4, pageWidth - 12, 8, 'F');

      // Golden accent line
      doc.setFillColor(245, 158, 11); // amber-500
      doc.rect(6, 12, pageWidth - 12, 0.8, 'F');

      // Title & Branding inside banner
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('FASTPOOLCODES • POOL CODES COMPARISON (DRAW ODDS MATRIX)', 9, 9.2);

      // Free badge & date on right side of banner
      doc.setTextColor(52, 211, 153); // emerald-400
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      const generatedTime = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      doc.text(`FREE ACCESS SHEET • ${generatedTime}`, pageWidth - 9, 9.2, { align: 'right' });

      // Contact & Notice subheader line (Height: 3.5mm)
      doc.setTextColor(30, 41, 59); // slate-800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text('Compiled by Fastpoolcodes.com. For Enquiries Call or WhatsApp: +234 8030587933, +234 9037595705)', 6, 15.8);

      // Table columns & data
      const tableHeaders = [
        ['POOL', 'HOME TEAM', 'AWAY TEAM', 'BET9JA (DRAW)', 'BETKING (DRAW)', 'SPORTYBET (DRAW)', 'STATUS', 'KICKOFF']
      ];

      const tableRows = filteredRows.map(r => [
        String(r.pool ?? ''),
        String(r.home ?? ''),
        String(r.away ?? ''),
        String(r['bet9ja (draw)'] ?? '-'),
        String(r['betking (draw)'] ?? '-'),
        String(r['sportybet (draw)'] ?? '-'),
        String(r.status ?? 'Saturday'),
        String(r.kickoff ?? '-')
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 17.5,
        margin: { top: 17.5, bottom: 6, left: 6, right: 6 },
        theme: 'grid',
        tableWidth: 'auto',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.2,
          halign: 'center',
          cellPadding: [0.8, 1],
          minCellHeight: 3.5
        },
        bodyStyles: {
          fontSize: 6.5,
          textColor: [30, 41, 59],
          cellPadding: [0.45, 0.8],
          minCellHeight: 3.0,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 52, fontStyle: 'bold' },
          2: { cellWidth: 52, fontStyle: 'bold' },
          3: { cellWidth: 32, halign: 'center', textColor: [180, 83, 9], fontStyle: 'bold' },
          4: { cellWidth: 32, halign: 'center', textColor: [3, 105, 161], fontStyle: 'bold' },
          5: { cellWidth: 34, halign: 'center', textColor: [190, 24, 93], fontStyle: 'bold' },
          6: { cellWidth: 35, halign: 'center' },
          7: { cellWidth: 36, halign: 'center' }
        },
        willDrawPage: () => {
          // Soft security watermark placed strictly BEHIND the table cells and text
          doc.saveGraphicsState();
          doc.setTextColor(244, 246, 249);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          const watermarkText = `FASTPOOLCODES • ${currentUser?.email || 'FREE ACCESS'}`;
          for (let y = 30; y < pageHeight; y += 45) {
            for (let x = 5; x < pageWidth + 30; x += 90) {
              doc.text(watermarkText, x, y, { angle: -25 });
            }
          }
          doc.restoreGraphicsState();
        },
        didDrawPage: () => {
          // Compact footer watermark strictly BELOW the codes on page bottom
          doc.setFontSize(5.8);
          doc.setTextColor(100, 116, 139);
          doc.text(
            `FastPoolCodes Comparison Verified Sheet • Licensed to ${currentUser?.email || 'General Access'} • For Enquiries Call/WhatsApp: +234 8030587933, +234 9037595705`,
            6,
            pageHeight - 2.5
          );
          doc.text(
            'Page 1 of 1',
            pageWidth - 6,
            pageHeight - 2.5,
            { align: 'right' }
          );
        }
      });

      doc.save(`Pool_Codes_Comparison_Fastpoolcodes_${new Date().toISOString().split('T')[0]}.pdf`);
      triggerToast('✅ Pool Codes Comparison PDF downloaded successfully!', 'success');
    } catch (err: any) {
      console.error('PDF Generation error:', err);
      triggerToast('Error generating PDF document. Please try again.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 text-slate-100 select-text">
      {/* Top Banner & Fast Access Header */}
      <div className="bg-gradient-to-r from-[#0B1120] via-[#0F172A] to-[#0A101D] border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black font-mono text-[10px] sm:text-xs rounded-full uppercase tracking-wider shadow-md shadow-emerald-950/40 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>FREE ACCESS TO ALL USERS</span>
              </span>
              
              {/* Real-time Status Badge */}
              <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>REAL-TIME LIVE</span>
              </span>

              <span className="px-2.5 py-0.5 bg-slate-800/90 border border-slate-700/60 text-slate-300 font-mono text-[11px] rounded-full flex items-center gap-1.5">
                <Database className="w-3 h-3 text-slate-400" />
                <span>{sourceTableName}</span>
              </span>

              <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 font-mono text-[11px] rounded-full">
                {rawData.length} Verified Fixtures
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight font-mono flex items-center gap-2.5">
              <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 shrink-0" />
              <span>Pool Codes Comparison Table</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Compare multi-bookmaker draw classification odds side-by-side across <strong className="text-amber-400 font-semibold">Bet9ja</strong>, <strong className="text-sky-400 font-semibold">BetKing</strong>, and <strong className="text-pink-400 font-semibold">SportyBet</strong>. Highlighting the best market value for football pools coupons with instant real-time updates.
            </p>
          </div>

          {/* Action buttons: Fetch Latest Records, Free Download PDF & Native Print */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => fetchLiveComparisonData(false)}
              disabled={isLoadingLive}
              className="px-3.5 py-3 bg-emerald-950/40 hover:bg-emerald-900/60 active:scale-95 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 font-mono shadow-md"
              title="Fetch latest updated comparison records from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoadingLive ? 'animate-spin' : ''}`} />
              <span>{isLoadingLive ? 'Fetching...' : 'Fetch Latest Records'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/20 font-mono"
              title="Download Free Official Comparison PDF Sheet"
            >
              {isGeneratingPdf ? (
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download PDF (Free)</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 border border-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 font-mono shadow-md"
              title="Print Sheet"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Quick Contact & Compilation Notice */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Compiled by <strong>Fastpoolcodes.com</strong></span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Last Synced: <strong className="text-slate-200">{lastSyncTime}</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span>Enquiries Call / WhatsApp:</span>
            <span className="text-amber-400 font-bold">+234 8030587933</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">+234 9037595705</span>
          </div>
        </div>
      </div>

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#090E1A] border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Total Matches</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-white font-mono">{stats.total}</span>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-mono">100% Free</span>
          </div>
        </div>

        <div className="bg-[#090E1A] border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Saturday Fixtures</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-amber-400 font-mono">{stats.satCount}</span>
            <span className="text-[10px] text-slate-400 font-mono">Standard 3:00 PM</span>
          </div>
        </div>

        <div className="bg-[#090E1A] border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Sunday & LKO</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-sky-400 font-mono">{stats.sunCount + stats.lkoCount}</span>
            <span className="text-[10px] text-slate-400 font-mono">{stats.lkoCount} Late Kick-Off</span>
          </div>
        </div>

        <div className="bg-[#090E1A] border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Max Draw Odds</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-pink-400 font-mono">{stats.highestDraw}</span>
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[100px]" title={stats.highestDrawMatch}>
              {stats.highestDrawMatch.split(' vs ')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-[#090E1A] border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Day Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
          <span className="text-[11px] font-mono uppercase text-slate-500 font-bold mr-1 shrink-0">Filter:</span>
          {(['all', 'Saturday', 'Sunday', 'LKO'] as const).map(day => {
            const isActive = dayFilter === day;
            return (
              <button
                key={day}
                onClick={() => setDayFilter(day)}
                className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-lg transition shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {day === 'all' ? `All Matches (${rawData.length})` : day === 'LKO' ? 'Late Kick-Off (LKO)' : day}
              </button>
            );
          })}
        </div>

        {/* Search Input & Sort Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team, pool #, odds, time..."
              className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-mono placeholder:text-slate-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-slate-500 hover:text-slate-300 uppercase font-mono"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-slate-500 uppercase">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-800 font-mono focus:outline-none focus:border-amber-500"
            >
              <option value="pool">Pool No.</option>
              <option value="home">Home Team</option>
              <option value="highestDraw">Highest Draw Odds</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-slate-200 transition"
              title={`Toggle sort order (Current: ${sortOrder.toUpperCase()})`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Presentation */}
      <div className="border border-slate-800 bg-[#070B14] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[780px] border-collapse text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5 text-center font-black text-slate-300 w-16 border-r border-slate-800/80">
                  POOL
                </th>
                <th className="py-3 px-4 font-bold text-slate-200">HOME TEAM</th>
                <th className="py-3 px-4 font-bold text-slate-200">AWAY TEAM</th>
                <th className="py-3 px-3.5 text-center font-bold text-amber-400 bg-amber-950/20 border-l border-r border-slate-800/80">
                  BET9JA (DRAW)
                </th>
                <th className="py-3 px-3.5 text-center font-bold text-sky-400 bg-sky-950/20 border-r border-slate-800/80">
                  BETKING (DRAW)
                </th>
                <th className="py-3 px-3.5 text-center font-bold text-pink-400 bg-pink-950/20 border-r border-slate-800/80">
                  SPORTYBET (DRAW)
                </th>
                <th className="py-3 px-3.5 text-center font-bold text-slate-300 border-r border-slate-800/80">
                  STATUS
                </th>
                <th className="py-3 px-3.5 text-center font-bold text-slate-300">
                  KICKOFF
                </th>
                <th className="py-3 px-2 text-center w-12"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-mono">
                    No matching comparison fixtures found for "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const { maxVal, bestBookies } = getBestDrawOdds(row);
                  const isLko = String(row.status || '').toUpperCase().includes('LKO');
                  const isSunday = String(row.status || '').toUpperCase().includes('SUNDAY');

                  return (
                    <tr
                      key={`comp_row_${row.id || idx}`}
                      className="hover:bg-slate-900/60 transition duration-100 group"
                    >
                      {/* POOL NUMBER */}
                      <td className="py-2.5 px-3.5 text-center font-black text-white bg-slate-950/40 border-r border-slate-800/60">
                        <span className="inline-block w-7 h-7 leading-7 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 font-bold text-xs shadow-inner">
                          {row.pool}
                        </span>
                      </td>

                      {/* HOME TEAM */}
                      <td className="py-2.5 px-4 font-bold text-slate-100 tracking-wide font-sans">
                        {row.home}
                      </td>

                      {/* AWAY TEAM */}
                      <td className="py-2.5 px-4 font-bold text-slate-300 tracking-wide font-sans">
                        {row.away}
                      </td>

                      {/* BET9JA (DRAW) */}
                      <td className="py-2.5 px-3.5 text-center font-mono font-bold bg-amber-950/10 border-l border-r border-slate-800/60">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs transition ${
                            bestBookies.bet9ja
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black shadow-sm'
                              : 'text-slate-300'
                          }`}
                        >
                          {row['bet9ja (draw)'] || '-'}
                        </span>
                      </td>

                      {/* BETKING (DRAW) */}
                      <td className="py-2.5 px-3.5 text-center font-mono font-bold bg-sky-950/10 border-r border-slate-800/60">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs transition ${
                            bestBookies.betking
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-black shadow-sm'
                              : 'text-slate-300'
                          }`}
                        >
                          {row['betking (draw)'] || '-'}
                        </span>
                      </td>

                      {/* SPORTYBET (DRAW) */}
                      <td className="py-2.5 px-3.5 text-center font-mono font-bold bg-pink-950/10 border-r border-slate-800/60">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs transition ${
                            bestBookies.sportybet
                              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 font-black shadow-sm'
                              : 'text-slate-300'
                          }`}
                        >
                          {row['sportybet (draw)'] || '-'}
                        </span>
                      </td>

                      {/* STATUS BADGE */}
                      <td className="py-2.5 px-3.5 text-center border-r border-slate-800/60">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-mono font-bold uppercase ${
                            isLko
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : isSunday
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {row.status || 'Saturday'}
                        </span>
                      </td>

                      {/* KICKOFF TIME */}
                      <td className="py-2.5 px-3.5 text-center font-mono text-[11px] text-slate-400">
                        <span className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{row.kickoff || '3:00 PM'}</span>
                        </span>
                      </td>

                      {/* COPY BUTTON */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => handleCopyFixture(row)}
                          className="p-1 text-slate-500 hover:text-amber-400 transition rounded hover:bg-slate-800 cursor-pointer"
                          title="Copy fixture details"
                        >
                          {copiedFixtureId === row.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary in Table */}
        <div className="bg-slate-950 p-3.5 px-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Showing <strong>{filteredRows.length}</strong> of {rawData.length} multi-bookmaker pool matches from <span className="text-emerald-400">{sourceTableName}</span></span>
          </div>

          <div className="flex items-center gap-4 text-[11.5px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500/40 border border-amber-500"></span>
              <span className="text-slate-300">Bet9ja Best</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-sky-500/40 border border-sky-500"></span>
              <span className="text-slate-300">BetKing Best</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-pink-500/40 border border-pink-500"></span>
              <span className="text-slate-300">SportyBet Best</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
