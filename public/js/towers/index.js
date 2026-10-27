// Every tower, in shop order. Each tower's stats, upgrades and look live in its own file in this folder.
// Upgrade fx: numbers add to the stat, `rate` (seconds per attack) multiplies, true turns a feature on.
// Each tower has 2 paths of 3 tiers, and only one path can reach tier 3.
// `unlock` is the XP needed. Every cleared round gives XP, more on later maps.
import hawker from './hawker.js';
import quill from './quill.js';
import bomber from './bomber.js';
import mobber from './mobber.js';
import screecher from './screecher.js';
import lookout from './lookout.js';
import shade from './shade.js';
import flasher from './flasher.js';
import rain from './rain.js';
import orchard from './orchard.js';
import scavenger from './scavenger.js';
import nestegg from './nestegg.js';
import taxman from './taxman.js';
import ranch from './ranch.js';

export const TOWERS = { hawker, quill, bomber, mobber, screecher, lookout, shade, flasher, rain, orchard, scavenger, nestegg, taxman, ranch };
