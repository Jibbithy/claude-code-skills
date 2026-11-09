# Direction

## Contents

- [Why this replaced the tone list](#why-this-replaced-the-tone-list)
- [Count rule](#count-rule)
- [Label the layer you are borrowing from](#label-the-layer-you-are-borrowing-from)
- [The one-variable rule](#the-one-variable-rule)
- [Measure the reference, don't screenshot it](#measure-the-reference-dont-screenshot-it)
- [The extraction checklist](#the-extraction-checklist)
- [Deriving the palette](#deriving-the-palette)
- [Where to look](#where-to-look)
- [Why moodboards produce unbuildable UI](#why-moodboards-produce-unbuildable-ui)
- [Output of this step](#output-of-this-step)


How to arrive at a visual direction by measuring real sites, instead of naming a mood.

- [Why this replaced the tone list](#why-this-replaced-the-tone-list)
- [Count rule](#count-rule)
- [Label the layer you are borrowing from](#label-the-layer-you-are-borrowing-from)
- [The one-variable rule](#the-one-variable-rule)
- [Measure the reference, don't screenshot it](#measure-the-reference-dont-screenshot-it)
- [The extraction checklist](#the-extraction-checklist)
- [Deriving the palette](#deriving-the-palette)
- [Where to look](#where-to-look)
- [Why moodboards produce unbuildable UI](#why-moodboards-produce-unbuildable-ui)
- [Output of this step](#output-of-this-step)

## Why this replaced the tone list

The previous version of this skill offered eleven canned adjectives — pick "brutally minimal" or "retro-futuristic" or "warm editorial" and build to it. That is a lookup table, and a lookup table converges: the same eleven inputs produce the same eleven outputs forever, and each adjective resolves to whatever the training-data average of that word looks like, which is the exact statistical center this skill exists to escape. Worse, an adjective carries no numbers — "minimal" does not tell you how many colors, what type ratio, which spacing step — so every unspecified decision silently defaults to the average anyway. Direction now comes from measuring three real sites and writing down what they actually do. Those adjectives appear nowhere else in this skill, and nothing below should be read as reintroducing them.

## Count rule

**3 references. Floor 2, cap 4.**

- One reference is not a direction, it is a copy.
- Two is the working minimum when the brief is narrow.
- Four is the ceiling. Beyond four you are collecting, not deciding.
- Thirty references is a mood board with no decisions in it.

## Label the layer you are borrowing from

Before saving a reference, name which of these four layers it solves. Top-down, in dependency order:

- **Strategy** — what this product sells, to whom, and what the single action is. Determines what gets the most space.
- **System** — information architecture, navigation model, density, how state and hierarchy are organized.
- **Interaction** — flows, step counts, timing, transitions, empty and error states.
- **Visual** — grid, type, color, surface treatment, the aesthetic skin.

Two rules follow. First, a **System** reference and a **Visual** reference are not interchangeable; filing them together is how a reference set turns to mush. Second, the lower layers are not free-standing — this is why copying a hero section fails. A hero is a **Visual** artifact whose proportions were determined by **Strategy** decisions you cannot see. Transplant it and you inherit the proportions while losing the reason.

Tag each reference in your set with exactly one layer label. If a set of three is all **Visual**, the direction has no structural spine and will not survive contact with real content.

## The one-variable rule

**One variable per reference — never two from the same reference.**

Color relationships from one site. Spacing rhythm from a second. Type scale from a third. The moment a single reference supplies two of those, you are no longer mixing, you are tracing it with a filter on. Write the variable next to the URL so the constraint stays visible:

```
1. refero.design/sites/linear — SYSTEM — spacing rhythm only
2. land-book.com/<entry>      — VISUAL — color relationships only
3. mobbin.com/<flow>          — INTERACTION — step pacing only
```

Same rule again for greppability: never two from the same reference, ever, no matter how good it is.

## Measure the reference, don't screenshot it

Extract references as **numbers, not images**. Open devtools and read computed values. A measured spacing scale is a system you can rebuild and modify; a screenshot is a thing you can only approximate. Pasting an image into the build loop reproduces the artifact's surface and none of its logic.

Practical: computed styles give you font sizes, weights, line heights, letter-spacing, gaps, paddings and resolved colors directly. Count distinct values. Distinct values *are* the scale.

## The extraction checklist

Run all six against each reference. Step 6 is not optional — it is the step that converts a reference into a decision.

1. **How many colors are actually in use, counted.** Not "how many does it feel like" — count the distinct resolved values. It is nearly always fewer than it looks, often 5–7 including neutrals.
2. **The type scale ratio and the weight count.** Ratio between adjacent steps (1.2? 1.5? a 3x jump for display?) and how many distinct weights ship. Two weights is common; four is usually accidental.
3. **The spacing scale in px.** The actual measured steps — e.g. 4 / 8 / 16 / 24 / 48 / 96. Note whether the scale is linear or geometric, and where the big jump between sections lands.
4. **The hierarchy mechanism — size vs weight vs color.** Which one is doing the work? Most strong designs pick one primary lever and hold it; weak ones use all three at once and read as noise.
5. **The one distinctive move.** The single thing this design does that nothing else on the list does. If you cannot name it in a sentence, the reference is not earning its slot.
6. **How each of the above must change for this context.** Different content length, different density, different audience, different brand, different device mix. Name the change explicitly per item. A reference is never a shortcut to recreating.

## Deriving the palette

There is no default palette in this skill any more — deriving one is part of the work. Derive it from what you measured:

- Ship **4–6 hex values**, no more. Each hex sits **on the same line as its role**, in this format:

```
#0B0D0E — Page background
#F4F4F2 — Primary text on dark
#8C8F8A — Secondary text, metadata
#1A1D1F — Raised surface, cards
#D8654F — Accent: primary action, active state
```

- **Neutrals are tinted 3–5% toward the accent hue.** Pure `#888` grey against a warm accent reads as a bug. Nudge the neutral's hue toward the accent and keep saturation low — enough that the page feels mixed from one pot, not enough to name a color.
- **Semantic status color (good / warning / critical) is separate from the accent and is not counted against the 4–6.** Status color has a job — it means something. If the accent doubles as "success", a normal button starts looking like a state change. Keep them distinct even when the hues are close.
- Every font gets a named fallback stack, not a bare family name.

## Where to look

Only this set. Verified live 2026-07-27.

**Flows and real product structure — use before any visual decision.** These show shipped products with real data and real state.

- **Mobbin** — large searchable screenshot library organized into flows, with app version history so you can diff how a flow changed across releases.
- **Page Flows** — recorded *video* user flows. Best for onboarding, cancellation and paywalls, where timing and step count carry information a still image loses.
- **Refero** — web-heavier than the app-first libraries; the best of this group for browser UI.

**Visual direction — with a caveat.** The sites below are almost entirely marketing pages, not products. Excellent for a homepage; actively misleading as reference for a logged-in dashboard.

- **Land-book** — sections view lets you browse only heroes, or only pricing blocks, or only footers.
- **SiteInspire** — tightly edited, one narrow and restrained typographic taste; platform filter is useful.
- **httpster** — free, no account, loose tagging but high volume.

**Written brand systems — a seed, not a measurement.** `VoltAgent/awesome-design-md` (MIT, pinned
`f6961238`, markdown only) holds third-party `DESIGN.md` write-ups of real brands' color, type and
spacing. Use one to find *which* site to measure; never copy its values unmeasured — they are someone
else's reading, and may be stale.

**Non-UI visual texture — the category developers skip, and the reason their work looks like everyone else's.**

- **Cosmos** — search by color and by visual similarity, with an AI-content filter and provenance.
- **Savee** — explicitly anti-algorithm; no feed deciding what is relevant.

Contest galleries and shot sites are deliberately absent from the flow and system tiers. Contest sites are pay-to-enter, which biases them toward agencies with budget, and their winning aesthetic optimizes for a twenty-second jury impression rather than for someone trying to complete a task. That includes **Awwwards**, the gallery most "make your AI site look good" roundups recommend: fine for spotting a motion or type idea to then find on a shipped product, never a reference you measure for a product surface.

**Named styles** (neo-brutalism, bento grid, glassmorphism, Swiss, claymorphism, wabi-sabi and the rest of the lists that circulate) are search queries for these galleries, not directions. The merged vocabulary, with defining traits and a gallery tier per style, lives in `website-hardening`'s `references/style-menu.md`. When the user names one, the precedence chain applies — their word wins — and you still measure 3 real sites that carry it.

Graphic-design trend lists add poster and cover-art names the menu lacks: **Acidwave** (neon green on black, sci-fi chrome), **K-Design** (retro airbrush, Korean poster type), **Dreamscape**, **Hyperbloom**, **Halftone** (dot-screened B/W photo with one flat accent), **Neo-Swiss** (Swiss grid with circles and oversized numerals) and **Vector-Surrealism** (one @jamesabadi_design reel, 2026-10). Several are one creator's coined labels, not settled terms. They describe print and album art, so search them on the non-UI texture tier (Cosmos, Savee, Behance) for a type or color idea, then find that idea on a shipped product before measuring it.

## Why moodboards produce unbuildable UI

Shot-site moodboards fail for structural reasons, not taste reasons. The like button sits next to the image, so approval is a split-second gut reaction that requires no critical thought. Shots are framed as finished objects, which makes fragments feel complete. Static images cannot show motion, real product structure, or how an interface holds up under real data — and the genuinely valuable work, the fixed signup flow, is unpostable because it is not a visual art object. Blur your eyes at a page of shots and the differences vanish.

The practical consequence: a direction assembled from shots has no **System** and no **Interaction** layer, only **Visual**. It will look plausible in a hero screenshot and fall apart at the first table with forty rows and a long string in it. Shot sites remain genuinely good for illustration, icons, and brand marks — categories where the artifact *is* the deliverable.

## Output of this step

Before writing any CSS, you should have written down: 3 URLs, one layer label each, one variable each, six checklist answers each including the change for this context, and a derived 4–6 value palette with roles. If that artifact does not exist, direction has not been chosen yet — the average has.
