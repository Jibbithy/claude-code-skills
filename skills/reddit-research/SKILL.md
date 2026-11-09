---
name: reddit-research
description: >-
  Reddit research via the Arctic Shift archive API — subreddit analysis, engagement metrics, user
  activity, deleted/removed post recovery, tone assessment, rules, and topic discovery. Direct
  reddit.com access is blocked in this environment, so the skill also says plainly which questions
  cannot be answered rather than substituting web search. Use when the user asks what Reddit says
  about a topic, wants a subreddit or user analyzed, needs sentiment or demand signal from Reddit
  threads, or asks to recover a deleted/removed post.
license: MIT
metadata:
  version: 1.0.0
  dependencies:
    - url: https://arctic-shift.photon-reddit.com/api
      name: Arctic Shift API
      type: api
    - url: https://www.reddit.com
      name: Reddit JSON API
      type: api
---

# Reddit Research Skill

Comprehensive Reddit research routing through the most reliable methods. You know exactly which tools work, which don't, and when to use each.

## Trigger

```
/reddit-research analyze r/homelab engagement
/reddit-research what subs does u/example_user post in
/reddit-research find deleted posts in r/SUBNAME
/reddit-research discover subreddits about topic X
search reddit for discussions about X
check reddit metrics for these subreddits
```

---

## Method ranking — one route works, the rest are dead

**Re-tested 2026-09-19. Arctic Shift is the only working source. Everything else is blocked.** The
ladder below is not a graceful fallback chain; three of its four rungs are gone, and the failure
mode that matters is quietly substituting a dead rung with web search and presenting the result as
Reddit data.

| Route | Status 2026-09-19 | Evidence |
|---|---|---|
| **Arctic Shift API** | **WORKS** — the only one | `curl .../api/posts/search?subreddit=selfhosted` → 200, full post objects |
| reddit.com `.json` via curl | **DEAD — 403** | harness-level block; browser User-Agent does not help |
| WebFetch / WebSearch on reddit.com | **DEAD** | WebSearch returns `400 domains not accessible` |
| Playwright on old.reddit.com | **UNAVAILABLE** | needs the Playwright MCP server, which routinely fails to connect |

### Arctic Shift — the primary and, in practice, only route

- Base: `https://arctic-shift.photon-reddit.com/api`
- Plain `curl`. No auth, no browser, no proof-of-work wall.
- **Sees deleted, removed, and spam-filtered posts** — the one thing no other route can do.

Use it for everything: historical research, metrics, user activity, rules, tone, deleted recovery.

**Four gotchas that will silently ruin a run. All verified by live call.**

1. **Param names are non-obvious and wrong guesses hard-error.** Full-text is `title=` or
   `selftext=` on `/posts/search`, and `body=` on `/comments/search`. `q` returns
   `{"error":"Unknown query parameter: 'q'"}`. `sort` takes only `asc`/`desc`.
2. **`{"error":"Timeout. Maybe slow down a bit"}` returned in under a second is a RATE LIMIT, not a
   slow query.** Four unpaced calls is enough to trigger it. Retrying with a longer `-m` or a
   narrower window does nothing. **Pace ~4s between calls, and back off exponentially (8→120s) on
   that error.**
3. **On any error the response is `{"data":null,...}`.** Code that reaches straight for
   `json.data.length` throws on the rate-limit response rather than reporting it. Null-check
   `data` before touching it, and surface `error` when it is set.
4. **Posts newer than ~36h carry `hide_score:true` and `score:1`** — filter them out before
   computing any metric, or the numbers are fiction. There is no sort-by-score: fetch wide and sort
   client-side.

### When Reddit genuinely cannot answer it

If the question needs live rankings, current subscriber counts, or a logged-in view, Arctic Shift
cannot serve it and nothing else is available. **Say that in the deliverable.** Do not let a
workflow return zero sentiment and read as "nothing found" — two prior research runs burned 206
agents producing no Reddit data before this was diagnosed.

These substitutes are verified working and are the honest fallback for "what do practitioners say",
provided you label the source as not-Reddit:

- **Hacker News (best substitute):** `https://hn.algolia.com/api/v1/search?query=<terms>&tags=story`
  (or `&tags=comment`), then `https://hn.algolia.com/api/v1/items/<objectID>` for the full comment
  tree. Require every quote to carry its comment id and re-fetch to confirm the string exists.
