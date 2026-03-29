import { SPEED, SPRINT, RADIUS, EYE_H } from './config.js';
import { character, player, gameState } from './state.js';
import { scene, camera, renderer } from './renderer.js';
import { getStairX, getStairZ, getUpStairX, getUpStairZ, torchLights, overlapsWall, descend, ascend } from './world.js';
import * as world from './world.js';
import { keys } from './input.js';
import { initCharScreen } from './charscreen.js';
import { spawnMonsters, clearMonsters, updateMonsters, updatePlayerAttack, tryPlayerAttack, aliveCount } from './monsters.js';
import { startSwing, updateWeapon } from './weapon.js';
import './inventory.js';

/* Wire up start button → character creation */
initCharScreen();

/* Spawn monsters after world is built */
spawnMonsters();

/* Click to attack */
const canvas = document.getElementById('c');
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0 && gameState.started && !gameState.inventoryOpen) {
    startSwing();
    tryPlayerAttack();
  }
});

/* Stair transition flash */
const stairFlash = document.getElementById('stairFlash');
let _transitioning = false;

function doStairTransition(color, changeFn) {
  if (_transitioning) return;
  _transitioning = true;
  stairFlash.style.background = color;
  stairFlash.classList.add('active');
  setTimeout(() => {
    clearMonsters();
    changeFn();
    spawnMonsters();
    setTimeout(() => {
      stairFlash.classList.remove('active');
      setTimeout(() => { _transitioning = false; }, 350);
    }, 200);
  }, 300);
}

/* Stairs — NetHack style: '>' descend, '<' ascend */
document.addEventListener('keydown', e => {
  if (!gameState.started || gameState.inventoryOpen || _transitioning) return;
  const isDescend = e.key === '>' || (e.code === 'Period' && e.shiftKey);
  const isAscend  = e.key === '<' || (e.code === 'Comma'  && e.shiftKey);
  if (isDescend && _nearStair) {
    e.preventDefault();
    doStairTransition('#ffe8a0', descend);
  } else if (isAscend && _nearUpStair) {
    e.preventDefault();
    doStairTransition('#a0e8ff', ascend);
  }
});

/* =========================================================
   GAME LOOP
   ========================================================= */
const clock    = new THREE.Clock();
const statusEl = document.getElementById('statusText');
const _fwd     = new THREE.Vector3();
const _right   = new THREE.Vector3();

let _nearStair = false;
let _nearUpStair = false;

function update(dt) {
  if ((!gameState.locked && !gameState.mouseActive) || gameState.inventoryOpen) return;

  /* Movement */
  camera.getWorldDirection(_fwd);
  _fwd.y = 0;
  _fwd.normalize();
  _right.set(-_fwd.z, 0, _fwd.x);

  let mx = 0, mz = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp'))    { mx += _fwd.x;   mz += _fwd.z; }
  if (keys.has('KeyS') || keys.has('ArrowDown'))  { mx -= _fwd.x;   mz -= _fwd.z; }
  if (keys.has('KeyD') || keys.has('ArrowRight')) { mx += _right.x; mz += _right.z; }
  if (keys.has('KeyA') || keys.has('ArrowLeft'))  { mx -= _right.x; mz -= _right.z; }

  const mlen = Math.sqrt(mx * mx + mz * mz);
  if (mlen > 0) {
    const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const spd = (sprint ? SPRINT : SPEED) * dt / mlen;

    const prevX = player.pos.x, prevZ = player.pos.z;

    player.pos.x += mx * spd;
    if (overlapsWall(player.pos.x, player.pos.z, RADIUS)) player.pos.x = prevX;

    player.pos.z += mz * spd;
    if (overlapsWall(player.pos.x, player.pos.z, RADIUS)) player.pos.z = prevZ;
  }

  /* Camera */
  camera.position.set(player.pos.x, EYE_H, player.pos.z);
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  /* Player light */
  world.playerLight.position.copy(camera.position);
  world.playerLight.position.y -= 0.4;

  /* Weapon swing */
  updateWeapon(dt);

  /* Monsters */
  updateMonsters(dt);
  updatePlayerAttack(dt);

  /* Torch flicker */
  for (const lt of torchLights) {
    lt.userData.phase += dt * (2.5 + Math.random() * 4);
    lt.intensity = lt.userData.base
      + Math.sin(lt.userData.phase) * 0.45
      + Math.sin(lt.userData.phase * 2.7) * 0.2;
  }

  /* Stair marker spin */
  world.stairArrow.rotation.y = clock.elapsedTime * 1.8;
  if (world.upStairArrow) world.upStairArrow.rotation.y = clock.elapsedTime * 1.8;

  /* Status */
  const px = Math.floor(player.pos.x), pz = Math.floor(player.pos.z);
  const stairX = getStairX(), stairZ = getStairZ();
  const upX = getUpStairX(), upZ = getUpStairZ();
  _nearStair = Math.hypot(player.pos.x - (stairX + 0.5),
                               player.pos.z - (stairZ + 0.5)) < 1.6;
  _nearUpStair = upX >= 0 && Math.hypot(player.pos.x - (upX + 0.5),
                               player.pos.z - (upZ + 0.5)) < 1.6;
  const { role, hp, level, xp, equipped } = character;
  const wpn    = equipped.weapon ? equipped.weapon.item.name.replace(/^an?\s+/,'') : 'bare hands';
  const hpPct  = hp.cur / hp.max;
  const hpCol  = hpPct > 0.5 ? '#6a5a4a' : hpPct > 0.25 ? '#7a5530' : '#6a3028';
  const hpStr  = `<span style="color:${hpCol}">HP ${hp.cur}/${hp.max}</span>`;
  const xpStr  = `XP:${xp}/${level * 50}`;
  const dl     = gameState.dungeonLevel;
  let stairHint = '';
  if (_nearStair)   stairHint = `&nbsp;&nbsp;<span class="hi">▼ Stairs to Level ${dl + 1} (&gt;)</span>`;
  if (_nearUpStair) stairHint = `&nbsp;&nbsp;<span class="hi" style="color:#6ef">▲ Stairs to Level ${dl - 1} (&lt;)</span>`;
  statusEl.innerHTML =
    `${role} (${wpn}) &nbsp;${hpStr}&nbsp; Lvl:${level} ${xpStr} &nbsp;DL:${dl} &nbsp;(${px},${pz})${stairHint}`;
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  update(dt);
  renderer.render(scene, camera);
}

loop();
