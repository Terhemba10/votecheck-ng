import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { toUnits, analyse, templateReport } from "../src/checker.js";
import { REPORT_TEXT } from "../src/report_text.js";
import { LANGUAGES } from "../src/prompts.js";

const csv = readFileSync(new URL("../data/sample_results.csv", import.meta.url), "utf8");
const results = analyse(toUnits(csv));
const RULES = Object.keys(REPORT_TEXT.English.flags);

test("every language has wording for every rule, label and section", () => {
  for (const lang of LANGUAGES) {
    const T = REPORT_TEXT[lang];
    assert.ok(T, `missing ${lang}`);
    for (const rule of RULES) assert.equal(typeof T.flags[rule], "function", `${lang}: no wording for ${rule}`);
    for (const sev of ["critical", "warning", "review"]) assert.ok(T.labels[sev], `${lang}: no label for ${sev}`);
    assert.ok(T.none && T.next && T.summary(1, 1));
  }
});

test("English report is unchanged", () => {
  const r = templateReport(results);
  assert.match(r, /^Summary: 14 polling units checked, 6 flagged for verification\./);
  assert.match(r, /Party B: result sheet shows 149, IReV shows 194 \(\+45\)\./);
  assert.match(r, /These flags are automated checks, not findings of wrongdoing\.$/);
  assert.equal(templateReport(results, "English"), r);
});

test("each language gets its own wording but the same figures", () => {
  const english = templateReport(results);
  const figures = s => (s.match(/\d+(\.\d+)?%?/g) || []).filter(n => n !== "2026").join(" ");
  for (const lang of LANGUAGES.filter(l => l !== "English")) {
    const r = templateReport(results, lang);
    assert.notEqual(r, english, `${lang} report is still English`);
    assert.ok(r.startsWith(REPORT_TEXT[lang].summary(14, 6)), `${lang}: wrong summary`);
    for (const code of ["01-003", "02-003", "03-003", "01-004", "02-004", "03-004"]) assert.ok(r.includes(code), `${lang}: missing ${code}`);
    assert.equal(figures(r), figures(english), `${lang}: figures differ from English`);
  }
});

test("reports never call a flag fraud", () => {
  for (const lang of LANGUAGES) assert.doesNotMatch(templateReport(results, lang), /fraud|rigg/i);
});

test("an unknown language falls back to English", () => {
  assert.equal(templateReport(results, "Klingon"), templateReport(results));
});

test("no flags gives the 'nothing flagged' message in the chosen language", () => {
  const clean = results.filter(r => r.sev === "clean");
  assert.equal(templateReport(clean, "Hausa"), REPORT_TEXT.Hausa.none);
});
