import { SPEED, SPRINT, RADIUS, EYE_H } from './config.js';
import { character, player, gameState } from './state.js';
import { scene, camera, renderer } from './renderer.js';
import { stairX, stairZ, torchLights, playerLight, stairArrow, overlapsWall } from './world.js';
import { keys } from './input.js';
import { initCharScreen } from './charscreen.js';
import { spawnMonsters, updateMonsters, updatePlayerAttack, tryPlayerAttack, aliveCount } from './monsters.js';
import './inventory.js';

/* Wire up start button → character creation */
initCharScreen();

/* Spawn monsters after world is built */
spawnMonsters();

/* Click to attack */
const canvas = document.getElementById('c');
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0 && gameState.started && !gameState.inventoryOpen) {
    tryPlayerAttack();
  }
});

/* =========================================================
   GAME LOOP
   ========================================================= */
const clock    = new THREE.Clock();
const statusEl = document.getElementById('statusText');
const _fwd     = new THREE.Vector3();
const _right   = new THREE.Vector3();

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
  playerLight.position.copy(camera.position);
  playerLight.position.y -= 0.4;

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
  stairArrow.rotation.y = clock.elapsedTime * 1.8;

  /* Status */
  const px = Math.floor(player.pos.x), pz = Math.floor(player.pos.z);
  const nearStair = Math.hypot(player.pos.x - (stairX + 0.5),
                               player.pos.z - (stairZ + 0.5)) < 1.6;
  const { role, hp, level, xp, equipped } = character;
  const wpn    = equipped.weapon ? equipped.weapon.item.name.replace(/^an?\s+/,'') : 'bare hands';
  const hpPct  = hp.cur / hp.max;
  const hpCol  = hpPct > 0.5 ? '#8f8' : hpPct > 0.25 ? '#fa0' : '#f44';
  const hpStr  = `<span style="color:${hpCol}">HP ${hp.cur}/${hp.max}</span>`;
  const xpStr  = `XP:${xp}/${level * 50}`;
  const stair  = nearStair ? `&nbsp;&nbsp;<span class="hi">▼ Stairs to Level 2</span>` : '';
  statusEl.innerHTML =
    `${role} (${wpn}) &nbsp;${hpStr}&nbsp; Lvl:${level} ${xpStr} &nbsp;DL:1 &nbsp;(${px},${pz})${stair}`;
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  update(dt);
  renderer.render(scene, camera);
}

loop();
