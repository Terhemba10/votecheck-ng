# VoteCheck NG

A nonpartisan election-integrity tool for Nigeria, built for the #AI4Elections Hackathon.

**Live demo:** https://votecheck-ng.onrender.com (free hosting: the first visit after a quiet spell can take up to a minute to wake up).

- **Voter help:** an assistant that answers questions about registration, PVCs, polling units, voting and results in English, Pidgin, Hausa, Yoruba and Igbo. It never says who to vote for.
- **Result checker:** flags gaps between polling-unit result sheets (Form EC8A) and IReV uploads, plus over-voting and unusual turnout, for human verification.
- **Observer report:** AI turns the flags into a plain-language report. Rules decide the flags, and people decide what happened.

## Quick start
1. Install Node.js 20 or newer. There are no other packages to install.
2. Optional: copy `.env.example` to `.env` and add your Anthropic API key to switch on AI answers to any question. Without it, the app answers common questions from the built-in guide, in all five languages.
3. Run `npm run dev`.
4. Open http://localhost:3000.
5. Run `npm test` to run the 22 tests (result-checker rules and the multilingual guide).

## Deploy to Render (free)
1. Push this folder to a GitHub repository. `.env` is ignored, so your key is never uploaded.
2. On render.com, choose **New → Blueprint** and pick the repository. Render reads `render.yaml`.
3. Optional: in the service's **Environment** tab, set `ANTHROPIC_API_KEY` to switch on AI answers.
4. Free services sleep when idle, so the first visit can take about a minute. Open the link once before judging starts.

## Building with Claude Code
Open this folder in Claude Code and paste the prompt from `START_PROMPT.md`. Project rules are in `CLAUDE.md`.

## Data
`data/sample_results.csv` contains **fictional** polling units with placeholder party names (A, B, C). It is for demonstration only.

## Team
Terhemba Jonathan Alumo — B.Sc. Computer Science, University of Abuja.
