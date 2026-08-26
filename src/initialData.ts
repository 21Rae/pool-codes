import {
  User,
  SubscriptionPlan,
  UserSubscription,
  Bookmaker,
  PoolWeek,
  PoolCode,
  PoolResult,
  PoolResultRecord,
  Notification,
  UserDownload,
  BookmakerTableRecord,
  PoolCodesComparisonRecord,
  LiveScoreRecord
} from './types';

export const INITIAL_USERS: User[] = [];

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'BI - Annual plan (New)',
    name: 'BI - Annual plan',
    description: '24 Weeks + 2 Weeks Bonus (182 days). Half-year coverage of draw sequences.',
    price: 7800.00,
    billing_cycle: 'biannual',
    duration_days: 182,
    currency: 'NGN',
    aliases: ['plan-biannual', 'BI - Annual plan (New)', 'BI - Annual plan', 'BI - Annual Plan (New)', 'biannual'],
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 4,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'BI - Annual plan (New) Ghana',
    name: 'BI - Annual plan (New) Ghana',
    description: '24 weeks + 2 weeks bonus (182 days coverage).',
    price: 104.00,
    billing_cycle: 'biannual',
    duration_days: 182,
    currency: 'GHS',
    region: 'ghana',
    aliases: ['plan-ghana-biannual', 'BI - Annual plan (New) Ghana', 'Ghana BI - Annual Plan (New)', 'Ghana BI - Annual plan'],
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 4,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'Monthly plan Ghana',
    name: 'Monthly plan Ghana',
    description: '4 weeks + 1 week bonus (35 days total).',
    price: 16.00,
    billing_cycle: 'monthly',
    duration_days: 35,
    currency: 'GHS',
    region: 'ghana',
    aliases: ['plan-ghana', 'plan-ghana-monthly', 'Monthly plan Ghana', 'Ghana Monthly Plan'],
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 4,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'plan-free',
    name: 'Free Pass',
    description: '7 Days Access. Public fixture codes and results with standard limits.',
    price: 0.00,
    billing_cycle: 'weekly',
    duration_days: 7,
    currency: 'NGN',
    aliases: ['plan-free', 'Free Pass', 'Free Access', 'free'],
    has_premium_codes: false,
    has_odds_comparison: false,
    has_results: true,
    has_notifications: false,
    max_bookmakers: 1,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'plan-monthly',
    name: 'Monthly Pro',
    description: '30 Days Access (4 Weeks + 1 Week Bonus). Active perming suite access.',
    price: 1200.00,
    billing_cycle: 'monthly',
    duration_days: 30,
    currency: 'NGN',
    aliases: ['plan-monthly', 'Monthly Pro', 'Monthly Plan', 'Monthly Plan (New)', 'monthly'],
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 4,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'plan-weekly',
    name: 'Weekly VIP',
    description: '7 Days Access (1 Week Only). Ideal for temporary coupon verification.',
    price: 300.00,
    billing_cycle: 'weekly',
    duration_days: 7,
    currency: 'NGN',
    aliases: ['plan-weekly', 'Weekly VIP', 'Weekly Plan', 'weekly'],
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 4,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'Quarterly',
    name: 'Quarterly',
    description: '12 Weeks + 1 Week Bonus (91 days). Standard season length.',
    price: 3600.00,
    billing_cycle: 'quarterly',
    duration_days: 91,
    currency: 'NGN',
    aliases: ['plan-quarterly', 'Quarterly', 'Quarterly Plan (New)', 'Quarterly Plan', 'quarterly'],
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 4,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'Quarterly plan (New) Ghana',
    name: 'Quarterly plan (New) Ghana',
    description: '12 weeks + 1 week bonus (91 days total).',
    price: 48.00,
    billing_cycle: 'quarterly',
    duration_days: 91,
    currency: 'GHS',
    region: 'ghana',
    aliases: ['plan-ghana-quarterly', 'Quarterly plan (New) Ghana', 'Ghana Quarterly Plan (New)', 'Ghana Quarterly Plan'],
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 4,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'Weekly plan Ghana',
    name: 'Weekly plan Ghana',
    description: '1 week Only (7 days duration).',
    price: 4.00,
    billing_cycle: 'weekly',
    duration_days: 7,
    currency: 'GHS',
    region: 'ghana',
    aliases: ['plan-ghana-weekly', 'Weekly plan Ghana', 'Ghana Weekly Plan', 'Weekly plan (Ghana)'],
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 4,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'Yearly plan (New)',
    name: 'Yearly plan',
    description: '48 Weeks + 4 Weeks Bonus (364 days). Elite multi-season VIP privileges.',
    price: 15600.00,
    billing_cycle: 'yearly',
    duration_days: 364,
    currency: 'NGN',
    aliases: ['plan-yearly', 'Yearly plan (New)', 'Yearly plan', 'Yearly Plan (New)', 'Yearly Plan', 'yearly'],
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 4,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'Yearly plan (New) Ghana',
    name: 'Yearly plan (New) Ghana',
    description: '48 weeks + 4 weeks bonus (364 days coverage).',
    price: 208.00,
    billing_cycle: 'yearly',
    duration_days: 364,
    currency: 'GHS',
    region: 'ghana',
    aliases: ['plan-ghana-yearly', 'Yearly plan (New) Ghana', 'Ghana Yearly Plan (New)', 'Ghana Yearly Plan'],
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 4,
    created_at: '2026-01-01T00:00:00Z'
  }
];

export function findSubscriptionPlan(plans: SubscriptionPlan[] | undefined, planIdOrName: string): SubscriptionPlan | undefined {
  if (!planIdOrName) return undefined;
  const list = (plans && plans.length > 0) ? plans : INITIAL_PLANS;
  const target = String(planIdOrName).trim().toLowerCase();

  // 1. Direct exact id match
  const exactId = list.find(p => p && String(p.id).trim().toLowerCase() === target);
  if (exactId) return exactId;

  // 2. Direct exact name match
  const exactName = list.find(p => p && String(p.name).trim().toLowerCase() === target);
  if (exactName) return exactName;

  // 3. Alias match
  const aliasMatch = list.find(p => p && Array.isArray(p.aliases) && p.aliases.some(a => String(a).trim().toLowerCase() === target));
  if (aliasMatch) return aliasMatch;

  // 4. Fuzzy contains match
  return list.find(p => {
    if (!p) return false;
    const pid = String(p.id).toLowerCase();
    const pname = String(p.name).toLowerCase();
    return pid.includes(target) || target.includes(pid) || pname.includes(target) || target.includes(pname);
  });
}

export function getPlanDurationDays(plan: Partial<SubscriptionPlan> | undefined): number {
  if (!plan) return 7;
  const cycle = String(plan.billing_cycle || '').toLowerCase();
  const name = String(plan.name || '').toLowerCase();
  const id = String(plan.id || '').toLowerCase();

  const isWeekly = cycle === 'weekly' || name.includes('week') || id.includes('week');

  if (cycle === 'yearly' || name.includes('year')) return 364;
  if (cycle === 'biannual' || name.includes('bi-annual') || name.includes('bi - annual')) return 182;
  if (cycle === 'quarterly' || name.includes('quarter')) return 91;
  if (name.includes('ghana') && (cycle === 'monthly' || name.includes('month'))) return 35;
  if (cycle === 'monthly' || name.includes('month')) return 30;
  if (isWeekly) return 7;

  if (typeof plan.duration_days === 'number' && plan.duration_days > 0) {
    return plan.duration_days;
  }
  return 7;
}

export function calculateSubscriptionExpiry(plan: Partial<SubscriptionPlan> | undefined, startDate: Date = new Date()): { startedAt: Date; expiresAt: Date; durationDays: number } {
  const startedAt = new Date(startDate.getTime());
  const cycle = String(plan?.billing_cycle || '').toLowerCase();
  const name = String(plan?.name || '').toLowerCase();
  const id = String(plan?.id || '').toLowerCase();
  const isWeekly = cycle === 'weekly' || name.includes('week') || id.includes('week');

  if (isWeekly) {
    // For all weekly purchases (e.g. made on Friday, Saturday, Sunday, or any day during the week),
    // the plan expires at midnight on the upcoming Sunday (Sunday 23:59:59.999 / end of Sunday night).
    // dayOfWeek: 0 for Sunday, 1 for Monday, ..., 5 for Friday, 6 for Saturday.
    const dayOfWeek = startedAt.getDay();
    // If purchased on Sunday (0), days until end of that Sunday is 0 days.
    // If purchased on Friday (5), days until Sunday is 2 days.
    // If purchased on Saturday (6), days until Sunday is 1 day.
    // If purchased on Monday (1), days until Sunday is 6 days.
    const daysUntilSunday = (7 - dayOfWeek) % 7;

    const expiresAt = new Date(
      startedAt.getFullYear(),
      startedAt.getMonth(),
      startedAt.getDate() + daysUntilSunday,
      23,
      59,
      59,
      999
    );

    // Calculate effective duration in days (minimum 1 day)
    const durationDays = Math.max(1, Math.ceil((expiresAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24)));
    return { startedAt, expiresAt, durationDays };
  }

  const durationDays = getPlanDurationDays(plan);
  // Monthly / longer cycle plans end at midnight (23:59:59.999) of the target expiry day
  const expiresAt = new Date(
    startedAt.getFullYear(),
    startedAt.getMonth(),
    startedAt.getDate() + durationDays - 1,
    23,
    59,
    59,
    999
  );
  return { startedAt, expiresAt, durationDays };
}

export function isGhanaPlan(p: any): boolean {
  if (!p) return false;
  const idStr = String(p.id || '').toLowerCase();
  const nameStr = String(p.name || '').toLowerCase();
  const regionStr = String(p.region || '').toLowerCase();
  const countryStr = String(p.country || '').toLowerCase();
  const currencyStr = String(p.currency || '').toLowerCase();

  return (
    regionStr === 'ghana' ||
    countryStr === 'ghana' ||
    currencyStr === 'ghs' ||
    currencyStr === 'ghc' ||
    currencyStr === 'gh₵' ||
    idStr.includes('ghana') ||
    nameStr.includes('ghana') ||
    nameStr.includes('ghc') ||
    nameStr.includes('ghs')
  );
}

export function getMergedSubscriptionPlans(dbPlans?: SubscriptionPlan[]): SubscriptionPlan[] {
  if (Array.isArray(dbPlans) && dbPlans.length > 0) {
    return dbPlans;
  }
  return INITIAL_PLANS || [];
}

