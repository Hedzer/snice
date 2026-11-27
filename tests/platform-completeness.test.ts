// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COMPONENT_PLATFORM_CLASSIFICATION,
  PLATFORM_SPEC_TARGETS,
  SNICE_SKIN_PLATFORMS,
  validatePlatformCss,
} from '../packages/components/src/platforms';

const repoRoot = process.cwd();
const componentsDir = join(repoRoot, 'packages/components/src');
const designDir = join(repoRoot, '.local/design/platform-skins');
const distPlatformsDir = join(repoRoot, 'dist/components/theme/platforms');

function listReleasedComponents(): string[] {
  return Object.keys(COMPONENT_PLATFORM_CLASSIFICATION).sort();
}

describe('Platform Skins completeness & static conformance gate (PS-08)', () => {
  it('ensures all 134 released components expose part="..." attributes', () => {
    const released = listReleasedComponents();
    expect(released.length).toBe(134);

    const missingParts: string[] = [];
    for (const comp of released) {
      const dir = join(componentsDir, comp);
      const tsFiles = readdirSync(dir).filter(
        (f) => f.endsWith('.ts') && !f.endsWith('.types.ts') && !f.endsWith('.stories.ts') && !f.endsWith('.test.ts')
      );
      const combined = tsFiles.map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
      const hasStaticPart = /\bpart\s*=/.test(combined);
      const hasImperativePart = /setAttribute\(\s*['"]part['"]/.test(combined);
      if (!hasStaticPart && !hasImperativePart) {
        missingParts.push(comp);
      }
    }

    expect(missingParts).toEqual([]);
  });

  it('requires every released component in all 4 platform equivalence ledgers with pinned contemporary specs', () => {
    const released = listReleasedComponents();

    for (const platform of SNICE_SKIN_PLATFORMS) {
      const ledgerPath = join(designDir, `${platform}-equivalence.md`);
      expect(existsSync(ledgerPath), `Missing equivalence ledger: ${ledgerPath}`).toBe(true);

      const content = readFileSync(ledgerPath, 'utf8');
      expect(content).toContain(`**Platform ID**: \`${platform}\``);
      expect(content).toContain('**Pinned Contemporary Spec**');
      expect(content).toContain('**Verified Date**');
      expect(content).toContain('**Font / Trademark / Asset Provenance**');
      expect(content).toContain('**Browser-Imposed Limits**');
      expect(content).toContain(PLATFORM_SPEC_TARGETS[platform].pinnedDate);
      expect(content).toMatch(/https:\/\//);

      const missingFromLedger = released.filter((comp) => !content.includes(`\`snice-${comp}\``));
      expect(missingFromLedger, `Components missing from ${platform}-equivalence.md`).toEqual([]);
    }
  });

  it('validates 100% of Layer 2 <comp>/<platform>.css files against selector, !important, and zero-cell-blur rules', () => {
    const violations: string[] = [];
    const blurViolations: string[] = [];
    let validatedCount = 0;

    for (const dirEntry of readdirSync(componentsDir, { withFileTypes: true })) {
      if (!dirEntry.isDirectory() || dirEntry.name === 'theme' || dirEntry.name === 'platform-behaviors') continue;
      const compDir = join(componentsDir, dirEntry.name);
      for (const file of readdirSync(compDir)) {
        const match = file.match(/^(?:.+\.)?(ios|material|windows|macos)\.css$/);
        if (!match) continue;
        validatedCount++;
        const fullPath = join(compDir, file);
        const css = readFileSync(fullPath, 'utf8');
        const errors = validatePlatformCss(css, `${dirEntry.name}/${file}`);
        for (const err of errors) {
          violations.push(`${err.file}:${err.line} ${err.message}`);
        }

        // Scrolling data cells & card bases must never apply backdrop-filter blur
        if (dirEntry.name === 'table' || dirEntry.name === 'card') {
          const blocks = css.matchAll(/([^{}]+)\{([^{}]*)\}/g);
          for (const [, sel, body] of blocks) {
            const isDataCellOrCard =
              dirEntry.name === 'card' || /\[part~=["'](?:cell|row|frame|container)["']\]/.test(sel);
            if (isDataCellOrCard && /backdrop-filter\s*:/i.test(body)) {
              blurViolations.push(`${dirEntry.name}/${file} (${sel.trim()}) contains forbidden backdrop-filter on scrolling data surface`);
            }
          }
        }
      }
    }

    expect(validatedCount).toBeGreaterThanOrEqual(120);
    expect(violations).toEqual([]);
    expect(blurViolations).toEqual([]);
  });

  it('verifies all 4 compiled *-scoped.css files exist with zero :root leaks and zero :host-context() usage', () => {
    for (const platform of SNICE_SKIN_PLATFORMS) {
      const scopedPath = join(distPlatformsDir, `${platform}-scoped.css`);
      expect(existsSync(scopedPath), `Missing scoped CSS: ${scopedPath}`).toBe(true);
      const css = readFileSync(scopedPath, 'utf8');
      expect(css.length).toBeGreaterThan(500);
      // Zero bare `:root{` or `:root,` leaks (scoped `:root[data-platform=...]:not([data-theme])` inside dark media is intentional)
      expect(css).not.toMatch(/(?:^|[},;])\s*:root\s*[{,]/);
      expect(css).not.toContain(':host-context(');
      expect(css).toMatch(new RegExp(`\\[data-platform=["']?${platform}["']?\\]`));
    }
  });
});
