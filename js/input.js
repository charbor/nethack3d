import { player, gameState } from './state.js';
import { canvas } from './renderer.js';

export const keys = new Set();
document.addEventListener('keydown', e => keys.add(e.code));
document.addEventListener('keyup',   e => keys.delete(e.code));

const elOverlay = document.getElementById('overlay');
const elPaused  = document.getElementById('paused');
const elHint    = document.getElementById('hint');

export function setHint(text) {
  elHint.textContent   = text;
  elHint.style.display = text ? 'block' : 'none';
}

export function enterFallback() {
  if (gameState.fallbackMode) return;
  gameState.fallbackMode = true;
  gameState.mouseActive  = true;
  setHint('click to release mouse');
}

/* Real pointer lock events */
document.addEventListener('pointerlockchange', () => {
  gameState.locked = document.pointerLockElement === canvas;
  if (!gameState.fallbackMode && !gameState.inventoryOpen && !gameState.mapOpen) {
    elOverlay.style.display = (!gameState.locked && !gameState.started) ? 'flex' : 'none';
    elPaused.style.display  = (!gameState.locked &&  gameState.started) ? 'flex' : 'none';
  }
});
document.addEventListener('pointerlockerror', () => {
  if (gameState.started) enterFallback();
});

document.addEventListener('mousemove', e => {
  if ((!gameState.locked && !gameState.mouseActive) || gameState.inventoryOpen || gameState.mapOpen) return;
  const s = 0.0018;
  player.yaw   -= e.movementX * s;
  player.pitch  = Math.max(-1.45, Math.min(1.45, player.pitch - e.movementY * s));
});

export function startGame() {
  gameState.started = true;
  const req = canvas.requestPointerLock();
  if (req && typeof req.catch === 'function') {
    req.catch(() => enterFallback());
  } else {
    setTimeout(() => { if (!gameState.locked) enterFallback(); }, 300);
  }
}

export function resumeGame() {
  if (!gameState.started) return;
  if (gameState.fallbackMode) {
    gameState.mouseActive = true;
    setHint('click to release mouse');
    elPaused.style.display = 'none';
  } else {
    elPaused.style.display = 'none';
    const req = canvas.requestPointerLock();
    if (req && typeof req.catch === 'function') {
      req.catch(() => enterFallback());
    } else {
      setTimeout(() => { if (!gameState.locked) enterFallback(); }, 300);
    }
  }
}

canvas.addEventListener('click', () => {
  if (!gameState.started || gameState.inventoryOpen) return;
  if (gameState.fallbackMode) {
    gameState.mouseActive = !gameState.mouseActive;
    setHint(gameState.mouseActive ? 'click to release mouse' : 'click to capture mouse');
    elPaused.style.display = gameState.mouseActive ? 'none' : 'flex';
  } else if (!gameState.locked) {
    canvas.requestPointerLock();
  }
});

elPaused.addEventListener('click', (e) => {
  e.stopPropagation();
  resumeGame();
});
elPaused.style.cursor = 'pointer';

/* Esc in fallback mode */
document.addEventListener('keydown', e => {
  if (e.code === 'Escape' && gameState.fallbackMode && gameState.mouseActive && !gameState.inventoryOpen) {
    gameState.mouseActive = false;
    setHint('click to capture mouse');
    elPaused.style.display = 'flex';
  }
});
