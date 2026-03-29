import { ITEMS } from './config.js';

export const ICON_SZ = 32;

export const CAT_COLORS = {
  Weapons: '#6cf', Armor: '#ca6', Potions: '#f6f',
  Scrolls: '#eee', Food: '#8f8', Tools: '#aaa',
};

export function drawIcon(id) {
  const cv  = document.createElement('canvas');
  cv.width = cv.height = ICON_SZ;
  const c = cv.getContext('2d');
  const S = ICON_SZ;
  const col = CAT_COLORS[ITEMS[id].cat] || '#fff';

  c.lineCap = 'round'; c.lineJoin = 'round';

  switch (id) {
    case 'longsword':
      c.strokeStyle = '#ccc'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(8,24); c.lineTo(24,4); c.stroke();
      c.strokeStyle = '#864'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(6,26); c.lineTo(10,22); c.stroke();
      c.strokeStyle = '#aa8'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(11,20); c.lineTo(17,17); c.stroke();
      c.beginPath(); c.moveTo(14,23); c.lineTo(8,17); c.stroke();
      break;
    case 'shortsword':
      c.strokeStyle = '#ccc'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(10,22); c.lineTo(22,8); c.stroke();
      c.strokeStyle = '#864'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(8,24); c.lineTo(11,21); c.stroke();
      c.strokeStyle = '#aa8'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(12,19); c.lineTo(16,17); c.stroke();
      break;
    case 'dagger':
      c.strokeStyle = '#bbb'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(14,22); c.lineTo(22,10); c.stroke();
      c.strokeStyle = '#864'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(12,24); c.lineTo(15,21); c.stroke();
      break;
    case 'staff':
      c.strokeStyle = '#965'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(16,28); c.lineTo(16,6); c.stroke();
      c.fillStyle = '#aaf'; c.beginPath(); c.arc(16,5,4,0,Math.PI*2); c.fill();
      c.fillStyle = '#ccf'; c.beginPath(); c.arc(16,5,2,0,Math.PI*2); c.fill();
      break;
    case 'bow':
      c.strokeStyle = '#965'; c.lineWidth = 2;
      c.beginPath(); c.arc(20, 16, 12, Math.PI*0.65, Math.PI*1.35); c.stroke();
      c.strokeStyle = '#ccc'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(11,5); c.lineTo(11,27); c.stroke();
      break;
    case 'mace':
      c.strokeStyle = '#864'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(14,26); c.lineTo(14,12); c.stroke();
      c.fillStyle = '#999'; c.beginPath(); c.arc(14,9,5,0,Math.PI*2); c.fill();
      c.fillStyle = '#bbb'; c.beginPath(); c.arc(14,9,3,0,Math.PI*2); c.fill();
      break;
    case 'chainmail':
      c.strokeStyle = '#999'; c.lineWidth = 1;
      for (let row = 0; row < 4; row++)
        for (let col2 = 0; col2 < 4; col2++) {
          const ox = 7 + col2*5 + (row%2)*2.5, oy = 8 + row*5;
          c.beginPath(); c.arc(ox,oy,2.5,0,Math.PI*2); c.stroke();
        }
      c.strokeStyle = '#777'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(10,6); c.lineTo(16,4); c.lineTo(22,6); c.stroke();
      break;
    case 'leather':
      c.fillStyle = '#864';
      c.beginPath();
      c.moveTo(10,6); c.lineTo(22,6); c.lineTo(24,12); c.lineTo(24,24);
      c.lineTo(8,24); c.lineTo(8,12); c.closePath(); c.fill();
      c.strokeStyle = '#653'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(16,6); c.lineTo(16,24); c.stroke();
      c.beginPath(); c.moveTo(12,12); c.lineTo(20,12); c.stroke();
      break;
    case 'robe':
      c.fillStyle = '#448';
      c.beginPath();
      c.moveTo(10,4); c.lineTo(22,4); c.lineTo(26,28); c.lineTo(6,28); c.closePath();
      c.fill();
      c.strokeStyle = '#336'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(16,4); c.lineTo(16,28); c.stroke();
      c.fillStyle = '#669';
      c.fillRect(12, 4, 8, 3);
      break;
    case 'cloak':
      c.fillStyle = '#363';
      c.beginPath();
      c.moveTo(8,6); c.quadraticCurveTo(16,2,24,6);
      c.lineTo(26,26); c.quadraticCurveTo(16,22,6,26);
      c.closePath(); c.fill();
      c.strokeStyle = '#2a2'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(16,4); c.lineTo(16,24); c.stroke();
      break;
    case 'shield':
      c.fillStyle = '#865';
      c.beginPath();
      c.moveTo(16,4); c.lineTo(26,10); c.lineTo(24,24);
      c.quadraticCurveTo(16,30,8,24);
      c.lineTo(6,10); c.closePath(); c.fill();
      c.strokeStyle = '#ca8'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(16,6); c.lineTo(16,26); c.stroke();
      c.beginPath(); c.moveTo(8,14); c.lineTo(24,14); c.stroke();
      break;
    case 'healPotion':
      c.fillStyle = '#f24';
      c.beginPath();
      c.moveTo(12,14); c.lineTo(12,24); c.quadraticCurveTo(12,28,16,28);
      c.quadraticCurveTo(20,28,20,24); c.lineTo(20,14); c.closePath(); c.fill();
      c.fillStyle = '#ccc';
      c.fillRect(13,10,6,5);
      c.fillStyle = '#aaa';
      c.fillRect(13,8,6,3);
      c.fillStyle = '#f68';
      c.fillRect(14,16,2,6);
      break;
    case 'manaPotion':
      c.fillStyle = '#44f';
      c.beginPath();
      c.moveTo(12,14); c.lineTo(12,24); c.quadraticCurveTo(12,28,16,28);
      c.quadraticCurveTo(20,28,20,24); c.lineTo(20,14); c.closePath(); c.fill();
      c.fillStyle = '#ccc';
      c.fillRect(13,10,6,5);
      c.fillStyle = '#aaa';
      c.fillRect(13,8,6,3);
      c.fillStyle = '#88f';
      c.fillRect(14,16,2,6);
      break;
    case 'foodRation':
      c.fillStyle = '#a86';
      c.beginPath();
      c.ellipse(16,18,9,6,0,0,Math.PI*2); c.fill();
      c.strokeStyle = '#865'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(8,18); c.lineTo(24,18); c.stroke();
      c.fillStyle = '#c97';
      c.beginPath();
      c.ellipse(16,16,8,4,0,Math.PI,Math.PI*2); c.fill();
      break;
    case 'scrollTele':
      c.fillStyle = '#eed';
      c.fillRect(10,6,12,20);
      c.fillStyle = '#ddc';
      c.fillRect(8,6,16,3); c.fillRect(8,23,16,3);
      c.strokeStyle = '#668'; c.lineWidth = 1;
      for (let y = 12; y < 22; y += 3) {
        c.beginPath(); c.moveTo(12,y); c.lineTo(20,y); c.stroke();
      }
      c.fillStyle = '#a6f';
      c.beginPath(); c.arc(16,17,2,0,Math.PI*2); c.fill();
      break;
    case 'scrollLight':
      c.fillStyle = '#eed';
      c.fillRect(10,6,12,20);
      c.fillStyle = '#ddc';
      c.fillRect(8,6,16,3); c.fillRect(8,23,16,3);
      c.strokeStyle = '#668'; c.lineWidth = 1;
      for (let y = 12; y < 22; y += 3) {
        c.beginPath(); c.moveTo(12,y); c.lineTo(20,y); c.stroke();
      }
      c.fillStyle = '#ff4';
      c.beginPath(); c.arc(16,17,2,0,Math.PI*2); c.fill();
      break;
    case 'torch':
      c.strokeStyle = '#864'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(16,28); c.lineTo(16,14); c.stroke();
      c.fillStyle = '#f80';
      c.beginPath(); c.moveTo(16,14); c.lineTo(10,8); c.lineTo(16,3);
      c.lineTo(22,8); c.closePath(); c.fill();
      c.fillStyle = '#ff4';
      c.beginPath(); c.moveTo(16,13); c.lineTo(13,9); c.lineTo(16,5);
      c.lineTo(19,9); c.closePath(); c.fill();
      break;
    case 'pickaxe':
      c.strokeStyle = '#864'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(8,26); c.lineTo(22,8); c.stroke();
      c.strokeStyle = '#999'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(18,6); c.lineTo(26,10); c.stroke();
      c.beginPath(); c.moveTo(20,4); c.lineTo(24,12); c.stroke();
      break;
    default:
      c.fillStyle = col; c.fillRect(8,8,16,16);
  }
  return cv;
}
