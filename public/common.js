// Shared by every page: language, header with navigation and account, footer, and small helpers.
import { translate } from "/i18n.js";

export const LANGUAGES = ["English", "Nigerian Pidgin", "Hausa", "Yoruba", "Igbo"];
export const LANG_LABELS = { "English": "English", "Nigerian Pidgin": "Pidgin", "Hausa": "Hausa", "Yoruba": "Yorùbá", "Igbo": "Igbo" };
export const LANG_CODES = { "English": "en", "Nigerian Pidgin": "pcm", "Hausa": "ha", "Yoruba": "yo", "Igbo": "ig" };
export const $ = id => document.getElementById(id);
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---------- Language ----------
// The chosen language is remembered on this device only. null means "not chosen yet".
function storedLang() {
  try { const l = localStorage.getItem("vc-lang"); if (LANGUAGES.includes(l)) return l; } catch {}
  return null;
}
let current = storedLang() || "English";
export const getLang = () => current;
export const t = (key, vars) => translate(current, key, vars);

const langListeners = [];
export function onLangChange(fn) { langListeners.push(fn); }
export function setLang(l) {
  current = l;
  try { localStorage.setItem("vc-lang", l); } catch {}
  applyI18n();
  langListeners.forEach(fn => fn(l));
}

// Fills every element marked with data-i18n* attributes, and sets the page language and title.
export function applyI18n(root = document) {
  document.documentElement.lang = LANG_CODES[current];
  root.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-html]").forEach(el => { el.innerHTML = t(el.dataset.i18nHtml, LINKS); });
  root.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  root.querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  const titleKey = document.body.dataset.title;
  if (titleKey) document.title = titleKey === "home" ? "VoteCheck NG" : `${t(titleKey)} · VoteCheck NG`;
  const sel = $("site-lang"); if (sel) sel.value = current;
}

// Links used inside translated sentences ({inec}, {irev}).
const LINKS = {
  inec: `<a href="https://inecnigeria.org" target="_blank" rel="noopener">inecnigeria.org</a>`,
  irev: `<a href="https://www.inecelectionresults.ng" target="_blank" rel="noopener">IReV</a>`,
};

// First visit: ask which language to use. Each option is written in its own language.
export function chooseLanguageIfNeeded() {
  if (storedLang()) return;
  const box = document.createElement("div");
  box.className = "lang-chooser";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-labelledby", "lang-chooser-h");
  box.innerHTML = `<div class="lang-card">
      <h2 id="lang-chooser-h">${LANGUAGES.map(l => esc(translate(l, "lang.choose"))).filter((v, i, a) => a.indexOf(v) === i).join(" · ")}</h2>
      <div class="lang-options">${LANGUAGES.map(l => `<button type="button" class="lang-option" data-lang="${l}" lang="${LANG_CODES[l]}">
        <strong>${LANG_LABELS[l]}</strong><span>${esc(translate(l, "lang.continue"))}</span></button>`).join("")}</div>
      <p class="small">${LANGUAGES.slice(0, 1).map(l => esc(translate(l, "lang.change"))).join("")}</p>
    </div>`;
  box.addEventListener("click", e => {
    const b = e.target.closest("[data-lang]");
    if (!b) return;
    setLang(b.dataset.lang);
    box.remove();
  });
  document.body.appendChild(box);
  box.querySelector(".lang-option").focus();
}

export async function postJSON(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && url !== "/api/login") { location.href = "/login"; throw new Error(t("signin")); }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ---------- Header and footer ----------
const NAV = [
  ["home", "/", "nav.home"], ["polling", "/polling-unit", "nav.polling"], ["results", "/results", "nav.results"],
  ["ask", "/ask", "nav.ask"], ["sheet", "/result-sheet", "nav.sheet"], ["faq", "/faq", "nav.faq"],
];
const LOGO = `<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="10" fill="#008751"/><rect x="14" width="12" height="40" fill="#fff"/><path d="M11 21l6 6 12-13" fill="none" stroke="#0B3B26" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Draws the header and footer into <header id="site-header"> and <footer id="site-footer">.
export async function renderChrome(active) {
  const header = $("site-header"), footer = $("site-footer");
  if (header) {
    header.className = "topbar";
    header.innerHTML = `
      <div class="inner topbar-row">
        <a class="brand" href="/" aria-label="VoteCheck NG">${LOGO}
          <span><span class="name">VoteCheck <span>NG</span></span><span class="sub" data-i18n="brand.sub"></span></span></a>
        <div class="topbar-tools">
          <label class="lang-pick"><span class="sr-only" data-i18n="language"></span>
            <select id="site-lang">${LANGUAGES.map(l => `<option value="${l}" lang="${LANG_CODES[l]}">${LANG_LABELS[l]}</option>`).join("")}</select></label>
          <div class="account" id="account"></div>
          <button class="menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav"><span class="sr-only" data-i18n="menu"></span><i></i><i></i><i></i></button>
        </div>
      </div>
      <nav class="site-nav" id="site-nav" data-i18n-aria="nav.main"><div class="inner">${NAV.map(([id, href, key]) =>
        `<a href="${href}" data-i18n="${key}"${id === active ? ' aria-current="page"' : ""}></a>`).join("")}</div></nav>
      <div class="flagline" aria-hidden="true"></div>`;
    $("site-lang").addEventListener("change", e => setLang(e.target.value));
    const btn = $("menu-btn"), nav = $("site-nav");
    btn.addEventListener("click", () => { const open = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", String(open)); });
  }
  if (footer) {
    footer.className = "site-footer";
    footer.innerHTML = `<div class="inner">
      <p><strong data-i18n="footer.lead"></strong> <span data-i18n-html="footer.links"></span></p>
      <p data-i18n="footer.privacy"></p>
    </div>`;
  }
  applyI18n();
  chooseLanguageIfNeeded();
  onLangChange(renderAccount);
  await renderAccount();
}

let me = null;
async function renderAccount() {
  const box = $("account");
  if (!box) return;
  try {
    me = me || await (await fetch("/api/me")).json();
    // Sign-in not set up on this server: the site is simply open, so show nothing here.
    if (!me.authEnabled) { box.innerHTML = ""; return; }
    if (!me.user) { box.innerHTML = `<a class="btn ghost small" href="/login">${esc(t("signin"))}</a>`; return; }
    box.innerHTML = `<span class="who" title="${esc(me.user.email)}">${esc(me.user.name.split(" ")[0])}</span><button class="btn ghost small" id="sign-out" type="button">${esc(t("signout"))}</button>`;
    $("sign-out").addEventListener("click", async () => { await postJSON("/api/logout", {}); location.href = "/login"; });
  } catch { box.textContent = ""; }
}
