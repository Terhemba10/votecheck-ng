import { COLUMNS, toUnits, analyse, summarise, templateReport } from "/lib/checker.js";
import { initHero } from "/hero.js";

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let aiOn = false;

async function postJSON(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

/* ---------- Tabs ---------- */
const tabs = [["tab-ask", "panel-ask"], ["tab-check", "panel-check"]];
tabs.forEach(([t, p]) => $(t).addEventListener("click", () => {
  tabs.forEach(([t2, p2]) => { $(t2).setAttribute("aria-selected", t2 === t); $(p2).hidden = p2 !== p; });
}));

/* ---------- Voter help ---------- */
const chat = $("chat"), q = $("q"), sendBtn = $("send");
const history = [];
function addMsg(text, cls) {
  const d = document.createElement("div");
  d.className = "msg " + cls; d.textContent = text;
  chat.appendChild(d); chat.scrollTop = chat.scrollHeight;
  return d;
}

async function ask(text) {
  text = text.trim();
  if (!text) return;
  addMsg(text, "user"); q.value = ""; sendBtn.disabled = true;
  history.push({ role: "user", content: text });
  const bubble = addMsg("Thinking…", "bot");
  try {
    const chosen = $("lang").value;
    const { answer, language } = await postJSON("/api/ask", { language: chosen, messages: history });
    bubble.textContent = answer;
    bubble.lang = LANG_CODES[language] || "en";
    history.push({ role: "assistant", content: answer });
    if (language && language !== chosen) addMsg(`No ${chosen} version of this answer yet. Showing the English guide answer.`, "note");
  } catch (e) {
    history.pop();
    bubble.textContent = "Sorry, something went wrong. " + e.message;
  }
  sendBtn.disabled = false;
}

// Suggested questions, shown in the selected language when the guide has a translation.
const LANG_CODES = { "English": "en", "Nigerian Pidgin": "pcm", "Hausa": "ha", "Yoruba": "yo", "Igbo": "ig" };
let guide = [];
function renderChips() {
  const lang = $("lang").value;
  $("chips").replaceChildren(...guide.slice(0, 8).map(e => {
    const text = e.translations?.[lang]?.question || e.question;
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.textContent = text;
    b.lang = e.translations?.[lang] ? LANG_CODES[lang] : "en";
    b.addEventListener("click", () => ask(text));
    return b;
  }));
}
fetch("/data/voter_guide.json").then(r => r.json()).then(g => { guide = g; renderChips(); }).catch(() => {});

// Welcome message in each language. It follows the language picker until the first question is asked.
const WELCOME = {
  "English": "Hello! Ask me anything about registering, getting your PVC, voting on election day, or how results are shared. Pick your language above.",
  "Nigerian Pidgin": "How far! Ask me anything about registration, how to get your PVC, how to vote for election day, or how dem dey share results. Choose your language for up.",
  "Hausa": "Sannu! Ka tambaye ni komai game da rajista, samun PVC ɗinka, jefa ƙuri'a a ranar zaɓe, ko yadda ake raba sakamako. Zaɓi harshenka a sama.",
  "Yoruba": "Ẹ kú àbọ̀! Ẹ bi mí ní ohunkóhun nípa ìforúkọsílẹ̀, gbígba PVC yín, dídìbò ní ọjọ́ ìdìbò, tàbí bí wọ́n ṣe ń pín èsì ìdìbò. Ẹ yan èdè yín lókè.",
  "Igbo": "Nnọọ! Jụọ m ihe ọ bụla gbasara ndebanye aha, inweta PVC gị, ịtụ vootu n'ụbọchị ntuli aka, ma ọ bụ otu esi ekesa nsonaazụ. Họrọ asụsụ gị n'elu.",
};
const welcome = addMsg("", "bot");
function renderWelcome() {
  if (history.length) return;
  const lang = $("lang").value;
  welcome.textContent = WELCOME[lang] || WELCOME.English;
  welcome.lang = LANG_CODES[lang] || "en";
}
renderWelcome();
$("lang").addEventListener("change", () => { renderChips(); renderWelcome(); });

/* ---------- Hero slide buttons ---------- */
const VOTE_BUYING_Q = "Someone is offering money for my vote. What do I do?";
function goToTab(id) {
  $(id).click();
  document.querySelector(".tabs").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}
initHero({
  onAction(action) {
    if (action === "check") return goToTab("tab-check");
    goToTab("tab-ask");
    if (action === "votebuy") {
      const e = guide.find(g => g.question === VOTE_BUYING_Q);
      const lang = $("lang").value;
      if (e) return ask(e.translations?.[lang]?.question || e.question);
    }
    q.focus({ preventScroll: true });
  },
});
$("composer").addEventListener("submit", e => { e.preventDefault(); ask(q.value); });
q.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(q.value); } });

