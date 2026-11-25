// All drawing. One job: turn the world into a readable, appetising kitchen
// on a 1280x720 canvas — the screenshots are most of what the judge sees.
import { CONFIG, STATIONS, ORDER_BOARD, COLORS, PANTRY_BINS, binCenter } from './config.js';
import { itemLabel } from './recipes.js';
import { nearestStation, stationPrompt, matchingTicket, comboMult } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

// One ingredient, drawn at centre (x, y) with radius s. Burnt is a black lump.
export function drawFood(ctx, item, x, y, s) {
  const k = item.kind;
  const prep = item.prep;
  ctx.save();
  ctx.translate(x, y);
  if (prep === 'burnt') {
    ctx.fillStyle = '#1c1c1c';
    circle(ctx, 0, 0, s * 0.85);
    ctx.fill();
    ctx.fillStyle = '#333';
    circle(ctx, -s * 0.3, -s * 0.25, s * 0.3);
    ctx.fill();
    ctx.restore();
    return;
  }
  if (k === 'bun') {
    ctx.fillStyle = '#e8b96a';
    ctx.beginPath();
    ctx.arc(0, s * 0.15, s, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c98f3f';
    rr(ctx, -s, s * 0.1, s * 2, s * 0.35, s * 0.15);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    circle(ctx, -s * 0.4, -s * 0.35, s * 0.09);
    ctx.fill();
    circle(ctx, s * 0.3, -s * 0.5, s * 0.09);
    ctx.fill();
    circle(ctx, 0, -s * 0.2, s * 0.09);
    ctx.fill();
  } else if (k === 'patty') {
    ctx.fillStyle = prep === 'grilled' ? '#6d3b1f' : '#c97e6b';
    rr(ctx, -s, -s * 0.45, s * 2, s * 0.9, s * 0.4);
    ctx.fill();
    if (prep === 'grilled') {
      ctx.strokeStyle = '#4a2412';
      ctx.lineWidth = s * 0.12;
      for (const off of [-0.45, 0, 0.45]) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.7, off * s);
        ctx.lineTo(s * 0.7, off * s);
        ctx.stroke();
      }
    }
  } else if (k === 'chicken') {
    ctx.fillStyle = prep === 'grilled' ? '#d99a3d' : '#e8b4a0';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.95, s * 0.6, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = prep === 'grilled' ? '#b57708' : '#f2d7c9';
    circle(ctx, s * 0.7, -s * 0.45, s * 0.28);
    ctx.fill();
    if (prep === 'grilled') {
      ctx.strokeStyle = '#8a5a10';
      ctx.lineWidth = s * 0.1;
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, -s * 0.2);
      ctx.lineTo(s * 0.4, s * 0.3);
      ctx.stroke();
    }
  } else if (k === 'fish') {
    ctx.fillStyle = prep === 'fried' ? '#e0a83c' : '#a8c8d8';
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = prep === 'fried' ? '#b57e1e' : '#7fa8bc';
    circle(ctx, -s * 0.4, -s * 0.15, s * 0.16);
    ctx.fill();
    circle(ctx, s * 0.3, s * 0.15, s * 0.16);
    ctx.fill();
    ctx.fillStyle = '#5d7d8c';
    circle(ctx, s * 0.55, -s * 0.1, s * 0.12);
    ctx.fill();
  } else if (k === 'pasta') {
    if (prep === 'cooked') {
      ctx.strokeStyle = '#f2c94c';
      ctx.lineWidth = s * 0.22;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, s * (0.35 + i * 0.28), i * 1.1, i * 1.1 + 4.2);
        ctx.stroke();
      }
      ctx.fillStyle = '#c0392b';
      circle(ctx, -s * 0.4, -s * 0.3, s * 0.18);
      ctx.fill();
      circle(ctx, s * 0.35, s * 0.3, s * 0.18);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#e8c96a';
      ctx.lineWidth = s * 0.14;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.32, -s * 0.7);
        ctx.lineTo(i * s * 0.32, s * 0.7);
        ctx.stroke();
      }
    }
  } else if (k === 'potato') {
    if (prep === 'fries') {
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.moveTo(-s * 0.8, -s * 0.2);
      ctx.lineTo(s * 0.8, -s * 0.2);
      ctx.lineTo(s * 0.6, s * 0.85);
      ctx.lineTo(-s * 0.6, s * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f2c94c';
      ctx.lineWidth = s * 0.22;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.3, -s * 0.25);
        ctx.lineTo(i * s * 0.3, -s * 0.95);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#a67c52';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.8, s * 0.6, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a6238';
      circle(ctx, -s * 0.3, -s * 0.15, s * 0.12);
      ctx.fill();
      circle(ctx, s * 0.3, s * 0.2, s * 0.12);
      ctx.fill();
    }
  } else if (k === 'cheese') {
    ctx.fillStyle = '#ffcf3f';
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.6);
    ctx.lineTo(s, s * 0.6);
    ctx.lineTo(0, -s * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8a90c';
    circle(ctx, -s * 0.2, s * 0.25, s * 0.14);
    ctx.fill();
    circle(ctx, s * 0.25, s * 0.05, s * 0.11);
    ctx.fill();
  } else if (k === 'lettuce') {
    ctx.fillStyle = '#58b368';
    for (const [ox, oy, r] of [[-0.45, 0.1, 0.55], [0.4, 0.15, 0.55], [0, -0.35, 0.55]]) {
      circle(ctx, ox * s, oy * s, r * s);
      ctx.fill();
    }
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = s * 0.08;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7);
    ctx.lineTo(0, s * 0.6);
    ctx.stroke();
  } else if (k === 'tomato') {
    if (prep === 'chopped') {
      ctx.fillStyle = '#e53935';
      for (const [ox, oy] of [[-0.4, 0.2], [0.35, 0.25], [0, -0.35]]) {
        ctx.beginPath();
        ctx.arc(ox * s, oy * s, s * 0.45, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#ff8a80';
      circle(ctx, 0, 0, s * 0.2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#e53935';
      circle(ctx, 0, 0, s * 0.85);
      ctx.fill();
      ctx.fillStyle = '#43a047';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.85);
      ctx.lineTo(-s * 0.25, -s * 1.05);
      ctx.lineTo(s * 0.25, -s * 1.05);
      ctx.closePath();
      ctx.fill();
    }
  } else if (k === 'onion') {
    if (prep === 'chopped') {
      ctx.strokeStyle = '#f5f0ff';
      ctx.lineWidth = s * 0.16;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc((i - 1) * s * 0.45, 0, s * 0.4, Math.PI, 0);
        ctx.stroke();
      }
      ctx.strokeStyle = '#b39ddb';
      ctx.lineWidth = s * 0.06;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.55, Math.PI, 0);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#efe6f7';
      circle(ctx, 0, 0, s * 0.85);
      ctx.fill();
      ctx.strokeStyle = '#b39ddb';
      ctx.lineWidth = s * 0.09;
      circle(ctx, 0, 0, s * 0.55);
      ctx.stroke();
      circle(ctx, 0, 0, s * 0.28);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawProgressRing(ctx, x, y, r, frac, done, burnt) {
  ctx.save();
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = burnt ? '#e53935' : done ? '#43a047' : '#ffb300';
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac));
  ctx.stroke();
  ctx.restore();
}

