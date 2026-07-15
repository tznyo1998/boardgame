# Game Design Document

Status: Draft
Last updated: 2026-07-15

---

## Game overview

This is a 4-player fantasy battle game played on a shared board. The current prototype uses local hot-seat (pass-and-play) format, with online multiplayer planned as a future goal. Each player controls a champion that races around an outer track, ventures down inner corridors toward a central arena, and accumulates spell cards from ability tiles scattered across the board. Champions attack rivals with melee or spells, spending Essence (mana) to fuel abilities and spending Health when hit. The last champion standing wins. Every turn demands a concrete sequence of choices — where to move, whether to fight now or save Essence, whether to dive toward the center for a resource bonus or stay on the outer track where ability tiles cluster. The game is designed to be legible and entertaining for players who are watching and waiting for their turn, with dramatic dice rolls, visible spell effects, and a game log that narrates every event.

---

## Core gameplay loop

Each player's turn follows a clear spine with branching choices at each step:

1. **Start-of-turn effects resolve automatically.** Burn damage ticks, Cryostasis checks, and Essence empowerment bonuses apply before the player acts. If Cryostasis is active, the turn is skipped entirely.

2. **The player rolls for movement.** One d6 roll is allowed per turn by default. Some card effects grant additional rolls. The resulting number is queued and must be spent or deliberately skipped.

3. **The player chooses a direction.** On the outer track, the options are clockwise, counter-clockwise, or entering an inner path. On an inner path, the options are deeper (toward center), back (toward outer track), or entering the center tile if on the midpoint. From the center tile, the player can exit in any of four directions.

4. **The player chooses a combat mode (optional, may happen before or after rolling).** The two modes are mutually exclusive for the turn: Melee or Spells. Melee is chosen implicitly by clicking the melee button. Spells mode must be declared explicitly before casting. Undead players cannot enter Spells mode.

5. **Melee combat resolves** if the active player shares a tile with another living player and chooses to fight. Both sides roll a d6; the attacker deals damage equal to max(0, attacker roll minus defender roll). Melee is available once per turn.

6. **Spell casting occurs** if Spells mode is active. The player may cast any held spell they can afford, subject to per-card use limits, Essence cost, and range constraints. Multiple spells may be cast in one turn if Essence permits and card rules allow.

7. **Landing on an ability tile triggers a card offer.** After movement resolves, if the player's final position is one of the 12 designated ability tiles (outer track only), three cards are drawn from the shared pool and displayed. The player picks one to add to their hand or to replace an existing card.

8. **The player ends their turn.** End Turn becomes available after a movement roll has been used or skipped. Abilities can be used freely across the turn timeline, not just before or after movement.

9. **Elimination and victory check.** After any action that could deal damage, the game checks whether exactly one player remains alive. If so, that player wins.

---

## Player objective

Be the last player alive. Players are eliminated when their Health reaches 0. There is no point system, no time limit, and no board-completion condition. Elimination is permanent, though the Deathless Resolve class trait allows one conversion to an Undead state instead of dying — at the cost of all spells and Essence.

---

## Setup

Four players begin at the four corner tiles of the outer track (tiles 0, 12, 24, and 36), placing them equidistant from one another on the starting perimeter. Each player starts with 20 Health and 0 Essence, holding no ability cards. The shared card pool contains all 31 cards, shuffled. A character selection screen is presented before the first turn; each of the four players picks a unique champion from the available roster. Character selection is sequential — each player picks in order and cannot choose a character already taken. Players whose chosen character sprite art has not yet been loaded see that card as "coming soon" and cannot pick it. A Classic Token option is always available as a fallback.

---

## Turn and round structure

There is no formal "round" grouping. Play proceeds in a strict turn order: Red (player 0), Blue (player 1), Green (player 2), Yellow (player 3). After Yellow's turn, the cycle restarts with Red. Eliminated players are skipped silently.

**Within each turn, the phases are not rigid steps but a flexible window.** The rules enforce some ordering (movement must be rolled before it can be used; melee and spells modes are mutually exclusive), but many actions can be sequenced freely. Specifically:

- The player may click Melee before rolling, after rolling, or after moving.
- The player may declare Spells mode at any point before or after rolling, but before casting any spell.
- Ability cards may be cast before movement, after movement, or at any point in between, as long as Spells mode has been declared.
- End Turn becomes available only after at least one movement roll has been used or movement has been deliberately skipped.

