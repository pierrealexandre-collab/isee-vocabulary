# ISEE Quest — Vocabulary Adventure

Polished static ISEE vocabulary study app for GitHub Pages.

## Features
- 359-word vocabulary dataset from the supplied CSV
- 5 learner levels
- XP and daily streaks
- 10-question daily quest
- Adaptive/spaced-review weighting
- Weak-word review
- Synonym, antonym, sentence, and word-meaning questions
- Immediate feedback
- Sound effects
- Confetti celebrations
- Word library/search
- Parent progress dashboard
- Weekly activity view
- Browser-local progress; no account/backend/API

## GitHub Pages
Upload all files in this folder to a GitHub repository. In Settings → Pages, publish the main branch (root).

## Local testing
Use a local server because `vocabulary.json` is fetched by JavaScript:
`python3 -m http.server 8000`
then visit `http://localhost:8000/`.

## Vocabulary format
The current `vocabulary.json` includes `word`, `definition`, `synonym`, `antonym`, and `example` fields from the latest CSV.
