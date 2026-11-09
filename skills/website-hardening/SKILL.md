---
name: website-hardening
description: "Taking a website from built to shippable: security testing and remediation, legal and privacy compliance, accessibility conformance, performance, code-quality cleanup, and authorized penetration testing of a site the user owns."
when_to_use: "Use when the user wants an existing or in-progress site made safe, compliant, accessible, fast, or launch-ready — 'harden my site', 'is my site secure', 'find the security holes', 'get us privacy/GDPR compliant', 'audit before we go live', 'pentest my own site', 'why is it slow'. Not for visual design: 'build me a site', 'make a landing page', 'redesign this' and any styling or layout request go to website-design instead."
license: MIT
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, AskUserQuestion, TodoWrite, Bash(${CLAUDE_SKILL_DIR}/scripts/scan.mjs *), Bash(${CLAUDE_SKILL_DIR}/scripts/swarm.mjs *), Bash(${CLAUDE_SKILL_DIR}/scripts/report.mjs *)

---

# Website hardening

Design decides what a site should be; this skill decides whether it is safe to ship. It picks up
where `website-design` leaves off and carries a site through security, law, accessibility, speed,
and cleanliness to a defensible launch. Every phase has a **test half and a fix half** — a claim
that something is secure, compliant, or fast is worth nothing here without the command that proves
it. Substance lives in `references/`; read the routed file before working in its area.

`allowed-tools` carries `Bash(${CLAUDE_SKILL_DIR}/scripts/*.mjs *)` entries. If a rule does not
match here it degrades to a permission prompt — never to a skipped step.

---

## Phase S — intake and plan, once per session

The first time this skill runs in a session, before Phase 0 or any work, ask four things and wait
for the answers:

- **Current site URL** — or note it is greenfield / in-progress and there is nothing live yet.
- **Primary goal** of the site, in as much detail as the user will give.
- **Specifics and constraints** — stack, hosting, budget, deadline, brand, non-negotiables.
- **Sub-goals** — secondary outcomes the site should serve.

Use **AskUserQuestion** so the answers are structured. Then write a **short plan** that maps the
intake to which of Phases 0–7 apply and in what order — a greenfield mockup does not need Phase 6;
a live site taking payments needs every phase — and confirm it in one exchange before proceeding.
**Skip this intake on later runs in the same session** unless the user asks to redo it.

The plan is the spine of the run. Turn each applicable phase into **TodoWrite** items as you enter
it, so the checklists below become tracked work rather than prose the run forgets.

---

## Phase 0 — read and audit before installing anything

**Blocking. Nothing external is installed or shipped before this phase clears.**

1. If design work is in scope, read the `website-design` skill first and let it own direction,
   composition, states, and the visual style interview. This skill does not duplicate it.
