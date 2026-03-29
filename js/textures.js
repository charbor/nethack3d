function makeTexture(size, drawFn) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  drawFn(cv.getContext('2d'), size);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function addNoise(ctx, size, amount) {
  const id = ctx.getImageData(0, 0, size, size);
  const d  = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i]   = Math.max(0, Math.min(255, d[i]   + n));
    d[i+1] = Math.max(0, Math.min(255, d[i+1] + n));
    d[i+2] = Math.max(0, Math.min(255, d[i+2] + n));
  }
  ctx.putImageData(id, 0, 0);
}

export const texWall = makeTexture(128, (ctx, s) => {
  ctx.fillStyle = '#5c5c5c';
  ctx.fillRect(0, 0, s, s);
  addNoise(ctx, s, 28);

  const BH = 32, BW = 64;
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let row = 0; row < s / BH; row++) {
    const off = (row % 2) * (BW / 2);
    for (let col = -1; col < s / BW + 1; col++)
      ctx.fillRect(off + col * BW + 1, row * BH + 1, BW - 2, BH - 2);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 2;
  for (let row = 0; row <= s / BH; row++) {
    ctx.beginPath(); ctx.moveTo(0, row * BH); ctx.lineTo(s, row * BH); ctx.stroke();
    const off = (row % 2) * (BW / 2);
    for (let col = -1; col <= s / BW + 1; col++) {
      const vx = off + col * BW;
      ctx.beginPath(); ctx.moveTo(vx, row * BH); ctx.lineTo(vx, (row + 1) * BH); ctx.stroke();
    }
  }
});

export const texFloor = makeTexture(128, (ctx, s) => {
  ctx.fillStyle = '#3a342c';
  ctx.fillRect(0, 0, s, s);
  addNoise(ctx, s, 22);
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= s; i += 16) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
  }
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * s, y = Math.random() * s;
    const r = 2 + Math.random() * 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(90,80,65,0.28)'; ctx.fill();
  }
});

export const texCeil = makeTexture(64, (ctx, s) => {
  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(0, 0, s, s);
  addNoise(ctx, s, 14);
});
