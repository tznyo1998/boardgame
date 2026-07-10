window.Game = window.Game || {};

(function (G) {

  /* ---- cached DOM refs (set once from main.js) ---- */
  var els = {};
  G.ui = {};
  var cardZoomModal = null;
  var cardZoomBody = null;
  var hudFxRoot = null;
  var centerPopupQueue = Promise.resolve();

  function ensureCardZoomModal() {
    if (cardZoomModal) return;
    cardZoomModal = document.createElement('div');
    cardZoomModal.className = 'card-zoom-modal';
    cardZoomModal.innerHTML =
      '<div class="card-zoom-dialog">' +
      '  <button class="card-zoom-close" aria-label="Close">&times;</button>' +
      '  <div class="card-zoom-body"></div>' +
      '</div>';
    document.body.appendChild(cardZoomModal);
    cardZoomBody = cardZoomModal.querySelector('.card-zoom-body');

    cardZoomModal.addEventListener('click', function (e) {
      if (e.target === cardZoomModal) G.ui.hideCardZoomModal();
    });
    cardZoomModal.querySelector('.card-zoom-close').addEventListener('click', function () {
      G.ui.hideCardZoomModal();
    });
  }

  function ensureHudFxRoot() {
    if (hudFxRoot) return;
    hudFxRoot = document.createElement('div');
    hudFxRoot.className = 'hud-fx-root';
    document.body.appendChild(hudFxRoot);
  }

  G.ui.init = function (domRefs) {
    els = domRefs;
    ensureCardZoomModal();
    ensureHudFxRoot();
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') G.ui.hideCardZoomModal();
    });
  };

  /* =========================================================
   *  Card art helper (offer modal, ability panel, cast overlay)
   * ========================================================= */

  function createCardArt(card, width, height, extraClass) {
    var wrap = document.createElement('div');
    wrap.className = 'card-art-wrap' + (extraClass ? ' ' + extraClass : '');
    if (width) wrap.style.width = width + 'px';
    if (height) wrap.style.height = height + 'px';

    var ph = document.createElement('div');
    ph.className = 'card-art-placeholder';
    ph.textContent = card.name;
    wrap.appendChild(ph);

    var art = new Image();
    art.className = 'card-art-img';
    art.alt = card.name;
    art.onload = function () { ph.style.display = 'none'; };
    art.onerror = function () { art.style.display = 'none'; };
    art.src = card.art;
    wrap.appendChild(art);

    var frame = new Image();
    frame.className = 'card-art-frame';
    frame.onerror = function () { frame.style.display = 'none'; };
    frame.src = card.rarityFrame;
    wrap.appendChild(frame);

    return wrap;
  }

  function classLabel(card) {
    if (!card || !card.tags || !card.tags.length) return 'Class: None';
    var t = card.tags[0];
    return 'Class: ' + t.charAt(0).toUpperCase() + t.slice(1);
  }

  function createStatLine(iconSrc, fallback, valueText) {
    var row = document.createElement('div');
    row.className = 'card-stat-line';
    var img = new Image();
    img.className = 'card-stat-icon';
    img.alt = fallback;
    img.src = iconSrc;
    img.onerror = function () { img.style.display = 'none'; };
    row.appendChild(img);
    var txt = document.createElement('span');
    txt.className = 'card-stat-text';
    txt.textContent = (fallback ? fallback + ' ' : '') + valueText;
    row.appendChild(txt);
    return row;
  }

  function createCardMetaBlock(card) {
    var wrap = document.createElement('div');
    wrap.className = 'card-meta-block';
    var costText = card.costMode === 'variable' ? 'Variable' : String(card.costMp || 0);
    wrap.appendChild(createStatLine('assets/icons/Essence.png', 'Essence', costText));
    wrap.appendChild(createStatLine('assets/icons/Range.png', 'Range', String(card.range)));
    var cls = document.createElement('div');
    cls.className = 'card-class-line';
    cls.textContent = classLabel(card);
    wrap.appendChild(cls);
    return wrap;
  }

  /* =========================================================
   *  Board rendering
   * ========================================================= */

  G.ui.renderBoard = function () {
    var s = G.state;
    els.board.innerHTML = '';

    for (var i = 0; i < G.OUTER_TRACK_SIZE; i++) {
      var cell = document.createElement('div');
      cell.className = 'cell';
      var p = G.outerTrackXY(i);
      cell.style.left = p.x + '%';
      cell.style.top  = p.y + '%';
      cell.style.setProperty('--cell-y', String(p.y));
      cell.style.transform = 'translate(-50%,-50%) translateZ(calc(var(--cell-y, 50) * 0.35px))';

      if (G.CORNER_TILES.indexOf(i) !== -1) {
        cell.classList.add('start-' + G.PLAYERS[G.CORNER_TILES.indexOf(i)].color);
      }
      if (G.CENTER_ENTRY_POINTS.indexOf(i) !== -1) cell.classList.add('path-to-center');
      if (G.ABILITY_TILES.indexOf(i) !== -1) cell.classList.add('ability-tile');
      els.board.appendChild(cell);
    }

    for (var i = 0; i < G.TOTAL_PATH_TILES; i++) {
      var cell = document.createElement('div');
      cell.className = 'cell path-to-center';
      var p = G.pathTileXY(G.OUTER_TRACK_SIZE + i);
      cell.style.left = p.x + '%';
      cell.style.top  = p.y + '%';
      cell.style.setProperty('--cell-y', String(p.y));
      cell.style.transform = 'translate(-50%,-50%) translateZ(calc(var(--cell-y, 50) * 0.35px))';
      els.board.appendChild(cell);
    }

    var cc = document.createElement('div');
    cc.className = 'cell center';
    var cp = G.centerXY();
    cc.style.left = cp.x + '%';
    cc.style.top  = cp.y + '%';
    cc.style.setProperty('--cell-y', '50');
    cc.style.transform = 'translate(-50%,-50%) translateZ(18px)';
    els.board.appendChild(cc);

    if (G.boardCamera) G.boardCamera.syncAll();
  };

  /* =========================================================
   *  Health / Magic bars
   * ========================================================= */

  G.ui.renderHealthBars = function () {
    els.healthBars.innerHTML = '';
    var activeIdx = G.state.currentPlayer;
    G.PLAYERS.forEach(function (pl, idx) {
      var bar = document.createElement('div');
      bar.className = 'health-bar' + (idx === activeIdx ? ' is-active-turn' : '');

      var label = document.createElement('div');
      label.className = 'health-label ' + pl.color;
      label.textContent = pl.name;

      var hpRow = document.createElement('div');
      hpRow.className = 'stat-row';
      var hpLbl = document.createElement('div');
      hpLbl.className = 'hp-label health-label ' + pl.color;
      hpLbl.textContent = 'Life';
      var hpFill = document.createElement('div');
      hpFill.className = 'health-fill';
      var hpVal = document.createElement('div');
      hpVal.className = 'health-value ' + pl.color;
      hpVal.style.width = (G.state.health[idx] / G.MAX_HEALTH * 100) + '%';
      hpFill.appendChild(hpVal);
      var hpNum = document.createElement('div');
      hpNum.className = 'stat-value';
      hpNum.textContent = G.state.health[idx] + '/' + G.MAX_HEALTH;
      hpRow.appendChild(hpLbl);
      hpRow.appendChild(hpFill);
      hpRow.appendChild(hpNum);

      var mpRow = document.createElement('div');
      mpRow.className = 'stat-row';
      var mpLbl = document.createElement('div');
      mpLbl.className = 'magic-label';
      mpLbl.textContent = 'Essence';
      var mpFill = document.createElement('div');
      mpFill.className = 'magic-fill';
      var mpVal = document.createElement('div');
      mpVal.className = 'magic-value';
      mpVal.style.width = (G.state.magic[idx] / G.MAX_MAGIC * 100) + '%';
      mpFill.appendChild(mpVal);
      var mpNum = document.createElement('div');
      mpNum.className = 'stat-value';
      mpNum.textContent = G.state.magic[idx] + '/' + G.MAX_MAGIC;
      mpRow.appendChild(mpLbl);
      mpRow.appendChild(mpFill);
      mpRow.appendChild(mpNum);

      var statusRow = document.createElement('div');
      statusRow.className = 'status-row';
      var statusBag = G.state.statuses[idx] || {};
      var statusKeys = Object.keys(statusBag);
      if (statusKeys.length === 0) {
        var none = document.createElement('span');
        none.className = 'status-badge status-none';
        none.textContent = 'No status';
        statusRow.appendChild(none);
      } else {
        statusKeys.forEach(function (k) {
          var st = statusBag[k];
          var b = document.createElement('span');
          b.className = 'status-badge status-' + k;
          var labelMap = {
            frost: 'Frost',
            frozen: 'Frozen',
            silenced: 'Silenced',
            burn: 'Burn',
            sanctuary: 'Sanctuary',
            spell_immune: 'Spell Immune',
            vuln_fire: 'Fire Vulnerable',
            vuln_ice: 'Ice Vulnerable',
            ice_spell_buff: 'Ice +Damage',
            ice_age_aura: 'Ice Age',
            undead: 'Undead',
            cryostasis: 'Cryostasis',
            essence_empowerment: 'Essence Empowerment',
          };
          var rem = st.durationKind === 'permanent' ? 'inf' : (st.remaining != null ? st.remaining : '-');
          b.textContent = (labelMap[k] || k) + ' (' + rem + ')';
          statusRow.appendChild(b);
        });
      }

      bar.appendChild(label);
      bar.appendChild(hpRow);
      bar.appendChild(mpRow);
      bar.appendChild(statusRow);
      els.healthBars.appendChild(bar);
    });
  };

  /* =========================================================
   *  Turn badge / message
   * ========================================================= */

  G.ui.updateStatus = function (msgOverride) {
    var s = G.state;
    var p = G.PLAYERS[s.currentPlayer];

    if (s.winner != null) {
      var w = G.PLAYERS[s.winner];
      els.turnBadge.textContent = w.name + ' wins!';
      els.turnBadge.className   = 'turn-badge ' + w.color;
      els.message.textContent   = 'Click "New game" to play again.';
      return;
    }

    els.turnBadge.textContent = p.name + "'s turn";
    els.turnBadge.className   = 'turn-badge ' + p.color;

    if (msgOverride) {
      els.message.textContent = msgOverride;
    } else if (s.waitingForStartAttack) {
      els.message.textContent = 'Attack or continue your turn.';
    } else if (s.waitingForDirection) {
      els.message.textContent = 'Choose a direction (' + s.lastRoll + ' spaces).';
    } else if (s.movementSkipped) {
      els.message.textContent = 'Movement skipped. Use abilities or end turn.';
    } else if (s.hasRolled) {
      els.message.textContent = 'Rolled ' + s.lastRoll + '. Move, use abilities, or end turn.';
    } else if (!s.turnModeChosen) {
      els.message.textContent = 'Choose a turn mode: Melee or Spells.';
    } else {
      els.message.textContent = 'Roll dice, use abilities, or skip movement.';
    }
  };

  G.ui.renderDice = function () {
    var data = G.state.uiState.lastDiceRoll;
    els.dice.innerHTML = '';
    if (!data || !data.dice || data.dice.length === 0) {
      els.dice.textContent = '?';
      return;
    }
    var wrap = document.createElement('div');
    wrap.className = 'dice-roll-view';
    for (var i = 0; i < data.dice.length; i++) {
      var die = document.createElement('div');
      die.className = 'die-face';
      var img = new Image();
      img.src = 'assets/dice/dice' + data.dice[i] + '.png';
      img.alt = 'Die ' + data.dice[i];
      img.className = 'die-face-img';
      img.onerror = function () {
        this.style.display = 'none';
        var fb = document.createElement('span');
        fb.className = 'die-face-fallback';
        fb.textContent = this.alt.replace('Die ', '');
        this.parentNode.appendChild(fb);
      };
      die.appendChild(img);
      wrap.appendChild(die);
    }
    els.dice.appendChild(wrap);
    if (data.reason) els.dice.title = data.reason;
  };

  /* =========================================================
   *  Direction buttons  (rendered into right panel)
   * ========================================================= */

  G.ui.showDirectionButtons = function (moves, onSelect) {
    // Keep "Left" visually on the left and "Right" on the right.
    moves = moves.slice().sort(function (a, b) {
      function orderOf(m) {
        if (m.label.indexOf('Left') !== -1) return 0;
        if (m.label.indexOf('Right') !== -1) return 2;
        return 1;
      }
      return orderOf(a) - orderOf(b);
    });

    els.directionBtns.innerHTML = '';
    els.directionBtns.style.display = 'flex';
    moves.forEach(function (m) {
      var btn = document.createElement('button');
      btn.className = 'btn btn-direction';
      btn.textContent = m.label;
      btn.onclick = function () { onSelect(m.id); };
      els.directionBtns.appendChild(btn);
    });
  };

  G.ui.hideDirectionButtons = function () {
    els.directionBtns.style.display = 'none';
    els.directionBtns.innerHTML = '';
  };

  /* =========================================================
   *  Attack modal
   * ========================================================= */

  G.ui.showAttackModal = function (attackerIdx, defenderIdx, text, onAttack, onPass) {
    els.attackModalText.textContent = text;
    els.attackModal.classList.add('show');
    els.attackBtn.onclick = function () {
      els.attackModal.classList.remove('show');
      onAttack();
    };
    els.passBtn.onclick = function () {
      els.attackModal.classList.remove('show');
      onPass();
    };
  };

  G.ui.hideAttackModal = function () { els.attackModal.classList.remove('show'); };

  /* =========================================================
   *  Combat result modal
   * ========================================================= */

  G.ui.showCombatResult = function (text, resultText, onOk) {
    els.combatModalText.textContent   = text;
    els.combatResult.textContent      = resultText;
    els.combatModal.classList.add('show');
    els.combatOkBtn.onclick = function () {
      els.combatModal.classList.remove('show');
      onOk();
    };
  };

  /* =========================================================
   *  Combat target selection (2+ opponents on same tile)
   * ========================================================= */

  G.ui.showCombatTargetModal = function (targetIndices, onSelect, onSkip) {
    els.abilityModal.classList.add('show');
    var inner = els.abilityModal.querySelector('.modal-content');
    inner.innerHTML = '';

    var title = document.createElement('div');
    title.className = 'modal-title';
    title.textContent = 'Choose a Target';
    inner.appendChild(title);

    var text = document.createElement('div');
    text.className = 'modal-text';
    text.textContent = 'Multiple opponents share this tile. Who do you want to confront?';
    inner.appendChild(text);

    var btns = document.createElement('div');
    btns.className = 'target-buttons';
    targetIndices.forEach(function (ti) {
      var b = document.createElement('button');
      b.className = 'btn btn-target ' + G.PLAYERS[ti].css;
      b.textContent = G.PLAYERS[ti].name;
      b.onclick = function () {
        els.abilityModal.classList.remove('show');
        onSelect(ti);
      };
      btns.appendChild(b);
    });
    inner.appendChild(btns);

    var skipBtn = document.createElement('button');
    skipBtn.className = 'btn btn-pass';
    skipBtn.style.marginTop = '12px';
    skipBtn.textContent = "Don't Attack";
    skipBtn.onclick = function () {
      els.abilityModal.classList.remove('show');
      if (onSkip) onSkip();
    };
    inner.appendChild(skipBtn);
  };

  /* =========================================================
   *  Ability offer modal  (pick 1 of 3 cards, with art)
   * ========================================================= */

  G.ui.showAbilityOfferModal = function (cards, onPick, onSkip) {
    els.abilityModal.classList.add('show');
    var inner = els.abilityModal.querySelector('.modal-content');
    inner.innerHTML = '';

    var title = document.createElement('div');
    title.className = 'modal-title';
    title.textContent = 'Choose an Ability Card';
    inner.appendChild(title);

    var grid = document.createElement('div');
    grid.className = 'card-offer-grid';
    cards.forEach(function (c) {
      var card = document.createElement('div');
      card.className = 'card-offer';

      card.appendChild(createCardArt(c));

      var name = document.createElement('div');
      name.className = 'card-name';
      name.textContent = c.name;
      card.appendChild(name);

      var cost = document.createElement('div');
      cost.className = 'card-cost';
      cost.textContent = '';
      card.appendChild(createCardMetaBlock(c));

      var desc = document.createElement('div');
      desc.className = 'card-desc';
      desc.textContent = c.description;
      card.appendChild(desc);

      card.onclick = function () {
        els.abilityModal.classList.remove('show');
        onPick(c.id);
      };
      grid.appendChild(card);
    });
    inner.appendChild(grid);

    var skipBtn = document.createElement('button');
    skipBtn.className = 'btn btn-pass';
    skipBtn.textContent = 'Skip';
    skipBtn.onclick = function () {
      els.abilityModal.classList.remove('show');
      if (onSkip) onSkip();
    };
    inner.appendChild(skipBtn);
  };

  /* =========================================================
   *  Ability replace modal  (player already has 3, with art)
   * ========================================================= */

  G.ui.showAbilityReplaceModal = function (playerIdx, newCard, onReplace, onCancel) {
    els.abilityModal.classList.add('show');
    var inner = els.abilityModal.querySelector('.modal-content');
    inner.innerHTML = '';

    var title = document.createElement('div');
    title.className = 'modal-title';
    title.textContent = 'Replace an Ability';

    var text = document.createElement('div');
    text.className = 'modal-text';
    text.textContent = 'You already have ' + G.MAX_ABILITIES +
      ' abilities. Choose one to replace with ' + newCard.name + ':';

    inner.appendChild(title);
    inner.appendChild(text);

    var grid = document.createElement('div');
    grid.className = 'card-offer-grid';
    G.state.abilities[playerIdx].forEach(function (c) {
      var card = document.createElement('div');
      card.className = 'card-offer';

      card.appendChild(createCardArt(c));

      var name = document.createElement('div');
      name.className = 'card-name';
      name.textContent = c.name;
      card.appendChild(name);

      var cost = document.createElement('div');
      cost.className = 'card-cost';
      cost.textContent = '';
      card.appendChild(createCardMetaBlock(c));

      var desc = document.createElement('div');
      desc.className = 'card-desc';
      desc.textContent = c.description;
      card.appendChild(desc);

      card.onclick = function () {
        els.abilityModal.classList.remove('show');
        onReplace(c.id);
      };
      grid.appendChild(card);
    });
    inner.appendChild(grid);

    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-pass';
    cancelBtn.textContent = 'Cancel (keep current)';
    cancelBtn.onclick = function () {
      els.abilityModal.classList.remove('show');
      if (onCancel) onCancel();
    };
    inner.appendChild(cancelBtn);
  };

  /* =========================================================
   *  Target selection modal  (for enemy-targeting abilities)
   * ========================================================= */

  G.ui.showTargetModal = function (card, validTargets, onSelect, onCancel) {
    els.abilityModal.classList.add('show');
    var inner = els.abilityModal.querySelector('.modal-content');
    inner.innerHTML = '';

    var title = document.createElement('div');
    title.className = 'modal-title';
    title.textContent = 'Select Target for ' + card.name;

    var text = document.createElement('div');
    text.className = 'modal-text';
    text.textContent = card.description + ' (Range: ' + card.range + ')';

    inner.appendChild(title);
    inner.appendChild(text);

    var selected = document.createElement('div');
    selected.className = 'selected-ability-card';
    selected.appendChild(createCardArt(card, null, null, 'card-art--thumb'));
    var info = document.createElement('div');
    info.className = 'selected-ability-info';
    info.innerHTML =
      '<div class="selected-ability-name">' + card.name + '</div>' +
      '<div class="selected-ability-desc">' + card.description + '</div>';
    info.appendChild(createCardMetaBlock(card));
    selected.appendChild(info);
    inner.appendChild(selected);

    var btns = document.createElement('div');
    btns.className = 'target-buttons';
    validTargets.forEach(function (ti) {
      var b = document.createElement('button');
      b.className = 'btn btn-target ' + G.PLAYERS[ti].css;
      b.textContent = G.PLAYERS[ti].name;
      b.onclick = function () {
        els.abilityModal.classList.remove('show');
        onSelect(ti);
      };
      btns.appendChild(b);
    });
    inner.appendChild(btns);

    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-pass';
    cancelBtn.style.marginTop = '12px';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = function () {
      els.abilityModal.classList.remove('show');
      if (onCancel) onCancel();
    };
    inner.appendChild(cancelBtn);
  };

  G.ui.showCardZoomModal = function (card) {
    ensureCardZoomModal();
    if (!cardZoomBody) return;
    cardZoomBody.innerHTML = '';

    cardZoomBody.appendChild(createCardArt(card, null, null, 'card-art--cast'));

    var title = document.createElement('div');
    title.className = 'card-zoom-title';
    title.textContent = card.name;
    cardZoomBody.appendChild(title);

    var meta = document.createElement('div');
    meta.className = 'card-zoom-meta';
    meta.textContent = 'Essence ' + card.costMp + ' | Range ' + card.range;
    cardZoomBody.appendChild(meta);

    var desc = document.createElement('div');
    desc.className = 'card-zoom-desc';
    desc.textContent = card.description;
    cardZoomBody.appendChild(desc);

    cardZoomModal.classList.add('show');
  };

  G.ui.hideCardZoomModal = function () {
    if (cardZoomModal) cardZoomModal.classList.remove('show');
  };

  /* =========================================================
   *  Ability panel  (right sidebar, current player's cards)
   * ========================================================= */

  G.ui.renderAbilityPanel = function (onUse) {
    els.abilityPanel.innerHTML = '';
    var s = G.state;
    var idx = s.currentPlayer;
    var abilities = s.abilities[idx];

    if (abilities.length === 0) {
      els.abilityPanel.innerHTML = '<div class="ability-panel-title">No abilities</div>';
      return;
    }

    var heading = document.createElement('div');
    heading.className = 'ability-panel-title';
    heading.textContent = 'Abilities';
    els.abilityPanel.appendChild(heading);

    abilities.forEach(function (c) {
      var slot = document.createElement('div');
      slot.className = 'ability-slot';
      var blockedReason = G.getUseAbilityError(idx, c.id);

      var art = createCardArt(c, null, null, 'card-art--thumb');
      art.title = 'Click to zoom';
      art.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!s.waitingForDirection && !s.waitingForStartAttack) G.ui.showCardZoomModal(c);
      });
      slot.appendChild(art);

      var info = document.createElement('div');
      info.className = 'ability-slot-info';
      info.innerHTML = '<div class="ability-slot-name">' + c.name + '</div>'
                     + '<div class="ability-slot-cost"></div>';
      info.appendChild(createCardMetaBlock(c));

      var useBtn = document.createElement('button');
      useBtn.className = 'btn-use';
      useBtn.textContent = 'Use';
      useBtn.disabled = !!blockedReason || s.winner != null
                       || s.waitingForDirection || s.waitingForStartAttack;
      if (blockedReason) useBtn.title = blockedReason;
      if (blockedReason && c.cardType === 'spell' && /Silenced/i.test(blockedReason)) {
        slot.classList.add('ability-slot-silenced');
      }
      useBtn.onclick = function () { onUse(c); };

      slot.appendChild(info);
      slot.appendChild(useBtn);
      els.abilityPanel.appendChild(slot);
    });
  };

  /* =========================================================
   *  Cast overlay (temporary ability-used animation)
   * ========================================================= */

  G.ui.showCastOverlay = function (card, durationMs) {
    var overlay = document.createElement('div');
    overlay.className = 'cast-overlay show';

    var content = document.createElement('div');
    content.className = 'cast-overlay-content';
    content.appendChild(createCardArt(card, null, null, 'card-art--cast'));

    var name = document.createElement('div');
    name.className = 'cast-overlay-name';
    name.textContent = card.name;
    content.appendChild(name);

    var cost = document.createElement('div');
    cost.className = 'cast-overlay-cost';
    cost.textContent = card.costMode === 'variable' ? 'Variable Essence' : ('-' + card.costMp + ' Essence');
    content.appendChild(cost);

    var meta = document.createElement('div');
    meta.className = 'cast-overlay-cost';
    meta.textContent = 'Range ' + card.range + ' | ' + classLabel(card).replace('Class: ', '');
    content.appendChild(meta);

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    return new Promise(function (resolve) {
      setTimeout(function () {
        overlay.classList.remove('show');
        overlay.classList.add('fade-out');
        setTimeout(function () {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          resolve();
        }, 500);
      }, durationMs || 1000);
    });
  };

  G.ui.showHudDelta = function (targetIdx, lifeDelta, essenceDelta) {
    return G.ui.showCenterPopup({
      text: G.PLAYERS[targetIdx].name + ': '
          + (lifeDelta ? ((lifeDelta > 0 ? '+' : '') + lifeDelta + ' Life') : '')
          + (essenceDelta ? ((lifeDelta ? ' | ' : '') + (essenceDelta > 0 ? '+' : '') + essenceDelta + ' Essence') : ''),
      type: 'delta',
      durationMs: 900,
    });
  };

  G.ui.showImpactFx = function (targetIdx) {
    return G.ui.showCenterPopup({
      text: 'Impact on ' + G.PLAYERS[targetIdx].name + '!',
      type: 'impact',
      durationMs: 520,
    });
  };

  G.ui.showCenterPopup = function (popup) {
    ensureHudFxRoot();
    centerPopupQueue = centerPopupQueue.then(async function () {
      var row = document.createElement('div');
      row.className = popup.type === 'impact' ? 'hud-impact' : 'hud-delta';
      row.textContent = popup.text || '';
      hudFxRoot.appendChild(row);
      await G.sleep(popup.durationMs || 900);
      row.classList.add('fade-out');
      await G.sleep(260);
      if (row.parentNode) row.parentNode.removeChild(row);
    });
    return centerPopupQueue;
  };

  G.ui.showNumberPickerModal = function (titleText, bodyText, min, max, defaultValue, onPick, onCancel) {
    els.abilityModal.classList.add('show');
    var inner = els.abilityModal.querySelector('.modal-content');
    inner.innerHTML = '';

    var title = document.createElement('div');
    title.className = 'modal-title';
    title.textContent = titleText;
    inner.appendChild(title);

    var text = document.createElement('div');
    text.className = 'modal-text';
    text.textContent = bodyText;
    inner.appendChild(text);

    var input = document.createElement('input');
    input.type = 'number';
    input.min = String(min);
    input.max = String(max);
    input.value = String(defaultValue != null ? defaultValue : min);
    input.style.width = '100px';
    input.style.fontSize = '1rem';
    input.style.padding = '6px';
    input.style.marginBottom = '12px';
    inner.appendChild(input);

    var btns = document.createElement('div');
    btns.className = 'modal-buttons';
    var ok = document.createElement('button');
    ok.className = 'btn btn-roll';
    ok.textContent = 'Confirm';
    ok.onclick = function () {
      var v = parseInt(input.value, 10);
      if (isNaN(v)) v = min;
      v = Math.max(min, Math.min(max, v));
      els.abilityModal.classList.remove('show');
      onPick(v);
    };
    var cancel = document.createElement('button');
    cancel.className = 'btn btn-pass';
    cancel.textContent = 'Cancel';
    cancel.onclick = function () {
      els.abilityModal.classList.remove('show');
      if (onCancel) onCancel();
    };
    btns.appendChild(ok);
    btns.appendChild(cancel);
    inner.appendChild(btns);
  };

  /* =========================================================
   *  Game log  (append-only text log)
   * ========================================================= */

  G.ui.log = function (msg) {
    var p = document.createElement('p');
    p.textContent = msg;
    els.gameLog.appendChild(p);
    els.gameLog.scrollTop = els.gameLog.scrollHeight;
  };

  G.ui.clearLog = function () { els.gameLog.innerHTML = ''; };

})(window.Game);
