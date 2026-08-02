import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

/**
 * A documented default must be the value the property actually initialises to.
 *
 * `camera.autoStart` was documented `true` while the source defaults it `false`,
 * `rating.icon` was documented `'★'` when it is `'star'`, `code-block.grammar`
 * `null` when it is `''`. Nothing caught these, because no test reads the
 * `@property` initialisers and compares them to the docs.
 */

const root = process.cwd();
const srcDir = resolve(root, 'packages/components/src');

/** Split a markdown row on unescaped pipes. */
function cells(line: string): string[] {
  const parts = line.replace(/\n$/, '').split(/(?<!\\)\|/);
  if (parts[0]?.trim() === '') parts.shift();
  if (parts[parts.length - 1]?.trim() === '') parts.pop();
  return parts.map(p => p.trim());
}

/** Only compare values that are literals; prose like "format hint" is a description. */
const LITERAL = /^('.*'|".*"|-?\d[\d.]*|true|false|\[\]|\{\}|null|undefined)$/;

function sourceDefaults(dir: string, name: string): Map<string, string> {
  const main = join(dir, `snice-${name}.ts`);
  const out = new Map<string, string>();
  if (!existsSync(main)) return out;
  const src = readFileSync(main, 'utf8');

  // Module constants, so `= DEFAULT_TILE_URL` resolves to its literal.
  const consts = new Map<string, string>();
  for (const m of src.matchAll(/const\s+([A-Z][A-Z0-9_]*)\s*(?::[^=]+)?=\s*('[^']*'|"[^"]*")\s*;/g)) {
    consts.set(m[1], m[2]);
  }

  // Enum members, so `= ChatLayout.Default` resolves to 'default'.
  const enums = new Map<string, string>();
  for (const file of readdirSync(dir).filter(f => f.endsWith('.types.ts'))) {
    const types = readFileSync(join(dir, file), 'utf8');
    for (const e of types.matchAll(/export\s+enum\s+([A-Za-z]+)\s*\{([^}]*)\}/g)) {
      for (const member of e[2].matchAll(/([A-Za-z0-9_]+)\s*=\s*('[^']*')/g)) {
        enums.set(`${e[1]}.${member[1]}`, member[2]);
      }
    }
  }

  const decl = /@property\(([^)]*)\)\s*(?:\n\s*)?(?:accessor\s+)?([a-zA-Z][a-zA-Z0-9]*)\s*(?::\s*[^=;\n]+?)?\s*=\s*([^;\n]+);/g;
  for (const m of src.matchAll(decl)) {
    let value = m[3].trim();
    value = consts.get(value) ?? enums.get(value) ?? value;
    out.set(m[2], value);
  }

  return out;
}

describe('documented property defaults match source', () => {
  it('every documented default equals the value the property initialises to', () => {
    const offenders: string[] = [];

    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const defaults = sourceDefaults(join(srcDir, entry.name), entry.name);
      if (defaults.size === 0) continue;

      const doc = resolve(root, `docs/components/${entry.name}.md`);
      if (!existsSync(doc)) continue;

      // Scope to the "## Properties" block, then to the component's own table
      // within it: sibling elements (snice-column, snice-row) document their own
      // properties under the same names in "### Declarative Column Properties".
      // The block ends at the next level-2 heading -- ending it at any heading
      // would swallow docs whose table sits under "### snice-breadcrumbs".
      const lines = readFileSync(doc, 'utf8').split('\n');
      const start = lines.findIndex(l => l.trim() === '## Properties');
      if (start === -1) continue;
      let end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
      if (end === -1) end = lines.length;

      let defaultCol: number | null = null;
      let sub: string | null = null;
      for (const line of lines.slice(start + 1, end)) {
        if (line.startsWith('###')) {
          sub = line.replace(/^#+/, '').trim().replace(/[`<>]/g, '').toLowerCase();
          defaultCol = null;
          continue;
        }
        if (!line.startsWith('|')) continue;
        if (sub !== null && !(sub.startsWith(entry.name) || sub.startsWith(`snice-${entry.name}`))) continue;
        const c = cells(line);
        if (c.includes('Default') && c.includes('Property')) { defaultCol = c.indexOf('Default'); continue; }
        if (defaultCol === null || c.length <= defaultCol) continue;

        const prop = c[0].replace(/`/g, '').split(/\s+/)[0];
        const expected = defaults.get(prop);
        if (expected === undefined) continue;

        const documented = c[defaultCol].replace(/`/g, '').trim();
        if (!documented || documented === '--' || documented === '—') continue;
        if (!LITERAL.test(documented)) continue;

        if (documented.replace(/^['"]|['"]$/g, '') !== expected.replace(/^['"]|['"]$/g, '')) {
          offenders.push(`${entry.name}.${prop}: documented ${documented}, source initialises ${expected}`);
        }
      }
    }

    expect(offenders, 'update the doc to the real default').toEqual([]);
  });
});
