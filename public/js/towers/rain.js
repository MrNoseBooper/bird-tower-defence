import { px, blob, post } from '../art.js';

// Rain Caller
export default {
  name: 'Rain Caller', role: 'support', cost: 600, unlock: 170,
  desc: 'Calls a cool shower over the whole map every 12 seconds. Every reptile slows down for 3 seconds.',
  base: { kind: 'rain', rate: 12, slow: 0.3, wet: 3 },
  paths: [
    [{ name: 'Heavy Rain', cost: 400, desc: 'Slows 45%', fx: { slow: 0.15 } },
     { name: 'Long Storm', cost: 700, desc: 'Rain lasts 5 seconds', fx: { wet: 2 } },
     { name: 'Monsoon', cost: 3000, desc: 'Slows 60%, rains more often', fx: { slow: 0.15, rate: 0.65 } }],
    [{ name: 'Thunderclap', cost: 500, desc: 'Each storm deals 2 damage to every reptile', fx: { dmg: 2 } },
     { name: 'Lightning', cost: 900, desc: '6 damage per storm', fx: { dmg: 4 } },
     { name: 'Storm King', cost: 2800, desc: '16 damage per storm, cracks shells', fx: { dmg: 10, cracks: true } }],
  ],
  // looks: scarf colour, and props drawn behind (back) and in front of (front) the bird; f is the prop's animation frame
  scarf: '#5b8cff',
  back(g, f) {
    post(g);
    blob(g, 6, 4, 5, 3, ['#b9c6d8', '#e6eef7', '#ffffff']);
    for (let k = 0; k < 3; k++) px(g, 3 + k * 3, 8 + ((k + f) % 2) * 2, '#3da5ff'); // falling drops
  },
};
