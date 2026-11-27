// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build as viteBuild } from 'vite';
import {
  extractTopLevelRootAllowlist,
  isThemeCssId,
  pruneThemeCss,
  pruneThemeFeatureBlocks,
} from '../../packages/plugin/src/css';
import sniceVite from '../../packages/plugin/src/vite';

const ROOT = process.cwd();
const USE_BUILT = process.env.TEST_BUILT === 'true';
const THEME_DIR = resolve(ROOT, 'packages/components/src/theme');
const SLICES = ['core.css', 'dark.css', 'accents.css', 'effects.css', 'density.css', 'motion.css', 'print.css'] as const;
const tempDirs: string[] = [];

async function getSniceVite(): Promise<typeof sniceVite> {
  if (USE_BUILT) {
    const mod = await import(resolve(ROOT, 'dist/plugin/vite.js'));
    return mod.default ?? mod.snice;
  }
  return sniceVite;
}

function makeTempProject(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'snice-theme-mod-'));
  tempDirs.push(dir);
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(ROOT, join(dir, 'node_modules', 'snice'), 'junction');
  for (const pkg of ['tslib', 'pica-route']) {
    const p = join(ROOT, 'node_modules', pkg);
    if (existsSync(p)) symlinkSync(p, join(dir, 'node_modules', pkg), 'junction');
  }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'theme-mod-fixture', type: 'module' }));
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

