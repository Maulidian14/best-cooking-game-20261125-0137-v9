// The kitchen itself. One job: the whole game state — the chef, the plate,
// the stations, the shift clock — and one update step from a plain input.
import { CONFIG, STATIONS, ORDER_BOARD, PANTRY_BINS, binCenter } from './config.js';
import { makeRng } from './random.js';
import { PREP, plateMatches } from './recipes.js';
import { createOrderBoard, updateOrders, removeTicket, ticketPayout } from './orders.js';
import {
  createStations, updateStations, stationFor, freeSlot, placeInSlot, takeSlot,
} from './stations.js';
import {
  createParticles, updateParticles, spawnSteam, spawnSizzle, spawnChopBits,
  spawnServeBurst, spawnSmoke, spawnFloat,
} from './particles.js';

export function levelFor(serves) {
  return Math.min(CONFIG.maxLevel, 1 + Math.floor(serves / CONFIG.levelEveryServes));
}

export function comboMult(combo) {
  const steps = Math.floor(combo / CONFIG.comboStep);
  return Math.min(CONFIG.comboMax, 1 + steps * CONFIG.comboPerStep);
}

export function createWorld(seed = 1) {
  const rng = makeRng(seed);
  return {
    seed,
    rng,
    phase: 'title',
    time: 0,
    timeLeft: CONFIG.shiftLength,
    money: 0,
    serves: 0,
    strikes: 0,
    combo: 0,
    bestCombo: 0,
    level: 1,
    player: { x: 640, y: 380, dir: 'down', moving: false, carrying: null },
    plate: [],
    board: createOrderBoard(rng),
    stations: createStations(),
    particles: createParticles(),
    events: [],
    autoTarget: null,
    autoUse: null,
    overReason: '',
    stats: { expired: 0, burnt: 0, trashed: 0 },
    muted: false,
    paused: false,
    lastTickSecond: -1,
  };
}

export function startShift(world) {
  world.phase = 'playing';
  world.events.push({ type: 'ding' });
}

// Which pantry bin cell is nearest the player (for taking ingredients).
export function nearestBin(world) {
  const px = world.player.x;
  const py = world.player.y;
  let best = null;
  let bestD = Infinity;
  PANTRY_BINS.forEach((kind, i) => {
    const c = binCenter(i);
    const d = (px - c.x) * (px - c.x) + (py - c.y) * (py - c.y);
    if (d < bestD) {
      bestD = d;
      best = kind;
    }
  });
  return best;
}

