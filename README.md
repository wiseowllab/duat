# DUAT

DUAT is a browser-based falling puzzle game inspired by ancient Egyptian funerary rituals, the Book of the Dead, canopic jars, mummification, and the revival of gods.

The current build is **Phase 1-B**, a playable falling-puzzle prototype with same-type clearing, gravity, chain resolution, and basic scoring. It still uses placeholder colored blocks for all pieces.

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

## Phase 1-B Features

Implemented in this phase:

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
- HUD display for score, latest chain count, level placeholder, controls, and NEXT display
- Placeholder colored blocks for all six DUAT piece types:
  - liver
  - lung
  - stomach
  - intestine
  - heart
  - brain
- `docs/index.html` entry point for GitHub Pages from the `docs/` folder

## Basic Scoring

Phase 1-B uses a simple placeholder score system that can be tuned later:

- A 4-piece same-type group is worth **100 points**.
- Each additional piece in that same connected group adds **25 points**.
- All groups cleared in the same resolution step are added together.
- The step score is multiplied by the current chain number:
  - First clear after a lock: chain 1
  - Clear caused by gravity after the first clear: chain 2
  - Next gravity-created clear: chain 3

For this phase only, **all six piece types behave as normal pieces**. Heart wild-card behavior and brain obstacle behavior are intentionally not implemented yet.

## Controls

- **Left Arrow**: move left
- **Right Arrow**: move right
- **Down Arrow**: soft drop
- **Up Arrow** or **Z**: rotate
- **Space**: hard drop

## Known Limitations / Not Implemented Yet

These features are intentionally left for later phases:

- Canopic set clear
- Heart wild-card behavior
- Brain obstacle behavior
- Coffin meter
- God unlock system
- Bomb system
- Endless mode
- Final art assets
- Final animations
- BGM / sound effects
- Mobile touch controls

Current prototype limitations:

- Clears and gravity resolve instantly without animations.
- The level display is still a placeholder.
- Piece art is represented by simple colored blocks.

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
    core/ScoreSystem.js
    data/constants.js
    data/pieces.js
    ui/Hud.js
```

The game source currently lives under `docs/src/` so GitHub Pages can serve the playable prototype directly from the `docs/` folder without a build step.
