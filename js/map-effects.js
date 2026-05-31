/**
 * Map Effects — Particle system + rendering enhancements
 * Non-invasive: patches into existing map object
 */
(function() {
  'use strict';

  // Particle system
  var particles = [];

  function spawnParticles(x, y, color, count, speed) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var spd = 30 + Math.random() * speed;
      particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 20,
        life: 0.3 + Math.random() * 0.5,
        maxLife: 0.8,
        color: color,
        size: 1.5 + Math.random() * 2.5
      });
    }
  }

  function spawnRing(x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2;
      particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * 20,
        vy: Math.sin(angle) * 20,
        life: 0.3, maxLife: 0.3,
        color: color, size: 1.5
      });
    }
  }

  function updateParticles(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles(ctx) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Expose particle functions
  window.game._particles = particles;
  window.game._updateParticles = updateParticles;
  window.game._drawParticles = drawParticles;

  window.game.particleDeath = function(x, y, isPlayer) {
    spawnParticles(x, y, isPlayer ? '#00ff41' : '#ff6b35', 20, 100);
  };
  window.game.particleJump = function(x, y, isPlayer) {
    spawnParticles(x, y + 10, isPlayer ? '#00ff41' : '#ff6b35', 5, 25);
  };
  window.game.particleLand = function(x, y, isPlayer) {
    spawnRing(x, y + 14, isPlayer ? '#00ff41' : '#ff6b35', 6);
  };
  window.game.particleWin = function(x, y) {
    spawnParticles(x, y, '#00ff41', 15, 80);
    spawnParticles(x, y, '#00D4FF', 15, 80);
    spawnParticles(x, y, '#ff6b35', 15, 80);
  };
  window.game.particleFail = function(x, y) {
    spawnParticles(x, y, '#FF0080', 20, 120);
  };

  // Deferred map patching - will apply when map is loaded
  function patchMap() {
    var map = window.game.map;
    if (!map) { setTimeout(patchMap, 100); return; }
    var origUpdate = map.update || function() {};
    map.update = function(dt) {
      origUpdate.call(this, dt);
      updateParticles(dt);
    };
    var origDraw = map.draw || function() {};
    map.draw = function(ctx) {
      origDraw.call(this, ctx);
      drawParticles(ctx);
    };
  }
  setTimeout(patchMap, 100);
})();
