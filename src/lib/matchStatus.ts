// Single source of truth for pool result statuses.
//
// Before this helper existed, every view used the rule
//   "draw -> Draw, home win -> Home, ANYTHING ELSE -> Away"
// so postponed (P-:-P), cancelled or pending matches were shown as AWAY.

export type MatchStatus =
  | 'Home'
  | 'Away'
  | 'ScoreDraw'
  | 'noScoreDraw'
  | 'Pending'
  | 'Cancelled'
  | 'Postponed'
  | 'Panel';

export const SPECIAL_STATUSES: MatchStatus[] = ['Pending', 'Postponed', 'Cancelled', 'Panel'];

const lower = (v: any) => String(v ?? '').trim().toLowerCase();

/** Detect Pending / Cancelled / Postponed / Panel from free text such as a status column. */
function specialFromText(text: string): MatchStatus | null {
  if (!text) return null;
  if (text.includes('panel')) return 'Panel';
  if (text.includes('postpon') || text === 'ppd' || text === 'pp' || text === 'p') return 'Postponed';
  if (text.includes('cancel') || text.includes('abandon') || text.includes('void') || text === 'c' || text === 'canc') return 'Cancelled';
  if (text.includes('pending') || text === 'not started' || text === 'ns' || text === 'tbd' || text === 'upcoming' || text === 'scheduled') return 'Pending';
  return null;
}

/** Get the home/away score parts from whichever score field the row has. */
export function getScoreParts(row: any): [string, string] {
  const pool = row?.pool_result ?? row?.score ?? row?.fullTimeScore;
  if (pool !== undefined && pool !== null && String(pool).trim() !== '') {
    const parts = String(pool).split(/\s*-:-\s*|\s+-\s+|\s*:\s*|-/);
    if (parts.length >= 2) return [parts[0].trim(), parts[1].trim()];
  }
  const h = row?.Home_Team_Score ?? row?.home_team_score ?? row?.homeScore;
  const a = row?.Away_Team_Score ?? row?.away_team_score ?? row?.awayScore;
  return [String(h ?? '').trim(), String(a ?? '').trim()];
}

/** Work out the correct status for one result row. */
export function resolveMatchStatus(row: any): MatchStatus {
  if (!row) return 'Pending';
  const rawTexts = [row.status, row.outcome, row.result_status].map(lower).filter(Boolean);

  // 1. Explicit Pending / Cancelled / Postponed / Panel always wins.
  for (const t of rawTexts) {
    const s = specialFromText(t);
    if (s) return s;
  }

  // 2. Letter scores (P-:-P, C-:-C, ?-:-?) mean the match was not played normally.
  const [h, a] = getScoreParts(row);
  const hl = h.toLowerCase();
  const al = a.toLowerCase();
  if (hl === 'p' || al === 'p') return 'Postponed';
  if (hl === 'c' || al === 'c' || hl === 'v' || al === 'v') return 'Cancelled';
  if (hl === '?' || al === '?' || hl === 'x' || al === 'x') return 'Pending';

  // 3. Explicit Home / Away / Draw status.
  for (const t of rawTexts) {
    if (t === 'scoredraw' || t === 'score draw') return 'ScoreDraw';
    if (t === 'noscoredraw' || t === 'no score draw') return 'noScoreDraw';
    if (t.includes('draw')) {
      return h === '0' && a === '0' ? 'noScoreDraw' : 'ScoreDraw';
    }
    if (t === 'home' || t === 'home win' || t === '1') return 'Home';
    if (t === 'away' || t === 'away win' || t === '2') return 'Away';
  }

  // 4. Fall back to the numeric score.
  if (h !== '' && a !== '' && !isNaN(Number(h)) && !isNaN(Number(a))) {
    const hn = Number(h);
    const an = Number(a);
    if (hn === an) return hn === 0 ? 'noScoreDraw' : 'ScoreDraw';
    return hn > an ? 'Home' : 'Away';
  }

  // 5. No usable information: the match has not been settled yet.
  return 'Pending';
}

export const isDrawStatus = (s: string) => s === 'ScoreDraw' || s === 'noScoreDraw';

/** Legacy `outcome` value stored alongside status. */
export function statusToOutcome(s: MatchStatus): string {
  switch (s) {
    case 'ScoreDraw':
    case 'noScoreDraw':
      return 'DRAW';
    case 'Home':
      return 'HOME WIN';
    case 'Away':
      return 'AWAY WIN';
    default:
      return s.toUpperCase(); // PENDING, CANCELLED, POSTPONED, PANEL
  }
}

/** Display label for badges. */
export function statusLabel(s: string): string {
  switch (s) {
    case 'ScoreDraw':
      return 'Draw';
    case 'noScoreDraw':
      return 'noScore';
    default:
      return s;
  }
}

/** Short code for the scrolling ticker. */
export function statusShortLabel(s: string): string {
  switch (s) {
    case 'Postponed':
      return 'PPD';
    case 'Cancelled':
      return 'CANC';
    case 'Pending':
      return 'PEND';
    case 'Panel':
      return 'PANEL';
    default:
      return s;
  }
}

/** Tailwind classes for status badges (background, text, border). */
export function statusBadgeClasses(s: string): string {
  switch (s) {
    case 'ScoreDraw':
      return 'bg-emerald-950 text-emerald-300 border border-emerald-700';
    case 'noScoreDraw':
      return 'bg-teal-950 text-teal-300 border border-teal-700';
    case 'Home':
      return 'bg-blue-950 text-blue-300 border border-blue-700';
    case 'Away':
      return 'bg-purple-950 text-purple-300 border border-purple-700';
    case 'Postponed':
      return 'bg-amber-950 text-amber-300 border border-amber-600';
    case 'Cancelled':
      return 'bg-red-950 text-red-300 border border-red-700';
    case 'Panel':
      return 'bg-orange-950 text-orange-300 border border-orange-600';
    case 'Pending':
    default:
      return 'bg-slate-900 text-slate-300 border border-slate-600';
  }
}

/** Tailwind text colour for the ticker. */
export function statusTextColor(s: string): string {
  switch (s) {
    case 'ScoreDraw':
    case 'noScoreDraw':
      return 'text-emerald-400';
    case 'Home':
      return 'text-blue-400';
    case 'Away':
      return 'text-purple-400';
    case 'Postponed':
      return 'text-amber-400';
    case 'Cancelled':
      return 'text-red-400';
    case 'Panel':
      return 'text-orange-400';
    default:
      return 'text-slate-400';
  }
}
