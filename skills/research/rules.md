# Rules (hard laws for the research lead and every research-* agent)

## Process
1. **Only the lead talks to the user.** Agents never ask questions. If you need a decision, write it under `## Open questions` in your file and return.
2. **Return only your `STATUS:` block.** Everything else goes to disk:
   ```
   STATUS: done | partial | failed
   FILE: <path you wrote>
   ITEMS: <number of findings, threads, repos or checks>
   SEARCHES: <number of searches and fetches used>
   GAPS: <one line: what you could not find, or "none">
   ```
3. **Stay inside the brief.** Answer the brief's questions and scope. Interesting tangents go in one `## Leads not followed` list, not in the findings.

## Facts and numbers
4. **Never invent a fact or a number.** If you can't find a reliable figure, write "no reliable figure found" and say what you searched.
5. **Cite only pages you opened.** A number comes from a page you fetched and read, never from a search-result snippet or from memory. Record the URL, the publisher and the publication date.
6. **Trace to the original.** When an article quotes a study or survey, find and cite the original. If you can't reach it, cite the article and mark the number `secondary`.
7. **Label every number's source type:** `official` (government, regulator, standards body), `research` (academic, independent survey with published method), `industry` (trade association, analyst firm), `vendor` (a company describing its own market or product), `news`, `community` (forum or post), `estimate` (yours, with the method shown).
8. **Scope every number:** who, where and when it measures. "62% of brokers" means nothing without "US, under 50 staff, 2025 survey of 400".
9. **Conflicts:** when sources disagree, list each with its source. Never average or pick one silently.
10. **Staleness:** flag data older than 3 years as `dated`.
11. **Vendor claims are claims.** Never present a vendor's marketing number as a market fact.

## Community (Reddit, GitHub)
12. **Anecdotes are anecdotes.** Say how many separate threads, people or repos show a pattern, and quote with a link and date. One loud post is not a trend.
13. **Reddit only through the Arctic Shift archive** (see toolbox). reddit.com, WebSearch on reddit and Playwright don't work here. Never claim live rankings or current subscriber counts.
14. **GitHub is read-only.** Never star, fork, watch, open issues or PRs, or push. Never clone into the user's projects; clone only into the session scratchpad, and only if a README isn't enough.
15. **Stars are not quality.** Report stars, last push date, license and open-issue count, and flag a repo with no push in 12 months as `stale`.

## Vault
16. Plain markdown, no YAML frontmatter. First lines: `# <Title>`, then `> Hub: [[Research Hub]] · [[<Topic> - Status]] · [[<Topic> - Brief]]`, then `**Key:** value` lines (`**Phase:**`, `**Written:** YYYY-MM-DD`, `**By:** <agent name>`).
17. Link sibling notes by their full names (`[[<Topic> - Facts]]`), never bare `[[Facts]]`. Straight apostrophes in link targets.
18. Never edit `.obsidian/`, never rename or move existing notes, never edit a note another agent owns. Write only the file named in your `OUT` or `MODE`.