export function getSortedComparisonPlans(dbPlans?: SubscriptionPlan[], isGhana = false): SubscriptionPlan[] {
  const allPlans = getMergedSubscriptionPlans(dbPlans).filter(p => p && p.id);
  const paidPlans = allPlans.filter(p => Number(p.price || 0) > 0 || p.id !== 'plan-free');
  const regionPlans = paidPlans.filter(p => isGhana ? isGhanaPlan(p) : !isGhanaPlan(p));
  const candidatePlans = regionPlans.length > 0 ? regionPlans : paidPlans;

  const cycleRank = (cycleStr: string, nameStr: string): number => {
    const combined = `${cycleStr || ''} ${nameStr || ''}`.toLowerCase();
    if (combined.includes('weekly') || combined.includes('week') && !combined.includes('bonus') && !combined.includes('weeks')) return 1;
    if (combined.includes('monthly') || combined.includes('month') && !combined.includes('bonus')) return 2;
    if (combined.includes('quarterly') || combined.includes('quarter')) return 3;
    if (combined.includes('biannual') || combined.includes('bi-annual') || combined.includes('bi - annual') || combined.includes('half')) return 4;
    if (combined.includes('yearly') || combined.includes('annual') || combined.includes('year')) return 5;
    return 6;
  };

  const getCycleKey = (p: SubscriptionPlan): string => {
    const r = cycleRank(p.billing_cycle || '', p.name || '');
    if (r === 1) return 'weekly';
    if (r === 2) return 'monthly';
    if (r === 3) return 'quarterly';
    if (r === 4) return 'biannual';
    if (r === 5) return 'yearly';
    return p.billing_cycle || p.id;
  };

  // Map to hold single deduplicated plan per billing cycle
  const planByCycle = new Map<string, SubscriptionPlan>();
  candidatePlans.forEach(plan => {
    const key = getCycleKey(plan);
    const existing = planByCycle.get(key);
    if (!existing) {
      planByCycle.set(key, plan);
    } else {
      // Prefer cleaner non-empty descriptions or newer plans
      if (plan.id.includes('new') || plan.name.includes('(New)') || Number(plan.price) > 0) {
        planByCycle.set(key, plan);
      }
    }
  });

  // Ensure default plans exist for missing cycles
  const defaultList = (INITIAL_PLANS || []).filter(p => isGhana ? isGhanaPlan(p) : !isGhanaPlan(p) && p.id !== 'plan-free');
  defaultList.forEach(defPlan => {
    const key = getCycleKey(defPlan);
    if (!planByCycle.has(key)) {
      planByCycle.set(key, defPlan);
    }
  });

  const uniquePlans = Array.from(planByCycle.values());

  return uniquePlans.sort((a, b) => {
    const rankA = cycleRank(a.billing_cycle || '', a.name || '');
    const rankB = cycleRank(b.billing_cycle || '', b.name || '');
    if (rankA !== rankB) return rankA - rankB;
    return Number(a.price || 0) - Number(b.price || 0);
  });
}

export function isGhanaBookmaker(b: any): boolean {
  if (!b) return false;
  const country = String(b.country || '').toLowerCase();
  const name = String(b.name || '').toLowerCase();
  const slug = String(b.slug || '').toLowerCase();
  const id = String(b.id || '').toLowerCase();

  return (
    country === 'gh' ||
    country === 'ghana' ||
    country === 'ghs' ||
    name.includes('ghana') ||
    slug.includes('ghana') ||
    id.includes('ghana') ||
    slug === 'soccabet' ||
    slug === 'premierbet' ||
    slug === 'betway' ||
    slug === 'sportybet-ghana'
  );
}

export function isPaymentDisabledBookmaker(b: any): boolean {
  if (!b) return false;
  const slug = String(b.slug || b.id || b || '').toLowerCase().trim();
  const name = String(b.name || '').toLowerCase().trim();
  return (
    slug === 'msport' ||
    name === 'msport' ||
    slug === 'betway' ||
    name.includes('betway')
  );
}

