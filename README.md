# DUAT

DUAT is a browser-based falling puzzle game inspired by ancient Egyptian funerary rituals, the Book of the Dead, canopic jars, mummification, and the revival of gods.

This repository currently contains a playable Phaser prototype served from `docs/` for GitHub Pages. This README is a development status document for planning future work safely; the game design document remains `docs/egypt_puzzle_GDD.html`.

## How to Run Locally

From the repository root, start a local static web server:

```bash
python3 -m http.server 8000
```

Then open one of these URLs in a browser:

- <http://localhost:8000/docs/>
- <http://localhost:8000/> redirects to `docs/`

A local server is recommended because the prototype uses JavaScript modules.

## Current Playable State

DUAT is currently a single-scene falling puzzle prototype with a basic title, pause, and game-over flow plus these implemented systems:

### Game Flow

- The page opens on a **DUAT** title screen before pieces begin falling.
- **Enter** or **Space** starts a fresh game from the title screen.
- **Enter** pauses active gameplay when no bomb is selected; **P** remains an optional pause shortcut. Falling, movement, rotation, hard drop, bomb selection, and debug controls are disabled while paused.
- **Enter** or **Space** resumes from pause.
- Game over shows a restart prompt, and **Enter** or **Space** restarts with the board, score, chain, coffin meter, god progression, bomb stock, active pair, next pair, overlays, and debug mode reset. **R** remains an optional game-over restart shortcut.

### Board and Falling Pair

- 6 columns x 12 rows playfield.
- Falling two-piece pairs.
- Random next-pair generation.
- NEXT piece preview.
- Left/right movement.
- Soft drop.
- Hard drop.
- Four-direction pair rotation.
- Piece landing and lock delay.
- Game over detection when a new pair cannot spawn.

### Clear and Resolution

- Same-type 4+ connected clear using orthogonal adjacency.
- Stepwise post-lock gravity after pieces lock and after clears resolve.
- Chain resolution when gravity creates additional clears.
- Clear highlights before cells are removed:
  - Pale gold for same-type clears.
  - Sacred cyan/gold for canopic set clears.
- Basic score display and chain display.

### Canopic and Brain Rules

- Canopic set clear detection for connected liver, lung, stomach, and intestine groups.
- Heart substitution for one missing organ in canopic sets.
- Brain obstacle behavior.
- Brain pieces are excluded from same-type matching.
- Brain pieces are excluded from canopic connectivity.
- Canopic-adjacent brain clear: a canopic set can clear up to one adjacent brain piece using the implemented priority rule.

### Bombs and Visual Feedback

- Bomb stock with up to four slots.
- Tier 1, Tier 2, Tier 3, and Tier 4 bombs.
- Bomb selection mode with board-area preview.
- Same-number confirm for selected bomb slots.
- Enter/Space confirm for selected bomb slots.
- Esc cancel for bomb selection.
- Bomb area previews and bomb area flashes.

### Assets, Progression, and Debug

- PNG piece assets for all six piece types.
- Coffin meter.
- 14-god unlock progression.
- Amun-Ra as the final god unlock.
- Bomb stock generated from god unlocks.
- Tier-based coffin PNGs for the HUD.
- Debug mode for testing meter progress, god unlocks, coffin tier changes, bomb stock, and reset behavior.

## Current Controls

### Title Screen

- **Enter / Space**: start the game. Pieces do not spawn or fall until one of these keys is pressed.

### Normal Play

- **Left / Right**: move the active pair horizontally.
- **Down**: soft drop.
- **Up / Z**: rotate the active pair.
- **Space**: hard drop when no bomb is selected.
- **Enter**: pause gameplay when no bomb is selected.
- **P**: optional pause shortcut.
- **M**: toggle generated sound effects on/off.
- **Space** does not pause during normal gameplay.

### Paused

- **Enter / Space**: resume gameplay.
- **Esc**: also resumes gameplay.
- **P**: optional resume shortcut.
- **M**: toggle generated sound effects on/off. Movement, rotation, dropping, bomb selection, and debug inputs are ignored while paused.

### Game Over

- **Enter / Space**: restart after game over.
- **R**: optional restart shortcut.
- **M**: toggle generated sound effects on/off.

### Bomb Controls

- **1-4**: select and preview a bomb slot.
- **Same number again**: use the selected bomb.
- **Different number**: switch selected bomb slot.
- **Enter / Space**: use the selected bomb when a bomb is selected.
- **Esc**: cancel bomb selection.
- When a bomb is selected, **Space** confirms the bomb instead of hard dropping.

Bombs target the current active pair position. The preview shows the bomb's affected area before confirmation.

### Debug Controls

- **D**: toggle debug mode.
- **G**: when debug mode is on, add 500 coffin meter points.
- **Shift+G**: when debug mode is on, fill the current god's coffin meter and unlock that god.
- **T**: when debug mode is on, advance by filling the current god's coffin meter.
- **R**: when debug mode is on during normal play, reset coffin progression and bomb stock. On the game over screen, **R** restarts the game instead.

## Current Piece Rules

