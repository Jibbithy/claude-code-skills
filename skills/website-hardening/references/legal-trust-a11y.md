# Legal, trust, and accessibility — the compliance and honesty layer

## Contents

- [How this file is tested](#how-this-file-is-tested)
- [A. Policies and data rights](#a-policies-and-data-rights)
- [B. Honest marketing](#b-honest-marketing)
- [C. Accessibility conformance](#c-accessibility-conformance)
- [The accessibility boundary with website-design](#the-accessibility-boundary-with-website-design)
- [Corrections](#corrections)
- [Appendix — if the site also ships as an iOS app](#appendix--if-the-site-also-ships-as-an-ios-app)

Phase 3 owns three things and only these: the legal pages and data-subject rights a site must carry, the marketing claims it is allowed to make, and the site-**wide** accessibility conformance that survives a legal challenge. It targets **WCAG 2.2 level AA** and names the regimes it answers to — **GDPR, UK-GDPR, CCPA/CPRA, PIPEDA, COPPA, CAN-SPAM** — rather than gesturing at "compliance." It does **not** own visual accessibility: contrast, `focus-visible`, keyboard operability, and the designed state surfaces belong to `website-design`, verified by its screenshot + axe protocol, and are deferred to explicitly below. Every item here that can be decided from source carries its exact scanner check id; every item that can only be proven at runtime carries the axe-core command. A claim of compliance without the command that proves it is worth nothing.

---

## How this file is tested

Two halves, two commands. The static half reads source and reports statically-decidable findings keyed by check id:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only legal,a11y
```

The runtime half is authoritative for accessibility and runs against **rendered pixels**, because the static heuristics for contrast, labels, and alt text approximate what only a real accessibility tree can confirm. Run axe-core through Playwright against every distinct page template on a running build:

```js
// axe-run.mjs — exits non-zero on any WCAG 2.2 A/AA violation, prints each with its nodes.
// deps: npm i -D playwright @axe-core/playwright  (or inject axe.min.js if deps are barred)
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
const urls = process.argv.slice(2);
if (!urls.length) { console.error('usage: node axe-run.mjs <url> [url…]'); process.exit(2); }
const browser = await chromium.launch({ channel: 'chrome' });
let total = 0;
for (const url of urls) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  for (const v of violations) {
    total += v.nodes.length;
    console.log(`[${v.impact}] ${v.id} — ${v.help} (${v.nodes.length}) ${v.helpUrl}`);
    for (const n of v.nodes) console.log(`   ${n.target.join(' ')}`);
  }
  await page.close();
}
await browser.close();
console.log(total ? `\n${total} axe node violations across ${urls.length} page(s)` : '✓ axe clean');
process.exit(total ? 1 : 0);
```

**Neither half alone is a pass.** The scanner cannot see a contrast failure produced by opacity stacking or a label that is present in source but detached in the accessibility tree; axe cannot see a missing privacy page or a fabricated review. Run both, fix, and re-run until each is clean. If Playwright binaries are absent, print `npx playwright install chromium`, state that runtime a11y verification is **blocked**, and never report the a11y half as passed.

---

## A. Policies and data rights

**A1 — Identify the jurisdiction before choosing the regime.** Compliance is not a fixed checklist; it is a function of where the business is established and where its users are. Determine, in writing: the business's country/state of establishment, where it processes data, and where its users are located. Then map to the applicable regimes — **EU users → GDPR**; **UK users → UK-GDPR + PECR**; **California users → CCPA/CPRA**; **Canada → PIPEDA**; other US states have their own (VCDPA, CPA, etc.); children in scope → **COPPA**. A US-only SMB with EU visitors still owes GDPR to those visitors. Record the determination so the rest of Part A is scoped, not guessed. There is no scanner check for jurisdiction — it is a judgment the scanner's other legal checks assume you have already made.

**A2 — Required policy pages exist and are linked.** Privacy, terms, refund (wherever money changes hands), and cookie policy must each exist as a real page and be linked (footer is conventional).

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only legal   # check: policy-pages
```

Fix: add the missing page and link it. A refund/returns policy is mandatory on any site taking payment; a cookie policy is mandatory wherever any non-essential cookie is set (see A5).

**Starting drafts, not finished policies.** `General-Legal/legal-templates` (github.com/General-Legal/legal-templates, CC0-1.0, drafted by the attorneys at General Legal, PC; repo and licence checked 2026-10-17) ships markdown + .docx templates for terms of use, US and GDPR privacy policies, a cookie notice, US and global DPAs, NDAs, an MSA and a BAA; the fields to customize are wrapped in `<mark>` tags. Copy the `template.md` you need; the repo's two Python scripts only re-sync its own files and are not needed. A template is **not legal advice and not compliant as shipped**: tailor it to the A1 jurisdiction, the actual processors (A10/A12), the retention schedule (A11) and the real DSAR path (A7), then delete every clause that describes something the site does not do. A policy that promises things the code doesn't do is the A7 failure in a different place. Get a lawyer to review anything beyond a low-risk brochure site. The "$2,500 / $5,000 per violation" figures that travel with this repo on social media cite no statute; do not repeat them.

**A3 — Real business details are present.** The privacy policy and/or an imprint must name the legal entity, a physical/registered address, and a working contact route (email or form). GDPR Art. 13 and most consumer-protection law require an identifiable, reachable controller; a policy signed by "we" with no entity is non-compliant and erodes trust. Fix: state the legal name, address, and a monitored contact. Not machine-decidable — verify by reading the rendered policy.

**A4 — Data minimization.** Collect only what the stated purpose needs. An email-capture form asking for phone, company, and job title "for later" is a violation of GDPR Art. 5(1)(c) and a needless breach liability. Fix: delete every field not required for the declared purpose; if a field is genuinely optional, mark it optional and justify it in the privacy policy. Reviewed by hand against each form; the scanner flags the consent gap (A6), not the field count.

**A5 — Cookie consent that matches the regime.** Non-essential cookies (analytics, marketing, session-replay) must be **blocked until opt-in for GDPR/PECR** and must offer a clear **opt-out for CCPA** (a "Do Not Sell or Share My Personal Information" path). A banner that sets Google Analytics on page load and then asks is non-compliant — the order is load-**after**-consent, not load-then-ask.

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only legal   # check: cookie-consent
```

The check fires when a tracking cookie/SDK is present and no consent mechanism is. Fix: gate every non-essential tag behind an opt-in (Consent Mode v2, Klaro, or a hand-rolled gate that defers script injection until consent), and prove it: load the page with a fresh profile, confirm **no** analytics/marketing cookie or beacon fires before a click, then confirm it fires only after opt-in. Disclosure alone (A2's cookie policy) is not consent.

**A6 — Form consent at the point of collection.** Any form collecting personal data needs an **explicit, unchecked** consent checkbox and a privacy-policy link beside it. Pre-ticked boxes are invalid consent under GDPR (*Planet49*, C-673/17).

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only legal   # check: form-consent
```

Fix: add `<input type="checkbox">` that is **not** `checked` by default, wire submission to require it, and link the privacy policy inline at the field — not only in the footer.

**A7 — A working DSAR / deletion path for both regimes.** Provide a route to exercise **GDPR erasure (Art. 17) and access (Art. 15)** and **CCPA delete + opt-out** — a dedicated email (`privacy@`), a form, or an in-account control. A policy that promises deletion with no mechanism is the common failure. Fix: build the intake **and** the back-end that fulfills it. Test the path end to end — submit a deletion request against a seeded test account, confirm the account and its personal data are actually removed (not just soft-flagged) within the statutory window (GDPR: without undue delay, ≤ 1 month; CCPA: 45 days), and confirm an acknowledgement is sent. A path that intakes but never deletes is worse than none — it is a written promise you are breaking. Not scanner-decidable; prove it by running the request.

**A8 — Children: age gate and verifiable parental consent.** If the audience includes children under 13 (**COPPA**) — or under 16 for GDPR consent without a parent (**Art. 8**, floor varies by member state) — add an age gate and do not collect a child's personal data without verifiable parental consent. Fix: gate collection behind an age check; where children are genuinely in scope, implement verifiable parental consent, not a checkbox. If the audience is adults only, state that and design so children are not solicited. Judgment call — no scanner check.

**A9 — Unsubscribe on every marketing email.** Every commercial email needs a working unsubscribe (**CAN-SPAM**), and one-click list-unsubscribe (`List-Unsubscribe` + `List-Unsubscribe-Post` headers) is now required by Gmail/Yahoo bulk-sender rules. Fix: add a functioning unsubscribe link and the headers; honor opt-outs within 10 business days (CAN-SPAM). Test by sending to a seed address and clicking through. Verified against the sending code/ESP config, not the static site scan.

**A10 — Tracking is disclosed and consented.** Every analytics/marketing/session-replay tool must be named in the privacy/cookie policy **and** gated by A5's consent. The static half inventories what is loaded so nothing is silently omitted from disclosure:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only legal   # check: third-party-sdk
```

Fix: for each SDK the scan lists, confirm it appears in the policy and behind consent; drop any you do not need (this overlaps B6 — undisclosed tracking is both a privacy breach and a supply-chain/dark-pattern issue).

**A11 — Data retention schedule (storage limitation).** Disclosure is not enough — **GDPR Art. 5(1)(e)** forbids keeping personal data longer than the purpose needs. Publish, per data category (account, order, support tickets, analytics events, logs, backups), **how long it is kept and the concrete deletion trigger** (e.g. "support tickets: 24 months after closure, then purged"). Then prove the schedule is real, not aspirational: the published retention must match the **actual database TTLs / cron purges / backup rotation**. No scanner check — hand-verify. Probe: for each category, read the retention row, then read the corresponding TTL, scheduled-delete job, or backup lifecycle in the code/DB config and confirm they agree. Fix: publish the retention table, implement the deletion (a TTL column + purge job, an S3/object-store lifecycle rule, a backup expiry) for every category, and reconcile the two. A schedule with no enforcing job is a promise you are breaking; an enforcing job with no published schedule is undisclosed processing.

**A12 — Sub-processor DPAs and an international-transfer mechanism.** The `third-party-sdk` inventory (A10) must **not stop at disclosure**. For every third-party processor it finds — plus back-end processors the static scan cannot see (hosting, email/ESP, payments, error tracking, LLM APIs) — you owe two things. First, a **Data Processing Agreement (GDPR Art. 28)** binding that processor to your instructions and confidentiality. Second, for any processor that stores or accesses data **outside the user's jurisdiction** (most US SaaS serving EU/UK users), a valid **Chapter V transfer mechanism** — **Standard Contractual Clauses (SCCs)** / the UK IDTA/Addendum, or reliance on an **adequacy decision** (e.g. the EU–US Data Privacy Framework where the processor is certified). No scanner check — this is a per-processor record. Probe: for each SDK/processor, produce (a) the signed DPA and (b) the transfer mechanism; a gap on either is the finding. Fix: sign the processor's DPA (most publish a standard one), confirm/execute SCCs or verify DPF certification, and list every sub-processor in the privacy policy so users can see the chain.

**A13 — Data-breach and incident-response basics, with a breach register.** A launch without an incident plan is not launch-ready. Minimum posture: under **GDPR Art. 33** you must notify the supervisory authority **within 72 hours** of becoming aware of a personal-data breach, and under **Art. 34** notify affected data subjects **without undue delay** when the breach is high-risk to them; US **state breach-notification laws** impose their own deadlines and AG/consumer notice. Maintain a **breach register** — a record of every breach (facts, effects, remedial action) that Art. 33(5) requires **whether or not** it was notifiable. No scanner check — verify the artifacts exist. Probe: confirm there is (a) a written incident-response runbook naming who assesses, who notifies, and the clocks, and (b) a breach register template/store. Fix: write the runbook (detection → assessment → 72-hour authority notice → subject notice if high-risk → register entry), assign an owner, and stand up the register before go-live, not after the first incident.

**A14 — Consent proof and equally easy withdrawal.** Consent you cannot evidence is no defense. **GDPR Art. 7(1)** puts the **burden of proof on you** to show consent was given — so **record what was consented to, when, the version of the notice shown, and how** (for cookies this is the consent-string/log from A5's banner; for forms, the A6 checkbox state plus timestamp). **Art. 7(3)** requires withdrawal to be **as easy as granting** — a one-click "reject all" / "withdraw consent" that mirrors the opt-in, not a buried email request. No scanner check — verify at runtime. Probe: grant consent, confirm a durable consent record is written (log/DB row, not just a client cookie), then withdraw and confirm the withdrawal is as few steps as the grant and actually stops the processing. Fix: persist a consent record server-side, and add a visible withdrawal control equal in prominence to the original opt-in.

---

## B. Honest marketing

Dark patterns and unsubstantiated claims are regulated (FTC, EU UCPD, UK CMA/DMCCA, ASA) and are a trust liability independent of the law. Remove them; do not merely soften them.

**B1 — No hidden or drip fees.** Mandatory fees must appear in the headline price, not surface at checkout.

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only legal   # check: hidden-fees
```

Fix: fold every mandatory charge into the displayed price; if a fee is genuinely conditional, disclose it before the user commits. Late-disclosed mandatory fees are a regulated dark pattern (FTC "Junk Fees" rule).

**B2 — No fabricated reviews or social proof.** Star counts, "N happy customers," and testimonials must be real, evidenced, and attributable.

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only legal   # check: fake-reviews
```

Fix: remove any figure you cannot substantiate; for real reviews, keep the evidence and attribution. Fake reviews are unlawful (FTC 2024 rule; UK DMCCA).

**B3 — No unsupported superlatives.** "#1," "the best," "guaranteed," "100% secure," "world's leading" are absolute claims that invite regulator action unless proven.

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only legal   # check: unsupported-claims
```

Fix: replace with a specific, substantiable statement ("rated 4.6 by 312 verified buyers") or remove. "100% secure" is doubly bad — it is also a security claim you cannot honor.

**B4 — No forced urgency.** Fake countdown timers, "only 2 left" that never changes, and manufactured scarcity are manipulation and, in the EU/UK, an unfair commercial practice. Fix: remove timers and stock counts that are not tied to real state; a countdown must reflect a real deadline and a stock figure a real inventory. No scanner check — inspect whether the number is bound to actual data or hard-coded/reset-on-load.

**B5 — Third-party SDK inventory: disclose, gate, drop.** Same list as A10, judged here for necessity. For every SDK: disclose it (A10), gate it behind consent (A5), and **drop the ones you do not need** — each is a privacy surface, a performance cost (Phase 4), and a supply-chain risk (Phase 6). Fix: remove unused tags entirely; the fewest third parties that meet the goal is the target. Uses the `third-party-sdk` check as its inventory.

**B6 — Font and image licensing, verified per asset.** Every font and image shipped must have a license that permits web/commercial use, verified individually — not assumed. Fix per asset: for fonts, confirm the license permits web embedding and, for self-hosting, redistribution (note the ITF Free Font Licence used by Fontshare families **bars self-hosting and subsetting** — see `website-design`'s `craft.md` catalog for which faces this affects); for images, confirm you hold the license or the asset is CC0/CC-BY (with attribution rendered) or a purchased-license stock file — keep the license file or receipt. Screenshots of third-party UI, logos, and "found on Google" images are **not** licensed by default. There is no scanner check for copyright ownership; it is a per-asset verification you record. This is the licensing counterpart to Phase 0's `externals.md` audit, applied to media rather than code.

---

## C. Accessibility conformance

This part owns the **site-wide conformance sweep, the audit-at-scale of the statically-decidable a11y defects, and the legal-facing conformance posture** — not the design-time styling of accessible states, which is `website-design`'s (see the boundary section below).

**C1 — Alt-text audit at scale.** Every content image needs descriptive `alt`; decorative images need `alt=""`.

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only a11y   # check: img-alt
```

Fix: add `alt` describing the image's purpose; use `alt=""` (not a missing attribute) for purely decorative images so screen readers skip them. Static catches missing attributes; the axe run catches empty-but-meaningful and redundant alt at runtime (WCAG 1.1.1).

**C2 — Form-label audit at scale.** Every input needs a programmatic label; a placeholder is not a label (it disappears on entry, WCAG 3.3.2).

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only a11y   # check: form-labels
```

Fix: give each field a `<label for>` or `aria-label`/`aria-labelledby`. The runtime axe pass confirms the label actually resolves in the accessibility tree, which the static regex only approximates.

**C3 — `<html lang>` on every document.** Assistive tech needs the page language to choose pronunciation and voice.

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only a11y   # check: html-lang
```

Fix: `<html lang="en">` (or the correct BCP-47 tag); set `lang` on any inline passage in another language (WCAG 3.1.1/3.1.2).

**C4 — The site-wide runtime sweep is authoritative.** Run `axe-run.mjs` against **every distinct page template**, not just the home page — a conformance claim covers the whole site, and defects cluster in forms, tables, modals, and data views that the landing page does not exercise. Fix each violation axe reports at its node; re-run until clean. This is the pass that lets you stand behind a **WCAG 2.2 AA conformance claim** — do not publish an accessibility statement asserting AA until this run is clean across all templates. The static scan is a lead generator; this is the evidence.

**C5 — Accessibility is legal exposure, not only good practice.** An inaccessible site is a compliance risk in its own right: **ADA Title III** (US, the basis of thousands of web suits), the **European Accessibility Act (EAA, in force June 2025)** and **EN 301 549** (which adopts WCAG 2.1 AA as the technical floor), and Section 508 for anything touching US federal procurement. AA is the defensible target because it is the level these regimes reference. Treat a failing `axe-run.mjs` the same as a failing security scan — a shippability blocker, not a nice-to-have. The conformance posture (which standard, which level, tested how, known gaps) belongs in a written accessibility statement, backed by the axe evidence.

**C6 — axe is not a full WCAG 2.2 AA pass on its own; the manual criteria checklist.** Automated tooling decides only a fraction of the WCAG success criteria — roughly a third to a half; the rest are human judgment. **A clean `axe-run.mjs` is necessary, never sufficient**, and it is *not* authoritative for AA conformance. Walk this list by hand on **every distinct template**, keyboard-only first, then with a screen reader. The four criteria **new at AA in WCAG 2.2** are non-negotiable additions to any older checklist:

1. **2.4.11 Focus Not Obscured (Minimum)** *(new in 2.2)* — when a control receives keyboard focus it must not be **entirely hidden** by author content (sticky headers, cookie banners, chat widgets, toolbars). Probe: `Tab` through the page at several scroll positions and confirm the focused control is at least partially visible each time. Fix: **styling/layout → route to `website-design`** (sticky offset, `scroll-margin`, z-index); the requirement to test it is compliance posture owned here.
2. **2.5.7 Dragging Movements** *(new in 2.2)* — any operation done by dragging (reorder lists, sliders, map pans, drag-to-dismiss) must have a **single-pointer alternative** (tap/click buttons). Probe: attempt each drag interaction using only clicks/taps. Fix: **interaction design → coordinate with `website-design`** to add the click alternative; the requirement is owned here.
3. **2.5.8 Target Size (Minimum)** *(new in 2.2)* — interactive targets must be **at least 24×24 CSS px**, unless a spacing exception applies (a 24px-diameter circle centered on the target does not overlap a neighbor's), the target is **inline** in a sentence, or it is a user-agent default. Probe: measure small controls (icon buttons, close ✕, pagination, dense toolbars) in devtools. Fix: **sizing is styling → route to `website-design`**; the measurement and the compliance call are owned here.
4. **3.3.8 Accessible Authentication (Minimum)** *(new in 2.2)* — no step of login may require a **cognitive-function test** (remembering/transcribing a password, solving a puzzle, reading a CAPTCHA) **without an alternative or an assisting mechanism**. Password managers must be allowed to **paste and autofill** (no blocking paste, no field-splitting that defeats autofill), and puzzle/CAPTCHA gates need a non-cognitive path (email link, passkey, OTP). Probe: log in using a password manager's paste/autofill; confirm a non-puzzle route exists. Fix: **owned here** — this is auth-flow and compliance, not styling: allow paste/autofill and provide the alternative.
5. **1.4.10 Reflow** — no **two-dimensional scrolling** for vertical content at **320 CSS px width** (equivalently 400% zoom on a 1280px viewport). Probe: set the viewport to 320px wide (or zoom to 400%) and confirm no horizontal scrollbar appears for the main content. Fix: **responsive layout → route to `website-design`**; the requirement to test it is owned here.
6. **Logical focus order (2.4.3) and no keyboard trap (2.1.2)** — `Tab` order follows reading/meaning order, and focus can always move away from every component. Probe: `Tab` through the entire page; confirm order matches the visual/reading order and focus is never trapped in a widget or modal. Fix: DOM order / `tabindex` / focus-management is **keyboard operability, owned by `website-design`** (`craft.md` §6) — route the fix there; flagging the failure is owned here.

Division of labor, stated once so it is not re-litigated per finding: the **styling and interaction fixes** — target size, reflow layout, a focus indicator, the offset that stops focus being obscured, the click alternative to a drag — are **`website-design`'s to implement**; what this file owns is **the obligation to test all of C6, the auth-flow criterion (3.3.8), and the written conformance record**. Log every C6 failure the same way you log an axe violation.

**C7 — Publish an accessibility statement (but not a premature AA claim).** A conformance statement is expected under the EAA/EN 301 549 regime and is the honest counterpart to C5's posture. Required content: (1) **the standard and level targeted** (WCAG 2.2 level AA); (2) **the testing method and date** — the site-wide axe-core + Playwright sweep (C4), the manual C6 walk, and when they were last run; (3) **known gaps with a remediation timeline** — name what fails and by when it will be fixed; (4) a **feedback/contact route** for people who hit an access barrier. **Do not publish an AA conformance claim until the C4 site-wide axe sweep is clean across every template** and C6 has been walked — an untrue accessibility claim is itself actionable. Template stub:

```
Accessibility statement

We aim to conform to WCAG 2.2 level AA.
Last tested <date>, using axe-core (automated, across all page templates) plus a
manual keyboard-and-screen-reader review of the criteria automated tools cannot decide.
Known limitations: <each known gap, with a target fix date — or "none known">.
If you encounter an accessibility barrier on this site, contact <email / form>;
we aim to respond within <N> business days.
```

Fix: fill the stub from real evidence (dated axe output + C6 walk notes), keep the "last tested" date current, and update the known-gaps list as items close.

**A statement is not a shield.** "Generate an accessibility statement and put it in the footer — now you won't get sued" circulates as vibe-coding advice, and it is wrong. ADA claims turn on whether disabled users can actually use the site; a statement over an inaccessible site documents the gap rather than curing it, and a generated one claiming conformance that was never tested is itself a false claim (B3). Overlay widgets fail the same way: in 2025 the FTC made accessiBe pay $1M and stop claiming its AI widget could make any site WCAG-compliant. The statement is the *last* step of C4–C6, never a substitute for them.

---

## The accessibility boundary with website-design

Stated loudly because it is the boundary most likely to be crossed. **`website-design` owns and verifies the design-time accessibility of surfaces, and this file does not restate it.** Specifically, the following are **not** this skill's to define or re-derive:

- **Color contrast** — the thresholds (WCAG 2.2 AA 4.5:1 / 3:1, and the APCA `Lc` targets), how to measure it, and the fix live in `website-design`'s `craft.md` and `review.md`; contrast is measured against rendered pixels there. `scan.mjs --only a11y` includes a crude static `contrast` heuristic that flags obvious same-rule hex pairs below 4.5:1 — treat any hit as a **lead to route to `website-design`**, not as the authority, and never treat a clean static contrast result as verification. Opacity-stacked and token-derived colors, which are the ones that actually fail, are only decidable in `website-design`'s screenshot + axe protocol.
- **`focus-visible` styling, keyboard operability, and the visible focus ring** — owned by `craft.md` (§6) and gated by `review.md`'s hard geometry checks and the states rubric.
- **The designed state surfaces** (empty, loading, error, disabled) — owned by `website-design`'s `states.md` and its states-rendered rubric check.

When a design-time accessibility defect is the actual gap — a focus ring that fails contrast, an unreachable control, a state that was never designed — **that is a `website-design` fix; route it there.** This file's a11y scope is the automated, site-wide, at-scale conformance sweep (C1–C4) and the legal posture (C5). Where axe reports a contrast or focus violation, log it and hand the styling fix to `website-design` rather than solving it here — the tools overlap on purpose (both run axe), but the design decisions have one owner.

---

## Corrections

Common misconceptions that would make Phase 3 work confidently wrong. The left column is what circulates; the right is what holds.

| # | Claim | Reality |
|---|---|---|
| 1 | **"US business, US law only."** | Regime follows the **user's** location, not the company's. EU/UK/California visitors pull GDPR/UK-GDPR/CCPA regardless of where the business sits. Scope from A1, not from the mailing address. |
| 2 | **A cookie banner is consent.** | A banner that sets non-essential cookies **on load** is not consent — GDPR requires load-**after**-opt-in. Prove it with a fresh-profile network trace, not by the banner's presence. |
| 3 | **A privacy policy promising deletion is a DSAR path.** | The promise is not the mechanism. A9/A7 require a route that **actually deletes** on request, tested end to end against a seeded account. |
| 4 | **A pre-ticked consent box is fine if the user can untick it.** | Invalid under GDPR (*Planet49*). Consent must be an **unchecked**, affirmative action. |
| 5 | **Passing `scan.mjs --only legal,a11y` means compliant/accessible.** | The static scan is statically-decidable leads only. Conformance requires the **runtime axe sweep across all templates**, the **manual C6 criteria walk**, plus the hand-verified items (A1, A3, A4, A7, A8, A11, A12, A13, A14, B4, B6) the scanner cannot decide. |
| 6 | **A clean static contrast result means contrast passes.** | The static heuristic only sees same-rule hex pairs. Contrast is owned and verified by `website-design` against rendered pixels; a clean static result is not verification. |
| 7 | **Accessibility is best-practice, not law.** | ADA Title III, the EAA (2025), EN 301 549, and Section 508 make WCAG-level accessibility a legal obligation. A failing axe run is a shippability blocker. |
| 8 | **"Found on Google" images and screenshots of other UIs are usable.** | Unlicensed by default (B6). Every font and image needs a license verified per asset, with the receipt/license kept. |
| 9 | **An AI-generated accessibility statement (or an overlay widget) protects against ADA suits.** | It does not. Liability follows actual access; an untested conformance claim is itself a misrepresentation (B3), and the FTC's 2025 accessiBe order ($1M) was over exactly that claim for an AI widget. Remediate (C1–C6), then publish the statement (C7). |
| 10 | **Passing this skill's checks means we can say "SOC 2 / ISO 27001 compliant."** | SOC 2 is a report issued by an independent CPA auditor after an observation period; ISO 27001 is a certification from an accredited body. No scan or self-assessment produces either, and claiming one you do not hold is an unsupported claim (B3). If an enterprise deal requires it, that is an audit engagement plus a GRC platform (Vanta, Drata, Secureframe), a purchasing decision outside this skill. |
| 11 | **"Sign in with Apple" is mandatory once you offer Google sign-in.** | Outdated. App Review 4.8 now asks for *an* equivalent login option that limits data to name and email, lets users hide their email, and does not track for ads; Sign in with Apple is one way to meet it. See the appendix. |

---

## Appendix — if the site also ships as an iOS app

Outside Phase 3's three areas, recorded here because most App Store rejections of AI-built apps are policy and disclosure failures rather than bugs. Checked against Apple's App Review Guidelines on 2026-10-17; the guidelines change, so re-read the live page before a submission.

- **Payments (3.1.1).** Digital content and features unlocked in the app use in-app purchase, with a working **Restore Purchases** for anything restorable. Physical goods and real-world services use your own processor (Stripe is fine there, 3.1.3(e)). On the **US storefront only**, apps may also link or button out to an external purchase; elsewhere they may not.
- **Login (4.8).** Offering Google/Facebook/other social login requires an equivalent privacy-preserving option (see Correction 11). Apps with only their own account system are exempt.
- **Account deletion (5.1.1(v)).** If the app creates accounts, deletion must be initiated in the app, not by email request — and it should drive the same back-end path as A7.
- **User-generated content (1.2).** Filtering, a report mechanism with timely response, the ability to block abusive users, and published contact details.
- **Not a website in a box (4.2).** A WebView wrapper of the marketing site with nothing app-like is rejected for minimum functionality.
- **Completeness (2.1).** A working demo account (and a live back end) for the reviewer; no "coming soon" screens or placeholder content; working support and privacy-policy links (the A2 pages).
- **Metadata (2.3).** Screenshots show the real current app in use, and any featured item that costs extra is labelled as requiring purchase (2.3.2). If the app runs on iPad, the iPad layout must actually work.

The "Apple rejected 1.2 million apps" figure that travels with these lists is unsourced; do not repeat it.