export function getMergedBookmakers(dbBookmakers?: Bookmaker[]): Bookmaker[] {
  const mergedMap = new Map<string, Bookmaker>();

  const getDedupeKey = (b: any): string => {
    if (!b) return '';
    const name = String(b.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    if (name) return name;
    const slug = String(b.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    if (slug) return slug;
    const id = String(b.id || '').toLowerCase().replace(/^bm-/, '').replace(/[^a-z0-9]/g, '').trim();
    return id;
  };

  (INITIAL_BOOKMAKERS || []).forEach(b => {
    if (b) {
      const key = getDedupeKey(b);
      if (key) mergedMap.set(key, b);
    }
  });

  if (Array.isArray(dbBookmakers)) {
    dbBookmakers.forEach(b => {
      if (b) {
        const key = getDedupeKey(b);
        if (key) {
          const existing = mergedMap.get(key);
          mergedMap.set(key, existing ? { ...existing, ...b } : b);
        }
      }
    });
  }
  return Array.from(mergedMap.values());
}

export function getBookmakersByCountry(dbBookmakers: Bookmaker[] | undefined, country: 'nigeria' | 'ghana'): Bookmaker[] {
  const all = getMergedBookmakers(dbBookmakers).filter(b => b && b.is_active !== false);
  if (country === 'ghana') {
    return all.filter(b => isGhanaBookmaker(b));
  } else {
    return all.filter(b => !isGhanaBookmaker(b));
  }
}

export const INITIAL_SUBSCRIPTIONS: UserSubscription[] = [];

export const INITIAL_BOOKMAKERS: Bookmaker[] = [
  // NIGERIA BOOKMAKERS (4)
  {
    id: 'bm-bet9ja',
    name: 'Bet9ja',
    slug: 'bet9ja',
    logo_url: 'https://images.unsplash.com/photo-1608248597481-496100c8c836?w=100&h=100&fit=crop&q=80',
    country: 'NG',
    is_active: true
  },
  {
    id: 'bm-betking',
    name: 'BetKing',
    slug: 'betking',
    logo_url: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=100&h=100&fit=crop&q=80',
    country: 'NG',
    is_active: true
  },
  {
    id: 'bm-sportybet',
    name: 'SportyBet',
    slug: 'sportybet',
    logo_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop&q=80',
    country: 'NG',
    is_active: true
  },
  {
    id: 'bm-msport',
    name: 'MSport',
    slug: 'msport',
    logo_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=100&h=100&fit=crop&q=80',
    country: 'NG',
    is_active: true
  },
  // GHANA BOOKMAKERS (4)
  {
    id: 'bm-betway',
    name: 'Betway Ghana',
    slug: 'betway',
    logo_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop&q=80',
    country: 'GH',
    is_active: true
  },
  {
    id: 'bm-premierbet',
    name: 'PremierBet Ghana',
    slug: 'premierbet',
    logo_url: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=100&h=100&fit=crop&q=80',
    country: 'GH',
    is_active: true
  },
  {
    id: 'bm-soccabet',
    name: 'Soccabet Ghana',
    slug: 'soccabet',
    logo_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=100&h=100&fit=crop&q=80',
    country: 'GH',
    is_active: true
  },
  {
    id: 'bm-sportybet-ghana',
    name: 'SportyBet Ghana',
    slug: 'sportybet-ghana',
    logo_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop&q=80',
    country: 'GH',
    is_active: true
  }
];

export const INITIAL_POOL_WEEKS: PoolWeek[] = [
  {
    id: 'pw-week-48',
    week_number: 48,
    season_year: 2026,
    pool_type: 'aussie',
    fixture_date: '2026-05-23',
    status: 'closed',
    published_at: '2026-05-23T18:00:00Z',
    created_at: '2026-05-18T09:00:00Z'
  },
  {
    id: 'pw-week-49',
    week_number: 49,
    season_year: 2026,
    pool_type: 'aussie',
    fixture_date: '2026-06-06', // Current week based on local time 2026-06-06
    status: 'active',
    published_at: '2026-06-01T08:00:00Z',
    created_at: '2026-05-25T09:00:00Z'
  },
  {
    id: 'pw-week-50',
    week_number: 50,
    season_year: 2026,
    pool_type: 'uk',
    fixture_date: '2026-06-13',
    status: 'upcoming',
    published_at: null,
    created_at: '2026-06-01T09:00:00Z'
  }
];

export const INITIAL_POOL_CODES: PoolCode[] = [
  {
    id: 'pc-001',
    pool_week_id: 'pw-week-49', // Week 49 Aussie (ACTIVE)
    bookmaker_id: 'bm-bet9ja',
    uploaded_by: 'usr-admin-777',
    codes_content: '--- WEEK 49 Aussie Bet9ja Pool Codes ---\n1. Arsenal vs Chelsea -> Code: [4129]\n2. Liverpool vs Leeds -> Code: [3312]\n3. Man City vs Everton -> Code: [5091]\n4. Napoli vs Juventus -> Code: [9023]\n5. Real Madrid vs Sevilla -> Code: [1114]',
    file_url: 'https://storage.poolcodes.com/files/w49-bet9ja.txt',
    access_level: 'free',
    download_count: 32,
    is_active: true,
    created_at: '2026-06-01T09:30:00Z',
    updated_at: '2026-06-01T09:30:00Z'
  },
  {
    id: 'pc-002',
    pool_week_id: 'pw-week-49', // Week 49 Aussie (ACTIVE)
    bookmaker_id: 'bm-betking',
    uploaded_by: 'usr-admin-777',
    codes_content: '--- WEEK 49 Aussie BetKing Premium ---\nSECRET HIGH-ODDS COMBO CODES:\n6. Roma vs Milan -> Code: [BK-7721] (Draw Chance: 84%)\n7. Aston Villa vs Wolves -> Code: [BK-3392] (Pool Tip: Match to Draw)\n8. Tottenham vs Brentford -> Code: [BK-5522] (Home win/Draw)',
    file_url: 'https://storage.poolcodes.com/files/w49-betking-premium.pdf',
    access_level: 'premium',
    download_count: 12,
    is_active: true,
    created_at: '2026-06-02T10:00:00Z',
    updated_at: '2026-06-02T10:00:00Z'
  },
  {
    id: 'pc-003',
    pool_week_id: 'pw-week-49', // Week 49 Aussie (ACTIVE)
    bookmaker_id: 'bm-sportybet',
    uploaded_by: 'usr-admin-777',
    codes_content: '--- WEEK 49 Aussie Sportybet VIP Codes ---\n9. Leicester vs West Ham -> Code: [SB-1104]\n10. Valencia vs Villarreal -> Code: [SB-9031]',
    file_url: null,
    access_level: 'premium',
    download_count: 5,
    is_active: true,
    created_at: '2026-06-02T11:15:00Z',
    updated_at: '2026-06-02T11:15:00Z'
  },
  {
    id: 'pc-old',
    pool_week_id: 'pw-week-48', // Older closed week
    bookmaker_id: 'bm-bet9ja',
    uploaded_by: 'usr-admin-777',
    codes_content: '--- WEEK 48 ARCHIVED CODES ---\nArsenal vs Newcastle -> Code: [1021]\nEverton vs Man Utd -> Code: [8492]',
    file_url: null,
    access_level: 'free',
    download_count: 85,
    is_active: true,
    created_at: '2026-05-19T09:30:00Z',
    updated_at: '2026-05-19T09:30:00Z'
  }
];

export const POOL_RESULT_ROWS: PoolResultRecord[] = [
  { id: 1, home_team: 'Bristol C.', away_team: 'Millwall', status: 'Away', pool_result: '0-:-2' },
  { id: 2, home_team: 'Charlton', away_team: 'Derby', status: 'Home', pool_result: '2-:-1' },
  { id: 3, home_team: 'Middlesbro', away_team: 'Lincoln', status: 'Home', pool_result: '2-:-1' },
  { id: 4, home_team: 'Norwich', away_team: 'West Brom', status: 'Away', pool_result: '1-:-2' },
  { id: 5, home_team: 'Portsmouth', away_team: 'Q.P.R.', status: 'Away', pool_result: '1-:-3' },
  { id: 6, home_team: 'Stoke', away_team: 'Swansea', status: 'Away', pool_result: '1-:-2' },
  { id: 7, home_team: 'Sheff Utd.', away_team: 'Birmingham', status: 'noScoreDraw', pool_result: '0-:-0' },
  { id: 8, home_team: 'Watford', away_team: 'Southampton', status: 'Home', pool_result: '2-:-1' },
  { id: 9, home_team: 'Burnley', away_team: 'West Ham', status: 'ScoreDraw', pool_result: '2-:-2' },
  { id: 10, home_team: 'Barnsley', away_team: 'Bromley', status: 'Away', pool_result: '0-:-1' },
  { id: 11, home_team: 'Blackpool', away_team: 'Wycombe', status: 'ScoreDraw', pool_result: '1-:-1' },
  { id: 12, home_team: 'Bradford C.', away_team: 'Peterboro', status: 'Home', pool_result: '2-:-0' },
  { id: 13, home_team: 'Burton A.', away_team: 'Stevenage', status: 'ScoreDraw', pool_result: '1-:-1' },
  { id: 14, home_team: 'Cambridge U.', away_team: 'Wigan A.', status: 'Home', pool_result: '3-:-2' },
  { id: 15, home_team: 'Huddersfield', away_team: 'A.Wimbledon', status: 'Home', pool_result: '3-:-0' },
  { id: 16, home_team: 'Leyton O.', away_team: 'Sheff Wed.', status: 'Away', pool_result: '1-:-2' },
  { id: 17, home_team: 'Mansfield', away_team: 'Doncaster', status: 'Home', pool_result: '2-:-1' },
  { id: 18, home_team: 'Plymouth', away_team: 'Stockport', status: 'Away', pool_result: '1-:-3' },
  { id: 19, home_team: 'Dep. Alaves', away_team: 'Getafe', status: 'Home', pool_result: '3-:-0' },
  { id: 20, home_team: 'Sevilla', away_team: 'R. Vallecano', status: 'Home', pool_result: '2-:-1' },
  { id: 21, home_team: 'R. Santander', away_team: 'Villarreal', status: 'ScoreDraw', pool_result: '2-:-2' },
  { id: 22, home_team: 'Espanyol', away_team: 'Levante', status: 'Home', pool_result: '3-:-0' },
  { id: 23, home_team: 'Celta Vigo', away_team: 'Osasuna', status: 'noScoreDraw', pool_result: '0-:-0' },
  { id: 24, home_team: 'Academico V.', away_team: 'Santa Clara', status: 'Away', pool_result: '0-:-1' },
  { id: 25, home_team: 'Rio Ave', away_team: 'FC Porto', status: 'Away', pool_result: '0-:-2' },
  { id: 26, home_team: 'Famalicao', away_team: 'Maritimo', status: 'Away', pool_result: '1-:-2' },
  { id: 27, home_team: 'Nacional', away_team: 'Estoril', status: 'Home', pool_result: '2-:-0' },
  { id: 28, home_team: 'Braga', away_team: 'Gil Vicente', status: 'noScoreDraw', pool_result: '0-:-0' },
  { id: 29, home_team: 'Casa Pia AC', away_team: 'Benfica', status: 'noScoreDraw', pool_result: '0-:-0' },
  { id: 30, home_team: 'FC Utrecht', away_team: 'AZ Alkmaar', status: 'Away', pool_result: '1-:-4' },
  { id: 31, home_team: 'Excelsior', away_team: 'PSV', status: 'Away', pool_result: '1-:-2' },
  { id: 32, home_team: 'FC Twente', away_team: 'PEC Zwolle', status: 'Home', pool_result: '3-:-1' },
  { id: 33, home_team: 'Feyenoord', away_team: 'G.A. Eagles', status: 'ScoreDraw', pool_result: '2-:-2' },
  { id: 34, home_team: 'Ajax', away_team: 'Heerenveen', status: 'ScoreDraw', pool_result: '2-:-2' },
  { id: 35, home_team: 'Union SG', away_team: 'Z. Waregem', status: 'noScoreDraw', pool_result: '0-:-0' },
  { id: 36, home_team: 'Genk', away_team: 'Westerlo', status: 'Home', pool_result: '3-:-2' },
  { id: 37, home_team: 'OH Leuven', away_team: 'Club Brugge', status: 'Away', pool_result: '0-:-3' },
  { id: 38, home_team: 'SK Beveren', away_team: 'Anderlecht', status: 'Home', pool_result: '1-:-0' },
  { id: 39, home_team: 'RAAL Louviere', away_team: 'Gent', status: 'Away', pool_result: '1-:-2' },
  { id: 40, home_team: 'KV Mechelen', away_team: 'St’d Liege', status: 'ScoreDraw', pool_result: '3-:-3' },
  { id: 41, home_team: 'A. Lustenau', away_team: 'Wolfsberger', status: 'Home', pool_result: '2-:-1' },
  { id: 42, home_team: 'Hartberg', away_team: 'Austria Wien', status: 'Away', pool_result: '0-:-2' },
  { id: 43, home_team: 'WSG Tirol', away_team: 'Salzburg', status: 'Away', pool_result: '0-:-3' },
  { id: 44, home_team: 'Rapid Wien', away_team: 'Grazer AK', status: 'Home', pool_result: '8-:-0' },
  { id: 45, home_team: 'Kasimpasa', away_team: 'Trabzonspor', status: 'ScoreDraw', pool_result: '1-:-1' },
  { id: 46, home_team: 'Konyaspor', away_team: 'Rizespor', status: 'Away', pool_result: '0-:-1' },
  { id: 47, home_team: 'Genclerbirligi', away_team: 'Fenerbahce', status: 'Home', pool_result: '2-:-1' },
  { id: 48, home_team: 'I. Basaksehir', away_team: 'Kocaelispor', status: 'Home', pool_result: '2-:-0' },
  { id: 49, home_team: 'Besiktas', away_team: 'Eyupspor', status: 'Home', pool_result: '1-:-0' }
];

export const INITIAL_POOL_RESULTS: PoolResult[] = [
  {
    id: 'pr-w49',
    pool_week_id: 'pw-week-49',
    bookmaker_id: 'bm-bet9ja',
    uploaded_by: 'usr-admin-777',
    results_content: '--- WEEK 49 OFFICIAL RESULTS ---\nMatch 7: Sheff Utd. 0-0 Birmingham (noScoreDraw)\nMatch 9: Burnley 2-2 West Ham (ScoreDraw)\nMatch 11: Blackpool 1-1 Wycombe (ScoreDraw)\nMatch 13: Burton A. 1-1 Stevenage (ScoreDraw)\nMatch 21: R. Santander 2-2 Villarreal (ScoreDraw)',
    file_url: 'https://storage.poolcodes.com/results/w49-results.pdf',
    created_at: '2026-06-08T10:00:00Z',
    title: 'Week 49 UK Pool results: Official pool_result Table Matches',
    week_number: 49,
    season_year: 2026,
    pool_type: 'uk',
    fixture_date: '2026-06-06',
    comments_count: 0,
    results_table: POOL_RESULT_ROWS.map(r => {
      const isDraw = r.status === 'ScoreDraw' || r.status === 'noScoreDraw';
      const outcome = isDraw ? 'DRAW' : (r.status === 'Home' ? 'HOME WIN' : 'AWAY WIN');
      return {
        id: r.id,
        matchNo: r.id,
        home_team: r.home_team,
        away_team: r.away_team,
        status: r.status,
        pool_result: r.pool_result,
        homeTeam: r.home_team,
        awayTeam: r.away_team,
        fullTimeScore: r.pool_result.replace('-:-', ' - '),
        outcome,
        payoutStatus: 'CLEARED'
      };
    })
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    user_id: 'usr-prem-202', // alex_premium
    pool_code_id: 'pc-002',
    type: 'new_codes',
    title: 'Secret Premium Codes Released!',
    body: 'Admin uploaded Week 49 Premium BetKing Codes! View them now on your VIP dashboard.',
    is_read: false,
    read_at: null,
    created_at: '2026-06-02T10:05:00Z'
  },
  {
    id: 'notif-002',
    user_id: 'usr-free-101', // john_doe_free
    pool_code_id: 'pc-001',
    type: 'new_codes',
    title: 'Week 49 Free Codes Available',
    body: 'Bet9ja Aussie Pool Week 49 Free fixtures are active. Start compiling your coupons!',
    is_read: true,
    read_at: '2026-06-01T15:00:00Z',
    created_at: '2026-06-01T09:35:00Z'
  }
];

export const INITIAL_DOWNLOADS: UserDownload[] = [
  {
    id: 'ud-01',
    user_id: 'usr-free-101',
    pool_code_id: 'pc-001', // Free Week 49 Bet9ja codes
    downloaded_at: '2026-06-01T15:00:00Z'
  },
  {
    id: 'ud-02',
    user_id: 'usr-prem-202',
    pool_code_id: 'pc-001', // Premium user downloaded free code too
    downloaded_at: '2026-06-01T15:10:00Z'
  }
];

// Structural metadata for the Schema Explorer
export interface ColumnDefinition {
  name: string;
  type: string;
  constraints: string[];
  description: string;
}

export interface TableSchema {
  name: string;
  description: string;
  columns: ColumnDefinition[];
  relationships: {
    fromColumn: string;
    toTable: string;
    toColumn: string;
    type: '1:1' | '1:N' | 'N:1';
  }[];
  sql: string;
}

export const DB_SCHEMAS: TableSchema[] = [
  {
    name: 'users',
    description: 'Holds registered application users, specifying their access roles and registration status.',
    sql: `CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role DEFAULT 'user',
  status user_status DEFAULT 'unverified',
  phone VARCHAR(20),
  email_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`,
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Unique identifier for each user record.' },
      { name: 'username', type: 'VARCHAR(50)', constraints: ['UNIQUE', 'NOT NULL'], description: 'Unique handle/login name for the user.' },
      { name: 'email', type: 'VARCHAR(255)', constraints: ['UNIQUE', 'NOT NULL'], description: 'Email address, used for login verification and reports.' },
      { name: 'password_hash', type: 'TEXT', constraints: ['NOT NULL'], description: 'Securely hashed crypt credential.' },
      { name: 'role', type: "user_role (ENUM)", constraints: ["DEFAULT 'user'"], description: "Role matching 'admin', 'editor', or 'user'. Controls access layers." },
      { name: 'status', type: "user_status (ENUM)", constraints: ["DEFAULT 'unverified'"], description: "Indicates if user accounts are 'active', 'suspended', or 'unverified'." },
      { name: 'phone', type: 'VARCHAR(20)', constraints: ['NULLABLE'], description: 'Cell contacts, optional for receiving pool alerts via SMS.' },
      { name: 'email_verified_at', type: 'TIMESTAMP', constraints: ['NULLABLE'], description: 'Timestamp when the user account completed email verification.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ["DEFAULT NOW()"], description: 'Record insertion date.' },
      { name: 'updated_at', type: 'TIMESTAMP', constraints: ["DEFAULT NOW()"], description: 'Record modification date.' }
    ],
    relationships: []
  },
  {
    name: 'subscription_plans',
    description: 'Defines the available subscription products, limits, and pricing metadata.',
    sql: `CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  billing_cycle billing_cycle NOT NULL,
  has_premium_codes BOOLEAN DEFAULT FALSE,
  has_odds_comparison BOOLEAN DEFAULT FALSE,
  has_results BOOLEAN DEFAULT TRUE,
  has_notifications BOOLEAN DEFAULT FALSE,
  max_bookmakers INT DEFAULT 2,
  created_at TIMESTAMP DEFAULT NOW()
);`,
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Primary ID.' },
      { name: 'name', type: 'VARCHAR(100)', constraints: ['NOT NULL'], description: 'Display name of product (e.g. Weekly Premium Pro).' },
      { name: 'description', type: 'TEXT', constraints: ['NULLABLE'], description: 'Detailed perks listed on paywalls.' },
      { name: 'price', type: 'DECIMAL(10,2)', constraints: ['NOT NULL'], description: 'Pricing in currency units (e.g. ₦ or $).' },
      { name: 'billing_cycle', type: "billing_cycle (ENUM)", constraints: ['NOT NULL'], description: "Cycles matching 'weekly', 'monthly', or 'yearly'." },
      { name: 'has_premium_codes', type: 'BOOLEAN', constraints: ["DEFAULT FALSE"], description: 'Grants access to highvalue private codes matching premium level.' },
      { name: 'has_odds_comparison', type: 'BOOLEAN', constraints: ["DEFAULT FALSE"], description: 'Unlocks bookmaker cross-referencing capabilities.' },
      { name: 'has_results', type: 'BOOLEAN', constraints: ["DEFAULT TRUE"], description: 'Access archive pool results sheets.' },
      { name: 'has_notifications', type: 'BOOLEAN', constraints: ["DEFAULT FALSE"], description: 'Broadcast alert optins enabled on code uploads.' },
      { name: 'max_bookmakers', type: 'INT', constraints: ["DEFAULT 2"], description: 'Limit on concurrently accessible bookmaker codes sheets.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ["DEFAULT NOW()"], description: 'Record insertion date.' }
    ],
    relationships: []
  },
  {
    name: 'user_subscriptions',
    description: 'Maps users to their bought/assigned subscription plans with expirations and transaction references.',
    sql: `CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status subscription_status DEFAULT 'active',
  starts_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  payment_ref VARCHAR(100),
  payment_provider VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);`,
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Subscription ID.' },
      { name: 'user_id', type: 'UUID', constraints: ['FOREIGN KEY REFERENCES users(id)', 'ON DELETE CASCADE'], description: 'Reference of the subscriber.' },
      { name: 'plan_id', type: 'UUID', constraints: ['FOREIGN KEY REFERENCES subscription_plans(id)'], description: 'Reference of the subscription model applied.' },
      { name: 'status', type: "subscription_status (ENUM)", constraints: ["DEFAULT 'active'"], description: "Current billing status: 'active', 'expired', or 'cancelled'." },
      { name: 'starts_at', type: 'TIMESTAMP', constraints: ['NOT NULL'], description: 'The absolute starting timestamp of validity.' },
      { name: 'expires_at', type: 'TIMESTAMP', constraints: ['NOT NULL'], description: 'The timestamp after which premium unlocks turn off.' },
      { name: 'payment_ref', type: 'VARCHAR(100)', constraints: ['NULLABLE'], description: 'Merchant reference id (Flutterwave, Stripe, Paystack reference).' },
      { name: 'payment_provider', type: 'VARCHAR(50)', constraints: ['NULLABLE'], description: 'Processor name.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ["DEFAULT NOW()"], description: 'Record insertion date.' }
    ],
    relationships: [
      { fromColumn: 'user_id', toTable: 'users', toColumn: 'id', type: 'N:1' },
      { fromColumn: 'plan_id', toTable: 'subscription_plans', toColumn: 'id', type: 'N:1' }
    ]
  },
  {
    name: 'bookmakers',
    description: 'Entities representing supported pool sportbook operators (Bet9ja, BetKing, Sportybet, etc.).',
    sql: `CREATE TABLE bookmakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  country VARCHAR(50) DEFAULT 'NG',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);`,
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Bookmaker unique ID.' },
      { name: 'name', type: 'VARCHAR(100)', constraints: ['NOT NULL'], description: 'Brand name (e.g., Bet9ja).' },
      { name: 'slug', type: 'VARCHAR(100)', constraints: ['UNIQUE', 'NOT NULL'], description: 'Normalized routing string.' },
      { name: 'logo_url', type: 'TEXT', constraints: ['NULLABLE'], description: 'Graphic URL of official brand identity.' },
      { name: 'country', type: 'VARCHAR(50)', constraints: ["DEFAULT 'NG'"], description: 'Country of main market operation.' },
      { name: 'is_active', type: 'BOOLEAN', constraints: ["DEFAULT TRUE"], description: 'If disabled, all affiliated coupon codes hide off the portal.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ["DEFAULT NOW()"], description: 'Record insertion.' }
    ],
    relationships: []
  },
  {
    name: 'pool_weeks',
    description: 'Splitted fixtures dates and weeks of pool matches representing UK, Aussie, or International layouts.',
    sql: `CREATE TABLE pool_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INT NOT NULL,
  season_year INT NOT NULL,
  pool_type pool_type DEFAULT 'aussie',
  fixture_date DATE NOT NULL,
  status week_status DEFAULT 'upcoming',
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(week_number, season_year, pool_type)
);`,
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Unique week ID.' },
      { name: 'week_number', type: 'INT', constraints: ['NOT NULL'], description: 'Corresponding season week (1 to 52).' },
      { name: 'season_year', type: 'INT', constraints: ['NOT NULL'], description: 'Pool season year identifier (e.g. 2026).' },
      { name: 'pool_type', type: "pool_type (ENUM)", constraints: ["DEFAULT 'aussie'"], description: "Pool system used: 'uk', 'aussie', or 'international'." },
      { name: 'fixture_date', type: 'DATE', constraints: ['NOT NULL'], description: 'The absolute date the games/coupons take place.' },
      { name: 'status', type: "week_status (ENUM)", constraints: ["DEFAULT 'upcoming'"], description: "The states: 'upcoming', 'active' (accepting analysis), or 'closed' (results locked)." },
      { name: 'published_at', type: 'TIMESTAMP', constraints: ['NULLABLE'], description: 'Time the week codes were visible online.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ["DEFAULT NOW()"], description: 'Record insertion.' }
    ],
    relationships: []
  },
  {
    name: 'pool_codes',
    description: 'Uploaded analysis text codes / fixtures details uploaded by site admins, bound to a week & bookmaker.',
    sql: `CREATE TABLE pool_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_week_id UUID REFERENCES pool_weeks(id) ON DELETE CASCADE,
  bookmaker_id UUID REFERENCES bookmakers(id),
  uploaded_by UUID REFERENCES users(id),
  codes_content TEXT,
  file_url TEXT,
  access_level access_level DEFAULT 'free',
  download_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`,
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Unique code file entry ID.' },
      { name: 'pool_week_id', type: 'UUID', constraints: ['REFERENCES pool_weeks(id)', 'ON DELETE CASCADE'], description: 'Tied week.' },
      { name: 'bookmaker_id', type: 'UUID', constraints: ['REFERENCES bookmakers(id)'], description: 'Tied bookmaker platform.' },
      { name: 'uploaded_by', type: 'UUID', constraints: ['REFERENCES users(id)'], description: 'Admin or editor user account who published.' },
      { name: 'codes_content', type: 'TEXT', constraints: ['NULLABLE'], description: 'Direct coupon analysis code content strings.' },
      { name: 'file_url', type: 'TEXT', constraints: ['NULLABLE'], description: 'Link to corresponding PDF/TXT attachment sheet.' },
      { name: 'access_level', type: "access_level (ENUM)", constraints: ["DEFAULT 'free'"], description: "Permission required to view contents: 'free' or 'premium'." },
      { name: 'download_count', type: 'INT', constraints: ["DEFAULT 0"], description: 'Counter tracks views/downloads across subscribers.' },
      { name: 'is_active', type: 'BOOLEAN', constraints: ["DEFAULT TRUE"], description: 'Active flags.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ["DEFAULT NOW()"], description: 'Upload time.' },
      { name: 'updated_at', type: 'TIMESTAMP', constraints: ["DEFAULT NOW()"], description: 'Last revision date.' }
    ],
    relationships: [
      { fromColumn: 'pool_week_id', toTable: 'pool_weeks', toColumn: 'id', type: 'N:1' },
      { fromColumn: 'bookmaker_id', toTable: 'bookmakers', toColumn: 'id', type: 'N:1' },
      { fromColumn: 'uploaded_by', toTable: 'users', toColumn: 'id', type: 'N:1' }
    ]
  },
  {
    name: 'pool_result',
    description: 'Stores weekly match scoreline results featuring home/away teams, match outcome status, and score string.',
    sql: `CREATE TABLE pool_result (
  id SERIAL PRIMARY KEY,
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  pool_result VARCHAR(20) NOT NULL
);`,
    columns: [
      { name: 'id', type: 'SERIAL / INT', constraints: ['PRIMARY KEY', 'AUTO_INCREMENT'], description: 'Sequential match fixture ID.' },
      { name: 'home_team', type: 'VARCHAR(100)', constraints: ['NOT NULL'], description: 'Home playing team name (e.g. Bristol C., Charlton).' },
      { name: 'away_team', type: 'VARCHAR(100)', constraints: ['NOT NULL'], description: 'Away playing team name (e.g. Millwall, Derby).' },
      { name: 'status', type: 'VARCHAR(50)', constraints: ['NOT NULL'], description: 'Match outcome status (e.g. Away, Home, ScoreDraw, noScoreDraw).' },
      { name: 'pool_result', type: 'VARCHAR(20)', constraints: ['NOT NULL'], description: 'Match full-time score string (e.g. 0-:-2, 2-:-1, 0-:-0, 3-:-3).' }
    ],
    relationships: []
  },
  {
    name: 'pool_results',
    description: 'Stores final match outcomes and draw counts mapping pool coupons for verifying correct predictions.',
    sql: `CREATE TABLE pool_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_week_id UUID REFERENCES pool_weeks(id) ON DELETE CASCADE,
  bookmaker_id UUID REFERENCES bookmakers(id),
  uploaded_by UUID REFERENCES users(id),
  results_content TEXT,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);`,
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Result ID.' },
      { name: 'pool_week_id', type: 'UUID', constraints: ['REFERENCES pool_weeks(id)', 'ON DELETE CASCADE'], description: 'Tied week.' },
      { name: 'bookmaker_id', type: 'UUID', constraints: ['REFERENCES bookmakers(id)'], description: 'Tied bookmaker brand.' },
      { name: 'uploaded_by', type: 'UUID', constraints: ['REFERENCES users(id)'], description: 'Analyst/Admin.' },
      { name: 'results_content', type: 'TEXT', constraints: ['NULLABLE'], description: 'Score lines and coupon hits (e.g. 1-1, DRAW!).' },
      { name: 'file_url', type: 'TEXT', constraints: ['NULLABLE'], description: 'Link of pdf copy.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ["DEFAULT NOW()"], description: 'Creation.' }
    ],
    relationships: [
      { fromColumn: 'pool_week_id', toTable: 'pool_weeks', toColumn: 'id', type: 'N:1' },
      { fromColumn: 'bookmaker_id', toTable: 'bookmakers', toColumn: 'id', type: 'N:1' },
      { fromColumn: 'uploaded_by', toTable: 'users', toColumn: 'id', type: 'N:1' }
    ]
  },
  {
    name: 'notifications',
    description: 'Live notification feeds pushes, triggering unread alerts on user apps on code releases or billing.',
    sql: `CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pool_code_id UUID REFERENCES pool_codes(id) ON DELETE SET NULL,
  type notification_type DEFAULT 'new_codes',
  title VARCHAR(255),
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);`,
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Notif primary ID.' },
      { name: 'user_id', type: 'UUID', constraints: ['REFERENCES users(id)', 'ON DELETE CASCADE'], description: 'Target user receiving this push.' },
      { name: 'pool_code_id', type: 'UUID', constraints: ['REFERENCES pool_codes(id)', 'ON DELETE SET NULL'], description: 'Optional coupon code reference.' },
      { name: 'type', type: "notification_type (ENUM)", constraints: ["DEFAULT 'new_codes'"], description: "Categories: 'new_codes', 'results_out', 'subscription_expiring', or 'system'." },
      { name: 'title', type: 'VARCHAR(255)', constraints: ['NOT NULL'], description: 'Title header.' },
      { name: 'body', type: 'TEXT', constraints: ['NOT NULL'], description: 'Detailed text contents.' },
      { name: 'is_read', type: 'BOOLEAN', constraints: ["DEFAULT FALSE"], description: 'Tracks reader status toggle.' },
      { name: 'read_at', type: 'TIMESTAMP', constraints: ['NULLABLE'], description: 'Read occurrence timestamp.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ["DEFAULT NOW()"], description: 'Record insertion.' }
    ],
    relationships: [
      { fromColumn: 'user_id', toTable: 'users', toColumn: 'id', type: 'N:1' },
      { fromColumn: 'pool_code_id', toTable: 'pool_codes', toColumn: 'id', type: 'N:1' }
    ]
  },
  {
    name: 'user_downloads',
    description: 'Tracks which user account downloaded which code file at what absolute time (prevents multi-device abuse).',
    sql: `CREATE TABLE user_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pool_code_id UUID REFERENCES pool_codes(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, pool_code_id)
);`,
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Download transaction ID.' },
      { name: 'user_id', type: 'UUID', constraints: ['REFERENCES users(id)', 'ON DELETE CASCADE'], description: 'Accessor User.' },
      { name: 'pool_code_id', type: 'UUID', constraints: ['REFERENCES pool_codes(id)', 'ON DELETE CASCADE'], description: 'Accessed Code record.' },
      { name: 'downloaded_at', type: 'TIMESTAMP', constraints: ["DEFAULT NOW()"], description: 'Execution timestamp.' }
    ],
    relationships: [
      { fromColumn: 'user_id', toTable: 'users', toColumn: 'id', type: 'N:1' },
      { fromColumn: 'pool_code_id', toTable: 'pool_codes', toColumn: 'id', type: 'N:1' }
    ]
  },
  {
    name: 'bet9ja',
    description: 'Stores customized pool match coupon codesheets specifically for the Bet9ja plan component. Designed to match the CSV data structure.',
    sql: `CREATE TABLE bet9ja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool INT NULL,
  betcode VARCHAR(50) NULL,
  home VARCHAR(100) NULL,
  away VARCHAR(100) NULL,
  homewin DECIMAL(5,2) NULL,
  draw DECIMAL(5,2) NULL,
  awaywin DECIMAL(5,2) NULL,
  bet VARCHAR(50) NULL,
  status VARCHAR(50) NULL,
  kickoff VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT NOW()
);`,
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Unique row reference ID.' },
      { name: 'pool', type: 'INT', constraints: ['NULLABLE'], description: 'Pool match number.' },
      { name: 'betcode', type: 'VARCHAR(50)', constraints: ['NULLABLE'], description: 'Bet9ja booking betcode string.' },
      { name: 'home', type: 'VARCHAR(100)', constraints: ['NULLABLE'], description: 'Home playing team name.' },
      { name: 'away', type: 'VARCHAR(100)', constraints: ['NULLABLE'], description: 'Away playing team name.' },
      { name: 'homewin', type: 'DECIMAL(5,2)', constraints: ['NULLABLE'], description: 'Home win odds value.' },
      { name: 'draw', type: 'DECIMAL(5,2)', constraints: ['NULLABLE'], description: 'Draw odds value (X).' },
      { name: 'awaywin', type: 'DECIMAL(5,2)', constraints: ['NULLABLE'], description: 'Away win odds value.' },
      { name: 'bet', type: 'VARCHAR(50)', constraints: ['NULLABLE'], description: 'Recommended bet tip option.' },
      { name: 'status', type: 'VARCHAR(50)', constraints: ['NULLABLE'], description: 'Current status of match (e.g. pending, void).' },
      { name: 'kickoff', type: 'VARCHAR(100)', constraints: ['NULLABLE'], description: 'Kick off time stamp (West Africa Time).' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ["DEFAULT NOW()"], description: 'Record insertion date.' }
    ],
    relationships: []
  },
  {
    name: 'betking',
    description: 'Stores customized pool match coupon codesheets specifically for the Betking plan component. Designed to match the CSV data structure.',
    sql: `CREATE TABLE betking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool INT NULL,
  betcode VARCHAR(50) NULL,
  home VARCHAR(100) NULL,
  away VARCHAR(100) NULL,
  homewin DECIMAL(5,2) NULL,
  draw DECIMAL(5,2) NULL,
  awaywin DECIMAL(5,2) NULL,
  bet VARCHAR(50) NULL,
  status VARCHAR(50) NULL,
  kickoff VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT NOW()
);`,
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Unique row reference ID.' },
      { name: 'pool', type: 'INT', constraints: ['NULLABLE'], description: 'Pool match number.' },
      { name: 'betcode', type: 'VARCHAR(50)', constraints: ['NULLABLE'], description: 'Betking booking betcode string.' },
      { name: 'home', type: 'VARCHAR(100)', constraints: ['NULLABLE'], description: 'Home playing team name.' },
      { name: 'away', type: 'VARCHAR(100)', constraints: ['NULLABLE'], description: 'Away playing team name.' },
      { name: 'homewin', type: 'DECIMAL(5,2)', constraints: ['NULLABLE'], description: 'Home win odds value.' },
      { name: 'draw', type: 'DECIMAL(5,2)', constraints: ['NULLABLE'], description: 'Draw odds value (X).' },
      { name: 'awaywin', type: 'DECIMAL(5,2)', constraints: ['NULLABLE'], description: 'Away win odds value.' },
      { name: 'bet', type: 'VARCHAR(50)', constraints: ['NULLABLE'], description: 'Recommended bet tip option.' },
      { name: 'status', type: 'VARCHAR(50)', constraints: ['NULLABLE'], description: 'Current status of match (e.g. pending, void).' },
      { name: 'kickoff', type: 'VARCHAR(100)', constraints: ['NULLABLE'], description: 'Kick off time stamp (West Africa Time).' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ["DEFAULT NOW()"], description: 'Record insertion date.' }
    ],
    relationships: []
  },
  {
    name: 'sportybet',
    description: 'Stores customized pool match coupon codesheets specifically for the Sportybet plan component. Designed to match the CSV data structure.',
    sql: `CREATE TABLE sportybet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool INT NULL,
  betcode VARCHAR(50) NULL,
  home VARCHAR(100) NULL,
  away VARCHAR(100) NULL,
  homewin DECIMAL(5,2) NULL,
  draw DECIMAL(5,2) NULL,
  awaywin DECIMAL(5,2) NULL,
  bet VARCHAR(50) NULL,
  status VARCHAR(50) NULL,
  kickoff VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT NOW()
);`,
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Unique row reference ID.' },
      { name: 'pool', type: 'INT', constraints: ['NULLABLE'], description: 'Pool match number.' },
      { name: 'betcode', type: 'VARCHAR(50)', constraints: ['NULLABLE'], description: 'Sportybet booking betcode string.' },
      { name: 'home', type: 'VARCHAR(100)', constraints: ['NULLABLE'], description: 'Home playing team name.' },
      { name: 'away', type: 'VARCHAR(100)', constraints: ['NULLABLE'], description: 'Away playing team name.' },
      { name: 'homewin', type: 'DECIMAL(5,2)', constraints: ['NULLABLE'], description: 'Home win odds value.' },
      { name: 'draw', type: 'DECIMAL(5,2)', constraints: ['NULLABLE'], description: 'Draw odds value (X).' },
      { name: 'awaywin', type: 'DECIMAL(5,2)', constraints: ['NULLABLE'], description: 'Away win odds value.' },
      { name: 'bet', type: 'VARCHAR(50)', constraints: ['NULLABLE'], description: 'Recommended bet tip option.' },
      { name: 'status', type: 'VARCHAR(50)', constraints: ['NULLABLE'], description: 'Current status of match (e.g. pending, void).' },
      { name: 'kickoff', type: 'VARCHAR(100)', constraints: ['NULLABLE'], description: 'Kick off time stamp (West Africa Time).' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ["DEFAULT NOW()"], description: 'Record insertion date.' }
    ],
    relationships: []
  },
  {
    name: 'agent_user_plans',
    description: 'Tracks customized subscriber package details for agent audits, detailing the exact bookmakers selected per subscription plan.',
    sql: `CREATE TABLE agent_user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  selected_bookmakers TEXT[] NOT NULL DEFAULT '{}',
  starts_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);`,
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Unique ledger identification ID.' },
      { name: 'user_id', type: 'UUID', constraints: ['NOT NULL', 'FOREIGN KEY REFERENCES users(id)', 'ON DELETE CASCADE'], description: 'Subscriber user account reference.' },
      { name: 'plan_id', type: 'UUID', constraints: ['NOT NULL', 'FOREIGN KEY REFERENCES subscription_plans(id)', 'ON DELETE RESTRICT'], description: 'Subscribed bundle model reference.' },
      { name: 'selected_bookmakers', type: 'TEXT[] / JSONB', constraints: ['NOT NULL', "DEFAULT '{}'"], description: 'List of specific bookmakers enabled for customized access (e.g. sportybet, bet9ja, betking).' },
      { name: 'starts_at', type: 'TIMESTAMP', constraints: ['NOT NULL'], description: 'Billing cycle start date.' },
      { name: 'expires_at', type: 'TIMESTAMP', constraints: ['NOT NULL'], description: 'Billing expiration date.' },
      { name: 'status', type: 'VARCHAR(20)', constraints: ["DEFAULT 'active'"], description: "Current plan state (e.g. 'active', 'expired', 'cancelled')." },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ["DEFAULT NOW()"], description: 'Ledger creation date.' }
    ],
    relationships: [
      { fromColumn: 'user_id', toTable: 'users', toColumn: 'id', type: 'N:1' },
      { fromColumn: 'plan_id', toTable: 'subscription_plans', toColumn: 'id', type: 'N:1' }
    ]
  },
  {
    name: 'livescores',
    description: 'Stores real-time match fixtures, scores, playing minutes, and match statuses for live pool tracking.',
    sql: `CREATE TABLE livescores (
  id SERIAL PRIMARY KEY,
  fixture VARCHAR(150) NOT NULL,
  home_team VARCHAR(100),
  away_team VARCHAR(100),
  home_score INT DEFAULT 0,
  away_score INT DEFAULT 0,
  score VARCHAR(20) DEFAULT '0 - 0',
  status VARCHAR(30) DEFAULT 'not_started',
  minute VARCHAR(20),
  league VARCHAR(100),
  pool_number INT,
  last_checked TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);`,
    columns: [
      { name: 'id', type: 'SERIAL / INT', constraints: ['PRIMARY KEY', 'AUTO_INCREMENT'], description: 'Sequential match ID.' },
      { name: 'fixture', type: 'VARCHAR(150)', constraints: ['NOT NULL'], description: 'Full match fixture (e.g. Bristol C. vs Millwall).' },
      { name: 'home_team', type: 'VARCHAR(100)', constraints: ['NULLABLE'], description: 'Home team name.' },
      { name: 'away_team', type: 'VARCHAR(100)', constraints: ['NULLABLE'], description: 'Away team name.' },
      { name: 'home_score', type: 'INT', constraints: ['DEFAULT 0'], description: 'Current goals by home team.' },
      { name: 'away_score', type: 'INT', constraints: ['DEFAULT 0'], description: 'Current goals by away team.' },
      { name: 'score', type: 'VARCHAR(20)', constraints: ["DEFAULT '0 - 0'"], description: 'Formatted score string (e.g. 1 - 1).' },
      { name: 'status', type: 'VARCHAR(30)', constraints: ["DEFAULT 'not_started'"], description: 'Current state: live, finished, not_started, postponed.' },
      { name: 'minute', type: 'VARCHAR(20)', constraints: ['NULLABLE'], description: 'Match minute clock (e.g. 68\', FT).' },
      { name: 'league', type: 'VARCHAR(100)', constraints: ['NULLABLE'], description: 'Competition or league title.' },
      { name: 'pool_number', type: 'INT', constraints: ['NULLABLE'], description: 'Pool coupon fixture number.' },
      { name: 'last_checked', type: 'TIMESTAMP', constraints: ["DEFAULT NOW()"], description: 'Time of last live check.' }
    ],
    relationships: []
  }
];

