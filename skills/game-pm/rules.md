# Rules (hard laws for the PM and every game-pm agent)

## Process
1. **Only the PM talks to the user.** Agents never ask questions (a subagent that waits on the user deadlocks). If you need a decision, write it under `## Open decisions` in your note and return.
2. **Return only the contract.** Your final message is the `STATUS:` block your agent file defines. Full output goes to disk.
3. **Cite research.** Every key decision in a bible note ends with the research note that backs it, e.g. `([[19 Bosses and Boss Fights]])`. A decision with no backing says `(judgment)`.
4. **Never invent facts about real games or markets.** Numbers about other games carry their source and date. Estimates are labelled estimates.
5. **No placeholder output.** If a script or tool fails, report the error. Never fake art, data or results.
5a. **Verify before you write.** Never copy a number, id or count from a review, another bible note or the PM's prompt without checking it against the source: the code and data in backfill, the pitch or the owning note otherwise. If you cannot verify it, say so in the note.
5b. **Sibling notes.** If a sibling note is on disk, adopt its names, ids and premise, and never invent rival ones; disagree under `## Open decisions` instead. The bible notes are `[[03 Story]]`, `[[04 Characters]]`, `[[05 World]]`, `[[06 Gameplay and Systems]]`, `[[07 Enemies and Bosses]]` and `[[08 Art Direction]]`. Link them by those names, and never write that one "does not exist yet". If you need a fact another note owns and it is not on disk, write your best version and mark it `(check against [[NN Title]])`.
5c. **Use `HUB_LINK` verbatim** on your note's `> Hub:` line, and link the game hub with it everywhere. Never use a bare `[[<Game>]]` when HUB_LINK is a path form.

## Vault
6. Plain markdown, no YAML frontmatter. `# Title`, then `> Hub: [[...]]`, then `**Key:** value` lines.
7. Never edit `.obsidian/`. Never rename or move existing notes. Straight apostrophes only in `[[link]]` targets.
8. In backfill mode, never edit the game's existing project notes; link to them.

## Code and repos
9. **Never push, never deploy.** Commit only to a local branch, and only when the PM's build phase says to.
10. Pushes happen only after the user approves them, to the remote and account the user names.
11. Backfill is read-only on the repo. Read the snapshot the PM gives you, never the live checkout.
12. **Code beats vault.** When the vault and the code disagree, the code is what is built; report the mismatch, don't "fix" either.
13. Any scratch Godot script that builds the game's main scene must point saves at a test folder first (for example `user://test_saves/`), or it overwrites the user's real save.
14. A build phase is not done until the project's full test suite passes and the output has been read.

## Godot
15. Show game work in the Godot **editor**, not only a running window: generated scenes are `@tool` and draw their preview in `_draw()`; every helper script they call is `@tool` too; guard `_process` with `Engine.is_editor_hint()`; never paint generated tiles into a layer the editor will save.
16. For transposed `draw_texture_rect_region`, swap the destination rect's size (the canvas server swaps it back).
17. After any sprite-sheet change, run `godot --headless --path <repo> --import`.
18. Use TileMapLayer, not TileMap; `y_sort_enabled`, not YSort nodes (see `[[29 Godot 4 Deep Dive]]`).

## Pixel art and animation (from the user's review feedback)
19. Limbs stay visibly attached and keep their original thickness and colours; arm parts never slide more than about 4.5 px off the shoulder.
20. The hand closes over the grip: the arm draws above the weapon. Weapons never shrink mid-swing.
21. Only the part that attacks moves; gear painted on the sprite never vanishes during an attack.
22. Guns: rifles shouldered and up for the whole animation, pistols at arm's length, shots leave from the barrel tip.
23. Thrown items come from where they live (hip flask), arc, and land at the cursor.
24. Don't rotate thin pixel art more than about 35 degrees with nearest-neighbour; translate instead, at integer scale.
25. Idle is calm (about a 1 px breath), never flailing.
26. Lock one pixel density, one palette and one style guide before drawing more art (`[[13 Sprites and Pixel Art]]`).
