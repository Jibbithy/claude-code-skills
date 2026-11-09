# RED baseline test — website-design skill

Per the superpowers `writing-skills` Iron Law ("NO SKILL WITHOUT A FAILING TEST FIRST"), this file
is authored **before** the two runs it governs — the RED run (the pre-rewrite skill,
not published) and the GREEN run (current `SKILL.md` + `references/`). Fixing the
briefs and the pass predicates in advance is the whole point: predicates written after the output
exists get fitted to the output, and the A/B stops measuring anything.

Nothing below may be edited once a run has started. Results go in `## RED result` and
`## GREEN transition`, and nowhere else.

## Pressure scenario

Two fixed briefs. **Both runs build both briefs**, in a clean empty directory per brief, with no
follow-up steering, no clarifying questions answered, and no human taste applied between the brief
and the output. Recorded here verbatim so the two runs receive byte-identical input.

> **Brief A (utilitarian).** Build a one-page internal status board for a 12-person freight dispatch
> team: a headline, four live operational metrics, a recent-activity list, and one primary action.
> Single static file — HTML + CSS only, no framework, no build step. Write it to `./index.html`.

> **Brief B (editorial).** Build a marketing landing page for Fathom Analytics, a privacy-first
> website analytics product: explain what it is, why privacy-first analytics matters, what it costs,
> and drive the visitor to start a free trial. Single static file — HTML + CSS only, no framework,
> no build step. Write it to `./index.html`.

### Why there are two briefs — do not collapse this to one

**Brief A cannot discriminate.** It is explicitly utilitarian, and utilitarian is the one treatment
class where `SKILL.md` says *not* to build a visual identity. So on Brief A, `[P3]` and the whole
hero-slop family — hero, logo wall, icon-card triptych, testimonials, three-tier pricing, closing
CTA — have no surface to fire on, for either run. A "pass" there is an artifact of the brief, not of
the skill. Brief A is retained because it is where `[P2]` (KPI grid), `[P4]` (unhappy paths), and
`[P7]` (optical care on dense data) have real teeth.

Only an editorial brief for a real product puts the canonical section order, the icon-card row, and
the marketing-page tells on the table at all. That is Brief B's entire job. A later reader who
"simplifies" this file back to one brief destroys the only discriminating half of the test.

## Pass predicates

Eight predicates. Each is scorable from **the rendered PNG plus a grep of `index.html`** — no
judgment call that a second scorer could not reproduce. Each is scored **once per brief**, and a
predicate **fails if it fails on either brief**. A run's score is the count of predicates passing on
both briefs.

- **[P1]** Palette is not the `slate`/`blue-500` default — no `#3b82f6`, `#0f172a`, `#64748b`, `#e2e8f0` anywhere in the file, and no `slate-*` or `blue-500` utility class in the markup.
- **[P2]** No 4-across KPI grid with an icon in each card corner. Four metrics may exist — Brief A asks for them — but not as four equal cards in one row each wearing a corner glyph.
- **[P3]** Not the canonical section order (hero → logo wall → 3 feature cards → testimonials → 3-tier pricing → closing CTA), **and** not its "premium AI" variant (hero → stats bar → work grid → about split → CTA). Scored primarily on **Brief B**, the only one of the two briefs that can produce it.
- **[P4]** Unhappy paths are rendered, not assumed: at minimum an empty state for the list surface, a loading treatment, an error treatment, a disabled control, and a `:focus-visible` style. All five present, visible in the PNG or greppable in the CSS.
- **[P5]** A `DESIGN.md` exists next to `index.html` containing all six required sections: palette with roles, type roles with fallbacks, layout concept, signature element, reference set with what was taken from each, tried-and-rejected log.
- **[P6]** The typeface is none of Inter, Roboto, Poppins, Montserrat, Playfair Display, Space Grotesk — checked against the `font-family` stacks and any font `<link>`.
- **[P7]** Evidence of optical care: a real measure constraint (a `max-width` in `em` or `ch` around `32em` for body text), plus at least one of `text-wrap: balance`, a `::selection` rule, positive tracking on uppercase labels, or `font-variant-numeric: tabular-nums` on numeric columns.
- **[P8]** The GREEN output does not match **the skill's own likely signature** (`references/ai-tells.md`, "the second-generation uniform"): off-white/warm-grey ground (`#FAFAF8`, `#F5F0EB`) **and** a serif display face **and** everything centered in one `max-width` container **and** a row of icon-topped cards **and** fade-up-on-scroll entrances.

