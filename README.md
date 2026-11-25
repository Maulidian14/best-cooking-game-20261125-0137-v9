# Sizzle & Serve: Rush Hour

[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-ff5a5f)](https://make.fun/c/best-cooking-game-20261125-0137)
[![Prize pool $250](https://img.shields.io/badge/prize-$250_USDC-2e7d32)](https://make.fun/c/best-cooking-game-20261125-0137)
[![10 places paid](https://img.shields.io/badge/places-10_paid-1565c0)](https://make.fun/c/best-cooking-game-20261125-0137)

A complete 2D top-down cooking game that runs in desktop Chrome from static
files — no build step, no libraries, no network. Built for the
[make.fun best cooking game bounty](https://make.fun/c/best-cooking-game-20261125-0137).

## The game

You are the only chef on shift in a small bistro. Tickets land on the order
board; you run the kitchen. Grab ingredients from the pantry, chop the
tomatoes and onions, grill the patties and chicken, fry the fish and chips,
boil the pasta, stack it all on the plating counter and ring the bell at the
serve window before the ticket's timer eats it. Three expired tickets end the
shift — but a rush hour, a VIP ticket and a hot combo streak pay extra.

- **9 recipes** across 4 unlock levels: Classic Burger, Cheese Burger, Garden
  Salad, Pasta Marinara, Chicken Sandwich, Fish & Chips, Deluxe Burger,
  Veggie Stack, Double Stack.
- **3 cooking stations**: chop board, two-burner stove (grill + pasta pot),
  fryer. Food burns if you leave it — burnt dishes go in the trash.
- **Pressure that grows**: tickets arrive faster and run shorter as you level
  up; every 60 seconds a rush hour drops three tickets at once (+25% pay);
  gold VIP tickets pay double on a 30-second clock.
- **Combos to x3**: serve dish after dish without an expiry and the
  multiplier climbs; serving with time to spare adds a time bonus.
- **Feel**: chopping answers at once, the grill sizzles, tickets flash and
  tick under 10 seconds, serving pops with a coin jingle. All sound is
  synthesized live with WebAudio — bass, hats and a plucky melody included.
- **Look**: a warm bistro kitchen with a checker floor, wood counters,
  stainless stove, steam, smoke and food drawn to look worth serving.

## Controls

- **WASD / arrows** — move the chef
- **E / Space** — use a station (take, place, chop, cook, plate, serve)
- **Mouse click** — walk to a spot and use that station on arrival
- **Q** — take the top item back off the plate
- **P** — pause · **M** — mute

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

## Layout

- `game/index.html` — the page; `game/src/` holds one file per job:
  `config` (numbers, colours, stations), `random` (seeded RNG), `recipes`
  (dishes + prep rules), `orders` (tickets, VIP, rush hour), `stations`
  (chop/stove/fryer state machines), `particles` (steam, sparks, floats),
  `audio` (synth SFX + music), `input` (keyboard + mouse), `world` (the
  kitchen state and one update step), `render` (all canvas drawing),
  `shots` (scripted screenshot scenes + a greedy autopilot), `main`
  (browser boot and loop).
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library.
- `screenshots/` — 4 renders of the game's own code: title, mid-shift,
  rush hour, shift summary.

## License

MIT — see `LICENSE`.
