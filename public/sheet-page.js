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
