---
title: "How Whetstone works"
source: "README.md / FORMAT.md"
created: 2026-07-12
tags: [example, meta]
---

Sample deck bundled so you can open the hub and immediately see decks, concepts, due items,
and the sharp/archived states. The due dates below are in the past on purpose, so at least one
concept always shows as "due" whenever you open it. Point the hub at this `sample/` folder, or
delete it once you have real decks.

### C1  A concept stores a model + probes, never a frozen question
- tier: core
- anchor: "the skill writes a fresh question every session" — FORMAT.md
- model: Each item keeps the correct explanation (`model`) and a menu of angles (`probes`); the reviewing skill writes a NEW question every session from those fields. Varied retrieval is what transfers to a reworded question — a frozen card only trains recognition of itself.
- probes: why-not-store-the-question | what-does-varied-retrieval-buy | connect:how-you-review-today
- weak-on: 2025-01-01 described it as a normal flashcard
- stage: 1
- due: 2025-01-02
- history: 2025-01-01 partial
- status: active

### C2  Targeting matters more than making cards
- tier: core
- anchor: "consuming something and carding nothing is a correct outcome"
- model: The hard part is deciding what deserves to be remembered. Every source is triaged into core (durable), gist (situational), or a single searchable line in LOG.md. Keeping core/gist scarce is what makes the daily review honest and short.
- probes: why-triage | what-goes-to-the-log | connect:your-last-article
- stage: 6
- due: 2030-01-01
- history: 2025-01-01 pass; 2025-02-01 pass; 2025-05-01 pass
- status: active

### C3  The schedule ladder — partial advances, nothing auto-retires
- tier: gist
- model: The ladder is [1,3,7,16,35,90,180,365] days. Pass climbs a rung; partial also climbs but reviews at the shorter previous interval so it never stalls; fail drops a rung; three fails rewrites the item. Nothing is ever removed for succeeding — you archive deliberately when a topic stops mattering.
- probes: why-does-partial-advance | what-happens-on-three-fails | why-nothing-auto-retires
- stage: 2
- due: 2030-06-01
- status: active

### C4  The hub is a read-only viewer (archived example)
- tier: gist
- model: The hub reads your folder through a read-only browser permission and never writes, grades, or calls the network. All reviewing happens in the skill. This concept is marked archived to show that state in the viewer.
- probes: what-can-the-hub-do | what-can-it-not-do
- stage: 3
- due: 2030-01-01
- status: archived
