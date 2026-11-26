import { test, expect } from '@playwright/test';
import { exec, spawn, type ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const execAsync = promisify(exec);

function stopChild(proc: ChildProcess | undefined) {
  if (!proc?.pid) return;
  try {
    if (process.platform === 'win32') proc.kill('SIGTERM');
    else process.kill(-proc.pid, 'SIGTERM');
  } catch {}
}

async function waitForHttp(url: string, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Preview server did not start at ${url}`);
}

test.describe('BS-10 AC-6: CLI created apps (default & react) production build + vite preview', () => {
  test.describe.configure({ mode: 'serial' });

  let tempDir: string;
  let defaultPreview: ChildProcess | undefined;
  let reactPreview: ChildProcess | undefined;
  let defaultPort: number;
  let reactPort: number;

  test.beforeAll(async ({ browserName }, testInfo) => {
    testInfo.setTimeout(240_000);
    const seed = (process.pid % 10_000) + (browserName === 'chromium' ? 0 : browserName === 'firefox' ? 100 : 200);
    defaultPort = 24_000 + seed;
    reactPort = 35_000 + seed;
    tempDir = await mkdtemp(join(tmpdir(), 'snice-cli-built-'));

    const { stdout: packOutput } = await execAsync(`npm pack --pack-destination ${tempDir}`, {
      cwd: process.cwd(),
      timeout: 30_000,
    });
    const tarballPath = join(tempDir, packOutput.trim().split('\n').pop()!);

    // Scaffold, install, and build BOTH templates
    const defaultApp = join(tempDir, 'default-app');
    const reactApp = join(tempDir, 'react-app');

    await Promise.all([
      execAsync(`node ${join(process.cwd(), 'bin/snice.js')} create-app default-app`, { cwd: tempDir, timeout: 30_000 }),
      execAsync(`node ${join(process.cwd(), 'bin/snice.js')} create-app react-app --template=react`, { cwd: tempDir, timeout: 30_000 }),
    ]);

    await execAsync(`npm install ${tarballPath}`, { cwd: defaultApp, timeout: 120_000 });
    await execAsync(`npm install ${tarballPath}`, { cwd: reactApp, timeout: 120_000 });

    await execAsync('npm run build', { cwd: defaultApp, timeout: 60_000 });
    await execAsync('npm run build', { cwd: reactApp, timeout: 60_000 });

    await rm(tarballPath, { force: true });

    defaultPreview = spawn('npx', ['vite', 'preview', '--port', String(defaultPort), '--strictPort'], {
      cwd: defaultApp,
      detached: process.platform !== 'win32',
      stdio: 'ignore',
    });
    reactPreview = spawn('npx', ['vite', 'preview', '--port', String(reactPort), '--strictPort'], {
      cwd: reactApp,
      detached: process.platform !== 'win32',
      stdio: 'ignore',
    });

    await Promise.all([
      waitForHttp(`http://localhost:${defaultPort}`),
      waitForHttp(`http://localhost:${reactPort}`),
    ]);
  }, 240_000);

  test.afterAll(async () => {
    stopChild(defaultPreview);
    stopChild(reactPreview);
    if (tempDir && existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true, maxRetries: 3 });
    }
  }, 30_000);

  test('default template production preview renders, signs in, and navigates with zero page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`http://localhost:${defaultPort}/#/login`);
    await expect(page.locator('login-page')).toBeVisible();
    await page.getByRole('textbox', { name: 'Username' }).fill('demo@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('demo');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.locator('dashboard-page')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('react template production preview renders cleanly with zero page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`http://localhost:${reactPort}/`, { waitUntil: 'networkidle' });
    const rootHtml = await page.locator('#root').innerHTML();
    expect(rootHtml.length).toBeGreaterThan(20);
    expect(errors).toEqual([]);
  });
});
