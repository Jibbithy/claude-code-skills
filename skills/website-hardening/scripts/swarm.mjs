#!/usr/bin/env node
/*
 * swarm.mjs — Phase 6 adversarial probe swarm (the safe, automatable subset).
 *
 * AUTHORIZED PENTESTING OF A SITE THE USER OWNS. The gate is enforced here in code, not just in
 * prose: this script REFUSES to run without --owned-confirmed, and REFUSES a non-local/non-staging
 * target without --prod-approved. See references/attack-catalog.md for the full gate and the reasons.
 *
 * It runs benign, non-destructive HTTP probes concurrently and logs ONLY successful breaches, in the
 * breach-report schema. It deliberately covers only the families that can be PROVEN with a safe
 * request — misconfiguration, exposure, headers, CORS, open redirect, methods, cookie flags, and a
 * gentle rate-limit check. On exit it prints which catalog families it did and did NOT attempt, so a
 * clean run is never mistaken for full coverage. Injection / stored-XSS / auth-flow / business-logic
 * vectors need the agent's judgment (catalog) or the STRIX heavy tier.
 *
 * Usage:
 *   node swarm.mjs --target http://localhost:8080 --owned-confirmed [--report out.json]
 *   node swarm.mjs --target https://mysite.com --owned-confirmed --prod-approved
 *   node swarm.mjs --self-test        # stands up a misconfigured local server and asserts probes catch it
 *
 * No external dependencies. Node >= 18 (global fetch, AbortSignal.timeout).
 */
import http from 'node:http';
import https from 'node:https';
import { writeFileSync } from 'node:fs';

// ── args ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const val = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };

// ── the gate, enforced ──────────────────────────────────────────────────────────
function isStagingOrLocal(u) {
  try {
    const h = new URL(u).hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h.endsWith('.localhost')
      || h.endsWith('.internal') || h.endsWith('.local') || /(^|\.)staging\./.test(h) || /(^|\.)test\./.test(h)
      || /\.vercel\.app$|\.netlify\.app$|\.pages\.dev$/.test(h);
  } catch { return false; }
}
function gate(target, { owned, prodApproved }) {
  if (!owned) return 'REFUSED: --owned-confirmed is required. Only run against a site the user OWNS or has WRITTEN permission to test, confirmed in this session. See references/attack-catalog.md.';
  if (!target) return 'REFUSED: --target is required.';
  if (!isStagingOrLocal(target) && !prodApproved) return `REFUSED: ${target} is not local/staging. Attacking production needs a separate explicit --prod-approved. Stand up a staging/local copy instead.`;
  return null;
}

// ── probe helpers ────────────────────────────────────────────────────────────────
const TIMEOUT = 8000;
async function req(url, opts = {}) {
  try {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT), ...opts });
    const text = await res.text().catch(() => '');
    return { status: res.status, headers: res.headers, text };
  } catch (e) { return { error: String(e.message || e) }; }
}
const breach = (vector, endpoint, payload, evidence, severity, reproduction, cwe) =>
  ({ vector, endpoint, payload, evidence, severity, reproduction: [].concat(reproduction), cwe });
const SEV = { critical: 0, high: 1, medium: 2, low: 3 };            // one severity order for the whole file
const setCookies = (r) => r.headers.getSetCookie ? r.headers.getSetCookie() : (r.headers.get('set-cookie') ? [r.headers.get('set-cookie')] : []);
// Raw request for methods fetch() forbids (TRACE/TRACK/CONNECT are "forbidden methods" in the spec).
function rawReq(url, method) {
  return new Promise((resolve) => {
    let u; try { u = new URL(url); } catch { return resolve({ error: 'bad url' }); }
    const mod = u.protocol === 'https:' ? https : http;
    const r = mod.request(u, { method, timeout: TIMEOUT }, (res) => {
      let body = ''; res.on('data', (d) => { body += d; if (body.length > 65536) res.destroy(); });
      res.on('end', () => resolve({ status: res.statusCode, headers: new Map(Object.entries(res.headers)), text: body }));
    });
    r.on('error', (e) => resolve({ error: String(e.message) }));
    r.on('timeout', () => { r.destroy(); resolve({ error: 'timeout' }); });
    r.end();
  });
}

