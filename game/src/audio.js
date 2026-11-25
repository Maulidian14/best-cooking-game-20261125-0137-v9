// Synthesized sound. One job: every sizzle, chop, ding and the music loop,
// made with WebAudio oscillators and noise — no audio files, no network.
export function createAudio() {
  return {
    ctx: null,
    master: null,
    muted: false,
    musicOn: false,
    musicTimer: 0,
    nextNote: 0,
    step: 0,
    sizzleNodes: new Set(),
  };
}

export function ensureAudio(a) {
  if (a.ctx || typeof window === 'undefined') return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    a.ctx = new AC();
    a.master = a.ctx.createGain();
    a.master.gain.value = 0.5;
    a.master.connect(a.ctx.destination);
  } catch {
    a.ctx = null;
  }
}

function tone(a, freq, dur, type = 'sine', vol = 0.2, when = 0, slideTo = 0) {
  if (!a.ctx || a.muted) return;
  const t0 = a.ctx.currentTime + when;
  const osc = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(a.master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(a, dur, vol, filterFreq, type = 'lowpass', when = 0) {
  if (!a.ctx || a.muted) return;
  const t0 = a.ctx.currentTime + when;
  const len = Math.max(1, Math.floor(a.ctx.sampleRate * dur));
  const buf = a.ctx.createBuffer(1, len, a.ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.ctx.createBufferSource();
  src.buffer = buf;
  const filter = a.ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = filterFreq;
  const g = a.ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter).connect(g).connect(a.master);
  src.start(t0);
}

export const sfx = {
  chop(a) {
    noiseBurst(a, 0.09, 0.5, 900);
    tone(a, 180, 0.08, 'triangle', 0.25, 0, 90);
  },
  place(a) {
    tone(a, 320, 0.06, 'triangle', 0.15);
  },
  pickup(a) {
    tone(a, 440, 0.06, 'triangle', 0.15, 0, 660);
  },
  ding(a) {
    tone(a, 880, 0.35, 'sine', 0.25);
    tone(a, 1320, 0.3, 'sine', 0.12, 0.02);
  },
  coin(a) {
    tone(a, 988, 0.09, 'square', 0.1);
    tone(a, 1319, 0.22, 'square', 0.1, 0.09);
  },
  buzz(a) {
    tone(a, 140, 0.18, 'sawtooth', 0.18, 0, 90);
  },
  tick(a) {
    tone(a, 1200, 0.04, 'square', 0.08);
  },
  levelUp(a) {
    [523, 659, 784, 1047].forEach((f, i) => tone(a, f, 0.16, 'triangle', 0.2, i * 0.09));
  },
  rush(a) {
    [392, 523, 659].forEach((f, i) => tone(a, f, 0.14, 'square', 0.12, i * 0.08));
  },
  strike(a) {
    tone(a, 220, 0.3, 'sawtooth', 0.2, 0, 110);
    tone(a, 110, 0.4, 'sawtooth', 0.15, 0.05, 55);
  },
  serve(a) {
    tone(a, 784, 0.12, 'triangle', 0.2);
    tone(a, 1047, 0.25, 'triangle', 0.2, 0.1);
  },
};

// A tiny step sequencer: bass + hats + a plucky melody, ~104 BPM.
const BASS = [0, 0, 7, 0, 5, 0, 7, 10];
const MELODY = [0, -1, 4, -1, 7, -1, 4, 2, 0, -1, 4, -1, 9, 7, 4, 2];
const ROOT = 110;

export function updateMusic(a, dt, playing) {
  if (!a.ctx || a.muted || !playing) return;
  a.musicTimer += dt;
  const stepDur = 60 / 104 / 2;
  while (a.musicTimer >= stepDur) {
    a.musicTimer -= stepDur;
    const i = a.step % 16;
    const bassNote = BASS[Math.floor(i / 2)];
    if (i % 2 === 0) tone(a, ROOT * Math.pow(2, bassNote / 12), 0.22, 'triangle', 0.16);
    if (i % 2 === 1) noiseBurst(a, 0.03, 0.05, 6000, 'highpass');
    const m = MELODY[i];
    if (m >= 0) tone(a, ROOT * 4 * Math.pow(2, m / 12), 0.14, 'square', 0.045);
    a.step++;
  }
}

export function setMuted(a, muted) {
  a.muted = muted;
  if (a.master) a.master.gain.value = muted ? 0 : 0.5;
}
