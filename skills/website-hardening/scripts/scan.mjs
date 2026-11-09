#!/usr/bin/env node
/*
 * scan.mjs — the static half of website-hardening verification (Phases 2–5).
 *
 * This is the "tests that actually verify each item, not just prose" deliverable. It does NOT fix
 * anything and it does NOT send network traffic — it reads files and reports. Every finding is
 * evidence the agent then acts on and, after fixing, must clear on a re-scan.
 *
 * Usage:
 *   node scan.mjs <target-dir>                 # scan a project, human report to stdout
 *   node scan.mjs <target-dir> --json          # machine-readable findings
 *   node scan.mjs --self-test                  # run against the seeded fixture; assert every
 *                                              #   seeded defect id is caught. Exits non-zero if not.
 *   node scan.mjs <target-dir> --only sec,perf # limit to phase groups: sec,legal,a11y,perf,cq
 *
 * What it is NOT: a substitute for the runtime checks. Contrast/keyboard/console are only
 * *authoritatively* testable against rendered pixels — SKILL.md routes those to axe-core +
 * Playwright. This file catches what is statically decidable, which is most of the catalog.
 *
 * No external dependencies. Node >= 18. Runs anywhere the skill runs.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SKILL = join(HERE, '..');

// ── severity ranking for sort/report ─────────────────────────────────────────
const SEV = { blocker: 0, high: 1, medium: 2, low: 3 };

// ── file walker (skips the usual noise) ───────────────────────────────────────
const IGNORE = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage', '.turbo', 'vendor']);
function walk(dir, acc = []) {
  let ents;
  try { ents = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of ents) {
    if (IGNORE.has(e.name)) continue;                 // skip noise dirs; every other entry (incl. dotfiles like .env) is in scope
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}
const _readCache = new Map();                          // each file is read by ~15 checks — read from disk once
const read = (p) => { if (_readCache.has(p)) return _readCache.get(p); let s = ''; try { s = readFileSync(p, 'utf8'); } catch {} _readCache.set(p, s); return s; };
const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
// Presence-style checks ("is a limiter/consent/policy present?") must ignore comments — a comment
// that merely NAMES the missing thing is not the thing. Comments are BLANKED (chars → spaces) but
// newlines are kept, so a stripped-text match still reports the correct source line number.
const blank = (m) => m.replace(/[^\n]/g, ' ');
const stripComments = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, blank)
  .replace(/<!--[\s\S]*?-->/g, blank)
  .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + blank(m.slice(p1.length)));

// ── WCAG contrast math (used by the static contrast heuristic) ────────────────
function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function relLum([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(h1, h2) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  if (!a || !b) return null;
  const l1 = relLum(a), l2 = relLum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// ── each check: (files, findings, add) ───────────────────────────────────────
// add(check, phase, severity, file, line, evidence, fix)
const CHECKS = [];
const def = (id, group, fn) => CHECKS.push({ id, group, fn });

// ---- Phase 2: security ----
def('secrets-in-bundle', 'sec', (files, add) => {
  const pats = [
    [/sk_live_[A-Za-z0-9]{8,}/, 'Stripe live secret key'],
    [/sk-proj-[A-Za-z0-9]{8,}/, 'OpenAI project key'],
    [/AKIA[0-9A-Z]{16}/, 'AWS access key id'],
    [/service_role/, 'Supabase service_role reference'],
    [/-----BEGIN (RSA |EC )?PRIVATE KEY-----/, 'private key material'],
    [/(?:api[_-]?key|secret|token)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i, 'hardcoded key/secret literal'],
  ];
  for (const f of files) {
    if (!/\.(js|mjs|cjs|ts|tsx|jsx|html|vue|svelte)$/.test(f)) continue;
    const t = read(f);
    for (const [re, label] of pats) {
      const m = re.exec(t);
      if (m) add('secrets-in-bundle', 2, 'blocker', f, lineOf(t, m.index), `${label}: ${m[0].slice(0, 24)}…`,
        'Move to a server-only env var; rotate the exposed key immediately; never ship secrets in client code.');
    }
  }
});
def('localstorage-token', 'sec', (files, add) => {
  for (const f of files) {
    if (!/\.(js|mjs|cjs|ts|tsx|jsx|vue|svelte)$/.test(f)) continue;
    const t = read(f);
    const re = /localStorage\.setItem\(\s*["'`][^"'`]*(token|jwt|auth|session)[^"'`]*["'`]/gi;
    let m; while ((m = re.exec(t))) add('localstorage-token', 2, 'high', f, lineOf(t, m.index),
      `session/auth material in localStorage: ${m[0].slice(0, 48)}`,
      'Store session tokens in httpOnly, Secure, SameSite cookies — localStorage is readable by any XSS.');
  }
});
def('client-side-admin', 'sec', (files, add) => {
  for (const f of files) {
    if (!/\.(js|mjs|cjs|ts|tsx|jsx|vue|svelte)$/.test(f)) continue;
    const t = read(f);
    const re = /if\s*\([^)]*\b(isAdmin|is_admin)\b[^)]*\)|\.role\s*===?\s*["'`]?admin/gi;
    let m; while ((m = re.exec(t))) add('client-side-admin', 2, 'high', f, lineOf(t, m.index),
      `authorization decided in client code: ${m[0].slice(0, 60)}`,
      'Enforce authorization on the server for every privileged action; client checks are UX only, never a boundary.');
  }
});
def('firebase-open-rules', 'sec', (files, add) => {
  for (const f of files) {
    if (!/\.rules$/.test(f) && basename(f) !== 'firestore.rules' && basename(f) !== 'storage.rules') continue;
    const t = read(f);
    const re = /allow\s+(read|write|get|list|create|update|delete)[^;]*:\s*if\s+true/gi;
    let m; while ((m = re.exec(t))) add('firebase-open-rules', 2, 'blocker', f, lineOf(t, m.index),
      `open rule: ${m[0].slice(0, 60)}`,
      'Replace `if true` with an auth/ownership predicate (e.g. request.auth != null && resource ownership).');
  }
});
def('committed-secrets', 'sec', (files, add) => {
  for (const f of files) {
    if (!/(^|\/)\.env(\.|$)/.test(f)) continue;
    const t = read(f);
    const re = /^(?!#)([A-Z0-9_]*(SECRET|KEY|TOKEN|PASSWORD|DATABASE_URL|DSN)[A-Z0-9_]*)\s*=\s*\S+/gim;
    let m; while ((m = re.exec(t))) add('committed-secrets', 2, 'blocker', f, lineOf(t, m.index),
      `secret present in a committed .env: ${m[1]}`,
      'Remove .env from version control (gitignore it), rotate every value, and use a secrets manager.');
  }
});
def('unauthed-endpoint', 'sec', (files, add) => {
  for (const f of files) {
    if (!/(api|routes|handlers|pages\/api|app\/api)\//.test(f)) continue;
    if (!/\.(js|mjs|cjs|ts)$/.test(f)) continue;
    const t = read(f);
    if (!/export\s+(default\s+)?(async\s+)?function|export\s+const\s+\w+\s*=/.test(t)) continue;
    const code = stripComments(t); // a comment saying "no auth check" must not read as auth present
    const hasAuth = /(auth|session|getUser|getToken|verifyJwt|requireUser|withAuth|isAuthenticated|req\.user|ctx\.user)/i.test(code);
    if (!hasAuth) add('unauthed-endpoint', 2, 'high', f, 1,
      'API handler with no visible authentication/authorization check',
      'Gate the handler behind an auth check and (where multi-tenant) an ownership/RLS predicate before returning data.');
  }
});
def('no-rate-limit', 'sec', (files, add) => {
  // Only count a limiter that appears in CODE — a mention in a README/JSON is not a running limiter.
  const globalHasLimiter = files.filter((f) => /\.(js|mjs|cjs|ts|tsx)$/.test(f))
    .some((f) => /rate.?limit|ratelimit|express-rate-limit|@upstash\/ratelimit|slowDown|bottleneck/i.test(stripComments(read(f))));
  if (globalHasLimiter) return;
  // report once, at the project level, if no limiter primitive exists anywhere
  add('no-rate-limit', 2, 'high', '(project)', 0,
    'no rate-limiting primitive found anywhere in the project',
    'Add rate limiting site-wide — not just login: every write endpoint, every expensive query, and abusable read endpoints.');
});
def('security-headers', 'sec', (files, add) => {
  const configs = files.filter((f) => /(vercel|netlify|next\.config|_headers|nginx|middleware)\.(json|js|mjs|ts|conf)?$/.test(basename(f)) || basename(f) === '_headers');
  const NEED = ['content-security-policy', 'strict-transport-security', 'x-frame-options', 'x-content-type-options'];
  const joined = configs.map(read).join('\n').toLowerCase();
  const missing = NEED.filter((h) => !joined.includes(h));
  if (missing.length) add('security-headers', 2, 'medium', configs[0] ? configs[0] : '(project)', 0,
    `security headers not configured: ${missing.join(', ')}`,
    'Set CSP, HSTS, X-Frame-Options (or frame-ancestors), and X-Content-Type-Options at the edge/host.');
});

def('xss-sink', 'sec', (files, add) => {
  for (const f of files) {
    if (!/\.(js|mjs|cjs|ts|tsx|jsx|vue|svelte)$/.test(f)) continue;
    const t = stripComments(read(f));
    const sinks = [
      [/\.innerHTML\s*=(?!=)/g, 'assignment to innerHTML'],
      [/dangerouslySetInnerHTML/g, 'React dangerouslySetInnerHTML'],
      [/\bdocument\.write\s*\(/g, 'document.write()'],
      [/\beval\s*\(/g, 'eval()'],
      [/\bnew\s+Function\s*\(/g, 'new Function()'],
      [/\.insertAdjacentHTML\s*\(/g, 'insertAdjacentHTML()'],
    ];
    for (const [re, label] of sinks) { let m; while ((m = re.exec(t))) add('xss-sink', 2, 'high', f, lineOf(t, m.index),
      `XSS/injection sink: ${label}`,
      'Never pass untrusted data to this sink. Use textContent / safe framework binding; if HTML is required, sanitize with a vetted sanitizer (DOMPurify) and a strict allowlist.'); }
  }
});
def('csp-quality', 'sec', (files, add) => {
  for (const f of files) {
    if (!/(vercel|netlify|next\.config|_headers|nginx|middleware|csp)/i.test(basename(f))) continue;
    const t = read(f);
    const csp = /content-security-policy[^\n]*?([^\n]*(unsafe-inline|unsafe-eval)[^\n]*)/i.exec(t);
    if (csp) add('csp-quality', 2, 'medium', f, lineOf(t, csp.index),
      `CSP present but weakened: contains ${['unsafe-eval', 'unsafe-inline'].filter((x) => csp[0].includes(x)).join(' and ')}`,
      "Remove 'unsafe-inline'/'unsafe-eval': move to nonces/hashes for scripts and external stylesheets — an unsafe-inline CSP does not stop the XSS it exists to stop.");
  }
});
def('missing-sri', 'sec', (files, add) => {
  for (const f of files) {
    if (!/\.(html|jsx|tsx|vue|svelte)$/.test(f)) continue;
    const t = read(f);
    const re = /<(script|link)\b[^>]*\b(?:src|href)=["']https?:\/\/[^"']+["'][^>]*>/gi;
    let m; while ((m = re.exec(t))) {
      const tag = m[0];
      if (/rel=["'](?:icon|preconnect|dns-prefetch|manifest|canonical|alternate)/i.test(tag)) continue; // non-executable/link rels
      if (m[1].toLowerCase() === 'link' && !/rel=["']stylesheet/i.test(tag)) continue;
      if (!/\bintegrity=/i.test(tag)) add('missing-sri', 2, 'medium', f, lineOf(t, m.index),
        `cross-origin ${m[1]} without Subresource Integrity: ${tag.slice(0, 70)}`,
        'Add integrity="sha384-…" and crossorigin to third-party <script>/<link>, or self-host — a compromised CDN otherwise runs arbitrary code on your site.');
    }
  }
});

def('sql-injection-sink', 'sec', (files, add) => {
  for (const f of files) {
    if (!/\.(js|mjs|cjs|ts)$/.test(f)) continue;
    const t = stripComments(read(f));
    // query call with a template interpolation, or string concatenation into a query call
    const pats = [
      /\.(query|execute|raw|unsafe|prepare)\s*\(\s*`[^`]*\$\{/g,
      /\.(query|execute|raw|unsafe)\s*\([^)]*["'`]\s*\+/g,
      /\b(SELECT|INSERT|UPDATE|DELETE)\b[^"'`;]*["'`]\s*\+\s*\w/gi,
    ];
    for (const re of pats) { let m; while ((m = re.exec(t))) add('sql-injection-sink', 2, 'high', f, lineOf(t, m.index),
      `SQL built from concatenation/interpolation: ${m[0].slice(0, 60)}`,
      'Use parameterized queries / prepared statements ($1,$2 or ? placeholders) or an ORM binding — never build SQL from request data.'); }
  }
});
def('ssrf-sink', 'sec', (files, add) => {
  for (const f of files) {
    if (!/(api|routes|handlers|pages\/api|app\/api|server|lib)\//.test(f) || !/\.(js|mjs|cjs|ts)$/.test(f)) continue;
    const t = stripComments(read(f));
    const re = /\b(fetch|axios(?:\.get|\.post)?|got|request|http\.get|https\.get)\s*\(\s*(req\.|request\.|ctx\.|params\.|query\.|body\.|`[^`]*\$\{(?:req|request|params|query|body)\b)/g;
    let m; while ((m = re.exec(t))) add('ssrf-sink', 2, 'high', f, lineOf(t, m.index),
      `server-side request to a user-controlled URL: ${m[0].slice(0, 50)}`,
      'Validate the URL against an allowlist of hosts/schemes, resolve+block private/link-local IPs (169.254.169.254, 10/172.16/192.168, localhost), and disable redirects — an SSRF reaches cloud metadata and internal services.');
  }
});
def('dependency-hygiene', 'sec', (files, add) => {
  const pkgs = files.filter((f) => basename(f) === 'package.json' && !/node_modules/.test(f));
  const hasLock = files.some((f) => /(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|npm-shrinkwrap\.json)$/.test(basename(f)));
  for (const p of pkgs) {
    let json; try { json = JSON.parse(read(p)); } catch { continue; }
    if (!hasLock) add('dependency-hygiene', 2, 'medium', p, 0,
      'package.json present but no lockfile (package-lock.json / pnpm-lock.yaml / yarn.lock)',
      'Commit a lockfile so installs are reproducible and auditable; without it, `npm audit` and CVE pinning are unreliable.');
    const deps = { ...(json.dependencies || {}), ...(json.devDependencies || {}) };
    const floating = Object.entries(deps).filter(([, v]) => v === '*' || v === 'x' || v === 'latest');
    for (const [name] of floating) add('dependency-hygiene', 2, 'medium', p, 0,
      `unpinned floating dependency: "${name}": "*"`, 'Pin to a range or exact version; "*"/"latest" pulls an unreviewed version on every install.');
    const scripts = json.scripts || {};
    for (const life of ['preinstall', 'install', 'postinstall', 'prepare']) if (scripts[life]) add('dependency-hygiene', 2, 'low', p, 0,
      `lifecycle script "${life}": ${String(scripts[life]).slice(0, 40)}`,
      'Lifecycle scripts run on install and are a supply-chain surface — audit what they do and run CI installs with --ignore-scripts where possible.');
  }
});

// ---- Phase 3: legal / trust / a11y ----
def('img-alt', 'a11y', (files, add) => {
  for (const f of files) {
    if (!/\.(html|jsx|tsx|vue|svelte)$/.test(f)) continue;
    const t = read(f);
    const re = /<img\b(?![^>]*\balt=)[^>]*>/gi;
    let m; while ((m = re.exec(t))) add('img-alt', 3, 'high', f, lineOf(t, m.index),
      `<img> with no alt attribute: ${m[0].slice(0, 60)}`,
      'Add alt text describing the image; use alt="" only for decorative images.');
  }
});
def('html-lang', 'a11y', (files, add) => {
  for (const f of files) {
    if (basename(f) !== 'index.html' && !/\.html$/.test(f)) continue;
    const t = read(f);
    if (/<html\b/i.test(t) && !/<html\b[^>]*\blang=/i.test(t))
      add('html-lang', 3, 'medium', f, lineOf(t, t.search(/<html/i)), '<html> has no lang attribute',
        'Add lang (e.g. <html lang="en">) so assistive tech announces the correct language.');
  }
});
def('form-labels', 'a11y', (files, add) => {
  for (const f of files) {
    if (!/\.(html|jsx|tsx|vue|svelte)$/.test(f)) continue;
    const t = read(f);
    const re = /<input\b(?![^>]*\b(aria-label|aria-labelledby|id=)\b)[^>]*>/gi;
    let m; while ((m = re.exec(t))) {
      if (/type=["']?(hidden|submit|button)/i.test(m[0])) continue;
      add('form-labels', 3, 'high', f, lineOf(t, m.index),
        `input without an associated label (placeholder is not a label): ${m[0].slice(0, 60)}`,
        'Give each field a <label for> or aria-label; placeholders disappear on input and fail SC 3.3.2.');
    }
  }
});
def('contrast', 'a11y', (files, add) => {
  // static heuristic: find color/background hex pairs on the same CSS rule and flag ratios < 4.5:1.
  for (const f of files) {
    if (!/\.(css|html|scss)$/.test(f)) continue;
    const t = read(f);
    const ruleRe = /\{([^}]*)\}/g; let r;
    while ((r = ruleRe.exec(t))) {
      const body = r[1];
      const color = /(?:^|[^-])color\s*:\s*(#[0-9a-fA-F]{3,6})/.exec(body);
      const bg = /background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/.exec(body);
      if (color && bg) {
        const ratio = contrast(color[1], bg[1]);
        if (ratio && ratio < 4.5) add('contrast', 3, 'high', f, lineOf(t, r.index),
          `text/background contrast ${ratio.toFixed(2)}:1 (needs ≥4.5:1): ${color[1]} on ${bg[1]}`,
          'Darken text or lighten background until normal text clears 4.5:1 (3:1 for ≥24px/bold). Verify with axe at runtime.');
      }
    }
  }
});
def('policy-pages', 'legal', (files, add) => {
  const html = files.filter((f) => /\.(html|jsx|tsx|vue|svelte|md)$/.test(f)).map((f) => stripComments(read(f))).join('\n').toLowerCase();
  const paths = files.map((f) => f.toLowerCase()).join('\n');
  const want = [['privacy', 'privacy policy'], ['terms', 'terms of service / conditions'], ['refund', 'refund policy'], ['cookie', 'cookie policy']];
  const missing = want.filter(([k]) => !html.includes(k) && !paths.includes(k));
  if (missing.length) add('policy-pages', 3, 'medium', '(project)', 0,
    `no policy page or link found for: ${missing.map((m) => m[1]).join(', ')}`,
    'Add the missing policy pages and link them in the footer; refund policy applies wherever money changes hands.');
});
def('cookie-consent', 'legal', (files, add) => {
  const t = files.filter((f) => /\.(html|jsx|tsx|vue|svelte|js|ts)$/.test(f)).map((f) => stripComments(read(f))).join('\n');
  const setsCookies = /(googletagmanager|gtag|fbq|facebook\.net|hotjar|mixpanel|segment|document\.cookie\s*=)/i.test(t);
  const hasConsent = /(cookie[-_ ]?consent|cookieconsent|cookiebot|osano|onetrust|consent[-_ ]?banner|klaro)/i.test(t);
  if (setsCookies && !hasConsent) add('cookie-consent', 3, 'high', '(project)', 0,
    'analytics/marketing cookies are set with no consent mechanism present',
    'Add a consent banner that blocks non-essential cookies until opt-in (GDPR) / offers opt-out (CCPA).');
});
def('form-consent', 'legal', (files, add) => {
  for (const f of files) {
    if (!/\.(html|jsx|tsx|vue|svelte)$/.test(f)) continue;
    const t = read(f);
    const forms = (t.match(/<form[\s\S]*?<\/form>/gi) || []).map((form) => ({ raw: form, code: stripComments(form) }));
    for (const { raw: form, code } of forms) {
      const collectsPII = /type=["']?(email|tel|password)|name=["'][^"']*(email|phone|card|ssn)/i.test(code);
      const hasConsent = /type=["']?checkbox|consent|agree|privacy|terms/i.test(code);
      if (collectsPII && !hasConsent) add('form-consent', 3, 'medium', f, lineOf(t, t.indexOf(form)),
        'form collects personal data with no consent checkbox or privacy link',
        'Add an explicit, unchecked consent control and link the privacy policy at the point of collection.');
    }
  }
});
def('third-party-sdk', 'legal', (files, add) => {
  const seen = new Set();
  const sdks = [/googletagmanager|gtag/i, /connect\.facebook\.net|fbq/i, /hotjar/i, /mixpanel/i, /segment\.(com|io)/i, /fullstory/i, /clarity\.ms/i];
  for (const f of files) {
    if (!/\.(html|jsx|tsx|vue|svelte|js|ts)$/.test(f)) continue;
    const t = read(f);
    for (const re of sdks) { const m = re.exec(t); if (m && !seen.has(re.source)) { seen.add(re.source);
      add('third-party-sdk', 3, 'low', f, lineOf(t, m.index), `third-party SDK loaded: ${m[0]}`,
        'Inventory each third-party SDK: disclose it in the privacy policy, gate it behind consent, and drop any you do not need.'); } }
  }
});
def('unsupported-claims', 'legal', (files, add) => {
  for (const f of files) {
    if (!/\.(html|jsx|tsx|vue|svelte|md)$/.test(f)) continue;
    const t = read(f);
    const re = /(#1|number one|the best|guaranteed|100% (secure|safe)|trusted by everyone|world'?s (best|leading))/gi;
    let m; while ((m = re.exec(t))) add('unsupported-claims', 3, 'low', f, lineOf(t, m.index),
      `unsupported superlative/absolute claim: "${m[0]}"`,
      'Replace with a specific, substantiable statement, or remove — absolute marketing claims invite regulator/ASA action.');
  }
});
def('fake-reviews', 'legal', (files, add) => {
  for (const f of files) {
    if (!/\.(html|jsx|tsx|vue|svelte|md)$/.test(f)) continue;
    const t = read(f);
    const re = /(rated \d[\d.]* stars? by [\d,]+|[\d,]+ (happy|satisfied) customers|\d[\d.]*\/5 from [\d,]+ reviews)/gi;
    let m; while ((m = re.exec(t))) add('fake-reviews', 3, 'medium', f, lineOf(t, m.index),
      `review/social-proof claim to verify or remove: "${m[0]}"`,
      'Only show reviews you can evidence and attribute; fabricated reviews are unlawful in most jurisdictions (FTC/CMA).');
  }
});
def('hidden-fees', 'legal', (files, add) => {
  for (const f of files) {
    if (!/\.(html|jsx|tsx|vue|svelte|md)$/.test(f)) continue;
    const t = read(f);
    const re = /(mandatory|required|additional|onboarding|service|processing)\s+(fee|charge|surcharge)/gi;
    let m; while ((m = re.exec(t))) add('hidden-fees', 3, 'medium', f, lineOf(t, m.index),
      `possible drip-pricing / hidden fee: "${m[0]}"`,
      'Disclose all mandatory fees in the headline price; late-disclosed fees are a regulated dark pattern.');
  }
});

// ---- Phase 4: performance ----
def('uncompressed-json', 'perf', (files, add) => {
  for (const f of files) {
    if (extname(f) !== '.json') continue;
    if (/package(-lock)?\.json$|tsconfig|SEEDED-DEFECTS/.test(basename(f))) continue;
    let sz = 0; try { sz = statSync(f).size; } catch {}
    const t = read(f);
    const pretty = /\n\s{2,}"/.test(t);
    if (sz > 51200) add('uncompressed-json', 4, sz > 512000 ? 'high' : 'medium', f, 0,
      `${(sz / 1024).toFixed(0)} KB JSON shipped${pretty ? ', pretty-printed' : ''}`,
      'Minify, gzip/brotli at the edge, paginate or move server-side; do not ship large pretty-printed JSON to the client.');
  }
});
def('row-at-a-time-writes', 'perf', (files, add) => {
  for (const f of files) {
    if (!/\.(js|mjs|cjs|ts)$/.test(f)) continue;
    const t = read(f);
    const re = /for\s*\([^)]*\)\s*\{[^}]*\b(INSERT|UPDATE|await\s+[\w.]*\.(insert|create|save|query))\b/gi;
    let m; while ((m = re.exec(t))) add('row-at-a-time-writes', 4, 'medium', f, lineOf(t, m.index),
      'database write inside a loop (row-at-a-time)',
      'Batch the writes: a single multi-row insert / bulkCreate / transaction instead of one round-trip per row.');
  }
});

def('render-blocking', 'perf', (files, add) => {
  for (const f of files) {
    if (!/\.(html)$/.test(f)) continue;
    const t = read(f);
    const head = (/<head[\s\S]*?<\/head>/i.exec(t) || [''])[0];
    const re = /<script\b(?![^>]*\b(?:async|defer|type=["']module["']))[^>]*\bsrc=["'][^"']+["'][^>]*>/gi;
    let m; while ((m = re.exec(head))) add('render-blocking', 4, 'medium', f, lineOf(t, t.indexOf(m[0])),
      `render-blocking synchronous <script> in <head>: ${m[0].slice(0, 60)}`,
      'Add defer (or async for independent scripts), move to end of body, or use type="module" — a sync script in head blocks first paint.');
  }
});
def('large-image', 'perf', (files, add) => {
  for (const f of files) {
    if (!/\.(png|jpe?g|gif|bmp|tiff?)$/i.test(f)) continue;
    let sz = 0; try { sz = statSync(f).size; } catch {}
    if (sz > 512000) add('large-image', 4, sz > 1048576 ? 'high' : 'medium', f, 0,
      `${(sz / 1024).toFixed(0)} KB image (raster, not next-gen)`,
      'Compress and convert to AVIF/WebP, size to the rendered dimensions, and serve responsive srcset; a >500 KB hero is usually the LCP and payload bottleneck.');
  }
});
def('img-dimensions', 'perf', (files, add) => {
  for (const f of files) {
    if (!/\.(html)$/.test(f)) continue; // JSX omitting w/h is common and framework-handled; HTML is the reliable signal
    const t = read(f);
    const re = /<img\b[^>]*>/gi;
    let m; while ((m = re.exec(t))) {
      const tag = m[0];
      if (/\b(width|height)=/.test(tag) || /aspect-ratio/.test(tag)) continue;
      add('img-dimensions', 4, 'low', f, lineOf(t, m.index),
        `<img> without width/height or aspect-ratio: ${tag.slice(0, 60)}`,
        'Set explicit width/height (or aspect-ratio) so the browser reserves the box — this is the primary Cumulative Layout Shift fix.');
    }
  }
});

// ---- Phase 5: code quality ----
def('dead-code', 'cq', (files, add) => {
  for (const f of files) {
    if (!/\.(js|mjs|cjs|ts|tsx|jsx)$/.test(f)) continue;
    const t = read(f);
    const re = /if\s*\(\s*(false|0)\s*\)/g;
    let m; while ((m = re.exec(t))) add('dead-code', 5, 'low', f, lineOf(t, m.index),
      `unreachable block: ${m[0]}`, 'Remove dead code; version control is the archive.');
  }
});
def('duplicate-logic', 'cq', (files, add) => {
  // crude: identical non-trivial function bodies across files
  const bodies = new Map();
  for (const f of files) {
    if (!/\.(js|mjs|cjs|ts|tsx|jsx)$/.test(f)) continue;
    const t = read(f);
    // [^{}] keeps a body from swallowing across a short preceding function into the next one;
    // it means only brace-free (simple) function bodies are compared, which is the right scope for a crude finder.
    const re = /function\s+\w+\s*\([^)]*\)\s*\{([^{}]{40,400})\}/g;
    let m; while ((m = re.exec(t))) {
      const norm = m[1].replace(/\s+/g, ' ').trim();
      if (!bodies.has(norm)) bodies.set(norm, []);
      bodies.get(norm).push({ f, line: lineOf(t, m.index) });
    }
  }
  for (const [, locs] of bodies) if (locs.length > 1)
    add('duplicate-logic', 5, 'low', locs[1].f, locs[1].line,
      `logic duplicated from ${relative(process.cwd(), locs[0].f)}:${locs[0].line}`,
      'Extract the shared logic into one function and import it.');
});
def('unused-export', 'cq', (files, add) => {
  const jsFiles = files.filter((f) => /\.(js|mjs|cjs|ts|tsx|jsx)$/.test(f));
  const allText = jsFiles.map(read).join('\n');
  for (const f of jsFiles) {
    const t = read(f);
    const re = /export\s+function\s+(\w+)/g;
    let m; while ((m = re.exec(t))) {
      const name = m[1];
      const uses = (allText.match(new RegExp('\\b' + name + '\\b', 'g')) || []).length;
      if (uses <= 1) add('unused-export', 5, 'low', f, lineOf(t, m.index),
        `exported symbol referenced nowhere: ${name}`, 'Remove the unused export or wire it up.');
    }
  }
});
def('console-debug', 'cq', (files, add) => {
  for (const f of files) {
    if (!/\.(js|mjs|cjs|ts|tsx|jsx|vue|svelte)$/.test(f)) continue;
    if (/scan\.mjs|swarm\.mjs|make-fixture|\.test\.|\.spec\.|scripts\/seed/.test(f)) continue; // tooling/tests may log legitimately
    const t = stripComments(read(f));
    const re = /\bconsole\.(log|debug|trace)\s*\(|\bdebugger\b/g;
    let m; while ((m = re.exec(t))) add('console-debug', 5, 'low', f, lineOf(t, m.index),
      `debug statement left in source: ${m[0]}`,
      'Remove console.log/debugger from shipped code, or route through a leveled logger stripped in production builds.');
  }
});
def('todo-debt', 'cq', (files, add) => {
  for (const f of files) {
    if (!/\.(js|mjs|cjs|ts|tsx|jsx|vue|svelte|css|html|md)$/.test(f)) continue;
    if (/SEEDED-DEFECTS|make-fixture/.test(f)) continue;
    const t = read(f);
    const re = /\b(TODO|FIXME|XXX|HACK)\b/g;
    let m; while ((m = re.exec(t))) add('todo-debt', 5, 'low', f, lineOf(t, m.index),
      `unresolved debt marker: ${m[1]}`,
      'Resolve before launch, or move to the tracker with a link — a TODO in shipped code is invisible debt.');
  }
});
def('empty-catch', 'cq', (files, add) => {
  for (const f of files) {
    if (!/\.(js|mjs|cjs|ts|tsx|jsx|vue|svelte)$/.test(f)) continue;
    const t = stripComments(read(f));
    const re = /catch\s*(\([^)]*\))?\s*\{\s*\}/g;
    let m; while ((m = re.exec(t))) add('empty-catch', 5, 'medium', f, lineOf(t, m.index),
      'empty catch block silently swallows the error',
      'Handle, rethrow, or at minimum log the error — a swallowed exception hides the failure you will later have to debug blind.');
  }
});
def('focused-tests', 'cq', (files, add) => {
  for (const f of files) {
    if (!/\.(test|spec)\.(js|mjs|cjs|ts|tsx|jsx)$/.test(f) && !/(^|\/)(test|tests|__tests__)\//.test(f)) continue;
    if (!/\.(js|mjs|cjs|ts|tsx|jsx)$/.test(f)) continue;
    const t = stripComments(read(f));
    const re = /\b(describe|it|test|context)\.only\s*\(|\bf(describe|it|test)\s*\(|\b(describe|it|test|context)\.skip\s*\(|\bx(describe|it|test)\s*\(/g;
    let m; while ((m = re.exec(t))) add('focused-tests', 5, 'high', f, lineOf(t, m.index),
      `focused/skipped test silently narrows the suite: ${m[0]}`,
      'Remove .only/.skip (and fdescribe/xit) before commit — a stray .only makes the green suite run almost nothing, so the §1 baseline proves nothing.');
  }
});
def('type-escape', 'cq', (files, add) => {
  for (const f of files) {
    if (!/\.(ts|tsx)$/.test(f)) continue;
    const t = read(f);
    let m;
    const re1 = /@ts-(ignore|nocheck)\b/g;
    while ((m = re1.exec(t))) add('type-escape', 5, 'medium', f, lineOf(t, m.index),
      `type checker disabled: ${m[0]}`, 'Fix the underlying type error instead of suppressing it; @ts-nocheck disables checking for the whole file. Prefer @ts-expect-error with a comment if a suppression is truly unavoidable.');
    const re2 = /:\s*any\b|\bas\s+any\b/g;
    while ((m = re2.exec(t))) add('type-escape', 5, 'low', f, lineOf(t, m.index),
      '`any` escapes type safety: ' + m[0].trim(), 'Replace with a real type or `unknown` + a narrowing check; `any` silently turns off type checking wherever it flows.');
  }
});

// ── runner ────────────────────────────────────────────────────────────────────
function scan(target, only) {
  const files = walk(target);
  const findings = [];
  const add = (check, phase, severity, file, line, evidence, fix) =>
    findings.push({ check, phase, severity, file: file === '(project)' ? file : relative(target, file), line, evidence, fix });
  for (const c of CHECKS) {
    if (only && !only.includes(c.group)) continue;
    try { c.fn(files, add); } catch (e) { add(c.id, 0, 'low', '(scanner)', 0, `check errored: ${e.message}`, 'file a bug against scan.mjs'); }
  }
  findings.sort((a, b) => (SEV[a.severity] - SEV[b.severity]) || a.phase - b.phase || a.check.localeCompare(b.check));
  return findings;
}

function report(findings) {
  if (!findings.length) { console.log('✓ scan clean — no static findings. (Runtime checks via axe+Playwright still required.)'); return; }
  const bySev = {}; for (const f of findings) bySev[f.severity] = (bySev[f.severity] || 0) + 1;
  console.log(`\n${findings.length} findings — ` + Object.keys(SEV).filter((s) => bySev[s]).map((s) => `${bySev[s]} ${s}`).join(', ') + '\n');
  for (const f of findings) {
    console.log(`[${f.severity.toUpperCase()}] ${f.check}  (phase ${f.phase})`);
    console.log(`  ${f.file}${f.line ? ':' + f.line : ''}`);
    console.log(`  ${f.evidence}`);
    console.log(`  fix → ${f.fix}\n`);
  }
}

function selfTest() {
  const fixture = join(SKILL, 'tests', 'fixtures', 'vulnerable-site');
  if (!existsSync(fixture)) { console.error('self-test: fixture missing — run: node tests/make-fixture.mjs'); process.exit(2); }
  const truth = JSON.parse(read(join(fixture, 'SEEDED-DEFECTS.json')));
  const findings = scan(fixture, null);
  const caughtChecks = new Set(findings.map((f) => f.check));
  const missed = truth.defects.filter((d) => !caughtChecks.has(d.check));
  console.log(`self-test: ${truth.defects.length} seeded defects, ${caughtChecks.size} distinct checks fired, ${findings.length} findings total.`);
  if (missed.length) {
    console.error('\nMISSED — these seeded defects were not caught by their check:');
    for (const m of missed) console.error(`  ✗ ${m.id} (${m.check}) at ${m.where}`);
    process.exit(1);
  }
  console.log('✓ every seeded defect id was caught by its owning check.');
}

// ── CLI ────────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
if (argv.includes('--self-test')) { selfTest(); process.exit(0); }
const target = argv.find((a) => !a.startsWith('--'));
if (!target) { console.error('usage: node scan.mjs <target-dir> [--json] [--only sec,legal,a11y,perf,cq]'); process.exit(2); }
const onlyArg = argv[argv.indexOf('--only') + 1];
const only = argv.includes('--only') && onlyArg ? onlyArg.split(',') : null;
const findings = scan(target, only);
if (argv.includes('--json')) console.log(JSON.stringify({ target, findings }, null, 2));
else report(findings);
// exitCode, not process.exit(): exit() kills the process before a large
// --json write to a PIPE drains, truncating it at 64 KB (report.mjs reads this
// through execFileSync and then fails to parse it).
process.exitCode = findings.some((f) => f.severity === 'blocker' || f.severity === 'high') ? 1 : 0;
