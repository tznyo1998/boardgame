window.Game = window.Game || {};

(function (G) {

  /* --------------------------------------------------------
   *  Screen-position helpers (percentage-based 0-100 coords)
   * -------------------------------------------------------- */

  function outerTrackXY(tileIndex) {
    var side     = Math.floor(tileIndex / G.TILES_PER_SIDE);
    var pos      = tileIndex % G.TILES_PER_SIDE;
    var margin   = 15;
    var cellSize = (100 - 2 * margin) / G.TILES_PER_SIDE;
    var x, y;
    if      (side === 0) { x = margin + pos * cellSize; y = margin; }
    else if (side === 1) { x = 100 - margin;            y = margin + pos * cellSize; }
    else if (side === 2) { x = 100 - margin - pos * cellSize; y = 100 - margin; }
    else                 { x = margin;                   y = 100 - margin - pos * cellSize; }
    return { x: x, y: y };
  }

  function pathTileXY(tileIndex) {
    var pathIdx  = Math.floor((tileIndex - G.OUTER_TRACK_SIZE) / G.PATH_TILES_PER_PATH);
    var pathPos  = (tileIndex - G.OUTER_TRACK_SIZE) % G.PATH_TILES_PER_PATH;
    var entry    = outerTrackXY(G.CENTER_ENTRY_POINTS[pathIdx]);
    var progress = (pathPos + 1) / (G.PATH_TILES_PER_PATH + 1);
    return {
      x: entry.x + (50 - entry.x) * progress,
      y: entry.y + (50 - entry.y) * progress,
    };
  }

  function centerXY() { return { x: 50, y: 50 }; }

  /** Returns { left, top, transform } style strings. */
  G.cellPosition = function (tileId, onPath, inCenter) {
    var p;
    if (inCenter) p = centerXY();
    else if (onPath) p = pathTileXY(tileId);
    else p = outerTrackXY(tileId);
    return { left: p.x + '%', top: p.y + '%', transform: 'translate(-50%,-50%)' };
  };

  G.outerTrackXY = outerTrackXY;
  G.pathTileXY   = pathTileXY;
  G.centerXY     = centerXY;

  /* --------------------------------------------------------
   *  Adjacency graph  (built once)
   * -------------------------------------------------------- */

  var adj = null;

  function buildGraph() {
    adj = {};
    for (var i = 0; i < G.TOTAL_TILES; i++) adj[i] = [];

    // Outer track ring
    for (var i = 0; i < G.OUTER_TRACK_SIZE; i++) {
      var nxt = (i + 1) % G.OUTER_TRACK_SIZE;
      var prv = (i - 1 + G.OUTER_TRACK_SIZE) % G.OUTER_TRACK_SIZE;
      adj[i].push(nxt, prv);
    }

    for (var p = 0; p < 4; p++) {
      var entry     = G.CENTER_ENTRY_POINTS[p];
      var pathStart = G.OUTER_TRACK_SIZE + p * G.PATH_TILES_PER_PATH;

      // Entry ↔ first path tile
      adj[entry].push(pathStart);
      adj[pathStart].push(entry);

      // Sequential path connections
      for (var t = 0; t < G.PATH_TILES_PER_PATH - 1; t++) {
        adj[pathStart + t].push(pathStart + t + 1);
        adj[pathStart + t + 1].push(pathStart + t);
      }

      // Middle path tile ↔ center
      var mid = pathStart + Math.floor(G.PATH_TILES_PER_PATH / 2);
      adj[mid].push(G.CENTER_TILE_ID);
      adj[G.CENTER_TILE_ID].push(mid);
    }
  }

  /** BFS shortest-path distance between two tile IDs. */
  G.tileDistance = function (fromId, toId) {
    if (!adj) buildGraph();
    if (fromId === toId) return 0;
    var visited = {};
    visited[fromId] = true;
    var queue = [[fromId, 0]];
    while (queue.length) {
      var cur  = queue.shift();
      var node = cur[0], dist = cur[1];
      var neighbours = adj[node];
      for (var i = 0; i < neighbours.length; i++) {
        var nb = neighbours[i];
        if (nb === toId) return dist + 1;
        if (!visited[nb]) {
          visited[nb] = true;
          queue.push([nb, dist + 1]);
        }
      }
    }
    return Infinity;
  };

  G.rebuildGraph = function () { buildGraph(); };
  buildGraph();

  G.isValidTileId = function (tileId) {
    return typeof tileId === 'number' && tileId >= 0 && tileId < G.TOTAL_TILES;
  };

  /* --------------------------------------------------------
   *  Direction helpers
   *
   *  Each "move option" returned is { id, label } where id
   *  is an opaque action key used by main.js to execute the
   *  actual movement.
   * -------------------------------------------------------- */

  /** CW labels per side (the visual arrow for +1 movement). */
  var CW_LABELS  = ['→ Right', '↓ Down', '← Left', '↑ Up'];
  /** CCW labels at corners (posInSide === 0). */
  var CCW_CORNER = ['↓ Down',  '← Left', '↑ Up',   '→ Right'];
  /** CCW labels at non-corners. */
  var CCW_NORMAL = ['← Left',  '↑ Up',   '→ Right','↓ Down'];
  /** Arrow pointing toward center from each path. */
  var PATH_IN_ARROW  = ['↓', '←', '↑', '→'];
  var PATH_OUT_ARROW = ['↑', '→', '↓', '←'];

  /**
   * Returns an array of { id, label } describing the moves
   * available from the given position / zone.
   */
  G.getAvailableMoves = function (pos, onPath, inCenter) {
    var moves = [];

    if (inCenter) {
      moves.push({ id: 'exit-0', label: '↑ Exit Top' });
      moves.push({ id: 'exit-1', label: '→ Exit Right' });
      moves.push({ id: 'exit-2', label: '↓ Exit Bottom' });
      moves.push({ id: 'exit-3', label: '← Exit Left' });
      return moves;
    }

    if (onPath) {
      var pathIdx = Math.floor((pos - G.OUTER_TRACK_SIZE) / G.PATH_TILES_PER_PATH);
      var pathPos = (pos - G.OUTER_TRACK_SIZE) % G.PATH_TILES_PER_PATH;
      var mid     = Math.floor(G.PATH_TILES_PER_PATH / 2);

      if (pathPos < G.PATH_TILES_PER_PATH - 1)
        moves.push({ id: 'path-in',  label: PATH_IN_ARROW[pathIdx]  + ' Deeper' });
      if (pathPos > 0)
        moves.push({ id: 'path-out', label: PATH_OUT_ARROW[pathIdx] + ' Back' });
      else
        moves.push({ id: 'path-exit', label: PATH_OUT_ARROW[pathIdx] + ' Exit Path' });
      if (pathPos === mid)
        moves.push({ id: 'to-center', label: 'Enter Center' });
      return moves;
    }

    // Outer track
    var side      = Math.floor(pos / G.TILES_PER_SIDE);
    var posInSide = pos % G.TILES_PER_SIDE;

    moves.push({ id: 'cw',  label: CW_LABELS[side] });
    moves.push({ id: 'ccw', label: posInSide === 0 ? CCW_CORNER[side] : CCW_NORMAL[side] });

    if (G.CENTER_ENTRY_POINTS.indexOf(pos) !== -1) {
      var enterArrow = PATH_IN_ARROW[G.CENTER_ENTRY_POINTS.indexOf(pos)];
      moves.push({ id: 'to-path', label: enterArrow + ' Enter Path' });
    }

    return moves;
  };

  /**
   * Execute one step of movement and return the resulting
   * { pos, onPath, inCenter } after that single step.
   *
   * moveId is one of the ids returned by getAvailableMoves.
   * This function handles a SINGLE step; callers loop for
   * multi-step moves.
   */
  G.stepMove = function (pos, onPath, inCenter, moveId) {
    if (!G.isValidTileId(pos)) {
      return { pos: G.CENTER_TILE_ID, onPath: false, inCenter: true };
    }

    // Center is terminal unless explicitly exiting center.
    if (inCenter && moveId.indexOf('exit-') !== 0) {
      return { pos: G.CENTER_TILE_ID, onPath: false, inCenter: true };
    }

    if (moveId === 'cw')
      return { pos: (pos + 1) % G.OUTER_TRACK_SIZE, onPath: false, inCenter: false };

    if (moveId === 'ccw')
      return { pos: (pos - 1 + G.OUTER_TRACK_SIZE) % G.OUTER_TRACK_SIZE, onPath: false, inCenter: false };

    if (moveId === 'to-path') {
      var pi = G.CENTER_ENTRY_POINTS.indexOf(pos);
      if (pi === -1) return { pos: pos, onPath: false, inCenter: false };
      return { pos: G.OUTER_TRACK_SIZE + pi * G.PATH_TILES_PER_PATH, onPath: true, inCenter: false };
    }

    if (moveId === 'path-in') {
      if (!onPath) return { pos: pos, onPath: onPath, inCenter: inCenter };
      var pathPos = (pos - G.OUTER_TRACK_SIZE) % G.PATH_TILES_PER_PATH;
      var mid = Math.floor(G.PATH_TILES_PER_PATH / 2);
      // Moving "deeper" from the middle path tile enters center, making center naturally landable.
      if (pathPos === mid)
        return { pos: G.CENTER_TILE_ID, onPath: false, inCenter: true };
      if (pathPos < G.PATH_TILES_PER_PATH - 1)
        return { pos: pos + 1, onPath: true, inCenter: false };
      return { pos: pos, onPath: true, inCenter: false }; // boundary
    }

    if (moveId === 'path-out') {
      if (!onPath) return { pos: pos, onPath: onPath, inCenter: inCenter };
      var pathPos2 = (pos - G.OUTER_TRACK_SIZE) % G.PATH_TILES_PER_PATH;
      if (pathPos2 > 0) return { pos: pos - 1, onPath: true, inCenter: false };
      return { pos: pos, onPath: true, inCenter: false }; // shouldn't happen, use path-exit
    }

    if (moveId === 'path-exit') {
      if (!onPath) return { pos: pos, onPath: onPath, inCenter: inCenter };
      var pi2 = Math.floor((pos - G.OUTER_TRACK_SIZE) / G.PATH_TILES_PER_PATH);
      return { pos: G.CENTER_ENTRY_POINTS[pi2], onPath: false, inCenter: false };
    }

    if (moveId === 'to-center')
      return { pos: G.CENTER_TILE_ID, onPath: false, inCenter: true };

    // exit-0 through exit-3
    if (moveId.indexOf('exit-') === 0) {
      var exitIdx = parseInt(moveId.split('-')[1], 10);
      var midTile = G.OUTER_TRACK_SIZE + exitIdx * G.PATH_TILES_PER_PATH
                    + Math.floor(G.PATH_TILES_PER_PATH / 2);
      if (!G.isValidTileId(midTile)) return { pos: G.CENTER_TILE_ID, onPath: false, inCenter: true };
      return { pos: midTile, onPath: true, inCenter: false };
    }

    return { pos: pos, onPath: onPath, inCenter: inCenter };
  };

})(window.Game);
