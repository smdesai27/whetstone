# Install & Setup

Whetstone is two things, installed once:

1. **The skill** (`SKILL.md`) — a markdown instruction file you drop into your agent. This is the
   only thing that writes state or calls a model.
2. **The hub** (`hub/index.html`) — an optional, read-only web viewer of your folder. Nothing to
   install; you just open a URL and point it at your folder.

Everything your learning produces is plain markdown in **one folder you choose**. Pick a folder
that *syncs* (iCloud, Dropbox, Obsidian Sync, git) and phone + hub review "just work."

There are three axes of variation — **which agent**, **where your folder lives** (PKM or plain
folder, and what syncs it), and **which OS**. Do Step 1 for your agent, Step 2 once, and Step 3
whenever you want the visual view.

---

## Step 1 — Install the skill

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

## Step 3 — Open the read-only hub (optional)

The hub shows what's sharp, what's due, your log, and your profile — on any device. It **never
writes, never grades, and makes zero network calls.** Reviewing always happens by running
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
