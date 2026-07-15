# Decision Log

Record only adopted decisions. Brainstorming and unresolved alternatives belong in `docs/game/proposals/`.

## Decision template

### YYYY-MM-DD - Decision title

Status: Approved | Superseded | Deprecated

Decision:

Reasoning:

Affected systems or files:

Alternatives rejected:

Follow-up work:

---

### 2026-07-09 - Approve all five design pillars

Status: Approved

Decision: All five proposed design pillars are adopted as project canon:
1. Every Turn Is a Decision, Not a Ritual
2. The Board Is an Arena, Not a Racetrack
3. Build Your Champion
4. Chaos Has a Shape
5. Social Play and Spectator Readability First (originally "Hot-Seat Social Play First", renamed 2026-07-15)

Reasoning: The pillars were derived from analysis of the working prototype and reflect what the game's systems are already reaching toward. They provide a concrete filter for accepting or rejecting future features and changes.

Affected systems or files:
- `docs/game/DESIGN_PILLARS.md` — status changed from Proposed to Approved
- All future design and rules work must reference these pillars

Alternatives rejected: None — all five pillars were accepted as proposed.

Follow-up work:
- Document the core gameplay loop in `GAME_DESIGN.md` against the approved pillars
- Identify which design gaps (directionless movement, cosmetic-only characters, elimination downtime, passive card acquisition, center-tile passivity) to address first
- Character differentiation proposal (driven by Pillar 3)
- Board positioning improvements (driven by Pillar 2)

---

### 2026-07-15 - Confirm multiplayer direction and rename Pillar 5

Status: Approved

Decision:
1. Local hot-seat multiplayer is the current prototype target and immediate development priority.
2. Online multiplayer is a confirmed future goal. It must not be listed as a non-goal anywhere in project documentation.
3. Design Pillar 5 is renamed from "Hot-Seat Social Play First" to "Social Play and Spectator Readability First" and rewritten to support both local and eventual online play.

Reasoning: The original pillar name ("Hot-Seat Social Play First") implied the project would never support online multiplayer, which contradicts the project owner's confirmed direction. The pillar's core values — spectator readability, short downtime, clear visual feedback, engaging waiting-player experience — apply equally to local and online formats. Renaming the pillar avoids permanently foreclosing online multiplayer while preserving the design principles that make the game work in hot-seat today.

Affected systems or files:
- `docs/game/DESIGN_PILLARS.md` — Pillar 5 renamed and rewritten
- `docs/game/PROJECT_BRIEF.md` — multiplayer line updated, online multiplayer removed from non-goals
- `docs/game/GAME_DESIGN.md` — game overview, multiplayer considerations, spectator legibility, and Risk 6 updated to reflect both local and future online context

Alternatives rejected:
- Keeping the original pillar name with a footnote about online multiplayer — rejected because the name itself would continue to signal a hot-seat-only direction
- Creating a separate Pillar 6 for online multiplayer — rejected because the underlying values (readability, low downtime, social engagement) are the same across formats; splitting them would create false priority conflicts

Follow-up work:
- When online multiplayer design begins, evaluate which game mechanics need adaptation for networked play (hidden information, simultaneous actions, latency tolerance)
- Resolve open questions: AI opponents, mobile support

---
