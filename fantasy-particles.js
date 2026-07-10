/* ============================================================
   fantasy-particles.js
   Canvas-based ambient FX:
     • Arcane floating sparkles
     • Fire embers that drift upward
     • Occasional lightning bolt streaks
     • Slow-drifting mist orbs
   ============================================================ */

(function () {
  'use strict';

  var canvas = document.getElementById('fxCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  /* ---- resize ---- */
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ================================================================
     PARTICLE POOL
     ================================================================ */
  var particles = [];

  /* ---- Sparkle / arcane mote ---- */
  function Sparkle() {
    this.reset();
  }
  Sparkle.prototype.reset = function () {
    this.x    = Math.random() * canvas.width;
    this.y    = canvas.height + 10;
    this.vx   = (Math.random() - 0.5) * 0.6;
    this.vy   = -(0.3 + Math.random() * 0.9);
    this.size = 1 + Math.random() * 2.5;
    this.life = 0;
    this.maxLife = 120 + Math.random() * 180;
    /* Colour: gold, arcane purple, ice blue, or crimson */
    var palette = [
      'rgba(212,175,55,',
      'rgba(168,85,247,',
      'rgba(0,180,216,',
      'rgba(230,57,70,',
      'rgba(255,200,80,'
    ];
    this.colour = palette[Math.floor(Math.random() * palette.length)];
  };
  Sparkle.prototype.update = function () {
    this.x   += this.vx + Math.sin(this.life * 0.05) * 0.3;
    this.y   += this.vy;
    this.life++;
    return this.life < this.maxLife && this.y > -10;
  };
  Sparkle.prototype.draw = function () {
    var t   = this.life / this.maxLife;
    var alpha = t < 0.2 ? t / 0.2 : t > 0.75 ? (1 - t) / 0.25 : 1;
    alpha *= 0.7;
    ctx.save();
    ctx.globalAlpha = alpha;
    /* Glow */
    ctx.shadowBlur  = 8;
    ctx.shadowColor = this.colour + '0.9)';
    ctx.fillStyle   = this.colour + alpha + ')';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  /* ---- Ember (fire particle) ---- */
  function Ember() {
    this.reset();
  }
  Ember.prototype.reset = function () {
    /* Spawn along the bottom edge, slightly random x */
    this.x      = Math.random() * canvas.width;
    this.y      = canvas.height + 5;
    this.vx     = (Math.random() - 0.5) * 1.2;
    this.vy     = -(0.6 + Math.random() * 1.8);
    this.size   = 0.8 + Math.random() * 2;
    this.life   = 0;
    this.maxLife = 80 + Math.random() * 100;
    /* Ember colours: orange → yellow → white tip */
    this.r = 255;
    this.g = 80  + Math.floor(Math.random() * 120);
    this.b = Math.floor(Math.random() * 40);
  };
  Ember.prototype.update = function () {
    this.x   += this.vx;
    this.vy  -= 0.005;
    this.y   += this.vy;
    this.vx  += (Math.random() - 0.5) * 0.08;
    this.life++;
    return this.life < this.maxLife && this.y > -10;
  };
  Ember.prototype.draw = function () {
    var t     = this.life / this.maxLife;
    var alpha = t < 0.15 ? t / 0.15 : t > 0.6 ? (1 - t) / 0.4 : 1;
    alpha    *= 0.55;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowBlur  = 10;
    ctx.shadowColor = 'rgba(255,100,0,0.8)';
    var grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
    grad.addColorStop(0,   'rgba(255,240,160,1)');
    grad.addColorStop(0.4, 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',0.9)');
    grad.addColorStop(1,   'rgba(200,30,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  /* ---- Mist orb (slow-drifting glow) ---- */
  function Mist() {
    this.reset();
  }
  Mist.prototype.reset = function () {
    this.x    = Math.random() * canvas.width;
    this.y    = Math.random() * canvas.height;
    this.vx   = (Math.random() - 0.5) * 0.18;
    this.vy   = (Math.random() - 0.5) * 0.12;
    this.size = 60 + Math.random() * 120;
    this.life = 0;
    this.maxLife = 400 + Math.random() * 400;
    var cols = [
      [80,  30, 180],   // arcane purple
      [0,   140, 200],  // storm blue
      [212, 130,  20],  // gold
      [100, 0,   0]     // dark crimson
    ];
    var c    = cols[Math.floor(Math.random() * cols.length)];
    this.r   = c[0]; this.g = c[1]; this.b = c[2];
  };
  Mist.prototype.update = function () {
    this.x   += this.vx;
    this.y   += this.vy;
    this.life++;
    if (this.x < -200 || this.x > canvas.width + 200 ||
        this.y < -200 || this.y > canvas.height + 200) {
      this.reset();
      this.life = 0;
    }
    return this.life < this.maxLife;
  };
  Mist.prototype.draw = function () {
    var t     = this.life / this.maxLife;
    var alpha = t < 0.1 ? t / 0.1 : t > 0.85 ? (1 - t) / 0.15 : 1;
    alpha    *= 0.025;
    ctx.save();
    var grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
    grad.addColorStop(0,   'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + alpha + ')');
    grad.addColorStop(1,   'rgba(' + this.r + ',' + this.g + ',' + this.b + ',0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  /* ================================================================
     LIGHTNING BOLT
     ================================================================ */
  var lightnings = [];

  function Lightning() {
    this.reset();
  }
  Lightning.prototype.reset = function () {
    this.life    = 0;
    this.maxLife = 18 + Math.floor(Math.random() * 10);
    /* Bolt travels from a random top point downward at an angle */
    this.sx = 0.1 * canvas.width + Math.random() * 0.8 * canvas.width;
    this.sy = 0;
    this.ex = this.sx + (Math.random() - 0.5) * 200;
    this.ey = 0.3 * canvas.height + Math.random() * 0.5 * canvas.height;
    this.segments = buildLightningPath(this.sx, this.sy, this.ex, this.ey, 6);
    this.colour   = Math.random() < 0.5
      ? 'rgba(140,210,255,'     // electric blue
      : 'rgba(220,180,255,';   // violet lightning
  };
  Lightning.prototype.update = function () {
    this.life++;
    return this.life < this.maxLife;
  };
  Lightning.prototype.draw = function () {
    var t     = this.life / this.maxLife;
    var alpha = t < 0.25 ? t / 0.25 : (1 - t) / 0.75;
    alpha    *= 0.75;
    ctx.save();
    ctx.globalAlpha  = alpha;
    ctx.shadowBlur   = 18;
    ctx.shadowColor  = this.colour + '1)';
    ctx.strokeStyle  = this.colour + '1)';
    ctx.lineWidth    = 1.2;
    ctx.lineCap      = 'round';
    ctx.beginPath();
    ctx.moveTo(this.segments[0].x, this.segments[0].y);
    for (var i = 1; i < this.segments.length; i++) {
      ctx.lineTo(this.segments[i].x, this.segments[i].y);
    }
    ctx.stroke();
    /* Bright core */
    ctx.globalAlpha  = alpha * 0.9;
    ctx.strokeStyle  = 'rgba(255,255,255,1)';
    ctx.lineWidth    = 0.5;
    ctx.shadowBlur   = 4;
    ctx.stroke();
    ctx.restore();

    /* Flash the DOM if it's a fresh bolt */
    if (this.life === 1 && Math.random() < 0.5) {
      var flash = document.createElement('div');
      flash.className = 'lightning-overlay';
      document.body.appendChild(flash);
      setTimeout(function () { flash.remove(); }, 650);
    }
  };

  function buildLightningPath(x1, y1, x2, y2, detail) {
    var pts = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
    for (var d = 0; d < detail; d++) {
      var next = [];
      for (var i = 0; i < pts.length - 1; i++) {
        next.push(pts[i]);
        var mx = (pts[i].x + pts[i + 1].x) / 2;
        var my = (pts[i].y + pts[i + 1].y) / 2;
        var dx = pts[i + 1].x - pts[i].x;
        var dy = pts[i + 1].y - pts[i].y;
        var len = Math.sqrt(dx * dx + dy * dy);
        var off = (Math.random() - 0.5) * len * 0.45;
        mx += (-dy / len) * off;
        my += ( dx / len) * off;
        next.push({ x: mx, y: my });
      }
      next.push(pts[pts.length - 1]);
      pts = next;
    }
    return pts;
  }

  /* ================================================================
     POOL INITIALISATION
     ================================================================ */
  var NUM_SPARKLES = 55;
  var NUM_EMBERS   = 30;
  var NUM_MISTS    = 8;

  for (var i = 0; i < NUM_SPARKLES; i++) {
    var sp = new Sparkle();
    sp.y    = Math.random() * canvas.height; // scatter initially
    sp.life = Math.floor(Math.random() * sp.maxLife);
    particles.push(sp);
  }
  for (var j = 0; j < NUM_EMBERS; j++) {
    var em = new Ember();
    em.y    = canvas.height - Math.random() * canvas.height * 0.6;
    em.life = Math.floor(Math.random() * em.maxLife);
    particles.push(em);
  }
  for (var k = 0; k < NUM_MISTS; k++) {
    var ms = new Mist();
    ms.life = Math.floor(Math.random() * ms.maxLife * 0.5);
    particles.push(ms);
  }

  /* Lightning spawn timer */
  var lightningTimer    = 0;
  var lightningInterval = 280 + Math.floor(Math.random() * 240); // frames between bolts

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Update & draw particles */
    for (var p = particles.length - 1; p >= 0; p--) {
      var alive = particles[p].update();
      particles[p].draw();
      if (!alive) {
        /* Recycle */
        particles[p].reset();
        particles[p].life = 0;
      }
    }

    /* Lightning */
    lightningTimer++;
    if (lightningTimer >= lightningInterval) {
      lightnings.push(new Lightning());
      lightningTimer    = 0;
      lightningInterval = 280 + Math.floor(Math.random() * 300);
    }
    for (var l = lightnings.length - 1; l >= 0; l--) {
      var lalive = lightnings[l].update();
      lightnings[l].draw();
      if (!lalive) lightnings.splice(l, 1);
    }

    requestAnimationFrame(loop);
  }

  loop();

})();
