import { ITEMS, CAT_ORDER, EYE_H } from './config.js';
import { character, player, gameState } from './state.js';
import { drawIcon } from './icons.js';
import { rooms, playerLight } from './world.js';
import { camera, canvas } from './renderer.js';
import { enterFallback, setHint } from './input.js';
import { showMsg } from './ui.js';

const elInventory = document.getElementById('inventory');
const elInvBody   = document.getElementById('invBody');

function isEquipped(entry) {
  return character.equipped.weapon === entry || character.equipped.armor === entry;
}

function doEquip(entry) {
  const cat = entry.item.cat;
  if (cat === 'Weapons') {
    character.equipped.weapon = entry;
    showMsg('You wield ' + entry.item.name + '.');
  } else if (cat === 'Armor') {
    character.equipped.armor = entry;
    showMsg('You wear ' + entry.item.name + '.');
  }
  renderInventory();
}

function doUnequip(entry) {
  if (character.equipped.weapon === entry) {
    character.equipped.weapon = null;
    showMsg('You put away ' + entry.item.name + '.');
  }
  if (character.equipped.armor === entry) {
    character.equipped.armor = null;
    showMsg('You take off ' + entry.item.name + '.');
  }
  renderInventory();
}

function removeItem(entry) {
  if (character.equipped.weapon === entry) character.equipped.weapon = null;
  if (character.equipped.armor  === entry) character.equipped.armor  = null;
  const idx = character.inventory.indexOf(entry);
  if (idx >= 0) character.inventory.splice(idx, 1);
  if (gameState.selectedSlot === entry.slot) gameState.selectedSlot = null;
}

function doUse(entry) {
  const u = entry.item.use;
  if (u === 'heal') {
    const heal = entry.item.value + Math.floor(Math.random() * 4);
    character.hp.cur = Math.min(character.hp.max, character.hp.cur + heal);
    showMsg('You drink ' + entry.item.name + '. You feel better!');
  } else if (u === 'eat') {
    const heal = entry.item.value + Math.floor(Math.random() * 3);
    character.hp.cur = Math.min(character.hp.max, character.hp.cur + heal);
    showMsg('You eat ' + entry.item.name + '. That hit the spot.');
  } else if (u === 'mana') {
    showMsg('You drink ' + entry.item.name + '. You feel magical energy!');
  } else if (u === 'teleport') {
    const r = rooms[Math.floor(Math.random() * rooms.length)];
    player.pos.set(r.x + r.w / 2 + 0.5, 0, r.y + r.h / 2 + 0.5);
    camera.position.set(player.pos.x, EYE_H, player.pos.z);
    showMsg('You read ' + entry.item.name + '. The world shifts around you!');
  } else if (u === 'light') {
    playerLight.distance = 16;
    playerLight.intensity = 6;
    setTimeout(() => { playerLight.distance = 7; playerLight.intensity = 2.8; }, 30000);
    showMsg('You read ' + entry.item.name + '. The dungeon brightens!');
  }
  removeItem(entry);
  renderInventory();
}

function doDrop(entry) {
  showMsg('You drop ' + entry.item.name + '.');
  removeItem(entry);
  renderInventory();
}

