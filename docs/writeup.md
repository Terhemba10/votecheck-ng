# VoteCheck NG — one-page write-up

**#AI4Elections Hackathon 2026 · Terhemba Jonathan Alumo, B.Sc. Computer Science, University of Abuja**
Live demo: https://votecheck-ng.onrender.com · Code: https://github.com/Terhemba10/votecheck-ng

## The problem
Two gaps weaken trust in Nigerian elections:
1. **Voters can't easily get clear, neutral answers in their own language.** Basic questions (How do I replace a lost PVC? Where do I vote? What happens to my result?) are usually answered in English, on social media, mixed with rumours and partisan messages.
2. **Comparing paper results with IReV uploads is slow manual work.** Observers and journalists have to compare each polling unit's result sheet (Form EC8A) with its IReV upload by hand. Mismatches, over-voting and missing uploads are easy to miss across thousands of units.

## The solution
VoteCheck NG is a working web app with two tools:

- **Voter help (5 languages).** A chat that answers questions about registration, PVCs, polling units, voting steps, results, voter rights and reporting vote-buying, in **English, Nigerian Pidgin, Hausa, Yorùbá and Igbo**. Answers come from a built-in voter guide, and every answer points people to inecnigeria.org for dates and locations. It politely declines to say who to vote for.
- **Result checker.** Upload polling-unit results as a CSV. Eight fixed, unit-tested rules flag issues for review:
  - **Critical:** IReV figures differ from the paper sheet; over-voting; more accredited voters than registered.
  - **Warning:** no IReV upload while voters were accredited; turnout of 95% or more.
  - **Review:** turnout far from the area median; one party with 95% or more of valid votes; zero accredited voters.

  It then writes a plain-language **observer report** with verification steps.

## Focus areas covered
- **Inclusive and multilingual civic technology:** the five-language voter help, which works even without an internet AI service.
- **Electoral cybersecurity:** the result checker catches sheet-versus-IReV mismatches and missing uploads.
- **Election observation:** prioritised flags and observer reports.
- **Trustworthy electoral information:** answers come only from the guide and point to INEC's official site.

## Responsible-AI safeguards
- **Rules decide, people decide, AI only explains.** Fixed rules produce the flags. AI never counts votes, declares results or decides whether fraud happened.
- **Deterministic and tested.** The same data always gives the same flags. 22 automated tests cover every checker rule and the multilingual guide.
- **Neutral wording.** A flag means "verify this", never "fraud". The assistant never recommends, praises or criticises any candidate or party.
- **Grounded answers.** No invented dates, URLs or phone numbers; a test checks that translations add none.
- **Server-side checks.** The server re-runs every rule itself and never trusts flags sent from the browser.
- **Privacy and safety.** No login, no database, no personal data stored. The API key stays on the server. Requests are rate-limited and size-limited.
- **Works without AI.** If the AI service is off or fails, the app falls back to the built-in guide and template report, so it keeps working on election day.
- **Clearly independent.** The app is not an official INEC site and says so on every page.

## How it's built
- Node.js with zero dependencies: nothing to install, easy to audit and host.
- Plain HTML, CSS and JavaScript. The browser and the server share the same checker code.
- Optional Claude AI for free-form answers in any of the five languages and for written reports.
- Sample data is fictional, with placeholder parties A, B and C.

## Next steps (Lagos showcase, 16 December)
- Native-speaker review of the Hausa, Yorùbá and Igbo answers with community partners.
- Ward and LGA map of flags.
- PDF export of observer reports.
- Pilot with an accredited observer group on past public IReV data.
