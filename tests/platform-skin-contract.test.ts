// @vitest-environment node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SNICE_PLATFORMS,
  SNICE_SKIN_PLATFORMS,
  PLATFORM_SPEC_TARGETS,
  COMPONENT_PLATFORM_CLASSIFICATION,
  isSnicePlatform,
  isSniceSkinPlatform,
  isValidPlatformComponentSelector,
  validatePlatformCss,
} from '../packages/components/src/platforms';

const root = process.cwd();
const componentsRoot = join(root, 'packages/components/src');
const wipPath = join(root, 'packages/components/.wip');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

function getWipSet(): Set<string> {
  if (!existsSync(wipPath)) return new Set();
  return new Set(
    readFileSync(wipPath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
  );
}

function getReleasedComponents(): string[] {
  const wip = getWipSet();
  return readdirSync(componentsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !wip.has(name) && existsSync(join(componentsRoot, name, `snice-${name}.ts`)))
    .sort();
}

function collectComponentTsFiles(compDir: string): string[] {
  const fullDir = join(componentsRoot, compDir);
  return readdirSync(fullDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.types.ts') && !entry.name.endsWith('.stories.ts'))
    .map((entry) => join(fullDir, entry.name));
}

describe('platform skin contract', () => {
  it('defines canonical platforms, contemporary spec targets, and type guards', () => {
    expect(SNICE_PLATFORMS).toEqual(['default', 'ios', 'material', 'windows', 'macos']);
    expect(SNICE_SKIN_PLATFORMS).toEqual(['ios', 'material', 'windows', 'macos']);

    expect(isSnicePlatform('default')).toBe(true);
    expect(isSnicePlatform('ios')).toBe(true);
    expect(isSnicePlatform('material')).toBe(true);
    expect(isSnicePlatform('windows')).toBe(true);
    expect(isSnicePlatform('macos')).toBe(true);
    expect(isSnicePlatform('legacy')).toBe(false);
    expect(isSnicePlatform(123)).toBe(false);

    expect(isSniceSkinPlatform('default')).toBe(false);
    expect(isSniceSkinPlatform('ios')).toBe(true);
    expect(isSniceSkinPlatform('macos')).toBe(true);

    for (const p of SNICE_SKIN_PLATFORMS) {
      const spec = PLATFORM_SPEC_TARGETS[p];
      expect(spec.id).toBe(p);
      expect(spec.guidelineRelease.length).toBeGreaterThan(10);
      expect(spec.fontPolicy.length).toBeGreaterThan(10);
      expect(spec.browserLimits.length).toBeGreaterThan(0);
    }
    expect(PLATFORM_SPEC_TARGETS.ios.displayName).toMatch(/iOS 26/i);
    expect(PLATFORM_SPEC_TARGETS.material.displayName).toMatch(/Material 3 Expressive/i);
    expect(PLATFORM_SPEC_TARGETS.windows.displayName).toMatch(/Windows 11 Fluent 2/i);
    expect(PLATFORM_SPEC_TARGETS.macos.displayName).toMatch(/macOS 26/i);
  });

  it('exposes part="..." on 100% of released components (all 134 non-WIP)', () => {
    const released = getReleasedComponents();
    expect(released.length).toBe(134);

    const missingParts: string[] = [];
    for (const comp of released) {
      const mainFile = join(componentsRoot, comp, `snice-${comp}.ts`);
      const src = readFileSync(mainFile, 'utf8');
      const hasStaticPart = /\bpart\s*=/.test(src);
      const hasImperativePart = /setAttribute\(\s*['"]part['"]/.test(src);
      if (!hasStaticPart && !hasImperativePart) {
        missingParts.push(comp);
      }
    }

    expect(missingParts, `Released components missing part attributes: ${missingParts.join(', ')}`).toEqual([]);
  });

  it('classifies every released component cleanly with zero WIP or orphan entries', () => {
    const released = getReleasedComponents();
    const classified = Object.keys(COMPONENT_PLATFORM_CLASSIFICATION).sort();
    expect(classified).toEqual(released);

    const validClasses = new Set(['direct-analogue', 'composite', 'non-native-guideline']);
    for (const [comp, cls] of Object.entries(COMPONENT_PLATFORM_CLASSIFICATION)) {
      expect(validClasses.has(cls), `Invalid classification "${cls}" for ${comp}`).toBe(true);
    }
  });

  it('exposes state parts and hidden data-platform-only helper nodes on marquee controls', () => {
    const switchSrc = readFileSync(join(componentsRoot, 'switch/snice-switch.ts'), 'utf8');
    expect(switchSrc).toContain('track-checked');
    expect(switchSrc).toContain('thumb-checked');
    expect(switchSrc).toContain('data-platform-only="material"');
    expect(switchSrc).toContain('data-platform-only="ios,macos"');

    const buttonSrc = readFileSync(join(componentsRoot, 'button/snice-button.ts'), 'utf8');
    expect(buttonSrc).toContain('base-outline');
    expect(buttonSrc).toContain('base-pill');
    expect(buttonSrc).toContain('base-circle');
    expect(buttonSrc).toContain('data-platform-only="material"');

    const checkboxSrc = readFileSync(join(componentsRoot, 'checkbox/snice-checkbox.ts'), 'utf8');
    expect(checkboxSrc).toContain('checkbox-checked');
    expect(checkboxSrc).toContain('checkbox-indeterminate');
    expect(checkboxSrc).toContain('data-platform-only="material"');

    const radioSrc = readFileSync(join(componentsRoot, 'radio/snice-radio.ts'), 'utf8');
    expect(radioSrc).toContain('radio-checked');
    expect(radioSrc).toContain('dot-checked');
    expect(radioSrc).toContain('data-platform-only="material"');

    const sliderSrc = readFileSync(join(componentsRoot, 'slider/snice-slider.ts'), 'utf8');
    expect(sliderSrc).toContain('part="stops"');
    expect(sliderSrc).toContain('part="lens"');
    expect(sliderSrc).toContain('data-platform-only="material"');
    expect(sliderSrc).toContain('data-platform-only="ios,macos"');

    const tabSrc = readFileSync(join(componentsRoot, 'tabs/snice-tab.ts'), 'utf8');
    expect(tabSrc).toContain('base-active');
    expect(tabSrc).toContain('base-selected');
    expect(tabSrc).toContain('data-platform-only="material"');

    const drawerSrc = readFileSync(join(componentsRoot, 'drawer/snice-drawer.ts'), 'utf8');
    expect(drawerSrc).toContain('base-open');
    expect(drawerSrc).toContain('part="grabber"');

    const modalSrc = readFileSync(join(componentsRoot, 'modal/snice-modal.ts'), 'utf8');
    expect(modalSrc).toContain('base-open');
    expect(modalSrc).toContain('panel-open');

    const inputSrc = readFileSync(join(componentsRoot, 'input/snice-input.ts'), 'utf8');
    expect(inputSrc).toContain('input-disabled');
    expect(inputSrc).toContain('input-invalid');

    const selectSrc = readFileSync(join(componentsRoot, 'select/snice-select.ts'), 'utf8');
    expect(selectSrc).toContain('trigger-open');
    expect(selectSrc).toContain('dropdown-open');

    const cardSrc = readFileSync(join(componentsRoot, 'card/snice-card.ts'), 'utf8');
    expect(cardSrc).toContain('base-selected');
    expect(cardSrc).toContain('base-disabled');

    const chipSrc = readFileSync(join(componentsRoot, 'chip/snice-chip.ts'), 'utf8');
    expect(chipSrc).toContain('base-selected');
    expect(chipSrc).toContain('data-platform-only="material"');
  });

  it('requires every data-platform-only helper node to carry hidden, aria-hidden="true", valid platforms, and no dynamic expressions', () => {
    const released = getReleasedComponents();
    const violations: string[] = [];
    let helperCount = 0;

    // Match opening tags containing data-platform-only="..."
    const tagRe = /<([a-zA-Z0-9-]+)\b([^>]*\bdata-platform-only\s*=\s*["']([^"']+)["'][^>]*)>([\s\S]*?)<\/\1>/g;
    for (const comp of released) {
      for (const file of collectComponentTsFiles(comp)) {
        const src = readFileSync(file, 'utf8');
        if (!src.includes('data-platform-only')) continue;

        let match: RegExpExecArray | null;
        tagRe.lastIndex = 0;
        while ((match = tagRe.exec(src)) !== null) {
          helperCount++;
          const [, , attrs, rawPlatforms, inner] = match;
          if (!/\bhidden\b/.test(attrs)) {
            violations.push(`${file}: data-platform-only="${rawPlatforms}" is missing the hidden attribute.`);
          }
          if (!/\baria-hidden\s*=\s*["']true["']/.test(attrs)) {
            violations.push(`${file}: data-platform-only="${rawPlatforms}" is missing aria-hidden="true".`);
          }
          if (attrs.includes('${') || inner.includes('${')) {
            violations.push(`${file}: data-platform-only="${rawPlatforms}" must be static (no \${...} expressions).`);
          }
          const platforms = rawPlatforms.split(',').map((s) => s.trim()).filter(Boolean);
          if (platforms.length === 0) {
            violations.push(`${file}: empty data-platform-only attribute.`);
          }
          for (const p of platforms) {
            if (!isSniceSkinPlatform(p)) {
              violations.push(`${file}: unknown platform "${p}" in data-platform-only="${rawPlatforms}".`);
            }
          }
        }
      }
    }

    expect(helperCount).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });

  it('strictly validates the Layer 2 <comp>/<platform>.css selector and !important contract', () => {
    // Valid selectors
    expect(isValidPlatformComponentSelector(':host')).toBe(true);
    expect(isValidPlatformComponentSelector(':host([variant="primary"])')).toBe(true);
    expect(isValidPlatformComponentSelector(':host([disabled]) [part~="base"]')).toBe(true);
    expect(isValidPlatformComponentSelector('[part~="track-checked"]')).toBe(true);
    expect(isValidPlatformComponentSelector('[part~="base"]:hover')).toBe(true);
    expect(isValidPlatformComponentSelector('[part~="base"]:focus-visible::after')).toBe(true);
    expect(
      validatePlatformCss(`
        :host { --snice-switch-width: 51px; }
        :host([size="small"]) [part~="track"] { height: 22px; }
        [part~="track-checked"] { background: var(--snice-color-success); }
        @media (prefers-reduced-motion: reduce) {
          [part~="thumb"] { transition: none; }
        }
        @keyframes ripple {
          from { opacity: 0.2; }
          to { opacity: 0; }
        }
      `)
    ).toEqual([]);

    // Invalid selectors & forbidden !important
    const privateClassErrors = validatePlatformCss('.switch-track { background: red; }', 'test/ios.css');
    expect(privateClassErrors.length).toBeGreaterThan(0);
    expect(privateClassErrors[0]).toContain('.switch-track');

    const importantErrors = validatePlatformCss('[part~="track"] { background: red !important; }', 'test/ios.css');
    expect(importantErrors.length).toBeGreaterThan(0);
    expect(importantErrors[0]).toContain('!important');

    const descendantErrors = validatePlatformCss('[part~="track"] span { color: red; }', 'test/ios.css');
    expect(descendantErrors.length).toBeGreaterThan(0);

    const hostContextErrors = validatePlatformCss(':host-context([data-platform="ios"]) [part~="base"] { color: red; }', 'test/ios.css');
    expect(hostContextErrors.length).toBeGreaterThan(0);

    // Validate every existing <comp>/<platform>.css on disk
    const released = getReleasedComponents();
    const diskErrors: string[] = [];
    for (const comp of released) {
      for (const p of SNICE_SKIN_PLATFORMS) {
        const cssFile = join(componentsRoot, comp, `${p}.css`);
        if (existsSync(cssFile)) {
          diskErrors.push(...validatePlatformCss(readFileSync(cssFile, 'utf8'), `${comp}/${p}.css`));
        }
      }
    }
    expect(diskErrors).toEqual([]);
  });

  it('exports ./components/theme/platforms/*.css and preserves types-first export ordering', () => {
    expect(packageJson.exports['./components/theme/platforms/*.css']).toBe(
      './dist/components/theme/platforms/*.css'
    );
    expect(Object.keys(packageJson.exports['.'])).toEqual(['types', 'import', 'require']);
    expect(Object.keys(packageJson.exports['./vite'])).toEqual(['types', 'import']);
    expect(Object.keys(packageJson.exports['./rollup'])).toEqual(['types', 'import']);
    expect(Object.keys(packageJson.exports['./components/*'])).toEqual(['types', 'import']);
  });
});
