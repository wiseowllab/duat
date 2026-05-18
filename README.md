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

To test on a phone or tablet, run the same server on your development machine, make sure the phone is on the same network, then open `http://<your-computer-LAN-IP>:8000/docs/` in the mobile browser. You can also use browser devtools device emulation or a narrow desktop viewport for a quick layout check.

## Current Playable State

DUAT is currently a single-scene falling puzzle prototype with a basic title, pause, and game-over flow plus these implemented systems:

### Game Flow

- The page opens on a **DUAT** title screen before pieces begin falling.
- **Enter**, **Space**, or tapping the title prompt starts a fresh game from the title screen.
- **H** opens the title-screen Japanese paged **遊び方** overlay. **Left/Right** or **A/D** changes pages, **Enter** or **Space** advances to the next page, and **Esc** closes it back to the title screen without starting gameplay.
- **Enter** pauses active gameplay when no bomb is selected; **P** remains an optional pause shortcut. Falling, movement, rotation, hard drop, bomb selection, and debug controls are disabled while paused.
- **Enter**, **Space**, or tapping the pause overlay resumes from pause.
- Game over shows Japanese labels for final score, saved best score, run max chain, run god unlock count, and a restart prompt. **Enter**, **Space**, or tapping the restart prompt restarts with the board, score, chain, coffin meter, god progression, bomb stock, active pair, next pair, overlays, and debug mode reset while preserving local high score records. **R** remains an optional game-over restart shortcut.

### Board and Falling Pair

- 6 columns x 12 rows playfield.
- Falling two-piece pairs.
- Random next-pair generation.
- NEXT piece preview.
- Wider desktop HUD layout with separated score, saved best score, NEXT, current coffin, and bomb stock panels.
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
- Japanese score, chain, and browser-local high score display labels.

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
- Tier-based coffin PNGs for the HUD, displayed prominently in the current coffin panel so tier changes are easier to see.
- Debug mode for testing meter progress, god unlocks, coffin tier changes, bomb stock, and reset behavior.


## Balance Tuning

Prototype balance values are centralized in `docs/src/data/balance.js`. The current numbers are first-pass prototype tuning values, not final production balance, and are safe to adjust during future playtest passes.

Major tunable categories include:

- Piece weights for liver, lung, stomach, intestine, heart, and brain generation frequency.
- Fall speed values for normal falling, soft drop, and lock delay.
- Scoring values for same-type clears, canopic sets, adjacent brain bonuses, and bombs.
- Coffin meter gain ratios and required meter values by god tier.
- Danger BGM enter/exit row thresholds.
- Bomb stock capacity.

To tune piece frequency later, adjust the relative `PIECE_WEIGHTS` numbers: higher weights appear more often, while lower weights appear less often. To tune coffin meter speed, adjust `COFFIN_METER.requiredByTier` for unlock thresholds or the meter gain ratios for same-type, canopic, and bomb scoring.

## Current Desktop Layout

The desktop Phaser canvas is wider than the 6x12 board so the gameplay area and HUD do not compete for the same narrow sidebar. The board remains unchanged, while the HUD is split into readable sandstone-style panels for score/chain/level/sound, NEXT preview, current coffin progress, and bomb stock. The current coffin panel uses the existing tier-based coffin PNGs at a larger display size so Tier 1-4 changes are visibly distinct.

## Current Controls

Keyboard controls still work on desktop and on mobile devices with hardware keyboards. The prototype also includes a responsive, mobile-first touch control panel. The narrow-screen layout has been adjusted so the scaled canvas, HUD, and controls fit more comfortably above the fold on phones, but the mobile UI is still prototype-level and keeps the existing 6x12 board and HUD rather than redesigning the whole screen.

### Title Screen

- **Enter / Space**: start the game. Pieces do not spawn or fall until one of these keys is pressed.
- **H**: open the in-game Japanese paged **遊び方** overlay. It summarizes basic matching, canopic sets, heart substitution, brain obstacle rules, coffin meter/god unlocks, bombs, and keyboard controls across three pages.
- **Left / Right** or **A / D**: move between **遊び方** pages while the overlay is open.
- **Enter / Space**: advance to the next **遊び方** page while the overlay is open.
- **Esc**: close the **遊び方** overlay and return to the title screen.
- **Tap the title start prompt**: start the game and unlock/resume browser audio for SFX and BGM.
- **Tap the 遊び方 prompt**: open the title-screen tutorial overlay; use **前へ**, **次へ**, and **閉じる** in the overlay to navigate or return.

### Normal Play

- **Left / Right**: move the active pair horizontally.
- **Down**: soft drop.
- **Up / Z**: rotate the active pair.
- **Space**: hard drop when no bomb is selected.
- **Enter**: pause gameplay when no bomb is selected.
- **P**: optional pause shortcut.
- **M**: toggle BGM and generated sound effects on/off.
- **Space** does not pause during normal gameplay.

### Paused

- **Enter / Space**: resume gameplay.
- **Tap the pause overlay**: resume gameplay.
- **Esc**: also resumes gameplay.
- **P**: optional resume shortcut.
- **M**: toggle BGM and generated sound effects on/off. Movement, rotation, dropping, bomb selection, and debug inputs are ignored while paused.

### Game Over

- **Enter / Space**: restart after game over.
- **Tap the restart prompt/panel**: restart after game over.
- **R**: optional restart shortcut.
- **M**: toggle BGM and generated sound effects on/off.

### Bomb Controls

