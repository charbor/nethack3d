import { MAP_W, MAP_H } from './config.js';
import { player, gameState } from './state.js';
import { getMap, getStairX, getStairZ, getUpStairX, getUpStairZ } from './world.js';
import { monsters } from './monsters.js';
import { canvas as glCanvas } from './renderer.js';
import { enterFallback, setHint } from './input.js';

const elMap     = document.getElementById('map');
const mapCanvas = document.getElementById('mapCanvas');
const ctx       = mapCanvas.getContext('2d');
const levelEl   = elMap.querySelector('.map-level');

const TILE = 7;  /* pixels per tile */
const SIGHT = 8; /* exploration radius in tiles */

/* Fog of war — reset on level change */
let explored = null;

export function resetExplored() {
  explored = Array.from({ length: MAP_H }, () => new Uint8Array(MAP_W));
}
resetExplored();

/* Call each frame from main loop to reveal tiles around the player */
export function updateExplored() {
  if (!explored || !player.pos) return;
  const px = Math.floor(player.pos.x);
  const pz = Math.floor(player.pos.z);
  const r = SIGHT;
  const r2 = r * r;
  for (let dz = -r; dz <= r; dz++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dz * dz > r2) continue;
      const x = px + dx, z = pz + dz;
      if (x >= 0 && x < MAP_W && z >= 0 && z < MAP_H) {
        explored[z][x] = 1;
      }
    }
  }
}

function renderMap() {
  const map = getMap();
  if (!map || !explored) return;

  mapCanvas.width  = MAP_W * TILE;
  mapCanvas.height = MAP_H * TILE;

  /* Scale to fit on screen */
  const maxPx = Math.min(window.innerWidth * 0.85, window.innerHeight * 0.65);
  const scale  = maxPx / Math.max(mapCanvas.width, mapCanvas.height);
  mapCanvas.style.width  = Math.floor(mapCanvas.width  * scale) + 'px';
  mapCanvas.style.height = Math.floor(mapCanvas.height * scale) + 'px';

  levelEl.textContent = 'Dungeon Level ' + gameState.dungeonLevel;

  /* Background — unexplored is black */
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

  /* Draw only explored tiles */
  for (let z = 0; z < MAP_H; z++) {
    for (let x = 0; x < MAP_W; x++) {
      if (!explored[z][x]) continue;
      const v = map[z][x];
      if (v === 1) {
        ctx.fillStyle = '#1c1a16';
        ctx.fillRect(x * TILE, z * TILE, TILE, TILE);
      } else if (v === 2) {
        ctx.fillStyle = '#0a1a2a';
        ctx.fillRect(x * TILE, z * TILE, TILE, TILE);
        ctx.fillStyle = '#0e2438';
        ctx.fillRect(x * TILE + 1, z * TILE + 1, TILE - 2, TILE - 2);
      } else {
        ctx.fillStyle = '#2a2520';
        ctx.fillRect(x * TILE, z * TILE, TILE, TILE);
        ctx.fillStyle = '#322c26';
        ctx.fillRect(x * TILE + 1, z * TILE + 1, TILE - 2, TILE - 2);
      }
    }
  }

  ctx.font = 'bold ' + (TILE - 1) + 'px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  /* Down stairs (only if explored) */
  const sx = getStairX(), sz = getStairZ();
  if (explored[sz] && explored[sz][sx]) {
    ctx.fillStyle = '#ffcc33';
    ctx.fillRect(sx * TILE + 1, sz * TILE + 1, TILE - 2, TILE - 2);
    ctx.fillStyle = '#000';
    ctx.fillText('>', sx * TILE + TILE / 2, sz * TILE + TILE / 2 + 1);
  }

  /* Up stairs (only if explored) */
  const ux = getUpStairX(), uz = getUpStairZ();
  if (ux >= 0 && explored[uz] && explored[uz][ux]) {
    ctx.fillStyle = '#33ccff';
    ctx.fillRect(ux * TILE + 1, uz * TILE + 1, TILE - 2, TILE - 2);
    ctx.fillStyle = '#000';
    ctx.fillText('<', ux * TILE + TILE / 2, uz * TILE + TILE / 2 + 1);
  }

  /* Monsters (only if in explored area) */
  for (const m of monsters) {
    if (m.dead) continue;
    const mx = Math.floor(m.x), mz = Math.floor(m.z);
    if (!explored[mz] || !explored[mz][mx]) continue;
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(mx * TILE + 1, mz * TILE + 1, TILE - 2, TILE - 2);
  }

  /* Player */
  if (player.pos) {
    const px = Math.floor(player.pos.x), pz = Math.floor(player.pos.z);
    ctx.fillStyle = '#ffee00';
    ctx.fillRect(px * TILE, pz * TILE, TILE, TILE);
    ctx.fillStyle = '#000';
    ctx.font = 'bold ' + (TILE) + 'px monospace';
    ctx.fillText('@', px * TILE + TILE / 2, pz * TILE + TILE / 2 + 1);
  }
}

export function toggleMap() {
  if (!gameState.started) return;
  gameState.mapOpen = !gameState.mapOpen;
  if (gameState.mapOpen) {
    if (gameState.locked) document.exitPointerLock();
    renderMap();
    elMap.style.display = 'flex';
  } else {
    elMap.style.display = 'none';
    if (!gameState.fallbackMode) {
      const req = glCanvas.requestPointerLock();
      if (req && typeof req.catch === 'function') req.catch(() => enterFallback());
      else setTimeout(() => { if (!gameState.locked) enterFallback(); }, 300);
    } else {
      gameState.mouseActive = true;
      setHint('click to release mouse');
    }
  }
}

document.addEventListener('keydown', e => {
  if (e.code === 'KeyM' && gameState.started && !gameState.inventoryOpen) {
    toggleMap();
  }
  if (e.code === 'Escape' && gameState.mapOpen) {
    gameState.mapOpen = false;
    elMap.style.display = 'none';
  }
});
