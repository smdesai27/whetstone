# 🪨 Whetstone

**Remember what you read, watch, and listen to — well enough to explain it months later.** Your
AI agent becomes the tutor; your memory lives in plain markdown files you own.

<p align="center">
  <img src="assets/whetstone-demo.gif" alt="Whetstone demo: feed your AI agent a lecture, it extracts the ideas that matter and quizzes you on them, grades your explanation, then reviews everything you've consumed on a spaced schedule — all from one skill, over plain markdown files." width="100%">
</p>

Watch a video, read a paper, listen to a podcast → tell your agent `/whetstone <link>` → it
pulls out the few ideas worth keeping, quizzes you immediately, and brings each one back on an
expanding schedule — **rephrasing the question every time** so you rehearse *understanding*, not
one memorized card. Fifteen minutes a day, max.

## The problem it solves

Watching a lecture that explains something clearly feels like learning it — and a week later it's
gone. The gap isn't a fact that leaked out; it's that the idea was only ever *recognized* while
someone else explained it, never *generated* from memory. Whetstone closes that gap: produce the
explanation right after consuming, then again at spaced intervals, reworded each time.

## What makes it work

- **A concept, not a card.** Each item stores the correct explanation and a *menu of angles* —
  never a frozen question. The skill writes a new question every session: derive it, apply it,
  break it. Recognizing a fixed card isn't understanding; varied retrieval is what transfers to a
  question you haven't seen ([the science](#the-science)).
- **Your agent is the tutor.** It grades a real explanation in conversation against a reference
  model and names the exact piece you missed — no multiple choice. Grading runs in the
  subscription you already have, at zero API cost.
- **One skill, one growing library.** Feed it papers, videos, and podcasts over time; it keeps
  the load-bearing ideas from each and remembers them all. One command reviews across everything
  that's due — nothing to manage, just consume and review.
- **Targeting over volume.** The hard part isn't generating questions, it's deciding what's worth
  keeping. Every source is triaged into **core** (durable), **gist** (situational), or **log** (a
  searchable one-line trace). Keeping nothing from something is a normal outcome.
- **Files are the API.** Everything is plain markdown ([FORMAT.md](FORMAT.md)) in a folder you
  choose. Drop it in Obsidian or Logseq and the concepts become native notes — graph, backlinks,
  phone; skip the vault and it's just a folder. No database, no account, no lock-in — your
  existing sync (iCloud, Dropbox, git) is the sync.
- **No review debt.** The `/whetstone` skill is the only thing that writes state, capped at
  fifteen minutes a day. Nothing you've learned is deleted for *succeeding* — durable concepts
  return at long intervals; you archive the rest deliberately. Backlogs get triaged, never
  guilted over.
- **Model-agnostic.** One markdown instruction file; any capable agent — Claude Code, Cursor,
  Codex, Cowork — runs it over the same files. Quality scales with the model you bring.

## The pieces

| File | Role |
|---|---|
| `SKILL.md` | The agent skill — the only writer: setup, ingest, session/grading, reflect |
| `FORMAT.md` | The open spec — concepts, log, profile, config. Any tool that reads it is a client |
| `decks/` | One markdown file per source you chose to actively learn (core/gist concepts) |
| `LOG.md` | Append-only trace of everything consumed — the "log" tier; searchable, promotable |
| `profile.md` | How you tend to misunderstand things (append-only) — steers future questions |
| `hub/index.html` | Optional visual dashboard of your decks — what's sharp, what's due. Static page, no network calls |

## Install

### Recommended — let your agent install it

You have an AI agent already; let it do the work. **Paste the prompt below** to Claude Code,
Cursor, Codex, Windsurf, or any capable agent. It fetches the skill, installs it for your
specific tool, and then interviews you — one question at a time — so the setup is right for
*your* machine, PKM, and sync:

````text
Set up the Whetstone learning system for me.

1. Fetch these two files from GitHub:
   • https://raw.githubusercontent.com/smdesai27/whetstone/main/SKILL.md
   • https://raw.githubusercontent.com/smdesai27/whetstone/main/FORMAT.md