- **Lobsters:** `https://lobste.rs/search?q=<terms>&what=stories&order=relevance`
- **Stack Exchange:** `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=votes&q=<terms>&site=stackoverflow`

---

## Methods that do not work — never attempt

| Method | Why | Result |
|---|---|---|
| `curl` / WebFetch to reddit.com (any path, incl. `.json`) | harness-level block; a browser User-Agent does not defeat it | **403** |
| WebSearch with `site:reddit.com` or `allowed_domains:["reddit.com"]` | domain not permitted | **400 domains not accessible** |
| Reddit RSS (`.rss`) via curl | blocked specifically | 403 |
| `oauth.reddit.com` without a token | redirects to HTML | 301 → HTML |
| redlib / safereddit / libreddit mirrors | Anubis proof-of-work interstitial, needs JS | challenge page, 0 posts |
| `api.pullpush.io` (Pushshift successor) | down | 502 |
| `r.jina.ai` proxy in front of old.reddit.com | proxy returns 200 wrapping Reddit's own 403 | 403 body |

Do not burn a run rediscovering these. If Arctic Shift cannot answer it, nothing here can.

---

## API reference

Endpoints, response fields, and the gotchas for both sources: **`references/api.md`**. Read it
before building a call; do not reconstruct an endpoint from memory.

## Engagement Metrics

### The Four Metrics (compute from Arctic Shift data)

| Metric | Formula | Measures |
|--------|---------|----------|
| Comments/upvotes ratio (cmtRatio) | `avgCmts / avgScore` | Discussion depth |
| Upvote ratio | `upvote_ratio` field (0-1) | Community approval |
| Avg comments per post | `sum(num_comments) / count` | Activity level |
| Avg score per post | `sum(score) / count` | Reach/visibility |

### Computation

```javascript
const posts = data.data.filter(p => !p.hide_score && p.score > 1);
const avgScore = posts.reduce((s, p) => s + p.score, 0) / posts.length;
const avgCmts = posts.reduce((s, p) => s + p.num_comments, 0) / posts.length;
const cmtRatio = avgCmts / avgScore;
const avgUpvoteRatio = posts.reduce((s, p) => s + p.upvote_ratio, 0) / posts.length;
```

### Discussion-Depth Tiers

| Tier | Threshold | Meaning |
|------|-----------|---------|
| S | >= 0.70 | Highly conversational |
| A | >= 0.25 | Strong discussion |
| B | >= 0.10 or avg cmts >= 10 | Moderate, worth engaging |
| C | 0.05-0.10 | Mostly passive / reach sub |
| D | < 0.05 | Low engagement |
| E | avg cmts < 1 | Dead or hard-gated |

---

## Tone Assessment

Assess from post data already fetched (no extra calls):

1. `link_flair_text` values - themed days, categories, explicit indicators
2. Title patterns - language style, norms
3. `selftext` on top-scoring posts - culture signals
4. Score distribution - what the community actually rewards

Sort fetched posts by score client-side. Top 10-20 reveal community values.

---

## Standard workflows

One minimal-call recipe per recurring ask — research a subreddit, investigate a user, find threads,
discover subs, batch-check, recover deleted posts, detect a shadowban: **`references/workflows.md`**.

## Decision flowchart

```
Need Reddit data?
|
+-- Historical posts, comments, metrics, user activity, rules, deleted content?
|     --> Arctic Shift. This is every question the skill can actually answer.
|
+-- Live rankings, current subscriber count, or a logged-in view?
|     --> NOT AVAILABLE. reddit.com is 403 to curl and WebFetch; WebSearch
|         refuses the domain; Playwright needs an MCP server that is usually down.
|         Say so in the deliverable. Do not substitute web search silently.
|
+-- Shadowban check?
|     --> NOT AVAILABLE for the same reason (it needed /user/NAME/about.json).
|
+-- "What do practitioners say about X", where Reddit was only the means?
|     --> HN Algolia / Lobsters / Stack Exchange, labelled as not-Reddit.
|
+-- Posting, commenting, DMs, modmail?
      --> Not possible via research tools. Use Reddit's own interface.
```

**The honest-gap rule:** a question this skill cannot answer is reported as unanswerable, with the
reason. A run that returns zero Reddit data and does not say why reads as "nothing found", which is
a different and false claim.

---

## Scope Boundaries

- This skill is READ-ONLY research. No posting, commenting, or write operations.
- If the task requires posting or account actions, inform the user it must be done through Reddit's interface or an authenticated client.