// ── probes: each returns a breach or null. Family tag drives the coverage note. ──
const PROBES = [];
const probe = (family, fn) => PROBES.push({ family, fn });

probe('H: security headers', async (base) => {
  const r = await req(base);
  if (r.error) return null;
  const need = { 'content-security-policy': 'CSP', 'strict-transport-security': 'HSTS', 'x-frame-options': 'X-Frame-Options', 'x-content-type-options': 'X-Content-Type-Options' };
  const missing = Object.entries(need).filter(([h]) => !r.headers.get(h)).map(([, l]) => l);
  if (missing.length) return breach('87 missing security headers', `GET ${base}`, '(none)',
    `response missing: ${missing.join(', ')}`, missing.includes('CSP') ? 'high' : 'medium',
    `curl -sI ${base}`, 'CWE-693');
  return null;
});

probe('H: clickjacking', async (base) => {
  const r = await req(base);
  if (r.error) return null;
  const xfo = r.headers.get('x-frame-options');
  const csp = r.headers.get('content-security-policy') || '';
  if (!xfo && !/frame-ancestors/i.test(csp)) return breach('88 clickjacking', `GET ${base}`, '(none)',
    'no X-Frame-Options and no CSP frame-ancestors — page is framable', 'medium', `curl -sI ${base}`, 'CWE-1021');
  return null;
});

probe('G: dotfile / backup exposure', async (base) => {
  const paths = ['/.env', '/.git/config', '/.git/HEAD', '/config.json', '/backup.sql', '/.DS_Store', '/wp-config.php.bak'];
  for (const p of paths) {
    const url = new URL(p, base).href;
    const r = await req(url);
    if (r.error) continue;
    if (r.status === 200 && r.text && !/<!doctype html>/i.test(r.text.slice(0, 200))) {
      return breach('77 .git/.env/backup exposure', `GET ${url}`, '(none)',
        `${p} returned 200 with ${r.text.length} bytes of non-HTML content`, 'critical', `curl -s ${url}`, 'CWE-538');
    }
  }
  return null;
});

probe('G: directory listing', async (base) => {
  for (const p of ['/files/', '/uploads/', '/assets/', '/']) {
    const url = new URL(p, base).href;
    const r = await req(url);
    if (r.error) continue;
    if (r.status === 200 && /<title>Index of|Directory listing for|\[To Parent Directory\]/i.test(r.text)) {
      return breach('76 directory listing enabled', `GET ${url}`, '(none)',
        'server returned an auto-generated index listing', 'medium', `curl -s ${url}`, 'CWE-548');
    }
  }
  return null;
});

probe('H: CORS misconfiguration', async (base) => {
  const evil = 'https://evil.example';
  const targets = ['/api/account', '/api/user', '/api/me', '/'];
  for (const p of targets) {
    const url = new URL(p, base).href;
    const r = await req(url, { headers: { Origin: evil } });
    if (r.error) continue;
    const acao = r.headers.get('access-control-allow-origin');
    const acac = r.headers.get('access-control-allow-credentials');
    if (acao === evil && String(acac).toLowerCase() === 'true')
      return breach('86 CORS misconfig (reflected origin with credentials)', `GET ${url}`, `Origin: ${evil}`,
        `ACAO reflected ${evil} with Allow-Credentials: true`, 'high', `curl -s -H 'Origin: ${evil}' -i ${url} | grep -i access-control`, 'CWE-942');
    if (acao === '*' && String(acac).toLowerCase() === 'true')
      return breach('86 CORS misconfig (wildcard with credentials)', `GET ${url}`, `Origin: ${evil}`,
        'ACAO * with Allow-Credentials: true', 'high', `curl -s -H 'Origin: ${evil}' -i ${url} | grep -i access-control`, 'CWE-942');
  }
  return null;
});

