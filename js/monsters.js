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
   MONSTER SPRITES — detailed pixel art on canvas
   ========================================================= */
function drawMonster(name) {
  const sz = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = sz;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;

  /* Helper: pixel rect at scale (each "pixel" = 2px for 32-logical on 64-canvas) */
  const P = 2;
  function px(x, y, w, h, col) {
    c.fillStyle = col;
    c.fillRect(x * P, y * P, w * P, h * P);
  }

  switch (name) {
    case 'rat': {
      /* Brown furry rat with beady red eyes and long tail */
      // body
      px(10,22, 12,6, '#7a5a1e'); px(11,21, 10,1, '#8B6914');
      px(9,23, 1,4, '#6a4a10'); px(22,23, 1,4, '#6a4a10');
      // fur texture
      px(12,23, 2,1, '#9a7a2e'); px(16,22, 2,1, '#9a7a2e'); px(14,24, 3,1, '#6a4a10');
      // head
      px(19,19, 7,6, '#8B6914'); px(20,18, 5,1, '#7a5a1e');
      // ears
      px(20,17, 2,2, '#a07030'); px(24,17, 2,2, '#a07030');
      px(21,17, 1,1, '#6a4a10'); px(25,17, 1,1, '#6a4a10');
      // eyes — glowing red
      px(21,20, 2,2, '#f00'); px(24,20, 2,2, '#f00');
      px(22,21, 1,1, '#ff4'); px(25,21, 1,1, '#ff4');
      // nose
      px(26,22, 1,1, '#ff8888');
      // whiskers
      px(27,21, 2,1, '#aaa'); px(27,23, 2,1, '#aaa');
      // tail (curling behind)
      px(6,24, 4,1, '#9a6a2a'); px(4,23, 2,1, '#9a6a2a');
      px(3,22, 2,1, '#8a5a1a'); px(3,21, 1,2, '#8a5a1a');
      // feet
      px(12,28, 2,1, '#6a4a10'); px(18,28, 2,1, '#6a4a10');
      break;
    }
    case 'bat': {
      /* Dark bat with spread wings and red eyes */
      // body
      px(14,16, 4,6, '#444'); px(13,17, 6,4, '#555');
      // head
      px(14,13, 4,3, '#555'); px(15,12, 2,1, '#444');
      // ears (pointy)
      px(14,11, 1,2, '#555'); px(19,11, 1,2, '#555');
      px(13,10, 1,2, '#444'); px(20,10, 1,2, '#444');
      // eyes — bright red glow
      px(14,14, 2,1, '#f00'); px(17,14, 2,1, '#f00');
      px(15,14, 1,1, '#ff0'); px(18,14, 1,1, '#ff0');
      // fangs
      px(15,16, 1,1, '#fff'); px(17,16, 1,1, '#fff');
      // wings spread wide
      px(7,15, 7,2, '#3a3a3a'); px(18,15, 7,2, '#3a3a3a');
      px(4,14, 4,3, '#333'); px(24,14, 4,3, '#333');
      px(2,13, 3,3, '#2a2a2a'); px(27,13, 3,3, '#2a2a2a');
      // wing fingers
      px(3,12, 1,2, '#333'); px(6,13, 1,2, '#333');
      px(28,12, 1,2, '#333'); px(25,13, 1,2, '#333');
      // wing membrane texture
      px(5,15, 2,1, '#444'); px(9,16, 1,1, '#444');
      px(25,15, 2,1, '#444'); px(22,16, 1,1, '#444');
      break;
    }
    case 'kobold': {
      /* Green scaly humanoid with yellow eyes and a spear */
      // body
      px(12,16, 8,10, '#3a6a3a'); px(13,15, 6,1, '#4a7a4a');
      // scales texture
      px(14,18, 2,1, '#2a5a2a'); px(17,20, 2,1, '#2a5a2a');
      px(13,22, 2,1, '#2a5a2a'); px(16,17, 1,1, '#4a8a4a');
      // head
      px(13,10, 6,6, '#4a7a4a'); px(14,9, 4,1, '#3a6a3a');
      // snout
      px(19,12, 2,3, '#4a7a4a'); px(21,13, 1,1, '#3a5a3a');
      // eyes — yellow menacing
      px(15,11, 2,2, '#ff0'); px(18,11, 2,2, '#ff0');
      px(15,12, 1,1, '#000'); px(18,12, 1,1, '#000');
      // teeth
      px(19,14, 1,1, '#fff'); px(20,14, 1,1, '#fff');
      // arms
      px(10,17, 2,5, '#3a6a3a'); px(20,17, 2,5, '#3a6a3a');
      // claws
      px(9,22, 1,1, '#cc8'); px(10,22, 1,1, '#cc8');
      px(21,22, 1,1, '#cc8'); px(22,22, 1,1, '#cc8');
      // legs
      px(13,26, 2,3, '#3a6a3a'); px(17,26, 2,3, '#3a6a3a');
      // feet
      px(12,29, 3,1, '#2a5a2a'); px(17,29, 3,1, '#2a5a2a');
      // spear (held in right hand)
      px(22,8, 1,16, '#864'); px(22,7, 1,1, '#ccc'); px(22,6, 1,2, '#aaa');
      break;
    }
    case 'goblin': {
      /* Larger green brute with tusks, armor scraps, glowing eyes */
      // body (armored)
      px(11,14, 10,12, '#2a6644'); px(12,13, 8,1, '#2a5a3a');
      // armor scraps
      px(12,16, 8,3, '#665533'); px(13,15, 6,1, '#554422');
      px(12,19, 3,2, '#665533'); px(17,19, 3,2, '#665533');
      // belt
      px(12,21, 8,1, '#886644'); px(15,21, 2,1, '#aa8844');
      // head
      px(12,7, 8,7, '#3a7a5a'); px(13,6, 6,1, '#2a6a4a');
      // brow ridge
      px(12,8, 8,1, '#2a5a3a');
      // eyes — orange menacing glow
      px(14,9, 2,2, '#f80'); px(18,9, 2,2, '#f80');
      px(14,10, 1,1, '#ff0'); px(18,10, 1,1, '#ff0');
      // nose
      px(16,11, 1,1, '#2a5a3a');
      // tusks
      px(13,13, 1,2, '#eed'); px(18,13, 1,2, '#eed');
      // ears (pointed)
      px(10,8, 2,2, '#3a7a5a'); px(20,8, 2,2, '#3a7a5a');
      px(9,9, 1,1, '#2a6a4a'); px(22,9, 1,1, '#2a6a4a');
      // arms
      px(8,15, 3,7, '#2a6644'); px(21,15, 3,7, '#2a6644');
      // fists
      px(8,22, 3,2, '#3a7a5a'); px(21,22, 3,2, '#3a7a5a');
      // legs
      px(13,26, 3,3, '#2a5a3a'); px(17,26, 3,3, '#2a5a3a');
      // feet
      px(12,29, 4,1, '#223'); px(17,29, 4,1, '#223');
      // weapon — crude club
      px(7,10, 1,14, '#654'); px(6,8, 3,3, '#876'); px(6,9, 1,1, '#555');
      break;
    }
    case 'skeleton': {
      /* Bone-white skeleton with hollow eye sockets and sword */
      // ribcage
      px(13,14, 6,7, '#111'); // dark cavity
      px(12,14, 1,7, '#ddd'); px(19,14, 1,7, '#ddd'); // sides
      px(13,14, 6,1, '#ddd'); px(13,17, 6,1, '#ddd'); px(13,20, 6,1, '#ddd'); // ribs
      // spine
      px(15,14, 2,10, '#ccc');
      // skull
      px(12,6, 8,8, '#eee'); px(13,5, 6,1, '#ddd');
      // eye sockets — deep black with red pinpoints
      px(13,8, 3,3, '#111'); px(17,8, 3,3, '#111');
      px(14,9, 1,1, '#f44'); px(18,9, 1,1, '#f44');
      // nose hole
      px(15,11, 2,1, '#333');
      // teeth / jaw
      px(13,12, 6,1, '#ddd');
      px(13,13, 1,1, '#ccc'); px(15,13, 1,1, '#ccc');
      px(17,13, 1,1, '#ccc'); px(19,13, 1,1, '#ccc');
      // arms (bone)
      px(10,15, 2,1, '#ddd'); px(9,16, 1,6, '#ccc'); px(10,16, 1,6, '#ccc');
      px(20,15, 2,1, '#ddd'); px(21,16, 1,6, '#ccc'); px(22,16, 1,6, '#ccc');
      // hands
      px(8,22, 2,1, '#ddd'); px(22,22, 2,1, '#ddd');
      // pelvis
      px(13,24, 6,1, '#ccc');
      // legs
      px(13,25, 2,4, '#ccc'); px(17,25, 2,4, '#ccc');
      // feet
      px(12,29, 3,1, '#bbb'); px(17,29, 3,1, '#bbb');
      // rusty sword
      px(7,9, 1,14, '#aaa'); px(7,8, 1,1, '#ccc'); px(6,22, 3,1, '#886644');
      break;
    }
    case 'orc': {
      /* Big red-brown orc with heavy armor, fangs, and a massive axe */
      // body (wide, heavy)
      px(9,13, 14,14, '#8a3333'); px(10,12, 12,1, '#7a2a2a');
      // chest armor
      px(10,14, 12,6, '#555'); px(11,14, 10,1, '#777');
      px(15,15, 2,4, '#666'); // center plate
      px(11,18, 4,2, '#444'); px(17,18, 4,2, '#444');
      // head (big)
      px(11,4, 10,9, '#9a4040'); px(12,3, 8,1, '#8a3333');
      // brow (heavy)
      px(11,6, 10,2, '#7a2a2a');
      // eyes — burning orange/red
      px(13,7, 3,2, '#f40'); px(18,7, 3,2, '#f40');
      px(14,8, 1,1, '#ff0'); px(19,8, 1,1, '#ff0');
      // nose
      px(15,9, 2,2, '#7a2a2a');
      // fangs (big, from lower jaw)
      px(13,12, 2,2, '#eed'); px(19,12, 2,2, '#eed');
      px(14,12, 1,1, '#fff'); px(20,12, 1,1, '#fff');
      // ears
      px(9,6, 2,3, '#9a4040'); px(21,6, 2,3, '#9a4040');
      // arms (thick)
      px(6,14, 3,8, '#8a3333'); px(23,14, 3,8, '#8a3333');
      // bracers
      px(6,18, 3,2, '#555'); px(23,18, 3,2, '#555');
      // fists
      px(5,22, 4,2, '#9a4040'); px(23,22, 4,2, '#9a4040');
      // belt
      px(10,20, 12,1, '#886644'); px(15,20, 2,1, '#ffcc44');
      // legs
      px(12,27, 3,3, '#7a2a2a'); px(17,27, 3,3, '#7a2a2a');
      // boots
      px(11,29, 4,2, '#333'); px(17,29, 4,2, '#333');
      // massive axe
      px(4,5, 1,18, '#864');  // handle
      px(1,5, 4,2, '#888');   // axe head top
      px(1,7, 3,3, '#999');   // axe blade
      px(0,6, 1,3, '#aaa');   // edge
      px(1,5, 1,1, '#bbb');   // highlight
      break;
    }
    default: {
      px(8,8, 16,16, type.col);
      px(10,12, 3,3, '#f00'); px(19,12, 3,3, '#f00');
    }
  }

  return cv;
}

