# Toolbox

Agents inherit every tool and skill in the session. These are the exact commands.

## Web
- WebSearch to find, WebFetch to read. The quota is shared across parallel agents: about 15 searches per agent run; stop early when the angle is answered.
- Load them first if they show as deferred: ToolSearch `select:WebSearch,WebFetch`.
- Good primary sources first: government data (BLS, Census, FMCSA, BTS, SEC filings), published surveys with a method section, trade associations, analyst reports' public summaries. Then news. Vendor pages last, labelled `vendor`.
- A PDF link: WebFetch it, or `curl -sL <url> -o "$SCRATCH/x.pdf"` and read it with the Read tool's `pages` parameter.

## Reddit (Arctic Shift archive only)
- Invoke the `reddit-research` skill and follow it. Base URL `https://arctic-shift.photon-reddit.com/api`, plain curl, no auth.
- Posts: `/posts/search?subreddit=<sub>&title=<words>&after=YYYY-MM-DD&before=YYYY-MM-DD&limit=100`. Comments: `/comments/search?link_id=<postid>&limit=100&sort=asc` (cheap, use it to read threads). Full-text params are `title=`, `selftext=`, `body=`; `q=` is an error.
- `title=a b` is word-AND, not a phrase. Rare terms over long windows time out: search in year-sized windows or shorter.
- `{"error":"Timeout. Maybe slow down a bit"}` in about 1 s is the rate limit: wait 10-20 s and retry, up to ~9 times. If it fails after 5-8 s the query is too heavy: split the date window. Every error has `"data":null`, so null-check `data` first.
- Serial calls only, about 4 s apart. Posts under ~36 h old show `score:1`; ignore their scores.
- Permalink for a post: `https://www.reddit.com/comments/<id>`.

## GitHub (read-only, `gh` is logged in)
- Budget: about 25 searches and 15 READMEs per run. Stop when new queries keep returning repos you've already seen.
- Repos: `gh search repos "<terms>" --limit 20 --sort stars --json fullName,description,stargazersCount,pushedAt,license,language,openIssuesCount,url`
- Code: `gh search code "<terms>" --limit 20 --json repository,path,url` (10 searches/min).
- Issues and discussions where people describe what they built or hit: `gh search issues "<terms>" --limit 20 --json title,url,repository,commentsCount,createdAt`
- README: `gh api repos/<owner>/<repo>/readme --jq .content | base64 -d | head -200`
- Rate limits: `gh api rate_limit --jq '.resources.search, .resources.code_search'` (search 30/min). Back off 60 s on a 403.

## Vault
- Root: `$VAULT`, set in SKILL.md from `NOTES_VAULT` (default `~/Notes`; quote it, it may contain spaces). Research lives in `Research/<Topic>/`.
- Search before claiming something is new: `grep -ril TERM "$VAULT" --exclude-dir=.obsidian`
