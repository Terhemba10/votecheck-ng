import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCSV, toUnits, analyse, summarise } from "../src/checker.js";

const csv = readFileSync(new URL("../data/sample_results.csv", import.meta.url), "utf8");
const results = analyse(toUnits(csv));
const byCode = Object.fromEntries(results.map(r => [r.code, r]));
const rules = code => byCode[code].flags.map(f => f.rule).sort();

test("parses quoted CSV fields", () => {
  assert.deepEqual(parseCSV('a,b\n"x, y","say ""hi"""\n'), [["a", "b"], ["x, y", 'say "hi"']]);
});

test("rejects files with missing columns", () => {
  assert.throws(() => toUnits("pu_code,registered\n1,2\n"), /Missing columns/);
});

test("rejects negative or non-numeric figures", () => {
  const head = "pu_code,pu_name,ward,registered,accredited,paper_a,paper_b,paper_c,rejected,irev_a,irev_b,irev_c\n";
  assert.throws(() => toUnits(head + "1,x,w,abc,10,1,1,1,0,1,1,1\n"), /must be a number/);
  assert.throws(() => toUnits(head + "1,x,w,100,-5,1,1,1,0,1,1,1\n"), /must be a number/);
});

test("IReV mismatch is critical (01-003)", () => {
  assert.equal(byCode["01-003"].sev, "critical");
  assert.deepEqual(rules("01-003"), ["irev_mismatch"]);
  assert.match(byCode["01-003"].flags[0].text, /Party B: result sheet shows 149, IReV shows 194 \(\+45\)/);
});

test("over-voting is critical (02-003)", () => {
  assert.equal(byCode["02-003"].sev, "critical");
  assert.deepEqual(rules("02-003"), ["over_voting"]);
});

test("over-voting plus 100% turnout (03-003)", () => {
  assert.equal(byCode["03-003"].sev, "critical");
  assert.deepEqual(rules("03-003"), ["high_turnout", "over_voting"]);
});

test("missing IReV upload is a warning (01-004)", () => {
  assert.equal(byCode["01-004"].sev, "warning");
  assert.deepEqual(rules("01-004"), ["missing_irev"]);
});

test("high turnout and one-sided result (02-004)", () => {
  assert.equal(byCode["02-004"].sev, "warning");
  assert.deepEqual(rules("02-004"), ["high_turnout", "one_sided"]);
});

test("zero accredited needs review (03-004)", () => {
  assert.equal(byCode["03-004"].sev, "review");
  assert.deepEqual(rules("03-004"), ["zero_accredited"]);
});

test("accredited above registered is critical", () => {
  const [r] = analyse([{ code: "x", name: "", ward: "", registered: 100, accredited: 120, rejected: 0,
    paper: { A: 40, B: 40, C: 40 }, irev: { A: 40, B: 40, C: 40 } }]);
  assert.ok(r.flags.some(f => f.rule === "accredited_exceeds_registered"));
});

test("eight sample units are clean and results are sorted by severity", () => {
  const s = summarise(results);
  assert.deepEqual(s, { total: 14, critical: 3, warning: 2, review: 1, clean: 8, mismatches: 1 });
  assert.equal(results[0].sev, "critical");
  assert.equal(results.at(-1).sev, "clean");
});

test("same data always gives the same flags", () => {
  assert.deepEqual(analyse(toUnits(csv)), analyse(toUnits(csv)));
});
