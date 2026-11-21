// CI audit gate: fails on a high or critical advisory, except the ones listed in ALLOWED while no fix exists.
import { execSync } from 'node:child_process';

/** GHSA ids accepted for now, each with why; remove an id as soon as a patched version ships. */
const ALLOWED = {
  'GHSA-fc5q-39xc-vjpf': 'picomatch ReDoS inside the Expo toolchain; no patched release yet (checked 2026-11-19)',
};
const BLOCKING = new Set(['high', 'critical']);

const args = process.argv.slice(2).join(' ');
let report;
try {
  report = execSync(`npm audit --json ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} catch (error) {
  // npm audit exits non-zero whenever it finds anything; the JSON is still on stdout.
  report = error.stdout;
}

const advisories = new Map();
for (const vuln of Object.values(JSON.parse(report).vulnerabilities ?? {})) {
  for (const via of vuln.via) {
    if (typeof via === 'object' && BLOCKING.has(via.severity)) advisories.set(via.url.split('/').pop(), via);
  }
}

const blocking = [...advisories].filter(([id]) => !ALLOWED[id]);
for (const [id] of advisories) if (ALLOWED[id]) console.log(`allowed ${id}: ${ALLOWED[id]}`);
for (const [id, via] of blocking) console.error(`BLOCKING ${id} ${via.severity} ${via.name}: ${via.title}`);
process.exit(blocking.length ? 1 : 0);
