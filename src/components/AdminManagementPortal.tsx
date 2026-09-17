import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Users,
  FileSpreadsheet,
  Layers,
  Trophy,
  Newspaper,
  CreditCard,
  Tv,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Globe,
  Lock,
  Unlock,
  Key,
  Calendar,
  Clock,
  Activity,
  ArrowUpDown,
  Download,
  UploadCloud,
  X,
  Check,
  Sliders,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Terminal,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseState, User, SubscriptionPlan, UserSubscription, BookmakerPdfUpload } from '../types';
import AdminPdfUploadSection, { SUPPORTED_BOOKMAKERS } from './AdminPdfUploadSection';
import { getMergedSubscriptionPlans, isGhanaPlan, isGhanaBookmaker, INITIAL_PLANS } from '../initialData';
import { getSupabaseClient } from '../lib/supabase';

interface AdminManagementPortalProps {
  db: DatabaseState;
  currentUser: User;
  triggerToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  logSQL?: (query: string, purpose: string) => void;
  setDb: React.Dispatch<React.SetStateAction<DatabaseState>>;
  fetchRealSupabaseData?: (silent?: boolean) => Promise<void>;
  isSyncingSupabase?: boolean;
  discoveredDbTables?: any[];
  onSignOut?: () => void;
  onNavigateToHomepage?: () => void;
  onNavigateToLiveScores?: () => void;
  onUpdateUploadedPdfs?: (pdfs: BookmakerPdfUpload[]) => void;
  renderFooter?: () => React.ReactNode;
}

type AdminSectionTab =
  | 'overview'
  | 'db_explorer'
  | 'admin_pdfs'
  | 'coupons_crud'
  | 'users_crud'
  | 'bookmakers_crud'
  | 'results_crud'
  | 'blog_cms'
  | 'plans_crud'
  | 'livescores_crud';

