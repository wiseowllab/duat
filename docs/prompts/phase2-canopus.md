# Phase 2 Prompt — Canopic Set Clear

This repository is for DUAT, an ancient Egyptian falling puzzle game.

Before implementing, read:

- AGENTS.md
- docs/egypt_puzzle_GDD.html
- docs/duat_chatgpt_codex_workflow.html
- docs/prompts/phase1-a.md
- docs/prompts/phase1-b.md

## Goal

Implement Phase 2: Canopic Set Clear.

This phase adds DUAT's unique puzzle mechanic.

In addition to same-type 4-connected clear, the game should detect and clear a canopic set when the four normal organ types are included in one connected group.

## Background

DUAT has six piece types:

- liver
- lung
- stomach
- intestine
- heart
- brain

The four normal canopic organ pieces are:

- liver
- lung
- stomach
- intestine

A canopic set is complete when these four organ types appear together in a valid connected group.

## Requirements

Create or update:

- src/core/CanopusResolver.js
- src/core/MatchResolver.js if needed
- src/core/ScoreSystem.js
- src/scenes/GameScene.js
- src/ui/Hud.js if needed

Implement:

- Detection of canopic sets
- Clearing of canopic set pieces
- Higher score for canopic set clears
- HUD feedback for canopic set clears
- Compatibility with existing same-type clears
- Compatibility with gravity and chain resolution

## Canopic Set Rule

A canopic set clears when:

- A connected group contains all four normal organ types:
  - liver
  - lung
  - stomach
  - intestine
- The group must be orthogonally connected
  - up
  - down
  - left
  - right
- Diagonal-only connection does not count
- The group can be any shape
- The group can contain more than four pieces
- The group must contain at least one of each required organ type

Example valid group:

- liver connected to lung
- lung connected to stomach
- stomach connected to intestine

If all four organ types are in the connected component, clear that component.

## Heart Behavior In This Phase

Implement basic heart wild-card behavior for canopic sets only.

Heart can substitute for one missing normal organ type in a canopic set.

Example:

- liver
- lung
- stomach
- heart

This can count as a canopic set because heart substitutes for intestine.

Rules:

- Heart can substitute for only one missing organ type per set.
- Heart should be included in the cleared group if it is used as a substitute.
- Heart wild-card behavior for same-type 4-connected clear can remain unimplemented for now unless it is already easy to support cleanly.

## Brain Behavior In This Phase

Brain does not participate in canopic sets.

Rules:

- brain cannot count as any required organ type
- brain cannot be used as a connector for a canopic set
- brain should not be cleared by canopic set detection unless a later task explicitly adds adjacent-brain clearing

Brain obstacle behavior will be refined in a later phase.

## Interaction With Same-Type Clear

If same-type clear and canopic set clear happen at the same time:

- Resolve both as part of the same clear cycle
- Avoid double-counting the exact same cell twice
- Apply a bonus score if both clear types occur in the same cycle

Use a clean data structure for clear results, such as:

- cellsToClear
- clearTypes
- scoreEvents

## Score Rule

Use placeholder values for now:

- Same-type clear: keep the Phase 1-B score rule
- Canopic set clear: 500 points
- Each extra piece in the canopic group: +50 points
- Same-cycle bonus when both same-type clear and canopic set clear occur: x2
- Chain multiplier should still apply

These values can be tuned later.

## HUD Feedback

Add simple placeholder feedback when a canopic set clears.

Examples:

- Text flash: "CANOPIC SET!"
- Small score popup
- Console log is acceptable only as a fallback

Do not implement final animations yet.

## Not Included In This Phase

Do not implement these yet:

- Coffin meter
- God unlock system
- Bomb system
- Full heart same-type wild-card behavior
- Full brain obstacle behavior
- Adjacent brain clearing
- BGM / SE
- Mobile touch controls
- Final animations
- Final art assets

## Regression Check

After implementation, verify:

- Existing falling behavior still works
- Same-type 4-connected clear still works
- Gravity still works after clearing
- Chain resolution still works
- Canopic set clears when liver/lung/stomach/intestine are connected
- Heart can substitute for one missing organ in a canopic set
- Brain does not participate in canopic set detection
- Score updates correctly
- No duplicate clearing errors occur
- No console errors appear

## README

Update README.md with:

- Phase 2 implemented features
- Canopic set clear rule
- Heart wild-card note
- Brain limitation note
- Known limitations

## Completion Report

When finished, summarize:

1. What was implemented
2. What files were created or changed
3. How to run and test it
4. What should be implemented next