### `[P8]` threshold: four of five, and why not three

**`[P8]` fails only when four or more of those five elements fire together. Three is explicitly a
pass.**

The 4-of-5 threshold is the tell's own calibration, not a concession. `ai-tells.md` states under
"when it's fine" that *any single element is fine* — warm off-white is a good ground, serif display
is a real voice, fade-up is a real technique — and that **the five together** are the uniform. Two
of the five (a serif display face, a centered `max-width` container) carry near-zero specificity in
isolation; they describe a large fraction of all competent typographic web design.

At a 3-of-5 threshold, an off-white ground + serif display + centered container would trip `[P8]`
with nothing generic about the result, and the only way to pass would be degrading edits made purely
to satisfy the test — a cold ground or an off-center layout chosen for the scorer rather than the
brief. A predicate that can only be satisfied by making the work worse is measuring the predicate,
not the skill. Four-of-five keeps `[P8]` pointed at the convergence it was written to catch.

### What each predicate is worth as evidence

The eight predicates are not eight independent pieces of evidence. Read the A/B at its real
strength, not its nominal one:

- **`[P4]` and `[P5]` are compliance predicates.** The old skill snapshot **cannot pass them by construction** — it has no unhappy-path requirement and no `DESIGN.md` artifact at all. They confirm the new process ran; they carry **no evidential weight** on their own about whether the output is better.
- **`[P1]` and `[P6]` are grep bans that the new skill states outright.** A run that reads the skill and then avoids the six named typefaces has done what it was told. Passing them is **near-tautological** and should not be counted as a finding.
- **`[P2]` and `[P7]` are weak-to-moderate.** They are stated in the references but require translation into a layout and a stylesheet, so they can genuinely fail even with the skill loaded.
- **`[P3]` on Brief B and `[P8]` are the two predicates that actually discriminate.** `[P3]` tests whether the skill displaces the corpus-default page shape on the one brief that invites it; `[P8]` tests whether the skill avoids the uniform *it itself* tends to produce, which no amount of instruction-following can make automatic.

**The blind tell-count is the primary measure.** Both outputs of both briefs are scored against
`references/ai-tells.md` by a scorer who is not told which run produced which file. The predicate
table is the structured secondary; the two discriminating predicates plus the blind delta are the
result. A headline of "8/8 vs 2/8" would overstate the finding and must not be reported that way.

## RED result

*To be filled in by the RED run (the pre-rewrite skill; that snapshot is not published) after this file
is committed. Left deliberately empty — no result is predicted here, and no predicate above may be
revised once the run has produced output.*

| Predicate | Brief A | Brief B | Verdict |
| --- | --- | --- | --- |
| P1 | — | — | — |
| P2 | — | — | — |
| P3 | — | — | — |
| P4 | — | — | — |
| P5 | — | — | — |
| P6 | — | — | — |
| P7 | — | — | — |
| P8 | — | — | — |

Blind tell-count (Brief A / Brief B): —

Baseline verdict: —

## GREEN transition

*To be filled in by the GREEN run (current `SKILL.md` + `references/`) after the RED run is
recorded. Left deliberately empty.*

| Predicate | Brief A | Brief B | Verdict |
| --- | --- | --- | --- |
| P1 | — | — | — |
| P2 | — | — | — |
| P3 | — | — | — |
| P4 | — | — | — |
| P5 | — | — | — |
| P6 | — | — | — |
| P7 | — | — | — |
| P8 | — | — | — |

Blind tell-count (Brief A / Brief B): —

RED→GREEN delta, stated at the strength the two discriminating predicates and the blind tell-count
actually support: —
