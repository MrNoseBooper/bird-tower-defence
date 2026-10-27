// Queen Constrictor
export default {
  name: 'Queen Constrictor', sprite: 'bigsnake', hp: 3800, speed: 7, bounty: 900, eggs: 25, boss: true, big: true, regen: 6, spawns: [['croc', 2], ['gila', 2]],
  note: 'Boss! A giant anaconda that heals unless it is shaded.',
  colors: { 1: '#6a8a34', 2: '#36481a', 3: '#e0d98a', 4: '#26300f', e: '#ffd23f' }, // 1 body, 2 dark, 3 belly/skin, 4 accent, e eye
};
