import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

/**
 * A documented union must list the values the type actually permits.
 *
 * `breadcrumbs.separator` advertised `'>>'` and `'.'` -- neither accepted -- and
 * omitted `'»'` and `'•'`, which are. Nothing caught it, because no test
 * compares documented value lists against the declared type.
 *
 * Aliases resolve per component directory, never globally: `BadgeVariant` is
 * declared in both badge and product-card with different members, so a shared
 * table would compare one component against the other's values.
 */

const root = process.cwd();
const srcDir = resolve(root, 'packages/components/src');

function cells(line: string): string[] {
  const parts = line.replace(/\n$/, '').split(/(?<!\\)\|/);
  if (parts[0]?.trim() === '') parts.shift();
  if (parts[parts.length - 1]?.trim() === '') parts.pop();
  return parts.map(p => p.trim());
}

/**
 * Single-quoted literals in a type expression. A literal `|` must be written
 * `\|` inside a markdown table cell, so unescape it before comparing.
 */
function literals(text: string): Set<string> {
  return new Set([...text.matchAll(/'([^']*)'/g)].map(m => m[1].replace(/\\\|/g, '|')));
}

/** Union members for each property, resolving component-local type aliases. */
function unionsFor(dir: string, name: string): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  const main = join(dir, `snice-${name}.ts`);
  if (!existsSync(main)) return out;

  const alias = new Map<string, Set<string>>();
  for (const file of readdirSync(dir).filter(f => f.endsWith('.types.ts'))) {
    const types = readFileSync(join(dir, file), 'utf8');
    for (const m of types.matchAll(/export\s+type\s+([A-Za-z]+)\s*=\s*([^;]+);/g)) {
      if (m[2].includes("'")) alias.set(m[1], literals(m[2]));
    }
    for (const m of types.matchAll(/export\s+enum\s+([A-Za-z]+)\s*\{([^}]*)\}/g)) {
      const values = new Set([...m[2].matchAll(/=\s*'([^']*)'/g)].map(x => x[1]));
      if (values.size) alias.set(m[1], values);
    }
  }

  const decl = /@property\(([^)]*)\)\s*(?:\n\s*)?(?:accessor\s+)?([a-zA-Z][a-zA-Z0-9]*)\s*:\s*([^=;\n]+?)\s*=/g;
  for (const m of readFileSync(main, 'utf8').matchAll(decl)) {
    const type = m[3].trim();
    if (type.includes("'")) out.set(m[2], literals(type));
    else if (alias.has(type)) out.set(m[2], alias.get(type)!);
  }

  return out;
}

describe('documented enum values match the declared type', () => {
  it('every documented value list matches the union the property accepts', () => {
    const offenders: string[] = [];

    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const unions = unionsFor(join(srcDir, entry.name), entry.name);
      if (unions.size === 0) continue;

      const doc = resolve(root, `docs/components/${entry.name}.md`);
      if (!existsSync(doc)) continue;

      // Ends at the next level-2 heading, then narrows to the component's own
      // table -- breadcrumbs puts its table under "### snice-breadcrumbs", and
      // table.md documents snice-column's properties in the same section.
      const lines = readFileSync(doc, 'utf8').split('\n');
      const start = lines.findIndex(l => l.trim() === '## Properties');
      if (start === -1) continue;
      let end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
      if (end === -1) end = lines.length;

      let typeCol: number | null = null;
      let sub: string | null = null;
      for (const line of lines.slice(start + 1, end)) {
        if (line.startsWith('###')) {
          sub = line.replace(/^#+/, '').trim().replace(/[`<>]/g, '').toLowerCase();
          typeCol = null;
          continue;
        }
        if (!line.startsWith('|')) continue;
        if (sub !== null && !(sub.startsWith(entry.name) || sub.startsWith(`snice-${entry.name}`))) continue;
        const c = cells(line);
        if (c.includes('Type') && c.includes('Property')) { typeCol = c.indexOf('Type'); continue; }
        if (typeCol === null || c.length <= typeCol) continue;

        const prop = c[0].replace(/`/g, '').split(/\s+/)[0];
        const expected = unions.get(prop);
        if (!expected) continue;

        const documented = literals(c[typeCol]);
        if (documented.size === 0) continue;

        const missing = [...expected].filter(v => !documented.has(v));
        const extra = [...documented].filter(v => !expected.has(v));
        if (missing.length || extra.length) {
          offenders.push(
            `${entry.name}.${prop}: documented [${[...documented].join(', ')}] but type allows [${[...expected].join(', ')}]`
          );
        }
      }
    }

    expect(offenders, 'the documented values do not match the declared union').toEqual([]);
  });
});
