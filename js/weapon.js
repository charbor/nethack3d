import { character } from './state.js';
import { camera } from './renderer.js';

/* =========================================================
   FIRST-PERSON WEAPON — ancient crypt blade
   Corroded, pitted, dark iron with faint remnants of old runes.
   Looks like it was buried for centuries.
   ========================================================= */

const wpnGroup = new THREE.Group();

/* ── Blade — tapered, pitted, dark corroded iron ── */
const bladeShape = new THREE.Shape();
bladeShape.moveTo(0, 0);
bladeShape.lineTo(0.016, 0);
bladeShape.lineTo(0.013, 0.08);
bladeShape.lineTo(0.011, 0.16);
bladeShape.lineTo(0.008, 0.24);
bladeShape.lineTo(0.003, 0.30);
bladeShape.lineTo(0, 0.33);           // tip — slightly off-center, chipped
bladeShape.lineTo(-0.004, 0.30);
bladeShape.lineTo(-0.009, 0.24);
bladeShape.lineTo(-0.012, 0.16);
bladeShape.lineTo(-0.014, 0.08);
bladeShape.lineTo(-0.016, 0);
const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
  depth: 0.006, bevelEnabled: true,
  bevelThickness: 0.001, bevelSize: 0.001, bevelSegments: 1,
});
const bladeMat = new THREE.MeshPhongMaterial({
  color: 0x3a3530, emissive: 0x060504,
  specular: 0x444038, shininess: 20,
});
const blade = new THREE.Mesh(bladeGeo, bladeMat);
blade.position.set(0, 0.01, -0.003);
wpnGroup.add(blade);

/* Faint etched rune line — barely visible, corroded green patina */
const runeMat = new THREE.MeshBasicMaterial({
  color: 0x2a3a28, transparent: true, opacity: 0.25,
});
const runeGeo = new THREE.PlaneGeometry(0.003, 0.14);
const rune = new THREE.Mesh(runeGeo, runeMat);
rune.position.set(0, 0.12, 0.008);
wpnGroup.add(rune);

/* Pitting / corrosion dots along blade */
const pitMat = new THREE.MeshBasicMaterial({
  color: 0x1a1a14, transparent: true, opacity: 0.4,
});
const pitGeo = new THREE.CircleGeometry(0.002, 4);
for (let i = 0; i < 6; i++) {
  const pit = new THREE.Mesh(pitGeo, pitMat);
  pit.position.set(
    (Math.random() - 0.5) * 0.016,
    0.04 + Math.random() * 0.2,
    0.008
  );
  wpnGroup.add(pit);
}

/* ── Guard — crude, bent iron crosspiece ── */
const guardShape = new THREE.Shape();
guardShape.moveTo(-0.04, 0);
guardShape.quadraticCurveTo(-0.044, 0.006, -0.038, 0.008);
guardShape.lineTo(-0.01, 0.004);
guardShape.lineTo(0.01, 0.004);
guardShape.lineTo(0.04, 0.01);
guardShape.quadraticCurveTo(0.046, 0.006, 0.042, 0);
guardShape.quadraticCurveTo(0.046, -0.006, 0.04, -0.01);
guardShape.lineTo(0.01, -0.004);
guardShape.lineTo(-0.01, -0.004);
guardShape.lineTo(-0.038, -0.008);
guardShape.quadraticCurveTo(-0.044, -0.006, -0.04, 0);
const guardGeo = new THREE.ExtrudeGeometry(guardShape, {
  depth: 0.016, bevelEnabled: true,
  bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1,
});
const guardMat = new THREE.MeshPhongMaterial({
  color: 0x2a2218, emissive: 0x060402,
  specular: 0x332a1a, shininess: 12,
});
const guard = new THREE.Mesh(guardGeo, guardMat);
guard.position.set(0, -0.002, -0.008);
wpnGroup.add(guard);

/* Cracked gem socket — empty, dark, the gem long gone */
const socketGeo = new THREE.RingGeometry(0.003, 0.006, 6);
const socketMat = new THREE.MeshPhongMaterial({
  color: 0x1a1410, emissive: 0x020201,
  specular: 0x221a0a, shininess: 8,
  side: THREE.DoubleSide,
});
const socket = new THREE.Mesh(socketGeo, socketMat);
socket.position.set(0, 0.0, 0.01);
wpnGroup.add(socket);

/* ── Grip — dry, cracked leather wrap over wood ── */
const gripGeo = new THREE.CylinderGeometry(0.009, 0.011, 0.09, 6);
const gripMat = new THREE.MeshPhongMaterial({
  color: 0x14100a, emissive: 0x030201,
  specular: 0x0a0804, shininess: 4,
});
const grip = new THREE.Mesh(gripGeo, gripMat);
grip.position.set(0, -0.055, 0);
wpnGroup.add(grip);

/* Frayed wrap bands — uneven, some missing */
const wrapMat = new THREE.MeshPhongMaterial({
  color: 0x0c0804, emissive: 0x020100,
});
const wrapPositions = [-0.02, -0.005, 0.02, 0.04]; // irregularly spaced, one missing
for (const yOff of wrapPositions) {
  const wGeo = new THREE.TorusGeometry(0.011, 0.0015, 4, 6);
  const w = new THREE.Mesh(wGeo, wrapMat);
  w.position.set(0, yOff, 0);
  w.rotation.x = Math.PI / 2;
  wpnGroup.add(w);
}

