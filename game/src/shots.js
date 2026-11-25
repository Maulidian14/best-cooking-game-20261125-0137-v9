// Scripted scenes and the autopilot. One job: put the kitchen into the exact
// state each screenshot needs, and play a full shift hands-free for testing.
import { CONFIG, STATIONS, PANTRY_BINS, binCenter } from './config.js';
import { makeRng } from './random.js';
import { recipeById } from './recipes.js';
import { ticketTimerFor } from './orders.js';
import { placeInSlot } from './stations.js';
import { spawnSteamSeeded } from './particles.js';
import { debugTeleport, matchingTicket } from './world.js';

function addTicket(world, recipeId, timeLeft, vip = false, rush = false) {
  const recipe = recipeById(recipeId);
  world.board.tickets.push({
    id: world.board.tickets.length + 1,
    recipe,
    timeLeft,
    total: ticketTimerFor(recipe, world.level),
    vip,
    rush,
    bornAt: 0,
  });
}

function stageCommon(world) {
  world.phase = 'playing';
  world.board.spawnIn = 999;
  world.board.rushIn = 999;
}

export function stageShot(world, name, seed = 1) {
  const rng = makeRng(seed);
  if (name === 'start') {
    world.phase = 'title';
    addTicket(world, 'classic', 52);
    addTicket(world, 'cheese', 44);
    world.board.spawnIn = 999;
    world.board.rushIn = 999;
    return;
  }
  if (name === 'play') {
    stageCommon(world);
    world.time = 42;
    world.timeLeft = CONFIG.shiftLength - 42;
    world.money = 54;
    world.serves = 4;
    world.combo = 3;
    world.level = 2;
    addTicket(world, 'cheese', 38);
    addTicket(world, 'pasta', 26);
    addTicket(world, 'fishchips', 47);
    // A burger mid-assembly on the plate, a patty on the grill, tomato chopping.
    world.plate = [
      { kind: 'bun', prep: 'ready' },
      { kind: 'lettuce', prep: 'ready' },
    ];
    placeInSlot(world.stations, 'burners.0', 'patty');
    world.stations.burners[0].time = 3.2;
    world.stations.burners[0].progress = 0.64;
    placeInSlot(world.stations, 'chop', 'tomato');
    world.stations.chop.time = 0.7;
    world.stations.chop.progress = 0.58;
    world.player.carrying = { kind: 'cheese', prep: 'ready' };
    debugTeleport(world, 640, 430);
    world.player.dir = 'up';
    spawnSteamSeeded(world.particles, STATIONS.stove.x + 50, STATIONS.stove.y + 30, seed, 6);
    return;
  }
  if (name === 'rush') {
    stageCommon(world);
    world.time = 118;
    world.timeLeft = CONFIG.shiftLength - 118;
    world.money = 148;
    world.serves = 11;
    world.combo = 6;
    world.level = 3;
    world.board.rushLeft = 12;
    addTicket(world, 'deluxe', 9, true);
    addTicket(world, 'double', 34);
    addTicket(world, 'chicken', 22);
    addTicket(world, 'fishchips', 41);
    // A plate ready to serve: deluxe is one tomato away — plate holds the rest.
    world.plate = [
      { kind: 'bun', prep: 'ready' },
      { kind: 'patty', prep: 'grilled' },
      { kind: 'cheese', prep: 'ready' },
      { kind: 'lettuce', prep: 'ready' },
    ];
    placeInSlot(world.stations, 'burners.0', 'chicken');
    world.stations.burners[0].time = 5.1;
    world.stations.burners[0].progress = 0.85;
    world.stations.burners[0].done = true;
    placeInSlot(world.stations, 'burners.1', 'pasta');
    world.stations.burners[1].time = 2.4;
    world.stations.burners[1].progress = 0.4;
    placeInSlot(world.stations, 'fryer', 'fish');
    world.stations.fryer.time = 4.2;
    world.stations.fryer.progress = 0.84;
    placeInSlot(world.stations, 'chop', 'tomato');
    world.stations.chop.time = 1.1;
    world.stations.chop.progress = 0.92;
    world.player.carrying = { kind: 'tomato', prep: 'chopped' };
    debugTeleport(world, 640, 560);
    world.player.dir = 'up';
    spawnSteamSeeded(world.particles, STATIONS.stove.x + 50, STATIONS.stove.y + 30, seed, 6);
    spawnSteamSeeded(world.particles, STATIONS.fryer.x + 80, STATIONS.fryer.y + 30, seed + 7, 6);
    return;
  }
  if (name === 'end') {
    stageCommon(world);
    world.phase = 'over';
    world.overReason = 'time';
    world.time = CONFIG.shiftLength;
    world.timeLeft = 0;
    world.money = 214;
    world.serves = 14;
    world.combo = 0;
    world.bestCombo = 8;
    world.level = 4;
    addTicket(world, 'classic', 20);
    return;
  }
  // Unknown shot name: plain title.
  world.phase = 'title';
}

