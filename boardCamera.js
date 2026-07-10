window.Game = window.Game || {};

(function (G) {

  var BASE_TILT = 32;
  var MIN_PITCH = -10;
  var MAX_PITCH = 14;
  var MIN_USER_ZOOM = 0.72;
  var MAX_USER_ZOOM = 2.15;
  var FOCUS_ZOOM = 1.12;

  function BoardCharacter(playerIdx, playerMeta) {
    this.playerIdx = playerIdx;
    this.playerMeta = playerMeta;
    this.currentTile = null;
    this.targetTile = null;
    this.movementState = 'idle';
    this.idleState = 'bobbing';
    this.el = null;
    this.rootEl = null;
    this.billboardEl = null;
  }

  BoardCharacter.prototype.syncTileFromState = function () {
    var s = G.state;
    var idx = this.playerIdx;
    if (s.health[idx] <= 0) {
      this.currentTile = null;
      return;
    }
    this.currentTile = {
      tileId: G.playerTileId(idx),
      pos: s.positions[idx],
      onPath: s.onPath[idx],
      inCenter: s.inCenter[idx],
    };
  };

  BoardCharacter.prototype.tileKey = function (tile) {
    if (!tile) return '';
    return tile.pos + '-' + tile.onPath + '-' + tile.inCenter;
  };

  BoardCharacter.prototype.setMovementState = function (state, targetTile) {
    this.movementState = state;
    if (targetTile !== undefined) this.targetTile = targetTile;
    if (this.rootEl) {
      this.rootEl.classList.toggle('is-moving', state === 'moving');
      this.rootEl.classList.toggle('is-arrived', state === 'arrived');
    }
    if (state === 'idle') {
      this.targetTile = null;
      this.idleState = 'bobbing';
      if (this.el) this.el.classList.remove('idle-paused');
    } else if (state === 'moving') {
      this.idleState = 'paused';
      if (this.el) this.el.classList.add('idle-paused');
    }
  };

  BoardCharacter.prototype.applyPosition = function (stackIndex, stackSize) {
    if (!this.rootEl || !this.currentTile) return;
    var cp = G.cellPosition(
      this.currentTile.pos,
      this.currentTile.onPath,
      this.currentTile.inCenter
    );
    var xy = G.boardCamera.tileXY(this.currentTile);
    var depth = G.boardCamera.depthFromY(xy.y);

    this.rootEl.style.left = cp.left;
    this.rootEl.style.top = cp.top;
    this.rootEl.style.setProperty('--tile-y', String(xy.y));
    this.rootEl.style.setProperty('--char-depth', String(depth.translateZ));
    this.rootEl.style.setProperty('--char-scale', String(depth.scale));
    this.rootEl.style.zIndex = String(10 + Math.round(xy.y));

    var spread = (stackIndex - (stackSize - 1) / 2) * 14;
    this.rootEl.style.setProperty('--stack-offset-x', spread + 'px');
  };

  var stageEl = null;
  var rigEl = null;
  var planeEl = null;
  var charactersEl = null;
  var zoomInBtn = null;
  var zoomOutBtn = null;
  var zoomResetBtn = null;
  var characters = [];
  var rafId = 0;
  var focusPlayerIdx = 0;

  var cam = {
    tilt: BASE_TILT,
    pitch: 0,
    yaw: -8,
    panX: 0,
    panY: 0,
    zoom: 1,
    focusZoom: FOCUS_ZOOM,
    userZoom: 1,
    targetPanX: 0,
    targetPanY: 0,
    targetZoom: FOCUS_ZOOM,
    yawVel: 0,
    pitchVel: 0,
    dragging: false,
    dragMode: null, // 'orbit' | 'pan'
    userOverridePan: false,
  };

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function syncTargetZoom() {
    cam.targetZoom = clamp(cam.focusZoom * cam.userZoom, MIN_USER_ZOOM, MAX_USER_ZOOM);
  }

  function applyCameraTransform() {
    if (!rigEl || !planeEl || !stageEl) return;
    var tilt = cam.tilt + cam.pitch;
    rigEl.style.transform =
      'translate3d(' + cam.panX.toFixed(2) + 'px,' + cam.panY.toFixed(2) + 'px, 0) ' +
      'scale(' + cam.zoom.toFixed(4) + ') ' +
      'rotateY(' + cam.yaw.toFixed(3) + 'deg)';
    planeEl.style.transform = 'rotateX(' + tilt.toFixed(3) + 'deg)';
    stageEl.style.setProperty('--cam-tilt', tilt.toFixed(3));
    stageEl.style.setProperty('--cam-yaw', cam.yaw.toFixed(3));
  }

  function tick() {
    if (!cam.dragging) {
      cam.yaw += cam.yawVel;
      cam.pitch = clamp(cam.pitch + cam.pitchVel, MIN_PITCH, MAX_PITCH);
      cam.yawVel *= 0.91;
      cam.pitchVel *= 0.91;
      if (Math.abs(cam.yawVel) < 0.004) cam.yawVel = 0;
      if (Math.abs(cam.pitchVel) < 0.004) cam.pitchVel = 0;
    }

    var ease = cam.dragging ? (cam.dragMode === 'pan' ? 1 : 0.22) : 0.078;
    cam.panX += (cam.targetPanX - cam.panX) * ease;
    cam.panY += (cam.targetPanY - cam.panY) * ease;
    cam.zoom += (cam.targetZoom - cam.zoom) * ease;

    applyCameraTransform();

    var tilt = cam.tilt + cam.pitch;
    characters.forEach(function (ch) {
      if (!ch.billboardEl) return;
      ch.billboardEl.style.transform =
        'translate(-50%, calc(-100% + 26px)) rotateY(' + (-cam.yaw).toFixed(3) + 'deg) rotateX(' + (-tilt).toFixed(3) + 'deg)';
    });

    rafId = window.requestAnimationFrame(tick);
  }

  function computeFocusPan(playerIdx) {
    var ch = characters[playerIdx];
    if (!ch) return { panX: 0, panY: 0, zoom: FOCUS_ZOOM };
    ch.syncTileFromState();
    if (!ch.currentTile) return { panX: 0, panY: 0, zoom: FOCUS_ZOOM };

    var xy = G.boardCamera.tileXY(ch.currentTile);
    var w = stageEl ? stageEl.clientWidth : 640;
    var h = stageEl ? stageEl.clientHeight : 520;
    var nx = (xy.x - 50) / 50;
    var ny = (xy.y - 50) / 50;

    return {
      panX: -nx * w * 0.36,
      panY: -ny * h * 0.24,
      zoom: FOCUS_ZOOM,
    };
  }

  function adjustUserZoom(factor) {
    cam.userZoom = clamp(cam.userZoom * factor, MIN_USER_ZOOM, MAX_USER_ZOOM);
    syncTargetZoom();
  }

  function bindDragControls() {
    if (!stageEl) return;

    var lastX = 0;
    var lastY = 0;
    var pointerId = null;

    function onDown(e) {
      if (e.target.closest('.board-tools-dock')) return;
      if (e.button !== undefined && e.button !== 0) return;

      cam.dragging = true;
      cam.userOverridePan = true;
      cam.dragMode = e.altKey ? 'pan' : 'orbit';
      pointerId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      stageEl.setPointerCapture(pointerId);
      stageEl.classList.add(cam.dragMode === 'pan' ? 'is-panning' : 'is-dragging');
      e.preventDefault();
    }

    function onMove(e) {
      if (!cam.dragging || e.pointerId !== pointerId) return;
      var dx = e.clientX - lastX;
      var dy = e.clientY - lastY;

      if (cam.dragMode === 'pan') {
        cam.panX += dx;
        cam.panY += dy;
        cam.targetPanX = cam.panX;
        cam.targetPanY = cam.panY;
      } else {
        cam.yaw += dx * 0.32;
        cam.pitch = clamp(cam.pitch - dy * 0.14, MIN_PITCH, MAX_PITCH);
        cam.yawVel = dx * 0.06;
        cam.pitchVel = -dy * 0.025;
      }

      lastX = e.clientX;
      lastY = e.clientY;
      e.preventDefault();
    }

    function onUp(e) {
      if (e.pointerId !== pointerId) return;
      cam.dragging = false;
      cam.dragMode = null;
      pointerId = null;
      stageEl.classList.remove('is-dragging', 'is-panning');
      try { stageEl.releasePointerCapture(e.pointerId); } catch (_err) { /* noop */ }
    }

    stageEl.addEventListener('pointerdown', onDown);
    stageEl.addEventListener('pointermove', onMove);
    stageEl.addEventListener('pointerup', onUp);
    stageEl.addEventListener('pointercancel', onUp);
    stageEl.addEventListener('dblclick', function (e) {
      if (e.target.closest('.board-tools-dock')) return;
      G.boardCamera.recenterOnActivePlayer();
    });
    stageEl.addEventListener('wheel', function (e) {
      e.preventDefault();
      cam.userOverridePan = true;
      var factor = 1 - e.deltaY * 0.0015;
      adjustUserZoom(factor);
    }, { passive: false });

    window.addEventListener('resize', function () {
      if (G.state) G.boardCamera.focusActivePlayer(G.state.currentPlayer);
    });

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', function () {
        cam.userOverridePan = true;
        adjustUserZoom(1.14);
      });
    }
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', function () {
        cam.userOverridePan = true;
        adjustUserZoom(1 / 1.14);
      });
    }
    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', function () {
        G.boardCamera.recenterOnActivePlayer();
      });
    }
  }

  G.boardCamera = {
    characters: characters,

    depthFromY: function (y) {
      var t = Math.max(0, Math.min(100, y)) / 100;
      return {
        scale: 0.84 + t * 0.22,
        translateZ: 2 + t * 12,
      };
    },

    tileXY: function (tile) {
      if (!tile) return { x: 50, y: 50 };
      if (tile.inCenter) return G.centerXY();
      if (tile.onPath) return G.pathTileXY(tile.pos);
      return G.outerTrackXY(tile.pos);
    },

    init: function (refs) {
      stageEl = refs.boardStage;
      rigEl = refs.boardCameraRig;
      planeEl = refs.boardPlane;
      charactersEl = refs.boardCharacters;
      zoomInBtn = refs.zoomInBtn;
      zoomOutBtn = refs.zoomOutBtn;
      zoomResetBtn = refs.zoomResetBtn;
      this.ensureCharacters();
      bindDragControls();
      syncTargetZoom();
      if (!rafId) rafId = window.requestAnimationFrame(tick);
      this.focusActivePlayer(G.state ? G.state.currentPlayer : 0);
    },

    ensureCharacters: function () {
      if (!charactersEl) return;
      if (characters.length) return;

      G.PLAYERS.forEach(function (pl, idx) {
        var ch = new BoardCharacter(idx, pl);
        var root = document.createElement('div');
        root.className = 'board-character-root';
        root.dataset.player = String(idx);

        var shadow = document.createElement('div');
        shadow.className = 'board-character-shadow';
        root.appendChild(shadow);

        var billboard = document.createElement('div');
        billboard.className = 'board-character-billboard';

        var actor = document.createElement('div');
        actor.className = 'board-character ' + pl.css;

        if (pl.sprite) {
          actor.classList.add('has-sprite');

          var sprite = document.createElement('img');
          sprite.className = 'board-character-sprite';
          sprite.src = pl.sprite;
          sprite.alt = pl.name;
          sprite.draggable = false;
          actor.appendChild(sprite);

          var spriteBadge = document.createElement('div');
          spriteBadge.className = 'board-character-badge sprite-badge';
          spriteBadge.textContent = pl.name[0];
          actor.appendChild(spriteBadge);
        } else {
          var body = document.createElement('div');
          body.className = 'board-character-body';
          actor.appendChild(body);

          var head = document.createElement('div');
          head.className = 'board-character-head';
          body.appendChild(head);

          var badge = document.createElement('div');
          badge.className = 'board-character-badge';
          badge.textContent = pl.name[0];
          body.appendChild(badge);
        }

        billboard.appendChild(actor);
        root.appendChild(billboard);

        ch.rootEl = root;
        ch.billboardEl = billboard;
        ch.el = actor;
        charactersEl.appendChild(root);
        characters.push(ch);
      });
    },

    /* Rebuild all character tokens (e.g. after character selection changes
       which sprite each player uses). */
    rebuildCharacters: function () {
      if (!charactersEl) return;
      characters.length = 0;
      while (charactersEl.firstChild) charactersEl.removeChild(charactersEl.firstChild);
      this.ensureCharacters();
      this.syncAll();
    },

    focusActivePlayer: function (playerIdx) {
      if (playerIdx !== focusPlayerIdx) {
        cam.userOverridePan = false;
      }
      focusPlayerIdx = playerIdx;

      if (!cam.userOverridePan) {
        var focus = computeFocusPan(playerIdx);
        cam.focusZoom = focus.zoom;
        cam.targetPanX = focus.panX;
        cam.targetPanY = focus.panY;
      } else {
        cam.focusZoom = 1.02;
      }
      syncTargetZoom();

      characters.forEach(function (ch, i) {
        if (ch.rootEl) {
          ch.rootEl.classList.toggle('is-active-turn', i === playerIdx);
        }
      });
    },

    recenterOnActivePlayer: function () {
      cam.userOverridePan = false;
      cam.userZoom = 1;
      var focus = computeFocusPan(focusPlayerIdx);
      cam.focusZoom = focus.zoom;
      cam.targetPanX = focus.panX;
      cam.targetPanY = focus.panY;
      syncTargetZoom();
    },

    syncAll: function () {
      this.ensureCharacters();
      if (!charactersEl) return;

      var stacks = {};
      characters.forEach(function (ch) {
        ch.syncTileFromState();
        if (!ch.currentTile) {
          if (ch.rootEl) ch.rootEl.style.display = 'none';
          return;
        }
        var key = ch.tileKey(ch.currentTile);
        if (!stacks[key]) stacks[key] = [];
        stacks[key].push(ch);
      });

      Object.keys(stacks).forEach(function (key) {
        var group = stacks[key];
        group.forEach(function (ch, i) {
          if (ch.rootEl) ch.rootEl.style.display = '';
          ch.applyPosition(i, group.length);
        });
      });

      if (G.state) {
        this.focusActivePlayer(G.state.currentPlayer);
      }
    },

    animatePlayerStep: function (playerIdx, pos, onPath, inCenter) {
      var ch = characters[playerIdx];
      if (!ch) return;

      var nextTile = {
        tileId: inCenter ? G.CENTER_TILE_ID : pos,
        pos: pos,
        onPath: onPath,
        inCenter: inCenter,
      };
      ch.targetTile = nextTile;
      ch.setMovementState('moving');
      ch.currentTile = nextTile;
      this.syncAll();

      if (playerIdx === focusPlayerIdx && !cam.userOverridePan) {
        var focus = computeFocusPan(playerIdx);
        cam.targetPanX = focus.panX;
        cam.targetPanY = focus.panY;
      }
    },

    finishPlayerMovement: function (playerIdx) {
      var ch = characters[playerIdx];
      if (!ch) return;
      ch.setMovementState('arrived');
      window.setTimeout(function () {
        ch.setMovementState('idle');
      }, 240);
    },

    resetAll: function () {
      cam.yaw = -8;
      cam.pitch = 0;
      cam.yawVel = 0;
      cam.pitchVel = 0;
      cam.userOverridePan = false;
      cam.userZoom = 1;
      cam.focusZoom = FOCUS_ZOOM;
      syncTargetZoom();
      characters.forEach(function (ch) {
        ch.setMovementState('idle');
        ch.syncTileFromState();
      });
      this.syncAll();
    },
  };

})(window.Game);
