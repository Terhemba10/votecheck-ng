// FAQ: every entry of the voter guide, in the chosen language. Same source as the chat, so answers always match.
import { renderChrome, getLang, onLangChange, $, esc, t, LANG_CODES } from "/common.js";
import { slug } from "/faq-data.js";

renderChrome("faq");

let guide = [];
function render() {
  const lang = getLang(), open = new Set([...document.querySelectorAll("#faq-list details[open]")].map(d => d.id));
  if (!open.size && location.hash) open.add(location.hash.slice(1));
  $("faq-list").innerHTML = guide.map(e => {
    const t = e.translations?.[lang] || e, id = slug(e.question), code = e.translations?.[lang] ? LANG_CODES[lang] : "en";
    return `<details id="${id}"${open.has(id) ? " open" : ""} lang="${code}"><summary>${esc(t.question)}</summary><p class="answer">${esc(t.answer)}</p></details>`;
  }).join("");
  if (location.hash && !render.scrolled) { render.scrolled = true; document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "start" }); }
}
fetch("/data/voter_guide.json").then(r => r.json()).then(g => { guide = g; render(); }).catch(() => { $("faq-list").textContent = t("faq.fail"); });
onLangChange(render);
