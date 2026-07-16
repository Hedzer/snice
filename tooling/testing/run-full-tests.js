#!/usr/bin/env node
/**
 * Runs the complete release-grade test matrix without preparing the same
 * artifact more than once.
 *
 * The coverage run is also the source-suite run: it executes the same Vitest
 * files against source while collecting the core-engine coverage gate. The
 * built suite still runs separately against a freshly generated testing
 * bundle. Once every artifact is prepared, the independent validation gates
 * run concurrently to keep the aggregate command close to the historical
 * source+built wall time.
 */
import { spawn } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const cpuCount = availableParallelism();
const vitestWorkers = Number.parseInt(
  process.env.SNICE_FULL_TEST_WORKERS || String(Math.max(2, Math.floor(cpuCount / 4))),
  10
);
// Browser journeys share the machine with four artifact/unit gates in this
// command. Keep their failure ceiling high enough for temporary CPU pressure;
// this does not affect the duration of healthy runs.
const browserTimeout = '--timeout=120000';
const active = new Set();
const startedAt = performance.now();
let stopping = false;
let snapshotDir = null;

function elapsed(start) {
  return `${((performance.now() - start) / 1000).toFixed(2)}s`;
}

function stopChildren() {
  if (stopping) return;
  stopping = true;
  for (const child of active) {
    try {
      if (process.platform === 'win32') child.kill('SIGTERM');
      else process.kill(-child.pid, 'SIGTERM');
    } catch {}
  }
}

function removeSnapshot() {
  if (!snapshotDir) return;
  rmSync(snapshotDir, { recursive: true, force: true });
  snapshotDir = null;
}

function run(label, command, args, options = {}) {
  const start = performance.now();
  console.log(`\n[full] ▶ ${label}`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...options.env },
      stdio: 'inherit',
      detached: process.platform !== 'win32'
    });
    active.add(child);

    child.once('error', error => {
      active.delete(child);
      reject(new Error(`${label} could not start: ${error.message}`));
    });
    child.once('exit', (code, signal) => {
      active.delete(child);
      if (code === 0) {
        console.log(`[full] ✓ ${label} (${elapsed(start)})`);
        resolve();
        return;
      }
      reject(new Error(`${label} failed (${signal || `exit ${code}`}) after ${elapsed(start)}`));
    });
  });
}

function npmRun(label, script, args = [], options = {}) {
  const forwarded = args.length ? ['--', ...args] : [];
  return run(label, npm, ['run', script, ...forwarded], options);
}

function vitestWorkerArgs() {
  return [`--maxWorkers=${vitestWorkers}`, '--minWorkers=1'];
}

process.on('SIGINT', () => {
  stopChildren();
  removeSnapshot();
  process.exit(130);
});
process.on('SIGTERM', () => {
  stopChildren();
  removeSnapshot();
  process.exit(143);
});

try {
  console.log(`[full] ${cpuCount} logical CPUs; ${vitestWorkers} workers per full Vitest run.`);

  // Distribution is the root dependency for CDN, React, and browser artifacts.
  await npmRun('distribution build', 'build:distribution');

  // These write to separate outputs and can be prepared safely in parallel.
  await Promise.all([
    npmRun('built-test bundle', 'build:testing'),
    npmRun('CDN bundles', 'build:cdn'),
    npmRun('React adapters', 'build:react')
  ]);

  // Generate the public and deploy sites once, after the CDN files are final.
  await npmRun('website', 'build:website');
  await run('deploy artifact', process.execPath, ['tooling/website/build-deploy.js']);

  // Some unit tests intentionally exercise the website builders. Give the
  // concurrent browser gates immutable copies so those tests cannot reload a
  // Vite page or briefly remove a file being served by the static-site gate.
  const debugDir = join(process.cwd(), '.debug');
  mkdirSync(debugDir, { recursive: true });
  snapshotDir = mkdtempSync(join(debugDir, 'full-tests-'));
  const publicSnapshot = join(snapshotDir, 'public');
  const siteSnapshot = join(snapshotDir, 'site');
  cpSync(join(process.cwd(), 'website', 'public'), publicSnapshot, { recursive: true });
  cpSync(join(process.cwd(), 'dist', 'site'), siteSnapshot, { recursive: true });

  // Every gate below is read-only with respect to the artifacts it validates.
  // Vite ignores coverage report output, so HTML report generation cannot
  // reload Playwright pages while these independent gates run concurrently.
  await Promise.all([
    npmRun('source suite + core coverage', 'test:coverage:core', vitestWorkerArgs()),
    npmRun('built suite', 'test:distribution:prepared', vitestWorkerArgs()),
    npmRun('CDN artifact + runtime suites', 'test:cdn:prepared'),
    npmRun('React adapter suite', 'test:react:prepared', vitestWorkerArgs()),
    npmRun('framework browser suite', 'test:browser:framework:prepared', [browserTimeout], {
      env: { SNICE_TEST_PUBLIC_DIR: publicSnapshot }
    }),
    npmRun('website browser suite', 'test:browser:website:prepared', [browserTimeout], {
      env: { SNICE_TEST_SITE_DIR: siteSnapshot }
    })
  ]);

  removeSnapshot();
  console.log(`\n[full] All gates passed in ${elapsed(startedAt)}.`);
} catch (error) {
  stopChildren();
  removeSnapshot();
  console.error(`\n[full] ${error.message}`);
  process.exitCode = 1;
}
