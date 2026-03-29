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
   3D MONSTER MESHES — built from basic geometries
   ========================================================= */

/* Shared eye material — glows in the dark */
const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
const yellowEyeMat = new THREE.MeshBasicMaterial({ color: 0xeecc00 });
const orangeEyeMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
const soulFireMat = new THREE.MeshBasicMaterial({ color: 0xff3322 });

/* Per-type materials (created once, shared across instances) */
const mats = {
  rat: {
    body: new THREE.MeshLambertMaterial({ color: 0x6a4a18 }),
    head: new THREE.MeshLambertMaterial({ color: 0x7a5a20 }),
    tail: new THREE.MeshLambertMaterial({ color: 0x5a3a10 }),
    nose: new THREE.MeshLambertMaterial({ color: 0xffaaaa }),
  },
  bat: {
    body: new THREE.MeshLambertMaterial({ color: 0x2a2a30 }),
    wing: new THREE.MeshLambertMaterial({ color: 0x222228, side: THREE.DoubleSide }),
    fang: new THREE.MeshLambertMaterial({ color: 0xeeeeee }),
  },
  kobold: {
    body: new THREE.MeshLambertMaterial({ color: 0x2a5a2a }),
    head: new THREE.MeshLambertMaterial({ color: 0x3a7a3a }),
    arm: new THREE.MeshLambertMaterial({ color: 0x2a5a2a }),
    shaft: new THREE.MeshLambertMaterial({ color: 0x8a6a30 }),
    tip: new THREE.MeshLambertMaterial({ color: 0xbbbbbb }),
  },
  goblin: {
    body: new THREE.MeshLambertMaterial({ color: 0x1a4a2a }),
    head: new THREE.MeshLambertMaterial({ color: 0x2a7a4a }),
    arm: new THREE.MeshLambertMaterial({ color: 0x1a5a3a }),
    belt: new THREE.MeshLambertMaterial({ color: 0x8a6a30 }),
    club: new THREE.MeshLambertMaterial({ color: 0x654433 }),
    tusk: new THREE.MeshLambertMaterial({ color: 0xeeeedd }),
  },
  skeleton: {
    bone: new THREE.MeshLambertMaterial({ color: 0xddd8cc }),
    dark: new THREE.MeshLambertMaterial({ color: 0x0a0808 }),
    sword: new THREE.MeshLambertMaterial({ color: 0x998877 }),
  },
  orc: {
    body: new THREE.MeshLambertMaterial({ color: 0x5a1a1a }),
    head: new THREE.MeshLambertMaterial({ color: 0x993838 }),
    armor: new THREE.MeshLambertMaterial({ color: 0x555555 }),
    tusk: new THREE.MeshLambertMaterial({ color: 0xeeeedd }),
    shaft: new THREE.MeshLambertMaterial({ color: 0x7a5520 }),
    axe: new THREE.MeshLambertMaterial({ color: 0x888888 }),
  },
};

/* Shared geometry cache */
const geo = {
  eyeSmall: new THREE.SphereGeometry(0.02, 6, 4),
  eyeMed:   new THREE.SphereGeometry(0.03, 6, 4),
  eyeLg:    new THREE.SphereGeometry(0.04, 6, 4),
};

