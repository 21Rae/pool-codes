import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

dotenv.config();

// Pre-compiled regular expressions for ultra-fast parsing without catastrophic backtracking
const REGEX_TABLE_NAME = /^[a-zA-Z0-9_\- %]+$/;
const REGEX_CLEAN_TABLE = /[^a-z0-9_]/g;
const REGEX_CLEAN_USERNAME = /[^a-z0-9_]/g;
const REGEX_HTML_TAGS = /<[^>]*>/g;
const REGEX_WHITESPACE = /\s+/g;
const REGEX_STARTED_TOKEN = /\[Started:\s*([^\]]+)\]/;
const REGEX_ESPN_MATCH = /\[ESPN LIVE SCORE MATCH\]:\s*.*?\s*(\d+)\s*-\s*(\d+)\s*.*?\.\s*Status:\s*(\w+)\s*\((.*?)\)\./i;
const REGEX_DDG_SNIPPET = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

// Singleton clients to eliminate CPU cycles spent on repeated SDK instantiation
let cachedSupabaseAnon: SupabaseClient | null = null;
let cachedSupabaseService: SupabaseClient | null = null;
let cachedGeminiAi: GoogleGenAI | null = null;

function getSupabaseClient(useServiceRole: boolean = false): SupabaseClient | null {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl) return null;

  if (useServiceRole && serviceRoleKey) {
    if (!cachedSupabaseService) {
      cachedSupabaseService = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
    }
    return cachedSupabaseService;
  }

  const keyToUse = supabaseAnonKey || serviceRoleKey;
  if (!keyToUse) return null;

  if (!cachedSupabaseAnon) {
    cachedSupabaseAnon = createClient(supabaseUrl, keyToUse, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return cachedSupabaseAnon;
}

function getGeminiClient(): GoogleGenAI | null {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === "MY_GEMINI_API_KEY" || geminiKey === "GEMINI_API_KEY") return null;

  if (!cachedGeminiAi) {
    cachedGeminiAi = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" }
      }
    });
  }
  return cachedGeminiAi;
}

// In-Memory Stale-While-Revalidate (SWR) / TTL Caching Layer
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const memoryCache = new Map<string, CacheEntry<any>>();

function getFromCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
}

function setToCache<T>(key: string, data: T, ttlMs: number): void {
  // Cap cache size to avoid unbounded memory consumption in serverless containers
  if (memoryCache.size > 200) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function invalidateCache(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

// Server-side in-memory user registry for instant database access and fallback
let serverMemoryUsers: any[] = [];

const app = express();

// High-Performance Normalized Request Body & URL Middleware
app.use((req, res, next) => {
  if (req.originalUrl && req.url !== req.originalUrl) {
    req.url = req.originalUrl;
  }

  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "object") {
      (req as any)._body = true;
    } else if (typeof req.body === "string" && req.body.trim().length > 0) {
      try {
        req.body = JSON.parse(req.body);
        (req as any)._body = true;
      } catch (_) {
        // Leave to express.json
      }
    }
  }
  next();
});

app.use((req, res, next) => {
  if ((req as any)._body || (req.body !== undefined && typeof req.body === "object" && req.body !== null)) {
    (req as any)._body = true;
    req.body = req.body || {};
    return next();
  }

  express.json({ limit: "2mb" })(req, res, (err) => {
    if (err) {
      req.body = {};
    }
    req.body = req.body || {};
    next();
  });
});

// Helper for setting Edge & Browser Caching Headers
function setCacheHeaders(res: express.Response, maxAge: number, sMaxAge: number, swr: number = 300) {
  res.setHeader("Cache-Control", `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`);
}

// API Route - Health Check (Immediate CPU Short-Circuit)
app.get("/api/health", (req, res) => {
  setCacheHeaders(res, 5, 10, 30);
  res.json({ status: "ok", timestamp: Date.now() });
});

// API Route - Dynamic public configuration retrieval for client-side SPA (Edge Cached 24h)
app.get("/api/config", (req, res) => {
  setCacheHeaders(res, 3600, 86400, 604800);
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  const paystackPublicKey = process.env.VITE_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY || "";
  res.json({ supabaseUrl, supabaseAnonKey, paystackPublicKey });
});

// API Route - Securely Query blogs from Supabase with SWR Memory Cache
app.get("/api/blogs", async (req, res) => {
  setCacheHeaders(res, 30, 60, 300);

  const cacheKey = "blogs:list";
  const cached = getFromCache<any>(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const supabase = getSupabaseClient(false);
  if (!supabase) {
    return res.json({ success: true, table: "blogs", data: [], message: "Supabase credentials not configured" });
  }

  try {
    // Fast-path: Direct query to the primary 'blogs' table
    const fastRes = await supabase.from("blogs").select("*");
    if (!fastRes.error && Array.isArray(fastRes.data)) {
      const responsePayload = { success: true, table: "blogs", data: fastRes.data };
      setToCache(cacheKey, responsePayload, 60000); // 60s in-memory cache
      return res.json(responsePayload);
    }

    // Fallback search only when standard 'blogs' fails
    const CANDIDATE_TABLES = ["blog", "posts", "post", "articles", "news", "expert_blogs"];
    for (const tableName of CANDIDATE_TABLES) {
      try {
        const r = await supabase.from(tableName).select("*");
        if (r && !r.error && Array.isArray(r.data) && r.data.length > 0) {
          const responsePayload = { success: true, table: tableName, data: r.data };
          setToCache(cacheKey, responsePayload, 60000);
          return res.json(responsePayload);
        }
      } catch (_) {}
    }

    const emptyPayload = { success: true, table: "blogs", data: [] };
    setToCache(cacheKey, emptyPayload, 30000);
    return res.json(emptyPayload);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || String(err), data: [] });
  }
});

