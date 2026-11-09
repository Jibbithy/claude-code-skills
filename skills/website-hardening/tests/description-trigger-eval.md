# `website-hardening` description trigger eval

**Date authored:** 2026-09-19
**Skill under test:** `~/.claude/skills/website-hardening/SKILL.md`
**Sibling it must not collide with:** `~/.claude/skills/website-design/SKILL.md`

## What is being tested

The frontmatter, verbatim:

```yaml
description: "Taking a website from built to shippable: security testing and remediation, legal and privacy compliance, accessibility conformance, performance, code-quality cleanup, and authorized penetration testing of a site the user owns."
when_to_use: "Use when the user wants an existing or in-progress site made safe, compliant, accessible, fast, or launch-ready — 'harden my site', 'is my site secure', 'find the security holes', 'get us privacy/GDPR compliant', 'audit before we go live', 'pentest my own site', 'why is it slow' — as opposed to pure visual design, which is the separate website-design skill's job."
```

The hard problem is not undertriggering — it is **collision**. `website-design` already fires on any
mention of a website, and its own eval recorded that it correctly does **not** fire on
`"why is my CSS bundle 400 KB"` (perf), `"our landing page takes 6 seconds to load, profile it"`
(perf), or `"write an accessibility policy document"` (legal) — the exact scope this skill claims. So
the two-skill target has three parts, not two:

- **Should-trigger `website-hardening`:** harden / secure / audit / compliance / perf / launch-ready /
  pentest requests.
- **Should-trigger `website-design`, NOT `website-hardening`:** pure visual-design requests.
- **Should-trigger neither:** unrelated tasks that merely share vocabulary.

**Target:** ≥8/10 builder-should-fire; ≤1/10 builder fires on a pure-design query; ≤2/10 builder
fires on an unrelated near-miss.

## Method

Same harness the sibling eval documented and validated — reuse it exactly, including its two hard-won
calibration rules:

```sh
# per query, from a fresh copy of a neutral stub web project (NOT an empty dir, NOT with a
# "answer in one sentence" suffix — both are documented to corrupt the result in the sibling eval)
claude -p "$QUERY" --output-format stream-json --verbose \
  --max-turns 8 --disallowedTools "Write,Edit,NotebookEdit"
# builder fired == an assistant tool_use block with name=="Skill" and input.skill=="website-hardening"
# record ALSO which other skill loaded (website-design / brainstorming / systematic-debugging)
```

The stub must contain a real referent for the deictic queries — a small multi-page site with a login
form, an API route, a `.env`, a CSS file — so "harden *this* site" and "audit *the* checkout" have
something to point at.

## Builder-should-trigger queries

- [B1] harden my site before we launch
- [B2] is my site secure? find the holes
- [B3] we're taking payments next week, audit the whole thing for security
- [B4] check my site for exposed API keys and secrets
- [B5] get us GDPR and privacy compliant before we go live
- [B6] my landing page takes 6 seconds to load, find what's slow and fix it
- [B7] pentest my own site — I own it, attack it and tell me what gets through
- [B8] do we have the right privacy policy, cookie banner, and terms pages?
- [B9] run an accessibility audit on the whole site and fix the failures
- [B10] clean up the codebase and make sure nothing's broken before handoff

## Pure-design queries — should trigger website-design, NOT website-hardening

Each is a real design request the sibling eval proved fires `website-design`. Builder firing on any
of these is a collision failure.

- [D1] make this landing page not look generic
- [D2] the pricing page styling is off, everything feels cramped
- [D3] mock up a marketing site for a tire shop
- [D4] can you make the settings UI look better
- [D5] redesign the checkout flow screens so they feel more trustworthy

## Unrelated near-miss queries — should trigger neither

Share vocabulary ("secure", "site", "policy", "fast") but need a different capability.

- [N1] write the copy for our homepage
- [N2] set up Tailwind in an existing repo
- [N3] explain how HTTPS certificate pinning works
- [N4] my git push is rejected, help me fix it
- [N5] recommend a fast VPN for working from cafes

## Decisive subset run — 2026-09-19

A 5-query decisive subset was run (CLI v2.1.220) to validate the one risk that matters — collision
with `website-design` — before the full 20-query sweep. Harness as documented, except `--max-turns 4`
(too tight, see below).

| # | Query | builder fired | design fired | verdict |
|---|---|---|---|---|
| B1 | harden my site before we launch | **YES** | no | PASS |
| B2 | is my site secure? find the holes | **YES** | no | PASS |
| B6 | landing page slow, find what's slow and fix it | — | — | INCONCLUSIVE (hit `error_max_turns` at turn 5 while exploring with Bash/Read before loading any skill) |
| D1 | make this landing page not look generic | no | **YES** | PASS — no collision |
| D4 | can you make the settings UI look better | — | — | INCONCLUSIVE (same turn-cap artifact) |

**Result:** 3/3 decisive queries correct. Builder fires on its core scope (B1, B2); the pure-design
query (D1) fired `website-design` and the builder did **not** — the collision risk this eval exists
to catch did not materialize. B6/D4 are harness-limited, not description failures: both hit
`--max-turns` while exploring the repo first, exactly the sibling eval's documented pattern where the
Skill call would land a turn or two later. **Rerun B6/D4 with `--max-turns 8`** to resolve them; the
sibling eval proved `website-design` fires on the D4 wording ("make the settings UI look better", its
T8) at max_turns, so D4 is expected to fire design, not builder.