function buildMonsterMesh(type) {
  const g = new THREE.Group();

  switch (type.name) {

    /* ── RAT ── */
    case 'rat': {
      // Body — flat elongated box
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.1, 0.28),
        mats.rat.body
      );
      body.position.y = 0.05;
      g.add(body);

      // Head — small sphere with cone snout
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 6),
        mats.rat.head
      );
      head.position.set(0, 0.08, -0.18);
      g.add(head);

      const snout = new THREE.Mesh(
        new THREE.ConeGeometry(0.03, 0.06, 6),
        mats.rat.head
      );
      snout.rotation.x = -Math.PI / 2;
      snout.position.set(0, 0.06, -0.26);
      g.add(snout);

      // Nose
      const nose = new THREE.Mesh(geo.eyeSmall, mats.rat.nose);
      nose.position.set(0, 0.06, -0.29);
      g.add(nose);

      // Eyes
      const eyeL = new THREE.Mesh(geo.eyeSmall, eyeMat);
      eyeL.position.set(-0.04, 0.11, -0.2);
      g.add(eyeL);
      const eyeR = new THREE.Mesh(geo.eyeSmall, eyeMat);
      eyeR.position.set(0.04, 0.11, -0.2);
      g.add(eyeR);

      // Ears
      const earGeo = new THREE.SphereGeometry(0.025, 6, 4);
      const earL = new THREE.Mesh(earGeo, mats.rat.head);
      earL.position.set(-0.04, 0.13, -0.16);
      earL.scale.set(1, 1.4, 0.6);
      g.add(earL);
      const earR = new THREE.Mesh(earGeo, mats.rat.head);
      earR.position.set(0.04, 0.13, -0.16);
      earR.scale.set(1, 1.4, 0.6);
      g.add(earR);

      // Tail — thin cylinder curved back
      const tail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.004, 0.22, 4),
        mats.rat.tail
      );
      tail.position.set(0, 0.08, 0.2);
      tail.rotation.x = 0.8;
      g.add(tail);

      // Feet
      const footGeo = new THREE.BoxGeometry(0.04, 0.02, 0.04);
      for (const xOff of [-0.07, 0.07]) {
        for (const zOff of [-0.08, 0.08]) {
          const foot = new THREE.Mesh(footGeo, mats.rat.tail);
          foot.position.set(xOff, 0.01, zOff);
          g.add(foot);
        }
      }
      break;
    }

    /* ── BAT ── */
    case 'bat': {
      // Body (small sphere)
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 6),
        mats.bat.body
      );
      body.position.y = 0.08;
      g.add(body);

      // Wings — PlaneGeometry angled out
      const wingGeo = new THREE.PlaneGeometry(0.28, 0.14, 3, 1);
      // Warp wing vertices for bat shape
      const wingL = new THREE.Mesh(wingGeo, mats.bat.wing);
      wingL.position.set(-0.2, 0.1, 0);
      wingL.rotation.set(0, 0, 0.3);
      g.add(wingL);

      const wingR = new THREE.Mesh(wingGeo.clone(), mats.bat.wing);
      wingR.position.set(0.2, 0.1, 0);
      wingR.rotation.set(0, 0, -0.3);
      g.add(wingR);

      // Ears — small cones
      const earGeo = new THREE.ConeGeometry(0.02, 0.06, 4);
      const earL = new THREE.Mesh(earGeo, mats.bat.body);
      earL.position.set(-0.03, 0.16, -0.02);
      g.add(earL);
      const earR = new THREE.Mesh(earGeo, mats.bat.body);
      earR.position.set(0.03, 0.16, -0.02);
      g.add(earR);

      // Eyes
      const eyeL = new THREE.Mesh(geo.eyeSmall, eyeMat);
      eyeL.position.set(-0.04, 0.1, -0.06);
      g.add(eyeL);
      const eyeR = new THREE.Mesh(geo.eyeSmall, eyeMat);
      eyeR.position.set(0.04, 0.1, -0.06);
      g.add(eyeR);

      // Fangs
      const fangGeo = new THREE.ConeGeometry(0.008, 0.03, 3);
      const fangL = new THREE.Mesh(fangGeo, mats.bat.fang);
      fangL.position.set(-0.015, 0.0, -0.06);
      fangL.rotation.x = Math.PI;
      g.add(fangL);
      const fangR = new THREE.Mesh(fangGeo, mats.bat.fang);
      fangR.position.set(0.015, 0.0, -0.06);
      fangR.rotation.x = Math.PI;
      g.add(fangR);
      break;
    }

    /* ── KOBOLD ── */
    case 'kobold': {
      // Torso
      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.3, 0.14),
        mats.kobold.body
      );
      torso.position.y = 0.25;
      g.add(torso);

      // Head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 6),
        mats.kobold.head
      );
      head.position.set(0, 0.46, 0);
      g.add(head);

      // Snout
      const snout = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.08, 6),
        mats.kobold.head
      );
      snout.rotation.x = -Math.PI / 2;
      snout.position.set(0, 0.43, -0.1);
      g.add(snout);

      // Eyes — yellow
      const eyeL = new THREE.Mesh(geo.eyeMed, yellowEyeMat);
      eyeL.position.set(-0.05, 0.49, -0.06);
      g.add(eyeL);
      const eyeR = new THREE.Mesh(geo.eyeMed, yellowEyeMat);
      eyeR.position.set(0.05, 0.49, -0.06);
      g.add(eyeR);

      // Arms — thin boxes
      const armGeo = new THREE.BoxGeometry(0.05, 0.2, 0.05);
      const armL = new THREE.Mesh(armGeo, mats.kobold.arm);
      armL.position.set(-0.15, 0.22, 0);
      armL.rotation.z = 0.3;
      g.add(armL);
      const armR = new THREE.Mesh(armGeo, mats.kobold.arm);
      armR.position.set(0.15, 0.22, 0);
      armR.rotation.z = -0.3;
      g.add(armR);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.06, 0.12, 0.06);
      const legL = new THREE.Mesh(legGeo, mats.kobold.arm);
      legL.position.set(-0.06, 0.06, 0);
      g.add(legL);
      const legR = new THREE.Mesh(legGeo, mats.kobold.arm);
      legR.position.set(0.06, 0.06, 0);
      g.add(legR);

      // Spear — shaft + tip
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.55, 4),
        mats.kobold.shaft
      );
      shaft.position.set(0.2, 0.35, 0);
      g.add(shaft);
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.025, 0.08, 4),
        mats.kobold.tip
      );
      tip.position.set(0.2, 0.63, 0);
      g.add(tip);
      break;
    }

    /* ── GOBLIN ── */
    case 'goblin': {
      // Stocky torso
      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.36, 0.18),
        mats.goblin.body
      );
      torso.position.y = 0.28;
      g.add(torso);

      // Belt
      const belt = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.04, 0.2),
        mats.goblin.belt
      );
      belt.position.y = 0.14;
      g.add(belt);

      // Head — round, wide
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 6),
        mats.goblin.head
      );
      head.position.set(0, 0.54, 0);
      g.add(head);

      // Brow ridge
      const brow = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.03, 0.08),
        mats.goblin.body
      );
      brow.position.set(0, 0.58, -0.08);
      g.add(brow);

      // Eyes — orange menacing
      const eyeL = new THREE.Mesh(geo.eyeMed, orangeEyeMat);
      eyeL.position.set(-0.06, 0.55, -0.1);
      g.add(eyeL);
      const eyeR = new THREE.Mesh(geo.eyeMed, orangeEyeMat);
      eyeR.position.set(0.06, 0.55, -0.1);
      g.add(eyeR);

      // Tusks
      const tuskGeo = new THREE.ConeGeometry(0.015, 0.05, 4);
      const tuskL = new THREE.Mesh(tuskGeo, mats.goblin.tusk);
      tuskL.position.set(-0.05, 0.44, -0.1);
      g.add(tuskL);
      const tuskR = new THREE.Mesh(tuskGeo, mats.goblin.tusk);
      tuskR.position.set(0.05, 0.44, -0.1);
      g.add(tuskR);

      // Ears — pointed cones sideways
      const earGeo = new THREE.ConeGeometry(0.02, 0.08, 4);
      const earL = new THREE.Mesh(earGeo, mats.goblin.head);
      earL.position.set(-0.14, 0.55, 0);
      earL.rotation.z = Math.PI / 2;
      g.add(earL);
      const earR = new THREE.Mesh(earGeo, mats.goblin.head);
      earR.position.set(0.14, 0.55, 0);
      earR.rotation.z = -Math.PI / 2;
      g.add(earR);

      // Arms
      const armGeo = new THREE.BoxGeometry(0.06, 0.24, 0.06);
      const armL = new THREE.Mesh(armGeo, mats.goblin.arm);
      armL.position.set(-0.2, 0.24, 0);
      armL.rotation.z = 0.25;
      g.add(armL);
      const armR = new THREE.Mesh(armGeo, mats.goblin.arm);
      armR.position.set(0.2, 0.24, 0);
      armR.rotation.z = -0.25;
      g.add(armR);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.08, 0.14, 0.08);
      const legL = new THREE.Mesh(legGeo, mats.goblin.arm);
      legL.position.set(-0.08, 0.07, 0);
      g.add(legL);
      const legR = new THREE.Mesh(legGeo, mats.goblin.arm);
      legR.position.set(0.08, 0.07, 0);
      g.add(legR);

      // Club
      const clubShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.3, 4),
        mats.goblin.club
      );
      clubShaft.position.set(-0.26, 0.28, 0);
      g.add(clubShaft);
      const clubHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 6, 4),
        mats.goblin.club
      );
      clubHead.position.set(-0.26, 0.44, 0);
      g.add(clubHead);
      break;
    }

    /* ── SKELETON ── */
    case 'skeleton': {
      // Skull
      const skull = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 6),
        mats.skeleton.bone
      );
      skull.position.set(0, 0.62, 0);
      skull.scale.set(1, 1.1, 0.9);
      g.add(skull);

      // Eye sockets (dark spheres slightly bigger than eyes)
      const socketGeo = new THREE.SphereGeometry(0.035, 6, 4);
      const socketL = new THREE.Mesh(socketGeo, mats.skeleton.dark);
      socketL.position.set(-0.04, 0.64, -0.08);
      g.add(socketL);
      const socketR = new THREE.Mesh(socketGeo, mats.skeleton.dark);
      socketR.position.set(0.04, 0.64, -0.08);
      g.add(socketR);

      // Soul fire eyes
      const eyeL = new THREE.Mesh(geo.eyeSmall, soulFireMat);
      eyeL.position.set(-0.04, 0.64, -0.09);
      g.add(eyeL);
      const eyeR = new THREE.Mesh(geo.eyeSmall, soulFireMat);
      eyeR.position.set(0.04, 0.64, -0.09);
      g.add(eyeR);

      // Jaw
      const jaw = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.03, 0.06),
        mats.skeleton.bone
      );
      jaw.position.set(0, 0.53, -0.03);
      g.add(jaw);

      // Spine
      const spine = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4),
        mats.skeleton.bone
      );
      spine.position.set(0, 0.38, 0);
      g.add(spine);

      // Ribcage — 4 horizontal thin boxes
      for (let i = 0; i < 4; i++) {
        const rib = new THREE.Mesh(
          new THREE.BoxGeometry(0.22 - i * 0.02, 0.012, 0.08),
          mats.skeleton.bone
        );
        rib.position.set(0, 0.48 - i * 0.04, 0);
        g.add(rib);
      }

      // Arms — thin cylinders
      const armGeo = new THREE.CylinderGeometry(0.012, 0.01, 0.25, 4);
      const armL = new THREE.Mesh(armGeo, mats.skeleton.bone);
      armL.position.set(-0.14, 0.38, 0);
      armL.rotation.z = 0.2;
      g.add(armL);
      const armR = new THREE.Mesh(armGeo, mats.skeleton.bone);
      armR.position.set(0.14, 0.38, 0);
      armR.rotation.z = -0.2;
      g.add(armR);

      // Pelvis
      const pelvis = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.04, 0.08),
        mats.skeleton.bone
      );
      pelvis.position.set(0, 0.22, 0);
      g.add(pelvis);

      // Legs
      const legGeo = new THREE.CylinderGeometry(0.015, 0.012, 0.2, 4);
      const legL = new THREE.Mesh(legGeo, mats.skeleton.bone);
      legL.position.set(-0.05, 0.1, 0);
      g.add(legL);
      const legR = new THREE.Mesh(legGeo, mats.skeleton.bone);
      legR.position.set(0.05, 0.1, 0);
      g.add(legR);

      // Rusty sword
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.25, 0.005),
        mats.skeleton.sword
      );
      blade.position.set(0.2, 0.42, 0);
      g.add(blade);
      const hilt = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.02, 0.02),
        mats.skeleton.bone
      );
      hilt.position.set(0.2, 0.28, 0);
      g.add(hilt);
      break;
    }

    /* ── ORC ── */
    case 'orc': {
      // Massive torso
      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.46, 0.22),
        mats.orc.body
      );
      torso.position.y = 0.35;
      g.add(torso);

      // Chest plate
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.2, 0.24),
        mats.orc.armor
      );
      plate.position.set(0, 0.42, 0);
      g.add(plate);

      // Head — box, heavy jaw
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.18, 0.18),
        mats.orc.head
      );
      head.position.set(0, 0.68, 0);
      g.add(head);

      // Heavy brow
      const brow = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.04, 0.1),
        mats.orc.body
      );
      brow.position.set(0, 0.74, -0.06);
      g.add(brow);

      // Eyes — burning orange
      const eyeL = new THREE.Mesh(geo.eyeLg, orangeEyeMat);
      eyeL.position.set(-0.06, 0.7, -0.09);
      g.add(eyeL);
      const eyeR = new THREE.Mesh(geo.eyeLg, orangeEyeMat);
      eyeR.position.set(0.06, 0.7, -0.09);
      g.add(eyeR);

      // Tusks
      const tuskGeo = new THREE.ConeGeometry(0.02, 0.07, 4);
      const tuskL = new THREE.Mesh(tuskGeo, mats.orc.tusk);
      tuskL.position.set(-0.06, 0.6, -0.09);
      g.add(tuskL);
      const tuskR = new THREE.Mesh(tuskGeo, mats.orc.tusk);
      tuskR.position.set(0.06, 0.6, -0.09);
      g.add(tuskR);

      // Ears
      const earGeo = new THREE.ConeGeometry(0.025, 0.06, 4);
      const earL = new THREE.Mesh(earGeo, mats.orc.head);
      earL.position.set(-0.13, 0.7, 0);
      earL.rotation.z = Math.PI / 2;
      g.add(earL);
      const earR = new THREE.Mesh(earGeo, mats.orc.head);
      earR.position.set(0.13, 0.7, 0);
      earR.rotation.z = -Math.PI / 2;
      g.add(earR);

      // Arms — thick boxes
      const armGeo = new THREE.BoxGeometry(0.08, 0.3, 0.08);
      const armL = new THREE.Mesh(armGeo, mats.orc.head);
      armL.position.set(-0.24, 0.32, 0);
      armL.rotation.z = 0.15;
      g.add(armL);
      const armR = new THREE.Mesh(armGeo, mats.orc.head);
      armR.position.set(0.24, 0.32, 0);
      armR.rotation.z = -0.15;
      g.add(armR);

      // Bracers
      const bracerGeo = new THREE.BoxGeometry(0.09, 0.06, 0.09);
      const bracerL = new THREE.Mesh(bracerGeo, mats.orc.armor);
      bracerL.position.set(-0.24, 0.24, 0);
      g.add(bracerL);
      const bracerR = new THREE.Mesh(bracerGeo, mats.orc.armor);
      bracerR.position.set(0.24, 0.24, 0);
      g.add(bracerR);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.1, 0.18, 0.1);
      const legL = new THREE.Mesh(legGeo, mats.orc.body);
      legL.position.set(-0.1, 0.09, 0);
      g.add(legL);
      const legR = new THREE.Mesh(legGeo, mats.orc.body);
      legR.position.set(0.1, 0.09, 0);
      g.add(legR);

      // Boots
      const bootGeo = new THREE.BoxGeometry(0.11, 0.06, 0.14);
      const bootL = new THREE.Mesh(bootGeo, mats.orc.armor);
      bootL.position.set(-0.1, 0.03, -0.01);
      g.add(bootL);
      const bootR = new THREE.Mesh(bootGeo, mats.orc.armor);
      bootR.position.set(0.1, 0.03, -0.01);
      g.add(bootR);

      // Battle axe — shaft + head
      const axeShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.55, 4),
        mats.orc.shaft
      );
      axeShaft.position.set(-0.32, 0.4, 0);
      g.add(axeShaft);
      // Axe head — flat box
      const axeHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.14, 0.02),
        mats.orc.axe
      );
      axeHead.position.set(-0.38, 0.6, 0);
      g.add(axeHead);
      break;
    }

    default: {
      // Fallback sphere
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 6),
        new THREE.MeshLambertMaterial({ color: 0xaa3333 })
      );
      body.position.y = 0.15;
      g.add(body);
      const eyeL = new THREE.Mesh(geo.eyeMed, eyeMat);
      eyeL.position.set(-0.06, 0.2, -0.12);
      g.add(eyeL);
      const eyeR = new THREE.Mesh(geo.eyeMed, eyeMat);
      eyeR.position.set(0.06, 0.2, -0.12);
      g.add(eyeR);
    }
  }

  return g;
}

