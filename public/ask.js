import { renderChrome, getLang, onLangChange, $, postJSON, t, LANG_CODES, LANG_LABELS } from "/common.js";

renderChrome("ask");

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
  const bubble = addMsg(t("ask.thinking"), "bot");
  try {
    const chosen = getLang();
    const { answer, language } = await postJSON("/api/ask", { language: chosen, messages: history });
    bubble.textContent = answer;
    bubble.lang = LANG_CODES[language] || "en";
    history.push({ role: "assistant", content: answer });
    if (language && language !== chosen) addMsg(t("ask.noVersion", { lang: LANG_LABELS[chosen] }), "note");
  } catch (e) {
    history.pop();
    bubble.textContent = t("ask.failed", { msg: e.message });
  }
  sendBtn.disabled = false;
}

// Suggested questions, in the chosen language.
let guide = [];
const questionIn = (e, lang) => e.translations?.[lang]?.question || e.question;
function renderChips() {
  const lang = getLang();
  $("chips").replaceChildren(...guide.slice(0, 8).map(e => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.textContent = questionIn(e, lang);
    b.lang = e.translations?.[lang] ? LANG_CODES[lang] : "en";
    b.addEventListener("click", () => ask(questionIn(e, getLang())));
    return b;
  }));
}

const WELCOME = {
  "English": "Hello! Ask me anything about registering, getting your PVC, voting on election day, or how results are shared.",
  "Nigerian Pidgin": "How far! Ask me anything about registration, how to get your PVC, how to vote for election day, or how dem dey share results.",
  "Hausa": "Sannu! Ka tambaye ni komai game da rajista, samun PVC ɗinka, jefa ƙuri'a a ranar zaɓe, ko yadda ake raba sakamako.",
  "Yoruba": "Ẹ kú àbọ̀! Ẹ bi mí ní ohunkóhun nípa ìforúkọsílẹ̀, gbígba PVC yín, dídìbò ní ọjọ́ ìdìbò, tàbí bí wọ́n ṣe ń pín èsì ìdìbò.",
  "Igbo": "Nnọọ! Jụọ m ihe ọ bụla gbasara ndebanye aha, inweta PVC gị, ịtụ vootu n'ụbọchị ntuli aka, ma ọ bụ otu esi ekesa nsonaazụ.",
};
const welcome = addMsg("", "bot");
function renderWelcome() {
  if (history.length) return;
  const lang = getLang();
  welcome.textContent = WELCOME[lang] || WELCOME.English;
  welcome.lang = LANG_CODES[lang] || "en";
}
renderWelcome();
onLangChange(() => { renderChips(); renderWelcome(); renderMode(); });

// Links from other pages can open a question directly, for example /ask?topic=vote-buying.
const TOPICS = { "vote-buying": "Someone is offering money for my vote. What do I do?", "where-to-vote": "Where do I vote?" };
fetch("/data/voter_guide.json").then(r => r.json()).then(g => {
  guide = g; renderChips();
  const topic = TOPICS[new URLSearchParams(location.search).get("topic")];
  const e = topic && guide.find(x => x.question === topic);
  if (e) ask(questionIn(e, getLang()));
}).catch(() => {});

$("composer").addEventListener("submit", e => { e.preventDefault(); ask(q.value); });
q.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(q.value); } });

// Guide mode or AI mode, said in the chosen language.
let status = null;
function renderMode() {
  $("mode").textContent = status === null ? "" : status === "offline" ? t("ask.offline") : t(status.ai ? "ask.modeAI" : "ask.modeGuide");
}
fetch("/api/status").then(r => r.json()).then(s => { status = s; renderMode(); }).catch(() => { status = "offline"; renderMode(); });