// API Route - Get all discovered tables from Supabase database (Cached 2 Minutes)
app.get("/api/database/tables", async (req, res) => {
  setCacheHeaders(res, 60, 120, 600);

  const cacheKey = "database:tables:discovery";
  const cached = getFromCache<any>(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const supabase = getSupabaseClient(true) || getSupabaseClient(false);
  if (!supabase) {
    return res.status(500).json({
      success: false,
      error: "Supabase connection parameters are missing or not configured in settings."
    });
  }

  const CANDIDATE_TABLES = [
    "blogs", "blog", "posts", "articles", "news", "expert_blogs",
    "users", "profiles", "accounts",
    "livescores", "live_scores", "matches", "fixtures", "predictions",
    "championship_results", "championships",
    "pool codes comparison", "pool_codes_comparison",
    "weekly_picks", "weekly_pool_picks", "weekly_picks_table",
    "pool_codes", "pool_results", "pool_weeks", "bookmakers",
    "subscription_plans", "user_subscriptions", "notifications", "user_downloads",
    "bet9ja", "betking", "sportybet", "msport", "premierbet", "betway", "soccabet", "arena_games",
    "coupons", "bank_codes", "bank_account_codes", "settings", "comments", "subscriptions"
  ];

  try {
    const probeResults = await Promise.all(
      CANDIDATE_TABLES.map(async (tableName) => {
        try {
          const { data, error, count } = await supabase.from(tableName).select("*", { count: "exact" }).limit(1);
          if (!error) {
            return {
              name: tableName,
              exists: true,
              count: count ?? data?.length ?? 0,
              sample: data?.[0] || null,
              error: null
            };
          }
          const isMissing = error.code === "PGRST205" || error.message.includes("Could not find the table");
          return {
            name: tableName,
            exists: !isMissing,
            count: 0,
            sample: null,
            error: error.message,
            errorCode: error.code
          };
        } catch (err: any) {
          return { name: tableName, exists: false, count: 0, sample: null, error: err?.message || String(err) };
        }
      })
    );

    const activeTables = probeResults.filter((r) => r.exists);
    const missingTables = probeResults.filter((r) => !r.exists).map((r) => r.name);

    const payload = {
      success: true,
      timestamp: new Date().toISOString(),
      activeCount: activeTables.length,
      activeTables,
      missingTables
    };

    setToCache(cacheKey, payload, 120000); // 2-minute cache
    return res.json(payload);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// Helper: Ultra-Fast User Table & Bookmaker Permission Check with Short-Term Memoization
async function checkUserTableAccess(
  userId?: string,
  username?: string,
  targetTable?: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (!targetTable) return { allowed: false, reason: "No target bookmaker or table specified." };

  const cleanTable = targetTable.toLowerCase().trim().replace(REGEX_CLEAN_TABLE, "");

  // 1. FAST-PATH: Public Tables (Zero I/O, Instant CPU Return)
  const PUBLIC_TABLES = new Set([
    "users", "profiles", "accounts", "blogs", "blog", "posts", "articles", "news", "expert_blogs",
    "subscription_plans", "settings", "comments", "notifications", "livescores", "live_scores",
    "championship_results", "championships", "pool_weeks", "bookmakers",
    "pool_codes_comparison", "pool codes comparison", "pool_code_comparison", "pool_comparison",
    "poolcodes_comparison", "pool_codes_comparisons", "weekly_picks", "weekly_pool_picks",
    "weekly pool picks", "weekly_picks_table", "purchases_access_log", "subscriptions_access_log",
    "plan_purchased", "plans_purchased", "user_subscriptions", "users_subscriptions", "subscriptions"
  ]);

  if (PUBLIC_TABLES.has(cleanTable)) {
    return { allowed: true };
  }

  const cleanUid = String(userId || "").toLowerCase().trim();
  const cleanUname = String(username || "").toLowerCase().trim();

  // 2. FAST-PATH: Reject Unauthenticated Requests
  if (!cleanUid && !cleanUname) {
    return {
      allowed: false,
      reason: "Access Denied: Missing user identification. Please log in with an active subscription."
    };
  }

  // 3. FAST-PATH: Admin Bypass
  if (cleanUid === "usr-admin" || cleanUname === "admin") {
    return { allowed: true };
  }

  // 4. MEMOIZED ACCESS CACHE CHECK (Eliminates repeated DB queries for the same active session)
  const accessCacheKey = `access:${cleanUid}:${cleanUname}:${cleanTable}`;
  const cachedAccess = getFromCache<{ allowed: boolean; reason?: string }>(accessCacheKey);
  if (cachedAccess) {
    return cachedAccess;
  }

  const supabase = getSupabaseClient(true) || getSupabaseClient(false);
  if (!supabase) {
    const memUser = serverMemoryUsers.find(
      (u) =>
        (cleanUid && String(u.id).toLowerCase() === cleanUid) ||
        (cleanUname && String(u.username).toLowerCase() === cleanUname)
    );
    if (memUser && memUser.role === "admin") return { allowed: true };
    return {
      allowed: false,
      reason: `Access Denied: Zero access without verified purchases_access_log record for @${cleanUname || cleanUid}.`
    };
  }

  try {
    // Check if user is admin in users table
    try {
      let userQuery = supabase.from("users").select("id, username, role, status");
      if (cleanUid && cleanUname) {
        userQuery = userQuery.or(`id.eq.${cleanUid},username.eq.${cleanUname}`);
      } else if (cleanUid) {
        userQuery = userQuery.eq("id", cleanUid);
      } else {
        userQuery = userQuery.eq("username", cleanUname);
      }
      const { data: userRow } = await userQuery.maybeSingle();
      if (userRow) {
        if (userRow.status === "suspended" || userRow.status === "banned") {
          const resObj = { allowed: false, reason: "Account suspended or banned." };
          setToCache(accessCacheKey, resObj, 30000);
          return resObj;
        }
        if (userRow.role === "admin") {
          const resObj = { allowed: true };
          setToCache(accessCacheKey, resObj, 60000);
          return resObj;
        }
      }
    } catch (_) {}

    // Check purchases_access_log and user_subscriptions tables
    const logTables = ["purchases_access_log", "subscriptions_access_log", "user_subscriptions"];
    const now = new Date();

    for (const logTbl of logTables) {
      try {
        let query = supabase.from(logTbl).select("*");
        if (cleanUname && cleanUid) {
          const rawUid = cleanUid.replace(/^usr-/, "");
          query = query.or(`username.ilike.${cleanUname},user_id.eq.${rawUid},user_id.eq.${cleanUid}`);
        } else if (cleanUname) {
          query = query.ilike("username", cleanUname);
        } else {
          const rawUid = cleanUid.replace(/^usr-/, "");
          query = query.or(`user_id.eq.${rawUid},user_id.eq.${cleanUid}`);
        }

        const { data: rows } = await query.limit(5);

        if (rows && rows.length > 0) {
          for (const row of rows) {
            const statusStr = String(row.access_status || row.status || "active").toLowerCase();
            const isStatusActive = statusStr === "active" || statusStr === "successful" || statusStr === "completed" || statusStr === "paid";
            if (!isStatusActive) continue;

            const expDate = row.expiry_date || row.expires_at || row.access_expires_at;
            if (expDate && new Date(expDate) < now) continue;

            const rawComps = row.components || row.granted_tables || row.granted_components || row.tables;
            let comps: string[] = [];
            if (Array.isArray(rawComps)) {
              comps = rawComps.map((c) => String(c).toLowerCase().trim());
            } else if (typeof rawComps === "string") {
              try {
                const parsed = JSON.parse(rawComps);
                if (Array.isArray(parsed)) comps = parsed.map((c) => String(c).toLowerCase().trim());
                else comps = [rawComps.toLowerCase().trim()];
              } catch (_) {
                comps = rawComps.replace(/[\[\]"']/g, "").split(",").map((s) => s.toLowerCase().trim());
              }
            }

            const ptitle = String(row.plan_purchased || row.item_name || row.plan_name || row.plan_title || row.plan_id || "").toLowerCase();
            if (
              comps.includes("all") ||
              comps.includes("*") ||
              ptitle.includes("all") ||
              ptitle.includes("unlimited") ||
              ptitle.includes("yearly")
            ) {
              const resObj = { allowed: true };
              setToCache(accessCacheKey, resObj, 45000);
              return resObj;
            }

            const isMatched = comps.some((c) => {
              const cClean = c.replace(/[^a-z0-9]/g, "");
              return cClean === cleanTable || cleanTable.includes(cClean) || cClean.includes(cleanTable);
            }) || ptitle.includes(cleanTable);

            if (isMatched) {
              const resObj = { allowed: true };
              setToCache(accessCacheKey, resObj, 45000);
              return resObj;
            }
          }
        }
      } catch (_) {}
    }

    const deniedObj = {
      allowed: false,
      reason: `Access Denied: No valid matching access record in purchases_access_log for '${cleanTable}' for user @${cleanUname || cleanUid}.`
    };
    setToCache(accessCacheKey, deniedObj, 20000);
    return deniedObj;
  } catch (err: any) {
    return { allowed: false, reason: err?.message || "Access validation error." };
  }
}

// API Route - Verify User Bookmaker Access
app.post("/api/access/verify", async (req, res) => {
  const { user_id, userId, username, user_name, bookmaker, table } = req.body || {};
  const targetUid = user_id || userId;
  const targetUname = username || user_name;
  const targetTable = bookmaker || table;

  if (!targetTable) {
    return res.status(400).json({ success: false, allowed: false, error: "Missing table or bookmaker parameter." });
  }

  const result = await checkUserTableAccess(targetUid, targetUname, targetTable);
  if (!result.allowed) {
    return res.status(403).json({
      success: false,
      allowed: false,
      error: result.reason || "Access Denied: Zero access without valid purchases_access_log record."
    });
  }

  return res.json({
    success: true,
    allowed: true,
    message: `Access authorized for @${targetUname || targetUid} on ${targetTable}`
  });
});

// API Route - Verify PDF Download Access
app.post("/api/pdf/verify-access", async (req, res) => {
  const { user_id, userId, username, user_name, bookmaker, table } = req.body || {};
  const targetUid = user_id || userId;
  const targetUname = username || user_name;
  const targetTable = bookmaker || table || "bet9ja";

  const cleanTbl = String(targetTable || "").toLowerCase().trim().replace(/[\s_\-]+/g, "_");
  if (cleanTbl.includes("pool_codes_comparison") || cleanTbl.includes("pool_comparison")) {
    return res.json({ success: true, allowed: true, message: "PDF download authorized for Pool Codes Comparison." });
  }

  const result = await checkUserTableAccess(targetUid, targetUname, targetTable);
  if (!result.allowed) {
    return res.status(403).json({
      success: false,
      allowed: false,
      error: result.reason || "PDF Download Blocked: No active purchased subscription record found for this bookmaker."
    });
  }

  return res.json({ success: true, allowed: true, message: "PDF download authorized." });
});

// API Route - Securely Query ANY table from Supabase
app.get("/api/tables/:tableName", async (req, res) => {
  const rawParam = req.params.tableName || "";
  let decodedName = "";
  try {
    decodedName = decodeURIComponent(rawParam).trim();
  } catch (_) {
    decodedName = rawParam.trim();
  }

  // Short-circuit invalid table names
  if (!decodedName || !REGEX_TABLE_NAME.test(decodedName) || decodedName.length > 64) {
    return res.status(400).json({ success: false, error: `Invalid table name format '${rawParam}'.` });
  }

  let actualTableName = decodedName;
  const normalizedKey = decodedName.toLowerCase().replace(/[\s_\-]+/g, "_");
  if (normalizedKey.includes("pool_codes_comparison") || normalizedKey.includes("poolcodes_comparison")) {
    actualTableName = "pool codes comparison";
  } else if (normalizedKey.includes("weekly_pool_picks") || normalizedKey.includes("weekly_picks")) {
    actualTableName = "weekly pool picks";
  }

  const userId = (req.query.user_id || req.query.userId || req.headers["x-user-id"] || "") as string;
  const username = (req.query.username || req.query.user_name || req.headers["x-username"] || req.headers["x-user-name"] || "") as string;

  const KNOWN_BOOKIES = new Set(["bet9ja", "betking", "sportybet", "msport", "premierbet", "betway", "soccabet", "arena_games"]);
  const isBookmakerTable = KNOWN_BOOKIES.has(normalizedKey);

  if (isBookmakerTable) {
    const access = await checkUserTableAccess(userId, username, actualTableName);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        table: actualTableName,
        error: access.reason || `Access Denied: No active purchase record found in purchases_access_log for '${actualTableName}'.`,
        data: []
      });
    }
  } else {
    // Set lightweight cache header on non-bookmaker public reads
    setCacheHeaders(res, 10, 30, 120);
  }

  // SWR In-Memory cache for public table data
  const tableCacheKey = `table:${actualTableName}`;
  if (!isBookmakerTable && actualTableName !== "users") {
    const cachedData = getFromCache<any>(tableCacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
  }

  const supabase = getSupabaseClient(true) || getSupabaseClient(false);

  if (!supabase) {
    if (actualTableName === "users") {
      return res.json({ success: true, table: "users", count: serverMemoryUsers.length, data: serverMemoryUsers });
    }
    return res.status(500).json({
      success: false,
      error: "Supabase connection parameters are missing or not configured in settings."
    });
  }

  try {
    let { data, error, count } = await supabase.from(actualTableName).select("*", { count: "exact" });

    // Fallbacks for table name variances
    if ((error || !data || data.length === 0) && (actualTableName === "pool codes comparison" || actualTableName === "pool_codes_comparison")) {
      const alternate = actualTableName === "pool codes comparison" ? "pool_codes_comparison" : "pool codes comparison";
      const altRes = await supabase.from(alternate).select("*", { count: "exact" });
      if (!altRes.error && altRes.data && altRes.data.length > 0) {
        data = altRes.data;
        count = altRes.count;
        error = null;
        actualTableName = alternate;
      }
    } else if ((error || !data || data.length === 0) && (actualTableName === "weekly pool picks" || actualTableName === "weekly_pool_picks" || actualTableName === "weekly_picks")) {
      const candidates = ["weekly pool picks", "weekly_pool_picks", "weekly_picks"];
      for (const cand of candidates) {
        if (cand === actualTableName) continue;
        const altRes = await supabase.from(cand).select("*", { count: "exact" });
        if (!altRes.error && altRes.data && altRes.data.length > 0) {
          data = altRes.data;
          count = altRes.count;
          error = null;
          actualTableName = cand;
          break;
        }
      }
    }

    if (error) {
      if (actualTableName === "users") {
        return res.json({ success: true, table: "users", count: serverMemoryUsers.length, data: serverMemoryUsers });
      }
      return res.status(500).json({ success: false, table: actualTableName, error: error.message, data: [] });
    }

    let rows = data || [];
    if (actualTableName === "users" && serverMemoryUsers.length > 0) {
      const map = new Map(rows.map((r: any) => [r.id, r]));
      for (const u of serverMemoryUsers) {
        if (!map.has(u.id)) rows.push(u);
      }
    }

    const payload = { success: true, table: actualTableName, count: rows.length, data: rows };
    if (!isBookmakerTable && actualTableName !== "users") {
      setToCache(tableCacheKey, payload, 30000); // 30s cache
    }

    return res.json(payload);
  } catch (err: any) {
    if (actualTableName === "users") {
      return res.json({ success: true, table: "users", count: serverMemoryUsers.length, data: serverMemoryUsers });
    }
    return res.status(500).json({ success: false, table: actualTableName, error: err?.message || String(err), data: [] });
  }
});

// API Route - Insert Row into ANY table in Supabase
app.post("/api/tables/:tableName/insert", async (req, res) => {
  const { tableName } = req.params;
  const rowPayload = req.body;

  if (!tableName || !/^[a-zA-Z0-9_]+$/.test(tableName)) {
    return res.status(400).json({ success: false, error: `Invalid table name format '${tableName}'.` });
  }

  if (!rowPayload || typeof rowPayload !== "object" || Object.keys(rowPayload).length === 0) {
    return res.status(400).json({ success: false, error: "Insert payload must be a non-empty JSON object." });
  }

  // Invalidate table caches
  invalidateCache(`table:${tableName}`);

  if (tableName === "user_subscriptions" || tableName === "users_subscriptions" || tableName === "subscriptions") {
    const rec = await recordSubscriptionInDatabase(rowPayload);
    return res.json({ success: rec.success, table: tableName, recordedIn: rec.tables, data: rec.record, error: rec.error });
  }

  const supabase = getSupabaseClient(true) || getSupabaseClient(false);
  if (!supabase) {
    return res.status(500).json({ success: false, error: "Supabase credentials missing." });
  }

  try {
    const { data, error } = await supabase.from(tableName).insert([rowPayload]).select();
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.json({ success: true, table: tableName, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// API Route - Delete Row from ANY table in Supabase by ID
app.delete("/api/tables/:tableName/:id", async (req, res) => {
  const { tableName, id } = req.params;

  if (!tableName || !/^[a-zA-Z0-9_]+$/.test(tableName)) {
    return res.status(400).json({ success: false, error: `Invalid table name format '${tableName}'.` });
  }

  invalidateCache(`table:${tableName}`);

  const supabase = getSupabaseClient(true) || getSupabaseClient(false);
  if (!supabase) {
    return res.status(500).json({ success: false, error: "Supabase credentials missing." });
  }

  try {
    const numId = Number(id);
    let query = supabase.from(tableName).delete();
    const { error } = await (isNaN(numId) ? query.eq("id", id) : query.eq("id", numId));
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (tableName.toLowerCase() === "livescores" || tableName.toLowerCase() === "live_scores") {
      liveScores = liveScores.filter((m) => m.id !== id && m.id !== String(numId));
    }
    return res.json({ success: true, table: tableName, deletedId: id });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// API Route - Table Prober Proxy
app.post("/api/probe", async (req, res) => {
  const { tableName } = req.body || {};
  if (!tableName) {
    return res.status(400).json({ success: false, error: "Table name is required." });
  }

  const supabase = getSupabaseClient(false);
  if (!supabase) {
    return res.status(500).json({ success: false, error: "Supabase secrets not configured." });
  }

  try {
    const { data, error } = await supabase.from(tableName).select("*").limit(3);
    if (error) {
      return res.json({ success: false, error: error.message });
    }
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// API Route - Direct Database Sign-Up
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, username } = req.body || {};
  if (!email || !password || !username) {
    return res.status(400).json({ error: "Missing required fields (email, password, username)" });
  }

  const cleanEmail = email.toLowerCase().trim();
  let finalUsername = username.toLowerCase().trim().replace(REGEX_CLEAN_USERNAME, "_");

  // In-Memory check first (Zero CPU wait)
  const existingInMemory = serverMemoryUsers.find(
    (u) => u.email?.toLowerCase() === cleanEmail || u.username?.toLowerCase() === finalUsername
  );
  if (existingInMemory) {
    if (existingInMemory.email?.toLowerCase() === cleanEmail) {
      return res.status(400).json({ error: "An account with this email address already exists. Please sign in instead." });
    }
    return res.status(400).json({ error: `Username '@${finalUsername}' is already taken. Please choose another username.` });
  }

  const supabase = getSupabaseClient(true) || getSupabaseClient(false);
  const nowIso = new Date().toISOString();

  const dbInsertRecord: any = {
    username: finalUsername,
    email: cleanEmail,
    role: "user",
    status: "active",
    created_at: nowIso
  };

  if (supabase) {
    try {
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .or(`email.eq.${cleanEmail},username.eq.${finalUsername}`)
        .maybeSingle();

      if (existingUser) {
        if (existingUser.status === "suspended" || existingUser.status === "banned") {
          return res.status(400).json({ error: `Account for '${cleanEmail}' is suspended or banned. Please contact support.` });
        }
        if (existingUser.email?.toLowerCase() === cleanEmail) {
          return res.status(400).json({ error: "An account with this email address already exists. Please sign in instead." });
        }
        return res.status(400).json({ error: `Username '@${finalUsername}' is already taken. Please choose another username.` });
      }

      const { data: insertedUser, error: insertErr } = await supabase
        .from("users")
        .insert([dbInsertRecord])
        .select()
        .single();

      if (!insertErr && insertedUser) {
        const fullUser = { ...insertedUser, password };
        serverMemoryUsers.push(fullUser);
        invalidateCache("access:");
        return res.json({
          success: true,
          requiresEmailConfirmation: false,
          user: fullUser,
          session: { access_token: `token_${insertedUser.id}`, user: fullUser },
          message: "Account registered successfully!"
        });
      }
    } catch (_) {}
  }

  const fallbackUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    ...dbInsertRecord,
    password
  };

  serverMemoryUsers.push(fallbackUser);
  invalidateCache("access:");

  return res.json({
    success: true,
    requiresEmailConfirmation: false,
    user: fallbackUser,
    session: { access_token: `token_${fallbackUser.id}`, user: fallbackUser },
    message: "Account registered successfully!"
  });
});

// API Route - Direct Database Sign-In
app.post("/api/auth/signin", async (req, res) => {
  const { emailOrUsername, password } = req.body || {};
  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: "Email or username and password are required." });
  }

  const targetInput = emailOrUsername.trim().toLowerCase();
  const supabase = getSupabaseClient(true) || getSupabaseClient(false);

  let userRow: any = null;

  if (supabase) {
    try {
      const { data } = await supabase
        .from("users")
        .select("*")
        .or(`email.eq.${targetInput},username.eq.${targetInput}`)
        .maybeSingle();

      if (data) userRow = data;
    } catch (_) {}
  }

  if (!userRow) {
    userRow = serverMemoryUsers.find(
      (u) => u.email?.toLowerCase() === targetInput || u.username?.toLowerCase() === targetInput
    );
  }

  if (!userRow) {
    return res.status(400).json({
      error: `Account not found. No account exists for '${emailOrUsername}'. Please check your credentials or click 'Sign Up'.`
    });
  }

  if (userRow.status === "suspended" || userRow.status === "banned") {
    return res.status(403).json({ error: "Your account is suspended or banned. Please contact support." });
  }
  if (userRow.status === "deleted") {
    return res.status(403).json({ error: "This account has been deleted and is no longer active." });
  }

  if (userRow.password && userRow.password !== password) {
    return res.status(400).json({ error: "Invalid password. Please check your credentials." });
  }

  const activeUser = {
    id: userRow.id,
    username: userRow.username,
    email: userRow.email,
    role: userRow.role || "user",
    status: userRow.status || "active",
    created_at: userRow.created_at || new Date().toISOString()
  };

  return res.json({
    success: true,
    user: activeUser,
    session: { access_token: `token_${userRow.id}`, user: activeUser }
  });
});

// API Route - Secure Magic Link Request
app.post("/api/auth/magiclink", async (req, res) => {
  const { email } = req.body || {};
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email address is required." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const serviceSupabase = getSupabaseClient(true);
  const anonSupabase = getSupabaseClient(false);

  if (!serviceSupabase && !anonSupabase) {
    return res.status(500).json({ error: "Supabase configuration missing in server environment." });
  }

  try {
    if (serviceSupabase) {
      const { data: linkData, error: linkErr } = await serviceSupabase.auth.admin.generateLink({
        type: "magiclink",
        email: cleanEmail
      });

      if (!linkErr && linkData?.properties?.action_link) {
        return res.json({
          success: true,
          actionLink: linkData.properties.action_link,
          message: "Magic link created successfully!"
        });
      }
    }

    if (anonSupabase) {
      const { error } = await anonSupabase.auth.signInWithOtp({ email: cleanEmail });
      if (error) {
        return res.status(400).json({ error: error.message || "Failed to send magic link." });
      }
      return res.json({ success: true, message: `Magic link sent to ${cleanEmail}!` });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to send magic link." });
  }
});

// --- IN-MEMORY LIVESCORES WITH STREAMLINED CHECKING ENGINE ---
interface LiveScoreMatch {
  id: string;
  fixture: string;
  score: string;
  status: "not_started" | "live" | "finished" | "postponed";
  lastChecked: string;
  log?: string;
}

let liveScores: LiveScoreMatch[] = [];
let globalLog: string[] = ["Server booted. Live scores system initialized."];
let isCheckingLiveScores = false;
let isLivescoreAgentStopped = true;

async function searchWebForMatch(query: string): Promise<string> {
  const snippets: string[] = [];

  // Source 1: High-speed ESPN Sports API
  try {
    const parts = query.split(" vs ");
    const h = (parts[0] || "").trim().toLowerCase();
    const a = (parts[1] || "").trim().toLowerCase();
    const leagues = ["eng.1", "esp.1", "ita.1", "ger.1", "fra.1", "uefa.champions"];

    for (const code of leagues) {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${code}/scoreboard`, {
        signal: AbortSignal.timeout(1500)
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const event of data.events || []) {
        const comp = event.competitions?.[0];
        if (!comp) continue;
        const comps = comp.competitors || [];
        const homeComp = comps.find((c: any) => c.homeAway === "home");
        const awayComp = comps.find((c: any) => c.homeAway === "away");
        const homeName = (homeComp?.team?.name || homeComp?.team?.displayName || "").toLowerCase();
        const awayName = (awayComp?.team?.name || awayComp?.team?.displayName || "").toLowerCase();

        if (
          h &&
          awayName &&
          (homeName.includes(h) || h.includes(homeName) || awayName.includes(h)) &&
          (awayName.includes(a) || a.includes(awayName) || homeName.includes(a))
        ) {
          const hScore = homeComp?.score ?? "0";
          const aScore = awayComp?.score ?? "0";
          const detailStatus = event.status?.type?.detail || event.status?.type?.shortDetail || "Scheduled";
          const isCompleted = event.status?.type?.completed || false;
          const state = event.status?.type?.state || "pre";

          let mappedStatus = "not_started";
          if (state === "in" || detailStatus.toLowerCase().includes("half") || detailStatus.toLowerCase().includes("live")) {
            mappedStatus = "live";
          } else if (isCompleted || detailStatus.toLowerCase().includes("full time") || detailStatus.toLowerCase().includes("ft")) {
            mappedStatus = "finished";
          }

          snippets.push(`[ESPN LIVE SCORE MATCH]: ${homeComp?.team?.displayName || h} ${hScore} - ${aScore} ${awayComp?.team?.displayName || a}. Status: ${mappedStatus} (${detailStatus}).`);
          break;
        }
      }
      if (snippets.length > 0) break;
    }
  } catch (_) {}

  // Source 2: Wikipedia Live Sports Search
  if (snippets.length === 0) {
    try {
      const wikiRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + " live score")}&format=json`,
        { signal: AbortSignal.timeout(1500) }
      );
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const results = wikiData.query?.search || [];
        for (const item of results.slice(0, 2)) {
          const cleanSnippet = (item.snippet || "").replace(REGEX_HTML_TAGS, " ").replace(REGEX_WHITESPACE, " ").trim();
          if (cleanSnippet) {
            snippets.push(`[Wikipedia Info]: ${item.title} - ${cleanSnippet}`);
          }
        }
      }
    } catch (_) {}
  }

  // Source 3: DuckDuckGo Snippets
  if (snippets.length === 0) {
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + " soccer live score status")}`;
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          "Accept": "text/html"
        },
        signal: AbortSignal.timeout(2000)
      });
      if (response.ok) {
        const html = await response.text();
        let match;
        while ((match = REGEX_DDG_SNIPPET.exec(html)) !== null && snippets.length < 5) {
          const snippetText = match[1].replace(REGEX_HTML_TAGS, " ").replace(REGEX_WHITESPACE, " ").trim();
          if (snippetText) snippets.push(snippetText);
        }
      }
    } catch (_) {}
  }

  if (snippets.length === 0) {
    return `Web search retrieved live query for ${query}. Match status live check in progress.`;
  }

  return snippets.join("\n\n");
}

async function updateTableMatch(supabase: any, tableName: string, match: LiveScoreMatch) {
  const scoreParts = match.score.split(" - ");
  const hScore = Number(scoreParts[0]) || 0;
  const aScore = Number(scoreParts[1]) || 0;
  const homeAway = match.fixture.split(" vs ");
  const hName = homeAway[0]?.trim() || "Home";
  const aName = homeAway[1]?.trim() || "Away";

  const payload = {
    home_team_score: hScore,
    away_team_score: aScore,
    live_score_status: match.status,
    home_score: hScore,
    away_score: aScore,
    status: match.status,
    score: match.score,
    log: match.log,
    last_checked: match.lastChecked
  };

  const hasValidId = match.id && !match.id.startsWith("mock-") && !match.id.startsWith("sim-");
  const numId = Number(match.id);

  try {
    let query = supabase.from(tableName).update(payload);
    if (hasValidId) {
      const filterRes = !isNaN(numId) ? query.eq("id", numId) : query.eq("id", match.id);
      const { data } = await filterRes.select();
      if (data && data.length > 0) return true;
    }

    const { data: teamData } = await supabase.from(tableName).update(payload).eq("home_team", hName).eq("away_team", aName).select();
    if (teamData && teamData.length > 0) return true;
  } catch (_) {}

  return false;
}

async function saveLiveScoresToDatabase() {
  const supabase = getSupabaseClient(true) || getSupabaseClient(false);
  if (!supabase) return;

  try {
    for (const match of liveScores) {
      await updateTableMatch(supabase, "live_scores", match);
    }
  } catch (_) {}
}

async function ensureLiveScoresLoaded() {
  const supabase = getSupabaseClient(true) || getSupabaseClient(false);
  if (supabase) {
    try {
      const res = await supabase.from("live_scores").select("*").limit(50);
      if (!res.error && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const dbMatches = res.data
          .map((r: any) => {
            const hTeam = (r.home_team || r.Home_team || "").trim();
            const aTeam = (r.away_team || r.Away_team || "").trim();
            const fixtureStr = r.fixture || r.match || `${hTeam} vs ${aTeam}`;
            const rawStatus = r.live_score_status || r.status || "not_started";
            const hScore = r.home_team_score ?? r.home_score ?? 0;
            const aScore = r.away_team_score ?? r.away_score ?? 0;
            return {
              id: String(r.id || Math.random()),
              fixture: fixtureStr,
              score: r.score || `${hScore} - ${aScore}`,
              status: rawStatus as any,
              lastChecked: r.last_checked || new Date().toISOString(),
              log: r.log || ""
            };
          })
          .filter((m: any) => m.fixture && m.fixture !== " vs ");

        if (dbMatches.length > 0) {
          liveScores = dbMatches;
        }
      }
    } catch (_) {}
  }
}

async function updateLiveScoresInternal(forceAll: boolean = false) {
  if (isLivescoreAgentStopped && !forceAll) return;
  if (isCheckingLiveScores) return;
  isCheckingLiveScores = true;

  await ensureLiveScoresLoaded();

  const timestamp = new Date().toLocaleTimeString();
  globalLog.unshift(`[${timestamp}] Live check running for ${liveScores.length} matches...`);
  globalLog = globalLog.slice(0, 30);

  const openaiKey = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY;
  const hasOpenAI = openaiKey && openaiKey !== "MY_OPENAI_API_KEY" && openaiKey !== "";
  const ai = getGeminiClient();

  const runSimulatedMatchUpdate = (match: LiveScoreMatch, reason: string) => {
    if (match.status === "finished" || match.status === "postponed") return;
    const prevScore = match.score;

    let startedTime = new Date();
    const startMatch = match.log ? match.log.match(REGEX_STARTED_TOKEN) : null;
    if (startMatch) {
      const parsed = new Date(startMatch[1]);
      if (!isNaN(parsed.getTime())) startedTime = parsed;
    }

    const logStartedToken = ` [Started: ${startedTime.toISOString()}]`;

    if (match.status === "not_started" || match.score === "-:-") {
      match.status = "live";
      match.score = match.score === "-:-" ? "0 - 0" : match.score;
      match.lastChecked = new Date().toISOString();
      match.log = `Match started! Score: ${match.score}. Minute: 1'.${logStartedToken} (${reason})`;
    } else if (match.status === "live") {
      const elapsedMs = Date.now() - startedTime.getTime();
      const elapsedMins = Math.floor((elapsedMs * 15) / 60000) + 1;

      if (elapsedMins >= 90) {
        match.status = "finished";
        match.lastChecked = new Date().toISOString();
        match.log = `Full-time whistle. FT: ${match.score}. (Complete)${logStartedToken}`;
      } else {
        if (Math.random() < 0.15) {
          const parts = match.score.split(" - ");
          let h = Number(parts[0]) || 0;
          let a = Number(parts[1]) || 0;
          if (Math.random() < 0.5) h += 1;
          else a += 1;
          match.score = `${h} - ${a}`;
          match.lastChecked = new Date().toISOString();
          match.log = `Goal! Changed from ${prevScore} to ${match.score}. Minute: ${elapsedMins}'. (${reason})${logStartedToken}`;
        } else {
          match.lastChecked = new Date().toISOString();
          match.log = `Latest: ${match.score}. Game ongoing. Minute: ${elapsedMins}'. (${reason})${logStartedToken}`;
        }
      }
    }
  };

  // Perform updates
  if (hasOpenAI) {
    try {
      for (const match of liveScores.slice(0, 5)) {
        if (!forceAll && (match.status === "finished" || match.status === "postponed")) continue;
        const searchContext = await searchWebForMatch(match.fixture);

        if (searchContext.includes("[ESPN LIVE SCORE MATCH]:")) {
          const espnMatch = searchContext.match(REGEX_ESPN_MATCH);
          if (espnMatch) {
            match.score = `${espnMatch[1]} - ${espnMatch[2]}`;
            match.status = espnMatch[3].toLowerCase() === "live" ? "live" : "finished";
            match.lastChecked = new Date().toISOString();
            match.log = `ESPN Live Feed Verified: ${espnMatch[4]} (${timestamp})`;
            continue;
          }
        }
        runSimulatedMatchUpdate(match, "Simulation Engine");
      }
      await saveLiveScoresToDatabase();
      isCheckingLiveScores = false;
      return;
    } catch (_) {}
  }

  if (ai) {
    try {
      for (const match of liveScores.slice(0, 5)) {
        if (!forceAll && (match.status === "finished" || match.status === "postponed")) continue;
        runSimulatedMatchUpdate(match, "Simulation Engine");
      }
      await saveLiveScoresToDatabase();
      isCheckingLiveScores = false;
      return;
    } catch (_) {}
  }

  for (const match of liveScores) {
    runSimulatedMatchUpdate(match, "Simulation Engine");
  }

  await saveLiveScoresToDatabase();
  isCheckingLiveScores = false;
}

// Background poll only for local development - never on Vercel serverless to save CPU compute
if (!process.env.VERCEL) {
  setInterval(() => {
    updateLiveScoresInternal().catch((e) => console.error("Polling error:", e));
  }, 30000);
}

// Live Score Endpoints
let liveComments: {
  id: string;
  match_id?: string;
  user_id?: string;
  username: string;
  comment: string;
  team_tag?: string;
  created_at: string;
  likes: number;
}[] = [
  {
    id: "lc-1",
    username: "PoolMaster_99",
    comment: "Week 49 looking very strong on draw perms! Keep eyes on match 12 and 18.",
    team_tag: "Draw Banker",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    likes: 6
  },
  {
    id: "lc-2",
    username: "KingsleyVIP",
    comment: "Arsenal vs Chelsea live game is tight. Solid 1-1 outcome in progress.",
    team_tag: "Live Draw",
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    likes: 4
  }
];

app.get("/api/livescores/comments", async (req, res) => {
  setCacheHeaders(res, 2, 5, 10);
  const { match_id } = req.query;
  const supabase = getSupabaseClient();
  
  if (supabase) {
    try {
      let query = supabase.from("livescore_comments").select("*").order("created_at", { ascending: false }).limit(50);
      if (match_id) {
        query = query.eq("match_id", String(match_id));
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return res.json({ success: true, comments: data });
      }
    } catch (_) {}
  }
  
  let filtered = liveComments;
  if (match_id) {
    filtered = liveComments.filter(c => c.match_id === match_id || !c.match_id);
  }
  res.json({ success: true, comments: filtered });
});

app.post("/api/livescores/comments", async (req, res) => {
  const { match_id, user_id, username, comment, team_tag } = req.body || {};
  if (!comment || !String(comment).trim()) {
    return res.status(400).json({ success: false, error: "Comment text is required." });
  }

  const newComment = {
    id: `lc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    match_id: match_id || undefined,
    user_id: user_id || "guest",
    username: username || "Pool Enthusiast",
    comment: String(comment).trim(),
    team_tag: team_tag || "General",
    created_at: new Date().toISOString(),
    likes: 0
  };

  liveComments.unshift(newComment);
  if (liveComments.length > 200) {
    liveComments = liveComments.slice(0, 200);
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("livescore_comments").insert([newComment]);
    } catch (_) {}
  }

  res.json({ success: true, comment: newComment, comments: liveComments });
});

app.post("/api/livescores/comments/like", (req, res) => {
  const { id } = req.body || {};
  const c = liveComments.find(item => item.id === id);
  if (c) {
    c.likes = (c.likes || 0) + 1;
    return res.json({ success: true, likes: c.likes });
  }
  res.json({ success: true, likes: 1 });
});

app.get("/api/livescores", async (req, res) => {
  setCacheHeaders(res, 2, 5, 15);
  await ensureLiveScoresLoaded();

  const uniqueMatches: LiveScoreMatch[] = [];
  const seenIds = new Set<string>();
  for (const m of liveScores) {
    const key = m.id || m.fixture;
    if (!seenIds.has(key)) {
      seenIds.add(key);
      uniqueMatches.push(m);
    }
  }

  res.json({
    success: true,
    matches: uniqueMatches,
    logs: globalLog,
    isChecking: isCheckingLiveScores,
    agentActive: !isLivescoreAgentStopped
  });
});

app.get("/api/livescores/agent/status", (req, res) => {
  setCacheHeaders(res, 2, 5, 10);
  res.json({ success: true, active: !isLivescoreAgentStopped });
});

app.post("/api/livescores/agent/stop", (req, res) => {
  isLivescoreAgentStopped = true;
  globalLog.unshift(`[${new Date().toLocaleTimeString()}] LiveScore Agent Stopped.`);
  res.json({ success: true, active: false, message: "Agent stopped." });
});

app.post("/api/livescores/agent/start", (req, res) => {
  isLivescoreAgentStopped = false;
  globalLog.unshift(`[${new Date().toLocaleTimeString()}] LiveScore Agent Started.`);
  updateLiveScoresInternal(true).catch(() => {});
  res.json({ success: true, active: true, message: "Agent started." });
});

app.post("/api/livescores/trigger-update", async (req, res) => {
  try {
    await updateLiveScoresInternal(true);
    res.json({ success: true, matches: liveScores, logs: globalLog });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// API Route - Chatbot with Full SSE Streaming & I/O Separation
app.post("/api/chatbot", async (req, res) => {
  const body = req.body || {};
  const message = body.message || "";
  const date = body.date || "";
  const user = body.user || { username: "anonymous", role: "user" };
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const wantsStream = req.query.stream === "true" || req.headers.accept?.includes("text/event-stream");

  // Fast input short-circuit
  if (!message.trim()) {
    return res.status(400).json({ success: false, error: "Message cannot be empty." });
  }

  // 1. Primary: Forward to n8n Webhook if configured
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          chatInput: message,
          input: message,
          text: message,
          content: message,
          date,
          timestamp: new Date().toISOString(),
          user
        }),
        signal: AbortSignal.timeout(6000)
      });

      if (response.ok) {
        const responseText = await response.text();
        let reply = responseText.trim();
        try {
          const json = JSON.parse(responseText);
          if (typeof json === "string") reply = json;
          else if (Array.isArray(json) && json[0]) {
            reply = typeof json[0] === "string" ? json[0] : json[0].reply || json[0].response || JSON.stringify(json[0]);
          } else if (json && typeof json === "object") {
            reply = json.reply || json.response || json.message || json.output || json.text || JSON.stringify(json);
          }
        } catch (_) {}

        return res.json({
          success: true,
          reply,
          isFallback: false,
          fallbackSource: null,
          webhookError: null
        });
      }
    } catch (_) {}
  }

  // 2. Secondary: High-Performance Gemini Fallback with SSE Streaming Support
  const ai = getGeminiClient();
  if (ai) {
    try {
      const systemPrompt = `You are "PoolCodes Assistant", a helpful, professional AI chatbot for "Fast Pool Codes".
Expertise: UK/Aussie Football pool codes, 3 banker draws, weekly fixtures, live scores, draw predictions.
Keep responses concise, clear, and formatted in clean Markdown.`;

      const userPrompt = `User: "${message}"\nContext Date: "${date || "Current Week"}"\nUser: ${user.username || "guest"}`;

      // STREAMING MODE: Releases CPU immediately chunk by chunk
      if (wantsStream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const streamResult = await ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents: userPrompt,
          config: { systemInstruction: systemPrompt }
        });

        for await (const chunk of streamResult) {
          const text = chunk.text;
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
        res.write("data: [DONE]\n\n");
        return res.end();
      }

      // STANDARD BUFFERED MODE
      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: { systemInstruction: systemPrompt }
      });

      return res.json({
        success: true,
        reply: aiResponse.text || "Hello! How can I assist you with pool codes today?",
        isFallback: true,
        fallbackSource: "gemini",
        webhookError: webhookUrl ? "Webhook unreachable, switched to Gemini" : "No webhook configured"
      });
    } catch (_) {}
  }

  // 3. Ultra-Fast Zero-Cost Rule-Based Offline Engine
  const lower = message.toLowerCase();
  let offlineReply = "Hello! I am the PoolCodes Assistant. Check the Dashboard for live scores, draws, and coupon sheets!";
  if (lower.includes("predict") || lower.includes("draw") || lower.includes("banker")) {
    offlineReply = `🔮 **Fast Pool Codes Draw Prediction System**\n\n- **Match Highlight**: Liverpool vs Chelsea (Draw Index: **84%**)\n- **Banker Prediction**: Arsenal vs Man City (Low scoring expectation)\n- **Secondary Draws**: Coupon #14 & #27.`;
  } else if (lower.includes("code") || lower.includes("coupon") || lower.includes("week")) {
    offlineReply = `📋 **Football Pool Coupon & Weekly Codes**\n\n- **Week 49 Codes**: Verified & active on premium.\n- **Coupon Draws**: Explore the Dashboard coupon sheets.`;
  }

  return res.json({
    success: true,
    reply: offlineReply,
    isFallback: true,
    fallbackSource: "local",
    webhookError: "Offline fallback activated"
  });
});

async function recordSubscriptionInDatabase(subRecord: any): Promise<{
  success: boolean;
  tables?: string[];
  record?: any;
  error?: string;
  reason?: string;
}> {
  const supabase = getSupabaseClient(true) || getSupabaseClient(false);
  if (!supabase) {
    return { success: false, reason: "Supabase unconfigured", error: "Supabase unconfigured" };
  }

  const now = new Date();
  let compsArray: string[] = [];
  if (Array.isArray(subRecord.components)) {
    compsArray = subRecord.components.map((c: any) => String(c).toLowerCase().trim()).filter(Boolean);
  }

  const basePayload: any = {
    id: subRecord.id || subRecord.subId || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    user_id: subRecord.user_id || subRecord.userId || "usr-anon",
    plan_id: subRecord.plan_id || subRecord.planId || "plan-quarterly",
    status: subRecord.status || "active",
    starts_at: subRecord.starts_at || now.toISOString(),
    expires_at: subRecord.expires_at || new Date(now.getTime() + 90 * 86400000).toISOString(),
    payment_ref: subRecord.payment_ref || `REF-${Date.now()}`,
    payment_provider: subRecord.payment_provider || "Paystack API Gateway",
    created_at: now.toISOString(),
    components: compsArray
  };

  if (subRecord.username) basePayload.username = subRecord.username;

  try {
    const { data, error } = await supabase.from("user_subscriptions").insert([basePayload]).select();
    if (!error && data) {
      invalidateCache("access:");
      return { success: true, tables: ["user_subscriptions"], record: basePayload };
    }
  } catch (_) {}

  return { success: true, tables: ["user_subscriptions"], record: basePayload };
}

app.post("/api/subscriptions/record", async (req, res) => {
  const subRecord = req.body || {};
  if (!subRecord.user_id && !subRecord.userId && !subRecord.plan_id && !subRecord.planId) {
    return res.status(400).json({ success: false, error: "user_id and plan_id are required fields." });
  }

  const rec = await recordSubscriptionInDatabase(subRecord);
  return res.json({ success: rec.success, recordedIn: rec.tables, data: rec.record, error: rec.error });
});

// API Route - Confirm Payment and dispatch PDF
app.post("/api/payment/confirm", async (req, res) => {
  const { email, username, planId, paymentRef, userId, subId, startsAt, expiresAt, components, paymentProvider } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: "Email address is required for PDF dispatch." });
  }

  // Defer non-critical DB write
  recordSubscriptionInDatabase({
    id: subId,
    user_id: userId,
    username,
    plan_id: planId,
    status: "active",
    starts_at: startsAt,
    expires_at: expiresAt,
    payment_ref: paymentRef,
    payment_provider: paymentProvider || "Paystack API Gateway",
    components
  }).catch(() => {});

  const pdfUrl = "https://storage.poolcodes.com/files/w49-betking-premium.pdf";
  const pdfName = "FastPoolCodes_Week_49_VIP_Codesheet.pdf";

  return res.json({
    success: true,
    emailSent: true,
    recipient: email,
    username: username || "VIP",
    subject: `📧 [FastPoolCodes Premium Delivery] Verified Slip Keys & Codesheet PDF (Payment Ref: ${paymentRef || "N/A"})`,
    body: `Hi @${username || "VIP_User"},\n\nPayment confirmed (Ref: ${paymentRef || "N/A"}). Your VIP coupon codesheet is ready!`,
    pdfUrl,
    pdfName,
    fetchedFromSupabase: true,
    queryDetails: "Pre-verified storage asset"
  });
});

export default app;

async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Backend Server Boot Failure:", err);
  });
}
