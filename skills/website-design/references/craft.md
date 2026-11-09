# Craft — type, color, space, depth, motion

## Contents

- [1. Type](#1-type)
- [2. Color](#2-color)
- [3. Spacing & layout](#3-spacing--layout)
- [4. Depth, borders, shadows](#4-depth-borders-shadows)
- [5. Motion](#5-motion)
- [6. Craft details](#6-craft-details)
- [7. UX laws — names to reason with](#7-ux-laws--names-to-reason-with)
- [Corrections](#corrections)


Every rule here carries a number. If a line has no number, it is a decision procedure, not a preference. Values are measured from shipped systems (Radix, Vercel Geist, Linear, Carbon, Material 3, Polaris, Tailwind v4) or from font binaries. Where something is craft convention rather than sourced fact, it says so.

---

## 1. Type

### 1.1 Selection criteria — what the project needs from a face

Choose on measurable properties, never on mood. Gate every candidate:

| Property | Threshold | Failure prevented |
|---|---|---|
| x-height / em | **≥ 0.50** for interface text | below 0.48, add +1–2px to hit the same apparent size |
| x-height / cap | **≥ 0.70** | text reads smaller than its px value promises |
| Aperture | open `c s a e` terminals | at ≤14px a closed neo-grotesque `c` reads as `o` |
| Stroke contrast | near-monolinear | hairlines drop out at 1× DPI and in dark mode |
| Weight count | **≥ 4 usable** (400/500/600/700) | you need a 500 button label and only have 400/700 |
| True italics | redrawn `a g e f`, not a slant | an obliqued sans in a pull-quote reads as a render bug |
| Tabular figures | `tnum` must exist | digits jitter on every update |
| Disambiguation | `I` / `l` / `1`, `0` / `O` distinct | misread order IDs become support tickets |
| Popularity rank | **~90–600** on Google Fonts | top-30 faces read as a default, not a decision |

Measured x/em from the binaries: Poppins 0.548 · Inter 0.5459 · Switzer 0.531 · Geist 0.530 · Roboto 0.5283 · Instrument Sans 0.510 · Satoshi 0.484 · Newsreader 0.426. Set Satoshi at 14px because Inter looked right at 14px and body copy reads ~11% smaller.

Secondary tell: **zero variable axes** is a template signal. Poppins (rank #8, geometric, static) is the strongest one in the free ecosystem.

<!-- catalog:start -->

**Serif (7)**

| Font | Source | License | Variable | Availability | Note |
|---|---|---|---|---|---|
| **Fraunces** | Google | OFL | ✅ opsz, wght, **SOFT, WONK** | `next/font/google`, `@fontsource-variable/fraunces` | The anti-Playfair; WONK axis dials in quirk |
| **Instrument Serif** | Google | OFL | ❌ | `next/font/google`, `@fontsource/instrument-serif` | Condensed high-contrast display serif of the era |
| **Newsreader** | Google (Production Type) | OFL | ✅ opsz 6–72 | `next/font/google`, `@fontsource-variable/newsreader` | Screen-first long-form; real optical sizing |
| **Bodoni Moda** | Google | OFL | ✅ opsz 6–96 | `next/font/google`, `@fontsource-variable/bodoni-moda` | Didone that survives small sizes |
| **Zodiak** | Fontshare | ⚠️ ITF FFL | ✅ 100–900 | **Not on npm** — Fontshare CDN or `next/font/local`; FFL bars self-hosting/redistribution | Didone-adjacent display with usable text weights |
| **Sentient** | Fontshare | ⚠️ ITF FFL | ✅ 200–700 + italic | **Not on npm** — CDN or `next/font/local`; FFL bars self-hosting | Editorial serif with a proper italic |
| **Redaction** | Fontsource | Free | ❌ (7 grades) | `@fontsource/redaction` | Degradation-as-design; nothing else free does this |

**Sans (8)**

| Font | Source | License | Variable | Availability | Note |
|---|---|---|---|---|---|
| **Geist** | Google (Vercel) | OFL | ✅ 100–900 | `next/font/google`, `@fontsource-variable/geist` | The Inter replacement that isn't Inter |
| **Bricolage Grotesque** | Google | OFL | ✅ opsz, wdth, wght | `next/font/google`, `@fontsource-variable/bricolage-grotesque` | Best single-family system here — display *and* text |
| **Instrument Sans** | Google | OFL | ✅ wdth, wght | `next/font/google`, `@fontsource-variable/instrument-sans` | Free width axis; pairs with Instrument Serif |
| **Host Grotesk** | Google | OFL | ✅ 300–800 | `next/font/google`, `@fontsource-variable/host-grotesk` | Reads as 2026; almost nobody has found it |
| **Mona Sans** | Google (GitHub) | OFL | ✅ wdth + wght | `next/font/google`, `@fontsource-variable/mona-sans` | Real superfamily with width, free |
| **TikTok Sans** | Google (**Grilli Type**) | OFL | ✅ opsz, slnt, wdth, wght | `next/font/google`, `@fontsource-variable/tiktok-sans` | Elite-foundry quality for free. Ignore the name |
| **Switzer** | Fontshare | ⚠️ ITF FFL | ✅ 100–900 | **Not on npm** — CDN or `next/font/local`; FFL bars self-hosting | Best free Helvetica/Suisse stand-in |
| **General Sans** | Fontshare | ⚠️ ITF FFL | ✅ 200–700 | **Not on npm** — CDN or `next/font/local`; FFL bars self-hosting | Geometric-humanist UI sans |

**Mono (5)**

| Font | Source | License | Variable | Availability | Note |
|---|---|---|---|---|---|
| **Geist Mono** | Google | OFL | ✅ 100–900 | `next/font/google`, `@fontsource-variable/geist-mono` | Variable weight is rare in monos |
| **Martian Mono** | Google (Evil Martians) | OFL | ✅ **wdth 75–112.5** | `next/font/google`, `@fontsource-variable/martian-mono` | A width axis on a mono — genuinely rare |
| **Azeret Mono** | Google (**Displaay**) | OFL | ✅ 100–900 | `next/font/google`, `@fontsource-variable/azeret-mono` | Paid-foundry quality, free |
| **Sometype Mono** | Google | OFL | ✅ 400–700 | `next/font/google`, `@fontsource-variable/sometype-mono` | Warm mono that works as a UI accent |
| **Monaspace** (Neon/Xenon/Argon) | Fontsource | OFL | ❌ | `@fontsource/monaspace-*` | Five metrically-matched monos, texture healing |

**Display (4)**

| Font | Source | License | Variable | Availability | Note |
|---|---|---|---|---|---|
| **Bevellier** | Fontshare | ⚠️ ITF FFL | ✅ 100–900 | **Not on npm** — CDN or `next/font/local`; FFL bars self-hosting | High-contrast display; far less used than Clash |
| **Clash Display** | Fontshare | ⚠️ ITF FFL | ✅ 200–700 | **Not on npm** — CDN or `next/font/local`; FFL bars self-hosting | Effective but the most-used thing on Fontshare |
| **Big Shoulders** | Google (rebuilt 2025-02-05) | OFL | ✅ opsz, wght | `next/font/google`, `@fontsource-variable/big-shoulders` | Condensed poster/editorial |
| **Bitcount** | Google (van Blokland) | OFL | ✅ 5+ axes | `next/font/google`, `@fontsource-variable/bitcount` | Parametric dot-matrix; nothing else free is this programmable |

<!-- catalog:end -->

Everything sourced from Google works with `next/font/google` and `@fontsource-variable/*`. Fontshare faces are **not published to npm** — load them from the Fontshare CDN, and note the ITF Free Font Licence forbids self-hosting, redistribution and modification (so no subsetting without written consent).

**Vary the face across projects.** Two consecutive projects on the same family is the tell that no choice was made. Run the gate table, pick a different survivor, and record the decision — family, weights shipped, why this one cleared the gates — in `DESIGN.md`. That record is what stops the next session from silently reverting to the house default.

### 1.2 Scale, line-height, measure, tracking

**Scale.** Ratio by context: 1.067–1.125 dense/admin · **1.2–1.25 general app UI** · 1.333–1.414 marketing · 1.5–1.618 editorial with ≤4 levels. Then **hand-tune** — a computed 1.25 ramp from 16px gives 16/20/25/31.25/39.06/48.83, subpixel sizes that break integer line boxes. Ship the verified Refactoring UI ladder: **12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 / 48** (+60, 72). Minimum jump 25%: 16→20, never 16→18.

Tailwind gotcha with a real failure: the size/line-height ratio is **not monotonic**. `text-lg` is 18/28 = 1.556; `text-xl` is 20/28 = 1.400. Promoting a lead paragraph from `lg` to `xl` tightens leading 10% while enlarging the text. **Set `leading-*` explicitly whenever you cross the 18→20px boundary.**

Fluid type: `slope = (Smax−Smin)/(Vmax−Vmin)`, `intercept = Smin − slope×Vmin`, then `clamp(Smin rem, intercept rem + slope×100 vw, Smax rem)`. Never a bare `vw` middle term (unzoomable, WCAG 1.4.4). Fluid the top 3–4 sizes only. With viewport units in `clamp()` for font-size, **max must be ≥ 2× min** or 200% zoom fails.

**Line-height** decreases as size increases and increases as measure increases:

```
≤13px   → 1.55–1.70      21–28px → 1.30–1.40
14–16px → 1.50–1.60      29–40px → 1.15–1.25
17–20px → 1.45–1.55      41–72px → 1.00–1.10
```

Butterick's band is 120–145% of point size. Inter's docs say a flat 1.4 — defensible in the 12–24px UI band, wrong at 48px+ (use ~1.05).

**Measure: `max-width: 32em`** — 66 characters × ~0.47em average advance, font-relative, no unit distortion. 512px at 16px, 576px at 18px. For Inter specifically, **`48ch`**; `46ch` for Geist and DM Sans.

Why not the folk `ch` rule: **`1ch` is the advance width of the digit "0", which is 1.28–1.48× the average character.** Measured ratios — Roboto 1.281, Inter 1.340, Geist 1.437, Instrument Sans 1.479, DM Sans 1.482. The consequence is that the common `ch`-based cap **measures 83–96 characters per line** in every mainstream UI sans, above Butterick's 90 ceiling and ~40% above the 66-char ideal. Verify empirically: paste real copy, count characters on three lines.

**Tracking** — Inter's published formula, recovered: `tracking = −0.0223 + 0.185 × e^(−0.1745 × size)`. It crosses zero at **~12px**, hits **−0.0110em at 16px**, and asymptotes at **−0.0223em by 48px**. All-caps and small-caps want **+0.05em to +0.12em**. Large headings **−0.02em**. Body text: leave default. Never track lowercase body, a face using `opsz` with `font-optical-sizing: auto`, monospace, or a state change.

**Weights: one family, four weights ships a complete product UI** — 400 body, 500 labels/nav/table headers/buttons, 600 section headings, 700 page title. **Never below 400** (`-webkit-font-smoothing: antialiased` renders thinner on macOS, so a 300 goes lighter still in Safari). Cap at **2 families** (3 with mono).

**Pairing:** contrast classification not degree · match x-height within **~5%** · cap-height within **~4%** · apparent width within ~5%. Inter (0.546) + Newsreader (0.426) is a **22% mismatch** — the serif looks shrunken at identical px. Superfamilies are the safe path.

**Delivery.** `font-display: optional` (100ms block, no swap) for dense product UI where CLS is the enemy; `swap` for marketing; **never `block`**. Kill CLS with `size-adjust = (webfont x/em) ÷ (fallback x/em) × 100%` — Inter/Arial = **105.2%**, Geist 102.1%, Satoshi 93.3%. Static vs variable: ≤3 weights → static wins (3 × ~15 KB beats one 60–120 KB variable file); 4+ weights or an `opsz` need → variable.

---

## 2. Color

**Structure: 1 neutral + 1 brand + 4 semantic = 6 hue families, each with a full 10–12 step ramp.** Ramps are cheap per hue; hues are expensive per screen. Radix ships 12 steps; Geist 10; Material 3 derives 5 of 6 palettes from one input hue.

**Radix's 12 steps, and the guarantee that carries the system:** 1 app bg · 2 subtle bg · 3 UI element bg · 4 hover · 5 active/selected · 6 subtle border · 7 border + focus ring · 8 hovered border · 9 solid bg · 10 hovered solid · 11 low-contrast text · 12 high-contrast text. **Steps 11 and 12 are guaranteed to Lc 60 and Lc 90 APCA on a step-2 background from the same scale.** So: text-secondary = 11, text-primary = 12, on a step-1/2 background — never on step-3+ without rechecking. Caveat: step 9 assumes white foreground, **except Sky, Mint, Lime, Yellow and Amber**, which assume dark. Always alias (`--accent-solid`), never reference `blue-9` in a component.

**Greys want 8–10 shades; primary 5–10; each accent 5–10.** The named failure conditions run both ways: *"too few greys (3–4 shades leading to compromises)"* and *"using only 5 hex codes for entire UI."* It is the **hue count** that stays small, not the step count. Per-step usage: 50–100 backgrounds · 200–300 borders/disabled · 400–500 icons/secondary text · 600–700 primary text/buttons · 800–900 headings.

**How many colors actually ship.** Linear's whole UI hierarchy runs on **4 text values and 5 background values of one neutral**, with zero hue variation in the text hierarchy; 7 chromatic hues exist and are almost all status tokens. Vercel's doctrine: *"Design in monochrome. Use color only when it adds significant meaning to state, action, or data, and pair it with a non-color cue."* Text hierarchy gets **3–4 neutral steps**; the primary action gets **one** accent; semantic hues fire only on state.

**Use a perceptual space.** All six sRGB primaries at HSL L=50% span OKLCH L **45.2 → 96.8** — a 51.6-point spread, and contrast against white varies **8×** (yellow 1.07:1, blue 8.59:1). Max chroma in sRGB varies by hue: magenta 0.322, blue 0.313, green 0.295, red 0.258, yellow 0.211, **cyan 0.155** — so a flat `C = 0.25` silently clips half your hues.

**Build a ramp: fix H, ramp L, curve C.** Evil Martians' 11-step arrays — L `[97.78, 93.56, 88.11, 82.67, 74.22, 64.78, 57.33, 46.89, 39.44, 32, 23.78]`, C `[0.0108, 0.0321, 0.0609, 0.0908, 0.1398, 0.1472, 0.1299, 0.1067, 0.0898, 0.0726, 0.054]` — chroma **peaks in the middle**, and the peak shifts by hue (Tailwind v4: red and blue peak at 600 with C 0.245, green at 500 with 0.219, amber at 400 with 0.189). A linear chroma ramp makes low steps dirty and high steps muddy.

**Neutrals: tint toward the brand hue.** Shipped neutral saturation is **2.4%–14.3%** in HSL, strongest in light backgrounds and weakest in text — Radix mauve 14.3%→4.8%, slate 11.1%→5.9%, sage 9.7%→3.1%, sand 6.7%→2.6%. Tailwind's five neutrals all sit at **L ≈ 55.1–55.6%** at step 500 and vary only C and H (neutral 0.000, stone 0.013, zinc 0.016, gray 0.027, slate 0.046). Material 3 uses HCT chroma **4** for neutral, **8** for neutral-variant. Pair grey to accent: mauve↔red/pink/purple · slate↔blue/indigo/cyan · sage↔teal/green · olive↔grass/lime · sand↔yellow/amber/orange. **Never pure black** — `#1a1a1a`; Radix gray-12 is `#202020`.

**Contrast — measure it with a tool, never by eye.** Ship **WCAG 2.2 AA 4.5:1 as the floor** for normal text (3:1 large text, 3:1 non-text and UI components under SC 1.4.11; large = 18.5px, or 24px bold by W3C's own conversion). Then hit a defensible target on top: **APCA `Lc ≥75`** for body columns (≥24px/300, 18px/400, 16px/500, 14px/700) and **`Lc ≥45`** for large or heavy text (36px normal, 24px bold) — or **7:1** if you prefer a single WCAG number for dark themes. Lc 90 is fluent body text and also the suggested *maximum* above 36px bold, because over-contrast causes halation. Lc 30 is the absolute floor for placeholder and disabled text; below Lc 15, treat it as invisible.

Why the target matters in dark mode: WCAG 2's `(L1+0.05)/(L2+0.05)` has a fixed flare constant that dominates near black. White on `#000000` scores **21.0:1** and white on `#121212` scores **18.73:1** — the formula rates pure black *better* when it is the one that causes halation. It is also polarity-blind. Real shipped pairs, computed: Radix slate-11 on slate-2 = **5.65:1**; Linear tertiary text `#8a8f98` on `#08090a` = **6.13:1**; Linear brand `#5e6ad2` on white = **4.70:1**, clearing the floor by 0.2.

**Dark mode: reduce contrast, don't invert.** Nobody ships `#000000` — Linear `#08090a`, Radix slate `#111113`, Carbon `#161616`, Material `#121212`, Tailwind `oklch(14.5% 0 0)`. Material's elevation-overlay formula is `alpha = (4.5 × ln(1+dp) + 2) / 100` → 1dp 5%, 2dp 7%, 4dp 9%, 8dp 12%, 16dp 15%, 24dp 16% — but prefer explicit surface tokens over opacity. Brand flips tone **40 → 80** (Linear `#5e6ad2` → `#7070ff`); raising L is what desaturates. Don't use pure white text: `#eeeeee` on `#121212` is 16.15:1 versus 18.73:1 for white — 2.6 points given up, still deep AAA, halation gone. And ship `:root { color-scheme: light dark; }` — it governs scrollbars, form controls and autofill, Baseline since Jan 2022.

---

## 3. Spacing & layout

**Base unit 8px. Any value not divisible by 4 is a bug unless it is an optical correction or a border width.** Shipped scales: Carbon 2/4/8/12/16/24/32/40/48/64/80/96/160 · Atlassian 0/2/4/6/8/12/16/20/24/32/40/48/64/80 · Polaris base 4 · Geist 1/2/3/4/5/6/8/10/12/16 (deliberately no 7/9/11). Tailwind v4 removed the fixed scale (`--spacing: 0.25rem × N`), so re-impose the constraint by exposing only a subset in your theme. Sub-8 values are legitimate for icon↔label gaps, input inner padding and dense cell padding — Linear ships `--button-gap` at 4/6/8px against a 24px page inline padding.

**Inset-squish** reduces top/bottom by **50%** (`8px 16px`) for buttons, cells and list items — Linear ships `0 10px / 0 12px / 0 14px / 0 16px / 0 20px` with height set separately. Don't name tokens `padding-*` / `margin-*` or you can't move a stack from margin to gap later.

**Optical adjustment, ±1px, only where perception beats geometry:**

- **Play triangle: shift right by 6.25% of the icon box.** A bbox-centered right-pointing triangle puts its centroid `w/6` to the left. Material legacy corrects +1.5dp on 24; Material Symbols +60/960.
- **Icon vertical centering:** `vertical-align: middle` aligns by x-height, not cap-height. Correct offset is `(iconHeight − capHeight) / 2` from the baseline. **SF Pro Text, Inter and Martian Mono center for free** (`ascender − capHeight = descender`); pick one and the problem disappears.
- **Round shapes overshoot square ones by 11.1%** at icon scale (Material: 18×18dp square vs Ø20dp circle) and **1.4–1.6%** at glyph scale (Roboto `O` overshoots cap by 1.37%, Open Sans 1.57%).
- **Nested radius: `innerRadius + distance = outerRadius`** → `border-radius: max(0px, calc(var(--outer) - var(--padding)))`. Outer 24 with 8 padding gives inner 16. Confirmed twice by Apple (`ContainerRelativeShape`, `ConcentricRectangle`). Linear's ladder: 4, 6, 8, 12, 16, 24, 32 + 50% + 9999px, with `--app-radius: 12px`.
- **Modals sit above true center.** Apple documents *"somewhat above center vertically"*; Ant Design hardcodes `top: 100px`. Use a fixed offset or `top: 10vh` — a specific percentage figure is craft convention, not a sourced number.

**Spacing must encode relationship, not repeat a constant.** *"Do not apply one uniform gap to every child."* Bands: related **8–12px** · grouped but distinct **16–24px** · separate sections **32–64px**. Concrete form stack — label→input **4–8px** · field→field **16–24px** · group→group **32–40px** · section→section **48–64px**. Each nesting level up should skip at least one step on the scale; the resulting within/between ratio lands near 2×, which is **craft convention derived from three shipped scales**, not a stated law. What is sourced is the direction: the outer gap must be *clearly larger*. 16 within and 20 between reads as an error; 16 within and 32 between reads as structure. **A single uniform gap is the strongest tell of machine-generated UI.**

Corollary: *"Prefer spacing, alignment, typography, and a change in density before borders or boxes."* If you need a border to show a group, your spacing already failed. Let the parent own the gap — `.stack > * + * { margin-block-start: var(--space, 1.5rem); }` never double-spaces against parent padding.

**Negative space: start with too much.** Cards and panels **24–32px minimum** · sections **48–96px vertical** · page margins **16–24px mobile**. Card padding: **16px dense, 24px default, 32px hero**, never below 16 except in a table cell. Tune inside and outside independently — a 24px-inset card in a 24px stack reads as one undifferentiated field; push the outer to 32–48. Diagnose quantity separately from intensity: if it feels **busy**, cut content; if it feels **loud**, cut competing color, scale, weight, borders, surfaces and motion.

**Density.** Carbon's ladder holds horizontal padding constant at 16px: xs **24px** row · sm **32px** · md **40px** · default **48px** · xl **64px**. Angular Material's algorithm is cleaner — every density step is exactly **−4px** (header 56→52→48→44→40, cell 52→48→44→40→36). Consensus: compact **32px**, default **40–48px**, comfortable **52–64px**. Table type **13–14px dense, 14px default**; 12px only for headers and metadata. Linear's shipped ladder: buttons 24/32/40/44px, input 46px, type 10/12/13/14/15/17px with **no 16px**, body 15px at `letter-spacing: -0.011em`. **Density is bought with padding and row height, never by shrinking or greying type.**

**Alignment.** Left-align by default. Center titles and short phrases only — **anything that wraps to a second line is left-aligned**, and never justify (W3C F88 documents justification as a failure). Right-align numeric columns **and their headers, including placeholders and totals**; never center a header above right-aligned values; bottom-align multi-line headers. Every object aligns to a shared edge, baseline or grid line; a split heading and paragraph align on their **first text baselines**.

**Containers.** Reading prose **640px** (85 occurrences in Linear's CSS, its most common max-width; 672px Carbon, 720px Bootstrap md). App shell 1056–1440px. Absolute page max **1584px** (Carbon). **Vary the outer margin, not the inner gutter** — Carbon holds the gutter at **32px** across every breakpoint while the page margin moves 0→16→16→16→24px; Bootstrap holds 24px. Grids: 12 columns desktop, 6 tablet, 4 mobile, with prose in 6–7 desktop columns; Carbon ships 16. Never nest a 12-column grid inside a card. Any component appearing at more than one column width should declare `container-type: inline-size` and query itself.

**Don't build a layout that depends on a baseline grid.** CSS distributes leading as half-leading from unbalanced ascender/descender metrics, so an element's box aligns while its baseline does not. `text-box: trim-both cap alphabetic` is the real fix and is **not Baseline** — ship it as progressive enhancement, pick a metric-balanced font, and enforce rhythm through the spacing scale.

---

## 4. Depth, borders, shadows

**One light source, above and slightly to the left. Every shadow on the page shares the same offset ratio: `y = 2x`.** If the small shadow is `0.5px 1px`, the large is `16px 32px`. Mixing `0 4px` with `2px 3px` puts two suns on one screen.

As elevation rises: **offset ↑, blur ↑, opacity ↓**. Layer the shadow, doubling offset and blur per layer (1 → 2 → 4 → 8 → 16), and **couple layer count to alpha so total darkness stays constant** — 1 layer @ 0.7, 3 layers @ 0.333, 5 layers @ 0.2 (Comeau); 4 @ 0.15, 5 @ 0.12, 6 @ 0.11 (Ahlin). Alpha *decreasing* outward reads sharp; *increasing* outward reads diffuse.

**Match shadow hue and saturation to the background, lower only lightness.** On `hsl(220deg 100% 80%)`, `hsl(220deg 60% 50%)` — not black, which desaturates and muddies. Declare `--shadow-color: 220deg 60% 50%` on a parent so children inherit and the shadow retints per section.

**Order of operations: spacing → border → shadow.** Same plane needing a boundary → border or a background-color step. Floating above the page temporarily (dropdown, popover, modal, dragged item, sticky header on scroll) → shadow. Grouping without a boundary → whitespace; try this first. **Shadows indicate elevation; if everything has a shadow, nothing is elevated.**

**The "1px border + soft shadow" look is not a border.** Stripe, Linear, Vercel and Radix all compose a **shadow ring** into the same property:

```css
--ds-shadow-border-base:   0 0 0 1px #00000014;   /* 8% black ring */
--ds-shadow-medium:        0px 2px 2px #0000000a, 0px 8px 8px -8px #0000000a;
--ds-shadow-border-medium: var(--ds-shadow-border-base), var(--ds-shadow-medium);
```

It consumes no layout space, composes into one animatable property, and alpha-blends over any background — which makes the dark-mode flip a one-token change. Radix builds every level from `--shadow-2` up starting with `0 0 0 1px var(--gray-a3)`.

**Shipped values worth copying.** Tailwind v4 grows a **negative spread** with blur so high levels don't bloat sideways (`shadow-lg: 0 10px 15px -3px rgb(0 0 0/.1), 0 4px 6px -4px rgb(0 0 0/.1)`). Material 3 ships 6 levels at dp **0, 1, 3, 6, 8, 12**, two layers (key light 0.3, ambient 0.15), **levels 4–5 reserved for hover and dragged**, state-layer opacities hover 0.08, focus 0.12, pressed 0.12, dragged 0.16. Material 2's dp-per-component map is still the best semantic answer: dialog **24**, modal drawer **16**, menu **8**, FAB 6/8/12, snackbar 6, top app bar 4, raised button 2/8, elevated card 1, outlined card 0. Polaris tints its shadow `rgba(26,26,26,…)`, alpha **0.07 → 0.28**. Apple ships no drop shadows at all — depth from blur, vibrancy and blending, with a 35% dimming layer behind clear glass.

**Operational test: count the distinct shadow values on the rendered page. More than 4, or any non-floating element carrying one, is a bug.**

**Pressed states invert the shadow.** Remove every *outer* shadow and add *inner* ones plus `translateY(1px)` — the button stops floating and becomes a dent. Polaris builds its whole button system this way, including a genuine `0px 0.5px 0px 1.5px #FFF inset` top highlight (safe because it is a shadow offset, not a border width).

**Dark mode: the ring does the separating, the shadow does the grounding.** Either kill the shadow and step the surface (Linear: ~+5 to +7 per channel per step, plus a hairline), or **invert the ring and increase the alpha** (Geist: ring `0 0 0 1px #00000014` → `#ffffff25`, shadow alpha 3.9% → 16% → 32%, roughly **4× the light-mode alpha**).

**Border tokens are alpha over the current background, never solid hex greys** — `rgba(0,0,0,0.08)` light, `rgba(255,255,255,0.145)` dark. An alpha border self-adjusts across every elevation step; a solid `#e5e7eb` needs one token per surface. **Skip sub-pixel widths entirely:** browsers that don't handle `0.5px` interpret it as **0px — no border**, which fails silently on a subset of devices. Get hairlines by lowering alpha, not width.

---

## 5. Motion

For **gesture-driven** motion — drag, swipe, sheets, carousels, anything the user can grab mid-flight — read `references/apple-motion.md` (vendored, audited): pointer-down response, velocity handoff, momentum projection, rubber-banding, interruptible springs. The table below covers discrete state changes.

**Duration scales to element type and travel distance.** Small, local, frequent → short. Large, far-traveling, rare → longer.

| Element | Ship this |
|---|---|
| Hover / color | **100–150ms** |
| Button `:active` | **0–120ms** (the press is instant; the number is the release) |
| Tooltip | **125–200ms**, first delayed, peers instant |
| Dropdown / popover / select | **150–250ms** |
| Modal / dialog | **200–300ms** enter |
| Drawer / sheet (travels its own height) | **300–500ms** |
| Toast | **240–400ms** |
| Backdrop dim | **700ms** or match the sheet |
| **Keyboard-triggered anything** | **0ms** |

Carbon publishes what each token is *for*: 70ms button/toggle · 110ms fade · 150ms small expansion and short-distance movement · 240ms expansion, system communication, toast · 400ms large expansion · 700ms background dimming. Linear's workhorse is **160ms** (`filter .16s`, `transform .12s`, `opacity .12s`, `height .22s`, drawers `.5s`).

**Ceiling: 200ms default for pointer-triggered UI, 300ms hard. Cross 300ms only when the element physically travels a long distance.** The multiplier is frequency, not aesthetics — 100+/day interactions (command palette, keyboard shortcuts) get **no animation ever**; tens/day (hover, list nav) get reduced or removed; occasional (modals, drawers, toasts) get standard; rare/first-time can add delight.

**Easing is asymmetric and custom. The built-in CSS easings are too weak — shipping the bare keyword is the tell.** Entering or exiting → ease-out. Moving/morphing on screen → ease-in-out. Hover/color → ease. Constant motion → linear. Each of those four names a *role*; bind it to the custom curve below, never to the CSS keyword that shares its name.

```css
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1);    /* = Linear's --ease-out-quint */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* Linear's quart — use instead of the keyword */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);    /* iOS-like; Linear ships it on 500ms */
--ease-quad:   cubic-bezier(.25, .46, .45, .94);  /* Linear's default, at 160ms */
```

Material 3's `standard` and `emphasized` are **both `cubic-bezier(0.2, 0, 0, 1)`** (verified from the generated `_md-sys-motion.scss`, not the docs page). Use an accelerating (ease-in) curve **only** when an element leaves the viewport permanently and won't return by the same path — a dismissed toast, a deleted row. Ease-out for everything else including reversible exits; ~95% of web UI exits are the reversible kind.

**Exit is faster than entrance — roughly 75% of the enter duration, floor 100ms.** A 250ms dropdown enter gets a ~150–190ms exit. Rationale: on enter the user is reading new content and motion aids comprehension; on exit they have already decided, so remaining motion is pure latency. *Slow where the user is deciding, fast where the system is responding.*

**Distance and scale.** Prefer percentages: `translateY(100%)` moves an element by its own height regardless of dimensions. Subtle list-item entrance **8px** · card hover lift **2–10px** · sheet/drawer/toast **`translateY(100%)`**. Never animate from `scale(0)` — enter small surfaces **0.95→1**, large dialogs **~0.8→1**, tooltips **0.97→1**, button press **0.97** (range 0.95–0.98), card hover 1.05. Scale is proportional to trigger size. `transform-origin` must match the trigger; modals are the exception since they are not anchored.

**Only animate `transform` and `opacity`** — they skip layout and paint. A `height` transition recalculates layout every frame for the element *and every subsequent sibling*; on 40 rows that is guaranteed sub-60fps. **`transition: all` is banned** — it animates properties a later developer adds, including on theme switch.

**Springs where motion is gesture-driven or interruptible; beziers for discrete state changes.** Use the duration+bounce API: `{ visualDuration: 0.2, bounce: 0.2 }`. `visualDuration` **is** the perceived duration, so it coordinates directly with a CSS transition on another element; `duration` is settle time and near-useless for coordination. Apple's presets translate directly — `.smooth` bounce 0, `.snappy` 0.15, `.bouncy` 0.3, all at 0.5. Keep bounce **0.1–0.3** and avoid it in most UI.

**Stagger 30–80ms per item, and cap the total window at ≤500ms, not the item count** — `min(index * 50ms, 500ms)`. Emil's shipped example is 50ms/item, 300ms item duration, 8px translateY. Stagger is decorative; never block interaction while it plays. Wrong for any list the user sees repeatedly, data being scanned rather than read, lists that re-render on filter/sort, and anything above the fold on first paint.

**Reduced motion means fewer and gentler, not zero. Remove translate, scale and parallax; keep opacity and keep the duration** — the fade still needs time to be legible.

```css
:root { --enter-duration: 200ms; --enter-distance: 8px; --enter-scale: .95; }
@media (prefers-reduced-motion: reduce) {
  :root { --enter-distance: 0px; --enter-scale: 1; }  /* duration unchanged */
  html  { scroll-behavior: auto; }
}
```

Kill outright: parallax, autoplay carousels, scroll-linked motion, background video, looping decoration, smooth scrolling, spring bounce. Keep: opacity, color, blur, and **skeletons and loading indicators** — stripping the spinner leaves a user staring at a frozen screen.

**The motion review table.** Run it as a pass; one row per issue.

| Defect | Fix |
|---|---|
| `transition: all` | specify properties |
| `scale(0)` entry | `scale(0.95)` + `opacity: 0` |
| `ease-in` on UI | `ease-out` |
| `transform-origin: center` on a popover | set to trigger location (modals exempt) |
| Animation on a keyboard action | **remove entirely** |
| Duration > 300ms | reduce |
| Hover without `@media (hover: hover)` | add it |
| Keyframes on a rapidly-triggered element | use transitions (interruptible) |
| Same enter/exit speed | **make exit faster** |
| Elements appearing at once | stagger 30–80ms |

A single `0.4s ease` applied to everything fails eight of these ten rows at once. There is no universal default duration and no universal default curve — instead, the pair is chosen per element type and travel distance.

---

## 6. Craft details

**Focus rings: `outline` + `outline-offset`.** Outline corner angles have followed `border-radius` since Baseline **March 2023** (Chromium 94, Firefox 88), so the historical reason to reach for box-shadow is gone. Three things outline does that box-shadow cannot: it survives **forced-colors / Windows High Contrast Mode** (box-shadow rings are **stripped there — invisible to exactly the users who need them most**), it doesn't participate in layout or get clipped by `overflow: hidden` ancestors, and `outline-offset` accepts **negative** values for an inner ring on flush elements (Linear ships `outline-offset: -2px`).

Numbers: **2px minimum thickness** (WCAG 2.2 SC 2.4.13 requires a perimeter at least 2 CSS px thick). Dashed outlines need **double** — `4px dashed` to match `2px solid`, because gaps don't count. **Inner rings need 3px**: on a 150×75px button a 2px inner outline yields 740px² against a 900px² requirement and fails; 3px gives 1110px². **3:1 contrast** against adjacent colors and between focused and unfocused states. Browser defaults fail this — Safari 2.1:1 on white, Chrome 1.7:1 on a blue button, Firefox 2:1. Use `:focus-visible`, not `:focus` (Baseline March 2022), and `:focus-within` for composite controls. Separate the ring from the element edge with `outline-offset: 2px` so it stays legible on a similarly-colored surface.

**Interactive states.** Hover: darken one shade, −5–10% lightness, 100–150ms. Active: `scale(0.97)` plus another shade, **0–120ms** — `:active` applies on pointerdown so the press is instantaneous; any perceptible press delay makes users press twice. Focus: ring only, **do not change the element's color**. Every state moves *away* from the resting contrast, never toward it. Gate hover behind `@media (hover: hover) and (pointer: fine)` — ungated hover on iOS sticks until the user taps elsewhere and is the most common mobile-web polish bug. **Never change font-weight on hover** — bolder glyphs are wider, the item shifts out from under the cursor, hover re-triggers, flicker loop; change color or opacity instead.

**Disabled:** prefer `aria-disabled="true"` plus a described-by explanation and a guard in the handler — a `disabled` attribute is unfocusable, so keyboard users can't reach it or read why. Keep submit enabled until the request starts, then disable with a spinner. Disabled buttons must not carry tooltips; the explanation is unreachable by the people who need it. Disabled controls are **exempt** from WCAG contrast minimums, which is why they are usually illegible — target Lc 30 anyway.

**Cursors.** `pointer` on web-app controls (every major product ships it); `default` on desktop-app-like surfaces (editor canvas, spreadsheet, design tool). `not-allowed` on disabled. `grab`/`grabbing` applied on **pointerdown**, not `:active`. **Never `pointer` on non-interactive text** — card headings, badges, stat tiles — you make a promise you don't keep. Decorative overlays get `pointer-events: none` or they swallow every click beneath them.

**Selection.** `user-select: none` is for chrome (things that *do*): buttons, labels, nav, tabs, menu items, toolbars, `kbd`, badges, drag handles. It is **never** for content (things that *say*): prose, code, commands, file paths, IDs, order and invoice numbers, transaction refs, API keys, SHAs, **error messages** (people paste them into tickets), emails, phones, URLs, table values, timestamps. Gradient text (`background-clip: text; color: transparent`) **disappears entirely** when selected — unset `-webkit-text-fill-color` in `::selection`.

**Scrollbars.** `html { scrollbar-gutter: stable; }` — classic scrollbars are ~15px, so a page that gains one shifts layout 15px, and a modal setting `body { overflow: hidden }` jumps the page 15px right at the exact moment the modal animates in. `overscroll-behavior: contain` on modals, drawers, dropdown lists and chat logs; it works even on a non-scrolling container, which often removes the need for the `overflow: hidden` hack. `scroll-margin-top: calc(var(--header-height) + 1rem)` on every heading and `:target` (Linear ships 40px) — the only correct fix for anchors landing behind a sticky header. Custom thumbs use alpha (`scrollbar-color: #0000001a` light, `#ffffff1a` dark) so one value works over any surface. Never `scrollbar-width: none` on something the user must scroll.

**Tabular numerals** (`font-variant-numeric: tabular-nums`) on anything that updates in place — timers, live counters, progress %, tickers — plus any vertical column of numbers, diffs, version and line numbers, compared prices, and IDs (pair with `slashed-zero`). A proportional "1" is ~55–65% the width of an "8", so a centered timer shifts every second and a 10Hz stopwatch jitters ten times a second. **Wrong in prose** (a "1" carrying "0" width leaves airy holes) and in display headlines. If the webfont lacks `tnum`, the property silently does nothing — test it.

**Truncation.** The classic silent bug: flex items have implicit `min-width: auto`, so **without `min-width: 0` the ellipsis never fires**. It looks perfect with "Acme Inc" and breaks in production with a 60-character legal name. Never truncate the only identifying information — in order of preference, wrap to 2 lines (`line-clamp: 2`), middle-truncate (essential for paths, URLs, hashes and emails where the discriminating characters are at the end), truncate a different column, or truncate plus tooltip plus copy button. Never truncate error messages, monetary amounts or dates. Ship `text-wrap: balance` on headings, blockquotes and card titles (Baseline Oct 2024, capped at **6 lines in Chromium**, 10 in Firefox — design to 6) and `text-wrap: pretty` on body copy. `overflow-wrap: anywhere` (not `break-word`) for URLs, tokens, IDs and code, because only `anywhere` affects intrinsic min-content sizing.

**Icons** ride at `width: 1em; height: 1em; flex: none` — `flex: none` matters or the icon squashes when the label is long. Icon sets ship padding inside the viewBox, so a 1em icon next to 1em text works despite the arithmetic; adjust ±1px by eye per set rather than computing a ratio (**craft convention**). Carbon's one cited number: **icon↔label gap ≥ 16px / 1rem** in a button. Lucide and Feather default to 2px stroke at 24px, calibrated for ~500-weight text — with a 400-weight body font drop `stroke-width` to 1.5 (**craft convention**). Align to the first line, not the block: `margin-top: calc((1lh - 1em) / 2)` with `align-items: flex-start`.

**Loading.** Skeletons must mirror the final layout, or you convert an invisible network wait into a visible layout shift, which is strictly worse than blank space — if you can't predict the height, use a fixed-height container with a centered spinner. Skeletons showing only header, footer and background communicate nothing and should never ship. Loading buttons show a spinner and **keep the original label** (swapping "Save" → "Saving…" changes the button width and shifts the toolbar). Delay before showing a spinner, and a minimum display once shown, are **craft convention** — derive both from your own p50 latency; the pure-CSS form is `animation: fade-in 150ms ease var(--delay) both`, no JS timer and no cleanup. Optimistic updates are the real answer: rollback must be visible, and never optimistic for destructive actions.

**Touch and forms.** Target floor **24 × 24 CSS px** (WCAG 2.2 SC 2.5.8 AA); 44 × 44 is AAA and Apple's platform figure, 48 × 48 Material's. The spacing exception is how dense professional UIs stay compliant: a target passes if a 24px circle centered on it doesn't intersect another's, so 16px icons with 12px+ gaps conform. Expand hit area without changing visual size via `::after { position: absolute; inset: -8px }`. **No dead zones** — convert margin between list items to padding, or users experience the gaps as *"the app didn't register my click."* **16px is the only correct fix for iOS input zoom**; `user-scalable=no` is an accessibility violation and iOS ignores it anyway. Use `inputmode="numeric"` with `type="text"`, never `type="number"` (spinners, silent drops, broken leading zeros in ZIPs and PINs). Never block paste. `autocomplete` on anything a browser legitimately knows about the person (identity, payment, `one-time-code`); `off` on app-domain fields. `::placeholder` is not a label. `viewport-fit=cover` is **required** or `env(safe-area-inset-bottom)` returns 0 and the sticky CTA sits under the home indicator.

**Micro-details:** `…` not `...` · non-breaking spaces in `10 MB`, `⌘ K`, `Fig. 3` · curly quotes · `Intl.DateTimeFormat` and `Intl.NumberFormat`, never hand-rolled dates · `color-scheme` on `<html>` · explicit `background-color` and `color` on native `<select>` (Windows) · an SVG favicon with a `prefers-color-scheme` style tag · URL reflects state (filters, tabs, pagination, expanded panels) and Back/Forward restores scroll position.

---

## 7. UX laws — names to reason with

"Paste these UX laws into Claude" lists circulate widely (lawsofux.com is the usual source). The laws are real; the lists drop the conditions under which each one holds. Use them as names for a finding during review ("Hick: nine equal-weight CTAs"), not as rules that override measured values elsewhere in this file. Most already have a concrete rule in this skill; that rule wins.

| Law | What it actually says | In a UI | Already enforced by |
|---|---|---|---|
| **Hick's** | decision time rises with the log of the number of *equally likely* choices, `a + b·log₂(n+1)` | one primary action per view; demote the rest. Does **not** apply to scanning a familiar, ordered list (a country picker), where search time dominates | rubric, `apple-motion.md` §16 Simplicity |
| **Fitts's** | pointing time rises with `log₂(D/W + 1)` — distance over target width | big targets near where the pointer already is; edges and corners are effectively infinite on desktop | §6 Touch: 24px floor, no dead zones |
| **Jakob's** | users spend most of their time on *other* sites and expect yours to work the same | logo top-left links home, cart top-right, standard form controls | `apple-motion.md` §16 Familiarity |
| **Gestalt: proximity, similarity, common region, uniform connectedness, Prägnanz** | the eye groups by nearness, likeness, shared container, connecting lines, and reads the simplest shape | spacing does the grouping before borders do | §3 Spacing, `review.md` squint test |
| **Miller's** | short-term memory span ~7±2 items (1956); later work puts it nearer **4 chunks** (Cowan 2001) | chunk phone numbers, codes, long forms. It is **not** a reason to cap a nav at 7 items: menus are recognition, not recall | — |
| **Doherty threshold** | productivity rose sharply when system response fell under **400ms** (IBM, 1982) | acknowledge every input inside 400ms even if the work takes longer: press state, skeleton, optimistic update | §5 Motion, §6 Loading; WIG mutation target <500ms |
| **Von Restorff** | the one item that differs is remembered | exactly one visually distinct primary action per view; if three things are highlighted, none is | — |
| **Serial position** | first and last items in a list are recalled best | key nav items at the ends; the important field first in a form | — |
| **Peak-end** | an experience is judged by its most intense moment and its end | design the success screen and the worst error, not only the median screen | `states.md` (success, error copy) |
| **Goal-gradient / Zeigarnik** | effort rises as a goal gets closer; unfinished tasks stay salient (Zeigarnik's own effect replicates weakly — treat as convention) | visible progress on multi-step flows, honest step counts | — |
| **Tesler's** | every system has irreducible complexity; the question is who carries it | move it into the system: sensible defaults, inferred values, autofill | `apple-motion.md` §16 Agency |
| **Postel's** | be liberal in what you accept, conservative in what you send | accept `555 123 4567` and `(555) 123-4567`, normalize server-side, validate after typing. Liberal *parsing* never means skipping server validation | WIG Forms: accept free text, never block paste |
| **Parkinson's / Occam's** | work fills the time allowed; prefer the explanation (and design) with fewer parts | autofill to shorten tasks; cut an element before adding one | SKILL.md §6 subtraction pass |

---

## Corrections

Nine popular claims the research contradicts. Encoding any of these would make the work confidently wrong. The left column is what circulates; the right column is what is true.

| # | Claim | Reality |
|---|---|---|
| 1 | **`max-width: 65ch` gives ~65 characters** | Measured: it gives **83–96 characters** in every common UI sans, because `1ch` = the width of "0", 1.28–1.48× the average character. Use **`32em`** or `48ch` (Inter) |
| 2 | **Material's standard easing is `cubic-bezier(0.4, 0, 0.2, 1)`** | That's **Material 2**, shipped in M3 as `easing-legacy`. In M3, `standard` **and** `emphasized` are both `cubic-bezier(0.2, 0, 0, 1)` |
| 3 | **Box-shadow for focus rings because "outline won't respect radius"** | **Obsolete.** Outline has followed `border-radius` since Baseline **March 2023**. And box-shadow rings are **stripped in Windows High Contrast Mode** — invisible to the users who need them most |
| 4 | **The `* { transition-duration: 0.01ms !important }` reduced-motion snippet** | It can **paradoxically speed up** JS-driven motion. Correct handling = remove translate/scale/parallax, **keep** opacity and duration |
| 5 | **60-30-10 color rule** | Present in **none** of Radix, Geist, Vercel, Material, Carbon, Stripe, Refactoring UI, or Learn UI Design. Folk wisdom with no design-system provenance. Shipped reality is closer to **90/8/2** |
| 6 | **"~5 grays is enough"** | Refactoring UI's explicit failure condition is *"Too few greys (3-4 shades leading to compromises)."* Greys want **8–10 shades**. It's the **hue count** that stays small |
| 7 | **Pseudolocalization pads 30–40%** | No primary source states it. W3C/IBM's real table: **+200–300% for strings ≤10 chars**, **+30% for >70** |
| 8 | **NN/g has UI-density row-height guidance** | Both commonly-cited URLs **404** (verified against their 2,748-URL sitemap). `/articles/data-tables/` exists and contains **no numbers**. Take density from Carbon/Material/Angular/USWDS |
| 9 | **"Linear uses zero shadow tokens"** | Linear ships **four**; it **aliases them all to `none` in dark theme**. That's the more interesting and more defensible claim |

Also unverified, so never assert them as fact: modal optical centre at "~45%" · centred text failing past "~3 lines" · the 2× within/between spacing ratio · "40px slides look amateur" · spinner delay 200–500ms and minimum display ~500ms · icon = cap height ≈ 0.7em and stroke-matching · mirror/upside-down/thumbnail critique tests applied to UI · `cursor: pointer` on buttons (genuinely contested, no empirical study either way).
