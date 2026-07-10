(function () {
  var G = window.Game;
  var s;   // shorthand for G.state, refreshed each time

  /* ---- DOM refs ---- */
  var els = {
    board          : document.getElementById('board'),
    healthBars     : document.getElementById('healthBars'),
    turnBadge      : document.getElementById('turnBadge'),
    message        : document.getElementById('message'),
    directionBtns  : document.getElementById('directionButtons'),
    dice           : document.getElementById('dice'),
    rollBtn        : document.getElementById('rollBtn'),
    modeSpellsBtn  : document.getElementById('modeSpellsBtn'),
    meleeAttackBtn : document.getElementById('meleeAttackBtn'),
    skipMoveBtn    : document.getElementById('skipMoveBtn'),
    moveBtn        : document.getElementById('moveBtn'),
    endTurnBtn     : document.getElementById('endTurnBtn'),
    newBtn         : document.getElementById('newBtn'),
    attackModal    : document.getElementById('attackModal'),
    attackModalText: document.getElementById('attackModalText'),
    attackBtn      : document.getElementById('attackBtn'),
    passBtn        : document.getElementById('passBtn'),
    combatModal    : document.getElementById('combatModal'),
    combatModalText: document.getElementById('combatModalText'),
    combatResult   : document.getElementById('combatResult'),
    combatOkBtn    : document.getElementById('combatOkBtn'),
    abilityModal   : document.getElementById('abilityModal'),
    abilityPanel   : document.getElementById('abilityPanel'),
    gameLog        : document.getElementById('gameLog'),
  };

  G.ui.init(els);
  G.boardCamera.init({
    boardStage: document.getElementById('boardStage'),
    boardCameraRig: document.getElementById('boardCameraRig'),
    boardPlane: document.getElementById('boardPlane'),
    boardCharacters: document.getElementById('boardCharacters'),
    zoomInBtn: document.getElementById('zoomInBtn'),
    zoomOutBtn: document.getElementById('zoomOutBtn'),
    zoomResetBtn: document.getElementById('zoomResetBtn'),
  });

  G.boardLandmarks.init(document.getElementById('boardLandmarks'));
  G.boardLandmarks.render();

  document.getElementById('landmarksToggle').addEventListener('click', function () {
    var on = G.boardLandmarks.toggle();
    this.classList.toggle('is-off', !on);
    this.title = on ? 'Disable 3D landmarks' : 'Enable 3D landmarks';
  });
  document.getElementById('landmarksToggle').classList.toggle('is-off', !G.boardLandmarks.isEnabled());

  /* =========================================================
   *  Full UI refresh
   * ========================================================= */

  function refresh(msg) {
    s = G.state;
    syncCenterEmpowermentStatuses();
    G.ui.renderBoard();
    G.ui.renderHealthBars();
    G.ui.renderDice();
    G.ui.renderAbilityPanel(handleUseAbility);
    G.ui.updateStatus(msg);

    var over  = s.winner != null;
    var inAtk = s.waitingForStartAttack;
    var inDir = s.waitingForDirection;
    var idx = s.currentPlayer;
    var movementLocked = G.hasStatus(idx, 'cryostasis');
    var isUndead = G.hasStatus(idx, 'undead');
    var rollsUsed = s.moveRollsUsedThisTurn[idx];
    var rollsAllowed = s.moveRollsAllowedThisTurn[idx];
    var queuedRolls = s.movementRollQueue[idx].length;
    var canRollMore = (rollsUsed + queuedRolls) < rollsAllowed;
    var canMoveNow = queuedRolls > 0;

    els.rollBtn.disabled     = over || s.isResolvingAction || !canRollMore || s.movementSkipped || inAtk || inDir || movementLocked;
    els.skipMoveBtn.disabled = over || s.isResolvingAction || (queuedRolls === 0 && (s.hasRolled || s.movementSkipped)) || inAtk || movementLocked;
    els.moveBtn.disabled     = over || s.isResolvingAction || !canMoveNow || s.movementSkipped || inDir || movementLocked;
    els.endTurnBtn.disabled  = over || s.isResolvingAction || (!s.hasRolled && !s.movementSkipped && rollsUsed === 0) || inDir || inAtk;

    // Single melee button: disabled if already used, if spells mode active, or if waiting
    var meleeBlocked = over || s.isResolvingAction || s.hasUsedMelee
      || (s.turnModeChosen !== null && s.turnModeChosen !== 'melee')
      || inDir || inAtk;
    els.meleeAttackBtn.disabled = meleeBlocked;
    if (s.hasUsedMelee) {
      els.meleeAttackBtn.textContent = '⚔️ Melee Used';
    } else if (s.turnModeChosen === 'melee') {
      els.meleeAttackBtn.textContent = '⚔️ Strike!';
    } else {
      els.meleeAttackBtn.textContent = '⚔️ Melee';
    }
    els.meleeAttackBtn.classList.toggle('active', s.turnModeChosen === 'melee' && !s.hasUsedMelee);

    els.modeSpellsBtn.disabled = over || s.isResolvingAction || !!s.turnModeChosen || isUndead;
    els.modeSpellsBtn.classList.toggle('active', s.turnModeChosen === 'spells');
    els.moveBtn.className = 'btn btn-move ' + G.PLAYERS[idx].css;

    if (G.boardCamera) G.boardCamera.focusActivePlayer(idx);
  }

  /* =========================================================
   *  Start-of-turn logic
   * ========================================================= */

  async function beginTurn() {
    s = G.state;
    G.expireStartOfTurnStatuses(s.currentPlayer);
    await G.applyBurnTickAtTurnStart(s.currentPlayer);
    s.turnModeChosen = null;
    s.hasUsedMelee   = false;
    syncCenterEmpowermentStatuses();

    // Reset per-turn ability usage for the current player
    s.abilityUsesThisTurn[s.currentPlayer] = {};
    s.hitTagsOnTargetsThisTurn[s.currentPlayer] = {};
    s.tempCostModifiers[s.currentPlayer] = [];
    s.extraRecastsThisTurn[s.currentPlayer] = {};
    s.moveRollsUsedThisTurn[s.currentPlayer] = 0;
    s.moveRollsAllowedThisTurn[s.currentPlayer] = 1;
    s.movementRollQueue[s.currentPlayer] = [];
    s.currentMoveRoll = 0;
    s.hasRolled = false;
    s.lastRoll = 0;
    s.lifeGainedThisTurn[s.currentPlayer] = 0;
    s.lastCardTagsUsedByPlayer[s.currentPlayer] = [];

    // Grant Essence (+1 while center empowerment is active)
    var manaGain = G.MAGIC_PER_TURN + (G.hasStatus(s.currentPlayer, 'essence_empowerment') ? 1 : 0);
    s.magic[s.currentPlayer] = Math.min(G.MAX_MAGIC, s.magic[s.currentPlayer] + manaGain);
    if (G.hasStatus(s.currentPlayer, 'essence_empowerment')) {
      await G.ui.showCenterPopup({ text: 'Essence Empowerment: +1 Essence', type: 'impact', durationMs: 700 });
    }

    var cryostasis = s.statuses[s.currentPlayer].cryostasis;
    if (cryostasis && cryostasis.skipNextTurn) {
      cryostasis.skipNextTurn = false;
      s.isResolvingAction = true;
      await G.ui.showCenterPopup({ text: 'Cryostasis - turn skipped', type: 'impact', durationMs: 900 });
      s.isResolvingAction = false;
      refresh();
      endTurn();
      return;
    }

    refresh();
  }

  /* =========================================================
   *  Rolling  (no longer auto-shows directions)
   * ========================================================= */

  function rollDice() {
    s = G.state;
    var idx = s.currentPlayer;
    if (G.hasStatus(idx, 'cryostasis')) return;
    if (s.winner != null || s.movementSkipped || s.waitingForDirection || s.isResolvingAction) return;
    if ((s.moveRollsUsedThisTurn[idx] + s.movementRollQueue[idx].length) >= s.moveRollsAllowedThisTurn[idx]) return;

    els.dice.classList.add('rolling');
    var roll = Math.floor(Math.random() * 6) + 1;
    if (G.Sound) G.Sound.play('dice_roll');

    setTimeout(async function () {
      var mod = G.applyRollPenalty(idx, 'move', roll);
      var finalRoll = mod.final;
      if (mod.penalty > 0) {
        await G.ui.showCenterPopup({
          text: (mod.source === 'frozen' ? 'Frozen' : 'Frost') + ': -' + mod.penalty + ' Move',
          type: 'impact',
          durationMs: 700,
        });
      }
      s.movementRollQueue[idx].push(finalRoll);
      s.hasRolled = true;
      s.lastRoll = s.movementRollQueue[idx][0] || finalRoll;
      s.uiState.lastDiceRoll = { dice: [finalRoll], reason: 'Movement roll' };
      els.dice.classList.remove('rolling');
      refresh();
    }, 400);
  }

  /* =========================================================
   *  Skip Move / Start Move / Manual End Turn
   * ========================================================= */

  function skipMove() {
    s = G.state;
    if (s.winner != null) return;
    var idx = s.currentPlayer;
    if (G.hasStatus(idx, 'cryostasis')) return;
    if (s.movementRollQueue[idx].length > 0) {
      // Skip one queued movement roll after rolling.
      var skipped = s.movementRollQueue[idx].shift();
      s.moveRollsUsedThisTurn[idx] += 1;
      s.currentMoveRoll = 0;
      s.lastRoll = s.movementRollQueue[idx][0] || 0;
      s.hasRolled = s.movementRollQueue[idx].length > 0;
      s.waitingForDirection = false;
      G.ui.hideDirectionButtons();
      G.ui.log(G.PLAYERS[idx].name + ' skipped movement roll ' + skipped + '.');
      refresh('Movement skipped after roll.');
      return;
    }
    if (s.hasRolled || s.movementSkipped) return;
    s.movementSkipped = true;
    G.ui.log(G.PLAYERS[s.currentPlayer].name + ' skipped movement.');
    refresh();
  }

  function startMove() {
    s = G.state;
    var idx = s.currentPlayer;
    if (G.hasStatus(idx, 'cryostasis')) return;
    if (s.movementRollQueue[idx].length === 0 || s.movementSkipped || s.winner != null) return;
    G.onPlayerMoved(idx);
    s.currentMoveRoll = s.movementRollQueue[idx].shift();
    s.lastRoll = s.currentMoveRoll;
    s.hasRolled = s.movementRollQueue[idx].length > 0;
    s.waitingForDirection = true;
    showDirections();
    refresh();
  }

  function manualEndTurn() {
    s = G.state;
    if (s.winner != null) return;
    if (!s.hasRolled && !s.movementSkipped && s.moveRollsUsedThisTurn[s.currentPlayer] === 0) return;
    if (s.waitingForDirection || s.waitingForStartAttack) return;
    endTurn();
  }

  /* =========================================================
   *  Direction selection
   * ========================================================= */

  function showDirections() {
    s = G.state;
    var moves = G.getAvailableMoves(s.positions[s.currentPlayer],
                                    s.onPath[s.currentPlayer],
                                    s.inCenter[s.currentPlayer]);
    G.ui.showDirectionButtons(moves, moveInDirection);
  }

  function chooseTurnMode(mode) {
    s = G.state;
    if (s.turnModeChosen || s.winner != null) return;
    if (mode === 'spells' && G.hasStatus(s.currentPlayer, 'undead')) {
      G.ui.log('Undead can only use melee.');
      refresh();
      return;
    }
    s.turnModeChosen = mode;
    refresh(mode === 'melee' ? 'Melee mode active.' : 'Spells mode active.');
  }

  function meleeAttackAction() {
    s = G.state;
    // Engine-level validation — enforced here, not just in UI
    if (s.winner != null || s.isResolvingAction || s.waitingForDirection || s.waitingForStartAttack) return;
    if (s.hasUsedMelee) return;
    if (s.turnModeChosen !== null && s.turnModeChosen !== 'melee') return; // spells mode active

    // Auto-set melee mode on first click if no mode chosen yet
    if (!s.turnModeChosen) s.turnModeChosen = 'melee';

    var colocated = findAllColocatedPlayers();
    if (colocated.length === 0) {
      G.ui.log('No melee targets on your tile.');
      refresh('No enemies nearby for melee.');
      return;
    }

    // Commit melee for this turn — prevents re-entry from any path
    s.hasUsedMelee = true;
    refresh(); // disable the button before any modal opens

    var att = G.PLAYERS[s.currentPlayer];
    if (colocated.length === 1) {
      var def = G.PLAYERS[colocated[0]];
      G.ui.showAttackModal(s.currentPlayer, colocated[0],
        att.name + ' engages ' + def.name + ' in melee?',
        function () { performCombat(s.currentPlayer, colocated[0], false); },
        function () { afterCombat(); }
      );
      return;
    }
    G.ui.showCombatTargetModal(colocated, function (targetIdx) {
      G.ui.showAttackModal(s.currentPlayer, targetIdx,
        att.name + ' targets ' + G.PLAYERS[targetIdx].name + '. Attack?',
        function () { performCombat(s.currentPlayer, targetIdx, false); },
        function () { afterCombat(); }
      );
    }, function () { afterCombat(); });
  }

  function moveInDirection(moveId) {
    return G.enqueueAction(async function () {
    s = G.state;
    s.isResolvingAction = true;
    var idx   = s.currentPlayer;
    var pos   = s.positions[idx];
    var onP   = s.onPath[idx];
    var inC   = s.inCenter[idx];
    var steps = s.currentMoveRoll || s.lastRoll;
    var trace = [G.playerTileId(idx)];

    var fullConsume = ['to-path', 'to-center', 'path-exit',
                       'exit-0', 'exit-1', 'exit-2', 'exit-3'];

    var states = [];
    if (fullConsume.indexOf(moveId) !== -1) {
      var r = G.stepMove(pos, onP, inC, moveId);
      pos = r.pos; onP = r.onPath; inC = r.inCenter;
      trace.push(inC ? G.CENTER_TILE_ID : pos);
      states.push({ pos: pos, onPath: onP, inCenter: inC });
    } else {
      for (var i = 0; i < steps; i++) {
        var r2 = G.stepMove(pos, onP, inC, moveId);
        if (r2.pos === pos && r2.onPath === onP && r2.inCenter === inC) break;
        pos = r2.pos; onP = r2.onPath; inC = r2.inCenter;
        trace.push(inC ? G.CENTER_TILE_ID : pos);
        states.push({ pos: pos, onPath: onP, inCenter: inC });
        // Clamp movement at center to prevent overshooting into invalid nodes.
        if (inC) break;
      }
    }

    if (!G.isValidTileId(pos)) {
      pos = G.CENTER_TILE_ID;
      onP = false;
      inC = true;
      trace.push(G.CENTER_TILE_ID);
    }

    s.positions[idx] = pos;
    s.onPath[idx]    = onP;
    s.inCenter[idx]  = inC;
    s.waitingForDirection = false;
    s.moveRollsUsedThisTurn[idx] += 1;
    s.currentMoveRoll = 0;
    s.lastRoll = s.movementRollQueue[idx][0] || 0;
    s.hasRolled = s.movementRollQueue[idx].length > 0;
    G.ui.hideDirectionButtons();

    // Animate each movement step so turns do not resolve instantly.
    for (var si = 0; si < states.length; si++) {
      s.positions[idx] = states[si].pos;
      s.onPath[idx] = states[si].onPath;
      s.inCenter[idx] = states[si].inCenter;
      if (G.boardCamera) {
        G.boardCamera.animatePlayerStep(idx, states[si].pos, states[si].onPath, states[si].inCenter);
      }
      if (G.Sound) G.Sound.play('move_step');
      refresh();
      await G.sleep(150);
    }
    if (G.boardCamera) G.boardCamera.finishPlayerMovement(idx);
    await G.sleep(260);

    console.debug('[MoveTrace]', {
      player: G.PLAYERS[idx].name,
      roll: steps,
      moveId: moveId,
      path: trace,
      finalTileId: inC ? G.CENTER_TILE_ID : pos,
    });

    s.isResolvingAction = false;
    afterMovement();
    });
  }

  /* =========================================================
   *  Post-movement checks  (combat → ability tile → end turn)
   * ========================================================= */

  function afterMovement() {
    s = G.state;
    syncCenterEmpowermentStatuses();
    afterCombat();
  }

  function afterCombat() {
    checkWinner();
    s = G.state;
    if (s.winner != null) { refresh(); return; }

    var idx = s.currentPlayer;
    if (!s.onPath[idx] && !s.inCenter[idx] &&
        G.ABILITY_TILES.indexOf(s.positions[idx]) !== -1) {
      if (G.hasStatus(idx, 'undead') || s.cannotDrawCards[idx]) {
        G.ui.log('Undead cannot draw new cards.');
      } else {
        offerAbilityCards();
        return;
      }
    }
    if (s.moveRollsUsedThisTurn[idx] < s.moveRollsAllowedThisTurn[idx]) {
      refresh('Action resolved. Roll/move again or end turn.');
      return;
    }
    endTurn();
  }

  /* =========================================================
   *  Ability tile → card offer
   * ========================================================= */

  function offerAbilityCards() {
    var offered = G.offerCards();
    if (offered.length === 0) { endTurn(); return; }

    G.ui.showAbilityOfferModal(offered, function (cardId) {
      var idx = G.state.currentPlayer;

      if (G.state.abilities[idx].length < G.MAX_ABILITIES) {
        var card = G.selectCard(idx, cardId);
        G.ui.log(G.PLAYERS[idx].name + ' acquired ' + card.name + '!');
        endTurn();
      } else {
        var picked = null;
        for (var i = 0; i < offered.length; i++) {
          if (offered[i].id === cardId) { picked = offered[i]; break; }
        }
        G.ui.showAbilityReplaceModal(idx, picked,
          function (oldCardId) {
            G.replaceAbility(idx, oldCardId, cardId);
            G.ui.log(G.PLAYERS[idx].name + ' replaced an ability with ' + picked.name + '!');
            endTurn();
          },
          function () { endTurn(); }
        );
      }
    }, function () { endTurn(); });
  }

  /* =========================================================
   *  Ability usage  (allowed before AND after rolling)
   * ========================================================= */

  async function handleUseAbility(card) {
    s = G.state;
    var idx = s.currentPlayer;
    if (s.winner != null || s.waitingForDirection || s.waitingForStartAttack) return;
    if (s.turnModeChosen !== 'spells') {
      G.ui.log('Choose Spells mode to cast this turn.');
      refresh();
      return;
    }

    var blockedReason = G.getUseAbilityError(idx, card.id);
    if (blockedReason) {
      G.ui.log(blockedReason);
      if (/Silenced/i.test(blockedReason)) {
        await G.ui.showCenterPopup({
          text: 'Silenced - cannot cast spells',
          type: 'impact',
          durationMs: 850,
        });
      }
      refresh();
      return;
    }

    if (card.targeting === 'self' || card.targeting === 'allEnemies' || card.targeting === 'allEnemiesInRange') {
      if (card.targeting !== 'self') {
        var aoeTargets = G.getValidTargets(idx, card);
        if (aoeTargets.length === 0) {
          G.ui.log('No valid targets in range for ' + card.name + '.');
          refresh();
          return;
        }
      }
      s.isResolvingAction = true;
      refresh();
      var target = card.targeting === 'self' ? idx : -1;
      var res = await G.enqueueAction(async function () {
        await G.ui.showCastOverlay(card, 780);
        return G.useAbility(idx, card.id, target);
      });
      G.ui.log(res.message);
      s.isResolvingAction = false;
      checkWinner();
      refresh();
      return;
    }

    var targets = G.getValidTargets(idx, card);
    if (targets.length === 0) {
      G.ui.log('No valid targets in range for ' + card.name + '.');
      refresh();
      return;
    }

    G.ui.showTargetModal(card, targets, async function (targetIdx) {
      s.isResolvingAction = true;
      refresh();
      var res = await G.enqueueAction(async function () {
        await G.ui.showCastOverlay(card, 780);
        return G.useAbility(idx, card.id, targetIdx);
      });
      G.ui.log(res.message);
      s.isResolvingAction = false;
      checkWinner();
      refresh();
    }, function () { refresh(); });
  }

  /* =========================================================
   *  Combat
   * ========================================================= */

  async function performCombat(attackerIdx, defenderIdx, isStartOfTurn) {
    if (G.Sound) G.Sound.play('dice_roll');
    var aRollBase  = Math.floor(Math.random() * 6) + 1;
    var aMod = G.applyRollPenalty(attackerIdx, 'attack', aRollBase);
    var aRoll = aMod.final;
    if (aMod.penalty > 0) {
      await G.ui.showCenterPopup({
        text: (aMod.source === 'frozen' ? 'Frozen' : 'Frost') + ': -' + aMod.penalty + ' Attack',
        type: 'impact',
        durationMs: 700,
      });
    }
    var dRoll  = Math.floor(Math.random() * 6) + 1;
    G.state.uiState.lastDiceRoll = { dice: [aRoll, dRoll], reason: 'Combat rolls' };
    G.ui.renderDice();
    var damage = Math.max(0, aRoll - dRoll);
    if (G.hasStatus(attackerIdx, 'undead')) damage = 5;
    var defenderStatus = G.state.statuses[defenderIdx] || {};
    if (damage > 0 && defenderStatus.sanctuary && defenderStatus.sanctuary.blocksAllDamage) {
      damage = 0;
      await G.ui.showCenterPopup({ text: 'Sanctuary blocked damage', type: 'impact', durationMs: 700 });
    }
    if (damage > 0) {
      var before = G.state.health[defenderIdx];
      var after = Math.max(0, before - damage);
      if (after <= 0) {
        var transformed = await G.triggerDeathlessResolve(defenderIdx, before);
        if (transformed) damage = Math.max(0, before - 10);
        else G.state.health[defenderIdx] = after;
      } else {
        G.state.health[defenderIdx] = after;
      }
    }
    if (damage > 0) {
      if (G.Sound) G.Sound.play('hit');
      s.isResolvingAction = true;
      refresh();
      await G.ui.showImpactFx(defenderIdx);
      await G.ui.showHudDelta(defenderIdx, -damage, 0);
      s.isResolvingAction = false;
    }

    var att = G.PLAYERS[attackerIdx].name;
    var def = G.PLAYERS[defenderIdx].name;
    var text = att + ' rolled ' + aRoll + ', ' + def + ' rolled ' + dRoll;
    var result = damage > 0
      ? def + ' takes ' + damage + ' damage! (' + G.state.health[defenderIdx] + '/' + G.MAX_HEALTH + ' Life)'
      : def + ' blocks the attack!';
    if (G.state.health[defenderIdx] <= 0) result += ' ' + def + ' is defeated!';

    G.ui.log(text + ' — ' + result);
    G.ui.renderHealthBars();

    G.ui.showCombatResult(text, result, function () {
      checkWinner();
      if (isStartOfTurn) {
        refresh();
      } else {
        afterCombat();
      }
    });
  }

  /* =========================================================
   *  Helpers
   * ========================================================= */

  function findAllColocatedPlayers() {
    s = G.state;
    var idx = s.currentPlayer;
    var result = [];
    for (var i = 0; i < G.PLAYERS.length; i++) {
      if (i === idx || s.health[i] <= 0) continue;
      if (s.positions[i] === s.positions[idx] &&
          s.onPath[i]    === s.onPath[idx] &&
          s.inCenter[i]  === s.inCenter[idx])
        result.push(i);
    }
    return result;
  }

  function checkWinner() {
    var alive = G.state.health.filter(function (h) { return h > 0; });
    if (alive.length === 1) {
      G.state.winner = G.state.health.indexOf(alive[0]);
    }
  }

  function syncCenterEmpowermentStatuses() {
    s = G.state;
    for (var i = 0; i < G.PLAYERS.length; i++) {
      var bag = s.statuses[i];
      if (s.inCenter[i]) {
        if (!bag.essence_empowerment) {
          bag.essence_empowerment = { type: 'essence_empowerment', durationKind: 'whileOnCenter', remaining: 1, isBuff: true };
        }
      } else if (bag.essence_empowerment) {
        delete bag.essence_empowerment;
      }
    }
  }

  function endTurn() {
    s = G.state;
    if (s.winner != null) { refresh(); return; }
    var endedPlayer = s.currentPlayer;
    G.expireTurnStatuses(endedPlayer);
    G.tickOwnTurnStatuses(endedPlayer);
    G.tickRotationStatuses();

    s.currentPlayer = (s.currentPlayer + 1) % 4;
    while (s.health[s.currentPlayer] <= 0 && s.winner === null) {
      s.currentPlayer = (s.currentPlayer + 1) % 4;
    }
    s.hasRolled = false;
    s.movementSkipped = false;
    s.waitingForDirection = false;
    s.waitingForStartAttack = false;
    s.lastRoll = 0;
    s.currentMoveRoll = 0;
    s.movementRollQueue[s.currentPlayer] = [];
    s.uiState.lastDiceRoll = null;
    G.ui.hideDirectionButtons();

    beginTurn();
  }

  /* =========================================================
   *  New game
   * ========================================================= */

  function newGame() {
    G.resetState();
    G.resetCardPool();
    G.ui.clearLog();
    s = G.state;
    s.uiState.lastDiceRoll = null;
    G.ui.hideDirectionButtons();
    els.attackModal.classList.remove('show');
    els.combatModal.classList.remove('show');
    els.abilityModal.classList.remove('show');
    if (G.boardCamera) G.boardCamera.resetAll();
    G.ui.log('New game started!');
    if (G.characterSelect) {
      G.characterSelect.open(beginTurn);
    } else {
      beginTurn();
    }
  }

  /* =========================================================
   *  Event wiring
   * ========================================================= */

  els.rollBtn.addEventListener('click', rollDice);
  els.modeSpellsBtn.addEventListener('click', function () { chooseTurnMode('spells'); });
  els.meleeAttackBtn.addEventListener('click', meleeAttackAction);
  els.skipMoveBtn.addEventListener('click', skipMove);
  els.moveBtn.addEventListener('click', startMove);
  els.endTurnBtn.addEventListener('click', manualEndTurn);
  els.newBtn.addEventListener('click', newGame);

  /* ---- boot ---- */
  G.ui.log('Game started!');
  if (G.characterSelect) {
    G.characterSelect.open(beginTurn);
  } else {
    beginTurn();
  }

})();
