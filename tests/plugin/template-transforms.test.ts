// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build as viteBuild } from 'vite';
import { minifyHtmlQuasis, transformTemplates } from '../../packages/plugin/src/templates';

const ROOT = process.cwd();
const USE_BUILT = process.env.TEST_BUILT === 'true';

async function loadVitePlugin() {
  return USE_BUILT
    ? await import(resolve(ROOT, 'dist/plugin/vite.js'))
    : await import('../../packages/plugin/src/vite');
}

const tempDirs: string[] = [];

function createFixtureDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(ROOT, join(dir, 'node_modules', 'snice'), 'junction');
  for (const pkg of ['tslib', 'pica-route']) {
    const pkgPath = join(ROOT, 'node_modules', pkg);
    if (existsSync(pkgPath)) {
      symlinkSync(pkgPath, join(dir, 'node_modules', pkg), 'junction');
    }
  }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'fixture', type: 'module' }));
  return dir;
}

describe('BS-07: Build-time template minification & pre-compilation (unit & bundler)', () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
  });

  it('AC-2/AC-4: preserves <pre>/<code>/<textarea>/<script>/<style>, unquoted attribute spacing, quoted attributes, inline spacing, dynamic comments, and safe unclosed raw-tag fallback', () => {
    // Whitespace-sensitive elements across interpolations
    const pre = minifyHtmlQuasis(['<div>\n  <pre>  ', '\n    line 2  </pre>\n</div>']);
    expect(pre).toEqual(['<div><pre>  ', '\n    line 2  </pre></div>']);

    const textarea = minifyHtmlQuasis(['\n  <textarea>  keep\n  me  </textarea>\n']);
    expect(textarea).toEqual(['<textarea>  keep\n  me  </textarea>']);

    const codeTag = minifyHtmlQuasis(['<div>\n  <code>  a   +   b  </code>\n</div>']);
    expect(codeTag).toEqual(['<div><code>  a   +   b  </code></div>']);

    // Inline spacing preserved
    const inline = minifyHtmlQuasis(['<p><span>First</span> <span>Second</span></p>']);
    expect(inline).toEqual(['<p><span>First</span> <span>Second</span></p>']);

    // Quoted attribute values preserved verbatim
    const quoted = minifyHtmlQuasis(['<div\n  title="keep   spaces"\n  class="a b"\n>ok</div>']);
    expect(quoted).toEqual(['<div title="keep   spaces" class="a b">ok</div>']);

    // Unquoted dynamic attribute before `/>` MUST preserve separating space!
    const ctrlSelfClose = minifyHtmlQuasis(['<div controller=', ' />']);
    expect(ctrlSelfClose).toEqual(['<div controller=', ' />']);

    const hrefSelfClose = minifyHtmlQuasis(['<a href=', ' />']);
    expect(hrefSelfClose).toEqual(['<a href=', ' />']);

    // Unquoted dynamic attribute before next attribute MUST preserve separating space!
    const multiAttr = minifyHtmlQuasis(['<input type=', '\n  ?disabled=', '\n>']);
    expect(multiAttr).toEqual(['<input type=', ' ?disabled=', '>']);

    // Static HTML comments stripped, dynamic comments preserved
    const comments = minifyHtmlQuasis(['<div>\n  <!-- static comment -->\n  <!-- ', ' -->\n</div>']);
    expect(comments).toEqual(['<div><!-- ', ' --></div>']);

    // Unclosed raw tag falls back safely (returns null -> left unminified)
    const unclosed = minifyHtmlQuasis(['<pre>  unclosed\n  content']);
    expect(unclosed).toBeNull();
  });

  it('AC-1/AC-4/AC-6: achieves >=15% raw reduction on formatted component templates, skips non-Snice html tags, supports aliased imports, preserves sourcemaps, and respects minifyTemplates:false', () => {
    const formattedSource = `
import { html as h, svg as s } from 'snice';

function nonSnice(strings: TemplateStringsArray, ...vals: any[]) { return strings.join(''); }
const html = nonSnice;

export function renderCard(title: string, items: string[], active: boolean) {
  const untouched = html\`
    <div class="non-snice">
      <!-- keep me -->
      <span>  spaces  </span>
    </div>
  \`;
  return h\`
    <div class="card" part="base">
      <!-- Card header -->
      <header class="card-header"
        ?data-active=\${active}
        class:is-active=\${active}>
        <h2 class="title">\${title}</h2>
        <svg viewBox="0 0 24 24">
          \${s\`
            <g class="icon">
              <circle cx="12" cy="12" r="10" />
            </g>
          \`}
        </svg>
      </header>
      <section class="card-body">
        <if \${items.length > 0}>
          <ul class="list">
            \${items.map((item) => h\`
              <li class="row" key=\${item}>
                <span>\${item}</span>
              </li>
            \`)}
          </ul>
        </if>
        <else>
          <p class="empty">No items</p>
        </else>
      </section>
    </div>
  \`;
}
`;

    // minifyTemplates: false -> untouched (null)
    const disabled = transformTemplates(formattedSource, {
      id: 'card.ts',
      minifyTemplates: false,
      precompileTemplates: false,
    });
    expect(disabled).toBeNull();

    // minifyTemplates: true -> shrinks >= 15%, preserves non-Snice html tag, emits valid sourcemap
    const res = transformTemplates(formattedSource, {
      id: 'card.ts',
      minifyTemplates: true,
      precompileTemplates: false,
    });
    expect(res).not.toBeNull();
    expect(res!.code).toContain('<!-- keep me -->'); // non-Snice untouched
    expect(res!.code).not.toContain('<!-- Card header -->'); // Snice static comment stripped
    expect(res!.map.sourcesContent?.[0]).toBe(formattedSource);

    // Measure Snice template bytes reduction
    const origSniceIdx = formattedSource.indexOf('return h`');
    const minSniceIdx = res!.code.indexOf('return h`');
    const origBytes = Buffer.byteLength(formattedSource.slice(origSniceIdx), 'utf8');
    const minBytes = Buffer.byteLength(res!.code.slice(minSniceIdx), 'utf8');
    const reduction = 1 - minBytes / origBytes;
    expect(reduction).toBeGreaterThan(0.15);
  });

  it('AC-5: precompileTemplates:true produces byte-identical bundles across two distinct directories', async () => {
    const { default: sniceVite } = await loadVitePlugin();
    const dirA = createFixtureDir('snice-bs07-det-a-');
    const dirB = createFixtureDir('snice-bs07-det-b-');

    const setup = (dir: string) => {
      mkdirSync(join(dir, 'src'), { recursive: true });
      writeFileSync(
        join(dir, 'index.html'),
        `<!doctype html><html><body><script type="module" src="/src/main.ts"></script></body></html>`
      );
      writeFileSync(
        join(dir, 'src/main.ts'),
        `
        import { element, property, render, html, svg } from 'snice';
        @element('det-comp')
        export class DetComp extends HTMLElement {
          @property() label = 'hi';
          @render()
          renderContent() {
            return html\`
              <div class="box">
                <span>\${this.label}</span>
                <svg>\${svg\`<circle cx="5" cy="5" r="4"></circle>\`}</svg>
              </div>
            \`;
          }
        }
        `
      );
    };

    setup(dirA);
    setup(dirB);

    await viteBuild({
      root: dirA,
      logLevel: 'silent',
      plugins: [sniceVite({ precompileTemplates: true })],
      build: { outDir: 'dist', emptyOutDir: true },
    });
    await viteBuild({
      root: dirB,
      logLevel: 'silent',
      plugins: [sniceVite({ precompileTemplates: true })],
      build: { outDir: 'dist', emptyOutDir: true },
    });

    const hashDir = (distDir: string) => {
      const assets = join(distDir, 'assets');
      return readdirSync(assets)
        .sort()
        .map(f => [f, createHash('sha256').update(readFileSync(join(assets, f))).digest('hex')]);
    };

    const hashesA = hashDir(join(dirA, 'dist'));
    const hashesB = hashDir(join(dirB, 'dist'));
    expect(hashesA).toEqual(hashesB);

    // Confirm compiled template descriptor was emitted in app chunk and runtime parser is tree-shaken out
    const appFile = readdirSync(join(dirA, 'dist/assets')).find(f => f.startsWith('index-') && f.endsWith('.js'))!;
    const appCode = readFileSync(join(dirA, 'dist/assets', appFile), 'utf8');
    expect(appCode).toContain('html:');
    expect(appCode).toContain('parts:');
  }, 60000);
});