export const INITIAL_LIVESCORES: LiveScoreRecord[] = [
  { id: 'ls-1', pool_number: 1, fixture: 'Bristol C. vs Millwall', home_team: 'Bristol C.', away_team: 'Millwall', home_score: 1, away_score: 1, score: '1 - 1', status: 'live', minute: "68'", league: 'Championship', lastChecked: new Date().toISOString() },
  { id: 'ls-2', pool_number: 7, fixture: 'Sheff Utd. vs Birmingham', home_team: 'Sheff Utd.', away_team: 'Birmingham', home_score: 0, away_score: 0, score: '0 - 0', status: 'live', minute: "42'", league: 'Championship', lastChecked: new Date().toISOString() },
  { id: 'ls-3', pool_number: 9, fixture: 'Burnley vs West Ham', home_team: 'Burnley', away_team: 'West Ham', home_score: 2, away_score: 2, score: '2 - 2', status: 'live', minute: "75'", league: 'Premier League', lastChecked: new Date().toISOString() },
  { id: 'ls-4', pool_number: 11, fixture: 'Blackpool vs Wycombe', home_team: 'Blackpool', away_team: 'Wycombe', home_score: 1, away_score: 1, score: '1 - 1', status: 'live', minute: "83'", league: 'League One', lastChecked: new Date().toISOString() },
  { id: 'ls-5', pool_number: 13, fixture: 'Burton A. vs Stevenage', home_team: 'Burton A.', away_team: 'Stevenage', home_score: 1, away_score: 1, score: '1 - 1', status: 'live', minute: "54'", league: 'League One', lastChecked: new Date().toISOString() },
  { id: 'ls-6', pool_number: 21, fixture: 'R. Santander vs Villarreal', home_team: 'R. Santander', away_team: 'Villarreal', home_score: 2, away_score: 2, score: '2 - 2', status: 'live', minute: "61'", league: 'La Liga 2', lastChecked: new Date().toISOString() },
  { id: 'ls-7', pool_number: 2, fixture: 'Charlton vs Derby', home_team: 'Charlton', away_team: 'Derby', home_score: 2, away_score: 1, score: '2 - 1', status: 'finished', minute: 'FT', league: 'Championship', lastChecked: new Date().toISOString() },
  { id: 'ls-8', pool_number: 3, fixture: 'Middlesbro vs Lincoln', home_team: 'Middlesbro', away_team: 'Lincoln', home_score: 2, away_score: 1, score: '2 - 1', status: 'finished', minute: 'FT', league: 'League One', lastChecked: new Date().toISOString() },
  { id: 'ls-9', pool_number: 4, fixture: 'Norwich vs West Brom', home_team: 'Norwich', away_team: 'West Brom', home_score: 1, away_score: 2, score: '1 - 2', status: 'finished', minute: 'FT', league: 'Championship', lastChecked: new Date().toISOString() },
  { id: 'ls-10', pool_number: 5, fixture: 'Portsmouth vs Q.P.R.', home_team: 'Portsmouth', away_team: 'Q.P.R.', home_score: 1, away_score: 3, score: '1 - 3', status: 'finished', minute: 'FT', league: 'Championship', lastChecked: new Date().toISOString() },
  { id: 'ls-11', pool_number: 6, fixture: 'Stoke vs Swansea', home_team: 'Stoke', away_team: 'Swansea', home_score: 1, away_score: 2, score: '1 - 2', status: 'finished', minute: 'FT', league: 'Championship', lastChecked: new Date().toISOString() },
  { id: 'ls-12', pool_number: 8, fixture: 'Watford vs Southampton', home_team: 'Watford', away_team: 'Southampton', home_score: 2, away_score: 1, score: '2 - 1', status: 'finished', minute: 'FT', league: 'Championship', lastChecked: new Date().toISOString() },
  { id: 'ls-13', pool_number: 10, fixture: 'Barnsley vs Bromley', home_team: 'Barnsley', away_team: 'Bromley', home_score: 0, away_score: 1, score: '0 - 1', status: 'finished', minute: 'FT', league: 'League One', lastChecked: new Date().toISOString() },
  { id: 'ls-14', pool_number: 12, fixture: 'Bradford C vs Peterboro', home_team: 'Bradford C', away_team: 'Peterboro', home_score: 2, away_score: 0, score: '2 - 0', status: 'finished', minute: 'FT', league: 'League One', lastChecked: new Date().toISOString() },
  { id: 'ls-15', pool_number: 14, fixture: 'Cambridge vs Wigan A.', home_team: 'Cambridge', away_team: 'Wigan A.', home_score: 3, away_score: 2, score: '3 - 2', status: 'finished', minute: 'FT', league: 'League One', lastChecked: new Date().toISOString() },
  { id: 'ls-16', pool_number: 15, fixture: 'Huddersfie vs A.Wimbledon', home_team: 'Huddersfie', away_team: 'A.Wimbledon', home_score: 3, away_score: 0, score: '3 - 0', status: 'finished', minute: 'FT', league: 'League One', lastChecked: new Date().toISOString() },
  { id: 'ls-17', pool_number: 16, fixture: 'Leyton O. vs Sheff Wed.', home_team: 'Leyton O.', away_team: 'Sheff Wed.', home_score: 1, away_score: 2, score: '1 - 2', status: 'finished', minute: 'FT', league: 'League One', lastChecked: new Date().toISOString() },
  { id: 'ls-18', pool_number: 17, fixture: 'Mansfield vs Doncaster', home_team: 'Mansfield', away_team: 'Doncaster', home_score: 2, away_score: 1, score: '2 - 1', status: 'finished', minute: 'FT', league: 'League Two', lastChecked: new Date().toISOString() },
  { id: 'ls-19', pool_number: 18, fixture: 'Plymouth vs Stockport', home_team: 'Plymouth', away_team: 'Stockport', home_score: 1, away_score: 3, score: '1 - 3', status: 'finished', minute: 'FT', league: 'League One', lastChecked: new Date().toISOString() },
  { id: 'ls-20', pool_number: 19, fixture: 'Dep. Alaves vs Getafe', home_team: 'Dep. Alaves', away_team: 'Getafe', home_score: 3, away_score: 0, score: '3 - 0', status: 'finished', minute: 'FT', league: 'La Liga', lastChecked: new Date().toISOString() },
  { id: 'ls-21', pool_number: 20, fixture: 'Sevilla vs R. Vallecano', home_team: 'Sevilla', away_team: 'R. Vallecano', home_score: 2, away_score: 1, score: '2 - 1', status: 'finished', minute: 'FT', league: 'La Liga', lastChecked: new Date().toISOString() },
  { id: 'ls-22', pool_number: 22, fixture: 'Arsenal vs Chelsea', home_team: 'Arsenal', away_team: 'Chelsea', home_score: 0, away_score: 0, score: '0 - 0', status: 'not_started', time: '17:30', league: 'Premier League', lastChecked: new Date().toISOString() },
  { id: 'ls-23', pool_number: 23, fixture: 'Liverpool vs Manchester City', home_team: 'Liverpool', away_team: 'Manchester City', home_score: 0, away_score: 0, score: '0 - 0', status: 'not_started', time: '20:00', league: 'Premier League', lastChecked: new Date().toISOString() }
];

