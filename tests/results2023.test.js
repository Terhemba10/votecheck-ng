import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkStateResults } from "../src/results2023.js";

const data = JSON.parse(readFileSync(new URL("../data/results_2023.json", import.meta.url), "utf8"));

test("the 2023 file has 36 states plus the FCT", () => {
  assert.equal(data.states.length, 37);
  assert.ok(data.states.some(s => s.state === "FCT"));
  assert.ok(data.states.some(s => s.state === "Lagos") && data.states.some(s => s.state === "Kano"));
});

test("declared national totals are INEC's announced figures", () => {
  assert.deepEqual(data.declared, { apc: 8794726, pdp: 6984520, lp: 6101533, nnpp: 1496687, valid: 24025940 });
});

test("the checks find the rows that don't add up in this copy", () => {
  const r = checkStateResults(data);
  assert.deepEqual(r.rows.filter(x => !x.ok).map(x => x.state), ["Kwara", "Yobe"]);
  assert.equal(r.rowsOk, false);
});

test("the checks find that the state sums differ from the declared totals", () => {
  const r = checkStateResults(data);
  assert.equal(r.totalsOk, false);
  assert.deepEqual(Object.fromEntries(r.totals.map(t => [t.key, t.diff])), { apc: 10694, pdp: -4230, lp: -10516, nnpp: -16, valid: 2750 });
});

test("a consistent copy passes every check", () => {
  const fixed = { declared: { apc: 3, pdp: 2, lp: 0, nnpp: 0, valid: 6 }, candidates: [{ key: "apc" }, { key: "pdp" }, { key: "lp" }, { key: "nnpp" }],
    states: [{ state: "X", apc: 2, pdp: 1, lp: 0, nnpp: 0, others: 0, valid: 3 }, { state: "Y", apc: 1, pdp: 1, lp: 0, nnpp: 0, others: 1, valid: 3 }] };
  const r = checkStateResults(fixed);
  assert.equal(r.rowsOk, true);
  assert.equal(r.totalsOk, true);
});
