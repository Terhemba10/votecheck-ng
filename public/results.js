import { COLUMNS, toUnits, analyse, summarise, templateReport } from "/lib/checker.js";
import { REPORT_TEXT } from "/lib/report_text.js";
import { checkStateResults } from "/lib/results2023.js";
import { renderChrome, getLang, onLangChange, $, esc, t, postJSON, LANG_CODES } from "/common.js";

renderChrome("results");

let units = [], results = [], dataset = { key: "results.sample" }, reportShown = false;
const sevLabel = s => t(`sev.${s}`);
// Flag wording in the chosen language, from the same rule data the server uses.
const flagText = f => (REPORT_TEXT[getLang()] || REPORT_TEXT.English).flags[f.rule]?.(f.data || {}) ?? f.text;

function render() {
  $("datasetLabel").textContent = t(dataset.key, dataset.vars);
  const s = summarise(results);
  $("tiles").innerHTML = [
    ["info", "tile.checked", s.total], ["crit", "tile.crit", s.critical], ["warn", "tile.warn", s.warning],
    ["info", "tile.review", s.review], ["ok", "tile.clean", s.clean], ["crit", "tile.mismatch", s.mismatches],
  ].map(([c, l, n]) => `<div class="tile ${c}"><div class="n">${n}</div><div class="l">${esc(t(l))}</div></div>`).join("");

  const flagged = results.filter(r => r.sev !== "clean");
  $("flagTable").innerHTML = flagged.length
    ? `<thead><tr><th>${t("th.sev")}</th><th>${t("th.pu")}</th><th>${t("th.verify")}</th></tr></thead><tbody>${flagged.map(r =>
      `<tr><td><span class="sev ${r.sev}">${sevLabel(r.sev)}</span></td><td><strong>${esc(r.code)}</strong><br><span class="small">${esc(r.name)}, ${esc(r.ward)}</span></td><td><ul class="flags">${r.flags.map(f => `<li>${esc(flagText(f))}</li>`).join("")}</ul></td></tr>`).join("")}</tbody>`
    : `<tbody><tr><td>${t("noflags")}</td></tr></tbody>`;

  $("allTable").innerHTML = `<thead><tr><th>${t("th.pu")}</th><th>${t("th.status")}</th><th>${t("th.registered")}</th><th>${t("th.accredited")}</th><th>${t("th.turnout")}</th><th>A</th><th>B</th><th>C</th><th>${t("th.rejected")}</th><th>${t("th.irev")}</th></tr></thead><tbody>${
    results.map(r => `<tr><td><strong>${esc(r.code)}</strong><br><span class="small">${esc(r.name)}</span></td><td><span class="sev ${r.sev}">${sevLabel(r.sev)}</span></td><td class="num">${r.registered}</td><td class="num">${r.accredited}</td><td class="num">${(r.turnout * 100).toFixed(1)}%</td><td class="num">${r.paper.A}</td><td class="num">${r.paper.B}</td><td class="num">${r.paper.C}</td><td class="num">${r.rejected}</td><td class="num">${r.irev ? `${r.irev.A} / ${r.irev.B} / ${r.irev.C}` : esc(t("notUploaded"))}</td></tr>`).join("")}</tbody>`;
  if (!reportShown) $("report").textContent = t("report.default");
}

function load(text, ds) {
  try {
    units = toUnits(text); results = analyse(units);
    dataset = ds; reportShown = false; $("csvMsg").textContent = "";
    render();
  } catch (e) { $("csvMsg").textContent = e.message; }
}

const loadSample = () => fetch("/data/sample_results.csv").then(r => r.text()).then(tx => load(tx, { key: "results.sample" }));
$("loadSample").addEventListener("click", loadSample);
$("csv").addEventListener("change", e => {
  const f = e.target.files[0];
  if (f) f.text().then(tx => load(tx, { key: "results.file", vars: { name: f.name } }));
  e.target.value = "";
});
$("copyTpl").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(COLUMNS.join(",") + "\n01-001,Example School,Ward 01,800,400,150,150,80,20,150,150,80");
    $("csvMsg").textContent = t("results.copied");
  } catch { $("csvMsg").textContent = t("results.copyFail", { cols: COLUMNS.join(",") }); }
});

