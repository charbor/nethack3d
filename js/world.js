import { MAP_W, MAP_H, WALL_H, EYE_H } from './config.js';
import { player, gameState } from './state.js';
import { generateDungeon } from './dungeon.js';
import { scene, camera } from './renderer.js';
import { texWall, texFloor, texCeil } from './textures.js';

/* =========================================================
   MUTABLE WORLD STATE
   ========================================================= */
let _map, _rooms, _stairX, _stairZ, _upStairX, _upStairZ;

export function getMap()      { return _map; }
export function getRooms()    { return _rooms; }
export function getStairX()   { return _stairX; }
export function getStairZ()   { return _stairZ; }
export function getUpStairX() { return _upStairX; }
export function getUpStairZ() { return _upStairZ; }

/* Keep references so we can remove them on descent */
const worldObjects = [];

export const torchLights = [];
export let playerLight;
export let stairArrow;
export let upStairArrow;

/* =========================================================
   BUILD / REBUILD WORLD
   ========================================================= */
const blockGeo = new THREE.BoxGeometry(1, 1, 1);
const wallShades = [0.95, 0.78, 0.55];

function clearWorld() {
  for (const obj of worldObjects) {
    scene.remove(obj);
    /* Dispose material but NOT shared blockGeo */
    if (obj.geometry && obj.geometry !== blockGeo) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material.dispose();
    }
  }
  worldObjects.length = 0;
  torchLights.length = 0;
}

