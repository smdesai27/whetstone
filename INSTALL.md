# Install & Setup

Whetstone is two things, installed once:

1. **The skill** (`SKILL.md`) — a markdown instruction file you drop into your agent. This is the
   only thing that writes state or calls a model.
2. **The hub** (`hub/index.html`) — an optional web dashboard of your folder. Nothing to
   install; you just open a URL and point it at your folder.

Everything your learning produces is plain markdown in **one folder you choose**. Pick a folder
that *syncs* (iCloud, Dropbox, Obsidian Sync, git) and phone + hub review "just work."

There are three axes of variation — **which agent**, **where your folder lives** (PKM or plain
folder, and what syncs it), and **which OS**. Do Step 1 for your agent, Step 2 once, and Step 3
whenever you want the visual view.

---

## Step 1 — Install the skill

### Recommended — paste this to your agent

You already have an AI agent; let it install *and* set up Whetstone. Paste this to Claude Code,
Cursor, Codex, Windsurf, or any capable agent — it does Step 1 and Step 2 for you, asking the
right questions for your machine:

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

Prefer to do it by hand? The rest of this page covers every path.

### Fastest (Claude Code, macOS / Linux / WSL)

```sh
curl -fsSL https://raw.githubusercontent.com/smdesai27/whetstone/main/install.sh | sh
```

### Fastest (Claude Code, Windows PowerShell)

```powershell
irm https://raw.githubusercontent.com/smdesai27/whetstone/main/install.ps1 | iex
```

Both scripts create the skills directory if it's missing, back up any existing `SKILL.md`, and
print your next steps. Run `install.sh --print-paths` (or `install.ps1 -PrintPaths`) to see the
path for every agent, and `--dir DIR` / `-Dir DIR` to install somewhere else.

### Claude Code — as a plugin (adds an update channel)

This repo is its own plugin marketplace:

```text
/plugin marketplace add smdesai27/whetstone
/plugin install whetstone@whetstone
```

Installed this way, new releases arrive via `claude plugin update whetstone@whetstone`
(restart to apply) — or automatically, if you enable auto-update for the marketplace under
`/plugin` → **Marketplaces** (off by default for third-party marketplaces). Note that Claude
Code namespaces plugin skills, so it lists as `/whetstone:whetstone` — typing `/whetstone`
finds it.

### By hand, per agent

Copy `SKILL.md` to the path for your agent:

