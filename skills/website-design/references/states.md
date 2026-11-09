# States & Fixtures

## Contents

- [1. The naming framework: Scott Hurff's UI Stack](#1-the-naming-framework-scott-hurffs-ui-stack)
- [2. The twelve designable states](#2-the-twelve-designable-states)
- [3. `status` × `fetchStatus` — the distinction that stops the blanking bug](#3-status--fetchstatus--the-distinction-that-stops-the-blanking-bug)
- [4. Count fixtures: 0 / 1 / 2 / 3–5 / many](#4-count-fixtures-0--1--2--35--many)
- [5. String fixtures](#5-string-fixtures)
- [6. Empty-state anatomy (Carbon) and error copy (GOV.UK)](#6-empty-state-anatomy-carbon-and-error-copy-govuk)
- [7. Review gate](#7-review-gate)


Missing states is the single highest-signal *code-level* giveaway that a UI was generated
rather than designed — training data is dominated by tutorials that render the happy path:
one array, always populated, always loaded, always permitted. The second tell is string
uniformity: every label the same length, every name two words, every description one line.
Fix both by designing states before pages, and rendering against hostile fixtures.

---

## 1. The naming framework: Scott Hurff's UI Stack

Hurff (2015) named five states and, more usefully, an ordering instruction.

| # | State | Rule |
|---|---|---|
| 1 | **Ideal** | **"Ideal is the first state you create"** — every other state resolves toward it |
| 2 | **Blank/Empty** | three sub-cases: first-time use, user-cleared, no results |
| 3 | **Error** | *"A computer shall not harm your work or, through inaction, allow your work to come to harm."* Preserve every keystroke of user input. |
| 4 | **Partial** | sparse data; accelerate toward Ideal, don't let it read as abandonment |
| 5 | **Loading** | skeletons and optimistic actions |

The Stack is the vocabulary, not the checklist: it under-counts empties (three, not five)
and has no cell for disabled, focus, read-only, or offline.

---

## 2. The twelve designable states

If you cannot name what a state looks like, it does not exist and the component falls back
to whatever React renders for `undefined`.

### Empty × 5

**1. first-run** — the account is new; nothing has ever existed here. Show what *will* be
here plus exactly one action. This is the only empty that earns a prominent primary button.

**2. user-cleared** — the user emptied it themselves (deleted the last row, cleared filters,
archived everything). Confirm intent and offer undo. Never show first-run onboarding copy
here; it reads as amnesia.

**3. no-results** — the query matched nothing. Keep the original query visible, suggest
fewer or different words, offer corrections. Do not joke — humor here *"can easily be
misinterpreted as ridicule."*

**4. permission/403** — *"The user does not have permission… Suggest steps or process to
request access."* Route to a request flow or a named owner. **Never a create-button**: the
one action guaranteed to fail is the one you must not offer.

**5. config-required** — the feature works but is unconnected (no API key, no integration,
no billing). Explain the dependency plus the literal first step.

### Loading × 2

**6. initial skeleton** — never had data; skeleton matches the final layout precisely to
minimize layout shift. *"Avoid using spinners as placeholders."*

**7. background/stale** — has data, is refetching: keep data on screen, add a subtle
indicator, **never blank**. See §3.

### The four the UI Stack has no cell for

**8. error** — recoverable and unrecoverable differ; copy rules in §6. Preserve input.

**9. disabled** — contrast must still be legible; prefer `aria-disabled="true"` with a
handled click that explains *why* over `disabled`, which is invisible to screen-reader
navigation and swallows focus.

**10. `focus-visible`** — distinct from `:focus` and `:hover`. Keyboard users get a ring;
mouse users do not. If your component sheet has one "focus" row, it is wrong.

**11. read-only** — populated, legible, not editable, and *not* disabled. **This is a
genuine industry gap: no design system in the research sweep documents it.** Decide and
write down: does read-only keep the input chrome or shed it? Is the value selectable and
copyable? Where does the "why can't I edit this" affordance live? Because nothing is
documented, teams silently reuse `disabled` styling — which tells the user the data is
inactive rather than authoritative.

**12. offline** — a real state, not an error: `fetchStatus: 'paused'`, i.e. *"wanted to
fetch, but it is paused."* Say so explicitly and queue mutations rather than failing them.

### And the transition the twelve leave out: success

The twelve are resting states of a surface. **Success** is the moment between them — the
confirmation that an action the user took actually happened — and it is the one users notice
only when it is missing: a payment or booking that ends on an unchanged screen makes people
press again. Design it per action, weighted to what the action cost the user:

- **The change itself, when it is visible and unambiguous.** A card that slides into "Done"
  and stays there needs no toast. Don't stack a "Saved!" banner on an edit the user can see.
- **Inline or toast** for routine writes that leave the screen (send, save off-screen,
  invite): say what happened and to what, offer Undo where the action is reversible, and
  announce it through polite `aria-live`.
- **A full confirmation page** for money, bookings, legal or irreversible actions: what
  happened, the reference number (selectable, see `craft.md` §6), what happens next, and the
  receipt. Make the submit idempotent so a double press cannot charge twice.
- **Celebration** (confetti, a milestone screen) only for rare, genuinely earned moments —
  a first project, a finished onboarding. On routine actions it trains people to ignore it.

Never show success before the server confirms it unless the update is optimistic with a
visible rollback (`craft.md` §6, Loading), and never optimistically for a payment.

---

## 3. `status` × `fetchStatus` — the distinction that stops the blanking bug

They are orthogonal. **`status` describes the data** (`pending | error | success`);
**`fetchStatus` describes the query function** (`fetching | paused | idle`). That is a
3×3 = 9-cell matrix, not four states.

> **Bind a full-page spinner to "never had data" (`isPending`) — never to `isFetching`.**
> `isFetching` is true on every background refetch, focus event, and poll; binding a
> spinner to it wipes a populated screen back to gray every 30 seconds.

> **`success + fetching` is its own designed state**: data stays on screen, a subtle
> indicator appears (thin top-bar, dimmed timestamp, spinning toolbar icon), and the view
> **never blanks**.

`error` over cached data is also real — show the stale rows *and* the failure. `pending +
paused` is offline-on-first-load, the one case where a spinner is wrong.

---

## 4. Count fixtures: 0 / 1 / 2 / 3–5 / many

Render every list, table, grid, and chart at each count before review.

| Count | What it exposes |
|---|---|
| **0** | which of the five empty classes is this? A generic "No data" means you never asked |
| **1** | pluralization (`1 items`); grids and flex rows that only look composed at ≥3 |
| **2** | the CLDR `two` plural category (Arabic, Slovenian); "and" vs comma joining |
| **3–5** | the Partial state — sparse, uneven card heights, discouraging whitespace |
| **many** | ~80 rows = Lighthouse DOM warning · ~140 = error · 1,000 = scroll jank, sticky headers, select-all, pagination math · 10,000 = virtualization required |

Any component doing `` `${n} item${n === 1 ? '' : 's'}` `` is unshippable in Arabic, Polish,
or Russian: CLDR `one` does not mean the numeral 1, it means *"any number that behaves like
1"* grammatically. Use `Intl.PluralRules`.

---

## 5. String fixtures

> **Put a 60-character string in every text field** — names, titles, labels, table cells,
> breadcrumbs, chips, toasts. A layout that only survives "Acme Inc." survives one length.

**Expansion targets — W3C/IBM, derived from a published table, not folklore:**

| Source length | Design to survive |
|---|---|
| Labels ≤10 chars (buttons, tabs, table headers, nav) | **+200%** |
| Text >70 chars (paragraphs, descriptions, help copy) | **+30%** |

*"The smaller the source message, the higher the likely translation length"* — so a
5-character button label is the riskiest element on the page, not the paragraph. ⚠️ The
commonly quoted **"30–40% padding" is folklore**; W3C, Wikipedia and Android all decline to
state a flat number. Test at the two extremes above.

**Exotic fixtures** (from the Big List of Naughty Strings, 742 lines):

| Fixture | What it breaks |
|---|---|
| `﷽` | one codepoint, extreme horizontal blowout — kills fixed-width cells and `text-overflow` |
| Zalgo `Ṱ̺̺̕o͞ ̷i̲̬͇̪͙n̝̗͕v̟̜̘̦͟o̶̙̰̠kè͚̮̺̪̹̱̤ ̖t̝͕̳̣̻̪͞h̼͓̲̦̳̘̲e͇̣̰̦̬͎ ̢̼̻̱̘h͚͎͙̜̣̲ͅi̦̲̣̰̤v̻͍e̺̭̳̪̰` | combining marks overflow **vertically**; `overflow: hidden` clips them into neighbouring rows |
| Ogham `᚛ᚄᚓᚐᚋᚒᚄ ᚑᚄᚂᚑᚏᚅ᚜` | *"the only unicode alphabet to use a space which isn't empty"* → defeats `trim()`-then-check-empty |
| `Ⱦ` | grows 2→3 bytes when lowercased → byte-length column limits |
| `👨‍👨‍👧‍👧` | `.length` returns codepoints, not 1 — truncation mid-ZWJ produces `👨👨👧` |

Every `maxLength`, character counter, `slice(0, n) + '…'`, and avatar-initials function must
operate on grapheme clusters via `Intl.Segmenter({ granularity: 'grapheme' })`.

**Name fixtures** — *"anything someone tells you is their name is, by definition, an
appropriate identifier for them"*: a 200-character name, `José`, `李雷`, `van der Berg`,
`danah boyd`, `Kim Kim`, a mononym (breaks initials generators), and an empty name.

---

## 6. Empty-state anatomy (Carbon) and error copy (GOV.UK)

**Carbon anatomy**, in order:

1. **Image** (optional) — non-interactive, relates to the situation
2. **Title** — short, and **written as a positive statement**. *"Start by adding data
   assets"* beats *"You don't have any data assets."*
3. **Body** — **explains the next action**; may add why the space is empty and the benefit
4. **Primary action** — **exactly one**. A button, a link inside the copy, or a pointer at
   the UI element. *"Don't cover multiple options in one empty state. If there are multiple
   things a user can do, pick the most important."*
5. Secondary link (optional) — documentation, below

Left-align the block; the sole exception is a small tile, where the image centers above
left-aligned text. If space is limited, use text only.

> **A table's empty state replaces the table *including its headers*** (and footer) —
> otherwise a screen reader announces the entire table structure before reaching the
> message that there is nothing in it.

**GOV.UK error copy — banned outright:** jargon like **"500"** or **"bad request"**,
**"oops"**, "We are experiencing technical difficulties", and red text as the only warning.
Copy must **never blame the user**.

- 500 → H1 exactly *"Sorry, there is a problem with the service"*, body *"Try again later."*
- 404 → H1 exactly *"Page not found"* (never the numeral in the copy)

**Error summary — always show one when there is a validation error, even if there is only
one error.** Above the H1, focus moved to it on load, headed *"There is a problem"*, each
line matching the field-level message **word for word**, `"Error: "` prepended to `<title>`.

---

## 7. Review gate

Carbon's questions, verbatim — ask them of every screen before sign-off.

> *"What will the pages, tiles, data tables, and side panels look like without content?"*
> *"What are all of the steps a user can take to address the situation?"*
> *"Is there any useful content that might be available to show?"*

Counterweight from the same page: *"More content doesn't necessarily mean it's a better
solution as there is a cognitive cost."*

**Per-component working number**: a button has **6–10 documented states** — "default +
hover + disabled" is roughly 30% coverage. Text field ~9 (error, disabled, placeholder,
prefix/suffix, read-only). Checkbox 6, the forgotten one being **indeterminate**.
Breadcrumbs 4 — **collapsed**. Badge — **empty**. Avatar — **image-error fallback**.
Toast 8 — **stacking**, and timeout must pause while focus is inside the container.
Skeleton 3–5 — **reduced motion**.

Lorem ipsum is legal during exploration and **illegal at the review gate**: nothing is
signed off until it has been rendered with real records pulled through the real data
source, at the counts and string lengths above.
