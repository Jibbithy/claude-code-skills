#!/usr/bin/env bash
# Install this repo's skills and agents into ~/.claude (or $CLAUDE_DIR).
# Existing files are left alone unless you pass --force.
set -euo pipefail
DEST="${CLAUDE_DIR:-$HOME/.claude}"
HERE="$(cd "$(dirname "$0")" && pwd)"
FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

copy() {
  local src="$1" dst="$2"
  if [ -e "$dst" ] && [ "$FORCE" = 0 ]; then
    echo "skip (already exists): $dst   rerun with --force to overwrite"
    return
  fi
  mkdir -p "$(dirname "$dst")"
  rm -rf "$dst"
  cp -R "$src" "$dst"
  echo "installed: $dst"
}

for s in "$HERE"/skills/*/; do
  s="${s%/}"
  copy "$s" "$DEST/skills/$(basename "$s")"
done
if [ -d "$HERE/agents" ]; then
  for a in "$HERE"/agents/*.md; do
    copy "$a" "$DEST/agents/$(basename "$a")"
  done
fi
echo "Done. Restart Claude Code so it picks up the new skills."
