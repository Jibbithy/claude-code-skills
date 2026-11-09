#!/usr/bin/env node
/*
 * report.mjs — the unified launch-readiness report (Phase 8).
 *
 * Aggregates the static scan (scripts/scan.mjs) and, if given, the Phase 6 swarm breach report
 * (scripts/swarm.mjs --report) into ONE go/no-go verdict on a single canonical severity scale. It is
 * the artifact you hand the user at the end of a run.
 *
 * The verdict is deliberately conservative: it reports LAUNCH-READY only when no Blocker or High
 * finding is open AND the coverage attestation confirms the authoritative runtime checks were run.
 * A clean automated scan is NOT launch-ready on its own — the runtime checks (axe, Lighthouse, the
 * manual items) and, where offensive testing was authorized, a clean swarm pass, must be attested.
 *
 * Usage:
 *   node report.mjs <target-dir>                        # scan only
 *   node report.mjs <target-dir> --swarm swarm.json     # merge a swarm breach report
 *   node report.mjs <target-dir> --json                 # machine-readable
 *   node report.mjs <target-dir> --attest axe,lighthouse,manual   # mark runtime checks as done
 *   node report.mjs --self-test
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// ── canonical severity scale — the ONE vocabulary the whole skill reports in ──
// scan.mjs emits blocker/high/medium/low; swarm.mjs emits critical/high/medium/low.
// Map both onto: Blocker > High > Medium > Low. (critical → Blocker.)
const CANON = { blocker: 'Blocker', critical: 'Blocker', high: 'High', medium: 'Medium', low: 'Low' };
const ORDER = { Blocker: 0, High: 1, Medium: 2, Low: 3 };
const PHASE_NAME = { 2: 'Security', 3: 'Legal/Trust/A11y', 4: 'Performance', 5: 'Code quality', 6: 'Pentest' };

function runScan(target) {
  // scan.mjs exits 1 when it finds Blocker/High — that is a signal, not a failure, and execFileSync
  // throws on non-zero exit, so read stdout off the thrown error too.
  let out;
  try { out = execFileSync('node', [join(HERE, 'scan.mjs'), target, '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
  catch (e) { out = e.stdout; if (!out) throw e; }
  return JSON.parse(out).findings.map((f) => ({
    source: 'scan', severity: CANON[f.severity] || 'Low', phase: PHASE_NAME[f.phase] || 'Other',
    check: f.check, where: `${f.file}${f.line ? ':' + f.line : ''}`, detail: f.evidence,
  }));
}
function loadSwarm(path) {
  if (!existsSync(path)) return [];
  const j = JSON.parse(readFileSync(path, 'utf8'));
  return (j.breaches || []).map((b) => ({
    source: 'swarm', severity: CANON[b.severity] || 'Low', phase: 'Pentest',
    check: b.vector, where: b.endpoint, detail: b.evidence,
  }));
}

// runtime checks that the automated tools can NOT stand in for — attested, not scanned
const RUNTIME = {
  axe: 'axe-core across every page template (authoritative WCAG 2.2 AA)',
  lighthouse: 'Lighthouse against a production build (Core Web Vitals)',
  manual: 'the hand-verified items (RLS non-owner probe, public buckets, DSAR path, licensing, dark-pattern review)',
  swarm: 'a clean Phase 6 swarm pass on the authorized target',
};

function build(target, findings, attested) {
  const counts = { Blocker: 0, High: 0, Medium: 0, Low: 0 };
  for (const f of findings) counts[f.severity]++;
  const byPhase = {};
  for (const f of findings) (byPhase[f.phase] ||= []).push(f);
  const missingAttest = Object.keys(RUNTIME).filter((k) => !attested.includes(k));
  const blockingOpen = counts.Blocker > 0 || counts.High > 0;
  let verdict, reason;
  if (blockingOpen) { verdict = 'NOT LAUNCH-READY'; reason = `${counts.Blocker} Blocker + ${counts.High} High finding(s) open — fix and re-scan.`; }
  else if (missingAttest.length) { verdict = 'NOT ATTESTED'; reason = `no Blocker/High findings, but the authoritative runtime checks were not attested: ${missingAttest.join(', ')}.`; }
  else { verdict = 'LAUNCH-READY'; reason = 'no Blocker/High findings and all runtime checks attested.'; }
  return { target, verdict, reason, counts, byPhase, attested, missingAttest };
}

function render(r) {
  const bar = '─'.repeat(60);
  console.log(`\n${bar}\nLAUNCH-READINESS REPORT — ${r.target}\n${bar}`);
  console.log(`\n  VERDICT: ${r.verdict}\n  ${r.reason}\n`);
  console.log(`  Findings on the canonical scale (Blocker > High > Medium > Low):`);
  console.log(`    Blocker ${r.counts.Blocker}   High ${r.counts.High}   Medium ${r.counts.Medium}   Low ${r.counts.Low}\n`);
  for (const phase of Object.keys(r.byPhase).sort()) {
    const fs = r.byPhase[phase].sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
    console.log(`  ${phase} (${fs.length}):`);
    for (const f of fs.slice(0, 12)) console.log(`    [${f.severity}] ${f.check} — ${f.where}`);
    if (fs.length > 12) console.log(`    … and ${fs.length - 12} more`);
    console.log('');
  }
  console.log('  Coverage attestation:');
  for (const k of Object.keys(RUNTIME)) console.log(`    [${r.attested.includes(k) ? 'x' : ' '}] ${RUNTIME[k]}`);
  console.log(`\n  Automated coverage only proves the automatable subset. ${r.missingAttest.length ? 'Unchecked items above are NOT verified.' : 'All runtime checks attested.'}\n${bar}\n`);
}

function selfTest() {
  const fixture = join(HERE, '..', 'tests', 'fixtures', 'vulnerable-site');
  if (!existsSync(fixture)) { console.error('self-test: fixture missing — run node tests/make-fixture.mjs'); process.exit(2); }
  const r = build(fixture, runScan(fixture), []);
  const okBlockers = r.counts.Blocker > 0;
  const okVerdict = r.verdict === 'NOT LAUNCH-READY';
  const okPhases = Object.keys(r.byPhase).length >= 4;
  console.log(`self-test: verdict=${r.verdict}, Blocker=${r.counts.Blocker}, High=${r.counts.High}, phases=${Object.keys(r.byPhase).length}`);
  if (okBlockers && okVerdict && okPhases) { console.log('✓ report correctly rates the vulnerable fixture NOT LAUNCH-READY with blockers across phases.'); process.exit(0); }
  console.error('✗ self-test failed'); process.exit(1);
}

// ── CLI ──
const argv = process.argv.slice(2);
if (argv.includes('--self-test')) selfTest();
const target = argv.find((a) => !a.startsWith('--'));
if (!target) { console.error('usage: node report.mjs <target-dir> [--swarm swarm.json] [--attest axe,lighthouse,manual,swarm] [--json]'); process.exit(2); }
const swarmPath = argv[argv.indexOf('--swarm') + 1];
const attested = argv.includes('--attest') ? (argv[argv.indexOf('--attest') + 1] || '').split(',').filter(Boolean) : [];
const findings = [...runScan(target), ...(argv.includes('--swarm') && swarmPath ? loadSwarm(swarmPath) : [])];
const report = build(target, findings, attested);
if (argv.includes('--json')) console.log(JSON.stringify({ ...report, findings }, null, 2));
else render(report);
process.exitCode = report.verdict === 'LAUNCH-READY' ? 0 : 1; // not exit(): see scan.mjs — exit() truncates piped --json
