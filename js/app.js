// app.js — Controlador principal

// ─── Audio Context ────────────────────────────────────────────────────────────
let audioCtx = null;

function initAudio() {
  // Lazy init on first user interaction
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playConfirmSound() {
  try {
    if (!audioCtx) initAudio();
    const ctx = audioCtx;

    // Create a pleasant "pop/ding" sound
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, ctx.currentTime + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.12);
    osc2.start(ctx.currentTime + 0.05);
    osc2.stop(ctx.currentTime + 0.25);
  } catch (e) {
    // Audio not available, fail silently
  }
}

// ─── Navigation ───────────────────────────────────────────────────────────────
const VIEWS = ['tracker', 'simulator', 'history', 'dashboard'];
let currentView = 'tracker';

function navigateTo(view) {
  if (!VIEWS.includes(view)) return;

  // Init audio on first interaction
  initAudio();

  currentView = view;

  // Update view visibility
  VIEWS.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.toggle('hidden', v !== view);
  });

  // Update tab active state
  VIEWS.forEach(v => {
    const tab = document.getElementById(`tab-${v}`);
    if (tab) tab.classList.toggle('active', v === view);
  });

  // Render target view
  switch (view) {
    case 'tracker':
      TrackerView.render();
      break;
    case 'simulator':
      SimulatorView.render();
      break;
    case 'history':
      HistoryView.render();
      break;
    case 'dashboard':
      DashboardView.render();
      break;
  }
}

// ─── Global tick ──────────────────────────────────────────────────────────────
let tickInterval = null;

function startTick() {
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = setInterval(() => {
    if (currentView === 'tracker') {
      TrackerView.tick();
    }
    // Always update tab badge
    const orders = getActiveOrders();
    const tabBadge = document.getElementById('tab-tracker-badge');
    if (tabBadge) {
      tabBadge.textContent = orders.length;
      tabBadge.style.display = orders.length > 0 ? 'inline-flex' : 'none';
    }
  }, 1000);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Initial render
  navigateTo('tracker');
  startTick();

  // Keyboard shortcut: Escape to cancel confirm
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      TrackerView.cancelConfirm();
    }
  });
});
