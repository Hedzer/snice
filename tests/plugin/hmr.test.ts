import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build as viteBuild, createServer } from 'vite';
import sniceVite from '../../packages/plugin/src/vite';
import { HMR_RUNTIME_CODE, HMR_SPECIFIER, HMR_VIRTUAL_ID, transformHmr } from '../../packages/plugin/src/hmr';
import { transformDecorators } from '../../packages/plugin/src/decorators';
import * as sniceCore from '../../packages/core/src/index';

const ROOT = process.cwd();
const tempDirs: string[] = [];

function createFixtureDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(ROOT, join(dir, 'node_modules', 'snice'), 'junction');
  for (const pkg of ['tslib', 'pica-route']) {
    const p = join(ROOT, 'node_modules', pkg);
    if (existsSync(p)) symlinkSync(p, join(dir, 'node_modules', pkg), 'junction');
  }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'hmr-fixture', type: 'module' }));
  return dir;
}

describe('Phase 2: Dev-server HMR for @element classes (snice/vite)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    const state = (globalThis as any).__sniceHmrState;
    if (state?.origDefine) {
      customElements.define = state.origDefine;
      delete (globalThis as any).__sniceHmrState;
    }
    while (tempDirs.length > 0) {
      rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
  });

  it('emits 0 bytes of HMR runtime or hooks in production builds', async () => {
    const dir = createFixtureDir('snice-hmr-prod-');
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(
      join(dir, 'index.html'),
      `<!doctype html><html><body><prod-el></prod-el><script type="module" src="/src/main.ts"></script></body></html>`
    );
    writeFileSync(
      join(dir, 'src/main.ts'),
      `
      import { element, property, render, html } from 'snice';
      @element('prod-el')
      export class ProdEl extends HTMLElement {
        @property() text = 'prod';
        @render() renderContent() { return html\`<span>\${this.text}</span>\`; }
      }
      `
    );

    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [sniceVite({ caching: false })],
      build: { outDir: 'dist', emptyOutDir: true },
    });

    const js = readdirSync(join(dir, 'dist/assets'))
      .filter((f) => f.endsWith('.js'))
      .map((f) => readFileSync(join(dir, 'dist/assets', f), 'utf8'))
      .join('\n');

    expect(js).not.toContain('__sniceHmrInstall');
    expect(js).not.toContain('__sniceHmrInits');
    expect(js).not.toContain('virtual:snice-hmr');
    expect(js).not.toContain('import.meta.hot');
  }, 30000);

  it('serves HMR-instrumented @element modules and virtual runtime in Vite dev server (and respects hmr: false)', async () => {
    const dir = createFixtureDir('snice-hmr-serve-');
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(
      join(dir, 'src/counter.ts'),
      `
      import { element, property, render, styles, html, css } from 'snice';
      @element('dev-counter')
      export class DevCounter extends HTMLElement {
        @property({ type: Number }) count = 0;
        @styles() componentStyles() { return css\`:host { color: red; }\`; }
        @render() renderContent() { return html\`<span>\${this.count}</span>\`; }
      }
      `
    );

    const server = await createServer({
      root: dir,
      logLevel: 'silent',
      server: { middlewareMode: true },
      plugins: [sniceVite()],
    });
    try {
      const modRes = await server.transformRequest('/src/counter.ts');
      expect(modRes?.code).toContain('__sniceHmrInstall');
      expect(modRes?.code).toContain('__sniceHmrInits');
      expect(modRes?.code).toContain('import.meta.hot.accept');

      const rtRes = await server.transformRequest(HMR_SPECIFIER);
      expect(rtRes?.code).toContain('function __sniceHmrInstall');
      expect(rtRes?.code).toContain('sniceHmrDefine');
    } finally {
      await server.close();
    }

    // With hmr: false, serve mode does NOT inject HMR hooks
    const serverNoHmr = await createServer({
      root: dir,
      logLevel: 'silent',
      server: { middlewareMode: true },
      plugins: [sniceVite({ hmr: false })],
    });
    try {
      const modRes = await serverNoHmr.transformRequest('/src/counter.ts');
      expect(modRes?.code).not.toContain('__sniceHmrInstall');
      expect(modRes?.code).not.toContain('import.meta.hot.accept');
    } finally {
      await serverNoHmr.close();
    }
  }, 30000);

  it('patches live mounted instances (including inside shadow roots) on hot reload without NotSupportedError while preserving instance state', async () => {
    // Load the exact HMR runtime code in-process
    const hmrModUrl = `data:text/javascript;base64,${Buffer.from(HMR_RUNTIME_CODE).toString('base64')}`;
    const hmrRuntime = await import(/* @vite-ignore */ hmrModUrl);
    (globalThis as any).__hmrTestSnice = sniceCore;
    (globalThis as any).__hmrTestRuntime = hmrRuntime;

    const evalHotModule = async (tsSource: string) => {
      const lowered = transformDecorators(tsSource, { stripTypeScript: true, id: 'hmr-counter.ts' })!;
      const instrumented = transformHmr(lowered.code, 'hmr-counter.ts')!;
      const runnable = instrumented.code
        .replace(
          /import\s*\{([^}]+)\}\s*from\s*['"]snice['"];?/g,
          (_, specs: string) => `const {${specs.replace(/\bas\b/g, ':')}} = globalThis.__hmrTestSnice;`
        )
        .replace(
          /import\s*\{([^}]+)\}\s*from\s*['"]virtual:snice-hmr['"];?/g,
          (_, specs: string) => `const {${specs.replace(/\bas\b/g, ':')}} = globalThis.__hmrTestRuntime;`
        )
        .replace(/if\s*\(import\.meta\.hot\)\s*\{[^}]*\}/g, '');
      const url = `data:text/javascript;base64,${Buffer.from(runnable).toString('base64')}`;
      return await import(/* @vite-ignore */ url);
    };

    // 1. Load v1 of <hmr-counter> and a parent <hmr-host> hosting a nested <hmr-counter>
    await evalHotModule(`
      import { element, property, render, styles, html, css } from 'snice';
      @element('hmr-live-counter')
      export class HmrLiveCounter extends HTMLElement {
        @property({ type: Number }) count = 0;
        note = 'initial';

        @styles()
        componentStyles() {
          return css\`:host { color: red; }\`;
        }

        @render()
        renderContent() {
          return html\`<button class="btn" @click=\${() => { this.count++; }}>v1: \${this.count}</button>\`;
        }
      }
    `);

    await evalHotModule(`
      import { element, render, html } from 'snice';
      @element('hmr-live-host')
      export class HmrLiveHost extends HTMLElement {
        @render()
        renderContent() {
          return html\`<section><hmr-live-counter class="nested"></hmr-live-counter></section>\`;
        }
      }
    `);

    const el = document.createElement('hmr-live-counter') as any;
    const host = document.createElement('hmr-live-host') as any;
    document.body.appendChild(el);
    document.body.appendChild(host);
    await el.ready;
    await host.ready;

    const nested = host.shadowRoot!.querySelector('.nested') as any;
    await nested.ready;

    // Mutate state on both top-level and shadow-nested instances
    el.count = 5;
    el.note = 'preserved-user-state';
    nested.count = 9;
    await el.rendered;
    await nested.rendered;

    expect(el.shadowRoot!.querySelector('.btn')!.textContent).toBe('v1: 5');
    expect(nested.shadowRoot!.querySelector('.btn')!.textContent).toBe('v1: 9');

    // 2. Hot-reload v2: updated template ("v2:"), updated styles (color: blue), new method double()
    await evalHotModule(`
      import { element, property, render, styles, html, css } from 'snice';
      @element('hmr-live-counter')
      export class HmrLiveCounter extends HTMLElement {
        @property({ type: Number }) count = 0;
        note = 'initial';

        double() {
          return this.count * 2;
        }

        @styles()
        componentStyles() {
          return css\`:host { color: blue; }\`;
        }

        @render()
        renderContent() {
          return html\`<button class="btn" @click=\${() => { this.count++; }}>v2: \${this.count}</button>\`;
        }
      }
    `);

    // Exact same DOM instances, state 100% preserved, template + styles + prototype updated!
    expect(document.querySelector('hmr-live-counter')).toBe(el);
    expect(el.count).toBe(5);
    expect(el.note).toBe('preserved-user-state');
    expect(el.double()).toBe(10);
    expect(el.shadowRoot!.querySelector('.btn')!.textContent).toBe('v2: 5');

    // Nested shadow-root instance ALSO updated while preserving count === 9!
    expect(nested.count).toBe(9);
    expect(nested.double()).toBe(18);
    expect(nested.shadowRoot!.querySelector('.btn')!.textContent).toBe('v2: 9');

    // Styles updated from red -> blue (either adoptedStyleSheets or <style data-snice-style>)
    const readCss = (root: ShadowRoot) => {
      if (root.adoptedStyleSheets?.length) {
        return Array.from(root.adoptedStyleSheets)
          .map((s: any) => Array.from(s.cssRules || []).map((r: any) => r.cssText).join('\n'))
          .join('\n');
      }
      return Array.from(root.querySelectorAll('style[data-snice-style]'))
        .map((s) => s.textContent)
        .join('\n');
    };
    expect(readCss(el.shadowRoot!)).toContain('blue');
    expect(readCss(el.shadowRoot!)).not.toContain('red');

    // Live interaction still works on updated template
    (el.shadowRoot!.querySelector('.btn') as HTMLElement).click();
    await el.rendered;
    expect(el.count).toBe(6);
    expect(el.shadowRoot!.querySelector('.btn')!.textContent).toBe('v2: 6');

    delete (globalThis as any).__hmrTestSnice;
    delete (globalThis as any).__hmrTestRuntime;
  }, 30000);
});
