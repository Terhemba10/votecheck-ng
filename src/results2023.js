// Checks on published state-level results: does each row add up, and do the states add up to the declared national totals?
// Used on the 2023 presidential results. A mismatch means "this copy needs verifying against INEC's collation sheets".
const KEYS = ["apc", "pdp", "lp", "nnpp", "others"];

export function checkStateResults(data) {
  const rows = data.states.map(s => {
    const sum = KEYS.reduce((a, k) => a + (s[k] || 0), 0);
    return { state: s.state, sum, valid: s.valid, ok: sum === s.valid };
  });
  const totals = [...data.candidates.map(c => c.key), "valid"].map(key => {
    const sum = data.states.reduce((a, s) => a + (s[key] || 0), 0);
    const declared = data.declared[key];
    return { key, sum, declared, diff: sum - declared };
  });
  return { rows, totals, rowsOk: rows.every(r => r.ok), totalsOk: totals.every(t => t.diff === 0) };
}

// One state's local government areas: how many have figures, does each row add up,
// and (only when every LGA has figures) do they add up to the state's own total?
export function checkLgaResults(stateRow, lgas) {
  const withFigures = lgas.filter(l => typeof l.valid === "number");
  const rows = withFigures.map(l => {
    const sum = KEYS.reduce((a, k) => a + (l[k] || 0), 0);
    return { lga: l.lga, sum, valid: l.valid, ok: sum === l.valid };
  });
  const complete = lgas.length > 0 && withFigures.length === lgas.length;
  const lgaValid = withFigures.reduce((a, l) => a + l.valid, 0);
  return {
    have: withFigures.length, total: lgas.length, complete, rows,
    stateMatch: complete ? lgaValid === stateRow.valid : null,
    lgaValid, stateValid: stateRow.valid, diff: complete ? lgaValid - stateRow.valid : null,
  };
}
