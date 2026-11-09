# Reddit APIs — endpoints, fields, gotchas

## Contents

- [Arctic Shift API Reference](#arctic-shift-api-reference)
- [Reddit JSON API Reference (curl)](#reddit-json-api-reference-curl)
- [Data Richness Comparison](#data-richness-comparison)


Endpoint shapes and response fields for the two data sources. Read this when you are about to build a call, not before — the tier ranking in SKILL.md decides *which* source, this file only says how to talk to it.

## Arctic Shift API Reference

**Base URL:** `https://arctic-shift.photon-reddit.com/api`

### Endpoints

| Endpoint | Use Case |
|----------|----------|
| `/api/posts/search?subreddit=X&limit=100&sort=desc` | Posts in a subreddit |
| `/api/comments/search?subreddit=X&limit=100&sort=desc` | Comments in a subreddit |
| `/api/users/interactions/subreddits?author=X&limit=50` | All subs a user participates in |
| `/api/subreddits/rules?subreddits=sub1,sub2,sub3` | Bulk rules (up to 1000 subs) |
| `/api/subreddits/search?subreddit_prefix=X` | Subreddit metadata/discovery |
| `/api/posts/search?author=X&subreddit=Y&limit=50&sort=desc` | Posts by specific author |
| `/api/posts/search?subreddit=X&after=UNIX&before=UNIX&limit=100&sort=desc` | Date-filtered |

### Gotchas

- `sort` accepts ONLY `asc` or `desc` (date order). No sort-by-score. Fetch then sort client-side.
- Posts < ~36 hours old: `hide_score: true`, `score: 1`. ALWAYS filter before computing metrics.
- `view_count` is always null. Reddit never exposes this externally.
- Subscriber count is archive-time. Use curl `/about.json` for live count.
- Deleted posts: Only captured if Arctic Shift crawled before deletion.

### Key Response Fields (Posts)

```json
{
  "score": 847,
  "num_comments": 42,
  "upvote_ratio": 0.97,
  "title": "...",
  "link_flair_text": "Discussion",
  "author": "username",
  "created_utc": 1715000000,
  "subreddit_subscribers": 124000,
  "over_18": true,
  "selftext": "...",
  "permalink": "/r/SUBNAME/comments/...",
  "hide_score": false
}
```

---

## Reddit JSON API (curl) — DEAD, kept only so it is not re-attempted

> **Every endpoint below returns 403 as of 2026-09-19.** This section is a record of what was
> tried, not a route. Do not run these.

**User-Agent (REQUIRED):** `platform:your-app-name:v1.0 (by /u/your_username)`

**Rate limit:** 100 requests per ~2 minutes. Check headers:
```
x-ratelimit-remaining: 81.0
x-ratelimit-reset: 103
```

### Endpoints

| Endpoint | Returns |
|----------|---------|
| `/r/{sub}/hot.json?limit=25` | Hot posts (current ranking) |
| `/r/{sub}/new.json?limit=25` | Newest posts |
| `/r/{sub}/top.json?t=week&limit=25` | Top posts (t=hour,day,week,month,year,all) |
| `/r/{sub}/rising.json?limit=25` | Rising posts |
| `/r/{sub}/about.json` | Sub metadata (live subscriber count, description) |
| `/r/{sub}/comments/{post_id}.json` | Full threaded comments for a post |
| `/search.json?q=QUERY&sort=relevance&limit=25` | Cross-sub search |
| `/subreddits/search.json?q=QUERY&limit=25` | Discover subreddits |
| `/user/{name}/about.json` | User profile (200=exists, 404=shadowbanned) |

### curl Template

```bash
curl -s "https://www.reddit.com/r/SUBNAME/hot.json?limit=25" \
  -H "User-Agent: platform:your-app-name:v1.0 (by /u/your_username)"
```

---

## Data Richness Comparison

| Content Type | Arctic Shift | curl (live reddit) | Playwright |
|-------------|:---:|:---:|:---:|
| Normal posts | Yes | Yes | Yes |
| Author-deleted posts | **Yes** | No ([deleted]) | No |
| Mod-removed posts | **Yes** | No ([removed]) | No |
| Spam-filtered posts | **Yes** | No (invisible) | No |
| Live hot/new/top ranking | No | **Yes** | Yes |
| Real-time subscriber count | No | **Yes** | Yes |
| Threaded comments | Flat only | **Full tree** | Full tree |
| Cross-sub search | By sub only | **Yes** | Yes |
| Subreddit discovery by topic | Prefix only | **Yes** | Yes |
| Historical archive (months+) | **Yes** | Limited | Limited |

**Bottom line:** Arctic Shift for depth and deleted content. curl for live rankings, search, and discovery. They complement each other.

---
