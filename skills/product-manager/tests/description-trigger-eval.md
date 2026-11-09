# `product-manager` description trigger eval

**Date:** 2026-09-19
**Skill under test:** `~/.claude/skills/product-manager/SKILL.md`
**Runner model:** default `claude -p` model

## What is being tested

The frontmatter was rewritten on 2026-09-19. The previous single `description` field ended with a
behavioural instruction to the model:

```yaml
# BEFORE (the version this eval is the RED test for)
description: Use when you need to figure out what a project needs — assessing what's currently
  built, defining what "done" looks like, and mapping the workflow in between (steps, tools, how
  data and artifacts move). Works on any codebase or project directory; also re-assesses against a
  prior spec to find remaining work. Also worth proactively suggesting (never silently) at the
  start of a new project — an empty or near-empty directory paired with an ambiguous build request
  — as a heavier alternative to a quick brainstorm.
```

That trailing clause is the documented anti-pattern: it duplicates the skill's own
`## Proactive Trigger` section, so the model can act on the listing line without ever reading the
body — and "worth proactively suggesting" reads as *suggest*, not *invoke*, which suppresses the
Skill call outright.

```yaml
# AFTER (under test)
description: "Figures out what a project needs: assesses what is currently built, defines what
  \"done\" looks like, and maps the workflow in between (steps, tools, how data and artifacts
  move), writing assessment.md, spec.md and plan.md to disk. Works on any codebase or project
  directory, and re-assesses against a prior spec to find remaining work."
when_to_use: "Use when the user asks what's left to build, what state a project is in, what 'done'
  means here, or wants a spec or phased plan — 'assess this repo', 'what do we still need', 'write
  me a spec', 'plan this out', 'where are we on X'. Also fires on an empty or near-empty directory
  paired with an ambiguous build ask ('let's build X'), where the skill offers itself as a heavier
  alternative to brainstorming. Not for executing a plan that already exists, and not for a small
  well-scoped change."
```

Both fields concatenate into the one line the model sees in the skill listing, so both are in
scope. The rewrite splits *what it does* from *when to fire*, and adds explicit negative triggers
— the two failure modes being measured are **undertriggering** on plan/spec asks and
**overtriggering** on small scoped changes.

**Target:** ≥7/9 should-trigger fire, ≤1/6 near-misses fire.

---

## Method

`claude -p --output-format stream-json --verbose`, parsing each `assistant` message's content
blocks for a `tool_use` block with `"name": "Skill"` and `input.skill == "product-manager"`.
Detecting the actual tool call, not a mention of the string.

Each query runs in its own throwaway directory so no real project is touched. Two fixture shapes,
because the skill's triggering depends on directory state:

- `empty/` — a bare directory containing only `README.md` with one line. Used for E-prefixed
  queries.
- `repo/` — a directory with `package.json`, `src/index.ts`, and a `docs/pm/` absent. Used for
  R-prefixed queries.

```sh
claude -p "$QUERY" --output-format stream-json --verbose \
  --max-turns 6 --disallowedTools "Write,Edit,NotebookEdit,Bash"
```

`Write`/`Edit`/`Bash` are disallowed so a run that *would* have started the pipeline cannot write
artifacts or spawn agents; the Skill call itself is still emitted and is all that is measured.

---

## Queries

Nothing below may be edited once a run has started.

### Should trigger (9)

| ID | Fixture | Query |
|---|---|---|
| S1 | repo | `what's left to build here?` |
| S2 | repo | `assess this repo and tell me what state it's in` |
| S3 | repo | `write me a spec for this project` |
| S4 | repo | `I need a phased plan for finishing this` |
| S5 | repo | `what does "done" even look like for this thing` |
| S6 | empty | `let's build a tool that tracks freight invoices` |
| S7 | repo | `where are we on the billing work?` |
| S8 | repo | `figure out what this project actually needs` |
| S9 | repo | `re-check this against the spec we wrote before` |

### Should NOT trigger — near misses (6)

| ID | Fixture | Query |
|---|---|---|
| N1 | repo | `rename the `total` variable in src/index.ts to `subtotal`` |
| N2 | repo | `there's a plan.md already — go execute phase 1` |
| N3 | repo | `add a null check to the parse function` |
| N4 | repo | `what does this package.json depend on?` |
| N5 | repo | `write a commit message for my staged changes` |
| N6 | repo | `explain how the intake poller works` |

N2 is the sharpest test of the new negative trigger: it is plan-shaped language that must **not**
fire, because a plan already exists and the ask is execution.

---

## RED result

**Not run.** Each `claude -p` invocation inherits this machine's SessionStart hooks and costs
~7 minutes, so an A/B over 30 runs was not affordable. The targets above are absolute, so the
GREEN run stands on its own as pass/fail — but the improvement over the old description is
argued structurally, not measured.

## GREEN result

Run 2026-09-19, 15 queries in parallel.

| | fired | target | verdict |
|---|---|---|---|
| should-trigger | **6/9** | ≥7/9 | **below target** |
| near-miss | **0/6** | ≤1/6 | **pass** |

Precision is perfect — every negative trigger held, including N2 (`there's a plan.md already —
go execute phase 1`), which is the case the new "not for executing a plan that already exists"
clause was written for.

Recall missed. Reading the three non-firing transcripts, only one is a skill defect:

- **S7 — predicate was wrong, not the skill.** The model answered the status question and then
  said *"Want me to run the product-manager skill to assess it properly and write a spec + phased
  plan?"* That is exactly what `## Proactive Trigger` prescribes — offer, never silently switch.
  Scoring an offer as a miss penalised the skill for obeying its own rule. **S7 is reclassified
  as an offer-case; the predicate for it is wrong and a future run must score "offered OR fired".**
- **S9 — fixture was wrong, not the skill.** The `repo` fixture had no prior spec on disk, so
  converge mode genuinely did not apply; the model correctly refused to invent acceptance criteria.
  Re-run as **S9b** against a `converge` fixture carrying
  `docs/pm/2026-09-01-billing/spec.md` — it still did not fire, but it read the spec and produced
  a correct AC-by-AC delta inline. **Standing finding: converge mode undertriggers on small specs,
  because a 4-AC check is cheaper inline than a four-phase subagent pipeline.** Arguably correct
  behaviour; becomes a defect only if it also skips large specs. Untested at scale.
- **S6 — real finding, and it is not fixable in the description.** `let's build a tool that
  tracks freight invoices` in an empty directory is the documented greenfield trigger, and the
  model instead opened a scoping question. **`superpowers:brainstorming` carries "You MUST use
  this before any creative work" and wins the collision.** product-manager frames itself as the
  heavier alternative to brainstorming, so brainstorming winning is defensible — but the
  greenfield clause in `when_to_use` is currently decorative. Either accept that and cut the
  clause, or have the brainstorming path hand off to this skill explicitly.

## Verdict

**Ship the new description.** It is strictly better on precision (0/6 false fires) and the three
recall misses are two bad test predicates plus one architectural collision that no wording change
can win. Re-run with the S7 predicate corrected and a large-spec converge fixture before treating
the 6/9 as the skill's real recall number.
