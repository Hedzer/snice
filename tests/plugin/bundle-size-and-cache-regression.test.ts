// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build as viteBuild } from 'vite';
import sniceVite from '../../packages/plugin/src/vite';

const ROOT = process.cwd();
const tempDirs: string[] = [];

function makeTempProject(files: Record<string, string>, extraDeps: string[] = []): string {
  const dir = mkdtempSync(join(tmpdir(), 'snice-bs09-'));
  tempDirs.push(dir);
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(ROOT, join(dir, 'node_modules', 'snice'), 'junction');
  for (const pkg of ['tslib', 'pica-route', ...extraDeps]) {
    const p = join(ROOT, 'node_modules', pkg);
    if (existsSync(p)) symlinkSync(p, join(dir, 'node_modules', pkg), 'junction');
  }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'bs09-fixture', type: 'module' }));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(resolve(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

function listDistFiles(dir: string): Record<string, Buffer> {
  const distDir = join(dir, 'dist');
  const out: Record<string, Buffer> = {};
  const walk = (d: string, prefix = '') => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = join(d, entry.name);
      if (entry.isDirectory()) walk(full, rel);
      else out[rel] = readFileSync(full);
    }
  };
  if (existsSync(distDir)) walk(distDir);
  return out;
}

function sumAssets(files: Record<string, Buffer>): { raw: number; gzip: number } {
  let raw = 0;
  let gzip = 0;
  for (const [name, buf] of Object.entries(files)) {
    if (!name.endsWith('.js') && !name.endsWith('.css')) continue;
    raw += buf.length;
    gzip += gzipSync(buf).length;
  }
  return { raw, gzip };
}