async function writeReport() {
  const btn = $("genReport"), out = $("report"), lang = getLang();
  btn.disabled = true; out.textContent = t("report.writing");
  try {
    out.textContent = (await postJSON("/api/report", { language: lang, units })).report;
  } catch {
    // Server busy or offline: build the same report in the browser, from the same rules.
    out.textContent = templateReport(results, lang);
  }
  out.lang = LANG_CODES[lang] || "en";
  reportShown = true;
  btn.disabled = false;
}
$("genReport").addEventListener("click", writeReport);
$("copyReport").addEventListener("click", async e => {
  try { await navigator.clipboard.writeText($("report").textContent); e.target.textContent = t("report.copied"); }
  catch { e.target.textContent = t("report.copyFail"); }
  setTimeout(() => { e.target.textContent = t("report.copy"); }, 1500);
});

// ---------- 2023 presidential results (official declared totals + a published state-by-state copy) ----------
let y23 = null;
const fmt = n => n.toLocaleString("en-NG");
const signed = n => (n > 0 ? "+" : "") + fmt(n);
function render2023() {
  if (!y23) return;
  const cands = y23.candidates, chk = checkStateResults(y23);
  const nameOf = key => key === "valid" ? t("y23.validName") : `${cands.find(c => c.key === key).name} (${cands.find(c => c.key === key).party})`;
  const bad = chk.totals.filter(x => x.diff !== 0);
  $("y23-summary").innerHTML = `
    <h3>${esc(t("y23.declaredH"))}</h3>
    <div class="tiles" style="margin-top:10px">${cands.map(c => `<div class="tile info"><div class="n">${fmt(y23.declared[c.key])}</div><div class="l">${esc(c.name)} (${esc(c.party)})</div></div>`).join("")}
      <div class="tile ok"><div class="n">${fmt(y23.declared.valid)}</div><div class="l">${esc(t("y23.validName"))}</div></div></div>
    <h3 style="margin-top:20px">${esc(t("y23.copyH"))}</h3>
    ${chk.totalsOk ? `<p class="notice" style="margin-top:8px">${esc(t("y23.sum"))}</p>` : `<div class="notice" style="margin-top:8px"><p>${esc(t("y23.sumBad"))}</p>
      <ul class="flags" style="margin-top:6px">${bad.map(x => `<li>${esc(t("y23.totalBad", { name: nameOf(x.key), sum: fmt(x.sum), declared: fmt(x.declared), diff: signed(x.diff) }))}</li>`).join("")}</ul></div>`}`;
  $("y23Table").innerHTML = `<thead><tr><th>${t("y23.state")}</th>${cands.map(c => `<th>${esc(c.party)}</th>`).join("")}<th>${t("y23.others")}</th><th>${t("y23.valid")}</th><th>${t("y23.published")}</th><th>${t("y23.checks")}</th></tr></thead><tbody>${
    y23.states.map((s, i) => { const r = chk.rows[i]; return `<tr><td><strong>${esc(s.state)}</strong></td>${cands.map(c => `<td class="num">${fmt(s[c.key])}</td>`).join("")}<td class="num">${fmt(s.others)}</td><td class="num">${fmt(s.valid)}</td><td class="num">${esc(s.turnout)}%</td><td>${r.ok ? `<span class="sev clean">${t("y23.ok")}</span>` : `<span class="sev warning">${t("sev.warning")}</span> ${esc(t("y23.rowBad", { sum: fmt(r.sum), written: fmt(r.valid) }))}`}</td></tr>`; }).join("")}</tbody>`;
  $("y23-source").textContent = t("y23.source", { src: y23.source });
}
fetch("/data/results_2023.json").then(r => r.ok ? r.json() : null).then(d => { y23 = d; if (!d) $("y23").hidden = true; else render2023(); }).catch(() => { $("y23").hidden = true; });

onLangChange(() => { render(); render2023(); if (reportShown) writeReport(); });
loadSample();
