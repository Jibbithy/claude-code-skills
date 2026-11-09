# Style menu — named aesthetics as search seeds

## Contents

- [1. The list is a search seed, not a design](#1-the-list-is-a-search-seed-not-a-design)
- [2. How to spend a style name](#2-how-to-spend-a-style-name)
- [3. The style menu](#3-the-style-menu)
- [4. A named style does not exempt the build from the gates](#4-a-named-style-does-not-exempt-the-build-from-the-gates)
- [5. Apple-motion — one selectable motion ruleset](#5-apple-motion--one-selectable-motion-ruleset)
- [6. Route to execution](#6-route-to-execution)


This file owns exactly one thing: the mapping from a named aesthetic to a place to start looking for real reference sites. It does **not** own direction, composition, palette, states, or any visual decision — those belong to `website-design`, and this file defers to it everywhere they touch. Read this in Phase 1, right after invoking `website-design`; it is a vocabulary, not a spec.

## 1. The list is a search seed, not a design

**A style name tells you where to look. It never tells you what to build.** `website-design` deleted its own canned tone list on purpose (`website-design/references/direction.md`, "Why this replaced the tone list"): a lookup table converges, because the same handful of adjectives resolve to the same training-data average forever, and each adjective carries no numbers — no color count, no type ratio, no spacing step — so every unspecified decision silently defaults to that average. Handing the model "Neo-Brutalism" as *the design* reproduces the exact statistical center this whole skill exists to escape.

The fix is to treat the name as a **query**, not an answer. "Neo-Brutalism" points you at a body of real, shipped sites; you then run `website-design`'s measure-real-sites method against a few of them — **3 references, floor 2, cap 4** (`direction.md`, "Count rule") — and derive the numbers from what those sites actually do. The name seeds the search; the measured references produce the direction. **Do not let the pick-list become the design** — that is the one failure this file exists to prevent, and it is the same failure `direction.md` was rewritten to prevent.

## 2. How to spend a style name

1. **User names a style** (or you propose one from the brief). Confirm it is a *starting point*, not a deliverable.
2. **Turn it into a search seed** — the query strings in [§3](#3-the-style-menu).
3. **Run the seed on the galleries `website-design` already vetted.** The gallery list is owned by `direction.md` ("Where to look") and is **not duplicated here** — go read it. In short: layout-driven styles (tagged `[layout]` below) go to its visual-direction tier; graphic and illustrative styles (`[texture]`) go to its non-UI visual-texture tier. Pick real sites, not contest shots.
4. **Hand the references to `website-design`** and let its extraction checklist and count rule run. Everything from here — the actual composition, type, color, spacing, motion, and the screenshot review — is `website-design`'s job. This file stops at step 3.

## 3. The style menu

The merged menu, deduped from the two source lists. **One line each: the defining visual traits, then a search seed and a tier tag.** The traits orient the search; they are not a build brief. `[layout]` → run the seed on `direction.md`'s visual-direction tier; `[texture]` → its non-UI texture tier. A style is a lens, and lenses combine — "Swiss grid + one Aurora hero" is a legitimate seed pair, subject to `direction.md`'s one-variable rule.

| # | Style | Defining visual traits | Search seed · tier |
|---|---|---|---|
| 1 | **Claymorphism / Clay** | puffy 3D rounded shapes, paired soft inner+outer shadows, candy pastels | `claymorphism ui` · `[texture]` |
| 2 | **Cybercore** | dark tech-grunge, neon HUD overlays, glitch, terminal-green mono | `cybercore interface` · `[texture]` |
| 3 | **Neo-Brutalism** | raw high-contrast blocks, thick black borders, hard offset shadows, clashing flats | `neo-brutalism web` · `[layout]` |
| 4 | **Scrapbook** | layered paper, tape, torn edges, stickers, mixed media, handwriting | `scrapbook collage website` · `[texture]` |
| 5 | **Surrealism** | dreamlike impossible scenes, floating objects, unexpected scale shifts | `surrealist art direction` · `[texture]` |
| 6 | **Y2K** | chrome, bubble type, iridescent gradients, early-2000s tech optimism | `y2k aesthetic web` · `[texture]` |
| 7 | **Pixel Art** | low-res sprite grids, dithering, tight limited palette, 8/16-bit | `pixel art ui` · `[texture]` |
| 8 | **Synthwave** | 80s neon sunset grids, magenta/cyan, chrome retro-future | `synthwave design` · `[texture]` |
| 9 | **Glassmorphism** | frosted translucent panels, backdrop blur, layered depth over a vivid ground | `glassmorphism ui` · `[layout]` |
| 10 | **Neumorphism** | monochrome soft-UI, elements extruded/inset from a single background tone | `neumorphism ui` · `[layout]` |
| 11 | **Bento Grid** | modular rounded tiles of varied size packing the viewport | `bento grid layout` · `[layout]` |
| 12 | **Editorial** | magazine typography, strong grid, large serifs, generous measure, pull quotes | `editorial web design` · `[layout]` |
| 13 | **Swiss** | International Typographic Style — grid, grotesk, flush-left, minimal color | `swiss style web design` · `[layout]` |
| 14 | **Minimalism** | extreme reduction, dominant whitespace, few elements, a single accent | `minimalist website` · `[layout]` |
| 15 | **Maximalism** | dense layered abundance, clashing color and type, ornament everywhere | `maximalist web design` · `[texture]` |
| 16 | **Luxury typography** | high-contrast didone/display serif, wide tracking, restrained palette, air | `luxury fashion typography` · `[layout]` |
| 17 | **Conceptual sketch** | hand-drawn wireframe look, pencil strokes, margin annotations | `sketch wireframe aesthetic` · `[texture]` |
| 18 | **Ethereal** | soft airy gradients, light bloom, pastel mist, delicate type | `ethereal dreamy gradient web` · `[texture]` |
| 19 | **Bohemian** | earthy warm palette, organic texture, eclectic pattern, artisanal feel | `bohemian brand design` · `[texture]` |
| 20 | **Victorian** | ornate borders, filigree, engraving, serif, deep jewel tones | `victorian ornament design` · `[texture]` |
| 21 | **Cyberpunk** | neon-noir dystopia, dense signage, glitch, high-tech-low-life grit | `cyberpunk ui design` · `[texture]` |
| 22 | **Wabi-Sabi** | imperfect natural asymmetry, muted earth tones, tactile texture, void space | `wabi sabi web design` · `[texture]` |
| 23 | **Futuristic** | sleek sci-fi, dark chrome, glow, thin geometric type, HUD framing | `futuristic ui concept` · `[texture]` |
| 24 | **Vector art** | flat crisp illustration, bold shapes, clean two-stop gradients | `vector illustration landing` · `[texture]` |
| 25 | **Collage art** | cut-and-paste mixed media, overlapping photo fragments, tactile edges | `collage art direction web` · `[texture]` |
| 26 | **Retro** | mid-century/70s palettes, groovy display type, halftone, nostalgia | `retro 70s web design` · `[texture]` |
| 27 | **Pop Art** | bold primaries, Ben-Day dots, comic outlines, high energy | `pop art design` · `[texture]` |
| 28 | **Graffiti** | spray textures, tags, stencils, urban grit | `graffiti street art web` · `[texture]` |
| 29 | **Aurora** | flowing multicolor gradient mesh/blur on a dark ground, luminous | `aurora gradient background` · `[texture]` |
| 30 | **Handwritten** | script/handwriting faces, casual personal voice, doodles | `handwritten font web design` · `[texture]` |

## 4. A named style does not exempt the build from the gates

A style is a look, and a look is not a pass. Whatever the reference measurement produces, the built result still runs this skill's static gate before it ships — and several style *classes* predictably trip a specific scanner check. The check id, the exact command, and the fix follow. This is the boundary in practice: `website-design` judges whether the aesthetic reads right; this skill proves it is still legible, fast, and licensed.

- **Low-contrast-by-design classes** — Neumorphism, Ethereal, Aurora, and pale Minimalism routinely land text below the WCAG floor because the whole point is same-tone or washed surfaces. Test: `node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <dir> --only a11y` — the `contrast` check flags any color/background pair under **4.5:1**. Fix: darken text or lighten ground until normal text clears 4.5:1 (3:1 for ≥24px or bold), keeping the aesthetic within that constraint rather than violating it; confirm at runtime with axe per Phase 5. The contrast *styling itself* is `website-design`'s to author — this gate only measures the result.
- **Asset-heavy classes** — Maximalism, Collage art, Cyberpunk, and any 3D/aurora-mesh hero ship large payloads. Test: `node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <dir> --only perf` — the `uncompressed-json` and oversized-payload checks fire above 50 KB. Fix: minify and compress, lazy-load below the fold, and hold the Core Web Vitals budget (`references/performance.md`); confirm with Lighthouse. A gorgeous hero that busts LCP 2.5s is a Phase 4 failure, not a style choice.
- **3D / rendered classes** — Futuristic and 3D-hero seeds pull toward Spline. **The Spline runtime ships unlicensed** — inspiration board only, never the renderer in a client site. Test before ever shipping it: `curl -s https://registry.npmjs.org/@splinetool/runtime/latest | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).license||"NONE"))'` — if it prints `NONE`, it is unshippable. Fix: use `react-three-fiber` + `@react-three/drei` (both MIT) or ship a static export. Full verdict in `references/externals.md`.

## 5. Apple-motion — one selectable motion ruleset

One motion aesthetic is available as a vendored, audited ruleset: `emilkowalski/skills` apple-design (**MIT**, 23 KB). Select it when the brief wants **fluid, physical, direct-manipulation motion** — pointer-down response, spring easing, interruptible transitions.

**It is already vendored** (2026-09-29) at `website-design/references/apple-motion.md`, pinned to `emilkowalski/skills@d16ebe60`, upstream path `skills/apple-design/SKILL.md`, with its "Initial Response" block stripped. Read it there as one selectable motion-feel option. **Do not** `npx skills@latest add emilkowalski/skills` — that runs an unaudited CLI. To update it, fetch the new pinned SHA with `curl`, diff it against the vendored copy, and re-strip that block.

**Name-collision caveat, load-bearing:** this is Apple-*feel* MOTION, **not** Apple's Human Interface Guidelines. It says nothing about touch-target sizes, navigation patterns, or control specs. If the brief actually wants HIG *layout* rules, **say the file does not supply them** rather than pretending the gap is filled — source HIG separately. Motion feel and HIG layout are two different things that share a brand name.

The motion work itself — timing, easing curves, enter/exit asymmetry, reduced-motion — is `website-design`'s craft and review to execute and verify (`craft.md` §5). This file only records that the ruleset is clean and how to bring it in.

## 6. Route to execution

- **Direction, composition, palette, type, spacing, states, motion, and the screenshot review** → `website-design`. This file hands it a seed and stops. Its `references/direction.md` owns the galleries and the measure-real-sites method; its `references/craft.md` owns the numbers; its `references/review.md` owns the gate. **Do not re-derive any of it here.**
- **Any library a chosen style implies** → audit it in `references/externals.md` before adopting; do not re-audit from memory. The recurring mappings and their proof commands:

| Style class | Likely library | externals verdict · proof command |
|---|---|---|
| Any motion-driven style | **Motion** (`motion/react`) | go, default · `grep -r "api.motion.dev" .` empty **and** no `@motionplus` line in `.npmrc` |
| SVG-heavy (Vector, path/line-draw, sketch) | **Anime.js** | go, fallback engine · dep pinned to exact `animejs` with committed lockfile; try native CSS/WAAPI first |
| Hero/accent components (Bento, Clay, glass CTA) | **Kokonut UI** (free tier) | go, free only · no file traces to `kokonutui.pro`; audit its `motion`/`lucide-react` deps as ordinary |
| 3D / Futuristic hero | **Spline runtime** | **runtime NO-GO** · license curl in [§4](#4-a-named-style-does-not-exempt-the-build-from-the-gates) prints `NONE`; use `react-three-fiber` or a static export |

The rule that governs this whole file, restated: a name is a search seed, the references are the direction, and no aesthetic clears a gate it never ran. Seed here, measure in `website-design`, prove in the scan.
