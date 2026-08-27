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
  Star,
  X,
  FileSpreadsheet,
  Layers,
  Table as TableIcon
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
  week?: number | string;
  notes?: string;
  is_banker?: boolean;
  [key: string]: any;
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
 * Normalizes raw records from Supabase tables into a standardized WeeklyPoolPick
 */
export function normalizeWeeklyPickRecord(raw: any, index: number, defaultWeek: number | string = 7): WeeklyPoolPick {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `pick-${index + 1}`,
      pool_no: index + 1,
      bet_code: '',
      home: '',
      away: '',
      home_win: '',
      draw_x: '',
      away_win: '',
      bet: '',
      status: '',
      kick_off: '',
      week: defaultWeek,
      is_banker: false,
      notes: ''
    };
  }

  // Exact pool number resolution from DB column 'pool', 'pool_no', etc.
  let pool_no = index + 1;
  if (raw.pool !== undefined && raw.pool !== null && String(raw.pool).trim() !== '' && !isNaN(Number(raw.pool))) {
    pool_no = Number(raw.pool);
  } else if (raw.pool_no !== undefined && raw.pool_no !== null && String(raw.pool_no).trim() !== '' && !isNaN(Number(raw.pool_no))) {
    pool_no = Number(raw.pool_no);
  } else {
    const rawPool = getCaseInsensitiveVal(raw, ['pool', 'pool_no', 'pool_number', 'poolno', 'fixture_no', 'match_no', 'item_no', 'sn', 's_n', 's/n']);
    if (rawPool !== undefined && !isNaN(Number(rawPool))) {
      pool_no = Number(rawPool);
    }
  }

  const bet_code = String(getCaseInsensitiveVal(raw, ['bet_code', 'bet code', 'betcode', 'code', 'booking_code', 'ticket_code', 'event_code', 'game_code']) || '');
  const home = String(getCaseInsensitiveVal(raw, ['home', 'home_team', 'home team', 'hometeam', 'team_1', 'team1', 'fixture_home']) || '');
  const away = String(getCaseInsensitiveVal(raw, ['away', 'away_team', 'away team', 'awayteam', 'team_2', 'team2', 'fixture_away']) || '');

  const home_win = getCaseInsensitiveVal(raw, ['home_win', 'home win', 'home_odds', 'homewin', '1', 'odd_1', 'odds_1', 'home_odd']) ?? '';
  const draw_x = getCaseInsensitiveVal(raw, ['draw_x', 'draw (x)', 'draw(x)', 'draw', 'draw_odds', 'x', 'odd_x', 'odds_x', 'draw_odd']) ?? '';
  const away_win = getCaseInsensitiveVal(raw, ['away_win', 'away win', 'away_odds', 'awaywin', '2', 'odd_2', 'odds_2', 'away_odd']) ?? '';

  const bet = String(getCaseInsensitiveVal(raw, ['bet', 'tip', 'prediction', 'pick', 'recommendation', 'selection', 'forecast']) || '');
  const status = String(getCaseInsensitiveVal(raw, ['status', 'day', 'match_status', 'match_day', 'game_status']) || '');
  const kick_off = String(getCaseInsensitiveVal(raw, ['kick_off', 'kick off (w.a.t)', 'kick off', 'kickoff', 'time', 'match_time', 'start_time']) || '');
  
  const rawWeek = getCaseInsensitiveVal(raw, ['week', 'week_number', 'week_no', 'active_week', 'wk']);
  const week = rawWeek !== undefined && !isNaN(Number(rawWeek)) ? Number(rawWeek) : defaultWeek;

  const is_banker = Boolean(
    raw.is_banker === true ||
    raw.is_banker === 'true' ||
    raw.banker === true ||
    raw.banker === 'true' ||
    raw.banker === 1 ||
    raw.is_banker === 1 ||
    getCaseInsensitiveVal(raw, ['is_banker', 'banker', 'isbanker', 'top_banker']) === true
  );
  const notes = String(getCaseInsensitiveVal(raw, ['notes', 'log', 'comment', 'description', 'analysis', 'rationale', 'remark', 'details']) || '');

  return {
    ...raw,
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
    id: 1,
    pool_no: 2,
    bet_code: '2110',
    home: 'Everton',
    away: 'Crystal P.',
    home_win: 2.23,
    draw_x: 3.40,
    away_win: 3.35,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: false,
    notes: 'Premier League fixture draw candidate'
  },
  {
    id: 2,
    pool_no: 14,
    bet_code: '4565',
    home: 'Swansea',
    away: 'Sheff Utd.',
    home_win: 2.57,
    draw_x: 3.30,
    away_win: 2.70,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: false,
    notes: 'Championship high-probability draw pairing'
  },
  {
    id: 3,
    pool_no: 19,
    bet_code: '1072',
    home: 'Wimbledon',
    away: 'Reading',
    home_win: 2.50,
    draw_x: 3.20,
    away_win: 2.60,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: true,
    notes: 'League One statistical draw forecast'
  },
  {
    id: 4,
    pool_no: 20,
    bet_code: '1221',
    home: 'Bromley',
    away: 'Cambridge U.',
    home_win: 2.68,
    draw_x: 3.10,
    away_win: 2.50,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: false,
    notes: 'League One balanced coupon match'
  },
  {
    id: 5,
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
    notes: 'Early Kick Off (EKO 12:30 PM) League Two prediction'
  },
  {
    id: 6,
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
    notes: 'League Two key pairing'
  },
  {
    id: 7,
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
    is_banker: false,
    notes: 'Late Kick Off (LKO 7:45 PM) Serie A draw selection'
  }
];

