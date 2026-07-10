window.Game = window.Game || {};

(function (G) {

  /**
   * Master card list.
   *
   * Card schema:
   *
   *   {
   *     id          : <unique int>,
   *     name        : 'Card Name',
   *     cardType    : 'spell' | 'weapon' | 'classTrait',
   *     art         : 'assets/cards/<id>.png',
   *     rarityFrame : 'assets/frames/<rarity>.png',
   *     costMp      : <int>,
   *     range       : <int>,          // max graph distance (0 = self only)
   *     targeting   : 'self' | 'enemy',
   *     description : 'Flavour text shown on the card',
   *     effect      : { type: 'damage'|'heal', amount: <int> },
   *     useMode     : 'oncePerTurn' | 'multiPerTurn'
   *   }
   *
   *   cardType — determines how the card behaves and is rendered.
   *     MVP uses "spell" for all existing cards.
   *     Future types will include "weapon" and "classTrait".
   *
   *   useMode — controls per-turn casting limits.
   *     'oncePerTurn'  = can only be cast once per turn.
   *     'multiPerTurn' = can be cast repeatedly in the same turn if MP allows.
   *
   *   art — path to the card artwork image.
   *   rarityFrame — path to a frame overlay image representing rarity.
   *
   * Example:
   *   { id: 11, name: 'Meteor', cardType: 'spell',
   *     art: 'assets/cards/11.png', rarityFrame: 'assets/frames/common.png',
   *     costMp: 6, range: 10, targeting: 'enemy',
   *     description: 'A meteor crashes down for 8 damage.',
   *     effect: { type: 'damage', amount: 8 } }
   */
  G.ALL_CARDS = [
    {
      id: 1, name: 'Infinite Skystrike', cardType: 'spell', tags: ['lightning'], useMode: 'oncePerTurn',
      art: 'assets/cards/1.png', rarityFrame: 'assets/frames/common.png', costMp: 10, range: 3, targeting: 'enemy',
      description: 'Roll 2 dice. Deal 2 damage every roll until dice match.',
      effect: { type: 'rollUntilMatch', dice: 2, damagePerRoll: 2 },
    },
    {
      id: 2, name: 'Stormlash Chain', cardType: 'spell', tags: ['lightning'], useMode: 'multiPerTurn',
      art: 'assets/cards/2.png', rarityFrame: 'assets/frames/common.png', costMp: 3, range: 2, targeting: 'enemy',
      description: 'Deal 2 damage. Repeat up to 5 casts this turn.',
      effect: { type: 'damageWithTurnLimit', amount: 2, limit: 5 },
    },
    {
      id: 3, name: "Thunder King's Judgement", cardType: 'spell', tags: ['lightning'], useMode: 'oncePerTurn',
      art: 'assets/cards/3.png', rarityFrame: 'assets/frames/common.png', costMp: 8, range: 2, targeting: 'enemy',
      description: 'Deal 5 damage. If target remains above 10 Life, deal 7 more.',
      effect: { type: 'conditionalDamage', base: 5, condition: { afterDamageTargetHpGreaterThan: 10 }, bonus: 7 },
    },
    {
      id: 4, name: 'Static Overload', cardType: 'spell', tags: ['lightning'], useMode: 'oncePerTurn',
      art: 'assets/cards/4.png', rarityFrame: 'assets/frames/common.png', costMp: 2, range: 0, targeting: 'self',
      description: 'Deal 2 to self. Other lightning spells cost 1 less this turn.',
      effect: { type: 'selfDamageAndDiscount', selfDamage: 2, discount: { tag: 'lightning', amount: 1, excludesSelf: true, duration: 'turn' } },
    },
    {
      id: 5, name: 'Lightning Bolt', cardType: 'spell', tags: ['lightning'], useMode: 'multiPerTurn',
      art: 'assets/cards/5.png', rarityFrame: 'assets/frames/common.png', costMp: 2, range: 2, targeting: 'enemy',
      description: 'Deal 3 damage. Can be cast twice per turn.',
      effect: { type: 'damageWithTurnLimit', amount: 3, limit: 2 },
    },
    {
      id: 6, name: 'Bolt Rend', cardType: 'spell', tags: ['lightning'], useMode: 'oncePerTurn',
      art: 'assets/cards/6.png', rarityFrame: 'assets/frames/common.png', costMp: 3, range: 2, targeting: 'enemy',
      description: 'Deal 3 damage. +2 if target was hit by lightning this turn.',
      effect: { type: 'bonusIfTargetHitByTagThisTurn', baseDamage: 3, tag: 'lightning', bonusDamage: 2 },
    },
    {
      id: 7, name: 'Lightning Step', cardType: 'spell', tags: ['lightning'], useMode: 'oncePerTurn',
      art: 'assets/cards/7.png', rarityFrame: 'assets/frames/common.png', costMp: 3, range: 2, targeting: 'any',
      description: 'Deal 2 damage, gain an immediate movement roll, recast on 1-2 roll.',
      effect: { type: 'damageThenExtraMoveAndConditionalRecast', damage: 2, extraMoveRoll: true, recastIfMoveRollIn: [1, 2], recastCardId: 7 },
    },
    {
      id: 8, name: 'Heavenly Volt Cannon', cardType: 'spell', tags: ['lightning'], useMode: 'oncePerTurn',
      art: 'assets/cards/8.png', rarityFrame: 'assets/frames/common.png', costMp: 6, range: 3, targeting: 'enemy',
      description: 'Loop die: 1-3 deal 2 and reroll; 4-6 deal 3 and burn 1 Essence.',
      effect: { type: 'dieLoopBranch', die: 6, loopOn: { min: 1, max: 3 }, loopEffect: { type: 'damage', amount: 2 }, stopOn: { min: 4, max: 6 }, stopEffect: { type: 'damageAndBurnMp', damage: 3, burnMp: 1 } },
    },
    {
      id: 9, name: 'Restoration', cardType: 'spell', tags: ['holy'], useMode: 'oncePerTurn',
      art: 'assets/cards/9.png', rarityFrame: 'assets/frames/common.png',
      costMp: 0, costMode: 'variable', costMax: 10, range: 0, targeting: 'self',
      description: 'Burn up to 10 Essence. Heal double the amount burned.',
      effect: { type: 'restoreByBurningEssence', maxBurn: 10, healMultiplier: 2 },
    },
    {
      id: 10, name: 'Sanctuary Aura', cardType: 'spell', tags: ['holy'], useMode: 'oncePerTurn',
      art: 'assets/cards/10.png', rarityFrame: 'assets/frames/common.png', costMp: 5, range: 0, targeting: 'self',
      description: 'Block all incoming damage until you move or your next turn starts.',
      effect: { type: 'sanctuaryAura', duration: 'untilMoveOrTurnStart', blocks: 'allDamage' },
    },
    {
      id: 11, name: 'Reverse Restoration', cardType: 'spell', tags: ['holy'], useMode: 'oncePerTurn',
      art: 'assets/cards/11.png', rarityFrame: 'assets/frames/common.png', costMp: 4, range: 1, targeting: 'enemy',
      description: 'Deal damage equal to Life you restored this turn.',
      effect: { type: 'damageEqualToLifeGainedThisTurn' },
    },
    {
      id: 12, name: 'Genesis', cardType: 'spell', tags: ['holy'], useMode: 'oncePerTurn',
      art: 'assets/cards/12.png', rarityFrame: 'assets/frames/common.png', costMp: 8, range: 2, targeting: 'enemy',
      description: 'Deal double your current Essence as damage (max 20).',
      effect: { type: 'damageFromCasterEssence', multiplier: 2, cap: 20 },
    },
    {
      id: 13, name: 'Eternal Starlight Barrier', cardType: 'spell', tags: ['holy'], useMode: 'oncePerTurn',
      art: 'assets/cards/13.png', rarityFrame: 'assets/frames/common.png', costMp: 4, range: 0, targeting: 'self',
      description: 'Push all enemies 3. Gain immunity to spells until your next turn start.',
      effect: { type: 'pushAllEnemiesAndSpellImmunity', pushTiles: 3, immunity: 'spells', duration: 'untilNextTurnStart' },
    },
    {
      id: 14, name: 'Soothing Flames', cardType: 'spell', tags: ['fire'], useMode: 'oncePerTurn',
      art: 'assets/cards/14.png', rarityFrame: 'assets/frames/common.png', costMp: 3, range: 0, targeting: 'self',
      description: 'Heal 4 Life and cleanse all debuffs.',
      effect: { type: 'healAndCleanse', heal: 4, cleanse: 'debuffs' },
    },
    {
      id: 15, name: 'Pyroclasm', cardType: 'spell', tags: ['fire'], useMode: 'oncePerTurn',
      art: 'assets/cards/15.png', rarityFrame: 'assets/frames/common.png', costMp: 7, range: 3, targeting: 'allEnemiesInRange',
      description: 'Deal 9 damage to all enemies in range and knock them back.',
      effect: { type: 'aoeDamageAndKnockback', damage: 9, range: 3, knockbackTiles: 1 },
    },
    {
      id: 16, name: 'Ignite', cardType: 'spell', tags: ['fire'], useMode: 'oncePerTurn',
      art: 'assets/cards/16.png', rarityFrame: 'assets/frames/common.png', costMp: 1, range: 1, targeting: 'enemy',
      description: 'Apply non-lethal burn: 1 damage for 3 turns.',
      effect: { type: 'applyBurn', damagePerTurn: 1, turns: 3, nonLethal: true },
    },
    {
      id: 17, name: 'Solar Flare', cardType: 'spell', tags: ['fire'], useMode: 'oncePerTurn',
      art: 'assets/cards/17.png', rarityFrame: 'assets/frames/common.png', costMp: 8, range: 8, targeting: 'enemy',
      description: 'Deal 4 damage. Target permanently takes +1 from fire spells.',
      effect: { type: 'damageAndApplyPermanentVulnerability', damage: 4, vulnTag: 'fire', extraDamageTaken: 1, duration: 'permanent' },
    },
    {
      id: 18, name: 'Meteor Barrage', cardType: 'spell', tags: ['fire'], useMode: 'oncePerTurn',
      art: 'assets/cards/18.png', rarityFrame: 'assets/frames/common.png', costMp: 8, range: 999, targeting: 'allEnemies',
      description: 'All enemies roll 2 dice and take damage equal to the sum.',
      effect: { type: 'globalEnemyRollDamage', dice: 2, damageEquals: 'sum' },
    },
    {
      id: 19, name: 'Firebolt', cardType: 'spell', tags: ['fire'], useMode: 'oncePerTurn',
      art: 'assets/cards/19.png', rarityFrame: 'assets/frames/common.png', costMp: 2, range: 3, targeting: 'enemy',
      description: 'Deal 3 damage.',
      effect: { type: 'damage', amount: 3 },
    },
    {
      id: 20, name: 'Combustion', cardType: 'spell', tags: ['fire'], useMode: 'oncePerTurn',
      art: 'assets/cards/20.png', rarityFrame: 'assets/frames/common.png', costMp: 2, range: 2, targeting: 'self',
      description: 'Deal 1-3 self damage, then deal double that to enemies in range.',
      effect: { type: 'selfSacrificeAoe', selfDamageChoose: [1, 2, 3], aoeMultiplier: 2, aoeRange: 2 },
    },
    {
      id: 21, name: 'Rapid Firebolt', cardType: 'spell', tags: ['fire'], useMode: 'oncePerTurn',
      art: 'assets/cards/21.png', rarityFrame: 'assets/frames/common.png', costMp: 1, range: 3, targeting: 'enemy',
      description: 'Roll loop: always deal 1, reroll while die is 4-6.',
      effect: { type: 'rollLoopDamage', die: 6, baseDamage: 1, loopOn: { min: 4, max: 6 }, stopOn: { min: 1, max: 3 } },
    },
    {
      id: 22, name: 'Ice Age', cardType: 'spell', tags: ['ice'], useMode: 'oncePerTurn',
      art: 'assets/cards/22.png', rarityFrame: 'assets/frames/common.png', costMp: 8, range: 8, targeting: 'allEnemiesInRange',
      description: 'Deal 8 to enemies in range and apply Frost.',
      effect: { type: 'aoeDamageAndStatus', damage: 8, range: 8, status: 'frost', statusDuration: { kind: 'rotation', amount: 1 }, casterVisualStatus: 'ice_age_aura' },
    },
    {
      id: 23, name: 'Grasp of Winter', cardType: 'spell', tags: ['ice'], useMode: 'oncePerTurn',
      art: 'assets/cards/23.png', rarityFrame: 'assets/frames/common.png', costMp: 4, range: 3, targeting: 'enemy',
      description: 'Deal 3 and apply Frost. If target is Frozen, deal +4.',
      effect: { type: 'damageStatusWithBonusIfTargetHasStatus', damage: 3, status: 'frost', bonusIfStatus: 'frozen', bonusDamage: 4, statusDuration: { kind: 'rotation', amount: 1 } },
    },
    {
      id: 24, name: 'Flash Freeze', cardType: 'spell', tags: ['ice'], useMode: 'oncePerTurn',
      art: 'assets/cards/24.png', rarityFrame: 'assets/frames/common.png', costMp: 1, range: 3, targeting: 'enemy',
      description: 'Deal 1 and apply Frost. If target is Frozen, deal +3.',
      effect: { type: 'damageStatusWithBonusIfTargetHasStatus', damage: 1, status: 'frost', bonusIfAnyStatus: ['frost', 'frozen'], bonusDamage: 3, statusDuration: { kind: 'rotation', amount: 1 } },
    },
    {
      id: 25, name: 'Cryokinesis', cardType: 'spell', tags: ['ice'], useMode: 'oncePerTurn',
      art: 'assets/cards/25.png', rarityFrame: 'assets/frames/common.png', costMp: 4, range: 2, targeting: 'enemy',
      description: 'Deal 2 and apply Frost. If your last spell was Ice, also apply Frozen.',
      effect: { type: 'damageApplyFrostAndMaybeFreezeIfLastTag', damage: 2, frostDuration: { kind: 'rotation', amount: 1 }, freezeDuration: { kind: 'rotation', amount: 1 }, requiredLastTag: 'ice' },
    },
    {
      id: 26, name: 'Cryostasis', cardType: 'spell', tags: ['ice'], useMode: 'oncePerTurn',
      art: 'assets/cards/26.png', rarityFrame: 'assets/frames/common.png', costMp: 3, range: 0, targeting: 'self',
      description: 'Enter Cryostasis: movement locked, spell-immune for 2 turns, and skip next turn.',
      effect: { type: 'applyCryostasis', durationOwnTurns: 2, skipNextTurn: true },
    },
    {
      id: 27, name: 'Arctic Vortex', cardType: 'spell', tags: ['ice'], useMode: 'oncePerTurn',
      art: 'assets/cards/27.png', rarityFrame: 'assets/frames/common.png', costMp: 5, range: 4, targeting: 'enemy',
      description: 'Deal 4 and apply Frost. If already Frosted, upgrade to Frozen.',
      effect: { type: 'damageAndUpgradeFrostToFrozen', damage: 4, range: 4, frostDuration: { kind: 'rotation', amount: 1 }, freezeDuration: { kind: 'rotation', amount: 1 } },
    },
    {
      id: 28, name: 'Absolute Zero', cardType: 'spell', tags: ['ice'], useMode: 'oncePerTurn',
      art: 'assets/cards/28.png', rarityFrame: 'assets/frames/common.png', costMp: 5, range: 4, targeting: 'allEnemiesInRange',
      description: 'Freeze enemies in range, gain +2 Ice spell damage this turn, and apply permanent Ice vulnerability.',
      effect: { type: 'aoeFreezeAndIceBuffAndPermanentVuln', range: 4, freezeDuration: { kind: 'rotation', amount: 1 }, casterBuff: { tag: 'ice', bonusDamage: 2, duration: { kind: 'turn', amount: 1 } }, targetPermanentVuln: { vulnTag: 'ice', extraDamageTaken: 1 } },
    },
    {
      id: 29, name: 'Elemental Bolt', cardType: 'spell', tags: ['holy', 'fire', 'ice'], useMode: 'oncePerTurn',
      art: 'assets/cards/29.png', rarityFrame: 'assets/frames/common.png', costMp: 4, range: 2, targeting: 'enemy',
      description: 'Deal 5 damage. Counts as Holy, Fire, and Ice.',
      effect: { type: 'damage', amount: 5 },
    },
    {
      id: 30, name: 'Forbidden Technique: Soul Swap', cardType: 'spell', tags: [], useMode: 'oncePerTurn',
      art: 'assets/cards/30.png', rarityFrame: 'assets/frames/common.png', costMp: 8, range: 0, targeting: 'enemy',
      description: 'Swap your Life total with the target.',
      effect: { type: 'swapLife' },
    },
    {
      id: 31, name: 'Deathless Resolve', cardType: 'classTrait', tags: [], useMode: 'oncePerTurn',
      art: 'assets/cards/31.png', rarityFrame: 'assets/frames/common.png',
      costMp: 0, costMode: 'variable', range: 0, targeting: 'self',
      description: 'Passive: once per rotation, lethal damage sets Life to 1 and Essence to 0 instead.',
      effect: { type: 'deathlessResolvePassive', trigger: 'onLethalDamage', cooldown: { kind: 'rotation', amount: 1 } },
    },
  ];

})(window.Game);
