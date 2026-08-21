export type UserRole = 'admin' | 'editor' | 'user';
export type UserStatus = 'active' | 'suspended' | 'unverified';
export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'biannual' | 'yearly';
export type PoolType = 'uk' | 'aussie' | 'international';
export type WeekStatus = 'upcoming' | 'active' | 'closed';
export type AccessLevel = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'inactive';
export type NotificationType = 
  | 'subscription_activated'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'payment_failed'
  | 'new_codes' 
  | 'results_out' 
  | 'system';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  email_verified_at: string | null;
  created_at: string;
  password?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: BillingCycle;
  duration_days: number;
  currency?: string;
  region?: string;
  aliases?: string[];
  has_premium_codes: boolean;
  has_odds_comparison: boolean;
  has_results: boolean;
  has_notifications: boolean;
  max_bookmakers: number;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  username?: string;
  plan_id: string;
  plan_name?: string;
  status: SubscriptionStatus;
  starts_at: string;
  started_at?: string;
  expires_at: string;
  payment_ref?: string | null;
  payment_reference?: string | null;
  payment_provider?: string | null;
  item_name?: string;
  currency?: string;
  amount_paid?: number;
  granted_tables?: string | string[];
  created_at?: string;
  updated_at?: string;
  components?: string[] | string;
  alert_milestones_sent?: string[];
}

export interface UserPayment {
  id: string;
  user_id: string;
  username: string;
  plan_id: string;
  item_name: string;
  bookmaker_components: string[];
  granted_tables: string[];
  amount: number;
  currency: string;
  payment_reference: string;
  payment_provider: string;
  status: string;
  access_start_at: string;
  access_expires_at: string;
  created_at: string;
  updated_at?: string;
}

export interface PurchasesAccessLog {
  id: string;
  user_id: string;
  username: string;
  plan_id: string;
  plan_purchased: string;
  payment_ref: string;
  payment_provider: string;
  amount: number;
  currency: string;
  components: string[];
  paid_date: string;
  expiry_date: string;
  access_status: string;
  created_at?: string;
}

export function parseComponents(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(c => String(c).toLowerCase().trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(c => String(c).toLowerCase().trim()).filter(Boolean);
      }
      if (typeof parsed === 'string' && parsed.trim()) {
        return [parsed.trim().toLowerCase()];
      }
    } catch (_) {}
    if (trimmed.includes(',')) {
      return trimmed.split(',').map(c => c.toLowerCase().trim()).filter(Boolean);
    }
    const cleaned = trimmed.replace(/[\[\]"']/g, '').toLowerCase().trim();
    return cleaned ? [cleaned] : [];
  }
  return [];
}

export interface Bookmaker {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  country: string;
  is_active: boolean;
}

export interface PoolWeek {
  id: string;
  week_number: number;
  season_year: number;
  pool_type: PoolType;
  fixture_date: string;
  status: WeekStatus;
  published_at: string | null;
  created_at: string;
}

export interface PoolCode {
  id: string;
  pool_week_id: string;
  bookmaker_id: string;
  uploaded_by: string;
  codes_content: string;
  file_url: string | null;
  access_level: AccessLevel;
  download_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResultRow {
  matchNo: number;
  homeTeam: string;
  awayTeam: string;
  fullTimeScore: string;
  outcome: 'DRAW' | 'HOME WIN' | 'AWAY WIN' | 'VOID';
  payoutStatus: 'CLEARED' | 'LOCKED' | 'NOT REVEALED';
}

export interface PoolResult {
  id: string;
  pool_week_id: string;
  bookmaker_id: string;
  uploaded_by: string;
  results_content: string;
  file_url: string | null;
  created_at: string;
  title?: string;
  week_number?: number;
  season_year?: number;
  pool_type?: PoolType;
  fixture_date?: string;
  comments_count?: number;
  results_table?: ResultRow[];
}

export interface Notification {
  id: string;
  user_id: string;
  pool_code_id?: string | null;
  subscription_id?: string | null;
  type: NotificationType;
  title: string;
  message?: string;
  body?: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  days_remaining?: number;
}

export interface UserDownload {
  id: string;
  user_id: string;
  username?: string;
  pool_code_id: string;
  downloaded_at: string;
}

export interface BookmakerTableRecord {
  id: string;
  pool: number;
  betcode: string;
  home: string;
  away: string;
  league?: string;
  match_league?: string;
  match?: string;
  homewin: number;
  draw: number;
  awaywin: number;
  bet: string;
  status: string;
  kickoff: string;
  created_at?: string;
  [key: string]: any;
}

export interface PoolCodesComparisonRecord {
  id: number | string;
  pool: string | number;
  home: string;
  away: string;
  league?: string;
  match_league?: string;
  'bet9ja (draw)'?: string | number;
  'betking (draw)'?: string | number;
  'sportybet (draw)'?: string | number;
  status?: string;
  kickoff?: string;
  created_at?: string;
  [key: string]: any;
}

export interface DatabaseState {
  users: User[];
  subscription_plans: SubscriptionPlan[];
  user_subscriptions: UserSubscription[];
  user_payments?: UserPayment[];
  purchases_access_log?: PurchasesAccessLog[];
  bookmakers: Bookmaker[];
  pool_weeks: PoolWeek[];
  pool_codes: PoolCode[];
  pool_results: PoolResult[];
  notifications: Notification[];
  user_downloads: UserDownload[];
  bet9ja?: BookmakerTableRecord[];
  betking?: BookmakerTableRecord[];
  sportybet?: BookmakerTableRecord[];
  premierbet?: BookmakerTableRecord[];
  betway?: BookmakerTableRecord[];
  soccabet?: BookmakerTableRecord[];
  msport?: BookmakerTableRecord[];
  arena_games?: BookmakerTableRecord[];
  pool_codes_comparison?: PoolCodesComparisonRecord[];
  weekly_picks?: WeeklyPoolPick[];
}

export interface WeeklyPoolPick {
  id?: string | number;
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
