# Review

## Contents

- [The structural problem](#the-structural-problem)
- [Two passes, in this order](#two-passes-in-this-order)
- [Perceptual tests](#perceptual-tests)
- [Hard geometry checks](#hard-geometry-checks)
- [Contrast, measured](#contrast-measured)
- [Console](#console)
- [Triage matrix](#triage-matrix)
- [Problems over prescriptions](#problems-over-prescriptions)
- [Evidence-based feedback](#evidence-based-feedback)
- [Tests deliberately excluded](#tests-deliberately-excluded)
- [Scored gate](#scored-gate)


What the screenshots get checked against. Design work is an open field; verification is a narrow bridge — so this file is written in gates, not suggestions, and it is the one place in this skill where all-caps MUST and NEVER are permitted. If a check below fails, the work is not done, regardless of how good it looks.

- [The structural problem](#the-structural-problem)
- [Two passes, in this order](#two-passes-in-this-order)
- [Perceptual tests](#perceptual-tests)
- [Hard geometry checks](#hard-geometry-checks)
- [Contrast, measured](#contrast-measured)
- [Console](#console)
- [Triage matrix](#triage-matrix)
- [Problems over prescriptions](#problems-over-prescriptions)
- [Evidence-based feedback](#evidence-based-feedback)
- [Tests deliberately excluded](#tests-deliberately-excluded)

## The structural problem

NN/g states it plainly: a fresh perspective is more likely to be unbiased, because an outsider is not emotionally invested in the design. Self-review is therefore structurally compromised — you cannot see your own work, because you already know what it was supposed to look like. Every technique in this file is a way of manufacturing fresh eyes on your own output: blur it, desaturate it, shrink the viewport, slow it down, fill it with the wrong content.

One consequence worth stating before the checks begin: the point of a review is to find things, so a pass that produces no findings is evidence the review was too shallow, not evidence the work is finished.

This is also why the review runs against **rendered screenshots**, not against the source. Reading your own CSS confirms your intent. Looking at the pixels tests the result.

## Two passes, in this order

Heuristic evaluation is run as two passes, and the order is load-bearing.

1. **Pass one — learn the system.** Move through the interface as a user would. Do not write findings. You are building a model of what the design is trying to do: what the primary action is, how hierarchy is signalled, what the spacing rhythm is, which states exist.
2. **Pass two — hunt violations.** Now go back with the model in hand and look for places the design contradicts itself. A violation is only a violation relative to an established rule; without pass one you will report the system's intentional choices as defects and miss the actual inconsistencies.

You MUST NOT collapse these into one pass. A single pass produces a list of unranked reactions, not a review.

## Perceptual tests

Run these against captured screenshots (and, for motion, against the live page). Each one destroys a different kind of information, and what survives is the hierarchy you actually built.

| Test | Procedure | What it catches — check specifically |
|---|---|---|
| **Squint / blur** | Partially close your eyes or step back; digitally, apply a blur or use the browser's far-sightedness emulation | Four questions, answered separately: **is the primary action still recognizable** · **does spacing group related items** (proximity errors show up instantly) · **do high-contrast background elements dominate** (decoration outcompeting content) · **are links still distinguishable** (links marked only by an underline vanish under blur). If text and background start to blur together, contrast is too weak. |
| **Placeholdifier** | Replace text and images with solid blocks while keeping the layout sharp | The exact complement to blur: blur removes detail and keeps content, this removes content and keeps detail. **Run both.** Each surfaces different problems. |
| **Grayscale** | Screenshot, then desaturate to 0% | Whether hierarchy survives without color. This is the test that catches hierarchy built *on* color — a "primary" button that is only primary because it is blue, status that is only communicated by red vs green. Status and state MUST carry a redundant non-color cue. |
| **Slow-motion** | Increase animation duration 2–5×, or drive it from the browser's animations panel | Everything invisible at full speed: do colors transition smoothly or do two distinct states visibly overlap · does easing start or stop abruptly · is `transform-origin` correct (a popover MUST open from its trigger, not from its own center) · are opacity, transform and color in sync |
| **Dark mode** | Style the `<html>` element with `color-scheme: dark` | The overlooked half. Without this, scrollbars, form controls and other device UI stay light and sit at wrong contrast against your dark surfaces — browser chrome does not follow your CSS. |
| **Very long and empty content** | Re-render with a 3-word string and a 300-word string in every text slot; then with zero rows | Everything lorem ipsum hides: truncation that never triggers, headings that were designed at exactly one length, cards that collapse. Empty, sparse, dense and error states MUST all be designed — a table with zero rows MUST NOT render as a bare header with dead space below it. |
| **Real device** | Open the page on an actual phone, not only an emulated viewport | Touch feel, gesture handling, hover styles firing and sticking on tap, iOS input zoom on sub-16px fields. A simulator is an acceptable fallback; real hardware is better, and it is the only way to judge whether a target is comfortably hittable rather than merely 44px. |
| **Sleep on it** | Look again the next day, before touching anything | The strongest practitioner technique available, and the cheapest: you reliably notice imperfections the next day that were invisible during the build. Where the schedule allows it, this outranks every digital substitute above — it is the only one that genuinely restores fresh eyes rather than simulating them. |

## Hard geometry checks

These are pass/fail. They are not judgment calls, and they MUST be verified from screenshots at real widths rather than assumed from the CSS.

- **No horizontal scroll at 375px.** Capture at 375 wide and confirm the document is not wider than the viewport.
- **No horizontal scroll at 320px.** The narrow gate. Anything that survives 375 but breaks at 320 is a fixed width or a `min-width` that should have been a `max-width`.
- **Three viewport widths, every time.** Mobile 375 · tablet 768 · desktop 1440. For ultra-wide, zoom out to 50% to simulate rather than guessing.
- **Nothing overlapping.** No element visually sits on top of another unless it is deliberately layered (modal, popover, sticky header). Text overlapping text is always a blocker.
- **Nothing outside its container.** No child escaping its parent's bounds, no content clipped at an edge, no absolute-positioned element hanging off the layout.
- **Wide content scrolls inside its own box.** Tables, code blocks and diagrams that must be wide get their own `overflow-x` container. The page body NEVER scrolls horizontally to accommodate one wide child.
- **Touch targets ≥44×44px** at the mobile width, including their padding, and not overlapping each other.
- **Nothing clipped by a sticky or fixed element.** Scroll to the top and to the bottom at each width; a fixed header MUST NOT cover the first heading after an in-page anchor jump, and a fixed footer MUST NOT sit on the last form control.
- **Every interactive element has a visible focus state.** Tab through the page and watch. A focus ring that is invisible against its own background is the same failure as no focus ring at all.

Capture the evidence at all three widths in the same run, so the three screenshots are of the same build. Reviewing a mobile capture from before the last change is how a fixed regression gets reported and a live one gets missed.

## Contrast, measured

Contrast MUST be computed, NEVER eyeballed. "Looks fine on my monitor" is not a result. Sample the actual rendered foreground and background colors — including the ones produced by opacity stacking, which are the ones that fail.

- **WCAG 2.2 AA is the compliance floor:** **4.5:1** for normal text, **3:1** for large text (≈18.5px, or 24px at normal weight), **3:1** for non-text UI components and boundaries. That last one is the commonly-missed clause — a pale input border that a low-vision user cannot locate is a real failure, not a stylistic choice.
- **For dark themes, use APCA `Lc` as the design target.** WCAG 2's formula uses a fixed flare constant that inflates ratios near black and is polarity-blind, so it gives you no useful signal on dark surfaces. Targets: **`Lc ≥75`** for body text, **`Lc ≥45`** for larger or heavier text and fine pictograms. Treat anything below `Lc 15` as invisible.
- **Or hold a 7:1 ratio for dark themes** if you are staying inside WCAG 2 math — the AAA number, used here as a working correction for the formula's known bias rather than as an accessibility grade.
- Disabled controls are exempt from the minimums by spec. That is *why* they are usually illegible; treat the exemption as a warning, not a license.

## Console

Open the browser console on every page reviewed and read it. Read the network panel with it: a silently-failing request produces a page that renders correctly and shows the wrong data, which no perceptual test can catch.

 Errors and warnings are findings, at the same weight as visual defects — a hydration mismatch, a failed asset, a React key warning or a 404 is a real bug that a screenshot cannot show you. A review that reports "looks good" while the console is throwing is not a completed review. Check it last, after the visual passes, so it does not distract from the perceptual work.

## Triage matrix

Every issue gets exactly one of these four labels. An unlabelled finding is not actionable, because the reader cannot tell whether to stop or to file it.

| Label | Definition | Examples |
|---|---|---|
| `[Blocker]` | Critical failure requiring immediate fix | Horizontal scroll at 375; text overlapping text; contrast below 4.5:1 on body copy; a primary action that is unreachable or invisible; a console error on load |
| `[High-Priority]` | Significant issue to fix before merge | Hierarchy that collapses in grayscale; no visible focus state; a layout that breaks at 320; an empty state that renders as dead space |
| `[Medium-Priority]` | Improvement for follow-up | Spacing that reads inconsistent across a section; an easing curve that stops abruptly; a truncation rule that only shows at extreme lengths |
| `Nit:` | Minor aesthetic detail — prefix the line with the literal string, no brackets | Optical centering of an icon inside a button; a 1px baseline drift between adjacent labels |

Rank the report by severity, blockers first. Do not bury a blocker in the middle of a list of nits.

Two calibration rules keep the matrix honest. First, if everything is a blocker then nothing is — a report where more than roughly a quarter of the findings are `[Blocker]` usually means the label is being used for emphasis instead of severity. Second, a hard gate failing is always at least `[High-Priority]`; the measured checks in this file do not get downgraded because the page "looks fine anyway".

## Problems over prescriptions

Describe the problem and its impact. Do not hand over the implementation.

> Say: *"the spacing reads inconsistent with adjacent elements, creating visual clutter."*
> Do NOT say: *"change margin to 16px."*

The reason is not politeness. A prescription silently asserts that you already diagnosed the cause correctly, and it collapses the whole solution space to the one fix you happened to think of first. The person holding the design context — who knows why that element has the margin it has — is better placed to choose the fix, and can only do that if you told them what was wrong rather than what to type. Prescriptions also hide their own reasoning, so when the number turns out to be wrong nobody can tell why it was suggested.

Two consequences follow. First, a finding MUST state an observable symptom and its user-facing impact; "this feels off" is a reaction, not a finding. Second, ask "why" of your own reactions before writing them down — if you cannot name what a choice costs the user, you are reporting taste, and taste does not belong in a triage matrix.

The exception: when the design clearly violates an established pattern or a hard gate in this file, direction is appropriate. "Contrast is 3.1:1, below the 4.5:1 floor" is not a prescription — it is a measurement against a rule that was already agreed.

## Evidence-based feedback

- **Attach a screenshot for every visual issue.** A described defect is arguable; a cropped screenshot with the problem visible is not. If you cannot produce an image of it, you probably have not confirmed it.
- **Start with what works.** Open the report by naming, specifically, what the design does well — the type scale, the restraint in the palette, whichever it is. This is not softening; it is signalling that you understood the system before you started listing what is wrong with it, and it makes the criticism credible.
- **Review is not approval.** The reviewer's job is to identify concerns and insights. Deciding what to change remains with whoever owns the design.
- **Tie feedback to a goal or a use case.** "Too much blue" is unactionable. "The three blue elements compete, so at a glance there is no single primary action on this page" is a finding.

## Tests deliberately excluded

Three commonly-cited tests are NOT in the perceptual table above, and this is deliberate. Do not add them back without a source.

- **Mirror / horizontal flip test** — extremely well documented for *painting*, where it works by tricking your brain into seeing the image fresh. No credible source applies it to web or UI. Interfaces are deliberately asymmetric and reading-order-dependent in ways a painting is not, so the transfer may simply not hold.
- **Upside-down test** — no source found at all, for any medium relevant here.
- **Zoom-out / thumbnail test** — no clean primary source. The "zoom to 50%" instruction that circulates is Vercel's, and it exists to *simulate an ultra-wide viewport*, which is a different purpose entirely. Treat as folklore until sourced.

Their absence is a finding, not an oversight. If a future edit adds one of these, it needs to arrive with a citation that applies to interfaces specifically.

## Scored gate

A ban list decays. Once a named default is blocked, generation converges on a *new* uniform inside the remaining space, and the list is then fighting the last war — v0 and Same.dev both ban purple, indigo and blue outright in their shipped system prompts, and their output is still identifiable at a glance. The mechanism is stated plainly in the prior art: *"Banning the defaults isn't enough — agents converge on new uniforms once the old ones are blocked. That's why the rules come with an enforced score-then-fix loop, not a checklist."* This gate is therefore NOT redundant with the lists of forbidden nouns elsewhere in this skill, and MUST NOT be deleted as duplication: the lists name what was generic last year, and the rubric below measures whether *this* output is generic now.

The rubric is fixed. Do not add, drop, reweight or reorder checks to suit a particular build — a rubric edited to fit the work being scored measures nothing.

<!-- rubric:start -->

| # | Check | What scores full marks | What scores zero | Weight |
|---|---|---|---|---|
| 1 | **Structural DNA** — top-to-bottom section order matches no canonical order and could not be lifted onto another site unchanged | Section count, order and rhythm are derived from this project's actual content, written down before build, and alternate tall with compact; moving the order onto an unrelated site would visibly break it | The order is hero → logos → 3 cards → testimonials → 3-tier pricing → CTA, or the "premium AI" variant hero → stats bar → work grid → about split → CTA, or any sequence that could be pasted onto a different site with only the copy swapped | 15 |
| 2 | **States rendered** — empty, loading, error, disabled and `focus-visible` exist as built surfaces, not assumptions | All five are built and can be screenshotted on demand; the zero-row case is a designed surface, and the focus ring is visible against its own background | Any one of the five is missing, stubbed, or present only as an intention; a zero-row table renders as a bare header over dead space; focus is browser-default or suppressed | 15 |
| 3 | **Single-accent discipline** — one accent, everything else neutral; status color is severity-only and separate from the accent | Exactly one accent hue, rationed to a few placements per viewport, with every other surface on a neutral ramp; status hues appear only to mark severity, and a normal row is neutral | Two or more hues compete for brand duty, or the accent doubles as the status color so ordinary rows are tinted, or a status rainbow is applied to a whole list | 12 |
| 4 | **Stack-fingerprint deviation** — the output is not the default substrate | Component silhouettes, icon set, typefaces, chart rendering and motion/toast layer are each chosen deliberately; anything kept from the default substrate is named and justified in writing | Ships as shadcn `new-york` silhouettes plus `lucide-react` plus Geist or Inter plus Recharts plus the `motion` / `sonner` / `tw-animate-css` trio, untouched | 12 |
| 5 | **Radius / shadow / icon coherence** — one radius personality, one shadow language, one icon set | One radius personality with child radii concentric to parents (inner = outer − padding), shadows layered in at least two stops lit from a single direction, and one icon set at one stroke weight and a consistent size step | Radii vary with no stated rule, a single hard drop shadow or shadows lit from conflicting directions, or icons drawn from two sets or two stroke weights | 12 |
| 6 | **Optical adjustment present** — perception corrected where geometry is wrong | At least three of: optical ±1px alignment, negative tracking on large headings, positive tracking on uppercase labels, `tabular-nums` on compared figures, a real measure constraint, `text-wrap: balance` on headings — each identifiable in the CSS | None of them present; every value is raw geometry and nothing was adjusted for how it actually reads | 10 |
| 7 | **Type discipline** — a stated scale, restrained families, readable body | A type scale is written down and is not the 64 → 32 → 18 → 14 ramp; at most two families, or more only where each has a named role; desktop body is 16px or larger | No scale is stated, or it is the 64 → 32 → 18 → 14 ramp, or three-plus families accumulated without named roles, or desktop body sits below 16px | 8 |
| 8 | **Motion discipline** — animated properties named, enter and exit distinguished | Every transition lists the properties it animates, exit runs faster than enter (roughly 75%), and scroll-triggered motion is used where it clarifies cause and effect rather than everywhere | `transition: all` appears anywhere, enter and exit share one duration and curve, or fade-up-on-scroll is applied uniformly to every section | 8 |
| 9 | **Contrast measured** — numbers, from a tool | APCA `Lc ≥75` for body and `Lc ≥45` for large or heavy text (or 7:1 on dark) recorded per text role from an actual measurement, and `:hover`, `:active`, `:focus` measured above the rest state | Contrast was eyeballed, or no numbers were recorded, or interaction states measure at or below the rest state | 4 |
| 10 | **Copy and iconography specificity** — labels and marks that carry information | Every CTA names the action it performs, and icons come from a real set and appear only where they add information | A "Learn more" or "Click here" CTA, emoji standing in for icons, or an icon in a pale chip above every card | 4 |

<!-- rubric:end -->

**Blocking threshold: 80/100. Below 80/100 the output does not ship.**

Two `hard floor` checks sit above the arithmetic: **checks 1 and 2 scoring zero block regardless of total.** A build with unique structure and no error state, or with every state built on a stock section order, is not rescued by a strong total — those two are the checks that decide whether the thing is a real interface or a screenshot of one.

The pass is mandatory, and it is a loop, not a reading:

1. **Score** all ten checks and write the total.
2. If the total is below 80/100, **fix the checks losing the most points first** — highest weight lost, not easiest to fix.
3. **Rescore** the full rubric. Not just the checks you touched: a fix in one check routinely costs points in another.
4. **Record both the pre-fix and the post-fix scores in `DESIGN.md`**, per check, so the delta is inspectable later.

The rescore shares this skill's 3-iteration cap; it does not get its own budget. If a run exits the cap still under 80/100, that is a reportable outcome, not a failure to hide — **report the number and the failing checks to the user rather than claiming a pass.** Silently rounding up, dropping a check to clear the bar, or describing an unfixed run as shipped is the one failure this gate exists to prevent.
