# Whetstone File Format Spec (v0.2)

Whetstone's entire state is plain markdown in one folder. **The files are the API** — the
`/whetstone` skill is the only writer; every other tool (the hub, your PKM, a phone editor)
only *reads* them. One writer, one source of truth, nothing to reconcile.

```
<whetstone folder>/
  whetstone.json   # config: sync note, session caps
  profile.md       # learner profile: recurring misconception patterns
  LOG.md           # append-only trace of everything consumed (the "log" tier)
  decks/
    <source-slug>.md   # one deck per source you chose to actively learn
```

There is no `PENDING.md`. "What's due" is *computed* from the concept files
(`due <= today` and `status: active`); the skill and the hub each derive it independently.

## The unit: a concept, not a card

A concept stores the **correct explanation** and a **menu of probe angles** — never a frozen
question. The reviewing client (the skill) writes a *fresh* question from these fields every
session, so you rehearse understanding instead of memorizing one phrasing. Varied retrieval is
what transfers to a reworded interview question; a frozen card only trains recognition of
itself.

### Deck file

YAML frontmatter, a short header paragraph, then concept items:

```markdown
---
title: "Serrano 2024: PPO for Training LLMs"
source: "https://www.youtube.com/watch?v=..."
created: 2026-07-12
tags: [rl, ppo]
---

One-paragraph header: what the source covers, when ingested, current weak spots.

### C1  Importance-sampling correction in the PPO ratio
- tier: core
- anchor: "the ratio corrects for the fact the data came from the old policy" — 12:40
- model: The ratio pi_new/pi_old reweights rewards collected under the old policy so the gradient estimates the NEW policy's expected return — an importance-sampling correction for off-policy data; without it, reusing a batch biases the update.
- probes: derive-the-ratio | why-not-raw-difference | what-breaks-without-it | connect:your-RLHF-work
- weak-on: 2026-07-12 confused the ratio with momentum
- stage: 1
- due: 2026-07-16
- history: 2026-07-12 fail
- status: active
```

Field rules:
- Header line `### <id>  <one-line title>` — `id` is short (`C1`); the title names the concept
  for humans and for the hub sidebar.
- `tier`: `core` | `gist`. (The third tier, `log`, is not a concept — it's a line in LOG.md.)
  - **core** — durable / field knowledge. Climbs the full ladder and is maintained forever.
  - **gist** — situational / project-scoped. Climbs a short ladder and holds; archive in bulk
    when the project ends.
- `anchor`: a short quote or timestamp from the source that grounds the concept, so the skill
  can re-derive rather than hallucinate. Optional but recommended.
- `model`: the reference explanation, written at ingest **from the source** (never invented).
  Single line (use "; " for internal structure). Grading checks answers against this — depth
  of mechanism in the user's own words, not keyword match.
- `probes`: `|`-separated angles the reviewer rotates through so no two sessions ask the same
  question. `connect:<thing>` means "apply it to the user's work." Free-form hints, not a fixed
  enum — the skill may add angles over time.
- `weak-on`: append-only notes on *how* the user has missed this concept; steers the next
  probe. Distinct from `history` (which records only outcomes).
- `stage`: integer index into the ladder.
- `due`: `YYYY-MM-DD`. Due when `due <= today` and `status: active`.
- `history`: `; `-separated, append-only: `YYYY-MM-DD pass|partial|fail`.
- `status`: `active` | `archived`. Archived items are never scheduled and never auto-created —
  **archiving is always a deliberate decision, never a consequence of success.**

Unknown fields are preserved by every client — readers display them, the skill round-trips
them. Add your own without fear.

## LOG.md — the "log" tier

Append-only, one line per consumed source that didn't earn a concept. This is the guilt-free
"remember nothing" outcome that keeps `core`/`gist` honestly scarce — plus a searchable trace
you can promote to a concept later.

```markdown
# Whetstone — Consumption Log

- 2026-07-14 [podcast] Latent Space — RLHF economics · why: pricing intuition for my RLHF work · https://… · #rl
- 2026-07-13 [article] "Attention is off by one" · why: fun aside, probably not load-bearing · https://…
```

Format: `- <date> [<kind>] <title> · why: <one line> · <url> · <#tags>`. The skill appends;
nothing rewrites it. To promote a logged item, the skill reads the line and creates a concept.

## profile.md — learner profile

Append-only list of *how* the user misunderstands, not what they got wrong:

```markdown
## Misconception patterns
- 2026-07-12 — Conflates an objective's value with its gradient (PPO clipping). Watch for
  gradient-flow reasoning; target with probes that ask "what is the derivative doing here?"
```

Ingestion consults this file to write probes that target known patterns.

## whetstone.json

```json
{
  "version": "0.2",
  "created": "2026-07-12",
  "sync": "icloud",
  "session": { "minutes": 15, "max_concepts": 8 },
  "updates": { "check": false, "last_checked": "2026-07-15" }
}
```

**All configuration lives here**, not in any client's local storage — so it syncs with your
files. `sync` is an informational note (Whetstone never implements sync, it inherits yours).
`session` caps apply to every client and to the skill.

`version` is the version of **this file format**, not of the skill — the skill carries its own
`version` in `SKILL.md`'s frontmatter, and a newer skill must read older-format folders
gracefully (migrations are proposed, never silent). `updates` is optional: with
`"check": true`, the skill may compare the installed skill version against the repo at most
once every 14 days during a session, writing `last_checked` back. Absent or `false` — the
default — the skill never checks the network for updates.

## Scheduling contract (the skill is the only writer)

Ladder (days): **[1, 3, 7, 16, 35, 90, 180, 365]**. `core` climbs the whole ladder then holds
at 365 (annual maintenance). `gist` climbs to index 4 (35 days) then holds.

Per graded concept:
- **pass** → `stage = min(stage+1, top)`; `due = today + ladder[stage]`.
- **partial** → `stage = min(stage+1, top)`; `due = today + ladder[max(0, stage-1)]` — advances,
  but at the shorter previous interval. **A partial must always move forward**, never stall.
- **fail** → `stage = max(0, stage-1)`; `due = today + ladder[stage]`; the fail-streak grows.
- **3 consecutive fails** → the skill *rewrites* the concept (re-anchor to the source, sharpen
  the model) and resets the streak. The problem is the item, not the learner.

Append the outcome to `history`; never delete history. **Nothing retires automatically** —
retention is maintained by long intervals, and `archived` is only ever set deliberately. A
hesitant answer that leaves the schedule unchanged would recur at the same interval forever;
that is why `partial` advances.
