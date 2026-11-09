#!/usr/bin/env bash
# Every skill and agent must have frontmatter whose name matches its folder or
# file, and a non-empty description. Exit 0 only if all pass.
set -u
cd "$(dirname "$0")/.."
fail=0

field() { awk -v k="$2" '/^---$/{n++; next} n==1 && $0 ~ "^"k":" {sub("^"k":[ ]*",""); print; exit}' "$1"; }

check() {
  local file="$1" want="$2"
  local name desc
  name=$(field "$file" name)
  desc=$(field "$file" description)
  if [ "$name" != "$want" ]; then
    echo "FAIL $file: name is '$name', expected '$want'"; fail=1
  elif [ -z "$desc" ]; then
    echo "FAIL $file: empty description"; fail=1
  else
    echo "PASS $file"
  fi
}

for d in skills/*/; do
  d="${d%/}"
  check "$d/SKILL.md" "$(basename "$d")"
done
for a in agents/*.md; do
  check "$a" "$(basename "$a" .md)"
done

[ "$fail" = 0 ] && echo "ALL PASS" || echo "SOME FAILED"
exit "$fail"
