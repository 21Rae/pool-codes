export type UserRole = 'admin' | 'editor' | 'user';
export type UserStatus = 'active' | 'suspended' | 'unverified';
export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'biannual' | 'yearly';
export type PoolType = 'uk' | 'aussie' | 'international';
export type WeekStatus = 'upcoming' | 'active' | 'closed';
export type AccessLevel = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type NotificationType = 'new_codes' | 'results_out' | 'subscription_expiring' | 'system';

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
  plan_id: string;
  status: SubscriptionStatus;
  starts_at: string;
  expires_at: string;
  payment_ref: string | null;
  payment_provider: string | null;
  created_at: string;
  components?: string[];
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
  pool_code_id: string | null;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface UserDownload {
  id: string;
  user_id: string;
  pool_code_id: string;
  downloaded_at: string;
}

export interface BookmakerTableRecord {
  id: string;
  pool: number;
  betcode: string;
  home: string;
  away: string;
  homewin: number;
  draw: number;
  awaywin: number;
  bet: string;
  status: string;
  kickoff: string;
  created_at?: string;
}

export interface DatabaseState {
  users: User[];
  subscription_plans: SubscriptionPlan[];
  user_subscriptions: UserSubscription[];
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
}
