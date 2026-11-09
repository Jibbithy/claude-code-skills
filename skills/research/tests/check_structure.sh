#!/bin/bash
# Structural checks for the research skill. Exit 0 only if every check passes.
SK="${SK:-$HOME/.claude/skills/research}"
AG="${AG:-$HOME/.claude/agents}"
fail=0
ok()  { echo "PASS $1"; }
bad() { echo "FAIL $1"; fail=1; }

for f in SKILL.md rules.md toolbox.md templates/status.md templates/brief.md; do
  [ -f "$SK/$f" ] && ok "$f exists" || bad "$f missing"
done
grep -q '^name: research$' "$SK/SKILL.md" && ok "SKILL name" || bad "SKILL name must be research"

for a in facts checker reddit github reporter; do
  f="$AG/research-$a.md"
  [ -f "$f" ] || { bad "research-$a.md missing"; continue; }
  fm=$(awk '/^---$/{n++; next} n==1' "$f")
  echo "$fm" | grep -q "^name: research-$a$" && ok "research-$a name" || bad "research-$a name"
  echo "$fm" | grep -q 'Spawned by the research skill\.' && ok "research-$a description" || bad "research-$a description"
  echo "$fm" | grep -q '^tools:' && bad "research-$a has tools: (must inherit)" || ok "research-$a inherits tools"
  grep -q 'rules.md' "$f" && ok "research-$a reads rules.md" || bad "research-$a never reads rules.md"
  grep -q 'STATUS:' "$f" && ok "research-$a return contract" || bad "research-$a no STATUS contract"
  # every agent the skill spawns must exist, and vice versa
  grep -q "research-$a" "$SK/SKILL.md" && ok "SKILL spawns research-$a" || bad "SKILL never spawns research-$a"
done

chk() { grep -qE "$2" "$SK/$1" && ok "$3" || bad "$3"; }
chk SKILL.md 'One gate: after Phase 1' "single gate after Phase 1"
chk SKILL.md 'At most one revise loop' "fact-check loop is capped"
chk SKILL.md 'Research Hub.md' "final report is logged in Research Hub"
chk SKILL.md 'Show it here' "final summary shown in chat"
chk rules.md 'Cite only pages you opened' "rules forbid citing snippets"
chk rules.md 'Trace to the original' "rules trace stats to the original"
chk rules.md 'Arctic Shift' "rules route Reddit through Arctic Shift"
chk rules.md 'read-only' "rules keep GitHub read-only"
for m in facts revise community final; do
  grep -q "MODE=$m" "$AG/research-reporter.md" && ok "reporter MODE=$m" || bad "reporter MODE=$m"
done
[ "$fail" = 0 ] && echo "ALL PASS" || echo "SOME FAILED"
exit "$fail"
