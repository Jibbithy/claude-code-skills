# Externals — audit before adopting

## Contents

- [How to read a verdict](#how-to-read-a-verdict)
- [Manus.im — NO-GO](#manusim--no-go)
- [Spline — inspiration only, runtime NO-GO](#spline--inspiration-only-runtime-no-go)
- [STRIX — go, opt-in heavy tier](#strix--go-opt-in-heavy-tier)
- [Motion — go, the default motion layer](#motion--go-the-default-motion-layer)
- [Anime.js — go, the fallback engine](#animejs--go-the-fallback-engine)
- [Kokonut UI — go, free tier only](#kokonut-ui--go-free-tier-only)
- [apple-design — go, vendor the file](#apple-design--go-vendor-the-file)
- [Security scanners — the SCA and secret-scanning tier](#security-scanners--the-sca-and-secret-scanning-tier)
- [The audit template for anything else](#the-audit-template-for-anything-else)

Every tool here was audited against its live homepage, repo, license file, and npm tarball on
**2026-09-19** — not from memory, because licenses and ownership are exactly what goes stale. Each
entry gives the verdict and the **mechanically checkable conditions** that make the verdict hold; if
a condition fails, the verdict flips. Re-verify any license before the first commercial deliverable
for a client — the check command is in each entry. A verdict with no numbered conditions is
unconditional.

## Manus.im — NO-GO

A hosted, closed-source, credit-metered autonomous AI agent (Butterfly Effect Pte. Ltd., Singapore).
It is **not a front-end library** — listing it among Anime.js/Motion/Kokonut/Spline was a category
error. It cannot be installed into a skill or a site; work happens in the vendor's cloud, so every
prompt, file, credential, and client asset handed to it leaves your control. Corporate ownership was
actively unresolved through 2026. **Do not use it for client work, and do not put it in a site.**
What the user likely wanted from this slot is either a real component library (Kokonut, shadcn) or a
visual-asset source (Spline as inspiration) — use those instead.

## Spline — inspiration only, runtime NO-GO

`spline.design`, a browser 3D editor plus a JS runtime. The license is **split, and the shipping
half is bad**: the `@splinetool/react-spline` wrapper is MIT, but `@splinetool/runtime` — the
renderer you actually ship — has **no license file and no license field**, i.e. you would be
redistributing an unlicensed closed blob into paid client deliverables. It is also heavy and calls
the Spline CDN at runtime (a third-party dependency and privacy surface on the client's site).

- **Accepted role:** `community.spline.design` as an inspiration board for hero art direction only.
- **Rejected role:** shipping the Spline runtime into a client site. Do not.
- **If a 3D hero is actually wanted:** use `react-three-fiber` + `@react-three/drei` (both MIT,
  Poimandres), or export a static image/video of the Spline scene and ship that. Either avoids the
  license and CDN problems entirely.
- **Check before ever shipping it:** `curl -s https://registry.npmjs.org/@splinetool/runtime/latest | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).license||"NONE"))'` — if that prints `NONE`, it is unshippable.

## STRIX — go, opt-in heavy tier

`usestrix/strix` (OmniSecure, Inc.), **Apache-2.0** (verified). An autonomous AI pentest agent: it
spins up a Docker sandbox with a real offensive toolkit and validates exploits. It **ships nothing**
into built sites — it is authoring/QA-time only — which is why it is safe to adopt as a Phase 6
escalation. It is the optional heavy tier **on top of** `scripts/swarm.mjs`, never the default and
never a hard dependency.

Conditions, all checkable:

1. **Install pinned, not piped.** `pipx install strix-agent==1.6.2` — **not** `curl … | bash`.
2. **Disable telemetry — it is ON by default.** `settings.py` ships `STRIX_TELEMETRY` defaulting to
   true, with PostHog and Scarf beacons. Set `STRIX_TELEMETRY=0` (and block `strix.gateway.scarf.sh`
   egress if you want belt-and-braces) before the first run. Verify: no PostHog/Scarf request leaves
   the machine during a run.
3. **It needs an LLM API budget** (it drives a model). Treat that as a cost, and never point it at a
   target that fails the Phase 6 authorization gate.
4. **Owned/staging targets only**, exactly as `references/attack-catalog.md` requires — STRIX does
   not get its own looser rules.

## Motion — go, the default motion layer

`motion` (motion.dev, formerly Framer Motion; Motion B.V. / Matt Perry), **MIT** (verified across
three sources). No install scripts, no telemetry, no runtime network calls in the shipped bundle.
This is already the animation library pinned in `website-design`'s `stacks.md` (`motion`, imported
from `motion/react`), so it is the consistent default. It is a **Phase 1 (design) concern** — invoke
`website-design` for the actual motion work; this file only records that the dependency is clean.

Conditions: (1) install **only** `motion` from public npm — `grep -r "api.motion.dev" .` returns
nothing and `.npmrc` has no `@motionplus` registry line (that proves you never pulled the paid tier);
(2) respect `prefers-reduced-motion` in every animation shipped (this is also a Phase 3 a11y item).

## Anime.js — go, the fallback engine

`animejs` (Julian Garnier), **MIT** (verified, v4.5.0; no relicense at v4, none pending in the v5
beta — the "monetization change" is sponsorware *pre-release* gating only, and everything publicly
released is plain MIT). JS-only, no runtime network calls. **Bus factor 1.** Keep it as the
documented fallback to Motion for SVG-heavy work (path morphing, line drawing, motion paths), not as
a second animation layer alongside it — pick one per project.

Conditions: (1) dependency is exactly `animejs`, pinned to an exact version with a committed
lockfile; (2) reach for native CSS animations + the Web Animations API **first** — zero bytes, zero
supply-chain — and add a library only when the motion genuinely needs it; (3) respect
`prefers-reduced-motion`.

## Kokonut UI — go, free tier only

`kokonutui.com` (Dorian Baffier), a shadcn-style **copy-paste** component registry. The **free tier
is MIT** (verified). Because components are copied into the project, the user **owns the .tsx
outright** and there is no Kokonut runtime dependency or CDN call — that is the whole reason it is
low-risk. **Bus factor 1**, but copied code keeps working even if the registry goes dark. A Phase 1
(design) concern; use it as the visual-impact layer (a hero, an animated CTA, a bento card) on top
of a shadcn/ui foundation.

Conditions: (1) **free tier only** — the Pro tier is a proprietary EULA (no redistribution, no OSS
use, no refunds), so do not buy or use Pro for client work without a separate decision; verify no
file traces to `kokonutui.pro`; (2) the copied components pull `motion`, `lucide-react`, `clsx`,
`tailwind-merge` — audit those as ordinary deps; (3) use **shadcn/ui** (MIT, Vercel) as the
structural base and Kokonut only for accent components.

## apple-design — go, vendor the file

`emilkowalski/skills` (Emil Kowalski), **MIT** (verified). One 23 KB Markdown agent-skill about
**fluid, physical, Apple-*feel* motion** — pointer-down response, direct manipulation, spring
easing. **Name-collision caveat:** it is not Apple's Human Interface Guidelines (touch-target sizes,
nav patterns, control specs). If Phase 1 needs HIG *layout* rules, this file does not supply them —
say so rather than pretending the gap is filled. It is authoring-time only and ships nothing.

Conditions: (1) **do not** run `npx skills@latest add emilkowalski/skills` (that runs a third-party
CLI); it is **vendored** (2026-09-29) at `website-design/references/apple-motion.md`, pinned to
`d16ebe60`, upstream path `skills/apple-design/SKILL.md` (the repo moved it under `skills/`), with the
"Initial Response" block stripped because it would hijack the first reply; (2) treat it as a
motion-feel option, not as HIG.

## Design references added 2026-09-29 — all markdown, all MIT

Found through vetted Instagram reels, then read at the upstream repo and pinned; none runs code.

- **Vercel Web Interface Guidelines** (`vercel-labs/web-interface-guidelines@e3d624ba`) — GO,
  vendored unmodified at `website-design/references/web-interface-guidelines.md` and used as the
  code-level pass in design verification. Its a11y/perf MUSTs are a useful cross-check for Phases 3–4
  here; this skill's own references still own the conformance claim and the CWV budget.
- **Taste Skill** (`Leonxlnx/taste-skill@ce26fc25`) — REFERENCE ONLY. Its redesign protocol, design
  system map and production-test tells were adapted into `website-design` (`redesign.md`,
  `stacks.md`, `ai-tells.md` T40–T41). Do not install it whole: its absolute bans (for example
  zero em-dashes) contradict `website-design`'s calibration-not-prohibition rule. `skill.sh` only
  prints file paths. Ignore third-party "comment DESIGN" bundles such as `djd933/claude-design-plugins`.
- **awesome-design-md** (`VoltAgent/awesome-design-md@f6961238`) — seed-only, referenced from
  `website-design/references/direction.md`.
- **21st.dev Magic MCP** (`21st-dev/magic-mcp`, ISC) — NO-GO by default: needs an `API_KEY_21ST`
  account and sends prompts and UI context to `21st.dev`, and `website-design` does not depend on MCP
  servers. Adopt only with an explicit yes from the user to that egress.

## Security scanners — the SCA and secret-scanning tier

`scripts/scan.mjs` is a **static, in-tree** reader: its `dependency-hygiene` check flags a missing
lockfile, `"*"`/`latest` deps, and lifecycle scripts, but **never resolves a CVE**; `secrets-in-bundle`
and `committed-secrets` scan the current working tree, **not git history**; `missing-sri` flags a
CDN `<script>` without integrity but does not know if the pinned library is *vulnerable*. These four
tools fill exactly those gaps. All are authoring-time and — with the one flagged exception — ship
nothing into the built site, so they get the same footprint-and-telemetry scrutiny as any shipped
library (see the audit template). Pin every scanner's version and run it in CI so the result is
reproducible.

### osv-scanner — GO, the default dependency-CVE scanner

Google / OpenSSF, **Apache-2.0** (verified), a single **Go binary**. Authoring-time only, **ships
nothing**; it queries the public OSV.dev database for CVEs affecting your resolved dependency graph —
the layer `dependency-hygiene` cannot reach. Default SCA scanner for every project.

Conditions: (1) **pin its version** (install a tagged release binary or `go install
github.com/google/osv-scanner/cmd/osv-scanner@v<x.y.z>`, not `@latest`); (2) **run it against the
committed lockfile** — `osv-scanner --lockfile=package-lock.json .` (or `pnpm-lock.yaml`/`yarn.lock`)
so results match what actually installs; a scan of an unpinned tree proves nothing. Any non-empty
result blocks launch until the flagged package is bumped or the advisory is explicitly waived with a
reason.

### gitleaks — GO, the default git-history secret scanner

Gitleaks (org), **MIT** (verified), a **Go binary**, **local-only with no egress** — it never
transmits candidate secrets anywhere. It scans the full commit history, catching a key that was
committed then deleted (still recoverable, still leaked) which `secrets-in-bundle`/`committed-secrets`
miss because they only see the working tree. Default secret scanner.

Conditions: (1) pin the version; (2) scan history, not just the tree — `gitleaks detect --source . --redact`;
(3) any hit means **rotate the exposed credential**, not just delete the line — history keeps the old
value.

### retire.js — GO, for shipped client-side libraries with known CVEs

RetireJS, **Apache-2.0** (verified). Detects **known-vulnerable client-side JS libraries that are
actually shipped** — including one pulled in via a CDN `<script>` tag, which npm-based SCA never
sees. This is the runtime-library complement to `missing-sri`: SRI proves the CDN file is unaltered,
retire.js proves the version you pinned is not itself a known-vulnerable jQuery/Angular/etc.

Conditions: (1) pin the version; (2) run it over the **built output and the HTML** so it sees CDN tags —
`retire --path ./dist` plus scanning served pages; (3) a hit means upgrade the library or drop it.

### trufflehog — GO-WITH-CONDITIONS, only when live secret verification is wanted

Truffle Security, **AGPL-3.0** — flag the license: AGPL's network-use copyleft is a real
consideration if it is ever wired into a hosted service (as an authoring-time CLI run locally it is
fine, but it is not MIT-clean like gitleaks). Its distinguishing feature, **only-verified mode, makes
live egress**: it validates candidate secrets by calling the third-party API they belong to — which
sends real (possibly live client) credentials off the machine to prove they work.

Conditions: (1) **prefer gitleaks as the default** secret scanner; reach for trufflehog only when you
specifically want live verification to cut false positives; (2) if you enable verification,
**that egress must be acceptable** for the credentials in scope — never run it against a client's
live secrets without their say-so; (3) pin the version; (4) same rotate-on-hit rule as gitleaks.

### Dependabot or Renovate — GO, a Phase 7 keeper so the clean bill does not rot

GitHub (Dependabot) or Mend (Renovate), **config-as-code** (a committed `.github/dependabot.yml` or
`renovate.json`), no runtime footprint. The scans above are a **point-in-time pass** — a graph that
is CVE-clean today grows a CVE next week. These open automated dependency-bump PRs on a schedule so
the launch-day clean bill of health stays clean. Ship one of them as a **Phase 7 deliverable**, not
as part of the one-time audit.

Conditions: (1) commit the config (pick one, not both — they conflict); (2) scope it to security and
pinned-range updates so it does not flood the repo; (3) confirm the first PR actually opens — an
unmerged config is theatre.

## The audit template for anything else

Any tool not listed above gets this before first use — the same shape these entries follow:

1. **Identify it precisely.** The exact project, repo, and npm package — not a same-named collision.
   State your confidence.
2. **License, read not guessed.** Fetch the actual `LICENSE` (repo or the published tarball). If you
   cannot read it, the verdict is no-go until you can. Note any paid/pro tier under different terms.
3. **Maintainer and bus factor.** A named org or person, whether a commercial entity backs it, and
   what happens if the sole maintainer stops.
4. **Two footprints, kept separate.** What runs on the developer machine at authoring time (install
   scripts, egress, credentials, telemetry) versus what ships into the built site (bundle bytes, CDN
   calls, runtime telemetry). Grep the shipped `dist` for `fetch`/`XMLHttpRequest`/`sendBeacon`.
   **This applies to authoring-time security *tools* (scanners) too** — a scanner gets the same
   footprint-and-telemetry scrutiny as a shipped library: e.g. STRIX telemetry (PostHog/Scarf, on by
   default) and trufflehog's verification egress are both authoring-time network activity you must
   know about before you run them.
5. **Verdict with checkable conditions.** `go` / `go-with-conditions` / `inspiration-only` / `no-go`,
   and every condition must be something a lint step or a grep can confirm. "It depends" is not a
   verdict.
