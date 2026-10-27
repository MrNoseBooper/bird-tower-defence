// Screens, input and the game loop.
import { TOWERS, REPTILES, MAPS, ROLE_PERK, PERKS, ROOST_MAX, roostCost } from './data.js';
import * as sim from './sim.js';
import { draw, background, drawParade } from './render.js';
import { towerIcon, iconURL } from './sprites.js';
import { loadLocal, persist, pull, normalize } from './save.js';
import * as sfx from './sfx.js';

const $ = sel => document.querySelector(sel);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const button = (label, fn, cls) => { const b = el('button', cls, label); b.onclick = fn; return b; };
const image = src => { const i = el('img', 'pixel'); i.src = src; i.alt = ''; return i; };
const setText = (e, v) => { v = String(v); if (e.textContent !== v) e.textContent = v; };

const KINDS = Object.keys(TOWERS);
const board = $('#board'), ctx = board.getContext('2d'), parade = $('#parade').getContext('2d');
ctx.imageSmoothingEnabled = false;
const ui = { placing: null, sel: null, mx: 0, my: 0, hover: false, built: null, last: [0, 'campaign'] };
let save = loadLocal(), game = null, paused = false, acc = 0, lastFrame = 0, wait = 0, shake = 0, lastCash = 0, bumpAt = 0;
const calm = matchMedia('(prefers-reduced-motion: reduce)');
const AUTO_START = 10; // seconds between rounds before the next one starts on its own

// ---- screens

function show(id) {
  if (id !== 'game') game = null;
  for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id;
  ({ title: renderTitle, levels: renderLevels, roost: renderRoost })[id]?.();
}

function renderTitle() {
  $('#btn-continue').hidden = !save.run;
  setText($('#t-feathers'), save.profile.feathers);
  setText($('#t-code'), save.code);
  const xp = save.profile.xp, next = KINDS.map(k => TOWERS[k]).filter(t => t.unlock > xp).sort((a, b) => a.unlock - b.unlock)[0];
  setText($('#t-xp'), `${xp} XP · ${next ? `next kingbird: ${next.name} at ${next.unlock} XP` : 'every kingbird unlocked!'}`);
}

function renderLevels() {
  const p = save.profile;
  $('#level-list').replaceChildren(...MAPS.map((map, i) => {
    const locked = i > p.beaten, card = el('div', `card${locked ? ' locked' : ''}`), thumb = el('canvas', 'pixel');
    thumb.width = sim.W;
    thumb.height = sim.H;
    thumb.getContext('2d').drawImage(background(map), 0, 0);
    card.append(thumb, el('h3', null, `${i + 1}. ${map.name}`), el('p', null, locked ? `Beat ${MAPS[i - 1].name} to unlock.` : map.blurb),
      el('p', 'small', `${map.rounds} rounds · best: round ${+p.best[map.id] || 0}${p.wins[map.id] ? ' · beaten!' : ''}`));
    if (!locked) {
      const row = el('div', 'row');
      row.append(button('Play', () => start(i, 'campaign'), 'primary'), button('Endless', () => start(i, 'endless')));
      card.append(row);
    }
    return card;
  }));
}

function renderRoost() {
  const p = save.profile;
  setText($('#r-feathers'), p.feathers);
  const items = [
    ...KINDS.map(k => [k, TOWERS[k].name, ROLE_PERK[TOWERS[k].role], towerIcon(k)]),
    ...Object.entries(PERKS).map(([k, [name, perk]]) => [k, name, perk, iconURL(k === 'eggs' ? 'egg' : 'berry')]),
  ];
  $('#roost-list').replaceChildren(...items.map(([key, name, perk, icon]) => {
    const rank = p.roost[key] || 0, cost = roostCost(rank), row = el('div', 'roost-row'), text = el('div');
    text.append(el('b', null, name), el('small', null, `${perk} per rank · rank ${rank}/${ROOST_MAX}`));
    const b = button(rank >= ROOST_MAX ? 'Maxed' : `Upgrade · ${cost}`, () => {
      p.feathers -= cost;
      p.roost[key] = rank + 1;
      persist(save);
      renderRoost();
    });
    b.disabled = rank >= ROOST_MAX || p.feathers < cost;
    row.append(image(icon), text, b);
    return row;
  }));
}

// ---- starting, saving and ending games

function enter(g) {
  show('game');
  game = g;
  paused = false;
  acc = 0;
  wait = 0;
  Object.assign(ui, { placing: null, sel: null, built: null, last: [g.mapIndex, g.mode] });
  buildShop();
  fit();
}

function start(mapIndex, mode) {
  enter(sim.newGame(mapIndex, mode, save.profile));
  saveRun();
}

