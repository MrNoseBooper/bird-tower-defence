// Game content and balance. Everything here is plain data, so tuning never touches game code.
// Each tower has its own file in towers/, and each reptile in lizards/.
import { TOWERS } from './towers/index.js';
import { REPTILES } from './lizards/index.js';

export { TOWERS, REPTILES };

export const START = { cash: 650, eggs: 30 };

// Permanent upgrades bought with feathers in The Roost.
export const ROOST_MAX = 5;
export const roostCost = rank => 5 * (rank + 1);
export const ROLE_PERK = { attack: '+6% attack speed, +3% range', support: '+8% circle size (or speed)', financial: '+10% berries' };
export const PERKS = { eggs: ['Extra Eggs', '+3 starting eggs'], cash: ['Head Start', '+100 starting berries'] };

// Endless mode brings these in order of strength.
export const BOSSES = ['eggeater', 'bigal', 'komodo', 'rattleking', 'leatherback', 'queen'];
// Endless mode past a map's last round draws from every regular reptile.
export const ENDLESS_POOL = Object.keys(REPTILES).filter(id => !REPTILES[id].boss && id !== 'hatchling')
  .sort((a, b) => REPTILES[a].hp - REPTILES[b].hp).map(id => [id, 1]);

// Blocking radius of each decoration; 0 means towers can sit on it.
export const DECOR_R = { tree: 7, cypress: 5, bush: 5, rock: 5, flowers: 0, reeds: 3, log: 6, cactus: 4, bones: 0, palm: 6, fern: 4 };
// grass/path/blocked: [main, dark, light]. sprinkle: tiny flowers or pebbles scattered over the ground.
export const THEMES = {
  meadow: { grass: ['#6dc94b', '#5bb33e', '#8fdd66'], path: ['#f0d08e', '#b88446', '#fde6b0'], blocked: ['#4db4ec', '#2f87c2', '#c2ecff'], water: true,
    rock: ['#7f8895', '#a6afbb', '#dde3ea'], sprinkle: ['#ffffff', '#ffe45c', '#ff8fb8'], decor: ['tree', 'tree', 'bush', 'rock', 'flowers', 'flowers'] },
  swamp: { grass: ['#62b04a', '#4f963b', '#80c862'], path: ['#c4a56c', '#86693f', '#dcc08a'], blocked: ['#3fb0a2', '#2a8077', '#a8eee2'], water: true,
    rock: ['#6f7a6c', '#95a091', '#c4cec0'], sprinkle: ['#e9f7b0', '#ffffff', '#c8f07a'], decor: ['cypress', 'cypress', 'reeds', 'log', 'bush'] },
  canyon: { grass: ['#f5c27c', '#e6aa62', '#ffdb9e'], path: ['#e0904f', '#a95d2c', '#f4ad70'], blocked: ['#d0693d', '#9d4826', '#ee8c58'], water: false,
    rock: ['#9a5a3a', '#c27a50', '#e8a272'], sprinkle: ['#c98a4f', '#fff0c9', '#b06a3a'], decor: ['cactus', 'cactus', 'rock', 'rock', 'bones'] },
  amazon: { grass: ['#45b452', '#379a44', '#66cc6a'], path: ['#b5844f', '#7f5634', '#cfa06a'], blocked: ['#3faae6', '#2a80b8', '#aee4ff'], water: true,
    rock: ['#6b7a68', '#8f9f8b', '#bccbb6'], sprinkle: ['#ff5f6d', '#ffd23f', '#ff9ff3'], decor: ['palm', 'palm', 'fern', 'fern', 'flowers', 'tree'] },
};

// Each map is a campaign level. Paths are waypoints in the 480x270 board; all paths end at the nest.
// pool: [reptile, first round it appears]. blocked: [x, y, w, h] areas nothing can be built on.
// pressure scales how much reptile health each round sends.
export const MAPS = [
  { id: 'meadow', name: 'Homestead Meadow', theme: 'meadow', rounds: 20, boss: 'eggeater', seed: 11, decor: 16, pressure: 0.85,
    blurb: 'Farmland where kingbirds raise their chicks. A long, gentle trail.',
    paths: [[[-12, 50], [90, 50], [90, 200], [200, 200], [200, 80], [320, 80], [320, 215], [420, 215], [420, 130], [456, 130]]],
    blocked: [],
    pool: [['anole', 1], ['garter', 2], ['skink', 4], ['gecko', 6], ['hognose', 8], ['boxturtle', 10], ['chameleon', 13]] },
  { id: 'swamp', name: 'Cypress Swamp', theme: 'swamp', rounds: 25, boss: 'bigal', seed: 23, decor: 14, pressure: 1.6,
    blurb: 'Murky ponds leave less room to build.',
    paths: [[[-12, 135], [60, 135], [60, 40], [180, 40], [180, 230], [300, 230], [300, 40], [420, 40], [420, 236]]],
    blocked: [[92, 80, 60, 110], [210, 70, 64, 100], [436, 120, 40, 70], [8, 180, 64, 60]],
    pool: [['anole', 1], ['garter', 1], ['skink', 3], ['hognose', 5], ['gecko', 6], ['basilisk', 8], ['boxturtle', 9], ['tuatara', 10],
      ['caiman', 11], ['iguana', 13], ['worm', 16], ['croc', 19]] },
  { id: 'canyon', name: 'Sunscorch Canyon', theme: 'canyon', rounds: 30, boss: 'rattleking', seed: 37, decor: 26, pressure: 0.95,
    blurb: 'A short, twisting trail between the mesas.',
    paths: [[[-12, 220], [110, 220], [110, 60], [230, 60], [230, 190], [350, 190], [350, 40], [456, 40]]],
    blocked: [[140, 100, 60, 60], [380, 90, 70, 60], [20, 30, 60, 40]],
    pool: [['garter', 1], ['skink', 1], ['gecko', 3], ['basilisk', 5], ['horned', 7], ['chameleon', 9], ['thorny', 10], ['boxturtle', 11],
      ['tuatara', 12], ['frilled', 13], ['rattlesnake', 15], ['chuckwalla', 17], ['gila', 20], ['cobra', 22], ['tortoise', 25]] },
  { id: 'amazon', name: 'Amazon Canopy', theme: 'amazon', rounds: 40, boss: 'queen', seed: 53, decor: 22, pressure: 1.3,
    blurb: 'The wintering grounds. Two trails through the rainforest meet at the nest.',
    paths: [
      [[-12, 50], [150, 50], [150, 135], [330, 135], [330, 220], [456, 220]],
      [[-12, 225], [240, 225], [240, 135], [330, 135], [330, 220], [456, 220]]],
    blocked: [[370, 20, 40, 90], [180, 170, 40, 30]],
    pool: [['anole', 1], ['skink', 1], ['gecko', 2], ['hognose', 4], ['draco', 6], ['iguana', 8], ['chameleon', 10], ['caiman', 12],
      ['seaturtle', 14], ['tuatara', 15], ['frilled', 16], ['croc', 18], ['worm', 20], ['rattlesnake', 22], ['cobra', 24], ['gila', 26],
      ['chuckwalla', 28], ['tortoise', 30]] },
];
