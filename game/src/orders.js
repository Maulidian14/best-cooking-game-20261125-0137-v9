// The order board. One job: tickets arrive, tick down, expire into strikes,
// and pay out when served — including VIP tickets and the rush hour.
import { CONFIG } from './config.js';
import { unlockedRecipes } from './recipes.js';

let nextTicketId = 1;

export function ticketTimerFor(recipe, level) {
  const base = CONFIG.ticketBase + CONFIG.ticketPerComponent * recipe.components.length;
  return Math.max(CONFIG.ticketMin, base - CONFIG.ticketLevelCut * (level - 1));
}

export function makeTicket(rng, level, opts = {}) {
  const pool = unlockedRecipes(level);
  const recipe = rng.pick(pool);
  const vip = !opts.noVip && level >= 2 && rng.chance(CONFIG.vipChance);
  const total = vip ? CONFIG.vipTimer : ticketTimerFor(recipe, level);
  return {
    id: nextTicketId++,
    recipe,
    timeLeft: total,
    total,
    vip,
    rush: !!opts.rush,
    bornAt: 0,
  };
}

// Pay for serving a ticket: price + time bonus, then combo, VIP and rush.
export function ticketPayout(ticket, comboMult) {
  const frac = ticket.timeLeft / ticket.total;
  let pay = ticket.recipe.price;
  if (frac > 0.75) pay += CONFIG.timeBonusHigh;
  else if (frac > 0.5) pay += CONFIG.timeBonusHalf;
  if (ticket.vip) pay *= CONFIG.vipPay;
  if (ticket.rush) pay *= CONFIG.rushPay;
  return Math.round(pay * comboMult);
}

export function createOrderBoard(rng) {
  return {
    rng,
    tickets: [],
    spawnIn: 6,
    rushIn: CONFIG.rushEvery,
    rushLeft: 0,
    nextId() {
      return nextTicketId++;
    },
  };
}

// Advance the board by dt seconds. Returns events: { type: 'expired', ticket }.
export function updateOrders(board, dt, level) {
  const events = [];
  board.spawnIn -= dt;
  board.rushIn -= dt;
  if (board.rushLeft > 0) board.rushLeft -= dt;

  if (board.rushIn <= 0) {
    board.rushIn = CONFIG.rushEvery;
    board.rushLeft = CONFIG.rushWindow;
    for (let i = 0; i < CONFIG.rushSpawn && board.tickets.length < CONFIG.maxTickets; i++) {
      const t = makeTicket(board.rng, level, { rush: true });
      t.bornAt = 0;
      board.tickets.push(t);
    }
    events.push({ type: 'rush' });
  }

  const interval = CONFIG.spawnIntervalByLevel[Math.min(level, CONFIG.maxLevel) - 1];
  if (board.spawnIn <= 0) {
    board.spawnIn = interval;
    if (board.tickets.length < CONFIG.maxTickets) {
      const t = makeTicket(board.rng, level, { rush: board.rushLeft > 0 });
      board.tickets.push(t);
      events.push({ type: 'ticket', ticket: t });
    }
  }

  for (const t of board.tickets) t.timeLeft -= dt;
  const alive = [];
  for (const t of board.tickets) {
    if (t.timeLeft <= 0) events.push({ type: 'expired', ticket: t });
    else alive.push(t);
  }
  board.tickets = alive;
  return events;
}

export function removeTicket(board, id) {
  board.tickets = board.tickets.filter((t) => t.id !== id);
}
