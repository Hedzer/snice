import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { transformSync } from 'esbuild';

const root = process.cwd();
const showcaseDir = join(root, 'dist/site/showcase');

describe('deployed full showcases', () => {
  beforeAll(() => {
    execFileSync(process.execPath, ['scripts/build-deploy.js'], { cwd: root, stdio: 'pipe' });
  });

  it('keeps template interpolation and JavaScript property names intact', () => {
    const table = readFileSync(join(showcaseDir, 'table.html'), 'utf8');
    expect(table).toContain('`${detail.action} · ${detail.rowData.name} · ${detail.column.label}`');
    expect(table).toContain('card.style.cssText');
    expect(table).not.toContain('$${');
    expect(table).not.toMatch(/\.css\?v=[a-f0-9]+Text/);
  });

  it('emits syntactically valid inline scripts with module semantics preserved', () => {
    const failures: string[] = [];
    for (const file of readdirSync(showcaseDir).filter((name) => name.endsWith('.html'))) {
      const html = readFileSync(join(showcaseDir, file), 'utf8');
      const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
      scripts.forEach((match, index) => {
        const attrs = match[1];
        const source = match[2];
        if (/\bsrc=/.test(attrs) || !source.trim()) return;
        try {
          if (/type=["']module["']/.test(attrs)) {
            transformSync(source, { loader: 'js', format: 'esm', target: 'esnext' });
          } else {
            new vm.Script(source, { filename: `${file}:inline-${index}` });
          }
        } catch (error) {
          failures.push(`${file}: ${String(error)}`);
        }
      });
    }
    expect(failures).toEqual([]);
  });
});
