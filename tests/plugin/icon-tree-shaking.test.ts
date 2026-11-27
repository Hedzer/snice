// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import { ICONS, X_MARK, PHOTO, ROCKET_LAUNCH } from '../../packages/components/src/icons';

const ROOT = process.cwd();
const tempDirs: string[] = [];

function createFixture(entryCode: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'snice-icons-'));
  tempDirs.push(dir);
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(ROOT, join(dir, 'node_modules', 'snice'), 'junction');
  for (const pkg of ['tslib', 'pica-route']) {
    const p = join(ROOT, 'node_modules', pkg);
    if (existsSync(p)) symlinkSync(p, join(dir, 'node_modules', pkg), 'junction');
  }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'icon-test', type: 'module' }));
  const entry = join(dir, 'entry.js');
  writeFileSync(entry, entryCode);
  return entry;
}

describe('Per-icon tree-shaking (packages/components/src/icons/)', () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
  });

  it('preserves full backwards-compatible ICONS registry and named exports', () => {
    expect(ICONS['x-mark']).toBe(X_MARK);
    expect(ICONS['photo']).toBe(PHOTO);
    expect(ICONS['rocket-launch']).toBe(ROCKET_LAUNCH);
    expect(Object.keys(ICONS).length).toBeGreaterThanOrEqual(65);
  });

  it('single-icon component bundle (snice-modal) excludes unused icons from the 35 KB registry', async () => {
    const entry = createFixture(`import 'snice/components/modal/snice-modal';\n`);
    const bundle = await rollup({
      input: entry,
      external: ['snice', 'snice/symbols', 'snice/transitions'],
      plugins: [nodeResolve()],
    });
    let code = '';
    try {
      const { output } = await bundle.generate({ format: 'es' });
      code = output[0].code;
    } finally {
      await bundle.close();
    }

    // X_MARK path is included
    expect(code).toContain('M6 18 18 6M6 6l12 12');
    // Unused icons from the 35 KB barrel MUST NOT be pulled into the bundle
    expect(code).not.toContain('M15.59 14.37'); // ROCKET_LAUNCH
    expect(code).not.toContain('M12 12.75c1.148'); // BUG_ANT
    expect(code).not.toContain('M7.848 8.25'); // SCISSORS
    expect(code).not.toContain('M9.813 15.904'); // SPARKLES
    expect(code).not.toContain('M3.375 19.5h17.25'); // TABLE_CELLS
    // Modal ESM bundle without runtime should be well under 30 KB (not 22 KB + 35 KB = 57 KB)
    expect(Buffer.byteLength(code, 'utf8')).toBeLessThan(30_000);
  });

  it('direct per-icon subpath import bundles ONLY that single icon (<500 bytes)', async () => {
    const entry = createFixture(`import { X_MARK } from 'snice/components/icons/x-mark';\nexport { X_MARK };\n`);
    const bundle = await rollup({
      input: entry,
      plugins: [nodeResolve()],
    });
    let code = '';
    try {
      const { output } = await bundle.generate({ format: 'es' });
      code = output[0].code;
    } finally {
      await bundle.close();
    }

    expect(code).toContain('M6 18 18 6M6 6l12 12');
    expect(Buffer.byteLength(code, 'utf8')).toBeLessThan(500);
  });
});
