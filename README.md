# VoteCheck NG

A nonpartisan election-integrity tool for Nigeria, built for the #AI4Elections Hackathon.

**Live demo:** https://votecheck-ng.onrender.com (free hosting: the first visit after a quiet spell can take up to a minute to wake up).

## What's in it
- **Sign in with Google.** One sign-in per Google account. Only your name and email are used, kept in a signed cookie on your device for 8 hours; the server stores nothing.
- **Home:** three animated scenes (Your vote will count · Vote your choice · Don't sell your vote) and the four tools.
- **Five languages, whole site:** choose English, Pidgin, Hausa, Yorùbá or Igbo on first visit; every page, form, flag, report and the chat switch.
- **Find my polling unit:** step-by-step guidance, INEC's official links, and a VIN lookup **demo on fictional test voters** (VINs starting `00TEST`). Real VIN lookups need INEC's written authorisation; VoteCheck NG never stores VINs or NINs.
- **Check results:** upload polling-unit results as a CSV. Fixed rules flag gaps between paper result sheets (Form EC8A) and IReV uploads, over-voting and unusual turnout, and write an observer report in five languages. Also shows INEC's declared 2023 presidential totals and checks a published state-by-state copy against them.
- **Ask VoteCheck:** answers about registration, PVCs, polling units, voting and results in English, Pidgin, Hausa, Yorùbá and Igbo. It never says who to vote for.
- **Check a result sheet:** go through one Form EC8A — arithmetic, presiding officer's signature and stamp, serial number, and times — and get a list of what to verify. It never decides validity.
- **FAQ** in five languages.

Rules decide the flags, people decide the outcome, and AI only explains.

## Quick start
1. Install Node.js 20 or newer. There are no other packages to install.
2. Optional: copy `.env.example` to `.env`.
   - Add `ANTHROPIC_API_KEY` to switch on AI answers to any question. Without it, the app answers common questions from the built-in guide, in all five languages.
   - Add `GOOGLE_CLIENT_ID` and `SESSION_SECRET` to switch on Google sign-in. Without them, the site runs in open demo mode.
3. Run `npm run dev` and open http://localhost:3000.
4. Run `npm test` to run the 54 tests (result and result-sheet rules, 2023 checks, sign-in and sessions, all five languages).

## Setting up Google sign-in
1. In Google Cloud Console, open **APIs & Services → OAuth consent screen** and set it up (External, app name "VoteCheck NG").
2. Open **Credentials → Create credentials → OAuth client ID → Web application**.
3. Under **Authorised JavaScript origins**, add `https://votecheck-ng.onrender.com` and `http://localhost:3000`.
4. Copy the client ID into `GOOGLE_CLIENT_ID` (in `.env` locally, or Render → Environment for the live site). Render generates `SESSION_SECRET` for you.

## Deploy to Render (free)
1. Push this folder to GitHub. `.env` is ignored, so your keys are never uploaded.
2. On render.com, choose **New → Blueprint** and pick the repository. Render reads `render.yaml`.
3. In the service's **Environment** tab, set `GOOGLE_CLIENT_ID` (and optionally `ANTHROPIC_API_KEY`).
4. Free services sleep when idle, so the first visit can take about a minute. Open the link once before judging starts.

## Data
`data/sample_results.csv` and the result-sheet example are **fictional**, with placeholder party names. For official results of past elections, see INEC's Result Viewing Portal (IReV) at https://www.inecelectionresults.ng.

## Team
Terhemba Jonathan Alumo — B.Sc. Computer Science, University of Abuja.
