import { test } from "node:test";
import assert from "node:assert/strict";
import { STRINGS, translate } from "../public/i18n.js";
import { LANGUAGES } from "../src/prompts.js";

const EN = STRINGS.English;
const vars = s => (s.match(/\{\w+\}/g) || []).sort();

test("every language has every interface string", () => {
  for (const lang of LANGUAGES) {
    const missing = Object.keys(EN).filter(k => !(k in STRINGS[lang]));
    assert.deepEqual(missing, [], `${lang} is missing: ${missing.join(", ")}`);
  }
});

test("translations keep the same {placeholders} as English, so no figure is dropped", () => {
  for (const lang of LANGUAGES) for (const [k, s] of Object.entries(STRINGS[lang]))
    assert.deepEqual(vars(s), vars(EN[k] ?? s), `${lang} ${k}`);
});

test("translate fills placeholders and falls back to English", () => {
  assert.equal(translate("Hausa", "sheet.sum", { n: 393 }), "Ƙuri'un jam'iyyu sun haɗu zuwa 393.");
  assert.equal(translate("Klingon", "nav.home"), "Home");
  assert.equal(translate("Igbo", "no.such.key"), "no.such.key");
});

test("no interface string calls anything fraud", () => {
  for (const lang of LANGUAGES) for (const [k, s] of Object.entries(STRINGS[lang]))
    assert.doesNotMatch(s, /\bfraud|rigg(ed|ing)\b/i, `${lang} ${k}`);
});
