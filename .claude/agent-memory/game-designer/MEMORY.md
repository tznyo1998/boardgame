# Game Designer Agent Memory

## Project: Untitled Fantasy Board Game (Q1)

### Key file paths
- `D:\Cursor\Q1\gameState.js` — constants, player config, state shape
- `D:\Cursor\Q1\main.js` — turn flow, combat resolution, movement, ability dispatch
- `D:\Cursor\Q1\cards.js` — all 31 cards with full effect data
- `D:\Cursor\Q1\abilitySystem.js` — status effects, targeting, effect resolution, card pool
- `D:\Cursor\Q1\boardGraph.js` — tile adjacency, BFS distance, movement direction helpers
- `D:\Cursor\Q1\docs\game\PROJECT_BRIEF.md` — authoritative brief (draft, many open questions)
- `D:\Cursor\Q1\docs\game\DESIGN_PILLARS.md` — empty scaffold, awaiting first-time fill
- `D:\Cursor\Q1\docs\game\GAME_DESIGN.md` — empty scaffold

### Confirmed prototype facts (code-verified)
- 77 tiles: 48 outer track + 28 path tiles (4 paths x 7) + 1 center
- Center tile grants +1 Essence/turn via essence_empowerment status (code: G.CENTER_MANA = 3 is defined but the actual grant in beginTurn uses MAGIC_PER_TURN + 1 conditional bonus, not CENTER_MANA)
- 4 players hardcoded; start at corners 0, 12, 24, 36
- 12 ability tiles on outer track; each offers 3 random cards from shared pool (pool is consumed)
- Max 3 abilities held; replaced abilities are permanently discarded (do NOT return to pool)
- Turn mode is mutually exclusive: melee OR spells per turn, committed on first use
- Melee: same-tile only, d6 vs d6, damage = max(0, atk-def); undead always deals 5
- Characters are cosmetic only — no stat differences implemented
- Deathless Resolve (card 31, classTrait) triggers on lethal damage: sets HP to 10, Essence to 0, converts to Undead permanently, clears all abilities

### Card pool notes
- 31 cards total, 4 elemental tags: fire (8), lightning (8), ice (8), holy (4), plus multi-tag (Elemental Bolt) and untagged (Soul Swap, Deathless Resolve)
- Pool is shared and cards are removed permanently when picked — scarcity exists but is rarely felt with only 4 players
- Cards removed via replaceAbility are permanently gone (not returned to pool) — this can deplete the pool faster

### Known loop gaps (design analysis)
- No board-based goals or objectives beyond surviving — movement is directionless until you engage someone
- Center tile has no arrival event — just a passive Essence bonus while standing there
- No catch-up mechanism for eliminated-near players
- Characters are cosmetically distinct but mechanically identical — taglines promise differentiation that doesn't exist yet
