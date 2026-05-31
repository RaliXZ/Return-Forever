/**
 * GSAP Animation Orchestration — Loop Prison
 * Guards: safe even if GSAP CDN is blocked
 */
window.gsapAnimations = window.gsapAnimations || {};

(function() {
  'use strict';
  var ga = window.gsapAnimations;
  var _timerTween = null;

  function hasGSAP() { return typeof gsap !== 'undefined' && gsap.to; }

  // Loading
  ga.animateLoading = function(pct) {
    var el = document.getElementById('loading-fill');
    if (el) el.style.width = pct + '%';
  };

  ga.animateLoadingComplete = function(cb) {
    if (hasGSAP()) {
      gsap.to('#loading-bar', { opacity: 0, duration: 0.6, onComplete: function() {
        var el = document.getElementById('loading-bar');
        if (el) el.style.display = 'none';
        if (cb) cb();
      }});
    } else {
      var el = document.getElementById('loading-bar');
      if (el) el.style.display = 'none';
      if (cb) setTimeout(cb, 100);
    }
  };

  // Start Screen
  ga.animateStartScreen = function() {
    if (!hasGSAP()) return;
    try {
      var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      // 先淡入整个画布容器
      tl.to('.canvas-wrapper', { opacity: 1, duration: 0.25 });
      // 然后依次淡入开始画面元素
      tl.fromTo('.start-top-row', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.25 }, '-=0.15');
      tl.fromTo('.start-glitch', { opacity: 0, y: -30, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.3 }, '-=0.15');
      tl.fromTo('.start-subtitle', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.2 }, '-=0.15');
      tl.fromTo('.start-divider', { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.25, transformOrigin: 'center' }, '-=0.1');
      tl.fromTo('.start-divider-fill', { scaleX: 0 }, { scaleX: 1, duration: 0.25, transformOrigin: 'center' }, '-=0.25');
      tl.fromTo('.start-desc', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.2 }, '-=0.15');
      tl.fromTo('.start-desc-sub', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.2 }, '-=0.15');
      tl.fromTo('.start-btn', { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(1.5)' }, '-=0.05');
      tl.fromTo('.start-hint', { opacity: 0 }, { opacity: 1, duration: 0.15 }, '-=0.1');
    } catch(e) {}
  };

  // Timer Warning
  ga.animateTimerWarning = function(seconds) {
    var el = document.getElementById('timer') || document.querySelector('.timer-inline');
    if (!el) return;
    if (seconds <= 10) {
      el.classList.add('warning');
      if (!_timerTween && hasGSAP()) {
        _timerTween = gsap.to(el, { scale: 1.05, duration: 0.5, repeat: -1, yoyo: true });
      }
    } else {
      el.classList.remove('warning');
      if (_timerTween) { _timerTween.kill(); _timerTween = null; }
    }
  };

  // Level Win
  ga.animateLevelWin = function(overlay, cb) {
    if (!overlay) { if (cb) setTimeout(cb, 0); return; }
    overlay.style.display = 'flex';
    if (hasGSAP()) {
      try {
        var tl = gsap.timeline({ onComplete: cb || function() {} });
        tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.4 });
        var title = overlay.querySelector('.game-overlay-title');
        if (title) tl.fromTo(title, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }, '-=0.2');
        var btns = overlay.querySelectorAll('.game-btn');
        btns.forEach(function(b) { tl.fromTo(b, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.3 }, '-=0.15'); });
        return;
      } catch(e) {}
    }
    if (cb) setTimeout(cb, 100);
  };

  // Level Lose
  ga.animateLevelLose = function(overlay, cb) {
    if (!overlay) { if (cb) setTimeout(cb, 0); return; }
    overlay.style.display = 'flex';
    if (hasGSAP()) {
      try {
        var tl = gsap.timeline({ onComplete: cb || function() {} });
        tl.to('#game-container', { x: '+=5', duration: 0.05, repeat: 5, yoyo: true });
        tl.set('#game-container', { x: 0 });
        tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        var title = overlay.querySelector('.game-overlay-title');
        if (title) tl.fromTo(title, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5 }, '-=0.1');
        return;
      } catch(e) {}
    }
    if (cb) setTimeout(cb, 100);
  };

  // Pause
  ga.animatePause = function() {
    if (!hasGSAP()) return;
    var ui = document.getElementById('ui-layer');
    if (ui) gsap.to(ui, { opacity: 0.3, duration: 0.2 });
  };
  ga.animateResume = function() {
    if (!hasGSAP()) return;
    var ui = document.getElementById('ui-layer');
    if (ui) gsap.to(ui, { opacity: 1, duration: 0.2 });
  };

  // Hover Effects
  ga.initHoverEffects = function() {
    if (!hasGSAP()) return;
    try {
      var btns = document.querySelectorAll('.start-btn, .game-btn, .llm-btn, .settings-btn');
      btns.forEach(function(btn) {
        btn.addEventListener('mouseenter', function() { gsap.to(this, { scale: 1.05, duration: 0.2, overwrite: 'auto' }); });
        btn.addEventListener('mouseleave', function() { gsap.to(this, { scale: 1, duration: 0.2, overwrite: 'auto' }); });
      });
    } catch(e) {}
  };

  // Game Start Transition
  ga.animateGameStart = function(cb) {
    if (hasGSAP()) {
      try {
        var tl = gsap.timeline({ onComplete: cb || function() {} });
        tl.to('#start-screen', { scale: 1.08, opacity: 0, duration: 0.5 });
        var panels = ['#timer', '.ui-top-right'];
        panels.forEach(function(sel) {
          var el = document.querySelector(sel);
          if (el) tl.fromTo(el, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.15');
        });
        return tl;
      } catch(e) {}
    }
    if (cb) setTimeout(cb, 100);
  };

  // Show Game UI panels (llm-panel, ai-text-box, leaderboard) on game start
  ga.showGameUI = function() {
    var els = [
      document.getElementById("top-status-bar"),
      document.getElementById("ui-layer"),
      document.getElementById("llm-panel"),
      document.getElementById("leaderboard-panel")
    ].filter(Boolean);
    if (els.length === 0) return;
    // Remove hidden class first
    els.forEach(function(el) { el.classList.remove("game-panel-hidden"); });
    // GSAP stagger animation
    if (typeof gsap !== "undefined" && gsap.to) {
      try {
        gsap.fromTo(els, 
          { opacity: 0, y: 15, visibility: "visible" },
          { opacity: 1, y: 0, visibility: "visible", duration: 0.45, stagger: 0.12, ease: "power2.out", overwrite: "auto" }
        );
      } catch(e) { 
        els.forEach(function(el) { el.style.opacity = "1"; el.style.visibility = "visible"; el.style.transform = "none"; });
      }
    } else {
      els.forEach(function(el) { el.style.opacity = "1"; el.style.visibility = "visible"; el.style.transform = "none"; });
    }
  };

  // Voice status animation - pulse when listening
  ga.animateVoiceListening = function(isListening) {
    var panel = document.getElementById("llm-panel");
    var status = document.getElementById("voice-status");
    if (!panel || !status) return;
    if (isListening) {
      panel.classList.add("listening");
      status.classList.add("active");
      if (typeof gsap !== "undefined" && gsap.to) {
        try { gsap.to(status, { textShadow: "0 0 12px rgba(0,255,136,0.5)", duration: 0.6, repeat: -1, yoyo: true, ease: "sine.inOut" }); } catch(e) {}
      }
    } else {
      panel.classList.remove("listening");
      status.classList.remove("active");
      if (typeof gsap !== "undefined" && gsap.TweenMax) { try { gsap.killTweensOf(status); } catch(e) {} }
      status.style.textShadow = "";
    }
  };

  // Voice command received animation
  ga.animateCommandReceived = function() {
    var el = document.getElementById("llm-command-display");
    if (!el || typeof gsap === "undefined" || !gsap.to) return;
    try {
      el.classList.add("received");
      gsap.fromTo(el, { scale: 0.95, opacity: 0.7 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.5)", onComplete: function() { el.classList.remove("received"); } });
    } catch(e) {}
  };

  // AI text box update animation
  ga.animateTextBoxUpdate = function(mood) {
    var container = document.getElementById("top-status-bar");
    var box = document.getElementById("ai-text-box");
    if (!container || !box) return;
    container.className = "top-status-bar game-panel-hidden";
    // Set mood class
    container.className = "ui-panel ai-text-box-container game-panel-hidden";
    if (mood === "positive") container.classList.add("mood-positive");
    else if (mood === "warning") container.classList.add("mood-warning");
    else if (mood === "danger") container.classList.add("mood-danger");
    if (typeof gsap !== "undefined" && gsap.to) {
      try {
        gsap.fromTo(box, { opacity: 0.5, y: -4 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
      } catch(e) { box.style.opacity = "1"; box.style.transform = "none"; }
    }
  };

  // Leaderboard entry highlight
  ga.animateNewLeaderboardEntry = function(entryEl) {
    if (!entryEl || typeof gsap === "undefined" || !gsap.fromTo) return;
    try {
      gsap.fromTo(entryEl, { opacity: 0, x: -10, scale: 0.95 }, { opacity: 1, x: 0, scale: 1, duration: 0.4, ease: "power2.out" });
    } catch(e) { entryEl.style.opacity = "1"; entryEl.style.transform = "none"; }
  };

  // Hover effects for game UI panels
  ga.initPanelHoverEffects = function() {
    if (typeof gsap === "undefined" || !gsap.to) return;
    try {
      var panels = ["#llm-panel", "#ai-text-box-container", ".leaderboard-panel"];
      panels.forEach(function(sel) {
        var el = document.querySelector(sel);
        if (!el) return;
        el.addEventListener("mouseenter", function() { gsap.to(this, { borderColor: "rgba(255,255,255,0.15)", duration: 0.3, overwrite: "auto" }); });
        el.addEventListener("mouseleave", function() { gsap.to(this, { borderColor: "", duration: 0.3, overwrite: "auto" }); });
      });
    } catch(e) {}
  };

  // Auto-init
  ga.init = function() {
    try {
      if (!document.getElementById('start-screen').classList.contains('hidden')) {
        ga.animateStartScreen();
      }
    } catch(e) {}
    try { ga.initHoverEffects(); } catch(e) {}
    try { ga.initPanelHoverEffects(); } catch(e) {}
  };

  setTimeout(ga.init, 300);
})();
