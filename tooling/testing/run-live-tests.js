#!/usr/bin/env node
/**
 * Runs Playwright tests in tests/live against http://localhost:5566 and,
 * when spreadsheet stories are in scope, Storybook on http://localhost:6006.
 *
 * Lifecycle:
 *  - Reuse any required server that is already listening.
 *  - Otherwise, start it, wait for its port, and stop its process tree on exit.
 */
import { spawn } from 'child_process';
import net from 'net';

const PORT = 5566;
const STORYBOOK_PORT = 6006;
const HOST = '127.0.0.1';
const STARTUP_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 300;

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

async function probeUrl(url, timeoutMs = 2_000) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForUrl(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probeUrl(url)) return true;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return false;
}

async function main() {
  const passthrough = process.argv.slice(2);
  const targeted = passthrough.includes('--targeted');
  const forwarded = passthrough.filter(arg => arg !== '--targeted');
  const requestedTargets = forwarded.filter(arg => !arg.startsWith('-'));
  const needsStorybook = !targeted || requestedTargets.length === 0 || requestedTargets.some(target =>
    target === 'tests/live'
      || target.startsWith('tests/live/components/spreadsheet')
      || target === 'tests/live/components/button/button-fieldset-storybook.spec.ts'
      || target === 'tests/live/components/button/button-storybook.spec.ts'
      || target === 'tests/live/components/checkbox/checkbox-storybook.spec.ts'
      || target === 'tests/live/components/date-picker/date-picker-storybook.spec.ts'
      || target === 'tests/live/components/date-picker/date-family-label-storybook.spec.ts'
      || target === 'tests/live/components/date-range-picker/date-range-picker-storybook.spec.ts'
      || target === 'tests/live/components/date-time-picker/date-time-picker-storybook.spec.ts'
      || target === 'tests/live/components/key-value/key-value-storybook.spec.ts'
      || target === 'tests/live/components/time-picker/time-picker-storybook.spec.ts'
      || target === 'tests/live/components/time-picker/time-color-label-storybook.spec.ts'
      || target === 'tests/live/components/radio/radio-storybook.spec.ts'
      || target === 'tests/live/components/select/select-label-storybook.spec.ts'
      || target === 'tests/live/components/slider/slider-form-storybook.spec.ts'
      || target === 'tests/live/components/location/location-storybook.spec.ts'
  );
  const managedChildren = [];

  const ensureServer = async ({ port, label, command, args, readyUrl }) => {
    if (await probeEither(port)) {
      const ready = !readyUrl || await waitForUrl(readyUrl, STARTUP_TIMEOUT_MS);
      if (!ready) throw new Error(`${label} did not become HTTP-ready within ${STARTUP_TIMEOUT_MS}ms`);
      console.log(`✓ ${label} already listening on :${port}, reusing it.`);
      return;
    }

    console.log(`✗ no listener on :${port} — spawning \`${command} ${args.join(' ')}\``);
    const child = spawn(command, args, {
      stdio: ['ignore', 'inherit', 'inherit'],
      detached: true,
    });
    managedChildren.push(child);

    const ready = await waitForPort(port, STARTUP_TIMEOUT_MS);
    if (!ready) {
      console.error(`✗ ${label} did not start within ${STARTUP_TIMEOUT_MS}ms`);
      throw new Error(`${label} startup timed out`);
    }
    if (readyUrl && !(await waitForUrl(readyUrl, STARTUP_TIMEOUT_MS))) {
      throw new Error(`${label} did not become HTTP-ready within ${STARTUP_TIMEOUT_MS}ms`);
    }
    console.log(`✓ ${label} up on :${port}`);
  };

  const frameworkServer = {
    port: PORT,
    label: 'framework dev server',
    command: 'npm',
    args: ['run', 'dev:framework'],
  };
  await ensureServer(frameworkServer);
  startWatchdog(frameworkServer);
  if (needsStorybook) {
    await ensureServer({
      port: STORYBOOK_PORT,
      label: 'Storybook',
      command: 'npm',
      args: ['run', 'dev:storybook'],
      readyUrl: `http://${HOST}:${STORYBOOK_PORT}/iframe.html`,
    });
  }

  // Watchdog: the dev server has been observed dying silently under
  // sustained multi-engine load. Probe the port and respawn on failure so a
  // server blip costs a retry, not the remainder of the suite.
  const watchdogs = [];
  const startWatchdog = (opts) => {
    let respawning = false;
    const timer = setInterval(async () => {
      if (respawning) return;
      if (!(await probeEither(opts.port))) {
        respawning = true;
        console.error(`✗ ${opts.label} stopped answering on :${opts.port} — respawning`);
        try { await ensureServer(opts); }
        catch (error) { console.error(`✗ ${opts.label} respawn failed: ${error}`); }
        finally { respawning = false; }
      }
    }, 5000);
    timer.unref?.();
    watchdogs.push(timer);
  };

  const cleanup = () => {
    for (const timer of watchdogs.splice(0)) clearInterval(timer);
    for (const child of managedChildren.splice(0)) {
      try { process.kill(-child.pid, 'SIGTERM'); } catch {}
    }
  };
  process.on('SIGINT', () => { cleanup(); process.exit(130); });
  process.on('SIGTERM', () => { cleanup(); process.exit(143); });

  const targets = targeted ? [] : ['tests/live'];
  const args = [
    'playwright',
    'test',
    ...targets,
    '--config=tests/playwright.config.ts',
    '--output=test-results/framework',
    ...forwarded
  ];
  const playwright = spawn('npx', args, { stdio: 'inherit' });

  playwright.on('exit', (code) => {
    cleanup();
    process.exit(code ?? 1);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