/* ── Pommel — dented, tarnished iron ball ── */
const pommelGeo = new THREE.SphereGeometry(0.013, 6, 4);
const pommelMat = new THREE.MeshPhongMaterial({
  color: 0x2a2520, emissive: 0x050403,
  specular: 0x2a2218, shininess: 10,
});
const pommel = new THREE.Mesh(pommelGeo, pommelMat);
pommel.position.set(0, -0.107, 0);
wpnGroup.add(pommel);

/* ── Fist (bare hands) ── */
const fistGroup = new THREE.Group();
/* Palm */
const palmGeo = new THREE.BoxGeometry(0.05, 0.035, 0.06);
const skinMat = new THREE.MeshPhongMaterial({
  color: 0xbb8866, emissive: 0x0a0604,
  specular: 0x332211, shininess: 10,
});
const palm = new THREE.Mesh(palmGeo, skinMat);
fistGroup.add(palm);
/* Fingers curled */
const fingerGeo = new THREE.BoxGeometry(0.045, 0.02, 0.025);
const fingers = new THREE.Mesh(fingerGeo, skinMat);
fingers.position.set(0, -0.016, -0.02);
fistGroup.add(fingers);
/* Thumb */
const thumbGeo = new THREE.BoxGeometry(0.018, 0.03, 0.02);
const thumb = new THREE.Mesh(thumbGeo, skinMat);
thumb.position.set(0.026, 0.0, -0.01);
thumb.rotation.z = -0.4;
fistGroup.add(thumb);
fistGroup.visible = false;
wpnGroup.add(fistGroup);

/* Collect sword parts for toggle */
const swordParts = wpnGroup.children.filter(c => c !== fistGroup);

/* Position in camera space */
wpnGroup.position.set(0.2, -0.22, -0.35);
wpnGroup.rotation.set(-0.15, 0.1, -0.25);
camera.add(wpnGroup);

/* Lighting for weapon — dim, warm, like a dying torch */
const wpnLight = new THREE.PointLight(0xcc9966, 0.5, 1.2, 2);
wpnLight.position.set(0.15, -0.1, -0.3);
camera.add(wpnLight);

/* =========================================================
   SWING ANIMATION
   ========================================================= */
let swinging = false;
let swingTime = 0;
const SWING_DURATION = 0.26;

const IDLE_POS = { x: 0.2, y: -0.22, z: -0.35 };
const IDLE_ROT = { x: -0.15, y: 0.1, z: -0.25 };

function easeOutCubic(t) { return 1 - (1 - t) ** 3; }
function easeInCubic(t) { return t * t * t; }
function lerp(a, b, t) { return a + (b - a) * t; }

export function startSwing() {
  if (swinging) return;
  swinging = true;
  swingTime = 0;
}

export function updateWeapon(dt) {
  const hasWeapon = !!character.equipped.weapon;
  for (const p of swordParts) p.visible = hasWeapon;
  fistGroup.visible = !hasWeapon;

  /* Faint rune flicker — barely perceptible, like dying magic */
  if (hasWeapon) {
    const flicker = 0.15 + Math.sin(Date.now() * 0.0015) * 0.1;
    runeMat.opacity = flicker;
  }

  if (!swinging) {
    const now = Date.now() * 0.001;
    const bob = Math.sin(now * 2.2) * 0.003;
    const sway = Math.sin(now * 1.4) * 0.002;
    wpnGroup.position.set(IDLE_POS.x + sway, IDLE_POS.y + bob, IDLE_POS.z);
    wpnGroup.rotation.set(IDLE_ROT.x, IDLE_ROT.y, IDLE_ROT.z);
    return;
  }

  swingTime += dt;
  const t = Math.min(swingTime / SWING_DURATION, 1);

  let px, py, pz, rx, ry, rz;

  if (t < 0.12) {
    const p = easeOutCubic(t / 0.12);
    px = lerp(IDLE_POS.x, 0.3, p);
    py = lerp(IDLE_POS.y, -0.12, p);
    pz = lerp(IDLE_POS.z, -0.28, p);
    rx = lerp(IDLE_ROT.x, -0.7, p);
    ry = lerp(IDLE_ROT.y, -0.3, p);
    rz = lerp(IDLE_ROT.z, 0.4, p);
  } else if (t < 0.5) {
    const p = easeOutCubic((t - 0.12) / 0.38);
    px = lerp(0.3, -0.1, p);
    py = lerp(-0.12, -0.3, p);
    pz = lerp(-0.28, -0.38, p);
    rx = lerp(-0.7, 0.6, p);
    ry = lerp(-0.3, 0.8, p);
    rz = lerp(0.4, -1.5, p);
  } else {
    const p = easeInCubic((t - 0.5) / 0.5);
    px = lerp(-0.1, IDLE_POS.x, p);
    py = lerp(-0.3, IDLE_POS.y, p);
    pz = lerp(-0.38, IDLE_POS.z, p);
    rx = lerp(0.6, IDLE_ROT.x, p);
    ry = lerp(0.8, IDLE_ROT.y, p);
    rz = lerp(-1.5, IDLE_ROT.z, p);
  }

  wpnGroup.position.set(px, py, pz);
  wpnGroup.rotation.set(rx, ry, rz);

  if (t >= 1) swinging = false;
}
