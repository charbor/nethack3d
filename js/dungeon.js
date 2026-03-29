import { MAP_W, MAP_H } from './config.js';

export function generateDungeon() {
  const map = Array.from({ length: MAP_H }, () => new Uint8Array(MAP_W).fill(1));
  const rooms = [];

  for (let attempt = 0; attempt < 120; attempt++) {
    const rw = 6 + Math.floor(Math.random() * 9);
    const rh = 6 + Math.floor(Math.random() * 9);
    const rx = 2 + Math.floor(Math.random() * (MAP_W - rw - 4));
    const ry = 2 + Math.floor(Math.random() * (MAP_H - rh - 4));

    let ok = true;
    for (const r of rooms) {
      if (rx < r.x + r.w + 2 && rx + rw > r.x - 2 &&
          ry < r.y + r.h + 2 && ry + rh > r.y - 2) {
        ok = false; break;
      }
    }
    if (!ok) continue;

    rooms.push({ x: rx, y: ry, w: rw, h: rh });
    for (let cy = ry; cy < ry + rh; cy++)
      for (let cx = rx; cx < rx + rw; cx++)
        map[cy][cx] = 0;
  }

  rooms.sort((a, b) => (a.x + a.y) - (b.x + b.y));

  function carve(cx, cy) {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx >= 1 && nx < MAP_W - 1 && ny >= 1 && ny < MAP_H - 1)
          map[ny][nx] = 0;
      }
  }

  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1], b = rooms[i];
    const ax = Math.floor(a.x + a.w / 2);
    const ay = Math.floor(a.y + a.h / 2);
    const bx = Math.floor(b.x + b.w / 2);
    const by = Math.floor(b.y + b.h / 2);

    const hx0 = Math.min(ax, bx), hx1 = Math.max(ax, bx);
    for (let cx = hx0; cx <= hx1; cx++) carve(cx, ay);

    const vy0 = Math.min(ay, by), vy1 = Math.max(ay, by);
    for (let cy = vy0; cy <= vy1; cy++) carve(bx, cy);
  }

  const last = rooms[rooms.length - 1];
  const stairX = Math.floor(last.x + last.w / 2);
  const stairZ = Math.floor(last.y + last.h / 2);

  return { map, rooms, stairX, stairZ };
}
