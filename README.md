# DUAT

DUAT is a browser-based falling puzzle game inspired by ancient Egyptian funerary rituals, the Book of the Dead, canopic jars, mummification, and the revival of gods.

The current build is **Phase 3**, a playable falling-puzzle prototype with same-type clearing, brain obstacle behavior, gravity, chain resolution, basic scoring, DUAT's first unique mechanic: canopic set clearing, a placeholder coffin meter, god progression, and PNG image sprites for each piece type with colored rectangle fallbacks.

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

## Phase 3 Features

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
- Same-type 4-connected clearing using orthogonal adjacency for liver, lung, stomach, intestine, and heart
- Brain obstacle pieces that do not clear through same-type matching
- Gravity after clears, with pieces falling vertically within their columns
- Chain resolution after gravity creates additional matches
- Basic score calculation
- Canopic set clear detection for connected liver, lung, stomach, and intestine groups
- Heart substitution for one missing canopic organ type in canopic sets only
- Brain exclusion from canopic set detection and canopic connectivity
- Same-cycle scoring bonus when a same-type clear and canopic set clear happen together
- HUD display for score, latest chain count, level placeholder, controls, grouped NEXT display, current coffin tier, current god name, coffin meter progress, unlocked god count, and short `CLEAR!`, `CANOPIC SET!`, `CHAIN xN`, and `GOD UNLOCKED!` feedback flashes
- PNG image sprites for all six DUAT piece types, with colored rectangle fallback rendering if an asset is missing or fails to load:
  - liver
  - lung
  - stomach
  - intestine
  - heart
  - brain
- Placeholder coffin meter progression after clears
- Tiered god unlock progression from Imsety through Amun-Ra
- `docs/index.html` entry point for GitHub Pages from the `docs/` folder


## Piece Image Assets

Piece placeholders live in:

```text
docs/assets/images/pieces/
  liver.png
  lung.png
  stomach.png
  intestine.png
  heart.png
  brain.png
```

`docs/src/data/pieces.js` maps each piece type to a Phaser texture key and image path. `GameScene` preloads those images before rendering the board, and both the board cells and NEXT preview use the loaded images when available. If a texture is missing or fails to load, the game falls back to the original colored rectangle rendering so gameplay can continue.

### Replacing Placeholder Piece Art Later

To replace a placeholder, overwrite the PNG at the same path and keep the required file name unchanged.

Recommended replacement image guidelines:

- Use **256x256px** source images.
- Use a **transparent background**.
- Keep silhouettes and colors distinct because pieces are displayed small in the 40px grid cells and NEXT preview.
- Keep the file names exactly `liver.png`, `lung.png`, `stomach.png`, `intestine.png`, `heart.png`, and `brain.png` so `docs/src/data/pieces.js` continues to preload the expected textures.

## Clear Rules

### Same-Type Clear

A same-type group clears when **4 or more clearable pieces of the same type** are orthogonally connected. This is the Phase 1-B clear rule and still works alongside Phase 2 canopic clears. Liver, lung, stomach, intestine, and heart are currently clearable by same-type matching; brain is not.

### Canopic Set Clear

A canopic set clears when one orthogonally connected component contains all four normal canopic organs:

- liver
- lung
- stomach
- intestine

The canopic group can be any shape and can contain more than four pieces. Diagonal-only contact does not count.

### Heart Wild Card Note

For Phase 2, heart has basic wild-card behavior for canopic sets only. A heart can substitute for **one** missing canopic organ type in a connected canopic group, such as liver + lung + stomach + heart. Full heart wild-card behavior for same-type clears is not implemented yet.

### Brain Obstacle Note

Brain is currently an obstacle piece. It does not participate in canopic sets, cannot count as a required organ type, cannot substitute for an organ, and cannot connect two canopic groups. Brain also cannot be cleared by same-type 4-connected matching, so four or more connected brain pieces remain on the board. Brain still appears in falling pairs, locks into the board, and falls normally when gravity resolves.

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

## Coffin Meter and God Progression

The coffin meter is a placeholder progression bar that increases only when pieces clear.

- Same-type clear meter gain is based on **25%** of that clear's score contribution.
- Canopic set clear meter gain is based on **40%** of that clear's score contribution.
- Chain multipliers and same-cycle bonuses are included before meter conversion, so stronger chains fill the coffin faster.
- When the current coffin meter reaches its requirement, the current god unlocks, excess meter carries into the next god, and play continues immediately.
- The HUD shows the current tier/coffin size, current god, meter value, and unlocked count.
- Unlocking a god briefly shows `GOD UNLOCKED!`; after the final god, the prototype shows `DUAT COMPLETE` as placeholder completion feedback.

Current placeholder god progression:

