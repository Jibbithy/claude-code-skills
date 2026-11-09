# Performance — measure, then fix

## Contents

- [The budget, and how it is measured](#the-budget-and-how-it-is-measured)
- [The static leads](#the-static-leads)
- [1. Oversized JSON shipped to the client](#1-oversized-json-shipped-to-the-client)
- [2. Row-at-a-time database writes](#2-row-at-a-time-database-writes)
- [3. Bottlenecks and the critical path](#3-bottlenecks-and-the-critical-path)
- [4. Unoptimized rendering](#4-unoptimized-rendering)
- [5. Static hosting when it should be static](#5-static-hosting-when-it-should-be-static)
- [6. HTTP caching and compression](#6-http-caching-and-compression)
- [7. JS bundle budget](#7-js-bundle-budget)
- [8. Third-party scripts](#8-third-party-scripts)
- [9. Fonts](#9-fonts)
- [10. Discoverability metadata](#10-discoverability-metadata)
- [Boundary with website-design](#boundary-with-website-design)
- [The measure-then-fix table](#the-measure-then-fix-table)

Nothing in this file is guessed. Every claim is a number produced by a command that is written next to it, and every fix is verified by re-running that command until the number moves into the good band. This file owns the runtime and data-path performance of a built site — the bytes it ships, the queries it runs, the critical path it renders on. It does **not** own how the page looks while it loads (skeletons, layout-shift-free placeholders, loading-state design) — that is craft, and it belongs to `website-design`; where the two touch, this file defers and says so. The static scanner surfaces leads; Lighthouse produces the authoritative verdict. A lead is not a finding until it is measured, and a fix is not done until the measurement clears.

---

## The budget, and how it is measured

**Core Web Vitals in the "good" band is the gate: LCP ≤ 2.5s · INP ≤ 200ms · CLS ≤ 0.1.** These are the field thresholds Google publishes at the 75th percentile; a lab run that clears them is necessary, not sufficient, but a lab run that fails them ships nothing.

**Measure against a running production build, never the dev server.** Dev serves unminified bundles, disables caching, and injects HMR — its numbers are fiction. Build, start, then point Lighthouse at the served URL:

```bash
npm run build && npm run start &          # or the framework's build + preview/serve pair
npx lighthouse <url> --only-categories=performance --quiet --chrome-flags="--headless"
```

`lighthouse` is pinned at **13.4.1** in `website-design/references/stacks.md` and needs **Node 22.19+** — use that version so results are comparable across runs and across the two skills; do not float it. Run it **three times and take the median** — a single cold run is dominated by first-compile and disk noise. Read the individual audits, not only the score: "Reduce unused JavaScript", "Serve images in next-gen formats", "Avoid enormous network payloads", "Largest Contentful Paint element", and "Avoid long main-thread tasks" each name a specific fix in the sections below. Lighthouse reports **TBT** (a lab proxy) rather than INP (a field metric); confirm real INP against the interaction the site actually depends on, not the synthetic score.

**CrUX over lab where a live URL exists.** If the site is already in production, pull the Chrome UX Report field data (`https://developers.google.com/speed/pagespeed/insights/?url=<url>`) — real users on real devices are the verdict Lighthouse only approximates. Lab is for pre-launch and for the fix loop; field is the truth once traffic exists.

**The whole phase is a loop, not a reading:** measure → fix the audit costing the most → rebuild → re-measure. Stop when all three vitals sit in the good band, not when the score "looks better."

---

## The static leads

The scanner cannot time a page — it reads files and flags the patterns that reliably become runtime cost. Run it first for leads, then measure:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only perf
```

It emits **five** checks in the `perf` group: `uncompressed-json` and `row-at-a-time-writes` (the data-path leads — sections 1–2), plus `render-blocking`, `large-image`, and `img-dimensions` (the render leads — section 4). Everything past those (bottlenecks, N+1 reads, hydration cost, hosting model, HTTP caching, bundle budget, third-party scripts, fonts) is **not statically decidable** and is caught only by Lighthouse, the network waterfall, `curl -I`, a bundle analyzer, and reading the code. Treat a clean `--only perf` scan as "the five file-shaped leads are absent," never as "the site is fast."

---

## 1. Oversized JSON shipped to the client

A large JSON blob in the bundle or fetched on load inflates transfer, parse, and main-thread time — it shows up in Lighthouse as "Avoid enormous network payloads" and as long main-thread tasks blocking INP.

**Measure.**

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only perf
```

The `uncompressed-json` check flags any shipped `.json` over **50 KB** (`high` over 500 KB), and notes when it is pretty-printed — `package.json`, lockfiles, and `tsconfig` are excluded because they never reach the client. Confirm the real over-the-wire cost in the network panel: check the JSON response's **Content-Encoding** header and its transferred (compressed) size versus its decoded size.

**Fix**, in order of preference:

1. **Move it server-side.** If the client renders a slice, query the slice — do not ship the table and filter in the browser.
2. **Paginate or stream.** Return a page plus a cursor; never a whole dataset for a first paint.
3. **Compress at the edge.** Serve gzip or brotli (brotli wins on text) — confirm `Content-Encoding: br` on the response (see section 6). A 500 KB pretty-printed JSON is often ~40 KB brotli'd, but compression is the fallback, not the excuse to ship it all.
4. **Minify.** Strip the pretty-print whitespace the scanner flagged; ship compact JSON.

Re-run the scan; the finding must be gone or the size dropped below threshold, and the network panel must confirm the smaller transfer.

## 2. Row-at-a-time database writes

A write inside a loop is one network round-trip per row. At 100 rows and 20ms latency that is a 2-second request; the pattern that reads fine at seed scale times out in production.

**Measure.**

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only perf
```

The `row-at-a-time-writes` check flags `INSERT`/`UPDATE` or an ORM `.insert`/`.create`/`.save`/`.query` **inside a `for` loop**. Confirm the runtime cost by timing the endpoint under a realistic row count, or by counting the queries the ORM logs for one request.

**Fix: collapse N round-trips into one.** A single multi-row `INSERT ... VALUES (…),(…),(…)`, a `bulkCreate` / `createMany`, or — where writes must interleave with logic — one transaction so the round-trips share a connection and commit atomically. Batch reads the same way: replace a lookup-per-iteration with one `WHERE id IN (…)`. Re-run the scan and confirm the loop is gone, then re-time the endpoint.

This is the write-side twin of the **N+1 read** in section 3; the scanner catches the write loop statically, but N+1 reads usually hide behind an ORM and surface only in the query log.

## 3. Bottlenecks and the critical path

Not file-shaped, so not scannable — found by watching what the page actually waits on. **The critical path is the longest dependency chain between navigation and the metric you are missing; optimize the longest link, not the easiest one.** Shaving 50ms off a resource that was never on the path changes nothing.

**Measure — read the waterfall.** Open DevTools → Network, reload, and sort by time. Three shapes to name:

- **A single slow upstream.** One request the rest wait on — a slow API, an un-cached third-party script on the critical path, a serial auth round-trip before render. Fix: parallelize independent requests, cache the slow response, move the call off the render path, or set a timeout with a degraded fallback so one slow dependency cannot stall the whole page.
- **A staircase (serial dependency).** Requests that each start only when the previous finishes — request → parse → request → parse. Fix: preload known-next resources (`<link rel="preload">`, `rel="preconnect"` for third-party origins), hoist data fetches so they fire in parallel, and collapse dependent fetches into one endpoint.
- **N+1 queries.** One request firing a query per returned item — invisible in the waterfall but obvious in the DB/ORM query log. **Measure:** enable query logging and count queries per request; a list endpoint issuing `1 + N` queries is the tell. Fix: eager-load the relation (a `JOIN` or the ORM's `include`/`with`), or one `WHERE id IN (…)` batch — same shape as section 2.

For server response time specifically, Lighthouse's "Reduce initial server response time (TTFB)" and "Server Backend Latencies" audits point at the same chain; a TTFB over ~600ms is almost always a query or an upstream call, not the network.

## 4. Unoptimized rendering

What the browser does after the bytes arrive — decode, layout, script, hydrate. Lighthouse names each one; the fixes are structural, not stylistic. **Note the boundary: what to render and how it looks is `website-design`; this section is only about the cost of rendering it.**

- **Images.** Usually the LCP element and usually the biggest payload. **Measure:** the scanner's `large-image` check flags any raster image over **500 KB** (`high` over 1 MB) as a lead; confirm with the "Largest Contentful Paint element", "Properly size images", "Serve images in next-gen formats", and "Efficiently encode images" audits. **Fix:** serve **AVIF/WebP** with fallbacks; size to the rendered dimensions (never ship a 4000px hero into a 800px slot); serve a responsive `srcset`; set explicit `width`/`height` or `aspect-ratio` so the image reserves its box (this is also the CLS fix — the scanner's `img-dimensions` check flags an `<img>` in HTML with no `width`/`height` or `aspect-ratio`); `loading="lazy"` on below-the-fold images and **`fetchpriority="high"`** on the LCP image; use the framework's image component (`next/image` and equivalents) where present. Lazy-loading the LCP image is a common own-goal — it delays the very element the metric measures.
- **Render-blocking resources.** **Measure:** the scanner's `render-blocking` check flags a synchronous `<script src>` in `<head>` lacking `async`/`defer`/`type="module"`; confirm with "Eliminate render-blocking resources" and "Reduce unused CSS/JavaScript". **Fix:** add `defer` (or `async` for independent scripts), move the tag to the end of `<body>`, or make it `type="module"` — a sync script in `<head>` blocks first paint; inline critical CSS and load the rest async; self-host fonts with `font-display: swap` (see section 9).
- **Code-splitting.** **Measure:** "Reduce unused JavaScript" and the coverage panel (DevTools → Coverage) — unused bytes on load are the split targets; attribute the weight with a bundle analyzer (section 7). **Fix:** dynamic-import routes and heavy widgets so first paint ships only what it needs; a charting or editor library pulled into the initial bundle for a below-the-fold feature is the classic offender.
- **Hydration cost.** **Measure:** the "Minimize main-thread work" and TBT audits, plus long tasks in the performance trace. **Fix:** ship less client JavaScript — prefer server components / static HTML for non-interactive content, and hydrate only islands that need it. A page that renders instantly but is unresponsive for 500ms is failing INP to hydration, not failing LCP.

Where the fix is a loading **state** the user sees — a skeleton, a spinner, a placeholder that must not shift — build it to `website-design`'s craft rules (mirror the final layout, reserve the height); that is design's call, invoked, not restated here.

## 5. Static hosting when it should be static

The cheapest fast page is one that was already rendered. **A route whose output does not depend on the specific request should be built once and served from a CDN, not computed per hit** — that is TTFB near zero, infinite cache, and no server on the critical path.

**Measure.** Ask of each route: does the HTML change per user or per request? Marketing pages, docs, blog posts, changelogs, and landing pages almost never do. Check the response for a per-request server render (a dynamic `Cache-Control: no-store`, a cookie-gated body, a TTFB that scales with load) where the content is identical for everyone — that is a static page paying a dynamic cost.

**Fix.** Prerender it: static export / SSG for fully-static routes, **ISR or on-demand revalidation** for content that changes occasionally (rebuild on publish, serve static in between), and put a CDN in front with a real cache policy (section 6). Reserve per-request rendering for genuinely dynamic, personalized, or authenticated responses.

**When static is the wrong answer — do not force it:** authenticated dashboards, anything reading live/per-user data on every view, real-time feeds, and pages driven by request state (search results, personalized recommendations). For those the win is caching the *data layer* and streaming the shell, not prerendering the page. Static hosting is a default to reach for, not a rule to apply blindly.

## 6. HTTP caching and compression

Not file-shaped, so not scannable — but **the single biggest repeat-visit win, and the one most often missing.** A returning visitor should re-download almost nothing; a fingerprinted asset served with a weak cache header is paid for on every visit.

**Measure — read the response headers directly.** Request a built, fingerprinted asset (a hashed JS/CSS/font file) and the HTML document, and inspect what comes back:

```bash
curl -sI -H 'Accept-Encoding: br,gzip' <url>/<fingerprinted-asset> \
  | grep -iE 'cache-control|content-encoding|etag|last-modified|vary'
```

Two things must be true:

- **Compression is actually applied at the edge.** Request with `Accept-Encoding: br,gzip` and confirm the response carries **`content-encoding: br`** (or `gzip`). A missing header means text is shipping raw — brotli typically cuts HTML/JS/CSS 70–80%. This is a host/CDN setting, not a code change; verify it, do not assume the platform did it. (Also confirm `Vary: Accept-Encoding` so a cache does not serve a compressed body to a client that cannot read it.)
- **Cache-Control is right for the response's nature.** **Fingerprinted/immutable assets** (hashed filenames): `Cache-Control: public, max-age=31536000, immutable` — the hash changes when the content does, so the URL is safe to cache forever. **HTML documents and non-fingerprinted assets:** a short `max-age` with revalidation, or `no-cache` (revalidate every time) — never a long `max-age` on a URL whose content can change under a stable name. **Personalized or authenticated responses:** `Cache-Control: private, no-store` so a shared cache never serves one user's data to another.

**Revalidation for anything not immutable.** Ensure the response carries an **`ETag`** (content hash) or **`Last-Modified`**, so a revalidation returns a cheap `304 Not Modified` instead of the whole body. Confirm the round-trip:

```bash
curl -sI <url>/<asset> | grep -i etag                 # grab the ETag value
curl -sI -H 'If-None-Match: "<etag>"' <url>/<asset>   # expect: HTTP/… 304
```

**Fix.** Set the cache and encoding policy at the host/CDN (Vercel/Netlify `_headers`, nginx, CloudFront behavior). Long `immutable` for hashed assets; revalidation headers for everything mutable; `no-store`/`private` for personalized bodies; enable Brotli (fallback Gzip) for text types. Re-run the `curl -I` probe and confirm each header is now what it should be.

## 7. JS bundle budget

An initial bundle that creeps up ships parse and execution cost to every visitor and starves INP. Weight is only actionable once it is **attributed** — which dependency is it, and is it needed on first paint.

**Measure.** Attribute the built JS (not the dev bundle) with a source-map-driven analyzer:

```bash
npm run build
npx source-map-explorer 'dist/**/*.js'          # or the framework's build output dir
# rollup/Vite: add rollup-plugin-visualizer to the build and open the generated stats.html
```

**Set a budget and enforce it.** A reasonable default for initial (route-critical) JS is **≈170 KB gzipped**; pick the number for the project and write it down. Treat any regression past the budget as a **finding**, not a note — a bundle that quietly grows 30 KB a release is how a fast site becomes a slow one. The analyzer names the offender: a whole date/icon/charting library pulled in for one call, two copies of a dependency at different versions, a moment/lodash import that could be a tree-shaken subset.

**Fix.** Dynamic-import routes and heavy widgets (section 4), replace a heavyweight dependency with a lighter one or a few lines of your own, import named members so tree-shaking can drop the rest, and de-duplicate versions. Re-run the analyzer and confirm the initial chunk is back under budget.

## 8. Third-party scripts

Every third-party script (analytics, chat widget, tag manager, embedded video/map, A/B tool) is a **performance and privacy cost you do not control** — it executes on the main thread, opens connections to another origin, and can regress overnight when the vendor ships a change.

**Measure.** Run the Lighthouse **"Reduce the impact of third-party code"** audit (the `third-party-impact` audit) — it lists each third-party origin with its transfer size and main-thread blocking time, so the worst offenders are ranked, not guessed. Cross-check against the **`third-party-sdk` inventory the legal phase produces** (`references/legal.md` / the scanner's `third-party-sdk` check): the same scripts are a consent-and-disclosure obligation there and a speed cost here — one list, two reasons to cut it.

**Fix**, in order:

1. **Drop what is unneeded.** The cheapest third-party script is the one you deleted. Audit whether each one still earns its place.
2. **Lazy-load** non-critical scripts (`async`/`defer`, or load after first interaction / when idle) so they never sit on the critical path.
3. **Facade** the heavy embeds — render a lightweight click-to-load placeholder (a static thumbnail for a video, a map image) and load the real, expensive embed only on interaction. This can move hundreds of KB and a chunk of main-thread time off first paint entirely.

Re-measure the audit and confirm the third-party blocking time dropped.

## 9. Fonts

Web fonts delay text and shift layout when handled naively — invisible text during load (FOIT) delays LCP, and a late-swapping face reflows the page (CLS). The performance handling is measurable and belongs here; the *type choice and visual treatment* is `website-design`.

**Measure.** Lighthouse "Ensure text remains visible during webfont load" flags any face without a `font-display` strategy; the LCP audit shows when a text LCP element is waiting on a font; the network waterfall shows a third-party font handshake (`fonts.googleapis.com` → `fonts.gstatic.com`) on the critical path.

**Fix.**

- **Self-host WOFF2.** Drop the third-party handshake (two extra origins on the critical path) by serving the font from your own origin; WOFF2 is the only format worth shipping.
- **Subset to the glyphs used.** Ship Latin (or the actual character set) instead of the full multi-language file — often a 5–10× size cut.
- **Preload the one or two critical faces** (`<link rel="preload" as="font" type="font/woff2" crossorigin>`) so the LCP text is not waiting on a late-discovered font. Preload only the faces above the fold — preloading everything just moves the contention.
- **Set `font-display: swap`** (render fallback immediately, swap when the face loads) or **`optional`** (use the face only if it is already cached; otherwise keep the fallback for this visit — zero layout shift). Pair with a metrics-matched fallback stack (`size-adjust`, `ascent-override`) to minimize the swap reflow. In Next, `next/font` self-hosts, subsets, preloads, and sets the fallback automatically — see `stacks.md`.

**Licence caveat:** self-hosting is not always permitted — the **ITF Free Font Licence self-hosting caveat lives in `website-design/references/craft.md`**; check it before rehosting a font you did not buy outright.

## 10. Discoverability metadata

Not speed, but measured by the same tool on the same production build, and the launch-checklist items `website-design`'s T45 hands to this skill. Per-route `<title>`, favicon and a designed 404 stay with `website-design`; the rest is here.

**Measure.**

```bash
npx lighthouse <url> --only-categories=seo --quiet --chrome-flags="--headless"
curl -s <origin>/robots.txt; curl -sI <origin>/sitemap.xml   # both must exist on the production host
```

Then view source on each distinct template and confirm a unique `<meta name="description">`, `og:title` / `og:description` / `og:image` (absolute URL, 1200×630 is the safe size), and a canonical link.

**Fix.** Generate the description and Open Graph tags per route from the route's own content (the framework metadata API, not one shared default), add `sitemap.xml` listing the public routes and reference it from `robots.txt`. Keep `robots.txt` to crawl directives: listing `/admin` or other private paths there advertises them to attackers and protects nothing, so those need auth (Phase 2). Check a preview build or staging host is set to `noindex` and production is not; flipping those is a common launch-day mistake.

## Boundary with website-design

Stated so it is not crossed. **This file owns measured runtime cost: payload bytes, query round-trips, the critical path, render and hydration time, HTTP caching and compression, bundle weight, third-party impact, font loading strategy, and hosting model.** `website-design` owns everything about how the page looks and behaves while it works — the loading and skeleton states, the layout-shift-free placeholder design, the type and visual treatment of fonts, motion and its `prefers-reduced-motion` handling, and the visual verification protocol (Playwright screenshots, the console-error check, axe-core). CLS sits on the seam: the *metric and its budget* (≤ 0.1) are measured here and fixed structurally here (reserve image and ad boxes, size media, avoid injecting content above existing content), but the *designed loading experience* that avoids the shift in the first place is craft — defer to `website-design` for that. When a performance fix would change how the page looks or what states it shows, it is a design decision: invoke the other skill rather than deciding it here.

## The measure-then-fix table

Every row is a lead, its measurement, and its fix. A claim without the command that proves it is not a finding.

| Symptom | Measure | Fix |
|---|---|---|
| LCP > 2.5s | Lighthouse "Largest Contentful Paint element" | Optimize/size the LCP image, `fetchpriority="high"`, remove render-blocking resources ahead of it |
| INP > 200ms | real interaction + TBT / long-tasks trace | Ship less client JS, code-split, reduce hydration, break up long main-thread tasks |
| CLS > 0.1 | Lighthouse "Cumulative Layout Shift" | Reserve boxes (`width`/`height`, `aspect-ratio`), metrics-matched font fallback; designed skeleton → `website-design` |
| Enormous payload | `scan.mjs --only perf` (`uncompressed-json`) + network panel | Server-side, paginate, brotli, minify |
| Slow write endpoint | `scan.mjs --only perf` (`row-at-a-time-writes`) + endpoint timing | One multi-row insert / `createMany` / transaction |
| List endpoint slow | ORM query log — count queries per request | Eager-load the relation or one `WHERE id IN (…)` (kills N+1) |
| High TTFB / one slow request | Network waterfall + "Reduce server response time" | Parallelize, cache the upstream, prerender if the route is static |
| Render-blocking script | `scan.mjs --only perf` (`render-blocking`) + "Eliminate render-blocking resources" | `defer`/`async`/`type="module"`, or move to end of `<body>` |
| Oversized raster image | `scan.mjs --only perf` (`large-image`) + "Serve images in next-gen formats" | AVIF/WebP, size to rendered slot, responsive `srcset` |
| Image layout shift | `scan.mjs --only perf` (`img-dimensions`) + CLS audit | Set `width`/`height` or `aspect-ratio` to reserve the box |
| No compression at edge | `curl -sI -H 'Accept-Encoding: br,gzip'` → `content-encoding` | Enable Brotli (fallback Gzip) for text types at host/CDN |
| Slow repeat visits | `curl -sI` → `Cache-Control` / `ETag` / `Last-Modified` | `immutable` + long `max-age` for fingerprinted assets; revalidation headers for mutable; `private, no-store` for personalized |
| Big initial JS bundle | "Reduce unused JavaScript" + Coverage + `source-map-explorer` / `rollup-plugin-visualizer` | Dynamic-import routes and heavy widgets; enforce a ~170 KB gz budget |
| Heavy third-party scripts | Lighthouse "Reduce the impact of third-party code" | Drop the unneeded, lazy-load, or facade the heavy embed; cross-ref legal `third-party-sdk` |
| Font FOIT / LCP delay | Lighthouse "Ensure text remains visible" + LCP audit | Preload critical faces, self-host WOFF2, subset, `font-display: swap`/`optional` |
| Missing description / OG image / sitemap | Lighthouse `--only-categories=seo` + `curl` robots.txt and sitemap.xml | Per-route metadata, `sitemap.xml` referenced from `robots.txt`, no private paths in `robots.txt` |
| Dynamic cost, static content | per-route: does output vary by request? | SSG / static export / ISR + CDN |

Re-run the owning command after every fix. The phase is done when the three vitals sit in the good band against a production build — measured, recorded, and reproducible — not when the page feels faster.
