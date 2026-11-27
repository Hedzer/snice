// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build as viteBuild } from 'vite';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import type { SniceBuildReport } from '../../packages/plugin/src/types';

const ROOT = process.cwd();
const USE_BUILT = process.env.TEST_BUILT === 'true';

async function loadVitePlugin() {
  const mod = USE_BUILT
    ? await import(resolve(ROOT, 'dist/plugin/vite.js'))
    : await import('../../packages/plugin/src/vite');
  return mod as {
    default: (opts?: any) => any;
    snice: (opts?: any) => any;
    createSniceManualChunks: (opts?: any) => any;
  };
}

async function loadRollupPlugin() {
  const mod = USE_BUILT
    ? await import(resolve(ROOT, 'dist/plugin/rollup.js'))
    : await import('../../packages/plugin/src/rollup');
  return mod as {
    default: (opts?: any) => any;
    snice: (opts?: any) => any;
    createSniceManualChunks: (opts?: any) => any;
  };
}

const tempDirs: string[] = [];

function createFixtureDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(ROOT, join(dir, 'node_modules', 'snice'), 'junction');
  for (const pkg of ['react', 'react-dom', 'scheduler', 'tslib', 'pica-route']) {
    const pkgPath = join(ROOT, 'node_modules', pkg);
    if (existsSync(pkgPath)) {
      symlinkSync(pkgPath, join(dir, 'node_modules', pkg), 'junction');
    }
  }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'fixture', type: 'module' }));
  return dir;
}

function sha256(buf: Buffer | string): string {
  return createHash('sha256').update(buf).digest('hex');
}

function listAssets(distDir: string): Map<string, string> {
  const assetsDir = join(distDir, 'assets');
  const map = new Map<string, string>();
  if (!existsSync(assetsDir)) return map;
  for (const file of readdirSync(assetsDir).sort()) {
    map.set(file, sha256(readFileSync(join(assetsDir, file))));
  }
  return map;
}

function findAsset(assets: Map<string, string>, pattern: RegExp): [string, string] | undefined {
  for (const entry of assets.entries()) {
    if (pattern.test(entry[0])) return entry;
  }
  return undefined;
}