function renderInventory() {
  const inv = character.inventory;
  if (inv.length === 0) {
    elInvBody.innerHTML =
      `<h2>INVENTORY</h2><div class="inv-empty">You are empty-handed.</div>` +
      `<div class="inv-hint">press i to close</div>`;
    return;
  }

  const groups = {};
  for (const entry of inv) {
    const cat = entry.item.cat;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(entry);
  }

  elInvBody.innerHTML = '';

  const h = document.createElement('h2');
  h.textContent = `INVENTORY — ${character.name} the ${character.role}`;
  elInvBody.appendChild(h);

  const grid = document.createElement('div');
  grid.className = 'inv-grid';

  let selectedEntry = null;

  for (const cat of CAT_ORDER) {
    if (!groups[cat]) continue;
    const hdr = document.createElement('div');
    hdr.className = 'inv-cat-header';
    hdr.textContent = cat;
    grid.appendChild(hdr);

    for (const e of groups[cat]) {
      const tile = document.createElement('div');
      let cls = 'inv-tile';
      if (isEquipped(e)) cls += ' equipped';
      if (gameState.selectedSlot === e.slot) { cls += ' selected'; selectedEntry = e; }
      tile.className = cls;
      tile.title = e.item.name;

      const letter = document.createElement('span');
      letter.className = 'slot-letter';
      letter.textContent = e.slot;
      tile.appendChild(letter);

      if (isEquipped(e)) {
        const badge = document.createElement('span');
        badge.className = 'equip-badge';
        badge.textContent = 'E';
        tile.appendChild(badge);
      }

      tile.appendChild(drawIcon(e.id));

      const label = document.createElement('div');
      label.className = 'item-name';
      label.textContent = e.item.name.replace(/^an?\s+/, '');
      tile.appendChild(label);

      tile.addEventListener('click', () => {
        gameState.selectedSlot = (gameState.selectedSlot === e.slot) ? null : e.slot;
        renderInventory();
      });

      grid.appendChild(tile);
    }
  }
  elInvBody.appendChild(grid);

  const actBar = document.createElement('div');
  actBar.className = 'inv-actions';
  if (selectedEntry) {
    actBar.style.display = 'block';
    const e = selectedEntry;
    const cat = e.item.cat;

    const nm = document.createElement('div');
    nm.className = 'act-name';
    nm.textContent = e.item.name;
    actBar.appendChild(nm);

    const stat = document.createElement('div');
    stat.className = 'act-stat';
    if (e.item.dmg) stat.textContent = 'Damage: ' + e.item.dmg;
    else if (e.item.ac) stat.textContent = 'Armor: +' + e.item.ac;
    else if (e.item.use === 'heal') stat.textContent = 'Heals ~' + e.item.value + ' HP';
    else if (e.item.use === 'eat') stat.textContent = 'Restores ~' + e.item.value + ' HP';
    else if (e.item.use === 'teleport') stat.textContent = 'Teleports to a random room';
    else if (e.item.use === 'light') stat.textContent = 'Brightens your torch for 30s';
    else if (e.item.use === 'mana') stat.textContent = 'Restores magical energy';
    if (stat.textContent) actBar.appendChild(stat);

    const btns = document.createElement('div');
    btns.className = 'act-btns';

    if (cat === 'Weapons' || cat === 'Armor') {
      const eqBtn = document.createElement('button');
      eqBtn.className = 'act-btn use';
      if (isEquipped(e)) {
        eqBtn.textContent = 'UNEQUIP';
        eqBtn.addEventListener('click', () => doUnequip(e));
      } else {
        eqBtn.textContent = 'EQUIP';
        eqBtn.addEventListener('click', () => doEquip(e));
      }
      btns.appendChild(eqBtn);
    }

    if (e.item.use) {
      const useBtn = document.createElement('button');
      useBtn.className = 'act-btn use';
      useBtn.textContent = (cat === 'Scrolls') ? 'READ' : 'USE';
      useBtn.addEventListener('click', () => doUse(e));
      btns.appendChild(useBtn);
    }

    const dropBtn = document.createElement('button');
    dropBtn.className = 'act-btn drop';
    dropBtn.textContent = 'DROP';
    dropBtn.addEventListener('click', () => doDrop(e));
    btns.appendChild(dropBtn);

    actBar.appendChild(btns);
  }
  elInvBody.appendChild(actBar);

  const hint = document.createElement('div');
  hint.className = 'inv-hint';
  hint.textContent = 'click an item to select · press i to close';
  elInvBody.appendChild(hint);
}

export function toggleInventory() {
  if (!gameState.started) return;
  gameState.inventoryOpen = !gameState.inventoryOpen;
  if (gameState.inventoryOpen) {
    gameState.selectedSlot = null;
    if (gameState.locked) document.exitPointerLock();
    renderInventory();
    elInventory.style.display = 'flex';
  } else {
    elInventory.style.display = 'none';
    if (!gameState.fallbackMode) {
      const req = canvas.requestPointerLock();
      if (req && typeof req.catch === 'function') req.catch(() => enterFallback());
      else setTimeout(() => { if (!gameState.locked) enterFallback(); }, 300);
    } else {
      gameState.mouseActive = true;
      setHint('click to release mouse');
    }
  }
}

document.addEventListener('keydown', e => {
  if (e.code === 'KeyI' && gameState.started) {
    toggleInventory();
  }
  if (e.code === 'Escape' && gameState.inventoryOpen) {
    gameState.inventoryOpen = false;
    elInventory.style.display = 'none';
  }
});
