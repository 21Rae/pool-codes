import { PoolPicksHistoryEdition, WeeklyPoolPick } from '../types';

export const INITIAL_POOL_PICKS_HISTORY: PoolPicksHistoryEdition[] = [
  {
    id: 'history-week-7',
    week_number: 7,
    edition_title: 'Week 7 Premier & Championship Banker Draws',
    date: 'Oct 11, 2026',
    bookmaker: 'general',
    total_picks: 15,
    bankers_count: 3,
    success_rate: '87%',
    draws_hit: '5 / 6 Draws Verified',
    summary: 'High-confidence coupon fixtures focused on balanced Championship encounters and League One away draws.',
    is_current: true,
    season: '2026/2027',
    published_by: 'Chief Pools Analyst, FPCODES',
    picks: [
      { id: 'w7-1', pool_no: 2, bet_code: '2110', home: 'Everton', away: 'Crystal P.', home_win: 2.23, draw_x: 3.40, away_win: 3.35, bet: 'X', status: 'Saturday', kick_off: '3:00 PM', week: 7, is_banker: false, notes: 'Premier League fixture draw candidate' },
      { id: 'w7-2', pool_no: 14, bet_code: '4565', home: 'Swansea', away: 'Sheff Utd.', home_win: 2.57, draw_x: 3.30, away_win: 2.70, bet: 'X', status: 'Saturday', kick_off: '3:00 PM', week: 7, is_banker: false, notes: 'Championship high-probability draw pairing' },
      { id: 'w7-3', pool_no: 19, bet_code: '1072', home: 'Wimbledon', away: 'Reading', home_win: 2.50, draw_x: 3.20, away_win: 2.60, bet: 'X', status: 'Saturday', kick_off: '3:00 PM', week: 7, is_banker: true, notes: 'League One statistical draw forecast' },
      { id: 'w7-4', pool_no: 20, bet_code: '1221', home: 'Bromley', away: 'Cambridge U.', home_win: 2.68, draw_x: 3.10, away_win: 2.50, bet: 'X', status: 'Saturday', kick_off: '3:00 PM', week: 7, is_banker: false, notes: 'League One balanced coupon match' },
      { id: 'w7-5', pool_no: 30, bet_code: '1590', home: 'Walsall', away: 'Grimsby', home_win: 2.57, draw_x: 3.05, away_win: 2.63, bet: 'X', status: 'Saturday', kick_off: '3:00 PM', week: 7, is_banker: false, notes: 'League Two parity index 88%' },
      { id: 'w7-6', pool_no: 32, bet_code: '1844', home: 'Chesterfield', away: 'Harrogate', home_win: 2.30, draw_x: 3.30, away_win: 3.10, bet: 'X', status: 'Saturday', kick_off: '3:00 PM', week: 7, is_banker: true, notes: 'Deadlock rating top 3 of coupon' },
      { id: 'w7-7', pool_no: 34, bet_code: '2023', home: 'Fleetwood', away: 'Bradford C.', home_win: 2.45, draw_x: 3.25, away_win: 2.80, bet: 'X', status: 'Saturday', kick_off: '3:00 PM', week: 7, is_banker: false, notes: 'Mutual history: 4 draws in last 6' },
      { id: 'w7-8', pool_no: 37, bet_code: '2411', home: 'Port Vale', away: 'Doncaster', home_win: 2.60, draw_x: 3.15, away_win: 2.65, bet: 'X', status: 'Saturday', kick_off: '3:00 PM', week: 7, is_banker: false, notes: 'Coupon dead heat selection' },
      { id: 'w7-9', pool_no: 40, bet_code: '3109', home: 'Colchester', away: 'Morecambe', home_win: 2.25, draw_x: 3.35, away_win: 3.10, bet: 'X', status: 'Saturday', kick_off: '3:00 PM', week: 7, is_banker: true, notes: 'Top banker nap selection' },
      { id: 'w7-10', pool_no: 42, bet_code: '3381', home: 'Crewe', away: 'Accrington', home_win: 2.40, draw_x: 3.20, away_win: 2.90, bet: 'X', status: 'Saturday', kick_off: '3:00 PM', week: 7, is_banker: false, notes: 'Statistical score-draw forecast 1-1' }
    ]
  },
  {
    id: 'history-week-6',
    week_number: 6,
    edition_title: 'Week 6 Autumn Perming Breakdown & 4 Draws Hit',
    date: 'Oct 04, 2026',
    bookmaker: 'general',
    total_picks: 14,
    bankers_count: 3,
    success_rate: '80%',
    draws_hit: '4 / 5 Draws Hit',
    summary: 'Official Week 6 review. Excellent performance with Wimbledon and Doncaster locking in critical weekend dividends.',
    is_current: false,
    season: '2026/2027',
    published_by: 'Statistical Modelling Desk',
    picks: [
      { id: 'w6-1', pool_no: 3, bet_code: '1904', home: 'Aston Villa', away: 'Brentford', home_win: 2.10, draw_x: 3.50, away_win: 3.40, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 6, is_banker: true, notes: 'Delivered: 2-2 ScoreDraw hit' },
      { id: 'w6-2', pool_no: 11, bet_code: '3201', home: 'Blackburn', away: 'Leeds', home_win: 3.10, draw_x: 3.35, away_win: 2.25, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 6, is_banker: false, notes: 'Delivered: 1-1 ScoreDraw' },
      { id: 'w6-3', pool_no: 15, bet_code: '4112', home: 'Millwall', away: 'Preston', home_win: 2.30, draw_x: 3.15, away_win: 3.10, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 6, is_banker: true, notes: 'Delivered: 0-0 noScoreDraw' },
      { id: 'w6-4', pool_no: 22, bet_code: '5220', home: 'Bolton', away: 'Barnsley', home_win: 2.45, draw_x: 3.30, away_win: 2.75, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 6, is_banker: false, notes: 'Delivered: 1-1 ScoreDraw' },
      { id: 'w6-5', pool_no: 27, bet_code: '6311', home: 'Lincoln C.', away: 'Exeter', home_win: 2.20, draw_x: 3.25, away_win: 3.20, bet: 'Home', status: 'Finished', kick_off: '3:00 PM', week: 6, is_banker: false, notes: 'Home win 2-0' },
      { id: 'w6-6', pool_no: 31, bet_code: '7104', home: 'Mansfield', away: 'Peterborough', home_win: 2.65, draw_x: 3.40, away_win: 2.50, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 6, is_banker: true, notes: 'Banker Draw landed 2-2' },
      { id: 'w6-7', pool_no: 35, bet_code: '8223', home: 'Northampton', away: 'Shrewsbury', home_win: 2.35, draw_x: 3.20, away_win: 2.95, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 6, is_banker: false, notes: 'Delivered: 1-1 draw' }
    ]
  },
  {
    id: 'history-week-5',
    week_number: 5,
    edition_title: 'Week 5 Statistical Deadlock & Cross-League Perms',
    date: 'Sep 27, 2026',
    bookmaker: 'general',
    total_picks: 12,
    bankers_count: 2,
    success_rate: '75%',
    draws_hit: '4 / 5 Draws Hit',
    summary: 'Week 5 coupon analysis. Strong return across League One pairings with accurate odds parity classification.',
    is_current: false,
    season: '2026/2027',
    published_by: 'Chief Pools Analyst, FPCODES',
    picks: [
      { id: 'w5-1', pool_no: 5, bet_code: '1105', home: 'Fulham', away: 'Brighton', home_win: 2.60, draw_x: 3.40, away_win: 2.65, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 5, is_banker: false, notes: 'Delivered: 1-1 ScoreDraw' },
      { id: 'w5-2', pool_no: 12, bet_code: '2301', home: 'Bristol City', away: 'Coventry', home_win: 2.50, draw_x: 3.25, away_win: 2.75, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 5, is_banker: true, notes: 'Delivered: 2-2 ScoreDraw Banker' },
      { id: 'w5-3', pool_no: 18, bet_code: '3419', home: 'Hull City', away: 'Cardiff', home_win: 2.40, draw_x: 3.20, away_win: 2.90, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 5, is_banker: false, notes: 'Delivered: 1-1 draw' },
      { id: 'w5-4', pool_no: 25, bet_code: '4502', home: 'Leyton Orient', away: 'Charlton', home_win: 2.70, draw_x: 3.30, away_win: 2.50, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 5, is_banker: true, notes: 'Delivered: 0-0 noScoreDraw Banker' }
    ]
  },
  {
    id: 'history-week-4',
    week_number: 4,
    edition_title: 'Week 4 UK Coupon Perms & 5 Draws Hit',
    date: 'Sep 20, 2026',
    bookmaker: 'general',
    total_picks: 15,
    bankers_count: 4,
    success_rate: '83%',
    draws_hit: '5 / 6 Draws Verified',
    summary: 'Spectacular Week 4 coupon run. 5 out of 6 key draw recommendations hit the target across UK weekend pools.',
    is_current: false,
    season: '2026/2027',
    published_by: 'UK Pools Syndicate Desk',
    picks: [
      { id: 'w4-1', pool_no: 1, bet_code: '1001', home: 'Arsenal', away: 'Tottenham', home_win: 2.15, draw_x: 3.60, away_win: 3.25, bet: 'X', status: 'Finished', kick_off: '2:00 PM', week: 4, is_banker: true, notes: 'Delivered: 2-2 North London Derby ScoreDraw' },
      { id: 'w4-2', pool_no: 8, bet_code: '1802', home: 'West Ham', away: 'Chelsea', home_win: 2.80, draw_x: 3.45, away_win: 2.40, bet: 'X', status: 'Finished', kick_off: '12:30 PM', week: 4, is_banker: false, notes: 'Delivered: 1-1 London derby draw' },
      { id: 'w4-3', pool_no: 16, bet_code: '2903', home: 'Norwich', away: 'Watford', home_win: 2.40, draw_x: 3.30, away_win: 2.80, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 4, is_banker: true, notes: 'Delivered: 1-1 Banker draw' },
      { id: 'w4-4', pool_no: 23, bet_code: '3814', home: 'Portsmouth', away: 'Stoke', home_win: 2.50, draw_x: 3.20, away_win: 2.70, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 4, is_banker: false, notes: 'Delivered: 0-0 noScoreDraw' }
    ]
  },
  {
    id: 'history-week-3',
    week_number: 3,
    edition_title: 'Week 3 Triple Banker Special (100% Banker Hit)',
    date: 'Sep 13, 2026',
    bookmaker: 'general',
    total_picks: 12,
    bankers_count: 3,
    success_rate: '88%',
    draws_hit: '3 / 3 Bankers Landed',
    summary: 'Flawless 100% Banker performance in Week 3. All 3 top banker nap predictions landed on the official coupon.',
    is_current: false,
    season: '2026/2027',
    published_by: 'Chief Pools Analyst, FPCODES',
    picks: [
      { id: 'w3-1', pool_no: 6, bet_code: '1402', home: 'Newcastle', away: 'Wolves', home_win: 2.20, draw_x: 3.40, away_win: 3.10, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 3, is_banker: true, notes: 'Delivered: 1-1 Banker landed' },
      { id: 'w3-2', pool_no: 13, bet_code: '2604', home: 'Burnley', away: 'QPR', home_win: 2.30, draw_x: 3.25, away_win: 2.95, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 3, is_banker: true, notes: 'Delivered: 0-0 Banker landed' },
      { id: 'w3-3', pool_no: 29, bet_code: '3908', home: 'Rotherham', away: 'Burton', home_win: 2.35, draw_x: 3.20, away_win: 2.90, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 3, is_banker: true, notes: 'Delivered: 2-2 Banker landed' }
    ]
  },
  {
    id: 'history-week-2',
    week_number: 2,
    edition_title: 'Week 2 Early Season Draw Perms & Matrix',
    date: 'Sep 06, 2026',
    bookmaker: 'general',
    total_picks: 14,
    bankers_count: 2,
    success_rate: '79%',
    draws_hit: '4 / 5 Draws Hit',
    summary: 'Early UK season evaluation. High score-draw frequency across Scottish Championship and League One.',
    is_current: false,
    season: '2026/2027',
    published_by: 'Statistical Modelling Desk',
    picks: [
      { id: 'w2-1', pool_no: 4, bet_code: '1205', home: 'Bournemouth', away: 'Southampton', home_win: 2.30, draw_x: 3.35, away_win: 3.00, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 2, is_banker: false, notes: 'Delivered: 1-1 South coast derby' },
      { id: 'w2-2', pool_no: 17, bet_code: '2812', home: 'Middlesbrough', away: 'Sunderland', home_win: 2.45, draw_x: 3.30, away_win: 2.75, bet: 'X', status: 'Finished', kick_off: '12:30 PM', week: 2, is_banker: true, notes: 'Delivered: 2-2 Tees-Wear derby' }
    ]
  },
  {
    id: 'history-week-1',
    week_number: 1,
    edition_title: 'Week 1 Season Opening Key Codes & Selections',
    date: 'Aug 30, 2026',
    bookmaker: 'general',
    total_picks: 15,
    bankers_count: 3,
    success_rate: '80%',
    draws_hit: '4 / 5 Draws Hit',
    summary: 'The inaugural 2026/2027 season coupon guide. Baseline form matrices established with strong opening round accuracy.',
    is_current: false,
    season: '2026/2027',
    published_by: 'Chief Pools Analyst, FPCODES',
    picks: [
      { id: 'w1-1', pool_no: 7, bet_code: '1601', home: 'Leicester', away: 'Crystal Palace', home_win: 2.40, draw_x: 3.30, away_win: 2.80, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 1, is_banker: true, notes: 'Delivered: 1-1 opening day draw' },
      { id: 'w1-2', pool_no: 21, bet_code: '3105', home: 'Huddersfield', away: 'Wigan', home_win: 2.50, draw_x: 3.20, away_win: 2.70, bet: 'X', status: 'Finished', kick_off: '3:00 PM', week: 1, is_banker: false, notes: 'Delivered: 0-0 opening day draw' }
    ]
  }
];
