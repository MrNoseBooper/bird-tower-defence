// Game content and balance. Everything here is plain data, so tuning never touches game code.

export const START = { cash: 650, eggs: 30 };

// Permanent upgrades bought with feathers in The Roost.
export const ROOST_MAX = 5;
export const roostCost = rank => 5 * (rank + 1);
export const ROLE_PERK = { attack: '+6% attack speed, +3% range', support: '+8% circle size (or speed)', financial: '+10% berries' };
export const PERKS = { eggs: ['Extra Eggs', '+3 starting eggs'], cash: ['Head Start', '+100 starting berries'] };

// Upgrade fx: numbers add to the stat, `rate` (seconds per attack) multiplies, true turns a feature on.
// Each tower has 2 paths of 3 tiers, and only one path can reach tier 3.
// `unlock` is the XP needed. Every cleared round gives XP, more on later maps.
export const TOWERS = {
  hawker: {
    name: 'Hawker', role: 'attack', cost: 180, unlock: 0,
    desc: 'Darts out from its perch to peck nearby reptiles. Fast, short range.',
    base: { kind: 'peck', range: 42, rate: 0.7, dmg: 1, pierce: 1 },
    paths: [
      [{ name: 'Sharp Beak', cost: 140, desc: '+1 damage', fx: { dmg: 1 } },
       { name: 'Iron Beak', cost: 320, desc: 'Cracks shells, pecks 2 reptiles', fx: { cracks: true, pierce: 1 } },
       { name: 'Giant Slayer', cost: 1400, desc: '+4 damage, triple damage to big reptiles', fx: { dmg: 4, bigMul: 2 } }],
      [{ name: 'Quick Wings', cost: 120, desc: 'Attacks 25% faster', fx: { rate: 0.75 } },
       { name: 'Long Sally', cost: 240, desc: '+14 range, sees camouflage', fx: { range: 14, camo: true } },
       { name: 'Flurry', cost: 1500, desc: 'Attacks 2.5x faster, pecks 2 more', fx: { rate: 0.4, pierce: 2 } }],
    ],
  },
  quill: {
    name: 'Quill Sniper', role: 'attack', cost: 320, unlock: 0,
    desc: 'Fires quills at any reptile on the map. Slow, but cracks shells.',
    base: { kind: 'snipe', range: Infinity, rate: 1.6, dmg: 2, pierce: 1, cracks: true },
    paths: [
      [{ name: 'Steel Quills', cost: 300, desc: '+2 damage', fx: { dmg: 2 } },
       { name: 'Night Vision', cost: 420, desc: 'Sees camouflage, +2 damage', fx: { camo: true, dmg: 2 } },
       { name: 'Deadly Aim', cost: 2600, desc: '+14 damage, double damage to big reptiles', fx: { dmg: 14, bigMul: 1 } }],
      [{ name: 'Fast Draw', cost: 260, desc: 'Fires 30% faster', fx: { rate: 0.7 } },
       { name: 'Split Quill', cost: 600, desc: 'Each quill hits 2 more reptiles', fx: { pierce: 2 } },
       { name: 'Quill Storm', cost: 2400, desc: 'Fires 2.5x faster', fx: { rate: 0.4 } }],
    ],
  },
  bomber: {
    name: 'Berry Bomber', role: 'attack', cost: 480, unlock: 15,
    desc: 'Lobs exploding berries that splash whole groups. Cracks shells.',
    base: { kind: 'bomb', range: 62, rate: 1.4, dmg: 1, splash: 16, cracks: true },
    paths: [
      [{ name: 'Big Berries', cost: 320, desc: 'Bigger splash', fx: { splash: 6 } },
       { name: 'Heavy Fruit', cost: 550, desc: '+2 damage', fx: { dmg: 2 } },
       { name: 'Melon Mortar', cost: 3000, desc: '+5 damage, huge splash', fx: { dmg: 5, splash: 10 } }],
      [{ name: 'Sticky Jam', cost: 350, desc: 'Splashed reptiles slow down', fx: { slow: 0.35 } },
       { name: 'Quick Toss', cost: 450, desc: 'Throws 30% faster, +10 range', fx: { rate: 0.7, range: 10 } },
       { name: 'Jam Storm', cost: 2500, desc: 'Throws 2x faster, stickier jam', fx: { rate: 0.5, slow: 0.2 } }],
    ],
  },
  mobber: {
    name: 'Mobber', role: 'attack', cost: 380, unlock: 32,
    desc: 'Calls in the flock: every few seconds kingbirds mob every reptile in its circle.',
    base: { kind: 'pulse', range: 34, rate: 1.8, dmg: 1 },
    paths: [
      [{ name: 'Bigger Flock', cost: 260, desc: '+1 damage', fx: { dmg: 1 } },
       { name: 'Iron Beaks', cost: 480, desc: 'Cracks shells, +1 damage', fx: { cracks: true, dmg: 1 } },
       { name: 'Murmuration', cost: 2600, desc: '+3 damage, bigger circle', fx: { dmg: 3, range: 12 } }],
      [{ name: 'Quick Calls', cost: 280, desc: 'Mobs 25% more often', fx: { rate: 0.75 } },
       { name: 'Wide Mob', cost: 500, desc: 'Bigger circle, sees camouflage', fx: { range: 10, camo: true } },
       { name: 'Endless Mob', cost: 2400, desc: 'Mobs 2.5x as often', fx: { rate: 0.4 } }],
    ],
  },
  screecher: {
    name: 'Screecher', role: 'attack', cost: 520, unlock: 105,
    desc: 'A piercing screech that leaps between 3 reptiles.',
    base: { kind: 'chain', range: 70, rate: 1.4, dmg: 2, chain: 3 },
    paths: [
      [{ name: 'Louder', cost: 380, desc: '+2 damage', fx: { dmg: 2 } },
       { name: 'Shatter Shriek', cost: 650, desc: 'Cracks shells, leaps to 1 more', fx: { cracks: true, chain: 1 } },
       { name: 'Thunder Call', cost: 2800, desc: '+6 damage, double damage to big reptiles', fx: { dmg: 6, bigMul: 1 } }],
      [{ name: 'Long Echo', cost: 420, desc: 'Leaps to 2 more reptiles', fx: { chain: 2 } },
       { name: 'Stunning Screech', cost: 750, desc: 'Stuns reptiles for a moment', fx: { stun: 0.35 } },
       { name: 'Storm Song', cost: 2600, desc: 'Screeches 2x as fast, leaps to 2 more', fx: { rate: 0.5, chain: 2 } }],
    ],
  },
  lookout: {
    name: 'Lookout', role: 'support', cost: 400, unlock: 4,
    desc: 'Keeps watch from a tall post. Attack towers in its circle get +15% range.',
    base: { kind: 'lookout', aura: 55, rangeBuff: 0.15 },
    paths: [
      [{ name: 'Taller Post', cost: 200, desc: 'Bigger circle', fx: { aura: 15 } },
       { name: 'Eagle Eyes', cost: 450, desc: 'Towers in its circle see camouflage', fx: { camoBuff: true } },
       { name: 'Spotter', cost: 1800, desc: 'Reptiles in its circle take 30% more damage', fx: { spot: 0.3 } }],
      [{ name: 'Pep Talk', cost: 300, desc: 'Towers in its circle attack 15% faster', fx: { rateBuff: 0.15 } },
       { name: 'Crown Rally', cost: 800, desc: 'They attack 30% faster', fx: { rateBuff: 0.15 } },
       { name: "Tyrant's Call", cost: 2500, desc: 'They also deal +1 damage', fx: { dmgBuff: 1 } }],
    ],
  },
  shade: {
    name: 'Shade Weaver', role: 'support', cost: 350, unlock: 22,
    desc: 'Weaves a leafy canopy. Cold-blooded reptiles in its shade slow down and stop healing.',
    base: { kind: 'shade', aura: 40, slow: 0.25 },
    paths: [
      [{ name: 'Wide Canopy', cost: 220, desc: 'Bigger shade', fx: { aura: 12 } },
       { name: 'Deep Shade', cost: 450, desc: 'Slows 40%', fx: { slow: 0.15 } },
       { name: 'Cold Snap', cost: 1700, desc: 'Slows 60%, even bigger shade', fx: { slow: 0.2, aura: 10 } }],
      [{ name: 'Brambles', cost: 300, desc: 'Thorns deal 1 damage a second in the shade', fx: { thorns: 1 } },
       { name: 'Thick Brambles', cost: 650, desc: '3 damage a second', fx: { thorns: 2 } },
       { name: 'Thornwall', cost: 2200, desc: '8 damage a second, cracks shells', fx: { thorns: 5, cracks: true } }],
    ],
  },
  flasher: {
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
  },
  rain: {
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
  },
  orchard: {
    name: 'Berry Orchard', role: 'financial', cost: 500, unlock: 0,
    desc: 'Grows 80 berries during every round.',
    base: { kind: 'orchard', income: 80 },
    paths: [
      [{ name: 'Bigger Bushes', cost: 300, desc: '+40 berries a round', fx: { income: 40 } },
       { name: 'Berry Baskets', cost: 700, desc: '+80 berries a round', fx: { income: 80 } },
       { name: 'Golden Grove', cost: 3200, desc: '+320 berries a round', fx: { income: 320 } }],
      [{ name: 'Fruit Stand', cost: 400, desc: 'Everything costs 5% less', fx: { discount: 0.05 } },
       { name: 'Market', cost: 900, desc: 'Everything costs 10% less', fx: { discount: 0.05 } },
       { name: 'Trade Hub', cost: 2800, desc: '15% less, +150 berries a round', fx: { discount: 0.05, income: 150 } }],
    ],
  },
  scavenger: {
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
  },
  nestegg: {
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
  },
  taxman: {
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
  },
  ranch: {
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
  },
};

