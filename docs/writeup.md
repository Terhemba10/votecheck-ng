# VoteCheck NG — project write-up

**#AI4Elections Hackathon 2026 · Team:** Terhemba Jonathan Alumo (B.Sc. Computer Science, University of Abuja) · _add teammate(s) here_
**Live demo:** https://votecheck-ng.onrender.com · **Demo video:** https://youtu.be/sooXoXegRoU · **Code (MIT licence):** https://github.com/Terhemba10/votecheck-ng

## Tracks
- **Track 2 — Electoral data analysis and decision support (main track).** The result checker flags data anomalies in polling-unit results **for human review**. It never declares results.
- **Track 3 — Inclusive and multilingual civic technology.** Voter information and observer reports in English, Nigerian Pidgin, Hausa, Yorùbá and Igbo.
- **Track 5 — Election observation and citizen accountability.** Structured observer reports with verification steps.

## The problem
1. **Voters struggle to get clear, neutral answers in their own language.** Basic questions (How do I replace a lost PVC? Where do I vote? What happens to my result?) are usually answered in English, on social media, mixed with rumours and partisan messages.
2. **Comparing paper results with IReV uploads is slow manual work.** Observers and journalists compare each polling unit's result sheet (Form EC8A) with its IReV upload by hand. Mismatches, over-voting and missing uploads are easy to miss across thousands of units.

## The solution
A working web app. You sign in with Google, then choose one of four tools, each on its own page:
- **Find my polling unit.** Step-by-step guidance and INEC's official links, plus a **VIN lookup demo** that searches only fictional test voters (VINs starting `00TEST`). It shows how the lookup would work once INEC authorises a connection to its register; it never accepts or stores real VINs or NINs.
- **Check results.** Upload polling-unit results as a CSV. Eight fixed rules flag issues by severity, and the app writes an **observer report**, in the selected language, with verification steps. The page also tests the checks on **real 2023 data**: INEC's declared national totals for the presidential election and a published state-by-state copy of the results. Users can **pick any state, then any local government**, to see its 2023 figures and checks.
- **Ask VoteCheck.** Answers questions on registration, PVCs, polling units, voting steps, results, voter rights and reporting vote buying, in five languages. Answers come from a built-in voter guide and point to inecnigeria.org for dates and locations. It politely declines to say who to vote for.
- **Check a result sheet.** A person reads one Form EC8A and enters what they see. Fixed rules check that the figures add up, that the presiding officer has signed and stamped it, that it has a serial number, and that the completion and IReV upload times are consistent. The result is a list of what to verify, never a verdict on validity.

On first visit you choose English, Nigerian Pidgin, Hausa, Yorùbá or Igbo, and **the whole site switches**: menus, pages, forms, flags, reports, FAQ and chat. The home page carries three animated voter-education messages: *Your vote will count* (voters in Hausa, Igbo and Yorùbá dress), *Vote your choice* (an inked thumb marking a sample ballot with placeholder parties) and *Don't sell your vote*. An FAQ page gives the guide's answers in all five languages.

## Method
- **Rules decide, people decide, AI only explains.** Eight deterministic rules produce every flag:
  - **Critical:** IReV figure differs from the paper sheet; over-voting (votes cast > accredited); accredited > registered.
  - **Warning:** no IReV upload while voters were accredited; turnout of 95% or more.
  - **Review:** turnout far from the area median (robust z-score, MAD, |z| > 3.5); one party with 95%+ of valid votes; zero accredited voters.
- **Same data, same flags, every time.** The server re-runs every rule itself and never trusts flags sent from a browser.
- **AI is optional.** With an API key, Claude writes free-form answers and reports, grounded in the guide and the computed flags. Without it, the app uses its own five-language guide and report templates, so it keeps working if the AI service fails.

