#!/bin/bash
# Structural checks for the game-pm skill. Exit 0 only if every check passes.
SK="${SK:-$HOME/.claude/skills/game-pm}"
AG="${AG:-$HOME/.claude/agents}"
GD="${GD:-${NOTES_VAULT:-$HOME/Notes}/Game Development}"
fail=0
ok()  { echo "PASS $1"; }
bad() { echo "FAIL $1"; fail=1; }

for f in SKILL.md research-map.md toolbox.md rules.md \
         templates/status.md templates/bible-note.md templates/gate.md \
         tests/description-trigger-eval.md; do
  [ -f "$SK/$f" ] && ok "$f exists" || bad "$f missing"
done

grep -q '^name: game-pm$' "$SK/SKILL.md" 2>/dev/null && ok "SKILL.md name" || bad "SKILL.md name must be game-pm"

for a in market story characters world systems bestiary art continuity; do
  f="$AG/game-$a.md"
  if [ ! -f "$f" ]; then bad "game-$a.md missing"; continue; fi
  fm=$(awk '/^---$/{n++; next} n==1' "$f")
  echo "$fm" | grep -q "^name: game-$a$" && ok "game-$a name" || bad "game-$a name must be game-$a"
  echo "$fm" | grep -q 'Spawned by the game-pm skill\.' && ok "game-$a description" || bad "game-$a description must end 'Spawned by the game-pm skill.'"
  echo "$fm" | grep -q '^tools:' && bad "game-$a has a tools: line (must inherit all tools)" || ok "game-$a inherits all tools"
  for r in research-map.md toolbox.md rules.md; do
    grep -q "$r" "$f" && ok "game-$a reads $r" || bad "game-$a never mentions $r"
  done
  grep -q '^STATUS:' "$f" && ok "game-$a return contract" || bad "game-$a has no STATUS: return contract"
done

if [ -f "$SK/research-map.md" ]; then
  while read -r n; do
    [ -f "$GD/$n.md" ] && ok "note [[${n}]] exists" || echo "WARN note [[${n}]] not in $GD (optional research library)"
  done < <(grep -o '\[\[[^]]*\]\]' "$SK/research-map.md" | sed 's/^\[\[//; s/\]\]$//' | sort -u)
fi

# Lessons from the 2026-10-19 Part C run
chk() { grep -qE "$2" "$SK/$1" && ok "$3" || bad "$3"; }
chk SKILL.md 'HUB_LINK' "SKILL passes HUB_LINK to agents"
chk SKILL.md '[Ww]ave 1' "SKILL revises in two waves"
chk SKILL.md 'Snapshot:' "SKILL records the backfill snapshot commit"
chk SKILL.md 'for-each-ref' "SKILL asks which branch is current in backfill"
chk SKILL.md 'at most 10 rows' "SKILL caps gate rows"
chk rules.md 'does not exist yet' "rules forbid 'does not exist yet' claims"
chk rules.md 'Verify before you write' "rules require verifying copied numbers"
chk rules.md 'HUB_LINK' "rules make agents use HUB_LINK"
chk templates/status.md 'Snapshot:' "status template has Snapshot line"
chk templates/status.md 'Backfill' "status template has a Backfill phase value"
chk SKILL.md "Wave A" "SKILL writes the bible in waves (spine first)"
chk rules.md "adopt its names" "rules make agents adopt sibling names"
grep -q "Verdict rubric" "$AG/game-market.md" && ok "market has a verdict rubric" || bad "market has a verdict rubric"
chk templates/gate.md 'your call' "gate template handles no-recommendation rows"

[ "$fail" = 0 ] && echo "ALL PASS" || echo "SOME FAILED"
exit "$fail"
