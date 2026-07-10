window.Game = window.Game || {};

(function (G) {

  /* ============================================================
   *  3D BOARD LANDMARKS (experimental)
   *
   *  REVERT / DISABLE:
   *    1) Set enabled: false below, OR
   *    2) Console: Game.boardLandmarks.setEnabled(false), OR
   *    3) URL: index.html?landmarks=0, OR
   *    4) Click the 🏔 toggle on the board corner
   * ============================================================ */

  var enabled = true;
  if (typeof URLSearchParams !== 'undefined') {
    var qp = new URLSearchParams(window.location.search);
    if (qp.get('landmarks') === '0') enabled = false;
  }

  var landmarksEl = null;
  var rendered = false;

  var DEFS = [
    { id: 'volcano',    type: 'volcano',  x: 50,  y: 47,  z: 38, scale: 1.15 },
    { id: 'mt-n',       type: 'mountain', x: 50,  y: 21,  z: 26, scale: 1.05, peaks: 3 },
    { id: 'mt-nw',      type: 'mountain', x: 30,  y: 28,  z: 22, scale: 0.88, peaks: 2 },
    { id: 'mt-ne',      type: 'mountain', x: 70,  y: 26,  z: 24, scale: 0.92, peaks: 2 },
    { id: 'mt-w',       type: 'mountain', x: 22,  y: 52,  z: 20, scale: 0.78, peaks: 2 },
    { id: 'castle-br',  type: 'building', x: 79,  y: 76,  z: 16, scale: 0.95, variant: 'castle' },
    { id: 'hut-bl',     type: 'building', x: 23,  y: 74,  z: 14, scale: 0.72, variant: 'hut' },
    { id: 'tower-tl',   type: 'building', x: 26,  y: 24,  z: 15, scale: 0.8,  variant: 'tower' },
    { id: 'keep-tr',    type: 'building', x: 74,  y: 23,  z: 14, scale: 0.75, variant: 'tower' },
  ];

  function el(tag, cls) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    return node;
  }

  function buildVolcano() {
    var stack = el('div', 'lm-volcano-stack');
    stack.appendChild(el('div', 'lm-volcano-base'));
    stack.appendChild(el('div', 'lm-volcano-cone lm-volcano-cone-3'));
    stack.appendChild(el('div', 'lm-volcano-cone lm-volcano-cone-2'));
    stack.appendChild(el('div', 'lm-volcano-cone lm-volcano-cone-1'));
    stack.appendChild(el('div', 'lm-volcano-crater'));
    stack.appendChild(el('div', 'lm-volcano-glow'));
    stack.appendChild(el('div', 'lm-lava lm-lava-a'));
    stack.appendChild(el('div', 'lm-lava lm-lava-b'));
    return stack;
  }

  function buildMountain(peaks) {
    var wrap = el('div', 'lm-mountain-stack');
    var n = peaks || 3;
    for (var i = 0; i < n; i++) {
      var peak = el('div', 'lm-mountain-peak');
      peak.style.setProperty('--peak-i', String(i));
      wrap.appendChild(peak);
    }
    wrap.appendChild(el('div', 'lm-mountain-snow'));
    return wrap;
  }

  function buildBuilding(variant) {
    var wrap = el('div', 'lm-building-stack lm-building-' + (variant || 'hut'));
    if (variant === 'castle') {
      wrap.appendChild(el('div', 'lm-b-wall'));
      wrap.appendChild(el('div', 'lm-b-tower lm-b-tower-l'));
      wrap.appendChild(el('div', 'lm-b-tower lm-b-tower-r'));
      wrap.appendChild(el('div', 'lm-b-keep'));
      wrap.appendChild(el('div', 'lm-b-roof'));
    } else if (variant === 'tower') {
      wrap.appendChild(el('div', 'lm-b-tower-single'));
      wrap.appendChild(el('div', 'lm-b-roof cone-roof'));
    } else {
      wrap.appendChild(el('div', 'lm-b-hut-base'));
      wrap.appendChild(el('div', 'lm-b-roof hut-roof'));
    }
    return wrap;
  }

  function renderLandmark(def) {
    var root = el('div', 'board-landmark board-landmark-' + def.type);
    root.dataset.landmarkId = def.id;
    root.style.left = def.x + '%';
    root.style.top = def.y + '%';
    root.style.setProperty('--lm-z', (def.z || 12) + 'px');
    root.style.setProperty('--lm-scale', String(def.scale || 1));
    root.style.setProperty('--lm-y', String(def.y));

    var inner;
    if (def.type === 'volcano') inner = buildVolcano();
    else if (def.type === 'mountain') inner = buildMountain(def.peaks);
    else inner = buildBuilding(def.variant);

    root.appendChild(inner);
    return root;
  }

  G.boardLandmarks = {
    enabled: enabled,

    init: function (elRef) {
      landmarksEl = elRef;
      this.applyEnabledState();
    },

    isEnabled: function () {
      return enabled;
    },

    setEnabled: function (on) {
      enabled = !!on;
      this.applyEnabledState();
      if (enabled) this.render();
      else this.clear();
    },

    toggle: function () {
      this.setEnabled(!enabled);
      return enabled;
    },

    applyEnabledState: function () {
      document.body.classList.toggle('landmarks-off', !enabled);
      document.body.classList.toggle('landmarks-on', enabled);
    },

    clear: function () {
      if (landmarksEl) landmarksEl.innerHTML = '';
      rendered = false;
    },

    render: function () {
      if (!enabled || !landmarksEl) return;
      landmarksEl.innerHTML = '';
      DEFS.forEach(function (def) {
        landmarksEl.appendChild(renderLandmark(def));
      });
      rendered = true;
    },
  };

})(window.Game);
