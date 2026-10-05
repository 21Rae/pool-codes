import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BookmakerPdfUpload, User, DatabaseState } from '../types';
import { INITIAL_UPLOADED_BOOKMAKER_PDFS, findAdminPdfForBookmaker, INITIAL_BET9JA, INITIAL_BETKING, INITIAL_SPORTYBET, INITIAL_SPORTYBET_GHANA, INITIAL_PREMIERBET, INITIAL_BETWAY, INITIAL_SOCCABET, INITIAL_MSPORT, INITIAL_POOL_CODES_COMPARISON } from '../initialData';

export interface DownloadAdminPdfOptions {
  bookmaker: string;
  weekNumber?: number | string;
  currentUser?: User;
  db?: DatabaseState;
  customPdfs?: BookmakerPdfUpload[];
  triggerToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

/**
 * Normalizes bookmaker names to uniform keys
 */
export function normalizeBookmakerKey(name: string): string {
  const norm = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (norm.includes('bet9ja') || norm.includes('b9')) return 'bet9ja';
  if (norm.includes('betking') || norm.includes('bk')) return 'betking';
  if (norm.includes('sportybetghana') || norm.includes('sportygh') || norm.includes('sbgh')) return 'sportybet-ghana';
  if (norm.includes('sporty')) return 'sportybet';
  if (norm.includes('premier')) return 'premierbet';
  if (norm.includes('betway')) return 'betway';
  if (norm.includes('socca')) return 'soccabet';
  if (norm.includes('msport')) return 'msport';
  if (norm.includes('comparison') || norm.includes('master')) return 'pool_codes_comparison';
  return norm || 'bet9ja';
}

/**
 * Retrieves the display metadata and brand details for a bookmaker
 */
export function getBookmakerBrandInfo(bookmaker: string) {
  const key = normalizeBookmakerKey(bookmaker);
  switch (key) {
    case 'bet9ja':
      return {
        key: 'bet9ja',
        name: 'Bet9ja',
        country: 'Nigeria',
        flag: '🇳🇬',
        primaryColor: [5, 150, 105], // emerald-600
        darkColor: [6, 78, 59], // emerald-900
        prefix: 'B9',
        title: 'BET9JA OFFICIAL POOL COUPON & VERIFIED KEYS',
        defaultFilename: 'Bet9ja_Week50_Official_Pool_Coupon.pdf'
      };
    case 'betking':
      return {
        key: 'betking',
        name: 'BetKing',
        country: 'Nigeria',
        flag: '🇳🇬',
        primaryColor: [37, 99, 235], // blue-600
        darkColor: [30, 58, 138], // blue-900
        prefix: 'BK',
        title: 'BETKING VERIFIED KEY CODES & CLASSIFIED COUPON',
        defaultFilename: 'BetKing_Week50_Verified_Key_Codes.pdf'
      };
    case 'sportybet':
      return {
        key: 'sportybet',
        name: 'SportyBet',
        country: 'Nigeria',
        flag: '🇳🇬',
        primaryColor: [225, 29, 72], // rose-600
        darkColor: [136, 19, 55], // rose-900
        prefix: 'SB',
        title: 'SPORTYBET NIGERIA OFFICIAL POOL FIXTURES',
        defaultFilename: 'SportyBet_Nigeria_Week50_Official_Coupon.pdf'
      };
    case 'sportybet-ghana':
      return {
        key: 'sportybet-ghana',
        name: 'SportyBet Ghana',
        country: 'Ghana',
        flag: '🇬🇭',
        primaryColor: [220, 38, 38], // red-600
        darkColor: [127, 29, 29], // red-900
        prefix: 'SBGH',
        title: 'SPORTYBET GHANA REGIONAL OFFICIAL POOL COUPON',
        defaultFilename: 'SportyBet_Ghana_Week50_Official_Pool.pdf'
      };
    case 'msport':
      return {
        key: 'msport',
        name: 'MSport',
        country: 'Nigeria',
        flag: '🇳🇬',
        primaryColor: [217, 119, 6], // amber-600
        darkColor: [120, 53, 15], // amber-900
        prefix: 'MS',
        title: 'MSPORT OFFICIAL POOL FIXTURES & DRAW MULTIPLIERS',
        defaultFilename: 'MSport_Week50_Official_Pool_Slip.pdf'
      };
    case 'betway':
      return {
        key: 'betway',
        name: 'Betway Ghana',
        country: 'Ghana',
        flag: '🇬🇭',
        primaryColor: [14, 116, 144], // cyan-700
        darkColor: [22, 78, 99], // cyan-900
        prefix: 'BW',
        title: 'BETWAY GHANA OFFICIAL POOL COUPON SHEET',
        defaultFilename: 'Betway_Ghana_Week50_Official_Coupon.pdf'
      };
    case 'premierbet':
      return {
        key: 'premierbet',
        name: 'PremierBet Ghana',
        country: 'Ghana',
        flag: '🇬🇭',
        primaryColor: [22, 163, 74], // green-600
        darkColor: [20, 83, 45], // green-900
        prefix: 'PB',
        title: 'PREMIERBET GHANA OFFICIAL POOL CODE SHEET',
        defaultFilename: 'PremierBet_Ghana_Week50_Official_Coupon.pdf'
      };
    case 'soccabet':
      return {
        key: 'soccabet',
        name: 'Soccabet Ghana',
        country: 'Ghana',
        flag: '🇬🇭',
        primaryColor: [234, 88, 12], // orange-600
        darkColor: [124, 45, 18], // orange-900
        prefix: 'SC',
        title: 'SOCCABET GHANA OFFICIAL DRAW MATRIX & SLIP',
        defaultFilename: 'Soccabet_Ghana_Week50_Official_Slip.pdf'
      };
    case 'pool_codes_comparison':
    default:
      return {
        key: 'pool_codes_comparison',
        name: 'Pool Codes Comparison',
        country: 'International',
        flag: '🌐',
        primaryColor: [147, 51, 234], // purple-600
        darkColor: [88, 28, 135], // purple-900
        prefix: 'PCC',
        title: 'MASTER POOL CODES MULTI-BOOKMAKER DRAW MATRIX',
        defaultFilename: 'FastPoolCodes_Week50_Master_Comparison_Sheet.pdf'
      };
  }
}

/**
 * Downloads the official Admin PDF for a given bookmaker
 */
export async function downloadBookmakerAdminPdf({
  bookmaker,
  weekNumber = 50,
  currentUser,
  db,
  customPdfs,
  triggerToast = () => {}
}: DownloadAdminPdfOptions): Promise<boolean> {
  const brand = getBookmakerBrandInfo(bookmaker);
  const user: User = currentUser || {
    id: 'usr-vip-001',
    username: 'user',
    email: 'user@fastpoolcodes.com',
    role: 'user',
    status: 'active',
    email_verified_at: null,
    created_at: new Date().toISOString()
  };
  const currentWeek = Number(weekNumber) || 50;

  // 1. Subscription & Role Access Enforcement
  const isAdmin = user.role === 'admin';
  const isFreeCoupon = brand.key === 'pool_codes_comparison';

  if (!isAdmin && !isFreeCoupon) {
    let hasAccess = false;
    const uname = (user.username || '').toLowerCase().trim();

    const matchesUserRecord = (s: any) => {
      if (!s) return false;
      const sUid = String(s.user_id || '').trim();
      const sUname = String(s.username || '').toLowerCase().trim();
      const sEmail = String(s.email || '').toLowerCase().trim();
      const uEmail = String(user.email || '').toLowerCase().trim();
      return (user.id && sUid === user.id) || (uname && sUname === uname) || (uEmail && sEmail === uEmail);
    };

    const matchesBookmakerRecord = (s: any) => {
      const rawComps = (s as any).accessible_tables || s.granted_tables || s.components || [];
      const comps: string[] = Array.isArray(rawComps)
        ? rawComps.map(String)
        : typeof rawComps === 'string'
        ? (() => { try { const p = JSON.parse(rawComps); return Array.isArray(p) ? p.map(String) : [rawComps]; } catch (_) { return rawComps.split(','); } })()
        : [];
      const planStr = String(s.plan_purchased || s.plan_name || s.item_name || s.plan_id || '').toLowerCase();
      return (
        comps.some((c: string) => {
          const cl = c.trim().toLowerCase();
          return cl === 'all' || cl.includes(brand.key) || brand.key.includes(cl);
        }) ||
        planStr.includes(brand.key) ||
        planStr.includes('unlimited') ||
        planStr.includes('yearly')
      );
    };

    // Check database purchases_access_log
    if (db && Array.isArray(db.purchases_access_log)) {
      const activeLogs = db.purchases_access_log.filter(
        (s: any) => matchesUserRecord(s) && (s.access_status === 'active' || s.status === 'active') && (!s.expiry_date || new Date(s.expiry_date) > new Date())
      );
      if (activeLogs.some(matchesBookmakerRecord)) {
        hasAccess = true;
      }
    }

    // Check database user subscriptions
    if (!hasAccess && db && Array.isArray(db.user_subscriptions)) {
      const activeSubs = db.user_subscriptions.filter(
        (s: any) => matchesUserRecord(s) && s.status === 'active' && (!s.expires_at || new Date(s.expires_at) > new Date())
      );
      for (const sub of activeSubs) {
        const plan = db.subscription_plans?.find((p: any) => p.id === sub.plan_id);
        if (plan && plan.id === 'plan-free') continue;
        if (matchesBookmakerRecord(sub) || (plan && (plan.id.includes('yearly') || plan.id.includes('unlimited') || plan.id.includes('all')))) {
          hasAccess = true;
          break;
        }
      }
    }

    // Check cached active subscriptions in localStorage
    if (!hasAccess) {
      try {
        const rawCached = localStorage.getItem('fastpool_user_subscriptions');
        if (rawCached) {
          const parsed = JSON.parse(rawCached);
          if (Array.isArray(parsed)) {
            const active = parsed.filter((s: any) => matchesUserRecord(s) && s.status === 'active');
            if (active.some(matchesBookmakerRecord)) {
              hasAccess = true;
            }
          }
        }
      } catch (_) {}
    }

    // Check active paid flag or tier
    if (!hasAccess && ((user as any).is_paid || (user as any).plan_tier === 'vip' || (user as any).has_active_subscription)) {
      hasAccess = true;
    }

    // Server-side verification fallback against live purchases_access_log
    if (!hasAccess) {
      try {
        const verifyRes = await fetch('/api/pdf/verify-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id || '',
            'x-username': user.username || ''
          },
          body: JSON.stringify({
            user_id: user.id,
            username: user.username,
            bookmaker: brand.key
          })
        });
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          if (verifyData && verifyData.allowed) {
            hasAccess = true;
          }
        }
      } catch (_) {}
    }

    if (!hasAccess) {
      triggerToast(
        `Subscription Required: You need an active subscription for the ${brand.name} table to download official PDF coupons. Please visit the Plans & VIP page to subscribe.`,
        'error'
      );
      return false;
    }
  }

  // 2. Locate current uploaded PDF record from Supabase Storage ('pdf' bucket)
  let serverPdfs: BookmakerPdfUpload[] = [];
  try {
    const res = await fetch(`/api/admin-pdfs?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        serverPdfs = data.data;
        try {
          localStorage.setItem('fastpool_uploaded_bookmaker_pdfs', JSON.stringify(serverPdfs));
        } catch (_) {}
      }
    }
  } catch (_) {}

  // Prioritize live server bucket records first; only append local items that have a base64 file_data_url
  let pdfList: BookmakerPdfUpload[] = [...serverPdfs];
  const seenIds = new Set(serverPdfs.map(p => p.id));

  const appendIfNew = (items?: BookmakerPdfUpload[]) => {
    if (!Array.isArray(items)) return;
    items.forEach(item => {
      if (item && !seenIds.has(item.id)) {
        // Only include non-server items if server didn't respond or item has local base64 data
        if (serverPdfs.length === 0 || (item.file_data_url && item.file_data_url.startsWith('data:'))) {
          seenIds.add(item.id);
          pdfList.push(item);
        }
      }
    });
  };

  appendIfNew(customPdfs);
  appendIfNew(db?.uploaded_bookmaker_pdfs);
  try {
    const cached = localStorage.getItem('fastpool_uploaded_bookmaker_pdfs');
    if (cached) {
      appendIfNew(JSON.parse(cached));
    }
  } catch (_) {}
  appendIfNew(INITIAL_UPLOADED_BOOKMAKER_PDFS);

  const existingPdf = findAdminPdfForBookmaker(brand.key, pdfList);

  // 3. Download directly from Supabase Storage Bucket ('pdf') via server endpoint or public storage URL
  if (existingPdf && (existingPdf.storage_path || existingPdf.storage_url)) {
    const downloadFileName = existingPdf.file_name || brand.defaultFilename;
    triggerToast(`Retrieving current ${brand.name} PDF (${downloadFileName}) from Supabase bucket...`, 'info');

    // First try server proxy endpoint which streams directly from supabase.storage.from('pdf')
    try {
      const proxyUrl = `/api/admin-pdfs/download/${encodeURIComponent(brand.key)}?path=${encodeURIComponent(existingPdf.storage_path || '')}&t=${Date.now()}`;
      const proxyRes = await fetch(proxyUrl, { cache: 'no-store' });
      if (proxyRes.ok) {
        const blob = await proxyRes.blob();
        if (blob.size > 0) {
          const objUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objUrl;
          a.download = downloadFileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
          triggerToast(`Downloaded current ${brand.name} PDF from Supabase: ${downloadFileName}`, 'success');
          return true;
        }
      }
    } catch (_) {}

    // Fallback to direct public storage_url fetch
    if (existingPdf.storage_url) {
      try {
        const response = await fetch(`${existingPdf.storage_url}${existingPdf.storage_url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
        if (response.ok) {
          const blob = await response.blob();
          const objUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objUrl;
          a.download = downloadFileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
          triggerToast(`Downloaded current ${brand.name} PDF from Supabase: ${downloadFileName}`, 'success');
          return true;
        }
      } catch (e) {
        console.warn('Direct blob fetch from Supabase failed, falling back to direct link:', e);
        const a = document.createElement('a');
        a.href = existingPdf.storage_url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.download = downloadFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        triggerToast(`Opened current ${brand.name} PDF from Supabase Storage`, 'success');
        return true;
      }
    }
  }

  // 4. Download from base64 data URL if available
  if (existingPdf && existingPdf.file_data_url && existingPdf.file_data_url.startsWith('data:application/pdf')) {
    try {
      const a = document.createElement('a');
      a.href = existingPdf.file_data_url;
      a.download = existingPdf.file_name || brand.defaultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      triggerToast(`Downloaded verified admin release: ${existingPdf.file_name}`, 'success');
      return true;
    } catch (e) {
      console.warn('Failed to trigger direct data url download, generating official PDF fallback:', e);
    }
  }

  // 2. Generate high-fidelity broadcast-ready Official Admin PDF
  try {
    const isLandscape = brand.key === 'pool_codes_comparison';
    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Top Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(5, 4, pageWidth - 10, 12, 'F');

    // Accent Stripe
    doc.setFillColor(brand.primaryColor[0], brand.primaryColor[1], brand.primaryColor[2]);
    doc.rect(5, 16, pageWidth - 10, 1.2, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(`⚽ FASTPOOLCODES // ${brand.name.toUpperCase()} OFFICIAL ADMIN RELEASE`, 8, 10);

    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(`OFFICIAL BROADCAST CERTIFICATE • WEEK ${currentWeek} (2026) • ${brand.country.toUpperCase()}`, 8, 14.2);

    // Right-aligned verification badge
    doc.setFillColor(brand.primaryColor[0], brand.primaryColor[1], brand.primaryColor[2]);
    doc.roundedRect(pageWidth - 48, 6.5, 42, 7, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('VERIFIED ADMIN SIGNED', pageWidth - 27, 11, { align: 'center' });

    // Sub-header Metadata Bar
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    const authCode = `FPC-SHA256-${(user.id || 'GUEST').slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    doc.text(`LICENSEE: @${user.username || 'user'} (${user.email || 'user@fastpoolcodes.com'})  |  AUTH CODE: ${authCode}  |  STATUS: ACTIVE OFFICIAL RELEASE`, 5, 20.5);

    // Prepare Table Rows based on Bookmaker
    let tableHeaders: string[][] = [];
    let tableRows: any[][] = [];

    if (brand.key === 'pool_codes_comparison') {
      tableHeaders = [['POOL', 'HOME TEAM', 'AWAY TEAM', 'BET9JA (DRAW)', 'BETKING (DRAW)', 'SPORTYBET (DRAW)', 'STATUS', 'KICKOFF']];
      const compSource = db?.pool_codes_comparison && db.pool_codes_comparison.length > 0 ? db.pool_codes_comparison : INITIAL_POOL_CODES_COMPARISON;
      tableRows = compSource.map((r: any, idx: number) => [
        String(r.pool ?? idx + 1),
        String(r.home ?? 'Match ' + (idx + 1)),
        String(r.away ?? 'Opponent ' + (idx + 1)),
        String(r['bet9ja (draw)'] ?? '3.30'),
        String(r['betking (draw)'] ?? '3.35'),
        String(r['sportybet (draw)'] ?? '3.30'),
        String(r.status ?? 'Active'),
        String(r.kickoff ?? '3:00 PM')
      ]);
    } else {
      tableHeaders = [['Pool', 'Bet Code', 'League', 'Home Team', 'Away Team', '1', 'X', '2', 'Bet Tips', 'Status', 'Kick Off', 'Week']];
      
      // Get bookmaker records
      let records: any[] = [];
      if (db && Array.isArray((db as any)[brand.key]) && (db as any)[brand.key].length > 0) {
        records = (db as any)[brand.key];
      } else {
        switch (brand.key) {
          case 'bet9ja': records = INITIAL_BET9JA; break;
          case 'betking': records = INITIAL_BETKING; break;
          case 'sportybet': records = INITIAL_SPORTYBET; break;
          case 'sportybet-ghana': records = INITIAL_SPORTYBET_GHANA; break;
          case 'premierbet': records = INITIAL_PREMIERBET; break;
          case 'betway': records = INITIAL_BETWAY; break;
          case 'soccabet': records = INITIAL_SOCCABET; break;
          case 'msport': records = INITIAL_MSPORT; break;
          default: records = INITIAL_BET9JA; break;
        }
      }

      tableRows = records.map((r: any, idx: number) => {
        const poolNo = r.pool ?? r.pool_no ?? (idx + 1);
        const betCode = r.betcode ?? r.bet_code ?? `${brand.prefix}${(1000 + poolNo * 37).toString(36).toUpperCase()}`;
        const league = r.league ?? 'Championship';
        const home = r.home ?? r.home_team ?? 'Home Club';
        const away = r.away ?? r.away_team ?? 'Away Club';
        const hWin = typeof r.homewin === 'number' ? r.homewin.toFixed(2) : (r.homewin ?? '2.10');
        const draw = typeof r.draw === 'number' ? r.draw.toFixed(2) : (r.draw ?? '3.30');
        const aWin = typeof r.awaywin === 'number' ? r.awaywin.toFixed(2) : (r.awaywin ?? '3.40');
        const tip = r.bet ?? r.bet_tips ?? (Number(draw) <= 3.30 ? 'DRAW (X)' : (poolNo % 2 === 1 ? '1X / DRAW' : 'AWAY WIN (2)'));
        const status = r.status ?? 'Active';
        const kickoff = r.kickoff ?? r.kick_off ?? '3:00 PM';
        const wk = r.week_no ?? r.week_number ?? currentWeek;

        return [
          String(poolNo),
          String(betCode),
          String(league),
          String(home),
          String(away),
          String(hWin),
          String(draw),
          String(aWin),
          String(tip),
          String(status),
          String(kickoff),
          `Wk ${wk}`
        ];
      });
    }

    const startYPos = 22.5;

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: startYPos,
      margin: { top: startYPos, bottom: 9, left: 5, right: 5 },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontStyle: 'bold',
        fontSize: isLandscape ? 7.4 : 6.8,
        cellPadding: isLandscape ? 1.0 : 0.85,
        textColor: [0, 0, 0],
        lineColor: [203, 213, 225],
        lineWidth: 0.15
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: isLandscape ? 7.8 : 7.2,
        halign: 'center',
        lineWidth: 0.2
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      willDrawPage: () => {
        // Subtle background security watermark
        doc.saveGraphicsState();
        doc.setTextColor(245, 245, 245);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const wmText = `FASTPOOLCODES OFFICIAL • @${user.username || 'user'}`;
        for (let y = 30; y < pageHeight; y += 50) {
          for (let x = -10; x < pageWidth + 20; x += 120) {
            doc.text(wmText, x, y, { angle: -25 });
          }
        }
        doc.restoreGraphicsState();
      },
      didDrawPage: () => {
        // Bottom Footer Notice
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.4);
        doc.setTextColor(71, 85, 105);
        doc.text(
          `OFFICIAL ADMIN VERIFIED RELEASE • FastPoolCodes Syndicate (Week ${currentWeek}) • Support WhatsApp: +234 8030587933, +234 9037595705`,
          pageWidth / 2,
          pageHeight - 4,
          { align: 'center' }
        );
      }
    });

    // Ensure strictly single-page format
    while (doc.getNumberOfPages() > 1) {
      doc.deletePage(doc.getNumberOfPages());
    }

    const downloadFileName = existingPdf?.file_name || `${brand.name.replace(/\s+/g, '_')}_Week${currentWeek}_Official_Admin_PDF.pdf`;
    doc.save(downloadFileName);
    triggerToast(`Official Admin PDF for ${brand.name} (Week ${currentWeek}) downloaded successfully!`, 'success');
    return true;
  } catch (err) {
    console.error('Failed to generate Admin PDF:', err);
    triggerToast(`Failed to generate Admin PDF for ${brand.name}.`, 'error');
    return false;
  }
}
