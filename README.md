# DUAT

DUAT is a browser-based falling puzzle game inspired by ancient Egyptian funerary rituals, the Book of the Dead, canopic jars, mummification, and the revival of gods.

The current build is **Phase 1-A**, a basic playable falling-puzzle prototype using placeholder colored blocks.

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

## Phase 1-A Features

Implemented in this phase:

- 6 columns x 12 rows grid
- Falling two-piece pair
- Random piece generation
- NEXT piece preview
- Left/right keyboard movement
- Soft drop
- 4-direction rotation
- Piece landing and locking into the board
- Game over detection
- Placeholder colored blocks for all six DUAT piece types:
  - liver
  - lung
  - stomach
  - intestine
  - heart
  - brain
- Simple HUD with score placeholder, level placeholder, controls, and NEXT display
- `docs/index.html` entry point for GitHub Pages from the `docs/` folder

## Controls

- **Left Arrow**: move left
- **Right Arrow**: move right
- **Down Arrow**: soft drop
- **Up Arrow** or **Z**: rotate
- **Space**: hard drop

## Not Implemented Yet

These features are intentionally left for later phases:

- Same-type 4-connected clearing
- Gravity after clears and chain resolution
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
    data/constants.js
    data/pieces.js
    ui/Hud.js
```

The game source currently lives under `docs/src/` so GitHub Pages can serve the playable prototype directly from the `docs/` folder without a build step.
