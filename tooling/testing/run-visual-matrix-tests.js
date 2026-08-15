#!/usr/bin/env node
/**
 * Runs the ON-DEMAND true-visual component matrices (tests/live/matrix, one
 * directory per component) against the framework dev server on
 * http://localhost:5566.
 *
 * This tier is NOT part of `npm test`. It exists for the moments when the
 * question is "does the component still LOOK right in a real browser" — a
 * rendering change, a theme change, a CSS refactor — and it is asked for
 * explicitly with `npm run test:matrix:visual`.
 *
 * Engines:
 *   npm run test:matrix:visual                     # chromium only (default)
 *   npm run test:matrix:visual -- --all-engines    # chromium + firefox + webkit
 *   npm run test:matrix:visual -- --project=webkit # any explicit choice wins
 * Every other argument is passed straight through to Playwright, so
 * `-- --grep squish`, `--workers=2`, `--headed`, and `--ui` all work.
 *
 * Server lifecycle, matching tooling/testing/run-live-tests.js:
 *   - reuse the dev server if something is already listening on :5566
 *     (servers here bind [::1], so both stacks are probed);
 *   - otherwise start it, wait for the port, and stop its process tree on exit;
 *   - either way, require the fixture page itself to return 200 before running,
 *     because a listener is not a server and a wedged one fails as hundreds of
 *     unexplained `net::ERR_ABORTED` specs.
 * Storybook is never needed: this tier drives its own fixture pages under
 * tests/live/fixtures/<component>/.
 */
import { spawn } from 'child_process';
import net from 'net';

const PORT = 5566;
const HOST = '127.0.0.1';
const STARTUP_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 300;
/**
 * The readiness probe: the table fixture, this tier's largest page and the one
 * that exercises the most of the module graph. Every component's fixture is
 * served the same way, so if this one does not load, nothing below matters.
 */
const FIXTURE_PATH = '/tests/live/fixtures/table/matrix.html';
const FIXTURE_TIMEOUT_MS = 60_000;

/**
 * The managed server and its stopper live at module scope so EVERY exit path
 * can stop it — the signal handlers, the Playwright `exit` handler, and the
 * top-level `.catch` (a throw between spawning the server and spawning
 * Playwright would otherwise leak a detached vite).
 */
let managed = null;
const cleanup = () => {
  if (!managed) return;
  try { process.kill(-managed.pid, 'SIGTERM'); } catch {}
  managed = null;
};

function probePort(host, port, timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const done = (ok) => { if (!settled) { settled = true; socket.destroy(); resolve(ok); } };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

/** The dev server binds [::1]; a v4-only probe reports "down" on a live server. */
async function probeEither(port) {
  return (await probePort(HOST, port)) || (await probePort('::1', port));
}

async function waitForPort(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probeEither(port)) return true;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return false;
}

/**
 * A LISTENER IS NOT A SERVER. `probeEither` only proves something holds the
 * port — not that it serves this tier's fixture. A stale or wedged dev server
 * (this repo's vite config rebuilds components synchronously on source change,
 * which can block its event loop for minutes) answers the TCP connect and then
 * aborts every request, turning a wrong-server problem into a hundred
 * `net::ERR_ABORTED` test failures plus "N did not run" — a diagnosis that
 * costs an hour to reach from the Playwright output alone. So fetch the actual
 * fixture and require a 200 before handing the port to Playwright.
 *
 * Polls rather than asking once: a freshly spawned vite binds the port before
 * it can transform the fixture's module graph, and the first request is slow.
 */
async function waitForFixture(port, timeoutMs) {
  const url = `http://localhost:${port}${FIXTURE_PATH}`;
  const deadline = Date.now() + timeoutMs;
  let lastError = 'no response';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (response.ok) return { ok: true };
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error?.name === 'TimeoutError' ? 'request timed out' : (error?.message ?? String(error));
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return { ok: false, url, lastError };
}

async function main() {
  const passthrough = process.argv.slice(2);
  const allEngines = passthrough.includes('--all-engines');
  const forwarded = passthrough.filter((arg) => arg !== '--all-engines');
  const explicitProject = forwarded.some((arg) => arg.startsWith('--project'));

  // Chromium by default; --all-engines opens it up; an explicit --project wins
  // over both, so a targeted webkit run needs no extra flag.
  const projectArgs = explicitProject || allEngines ? [] : ['--project=chromium'];

  // Registered BEFORE anything is spawned, so a Ctrl-C during startup still
  // stops the server. `cleanup` only ever kills a server WE started; a
  // developer's own `npm run dev` must survive the run.
  process.on('SIGINT', () => { cleanup(); process.exit(130); });
  process.on('SIGTERM', () => { cleanup(); process.exit(143); });

  const reused = await probeEither(PORT);
  if (reused) {
    console.log(`✓ framework dev server already listening on :${PORT}, reusing it.`);
  } else {
    console.log(`✗ no listener on :${PORT} — spawning \`npm run dev:framework\``);
    managed = spawn('npm', ['run', 'dev:framework'], {
      stdio: ['ignore', 'inherit', 'inherit'],
      detached: true,
    });
    if (!(await waitForPort(PORT, STARTUP_TIMEOUT_MS))) {
      cleanup();
      console.error(`✗ framework dev server did not start within ${STARTUP_TIMEOUT_MS}ms`);
      process.exit(1);
    }
    console.log(`✓ framework dev server up on :${PORT}`);
  }

  // The port is held — but by something that serves this fixture?
  const fixture = await waitForFixture(PORT, FIXTURE_TIMEOUT_MS);
  if (!fixture.ok) {
    cleanup();
    console.error(`\n✗ :${PORT} is listening, but ${fixture.url} did not load (${fixture.lastError}).`);
    console.error(
      reused
        ? '  That port is held by a server this run reused rather than started.\n'
          + '  A wedged or unrelated server on :5566 is the usual cause — this repo\'s\n'
          + '  vite config rebuilds components synchronously on source change and can\n'
          + '  block for minutes. Stop it and re-run, and this script will start its own.'
        : '  The dev server this run started does not serve the fixture. Check that\n'
          + `  ${FIXTURE_PATH} exists and that \`npm run dev:framework\` still serves the repo root.`,
    );
    process.exit(1);
  }
  console.log(`✓ fixture ${FIXTURE_PATH} loads.`);

  const started = Date.now();
  const playwright = spawn('npx', [
    'playwright', 'test',
    '--config=tests/playwright.matrix.config.ts',
    ...projectArgs,
    ...forwarded,
  ], { stdio: 'inherit' });

  playwright.on('exit', (code) => {
    cleanup();
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`\nvisual matrix finished in ${seconds}s`
      + ` (${allEngines || explicitProject ? 'requested engines' : 'chromium'}).`);
    process.exit(code ?? 1);
  });
}

main().catch((err) => {
  cleanup();
  console.error(err);
  process.exit(1);
});
