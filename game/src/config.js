// Sizzle & Serve: Rush Hour — configuration.
// One job: every tunable number, colour and station rectangle in one place.
export const CONFIG = {
  viewW: 1280,
  viewH: 720,
  hudH: 56,
  shiftLength: 180,
  maxStrikes: 3,
  maxTickets: 4,
  plateMax: 5,
  playerRadius: 18,
  playerSpeed: 290,
  interactReach: 52,
  levelEveryServes: 4,
  maxLevel: 4,
  // Ticket timers (seconds). Base grows with recipe size, shrinks with level.
  ticketBase: 46,
  ticketPerComponent: 7,
  ticketLevelCut: 2,
  ticketMin: 32,
  vipChance: 0.12,
  vipTimer: 30,
  vipPay: 2,
  rushEvery: 60,
  rushWindow: 20,
  rushPay: 1.25,
  rushSpawn: 3,
  spawnIntervalByLevel: [18, 14, 12, 10],
  // Cooking times (seconds) and the grace window before an item burns.
  chopTime: 1.2,
  grillTime: { patty: 5, chicken: 6, pasta: 6 },
  grillBurnGrace: 6,
  pastaBurnGrace: 5,
  fryTime: { fish: 5, potato: 4 },
  fryBurnGrace: 6,
  // Scoring.
  timeBonusHalf: 2,
  timeBonusHigh: 4,
  comboStep: 2,
  comboPerStep: 0.5,
  comboMax: 3,
};

// Station rectangles (logical 1280x720 space). The player walks the open floor
// between them; each station's interact zone is its rect grown by interactReach.
// The pantry is one tall column on the left wall so every bin is reachable;
// the order board hangs top-right in a 2x2 grid and is solid too.
export const STATIONS = {
  pantry: { x: 8, y: 64, w: 112, h: 636, label: 'PANTRY' },
  chop: { x: 220, y: 64, w: 160, h: 64, label: 'CHOP' },
  stove: { x: 410, y: 64, w: 200, h: 64, label: 'STOVE' },
  fryer: { x: 640, y: 64, w: 160, h: 64, label: 'FRYER' },
  plating: { x: 480, y: 648, w: 320, h: 64, label: 'PLATING' },
  serve: { x: 1152, y: 260, w: 120, h: 160, label: 'SERVE' },
  trash: { x: 1152, y: 560, w: 120, h: 80, label: 'TRASH' },
};

// The order board (not a station: no interaction, but solid like a wall).
export const ORDER_BOARD = { x: 830, y: 64, w: 442, h: 176 };

// Pantry bins in display order: one tall column, top to bottom.
export const PANTRY_BINS = [
  'bun', 'patty', 'chicken', 'fish', 'pasta',
  'potato', 'cheese', 'lettuce', 'tomato', 'onion',
];

// Centre of pantry bin i (0..9), shared by the world and the renderer.
export function binCenter(i) {
  return {
    x: STATIONS.pantry.x + STATIONS.pantry.w / 2,
    y: STATIONS.pantry.y + 58 + i * 60,
  };
}

// Warm bistro palette: wood, cream tile, stainless steel, tomato red.
export const COLORS = {
  floorA: '#c98f4e',
  floorB: '#bd8342',
  wall: '#7a4a26',
  wallTrim: '#5d3719',
  counterWood: '#8a5a2b',
  counterTop: '#d9b380',
  steel: '#b9c0c7',
  steelDark: '#8d949c',
  board: '#f7ead0',
  boardInk: '#3a2a18',
  chopBoard: '#e8c98f',
  grillHot: '#3c3c46',
  fryerRed: '#b03a2e',
  plateWhite: '#fdfdf6',
  serveGreen: '#2e7d32',
  trashGrey: '#616161',
  hudBg: '#2b1a0e',
  hudInk: '#ffe9c4',
  accent: '#ffb300',
  danger: '#e53935',
  vipGold: '#ffd54f',
  playerShirt: '#f5f5f0',
  playerHat: '#ffffff',
  playerSkin: '#e8b98a',
  playerPants: '#37474f',
};

export const KEYS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  interact: ['KeyE', 'Space'],
  takeFromPlate: ['KeyQ'],
  pause: ['KeyP'],
  mute: ['KeyM'],
};