describe('BS-05: Snice bundler plugin scaffold & deterministic cache-boundary chunking', () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
  });

  it('AC-2/AC-4: repeat deploy keeps snice-runtime, snice-components, and snice-theme byte-identical, and lazy heavy routes never pollute eager tiers', async () => {
    const { default: snice } = await loadVitePlugin();
    const dir = createFixtureDir('snice-bs05-spa-');

    mkdirSync(join(dir, 'src/pages'), { recursive: true });
    writeFileSync(
      join(dir, 'index.html'),
      `<!doctype html><html><head><title>App</title></head><body><div id="app"></div><script type="module" src="/src/main.js"></script></body></html>`
    );
    writeFileSync(
      join(dir, 'src/pages/home.js'),
      `import { html } from 'snice';\nexport function renderHome() { return html\`<h1>Home v1</h1>\`; }\n`
    );
    writeFileSync(
      join(dir, 'src/main.js'),
      [
        `import 'snice/components/theme/theme.css';`,
        `import 'snice/components/button/snice-button';`,
        `import 'snice/components/input/snice-input';`,
        `import 'snice/components/card/snice-card';`,
        `import { renderHome } from './pages/home.js';`,
        `console.log(renderHome());`,
      ].join('\n')
    );

    const buildApp = async () => {
      const warnings: string[] = [];
      await viteBuild({
        root: dir,
        logLevel: 'silent',
        plugins: [snice()],
        build: {
          outDir: 'dist',
          emptyOutDir: true,
          rollupOptions: {
            onwarn(w) {
              warnings.push(`${w.code}: ${w.message}`);
            },
          },
        },
      });
      return { assets: listAssets(join(dir, 'dist')), warnings };
    };

    // v1 baseline
    const v1 = await buildApp();
    expect(v1.warnings.filter(w => w.includes('CIRCULAR_CHUNK'))).toEqual([]);

    const rt1 = findAsset(v1.assets, /^snice-runtime-[^.]+\.js$/);
    const comp1 = findAsset(v1.assets, /^snice-components-[^.]+\.js$/);
    const theme1 = findAsset(v1.assets, /^snice-theme-[^.]+\.css$/);
    const app1 = findAsset(v1.assets, /^index-[^.]+\.js$/);

    expect(rt1, 'snice-runtime chunk').toBeDefined();
    expect(comp1, 'snice-components chunk').toBeDefined();
    expect(theme1, 'snice-theme css').toBeDefined();
    expect(app1, 'app entry chunk').toBeDefined();

    // v2: edit volatile app page
    writeFileSync(
      join(dir, 'src/pages/home.js'),
      `import { html } from 'snice';\nexport function renderHome() { return html\`<h1>Home v2 — updated copy!</h1>\`; }\n`
    );
    const v2 = await buildApp();
    const rt2 = findAsset(v2.assets, /^snice-runtime-[^.]+\.js$/);
    const comp2 = findAsset(v2.assets, /^snice-components-[^.]+\.js$/);
    const theme2 = findAsset(v2.assets, /^snice-theme-[^.]+\.css$/);
    const app2 = findAsset(v2.assets, /^index-[^.]+\.js$/);

    expect(rt2).toEqual(rt1);
    expect(comp2).toEqual(comp1);
    expect(theme2).toEqual(theme1);
    expect(app2![0]).not.toBe(app1![0]);

    // v3 (AC-4): add dynamically imported heavy route (snice-table)
    writeFileSync(
      join(dir, 'src/pages/home.js'),
      `import { html } from 'snice';\nexport function renderHome() { return html\`<h1>Home v3</h1>\`; }\nexport const loadTable = () => import('snice/components/table/snice-table');\n`
    );
    const v3 = await buildApp();
    const rt3 = findAsset(v3.assets, /^snice-runtime-[^.]+\.js$/);
    const comp3 = findAsset(v3.assets, /^snice-components-[^.]+\.js$/);
    const theme3 = findAsset(v3.assets, /^snice-theme-[^.]+\.css$/);

    // Lazy table & its lazy-only transitive dependencies MUST NOT pollute eager tiers
    expect(rt3).toEqual(rt1);
    expect(comp3).toEqual(comp1);
    expect(theme3).toEqual(theme1);
  }, 60000);

  it('AC-3: React + Snice app isolates vendor-react, snice-runtime, snice-components, and snice-theme with zero circular chunk warnings', async () => {
    const { default: snice } = await loadVitePlugin();
    const dir = createFixtureDir('snice-bs05-react-');

    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(
      join(dir, 'index.html'),
      `<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.js"></script></body></html>`
    );
    writeFileSync(
      join(dir, 'src/App.js'),
      `import React from 'react';\nexport function App() { return React.createElement('div', null, 'App v1'); }\n`
    );
    writeFileSync(
      join(dir, 'src/main.js'),
      [
        `import React from 'react';`,
        `import { createRoot } from 'react-dom/client';`,
        `import 'snice/components/theme/theme.css';`,
        `import 'snice/components/button/snice-button';`,
        `import { html } from 'snice';`,
        `import { App } from './App.js';`,
        `console.log(createRoot, App, html\`<span>ok</span>\`);`,
      ].join('\n')
    );

    const runBuild = async () => {
      const warnings: string[] = [];
      await viteBuild({
        root: dir,
        logLevel: 'silent',
        plugins: [snice()],
        build: {
          outDir: 'dist',
          emptyOutDir: true,
          rollupOptions: {
            onwarn(w) {
              warnings.push(`${w.code}: ${w.message}`);
            },
          },
        },
      });
      return { assets: listAssets(join(dir, 'dist')), warnings };
    };

    const r1 = await runBuild();
    expect(r1.warnings.filter(w => w.includes('CIRCULAR_CHUNK'))).toEqual([]);
    const vr1 = findAsset(r1.assets, /^vendor-react-[^.]+\.js$/);
    const rt1 = findAsset(r1.assets, /^snice-runtime-[^.]+\.js$/);
    const comp1 = findAsset(r1.assets, /^snice-components-[^.]+\.js$/);
    const theme1 = findAsset(r1.assets, /^snice-theme-[^.]+\.css$/);

    expect(vr1).toBeDefined();
    expect(rt1).toBeDefined();
    expect(comp1).toBeDefined();
    expect(theme1).toBeDefined();

    // Edit React app code and rebuild
    writeFileSync(
      join(dir, 'src/App.js'),
      `import React from 'react';\nexport function App() { return React.createElement('div', null, 'App v2 changed!'); }\n`
    );
    const r2 = await runBuild();
    expect(findAsset(r2.assets, /^vendor-react-[^.]+\.js$/)).toEqual(vr1);
    expect(findAsset(r2.assets, /^snice-runtime-[^.]+\.js$/)).toEqual(rt1);
    expect(findAsset(r2.assets, /^snice-components-[^.]+\.js$/)).toEqual(comp1);
    expect(findAsset(r2.assets, /^snice-theme-[^.]+\.css$/)).toEqual(theme1);
  }, 60000);

  it('AC-5/AC-8: cross-directory builds are byte-identical and report callback returns accurate tier sizes', async () => {
    const { default: snice } = await loadVitePlugin();
    const dirA = createFixtureDir('snice-bs05-ci-alpha-');
    const dirB = createFixtureDir('snice-bs05-ci-beta-');

    const setup = (dir: string) => {
      mkdirSync(join(dir, 'src'), { recursive: true });
      writeFileSync(
        join(dir, 'index.html'),
        `<!doctype html><html><body><script type="module" src="/src/main.js"></script></body></html>`
      );
      writeFileSync(
        join(dir, 'src/main.js'),
        [
          `import 'snice/components/theme/theme.css';`,
          `import 'snice/components/button/snice-button';`,
          `import { parseDuration } from 'snice';`,
          `console.log(parseDuration('100ms'));`,
        ].join('\n')
      );
    };
    setup(dirA);
    setup(dirB);

    let capturedReport: SniceBuildReport | null = null;
    await viteBuild({
      root: dirA,
      logLevel: 'silent',
      plugins: [snice({ report: (r: SniceBuildReport) => { capturedReport = r; } })],
      build: { outDir: 'dist', emptyOutDir: true },
    });
    await viteBuild({
      root: dirB,
      logLevel: 'silent',
      plugins: [snice()],
      build: { outDir: 'dist', emptyOutDir: true },
    });

    const assetsA = listAssets(join(dirA, 'dist'));
    const assetsB = listAssets(join(dirB, 'dist'));
    expect([...assetsA.entries()]).toEqual([...assetsB.entries()]);

    expect(capturedReport).not.toBeNull();
    expect(capturedReport!.totalRawBytes).toBeGreaterThan(0);
    expect(capturedReport!.totalGzipBytes).toBeGreaterThan(0);
    expect(capturedReport!.totalGzipBytes).toBeLessThan(capturedReport!.totalRawBytes);
    const tiers = new Set(capturedReport!.chunks.map(c => c.tier));
    expect(tiers.has('snice-runtime')).toBe(true);
    expect(tiers.has('snice-components')).toBe(true);
    expect(tiers.has('snice-theme')).toBe(true);
  }, 60000);

  it('AC-6/AC-7/AC-8: Rollup & Vite __SNICE_DEV__ DCE, target defaults, single-file/lib/doctor bypass, manualChunks composition, caching:false & invalid option validation', async () => {
    const { default: sniceVite, createSniceManualChunks } = await loadVitePlugin();
    const { default: sniceRollup } = await loadRollupPlugin();

    // AC-8: Invalid option validation fails fast with TypeError
    expect(() => sniceVite({ stripCssFallbacks: 'invalid' as any })).toThrow(TypeError);
    expect(() => sniceVite({ caching: 'yes' as any })).toThrow(TypeError);
    expect(() => sniceRollup({ decorators: 'yes' as any })).toThrow(TypeError);
    expect(() => sniceRollup({ table: { cells: [123 as any] } })).toThrow(TypeError);

    // AC-7: Vite default target es2022, target: false opt-out, dev mode __SNICE_DEV__=true
    const pDefault = sniceVite();
    const cfgProd = pDefault.config({}, { command: 'build', mode: 'production' });
    expect(cfgProd.build?.target).toBe('es2022');
    expect(cfgProd.define?.__SNICE_DEV__).toBe('false');

    const cfgDev = pDefault.config({}, { command: 'serve', mode: 'development' });
    expect(cfgDev.define?.__SNICE_DEV__).toBe('true');

    const pNoTarget = sniceVite({ target: false });
    const cfgNoTarget = pNoTarget.config({}, { command: 'build', mode: 'production' });
    expect(cfgNoTarget.build?.target).toBeUndefined();

    // User explicit build.target is preserved
    const cfgUserTarget = pDefault.config({ build: { target: 'es2020' } }, { command: 'build', mode: 'production' });
    expect(cfgUserTarget.build?.target).toBeUndefined();

    // AC-7: __SNICE_DEV__ DCE in BOTH Vite and Rollup
    const dir = createFixtureDir('snice-bs05-dce-');
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(
      join(dir, 'index.html'),
      `<!doctype html><html><body><script type="module" src="/src/main.js"></script></body></html>`
    );
    writeFileSync(
      join(dir, 'src/main.js'),
      `import { parseDuration } from 'snice';\nif (typeof __SNICE_DEV__ === 'undefined' || __SNICE_DEV__) { console.warn('SNICE_DEV_ONLY_MARKER'); }\nconsole.log(parseDuration('50ms'));\n`
    );

    // Vite production build eliminates SNICE_DEV_ONLY_MARKER
    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [sniceVite()],
      build: { outDir: 'dist-vite', emptyOutDir: true },
    });
    const viteJs = readdirSync(join(dir, 'dist-vite/assets'))
      .filter(f => f.endsWith('.js'))
      .map(f => readFileSync(join(dir, 'dist-vite/assets', f), 'utf8'))
      .join('\n');
    expect(viteJs).not.toContain('SNICE_DEV_ONLY_MARKER');

    // Pure Rollup production build (iife + output.file + OutputOptions[]) eliminates SNICE_DEV_ONLY_MARKER & bypasses chunking cleanly
    const rollupBundle = await rollup({
      input: join(dir, 'src/main.js'),
      plugins: [nodeResolve(), sniceRollup(), terser()],
    });
    try {
      const { output: iifeOut } = await rollupBundle.generate({
        file: join(dir, 'out.iife.js'),
        format: 'iife',
      });
      expect(iifeOut).toHaveLength(1);
      expect(iifeOut[0].code).not.toContain('SNICE_DEV_ONLY_MARKER');

      const { output: esFileOut } = await rollupBundle.generate({
        file: join(dir, 'out.esm.js'),
        format: 'es',
      });
      expect(esFileOut).toHaveLength(1);
      expect(esFileOut[0].code).not.toContain('SNICE_DEV_ONLY_MARKER');
    } finally {
      await rollupBundle.close();
    }

    // AC-6: Vite build.lib bypasses plugin chunking cleanly
    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [sniceVite()],
      build: {
        outDir: 'dist-lib',
        emptyOutDir: true,
        lib: { entry: join(dir, 'src/main.js'), formats: ['es'], fileName: 'my-lib' },
      },
    });
    expect(existsSync(join(dir, 'dist-lib/my-lib.js'))).toBe(true);

    // AC-6: inline manualChunks: () => undefined (matching bin/snice.js:518 doctor probe) bypasses chunking cleanly
    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [sniceVite()],
      build: {
        outDir: 'dist-doctor',
        emptyOutDir: true,
        rollupOptions: {
          output: {
            manualChunks: () => undefined,
          },
        },
      },
    });
    const doctorFiles = readdirSync(join(dir, 'dist-doctor/assets')).filter(f => f.endsWith('.js'));
    expect(doctorFiles.some(f => f.startsWith('snice-runtime'))).toBe(false);

    // AC-6: caching: false attaches no manualChunks
    const noCachePlugin = sniceVite({ caching: false });
    const outOpts = noCachePlugin.outputOptions({ format: 'es' });
    expect(outOpts.manualChunks).toBeUndefined();

    // AC-6: object manualChunks composition & createSniceManualChunks helper
    const composedOpts = sniceVite().outputOptions({
      format: 'es',
      manualChunks: { custom: ['src/main.js'] },
    });
    expect(typeof composedOpts.manualChunks).toBe('function');
    const mockMeta = {
      getModuleIds: () => [join(dir, 'src/main.js'), '/proj/node_modules/snice/dist/index.esm.js'].values(),
      getModuleInfo: (id: string) =>
        id.endsWith('main.js')
          ? { isEntry: true, importedIds: ['/proj/node_modules/snice/dist/index.esm.js'] }
          : { isEntry: false, importedIds: [] },
    };
    expect(composedOpts.manualChunks(join(dir, 'src/main.js'), mockMeta)).toBe('custom');
    expect(composedOpts.manualChunks('/proj/node_modules/snice/dist/index.esm.js', mockMeta)).toBe('snice-runtime');

    // createSniceManualChunks standalone composition helper
    const helper = createSniceManualChunks();
    expect(helper('/proj/node_modules/snice/dist/_core/element.js', { getModuleIds: () => [].values(), getModuleInfo: () => null })).toBe('snice-runtime');
    expect(helper('/proj/node_modules/snice/dist/components/table/snice-table.js', { getModuleIds: () => [].values(), getModuleInfo: () => null })).toBe('snice-table');
    expect(helper('/proj/node_modules/snice/dist/components/button/snice-button.js', { getModuleIds: () => [].values(), getModuleInfo: () => null })).toBe('snice-components');
    expect(helper('/proj/node_modules/lodash-es/debounce.js', { getModuleIds: () => [].values(), getModuleInfo: () => null })).toBe('vendor');

    const helperNoVendor = createSniceManualChunks({ vendor: false });
    expect(helperNoVendor('/proj/node_modules/lodash-es/debounce.js', { getModuleIds: () => [].values(), getModuleInfo: () => null })).toBeUndefined();
  }, 60000);

  it('Phase 2: vendor tier, componentGroups isolation, Brotli sizes, manifest cache-hash diff (STABLE vs CHANGED), and size budgets', async () => {
    const { default: snice } = await loadVitePlugin();
    const dir = createFixtureDir('snice-p2-cache-');

    // Create a fake third-party node_modules package to verify the generic `vendor` tier
    mkdirSync(join(dir, 'node_modules/my-third-party-lib'), { recursive: true });
    writeFileSync(
      join(dir, 'node_modules/my-third-party-lib/package.json'),
      JSON.stringify({ name: 'my-third-party-lib', type: 'module', main: './index.js' })
    );
    writeFileSync(
      join(dir, 'node_modules/my-third-party-lib/index.js'),
      `export function formatMoney(n) { return '$' + Number(n).toFixed(2); }\n`
    );

    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(
      join(dir, 'index.html'),
      `<!doctype html><html><body><script type="module" src="/src/main.js"></script></body></html>`
    );
    const writeMain = (label: string, extraImport = '') => {
      writeFileSync(
        join(dir, 'src/main.js'),
        [
          `import 'snice/components/theme/theme.css';`,
          `import 'snice/components/input/snice-input';`,
          `import 'snice/components/button/snice-button';`,
          extraImport,
          `import { formatMoney } from 'my-third-party-lib';`,
          `import { html } from 'snice';`,
          `console.log(${JSON.stringify(label)}, formatMoney(42), html\`<div>ok</div>\`);`,
        ].filter(Boolean).join('\n')
      );
    };

    const manifestPath = join(dir, 'snice-manifest.json');
    const caching = { componentGroups: { forms: ['input'] } };

    // Build v1: writes manifest, checks Brotli + vendor + snice-forms group
    writeMain('v1');
    let rep1: SniceBuildReport | null = null;
    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [
        snice({
          caching,
          report: {
            print: false,
            writeManifest: manifestPath,
            onReport: (r: SniceBuildReport) => { rep1 = r; },
          },
        }),
      ],
      build: { outDir: 'dist', emptyOutDir: true },
    });

    expect(existsSync(manifestPath)).toBe(true);
    expect(rep1).not.toBeNull();
    expect(rep1!.totalBrotliBytes).toBeGreaterThan(0);
    expect(rep1!.totalBrotliBytes).toBeLessThan(rep1!.totalRawBytes);
    expect(rep1!.chunks.some((c) => c.tier === 'vendor')).toBe(true);
    expect(rep1!.chunks.some((c) => c.fileName.includes('snice-forms-'))).toBe(true);

    // Build v2: edit app copy AND add an ungrouped component (`snice-divider`, which uses
    // the same core decorators already in snice-runtime)
    // -> vendor, snice-runtime, snice-theme, AND snice-forms MUST stay STABLE!
    // -> snice-components and app entry MUST be CHANGED!
    writeMain('v2-updated', `import 'snice/components/divider/snice-divider';`);
    let rep2: SniceBuildReport | null = null;
    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [
        snice({
          caching,
          report: {
            print: false,
            compareWith: manifestPath,
            budgets: {
              total: { brotli: 1_000_000 },
              vendor: { gzip: 100_000 },
            },
            onReport: (r: SniceBuildReport) => { rep2 = r; },
          },
        }),
      ],
      build: { outDir: 'dist', emptyOutDir: true },
    });

    expect(rep2).not.toBeNull();
    expect(rep2!.cacheDiff).toBeDefined();
    expect(rep2!.budgetViolations).toEqual([]);

    const statusByPrefix = (prefix: string) =>
      rep2!.chunks.find((c) => c.fileName.includes(prefix))?.cacheStatus;
    expect(statusByPrefix('vendor-')).toBe('STABLE');
    expect(statusByPrefix('snice-runtime-')).toBe('STABLE');
    expect(statusByPrefix('snice-theme-')).toBe('STABLE');
    expect(statusByPrefix('snice-forms-')).toBe('STABLE');
    expect(statusByPrefix('snice-components-')).toBe('CHANGED');
    expect(statusByPrefix('index-')).toBe('CHANGED');

    // Budget enforcement: failing budget throws when failOnBudget is true (default)
    await expect(
      viteBuild({
        root: dir,
        logLevel: 'silent',
        plugins: [
          snice({
            caching,
            report: {
              print: false,
              budgets: { total: { brotli: 10 } },
            },
          }),
        ],
        build: { outDir: 'dist', emptyOutDir: true },
      })
    ).rejects.toThrow(/budget exceeded/i);

    // Non-throwing budget mode records violations in report
    let repWarn: SniceBuildReport | null = null;
    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [
        snice({
          caching,
          report: {
            print: false,
            failOnBudget: false,
            budgets: { vendor: { raw: 1 } },
            onReport: (r: SniceBuildReport) => { repWarn = r; },
          },
        }),
      ],
      build: { outDir: 'dist', emptyOutDir: true },
    });
    expect(repWarn!.budgetViolations).toHaveLength(1);
    expect(repWarn!.budgetViolations![0].target).toBe('vendor');
  }, 60000);
});
