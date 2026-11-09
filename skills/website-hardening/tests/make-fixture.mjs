#!/usr/bin/env node
// Generates tests/fixtures/vulnerable-site/ — a deliberately-broken site used three ways:
//   1. the RED baseline target (does an agent WITHOUT the skill find and fix these?)
//   2. the self-test corpus for scripts/scan.mjs (every check must fire on at least one seeded defect)
//   3. a safe, local, user-owned swarm target for Phase 6 demonstrations
// Every defect below is intentional and labelled with the phase/check it exercises.
// Regenerate with: node tests/make-fixture.mjs
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'vulnerable-site');
rmSync(root, { recursive: true, force: true });
const w = (rel, s) => { const p = join(root, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, s); };

// ── Phase 2: secret exposed in a client bundle (SEC-KEYS) ─────────────────────
w('public/app.js', `// SEED SEC-KEYS: live secret keys hardcoded into client-shipped JS
const STRIPE_SECRET_KEY = "sk_live_${'51QwErTyUiOpAsDfGhJkLzXcVbNm00exampleXX'}";
const SUPABASE_SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role.PLACEHOLDER_DO_NOT_USE";
const OPENAI_API_KEY = "sk-proj-EXAMPLEfakekeydonotusethisisatest000000";

// SEED SEC-SESSION: session token written to localStorage (XSS-stealable)
function login(token) { localStorage.setItem("auth_token", token); }

// SEED SEC-ADMIN: admin gate decided entirely client-side
function boot(user) { if (user && user.isAdmin === true) { document.body.dataset.admin = "1"; } }

// SEED SEC-XSS-SINK: untrusted data into an XSS sink
function render(userInput) { document.getElementById("out").innerHTML = userInput; }
function evil(data) { eval(data); }

// SEED CQ-CONSOLE: debug statement left in shipped code
function trace(user) { console.log("DEBUG user=", user); debugger; }
// SEED CQ-TODO: unresolved debt marker
// TODO: rate-limit this before launch
// SEED CQ-EMPTYCATCH: swallowed error (silent failure)
function save() { try { persist(); } catch (e) {} }

// SEED CQ-DEAD: unreachable dead code
if (false) { legacyCheckout(); computeOldTax(); }
function legacyCheckout() { return computeOldTax(); }
// SEED CQ-DUP: duplicated logic (see util.js sum())
function total(items){ let t=0; for (const i of items) t+=i.price*i.qty; return t; }
`);

w('public/util.js', `// SEED CQ-DUP: identical logic duplicated from app.js total()
function sum(items){ let t=0; for (const i of items) t+=i.price*i.qty; return t; }
// SEED CQ-UNUSED: exported but referenced nowhere
export function neverImported(){ return 42; }
`);

// ── Phase 2: Firebase open rules (SEC-FIREBASE) ───────────────────────────────
w('firestore.rules', `rules_version = '2';
// SEED SEC-FIREBASE: world-readable and world-writable
service cloud.firestore {
  match /databases/{db}/documents {
    match /{document=**} { allow read, write: if true; }
  }
}
`);

// ── Phase 2/G: committed .env with secrets (SEC-DOTENV) ───────────────────────
w('.env', `# SEED SEC-DOTENV: real-looking secrets committed to the repo
DATABASE_URL=postgres://admin:hunter2@db.internal:5432/prod
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
JWT_SECRET=devsecret
`);

// ── Phase 2: an "API" with no authn, no rate limit, SQLi and SSRF sinks ───────
w('api/users.js', `// SEED SEC-ENDPOINT: returns every user's PII to anyone, no auth check
// SEED SEC-RATE: no rate limiter anywhere in the handler
export default function handler(req, res) {
  // SEED SEC-SQLI: request data concatenated straight into SQL
  const all = db.query("SELECT id,email,ssn FROM users WHERE id = " + req.query.id);
  // SEED SEC-SSRF: server fetches a user-controlled URL
  fetch(req.query.avatar).then(r => r.text());
  res.json(all);
}
`);

