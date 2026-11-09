# Claude Website Hardening

A [Claude Code](https://claude.com/claude-code) skill that takes a website from "it works" to "it's safe to launch": security testing and fixes, privacy and legal basics, accessibility, performance, code cleanup, and authorized penetration testing of a site you own. It ends with one go / no-go launch report.

```
harden my site before we go live
is my site secure?
```

## What makes it more than a checklist

**A real scanner, with a test that proves it works.** `scripts/scan.mjs` is a dependency-free Node scanner (it reads files and never sends a request) covering security, legal, accessibility, performance and code quality. It ships with a deliberately broken test site, so you can check it yourself:

```bash
node skills/website-hardening/tests/make-fixture.mjs      # build the seeded vulnerable site
node skills/website-hardening/scripts/scan.mjs --self-test
# self-test: 38 seeded defects, 38 distinct checks fired, 60 findings total.
# ✓ every seeded defect id was caught by its owning check.
```

**Pentesting with the safety gate in code, not just in the prompt.** `scripts/swarm.mjs` runs concurrent, non-destructive probes (exposed files, headers, CORS, open redirects, HTTP methods, cookie flags, a gentle rate-limit check) and logs only confirmed breaches. It **refuses to run** without `--owned-confirmed`, refuses any non-local, non-staging target without `--prod-approved`, and prints which attack families it did *not* try, so a clean run is never mistaken for full coverage. The full catalog of 122 attack vectors lives in `references/attack-catalog.md`.

**A conservative launch verdict.** `scripts/report.mjs` merges the scan and the probe results into one report on a single severity scale. It says LAUNCH-READY only when no Blocker or High finding is open *and* the checks that only work against the running site (axe, Lighthouse, the manual items) are confirmed as done.

## Phases

| Phase | Covers |
|---|---|
| S, 0 | Intake, then read and audit the project before installing anything (every third-party tool's license and ownership is checked first) |
| 2 | Security: exposed keys, secrets in git history, Postgres RLS gaps, public buckets, JWT verification, CSRF, rate limits, source maps |
| 3 | Legal, trust and accessibility: privacy and cookie basics, font and image licensing, accessibility treated as the legal exposure it is |
| 4 | Performance: measure first, then fix caching, rendering and assets |
| 5 | Code quality: dead exports, `any` escapes, and proof the rendered page didn't change |
| 6–7 | Adversarial probes, then fixes, as one package (authorization required) |
| 8 | The launch-readiness report |

Visual design is a separate skill: [claude-website-design](https://github.com/Jibbithy/claude-website-design). The two are tested so each request triggers the right one.

## Install

```bash
git clone https://github.com/Jibbithy/claude-website-hardening
cd claude-website-hardening
./install.sh
```

**Requires:** Claude Code and Node 18+. **Optional:** Playwright, axe and Lighthouse for the runtime checks, and `gitleaks` for scanning git history.

> Only test sites you own or have written permission to test. The probe script enforces this with its flags, and the skill asks before any testing.

## License

MIT
