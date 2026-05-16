# Phase 1-A Prompt — Basic Falling Puzzle Prototype

This repository is for DUAT, an ancient Egyptian falling puzzle game.

Before implementing, read:

- AGENTS.md
- docs/egypt_puzzle_GDD.html
- docs/duat_chatgpt_codex_workflow.html

## Goal

Implement Phase 1-A: the basic falling puzzle prototype.

This phase should focus only on the core falling-puzzle behavior.

Do not implement clearing rules yet.

## Requirements

Use Phaser.js and JavaScript.

Create or update the project so that it runs as a browser game.

Implement:

- 6 columns x 12 rows grid
- Falling two-piece pair
- Random piece generation
- NEXT piece preview
- Left and right movement
- Soft drop
- 4-direction rotation
- Piece landing
- Piece locking into the board
- Game over detection
- Placeholder colored blocks for pieces
- Simple HUD showing score placeholder, level placeholder, and NEXT

## Piece Types

Use these six piece types as placeholders:

- liver
- lung
- stomach
- intestine
- heart
- brain

For now, all pieces can behave the same.

Use simple colors or placeholder shapes.

Do not use final image assets yet.

## Controls

Keyboard controls:

- Left arrow: move left
- Right arrow: move right
- Down arrow: soft drop
- Up arrow or Z: rotate
- Space: hard drop if easy to implement, otherwise leave for later

## Not Included In This Phase

Do not implement these yet:

- Same-type 4-connected clear
- Canopic set clear
- Heart wild-card behavior
- Brain obstacle behavior
- Coffin meter
- God unlock system
- Bomb system
- Chain scoring
- BGM / SE
- Mobile touch controls
- Final animations
- Final art assets

## Suggested File Structure

Prefer this structure if starting from a simple project:

src/
  main.js
  scenes/
    GameScene.js
  core/
    Board.js
    Piece.js
    GravitySystem.js
  data/
    constants.js
    pieces.js
  ui/
    Hud.js

docs/
  index.html

## GitHub Pages

Prepare the project so that it can eventually be published through GitHub Pages.

If needed, create a simple docs/index.html for GitHub Pages.

However, do not overcomplicate deployment in this phase.

## README

Update README.md with:

- What DUAT is
- How to run the project locally
- What Phase 1-A implements
- What remains for later phases

## Completion Report

When finished, summarize:

1. What was implemented
2. What files were created or changed
3. How to run and test it
4. What should be implemented next
