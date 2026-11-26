// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build as viteBuild } from 'vite';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import swc from 'unplugin-swc';
import { transformDecorators } from '../../packages/plugin/src/decorators';

const ROOT = process.cwd();
const USE_BUILT = process.env.TEST_BUILT === 'true';

async function loadVitePlugin() {
  return USE_BUILT
    ? await import(resolve(ROOT, 'dist/plugin/vite.js'))
    : await import('../../packages/plugin/src/vite');
}

async function loadRollupPlugin() {
  return USE_BUILT
    ? await import(resolve(ROOT, 'dist/plugin/rollup.js'))
    : await import('../../packages/plugin/src/rollup');
}

const tempDirs: string[] = [];

function createFixtureDir(prefix: string, linkSnice = true): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  if (linkSnice) {
    mkdirSync(join(dir, 'node_modules'), { recursive: true });
    symlinkSync(ROOT, join(dir, 'node_modules', 'snice'), 'junction');
    for (const pkg of ['tslib', 'pica-route']) {
      const pkgPath = join(ROOT, 'node_modules', pkg);
      if (existsSync(pkgPath)) {
        symlinkSync(pkgPath, join(dir, 'node_modules', pkg), 'junction');
      }
    }
  }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'fixture', type: 'module' }));
  return dir;
}

const BUTTON_LIKE_TS = `
import { element, property, query, render, styles, watch, on, dispatch, html, css } from 'snice';

@element('demo-btn')
export class DemoBtn extends HTMLElement {
  @property() variant: 'default' | 'primary' | 'danger' = 'default';
  @property() size: 'small' | 'medium' | 'large' = 'medium';
  @property() type: 'button' | 'submit' | 'reset' = 'button';
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) loading = false;
  @property({ type: Boolean }) outline = false;
  @property({ type: Boolean }) pill = false;
  @property({ type: Boolean }) circle = false;
  @property() href = '';
  @property() target = '';
  @property() icon = '';
  @property() iconPlacement = 'start';
  @property() label = 'Click';

  @query('button') button?: HTMLButtonElement;
  @query('.label') labelEl?: HTMLElement;
  @query('.spinner') spinnerEl?: HTMLElement;
  @query('.icon') iconEl?: HTMLElement;
  @query('slot') slotEl?: HTMLSlotElement;

  @watch('disabled')
  onDisabledChange(_old: boolean, _next: boolean) {}

  @on('click', 'button')
  handleClick(e: MouseEvent) {
    if (!this.disabled) this.emitClick(e);
  }

  @dispatch('demo-click', { bubbles: true, composed: true })
  emitClick(originalEvent: MouseEvent) {
    return { originalEvent };
  }

  @styles()
  componentStyles() {
    return css\`:host { display: inline-block; }\`;
  }

  @render()
  renderContent() {
    return html\`<button ?disabled=\${this.disabled}><span class="label">\${this.label}</span><slot></slot></button>\`;
  }
}
`;

