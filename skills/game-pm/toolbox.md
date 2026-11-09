# Toolbox

Agents inherit every tool, skill and MCP server in the session. These are the exact commands for the game tools.

## Aseprite (pixel art, concept sheets, sprite sheets)
- Binary (not on PATH): `/Applications/Aseprite.app/Contents/MacOS/aseprite`
- Batch run: `/Applications/Aseprite.app/Contents/MacOS/aseprite -b --script <file.lua>`
- With parameters: `... -b --script-param key=value --script <file.lua>` (read with `app.params.key`)
- API reference and a tested starter script: `[[36 Aseprite Lua Scripting]]`.
- Start every script with strict globals (reads AND assignments) so a typo errors instead of silently being nil or a new global. With this in place every variable and function must be declared `local` (a bare `function f()` is a global assignment and will error):
  `setmetatable(_G, {__index=function(_,k) error("undefined global "..tostring(k), 2) end, __newindex=function(_,k) error("assignment to undeclared global "..tostring(k), 2) end})`
- Judge a run by the exit code (0 ok, 255 script error) and a printed marker such as the output path. Errors go to stdout, and some extensions (PixelLab, for one) print harmless error lines on every batch run.
- Seed randomness (`math.randomseed(<fixed>)`) so a re-run gives the same art.
- After changing a sheet a Godot project imports: `godot --headless --path <repo> --import`.
- Look at what you made: Read the PNG. Use a new filename per revision; image viewers cache.

## Godot 4.7.2
- Binary: `/opt/homebrew/bin/godot` (symlink to `/Applications/Godot.app/Contents/MacOS/Godot`)
- Headless script: `godot --headless --path <repo> -s <script.gd>`; parse-check only: add `--check-only`
- Run a scene for the user: `nohup godot --path <repo> res://scenes/<x>.tscn > <log> 2>&1 & disown`
- Show work in the editor: never quit an editor or app you did not start. If an editor is already open on that project, tell the PM so the user can reopen the scene; launch only when none is open: `godot --editor --path <repo> res://scenes/<x>.tscn` in the background. Never open a second `--editor` on the same project.
- Docs: context7 (`resolve-library-id` "godot", then `query-docs`), and `[[29 Godot 4 Deep Dive]]`.

## godot-mcp (MCP server `godot`)
- Tools: `launch_editor`, `run_project`, `stop_project`, `get_debug_output`, `connect_remote_debugger`, `get_remote_debug_output`, `capture_screenshot`, `create_scene`, `add_node`, `load_sprite`, `save_scene`, `get_project_info`, `get_godot_version`, `get_uid`, `update_project_uids`.
- Use it to run a project and read errors/prints, and to grab screenshots for gate reviews. If it is missing from the session, fall back to the CLI above and say so in your summary.

## Research
- WebSearch / WebFetch. The quota is shared across agents: budget your searches (about 15 per agent run) and stop early when the answer is solid.
- Reddit: only through the `reddit-research` skill (Arctic Shift archive). Direct reddit.com is blocked. Serial calls, 3-5 s apart; `title=` searches only in year-sized windows.
- Steam data: store.steampowered.com, steamdb.info, gamalytic.com, vginsights.com (see `[[37 Market Analysis and Steam Data]]`).

## Vault
- Root: `$VAULT`, set in SKILL.md from `NOTES_VAULT` (default `~/Notes`; quote it). Game folders: `Game Development/<Game>/`.
- Search before creating: `grep -rl TERM "$VAULT" --exclude-dir=.obsidian`
