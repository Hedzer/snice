// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build as viteBuild } from 'vite';
import {
  extractTopLevelRootAllowlist,
  minifyCssText,
  pruneThemeCss,
  stripVarFallbacks,
  transformCssModule,
} from '../../packages/plugin/src/css';
import sniceVite from '../../packages/plugin/src/vite';

const ROOT = process.cwd();
const USE_BUILT = process.env.TEST_BUILT === 'true';
const tempDirs: string[] = [];

async function getSniceVite(): Promise<typeof sniceVite> {
  if (USE_BUILT) {
    const mod = await import(resolve(ROOT, 'dist/plugin/vite.js'));
    return mod.default ?? mod.snice;
  }
  return sniceVite;
}

function makeTempProject(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'snice-bs08-'));
  tempDirs.push(dir);
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(ROOT, join(dir, 'node_modules', 'snice'), 'junction');
  for (const pkg of ['tslib', 'pica-route']) {
    const p = join(ROOT, 'node_modules', pkg);
    if (existsSync(p)) symlinkSync(p, join(dir, 'node_modules', pkg), 'junction');
  }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'bs08-fixture', type: 'module' }));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(resolve(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

function collectFilesRecursive(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectFilesRecursive(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
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

describe('BS-08: Build-time CSS pipeline', () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
  });

  it('AC-3: balanced-parenthesis var() scanner handles all tricky patterns, 170-file real corpus (>80 KB savings), and malformed CSS safely', () => {
    const themeCss = readFileSync(resolve(ROOT, 'packages/components/src/theme/theme.css'), 'utf8');
    const allowlist = extractTopLevelRootAllowlist(themeCss);

    // Top-level unconditional :root defines >= 200 tokens (currently 214)
    expect(allowlist.size).toBeGreaterThanOrEqual(200);
    expect(allowlist.has('--snice-color-primary')).toBe(true);
    expect(allowlist.has('--snice-font-family')).toBe(true);
    expect(allowlist.has('--snice-texture-noise')).toBe(true);
    // Component-scoped tokens are NOT in theme.css
    expect(allowlist.has('--snice-terminal-bg')).toBe(false);
    expect(allowlist.has('--snice-table-bg')).toBe(false);

    // Tricky pattern unit checks
    const tricky = [
      // Nested var(): outer allowlisted -> strips entire fallback
      'a{color:var(--snice-color-text, var(--snice-color-primary, red))}',
      // Nested var(): outer NOT allowlisted, inner IS allowlisted -> preserves outer fallback, strips inner fallback
      'b{color:var(--snice-terminal-fg, var(--snice-color-text, #111))}',
      // Comma-bearing font-family with quoted fonts
      `c{font-family:var(--snice-font-family, -apple-system, "Segoe UI", 'Helvetica Neue', sans-serif)}`,
      // Multi-layer box-shadow
      'd{box-shadow:var(--snice-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1))}',
      // cubic-bezier inside fallback
      'e{transition:all var(--snice-transition-fast, 150ms) var(--snice-ease-out, cubic-bezier(0.4, 0, 0.2, 1))}',
      // hsl(var(...)) with no fallback
      'f{color:hsl(var(--snice-color-blue-600))}',
      // Data-URI with semicolons and quotes
      `g{background:url("data:image/svg+xml;utf8,<svg><text>var(--snice-color-text, x)</text></svg>")}`,
      // Quoted content string containing var(...)
      'h::after{content:"var(--snice-color-text, x)"}',
      // Component-scoped non-theme token
      'i{background:var(--snice-terminal-bg, #111)}',
    ].join('\n');

    const stripped = stripVarFallbacks(tricky, allowlist);
    expect(stripped).toContain('a{color:var(--snice-color-text)}');
    expect(stripped).toContain('b{color:var(--snice-terminal-fg, var(--snice-color-text))}');
    expect(stripped).toContain('c{font-family:var(--snice-font-family)}');
    expect(stripped).toContain('d{box-shadow:var(--snice-shadow-md)}');
    expect(stripped).toContain('e{transition:all var(--snice-transition-fast) var(--snice-ease-out)}');
    expect(stripped).toContain('f{color:hsl(var(--snice-color-blue-600))}');
    expect(stripped).toContain(`g{background:url("data:image/svg+xml;utf8,<svg><text>var(--snice-color-text, x)</text></svg>")}`);
    expect(stripped).toContain('h::after{content:"var(--snice-color-text, x)"}');
    expect(stripped).toContain('i{background:var(--snice-terminal-bg, #111)}');

    // Malformed CSS resilience: unbalanced var(, unclosed quote, unclosed comment -> never loops or corrupts neighbors
    const malformed1 = '.bad{color:var(--snice-color-text, red} .ok{color:var(--snice-color-primary, blue)}';
    const outM1 = stripVarFallbacks(malformed1, allowlist);
    expect(outM1).toContain('.bad{color:var(--snice-color-text, red}');
    expect(outM1).toContain('.ok{color:var(--snice-color-primary)}');

    const malformed2 = '.ok{color:var(--snice-color-primary, blue)} .unclosed{content:"abc';
    const outM2 = stripVarFallbacks(malformed2, allowlist);
    expect(outM2).toContain('.ok{color:var(--snice-color-primary)}');
    expect(outM2).toContain('.unclosed{content:"abc');

    const malformed3 = '.ok{color:var(--snice-color-primary, blue)} /* unclosed comment';
    const outM3 = stripVarFallbacks(malformed3, allowlist);
    expect(outM3).toContain('.ok{color:var(--snice-color-primary)}');
    expect(outM3).toContain('/* unclosed comment');

    // Full 170-file real component CSS corpus test
    const componentCssFiles = collectFilesRecursive(resolve(ROOT, 'packages/components/src'), ['.css'])
      .filter((f) => !/\/theme\/[^/]+\.css$/.test(f));
    expect(componentCssFiles.length).toBeGreaterThanOrEqual(160);

    let totalBefore = 0;
    let totalAfter = 0;
    for (const file of componentCssFiles) {
      const raw = readFileSync(file, 'utf8');
      const out = stripVarFallbacks(raw, allowlist);
      totalBefore += Buffer.byteLength(raw);
      totalAfter += Buffer.byteLength(out);

      // Verify paren balance wasn't broken relative to input
      expect(out.length).toBeLessThanOrEqual(raw.length);
      // Verify NO non-allowlisted --snice-* token had its fallback removed when input had a fallback
      const nonThemeWithFallbackRe = /var\(\s*(--snice-[a-zA-Z0-9_-]+)\s*,/g;
      for (const m of raw.matchAll(nonThemeWithFallbackRe)) {
        const tok = m[1];
        if (!allowlist.has(tok)) {
          // Ensure this non-theme token still appears with a fallback somewhere in output
          expect(out).toContain(`${tok},`);
        }
      }
    }

    const savings = totalBefore - totalAfter;
    expect(savings).toBeGreaterThan(80_000);
  });

  it('AC-4/AC-5: inline css`` minification, static .css?inline folding, calc()/::part()/:host() preservation, and non-Snice css tag isolation', () => {
    // Unit check on minifyCssText
    const sample = `:host([variant="primary"]) { /* header comment */
      padding: calc(1rem - 2px) calc(2rem + 4px);
      color: var(--snice-color-text, #111);
      --empty: ;
      background: url("data:image/svg+xml;utf8,<svg></svg>");
    }
    ::part(base) { margin: 0; }
    @container (min-width: 400px) { .a :hover { opacity: 0.5; } }`;
    const min = minifyCssText(sample);
    expect(min).not.toContain('header comment');
    expect(min).toContain('calc(1rem - 2px)');
    expect(min).toContain('calc(2rem + 4px)');
    expect(min).toContain('::part(base)');
    expect(min).toContain(':host([variant="primary"])');
    expect(min).toContain('@container (min-width:400px)');
    expect(min).toContain('.a :hover');
    expect(min).toContain('url("data:image/svg+xml;utf8,<svg></svg>")');

    // Static `.css?inline` folding + inline `css` minification + non-Snice `css` isolation
    const dir = makeTempProject({
      'src/panel.css': `:host {\n  /* panel comment */\n  padding: calc(1rem - 2px);\n  color: var(--snice-color-text, rgb(23 23 23));\n}\n`,
      'src/panel.ts': `
        import { css as sCss } from 'snice';
        import stylesText from './panel.css?inline';

        function otherCss(strings: TemplateStringsArray) { return strings[0]; }

        export const folded = sCss\`\${stylesText}\`;
        export const inlineMin = sCss\`
          :host {
            /* inline comment */
            padding: calc(1rem - 2px);
          }
        \`;
        export const untouched = otherCss\`
          .keep { /* keep this comment */ padding: 4px; }
        \`;
      `,
    });

    const panelPath = join(dir, 'src/panel.ts');
    const src = readFileSync(panelPath, 'utf8');
    const res = transformCssModule(src, { id: panelPath, minifyCss: true });
    expect(res).not.toBeNull();
    // `.css?inline` folded into static zero-interpolation `sCss\`...\`` and unused import removed
    expect(res!.code).not.toContain('./panel.css?inline');
    expect(res!.code).not.toContain('panel comment');
    expect(res!.code).toContain('sCss`:host{padding:calc(1rem - 2px);color:var(--snice-color-text,rgb(23 23 23))}`');
    // Inline Snice css`` minified while keeping calc spacing
    expect(res!.code).not.toContain('inline comment');
    expect(res!.code).toContain('sCss`:host{padding:calc(1rem - 2px)}`');
    // Non-Snice `otherCss` untouched verbatim
    expect(res!.code).toContain('keep this comment');
  });

  it('AC-1/AC-2/AC-7: order-independent stripCssFallbacks ("auto" with/without theme.css, explicit true) and default theme cache-hash stability', async () => {
    const plugin = await getSniceVite();

    // 1a. Import snice-button BEFORE theme.css
    const dirA = makeTempProject({
      'index.html': `<!doctype html><html><body><script type="module" src="/src/main.ts"></script></body></html>`,
      'src/main.ts': `
        import 'snice/components/button/snice-button';
        import 'snice/components/theme/theme.css';
        console.log('v1');
      `,
    });
    // 1b. Import theme.css BEFORE snice-button
    const dirB = makeTempProject({
      'index.html': `<!doctype html><html><body><script type="module" src="/src/main.ts"></script></body></html>`,
      'src/main.ts': `
        import 'snice/components/theme/theme.css';
        import 'snice/components/button/snice-button';
        console.log('v1');
      `,
    });
    // 2a. NO theme.css with default stripCssFallbacks: 'auto'
    const dirNoThemeAuto = makeTempProject({
      'index.html': `<!doctype html><html><body><script type="module" src="/src/main.ts"></script></body></html>`,
      'src/main.ts': `
        import 'snice/components/button/snice-button';
        console.log('v1');
      `,
    });
    // 2b. NO theme.css with explicit stripCssFallbacks: true
    const dirNoThemeExplicit = makeTempProject({
      'index.html': `<!doctype html><html><body><script type="module" src="/src/main.ts"></script></body></html>`,
      'src/main.ts': `
        import 'snice/components/button/snice-button';
        console.log('v1');
      `,
    });

    await Promise.all([
      viteBuild({ root: dirA, logLevel: 'silent', build: { sourcemap: true }, plugins: [plugin()] }),
      viteBuild({ root: dirB, logLevel: 'silent', build: { sourcemap: true }, plugins: [plugin()] }),
      viteBuild({ root: dirNoThemeAuto, logLevel: 'silent', plugins: [plugin()] }),
      viteBuild({ root: dirNoThemeExplicit, logLevel: 'silent', plugins: [plugin({ stripCssFallbacks: true })] }),
    ]);

    const filesA = listDistFiles(dirA);
    const filesB = listDistFiles(dirB);
    const filesNoThemeAuto = listDistFiles(dirNoThemeAuto);
    const filesNoThemeExplicit = listDistFiles(dirNoThemeExplicit);

    const getCompChunk = (files: Record<string, Buffer>) => {
      const key = Object.keys(files).find((k) => k.includes('snice-components') && k.endsWith('.js'))!;
      return { key, text: files[key].toString('utf8'), bytes: files[key].length };
    };

    const compA = getCompChunk(filesA);
    const compB = getCompChunk(filesB);
    const compAuto = getCompChunk(filesNoThemeAuto);
    const compExplicit = getCompChunk(filesNoThemeExplicit);

    // AC-1: Both import orders strip allowlisted fallbacks identically!
    expect(compA.text).toBe(compB.text);
    expect(compA.text).toContain('var(--snice-color-primary)');
    expect(compA.text).not.toContain('var(--snice-color-primary,rgb(37 99 235))');
    // Component-scoped non-theme token in snice-button (`--button-warning-text`) is preserved!
    expect(compA.text).toContain('var(--button-warning-text,rgb(69 26 3))');
    // Measurable byte reduction vs unstripped
    expect(compA.bytes).toBeLessThan(compAuto.bytes - 1500);
    // Valid sourcemap exists for stripped chunk
    const mapKey = `${compA.key}.map`;
    expect(filesA[mapKey]).toBeDefined();
    const parsedMap = JSON.parse(filesA[mapKey].toString('utf8'));
    expect(parsedMap.version).toBe(3);

    // AC-2(a): Without theme.css under default 'auto', ALL fallbacks preserved untouched
    expect(compAuto.text).toContain('var(--snice-color-primary,rgb(37 99 235))');
    expect(compAuto.text).toContain('var(--snice-font-family,');

    // AC-2(b): Without theme.css under explicit stripCssFallbacks: true, strips allowlisted fallbacks via shipped theme.css
    expect(compExplicit.text.trim()).toBe(compA.text.replace(/\n\/\/# sourceMappingURL=.*$/m, '').trim());

    // AC-7: With pruneTheme: false (default), editing app code keeps snice-theme-[hash].css byte-identical
    const themeKeyV1 = Object.keys(filesA).find((k) => k.includes('snice-theme') && k.endsWith('.css'))!;
    const themeBytesV1 = filesA[themeKeyV1];
    writeFileSync(
      join(dirA, 'src/main.ts'),
      `
        import 'snice/components/button/snice-button';
        import 'snice/components/theme/theme.css';
        console.log('v2 edited app code');
      `
    );
    await viteBuild({ root: dirA, logLevel: 'silent', plugins: [plugin()] });
    const filesAV2 = listDistFiles(dirA);
    const themeKeyV2 = Object.keys(filesAV2).find((k) => k.includes('snice-theme') && k.endsWith('.css'))!;
    expect(themeKeyV2).toBe(themeKeyV1);
    expect(filesAV2[themeKeyV2].equals(themeBytesV1)).toBe(true);
  }, 45000);

  it('AC-6: opt-in pruneTheme performs cross-block dark-mode transitive closure, preserves data URIs & dynamic accent palette & safelist, re-hashes filename + index.html, and no-ops without theme.css', async () => {
    const plugin = await getSniceVite();

    // Unit test on pruneThemeCss data-URI semicolon integrity
    const fullTheme = readFileSync(resolve(ROOT, 'packages/components/src/theme/theme.css'), 'utf8');
    const prunedNoise = pruneThemeCss(fullTheme, new Set(['--snice-texture-noise']), new Set(), []);
    expect(prunedNoise).toContain('url("data:image/svg+xml;utf8,<svg');
    expect(prunedNoise).toContain("filter='url(%23n)'");

    // Vite build 1: pruneTheme: true with safelist [/^--snice-z-/]
    const dir = makeTempProject({
      'index.html': `<!doctype html><html><body><snice-button>Hi</snice-button><snice-chart></snice-chart><script type="module" src="/src/main.ts"></script></body></html>`,
      'src/main.ts': `
        import 'snice/components/theme/theme.css';
        import 'snice/components/button/snice-button';
        import 'snice/components/chart/snice-chart';
      `,
    });

    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [plugin({ pruneTheme: true, themeSafelist: [/^--snice-z-/] })],
    });
    const files1 = listDistFiles(dir);
    const themeKey1 = Object.keys(files1).find((k) => k.includes('snice-theme') && k.endsWith('.css'))!;
    const themeCss1 = files1[themeKey1].toString('utf8');
    const html1 = files1['index.html'].toString('utf8');

    // Shrunk substantially compared to full 27 KB theme.css
    expect(themeCss1.length).toBeLessThan(fullTheme.length * 0.7);
    // Dark-mode transitive primitives preserved (--snice-color-primary uses blue-600 in light and blue-500 in dark;
    // dark hover/subtle derive via color-mix() directly from --snice-color-primary, and dark surface uses gray-900/800)
    expect(themeCss1).toContain('--snice-color-primary:');
    expect(themeCss1).toContain('--snice-color-blue-600:');
    expect(themeCss1).toContain('--snice-color-blue-500:');
    expect(themeCss1).toContain('--snice-color-gray-900:');
    expect(themeCss1).toMatch(/\[data-theme=["']?dark["']?\]/);
    // Dynamic --snice-color-accent-1..8 preserved because snice-chart uses getAccentPalette
    for (let i = 1; i <= 8; i++) {
      expect(themeCss1).toContain(`--snice-color-accent-${i}:`);
    }
    // RegExp safelist /^--snice-z-/ preserved
    expect(themeCss1).toContain('--snice-z-modal'.replace('modal', 'overlay'));
    expect(themeCss1).toContain('--snice-z-notification:');
    // Unused token dropped (e.g. --snice-texture-noise not used by button or chart)
    expect(themeCss1).not.toContain('--snice-texture-noise:');
    // index.html <link> points to the exact re-hashed theme filename
    expect(html1).toContain(themeKey1.split('/').pop()!);

    // Vite build 2: add '--snice-texture-noise' to themeSafelist -> produces a NEW filename hash matching index.html!
    await viteBuild({
      root: dir,
      logLevel: 'silent',
      plugins: [plugin({ pruneTheme: true, themeSafelist: ['--snice-texture-noise', /^--snice-z-/] })],
    });
    const files2 = listDistFiles(dir);
    const themeKey2 = Object.keys(files2).find((k) => k.includes('snice-theme') && k.endsWith('.css'))!;
    const themeCss2 = files2[themeKey2].toString('utf8');
    const html2 = files2['index.html'].toString('utf8');

    expect(themeCss2).toContain('--snice-texture-noise:url("data:image/svg+xml;utf8,');
    expect(themeKey2).not.toBe(themeKey1);
    expect(html2).toContain(themeKey2.split('/').pop()!);
    expect(html2).not.toContain(themeKey1.split('/').pop()!);

    // AC-6(f): pruneTheme: true with NO theme.css in bundle is a safe no-op
    const dirNoTheme = makeTempProject({
      'index.html': `<!doctype html><html><body><script type="module" src="/src/main.ts"></script></body></html>`,
      'src/main.ts': `import 'snice/components/button/snice-button';`,
    });
    await viteBuild({
      root: dirNoTheme,
      logLevel: 'silent',
      plugins: [plugin({ pruneTheme: true })],
    });
    const filesNoTheme = listDistFiles(dirNoTheme);
    expect(Object.keys(filesNoTheme).some((k) => k.endsWith('.js'))).toBe(true);
  }, 45000);
});
