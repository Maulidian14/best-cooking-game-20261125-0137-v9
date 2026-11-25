// Particles and floating text. One job: juice — steam, sizzle, sparkles,
// smoke and the little "+$18" that floats up when a dish is served.
import { makeRng } from './random.js';

export function createParticles() {
  return { list: [], floats: [] };
}

export function spawnSteam(p, x, y, n = 1) {
  for (let i = 0; i < n; i++) {
    p.list.push({
      kind: 'steam', x: x + (Math.random() - 0.5) * 26, y: y - 6,
      vx: (Math.random() - 0.5) * 8, vy: -22 - Math.random() * 14,
      life: 0, max: 0.9 + Math.random() * 0.5, size: 5 + Math.random() * 7,
    });
  }
}

export function spawnSizzle(p, x, y) {
  p.list.push({
    kind: 'spark', x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 8,
    vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 30,
    life: 0, max: 0.35, size: 2 + Math.random() * 2,
  });
}

export function spawnChopBits(p, x, y) {
  for (let i = 0; i < 8; i++) {
    p.list.push({
      kind: 'bit', x, y,
      vx: (Math.random() - 0.5) * 90, vy: -40 - Math.random() * 60,
      life: 0, max: 0.5, size: 3 + Math.random() * 3,
    });
  }
}

export function spawnServeBurst(p, x, y) {
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    p.list.push({
      kind: 'star', x, y,
      vx: Math.cos(a) * (40 + Math.random() * 50), vy: Math.sin(a) * (40 + Math.random() * 50) - 30,
      life: 0, max: 0.7, size: 3 + Math.random() * 3,
    });
  }
}

export function spawnSmoke(p, x, y) {
  p.list.push({
    kind: 'smoke', x: x + (Math.random() - 0.5) * 20, y: y - 10,
    vx: (Math.random() - 0.5) * 6, vy: -16 - Math.random() * 10,
    life: 0, max: 1.4, size: 8 + Math.random() * 8,
  });
}

export function spawnFloat(p, x, y, text, color = '#ffd54f') {
  p.floats.push({ x, y, text, color, life: 0, max: 1.2 });
}

export function updateParticles(p, dt) {
  for (const q of p.list) {
    q.life += dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    if (q.kind === 'bit' || q.kind === 'star') q.vy += 160 * dt;
    if (q.kind === 'steam' || q.kind === 'smoke') q.size += 12 * dt;
  }
  p.list = p.list.filter((q) => q.life < q.max);
  for (const f of p.floats) {
    f.life += dt;
    f.y -= 34 * dt;
  }
  p.floats = p.floats.filter((f) => f.life < f.max);
}

// Deterministic steam for staged screenshots (seeded, no Math.random).
export function spawnSteamSeeded(p, x, y, seed, n = 6) {
  const rng = makeRng(seed);
  for (let i = 0; i < n; i++) {
    p.list.push({
      kind: 'steam', x: x + (rng.next() - 0.5) * 26, y: y - 6 - rng.next() * 30,
      vx: (rng.next() - 0.5) * 8, vy: -22 - rng.next() * 14,
      life: rng.next() * 0.5, max: 1.2, size: 5 + rng.next() * 7,
    });
  }
}
