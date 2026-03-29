import { RACES, ROLES, STAT_NAMES, STAT_LABELS, ALIGN_ORDER, ITEMS, STARTING_ITEMS } from './config.js';
import { character } from './state.js';
import { startGame } from './input.js';

const CS_STEPS = ['NAME','RACE','ROLE','ALIGN','SUMMARY'];

const cs = {
  step: 0,
  name: '',
  race: '',
  role: '',
  align: '',
};

const elCharScreen = document.getElementById('charscreen');
const elCsBody     = document.getElementById('csBody');
const elCsProg     = document.getElementById('csProg');
const elCsBack     = document.getElementById('csBack');
const elCsNext     = document.getElementById('csNext');

function csProgress() {
  return CS_STEPS.map((s, i) =>
    `<span class="${i === cs.step ? 'cur' : ''}">${s}</span>`
  ).join(' <span style="color:#333">›</span> ');
}

function csRoll() {
  const role = ROLES[cs.role], race = RACES[cs.race];
  const stats = {};
  for (const s of STAT_NAMES)
    stats[s] = role.base[s] + race.mod[s] + Math.floor(Math.random() * 4) + 1;
  return stats;
}

function csRender() {
  elCsProg.innerHTML = csProgress();
  elCsBack.disabled  = cs.step === 0;
  elCsNext.disabled  = false;

  const step = CS_STEPS[cs.step];

  if (step === 'NAME') {
    elCsNext.textContent = 'NEXT ▶';
    elCsNext.className   = 'primary';
    elCsBody.innerHTML = `
      <div class="cs-label">What is your name, adventurer?</div>
      <input id="nameInput" type="text" maxlength="24"
             placeholder="Enter name (or leave blank)" value="${cs.name}"
             autocomplete="off" spellcheck="false">
      <div style="color:#444;font-size:11px;margin-top:6px">Press Enter or click NEXT to continue</div>`;
    const inp = document.getElementById('nameInput');
    inp.focus();
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') csAdvance(); });

  } else if (step === 'RACE') {
    elCsNext.textContent = 'NEXT ▶';
    elCsNext.className   = 'primary';
    elCsBody.innerHTML = `
      <div class="cs-label">Choose your race</div>
      <div class="opt-list">${
        Object.entries(RACES).map(([name, r]) => {
          const mods = STAT_NAMES.map(s => {
            const v = r.mod[s];
            return v !== 0 ? `${STAT_LABELS[s]}${v > 0 ? '+' : ''}${v}` : null;
          }).filter(Boolean).join(' ');
          const sel = cs.race === name ? 'selected' : '';
          return `<div class="opt ${sel}" data-val="${name}" onclick="csPick('race',this)">
            <span class="glyph">${sel ? '▶' : ' '}</span>
            <span class="oname">${name}</span>
            <span class="odesc">${r.desc}</span>
            <span class="ostatline">${mods || 'balanced'}</span>
          </div>`;
        }).join('')
      }</div>`;
    elCsNext.disabled = !cs.race;

  } else if (step === 'ROLE') {
    elCsNext.textContent = 'NEXT ▶';
    elCsNext.className   = 'primary';
    elCsBody.innerHTML = `
      <div class="cs-label">Choose your role</div>
      <div class="opt-list">${
        Object.entries(ROLES).map(([name, r]) => {
          const sel = cs.role === name ? 'selected' : '';
          const hpStr = `HP ${r.hp}`;
          return `<div class="opt ${sel}" data-val="${name}" onclick="csPick('role',this)">
            <span class="glyph">${sel ? '▶' : ' '}</span>
            <span class="oname">${name}</span>
            <span class="odesc">${r.desc}</span>
            <span class="ostatline">${hpStr}</span>
          </div>`;
        }).join('')
      }</div>`;
    elCsNext.disabled = !cs.role;

  } else if (step === 'ALIGN') {
    elCsNext.textContent = 'NEXT ▶';
    elCsNext.className   = 'primary';
    const validAligns = ALIGN_ORDER.filter(a => ROLES[cs.role].aligns.includes(a));
    if (cs.align && !validAligns.includes(cs.align)) cs.align = '';
    const descs = {
      Lawful:  'Order, honour, justice',
      Neutral: 'Balance and pragmatism',
      Chaotic: 'Freedom, power, chaos',
    };
    elCsBody.innerHTML = `
      <div class="cs-label">Choose your alignment</div>
      <div class="opt-list">${
        validAligns.map(name => {
          const sel = cs.align === name ? 'selected' : '';
          return `<div class="opt ${sel}" data-val="${name}" onclick="csPick('align',this)">
            <span class="glyph">${sel ? '▶' : ' '}</span>
            <span class="oname">${name}</span>
            <span class="odesc">${descs[name]}</span>
          </div>`;
        }).join('')
      }</div>`;
    elCsNext.disabled = !cs.align;

  } else if (step === 'SUMMARY') {
    elCsNext.textContent = 'BEGIN ADVENTURE ▶';
    elCsNext.className   = 'primary';
    elCsBack.disabled    = false;
    const stats = csRoll();
    cs._rolledStats = stats;
    const hpMax = ROLES[cs.role].hp + Math.floor((stats.con - 10) / 2);
    const dispName = cs.name || 'Hack';
    elCsBody.innerHTML = `
      <div class="summary-line">Name: <span>${dispName}</span></div>
      <div class="summary-line">
        Race: <span>${cs.race}</span> &nbsp;·&nbsp;
        Role: <span>${cs.role}</span> &nbsp;·&nbsp;
        Alignment: <span>${cs.align}</span>
      </div>
      <div class="summary-line" style="margin:12px 0 8px">Starting stats:</div>
      <div class="stat-grid">${
        STAT_NAMES.map(s => `
          <div class="stat-cell">
            <div class="sname">${STAT_LABELS[s]}</div>
            <div class="sval">${stats[s]}</div>
          </div>`).join('')
      }</div>
      <div class="summary-line">Starting HP: <span>${hpMax}</span></div>`;
  }
}

