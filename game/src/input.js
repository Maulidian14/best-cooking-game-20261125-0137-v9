// Keyboard and mouse input. One job: turn browser events into the plain
// input object the world steps with. DOM-free worlds never import this.
import { KEYS } from './config.js';

export function createInput() {
  const held = new Set();
  const pressed = new Set();
  const input = {
    up: false, down: false, left: false, right: false,
    interact: false, takeFromPlate: false, pause: false, mute: false,
    click: null, // { x, y } in logical canvas coordinates, consumed once
    _held: held,
    _pressed: pressed,
  };
  return input;
}

function keyIn(code, list) {
  return list.includes(code);
}

export function attachInput(input, canvas) {
  function down(e) {
    if (keyIn(e.code, KEYS.up) || keyIn(e.code, KEYS.down) ||
      keyIn(e.code, KEYS.left) || keyIn(e.code, KEYS.right) ||
      keyIn(e.code, KEYS.interact)) {
      e.preventDefault();
    }
    if (e.repeat) return;
    input._held.add(e.code);
    input._pressed.add(e.code);
  }
  function up(e) {
    input._held.delete(e.code);
  }
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', () => input._held.clear());
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    input.click = {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy,
    };
  });
}

// Copy held/pressed state into the frame's plain input flags, then clear edges.
export function pollInput(input) {
  const held = input._held;
  const pressed = input._pressed;
  input.up = KEYS.up.some((c) => held.has(c));
  input.down = KEYS.down.some((c) => held.has(c));
  input.left = KEYS.left.some((c) => held.has(c));
  input.right = KEYS.right.some((c) => held.has(c));
  input.interact = KEYS.interact.some((c) => pressed.has(c));
  input.takeFromPlate = KEYS.takeFromPlate.some((c) => pressed.has(c));
  input.pause = KEYS.pause.some((c) => pressed.has(c));
  input.mute = KEYS.mute.some((c) => pressed.has(c));
  pressed.clear();
  const click = input.click;
  input.click = null;
  return click;
}
