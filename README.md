# DUAT

DUAT is a browser-based falling puzzle game inspired by ancient Egyptian funerary rituals, the Book of the Dead, canopic jars, mummification, and the revival of gods.

The current build is **Phase 2**, a playable falling-puzzle prototype with same-type clearing, gravity, chain resolution, basic scoring, and DUAT's first unique mechanic: canopic set clearing. It still uses placeholder colored blocks for all pieces.

## How to Run Locally

This prototype is designed to run directly from the `docs/` folder so it is ready for GitHub Pages deployment.

From the repository root, start a local static web server:

```bash
python3 -m http.server 8000
```

Then open one of these URLs in a browser:

- <http://localhost:8000/docs/>
- <http://localhost:8000/> (redirects to `docs/`)

A local server is recommended because the game uses JavaScript modules.

## Phase 2 Features

Implemented so far:

- 6 columns x 12 rows grid
- Falling two-piece pair
- Random piece generation
- NEXT piece preview
- Left/right keyboard movement
- Soft drop
- Hard drop
- 4-direction rotation
- Piece landing and locking into the board
- Game over detection
- Same-type 4-connected clearing using orthogonal adjacency
- Gravity after clears, with pieces falling vertically within their columns
- Chain resolution after gravity creates additional matches
- Basic score calculation
- Canopic set clear detection for connected liver, lung, stomach, and intestine groups
- Heart substitution for one missing canopic organ type in canopic sets only
- Brain exclusion from canopic set detection and canopic connectivity
- Same-cycle scoring bonus when a same-type clear and canopic set clear happen together
- HUD display for score, latest chain count, level placeholder, controls, NEXT display, and a `CANOPIC SET!` feedback flash
- Placeholder colored blocks for all six DUAT piece types:
  - liver
  - lung
  - stomach
  - intestine
  - heart
  - brain
- `docs/index.html` entry point for GitHub Pages from the `docs/` folder

## Clear Rules

### Same-Type Clear

A same-type group clears when **4 or more pieces of the same type** are orthogonally connected. This is the Phase 1-B clear rule and still works alongside Phase 2 canopic clears.

### Canopic Set Clear

A canopic set clears when one orthogonally connected component contains all four normal canopic organs:

- liver
- lung
- stomach
- intestine

The canopic group can be any shape and can contain more than four pieces. Diagonal-only contact does not count.

### Heart Wild Card Note

For Phase 2, heart has basic wild-card behavior for canopic sets only. A heart can substitute for **one** missing canopic organ type in a connected canopic group, such as liver + lung + stomach + heart. Full heart wild-card behavior for same-type clears is not implemented yet.

### Brain Limitation Note

Brain does not participate in canopic sets. It cannot count as a required organ type, cannot substitute for an organ, and cannot connect two canopic groups. Brain can still be cleared by the existing same-type 4-connected rule in this prototype; full brain obstacle behavior is reserved for a later phase.

## Basic Scoring

Current placeholder scoring can be tuned later:

- A 4-piece same-type group is worth **100 points**.
- Each additional piece in that same connected group adds **25 points**.
- A canopic set is worth **500 points**.
- Each extra piece in a canopic set adds **50 points**.
- If a same-type clear and a canopic set clear happen in the same clear cycle, that cycle receives a **x2 same-cycle bonus**.
- The full cycle score is multiplied by the current chain number:
  - First clear after a lock: chain 1
  - Clear caused by gravity after the first clear: chain 2
  - Next gravity-created clear: chain 3

Cells that qualify for both same-type and canopic clearing in the same cycle are only removed once.

## Controls

- **Left Arrow**: move left
- **Right Arrow**: move right
- **Down Arrow**: soft drop
- **Up Arrow** or **Z**: rotate
- **Space**: hard drop

## How to Test Canopic Set Clearing in the Browser

Because pieces are random in this prototype, the simplest manual browser test is to stack pieces slowly and use **Space** for hard drops once a target column is aligned:

1. Start the local server with `python3 -m http.server 8000` and open <http://localhost:8000/docs/>.
2. Build a connected group containing liver, lung, stomach, and intestine. A compact 2x2 arrangement works well, but any orthogonally connected shape is valid.
3. When the final required organ locks, the group should clear, the score should increase by at least 500 points, gravity should run, and the HUD should briefly show `CANOPIC SET!`.
4. To test heart substitution, build a connected group with any three of liver/lung/stomach/intestine plus one heart. The heart should stand in for the one missing organ and clear with that group.
5. To test brain exclusion, try separating required organs with a brain between them. The brain should not connect the canopic set, and the canopic clear should not trigger unless the organs are otherwise orthogonally connected.
6. To confirm compatibility, make a same-type group of 4 or more pieces. It should still clear, apply gravity, and support chains as before.

## Known Limitations / Not Implemented Yet

These features are intentionally left for later phases:

- Coffin meter
- God unlock system
- Bomb system
- Full heart same-type wild-card behavior
- Full brain obstacle behavior
- Adjacent brain clearing from canopic clears
- Endless mode
- Final art assets
- Final animations
- BGM / sound effects
- Mobile touch controls

Current prototype limitations:

- Clears and gravity resolve instantly without animations.
- The level display is still a placeholder.
- Piece art is represented by simple colored blocks.
- There is no debug board editor, so specific canopic layouts require manual play with random pieces.

## Project Structure

```text
docs/
  index.html
  src/
    main.js
    scenes/GameScene.js
    core/Board.js
    core/Piece.js
    core/GravitySystem.js
    core/MatchResolver.js
    core/CanopusResolver.js
    core/ScoreSystem.js
    data/constants.js
    data/pieces.js
    ui/Hud.js
```

The game source currently lives under `docs/src/` so GitHub Pages can serve the playable prototype directly from the `docs/` folder without a build step.