function csPick(field, el) {
  cs[field] = el.dataset.val;
  csRender();
}

window.csPick = csPick;

function csAdvance() {
  const step = CS_STEPS[cs.step];
  if (step === 'NAME') {
    const inp = document.getElementById('nameInput');
    cs.name = inp ? inp.value.trim() : cs.name;
  }
  if (cs.step < CS_STEPS.length - 1) {
    cs.step++;
    csRender();
  } else {
    confirmChar();
  }
}

function confirmChar() {
  const stats  = cs._rolledStats || csRoll();
  const hpMax  = ROLES[cs.role].hp + Math.floor((stats.con - 10) / 2);
  character.name  = cs.name || 'Hack';
  character.race  = cs.race;
  character.role  = cs.role;
  character.align = cs.align;
  character.stats = stats;
  character.hp    = { cur: hpMax, max: hpMax };

  character.inventory = [];
  character.equipped  = { weapon: null, armor: null };
  const starts = STARTING_ITEMS[cs.role] || [];
  for (let i = 0; i < starts.length; i++) {
    const id = starts[i];
    const entry = { slot: String.fromCharCode(97 + i), id, item: ITEMS[id] };
    character.inventory.push(entry);
    if (!character.equipped.weapon && entry.item.cat === 'Weapons')
      character.equipped.weapon = entry;
    if (!character.equipped.armor && entry.item.cat === 'Armor')
      character.equipped.armor = entry;
  }

  elCharScreen.style.display = 'none';
  startGame();
}

elCsBack.addEventListener('click', () => {
  if (cs.step > 0) { cs.step--; csRender(); }
});
elCsNext.addEventListener('click', csAdvance);

export function initCharScreen() {
  document.getElementById('startBtn').addEventListener('click', () => {
    document.getElementById('overlay').style.display = 'none';
    elCharScreen.style.display  = 'flex';
    cs.step  = 0;
    cs.name  = '';
    cs.race  = 'Human';
    cs.role  = 'Warrior';
    cs.align = 'Neutral';
    csRender();
  });
}
