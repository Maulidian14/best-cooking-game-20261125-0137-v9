// Browser boot. One job: wire the canvas, the input, the sound and the loop
// together, and run the world. The world itself never touches the DOM.
import { CONFIG } from './config.js';
import { createWorld, worldUpdate } from './world.js';
import { createInput, attachInput, pollInput } from './input.js';
import { createAudio, ensureAudio, updateMusic, setMuted, sfx } from './audio.js';
import { render } from './render.js';
import { stageShot, autopilotInput } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.viewW;
canvas.height = CONFIG.viewH;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 1);
const auto = shot === 'auto';

let world = createWorld(seed);
const input = createInput();
attachInput(input, canvas);
const audio = createAudio();

function wakeAudio() {
  ensureAudio(audio);
  if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
}
window.addEventListener('pointerdown', wakeAudio);
window.addEventListener('keydown', wakeAudio);

if (shot && shot !== 'auto') {
  stageShot(world, shot, seed);
} else if (auto) {
  world.phase = 'playing';
}

window.__game = { world: () => world };

const SFX = {
  chop: (a) => sfx.chop(a),
  place: (a) => sfx.place(a),
  pickup: (a) => sfx.pickup(a),
  ding: (a) => sfx.ding(a),
  coin: (a) => sfx.coin(a),
  buzz: (a) => sfx.buzz(a),
  tick: (a) => sfx.tick(a),
  levelUp: (a) => sfx.levelUp(a),
  rush: (a) => sfx.rush(a),
  strike: (a) => sfx.strike(a),
  serve: (a) => sfx.serve(a),
  trash: (a) => sfx.buzz(a),
};

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  const click = pollInput(input);
  const frameInput = {
    up: input.up, down: input.down, left: input.left, right: input.right,
    interact: input.interact, takeFromPlate: input.takeFromPlate,
    pause: false, mute: false, click,
  };
  if (input.mute) {
    world.muted = !world.muted;
    setMuted(audio, world.muted);
  }
  if (input.pause && world.phase === 'playing') world.paused = !world.paused;
  if (auto && world.phase === 'playing') {
    Object.assign(frameInput, autopilotInput(world));
  }
  if (world.phase === 'over' && frameInput.interact) {
    world = createWorld((Math.random() * 1e9) | 0);
    window.__game = { world: () => world };
  }
  worldUpdate(world, dt, frameInput);
  for (const e of world.events) {
    const play = SFX[e.type];
    if (play) play(audio);
  }
  world.events = [];
  updateMusic(audio, dt, world.phase === 'playing' && !world.paused);
  render(ctx, world);
  // Staged screenshots (?shot=...) signal once the first frame is drawn.
  if (shot) window.__shotReady = true;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
