import React, { useState, useEffect, useMemo, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Trophy,
  Target,
  Sparkles,
  Lock,
  Unlock,
  Copy,
  Check,
  Download,
  Printer,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  CreditCard,
  Zap,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Database,
  Radio,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, SubscriptionPlan } from '../types';
import { getSupabaseClient, initSupabaseConfig } from '../lib/supabase';

export interface WeeklyPoolPick {
  id: string | number;
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
  week?: number;
  notes?: string;
  is_banker?: boolean;
}

/**
 * Case-insensitive & symbol-stripped helper to extract values from raw database objects
 */
function getCaseInsensitiveVal(obj: any, candidateKeys: string[]): any {
  if (!obj || typeof obj !== 'object') return undefined;

  // 1. Exact match
  for (const key of candidateKeys) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
      return obj[key];
    }
  }

  // 2. Case-insensitive & symbol-stripped match
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
 * Normalizes raw records from Supabase public."weekly pool picks" / "weekly_picks"
 */
export function normalizeWeeklyPickRecord(raw: any, index: number, defaultWeek = 7): WeeklyPoolPick {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `pick-${index + 1}`,
      pool_no: index + 1,
      bet_code: '',
      home: 'Unknown',
      away: 'Unknown',
      home_win: 2.50,
      draw_x: 3.20,
      away_win: 2.80,
      bet: 'X',
      status: 'Saturday',
      kick_off: '3:00 PM',
      week: defaultWeek,
      is_banker: false,
      notes: ''
    };
  }

  const rawPool = getCaseInsensitiveVal(raw, ['pool', 'pool_no', 'pool_number', 'fixture_no', 'match_no', 'id']);
  const pool_no = rawPool !== undefined && !isNaN(Number(rawPool)) ? Number(rawPool) : (index + 1);

  const bet_code = String(getCaseInsensitiveVal(raw, ['bet_code', 'bet code', 'betcode', 'code', 'booking_code', 'ticket_code']) || '');
  const home = String(getCaseInsensitiveVal(raw, ['home', 'home_team', 'home team', 'hometeam']) || 'Home Team');
  const away = String(getCaseInsensitiveVal(raw, ['away', 'away_team', 'away team', 'awayteam']) || 'Away Team');

  const home_win = getCaseInsensitiveVal(raw, ['home_win', 'home win', 'home_odds', 'homewin', '1']) ?? 2.50;
  const draw_x = getCaseInsensitiveVal(raw, ['draw_x', 'draw (x)', 'draw(x)', 'draw', 'draw_odds', 'x']) ?? 3.20;
  const away_win = getCaseInsensitiveVal(raw, ['away_win', 'away win', 'away_odds', 'awaywin', '2']) ?? 2.80;

  const bet = String(getCaseInsensitiveVal(raw, ['bet', 'tip', 'prediction', 'pick']) || 'X');
  const status = String(getCaseInsensitiveVal(raw, ['status', 'day', 'match_status']) || 'Saturday');
  const kick_off = String(getCaseInsensitiveVal(raw, ['kick_off', 'kick off (w.a.t)', 'kick off', 'kickoff', 'time']) || '3:00 PM');
  
  const rawWeek = getCaseInsensitiveVal(raw, ['week', 'week_number', 'week_no', 'active_week']);
  const week = rawWeek !== undefined && !isNaN(Number(rawWeek)) ? Number(rawWeek) : defaultWeek;

  const is_banker = Boolean(getCaseInsensitiveVal(raw, ['is_banker', 'banker', 'isbanker']));
  const notes = String(getCaseInsensitiveVal(raw, ['notes', 'log', 'comment', 'description']) || '');

  return {
    id: raw.id ?? `pick-${pool_no}_${home}_${away}`,
    pool_no,
    bet_code,
    home,
    away,
    home_win,
    draw_x,
    away_win,
    bet,
    status,
    kick_off,
    week,
    is_banker,
    notes
  };
}

