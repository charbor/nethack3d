import { character } from './state.js';
import { camera } from './renderer.js';

/* =========================================================
   FIRST-PERSON WEAPON — shaped blade, not boxes
   ========================================================= */

const wpnGroup = new THREE.Group();

/* ── Blade: tapered shape via ExtrudeGeometry ── */
const bladeShape = new THREE.Shape();
bladeShape.moveTo(0, 0);             // base centre
bladeShape.lineTo(0.012, 0);         // base right
bladeShape.lineTo(0.008, 0.22);      // taper right
bladeShape.lineTo(0, 0.28);          // tip
bladeShape.lineTo(-0.008, 0.22);     // taper left
bladeShape.lineTo(-0.012, 0);        // base left
const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
  depth: 0.006, bevelEnabled: true,
  bevelThickness: 0.002, bevelSize: 0.001, bevelSegments: 1,
});
const bladeMat = new THREE.MeshPhongMaterial({
  color: 0xb0b8c0, emissive: 0x182028,
  specular: 0xffffff, shininess: 90,
  flatShading: false,
});
const blade = new THREE.Mesh(bladeGeo, bladeMat);
blade.position.set(0, 0.01, -0.003);
wpnGroup.add(blade);

/* Fuller (blood groove) — thin dark strip down center */
const fullerGeo = new THREE.PlaneGeometry(0.004, 0.18);
const fullerMat = new THREE.MeshPhongMaterial({
  color: 0x556070, emissive: 0x0a0e12,
  specular: 0x888888, shininess: 60, side: THREE.DoubleSide,
});
const fuller = new THREE.Mesh(fullerGeo, fullerMat);
fuller.position.set(0, 0.12, 0.008);
wpnGroup.add(fuller);

/* ── Guard: curved crosspiece ── */
const guardShape = new THREE.Shape();
guardShape.moveTo(-0.04, -0.006);
guardShape.quadraticCurveTo(-0.045, 0, -0.04, 0.006);
guardShape.lineTo(0.04, 0.006);
guardShape.quadraticCurveTo(0.045, 0, 0.04, -0.006);
guardShape.lineTo(-0.04, -0.006);
const guardGeo = new THREE.ExtrudeGeometry(guardShape, {
  depth: 0.025, bevelEnabled: true,
  bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2,
});
const guardMat = new THREE.MeshPhongMaterial({
  color: 0x8a6a30, emissive: 0x221808,
  specular: 0xccaa66, shininess: 40,
});
const guard = new THREE.Mesh(guardGeo, guardMat);
guard.position.set(0, -0.002, -0.012);
wpnGroup.add(guard);

/* ── Grip: octagonal wrapped leather ── */
const gripGeo = new THREE.CylinderGeometry(0.009, 0.01, 0.08, 8);
const gripMat = new THREE.MeshPhongMaterial({
  color: 0x3a2210, emissive: 0x0c0804,
  specular: 0x443322, shininess: 15,
});
const grip = new THREE.Mesh(gripGeo, gripMat);
grip.position.set(0, -0.05, 0);
wpnGroup.add(grip);

/* Leather wrap rings */
for (let i = 0; i < 4; i++) {
  const wrapGeo = new THREE.TorusGeometry(0.011, 0.002, 4, 8);
  const wrap = new THREE.Mesh(wrapGeo, new THREE.MeshPhongMaterial({
    color: 0x2a1808, emissive: 0x060402,
  }));
  wrap.position.set(0, -0.025 + i * 0.018, 0);
  wrap.rotation.x = Math.PI / 2;
  wpnGroup.add(wrap);
}

/* ── Pommel: rounded sphere ── */
const pommelGeo = new THREE.SphereGeometry(0.014, 8, 6);
const pommelMat = new THREE.MeshPhongMaterial({
  color: 0x8a6a30, emissive: 0x221808,
  specular: 0xccaa66, shininess: 50,
});
const pommel = new THREE.Mesh(pommelGeo, pommelMat);
pommel.position.set(0, -0.098, 0);
wpnGroup.add(pommel);