// ── Phase 3: the marketing page — a11y + dark-pattern + missing-policy defects ─
w('public/index.html', `<!doctype html>
<html>            <!-- SEED A11Y-LANG: no lang attribute -->
<head>
  <meta charset="utf-8">
  <title>MegaDeals</title>
  <!-- SEED A11Y-VIEWPORT: none, plus SEED PERF-BLOCK: render-blocking synchronous third-party -->
  <script src="https://cdn.example-tracker.com/pixel.js"></script>
  <!-- SEED LEGAL-3P: Google Analytics with no consent gate and no disclosure -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-EXAMPLE"></script>
  <style>
    body{font-family:Arial;margin:0}
    .muted{color:#bbbbbb;background:#ffffff}   /* SEED A11Y-CONTRAST: ~1.9:1 */
    .cta{background:#ff8a8a;color:#ffd0d0}      /* SEED A11Y-CONTRAST: fails on button too */
  </style>
</head>
<body>
  <header><img src="/logo.png"></header>       <!-- SEED A11Y-ALT: no alt -->
  <h1>The #1 analytics tool trusted by everyone</h1> <!-- SEED DARK-CLAIM: unsupported superlative -->
  <p class="muted">Rated 5 stars by 10,000 happy customers.</p> <!-- SEED DARK-REVIEW: fabricated -->
  <p>Only <s>$99</s> $9/mo. <small>+ mandatory $40 onboarding fee applied at checkout.</small></p>
  <!-- SEED DARK-FEE: hidden mandatory fee disclosed only in fine print -->

  <form action="/api/subscribe" method="post">
    <input type="email" placeholder="Email">   <!-- SEED A11Y-LABEL: no label, placeholder-as-label -->
    <input type="text" placeholder="Card number">
    <!-- SEED LEGAL-CONSENT: collecting email + card with no consent checkbox, no privacy link -->
    <button class="cta">Claim your spot before it's gone!!</button> <!-- SEED DARK-URGENCY -->
  </form>

  <!-- SEED LEGAL-POLICY: no link to privacy / terms / refund / cookie policy anywhere -->
  <!-- SEED LEGAL-BANNER: no cookie-consent mechanism though GA + pixel set cookies -->
  <!-- SEED LEGAL-BUSINESS: no business name, address, or contact -->
  <footer><p>&copy; 2026</p></footer>
  <script src="/app.js"></script>
</body>
</html>
`);

// ── Phase 4: uncompressed / oversized JSON shipped to the client (PERF-JSON) ──
const bloat = { generatedFor: 'PERF-JSON seed', rows: [] };
for (let i = 0; i < 4000; i++) bloat.rows.push({ id: i, name: 'Row ' + i, blurb: 'x'.repeat(120), active: i % 2 === 0 });
w('public/data.json', JSON.stringify(bloat, null, 2)); // pretty-printed on purpose = larger

// ── Phase 4: row-at-a-time DB writes (PERF-DBLOOP) ────────────────────────────
w('scripts/seed.js', `// SEED PERF-DBLOOP: one INSERT per row inside a loop instead of a batch insert
for (const row of rows) { await db.query("INSERT INTO t(a,b) VALUES($1,$2)", [row.a, row.b]); }
`);

// ── deploy config: missing security headers (SEC-HEADERS) + not static (PERF-STATIC) ──
w('vercel.json', `{
  "//": "SEED SEC-HEADERS: no HSTS, X-Frame-Options, X-Content-Type-Options headers block",
  "version": 2
}
`);

// SEED SEC-CSP-WEAK: a CSP that exists but permits unsafe-inline/unsafe-eval (weakens the point of it)
w('_headers', `/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'
`);

// SEED PERF-IMG-BIG: an oversized (>500 KB) image asset
w('public/hero.png', Buffer.alloc(620 * 1024, 0x7a));

// SEED SEC-LOCKFILE + SEC-LIFECYCLE: package.json with floating deps, a postinstall script, and NO lockfile
w('package.json', `{
  "name": "megadeals",
  "version": "1.0.0",
  "scripts": { "postinstall": "node ./scripts/setup.js", "dev": "http-server ." },
  "dependencies": { "lodash": "^4.17.11", "express": "*" }
}
`);

// SEED CQ-FOCUSED: a focused/skipped test silently guts the suite
w('tests/app.test.js', `describe.only("cart", () => {
  it.skip("applies tax", () => {});
  it("adds item", () => {});
});
`);

// SEED CQ-TYPE: TypeScript escape hatches disable the type checker
w('src/pay.ts', `// @ts-nocheck
export function charge(amount: any): any {
  // @ts-ignore
  return gateway.run(amount);
}
`);