describe('BS-06: Build-time Snice decorator lowering & TC39 2022-03 fallback (bundler checks)', () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
  });

  it('AC-2: lowers snice-button-sized component with >50% raw JS reduction vs unplugin-swc and zero __esDecorate/applyDecs2203RFactory', async () => {
    const { default: sniceVite } = await loadVitePlugin();
    const dir = createFixtureDir('snice-bs06-size-');
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'src/demo-btn.ts'), BUTTON_LIKE_TS);

    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [sniceVite()],
      build: {
        outDir: 'dist-snice',
        emptyOutDir: true,
        minify: false,
        lib: { entry: join(dir, 'src/demo-btn.ts'), formats: ['es'], fileName: 'demo-btn' },
        rollupOptions: { external: ['snice'] },
      },
    });

    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [
        swc.vite({
          jsc: {
            parser: { syntax: 'typescript', decorators: true },
            transform: { decoratorVersion: '2022-03', useDefineForClassFields: false },
          },
        }),
      ],
      build: {
        outDir: 'dist-swc',
        emptyOutDir: true,
        minify: false,
        lib: { entry: join(dir, 'src/demo-btn.ts'), formats: ['es'], fileName: 'demo-btn' },
        rollupOptions: { external: ['snice'] },
      },
    });

    const sniceJs = readFileSync(join(dir, 'dist-snice/demo-btn.js'), 'utf8');
    const swcJs = readFileSync(join(dir, 'dist-swc/demo-btn.js'), 'utf8');

    expect(sniceJs).not.toContain('__esDecorate');
    expect(sniceJs).not.toContain('__runInitializers');
    expect(sniceJs).not.toContain('applyDecs2203RFactory');
    expect(swcJs).toContain('applyDecs2203RFactory');

    const reduction = 1 - Buffer.byteLength(sniceJs, 'utf8') / Buffer.byteLength(swcJs, 'utf8');
    expect(reduction).toBeGreaterThan(0.5);
  }, 30000);

  it('AC-5: snice doctor DECORATOR_PROBE_SOURCE builds in external probeDir without node_modules using plugins:[snice()]', async () => {
    const { default: sniceVite } = await loadVitePlugin();
    const probeDir = createFixtureDir('snice-bs06-probe-', false);

    const DECORATOR_PROBE_SOURCE = `function probeClass(tag: string) {
  return (cls: any) => cls;
}
function probeField(marker: string) {
  return (value: any, ctx: any) =>
    function (this: any, initial: any) {
      this.constructor.prototype[marker] = true;
      return initial;
    };
}

@probeClass('probe-class')
class SniceDoctorProbe extends HTMLElement {
  @probeField('snice-doctor-probe-installed')
  $probe: any;
}
export { SniceDoctorProbe };
`;
    writeFileSync(join(probeDir, 'index.html'), '<script type="module" src="/probe.ts"></script>');
    writeFileSync(join(probeDir, 'probe.ts'), DECORATOR_PROBE_SOURCE);

    await viteBuild({
      root: probeDir,
      logLevel: 'silent',
      plugins: [sniceVite()],
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        minify: false,
        rollupOptions: { output: { manualChunks: () => undefined } },
      },
    });

    const bundle = readdirSync(join(probeDir, 'dist/assets'))
      .filter(f => f.endsWith('.js'))
      .map(f => readFileSync(join(probeDir, 'dist/assets', f), 'utf8'))
      .join('\n');

    expect(bundle).toContain('snice-doctor-probe-installed');
    expect(bundle).not.toContain('applyDecs2203RFactory');
  }, 30000);

  it('AC-6: minimal lowered element bundled via snice/rollup against dist/index.esm.js excludes unused core subsystems', async () => {
    const { default: sniceRollup } = await loadRollupPlugin();
    const dir = createFixtureDir('snice-bs06-treeshake-');
    const entry = join(dir, 'minimal.ts');
    writeFileSync(
      entry,
      `
      import { element, property, render, html, css } from 'snice';
      @element('min-lowered')
      export class MinLowered extends HTMLElement {
        @property({ type: Number }) count: number = 0;
        @render()
        renderContent() {
          return html\`<span>\${this.count}</span>\`;
        }
      }
      export const s = css\`:host { display: block; }\`;
      `
    );

    const bundle = await rollup({
      input: entry,
      plugins: [nodeResolve(), sniceRollup({ caching: false })],
    });
    try {
      const { output } = await bundle.generate({ format: 'es' });
      const modules = Object.keys(output[0].modules).map(m => m.replace(/\\/g, '/'));
      for (const excluded of ['controller', 'observe', 'on', 'request-response', 'context', 'events', 'method-decorators', 'router', 'daemon']) {
        expect(modules.some(m => m.endsWith(`/dist/_core/${excluded}.js`)), `unexpected _core/${excluded}.js`).toBe(false);
      }
      expect(output[0].code).not.toContain('__esDecorate');
    } finally {
      await bundle.close();
    }
  }, 30000);

  it('AC-4/AC-7: handles aliased imports, non-Snice same-name decorators, syntax error file/line/col, decorators:false bypass, sourcemaps, and lean dependencies', () => {
    // Aliased Snice import lowers cleanly
    const aliased = transformDecorators(
      `import { element as el, property as p } from 'snice';\n@el('a-el')\nclass A extends HTMLElement { @p() name: string = 'hi'; }\n`,
      { stripTypeScript: false, id: 'aliased.ts' }
    );
    expect(aliased).not.toBeNull();
    expect(aliased!.code).toContain('__sniceField(p(), "name"');
    expect(aliased!.code).toContain('el(\'a-el\')(A');
    expect(aliased!.map.sourcesContent?.[0]).toContain("@el('a-el')");

    // Non-Snice local decorator with same name `property` uses TC39 fallback, NOT Snice lowering
    const localSameName = transformDecorators(
      `function property() { return (_v: any, _c: any) => (x: any) => x; }\nclass LocalOnly { @property() x = 1; }\n`,
      { stripTypeScript: false, id: 'local.ts' }
    );
    expect(localSameName).not.toBeNull();
    expect(localSameName!.code).toContain('__tc39Apply');
    expect(localSameName!.code).not.toContain('__sniceField');

    // Cross-module @page falls back whole class cleanly so member metadata exists before @page executes
    const crossModulePage = transformDecorators(
      `import { property } from 'snice';\nimport { page } from '../router';\n@page({ tag: 'my-page', routes: ['/'] })\nexport class MyPage extends HTMLElement { @property() title = 'Hi'; }\n`,
      { stripTypeScript: false, id: 'my-page.ts' }
    );
    expect(crossModulePage).not.toBeNull();
    expect(crossModulePage!.code).toContain('__tc39Apply');
    expect(crossModulePage!.code).not.toContain('__sniceField');

    // Invalid TS syntax fails fast with file, line, and column
    expect(() =>
      transformDecorators(`@element('bad')\nclass Bad {\n  const x = ;\n}`, {
        stripTypeScript: false,
        id: '/app/src/bad.ts',
      })
    ).toThrow(/\/app\/src\/bad\.ts:3:/);

    // Lean dependencies check: root package.json dependencies MUST NOT include typescript or @swc/core
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
    expect(pkg.dependencies.typescript).toBeUndefined();
    expect(pkg.dependencies['@swc/core']).toBeUndefined();
    expect(pkg.dependencies['unplugin-swc']).toBeUndefined();
  });

  it('AC-7: decorators:false skips BOTH Snice lowering and TC39 fallback', async () => {
    const { default: sniceVite } = await loadVitePlugin();
    const plugin = sniceVite({ decorators: false });
    const res = plugin.transform(
      `import { element } from 'snice';\n@element('x-a') class A extends HTMLElement {}\n`,
      '/app/src/a.ts'
    );
    expect(res).toBeNull();
  });
});
