import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { transformSync } from 'esbuild';

const root = process.cwd();
const testDir = mkdtempSync(join(tmpdir(), 'snice-deploy-build-'));
const siteDir = join(testDir, 'site');
const showcaseDir = join(siteDir, 'showcase');

describe('deployed full showcases', () => {
  beforeAll(() => {
    execFileSync(process.execPath, ['tooling/website/build-deploy.js'], {
      cwd: root,
      env: { ...process.env, SNICE_WEBSITE_SITE_DIR: siteDir },
      stdio: 'pipe'
    });
  });

  afterAll(() => rmSync(testDir, { recursive: true, force: true }));

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

  it('maps sibling modules to their CDN family bundle', () => {
    const accordion = readFileSync(join(showcaseDir, 'accordion.html'), 'utf8');
    expect(accordion).toContain('/components/snice-accordion.min.js');
    expect(accordion).not.toContain('/components/snice-accordion-item.min.js');

    const layout = readFileSync(join(showcaseDir, 'layout.html'), 'utf8');
    expect(layout.match(/\/components\/snice-layout\.min\.js/g)).toHaveLength(1);
    expect(layout).not.toMatch(/\/components\/snice-layout-(?:sidebar|dashboard|docs|blog).*\.min\.js/);
  });

  it('uses the generated site theme in the theme showcase', () => {
    const theme = readFileSync(join(showcaseDir, 'theme.html'), 'utf8');
    expect(theme).toMatch(/href="\/theme\/theme\.css\?v=[a-f0-9]+"/);
  });
});