/* =========================================================
   HP BAR (stays as Sprite — appropriate for 2D overlay)
   ========================================================= */
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

/* Store original colors so we can restore after hit flash */
function cacheColors(group) {
  group.traverse(ch => {
    if (ch.isMesh && ch.material && ch.material.color) {
      ch.userData._origColor = ch.material.color.getHex();
    }
  });
}

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

      const sprite = buildMonsterMesh(type);
      cacheColors(sprite);
      sprite.position.set(mx, 0, mz);
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

    /* Hit flash countdown */
    if (m.flashTimer > 0) {
      m.flashTimer -= dt;
      if (m.flashTimer <= 0) {
        /* Restore original colors */
        m.sprite.traverse(ch => {
          if (ch.isMesh && ch.material && ch.userData._origColor !== undefined) {
            ch.material.color.setHex(ch.userData._origColor);
          }
        });
      }
    }

    /* Bob animation */
    m.bobPhase += dt * (m.state === 'chase' ? 8 : 2.5);
    const bob = Math.sin(m.bobPhase) * (m.state === 'chase' ? 0.06 : 0.03);
    const baseY = 0; // 3D meshes are built from ground up

    /* Update position */
    m.sprite.position.set(m.x, baseY + bob, m.z);
    m.hpBar.sprite.position.set(m.x, m.type.size * 1.4 + 0.1 + bob, m.z);

    /* Face the player when chasing/attacking */
    if (m.state !== 'idle') {
      m.sprite.rotation.y = Math.atan2(dx, dz);
    }

    /* Aggro pulse — scale up slightly when chasing/attacking */
    const pulse = m.state !== 'idle' ? Math.sin(m.bobPhase * 2) * 0.04 : 0;
    const s = 1 + pulse;
    m.sprite.scale.set(s, s, s);

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
const _atkDir = new THREE.Vector3();

export function updatePlayerAttack(dt) {
  if (playerAtkCooldown > 0) playerAtkCooldown -= dt;
}

export function tryPlayerAttack() {
  if (!gameState.started || gameState.inventoryOpen) return;
  if (playerAtkCooldown > 0) return;

  /* Find closest monster in front of player within attack range */
  const dir = _atkDir;
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

  /* Flash red — set all meshes, timer-based restore in updateMonsters */
  bestMon.flashTimer = 0.12;
  bestMon.sprite.traverse(ch => {
    if (ch.isMesh && ch.material && ch.material.color) {
      ch.material.color.set(0xff4444);
    }
  });

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
