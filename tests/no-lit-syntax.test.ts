import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('Code Quality - No Lit Framework Syntax', () => {
  it('should use snice framework syntax, NOT Lit framework syntax', async () => {
    // CRITICAL: If this test fails, RE-READ CLAUDE.md to understand the correct snice framework syntax!
    // This framework uses its own patterns that are different from Lit.
    // Using Lit syntax will cause TypeScript compilation errors and broken components.

    const componentsDir = path.join(process.cwd(), 'components');
    const files = await getAllComponentFiles(componentsDir);

    const violations: string[] = [];

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for Lit's static styles pattern
        // WRONG: static styles = css`...`
        // CORRECT: @styles() decorating styles() method
        if (line.match(/^\s*static\s+styles\s*=/)) {
          violations.push(
            `${file}:${index + 1} - Found "static styles =" (Lit syntax) - Use @styles() styles() { return css/*css*/\`...\`; }`
          );
        }

        // Check for requestUpdate() calls (doesn't exist in snice)
        if (line.match(/this\.requestUpdate\s*\(/)) {
          violations.push(
            `${file}:${index + 1} - Found "this.requestUpdate()" (Lit syntax) - snice framework handles updates automatically!`
          );
        }

        // Check for css template WITHOUT /*css*/ comment
        // WRONG: return css`...` or css`${var}`
        // CORRECT: return css/*css*/`...`
        if (line.match(/return\s+css`/) && !line.match(/css\/\*css\*\//)) {
          violations.push(
            `${file}:${index + 1} - Missing /*css*/ comment in css template - Use css/*css*/\`...\` pattern!`
          );
        }
      });
    }

    if (violations.length > 0) {
      const message = [
        '❌ FOUND LIT FRAMEWORK SYNTAX IN SNICE COMPONENTS!',
        '',
        '🔴 RE-READ /home/hedzer/Dropbox/Projects/snice/CLAUDE.md TO LEARN THE CORRECT SYNTAX! 🔴',
        '',
        'This is the SNICE framework, NOT Lit. The syntax is different:',
        '',
        'WRONG (Lit):',
        '  static styles = css`...`',
        '  render() { return html`...`; }',
        '  this.requestUpdate();',
        '',
        'CORRECT (Snice):',
        '  @styles()',
        '  styles() { return css/*css*/`${cssContent}`; }',
        '  ',
        '  @render()',
        '  render() { return html`...`; }',
        '  ',
        '  // No requestUpdate() - framework handles it automatically',
        '',
        'Violations found:',
        '',
        ...violations,
        '',
        '🔴 RE-READ CLAUDE.md AND docs/ai/README.md FOR CORRECT FRAMEWORK SYNTAX! 🔴'
      ].join('\n');

      throw new Error(message);
    }

    expect(violations).toHaveLength(0);
  });
});

async function getAllComponentFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively get files from subdirectories
      const subFiles = await getAllComponentFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && entry.name.startsWith('snice-') && entry.name.endsWith('.ts') && !entry.name.endsWith('.types.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}
