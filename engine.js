'use strict';

(function() {
  const CSS = `
:root {
  --bg-primary: #0d1117;
  --bg-card: #161b22;
  --bg-card-hover: #1c2333;
  --accent-gold: #ffd700;
  --accent-amber: #f59e0b;
  --accent-indigo: #6366f1;
  --accent-green: #22c55e;
  --accent-red: #ef4444;
  --accent-purple: #7c3aed;
  --accent-cyan: #06b6d4;
  --accent-pink: #ec4899;
  --text-primary: #f0f6fc;
  --text-secondary: #8b949e;
  --font-main: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --glow-subtle: 0 0 12px rgba(99,102,241,0.3);
  --glow-win: 0 0 20px rgba(34,197,94,0.5);
  --glow-gold: 0 0 20px rgba(255,215,0,0.5);
  --glow-indigo: 0 0 20px rgba(99,102,241,0.4);
  --glow-purple: 0 0 20px rgba(124,58,237,0.5);
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-pill: 9999px;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  height: 100%;
  font-family: var(--font-main);
  background: var(--bg-primary);
  color: var(--text-primary);
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
  padding: 12px 16px;
  background: rgba(13,17,23,0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
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
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--accent-gold);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 24px;
  font-family: var(--font-main);
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.2s ease, background 0.2s ease;
  min-height: 44px;
  min-width: 44px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.btn:active {
  transform: scale(0.97);
}
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
  pointer-events: none;
}
.btn-primary {
  background: linear-gradient(135deg, var(--accent-indigo), #4f46e5);
  color: #fff;
  box-shadow: 0 4px 14px rgba(99,102,241,0.35);
}
.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(99,102,241,0.5);
}
.btn-gold {
  background: linear-gradient(135deg, var(--accent-gold), #f59e0b);
  color: #0d1117;
  box-shadow: 0 4px 14px rgba(255,215,0,0.35);
}
.btn-gold:hover {
  box-shadow: 0 6px 20px rgba(255,215,0,0.5);
}
.btn-green {
  background: linear-gradient(135deg, var(--accent-green), #16a34a);
  color: #fff;
  box-shadow: 0 4px 14px rgba(34,197,94,0.35);
}
.btn-green:hover {
  box-shadow: 0 6px 20px rgba(34,197,94,0.5);
}
.btn-red {
  background: linear-gradient(135deg, var(--accent-red), #dc2626);
  color: #fff;
  box-shadow: 0 4px 14px rgba(239,68,68,0.35);
}
.btn-red:hover {
  box-shadow: 0 6px 20px rgba(239,68,68,0.5);
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
  font-size: 28px;
  font-weight: 800;
  text-align: center;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
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
  border: 1.5px solid rgba(255,255,255,0.08);
  border-radius: var(--radius-pill);
  padding: 4px 4px 4px 16px;
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
  background: rgba(34,197,94,0.08);
  border: 1px solid rgba(34,197,94,0.2);
}
.result-display.lose {
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
}
.result-display.push {
  background: rgba(139,148,158,0.08);
  border: 1px solid rgba(139,148,158,0.2);
}
.result-display.jackpot {
  background: rgba(255,215,0,0.12);
  border: 1px solid rgba(255,215,0,0.3);
  box-shadow: 0 0 30px rgba(255,215,0,0.15);
}
.back-btn {
  position: fixed;
  top: 60px;
  left: 12px;
  z-index: 99;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  text-decoration: none;
  font-size: 18px;
  transition: all 0.2s ease;
}
.back-btn:hover {
  background: var(--bg-card-hover);
  border-color: var(--accent-indigo);
}
#game-over-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 20px;
}
#game-over-overlay.active {
  display: flex;
}
#game-over-overlay h2 {
  font-size: 32px;
  color: var(--accent-red);
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
  // GameState
  // ===========================
  const STORAGE_KEY = 'casino_state';
  const INITIAL_BALANCE = 1000;
  const MIN_BET = 5;

  const GameState = {
    balance: INITIAL_BALANCE,
    streak: 0,
    wins: 0,
    losses: 0,
    currentGame: '',

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          this.balance = data.balance ?? INITIAL_BALANCE;
          this.streak = data.streak ?? 0;
          this.wins = data.wins ?? 0;
          this.losses = data.losses ?? 0;
        }
      } catch(e) { /* ignore corrupt data */ }
      return this;
    },

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          balance: this.balance,
          streak: this.streak,
          wins: this.wins,
          losses: this.losses,
        }));
      } catch(e) { /* storage full, ignore */ }
    },

    placeBet(amount) {
      amount = Math.floor(amount);
      if (amount < MIN_BET || amount > this.balance) return false;
      this.balance -= amount;
      this.save();
      this.updateUI();
      return true;
    },

    addWin(amount, increaseStreak = true) {
      this.balance += amount;
      if (increaseStreak) this.streak++;
      else this.streak = 0;
      this.wins++;
      this.save();
      this.updateUI();
    },

    addLoss() {
      this.streak = 0;
      this.losses++;
      this.save();
      this.updateUI();
    },

    addPush() {
      this.save();
      this.updateUI();
    },

    reset() {
      this.balance = INITIAL_BALANCE;
      this.streak = 0;
      this.wins = 0;
      this.losses = 0;
      this.save();
      this.updateUI();
    },

    checkGameOver() {
      if (this.balance < MIN_BET) {
        const overlay = document.getElementById('game-over-overlay');
        if (overlay) overlay.classList.add('active');
        return true;
      }
      return false;
    },

    updateUI() {
      const els = document.querySelectorAll('.balance-value');
      els.forEach(el => {
        animateBalance(el, this.balance);
      });
      const streaks = document.querySelectorAll('.stat-streak');
      streaks.forEach(el => {
        el.textContent = this.streak;
        el.style.color = this.streak >= 3 ? '#22c55e' : this.streak >= 1 ? '#f59e0b' : '#8b949e';
      });
      const winEls = document.querySelectorAll('.stat-wins');
      winEls.forEach(el => { el.textContent = this.wins; });
      const lossEls = document.querySelectorAll('.stat-losses');
      lossEls.forEach(el => { el.textContent = this.losses; });
    }
  };

  window.CasinoEngine.GameState = GameState;

  // ===========================
  // Balance Animation
  // ===========================
  function animateBalance(element, target) {
    const current = parseInt(element.dataset.value) || 0;
    if (current === target) { element.textContent = '$' + target; return; }
    const steps = Math.min(Math.abs(target - current), 30);
    const stepSize = (target - current) / steps;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i >= steps) {
        clearInterval(interval);
        element.textContent = '$' + target;
        element.dataset.value = target;
        element.style.color = target > current ? '#22c55e' : '#ef4444';
        setTimeout(() => { element.style.color = ''; }, 500);
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

    _osc(type, freq, duration, volume = 0.15) {
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

    _sweep(type, fromFreq, toFreq, duration, volume = 0.12) {
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

    _arpeggio(notes, duration, volume = 0.12) {
      this._ensureCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      notes.forEach((freq, i) => {
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
      });
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
      setTimeout(() => {
        this._arpeggio([1047, 1319, 1568, 2093], 0.1, 0.15);
      }, 600);
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

    burst(count = 60, colors = ['#ffd700','#22c55e','#6366f1','#f59e0b','#ec4899','#ef4444','#7c3aed','#06b6d4']) {
      if (!this.ctx) {
        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this._resize();
        window.addEventListener('resize', () => this._resize());
      }
      const w = this.canvas.width, h = this.canvas.height;
      for (let i = 0; i < count; i++) {
        const size = 4 + Math.random() * 8;
        this.particles.push({
          x: w / 2 + (Math.random() - 0.5) * w * 0.5,
          y: h * 0.3 + Math.random() * h * 0.2,
          vx: (Math.random() - 0.5) * 12,
          vy: -Math.random() * 14 - 2,
          size,
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
        this.animId = requestAnimationFrame(() => this._animate());
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
        deck.push({ suit, rank, value: ranks.indexOf(rank) + 2 });
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

  function cardHTML(card, faceDown = false) {
    if (faceDown) {
      return `<div class="card card-back"><div class="card-inner"><div class="card-face card-back-pattern">?</div></div></div>`;
    }
    const isRed = card.suit === '♥' || card.suit === '♦';
    return `<div class="card"><div class="card-inner"><div class="card-face" style="color:${isRed ? '#ef4444' : '#f0f6fc'}"><span class="card-rank">${card.rank}</span><span class="card-suit">${card.suit}</span></div></div></div>`;
  }

  function createCardElement(card, faceDown = false) {
    const div = document.createElement('div');
    div.className = faceDown ? 'card card-back' : 'card';
    div.innerHTML = `<div class="card-inner"><div class="card-face">${
      faceDown ? '<span class="card-back-design">?</span>' :
      `<span class="card-rank">${card.rank}</span><span class="card-suit">${card.suit}</span>`
    }</div></div>`;
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
  window.CasinoEngine.INITIAL_BALANCE = INITIAL_BALANCE;

  // ===========================
  // Init
  // ===========================
  GameState.load();
  GameState.updateUI();

})();
