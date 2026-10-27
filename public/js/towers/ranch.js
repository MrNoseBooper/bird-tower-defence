import { rect, px } from '../art.js';

// Bug Ranch
export default {
  name: 'Bug Ranch', role: 'financial', cost: 400, unlock: 135,
  desc: 'Raises juicy bugs: 25 berries a round, growing by 14 every round you keep it (for 10 rounds).',
  base: { kind: 'orchard', income: 25, growth: 14, grow: 10 },
  paths: [
    [{ name: 'Fat Grubs', cost: 450, desc: 'Grows 8 more a round', fx: { growth: 8 } },
     { name: 'Beetle Farm', cost: 900, desc: 'Grows 12 more a round', fx: { growth: 12 } },
     { name: 'Bug Empire', cost: 3200, desc: 'Grows 30 more a round', fx: { growth: 30 } }],
    [{ name: 'Quick Hatch', cost: 350, desc: 'Fully grown in 5 rounds', fx: { grow: -5, growth: 14 } },
     { name: 'Firefly Farm', cost: 800, desc: '+60 berries a round', fx: { income: 60 } },
     { name: 'Bug Bazaar', cost: 3000, desc: '+240 berries a round', fx: { income: 240 } }],
  ],
  // looks: scarf colour, and props drawn behind (back) and in front of (front) the bird; f is the prop's animation frame
  scarf: '#c8763a',
  back(g, f) {
    rect(g, 2, 21, 20, 4, '#a46b33'); rect(g, 2, 21, 20, 1, '#7a4b26');
    for (const x of [2, 8, 14, 20]) rect(g, x, 18, 1, 6, '#6e4420');
    rect(g, 2, 19, 19, 1, '#d29a55');
    px(g, 5 + f, 23, '#ff3b4f'); px(g, 12 - f, 22, '#4fd15f'); px(g, 17 + f, 23, '#ffd23f'); // bugs scurrying
  },
};
