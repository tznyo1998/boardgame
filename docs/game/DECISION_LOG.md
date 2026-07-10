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
5. Hot-Seat Social Play First

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
