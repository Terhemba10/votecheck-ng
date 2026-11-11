import { renderChrome, getLang, onLangChange, $, esc, t, LANG_CODES } from "/common.js";

renderChrome("polling");

// ---------- VIN lookup demo ----------
// Searches FICTIONAL test voters only (data/demo_voters.json), entirely in the browser: nothing typed here is sent anywhere.
// A real lookup would call INEC's service, and only with INEC's written authorisation.
let voters = [];
let lastResult = null; // re-rendered when the language changes
const VIN_RE = /^[A-Z0-9]{19}$/;

function renderResult() {
  const box = $("vin-result");
  if (!lastResult) { box.innerHTML = ""; return; }
  if (lastResult.error) { box.innerHTML = `<p class="small" style="color:var(--crit)">${esc(t(lastResult.error))}</p>`; return; }
  const v = lastResult.voter;
  box.innerHTML = `<div class="vin-card">
    <div class="row" style="justify-content:space-between"><strong>${esc(t("demo.found"))}</strong><span class="sev warning">${esc(t("demo.badge"))}</span></div>
    <dl>
      <dt>${esc(t("demo.state"))}</dt><dd>${esc(v.state)}</dd>
      <dt>${esc(t("demo.lga"))}</dt><dd>${esc(v.lga)}</dd>
      <dt>${esc(t("demo.ward"))}</dt><dd>${esc(v.ward)}</dd>
      <dt>${esc(t("demo.pu"))}</dt><dd>${esc(v.pu)}</dd>
      <dt>${esc(t("demo.code"))}</dt><dd class="mono">${esc(v.code)}</dd>
    </dl></div>`;
}

$("vin-form").addEventListener("submit", e => {
  e.preventDefault();
  const vin = $("vin").value.trim().toUpperCase().replace(/\s+/g, "");
  if (!VIN_RE.test(vin)) lastResult = { error: "demo.bad" };
  else {
    const voter = voters.find(x => x.vin === vin);
    lastResult = voter ? { voter } : { error: "demo.notFound" };
  }
  renderResult();
});

fetch("/data/demo_voters.json").then(r => r.json()).then(d => {
  voters = d.voters;
  $("vin-samples").innerHTML = voters.slice(0, 3).map(v =>
    `<button type="button" class="linkish mono" data-vin="${v.vin}">${v.vin}</button>`).join(" ");
  $("vin-samples").addEventListener("click", e => {
    const b = e.target.closest("[data-vin]");
    if (b) { $("vin").value = b.dataset.vin; $("vin-form").requestSubmit(); }
  });
}).catch(() => {});

// ---------- The guide's "Where do I vote?" answer, in the chosen language ----------
let entry = null;
function renderAnswer() {
  if (!entry) return;
  const lang = getLang(), tr = entry.translations?.[lang] || entry;
  $("answer-h").textContent = tr.question;
  $("answer").textContent = tr.answer;
  $("answer").lang = $("answer-h").lang = entry.translations?.[lang] ? LANG_CODES[lang] : "en";
}
fetch("/data/voter_guide.json").then(r => r.json()).then(g => { entry = g.find(e => e.question === "Where do I vote?"); renderAnswer(); }).catch(() => {});
onLangChange(() => { renderAnswer(); renderResult(); });