function buildWorld(spawnAt) {
  const dungeon = generateDungeon();
  _map    = dungeon.map;
  _rooms  = dungeon.rooms;
  _stairX = dungeon.stairX;
  _stairZ = dungeon.stairZ;

  let nWalls = 0, nFloors = 0;
  for (let z = 0; z < MAP_H; z++)
    for (let x = 0; x < MAP_W; x++)
      _map[z][x] === 1 ? nWalls++ : nFloors++;

  /* Walls */
  for (let ly = 0; ly < WALL_H; ly++) {
    const mat = new THREE.MeshLambertMaterial({
      map: texWall,
      color: new THREE.Color().setScalar(wallShades[ly]),
    });
    const mesh = new THREE.InstancedMesh(blockGeo, mat, nWalls);
    mesh.receiveShadow = true;
    scene.add(mesh);
    worldObjects.push(mesh);

    const dummy = new THREE.Object3D();
    let wi = 0;
    for (let z = 0; z < MAP_H; z++)
      for (let x = 0; x < MAP_W; x++)
        if (_map[z][x] === 1) {
          dummy.position.set(x + 0.5, ly + 0.5, z + 0.5);
          dummy.updateMatrix();
          mesh.setMatrixAt(wi, dummy.matrix);
          wi++;
        }
    mesh.instanceMatrix.needsUpdate = true;
  }

  /* Floor & ceiling */
  const meshFloor = new THREE.InstancedMesh(blockGeo,
    new THREE.MeshLambertMaterial({ map: texFloor }), nFloors);
  meshFloor.receiveShadow = true;
  scene.add(meshFloor);
  worldObjects.push(meshFloor);

  const meshCeil = new THREE.InstancedMesh(blockGeo,
    new THREE.MeshLambertMaterial({ map: texCeil, color: 0x999999 }), nFloors);
  scene.add(meshCeil);
  worldObjects.push(meshCeil);

  const dummy = new THREE.Object3D();
  let fi = 0;
  for (let z = 0; z < MAP_H; z++) {
    for (let x = 0; x < MAP_W; x++) {
      if (_map[z][x] !== 1) {
        dummy.position.set(x + 0.5, -0.5, z + 0.5);
        dummy.updateMatrix();
        meshFloor.setMatrixAt(fi, dummy.matrix);

        dummy.position.set(x + 0.5, WALL_H + 0.5, z + 0.5);
        dummy.updateMatrix();
        meshCeil.setMatrixAt(fi, dummy.matrix);
        fi++;
      }
    }
  }
  meshFloor.instanceMatrix.needsUpdate = true;
  meshCeil.instanceMatrix.needsUpdate  = true;

  /* Staircase */
  const stairDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.12, 10),
    new THREE.MeshLambertMaterial({ color: 0xffcc33, emissive: 0x886600 })
  );
  stairDisc.position.set(_stairX + 0.5, 0.06, _stairZ + 0.5);
  scene.add(stairDisc);
  worldObjects.push(stairDisc);

  stairArrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.36, 6),
    new THREE.MeshLambertMaterial({ color: 0xffcc33, emissive: 0x886600 })
  );
  stairArrow.position.set(_stairX + 0.5, 0.85, _stairZ + 0.5);
  stairArrow.rotation.z = Math.PI;
  scene.add(stairArrow);
  worldObjects.push(stairArrow);

  /* Up staircase (DL:2+) */
  if (gameState.dungeonLevel > 1) {
    const sr = _rooms[0];
    _upStairX = Math.floor(sr.x + sr.w / 2);
    _upStairZ = Math.floor(sr.y + sr.h / 2);

    const upDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.12, 10),
      new THREE.MeshLambertMaterial({ color: 0x33ccff, emissive: 0x006688 })
    );
    upDisc.position.set(_upStairX + 0.5, 0.06, _upStairZ + 0.5);
    scene.add(upDisc);
    worldObjects.push(upDisc);

    upStairArrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.36, 6),
      new THREE.MeshLambertMaterial({ color: 0x33ccff, emissive: 0x006688 })
    );
    upStairArrow.position.set(_upStairX + 0.5, 0.85, _upStairZ + 0.5);
    scene.add(upStairArrow);
    worldObjects.push(upStairArrow);

    const upLight = new THREE.PointLight(0x88eeff, 3, 5, 2);
    upLight.position.set(_upStairX + 0.5, 1.5, _upStairZ + 0.5);
    scene.add(upLight);
    worldObjects.push(upLight);
  } else {
    _upStairX = -1;
    _upStairZ = -1;
    upStairArrow = null;
  }

  /* Lighting */
  const ambient = new THREE.AmbientLight(0x0c0c18, 1);
  scene.add(ambient);
  worldObjects.push(ambient);

  for (const room of _rooms) {
    const cx = room.x + room.w / 2 + 0.5;
    const cz = room.y + room.h / 2 + 0.5;

    const main = new THREE.PointLight(0xff9933, 4.5, 14, 2);
    main.position.set(cx, 2.1, cz);
    main.userData.base  = 3.8 + Math.random() * 1.5;
    main.userData.phase = Math.random() * Math.PI * 2;
    scene.add(main);
    worldObjects.push(main);
    torchLights.push(main);

    const fill = new THREE.PointLight(0x3344aa, 0.5, 10, 2);
    fill.position.set(cx, 0.4, cz);
    scene.add(fill);
    worldObjects.push(fill);
  }

  for (let z = 5; z < MAP_H; z += 10) {
    for (let x = 5; x < MAP_W; x += 10) {
      if (_map[z][x] === 0) {
        const l = new THREE.PointLight(0xff8822, 2, 9, 2);
        l.position.set(x + 0.5, 2.1, z + 0.5);
        l.userData.base  = 1.4 + Math.random() * 0.8;
        l.userData.phase = Math.random() * Math.PI * 2;
        scene.add(l);
        worldObjects.push(l);
        torchLights.push(l);
      }
    }
  }

  const stairLight = new THREE.PointLight(0xffee88, 3, 5, 2);
  stairLight.position.set(_stairX + 0.5, 1.5, _stairZ + 0.5);
  scene.add(stairLight);
  worldObjects.push(stairLight);

  playerLight = new THREE.PointLight(0xffaa44, 2.8, 7, 2);
  scene.add(playerLight);
  worldObjects.push(playerLight);

  /* Player position */
  if (spawnAt === 'downstair') {
    player.pos = new THREE.Vector3(_stairX + 0.5, 0, _stairZ + 0.5);
  } else {
    const sr = _rooms[0];
    player.pos = new THREE.Vector3(sr.x + sr.w / 2 + 0.5, 0, sr.y + sr.h / 2 + 0.5);
  }
  camera.position.set(player.pos.x, EYE_H, player.pos.z);
}

/* Initial build */
buildWorld();

/* =========================================================
   DESCEND — called when player presses '>' on stairs
   ========================================================= */
export function descend() {
  gameState.dungeonLevel++;
  clearWorld();
  buildWorld();
}

export function ascend() {
  if (gameState.dungeonLevel <= 1) return;
  gameState.dungeonLevel--;
  clearWorld();
  buildWorld('downstair');
}

/* =========================================================
   COLLISION  (uses current _map)
   ========================================================= */
export function isBlocked(wx, wz) {
  const ix = Math.floor(wx), iz = Math.floor(wz);
  if (ix < 0 || ix >= MAP_W || iz < 0 || iz >= MAP_H) return true;
  return _map[iz][ix] === 1;
}

export function overlapsWall(px, pz, r) {
  const x0 = Math.floor(px - r), x1 = Math.floor(px + r);
  const z0 = Math.floor(pz - r), z1 = Math.floor(pz + r);
  for (let z = z0; z <= z1; z++)
    for (let x = x0; x <= x1; x++)
      if (isBlocked(x, z)) return true;
  return false;
}
