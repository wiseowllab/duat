# DUAT

DUAT is a browser-based falling puzzle game inspired by ancient Egyptian funerary rituals, the Book of the Dead, canopic jars, mummification, and the revival of gods.

The current build is **Phase 4-C**, a playable falling-puzzle prototype with same-type clearing, brain obstacle behavior, gravity, chain resolution, basic scoring, DUAT's first unique mechanic: canopic set clearing, a placeholder-tuned coffin meter, god progression, PNG image sprites for each piece type, tier-based coffin PNGs with fallback rendering, and Tier 1 through Tier 3 bomb stock/use.

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

## Phase 4-C Features

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
- Matched same-type cells briefly flash with a pale gold highlight before they clear
- Brain obstacle pieces that do not clear through same-type matching
- Gravity after locks and clears, with floating locked cells visibly falling vertically within their columns in short stepwise board updates during resolution
- Chain resolution after gravity creates additional matches, with each chain step highlighted one by one before clearing
- Basic score calculation
- Canopic set clear detection for connected liver, lung, stomach, and intestine groups
- Canopic set cells briefly flash with a distinct sacred cyan/gold highlight before they clear
- Heart substitution for one missing canopic organ type in canopic sets only
- Brain exclusion from canopic set detection and canopic connectivity
- Canopic set bonus clearing that can remove up to one orthogonally adjacent brain piece per clear cycle
- Same-cycle scoring bonus when a same-type clear and canopic set clear happen together
- HUD display for score, latest chain count, level placeholder, controls, grouped NEXT display, current coffin tier, current god name, visible tier-based coffin PNG icon, coffin meter progress, unlocked god count, and short `CLEAR!`, `CANOPIC SET!`, `CHAIN xN`, and `GOD UNLOCKED!` feedback flashes
- PNG image sprites for all six DUAT piece types, with colored rectangle fallback rendering if an asset is missing or fails to load:
  - liver
  - lung
  - stomach
  - intestine
  - heart
  - brain
- Coffin meter progression after clears
- Tiered god unlock progression from Imsety through Amun-Ra
- `docs/index.html` entry point for GitHub Pages from the `docs/` folder
- Temporary debug mode for quickly testing coffin meter progression, god unlocks, tier-based coffin image switching, and Tier 1/Tier 2/Tier 3/Tier 4 bomb stock
- Bomb stock for supported Tier 1, Tier 2, Tier 3, and Tier 4 gods, capped at four bombs
- Basic bomb controls using number keys 1-4
- Vertical, horizontal, cross, and 3x3 surround Tier 1 bomb effects that clear locked non-brain cells
- Brain Clear, Convert, Protect, and Burst Tier 2 bomb effects that can affect brain pieces
- Triple Column, Transform, Half Reset, and Chaos Tier 3 bomb effects that provide stronger board intervention and can affect brain pieces
- Full Clear and Max Burst Tier 4 bomb effects that flash and clear the whole board, including brain pieces


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

## Coffin Image Assets

Coffin tier art lives in:

```text
docs/assets/images/coffins/
  coffin_small.png
  coffin_medium.png
  coffin_large.png
  coffin_maximum.png
```

`docs/src/data/coffins.js` maps each coffin tier to a Phaser texture key, required file name, source path, tier label, fallback primitive size, and maximum HUD display size. `GameScene` preloads all four coffin images, and `Hud` chooses the image from the current god tier's `coffinSize`.

### Replacing Coffin Art Later

To replace coffin art, overwrite the PNG at the same path and keep the required file name unchanged:

- `small` -> `coffin_small.png`
- `medium` -> `coffin_medium.png`
- `large` -> `coffin_large.png`
- `maximum` -> `coffin_maximum.png`

The current prototype uses **4 tier-based coffin images**. It does **not** use 14 per-god coffin images yet, so replacing a tier image updates every god in that tier. Use transparent PNGs with a square or portrait-friendly composition; the HUD scales each image down to fit inside the existing COFFIN panel and falls back to a simple Phaser primitive coffin if the texture is unavailable.

