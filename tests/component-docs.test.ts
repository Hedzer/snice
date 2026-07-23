/**
 * Tests that every released component has both human and AI documentation
 * files, ensuring the MCP server catalogue stays complete without advertising
 * components excluded from distribution by packages/components/.wip.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseWipFile } from '../tooling/shared/wip-components.js';

const componentsDir = path.join(process.cwd(), 'packages/components/src');
const humanDocsDir = path.join(process.cwd(), 'docs', 'components');
const aiDocsDir = path.join(process.cwd(), 'docs', 'ai', 'components');
const wipComponents = parseWipFile(path.join(process.cwd(), 'packages/components/.wip'));

const componentNames = fs.readdirSync(componentsDir).filter(name => {
  if (wipComponents.has(name)) return false;
  const fullPath = path.join(componentsDir, name);
  if (!fs.statSync(fullPath).isDirectory()) return false;
  // Only scan directories that ship a user-facing custom element (contain a
  // snice-*.ts component file). Utility-only folders like `icons/`, `theme/`
  // don't need per-component docs.
  const files = fs.readdirSync(fullPath);
  return files.some(f => /^snice-.+\.ts$/.test(f));
});

describe('Component Documentation', () => {
  it('should have at least one component', () => {
    expect(componentNames.length).toBeGreaterThan(0);
  });

  it('should exclude every WIP component from the released documentation set', () => {
    for (const name of wipComponents) {
      expect(componentNames, `${name} is marked WIP`).not.toContain(name);
    }
  });

  describe('AI docs (MCP server catalogue)', () => {
    for (const name of componentNames) {
      it(`${name} should have AI docs at docs/ai/components/${name}.md`, () => {
        const docPath = path.join(aiDocsDir, `${name}.md`);
        expect(fs.existsSync(docPath), `Missing: docs/ai/components/${name}.md`).toBe(true);
      });
    }
  });

  describe('Human docs', () => {
    for (const name of componentNames) {
      it(`${name} should have human docs at docs/components/${name}.md`, () => {
        const docPath = path.join(humanDocsDir, `${name}.md`);
        expect(fs.existsSync(docPath), `Missing: docs/components/${name}.md`).toBe(true);
      });
    }
  });
});