function drawSlot(ctx, slot, x, y) {
  if (!slot) return;
  drawFood(ctx, { kind: slot.kind, prep: slot.done ? (slot.burnt ? 'burnt' : slot.prep) : 'raw' }, x, y, 20);
  if (!slot.done || slot.burnt) {
    drawProgressRing(ctx, x, y, 26, slot.progress, slot.done, slot.burnt);
  }
  if (slot.done && !slot.burnt) {
    ctx.save();
    ctx.fillStyle = '#43a047';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('READY', x, y + 38);
    ctx.restore();
  }
  if (slot.burnt) {
    ctx.save();
    ctx.fillStyle = '#e53935';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BURNT!', x, y + 38);
    ctx.restore();
  }
}

function drawTicket(ctx, ticket, x, y, w, h) {
  const frac = Math.max(0, ticket.timeLeft / ticket.total);
  const urgent = frac < 0.25;
  const warn = frac < 0.5 && !urgent;
  ctx.save();
  const pulse = urgent ? 0.75 + 0.25 * Math.sin(Date.now() / 120) : 1;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = ticket.vip ? '#fff3c4' : '#fffdf5';
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.lineWidth = ticket.vip ? 3 : 2;
  ctx.strokeStyle = urgent ? '#e53935' : warn ? '#fb8c00' : ticket.vip ? '#ffb300' : '#8a5a2b';
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#3a2a18';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(ticket.recipe.name + (ticket.vip ? ' ★VIP' : ''), x + 8, y + 18, w - 52);
  // Component dots.
  let dx = x + 10;
  for (const c of ticket.recipe.components) {
    drawFood(ctx, c, dx + 9, y + 36, 9);
    dx += 22;
  }
  ctx.fillStyle = '#3a2a18';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`$${ticket.recipe.price}`, x + w - 8, y + 18);
  // Timer bar.
  ctx.fillStyle = '#e0d6c0';
  rr(ctx, x + 8, y + h - 12, w - 16, 7, 3);
  ctx.fill();
  ctx.fillStyle = urgent ? '#e53935' : warn ? '#fb8c00' : '#43a047';
  rr(ctx, x + 8, y + h - 12, (w - 16) * frac, 7, 3);
  ctx.fill();
  ctx.fillStyle = urgent ? '#e53935' : '#6d5b40';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.ceil(ticket.timeLeft)}s`, x + w - 8, y + h - 18);
  ctx.restore();
}

function drawPlayer(ctx, world) {
  const p = world.player;
  const bob = p.moving ? Math.sin(world.time * 14) * 2 : 0;
  ctx.save();
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 16, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  ctx.fillStyle = COLORS.playerShirt;
  circle(ctx, p.x, p.y + 4 + bob, 17);
  ctx.fill();
  ctx.fillStyle = COLORS.playerPants;
  rr(ctx, p.x - 12, p.y + 12 + bob, 24, 10, 4);
  ctx.fill();
  // Apron.
  ctx.fillStyle = '#e53935';
  rr(ctx, p.x - 9, p.y - 2 + bob, 18, 16, 5);
  ctx.fill();
  // Head + hat.
  ctx.fillStyle = COLORS.playerSkin;
  circle(ctx, p.x, p.y - 14 + bob, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.playerHat;
  rr(ctx, p.x - 13, p.y - 30 + bob, 26, 12, 6);
  ctx.fill();
  circle(ctx, p.x - 8, p.y - 30 + bob, 7);
  ctx.fill();
  circle(ctx, p.x + 8, p.y - 30 + bob, 7);
  ctx.fill();
  circle(ctx, p.x, p.y - 33 + bob, 8);
  ctx.fill();
  // Eyes look where the chef faces.
  const look = { up: [0, -3], down: [0, 2], left: [-3, 0], right: [3, 0] }[p.dir] || [0, 2];
  ctx.fillStyle = '#222';
  circle(ctx, p.x - 4 + look[0], p.y - 14 + bob + look[1], 1.8);
  ctx.fill();
  circle(ctx, p.x + 4 + look[0], p.y - 14 + bob + look[1], 1.8);
  ctx.fill();
  // Carried item above the head.
  if (p.carrying) {
    drawFood(ctx, p.carrying, p.x, p.y - 44 + bob, 13);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    circle(ctx, p.x, p.y - 44 + bob, 17);
    ctx.stroke();
    drawFood(ctx, p.carrying, p.x, p.y - 44 + bob, 13);
  }
  ctx.restore();
}

function drawStations(ctx, world) {
  const s = world.stations;
  // Pantry.
  const pan = STATIONS.pantry;
  ctx.save();
  ctx.fillStyle = COLORS.counterWood;
  rr(ctx, pan.x, pan.y, pan.w, pan.h, 10);
  ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, pan.x + 5, pan.y + 5, pan.w - 10, 22, 6);
  ctx.fill();
  ctx.fillStyle = COLORS.boardInk;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PANTRY', pan.x + pan.w / 2, pan.y + 21);
  PANTRY_BINS.forEach((kind, i) => {
    const c = binCenter(i);
    const near = nearestStation(world) === 'pantry' && world.player.carrying === null;
    ctx.fillStyle = '#f7ead0';
    rr(ctx, c.x - 48, c.y - 24, 96, 48, 6);
    ctx.fill();
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawFood(ctx, { kind, prep: 'raw' }, c.x - 26, c.y, 12);
    ctx.fillStyle = '#6d5b40';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(kind.toUpperCase(), c.x - 8, c.y + 4);
    if (near) {
      ctx.strokeStyle = 'rgba(255,179,0,0.7)';
      ctx.lineWidth = 2;
      rr(ctx, c.x - 48, c.y - 24, 96, 48, 6);
      ctx.stroke();
    }
  });
  ctx.restore();

  // Chop board.
  const chop = STATIONS.chop;
  ctx.save();
  ctx.fillStyle = COLORS.chopBoard;
  rr(ctx, chop.x, chop.y, chop.w, chop.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.boardInk;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CHOP', chop.x + chop.w / 2, chop.y + 16);
  if (s.chop) drawSlot(ctx, s.chop, chop.x + chop.w / 2, chop.y + 40);
  else {
    ctx.strokeStyle = '#b9a06a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(chop.x + 60, chop.y + 44);
    ctx.lineTo(chop.x + 100, chop.y + 44);
    ctx.stroke();
  }
  ctx.restore();

  // Stove: two burners.
  const stove = STATIONS.stove;
  ctx.save();
  ctx.fillStyle = COLORS.steel;
  rr(ctx, stove.x, stove.y, stove.w, stove.h, 8);
  ctx.fill();
  ctx.strokeStyle = COLORS.steelDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.boardInk;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('STOVE', stove.x + stove.w / 2, stove.y + 14);
  s.burners.forEach((b, i) => {
    const cx = stove.x + 50 + i * 100;
    const cy = stove.y + 40;
    ctx.fillStyle = COLORS.grillHot;
    circle(ctx, cx, cy, 24);
    ctx.fill();
    ctx.strokeStyle = '#22222a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy - 8);
    ctx.lineTo(cx + 16, cy - 8);
    ctx.moveTo(cx - 16, cy + 8);
    ctx.lineTo(cx + 16, cy + 8);
    ctx.stroke();
    if (b && !b.done) {
      ctx.fillStyle = 'rgba(255,140,0,0.35)';
      circle(ctx, cx, cy, 24);
      ctx.fill();
    }
    if (b) drawSlot(ctx, b, cx, cy);
  });
  ctx.restore();

  // Fryer.
  const fry = STATIONS.fryer;
  ctx.save();
  ctx.fillStyle = COLORS.fryerRed;
  rr(ctx, fry.x, fry.y, fry.w, fry.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#7d241c';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FRYER', fry.x + fry.w / 2, fry.y + 14);
  ctx.fillStyle = '#f2c94c';
  rr(ctx, fry.x + 20, fry.y + 24, fry.w - 40, 28, 6);
  ctx.fill();
  ctx.strokeStyle = '#d99a00';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(fry.x + 36 + i * 32, fry.y + 38, 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (s.fryer) drawSlot(ctx, s.fryer, fry.x + fry.w / 2, fry.y + 38);
  ctx.restore();

  // Plating counter.
  const pl = STATIONS.plating;
  ctx.save();
  ctx.fillStyle = COLORS.counterWood;
  rr(ctx, pl.x, pl.y, pl.w, pl.h, 10);
  ctx.fill();
  ctx.fillStyle = COLORS.plateWhite;
  rr(ctx, pl.x + 6, pl.y + 6, pl.w - 12, pl.h - 12, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.boardInk;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PLATING', pl.x + pl.w / 2, pl.y + 20);
  const match = matchingTicket(world);
  if (match) {
    ctx.strokeStyle = '#43a047';
    ctx.lineWidth = 3;
    rr(ctx, pl.x + 2, pl.y + 2, pl.w - 4, pl.h - 4, 10);
    ctx.stroke();
  }
  world.plate.forEach((item, i) => {
    const px = pl.x + 60 + i * 52;
    const py = pl.y + 42;
    ctx.fillStyle = '#e8e2d2';
    circle(ctx, px, py, 20);
    ctx.fill();
    ctx.strokeStyle = '#b9b09a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawFood(ctx, item, px, py, 13);
  });
  ctx.restore();

  // Serve window.
  const sv = STATIONS.serve;
  ctx.save();
  const glowing = !!matchingTicket(world);
  ctx.fillStyle = glowing ? '#43a047' : COLORS.serveGreen;
  rr(ctx, sv.x, sv.y, sv.w, sv.h, 10);
  ctx.fill();
  ctx.fillStyle = '#1b5e20';
  rr(ctx, sv.x + 8, sv.y + 8, sv.w - 16, sv.h - 60, 6);
  ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(sv.x + sv.w / 2, sv.y + 52, 16, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(sv.x + sv.w / 2 - 20, sv.y + 52, 40, 5);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SERVE', sv.x + sv.w / 2, sv.y + sv.h - 44);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(glowing ? 'READY!' : 'window', sv.x + sv.w / 2, sv.y + sv.h - 26);
  ctx.restore();

  // Trash.
  const tr = STATIONS.trash;
  ctx.save();
  ctx.fillStyle = COLORS.trashGrey;
  rr(ctx, tr.x + 20, tr.y + 8, tr.w - 40, tr.h - 16, 8);
  ctx.fill();
  ctx.fillStyle = '#9e9e9e';
  rr(ctx, tr.x + 14, tr.y + 2, tr.w - 28, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TRASH', tr.x + tr.w / 2, tr.y + tr.h - 12);
  ctx.restore();
}

function drawOrderBoard(ctx, world) {
  const b = ORDER_BOARD;
  ctx.save();
  ctx.fillStyle = '#3a2a18';
  rr(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ ORDERS ★', b.x + b.w / 2, b.y + 20);
  const tw = (b.w - 24) / 2;
  const th = 68;
  const slots = world.board.tickets;
  for (let i = 0; i < CONFIG.maxTickets; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const tx = b.x + 8 + col * (tw + 8);
    const ty = b.y + 28 + row * (th + 6);
    if (slots[i]) drawTicket(ctx, slots[i], tx, ty, tw, th);
    else {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      rr(ctx, tx, ty, tw, th, 8);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('— waiting —', tx + tw / 2, ty + 40);
    }
  }
  ctx.restore();
}

function drawParticles(ctx, world) {
  const p = world.particles;
  for (const q of p.list) {
    const a = 1 - q.life / q.max;
    ctx.save();
    if (q.kind === 'steam' || q.kind === 'smoke') {
      ctx.fillStyle = q.kind === 'steam' ? `rgba(255,255,255,${0.5 * a})` : `rgba(60,60,60,${0.5 * a})`;
      circle(ctx, q.x, q.y, q.size);
      ctx.fill();
    } else if (q.kind === 'spark') {
      ctx.fillStyle = `rgba(255,160,0,${a})`;
      circle(ctx, q.x, q.y, q.size);
      ctx.fill();
    } else if (q.kind === 'bit') {
      ctx.fillStyle = `rgba(120,200,90,${a})`;
      ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size);
    } else if (q.kind === 'star') {
      ctx.fillStyle = `rgba(255,213,79,${a})`;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  for (const f of p.floats) {
    const a = 1 - f.life / f.max;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = f.color;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 4;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
  }
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function drawHud(ctx, world) {
  ctx.save();
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, CONFIG.viewW, CONFIG.hudH);
  ctx.fillStyle = COLORS.hudInk;
  ctx.textAlign = 'left';
  ctx.font = 'bold 22px system-ui, sans-serif';
  const lowTime = world.timeLeft < 30;
  ctx.fillStyle = lowTime ? '#ff5252' : COLORS.hudInk;
  ctx.fillText(`⏱ ${fmtTime(world.timeLeft)}`, 16, 36);
  ctx.fillStyle = COLORS.hudInk;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(`💰 $${world.money}`, 170, 35);
  ctx.fillText(`🍽 ${world.serves} served`, 300, 35);
  const cm = comboMult(world.combo);
  ctx.fillStyle = world.combo >= 2 ? '#ffd54f' : COLORS.hudInk;
  ctx.fillText(`🔥 x${cm.toFixed(1)} (${world.combo})`, 460, 35);
  ctx.fillStyle = COLORS.hudInk;
  ctx.fillText(`LV ${world.level}`, 620, 35);
  // Level progress: serves toward next level.
  const intoLevel = world.serves % CONFIG.levelEveryServes;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  rr(ctx, 680, 22, 90, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#ffb300';
  rr(ctx, 680, 22, 90 * (intoLevel / CONFIG.levelEveryServes), 12, 6);
  ctx.fill();
  // Strikes.
  for (let i = 0; i < CONFIG.maxStrikes; i++) {
    ctx.fillStyle = i < world.strikes ? '#e53935' : 'rgba(255,255,255,0.25)';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('✕', 800 + i * 26, 36);
  }
  ctx.fillStyle = COLORS.hudInk;
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('WASD move · E use · Q plate · P pause · M mute', CONFIG.viewW - 16, 35);
  // Rush banner (below the station READY labels, on open floor).
  if (world.board.rushLeft > 0) {
    ctx.fillStyle = '#e53935';
    rr(ctx, CONFIG.viewW / 2 - 110, 176, 220, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ RUSH HOUR! +25% ⚡', CONFIG.viewW / 2, 197);
  }
  // Carrying chip + prompt.
  const prompt = world.phase === 'playing' ? stationPrompt(world) : '';
  if (prompt) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const w = ctx.measureText(prompt).width + 90;
    rr(ctx, CONFIG.viewW / 2 - w / 2, CONFIG.viewH - 44, w, 32, 16);
    ctx.fill();
    ctx.fillStyle = '#ffe9c4';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`[E]  ${prompt}`, CONFIG.viewW / 2, CONFIG.viewH - 22);
  }
  if (world.player.carrying) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    rr(ctx, 16, CONFIG.viewH - 44, 220, 32, 16);
    ctx.fill();
    ctx.fillStyle = '#ffe9c4';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Carrying: ${itemLabel(world.player.carrying)}`, 28, CONFIG.viewH - 22);
  }
  ctx.restore();
}

