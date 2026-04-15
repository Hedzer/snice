// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DOCS_DIR = join(process.cwd(), 'docs');
const README = join(process.cwd(), 'README.md');

describe('doc AI redirects', () => {
  it('every human doc has an HTML comment pointing to the AI version', () => {
    const files = readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));
    const missing: string[] = [];

    for (const file of files) {
      const content = readFileSync(join(DOCS_DIR, file), 'utf8');
      if (!content.includes('<!-- AI:')) {
        missing.push(file);
      }
    }

    expect(missing).toEqual([]);
  });

  it('AI redirect comments point to files that exist', () => {
    const files = readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));
    const broken: string[] = [];

    for (const file of files) {
      const content = readFileSync(join(DOCS_DIR, file), 'utf8');
      const match = content.match(/<!-- AI:.*see\s+(\S+)\s/);
      if (match) {
        const target = join(process.cwd(), match[1]);
        if (!existsSync(target)) {
          broken.push(`${file} -> ${match[1]} (not found)`);
        }
      }
    }

    expect(broken).toEqual([]);
  });

  it('README has an invisible AI redirect comment', () => {
    const content = readFileSync(README, 'utf8');
    expect(content).toContain('<!-- AI:');
    expect(content).toContain('docs/ai/');
    // Should NOT be visible as a blockquote
    expect(content).not.toMatch(/^>\s*\*\*AI/m);
  });
});
