/* =========================================================
   CONFIG
   ========================================================= */
export const MAP_W  = 72;
export const MAP_H  = 72;
export const WALL_H = 3;
export const EYE_H  = 1.65;
export const RADIUS = 0.28;
export const SPEED  = 4.5;
export const SPRINT = 8.5;

/* =========================================================
   CHARACTER DATA
   ========================================================= */
export const RACES = {
  Human:  { mod: { str:0, dex:0, con:0, int:0, wis:0, cha:1 }, desc: 'Versatile and adaptable' },
  Elf:    { mod: { str:-1,dex:2, con:-1,int:1, wis:0, cha:1 }, desc: 'Swift, keen-eyed, magical' },
  Dwarf:  { mod: { str:2, dex:-1,con:2, int:0, wis:1, cha:-1}, desc: 'Tough and strong' },
  Gnome:  { mod: { str:-1,dex:1, con:0, int:2, wis:0, cha:0 }, desc: 'Clever tinkerer' },
  Orc:    { mod: { str:3, dex:0, con:2, int:-2,wis:-1,cha:-2}, desc: 'Brutish and fearsome' },
};

export const ROLES = {
  Warrior:  {
    base: { str:16,dex:12,con:16,int:7, wis:7, cha:10 }, hp: 14,
    aligns: ['Lawful','Neutral'],
    desc: 'Master of arms and armour',
  },
  Valkyrie: {
    base: { str:14,dex:10,con:14,int:8, wis:9, cha:10 }, hp: 13,
    aligns: ['Neutral','Chaotic'],
    desc: 'Nordic shield-maiden',
  },
  Rogue:    {
    base: { str:10,dex:16,con:12,int:13,wis:9, cha:11 }, hp: 10,
    aligns: ['Neutral','Chaotic'],
    desc: 'Sneaky and cunning',
  },
  Ranger:   {
    base: { str:13,dex:13,con:13,int:13,wis:13,cha:13 }, hp: 11,
    aligns: ['Neutral'],
    desc: 'Survivalist explorer',
  },
  Wizard:   {
    base: { str:7, dex:10,con:8, int:18,wis:7, cha:9  }, hp: 8,
    aligns: ['Neutral','Chaotic'],
    desc: 'Master of arcane spells',
  },
  Healer:   {
    base: { str:10,dex:10,con:12,int:13,wis:16,cha:12 }, hp: 9,
    aligns: ['Neutral','Lawful'],
    desc: 'Restores wounds, cheats death',
  },
};

export const STAT_NAMES = ['str','dex','con','int','wis','cha'];
export const STAT_LABELS = { str:'STR',dex:'DEX',con:'CON',int:'INT',wis:'WIS',cha:'CHA' };
export const ALIGN_ORDER = ['Lawful','Neutral','Chaotic'];

export const ITEMS = {
  longsword:   { name: 'a longsword',               cat: 'Weapons',  sym: ')', dmg: 8  },
  shortsword:  { name: 'a short sword',             cat: 'Weapons',  sym: ')', dmg: 6  },
  dagger:      { name: 'a dagger',                  cat: 'Weapons',  sym: ')', dmg: 4  },
  staff:       { name: 'a quarterstaff',            cat: 'Weapons',  sym: ')', dmg: 5  },
  bow:         { name: 'a bow',                     cat: 'Weapons',  sym: ')', dmg: 7  },
  mace:        { name: 'a mace',                    cat: 'Weapons',  sym: ')', dmg: 7  },
  chainmail:   { name: 'a chain mail',              cat: 'Armor',    sym: '[', ac: 5   },
  leather:     { name: 'a leather armor',           cat: 'Armor',    sym: '[', ac: 3   },
  robe:        { name: 'a robe',                    cat: 'Armor',    sym: '[', ac: 1   },
  cloak:       { name: 'an elven cloak',            cat: 'Armor',    sym: '[', ac: 2   },
  shield:      { name: 'a small shield',            cat: 'Armor',    sym: '[', ac: 2   },
  healPotion:  { name: 'a potion of healing',       cat: 'Potions',  sym: '!', use: 'heal',     value: 8  },
  manaPotion:  { name: 'a potion of mana',          cat: 'Potions',  sym: '!', use: 'mana',     value: 0  },
  foodRation:  { name: 'a food ration',             cat: 'Food',     sym: '%', use: 'eat',      value: 5  },
  scrollTele:  { name: 'a scroll of teleportation', cat: 'Scrolls',  sym: '?', use: 'teleport', value: 0  },
  scrollLight: { name: 'a scroll of light',         cat: 'Scrolls',  sym: '?', use: 'light',    value: 0  },
  torch:       { name: 'a torch',                   cat: 'Tools',    sym: '(' },
  pickaxe:     { name: 'a pick-axe',                cat: 'Tools',    sym: '(' },
};

export const CAT_ORDER = ['Weapons','Armor','Potions','Scrolls','Food','Tools'];

export const STARTING_ITEMS = {
  Warrior:  ['longsword','chainmail','shield','foodRation','foodRation','healPotion'],
  Valkyrie: ['longsword','leather','shield','foodRation','foodRation','healPotion'],
  Rogue:    ['shortsword','dagger','leather','cloak','foodRation','healPotion'],
  Ranger:   ['bow','shortsword','leather','foodRation','foodRation','foodRation'],
  Wizard:   ['staff','robe','scrollTele','scrollLight','manaPotion','healPotion','foodRation'],
  Healer:   ['mace','robe','healPotion','healPotion','healPotion','foodRation','foodRation'],
};
