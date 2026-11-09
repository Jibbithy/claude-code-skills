# Code quality — clean without breaking

## Contents

- [1. The iron rule — green before, green after](#1-the-iron-rule--green-before-green-after)
- [2. Descriptions and comments — WHY, never WHAT](#2-descriptions-and-comments--why-never-what)
- [3. Dead code](#3-dead-code)
- [4. Duplicate logic](#4-duplicate-logic)
- [5. Unused components and exports](#5-unused-components-and-exports)
- [6. Unnecessary complexity](#6-unnecessary-complexity)
- [7. Debug statements and debt markers](#7-debug-statements-and-debt-markers)
- [8. Silent failures — no empty catch](#8-silent-failures--no-empty-catch)
- [9. Focused and skipped tests — the baseline killer](#9-focused-and-skipped-tests--the-baseline-killer)
- [10. Type escapes — `any` and `@ts-ignore`](#10-type-escapes--any-and-ts-ignore)
- [11. Verification is website-design's Section 6](#11-verification-is-website-designs-section-6)
- [What the scanner cannot decide](#what-the-scanner-cannot-decide)


Phase 5's cleanup half. This file owns making the code smaller and clearer — comments, dead code, duplication, unused surfaces, over-abstraction, debug and debt leftovers, silent failures, type escapes — under one non-negotiable constraint: **cleanup may not change behavior.** It does **not** own the proof that the site still works; the runtime and visual verification after cleanup is `website-design`'s Section 6 protocol, routed to in §11 and never re-invented here. Every item below carries the command that detects it and the fix that is safe to apply; a claim that code is "cleaner" is worth nothing without the test state that proves nothing broke.

---

## 1. The iron rule — green before, green after

**Capture the passing signal BEFORE you touch anything, and confirm the identical signal AFTER. A cleanup that changes a test result, a build result, a type error, a lint error, or any runtime behavior is a bug — revert it, it is not a cleanup.** This is the whole discipline of the phase; everything else is technique.

1. **Record the baseline first, on untouched code.** Run the project's test, build, typecheck, and lint commands and save each result — pass/fail counts, and each command's success — before the first edit:

   ```bash
   npm test 2>&1 | tee /tmp/cq-before-test.txt          # or: pnpm test / yarn test / vitest run / pytest
   npm run build 2>&1 | tee /tmp/cq-before-build.txt     # or the project's build script
   npx tsc --noEmit 2>&1 | tee /tmp/cq-before-types.txt  # or the project's typecheck script (skip if no TS)
   npm run lint 2>&1 | tee /tmp/cq-before-lint.txt       # or: npx eslint . / the project's lint script
   ```

   Read `package.json` `scripts` (or the project's task runner) for the real command — **do not assume `npm test` exists**, and do not assume the build runs the type checker or the linter. **A passing build does not mean types or lint are clean:** many bundlers transpile without type-checking (Babel, esbuild, SWC, `transpileOnly`) and never invoke the linter, so a green `build` can sit on top of real `tsc` errors and lint failures. Capture all four signals that exist. If any baseline is already red, stop and say so: you cannot prove you didn't break something against a signal that was already broken. Fix or quarantine the failure, or get the user's go to proceed on a known-red baseline, before cleaning. (One baseline caveat: clear all §9 `focused-tests` findings *before* capturing the test baseline, or you are measuring against a suite running a fraction of its cases.)

2. **Clean in small, separately-revertable steps.** One concern at a time (§§2–10), not a sweeping refactor. Large batched edits make the "which change broke it" bisect impossible.

3. **Re-run the exact baseline commands after each step and diff against the saved output:**

   ```bash
   npm test  2>&1 | diff /tmp/cq-before-test.txt  - && echo "TEST SIGNAL UNCHANGED"
   npm run build 2>&1 | diff /tmp/cq-before-build.txt - ; echo "build exit: $?"
   npx tsc --noEmit 2>&1 | diff /tmp/cq-before-types.txt - && echo "TYPES UNCHANGED"
   npm run lint 2>&1 | diff /tmp/cq-before-lint.txt - && echo "LINT UNCHANGED"
   ```

   **Any new failure, any changed count, any build error, any new type error, any new lint error the baseline did not have → revert that step.** A cleanup that introduces an `any`, a `@ts-ignore`, or a lint violation is **not** clean — it traded one debt for another the build won't shout about; the typecheck and lint re-runs are what catch it (see §10). A test that starts passing is also a change in signal — investigate it, do not bank it as a bonus; a cleanup that flips a red test green is silently altering behavior the test was pinning.

4. **No tests? Say so, out loud, in the report — then lean on §11.** Absence of tests is not permission to skip verification; it raises the burden on the visual/runtime pass. State plainly that there was no automated signal and that correctness rests entirely on `website-design`'s Section 6 checks (rendered screenshots, console-error read, axe). The typecheck and lint signals still apply where they exist even when there are no tests — a project with no test suite may still have a clean `tsc` and lint baseline worth holding. Never describe an untested cleanup as "verified."

The scanner does not touch this rule — it reads files, it does not run your suite, build, type checker, or linter. **Running all four is yours.**

---

## 2. Descriptions and comments — WHY, never WHAT

**Comment intent and the non-obvious decision; never restate what the line already says.** A comment that narrates the code (`// increment i`) is noise that rots the moment the code changes. A comment that records *why* — the constraint, the gotcha, the road not taken — is the only kind worth writing and the only kind worth keeping.

- **Detection is by reading, not by scanner** — no `cq` check flags a missing or redundant comment, so this item is judgment, done during the read passes. Two targets: (a) restating comments to **delete**, and (b) load-bearing decisions with **no** comment, to annotate.
- **Add a comment only where the code cannot explain itself:** a workaround for a named upstream bug, a magic constant with a source, an ordering that looks arbitrary but is not, a security or correctness invariant a future edit could quietly break. The `scan.mjs` checks themselves model the voice — e.g. the `duplicate-logic` regex carries a comment explaining *why* `[^{}]` scopes it to brace-free bodies, not *what* the regex matches.
- **Do not paraphrase the code, do not add banner/section-divider comments, do not leave commented-out code** (that is §3). Prefer making the code self-describing — a named constant, a named function — over explaining an unclear line in prose.
- **This is not the design-time content pass.** Copy, labels, and alt text are `website-design` and Phase 3 (`--only legal,a11y`); this item is source-code comments only.

The safe-edit guarantee: comment changes are text-only and cannot alter behavior — but they still go through §1's re-run, because a stray character inside a block can break a parser, and a JSDoc change can shift what a type-aware build emits.

---

## 3. Dead code

**Unreachable and unreferenced code is deleted, not commented out — version control is the archive.** Dead code costs every future reader the effort of deciding whether it matters.

- **Detect** the statically-obvious cases with the scanner:

  ```bash
  node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only cq
  ```

  The `dead-code` check (id `dead-code`, group `cq`) flags `if (false)` / `if (0)` unreachable blocks. It is deliberately narrow — it catches the blatant guard-disabled block, not every dead branch. For broader coverage add the project's own tools where present: `npx eslint --rule 'no-unreachable: error' .`, `npx ts-prune`, `npx knip`, or a bundler's tree-shake/dead-code report. Commented-out code is dead code the scanner can't see — remove it on sight during the read.
- **Fix:** delete the block and everything that existed only to feed it (a variable computed solely for a dead branch, an import used only there). After deletion, §1 re-run — a "dead" branch that a test covered was not dead, and the suite will say so.

---

## 4. Duplicate logic

**Two copies of the same logic become one function, imported in both places** — a bug fixed in one copy and not the other is the failure this prevents.

- **Detect** with the scanner:

  ```bash
  node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only cq
  ```

  The `duplicate-logic` check reports identical **brace-free** function bodies (40–400 chars, whitespace-normalized) appearing in more than one place. **This is a crude static heuristic, not proof** — by construction it compares only simple, single-level function bodies (the `[^{}]` scope) and matches on normalized text, so it misses duplication that contains any nested block and cannot see near-duplicates that differ by a variable name. Treat every hit as a **lead to confirm by eye**, and expect real duplication it never reports. For a fuller pass use `npx jscpd <dir>` (token-level copy-paste detection) and confirm its hits too.
- **Fix:** extract the shared logic to one named function in a sensible module, import it at both sites, delete the copies. **Do not merge code that is only coincidentally identical** — two functions with the same body today but different reasons to change are not duplication; unifying them couples two things that should move independently. Confirm the two copies share a *reason to change* before collapsing them.
- Extraction moves behavior between files — the §1 re-run is mandatory, and this is the cleanup most likely to trip an import cycle or a subtle scope change, so do it in its own revertable step.

---

## 5. Unused components and exports

**An export nothing imports is deleted or wired up — it is not left "in case."** Dead exports inflate the bundle, widen the API surface a reader must model, and hide which code is actually load-bearing.

- **Detect** with the scanner:

  ```bash
  node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only cq
  ```

  The `unused-export` check flags an `export function <name>` whose name appears **≤1 time across all scanned source** (its own declaration, and nothing else). **This is a single-file-text reference count, not a resolver** — it is fooled both ways: it will **miss** an export that is genuinely unused but whose name collides with a local variable elsewhere (counted as a use), and it will **falsely flag** something reached only by dynamic access, re-export (`export *`), a string-keyed lookup, or an external consumer outside the scanned tree. It also only matches `export function`, not `export const X = () =>`, default exports, or exported components used solely in JSX. Treat hits as **leads to confirm**; for authority use `npx knip` or `npx ts-prune`, which resolve real imports.
- **Before deleting, confirm the symbol is truly unreachable:** grep the whole repo including tests and config, and check it is not part of a published package's public API (`package.json` `exports`/`main`, an `index` barrel, a documented entry point). An unused export that is your library's public surface is not dead — it is the product.

  ```bash
  grep -rn "\b<name>\b" <project-dir> --include=*.{js,ts,tsx,jsx,vue,svelte} | grep -v "export function <name>"
  ```
- **Fix:** delete the export and its now-orphaned dependencies, or connect it if it was meant to be used. Deleting a whole component means deleting its stylesheet, its test, and its story if those existed only for it. §1 re-run after — if a test imported the "unused" export, it was used.

---

## 6. Unnecessary complexity

**Cut abstraction that earns nothing: the one-caller indirection, the premature generalization, the config for a thing that never varies.** Simpler code that does the same work is the goal; clever code that does the same work is a liability.

- **Detection is by reading, not by scanner** — no `cq` check measures over-abstraction, so this is the judgment item of the phase, done during the two read passes. The recurring shapes to hunt:
  - **Needless indirection** — a wrapper, factory, or single-implementation "interface" with exactly one caller and one implementation; inline it.
  - **Premature generalization** — parameters, strategy hooks, or config options that only ever take one value; a "pluggable" seam with one plug. Delete the seam, keep the one behavior.
  - **Speculative generality** — code built for requirements that do not exist yet ("we might need…"). It is dead code that hasn't happened; §3 applies in spirit.
  - **Deep nesting / long parameter lists / boolean-flag functions** that would read plainly as early returns, a small object argument, or two separate functions.
- **Fix — inline, flatten, specialize — one refactor per revertable step.** This is the highest-risk cleanup for silent behavior change: collapsing an abstraction can drop an edge case the indirection was quietly handling. **Do not simplify code you do not fully understand** — an abstraction that looks pointless may absorb a case you haven't seen. When in doubt, leave it and note it rather than guess. And do not "simplify" by widening a type to `any` to make an awkward seam compile — that is a §10 escape, not a cleanup; the §1 typecheck re-run will flag it.
- **Boundary:** removing a *visual* or *interaction* abstraction (a component's variants, state handling, styling seams) is `website-design`'s call, not this skill's — do not flatten a design-system component's API in the name of code cleanup. This item is non-visual code structure only.

Because none of §6 is scanner-caught and all of it moves behavior, the §1 re-run is the only guardrail — respect it strictly, and prefer leaving a working complexity in place over shipping a simpler version you cannot prove is equivalent.

---

## 7. Debug statements and debt markers

**Ship no `console.log`/`debugger` and no unresolved debt marker in source that reaches the client or the server bundle.** Debug output leaks internals to anyone with devtools open and pollutes the console read that Section 6 (§11) depends on; a `TODO` left in shipped code is invisible debt nobody is tracking.

- **Detect** with the scanner:

  ```bash
  node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only cq
  ```

  - `console-debug` flags `console.log` / `console.debug` / `console.trace` and any `debugger` statement left in shipped source. It **skips tooling and test files** (`*.test.*`, `*.spec.*`, `scan.mjs`, seed scripts) that log legitimately, and it reads comment-stripped text, so a commented-out log does not fire. It does **not** flag `console.error`/`console.warn` — genuine error paths keep those.
  - `todo-debt` flags `TODO` / `FIXME` / `XXX` / `HACK` markers across code, CSS, HTML, and Markdown.
- **Fix:** remove the debug statement, or route it through a leveled logger the production build strips (e.g. a `log.debug` that compiles out, or a bundler `drop_console`). For a debt marker: resolve it before launch, or **move it to the tracker with a link** — a marker that survives to production is a decision to ship the debt silently.
- Both are text-only removals, but §1's re-run still applies — a deleted line inside a template literal or a JSX expression can break the parse.

---

## 8. Silent failures — no empty catch

**A `catch` that swallows the error is a bug, not error handling — every caught error is handled, rethrown, or at minimum logged.** A swallowed exception turns a real failure into silent wrong behavior you later debug blind, with no stack and no signal. This is the **no-silent-failures rule**.

- **Detect** with the scanner:

  ```bash
  node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only cq
  ```

  The `empty-catch` check (medium) flags a `catch` whose body is empty or comment-only, after comments are stripped — so `catch { /* ignore */ }` still fires: a comment naming the reason is not handling. It matches the `try/catch` block form; it does **not** see the promise form `.catch(() => {})`, which you must catch by reading.
- **Fix:** handle the error (recover, surface a real state to the user), rethrow it, or at the floor log it with context via `console.error`/the logger. If the throw genuinely cannot happen and the swallow is deliberate, that is the rare case warranting a one-line comment stating why plus, ideally, a re-raise in development — but the default is: **do not silence it.**
- Adding a rethrow or a surfaced error changes control flow — §1's re-run is mandatory, because a previously-swallowed error may now surface, and a test that was green only because the failure was hidden will (correctly) go red.

---

## 9. Focused and skipped tests — the baseline killer

**Remove every `.only` and every `.skip` before commit — a stray one silently narrows the suite that §1 trusts.** A single `describe.only`/`it.only` (or `fdescribe`/`fit`) makes the whole "green" run execute almost nothing, so the §1 baseline proves nothing; a `.skip`/`xit`/`xdescribe` quietly drops coverage you believe you have.

- **Detect** with the scanner:

  ```bash
  node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only cq
  ```

  The `focused-tests` check (high) flags `describe.only` / `it.only` / `test.only` / `context.only`, the `f`-prefixed `fdescribe` / `fit` / `ftest`, and the skipping `.skip` / `xdescribe` / `xit` / `xtest` in test files. It keys off the test-file name pattern (`*.test.*`, `*.spec.*`, `test/`, `tests/`, `__tests__/`), so a test in a file that dodges those names is missed — cross-check by eye.
- **Fix:** delete the `.only` / `f`-prefix so the full suite runs; for a `.skip`, either fix and re-enable the test or delete it with a note in the tracker — a permanently skipped test is a lie about coverage.
- **This one gates §1 itself:** clear all `focused-tests` findings **before** you capture the §1 test baseline, or the baseline is measured against a suite running a fraction of its cases and every "green after" that follows is worthless.

---

## 10. Type escapes — `any` and `@ts-ignore`

**Do not suppress the type checker; fix the type.** `any` disables checking for every value it touches and everywhere that value flows, and `@ts-nocheck` turns off checking for the whole file — both hide exactly the class of bug the type system exists to catch. A cleanup that introduces either is a regression, not a cleanup.

- **Detect** with the scanner:

  ```bash
  node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only cq
  ```

  The `type-escape` check flags `@ts-ignore` / `@ts-nocheck` (medium) and `: any` / `as any` (low) in `.ts` / `.tsx`. It is text-based, so it catches the escape hatch, not whether the underlying type is actually wrong — and it does not see *implicit* `any` from missing annotations (that needs `noImplicitAny` in `tsconfig`) or `any` laundered through a generic.
- **Fix:** give the value a real type, or `unknown` plus a narrowing check. If a suppression is genuinely unavoidable (a mistyped third-party dependency), use **`@ts-expect-error` with a comment** stating why — it *fails the build the day the underlying error goes away*, so it cannot rot the way a silent `@ts-ignore` does. Authority for what is actually broken is `tsc --noEmit` (§1), which resolves types the scanner can only text-match.
- **A cleanup must not add an escape.** Collapsing an abstraction (§6) by widening a parameter to `any` to make it compile is not simplification — it trades structure for a hole in the type system. The §1 typecheck and lint re-runs are what catch a newly-introduced `any` or suppression.

---

## 11. Verification is website-design's Section 6

**After cleanup, prove the site still works using `website-design`'s Section 6 protocol — do not invent a second one.** SKILL.md routes here for exactly this reason: the authoritative runtime and visual pass already exists in the design skill, and duplicating it would let the two drift.

- The §1 test/build/typecheck/lint signals prove the *logic and types* are unchanged. They cannot prove the *rendered page* is unchanged — a deleted import, a collapsed component, a removed "unused" export can leave every unit test green, every type resolved, and still blank a section or throw in the browser.
- So run Section 6 as written: **Playwright screenshots read back as pixels, the console-error/network check, and axe-core** for the accessibility pass (the same axe pass that is authoritative for Phase 3, which `--only legal,a11y` only approximates statically). A console error that appears after a cleanup and was not there in the baseline is a regression — treat it at the weight of a failed test (and note that §7 exists partly so the console is quiet enough to read this signal).
- The boundary, stated so it is not crossed: **screenshot capture, the perceptual review, contrast/focus/keyboard styling, and the state surfaces are `website-design`'s** (its `craft.md`, `review.md`, and Section 6). This file's job ends at "the code is clean and the suite, build, types, and lint are green as they were"; the pixels are verified there.

---

## What the scanner cannot decide

Stated plainly so a clean `--only cq` run is never mistaken for a clean codebase. The scanner reads files; it does not run your suite, build, type checker, or linter, resolve your imports, or look at the rendered page.

| Item (§) | `cq` check | What the check actually detects | What it misses — confirm manually |
| --- | --- | --- | --- |
| Comments (§2) | *none* | — | Redundant and missing comments are read-only judgment; no static signal exists |
| Dead code (§3) | `dead-code` | Literal `if (false)` / `if (0)` blocks | Every other dead branch, unreachable-after-return, commented-out code, unused locals — add `eslint`/`knip` |
| Duplicate logic (§4) | `duplicate-logic` | Identical **brace-free** function bodies, normalized, ≥2 sites | Any duplication containing a nested block; near-duplicates differing by a name — a **lead**, not proof; cross-check with `jscpd` |
| Unused exports (§5) | `unused-export` | `export function` whose name is referenced ≤1× in scanned text | `export const`/default/JSX-only exports; dynamic/re-export/string-key uses (false clears); name collisions (false flags); public-API surface — resolve with `knip`/`ts-prune` |
| Complexity (§6) | *none* | — | All of it — over-abstraction is read-only judgment; no static signal exists |
| Debug/debt (§7) | `console-debug`, `todo-debt` | `console.log`/`debug`/`trace`, `debugger`; `TODO`/`FIXME`/`XXX`/`HACK` | Logging via a wrapper/alias or through `console.error`; debt phrased in prose ("come back to this"); logs in the skipped tooling/test files |
| Silent failures (§8) | `empty-catch` | Empty or comment-only `try/catch` body | The promise form `.catch(() => {})`; a catch that "handles" with a no-op return or a swallowed rethrow — read for these |
| Focused tests (§9) | `focused-tests` | `.only`/`.skip`, `fdescribe`/`fit`, `xit`/`xdescribe` in test files | A test file the name pattern doesn't match; runner-level `--grep`/config filters outside the source |
| Type escapes (§10) | `type-escape` | `@ts-ignore`/`@ts-nocheck`, `: any` / `as any` in `.ts`/`.tsx` | Whether the underlying type is actually wrong (resolve with `tsc --noEmit`); *implicit* any (needs `noImplicitAny`); `any` laundered through generics |
| Behavior held (§1, §11) | *none* | — | The scanner never runs code; correctness is the suite/build/types/lint (§1) plus Section 6 (§11) |

**The scanner produces leads. The suite, build, typecheck, lint, and Section 6 produce the verdict.** A `cq` run with zero findings means only that the crude static checks found nothing — it says nothing about the comments not written, the abstractions not collapsed, or whether the page still renders.
