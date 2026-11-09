# `website-design` description trigger eval

**Date:** 2026-07-27
**Skill under test:** `~/.claude/skills/website-design/SKILL.md`
**Runner model:** default `claude -p` model, CLI v2.1.220

## What is being tested

The frontmatter under test, verbatim:

```yaml
description: "Web and UI design work: websites, landing pages, dashboards, web apps, marketing pages, redesigns, and visual polish."
when_to_use: "Use this skill whenever the user mentions a website, landing page, dashboard, web app, UI, frontend, mockup, redesign, styling, or asks to make something look better — even if they don't say 'design'."
```

Both fields are concatenated into the single line the model sees in the skill listing, so both are
in scope here. The phrasing is deliberately **triggering conditions only** — it names no workflow
step, because a description that summarizes the workflow causes the model to act on the summary
instead of reading the skill body. The predictable cost of that choice is **undertriggering**.
This eval measures it.

**Target:** ≥8/10 should-trigger fire, ≤2/10 near-misses fire.

---

## Method

**Detection method used: `claude -p --output-format stream-json --verbose`, parsing each
`assistant` message's content blocks for a `tool_use` block with `"name": "Skill"` and
`input.skill == "website-design"`.** This is the preferred method — it detects the actual Skill
tool call rather than an incidental mention of the string. The `--output-format json` +
grep-the-transcript fallback was not needed.

Per-query invocation:

```sh
cp -R stub wd3/$ID && cd wd3/$ID
claude -p "$QUERY" --output-format stream-json --verbose \
  --max-turns 8 --disallowedTools "Write,Edit,NotebookEdit"
```

- Each run got its **own fresh working directory**, none of them inside or near
  `~/.claude/skills/website-design/`, so directory context could not bias the result.
- **Runs were prevented from building anything by disallowing `Write`/`Edit`/`NotebookEdit`**, not
  by adding suppressive prompt text (see calibration note below). `--max-turns 8` capped runtime;
  Skill invocation always occurred on turn 1–2, well inside the cap.
- The queries were sent **verbatim, with no appended instructions** — see below for why.

### Calibration note — two harness designs were discarded before the recorded run

Recording these because both produced numbers that would have been wrong, and both failure modes
are easy to repeat.

**Discarded harness 1 — suppressive prompt suffix.** The first design appended
`"Answer in one sentence; do not write any files."` to each query, as a way of keeping runs cheap.
Result: **0/10 should-trigger fired.** That is a harness artifact, not a description failure. The
suffix reframes every request as advice-only, so the model never enters the do-the-work path where
a skill is loaded. Verified directly: `"mock up a marketing site for a tire shop"` with the suffix
→ no Skill call; the identical query without the suffix → `Skill(website-design)` as the very
first tool call. **A prompt suffix that suppresses work also suppresses skill invocation, so it
cannot be used in a trigger eval.** Runs are constrained with tool permissions instead.

**Discarded harness 2 — empty working directory.** With the suffix removed but each run starting
in an empty directory, the result was **4/10**. Cause: the realistic should-trigger queries are
deictic — "*this* landing page", "*the* settings UI", "*the* checkout flow" — and with no referent
on disk the model correctly answers "there is nothing here, where does it live?" and stops. That
measures the empty directory, not the description.

**Recorded harness.** Every run starts from an identical copy of a small, neutral stub web project
(`index.html`, `pages/pricing.html`, `pages/dashboard.html`, `pages/checkout.html`,
`pages/settings.html`, `pages/login.html`, `styles/main.css`, `package.json`). It is generic
Acme-Freight boilerplate with no connection to the skill. Both halves of the set run against the
**same** context, which is what makes the near-miss half a fair test rather than an easy one — the
near-misses also have real referents (a real CSS file to weigh, a real login form with a
cross-origin `fetch`, a real double-submitting form).

---

## Should-trigger queries

- [T1] make this landing page not look generic
- [T2] build me a dashboard for our dispatch board
- [T3] the pricing page styling is off, everything feels cramped
- [T4] mock up a marketing site for a tire shop
- [T5] our internal admin tool looks like a spreadsheet threw up, can you clean it up
- [T6] I need a homepage for a new trucking SaaS product
- [T7] redesign the checkout flow screens so they feel more trustworthy
- [T8] can you make the settings UI look better
- [T9] put together a simple web app front end for tracking shipments
- [T10] the site works but it looks dated compared to competitors

## Near-miss should-NOT-trigger queries

Each shares vocabulary with the skill's trigger surface but needs a different capability —
copywriting, bundle profiling, asset conversion, build config, SEO, CORS debugging, perf
profiling, testing, event-handler debugging, policy writing.

- [N1] write the copy for our homepage
- [N2] why is my CSS bundle 400 KB
- [N3] convert this Figma export to SVG
- [N4] set up Tailwind in an existing repo
- [N5] audit this page for SEO
- [N6] fix the CORS error on the login page
- [N7] our landing page takes 6 seconds to load, profile it
- [N8] add unit tests for the dashboard data fetching hook
- [N9] the website form submits twice on click, debug it
- [N10] write an accessibility policy document for our marketing site

---

## Raw results

`website-design` column is the pass/fail signal. `other skills` records any *different* skill the
run loaded instead, which is where the interesting failures are.

