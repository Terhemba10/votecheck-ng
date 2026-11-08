import { test } from "node:test";
import assert from "node:assert/strict";
import { GUIDE, guideReply, guideAnswer, normalize } from "../src/guide.js";
import { LANGUAGES } from "../src/prompts.js";

const OTHER_LANGUAGES = LANGUAGES.filter(l => l !== "English");
const entry = q => GUIDE.find(e => e.question === q);

test("every guide entry has a complete translation in every language", () => {
  for (const e of GUIDE) for (const lang of OTHER_LANGUAGES) {
    const t = e.translations?.[lang];
    assert.ok(t, `${e.question}: missing ${lang}`);
    assert.ok(t.question && t.answer && t.keywords?.length, `${e.question}: incomplete ${lang}`);
  }
});

test("translations add no new URLs or phone numbers", () => {
  for (const e of GUIDE) for (const lang of OTHER_LANGUAGES) {
    const a = e.translations[lang].answer;
    for (const url of a.match(/\b[\w-]+\.(org|com|ng|gov)\b/g) || []) assert.equal(url, "inecnigeria.org", `${lang}: ${url}`);
    assert.doesNotMatch(a, /\d{7,}|\+234/, `${lang} answer contains a phone number`);
  }
});

test("English answers are unchanged", () => {
  assert.equal(guideAnswer("I lost my PVC, what do I do?"), entry("I lost my PVC. What can I do?").answer);
  assert.deepEqual(guideReply("Where do I vote?"), { answer: entry("Where do I vote?").answer, language: "English" });
});

test("a suggested question in Yoruba gets the Yoruba answer", () => {
  const e = entry("Where do I vote?");
  assert.deepEqual(guideReply(e.translations.Yoruba.question, "Yoruba"), { answer: e.translations.Yoruba.answer, language: "Yoruba" });
});

test("typed Yoruba without tone marks still matches", () => {
  assert.equal(normalize("Níbo ni mo ti máa dìbò?"), "nibo ni mo ti maa dibo");
  assert.equal(guideAnswer("nibo ni mo ti maa dibo", "Yoruba"), entry("Where do I vote?").translations.Yoruba.answer);
});

test("typed Hausa without hooked letters still matches", () => {
  assert.equal(guideAnswer("an bani kudi don sayen kuri'a", "Hausa"), entry("Someone is offering money for my vote. What do I do?").translations.Hausa.answer);
});

test("an English question with Igbo selected gets the Igbo answer", () => {
  assert.equal(guideAnswer("I lost my PVC", "Igbo"), entry("I lost my PVC. What can I do?").translations.Igbo.answer);
});

test("asking who to vote for is declined in every language", () => {
  for (const lang of OTHER_LANGUAGES) {
    const e = entry("Who should I vote for?");
    assert.equal(guideAnswer(e.translations[lang].question, lang), e.translations[lang].answer);
  }
});

test("short keywords only match at the start of a word", () => {
  // "id" (an English keyword) must not match inside the Yoruba word "ìdìbò".
  assert.notEqual(guideAnswer("ọjọ́ ìdìbò", "Yoruba"), entry("What do I need to bring to vote?").translations.Yoruba.answer);
});

test("unknown questions get the fallback in the chosen language", () => {
  const r = guideReply("xyzzy", "Hausa");
  assert.equal(r.language, "Hausa");
  assert.match(r.answer, /inecnigeria\.org/);
  assert.equal(guideReply("xyzzy", "Klingon").language, "English");
});
