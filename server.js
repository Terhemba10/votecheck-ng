// VoteCheck NG server. Uses only Node.js built-ins (Node 20+), so there is nothing to install.
import http from "node:http";
import { readFileSync, existsSync, createReadStream } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { guideReply } from "./src/guide.js";
import { assistantSystemPrompt, reportPrompt, LANGUAGES } from "./src/prompts.js";
import { analyse, templateReport } from "./src/checker.js";
import { randomBytes } from "node:crypto";
import { SESSION_COOKIE, signSession, verifySession, parseCookies, sessionCookie, clearCookie, verifyGoogleIdToken } from "./src/auth.js";

const ROOT = fileURLToPath(new URL(".", import.meta.url));

// Minimal .env loader
if (existsSync(join(ROOT, ".env"))) {
  for (const line of readFileSync(join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const PORT = Number(process.env.PORT) || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.MODEL || "claude-haiku-5-5";
const AI_ON = Boolean(API_KEY && API_KEY !== "your-key-here");

// Simple per-IP rate limit: 20 requests per minute
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter(t => now - t < 60_000);
  list.push(now); hits.set(ip, list);
  if (hits.size > 10_000) for (const [k, v] of hits) if (now - v[v.length - 1] > 60_000) hits.delete(k);
  return list.length > 20;
}

// On a host like Render, requests arrive through a proxy, so the visitor's IP is in X-Forwarded-For.
// Only trust that header when we know a proxy sets it (Render sets RENDER=true), because anyone can send it.
const BEHIND_PROXY = process.env.RENDER === "true" || process.env.TRUST_PROXY === "1";
const clientIP = req => (BEHIND_PROXY && String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()) || req.socket.remoteAddress;

// Google sign-in is switched on when GOOGLE_CLIENT_ID is set. Without it the site runs in open demo mode.
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || "").trim();
const AUTH_ON = Boolean(GOOGLE_CLIENT_ID);
let SESSION_SECRET = process.env.SESSION_SECRET;
if (AUTH_ON && !SESSION_SECRET) {
  SESSION_SECRET = randomBytes(32).toString("hex");
  console.warn("SESSION_SECRET not set: using a temporary one, so everyone is signed out when the server restarts.");
}
const SECURE_COOKIES = BEHIND_PROXY;
const currentUser = req => AUTH_ON ? verifySession(parseCookies(req.headers.cookie)[SESSION_COOKIE], SESSION_SECRET) : null;

async function callClaude(system, messages, maxTokens = 600) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) throw new Error(`Claude API error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
}

function readJSON(req, limit = 100_000) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", c => { body += c; if (body.length > limit) { reject(new Error("Request too large")); req.destroy(); } });
    req.on("end", () => { try { resolve(JSON.parse(body || "{}")); } catch { reject(new Error("Invalid JSON")); } });
  });
}
const send = (res, code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
const pickLanguage = l => LANGUAGES.includes(l) ? l : "English";

async function handleAsk(req, res) {
  const { language, messages } = await readJSON(req);
  if (!Array.isArray(messages) || !messages.length) return send(res, 400, { error: "messages is required" });
  const clean = messages.slice(-10)
    .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }));
  const last = clean.filter(m => m.role === "user").pop();
  if (!last) return send(res, 400, { error: "No user message" });
  while (clean.length && clean[0].role !== "user") clean.shift();
  const lang = pickLanguage(language);
  if (!AI_ON) return send(res, 200, { ...guideReply(last.content, lang), source: "guide" });
  try {
    const answer = await callClaude(assistantSystemPrompt(lang), clean, 500);
    send(res, 200, { answer, language: lang, source: "ai" });
  } catch (e) {
    console.error(e.message);
    send(res, 200, { ...guideReply(last.content, lang), source: "guide" });
  }
}

async function handleReport(req, res) {
  const { language, units } = await readJSON(req, 500_000);
  if (!Array.isArray(units)) return send(res, 400, { error: "units is required" });
  const results = analyse(units); // flags are recomputed on the server, never trusted from the browser
  const lang = pickLanguage(language);
  if (!AI_ON) return send(res, 200, { report: templateReport(results, lang), language: lang, source: "template" });
  try {
    const report = await callClaude("You write neutral, factual election-observation notes.",
      [{ role: "user", content: reportPrompt(lang, results) }], 900);
    send(res, 200, { report, language: lang, source: "ai" });
  } catch (e) {
    console.error(e.message);
    send(res, 200, { report: templateReport(results, lang), language: lang, source: "template" });
  }
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".csv": "text/csv; charset=utf-8", ".svg": "image/svg+xml" };

function serveFile(res, path) {
  if (!existsSync(path)) { res.writeHead(404); return res.end("Not found"); }
  res.writeHead(200, { "content-type": TYPES[extname(path)] || "application/octet-stream" });
  createReadStream(path).pipe(res);
}

async function handleLogin(req, res) {
  if (!AUTH_ON) return send(res, 400, { error: "Google sign-in is not set up on this server." });
  const { credential } = await readJSON(req, 10_000);
  try {
    const user = await verifyGoogleIdToken(credential, GOOGLE_CLIENT_ID);
    res.setHeader("set-cookie", sessionCookie(signSession(user, SESSION_SECRET), { secure: SECURE_COOKIES }));
    send(res, 200, { user });
  } catch (e) {
    send(res, 401, { error: e.message });
  }
}

// Shared modules and data the browser loads.
const LIB = {
  "/lib/checker.js": ["src", "checker.js"], "/lib/report_text.js": ["src", "report_text.js"], "/lib/sheet.js": ["src", "sheet.js"], "/lib/results2023.js": ["src", "results2023.js"],
  "/data/sample_results.csv": ["data", "sample_results.csv"], "/data/voter_guide.json": ["data", "voter_guide.json"],
  "/data/demo_voters.json": ["data", "demo_voters.json"], "/data/results_2023.json": ["data", "results_2023.json"],
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (req.method === "POST" && url.pathname.startsWith("/api/")) {
      if (rateLimited(clientIP(req))) return send(res, 429, { error: "Too many requests. Try again in a minute." });
      if (url.pathname === "/api/login") return await handleLogin(req, res);
      if (url.pathname === "/api/logout") { res.setHeader("set-cookie", clearCookie({ secure: SECURE_COOKIES })); return send(res, 200, { ok: true }); }
      if (AUTH_ON && !currentUser(req)) return send(res, 401, { error: "Sign in with Google to use this tool." });
      if (url.pathname === "/api/ask") return await handleAsk(req, res);
      if (url.pathname === "/api/report") return await handleReport(req, res);
      return send(res, 404, { error: "Unknown route" });
    }
    if (req.method === "GET" && url.pathname === "/api/status") return send(res, 200, { ai: AI_ON });
    if (req.method === "GET" && url.pathname === "/api/me")
      return send(res, 200, { authEnabled: AUTH_ON, googleClientId: GOOGLE_CLIENT_ID || null, user: currentUser(req) });
    if (req.method !== "GET") { res.writeHead(405); return res.end(); }
    if (LIB[url.pathname]) return serveFile(res, join(ROOT, ...LIB[url.pathname]));

    // Pages: "/" is the home page, and "/ask" serves ask.html.
    let rel = normalize(url.pathname === "/" ? "/index.html" : url.pathname).replace(/^(\.\.[/\\])+/, "");
    if (!extname(rel)) rel += ".html";
    const file = join(ROOT, "public", rel);
    if (!file.startsWith(join(ROOT, "public"))) { res.writeHead(403); return res.end(); }

    // With sign-in on, every page except the sign-in page needs a session. Scripts, styles and data stay public.
    if (AUTH_ON && rel.endsWith(".html")) {
      const isLogin = rel.replace(/\\/g, "/") === "/login.html", user = currentUser(req);
      if (!user && !isLogin) { res.writeHead(302, { location: "/login" }); return res.end(); }
      if (user && isLogin) { res.writeHead(302, { location: "/" }); return res.end(); }
    }
    serveFile(res, file);
  } catch (e) {
    send(res, 400, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`VoteCheck NG running at http://localhost:${PORT}`);
  console.log(AI_ON ? `AI mode on (model: ${MODEL})` : "AI key not set: using the built-in guide and template reports. Add ANTHROPIC_API_KEY to .env to switch AI on.");
  console.log(AUTH_ON ? "Google sign-in is on." : "Google sign-in is off (no GOOGLE_CLIENT_ID): the site runs in open demo mode.");
});
