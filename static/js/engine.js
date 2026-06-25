'use strict';

(function() {
  const CSS = `
:root {
  /* Midnight-velvet base — a deep, warm violet-black with real depth,
     a step up from the old flat slate-gray. */
  --bg-primary: #0a0713;
  --bg-deep: #06040d;
  --bg-card: #17111f;
  --bg-card-hover: #221830;
  --bg-elevated: #1c1528;

  /* Hero is gold; the neon accents drive the per-game identities. */
  --accent-gold: #ffd24a;
  --accent-amber: #f5a524;
  --accent-indigo: #6366f1;
  --accent-green: #2ee06a;
  --accent-red: #ff4d5e;
  --accent-purple: #a855f7;
  --accent-cyan: #22d3ee;
  --accent-pink: #f472d0;

  --text-primary: #f5f1ff;
  --text-secondary: #9d93b8;
  --text-faint: #6b6386;

  --line: rgba(255,255,255,0.07);
  --line-strong: rgba(255,255,255,0.14);

  --font-main: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;

  /* Signature gradients reused across buttons, titles, and cards. */
  --grad-gold: linear-gradient(135deg, #ffe27a, var(--accent-gold) 45%, var(--accent-amber));
  --grad-royal: linear-gradient(135deg, var(--accent-indigo), var(--accent-purple));

  --glow-subtle: 0 0 16px rgba(99,102,241,0.35);
  --glow-win: 0 0 26px rgba(46,224,106,0.55);
  --glow-gold: 0 0 26px rgba(255,210,74,0.55);
  --glow-indigo: 0 0 24px rgba(99,102,241,0.45);
  --glow-purple: 0 0 26px rgba(168,85,247,0.55);

  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-pill: 9999px;

  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  height: 100%;
  font-family: var(--font-main);
  color: var(--text-primary);
  background:
    radial-gradient(ellipse 90% 60% at 50% -8%, rgba(168,85,247,0.18), transparent 60%),
    radial-gradient(ellipse 70% 50% at 100% 0%, rgba(99,102,241,0.12), transparent 55%),
    radial-gradient(ellipse 80% 60% at 50% 108%, rgba(255,210,74,0.06), transparent 60%),
    var(--bg-primary);
  background-attachment: fixed;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}
body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.top-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  background: rgba(10,7,19,0.72);
  backdrop-filter: blur(16px) saturate(1.3);
  -webkit-backdrop-filter: blur(16px) saturate(1.3);
  border-bottom: 1px solid var(--line);
  box-shadow: 0 1px 0 rgba(255,210,74,0.10), 0 8px 24px rgba(0,0,0,0.35);
}
.top-bar .balance-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.top-bar .balance-label {
  font-size: 13px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.top-bar .balance-value {
  font-family: var(--font-mono);
  font-size: 19px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--accent-gold);
  text-shadow: 0 0 18px rgba(255,210,74,0.45);
  min-width: 80px;
  text-align: right;
}
.top-bar .stats-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 12px;
  color: var(--text-secondary);
}
.top-bar .stats-wrap .stat {
  display: flex;
  align-items: center;
  gap: 4px;
}
.top-bar .stats-wrap .streak {
  color: var(--accent-green);
  font-weight: 600;
}
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 24px;
  font-family: var(--font-main);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.01em;
  border: none;
  border-radius: var(--radius-pill);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.12s var(--ease), box-shadow 0.2s var(--ease), background 0.2s var(--ease), filter 0.2s var(--ease);
  min-height: 44px;
  min-width: 44px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
/* A soft diagonal sheen sweeps across filled buttons on hover. */
.btn::after {
  content: "";
  position: absolute;
  top: 0; left: -120%;
  width: 60%; height: 100%;
  background: linear-gradient(100deg, transparent, rgba(255,255,255,0.35), transparent);
  transform: skewX(-20deg);
  transition: left 0.55s var(--ease);
  pointer-events: none;
}
.btn:hover { transform: translateY(-2px); filter: brightness(1.06); }
.btn:hover::after { left: 130%; }
.btn:active {
  transform: translateY(0) scale(0.98);
}
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
  pointer-events: none;
}
.btn-primary {
  background: var(--grad-royal);
  color: #fff;
  box-shadow: 0 6px 20px rgba(99,102,241,0.45);
}
.btn-primary:hover {
  box-shadow: 0 10px 30px rgba(99,102,241,0.6);
}
.btn-gold {
  background: var(--grad-gold);
  color: #1a1004;
  box-shadow: 0 6px 20px rgba(255,210,74,0.4), inset 0 1px 0 rgba(255,255,255,0.5);
}
.btn-gold:hover {
  box-shadow: 0 10px 32px rgba(255,210,74,0.6), inset 0 1px 0 rgba(255,255,255,0.5);
}
.btn-green {
  background: linear-gradient(135deg, #4ef08a, var(--accent-green) 55%, #15a34a);
  color: #052e16;
  box-shadow: 0 6px 20px rgba(46,224,106,0.4), inset 0 1px 0 rgba(255,255,255,0.35);
}
.btn-green:hover {
  box-shadow: 0 10px 32px rgba(46,224,106,0.6), inset 0 1px 0 rgba(255,255,255,0.35);
}
.btn-red {
  background: linear-gradient(135deg, #ff6b78, var(--accent-red) 55%, #dc2626);
  color: #fff;
  box-shadow: 0 6px 20px rgba(255,77,94,0.4);
}
.btn-red:hover {
  box-shadow: 0 10px 32px rgba(255,77,94,0.6);
}
.btn-outline {
  background: transparent;
  color: var(--text-primary);
  border: 1.5px solid rgba(255,255,255,0.15);
}
.btn-outline:hover {
  border-color: var(--accent-indigo);
  box-shadow: 0 0 12px rgba(99,102,241,0.2);
}
.btn-sm {
  padding: 6px 16px;
  font-size: 13px;
  min-height: 36px;
}
.btn-lg {
  padding: 14px 32px;
  font-size: 17px;
  min-height: 52px;
}
.page {
  display: none;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 80px 16px 40px;
  animation: fadeSlideUp 0.3s ease forwards;
}
.page.active {
  display: flex;
  flex-direction: column;
  align-items: center;
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10% { transform: translateX(-6px); }
  20% { transform: translateX(6px); }
  30% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  50% { transform: translateX(-2px); }
  60% { transform: translateX(2px); }
}
@keyframes glow {
  0%, 100% { box-shadow: 0 0 8px var(--glow-color, rgba(255,215,0,0.3)); }
  50% { box-shadow: 0 0 24px var(--glow-color, rgba(255,215,0,0.6)); }
}
@keyframes pulseGold {
  0%, 100% { text-shadow: 0 0 8px rgba(255,215,0,0.3); }
  50% { text-shadow: 0 0 20px rgba(255,215,0,0.8); }
}
.shake { animation: shake 0.5s ease; }
.glow-pulse { animation: glow 0.8s ease 3; }
.pulse-gold { animation: pulseGold 0.6s ease 3; }
.game-title {
  font-size: 32px;
  font-weight: 900;
  text-align: center;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
  text-shadow: 0 0 30px currentColor;
}
.game-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 20px;
}
.bet-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}
.bet-row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}
.bet-input {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-card);
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-pill);
  padding: 4px 4px 4px 16px;
  transition: border-color 0.18s var(--ease), box-shadow 0.18s var(--ease);
}
.bet-input:focus-within {
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 3px rgba(255,210,74,0.16);
}
.bet-input input {
  width: 70px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  outline: none;
}
.bet-input input:focus {
  color: var(--accent-gold);
}
.bet-quick {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-pill);
  border: 1px solid rgba(255,255,255,0.1);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 36px;
}
.bet-quick:hover, .bet-quick.active {
  border-color: var(--accent-indigo);
  color: var(--text-primary);
  background: rgba(99,102,241,0.15);
}
.result-display {
  width: 100%;
  text-align: center;
  padding: 16px;
  margin-top: 8px;
  border-radius: var(--radius-md);
  min-height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}
.result-display .result-text {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
}
.result-display .result-sub {
  font-size: 13px;
  color: var(--text-secondary);
}
.result-display.win {
  background: rgba(46,224,106,0.10);
  border: 1px solid rgba(46,224,106,0.35);
  box-shadow: var(--glow-win);
}
.result-display.win .result-text { color: var(--accent-green); }
.result-display.lose {
  background: rgba(255,77,94,0.10);
  border: 1px solid rgba(255,77,94,0.32);
  box-shadow: 0 0 24px rgba(255,77,94,0.18);
}
.result-display.lose .result-text { color: var(--accent-red); }
.result-display.push {
  background: rgba(157,147,184,0.08);
  border: 1px solid rgba(157,147,184,0.22);
}
.result-display.jackpot {
  background: rgba(255,210,74,0.14);
  border: 1px solid rgba(255,210,74,0.4);
  box-shadow: 0 0 40px rgba(255,210,74,0.3);
}
.result-display.jackpot .result-text {
  color: var(--accent-gold);
  text-shadow: 0 0 22px rgba(255,210,74,0.6);
}
.back-btn {
  position: fixed;
  top: 60px;
  left: 12px;
  z-index: 99;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(23,17,31,0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--line-strong);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  text-decoration: none;
  font-size: 18px;
  transition: transform 0.2s var(--ease), background 0.2s var(--ease), border-color 0.2s var(--ease);
}
.back-btn:hover {
  background: var(--bg-card-hover);
  border-color: var(--accent-gold);
  transform: translateX(-2px);
}
#game-over-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 200;
  background:
    radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,77,94,0.12), transparent 70%),
    rgba(6,4,13,0.88);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 20px;
}
#game-over-overlay.active {
  display: flex;
}
#game-over-overlay h2 {
  font-size: 44px;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: var(--accent-red);
  text-shadow: 0 0 36px rgba(255,77,94,0.65);
}
#game-over-overlay p {
  font-size: 16px;
  color: var(--text-secondary);
  text-align: center;
  max-width: 280px;
}
@media (max-width: 480px) {
  .page { padding: 72px 12px 32px; }
  .game-title { font-size: 24px; }
  .top-bar { padding: 10px 12px; }
  .top-bar .balance-value { font-size: 16px; min-width: 60px; }
  .top-bar .stats-wrap { font-size: 11px; gap: 10px; }
  .back-btn { top: 56px; left: 8px; width: 36px; height: 36px; font-size: 16px; }
}
`;

  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  window.CasinoEngine = {};

  // ===========================
  // Constants
  // ===========================
  const MIN_BET = 5;

  // ===========================
  // GameState (UI mirror)
  // ===========================
  const GameState = {
    balance: 1000,
    streak: 0,
    wins: 0,
    losses: 0,
    currentGame: '',

    setFromData: function(data) {
      if (data.tokens !== undefined) this.balance = data.tokens;
      if (data.stats) {
        this.streak = data.stats.streak || 0;
        this.wins = data.stats.wins || 0;
        this.losses = data.stats.losses || 0;
      }
      this.updateUI();
    },

    setBalance: function(val) {
      this.balance = val;
      this.updateUI();
    },

    setStats: function(stats) {
      if (stats) {
        this.streak = stats.streak || 0;
        this.wins = stats.wins || 0;
        this.losses = stats.losses || 0;
      }
      this.updateUI();
    },

    checkGameOver: function() {
      if (this.balance < MIN_BET) {
        const overlay = document.getElementById('game-over-overlay');
        if (overlay) overlay.classList.add('active');
        return true;
      }
      return false;
    },

    updateUI: function() {
      const els = document.querySelectorAll('.balance-value');
      els.forEach(function(el) {
        animateBalance(el, GameState.balance);
      });
      const streaks = document.querySelectorAll('.stat-streak');
      streaks.forEach(function(el) {
        el.textContent = GameState.streak;
        el.style.color = GameState.streak >= 3 ? '#22c55e' : GameState.streak >= 1 ? '#f59e0b' : '#8b949e';
      });
      const winEls = document.querySelectorAll('.stat-wins');
      winEls.forEach(function(el) { el.textContent = GameState.wins; });
      const lossEls = document.querySelectorAll('.stat-losses');
      lossEls.forEach(function(el) { el.textContent = GameState.losses; });
    }
  };

  window.CasinoEngine.GameState = GameState;
  window.CasinoEngine.MIN_BET = MIN_BET;

  // ===========================
  // API client
  // ===========================
  async function postJSON(url, body) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'same-origin',
    });
    try { return await r.json(); } catch (e) { return { ok: false, error: 'Bad response.' }; }
  }

  async function getJSON(url) {
    const r = await fetch(url, { credentials: 'same-origin' });
    try { return await r.json(); } catch (e) { return { ok: false, error: 'Bad response.' }; }
  }

  window.CasinoEngine.API = {
    getMe: async function() {
      return getJSON('/api/me');
    },

    getBalance: async function() {
      return getJSON('/api/balance');
    },

    getStats: async function() {
      return getJSON('/api/stats');
    },

    placeBet: async function(game, amount) {
      return postJSON('/api/bet', { game: game, amount: amount });
    },

    recordWin: async function(betId, payout) {
      return postJSON('/api/win', { bet_id: betId, payout: payout });
    },

    recordLoss: async function(betId) {
      return postJSON('/api/loss', { bet_id: betId });
    },

    resetTokens: async function() {
      return postJSON('/api/reset_tokens', {});
    },

    logout: async function() {
      return postJSON('/api/logout', {});
    },

    settings: async function(data) {
      return postJSON('/api/user/settings', data);
    },

    profileImage: async function(data) {
      return postJSON('/api/user/profile_image', data);
    },

    profileImageRemove: async function(which) {
      return postJSON('/api/user/profile_image/remove', { which: which });
    },

    admin: {
      users: async function() { return getJSON('/api/admin/users'); },
      stats: async function() { return getJSON('/api/admin/stats'); },
      config: async function() { return getJSON('/api/admin/config'); },
      saveConfig: async function(config) { return postJSON('/api/admin/config', { config: config }); },
      userRole: async function(username, role) { return postJSON('/api/admin/user_role', { username: username, role: role }); },
      adjustTokens: async function(username, amount) { return postJSON('/api/admin/adjust_tokens', { username: username, amount: amount }); },
    }
  };

  // ===========================
  // Balance Animation
  // ===========================
  function animateBalance(element, target) {
    const current = parseInt(element.dataset.value) || 0;
    if (current === target) { element.textContent = '$' + target; return; }
    const steps = Math.min(Math.abs(target - current), 30);
    const stepSize = (target - current) / steps;
    let i = 0;
    const interval = setInterval(function() {
      i++;
      if (i >= steps) {
        clearInterval(interval);
        element.textContent = '$' + target;
        element.dataset.value = target;
        element.style.color = target > current ? '#22c55e' : '#ef4444';
        setTimeout(function() { element.style.color = ''; }, 500);
      } else {
        const val = Math.round(current + stepSize * i);
        element.textContent = '$' + val;
      }
    }, 30);
  }

  window.CasinoEngine.animateBalance = animateBalance;

  // ===========================
  // SoundEngine
  // ===========================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = true;
      } catch(e) { /* no audio */ }
    }

    _ensureCtx() {
      if (!this.initialized) this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    _osc(type, freq, duration, volume) {
      if (volume === undefined) volume = 0.15;
      this._ensureCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration);
    }

    _sweep(type, fromFreq, toFreq, duration, volume) {
      if (volume === undefined) volume = 0.12;
      this._ensureCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(fromFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(toFreq, this.ctx.currentTime + duration);
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration);
    }

    _arpeggio(notes, duration, volume) {
      if (volume === undefined) volume = 0.12;
      this._ensureCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      notes.forEach(function(freq, i) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * duration);
        gain.gain.setValueAtTime(volume, now + i * duration);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * duration + duration * 2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * duration);
        osc.stop(now + i * duration + duration * 2);
      }, this);
    }

    click() { this._osc('square', 800, 0.05, 0.08); }
    flip() { this._sweep('sine', 300, 600, 0.08, 0.06); }
    reveal() { this._sweep('sine', 400, 800, 0.1, 0.08); }
    drop() { this._osc('triangle', 1200, 0.03, 0.04); }
    tick() { this._osc('sine', 800, 0.02, 0.05); }
    spinStart() { this._sweep('sawtooth', 200, 400, 0.5, 0.06); }
    spinStop() { this._sweep('sine', 400, 100, 0.15, 0.08); }
    cashOut() { this._arpeggio([523, 659, 784], 0.08, 0.08); }
    win() { this._arpeggio([523, 659, 784, 1047], 0.1, 0.1); }
    lose() { this._sweep('sine', 400, 200, 0.25, 0.08); }
    jackpot() {
      this._arpeggio([523, 659, 784, 1047, 1319, 1568], 0.08, 0.12);
      setTimeout(function() {
        this._arpeggio([1047, 1319, 1568, 2093], 0.1, 0.15);
      }.bind(this), 600);
    }
    explosion() { this._sweep('sawtooth', 200, 40, 0.3, 0.12); }
    bigWin() { this._arpeggio([392, 523, 659, 784, 1047], 0.1, 0.12); }
  }

  window.CasinoEngine.SoundEngine = SoundEngine;
  window.CasinoEngine.sound = new SoundEngine();

  // ===========================
  // ParticleSystem (Confetti)
  // ===========================
  class ParticleSystem {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas ? canvas.getContext('2d') : null;
      this.particles = [];
      this.animId = null;
      this._resize();
    }

    _resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999;';
    }

    burst(count, colors) {
      if (colors === undefined) colors = ['#ffd700','#22c55e','#6366f1','#f59e0b','#ec4899','#ef4444','#7c3aed','#06b6d4'];
      if (count === undefined) count = 60;
      if (!this.ctx) {
        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this._resize();
        window.addEventListener('resize', function() { this._resize(); }.bind(this));
      }
      const w = this.canvas.width, h = this.canvas.height;
      for (let i = 0; i < count; i++) {
        const size = 4 + Math.random() * 8;
        this.particles.push({
          x: w / 2 + (Math.random() - 0.5) * w * 0.5,
          y: h * 0.3 + Math.random() * h * 0.2,
          vx: (Math.random() - 0.5) * 12,
          vy: -Math.random() * 14 - 2,
          size: size,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1,
          decay: 0.008 + Math.random() * 0.012,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 8,
        });
      }
      if (!this.animId) this._animate();
    }

    _animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      let alive = false;
      for (const p of this.particles) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.vy += 0.3;
        p.y += p.vy;
        p.life -= p.decay;
        p.rotation += p.rotSpeed;
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation * Math.PI / 180);
        this.ctx.globalAlpha = Math.max(0, p.life);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        this.ctx.restore();
      }
      if (alive) {
        this.animId = requestAnimationFrame(function() { this._animate(); }.bind(this));
      } else {
        this.animId = null;
        this.particles = [];
        if (this.canvas && this.canvas.parentNode) {
          this.canvas.parentNode.removeChild(this.canvas);
          this.canvas = null;
          this.ctx = null;
        }
      }
    }
  }

  window.CasinoEngine.ParticleSystem = ParticleSystem;

  // ===========================
  // UI Helpers
  // ===========================
  function renderDeck() {
    const suits = ['♠','♥','♣','♦'];
    const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const deck = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit: suit, rank: rank, value: ranks.indexOf(rank) + 2 });
      }
    }
    return deck;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function cardHTML(card, faceDown) {
    if (faceDown === undefined) faceDown = false;
    if (faceDown) {
      return '<div class="card card-back"><div class="card-inner"><div class="card-face card-back-pattern">?</div></div></div>';
    }
    const isRed = card.suit === '♥' || card.suit === '♦';
    return '<div class="card"><div class="card-inner"><div class="card-face" style="color:' + (isRed ? '#ef4444' : '#f0f6fc') + '"><span class="card-rank">' + card.rank + '</span><span class="card-suit">' + card.suit + '</span></div></div></div>';
  }

  function createCardElement(card, faceDown) {
    if (faceDown === undefined) faceDown = false;
    const div = document.createElement('div');
    div.className = faceDown ? 'card card-back' : 'card';
    div.innerHTML = '<div class="card-inner"><div class="card-face">' +
      (faceDown ? '<span class="card-back-design">?</span>' :
        '<span class="card-rank">' + card.rank + '</span><span class="card-suit">' + card.suit + '</span>') +
      '</div></div>';
    if (!faceDown) {
      const isRed = card.suit === '♥' || card.suit === '♦';
      div.querySelector('.card-face').style.color = isRed ? '#ef4444' : '#f0f6fc';
    }
    return div;
  }

  window.CasinoEngine.renderDeck = renderDeck;
  window.CasinoEngine.shuffle = shuffle;
  window.CasinoEngine.cardHTML = cardHTML;
  window.CasinoEngine.createCardElement = createCardElement;
  window.CasinoEngine.MIN_BET = MIN_BET;

  // Init from injected data if available
  if (window.__APP__) {
    GameState.setFromData(window.__APP__);
  }
})();
