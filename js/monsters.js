import { MAP_W, MAP_H } from './config.js';
import { character, player, gameState } from './state.js';
import { scene, camera } from './renderer.js';
import { map, rooms, stairX, stairZ, isBlocked } from './world.js';
import { showMsg } from './ui.js';

/* =========================================================
   MONSTER TYPES
   ========================================================= */
const TYPES = {
  rat:      { name: 'rat',      hp: 4,  dmg: 2, ac: 0, speed: 2.5, xp: 5,  range: 5,  col: '#8B6914', size: 0.4 },
  bat:      { name: 'bat',      hp: 3,  dmg: 1, ac: 1, speed: 3.5, xp: 4,  range: 7,  col: '#555',    size: 0.35 },
  kobold:   { name: 'kobold',   hp: 8,  dmg: 4, ac: 2, speed: 2.0, xp: 12, range: 8,  col: '#4a4',    size: 0.6 },
  goblin:   { name: 'goblin',   hp: 12, dmg: 5, ac: 3, speed: 2.2, xp: 18, range: 10, col: '#2a6',    size: 0.7 },
  skeleton: { name: 'skeleton', hp: 16, dmg: 6, ac: 4, speed: 1.8, xp: 25, range: 12, col: '#ddd',    size: 0.8 },
  orc:      { name: 'orc',      hp: 22, dmg: 8, ac: 5, speed: 2.0, xp: 35, range: 10, col: '#a33',    size: 0.85 },
};

/* Difficulty tiers — later rooms get harder monsters */
const TIERS = [
  ['rat', 'bat'],
  ['rat', 'bat', 'kobold'],
  ['kobold', 'goblin'],
  ['goblin', 'skeleton'],
  ['skeleton', 'orc'],
];

/* =========================================================
   MONSTER SPRITES — pixel art on canvas
   ========================================================= */
function drawMonsterFace(type) {
  const sz = 32;
  const cv = document.createElement('canvas');
  cv.width = cv.height = sz;
  const c = cv.getContext('2d');
  const col = type.col;

  /* Body */
  const s = type.size * sz;
  const off = (sz - s) / 2;
  c.fillStyle = col;
  c.fillRect(off, sz - s, s, s);

  /* Eyes */
  const eyeY = sz - s + s * 0.3;
  const eyeW = Math.max(2, s * 0.2);
  const eyeGap = s * 0.15;
  c.fillStyle = '#f00';
  c.fillRect(sz / 2 - eyeGap - eyeW, eyeY, eyeW, eyeW);
  c.fillRect(sz / 2 + eyeGap, eyeY, eyeW, eyeW);

  /* Pupils */
  c.fillStyle = '#ff0';
  const pw = Math.max(1, eyeW * 0.5);
  c.fillRect(sz / 2 - eyeGap - eyeW + (eyeW - pw) / 2, eyeY + (eyeW - pw) / 2, pw, pw);
  c.fillRect(sz / 2 + eyeGap + (eyeW - pw) / 2, eyeY + (eyeW - pw) / 2, pw, pw);

  return cv;
}

function makeMonsterSprite(type) {
  const cv = drawMonsterFace(type);
  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(type.size, type.size, 1);
  return sprite;
}

function makeHpBar() {
  const cv = document.createElement('canvas');
  cv.width = 32; cv.height = 4;
  const mat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(cv),
    transparent: true,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.6, 0.08, 1);
  return { sprite, canvas: cv };
}

function updateHpBar(bar, pct) {
  const cv = bar.canvas;
  const c = cv.getContext('2d');
  c.clearRect(0, 0, 32, 4);
  c.fillStyle = '#300';
  c.fillRect(0, 0, 32, 4);
  c.fillStyle = pct > 0.5 ? '#0c0' : pct > 0.25 ? '#fa0' : '#f00';
  c.fillRect(0, 0, Math.round(32 * pct), 4);
  bar.sprite.material.map.needsUpdate = true;
}

/* =========================================================
   MONSTER INSTANCES
   ========================================================= */
export const monsters = [];

