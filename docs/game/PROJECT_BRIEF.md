# Project Brief

Status: Draft
Last updated: 2026-07-09

## Working title

Untitled Fantasy Board Game (working title — **open question**: does the project have a name?)

## Product format

- Platform or engine: Browser-based (vanilla HTML / CSS / JavaScript, no framework)
- Digital, physical, or hybrid: Digital
- Single-player, local multiplayer, online multiplayer, or combination: Local multiplayer (hot-seat, 4 players sharing one screen)
- Target devices: Desktop browsers (**assumption**: mobile is not a primary target given the UI layout and camera controls)

## One-sentence concept

A fantasy board game where four players race around a tile-based board, collect spell cards, and battle each other with dice combat and elemental magic until one champion remains.

## Intended audience

**Open question.** The prototype suggests casual-to-mid-weight board game players who enjoy fantasy themes, collectible abilities, and direct player combat. Age range and experience level are not yet defined.

## Intended session length

**Open question.** Based on the board size (77 tiles), 4-player turn structure, and health pools (20 HP), a session likely runs 30–60 minutes, but this has not been validated.

## Player count

4 players (hardcoded in the current prototype).

**Open question**: Is 2–3 player support intended? The code assumes exactly 4 players.

## Core fantasy

Players embody fantasy champions (Warlock, Mage, Warrior, Archer, Paladin, Priest) competing in a magical arena. They traverse a board, discover powerful spell cards, and wield elemental abilities to be the last one standing.

## Current prototype state

The repository contains a playable browser prototype with the following implemented features:

- **Board**: A square outer track (48 tiles, 12 per side) with 4 diagonal paths (7 tiles each) leading to a central tile. Total: 77 tiles.
- **Movement**: Roll a d6, choose direction (clockwise/counter-clockwise on outer track, deeper/back on paths). Players can enter paths from entry points and reach the center.
- **Characters**: 6 fantasy characters with sprites and taglines. Character selection screen at game start with unique picks per player. Some characters marked "coming soon" if sprite art is missing.
- **Combat modes**: Each turn, a player chooses either Melee or Spells mode (not both).
  - **Melee**: Attacker and defender each roll a d6; damage = max(0, attacker − defender). Requires same-tile occupancy.
  - **Spells**: Cast acquired ability cards using Essence (mana). Targeting by graph distance.
- **Resources**: Health (max 20), Essence/mana (max 10, +2 per turn, +1 bonus on center tile).
- **Cards/abilities**: 31 spell cards across 4 elemental tags (fire, lightning, ice, holy). Players hold up to 3 abilities at a time, acquired by landing on designated ability tiles (12 tiles on the outer track).
- **Status effects**: Burn, frost, frozen, cryostasis, sanctuary, undead, silence, essence empowerment, spell immunity, vulnerability, and more.
- **Win condition**: Last player with health > 0 wins.
- **Visual features**: Animated dice, step-by-step movement animation, cast overlays, impact effects, health bar HUD, game log, 3D CSS board landmarks (volcano, mountains, buildings), camera with zoom/pan, particle effects (snow).
- **Sound**: Placeholder system exists but no audio files are present.

## Known constraints

- **No build system or framework**: Pure vanilla JS with global `window.Game` namespace. All scripts loaded via `<script>` tags in `index.html`.
- **No server or networking**: Local-only; all state is client-side.
- **No persistence**: Game state is not saved between sessions.
- **Asset pipeline**: Card art is numbered PNGs; character sprites are individual files. No automated asset pipeline.
- **No automated tests**: No test framework or test files observed.
- **No mobile optimization**: UI assumes desktop viewport with mouse interaction.

## Non-goals

**Open question.** The following are assumptions based on the current prototype scope:

- Online multiplayer networking (assumption — no server infrastructure exists)
- AI opponents (assumption — no AI logic exists)
- Mobile-first design (assumption — layout is desktop-oriented)

## Current major questions

- What is the game's name?
- Is the 4-player count fixed, or should 2–3 player modes be supported?
- Are the 6 characters intended to have unique abilities/stats, or are they cosmetic?
- What is the intended session length?
- Who is the target audience (age, experience level)?
- What are the project's non-goals?
- Is there a target milestone or release timeline?
- Should characters have class-specific card pools or stat differences?
- What is the intended balance between movement/positioning and combat?
