// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const walk = (directory: string): string[] => readdirSync(directory, { withFileTypes: true })
  .flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });

describe('published package contract', () => {
  it('orders type conditions before runtime conditions and ships the skill', () => {
    expect(Object.keys(packageJson.exports['.'])).toEqual(['types', 'import', 'require']);
    expect(Object.keys(packageJson.exports['./testing/dom'])).toEqual(['types', 'import', 'require']);
    expect(Object.keys(packageJson.exports['./components/*'])).toEqual(['types', 'import']);
    expect(packageJson.files).toContain('.agents');
    expect(existsSync(join(root, '.agents/skills/snice/SKILL.md'))).toBe(true);
  });

  it('ships the opt-in DOM testing compatibility entry point', () => {
    const exported = packageJson.exports['./testing/dom'];
    for (const target of Object.values(exported) as string[]) {
      expect(existsSync(join(root, target)), `missing ${target}`).toBe(true);
    }
  });

  it('exposes event option types to a fresh NodeNext consumer', () => {
    const consumer = mkdtempSync(join(tmpdir(), 'snice-nodenext-types-'));
    try {
      mkdirSync(join(consumer, 'node_modules'), { recursive: true });
      symlinkSync(root, join(consumer, 'node_modules', 'snice'), 'junction');
      writeFileSync(join(consumer, 'package.json'), JSON.stringify({ type: 'module' }));
      writeFileSync(join(consumer, 'index.ts'), `
        import type { EventTiming, DispatchOptions, OnOptions } from 'snice';
        const timing: EventTiming = function () { return 25; };
        const dispatch: DispatchOptions = { debounce: timing };
        const on: OnOptions = { throttle: timing };
        void [dispatch, on];
      `);
      writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          noEmit: true,
          // This contract is the root package's named type surface. Snice's
          // declarations predate NodeNext's explicit-extension diagnostics,
          // which are a separate package-wide migration.
          skipLibCheck: true,
        },
        files: ['index.ts'],
      }));

      execFileSync(join(root, 'node_modules', '.bin', 'tsc'), ['-p', join(consumer, 'tsconfig.json')], {
        cwd: consumer,
        stdio: 'pipe',
      });
    } finally {
      rmSync(consumer, { recursive: true, force: true });
    }
  });

  it('resolves every documented deep component import to built JS', () => {
    const documentationFiles = [
      join(root, 'README.md'),
      join(root, 'DEVELOPMENT.md'),
      ...walk(join(root, 'docs')),
      ...walk(join(root, '.agents')),
      ...walk(join(root, 'bin/templates'))
    ].filter(path => /\.(?:md|tsx?)$/.test(path));
    const imports = documentationFiles
      .flatMap(path => [...readFileSync(path, 'utf8').matchAll(
        /import\s+['"]snice\/components\/([^/'"]+)\/([^'"]+)['"]/g
      )].map(match => ({ component: match[1], leaf: match[2] })));
    expect(imports.length).toBeGreaterThan(100);
    for (const { component, leaf } of imports) {
      const builtLeaf = leaf.endsWith('.css') ? leaf : `${leaf}.js`;
      expect(
        existsSync(join(root, 'dist/components', component, builtLeaf)),
        `missing snice/components/${component}/${leaf}`
      ).toBe(true);
    }
  });

  it('generates React examples with valid deep imports and removes WIP adapters', () => {
    const adapters = readdirSync(join(root, 'adapters/react')).filter(name => name.endsWith('.tsx'));
    let generated = 0;
    for (const filename of adapters) {
      const source = readFileSync(join(root, 'adapters/react', filename), 'utf8');
      if (!source.startsWith('// GENERATED FILE')) continue;
      generated++;
      const example = source.match(/import 'snice\/components\/([^']+)';/);
      expect(example, `missing deep registration example in ${filename}`).not.toBeNull();
      expect(
        existsSync(join(root, 'dist/components', `${example![1]}.js`)),
        `missing built target for ${example![0]}`
      ).toBe(true);
    }
    expect(generated).toBeGreaterThan(180);
    expect(existsSync(join(root, 'adapters/react/spreadsheet.tsx'))).toBe(false);
    expect(existsSync(join(root, 'adapters/react/spreadsheet.js'))).toBe(false);
  });

  it('embeds source content in distribution and React source maps', () => {
    const maps = [
      ...walk(join(root, 'dist')).filter(path => path.endsWith('.map')),
      ...walk(join(root, 'adapters/react')).filter(path => path.endsWith('.map'))
    ];
    expect(maps.length).toBeGreaterThan(500);
    for (const path of maps) {
      const map = JSON.parse(readFileSync(path, 'utf8'));
      expect(map.sourcesContent).toHaveLength(map.sources.length);
      expect(
        map.sourcesContent.every((source: string | null) => source !== null),
        `missing source content in ${path}`
      ).toBe(true);
    }
  });
});
