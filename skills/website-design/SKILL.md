---
name: website-design
description: "Web and UI design work: websites, landing pages, dashboards, web apps, marketing pages, redesigns, and visual polish."
when_to_use: "Use this skill whenever the user mentions a website, landing page, dashboard, web app, UI, frontend, mockup, redesign, styling, or asks to make something look better — even if they don't say 'design'."
license: MIT
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, AskUserQuestion, Bash(${CLAUDE_SKILL_DIR}/scripts/shoot.sh *)
---

# Website design

Design is an open field; verification is a narrow bridge. Sections 1–5 are method — how to
arrive at a direction and write it down. Section 6 is a fixed protocol with exact commands.
Substance lives in `references/`; read the routed file before working in its area.

`allowed-tools` carries a `Bash(${CLAUDE_SKILL_DIR}/scripts/shoot.sh *)` entry. If that rule
does not match here, it degrades to a permission prompt — never to a skipped step.

---

## 1. Calibrate the treatment first

Before any aesthetic decision, decide which kind of artifact this is.

- **Utilitarian** — a memo, a plan, an internal tool, an admin surface. It needs clear
  hierarchy, honest states, and restraint. It does not need a visual identity, and inventing
  one costs the reader time.
- **Editorial** — a landing page, a marketing site, a product surface someone chooses to
  look at. It needs a committed point of view; a neutral treatment reads as unfinished.

**A well-composed page is never the wrong answer; an over-designed visual identity sometimes
is.** When uncertain, calibrate down and spend the effort on composition.

This runs *before* direction. A memo does not need an aesthetic direction — for utilitarian
work, sections 3 and 4 compress to a short paragraph each. Sections 5 and 6 never compress.

---

## 2. Precedence chain

Three sources, in strict order:

> **the user's own words → the project's existing system → the skill's own choices**

A lower source never overrides a higher one. The skill's own taste is the last resort, used
only where the two above it are silent.

Discover the middle source before deciding anything — Glob/Grep for project instructions, a
tokens or theme file, and the styles of components that already ship:

```bash
find . -name CLAUDE.md -not -path '*/node_modules/*'
grep -rl -e '@theme' -e '--color-' -e 'tokens' --include='*.css' --include='*.ts' . | head
```

Then read two or three existing components and write down what they already commit to:
radius personality, shadow language, spacing step, icon set. Matching an existing system is
not a compromise — an inconsistent surface is a defect regardless of how good the new part is.

**Redesigning an existing site?** Classify the mode (preserve / overhaul / greenfield) and audit
before touching anything — **`references/redesign.md`**. URL slugs, nav labels, form field names
and legal copy never change without an explicit yes.

**Escape hatch, literally:** *where the brief pins down a visual direction, follow it exactly
— including when it asks for one of these looks.* The tell list in `references/ai-tells.md`
is **calibration, not prohibition**: it describes what reads as machine-made when *no* choice
was made, and a tell fires only as a cluster across independent axes. A single artifact
proves nothing, and an explicit request outranks every entry on it.

---

## 3. Direction before code

**3 real reference sites — floor 2, cap 4 — before any code is written.** One is a copy;
beyond four you are collecting, not deciding.

Get them one of two ways:

1. **From the user.** Ask for sites or products whose look they want, then fetch each with
   WebFetch and measure it.
2. **When the user has none:** fetch candidates from the galleries listed in
   `references/direction.md` (flow libraries first, visual galleries second), then present
   the three you chose with one line each on what it contributes, and take a one-line
   confirmation before proceeding.

**Do not write code without them.** This is a blocking gate, not a preference — direction
assembled from nothing converges on the training-data average, which is the whole failure
this skill exists to prevent.

For each reference: tag one layer, take one variable, and run the six-item extraction
checklist — **see `references/direction.md`**, which also covers deriving the palette and
why moodboards produce unbuildable UI. Do not work from memory of it.

An earlier version of this skill picked direction from a list of eleven canned tone
adjectives. That was dropped because a lookup table converges — the same inputs produce the
same outputs forever, and each word resolves to its own statistical average. Measuring real
sites replaces it.

Alongside the references, answer one question in a sentence:
**what is the one thing a user will remember?**
If the answer is a generic quality rather than a specific artifact, direction is not chosen yet.