## Clear Rules

### Same-Type Clear

A same-type group clears when **4 or more clearable pieces of the same type** are orthogonally connected. This is the Phase 1-B clear rule and still works alongside Phase 2 canopic clears. Liver, lung, stomach, intestine, and heart are currently clearable by same-type matching; brain is not. When a same-type match is detected, those cells briefly flash with a semi-transparent pale gold highlight before disappearing.

### Canopic Set Clear

A canopic set clears when one orthogonally connected component contains all four normal canopic organs:

- liver
- lung
- stomach
- intestine

The canopic group can be any shape and can contain more than four pieces. Diagonal-only contact does not count. When a canopic set is detected, those cells briefly flash with a stronger sacred cyan/gold highlight before disappearing, making it visually distinct from ordinary same-type clears.

When at least one canopic set clears in a clear cycle, the clear can also remove **up to one brain piece** orthogonally adjacent to any canopic-cleared cell. Only up/down/left/right adjacency counts; diagonal brain pieces are ignored. If multiple adjacent brain candidates exist, the selected brain is chosen by this priority: first the candidate touching the largest number of canopic-cleared cells, then the lower candidate on the board using the larger row index, then the leftmost candidate using the smaller column index. The selected brain uses a purple/gold bonus highlight before clearing.

### Heart Wild Card Note

For Phase 2, heart has basic wild-card behavior for canopic sets only. A heart can substitute for **one** missing canopic organ type in a connected canopic group, such as liver + lung + stomach + heart. Full heart wild-card behavior for same-type clears is not implemented yet.

### Brain Obstacle Note

Brain is currently an obstacle piece. It does not participate in canopic set construction, cannot count as a required organ type, cannot substitute for an organ, and cannot connect two canopic groups. Brain also cannot be cleared by same-type 4-connected matching, so four or more connected brain pieces remain on the board. A canopic set clear may remove one adjacent brain only as a post-detection bonus; Tier 2 and Tier 3 bombs remain the main brain-clearing tools because they can target, transform, or affect multiple brain pieces more directly. Brain still appears in falling pairs, locks into the board, and falls normally when gravity resolves.

## Basic Scoring

Current placeholder scoring can be tuned later:

- A 4-piece same-type group is worth **100 points**.
- Each additional piece in that same connected group adds **25 points**.
- A canopic set is worth **500 points**.
- Each extra piece in a canopic set adds **50 points**.
- A canopic-adjacent brain bonus clear adds **100 points** for the selected brain piece.
- If a same-type clear and a canopic set clear happen in the same clear cycle, that cycle receives a **x2 same-cycle bonus**.
- The full cycle score is multiplied by the current chain number:
  - First clear after a lock: chain 1
  - Clear caused by gravity after the first clear: chain 2
  - Next gravity-created clear: chain 3

Cells that qualify for both same-type and canopic clearing in the same cycle are only removed once. If gravity creates a chain, each chain step shows its own clear highlight before those cells disappear and the next gravity step resolves.

## Coffin Meter and God Progression

The coffin meter is a placeholder progression bar that increases only when pieces clear.

- Same-type clear meter gain is based on **25%** of that clear's score contribution.
- Canopic set clear meter gain is based on **40%** of that clear's score contribution.
- Chain multipliers and same-cycle bonuses are included before meter conversion, so stronger chains fill the coffin faster.
- When the current coffin meter reaches its requirement, the current god unlocks, excess meter carries into the next god, and play continues immediately.
- The HUD shows the current tier/coffin size, current god, meter value, unlocked count, and a tier-based coffin image beside the meter.
- Coffin PNG assets live in `docs/assets/images/coffins/` and are mapped in `docs/src/data/coffins.js`:
  - `coffin_small.png` for Small Coffin
  - `coffin_medium.png` for Medium Coffin
  - `coffin_large.png` for Large Coffin
  - `coffin_maximum.png` for Maximum Coffin
