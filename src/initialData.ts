import {
  User,
  SubscriptionPlan,
  UserSubscription,
  Bookmaker,
  PoolWeek,
  PoolCode,
  PoolResult,
  Notification,
  UserDownload,
  BookmakerTableRecord
} from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-777',
    username: 'pool_master_admin',
    email: 'admin@poolcodes.com',
    role: 'admin',
    status: 'active',
    phone: '+2348011223344',
    email_verified_at: '2026-01-10T12:00:00Z',
    created_at: '2026-01-10T12:00:00Z',
    password: 'password'
  },
  {
    id: 'usr-free-101',
    username: 'john_doe_free',
    email: 'john@gmail.com',
    role: 'user',
    status: 'active',
    phone: '+2348099887766',
    email_verified_at: '2026-02-15T09:30:00Z',
    created_at: '2026-02-15T09:30:00Z',
    password: 'password'
  },
  {
    id: 'usr-prem-202',
    username: 'alex_premium',
    email: 'alex@outlook.com',
    role: 'user',
    status: 'active',
    phone: '+2347066554433',
    email_verified_at: '2026-03-01T14:20:00Z',
    created_at: '2026-03-01T14:20:00Z',
    password: 'password'
  },
  {
    id: 'usr-exp-303',
    username: 'expired_bettor',
    email: 'expired@yahoo.com',
    role: 'user',
    status: 'active',
    phone: '+2349022334455',
    email_verified_at: '2026-04-18T11:15:00Z',
    created_at: '2026-04-18T11:15:00Z',
    password: 'password'
  },
  {
    id: 'usr-susp-404',
    username: 'suspended_user_99',
    email: 'spammer_alert@gmail.com',
    role: 'user',
    status: 'suspended',
    phone: '+2348055667788',
    email_verified_at: '2026-05-02T10:45:00Z',
    created_at: '2026-05-02T10:45:00Z',
    password: 'password'
  },
  {
    id: 'usr-betking-888',
    username: 'betking_subscriber',
    email: 'betking@outlook.com',
    role: 'user',
    status: 'active',
    phone: '+2348123456789',
    email_verified_at: '2026-06-01T10:00:00Z',
    created_at: '2026-06-01T10:00:00Z',
    password: 'password'
  }
];

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-free',
    name: 'Free Access',
    description: 'Access public fixture codes and results with standard limits.',
    price: 0.00,
    billing_cycle: 'weekly',
    has_premium_codes: false,
    has_odds_comparison: false,
    has_results: true,
    has_notifications: false,
    max_bookmakers: 1,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'plan-weekly',
    name: 'Weekly Plan',
    description: '1 Week Only. Ideal for temporary coupon verification.',
    price: 300.00,
    billing_cycle: 'weekly',
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 4,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'plan-monthly',
    name: 'Monthly Plan',
    description: '4 Weeks + 1 Week Bonus. Active perming suite access.',
    price: 1200.00,
    billing_cycle: 'monthly',
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 6,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'plan-quarterly',
    name: 'Quarterly Plan (New)',
    description: '12 Weeks + 1 Week Bonus. Standard season length.',
    price: 3600.00,
    billing_cycle: 'quarterly',
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 8,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'plan-biannual',
    name: 'BI - Annual Plan (New)',
    description: '24 Weeks + 2 Weeks Bonus. Half-year coverage of draw sequences.',
    price: 7800.00,
    billing_cycle: 'biannual',
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 10,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'plan-yearly',
    name: 'Yearly Plan (New)',
    description: '48 Weeks + 4 Weeks Bonus. Elite multi-season VIP privileges.',
    price: 15600.00,
    billing_cycle: 'yearly',
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 12,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'plan-ghana-weekly',
    name: 'Ghana Weekly Plan',
    description: '1 week Only',
    price: 4.00,
    billing_cycle: 'weekly',
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 4,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'plan-ghana',
    name: 'Ghana Monthly Plan',
    description: '4 weeks + 1 week bonus',
    price: 16.00,
    billing_cycle: 'monthly',
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 4,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'plan-ghana-quarterly',
    name: 'Ghana Quarterly Plan (New)',
    description: '12 weeks + 1 week bonus',
    price: 48.00,
    billing_cycle: 'quarterly',
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 4,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'plan-ghana-biannual',
    name: 'Ghana BI - Annual Plan (New)',
    description: '24 weeks + 2 weeks bonus',
    price: 104.00,
    billing_cycle: 'biannual',
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 4,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'plan-ghana-yearly',
    name: 'Ghana Yearly Plan (New)',
    description: '48 weeks + 4 weeks bonus',
    price: 208.00,
    billing_cycle: 'yearly',
    has_premium_codes: true,
    has_odds_comparison: true,
    has_results: true,
    has_notifications: true,
    max_bookmakers: 4,
    created_at: '2026-01-01T00:00:00Z'
  }
];

