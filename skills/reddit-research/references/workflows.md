# Standard Reddit research workflows

## Contents

- [Standard Workflows](#standard-workflows)


**Steps below that call `reddit.com` directly are DEAD (403 since 2026-09-19) — only the Arctic Shift steps run.** Where a recipe's live-data half is dead, run the Arctic Shift half and report the rest as unavailable. One recipe per recurring ask, each written as the minimum number of calls that answers it. Read the matching recipe before improvising a sequence — most of these are 2-3 calls and the obvious approach is 10.

## Standard Workflows

### Research a Subreddit (2-3 calls)

```
# Arctic Shift: rules + historical metrics
WebFetch: .../api/subreddits/rules?subreddits=SUBNAME
WebFetch: .../api/posts/search?subreddit=SUBNAME&limit=100&sort=desc

# curl: live subscriber count + current hot
curl: https://www.reddit.com/r/SUBNAME/about.json (subscribers)
```

### Investigate a User

```
# Arctic Shift: where they participate
WebFetch: .../api/users/interactions/subreddits?author=USERNAME&limit=50

# Then research promising subs
```

### Find Reddit Threads About a Topic

```
# curl: cross-sub search (live, ranked by relevance)
curl: https://www.reddit.com/search.json?q=TOPIC&sort=relevance&limit=25

# Web search: broader web-indexed results
search "site:reddit.com TOPIC"
```

### Discover Subreddits

```
# curl: Reddit's subreddit search
curl: https://www.reddit.com/subreddits/search.json?q=TOPIC&limit=25

# Arctic Shift: prefix-based
WebFetch: .../api/subreddits/search?subreddit_prefix=PREFIX
```

### Batch-Check Multiple Subs

```
# Arctic Shift: rules in one call (up to 1000)
WebFetch: .../api/subreddits/rules?subreddits=sub1,sub2,sub3

# Arctic Shift: posts per sub (parallel via sub-agents)
WebFetch: .../api/posts/search?subreddit=sub1&limit=50&sort=desc
WebFetch: .../api/posts/search?subreddit=sub2&limit=50&sort=desc
```

### Recover Deleted/Removed Posts

```
# ONLY Arctic Shift can do this
WebFetch: .../api/posts/search?subreddit=SUBNAME&limit=100&sort=desc
# Posts where live Reddit shows [deleted]/[removed] still have full content here
```

### Shadowban Detection

```
# Use curl (fast, no browser needed)
curl -s -o /dev/null -w "%{http_code}" "https://www.reddit.com/user/USERNAME/about.json" \
  -H "User-Agent: platform:your-app-name:v1.0 (by /u/your_username)"
# 200 = alive, 404 = shadowbanned

# If curl fails (429), THEN fall back to Playwright:
# Navigate to https://www.reddit.com/user/USERNAME
# Check if page title contains username or shows "page not found"
```

---
