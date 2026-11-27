// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { build as viteBuild } from 'vite';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import type { SniceBuildReport } from '../../packages/plugin/src/types';

const ROOT = process.cwd();
const USE_BUILT = process.env.TEST_BUILT === 'true';
const tempDirs: string[] = [];

async function loadVitePlugin() {
  const mod = USE_BUILT
    ? await import(resolve(ROOT, 'dist/plugin/vite.js'))
    : await import('../../packages/plugin/src/vite');
  return (mod.default ?? mod.snice) as (opts?: any) => any;
}

async function loadRollupPlugin() {
  const mod = USE_BUILT
    ? await import(resolve(ROOT, 'dist/plugin/rollup.js'))
    : await import('../../packages/plugin/src/rollup');
  return (mod.default ?? mod.snice) as (opts?: any) => any;
}

function makeTempProject(
  prefix: string,
  files: Record<string, string>,
  extraFakePackages?: Record<string, Record<string, string>>
): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(ROOT, join(dir, 'node_modules', 'snice'), 'junction');
  for (const pkg of ['tslib', 'pica-route']) {
    const p = join(ROOT, 'node_modules', pkg);
    if (existsSync(p)) symlinkSync(p, join(dir, 'node_modules', pkg), 'junction');
  }
  if (extraFakePackages) {
    for (const [pkgName, pkgFiles] of Object.entries(extraFakePackages)) {
      for (const [rel, content] of Object.entries(pkgFiles)) {
        const full = join(dir, 'node_modules', pkgName, rel);
        mkdirSync(resolve(full, '..'), { recursive: true });
        writeFileSync(full, content);
      }
    }
  }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'user-flow-fixture', type: 'module' }));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(resolve(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

describe('Comprehensive Real-User Flows: Multi-Route Caching, Budgets, Precompiled Ceilings, Pure Rollup & Non-Plugin Consumers', () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
  });

  it('multi-route app with vendor tier, componentGroups, lazy heavy route, writeManifest/compareWith cache-diff, and size budgets', async () => {
    const sniceVite = await loadVitePlugin();
    const dir = makeTempProject(
      'snice-multiroute-cache-',
      {
        'index.html': `<!doctype html><html><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>`,
        'src/pages/lazy-analytics.ts': `
          import 'snice/components/chart/snice-chart';
          export function mountAnalytics(el: HTMLElement) {
            el.innerHTML = '<snice-chart></snice-chart>';
          }
        `,
        'src/app-copy.ts': `export const APP_TITLE = 'Dashboard Release v1';`,
        'src/main.ts': `
          import { element, property, render, html } from 'snice';
          import 'snice/components/theme/core.css';
          import 'snice/components/button/snice-button';
          import 'snice/components/card/snice-card';
          import 'snice/components/input/snice-input';
          import 'snice/components/select/snice-select';
          import { formatLabel } from 'third-party-fmt';
          import { APP_TITLE } from './app-copy';

          @element('multi-shell')
          export class MultiShell extends HTMLElement {
            @property() title = formatLabel(APP_TITLE);

            async openLazy() {
              const mod = await import('./pages/lazy-analytics');
              mod.mountAnalytics(this);
            }

            @render()
            template() {
              return html\`
                <snice-card>
                  <h1>\${this.title}</h1>
                  <snice-input label="Name"></snice-input>
                  <snice-select label="Role"></snice-select>
                  <snice-button @click=\${() => this.openLazy()}>Analytics</snice-button>
                </snice-card>
              \`;
            }
          }
        `,
      },
      {
        'third-party-fmt': {
          'package.json': JSON.stringify({ name: 'third-party-fmt', version: '1.0.0', type: 'module', main: 'index.js' }),
          'index.js': `export function formatLabel(s) { return '[FMT] ' + String(s).trim(); }\n`,
        },
      }
    );

    const manifestPath = join(dir, '.cache-manifest.json');
    let reportV1: SniceBuildReport | null = null;
    let reportV2: SniceBuildReport | null = null;

    const pluginOpts = (compare: boolean, budgets?: Record<string, { raw?: number; gzip?: number; brotli?: number }>) => ({
      caching: {
        vendor: true,
        componentGroups: { forms: ['input', 'select'] },
      },
      report: {
        print: false,
        writeManifest: compare ? undefined : manifestPath,
        compareWith: compare ? manifestPath : undefined,
        ...(budgets ? { budgets, failOnBudget: true } : {}),
        onReport(r: SniceBuildReport) {
          if (compare) reportV2 = r;
          else reportV1 = r;
        },
      },
    });

    // Build v1
    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [sniceVite(pluginOpts(false))],
      build: { outDir: 'dist', emptyOutDir: true },
    });

    expect(existsSync(manifestPath)).toBe(true);
    expect(reportV1).not.toBeNull();

    const assetsDir = join(dir, 'dist/assets');
    const v1Files = readdirSync(assetsDir);

    // Verify all expected tiers exist
    const rtChunk = v1Files.find((f) => /^snice-runtime-.*\.js$/.test(f));
    const compChunk = v1Files.find((f) => /^snice-components-.*\.js$/.test(f));
    const formsChunk = v1Files.find((f) => /^snice-forms-.*\.js$/.test(f));
    const vendorChunk = v1Files.find((f) => /^vendor-.*\.js$/.test(f));
    const themeChunk = v1Files.find((f) => /^snice-theme-.*\.css$/.test(f));
    expect(rtChunk, 'snice-runtime chunk').toBeDefined();
    expect(compChunk, 'snice-components chunk').toBeDefined();
    expect(formsChunk, 'snice-forms componentGroup chunk').toBeDefined();
    expect(vendorChunk, 'third-party vendor chunk').toBeDefined();
    expect(themeChunk, 'snice-theme css').toBeDefined();

    // Verify lazy route component (snice-chart) stayed OUT of eager chunks!
    const eagerCode = [rtChunk!, compChunk!, formsChunk!, vendorChunk!]
      .map((f) => readFileSync(join(assetsDir, f), 'utf8'))
      .join('\n');
    expect(eagerCode).not.toContain('snice-chart');

    // Edit ONLY app copy -> Build v2 with compareWith
    writeFileSync(join(dir, 'src/app-copy.ts'), `export const APP_TITLE = 'Dashboard Release v2 (edited)';`);

    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [sniceVite(pluginOpts(true, { 'snice-runtime': { gzip: 200_000 }, total: { brotli: 500_000 } }))],
      build: { outDir: 'dist', emptyOutDir: true },
    });

    expect(reportV2).not.toBeNull();
    expect(reportV2!.budgetViolations).toEqual([]);

    const byPrefix = (prefix: string) =>
      reportV2!.chunks.find((c) => c.fileName.includes(`/${prefix}-`) || c.fileName.startsWith(`${prefix}-`));

    for (const stablePrefix of ['snice-runtime', 'snice-components', 'snice-forms', 'vendor', 'snice-theme']) {
      const chunk = byPrefix(stablePrefix);
      expect(chunk, `${stablePrefix} present in v2 report`).toBeDefined();
      expect(chunk!.cacheStatus, `${stablePrefix} must remain STABLE`).toBe('STABLE');
    }

    const appChunk = reportV2!.chunks.find((c) => c.tier === 'app' && c.fileName.endsWith('.js') && c.fileName.includes('index-'));
    expect(appChunk, 'app entry chunk present').toBeDefined();
    expect(appChunk!.cacheStatus).toBe('CHANGED');

    // Verify budgets + failOnBudget: true rejects cleanly when breached
    await expect(
      viteBuild({
        root: dir,
        logLevel: 'silent',
        plugins: [
          sniceVite({
            caching: { vendor: true },
            report: {
              print: false,
              budgets: { 'snice-runtime': { gzip: 100 } },
              failOnBudget: true,
            },
          }),
        ],
        build: { outDir: 'dist', emptyOutDir: true },
      })
    ).rejects.toThrow(/budget/i);
  }, 45_000);

  it('pure Rollup (snice/rollup) handles mixed Snice + custom TC39 2022-03 decorators, modern TS syntax, and valid composed sourcemaps', async () => {
    const sniceRollup = await loadRollupPlugin();
    const dir = makeTempProject('snice-rollup-modern-', {
      'src/entry.ts': `
        import { element, property, render, html } from 'snice';

        function tagMeta<T extends new (...args: any[]) => any>(label: string) {
          return function (target: T, _ctx: ClassDecoratorContext) {
            (target as any).__customMeta = label;
            return target;
          };
        }

        function traceMethod<This, Args extends any[], Ret>(
          fn: (this: This, ...args: Args) => Ret,
          _ctx: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Ret>
        ) {
          return function (this: This, ...args: Args): Ret {
            return fn.apply(this, args);
          };
        }

        interface Config {
          pattern: RegExp;
          mode: 'fast' | 'safe';
        }

        const cfg = {
          pattern: /^snice-[a-z0-9-]+$/i,
          mode: 'fast',
        } satisfies Config;

        export function makeDisposable(log: string[]) {
          return {
            [Symbol.dispose]() {
              log.push('disposed');
            },
          };
        }

        export function runDisposable(): string {
          const log: string[] = [];
          {
            using resource = makeDisposable(log);
            void resource;
            log.push('used');
          }
          return log.join(':');
        }

        @tagMeta('custom-decorated')
        @element('modern-rollup-el')
        export class ModernRollupEl extends HTMLElement {
          @property() title = \`hello-\${cfg.mode}-\${\`nested-\${cfg.pattern.test('snice-ok')}\`}\`;

          accessor internalToken: string = 'acc-1';

          @traceMethod
          describe(): string {
            return \`\${this.title}:\${this.internalToken}\`;
          }

          @render()
          template() {
            return html\`<section class="modern">\${this.describe()}</section>\`;
          }
        }
      `,
    });

    const bundle = await rollup({
      input: join(dir, 'src/entry.ts'),
      external: ['snice'],
      plugins: [
        nodeResolve({ extensions: ['.ts', '.js'] }),
        sniceRollup({ caching: false, precompileTemplates: true }),
      ],
    });
    try {
      const { output } = await bundle.generate({
        format: 'es',
        sourcemap: true,
      });
      const chunk = output[0];
      expect(chunk.code).toContain('modern-rollup-el');
      expect(chunk.code).toContain('custom-decorated');
      expect(chunk.code).toContain('disposed');
      expect(chunk.code).not.toContain('satisfies Config');

      // Composed sourcemap validity
      expect(chunk.map).toBeTruthy();
      expect(chunk.map!.version).toBe(3);
      expect(typeof chunk.map!.mappings).toBe('string');
      expect(chunk.map!.mappings.length).toBeGreaterThan(20);
      expect(Array.isArray(chunk.map!.sourcesContent)).toBe(true);
      expect(chunk.map!.sourcesContent!.some((s) => typeof s === 'string' && s.includes('ModernRollupEl'))).toBe(true);
    } finally {
      await bundle.close();
    }
  }, 30_000);

  it('lean minimal precompiled app excludes createTreeWalker/prepareTemplate and meets strict raw/gz/br ceilings', async () => {
    const sniceVite = await loadVitePlugin();
    const dir = makeTempProject('snice-precomp-ceiling-', {
      'index.html': `<!doctype html><html><body><slim-badge></slim-badge><script type="module" src="/src/main.ts"></script></body></html>`,
      'src/main.ts': `
        import { element, property, render, html } from 'snice';
        @element('slim-badge')
        export class SlimBadge extends HTMLElement {
          @property() label = 'OK';
          @render() template() {
            return html\`<span class="badge">\${this.label}</span>\`;
          }
        }
      `,
    });

    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [sniceVite({ caching: false, precompileTemplates: true })],
      build: { outDir: 'dist', emptyOutDir: true },
    });

    const assetsDir = join(dir, 'dist/assets');
    const jsBufs = readdirSync(assetsDir)
      .filter((f) => f.endsWith('.js'))
      .map((f) => readFileSync(join(assetsDir, f)));
    const combined = Buffer.concat(jsBufs);
    const code = combined.toString('utf8');

    expect(code).not.toContain('createTreeWalker');
    expect(code).not.toContain('prepareTemplate');
    expect(combined.length).toBeLessThan(52_000);
    expect(gzipSync(combined).length).toBeLessThan(15_000);
    expect(brotliCompressSync(combined).length).toBeLessThan(13_500);
  }, 30_000);

  it('non-plugin consumer app (zero snice/vite, standard Vite/esbuild) builds cleanly with zero regressions', async () => {
    const dir = makeTempProject('snice-no-plugin-', {
      'index.html': `<!doctype html><html><body><snice-button variant="primary">Click</snice-button><script type="module" src="/src/main.ts"></script></body></html>`,
      'src/main.ts': `
        import 'snice/components/theme/core.css';
        import 'snice/components/button/snice-button';
        import 'snice/components/card/snice-card';
        import 'snice/components/table/snice-table-core';
        import { html, css } from 'snice';

        const tpl = html\`<div class="plain">No plugin needed</div>\`;
        const st = css\`:host { display: block; }\`;
        console.log(Boolean(tpl), Boolean(st));
      `,
    });

    await viteBuild({
      root: dir,
      logLevel: 'silent',
      // Deliberately ZERO snice/vite plugin!
      plugins: [],
      build: { outDir: 'dist', emptyOutDir: true },
    });

    const assetsDir = join(dir, 'dist/assets');
    const files = readdirSync(assetsDir);
    const js = files
      .filter((f) => f.endsWith('.js'))
      .map((f) => readFileSync(join(assetsDir, f), 'utf8'))
      .join('\n');
    const css = files
      .filter((f) => f.endsWith('.css'))
      .map((f) => readFileSync(join(assetsDir, f), 'utf8'))
      .join('\n');

    expect(js).toContain('snice-button');
    expect(js).toContain('snice-card');
    expect(js).toContain('snice-table');
    expect(css).toContain('--snice-color-primary');
  }, 30_000);
});