export const INITIAL_POOL_CODES_COMPARISON: PoolCodesComparisonRecord[] = [
  { id: 101, pool: '1', home: 'Bristol C.', away: 'Millwall', league: 'Championship', match_league: 'Bristol C. vs Millwall (Championship)', 'bet9ja (draw)': '3.25', 'betking (draw)': '3.45', 'sportybet (draw)': '3.37', status: 'Saturday', kickoff: '3:00 PM' },
  { id: 102, pool: '2', home: 'Coventry', away: 'Hull', league: 'Championship', match_league: 'Coventry vs Hull (Championship)', 'bet9ja (draw)': '3.2', 'betking (draw)': '3.3', 'sportybet (draw)': '3.26', status: 'Saturday', kickoff: '3:00 PM' },
  { id: 103, pool: '3', home: 'Middlesbro', away: 'Lincoln', league: 'League One', match_league: 'Middlesbro vs Lincoln (League One)', 'bet9ja (draw)': '5.1', 'betking (draw)': '5.3', 'sportybet (draw)': '5.26', status: 'Saturday', kickoff: '3:00 PM' },
  { id: 104, pool: '4', home: 'Norwich', away: 'West Brom', league: 'Championship', match_league: 'Norwich vs West Brom (Championship)', 'bet9ja (draw)': '3.35', 'betking (draw)': '3.45', 'sportybet (draw)': '3.49', status: 'Saturday', kickoff: '3:00 PM' },
  { id: 105, pool: '5', home: 'Portsmouth', away: 'Q.P.R.', league: 'Championship', match_league: 'Portsmouth vs Q.P.R. (Championship)', 'bet9ja (draw)': '3.3', 'betking (draw)': '3.45', 'sportybet (draw)': '3.44', status: 'Saturday', kickoff: '3:00 PM' },
  { id: 106, pool: '6', home: 'Stoke', away: 'Swansea', league: 'Championship', match_league: 'Stoke vs Swansea (Championship)', 'bet9ja (draw)': '3.15', 'betking (draw)': '3.3', 'sportybet (draw)': '3.3', status: 'Saturday', kickoff: '3:00 PM' },
  { id: 107, pool: '7', home: 'Sheff Utd.', away: 'Birmingham', league: 'Championship', match_league: 'Sheff Utd. vs Birmingham (Championship)', 'bet9ja (draw)': '3.15', 'betking (draw)': '3.3', 'sportybet (draw)': '3.3', status: 'LKO', kickoff: '5:30 PM' },
  { id: 108, pool: '8', home: 'Watford', away: 'Southampton', league: 'Championship', match_league: 'Watford vs Southampton (Championship)', 'bet9ja (draw)': '3.35', 'betking (draw)': '3.55', 'sportybet (draw)': '3.51', status: 'Sunday', kickoff: '1:30 PM' },
  { id: 109, pool: '9', home: 'Burnley', away: 'West Ham', league: 'Premier League', match_league: 'Burnley vs West Ham (Premier League)', 'bet9ja (draw)': '3.35', 'betking (draw)': '3.5', 'sportybet (draw)': '3.48', status: 'Sunday', kickoff: '4:00 PM' },
  { id: 110, pool: '10', home: 'Barnsley', away: 'Bromley', league: 'League One', match_league: 'Barnsley vs Bromley (League One)', 'bet9ja (draw)': '3.4', 'betking (draw)': '3.45', 'sportybet (draw)': '3.6', status: 'saturday', kickoff: '3:00 PM' },
  { id: 111, pool: '11', home: 'Blackpool', away: 'Wycombe', league: 'League One', match_league: 'Blackpool vs Wycombe (League One)', 'bet9ja (draw)': '3.15', 'betking (draw)': '3.25', 'sportybet (draw)': '3.33', status: 'Saturday', kickoff: '3:00 PM' },
  { id: 112, pool: '12', home: 'Bradford C.', away: 'Peterboro', league: 'League One', match_league: 'Bradford C. vs Peterboro (League One)', 'bet9ja (draw)': '3.65', 'betking (draw)': '3.65', 'sportybet (draw)': '3.75', status: 'saturday', kickoff: '3:00 PM' },
  { id: 113, pool: '13', home: 'Burton A.', away: 'Stevenage', league: 'League One', match_league: 'Burton A. vs Stevenage (League One)', 'bet9ja (draw)': '2.96', 'betking (draw)': '3.05', 'sportybet (draw)': '3.2', status: 'saturday', kickoff: '3:00 PM' },
  { id: 114, pool: '14', home: 'Cambridge U.', away: 'Wigan', league: 'League One', match_league: 'Cambridge U. vs Wigan (League One)', 'bet9ja (draw)': '2.98', 'betking (draw)': '3.05', 'sportybet (draw)': '3.2', status: 'saturday', kickoff: '3:00 PM' },
  { id: 115, pool: '15', home: 'Huddersfield', away: 'Wimbledon', league: 'League One', match_league: 'Huddersfield vs Wimbledon (League One)', 'bet9ja (draw)': '3.8', 'betking (draw)': '3.85', 'sportybet (draw)': '4', status: 'saturday', kickoff: '3:00 PM' },
  { id: 116, pool: '16', home: 'Leyton O.', away: 'Sheff Wed.', league: 'Championship', match_league: 'Leyton O. vs Sheff Wed. (Championship)', 'bet9ja (draw)': '3.2', 'betking (draw)': '3.3', 'sportybet (draw)': '3.4', status: 'saturday', kickoff: '3:00 PM' },
  { id: 117, pool: '17', home: 'Mansfield', away: 'Doncaster', league: 'League Two', match_league: 'Mansfield vs Doncaster (League Two)', 'bet9ja (draw)': '3.25', 'betking (draw)': '3.3', 'sportybet (draw)': '3.4', status: 'saturday', kickoff: '3:00 PM' },
  { id: 118, pool: '18', home: 'Plymouth', away: 'Stockport', league: 'League One', match_league: 'Plymouth vs Stockport (League One)', 'bet9ja (draw)': '3.3', 'betking (draw)': '3.35', 'sportybet (draw)': '3.5', status: 'saturday', kickoff: '3:00 PM' },
  { id: 119, pool: '19', home: 'Dep. Alaves', away: 'Getafe', league: 'La Liga', match_league: 'Dep. Alaves vs Getafe (La Liga)', 'bet9ja (draw)': '2.77', 'betking (draw)': '2.8', 'sportybet (draw)': '2.92', status: 'LKO', kickoff: '6:30 PM' },
  { id: 120, pool: '20', home: 'Sevilla', away: 'R. Vallecano', league: 'La Liga', match_league: 'Sevilla vs R. Vallecano (La Liga)', 'bet9ja (draw)': '3.15', 'betking (draw)': '3.15', 'sportybet (draw)': '3.3', status: 'LKO', kickoff: '8:30 PM' },
  { id: 121, pool: '21', home: 'R. Santander', away: 'Villarreal', league: 'La Liga', match_league: 'R. Santander vs Villarreal (La Liga)', 'bet9ja (draw)': '3.4', 'betking (draw)': '3.4', 'sportybet (draw)': '3.54', status: 'Sunday', kickoff: '4:00 PM' },
  { id: 122, pool: '22', home: 'Espanyol', away: 'Levante', league: 'La Liga', match_league: 'Espanyol vs Levante (La Liga)', 'bet9ja (draw)': '3.25', 'betking (draw)': '3.3', 'sportybet (draw)': '3.44', status: 'Sunday', kickoff: '6:00 PM' },
  { id: 123, pool: '23', home: 'Celta Vigo', away: 'Osasuna', league: 'La Liga', match_league: 'Celta Vigo vs Osasuna (La Liga)', 'bet9ja (draw)': '3.3', 'betking (draw)': '3.3', 'sportybet (draw)': '3.48', status: 'Sunday', kickoff: '8:30 PM' },
  { id: 124, pool: '24', home: 'Academico V.', away: 'Santa Clara', league: 'Primeira Liga', match_league: 'Academico V. vs Santa Clara (Primeira Liga)', 'bet9ja (draw)': '3.15', 'betking (draw)': '3.15', 'sportybet (draw)': '2.43', status: 'LKO', kickoff: '6:00 PM' },
  { id: 125, pool: '25', home: 'Rio Ave', away: 'FC Porto', league: 'Primeira Liga', match_league: 'Rio Ave vs FC Porto (Primeira Liga)', 'bet9ja (draw)': '5.25', 'betking (draw)': '5.2', 'sportybet (draw)': '1.35', status: 'LKO', kickoff: '8:30 PM' },
  { id: 126, pool: '26', home: 'Famalicao', away: 'Maritimo', league: 'Primeira Liga', match_league: 'Famalicao vs Maritimo (Primeira Liga)', 'bet9ja (draw)': '3.10', 'betking (draw)': '3.15', 'sportybet (draw)': '3.20', status: 'Sunday', kickoff: '8:30 PM' },
  { id: 127, pool: '27', home: 'Nacional', away: 'Estoril', league: 'Primeira Liga', match_league: 'Nacional vs Estoril (Primeira Liga)', 'bet9ja (draw)': '3.35', 'betking (draw)': '3.35', 'sportybet (draw)': '2.72', status: 'Sunday', kickoff: '3:30 PM' },
  { id: 128, pool: '28', home: 'Braga', away: 'Gil Vicente', league: 'Primeira Liga', match_league: 'Braga vs Gil Vicente (Primeira Liga)', 'bet9ja (draw)': '3.75', 'betking (draw)': '3.7', 'sportybet (draw)': '4.79', status: 'Sunday', kickoff: '8:30 PM' },
  { id: 129, pool: '29', home: 'Casa Pia AC', away: 'Benfica', league: 'Primeira Liga', match_league: 'Casa Pia AC vs Benfica (Primeira Liga)', 'bet9ja (draw)': '6.3', 'betking (draw)': '6.2', 'sportybet (draw)': '1.24', status: 'Monday', kickoff: '8:15 PM' },
  { id: 130, pool: '30', home: 'FC Utrecht', away: 'AZ Alkmaar', league: 'Eredivisie', match_league: 'FC Utrecht vs AZ Alkmaar (Eredivisie)', 'bet9ja (draw)': '3.8', 'betking (draw)': '3.75', 'sportybet (draw)': '3.61', status: 'LKO', kickoff: '5:45 PM' },
  { id: 131, pool: '31', home: 'Excelsior', away: 'PSV', league: 'Eredivisie', match_league: 'Excelsior vs PSV (Eredivisie)', 'bet9ja (draw)': '4.3', 'betking (draw)': '4.25', 'sportybet (draw)': '4.38', status: 'LKO', kickoff: '7:00 PM' },
  { id: 132, pool: '32', home: 'FC Twente', away: 'PEC Zwolle', league: 'Eredivisie', match_league: 'FC Twente vs PEC Zwolle (Eredivisie)', 'bet9ja (draw)': '6.25', 'betking (draw)': '6.2', 'sportybet (draw)': '6.13', status: 'Sunday', kickoff: '1:30 PM' },
  { id: 133, pool: '33', home: 'Feyenoord', away: 'G.A. Eagles', league: 'Eredivisie', match_league: 'Feyenoord vs G.A. Eagles (Eredivisie)', 'bet9ja (draw)': '5.2', 'betking (draw)': '5.1', 'sportybet (draw)': '5.03', status: 'Sunday', kickoff: '1:30 PM' },
  { id: 134, pool: '34', home: 'Ajax', away: 'Heerenveen', league: 'Eredivisie', match_league: 'Ajax vs Heerenveen (Eredivisie)', 'bet9ja (draw)': '4.6', 'betking (draw)': '4.5', 'sportybet (draw)': '4.41', status: 'Sunday', kickoff: '3:45 PM' },
  { id: 135, pool: '35', home: 'Union SG', away: 'Z. Waregem', league: 'Belgian Pro League', match_league: 'Union SG vs Z. Waregem (Belgian Pro League)', 'bet9ja (draw)': '4.75', 'betking (draw)': '4.8', 'sportybet (draw)': '4.89', status: 'Saturday', kickoff: '3:00 PM' },
  { id: 136, pool: '36', home: 'Genk', away: 'Westerlo', league: 'Belgian Pro League', match_league: 'Genk vs Westerlo (Belgian Pro League)', 'bet9ja (draw)': '4', 'betking (draw)': '4.05', 'sportybet (draw)': '4.07', status: 'LKO', kickoff: '7:45 PM' },
  { id: 137, pool: '37', home: 'OH Leuven', away: 'Club Brugge', league: 'Belgian Pro League', match_league: 'OH Leuven vs Club Brugge (Belgian Pro League)', 'bet9ja (draw)': '4.1', 'betking (draw)': '4.15', 'sportybet (draw)': '4.24', status: 'LKO', kickoff: '7:45 PM' },
  { id: 138, pool: '38', home: 'SK Beveren', away: 'Anderlecht', league: 'Belgian Pro League', match_league: 'SK Beveren vs Anderlecht (Belgian Pro League)', 'bet9ja (draw)': '3.35', 'betking (draw)': '3.35', 'sportybet (draw)': '3.39', status: 'Sunday', kickoff: '12:30 PM' },
  { id: 139, pool: '39', home: 'RAAL Louviere', away: 'Gent', league: 'Belgian Pro League', match_league: 'RAAL Louviere vs Gent (Belgian Pro League)', 'bet9ja (draw)': '3.4', 'betking (draw)': '3.4', 'sportybet (draw)': '3.4', status: 'Sunday', kickoff: '3:00 PM' },
  { id: 140, pool: '40', home: 'KV Mechelen', away: "St'd Liege", league: 'Belgian Pro League', match_league: "KV Mechelen vs St'd Liege (Belgian Pro League)", 'bet9ja (draw)': '3.2', 'betking (draw)': '3.2', 'sportybet (draw)': '3.21', status: 'Sunday', kickoff: '5:30 PM' },
  { id: 141, pool: '41', home: 'A. Lustenau', away: 'Wolfsberger', league: 'Austrian Bundesliga', match_league: 'A. Lustenau vs Wolfsberger (Austrian Bundesliga)', 'bet9ja (draw)': '3.45', 'betking (draw)': '3.5', 'sportybet (draw)': '3.5', status: 'LKO', kickoff: '4:00 PM' },
  { id: 142, pool: '42', home: 'Hartberg', away: 'Austria Wien', league: 'Austrian Bundesliga', match_league: 'Hartberg vs Austria Wien (Austrian Bundesliga)', 'bet9ja (draw)': '3.45', 'betking (draw)': '3.4', 'sportybet (draw)': '3.33', status: 'Sunday', kickoff: '4:00 PM' },
  { id: 143, pool: '43', home: 'WSG Tirol', away: 'Salzburg', league: 'Austrian Bundesliga', match_league: 'WSG Tirol vs Salzburg (Austrian Bundesliga)', 'bet9ja (draw)': '3.8', 'betking (draw)': '3.85', 'sportybet (draw)': '3.8', status: 'Sunday', kickoff: '4:00 PM' },
  { id: 144, pool: '44', home: 'Rapid Wien', away: 'Grazer AK', league: 'Austrian Bundesliga', match_league: 'Rapid Wien vs Grazer AK (Austrian Bundesliga)', 'bet9ja (draw)': '3.4', 'betking (draw)': '3.35', 'sportybet (draw)': '3.3', status: 'Sunday', kickoff: '6:00 PM' },
  { id: 145, pool: '45', home: 'Kasimpasa', away: 'Trabzonspor', league: 'Turkish Super Lig', match_league: 'Kasimpasa vs Trabzonspor (Turkish Super Lig)', 'bet9ja (draw)': '3.8', 'betking (draw)': '3.75', 'sportybet (draw)': '3.71', status: 'LKO', kickoff: '5:00 PM' },
  { id: 146, pool: '46', home: 'Konyaspor', away: 'Rizespor', league: 'Turkish Super Lig', match_league: 'Konyaspor vs Rizespor (Turkish Super Lig)', 'bet9ja (draw)': '3.35', 'betking (draw)': '3.2', 'sportybet (draw)': '3.38', status: 'LKO', kickoff: '5:00 PM' },
  { id: 147, pool: '47', home: 'Genclerbirligi', away: 'Fenerbahce', league: 'Turkish Super Lig', match_league: 'Genclerbirligi vs Fenerbahce (Turkish Super Lig)', 'bet9ja (draw)': '4.55', 'betking (draw)': '4.5', 'sportybet (draw)': '4.47', status: 'LKO', kickoff: '7:30 PM' },
  { id: 148, pool: '48', home: 'I. Basaksehir', away: 'Kocaelispor', league: 'Turkish Super Lig', match_league: 'I. Basaksehir vs Kocaelispor (Turkish Super Lig)', 'bet9ja (draw)': '4.35', 'betking (draw)': '4.3', 'sportybet (draw)': '4.24', status: 'Sunday', kickoff: '5:00 PM' },
  { id: 149, pool: '49', home: 'Besiktas', away: 'Eyupspor', league: 'Turkish Super Lig', match_league: 'Besiktas vs Eyupspor (Turkish Super Lig)', 'bet9ja (draw)': '5.4', 'betking (draw)': '5.3', 'sportybet (draw)': '5.26', status: 'Sunday', kickoff: '7:30 PM' }
];