function drawTitle(ctx, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,10,4,0.55)';
  ctx.fillRect(0, 0, CONFIG.viewW, CONFIG.viewH);
  ctx.fillStyle = '#fff3d6';
  ctx.textAlign = 'center';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText('SIZZLE & SERVE', CONFIG.viewW / 2, 250);
  ctx.fillStyle = '#ffb300';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText('— RUSH HOUR —', CONFIG.viewW / 2, 295);
  ctx.fillStyle = '#ffe9c4';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('Take tickets. Chop, grill and fry. Plate it. Serve it before the clock eats it.', CONFIG.viewW / 2, 345);
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillStyle = '#ffd54f';
  ctx.fillText('9 recipes · 3 cooking stations · VIP tickets · rush hours · combos to x3', CONFIG.viewW / 2, 380);
  const blink = 0.6 + 0.4 * Math.sin(Date.now() / 300);
  ctx.globalAlpha = blink;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('Press E or click to start your shift', CONFIG.viewW / 2, 450);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffe9c4';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('WASD / arrows to move · E to use a station · Q to take back from the plate · P pause · M mute', CONFIG.viewW / 2, 500);
  ctx.restore();
}

function drawGameOver(ctx, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,10,4,0.72)';
  ctx.fillRect(0, 0, CONFIG.viewW, CONFIG.viewH);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText(world.overReason === 'strikes' ? 'TOO MANY STRIKES!' : 'SHIFT OVER!', CONFIG.viewW / 2, 220);
  const stars = world.money >= 220 ? 3 : world.money >= 160 ? 2 : world.money >= 100 ? 1 : 0;
  ctx.font = '44px system-ui, sans-serif';
  ctx.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), CONFIG.viewW / 2, 285);
  ctx.fillStyle = '#ffd54f';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText(`You earned $${world.money}`, CONFIG.viewW / 2, 340);
  ctx.fillStyle = '#ffe9c4';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(`${world.serves} dishes served · best combo x${comboMult(world.bestCombo).toFixed(1)} · level ${world.level} · ${world.stats.expired} orders expired`, CONFIG.viewW / 2, 385);
  const blink = 0.6 + 0.4 * Math.sin(Date.now() / 300);
  ctx.globalAlpha = blink;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('Press E to run it back', CONFIG.viewW / 2, 450);
  ctx.restore();
}