function makeMonsterSprite(type) {
  const cv = drawMonster(type.name);
  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(type.size * 1.4, type.size * 1.4, 1);
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
    if (m.glow) scene.remove(m.glow);
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

      /* Faint eye glow — visible in dark corridors */
      const glowCol = type.name === 'skeleton' ? 0xff4444 : 0xff6600;
      const glow = new THREE.PointLight(glowCol, 0, 3, 2);
      glow.position.set(mx, type.size * 0.7, mz);
      scene.add(glow);

      monsters.push({
        type,
        hp: type.hp,
        maxHp: type.hp,
        x: mx,
        z: mz,
        sprite,
        hpBar,
        glow,
        state: 'idle',       // idle, chase, attack
        atkCooldown: 0,
        wanderDir: Math.random() * Math.PI * 2,
        wanderTimer: 1 + Math.random() * 3,
        bobPhase: Math.random() * Math.PI * 2,
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

    /* Bob animation */
    m.bobPhase += dt * (m.state === 'chase' ? 8 : 2.5);
    const bob = Math.sin(m.bobPhase) * (m.state === 'chase' ? 0.06 : 0.03);
    const baseY = m.type.size * 0.7;

    /* Update sprite position */
    m.sprite.position.set(m.x, baseY + bob, m.z);
    m.hpBar.sprite.position.set(m.x, m.type.size * 1.4 + 0.1 + bob, m.z);

    /* Eye glow — brighter when aggroed */
    m.glow.position.set(m.x, m.type.size * 0.7, m.z);
    m.glow.intensity = m.state === 'idle' ? 0.3 : m.state === 'chase' ? 1.2 : 1.8;

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
  scene.remove(m.glow);

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
