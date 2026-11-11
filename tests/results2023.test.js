import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkStateResults, checkLgaResults } from "../src/results2023.js";

const data = JSON.parse(readFileSync(new URL("../data/results_2023.json", import.meta.url), "utf8"));
const lga = JSON.parse(readFileSync(new URL("../data/results_2023_lga.json", import.meta.url), "utf8"));
const stateRow = name => data.states.find(s => s.state === name);

test("every state and the FCT has a list of local government areas", () => {
  assert.deepEqual(Object.keys(lga.states).sort(), data.states.map(s => s.state).sort());
  for (const [st, list] of Object.entries(lga.states)) assert.ok(list.length > 0, `${st} has no LGAs`);
});

test("Bayelsa's LGAs are complete and add up to its state total", () => {
  const r = checkLgaResults(stateRow("Bayelsa"), lga.states.Bayelsa);
  assert.equal(r.complete, true);
  assert.equal(r.stateMatch, true);
});

test("Lagos's LGAs are complete but come to fewer votes than its state row", () => {
  const r = checkLgaResults(stateRow("Lagos"), lga.states.Lagos);
  assert.equal(r.have, 20);
  assert.equal(r.stateMatch, false);
  assert.equal(r.diff, -32832);
});

test("a state with missing LGA figures is not compared with its total", () => {
  const r = checkLgaResults(stateRow("Abia"), lga.states.Abia);
  assert.equal(r.have, 0);
  assert.equal(r.complete, false);
  assert.equal(r.stateMatch, null);
});

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
