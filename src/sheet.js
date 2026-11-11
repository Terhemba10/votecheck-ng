// Result sheet (Form EC8A) checks for one polling unit.
// A person reads the paper sheet and enters what they see; fixed rules then list what to verify.
// Like the result checker, this never decides whether a sheet or a vote is valid: only INEC and the courts do that.
import { SEVERITY_RANK } from "./checker.js";

const n = v => (v === "" || v === null || v === undefined ? null : Number(v));
const isCount = v => Number.isInteger(v) && v >= 0;

// sheet: { registered, accredited, parties: [{ name, votes }], rejected, totalValid, totalCast,
//          poName, poSigned, stamped, agentSignatures, serialNumber, electionDate, completedAt, uploadedAt }
export function checkSheet(sheet) {
  const flags = [];
  const add = (sev, rule, text, data = {}) => flags.push({ sev, rule, text, data });
  const reg = n(sheet.registered), acc = n(sheet.accredited), rej = n(sheet.rejected);
  const writtenValid = n(sheet.totalValid), writtenCast = n(sheet.totalCast);
  const parties = (sheet.parties || []).filter(p => p.name || p.votes !== "");
  const votes = parties.map(p => n(p.votes));

  // Figures must be whole numbers before any arithmetic check makes sense.
  // Field names are kept as interface keys (f.registered …) so the page can show them in any language.
  const figures = { "f.registered": ["Registered voters", reg], "f.accredited": ["Accredited voters", acc], "f.rejected": ["Rejected ballots", rej], "f.totalValid": ["Total valid votes", writtenValid], "f.totalCast": ["Total votes cast", writtenCast] };
  const bad = Object.entries(figures).filter(([, [, v]]) => v !== null && !isCount(v));
  if (votes.some(v => v !== null && !isCount(v))) bad.push(["f.partyVotes", ["Party votes"]]);
  if (bad.length) add("critical", "unreadable_figures", `These figures are not whole numbers: ${bad.map(([, [name]]) => name).join(", ")}. Re-read them from the sheet.`, { fields: bad.map(([k]) => k) });
  const ok = v => v !== null && isCount(v);

  const sumParties = votes.every(ok) && votes.length ? votes.reduce((a, b) => a + b, 0) : null;
  if (sumParties !== null && ok(writtenValid) && sumParties !== writtenValid)
    add("critical", "valid_total_mismatch", `Party votes add up to ${sumParties}, but the sheet's total valid votes says ${writtenValid}.`, { sum: sumParties, written: writtenValid });
  const valid = ok(writtenValid) ? writtenValid : sumParties;
  if (valid !== null && ok(rej) && ok(writtenCast) && valid + rej !== writtenCast)
    add("critical", "cast_total_mismatch", `Valid votes (${valid}) plus rejected ballots (${rej}) make ${valid + rej}, but the sheet's total votes cast says ${writtenCast}.`, { valid, rejected: rej, total: valid + rej, written: writtenCast });
  const cast = ok(writtenCast) ? writtenCast : (valid !== null && ok(rej) ? valid + rej : null);
  if (cast !== null && ok(acc) && cast > acc)
    add("critical", "over_voting", `Over-voting: ${cast} votes cast but only ${acc} voters accredited.`, { cast, accredited: acc });
  if (ok(acc) && ok(reg) && acc > reg)
    add("critical", "accredited_exceeds_registered", `Accredited voters (${acc}) exceed registered voters (${reg}).`, { accredited: acc, registered: reg });

  // What the presiding officer must put on the sheet.
  if (!sheet.poSigned) add("critical", "no_po_signature", "No presiding officer's signature on the sheet. Confirm with the official copy.");
  if (!sheet.stamped) add("warning", "no_stamp", "No official stamp seen on the sheet.");
  if (!String(sheet.poName || "").trim()) add("warning", "no_po_name", "The presiding officer's name is not written on the sheet.");
  if (!String(sheet.serialNumber || "").trim()) add("warning", "no_serial", "No serial number recorded for this sheet.");
  if (n(sheet.agentSignatures) === 0) add("review", "no_agent_signatures", "No party agent signed. Agents may decline to sign, so ask observers what happened.");

  // Times: the sheet is completed on election day and uploaded to IReV after it is completed.
  const done = sheet.completedAt ? new Date(sheet.completedAt) : null, up = sheet.uploadedAt ? new Date(sheet.uploadedAt) : null;
  if (done && sheet.electionDate && sheet.completedAt.slice(0, 10) !== sheet.electionDate)
    add("warning", "not_election_day", `The sheet was completed on ${sheet.completedAt.slice(0, 10)}, not on election day (${sheet.electionDate}).`, { date: sheet.completedAt.slice(0, 10), election: sheet.electionDate });
  if (done && up && up < done)
    add("warning", "uploaded_before_completed", "The IReV upload time is earlier than the time the sheet was completed.");
  else if (done && up && up - done > 24 * 3600_000)
    add("review", "late_upload", `Uploaded to IReV ${Math.round((up - done) / 3600_000)} hours after the sheet was completed.`, { hours: Math.round((up - done) / 3600_000) });
  if (!up) add("review", "no_upload_time", "No IReV upload time entered. Check whether this result was uploaded.");

  const sev = flags.reduce((m, f) => SEVERITY_RANK[f.sev] > SEVERITY_RANK[m] ? f.sev : m, "clean");
  return { flags: flags.sort((a, b) => SEVERITY_RANK[b.sev] - SEVERITY_RANK[a.sev]), sev, sumParties, cast };
}

// A filled-in example (fictional), so people can see how the check works before using their own sheet.
export const EXAMPLE_SHEET = {
  puCode: "01-003", puName: "Town Hall Open Space", registered: 900, accredited: 412,
  parties: [{ name: "Party A", votes: 156 }, { name: "Party B", votes: 149 }, { name: "Party C", votes: 88 }],
  rejected: 9, totalValid: 393, totalCast: 402, poName: "", poSigned: true, stamped: false, agentSignatures: 2,
  serialNumber: "EC8A-0000123", electionDate: "2027-02-20", completedAt: "2027-02-20T17:40", uploadedAt: "2027-02-20T17:05",
};