fetch("/api/status").then(r => r.json()).then(s => {
  aiOn = s.ai;
  $("mode").textContent = aiOn
    ? "AI mode: answers in your chosen language, grounded in the built-in voter guide."
    : "Guide mode: built-in answers to common questions in all five languages. AI answers to any question can be switched on by the site owner.";
}).catch(() => { $("mode").textContent = "Can't reach the server. Is it running?"; });

/* ---------- Result checker ---------- */
let units = [], results = [];
const sevLabel = { critical: "Critical", warning: "Warning", review: "Review", clean: "Clean" };
const DEFAULT_REPORT = 'Press "Write report" for a plain-language summary of the flags, with verification steps for observers.';

function render() {
  const s = summarise(results);
  $("tiles").innerHTML = [
    ["info", "Polling units checked", s.total], ["crit", "Critical flags", s.critical], ["warn", "Warnings", s.warning],
    ["info", "Need review", s.review], ["ok", "Clean", s.clean], ["crit", "Sheet vs IReV mismatches", s.mismatches],
  ].map(([c, l, n]) => `<div class="tile ${c}"><div class="n">${n}</div><div class="l">${l}</div></div>`).join("");

  const flagged = results.filter(r => r.sev !== "clean");
  $("flagTable").innerHTML = flagged.length
    ? `<thead><tr><th>Severity</th><th>Polling unit</th><th>What to verify</th></tr></thead><tbody>${flagged.map(r =>
      `<tr><td><span class="sev ${r.sev}">${sevLabel[r.sev]}</span></td><td><strong>${esc(r.code)}</strong><br><span class="small">${esc(r.name)} · ${esc(r.ward)}</span></td><td><ul class="flags">${r.flags.map(f => `<li>${esc(f.text)}</li>`).join("")}</ul></td></tr>`).join("")}</tbody>`
    : "<tbody><tr><td>No polling units were flagged.</td></tr></tbody>";

  $("allTable").innerHTML = `<thead><tr><th>PU</th><th>Status</th><th>Registered</th><th>Accredited</th><th>Turnout</th><th>A</th><th>B</th><th>C</th><th>Rejected</th><th>IReV (A / B / C)</th></tr></thead><tbody>${
    results.map(r => `<tr><td><strong>${esc(r.code)}</strong><br><span class="small">${esc(r.name)}</span></td><td><span class="sev ${r.sev}">${sevLabel[r.sev]}</span></td><td class="num">${r.registered}</td><td class="num">${r.accredited}</td><td class="num">${(r.turnout * 100).toFixed(1)}%</td><td class="num">${r.paper.A}</td><td class="num">${r.paper.B}</td><td class="num">${r.paper.C}</td><td class="num">${r.rejected}</td><td class="num">${r.irev ? `${r.irev.A} / ${r.irev.B} / ${r.irev.C}` : "Not uploaded"}</td></tr>`).join("")}</tbody>`;
  $("report").textContent = DEFAULT_REPORT;
}

function load(text, label) {
  try {
    units = toUnits(text); results = analyse(units);
    $("datasetLabel").textContent = label; $("csvMsg").textContent = "";
    render();
  } catch (e) { $("csvMsg").textContent = e.message; }
}

const loadSample = () => fetch("/data/sample_results.csv").then(r => r.text()).then(t => load(t, "Sample data: fictional polling units"));
$("loadSample").addEventListener("click", loadSample);
$("csv").addEventListener("change", e => {
  const f = e.target.files[0];
  if (f) f.text().then(t => load(t, "Your file: " + f.name));
  e.target.value = "";
});
$("copyTpl").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(COLUMNS.join(",") + "\n01-001,Example School,Ward 01,800,400,150,150,80,20,150,150,80");
    $("csvMsg").textContent = "Template copied. Leave the IReV columns blank if a result wasn't uploaded.";
  } catch { $("csvMsg").textContent = "Copy failed. Columns: " + COLUMNS.join(","); }
});

$("genReport").addEventListener("click", async () => {
  const btn = $("genReport"), out = $("report");
  btn.disabled = true; out.textContent = "Writing…";
  try {
    const { report, source } = await postJSON("/api/report", { language: $("lang2").value, units });
    out.textContent = report + (source === "template" && $("lang2").value !== "English" ? "\n\n(Translation needs AI mode.)" : "");
  } catch { out.textContent = templateReport(results) + "\n\n(Server unavailable, so this is the standard report.)"; }
  btn.disabled = false;
});
$("copyReport").addEventListener("click", async e => {
  try { await navigator.clipboard.writeText($("report").textContent); e.target.textContent = "Copied"; setTimeout(() => e.target.textContent = "Copy", 1500); }
  catch { e.target.textContent = "Copy failed"; }
});

loadSample();