export function spawnMonsters() {
  /* Clear existing */
  for (const m of monsters) {
    scene.remove(m.sprite);
    scene.remove(m.hpBar.sprite);
  }
  monsters.length = 0;

  for (let i = 0; i < rooms.length; i++) {
    /* Skip first room (player start) and stair room */
    if (i === 0 || i === rooms.length - 1) continue;

    const room = rooms[i];
    const tierIdx = Math.min(Math.floor(i / Math.max(1, rooms.length / TIERS.length)), TIERS.length - 1);
    const tier = TIERS[tierIdx];

    /* 1-3 monsters per room */
    const count = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < count; j++) {
      const typeKey = tier[Math.floor(Math.random() * tier.length)];
      const type = TYPES[typeKey];

      /* Random position within room */
      const mx = room.x + 1 + Math.floor(Math.random() * (room.w - 2)) + 0.5;
      const mz = room.y + 1 + Math.floor(Math.random() * (room.h - 2)) + 0.5;

      const sprite = makeMonsterSprite(type);
      sprite.position.set(mx, type.size / 2, mz);
      scene.add(sprite);

      const hpBar = makeHpBar();
      hpBar.sprite.position.set(mx, type.size + 0.1, mz);
      hpBar.sprite.visible = false;
      scene.add(hpBar.sprite);

      monsters.push({
        type,
        hp: type.hp,
        maxHp: type.hp,
        x: mx,
        z: mz,
        sprite,
        hpBar,
        state: 'idle',       // idle, chase, attack
        atkCooldown: 0,
        wanderDir: Math.random() * Math.PI * 2,
        wanderTimer: 1 + Math.random() * 3,
        dead: false,
      });

      updateHpBar(hpBar, 1);
    }
  }
}

/* =========================================================
   AI UPDATE
   ========================================================= */
const ATTACK_RANGE = 1.5;
const ATTACK_CD    = 1.0; // seconds between monster attacks

export function updateMonsters(dt) {
  if (!gameState.started) return;

  for (const m of monsters) {
    if (m.dead) continue;

    const dx = player.pos.x - m.x;
    const dz = player.pos.z - m.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    /* State transitions */
    if (dist < ATTACK_RANGE) {
      m.state = 'attack';
    } else if (dist < m.type.range) {
      m.state = 'chase';
    } else {
      m.state = 'idle';
    }

    /* Behaviour */
    if (m.state === 'attack') {
      m.atkCooldown -= dt;
      if (m.atkCooldown <= 0) {
        monsterAttack(m);
        m.atkCooldown = ATTACK_CD;
      }
    } else if (m.state === 'chase') {
      moveToward(m, player.pos.x, player.pos.z, m.type.speed * dt);
    } else {
      /* Wander */
      m.wanderTimer -= dt;
      if (m.wanderTimer <= 0) {
        m.wanderDir = Math.random() * Math.PI * 2;
        m.wanderTimer = 1.5 + Math.random() * 3;
      }
      const wx = Math.cos(m.wanderDir);
      const wz = Math.sin(m.wanderDir);
      moveToward(m, m.x + wx, m.z + wz, m.type.speed * 0.3 * dt);
    }

    /* Update sprite position */
    m.sprite.position.set(m.x, m.type.size / 2, m.z);
    m.hpBar.sprite.position.set(m.x, m.type.size + 0.1, m.z);

    /* Show HP bar only when damaged or chasing */
    m.hpBar.sprite.visible = m.hp < m.maxHp || m.state === 'chase' || m.state === 'attack';
  }
}

function moveToward(m, tx, tz, step) {
  const dx = tx - m.x;
  const dz = tz - m.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist < 0.1) return;

  const nx = dx / dist * step;
  const nz = dz / dist * step;

  /* Try X then Z (sliding collision, same as player) */
  const newX = m.x + nx;
  if (!monsterBlocked(newX, m.z, m)) m.x = newX;

  const newZ = m.z + nz;
  if (!monsterBlocked(m.x, newZ, m)) m.z = newZ;
}

function monsterBlocked(x, z, self) {
  /* Wall collision */
  const R = 0.25;
  const x0 = Math.floor(x - R), x1 = Math.floor(x + R);
  const z0 = Math.floor(z - R), z1 = Math.floor(z + R);
  for (let iz = z0; iz <= z1; iz++)
    for (let ix = x0; ix <= x1; ix++)
      if (isBlocked(ix, iz)) return true;

  /* Monster-monster collision */
  for (const other of monsters) {
    if (other === self || other.dead) continue;
    const d = Math.sqrt((x - other.x) ** 2 + (z - other.z) ** 2);
    if (d < 0.5) return true;
  }
  return false;
}