- The current implementation uses these **4 tier-based coffin images**, not 14 individual per-god coffin images yet.
- Unlocking a god briefly shows `GOD UNLOCKED!` and flashes/glows the coffin image; after the final god, the prototype shows `DUAT COMPLETE` as placeholder completion feedback.
- If a coffin texture is missing or fails to load, the HUD preserves a simple Phaser-drawn primitive coffin fallback so gameplay can continue.

Current god progression:

1. **Tier 1 — Small Coffin**: Imsety, Hapy, Duamutef, Qebehsenuef at 1000 meter each.
2. **Tier 2 — Medium Coffin**: Anubis, Thoth, Bastet, Sekhmet at 1500 meter each.
3. **Tier 3 — Large Coffin**: Horus, Isis, Osiris, Set at 2200 meter each.
4. **Tier 4 — Maximum Coffin**: Ra, Amun-Ra at 3000 meter each.

## Bomb Stock

When a supported Tier 1, Tier 2, Tier 3, or Tier 4 god unlocks, that god adds one bomb to the HUD's `BOMB STOCK` list. The stock can hold up to **4 bombs**. If the stock is full, additional supported bombs are ignored safely. Amun-Ra is the final god unlock and shows placeholder DUAT completion feedback.

Current supported Tier 1 bombs:

- **Imsety**: `vertical_clear` / Vertical — clears the target column.
- **Hapy**: `horizontal_clear` / Horizontal — clears the target row.
- **Duamutef**: `cross_clear` / Cross — clears the target row and column.
- **Qebehsenuef**: `surround_clear` / Surround — clears a 3x3 area centered on the target cell.

Current supported Tier 2 bombs:

- **Anubis**: `brain_clear` / Brain Clear — clears only brain pieces in the target row and target column for **50 points per brain cleared**.
- **Thoth**: `knowledge_convert` / Convert — converts up to four brain pieces in a target-centered 3x3 area into hearts for **25 points per converted piece**. If there are no brains in that area, it converts one random non-brain piece in the area into a heart.
- **Bastet**: `protective_clear` / Protect — clears a target-centered 3x3 area, including brain pieces, for **35 points per cleared piece**.
- **Sekhmet**: `war_burst` / Burst — clears the target cell plus its up/down/left/right neighbors, including brain pieces, for **40 points per cleared piece**.

Current supported Tier 3 bombs:

- **Horus**: `triple_column_clear` / Triple Column — clears the target column and immediate left/right neighboring columns, including brain pieces, for **45 points per cleared piece**. Edge columns clamp safely to the board.
- **Isis**: `piece_transform` / Transform — converts brain pieces in a target-centered 5x5 area into hearts for **35 points per transformed piece**. If no brains are in that area, it converts up to three normal organ pieces into hearts instead, without changing empty cells or existing hearts.
- **Osiris**: `half_board_reset` / Half Reset — clears the left half or right half of the board based on the target column, including brain pieces, for **30 points per cleared piece**. On the 6-column board, columns 0-2 are the left half and columns 3-5 are the right half.
- **Set**: `chaos_clear` / Chaos — clears up to eight occupied cells within Manhattan distance 3 of the target, including brain pieces, for **50 points per cleared piece**. Cells are selected deterministically by closest distance, then lower row, then lower column.

Current supported Tier 4 bombs:

- **Ra**: `full_board_clear` / Full Clear — clears every occupied locked cell on the board, including brain pieces, for **40 points per cleared piece**. It represents Ra's sunlight purifying the full board.
- **Amun-Ra**: `maximum_coffin_burst` / Max Burst — clears every occupied locked cell on the board, including brain pieces, for **60 points per cleared piece plus a 1000-point placeholder final-stage bonus**. It shows `AMUN-RA AWAKENED!` / `DUAT COMPLETE!` feedback and does not start a full ending sequence yet.

