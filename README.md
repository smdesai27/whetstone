# 🪨 Whetstone

**Stop consuming content passively.** Keep on reviewing and engaging with the things
you read, watch, and listen to — your AI agent becomes your tutor, and your memory lives in plain
markdown files you own.

Watch a video, read a paper, listen to a podcast → tell your agent `/whetstone <link>` → it
quizzes you immediately, files a deck of recall items, and brings each item back on an
expanding schedule (1, 3, 7, 16, 35 days) until you've mastered it. Fifteen minutes a day, max.

## Why this instead of Anki / flashcard apps

- **Your agent is the tutor.** Teach-backs are graded by your own agent in real
  conversation — not by a cheap bundled model. Grading runs inside the agent subscription
  you already have — **zero API cost by default** (hub MCQs grade themselves locally; an
  optional live-API tier exists for instant feedback).
- **Files are the API.** Decks are plain markdown ([FORMAT.md](FORMAT.md)) in a folder you
  choose. Put it inside your Obsidian vault or PKM and it's a native part of your system;
  don't have one, and it's just a folder. No database, no account, no silo. Your sync
  (iCloud, Dropbox, Obsidian Sync, git) is the sync.
- **Zero card-making friction.** The agent writes the items — calibrated to mechanisms and
  application, never trivia — and a learner profile, created in your folder at setup
  ([template](profile.md)), tracks *how* you misunderstand things so future items target
  your actual weak spots.
- **No review debt.** Sessions are capped — 15 minutes / 8 items by default, adjustable in
  the hub's settings. Items you've mastered retire permanently. Backlogs get pruned, not
  guilted over.
- **Model-agnostic.** The skill is a markdown instruction file; any capable agent
  (Claude Code, Cowork, Codex, Cursor…) can run the system over the same files. Item quality
  scales with the model you bring.

## The pieces

| File | Role |
|---|---|
| `SKILL.md` | The agent skill: setup, ingest, session/grading, reflection modes |
| `FORMAT.md` | The open spec — decks, worksheet, profile. Any tool that speaks it is a client |
| `PENDING.md` | Today's worksheet. Always exists; answer it anywhere, in any editor |
| `hub/index.html` | Optional visual quiz UI over your folder. Static page, zero network calls |
| `decks/` | One markdown file per thing you've consumed |
| `profile.md` | How you tend to misunderstand things (append-only) |

## Install

1. Copy `SKILL.md` into your agent's skills directory (e.g. `~/.claude/skills/whetstone/SKILL.md`).
2. Run `/whetstone` — first-run setup asks where your folder should live (put it somewhere
   that syncs to your devices) and creates everything.
3. For the visual quiz UI, visit the hosted hub (this repo's GitHub Pages URL) in
   Chrome/Edge/Brave and point it at your folder — no download, no account. Or open
   `hub/index.html` locally for a fully-offline copy.

## Privacy model

The hub is a **static page with zero backend**. It makes no network calls; your decks,
answers, and profile are read and written through your browser's local folder permission and
never leave your machine. Hosting it on GitHub Pages publishes the *app*, not anyone's
*data* — like publishing a calculator: everyone sees the same empty tool, each user's numbers
stay their own. Nothing about your learning is ever in this repo or on any server. Verify it
yourself: the page is one readable HTML file, and DevTools' network tab stays empty.

## Daily loop

- **Consume something** → `/whetstone <link or file>` → immediate quiz + deck filed.
- **Review** (pick any door, same files):
  - `/whetstone` in chat — live quiz with real teach-back grading.
  - Open the hub — tap through MCQs (graded instantly, free), type teach-backs (queued).
  - On your phone — open `PENDING.md` in any markdown editor, fill in the worksheet.
- **Reconcile** — next `/whetstone` grades everything queued, updates schedules, refreshes
  the worksheet.
- **Movies / shows / novels** → `/whetstone reflect on <title>` — a structured reflection
  conversation instead of a quiz (retention isn't the goal there; thinking is).

## The science

Practice testing and distributed practice are the only two "high utility" techniques in
Dunlosky et al. (2013)'s landmark review; rereading and highlighting rate low. Whetstone is
those two techniques, operationalized: every item is a retrieval attempt, scheduled at
expanding intervals, with teach-back (retrieval + self-explanation) for conceptual material.
The example deck in `decks/` teaches you the method itself.

## License

MIT
