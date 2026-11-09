# Claude Website Design

A [Claude Code](https://claude.com/claude-code) skill for building and redesigning websites, landing pages, dashboards and web apps that don't look AI-generated. It makes the agent decide what kind of page it's building before choosing a style, write the design system down before writing code, build every state (loading, empty, error) and not just the happy path, then screenshot its own work and score it before handing it over.

```
make a landing page for my coffee roaster
redesign this dashboard, it looks generic
```

## How it works

1. **Calibrate.** Is this a utilitarian surface (an admin tool, a memo) or an editorial one (a landing page)? Utilitarian work gets clarity and restraint, not an invented brand.
2. **Precedence.** The user's own words, then the project's existing design system, then the skill's own taste, in that order. It greps the repo for tokens, theme files and existing components before deciding anything.
3. **Direction, then `DESIGN.md`, before code.** The type scale, color, spacing and motion get committed to a file the project keeps.
4. **States before pages.** Twelve designable states (five kinds of empty, two of loading, error, partial and more) are designed up front, plus count and string fixtures for 0, 1, many and overlong content. Scott Hurff's UI stack is the naming framework.
5. **Verify.** `scripts/shoot.sh` screenshots the build with Playwright at one or three viewports. The result is scored against a ten-check rubric and must reach **80/100**, with a fix-then-rescore loop capped at three passes. A score under the bar is reported as a number, not described as shipped.

## What's in the references

| File | What it is |
|---|---|
| `craft.md` | Type, color, space, depth and motion, with numbers measured from shipped design systems (Radix, Geist, Linear, Carbon, Material 3) and a font table with licenses |
| `ai-tells.md` | A calibration list of 45 numbered "AI tells" (default favicons, scaffold tab titles, hero gradients and so on), each with when it's actually fine |
| `review.md` | The ten-check scoring rubric |
| `redesign.md` | Preserve vs overhaul vs greenfield, for sites that already exist |
| `stacks.md` | Version and platform facts, plus which 3D tools are safe to ship (license-checked) |
| `states.md` | The state-by-state checklist |
| `web-interface-guidelines.md`, `apple-motion.md` | Vendored MIT references from Vercel and Emil Kowalski (see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)) |

The skill also has a description-trigger eval in `tests/`, so a design request goes to this skill and not to its sibling, [claude-website-hardening](https://github.com/Jibbithy/claude-website-hardening), which covers security, performance and launch readiness.

## Install

```bash
git clone https://github.com/Jibbithy/claude-website-design
cd claude-website-design
./install.sh
```

**Requires:** Claude Code. **For screenshots:** Node and Playwright (`npx playwright install chromium`), or a local Chrome or Edge.

## License

MIT for this skill. Vendored references keep their own MIT licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