function resume() {
  try {
    enter(sim.restore(save.run, save.profile));
  } catch {
    save.run = null;
    persist(save);
    show('title');
    modal('Saved game could not load', 'It was damaged, so it has been cleared. Your feathers and upgrades are safe.', [['OK', () => {}]]);
  }
}

// The run is saved between rounds, so quitting mid-round replays that round.
function saveRun() {
  const best = save.profile.best;
  best[game.map.id] = Math.max(+best[game.map.id] || 0, game.round);
  save.run = sim.snapshot(game);
  persist(save);
}
const changed = () => { if (!game.active) saveRun(); };

function win() {
  const p = save.profile, map = game.map, first = !p.wins[map.id];
  const earned = sim.feathers(game, true) + (first ? 15 : 0);
  p.wins[map.id] = true;
  p.feathers += earned;
  p.beaten = Math.max(p.beaten, game.mapIndex + 1);
  p.best[map.id] = Math.max(+p.best[map.id] || 0, game.round);
  save.run = null;
  persist(save);
  const unlocks = first ? [MAPS[game.mapIndex + 1]?.name, ...KINDS.filter(k => TOWERS[k].unlock === game.mapIndex + 1).map(k => TOWERS[k].name)].filter(Boolean) : [];
  modal('Nest defended!', `You beat ${map.name} and earned ${earned} feathers.${unlocks.length ? ` Unlocked: ${unlocks.join(', ')}.` : ''}`, [
    ['Keep going in endless', () => {
      game.mode = 'endless';
      game.over = null;
      ui.last = [game.mapIndex, 'endless'];
      buildShop();
      saveRun();
    }],
    ['Back to levels', () => show('levels')],
  ]);
}

function lose() {
  const earned = sim.feathers(game, false);
  save.profile.feathers += earned;
  save.run = null;
  persist(save);
  modal('The reptiles got the eggs!', `You reached round ${game.round} and earned ${earned} feathers. Spend them in The Roost to make your kingbirds stronger.`, [
    ['Try again', () => start(...ui.last)],
    ['Back to levels', () => show('levels')],
  ]);
}

function handleEvents() {
  for (const ev of game.events.splice(0)) {
    if (ev.type === 'kill') {
      sfx.kill(ev.big || ev.boss);
      if (ev.boss) { sfx.boss(); banner('Boss defeated!'); shake = 0.6; }
      else if (ev.big) shake = Math.max(shake, 0.15);
    } else if (ev.type === 'new') toast(`New reptile: ${REPTILES[ev.id].name}. ${REPTILES[ev.id].note}`, 8000);
    else if (ev.type === 'unlock') {
      toast(`New kingbird unlocked: ${TOWERS[ev.kind].name}! ${TOWERS[ev.kind].desc}`, 8000);
      buildShop();
    }
    else if (ev.type === 'round') {
      toast(`Round ${ev.round} cleared: +${ev.bonus} berries${ev.interest ? `, +${ev.interest} interest` : ''}${ev.eggs ? `, +${ev.eggs} eggs` : ''}`);
      if (!game.over) saveRun();
    } else if (ev.type === 'win') win();
    else if (ev.type === 'lose') lose();
  }
}

function modal(title, text, buttons) {
  setText($('#m-title'), title);
  setText($('#m-text'), text);
  $('#m-buttons').replaceChildren(...buttons.map(([label, fn], i) => button(label, () => { $('#modal').hidden = true; fn(); }, i ? '' : 'primary')));
  $('#modal').hidden = false;
  $('#m-buttons button').focus();
}

function toast(text, ms = 4000) {
  const box = $('#toasts'), t = el('div', 'toast', text);
  box.append(t);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => t.remove(), ms);
}

// ---- side panel

function buildShop() {
  $('#shop').replaceChildren(...['attack', 'support', 'financial'].flatMap(role => {
    const grid = el('div', 'grid');
    for (const kind of KINDS.filter(k => TOWERS[k].role === role)) {
      const t = TOWERS[kind], b = el('button', 'tw');
      b.dataset.kind = kind;
      b.title = sim.unlocked(game, kind) ? `${t.desc} (key ${KINDS.indexOf(kind) + 1})` : `Unlocks at ${t.unlock} XP. Every round you clear earns XP.`;
      b.append(image(towerIcon(kind)), el('span', 'nm', t.name), el('span', 'cost'));
      b.onclick = () => choose(kind);
      grid.append(b);
    }
    return [el('h4', null, role), grid];
  }));
}

function choose(kind) {
  if (!game || !sim.unlocked(game, kind)) return;
  ui.placing = ui.placing === kind ? null : kind;
  ui.sel = null;
}