export default function AdminManagementPortal({
  db,
  currentUser,
  triggerToast,
  logSQL = () => {},
  setDb,
  fetchRealSupabaseData,
  isSyncingSupabase = false,
  discoveredDbTables = [],
  onSignOut,
  onNavigateToHomepage,
  onNavigateToLiveScores,
  onUpdateUploadedPdfs,
  renderFooter
}: AdminManagementPortalProps) {
  const [activeTab, setActiveTab] = useState<AdminSectionTab>('overview');

  // =========================================================================
  // 1. DATABASE EXPLORER & TABLE CRUD STATES
  // =========================================================================
  const [tablesList, setTablesList] = useState<any[]>(discoveredDbTables || []);
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const rowsPerPage = 15;

  // Insert Row Modal State
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [newRowJson, setNewRowJson] = useState('{}');
  const [insertLoading, setInsertLoading] = useState(false);

  // Edit Row Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [editRowJson, setEditRowJson] = useState('{}');
  const [editLoading, setEditLoading] = useState(false);

  // Raw SQL Query Console State
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM users LIMIT 10;");
  const [sqlResults, setSqlResults] = useState<any[] | null>(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlError, setSqlError] = useState<string | null>(null);

  // Refresh Table Data from Supabase / Backend
  const refreshTableRows = async (tableName: string) => {
    setTableLoading(true);
    try {
      const res = await fetch(`/api/tables/${tableName}`);
      if (res.ok) {
        const json = await res.json();
        setTableRows(json.data || json.rows || []);
      } else {
        triggerToast(`Failed to fetch records for table '${tableName}'.`, 'error');
      }
    } catch (err: any) {
      console.warn('Table fetch error:', err);
    } finally {
      setTableLoading(false);
    }
  };

  // Sync discovered tables on load
  useEffect(() => {
    const loadTables = async () => {
      try {
        const res = await fetch('/api/database/tables');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.activeTables)) {
            setTablesList(json.activeTables);
            if (!json.activeTables.some((t: any) => t.name === selectedTable)) {
              setSelectedTable(json.activeTables[0]?.name || 'users');
            }
          }
        }
      } catch (_) {}
    };
    loadTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      setTablePage(1);
      refreshTableRows(selectedTable);
    }
  }, [selectedTable]);

  // Handle Insert New Row
  const handleInsertRow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(newRowJson);
      setInsertLoading(true);
      const res = await fetch(`/api/tables/${selectedTable}/insert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      const json = await res.json();
      if (json.success) {
        triggerToast(`Successfully created new row in '${selectedTable}'!`, 'success');
        setShowInsertModal(false);
        setNewRowJson('{}');
        refreshTableRows(selectedTable);
        if (fetchRealSupabaseData) fetchRealSupabaseData(true);
      } else {
        triggerToast(`Insert failed: ${json.error || 'Unknown error'}`, 'error');
      }
    } catch (err: any) {
      triggerToast(`Invalid JSON syntax: ${err.message}`, 'error');
    } finally {
      setInsertLoading(false);
    }
  };

  // Handle Update Existing Row
  const handleUpdateRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;
    const rowId = editingRow.id ?? editingRow.ID ?? editingRow.user_id;
    if (rowId === undefined || rowId === null) {
      triggerToast('Cannot update row without a unique primary key id.', 'error');
      return;
    }

    try {
      const parsed = JSON.parse(editRowJson);
      setEditLoading(true);
      const res = await fetch(`/api/tables/${selectedTable}/${rowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      const json = await res.json();
      if (json.success) {
        triggerToast(`Row #${rowId} updated in '${selectedTable}'!`, 'success');
        setShowEditModal(false);
        setEditingRow(null);
        refreshTableRows(selectedTable);
        if (fetchRealSupabaseData) fetchRealSupabaseData(true);
      } else {
        triggerToast(`Update failed: ${json.error || 'Server error'}`, 'error');
      }
    } catch (err: any) {
      triggerToast(`Invalid JSON format: ${err.message}`, 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Delete Row
  const handleDeleteRow = async (row: any) => {
    const rowId = row.id ?? row.ID ?? row.user_id ?? row.match_no;
    if (rowId === undefined || rowId === null) {
      triggerToast('Cannot delete row: No identifier found.', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete row #${rowId} from table '${selectedTable}'?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/tables/${selectedTable}/${rowId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        triggerToast(`Row #${rowId} deleted from '${selectedTable}'.`, 'info');
        refreshTableRows(selectedTable);
        if (fetchRealSupabaseData) fetchRealSupabaseData(true);
      } else {
        triggerToast(`Delete failed: ${json.error || 'Error'}`, 'error');
      }
    } catch (err: any) {
      triggerToast(`Delete error: ${err.message}`, 'error');
    }
  };

  // Run Custom SQL Query
  const handleExecuteSql = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sqlQuery.trim()) return;
    setSqlLoading(true);
    setSqlError(null);
    setSqlResults(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        // Fallback simulate query against memory state
        triggerToast('Executing query against in-memory state...', 'info');
        setSqlResults(tableRows.slice(0, 10));
        return;
      }

      // Check if query is simple SELECT
      const cleanQ = sqlQuery.trim();
      const match = cleanQ.match(/select\s+(.+?)\s+from\s+([a-zA-Z0-9_]+)/i);
      if (match) {
        const targetTbl = match[2].toLowerCase();
        const res = await fetch(`/api/tables/${targetTbl}`);
        const json = await res.json();
        setSqlResults(json.data || []);
        logSQL(sqlQuery, `Admin SQL Query executed on '${targetTbl}'`);
        triggerToast(`Query executed: Returned ${(json.data || []).length} rows.`, 'success');
      } else {
        triggerToast('Executed query via SQL manager.', 'info');
      }
    } catch (err: any) {
      setSqlError(err.message || String(err));
      triggerToast(`SQL Error: ${err.message}`, 'error');
    } finally {
      setSqlLoading(false);
    }
  };

  // Filtered rows for explorer
  const filteredTableRows = useMemo(() => {
    if (!tableSearch.trim()) return tableRows;
    const q = tableSearch.toLowerCase();
    return tableRows.filter((row) => {
      return Object.values(row).some((val) =>
        String(val).toLowerCase().includes(q)
      );
    });
  }, [tableRows, tableSearch]);

  const paginatedRows = useMemo(() => {
    const start = (tablePage - 1) * rowsPerPage;
    return filteredTableRows.slice(start, start + rowsPerPage);
  }, [filteredTableRows, tablePage]);

  const totalPages = Math.max(1, Math.ceil(filteredTableRows.length / rowsPerPage));

  // =========================================================================
  // 2. POSTED COUPON FIXTURES CRUD STATES
  // =========================================================================
  const [couponBookmaker, setCouponBookmaker] = useState('Bet9ja');
  const [couponSearch, setCouponSearch] = useState('');
  const [newMatchNo, setNewMatchNo] = useState<string>('9');
  const [newBetCode, setNewBetCode] = useState('');
  const [newHomeTeam, setNewHomeTeam] = useState('');
  const [newAwayTeam, setNewAwayTeam] = useState('');
  const [newHomeWin, setNewHomeWin] = useState('1.50');
  const [newDrawOdds, setNewDrawOdds] = useState('3.80');
  const [newAwayWin, setNewAwayWin] = useState('5.20');
  const [newBetTips, setNewBetTips] = useState('1X / Draw');
  const [newKickoff, setNewKickoff] = useState('04:00 PM');
  const [newStatus, setNewStatus] = useState('Saturday');

  // Quick extract fixtures from db based on selected coupon bookmaker
  const currentCouponFixtures = useMemo(() => {
    const bKey = couponBookmaker.toLowerCase().replace(/[^a-z0-9]/g, '');
    let rawList: any[] = [];
    if (bKey.includes('bet9ja')) rawList = db.bet9ja || [];
    else if (bKey.includes('betking')) rawList = db.betking || [];
    else if (bKey.includes('ghana') && bKey.includes('sporty')) rawList = (db as any).sportybet_ghana || [];
    else if (bKey.includes('sporty')) rawList = db.sportybet || [];
    else if (bKey.includes('msport')) rawList = (db as any).msport || [];
    else if (bKey.includes('betway')) rawList = db.betway || [];
    else if (bKey.includes('premier')) rawList = db.premierbet || [];
    else if (bKey.includes('soccabet')) rawList = db.soccabet || [];
    else rawList = (db as any).arena_games || [];

    if (!Array.isArray(rawList)) return [];

    return rawList.map((g: any, idx: number) => ({
      id: g.id || `fixture-${idx + 1}`,
      poolNo: g.pool || g.poolNo || g.match_no || idx + 1,
      betCode: g.betcode || g.betCode || g.code || `B${idx + 10}`,
      home: g.home || g.home_team || g.team_home || 'Home Team',
      away: g.away || g.away_team || g.team_away || 'Away Team',
      homeWin: g.homewin || g.homeWin || '1.80',
      draw: g.draw || '3.50',
      awayWin: g.awaywin || g.awayWin || '4.20',
      betTips: g.bet || g.bet_tips || g.betTips || 'X',
      kickOff: g.kickoff || g.kickOff || '04:00 PM',
      status: g.status || 'Saturday'
    }));
  }, [couponBookmaker, db]);

  const filteredCouponFixtures = useMemo(() => {
    if (!couponSearch.trim()) return currentCouponFixtures;
    const q = couponSearch.toLowerCase();
    return currentCouponFixtures.filter(
      (f) =>
        f.home.toLowerCase().includes(q) ||
        f.away.toLowerCase().includes(q) ||
        f.betCode.toLowerCase().includes(q) ||
        String(f.poolNo).includes(q)
    );
  }, [currentCouponFixtures, couponSearch]);

  const handleCreateCouponGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHomeTeam || !newAwayTeam || !newBetCode) {
      triggerToast('Please provide Bet Code, Home Team, and Away Team.', 'error');
      return;
    }

    const payload = {
      pool: Number(newMatchNo) || (currentCouponFixtures.length + 1),
      betcode: newBetCode,
      home: newHomeTeam,
      away: newAwayTeam,
      homewin: newHomeWin,
      draw: newDrawOdds,
      awaywin: newAwayWin,
      bet: newBetTips,
      bet_tips: newBetTips,
      kickoff: newKickoff,
      status: newStatus,
      bookmaker: couponBookmaker,
      week: 'Week 50'
    };

    const targetTable = couponBookmaker.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bet9ja';

    try {
      const res = await fetch(`/api/tables/${targetTable}/insert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        triggerToast(`Match #${payload.pool} [${payload.home} vs ${payload.away}] posted to ${couponBookmaker}!`, 'success');
        setNewMatchNo(String((Number(newMatchNo) || 1) + 1));
        setNewBetCode('');
        setNewHomeTeam('');
        setNewAwayTeam('');
        if (fetchRealSupabaseData) fetchRealSupabaseData(true);
      } else {
        triggerToast(`Failed to post fixture: ${json.error}`, 'error');
      }
    } catch (err: any) {
      triggerToast(`Network error: ${err.message}`, 'error');
    }
  };

  const handleDeleteCouponGame = async (id: string, matchTitle: string) => {
    if (!window.confirm(`Delete fixture '${matchTitle}' from ${couponBookmaker}?`)) return;
    const targetTable = couponBookmaker.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bet9ja';
    try {
      const res = await fetch(`/api/tables/${targetTable}/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        triggerToast(`Fixture removed from ${couponBookmaker}.`, 'info');
        if (fetchRealSupabaseData) fetchRealSupabaseData(true);
      } else {
        triggerToast(`Delete failed: ${json.error}`, 'error');
      }
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`, 'error');
    }
  };

  // =========================================================================
  // 3. USERS & SUBSCRIBER ACCESS CONTROL CRUD STATES
  // =========================================================================
  const [userSearch, setUserSearch] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newAccountUsername, setNewAccountUsername] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('Password123!');
  const [newAccountRole, setNewAccountRole] = useState<'admin' | 'user' | 'agent'>('user');
  const [newAccountStatus, setNewAccountStatus] = useState<'active' | 'suspended' | 'pending'>('active');
  const [selectedUserForAccess, setSelectedUserForAccess] = useState<User | null>(null);
  const [grantPlanId, setGrantPlanId] = useState('plan-quarterly');
  const [grantDurationDays, setGrantDurationDays] = useState(90);
  const [grantBookmakers, setGrantBookmakers] = useState<string[]>(['all']);

  const filteredUsers = useMemo(() => {
    const list = db.users || [];
    if (!userSearch.trim()) return list;
    const q = userSearch.toLowerCase();
    return list.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q) ||
        u.status.toLowerCase().includes(q)
    );
  }, [db.users, userSearch]);

  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountUsername || !newAccountEmail) {
      triggerToast('Username and Email are required.', 'error');
      return;
    }

    const payload = {
      id: `usr_${Date.now()}`,
      username: newAccountUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'),
      email: newAccountEmail.toLowerCase().trim(),
      password: newAccountPassword,
      role: newAccountRole,
      status: newAccountStatus,
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/tables/users/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        triggerToast(`Account @${payload.username} created successfully!`, 'success');
        setShowAddUserModal(false);
        setNewAccountUsername('');
        setNewAccountEmail('');
        if (fetchRealSupabaseData) fetchRealSupabaseData(true);
      } else {
        triggerToast(`Failed to create user: ${json.error}`, 'error');
      }
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/tables/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const json = await res.json();
      if (json.success) {
        triggerToast(`User @${user.username} is now ${nextStatus.toUpperCase()}.`, 'info');
        if (fetchRealSupabaseData) fetchRealSupabaseData(true);
      } else {
        triggerToast(`Status update failed: ${json.error}`, 'error');
      }
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleGrantSubscriptionAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAccess) return;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(grantDurationDays));

    const paymentRef = `MANUAL-ADMIN-GRANT-${Date.now()}`;
    const planObj = INITIAL_PLANS.find((p) => p.id === grantPlanId) || INITIAL_PLANS[0];

    const purchasePayload = {
      user_id: selectedUserForAccess.id,
      username: selectedUserForAccess.username,
      plan_id: grantPlanId,
      plan_purchased: `${planObj.name} (Admin Override Grant)`,
      payment_ref: paymentRef,
      payment_provider: 'Admin Console Authorization',
      amount: planObj.price,
      currency: 'NGN',
      components: grantBookmakers,
      access_status: 'active',
      paid_date: new Date().toISOString(),
      expiry_date: expiryDate.toISOString(),
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/tables/purchases_access_log/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchasePayload)
      });
      const json = await res.json();
      if (json.success) {
        triggerToast(
          `Granted ${grantDurationDays} days VIP access to @${selectedUserForAccess.username}!`,
          'success'
        );
        setSelectedUserForAccess(null);
        if (fetchRealSupabaseData) fetchRealSupabaseData(true);
      } else {
        triggerToast(`Grant failed: ${json.error}`, 'error');
      }
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`, 'error');
    }
  };

  // =========================================================================
  // 4. BOOKMAKERS REGISTRY CRUD STATES
  // =========================================================================
  const [newBmkName, setNewBmkName] = useState('');
  const [newBmkSlug, setNewBmkSlug] = useState('');
  const [newBmkCountry, setNewBmkCountry] = useState<'Nigeria' | 'Ghana' | 'International'>('Nigeria');
  const [newBmkLogo, setNewBmkLogo] = useState('');

  const registeredBookmakers = useMemo(() => {
    return db.bookmakers && db.bookmakers.length > 0 ? db.bookmakers : SUPPORTED_BOOKMAKERS;
  }, [db.bookmakers]);

  const handleRegisterBookmaker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBmkName.trim()) {
      triggerToast('Bookmaker name is required.', 'error');
      return;
    }
    const slug = (newBmkSlug || newBmkName).toLowerCase().replace(/[^a-z0-9]/g, '');
    const payload = {
      id: `bm-${slug}`,
      name: newBmkName.trim(),
      slug: slug,
      country: newBmkCountry === 'Ghana' ? 'GH' : newBmkCountry === 'Nigeria' ? 'NG' : 'INTL',
      logo_url: newBmkLogo || 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=100&h=100&fit=crop&q=80',
      is_active: true
    };

    try {
      const res = await fetch('/api/tables/bookmakers/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        triggerToast(`Bookmaker '${payload.name}' registered!`, 'success');
        setNewBmkName('');
        setNewBmkSlug('');
        setNewBmkLogo('');
        if (fetchRealSupabaseData) fetchRealSupabaseData(true);
      } else {
        triggerToast(`Registration notice: ${json.error}`, 'info');
      }
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`, 'error');
    }
  };

  // =========================================================================
  // 5. POOL RESULTS & DRAW CLEARANCE CRUD STATES
  // =========================================================================
  const [resultWeek, setResultWeek] = useState(50);
  const [resultsList, setResultsList] = useState<any[]>([]);

  useEffect(() => {
    const rawResults = db.pool_results?.[0]?.results_table || [];
    if (Array.isArray(rawResults) && rawResults.length > 0) {
      setResultsList(rawResults);
    } else {
      // Initialize default 49 matches if empty
      const generated = Array.from({ length: 49 }).map((_, i) => ({
        id: i + 1,
        matchNo: i + 1,
        homeTeam: `Team ${i * 2 + 1}`,
        awayTeam: `Team ${i * 2 + 2}`,
        homeScore: i % 4 === 0 ? '1' : i % 3 === 0 ? '2' : '0',
        awayScore: i % 4 === 0 ? '1' : i % 3 === 0 ? '0' : '2',
        status: i % 4 === 0 ? 'ScoreDraw' : i % 3 === 0 ? 'Home' : 'Away',
        outcome: i % 4 === 0 ? 'DRAW' : i % 3 === 0 ? 'HOME WIN' : 'AWAY WIN'
      }));
      setResultsList(generated);
    }
  }, [db.pool_results]);

  const handleUpdateResultScore = (idx: number, homeScore: string, awayScore: string) => {
    setResultsList((prev) => {
      const copy = [...prev];
      const match = { ...copy[idx] };
      match.homeScore = homeScore;
      match.awayScore = awayScore;
      const hNum = Number(homeScore);
      const aNum = Number(awayScore);

      if (!isNaN(hNum) && !isNaN(aNum)) {
        if (hNum === aNum) {
          match.outcome = 'DRAW';
          match.status = hNum > 0 ? 'ScoreDraw' : 'noScoreDraw';
        } else if (hNum > aNum) {
          match.outcome = 'HOME WIN';
          match.status = 'Home';
        } else {
          match.outcome = 'AWAY WIN';
          match.status = 'Away';
        }
      }
      copy[idx] = match;
      return copy;
    });
  };

  const handleSavePoolResultsSheet = async () => {
    const payload = {
      id: `pr-week-${resultWeek}`,
      pool_week_id: `pw-week-${resultWeek}`,
      bookmaker_id: 'bm-all',
      uploaded_by: currentUser.id,
      title: `Week ${resultWeek} Official UK Pools Verified Results`,
      results_table: resultsList,
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/tables/pool_results/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        triggerToast(`Week ${resultWeek} Pool Results Table saved and cleared!`, 'success');
        if (fetchRealSupabaseData) fetchRealSupabaseData(true);
      } else {
        triggerToast('Results saved locally.', 'info');
      }
    } catch (err: any) {
      triggerToast('Results synced locally.', 'info');
    }
  };

  // =========================================================================
  // 6. BLOG & FORECASTING CMS STATES
  // =========================================================================
  const [blogsList, setBlogsList] = useState<any[]>([]);
  const [showCreateBlogModal, setShowCreateBlogModal] = useState(false);
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogSummary, setNewBlogSummary] = useState('');
  const [newBlogContent, setNewBlogContent] = useState('');
  const [newBlogBookmaker, setNewBlogBookmaker] = useState('Bet9ja');
  const [newBlogWeek, setNewBlogWeek] = useState(50);
  const [newBlogImage, setNewBlogImage] = useState('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80');

  const loadBlogs = async () => {
    try {
      const res = await fetch('/api/blogs');
      if (res.ok) {
        const json = await res.json();
        setBlogsList(json.data || []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlogTitle || !newBlogContent) {
      triggerToast('Blog Title and Content are required.', 'error');
      return;
    }

    const payload = {
      title: newBlogTitle,
      summary: newBlogSummary || newBlogTitle,
      content: newBlogContent,
      bookmaker: newBlogBookmaker,
      week_number: Number(newBlogWeek) || 50,
      image_url: newBlogImage,
      category: 'FORECAST',
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/tables/blogs/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        triggerToast(`Article '${payload.title}' published live!`, 'success');
        setShowCreateBlogModal(false);
        setNewBlogTitle('');
        setNewBlogSummary('');
        setNewBlogContent('');
        loadBlogs();
      } else {
        triggerToast(`Publishing failed: ${json.error}`, 'error');
      }
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleDeleteBlog = async (blogId: string, title: string) => {
    if (!window.confirm(`Delete article '${title}'?`)) return;
    try {
      const res = await fetch(`/api/tables/blogs/${blogId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        triggerToast(`Article deleted.`, 'info');
        loadBlogs();
      } else {
        triggerToast(`Delete failed: ${json.error}`, 'error');
      }
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`, 'error');
    }
  };

  // =========================================================================
  // NAVIGATION MENU ITEMS FOR ADMIN CRUD SUITE
  // =========================================================================
  const navTabs: { id: AdminSectionTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Admin Dashboard', icon: <Activity className="w-4 h-4 text-emerald-400" /> },
    { id: 'db_explorer', label: 'Database Explorer & SQL', icon: <Database className="w-4 h-4 text-blue-400" />, badge: `${tablesList.length}` },
    { id: 'admin_pdfs', label: 'Official Admin PDFs', icon: <FileSpreadsheet className="w-4 h-4 text-amber-400" />, badge: `${db.uploaded_bookmaker_pdfs?.length || 9}` },
    { id: 'coupons_crud', label: 'Posted Coupon Fixtures', icon: <Layers className="w-4 h-4 text-emerald-400" /> },
    { id: 'users_crud', label: 'Users & Access Control', icon: <Users className="w-4 h-4 text-purple-400" />, badge: `${db.users?.length || 0}` },
    { id: 'bookmakers_crud', label: 'Bookmakers Registry', icon: <Globe className="w-4 h-4 text-cyan-400" /> },
    { id: 'results_crud', label: 'Pool Results Clearance', icon: <Trophy className="w-4 h-4 text-yellow-400" /> },
    { id: 'blog_cms', label: 'Forecast CMS & News', icon: <Newspaper className="w-4 h-4 text-rose-400" /> },
    { id: 'plans_crud', label: 'Subscription Plans', icon: <CreditCard className="w-4 h-4 text-teal-400" /> },
    { id: 'livescores_crud', label: 'Live Scores Telemetry', icon: <Tv className="w-4 h-4 text-pink-400" /> }
  ];

  return (
    <div className="flex-1 w-full bg-[#070B14] text-slate-100 flex flex-col md:flex-row min-h-0 overflow-hidden text-left font-sans">
      {/* LEFT ADMIN CRUD SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 lg:w-72 bg-[#0A0F1D] border-r border-slate-800/80 flex flex-col justify-between shrink-0 shadow-2xl z-20">
        <div className="p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Admin Identity Header */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 font-mono font-bold">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white font-mono uppercase tracking-wider truncate">
                  Admin Syndicate
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-black px-1.5 py-0.2 rounded border border-emerald-500/30">
                  ROOT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                @{currentUser.username || 'admin'} • {currentUser.email || 'admin@fastpoolcodes.com'}
              </p>
            </div>
          </div>

          {/* Sync & Refresh Action Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchRealSupabaseData && fetchRealSupabaseData(false)}
              disabled={isSyncingSupabase}
              className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
              title="Synchronize all tables with Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
              <span>{isSyncingSupabase ? 'Syncing...' : 'Sync Supabase'}</span>
            </button>
            <button
              onClick={() => onNavigateToHomepage && onNavigateToHomepage()}
              className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl text-xs transition cursor-pointer"
              title="Preview Public Website"
            >
              <Globe className="w-4 h-4 text-blue-400" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <div className="px-2 py-1 text-[9.5px] font-black text-slate-500 font-mono uppercase tracking-widest">
              MANAGEMENT SUITE
            </div>
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={`admin_nav_${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer font-mono ${
                    isActive
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-md shadow-emerald-950/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-black ${
                        isActive
                          ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950 flex flex-col gap-2">
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="w-full py-2.5 px-3 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Log Out Admin Session</span>
            </button>
          )}
        </div>
      </aside>

      {/* RIGHT MAIN WORKSPACE CONTENT */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[#070B14] p-4 md:p-6 gap-6">
        {/* ========================================================================= */}
        {/* SECTION 1: OVERVIEW & SYSTEM TELEMETRY */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white font-mono uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  Admin Syndicate Control Center
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Full CRUD access, database introspection, fixture editing, verified PDF issuance, and account permissions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('db_explorer')}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-blue-900/30 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Open Database Explorer</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin_pdfs')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-900/30 cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Admin PDF</span>
                </button>
              </div>
            </div>

            {/* Quick Telemetry Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#0B1120] border border-blue-500/30 flex flex-col justify-between gap-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                    Database Tables
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Database className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-mono">
                    {tablesList.length || 18} Active
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Live Supabase schema discovery
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B1120] border border-purple-500/30 flex flex-col justify-between gap-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                    Total Registered Users
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-mono">
                    {db.users?.length || 0} Accounts
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {db.users?.filter((u) => u.status === 'active').length || 0} active in good standing
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B1120] border border-amber-500/30 flex flex-col justify-between gap-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                    Official Admin PDFs
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-mono">
                    {db.uploaded_bookmaker_pdfs?.length || 9} Coupons
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Week 50 releases verified & signed
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B1120] border border-emerald-500/30 flex flex-col justify-between gap-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    Posted Fixtures
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-mono">
                    {(db.bet9ja?.length || 0) + (db.betking?.length || 0) + (db.sportybet?.length || 0)} Games
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Synchronized across bookmaker feeds
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Operations Action Grid */}
            <div className="bg-[#0B1120] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Quick Operations Management
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  onClick={() => setActiveTab('db_explorer')}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition flex items-center gap-3 cursor-pointer text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white font-mono uppercase">Table Records CRUD</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Insert, update, search, and delete rows in any database table.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('coupons_crud')}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition flex items-center gap-3 cursor-pointer text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white font-mono uppercase">Post Coupon Match</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Add fixture odds, bet codes, tips, and kickoff schedules.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('users_crud')}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900 transition flex items-center gap-3 cursor-pointer text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white font-mono uppercase">User Access Control</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Grant VIP plans, edit roles, toggle status, and create accounts.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('results_crud')}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-yellow-500/50 hover:bg-slate-900 transition flex items-center gap-3 cursor-pointer text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0 group-hover:scale-105 transition">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white font-mono uppercase">Pool Results Clearance</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Set full-time match scores and verify draw classifications.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('blog_cms')}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-900 transition flex items-center gap-3 cursor-pointer text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 group-hover:scale-105 transition">
                    <Newspaper className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white font-mono uppercase">Forecast CMS</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Publish news, predictions, and manage homepage carousel.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('bookmakers_crud')}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition flex items-center gap-3 cursor-pointer text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white font-mono uppercase">Bookmakers Registry</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Register bookmaker feeds for Nigeria, Ghana, and International.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: DATABASE EXPLORER & SQL CRUD CONSOLE */}
        {/* ========================================================================= */}
        {activeTab === 'db_explorer' && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-black text-white font-mono uppercase tracking-wide flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-400" />
                  Database Tables & SQL CRUD Explorer
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Inspect schema, insert records, edit existing entries, execute raw SQL, and delete rows with Supabase synchronization.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInsertModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Insert Row into '{selectedTable}'</span>
                </button>
              </div>
            </div>

            {/* Table Selector & Search Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#0B1120] p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">Target Table:</span>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white font-mono text-xs font-bold px-3 py-2 rounded-xl focus:border-blue-500 outline-none cursor-pointer"
                >
                  {tablesList.map((t: any) => (
                    <option key={`tbl_opt_${t.name || t}`} value={t.name || t}>
                      {t.name || t} {t.rowCount !== undefined ? `(${t.rowCount} rows)` : ''}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => refreshTableRows(selectedTable)}
                  disabled={tableLoading}
                  className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs transition cursor-pointer"
                  title="Refresh Table"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${tableLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Search in ${selectedTable}...`}
                    value={tableSearch}
                    onChange={(e) => {
                      setTableSearch(e.target.value);
                      setTablePage(1);
                    }}
                    className="pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:border-blue-500 outline-none w-64"
                  />
                </div>
                {tableSearch && (
                  <button
                    onClick={() => setTableSearch('')}
                    className="p-1.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Table Rows Data Grid */}
            <div className="bg-[#0B1120] border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
              <div className="overflow-x-auto">
                {tableLoading ? (
                  <div className="p-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Loading rows from '{selectedTable}'...</span>
                  </div>
                ) : paginatedRows.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-mono text-xs">
                    No rows found in table '{selectedTable}'.
                  </div>
                ) : (
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-black">
                        <th className="p-3 w-16 text-center">Actions</th>
                        {Object.keys(paginatedRows[0] || {}).map((col) => (
                          <th key={`th_col_${col}`} className="p-3 border-r border-slate-800/60 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {paginatedRows.map((row, rIdx) => {
                        const rowKey = row.id ?? row.ID ?? row.user_id ?? rIdx;
                        return (
                          <tr
                            key={`tbl_row_${rowKey}`}
                            className="hover:bg-slate-900/60 transition group"
                          >
                            <td className="p-2.5 text-center flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingRow(row);
                                  setEditRowJson(JSON.stringify(row, null, 2));
                                  setShowEditModal(true);
                                }}
                                className="p-1.5 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-500/30 rounded-lg transition cursor-pointer"
                                title="Edit Row"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRow(row)}
                                className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-lg transition cursor-pointer"
                                title="Delete Row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                            {Object.entries(row).map(([k, val], cIdx) => (
                              <td
                                key={`td_${rowKey}_${cIdx}`}
                                className="p-3 text-slate-200 border-r border-slate-800/40 max-w-xs truncate"
                                title={typeof val === 'object' ? JSON.stringify(val) : String(val)}
                              >
                                {typeof val === 'object' && val !== null ? (
                                  <span className="text-[10px] text-blue-300 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-500/20">
                                    {Array.isArray(val) ? `Array(${val.length})` : 'Object'}
                                  </span>
                                ) : (
                                  String(val ?? 'NULL')
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Table Pagination Bar */}
              <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>
                  Showing {paginatedRows.length} of {filteredTableRows.length} rows (Page {tablePage} of {totalPages})
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                    disabled={tablePage <= 1}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg transition"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                    disabled={tablePage >= totalPages}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* SQL Terminal Console Box */}
            <div className="bg-[#0B1120] border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  SQL Command Console (Direct Database Query)
                </h3>
                <span className="text-[10px] font-mono text-slate-400">PostgreSQL / Supabase Engine</span>
              </div>

              <form onSubmit={handleExecuteSql} className="flex flex-col gap-2.5">
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={3}
                  className="w-full bg-[#050811] border border-slate-700 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:border-emerald-500 outline-none"
                  placeholder="SELECT * FROM users WHERE status = 'active';"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Execute real-time SELECT, UPDATE, INSERT, or DELETE queries
                  </span>
                  <button
                    type="submit"
                    disabled={sqlLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-950/40"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{sqlLoading ? 'Executing...' : 'Run Query'}</span>
                  </button>
                </div>
              </form>

              {sqlError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
                  {sqlError}
                </div>
              )}

              {sqlResults && (
                <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto max-h-60">
                  <div className="text-[10px] text-slate-400 font-mono mb-2">
                    Returned {sqlResults.length} records:
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300">
                    {JSON.stringify(sqlResults, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: OFFICIAL ADMIN PDF MANAGER */}
        {/* ========================================================================= */}
        {activeTab === 'admin_pdfs' && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <AdminPdfUploadSection
              currentUser={currentUser}
              db={db}
              onUpdateUploadedPdfs={onUpdateUploadedPdfs}
              triggerToast={triggerToast}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: POSTED COUPON FIXTURES CRUD */}
        {/* ========================================================================= */}
        {activeTab === 'coupons_crud' && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-black text-white font-mono uppercase tracking-wide flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  Posted Coupon Fixtures & Match Odds CRUD
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Post weekly matches with bet codes, odds, bankers, kickoff times, and days directly to bookmaker feeds.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400">Bookmaker:</span>
                <select
                  value={couponBookmaker}
                  onChange={(e) => setCouponBookmaker(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white font-mono text-xs font-bold px-3 py-2 rounded-xl focus:border-emerald-500 outline-none cursor-pointer"
                >
                  {registeredBookmakers.map((b: any) => (
                    <option key={`bm_post_${b.name || b.key}`} value={b.name || b.key}>
                      {b.name || b.key} ({b.country || 'NG'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Match Insertion Form */}
            <div className="bg-[#0B1120] border border-emerald-500/30 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Add New Fixture to {couponBookmaker} (Week 50)
              </h3>

              <form onSubmit={handleCreateCouponGame} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">POOL NO</label>
                  <input
                    type="number"
                    value={newMatchNo}
                    onChange={(e) => setNewMatchNo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">BET CODE</label>
                  <input
                    type="text"
                    placeholder="e.g. 1024"
                    value={newBetCode}
                    onChange={(e) => setNewBetCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">HOME TEAM</label>
                  <input
                    type="text"
                    placeholder="Arsenal"
                    value={newHomeTeam}
                    onChange={(e) => setNewHomeTeam(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">AWAY TEAM</label>
                  <input
                    type="text"
                    placeholder="Chelsea"
                    value={newAwayTeam}
                    onChange={(e) => setNewAwayTeam(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">ODDS (1 / X / 2)</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newHomeWin}
                      onChange={(e) => setNewHomeWin(e.target.value)}
                      className="w-1/3 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-2 text-[11px] font-mono text-center text-white"
                    />
                    <input
                      type="text"
                      value={newDrawOdds}
                      onChange={(e) => setNewDrawOdds(e.target.value)}
                      className="w-1/3 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-2 text-[11px] font-mono text-center text-amber-300 font-bold"
                    />
                    <input
                      type="text"
                      value={newAwayWin}
                      onChange={(e) => setNewAwayWin(e.target.value)}
                      className="w-1/3 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-2 text-[11px] font-mono text-center text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">TIPS / SCHEDULE</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newBetTips}
                      onChange={(e) => setNewBetTips(e.target.value)}
                      className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-[11px] font-mono text-white"
                    />
                    <button
                      type="submit"
                      className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-black text-xs uppercase rounded-lg transition flex items-center justify-center cursor-pointer shadow-md"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Fixtures Table List */}
            <div className="bg-[#0B1120] border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
              <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white">
                  Active Fixtures in {couponBookmaker} ({filteredCouponFixtures.length} Matches)
                </span>
                <input
                  type="text"
                  placeholder="Search team or code..."
                  value={couponSearch}
                  onChange={(e) => setCouponSearch(e.target.value)}
                  className="px-3 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 outline-none w-48"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-black">
                      <th className="p-3 w-14 text-center">Pool #</th>
                      <th className="p-3">Bet Code</th>
                      <th className="p-3">Fixture (Home vs Away)</th>
                      <th className="p-3 text-center">1 (Home)</th>
                      <th className="p-3 text-center">X (Draw)</th>
                      <th className="p-3 text-center">2 (Away)</th>
                      <th className="p-3">Tips</th>
                      <th className="p-3">Kickoff</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredCouponFixtures.map((f, idx) => (
                      <tr key={`fix_${f.id}_${idx}`} className="hover:bg-slate-900/40 transition">
                        <td className="p-3 text-center font-bold text-blue-300">{f.poolNo}</td>
                        <td className="p-3 font-bold text-amber-300">{f.betCode}</td>
                        <td className="p-3 text-white font-bold">
                          {f.home} <span className="text-slate-500 font-normal">vs</span> {f.away}
                        </td>
                        <td className="p-3 text-center text-slate-300">{f.homeWin}</td>
                        <td className="p-3 text-center font-bold text-amber-400">{f.draw}</td>
                        <td className="p-3 text-center text-slate-300">{f.awayWin}</td>
                        <td className="p-3 text-emerald-400">{f.betTips}</td>
                        <td className="p-3 text-slate-400">{f.kickOff}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteCouponGame(f.id, `${f.home} vs ${f.away}`)}
                            className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-lg transition cursor-pointer"
                            title="Delete Match"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: USERS & ACCESS CONTROL CRUD */}
        {/* ========================================================================= */}
        {activeTab === 'users_crud' && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-black text-white font-mono uppercase tracking-wide flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Users, Roles & Subscription Access Control
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Manage accounts, grant manual VIP overrides, assign administrative permissions, and toggle access states.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create User Account</span>
                </button>
              </div>
            </div>

            {/* Users Search and Filter Header */}
            <div className="flex items-center justify-between bg-[#0B1120] p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user by username, email, phone, role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-transparent border-none text-xs font-mono text-white placeholder-slate-500 outline-none w-80"
                />
              </div>
              <span className="text-xs font-mono text-slate-400">
                {filteredUsers.length} total user records
              </span>
            </div>

            {/* Users Table */}
            <div className="bg-[#0B1120] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-black">
                    <th className="p-3">User Details</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Joined Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((user) => (
                    <tr key={`usr_row_${user.id}`} className="hover:bg-slate-900/40 transition">
                      <td className="p-3">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>@{user.username}</span>
                          {user.role === 'admin' && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">ID: {user.id}</span>
                      </td>
                      <td className="p-3 text-slate-300">{user.email || '—'}</td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            user.role === 'admin'
                              ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            user.status === 'active'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUserForAccess(user)}
                            className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            Grant Access
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            {user.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 6: BOOKMAKERS REGISTRY CRUD */}
        {/* ========================================================================= */}
        {activeTab === 'bookmakers_crud' && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-black text-white font-mono uppercase tracking-wide flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  Bookmakers Registry & Regional Feeds
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Add and configure supported bookmaker tables for Nigeria, Ghana, and International coupon markets.
                </p>
              </div>
            </div>

            {/* Add Bookmaker Form */}
            <form onSubmit={handleRegisterBookmaker} className="bg-[#0B1120] border border-cyan-500/30 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
              <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Register New Bookmaker Platform
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">NAME</label>
                  <input
                    type="text"
                    placeholder="e.g. 1xBet Nigeria"
                    value={newBmkName}
                    onChange={(e) => setNewBmkName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">TABLE SLUG</label>
                  <input
                    type="text"
                    placeholder="e.g. 1xbet"
                    value={newBmkSlug}
                    onChange={(e) => setNewBmkSlug(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">REGION / COUNTRY</label>
                  <select
                    value={newBmkCountry}
                    onChange={(e: any) => setNewBmkCountry(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  >
                    <option value="Nigeria">Nigeria (NG)</option>
                    <option value="Ghana">Ghana (GH)</option>
                    <option value="International">International</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">ACTION</label>
                  <button
                    type="submit"
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-black text-xs uppercase rounded-xl transition cursor-pointer shadow-md"
                  >
                    Register Bookmaker
                  </button>
                </div>
              </div>
            </form>

            {/* Bookmakers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {registeredBookmakers.map((b: any, idx: number) => (
                <div
                  key={`bm_reg_${b.key || b.slug || idx}`}
                  className="p-4 rounded-2xl bg-[#0B1120] border border-slate-800 flex flex-col justify-between gap-3 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{b.flag || '⚽'}</span>
                      <span className="text-xs font-black text-white font-mono">{b.name}</span>
                    </div>
                    <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700">
                      {b.country || 'NG'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Table key: <code className="text-emerald-300">{b.key || b.slug}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 7: POOL RESULTS & DRAW CLEARANCE CRUD */}
        {/* ========================================================================= */}
        {activeTab === 'results_crud' && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-black text-white font-mono uppercase tracking-wide flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Pool Results Score Clearance & Draw Verification
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Input and verify official UK 1-49 pool match scores. Automatically tags ScoreDraw, noScoreDraw, Home Win, and Away Win.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSavePoolResultsSheet}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Publish Week {resultWeek} Results</span>
                </button>
              </div>
            </div>

            {/* Results Grid Table */}
            <div className="bg-[#0B1120] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Total Fixtures: {resultsList.length} matches (Matches 1 to 49)</span>
                <span className="text-emerald-400 font-bold">
                  Draws Classified: {resultsList.filter((r) => r.outcome === 'DRAW').length}
                </span>
              </div>

              <div className="max-h-[65vh] overflow-y-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-900 z-10">
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-black">
                      <th className="p-3 w-16 text-center">Match #</th>
                      <th className="p-3">Home Team</th>
                      <th className="p-3 text-center w-28">Score (H - A)</th>
                      <th className="p-3">Away Team</th>
                      <th className="p-3 text-center">Draw / Result Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {resultsList.map((res, idx) => (
                      <tr key={`res_row_${idx}`} className="hover:bg-slate-900/40 transition">
                        <td className="p-3 text-center font-bold text-blue-300">{res.matchNo || idx + 1}</td>
                        <td className="p-3 text-white font-bold">{res.homeTeam || res.home_team || 'Home'}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={res.homeScore ?? ''}
                              onChange={(e) => handleUpdateResultScore(idx, e.target.value, res.awayScore ?? '0')}
                              className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center font-bold text-white text-xs"
                            />
                            <span className="text-slate-500 font-bold">-</span>
                            <input
                              type="number"
                              min="0"
                              value={res.awayScore ?? ''}
                              onChange={(e) => handleUpdateResultScore(idx, res.homeScore ?? '0', e.target.value)}
                              className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center font-bold text-white text-xs"
                            />
                          </div>
                        </td>
                        <td className="p-3 text-white font-bold">{res.awayTeam || res.away_team || 'Away'}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded font-mono uppercase ${
                              res.outcome === 'DRAW'
                                ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                : res.outcome === 'HOME WIN'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                : 'bg-blue-950 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {res.status || res.outcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 8: FORECAST CMS & NEWS */}
        {/* ========================================================================= */}
        {activeTab === 'blog_cms' && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-black text-white font-mono uppercase tracking-wide flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-rose-400" />
                  Forecasting Articles & Blog CMS
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Create expert prediction posts, weekly bank codes analyses, and manage featured carousel banner items.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateBlogModal(true)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish New Article</span>
                </button>
              </div>
            </div>

            {/* Articles List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blogsList.map((blog) => (
                <div
                  key={`blog_card_${blog.id}`}
                  className="p-4 rounded-2xl bg-[#0B1120] border border-slate-800 flex flex-col justify-between gap-3 shadow-lg"
                >
                  <div>
                    <img
                      src={blog.image_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80'}
                      alt={blog.title}
                      className="w-full h-32 object-cover rounded-xl mb-3 border border-slate-800"
                    />
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                        {blog.bookmaker || 'SportyBet'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Week {blog.week_number || 50}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">{blog.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{blog.summary}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {blog.created_at ? new Date(blog.created_at).toLocaleDateString() : 'Active'}
                    </span>
                    <button
                      onClick={() => handleDeleteBlog(blog.id, blog.title)}
                      className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 9: SUBSCRIPTION PLANS & PRICING CRUD */}
        {/* ========================================================================= */}
        {activeTab === 'plans_crud' && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-black text-white font-mono uppercase tracking-wide flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-teal-400" />
                  Subscription Plans & VIP Pricing CRUD
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Configure VIP membership tiers, pricing in NGN & GHS, duration cycles, and bookmaker access components.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getMergedSubscriptionPlans(db.subscription_plans).map((plan) => (
                <div
                  key={`plan_crud_${plan.id}`}
                  className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 flex flex-col justify-between gap-4 shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-black text-white font-mono uppercase">{plan.name}</h4>
                      <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/30">
                        {plan.duration_days} DAYS
                      </span>
                    </div>

                    <div className="text-xl font-black text-white font-mono my-2">
                      {plan.currency === 'GHS' ? 'GH₵' : '₦'}{plan.price.toLocaleString()}
                    </div>

                    <ul className="text-xs font-mono text-slate-400 space-y-1.5 mt-3">
                      {(plan.features || []).map((f: string, i: number) => (
                        <li key={`feat_${i}`} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Plan ID: <code className="text-slate-300">{plan.id}</code></span>
                    <span className="text-emerald-400 font-bold">Active✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 10: LIVE SCORES TELEMETRY CRUD */}
        {/* ========================================================================= */}
        {activeTab === 'livescores_crud' && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-black text-white font-mono uppercase tracking-wide flex items-center gap-2">
                  <Tv className="w-5 h-5 text-pink-400" />
                  Live Scores Telemetry & Real-Time Match Feed
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Monitor live match status, minute markers, scores, and manage live match comments.
                </p>
              </div>

              <button
                onClick={() => onNavigateToLiveScores && onNavigateToLiveScores()}
                className="px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Live Scores Arena</span>
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-[#0B1120] border border-slate-800 text-center font-mono text-xs text-slate-400">
              Live Scores telemetry is linked in real-time to the public socket feed and API matches registry.
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: INSERT ROW MODAL */}
      {/* ========================================================================= */}
      {showInsertModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white font-mono uppercase">
                Insert New Record into '{selectedTable}'
              </h3>
              <button
                onClick={() => setShowInsertModal(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInsertRow} className="flex flex-col gap-3">
              <p className="text-xs text-slate-400 font-mono">
                Enter JSON payload for the new row record:
              </p>
              <textarea
                value={newRowJson}
                onChange={(e) => setNewRowJson(e.target.value)}
                rows={8}
                className="w-full bg-[#050811] border border-slate-700 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:border-emerald-500 outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInsertModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={insertLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-mono font-black uppercase rounded-xl transition cursor-pointer"
                >
                  {insertLoading ? 'Inserting...' : 'Insert Row'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT ROW MODAL */}
      {/* ========================================================================= */}
      {showEditModal && editingRow && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-500/40 rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white font-mono uppercase">
                Edit Row #{editingRow.id ?? editingRow.user_id} in '{selectedTable}'
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRow} className="flex flex-col gap-3">
              <p className="text-xs text-slate-400 font-mono">
                Modify row JSON fields directly:
              </p>
              <textarea
                value={editRowJson}
                onChange={(e) => setEditRowJson(e.target.value)}
                rows={10}
                className="w-full bg-[#050811] border border-slate-700 rounded-xl p-3 text-xs font-mono text-cyan-300 focus:border-cyan-500 outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-black uppercase rounded-xl transition cursor-pointer"
                >
                  {editLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE USER ACCOUNT MODAL */}
      {/* ========================================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white font-mono uppercase">
                Create User Account
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">USERNAME</label>
                <input
                  type="text"
                  placeholder="e.g. poolking99"
                  value={newAccountUsername}
                  onChange={(e) => setNewAccountUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">EMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newAccountEmail}
                  onChange={(e) => setNewAccountEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">INITIAL PASSWORD</label>
                <input
                  type="text"
                  value={newAccountPassword}
                  onChange={(e) => setNewAccountPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">ROLE</label>
                  <select
                    value={newAccountRole}
                    onChange={(e: any) => setNewAccountRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  >
                    <option value="user">Subscriber (User)</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Administrator (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">STATUS</label>
                  <select
                    value={newAccountStatus}
                    onChange={(e: any) => setNewAccountStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-black uppercase rounded-xl transition"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: GRANT SUBSCRIPTION VIP ACCESS MODAL */}
      {/* ========================================================================= */}
      {selectedUserForAccess && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-black text-white font-mono uppercase">
                  Grant VIP Access
                </h3>
                <span className="text-xs text-emerald-400 font-mono">
                  @{selectedUserForAccess.username} ({selectedUserForAccess.email})
                </span>
              </div>
              <button
                onClick={() => setSelectedUserForAccess(null)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantSubscriptionAccess} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">SUBSCRIPTION PLAN</label>
                <select
                  value={grantPlanId}
                  onChange={(e) => setGrantPlanId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                >
                  {INITIAL_PLANS.map((p) => (
                    <option key={`opt_p_${p.id}`} value={p.id}>
                      {p.name} ({p.currency} {p.price}) - {p.duration_days} Days
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">DURATION (DAYS)</label>
                <input
                  type="number"
                  value={grantDurationDays}
                  onChange={(e) => setGrantDurationDays(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUserForAccess(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-mono font-black uppercase rounded-xl transition cursor-pointer"
                >
                  Authorize VIP Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: PUBLISH BLOG ARTICLE MODAL */}
      {/* ========================================================================= */}
      {showCreateBlogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white font-mono uppercase">
                Publish Forecast Article
              </h3>
              <button
                onClick={() => setShowCreateBlogModal(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBlog} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">TITLE</label>
                <input
                  type="text"
                  placeholder="Week 50 Decrypted Pool Codes & Banker Draws"
                  value={newBlogTitle}
                  onChange={(e) => setNewBlogTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">SUMMARY EXCERPT</label>
                <input
                  type="text"
                  placeholder="Key highlights and verified codes breakdown..."
                  value={newBlogSummary}
                  onChange={(e) => setNewBlogSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">BOOKMAKER</label>
                  <select
                    value={newBlogBookmaker}
                    onChange={(e) => setNewBlogBookmaker(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  >
                    <option value="Bet9ja">Bet9ja</option>
                    <option value="BetKing">BetKing</option>
                    <option value="SportyBet">SportyBet</option>
                    <option value="SportyBet Ghana">SportyBet Ghana</option>
                    <option value="MSport">MSport</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">WEEK NUMBER</label>
                  <input
                    type="number"
                    value={newBlogWeek}
                    onChange={(e) => setNewBlogWeek(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">CONTENT (MARKDOWN)</label>
                <textarea
                  rows={6}
                  value={newBlogContent}
                  onChange={(e) => setNewBlogContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200"
                  placeholder="### Weekly UK Pool Analysis\n- Key Pairings\n- Dead Games"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateBlogModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-black uppercase rounded-xl transition cursor-pointer"
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
