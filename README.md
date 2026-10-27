# Tyrant's Nest

A Bloons-style pixel tower defence. Eastern Kingbirds defend their nest from every reptile on Earth.

- 8 kingbird towers in 3 roles (attack, support, financial). Each has 2 upgrade paths of 3 tiers, and only one path can reach tier 3.
- 18 reptiles, each with its own health and ability: camouflage, shells, playing dead, healing, rattles that stun towers, and bosses that release more reptiles.
- 4 levels that unlock in order, plus an endless mode on every unlocked map.
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
node tests/sim.test.mjs               # game rules, plus a bot that must beat level 1
```

## Deploy to Vercel

`vercel.json` serves `public/` as static files and sends `/api/*` to `run.py`.

To turn on cloud saves, add Upstash Redis from the Vercel Marketplace (Storage tab). It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Players then get a save code on the title screen and can enter it on another device. Without Redis the game still works and saves in the browser.

## Where things live

| File | What it holds |
|---|---|
| `public/js/data.js` | Towers, upgrades, reptiles, maps. All balance numbers are here. |
| `public/js/sim.js` | Game rules. No DOM, so it runs headless in tests. |
| `public/js/sprites.js` | Pixel art drawn in code (no image files) |
| `public/js/render.js` | Draws the board |
| `public/js/main.js` | Screens, input, game loop |
| `public/js/save.js` | Browser and server saves |
| `run.py` | Local server and Vercel API |
