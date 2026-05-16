# Phase 3 Prompt — Coffin Meter and God Unlock System

This repository is for DUAT, an ancient Egyptian falling puzzle game.

Before implementing, read:

- AGENTS.md
- docs/egypt_puzzle_GDD.html
- docs/duat_chatgpt_codex_workflow.html
- docs/prompts/phase1-a.md
- docs/prompts/phase1-b.md
- docs/prompts/phase2-canopus.md

## Goal

Implement the coffin meter and god unlock system.

This phase adds DUAT's progression loop:

- clearing pieces increases the coffin meter
- when the meter fills, a god is unlocked
- the current god advances to the next one
- the UI shows current tier, current god, coffin progress, and unlocked gods

Do not implement bomb effects yet.

## Background

DUAT uses a tiered coffin and god system.

The coffin meter works like an experience bar.

God unlock works like a level-up.

Coffin size and visual importance increase by tier.

## God Tiers

Use the following god progression data.

### Tier 1 — Small Coffin

Gods:

- Imsety
- Hapy
- Duamutef
- Qebehsenuef

Theme:

- Four Sons of Horus
- Canopic jar guardians
- Early-game unlocks
- Weak bomb tier later

### Tier 2 — Medium Coffin

Gods:

- Anubis
- Thoth
- Bastet
- Sekhmet

Theme:

- Death management
- Knowledge
- Protection
- War
- Brain-clearing bomb tier later

### Tier 3 — Large Coffin

Gods:

- Horus
- Isis
- Osiris
- Set

Theme:

- Core Egyptian mythology
- Strong board intervention later

### Tier 4 — Maximum Coffin

Gods:

- Ra
- Amun-Ra

Theme:

- Sun god
- King of gods
- Endgame unlock
- Ending trigger later

## Required Data File

Create:

- src/data/gods.js

Define each god with:

- id
- name
- tier
- tierName
- coffinSize
- requiredMeter
- futureBombType
- description

Example data shape:

    export const GODS = [
      {
        id: "imsety",
        name: "Imsety",
        tier: 1,
        tierName: "Small Coffin",
        coffinSize: "small",
        requiredMeter: 1000,
        futureBombType: "vertical_clear",
        description: "One of the Four Sons of Horus."
      }
    ];

Use placeholder requiredMeter values for now.

Suggested values:

- Tier 1 gods: 1000 each
- Tier 2 gods: 1500 each
- Tier 3 gods: 2200 each
- Tier 4 gods: 3000 each

These values can be tuned later.

## Coffin Meter

Create:

- src/core/CoffinMeter.js

The CoffinMeter should:

- track current god index
- track current meter value
- track required meter value
- add meter points when pieces clear
- detect when the meter becomes full
- unlock the current god
- advance to the next god
- carry over excess meter if appropriate
- provide current state to the HUD

Suggested methods:

- addPoints(amount)
- getCurrentGod()
- getCurrentTier()
- getProgress()
- getUnlockedGods()
- isComplete()
- advanceGod()

## Meter Gain Rule

Use placeholder values for now:

- Same-type clear: gain meter equal to 25% of score gained
- Canopic set clear: gain meter equal to 40% of score gained
- Chain bonus: already included in score, so meter can use final score value

If score event metadata is not yet available, use a simple conversion:

- meterGain = Math.floor(scoreGained * 0.25)

This can be tuned later.

## HUD Requirements

Update or create:

- src/ui/Hud.js

The HUD should display:

- current score
- current chain count
- current tier
- current god name
- coffin meter progress
- unlocked gods count
- simple unlock message

Placeholder UI is acceptable.

Examples:

- "Tier 2 — Anubis"
- "Coffin: 420 / 1500"
- "God Unlocked: Anubis"

## Visual Placeholder

Use simple UI elements only.

Do not implement final coffin art yet.

Use placeholder coffin labels:

- Small Coffin
- Medium Coffin
- Large Coffin
- Maximum Coffin

If a simple rectangle or vertical bar is easier, use that.

## Unlock Event

When a god unlocks:

- show a short text message
- add the god to unlocked gods
- advance to the next god
- keep the game running
- do not pause the game
- do not require player input

If all gods are unlocked:

- show "RA AWAKENED" or "DUAT COMPLETE"
- do not implement full ending yet

## Not Included In This Phase

Do not implement these yet:

- Actual bomb effects
- Final coffin images
- God illustrations
- Full-screen unlock animations
- Ending sequence
- Endless mode
- BGM / SE
- Mobile touch controls
- Final art assets

## Regression Check

After implementation, verify:

- Existing falling behavior still works
- Same-type clears still work
- Canopic set clears still work
- Score still updates
- Coffin meter increases after clears
- God unlock occurs when meter fills
- Current god advances correctly
- Tier display changes correctly
- No console errors appear

## README

Update README.md with:

- Coffin meter system
- God unlock system
- Current god tier progression
- Known limitations
- Next planned feature: bomb system

## Completion Report

When finished, summarize:

1. What was implemented
2. What files were created or changed
3. How to run and test it
4. What should be implemented next