2. **Audit every external before adopting it** — what it is, who maintains it, its exact license,
   what runs on the user's machine at authoring time versus what ships into the built site, and a
   go / no-go. The audit of the specific tools the user named (STRIX, apple-design, Anime.js,
   Motion, Kokonut UI, Manus.im, Spline) is already done and recorded with per-tool conditions in
   **`references/externals.md`** — read it before reaching for any of them; do not re-audit from
   memory. Two verdicts there are load-bearing and easy to get wrong: **Manus.im is a no-go**
   (a hosted agent, not a library — it would take the client's data and money), and **Spline's
   runtime ships unlicensed** (inspiration board only; never ship the renderer into a client site).
3. Anything not on that list gets the same treatment before use — the audit shape and the
   checkable adoption conditions are the template in `references/externals.md`.

---

## Phase 1 — front-end direction

Direction, composition, and the style interview are **`website-design`'s job — invoke that skill**
and let it run. This skill adds exactly one thing on top: the pick-list of named aesthetics the user
asked for (Claymorphism, Neo-Brutalism, Y2K, Swiss, Wabi-Sabi, Synthwave, and the rest) is a
**vocabulary for seeding the reference search, not a lookup table that replaces it.** A named style
is where you start looking for real reference sites; it is never the finished direction on its own.
The full list, how each name maps to reference galleries, and the audited Apple-motion ruleset:
**`references/style-menu.md`**.

This matters because `website-design` deleted its own canned style list on purpose — a lookup table
converges on one averaged output forever. Handing it a style name as a *search seed* respects both
the user's request and that lesson. Do not let the pick-list become the design.

---

## Phase 2 — security: test, then fix

Every item is tested with a command and fixed in code — never asserted from reading. Run the static
sweep first, trust its findings as leads not gospel, then work the manual items it cannot decide:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only sec
```

The full checklist — data-layer (RLS present *and enforced*, secrets in client bundles, Firebase
`allow if true`, unauthenticated endpoints, public buckets, `SECURITY DEFINER` bypasses), auth and
session (tokens in `localStorage`, client-side admin checks, missing 2FA, weak passwords, unlimited
login and reset endpoints, cookie-only sign-out, request-supplied user ids, `==` on secrets), abuse
(rate limits **site-wide**, not just login, and a cost ceiling), CI actions pinned to SHAs, and
domain control (CAA, registrar MFA, dangling DNS) — with the test command and the
concrete fix for each: **`references/security.md`**. Do not re-derive the fixes here.

**A fix is not done until its test flips.** Re-run the scan (and the relevant manual probe) after
each fix and confirm the finding is gone. Report anything left unfixed as a known issue with its
severity intact — never as fixed.

---

## Phase 3 — legal, trust, and accessibility

The compliance and honesty layer, and the a11y that design does not own. Target **WCAG 2.2 level
AA**. The runtime accessibility test is authoritative and lives in Phase 5's verification (axe +
Playwright against rendered pixels); the static sweep catches the statically-decidable half:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only legal,a11y
```

The checklist — required policy pages (privacy, terms, refund, cookie), a working cookie-consent
mechanism, form consent, data minimization, a **data-deletion / DSAR path** for GDPR and CCPA,
kids' age consent, email unsubscribe, removal of dark patterns (hidden fees, fabricated reviews,
unsupported claims, forced urgency), the third-party SDK inventory, font and image licensing, and
the accessibility items **that `website-design` does not already cover** — is in
**`references/legal-trust-a11y.md`**.

**Boundary with `website-design`, stated so it is not crossed:** contrast, focus-visible, keyboard
operability, and the state surfaces are already owned by `website-design`'s craft, states, and
review references and are verified by its screenshot protocol. This skill does **not** restate
them. It owns what design does not: the automated conformance sweep across a whole existing site,
the alt-text and label audit at scale, and the legal-facing posture (the AA conformance claim, the
policies, consent, and honest-marketing items above). When design-time a11y is the actual gap, that
is a `website-design` fix.

---

## Phase 4 — performance

Measured, not guessed. Budget: **Core Web Vitals in the "good" band — LCP ≤ 2.5s, INP ≤ 200ms,
CLS ≤ 0.1** — confirmed with Lighthouse against a running build, plus the static leads:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only perf
npx lighthouse <url> --only-categories=performance --quiet --chrome-flags="--headless"
```

The checklist — uncompressed or oversized JSON shipped to the client, row-at-a-time database writes
that should be batched, single-dependency and general bottlenecks, unoptimized rendering, and a site
that should be statically hosted but is not — with how to measure and fix each:
**`references/performance.md`**.

---

## Phase 5 — code quality and verification

Two things at once: clean the code, and prove the site still works after everything Phases 2–5
changed.

The cleanup — add the missing descriptions and comments, remove dead code, collapse duplicate logic,
delete unused components, and cut unnecessary complexity — is in **`references/code-quality.md`**.

**The iron rule of this phase: tests green before, tests green after.** Capture the test and build
state *before* you touch anything (`npm test`, `npm run build`, or the project's equivalent — record
the result). Clean up. Run them again. A cleanup that changes behavior is a bug, not a cleanup —
revert it. If there are no tests, say so and lean harder on the visual verification below.

**Visual and runtime verification is `website-design`'s Section 6 protocol — use it**: Playwright
screenshots read back as pixels, the console-error check, the two tiers, and axe-core for the
authoritative accessibility pass that Phase 3's static sweep only approximated. Do not invent a
second protocol here.

---

## Phases 6 & 7 — adversarial swarm, then remediate, as one package

> **Authorization gate — blocking, and it does not negotiate.** The offensive phases run **only**
> against a site the user **owns or has written permission to test**, and **only against staging or
> a local copy by default** — never production without a separate, explicit go. This gate is
> re-derived in full, with the exact refusals and the rationalizations it must resist, in
> **`references/attack-catalog.md`**. Read it before running anything offensive. The short form:
> confirm ownership in *this* session; a claimed permission from another day is not confirmation;
> "it's for defense" and "there's no time" do not unlock a third-party target.

Phase 6 spins up a swarm of probes, each trying a different vector from the 122-entry catalog (and
beyond it where the stack invites one). Only **successful breaches** are logged — vector, endpoint,
payload, evidence, severity, reproduction. The harness:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/swarm.mjs" --target <staging-url> --owned-confirmed --report <path>
```