This flexible ordering is intentional: it gives players meaningful sequencing decisions. A player might cast a mobility spell (Lightning Step grants an extra movement roll), then move, creating a situation where the correct play order matters.

**Start-of-turn automatic effects (in order):**
1. Start-of-turn expiring statuses are cleared.
2. Burn damage ticks (non-lethal; minimum 1 HP remains).
3. Essence empowerment bonus applies (+1 Essence if on center tile).
4. Base Essence regeneration grants +2 Essence, up to the 10-cap.
5. Cryostasis skip check: if triggered, turn ends immediately.
6. Per-turn tracking resets (ability uses, cost modifiers, hit-tag records, movement roll counters).

**End-of-turn automatic effects:**
1. Turn-duration statuses decrement and expire.
2. Own-turn-duration statuses decrement (Cryostasis).
3. Rotation-duration statuses decrement across all players (Frost, Frozen — ticked after each player's turn).

---

## Board structure and movement

**Topology.** The board has three zones:

- **Outer track**: 48 tiles arranged in a closed square ring, 12 tiles per side. Players circle this ring freely in either direction. Starting positions (corners at 0, 12, 24, 36) and center entry points (tiles 6, 18, 30, 42) mark the key outer-track landmarks. Twelve ability tiles are distributed around the outer track (3 per side, avoiding corners and entry points): tiles 3, 9, 10, 15, 20, 22, 27, 32, 34, 39, 44, 46.

- **Four inner paths**: Each path contains 7 tiles, connecting one of the four center entry points (outer track) to the center tile. A path branches off the outer track at tiles 6, 18, 30, or 42. Paths lead inward; the middle tile (position 3 on a 7-tile path) connects laterally to the center tile.

- **Center tile (tile 76)**: A single shared tile at the board's center, connected to all four paths at their midpoints. Players who begin their turn on the center tile gain +1 bonus Essence (on top of the base +2 per turn). The center tile is a meeting point where players from any path converge and may fight.

**Movement mechanics.** Each turn, the active player rolls one d6. The result determines how many steps they may take in a chosen direction. Direction is chosen once per roll: the player picks from a menu of available moves for their current tile and zone. On the outer track, the two base options are clockwise and counter-clockwise. At center entry points, a third option appears to enter the inner path. On a path, options are "deeper" (toward center) or "back" (toward outer track) with an option to exit to the center when at the midpoint. From center, four exit directions are available.

Critically, tile-to-tile steps consume movement distance (e.g., rolling a 4 means 4 steps clockwise). However, transitions between zones (entering a path, entering center, exiting center) consume the entire remaining movement in a single action. This makes entering or exiting the center a committed, all-or-nothing decision regardless of roll value.

**Spatial strategy.** The outer track is where ability tiles and most combat opportunities live. The inner paths are narrow corridors that reduce route flexibility but channel players toward the center. The center tile is the board's highest-value position for Essence generation and creates a natural conflict zone where multiple players can be co-located. Movement direction is a genuine choice on most turns — clockwise and counter-clockwise offer very different positions relative to other players and upcoming ability tiles.

**Landmarks.** The board includes optional 3D CSS landmarks (volcano at center, mountains, castle, hut, tower, keep) that serve as visual orientation aids. These are decorative and have no gameplay effect. They can be toggled off.

---

## Resources and economy

**Health (Life)**
- Starting value: 20 per player
- Maximum value: 20 (hard cap)
- Floor: 0 (death); Burn damage has a non-lethal floor of 1 HP
- Sources of damage: melee combat (attacker d6 minus defender d6), spell effects (fixed amounts or dice-based), Burn status (1 per turn, 3 turns), self-sacrifice spell effects
- Sources of recovery: Restoration (burns Essence, heals double), Soothing Flames (heals 4 and cleanses debuffs), Deathless Resolve trigger (sets to 10 on what would be lethal)
- No natural Health regeneration per turn

**Essence (Mana)**
- Starting value: 0
- Maximum value: 10 (hard cap)
- Natural regeneration: +2 per turn start (base)
- Center bonus: +1 per turn start while occupying the center tile (total +3 while on center)
- Consumed by casting spells (each card has a fixed costMp, with some variable-cost cards consuming chosen amounts)
- Can be burned as a resource by Restoration (burns Essence, heals double) and by some enemy effects (Heavenly Volt Cannon can burn 1 Essence on stop-roll)
- Deathless Resolve trigger resets Essence to 0
- Undead players cannot cast spells, making Essence generation meaningless for them

**Economy tension.** Players accumulate Essence slowly (2 per turn, capped at 10). High-cost spells (8–10 Essence) require multiple turns of saving unless the player holds Static Overload to discount lightning spells or stays on the center tile for the bonus. Low-cost spells (1–3 Essence) can be chained within a single turn. This creates a natural spend-versus-save tension: spending Essence early for positioning or chip damage versus hoarding for a decisive high-cost spell.

---

## Cards, items, abilities, and events

**The card pool.** There are 31 cards total, shared across all players. The pool is consumed as cards are acquired: a card removed from the pool by any player is permanently unavailable to others for the rest of that game. When a player at 3 cards replaces one to pick up a new card, the discarded card is also permanently removed from the pool (it does not return). This creates genuine late-game scarcity, though with only 4 players and 31 cards, depletion is rarely felt unless replacements are frequent.

**Card types.** The schema defines three card types:
- `spell` — the active type used by all current 30 acquirable cards. Spells are cast by declaring Spells mode and paying Essence.
- `classTrait` — currently implemented only by Deathless Resolve (card 31), which functions as a passive triggered effect rather than an actively cast spell.
- `weapon` — defined in the schema but not yet assigned to any current card.

**Elemental tags.** Cards carry one or more elemental tags that interact with synergy effects and vulnerability statuses:
- **Lightning** (8 cards): cards 1–8. Emphasize chain damage, dice-based escalation, and turn-wide efficiency through the Bolt Rend combo (hit by lightning first, then apply Bolt Rend bonus) and Static Overload (1 cost-reduction for all other lightning spells this turn).
- **Fire** (8 cards): cards 14–21. Emphasize AoE, burn-over-time, vulnerability application (Solar Flare makes target permanently take +1 from fire), and self-sacrifice AoE (Combustion).
- **Ice** (8 cards): cards 22–28. Emphasize status layering — applying Frost (debuffs movement and attack rolls) and upgrading to Frozen (stronger debuffs) — and two permanent vulnerability applications.
- **Holy** (4 cards): cards 9, 10, 11, 12, 13. Emphasize defensive and reactive effects: self-healing (Restoration), damage-block (Sanctuary Aura), and punishing enemies for the holy player's own Life recovery (Reverse Restoration).
- **Multi-tag**: Elemental Bolt (card 29) carries holy, fire, and ice tags simultaneously, making it versatile for combo chaining with any elemental synergy.
- **Untagged**: Soul Swap (card 30) and Deathless Resolve (card 31) carry no elemental tags.

**Card acquisition.** Landing on any of the 12 ability tiles on the outer track triggers an offer of 3 randomly drawn cards from the remaining pool. The player must pick exactly one — there is no "skip all" option at the modal level (though declining the offer exits without picking). If the player holds fewer than 3 cards, the chosen card is added directly. If the player already holds 3 cards, a replacement modal prompts them to discard one existing card to make room.

**Hand limit.** Maximum 3 cards held simultaneously. This limit applies permanently: players cannot exceed 3 regardless of how many ability tiles they land on. The 3-card limit concentrates player identity into a very small hand, making each card's strategic role significant.

**Use modes.** Cards are either `oncePerTurn` (can only be cast once per turn, with some exceptions for extra recast grants) or `multiPerTurn` (can be cast multiple times subject to a per-turn cast limit — Stormlash Chain allows 5 casts, Lightning Bolt allows 2, and so on).

**Targeting.** Cards specify their targeting mode:
- `self` — affects the caster only
- `enemy` — requires selecting a single enemy in range
- `allEnemies` — hits all living enemies regardless of distance (Meteor Barrage, range: 999)
- `allEnemiesInRange` — hits all enemies within the stated range (Pyroclasm range 3, Ice Age range 8, etc.)
- `any` — allows selecting self or any in-range target (Lightning Step)

**Spell range.** Range is measured as BFS graph distance across the tile adjacency graph. A range of 0 means self-only. Range of 1 means same tile or one tile away. High-range spells (Solar Flare at range 8, Ice Age at range 8, Meteor Barrage at range 999) can reach most or all of the board from a central position.

**Status effects applied by cards.** Several cards apply persistent status effects that interact with future turns and future cards:
- **Burn** (Ignite): 1 damage per turn for 3 turns, non-lethal. A debuff; cleansable.
- **Frost** (Ice-tag spells): reduces movement roll by 2 and attack roll by 1. Rotation-duration (expires after each living player has taken a turn).
- **Frozen** (upgrade from Frost via Cryokinesis, Arctic Vortex, Absolute Zero): reduces movement roll by 5 and attack roll by 3. Rotation-duration.
- **Cryostasis** (self-applied by Cryostasis card): movement locked, spell-immune for 2 own turns, skips next turn. A self-buff for players who want to be untouchable briefly.
- **Sanctuary** (Sanctuary Aura): blocks all incoming damage until the protected player moves or their next turn starts.
- **Silenced**: prevents spell casting for the turn. Duration: 1 turn.
- **Spell immune** (Eternal Starlight Barrier): prevents spells from targeting this player until next turn start.
- **vuln_fire / vuln_ice** (Solar Flare, Absolute Zero): permanent vulnerability — target takes +1 damage from that element for the rest of the game. Survives for the game's duration.
- **Undead** (Deathless Resolve trigger): permanent. Locks out spell casting and card drawing; melee always deals exactly 5 damage ignoring dice.

**Notable individual cards.**

- *Deathless Resolve* (card 31, classTrait): The only passive card in the current set. It is not cast — it triggers automatically when lethal damage would kill the holder. Result: player survives at 10 HP, loses all Essence and all held cards, and becomes permanently Undead. This is a one-time-per-game trigger (tracked by the `deathlessTriggered` flag). The Undead state cannot cast spells or draw new cards, and the player's melee attacks always deal 5 damage rather than using the dice formula.

- *Soul Swap* (card 30): Swaps the caster's current Life total with a target player's Life total. No elemental tag. Cost: 8 Essence.

- *Genesis* (card 12): Deals damage equal to double the caster's current Essence, capped at 20. Range 2. Rewards players who hoard Essence; a full-tank cast at 10 Essence deals 20 damage, enough to one-shot from full Health.

- *Static Overload* (card 4): Costs 2 and deals 2 self-damage, but reduces the Essence cost of all other lightning spells by 1 this turn. Enables chain-casting multiple lightning spells within one turn's budget.

- *Restoration* (card 9): Variable cost — the player chooses how much Essence to burn (up to 10) and heals double that amount. Up to 20 healing per cast. Maximum HP is capped at 20.

---

## Characters or player identities

**Current state.** The game offers six named characters on the character selection screen:

| Key | Name | Tagline |
|---|---|---|
| warlock | Warlock | Wielder of forbidden flame |
| mage | Mage | Master of the arcane |
| warrior | Warrior | Steel and fury |
| archer | Archer | Death from afar |
| paladin | Paladin | Shield of the light |
| priest | Priest | Divine mender |

A seventh option, "Classic Token," is always available for players who prefer a generic game piece.

Characters are cosmetic only in the current prototype. All six have identical starting stats (20 HP, 0 Essence), access to the same shared card pool, and no mechanical differentiation. The taglines imply mechanical identities — a Warrior who excels at melee, an Archer with range advantages, a Priest who heals — but none of this differentiation is implemented. The character selection screen captures the choice, applies a sprite to the player token, and the selection has no further gameplay effect.

**Art availability.** Characters whose sprite image file is missing are shown as silhouettes labeled "Coming soon" and cannot be selected. Only characters whose sprite loads successfully are available for pick. The Warlock sprite is the only one confirmed as linked in the codebase; other characters depend on art files being present in `assets/characters/`.

**Design intent per Pillar 3 (Build Your Champion).** The character roster is the foundation for distinct player identities, but the differentiation is entirely unbuilt. The taglines signal the intended design direction, and the character selection UX is in place, but there are no starting ability differences, no unique cards, and no stat variations. This is a significant gap relative to the approved design pillar.

---

## Player interaction

**Melee combat.** Melee is available once per turn when the active player shares a tile with one or more living opponents. It requires no Essence. Both sides roll a d6; damage dealt equals max(0, attacker roll minus defender roll), so the attacker can deal 0 to 5 damage per strike. Undead attackers always deal exactly 5 damage regardless of dice. Defense is passive (the defender rolls once and their roll reduces incoming damage; they make no active block decision). If multiple enemies occupy the same tile, the attacker selects one target via a modal.

Melee and Spells modes are mutually exclusive for the turn — choosing one prevents the other. This is a genuine resource decision: melee is free but limited to the same tile; spells cost Essence but can reach across the board.

**Spell combat.** Spell-based combat uses the range system (BFS graph distance). Offensive spells can hit targets anywhere from 1 to 999 tiles away depending on the card. Players must be in Spells mode and have sufficient Essence. Spell interactions include:
- Splash AoE (Pyroclasm, Ice Age, Absolute Zero, Meteor Barrage) affecting all enemies in a zone simultaneously
- Knock-back effects (Pyroclasm, Eternal Starlight Barrier) that change target positions
- Life swap (Soul Swap) that can reverse a losing position
- Damage bonuses conditional on prior hits this turn (Bolt Rend, Thunder King's Judgement)
- Status applications affecting future turns (Burn, Frost, Frozen, vulnerability stacks)

**Status effects as interaction.** Several statuses create cross-turn player interaction:
- A frozen target is weaker in their next turn even if the caster does nothing more.
- Solar Flare's permanent fire vulnerability means all future fire damage against that player is amplified — relevant if a different player later acquires fire spells.
- Sanctuary Aura creates a window where one player is temporarily untouchable, forcing opponents to wait or seek other targets.
- Cryostasis is a self-imposed isolation that opponents must plan around.

**Sanctioned interaction points.** The only currently implemented forms of player-to-player interaction are melee (same tile only) and spell targeting. There is no trading, diplomacy, or alliance system.

---

## Progression and rewards

**Within-session progression.** Players grow stronger over the course of a game by acquiring ability cards from ability tiles. Starting with no cards, a player builds a hand of up to 3 spells over successive turns. Card acquisition is the primary progression mechanic.

**Spatial progression.** Center access improves a player's Essence income. A player who holds the center tile gains +1 Essence per turn above the base rate, which compounds into casting more spells per turn or hoarding Essence for high-cost spells sooner.

**Status-based permanent progression.** Solar Flare and Absolute Zero apply permanent vulnerability debuffs to targets. These persist for the game's duration, meaning landing them early creates a compounding advantage against that target.

**Deathless Resolve as milestone.** If a player triggers Deathless Resolve, they transition to an Undead state — a significant identity shift mid-game. They lose all spell capability but gain reliable 5-damage melee and immunity to the normal death check for one more near-lethal encounter.

**No between-session progression.** There is no persistent advancement across games. Each session starts fresh.

**Catch-up mechanics.** None are currently implemented. A player who has been reduced to low Health and holds no useful cards has no system-level assistance. The Deathless Resolve card provides one player-chosen catch-up path, but only for the one player who acquires it. There is no rubber-band damage scaling, no consolation card draws for losing players, and no safe-zone mechanic.

---

## End game

**Win condition.** Last player alive wins. The game constantly monitors Health values after any damaging effect. When exactly one player remains above 0 HP, `state.winner` is set to that player's index and all interactive buttons are disabled.

**Elimination.** Eliminated players (HP reaches 0) are skipped in the turn order. Their tokens remain on the board as visual context but they take no more actions. The `checkWinner` function handles the scan after combat resolution and deduces the final survivor.

**Pacing concerns.** With 4 players starting at 20 HP each, and base damage rates of 0–5 from melee plus variable spell damage, games can run long if players avoid conflict. There is no timer, no forced engagement mechanic, no shrinking safe zone, and no escalating pressure. Players can circle the outer track indefinitely without engaging. This is a known pacing risk (see Known Design Risks).

**Deathless Resolve and the 3-player end game.** If a player triggers Deathless Resolve, they enter an Undead state that cannot be triggered again. Their guaranteed 5-damage melee attacks make them a consistent threat in 2- or 3-player end states, but their inability to cast spells or draw cards limits their long-term viability.

---

## Multiplayer considerations

**Current format: local hot-seat.** The prototype is built for 4 players sharing one device, passing control between turns. This is the immediate development priority. Online multiplayer is a confirmed future goal but no networking infrastructure exists yet. AI opponents and single-player mode remain open questions.

**Turn visibility.** Every action resolves with animated feedback (movement step animation at 150ms intervals, dice roll animations, combat result modal, spell cast overlay) intended to keep watching players engaged. The game log records all events in text, giving spectating players a narrative of what happened.

**Kingmaker risk.** With 4 players, a third player in a winning position can be undermined if the two weaker players coordinate. No formal alliance or kingmaking system exists; this plays out purely through player social dynamics.

**Downtime.** In a 4-player game, each player waits through 3 other turns before acting again. Turns involving only movement and no combat resolve quickly (seconds). Turns with multiple spell casts can take longer due to animations and modal interactions. The game log and board visibility help spectating players stay engaged.

**Spectator legibility.** Combat resolution is displayed in a dedicated modal showing both dice rolls and the result. Spell effects are announced in the game log. Health bars are always visible for all players. The board camera auto-focuses on the active player. All of these serve Pillar 5 (Social Play and Spectator Readability First) and will translate directly to an online multiplayer context where remote players need the same visual clarity.

---

## Onboarding and tutorial considerations

**Current state: no tutorial exists.** The game launches directly into a character selection screen and then immediately into the first player's turn. There is no tutorial mode, no contextual tooltips explaining what ability tiles do, no first-run guidance, and no help system.

**New player friction points.** Based on the prototype structure, the most likely confusion points are:
- The movement sequence: roll first, then press Move, then choose a direction. The two-step roll-then-commit is non-obvious.
- The Melee vs. Spells mode lock-in: players who click a spell without declaring Spells mode receive only a log message, which may be missed.
- Understanding that ability tiles only trigger on movement landing (not just passing through).
- The hand-replacement flow: when at 3 cards, the game presents a discard modal rather than simply adding the card.
- Cryostasis self-applying a skip-turn: players may not realize they voluntarily passed their next turn.
- Deathless Resolve being a passive (cannot be cast) while displaying alongside castable cards.

**What could help.** A single first-turn guided prompt explaining the roll-move sequence would resolve the majority of friction. Card tooltips on hover (effect summary, cost, range) would supplement the card description text. These are implementation concerns, not design concerns, but the design should note the gaps.

---

## Current balance knobs

The following constants and values are tunable without architectural changes to the game:

- `G.MAX_HEALTH = 20` — starting and maximum Life per player
- `G.MAX_MAGIC = 10` — Essence cap
- `G.MAGIC_PER_TURN = 2` — base Essence regenerated at turn start
- `G.CENTER_MANA = 3` — defined constant (note: center bonus is actually implemented as MAGIC_PER_TURN + 1, not CENTER_MANA directly; the constant is not used in the turn logic)
- `G.MAX_ABILITIES = 3` — maximum cards held simultaneously
- `G.PATH_TILES_PER_PATH = 7` — length of each inner path; controls how far the center is from the outer track
- `G.TILES_PER_SIDE = 12` — outer track side length; controls board circumference
- `G.ABILITY_TILES` (12 tiles) — placement of card-offer tiles; controls frequency of card acquisition
- `G.CENTER_ENTRY_POINTS` (4 tiles) — which outer track tiles branch to inner paths
- Per-card `costMp` values (range: 0–10 across current cards)
- Per-card `range` values (range: 0–999 across current cards)
- Per-card `effect.amount`, `effect.damage`, `effect.heal` values (all provisional)
- Melee damage formula: max(0, attackerD6 - defenderD6) — produces 0–5 damage; Undead fixed at 5
- Burn: `damagePerTurn: 1`, `turns: 3` in Ignite's effect data
- Frost move penalty: 2; Frost attack penalty: 1
- Frozen move penalty: 5; Frozen attack penalty: 3
- Deathless Resolve trigger outcome: HP set to 10, Essence set to 0
- Card offer count per ability tile landing: 3 (hardcoded in `G.offerCards`)

---

## Known design risks

**Risk 1: No board-based objectives create directionless early turns (conflicts with Pillar 1 and Pillar 2).**
Players start with no cards and 0 Essence. The only immediately available action is movement. With no board goals beyond "reach an ability tile," early turns are movement-only rituals rather than decisions. Players circle the outer track toward the nearest ability tile by default. This conflicts with Pillar 1 (every turn a decision) and Pillar 2 (board as strategic arena). The board currently functions more as a racetrack to ability tiles than a contested arena. There are no control points, no positional bonuses from most tiles, and no reason to seek out specific board positions beyond the center tile's Essence bonus.

**Risk 2: Characters are cosmetic only (conflicts with Pillar 3).**
All six characters play identically. The character selection screen creates an expectation of meaningful differentiation that the prototype does not deliver. Players who pick "Warrior" expecting melee advantages, or "Archer" expecting ranged benefits, will find they play identically to every other pick. This is the largest single gap between the current prototype and the approved design pillars.

**Risk 3: No catch-up mechanic creates snowball risk (conflicts with Pillar 4).**
A player who falls behind — low HP, no cards, bad position — has no system assistance. With permanent vulnerability stacks (Solar Flare, Absolute Zero), a targeted player can be made permanently more fragile, compounding their disadvantage. There is no rubber-banding, no consolation mechanism, and no protection from a coordinated focus. Deathless Resolve provides a single-use reversal for one player but is not a systemic solution.

**Risk 4: Center tile has no arrival event or contest mechanic.**
Entering the center tile currently only applies the `essence_empowerment` status passively. There is no arrival effect, no contest mechanic for multiple players on the center, and no reward for being first to reach it. The center is geometrically special but experientially unremarkable except for the +1 Essence bonus.

**Risk 5: Card pool scarcity is rarely felt with the current player count.**
The 31-card pool shared among 4 players creates theoretical scarcity (each player can hold at most 3 cards, so a maximum of 12 of 31 cards would be in play if all players filled their hands). In practice, depletion is unlikely within a game's natural length at 4 players. The intended scarcity tension — fighting over a limited pool — does not materialize in most games.

**Risk 6: Pacing has no escalation.**
The game has no mechanism to prevent indefinite avoidance. Players can stay on the outer track and never engage if they choose. No shrinking play area, no turn limit, no escalating event deck, and no forced movement toward other players means games can stall. This is a pacing risk in any multiplayer format — local hot-seat (where waiting players are watching) and future online play (where remote players may disengage entirely).

**Risk 7: Undead state is a permanent dead-end for the player who triggers it.**
Once Undead, a player cannot cast spells, cannot draw cards, and always deals exactly 5 melee damage. Against a spell-empowered opponent at full HP, an Undead player at 10 HP would need 4 successful melee hits to win, all on the same tile, while unable to mitigate incoming damage. The Deathless Resolve trigger trades near-certain death for a low-viability survival state. This may feel like a false hope rather than a genuine second chance.

**Risk 8: Mutual exclusivity of Melee and Spells modes removes interesting hybrid play.**
The current lock — choose one mode for the whole turn — prevents strategies that combine a melee strike with a buff or utility spell in the same turn. This simplifies the decision but eliminates a class of interesting turn combinations that the card set's hybrid effects (Lightning Step grants a movement roll alongside damage) seem to gesture toward.

---

## Open design questions

1. **What is the intended game length?** No target session duration exists. The answer determines whether current damage rates and ability tile density are appropriate, and whether a pacing mechanism is needed.

2. **When will character mechanical differentiation be implemented?** Each character's mechanical identity needs design definition before any other pillar alignment work can proceed. Should differentiation come from starting cards, unique passive abilities, stat differences, or something else?

3. **Should the center tile have a contest mechanic?** If two players occupy center simultaneously, should they fight, should there be a territory bonus, or should the current shared-benefit model stand?

4. **Is there a catch-up mechanic planned?** If so, what form should it take — consolation card offers, HP floor protection, stat scaling with player count, or something else?

5. **Should melee and spells be mutually exclusive by design going forward?** This is the most constraining turn-structure decision. If hybrid turns are ever allowed, the entire mode-selection system would need revision.

6. **What is the intended role of the inner paths?** Currently the paths are movement corridors to the center. Should path tiles have special properties (ambush positions, unique terrain effects) to make path traversal strategically interesting beyond "a different route to center"?

7. **Should eliminated players have any continued participation?** Ghost mode (spectate only), last-act effects, or bequeathing a card to a chosen player are all options. Currently they simply stop playing.

8. **What does the endgame feel like in a 2-player scenario?** A 2-player final is likely the most common endgame state. Is the current board size (48 outer + 28 path + 1 center tiles) appropriate for 2 remaining players, or does it create too much avoidance space?

9. **Is the 3-card hand limit a design constraint or a tunable knob?** The current limit creates focused identities but limits the breadth of combo strategies possible in a single turn. Should this be revisited when more cards are added?

10. **Should the card pool scarcity be made more impactful?** Possible interventions include reducing pool size, increasing player count, introducing simultaneous card-drafting pressure, or giving players incentives to seek specific named cards.