export const DEFAULT_WEEKLY_PICKS: WeeklyPoolPick[] = [
  {
    id: 'pick-1',
    pool_no: 2,
    bet_code: '2110',
    home: 'Everton',
    away: 'Crystal P.',
    home_win: 2.23,
    draw_x: 3.4,
    away_win: 3.35,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: true,
    notes: 'Primary UK Premier League banker draw prediction.'
  },
  {
    id: 'pick-2',
    pool_no: 14,
    bet_code: '4565',
    home: 'Swansea',
    away: 'Sheff Utd.',
    home_win: 2.57,
    draw_x: 3.3,
    away_win: 2.7,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: true,
    notes: 'Championship high-probability draw pairing.'
  },
  {
    id: 'pick-3',
    pool_no: 19,
    bet_code: '1072',
    home: 'Wimbledo',
    away: 'Reading',
    home_win: 2.5,
    draw_x: 3.2,
    away_win: 2.6,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: false,
    notes: 'League One coupon telegraph banker.'
  },
  {
    id: 'pick-4',
    pool_no: 20,
    bet_code: '1221',
    home: 'Bromley',
    away: 'Cambridge',
    home_win: 2.68,
    draw_x: 3.1,
    away_win: 2.5,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: false,
    notes: 'Strong dead game & defensive stalemate indicator.'
  },
  {
    id: 'pick-5',
    pool_no: 30,
    bet_code: '1590',
    home: 'Walsall',
    away: 'Grimsby',
    home_win: 2.57,
    draw_x: 3.05,
    away_win: 2.63,
    bet: 'X',
    status: 'EKO',
    kick_off: '12:30 PM',
    week: 7,
    is_banker: true,
    notes: 'Early Kick Off (EKO) banker draw pick.'
  },
  {
    id: 'pick-6',
    pool_no: 34,
    bet_code: '1641',
    home: 'Fleetwood',
    away: 'Gillingham',
    home_win: 2.13,
    draw_x: 3.25,
    away_win: 3.15,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: false,
    notes: 'High-confidence League Two draw forecast.'
  },
  {
    id: 'pick-7',
    pool_no: 46,
    bet_code: '1893',
    home: 'Parma',
    away: 'Cagliari',
    home_win: 2.62,
    draw_x: 3.05,
    away_win: 2.94,
    bet: 'X',
    status: 'LKO',
    kick_off: '7:45 PM',
    week: 7,
    is_banker: true,
    notes: 'Late Kick Off (LKO) Serie A banker draw pick.'
  }
];

interface WeeklyPoolPicksTableProps {
  currentUser: User;
  activePlan?: SubscriptionPlan;
  isPaidUser: boolean;
  bypassPremium?: boolean;
  activeWeekNumber?: number;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onUpgradeClick: () => void;
}