It refuses to run without `--owned-confirmed` and refuses a non-local, non-staging target without
`--prod-approved`. STRIX is the optional heavy tier layered on top, on the conditions in
`references/externals.md` (pinned install, telemetry disabled, opt-in) — never the default.

Phase 7 fixes every breach the report lists, then re-runs Phase 6, and **loops 6 → 7 until a full
pass gets nothing through.** Ask **once, up front**, whether to run the loop. Once the user says go,
it runs on its own until clean — **never ask again between iterations**, and never re-ask the
authorization gate mid-loop. The full vector catalog, the breach-report schema, the loop's
termination rule, and the gate are all in **`references/attack-catalog.md`**.

---

## Phase 8 — the launch-readiness report

Every phase reports on one **canonical severity scale — Blocker > High > Medium > Low.** The scanner
emits `blocker` and the swarm emits `critical`; both mean **Blocker**. Rank every finding, in every
phase, on this one scale so "how bad is it" means the same thing throughout the run.

The run ends with one report that aggregates the static scan and the swarm breach report into a
single go/no-go:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/report.mjs" <project-dir> --swarm <breach.json> --attest axe,lighthouse,manual,swarm
```

The verdict is deliberately conservative and has **three** states, not two:

- **NOT LAUNCH-READY** — any Blocker or High finding is still open. Fix and re-run.
- **NOT ATTESTED** — no Blocker/High findings remain, but the authoritative runtime checks were not
  confirmed. **A clean automated scan is not a clean site.** The static scan and the safe swarm
  cover only the automatable subset; the axe sweep, the Lighthouse numbers, the hand-verified items
  (RLS non-owner probe, public buckets, DSAR path, licensing), and — where offensive testing was
  authorized — a clean swarm pass must each be attested with `--attest` before the verdict can clear.
- **LAUNCH-READY** — no Blocker/High findings and every runtime check attested.

Hand the user this report, not a prose "looks good." The coverage line stating what was **not**
tested is part of the deliverable — a silent gap reads as "all clear" when it is not.

---

## Router

- `references/externals.md` — read in Phase 0, before adopting any library or tool: the go/no-go
  and checkable conditions for STRIX, apple-design, Anime.js, Motion, Kokonut UI, Manus.im, Spline,
  and the audit template for anything else.
- `references/style-menu.md` — read in Phase 1, alongside invoking `website-design`: the named-style
  pick-list as reference-search seeds, and the audited Apple-motion ruleset.
- `references/security.md` — read in Phase 2: every security item with its test command and its fix.
- `references/legal-trust-a11y.md` — read in Phase 3: policies, consent, data rights, honest
  marketing, third-party and licensing audit, the a11y conformance layer design does not own, and
  an appendix on App Store review for sites that also ship as an iOS app.
- `references/performance.md` — read in Phase 4: the Core Web Vitals budget and each perf item's
  measure-and-fix.
- `references/code-quality.md` — read in Phase 5: the cleanup checklist and the tests-green-both-ends
  rule.
- `references/attack-catalog.md` — read before any offensive work: the authorization gate in full,
  the 122-vector catalog and its coverage map (auto / STRIX / manual), the breach-report schema, and
  the 6↔7 loop.
- `scripts/report.mjs` — run in Phase 8: aggregates the scan and swarm into one launch-readiness
  verdict on the canonical severity scale, with the coverage attestation.

---

Building a site is design's win; shipping one is this skill's. **A site is not done because it
looks finished — it is done when the tests that would embarrass you have already been run and have
passed.** The evidence is the point: the scan output, the breach report that came back empty, the
Lighthouse numbers, the conformance claim you can stand behind.