Bombs target the active falling pair's pivot cell. If the pivot is above the visible board, the target row clamps to row 0. When a bomb is used, its affected row, column, cross, 3x3 area, 5x5 area, board half, triple-column area, diamond, chaos cells, or entire board briefly flash before disappearing automatically. Bombs only affect existing locked board cells, not the active falling pair. Tier 1 bombs **do not clear brain pieces**; brains remain on the board even when they are inside the affected row, column, cross, or 3x3 area. Tier 2, Tier 3, and Tier 4 bombs are stronger and **can affect brain pieces** as listed above. Tier 4 bombs affect the whole board and do not need a meaningful target position, though they still use the active pair pivot for control compatibility. After a bomb effect, placeholder score and coffin meter gain are applied, gravity runs for cleared cells, and the normal same-type/canopic chain resolution loop continues.


## Controls

- **Left Arrow**: move left
- **Right Arrow**: move right
- **Down Arrow**: soft drop
- **Up Arrow** or **Z**: rotate
- **Space**: hard drop
- **1**, **2**, **3**, **4**: use bomb stock slot 1-4 at the active pair's pivot cell

## Temporary Debug Mode

Debug mode is a temporary development/testing helper for validating DUAT progression and visuals without long manual play sessions. It is **off by default** and does not change normal gameplay unless it is toggled on.

- **D**: toggle debug mode on/off. When enabled, the HUD shows `DEBUG ON`.
- **G** while debug mode is on: add `+500` points to the coffin meter using the existing coffin meter progression path. If the meter fills, god unlock feedback and coffin flash/glow still occur.
- **Shift + G** while debug mode is on: fill the current coffin meter enough to unlock the current god.
- **T** while debug mode is on: advance one god for visual testing by filling/unlocking the current god, updating the tier label, god name, coffin image, and unlocked count safely.
- **R** while debug mode is on: reset coffin meter/god progression and bomb stock back to the beginning. The board, active piece, score, and chain state are not reset.

### How to Test Tier 1 through Tier 4 Coffin Image Switching

1. Start the local server with `python3 -m http.server 8000` and open <http://localhost:8000/docs/>.
2. Confirm debug mode is off by default and the COFFIN panel starts at Tier 1 / Small Coffin with `coffin_small.png`.
3. Press **D** and confirm the HUD shows `DEBUG ON`.
4. Press **T** repeatedly to unlock gods one at a time. The first four gods should keep the small coffin image, then Anubis should switch to Tier 2 / Medium Coffin with `coffin_medium.png`.
5. Continue pressing **T** through the Tier 2 gods; Horus should switch to Tier 3 / Large Coffin with `coffin_large.png`.
6. Continue pressing **T** through the Tier 3 gods; Ra should switch to Tier 4 / Maximum Coffin with `coffin_maximum.png`.
7. Press **R** to reset coffin/god progression back to Imsety and verify the small coffin returns without resetting the board.


## How to Test Clear Highlighting in the Browser

1. Start the local server with `python3 -m http.server 8000` and open <http://localhost:8000/docs/>.
2. To test same-type highlighting, build a 4+ orthogonally connected group of the same non-brain type, then lock the final pair that completes the group. Before the pieces vanish, the matched cells should flash pale gold for a brief moment; then they clear, gravity runs, and normal score/chain/coffin updates continue.
3. To test canopic set highlighting, build an orthogonally connected group containing liver, lung, stomach, and intestine, or three of those organs plus one heart. When the set resolves, the canopic cells should flash with the stronger cyan/gold highlight before clearing.
4. To test overlapping same-cycle clears, create a board state where a same-type group and a canopic set both resolve after the same lock. All affected cells should highlight at once without duplicate overlays, then clear once.
5. To test chain highlighting, arrange pieces so the first clear causes gravity to create a second clear. The first clear should highlight and disappear, gravity should settle the board, and then the next chain step should show its own highlight before clearing.


