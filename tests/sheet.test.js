import { test } from "node:test";
import assert from "node:assert/strict";
import { checkSheet, EXAMPLE_SHEET } from "../src/sheet.js";

// A sheet with nothing to verify.
const clean = {
  registered: 900, accredited: 412, parties: [{ name: "A", votes: 156 }, { name: "B", votes: 149 }, { name: "C", votes: 88 }],
  rejected: 9, totalValid: 393, totalCast: 402, poName: "M. Bello", poSigned: true, stamped: true, agentSignatures: 3,
  serialNumber: "EC8A-1", electionDate: "2027-02-20", completedAt: "2027-02-20T17:40", uploadedAt: "2027-02-20T18:05",
};
const rules = s => checkSheet(s).flags.map(f => f.rule).sort();

test("a complete, consistent sheet has nothing to verify", () => {
  assert.deepEqual(checkSheet(clean), { flags: [], sev: "clean", sumParties: 393, cast: 402 });
});

test("party votes that don't add up to the written total are critical", () => {
  assert.deepEqual(rules({ ...clean, totalValid: 400, totalCast: 409 }), ["valid_total_mismatch"]);
});

test("valid plus rejected must equal total cast", () => {
  assert.deepEqual(rules({ ...clean, totalCast: 405 }), ["cast_total_mismatch"]);
});

test("over-voting and accredited above registered are critical", () => {
  assert.deepEqual(rules({ ...clean, accredited: 380 }), ["over_voting"]);
  assert.deepEqual(rules({ ...clean, registered: 400 }), ["accredited_exceeds_registered"]);
});

test("missing signature is critical; missing stamp, name or serial are warnings", () => {
  const r = checkSheet({ ...clean, poSigned: false, stamped: false, poName: " ", serialNumber: "" });
  assert.equal(r.sev, "critical");
  assert.deepEqual(r.flags.map(f => `${f.sev}:${f.rule}`).sort(),
    ["critical:no_po_signature", "warning:no_po_name", "warning:no_serial", "warning:no_stamp"]);
});

test("no agent signatures needs review, not a verdict", () => {
  assert.deepEqual(rules({ ...clean, agentSignatures: 0 }), ["no_agent_signatures"]);
  assert.equal(checkSheet({ ...clean, agentSignatures: 0 }).sev, "review");
});

test("time checks: wrong day, upload before completion, late upload, no upload time", () => {
  assert.deepEqual(rules({ ...clean, completedAt: "2027-02-21T09:00", uploadedAt: "2027-02-21T09:30" }), ["not_election_day"]);
  assert.deepEqual(rules({ ...clean, uploadedAt: "2027-02-20T17:00" }), ["uploaded_before_completed"]);
  assert.deepEqual(rules({ ...clean, uploadedAt: "2027-02-22T18:00" }), ["late_upload"]);
  assert.deepEqual(rules({ ...clean, uploadedAt: "" }), ["no_upload_time"]);
});

test("figures that are not whole numbers are flagged and skipped", () => {
  assert.deepEqual(rules({ ...clean, rejected: -3 }), ["unreadable_figures"]);
  assert.deepEqual(rules({ ...clean, parties: [{ name: "A", votes: "1.5" }] }), ["unreadable_figures"]);
});

test("the fictional example shows several kinds of flag", () => {
  assert.deepEqual(rules(EXAMPLE_SHEET), ["no_po_name", "no_stamp", "uploaded_before_completed"]);
});

test("wording stays neutral", () => {
  const all = checkSheet({ ...clean, poSigned: false, stamped: false, accredited: 10, agentSignatures: 0, uploadedAt: "" });
  for (const f of all.flags) assert.doesNotMatch(f.text, /fraud|invalid|rigg|fake/i);
});

test("same sheet, same result", () => {
  assert.deepEqual(checkSheet(EXAMPLE_SHEET), checkSheet(structuredClone(EXAMPLE_SHEET)));
});
