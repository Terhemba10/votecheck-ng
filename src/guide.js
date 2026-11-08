// Loads the voter guide and finds the best built-in answer by keyword (used when the AI is unavailable).
// Each guide entry has English text plus a `translations` object keyed by language name.
import { readFileSync } from "node:fs";

export const GUIDE = JSON.parse(readFileSync(new URL("../data/voter_guide.json", import.meta.url), "utf8"));

const FALLBACK = {
  "English": "I don't have an answer for that yet. Please check INEC's official website, inecnigeria.org, or ask at your INEC LGA office.",
  "Nigerian Pidgin": "I no get answer for that one yet. Abeg check INEC official website, inecnigeria.org, or ask for your INEC LGA office.",
  "Hausa": "Ba ni da amsar wannan tukuna. Da fatan ka duba shafin intanet na INEC na hukuma, inecnigeria.org, ko ka tambaya a ofishin INEC na ƙaramar hukumarka (LGA).",
  "Yoruba": "Mi ò tíì ní ìdáhùn sí ìbéèrè yẹn. Jọ̀wọ́ ṣàyẹ̀wò ojú òpó wẹ́ẹ̀bù INEC, inecnigeria.org, tàbí béèrè ní ọ́fíìsì INEC ní ìjọba ìbílẹ̀ (LGA) rẹ.",
  "Igbo": "Enweghị m azịza maka nke ahụ ugbu a. Biko lelee weebụsaịtị INEC, inecnigeria.org, ma ọ bụ jụọ n'ọfịs INEC nke ọchịchị ime obodo (LGA) gị.",
};

// Lower-case, drop tone marks and dots (ẹ → e, ọ́ → o), map Hausa hooked letters (ɗ → d),
// and turn punctuation into spaces, so "Níbo" and "nibo" match the same keyword.
export function normalize(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
    .replace(/ɗ/g, "d").replace(/ƙ/g, "k").replace(/ɓ/g, "b").replace(/ƴ/g, "y")
    .replace(/[‘’`]/g, "'").replace(/[^\p{L}\p{N}']+/gu, " ").trim();
}

// Pre-compute, for every entry, its keywords and questions in all languages.
const INDEX = GUIDE.map(entry => {
  const versions = [entry, ...Object.values(entry.translations || {})];
  return {
    entry,
    keywords: [...new Set(versions.flatMap(v => v.keywords || []).map(normalize))],
    questions: versions.map(v => normalize(v.question)),
  };
});

// Returns { answer, language }. `language` is the language the answer is actually in,
// so the app can tell the user when no translation exists.
export function guideReply(question, language = "English") {
  const t = normalize(question);
  const padded = " " + t + " ";
  let best = null, bestScore = 0;
  for (const item of INDEX) {
    // Clicking a suggested question sends its exact text: always pick that entry.
    // Otherwise, score keywords that start a word, so "id" doesn't match inside "ìdìbò".
    const score = item.questions.includes(t) ? Infinity
      : item.keywords.reduce((s, k) => padded.includes(" " + k) ? s + k.length : s, 0);
    if (score > bestScore) { bestScore = score; best = item.entry; }
  }
  const translated = language !== "English" && best?.translations?.[language];
  if (best) return translated ? { answer: translated.answer, language } : { answer: best.answer, language: "English" };
  return FALLBACK[language] ? { answer: FALLBACK[language], language } : { answer: FALLBACK.English, language: "English" };
}

export function guideAnswer(question, language = "English") {
  return guideReply(question, language).answer;
}
