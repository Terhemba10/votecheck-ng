// Result sheet page: runs the same fixed rules as the tests (src/sheet.js), entirely in the browser.
import { checkSheet, EXAMPLE_SHEET } from "/lib/sheet.js";
import { renderChrome, onLangChange, $, esc, t } from "/common.js";

renderChrome("sheet");

const form = $("sheet-form");
const FIELDS = ["puCode", "puName", "registered", "accredited", "totalValid", "rejected", "totalCast", "poName", "agentSignatures", "serialNumber", "electionDate", "completedAt", "uploadedAt"];
const CHECKS = ["poSigned", "stamped"];
const sevLabel = s => s === "clean" ? t("sheet.clean") : t(`sev.${s}`);
// Flag wording in the chosen language; field names inside a flag are translated too.
const flagText = f => t(`sf.${f.rule}`, f.rule === "unreadable_figures" ? { fields: f.data.fields.map(k => t(k)).join(", ") } : f.data);

function labelRow(row, i) {
  const [name, votes] = row.querySelectorAll("input"), btn = row.querySelector("button");
  name.placeholder = t("sheet.partyName"); name.setAttribute("aria-label", t("sheet.partyN", { n: i }));
  votes.placeholder = t("sheet.votes"); votes.setAttribute("aria-label", t("sheet.votesN", { n: i }));
  btn.setAttribute("aria-label", t("sheet.remove", { n: i }));
}
const relabelRows = () => [...$("parties").children].forEach((r, i) => labelRow(r, i + 1));

function partyRow(name = "", votes = "") {
  const row = document.createElement("div");
  row.className = "party-row";
  row.innerHTML = `
    <input type="text" value="${esc(name)}">
    <input type="number" min="0" inputmode="numeric" value="${esc(votes)}">
    <button class="icon-btn" type="button">×</button>`;
  row.querySelector("button").addEventListener("click", () => { row.remove(); relabelRows(); update(); });
  $("parties").appendChild(row);
  labelRow(row, $("parties").children.length);
}

function read() {
  const s = Object.fromEntries(FIELDS.map(f => [f, $(f).value]));
  CHECKS.forEach(c => { s[c] = $(c).checked; });
  s.parties = [...$("parties").children].map(r => { const [n, v] = r.querySelectorAll("input"); return { name: n.value, votes: v.value }; });
  return s;
}

function fill(s) {
  FIELDS.forEach(f => { $(f).value = s[f] ?? ""; });
  CHECKS.forEach(c => { $(c).checked = Boolean(s[c]); });
  $("parties").innerHTML = "";
  (s.parties?.length ? s.parties : [{}, {}, {}]).forEach(p => partyRow(p.name ?? "", p.votes ?? ""));
  update();
}

function update() {
  const s = read();
  const empty = !s.registered && !s.accredited && s.parties.every(p => p.votes === "");
  if (empty) {
    $("verdict").innerHTML = "";
    $("sheet-flags").innerHTML = `<li>${esc(t("sheet.empty"))}</li>`;
    $("sheet-sums").textContent = "";
    return;
  }
  const r = checkSheet(s);
  $("verdict").innerHTML = `<span class="sev ${r.sev}">${esc(sevLabel(r.sev))}</span><span class="small">${esc(t("sheet.items", { n: r.flags.length }))}</span>`;
  $("sheet-flags").innerHTML = r.flags.length
    ? r.flags.map(f => `<li><span class="sev ${f.sev}">${esc(sevLabel(f.sev))}</span> ${esc(flagText(f))}</li>`).join("")
    : `<li>${esc(t("sheet.allGood"))}</li>`;
  $("sheet-sums").textContent = r.sumParties !== null ? t("sheet.sum", { n: r.sumParties }) : "";
}

form.addEventListener("input", update);
$("add-party").addEventListener("click", () => { partyRow(); update(); });
$("load-example").addEventListener("click", () => fill(EXAMPLE_SHEET));
$("clear").addEventListener("click", () => fill({}));
onLangChange(() => { relabelRows(); update(); });
fill({});

