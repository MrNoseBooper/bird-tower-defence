import { rect, px, post } from '../art.js';

// Tax Collector
export default {
  name: 'Tax Collector', role: 'financial', cost: 400, unlock: 60,
  desc: 'A true tyrant: every reptile that walks through its circle pays 1 berry.',
  base: { kind: 'toll', aura: 32, toll: 1 },
  paths: [
    [{ name: 'Higher Tax', cost: 300, desc: '2 berries per reptile', fx: { toll: 1 } },
     { name: 'Wealth Tax', cost: 650, desc: '3 berries per reptile', fx: { toll: 1 } },
     { name: "Tyrant's Tithe", cost: 2400, desc: '6 berries per reptile', fx: { toll: 3 } }],
    [{ name: 'Wide Gate', cost: 250, desc: 'Bigger circle', fx: { aura: 12 } },
     { name: 'Checkpoint', cost: 600, desc: 'Taxed reptiles stop for a moment', fx: { stop: 0.4 } },
     { name: 'Toll Road', cost: 2000, desc: 'Even bigger circle, longer stops', fx: { aura: 10, stop: 0.4 } }],
  ],
  // looks: scarf colour, and props drawn behind (back) and in front of (front) the bird; f is the prop's animation frame
  scarf: '#2ecc71',
  back: post,
  front(g, f) {
    rect(g, 15, 19, 7, 5, '#a46b33'); rect(g, 15, 19, 7, 1, '#d29a55'); rect(g, 15, 23, 7, 1, '#6e4420');
    rect(g, 17, 16, 3, 3, '#ffcc33'); px(g, 18, 17, '#a35a00'); if (f) px(g, 19, 16, '#ffffff');
  },
};
