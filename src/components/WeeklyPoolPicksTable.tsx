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
  Upload,
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
  Table as TableIcon,
  History,
  BookOpen,
  TrendingUp,
  Archive,
  Eye,
  Share2,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, SubscriptionPlan, PoolPicksHistoryEdition } from '../types';
import { getSupabaseClient, initSupabaseConfig } from '../lib/supabase';
import { downloadBookmakerAdminPdf } from '../lib/adminPdfHelper';
import { INITIAL_POOL_PICKS_HISTORY } from '../lib/poolPicksHistoryData';
import PoolPicksCsvModal from './PoolPicksCsvModal';

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
export function normalizeWeeklyPickRecord(
  raw: any,
  index: number,
  defaultWeek: number | string = 7,
  defaultBookmaker: string = 'general'
): WeeklyPoolPick {
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
      notes: '',
      bookmaker: defaultBookmaker
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

  const rawBankerVal = getCaseInsensitiveVal(raw, ['is_banker', 'banker', 'isbanker', 'top_banker', 'is_banker_draw']);
  const is_banker = Boolean(
    raw.is_banker === true ||
    raw.is_banker === 'true' ||
    raw.is_banker === 'TRUE' ||
    raw.is_banker === 't' ||
    raw.is_banker === 1 ||
    raw.is_banker === '1' ||
    raw.banker === true ||
    raw.banker === 'true' ||
    raw.banker === 'TRUE' ||
    raw.banker === 1 ||
    rawBankerVal === true ||
    String(rawBankerVal || '').trim().toLowerCase() === 'true' ||
    String(rawBankerVal || '').trim().toLowerCase() === 't' ||
    String(rawBankerVal || '').trim() === '1' ||
    (raw.notes && /banker|nap/i.test(raw.notes))
  );
  const notes = String(getCaseInsensitiveVal(raw, ['notes', 'log', 'comment', 'description', 'analysis', 'rationale', 'remark', 'details']) || '');
  const rawBookie = getCaseInsensitiveVal(raw, ['bookmaker', 'bookie', 'provider', 'brand', 'bookmaker_brand']);
  const bookmaker = String(rawBookie || defaultBookmaker || '').toLowerCase();

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
    week_no: raw.week_no !== undefined ? raw.week_no : week,
    is_banker,
    notes,
    bookmaker
  };
}

export const DEFAULT_WEEKLY_PICKS: WeeklyPoolPick[] = [
  {
    id: 1,
    pool_no: 1,
    bet_code: '1592',
    home: 'Brentford',
    away: 'Liverpool',
    home_win: 2.48,
    draw_x: 3.70,
    away_win: 2.70,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'Premier League Week 16 high odds draw candidate'
  },
  {
    id: 2,
    pool_no: 7,
    bet_code: '2175',
    home: 'Derby',
    away: 'Stoke City',
    home_win: 2.50,
    draw_x: 3.15,
    away_win: 2.90,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'Championship balanced coupon fixture'
  },
  {
    id: 3,
    pool_no: 22,
    bet_code: '2273',
    home: 'Accrington',
    away: 'Gillingham',
    home_win: 2.35,
    draw_x: 3.40,
    away_win: 2.80,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'League Two statistical draw selection'
  },
  {
    id: 4,
    pool_no: 23,
    bet_code: '2341',
    home: 'Colchester',
    away: 'Exeter City',
    home_win: 2.05,
    draw_x: 3.35,
    away_win: 3.40,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'League One coupon pairing pick'
  },
  {
    id: 5,
    pool_no: 30,
    bet_code: '2355',
    home: 'Swindon Town',
    away: 'Walsall',
    home_win: 2.65,
    draw_x: 3.35,
    away_win: 2.46,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'League Two balanced odds draw prediction'
  },
  {
    id: 6,
    pool_no: 34,
    bet_code: '2678',
    home: 'Kilmarnock',
    away: 'Motherwell',
    home_win: 3.30,
    draw_x: 3.70,
    away_win: 2.06,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'Scottish Premiership key pairing'
  },
  {
    id: 7,
    pool_no: 38,
    bet_code: '2760',
    home: 'Morton',
    away: "Queen's Park",
    home_win: 2.66,
    draw_x: 3.15,
    away_win: 2.67,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'Scottish Championship tight pairing'
  },
  {
    id: 8,
    pool_no: 41,
    bet_code: '2764',
    home: 'East Fife',
    away: 'Alloa Athletic',
    home_win: 2.45,
    draw_x: 3.10,
    away_win: 2.86,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: true,
    notes: '★ TOP BANKER DRAW (NAP) Week 16 selection'
  }
];

export const DEFAULT_BET9JA_WEEKLY_PICKS: WeeklyPoolPick[] = [
  {
    id: '9ja-1',
    pool_no: 1,
    bet_code: '1592',
    home: 'Brentford',
    away: 'Liverpool',
    home_win: 2.48,
    draw_x: 3.70,
    away_win: 2.70,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'Bet9ja Premier League Week 16 high odds draw candidate'
  },
  {
    id: '9ja-2',
    pool_no: 7,
    bet_code: '2175',
    home: 'Derby',
    away: 'Stoke City',
    home_win: 2.50,
    draw_x: 3.15,
    away_win: 2.90,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'Bet9ja Championship balanced coupon fixture'
  },
  {
    id: '9ja-3',
    pool_no: 22,
    bet_code: '2273',
    home: 'Accrington',
    away: 'Gillingham',
    home_win: 2.35,
    draw_x: 3.40,
    away_win: 2.80,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'Bet9ja League Two statistical draw selection'
  },
  {
    id: '9ja-4',
    pool_no: 23,
    bet_code: '2341',
    home: 'Colchester',
    away: 'Exeter City',
    home_win: 2.05,
    draw_x: 3.35,
    away_win: 3.40,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'Bet9ja League One coupon pairing pick'
  },
  {
    id: '9ja-5',
    pool_no: 30,
    bet_code: '2355',
    home: 'Swindon Town',
    away: 'Walsall',
    home_win: 2.65,
    draw_x: 3.35,
    away_win: 2.46,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'Bet9ja League Two balanced odds draw prediction'
  },
  {
    id: '9ja-6',
    pool_no: 34,
    bet_code: '2678',
    home: 'Kilmarnock',
    away: 'Motherwell',
    home_win: 3.30,
    draw_x: 3.70,
    away_win: 2.06,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'Bet9ja Scottish Premiership key pairing'
  },
  {
    id: '9ja-7',
    pool_no: 38,
    bet_code: '2422',
    home: 'Tranmere',
    away: 'Morecambe',
    home_win: 2.15,
    draw_x: 3.45,
    away_win: 3.10,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: true,
    notes: '★ CONFIRMED BANKER DRAW Tranmere vs Morecambe'
  },
  {
    id: '9ja-8',
    pool_no: 41,
    bet_code: '2764',
    home: 'East Fife',
    away: 'Alloa Athletic',
    home_win: 2.45,
    draw_x: 3.10,
    away_win: 2.86,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: true,
    notes: '★ TOP BANKER DRAW (NAP) Bet9ja Week 16 selection'
  },
  {
    id: '9ja-9',
    pool_no: 42,
    bet_code: '2460',
    home: 'Crewe',
    away: 'Doncaster',
    home_win: 2.40,
    draw_x: 3.30,
    away_win: 2.85,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: true,
    notes: '★ CONFIRMED BANKER DRAW Crewe vs Doncaster stalemate'
  },
  {
    id: '9ja-10',
    pool_no: 49,
    bet_code: '2548',
    home: 'Bromley',
    away: 'Salford City',
    home_win: 2.60,
    draw_x: 3.30,
    away_win: 2.55,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: true,
    notes: '★ KEY BANKER COUPON CLOSER Bromley vs Salford'
  }
].map((p) => ({ ...p, bookmaker: 'bet9ja', week_no: p.week }));

