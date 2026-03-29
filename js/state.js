export const character = {
  name: 'Hack', race: 'Human', role: 'Warrior', align: 'Neutral',
  stats: {}, hp: { cur: 10, max: 10 }, xp: 0, level: 1,
  inventory: [], equipped: { weapon: null, armor: null },
};

export const player = { pos: null, yaw: 0, pitch: 0 };

export const gameState = {
  started: false, locked: false,
  fallbackMode: false, mouseActive: false,
  inventoryOpen: false, selectedSlot: null,
};
