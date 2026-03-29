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
   MONSTER SPRITES — smooth canvas-drawn, bestiary style
   ========================================================= */
function drawMonster(name, type) {
  const sz = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = sz;
  const c = cv.getContext('2d');
  c.lineCap = 'round'; c.lineJoin = 'round';

  /* Helpers */
  function eye(cx, cy, r, glowCol, pupilCol) {
    /* Glow halo */
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, r * 2.5);
    g.addColorStop(0, glowCol);
    g.addColorStop(1, 'transparent');
    c.fillStyle = g; c.fillRect(cx - r*3, cy - r*3, r*6, r*6);
    /* Eyeball */
    c.fillStyle = glowCol;
    c.beginPath(); c.ellipse(cx, cy, r, r * 0.85, 0, 0, Math.PI*2); c.fill();
    /* Slit pupil */
    c.fillStyle = pupilCol || '#000';
    c.beginPath(); c.ellipse(cx, cy, r*0.35, r*0.7, 0, 0, Math.PI*2); c.fill();
  }

  switch (name) {
    case 'rat': {
      const by = 70;
      /* Tail — thin curve */
      c.strokeStyle = '#7a5520'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(22, by+10); c.quadraticCurveTo(10, by-5, 18, by-18); c.stroke();
      /* Body — low oval */
      const bg = c.createRadialGradient(64, by+6, 4, 64, by+6, 30);
      bg.addColorStop(0, '#9a7a30'); bg.addColorStop(1, '#5a3a10');
      c.fillStyle = bg;
      c.beginPath(); c.ellipse(64, by+6, 28, 14, -0.1, 0, Math.PI*2); c.fill();
      /* Fur strokes */
      c.strokeStyle = '#6a4a18'; c.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const fx = 44 + Math.random()*36, fy = by - 2 + Math.random()*16;
        c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + 3 - Math.random()*6, fy + 4); c.stroke();
      }
      /* Head — pointed snout */
      const hg = c.createRadialGradient(88, by-2, 2, 88, by, 16);
      hg.addColorStop(0, '#aa8a38'); hg.addColorStop(1, '#6a4a18');
      c.fillStyle = hg;
      c.beginPath(); c.moveTo(80, by-10); c.quadraticCurveTo(100, by-8, 104, by+2);
      c.quadraticCurveTo(100, by+10, 80, by+8); c.closePath(); c.fill();
      /* Ears */
      c.fillStyle = '#a07838';
      c.beginPath(); c.ellipse(82, by-14, 5, 7, -0.3, 0, Math.PI*2); c.fill();
      c.beginPath(); c.ellipse(92, by-14, 5, 7, 0.3, 0, Math.PI*2); c.fill();
      c.fillStyle = '#704020';
      c.beginPath(); c.ellipse(82, by-13, 3, 4, -0.3, 0, Math.PI*2); c.fill();
      c.beginPath(); c.ellipse(92, by-13, 3, 4, 0.3, 0, Math.PI*2); c.fill();
      /* Eyes */
      eye(85, by-2, 3.5, '#ff2200', '#000');
      eye(95, by-2, 3.5, '#ff2200', '#000');
      /* Nose */
      c.fillStyle = '#ffaaaa'; c.beginPath(); c.arc(103, by+2, 2, 0, Math.PI*2); c.fill();
      /* Whiskers */
      c.strokeStyle = 'rgba(200,180,150,0.6)'; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(103, by); c.lineTo(118, by-6); c.stroke();
      c.beginPath(); c.moveTo(103, by+4); c.lineTo(118, by+8); c.stroke();
      /* Feet */
      c.fillStyle = '#5a3a10';
      c.beginPath(); c.ellipse(48, by+18, 5, 3, 0, 0, Math.PI*2); c.fill();
      c.beginPath(); c.ellipse(74, by+18, 5, 3, 0, 0, Math.PI*2); c.fill();
      break;
    }
    case 'bat': {
      const cy = 52;
      /* Wings — smooth curves */
      c.fillStyle = '#2a2a30';
      c.beginPath();
      c.moveTo(64, cy); // body center
      c.quadraticCurveTo(40, cy-20, 8, cy-18);  // left wing tip
      c.quadraticCurveTo(12, cy-4, 28, cy+6);    // left wing bottom
      c.lineTo(64, cy+4);
      c.moveTo(64, cy);
      c.quadraticCurveTo(88, cy-20, 120, cy-18);
      c.quadraticCurveTo(116, cy-4, 100, cy+6);
      c.lineTo(64, cy+4);
      c.fill();
      /* Wing membrane lines */
      c.strokeStyle = '#3a3a44'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(60, cy); c.quadraticCurveTo(36, cy-14, 14, cy-14); c.stroke();
      c.beginPath(); c.moveTo(56, cy+2); c.quadraticCurveTo(38, cy-6, 20, cy-6); c.stroke();
      c.beginPath(); c.moveTo(68, cy); c.quadraticCurveTo(92, cy-14, 114, cy-14); c.stroke();
      c.beginPath(); c.moveTo(72, cy+2); c.quadraticCurveTo(90, cy-6, 108, cy-6); c.stroke();
      /* Body */
      const bg = c.createRadialGradient(64, cy+4, 2, 64, cy+4, 14);
      bg.addColorStop(0, '#555'); bg.addColorStop(1, '#2a2a30');
      c.fillStyle = bg;
      c.beginPath(); c.ellipse(64, cy+4, 12, 14, 0, 0, Math.PI*2); c.fill();
      /* Ears */
      c.fillStyle = '#444';
      c.beginPath(); c.moveTo(54, cy-10); c.lineTo(50, cy-26); c.lineTo(58, cy-14); c.fill();
      c.beginPath(); c.moveTo(74, cy-10); c.lineTo(78, cy-26); c.lineTo(70, cy-14); c.fill();
      /* Eyes */
      eye(58, cy-2, 4, '#ff0000', '#000');
      eye(70, cy-2, 4, '#ff0000', '#000');
      /* Fangs */
      c.fillStyle = '#eee'; c.lineWidth = 0;
      c.beginPath(); c.moveTo(60, cy+10); c.lineTo(62, cy+16); c.lineTo(64, cy+10); c.fill();
      c.beginPath(); c.moveTo(64, cy+10); c.lineTo(66, cy+16); c.lineTo(68, cy+10); c.fill();
      break;
    }
    case 'kobold': {
      const by = 48;
      /* Body */
      const bg = c.createLinearGradient(64, by-8, 64, by+40);
      bg.addColorStop(0, '#4a8a4a'); bg.addColorStop(1, '#2a5a2a');
      c.fillStyle = bg;
      c.beginPath(); c.moveTo(48, by); c.quadraticCurveTo(44, by+20, 48, by+38);
      c.lineTo(80, by+38); c.quadraticCurveTo(84, by+20, 80, by); c.closePath(); c.fill();
      /* Scale pattern */
      c.strokeStyle = 'rgba(0,40,0,0.3)'; c.lineWidth = 0.8;
      for (let row = 0; row < 5; row++) {
        const yy = by + 4 + row * 7;
        for (let col = 0; col < 4; col++) {
          const xx = 50 + col * 8 + (row % 2) * 4;
          c.beginPath(); c.arc(xx, yy, 3.5, 0, Math.PI); c.stroke();
        }
      }
      /* Head */
      c.fillStyle = '#4a8a4a';
      c.beginPath(); c.ellipse(64, by-14, 14, 12, 0, 0, Math.PI*2); c.fill();
      /* Snout */
      c.fillStyle = '#3a7a3a';
      c.beginPath(); c.ellipse(76, by-10, 8, 6, 0.2, 0, Math.PI*2); c.fill();
      /* Eyes — yellow slits */
      eye(58, by-16, 4, '#eecc00', '#111');
      eye(68, by-16, 4, '#eecc00', '#111');
      /* Nostrils */
      c.fillStyle = '#2a5a2a';
      c.beginPath(); c.arc(81, by-10, 1.5, 0, Math.PI*2); c.fill();
      /* Teeth */
      c.fillStyle = '#eee';
      c.beginPath(); c.moveTo(74, by-5); c.lineTo(75.5, by-1); c.lineTo(77, by-5); c.fill();
      c.beginPath(); c.moveTo(78, by-5); c.lineTo(79.5, by-1); c.lineTo(81, by-5); c.fill();
      /* Arms */
      c.strokeStyle = '#3a7a3a'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(48, by+6); c.quadraticCurveTo(34, by+16, 36, by+28); c.stroke();
      c.beginPath(); c.moveTo(80, by+6); c.quadraticCurveTo(94, by+16, 92, by+28); c.stroke();
      /* Claws */
      c.strokeStyle = '#cc8'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(34, by+28); c.lineTo(30, by+32); c.stroke();
      c.beginPath(); c.moveTo(36, by+28); c.lineTo(34, by+33); c.stroke();
      c.beginPath(); c.moveTo(92, by+28); c.lineTo(96, by+32); c.stroke();
      c.beginPath(); c.moveTo(94, by+28); c.lineTo(96, by+33); c.stroke();
      /* Legs */
      c.strokeStyle = '#2a5a2a'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(54, by+38); c.lineTo(50, by+50); c.stroke();
      c.beginPath(); c.moveTo(74, by+38); c.lineTo(78, by+50); c.stroke();
      /* Spear */
      c.strokeStyle = '#8a6a30'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(96, by-20); c.lineTo(96, by+34); c.stroke();
      c.fillStyle = '#bbb';
      c.beginPath(); c.moveTo(93, by-20); c.lineTo(96, by-30); c.lineTo(99, by-20); c.fill();
      break;
    }
    case 'goblin': {
      const by = 40;
      /* Body — stocky */
      const bg = c.createLinearGradient(64, by, 64, by+50);
      bg.addColorStop(0, '#2a7a4a'); bg.addColorStop(1, '#1a4a2a');
      c.fillStyle = bg;
      c.beginPath();
      c.moveTo(42, by+4); c.quadraticCurveTo(36, by+26, 42, by+46);
      c.lineTo(86, by+46); c.quadraticCurveTo(92, by+26, 86, by+4); c.closePath(); c.fill();
      /* Armor scraps */
      c.fillStyle = 'rgba(80,60,30,0.7)';
      c.fillRect(44, by+8, 40, 12);
      c.strokeStyle = '#6a5020'; c.lineWidth = 1;
      c.strokeRect(44, by+8, 40, 12);
      /* Belt */
      c.fillStyle = '#8a6a30'; c.fillRect(42, by+32, 44, 4);
      c.fillStyle = '#ccaa44'; c.beginPath(); c.arc(64, by+34, 3, 0, Math.PI*2); c.fill();
      /* Head — wide, brutish */
      const hg = c.createRadialGradient(64, by-12, 3, 64, by-8, 22);
      hg.addColorStop(0, '#3a8a5a'); hg.addColorStop(1, '#1a5a3a');
      c.fillStyle = hg;
      c.beginPath(); c.ellipse(64, by-8, 20, 16, 0, 0, Math.PI*2); c.fill();
      /* Brow ridge */
      c.strokeStyle = '#1a4a2a'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(46, by-14); c.quadraticCurveTo(64, by-20, 82, by-14); c.stroke();
      /* Eyes — orange menacing */
      eye(55, by-12, 5, '#ff8800', '#111');
      eye(73, by-12, 5, '#ff8800', '#111');
      /* Tusks */
      c.fillStyle = '#eed';
      c.beginPath(); c.moveTo(50, by+2); c.lineTo(48, by+10); c.lineTo(53, by+2); c.fill();
      c.beginPath(); c.moveTo(75, by+2); c.lineTo(80, by+10); c.lineTo(78, by+2); c.fill();
      /* Ears */
      c.fillStyle = '#2a7a4a';
      c.beginPath(); c.moveTo(44, by-10); c.lineTo(32, by-14); c.lineTo(44, by-4); c.fill();
      c.beginPath(); c.moveTo(84, by-10); c.lineTo(96, by-14); c.lineTo(84, by-4); c.fill();
      /* Arms */
      c.strokeStyle = '#1a5a3a'; c.lineWidth = 7;
      c.beginPath(); c.moveTo(42, by+10); c.quadraticCurveTo(26, by+22, 28, by+36); c.stroke();
      c.beginPath(); c.moveTo(86, by+10); c.quadraticCurveTo(102, by+22, 100, by+36); c.stroke();
      /* Fists */
      c.fillStyle = '#2a7a4a';
      c.beginPath(); c.arc(28, by+38, 5, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(100, by+38, 5, 0, Math.PI*2); c.fill();
      /* Legs */
      c.strokeStyle = '#1a4a2a'; c.lineWidth = 7;
      c.beginPath(); c.moveTo(52, by+46); c.lineTo(48, by+58); c.stroke();
      c.beginPath(); c.moveTo(76, by+46); c.lineTo(80, by+58); c.stroke();
      /* Club */
      c.strokeStyle = '#654'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(24, by+12); c.lineTo(24, by+40); c.stroke();
      c.fillStyle = '#876';
      c.beginPath(); c.ellipse(24, by+10, 6, 8, 0, 0, Math.PI*2); c.fill();
      c.fillStyle = '#555';
      c.beginPath(); c.arc(22, by+8, 2, 0, Math.PI*2); c.fill(); // nail
      break;
    }
    case 'skeleton': {
      const by = 32;
      /* Skull */
      c.fillStyle = '#eee8dd';
      c.beginPath(); c.ellipse(64, by, 16, 14, 0, 0, Math.PI*2); c.fill();
      /* Cheekbone shading */
      c.fillStyle = 'rgba(0,0,0,0.08)';
      c.beginPath(); c.ellipse(52, by+4, 8, 6, 0, 0, Math.PI*2); c.fill();
      c.beginPath(); c.ellipse(76, by+4, 8, 6, 0, 0, Math.PI*2); c.fill();
      /* Eye sockets — deep dark */
      c.fillStyle = '#0a0808';
      c.beginPath(); c.ellipse(56, by-2, 6, 5, -0.15, 0, Math.PI*2); c.fill();
      c.beginPath(); c.ellipse(72, by-2, 6, 5, 0.15, 0, Math.PI*2); c.fill();
      /* Soul fire in eyes */
      eye(56, by-2, 2.5, '#ff3322', '#ff8844');
      eye(72, by-2, 2.5, '#ff3322', '#ff8844');
      /* Nose hole */
      c.fillStyle = '#2a2420';
      c.beginPath(); c.moveTo(62, by+4); c.lineTo(64, by+8); c.lineTo(66, by+4); c.fill();
      /* Jaw + teeth */
      c.fillStyle = '#ddd8cc';
      c.beginPath(); c.moveTo(50, by+10); c.quadraticCurveTo(64, by+16, 78, by+10);
      c.lineTo(78, by+8); c.lineTo(50, by+8); c.closePath(); c.fill();
      c.fillStyle = '#111';
      for (let i = 0; i < 6; i++) {
        c.fillRect(52 + i*5, by+9, 1.5, 4);
      }
      /* Spine + ribcage */
      c.strokeStyle = '#ccc8bb'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(64, by+16); c.lineTo(64, by+56); c.stroke();
      /* Ribs */
      c.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const ry = by + 22 + i * 6;
        c.beginPath(); c.moveTo(64, ry); c.quadraticCurveTo(50, ry-1, 44, ry+3); c.stroke();
        c.beginPath(); c.moveTo(64, ry); c.quadraticCurveTo(78, ry-1, 84, ry+3); c.stroke();
      }
      /* Arms */
      c.strokeStyle = '#ccc8bb'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(44, by+22); c.quadraticCurveTo(30, by+30, 28, by+46); c.stroke();
      c.beginPath(); c.moveTo(84, by+22); c.quadraticCurveTo(98, by+30, 100, by+46); c.stroke();
      /* Hands */
      c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(28, by+46); c.lineTo(24, by+50); c.stroke();
      c.beginPath(); c.moveTo(28, by+46); c.lineTo(30, by+51); c.stroke();
      c.beginPath(); c.moveTo(100, by+46); c.lineTo(104, by+50); c.stroke();
      c.beginPath(); c.moveTo(100, by+46); c.lineTo(98, by+51); c.stroke();
      /* Pelvis */
      c.fillStyle = '#bbb8aa';
      c.beginPath(); c.ellipse(64, by+56, 12, 4, 0, 0, Math.PI*2); c.fill();
      /* Legs */
      c.strokeStyle = '#bbb8aa'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(56, by+58); c.lineTo(52, by+74); c.stroke();
      c.beginPath(); c.moveTo(72, by+58); c.lineTo(76, by+74); c.stroke();
      /* Rusty sword */
      c.strokeStyle = '#998877'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(22, by+20); c.lineTo(22, by+50); c.stroke();
      c.fillStyle = '#aaa';
      c.beginPath(); c.moveTo(20, by+20); c.lineTo(22, by+12); c.lineTo(24, by+20); c.fill();
      c.fillStyle = '#664';
      c.fillRect(18, by+50, 8, 3);
      break;
    }
    case 'orc': {
      const by = 28;
      /* Body — massive */
      const bg = c.createLinearGradient(64, by+4, 64, by+60);
      bg.addColorStop(0, '#993838'); bg.addColorStop(1, '#5a1a1a');
      c.fillStyle = bg;
      c.beginPath();
      c.moveTo(36, by+8); c.quadraticCurveTo(28, by+32, 36, by+56);
      c.lineTo(92, by+56); c.quadraticCurveTo(100, by+32, 92, by+8); c.closePath(); c.fill();
      /* Chest plate */
      c.fillStyle = '#555';
      c.beginPath();
      c.moveTo(42, by+10); c.lineTo(86, by+10);
      c.quadraticCurveTo(90, by+28, 86, by+34);
      c.lineTo(42, by+34); c.quadraticCurveTo(38, by+28, 42, by+10); c.fill();
      c.strokeStyle = '#777'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(64, by+10); c.lineTo(64, by+34); c.stroke();
      c.beginPath(); c.moveTo(42, by+22); c.lineTo(86, by+22); c.stroke();
      /* Belt */
      c.fillStyle = '#8a6a30'; c.fillRect(36, by+40, 56, 5);
      c.fillStyle = '#ffcc44'; c.beginPath(); c.arc(64, by+42, 3.5, 0, Math.PI*2); c.fill();
      /* Head — big, square-jawed */
      const hg = c.createRadialGradient(64, by-8, 4, 64, by-4, 24);
      hg.addColorStop(0, '#aa4848'); hg.addColorStop(1, '#6a2020');
      c.fillStyle = hg;
      c.beginPath();
      c.moveTo(42, by-2); c.quadraticCurveTo(42, by-24, 64, by-26);
      c.quadraticCurveTo(86, by-24, 86, by-2);
      c.quadraticCurveTo(86, by+6, 64, by+8);
      c.quadraticCurveTo(42, by+6, 42, by-2); c.fill();
      /* Heavy brow */
      c.fillStyle = '#5a1818';
      c.beginPath(); c.moveTo(44, by-12); c.quadraticCurveTo(64, by-18, 84, by-12);
      c.lineTo(84, by-8); c.quadraticCurveTo(64, by-12, 44, by-8); c.closePath(); c.fill();
      /* Eyes — burning */
      eye(54, by-8, 5.5, '#ff4400', '#ffcc00');
      eye(74, by-8, 5.5, '#ff4400', '#ffcc00');
      /* Nose */
      c.fillStyle = '#6a2020';
      c.beginPath(); c.moveTo(60, by-2); c.quadraticCurveTo(64, by+3, 68, by-2);
      c.lineTo(66, by-4); c.lineTo(62, by-4); c.closePath(); c.fill();
      /* Tusks — large */
      c.fillStyle = '#eee';
      c.beginPath(); c.moveTo(48, by+4); c.lineTo(44, by+14); c.lineTo(52, by+4); c.fill();
      c.beginPath(); c.moveTo(76, by+4); c.lineTo(84, by+14); c.lineTo(80, by+4); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.moveTo(49, by+4); c.lineTo(46, by+10); c.lineTo(51, by+4); c.fill();
      c.beginPath(); c.moveTo(77, by+4); c.lineTo(82, by+10); c.lineTo(79, by+4); c.fill();
      /* Ears */
      c.fillStyle = '#993838';
      c.beginPath(); c.moveTo(42, by-6); c.lineTo(30, by-12); c.lineTo(42, by+2); c.fill();
      c.beginPath(); c.moveTo(86, by-6); c.lineTo(98, by-12); c.lineTo(86, by+2); c.fill();
      /* Arms */
      c.strokeStyle = '#7a2828'; c.lineWidth = 10;
      c.beginPath(); c.moveTo(36, by+14); c.quadraticCurveTo(18, by+28, 20, by+44); c.stroke();
      c.beginPath(); c.moveTo(92, by+14); c.quadraticCurveTo(110, by+28, 108, by+44); c.stroke();
      /* Bracers */
      c.fillStyle = '#555';
      c.beginPath(); c.ellipse(22, by+36, 7, 4, 0.3, 0, Math.PI*2); c.fill();
      c.beginPath(); c.ellipse(106, by+36, 7, 4, -0.3, 0, Math.PI*2); c.fill();
      /* Fists */
      c.fillStyle = '#993838';
      c.beginPath(); c.arc(20, by+46, 6, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(108, by+46, 6, 0, Math.PI*2); c.fill();
      /* Legs */
      c.strokeStyle = '#5a1a1a'; c.lineWidth = 8;
      c.beginPath(); c.moveTo(50, by+56); c.lineTo(46, by+72); c.stroke();
      c.beginPath(); c.moveTo(78, by+56); c.lineTo(82, by+72); c.stroke();
      /* Boots */
      c.fillStyle = '#333';
      c.beginPath(); c.ellipse(46, by+74, 8, 4, 0, 0, Math.PI*2); c.fill();
      c.beginPath(); c.ellipse(82, by+74, 8, 4, 0, 0, Math.PI*2); c.fill();
      /* Battle axe */
      c.strokeStyle = '#7a5520'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(14, by-10); c.lineTo(14, by+48); c.stroke();
      /* Axe head */
      c.fillStyle = '#888';
      c.beginPath(); c.moveTo(14, by-10); c.quadraticCurveTo(0, by-6, 2, by+2);
      c.lineTo(14, by); c.closePath(); c.fill();
      c.fillStyle = '#aaa';
      c.beginPath(); c.moveTo(14, by-8); c.quadraticCurveTo(4, by-4, 5, by);
      c.lineTo(14, by-1); c.closePath(); c.fill();
      break;
    }
    default: {
      c.fillStyle = type.col;
      c.beginPath(); c.arc(64, 64, 24, 0, Math.PI*2); c.fill();
      eye(52, 56, 6, '#f00', '#000'); eye(76, 56, 6, '#f00', '#000');
    }
  }

  return cv;
}

function makeMonsterSprite(type) {
  const cv = drawMonster(type.name, type);
  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(type.size * 1.3, type.size * 1.3, 1);
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
      if (m.flashTimer <= 0) m.sprite.material.color.set(0xffffff);
    }

    /* Bob animation */
    m.bobPhase += dt * (m.state === 'chase' ? 8 : 2.5);
    const bob = Math.sin(m.bobPhase) * (m.state === 'chase' ? 0.06 : 0.03);
    const baseY = m.type.size * 0.7;

    /* Update sprite position */
    m.sprite.position.set(m.x, baseY + bob, m.z);
    m.hpBar.sprite.position.set(m.x, m.type.size * 1.4 + 0.1 + bob, m.z);

    /* Aggro pulse — scale up slightly when chasing/attacking */
    const baseScale = m.type.size * 1.3;
    const pulse = m.state !== 'idle' ? Math.sin(m.bobPhase * 2) * 0.04 : 0;
    m.sprite.scale.set(baseScale + pulse, baseScale + pulse, 1);

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

  /* Flash red — timer-based, resolved in updateMonsters */
  bestMon.flashTimer = 0.12;
  bestMon.sprite.material.color.set(0xff4444);

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