export const INITIAL_SUBSCRIPTIONS: UserSubscription[] = [
  {
    id: 'sub-active-909',
    user_id: 'usr-prem-202', // alex_premium
    plan_id: 'plan-monthly',
    status: 'active',
    starts_at: '2026-06-01T12:00:00Z',
    expires_at: '2026-07-01T12:00:00Z',
    payment_ref: 'PAY-TX-MONTHLY-5593',
    payment_provider: 'Paystack',
    created_at: '2026-06-01T12:00:00Z',
    components: ['bet9ja', 'sportybet', 'betking']
  },
  {
    id: 'sub-expired-808',
    user_id: 'usr-exp-303', // expired_bettor
    plan_id: 'plan-weekly',
    status: 'expired',
    starts_at: '2026-05-10T12:00:00Z',
    expires_at: '2026-05-17T12:00:00Z',
    payment_ref: 'PAY-TX-WEEKLY-1204',
    payment_provider: 'Flutterwave',
    created_at: '2026-05-10T12:00:00Z',
    components: ['bet9ja']
  },
  {
    id: 'sub-active-888',
    user_id: 'usr-betking-888', // betking_subscriber
    plan_id: 'plan-yearly',
    status: 'active',
    starts_at: '2026-06-01T12:00:00Z',
    expires_at: '2026-09-01T12:00:00Z',
    payment_ref: 'PAY-TX-BETKING-888',
    payment_provider: 'Paystack',
    created_at: '2026-06-01T12:00:00Z',
    components: ['bet9ja', 'sportybet', 'betking']
  }
];