/* ── Fist (bare hands fallback) ── */
const fistGeo = new THREE.SphereGeometry(0.035, 6, 5);
fistGeo.scale(1, 0.85, 1.2);
const fistMat = new THREE.MeshPhongMaterial({
  color: 0xcc9966, emissive: 0x1a0e06,
  specular: 0x443322, shininess: 10,
});
const fist = new THREE.Mesh(fistGeo, fistMat);
fist.position.set(0, -0.02, 0);
fist.visible = false;
wpnGroup.add(fist);

/* All sword parts for toggling */
const swordParts = [blade, fuller, guard, grip, pommel];

/* Position in camera space (bottom-right, angled) */
wpnGroup.position.set(0.2, -0.22, -0.35);
wpnGroup.rotation.set(-0.15, 0.1, -0.25);

camera.add(wpnGroup);

/* Dedicated light so weapon is always visible */
const wpnLight = new THREE.PointLight(0xffeedd, 0.8, 1.5, 2);
wpnLight.position.set(0.15, -0.1, -0.3);
camera.add(wpnLight);

/* =========================================================
   SWING ANIMATION
   ========================================================= */
let swinging = false;
let swingTime = 0;
const SWING_DURATION = 0.28;

const IDLE_POS = { x: 0.2, y: -0.22, z: -0.35 };
const IDLE_ROT = { x: -0.15, y: 0.1, z: -0.25 };

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
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
  /* hide wrap rings too */
  wpnGroup.children.forEach(ch => {
    if (ch.geometry && ch.geometry.type === 'TorusGeometry') ch.visible = hasWeapon;
  });
  fist.visible = !hasWeapon;

  if (!swinging) {
    const t = Date.now() * 0.001;
    const bob = Math.sin(t * 2.2) * 0.003;
    const sway = Math.sin(t * 1.4) * 0.002;
    wpnGroup.position.set(IDLE_POS.x + sway, IDLE_POS.y + bob, IDLE_POS.z);
    wpnGroup.rotation.set(IDLE_ROT.x, IDLE_ROT.y, IDLE_ROT.z);
    return;
  }

  swingTime += dt;
  const t = Math.min(swingTime / SWING_DURATION, 1);

  /* Three-phase swing: cock back → slash diagonally → return */
  let px, py, pz, rx, ry, rz;

  if (t < 0.12) {
    /* Wind-up: pull right and back, tilt blade up */
    const p = easeOutCubic(t / 0.12);
    px = lerp(IDLE_POS.x, 0.3, p);
    py = lerp(IDLE_POS.y, -0.14, p);
    pz = lerp(IDLE_POS.z, -0.28, p);
    rx = lerp(IDLE_ROT.x, -0.6, p);
    ry = lerp(IDLE_ROT.y, -0.3, p);
    rz = lerp(IDLE_ROT.z, 0.3, p);
  } else if (t < 0.55) {
    /* Slash: fast diagonal sweep left and down */
    const p = easeOutCubic((t - 0.12) / 0.43);
    px = lerp(0.3, -0.08, p);
    py = lerp(-0.14, -0.28, p);
    pz = lerp(-0.28, -0.38, p);
    rx = lerp(-0.6, 0.5, p);
    ry = lerp(-0.3, 0.7, p);
    rz = lerp(0.3, -1.4, p);
  } else {
    /* Return to idle */
    const p = easeInCubic((t - 0.55) / 0.45);
    px = lerp(-0.08, IDLE_POS.x, p);
    py = lerp(-0.28, IDLE_POS.y, p);
    pz = lerp(-0.38, IDLE_POS.z, p);
    rx = lerp(0.5, IDLE_ROT.x, p);
    ry = lerp(0.7, IDLE_ROT.y, p);
    rz = lerp(-1.4, IDLE_ROT.z, p);
  }

  wpnGroup.position.set(px, py, pz);
  wpnGroup.rotation.set(rx, ry, rz);

  if (t >= 1) swinging = false;
}