- **liver**, **lung**, **stomach**, and **intestine** are normal organ pieces.
- **heart** can substitute for one missing organ in canopic sets.
- **brain** is an obstacle piece.
- Brain does not clear by same-type matching.
- Brain does not connect canopic sets.
- Canopic set clears can remove up to one adjacent brain piece using the priority rule:
  1. Prefer the adjacent brain touching the most canopic-set cells.
  2. If tied, prefer the lower brain row.
  3. If still tied, prefer the leftmost brain column.

## Current Bomb System

Bombs are awarded from god unlocks and stored in a four-slot bomb stock. Selecting a bomb previews its area; confirming consumes the bomb and then runs gravity and normal clear resolution.

### Tier 1 Bombs

Tier 1 bombs clear locked non-brain cells only. They do **not** clear brain pieces.

- **Vertical** (`vertical_clear`): clears the target column.
- **Horizontal** (`horizontal_clear`): clears the target row.
- **Cross** (`cross_clear`): clears the target row and target column.
- **Surround** (`surround_clear`): clears a 3x3 area around the target cell.

### Tier 2 Bombs

Tier 2 bombs introduce direct brain interaction.

- **Brain Clear** (`brain_clear`): clears brain pieces in the target row and column. Affects brain only.
- **Convert** (`knowledge_convert`): converts up to four brain pieces in a 3x3 area into hearts; if no brains are present, it can convert one non-brain occupied cell in that area into a heart.
- **Protect** (`protective_clear`): clears a 3x3 area, including brain pieces.
- **Burst** (`war_burst`): clears a 5-cell diamond, including brain pieces.

### Tier 3 Bombs

Tier 3 bombs provide stronger board intervention. All currently implemented Tier 3 clearing/conversion effects can affect brain pieces directly or by conversion.

- **Triple Column** (`triple_column_clear`): clears the target column and neighboring columns, including brain pieces.
- **Transform** (`piece_transform`): converts brain pieces in a 5x5 area into hearts; if no brains are present, it converts up to three nearby organ pieces into hearts.
- **Half Reset** (`half_board_reset`): clears the left or right half of the board based on the target column, including brain pieces.
- **Chaos** (`chaos_clear`): clears up to eight occupied cells near the target using controlled chaos, including brain pieces.

### Tier 4 Bombs

Tier 4 bombs are final-stage full-board effects. They can clear brain pieces.

- **Full Clear** (`full_board_clear`): clears the entire board, including brain pieces.
- **Max Burst** (`maximum_coffin_burst`): clears the entire board, including brain pieces, and awards a final-stage bonus.

## Current Progression System

- The coffin meter gains points from clears and bomb effects.
- The prototype has a 14-god unlock sequence:
  1. Imsety
  2. Hapy
  3. Duamutef
  4. Qebehsenuef
  5. Anubis
  6. Thoth
  7. Bastet
  8. Sekhmet
  9. Horus
  10. Isis
  11. Osiris
  12. Set
  13. Ra
  14. Amun-Ra
- Amun-Ra is the final god.
- Gods are grouped into four coffin tiers:
  - Tier 1: Small Coffin
  - Tier 2: Medium Coffin
  - Tier 3: Large Coffin
  - Tier 4: Maximum Coffin
- Tier-based coffin images update in the HUD as the current god tier changes.
- Each supported god unlock tries to add that god's bomb to the bomb stock.
- Bomb stock is capped at four bombs.
- Current meter requirements and scoring values are placeholder balance values.

## Current Audio

- Sound effects are generated at runtime with the Web Audio API.
- No external sound assets are required yet.
- **M** toggles generated sound effects between Sound: ON and Sound: OFF.
- Browsers may wait for Enter, Space, or another keyboard gesture before audio can start; the game safely retries audio resume on key presses.
- Final audio assets may replace these generated prototype sounds later.
- Background music is not implemented yet.

## Current Asset Locations

### Piece PNG Assets

Piece PNGs live in:

```text
docs/assets/images/pieces/
```

Required piece PNG filenames:

- `liver.png`
- `lung.png`
- `stomach.png`
- `intestine.png`
- `heart.png`
- `brain.png`

Recommended replacement guidelines:

- Use transparent backgrounds.
- Keep silhouettes readable at small board-cell size.
- Keep colors and shapes distinct.
- Keep the exact filenames above so the existing preload mapping continues to work.

### Coffin PNG Assets

Coffin PNGs live in:

```text
docs/assets/images/coffins/
```

Required coffin PNG filenames:

- `coffin_small.png`
- `coffin_medium.png`
- `coffin_large.png`
- `coffin_maximum.png`

The current prototype uses four tier-based coffin images, not one coffin image per god. Use transparent backgrounds for replacement coffin art.

## Known Limitations

- Sound effects are generated placeholders and are not final audio assets yet.
- No background music yet.
- No mobile controls yet.
- No save data yet.
- No high score persistence yet.
- No final god illustrations yet.
- No final ending sequence yet.
- Balance values are placeholder.
- Visual effects are still prototype-level.
- Current art is placeholder/prototype art and needs final polish.

## Recommended Next Priorities

1. Gameplay balance pass for scoring, coffin meter requirements, bomb strength, brain frequency, and chain value.
2. Mobile/touch controls.
3. Final sound effects, audio asset loading, and background music hooks.
4. Final god unlock presentation.
5. High score persistence.
6. Final art polish for pieces, coffins, board, HUD, bomb effects, and unlock effects.
