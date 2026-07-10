window.Game = window.Game || {};

(function (G) {

  /** Shared pool of cards still available for pickup. */
  var pool = [];

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }

  /** Reset the pool to contain copies of ALL_CARDS, then shuffle. */
  G.resetCardPool = function () {
    pool = G.ALL_CARDS.map(function (c) { return Object.assign({}, c); });
    shuffle(pool);
  };

  /** Draw up to 3 random cards from the pool (non-destructive peek). */
  G.offerCards = function () {
    shuffle(pool);
    return pool.slice(0, Math.min(3, pool.length));
  };

  /**
   * Player selects a card.
   * Removes chosen card from pool permanently.
   * Returns the card object added to the player's hand.
   */
  G.selectCard = function (playerIdx, cardId) {
    var idx = -1;
    for (var i = 0; i < pool.length; i++) {
      if (pool[i].id === cardId) { idx = i; break; }
    }
    if (idx === -1) return null;
    var card = pool.splice(idx, 1)[0];
    shuffle(pool); // re-shuffle remaining pool
    G.state.abilities[playerIdx].push(card);
    return card;
  };

  /**
   * Replace an existing ability with a new card from the offer.
   * Old card is discarded (does NOT return to pool).
   */
  G.replaceAbility = function (playerIdx, oldCardId, newCardId) {
    var abilities = G.state.abilities[playerIdx];
    var slotIdx = -1;
    for (var i = 0; i < abilities.length; i++) {
      if (abilities[i].id === oldCardId) { slotIdx = i; break; }
    }
    if (slotIdx === -1) return null;

    // Remove new card from pool
    var poolIdx = -1;
    for (var i = 0; i < pool.length; i++) {
      if (pool[i].id === newCardId) { poolIdx = i; break; }
    }
    if (poolIdx === -1) return null;

    var newCard = pool.splice(poolIdx, 1)[0];
    shuffle(pool);
    abilities[slotIdx] = newCard;
    return newCard;
  };

  function waitTick(ms) {
    if (G.sleep) return G.sleep(ms || 0);
    return new Promise(function (resolve) { setTimeout(resolve, ms || 0); });
  }

  function getCardById(playerIdx, cardId) {
    var abilities = G.state.abilities[playerIdx];
    for (var i = 0; i < abilities.length; i++) {
      if (abilities[i].id === cardId) return abilities[i];
    }
    return null;
  }

  function hasPassiveCard(playerIdx, effectType) {
    var abilities = G.state.abilities[playerIdx] || [];
    for (var i = 0; i < abilities.length; i++) {
      if (abilities[i].effect && abilities[i].effect.type === effectType) return true;
    }
    return false;
  }

  function getPrimaryClassTag(card) {
    if (!card || !card.tags || !card.tags.length) return null;
    return card.tags[0];
  }

  function getPerTurnLimit(card) {
    if (!card || !card.effect) return null;
    if (card.effect.limit != null) return card.effect.limit;
    if (card.effect.perTurnCastLimit != null) return card.effect.perTurnCastLimit;
    return null;
  }

  function getEnemiesInRange(playerIdx, range) {
    var casterTile = G.playerTileId(playerIdx);
    var targets = [];
    for (var i = 0; i < G.PLAYERS.length; i++) {
      if (i === playerIdx || G.state.health[i] <= 0) continue;
      var targetTile = G.playerTileId(i);
      if (G.tileDistance(casterTile, targetTile) <= range) targets.push(i);
    }
    return targets;
  }

  function getAbilityUses(playerIdx, cardId) {
    return G.state.abilityUsesThisTurn[playerIdx][cardId] || 0;
  }

  function getExtraRecasts(playerIdx, cardId) {
    return G.state.extraRecastsThisTurn[playerIdx][cardId] || 0;
  }

  function setExtraRecasts(playerIdx, cardId, value) {
    G.state.extraRecastsThisTurn[playerIdx][cardId] = Math.max(0, value);
  }

  function alivePlayersCount() {
    var alive = 0;
    for (var i = 0; i < G.PLAYERS.length; i++) {
      if (G.state.health[i] > 0) alive += 1;
    }
    return Math.max(1, alive);
  }

  G.hasStatus = function (playerIdx, type) {
    var bag = G.state.statuses[playerIdx] || {};
    return !!bag[type];
  };

  G.addStatus = function (playerIdx, type, duration) {
    var bag = G.state.statuses[playerIdx];
    var d = duration || {};
    if (type === 'frost') {
      bag[type] = {
        type: type,
        durationKind: d.kind || 'rotation',
        remaining: d.amount || 1,
        remainingActors: alivePlayersCount(),
        movePenalty: 2,
        attackPenalty: 1,
        moveConsumed: false,
        attackConsumed: false,
      };
      return;
    }
    if (type === 'frozen') {
      bag[type] = {
        type: type,
        durationKind: d.kind || 'rotation',
        remaining: d.amount || 1,
        remainingActors: alivePlayersCount(),
        movePenalty: 5,
        attackPenalty: 3,
        moveConsumed: false,
        attackConsumed: false,
      };
      return;
    }
    if (type === 'silenced') {
      bag[type] = {
        type: type,
        durationKind: d.kind || 'turn',
        remaining: d.amount || 1,
      };
      return;
    }
    if (type === 'burn') {
      bag[type] = {
        type: type,
        durationKind: d.kind || 'turn',
        remaining: d.amount || 3,
        damagePerTurn: d.damagePerTurn || 1,
        nonLethal: d.nonLethal !== false,
        isDebuff: true,
      };
      return;
    }
    if (type === 'spell_immune') {
      bag[type] = {
        type: type,
        durationKind: d.kind || 'turn',
        remaining: d.amount || 1,
        isBuff: true,
        expiresAtTurnStart: !!d.expiresAtTurnStart,
      };
      return;
    }
    if (type === 'sanctuary') {
      bag[type] = {
        type: type,
        durationKind: d.kind || 'turn',
        remaining: d.amount || 1,
        blocksAllDamage: true,
        breakOnMove: true,
        expiresAtTurnStart: true,
        isBuff: true,
      };
      return;
    }
    if (type === 'vuln_fire' || type === 'vuln_ice') {
      bag[type] = {
        type: type,
        durationKind: 'permanent',
        remaining: 999,
        vulnerabilityTag: type === 'vuln_fire' ? 'fire' : 'ice',
        extraDamageTaken: d.extraDamageTaken || 1,
        isDebuff: true,
      };
      return;
    }
    if (type === 'ice_spell_buff') {
      bag[type] = {
        type: type,
        durationKind: d.kind || 'turn',
        remaining: d.amount || 1,
        casterBuffTag: 'ice',
        bonusDamage: d.bonusDamage || 2,
        isBuff: true,
      };
      return;
    }
    if (type === 'ice_age_aura') {
      bag[type] = {
        type: type,
        durationKind: d.kind || 'turn',
        remaining: d.amount || 1,
        expiresAtTurnStart: true,
        isBuff: true,
      };
      return;
    }
    if (type === 'undead') {
      bag[type] = { type: type, durationKind: 'permanent', remaining: 999, isBuff: false };
      return;
    }
    if (type === 'essence_empowerment') {
      bag[type] = { type: type, durationKind: 'whileOnCenter', remaining: 1, isBuff: true };
      return;
    }
    if (type === 'cryostasis') {
      bag[type] = {
        type: type,
        durationKind: 'ownTurn',
        // +1 so the cast turn's end tick does not consume one of the intended future turns.
        remaining: (d.amount || 2) + 1,
        movementLocked: true,
        spellImmune: true,
        skipNextTurn: true,
        isBuff: true,
      };
      return;
    }
    bag[type] = {
      type: type,
      durationKind: d.kind || 'turn',
      remaining: d.amount || 1,
    };
  };

  G.applyRollPenalty = function (playerIdx, rollType, baseRoll) {
    var bag = G.state.statuses[playerIdx];
    var penalty = 0;
    var source = null;
    ['frozen', 'frost'].forEach(function (type) {
      var st = bag[type];
      if (!st) return;
      if (rollType === 'move' && !st.moveConsumed) {
        penalty += st.movePenalty || 0;
        st.moveConsumed = true;
        source = type;
      }
      if (rollType === 'attack' && !st.attackConsumed) {
        penalty += st.attackPenalty || 0;
        st.attackConsumed = true;
        source = type;
      }
    });
    var finalRoll = Math.max(0, baseRoll - penalty);
    return { final: finalRoll, penalty: penalty, source: source };
  };

  G.expireTurnStatuses = function (playerIdx) {
    var bag = G.state.statuses[playerIdx];
    Object.keys(bag).forEach(function (k) {
      var st = bag[k];
      if (st.durationKind !== 'turn') return;
      st.remaining -= 1;
      if (st.remaining <= 0) delete bag[k];
    });
  };

  G.expireStartOfTurnStatuses = function (playerIdx) {
    var bag = G.state.statuses[playerIdx] || {};
    Object.keys(bag).forEach(function (k) {
      var st = bag[k];
      if (!st || !st.expiresAtTurnStart) return;
      delete bag[k];
    });
  };

  G.clearStatus = function (playerIdx, type) {
    var bag = G.state.statuses[playerIdx] || {};
    if (bag[type]) delete bag[type];
  };

  G.cleanseDebuffs = function (playerIdx) {
    var bag = G.state.statuses[playerIdx] || {};
    Object.keys(bag).forEach(function (k) {
      if (bag[k] && bag[k].isDebuff) delete bag[k];
    });
  };

  G.onPlayerMoved = function (playerIdx) {
    var bag = G.state.statuses[playerIdx] || {};
    Object.keys(bag).forEach(function (k) {
      var st = bag[k];
      if (st && st.breakOnMove) delete bag[k];
    });
  };

  G.applyBurnTickAtTurnStart = async function (playerIdx) {
    var bag = G.state.statuses[playerIdx] || {};
    var burn = bag.burn;
    if (!burn || G.state.health[playerIdx] <= 0) return;
    var before = G.state.health[playerIdx];
    var after = Math.max(burn.nonLethal ? 1 : 0, before - (burn.damagePerTurn || 1));
    var dmg = Math.max(0, before - after);
    G.state.health[playerIdx] = after;
    if (dmg > 0 && G.ui && G.ui.showCenterPopup) {
      await G.ui.showCenterPopup({ text: 'Burn: -' + dmg + ' Life', type: 'impact', durationMs: 760 });
      await G.ui.showHudDelta(playerIdx, -dmg, 0);
    }
    if (G.ui && G.ui.renderHealthBars) G.ui.renderHealthBars();
  };

  G.tickOwnTurnStatuses = function (playerIdx) {
    var bag = G.state.statuses[playerIdx] || {};
    Object.keys(bag).forEach(function (k) {
      var st = bag[k];
      if (!st || st.durationKind !== 'ownTurn') return;
      st.remaining -= 1;
      if (st.remaining <= 0) delete bag[k];
    });
  };

  G.triggerDeathlessResolve = async function (targetIdx, healthBeforeLethal) {
    if (G.hasStatus(targetIdx, 'undead')) return false;
    if (G.state.deathlessTriggered[targetIdx]) return false;
    if (!hasPassiveCard(targetIdx, 'deathlessResolvePassive')) return false;

    G.state.deathlessTriggered[targetIdx] = true;
    G.state.health[targetIdx] = 10;
    G.state.magic[targetIdx] = 0;
    G.addStatus(targetIdx, 'undead', { kind: 'permanent', amount: 999 });
    G.state.cannotDrawCards[targetIdx] = true;
    G.state.abilities[targetIdx] = [];

    if (G.ui && G.ui.showCenterPopup) {
      await G.ui.showCenterPopup({ text: 'DEATHLESS RESOLVE - UNDEAD', type: 'impact', durationMs: 1300 });
    }
    if (G.ui && G.ui.showHudDelta) {
      await G.ui.showHudDelta(targetIdx, -Math.max(0, healthBeforeLethal - 10), -10);
    }
    if (G.ui && G.ui.renderHealthBars) G.ui.renderHealthBars();
    return true;
  };

  G.tickRotationStatuses = function () {
    for (var i = 0; i < G.PLAYERS.length; i++) {
      if (G.state.health[i] <= 0) continue;
      var bag = G.state.statuses[i];
      Object.keys(bag).forEach(function (k) {
        var st = bag[k];
        if (st.durationKind !== 'rotation') return;
        st.remainingActors = Math.min(st.remainingActors || alivePlayersCount(), alivePlayersCount());
        st.remainingActors = Math.max(0, st.remainingActors - 1);
        if (st.remainingActors <= 0) {
          st.remaining -= 1;
          if (st.remaining <= 0) delete bag[k];
          else st.remainingActors = alivePlayersCount();
        }
      });
    }
  };

  G.getAbilityEffectiveCost = function (playerIdx, card) {
    var cost = card.costMp || 0;
    if (card.costMode === 'variable') return 0;
    var mods = G.state.tempCostModifiers[playerIdx] || [];
    for (var i = 0; i < mods.length; i++) {
      var m = mods[i];
      if (m.tag && (!card.tags || card.tags.indexOf(m.tag) === -1)) continue;
      if (m.excludesCardId != null && m.excludesCardId === card.id) continue;
      cost -= (m.amount || 0);
    }
    return Math.max(0, cost);
  };

  G.getUseAbilityError = function (playerIdx, cardId) {
    var card = getCardById(playerIdx, cardId);
    if (!card) return 'Card not found.';

    var uses = getAbilityUses(playerIdx, cardId);
    var recasts = getExtraRecasts(playerIdx, cardId);
    var turnLimit = getPerTurnLimit(card);

    if (turnLimit != null && uses >= turnLimit)
      return 'You reached this card\'s cast limit for this turn.';

    if (card.id === 7 && uses >= 20)
      return 'Lightning Step chain cap reached (20).';

    if (card.cardType === 'classTrait' || card.cardType === 'passive')
      return 'Passive traits cannot be cast manually.';

    if (G.state.turnModeChosen !== 'spells')
      return 'Choose Spells mode to cast.';

    if (G.hasStatus(playerIdx, 'undead') && card.cardType === 'spell')
      return 'Undead cannot cast spells.';

    if (card.cardType === 'spell' && G.hasStatus(playerIdx, 'silenced'))
      return 'Silenced - cannot cast spells.';

    if (card.useMode === 'oncePerTurn' && uses >= 1 && recasts <= 0)
      return 'You already used this ability this turn.';

    var effectiveCost = G.getAbilityEffectiveCost(playerIdx, card);
    if (G.state.magic[playerIdx] < effectiveCost)
      return 'Not enough Essence.';

    return null;
  };

  /** Check if a player can afford and is allowed to use a specific ability this turn. */
  G.canUseAbility = function (playerIdx, cardId) {
    return G.getUseAbilityError(playerIdx, cardId) == null;
  };

  /**
   * Find valid targets for a card used by playerIdx.
   * Returns array of player indices that are alive and in range.
   */
  G.getValidTargets = function (playerIdx, card) {
    if (card.targeting === 'self') return [playerIdx];
    if (card.targeting === 'allEnemies') return getEnemiesInRange(playerIdx, 9999);
    if (card.targeting === 'allEnemiesInRange') return getEnemiesInRange(playerIdx, card.range);
    if (card.targeting === 'any') {
      var casterAny = G.playerTileId(playerIdx);
      var any = [playerIdx];
      for (var j = 0; j < G.PLAYERS.length; j++) {
        if (j === playerIdx || G.state.health[j] <= 0) continue;
        var targetAny = G.playerTileId(j);
        if (G.tileDistance(casterAny, targetAny) <= card.range) any.push(j);
      }
      return any;
    }

    var casterTile = G.playerTileId(playerIdx);
    var targets = [];
    for (var i = 0; i < G.PLAYERS.length; i++) {
      if (i === playerIdx || G.state.health[i] <= 0) continue;
      var targetTile = G.playerTileId(i);
      var dist = G.tileDistance(casterTile, targetTile);
      if (dist <= card.range) targets.push(i);
    }
    return targets;
  };

  function markTargetTagsForTurn(playerIdx, targetIdx, tags) {
    if (!tags || !tags.length) return;
    var byTarget = G.state.hitTagsOnTargetsThisTurn[playerIdx];
    var targetMap = byTarget[targetIdx] || {};
    for (var i = 0; i < tags.length; i++) targetMap[tags[i]] = true;
    byTarget[targetIdx] = targetMap;
  }

  function getDamageTakenBonusFromStatuses(targetIdx, sourceCard) {
    if (!sourceCard || !sourceCard.tags || !sourceCard.tags.length) return 0;
    var bag = G.state.statuses[targetIdx] || {};
    var total = 0;
    Object.keys(bag).forEach(function (k) {
      var st = bag[k];
      if (!st || !st.vulnerabilityTag || st.extraDamageTaken == null) return;
      if (sourceCard.tags.indexOf(st.vulnerabilityTag) !== -1) total += st.extraDamageTaken;
    });
    return total;
  }

  function getCasterDamageBonusFromStatuses(casterIdx, sourceCard) {
    if (!sourceCard || !sourceCard.tags || !sourceCard.tags.length) return 0;
    var bag = G.state.statuses[casterIdx] || {};
    var total = 0;
    Object.keys(bag).forEach(function (k) {
      var st = bag[k];
      if (!st || !st.casterBuffTag || st.bonusDamage == null) return;
      if (sourceCard.tags.indexOf(st.casterBuffTag) !== -1) total += st.bonusDamage;
    });
    return total;
  }

  function wasTargetHitByTagThisTurn(playerIdx, targetIdx, tag) {
    var byTarget = G.state.hitTagsOnTargetsThisTurn[playerIdx];
    return !!(byTarget[targetIdx] && byTarget[targetIdx][tag]);
  }

  async function resolveEffect(effect, ctx) {
    if (!effect || !effect.type) return { success: false, message: 'Invalid effect data.' };

    var HARD_CAP = 50;

    if (effect.type === 'damage') {
      return await ctx.dealDamage(ctx.targetIdx, effect.amount, ctx.card);
    }

    if (effect.type === 'heal') {
      return await ctx.heal(ctx.targetIdx, effect.amount);
    }

    if (effect.type === 'damageWithTurnLimit') {
      return await ctx.dealDamage(ctx.targetIdx, effect.amount, ctx.card);
    }

    if (effect.type === 'damageAndBurnMp') {
      await ctx.dealDamage(ctx.targetIdx, effect.damage, ctx.card);
      await ctx.burnMp(ctx.targetIdx, effect.burnMp);
      return { success: true, message: 'Shock and Essence burn applied.' };
    }

    if (effect.type === 'conditionalDamage') {
      await ctx.dealDamage(ctx.targetIdx, effect.base, ctx.card);
      var threshold = effect.condition && effect.condition.afterDamageTargetHpGreaterThan;
      if (threshold != null && G.state.health[ctx.targetIdx] > threshold) {
        ctx.log('Condition met: target HP above ' + threshold + ', bonus damage triggers.');
        await ctx.dealDamage(ctx.targetIdx, effect.bonus, ctx.card);
      }
      return { success: true, message: 'Conditional damage resolved.' };
    }

    if (effect.type === 'rollUntilMatch') {
      for (var i = 0; i < HARD_CAP; i++) {
        var rolls = [];
        for (var d = 0; d < effect.dice; d++) rolls.push(ctx.rollDice(6));
        ctx.publishDice(rolls, ctx.card.name + ' reroll');
        ctx.log('Roll #' + (i + 1) + ': ' + rolls.join(' / '));
        await ctx.dealDamage(ctx.targetIdx, effect.damagePerRoll, ctx.card);
        var matched = true;
        for (var r = 1; r < rolls.length; r++) {
          if (rolls[r] !== rolls[0]) { matched = false; break; }
        }
        if (matched) {
          ctx.log('Dice matched. ' + ctx.card.name + ' ends.');
          return { success: true, message: 'Roll-until-match completed.' };
        }
        await waitTick(520);
      }
      ctx.log('Loop safety cap reached for ' + ctx.card.name + '.');
      return { success: true, message: 'Stopped at loop safety cap.' };
    }

    if (effect.type === 'selfDamageAndDiscount') {
      await ctx.dealDamage(ctx.casterIdx, effect.selfDamage, ctx.card);
      var discount = effect.discount || {};
      ctx.addCostModifier({
        tag: discount.tag,
        amount: discount.amount || 0,
        excludesCardId: discount.excludesSelf ? ctx.card.id : null,
        duration: discount.duration || 'turn',
      });
      ctx.log('Applied temporary cost discount this turn.');
      return { success: true, message: 'Self damage and discount applied.' };
    }

    if (effect.type === 'bonusIfTargetHitByTagThisTurn') {
      var bonus = wasTargetHitByTagThisTurn(ctx.casterIdx, ctx.targetIdx, effect.tag) ? effect.bonusDamage : 0;
      if (bonus > 0) ctx.log('Bonus damage triggered from earlier ' + effect.tag + ' hit.');
      await ctx.dealDamage(ctx.targetIdx, effect.baseDamage + bonus, ctx.card);
      return { success: true, message: 'Tag-based bonus damage resolved.' };
    }

    if (effect.type === 'damageThenExtraMoveAndConditionalRecast') {
      await ctx.dealDamage(ctx.targetIdx, effect.damage, ctx.card);
      if (effect.extraMoveRoll) {
        ctx.grantMoveRollCredit(1);
        var moveRoll = await ctx.rollMovement();
        if ((effect.recastIfMoveRollIn || []).indexOf(moveRoll) !== -1) {
          var cardId = effect.recastCardId || ctx.card.id;
          var current = getExtraRecasts(ctx.casterIdx, cardId);
          setExtraRecasts(ctx.casterIdx, cardId, current + 1);
          ctx.log('Movement roll ' + moveRoll + ' grants one extra recast for ' + ctx.card.name + '.');
        } else {
          ctx.log('Movement roll ' + moveRoll + ' does not grant recast.');
        }
      }
      return { success: true, message: 'Damage + extra move flow resolved.' };
    }

    if (effect.type === 'applyStatus') {
      await ctx.applyStatus(ctx.targetIdx, effect.status, effect.duration);
      return { success: true, message: 'Status applied: ' + effect.status };
    }

    if (effect.type === 'knockback') {
      return await ctx.knockbackTarget(ctx.targetIdx, effect.tiles || 1);
    }

    if (effect.type === 'damageAndKnockback') {
      await ctx.dealDamage(ctx.targetIdx, effect.damage || 0, ctx.card);
      return await ctx.knockbackTarget(ctx.targetIdx, effect.knockbackTiles || 1);
    }

    if (effect.type === 'dieLoopBranch') {
      for (var loop = 0; loop < HARD_CAP; loop++) {
        var dieValue = ctx.rollDice(effect.die || 6);
        ctx.publishDice([dieValue], ctx.card.name + ' loop die');
        ctx.log('Loop die roll: ' + dieValue);
        if (dieValue >= effect.loopOn.min && dieValue <= effect.loopOn.max) {
          await resolveEffect(effect.loopEffect, ctx);
          await waitTick(480);
          continue;
        }
        if (dieValue >= effect.stopOn.min && dieValue <= effect.stopOn.max) {
          await resolveEffect(effect.stopEffect, ctx);
          return { success: true, message: 'Branch loop finished on stop condition.' };
        }
        return { success: true, message: 'Branch loop ended: no condition matched.' };
      }
      ctx.log('Loop safety cap reached for ' + ctx.card.name + '.');
      return { success: true, message: 'Stopped at loop safety cap.' };
    }

    if (effect.type === 'restoreByBurningEssence') {
      var maxBurn = Math.min(effect.maxBurn || 10, G.state.magic[ctx.casterIdx]);
      if (maxBurn <= 0) return { success: true, message: 'No Essence available to burn.' };
      var burn = await ctx.selectNumber('Restoration', 'Choose Essence to burn', 0, maxBurn, maxBurn);
      if (burn == null) return { success: false, message: 'Cast cancelled.' };
      burn = Math.max(0, Math.min(maxBurn, burn));
      G.state.magic[ctx.casterIdx] -= burn;
      await ctx.heal(ctx.casterIdx, burn * (effect.healMultiplier || 2));
      if (G.ui && G.ui.renderHealthBars) G.ui.renderHealthBars();
      ctx.log('Restoration burned ' + burn + ' Essence.');
      return { success: true, message: 'Restoration resolved.' };
    }

    if (effect.type === 'sanctuaryAura') {
      await ctx.applyStatus(ctx.casterIdx, 'sanctuary', { kind: 'turn', amount: 1, expiresAtTurnStart: true });
      return { success: true, message: 'Sanctuary Aura active.' };
    }

    if (effect.type === 'damageEqualToLifeGainedThisTurn') {
      var dmgByHeal = Math.max(0, G.state.lifeGainedThisTurn[ctx.casterIdx] || 0);
      await ctx.dealDamage(ctx.targetIdx, dmgByHeal, ctx.card);
      return { success: true, message: 'Reverse Restoration dealt ' + dmgByHeal + '.' };
    }

    if (effect.type === 'damageFromCasterEssence') {
      var dmgFromEss = Math.min(effect.cap || 999, (G.state.magic[ctx.casterIdx] || 0) * (effect.multiplier || 1));
      await ctx.dealDamage(ctx.targetIdx, dmgFromEss, ctx.card);
      return { success: true, message: 'Genesis dealt ' + dmgFromEss + '.' };
    }

    if (effect.type === 'pushAllEnemiesAndSpellImmunity') {
      var allEnemy = getEnemiesInRange(ctx.casterIdx, 9999);
      for (var e = 0; e < allEnemy.length; e++) {
        await ctx.knockbackTarget(allEnemy[e], effect.pushTiles || 1);
      }
      await ctx.applyStatus(ctx.casterIdx, 'spell_immune', { kind: 'turn', amount: 1, expiresAtTurnStart: true });
      return { success: true, message: 'Enemies pushed and spell immunity granted.' };
    }

    if (effect.type === 'healAndCleanse') {
      await ctx.heal(ctx.casterIdx, effect.heal || 0);
      G.cleanseDebuffs(ctx.casterIdx);
      if (G.ui && G.ui.renderHealthBars) G.ui.renderHealthBars();
      return { success: true, message: 'Healed and cleansed.' };
    }

    if (effect.type === 'aoeDamageAndKnockback') {
      var aoeTargets = getEnemiesInRange(ctx.casterIdx, effect.range || ctx.card.range || 2);
      for (var ai = 0; ai < aoeTargets.length; ai++) {
        await ctx.dealDamage(aoeTargets[ai], effect.damage || 0, ctx.card);
        await ctx.knockbackTarget(aoeTargets[ai], effect.knockbackTiles || 1); // default 1 tile if unspecified
      }
      return { success: true, message: 'AOE damage and knockback resolved.' };
    }

    if (effect.type === 'applyBurn') {
      await ctx.applyStatus(ctx.targetIdx, 'burn', { kind: 'turn', amount: effect.turns || 3, damagePerTurn: effect.damagePerTurn || 1, nonLethal: effect.nonLethal !== false });
      return { success: true, message: 'Burn applied.' };
    }

    if (effect.type === 'damageAndApplyPermanentVulnerability') {
      await ctx.dealDamage(ctx.targetIdx, effect.damage || 0, ctx.card);
      var vType = effect.vulnTag === 'ice' ? 'vuln_ice' : 'vuln_fire';
      await ctx.applyStatus(ctx.targetIdx, vType, { extraDamageTaken: effect.extraDamageTaken || 1 });
      return { success: true, message: 'Damage plus permanent vulnerability applied.' };
    }

    if (effect.type === 'globalEnemyRollDamage') {
      var gTargets = getEnemiesInRange(ctx.casterIdx, 9999);
      for (var gi = 0; gi < gTargets.length; gi++) {
        var rv = [];
        for (var rd = 0; rd < (effect.dice || 2); rd++) rv.push(ctx.rollDice(6));
        ctx.publishDice(rv, ctx.card.name + ' on ' + G.PLAYERS[gTargets[gi]].name);
        var sum = 0; for (var rs = 0; rs < rv.length; rs++) sum += rv[rs];
        await ctx.dealDamage(gTargets[gi], sum, ctx.card);
        await waitTick(320);
      }
      return { success: true, message: 'Global roll damage resolved.' };
    }

    if (effect.type === 'selfSacrificeAoe') {
      var choices = effect.selfDamageChoose || [1, 2, 3];
      var min = Math.min.apply(Math, choices);
      var max = Math.max.apply(Math, choices);
      var picked = await ctx.selectNumber('Combustion', 'Choose self-damage', min, max, max);
      if (picked == null) return { success: false, message: 'Cast cancelled.' };
      if (choices.indexOf(picked) === -1) picked = max;
      await ctx.dealDamage(ctx.casterIdx, picked, ctx.card);
      var cTargets = getEnemiesInRange(ctx.casterIdx, effect.aoeRange || 2); // default range 2 when ambiguous
      for (var ct = 0; ct < cTargets.length; ct++) {
        await ctx.dealDamage(cTargets[ct], picked * (effect.aoeMultiplier || 2), ctx.card);
      }
      return { success: true, message: 'Combustion resolved.' };
    }

    if (effect.type === 'rollLoopDamage') {
      for (var rl = 0; rl < HARD_CAP; rl++) {
        var die = ctx.rollDice(effect.die || 6);
        ctx.publishDice([die], ctx.card.name + ' chain');
        await ctx.dealDamage(ctx.targetIdx, effect.baseDamage || 1, ctx.card);
        await waitTick(360);
        if (die >= effect.stopOn.min && die <= effect.stopOn.max) break;
      }
      return { success: true, message: 'Roll loop damage resolved.' };
    }

    if (effect.type === 'aoeDamageAndStatus') {
      var stTargets = getEnemiesInRange(ctx.casterIdx, effect.range || ctx.card.range || 2);
      for (var st = 0; st < stTargets.length; st++) {
        await ctx.dealDamage(stTargets[st], effect.damage || 0, ctx.card);
        await ctx.applyStatus(stTargets[st], effect.status, effect.statusDuration || { kind: 'rotation', amount: 1 });
      }
      if (effect.casterVisualStatus) await ctx.applyStatus(ctx.casterIdx, effect.casterVisualStatus, { kind: 'turn', amount: 1, expiresAtTurnStart: true });
      return { success: true, message: 'AOE damage and status resolved.' };
    }

    if (effect.type === 'damageStatusWithBonusIfTargetHasStatus') {
      var bonusActive = false;
      if (effect.bonusIfAnyStatus && effect.bonusIfAnyStatus.length) {
        for (var bi = 0; bi < effect.bonusIfAnyStatus.length; bi++) {
          if (G.hasStatus(ctx.targetIdx, effect.bonusIfAnyStatus[bi])) { bonusActive = true; break; }
        }
      } else {
        bonusActive = G.hasStatus(ctx.targetIdx, effect.bonusIfStatus);
      }
      var bns = bonusActive ? (effect.bonusDamage || 0) : 0;
      if (bns > 0) await G.ui.showCenterPopup({ text: 'Bonus vs Frost: +' + bns, type: 'impact', durationMs: 700 });
      await ctx.dealDamage(ctx.targetIdx, (effect.damage || 0) + bns, ctx.card);
      await ctx.applyStatus(ctx.targetIdx, effect.status, effect.statusDuration || { kind: 'rotation', amount: 1 });
      return { success: true, message: 'Damage + conditional bonus + status resolved.' };
    }

    if (effect.type === 'damageApplyFrostAndMaybeFreezeIfLastTag') {
      await ctx.dealDamage(ctx.targetIdx, effect.damage || 0, ctx.card);
      await ctx.applyStatus(ctx.targetIdx, 'frost', effect.frostDuration || { kind: 'rotation', amount: 1 });
      var lastTags = G.state.lastCardTagsUsedByPlayer[ctx.casterIdx] || [];
      if (lastTags.indexOf(effect.requiredLastTag) !== -1) {
        await ctx.applyStatus(ctx.targetIdx, 'frozen', effect.freezeDuration || { kind: 'rotation', amount: 1 });
      }
      return { success: true, message: 'Cryokinesis resolved.' };
    }

    if (effect.type === 'healAndSpellImmunity') {
      await ctx.heal(ctx.casterIdx, effect.heal || 0);
      await ctx.applyStatus(ctx.casterIdx, 'spell_immune', effect.duration || { kind: 'turn', amount: 1 });
      return { success: true, message: 'Heal + spell immunity resolved.' };
    }

    if (effect.type === 'applyCryostasis') {
      await ctx.applyStatus(ctx.casterIdx, 'cryostasis', { amount: effect.durationOwnTurns || 2 });
      return { success: true, message: 'Cryostasis applied.' };
    }

    if (effect.type === 'damageAndUpgradeFrostToFrozen') {
      var hadFrost = G.hasStatus(ctx.targetIdx, 'frost');
      await ctx.dealDamage(ctx.targetIdx, effect.damage || 0, ctx.card);
      await ctx.applyStatus(ctx.targetIdx, 'frost', effect.frostDuration || { kind: 'rotation', amount: 1 });
      if (hadFrost) await ctx.applyStatus(ctx.targetIdx, 'frozen', effect.freezeDuration || { kind: 'rotation', amount: 1 });
      return { success: true, message: 'Arctic Vortex resolved.' };
    }

    if (effect.type === 'aoeFreezeAndIceBuffAndPermanentVuln') {
      var azTargets = getEnemiesInRange(ctx.casterIdx, effect.range || ctx.card.range || 2);
      for (var az = 0; az < azTargets.length; az++) {
        await ctx.applyStatus(azTargets[az], 'frozen', effect.freezeDuration || { kind: 'rotation', amount: 1 });
        await ctx.applyStatus(azTargets[az], 'vuln_ice', { extraDamageTaken: effect.targetPermanentVuln && effect.targetPermanentVuln.extraDamageTaken || 1 });
      }
      await ctx.applyStatus(ctx.casterIdx, 'ice_spell_buff', {
        kind: effect.casterBuff && effect.casterBuff.duration && effect.casterBuff.duration.kind || 'turn',
        amount: effect.casterBuff && effect.casterBuff.duration && effect.casterBuff.duration.amount || 1,
        bonusDamage: effect.casterBuff && effect.casterBuff.bonusDamage || 2,
      });
      return { success: true, message: 'Absolute Zero resolved.' };
    }

    if (effect.type === 'swapLife') {
      var cLife = G.state.health[ctx.casterIdx];
      var tLife = G.state.health[ctx.targetIdx];
      G.state.health[ctx.casterIdx] = tLife;
      G.state.health[ctx.targetIdx] = cLife;
      if (G.ui && G.ui.renderHealthBars) G.ui.renderHealthBars();
      await G.ui.showCenterPopup({ text: 'Life totals swapped!', type: 'impact', durationMs: 900 });
      return { success: true, message: 'Soul Swap resolved.' };
    }

    if (effect.type === 'deathlessResolvePassive') {
      return { success: false, message: 'Passive trait cannot be cast.' };
    }

    return { success: false, message: 'Unknown effect type: ' + effect.type };
  }

  /**
   * Use an ability on a target. Deducts MP and resolves effect.
   * Returns Promise<{ success, message }>
   */
  G.useAbility = async function (playerIdx, cardId, targetIdx) {
    var card = getCardById(playerIdx, cardId);
    if (!card) return { success: false, message: 'Card not found.' };

    var useError = G.getUseAbilityError(playerIdx, cardId);
    if (useError) return { success: false, message: useError };

    var uses = getAbilityUses(playerIdx, cardId);
    var recasts = getExtraRecasts(playerIdx, cardId);

    // Consume special recast allowance when casting beyond oncePerTurn baseline.
    if (card.useMode === 'oncePerTurn' && uses >= 1 && recasts > 0) {
      setExtraRecasts(playerIdx, cardId, recasts - 1);
    }

    var effectiveCost = G.getAbilityEffectiveCost(playerIdx, card);
    if (!card.costMode || card.costMode !== 'variable') {
      G.state.magic[playerIdx] -= effectiveCost;
    }
    G.state.abilityUsesThisTurn[playerIdx][cardId] = uses + 1;

    var lines = [];
    var ctx = {
      card: card,
      casterIdx: playerIdx,
      targetIdx: targetIdx,
      state: G.state,
      log: function (msg) { lines.push(msg); },
      addCostModifier: function (modifier) {
        G.state.tempCostModifiers[playerIdx].push(modifier);
      },
      rollDice: function (sides) {
        if (G.Sound) G.Sound.play('dice_roll');
        return Math.floor(Math.random() * (sides || 6)) + 1;
      },
      grantMoveRollCredit: function (count) {
        count = Math.max(0, count || 0);
        G.state.moveRollsAllowedThisTurn[playerIdx] += count;
        lines.push('Movement roll allowance +' + count + '.');
      },
      rollMovement: async function () {
        var r = Math.floor(Math.random() * 6) + 1;
        if (G.Sound) G.Sound.play('dice_roll');
        var mod = G.applyRollPenalty(playerIdx, 'move', r);
        if (mod.penalty > 0 && G.ui && G.ui.showCenterPopup) {
          await G.ui.showCenterPopup({
            text: (mod.source === 'frozen' ? 'Frozen' : 'Frost') + ': -' + mod.penalty + ' Move',
            type: 'impact',
            durationMs: 700,
          });
        }
        r = mod.final;
        G.state.movementRollQueue[playerIdx].push(r);
        G.state.hasRolled = G.state.movementRollQueue[playerIdx].length > 0;
        G.state.lastRoll = G.state.movementRollQueue[playerIdx][0] || 0;
        G.state.movementSkipped = false;
        G.state.uiState.lastDiceRoll = { dice: [r], reason: 'Extra movement roll' };
        if (G.ui && G.ui.renderDice) G.ui.renderDice();
        lines.push('Movement roll granted: ' + r + '.');
        return r;
      },
      publishDice: function (diceValues, reason) {
        G.state.uiState.lastDiceRoll = { dice: diceValues.slice(), reason: reason || 'Ability roll' };
        if (G.ui && G.ui.renderDice) G.ui.renderDice();
      },
      dealDamage: async function (target, amount, sourceCard) {
        amount = Math.max(0, amount || 0);
        var targetStatuses = G.state.statuses[target] || {};
        var sourceIsSpell = !!(sourceCard && sourceCard.cardType === 'spell');
        if (targetStatuses.sanctuary && targetStatuses.sanctuary.blocksAllDamage) {
          lines.push(G.PLAYERS[target].name + ' blocked damage with Sanctuary Aura.');
          if (G.ui && G.ui.showCenterPopup) {
            await G.ui.showCenterPopup({ text: 'Sanctuary blocked damage', type: 'impact', durationMs: 700 });
          }
          return { success: true, message: 'Blocked by sanctuary.' };
        }
        if (sourceIsSpell && (targetStatuses.spell_immune || targetStatuses.cryostasis && targetStatuses.cryostasis.spellImmune)) {
          lines.push(G.PLAYERS[target].name + ' is immune to spells.');
          if (G.ui && G.ui.showCenterPopup) {
            await G.ui.showCenterPopup({ text: 'Spell Immune', type: 'impact', durationMs: 700 });
          }
          return { success: true, message: 'Blocked by spell immunity.' };
        }

        amount += getCasterDamageBonusFromStatuses(playerIdx, sourceCard);
        amount += getDamageTakenBonusFromStatuses(target, sourceCard);
        amount = Math.max(0, amount);

        var before = G.state.health[target];
        var after = Math.max(0, before - amount);
        if (after <= 0) {
          var transformed = await G.triggerDeathlessResolve(target, before);
          if (transformed) {
            lines.push(G.PLAYERS[target].name + ' transformed into Undead.');
            return { success: true, message: 'Deathless Resolve triggered.' };
          }
        }

        G.state.health[target] = after;
        markTargetTagsForTurn(playerIdx, target, sourceCard && sourceCard.tags);
        if (amount > 0 && G.ui && G.ui.showImpactFx) await G.ui.showImpactFx(target);
        if (amount > 0 && G.ui && G.ui.showHudDelta) await G.ui.showHudDelta(target, -amount, 0);
        if (G.ui && G.ui.renderHealthBars) G.ui.renderHealthBars();
        if (amount > 0 && G.Sound) G.Sound.play('hit');
        var msg = G.PLAYERS[playerIdx].name + ' dealt ' + amount + ' damage to '
                + G.PLAYERS[target].name + ' (' + G.state.health[target] + '/' + G.MAX_HEALTH + ' Life)';
        if (G.state.health[target] <= 0) msg += ' ' + G.PLAYERS[target].name + ' is defeated!';
        lines.push(msg);
        return { success: true, message: msg };
      },
      heal: async function (target, amount) {
        amount = Math.max(0, amount || 0);
        if (G.hasStatus(target, 'undead')) {
          if (G.ui && G.ui.showCenterPopup) {
            await G.ui.showCenterPopup({ text: 'Undead cannot be healed', type: 'impact', durationMs: 760 });
          }
          lines.push('Heal failed: ' + G.PLAYERS[target].name + ' is Undead.');
          return { success: true, message: 'Undead cannot be healed.' };
        }
        var before = G.state.health[target];
        G.state.health[target] = Math.min(G.MAX_HEALTH, G.state.health[target] + amount);
        var actual = Math.max(0, G.state.health[target] - before);
        if (target === playerIdx) G.state.lifeGainedThisTurn[playerIdx] += actual;
        if (actual > 0 && G.ui && G.ui.showHudDelta) await G.ui.showHudDelta(target, actual, 0);
        if (G.ui && G.ui.renderHealthBars) G.ui.renderHealthBars();
        var msg = G.PLAYERS[playerIdx].name + ' healed '
                + G.PLAYERS[target].name + ' for ' + actual
                + ' (' + G.state.health[target] + '/' + G.MAX_HEALTH + ' Life)';
        lines.push(msg);
        return { success: true, message: msg };
      },
      burnMp: async function (target, amount) {
        amount = Math.max(0, amount || 0);
        G.state.magic[target] = Math.max(0, G.state.magic[target] - amount);
        if (amount > 0 && G.ui && G.ui.showHudDelta) await G.ui.showHudDelta(target, 0, -amount);
        if (G.ui && G.ui.renderHealthBars) G.ui.renderHealthBars();
        lines.push(G.PLAYERS[target].name + ' loses ' + amount + ' Essence (' + G.state.magic[target] + '/' + G.MAX_MAGIC + ')');
      },
      dealDamageNonLethal: async function (target, amount, sourceCard) {
        amount = Math.max(0, amount || 0);
        var before = G.state.health[target];
        var after = Math.max(1, before - amount);
        var dealt = before - after;
        if (dealt <= 0) return { success: true, message: 'No non-lethal damage applied.' };
        G.state.health[target] = after;
        markTargetTagsForTurn(playerIdx, target, sourceCard && sourceCard.tags);
        if (G.ui && G.ui.showImpactFx) await G.ui.showImpactFx(target);
        if (G.ui && G.ui.showHudDelta) await G.ui.showHudDelta(target, -dealt, 0);
        if (G.ui && G.ui.renderHealthBars) G.ui.renderHealthBars();
        if (G.Sound) G.Sound.play('hit');
        lines.push(G.PLAYERS[playerIdx].name + ' dealt ' + dealt + ' non-lethal damage to ' + G.PLAYERS[target].name + '.');
        return { success: true, message: 'Non-lethal damage applied.' };
      },
      selectNumber: function (title, text, min, max, defaultValue) {
        if (!G.ui || !G.ui.showNumberPickerModal) return Promise.resolve(defaultValue || min);
        return new Promise(function (resolve) {
          G.ui.showNumberPickerModal(title, text, min, max, defaultValue || min, function (v) { resolve(v); }, function () { resolve(null); });
        });
      },
      applyStatus: async function (target, status, duration) {
        var targetStatuses = G.state.statuses[target] || {};
        if (target !== playerIdx && card.cardType === 'spell' && (targetStatuses.spell_immune || targetStatuses.cryostasis && targetStatuses.cryostasis.spellImmune)) {
          lines.push(G.PLAYERS[target].name + ' is immune to spells.');
          if (G.ui && G.ui.showCenterPopup) {
            await G.ui.showCenterPopup({ text: 'Spell Immune', type: 'impact', durationMs: 700 });
          }
          return;
        }
        G.addStatus(target, status, duration || { kind: 'turn', amount: 1 });
        if (G.ui && G.ui.renderHealthBars) G.ui.renderHealthBars();
        if (G.ui && G.ui.showCenterPopup) {
          await G.ui.showCenterPopup({
            text: G.PLAYERS[target].name + ' is ' + status.toUpperCase(),
            type: 'impact',
            durationMs: 800,
          });
        }
        lines.push(G.PLAYERS[target].name + ' gains status: ' + status + '.');
      },
      knockbackTarget: async function (target, tiles) {
        var targetStatuses = G.state.statuses[target] || {};
        if (target !== playerIdx && card.cardType === 'spell' && (targetStatuses.spell_immune || targetStatuses.cryostasis && targetStatuses.cryostasis.spellImmune)) {
          await G.ui.showCenterPopup({ text: 'Spell Immune', type: 'impact', durationMs: 650 });
          return { success: true, message: 'Knockback blocked by spell immunity.' };
        }
        var casterTile = G.playerTileId(playerIdx);
        var tPos = G.state.positions[target];
        var tOnPath = G.state.onPath[target];
        var tInCenter = G.state.inCenter[target];
        var targetTile = G.playerTileId(target);
        if (tInCenter) {
          await G.ui.showCenterPopup({ text: 'Knockback resisted', type: 'impact', durationMs: 650 });
          return { success: true, message: 'Knockback resisted.' };
        }

        function xyFor(pos, onPath, inCenter) {
          var c = G.cellPosition(pos, onPath, inCenter);
          return { x: parseFloat(c.left), y: parseFloat(c.top) };
        }
        var casterXY = xyFor(G.state.positions[playerIdx], G.state.onPath[playerIdx], G.state.inCenter[playerIdx]);
        var targetXY = xyFor(tPos, tOnPath, tInCenter);
        var moves = G.getAvailableMoves(tPos, tOnPath, tInCenter);
        var awayMove = null;
        var awayVec = null;
        var baseDist = G.tileDistance(casterTile, targetTile);

        for (var mi = 0; mi < moves.length; mi++) {
          var test = G.stepMove(tPos, tOnPath, tInCenter, moves[mi].id);
          var nextTile = test.inCenter ? G.CENTER_TILE_ID : test.pos;
          if (!G.isValidTileId(nextTile) || nextTile === targetTile) continue;
          var dist = G.tileDistance(casterTile, nextTile);
          if (dist <= baseDist) continue;
          var nextXY = xyFor(test.pos, test.onPath, test.inCenter);
          var v1 = { x: targetXY.x - casterXY.x, y: targetXY.y - casterXY.y };
          var v2 = { x: nextXY.x - targetXY.x, y: nextXY.y - targetXY.y };
          var cross = Math.abs(v1.x * v2.y - v1.y * v2.x);
          var dot = v1.x * v2.x + v1.y * v2.y;
          if (dot <= 0 || cross > 2.0) continue;
          awayMove = moves[mi].id;
          awayVec = v2;
          break;
        }

        if (!awayMove) {
          await G.ui.showCenterPopup({ text: 'Knockback resisted', type: 'impact', durationMs: 650 });
          return { success: true, message: 'Knockback resisted.' };
        }

        var moved = 0;
        for (var step = 0; step < tiles; step++) {
          var nxt = G.stepMove(tPos, tOnPath, tInCenter, awayMove);
          var nextTileId = nxt.inCenter ? G.CENTER_TILE_ID : nxt.pos;
          if (!G.isValidTileId(nextTileId) || (nextTileId === (tInCenter ? G.CENTER_TILE_ID : tPos))) break;
          var curXY = xyFor(tPos, tOnPath, tInCenter);
          var nXY = xyFor(nxt.pos, nxt.onPath, nxt.inCenter);
          var stepVec = { x: nXY.x - curXY.x, y: nXY.y - curXY.y };
          var cross2 = Math.abs(awayVec.x * stepVec.y - awayVec.y * stepVec.x);
          var dot2 = awayVec.x * stepVec.x + awayVec.y * stepVec.y;
          if (dot2 <= 0 || cross2 > 2.0) break;
          tPos = nxt.pos; tOnPath = nxt.onPath; tInCenter = nxt.inCenter;
          G.state.positions[target] = tPos;
          G.state.onPath[target] = tOnPath;
          G.state.inCenter[target] = tInCenter;
          if (G.ui && G.ui.renderBoard) G.ui.renderBoard();
          if (G.Sound) G.Sound.play('knockback');
          await waitTick(140);
          moved += 1;
        }

        if (moved > 0) {
          await G.ui.showCenterPopup({ text: 'Knockback +' + moved, type: 'impact', durationMs: 700 });
          return { success: true, message: 'Knockback moved target by ' + moved + '.' };
        }
        await G.ui.showCenterPopup({ text: 'Knockback resisted', type: 'impact', durationMs: 650 });
        return { success: true, message: 'Knockback resisted.' };
      },
    };

    var effectResult = await resolveEffect(card.effect, ctx);
    if (!effectResult.success) return effectResult;
    G.state.lastCardTagsUsedByPlayer[playerIdx] = (card.tags || []).slice();
    var prefix = G.PLAYERS[playerIdx].name + ' cast ' + card.name + ' (-' + effectiveCost + ' Essence).';
    return { success: true, message: [prefix].concat(lines).join(' ') };
  };

  G.debugCastCard = function (cardId, casterId, targetId) {
    var card = null;
    for (var i = 0; i < G.ALL_CARDS.length; i++) {
      if (G.ALL_CARDS[i].id === cardId) { card = G.ALL_CARDS[i]; break; }
    }
    if (!card) return Promise.resolve({ success: false, message: 'Debug card not found.' });
    var hasIt = getCardById(casterId, cardId);
    if (!hasIt) G.state.abilities[casterId].push(Object.assign({}, card));
    var resolvedTarget = (targetId == null ? casterId : targetId);
    return G.enqueueAction(async function () {
      if (G.ui && G.ui.showCastOverlay) await G.ui.showCastOverlay(card, 760);
      return G.useAbility(casterId, cardId, resolvedTarget);
    });
  };

  G.resolveEffect = resolveEffect;

  G.resetCardPool();

})(window.Game);
