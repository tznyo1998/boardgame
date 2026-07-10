window.Game = window.Game || {};

(function (G) {
  G.PLAYERS = [
    { id: 0, name: 'Red',    color: 'red',    css: 'red'    },
    { id: 1, name: 'Blue',   color: 'blue',   css: 'blue',   sprite: 'assets/characters/warlock_sprite.png' },
    { id: 2, name: 'Green',  color: 'green',  css: 'green'  },
    { id: 3, name: 'Yellow', color: 'yellow', css: 'yellow' },
  ];

  /* Playable characters. `sprite` files live in assets/characters/.
     Characters whose sprite file is missing show as "coming soon" in the
     selection screen until the art is dropped into the folder. */
  G.CHARACTERS = [
    { key: 'warlock', name: 'Warlock', tagline: 'Wielder of forbidden flame', sprite: 'assets/characters/warlock_sprite.png' },
    { key: 'mage',    name: 'Mage',    tagline: 'Master of the arcane',       sprite: 'assets/characters/mage_sprite.png' },
    { key: 'warrior', name: 'Warrior', tagline: 'Steel and fury',             sprite: 'assets/characters/warrior_sprite.png' },
    { key: 'archer',  name: 'Archer',  tagline: 'Death from afar',            sprite: 'assets/characters/archer_sprite.png' },
    { key: 'paladin', name: 'Paladin', tagline: 'Shield of the light',        sprite: 'assets/characters/paladin_sprite.png' },
    { key: 'priest',  name: 'Priest',  tagline: 'Divine mender',              sprite: 'assets/characters/priest_sprite.png' },
  ];

  G.TILES_PER_SIDE      = 12;
  G.OUTER_TRACK_SIZE    = G.TILES_PER_SIDE * 4;          // 48
  G.PATH_TILES_PER_PATH = 7;
  G.TOTAL_PATH_TILES    = G.PATH_TILES_PER_PATH * 4;     // 28
  G.CENTER_TILE_ID      = G.OUTER_TRACK_SIZE + G.TOTAL_PATH_TILES; // 76
  G.TOTAL_TILES         = G.CENTER_TILE_ID + 1;           // 77

  G.MAX_HEALTH     = 20;
  G.MAX_MAGIC      = 10;
  G.MAGIC_PER_TURN = 2;
  G.CENTER_MANA    = 3;  // mana gained when starting turn on center
  G.MAX_ABILITIES  = 3;

  G.CENTER_ENTRY_POINTS = [6, 18, 30, 42];
  G.CORNER_TILES        = [0, 12, 24, 36];

  // 3 ability tiles per side, avoiding corners and entry points
  G.ABILITY_TILES = [3, 9, 10, 15, 20, 22, 27, 32, 34, 39, 44, 46];

  G.state = null;

  // Shared async helpers for movement/effect step playback.
  G.sleep = function (ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms || 0); });
  };

  G._actionQueue = [];
  G._queueRunning = false;
  G.enqueueAction = function (fnAsync) {
    return new Promise(function (resolve, reject) {
      G._actionQueue.push({ fn: fnAsync, resolve: resolve, reject: reject });
      G.runActionQueue();
    });
  };
  G.runActionQueue = async function () {
    if (G._queueRunning) return;
    G._queueRunning = true;
    while (G._actionQueue.length) {
      var item = G._actionQueue.shift();
      try {
        var result = await item.fn();
        item.resolve(result);
      } catch (err) {
        item.reject(err);
      }
    }
    G._queueRunning = false;
  };
  G.Sound = {
    play: function (_key) { /* no-op placeholder for future SFX */ },
  };

  G.resetState = function () {
    G.state = {
      positions : [0, 12, 24, 36],
      onPath    : [false, false, false, false],
      inCenter  : [false, false, false, false],
      health    : [G.MAX_HEALTH, G.MAX_HEALTH, G.MAX_HEALTH, G.MAX_HEALTH],
      magic     : [0, 0, 0, 0],
      abilities : [[], [], [], []],
      abilityUsesThisTurn : [{}, {}, {}, {}],
      hitTagsOnTargetsThisTurn : [{}, {}, {}, {}],
      tempCostModifiers : [[], [], [], []],
      extraRecastsThisTurn : [{}, {}, {}, {}],
      statuses : [{}, {}, {}, {}], // per-player status map by type
      lifeGainedThisTurn : [0, 0, 0, 0],
      lastCardTagsUsedByPlayer : [[], [], [], []],
      deathlessTriggered : [false, false, false, false],
      cannotDrawCards : [false, false, false, false],

      currentPlayer       : 0,
      turnModeChosen      : null, // null | 'melee' | 'spells'
      hasUsedMelee        : false, // true once melee attack is committed this turn
      lastRoll            : 0,
      hasRolled           : false,
      movementSkipped     : false,
      waitingForDirection : false,
      waitingForStartAttack : false,
      isResolvingAction : false,
      moveRollsUsedThisTurn : [0, 0, 0, 0],
      moveRollsAllowedThisTurn : [1, 1, 1, 1],
      movementRollQueue : [[], [], [], []],
      currentMoveRoll : 0,
      winner              : null,

      uiState : {
        lastDiceRoll: null,       // { dice:[n,...], reason:string }
        centerPopups: [],
      },
    };
  };

  /** Tile ID that encodes a player's location regardless of zone. */
  G.playerTileId = function (idx) {
    var s = G.state;
    if (s.inCenter[idx]) return G.CENTER_TILE_ID;
    return s.positions[idx];
  };

  G.resetState();
})(window.Game);