2. Install the skill so I can invoke it as /whetstone. For Claude Code that's
   ~/.claude/skills/whetstone/SKILL.md (create the folder); keep FORMAT.md beside it. For a
   different agent, put SKILL.md wherever your rules/commands/skills load from — ask me if you
   are unsure. (If you have a shell, you may instead run:
   curl -fsSL https://raw.githubusercontent.com/smdesai27/whetstone/main/install.sh | sh)
3. Then run Whetstone's first-run Setup mode exactly as SKILL.md describes. Ask me, one question
   at a time and waiting for each answer:
   - whether I keep a PKM / vault (Obsidian, Logseq, …) and where inside it the whetstone folder
     should live — otherwise default to ~/Whetstone/;
   - what syncs that location (iCloud, Dropbox, Obsidian Sync, git, or nothing) — recommend a
     synced spot, since it's what makes phone and hub review work.
   Create whetstone.json, an empty decks/ folder, profile.md, and LOG.md there — never
   overwriting anything that already exists.
4. Finally: tell me the folder you created, point me to the hub at
   https://smdesai27.github.io/whetstone/, and show me how to add my first source with
   /whetstone <link or file>.

Confirm each step as you go.
````

### Or install it yourself

```sh
# Claude Code — macOS / Linux / WSL
curl -fsSL https://raw.githubusercontent.com/smdesai27/whetstone/main/install.sh | sh
```
```powershell
# Windows PowerShell
irm https://raw.githubusercontent.com/smdesai27/whetstone/main/install.ps1 | iex
```
```text
# Claude Code — as a plugin instead (adds an update channel; see Updating below)
/plugin marketplace add smdesai27/whetstone
/plugin install whetstone@whetstone
```

Or copy `SKILL.md` into your agent's skills directory by hand (Claude Code:
`~/.claude/skills/whetstone/SKILL.md`; run `install.sh --print-paths` for every other agent).
Then run `/whetstone` — with no config present it enters Setup mode and walks you through the
same questions.

Either way, once you're set up: open the hub at
**https://smdesai27.github.io/whetstone/** in Chrome/Edge/Brave and point it at your folder — no
download, no account. Want to see it populated first? Point it at this repo's `sample/` folder.

**Every agent, PKM, OS, and sync combination is covered in [INSTALL.md](INSTALL.md).**

## Updating

An update only ever replaces the skill file — your decks, log, and profile live in your own
folder and are never touched.

- **Installed by copy** (installer, agent prompt, or by hand): run `/whetstone update` — the
  skill compares its version against this repo, backs up your current copy, and replaces
  itself. Re-running the install one-liner does the same thing.
- **Installed as a plugin**: run `claude plugin update whetstone@whetstone` and restart, or
  enable auto-update for the marketplace under `/plugin` → Marketplaces.
- Whetstone never phones home: no update check runs unless you ask, or you opt in to a
  rate-limited one with `"updates": { "check": true }` in `whetstone.json`.

## Daily loop

- **Consume something** → `/whetstone <link or file>` → it triages, files the few concepts worth
  keeping (the rest goes to `LOG.md`), and quizzes you immediately.
- **Review** → run `/whetstone` with no argument. It writes a fresh question for each due
  concept, grades your explanation, tells you exactly what you missed, and reschedules. **All
  learning happens here, in the skill.**
- **Glance anywhere** → open the hub (or your files on your phone) to see your whole library —
  every source, what's sharp, what's due. Reviewing itself always happens in the skill.
- **Movies / shows / novels** → `/whetstone reflect on <title>` — a structured reflection
  conversation instead of a quiz (retention isn't the goal there; thinking is).

## Privacy model

The hub is a **read-only static page with zero backend.** It makes no network calls; your files
are read through your browser's local folder permission (read-only) and never leave your machine.
Hosting it on GitHub Pages publishes the *app*, not anyone's *data* — like publishing a
calculator: everyone sees the same empty tool, each user's numbers stay their own. Nothing about
your learning is ever in this repo or on any server. Verify it yourself: the page is one readable
HTML file, and DevTools' network tab stays empty.

## The science

Practice testing (active recall) and distributed practice (spacing) are the only two
"high-utility" techniques in Dunlosky et al. (2013)'s landmark review; rereading and highlighting
rate low. Two refinements shape Whetstone's design:

- **Total spacing is what matters — not the ladder's shape.** A first retrieval delayed enough to
  take effort while still succeeding, spread over time, is the causal driver (Karpicke &
  Bauernschmidt 2011). Whether intervals expand or stay equal barely moves retention (Latimier et
  al. 2021 meta-analysis, g≈0.03). So Whetstone uses a simple expanding ladder without pretending
  the shape is the magic.
- **Varied retrieval buys transfer; frozen cards don't.** Reviewing the *same* question trains
  recall of that question (Price et al. 2025: d≈0.62 same-item vs d≈0.26 on reworded transfer
  questions). Whetstone regenerates the question each session precisely to close that gap — which
  is the whole reason a concept stores a reference model and a menu of angles instead of a fixed
  prompt.

The example deck in `decks/` teaches you this method itself.

## License

MIT
