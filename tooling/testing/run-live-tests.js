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

async function main() {
  const passthrough = process.argv.slice(2);
  const targeted = passthrough.includes('--targeted');
  const forwarded = passthrough.filter(arg => arg !== '--targeted');
  const requestedTargets = forwarded.filter(arg => !arg.startsWith('-'));
  const needsStorybook = !targeted || requestedTargets.length === 0 || requestedTargets.some(target =>
    target === 'tests/live'
      || target.startsWith('tests/live/components/spreadsheet')
      || target === 'tests/live/components/button/button-storybook.spec.ts'
      || target === 'tests/live/components/checkbox/checkbox-storybook.spec.ts'
      || target === 'tests/live/components/date-picker/date-picker-storybook.spec.ts'
      || target === 'tests/live/components/date-range-picker/date-range-picker-storybook.spec.ts'
      || target === 'tests/live/components/radio/radio-storybook.spec.ts'
      || target === 'tests/live/components/location/location-storybook.spec.ts'
  );
  const managedChildren = [];

  const ensureServer = async ({ port, label, command, args }) => {
    if (await probeEither(port)) {
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
    console.log(`✓ ${label} up on :${port}`);
  };

  await ensureServer({
    port: PORT,
    label: 'framework dev server',
    command: 'npm',
    args: ['run', 'dev:framework'],
  });
  if (needsStorybook) {
    await ensureServer({
      port: STORYBOOK_PORT,
      label: 'Storybook',
      command: 'npm',
      args: ['run', 'dev:storybook'],
    });
  }

  const cleanup = () => {
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
