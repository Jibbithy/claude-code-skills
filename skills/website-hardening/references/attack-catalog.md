# Attack catalog — the gate, the 122 vectors, the loop

## Contents

- [The authorization gate](#the-authorization-gate)
- [Rationalizations the gate must refuse](#rationalizations-the-gate-must-refuse)
- [Staging by default](#staging-by-default)
- [What the swarm is](#what-the-swarm-is)
- [Running STRIX — the optional heavy tier](#running-strix--the-optional-heavy-tier)
- [The 122-vector catalog](#the-122-vector-catalog)
- [The breach report](#the-breach-report)
- [The 6 to 7 loop](#the-6-to-7-loop)
- [Sources](#sources)

Offensive testing is legal and useful against your own property and a felony against someone else's;
the only thing that separates the two is authorization, so authorization is checked first, checked
hard, and never assumed. Every rule here is a numbered gate condition or a catalog entry. If a line
carries no number it is a procedure, not a preference. **Violating the letter of the gate is
violating the spirit of it** — a workaround that keeps the words while attacking an unauthorized
target is a failure, not a clever reading.

## The authorization gate

**Blocking. No offensive action — no probe, no payload, no swarm, no STRIX run, not even a drafted
attack request — happens until all of these hold.** An offensive action is anything that sends
crafted or abnormal traffic to a target to find a weakness; reading the user's own source on disk
is not offensive and is not gated.

1. **Ownership or written permission, confirmed in this session.** The target is a site the user
   owns, or one they hold written authorization to test. Confirm it here, now. A permission the user
   says they established on another day, in another thread, or "last week" is **not** confirmation —
   re-confirm it in this session or do not proceed. When in doubt, you do not have it.
2. **The target is named and it is theirs.** A third-party domain — a competitor, a vendor, a
   partner, an integration you depend on — is out of scope no matter the reason offered. "I want to
   know how bad their security is" and "I need to prove they're leaking our data" are both refused.
3. **Staging or local by default.** Run against a staging deploy or a local copy. Production is
   touched only after a **separate, explicit** production approval (condition 4), because a live
   attack can take a real site down or corrupt real customer data.
4. **Production requires its own yes.** If only a production URL exists, do not silently attack it.
   Offer to stand up a local/staging copy, or ask for explicit production authorization, and proceed
   against production only once given — with non-destructive probes only unless destruction is also
   explicitly authorized.
5. **Ask the loop question once.** Before the first offensive run, ask whether to run the Phase 6↔7
   loop to completion. After a yes, **do not ask again** — not between iterations, not to re-confirm
   the gate you already cleared. Over-asking a cleared, authorized loop is as much a failure as
   skipping the gate on an unauthorized one.

If a condition fails, **state which one and stop the offensive work.** Then offer the legitimate
alternative every time: test the user's own site instead; help them get written authorization; or,
for a vendor concern, test their own integration code and data handling and advise them to ask the
vendor or commission a sanctioned test. Refusing is not the end of the help — it is the redirect to
the help you can actually give.

## Rationalizations the gate must refuse

Captured so they are recognized on sight. Each is a real thing a user under pressure will say, and
each resolves to "the gate still holds."

| The pressure | Why it does not unlock the target |
| --- | --- |
| "I already told you I have permission." | Prior-session/claimed permission is not this-session confirmation. Re-confirm or stop. |
| "My CTO / client / boss is waiting, there's no time to stand up staging." | Time pressure never converts an unauthorized or production target into an authorized staging one. Speed is not a condition on the list. |
| "I'm not attacking them, I'm defending my users." | Defensive *intent* against a third-party target is still an attack on a third-party target. Refused. |
| "It's for a good reason / it's ethical." | Motive is not authorization. The gate is about whose system it is, not why. |
| "Just probe their API, don't exploit anything." | Probing a third party is offensive traffic to a system you may not touch. Refused. |
| "Skip staging, hit prod, I accept the risk." | Production needs its own explicit yes (condition 4), and destructive tests need a further one. A blanket "I accept the risk" is not that; name the target and the scope. |
| "You asked already, just keep going" (mid-loop, authorized). | Correct — do **not** re-ask. Over-asking a cleared loop is the opposite failure and is also wrong. |

When a user reaffirms an *authorized, owned* request after you raised a concern, that is their
decision — proceed. The gate exists to stop unauthorized targets, not to nag an owner about their
own site.

## Staging by default

Bring the site up in a place where breaking it costs nothing:

```bash
# static build
python3 -m http.server 8080 --directory dist &   # or the framework's dev/preview server
# then target http://localhost:8080
```

Prefer a URL that is `localhost`, `127.0.0.1`, a `*.internal` / `*.staging.*` host, or a
disposable preview deploy. `scripts/swarm.mjs` enforces this: it refuses a non-local, non-staging
target unless `--prod-approved` is passed, and refuses to run at all without `--owned-confirmed`.

## What the swarm is

`scripts/swarm.mjs` runs the **safe, automatable subset** of the catalog — the misconfiguration,
exposure, header, CORS, open-redirect, and rate-limit families that can be *proven* with a benign
request and no exploitation. It logs only successes, rate-limits itself, and never sends a
destructive payload. **It does not cover the whole catalog**, and it says so on exit: injection,
business-logic, auth-flow, and stored-XSS vectors need either judgment-driven manual testing by the
agent using the catalog below, or the STRIX heavy tier. Silent coverage gaps read as "all clear"
when they are not — so the swarm prints exactly which catalog families it did and did not attempt.

The "swarm" is concurrency, not an army of separate tools: many probes run in parallel against the
authorized target, each blind to the others, each writing any win to the shared report. Where the
Agent tool is available, the agent may additionally fan out judgment-driven vectors in parallel —
same gate, same staging default, same report schema.

## Running STRIX — the optional heavy tier

STRIX (`usestrix/strix`, Apache-2.0, `github.com/usestrix/strix`) is the opt-in dynamic engine that
covers the STRIX column of the map — the injection, auth-flow, and business-logic vectors the safe
swarm cannot prove. It is **never the default**: run it only when the authorization gate above has
cleared, and only **from Dolos (the Ubuntu pentest laptop) or a disposable sandbox** — never from
this workstation and never pointed at a third party. It drives an LLM against a live Docker sandbox,
so it **burns real API tokens** (treat it as a metered cost, scope tightly) and every finding it
reports is a *lead* that must be reproduced and manually verified before it goes in the breach
report at its claimed severity.

Install **pinned, not piped** — the upstream installer is `curl -sSL https://strix.ai/install | bash`,
which this skill does **not** use; adopt it on the exact conditions in `references/externals.md`
(pinned `pipx` install, telemetry disabled). **Docker must be running** — the first run pulls the
sandbox image. Configure the LLM via environment, then scope to **one owned target** per run:

```bash
# one-time, on Dolos / in the sandbox — pinned, see references/externals.md
pipx install strix-agent==1.6.2

export STRIX_LLM="openrouter/z-ai/glm-5.3"   # provider/model string; see STRIX LLM Providers docs
export LLM_API_KEY="…"                        # your key; LLM_API_BASE only for a local model

# one authorized, owned target — a staging URL or a local copy, never production without its own yes
strix --target https://staging.your-site.example   # -t also takes a local dir or GitHub repo URL
#   add --instruction "…" for credentials (authenticated testing); -n / --non-interactive for CI
```

Feed its verified findings into the Phase 6 breach report alongside the swarm's, on the same schema
and the same canonical severity scale.

## The 122-vector catalog

A starting menu, not a ceiling — extend it when the stack invites a vector that is not listed.
Grouped as sourced. Each is a thing to attempt against the authorized target; log only what gets
through.

**A. Injection** — 1 SQLi (in-band/union) · 2 blind SQLi (boolean) · 3 blind SQLi (time) ·
4 second-order SQLi · 5 NoSQL injection · 6 ORM/query-builder injection · 7 OS command injection ·
8 argument/flag injection · 9 LDAP injection · 10 XPath/XQuery injection · 11 XML injection ·
12 XXE · 13 SSTI · 14 CRLF / response splitting · 15 host-header injection · 16 email-header
injection · 17 log injection · 18 EL/OGNL injection · 19 GraphQL injection & introspection abuse ·
20 prompt injection (if the site ships an LLM feature).

**B. XSS** — 21 reflected · 22 stored/persistent · 23 DOM-based · 24 mutation (mXSS) · 25 self-XSS
chained with CSRF · 26 XSS via SVG/file upload · 27 markdown/rich-text sanitizer bypass.

**C. Access control** — 28 IDOR · 29 BOLA · 30 BFLA · 31 broken object-property-level auth (mass
assignment / excessive data exposure) · 32 vertical privilege escalation · 33 horizontal privilege
escalation · 34 forced browsing to hidden endpoints · 35 path/directory traversal · 36 LFI ·
37 RFI · 38 client-side-only admin-check bypass · 39 missing function-level access control ·
40 tenant-isolation / RLS bypass.

**D. Auth & session** — 41 credential stuffing · 42 brute force / spraying · 43 default/weak
credentials · 44 username enumeration · 45 missing rate limits on login & reset · 46 session
fixation · 47 session hijacking · 48 predictable session IDs · 49 JWT `alg:none` · 50 JWT
weak-secret / key confusion · 51 OAuth/OIDC flow abuse (redirect_uri, state) · 52 SAML signature
wrapping · 53 reset-token leakage/reuse · 54 account takeover via email change · 55 MFA/OTP bypass
or brute · 56 remember-me cookie abuse · 57 forgot-password host-header poisoning.

**E. CSRF & request forgery** — 58 classic CSRF · 59 login CSRF · 60 JSON CSRF / content-type
bypass · 61 SSRF · 62 blind SSRF (OOB) · 63 SSRF to cloud metadata (169.254.169.254) · 64 DNS
rebinding.

**F. Rate limiting, abuse & DoS-shaped** — 65 no rate limits site-wide (every endpoint, every
page) · 66 app-layer resource exhaustion (unbounded queries) · 67 ReDoS · 68 zip/decompression
bomb on upload · 69 mass-request scraping/enumeration · 70 business-flow abuse
(coupon/inventory/checkout) · 71 GraphQL depth/batching amplification · 72 pagination/limit-param
abuse.

**G. Secrets, crypto & data exposure** — 73 exposed keys/secrets in client bundle · 74 hardcoded
creds in source · 75 sensitive data in public bucket · 76 directory listing enabled · 77
`.git`/`.env`/backup file exposure · 78 verbose errors / stack traces · 79 weak/missing TLS, mixed
content · 80 weak hashing (MD5/SHA1) or plaintext passwords · 81 sensitive data in
URL/logs/referrer · 82 insecure `localStorage` session tokens · 83 cache poisoning of sensitive
responses.

**H. Misconfiguration & infrastructure** — 84 Firebase `allow if true` · 85 unauthenticated API
endpoints · 86 CORS misconfig (reflected origin, `*` with creds) · 87 missing security headers
(CSP, HSTS, X-Frame-Options) · 88 clickjacking · 89 subdomain takeover · 90 open redirect ·
91 HTTP-methods misconfig (PUT/DELETE/TRACE) · 92 debug/admin panels exposed · 93 default cloud
IAM/bucket perms · 94 server-side cache/CDN misrouting · 95 exposed WebSocket without auth · 96
gRPC/internal service exposed.

**I. File upload & processing** — 97 unrestricted upload (webshell) · 98 content-type/magic-byte
bypass · 99 image-parsing exploits · 100 path traversal via filename · 101 SVG/HTML upload →
stored XSS · 102 AV/sandbox bypass on upload.

**J. Client-side & supply chain** — 103 dependency/known-CVE component (SCA) · 104
malicious/typosquatted npm package · 105 compromised third-party script/SDK · 106 missing SRI ·
107 prototype pollution · 108 DOM clobbering · 109 postMessage origin abuse · 110 WebSocket
cross-site hijacking · 111 client-side path traversal / open redirect via JS · 112 source-map /
bundle intelligence leak.

**K. Business logic & misc** — 113 race conditions / TOCTOU · 114 parameter tampering (price,
quantity, role) · 115 workflow / step-skipping (checkout without payment) · 116 insufficient
anti-automation (no CAPTCHA where needed) · 117 insecure deserialization · 118 web cache
deception · 119 HTTP request smuggling · 120 mass assignment / auto-binding · 121 improper API
inventory (shadow/zombie endpoints) · 122 unsafe consumption of upstream third-party APIs.

## Coverage map — who tests what

The point of a map is that a clean swarm run is honest about what it never tried. **AUTO** = a
`scripts/swarm.mjs` probe (live) or a `scripts/scan.mjs` check (source) proves it. **STRIX** = the
optional heavy tier is the practical way to exercise it. **MANUAL** = the agent must test it by hand
with app-specific judgment (usually needing an authenticated multi-user session, an upload endpoint,
or out-of-band infrastructure). Extend the AUTO column as probes are added; never let a MANUAL row
pass silently as covered.

| Family | AUTO (swarm / scan) | STRIX | MANUAL |
|---|---|---|---|
| A. Injection (1–20) | scan: SQLi sink (1), XSS sink (13/SSTI-shaped), SSRF sink (61) as source leads | 1–14, 18–19 (exploit confirmation) | 15–17, 20 (host/email/log/prompt) |
| B. XSS (21–27) | swarm: reflected marker (21, lead); scan: dom sinks | 21–24, 27 (payload confirmation) | 25–26 (stored/upload chains) |
| C. Access control (28–40) | scan: client-admin (38), unauthed endpoint (85→39) | 34, 35–37 | 28–33, 40 (IDOR/BOLA/privilege/tenant — need 2 accounts) |
| D. Auth & session (41–57) | scan: localStorage token (82), no login/reset limit (45) | 44, 49–51, 55 | 41–43, 46–48, 52–54, 56–57 (flows/tokens) |
| E. CSRF & SSRF (58–64) | scan: SSRF sink (61) | 61–63 | 58–60, 64 (CSRF token check, DNS rebind) |
| F. Rate/abuse (65–72) | swarm: no rate limit (65) | 66–68, 71 | 69–70, 72 (business-flow, pagination) |
| G. Secrets/exposure (73–83) | scan: 73–74, 82; swarm: 76, 77, 78, 83 | 79, 81 | 75 (public buckets — provider CLI), 80, 83 poisoning |
| H. Misconfig (84–96) | scan: 84, 85, 87; swarm: 86, 87, 88, 90, 91, 92/34, server-version | 89, 93–96 | 89 (subdomain takeover — DNS), 93 (cloud IAM) |
| I. File upload (97–102) | — | 97–99, 101 | 97–102 (need an upload endpoint + payloads) |
| J. Client/supply-chain (103–112) | scan: missing SRI (106), dependency-hygiene (103/104-adjacent) | 103, 107–108 | 105, 109–112 (postMessage, DOM clobbering, WS) |
| K. Business logic (113–122) | scan: dependency-hygiene (121-adjacent) | 117–119 | 113–116, 120, 122 (race, price tampering, step-skip — app-specific) |

**What `scripts/swarm.mjs` automates today (live):** reflected-parameter marker (21), no-rate-limit
(65), directory listing (76), dotfile/backup exposure (77), verbose errors + server/version
disclosure (78), insecure cookie flags (82/56), sensitive-response cacheability (83), CORS
misconfig (86), missing security headers (87), clickjacking (88), open redirect (90), dangerous HTTP
methods (91), admin/debug path reachability (92/34). Everything else in the map is STRIX or MANUAL,
and the swarm prints exactly this list on exit so a clean run is never read as full coverage.

## The breach report

Only successes are logged — a failed attempt is not a finding and is not noise to record. Each
breach is one object; `scripts/swarm.mjs` emits this shape and manual findings use it too:

```json
{
  "vector": "86 CORS misconfig (reflected origin with credentials)",
  "endpoint": "GET /api/account https://staging.example.internal",
  "payload": "Origin: https://evil.example",
  "evidence": "Access-Control-Allow-Origin reflected evil.example with Allow-Credentials: true",
  "severity": "high",
  "reproduction": ["curl -s -H 'Origin: https://evil.example' https://staging.example.internal/api/account -i | grep -i access-control"],
  "cwe": "CWE-942"
}
```

Severities are `critical | high | medium | low`, ranked most-severe first in the final report. A run
that gets nothing through produces an **empty breach list** — that is the goal state and is reported
as such, alongside the coverage note (which families were attempted, which were not).

## The 6 to 7 loop

1. Phase 6 runs; produces the breach report.
2. Phase 7 fixes **every** breach in it — the fix belongs in the code/config, and each fix routes to
   the relevant `references/` file (a header fix is Phase 2, a CORS fix is Phase 2, a dependency CVE
   is Phase 5's cleanup plus Phase 2).
3. Re-run Phase 6.
4. Repeat until a full pass returns an empty breach list. Then report: the final empty report, the
   coverage note, and the list of everything fixed across iterations.

**Termination and honesty.** The loop ends on a clean pass, not on a fixed iteration count — but if
a breach cannot be fixed (a third-party dependency with no patch, a platform limitation), record it
as an accepted-risk item with severity intact and stop looping on it rather than spinning. Never
report the loop as clean while a known breach stands.
