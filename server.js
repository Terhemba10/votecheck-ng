// VoteCheck NG server. Uses only Node.js built-ins (Node 20+), so there is nothing to install.
import http from "node:http";
import { readFileSync, existsSync, createReadStream } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { guideReply } from "./src/guide.js";
import { assistantSystemPrompt, reportPrompt, LANGUAGES } from "./src/prompts.js";
import { analyse, templateReport } from "./src/checker.js";

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
  if (!AI_ON) return send(res, 200, { report: templateReport(results), source: "template" });
  try {
    const report = await callClaude("You write neutral, factual election-observation notes.",
      [{ role: "user", content: reportPrompt(pickLanguage(language), results) }], 900);
    send(res, 200, { report, source: "ai" });
  } catch (e) {
    console.error(e.message);
    send(res, 200, { report: templateReport(results), source: "template" });
  }
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".csv": "text/csv; charset=utf-8", ".svg": "image/svg+xml" };

function serveFile(res, path) {
  if (!existsSync(path)) { res.writeHead(404); return res.end("Not found"); }
  res.writeHead(200, { "content-type": TYPES[extname(path)] || "application/octet-stream" });
  createReadStream(path).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (req.method === "POST" && url.pathname.startsWith("/api/")) {
      if (rateLimited(clientIP(req))) return send(res, 429, { error: "Too many requests. Try again in a minute." });
      if (url.pathname === "/api/ask") return await handleAsk(req, res);
      if (url.pathname === "/api/report") return await handleReport(req, res);
      return send(res, 404, { error: "Unknown route" });
    }
    if (req.method === "GET" && url.pathname === "/api/status") return send(res, 200, { ai: AI_ON });
    if (req.method !== "GET") { res.writeHead(405); return res.end(); }
    // Shared modules and sample data for the browser
    if (url.pathname === "/lib/checker.js") return serveFile(res, join(ROOT, "src", "checker.js"));
    if (url.pathname === "/data/sample_results.csv") return serveFile(res, join(ROOT, "data", "sample_results.csv"));
    if (url.pathname === "/data/voter_guide.json") return serveFile(res, join(ROOT, "data", "voter_guide.json"));
    const rel = normalize(url.pathname === "/" ? "/index.html" : url.pathname).replace(/^(\.\.[/\\])+/, "");
    const file = join(ROOT, "public", rel);
    if (!file.startsWith(join(ROOT, "public"))) { res.writeHead(403); return res.end(); }
    serveFile(res, file);
  } catch (e) {
    send(res, 400, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`VoteCheck NG running at http://localhost:${PORT}`);
  console.log(AI_ON ? `AI mode on (model: ${MODEL})` : "AI key not set: using the built-in guide and template reports. Add ANTHROPIC_API_KEY to .env to switch AI on.");
});
