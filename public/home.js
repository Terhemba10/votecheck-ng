import { renderChrome, getLang, onLangChange, esc, t, LANG_CODES } from "/common.js";
import { initHero } from "/hero.js";
import { SCENE_VOTERS, SCENE_BALLOT, SCENE_REFUSE } from "/scenes.js";
import { slug } from "/faq-data.js";

renderChrome("home");

// Scenes carry a little text (ballot heading, party labels, polling unit sign, descriptions), so redraw them per language.
const SCENES = { voters: SCENE_VOTERS, ballot: SCENE_BALLOT, refuse: SCENE_REFUSE };
const drawScenes = () => document.querySelectorAll(".scene-slot").forEach(s => { s.innerHTML = SCENES[s.dataset.scene](t); });
drawScenes();
initHero({ t });

// Three common questions, in the chosen language, linking to their answers on the FAQ page.
const TEASER = ["How do I register or check my registration?", "I lost my PVC. What can I do?", "How are results counted and shared?"];
let guide = [];
function renderTeaser() {
  const lang = getLang();
  document.getElementById("faq-teaser").innerHTML = TEASER.map(q => guide.find(g => g.question === q)).filter(Boolean).map(e => {
    const tr = e.translations?.[lang] || e;
    return `<a href="/faq#${slug(e.question)}" lang="${e.translations?.[lang] ? LANG_CODES[lang] : "en"}"><strong>${esc(tr.question)}</strong><span>${esc(tr.answer.slice(0, 110))}…</span></a>`;
  }).join("");
}
fetch("/data/voter_guide.json").then(r => r.json()).then(g => { guide = g; renderTeaser(); }).catch(() => {});
onLangChange(() => { renderTeaser(); drawScenes(); document.getElementById("hero").relabel?.(); });