// Helper to generate full 49-row fixture bookmaker tables with accurate Bet Tips
function createBookmakerTableRows(
  prefix: string,
  bookieKey: 'bet9ja (draw)' | 'betking (draw)' | 'sportybet (draw)'
): BookmakerTableRecord[] {
  const tipsMap = [
    'DRAW (X)', 'HOME WIN (1)', 'DRAW (X)', 'AWAY WIN (2)', '1X / DRAW', 'DRAW (X)', 'X2 / DRAW', 'HOME WIN (1)',
    'DRAW (X)', 'Ov 2.5', 'DRAW (X)', 'HOME WIN (1)', 'DRAW (X)', '1X', 'DRAW (X)', 'AWAY WIN (2)',
    'DRAW (X)', 'HOME WIN (1)', 'DRAW (X)', '12 / GG', 'DRAW (X)', 'HOME WIN (1)', 'DRAW (X)', 'AWAY WIN (2)',
    'DRAW (X)', '1X / DRAW', 'DRAW (X)', 'HOME WIN (1)', 'DRAW (X)', 'X2', 'DRAW (X)', 'HOME WIN (1)',
    'DRAW (X)', 'AWAY WIN (2)', 'DRAW (X)', '1X / DRAW', 'DRAW (X)', 'HOME WIN (1)', 'DRAW (X)', 'Ov 1.5',
    'DRAW (X)', 'DRAW (X)', 'AWAY WIN (2)', 'HOME WIN (1)', 'DRAW (X)', '1X / DRAW', 'DRAW (X)', 'HOME WIN (1)', 'DRAW (X)'
  ];

  return INITIAL_POOL_CODES_COMPARISON.map((m, idx) => {
    const poolNum = Number(m.pool) || idx + 1;
    const rawDraw = parseFloat(String(m[bookieKey] || m['bet9ja (draw)'] || '3.30')) || 3.30;
    const homeOdds = poolNum % 2 === 1 ? +(1.80 + (poolNum % 5) * 0.25).toFixed(2) : +(2.40 + (poolNum % 4) * 0.35).toFixed(2);
    const awayOdds = +(7.20 / (homeOdds * 0.8)).toFixed(2);
    const assignedTip = rawDraw <= 3.30 ? 'DRAW (X)' : (tipsMap[idx] || (poolNum % 3 === 0 ? 'DRAW (X)' : poolNum % 2 === 1 ? 'HOME WIN (1)' : 'AWAY WIN (2)'));

    const codeBase = (1000 + poolNum * 37).toString(36).toUpperCase();
    const betcode = `${prefix.toUpperCase()}${codeBase}`;

    return {
      id: `${prefix.toLowerCase()}-rec-${poolNum}`,
      pool: poolNum,
      betcode,
      home: m.home,
      away: m.away,
      league: m.league || 'Championship',
      match_league: m.match_league || `${m.home} vs ${m.away} (${m.league || 'Championship'})`,
      homewin: homeOdds,
      draw: rawDraw,
      awaywin: awayOdds,
      bet: assignedTip,
      status: m.status || 'Active',
      kickoff: m.kickoff || '3:00 PM',
      week_no: 49,
      week: 49,
      week_number: 49
    };
  });
}

export const INITIAL_BET9JA: BookmakerTableRecord[] = createBookmakerTableRows('B9', 'bet9ja (draw)');
export const INITIAL_BETKING: BookmakerTableRecord[] = createBookmakerTableRows('BK', 'betking (draw)');
export const INITIAL_SPORTYBET: BookmakerTableRecord[] = createBookmakerTableRows('SB', 'sportybet (draw)');
export const INITIAL_PREMIERBET: BookmakerTableRecord[] = createBookmakerTableRows('PB', 'bet9ja (draw)');
export const INITIAL_BETWAY: BookmakerTableRecord[] = createBookmakerTableRows('BW', 'betking (draw)');
export const INITIAL_SOCCABET: BookmakerTableRecord[] = createBookmakerTableRows('SC', 'sportybet (draw)');
export const INITIAL_MSPORT: BookmakerTableRecord[] = createBookmakerTableRows('MS', 'bet9ja (draw)');
