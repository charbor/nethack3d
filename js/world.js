import { MAP_W, MAP_H, WALL_H, EYE_H } from './config.js';
import { player } from './state.js';
import { generateDungeon } from './dungeon.js';
import { scene, camera } from './renderer.js';
import { texWall, texFloor, texCeil } from './textures.js';

/* =========================================================
   BUILD WORLD
   ========================================================= */
const { map, rooms, stairX, stairZ } = generateDungeon();
export { map, rooms, stairX, stairZ };

let nWalls = 0, nFloors = 0;
for (let z = 0; z < MAP_H; z++)
  for (let x = 0; x < MAP_W; x++)
    map[z][x] === 1 ? nWalls++ : nFloors++;

const blockGeo = new THREE.BoxGeometry(1, 1, 1);

const wallShades   = [0.95, 0.78, 0.55];
const wallLayers   = [];
for (let ly = 0; ly < WALL_H; ly++) {
  const mat = new THREE.MeshLambertMaterial({
    map: texWall,
    color: new THREE.Color().setScalar(wallShades[ly]),
  });
  const mesh = new THREE.InstancedMesh(blockGeo, mat, nWalls);
  mesh.receiveShadow = true;
  scene.add(mesh);
  wallLayers.push(mesh);
}

const meshFloor = new THREE.InstancedMesh(blockGeo,
  new THREE.MeshLambertMaterial({ map: texFloor }), nFloors);
meshFloor.receiveShadow = true;
scene.add(meshFloor);

const meshCeil = new THREE.InstancedMesh(blockGeo,
  new THREE.MeshLambertMaterial({ map: texCeil, color: 0x999999 }), nFloors);
scene.add(meshCeil);

const dummy = new THREE.Object3D();
let wi = 0, fi = 0;

for (let z = 0; z < MAP_H; z++) {
  for (let x = 0; x < MAP_W; x++) {
    const cx = x + 0.5, cz = z + 0.5;
    if (map[z][x] === 1) {
      for (let ly = 0; ly < WALL_H; ly++) {
        dummy.position.set(cx, ly + 0.5, cz);
        dummy.updateMatrix();
        wallLayers[ly].setMatrixAt(wi, dummy.matrix);
      }
      wi++;
    } else {
      dummy.position.set(cx, -0.5, cz);
      dummy.updateMatrix();
      meshFloor.setMatrixAt(fi, dummy.matrix);

      dummy.position.set(cx, WALL_H + 0.5, cz);
      dummy.updateMatrix();
      meshCeil.setMatrixAt(fi, dummy.matrix);
      fi++;
    }
  }
}

for (const m of wallLayers) m.instanceMatrix.needsUpdate = true;
meshFloor.instanceMatrix.needsUpdate = true;
meshCeil.instanceMatrix.needsUpdate  = true;

/* Staircase */
const stairDisc = new THREE.Mesh(
  new THREE.CylinderGeometry(0.42, 0.42, 0.12, 10),
  new THREE.MeshLambertMaterial({ color: 0xffcc33, emissive: 0x886600 })
);
stairDisc.position.set(stairX + 0.5, 0.06, stairZ + 0.5);
scene.add(stairDisc);

export const stairArrow = new THREE.Mesh(
  new THREE.ConeGeometry(0.14, 0.36, 6),
  new THREE.MeshLambertMaterial({ color: 0xffcc33, emissive: 0x886600 })
);
stairArrow.position.set(stairX + 0.5, 0.85, stairZ + 0.5);
stairArrow.rotation.z = Math.PI;
scene.add(stairArrow);

/* =========================================================
   LIGHTING
   ========================================================= */
scene.add(new THREE.AmbientLight(0x0c0c18, 1));

export const torchLights = [];

for (const room of rooms) {
  const cx = room.x + room.w / 2 + 0.5;
  const cz = room.y + room.h / 2 + 0.5;

  const main = new THREE.PointLight(0xff9933, 4.5, 14, 2);
  main.position.set(cx, 2.1, cz);
  main.userData.base  = 3.8 + Math.random() * 1.5;
  main.userData.phase = Math.random() * Math.PI * 2;
  scene.add(main);
  torchLights.push(main);

  const fill = new THREE.PointLight(0x3344aa, 0.5, 10, 2);
  fill.position.set(cx, 0.4, cz);
  scene.add(fill);
}

for (let z = 5; z < MAP_H; z += 10) {
  for (let x = 5; x < MAP_W; x += 10) {
    if (map[z][x] === 0) {
      const l = new THREE.PointLight(0xff8822, 2, 9, 2);
      l.position.set(x + 0.5, 2.1, z + 0.5);
      l.userData.base  = 1.4 + Math.random() * 0.8;
      l.userData.phase = Math.random() * Math.PI * 2;
      scene.add(l);
      torchLights.push(l);
    }
  }
}

const stairLight = new THREE.PointLight(0xffee88, 3, 5, 2);
stairLight.position.set(stairX + 0.5, 1.5, stairZ + 0.5);
scene.add(stairLight);

export const playerLight = new THREE.PointLight(0xffaa44, 2.8, 7, 2);
scene.add(playerLight);

/* =========================================================
   PLAYER INIT
   ========================================================= */
const sr = rooms[0];
player.pos = new THREE.Vector3(sr.x + sr.w / 2 + 0.5, 0, sr.y + sr.h / 2 + 0.5);
camera.position.set(player.pos.x, EYE_H, player.pos.z);

/* =========================================================
   COLLISION
   ========================================================= */
export function isBlocked(wx, wz) {
  const ix = Math.floor(wx), iz = Math.floor(wz);
  if (ix < 0 || ix >= MAP_W || iz < 0 || iz >= MAP_H) return true;
  return map[iz][ix] === 1;
}

export function overlapsWall(px, pz, r) {
  const x0 = Math.floor(px - r), x1 = Math.floor(px + r);
  const z0 = Math.floor(pz - r), z1 = Math.floor(pz + r);
  for (let z = z0; z <= z1; z++)
    for (let x = x0; x <= x1; x++)
      if (isBlocked(x, z)) return true;
  return false;
}
