# Design Pillars

Status: Approved
Last updated: 2026-07-09

All five pillars approved by project owner on 2026-07-09.

## Pillar 1: Every Turn Is a Decision, Not a Ritual

Definition: Each turn should present the active player with at least one meaningful choice that could have been made differently. Rolling the dice is not the choice; what you do with the result is.

Why it matters: The current loop risks ritual play — roll, move clockwise because there is no reason to go any other way, end turn. The prototype has the ingredients to avoid this (mode commitment, directional choice, cast ordering, card management), but they only activate meaningfully once players have built a hand. This pillar forces every phase of the turn to justify itself through genuine decisions.

Design implications: Movement direction should usually have a strategically correct answer that differs from player to player. Turn mode commitment should feel like a meaningful bet. Card offers at ability tiles should present trade-offs, not obvious picks. New features should add decisions, not steps.

What would violate this pillar: Automatic best-path movement with no trade-off. A dominant opening strategy that makes the first three turns identical for every player. Features that add polish to choices that are always correct.

## Pillar 2: The Board Is an Arena, Not a Racetrack

Definition: The board's topology should create meaningful positioning states — places worth being, places worth avoiding, and geography that makes combat choices feel spatial rather than purely numerical.

Why it matters: A square outer ring is naturally a racetrack shape. The prototype adds paths and a center tile, but the board does not currently exert strong spatial pull on player behavior. Positions rarely feel like advantages or disadvantages in themselves; they are mostly proximity values for range calculations. This pillar establishes that board geometry should be a first-class strategic layer.

Design implications: The center tile should be a contested space, not just a passive bonus dispenser. Path tiles could offer risk, reward, or positional advantage that makes entering them a real decision. The 12 ability tiles should feel like destinations worth steering toward. Choke points, flanking angles, and denial positions are all consistent with this pillar.

What would violate this pillar: Spell ranges so large that position becomes irrelevant. Movement systems with so much randomness that no position can be planned. Tile effects that trigger purely on occupancy with no spatial strategy attached.

## Pillar 3: Build Your Champion

Definition: By the midpoint of a session, each player's combination of character, acquired cards, and chosen status interactions should feel meaningfully different from every other player's — a distinct identity built through play, not assigned at setup.

Why it matters: The prototype has 31 cards with elemental tags, multi-cast mechanics, combo potential, and 6 named character archetypes. These systems are clearly reaching toward identity differentiation. This pillar names that aspiration explicitly and filters features: they should either deepen the differentiation space or reduce friction in reading other players' identities.

Design implications: Characters should eventually have at least one mechanical hook that makes their identity legible. Card sets should be curated so elemental builds are coherent (fire = burn-and-burst, ice = control-and-attrition, lightning = tempo-and-chain, holy = sustain-and-resource). The 3-card hand limit creates meaningful curation pressure — that should be preserved. New cards should fill a distinct strategic role.

What would violate this pillar: Keeping characters permanently cosmetic when player expectations (set by taglines and character selection) anticipate mechanical identity. Adding cards that duplicate existing roles without reason. Removing the hand limit and flooding players with options until no identity is readable.

## Pillar 4: Chaos Has a Shape

Definition: Randomness should create memorable moments and shift tactical situations, but skilled players should be able to read risks, prepare for bad outcomes, and exploit good ones. Dice should feel exciting, not punishing.

Why it matters: The game uses dice for movement (d6), melee combat (d6 vs d6), and several spell effects (roll-until-match, die-loop-branch, global enemy roll damage). Some rolls have large swing potential. The game's fun relies on these moments feeling dramatic rather than frustrating. This pillar establishes that randomness is a design tool, not a design outcome.

Design implications: Spells with unbounded loops need safety caps and clear player expectations. Status effects that negate a turn entirely (Frozen -5 move, Cryostasis turn skip) must feel earned by the opponent, not arbitrary. Catch-up tools are consistent with this pillar because they keep randomness from compounding into a runaway gap.

What would violate this pillar: Spells that deal purely random damage with no player input or counterplay. Turn-skip effects that stack with no counterplay. Movement luck in round 1 creating a card-count deficit that the player cannot recover from.

## Pillar 5: Hot-Seat Social Play First

Definition: Every mechanic should be legible and entertaining to players who are currently watching rather than acting. The experience at the table — the reactions, the shared tension — is as much a feature as the game itself.

Why it matters: This is a local hot-seat game for 4 players. People are sitting together, reacting out loud. The game's visual feedback systems (impact animations, center popups, game log, dice display) are clearly designed for shared-screen readability. This pillar locks in that social layer as a priority.

Design implications: Every consequential event should be announced clearly on screen so observers can react. Turn structure should keep downtime short. Elimination should give the eliminated player something to engage with, or the game should end before downtime becomes painful. Cards with long resolution sequences should animate clearly for observers.

What would violate this pillar: Private information hidden from observers without a compelling design reason. Turns so long that three players wait several minutes. Combat resolution opaque to non-active players.