// hp: health, speed: pixels a second, bounty: berries when defeated, eggs: eggs eaten if it reaches the nest.
// Abilities: camo, shell, playDead, sprint, regen (hp/s), spawns, rattle/spit [radius, stun s, every s], steady (can't be slowed),
// spiky (beaks do half damage), frill (radius where towers reload slower), squirt [radius, stun s] on death,
// dive [seconds up, seconds hidden] (burrow: underground), puff (seconds shelled after a hit), glide [every s, pixels],
// lays [reptile, count, every s], rare (seldom picked, worth a lot).
export const REPTILES = {
  anole: { name: 'Anole', sprite: 'lizard', pal: 'anole', hp: 1, speed: 30, bounty: 1, eggs: 1, note: 'A little lizard that comes in crowds.' },
  garter: { name: 'Garter Snake', sprite: 'snake', pal: 'garter', hp: 2, speed: 40, bounty: 2, eggs: 1, note: 'A quick little snake.' },
  skink: { name: 'Skink', sprite: 'lizard', pal: 'skink', hp: 3, speed: 56, bounty: 3, eggs: 1, note: 'Very fast.' },
  gecko: { name: 'Gecko', sprite: 'lizard', pal: 'gecko', hp: 4, speed: 48, bounty: 4, eggs: 1, steady: true, note: 'Sticky feet: it cannot be slowed.' },
  chameleon: { name: 'Chameleon', sprite: 'lizard', pal: 'chameleon', hp: 5, speed: 30, bounty: 5, eggs: 2, camo: true,
    note: 'Camouflaged! Only towers that see camouflage can target it (Hawker Long Sally, Quill Night Vision, Lookout Eagle Eyes).' },
  hognose: { name: 'Hognose Snake', sprite: 'snake', pal: 'hognose', hp: 6, speed: 36, bounty: 5, eggs: 2, playDead: true, note: 'Plays dead once, then gets back up.' },
  boxturtle: { name: 'Box Turtle', sprite: 'turtle', pal: 'boxturtle', hp: 8, speed: 20, bounty: 7, eggs: 2, shell: true,
    note: 'Shelled! Only shell-cracking attacks hurt it (Quill Sniper, Berry Bomber, Hawker Iron Beak).' },
  thorny: { name: 'Thorny Devil', sprite: 'lizard', pal: 'thorny', hp: 9, speed: 26, bounty: 8, eggs: 2, spiky: true, note: 'Covered in spikes: beak attacks (Hawker, Mobber) only do half damage.' },
  basilisk: { name: 'Basilisk', sprite: 'lizard', pal: 'basilisk', hp: 10, speed: 40, bounty: 8, eggs: 2, sprint: true, note: 'Sprints when it gets hit.' },
  horned: { name: 'Horned Lizard', sprite: 'lizard', pal: 'horned', hp: 12, speed: 26, bounty: 10, eggs: 2, squirt: [32, 1.5],
    note: 'Squirts blood when defeated, stunning towers next to it. Snipe it from afar.' },
  frilled: { name: 'Frilled Lizard', sprite: 'lizard', pal: 'frilled', hp: 14, speed: 32, bounty: 10, eggs: 2, frill: 36, note: 'Flares its frill: towers near it attack 40% slower.' },
  draco: { name: 'Flying Dragon', sprite: 'lizard', pal: 'draco', hp: 16, speed: 30, bounty: 12, eggs: 2, glide: [4, 40], note: 'Glides ahead in sudden bursts.' },
  worm: { name: 'Worm Lizard', sprite: 'snake', pal: 'worm', hp: 18, speed: 30, bounty: 14, eggs: 3, dive: [1.2, 2.4], burrow: true,
    note: 'Burrows underground and only pops up now and then. It cannot be hit while buried.' },
  iguana: { name: 'Iguana', sprite: 'biglizard', pal: 'iguana', hp: 22, speed: 24, bounty: 12, eggs: 3, regen: 2, note: 'Basks to heal, unless it is in the shade.' },
  seaturtle: { name: 'Sea Turtle', sprite: 'bigturtle', pal: 'seaturtle', hp: 26, speed: 20, bounty: 12, eggs: 3, spawns: [['hatchling', 4]], note: 'Hatchlings burst out when it is defeated.' },
  hatchling: { name: 'Hatchling', sprite: 'hatchling', pal: 'seaturtle', hp: 2, speed: 38, bounty: 1, eggs: 1, note: 'Tiny and quick.' },
  rattlesnake: { name: 'Rattlesnake', sprite: 'snake', pal: 'rattle', hp: 40, speed: 28, bounty: 18, eggs: 4, rattle: [40, 1, 5], note: 'Its rattle stuns nearby towers.' },
  chuckwalla: { name: 'Chuckwalla', sprite: 'biglizard', pal: 'chuck', hp: 45, speed: 22, bounty: 18, eggs: 3, puff: 2,
    note: 'Puffs up when hit and is shelled for 2 seconds. Shell crackers hurt it any time.' },
  cobra: { name: 'Spitting Cobra', sprite: 'snake', pal: 'cobra', hp: 50, speed: 26, bounty: 22, eggs: 4, spit: [60, 2, 4], note: 'Spits venom that stuns the nearest tower.' },
  caiman: { name: 'Caiman', sprite: 'croc', pal: 'caiman', hp: 60, speed: 26, bounty: 22, eggs: 4, dive: [3, 1.5], note: 'Dives now and then. It cannot be hit while under.' },
  gila: { name: 'Gila Monster', sprite: 'biglizard', pal: 'gila', hp: 70, speed: 18, bounty: 26, eggs: 5, big: true, fatTail: true, note: 'Big. Heals once when badly hurt.' },
  tuatara: { name: 'Tuatara', sprite: 'biglizard', pal: 'tuatara', hp: 80, speed: 34, bounty: 120, eggs: 1, rare: true, note: 'A rare living fossil. Catch it for a pile of berries!' },
  croc: { name: 'Crocodile', sprite: 'croc', pal: 'croc', hp: 130, speed: 22, bounty: 40, eggs: 8, big: true, note: 'Big and tough.' },
  tortoise: { name: 'Galápagos Tortoise', sprite: 'bigturtle', pal: 'tortoise', hp: 240, speed: 11, bounty: 65, eggs: 12, big: true, shell: true, steady: true, note: 'Huge, shelled, and cannot be slowed.' },
  eggeater: { name: 'Old Egg-Eater', sprite: 'bigsnake', pal: 'ratsnake', hp: 400, speed: 13, bounty: 150, eggs: 25, boss: true, big: true,
    spawns: [['garter', 6], ['hognose', 2]], note: 'Boss! A giant rat snake that releases more snakes when defeated.' },
  bigal: { name: 'Big Al', sprite: 'bigcroc', pal: 'gator', hp: 1200, speed: 11, bounty: 300, eggs: 25, boss: true, big: true,
    spawns: [['croc', 3]], note: 'Boss! An alligator that releases crocodiles when defeated.' },
  komodo: { name: 'Komodo King', sprite: 'biglizard2', pal: 'komodo', hp: 1800, speed: 12, bounty: 400, eggs: 25, boss: true, big: true, regen: 8, frill: 50,
    spawns: [['gila', 3]], note: 'Boss! A giant monitor lizard. It heals unless shaded, and towers near it attack slower.' },
  rattleking: { name: 'Rattle King', sprite: 'bigsnake', pal: 'rattle', hp: 2200, speed: 10, bounty: 500, eggs: 25, boss: true, big: true,
    rattle: [60, 1, 5], spawns: [['rattlesnake', 4]], note: 'Boss! Its rattle stuns towers in a wide circle.' },
  leatherback: { name: 'Leatherback Matriarch', sprite: 'bigturtle2', pal: 'leather', hp: 3000, speed: 9, bounty: 700, eggs: 25, boss: true, big: true,
    lays: ['hatchling', 3, 4], spawns: [['seaturtle', 4]], note: 'Boss! A giant sea turtle that lays hatchlings as she walks.' },
  queen: { name: 'Queen Constrictor', sprite: 'bigsnake', pal: 'anaconda', hp: 3800, speed: 7, bounty: 900, eggs: 25, boss: true, big: true,
    regen: 6, spawns: [['croc', 2], ['gila', 2]], note: 'Boss! A giant anaconda that heals unless it is shaded.' },
};
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