---

## 4. `DESIGN.md` before code

Write `DESIGN.md` next to the output, before the first line of CSS. Six required sections:

1. **Palette** — 4–6 hex values, each with its role **on the same line** (`#0B0D0E — Page
   background`). Status color is separate and not counted against the 4–6.
2. **Type roles** — which face does display, which does text, at what scale ratio, each with
   a **named fallback stack** rather than a bare family name.
3. **Layout concept** — the grid, the density, and the section order this project's content
   actually implies.
4. **The signature element** — the one move this design makes that the references do not.
5. **The reference set** — URLs, with what was taken from each and how it had to change here.
6. **Directions tried and rejected** — a running log, with one line on why each was dropped.

Sections 4 and 6 are the ones that get skipped and the ones that carry the most weight later:
without 6 there is no record that alternatives were considered, and the file reads as a
post-hoc description of whatever got built.

Type, color, spacing, depth and motion values — thresholds, scales, and the typeface catalog
— live in `references/craft.md`. This file names no specific face on purpose.

---

## 5. States before pages

Missing states is the single highest-signal code-level giveaway that a UI was generated
rather than designed, because tutorials render only the happy path: one array, always
populated, always loaded, always permitted. Design the empty, loading, error, disabled and
`focus-visible` surfaces **before** composing pages, and render every one against hostile
fixtures — 0 / 1 / 2 / 3–5 / many rows, three-word and three-hundred-word strings. The five
empties are different surfaces, not one: first-run, user-cleared, no-results, permission,
and error-cleared each need distinct copy. Full state taxonomy, per-component state counts,
and fixture rules: **`references/states.md`**.

**Handoff gate: the design is not done until the unhappy paths are rendered.**

### Validation checklist

Every line answered yes before sign-off. Any no → fix that area, then re-validate.

- [ ] Does it hold at 375, 768, 1024 and 1440 — no horizontal scroll at 320?
- [ ] Can you tab through every interactive element without a mouse?
- [ ] Does text contrast pass measurement, not eyeballing?
- [ ] Is there a committed direction on the page — not "modern", not "clean"?
- [ ] Is there one element a user would remember after one visit?
- [ ] Does every element have a reason to be there?
- [ ] Does it match the user's stated brief and the reference set?
- [ ] Are empty, loading, error, disabled and `focus-visible` **built surfaces** that can be
      screenshotted on demand — not intentions?
- [ ] Does a zero-row table render as a designed surface rather than a bare header over dead
      space, and does the empty state offer an action that can actually succeed?
- [ ] Has it been rendered with real records at real string lengths — lorem ipsum is legal
      while exploring and illegal at this gate?
- [ ] Does an error preserve every keystroke of user input?

---

## 6. Verification

Mandatory on every front-end change. Not conditional, not skippable, not satisfied by reading
your own source — reading the CSS confirms intent, looking at the pixels tests the result.

### Capture

Screenshots are taken with Playwright's CLI through **Bash**, then **`Read` each PNG**. The
command form:

```bash
npx playwright screenshot --viewport-size "W,H" --wait-for-selector <sel> <url> <out.png>
```

`scripts/shoot.sh` wraps exactly that command and handles browser-channel selection; it takes
`<url> <outdir> --tier quick|full`. Use either. Do not reach for a browser-automation MCP
server: skills cannot install one, and depending on it would silently break this step.

Capture against a running dev server. Start it in the background, capture, then **stop** it:

```bash
npm run dev >/tmp/dev.log 2>&1 &          # or: python3 -m http.server 8080 --directory dist
DEV_PID=$!
sleep 3
"${CLAUDE_SKILL_DIR}/scripts/shoot.sh" http://localhost:3000 /tmp/shots --tier full
kill $DEV_PID
```

A single static one-file output needs no framework server — serve its directory with
`python3 -m http.server <port> --directory <dir>` and shoot that.

### Two tiers

A single expensive protocol gets skipped, so there are two.

| Tier | Trigger | Capture |
|---|---|---|
| **Cheap** | after **every** front-end change | one desktop shot at **1440**×900 **full-page**, plus the console check |
| **Full** | at milestones — feature complete, before handoff, before review | **1440**×900 full-page, **768**×1024, **375**×812, plus the console check |

