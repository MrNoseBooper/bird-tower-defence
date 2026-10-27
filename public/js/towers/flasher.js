import { rect, px } from '../art.js';

// Crown Flasher
export default {
  name: 'Crown Flasher', role: 'support', cost: 420, unlock: 80,
  desc: 'Flashes its hidden red crown. Reptiles in its circle panic and back away for a moment.',
  base: { kind: 'flash', aura: 38, rate: 5, scare: 0.8 },
  paths: [
    [{ name: 'Bright Crown', cost: 250, desc: 'Bigger circle', fx: { aura: 12 } },
     { name: 'Terror', cost: 600, desc: 'Reptiles back away for longer', fx: { scare: 0.6 } },
     { name: "Tyrant's Glare", cost: 2200, desc: 'Flashes twice as often', fx: { rate: 0.5 } }],
    [{ name: 'Shaken', cost: 400, desc: 'Scared reptiles take 25% more damage', fx: { fear: 0.25 } },
     { name: 'Quick Flash', cost: 650, desc: 'Flashes 30% more often', fx: { rate: 0.7 } },
     { name: 'Royal Terror', cost: 2500, desc: 'Even bosses back away', fx: { royal: true } }],
  ],
  // looks: scarf colour, and props drawn behind (back) and in front of (front) the bird; f is the prop's animation frame
  scarf: '#ff2e63',
  back(g) {
    rect(g, 6, 18, 13, 2, '#9b45d6'); rect(g, 6, 20, 13, 1, '#6a2fa0'); px(g, 8, 18, '#d39be8');
    rect(g, 10, 21, 4, 4, '#ffcc33'); rect(g, 13, 21, 1, 4, '#d9a21e'); rect(g, 8, 25, 8, 1, 'rgba(0,0,0,0.2)');
  },
};
