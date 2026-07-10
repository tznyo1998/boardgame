window.Game = window.Game || {};

/* ================================================================
 *  CHARACTER SELECTION SCREEN
 *  Shown when the game first loads (and on New Quest).
 *  Each player picks a champion in turn; picks are unique.
 *  Characters whose sprite art is missing appear as "coming soon".
 * ================================================================ */
(function (G) {

  var overlayEl = null;
  var gridEl = null;
  var promptEl = null;
  var subEl = null;
  var currentPickIdx = 0;
  var picks = [];          // playerIdx -> character key or 'classic'
  var available = {};      // key -> bool (sprite art loaded ok)
  var onDoneCb = null;

  function buildOverlay() {
    if (overlayEl) return;

    overlayEl = document.createElement('div');
    overlayEl.className = 'char-select-overlay';
    overlayEl.id = 'characterSelect';

    var panel = document.createElement('div');
    panel.className = 'char-select-panel';

    var title = document.createElement('h2');
    title.className = 'char-select-title';
    title.textContent = 'Choose Your Champions';
    panel.appendChild(title);

    promptEl = document.createElement('div');
    promptEl.className = 'char-select-prompt';
    panel.appendChild(promptEl);

    subEl = document.createElement('div');
    subEl.className = 'char-select-sub';
    subEl.textContent = 'Each champion may only be chosen once.';
    panel.appendChild(subEl);

    gridEl = document.createElement('div');
    gridEl.className = 'char-select-grid';
    panel.appendChild(gridEl);

    overlayEl.appendChild(panel);
    document.body.appendChild(overlayEl);
  }

  function makeCard(ch) {
    // ch === null -> classic token card
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'char-card';

    var preview = document.createElement('div');
    preview.className = 'char-card-preview';

    if (ch) {
      card.dataset.key = ch.key;
      var img = document.createElement('img');
      img.className = 'char-card-sprite';
      img.alt = ch.name;
      img.draggable = false;
      img.onload = function () { available[ch.key] = true; };
      img.onerror = function () {
        available[ch.key] = false;
        card.classList.add('is-unavailable');
        card.disabled = true;
        var tag = card.querySelector('.char-card-tagline');
        if (tag) tag.textContent = 'Coming soon…';
        preview.classList.add('is-silhouette');
      };
      img.src = ch.sprite;
      preview.appendChild(img);
    } else {
      card.dataset.key = 'classic';
      var token = document.createElement('div');
      token.className = 'char-card-token';
      var tokenHead = document.createElement('div');
      tokenHead.className = 'char-card-token-head';
      token.appendChild(tokenHead);
      preview.appendChild(token);
    }

    card.appendChild(preview);

    var name = document.createElement('div');
    name.className = 'char-card-name';
    name.textContent = ch ? ch.name : 'Classic Token';
    card.appendChild(name);

    var tagline = document.createElement('div');
    tagline.className = 'char-card-tagline';
    tagline.textContent = ch ? ch.tagline : 'The old ways endure';
    card.appendChild(tagline);

    var takenChip = document.createElement('div');
    takenChip.className = 'char-card-taken-chip';
    card.appendChild(takenChip);

    card.addEventListener('click', function () {
      if (card.disabled) return;
      pick(card.dataset.key);
    });

    return card;
  }

  function renderGrid() {
    var pl = G.PLAYERS[currentPickIdx];
    promptEl.innerHTML =
      '<span class="char-select-player ' + pl.css + '">' + pl.name + '</span>, choose your champion';

    // Update card states for taken picks
    var cards = gridEl.querySelectorAll('.char-card');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var key = card.dataset.key;
      var takenBy = -1;
      if (key !== 'classic') {
        for (var p = 0; p < currentPickIdx; p++) {
          if (picks[p] === key) { takenBy = p; break; }
        }
      }
      var unavailable = card.classList.contains('is-unavailable');
      card.classList.toggle('is-taken', takenBy >= 0);
      card.disabled = unavailable || takenBy >= 0;
      var chip = card.querySelector('.char-card-taken-chip');
      if (takenBy >= 0) {
        chip.textContent = 'Taken by ' + G.PLAYERS[takenBy].name;
        chip.className = 'char-card-taken-chip show ' + G.PLAYERS[takenBy].css;
      } else {
        chip.className = 'char-card-taken-chip';
        chip.textContent = '';
      }
    }
  }

  function pick(key) {
    picks[currentPickIdx] = key;
    currentPickIdx += 1;
    if (currentPickIdx >= G.PLAYERS.length) {
      finish();
    } else {
      renderGrid();
    }
  }

  function finish() {
    // Apply choices to player meta
    G.PLAYERS.forEach(function (pl, idx) {
      var key = picks[idx];
      var ch = null;
      if (key && key !== 'classic') {
        for (var i = 0; i < G.CHARACTERS.length; i++) {
          if (G.CHARACTERS[i].key === key) { ch = G.CHARACTERS[i]; break; }
        }
      }
      if (ch) {
        pl.sprite = ch.sprite;
        pl.characterName = ch.name;
      } else {
        delete pl.sprite;
        delete pl.characterName;
      }
    });

    if (G.boardCamera && G.boardCamera.rebuildCharacters) {
      G.boardCamera.rebuildCharacters();
    }

    overlayEl.classList.add('is-closing');
    window.setTimeout(function () {
      overlayEl.classList.remove('show', 'is-closing');
      if (onDoneCb) { var cb = onDoneCb; onDoneCb = null; cb(); }
    }, 420);
  }

  G.characterSelect = {
    open: function (onDone) {
      buildOverlay();
      onDoneCb = onDone || null;
      currentPickIdx = 0;
      picks = [];

      // (Re)build cards fresh each time so availability re-checks
      gridEl.innerHTML = '';
      G.CHARACTERS.forEach(function (ch) { gridEl.appendChild(makeCard(ch)); });
      gridEl.appendChild(makeCard(null));

      renderGrid();
      overlayEl.classList.add('show');
    },
  };

})(window.Game);
