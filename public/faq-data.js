// Stable anchor for each FAQ entry, made from its English question ("How does voting work on election day?" -> "how-voting-works").
const SPECIAL = { "How does voting work on election day?": "how-voting-works" };
export const slug = q => SPECIAL[q] || q.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