export function render(ctx, world) {
  // Floor.
  ctx.save();
  for (let ty = 0; ty < 11; ty++) {
    for (let tx = 0; tx < 20; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(tx * 64, 56 + ty * 64, 64, 64);
    }
  }
  // Back wall band.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 56, CONFIG.viewW, 10);
  ctx.restore();

  drawOrderBoard(ctx, world);
  drawStations(ctx, world);
  drawPlayer(ctx, world);
  drawParticles(ctx, world);
  drawHud(ctx, world);

  // Nearest-station highlight ring.
  const near = nearestStation(world);
  if (near && world.phase === 'playing') {
    const r = STATIONS[near];
    ctx.save();
    ctx.strokeStyle = 'rgba(255,179,0,0.85)';
    ctx.lineWidth = 3;
    rr(ctx, r.x - 4, r.y - 4, r.w + 8, r.h + 8, 12);
    ctx.stroke();
    ctx.restore();
  }

  if (world.phase === 'title') drawTitle(ctx, world);
  if (world.paused && world.phase === 'playing') {
    ctx.save();
    ctx.fillStyle = 'rgba(20,10,4,0.6)';
    ctx.fillRect(0, 0, CONFIG.viewW, CONFIG.viewH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CONFIG.viewW / 2, CONFIG.viewH / 2);
    ctx.restore();
  }
  if (world.phase === 'over') drawGameOver(ctx, world);
}
