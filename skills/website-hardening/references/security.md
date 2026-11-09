# Security — test then fix

## Contents

- [Data-layer](#data-layer)
- [Auth and session](#auth-and-session)
- [Abuse and rate-limiting](#abuse-and-rate-limiting)
- [Injection and XSS (source sinks)](#injection-and-xss-source-sinks)
- [Cross-site and client integrity](#cross-site-and-client-integrity)
- [Dependencies and supply chain](#dependencies-and-supply-chain)
- [Domain and DNS](#domain-and-dns)
- [The static sweep, and what it cannot decide](#the-static-sweep-and-what-it-cannot-decide)

Phase 2's whole checklist, each item as a test paired with a fix. This file owns the *code and config* posture — is the data reachable, is authorization enforced server-side, is abuse bounded — and nothing else: visual work (focus rings, contrast, keyboard operability, the state surfaces, the screenshot protocol) is **`website-design`'s** and is not restated here even where a security fix touches a login form. Run the static sweep first as a lead generator, then work the manual items it cannot decide. **A claim is worth nothing without the command that proves it** — every entry below carries the command or exact probe that produces the finding and the concrete change that clears it. Start each group with:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <project-dir> --only sec
```

The scanner emits findings keyed by CHECK ID (`secrets-in-bundle`, `localstorage-token`, `client-side-admin`, `firebase-open-rules`, `committed-secrets`, `unauthed-endpoint`, `no-rate-limit`, `security-headers`, `xss-sink`, `sql-injection-sink`, `ssrf-sink`, `csp-quality`, `missing-sri`, `dependency-hygiene`); each numbered item below names the id it maps to, or says the item is manual-only. A static hit is a lead, not a verdict — confirm it, and confirm the absence of a hit by probing, because the scanner reads files and cannot see what a running server actually returns. **The source-sink checks (`xss-sink`, `sql-injection-sink`, `ssrf-sink`) are static leads: the pattern names a dangerous sink, not a proven exploit — confirm each reaches untrusted input before you call it a finding.**

---

## Data-layer

**1. Row Level Security — present, correct, and ENFORCED.** Manual-only; the scanner cannot see a live database. A policy that reads correctly in the migration can still leak, and the only test that proves enforcement runs **as a non-owner, non-`BYPASSRLS` role** — the table owner and any `BYPASSRLS` role skip RLS entirely, so a query that returns the right rows *as the owner* has tested nothing.

- **Test.** Connect as the least-privileged application role (the role your runtime actually uses), impersonate one tenant, and confirm zero rows from any other tenant come back:

  ```sql
  -- NOT as the owner, NOT as a BYPASSRLS/superuser role
  SET ROLE authenticated;                                   -- the app's real least-privileged role
  SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user;  -- MUST be false
  SET request.jwt.claims = '{"sub":"<tenant-A-user-id>"}'; -- set the tenant GUC your policy reads
  SELECT tenant_id, count(*) FROM orders GROUP BY tenant_id;       -- MUST show ONLY tenant A
  ```

  Then flip the GUC to tenant B and confirm the set changes completely. Also confirm RLS is on and forced: `SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname='orders';` — both must be `t`, or the owner's own queries bypass the policy.
- **Fix.** Enable and force RLS (`ALTER TABLE orders ENABLE ROW LEVEL SECURITY; ALTER TABLE orders FORCE ROW LEVEL SECURITY;`) and give every table a policy carrying the tenant predicate on **both** clauses. **A `USING`-only policy hides the app tenant predicate** — `USING` gates which rows are *visible*, but with no `WITH CHECK` an insert or update can write a row belonging to another tenant, and the leak never shows on a read test. Write both: `USING (tenant_id = current_tenant())` and `WITH CHECK (tenant_id = current_tenant())`. Re-run the non-owner probe until both read and write are confined. (This is also swarm vector 40, tenant-isolation / RLS bypass, in Phase 6.)
- **`SECURITY DEFINER` functions bypass RLS.** A Postgres function declared `SECURITY DEFINER` runs as its *owner*, so a correct policy on the table does nothing for rows read or written through that function — and Supabase exposes public-schema functions over RPC. **Test:** `SELECT n.nspname, p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.prosecdef AND n.nspname NOT IN ('pg_catalog','information_schema');` — every row is a lead; read each body for a missing tenant predicate. **Fix:** make it `SECURITY INVOKER` unless it genuinely needs elevation; if it does, re-apply the tenant predicate inside the body, `SET search_path = ''`, and `REVOKE EXECUTE ... FROM PUBLIC, anon`.

**2. Secrets and keys in the client bundle** (`secrets-in-bundle`). Any live key — Stripe `sk_live_`, `sk-proj-`, `AKIA…`, a Supabase `service_role`, private-key PEM material, or a generic `apiKey/secret/token` literal — compiled into code that ships to the browser is public the moment it deploys.

- **Test.** `node "${CLAUDE_SKILL_DIR}/scripts/scan.mjs" <dir> --only sec` flags the literal in source; confirm what actually ships by grepping the built output: `grep -rEn 'sk_live_|sk-proj-|AKIA[0-9A-Z]{16}|service_role|BEGIN (RSA |EC )?PRIVATE KEY' dist build .next/static 2>/dev/null`.
- **Fix.** Move the secret to a server-only environment variable (no `NEXT_PUBLIC_`/`VITE_`/`REACT_APP_` prefix — those are inlined into the client), call the privileged API only from a server route, and **rotate the exposed key immediately** — grep history proves it was public. (Swarm vector 73.)

**3. Firebase `allow if true`** (`firebase-open-rules`). A rule reading `allow read, write: if true` in `firestore.rules` / `storage.rules` is a world-readable, world-writable database.

- **Test.** Scanner flags it statically; prove it live against the emulator or a staging project with an unauthenticated client read of a document that should require auth. Deploy rules to the emulator (`firebase emulators:start`) and confirm a no-token read is denied.
- **Fix.** Replace `if true` with an auth-and-ownership predicate — `allow read: if request.auth != null && resource.data.ownerId == request.auth.uid;` — narrowest scope per collection, and never a top-level `match /{document=**}` wildcard with a permissive rule. (Swarm vector 84.)

**4. Unauthenticated API endpoints** (`unauthed-endpoint`). A handler under `api/`, `routes/`, `pages/api/`, or `app/api/` that returns data with no auth check answers anyone who finds the URL.

- **Test.** Scanner flags handlers with no visible auth token; confirm by calling the route with no credentials and checking it does not return protected data: `curl -s -i http://localhost:3000/api/<route>` — a 200 with real rows is the finding, a 401/403 is the pass.
- **Fix.** Gate every handler behind a server-side auth check *before* it touches data, and add the ownership/tenant predicate for multi-tenant reads (see item 1). A client-side redirect or a hidden UI link is not a boundary. (Swarm vector 85.)

**5. Sensitive data in PUBLIC storage buckets.** Manual-only; enumerate the ACLs per provider. Public buckets are the single most common source of mass data exposure and no source-scan can see cloud state.

- **Test.** Enumerate object and bucket ACLs directly:
  - **S3** — `aws s3api get-bucket-acl --bucket <b>` and `aws s3api get-bucket-policy --bucket <b>`; check the account-level guard `aws s3api get-public-access-block --bucket <b>`. A grantee of `AllUsers`/`AuthenticatedUsers` or a `Principal:"*"` allow is a finding. Anonymous listing: `curl -s https://<b>.s3.amazonaws.com/` returning XML keys.
  - **GCS** — `gsutil iam get gs://<b>`; `allUsers` or `allAuthenticatedUsers` in any binding is public.
  - **Supabase Storage** — a bucket with `public = true` (`select id, public from storage.buckets;`) serves every object with no token; confirm with an anonymous `curl -s -o /dev/null -w '%{http_code}' https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<key>` returning 200.
  - **Firebase Storage** — governed by `storage.rules`; test as item 3, an unauthenticated download of a path that should be private.
- **Fix.** Make the bucket private, serve user files through short-lived signed URLs (S3 presign / GCS signed URL / Supabase `createSignedUrl`), and enable the account-level public-access block. Rotate or re-issue anything that was exposed. (Swarm vector 75.)

**6. Committed `.env` / secrets in source** (`committed-secrets`). A `.env` (or any file) carrying `*_SECRET`, `*_KEY`, `*_TOKEN`, `*_PASSWORD`, `DATABASE_URL`, or a DSN, tracked in version control, leaks to everyone with repo access and lives forever in history.

- **Test.** Scanner flags secret assignments in a present `.env`; confirm it is tracked and scrub history: `git ls-files | grep -E '(^|/)\.env'` (a hit means it is committed) and `git log --all --full-history -- '*.env'`. This is the working-tree half only — the git-HISTORY sweep for secrets that were committed and later deleted is item 20.
- **Fix.** Add `.env*` to `.gitignore`, `git rm --cached` the file, **rotate every value it held** (history keeps the old ones), purge history if the repo is or was shared (`git filter-repo`), and move the values to a secrets manager or the host's env config. (Swarm vector 74/77.)

---

## Auth and session

**7. Session tokens in `localStorage`** (`localstorage-token`). Anything matching `localStorage.setItem('…token/jwt/auth/session…')` is readable by any script on the page — one XSS and the session is stolen, and `localStorage` is never sent with the httpOnly protections a cookie gets.

- **Test.** Scanner flags the write; confirm in a running page via DevTools → Application → Local Storage, or `Object.keys(localStorage)` in the console, that no auth material sits there.
- **Fix.** Move the session to a cookie set **`HttpOnly; Secure; SameSite=Lax`** (or `Strict` where no cross-site navigation needs it) from the server; the browser attaches it automatically and script cannot read it. This closes the token-theft half of XSS even before the XSS is fixed. (Swarm vector 82.)

**8. Client-side admin / authorization decisions** (`client-side-admin`). A branch on `isAdmin`, `is_admin`, or `role === 'admin'` in client code decides what the UI *shows*, never what the server *allows* — the user edits the variable in DevTools and the privileged call goes through.

- **Test.** Scanner flags the client check; prove the gap by calling the privileged endpoint directly as a non-admin session and confirming the server refuses it: `curl -s -i -H "Cookie: <non-admin-session>" -X POST http://localhost:3000/api/admin/<action>` must return 403.
- **Fix.** Enforce authorization **server-side on every privileged action** — re-check the role/permission in the handler against the authenticated session, not against anything the client sent. Keep the client check only as UX (hide the button), never as the boundary. (Swarm vector 38/39.)

**9. No second factor (2FA / OTP).** Manual-only; a single password is the whole barrier to every account, and credential-stuffing against reused passwords is the most common real-world takeover.

- **Test.** Walk the login flow: is there any TOTP / WebAuthn / email-OTP step offered, at minimum for admin and privileged accounts? Check the auth config for an MFA setting; absence is the finding.
- **Fix.** Offer and, for privileged roles, require a second factor — TOTP (RFC 6238) or WebAuthn/passkeys preferred over SMS. Most managed auth providers (Supabase Auth, Auth0, Cognito, Clerk) ship this behind a config flag; enable it rather than hand-rolling. The admin panel gets MFA unconditionally, and where the team is small and fixed, put it behind an IP allowlist, VPN or zero-trust gateway as well, so it is not reachable from the open internet at all. (A circulating reel claims missing 2FA means "anybody can sign up as anybody" — that is a missing *email-verification* problem, item 31, not a 2FA one.)

**10. Login AND password-reset endpoints missing rate limiters.** Manual-confirm; the site-wide check is item 12, but these two endpoints are the ones brute force and reset-token abuse target first, so verify them explicitly.

- **Test.** Fire repeated requests and confirm the endpoint starts refusing: `for i in $(seq 1 30); do curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/login -d '{"email":"a@b.c","password":"x"}' -H 'content-type: application/json'; done` — a wall of `200/401` with no `429` is the finding. Repeat against `/api/reset-password`.
- **Fix.** Put a limiter in front of both — per-IP and per-account — that returns `429` after a small threshold (e.g. 5–10/min), with exponential backoff or lockout on repeated failure. Rate-limit the reset endpoint by target email too, so it cannot be used to spray or enumerate. (Swarm vector 42/45/57.)

**11. No password-strength check, and no breached-password screen.** Manual-only. Accepting `password123` or a known-breached password guarantees weak accounts regardless of everything else.

- **Test.** Attempt to register with a trivially weak password and with a known-breached one; if both are accepted, the finding stands. Inspect the signup handler for any strength or breach check.
- **Fix.** Enforce a length-first policy (NIST 800-63B: minimum 8, ideally 12+, no forced composition rules, no forced rotation) and screen against a breached-password list — the Have I Been Pwned range API (`GET https://api.pwnedpasswords.com/range/<first5-of-sha1>`) does this with k-anonymity so the full hash never leaves the server. Reject on a match. (Swarm vector 43/80.)

**22. Sign-out that only deletes the cookie.** Manual-only. Clearing the client cookie while the server still honors the session means a stolen or copied token keeps working after "logout".

- **Test.** Log in, copy the session cookie, sign out, then replay a protected request with the copied cookie: `curl -s -o /dev/null -w '%{http_code}\n' -H "Cookie: <copied-session>" http://localhost:3000/api/me` — anything but `401` is the finding. Repeat after a password change: every other session should also die.
- **Fix.** Invalidate server-side on sign-out — delete the session row, or for JWTs keep short access-token lifetimes plus a revocable refresh token (Supabase `signOut({ scope: 'global' })`, Cognito `GlobalSignOut`/`RevokeToken`). Revoke all sessions on password change and on email change. (Swarm vector 46/47.)

**23. Identity taken from the request instead of the session (IDOR).** Manual-only; needs two accounts. A handler that reads `user_id`/`account_id`/`?id=7` from the body or URL and trusts it lets any logged-in user act as any other.

- **Test.** Log in as user A, call a read and a write route with user B's id in the path/body/query; any B data returned or changed is the finding. Grep handlers for request-supplied owner ids: `grep -rnE "(body|query|params)\.(user_?id|userId|account_?id|owner_?id)" <api-dir>`.
- **Fix.** Derive the acting identity only from the authenticated session and add it as the ownership predicate on every query; treat a client-sent id as a *lookup key* that must still pass `WHERE owner_id = <session user>`. Defense in depth, never a substitute: use UUIDs (v4/v7) rather than sequential integers for public-facing ids so neighbors cannot be enumerated by `+1`. (Swarm vector 28/29.)

**24. Secrets compared with `==`.** Manual-only. Comparing an API key, webhook signature, or reset token with `==`/`===` returns early on the first wrong byte, leaking the secret one byte at a time through response timing.

- **Test.** `grep -rnE "(signature|secret|token|apiKey|api_key|hmac|digest)[^=\n]*[!=]==?" <src>` and read each hit that compares a secret.
- **Fix.** Use a constant-time comparison: Node `crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))` after a length check, Python `hmac.compare_digest`, Go `subtle.ConstantTimeCompare`.

**28. Auth responses that reveal whether an account exists (enumeration).** Manual-only. "No user found" versus "wrong password" — or a reset form that says "no account with that email" — hands an attacker a verified list of customers to stuff passwords against. (The rate limit in item 10 slows this; it does not remove it.)

- **Test.** Submit login and password-reset with a known-registered email and with a random one; diff the status code, the body, and the timing (`curl -s -o /dev/null -w '%{http_code} %{time_total}\n'`, ten runs each). Any consistent difference is the finding.
- **Fix.** One message for both login failures ("Email or password is incorrect"); reset always answers "If an account exists, we've sent a link"; do the same work (a dummy hash compare) on the unknown-user path so timing matches. Signup necessarily reveals a taken email — send the "you already have an account" notice by email instead of on screen where that matters. (Swarm vector 44.)

**29. JWT signing that can be forged.** Manual-only. A short or default HMAC secret is brute-forceable offline from a single captured token, and a verifier that trusts the token's own `alg` header accepts `none` or key-confusion tokens.

- **Test.** `grep -rnE "jwt\.(verify|decode)\(" <src>` — every `verify` without an explicit `algorithms: [...]` option is a lead, and any `decode` used for an authorization decision is a finding. Check the secret's source: a literal in code, a `NEXT_PUBLIC_`/`VITE_` variable, or fewer than 32 random bytes is a finding.
- **Fix.** Pin `algorithms` on every verify; a 256-bit random secret from the server environment (or asymmetric keys from the auth provider's JWKS); short access-token lifetimes plus revocable refresh (item 22); rotate the secret if it was ever weak or exposed. (Swarm vectors 49/50.)

---

## Abuse and rate-limiting

**12. No rate limits SITE-WIDE** (`no-rate-limit`). Not just login — every endpoint and every page. An unbounded read endpoint enables scraping and enumeration; an unbounded expensive query enables app-layer resource exhaustion; an unbounded write enables spam and cost blowups.

- **Test.** Scanner reports whether any limiter primitive exists in code at all (`express-rate-limit`, `@upstash/ratelimit`, `slowDown`, `bottleneck`, a middleware). A clean report means **none exists anywhere** — a project-level `high` finding. Confirm at least the hot endpoints refuse a flood with the loop in item 10 pointed at a read/write route, not just login.
- **Fix.** Add rate limiting as middleware across the app — a default limit on every route plus tighter limits on writes, expensive queries, and abusable reads. At the edge (Vercel/Cloudflare/nginx) or in-app (`express-rate-limit` + a shared store like Redis so limits hold across instances). **Scope the key correctly:** unauthenticated routes key by IP (a global/per-IP limit); authenticated routes key by **user id**, so one heavy user or one shared office NAT cannot throttle everyone else (the noisy-neighbor failure). A GraphQL endpoint needs query depth and complexity limits plus a batching cap on top, because one request can fan out into thousands of resolver calls. (Swarm vectors 65/71.)

**25. No ceiling on cost.** Manual-only. Autoscaling with no front-door limits turns a flood or brute-force run into a bill instead of an outage — the failure mode behind five-figure surprise invoices on small apps. (Circulating example, unverified: a ~$22,000 cloud bill, up ~900%, from an AI-assembled setup with autoscaling on and no rate limit, WAF, IP blocking or DDoS protection, so repeat attackers were simply served by more instances.)

- **Test.** Confirm three things exist, by command not by memory: a **max instance/concurrency cap** on every autoscaling tier (ECS `maxCapacity`, Lambda reserved concurrency, Vercel/Cloud Run max instances); a **WAF or edge rate rule** in front of the origin (AWS WAF rate-based rule, Cloudflare rate limiting); and a **billing alarm** that notifies a human (`aws budgets describe-budgets --account-id <id>` returns at least one with a notification). Any missing is the finding.
- **Fix.** Set the cap at a number the business can afford for a day of worst-case traffic, add the edge rate rule, and add a budget alert at ~50% and 100% of expected monthly spend.

**30. Payment or entitlement decided in the browser.** Manual-only. A paid feature gated by `if (user.isPro)` in client code, or an order marked paid because the browser landed on `/success?session_id=…`, is free to anyone who edits a variable or types the URL.

- **Test.** As a free account, call each paid-only API route directly (`curl -s -i -H "Cookie: <free-session>" …`) — anything but `403` is the finding. Then load the checkout success URL without paying, and confirm nothing is provisioned.
- **Fix.** The server decides entitlement on every paid request, from a database record written **only** by a verified payment webhook (item 32), never from a redirect, a query param, or client state. Prices and quantities come from the server's catalog, never from the request body. (Swarm vectors 114/115.)

**31. Anonymous actions that trigger expensive or legal side effects.** Manual-only. Any unauthenticated form that sends an email or SMS, calls an LLM, or opens a ticket can be scripted into a spam cannon or a bill. Real incident (founder's own account, unverified): bots mass-created fake accounts on a vibe-coded app, and each signup fired an automated GDPR data-request email, flooding the inbox; a rate limit on the email provider capped the damage, and there was no way to ban the source.

- **Test.** List what every anonymous endpoint (signup, contact, reset, waitlist, "request my data") triggers downstream. Script 20 submissions from one IP with throwaway emails: if 20 emails/SMS/LLM calls/tickets go out, the finding stands.
- **Fix.** No side effect fires until the address is verified (double opt-in); a bot check (Turnstile, hCaptcha) on signup and contact; per-IP **and** per-recipient limits on outbound email/SMS at the provider and in-app; a deny list you can add an IP, ASN or email domain to without a deploy. A DSAR form (`legal-trust-a11y.md` A7) must verify the requester before anything is sent or released. (Swarm vector 116.)

**13. Missing security headers** (`security-headers`). No CSP, HSTS, X-Frame-Options, or X-Content-Type-Options leaves the site open to injection, downgrade, clickjacking, and MIME-sniffing.

- **Test.** Scanner checks the host/edge config files for the four header names. Confirm what the server actually sends — configs can be right and the deploy wrong: `curl -sI https://<staging-url> | grep -iE 'content-security-policy|strict-transport-security|x-frame-options|x-content-type-options'`. A missing line is the finding.
- **Fix.** Set all four at the edge or host — `Content-Security-Policy` (start report-only, tighten to no `unsafe-inline`), `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`. Re-run the `curl -sI` until all four appear. (Swarm vector 87.)
- **CSP QUALITY — presence is not strength** (`csp-quality`). A header that is *present* can still be worthless: the scanner flags a CSP that carries `unsafe-inline` or `unsafe-eval` (which re-permit the inline-script and `eval` injection CSP exists to stop), a bare `*` source, or a missing `object-src 'none'` / `base-uri 'self'` / `frame-ancestors`. **Test.** Read the sent policy — `curl -sI https://<staging-url> | grep -i content-security-policy` — and check each `-src` for `unsafe-inline`, `unsafe-eval`, and lone `*`, and check that `object-src`, `base-uri`, and `frame-ancestors` are set. **Fix.** Remove `unsafe-inline`/`unsafe-eval` and drive scripts and inline styles by per-response nonces or content hashes; replace `*` with explicit host allowlists; add `object-src 'none'`, `base-uri 'self'`, and `frame-ancestors 'none'` (or the exact framing allowlist). Re-run until the policy has no wildcards and no `unsafe-*`.

---

## Injection and XSS (source sinks)

These three are **static leads**: the scanner names a dangerous sink where it appears in source, not a proven exploit. Each is a finding only when untrusted input (request params, body, query, URL, stored user data) can reach it — trace the argument back to its source, and where useful confirm live with a probe. A sink fed only by trusted constants is not a finding; note why and move on.

**14. DOM/JS XSS sinks** (`xss-sink`). The scanner flags `innerHTML =`, React `dangerouslySetInnerHTML`, `document.write(`, `eval(`, `new Function(`, and `insertAdjacentHTML(` — every one executes markup or code from whatever string it is handed.

- **Test.** Scanner locates the sink; confirm reachability by tracing the assigned value to a user-controlled source, then probe the live page by submitting a benign marker such as `"><img src=x onerror=alert(1)>` through the field or URL param that feeds it and watching whether it executes or renders as inert text.
- **Fix.** Prefer `textContent` (or the framework's safe binding — JSX `{value}`, Vue mustache, Svelte text) so the string is never parsed as HTML. Where HTML output is genuinely required, sanitize with a vetted library (DOMPurify) under a **strict allowlist** of tags/attributes and re-check that the marker is neutralized. Never pass request data to `eval`/`new Function` at all.

**15. SQL built by concatenation/interpolation** (`sql-injection-sink`). The scanner flags a `.query`/`.execute`/`.raw`/`.unsafe` call built with a template `${…}` interpolation or `"…" +` string concatenation, and a `SELECT/INSERT/UPDATE/DELETE` literal concatenated with a variable.

- **Test.** Scanner locates the concatenation; confirm the interpolated value derives from request input, then probe the endpoint with a canary such as `' OR '1'='1` (or a `;`/comment payload) in that parameter and confirm it does NOT change the row set or error out with a SQL parse error — either is the finding.
- **Fix.** Use parameterized queries / prepared statements (`$1,$2` for pg, `?` placeholders for mysql2/sqlite) or an ORM's bound query builder; the value must travel as a bound parameter, never spliced into the SQL text. Re-run the canary and confirm it is treated as a literal string.

**16. Server-side fetch of a request-controlled URL** (`ssrf-sink`). The scanner flags a server `fetch`/`axios`/`got`/`request`/`http(s).get` whose URL comes from `req.`/`request.`/`params.`/`query.`/`body.` — an attacker names the destination, so the server can be steered at internal services and cloud metadata.

- **Test.** Scanner locates the call; confirm the URL is attacker-controlled, then probe by passing `http://169.254.169.254/latest/meta-data/` (AWS metadata) or `http://localhost:<internal-port>/` and confirming the server refuses rather than fetching it.
- **Fix.** Validate the URL against an **allowlist of hosts and schemes** (https to known domains only), resolve the hostname and block link-local and private ranges (`169.254.169.254`, `10/8`, `172.16/12`, `192.168/16`, `127/8`, `::1`, `fc00::/7`), and disable redirect following so an allowlisted host cannot 302 into the private range. Re-run the metadata probe and confirm it is blocked.

---

## Cross-site and client integrity

**17. Cross-origin script/stylesheet without Subresource Integrity** (`missing-sri`). The scanner flags a `<script src="https://…">` or a `<link rel="stylesheet" href="https://…">` pointing at another origin with no `integrity` attribute — if that CDN or third party is compromised, its swapped-in file runs with full privileges on your page.

- **Test.** Scanner locates the tag; confirm it is genuinely cross-origin (not a self-hosted asset) and that no `integrity=` is present.
- **Fix.** Add `integrity="sha384-<hash>"` plus `crossorigin="anonymous"` to the tag (generate the hash from the exact pinned file, so an unannounced upstream change *fails closed* rather than executing), or self-host the asset so there is no third-party trust to pin. A wildcard/latest CDN URL cannot be pinned — pin the version too.

**18. Missing CSRF protection on cookie-authenticated writes.** Manual-only; no scanner check. Any state-changing endpoint (POST/PUT/PATCH/DELETE) that authenticates by an ambient cookie is forgeable from another origin unless a token or SameSite policy blocks the cross-site request. (Token/bearer-header auth that is NOT sent automatically by the browser is not exposed to classic CSRF.)

- **Test.** Replay a state-changing POST cross-site without the anti-CSRF token — from a different origin (or with `curl` supplying only the session cookie and omitting any CSRF token/header) — and confirm the server **rejects** it (403). Acceptance is the finding.
- **Fix.** Baseline every session cookie at `SameSite=Lax` (or `Strict` where no top-level cross-site navigation must stay logged in), and for sensitive POSTs add a per-request synchronizer token or a double-submit token validated server-side on every mutation. Verify the cross-site replay now returns 403 and the same request with a valid token still succeeds.

**32. Webhooks that accept unsigned or replayed events.** Manual-only. A webhook route is a public URL; without signature verification anyone can POST a fake `payment_succeeded`, and with a signature check but no timestamp check a captured real event can be replayed forever.

- **Test.** `grep -rniE "webhook" <api-dir>` and confirm each handler verifies the provider signature over the **raw** body (`stripe.webhooks.constructEvent`, Svix/`standardwebhooks` `verify`, a GitHub `X-Hub-Signature-256` HMAC). Then POST an unsigned body (must be 400/401) and replay a captured valid event with its original headers after the tolerance window (must be rejected).
- **Fix.** Verify the signature with the provider SDK or an HMAC compared in constant time (item 24); reject timestamps outside a short tolerance (Stripe's and Svix's default is 5 minutes); store processed event ids and drop duplicates so a retry or replay is idempotent. Outbound webhooks *you* send to user-supplied URLs are an SSRF sink — apply item 16's allowlist and private-range block. (Swarm vectors 122/61.)

**33. CORS that trusts any origin.** `security-headers` does not decide this; the Phase 6 swarm probes it live. `Access-Control-Allow-Origin` reflected from the request, or `*`, on a route that also sends `Access-Control-Allow-Credentials: true` lets any site read a logged-in user's responses.

- **Test.** `curl -s -i -H 'Origin: https://evil.example' https://<staging-url>/api/<authed-route> | grep -i access-control` — an echoed `evil.example` with credentials allowed is the finding.
- **Fix.** An explicit allowlist of exact origins compared server-side, never a regex on a suffix and never a reflected `Origin`; no credentials on public `*` routes; `Vary: Origin` when the header varies. (Swarm vector 86.)

**34. Private pages cached by the CDN.** The swarm checks cacheability (vector 83) live. A logged-in page or `/api/me` response cached at the edge is served to the next visitor; web-cache-deception tricks (`/account/profile.css`) get a private page cached under a static-looking path.

- **Test.** Request an authenticated route twice and read the cache headers: `curl -sI -H "Cookie: <session>" https://<staging-url>/account | grep -iE 'cache-control|age|x-vercel-cache|cf-cache-status|x-cache'` — a `HIT`, an `Age`, or a `Cache-Control` without `private`/`no-store` is the finding. Repeat with `/account/x.css` appended.
- **Fix.** `Cache-Control: private, no-store` on every response that depends on the session; CDN rules that bypass cache when a session cookie is present; make unknown paths under authenticated routes 404 instead of falling through to the page. (Swarm vectors 83/118.)

**35. Source maps served in production.** The client bundle is public anyway, so a source map is not itself a secret leak; it hands over readable original source, comments, internal route names and any secret you mistakenly compiled in (item 2). Severity **Low** unless it exposes one of those.

- **Test.** `grep -rl 'sourceMappingURL' dist build .next/static 2>/dev/null` and `curl -s -o /dev/null -w '%{http_code}\n' https://<staging-url>/<bundle>.js.map` — a 200 is the finding.
- **Fix.** Keep the framework default off (Vite `build.sourcemap: false`, Next `productionBrowserSourceMaps: false`); if error tracking needs maps, build with `hidden` maps and upload them to the tracker instead of deploying them. (Swarm vector 112.)

**36. Tokens, passwords and personal data in logs.** Manual-only. Logging `req.body`, full headers, or an error object that embeds the request copies passwords, session cookies, `Authorization` headers and reset tokens into a log store with broad access and long retention.

- **Test.** `grep -rnE "(console\.(log|error)|logger\.\w+)\(.*(req\.body|req\.headers|authorization|password|token)" <src>`, then trigger a failed login and a reset on staging and search the actual log output for the password and the token.
- **Fix.** Structured logging with redaction paths (`pino` `redact: ['req.headers.authorization','req.headers.cookie','*.password','*.token']` or equivalent); log ids, not payloads; set log retention to match `legal-trust-a11y.md` A11. (Swarm vector 81.)

---

## Dependencies and supply chain

**19. Known-CVE dependencies (Software Composition Analysis).** Manual-run; no scanner check — the static sweep does not resolve the dependency tree against a vulnerability database. A single known-vulnerable transitive package is an exploit you shipped without writing.

- **Test.** Run both, because they draw on different advisory sources: `npm audit --audit-level=high --json` (fails/reports at high and critical), and `osv-scanner --lockfile=package-lock.json` (or the pnpm/yarn lockfile) against the **committed lockfile** so the scan matches what actually installs. Any **high or critical** advisory is a finding.
- **Fix.** Bump the affected packages to their patched ranges (`npm audit fix`, or a manual version bump / `overrides` for a pinned transitive) and re-run until **zero high/critical** remain; record any residual medium/low that cannot yet be patched as a known issue with its advisory id and severity, never silently.

**20. Secrets in git HISTORY, not just the working tree.** Manual-run; item 6 and `committed-secrets` cover the current tree, but a secret committed once and later deleted is still in every clone forever. Deletion does NOT unexpose it.

- **Test.** Scan the whole history, not the checkout: `gitleaks detect --source . --redact` (or `trufflehog git file://. --only-verified`), or as a fallback `git log -p | grep -nE 'sk_live_|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC )?PRIVATE KEY-----|(SECRET|TOKEN|PASSWORD)\s*[:=]\s*\S'`. Any hit anywhere in history is a finding.
- **Fix.** **Rotate every value found first** — assume it is compromised, because scrubbing history does not un-leak what was already cloned or mirrored. Then remove it from history with `git filter-repo --invert-paths --path <file>` (or BFG), and force-push; coordinate with everyone holding a clone so the old history is not re-pushed.

**21. Dependency hygiene** (`dependency-hygiene`). The scanner flags three supply-chain surfaces in `package.json`: a **missing lockfile** (no `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`), **floating `*`/`latest` versions** that pull an unreviewed release on every install, and **install lifecycle scripts** (`preinstall`/`install`/`postinstall`/`prepare`) that run arbitrary code the moment a dependency is added.

- **Test.** Scanner reports each; confirm the lockfile is committed (`git ls-files | grep -E 'package-lock|pnpm-lock|yarn.lock'`) and read any lifecycle script the scanner named.
- **Fix.** Commit a lockfile so installs are reproducible and `npm audit`/OSV (item 19) are reliable; pin floating specifiers to a range or exact version; audit each lifecycle script and run CI installs with `--ignore-scripts` (`npm ci --ignore-scripts`) where the build does not depend on them, so a malicious postinstall cannot execute in the pipeline.

**26. CI actions pinned to movable tags.** Manual-only. `uses: some/action@v3` follows whatever the tag points to today; a compromised or re-tagged action runs in the pipeline with its secrets.

- **Test.** `grep -rnE "uses: [^@]+@" .github/workflows | grep -vE "@[0-9a-f]{40}"` — every line printed is a third-party action not pinned to a full commit SHA (first-party `actions/*` included; pin those too).
- **Fix.** Pin each to a 40-character SHA with the version as a comment (`uses: actions/checkout@<sha> # v4.2.2`), and let Dependabot/Renovate (see `externals.md`) bump the SHAs.

**37. No secret scanning before merge, and no tripwire.** Manual-only. Item 20 finds secrets already in history; this is the gate that stops the next one, plus a cheap alarm for when someone is already inside.

- **Test.** Check CI for a secret-scanning step that blocks the PR (`grep -rn gitleaks .github/workflows`) and whether the host's push protection is on (GitHub: secret scanning push protection in repo settings). Absence is the finding.
- **Fix.** `gitleaks` as a required check on every PR, and push protection on. Optionally plant a canary token (a fake AWS key or URL from canarytokens.org) in a place an intruder would look — a decoy `.env.backup`, an admin notes page — so any use of it alerts you. It detects, it does not prevent; never plant one where a teammate or scanner will trip it routinely.

A lockfile (item 21) pins versions and integrity hashes so a *new* malicious release cannot slip in silently; it does not help if the version you pinned was already compromised — that is items 19 and 26's job.

---

## Domain and DNS

Outside the code, but it decides who can impersonate the site. Manual-only; none of it is visible to the scanner.

**27. Domain and certificate control.**

- **Test.** `dig +short CAA <domain>` — empty means any certificate authority may issue for the domain. Check the **registrar account** has its own MFA (not SMS) and is not the same login as email or hosting. List every DNS record and confirm each target still exists: a `CNAME` pointing at a deleted S3 bucket, Heroku app, GitHub Pages site, or CloudFront distribution is a **dangling record** someone else can claim (subdomain takeover). While listing, open every `staging.`, `dev.`, `test.` and preview-deploy host without a session: one that serves the app with real data or default credentials is a finding.
- **Fix.** Add CAA records for only the CAs actually used (`0 issue "amazon.com"`, `0 issue "letsencrypt.org"`, plus `0 iodef "mailto:<security-contact>"`); enable registrar MFA and registrar lock; delete dangling records before, not after, tearing down the service they pointed at; put staging and previews behind auth (Vercel Deployment Protection, Cloudflare Access, basic auth) with seeded, not production, data. (Swarm vectors 89/92/43.)

---

## The static sweep, and what it cannot decide

The scanner is the fast first pass; it reads files and never sends a request, so the live half of this list — RLS enforcement, public buckets, actual header responses, whether a limiter really fires, whether a flagged sink is truly reachable — is proven only by the probes above, and the network-provable subset (rate limits, headers, CORS, exposure, open redirect) is re-run adversarially by **`scripts/swarm.mjs` in Phase 6** under the authorization gate. The SCA and git-history sweeps (items 19–20) are their own external tools and run outside the scanner entirely. Treat a clean scan as "no static leads," never as "secure." **A fix is not done until its test flips** — re-run the exact command that produced the finding and confirm it is gone before marking the item closed; anything still failing is reported as a known issue with its severity intact, never as fixed.
