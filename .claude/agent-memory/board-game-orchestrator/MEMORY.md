# Board Game Orchestrator Memory

## Project State
- PROJECT_BRIEF.md drafted, DESIGN_PILLARS.md approved (2026-07-09)
- GAME_DESIGN.md fully drafted with baseline loop, all sections populated (2026-07-09)
- RULEBOOK.md, RULES_REFERENCE.md still blank templates — blocked on stable design
- DECISION_LOG.md has one entry: pillar approval (2026-07-09)
- 8 design risks and 10 open design questions documented in GAME_DESIGN.md

## Key Architecture
- Vanilla JS, no framework, global `window.Game` namespace
- All scripts loaded via `<script>` tags in index.html
- Key files: gameState.js (constants/state), main.js (turn flow), cards.js (31 cards), abilitySystem.js (effects/statuses), boardGraph.js (topology), characterSelect.js, boardCamera.js, ui.js
- Board: 48-tile outer ring + 4 paths (7 tiles each) + center = 77 tiles
- 4 players, 6 characters (cosmetic only), 20 HP, 10 max Essence

## Known Code Quirk
- `CENTER_MANA = 3` constant defined but unused; actual center bonus is +1 via essence_empowerment status

## Workflow Notes
- Doc files under docs/game/ are source of truth; code is the prototype
- Design pillars are PROPOSED, not approved — do not treat as canon until owner confirms
- Rules formalization is blocked on approved pillars + stable GAME_DESIGN.md