- **1-4**: select and preview a bomb slot.
- **Same number again**: use the selected bomb.
- **Different number**: switch selected bomb slot.
- **Enter / Space**: use the selected bomb when a bomb is selected.
- **Esc**: cancel bomb selection.
- When a bomb is selected, **Space** confirms the bomb instead of hard dropping.

Bombs target the current active pair position. The preview shows the bomb's affected area before confirmation.

### Mobile Touch Controls

The touch controls appear on touch devices and narrow viewports below the game canvas. On narrow screens they are arranged as a compact two-row panel: ESC, ポーズ, B1-B4 on the first row, and arrow buttons, 回転, 落下 on the second row. They use the same game actions as the keyboard controls:

- **← / →**: move the active pair horizontally.
- **↓**: hold for soft drop; tapping/pressing also steps the pair down once when possible.
- **回転**: rotate the active pair.
- **落下**: hard drop when no bomb is selected; confirm/use the selected bomb when a bomb is selected.
- **B1-B4**: select and preview bomb slots 1-4. Tap the same bomb button again to confirm/use it; tap a different bomb button to switch selection.
- **ESC**: cancel the current bomb selection; while paused, it resumes just like the keyboard Esc behavior.
- **ポーズ**: pause active gameplay or resume from pause.

The page uses responsive CSS, canvas scaling, compact touch-control rows, and `touch-action: none` on the game/touch-control areas to reduce accidental browser scrolling during play. This is a prototype mobile layout, so button placement and sizing are functional placeholders rather than final mobile UI art.

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

## Local High Scores

- High score records are saved locally in the browser with `localStorage` under the DUAT high score data key.
- Saved values include:
  - High score.
  - Max chain.
  - Max coffin tier reached.
  - Max gods unlocked.
  - Best run date metadata.
- Records are local to the current browser profile and device; they do not sync between browsers, devices, or private browsing sessions.
- Clearing browser site data/storage for DUAT resets these records.
- Restarting after game over and debug progression resets do not erase high score records.

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
- Tier-based coffin images update in the prominent current coffin panel as the current god tier changes.
- Each supported god unlock tries to add that god's bomb to the bomb stock.
- Bomb stock is capped at four bombs.
- Current meter requirements and scoring values are placeholder balance values.

## Current Audio

- Sound effects are generated at runtime with the Web Audio API and are intentionally mixed well above the music. The MP3 BGM is kept low as background ambience so gameplay SFX stay clear.
- Background music uses external MP3 files loaded from `docs/assets/audio/bgm/`.
- The prototype expects exactly these eight BGM filenames:
  - `bgm_tier1_normal.mp3`
  - `bgm_tier1_danger.mp3`
  - `bgm_tier2_normal.mp3`
  - `bgm_tier2_danger.mp3`
  - `bgm_tier3_normal.mp3`
  - `bgm_tier3_danger.mp3`
  - `bgm_tier4_normal.mp3`
  - `bgm_tier4_danger.mp3`
- BGM starts only after the title screen is started with a keyboard or touch gesture; browsers generally require user interaction before audio playback can begin.
- During gameplay, the current coffin/god tier selects Tier 1-4 BGM. If all gods are unlocked or DUAT is complete, Tier 4 BGM is used.
- Each tier has a normal loop and a danger/up-tempo loop. Danger music begins when any locked board piece reaches row 3 or above, where row 0 is the top row.
- Danger music returns to normal only after the highest locked piece is below row 5, preventing rapid switching around the danger line.
- Only locked board cells affect danger music; the currently falling pair is ignored.
- BGM default volume is intentionally low relative to SFX, and pause fades the current BGM even lower. Resume fades it back up, game over fades/stops it, and restart starts the correct current Tier 1 normal loop.
- Major SFX events briefly duck the current BGM so clears, canopic sets, bomb use, god unlocks, and game-over cues stand out before the music returns to its current gameplay or paused level.
- **M** toggles both generated sound effects and BGM between サウンド: ON and サウンド: OFF. Unmuting during gameplay restores the correct tier/danger BGM.

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

## Troubleshooting

### BGM

- If BGM does not play, confirm the MP3 files in `docs/assets/audio/bgm/` use the exact expected filenames listed in the Current Audio section. The preload keys are derived from those names.
- If BGM switching fails because an audio asset is missing, invalid, destroyed, or rejected by the browser/Phaser sound system, gameplay should continue. Check the browser console for a `BGM ... failed; gameplay will continue.` warning.
- **M** toggles both generated sound effects and BGM. If the HUD shows `サウンド: OFF`, press **M** again to unmute both SFX and BGM.

## Known Limitations

- Sound effects are generated placeholders and are not final audio assets yet.
- BGM requires the eight expected external MP3 files to be present in `docs/assets/audio/bgm/`.
- Mobile controls are implemented, but their layout and art are still prototype-level.
- No cloud save data yet.
- High scores are browser/device local only.
- No final god illustrations yet.
- No final ending sequence yet.
- Balance values are placeholder.
- Visual effects are still prototype-level.
- Current art is placeholder/prototype art and needs final polish.

## Recommended Next Priorities

1. Gameplay balance pass for scoring, coffin meter requirements, bomb strength, brain frequency, and chain value.
2. Mobile/touch control polish and final mobile UI art.
3. Final sound effects and final BGM mix pass.
4. Final god unlock presentation.
5. Final art polish for pieces, coffins, board, HUD, bomb effects, and unlock effects.