## How to Test Board Gravity Animation in the Browser

1. Start the local server with `python3 -m http.server 8000` and open <http://localhost:8000/docs/>.
2. To test post-lock gravity, place a horizontal pair so one side lands on support and the other side is floating over an empty column. After the pair locks, the unsupported locked cell should visibly fall straight down one row at a time instead of teleporting, then the next piece should spawn.
3. To test same-type and canopic clear gravity, create a same-type clear or canopic set clear with cells above the cleared area. After the clear highlight finishes, unsupported locked cells should settle through short one-row board updates before the next chain check.
4. To test bomb clear gravity, enable debug mode with **D**, unlock Tier 1, Tier 2, Tier 3, or Tier 4 bombs with **T**, use keys **1**-**4** to clear cells below existing locked cells, and confirm the remaining locked cells visibly fall before normal clear resolution continues.
5. During each test, confirm pieces do not duplicate or disappear incorrectly and player movement is ignored while gravity/clear resolution is running.

## How to Test Tier 1, Tier 2, Tier 3, and Tier 4 Bomb Stock in the Browser

1. Start the local server with `python3 -m http.server 8000` and open <http://localhost:8000/docs/>.
2. Press **D** to enable debug mode and confirm the HUD shows `DEBUG ON`.
3. Press **T** once to unlock Imsety. The HUD should add `1: Imsety / Vertical` under `BOMB STOCK`.
4. Press **T** three more times to unlock Hapy, Duamutef, and Qebehsenuef. The HUD should fill the four bomb slots with Vertical, Horizontal, Cross, and Surround.
5. Move the falling piece so its pivot is over a row or column that contains locked pieces, then press **1**, **2**, **3**, or **4** to use the corresponding slot. The used bomb should disappear from stock, the target area should briefly flash gold, score should gain 25 points for each non-brain cell directly cleared, gravity should run, and any resulting same-type or canopic chains should resolve normally.
6. To test Tier 2 bombs, spend or reset the Tier 1 stock so the four-slot cap has room, then press **T** until Anubis, Thoth, Bastet, and Sekhmet unlock. The HUD should display `Anubis / Brain Clear`, `Thoth / Convert`, `Bastet / Protect`, and `Sekhmet / Burst` as stock is added.
7. Use Anubis on a row/column containing brains to confirm only those brains clear; use Thoth on a 3x3 area containing brains to confirm they convert to hearts; use Bastet on a 3x3 area with brains and normal pieces to confirm all locked pieces clear; use Sekhmet on the pivot and four orthogonal neighbors to confirm the diamond clears including brains.
8. To verify brain safety, use a Tier 1 bomb on a row, column, cross, or 3x3 area containing a brain. The non-brain pieces in the affected area may clear, but brain pieces should remain.
9. To test Tier 3 bombs, spend or reset earlier stock so the four-slot cap has room, then press **T** until Horus, Isis, Osiris, and Set unlock. The HUD should display `Horus / Triple Column`, `Isis / Transform`, `Osiris / Half Reset`, and `Set / Chaos` as stock is added.
10. Use Horus on a stack spanning adjacent columns to confirm three columns clear including brains; use Isis on a 5x5 area with brains to confirm they convert to hearts, or without brains to confirm up to three organs convert; use Osiris from columns 0-2 or 3-5 to confirm the correct half clears; use Set near occupied cells to confirm up to eight nearby cells flash and clear in deterministic priority.
11. To test Tier 4 bombs, spend or reset earlier stock so the four-slot cap has room, then press **T** until Ra and Amun-Ra unlock. The HUD should display `Ra / Full Clear` and `Amun-Ra / Max Burst` as stock is added.
12. Use Ra to confirm the entire board flashes bright gold and all occupied locked cells, including brains, clear for 40 points each. Use Amun-Ra to confirm the whole board flashes with stronger maximum-coffin colors, all occupied locked cells clear including brains, the score gains 60 points per cleared piece plus 1000 bonus points, and `AMUN-RA AWAKENED!` / `DUAT COMPLETE!` feedback appears without stopping the game.
13. Press **R** while debug mode is on to reset coffin/god progression and empty the bomb stock for another pass.

