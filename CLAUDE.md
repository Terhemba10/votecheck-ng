# VoteCheck NG — project brief for Claude Code

## What this is
A nonpartisan election-integrity tool for Nigeria, built for the #AI4Elections Hackathon (Rise Networks with INEC, Meta, Google and Microsoft). It has two parts:

1. **Voter help assistant.** A chat that answers questions about the electoral process in English, Nigerian Pidgin, Hausa, Yoruba and Igbo.
2. **Result checker.** Upload polling-unit results as CSV. Fixed rules flag differences between the paper result sheet (Form EC8A) and the IReV upload, plus other anomalies. AI then writes a plain-language observer report.

Hackathon tracks covered: Track 2 (electoral data analysis, main track), Track 3 (inclusive and multilingual civic technology), Track 5 (election observation). Entries must come from teams of 2 to 4 people.

## Core principle (do not break)
- **Rules decide the flags, humans decide the outcome, and AI only explains.** AI never counts votes, never declares results, and never decides whether fraud happened.
- Same input data must always produce the same flags (deterministic checks, unit-tested).
- A flag means "verify this", never "fraud". All wording must stay neutral.

## Safety and neutrality rules for the assistant
- Answer only about the electoral process: registration, PVC, polling units, voting steps, results, voter rights, reporting offences.
- Never recommend, praise or criticise any candidate or party. If asked who to vote for, decline politely and explain how to compare candidates fairly.
- Ground answers in `data/voter_guide.json`. Never invent dates, URLs, phone numbers or figures. For dates and locations, point to INEC's official website: inecnigeria.org.
- Reply in the language the user selects.
- If the AI API fails, fall back to the keyword-matched answer from `data/voter_guide.json`.

## Tech stack (zero dependencies: nothing to npm install)
- **Backend:** Node.js 20+ built-in `http` module (`server.js`). It serves `public/` and the API routes.
- **AI:** Claude API called with built-in `fetch` (model from `MODEL` in `.env`, default `claude-haiku-5-5`). Read `ANTHROPIC_API_KEY` from `.env`. Never expose the key to the browser. Without a key, the app uses the guide and template fallbacks.
- **Frontend:** plain HTML, CSS and JavaScript ES modules in `public/`. The browser imports the same `src/checker.js` (served at `/lib/checker.js`).
- **Tests:** Node's built-in test runner (`node --test`).
- Ask before adding any npm package.

## Folder structure (already built: v0.1)
```
votecheck-ng/
  CLAUDE.md
  README.md
  .env.example
  package.json
  server.js                 Node http server, static files, API routes
  src/
    checker.js              pure functions: parseCSV, toUnits, analyse, summarise, templateReport
    report_text.js          template report wording in five languages
    sheet.js                result-sheet (Form EC8A) checks
    auth.js                 Google sign-in and signed session cookies
    guide.js                loads voter_guide.json, keyword fallback
    prompts.js              system prompt for the assistant and the report
  public/
    index.html, login.html, polling-unit.html, results.html, ask.html, result-sheet.html, faq.html
    common.js, home.js, hero.js, scenes.js, *-page scripts, styles.css
  data/
    sample_results.csv      fictional sample, placeholder parties A/B/C
    voter_guide.json        reference answers
  tests/
    checker.test.js
  prototype/index.html      reference prototype (do not ship)
  docs/hackathon.md         rules, deadline, submission checklist
```

## API routes
- `POST /api/ask` with `{ language, messages: [{role, content}] }` returns `{ answer, source: "ai" | "guide" }`.
- `POST /api/report` with `{ language, units }` returns `{ report, source: "ai" | "template" }`. The server re-runs the checks itself and never trusts flags sent from the browser.
- `GET /api/status` returns `{ ai: true | false }`.
- `GET /api/me` returns `{ authEnabled, googleClientId, user }`. `POST /api/login` with `{ credential }` (a Google ID token) sets the session cookie; `POST /api/logout` clears it.
- All POST routes have per-IP rate limiting (20/min) and body-size limits.

## Sign-in (in `src/auth.js`)
- Google sign-in is on when `GOOGLE_CLIENT_ID` is set; otherwise the site runs in open demo mode.
- The server checks the Google ID token with Google, then puts only name and email in an HMAC-signed, HttpOnly cookie (8 hours). No user database. Never collect NIN, VIN or PVC numbers.
- With sign-in on, every page except `/login` and the `/api/ask` and `/api/report` routes need a session. Scripts, styles and data stay public.

## Pages (in `public/`)
Home `/` (animated scenes in `scenes.js` + `hero.js`, four tool cards), `/login`, `/polling-unit`, `/results`, `/ask`, `/result-sheet`, `/faq`. `common.js` draws the header, navigation, language picker and footer on every page; the chosen language is shared across pages.

## Result-sheet rules (in `src/sheet.js`)
Checks one Form EC8A as a person reads it: party votes add up to total valid; valid + rejected = total cast; over-voting; accredited > registered; presiding officer signature (critical), stamp, name and serial number (warning); no agent signatures (review); completed on election day; IReV upload not before completion, not more than 24 hours later. Wording stays neutral: never "invalid" or "fraud".

## Result-checker rules (in `src/checker.js`)
CSV columns: `pu_code, pu_name, ward, registered, accredited, paper_a, paper_b, paper_c, rejected, irev_a, irev_b, irev_c`. Blank IReV columns mean "not uploaded".

| Rule | Severity |
|---|---|
| Accredited > registered | critical |
| Over-voting: valid + rejected votes > accredited | critical |
| Any party's IReV figure differs from the paper sheet | critical |
| No IReV upload while accredited > 0 (Electoral Act 2026 requires electronic transmission) | warning |
| Turnout ≥ 95% | warning |
| Turnout far from area median (robust z-score using MAD, abs(z) > 3.5) | review |
| One party ≥ 95% of valid votes (with > 50 valid votes) | review |
| Zero accredited voters | review |

Each polling unit gets the highest severity of its flags, or `clean`. Write unit tests for every rule, using `data/sample_results.csv`. Expected results for the sample:
- 01-003: critical (Party B mismatch, sheet 149 vs IReV 194)
- 02-003: critical (over-voting, 385 cast vs 350 accredited)
- 03-003: critical (over-voting, 662 vs 640) plus warning (100% turnout)
- 01-004: warning (no IReV upload)
- 02-004: warning (98.4% turnout) plus review (one party has 98.8% of valid votes)
- 03-004: review (zero accredited)
- All other 8 units: clean

## Commands
- `npm run dev` starts the server on http://localhost:3000 (no install step needed)
- `npm test` runs the checker tests

## Working style
- Build in small steps and run the tests after each change.
- Keep code simple and readable. This will be shown to hackathon judges.
- Ask before adding a database, login system or new paid service.

## Status
v0.2: multi-page site with Google sign-in, four tools and an FAQ. 45 tests pass (checker, result sheet, auth, guide, report). Live at https://votecheck-ng.onrender.com; Render does not auto-deploy (no GitHub app yet), so use Manual Deploy → Deploy latest commit.

Guide, chat, FAQ and observer report work in all five languages without AI. These translations were drafted by AI and **still need checking by native speakers** before the demo. The flagged-units table, result-sheet checks and home-page messages are English only.

## Ideas for next steps
- Streaming AI answers in the chat.
- A map or ward-level view of flags.
- Export the observer report as a PDF.
- Deploy to a free host (for example Render) so judges get a live link.