/* =========================================================
   COMBAT
   ========================================================= */
let playerAtkCooldown = 0;

export function updatePlayerAttack(dt) {
  if (playerAtkCooldown > 0) playerAtkCooldown -= dt;
}

export function tryPlayerAttack() {
  if (!gameState.started || gameState.inventoryOpen) return;
  if (playerAtkCooldown > 0) return;

  /* Find closest monster in front of player within attack range */
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  dir.y = 0;
  dir.normalize();

  let bestMon = null, bestDist = 2.5;

  for (const m of monsters) {
    if (m.dead) continue;
    const dx = m.x - player.pos.x;
    const dz = m.z - player.pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 2.5) continue;

    /* Check facing: dot product with look direction */
    const dot = (dx * dir.x + dz * dir.z) / dist;
    if (dot < 0.4) continue; // must be roughly in front

    if (dist < bestDist) {
      bestDist = dist;
      bestMon = m;
    }
  }

  if (!bestMon) return;

  playerAtkCooldown = 0.5; // player attacks faster than monsters

  /* Damage calculation: weapon dmg + STR mod - monster AC, min 1 */
  const wpn = character.equipped.weapon;
  const baseDmg = wpn ? wpn.item.dmg : 2; // bare hands = 2
  const strMod = Math.floor((character.stats.str - 10) / 2);
  const raw = baseDmg + strMod - bestMon.type.ac;
  /* Add some variance */
  const dmg = Math.max(1, raw + Math.floor(Math.random() * 3) - 1);

  bestMon.hp -= dmg;
  showMsg(`You hit the ${bestMon.type.name}! (${dmg} damage)`);

  /* Flash red */
  bestMon.sprite.material.color.set(0xff4444);
  setTimeout(() => {
    if (!bestMon.dead) bestMon.sprite.material.color.set(0xffffff);
  }, 120);

  updateHpBar(bestMon.hpBar, Math.max(0, bestMon.hp / bestMon.maxHp));

  if (bestMon.hp <= 0) {
    killMonster(bestMon);
  }
}

function monsterAttack(m) {
  const totalAC = character.equipped.armor ? character.equipped.armor.item.ac : 0;
  const raw = m.type.dmg - totalAC;
  const dmg = Math.max(1, raw + Math.floor(Math.random() * 3) - 1);

  character.hp.cur -= dmg;
  showMsg(`The ${m.type.name} hits you! (${dmg} damage)`);

  if (character.hp.cur <= 0) {
    character.hp.cur = 0;
    playerDeath(m);
  }
}

function killMonster(m) {
  m.dead = true;
  scene.remove(m.sprite);
  scene.remove(m.hpBar.sprite);

  /* Grant XP */
  character.xp += m.type.xp;
  showMsg(`The ${m.type.name} dies! (+${m.type.xp} XP)`);

  /* Level up check */
  const xpNeeded = character.level * 50;
  if (character.xp >= xpNeeded) {
    character.level++;
    character.xp -= xpNeeded;
    const hpGain = Math.floor(Math.random() * 4) + 2;
    character.hp.max += hpGain;
    character.hp.cur = Math.min(character.hp.cur + hpGain, character.hp.max);
    setTimeout(() => {
      showMsg(`Welcome to level ${character.level}! (+${hpGain} max HP)`);
    }, 1200);
  }
}

/* =========================================================
   PLAYER DEATH
   ========================================================= */
function playerDeath(killer) {
  gameState.started = false;
  const el = document.getElementById('deathscreen');
  if (el) {
    el.querySelector('.death-msg').textContent =
      `Killed by a ${killer.type.name} on dungeon level 1`;
    el.querySelector('.death-score').textContent =
      `${character.name} the ${character.race} ${character.role} — Level ${character.level}`;
    el.style.display = 'flex';
  }
}

/* =========================================================
   PUBLIC: count living monsters
   ========================================================= */
export function aliveCount() {
  let n = 0;
  for (const m of monsters) if (!m.dead) n++;
  return n;
}