## How to Test Post-Lock Gravity in the Browser

This verifies that each locked cell falls independently by column before clear detection:

1. Start the local server with `python3 -m http.server 8000` and open <http://localhost:8000/docs/>.
2. Build or wait for a stack where one column has support one row higher than an adjacent empty column. For example, place any block at the bottom of column 3 while column 4 remains empty.
3. Drop a horizontal pair across those two columns so the left block lands on the supported column and the right block is still floating over the empty column.
4. After the pair locks, the unsupported right block should immediately fall to the bottom of its own column, or onto the nearest stack, before any same-type or canopic clear is checked.
5. If the new settled board creates a same-type clear, canopic set clear, or chain, those clears and their follow-up gravity should resolve normally afterward.

## How to Test Coffin Image Rendering in the Browser

1. Start the local server with `python3 -m http.server 8000` and open <http://localhost:8000/docs/>.
2. Confirm the COFFIN panel shows the `small` tier coffin image from `docs/assets/images/coffins/coffin_small.png` while the current god is Imsety.
3. To verify other tiers quickly during development, press **D** to enable debug mode and then press **T** repeatedly to advance through gods until the HUD reaches Medium, Large, and Maximum Coffin tiers.
4. Confirm the tier label, current god name, meter text, unlocked count, and progress bar remain visible while the coffin image changes tier.
5. Confirm a god unlock still flashes/glows the coffin image and shows `GOD UNLOCKED!` feedback.
6. Press **R** in debug mode if you want to reset coffin/god progression to the starting Small Coffin state without resetting the board.

## How to Test God Unlocks in the Browser

Because pieces are random and the placeholder meter requirements are intentionally larger than a single clear, the normal manual test is cumulative:

1. Start the local server with `python3 -m http.server 8000` and open <http://localhost:8000/docs/>.
2. Repeatedly make same-type clears and canopic set clears.
3. Confirm the `Meter: current / required` HUD value increases after each clear.
4. Confirm canopic set clears increase the meter faster than similarly sized same-type clears because they use the higher 40% meter conversion.
5. Continue clearing until the meter fills. The game should show `GOD UNLOCKED!`, the unlocked count should increase, the current god should advance, and the falling puzzle should keep running without a pause or restart.
6. To speed up browser verification during development, press **D** to enable debug mode, use **G** to add +500 coffin meter points, or use **Shift + G** to fill the current meter and trigger the current god unlock immediately.

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

- Full heart same-type wild-card behavior
- Adjacent brain clearing from canopic clears
- Endless mode
- Final art assets
- Final animations
- BGM / sound effects
- Mobile touch controls

Current prototype limitations:

- Clear highlights are simple flashes, and board gravity uses simple stepwise one-row updates rather than polished falling sprite animations.
- The level display is still a placeholder; coffin tier and god progression are shown separately.
- Coffin meter values and god requirements are placeholder tuning values.
- Tier 1, Tier 2, Tier 3, and Tier 4 gods grant active bomb effects; final Amun-Ra completion is still placeholder feedback rather than a full ending sequence.
- Piece art uses PNG assets from `docs/assets/images/pieces/` and can be replaced with final generated PNG assets later.
- Debug mode accelerates coffin/god progression and bomb stock testing only; there is no debug board editor, so specific canopic and bomb layouts still require manual play with random pieces.

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
    images/coffins/
      coffin_small.png
      coffin_medium.png
      coffin_large.png
      coffin_maximum.png
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
    data/coffins.js
    data/gods.js
    data/pieces.js
    ui/Hud.js
```

The game source currently lives under `docs/src/` so GitHub Pages can serve the playable prototype directly from the `docs/` folder without a build step.
