#!/usr/bin/env node
/**
 * Runs Playwright tests in tests/live against http://localhost:5566.
 *
 * Lifecycle:
 *  - If the dev server is already listening on 5566, reuse it (don't kill on exit).
 *  - Otherwise, spawn `npm run dev`, wait for the port to come up, run tests,
 *    then kill the spawned process tree on exit (or signal).
 */
import { spawn } from 'child_process';
import net from 'net';

const PORT = 5566;
const HOST = '127.0.0.1';
const STARTUP_TIMEOUT_MS = 60_000;
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
  const alreadyUp = await probeEither(PORT);
  let serverChild = null;

  if (alreadyUp) {
    console.log(`✓ dev server already listening on :${PORT}, reusing it.`);
  } else {
    console.log(`✗ no listener on :${PORT} — spawning \`npm run dev:framework\``);
    serverChild = spawn('npm', ['run', 'dev:framework'], {
      stdio: ['ignore', 'inherit', 'inherit'],
      detached: true,
    });
    // Note: detached + own process group lets us kill the whole tree later.
    const ready = await waitForPort(PORT, STARTUP_TIMEOUT_MS);
    if (!ready) {
      console.error(`✗ dev server did not start within ${STARTUP_TIMEOUT_MS}ms`);
      try { process.kill(-serverChild.pid, 'SIGTERM'); } catch {}
      process.exit(1);
    }
    console.log(`✓ dev server up on :${PORT}`);
  }

  const cleanup = () => {
    if (!serverChild) return;
    try { process.kill(-serverChild.pid, 'SIGTERM'); } catch {}
    serverChild = null;
  };
  process.on('SIGINT', () => { cleanup(); process.exit(130); });
  process.on('SIGTERM', () => { cleanup(); process.exit(143); });

  const passthrough = process.argv.slice(2);
  const targeted = passthrough.includes('--targeted');
  const forwarded = passthrough.filter(arg => arg !== '--targeted');
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