export const DEFAULT_BET9JA_WEEKLY_PICKS: WeeklyPoolPick[] = [
  {
    id: '9ja-1',
    pool_no: 2,
    bet_code: '9JA-2110',
    home: 'Everton',
    away: 'Crystal P.',
    home_win: 2.23,
    draw_x: 3.40,
    away_win: 3.35,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: true,
    notes: 'Bet9ja Premier League Week 7 Top Banker Draw Forecast'
  },
  {
    id: '9ja-2',
    pool_no: 14,
    bet_code: '9JA-4565',
    home: 'Swansea',
    away: 'Sheff Utd.',
    home_win: 2.57,
    draw_x: 3.30,
    away_win: 2.70,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: false,
    notes: 'Bet9ja Championship High-Probability Draw Pairing'
  },
  {
    id: '9ja-3',
    pool_no: 19,
    bet_code: '9JA-1072',
    home: 'Wimbledon',
    away: 'Reading',
    home_win: 2.50,
    draw_x: 3.20,
    away_win: 2.60,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: true,
    notes: 'Bet9ja League One Key Forecast Banker'
  },
  {
    id: '9ja-4',
    pool_no: 20,
    bet_code: '9JA-1221',
    home: 'Bromley',
    away: 'Cambridge U.',
    home_win: 2.68,
    draw_x: 3.10,
    away_win: 2.50,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: false,
    notes: 'Bet9ja Balanced Coupon Pick'
  },
  {
    id: '9ja-5',
    pool_no: 30,
    bet_code: '9JA-1590',
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
    notes: 'Bet9ja Early Kick Off (EKO 12:30 PM) Draw Alert'
  },
  {
    id: '9ja-6',
    pool_no: 34,
    bet_code: '9JA-1641',
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
    notes: 'Bet9ja League Two Coupon Pairing'
  },
  {
    id: '9ja-7',
    pool_no: 46,
    bet_code: '9JA-1893',
    home: 'Parma',
    away: 'Cagliari',
    home_win: 2.62,
    draw_x: 3.05,
    away_win: 2.94,
    bet: 'X',
    status: 'LKO',
    kick_off: '7:45 PM',
    week: 7,
    is_banker: false,
    notes: 'Bet9ja Late Kick Off (LKO 7:45 PM) Serie A Draw Selection'
  }
];

export const DEFAULT_BETKING_WEEKLY_PICKS: WeeklyPoolPick[] = [
  {
    id: 'bk-1',
    pool_no: 3,
    bet_code: 'BK-8901',
    home: 'Middlesbrough',
    away: 'Lincoln',
    home_win: 2.15,
    draw_x: 3.45,
    away_win: 3.20,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: true,
    notes: 'BetKing Week 7 High Yield Banker'
  },
  {
    id: 'bk-2',
    pool_no: 7,
    bet_code: 'BK-4421',
    home: 'Sheff Utd.',
    away: 'Birmingham',
    home_win: 2.45,
    draw_x: 3.25,
    away_win: 2.80,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: true,
    notes: 'BetKing Championship Selection'
  },
  {
    id: 'bk-3',
    pool_no: 11,
    bet_code: 'BK-7712',
    home: 'Blackpool',
    away: 'Wycombe',
    home_win: 2.30,
    draw_x: 3.35,
    away_win: 2.95,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: false,
    notes: 'BetKing League One Draw Candidate'
  },
  {
    id: 'bk-4',
    pool_no: 13,
    bet_code: 'BK-3390',
    home: 'Burton A.',
    away: 'Stevenage',
    home_win: 2.60,
    draw_x: 3.15,
    away_win: 2.65,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: false,
    notes: 'BetKing Balanced Coupon'
  },
  {
    id: 'bk-5',
    pool_no: 21,
    bet_code: 'BK-9182',
    home: 'R. Santander',
    away: 'Villarreal',
    home_win: 2.70,
    draw_x: 3.10,
    away_win: 2.55,
    bet: 'X',
    status: 'EKO',
    kick_off: '1:00 PM',
    week: 7,
    is_banker: true,
    notes: 'BetKing Early Kick Off Banker'
  },
  {
    id: 'bk-6',
    pool_no: 25,
    bet_code: 'BK-5520',
    home: 'Stoke',
    away: 'Swansea',
    home_win: 2.40,
    draw_x: 3.30,
    away_win: 2.85,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 7,
    is_banker: false,
    notes: 'BetKing Championship Draw'
  },
  {
    id: 'bk-7',
    pool_no: 42,
    bet_code: 'BK-6611',
    home: 'Sevilla',
    away: 'R. Vallecano',
    home_win: 2.50,
    draw_x: 3.20,
    away_win: 2.75,
    bet: 'X',
    status: 'LKO',
    kick_off: '8:00 PM',
    week: 7,
    is_banker: false,
    notes: 'BetKing Late Kick Off Selection'
  }
];

