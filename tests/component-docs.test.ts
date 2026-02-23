/**
 * Tests that every component has both human and AI documentation files,
 * ensuring the MCP server catalogue stays complete.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'components');
const humanDocsDir = path.join(process.cwd(), 'docs', 'components');
const aiDocsDir = path.join(process.cwd(), 'docs', 'ai', 'components');

const componentNames = fs.readdirSync(componentsDir).filter(name => {
  const fullPath = path.join(componentsDir, name);
  return fs.statSync(fullPath).isDirectory();
});

describe('Component Documentation', () => {
  it('should have at least one component', () => {
    expect(componentNames.length).toBeGreaterThan(0);
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