1. **Tier 1 — Small Coffin**: Imsety, Hapy, Duamutef, Qebehsenuef at 1000 meter each.
2. **Tier 2 — Medium Coffin**: Anubis, Thoth, Bastet, Sekhmet at 1500 meter each.
3. **Tier 3 — Large Coffin**: Horus, Isis, Osiris, Set at 2200 meter each.
4. **Tier 4 — Maximum Coffin**: Ra, Amun-Ra at 3000 meter each.

Bomb types are stored as future-facing data only; no bomb effects are active in this phase.


## Controls

- **Left Arrow**: move left
- **Right Arrow**: move right
- **Down Arrow**: soft drop
- **Up Arrow** or **Z**: rotate
- **Space**: hard drop

## How to Test Post-Lock Gravity in the Browser

This verifies that each locked cell falls independently by column before clear detection:

1. Start the local server with `python3 -m http.server 8000` and open <http://localhost:8000/docs/>.
2. Build or wait for a stack where one column has support one row higher than an adjacent empty column. For example, place any block at the bottom of column 3 while column 4 remains empty.
3. Drop a horizontal pair across those two columns so the left block lands on the supported column and the right block is still floating over the empty column.
4. After the pair locks, the unsupported right block should immediately fall to the bottom of its own column, or onto the nearest stack, before any same-type or canopic clear is checked.
5. If the new settled board creates a same-type clear, canopic set clear, or chain, those clears and their follow-up gravity should resolve normally afterward.

## How to Test God Unlocks in the Browser

Because pieces are random and the placeholder meter requirements are intentionally larger than a single clear, the normal manual test is cumulative:

1. Start the local server with `python3 -m http.server 8000` and open <http://localhost:8000/docs/>.
2. Repeatedly make same-type clears and canopic set clears.
3. Confirm the `Coffin: current / required` HUD value increases after each clear.
4. Confirm canopic set clears increase the meter faster than similarly sized same-type clears because they use the higher 40% meter conversion.
5. Continue clearing until the meter fills. The game should show `GOD UNLOCKED!`, the unlocked count should increase, the current god should advance, and the falling puzzle should keep running without a pause or restart.
6. To speed up browser verification during development, temporarily lower one `requiredMeter` value in `docs/src/data/gods.js`, reload the page, trigger a clear, and then revert the value before committing.

## How to Test Canopic Set Clearing in the Browser

Because pieces are random in this prototype, the simplest manual browser test is to stack pieces slowly and use **Space** for hard drops once a target column is aligned:

1. Start the local server with `python3 -m http.server 8000` and open <http://localhost:8000/docs/>.
2. Build a connected group containing liver, lung, stomach, and intestine. A compact 2x2 arrangement works well, but any orthogonally connected shape is valid.
3. When the final required organ locks, the group should clear, the score should increase by at least 500 points, gravity should run, and the game should briefly show `CANOPIC SET!` feedback near the board and in the HUD.
4. To test heart substitution, build a connected group with any three of liver/lung/stomach/intestine plus one heart. The heart should stand in for the one missing organ and clear with that group.
5. To test brain exclusion, try separating required organs with a brain between them. The brain should not connect the canopic set, and the canopic clear should not trigger unless the organs are otherwise orthogonally connected.
6. To test brain obstacle behavior, build four or more connected brain pieces. They should remain on the board after locking, while gravity and later clears continue to resolve around them.
7. To confirm compatibility, make a same-type group of 4 or more non-brain pieces, such as liver. It should still clear, briefly show `CLEAR!`, apply gravity, and support chains as before; chains of 2 or higher should also show `CHAIN xN`.

## Known Limitations / Not Implemented Yet

These features are intentionally left for later phases:

- Bomb system
- Actual bomb effects from unlocked gods
- Full heart same-type wild-card behavior
- Adjacent brain clearing from canopic clears
- Endless mode
- Final art assets
- Final animations
- BGM / sound effects
- Mobile touch controls

Current prototype limitations:

- Clears and gravity resolve instantly without animations.
- The level display is still a placeholder; coffin tier and god progression are shown separately.
- Coffin meter values and god requirements are placeholder tuning values.
- God unlocks do not yet grant active bomb effects or show final coffin/god art.
- Piece art uses PNG assets from `docs/assets/images/pieces/` and can be replaced with final generated PNG assets later.
- There is no debug board editor, so specific canopic layouts require manual play with random pieces.

## Project Structure

```text
docs/
  index.html
  assets/
    images/pieces/
      liver.png
      lung.png
      stomach.png
      intestine.png
      heart.png
      brain.png
  src/
    main.js
    scenes/GameScene.js
    core/Board.js
    core/Piece.js
    core/GravitySystem.js
    core/MatchResolver.js
    core/CanopusResolver.js
    core/ScoreSystem.js
    core/CoffinMeter.js
    data/constants.js
    data/gods.js
    data/pieces.js
    ui/Hud.js
```

The game source currently lives under `docs/src/` so GitHub Pages can serve the playable prototype directly from the `docs/` folder without a build step.
