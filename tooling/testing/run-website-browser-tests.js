#!/usr/bin/env node
/** Run the generated public website browser gates on a managed local server. */
import { spawn } from 'child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'url';
import net from 'net';

// Do not use the Vite development ports (52891/5566): components.html
// deliberately selects source showcases on those ports. This server exercises
// the production `dist/site/showcase/*.html` path instead.
const DEFAULT_PORT = 52892;
const HOST = '127.0.0.1';
const STARTUP_TIMEOUT_MS = 30_000;
const customSiteDir = process.env.SNICE_TEST_SITE_DIR;
const siteDir = resolve(customSiteDir
  || fileURLToPath(new URL('../../dist/site/', import.meta.url)));
const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2']
]);

function probePort(port, timeoutMs = 800) {
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
    socket.connect(port, HOST);
  });
}

function createStaticServer() {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url || '/', `http://${HOST}`);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = resolve(siteDir, `.${pathname}`);
      if (file !== siteDir && !file.startsWith(`${siteDir}${sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
      }

      const body = await readFile(file);
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': contentTypes.get(extname(file)) || 'application/octet-stream'
      });
      response.end(body);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
}

function listen(server, port) {
  return new Promise((resolveListen, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error(`generated website server did not start on ${HOST}:${port}`));
    }, STARTUP_TIMEOUT_MS);
    server.once('error', error => {
      clearTimeout(timeout);
      reject(error);
    });
    server.listen(port, HOST, () => {
      clearTimeout(timeout);
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('generated website server did not expose a TCP port'));
        return;
      }
      resolveListen(address.port);
    });
  });
}

async function main() {
  const passthrough = process.argv.slice(2);
  // A full-suite snapshot must never reuse a long-running server rooted at
  // dist/site. Bind an ephemeral port so concurrent website-builder tests
  // cannot mutate files underneath the browser gate.
  const alreadyUp = !customSiteDir && await probePort(DEFAULT_PORT);
  let server = null;
  let port = DEFAULT_PORT;
  if (!alreadyUp) {
    server = createStaticServer();
    port = await listen(server, customSiteDir ? 0 : DEFAULT_PORT);
  }

  const cleanup = () => {
    if (!server) return;
    server.close();
    server = null;
  };
  process.on('SIGINT', () => { cleanup(); process.exit(130); });
  process.on('SIGTERM', () => { cleanup(); process.exit(143); });

  const playwright = spawn('npx', [
    'playwright',
    'test',
    'tests/website-render.test.ts',
    'tests/live/components/key-value/key-value-website-showcase.spec.ts',
    'tests/live/components/table/table-website-showcase.spec.ts',
    '--config=tests/playwright.config.ts',
    '--output=test-results/website',
    ...passthrough
  ], {
    stdio: 'inherit',
    env: {
      ...process.env,
      WEBSITE_BASE_URL: `http://${HOST}:${port}`,
      KEY_VALUE_WEBSITE_URL: `http://${HOST}:${port}/components.html#comp-key-value`,
      TABLE_WEBSITE_URL: `http://${HOST}:${port}/components.html#comp-table`
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
