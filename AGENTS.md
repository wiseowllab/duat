# AGENTS.md

## Project Overview

This repository is for DUAT, a browser-based falling puzzle game inspired by ancient Egyptian funerary rituals, the Book of the Dead, canopic jars, mummification, and the revival of gods.

The main design document is:

- docs/egypt_puzzle_GDD.html

Always treat this GDD as the primary source of truth for game design decisions.

## Development Role

You are helping implement DUAT as a playable web game.

Priorities:

1. Make the game playable first.
2. Keep the code simple and readable.
3. Separate game logic from rendering as much as practical.
4. Make it easy to replace placeholder blocks with image assets later.
5. Make it easy to add animations, sound effects, and god-unlock effects later.

## Tech Stack

Use:

- JavaScript
- Phaser.js
- Browser-based web game
- GitHub Pages deployment from docs/

Do not introduce a large framework unless specifically requested.

## Initial Game Scope

The first playable prototype should include:

- 6 columns x 12 rows grid
- Falling two-piece pair
- Left and right movement
- Soft drop
- 4-direction rotation
- Piece landing and locking
- NEXT piece preview
- Game over detection
- Same-type 4-connected clear
- Gravity after clearing
- Chain resolution
- Basic score display

Use simple colored blocks or placeholder shapes first.

## Piece Types

DUAT uses six piece types:

- liver
- lung
- stomach
- intestine
- heart
- brain

Initial implementation may treat all pieces as normal colored blocks.

Later rules:

- liver, lung, stomach, and intestine are normal organ pieces.
- heart is a wild card.
- brain is an obstacle piece and should not be cleared by normal same-type matching.

## Mechanics To Add Later

Do not implement these unless the task specifically asks for them:

- Canopic set clear
- Heart wild-card behavior
- Brain special behavior
- Coffin meter
- God unlock system
- Bomb system
- Endless mode
- BGM / SE
- Mobile touch controls
- Final art assets
- Final animations

## File Organization

Prefer this structure:

src/
  main.js
  scenes/
    GameScene.js
  core/
    Board.js
    Piece.js
    GravitySystem.js
    MatchResolver.js
    CanopusResolver.js
    ScoreSystem.js
  data/
    constants.js
    pieces.js
    gods.js
  ui/
    Hud.js

assets/
  images/
  audio/

docs/
  index.html
  egypt_puzzle_GDD.html
  duat_chatgpt_codex_workflow.html
  prompts/
    phase1-a.md
    phase1-b.md
    phase2-canopus.md

## Coding Guidelines

- Keep functions small and named clearly.
- Avoid mixing board logic directly into rendering code.
- Avoid hard-coding magic numbers when constants can be used.
- Add comments only where the logic is not obvious.
- Prefer readable implementation over clever implementation.
- Do not rewrite the entire project unless asked.
- Make small, focused changes per task.

## Verification

After changes, check that:

- The game runs in the browser.
- Existing movement still works.
- No console errors appear.
- The README explains how to run the project.
- GitHub Pages deployment is not broken.

## Communication

When finishing a task, summarize:

1. What was implemented
2. What files changed
3. How to run or test it
4. What remains for the next phase
