#!/usr/bin/env node
/** Run the generated public website browser gates on a managed local server. */
import { spawn } from 'child_process';
import net from 'net';

// Do not use the Vite development ports (52891/5566): components.html
// deliberately selects source showcases on those ports. This server exercises
// the production `dist/site/showcase/*.html` path instead.
const PORT = 52892;
const HOST = '127.0.0.1';
const STARTUP_TIMEOUT_MS = 30_000;

function probePort(timeoutMs = 800) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    let settled = false;
    const done = ok => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(PORT, HOST);
  });
}

async function waitForPort() {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await probePort()) return true;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  return false;
}

async function main() {
  const alreadyUp = await probePort();
  let server = null;
  if (!alreadyUp) {
    server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', HOST], {
      cwd: new URL('../dist/site/', import.meta.url),
      stdio: 'ignore',
      detached: true
    });
    if (!await waitForPort()) {
      try { process.kill(-server.pid, 'SIGTERM'); } catch {}
      throw new Error(`generated website server did not start on ${HOST}:${PORT}`);
    }
  }

  const cleanup = () => {
    if (!server) return;
    try { process.kill(-server.pid, 'SIGTERM'); } catch {}
    server = null;
  };
  process.on('SIGINT', () => { cleanup(); process.exit(130); });
  process.on('SIGTERM', () => { cleanup(); process.exit(143); });

  const playwright = spawn('npx', [
    'playwright',
    'test',
    'tests/website-render.test.ts',
    'tests/live/components/table/table-website-showcase.spec.ts',
    '--config=tests/playwright.config.ts'
  ], {
    stdio: 'inherit',
    env: {
      ...process.env,
      WEBSITE_BASE_URL: `http://${HOST}:${PORT}`,
      TABLE_WEBSITE_URL: `http://${HOST}:${PORT}/components.html#comp-table`
    }
  });
  playwright.on('exit', code => {
    cleanup();
    process.exit(code ?? 1);
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
