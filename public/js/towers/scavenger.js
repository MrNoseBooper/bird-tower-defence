import { rect, px, blob, post } from '../art.js';

// Scale Scavenger
export default {
  name: 'Scale Scavenger', role: 'financial', cost: 400, unlock: 9,
  desc: 'Reptiles defeated in its circle drop 25% more berries.',
  base: { kind: 'scavenger', aura: 50, bonus: 0.25, flat: 0 },
  paths: [
    [{ name: 'Keen Nose', cost: 250, desc: 'Bigger circle', fx: { aura: 15 } },
     { name: 'Scale Sacks', cost: 650, desc: '+50% berries', fx: { bonus: 0.25 } },
     { name: 'Treasure Hoard', cost: 2400, desc: '+100% berries', fx: { bonus: 0.5 } }],
    [{ name: 'Bounty Board', cost: 300, desc: '+1 berry for every reptile defeated anywhere', fx: { flat: 1 } },
     { name: 'Wanted Posters', cost: 750, desc: '+2 per reptile', fx: { flat: 1 } },
     { name: 'Bounty Office', cost: 2600, desc: '+4 per reptile', fx: { flat: 2 } }],
  ],
  // looks: scarf colour, and props drawn behind (back) and in front of (front) the bird; f is the prop's animation frame
  scarf: '#d9965a',
  back: post,
  front(g) {
    blob(g, 19, 21, 3, 3, ['#a07a45', '#e0b673', '#f7dca0']);
    rect(g, 18, 17, 3, 1, '#6e4420'); px(g, 19, 21, '#4fd15f'); px(g, 20, 22, '#4fd15f'); px(g, 18, 22, '#36a845');
  },
};
