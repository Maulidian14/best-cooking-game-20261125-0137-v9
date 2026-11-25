// Recipes and ingredients. One job: what a dish is, what it pays, and what
// raw item becomes once it has been prepped.
import { CONFIG } from './config.js';

// Every ingredient's journey: which station preps it, into what, and how long.
export const PREP = {
  bun: { station: null, result: 'ready', time: 0 },
  patty: { station: 'stove', result: 'grilled', time: CONFIG.grillTime.patty, burnGrace: CONFIG.grillBurnGrace },
  chicken: { station: 'stove', result: 'grilled', time: CONFIG.grillTime.chicken, burnGrace: CONFIG.grillBurnGrace },
  fish: { station: 'fryer', result: 'fried', time: CONFIG.fryTime.fish, burnGrace: CONFIG.fryBurnGrace },
  pasta: { station: 'stove', result: 'cooked', time: CONFIG.grillTime.pasta, burnGrace: CONFIG.pastaBurnGrace },
  potato: { station: 'fryer', result: 'fries', time: CONFIG.fryTime.potato, burnGrace: CONFIG.fryBurnGrace },
  cheese: { station: null, result: 'ready', time: 0 },
  lettuce: { station: null, result: 'ready', time: 0 },
  tomato: { station: 'chop', result: 'chopped', time: CONFIG.chopTime },
  onion: { station: 'chop', result: 'chopped', time: CONFIG.chopTime },
};

// An item is { kind, prep }. 'raw' is what the pantry hands out for food
// that needs a station; ready foods come out 'ready'.
export function pantryItem(kind) {
  return { kind, prep: PREP[kind].station ? 'raw' : 'ready' };
}

export function preppedItem(kind) {
  return { kind, prep: PREP[kind].result };
}

export function itemLabel(item) {
  const names = {
    bun: 'Bun', patty: 'Patty', chicken: 'Chicken', fish: 'Fish',
    pasta: 'Pasta', potato: 'Potato', cheese: 'Cheese', lettuce: 'Lettuce',
    tomato: 'Tomato', onion: 'Onion',
  };
  const prepWord = {
    raw: 'raw', ready: '', chopped: 'chopped', grilled: 'grilled',
    fried: 'fried', fries: 'fries', cooked: 'cooked', burnt: 'BURNT',
  };
  const base = names[item.kind] || item.kind;
  const word = prepWord[item.prep] || '';
  return word ? `${word} ${base.toLowerCase()}` : base;
}

// A recipe: id, display name, price, unlock level, components as
// { kind, prep } pairs. Two patties in Double Stack is two entries.
export const RECIPES = [
  {
    id: 'classic', name: 'Classic Burger', price: 12, level: 1,
    components: [
      { kind: 'bun', prep: 'ready' },
      { kind: 'patty', prep: 'grilled' },
      { kind: 'lettuce', prep: 'ready' },
    ],
  },
  {
    id: 'cheese', name: 'Cheese Burger', price: 14, level: 1,
    components: [
      { kind: 'bun', prep: 'ready' },
      { kind: 'patty', prep: 'grilled' },
      { kind: 'cheese', prep: 'ready' },
      { kind: 'tomato', prep: 'chopped' },
    ],
  },
  {
    id: 'salad', name: 'Garden Salad', price: 9, level: 1,
    components: [
      { kind: 'lettuce', prep: 'ready' },
      { kind: 'tomato', prep: 'chopped' },
      { kind: 'onion', prep: 'chopped' },
    ],
  },
  {
    id: 'pasta', name: 'Pasta Marinara', price: 11, level: 1,
    components: [
      { kind: 'pasta', prep: 'cooked' },
      { kind: 'tomato', prep: 'chopped' },
    ],
  },
  {
    id: 'chicken', name: 'Chicken Sandwich', price: 15, level: 2,
    components: [
      { kind: 'bun', prep: 'ready' },
      { kind: 'chicken', prep: 'grilled' },
      { kind: 'lettuce', prep: 'ready' },
      { kind: 'onion', prep: 'chopped' },
    ],
  },
  {
    id: 'fishchips', name: 'Fish & Chips', price: 16, level: 2,
    components: [
      { kind: 'fish', prep: 'fried' },
      { kind: 'potato', prep: 'fries' },
      { kind: 'lettuce', prep: 'ready' },
    ],
  },
  {
    id: 'deluxe', name: 'Deluxe Burger', price: 18, level: 3,
    components: [
      { kind: 'bun', prep: 'ready' },
      { kind: 'patty', prep: 'grilled' },
      { kind: 'cheese', prep: 'ready' },
      { kind: 'lettuce', prep: 'ready' },
      { kind: 'tomato', prep: 'chopped' },
    ],
  },
  {
    id: 'veggie', name: 'Veggie Stack', price: 13, level: 3,
    components: [
      { kind: 'bun', prep: 'ready' },
      { kind: 'lettuce', prep: 'ready' },
      { kind: 'tomato', prep: 'chopped' },
      { kind: 'onion', prep: 'chopped' },
      { kind: 'cheese', prep: 'ready' },
    ],
  },
  {
    id: 'double', name: 'Double Stack', price: 22, level: 4,
    components: [
      { kind: 'bun', prep: 'ready' },
      { kind: 'patty', prep: 'grilled' },
      { kind: 'patty', prep: 'grilled' },
      { kind: 'cheese', prep: 'ready' },
      { kind: 'tomato', prep: 'chopped' },
    ],
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

export function unlockedRecipes(level) {
  return RECIPES.filter((r) => r.level <= level);
}

// Multiset match: the plate holds exactly the recipe's components, any order.
export function plateMatches(plate, recipe) {
  if (plate.length !== recipe.components.length) return false;
  const need = recipe.components.map((c) => `${c.kind}:${c.prep}`).sort();
  const have = plate.map((c) => `${c.kind}:${c.prep}`).sort();
  return need.every((n, i) => n === have[i]);
}