describe('BS-09: Distribution dogfooding, bundle-size budgets & cache-hash stability regression', () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
  });

  it('AC-2: dogfooded dist/components and dist/cdn ship zero __esDecorate/__runInitializers while preserving un-themed var() fallbacks', () => {
    const buttonDist = readFileSync(resolve(ROOT, 'dist/components/button/snice-button.js'), 'utf8');
    const buttonCdn = readFileSync(resolve(ROOT, 'dist/cdn/button/snice-button.min.js'), 'utf8');
    const cardCdn = readFileSync(resolve(ROOT, 'dist/cdn/card/snice-card.min.js'), 'utf8');

    for (const code of [buttonDist, buttonCdn, cardCdn]) {
      expect(code).not.toContain('__esDecorate');
      expect(code).not.toContain('__runInitializers');
      // Standalone/CDN consumers may omit theme.css, so var() fallbacks MUST stay intact!
      expect(code).toContain('var(--snice-color-primary,');
    }

    // Card CDN bundle (no icon registry) is dramatically smaller than the 10.6 KB raw / 3.4 KB gz baseline
    const cardBuf = Buffer.from(cardCdn);
    expect(cardBuf.length).toBeLessThan(9_500);
    expect(gzipSync(cardBuf).length).toBeLessThan(3_000);
  });

  it('AC-4(1): minimal Snice app stays far below monolithic 21.1 KB gz baseline via BS-02/03/06/07/08', async () => {
    const dir = makeTempProject({
      'index.html': `<!doctype html><html><body><mini-counter></mini-counter><script type="module" src="/src/main.ts"></script></body></html>`,
      'src/main.ts': `
        import { element, property, render, styles, html, css } from 'snice';

        @element('mini-counter')
        export class MiniCounter extends HTMLElement {
          @property({ type: Number }) count = 0;

          @styles()
          componentStyles() {
            return css\`
              /* comment to strip */
              :host {
                display: inline-block;
                padding: 0.5rem;
              }
            \`;
          }

          @render()
          renderContent() {
            return html\`
              <!-- static comment -->
              <button @click=\${() => { this.count++; }}>
                Count: \${this.count}
              </button>
            \`;
          }
        }
      `,
    });

    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [sniceVite({ caching: false })],
    });

    const files = listDistFiles(dir);
    const { raw, gzip } = sumAssets(files);
    const jsBundle = Object.entries(files)
      .filter(([k]) => k.endsWith('.js'))
      .map(([, b]) => b.toString('utf8'))
      .join('\n');

    expect(jsBundle).not.toContain('__esDecorate');
    expect(jsBundle).not.toContain('applyDecs2203RFactory');
    expect(jsBundle).not.toContain('__SNICE_DEV__');
    expect(jsBundle).not.toContain('useNativeElementControllers');
    expect(jsBundle).not.toContain('IntersectionObserver');
    expect(jsBundle).not.toContain('static comment');
    expect(jsBundle).not.toContain('comment to strip');

    // Calibrated regression ceilings (~12% headroom above measured 68.6 KB raw / 19.0 KB gz;
    // far below the 126 KB raw / 36.1 KB gz full runtime and below the 21.1 KB gz baseline).
    expect(raw).toBeLessThan(77_000);
    expect(gzip).toBeLessThan(21_000);

    // Modular parts + precompileTemplates:true bypasses prepareTemplate/TreeWalker and
    // tree-shakes unused part families + keyboard-filter for a major further drop (~14.2 KB gz).
    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [sniceVite({ caching: false, precompileTemplates: true })],
      build: { outDir: 'dist-pre', emptyOutDir: true },
    });
    const preFiles: Record<string, Buffer> = {};
    const preAssets = join(dir, 'dist-pre/assets');
    for (const f of readdirSync(preAssets)) {
      preFiles[f] = readFileSync(join(preAssets, f));
    }
    const preSizes = sumAssets(preFiles);
    const preBundle = Object.entries(preFiles)
      .filter(([k]) => k.endsWith('.js'))
      .map(([, b]) => b.toString('utf8'))
      .join('\n');

    expect(preBundle).not.toContain('createTreeWalker');
    expect(preBundle).not.toContain('ArrowUp');
    expect(preBundle).not.toContain('...props');
    expect(preBundle).not.toContain('conditional-if');
    expect(preSizes.raw).toBeLessThan(raw - 15_000);
    expect(preSizes.gzip).toBeLessThan(16_000);
  }, 30000);

  it('AC-4(2): medium Snice SPA shrinks measurably with snice() vs baseline and keeps 0% hash churn on stable tiers across app edits', async () => {
    const makeSpaFiles = (greeting: string): Record<string, string> => ({
      'index.html': `<!doctype html><html><body><app-shell></app-shell><script type="module" src="/src/main.ts"></script></body></html>`,
      'src/main.ts': `
        import { element, property, render, styles, html, css, Router } from 'snice';
        import 'snice/components/theme/theme.css';
        import 'snice/components/button/snice-button';
        import 'snice/components/card/snice-card';
        import 'snice/components/badge/snice-badge';
        import 'snice/components/alert/snice-alert';
        import 'snice/components/chip/snice-chip';
        import 'snice/components/divider/snice-divider';
        import 'snice/components/spinner/snice-spinner';
        import 'snice/components/switch/snice-switch';
        import 'snice/components/tag/snice-tag';
        import 'snice/components/tooltip/snice-tooltip';

        export const router = Router({ target: '#app', type: 'hash' });

        @element('app-shell')
        export class AppShell extends HTMLElement {
          @property() title = ${JSON.stringify(greeting)};

          @styles()
          componentStyles() {
            return css\`
              /* layout styles */
              :host {
                display: block;
                padding: var(--snice-spacing-md, 1rem);
                color: var(--snice-color-text, rgb(23 23 23));
              }
            \`;
          }

          @render()
          renderContent() {
            return html\`
              <!-- shell markup -->
              <snice-card>
                <h1>\${this.title}</h1>
                <snice-button variant="primary">Save</snice-button>
                <snice-badge>New</snice-badge>
              </snice-card>
            \`;
          }
        }
      `,
    });

    // Baseline: stripCssFallbacks: false, minifyTemplates: false, minifyCss: false (approximating raw non-plugin Vite build)
    const dirBaseline = makeTempProject(makeSpaFiles('Hello v1'));
    const dirOptimized = makeTempProject(makeSpaFiles('Hello v1'));

    await Promise.all([
      viteBuild({
        root: dirBaseline,
        logLevel: 'silent',
        plugins: [
          sniceVite({
            minifyTemplates: false,
            minifyCss: false,
            stripCssFallbacks: false,
            caching: false,
          }),
        ],
      }),
      viteBuild({
        root: dirOptimized,
        logLevel: 'silent',
        plugins: [sniceVite()],
      }),
    ]);

    const baseSizes = sumAssets(listDistFiles(dirBaseline));
    const optV1Files = listDistFiles(dirOptimized);
    const optSizes = sumAssets(optV1Files);

    // Measurable raw & gzip JS+CSS reduction vs baseline
    expect(optSizes.raw).toBeLessThan(baseSizes.raw - 4_000);
    expect(optSizes.gzip).toBeLessThan(baseSizes.gzip);

    // Tiered cache chunks exist
    const findTier = (files: Record<string, Buffer>, prefix: string, ext: string) =>
      Object.keys(files).find((k) => k.includes(prefix) && k.endsWith(ext))!;

    const rt1 = findTier(optV1Files, 'snice-runtime', '.js');
    const comp1 = findTier(optV1Files, 'snice-components', '.js');
    const theme1 = findTier(optV1Files, 'snice-theme', '.css');
    const app1 = findTier(optV1Files, 'index-', '.js');
    expect(rt1).toBeDefined();
    expect(comp1).toBeDefined();
    expect(theme1).toBeDefined();
    expect(app1).toBeDefined();

    // Edit app page code and rebuild -> 0% hash churn on snice-runtime, snice-components, snice-theme!
    writeFileSync(join(dirOptimized, 'src/main.ts'), makeSpaFiles('Hello v2 updated copy')['src/main.ts']);
    await viteBuild({
      root: dirOptimized,
      logLevel: 'silent',
      plugins: [sniceVite()],
    });
    const optV2Files = listDistFiles(dirOptimized);

    expect(findTier(optV2Files, 'snice-runtime', '.js')).toBe(rt1);
    expect(findTier(optV2Files, 'snice-components', '.js')).toBe(comp1);
    expect(findTier(optV2Files, 'snice-theme', '.css')).toBe(theme1);
    expect(findTier(optV2Files, 'index-', '.js')).not.toBe(app1);
  }, 45000);

  it('AC-4(3): React + Snice app isolates vendor-react, snice-runtime, snice-components, and snice-theme with 0% hash churn on all four across React edits', async () => {
    const makeReactEntry = (label: string) => `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import 'snice/components/theme/theme.css';
      import 'snice/components/button/snice-button';
      import 'snice/components/card/snice-card';
      import 'snice/components/badge/snice-badge';
      import 'snice/components/alert/snice-alert';
      import 'snice/components/tag/snice-tag';

      function App() {
        return React.createElement(
          'snice-card',
          null,
          React.createElement('snice-button', { variant: 'primary' }, ${JSON.stringify(label)})
        );
      }

      const root = document.getElementById('root');
      if (root) createRoot(root).render(React.createElement(App));
    `;

    const dir = makeTempProject(
      {
        'index.html': `<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.ts"></script></body></html>`,
        'src/main.ts': makeReactEntry('React v1'),
      },
      ['react', 'react-dom', 'scheduler']
    );

    await viteBuild({ root: dir, logLevel: 'silent', plugins: [sniceVite()] });
    const v1 = listDistFiles(dir);
    const findTier = (files: Record<string, Buffer>, prefix: string, ext: string) =>
      Object.keys(files).find((k) => k.includes(prefix) && k.endsWith(ext))!;

    const react1 = findTier(v1, 'vendor-react', '.js');
    const rt1 = findTier(v1, 'snice-runtime', '.js');
    const comp1 = findTier(v1, 'snice-components', '.js');
    const theme1 = findTier(v1, 'snice-theme', '.css');
    const app1 = findTier(v1, 'index-', '.js');

    expect(react1).toBeDefined();
    expect(rt1).toBeDefined();
    expect(comp1).toBeDefined();
    expect(theme1).toBeDefined();

    // Edit React app code and rebuild
    writeFileSync(join(dir, 'src/main.ts'), makeReactEntry('React v2 changed'));
    await viteBuild({ root: dir, logLevel: 'silent', plugins: [sniceVite()] });
    const v2 = listDistFiles(dir);

    expect(findTier(v2, 'vendor-react', '.js')).toBe(react1);
    expect(findTier(v2, 'snice-runtime', '.js')).toBe(rt1);
    expect(findTier(v2, 'snice-components', '.js')).toBe(comp1);
    expect(findTier(v2, 'snice-theme', '.css')).toBe(theme1);
    expect(findTier(v2, 'index-', '.js')).not.toBe(app1);
  }, 45000);
});