export interface WeeklyPoolPicksTableProps {
  currentUser: User;
  activePlan?: SubscriptionPlan;
  isPaidUser: boolean;
  bypassPremium?: boolean;
  activeWeekNumber?: number | string;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onUpgradeClick: () => void;
  tableName?: string;
  tableDisplayName?: string;
  bookmakerBrand?: 'bet9ja' | 'betking' | 'general';
}

export default function WeeklyPoolPicksTable({
  currentUser,
  activePlan,
  isPaidUser,
  bypassPremium = false,
  activeWeekNumber = 7,
  triggerToast,
  onUpgradeClick,
  tableName = 'weekly pool picks',
  tableDisplayName = 'Weekly Pool Picks',
  bookmakerBrand = 'general'
}: WeeklyPoolPicksTableProps) {
  // Select appropriate default dataset based on bookmaker
  const defaultDataset = useMemo(() => {
    if (bookmakerBrand === 'bet9ja') return DEFAULT_BET9JA_WEEKLY_PICKS;
    if (bookmakerBrand === 'betking') return DEFAULT_BETKING_WEEKLY_PICKS;
    return DEFAULT_WEEKLY_PICKS;
  }, [bookmakerBrand]);

  const storageKey = `fastpool_${bookmakerBrand}_weekly_picks_data`;

  const [picks, setPicks] = useState<WeeklyPoolPick[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (_) {}
    return [];
  });

  // Store raw rows directly from DB to support displaying all dynamic columns
  const [rawRows, setRawRows] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (_) {}
    return [];
  });

  const [viewMode, setViewMode] = useState<'standard' | 'all_columns'>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [betFilter, setBetFilter] = useState<string>('all');
  const [bankerFilter, setBankerFilter] = useState<string>('all');
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
  const [sourceTableName, setSourceTableName] = useState<string>(tableName);

  // Dynamically extract all column names across all raw records
  const allColumns = useMemo(() => {
    if (!rawRows || rawRows.length === 0) return [];
    const keys = new Set<string>();
    rawRows.forEach((r) => {
      if (r && typeof r === 'object') {
        Object.keys(r).forEach((k) => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [rawRows]);

  // Brand visual accents
  const brandTheme = useMemo(() => {
    if (bookmakerBrand === 'bet9ja') {
      return {
        badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        brandName: 'Bet9ja',
        brandColor: 'text-emerald-400',
        accentBg: 'bg-emerald-500',
        headerGrad: 'from-emerald-950/80 via-[#0F1E17] to-slate-950',
        borderAccent: 'border-emerald-500/30'
      };
    }
    if (bookmakerBrand === 'betking') {
      return {
        badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
        brandName: 'BetKing',
        brandColor: 'text-amber-400',
        accentBg: 'bg-blue-600',
        headerGrad: 'from-blue-950/80 via-[#0E1B2E] to-slate-950',
        borderAccent: 'border-blue-500/30'
      };
    }
    return {
      badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      brandName: 'All Pools',
      brandColor: 'text-emerald-400',
      accentBg: 'bg-emerald-500',
      headerGrad: 'from-slate-900 via-[#0F172A] to-[#0A101D]',
      borderAccent: 'border-emerald-500/30'
    };
  }, [bookmakerBrand]);

  // Determine candidate table names for fetching
  const candidateTableNames = useMemo(() => {
    if (bookmakerBrand === 'bet9ja') {
      return [
        tableName,
        'weekly pool picks(Bet9ja)',
        'weekly pool picks (Bet9ja)',
        'weekly pool picks(bet9ja)',
        'weekly pool picks (bet9ja)',
        'weekly_pool_picks_bet9ja',
        'weekly_picks_bet9ja',
        'weekly pool picks bet9ja',
        'bet9ja_weekly_pool_picks',
        'bet9ja'
      ];
    }
    if (bookmakerBrand === 'betking') {
      return [
        tableName,
        'weekly pool picks(betking)',
        'weekly pool picks (betking)',
        'weekly pool picks(Betking)',
        'weekly pool picks (Betking)',
        'weekly_pool_picks_betking',
        'weekly_picks_betking',
        'weekly pool picks betking',
        'betking_weekly_pool_picks',
        'betking'
      ];
    }
    return [
      tableName,
      'weekly pool picks',
      'weekly_pool_picks',
      'weekly_picks',
      'pool_picks'
    ];
  }, [bookmakerBrand, tableName]);

  // Load from server or Supabase with real-time support (fetching all rows & all columns)
  const fetchPicks = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setIsLoading(true);
      try {
        await initSupabaseConfig();
        const supabase = getSupabaseClient();
        let fetchedRows: any[] | null = null;
        let usedTable = tableName;

        // 1. Direct Supabase Query across candidate tables
        if (supabase) {
          for (const cand of candidateTableNames) {
            try {
              const res = await supabase.from(cand).select('*');
              if (!res.error && res.data && res.data.length > 0) {
                fetchedRows = res.data;
                usedTable = `public."${cand}"`;
                break;
              }
            } catch (_) {}
          }
        }

        // 2. Server API Route Proxy Fallback
        if (!fetchedRows || fetchedRows.length === 0) {
          const apiEndpoints = [
            `/api/tables/${encodeURIComponent(tableName)}`,
            bookmakerBrand === 'bet9ja' ? '/api/tables/weekly_pool_picks_bet9ja' : null,
            bookmakerBrand === 'betking' ? '/api/tables/weekly_pool_picks_betking' : null,
            '/api/tables/weekly_picks'
          ].filter(Boolean) as string[];

          for (const endpoint of apiEndpoints) {
            try {
              const res = await fetch(endpoint);
              if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                  fetchedRows = json.data;
                  usedTable = json.table || tableName;
                  break;
                }
              }
            } catch (apiErr) {
              console.warn(`[WeeklyPicks ${bookmakerBrand}] API fetch error on ${endpoint}:`, apiErr);
            }
          }
        }

        if (fetchedRows && fetchedRows.length > 0) {
          setRawRows(fetchedRows);
          const mapped: WeeklyPoolPick[] = fetchedRows.map((r: any, idx: number) =>
            normalizeWeeklyPickRecord(r, idx, activeWeekNumber)
          );
          // Default sort by pool ascending
          mapped.sort((a, b) => a.pool_no - b.pool_no);
          setPicks(mapped);
          setSourceTableName(usedTable);
          setLastSyncTime(new Date().toLocaleTimeString());
          localStorage.setItem(storageKey, JSON.stringify(mapped));
          if (!isSilent) {
            triggerToast(`✅ Loaded ${mapped.length} live records from ${usedTable}`, 'success');
          }
        } else {
          // If table in the database is empty, leave it completely empty
          setRawRows([]);
          setPicks([]);
          setSourceTableName(usedTable);
          localStorage.setItem(storageKey, JSON.stringify([]));
          if (!isSilent) {
            triggerToast(`Table is currently empty in database.`, 'info');
          }
        }
      } catch (err) {
        console.error(`[WeeklyPicks ${bookmakerBrand}] Fetch error:`, err);
      } finally {
        if (!isSilent) setIsLoading(false);
      }
    },
    [activeWeekNumber, bookmakerBrand, candidateTableNames, defaultDataset, storageKey, tableName, triggerToast]
  );

  // Real-time WebSocket listener (Event-driven only, no continuous polling)
  useEffect(() => {
    fetchPicks(true);

    let channel: any = null;
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const channelName = `realtime-${bookmakerBrand}-picks-channel`;
        channel = supabase.channel(channelName);

        candidateTableNames.slice(0, 3).forEach((cand) => {
          channel = channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: cand },
            (payload: any) => {
              console.log(`⚡ Real-time update on ${cand}:`, payload);
              fetchPicks(true);
            }
          );
        });

        channel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            setRealtimeConnected(true);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setRealtimeConnected(false);
          }
        });
      }
    } catch (wsErr) {
      console.warn(`[WeeklyPicks ${bookmakerBrand}] WebSocket subscription error:`, wsErr);
    }

    return () => {
      if (channel) {
        try {
          const supabase = getSupabaseClient();
          if (supabase) supabase.removeChannel(channel);
        } catch (_) {}
      }
    };
  }, [bookmakerBrand, candidateTableNames, fetchPicks]);

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
    const allCodes = filteredPicks.map((p) => p.bet_code).filter(Boolean).join(', ');
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
      doc.text(`FASTPOOLCODES • ${tableDisplayName.toUpperCase()}`, 14, 12);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        `Week ${activeWeekNumber} Verified Banker Draws & Bet Codes Matrix | Generated: ${new Date().toLocaleDateString(
          'en-GB'
        )} | License: @${currentUser.username || 'user'}`,
        14,
        19
      );

      // Table columns & rows matching strictly the bookmaker tables
      const tableHeaders = [
        ['POOL', 'BET CODE', 'HOME', 'AWAY', 'HOME WIN', 'DRAW (X)', 'AWAY WIN', 'BET', 'STATUS', 'KICK OFF (W.A.T)']
      ];

      const tableData = filteredPicks.map((p) => [
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

      const headerColor: [number, number, number] = bookmakerBrand === 'betking' ? [37, 99, 235] : [16, 185, 129];

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 32,
        theme: 'grid',
        headStyles: {
          fillColor: headerColor,
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
          0: { halign: 'center', fontStyle: 'bold' },
          1: { halign: 'center', fontStyle: 'bold', textColor: [5, 150, 105] },
          2: { halign: 'left', fontStyle: 'bold' },
          3: { halign: 'left', fontStyle: 'bold' },
          4: { halign: 'center' },
          5: { halign: 'center', fontStyle: 'bold', textColor: [4, 120, 87] },
          6: { halign: 'center' },
          7: { halign: 'center', fontStyle: 'bold', textColor: [133, 77, 14] },
          8: { halign: 'center', fontStyle: 'bold' },
          9: { halign: 'center', fontStyle: 'normal' }
        },
        willDrawPage: () => {
          doc.saveGraphicsState();
          doc.setTextColor(240, 244, 248);
          doc.setFontSize(10.5);
          doc.setFont('helvetica', 'normal');
          const watermarkText = `FASTPOOLCODES • ${primaryEmail}`;
          for (let x = -20; x < 320; x += 150) {
            for (let y = 30; y < 220; y += 70) {
              doc.text(watermarkText, x, y, { angle: -25 });
            }
          }
          doc.restoreGraphicsState();
        },
        didDrawPage: () => {
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

      doc.save(`FastPoolCodes_Week_${activeWeekNumber}_${tableDisplayName.replace(/[\s()]+/g, '_')}.pdf`);
      triggerToast(`Week ${activeWeekNumber} ${tableDisplayName} PDF downloaded successfully!`, 'success');
    } catch (err: any) {
      triggerToast(err?.message || 'Failed to export PDF.', 'error');
    }
  };

  // Export CSV of ALL Columns and ALL Rows
  const handleExportCSV = () => {
    if (!hasAccess) {
      triggerToast('Subscriber access required to export CSV data.', 'error');
      return;
    }

    try {
      if (!rawRows || rawRows.length === 0) {
        triggerToast('No rows available to export.', 'info');
        return;
      }

      const headers = allColumns.length > 0 ? allColumns : ['pool_no', 'bet_code', 'home', 'away', 'home_win', 'draw_x', 'away_win', 'bet', 'status', 'kick_off', 'week', 'notes'];
      const csvRows = [headers.join(',')];

      rawRows.forEach((row) => {
        const values = headers.map((header) => {
          const val = row[header] ?? '';
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `FastPoolCodes_Week_${activeWeekNumber}_${tableDisplayName.replace(/[\s()]+/g, '_')}_AllColumns.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerToast(`Exported ${rawRows.length} rows (${headers.length} columns) to CSV!`, 'success');
    } catch (err: any) {
      triggerToast(err?.message || 'Failed to export CSV.', 'error');
    }
  };

  // Filter & Sort for Standard Sheet View
  const filteredPicks = useMemo(() => {
    let list = [...picks];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.home.toLowerCase().includes(q) ||
          p.away.toLowerCase().includes(q) ||
          String(p.pool_no).includes(q) ||
          String(p.bet_code).includes(q) ||
          p.status.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (betFilter !== 'all') {
      list = list.filter((p) => p.bet.toUpperCase() === betFilter.toUpperCase());
    }

    if (bankerFilter === 'bankers') {
      list = list.filter((p) => p.is_banker === true);
    }

    list.sort((a, b) => {
      if (sortBy === 'pool_asc') return a.pool_no - b.pool_no;
      if (sortBy === 'pool_desc') return b.pool_no - a.pool_no;
      if (sortBy === 'draw_desc') return Number(b.draw_x) - Number(a.draw_x);
      if (sortBy === 'draw_asc') return Number(a.draw_x) - Number(b.draw_x);
      return 0;
    });

    return list;
  }, [picks, searchTerm, statusFilter, betFilter, bankerFilter, sortBy]);

  // Filter for All Columns Grid View
  const filteredRawRows = useMemo(() => {
    if (!searchTerm.trim()) return rawRows;
    const q = searchTerm.toLowerCase().trim();
    return rawRows.filter((r) => {
      if (!r || typeof r !== 'object') return false;
      return Object.values(r).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rawRows, searchTerm]);

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
      ? picks.map((p) => (p.id === editingPick.id ? newPick : p))
      : [newPick, ...picks];

    setPicks(updated);
    setRawRows(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setIsEditModalOpen(false);
    setEditingPick(null);
    triggerToast(`Weekly pick "${newPick.home} vs ${newPick.away}" saved!`, 'success');
  };

  const handleDeletePick = (id: string | number) => {
    if (!window.confirm('Are you sure you want to remove this weekly pool pick?')) return;
    const updated = picks.filter((p) => p.id !== id);
    setPicks(updated);
    setRawRows(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    triggerToast('Pool pick removed successfully.', 'success');
  };

  const handleResetToDefaults = () => {
    if (!window.confirm(`Reset table to official Week ${activeWeekNumber} default picks for ${tableDisplayName}?`)) return;
    setPicks(defaultDataset);
    setRawRows(defaultDataset);
    localStorage.setItem(storageKey, JSON.stringify(defaultDataset));
    triggerToast(`Reset to official Week ${activeWeekNumber} ${tableDisplayName}.`, 'info');
  };

  return (
    <div className="w-full flex flex-col gap-6" id={`weekly-pool-picks-${bookmakerBrand}-section`}>
      {/* Top Banner & Header */}
      <div className={`bg-gradient-to-r ${brandTheme.headerGrad} border ${brandTheme.borderAccent} rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl ${bookmakerBrand === 'betking' ? 'bg-gradient-to-br from-blue-400 to-indigo-600' : 'bg-gradient-to-br from-emerald-400 to-teal-600'} text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20`}>
                <Target className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                {tableDisplayName}
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
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* View Mode Toggle: Standard Coupon Sheet vs All Columns DB Grid */}
            <div className="inline-flex rounded-xl bg-slate-950/80 p-1 border border-slate-800">
              <button
                onClick={() => setViewMode('standard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                  viewMode === 'standard'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Coupon Sheet</span>
              </button>
              <button
                onClick={() => setViewMode('all_columns')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                  viewMode === 'all_columns'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Columns ({allColumns.length})</span>
              </button>
            </div>

            {/* Fetch Latest Records Button */}
            <button
              onClick={() => fetchPicks(false)}
              disabled={isLoading}
              className="px-3.5 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 active:scale-95 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-md"
              title="Fetch latest verified records from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Fetching...' : 'Fetch Latest'}</span>
            </button>

            {hasAccess ? (
              <>
                <button
                  onClick={handleExportPDF}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Export PDF</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                  title="Export all rows and all columns as CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CSV (All Columns)</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingPick({
                        pool_no: picks.length + 1,
                        bet_code: '',
                        home: '',
                        away: '',
                        home_win: 2.5,
                        draw_x: 3.2,
                        away_win: 2.8,
                        bet: 'X',
                        status: 'Saturday',
                        kick_off: '3:00 PM',
                        week: activeWeekNumber,
                        is_banker: false
                      });
                      setIsEditModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Pick</span>
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onUpgradeClick}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-950/40"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Unlock VIP Access</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PAYWALL OVERLAY OR DATA TABLE */}
      {!hasAccess ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              VIP Subscriber Restricted Area
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              The {tableDisplayName} database feed contains high-confidence decrypted UK Pools draw candidates, direct {brandTheme.brandName} booking codes, and odds analysis reserved exclusively for VIP subscribers.
            </p>
          </div>

          {/* Preview Locked Rows Preview */}
          <div className="max-w-xl mx-auto bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5 blur-[2.5px] opacity-40 select-none pointer-events-none">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span>Pool 2 • Code 9JA-2110</span>
              <span className="text-emerald-400 font-mono">Everton vs Crystal P. (X)</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span>Pool 14 • Code 9JA-4565</span>
              <span className="text-emerald-400 font-mono">Swansea vs Sheff Utd. (X)</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Pool 19 • Code 9JA-1072</span>
              <span className="text-emerald-400 font-mono">Wimbledon vs Reading (X)</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onUpgradeClick}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-xl shadow-emerald-950/40 cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Subscribe to VIP Access</span>
            </button>
            <button
              onClick={() => fetchPicks(false)}
              className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs font-mono uppercase tracking-wider transition cursor-pointer"
            >
              Check Subscription Status
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Controls, Search, Filter & Quick Copy Toolbar */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${tableDisplayName}...`}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 font-mono focus:outline-none cursor-pointer"
                >
                  <option value="all">All Match Days</option>
                  <option value="saturday">Saturday</option>
                  <option value="eko">EKO (Early Kick Off)</option>
                  <option value="lko">LKO (Late Kick Off)</option>
                  <option value="sunday">Sunday</option>
                </select>
              </div>

              {/* Banker Filter */}
              <button
                onClick={() => setBankerFilter(bankerFilter === 'bankers' ? 'all' : 'bankers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                  bankerFilter === 'bankers'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Top Bankers Only</span>
              </button>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="pool_asc">Sort: Pool # (Asc)</option>
                <option value="pool_desc">Sort: Pool # (Desc)</option>
                <option value="draw_desc">Sort: Draw Odds (High-Low)</option>
                <option value="draw_asc">Sort: Draw Odds (Low-High)</option>
              </select>
            </div>

            {/* Quick Actions Right */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAllCodes}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Copy all bet codes into clipboard for bulk ticket load"
              >
                {isCopiedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">All Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy All Codes</span>
                  </>
                )}
              </button>

              {isAdmin && (
                <button
                  onClick={handleResetToDefaults}
                  className="px-3 py-2 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-xl text-xs font-mono transition"
                  title="Reset to default picks"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* VIEW MODE 1: STANDARD COUPON SHEET */}
          {viewMode === 'standard' && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id={`weekly-picks-${bookmakerBrand}-table`}>
                  <thead>
                    <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-3 text-center w-16">POOL</th>
                      <th className="py-3.5 px-3 text-center w-28">BET CODE</th>
                      <th className="py-3.5 px-4 text-left">HOME TEAM</th>
                      <th className="py-3.5 px-4 text-left">AWAY TEAM</th>
                      <th className="py-3.5 px-3 text-center w-20">1 (HOME)</th>
                      <th className="py-3.5 px-3 text-center w-24 text-emerald-400 bg-emerald-950/30 font-black">X (DRAW)</th>
                      <th className="py-3.5 px-3 text-center w-20">2 (AWAY)</th>
                      <th className="py-3.5 px-3 text-center w-16">BET</th>
                      <th className="py-3.5 px-3 text-center w-28">STATUS</th>
                      <th className="py-3.5 px-3 text-center w-28">KICK OFF (W.A.T)</th>
                      {isAdmin && <th className="py-3.5 px-3 text-center w-20">ADMIN</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredPicks.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 11 : 10} className="py-12 text-center text-slate-400 font-mono">
                          <AlertCircle className="w-6 h-6 mx-auto text-slate-600 mb-2" />
                          <span>No matches found matching your current filter.</span>
                        </td>
                      </tr>
                    ) : (
                      filteredPicks.map((pick, idx) => {
                        const isCopied = copiedCodeId === pick.id;
                        const isEKO = pick.status?.toUpperCase().includes('EKO');
                        const isLKO = pick.status?.toUpperCase().includes('LKO');

                        return (
                          <tr
                            key={pick.id || idx}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              pick.is_banker ? 'bg-amber-500/[0.03]' : idx % 2 === 0 ? 'bg-[#0F172A]' : 'bg-[#0B1322]'
                            }`}
                          >
                            {/* 1. POOL NUMBER */}
                            <td className="py-3 px-3 text-center font-mono font-black">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs">
                                {pick.pool_no}
                              </span>
                            </td>

                            {/* 2. BET CODE */}
                            <td className="py-3 px-3 text-center font-mono">
                              {pick.bet_code ? (
                                <button
                                  onClick={() => handleCopyCode(pick.bet_code, pick.id)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] transition cursor-pointer"
                                  title="Click to copy bet code"
                                >
                                  <span>{pick.bet_code}</span>
                                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-emerald-500" />}
                                </button>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>

                            {/* 3. HOME TEAM */}
                            <td className="py-3 px-4 font-bold text-slate-100">
                              <div className="flex items-center gap-2">
                                {pick.is_banker && (
                                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Banker Draw Pick" />
                                )}
                                <span>{pick.home}</span>
                              </div>
                            </td>

                            {/* 4. AWAY TEAM */}
                            <td className="py-3 px-4 font-bold text-slate-200">
                              <span>{pick.away}</span>
                            </td>

                            {/* 5. HOME WIN */}
                            <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                              {pick.home_win !== undefined && pick.home_win !== null && pick.home_win !== '' && !isNaN(Number(pick.home_win))
                                ? Number(pick.home_win).toFixed(2)
                                : <span className="text-slate-600">—</span>}
                            </td>

                            {/* 6. DRAW (X) */}
                            <td className="py-3 px-3 text-center font-mono font-black text-xs text-emerald-400 bg-emerald-950/20 border-x border-emerald-500/10">
                              {pick.draw_x !== undefined && pick.draw_x !== null && pick.draw_x !== '' && !isNaN(Number(pick.draw_x))
                                ? Number(pick.draw_x).toFixed(2)
                                : <span className="text-slate-600">—</span>}
                            </td>

                            {/* 7. AWAY WIN */}
                            <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                              {pick.away_win !== undefined && pick.away_win !== null && pick.away_win !== '' && !isNaN(Number(pick.away_win))
                                ? Number(pick.away_win).toFixed(2)
                                : <span className="text-slate-600">—</span>}
                            </td>

                            {/* 8. BET RECOMMENDATION */}
                            <td className="py-3 px-3 text-center font-mono">
                              {pick.bet ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 font-black text-xs shadow-sm">
                                  {pick.bet}
                                </span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>

                            {/* 9. STATUS */}
                            <td className="py-3 px-3 text-center font-mono">
                              {pick.status ? (
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
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>

                            {/* 10. KICK OFF */}
                            <td className="py-3 px-3 text-center font-mono text-xs text-slate-300 whitespace-nowrap">
                              {pick.kick_off ? (
                                <span className="inline-flex items-center gap-1 text-slate-300">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>{pick.kick_off}</span>
                                </span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
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

              {/* Table Footer with Trace */}
              <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>FastPoolCodes Official Subscriber Feed • Week {activeWeekNumber} Verified {tableDisplayName} Matches</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Licensed to: <span className="text-slate-300 font-bold">{currentUser.email || `@${currentUser.username}`}</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: ALL COLUMNS & ALL ROWS RAW DATA GRID */}
          {viewMode === 'all_columns' && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>
                    Rendering <strong>{filteredRawRows.length}</strong> rows across <strong>{allColumns.length}</strong> table columns from <code>{sourceTableName}</code>
                  </span>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Full Columns CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-950 shadow">
                    <tr className="border-b border-slate-800 text-[10.5px] font-mono uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-3 text-center bg-slate-950 w-12">#</th>
                      {allColumns.map((col) => (
                        <th key={col} className="py-3 px-3 text-left whitespace-nowrap bg-slate-950">
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11.5px]">
                    {filteredRawRows.length === 0 ? (
                      <tr>
                        <td colSpan={allColumns.length + 1} className="py-10 text-center text-slate-500">
                          No records match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRawRows.map((row, idx) => (
                        <tr key={row?.id || idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                          {allColumns.map((col) => {
                            const val = row[col];
                            const isDraw = col.toLowerCase().includes('draw') || col === 'x';
                            const isCode = col.toLowerCase().includes('code');
                            return (
                              <td
                                key={col}
                                className={`py-2.5 px-3 whitespace-nowrap ${
                                  isDraw
                                    ? 'text-emerald-400 font-bold bg-emerald-950/20'
                                    : isCode
                                    ? 'text-yellow-300 font-bold'
                                    : 'text-slate-300'
                                }`}
                              >
                                {val !== undefined && val !== null ? String(val) : <span className="text-slate-600">—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADMIN EDIT / ADD MODAL */}
      {isEditModalOpen && editingPick && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <span>{editingPick.id ? `Edit ${tableDisplayName} Pick` : `Add ${tableDisplayName} Pick`}</span>
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
                    onChange={(e) => setEditingPick({ ...editingPick, pool_no: Number(e.target.value) })}
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
                    onChange={(e) => setEditingPick({ ...editingPick, bet_code: e.target.value })}
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
                    onChange={(e) => setEditingPick({ ...editingPick, home: e.target.value })}
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
                    onChange={(e) => setEditingPick({ ...editingPick, away: e.target.value })}
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
                    onChange={(e) => setEditingPick({ ...editingPick, home_win: Number(e.target.value) })}
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
                    onChange={(e) => setEditingPick({ ...editingPick, draw_x: Number(e.target.value) })}
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
                    onChange={(e) => setEditingPick({ ...editingPick, away_win: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="3.35"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">BET</label>
                  <input
                    type="text"
                    value={editingPick.bet || 'X'}
                    onChange={(e) => setEditingPick({ ...editingPick, bet: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-yellow-300 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                    placeholder="X"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">STATUS</label>
                  <select
                    value={editingPick.status || 'Saturday'}
                    onChange={(e) => setEditingPick({ ...editingPick, status: e.target.value })}
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
                    onChange={(e) => setEditingPick({ ...editingPick, kick_off: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="3:00 PM"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_banker_checkbox"
                  checked={Boolean(editingPick.is_banker)}
                  onChange={(e) => setEditingPick({ ...editingPick, is_banker: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="is_banker_checkbox" className="text-xs text-slate-300 font-mono cursor-pointer">
                  Mark as High-Confidence Banker Pick
                </label>
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