export const DEFAULT_BETKING_WEEKLY_PICKS: WeeklyPoolPick[] = [
  {
    id: 'bk-1',
    pool_no: 1,
    bet_code: 'BK-1592',
    home: 'Brentford',
    away: 'Liverpool',
    home_win: 2.48,
    draw_x: 3.70,
    away_win: 2.70,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'BetKing Premier League Week 16 draw candidate'
  },
  {
    id: 'bk-2',
    pool_no: 7,
    bet_code: 'BK-2175',
    home: 'Derby',
    away: 'Stoke City',
    home_win: 2.50,
    draw_x: 3.15,
    away_win: 2.90,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'BetKing Championship coupon pick'
  },
  {
    id: 'bk-3',
    pool_no: 22,
    bet_code: 'BK-2273',
    home: 'Accrington',
    away: 'Gillingham',
    home_win: 2.35,
    draw_x: 3.40,
    away_win: 2.80,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'BetKing League Two selection'
  },
  {
    id: 'bk-4',
    pool_no: 23,
    bet_code: 'BK-2341',
    home: 'Colchester',
    away: 'Exeter City',
    home_win: 2.05,
    draw_x: 3.35,
    away_win: 3.40,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'BetKing League One coupon pairing'
  },
  {
    id: 'bk-5',
    pool_no: 30,
    bet_code: 'BK-2355',
    home: 'Swindon Town',
    away: 'Walsall',
    home_win: 2.65,
    draw_x: 3.35,
    away_win: 2.46,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'BetKing League Two balanced odds draw pick'
  },
  {
    id: 'bk-6',
    pool_no: 34,
    bet_code: 'BK-2678',
    home: 'Kilmarnock',
    away: 'Motherwell',
    home_win: 3.30,
    draw_x: 3.70,
    away_win: 2.06,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: false,
    notes: 'BetKing Scottish Premiership key selection'
  },
  {
    id: 'bk-7',
    pool_no: 38,
    bet_code: 'BK-2422',
    home: 'Tranmere',
    away: 'Morecambe',
    home_win: 2.18,
    draw_x: 3.42,
    away_win: 3.12,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: true,
    notes: '★ CONFIRMED BANKER DRAW BetKing Tranmere vs Morecambe'
  },
  {
    id: 'bk-8',
    pool_no: 41,
    bet_code: 'BK-2764',
    home: 'East Fife',
    away: 'Alloa Athletic',
    home_win: 2.45,
    draw_x: 3.10,
    away_win: 2.86,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: true,
    notes: '★ TOP BANKER DRAW (NAP) BetKing Week 16 selection'
  },
  {
    id: 'bk-9',
    pool_no: 42,
    bet_code: 'BK-2460',
    home: 'Crewe',
    away: 'Doncaster',
    home_win: 2.42,
    draw_x: 3.28,
    away_win: 2.88,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: true,
    notes: '★ CONFIRMED BANKER DRAW BetKing Crewe vs Doncaster'
  },
  {
    id: 'bk-10',
    pool_no: 49,
    bet_code: 'BK-2548',
    home: 'Bromley',
    away: 'Salford City',
    home_win: 2.58,
    draw_x: 3.32,
    away_win: 2.58,
    bet: 'X',
    status: 'Saturday',
    kick_off: '3:00 PM',
    week: 16,
    is_banker: true,
    notes: '★ KEY BANKER COUPON CLOSER BetKing Bromley vs Salford'
  }
].map((p) => ({ ...p, bookmaker: 'betking', week_no: p.week }));

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
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (bookmakerBrand === 'bet9ja') {
            const only9ja = parsed.filter(
              (p) => !String(p.bet_code || '').toLowerCase().startsWith('bk-') &&
                     (!p.bookmaker || String(p.bookmaker).toLowerCase().includes('bet9ja'))
            );
            if (only9ja.length > 0) return only9ja;
          } else if (bookmakerBrand === 'betking') {
            const onlyKing = parsed.filter(
              (p) => !String(p.bet_code || '').toLowerCase().startsWith('9ja-') &&
                     (!p.bookmaker || String(p.bookmaker).toLowerCase().includes('betking'))
            );
            if (onlyKing.length > 0) return onlyKing;
          } else {
            return parsed;
          }
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (bookmakerBrand === 'bet9ja') {
            const only9ja = parsed.filter(
              (p) => !String(p.bet_code || '').toLowerCase().startsWith('bk-') &&
                     (!p.bookmaker || String(p.bookmaker).toLowerCase().includes('bet9ja'))
            );
            if (only9ja.length > 0) return only9ja;
          } else if (bookmakerBrand === 'betking') {
            const onlyKing = parsed.filter(
              (p) => !String(p.bet_code || '').toLowerCase().startsWith('9ja-') &&
                     (!p.bookmaker || String(p.bookmaker).toLowerCase().includes('betking'))
            );
            if (onlyKing.length > 0) return onlyKing;
          } else {
            return parsed;
          }
        }
      }
    } catch (_) {}
    return [];
  });

  const [viewMode, setViewMode] = useState<'standard' | 'all_columns'>('standard');
  const [activeTab, setActiveTab] = useState<'table' | 'history'>('table');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [betFilter, setBetFilter] = useState<string>('all');
  const [bankerFilter, setBankerFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'pool_asc' | 'pool_desc' | 'draw_desc' | 'draw_asc'>('pool_asc');
  const [copiedCodeId, setCopiedCodeId] = useState<string | number | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  const [selectedPick, setSelectedPick] = useState<WeeklyPoolPick | null>(null);

  // Pool Picks History state (historical weekly editions archive like the blog)
  const historyStorageKey = `fastpool_${bookmakerBrand}_pool_picks_history`;
  const [historyEditions, setHistoryEditions] = useState<PoolPicksHistoryEdition[]>(() => {
    try {
      const saved = localStorage.getItem(historyStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return INITIAL_POOL_PICKS_HISTORY;
  });

  const [selectedHistoryEditionId, setSelectedHistoryEditionId] = useState<string | null>(null);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historySeasonFilter, setHistorySeasonFilter] = useState('all');
  const [showSaveHistoryModal, setShowSaveHistoryModal] = useState(false);
  const [newHistoryTitle, setNewHistoryTitle] = useState('');
  const [newHistorySummary, setNewHistorySummary] = useState('');
  const [newHistorySuccessRate, setNewHistorySuccessRate] = useState('85%');
  const [newHistoryDrawsHit, setNewHistoryDrawsHit] = useState('4 / 5 Draws Hit');

  // Selected historical edition (null means viewing current active week)
  const activeHistoryEdition = useMemo(() => {
    if (!selectedHistoryEditionId) return null;
    return historyEditions.find((h) => h.id === selectedHistoryEditionId) || null;
  }, [selectedHistoryEditionId, historyEditions]);

  // Load history from backend on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/pool-picks/history');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.history) && json.history.length > 0) {
            setHistoryEditions(json.history);
            try {
              localStorage.setItem(historyStorageKey, JSON.stringify(json.history));
            } catch (_) {}
          }
        }
      } catch (_) {}
    };
    fetchHistory();
  }, [historyStorageKey]);

  // Admin CRUD Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPick, setEditingPick] = useState<Partial<WeeklyPoolPick> | null>(null);
  const [showCsvUploadModal, setShowCsvUploadModal] = useState(false);

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

  // Dynamically determine the active database table columns to render strictly reflecting the database
  const activeDbColumns = useMemo(() => {
    const presentKeys = new Set<string>();
    if (rawRows && rawRows.length > 0) {
      rawRows.forEach((r) => {
        if (r && typeof r === 'object') {
          Object.keys(r).forEach((k) => presentKeys.add(k));
        }
      });
    }

    // Canonical priority ordering matching the Supabase database table schema:
    // pool_no, pool, bet_code, home, away, home_win, draw_x, away_win, bet, status, kick_off, is_banker, week_no, week, bookmaker, notes, league
    const canonicalOrder = [
      'pool_no',
      'pool',
      'bet_code',
      'home',
      'away',
      'home_win',
      'draw_x',
      'away_win',
      'bet',
      'status',
      'kick_off',
      'is_banker',
      'week_no',
      'week',
      'bookmaker',
      'notes',
      'league'
    ];

    if (presentKeys.size > 0) {
      const cols: string[] = [];
      canonicalOrder.forEach((col) => {
        if (presentKeys.has(col)) {
          // If pool_no is present in DB, do not also show duplicate alias pool
          if (col === 'pool' && presentKeys.has('pool_no')) return;
          // If week_no is present in DB, do not also show duplicate alias week
          if (col === 'week' && presentKeys.has('week_no')) return;
          // Filter out internal system timestamps and raw id from coupon view
          if (col === 'created_at' || col === 'updated_at' || col === 'id') return;
          cols.push(col);
        }
      });
      // Append any other user-defined columns in the database table
      presentKeys.forEach((k) => {
        if (!canonicalOrder.includes(k) && k !== 'created_at' && k !== 'updated_at' && k !== 'id') {
          cols.push(k);
        }
      });
      if (cols.length > 0) return cols;
    }

    // Default fallback to exact database table columns:
    return [
      'pool_no',
      'bet_code',
      'home',
      'away',
      'home_win',
      'draw_x',
      'away_win',
      'bet',
      'status',
      'kick_off',
      'is_banker',
      'week_no',
      'bookmaker'
    ];
  }, [rawRows]);

  const renderCellContent = (
    col: string,
    pick: WeeklyPoolPick,
    isCopied: boolean,
    isBanker: boolean,
    bookieName: string,
    weekNum: any
  ) => {
    const val = (pick as any)[col];

    switch (col) {
      case 'id':
        return (
          <span className="text-slate-500 font-mono text-xs font-semibold">
            {val !== undefined && val !== null ? String(val) : '—'}
          </span>
        );

      case 'pool_no':
      case 'pool':
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/80 text-white font-mono text-xs font-bold shadow-xs">
            {val ?? pick.pool_no ?? pick.pool}
          </span>
        );

      case 'bet_code':
      case 'code':
        return val ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyCode(String(val), pick.id);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] transition cursor-pointer"
            title="Click to copy bet code"
          >
            <span>{String(val)}</span>
            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-emerald-500/70" />}
          </button>
        ) : (
          <span className="text-slate-600">—</span>
        );

      case 'home':
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {isBanker && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Banker Draw" />
            )}
            <span className="font-bold text-slate-100">{String(val || '')}</span>
          </div>
        );

      case 'away':
        return (
          <span className="font-bold text-slate-200 whitespace-nowrap">{String(val || '')}</span>
        );

      case 'home_win':
      case 'away_win':
        return (
          <span className="text-slate-300 font-mono">
            {val !== undefined && val !== null && val !== '' && !isNaN(Number(val))
              ? Number(val).toString()
              : <span className="text-slate-600">—</span>}
          </span>
        );

      case 'draw_x':
      case 'x':
        return (
          <span className="font-bold text-emerald-400 font-mono">
            {val !== undefined && val !== null && val !== '' && !isNaN(Number(val))
              ? Number(val).toString()
              : <span className="text-slate-600">—</span>}
          </span>
        );

      case 'bet':
        return (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded font-black text-[11px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
            {val || 'X'}
          </span>
        );

      case 'status':
        return (
          <span className="text-slate-300 whitespace-nowrap">
            {val || 'Saturday'}
          </span>
        );

      case 'kick_off':
        return (
          <span className="text-slate-300 whitespace-nowrap font-mono text-[11.5px]">
            {val || '3:00 PM'}
          </span>
        );

      case 'is_banker':
      case 'banker':
        return isBanker ? (
          <span className="inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black border border-amber-500/40">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            <span>TRUE</span>
          </span>
        ) : (
          <span className="inline-block text-[10.5px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-medium border border-slate-800">
            FALSE
          </span>
        );

      case 'week_no':
      case 'week':
        return (
          <span className="font-bold text-slate-300 font-mono">
            {val ?? weekNum}
          </span>
        );

      case 'bookmaker':
        return (
          <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold whitespace-nowrap ${
            String(val || bookieName).includes('bet9ja')
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
              : 'bg-blue-950/60 text-blue-300 border border-blue-500/30'
          }`}>
            {String(val || bookieName)}
          </span>
        );

      default:
        return (
          <span className="text-slate-300 font-mono">
            {val !== undefined && val !== null ? String(val) : <span className="text-slate-600">—</span>}
          </span>
        );
    }
  };

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
        'weekly pool picks (Bet9ja)',
        'weekly pool picks(Bet9ja)',
        'weekly_pool_picks_bet9ja',
        'picks_bet9ja',
        'weekly_picks_bet9ja',
        'weekly pool picks bet9ja',
        'bet9ja_weekly_pool_picks',
        'pool_picks'
      ];
    }
    if (bookmakerBrand === 'betking') {
      return [
        'weekly pool picks(betking)',
        'weekly pool picks (betking)',
        'weekly pool picks(Betking)',
        'weekly pool picks (Betking)',
        'weekly_pool_picks_betking',
        'picks_betking',
        'weekly_picks_betking',
        'weekly pool picks betking',
        'betking_weekly_pool_picks',
        'pool_picks'
      ];
    }
    return [
      tableName,
      'pool_picks',
      'weekly pool picks',
      'weekly_pool_picks',
      'weekly_picks'
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

        // Helper filter to guarantee complete bookmaker isolation
        const filterByBookmaker = (records: any[]): any[] => {
          if (!Array.isArray(records)) return [];
          if (bookmakerBrand === 'bet9ja') {
            return records.filter((r: any) => {
              const b = String(r.bookmaker || '').toLowerCase();
              const code = String(r.bet_code || '').toLowerCase();
              if (b && !b.includes('bet9ja')) return false;
              if (code.startsWith('bk-') || code.includes('betking')) return false;
              return true;
            });
          }
          if (bookmakerBrand === 'betking') {
            return records.filter((r: any) => {
              const b = String(r.bookmaker || '').toLowerCase();
              const code = String(r.bet_code || '').toLowerCase();
              if (b && !b.includes('betking')) return false;
              if (code.startsWith('9ja-') || code.includes('bet9ja')) return false;
              return true;
            });
          }
          return records;
        };

        // 1. Direct Supabase Query across candidate tables
        if (supabase) {
          for (const cand of candidateTableNames) {
            try {
              let query = supabase.from(cand).select('*');
              if (cand === 'pool_picks' && bookmakerBrand !== 'general') {
                query = query.ilike('bookmaker', `%${bookmakerBrand}%`);
              }
              const res = await query;
              if (!res.error && res.data && res.data.length > 0) {
                const validRows = filterByBookmaker(res.data);
                if (validRows.length > 0) {
                  fetchedRows = validRows;
                  usedTable = `public."${cand}"`;
                  break;
                }
              }
            } catch (_) {}
          }
        }

        // 2. Server API Route Proxy Fallback
        if (!fetchedRows || fetchedRows.length === 0) {
          const apiEndpoints = [
            `/api/tables/${encodeURIComponent(tableName)}`,
            bookmakerBrand === 'bet9ja' ? '/api/tables/weekly%20pool%20picks%20(Bet9ja)' : null,
            bookmakerBrand === 'bet9ja' ? '/api/tables/weekly%20pool%20picks(Bet9ja)' : null,
            bookmakerBrand === 'bet9ja' ? '/api/tables/weekly_pool_picks_bet9ja' : null,
            bookmakerBrand === 'bet9ja' ? '/api/tables/picks_bet9ja' : null,
            bookmakerBrand === 'betking' ? '/api/tables/weekly%20pool%20picks(betking)' : null,
            bookmakerBrand === 'betking' ? '/api/tables/weekly%20pool%20picks%20(betking)' : null,
            bookmakerBrand === 'betking' ? '/api/tables/weekly_pool_picks_betking' : null,
            bookmakerBrand === 'betking' ? '/api/tables/picks_betking' : null,
            bookmakerBrand !== 'general' ? `/api/tables/pool_picks?bookmaker=${bookmakerBrand}` : '/api/tables/pool_picks'
          ].filter(Boolean) as string[];

          for (const endpoint of apiEndpoints) {
            try {
              const res = await fetch(endpoint);
              if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                  const validRows = filterByBookmaker(json.data);
                  if (validRows.length > 0) {
                    fetchedRows = validRows;
                    usedTable = json.table || tableName;
                    break;
                  }
                }
              }
            } catch (apiErr) {
              console.warn(`[WeeklyPicks ${bookmakerBrand}] API fetch error on ${endpoint}:`, apiErr);
            }
          }
        }

        if (fetchedRows && fetchedRows.length > 0) {
          const finalRows = filterByBookmaker(fetchedRows);
          setRawRows(finalRows);
          const mapped: WeeklyPoolPick[] = finalRows.map((r: any, idx: number) =>
            normalizeWeeklyPickRecord(r, idx, activeWeekNumber, bookmakerBrand)
          );
          // Default sort by pool ascending
          mapped.sort((a, b) => a.pool_no - b.pool_no);
          setPicks(mapped);
          setSourceTableName(usedTable);
          setLastSyncTime(new Date().toLocaleTimeString());
          localStorage.setItem(storageKey, JSON.stringify(mapped));
          if (!isSilent) {
            triggerToast(`✅ Loaded ${mapped.length} records from ${usedTable}`, 'success');
          }
        } else {
          // If table in the database is empty or not yet seeded, check localStorage or defaultDataset
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const isolated = filterByBookmaker(parsed);
                if (isolated.length > 0) {
                  setPicks(isolated);
                  setRawRows(isolated);
                  return;
                }
              }
            } catch (_) {}
          }
          if (defaultDataset && defaultDataset.length > 0) {
            setPicks(defaultDataset);
            setRawRows(defaultDataset);
            localStorage.setItem(storageKey, JSON.stringify(defaultDataset));
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

  // Listen for admin CSV upload events to auto-refresh live table
  useEffect(() => {
    const handlePicksUpdated = (e: any) => {
      const detail = e?.detail;
      if (detail) {
        if (
          !detail.bookmaker ||
          detail.bookmaker === bookmakerBrand ||
          detail.bookmaker === 'all' ||
          (bookmakerBrand === 'general' && (detail.bookmaker === 'general' || detail.bookmaker === 'master'))
        ) {
          fetchPicks(true);
        }
      } else {
        fetchPicks(true);
      }
    };
    window.addEventListener('fastpool_pool_picks_updated', handlePicksUpdated);
    return () => window.removeEventListener('fastpool_pool_picks_updated', handlePicksUpdated);
  }, [bookmakerBrand, fetchPicks]);

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

      // Dynamically resolve week number from the current bookmaker table's rows/picks
      const effectiveWeek = (() => {
        const fromFiltered = filteredPicks.find(p => p.week !== undefined && p.week !== null && String(p.week).trim() !== '' && String(p.week).toUpperCase() !== 'NULL')?.week;
        if (fromFiltered !== undefined && fromFiltered !== null) return String(fromFiltered).replace(/^week\s*/i, '').trim();

        const fromPicks = picks.find(p => p.week !== undefined && p.week !== null && String(p.week).trim() !== '' && String(p.week).toUpperCase() !== 'NULL')?.week;
        if (fromPicks !== undefined && fromPicks !== null) return String(fromPicks).replace(/^week\s*/i, '').trim();

        if (Array.isArray(rawRows)) {
          for (const r of rawRows) {
            const rawWk = r?.week_no ?? r?.weekno ?? r?.week_number ?? r?.weekNumber ?? r?.week;
            if (rawWk !== undefined && rawWk !== null && String(rawWk).trim() !== '' && String(rawWk).toUpperCase() !== 'NULL') {
              return String(rawWk).replace(/^week\s*/i, '').trim();
            }
          }
        }
        return (activeWeekNumber && activeWeekNumber !== 'NULL') ? String(activeWeekNumber).replace(/^week\s*/i, '').trim() : '10';
      })();

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 297, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`FASTPOOLCODES • ${tableDisplayName.toUpperCase()}`, 14, 12);

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // high contrast pure white bold text
      doc.text(
        `Week ${effectiveWeek} Verified Banker Draws & Bet Codes Matrix | Generated: ${new Date().toLocaleDateString(
          'en-GB'
        )} | License: @${currentUser.username || 'user'}`,
        14,
        20
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

      const headerColor: [number, number, number] = bookmakerBrand === 'betking' ? [30, 64, 175] : [6, 95, 70];

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 32,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          textColor: [0, 0, 0],
          lineWidth: 0.3,
          lineColor: [15, 23, 42]
        },
        headStyles: {
          fillColor: headerColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          font: 'helvetica',
          halign: 'center',
          cellPadding: [2.2, 1.5],
          lineWidth: 0.35,
          lineColor: [0, 0, 0]
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: 'bold',
          font: 'helvetica',
          textColor: [0, 0, 0],
          halign: 'center',
          cellPadding: [2.0, 1.5],
          lineWidth: 0.28,
          lineColor: [15, 23, 42]
        },
        didParseCell: (hookData) => {
          const rawHead = String(
            hookData.column.raw || 
            (hookData.table.head && hookData.table.head[0] && (hookData.table.head[0][hookData.column.index]?.content || hookData.table.head[0][hookData.column.index])) || 
            ''
          ).replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

          const targetCols = ['pool', 'bet code', 'league', 'home', 'away', '1', 'x', '2', 'bet tips', 'bet', 'status', 'kick off', 'week no'];
          const matched = targetCols.some(t => rawHead === t || rawHead.startsWith(t) || t.startsWith(rawHead));

          if (matched) {
            hookData.cell.styles.font = 'helvetica';
            hookData.cell.styles.fontStyle = 'bold';
            if (hookData.section === 'head') {
              hookData.cell.styles.fontSize = 9.2;
            } else if (hookData.section === 'body') {
              hookData.cell.styles.fontSize = 8.5;
            }
          }
        },
        alternateRowStyles: {
          fillColor: [241, 245, 249]
        },
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0], cellWidth: 16 },
          1: { halign: 'center', fontStyle: 'bold', textColor: [4, 120, 87], cellWidth: 24 },
          2: { halign: 'left', fontStyle: 'bold', textColor: [0, 0, 0], cellWidth: 46 },
          3: { halign: 'left', fontStyle: 'bold', textColor: [0, 0, 0], cellWidth: 46 },
          4: { halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0], cellWidth: 23 },
          5: { halign: 'center', fontStyle: 'bold', textColor: [4, 120, 87], cellWidth: 23 },
          6: { halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0], cellWidth: 23 },
          7: { halign: 'center', fontStyle: 'bold', textColor: [180, 83, 9], cellWidth: 18 },
          8: { halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0], cellWidth: 26 },
          9: { halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0], cellWidth: 26 }
        },
        willDrawPage: () => {
          doc.saveGraphicsState();
          doc.setTextColor(240, 244, 248);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          const watermarkText = `FASTPOOLCODES • ${primaryEmail}`;
          for (let x = -20; x < 320; x += 150) {
            for (let y = 30; y < 220; y += 70) {
              doc.text(watermarkText, x, y, { angle: -25 });
            }
          }
          doc.restoreGraphicsState();
        },
        didDrawPage: () => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.2);
          doc.setTextColor(0, 0, 0);
          doc.text(
            `FastPoolCodes Official Classified Sheet • Week ${effectiveWeek} • Licensed to ${primaryEmail} • Single Page Verified Copy`,
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

      doc.save(`FastPoolCodes_Week_${effectiveWeek}_${tableDisplayName.replace(/[\s()]+/g, '_')}.pdf`);
      triggerToast(`Week ${effectiveWeek} ${tableDisplayName} PDF downloaded successfully!`, 'success');
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

  // Effective picks: if viewing a historical edition, show its picks; otherwise show active picks (strictly isolated by bookmakerBrand)
  const effectivePicks = useMemo(() => {
    let base: WeeklyPoolPick[];
    if (activeHistoryEdition && Array.isArray(activeHistoryEdition.picks) && activeHistoryEdition.picks.length > 0) {
      base = activeHistoryEdition.picks;
    } else {
      base = picks.length > 0 ? picks : defaultDataset;
    }

    if (bookmakerBrand === 'bet9ja') {
      return base.filter((p) => {
        const b = String(p.bookmaker || '').toLowerCase();
        const code = String(p.bet_code || '').toLowerCase();
        if (b && !b.includes('bet9ja')) return false;
        if (code.startsWith('bk-') || code.includes('betking')) return false;
        return true;
      });
    }

    if (bookmakerBrand === 'betking') {
      return base.filter((p) => {
        const b = String(p.bookmaker || '').toLowerCase();
        const code = String(p.bet_code || '').toLowerCase();
        if (b && !b.includes('betking')) return false;
        if (code.startsWith('9ja-') || code.includes('bet9ja')) return false;
        return true;
      });
    }

    return base;
  }, [activeHistoryEdition, picks, defaultDataset, bookmakerBrand]);

  // Export specific historical edition to CSV
  const exportEditionToCSV = (edition: PoolPicksHistoryEdition) => {
    try {
      const headers = ['pool_no', 'bet_code', 'home', 'away', 'home_win', 'draw_x', 'away_win', 'bet', 'status', 'kick_off', 'week', 'is_banker', 'notes'];
      const rows = (edition.picks || []).map((p) => [
        p.pool_no,
        `"${p.bet_code}"`,
        `"${p.home}"`,
        `"${p.away}"`,
        p.home_win,
        p.draw_x,
        p.away_win,
        `"${p.bet || 'X'}"`,
        `"${p.status || 'Saturday'}"`,
        `"${p.kick_off || '3:00 PM'}"`,
        edition.week_number,
        p.is_banker ? 'TRUE' : 'FALSE',
        `"${(p.notes || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `FastPoolCodes_Week_${edition.week_number}_PoolPicks_History.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast(`Exported Week ${edition.week_number} historical pool picks to CSV!`, 'success');
    } catch (_) {
      triggerToast('Could not export historical CSV.', 'error');
    }
  };

  // Filtered historical editions for archive browsing
  const filteredHistoryEditions = useMemo(() => {
    return historyEditions.filter((h) => {
      if (historySeasonFilter !== 'all' && h.season && !h.season.includes(historySeasonFilter)) {
        return false;
      }
      if (!historySearchTerm.trim()) return true;
      const q = historySearchTerm.toLowerCase().trim();
      return (
        String(h.week_number).includes(q) ||
        (h.edition_title && h.edition_title.toLowerCase().includes(q)) ||
        (h.summary && h.summary.toLowerCase().includes(q)) ||
        (h.draws_hit && h.draws_hit.toLowerCase().includes(q)) ||
        (h.picks && h.picks.some((p) => p.home.toLowerCase().includes(q) || p.away.toLowerCase().includes(q)))
      );
    });
  }, [historyEditions, historySearchTerm, historySeasonFilter]);

  // Admin: Save Current Live Picks as an Archived Historical Edition
  const handleSaveCurrentAsHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHistoryTitle.trim()) {
      triggerToast('Please provide an edition title.', 'error');
      return;
    }
    const weekNum = activeWeekNumber;
    const currentPicksToSave = picks.length > 0 ? picks : defaultDataset;
    const bankersCount = currentPicksToSave.filter((p) => p.is_banker).length;

    const newEdition: PoolPicksHistoryEdition = {
      id: `history-week-${weekNum}-${Date.now()}`,
      week_number: weekNum,
      edition_title: newHistoryTitle.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      bookmaker: bookmakerBrand,
      total_picks: currentPicksToSave.length,
      bankers_count: bankersCount,
      success_rate: newHistorySuccessRate || '85%',
      draws_hit: newHistoryDrawsHit || '4 / 5 Draws Hit',
      summary: newHistorySummary.trim() || `Archived edition for Week ${weekNum} official coupon fixtures.`,
      is_current: false,
      season: '2026/2027',
      published_by: currentUser.username || 'Administrator',
      picks: currentPicksToSave
    };

    const updated = [newEdition, ...historyEditions.filter((h) => String(h.week_number) !== String(weekNum))];
    setHistoryEditions(updated);
    try {
      localStorage.setItem(historyStorageKey, JSON.stringify(updated));
      await fetch('/api/pool-picks/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEdition)
      });
    } catch (_) {}

    setShowSaveHistoryModal(false);
    setNewHistoryTitle('');
    setNewHistorySummary('');
    triggerToast(`Archived Week ${weekNum} Pool Picks into History!`, 'success');
  };

  // Filter & Sort for Standard Sheet View
  const filteredPicks = useMemo(() => {
    let list = [...effectivePicks];

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
      list = list.filter((p) => {
        return (
          p.is_banker === true ||
          String(p.is_banker).toLowerCase() === 'true' ||
          String(p.is_banker).toLowerCase() === 't' ||
          p.is_banker === 1 ||
          String(p.is_banker) === '1' ||
          p.banker === true ||
          String(p.banker).toLowerCase() === 'true' ||
          (p.notes && /banker|nap/i.test(p.notes))
        );
      });
    }

    list.sort((a, b) => {
      if (sortBy === 'pool_asc') return a.pool_no - b.pool_no;
      if (sortBy === 'pool_desc') return b.pool_no - a.pool_no;
      if (sortBy === 'draw_desc') return Number(b.draw_x) - Number(a.draw_x);
      if (sortBy === 'draw_asc') return Number(a.draw_x) - Number(b.draw_x);
      return 0;
    });

    return list;
  }, [effectivePicks, searchTerm, statusFilter, betFilter, bankerFilter, sortBy]);

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

  const handleDeletePick = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to remove this weekly pool pick?')) return;
    const targetPick = picks.find((p) => p.id === id);
    const updated = picks.filter((p) => p.id !== id);
    setPicks(updated);
    setRawRows(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    if (targetPick) {
      try {
        await fetch('/api/pool-picks/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookmaker: bookmakerBrand,
            targetTable: sourceTableName,
            id: targetPick.id,
            pool_no: targetPick.pool_no,
            bet_code: targetPick.bet_code,
            home: targetPick.home,
            away: targetPick.away,
            week: activeWeekNumber
          })
        });
      } catch (_) {}
    }

    window.dispatchEvent(
      new CustomEvent('fastpool_pool_picks_updated', {
        detail: { bookmaker: bookmakerBrand, action: 'delete', pool_no: targetPick?.pool_no, picks: updated }
      })
    );
    triggerToast('Pool pick removed successfully.', 'success');
  };

  const handleResetToDefaults = () => {
    if (!window.confirm(`Reset table to official Week ${activeWeekNumber} default picks for ${tableDisplayName}?`)) return;
    setPicks(defaultDataset);
    setRawRows(defaultDataset);
    localStorage.setItem(storageKey, JSON.stringify(defaultDataset));
    triggerToast(`Reset to official Week ${activeWeekNumber} ${tableDisplayName}.`, 'info');
  };

  const displayWeek = selectedHistoryEditionId && activeHistoryEdition ? activeHistoryEdition.week_number : activeWeekNumber;

  return (
    <div className="w-full flex flex-col gap-4 text-left" id={`weekly-pool-picks-${bookmakerBrand}-section`}>
      {/* 1. MASTER COMMAND MASTHEAD (Unified, compact, high-efficiency) */}
      <div className={`bg-gradient-to-r ${brandTheme.headerGrad} border ${brandTheme.borderAccent} rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden space-y-4`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        {/* Top Tier: Title, Week Tag, Tabs, and Primary Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          {/* Brand Info & Week Indicator */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-11 h-11 rounded-xl ${bookmakerBrand === 'betking' ? 'bg-gradient-to-br from-blue-400 to-indigo-600' : 'bg-gradient-to-br from-emerald-400 to-teal-600'} text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20 shrink-0`}>
              <Target className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight truncate">
                  {tableDisplayName}
                </h2>
                <span className="text-[10px] bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-2.5 py-0.5 rounded-md font-black uppercase tracking-wider font-mono shadow-sm">
                  WEEK {displayWeek}
                </span>
                {selectedHistoryEditionId ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold rounded-md">
                    <History className="w-3 h-3 text-amber-400" />
                    <span>ARCHIVED COUPON</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>LIVE</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5 text-[11px] text-slate-400 mt-0.5 font-medium flex-wrap">
                <span>{filteredPicks.length} fixtures</span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = bankerFilter === 'bankers' ? 'all' : 'bankers';
                    setBankerFilter(next);
                    triggerToast(
                      next === 'bankers'
                        ? 'Filtered: Showing only confirmed Banker fixtures (is_banker = TRUE).'
                        : 'Showing all fixtures.',
                      'info'
                    );
                  }}
                  className="text-amber-400 hover:text-amber-300 font-mono font-bold hover:underline transition cursor-pointer flex items-center gap-1"
                  title="Click to toggle filter: Show only Bankers (TRUE)"
                >
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>
                    {(picks.length > 0 ? picks : defaultDataset).filter(p => p.is_banker === true || String(p.is_banker).toLowerCase() === 'true' || (p.notes && /banker|nap/i.test(p.notes))).length} bankers
                  </span>
                </button>
                <span>•</span>
                <span className="text-slate-400">UK & Aussie Pools Coupon</span>
              </div>
            </div>
          </div>

          {/* Right Header: Tab Controls & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* View Switcher: Picks Table vs Pool Picks History */}
            <div className="inline-flex rounded-xl bg-slate-950/90 p-1 border border-slate-800 shadow-inner">
              <button
                onClick={() => setActiveTab('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  activeTab === 'table'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Picks Table</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History Vault</span>
                <span className={`text-[9.5px] px-1 rounded font-mono font-black ${
                  activeTab === 'history' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-amber-400'
                }`}>
                  {historyEditions.length}
                </span>
              </button>
            </div>

            {/* Quick Actions */}
            {hasAccess ? (
              <>
                <button
                  onClick={handleExportPDF}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  title="Export high-resolution PDF coupon"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-750 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  title="Export raw data as CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </>
            ) : (
              <button
                onClick={onUpgradeClick}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>VIP Unlock</span>
              </button>
            )}

            <button
              onClick={handleCopyAllCodes}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-750 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
              title="Copy all bet codes for fast bulk load"
            >
              {isCopiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-xs">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs">Copy Codes</span>
                </>
              )}
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setShowCsvUploadModal(true)}
                  className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                  title="Upload CSV fixtures to database"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Upload CSV</span>
                </button>
                <button
                  onClick={() => setShowSaveHistoryModal(true)}
                  className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                  title="Archive current week into history"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Archive</span>
                </button>
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
                  className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Add Pick</span>
                </button>
              </>
            )}

            <button
              onClick={() => fetchPicks(false)}
              disabled={isLoading}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-750 rounded-xl transition cursor-pointer active:scale-95"
              title="Sync / Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bottom Tier: Integrated Controls (Visible in Table Mode) */}
        {activeTab === 'table' && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 relative z-10">
            {/* Left Group: Active Week Badge, Search, Bankers, Match Day Filter */}
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {/* Current Active Week Pill */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider shrink-0 mr-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Week:</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHistoryEditionId(null);
                    triggerToast(`Showing active Week ${activeWeekNumber} coupon.`, 'info');
                  }}
                  className={`shrink-0 group px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm border ${
                    selectedHistoryEditionId === null
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-emerald-500/20'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800'
                  }`}
                  title={`Switch to current Week ${activeWeekNumber} active coupon`}
                >
                  <span>Week {activeWeekNumber}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase transition-colors ${
                    selectedHistoryEditionId === null ? 'bg-emerald-950 text-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 group-hover:bg-emerald-500/20'
                  }`}>
                    LIVE
                  </span>
                </button>
              </div>

              {selectedHistoryEditionId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHistoryEditionId(null);
                    triggerToast(`Returned to current Week ${activeWeekNumber}.`, 'info');
                  }}
                  className="shrink-0 px-2.5 py-1 text-xs font-mono font-bold text-amber-400 hover:text-emerald-400 bg-amber-500/10 hover:bg-emerald-500/10 border border-amber-500/30 hover:border-emerald-500/30 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  title="Return to Current Active Week"
                >
                  <RotateCcw className="w-3 h-3 text-emerald-400" />
                  <span>Return to Live</span>
                </button>
              )}

              {/* Search Fixtures */}
              <div className="relative min-w-[150px] sm:min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter fixtures..."
                  className="w-full pl-8 pr-6 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition font-mono"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Bankers Only Toggle */}
              <button
                type="button"
                onClick={() => {
                  const nextFilter = bankerFilter === 'bankers' ? 'all' : 'bankers';
                  setBankerFilter(nextFilter);
                  triggerToast(
                    nextFilter === 'bankers'
                      ? 'Filtered: Showing only confirmed Banker Draws (is_banker = TRUE).'
                      : 'Showing all weekly fixtures.',
                    'info'
                  );
                }}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 border ${
                  bankerFilter === 'bankers'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300 font-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-amber-500/40 hover:bg-slate-900'
                }`}
                title="Click to toggle filter: Show only fixtures where is_banker is TRUE"
              >
                <Star className={`w-3.5 h-3.5 ${bankerFilter === 'bankers' ? 'fill-slate-950 text-slate-950' : 'fill-amber-400 text-amber-400'}`} />
                <span>Bankers Only</span>
                <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono font-black ${
                  bankerFilter === 'bankers' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-amber-400'
                }`}>
                  {effectivePicks.filter(p => p.is_banker === true || String(p.is_banker).toLowerCase() === 'true' || (p.notes && /banker|nap/i.test(p.notes))).length}
                </span>
              </button>

              {/* Match Day Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="shrink-0 bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="all">All Match Days</option>
                <option value="saturday">Saturday</option>
                <option value="eko">Early Kick-off (EKO)</option>
                <option value="lko">Late Kick-off (LKO)</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>

            {/* Right Group: View Mode Toggle, Sort, Reset */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="pool_asc">Pool # (1 → 49)</option>
                <option value="pool_desc">Pool # (49 → 1)</option>
                <option value="draw_desc">Draw Odds (High → Low)</option>
                <option value="draw_asc">Draw Odds (Low → High)</option>
              </select>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-lg text-xs font-mono transition cursor-pointer"
                  title="Reset table to defaults"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}
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
      ) : activeTab === 'history' ? (
        /* =========================================================================
           POOL PICKS HISTORY ARCHIVE VIEW (BLOG-STYLE EDITORIAL ARCHIVE)
           ========================================================================= */
        <div className="space-y-6" id="pool-picks-history-archive-view">
          {/* History Header & Search Filter Bar */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-950/60 border border-amber-900/40 px-2.5 py-0.5 rounded-full uppercase tracking-widest inline-flex items-center gap-1">
                    <History className="w-3 h-3" />
                    <span>Archive Vault</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-bold">
                    {filteredHistoryEditions.length} Weekly Editions Catalogued
                  </span>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <span>Pool Picks History & Weekly Archive</span>
                </h3>
                <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
                  Historical coupon editions, verified banker accuracy, and statistical draw perms archived for past UK & Aussie pool coupon weeks. Select any edition to inspect or export that week's full selections matrix.
                </p>
              </div>

              {/* Admin Save Button */}
              {isAdmin && (
                <button
                  onClick={() => setShowSaveHistoryModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition shadow-lg shadow-amber-950/40 cursor-pointer flex items-center gap-2 shrink-0 self-start md:self-auto"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Archive Current Week</span>
                </button>
              )}
            </div>

            {/* History Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-slate-800/80">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  placeholder="Search history by week number, team, banker, date, or notes..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition font-mono"
                />
                {historySearchTerm && (
                  <button
                    onClick={() => setHistorySearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={historySeasonFilter}
                  onChange={(e) => setHistorySeasonFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs font-bold px-3 py-2 rounded-xl focus:border-amber-500 outline-none cursor-pointer"
                >
                  <option value="all">All Seasons</option>
                  <option value="2026/2027">2026/2027 Season</option>
                </select>

                <button
                  onClick={() => {
                    setSelectedHistoryEditionId(null);
                    setActiveTab('table');
                  }}
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>View Current (Wk {activeWeekNumber})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#0B1220] border border-slate-800/80 rounded-xl p-3.5 text-left">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">Total Archived Editions</span>
              <span className="text-xl font-mono font-black text-white mt-1 block">{historyEditions.length} Weeks</span>
            </div>
            <div className="bg-[#0B1220] border border-slate-800/80 rounded-xl p-3.5 text-left">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">Average Accuracy</span>
              <span className="text-xl font-mono font-black text-emerald-400 mt-1 block">82.4%</span>
            </div>
            <div className="bg-[#0B1220] border border-slate-800/80 rounded-xl p-3.5 text-left">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">Total Banker Selections</span>
              <span className="text-xl font-mono font-black text-amber-400 mt-1 block">
                {historyEditions.reduce((acc, h) => acc + (h.bankers_count || (h.picks ? h.picks.filter(p => p.is_banker).length : 0)), 0)} Bankers
              </span>
            </div>
            <div className="bg-[#0B1220] border border-slate-800/80 rounded-xl p-3.5 text-left">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">Active Season</span>
              <span className="text-xl font-mono font-black text-blue-400 mt-1 block">2026/2027 UK/Aussie</span>
            </div>
          </div>

          {/* Historical Editions Grid (Blog-Style Article Cards) */}
          {filteredHistoryEditions.length === 0 ? (
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">No historical editions match your search.</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching by a different week number or clearing the search filter.
              </p>
              <button
                onClick={() => setHistorySearchTerm('')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-xl transition cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredHistoryEditions.map((edition, idx) => {
                const isSelected = selectedHistoryEditionId === edition.id;
                const bankerPick = (edition.picks || []).find((p) => p.is_banker) || edition.picks?.[0];

                return (
                  <div
                    key={edition.id || `hist_card_${idx}`}
                    className={`bg-gradient-to-b from-[#0F172A] to-[#0A101D] border rounded-2xl p-5 shadow-xl transition flex flex-col justify-between group hover:border-amber-500/50 hover:shadow-2xl relative ${
                      isSelected
                        ? 'border-amber-500/80 ring-2 ring-amber-500/30'
                        : edition.is_current
                        ? 'border-emerald-500/40'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Card Header Pills */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full border shadow-sm ${
                          edition.is_current
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          WEEK {edition.week_number} {edition.is_current ? '(CURRENT)' : ''}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{edition.date}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-base font-black text-white group-hover:text-amber-300 transition leading-snug line-clamp-2 text-left">
                        {edition.edition_title}
                      </h4>

                      {/* Performance Indicator */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>{edition.success_rate} Win Rate</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                          {edition.draws_hit}
                        </span>
                      </div>

                      {/* Commentary / Summary */}
                      <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-3 text-left">
                        {edition.summary}
                      </p>

                      {/* Key Selection Spotlight */}
                      {bankerPick && (
                        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-left space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-amber-400 font-bold uppercase flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              Key Banker Selection
                            </span>
                            <span className="text-slate-500">Code: {bankerPick.bet_code}</span>
                          </div>
                          <div className="text-xs font-mono font-bold text-slate-200">
                            Pool {bankerPick.pool_no}: {bankerPick.home} vs {bankerPick.away} (X)
                          </div>
                          {bankerPick.notes && (
                            <div className="text-[10px] text-slate-400 italic line-clamp-1">
                              ↳ {bankerPick.notes}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Meta counters */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                        <span>{edition.total_picks || edition.picks?.length || 15} Fixtures Analyzed</span>
                        <span>{edition.bankers_count || 3} Confirmed Bankers</span>
                      </div>
                    </div>

                    {/* Card Action Buttons */}
                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedHistoryEditionId(edition.id);
                          setActiveTab('table');
                          triggerToast(`Viewing Week ${edition.week_number} picks table!`, 'success');
                        }}
                        className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-slate-950 font-mono text-xs font-black uppercase tracking-wider rounded-xl transition shadow cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Table</span>
                      </button>

                      <button
                        onClick={() => exportEditionToCSV(edition)}
                        className="p-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 border border-slate-800 rounded-xl transition cursor-pointer"
                        title={`Export Week ${edition.week_number} CSV`}
                      >
                        <Download className="w-4 h-4 text-emerald-400" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedHistoryEditionId(edition.id);
                          handleExportPDF();
                        }}
                        className="p-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 border border-slate-800 rounded-xl transition cursor-pointer"
                        title={`Download Week ${edition.week_number} PDF sheet`}
                      >
                        <Printer className="w-4 h-4 text-amber-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Historical Week Compact Banner if viewing a past week */}
          {activeHistoryEdition && (
            <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-[#0F172A] border border-amber-500/40 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md text-left">
              <div className="flex items-center gap-2.5 min-w-0">
                <History className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-xs truncate">
                  <span className="font-mono font-black text-amber-300 mr-2 uppercase">
                    Archived: Week {activeHistoryEdition.week_number} ({activeHistoryEdition.date})
                  </span>
                  <span className="text-slate-400 hidden md:inline">
                    • {activeHistoryEdition.draws_hit} • {activeHistoryEdition.success_rate} Win Rate • {activeHistoryEdition.edition_title}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => exportEditionToCSV(activeHistoryEdition)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg transition cursor-pointer border border-slate-700 flex items-center gap-1"
                >
                  <Download className="w-3 h-3 text-amber-400" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono rounded-lg transition cursor-pointer border border-amber-500/30 flex items-center gap-1"
                >
                  <History className="w-3 h-3" />
                  <span>Vault</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedHistoryEditionId(null);
                    triggerToast(`Returned to current Week ${activeWeekNumber}.`, 'info');
                  }}
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black rounded-lg transition cursor-pointer shadow"
                >
                  Return to Week {activeWeekNumber} →
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE 1: STANDARD COUPON SHEET */}
          {viewMode === 'standard' && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id={`weekly-picks-${bookmakerBrand}-table`}>
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono text-slate-300">
                      {activeDbColumns.map((col) => {
                        const isDraw = col === 'draw_x' || col === 'x';
                        const isBanker = col === 'is_banker' || col === 'banker';
                        const isCenter = ['id', 'pool_no', 'pool', 'bet_code', 'code', 'home_win', 'draw_x', 'away_win', 'bet', 'status', 'kick_off', 'is_banker', 'week_no', 'week', 'bookmaker'].includes(col);

                        return (
                          <th
                            key={col}
                            className={`py-3 px-3 font-semibold ${isCenter ? 'text-center' : 'text-left'} ${
                              isDraw ? 'text-emerald-400 bg-emerald-950/30' : ''
                            } ${col === 'pool_no' || col === 'pool' ? 'w-16' : ''}`}
                          >
                            {isBanker ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextFilter = bankerFilter === 'bankers' ? 'all' : 'bankers';
                                  setBankerFilter(nextFilter);
                                  triggerToast(
                                    nextFilter === 'bankers'
                                      ? 'Filtered: Showing only confirmed Banker Draws (is_banker = TRUE).'
                                      : 'Showing all fixtures.',
                                    'info'
                                  );
                                }}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition font-mono ${
                                  bankerFilter === 'bankers'
                                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm ring-1 ring-amber-300'
                                    : 'text-slate-300 hover:text-amber-400 hover:bg-slate-900'
                                }`}
                                title="Click to toggle: Show only Banker fixtures where is_banker is TRUE"
                              >
                                <Star className={`w-3 h-3 ${bankerFilter === 'bankers' ? 'fill-slate-950 text-slate-950' : 'fill-amber-400 text-amber-400'}`} />
                                <span>{col}</span>
                                {bankerFilter === 'bankers' && (
                                  <span className="text-[9px] bg-slate-950 text-amber-300 px-1 rounded font-black">TRUE</span>
                                )}
                              </button>
                            ) : (
                              <span>{col}</span>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                    {filteredPicks.length === 0 ? (
                      <tr>
                        <td colSpan={activeDbColumns.length} className="py-12 text-center text-slate-400 font-mono">
                          <AlertCircle className="w-6 h-6 mx-auto text-slate-600 mb-2" />
                          <span>No matches found matching your current filter.</span>
                        </td>
                      </tr>
                    ) : (
                      filteredPicks.map((pick, idx) => {
                        const isCopied = copiedCodeId === pick.id;
                        const isBanker = Boolean(
                          pick.is_banker === true ||
                          pick.is_banker === 'true' ||
                          pick.is_banker === 1 ||
                          pick.banker === true
                        );
                        const bookieName = String(pick.bookmaker || bookmakerBrand || 'bet9ja').toLowerCase();
                        const weekNum = pick.week_no ?? pick.week ?? activeWeekNumber ?? 16;

                        return (
                          <tr
                            key={pick.id || idx}
                            onClick={() => {
                              if (isAdmin) {
                                setEditingPick(pick);
                                setIsEditModalOpen(true);
                              }
                            }}
                            className={`hover:bg-slate-800/40 transition-colors ${isAdmin ? 'cursor-pointer' : ''} ${
                              isBanker ? 'bg-amber-500/[0.04]' : idx % 2 === 0 ? 'bg-[#0F172A]' : 'bg-[#0B1322]'
                            }`}
                            title={isAdmin ? "Admin: Click row to edit or delete" : undefined}
                          >
                            {activeDbColumns.map((col) => {
                              const isCenter = ['id', 'pool_no', 'pool', 'bet_code', 'code', 'home_win', 'draw_x', 'away_win', 'bet', 'status', 'kick_off', 'is_banker', 'week_no', 'week', 'bookmaker'].includes(col);
                              const isDraw = col === 'draw_x' || col === 'x';

                              return (
                                <td
                                  key={col}
                                  className={`py-3 px-3 ${isCenter ? 'text-center' : 'text-left'} ${
                                    isDraw ? 'bg-emerald-950/20 border-x border-emerald-500/10' : ''
                                  }`}
                                >
                                  {renderCellContent(col, pick, isCopied, isBanker, bookieName, weekNum)}
                                </td>
                              );
                            })}
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
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>
                    Database Table: <code>{sourceTableName}</code> • Reflecting <strong>{activeDbColumns.length}</strong> columns: {activeDbColumns.join(', ')}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  {isAdmin && (
                    <span className="text-amber-400 flex items-center gap-1 font-semibold">
                      <Edit2 className="w-3 h-3" /> Click any row to edit
                    </span>
                  )}
                  <span>Licensed to: <strong className="text-slate-300">{currentUser.email || `@${currentUser.username}`}</strong></span>
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

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
                {editingPick.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (editingPick.id) {
                        handleDeletePick(editingPick.id);
                        setIsEditModalOpen(false);
                        setEditingPick(null);
                      }
                    }}
                    className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Pick</span>
                  </button>
                ) : <div />}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingPick(null);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold font-mono transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-950/40 cursor-pointer"
                  >
                    Save Pick
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN SAVE/ARCHIVE CURRENT WEEK AS HISTORY MODAL */}
      {showSaveHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Archive className="w-5 h-5 text-amber-400" />
                <span>Archive Week {activeWeekNumber} into Pool Picks History</span>
              </h3>
              <button
                onClick={() => setShowSaveHistoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCurrentAsHistory} className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  Edition Title
                </label>
                <input
                  type="text"
                  required
                  value={newHistoryTitle}
                  onChange={(e) => setNewHistoryTitle(e.target.value)}
                  placeholder={`e.g. Week ${activeWeekNumber} Key Perming Analysis & Banker Draws`}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                    Win / Hit Rate
                  </label>
                  <input
                    type="text"
                    value={newHistorySuccessRate}
                    onChange={(e) => setNewHistorySuccessRate(e.target.value)}
                    placeholder="e.g. 85%"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                    Draws Delivered Label
                  </label>
                  <input
                    type="text"
                    value={newHistoryDrawsHit}
                    onChange={(e) => setNewHistoryDrawsHit(e.target.value)}
                    placeholder="e.g. 4 / 5 Draws Hit"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  Summary / Analyst Commentary
                </label>
                <textarea
                  rows={3}
                  value={newHistorySummary}
                  onChange={(e) => setNewHistorySummary(e.target.value)}
                  placeholder="Summary of this week's coupon outcomes, perms, and banker hits..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-400 space-y-1">
                <div className="text-amber-400 font-bold">Snapshot Details:</div>
                <div>• Total Fixtures: {picks.length > 0 ? picks.length : defaultDataset.length} rows</div>
                <div>• Bankers: {(picks.length > 0 ? picks : defaultDataset).filter(p => p.is_banker).length} picks</div>
                <div>• Bookmaker: {bookmakerBrand.toUpperCase()}</div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSaveHistoryModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold font-mono transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg cursor-pointer"
                >
                  Archive to History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN POOL PICKS CSV UPLOAD MODAL */}
      <PoolPicksCsvModal
        isOpen={showCsvUploadModal}
        onClose={() => setShowCsvUploadModal(false)}
        initialBookmaker={bookmakerBrand}
        initialTable={tableName}
        initialWeek={activeWeekNumber}
        onUploadSuccess={(updatedPicks) => {
          fetchPicks(true);
        }}
        triggerToast={triggerToast}
      />
    </div>
  );
}
