// @vitest-environment node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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
    expect(Object.keys(packageJson.exports['./components/*'])).toEqual(['types', 'import']);
    expect(packageJson.files).toContain('.agents');
    expect(existsSync(join(root, '.agents/skills/snice/SKILL.md'))).toBe(true);
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