function extractAllDefinedTokens(css: string): Set<string> {
  return new Set([...css.matchAll(/(--snice-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
}

describe('Modular theme/*.css slices, CSS-first seed derivation, feature pruning & custom themes', () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
  });

  it('combined 7 modular slices cover 100% of tokens and feature blocks in self-contained theme.css', () => {
    const fullTheme = readFileSync(join(THEME_DIR, 'theme.css'), 'utf8');
    const combinedSlices = SLICES.map((s) => readFileSync(join(THEME_DIR, s), 'utf8')).join('\n');

    // theme.css must remain 100% self-contained with zero @import waterfall
    expect(fullTheme).not.toContain('@import');

    // Exact token parity across all blocks and top-level :root
    const fullAllTokens = extractAllDefinedTokens(fullTheme);
    const sliceAllTokens = extractAllDefinedTokens(combinedSlices);
    expect([...sliceAllTokens].sort()).toEqual([...fullAllTokens].sort());

    const fullRoot = extractTopLevelRootAllowlist(fullTheme);
    const sliceRoot = extractTopLevelRootAllowlist(combinedSlices);
    expect([...sliceRoot].sort()).toEqual([...fullRoot].sort());

    // core.css is strictly smaller than full theme.css and excludes effects/accents/dark/density/motion/print
    const coreCss = readFileSync(join(THEME_DIR, 'core.css'), 'utf8');
    expect(coreCss.length).toBeLessThan(fullTheme.length * 0.6);
    expect(coreCss).not.toContain('--snice-shadow-md:');
    expect(coreCss).not.toContain('--snice-color-accent-1:');
    expect(coreCss).not.toContain('[data-theme="dark"]');
    expect(coreCss).not.toContain('[data-density=');
    expect(coreCss).not.toContain('[data-motion=');
    expect(coreCss).not.toContain('@media print');

    // Every slice path is recognized by isThemeCssId(), while unrelated user CSS is NOT
    for (const s of ['theme.css', ...SLICES]) {
      expect(isThemeCssId(`/app/node_modules/snice/dist/components/theme/${s}`)).toBe(true);
      expect(isThemeCssId(`snice/components/theme/${s}`)).toBe(true);
    }
    expect(isThemeCssId('/app/src/theme/brand.css')).toBe(false);
    expect(isThemeCssId('/app/src/my-theme.css')).toBe(false);
  });

  it('CSS-first seed derivation derives hover, subtle, focus-ring, selection overlay, and glow from semantic seeds via color-mix()', () => {
    const fullTheme = readFileSync(join(THEME_DIR, 'theme.css'), 'utf8');
    const coreCss = readFileSync(join(THEME_DIR, 'core.css'), 'utf8');
    const darkCss = readFileSync(join(THEME_DIR, 'dark.css'), 'utf8');
    const effectsCss = readFileSync(join(THEME_DIR, 'effects.css'), 'utf8');

    for (const css of [fullTheme, coreCss]) {
      expect(css).toMatch(/--snice-color-primary-hover:\s*color-mix\([^;]*var\(--snice-color-primary\)/);
      expect(css).toMatch(/--snice-color-primary-subtle:\s*color-mix\([^;]*var\(--snice-color-primary\)/);
      expect(css).toMatch(/--snice-color-primary-subtle-hover:\s*color-mix\([^;]*var\(--snice-color-primary\)/);
      expect(css).toMatch(/--snice-color-border-focus:\s*color-mix\([^;]*var\(--snice-color-primary\)/);
      expect(css).toMatch(/--snice-color-overlay-selected:\s*color-mix\([^;]*var\(--snice-color-primary\)/);
      expect(css).toMatch(/--snice-color-overlay-selected-hover:\s*color-mix\([^;]*var\(--snice-color-primary\)/);
      expect(css).toMatch(/--snice-focus-ring-color:\s*color-mix\([^;]*var\(--snice-color-primary\)/);
      expect(css).toMatch(/--snice-focus-ring-color-primary:\s*color-mix\([^;]*var\(--snice-color-primary\)/);
      expect(css).toMatch(/--snice-focus-ring-color-success:\s*color-mix\([^;]*var\(--snice-color-success\)/);
      expect(css).toMatch(/--snice-focus-ring-color-warning:\s*color-mix\([^;]*var\(--snice-color-warning\)/);
      expect(css).toMatch(/--snice-focus-ring-color-danger:\s*color-mix\([^;]*var\(--snice-color-danger\)/);
    }

    // Dark mode also derives hover/subtle/border-focus/selection from semantic seeds
    expect(darkCss).toMatch(/--snice-color-primary-hover:\s*color-mix\([^;]*var\(--snice-color-primary\)/);
    expect(darkCss).toMatch(/--snice-color-primary-subtle:\s*color-mix\([^;]*var\(--snice-color-primary\)/);
    expect(darkCss).toMatch(/--snice-color-border-focus:\s*color-mix\([^;]*var\(--snice-color-primary\)/);
    // Auto-dark does not clobber custom [data-theme="brand"]
    expect(darkCss).toContain(':root:not([data-theme])');

    // Effects glows derive from semantic seeds
    expect(effectsCss).toMatch(/--snice-shadow-glow-primary:[^;]*color-mix\([^;]*var\(--snice-color-primary\)/);
    expect(effectsCss).toMatch(/--snice-shadow-glow-danger:[^;]*color-mix\([^;]*var\(--snice-color-danger\)/);
  });

  it('partial-slice import strips ONLY fallbacks defined by imported slices and routes slices to snice-theme tier', async () => {
    const plugin = await getSniceVite();

    // Build 1: core.css ONLY (no effects.css) -> strips primary/font-family fallbacks, KEEPS shadow/gradient fallbacks
    const dirCoreOnly = makeTempProject({
      'index.html': `<!doctype html><html><body><snice-card></snice-card><script type="module" src="/src/main.ts"></script></body></html>`,
      'src/main.ts': `
        import 'snice/components/theme/core.css';
        import 'snice/components/card/snice-card';
      `,
    });

    // Build 2: core.css + effects.css -> union allowlist strips BOTH core AND shadow fallbacks
    const dirCoreAndEffects = makeTempProject({
      'index.html': `<!doctype html><html><body><snice-card></snice-card><script type="module" src="/src/main.ts"></script></body></html>`,
      'src/main.ts': `
        import 'snice/components/theme/core.css';
        import 'snice/components/theme/effects.css';
        import 'snice/components/card/snice-card';
      `,
    });

    await Promise.all([
      viteBuild({ root: dirCoreOnly, logLevel: 'silent', plugins: [plugin()] }),
      viteBuild({ root: dirCoreAndEffects, logLevel: 'silent', plugins: [plugin()] }),
    ]);

    const filesCoreOnly = listDistFiles(dirCoreOnly);
    const filesBoth = listDistFiles(dirCoreAndEffects);

    // Both route modular theme slices into the dedicated `snice-theme` cache tier
    const themeCoreKey = Object.keys(filesCoreOnly).find((k) => k.includes('snice-theme') && k.endsWith('.css'));
    expect(themeCoreKey).toBeDefined();
    expect(filesCoreOnly[themeCoreKey!].toString('utf8')).not.toContain('--snice-shadow-md:');

    const compCoreKey = Object.keys(filesCoreOnly).find((k) => k.includes('snice-components') && k.endsWith('.js'))!;
    const compCoreJs = filesCoreOnly[compCoreKey].toString('utf8');
    // Core token fallback stripped
    expect(compCoreJs).toContain('var(--snice-color-surface');
    expect(compCoreJs).not.toMatch(/var\(--snice-border-radius-lg,/);
    // Effects token fallback PRESERVED because effects.css was NOT imported!
    expect(compCoreJs).toMatch(/var\(--snice-shadow-(?:sm|md|lg),/);

    const compBothKey = Object.keys(filesBoth).find((k) => k.includes('snice-components') && k.endsWith('.js'))!;
    const compBothJs = filesBoth[compBothKey].toString('utf8');
    // With effects.css also imported, shadow fallbacks ARE stripped
    expect(compBothJs).not.toMatch(/var\(--snice-shadow-(?:sm|md|lg),/);
  }, 45000);

  it('standalone custom theme CSS only strips fallbacks for tokens it actually defines', async () => {
    const plugin = await getSniceVite();
    const dir = makeTempProject({
      'index.html': `<!doctype html><html><body><snice-button>Go</snice-button><script type="module" src="/src/main.ts"></script></body></html>`,
      'src/my-theme.css': `
        :root {
          --snice-color-primary: hsl(280 70% 50%);
          --snice-border-radius-md: 0.5rem;
        }
      `,
      'src/main.ts': `
        import './my-theme.css';
        import 'snice/components/button/snice-button';
      `,
    });

    await viteBuild({ root: dir, logLevel: 'silent', plugins: [plugin()] });
    const files = listDistFiles(dir);
    const compKey = Object.keys(files).find((k) => k.includes('snice-components') && k.endsWith('.js'))!;
    const compJs = files[compKey].toString('utf8');

    // Tokens defined in custom theme have their fallbacks stripped
    expect(compJs).toContain('var(--snice-color-primary)');
    expect(compJs).not.toMatch(/var\(--snice-color-primary,/);
    // Tokens NOT defined in custom theme retain their fallbacks safely
    expect(compJs).toMatch(/var\(--snice-font-family,/);
    expect(compJs).toMatch(/var\(--snice-color-danger,/);
  }, 45000);

  it('feature-block pruning strips selected Snice blocks while ALWAYS preserving custom [data-theme="brand"] blocks', async () => {
    const fullTheme = readFileSync(join(THEME_DIR, 'theme.css'), 'utf8');

    // Unit test: dark: 'manual' vs dark: 'auto' vs dark: false + custom [data-theme="brand"] immunity
    const withCustom = `${fullTheme}\n[data-theme="brand"] { --snice-color-primary: hsl(280 70% 50%); --brand-only: #123; }\n`;

    const manualOnly = pruneThemeFeatureBlocks(withCustom, { dark: 'manual' });
    expect(manualOnly).toContain('[data-theme="dark"]');
    expect(manualOnly).not.toContain('prefers-color-scheme: dark');
    expect(manualOnly).toContain('[data-theme="brand"]');

    const autoOnly = pruneThemeFeatureBlocks(withCustom, { dark: 'auto' });
    expect(autoOnly).not.toContain('[data-theme="dark"]');
    expect(autoOnly).toContain('prefers-color-scheme: dark');
    expect(autoOnly).toContain('[data-theme="brand"]');

    const strippedAll = pruneThemeFeatureBlocks(withCustom, {
      dark: false,
      density: false,
      motion: false,
      print: false,
    });
    expect(strippedAll).not.toContain('[data-theme="dark"]');
    expect(strippedAll).not.toContain('prefers-color-scheme: dark');
    expect(strippedAll).not.toContain('[data-density=');
    expect(strippedAll).not.toContain('[data-motion=');
    expect(strippedAll).not.toContain('prefers-reduced-motion');
    expect(strippedAll).not.toContain('@media print');
    // Custom [data-theme="brand"] is preserved!
    expect(strippedAll).toContain('[data-theme="brand"]');
    expect(strippedAll).toContain('--brand-only: #123');

    // pruneThemeCss also preserves custom [data-theme="brand"] block & its declarations even when unreferenced
    const pruned = pruneThemeCss(strippedAll, new Set(['--snice-color-text']), new Set(), []);
    expect(pruned).toContain('[data-theme="brand"]');
    expect(pruned).toContain('--snice-color-primary:hsl(280 70% 50%)');
    expect(pruned).toContain('--brand-only:#123');

    // Full Vite build with theme feature pruning + token pruning + custom brand theme (both caching: true and caching: false!)
    const plugin = await getSniceVite();
    for (const caching of [true, false]) {
      const dir = makeTempProject({
        'index.html': `<!doctype html><html><body><snice-button variant="primary">Hi</snice-button><script type="module" src="/src/main.ts"></script></body></html>`,
        'src/brand.css': `
          [data-theme="brand"] {
            --snice-color-primary: hsl(280 70% 50%);
            --brand-custom-token: 42px;
          }
        `,
        'src/main.ts': `
          import 'snice/components/theme/theme.css';
          import './brand.css';
          import 'snice/components/button/snice-button';
        `,
      });

      await viteBuild({
        root: dir,
        logLevel: 'silent',
        plugins: [
          plugin({
            caching,
            theme: {
              prune: true,
              dark: false,
              density: false,
              motion: false,
              print: false,
            },
          }),
        ],
      });

      const files = listDistFiles(dir);
      const allCss = Object.entries(files)
        .filter(([k]) => k.endsWith('.css'))
        .map(([, buf]) => buf.toString('utf8'))
        .join('\n');

      // Built-in dark/density/motion/print stripped
      expect(allCss).not.toMatch(/\[data-theme=["']?dark["']?\]/);
      expect(allCss).not.toContain('prefers-color-scheme:dark');
      expect(allCss).not.toContain('prefers-color-scheme: dark');
      expect(allCss).not.toContain('data-density');
      expect(allCss).not.toContain('data-motion');
      expect(allCss).not.toContain('@media print');
      // Custom brand theme 100% preserved!
      expect(allCss).toMatch(/\[data-theme=["']?brand["']?\]/);
      expect(allCss).toContain('--brand-custom-token');
      expect(allCss).toContain('280');
    }
  }, 45000);
});
