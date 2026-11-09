# Redesign — changing a site that already exists

Adapted from `Leonxlnx/taste-skill` §11 (MIT, pinned `ce26fc25`, audited 2026-09-29). Misclassifying
the mode is the single biggest source of bad redesign output: a "freshen it up" brief handled as
greenfield breaks SEO, analytics and muscle memory the client never agreed to lose.

## 1. Classify the mode — first action

- **Preserve** — modernise without breaking the brand. Audit first, extract the existing tokens,
  evolve.
- **Overhaul** — new visual language over the existing content and information architecture. Treat
  visuals as greenfield (run Section 3's reference set); keep content and IA.
- **Greenfield** — the brand itself is changing, or the user said start over.

If the brief does not say, ask **once**: *"Should this keep the existing brand, or start visually
from scratch?"*

## 2. Audit before touching

Write this into `DESIGN.md` under a `Current state` heading before proposing anything:

- **Brand tokens** — primary/accent colors, type stack, logo treatment, radii. These become the
  project's existing system in the Section 2 precedence chain.
- **Information architecture** — page tree, primary nav, key conversion paths.
- **Content blocks** — what exists, what does work, what is filler.
- **Keep** — signature interactions, a recognisable hero, the copy voice.
- **Retire** — tells from `ai-tells.md`, broken layouts, dead links, generic stock imagery, perf traps.
- **SEO baseline** — ranking pages, meta titles, structured data, OG cards. SEO loss is the #1
  redesign risk.

## 3. What never changes silently

Change none of these without an explicit yes from the user:

- URL structure and route slugs (and add redirects for any that do change).
- Primary nav labels.
- Form field names and order — they break analytics and browser autofill.
- Section ids and button labels that analytics events hang on.
- The logo or wordmark.
- Existing legal, consent and cookie copy (that is `website-hardening`'s ground).

Also: do not regress an accessibility win the old site already had — focus states, alt text,
keyboard paths, contrast.

## 4. Levers, in order — stop when the brief is met

1. **Typography** — the biggest visual lift per unit of risk.
2. **Spacing and rhythm** — section padding, vertical rhythm.
3. **Color recalibration** — unify neutrals, keep the brand accent. A brand that is purple stays
   purple; `ai-tells.md` rules against *defaulting*, not against a hue the brand owns.
4. **Motion** — micro-interactions on existing components.
5. **Hero and key-section recomposition.**
6. **Full block replacement** — only where the block is unsalvageable.

Rule of thumb: when IA, content and SEO are sound, levers 1–4 deliver most of the value at a fraction
of the risk. Structural debt (broken IA, no system, broken mobile) justifies a full redesign — with
strict content preservation.
