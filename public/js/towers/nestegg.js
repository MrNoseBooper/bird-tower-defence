import { rect, px, WOOD } from '../art.js';

// Nest Egg
export default {
  name: 'Nest Egg', role: 'financial', cost: 550, unlock: 45,
  desc: 'Savings! Pays 5% interest on your berries after each round (up to 100).',
  base: { kind: 'nestegg', interest: 0.05, cap: 100, eggs: 0 },
  paths: [
    [{ name: 'Deeper Nest', cost: 400, desc: 'Interest up to 250', fx: { cap: 150 } },
     { name: 'Compound', cost: 900, desc: '7% interest, up to 500', fx: { interest: 0.02, cap: 250 } },
     { name: 'Golden Egg', cost: 3500, desc: '10% interest, up to 1500', fx: { interest: 0.03, cap: 1000 } }],
    [{ name: 'Spare Egg', cost: 350, desc: 'Lays 1 egg each round', fx: { eggs: 1 } },
     { name: 'Clutch', cost: 800, desc: 'Lays 2 eggs each round', fx: { eggs: 1 } },
     { name: 'Brood Mother', cost: 2400, desc: 'Lays 4 eggs each round', fx: { eggs: 2 } }],
  ],
  // looks: scarf colour, and props drawn behind (back) and in front of (front) the bird; f is the prop's animation frame
  scarf: '#f2b520',
  back(g) { rect(g, 4, 15, 17, 2, WOOD[0]); },
  front(g, f) {
    rect(g, 17, 12, 4, 5, '#ffcc33'); rect(g, 18, 11, 2, 1, '#ffcc33'); px(g, 18, 12, '#fff5b8'); rect(g, 20, 13, 1, 4, '#d9a21e');
    if (f) for (const [x, y] of [[22, 9], [21, 10], [23, 10], [22, 11], [22, 10]]) px(g, x, y, '#ffffff'); // glint
    rect(g, 3, 16, 19, 4, WOOD[1]); rect(g, 4, 20, 17, 1, WOOD[0]);
    for (let x = 4; x < 21; x += 3) { px(g, x, 16, WOOD[2]); px(g, x + 1, 18, WOOD[0]); }
  },
};
