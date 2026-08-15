import React, { useState, useMemo } from 'react';
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
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PoolCodesComparisonRecord, User } from '../types';
import { INITIAL_POOL_CODES_COMPARISON } from '../initialData';

interface PoolCodesComparisonTableProps {
  comparisonRows?: PoolCodesComparisonRecord[];
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  currentUser?: User;
  compact?: boolean;
  onOpenVipSubscription?: () => void;
}

export default function PoolCodesComparisonTable({
  comparisonRows,
  triggerToast,
  currentUser,
  compact = false,
  onOpenVipSubscription
}: PoolCodesComparisonTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState<'all' | 'Saturday' | 'Sunday' | 'LKO'>('all');
  const [copiedFixtureId, setCopiedFixtureId] = useState<number | string | null>(null);
  const [sortBy, setSortBy] = useState<'pool' | 'home' | 'highestDraw'>('pool');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Clean data: eliminate empty or null entries (e.g. id 150 where pool is null)
  const rawData: PoolCodesComparisonRecord[] = useMemo(() => {
    const source = (comparisonRows && comparisonRows.length > 0)
      ? comparisonRows
      : INITIAL_POOL_CODES_COMPARISON;
    return source.filter(r => r && (r.home || r.pool !== null && r.pool !== undefined));
  }, [comparisonRows]);

  // Helper to parse numeric odds
  const parseOdds = (val?: string | number): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).trim().toUpperCase();
    if (cleaned === 'NA' || cleaned === 'N/A' || cleaned === '') return 0;
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

  // Download PDF (Free Access for All Users)
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Background header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 297, 28, 'F');

      // Golden accent line
      doc.setFillColor(245, 158, 11); // amber-500
      doc.rect(0, 28, 297, 2, 'F');

      // Title & Branding
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('POOL CODES COMPARISON - MULTI-BOOKMAKER DRAW ODDS MATRIX', 14, 12);

      // Contact & compilation footer note in header
      doc.setTextColor(226, 232, 240); // slate-200
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Compiled by Fastpoolcodes.com. For Enquiries Call or WhatsApp: +234 8030587933, +234 9037595705', 14, 19);

      // Free Access Badge
      doc.setTextColor(52, 211, 153); // emerald-400
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('OFFICIAL FREE ACCESS SHEET • 100% VERIFIED ODDS', 14, 25);

      // Date / User note
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const generatedTime = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      doc.text(`Generated: ${generatedTime} | Fastpoolcodes.com`, 220, 25);

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
        startY: 33,
        margin: { left: 14, right: 14 },
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'center',
          cellPadding: 2.5
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 50, fontStyle: 'bold' },
          2: { cellWidth: 50, fontStyle: 'bold' },
          3: { cellWidth: 32, halign: 'center', textColor: [180, 83, 9] },
          4: { cellWidth: 32, halign: 'center', textColor: [3, 105, 161] },
          5: { cellWidth: 34, halign: 'center', textColor: [190, 24, 93] },
          6: { cellWidth: 26, halign: 'center' },
          7: { cellWidth: 26, halign: 'center' }
        },
        didDrawPage: (data) => {
          // Footer
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(
            'Compiled by Fastpoolcodes.com. For Enquiries Call or WhatsApp: +234 8030587933, +234 9037595705',
            14,
            doc.internal.pageSize.height - 6
          );
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            doc.internal.pageSize.width - 30,
            doc.internal.pageSize.height - 6
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
              <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-bold rounded-full">
                Week 49 Aussie Pools
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
              Compare multi-bookmaker draw classification odds side-by-side across <strong className="text-amber-400 font-semibold">Bet9ja</strong>, <strong className="text-sky-400 font-semibold">BetKing</strong>, and <strong className="text-pink-400 font-semibold">SportyBet</strong>. Highlighting the best market value for Aussie football pools coupons.
            </p>
          </div>

          {/* Action buttons: Free Download PDF & Native Print */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
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
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Compiled by <strong>Fastpoolcodes.com</strong></span>
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
                {day === 'all' ? 'All Days (49)' : day === 'LKO' ? 'Late Kick-Off (LKO)' : day}
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
                          className="p-1 text-slate-500 hover:text-amber-400 transition rounded hover:bg-slate-800"
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
            <span>Showing <strong>{filteredRows.length}</strong> of {rawData.length} multi-bookmaker pool matches</span>
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