probe('H: open redirect', async (base) => {
  const evil = 'https://evil.example/';
  const params = ['url', 'redirect', 'next', 'return', 'returnUrl', 'dest', 'continue'];
  for (const param of params) {
    const url = new URL('/', base);
    url.searchParams.set(param, evil);
    const r = await req(url.href);
    if (r.error) continue;
    const loc = r.headers.get('location');
    if (r.status >= 300 && r.status < 400 && loc && /evil\.example/.test(loc))
      return breach('90 open redirect', `GET ${url.href}`, `${param}=${evil}`,
        `redirected to attacker URL: Location: ${loc}`, 'medium', `curl -sI '${url.href}'`, 'CWE-601');
  }
  return null;
});

probe('H: dangerous HTTP methods', async (base) => {
  for (const method of ['TRACE', 'TRACK']) {
    const r = await rawReq(base, method); // fetch() forbids TRACE/TRACK — use the raw client
    if (r.error) continue;
    const ct = (r.headers.get && r.headers.get('content-type')) || '';
    if (r.status === 200 && (method === 'TRACE' ? /message\/http/i.test(ct) || /TRACE\s+\//i.test(r.text) : true))
      return breach('91 HTTP methods misconfig', `${method} ${base}`, '(none)',
        `${method} answered 200 (cross-site tracing / method exposure)`, 'low', `curl -s -X ${method} -i ${base}`, 'CWE-16');
  }
  return null;
});

probe('G: insecure cookie flags', async (base) => {
  const r = await req(base);
  if (r.error) return null;
  const setC = setCookies(r);
  for (const c of setC) {
    const name = c.split('=')[0];
    const missing = [];
    if (!/;\s*httponly/i.test(c)) missing.push('HttpOnly');
    if (!/;\s*secure/i.test(c) && new URL(base).protocol === 'https:') missing.push('Secure');
    if (!/;\s*samesite/i.test(c)) missing.push('SameSite');
    if (missing.length) return breach('82/56 insecure cookie flags', `GET ${base}`, '(none)',
      `Set-Cookie ${name} missing: ${missing.join(', ')}`, missing.includes('HttpOnly') ? 'medium' : 'low', `curl -sI ${base} | grep -i set-cookie`, 'CWE-1004');
  }
  return null;
});

probe('G: verbose errors', async (base) => {
  const url = new URL('/nonexistent-' + 'x'.repeat(8) + "?q='\"<>", base).href;
  const r = await req(url);
  if (r.error) return null;
  if (/(stack trace|at Object\.<anonymous>|Traceback \(most recent call last\)|SQLSTATE|ORA-\d|You have an error in your SQL|Warning: |Fatal error:|node_modules\/)/i.test(r.text))
    return breach('78 verbose error / stack trace', `GET ${url}`, "malformed path with q='\"<>",
      'error response leaked a stack trace or server internals', 'low', `curl -s '${url}'`, 'CWE-209');
  return null;
});

probe('B: reflected parameter (XSS surface)', async (base) => {
  // benign, inert marker — we only check whether it comes back UNENCODED, never execute anything
  const marker = 'wbprobe7391<b>x</b>';
  for (const p of ['q', 'search', 's', 'query', 'name']) {
    const url = new URL('/', base); url.searchParams.set(p, marker);
    const r = await req(url.href);
    if (r.error) continue;
    if (r.text && r.text.includes(marker)) return breach('21 reflected input (potential XSS)', `GET ${url.href}`, `${p}=${marker}`,
      'the raw parameter, including < and >, was reflected UNENCODED in the response body', 'high',
      `curl -s '${url.href}' | grep -o '${marker}'`, 'CWE-79');
  }
  return null;
});

probe('G: server/version disclosure', async (base) => {
  const r = await req(base);
  if (r.error) return null;
  const found = [];
  for (const h of ['server', 'x-powered-by', 'x-aspnet-version', 'x-generator']) {
    const v = r.headers.get(h);
    if (v && (/\d/.test(v) || h === 'x-powered-by')) found.push(`${h}: ${v}`); // a version number, or any x-powered-by, is the disclosure
  }
  if (found.length) return breach('78 server/version disclosure', `GET ${base}`, '(none)',
    `stack/version leaked in headers — ${found.join('; ')}`, 'low', `curl -sI ${base} | grep -iE 'server|x-powered-by'`, 'CWE-200');
  return null;
});

probe('H: admin / sensitive path reachable', async (base) => {
  for (const p of ['/admin', '/administrator', '/wp-admin/', '/phpinfo.php', '/server-status', '/actuator', '/.git/', '/debug']) {
    const url = new URL(p, base).href;
    const r = await req(url);
    if (r.error) continue;
    if (r.status === 200) return breach('92/34 admin or debug surface exposed', `GET ${url}`, '(none)',
      `${p} answered 200 — sensitive/admin surface reachable unauthenticated`, 'high', `curl -s -o /dev/null -w '%{http_code}' ${url}`, 'CWE-425');
  }
  return null;
});

probe('G: sensitive response cacheable', async (base) => {
  const r = await req(base);
  if (r.error) return null;
  const setC = setCookies(r);
  const cc = (r.headers.get('cache-control') || '').toLowerCase();
  if (setC.length && !/no-store|private/.test(cc)) return breach('83 sensitive response cacheable', `GET ${base}`, '(none)',
    `response sets a cookie but Cache-Control is "${cc || '(unset)'}" — a shared cache may store a per-user response`, 'medium',
    `curl -sI ${base} | grep -iE 'set-cookie|cache-control'`, 'CWE-525');
  return null;
});

probe('F: missing rate limit', async (base) => {
  // gentle: 20 sequential requests; if none is throttled (429/503) it is unthrottled. Non-destructive.
  const url = new URL('/', base).href;
  let throttled = false, ok = 0;
  for (let i = 0; i < 20; i++) {
    const r = await req(url);
    if (r.error) return null;
    if (r.status === 429 || r.status === 503) { throttled = true; break; }
    if (r.status < 500) ok++;
  }
  if (!throttled && ok >= 20) return breach('65 no rate limiting', `GET ${url} ×20`, '20 rapid requests',
    'no 429/503 after 20 rapid requests — no visible rate limiting', 'medium', `for i in $(seq 20); do curl -s -o /dev/null -w '%{http_code}\\n' ${url}; done`, 'CWE-770');
  return null;
});

// families the swarm does NOT automate — printed so a clean run is not read as full coverage
const NOT_ATTEMPTED = [
  'A. Injection (SQLi, NoSQL, command, SSTI, XXE, GraphQL) — agent/STRIX with judgment',
  'B. XSS (reflected/stored/DOM/mXSS/upload) — needs payload confirmation, agent/STRIX',
  'C. Access control (IDOR/BOLA/BFLA/privilege) — needs authenticated multi-user session',
  'D. Auth & session flows (JWT, OAuth, reset, MFA) — agent/STRIX',
  'E. SSRF / DNS rebinding — needs OOB infrastructure',
  'I. File-upload exploits — needs an upload endpoint and payloads',
  'K. Business logic (race, price tampering, step-skip) — needs app-specific modeling',
];

// ── runner ────────────────────────────────────────────────────────────────────
async function run(base) {
  const results = await Promise.all(PROBES.map(async (p) => {
    try { return { family: p.family, breach: await p.fn(base) }; }
    catch (e) { return { family: p.family, error: String(e.message || e) }; }
  }));
  const breaches = results.filter((r) => r.breach).map((r) => r.breach);
  breaches.sort((a, b) => SEV[a.severity] - SEV[b.severity]);
  return { breaches, attempted: PROBES.map((p) => p.family) };
}

// ── self-test: stand up a deliberately-misconfigured server, assert probes fire ──
function vulnerableServer() {
  return http.createServer((req_, res) => {
    const u = new URL(req_.url, 'http://localhost');
    // open redirect
    if (u.pathname === '/' && u.searchParams.get('url')) { res.writeHead(302, { Location: u.searchParams.get('url') }); return res.end(); }
    // dotfile exposure
    if (u.pathname === '/.env') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('SECRET_KEY=abc123\nDATABASE_URL=postgres://u:p@h/db'); }
    // directory listing
    if (u.pathname === '/files/') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<title>Index of /files/</title><a href="a.txt">a.txt</a>'); }
    // admin surface reachable
    if (u.pathname === '/admin') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<h1>Admin</h1>'); }
    // verbose error
    if (/nonexistent/.test(u.pathname)) { res.writeHead(500, { 'content-type': 'text/plain' }); return res.end('Error: boom\n    at Object.<anonymous> (/app/node_modules/x.js:1:1)'); }
    // CORS reflection with creds + version disclosure + cookie with no flags, no cache-control
    const origin = req_.headers.origin;
    const h = { 'content-type': 'text/html', 'set-cookie': 'sid=xyz', 'server': 'nginx/1.18.0', 'x-powered-by': 'Express' };
    if (origin) { h['access-control-allow-origin'] = origin; h['access-control-allow-credentials'] = 'true'; }
    // no security headers, answers TRACE, no rate limit
    if (req_.method === 'TRACE') { res.writeHead(200, { 'content-type': 'message/http' }); return res.end('TRACE / HTTP/1.1'); }
    // reflected parameter (unencoded) — the XSS surface probe
    const q = u.searchParams.get('q');
    if (q) { res.writeHead(200, h); return res.end('<!doctype html><html><body>results for ' + q + '</body></html>'); }
    res.writeHead(200, h); res.end('<!doctype html><html><body>ok</body></html>');
  });
}

async function selfTest() {
  const server = vulnerableServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const { breaches, attempted } = await run(base);
  server.close();
  // expect at least these vector numbers to fire against the vulnerable server
  const expect = { '87': 'security headers', '88': 'clickjacking', '77': 'dotfile', '76': 'dir listing', '86': 'CORS', '90': 'open redirect', '91': 'TRACE', '82/56': 'cookie flags', '78': 'verbose error/version', '65': 'rate limit', '21': 'reflected param', '92/34': 'admin path', '83': 'cacheable cookie response' };
  const fired = new Set(breaches.map((b) => b.vector.split(' ')[0]));
  const missed = Object.entries(expect).filter(([k]) => !fired.has(k));
  console.log(`self-test: ${attempted.length} probe families run, ${breaches.length} breaches found against the vulnerable server.`);
  for (const b of breaches) console.log(`  ✓ [${b.severity}] ${b.vector}`);
  if (missed.length) { console.error('\nMISSED expected breaches:'); for (const [k, l] of missed) console.error(`  ✗ ${k} (${l})`); process.exit(1); }
  console.log('✓ every expected breach was detected.');
  process.exit(0);
}

// ── CLI ──────────────────────────────────────────────────────────────────────
if (flag('--self-test')) { await selfTest(); }
const target = val('--target');
const refusal = gate(target, { owned: flag('--owned-confirmed'), prodApproved: flag('--prod-approved') });
if (refusal) { console.error(refusal); process.exit(2); }

console.error(`swarm: target ${target} — running ${PROBES.length} safe probe families concurrently…`);
const { breaches, attempted } = await run(target);
const out = {
  target, when: new Date().toISOString(), breaches,
  coverage: { attempted, not_attempted: NOT_ATTEMPTED },
};
const reportPath = val('--report');
if (reportPath) { writeFileSync(reportPath, JSON.stringify(out, null, 2)); console.error(`report written to ${reportPath}`); }
else console.log(JSON.stringify(out, null, 2));

console.error(`\n${breaches.length} breach(es) found. Families attempted: ${attempted.length}.`);
console.error('NOT attempted by this swarm (need agent judgment or STRIX):');
for (const n of NOT_ATTEMPTED) console.error('  · ' + n);
console.error('\nA clean run here does NOT mean the site is secure — only that the automatable probes found nothing.');
process.exitCode = breaches.some((b) => b.severity === 'critical' || b.severity === 'high') ? 1 : 0; // not exit(): see scan.mjs