// A manifest the scanner/self-test reads to know every seeded defect and which check owns it.
w('SEEDED-DEFECTS.json', JSON.stringify({
  note: 'Ground truth for scripts/scan.mjs self-test. Each id must be detected by its check.',
  defects: [
    { id: 'SEC-KEYS', phase: 2, where: 'public/app.js', check: 'secrets-in-bundle' },
    { id: 'SEC-SESSION', phase: 2, where: 'public/app.js', check: 'localstorage-token' },
    { id: 'SEC-ADMIN', phase: 2, where: 'public/app.js', check: 'client-side-admin' },
    { id: 'SEC-FIREBASE', phase: 2, where: 'firestore.rules', check: 'firebase-open-rules' },
    { id: 'SEC-DOTENV', phase: 2, where: '.env', check: 'committed-secrets' },
    { id: 'SEC-ENDPOINT', phase: 2, where: 'api/users.js', check: 'unauthed-endpoint' },
    { id: 'SEC-RATE', phase: 2, where: 'api/users.js', check: 'no-rate-limit' },
    { id: 'SEC-HEADERS', phase: 2, where: 'vercel.json', check: 'security-headers' },
    { id: 'A11Y-ALT', phase: 3, where: 'public/index.html', check: 'img-alt' },
    { id: 'A11Y-CONTRAST', phase: 3, where: 'public/index.html', check: 'contrast' },
    { id: 'A11Y-LABEL', phase: 3, where: 'public/index.html', check: 'form-labels' },
    { id: 'A11Y-LANG', phase: 3, where: 'public/index.html', check: 'html-lang' },
    { id: 'LEGAL-POLICY', phase: 3, where: 'public/index.html', check: 'policy-pages' },
    { id: 'LEGAL-BANNER', phase: 3, where: 'public/index.html', check: 'cookie-consent' },
    { id: 'LEGAL-CONSENT', phase: 3, where: 'public/index.html', check: 'form-consent' },
    { id: 'LEGAL-3P', phase: 3, where: 'public/index.html', check: 'third-party-sdk' },
    { id: 'DARK-CLAIM', phase: 3, where: 'public/index.html', check: 'unsupported-claims' },
    { id: 'DARK-REVIEW', phase: 3, where: 'public/index.html', check: 'fake-reviews' },
    { id: 'DARK-FEE', phase: 3, where: 'public/index.html', check: 'hidden-fees' },
    { id: 'SEC-XSS-SINK', phase: 2, where: 'public/app.js', check: 'xss-sink' },
    { id: 'SEC-CSP-WEAK', phase: 2, where: '_headers', check: 'csp-quality' },
    { id: 'SEC-SRI', phase: 2, where: 'public/index.html', check: 'missing-sri' },
    { id: 'SEC-SQLI', phase: 2, where: 'api/users.js', check: 'sql-injection-sink' },
    { id: 'SEC-SSRF', phase: 2, where: 'api/users.js', check: 'ssrf-sink' },
    { id: 'SEC-LOCKFILE', phase: 2, where: 'package.json', check: 'dependency-hygiene' },
    { id: 'PERF-JSON', phase: 4, where: 'public/data.json', check: 'uncompressed-json' },
    { id: 'PERF-DBLOOP', phase: 4, where: 'scripts/seed.js', check: 'row-at-a-time-writes' },
    { id: 'PERF-BLOCK', phase: 4, where: 'public/index.html', check: 'render-blocking' },
    { id: 'PERF-IMG-BIG', phase: 4, where: 'public/hero.png', check: 'large-image' },
    { id: 'A11Y-IMGDIM', phase: 4, where: 'public/index.html', check: 'img-dimensions' },
    { id: 'CQ-DEAD', phase: 5, where: 'public/app.js', check: 'dead-code' },
    { id: 'CQ-DUP', phase: 5, where: 'public/util.js', check: 'duplicate-logic' },
    { id: 'CQ-UNUSED', phase: 5, where: 'public/util.js', check: 'unused-export' },
    { id: 'CQ-CONSOLE', phase: 5, where: 'public/app.js', check: 'console-debug' },
    { id: 'CQ-TODO', phase: 5, where: 'public/app.js', check: 'todo-debt' },
    { id: 'CQ-EMPTYCATCH', phase: 5, where: 'public/app.js', check: 'empty-catch' },
    { id: 'CQ-FOCUSED', phase: 5, where: 'tests/app.test.js', check: 'focused-tests' },
    { id: 'CQ-TYPE', phase: 5, where: 'src/pay.ts', check: 'type-escape' },
  ],
}, null, 2));

console.log('fixture written to ' + root);
