import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Placard } from '../packages/core/src/types/placard';

describe('placard.href — type', () => {
  it('Placard type accepts optional href', () => {
    const p: Placard = { name: 'x', title: 'X', href: '#/x' };
    expect(p.href).toBe('#/x');
  });

  it('Placard type works without href', () => {
    const p: Placard = { name: 'x', title: 'X' };
    expect(p.href).toBeUndefined();
  });
});

describe('placard.href — templates and examples', () => {
  const root = join(__dirname, '..');

  // Files that should contain placards with href
  const placardFiles = [
    'bin/templates/default/src/pages/dashboard.ts',
    'bin/templates/default/src/pages/data.ts',
    'bin/templates/default/src/pages/login.ts',
    'bin/templates/default/src/pages/notifications.ts',
    'bin/templates/default/src/pages/profile.ts',
    'bin/templates/default/src/pages/settings.ts',
    'bin/templates/react/src/App.tsx',
    'examples/store/src/pages/cart.ts',
    'examples/store/src/pages/home.ts',
    'examples/store/src/pages/login.ts',
    'examples/store/src/pages/products.ts',
    'examples/dashboard/src/pages/overview.ts',
    'examples/dashboard/src/pages/reports.ts',
    'examples/dashboard/src/pages/settings.ts',
    'examples/task-manager/src/pages/board.ts',
    'examples/task-manager/src/pages/login.ts',
    'examples/task-manager/src/pages/settings.ts',
    'website/showcases/layout/placard-demo.html',
  ];

  for (const rel of placardFiles) {
    it(`${rel} contains href in placard definitions`, () => {
      const path = join(root, rel);
      expect(existsSync(path), `missing ${rel}`).toBe(true);
      const src = readFileSync(path, 'utf8');
      expect(src, `${rel} should contain href:`).toMatch(/href:\s*['"]/);
    });
  }
});

describe('placard.href — docs do not use #/${p.name} pattern', () => {
  const root = join(__dirname, '..');

  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) out.push(...walk(p));
      else if (entry.isFile() && p.endsWith('.md')) out.push(p);
    }
    return out;
  }

  it('no doc references the removed hash-from-name pattern', () => {
    const docs = walk(join(root, 'docs'));
    const offenders: string[] = [];
    for (const f of docs) {
      const src = readFileSync(f, 'utf8');
      if (/href\s*=\s*["']#\/\$\{p\.name\}/.test(src)) {
        offenders.push(f);
      }
    }
    expect(offenders).toEqual([]);
  });
});