// --- Autopilot: a greedy cook that plays a whole shift for verification. ---

// What the plate still needs for the most urgent ticket it can finish, plus
// the plate items that ticket does NOT need (they block any serve).
// A ticket is "finishable" if the missing work fits in its remaining time
// (roughly 6s per missing component, +2s for each one that needs a station);
// a doomed ticket is skipped for one that can still be saved, and only
// chased when nothing else is finishable.
function planFor(world) {
  const tickets = [...world.board.tickets].sort((a, b) => a.timeLeft - b.timeLeft);
  let fallback = null;
  for (const t of tickets) {
    const need = [];
    const have = [...world.plate];
    for (const c of t.recipe.components) {
      const i = have.findIndex((h) => h.kind === c.kind && h.prep === c.prep);
      if (i >= 0) have.splice(i, 1);
      else need.push(c);
    }
    const plan = { ticket: t, need, foreign: have };
    if (!fallback) fallback = plan;
    const cookable = need.filter((c) => cookStationFor(c.kind)).length;
    const estimate = need.length * 6 + cookable * 2;
    if (estimate <= t.timeLeft - 2) return plan;
  }
  return fallback;
}

function stationPoint(name) {
  const r = STATIONS[name];
  // Stand-off points sit 20px off the rect so the autopilot always stops
  // inside the 52px interact reach (20 + 12 arrival slack < 52).
  if (name === 'pantry') return { x: r.x + r.w + 20, y: r.y + r.h / 2 };
  if (name === 'plating') return { x: r.x + r.w / 2, y: r.y - 20 };
  if (name === 'serve') return { x: r.x - 20, y: r.y + r.h / 2 };
  if (name === 'trash') return { x: r.x - 20, y: r.y + r.h / 2 };
  return { x: r.x + r.w / 2, y: r.y + r.h + 20 };
}

function freeCookSlot(world, station) {
  if (station === 'chop') return world.stations.chop === null;
  if (station === 'fryer') return world.stations.fryer === null;
  if (station === 'stove') return world.stations.burners[0] === null || world.stations.burners[1] === null;
  return false;
}

function cookStationFor(kind) {
  return { patty: 'stove', chicken: 'stove', pasta: 'stove', fish: 'fryer', potato: 'fryer', tomato: 'chop', onion: 'chop' }[kind] || null;
}

