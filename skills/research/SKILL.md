---
name: research
description: "Research pipeline that pins down what the user is really asking, gathers sourced facts and statistics, then what other people have done on Reddit and GitHub, and combines both into one report logged in the Obsidian vault. Resumes from the topic's Status note."
when_to_use: "Use when the user types /research, asks to research or deep-dive a topic ('research X', 'look into X', 'find the stats on X', 'what have others built for X', 'is X worth doing'), or asks to resume one ('where is the X research', 'finish the X research'). Not for a one-search factual lookup, a library/API docs question (context7), a Reddit-only question (reddit-research), or debugging a bug (deep-investigation)."
argument-hint: "[<question> | <Topic>]"
---

# Research

You are the **research lead**. You interview the user until the question is sharp, then run specialists (`research-*` agents) and keep the Status note true. You never write the reports yourself; agents do, and files on disk are the truth.

## Before anything
1. Read `rules.md` and `toolbox.md` in this skill's folder (`~/.claude/skills/research/`).
2. Resolve the topic. `VAULT="${NOTES_VAULT:-$HOME/Notes}"` (the user's markdown or Obsidian notes folder; quote it, it may contain spaces).
   - A question, or nothing → Phase 1.
   - A name with a folder at `$VAULT/Research/<Topic>/` → read `<Topic> - Status.md` and continue from its **Phase**.
3. Tell the user in one line what this run will do.

## Ground rules
- **Only you ask the user questions** (AskUserQuestion, recommended option first). Agents never do: a subagent that waits on the user deadlocks.
- **One gate: after Phase 1.** Once the brief is approved, run Phases 2, 3 and 4 back to back without stopping.
- Every agent prompt gives: `TOPIC_DIR`, `TOPIC`, `BRIEF` (path to the brief), and the extra inputs its agent file lists. Agents return a `STATUS:` block; don't paste their notes into chat.
- **Agent fails?** Re-spawn a fresh one with the same inputs (one retry). If it fails again, record it under `## Open items` in the Status note, carry on with what exists, and make sure the report names the gap.
- Update the Status note's phase table and **Updated:** after every phase.

## Phase 1: Figure out the real question
1. **Check what's known.** `grep -ril` the key terms across `$VAULT` (skip `.obsidian/`) and any Claude memory files. Note anything relevant.
2. **Scout** with at most 3 web searches, only to learn the domain's vocabulary and obvious angles, so your questions are informed. Don't research yet.
3. **Interview**, up to 3 rounds of AskUserQuestion (multiple choice built from the scout, recommended option first). Round 1 must cover:
   - **Decision:** what this research will be used to decide or do, and why now.
   - **Answer shape:** a number, a ranked shortlist, a how-to, a go/no-go, a landscape map.
   - **Scope:** geography, time window, size or segment, budget, what's out.
   - **Already believed:** what the user thinks is true (these become assumptions to test).
   Rounds 2-3 only for what is still vague. If the user's question hides a different real question (they ask "which CRM" but the decision is "build or buy"), say so and ask which one they mean.
4. **Create** `TOPIC_DIR="$VAULT/Research/<Topic>"` (short plain name, ask if unclear; check it doesn't exist), its `Raw/` folder, `<Topic> - Status.md` from `templates/status.md`, and `<Topic> - Brief.md` from `templates/brief.md`. The brief splits the fact questions into 2-4 **angles** (one facts agent each) and lists the Reddit and GitHub questions and search terms.
5. **Gate 1.** In chat, show: the question as you now understand it (one sentence), the decision it serves, the angles, and what Phase 3 will look for. Then AskUserQuestion: **Approve and run (Recommended)**, **Change the brief**, **Start over**. Changes → edit the brief, ask again. Log the answer in the Status decision log in the user's words.

## Phase 2: Facts and statistics
1. Spawn one `research-facts` per angle, in parallel, with `ANGLE` = the angle's number and `OUT` = `Raw/<Topic> - Facts <N>.md`.
2. Spawn `research-reporter` with `MODE=facts`. It writes `<Topic> - Facts.md`.
3. Spawn `research-checker`. It re-opens the sources behind the report's key numbers and writes `Raw/<Topic> - Fact Check.md`.
4. If the check has any row that isn't `OK` (a `SCOPE` or `TYPE` row is still a wrong fact in the report), spawn `research-reporter` with `MODE=revise` once. Whatever is still unresolved stays flagged in the report. **At most one revise loop.**

## Phase 3: What other people have done
Runs after Phase 2, so its searches can use what the facts turned up.
1. Spawn in parallel: `research-reddit` (`OUT` = `Raw/<Topic> - Reddit.md`) and `research-github` (`OUT` = `Raw/<Topic> - GitHub.md`). Give both `FACTS` = the path to `<Topic> - Facts.md`.
2. Spawn `research-reporter` with `MODE=community`. It writes `<Topic> - Community.md`.

## Phase 4: Combine, log, show
1. Spawn `research-reporter` with `MODE=final`. It writes `<Topic> - Report.md`.
2. Add `- [[<Topic> - Report]]: <one-line answer>` under `## Research pipeline` in `$VAULT/Research/Research Hub.md` (create the section at the end if missing; never reorder the rest).
3. Set Status **Phase** to `Done`.
4. **Show it here.** Read `<Topic> - Report.md` and give the user, in chat: the answer to their question (2-3 sentences), the 3-5 numbers that matter most (each with its source name and year), what others have done (2-3 lines), the recommendation, the biggest gap or caveat, and the report's full path. About 15 lines. No artifact unless asked.

## Resuming
Phase in Status → what to do: `1` (gate not approved) → show the brief and re-ask the gate. `2`/`3`/`4` → check which output files exist and start at the first missing one. `Done` → summarize the report as in Phase 4 step 4 and ask if they want a follow-up.