## Evidence that it works
- Live, publicly hosted prototype (link above).
- **58 automated tests**, all passing. They cover every result rule on the sample data, every result-sheet rule, sign-in and sessions (forged, tampered and expired sessions are refused), the 2023 consistency checks, every guide translation, every interface string in all five languages (with matching placeholders, so no figure is ever dropped), and the report in all five languages.
- On the fictional sample of 14 polling units, it flags exactly the 6 seeded problems (for example, unit 01-003: Party B sheet 149 vs IReV 194) and leaves the 8 clean units alone.

## Data and privacy
- **Data used:** a **fictional** sample (`data/sample_results.csv`) and a fictional result-sheet example, with placeholder parties. Users can upload their own CSV of public or synthetic results; official past results are on INEC's IReV portal. No voter registers, NINs, VINs, biometric data, personal records or restricted INEC data are used.
- **Nigeria Data Protection Act 2023:** sign-in uses only your Google name and email (data minimisation). They are kept in a signed, HttpOnly cookie on your own device for 8 hours. The server keeps no account database and stores nothing about you, and signing out deletes the cookie. Uploaded CSVs are processed in memory and not stored, result-sheet checks run entirely in the browser, and chat questions are not logged.
- **No access to live systems:** VoteCheck NG does not connect to INEC, IReV, BVAS or any institutional system.
- **Security:** the API key stays on the server, every request has a rate limit and a size limit, and files outside the public folder can't be fetched.

## Human oversight
| Role | Responsibility |
|---|---|
| **Accredited observer, journalist or civil-society analyst (user)** | Treats every flag as "verify this". Checks it against the physical Form EC8A, party agents' records and other observers before reporting anything. |
| **INEC and the courts** | Alone decide results, validity and any finding of wrongdoing. VoteCheck NG makes no such determinations. |
| **VoteCheck NG team** | Maintains the rules and the voter guide, fixes reported errors, and responds to complaints through the GitHub issue tracker. |

## Limitations
- **Translations** of the guide and report into Hausa, Yorùbá and Igbo are not yet reviewed by native speakers. Pidgin needs review too.
- **Guide mode** covers 10 common topics. Other questions get a polite referral to inecnigeria.org unless AI is switched on.
- **Data format:** the CSV layout is our own and supports three parties. Real data would need a conversion step and more party columns.
- **Rules flag patterns, not wrongdoing.** A legitimate result can be flagged (for example, a genuinely high turnout), and an irregularity that leaves the figures consistent will not be caught.
- **The "far from median" rule** needs enough units in an area to be meaningful.
- **Sign-in needs a Google account.** That's a barrier for some voters. A future version could offer a guest mode for the public information pages.
- **2023 state figures come from a secondary source.** Testing on real data, the checks found that this published state-by-state copy does not add up to INEC's declared national totals (for example, the states sum to 10,694 more votes for the APC candidate than declared), and two state rows (Kwara, Yobe) don't add up internally. The site shows this openly; the state rows need checking against INEC's official collation sheets.
- **The VIN lookup is a demo** on fictional records until INEC gives written authorisation.
- **Local government figures are incomplete.** The published source lists 766 LGAs but has figures for only 108; the site says so for each LGA and links to INEC's IReV for the official result. Where a state's LGAs are complete, the checks compare them with the state total (for example, Lagos's LGAs come to 32,832 fewer valid votes than its state row).
- **Hero images are AI-generated** photographs of fictional people, labelled as such on the page.
- **The result-sheet check relies on what a person reads off the sheet.** It does not read photos of sheets.

## Conditions for further testing
- Native-speaker review of all translated text, and usability testing with voters and observers, including people with disabilities.
- Testing only on **public, anonymised or synthetic** data, or data explicitly authorised in writing. Never on live electoral systems.
- Any pilot with an observer group or institution only under a written agreement, with a defined scope and approvals.

## Next steps (finals in Abuja, December 2026)
- Native-speaker review with university and community partners.
- More parties, and import of public result formats.
- Ward and LGA map of flags; PDF export of observer reports.
- Translate the flagged-units table; audio answers for low-literacy users.
