// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import { build as viteBuild } from 'vite';
import sniceRollup from '../../packages/plugin/src/rollup';
import sniceVite from '../../packages/plugin/src/vite';
import { replaceSniceDevIdentifier } from '../../packages/plugin/src/dev-define';
import { stripChunkCssFallbacks } from '../../packages/plugin/src/css';
import { transformDecorators } from '../../packages/plugin/src/decorators';
import { transformTemplates } from '../../packages/plugin/src/templates';

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
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'hardening-fixture', type: 'module' }));
  return dir;
}

describe('Phase 2: Parser hardening & renderChunk sourcemap preservation', () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
  });

  it('handles modern TS syntax: satisfies with comments/strings, using, accessor, generic decorators, and nested template literals in Rollup', async () => {
    const dir = createFixtureDir('snice-p2-parse-');
    const entry = join(dir, 'entry.ts');
    writeFileSync(
      entry,
      `
      import { element, property, render, styles, html, css } from 'snice';

      type Config = { mode: string };
      export const cfg = { mode: "this string says satisfies inside" } /* satisfies */ satisfies Config;

      export const castVal = (<string>("hello")) as string;

      export class WithAccessor {
        public accessor count: number = 41;
        static accessor version: string = '1.0';
      }

      export function useResource(factory: () => Disposable) {
        using handle: Disposable = factory();
        return handle;
      }

      function genericDec<T>(tag: T) {
        return function (val: any, _ctx: any) { return val; };
      }

      @element('hardened-el')
      export class HardenedEl extends HTMLElement {
        @property({ type: Number }) value = 1;

        @genericDec<string>('meta')
        greet(name: string) {
          const nested = \`outer \${\`inner-\${name}\`}\`;
          return nested;
        }

        @styles()
        componentStyles() {
          return css\`:host { color: var(--snice-color-primary, rgb(37 99 235)); }\`;
        }

        @render()
        renderContent() {
          const items = ['a', 'b'];
          return html\`<div>\${items.map((x) => html\`<span>\${\`item:\${x}\`}</span>\`)}</div>\`;
        }
      }
      `
    );

    const bundle = await rollup({
      input: entry,
      external: ['snice'],
      plugins: [
        nodeResolve({ extensions: ['.ts', '.js'] }),
        sniceRollup({ caching: false, stripCssFallbacks: true }),
      ],
    });
    let code = '';
    let map: any = null;
    try {
      const { output } = await bundle.generate({ format: 'es', sourcemap: true });
      code = output[0].code;
      map = output[0].map;
    } finally {
      await bundle.close();
    }

    // `satisfies` stripped cleanly without corrupting string literal containing "satisfies"
    expect(code).toContain('this string says satisfies inside');
    expect(code).not.toMatch(/\}\s*satisfies\s+Config/);

    // `accessor` lowered to ES2022 private backing field + getter/setter and executes!
    expect(code).toContain('get count()');
    expect(code).toContain('set count(');
    expect(code).toContain('static get version()');

    // `using` preserved with type annotation stripped
    expect(code).toContain('using handle = factory()');

    // Nested template literals & CSS fallback stripping worked
    expect(code).toContain('var(--snice-color-primary)');
    expect(code).not.toContain('rgb(37 99 235)');

    // Valid composed sourcemap preserved through transform + renderChunk!
    expect(map).not.toBeNull();
    expect(map.version).toBe(3);
    expect(typeof map.mappings).toBe('string');
    expect(map.mappings.length).toBeGreaterThan(20);
    expect(map.sources.some((s: string) => s.includes('entry.ts'))).toBe(true);
    expect(map.sourcesContent?.some((c: string | null) => typeof c === 'string' && c.includes('HardenedEl'))).toBe(true);
  });

  it('dev-define distinguishes regex literals, division, property keys, and template text vs expressions', () => {
    const src = `
      const re = /__SNICE_DEV__/g;
      const div = a / b / (__SNICE_DEV__ ? 2 : 1);
      const tplText = \`literal __SNICE_DEV__ and expr \${\`nested \${__SNICE_DEV__}\`}\`;
      const obj = { __SNICE_DEV__: 1, shorthand: obj.__SNICE_DEV__, flag: __SNICE_DEV__ };
      export { re, div, tplText, obj };
    `;

    const res = replaceSniceDevIdentifier(src, false, 'test.js');
    expect(res).not.toBeNull();
    expect(res!.code).toContain('const re = /__SNICE_DEV__/g;');
    expect(res!.code).toContain('const div = a / b / (false ? 2 : 1);');
    expect(res!.code).toContain('literal __SNICE_DEV__ and expr ${`nested ${false}`}');
    expect(res!.code).toContain('{ __SNICE_DEV__: 1, shorthand: obj.__SNICE_DEV__, flag: false }');
    expect(res!.map.version).toBe(3);
    expect(res!.map.mappings.length).toBeGreaterThan(0);
    expect(res!.map.sourcesContent?.[0]).toBe(src);
  });

  it('stripChunkCssFallbacks emits a valid V3 sourcemap with source + sourcesContent and Vite build preserves production sourcemaps', async () => {
    const chunkCode = `export const s = ":host{color:var(--snice-color-primary, rgb(37 99 235));}";\nexport const after = 123;\n`;
    const allowlist = new Set(['--snice-color-primary']);
    const stripped = stripChunkCssFallbacks(chunkCode, allowlist, 'assets/chunk-abc.js');
    expect(stripped).not.toBeNull();
    expect(stripped!.code).toContain('var(--snice-color-primary)');
    expect(stripped!.map.version).toBe(3);
    expect(stripped!.map.sources).toEqual(['assets/chunk-abc.js']);
    expect(stripped!.map.sourcesContent).toEqual([chunkCode]);
    expect(stripped!.map.mappings.length).toBeGreaterThan(0);

    // End-to-end Vite production build with sourcemap: true and stripCssFallbacks: 'auto'
    const dir = createFixtureDir('snice-p2-smap-');
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(
      join(dir, 'index.html'),
      `<!doctype html><html><body><sm-el></sm-el><script type="module" src="/src/main.ts"></script></body></html>`
    );
    writeFileSync(
      join(dir, 'src/main.ts'),
      `
      import 'snice/components/theme/theme.css';
      import { element, render, styles, html, css } from 'snice';
      @element('sm-el')
      export class SmEl extends HTMLElement {
        @styles() s() { return css\`:host { color: var(--snice-color-primary, rgb(37 99 235)); }\`; }
        @render() r() { return html\`<div>ok</div>\`; }
      }
      `
    );

    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [sniceVite({ caching: false })],
      build: { outDir: 'dist', emptyOutDir: true, sourcemap: true },
    });

    const assetsDir = join(dir, 'dist/assets');
    const jsFile = readdirSync(assetsDir).find((f) => f.endsWith('.js'))!;
    const mapFile = `${jsFile}.map`;
    expect(existsSync(join(assetsDir, mapFile))).toBe(true);

    const jsContent = readFileSync(join(assetsDir, jsFile), 'utf8');
    expect(jsContent).toContain('var(--snice-color-primary)');
    expect(jsContent).not.toContain('rgb(37 99 235)');

    const parsedMap = JSON.parse(readFileSync(join(assetsDir, mapFile), 'utf8'));
    expect(parsedMap.version).toBe(3);
    expect(parsedMap.mappings.length).toBeGreaterThan(20);
    expect(parsedMap.sources.some((s: string) => s.includes('main.ts'))).toBe(true);
  }, 30000);

  it('transformTemplates & transformDecorators parse TS files with using, accessor, and satisfies without failing', () => {
    const src = `
      import { html } from 'snice';
      export class Box {
        accessor title: string = 'hi';
        render(r: () => Disposable) {
          using _d: Disposable = r();
          const label = this.title satisfies string;
          return html\`<div><!-- remove --><span>\${label}</span></div>\`;
        }
      }
    `;
    const dec = transformDecorators(src, { stripTypeScript: true, id: 'box.ts' });
    expect(dec).not.toBeNull();
    expect(dec!.code).toContain('get title()');
    const tmpl = transformTemplates(src, { id: 'box.ts', minifyTemplates: true, precompileTemplates: true });
    expect(tmpl).not.toBeNull();
    expect(tmpl!.code).not.toContain('<!-- remove -->');
    expect(tmpl!.code).toContain('__sniceTemplate');
  });
});
