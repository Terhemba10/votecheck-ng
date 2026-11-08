// VoteCheck NG result checker.
// Pure functions with no dependencies, so the same file runs in Node (tests, server) and in the browser.
// Rules decide the flags; a flag means "verify this", never "fraud".
import { REPORT_TEXT } from "./report_text.js";

export const COLUMNS = ["pu_code", "pu_name", "ward", "registered", "accredited",
  "paper_a", "paper_b", "paper_c", "rejected", "irev_a", "irev_b", "irev_c"];

export const PARTIES = ["A", "B", "C"];
export const SEVERITY_RANK = { critical: 3, warning: 2, review: 1, clean: 0 };

// Quote-aware CSV parser. Returns an array of rows (arrays of strings).
export function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  const pushRow = () => { row.push(field); field = ""; if (row.some(v => v.trim() !== "")) rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; pushRow(); }
    else field += c;
  }
  pushRow();
  return rows;
}

// Turns CSV text into polling-unit objects. Throws an Error with a user-friendly message on bad input.
export function toUnits(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error("The file has no data rows.");
  const head = rows[0].map(h => h.trim().toLowerCase());
  const missing = COLUMNS.filter(c => !head.includes(c));
  if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}. Use the CSV template.`);
  const ix = Object.fromEntries(COLUMNS.map(c => [c, head.indexOf(c)]));
  const cell = (r, c) => (r[ix[c]] ?? "").trim();
  const num = (r, c, line) => {
    const v = cell(r, c);
    if (v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) throw new Error(`Row ${line}: "${c}" must be a number of 0 or more.`);
    return n;
  };
  return rows.slice(1).map((r, n) => {
    const line = n + 2;
    const registered = num(r, "registered", line), accredited = num(r, "accredited", line);
    if (registered === null || accredited === null) throw new Error(`Row ${line}: registered and accredited are required.`);
    const irevValues = ["irev_a", "irev_b", "irev_c"].map(c => num(r, c, line));
    return {
      code: cell(r, "pu_code"), name: cell(r, "pu_name"), ward: cell(r, "ward"),
      registered, accredited, rejected: num(r, "rejected", line) ?? 0,
      paper: { A: num(r, "paper_a", line) ?? 0, B: num(r, "paper_b", line) ?? 0, C: num(r, "paper_c", line) ?? 0 },
      irev: irevValues.every(v => v === null) ? null : { A: irevValues[0] ?? 0, B: irevValues[1] ?? 0, C: irevValues[2] ?? 0 },
    };
  });
}

export function median(values) {
  const s = [...values].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  if (!s.length) return 0;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const pct = x => (x * 100).toFixed(1) + "%";

// Applies every rule to every polling unit. Returns units sorted most severe first.
export function analyse(units) {
  const turnouts = units.filter(u => u.accredited > 0 && u.registered > 0).map(u => u.accredited / u.registered);
  const med = median(turnouts);
  const mad = median(turnouts.map(t => Math.abs(t - med))) || 0.01;

  return units.map(u => {
    // Each flag keeps its figures in `data`, so the report can word it in any language (see report_text.js).
    const flags = [];
    const add = (sev, rule, data = {}) => flags.push({ sev, rule, data, text: REPORT_TEXT.English.flags[rule](data) });
    const valid = u.paper.A + u.paper.B + u.paper.C;
    const cast = valid + u.rejected;
    const turnout = u.registered ? u.accredited / u.registered : 0;

    if (u.accredited > u.registered)
      add("critical", "accredited_exceeds_registered", { accredited: u.accredited, registered: u.registered });
    if (cast > u.accredited)
      add("critical", "over_voting", { cast, accredited: u.accredited });

    if (u.irev === null) {
      if (u.accredited > 0) add("warning", "missing_irev");
    } else {
      for (const p of PARTIES) {
        const d = u.irev[p] - u.paper[p];
        if (d !== 0) add("critical", "irev_mismatch", { party: p, paper: u.paper[p], irev: u.irev[p], diff: (d > 0 ? "+" : "") + d });
      }
    }

    if (u.accredited > 0) {
      const z = 0.6745 * (turnout - med) / mad;
      if (turnout >= 0.95) add("warning", "high_turnout", { turnout: pct(turnout) });
      else if (Math.abs(z) > 3.5) add("review", "turnout_outlier", { turnout: pct(turnout), median: pct(med) });
      const top = Math.max(u.paper.A, u.paper.B, u.paper.C);
      if (valid > 50 && top / valid >= 0.95) add("review", "one_sided", { share: pct(top / valid) });
    } else if (u.registered > 0) {
      add("review", "zero_accredited");
    }

    const sev = flags.reduce((m, f) => SEVERITY_RANK[f.sev] > SEVERITY_RANK[m] ? f.sev : m, "clean");
    return { ...u, valid, cast, turnout, flags, sev };
  }).sort((a, b) => SEVERITY_RANK[b.sev] - SEVERITY_RANK[a.sev]);
}

export function summarise(results) {
  const count = s => results.filter(r => r.sev === s).length;
  return {
    total: results.length,
    critical: count("critical"), warning: count("warning"), review: count("review"), clean: count("clean"),
    mismatches: results.filter(r => r.flags.some(f => f.rule === "irev_mismatch")).length,
  };
}

// Plain report used when the AI is unavailable, in any of the five languages (English if unknown).
export function templateReport(results, language = "English") {
  const T = REPORT_TEXT[language] || REPORT_TEXT.English;
  const flagged = results.filter(r => r.sev !== "clean");
  if (!flagged.length) return T.none;
  return T.summary(results.length, flagged.length) + "\n\n" +
    flagged.map(r => `${r.code} (${r.name}) – ${T.labels[r.sev]}\n` +
      r.flags.map(f => "  • " + T.flags[f.rule](f.data || {})).join("\n")).join("\n\n") +
    "\n\n" + T.next;
}
