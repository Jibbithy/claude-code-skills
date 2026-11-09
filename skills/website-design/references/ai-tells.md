# AI Tells — Calibration List

## Contents

- [Signal strength](#signal-strength)
- [COLOR](#color)
- [TYPOGRAPHY](#typography)
- [LAYOUT](#layout)
- [COMPONENTS](#components)
- [MOTION](#motion)
- [COPY](#copy)
- [CODE-LEVEL](#code-level)
- [IMAGERY](#imagery)
- [When rules break](#when-rules-break)


A tell is never one artifact. It is the *absence of any deviation from defaults across many independent axes at once*. Before the age of AI every site looked like Bootstrap; a single pattern proves nothing. Use this list to calibrate, not to prohibit.

Where a brief pins down a visual direction, the brief's own words win — including when it asks for one of these looks. Where the brief leaves an axis free, don't spend that freedom on a default.

Each entry names the artifact, why the artifact reads as machine-made, what a working designer does instead, and the context in which the artifact is the right answer. That fourth field is not decoration: a tell with no escape hatch turns a calibration list into an argument with the user.

This is also an arms race with a short half-life. Published tell lists become prompting targets within months — the escape hatch of one generation becomes the tell of the next, which is how Space Grotesk got here. The durable signals are the structural ones (T12, T32, T15): missing states and absent optical judgment are not fixed by a prompt saying "don't use purple."

## Signal strength

**Highest signal** — near-diagnostic, low false-positive. These require *no* design decision to produce, so they are unlikely to co-occur by accident.

1. **T12** — full canonical section order, complete and in sequence.
2. **T32** — missing empty/loading/error/focus states (the strongest *code* tell).
3. **T16 + T17 + T13** as a triple — pill badge above the H1, three identical icon-top cards, uniform container width and vertical padding.
4. **T1** — indigo-to-violet gradient on background *and* CTA *and* headline text simultaneously.
5. **T24** — content shipped at `opacity: 0` and revealed only by JS.
6. **T9 / T15** — zero optical adjustment anywhere: no tracking, no spacing exceptions, no balanced headline wrap.
7. **T22** — fake testimonials, initials-only attribution, uniform praise.
8. **T20** — terminal mockup with three colored dots on a product that is not a CLI.

**Medium signal** — real, but each needs corroboration from another category before it means anything on its own:

- **T4** permanent dark mode with glow shadows.
- **T8** serif-italic accent word inside a sans headline.
- **T19** colored edge border on a card.
- **T23** uniform fade-up at one duration and one curve.
- **T7** the recycled font pairings.
- **T35** gradient blobs, mesh, and dot grids.
- **T31** "Get Started" as the primary CTA.
- **T21** round, unsourced, exactly-three stats.
- **T33** div soup and skipped heading levels.
- **T3** the untouched shadcn token block.
- **T39** the composite premium-AI shape.
- **T40** agency-portfolio decoration strips.
- **T41** placeholder identities and div-built fake screenshots.
- **T42** glassmorphism as the default card surface.
- **T43** cursor-following spotlight, beam, or glow.
- **T45** shipped-default metadata (scaffold tab title, default favicon, `*.vercel.app` URL).

**Low signal — high false-positive, do not use alone.** Each of these describes the modern web more than it describes a machine:

- **Inter by itself.** Enormous legitimate deployment by teams with real type direction. Counts only inside a cluster.
- **Em-dashes by themselves.** Many strong writers use them heavily. Only the *cadence* around them carries signal.
- **oklch color syntax.** Not a tell at all now — it is Tailwind v4 and shadcn's native output format, so it signals framework version, not authorship.
- **Opacity-only hover (T44).** Common on hand-built sites too; it only counts beside other motion tells.
- **Rounded corners.** Also card grids, sans-serif type, three of something, gradients as such, dark mode as such, and Tailwind's blue. The same goes for the "15 giveaways your site is vibe-coded" lists that circulate: pill buttons, bento grids, oversized bold headlines, thin outline icons, drop shadows and alternating section backgrounds each count only inside a cluster. Their real tells (gradients, gradient text, glow, glass, stock imagery) are already T1, T2, T4, T42 and T37.

**Detection heuristic.** Count independent tells across *different* categories — color, type, layout, component, motion, copy, code, imagery. **One category firing = noise. Four or more categories firing = heavy**, and the diagnosis is worth acting on.

## COLOR

**T1 — Indigo-to-violet gradient as the entire accent system**
- **Artifact:** `bg-gradient-to-r from-indigo-500 to-purple-500`, or the same move built on `blue-500` / `#3b82f6`; applied simultaneously to hero background, primary CTA, *and* gradient headline text.
- **Why it reads AI:** Direct descendant of Tailwind UI's original button default. Decorative rather than semantic — the identical gradient lands on unrelated elements because nothing is deciding where it belongs.
- **Counter-move:** Name color by function: `--color-action-primary`, never `--color-gradient-start`. Or commit to a hue nobody defaults into — warm earth, cream and pink, a grey-blue.
- **When it's fine:** Products whose brand genuinely *is* indigo. One gradient, used once, as a focal point, is a design choice. All three surfaces at once is the tell.

**T2 — Gradient text on headlines and metrics**
- **Artifact:** `bg-clip-text text-transparent bg-gradient-to-r` on an `h1` or a big number.
- **Why it reads AI:** Degrades legibility and makes contrast unmeasurable for zero communicative gain. It is decoration standing in for hierarchy.
- **Counter-move:** Solid color; take the emphasis from weight and scale instead.
- **When it's fine:** One word, once, where that gradient already exists in the logo.

**T3 — Verbatim shadcn oklch token block**
- **Artifact:** A `:root` carrying the unmodified default set — every neutral at chroma 0.000, exactly one chromatic `--primary`, no secondary.
- **Why it reads AI:** The fingerprint is the *untouched* token set, not the color space. oklch itself is framework-default output and proves nothing.
- **Counter-move:** Tint the neutrals — 3–5% brand hue at low saturation so the greys carry the palette. Add a secondary roughly 60° away.
- **When it's fine:** Internal tools and admin panels, where shadcn defaults are a deliberate speed decision worth defending.

**T4 — Permanent dark mode with medium-grey body text and colored glow shadows**
- **Artifact:** `background:#0f0f0f` or `slate-950` with `color:#a0a0a0` body text, plus `box-shadow: 0 0 40px rgba(157,126,195,0.5)` on cards, plus a saturated radial halo behind the hero.
- **Why it reads AI:** Dark mode as a reflex rather than a toggle, with 2022 glow-trend residue the model never aged out of. Generated dark themes routinely fail contrast at body sizes.
- **Counter-move:** Dark mode as a user choice. Push body contrast to 7:1, or measure with APCA (`Lc` ≥75 body, ≥45 large). Get elevation from offset shadows, not colored bloom.
- **When it's fine:** Developer tools, media and video apps, anything with genuine dark-room usage.

**T5 — Pure `#000` on pure `#fff`**
- **Artifact:** Exactly `#000000` text on exactly `#FFFFFF`.
- **Why it reads AI:** Nobody with type training ships pure black body text — it is harsh, and it is the naive default that requires no decision.
- **Counter-move:** A near-black around `#1a1a2e` or `#2A2A2A`; an off-white like `#fafaf8` warm or `#f8f9fb` cool.
- **When it's fine:** Deliberate brutalism, and high-contrast accessibility modes where maximum separation is the point.

## TYPOGRAPHY

**T6 — Inter, untouched, on a centered hero**
- **Artifact:** `font-family: Inter` on `.hero h1` with `text-align:center`, no second face, no tracking adjustment.
- **Why it reads AI:** The single most-detected pattern in the one empirical study of the phenomenon. Inter has become the Helvetica of the LLM era.
- **Counter-move:** Change the typeface before you change anything else — it is an hour of work and the highest-leverage single move. Candidates: Geist, Söhne, Untitled Sans, Neue Haas Grotesk, Satoshi, General Sans, Source Serif.
- **When it's fine:** Very often. Inter is a superb UI face shipped deliberately by GitHub, Figma and Mozilla. Inter *plus* centered *plus* no tracking *plus* no second face is the cluster that matters.

**T7 — The recycled AI font pairings**
- **Artifact:** Space Grotesk + Inter; Instrument Serif + Inter; Space Grotesk + Instrument Serif; Playfair Display headlines over a sans body (the AI site builders' default display serif); Geist alone doing every job.
- **Why it reads AI:** These leak straight out of prompt templates — the escape hatch itself became the tell, exactly as Poppins did a generation earlier.
- **Counter-move:** Pick a face with a real voice, and contrast the pairing by *class* (grotesque + monospace, high-contrast serif + geometric sans) rather than by vibe.
- **When it's fine:** Space Grotesk is genuinely good for technical brands. It is only a tell in the exact default pairing.

**T8 — Serif-italic accent word inside a sans headline**
- **Artifact:** `<h1>Ship <span class="font-serif italic">faster</span></h1>`
- **Why it reads AI:** Independently named by two separate catalogs. It is the model's only known move for emphasis, so it appears regardless of subject.
- **Counter-move:** Emphasize with weight, scale or color. Or set the whole headline in the display face and let it carry.
- **When it's fine:** Editorial and fashion brands where the serif is already in the identity system.

**T9 — Flat type scale, single weight, no optical tracking**
- **Artifact:** Every size off the framework's default ratio; only weights 400 and 700; `letter-spacing` never touched anywhere in the sheet.
- **Why it reads AI:** Optical adjustment is a learned habit performed against rendered output. Token-driven generation never performs it.
- **Counter-move:** A custom ratio (≈1.2 for apps, ≈1.333 for editorial). Negative tracking on display sizes (`-0.02em`), positive on small caps (`+0.05em`). Use the 300/500/600 weights that exist.
- **When it's fine:** Dense data UIs legitimately want a flat scale — magnitude there comes from the numbers, not the type.

**T10 — No balanced headline wrap, orphan lines, no measure**
- **Artifact:** A headline wrapping to a two-word last line with no `text-wrap: balance` anywhere; body lines running past 80ch with no measure constraint.
- **Why it reads AI:** The cheapest polish a working designer applies reflexively — skipped because the generator never looks at the rendered page.
- **Counter-move:** `h1,h2,h3 { text-wrap: balance }` and `p { max-width: 32em }`. Note `text-wrap: pretty` is not Baseline and is not a drop-in substitute.
- **When it's fine:** This one is a defect rather than a style; fix it.

**T11 — Tiny all-caps letter-spaced section kickers, repeated**
- **Artifact:** `text-transform:uppercase; letter-spacing:0.1em; font-size:12px` above every section heading. Cousin: `01 / 02 / 03` numbering on non-sequential content.
- **Why it reads AI:** Repetition is the signal. A kicker over *every* section is template grammar filling a slot rather than marking anything.
- **Counter-move:** Let hierarchy and vertical rhythm sequence the page. Ration kickers to roughly one per three sections.
- **When it's fine:** One eyebrow, on one section, marking a genuine mode change — that is voice, and it works.

## LAYOUT

**T12 — The canonical section order, complete and in sequence**
- **Artifact:** hero (centered) → grayscale logo bar → 3 feature cards → "How it works" 1-2-3 → stats row → 3 testimonials → 3-tier pricing with the middle tier highlighted → FAQ accordion → final CTA → footer.
- **Why it reads AI:** The highest-signal structural tell, because producing it requires zero editorial decisions. A human with a real product always has one section that doesn't fit — an odd demo, a comparison table, a manifesto, a changelog.
- **Counter-move:** Reorder. Lead with the demo or a case study. Cut two sections. Add one section that only makes sense for *this* product.
- **When it's fine:** It converts. Slop pages are not bad, just uninspired, and for a validation-stage landing page this ordering is a rational default — see the inversion below.

**T13 — Identical container width and identical vertical padding on every section**
- **Artifact:** `max-w-7xl mx-auto` plus `py-20` on all sections, `px-4` everywhere, `gap-6` on every grid.
- **Why it reads AI:** Mechanical rhythm with zero content-sensitivity. A designer varies padding by section importance and tightens gaps for related items.
- **Counter-move:** `py-12` for dense sections, `py-32` for sections that need air; `clamp(2rem, 5vw, 5rem)` for fluid spacing; at least one full-bleed section.
- **When it's fine:** Documentation sites, where uniform rhythm *is* the design and variation would read as noise.

**T14 — Centered everything, perfect symmetry**
- **Artifact:** `text-align:center; max-width:600px; margin:0 auto` hero; `grid-cols-3` as the answer to every layout question; `1fr 1fr` splits throughout.
- **Why it reads AI:** Distributional convergence — safe choices that work universally and offend no one dominate the training data, and symmetry is the safest available choice.
- **Counter-move:** Left-align the hero. Asymmetric grids (2fr/1fr, 60/40). Let one element bleed past its column.
- **When it's fine:** A short punchy hero genuinely centers well. Symmetry as a *global* rule is the tell, not symmetry itself.

**T15 — Monotonous spacing with no optical correction**
- **Artifact:** Every value a multiple of 4, never `0.875rem`; a heading sitting closer to the *previous* block than to its own content.
- **Why it reads AI:** Optical spacing requires looking at rendered output. The named failure — heading crowded against the previous block — is invisible to a generator working from tokens.
- **Counter-move:** Tight groupings for related items, generous separation between groups. Give a heading more space above than below. Break the 4px grid where the eye needs it.
- **When it's fine:** Spacing rhythm is where "designed" lives; this is a defect rather than a style.

**T39 — The composite "premium AI" shape**
- **Artifact:** Off-white or warm-grey ground (`#FAFAF8`, `#F5F0EB`) **plus** a serif display face **plus** everything centered inside one `max-width` container **plus** a row of icon-topped cards **plus** fade-up-on-scroll entrances — all five together.
- **Why it reads AI:** This is the shape a distinctiveness skill produces when it successfully avoids the *first-generation* uniform. Ban indigo and Inter and the corpus reconverges here. A skill that cannot name its own likely output signature will ship it every time.
- **Counter-move:** Break at least two of the five deliberately: an asymmetric or full-bleed composition, a non-serif display voice, cards of unequal weight, entrances scaled to element size, or a ground color derived from the subject rather than from the warm-neutral default.
- **When it's fine:** Any single element is fine — warm off-white is a good ground, serif display is a real voice, fade-up is a real technique. The five together are the uniform.

## COMPONENTS

**T16 — Pill/eyebrow badge immediately above the H1**
- **Artifact:** `<div class="badge">✨ New</div><h1>…</h1>`, often with `animate-pulse` attached.
- **Why it reads AI:** Copied straight from the shadcn Badge demo into the default AI SaaS hero. It announces nothing because nothing was announced.
- **Counter-move:** Fold the news into the headline, or use a real announcement bar that links somewhere.
- **When it's fine:** You actually shipped v2.0 this week and the badge links to the changelog.

**T17 — N identical icon-top cards, same height, same radius, same shadow**
- **Artifact:** Three to six `flex-direction: column; align-items: center` cards, each `rounded-2xl shadow-lg p-6`, each a thin-line icon plus heading plus one-line blurb — **all blurbs the same length**.
- **Why it reads AI:** Equal blurb length is the strongest sub-signal here. Real features are not equally explainable in equal words; only generated ones are.
- **Counter-move:** Break the grid. Make the flagship feature twice the size. Alternate image left and right. Vary radius by element class.
- **When it's fine:** A comparison grid where the items genuinely are peers and no one of them should dominate.

**T18 — Untouched card class plus hairline border plus wide soft shadow together**
- **Artifact:** The literal default card class string, or `border: 1px solid #e5e7eb` **and** a large diffuse shadow on the same element.
- **Why it reads AI:** Doing both means no elevation model exists. Commit to one: a defined edge, or a soft elevation.
- **Counter-move:** An elevation ladder of three to five named levels. Reach for whitespace first, then a 3–5% background lightness shift, then soft elevation, and only then a border. Cards top out near 12–16px radius; reserve the full pill for tags.
- **When it's fine:** Framework defaults in an internal tool where nobody is being asked to feel anything.

**T19 — Colored 3–4px border on one card edge**
- **Artifact:** `border-left: 4px solid #6366F1` on cards, usually clashing with the border-radius it sits inside.
- **Why it reads AI:** Called nearly as reliable a sign as em-dashes are in prose. It is emphasis applied where nothing is being emphasized.
- **Counter-move:** A background tint, or nothing at all.
- **When it's fine:** Semantic callout blocks in docs — info, warning, error — where the color is genuinely communicating severity.

**T20 — Terminal mockup with three colored dots**
- **Artifact:** Dark rounded rectangle, red/yellow/green circles top-left, invented shell output inside.
- **Why it reads AI:** Reflexive dev-tool decoration standing in for a real screenshot nobody had.
- **Counter-move:** A real screenshot, a real terminal recording, or a plain code block with no window chrome.
- **When it's fine:** You are literally shipping a CLI and the output shown is real output.

**T21 — Stats row of round unsourced numbers**
- **Artifact:** Three centered figures — "10K+ Users / 99.9% Uptime / 24/7 Support" — with no source and no date.
- **Why it reads AI:** Suspiciously round, unattributed, and always exactly three because the grid wanted three.
- **Counter-move:** Fold the metric into a customer story with a name and a date attached to it.
- **When it's fine:** Real, sourced, specific numbers — especially ones that are not round.

**T22 — Fake social proof: logo bar plus three identical testimonials**
- **Artifact:** Grayscale logos under "Trusted by"; three same-size cards, each an avatar plus "John D." plus generic praise.
- **Why it reads AI:** Uniform enthusiasm is itself the tell — if every testimonial is perfect, none of them are believable. Initials-only attribution seals it.
- **Counter-move:** One long testimonial with a full name, title, company, photo, and a specific number ("cut reconciliation from 6 hours to 40 minutes"). Break the symmetry: one big, two small.
- **When it's fine:** Real logos you are contractually allowed to display, and quotes from people who exist.

**T40 — Agency-portfolio decoration strips**
- **Artifact:** Section-number labels (`001 · Capabilities`, `01 / 4` on tiles), a locale/time/weather strip (`LIS 14:23 · 18°C`), a `Scroll ↓` cue, version stamps on a marketing page (`v0.6`, `Build 0048`), pills overlaid on photos, a colored status dot before every nav item or row, a `BRAND · MOTION · SPATIAL` mono strip under the hero.
- **Why it reads AI:** Each one imitates the texture of a design-studio portfolio without carrying information; generators reach for them when told to "look designed". Taken from taste-skill's production-test list (pinned `ce26fc25`).
- **Counter-move:** Delete it. Name sections in plain words or not at all; put a real caption *below* an image; keep dots for real live state.
- **When it's fine:** The label carries real information — an actual server status, a real release on a docs site, a genuinely distributed studio whose time zones matter to the client.

**T41 — Placeholder identities left in**
- **Artifact:** "John Doe", "Sarah Chen", "Acme", "Nexus", "SmartFlow"; egg or generic user-icon avatars; phone `(555) 123-4567`; a product "screenshot" built from styled `<div>` rectangles.
- **Why it reads AI:** Every generator shares the same placeholder vocabulary, so it pattern-matches instantly — and a div-built fake dashboard shows no product existed to screenshot.
- **Counter-move:** Real records from the client, or locale-appropriate invented ones that sound specific; a real screenshot or none at all (see also T20, T22, and the real-strings rule in `states.md`).
- **When it's fine:** Clearly marked mockups during exploration — never at the handoff gate.

**T42 — Glassmorphism as the default card surface**
- **Artifact:** Every card `backdrop-filter: blur()` over a semi-transparent white fill with a 1px white border, sitting on a gradient blob so there is something to blur.
- **Why it reads AI:** Translucency is a material with a job — floating chrome over moving content (`apple-motion.md` §12). Applied to static cards on a static page it has nothing behind it to separate, so the blob gets added to justify the glass (see T35), and legibility drops.
- **Counter-move:** Opaque surfaces from the elevation ladder (T18). Keep translucency for nav, toolbars and sheets that content actually scrolls under, with a `prefers-reduced-transparency` fallback.
- **When it's fine:** The brief names glassmorphism or "Liquid Glass" — then build it properly per `apple-motion.md` §12 and label it in `DESIGN.md`.

## MOTION

**T23 — Fade-up-on-scroll on every element, one duration, one curve**
- **Artifact:** `transition-duration: 300ms` globally, `ease-in-out` everywhere instead of a per-element curve, `transition-all`, an identical `translateY(20px) → 0` entrance on every block, linear 0/100/200/300ms stagger.
- **Why it reads AI:** Fade-up is the only entrance the corpus knows, and a uniform duration means motion was never scaled to travel distance — a physical impossibility in real motion design.
- **Counter-move:** Scale duration to element size (buttons ~150ms, sections ~500ms). Asymmetric easing such as `cubic-bezier(0.16, 1, 0.3, 1)`. Exit faster than enter. Jittered or exponential stagger. Target named properties, never `all`.
- **When it's fine:** One subtle reveal on one hero section, where the movement earns attention rather than spending it.

**T24 — Content ships at `opacity: 0`**
- **Artifact:** Elements initially invisible, revealed only by a JS scroll observer — so with JS disabled or an error thrown, the page is blank.
- **Why it reads AI:** A correctness bug rather than a taste issue, and generators produce it constantly because the happy path renders fine.
- **Counter-move:** Progressive enhancement. Ship content visible, then enhance its entrance.
- **When it's fine:** This one is a defect; there is no context that inverts it.

**T25 — Uniform hover scale and pulse-as-loading**
- **Artifact:** `hover:scale-105` on every image and card; `animate-pulse` as the only loading affordance; decorative pulsing status dots on static data; a fake blinking cursor in non-editable hero copy.
- **Why it reads AI:** Motion applied where nothing is changing. Animate only when the data is changing; let real inputs own the cursor.
- **Counter-move:** Custom keyframes; skeletons matched to the actual content shape; `:active { transform: scale(0.98) }` for real press feedback.
- **When it's fine:** `animate-pulse` on a genuine loading skeleton, with a show-delay and a minimum visible duration so it doesn't flicker.

**T26 — No reduced-motion handling, no visible focus ring**
- **Artifact:** Neither a `prefers-reduced-motion` block nor a `:focus-visible` style anywhere in the stylesheet.
- **Why it reads AI:** Both are habits rather than defaults, so they are exactly what gets skipped.
- **Counter-move:** Under reduced motion, remove translate, scale and parallax while *keeping* opacity and duration — the blanket near-zero `transition-duration: … !important` snippet is the wrong fix. Ship a visible keyboard focus ring everywhere.
- **When it's fine:** This is part of the quality floor; build it without announcing it.

**T27 — Continuously animated element sitting behind a blur layer**
- **Artifact:** Motion underneath a `backdrop-filter` surface, forcing the browser to repaint the blurred region every frame.
- **Why it reads AI:** A performance fingerprint rather than a visual one, and measurable directly in DevTools.
- **Counter-move:** Don't stack continuous animation under a blur. Promote the moving layer, or drop the blur.
- **When it's fine:** Only where the repaint cost has been measured and accepted for a short, bounded moment.

**T43 — Cursor-following spotlight, beam, or glow**
- **Artifact:** A radial gradient that tracks `mousemove` across a card grid or hero; an animated "beam" tracing card borders.
- **Why it reads AI:** It is a component-library demo effect (21st.dev, Magic UI) pasted in whole, so it decorates sections whose content has no reason to react to the pointer. It does nothing on touch, which is most traffic.
- **Counter-move:** Spend the motion budget on feedback for real interactions (press, drag, state change). If the effect stays, one instance, gated behind `(hover: hover) and (pointer: fine)` and removed under reduced motion.
- **When it's fine:** A canvas, map or design tool, where pointer position is product information.

**T44 — Buttons that only fade on hover**
- **Artifact:** `hover:opacity-80` (or 90) as the entire hover state for every button and link.
- **Why it reads AI:** It is the one-token hover. Fading moves the control *toward* the background, which breaks the rule in `craft.md` §6 that every state moves away from resting contrast.
- **Counter-move:** Darken or lighten one shade, 100–150ms, plus a real `:active` press.
- **When it's fine:** Ghost or icon buttons whose resting state is already low-emphasis and where the fade raises, not lowers, contrast.

## COPY

**T28 — The averaged headline**
- **Artifact:** "Build faster. Ship smarter." / "Scale without limits" / "Your all-in-one platform" / "Elevate your workflow."
- **Why it reads AI:** These say nothing about the actual product because they are produced by averaging every product. The diagnostic: swap in a competitor's logo — if the headline still works, it is slop.
- **Counter-move:** Ask whether the founder would say this out loud. Say the one thing only this product can say.
- **When it's fine:** Rarely, and only where the category itself is the news and the name carries the specificity.

**T29 — Buzzword verbs**
- **Artifact:** streamline, empower, supercharge, unlock, seamless, world-class, enterprise-grade, cutting-edge.
- **Why it reads AI:** Each is a slot-filler that survives in any sentence about any product, which is precisely why it was chosen.
- **Counter-move:** Pick a specific verb and a specific noun that say what the product literally does.
- **When it's fine:** Inside a real quote from a real person who actually talks that way.

**T30 — Em-dash density and aphoristic cadence**
- **Artifact:** Multiple em-dashes per paragraph; every section landing on a short manufactured rebuttal ("But here's the thing." / "The best part?"); uniform sentence length throughout.
- **Why it reads AI:** The rhythm is the tell far more than the punctuation. Uniform cadence means no human breathing pattern underneath.
- **Counter-move:** Vary sentence length hard. Use commas, colons and parentheses so the dash stops being the only tool.
- **When it's fine:** Plenty of humans love em-dashes. Low signal alone; medium once paired with uniform cadence.

**T31 — "Get Started" as the primary CTA**
- **Artifact:** A generic CTA label, usually beside a "Built with ❤️" footer line.
- **Why it reads AI:** It describes the button's position in a funnel rather than what pressing it does.
- **Counter-move:** A product-specific verb: "Scan Your Site", "See Your Score", "Import a CSV". Keep the same verb through the whole flow.
- **When it's fine:** Signup flows where getting started genuinely is the action and any rename would be a euphemism.

## CODE-LEVEL

**T32 — Missing states**
- **Artifact:** Happy path only. No empty state, no loading state beyond a generic spinner, no error boundary, no `:disabled`, no `:focus`, no long-string handling — names and emails overflow instead of truncating.
- **Why it reads AI:** Structural, not stylistic. Training data is dominated by tutorials showing the working version of a feature; edge-case handling in production codebases is not in that corpus. Critical states are absent or improvised late.
- **Counter-move:** Gate handoff on state coverage. Design the unhappy paths deliberately — write the empty state that makes someone want to fill it. Test every field with a 60-character string.
- **When it's fine:** Throwaway prototypes with a stated lifespan. Anything a user will touch needs the states.

**T33 — Div soup, wrong element for the job**
- **Artifact:** No `<main>`, `<nav>`, `<section>`, `<article>`; `<div onClick>` in place of `<button>`; `h1` jumping to `h3`; icon buttons with no accessible name; images with no `alt`; no skip link.
- **Why it reads AI:** Semantics are invisible in a screenshot, so nothing in the generation loop pushes back on getting them wrong.
- **Counter-move:** Correct elements first, then styling. Keyboard-test the entire page before calling it done.
- **When it's fine:** This is part of the quality floor; there is no brief that inverts it.

**T34 — className-only, zero authored CSS**
- **Artifact:** Every style a utility class. No `:root` custom properties, no `::selection`, no custom `@keyframes`, no container queries, no `grid-template-areas`, no subgrid.
- **Why it reads AI:** Someone working on a design system eventually authors CSS to express relationships utilities can't. Pure utility soup with no escape hatches means no system exists.
- **Counter-move:** Define `:root` tokens; author component CSS where relationships matter; style `::selection` in the brand color — two lines that read as care.
- **When it's fine:** Small marketing pages, genuinely. The system overhead would never pay for itself.

**T45 — Shipped-default metadata**
- **Artifact:** The tab still reads "Vite + React" or "Create Next App"; the default framework favicon; one `<title>` on every route; the site served from `*.vercel.app` / `*.netlify.app` with no custom domain; the host's stock 404; View Source showing an empty `<div id="root">`.
- **Why it reads AI:** None of these is visible inside the editor where the page was generated, so nothing prompted a fix. Together they say nobody opened the deployed site in a browser tab.
- **Counter-move:** Per-route `<title>` matching context (`web-interface-guidelines.md`), a real favicon, a designed 404 (`states.md` §6 copy), a custom domain. The SEO, `lang`, source-map and bundle-size items that circulate on the same lists belong to `website-hardening` (Phases 2–4), not to this file.
- **When it's fine:** Internal previews and throwaway prototypes behind auth.

## IMAGERY

**T35 — Gradient blobs, mesh gradients, radial halos, dot and grid backgrounds**
- **Artifact:** A `radial-gradient` glow behind the hero; a decorative grid-line background with no functional relationship to content; repeating-gradient stripes; an SVG noise/grain overlay across the whole page.
- **Why it reads AI:** Texture used as filler exactly where a designer would have put content. It is the visual equivalent of clearing your throat.
- **Counter-move:** A real surface, a real texture, or nothing — use product structure or a plain field.
- **When it's fine:** Grid backgrounds on canvas, whiteboard and design-tool products, where the grid *is* the product.

**T36 — Hero illustration assembled from generic SVG shapes**
- **Artifact:** Hand-coded circles, rects and paths arranged into a "scene" or mascot; or an `<img>` with an empty or broken `src`.
- **Why it reads AI:** It is a placeholder wearing the costume of an asset. Ship no illustration rather than a sketchy fallback.
- **Counter-move:** A real product screenshot, real photography, a commissioned illustration — or nothing. Recordings, workspace configs and real dashboards all beat a drawn scene.
- **When it's fine:** Diagrams, where the shapes are carrying actual information rather than standing in for art.

**T37 — Stock-photo and AI-image uncanniness**
- **Artifact:** A diverse group at laptops in a well-lit office. Or illustration that is slightly too smooth and slightly too symmetrical.
- **Why it reads AI:** Both are the median image for "business", selected the same way the median headline was.
- **Counter-move:** Real team photos, real screenshots, real artifacts from the subject's own world.
- **When it's fine:** Licensed editorial photography chosen for a specific reason you can state in one sentence.

**T38 — Emoji as icon system**
- **Artifact:** `<nav><a><span>🎯</span> Features</a></nav>`; emoji standing in for icons across feature cards; an emoji leading every heading.
- **Why it reads AI:** Emoji render differently on every platform, inject colors you didn't choose, and cannot be weighted or sized as a set.
- **Counter-move:** A real icon set. If it is the same icon library at one default size and stroke everywhere (in practice, Lucide at 24px / 2px stroke), that is itself a mild tell — vary weight and size by hierarchy.
- **When it's fine:** Playful consumer products, docs and changelogs — and always when the emoji is *content* the user typed rather than chrome you chose.

## When rules break

Every rule above encodes a default that prevents the most common failure mode. **When the context inverts the failure mode, the rule may invert too.** The work is recognizing the inversion, not memorizing exceptions — and a list with no escape hatches produces stilted output, which is the documented failure mode of every ban list.

- **"Never mix three typefaces" inverts in editorial and data-heavy products.** A deliberate display serif + body sans + mono system is standard there, because each family has a named role. The rule targets accidental font accumulation, not designed hierarchy. Ask whether you can say what each face is *for*; if you can, three is fine and four is probably still drift.
- **ALL-CAPS inverts when it is voice rather than grammar.** One deliberate kicker, placed where the page genuinely changes mode, reads as authorship. One per section reads as a template filling a slot. The failure mode the rule prevents is repetition, so a single instance is not the thing being prevented.
- **Emoji inverts when it is content, not chrome.** Banned as an icon system because it cannot be color-controlled or sized as a set. Entirely legitimate when the user typed it — in a message body, a commit title, a reaction, a changelog entry they wrote. Stripping a user's emoji is a bug, not taste.
- **All-even grids invert when the items genuinely are peers.** A keyboard shortcut sheet, a color ramp, a comparison matrix — these *should* be even, because implying a focal point where none exists is the actual error. The tell is an even grid where one item plainly should dominate and the layout refused to decide.
- **Canonical section order inverts on a conversion page whose audience scans for exactly that order** — and where the brief says so. Buyers comparing three vendors want pricing tiers where pricing tiers live. Uninspired and effective is a legitimate target; deliver it deliberately, and say that you did, rather than drifting into it.
- **"Don't default to blue" inverts when blue is the brand.** The rule is against *defaulting*, not against the hue. If the brand mark, the existing product, or the brief names blue, use blue and build the rest of the system around it with conviction. Same for indigo, for warm cream grounds, and for every other look on this list — where the brief pins the direction, the brief's own words win.