### Console check

A screenshot cannot see a thrown error. Run this against the same URL every time:

```js
// console-check.mjs — exits non-zero on any console error or uncaught page error
import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const errs = [];
page.on('console', m => m.type() === 'error' && errs.push(m.text()));
page.on('pageerror', e => errs.push(String(e)));
await page.goto(process.argv[2], { waitUntil: 'networkidle' });
await browser.close();
console.log(errs.length ? errs.join('\n') : 'console clean');
process.exit(errs.length ? 1 : 0);
```

A console error on load is a `[Blocker]`.

### Degrade loudly

If Playwright browser binaries are absent, print the fix and say so:

```
npx playwright install chromium
```

Then state plainly that **verification is blocked**. Do not skip the step, and do not claim
the output was checked. An unverified build is reported as unverified.

### Review the captures

Route the criteria to **`references/review.md`** — two passes in order, perceptual tests
(blur, placeholdifier, grayscale, slow-motion, dark mode, long/empty content), hard geometry
checks, measured contrast, and the triage matrix. Do not re-derive them here.

Then read the changed source against **`references/web-interface-guidelines.md`** (Vercel's
MUST/SHOULD/NEVER list): pixels catch what renders wrong, this catches what behaves wrong — paste
blocked, `transition: all`, `<div onClick>` navigation, zoom disabled, no `aria-label` on icon
buttons. A MUST violation is at least `[High-Priority]`.

Label every finding `[Blocker]`, `[High-Priority]`, `[Medium-Priority]` or `Nit:`, ranked
severity first.

**Termination rule: loop until zero `[Blocker]` and zero `[High-Priority]` remain, capped at
3 iterations.** After the cap, report whatever remains to the user as known issues, with the
labels intact.

### Order of the last two passes

1. **Tell check** — read the captures against `references/ai-tells.md`. Count independent
   tells across *different* categories; one category firing is noise, four or more is heavy.
2. **Refinement — subtraction only.** *If the instinct is to add an element, stop.* Assume
   the user has already said it isn't good enough; improve what exists by removing,
   tightening and correcting rather than by layering something new over the problem.

That order matters: refining before the tell check polishes the generic instead of replacing
it.

### Scored gate

The built output is scored against the ten-check rubric in `references/review.md` and **must
clear 80/100 before handoff** — with structural DNA and states-rendered unable to score zero
at any total, and a score below the threshold triggering a **fix-then-rescore** pass inside
the same 3-iteration cap. Record the pre-fix and post-fix scores per check in `DESIGN.md`.
Exiting the cap still under threshold is a reportable outcome: give the user the number and
the failing checks rather than describing the run as shipped.

---

## Router

- `references/direction.md` — read before choosing a direction: reference count, layer
  labels, the six-item extraction checklist, palette derivation, where to look.
- `references/craft.md` — read before writing CSS: type selection and scale, color, spacing,
  depth, motion, the typeface catalog with licensing, and the UX laws table.
- `references/states.md` — read before composing any page: the twelve designable states plus
  the success transition, count and string fixtures, empty-state anatomy, error copy.
- `references/stacks.md` — read when choosing or installing a stack: the only file with
  version numbers, install commands, and browser-support claims.
- `references/ai-tells.md` — read during the tell check: calibration list by category, signal
  strength, and the escape hatch for each entry.
- `references/review.md` — read during verification: two-pass method, perceptual tests, hard
  gates, triage matrix, and the scored rubric.
- `references/web-interface-guidelines.md` — read during verification: Vercel's code-level
  MUST/SHOULD/NEVER audit (vendored, pinned).
- `references/apple-motion.md` — read before building gesture-driven motion: springs, velocity
  handoff, momentum, rubber-banding, materials (vendored, pinned; motion feel, not Apple's HIG).
- `references/redesign.md` — read before changing an existing site: mode, audit, what never
  changes silently.

---

Bold maximalism and refined minimalism both work. **Intentionality is what separates designed
from generated** — and intentionality is only visible in the written artifacts this skill
demands: the reference set, `DESIGN.md`, the rendered states, and the scores.
