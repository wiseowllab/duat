# Phase 1-B Prompt — Same-Type Clear, Gravity, Chain, Score

This repository is for DUAT, an ancient Egyptian falling puzzle game.

Before implementing, read:

- AGENTS.md
- docs/egypt_puzzle_GDD.html
- docs/duat_chatgpt_codex_workflow.html
- docs/prompts/phase1-a.md

## Goal

Implement Phase 1-B.

This phase adds the first real puzzle mechanics:

- same-type 4-connected clear
- gravity after clearing
- chain resolution
- basic score display

This phase should build on the Phase 1-A falling-puzzle prototype.

## Requirements

Implement:

- Detect connected groups of 4 or more pieces of the same type
- Clear those connected groups from the board
- Apply gravity after pieces are cleared
- Repeat clear detection after gravity to support chains
- Count chain number
- Add basic score calculation
- Update HUD with score and chain count
- Keep all existing Phase 1-A behavior working

## Piece Behavior In This Phase

Use these six piece types:

- liver
- lung
- stomach
- intestine
- heart
- brain

For Phase 1-B only, all six types may behave as normal pieces.

Special rules for heart and brain will be added later.

Do not implement wild-card behavior yet.

Do not implement obstacle behavior yet.

## Clear Rule

A group clears when:

- 4 or more pieces of the same type are connected
- Connection is orthogonal only
  - up
  - down
  - left
  - right
- Diagonal connection does not count

Use a flood-fill or breadth-first search approach.

## Gravity Rule

After clearing:

- Empty spaces should be filled by pieces above falling down
- Pieces fall vertically within their own column
- After gravity resolves, check for new matches again
- Repeat until no more matches exist

## Score Rule

Use a simple placeholder score system for now:

- 4-piece clear: 100 points
- Each additional piece in the same group: +25 points
- Chain multiplier: chain number x base score

Example:

- First clear: chain 1
- Second clear caused by gravity: chain 2
- Third clear caused by gravity: chain 3

This can be tuned later.

## Suggested Files

Create or update:

src/core/MatchResolver.js
src/core/GravitySystem.js
src/core/ScoreSystem.js
src/scenes/GameScene.js
src/ui/Hud.js

Keep logic separated from rendering as much as possible.

## Not Included In This Phase

Do not implement these yet:

- Canopic set clear
- Heart wild-card behavior
- Brain obstacle behavior
- Coffin meter
- God unlock system
- Bomb system
- BGM / SE
- Mobile touch controls
- Final animations
- Final art assets

## Regression Check

After implementation, verify:

- Pieces still fall
- Pieces still move left and right
- Pieces still rotate
- Pieces still lock into the board
- Game over still works
- Same-type groups of 4 or more clear
- Gravity works after clearing
- Chains can occur
- Score updates
- No console errors appear

## README

Update README.md with:

- Phase 1-B implemented features
- Basic scoring explanation
- Current controls
- Known limitations

## Completion Report

When finished, summarize:

1. What was implemented
2. What files were created or changed
3. How to run and test it
4. What should be implemented next