function updateShop() {
  for (const b of document.querySelectorAll('#shop .tw')) {
    const kind = b.dataset.kind, open = sim.unlocked(game, kind), cost = sim.price(game, TOWERS[kind].cost);
    setText(b.querySelector('.cost'), open ? cost : `${TOWERS[kind].unlock} XP`);
    b.disabled = !open;
    b.classList.toggle('poor', open && game.cash < cost);
    b.classList.toggle('active', ui.placing === kind);
  }
}

function buildInfo(box, t) {
  if (!t) {
    const k = ui.placing;
    box.replaceChildren(el('p', 'help', k
      ? `${TOWERS[k].name}: ${TOWERS[k].desc} Click the map to place it. Right-click or Esc cancels.`
      : 'Pick a kingbird, then click the map to place it. Click a placed kingbird to upgrade it. Space starts the next round.'));
    return;
  }
  const def = TOWERS[t.kind], head = el('div', 'head'), name = el('div'), paths = el('div', 'paths'), row = el('div', 'row');
  name.append(el('b', null, def.name), el('small', null, def.role));
  const close = button('Close', () => { ui.sel = null; }, 'close');
  close.title = 'Back to the shop (Esc)';
  head.append(image(towerIcon(t.kind)), name, close);
  def.paths.forEach((path, p) => {
    const col = el('div', 'path'), tier = t.tiers[p], up = path[tier];
    col.append(el('div', 'pips', '■'.repeat(tier) + '□'.repeat(3 - tier)));
    if (up) {
      const b = el('button', 'up');
      b.dataset.path = p;
      b.append(el('b', null, up.name), el('span', null, up.desc), el('em'));
      b.onclick = () => { if (sim.upgrade(game, t, p)) changed(); };
      col.append(b);
    } else col.append(el('p', 'small', 'Path complete'));
    paths.append(col);
  });
  if (def.role === 'attack') row.append(button(`Target: ${t.target}`, () => { t.target = sim.TARGETS[(sim.TARGETS.indexOf(t.target) + 1) % sim.TARGETS.length]; changed(); }));
  const sell = button('Sell', () => { sim.sell(game, t); ui.sel = null; changed(); });
  sell.id = 'sell';
  row.append(sell);
  box.replaceChildren(head, el('p', 'desc', def.desc), paths, row);
}

// Rebuild the panel only when the selection changes, so buttons aren't swapped out mid-click.
// A selected tower's upgrades take the shop's place, so everything fits without scrolling.
function updateInfo() {
  const t = ui.sel, box = $('#info'), key = t ? `${t.id}|${t.tiers}|${t.target}` : `none|${ui.placing}`;
  if (key !== ui.built) {
    ui.built = key;
    buildInfo(box, t);
    $('#shop').hidden = !!t;
    if (t) $('#panel').scrollTop = 0;
  }
  if (!t) return;
  for (const b of box.querySelectorAll('.up')) {
    const u = sim.upgradeInfo(game, t, +b.dataset.path);
    b.disabled = u.locked || game.cash < u.price || !!game.over;
    setText(b.querySelector('em'), u.locked ? 'Other path is maxed' : u.price);
  }
  setText($('#sell'), `Sell · ${sim.sellValue(t)}`);
}

function hud() {
  setText($('#s-cash'), Math.floor(game.cash));
  if (game.cash > lastCash && performance.now() - bumpAt > 180) { // the berry count bumps as berries come in
    bumpAt = performance.now();
    const c = $('#s-cash');
    c.classList.remove('bump');
    void c.offsetWidth;
    c.classList.add('bump');
  }
  lastCash = game.cash;
  setText($('#s-eggs'), game.eggs);
  setText($('#s-round'), game.mode === 'campaign' ? `Round ${game.round}/${game.map.rounds}` : `Round ${game.round} · endless`);
  $('#btn-go').disabled = game.active || !!game.over;
  setText($('#btn-go'), game.active ? 'Round on' : `Start round (${Math.ceil(AUTO_START - wait)})`);
  setText($('#btn-speed'), `Speed ${game.speed}x`);
  const boss = game.enemies.find(e => e.def.boss);
  $('#bossbar').hidden = !boss;
  if (boss) {
    setText($('#boss-name'), boss.def.name);
    $('#boss-fill').style.width = `${Math.max(0, boss.hp / boss.max) * 100}%`;
  }
  updateShop();
  updateInfo();
}

// ---- input

function fit() {
  if (!game) return;
  const r = $('#board-wrap').getBoundingClientRect(), s = Math.min(r.width / sim.W, r.height / sim.H);
  const k = s >= 1 ? Math.floor(s) : s; // whole-number scaling keeps the pixels crisp
  board.style.width = `${sim.W * k}px`;
  board.style.height = `${sim.H * k}px`;
}
addEventListener('resize', fit);