export const INITIAL_BOOKMAKERS: Bookmaker[] = [
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
    country: 'KE',
    is_active: true
  },
  {
    id: 'bm-msport',
    name: 'MSport',
    slug: 'msport',
    logo_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=100&h=100&fit=crop&q=80',
    country: 'GH',
    is_active: true
  },
  {
    id: 'bm-premierbet',
    name: 'PremierBet',
    slug: 'premierbet',
    logo_url: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=100&h=100&fit=crop&q=80',
    country: 'NG',
    is_active: true
  },
  {
    id: 'bm-betway',
    name: 'Betway',
    slug: 'betway',
    logo_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop&q=80',
    country: 'GH',
    is_active: true
  },
  {
    id: 'bm-soccabet',
    name: 'Soccabet',
    slug: 'soccabet',
    logo_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=100&h=100&fit=crop&q=80',
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

export const INITIAL_POOL_RESULTS: PoolResult[] = [
  {
    id: 'pr-w43',
    pool_week_id: 'pw-week-43',
    bookmaker_id: 'bm-bet9ja',
    uploaded_by: 'usr-admin-777',
    results_content: '--- WEEK 43 OFFICIAL RESULTS ---\nMatch 3: Arsenal 1-1 Chelsea (DRAW - Code Cleared)\nMatch 12: Man City 2-2 Everton (DRAW - Code Cleared)\nMatch 26: Leicester 1-1 West Ham (DRAW - Code Cleared)',
    file_url: 'https://storage.poolcodes.com/results/w43-results.pdf',
    created_at: '2026-04-27T10:00:00Z',
    title: 'Week 43 UK Pool results: Pool results for the week - 25th April, 2026',
    week_number: 43,
    season_year: 2026,
    pool_type: 'uk',
    fixture_date: '2026-04-25',
    comments_count: 0,
    results_table: [
      { matchNo: 1, homeTeam: 'Arsenal', awayTeam: 'Chelsea', fullTimeScore: '1-1', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 2, homeTeam: 'Liverpool', awayTeam: 'Leeds', fullTimeScore: '2-0', outcome: 'HOME WIN', payoutStatus: 'CLEARED' },
      { matchNo: 3, homeTeam: 'Man City', awayTeam: 'Everton', fullTimeScore: '2-2', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 4, homeTeam: 'Napoli', awayTeam: 'Juventus', fullTimeScore: '0-3', outcome: 'AWAY WIN', payoutStatus: 'CLEARED' },
      { matchNo: 5, homeTeam: 'Real Madrid', awayTeam: 'Sevilla', fullTimeScore: '1-1', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 6, homeTeam: 'Barcelona', awayTeam: 'Valencia', fullTimeScore: '2-1', outcome: 'HOME WIN', payoutStatus: 'CLEARED' },
      { matchNo: 7, homeTeam: 'Aston Villa', awayTeam: 'Wolves', fullTimeScore: '0-0', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 8, homeTeam: 'Tottenham', awayTeam: 'Brentford', fullTimeScore: '1-0', outcome: 'HOME WIN', payoutStatus: 'CLEARED' },
      { matchNo: 9, homeTeam: 'Leicester', awayTeam: 'West Ham', fullTimeScore: '1-1', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 10, homeTeam: 'Roma', awayTeam: 'Milan', fullTimeScore: '2-2', outcome: 'DRAW', payoutStatus: 'CLEARED' }
    ]
  },
  {
    id: 'pr-w42',
    pool_week_id: 'pw-week-42',
    bookmaker_id: 'bm-betking',
    uploaded_by: 'usr-admin-777',
    results_content: '--- WEEK 42 OFFICIAL RESULTS ---\nMatch 1: Real Madrid 2-2 Sevilla (DRAW - Code Cleared)\nMatch 4: Aston Villa 0-0 Wolves (DRAW - Code Cleared)',
    file_url: 'https://storage.poolcodes.com/results/w42-results.pdf',
    created_at: '2026-04-20T10:00:00Z',
    title: 'Week 42 UK Pool results: Pool results for the week - 18th April, 2026',
    week_number: 42,
    season_year: 2026,
    pool_type: 'uk',
    fixture_date: '2026-04-18',
    comments_count: 0,
    results_table: [
      { matchNo: 1, homeTeam: 'Real Madrid', awayTeam: 'Sevilla', fullTimeScore: '2-2', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 2, homeTeam: 'Barcelona', awayTeam: 'Valencia', fullTimeScore: '1-0', outcome: 'HOME WIN', payoutStatus: 'CLEARED' },
      { matchNo: 3, homeTeam: 'Napoli', awayTeam: 'Juventus', fullTimeScore: '1-1', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 4, homeTeam: 'Aston Villa', awayTeam: 'Wolves', fullTimeScore: '0-0', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 5, homeTeam: 'Tottenham', awayTeam: 'Brentford', fullTimeScore: '2-2', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 6, homeTeam: 'Leicester', awayTeam: 'West Ham', fullTimeScore: '1-3', outcome: 'AWAY WIN', payoutStatus: 'CLEARED' },
      { matchNo: 7, homeTeam: 'Roma', awayTeam: 'Milan', fullTimeScore: '0-0', outcome: 'DRAW', payoutStatus: 'CLEARED' }
    ]
  },
  {
    id: 'pr-w41',
    pool_week_id: 'pw-week-41',
    bookmaker_id: 'bm-sportybet',
    uploaded_by: 'usr-admin-777',
    results_content: '--- WEEK 41 OFFICIAL RESULTS ---\nMatch 26: Roma 1-1 Milan (DRAW - Code Cleared)\nMatch 40: Bologna 0-0 Udinese (DRAW - Code Cleared)',
    file_url: 'https://storage.poolcodes.com/results/w41-results.pdf',
    created_at: '2026-04-14T10:00:00Z',
    title: 'Week 41 UK Pool results: Pool results for the week - 11th April, 2026',
    week_number: 41,
    season_year: 2026,
    pool_type: 'uk',
    fixture_date: '2026-04-11',
    comments_count: 14,
    results_table: [
      { matchNo: 1, homeTeam: 'Roma', awayTeam: 'Milan', fullTimeScore: '1-1', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 2, homeTeam: 'Aston Villa', awayTeam: 'Wolves', fullTimeScore: '0-2', outcome: 'AWAY WIN', payoutStatus: 'CLEARED' },
      { matchNo: 3, homeTeam: 'Barcelona', awayTeam: 'Valencia', fullTimeScore: '3-3', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 4, homeTeam: 'Real Madrid', awayTeam: 'Sevilla', fullTimeScore: '3-0', outcome: 'HOME WIN', payoutStatus: 'CLEARED' },
      { matchNo: 5, homeTeam: 'Napoli', awayTeam: 'Juventus', fullTimeScore: '0-0', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 6, homeTeam: 'Liverpool', awayTeam: 'Leeds', fullTimeScore: '1-1', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 7, homeTeam: 'Bologna', awayTeam: 'Udinese', fullTimeScore: '0-0', outcome: 'DRAW', payoutStatus: 'CLEARED' }
    ]
  },
  {
    id: 'pr-w40',
    pool_week_id: 'pw-week-40',
    bookmaker_id: 'bm-msport',
    uploaded_by: 'usr-admin-777',
    results_content: '--- WEEK 40 OFFICIAL RESULTS ---\nMatch 3: Liverpool 0-0 Leeds (DRAW - Code Cleared)',
    file_url: null,
    created_at: '2026-04-06T10:00:00Z',
    title: 'Week 40 UK Pool results: Pool results for the week - 4th April, 2026',
    week_number: 40,
    season_year: 2026,
    pool_type: 'uk',
    fixture_date: '2026-04-04',
    comments_count: 0,
    results_table: [
      { matchNo: 1, homeTeam: 'Roma', awayTeam: 'Milan', fullTimeScore: '2-0', outcome: 'HOME WIN', payoutStatus: 'CLEARED' },
      { matchNo: 2, homeTeam: 'Aston Villa', awayTeam: 'Wolves', fullTimeScore: '1-1', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 3, homeTeam: 'Liverpool', awayTeam: 'Leeds', fullTimeScore: '0-0', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 4, homeTeam: 'Real Madrid', awayTeam: 'Sevilla', fullTimeScore: '2-1', outcome: 'HOME WIN', payoutStatus: 'CLEARED' }
    ]
  },
  {
    id: 'pr-w39',
    pool_week_id: 'pw-week-39',
    bookmaker_id: 'bm-bet9ja',
    uploaded_by: 'usr-admin-777',
    results_content: '--- WEEK 39 OFFICIAL RESULTS ---\nMatch 22: Newcastle 1-1 Southampton (DRAW - Code Cleared)',
    file_url: 'https://storage.poolcodes.com/results/w39-results.pdf',
    created_at: '2026-04-02T10:00:00Z',
    title: 'Week 39 UK Pool results: Pool results for the week - 28th March, 2026',
    week_number: 39,
    season_year: 2026,
    pool_type: 'uk',
    fixture_date: '2026-03-28',
    comments_count: 0,
    results_table: [
      { matchNo: 1, homeTeam: 'Newcastle', awayTeam: 'Southampton', fullTimeScore: '1-1', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 2, homeTeam: 'Leicester', awayTeam: 'West Ham', fullTimeScore: '2-2', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 3, homeTeam: 'Roma', awayTeam: 'Milan', fullTimeScore: '3-1', outcome: 'HOME WIN', payoutStatus: 'CLEARED' }
    ]
  },
  {
    id: 'pr-001',
    pool_week_id: 'pw-week-48',
    bookmaker_id: 'bm-bet9ja',
    uploaded_by: 'usr-admin-777',
    results_content: '--- WEEK 48 OFFICIAL RESULTS ---\nArsenal 1-1 Chelsea (DRAW - Code Match 1 SUCCESS)\nLiverpool 2-0 Leeds (Home Win - Code Match 2 MISSED)\nNapoli 0-0 Juventus (DRAW - Code Match 4 SUCCESS)',
    file_url: 'https://storage.poolcodes.com/results/w48-results.pdf',
    created_at: '2026-05-24T10:00:00Z',
    title: 'Week 48 Aussie Pool results: Pool results for the week - 23rd May, 2026',
    week_number: 48,
    season_year: 2026,
    pool_type: 'aussie',
    fixture_date: '2026-05-23',
    comments_count: 5,
    results_table: [
      { matchNo: 1, homeTeam: 'Arsenal', awayTeam: 'Chelsea', fullTimeScore: '1-1', outcome: 'DRAW', payoutStatus: 'CLEARED' },
      { matchNo: 2, homeTeam: 'Liverpool', awayTeam: 'Leeds', fullTimeScore: '2-0', outcome: 'HOME WIN', payoutStatus: 'CLEARED' },
      { matchNo: 3, homeTeam: 'Man City', awayTeam: 'Everton', fullTimeScore: '3-1', outcome: 'HOME WIN', payoutStatus: 'CLEARED' },
      { matchNo: 4, homeTeam: 'Napoli', awayTeam: 'Juventus', fullTimeScore: '0-0', outcome: 'DRAW', payoutStatus: 'CLEARED' }
    ]
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
  }
];

export const INITIAL_BET9JA: BookmakerTableRecord[] = [
  {
    id: 'b9-rec-1',
    pool: 1,
    betcode: 'B92XWK',
    home: 'Arsenal',
    away: 'Chelsea',
    homewin: 1.95,
    draw: 3.40,
    awaywin: 4.10,
    bet: 'HOME WIN',
    status: 'PENDING',
    kickoff: '15:00 WAT'
  },
  {
    id: 'b9-rec-2',
    pool: 2,
    betcode: 'B99QQY',
    home: 'Liverpool',
    away: 'Leeds',
    homewin: 1.50,
    draw: 4.25,
    awaywin: 6.80,
    bet: 'HOME WIN',
    status: 'PENDING',
    kickoff: '15:00 WAT'
  },
  {
    id: 'b9-rec-3',
    pool: 3,
    betcode: 'B94LKS',
    home: 'Manchester City',
    away: 'Aston Villa',
    homewin: 1.25,
    draw: 5.50,
    awaywin: 9.00,
    bet: 'DRAW (X)',
    status: 'VOID',
    kickoff: '17:30 WAT'
  },
  {
    id: 'b9-rec-4',
    pool: 4,
    betcode: 'B93PPZ',
    home: 'Napoli',
    away: 'Juventus',
    homewin: 2.10,
    draw: 3.10,
    awaywin: 3.40,
    bet: 'AWAY WIN',
    status: 'PENDING',
    kickoff: '19:45 WAT'
  }
];

export const INITIAL_BETKING: BookmakerTableRecord[] = [
  {
    id: 'bk-rec-1',
    pool: 1,
    betcode: 'BK551X',
    home: 'Arsenal',
    away: 'Chelsea',
    homewin: 1.90,
    draw: 3.35,
    awaywin: 4.20,
    bet: 'HOME WIN',
    status: 'PENDING',
    kickoff: '15:00 WAT'
  },
  {
    id: 'bk-rec-2',
    pool: 2,
    betcode: 'BK9012',
    home: 'Liverpool',
    away: 'Leeds',
    homewin: 1.48,
    draw: 4.30,
    awaywin: 7.00,
    bet: 'HOME WIN',
    status: 'PENDING',
    kickoff: '15:00 WAT'
  },
  {
    id: 'bk-rec-3',
    pool: 8,
    betcode: 'BK1540',
    home: 'St George City',
    away: 'NWS Spirit',
    homewin: 1.90,
    draw: 3.90,
    awaywin: 3.40,
    bet: 'DRAW (X)',
    status: 'PENDING',
    kickoff: '04:15 PM'
  }
];

export const INITIAL_SPORTYBET: BookmakerTableRecord[] = [
  {
    id: 'sb-rec-1',
    pool: 1,
    betcode: 'SB9908',
    home: 'Arsenal',
    away: 'Chelsea',
    homewin: 2.00,
    draw: 3.45,
    awaywin: 4.05,
    bet: 'HOME WIN',
    status: 'PENDING',
    kickoff: '15:00 WAT'
  },
  {
    id: 'sb-rec-2',
    pool: 2,
    betcode: 'SB1123',
    home: 'Liverpool',
    away: 'Leeds',
    homewin: 1.52,
    draw: 4.20,
    awaywin: 6.60,
    bet: 'HOME WIN',
    status: 'PENDING',
    kickoff: '15:00 WAT'
  },
  {
    id: 'sb-rec-3',
    pool: 5,
    betcode: 'SB8824',
    home: 'Hume City',
    away: 'South Melbourne',
    homewin: 3.10,
    draw: 3.40,
    awaywin: 1.95,
    bet: 'AWAY WIN',
    status: 'PENDING',
    kickoff: '07:30 PM'
  }
];

export const INITIAL_PREMIERBET: BookmakerTableRecord[] = [
  {
    id: 'pb-rec-1',
    pool: 1,
    betcode: 'PB101X',
    home: 'Arsenal',
    away: 'Chelsea',
    homewin: 1.98,
    draw: 3.35,
    awaywin: 4.15,
    bet: 'HOME WIN',
    status: 'PENDING',
    kickoff: '15:00 WAT'
  },
  {
    id: 'pb-rec-2',
    pool: 2,
    betcode: 'PB202Y',
    home: 'Liverpool',
    away: 'Leeds',
    homewin: 1.49,
    draw: 4.20,
    awaywin: 6.90,
    bet: 'HOME WIN',
    status: 'PENDING',
    kickoff: '15:00 WAT'
  }
];

export const INITIAL_BETWAY: BookmakerTableRecord[] = [
  {
    id: 'bw-rec-1',
    pool: 1,
    betcode: 'BW303Z',
    home: 'Arsenal',
    away: 'Chelsea',
    homewin: 1.92,
    draw: 3.40,
    awaywin: 4.00,
    bet: 'HOME WIN',
    status: 'PENDING',
    kickoff: '15:00 WAT'
  },
  {
    id: 'bw-rec-2',
    pool: 2,
    betcode: 'BW404A',
    home: 'Liverpool',
    away: 'Leeds',
    homewin: 1.51,
    draw: 4.15,
    awaywin: 6.70,
    bet: 'HOME WIN',
    status: 'PENDING',
    kickoff: '15:00 WAT'
  }
];

export const INITIAL_SOCCABET: BookmakerTableRecord[] = [
  {
    id: 'sc-rec-1',
    pool: 1,
    betcode: 'SC505B',
    home: 'Arsenal',
    away: 'Chelsea',
    homewin: 1.96,
    draw: 3.42,
    awaywin: 4.08,
    bet: 'HOME WIN',
    status: 'PENDING',
    kickoff: '15:00 WAT'
  },
  {
    id: 'sc-rec-2',
    pool: 2,
    betcode: 'SC606C',
    home: 'Liverpool',
    away: 'Leeds',
    homewin: 1.50,
    draw: 4.25,
    awaywin: 6.75,
    bet: 'HOME WIN',
    status: 'PENDING',
    kickoff: '15:00 WAT'
  }
];
