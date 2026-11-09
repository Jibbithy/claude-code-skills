# Research map

Every game-pm agent reads its row before writing anything, cites the note behind each key decision as a wikilink (e.g. `[[19 Bosses and Boss Fights]]`), and treats "(unverified)" claims as suggestions, not rules. Notes live in `$VAULT/Game Development/`. **The research library is optional:** if a listed note is not on disk, skip it and mark the decisions it would have backed `(judgment)`. Grow the library over time with the `## Adding research` steps below. Read a note's `## Key takeaways` and `## Checklist for agents` (if present) first; read the body when a decision depends on it.

| Who | Required reading |
|---|---|
| PM (intake, gates, specs) | [[20 Core Game Design Theory]], [[07 Theming a Game]], [[23 Reddit Synthesis - Dev Communities]], [[26 Production Pipeline]], [[33 Pitch and GDD Writing]] |
| game-market | [[37 Market Analysis and Steam Data]], [[27 QA Playtesting and Launch]], [[23 Reddit Synthesis - Dev Communities]], [[10 Engines - Other and Decision Guide]] |
| game-story | [[01 Story Structure and Plot]], [[02 MacGuffins Hooks and Stakes]], [[05 Writing Characters and Dialogue]], [[25 Storyboarding and Previs]], [[28 Horror and Tension Design]] |
| game-characters | [[04 Character Design]], [[05 Writing Characters and Dialogue]], [[24 Reddit Synthesis - Art Writing Design Communities]] |
| game-world | [[03 World Building]], [[06 Environmental Storytelling]], [[31 Reactive World and Progression]], [[08 Color Theory for Games]], [[32 Level and Encounter Design]], [[34 Procedural Generation]] |
| game-systems | [[20 Core Game Design Theory]], [[30 Combat and Build Systems]], [[17 Weapons and Items]], [[18 Game Balance]], [[22 UI UX and Game Feel]], [[31 Reactive World and Progression]], [[32 Level and Encounter Design]], [[35 Enemy AI Behavior]] |
| game-bestiary | [[19 Bosses and Boss Fights]], [[30 Combat and Build Systems]], [[18 Game Balance]], [[28 Horror and Tension Design]], [[35 Enemy AI Behavior]] |
| game-art | [[07 Theming a Game]], [[08 Color Theory for Games]], [[13 Sprites and Pixel Art]], [[14 2D Animation]], [[24 Reddit Synthesis - Art Writing Design Communities]], [[36 Aseprite Lua Scripting]] |
| game-continuity | All bible notes of the game being checked (no research notes required) |
| Builders (Phases 4-6, listed in every spec the PM writes) | [[09 Engines - Godot Unity Unreal]], [[12 Game Programming Fundamentals]], [[21 Audio and Music]], [[22 UI UX and Game Feel]], [[27 QA Playtesting and Launch]], [[29 Godot 4 Deep Dive]] |

## Adding research
When an agent researches something new: append a dated bullet to `Research Log and Coverage.md` under `## What was done`; if it is more than a few facts, save it as the next numbered note (`NN Title.md`, plain characters only) in the note format of `29 Godot 4 Deep Dive.md`, add it to `Game Development Hub.md`, and add it to the right row above. Search the folder first so you don't duplicate a note.