function boardPoint(e) {
  const r = board.getBoundingClientRect();
  ui.mx = Math.round((e.clientX - r.left) / r.width * sim.W);
  ui.my = Math.round((e.clientY - r.top) / r.height * sim.H);
  ui.hover = true;
}
board.addEventListener('pointermove', boardPoint);
board.addEventListener('pointerleave', () => { ui.hover = false; });
board.addEventListener('contextmenu', e => e.preventDefault());
board.addEventListener('pointerdown', e => {
  if (!game || game.over) return;
  boardPoint(e);
  if (e.button === 2) { ui.placing = null; ui.sel = null; return; }
  if (ui.placing) {
    const t = sim.placeTower(game, ui.placing, ui.mx, ui.my);
    if (t) { ui.placing = null; ui.sel = t; changed(); }
    return;
  }
  // sprites stand above their base point, so the clickable box does too
  ui.sel = game.towers.filter(t => Math.abs(t.x - ui.mx) <= 9 && ui.my >= t.y - 20 && ui.my <= t.y + 5).sort((a, b) => b.y - a.y)[0] || null;
});

addEventListener('keydown', e => {
  if (!game || !$('#modal').hidden || e.target.closest('input')) return;
  if (e.code === 'Space') { e.preventDefault(); go(); }
  else if (e.key === 'Escape') { ui.placing = null; ui.sel = null; }
  else if (e.key >= '1' && e.key <= String(KINDS.length)) choose(KINDS[e.key - 1]);
});

$('#btn-go').onclick = go;

// Start the next round and flash its number across the board.
function go() {
  if (!sim.startRound(game)) return;
  wait = 0;
  banner(game.round === game.map.rounds && game.mode === 'campaign' ? `Final round ${game.round}!` : `Round ${game.round}`);
}

// A big title across the board for a moment.
function banner(text) {
  const b = $('#banner');
  b.textContent = text;
  b.hidden = false;
  b.classList.remove('show');
  void b.offsetWidth; // restart the animation
  b.classList.add('show');
}
$('#btn-speed').onclick = () => { game.speed = game.speed % 3 + 1; };
const soundLabel = () => setText($('#btn-sound'), sfx.muted ? 'Sound off' : 'Sound on');
$('#btn-sound').onclick = () => { sfx.toggleMute(); soundLabel(); };
soundLabel();
$('#btn-menu').onclick = () => {
  if (game.over) return;
  paused = true;
  modal('Paused', 'Your game is saved at the start of every round.', [['Resume', () => { paused = false; }], ['Quit to levels', () => show('levels')]]);
};
$('#btn-play').onclick = () => show('levels');
$('#btn-continue').onclick = resume;
$('#btn-roost').onclick = () => show('roost');
for (const b of document.querySelectorAll('[data-back]')) b.onclick = () => show('title');

$('#code-form').onsubmit = async e => {
  e.preventDefault();
  const code = $('#code-in').value.trim().toUpperCase(), msg = $('#code-msg');
  if (!/^[A-Z0-9]{8,32}$/.test(code)) return setText(msg, 'Save codes are 8 to 32 letters and numbers.');
  const { data } = await pull(code);
  if (!data) return setText(msg, 'No save found for that code.');
  save = normalize({ ...data, code });
  persist(save);
  renderTitle();
  setText(msg, 'Save loaded!');
};

// ---- loop: fixed-size simulation steps, so 2x and 3x speed play out exactly like 1x

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  if (!game) {
    if (!$('#title').hidden) drawParade(parade, now / 1000);
    return;
  }
  if (!paused) for (acc += dt * game.speed; acc >= sim.DT; acc -= sim.DT) sim.step(game);
  shake = Math.max(0, shake - dt);
  const k = calm.matches ? 0 : shake * 14;
  board.style.transform = k ? `translate(${Math.round((Math.random() - 0.5) * k)}px, ${Math.round((Math.random() - 0.5) * k)}px)` : '';
  if (!paused && !game.active && !game.over && $('#modal').hidden && (wait += dt * game.speed) >= AUTO_START) go();
  draw(ctx, game, ui);
  handleEvents();
  if (game) hud();
}

for (const i of document.querySelectorAll('img[data-icon]')) i.src = iconURL(i.dataset.icon);
$('#logo').src = $('#favicon').href = towerIcon('hawker', true);
show('title');
requestAnimationFrame(frame);

// A newer copy on the save server (another tab, or a cleared browser) wins.
pull(save.code).then(({ store, data }) => {
  if (data && +data.t > save.t && !game) {
    save = normalize(data);
    show([...document.querySelectorAll('.screen')].find(s => !s.hidden).id);
  }
  setText($('#t-store'), store === 'file' ? 'Progress is saved on this computer.' : store ? '' : 'Progress is saved in this browser.');
  $('#cloud-box').hidden = store !== 'redis';
});
