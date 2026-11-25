// Cooking stations. One job: the state machines for the chop board, the two
// stove burners and the fryer basket — progress, done, and burnt.
import { PREP } from './recipes.js';

// A slot holds null or { kind, prep, progress, time, cookTime, burnGrace, done, burnt }.
export function emptySlot() {
  return null;
}

export function startCooking(slot, kind) {
  const prep = PREP[kind];
  if (!prep || !prep.station || prep.time <= 0) return null;
  return {
    kind,
    prep: 'raw',
    progress: 0,
    time: 0,
    cookTime: prep.time,
    burnGrace: prep.burnGrace || 0,
    done: false,
    burnt: false,
  };
}

export function updateSlot(slot, dt) {
  if (!slot) return slot;
  slot.time += dt;
  slot.progress = Math.min(1, slot.time / slot.cookTime);
  if (slot.time >= slot.cookTime) slot.done = true;
  // burnGrace 0 means "never burns" (chopped food sits fine).
  if (slot.burnGrace > 0 && slot.time >= slot.cookTime + slot.burnGrace) slot.burnt = true;
  return slot;
}

// What the player picks up from a finished slot: the prepped item, or a
// burnt one if it sat too long.
export function takeFromSlot(slot) {
  if (!slot) return null;
  if (!slot.done) return null;
  if (slot.burnt) return { kind: slot.kind, prep: 'burnt' };
  return { kind: slot.kind, prep: PREP[slot.kind].result };
}

export function createStations() {
  return {
    chop: null, // one item being chopped
    burners: [null, null], // stove: patty / chicken / pasta
    fryer: null, // fish / potato
  };
}

export function updateStations(stations, dt) {
  stations.chop = updateSlot(stations.chop, dt);
  stations.burners[0] = updateSlot(stations.burners[0], dt);
  stations.burners[1] = updateSlot(stations.burners[1], dt);
  stations.fryer = updateSlot(stations.fryer, dt);
}

// Where a carried raw item belongs. Returns 'chop' | 'stove' | 'fryer' | null.
export function stationFor(kind) {
  const prep = PREP[kind];
  return prep ? prep.station : null;
}

// First free slot of the right kind, or null when busy / wrong station.
export function freeSlot(stations, station) {
  if (station === 'chop') return stations.chop === null ? 'chop' : null;
  if (station === 'fryer') return stations.fryer === null ? 'fryer' : null;
  if (station === 'stove') {
    if (stations.burners[0] === null) return 'burners.0';
    if (stations.burners[1] === null) return 'burners.1';
    return null;
  }
  return null;
}

export function placeInSlot(stations, slotName, kind) {
  const item = startCooking(null, kind);
  if (!item) return false;
  if (slotName === 'chop') stations.chop = item;
  else if (slotName === 'fryer') stations.fryer = item;
  else if (slotName === 'burners.0') stations.burners[0] = item;
  else if (slotName === 'burners.1') stations.burners[1] = item;
  else return false;
  return true;
}

export function takeSlot(stations, slotName) {
  let slot = null;
  if (slotName === 'chop') slot = stations.chop;
  else if (slotName === 'fryer') slot = stations.fryer;
  else if (slotName === 'burners.0') slot = stations.burners[0];
  else if (slotName === 'burners.1') slot = stations.burners[1];
  const item = takeFromSlot(slot);
  if (!item) return null;
  if (slotName === 'chop') stations.chop = null;
  else if (slotName === 'fryer') stations.fryer = null;
  else if (slotName === 'burners.0') stations.burners[0] = null;
  else if (slotName === 'burners.1') stations.burners[1] = null;
  return item;
}