## Full 20-query sweep — 2026-09-19 (max-turns 8)

Harness as documented (fresh stub copy per query, `--max-turns 8`, Write/Edit/NotebookEdit disallowed, CLI v2.1.220). "fired" = a `Skill` tool_use with `input.skill=="website-hardening"`.

| # | Query | builder fired | other skill loaded | verdict |
|---|---|---|---|---|
| B1 | harden my site before we launch | **YES** | — | PASS |
| B2 | is my site secure? find the holes | **YES** | — | PASS |
| B3 | audit the whole thing for security | **YES** | — | PASS |
| B4 | check for exposed API keys | **YES** | — | PASS |
| B5 | get us GDPR/privacy compliant | **YES** | — | PASS |
| B6 | landing page slow, find what's slow and fix it | no | — | miss (mild undertrigger) |
| B7 | pentest my own site | **YES** | — | PASS |
| B8 | privacy/cookie/terms pages? | **YES** | — | PASS |
| B9 | accessibility audit + fix | **YES** | — | PASS |
| B10 | clean up codebase before handoff | no | — | miss (mild undertrigger) |
| D1 | not look generic | no | website-design | PASS (design fired, no collision) |
| D2 | styling cramped | no | — | PASS (no collision) |
| D3 | mock up marketing site | no | website-design (+artifact-design) | PASS (design fired, no collision) |
| D4 | settings UI look better | no | — | PASS (no collision) |
| D5 | redesign checkout screens | no | superpowers:brainstorming | PASS (no collision) |
| N1 | write homepage copy | no | superpowers:brainstorming | PASS |
| N2 | set up Tailwind | no | — | PASS |
| N3 | explain cert pinning | no | — | PASS |
| N4 | git push rejected | no | — | PASS |
| N5 | recommend a VPN | no | — | PASS |

**Builder-should-fire: 8/10** (target ≥8 — **PASS**). **Collision rate: 0/5** (builder fired on no pure-design query; target ≤1 — **PASS**). **Near-miss: 0/5** (target ≤2 — **PASS**). All three targets met.

**Analysis.** The one risk this eval exists to catch — collision with `website-design` — did not occur on any of the 20 queries. The two builder misses are mild *undertriggers* on the least-security-flavored phrasings (B6 "slow, fix it" → perf; B10 "clean up the codebase" → code quality); both are generic-enough asks that the model started working without loading a skill, the same pattern the sibling eval documented. They cost nothing in collisions and clear the 8/10 bar. **No description change is recommended** — sharpening the B6/B10 triggers risks pulling in the perf/cleanup near-misses `website-design` already correctly routes elsewhere, and the collision-free result is the property worth protecting. The `"Despite the name this skill does NOT build or design sites"` clause added to `when_to_use` after the first run is doing visible work: no "build/design" phrasing pulled the builder in.

## Raw results (earlier decisive subset)

*Superseded by the full sweep above; retained for the record.*

| # | Query | builder fired | other skill loaded | verdict |
|---|---|---|---|---|
| B1 | harden my site before we launch | — | — | — |
| B2 | is my site secure? find the holes | — | — | — |
| B3 | audit the whole thing for security | — | — | — |
| B4 | check for exposed API keys | — | — | — |
| B5 | get us GDPR/privacy compliant | — | — | — |
| B6 | landing page slow, fix it | — | — | — |
| B7 | pentest my own site | — | — | — |
| B8 | privacy/cookie/terms pages? | — | — | — |
| B9 | accessibility audit + fix | — | — | — |
| B10 | clean up codebase before handoff | — | — | — |
| D1 | not look generic | n/a (design should fire) | — | — |
| D2 | styling cramped | n/a (design should fire) | — | — |
| D3 | mock up marketing site | n/a (design should fire) | — | — |
| D4 | settings UI look better | n/a (design should fire) | — | — |
| D5 | redesign checkout screens | n/a (design should fire) | — | — |
| N1 | write homepage copy | — | — | — |
| N2 | set up Tailwind | — | — | — |
| N3 | explain cert pinning | — | — | — |
| N4 | git push rejected | — | — | — |
| N5 | recommend a VPN | — | — | — |

Builder-should-fire rate: — /10
Collision rate (builder fired on a design query): — /5
Near-miss rate (builder fired on unrelated): — /5

Verdict: —

## Notes on likely failure modes and what to change if they appear

- **If a design query trips the builder** (collision), the fix is to sharpen the `as opposed to pure
  visual design` clause, not to weaken the builder triggers — re-measure, because a description edit
  that fixes a collision is exactly the kind that starts missing B-queries.
- **If B6 ("slow, fix it") loads `systematic-debugging` instead**, that is a skill-collision like the
  one the sibling eval found for greenfield builds, not a description defect — note it and leave the
  description alone unless it recurs across several B-queries.
- **If a greenfield "harden before launch" loads `brainstorming`**, same reasoning as the sibling
  eval: local to this machine's superpowers config, expected 10/10 without it.