export default function WeeklyPoolPicksTable({
  currentUser,
  activePlan,
  isPaidUser,
  bypassPremium = false,
  activeWeekNumber = 7,
  triggerToast,
  onUpgradeClick
}: WeeklyPoolPicksTableProps) {
  const [picks, setPicks] = useState<WeeklyPoolPick[]>(() => {
    try {
      const saved = localStorage.getItem('fastpool_weekly_picks_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_WEEKLY_PICKS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [betFilter, setBetFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'pool_asc' | 'pool_desc' | 'draw_desc' | 'draw_asc'>('pool_asc');
  const [copiedCodeId, setCopiedCodeId] = useState<string | number | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  const [selectedPick, setSelectedPick] = useState<WeeklyPoolPick | null>(null);

  // Admin CRUD Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPick, setEditingPick] = useState<Partial<WeeklyPoolPick> | null>(null);

  const isAdmin = currentUser.role === 'admin';
  const hasAccess = isPaidUser || isAdmin || bypassPremium;

  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString());
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false);
  const [sourceTableName, setSourceTableName] = useState<string>('public.weekly pool picks');

  // Load from server or Supabase with real-time support
  const fetchPicks = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      await initSupabaseConfig();
      const supabase = getSupabaseClient();
      let fetchedRows: any[] | null = null;
      let usedTable = 'weekly pool picks';

      // 1. Direct Supabase Query
      if (supabase) {
        try {
          const res1 = await supabase.from('weekly pool picks').select('*').order('pool', { ascending: true });
          if (!res1.error && res1.data && res1.data.length > 0) {
            fetchedRows = res1.data;
            usedTable = 'public.weekly pool picks';
          } else {
            const res2 = await supabase.from('weekly_pool_picks').select('*');
            if (!res2.error && res2.data && res2.data.length > 0) {
              fetchedRows = res2.data;
              usedTable = 'public.weekly_pool_picks';
            } else {
              const res3 = await supabase.from('weekly_picks').select('*');
              if (!res3.error && res3.data && res3.data.length > 0) {
                fetchedRows = res3.data;
                usedTable = 'public.weekly_picks';
              }
            }
          }
        } catch (sbErr) {
          console.warn('[WeeklyPicks] Direct Supabase query error, falling back to API proxy:', sbErr);
        }
      }

      // 2. Server API Route Proxy Fallback
      if (!fetchedRows || fetchedRows.length === 0) {
        try {
          const res = await fetch('/api/tables/weekly_picks');
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
              fetchedRows = json.data;
              usedTable = json.table || 'public.weekly pool picks';
            }
          }
        } catch (apiErr) {
          console.warn('[WeeklyPicks] API fetch fallback error:', apiErr);
        }
      }

      if (fetchedRows && fetchedRows.length > 0) {
        const mapped: WeeklyPoolPick[] = fetchedRows.map((r: any, idx: number) =>
          normalizeWeeklyPickRecord(r, idx, activeWeekNumber)
        );
        setPicks(mapped);
        setSourceTableName(usedTable);
        setLastSyncTime(new Date().toLocaleTimeString());
        localStorage.setItem('fastpool_weekly_picks_data', JSON.stringify(mapped));
        if (!isSilent) {
          triggerToast(`✅ Loaded ${mapped.length} live weekly picks from ${usedTable}`, 'success');
        }
      }
    } catch (err) {
      console.error('[WeeklyPicks] Fetch error:', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [activeWeekNumber, triggerToast]);

  // Real-time WebSocket listener (Event-driven only, no continuous polling)
  useEffect(() => {
    fetchPicks(true);

    let channel: any = null;
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        channel = supabase
          .channel('realtime-weekly-picks-channel')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'weekly pool picks' },
            (payload) => {
              console.log('⚡ Real-time update on public.weekly pool picks:', payload);
              fetchPicks(true);
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'weekly_pool_picks' },
            (payload) => {
              console.log('⚡ Real-time update on public.weekly_pool_picks:', payload);
              fetchPicks(true);
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'weekly_picks' },
            (payload) => {
              console.log('⚡ Real-time update on public.weekly_picks:', payload);
              fetchPicks(true);
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
      console.warn('[WeeklyPicks] WebSocket subscription error:', wsErr);
    }

    return () => {
      if (channel) {
        try {
          const supabase = getSupabaseClient();
          if (supabase) supabase.removeChannel(channel);
        } catch (_) {}
      }
    };
  }, [fetchPicks]);

  // Copy single bet code
  const handleCopyCode = (code: string, id: string | number) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    triggerToast(`Bet Code "${code}" copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Copy all bet codes formatted for ticket booking
  const handleCopyAllCodes = () => {
    const allCodes = filteredPicks.map(p => p.bet_code).filter(Boolean).join(', ');
    if (!allCodes) {
      triggerToast('No bet codes available to copy.', 'info');
      return;
    }
    navigator.clipboard.writeText(allCodes);
    setIsCopiedAll(true);
    triggerToast(`Copied ${filteredPicks.length} bet codes (${allCodes})`, 'success');
    setTimeout(() => setIsCopiedAll(false), 2500);
  };

  // Export official PDF table
  const handleExportPDF = () => {
    if (!hasAccess) {
      triggerToast('Subscriber access required to export weekly pool picks.', 'error');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const primaryEmail = currentUser.email || 'subscriber@fastpoolcodes.com';

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 297, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('FASTPOOLCODES • OFFICIAL WEEKLY POOL PICKS', 14, 12);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Week ${activeWeekNumber} UK Pools Decrypted Banker Draws & Bet Codes Matrix | Generated: ${new Date().toLocaleDateString('en-GB')} | License: @${currentUser.username || 'user'}`, 14, 19);

      // Table columns & rows
      const tableHeaders = [
        ['POOL', 'BET CODE', 'HOME', 'AWAY', 'HOME WIN', 'DRAW (X)', 'AWAY WIN', 'BET', 'STATUS', 'KICK OFF (W.A.T)']
      ];

      const tableData = filteredPicks.map(p => [
        p.pool_no,
        p.bet_code,
        p.home,
        p.away,
        Number(p.home_win).toFixed(2),
        Number(p.draw_x).toFixed(2),
        Number(p.away_win).toFixed(2),
        p.bet || 'X',
        p.status || 'Saturday',
        p.kick_off || '3:00 PM'
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 32,
        theme: 'grid',
        headStyles: {
          fillColor: [16, 185, 129], // emerald-500
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'center'
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          fontSize: 8.5,
          textColor: [15, 23, 42],
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold', fillColor: [248, 250, 252] },
          1: { halign: 'center', fontStyle: 'bold', textColor: [5, 150, 105] },
          2: { halign: 'left', fontStyle: 'bold' },
          3: { halign: 'left', fontStyle: 'bold' },
          4: { halign: 'center' },
          5: { halign: 'center', fontStyle: 'bold', fillColor: [236, 253, 245], textColor: [4, 120, 87] },
          6: { halign: 'center' },
          7: { halign: 'center', fontStyle: 'bold', fillColor: [254, 240, 138], textColor: [133, 77, 14] },
          8: { halign: 'center', fontStyle: 'bold' },
          9: { halign: 'center', fontStyle: 'normal' }
        },
        willDrawPage: () => {
          // Soft security watermark placed strictly BEHIND the table cells and text
          doc.saveGraphicsState();
          doc.setTextColor(248, 250, 252);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          const watermarkText = `FASTPOOLCODES • ${primaryEmail}`;
          for (let x = 15; x < 297; x += 95) {
            for (let y = 35; y < 210; y += 50) {
              doc.text(watermarkText, x, y, { angle: -25 });
            }
          }
          doc.restoreGraphicsState();
        },
        didDrawPage: () => {
          // Official security trace watermark placed in footer BELOW the codes
          doc.setFontSize(6.5);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `FastPoolCodes Official Classified Sheet • Week ${activeWeekNumber} • Licensed to ${primaryEmail} • Single Page Verified Copy`,
            14,
            202
          );
          doc.text(
            'Compiled by Fastpoolcodes.com (Call/WhatsApp: +234 8030587933, +234 9037595705)',
            283,
            202,
            { align: 'right' }
          );
        }
      });

      // Save PDF
      doc.save(`FastPoolCodes_Week_${activeWeekNumber}_Weekly_Pool_Picks.pdf`);
      triggerToast(`Week ${activeWeekNumber} Weekly Pool Picks PDF downloaded successfully!`, 'success');
    } catch (err: any) {
      triggerToast(err?.message || 'Failed to export PDF.', 'error');
    }
  };

  // Filter & Sort
  const filteredPicks = useMemo(() => {
    let list = [...picks];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(p =>
        p.home.toLowerCase().includes(q) ||
        p.away.toLowerCase().includes(q) ||
        String(p.pool_no).includes(q) ||
        String(p.bet_code).includes(q) ||
        p.status.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter(p => p.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (betFilter !== 'all') {
      list = list.filter(p => p.bet.toUpperCase() === betFilter.toUpperCase());
    }

    list.sort((a, b) => {
      if (sortBy === 'pool_asc') return a.pool_no - b.pool_no;
      if (sortBy === 'pool_desc') return b.pool_no - a.pool_no;
      if (sortBy === 'draw_desc') return Number(b.draw_x) - Number(a.draw_x);
      if (sortBy === 'draw_asc') return Number(a.draw_x) - Number(b.draw_x);
      return 0;
    });

    return list;
  }, [picks, searchTerm, statusFilter, betFilter, sortBy]);

  // Admin save pick handler
  const handleSavePick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPick || !editingPick.home || !editingPick.away) {
      triggerToast('Please provide Home and Away team names.', 'error');
      return;
    }

    const newPick: WeeklyPoolPick = {
      id: editingPick.id || `pick-${Date.now()}`,
      pool_no: Number(editingPick.pool_no || 1),
      bet_code: String(editingPick.bet_code || '1000'),
      home: String(editingPick.home).trim(),
      away: String(editingPick.away).trim(),
      home_win: Number(editingPick.home_win || 2.0),
      draw_x: Number(editingPick.draw_x || 3.0),
      away_win: Number(editingPick.away_win || 3.0),
      bet: String(editingPick.bet || 'X').trim().toUpperCase(),
      status: String(editingPick.status || 'Saturday').trim(),
      kick_off: String(editingPick.kick_off || '3:00 PM').trim(),
      week: Number(editingPick.week || activeWeekNumber),
      notes: editingPick.notes || '',
      is_banker: Boolean(editingPick.is_banker)
    };

    const updated = editingPick.id
      ? picks.map(p => (p.id === editingPick.id ? newPick : p))
      : [newPick, ...picks];

    setPicks(updated);
    localStorage.setItem('fastpool_weekly_picks_data', JSON.stringify(updated));
    setIsEditModalOpen(false);
    setEditingPick(null);
    triggerToast(`Weekly pick "${newPick.home} vs ${newPick.away}" saved!`, 'success');
  };

  const handleDeletePick = (id: string | number) => {
    if (!window.confirm('Are you sure you want to remove this weekly pool pick?')) return;
    const updated = picks.filter(p => p.id !== id);
    setPicks(updated);
    localStorage.setItem('fastpool_weekly_picks_data', JSON.stringify(updated));
    triggerToast('Pool pick removed successfully.', 'success');
  };

  const handleResetToDefaults = () => {
    if (!window.confirm('Reset table to official Week 7 default picks?')) return;
    setPicks(DEFAULT_WEEKLY_PICKS);
    localStorage.setItem('fastpool_weekly_picks_data', JSON.stringify(DEFAULT_WEEKLY_PICKS));
    triggerToast('Reset to official Week 7 pool picks.', 'info');
  };

  return (
    <div className="w-full flex flex-col gap-6" id="weekly-pool-picks-section">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0F172A] to-[#0A101D] border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
                <Target className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                Weekly Pool Picks
              </h2>
              <span className="text-[10px] bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider font-mono shadow-sm">
                WEEK {activeWeekNumber}
              </span>
              {hasAccess ? (
                <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                  <Unlock className="w-3 h-3" />
                  VIP SUBSCRIBED ACCESS
                </span>
              ) : (
                <span className="text-[10px] bg-rose-500/20 border border-rose-500/40 text-rose-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  SUBSCRIBER EXCLUSIVE
                </span>
              )}

              {/* Real-time Status Indicator */}
              <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>REAL-TIME LIVE</span>
              </span>

              <span className="px-2.5 py-0.5 bg-slate-800/90 border border-slate-700/60 text-slate-300 font-mono text-[10px] rounded-full flex items-center gap-1.5 hidden sm:inline-flex">
                <Database className="w-3 h-3 text-slate-400" />
                <span>{sourceTableName}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Official decrypted Week {activeWeekNumber} UK Pools banker draw selections, booking codes, match odds, and kickoff times verified for coupon stakers and pools players.
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Fetch Latest Records Button */}
            <button
              onClick={() => fetchPicks(false)}
              disabled={isLoading}
              className="px-3.5 py-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 active:scale-95 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-md"
              title="Fetch latest verified records from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Fetching...' : 'Fetch Latest Records'}</span>
            </button>

            {hasAccess ? (
              <>
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download PDF Sheet</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingPick({
                        pool_no: (picks.length > 0 ? Math.max(...picks.map(p => p.pool_no)) + 1 : 1),
                        bet_code: '',
                        home: '',
                        away: '',
                        home_win: 2.5,
                        draw_x: 3.2,
                        away_win: 2.8,
                        bet: 'X',
                        status: 'Saturday',
                        kick_off: '3:00 PM',
                        week: activeWeekNumber
                      });
                      setIsEditModalOpen(true);
                    }}
                    className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>+ Add Pool Pick</span>
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onUpgradeClick}
                className="px-5 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 active:scale-95 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shadow-xl shadow-amber-500/20"
              >
                <CreditCard className="w-4 h-4 stroke-[2.5]" />
                <span>Subscribe To Unlock Picks</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NON-SUBSCRIBED PAYWALL VIEW */}
      {!hasAccess ? (
        <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-900/60 shadow-2xl p-6 sm:p-10 text-center">
          {/* Blurred Background Table Preview */}
          <div className="absolute inset-0 opacity-15 filter blur-sm pointer-events-none select-none overflow-hidden p-4">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="p-3">POOL</th>
                  <th className="p-3">BET CODE</th>
                  <th className="p-3">HOME</th>
                  <th className="p-3">AWAY</th>
                  <th className="p-3">HOME WIN</th>
                  <th className="p-3">DRAW (X)</th>
                  <th className="p-3">AWAY WIN</th>
                  <th className="p-3">BET</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">KICK OFF</th>
                </tr>
              </thead>
              <tbody>
                {DEFAULT_WEEKLY_PICKS.map((p, idx) => (
                  <tr key={idx} className="border-b border-slate-800 text-slate-300">
                    <td className="p-3 font-mono">{p.pool_no}</td>
                    <td className="p-3 font-mono">{p.bet_code}</td>
                    <td className="p-3">{p.home}</td>
                    <td className="p-3">{p.away}</td>
                    <td className="p-3">{p.home_win}</td>
                    <td className="p-3">{p.draw_x}</td>
                    <td className="p-3">{p.away_win}</td>
                    <td className="p-3">{p.bet}</td>
                    <td className="p-3">{p.status}</td>
                    <td className="p-3">{p.kick_off}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Watermark overlay */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-[0.03] z-0 flex flex-wrap justify-around items-center content-around">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="text-[13px] font-mono font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap select-none p-4 rotate-[-25deg]">
                FASTPOOLCODES • SUBSCRIBER EXCLUSIVE
              </div>
            ))}
          </div>

          {/* Lock Modal Card */}
          <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shadow-2xl shadow-amber-500/20">
              <Lock className="w-8 h-8 text-amber-400 animate-pulse stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
                🔒 SUBSCRIBERS ONLY
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Weekly Pool Picks Are Locked
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                This table contains our high-confidence decrypted UK pool draws, SportyBet & Bet9ja booking codes, early kick-off alerts (EKO), and odds matrix reserved strictly for subscribed VIP members.
              </p>
            </div>

            {/* Highlights bullet points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md text-left text-xs text-slate-200">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified 7-10 Draw Banker Matches</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant 1-Click Bet Code Copy</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>EKO & LKO Time Schedules (W.A.T)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Watermarked Official PDF Export</span>
              </div>
            </div>

            <div className="w-full max-w-md flex flex-col gap-2.5 mt-2">
              <button
                onClick={onUpgradeClick}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/40"
              >
                <CreditCard className="w-4 h-4 stroke-[2.5]" />
                <span>Upgrade To VIP Membership Now</span>
              </button>
              <span className="text-[10px] text-slate-400 font-mono">
                Instant activation • Secure payment via Paystack & Monnify
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* SUBSCRIBED FULL TABLE VIEW */
        <div className="flex flex-col gap-4">
          {/* Controls Bar: Search & Filters */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg backdrop-blur-md">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search pool no, bet code, or team..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs">
                <span className="text-[10px] font-mono text-slate-400 uppercase px-2 font-bold">STATUS:</span>
                {(['all', 'Saturday', 'EKO', 'LKO'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold uppercase transition cursor-pointer ${
                      statusFilter === st
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs">
                <span className="text-[10px] font-mono text-slate-400 uppercase px-2 font-bold">SORT:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="bg-transparent text-[11px] font-mono font-bold text-slate-200 focus:outline-none pr-2 cursor-pointer"
                >
                  <option value="pool_asc" className="bg-slate-900 text-white">Pool # (Asc)</option>
                  <option value="pool_desc" className="bg-slate-900 text-white">Pool # (Desc)</option>
                  <option value="draw_desc" className="bg-slate-900 text-white">Draw Odds (High-Low)</option>
                  <option value="draw_asc" className="bg-slate-900 text-white">Draw Odds (Low-High)</option>
                </select>
              </div>

              {isAdmin && (
                <button
                  onClick={handleResetToDefaults}
                  className="p-2 text-slate-400 hover:text-white bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl transition cursor-pointer"
                  title="Reset to official Week 7 defaults"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Picks</span>
                <span className="text-lg font-black text-white font-mono">{filteredPicks.length} Games</span>
              </div>
              <Trophy className="w-5 h-5 text-emerald-400 opacity-70" />
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Draw Banker (X)</span>
                <span className="text-lg font-black text-amber-400 font-mono">
                  {filteredPicks.filter(p => p.bet === 'X').length} Matches
                </span>
              </div>
              <Sparkles className="w-5 h-5 text-amber-400 opacity-70" />
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Early Kick Off</span>
                <span className="text-lg font-black text-purple-400 font-mono">
                  {filteredPicks.filter(p => p.status === 'EKO').length} EKO
                </span>
              </div>
              <Clock className="w-5 h-5 text-purple-400 opacity-70" />
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Average Draw Odds</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  {filteredPicks.length > 0
                    ? (filteredPicks.reduce((acc, p) => acc + Number(p.draw_x || 0), 0) / filteredPicks.length).toFixed(2)
                    : '3.18'}
                </span>
              </div>
              <Zap className="w-5 h-5 text-emerald-400 opacity-70" />
            </div>
          </div>

          {/* THE DATA TABLE (Exact Structure from User's Spreadsheet) */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse" id="weekly-pool-picks-data-table">
                <thead>
                  <tr className="bg-slate-950/90 text-slate-300 font-mono border-b border-slate-800">
                    <th className="py-3.5 px-4 font-bold text-center w-16 uppercase tracking-wider text-slate-400">POOL</th>
                    <th className="py-3.5 px-4 font-bold text-center w-28 uppercase tracking-wider text-emerald-400">BET CODE</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider">HOME</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider">AWAY</th>
                    <th className="py-3.5 px-3 font-bold text-center w-24 uppercase tracking-wider text-slate-400">HOME WIN</th>
                    <th className="py-3.5 px-3 font-bold text-center w-24 uppercase tracking-wider text-amber-400">DRAW (X)</th>
                    <th className="py-3.5 px-3 font-bold text-center w-24 uppercase tracking-wider text-slate-400">AWAY WIN</th>
                    <th className="py-3.5 px-3 font-bold text-center w-20 uppercase tracking-wider text-yellow-300">BET</th>
                    <th className="py-3.5 px-3 font-bold text-center w-24 uppercase tracking-wider text-slate-400">STATUS</th>
                    <th className="py-3.5 px-4 font-bold text-center w-32 uppercase tracking-wider text-slate-400">KICK OFF (W.A.T)</th>
                    {isAdmin && <th className="py-3.5 px-3 font-bold text-center w-20 uppercase tracking-wider text-slate-500">ACTIONS</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredPicks.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 11 : 10} className="py-12 text-center text-slate-400 font-mono">
                        No weekly pool picks found matching "{searchTerm}".
                      </td>
                    </tr>
                  ) : (
                    filteredPicks.map((pick, idx) => {
                      const isDraw = pick.bet === 'X';
                      const isEKO = pick.status === 'EKO';
                      const isLKO = pick.status === 'LKO';

                      return (
                        <tr
                          key={pick.id || idx}
                          className="hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* 1. POOL */}
                          <td className="py-3 px-4 text-center font-mono">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-950 border border-slate-700/60 text-slate-200 font-black text-xs group-hover:border-emerald-500/40 transition-colors">
                              {pick.pool_no}
                            </span>
                          </td>

                          {/* 2. BET CODE with 1-click copy */}
                          <td className="py-3 px-4 text-center font-mono">
                            <button
                              onClick={() => handleCopyCode(pick.bet_code, pick.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 font-black text-xs tracking-wider transition active:scale-95 cursor-pointer"
                              title="Click to copy Bet Code"
                            >
                              <span>{pick.bet_code}</span>
                              {copiedCodeId === pick.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-emerald-500 opacity-60 group-hover:opacity-100 transition" />
                              )}
                            </button>
                          </td>

                          {/* 3. HOME TEAM */}
                          <td className="py-3 px-4 font-bold text-white text-xs sm:text-sm">
                            <span className="truncate block max-w-[140px] sm:max-w-[180px]">{pick.home}</span>
                          </td>

                          {/* 4. AWAY TEAM */}
                          <td className="py-3 px-4 font-bold text-slate-200 text-xs sm:text-sm">
                            <span className="truncate block max-w-[140px] sm:max-w-[180px]">{pick.away}</span>
                          </td>

                          {/* 5. HOME WIN */}
                          <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                            {Number(pick.home_win).toFixed(2)}
                          </td>

                          {/* 6. DRAW (X) (Highlighted as core banker metric) */}
                          <td className="py-3 px-3 text-center font-mono">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300 font-bold text-xs">
                              {Number(pick.draw_x).toFixed(2)}
                            </span>
                          </td>

                          {/* 7. AWAY WIN */}
                          <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                            {Number(pick.away_win).toFixed(2)}
                          </td>

                          {/* 8. BET RECOMMENDATION */}
                          <td className="py-3 px-3 text-center font-mono">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 font-black text-xs shadow-sm">
                              {pick.bet || 'X'}
                            </span>
                          </td>

                          {/* 9. STATUS (Saturday, EKO, LKO) */}
                          <td className="py-3 px-3 text-center font-mono">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider ${
                                isEKO
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : isLKO
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {pick.status}
                            </span>
                          </td>

                          {/* 10. KICK OFF (W.A.T) */}
                          <td className="py-3 px-4 text-center font-mono text-xs text-slate-300 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-slate-300">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{pick.kick_off}</span>
                            </span>
                          </td>

                          {/* Admin Actions */}
                          {isAdmin && (
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingPick(pick);
                                    setIsEditModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                  title="Edit Pick"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeletePick(pick.id)}
                                  className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 transition cursor-pointer"
                                  title="Delete Pick"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Watermark Trace */}
            <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>FastPoolCodes Official Subscriber Feed • Week {activeWeekNumber} Verified Banker Matches</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Licensed to: <span className="text-slate-300 font-bold">{currentUser.email || `@${currentUser.username}`}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN EDIT / ADD MODAL */}
      {isEditModalOpen && editingPick && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <span>{editingPick.id ? 'Edit Weekly Pool Pick' : 'Add Weekly Pool Pick'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPick(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePick} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">POOL NO</label>
                  <input
                    type="number"
                    required
                    value={editingPick.pool_no || ''}
                    onChange={e => setEditingPick({ ...editingPick, pool_no: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. 2"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">BET CODE</label>
                  <input
                    type="text"
                    required
                    value={editingPick.bet_code || ''}
                    onChange={e => setEditingPick({ ...editingPick, bet_code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. 2110"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">HOME TEAM</label>
                  <input
                    type="text"
                    required
                    value={editingPick.home || ''}
                    onChange={e => setEditingPick({ ...editingPick, home: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. Everton"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">AWAY TEAM</label>
                  <input
                    type="text"
                    required
                    value={editingPick.away || ''}
                    onChange={e => setEditingPick({ ...editingPick, away: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. Crystal P."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">HOME WIN</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPick.home_win || ''}
                    onChange={e => setEditingPick({ ...editingPick, home_win: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="2.23"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">DRAW (X)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPick.draw_x || ''}
                    onChange={e => setEditingPick({ ...editingPick, draw_x: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-300 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                    placeholder="3.40"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">AWAY WIN</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPick.away_win || ''}
                    onChange={e => setEditingPick({ ...editingPick, away_win: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="3.35"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">BET (TIP)</label>
                  <input
                    type="text"
                    value={editingPick.bet || 'X'}
                    onChange={e => setEditingPick({ ...editingPick, bet: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-yellow-300 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                    placeholder="X"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">STATUS</label>
                  <select
                    value={editingPick.status || 'Saturday'}
                    onChange={e => setEditingPick({ ...editingPick, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Saturday">Saturday</option>
                    <option value="EKO">EKO (Early Kick Off)</option>
                    <option value="LKO">LKO (Late Kick Off)</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">KICK OFF (W.A.T)</label>
                  <input
                    type="text"
                    value={editingPick.kick_off || '3:00 PM'}
                    onChange={e => setEditingPick({ ...editingPick, kick_off: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="3:00 PM"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingPick(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold font-mono transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-950/40"
                >
                  Save Pick
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