| Agent | Where `SKILL.md` goes |
|---|---|
| **Claude Code** | `~/.claude/skills/whetstone/SKILL.md` (honors `CLAUDE_CONFIG_DIR`) |
| **Claude Desktop** | macOS: `~/Library/Application Support/Claude/skills/whetstone/SKILL.md` · Windows: `%APPDATA%\Claude\skills\whetstone\SKILL.md` |
| **Cursor** | Cursor has no global skills dir — add it as a project rule: `<project>/.cursor/rules/whetstone.md` (paste `SKILL.md`'s body, or reference the file) |
| **Codex CLI** | `~/.codex/skills/whetstone/SKILL.md`, or the skills path your `AGENTS.md` defines |
| **Cowork** | Paste `SKILL.md` into a Cowork skill / instruction slot in its UI |
| **Any other agent** | Any agent that can read a markdown instruction file works — point it at `SKILL.md` |

> The skill is model-agnostic. Quality scales with whatever model you bring.

---

## Step 2 — First run (creates your folder)

In your agent, run:

```
/whetstone
```

With no config present, the skill enters **Setup mode** and asks two questions:

1. **Do you keep a PKM / vault?** (Obsidian, Logseq, …) If yes, where inside it should the folder
   live; if no, it defaults to `~/Whetstone/`.
2. **What syncs that location?** (iCloud, Dropbox, Obsidian Sync, git, or nothing.)

Then it creates, in that folder, exactly four things (never overwriting anything that exists):

```
<your folder>/
  whetstone.json   # version, created date, your sync note, session caps (15 min / 8 concepts)
  profile.md       # how you tend to misunderstand (append-only)
  LOG.md           # append-only trace of everything you consume
  decks/           # one file per source you actively learn (empty until you ingest)
```

That's it — you're set up. Add your first source with `/whetstone <link or file>`, or run
`/whetstone` with no argument once you have due items.

### Where should the folder live? (PKM matrix)

| Your setup | Put the folder at | What you get |
|---|---|---|
| **Obsidian** | `<vault>/whetstone/` | Concepts become native notes — graph, backlinks, phone app |
| **Logseq** | `<graph>/whetstone/` | Same markdown, browsable in Logseq |
| **Plain folder, no PKM** | `~/Whetstone/` | Just files in a folder — still fully works |

The files are identical in every case — a PKM is a nicer *reader*, never a requirement.

### What syncs it? (sync matrix)

Whetstone never implements sync; it **inherits yours**. Pick a folder already covered by one of:

| Sync | Typical path to put the folder under |
|---|---|
| **iCloud Drive** (macOS/iOS) | `~/Library/Mobile Documents/com~apple~CloudDocs/Whetstone/` or inside an iCloud-synced Obsidian vault |
| **Dropbox** | `~/Dropbox/Whetstone/` |
| **Obsidian Sync** | anywhere inside your synced vault |
| **git** | any repo you `git pull`/`push` (the skill only edits files; you commit) |
| **none** | any local folder — works on one machine; phone/hub-on-other-devices won't see it |

Set `"sync"` in `whetstone.json` to whichever you chose — it's just an informational note.

---

## Step 3 — Open the hub (optional)

The hub shows your whole library — every source, what's sharp, what's due — on any device. It
never writes, never grades, and makes zero network calls; reviewing always happens by running
`/whetstone` in your agent.

1. Open **https://smdesai27.github.io/whetstone/** in **Chrome, Edge, or Brave** on desktop.
   (These implement the File System Access API; Safari and Firefox don't, and the page will say
   so.) Or open `hub/index.html` locally.
2. Click **Open whetstone folder** and pick the folder from Step 2. The browser grants
   **read-only** access; your files never leave your computer.
3. Bookmark it. To verify the privacy claim yourself: open DevTools → Network and confirm it
   stays empty.

**Want to see it populated right now, before you have any data?** This repo ships a
`sample/` folder. Point the hub at `whetstone/sample/` and you'll see decks, due items, sharp and
archived concepts, a log, and a profile immediately. Delete it (or just ignore it) once you have
real decks.

---

## Updating the skill

An update only ever replaces the installed skill files (`SKILL.md`, `FORMAT.md`) — your data
folder is never touched, and a newer skill always reads older-format files.

| How you installed | How you update |
|---|---|
| Installer script, agent prompt, or by hand | Run `/whetstone update` — it fetches the latest `SKILL.md` from this repo, compares versions, backs up your copy, and replaces it. Re-running the install one-liner is equivalent. |
| Claude Code plugin | `claude plugin update whetstone@whetstone` (restart to apply), or enable auto-update under `/plugin` → Marketplaces |

By default Whetstone never checks for updates on its own — no phoning home. To opt in to a
rate-limited check (at most once every 14 days, during a review session), set
`"updates": { "check": true }` in `whetstone.json`.

---

## Per-OS notes

- **macOS** — `install.sh` works in Terminal. For iCloud, the cleanest path is inside an
  iCloud-synced Obsidian vault so the concepts show up in the Obsidian app on your phone.
- **Linux** — `install.sh` works in any POSIX shell. Sync via Dropbox, Syncthing, or git.
- **Windows** — use `install.ps1` in PowerShell. WSL users can use `install.sh` instead, but
  install into the *Windows* agent's config dir if your agent runs on Windows (pass `--dir`).

---

## Troubleshooting

- **"This browser lacks folder access."** You're on Safari/Firefox or mobile. Use Chrome, Edge,
  or Brave on desktop, or open `hub/index.html` locally in one of those.
- **The hub shows "No decks yet" but I have decks.** The hub reads `*.md` files in a `decks/`
  subfolder (or the folder root if there's no `decks/`). Make sure your deck files have concept
  sections (`### <id> <title>` with `- tier:` / `- model:` fields) per `FORMAT.md`.
- **The agent didn't create the folder.** Re-run `/whetstone`; if it skips setup, it found an
  existing `whetstone.json` (or a PKM/gbrain protocol page) and is using that config.
- **Nothing is due.** That's normal and correct — come back when items ripen, or ingest something
  new. The hub and the skill both compute "due" from `due <= today` and `status: active`.