| # | Query | `website-design` fired | Other skills loaded | Run end |
|---|---|---|---|---|
| T1 | make this landing page not look generic | **YES** | — | max_turns |
| T2 | build me a dashboard for our dispatch board | no | `superpowers:brainstorming` | success |
| T3 | the pricing page styling is off, everything feels cramped | **YES** | — | max_turns |
| T4 | mock up a marketing site for a tire shop | **YES** | — | max_turns |
| T5 | our internal admin tool looks like a spreadsheet threw up | **YES** | — | max_turns |
| T6 | I need a homepage for a new trucking SaaS product | no | `superpowers:brainstorming` | success |
| T7 | redesign the checkout flow screens | **YES** | — | max_turns |
| T8 | can you make the settings UI look better | **YES** | — | max_turns |
| T9 | put together a simple web app front end for tracking shipments | **YES** | — | max_turns |
| T10 | the site works but it looks dated compared to competitors | **YES** | — | max_turns |

| # | Query | `website-design` fired | Other skills loaded | Run end |
|---|---|---|---|---|
| N1 | write the copy for our homepage | no | — | success |
| N2 | why is my CSS bundle 400 KB | no | — | success |
| N3 | convert this Figma export to SVG | no | — | success |
| N4 | set up Tailwind in an existing repo | no | — | max_turns |
| N5 | audit this page for SEO | no | — | success |
| N6 | fix the CORS error on the login page | no | `superpowers:systematic-debugging` | max_turns |
| N7 | our landing page takes 6 seconds to load, profile it | no | — | success |
| N8 | add unit tests for the dashboard data fetching hook | no | — | success |
| N9 | the website form submits twice on click, debug it | no | `superpowers:systematic-debugging` | max_turns |
| N10 | write an accessibility policy document for our marketing site | no | — | max_turns |

`max_turns` in the last column means the run was cut off by `--max-turns 8`, not that it errored.
It is not a confound for detection: in every firing run the `Skill` call was the first or second
tool call, and both non-firing should-trigger runs (T2, T6) ran to natural completion at 14 turns
without ever calling it.

---

## Scores

**Should-trigger trigger rate: 8/10 (80%)** — target ≥8/10. **PASS.**

**Near-miss trigger rate: 0/10 (0%)** — target ≤2/10. **PASS.**

Separation is clean: 80 points between the two halves, with zero false positives.

---

## Analysis

**The undertriggering risk did not materialize on styling and polish language.** The queries with
the least explicit design vocabulary are the ones the conditions-only phrasing was most at risk of
missing, and they all fired: T10 ("looks dated") and T8 ("look better") contain no design noun at
all; T5 ("looks like a spreadsheet threw up") is pure vernacular; T3 is a complaint, not a request.
The `when_to_use` clause "*or asks to make something look better — even if they don't say
'design'*" is doing visible work here. It should not be trimmed.

**Zero false positives on the near-misses, including the hard ones.** N2, N7, and N9 all name a
web surface the skill claims ("CSS", "landing page", "the website form") and all correctly routed
elsewhere. The description's noun list is specific enough to name surfaces without capturing every
task performed on them.

**Both misses share one cause, and it is not the description.** T2 and T6 are the two greenfield
build-from-nothing requests in the set ("build me a dashboard", "I need a homepage"). Both loaded
`superpowers:brainstorming` instead — whose description begins *"You MUST use this before any
creative work — creating features, building components, adding functionality"* and which is
injected into every session by a `SessionStart` hook with an `<EXTREMELY-IMPORTANT>` wrapper. That
is a stronger, earlier, mandatory-worded claim on exactly the create-something-new case, so it wins
the routing. Both runs then completed inside the brainstorming flow without ever reaching design.

This is a **skill-collision** result, not an undertriggering result, and the distinction matters
for what to do about it:

- It is **local to this machine's configuration**. On a setup without the superpowers plugin, T2
  and T6 have nothing competing for them and the expected rate is 10/10.
- Making `website-design`'s description more aggressive would not reliably win against an
  `<EXTREMELY-IMPORTANT>` system-prompt injection, and buying those two points by escalating the
  language is exactly the trade the conditions-only phrasing exists to avoid.
- The two skills are also **not actually in conflict** — brainstorming establishes intent,
  `website-design` executes the visual work. The correct end state is sequential use, not
  displacement. What is missing is the handoff back.

**No change to `SKILL.md` is recommended on the strength of this result.** The description passes
its target as written, and the failure mode found lives in skill-to-skill routing, not in the
description. If the greenfield case is later judged worth closing, the change to evaluate is a
handoff at the end of the brainstorming flow rather than louder wording here — and it should be
re-measured with this same harness, since a description edit that fixes T2/T6 is exactly the kind
of edit most likely to start pulling in N1 ("write the copy for our homepage").

---

## Reproducing

Queries are the `- [T*]` / `- [N*]` lists above, sent verbatim. Harness:

```sh
# per query, from a fresh copy of a neutral stub web project
claude -p "$QUERY" --output-format stream-json --verbose \
  --max-turns 8 --disallowedTools "Write,Edit,NotebookEdit"
# fired == any assistant tool_use block with name=="Skill" and input.skill=="website-design"
```

Do **not** append "answer in one sentence" or "do not write any files" to the queries — that
collapses the result to 0/10 for reasons unrelated to the description. Do **not** run from an empty
directory — that collapses it to 4/10. Both are documented under the calibration note above.
