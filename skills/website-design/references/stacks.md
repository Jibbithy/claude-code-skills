# Stacks, versions, and platform facts

## Contents

- [shadcn/ui](#shadcnui)
- [Tailwind CSS v4](#tailwind-css-v4)
- [Next.js 16.x](#nextjs-16x)
- [Astro 7.x](#astro-7x)
- [Motion](#motion)
- [Component, motion and 3D sources](#component-motion-and-3d-sources)
- [Verification tooling](#verification-tooling)
- [CSS Baseline, July 2026](#css-baseline-july-2026)


Verified as of 2026-07-27.

This is the only file in the skill that carries version numbers, install commands, or browser-support claims. Refresh this one file and the skill is current. Versions were confirmed against the npm registry; where a blog post or search result disagrees, the registry wins.

| Package | Version | Notes |
|---|---|---|
| `shadcn` | 4.15.0 | the CLI; invoked as `shadcn@latest` |
| `tailwindcss` | 4.3.3 | v4 line; no v5 |
| `next` | 16.2.12 | 16.3 is preview-only, not stable |
| `react` | 19.2.8 | Next 16 requires React 19 |
| `astro` | 7.1.4 | 7.0 GA 2026-06-22 |
| `motion` | 12.42.2 | import from `motion/react` |
| `@base-ui/react` | 1.6.0 | 1.0 stable shipped 2025-12-11 |
| `radix-ui` | 1.6.7 | the single unified package |
| `react-aria-components` | 1.19.0 | pick when a11y rigor is contractual |
| `@ark-ui/react` | 5.37.2 | only for genuine multi-framework needs |
| `@headlessui/react` | 2.2.10 | dormant — not for new work |
| `playwright` | 1.62.0 | CLI used for visual verification |
| `lighthouse` | 13.4.1 | needs Node 22.19+ |
| `axe-core` / `@axe-core/playwright` | 4.12.1 | the engine everything else wraps |
| `@fontsource-variable/*` | 5.3.0 | all packages republished 2026-07-19 |

---

## shadcn/ui

The CLI package is `shadcn`. Always invoke it as `shadcn@latest`.

```bash
npx shadcn@latest init -t next     # next | vite | start | react-router | astro
npx shadcn@latest add button
npx shadcn@latest add @acme/button # namespaced registry (CLI 3.0+)
npx shadcn@latest init -b radix    # opt out of the Base UI default
npx shadcn@latest init --base aria # React Aria base
```

Subcommands: `init`/`create`, `add`, `view`, `search`/`list`, `build`, `docs`, `info`, `migrate`, `apply`, `mcp init`, `eject`. Tailwind v4 supported since Feb 2025, React 19 since Oct 2024.

**Primitive base.** Since `shadcn@4.13.0` (2026-07-03) the default base is **Base UI** (`@base-ui/react`) — new projects were already choosing it over Radix 2:1. Radix is *not* deprecated; every component still ships for both. React Aria became a third first-class base in July 2026.

- **Radix**: install the single unified `radix-ui` package. Do not install a pile of `@radix-ui/react-*` packages — that is pre-2025 advice. (`@radix-ui/themes` 3.3.0 is near-dormant.)
- **Headless UI**: not recommended for new work. 2.2.10 was a one-line fix after a 6.5-month gap, with no commits in over three months following Tailwind Labs' Jan 2026 layoffs.

---

## Tailwind CSS v4

Three things define a v4 setup: `@import "tailwindcss"` in the stylesheet, CSS-first `@theme` config, and either `@tailwindcss/postcss` or `@tailwindcss/vite` as the build plugin.

```bash
npm install tailwindcss @tailwindcss/vite     # Vite, Astro
npm install tailwindcss @tailwindcss/postcss  # Next.js, webpack
npm install tailwindcss @tailwindcss/cli      # standalone CLI
npx @tailwindcss/upgrade                      # v3 -> v4 codemod (Node 20+)
```

```css
@import "tailwindcss";

@theme {
  --font-display: "Bricolage Grotesque", sans-serif;
  --color-brand-500: oklch(0.62 0.19 258);
}
```

`tailwind.config.js` is **not** the configuration path in v4 — there is no auto-detection. `@config "../tailwind.config.js"` exists only as a migration escape hatch, and even then `corePlugins`, `safelist`, and `separator` are unsupported. Any `theme.extend.*` snippet you meet is legacy v3; port it to `@theme`. Container queries, automatic content detection, and the oklch palette are all in core — no plugin needed.

**The most common v4 bug:** `@apply` inside a `<style>` block in `.astro`, Vue, or Svelte files (and in CSS Modules) silently emits nothing. Add a reference to the stylesheet at the top of that block:

```css
@reference "../styles/global.css";
```

**Browser floor: Chrome 111+, Safari 16.4+, Firefox 128+.** Firefox is the tightest constraint and is frequently misquoted as 111. Sass/Less/Stylus are unsupported in v4.

Migration gotchas that silently change a design: `*-opacity-*` utilities removed (use `bg-black/50`); the shadow/blur/rounded scale shifted one step down (`shadow` -> `shadow-sm`); `ring` default 3px -> 1px and its color -> `currentColor`; default border color -> `currentColor`; `hover:` now wrapped in `@media (hover: hover)`; `!flex` -> `flex!`; `bg-[--brand]` -> `bg-(--brand)`.

---

## Next.js 16.x

App Router is the default and the recommendation; Pages Router is maintained but gets no new investment. Server Components are the default — a file is server-rendered unless it declares `'use client'`. Turbopack is the default bundler for **both** `next dev` and `next build` since 16.0; opt out with `--webpack`, and do not pass a `--turbo` flag. `create-next-app` has shipped Tailwind v4 since Next 15.2.0 — its templates contain `@import "tailwindcss";` and no legacy `tailwind.config.*` at all.

**Fonts: use `next/font`, never a Google Fonts `<link>`.** Reasons, in order of weight:

1. Fonts are self-hosted at build time — the browser never contacts Google (the GDPR answer).
2. Zero layout shift — Next generates a metrics-matched fallback `@font-face` using `size-adjust` / `ascent-override` / `descent-override`.
3. No third-party DNS + TLS handshake on the critical path.
4. Route-scoped preloading, automatic subsetting, `display: swap` by default.

```tsx
import { Bricolage_Grotesque } from 'next/font/google'
const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display' })
// <html className={display.variable}>
```

Wire it through `@theme inline { --font-sans: var(--font-display); }`. Omit `weight` for variable fonts, and call each loader exactly once in a shared module.

16.x breaking changes worth knowing: Node 20.9+, TS 5.1+; `next lint` removed; AMP removed; `middleware.ts` renamed to `proxy.ts`; `experimental.ppr`/`dynamicIO` folded into `cacheComponents: true` plus `"use cache"`; `cookies()`, `headers()`, `params`, and `searchParams` are async and now enforced; parallel-route slots need an explicit `default.js`. `next upgrade` (new in 16.1) automates most of it.

---

## Astro 7.x

Astro shipped two majors in four months (6.0 on 2026-03-10, 7.0 on 2026-06-22), so most sources are stale by a full version. 7.0 brings a Rust compiler (substantially faster builds), Rust Markdown, Vite 8 + Rolldown, and stable queued rendering. Node 22+ required since 6.0. The Rust compiler validates strictly — HTML is no longer auto-corrected, so unclosed tags are hard errors. Budget time for template churn on upgrade.

```bash
npx astro add tailwind    # installs tailwindcss + @tailwindcss/vite
```

**`@astrojs/tailwind` is legacy** — frozen at 6.0.2 (2025-03-26), no release across two Astro majors, and the docs cover it only under "Legacy Tailwind 3 support". Do not add it; if a project on Tailwind v4 still has it, uninstall it.

Astro 6 added a first-party Fonts API with the same build-time self-hosting benefits as `next/font`, plus Server Islands (personalization on cached pages) and a CSP API. Astro remains the right call for marketing and content sites; reach for Next.js when you need auth'd dashboards, heavy client state, or an existing React component library.

Unverified combination: Astro 7 + Tailwind 4.3.3 on Vite 8/Rolldown. Smoke-test before committing to it.

---

## Motion

Install `motion` and import from `motion/react`.

```bash
npm install motion
```
```js
import { motion, AnimatePresence } from "motion/react"
import * as motion from "motion/react-client"  // RSC entrypoint, namespace import
```

Defaults, read from the shipped source (Motion publishes no prescriptive table): `scale` animates as a spring at stiffness 550 / damping 30; other transforms at 500 / 25; everything else is a 0.3s tween on `cubic-bezier(0.25, 0.1, 0.35, 1)`; more than two keyframes gets a 0.8s tween. Prefer duration-based authoring — `transition={{ type: "spring", visualDuration: 0.5, bounce: 0.25 }}` — since setting any of `stiffness`/`damping`/`mass` silently overrides `bounce` and `duration`. `animateView()` graduated into the free core at 12.41.0.

---

## When the brief is an official design system

Adapted from `Leonxlnx/taste-skill` §2 (MIT, pinned `ce26fc25`). If the brief reads as one of these,
install the **official** package rather than hand-recreating its CSS, and use one system per project.
Choosing one is a deliberate choice under rubric check 4, not a default — say so in `DESIGN.md`.
Check versions at install time; this table carries none.

| Brief reads as | Official package |
|---|---|
| Microsoft-style enterprise SaaS / dashboards | `@fluentui/react-components` or `@fluentui/web-components` |
| Material-flavored product | `@material/web` + Material 3 tokens |
| IBM-style B2B / dense analytics | `@carbon/react` + `@carbon/styles` |
| Shopify admin surfaces | Polaris web components (required there) |
| Atlassian / Jira-style product | `@atlaskit/*` + `@atlaskit/tokens` |
| GitHub-style devtool | `@primer/react` / `@primer/css` |
| UK / US public-sector service | `govuk-frontend` / `uswds` |

An **aesthetic** (glassmorphism, bento, brutalism, "Liquid Glass") is not a system: there is no
official package, so build it with native CSS and label approximations honestly in code comments.

---

## Component, motion and 3D sources

Checked 2026-10-17 (npm registry and GitHub API). These keep surfacing in "make your vibe-coded site
look good" roundups. The go/no-go and adoption conditions live in `website-hardening`'s
`references/externals.md`; read the verdict there before installing, and do not re-audit from here.
Copy-paste registries mean you own the code, so read every pasted file before committing it, and
remember their demo effects are where several tells come from (T42, T43 in `ai-tells.md`).

| Source | What it is | Use it as |
|---|---|---|
| **21st.dev** | community registry of shadcn-style React components | browse and copy by hand. Its Magic MCP (`@21st-dev/magic` 0.2.3, ISC) needs an API key and sends prompts and UI context off-box: no-go by default |
| **Kokonut UI** | shadcn-style animated components, free tier MIT | accent components on a shadcn base; free tier only (Pro is a proprietary EULA) |
| **Magic UI** | shadcn-style animated components, MIT (`magicuidesign/magicui`); paid Pro templates | `npx shadcn@latest add @magicui/<component>`; same rules as Kokonut. Not yet in `externals.md`: audit it there before client use |
| **Anime.js** | `animejs` 4.5.0, MIT, framework-free | the fallback to Motion for SVG path/line/morph work; one animation library per project |
| **Threlte** | `@threlte/core` 8.6.1, MIT, Three.js for Svelte | 3D scenes in Svelte projects; the React equivalent is `react-three-fiber` + `drei` |
| **Spline** | browser 3D editor; `@splinetool/runtime` 2.0.93 still has **no license field** | inspiration only, or export a still/video of the scene. Never ship the runtime, and a Framer/Webflow "embed" block ships it too |
| **Vectary** | hosted 3D/AR editor, embeds by iframe | same treatment as Spline: an iframe is a third-party request, a privacy surface and a heavy LCP element; prefer an exported render |
| **Jitter** | hosted motion-design tool; exports video, GIF and Lottie | authoring only; ship the exported MP4/WebM per `web-interface-guidelines.md` (not GIF), with a still for reduced motion |

Any 3D or embedded scene is a performance item before it is a design item: load it below the fold
or on interaction, give it a static poster, and measure LCP with it in place.

---

## Verification tooling

Shell out to the Playwright CLI rather than depending on an MCP server — a skill cannot install MCP servers, so anything that assumes one silently breaks.

```bash
npx playwright install chromium
npx playwright screenshot --viewport-size "1280,720" --wait-for-selector "main" \
  http://localhost:3000 ./shot.png
```

`npx playwright screenshot` is real and fully supported, but it is **not documented** on playwright.dev — it is discoverable only via `--help`. Do not conclude it was removed. A 1280×720 PNG costs roughly 1,200 tokens to read, cheaper than an accessibility-tree dump and the only artifact that actually shows layout, spacing, and overflow. If you do add Playwright MCP for interaction loops, vision is opt-in as `--caps=vision` (`pdf`, `devtools`, `storage` are separate capability groups) and headed is the default.

Accessibility: prefer `@axe-core/playwright` over the axe CLI when Playwright is already present — no ChromeDriver, and you can audit post-login states. Lighthouse 13 removed the PWA category entirely and requires Node 22.19+; run it with `--only-categories=accessibility`. Automated scanning catches ~57% of real issues by volume and is a floor, not a pass — keyboard traversal and VoiceOver (`Cmd+F5`) remain mandatory.

---

## CSS Baseline, July 2026

**Safe unconditionally — do not wrap these in `@supports`:** `:has()`, container size queries with `cqw`/`cqi`, `@layer`, `color-mix()`, `oklch()`/`oklab()`, CSS Nesting (Widely 2026-06-11), Subgrid (Widely 2026-03-15), `:user-valid`/`:user-invalid`, `<search>`. `text-wrap: balance` is Newly available but degrades silently, so treat it as safe. `light-dark()` reaches Widely 2026-11-13.

**Progressive enhancement — ship with a working fallback:** Popover API (Newly 2025-01-27, near-unconditional), same-document View Transitions (Newly 2025-10-14), core anchor positioning (Newly 2026-01-13 — core anchoring is production-ready behind a fallback, exotic longhands are not), container *style* queries (2026-05-19), `field-sizing: content` (2026-06-16).

**Limited availability — enhancement only, never load-bearing:**

- **`text-wrap: pretty`** — Chrome shipped it first (117, Sept 2023), Safari in 26 (Sept 2025), and **Firefox has never shipped it**. It is Limited, not Baseline. `balance` and `pretty` are not interchangeable in risk: `balance` is safe, `pretty` is not.
- **Scroll-driven animations** — still behind a pref in Firefox 152. Wrap in `@supports (animation-timeline: scroll())` and make the unanimated state complete on its own.
- **Cross-document `@view-transition`** — same rule.

**Do not rely on at all:** `interpolate-size()`/`calc-size()`, `@function`, `sibling-index()`/`sibling-count()`, Masonry / `item-flow` (no browser has shipped the agreed syntax), `corner-shape`, `text-box`, `reading-flow`.

---

<details>
<summary>Old patterns — recognize, don't write</summary>

These names still appear in tutorials and in older project files. Recognize them when reading someone else's code; never emit them as advice.

- **`shadcn-ui@latest`** — a dead CLI frozen at 0.9.5 since the Aug 2024 rename. It carries no npm deprecation flag, so `npx shadcn-ui@latest` still runs — it just runs a two-year-old CLI that knows nothing about registries, Tailwind v4, Base UI, or MCP. Use `shadcn@latest`.
- **`framer-motion`** — the legacy *name*, renamed 2024-11-12. It is **not** deprecated or frozen: it publishes in lockstep at the identical version and `motion` literally depends on it, with `motion/react` as a thin re-export. It is simply not what you install.
- **`@base-ui-components/react`** — npm-deprecated in favor of `@base-ui/react`.
- **`@next/font`** — folded into `next/font` in Next 13.2.0.

</details>
