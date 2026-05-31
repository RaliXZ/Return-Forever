/* ============================================================
 * 音效系统 — Web Audio API 合成 8-bit 风格音效 + MP3 背景音乐
 *
 * 短音效：用 OscillatorNode 实时合成
 * BGM / 通关音乐：使用 assets/audio/ 下的 MP3 文件
 * 挂载点：window.game.audio
 * ============================================================ */

window.game = window.game || {};
window.game.audio = {
  _ctx: null,
  volume: 0.7,
  _supported: false,

  // === MP3 播放器（BGM / 通关音乐）===
  _bgmAudio: null,
  _winAudio: null,

  _init() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this._supported = false; return; }
      this._ctx = new AC();
      this._supported = true;
    } catch (e) {
      this._supported = false;
    }
  },

  _ensureContext() {
    if (!this._ctx) this._init();
    if (!this._supported) return false;
    if (this._ctx.state === 'suspended') {
      try { this._ctx.resume(); } catch(e) {}
    }
    return true;
  },

  _playTone(freq, duration, type, gainVal) {
    if (!this._ensureContext()) return;
    try {
      var osc = this._ctx.createOscillator();
      var gain = this._ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, this._ctx.currentTime);
      gain.gain.setValueAtTime((gainVal || 0.3) * Math.min(this.volume * 1.5, 1.0), this._ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this._ctx.destination);
      osc.start();
      osc.stop(this._ctx.currentTime + duration);
    } catch(e) {}
  },

  _playSweep(startFreq, endFreq, duration, type, gainVal) {
    if (!this._ensureContext()) return;
    try {
      var osc = this._ctx.createOscillator();
      var gain = this._ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(startFreq, this._ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, this._ctx.currentTime + duration);
      gain.gain.setValueAtTime((gainVal || 0.3) * Math.min(this.volume * 1.5, 1.0), this._ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this._ctx.destination);
      osc.start();
      osc.stop(this._ctx.currentTime + duration);
    } catch(e) {}
  },

    /** 行走音效：短促数字点击 700Hz 方波 */
  playStep() { this._playTone(700, 0.04, "square", 0.35); },

  /** 跳跃音效：短上升音阶 240→480Hz */
  playJump() { this._playSweep(240, 480, 0.1, 'square', 0.2); },

  /** 着陆音效：短低音冲击 150Hz */
  playLand() { this._playTone(150, 0.05, 'sine', 0.25); },

  /** 死亡音效：下降滑音 400→80Hz */
  playDeath() { this._playSweep(400, 80, 0.3, 'sawtooth', 0.3); },

  /** 通关音效：播放 win.mp3 */
  playWin() {
    // 停止背景音乐
    this.stopBGM();
    // 播放通关音乐
    try {
      if (!this._winAudio) {
        this._winAudio = new Audio('assets/audio/win.mp3');
      } else {
        this._winAudio.currentTime = 0;
      }
      this._winAudio.volume = Math.min(this.volume * 1.2, 1.0);
      this._winAudio.play().catch(function(e){});
    } catch(e) {}
  },

  /** 语音指令提示音：双音 600+900Hz */
  playCommand() {
    this._playTone(600, 0.08, 'sine', 0.15);
    var self = this;
    setTimeout(function() { self._playTone(900, 0.08, 'sine', 0.15); }, 60);
  },

  // --- BGM 系统 ---

  /** 启动背景音乐 — 播放 background.mp3 并循环 */
  startBGM() {
    // 先停止旧的 BGM
    this.stopBGM();
    try {
      if (!this._bgmAudio) {
        this._bgmAudio = new Audio('assets/audio/background.mp3');
        this._bgmAudio.loop = true;
      }
      this._bgmAudio.volume = Math.min(this.volume * 0.5, 1.0);
      // 确保 AudioContext 已激活（部分浏览器限制）
      this._ensureContext();
      this._bgmAudio.play().catch(function(e){});
    } catch(e) {}
  },

  /** 暂停背景音乐 */
  pauseBGM() {
    if (!this._bgmAudio || this._bgmAudio.paused) return;
    try { this._bgmAudio.pause(); } catch(e) {}
  },

  /** 恢复背景音乐 */
  resumeBGM() {
    if (!this._bgmAudio) return;
    try {
      this._ensureContext();
      this._bgmAudio.play().catch(function(e){});
    } catch(e) {}
  },

  /** 停止背景音乐，淡出 500ms */
  stopBGM() {
    if (!this._bgmAudio) return;
    try {
      var audio = this._bgmAudio;
      var vol = audio.volume;
      // 快速淡出
      var steps = 10;
      var stepDuration = 50;
      for (var i = 0; i < steps; i++) {
        (function(fadeStep) {
          setTimeout(function() {
            audio.volume = vol * (1 - fadeStep / steps);
            if (fadeStep === steps - 1) {
              audio.pause();
              audio.currentTime = 0;
              audio.volume = vol;
            }
          }, fadeStep * stepDuration);
        })(i);
      }
    } catch(e) {}
  },

};