// ---------- Observer report, written at the polling unit ----------
// Built in the browser from the form above plus the observer's own notes. It stays on this device
// (a draft is kept in local storage) until the observer copies, downloads or shares it.
const DRAFT = "vc-observer-report";
const store = {
  load() { try { return JSON.parse(localStorage.getItem(DRAFT) || "{}"); } catch { return {}; } },
  save(d) { try { localStorage.setItem(DRAFT, JSON.stringify(d)); return true; } catch { return false; } },
};
const status = msg => { $("obs-status").textContent = msg; };

function buildReport() {
  const s = read(), r = checkSheet(s);
  const val = v => (v === "" || v === undefined ? "—" : v);
  const pu = [s.puCode, s.puName].filter(Boolean).join(" · ") || "—";
  const parties = s.parties.filter(p => p.name || p.votes !== "").map(p => `${p.name || "?"}: ${val(p.votes)}`).join(", ");
  const checks = r.flags.length ? r.flags.map(f => `  • [${sevLabel(f.sev)}] ${flagText(f)}`).join("\n") : `  • ${t("rep.noIssues")}`;
  return [
    t("rep.title"),
    `${t("rep.pu")}: ${pu}`,
    `${t("rep.written")}: ${new Date().toLocaleString()}`,
    `${t("rep.by")}: ${$("obs-who").value.trim() || "—"}`,
    "",
    `${t("rep.figures")}:`,
    `  ${t("f.registered")}: ${val(s.registered)} · ${t("f.accredited")}: ${val(s.accredited)}`,
    `  ${t("f.totalValid")}: ${val(s.totalValid)} · ${t("f.rejected")}: ${val(s.rejected)} · ${t("f.totalCast")}: ${val(s.totalCast)}`,
    parties ? `  ${t("f.partyVotes")}: ${parties}` : null,
    "",
    `${t("rep.checks")}:`,
    checks,
    "",
    `${t("rep.seen")}:`,
    $("obs-notes").value.trim() || t("rep.none"),
    "",
    t("rep.footer"),
  ].filter(l => l !== null).join("\n");
}

function saveDraft() {
  const ok = store.save({ who: $("obs-who").value, notes: $("obs-notes").value, text: $("obs-text").value, sheet: read() });
  status(ok ? t("rep.saved") : "");
}
["obs-who", "obs-notes", "obs-text"].forEach(id => $(id).addEventListener("input", saveDraft));
// The sheet figures are part of the draft too, so a phone that refreshes mid-way loses nothing.
form.addEventListener("input", saveDraft);
["add-party", "load-example", "clear"].forEach(id => $(id).addEventListener("click", saveDraft));

$("obs-make").addEventListener("click", () => {
  $("obs-text").value = buildReport();
  saveDraft();
  $("obs-text").focus();
});

$("obs-copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("obs-text").value); status(t("rep.copied")); }
  catch { $("obs-text").select(); status(""); }
});

$("obs-download").addEventListener("click", () => {
  const code = ($("puCode").value || "polling-unit").replace(/[^\w-]+/g, "-");
  const blob = new Blob([$("obs-text").value], { type: "text/plain;charset=utf-8" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `observer-report-${code}-${new Date().toISOString().slice(0, 10)}.txt` });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

// Phones can hand the report straight to WhatsApp, email or SMS.
if (navigator.share) {
  $("obs-share").hidden = false;
  $("obs-share").addEventListener("click", () => navigator.share({ title: t("rep.h"), text: $("obs-text").value }).catch(() => {}));
}

// Restore a draft if the page was closed mid-report.
const draft = store.load();
if (draft.sheet) fill(draft.sheet);
if (draft.who) $("obs-who").value = draft.who;
if (draft.notes) $("obs-notes").value = draft.notes;
if (draft.text) $("obs-text").value = draft.text;
