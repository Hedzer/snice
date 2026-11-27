// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import { build as viteBuild } from 'vite';
import { afterEach, describe, expect, it } from 'vitest';
import sniceVite, { type SnicePlatform, type SnicePlatformOption } from '../../packages/plugin/src/vite';
import sniceRollup from '../../packages/plugin/src/rollup';
import { stripPlatformOnlyQuasis } from '../../packages/plugin/src/templates';
import { classifyModuleTier } from '../../packages/plugin/src/chunking';

const repoRoot = process.cwd();
const tempDirs: string[] = [];

function createTempProject(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(repoRoot, join(dir, 'node_modules', 'snice'), 'junction');
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ type: 'module' }));
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()!;
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('snice({ platform }) build-time compilation & DCE (PS-02)', () => {
  it('validates platform option eagerly and fails fast with TypeError on invalid values', () => {
    expect(() => sniceVite({ platform: 'beos' as any })).toThrow(TypeError);
    expect(() => sniceRollup({ platform: 'beos' as any })).toThrow(TypeError);
    expect(() => sniceVite({ platform: 42 as any })).toThrow(TypeError);
    expect(() => sniceVite({ platform: 'beos' as any })).toThrow(/ios.*material.*windows.*macos/);

    const validOptions: SnicePlatformOption[] = [
      'default',
      'ios',
      'material',
      'windows',
      'macos',
      'multi',
      'preserve',
    ];
    for (const opt of validOptions) {
      expect(() => sniceVite({ platform: opt })).not.toThrow();
      expect(() => sniceRollup({ platform: opt })).not.toThrow();
    }
  });

  it('routes theme/platforms/*.css into Tier 3 snice-theme in chunk classification', () => {
    const emptySet = new Set<string>();
    expect(
      classifyModuleTier('/app/node_modules/snice/dist/components/theme/platforms/ios.css', true, emptySet)
    ).toBe('snice-theme');
    expect(
      classifyModuleTier('/repo/packages/components/src/theme/platforms/material-scoped.css', true, emptySet)
    ).toBe('snice-theme');
  });

  it('strips unselected data-platform-only elements in O(L) while preserving quasi alignment and dynamic expressions', () => {
    const quasis = [
      `<span part="track"><span part="ripple" data-platform-only="material" aria-hidden="true" hidden></span><span part="lens" data-platform-only="ios,macos" aria-hidden="true" hidden></span>`,
      `</span>`,
    ];

    const iosOut = stripPlatformOnlyQuasis(quasis, 'ios');
    expect(iosOut).toHaveLength(2);
    expect(iosOut[0]).not.toContain('part="ripple"');
    expect(iosOut[0]).toContain('part="lens"');

    const matOut = stripPlatformOnlyQuasis(quasis, 'material');
    expect(matOut[0]).toContain('part="ripple"');
    expect(matOut[0]).not.toContain('part="lens"');

    const defaultOut = stripPlatformOnlyQuasis(quasis, 'default');
    expect(defaultOut[0]).not.toContain('part="ripple"');
    expect(defaultOut[0]).not.toContain('part="lens"');

    // Nested same-tag elements inside a stripped data-platform-only wrapper
    const nested = [
      `<div><span data-platform-only="material" hidden><span class="inner">x</span></span><b>keep</b></div>`,
    ];
    expect(stripPlatformOnlyQuasis(nested, 'ios')[0]).toBe('<div><b>keep</b></div>');

    // Safety: element spanning a ${expr} boundary is preserved untouched
    const dynamicSpan = [
      `<div><span data-platform-only="material" hidden>`,
      `</span></div>`,
    ];
    expect(stripPlatformOnlyQuasis(dynamicSpan, 'ios')).toEqual(dynamicSpan);
  });

  it('compiles a Vite app with platform:"ios": folds ios.css above @layer snice-base, layers platform theme tokens before brand CSS, strips material markup & DCEs material behavior to 0 bytes', async () => {
    const dir = createTempProject('snice-ps02-vite-');
    // Fixture theme with core.css, dark.css, and platforms/ios.css + platforms/material.css
    mkdirSync(join(dir, 'packages/components/src/theme/platforms'), { recursive: true });
    writeFileSync(
      join(dir, 'packages/components/src/theme/core.css'),
      `:root { --snice-color-primary: hsl(217 83% 53%); --snice-color-primary-hover: color-mix(in srgb, var(--snice-color-primary) 86%, black); --snice-border-radius-md: 4px; --snice-unused-token: 99px; }\n`
    );
    writeFileSync(
      join(dir, 'packages/components/src/theme/dark.css'),
      `[data-theme="dark"] { --snice-color-primary: hsl(217 91% 60%); }\n`
    );
    writeFileSync(
      join(dir, 'packages/components/src/theme/platforms/ios.css'),
      `:root { --snice-platform-marker: ios-liquid-glass; --snice-border-radius-md: 12px; }\n[data-theme="dark"] { --snice-platform-dark-marker: ios-dark-glass; }\n`
    );
    writeFileSync(
      join(dir, 'packages/components/src/theme/platforms/material.css'),
      `:root { --snice-platform-marker: material-3-expressive; --snice-border-radius-md: 20px; }\n`
    );

    // Fixture platform behaviors
    mkdirSync(join(dir, 'packages/components/src/platform-behaviors'), { recursive: true });
    writeFileSync(
      join(dir, 'packages/components/src/platform-behaviors/ios.ts'),
      `export function attachIosBehavior(el: HTMLElement) { el.dataset.iosBehavior = 'IOS_BEHAVIOR_SENTINEL'; }\n`
    );
    writeFileSync(
      join(dir, 'packages/components/src/platform-behaviors/material.ts'),
      `export function attachMaterialBehavior(el: HTMLElement) { el.dataset.matBehavior = 'MATERIAL_BEHAVIOR_SENTINEL'; }\n`
    );

    // Fixture component with both ios.css and material.css, data-platform-only helpers, and behavior guards
    mkdirSync(join(dir, 'packages/components/src/widget'), { recursive: true });
    writeFileSync(
      join(dir, 'packages/components/src/widget/snice-widget.css'),
      `.widget { color: var(--snice-color-primary, rgb(37 99 235)); border-radius: var(--snice-border-radius-md, 4px); }\n`
    );
    writeFileSync(
      join(dir, 'packages/components/src/widget/ios.css'),
      `[part~="base"] { border-radius: 14px; --ios-comp-sentinel: 1; }\n`
    );
    writeFileSync(
      join(dir, 'packages/components/src/widget/material.css'),
      `[part~="base"] { border-radius: 24px; --material-comp-sentinel: 1; }\n`
    );
    writeFileSync(
      join(dir, 'packages/components/src/widget/snice-widget.ts'),
      `
      import { element, render, styles, ready, html, css } from 'snice';
      import cssContent from './snice-widget.css?inline';
      import { attachIosBehavior } from '../platform-behaviors/ios';
      import { attachMaterialBehavior } from '../platform-behaviors/material';

      declare const __SNICE_PLATFORM__: string | undefined;

      @element('snice-widget')
      export class SniceWidget extends HTMLElement {
        @render()
        template() {
          return html\`<div class="widget" part="base"><span part="ripple" data-platform-only="material" aria-hidden="true" hidden></span><span part="lens" data-platform-only="ios,macos" aria-hidden="true" hidden></span></div>\`;
        }
        @styles()
        componentStyles() {
          return css\`\${cssContent}\`;
        }
        @ready()
        init() {
          if (typeof __SNICE_PLATFORM__ !== 'undefined' && __SNICE_PLATFORM__ === 'ios') {
            attachIosBehavior(this);
          }
          if (typeof __SNICE_PLATFORM__ !== 'undefined' && __SNICE_PLATFORM__ === 'material') {
            attachMaterialBehavior(this);
          }
        }
      }
      `
    );

    // App entry importing core.css + dark.css + brand.css + component
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(
      join(dir, 'src/brand.css'),
      `:root { --snice-color-primary: hsl(265 75% 54%); }\n`
    );
    writeFileSync(
      join(dir, 'src/main.ts'),
      `
      import '../packages/components/src/theme/core.css';
      import '../packages/components/src/theme/dark.css';
      import './brand.css';
      import '../packages/components/src/widget/snice-widget';
      console.log('APP_V1');
      `
    );
    writeFileSync(
      join(dir, 'index.html'),
      `<!doctype html><html><head></head><body><snice-widget></snice-widget><script type="module" src="/src/main.ts"></script></body></html>`
    );

    const runBuild = async () => {
      await viteBuild({
        root: dir,
        logLevel: 'silent',
        plugins: [
          sniceVite({
            platform: 'ios',
            stripCssFallbacks: 'auto',
            theme: { prune: true, safelist: ['--snice-platform-marker', '--snice-platform-dark-marker'] },
          }),
        ],
        build: {
          outDir: 'dist-out',
          emptyOutDir: true,
          minify: 'esbuild',
        },
      });
    };

    await runBuild();

    const distAssetsDir = join(dir, 'dist-out/assets');
    const assets = (await import('node:fs')).readdirSync(distAssetsDir);
    const themeCssNameV1 = assets.find((f) => f.startsWith('snice-theme-') && f.endsWith('.css'));
    expect(themeCssNameV1, `expected snice-theme-*.css in ${assets.join(', ')}`).toBeTruthy();

    const themeCss = readFileSync(join(distAssetsDir, themeCssNameV1!), 'utf8');
    expect(themeCss).toContain('ios-liquid-glass');
    expect(themeCss).toContain('ios-dark-glass');
    expect(themeCss).not.toContain('material-3-expressive');
    expect(themeCss).not.toContain('snice-pf-start');
    // Pruned unused token
    expect(themeCss).not.toContain('--snice-unused-token');
    // Single copy (deduplicated between core.css & dark.css)
    expect(themeCss.match(/ios-liquid-glass/g)?.length).toBe(1);

    // HTML stylesheet order: snice-theme-*.css hoisted ahead of app brand CSS
    const htmlOut = readFileSync(join(dir, 'dist-out/index.html'), 'utf8');
    const themeLinkPos = htmlOut.indexOf(themeCssNameV1!);
    const appCssName = assets.find((f) => !f.startsWith('snice-theme-') && f.endsWith('.css'));
    expect(appCssName).toBeTruthy();
    const appLinkPos = htmlOut.indexOf(appCssName!);
    expect(themeLinkPos).toBeGreaterThan(-1);
    expect(appLinkPos).toBeGreaterThan(themeLinkPos);

    // Component JS bundle assertions:
    const jsBundle = assets
      .filter((f) => f.endsWith('.js'))
      .map((f) => readFileSync(join(distAssetsDir, f), 'utf8'))
      .join('\n');

    // Folded @layer snice-base + ios.css (0 bytes of material.css)
    expect(jsBundle).toContain('@layer snice-base{');
    expect(jsBundle).toContain('--ios-comp-sentinel');
    expect(jsBundle).not.toContain('--material-comp-sentinel');
    // Allowlisted fallback stripped cleanly
    expect(jsBundle).not.toContain('rgb(37 99 235)');
    // Unselected data-platform-only="material" stripped, ios kept
    expect(jsBundle).not.toContain('part="ripple"');
    expect(jsBundle).toContain('part="lens"');
    // Behavior DCE: iOS kept, Material eliminated to 0 bytes
    expect(jsBundle).toContain('IOS_BEHAVIOR_SENTINEL');
    expect(jsBundle).not.toContain('MATERIAL_BEHAVIOR_SENTINEL');

    // Cache hash stability across app-only edits
    writeFileSync(
      join(dir, 'src/main.ts'),
      `
      import '../packages/components/src/theme/core.css';
      import '../packages/components/src/theme/dark.css';
      import './brand.css';
      import '../packages/components/src/widget/snice-widget';
      console.log('APP_V2_CHANGED');
      `
    );
    await runBuild();
    const assetsV2 = (await import('node:fs')).readdirSync(distAssetsDir);
    const themeCssNameV2 = assetsV2.find((f) => f.startsWith('snice-theme-') && f.endsWith('.css'));
    expect(themeCssNameV2).toBe(themeCssNameV1);
  });

  it('compiles with snice/rollup (platform:"ios" vs platform:"preserve" vs platform:"default") with 0-byte unused platform DCE and works on pre-built dist JS', async () => {
    const dir = createTempProject('snice-ps02-rollup-');
    mkdirSync(join(dir, 'packages/components/src/platform-behaviors'), { recursive: true });
    writeFileSync(
      join(dir, 'packages/components/src/platform-behaviors/ios.js'),
      `export function attachIos(el) { el.dataset.ios = 'ROLLUP_IOS_ONLY'; }\n`
    );
    writeFileSync(
      join(dir, 'packages/components/src/platform-behaviors/material.js'),
      `export function attachMaterial(el) { el.dataset.mat = 'ROLLUP_MATERIAL_ONLY'; }\n`
    );

    // Pre-built style component JS (`var cssContent = "..."` like dist/components/)
    mkdirSync(join(dir, 'dist/components/toggle'), { recursive: true });
    writeFileSync(
      join(dir, 'dist/components/toggle/ios.css'),
      `[part~="track"] { background: #34c759; --rollup-ios-css: 1; }\n`
    );
    writeFileSync(
      join(dir, 'dist/components/toggle/material.css'),
      `[part~="track"] { background: #6750a4; --rollup-mat-css: 1; }\n`
    );
    writeFileSync(
      join(dir, 'dist/components/toggle/snice-toggle.js'),
      `
      import { css, html } from 'snice';
      import { attachIos } from '../../../packages/components/src/platform-behaviors/ios.js';
      import { attachMaterial } from '../../../packages/components/src/platform-behaviors/material.js';
      var cssContent = ".track { background: gray; }";
      export function renderToggle() {
        return html\`<div part="track"><span part="ripple" data-platform-only="material" aria-hidden="true" hidden></span><span part="lens" data-platform-only="ios" aria-hidden="true" hidden></span></div>\`;
      }
      export function stylesToggle() {
        return css\`\${cssContent}\`;
      }
      export function bootToggle(el) {
        if (typeof __SNICE_PLATFORM__ !== 'undefined' && __SNICE_PLATFORM__ === 'ios') {
          attachIos(el);
        }
        if (typeof __SNICE_PLATFORM__ !== 'undefined' && __SNICE_PLATFORM__ === 'material') {
          attachMaterial(el);
        }
      }
      `
    );

    // 1. platform: 'ios'
    const iosBundle = await rollup({
      input: join(dir, 'dist/components/toggle/snice-toggle.js'),
      external: ['snice'],
      plugins: [resolve(), sniceRollup({ platform: 'ios', caching: false })],
    });
    const iosOut = (await iosBundle.generate({ format: 'es' })).output[0].code;
    await iosBundle.close();

    expect(iosOut).toContain('@layer snice-base{');
    expect(iosOut).toContain('--rollup-ios-css');
    expect(iosOut).not.toContain('--rollup-mat-css');
    expect(iosOut).toContain('part="lens"');
    expect(iosOut).not.toContain('part="ripple"');
    expect(iosOut).toContain('ROLLUP_IOS_ONLY');
    expect(iosOut).not.toContain('ROLLUP_MATERIAL_ONLY');

    // 2. platform: 'default' strips BOTH helper nodes and BOTH behavior modules
    const defBundle = await rollup({
      input: join(dir, 'dist/components/toggle/snice-toggle.js'),
      external: ['snice'],
      plugins: [resolve(), sniceRollup({ platform: 'default', caching: false })],
    });
    const defOut = (await defBundle.generate({ format: 'es' })).output[0].code;
    await defBundle.close();

    expect(defOut).not.toContain('@layer snice-base{');
    expect(defOut).not.toContain('--rollup-ios-css');
    expect(defOut).not.toContain('--rollup-mat-css');
    expect(defOut).not.toContain('part="lens"');
    expect(defOut).not.toContain('part="ripple"');
    expect(defOut).not.toContain('ROLLUP_IOS_ONLY');
    expect(defOut).not.toContain('ROLLUP_MATERIAL_ONLY');

    // 3. platform: 'preserve' keeps __SNICE_PLATFORM__ and both helper nodes intact
    const preserveBundle = await rollup({
      input: join(dir, 'dist/components/toggle/snice-toggle.js'),
      external: ['snice'],
      plugins: [resolve(), sniceRollup({ platform: 'preserve', caching: false })],
    });
    const preserveOut = (await preserveBundle.generate({ format: 'es' })).output[0].code;
    await preserveBundle.close();

    expect(preserveOut).toContain('__SNICE_PLATFORM__');
    expect(preserveOut).toContain('part="lens"');
    expect(preserveOut).toContain('part="ripple"');

    // 4. platform: undefined (backwards-compatible default) preserves both helper nodes
    const passthroughBundle = await rollup({
      input: join(dir, 'dist/components/toggle/snice-toggle.js'),
      external: ['snice'],
      plugins: [resolve(), sniceRollup({ caching: false })],
    });
    const passthroughOut = (await passthroughBundle.generate({ format: 'es' })).output[0].code;
    await passthroughBundle.close();

    expect(passthroughOut).toContain('part="lens"');
    expect(passthroughOut).toContain('part="ripple"');
  });
});