// One autopilot step: returns a plain input object for worldUpdate.
export function autopilotInput(world) {
  const input = {
    up: false, down: false, left: false, right: false,
    interact: false, takeFromPlate: false, pause: false, mute: false, click: null,
  };
  if (world.phase !== 'playing' || world.paused) return input;
  const p = world.player;

  function goTo(x, y, use) {
    // Route via the open lane (y=265) when the target sits in the top band
    // (y < 200) and we are far away horizontally: a straight diagonal
    // wedges the player on the stove/chop corners (the circle overlaps the
    // station rect and both axes are blocked). y=265 clears the top
    // stations (bottom 128 + radius 18) and the order board (bottom 240).
    let tx = x;
    let ty = y;
    if (y < 200 && Math.abs(x - p.x) > 60) {
      if (p.y < 245) { tx = p.x; ty = 265; } // drop to the lane first
      else if (Math.abs(p.x - x) > 60) { tx = x; ty = 265; } // cross in the lane
    }
    const dx = tx - p.x;
    const dy = ty - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 12) {
      if (use && tx === x && ty === y) input.interact = true;
      return input;
    }
    if (Math.abs(dx) > 2) input[dx > 0 ? 'right' : 'left'] = true;
    if (Math.abs(dy) > 2) input[dy > 0 ? 'down' : 'up'] = true;
    return input;
  }

  function goStation(name, use) {
    const pt = stationPoint(name);
    return goTo(pt.x, pt.y, use);
  }

  // Walk to the plating counter and lift the top item OFF the plate (Q).
  // E/interact does not remove items — only takeFromPlate does.
  function goClearPlate() {
    const pt = stationPoint('plating');
    const dx = pt.x - p.x;
    const dy = pt.y - p.y;
    if (Math.hypot(dx, dy) < 12) {
      input.takeFromPlate = true;
      return input;
    }
    return goTo(pt.x, pt.y, false);
  }

  // Walk to the exact pantry bin for one ingredient and take it. The pantry
  // hands out the NEAREST bin, so the generic pantry point grabs whatever
  // bin is closest — the autopilot must aim at the bin's own row.
  function goBin(kind) {
    const c = binCenter(PANTRY_BINS.indexOf(kind));
    return goTo(140, c.y, true);
  }

  // 1. Burnt item in hand? Trash it.
  if (p.carrying && p.carrying.prep === 'burnt') return goStation('trash', true);
  // 2. Plate matches a ticket? Serve it.
  if (matchingTicket(world)) return goStation('serve', true);

  const plan = planFor(world);
  if (!plan) return goTo(300, 300, false);

  // 3. Foreign items on the plate block every serve: clear them first.
  if (plan.foreign.length > 0) {
    if (p.carrying) return goStation('trash', true);
    return goClearPlate();
  }

  // 4. A finished cooking slot we need? Pick it up.
  const needKinds = new Set(plan.need.map((c) => c.kind));
  const slots = [
    ['chop', world.stations.chop],
    ['burners.0', world.stations.burners[0]],
    ['burners.1', world.stations.burners[1]],
    ['fryer', world.stations.fryer],
  ];
  if (!p.carrying) {
    for (const [name, slot] of slots) {
      if (slot && slot.done && !slot.burnt && needKinds.has(slot.kind)) {
        const st = name === 'fryer' ? 'fryer' : name === 'chop' ? 'chop' : 'stove';
        return goStation(st, true);
      }
    }
    // A burnt item blocks its station forever: pick it up and bin it.
    for (const [name, slot] of slots) {
      if (slot && slot.burnt) {
        const st = name === 'fryer' ? 'fryer' : name === 'chop' ? 'chop' : 'stove';
        return goStation(st, true);
      }
    }
  }

  // 5. Hands empty: fetch the next missing component. The component that
  // needs cooking goes FIRST, so it cooks while we fetch the ready items —
  // the grill/fryer time overlaps the walking instead of adding to it.
  // While something cooks, fetch a ready component instead of idling.
  if (!p.carrying) {
    const cookable = plan.need.find((c) => {
      const dest = cookStationFor(c.kind);
      return dest && !slots.some(([, s]) => s && s.kind === c.kind) && freeCookSlot(world, dest);
    });
    const comp = cookable || plan.need[0];
    if (!comp) return input;
    if (comp.prep === 'ready') return goBin(comp.kind);
    const cooking = slots.some(([, s]) => s && !s.done && s.kind === comp.kind);
    if (cooking) {
      const ready = plan.need.find((c) => c.prep === 'ready');
      if (ready) return goBin(ready.kind);
      return goTo(640, 300, false); // wait for it to finish
    }
    const dest = cookStationFor(comp.kind);
    if (dest && !freeCookSlot(world, dest)) {
      const ready = plan.need.find((c) => c.prep === 'ready');
      if (ready) return goBin(ready.kind);
      return goTo(640, 300, false); // station full: wait
    }
    return goBin(comp.kind);
  }

  // 6. Hands full: deliver it — straight to the plate if finished, else to
  // its cooking station; a raw item with no free slot gets trashed so the
  // cook never stands buzzing at a full station.
  const item = p.carrying;
  const wanted = plan.need.some((c) => c.kind === item.kind && c.prep === item.prep);
  if (wanted && item.prep !== 'raw') return goStation('plating', true);
  if (item.prep === 'raw') {
    const dest = cookStationFor(item.kind);
    if (dest && freeCookSlot(world, dest)) return goStation(dest, true);
    return goStation('trash', true);
  }
  if (world.plate.length < CONFIG.plateMax) return goStation('plating', true);
  return goStation('trash', true);
}