// Nearest station whose expanded rect contains the player, or null.
export function nearestStation(world) {
  const p = world.player;
  const reach = CONFIG.interactReach;
  let best = null;
  let bestD = Infinity;
  for (const [name, r] of Object.entries(STATIONS)) {
    const cx = Math.max(r.x, Math.min(p.x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(p.y, r.y + r.h));
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d = dx * dx + dy * dy;
    if (d < reach * reach && d < bestD) {
      bestD = d;
      best = name;
    }
  }
  return best;
}

// One-line prompt for the HUD: what E does right now, or ''.
export function stationPrompt(world) {
  const st = nearestStation(world);
  if (!st) return '';
  const carrying = world.player.carrying;
  if (st === 'pantry') {
    return carrying ? '' : `Take ${nearestBin(world)}`;
  }
  if (st === 'chop') {
    const slot = world.stations.chop;
    if (carrying && stationFor(carrying.kind) === 'chop' && !slot) return `Chop ${carrying.kind}`;
    if (!carrying && slot && slot.done) return `Take ${slot.burnt ? 'burnt' : 'chopped'} ${slot.kind}`;
    if (slot && !slot.done) return 'Chopping…';
    return '';
  }
  if (st === 'stove' || st === 'fryer') {
    const slots = st === 'stove' ? world.stations.burners : [world.stations.fryer];
    if (carrying && stationFor(carrying.kind) === st) {
      const free = st === 'stove'
        ? (world.stations.burners[0] === null || world.stations.burners[1] === null)
        : world.stations.fryer === null;
      return free ? `Cook ${carrying.kind}` : `${st === 'stove' ? 'Stove' : 'Fryer'} full`;
    }
    if (!carrying) {
      const done = slots.find((s) => s && s.done);
      if (done) return `Take ${done.burnt ? 'burnt' : PREP[done.kind].result} ${done.kind}`;
    }
    return '';
  }
  if (st === 'plating') {
    if (carrying) {
      if (carrying.prep === 'burnt') return 'Burnt — throw it away';
      if (carrying.prep === 'raw') return 'Cook it first';
      return world.plate.length >= CONFIG.plateMax ? 'Plate is full' : 'Add to plate';
    }
    return world.plate.length ? 'Take from plate' : '';
  }
  if (st === 'serve') {
    const match = matchingTicket(world);
    return match ? `SERVE — ${match.recipe.name}` : 'Plate must match an order';
  }
  if (st === 'trash') return carrying ? 'Throw away' : '';
  return '';
}

export function matchingTicket(world) {
  if (!world.plate.length) return null;
  let best = null;
  for (const t of world.board.tickets) {
    if (plateMatches(world.plate, t.recipe)) {
      if (!best || t.timeLeft < best.timeLeft) best = t;
    }
  }
  return best;
}

function solidRects() {
  return [...Object.values(STATIONS), ORDER_BOARD];
}

function collides(x, y, r) {
  for (const s of solidRects()) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

function movePlayer(world, dx, dy) {
  const p = world.player;
  const r = CONFIG.playerRadius;
  const nx = Math.max(r + 4, Math.min(CONFIG.viewW - r - 4, p.x + dx));
  if (!collides(nx, p.y, r)) p.x = nx;
  const ny = Math.max(CONFIG.hudH + r + 4, Math.min(CONFIG.viewH - r - 4, p.y + dy));
  if (!collides(p.x, ny, r)) p.y = ny;
}

export function debugTeleport(world, x, y) {
  world.player.x = x;
  world.player.y = y;
  world.autoTarget = null;
  world.autoUse = null;
}

function doInteract(world) {
  const st = nearestStation(world);
  const p = world.player;
  if (!st) return;
  const carrying = p.carrying;

  if (st === 'pantry') {
    if (!carrying) {
      // Ready foods (bun, cheese, lettuce) come out ready to plate; the rest
      // come out raw and need a station first.
      const kind = nearestBin(world);
      p.carrying = { kind, prep: PREP[kind].station ? 'raw' : 'ready' };
      world.events.push({ type: 'pickup' });
    }
    return;
  }
  if (st === 'chop') {
    const slot = world.stations.chop;
    if (carrying && stationFor(carrying.kind) === 'chop' && !slot) {
      placeInSlot(world.stations, 'chop', carrying.kind);
      p.carrying = null;
      world.events.push({ type: 'place' });
    } else if (!carrying && slot && slot.done) {
      const item = takeSlot(world.stations, 'chop');
      if (item) {
        p.carrying = item;
        world.events.push({ type: 'pickup' });
        if (item.prep === 'burnt') world.stats.burnt++;
      }
    } else if (carrying || (slot && !slot.done)) {
      world.events.push({ type: 'buzz' });
    }
    return;
  }
  if (st === 'stove' || st === 'fryer') {
    const slotName = st === 'stove'
      ? (world.stations.burners[0] === null ? 'burners.0'
        : world.stations.burners[1] === null ? 'burners.1' : null)
      : (world.stations.fryer === null ? 'fryer' : null);
    if (carrying && stationFor(carrying.kind) === st && slotName) {
      placeInSlot(world.stations, slotName, carrying.kind);
      p.carrying = null;
      world.events.push({ type: 'place' });
      return;
    }
    if (!carrying) {
      const names = st === 'stove' ? ['burners.0', 'burners.1'] : ['fryer'];
      for (const name of names) {
        const slot = name === 'fryer' ? world.stations.fryer
          : world.stations.burners[Number(name.split('.')[1])];
        if (slot && slot.done) {
          const item = takeSlot(world.stations, name);
          if (item) {
            p.carrying = item;
            world.events.push({ type: 'pickup' });
            if (item.prep === 'burnt') world.stats.burnt++;
          }
          return;
        }
      }
    }
    world.events.push({ type: 'buzz' });
    return;
  }
  if (st === 'plating') {
    if (carrying) {
      if (carrying.prep === 'burnt' || carrying.prep === 'raw') {
        world.events.push({ type: 'buzz' });
        return;
      }
      if (world.plate.length >= CONFIG.plateMax) {
        world.events.push({ type: 'buzz' });
        return;
      }
      world.plate.push(carrying);
      p.carrying = null;
      world.events.push({ type: 'place' });
    } else if (world.plate.length) {
      p.carrying = world.plate.pop();
      world.events.push({ type: 'pickup' });
    }
    return;
  }
  if (st === 'serve') {
    const match = matchingTicket(world);
    if (!match) {
      world.events.push({ type: 'buzz' });
      return;
    }
    const pay = ticketPayout(match, comboMult(world.combo));
    world.money += pay;
    world.serves++;
    world.combo++;
    world.bestCombo = Math.max(world.bestCombo, world.combo);
    removeTicket(world.board, match.id);
    const cx = STATIONS.serve.x + STATIONS.serve.w / 2;
    const cy = STATIONS.serve.y + STATIONS.serve.h / 2;
    spawnServeBurst(world.particles, cx, cy);
    spawnFloat(world.particles, cx, cy - 40, `+$${pay}`, match.vip ? '#ffd54f' : '#ffffff');
    world.plate = [];
    world.events.push({ type: 'serve' });
    world.events.push({ type: 'coin' });
    const newLevel = levelFor(world.serves);
    if (newLevel > world.level) {
      world.level = newLevel;
      world.events.push({ type: 'levelUp' });
    }
    return;
  }
  if (st === 'trash') {
    if (carrying) {
      p.carrying = null;
      world.stats.trashed++;
      world.events.push({ type: 'trash' });
    }
  }
}

function updateAmbient(world, dt) {
  const s = world.stations;
  const rng = world.rng;
  const busy = [];
  if (s.chop) busy.push(['chop', s.chop, STATIONS.chop.x + 80, STATIONS.chop.y + 30]);
  s.burners.forEach((b, i) => {
    if (b) busy.push([`burner${i}`, b, STATIONS.stove.x + 50 + i * 100, STATIONS.stove.y + 30]);
  });
  if (s.fryer) busy.push(['fryer', s.fryer, STATIONS.fryer.x + 80, STATIONS.fryer.y + 30]);
  for (const [name, slot, x, y] of busy) {
    if (slot.burnt) {
      if (rng.chance(dt * 6)) spawnSmoke(world.particles, x, y);
    } else if (slot.done) {
      if (rng.chance(dt * 2)) spawnSteam(world.particles, x, y);
    } else if (name !== 'chop') {
      if (rng.chance(dt * 8)) spawnSizzle(world.particles, x, y);
    } else if (rng.chance(dt * 10)) {
      spawnChopBits(world.particles, x, y);
    }
  }
}

export function worldUpdate(world, dt, input) {
  updateParticles(world.particles, dt);
  if (world.phase === 'title') {
    if (input.interact || input.click) startShift(world);
    return;
  }
  if (world.phase === 'over') return;
  if (world.paused) return;

  world.time += dt;
  world.timeLeft = Math.max(0, CONFIG.shiftLength - world.time);
  if (world.timeLeft <= 0) {
    world.phase = 'over';
    world.overReason = 'time';
    world.events.push({ type: 'strike' });
    return;
  }

  // Orders.
  const orderEvents = updateOrders(world.board, dt, world.level);
  for (const e of orderEvents) {
    if (e.type === 'expired') {
      world.strikes++;
      world.combo = 0;
      world.stats.expired++;
      world.events.push({ type: 'strike' });
      if (world.strikes >= CONFIG.maxStrikes) {
        world.phase = 'over';
        world.overReason = 'strikes';
        return;
      }
    } else if (e.type === 'rush') {
      world.events.push({ type: 'rush' });
    } else if (e.type === 'ticket') {
      world.events.push({ type: 'ding' });
    }
  }

  // Low-timer ticking.
  const urgent = world.board.tickets.some((t) => t.timeLeft < 10);
  const sec = Math.floor(world.time);
  if (urgent && sec !== world.lastTickSecond) {
    world.lastTickSecond = sec;
    world.events.push({ type: 'tick' });
  }

  // Cooking.
  updateStations(world.stations, dt);
  updateAmbient(world, dt);

  // Click-to-move.
  if (input.click) {
    world.autoTarget = { x: input.click.x, y: input.click.y };
    const saved = { x: world.player.x, y: world.player.y };
    world.player.x = input.click.x;
    world.player.y = input.click.y;
    const clickedStation = nearestStation(world);
    world.player.x = saved.x;
    world.player.y = saved.y;
    world.autoUse = clickedStation;
  }

  // Movement: keys win over click-to-move; arriving at a click target uses it.
  const p = world.player;
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (mx !== 0 || my !== 0) {
    world.autoTarget = null;
    world.autoUse = null;
    const len = Math.hypot(mx, my);
    movePlayer(world, (mx / len) * CONFIG.playerSpeed * dt, (my / len) * CONFIG.playerSpeed * dt);
    p.moving = true;
    p.dir = Math.abs(mx) > Math.abs(my) ? (mx > 0 ? 'right' : 'left') : (my > 0 ? 'down' : 'up');
  } else if (world.autoTarget) {
    const dx = world.autoTarget.x - p.x;
    const dy = world.autoTarget.y - p.y;
    const dist = Math.hypot(dx, dy);
    // Arrived: close to the point, or the clicked station is now in reach
    // (the player can never walk inside a solid station rect).
    const reachedStation = world.autoUse && nearestStation(world) === world.autoUse;
    if (dist < 14 || reachedStation) {
      world.autoTarget = null;
      if (world.autoUse) {
        const use = world.autoUse;
        world.autoUse = null;
        if (nearestStation(world) === use) doInteract(world);
      }
    } else {
      movePlayer(world, (dx / dist) * CONFIG.playerSpeed * dt, (dy / dist) * CONFIG.playerSpeed * dt);
      p.moving = true;
      p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    }
  } else {
    p.moving = false;
  }

  if (input.interact) doInteract(world);
  if (input.takeFromPlate && nearestStation(world) === 'plating' && !p.carrying && world.plate.length) {
    p.carrying = world.plate.pop();
    world.events.push({ type: 'pickup' });
  }
}
