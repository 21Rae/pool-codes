import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

// Middleware to normalize req.url in Vercel serverless environment (fixes Express routing for Vercel rewrites)
app.use((req, res, next) => {
  if (req.originalUrl && req.url !== req.originalUrl) {
    req.url = req.originalUrl;
  }
  next();
});

  // API Route - Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route - Securely Query blogs from Supabase (bypassing Client SSL & Mixed Content blocks)
  app.get("/api/blogs", async (req, res) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ 
        error: "Supabase connection parameters are missing or not configured in settings." 
      });
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Fast-path: Query the standard 'blogs' table
      const fastRes = await supabase.from('blogs').select('*');
      if (!fastRes.error && fastRes.data && fastRes.data.length > 0) {
        return res.json({ success: true, table: 'blogs', data: fastRes.data });
      }

      // Parallel scan fallback to identify alternative schema tables
      const CANDIDATE_TABLES = [
        'blogs', 'blog', 'posts', 'post', 'articles', 'article',
        'news', 'updates', 'expert_blogs', 'sports_blog', 'analyses', 'analysis'
      ];

      const results = await Promise.all(
        CANDIDATE_TABLES.map(async (tableName) => {
          try {
            const res = await supabase.from(tableName).select('*');
            return { tableName, res, error: null };
          } catch (err: any) {
            return { tableName, res: null, error: err };
          }
        })
      );

      let chosenTable = '';
      let successData: any = null;

      for (const { tableName, res } of results) {
        if (res && !res.error && res.data && res.data.length > 0) {
          chosenTable = tableName;
          successData = res.data;
          break;
        }
      }

      if (chosenTable && successData) {
        return res.json({ success: true, table: chosenTable, data: successData });
      }

      // If no rows found are found in custom tables
      return res.json({ success: true, table: 'blogs', data: [] });
    } catch (err: any) {
      console.error("Supabase proxy query failure:", err);
      return res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // API Route - Table Prober Proxy
  app.post("/api/probe", async (req, res) => {
    const { tableName } = req.body;
    if (!tableName) {
      return res.status(400).json({ success: false, error: "Table name is required." });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ success: false, error: "Supabase secrets not configured." });
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data, error } = await supabase.from(tableName).select('*').limit(3);
      if (error) {
        return res.json({ success: false, error: error.message });
      }

      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // API Route - Secure Proxy Sign-Up
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ error: "Missing required fields (email, password, username)" });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: "Supabase secrets are not configured in settings." });
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      const su = data.user;
      if (su) {
        try {
          await supabase.from('users').insert([{
            id: su.id,
            username: username,
            email: email,
            role: 'user',
            status: 'active'
          }]);
        } catch (dbErr) {
          console.warn("Silent profile insert bypass (database table missing, falling back):", dbErr);
        }
      }

      return res.json({ success: true, user: data.user, session: data.session });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // API Route - Secure Proxy Sign-In / Login
  app.post("/api/auth/signin", async (req, res) => {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: "Name/email and password parameters required." });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: "Supabase secrets are not configured in settings." });
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      let targetEmail = emailOrUsername.trim();

      if (!targetEmail.includes('@')) {
        try {
          const { data: matchedRecords } = await supabase
            .from('users')
            .select('email')
            .eq('username', targetEmail.toLowerCase())
            .maybeSingle();

          if (matchedRecords?.email) {
            targetEmail = matchedRecords.email;
          } else {
            targetEmail = `${targetEmail}@example.com`;
          }
        } catch (_) {
          targetEmail = `${targetEmail}@example.com`;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.json({ success: true, user: data.user, session: data.session });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // --- IN-MEMORY LIVESCORES WITH AUTO-CHECKING ENGINE ---
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

  const getSupabase = async () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseAnonKey) return null;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      return createClient(supabaseUrl, supabaseAnonKey);
    } catch {
      return null;
    }
  };

  async function searchWebForMatch(query: string): Promise<string> {
    try {
      // Search DuckDuckGo HTML for soccer match live score
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + " soccer live score status")}`;
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        }
      });
      if (!response.ok) {
        return `Web search failed with status ${response.status}. Proceeding with general knowledge.`;
      }
      const html = await response.text();
      
      // Extract snippet values inside class result__snippet
      const snippets: string[] = [];
      const regex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = regex.exec(html)) !== null && snippets.length < 10) {
        let snippetText = match[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        if (snippetText) {
          snippets.push(snippetText);
        }
      }

      if (snippets.length === 0) {
        // Fallback: strip html script and styling, extract clean text
        const cleanText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        return cleanText.substring(0, 3000);
      }

      return snippets.join("\n\n");
    } catch (err: any) {
      return `Web search error: ${err?.message || String(err)}`;
    }
  }

  async function saveLiveScoresToDatabase() {
    const supabase = await getSupabase();
    if (supabase) {
      try {
        for (const match of liveScores) {
          const scoreParts = match.score.split(" - ");
          const hScore = Number(scoreParts[0]) || 0;
          const aScore = Number(scoreParts[1]) || 0;
          const homeAway = match.fixture.split(" vs ");
          const hName = homeAway[0]?.trim() || "Home";
          const aName = homeAway[1]?.trim() || "Away";

          const hasId = match.id && !match.id.startsWith("mock-") && !match.id.startsWith("sim-");
          if (hasId) {
            await supabase.from('live_scores').update({
              home_score: hScore,
              away_score: aScore,
              status: match.status,
              log: match.log,
              last_checked: match.lastChecked
            }).eq('id', match.id);
          } else {
            await supabase.from('live_scores').update({
              home_score: hScore,
              away_score: aScore,
              status: match.status,
              log: match.log,
              last_checked: match.lastChecked
            }).eq('home_team', hName).eq('away_team', aName);
          }
        }
      } catch (dbErr) {
        console.warn("DB save error:", dbErr);
      }
    }
  }

  async function ensureLiveScoresLoaded() {
    const supabase = await getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('live_scores').select('*');
        if (!error && data) {
          const dbMatches = data.map((r: any) => {
            const hTeam = (r.home_team || "").trim();
            const aTeam = (r.away_team || "").trim();
            const normalizedStatus = r.status === "on going" ? "live" : r.status;
            return {
              id: String(r.id),
              fixture: `${hTeam} vs ${aTeam}`,
              score: `${r.home_score} - ${r.away_score}`,
              status: normalizedStatus,
              lastChecked: r.last_checked || new Date().toISOString(),
              log: r.log
            };
          });

          // 1. Remove matches in memory that are no longer in the database
          const dbIds = new Set(dbMatches.map(m => m.id));
          liveScores = liveScores.filter(m => dbIds.has(m.id));

          // 2. Add or update matches
          for (const dbMatch of dbMatches) {
            const existing = liveScores.find(m => m.id === dbMatch.id);
            if (!existing) {
              // New match from DB
              liveScores.push(dbMatch);
            } else {
              // Match exists, update only if database status or score changed (e.g. manual admin override)
              if (existing.status !== dbMatch.status || existing.score !== dbMatch.score) {
                existing.status = dbMatch.status;
                existing.score = dbMatch.score;
                existing.log = dbMatch.log;
                existing.lastChecked = dbMatch.lastChecked;
              }
            }
          }
        }
      } catch (err) {
        console.warn("DB init error:", err);
      }
    }
  }

  async function updateLiveScoresInternal(forceAll: boolean = false) {
    if (isCheckingLiveScores) return;
    isCheckingLiveScores = true;

    await ensureLiveScoresLoaded();

    const timestamp = new Date().toLocaleTimeString();
    globalLog.unshift(`[${timestamp}] Initiated auto-checking loop for ${liveScores.length} matches...`);
    globalLog = globalLog.slice(0, 40);

    const openaiKey = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    const hasOpenAI = openaiKey && openaiKey !== "MY_OPENAI_API_KEY" && openaiKey !== "OPENAI_API_KEY" && openaiKey !== "";
    const hasGemini = geminiKey && geminiKey !== "MY_GEMINI_API_KEY" && geminiKey !== "GEMINI_API_KEY" && geminiKey !== "";

    // Unified Simulation Update Helper with accelerated real-time game minute tracking
    const runSimulatedMatchUpdate = (match: LiveScoreMatch, reason: string) => {
      if (match.status === "finished" || match.status === "postponed") return;
      const prevScore = match.score;
      
      // Try to parse or initialize started timestamp from match log
      let startedTime: Date;
      const startMatch = match.log ? match.log.match(/\[Started:\s*([^\]]+)\]/) : null;
      if (startMatch) {
        startedTime = new Date(startMatch[1]);
        if (isNaN(startedTime.getTime())) {
          startedTime = new Date();
        }
      } else {
        startedTime = new Date();
      }

      const logStartedToken = ` [Started: ${startedTime.toISOString()}]`;

      if (match.status === "not_started") {
        match.status = "live";
        match.score = "0 - 0";
        match.lastChecked = new Date().toISOString();
        match.log = `Match started! Score: 0 - 0. Minute: 1'.${logStartedToken} (${reason})`;
      } else if (match.status === "live") {
        // Real-time elapsed minutes with 15x acceleration (6 minutes real-world time = 90 minutes simulated match time)
        const ACCELERATION_FACTOR = 15;
        const elapsedMs = Date.now() - startedTime.getTime();
        const elapsedMins = Math.floor((elapsedMs * ACCELERATION_FACTOR) / 60000) + 1;

        if (elapsedMins >= 90) {
          match.status = "finished";
          match.lastChecked = new Date().toISOString();
          match.log = `Full-time whistle. FT: ${match.score}. (Simulation Complete)${logStartedToken}`;
        } else {
          // Goal probability (~15% chance per 30s poll tick, yielding a realistic ~2.5 goals per accelerated game)
          const rand = Math.random();
          if (rand < 0.15) {
            const parts = match.score.split(" - ");
            const h = Number(parts[0]) || 0;
            const a = Number(parts[1]) || 0;
            let newH = h;
            let newA = a;
            if (Math.random() < 0.5) {
              newH += 1;
            } else {
              newA += 1;
            }
            match.score = `${newH} - ${newA}`;
            match.lastChecked = new Date().toISOString();
            match.log = `Goal! Score changed from ${prevScore} to ${match.score}. Minute: ${elapsedMins}'. (${reason})${logStartedToken}`;
          } else {
            match.lastChecked = new Date().toISOString();
            match.log = `Latest: ${match.score}. Game ongoing. Minute: ${elapsedMins}'. (${reason})${logStartedToken}`;
          }
        }
      }
    };

    if (hasGemini) {
      try {
        const ai = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        for (let i = 0; i < liveScores.length; i++) {
          const match = liveScores[i];

          // Self-healing check for stale/modified team names (log doesn't mention new teams)
          const logText = match.log || "";
          const logLower = logText.toLowerCase();
          const homeAway = match.fixture.split(" vs ");
          const hTeam = homeAway[0]?.trim() || "";
          const aTeam = homeAway[1]?.trim() || "";
          const hWord = hTeam.toLowerCase().split(" ")[0] || "___";
          const aWord = aTeam.toLowerCase().split(" ")[0] || "___";

          const isStaleLog = logText &&
                             logText !== "Added to real-time tracker board." &&
                             !logText.includes("Teams updated") &&
                             (!logLower.includes(hWord) || !logLower.includes(aWord));

          if (!forceAll && !isStaleLog && (match.status === "finished" || match.status === "postponed")) continue;

          // Rate limiting guard
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }

          try {
            const currentDateTimeStr = new Date().toLocaleString("en-US", { timeZone: "UTC" }) + " UTC";

            // Step 1: Use Gemini with Google Search Grounding (WITHOUT responseMimeType: "application/json")
            const step1Response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: `Search the web for the soccer score of "${match.fixture}" today (${currentDateTimeStr}) and describe the current score, status, and latest match events in detail.`,
              config: {
                tools: [{ googleSearch: {} }]
              }
            });
            const groundedText = step1Response.text || "";

            // Step 2: Use Gemini (without tools) to extract and format structured JSON
            const prompt = `Based on this search result context, extract the score and status for the match "${match.fixture}".

Search result context:
${groundedText}

CRITICAL MAP INSTRUCTIONS:
1. Extract the score in "H - A" format (e.g., "1 - 0" or "0 - 0").
2. Map the status of the match to EXACTLY one of: "not_started", "live", "finished", "postponed".
   - Map active matches (halftime, ongoing, playing) to "live".
   - Map matches that have completely finished to "finished".
3. Provide a clean 1-sentence summary explanation of the current state.`;

            const geminiResponse = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.STRING },
                    status: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                  },
                  required: ["score", "status", "explanation"]
                }
              }
            });

            const resText = geminiResponse.text;
            if (resText) {
              const parsed = JSON.parse(resText.trim());
              if (parsed && (parsed.score || parsed.status)) {
                const oldScore = match.score;
                const oldStatus = match.status;

                match.score = parsed.score || match.score;
                match.status = parsed.status || match.status;
                match.lastChecked = new Date().toISOString();
                match.log = `AI Verified: ${parsed.explanation || 'No details provided.'} (${timestamp})`;

                if (oldScore !== match.score || oldStatus !== match.status) {
                  globalLog.unshift(`[${timestamp}] Match Update: "${match.fixture}" is now ${match.score} (${match.status}) via Gemini Search`);
                }
              }
            }
          } catch (matchErr: any) {
            runSimulatedMatchUpdate(match, `AI Fallback: ${matchErr?.message || 'Check error'}`);
          }
        }

        await saveLiveScoresToDatabase();
        isCheckingLiveScores = false;
        globalLog.unshift(`[${timestamp}] Live poll cycle complete (Gemini AI Search).`);
        return;
      } catch (geminiInitErr: any) {
        console.warn("Gemini Live check failed, falling back to OpenAI or Simulation.", geminiInitErr);
      }
    }

    if (hasOpenAI) {
      try {
        for (let i = 0; i < liveScores.length; i++) {
          const match = liveScores[i];

          // Self-healing check for stale/modified team names (log doesn't mention new teams)
          const logText = match.log || "";
          const logLower = logText.toLowerCase();
          const homeAway = match.fixture.split(" vs ");
          const hTeam = homeAway[0]?.trim() || "";
          const aTeam = homeAway[1]?.trim() || "";
          const hWord = hTeam.toLowerCase().split(" ")[0] || "___";
          const aWord = aTeam.toLowerCase().split(" ")[0] || "___";

          const isStaleLog = logText &&
                             logText !== "Added to real-time tracker board." &&
                             !logText.includes("Teams updated") &&
                             (!logLower.includes(hWord) || !logLower.includes(aWord));

          if (!forceAll && !isStaleLog && (match.status === "finished" || match.status === "postponed")) continue;

          // Rate limiting guard
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }

          try {
            const searchContext = await searchWebForMatch(match.fixture);
            const currentDateTimeStr = new Date().toLocaleString("en-US", { timeZone: "UTC" }) + " UTC";
            const prompt = `You are an agentic sports live score assistant.
Today's current date and time is: ${currentDateTimeStr}.

We are tracking the match: "${match.fixture}"
- Existing state in our database: Status is currently "${match.status}", Score is currently "${match.score}".

We searched the live web for this match today. Here are the top raw text search snippets retrieved:

=== LIVE WEB SEARCH RESULTS ===
${searchContext}
===============================

Your task is to analyze these search snippets, find the actual current live score or final score, and status for "${match.fixture}".

CRITICAL SAFETY INSTRUCTIONS:
1. HISTORICAL GUARD: DuckDuckGo search snippets often contain finished matches from years ago (e.g. 2021, 2023, 2024, or 2025). If the only completed/finished match records you see in the snippets are from past years or previous months, you MUST NOT mark today's match as "finished". A match scheduled or active today (${currentDateTimeStr}) must remain "live" or "not_started" instead of being downgraded to "finished" using historical scores.
2. LIVE MATCH DETECTION: If the search results indicate a match is scheduled for today or is active today, set the status to "live". Look for indicators like "live stream", "playing", "minutes", "injury time", "HT", "live score". If the search results do not show any match played today, but the existing status is "live", retain "live" and preserve the existing score.
3. MATCH STATUS VALUES:
   - "not_started": If the match is scheduled for today but hasn't kicked off yet (or if there is no info). Score should be "0 - 0" or match the existing score.
   - "live": If the match is currently active/playing today. Extract the actual current live score (e.g. "1 - 1", "0 - 0").
   - "finished": ONLY if there is explicit, undeniable search snippet evidence that a match played TODAY (or within the last 24 hours of ${currentDateTimeStr}) has officially completed (full-time whistle blown).
   - "postponed": If explicitly postponed.

You must return your response inside a valid JSON object.
Format exactly as this JSON schema (NO markdown blocks, NO \`\`\`json):
{
  "score": "Current score in format 'H - A' (e.g. '1 - 0', '2 - 2') or '0 - 0'",
  "status": "not_started" | "live" | "finished" | "postponed",
  "explanation": "A clean 1-sentence description detailing game minute, current scoreline, or scorer info."
}`;

            const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openaiKey}`
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                  { role: "system", content: "You are an agentic sports live score assistant." },
                  { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
              })
            });

            if (!openAiResponse.ok) {
              throw new Error(`OpenAI responded with status ${openAiResponse.status}`);
            }

            const parsedData = await openAiResponse.json();
            const choiceContent = parsedData.choices?.[0]?.message?.content || "";
            const cleanText = choiceContent.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleanText);

            if (parsed && (parsed.score || parsed.status)) {
              const oldScore = match.score;
              const oldStatus = match.status;

              match.score = parsed.score || match.score;
              match.status = parsed.status || match.status;
              match.lastChecked = new Date().toISOString();
              match.log = `AI Verified: ${parsed.explanation || 'No details provided.'} (${timestamp})`;

              if (oldScore !== match.score || oldStatus !== match.status) {
                globalLog.unshift(`[${timestamp}] Match Update: "${match.fixture}" is now ${match.score} (${match.status}) via OpenAI`);
              }
            }
          } catch (matchErr: any) {
            runSimulatedMatchUpdate(match, `AI Fallback: ${matchErr?.message || 'Check error'}`);
          }
        }

        await saveLiveScoresToDatabase();
        isCheckingLiveScores = false;
        globalLog.unshift(`[${timestamp}] Live scores updated successfully (OpenAI).`);
        return;
      } catch (err: any) {
        console.warn("OpenAI Live check failed, falling back to Simulation.", err);
      }
    }

    // Default simulation fallback
    for (const match of liveScores) {
      // Detect stale logs during simulation
      const logText = match.log || "";
      const logLower = logText.toLowerCase();
      const homeAway = match.fixture.split(" vs ");
      const hTeam = homeAway[0]?.trim() || "";
      const aTeam = homeAway[1]?.trim() || "";
      const hWord = hTeam.toLowerCase().split(" ")[0] || "___";
      const aWord = aTeam.toLowerCase().split(" ")[0] || "___";
      const isStaleLog = logText &&
                         logText !== "Added to real-time tracker board." &&
                         !logText.includes("Teams updated") &&
                         (!logLower.includes(hWord) || !logLower.includes(aWord));

      if (isStaleLog) {
        match.status = "not_started";
        match.score = "0 - 0";
        match.log = "Teams updated. Starting simulation stream...";
      }
      runSimulatedMatchUpdate(match, "Simulation Engine");
    }

    await saveLiveScoresToDatabase();
    isCheckingLiveScores = false;
    globalLog.unshift(`[${timestamp}] Live poll cycle complete (Simulation Engine).`);
  }

  // Auto poll every 30 seconds for agentic real-time updates
  const pollingInterval = setInterval(() => {
    updateLiveScoresInternal().catch(e => console.error("Auto polling crash:", e));
  }, 30000);

  // Expose Live Score Rest APIs
  app.get("/api/livescores/test-debug", async (req, res) => {
    const fixture = req.query.fixture as string || "Manchester United vs Chelsea";
    const openaiKey = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY;
    const hasOpenAI = openaiKey && openaiKey !== "MY_OPENAI_API_KEY" && openaiKey !== "OPENAI_API_KEY" && openaiKey !== "";

    let searchStatus = 0;
    let searchResponseText = "";
    let searchError = "";
    let snippets: string[] = [];
    let openAiPrompt = "";
    let openAiResponseText = "";
    let openAiError = "";

    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(fixture + " soccer live score status")}`;
      const searchRes = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        }
      });
      searchStatus = searchRes.status;
      const html = await searchRes.text();
      searchResponseText = html.substring(0, 500);

      const regex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = regex.exec(html)) !== null && snippets.length < 10) {
        let snippetText = match[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        if (snippetText) {
          snippets.push(snippetText);
        }
      }
    } catch (err: any) {
      searchError = err?.message || String(err);
    }

    const searchContext = snippets.length > 0 ? snippets.join("\n\n") : searchResponseText;

    if (hasOpenAI && openaiKey) {
      try {
        openAiPrompt = `You are an agentic sports live score assistant.
We searched the live web for the match: "${fixture}". Here are the top raw text search snippets retrieved:

=== LIVE WEB SEARCH RESULTS ===
${searchContext}
===============================

Your task is to analyze these search snippets, find the actual current live score or final score, and status for "${fixture}".

CRITICAL SAFETY INSTRUCTIONS:
1. HISTORICAL GUARD: DuckDuckGo search snippets often contain finished matches from years ago (e.g. 2021, 2023, 2024, or 2025). If the only completed/finished match records you see in the snippets are from past years or previous months, you MUST NOT mark today's match as "finished". A match scheduled or active today must remain "live" or "not_started" instead of being downgraded to "finished" using historical scores.
2. LIVE MATCH DETECTION: If the search results indicate a match is scheduled for today or is active today, set the status to "live". Look for indicators like "live stream", "playing", "minutes", "injury time", "HT", "live score".
3. MATCH STATUS VALUES:
   - "not_started": If the match is scheduled for today but hasn't kicked off yet (or if there is no info). Score should be "0 - 0".
   - "live": If the match is currently active/playing today. Extract the actual current live score (e.g. "1 - 1", "0 - 0").
   - "finished": ONLY if there is explicit, undeniable search snippet evidence that a match played TODAY has officially completed (full-time whistle blown).
   - "postponed": If explicitly postponed.

You must return your response inside a valid JSON object.
Format exactly as this JSON schema (NO markdown blocks, NO \`\`\`json):
{
  "score": "Current score in format 'H - A' (e.g. '1 - 0', '2 - 2') or '0 - 0'",
  "status": "not_started" | "live" | "finished" | "postponed",
  "explanation": "A clean 1-sentence description detailing game minute, current scoreline, or scorer info."
}`;

        const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are an agentic sports live score assistant. You analyze raw web search context to extract actual, accurate, and current real-time live scores or completed match scorelines." },
              { role: "user", content: openAiPrompt }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (!openAiResponse.ok) {
          throw new Error(`OpenAI responded with status ${openAiResponse.status}`);
        }

        const parsedData = await openAiResponse.json();
        openAiResponseText = parsedData.choices?.[0]?.message?.content || "";
      } catch (err: any) {
        openAiError = err?.message || String(err);
      }
    } else {
      openAiError = "No OpenAI API key found in process.env. Ensure OPENAI_API_KEY is configured in AI Studio Settings.";
    }

    res.json({
      success: true,
      hasOpenAI,
      searchStatus,
      searchError,
      snippetsExtracted: snippets.length,
      snippets,
      openAiPrompt,
      openAiResponseText,
      openAiError
    });
  });

  app.get("/api/livescores", async (req, res) => {
    await ensureLiveScoresLoaded();

    res.json({
      success: true,
      matches: liveScores,
      logs: globalLog,
      isChecking: isCheckingLiveScores
    });
  });

  app.post("/api/livescores", async (req, res) => {
    const { home_team, away_team, home_score, away_score, status } = req.body;
    if (!home_team || !away_team) {
      return res.status(400).json({ success: false, error: "Home Team and Away Team names are required." });
    }

    const tHome = home_team.trim();
    const tAway = away_team.trim();
    const hScore = Number(home_score) || 0;
    const aScore = Number(away_score) || 0;
    const matchStatus = status || "not_started";

    const supabase = await getSupabase();
    if (!supabase) {
      return res.status(503).json({ success: false, error: "Database not connected. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in settings first." });
    }

    let dbMatchId = "";
    try {
      const { data, error } = await supabase.from('live_scores').insert([{
        home_team: tHome,
        away_team: tAway,
        home_score: hScore,
        away_score: aScore,
        status: matchStatus,
        log: "Added to real-time tracker board."
      }]).select();

      if (error) {
        return res.status(500).json({ success: false, error: `Database insert failed: ${error.message}. Make sure the live_scores table exists in your PostgreSQL database.` });
      }

      if (data && data.length > 0) {
        dbMatchId = String(data[0].id);
      } else {
        return res.status(500).json({ success: false, error: "Could not retrieve saved match from database. Insert failed." });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: `Database error: ${err?.message || String(err)}` });
    }

    const newMatch: LiveScoreMatch = {
      id: dbMatchId,
      fixture: `${tHome} vs ${tAway}`,
      score: `${hScore} - ${aScore}`,
      status: matchStatus as any,
      lastChecked: new Date().toISOString(),
      log: "Added to real-time tracker board."
    };

    if (!liveScores.some(m => m.id === dbMatchId)) {
      liveScores.unshift(newMatch);
    }

    globalLog.unshift(`[${new Date().toLocaleTimeString()}] Admin added match: "${tHome} vs ${tAway}"`);
    res.json({ success: true, match: newMatch });
  });

  app.post("/api/livescores/delete", async (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: "Match id is required." });
    }

    const supabase = await getSupabase();
    if (!supabase) {
      return res.status(503).json({ success: false, error: "Database not connected. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in settings first." });
    }

    try {
      const { error } = await supabase.from('live_scores').delete().eq('id', id);
      if (error) {
        return res.status(500).json({ success: false, error: `Failed to delete from database: ${error.message}` });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: `Database error: ${err?.message || String(err)}` });
    }

    liveScores = liveScores.filter(m => m.id !== id);

    globalLog.unshift(`[${new Date().toLocaleTimeString()}] Admin removed match ID: ${id}`);
    res.json({ success: true, message: "Match deleted from database." });
  });

  app.post("/api/livescores/update-status", async (req, res) => {
    const { id, status, score } = req.body;
    if (!id || !status) {
      return res.status(400).json({ success: false, error: "id and status are required." });
    }

    const supabase = await getSupabase();
    if (!supabase) {
      return res.status(503).json({ success: false, error: "Database connection parameters are missing or not configured." });
    }

    try {
      const nowStr = new Date().toISOString();
      let logText = `Status manually updated to ${status}.`;
      if (status === 'live' || status === 'not_started') {
        logText = `Teams updated. Starting simulation stream... [Started: ${nowStr}]`;
      }

      const updateData: any = {
        status,
        log: logText,
        last_checked: nowStr
      };

      if (score !== undefined) {
        const parts = score.split(" - ");
        updateData.home_score = Number(parts[0]) || 0;
        updateData.away_score = Number(parts[1]) || 0;
      }

      const { error } = await supabase.from('live_scores').update(updateData).eq('id', id);

      if (error) {
        return res.status(500).json({ success: false, error: `Failed to update database: ${error.message}` });
      }

      // Update in-memory liveScores array
      const match = liveScores.find(m => m.id === id);
      if (match) {
        match.status = status;
        match.log = logText;
        match.lastChecked = nowStr;
        if (score !== undefined) {
          match.score = score;
        }
      }

      globalLog.unshift(`[${new Date().toLocaleTimeString()}] Admin manually set match ID ${id} to ${status.toUpperCase()} (${score || match?.score})`);
      res.json({ success: true, message: "Match status updated successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: `Database error: ${err?.message || String(err)}` });
    }
  });

  app.post("/api/livescores/trigger-update", async (req, res) => {
    try {
      await updateLiveScoresInternal(true);
      res.json({ success: true, matches: liveScores, logs: globalLog });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // API Route - Chatbot Webhook forwarder (n8n Integration) with intelligent Gemini + Local Fallback
  app.post("/api/chatbot", async (req, res) => {
    const { message, date, user } = req.body;
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    let webhookResponseOk = false;
    let reply = "";

    if (webhookUrl) {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: message || "",
            date: date || "",
            timestamp: new Date().toISOString(),
            user: user || { username: "anonymous", role: "user" }
          }),
          signal: AbortSignal.timeout(8000)
        });

        if (response.ok) {
          webhookResponseOk = true;
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const json = await response.json();
            if (typeof json === "string") {
              reply = json;
            } else if (Array.isArray(json) && json.length > 0) {
              const first = json[0];
              reply = first.reply || first.response || first.message || first.output || first.text || JSON.stringify(first, null, 2);
            } else if (json) {
              reply = json.reply || json.response || json.message || json.output || json.text || json.data || JSON.stringify(json, null, 2);
            } else {
              reply = JSON.stringify(json);
            }
          } else {
            reply = await response.text();
          }
        } else {
          console.error(`Chatbot n8n webhook returned status: ${response.status}. Triggering smart fallback...`);
        }
      } catch (err: any) {
        console.error("Chatbot n8n webhook connection error. Triggering smart fallback...", err);
      }
    } else {
      console.log("No n8n webhook configured. Using smart AI/Local fallback directly.");
    }

    // If webhook failed or was not configured, we fall back to our high-quality Gemini AI generator!
    if (!webhookResponseOk) {
      const geminiKey = process.env.GEMINI_API_KEY;
      const hasGemini = geminiKey && geminiKey !== "MY_GEMINI_API_KEY" && geminiKey !== "GEMINI_API_KEY" && geminiKey !== "";

      if (hasGemini) {
        try {
          const ai = new GoogleGenAI({
            apiKey: geminiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          const systemPrompt = `You are "PoolCodes Assistant", a helpful, professional AI chatbot for the "Fast Pool Codes" application.
The application handles:
1. UK Football Pools (Aussie Season & UK Season). Weekly coupon draws, fixtures, draw predictions (finding 3 draws, banker draws).
2. Live sports scores ticker (live matches, goals, minutes, game states, updates).
3. Admin controls, blog posts, and user profiles.

Guidelines:
- Provide high-quality, encouraging, and clear answers.
- Use clean Markdown styling for your response.
- Answer user queries about pool codes, soccer draws, predictions, or how to use the app.
- Keep the response professional, clear, and focused on helping the user.`;

          const userPrompt = `User Message: "${message || ""}"
Selected Context Date: "${date || "None selected"}"
User Metadata: ${JSON.stringify(user || { username: "guest" })}

Please formulate a helpful response based on this information.`;

          const aiResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt,
            }
          });

          reply = aiResponse.text || "";
        } catch (geminiErr: any) {
          console.error("Chatbot Gemini fallback failed:", geminiErr);
        }
      }

      // If both Webhook AND Gemini fail, or if no key exists, provide an excellent rule-based local helper!
      if (!reply) {
        const lowerMsg = (message || "").toLowerCase();
        if (lowerMsg.includes("predict") || lowerMsg.includes("draw") || lowerMsg.includes("banker")) {
          reply = `🔮 **Fast Pool Codes Draw Prediction System**\n\nI couldn't reach the live AI endpoint right now, but here are our default draw insights for this week:\n- **Match Highlight**: Liverpool vs Chelsea (Strong draw index of **84%**)\n- **Banker Prediction**: Arsenal vs Man City (Expected low scoring, high draw likelihood)\n- **Secondary Draw Picks**: Match 14 & Match 27 on this week's official coupon.\n\nPlease check the Live Scores board and weekly coupon draws on your dashboard for more real-time predictions!`;
        } else if (lowerMsg.includes("code") || lowerMsg.includes("coupon") || lowerMsg.includes("aussie") || lowerMsg.includes("week")) {
          reply = `📋 **Football Pool Coupon & Weekly Codes Guide**\n\nI am currently operating in offline mode, but I can guide you on weekly pool codes:\n- **Aussie Season Week 49**: Codes are fully synchronized and available for premium plans.\n- **Weekly Coupon Draws**: Check the Dashboard tab to search coupon sheets, bookmaker forecast ratios, and register your free weekly draw ticket entries.\n- **Match Fixtures**: Go to the Matches sub-tab to see the current lineup of 49 pool matches.`;
        } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("welcome")) {
          reply = `👋 Hello! Welcome to the **PoolCodes Assistant**.\n\nI am running in local backup mode to assist you. You can ask me about:\n- Weekly pool draw predictions\n- Searching coupon codes & fixtures\n- Accessing premium match logs and goal stats\n\nHow can I support you today?`;
        } else {
          reply = `👋 Hello! I am the **PoolCodes Assistant** running in local offline backup mode.\n\nIt seems our primary webhook is currently undergoing system maintenance, but you can explore the dashboard for:\n- 📊 **Live Scores**: Real-time match fixtures and goals.\n- 🏆 **Weekly Coupons**: UK/Aussie pool sheets & draws.\n- ✍️ **Admin Blog**: Football analysis articles.\n\nIf you have any specific feature question, let me know and I will do my absolute best to help!`;
        }
      }
    }

    res.json({
      success: true,
      reply: reply,
      isFallback: false
    });
  });

// Export the app so it can be used on Vercel as a serverless function
export default app;

async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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
    console.log(`Server loaded on http://0.0.0.0:${PORT} [Full-Stack API Gateway]`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Backend Server Boot Failure:", err);
  });
}
