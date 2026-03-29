import { character } from './state.js';
import { camera } from './renderer.js';

/* =========================================================
   FIRST-PERSON WEAPON (attached to camera)
   ========================================================= */

/* Sword group — blade + guard + grip, positioned bottom-right */
const wpnGroup = new THREE.Group();

/* Blade */
const bladeGeo = new THREE.BoxGeometry(0.018, 0.28, 0.035);
const bladeMat = new THREE.MeshLambertMaterial({ color: 0xcccccc, emissive: 0x222222 });
const blade = new THREE.Mesh(bladeGeo, bladeMat);
blade.position.set(0, 0.14, 0);
wpnGroup.add(blade);

/* Blade edge highlight */
const edgeGeo = new THREE.BoxGeometry(0.005, 0.26, 0.038);
const edgeMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x444444 });
const edge = new THREE.Mesh(edgeGeo, edgeMat);
edge.position.set(-0.008, 0.14, 0);
wpnGroup.add(edge);

/* Guard (crosspiece) */
const guardGeo = new THREE.BoxGeometry(0.07, 0.015, 0.04);
const guardMat = new THREE.MeshLambertMaterial({ color: 0xaa8844, emissive: 0x332200 });
const guard = new THREE.Mesh(guardGeo, guardMat);
guard.position.set(0, 0.0, 0);
wpnGroup.add(guard);

/* Grip */
const gripGeo = new THREE.BoxGeometry(0.022, 0.09, 0.028);
const gripMat = new THREE.MeshLambertMaterial({ color: 0x664422, emissive: 0x221100 });
const grip = new THREE.Mesh(gripGeo, gripMat);
grip.position.set(0, -0.055, 0);
wpnGroup.add(grip);

/* Pommel */
const pommelGeo = new THREE.BoxGeometry(0.03, 0.018, 0.035);
const pommelMat = new THREE.MeshLambertMaterial({ color: 0xaa8844, emissive: 0x332200 });
const pommel = new THREE.Mesh(pommelGeo, pommelMat);
pommel.position.set(0, -0.105, 0);
wpnGroup.add(pommel);

/* Fist (bare hands fallback) */
const fistGeo = new THREE.BoxGeometry(0.06, 0.06, 0.08);
const fistMat = new THREE.MeshLambertMaterial({ color: 0xcc9966, emissive: 0x332211 });
const fist = new THREE.Mesh(fistGeo, fistMat);
fist.position.set(0, -0.02, 0);
fist.visible = false;
wpnGroup.add(fist);

/* Position the weapon group in camera space (bottom-right) */
wpnGroup.position.set(0.22, -0.2, -0.35);
wpnGroup.rotation.set(0, 0, -0.3); // slight tilt

/* Don't add to scene — add to camera so it follows view */
camera.add(wpnGroup);

/* Weapon must also be lit — add a small dedicated light */
const wpnLight = new THREE.PointLight(0xffeedd, 0.8, 1.5, 2);
wpnLight.position.set(0.15, -0.1, -0.3);
camera.add(wpnLight);

/* =========================================================
   SWING ANIMATION STATE
   ========================================================= */
let swinging = false;
let swingTime = 0;
const SWING_DURATION = 0.3; // seconds

/* Idle pose */
const IDLE_POS = { x: 0.22, y: -0.2, z: -0.35 };
const IDLE_ROT = { x: 0, y: 0, z: -0.3 };

/* Swing keyframes — wind up → slash across → return */
function easeOutQuad(t) { return t * (2 - t); }
function easeInQuad(t) { return t * t; }

export function startSwing() {
  if (swinging) return;
  swinging = true;
  swingTime = 0;
}

export function updateWeapon(dt) {
  /* Show/hide weapon vs fist based on equipped weapon */
  const hasWeapon = !!character.equipped.weapon;
  blade.visible = hasWeapon;
  edge.visible = hasWeapon;
  guard.visible = hasWeapon;
  grip.visible = hasWeapon;
  pommel.visible = hasWeapon;
  fist.visible = !hasWeapon;

  if (!swinging) {
    /* Idle bob */
    const bob = Math.sin(Date.now() * 0.003) * 0.004;
    wpnGroup.position.set(IDLE_POS.x, IDLE_POS.y + bob, IDLE_POS.z);
    wpnGroup.rotation.set(IDLE_ROT.x, IDLE_ROT.y, IDLE_ROT.z);
    return;
  }

  swingTime += dt;
  const t = Math.min(swingTime / SWING_DURATION, 1);

  if (t < 0.15) {
    /* Wind-up: pull back right and up */
    const p = easeOutQuad(t / 0.15);
    wpnGroup.position.set(
      IDLE_POS.x + 0.06 * p,
      IDLE_POS.y + 0.05 * p,
      IDLE_POS.z + 0.05 * p
    );
    wpnGroup.rotation.set(
      IDLE_ROT.x - 0.3 * p,
      IDLE_ROT.y - 0.2 * p,
      IDLE_ROT.z + 0.4 * p
    );
  } else if (t < 0.6) {
    /* Slash: swing left and down */
    const p = easeOutQuad((t - 0.15) / 0.45);
    wpnGroup.position.set(
      IDLE_POS.x + 0.06 - 0.28 * p,
      IDLE_POS.y + 0.05 - 0.08 * p,
      IDLE_POS.z + 0.05 - 0.06 * p
    );
    wpnGroup.rotation.set(
      IDLE_ROT.x - 0.3 + 0.7 * p,
      IDLE_ROT.y - 0.2 + 0.8 * p,
      IDLE_ROT.z + 0.4 - 1.6 * p
    );
  } else {
    /* Return to idle */
    const p = easeInQuad((t - 0.6) / 0.4);
    const fromX = IDLE_POS.x + 0.06 - 0.28;
    const fromY = IDLE_POS.y + 0.05 - 0.08;
    const fromZ = IDLE_POS.z + 0.05 - 0.06;
    const fromRx = IDLE_ROT.x - 0.3 + 0.7;
    const fromRy = IDLE_ROT.y - 0.2 + 0.8;
    const fromRz = IDLE_ROT.z + 0.4 - 1.6;
    wpnGroup.position.set(
      fromX + (IDLE_POS.x - fromX) * p,
      fromY + (IDLE_POS.y - fromY) * p,
      fromZ + (IDLE_POS.z - fromZ) * p
    );
    wpnGroup.rotation.set(
      fromRx + (IDLE_ROT.x - fromRx) * p,
      fromRy + (IDLE_ROT.y - fromRy) * p,
      fromRz + (IDLE_ROT.z - fromRz) * p
    );
  }

  if (t >= 1) {
    swinging = false;
  }
}
