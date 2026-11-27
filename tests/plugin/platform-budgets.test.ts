// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import { build as viteBuild, transformWithEsbuild } from 'vite';
import { afterEach, describe, expect, it } from 'vitest';
import sniceVite from '../../packages/plugin/src/vite';
import sniceRollup from '../../packages/plugin/src/rollup';
import { SNICE_SKIN_PLATFORMS, type SniceSkinPlatform } from '../../packages/components/src/platforms';

const repoRoot = process.cwd();
const tempDirs: string[] = [];

function createTempApp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(repoRoot, join(dir, 'node_modules', 'snice'), 'junction');
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ type: 'module' }));
  return dir;
}

function collectFiles(root: string): { path: string; content: string; bytes: number }[] {
  const out: { path: string; content: string; bytes: number }[] = [];
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js') || entry.name.endsWith('.css')) {
        const buf = readFileSync(full);
        out.push({ path: full.slice(root.length + 1), content: buf.toString('utf8'), bytes: buf.byteLength });
      }
    }
  };
  walk(root);
  return out;
}

const PLATFORM_UNIQUE_MARKERS: Record<SniceSkinPlatform, { css: string; behavior: string }> = {
  ios: { css: '--snice-ios-glass-regular-bg', behavior: 'data-ios-pressed' },
  material: { css: '--snice-m3-spring-spatial', behavior: 'data-m3-ripple' },
  windows: { css: '--snice-win-acrylic-bg', behavior: 'data-win-focus' },
  macos: { css: '--snice-macos-glass-sidebar-bg', behavior: 'data-macos-focus' },
};

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe('Platform Skins zero-cost DCE, marginal budgets, and cache stability (PS-08)', () => {
  it('enforces marginal gzip budgets on Layer 1 tokens, Layer 2 overrides, and minified behavior modules', async () => {
    const distDir = join(repoRoot, 'dist/components');

    for (const platform of SNICE_SKIN_PLATFORMS) {
      // Layer 1 token file < 3.5 KB gzip
      const tokenBuf = readFileSync(join(distDir, 'theme/platforms', `${platform}.css`));
      const tokenGz = gzipSync(tokenBuf).byteLength;
      expect(tokenGz, `Layer 1 ${platform}.css gzip (${tokenGz} B) exceeds 3.5 KB`).toBeLessThan(3584);

      // Minified behavior module < 2.2 KB gzip
      const behSrc = readFileSync(join(distDir, 'platform-behaviors', `${platform}.js`), 'utf8');
      const min = await transformWithEsbuild(behSrc, `${platform}.js`, { minify: true });
      const behGz = gzipSync(Buffer.from(min.code)).byteLength;
      expect(behGz, `Minified behavior ${platform}.js gzip (${behGz} B) exceeds 2.2 KB`).toBeLessThan(2252);
    }

    // Every Layer 2 <comp>/<platform>.css < 1.2 KB gzip
    const srcComponents = join(repoRoot, 'packages/components/src');
    for (const entry of readdirSync(srcComponents, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === 'theme' || entry.name === 'platform-behaviors') continue;
      for (const file of readdirSync(join(srcComponents, entry.name))) {
        if (!/^(?:.+\.)?(ios|material|windows|macos)\.css$/.test(file)) continue;
        const buf = readFileSync(join(srcComponents, entry.name, file));
        const gz = gzipSync(buf).byteLength;
        expect(gz, `Layer 2 ${entry.name}/${file} gzip (${gz} B) exceeds 1.2 KB`).toBeLessThan(1228);
      }
    }
  });

  it('proves 0 bytes of unselected platform CSS, markup, and behaviors across all 5 Vite builds + 0-byte default regression + stable theme hash', async () => {
    const writeApp = (dir: string, appSuffix = 'v1') => {
      writeFileSync(
        join(dir, 'index.html'),
        `<!doctype html><html><head><title>App</title></head><body><script type="module" src="/main.js"></script></body></html>`
      );
      writeFileSync(
        join(dir, 'main.js'),
        `import 'snice/components/theme/core.css';
import 'snice/components/button/snice-button';
import 'snice/components/switch/snice-switch';
import 'snice/components/slider/snice-slider';
import 'snice/components/tabs/snice-tabs';
import 'snice/components/tabs/snice-tab';
import 'snice/components/tabs/snice-tab-panel';
console.log('platform-budget-app-${appSuffix}');
`
      );
    };

    const buildPlatform = async (platform: 'default' | SniceSkinPlatform | undefined, suffix = 'v1') => {
      const dir = createTempApp(`snice-budget-${platform ?? 'none'}-`);
      writeApp(dir, suffix);
      const outDir = join(dir, 'out');
      await viteBuild({
        root: dir,
        logLevel: 'silent',
        plugins: [sniceVite(platform ? { platform } : {})],
        build: { outDir, minify: true, sourcemap: false },
      });
      const files = collectFiles(outDir);
      const combinedJs = files.filter((f) => f.path.endsWith('.js')).map((f) => f.content).join('\n');
      const combinedCss = files.filter((f) => f.path.endsWith('.css')).map((f) => f.content).join('\n');
      const totalRaw = files.reduce((s, f) => s + f.bytes, 0);
      const totalGz = files.reduce((s, f) => s + gzipSync(Buffer.from(f.content)).byteLength, 0);
      const totalBr = files.reduce((s, f) => s + brotliCompressSync(Buffer.from(f.content)).byteLength, 0);
      const themeCss = files.find((f) => f.path.includes('snice-theme') && f.path.endsWith('.css'));
      return { files, combinedJs, combinedCss, totalRaw, totalGz, totalBr, themeCssPath: themeCss?.path };
    };

    // Explicit platform:'default' strips hidden data-platform-only helper nodes (<= baseline),
    // and BOTH omitted-platform and default builds contain 0 bytes of all 4 platform skins & behaviors.
    const baseline = await buildPlatform(undefined);
    const defaultBuild = await buildPlatform('default');
    expect(defaultBuild.totalRaw).toBeLessThanOrEqual(baseline.totalRaw);

    for (const p of SNICE_SKIN_PLATFORMS) {
      expect(baseline.combinedCss).not.toContain(PLATFORM_UNIQUE_MARKERS[p].css);
      expect(baseline.combinedJs).not.toContain(PLATFORM_UNIQUE_MARKERS[p].behavior);
      expect(defaultBuild.combinedCss).not.toContain(PLATFORM_UNIQUE_MARKERS[p].css);
      expect(defaultBuild.combinedJs).not.toContain(PLATFORM_UNIQUE_MARKERS[p].behavior);
    }
    expect(defaultBuild.combinedJs).not.toContain('data-platform-only');

    // Every single platform build must contain ONLY its own CSS + behavior and 0 bytes of the other 3
    for (const target of SNICE_SKIN_PLATFORMS) {
      const res = await buildPlatform(target);
      expect(res.combinedCss, `${target} missing its Layer 1 tokens`).toContain(PLATFORM_UNIQUE_MARKERS[target].css);
      expect(res.combinedJs, `${target} missing its behavior code`).toContain(PLATFORM_UNIQUE_MARKERS[target].behavior);

      for (const other of SNICE_SKIN_PLATFORMS) {
        if (other === target) continue;
        expect(res.combinedCss, `${target} leaked ${other} CSS`).not.toContain(PLATFORM_UNIQUE_MARKERS[other].css);
        expect(res.combinedJs, `${target} leaked ${other} behavior`).not.toContain(PLATFORM_UNIQUE_MARKERS[other].behavior);
      }
    }

    // Cache stability: editing app JS must keep snice-theme-[hash].css filename identical
    const iosV1 = await buildPlatform('ios', 'v1');
    const iosV2 = await buildPlatform('ios', 'v2-changed-copy');
    expect(iosV1.themeCssPath).toBeTruthy();
    expect(iosV2.themeCssPath).toBe(iosV1.themeCssPath);
  }, 60_000);

  it('proves 0-byte DCE of unused platform behaviors in Rollup builds', async () => {
    const dir = createTempApp('snice-budget-rollup-');
    writeFileSync(
      join(dir, 'entry.js'),
      `import 'snice/components/button/snice-button';
import 'snice/components/switch/snice-switch';
`
    );

    const bundle = await rollup({
      input: join(dir, 'entry.js'),
      plugins: [sniceRollup({ platform: 'windows' }), resolve()],
    });
    const { output } = await bundle.generate({ format: 'es' });
    await bundle.close();
    const js = output.filter((o) => o.type === 'chunk').map((o) => o.code).join('\n');

    expect(js).toContain('data-win-focus');
    expect(js).not.toContain('data-ios-pressed');
    expect(js).not.toContain('data-m3-ripple');
    expect(js).not.toContain('data-macos-focus');
  }, 30_000);
});
