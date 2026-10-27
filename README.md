# Tyrant's Nest

A Bloons-style pixel tower defence. Eastern Kingbirds defend their nest from every reptile on Earth.

- 14 kingbird towers in 3 roles (attack, support, financial). Each has 2 upgrade paths of 3 tiers, and only one path can reach tier 3.
- New towers unlock with XP. Every round you clear earns XP, and more on later maps.
- 30 reptiles, each with its own health and ability: camouflage, shells, burrowing, puffing up, venom that stuns towers, frills that slow them, and 6 bosses.
- 4 levels that unlock in order, plus an endless mode on every unlocked map.
- Balance is checked by `tests/bot.mjs`, a bot that plays the whole campaign from scratch and must beat each level within 3 tries.
- Feathers earned in play buy permanent upgrades in The Roost.
- Saving: the run saves at the start of every round, and progress is kept in the browser plus a server copy.

## Play locally

```
python run.py
```

This opens http://localhost:8000. Saves are also written to `saves/save.json`. Use `python run.py --no-browser` to skip opening a tab, or set `PORT` to change the port. It needs Python 3.9+ and has no dependencies.

## Tests

```
python -m unittest discover tests     # backend: saves, input checks, serving the game
node tests/sim.test.mjs               # game rules, plus the campaign balance bot
```

## Deploy to Vercel

`vercel.json` serves `public/` as static files and sends `/api/*` to `run.py`.

To turn on cloud saves, add Upstash Redis from the Vercel Marketplace (Storage tab). It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Players then get a save code on the title screen and can enter it on another device. Without Redis the game still works and saves in the browser.

## Where things live

| File | What it holds |
|---|---|
| `public/js/towers/` | One file per kingbird tower: cost, stats, upgrade paths, scarf colour and props. `index.js` sets the shop order. |
| `public/js/lizards/` | One file per reptile (snakes, turtles and crocs included): stats, abilities, colours. |
| `public/js/data.js` | Maps, themes, starting cash and eggs, Roost costs |
| `public/js/sim.js` | Game rules, including what each attack kind does. No DOM, so it runs headless in tests. |
| `public/js/sprites.js` | Pixel art drawn in code (no image files): bird poses, reptile body shapes, scenery |
| `public/js/art.js` | Shared drawing helpers used by sprites.js and the tower files |
| `public/js/sfx.js` | Sound effects, synthesized in code |
| `public/js/render.js` | Draws the board |
| `public/js/main.js` | Screens, input, game loop |
| `public/js/save.js` | Browser and server saves |
| `run.py` | Local server and Vercel API |
