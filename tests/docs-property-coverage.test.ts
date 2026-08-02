import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Every public property must appear in both doc trees.
 *
 * `login.alertMessage` and `login.alertVariant` are commented "Public: consumers
 * drive the inline alert" in the source and were documented nowhere;
 * `notification-center.placement` likewise. Nothing caught it, because no test
 * enumerated the `@property` declarations and looked for them in the docs.
 *
 * Matching is deliberately loose -- the property name in either camelCase or
 * kebab-case, anywhere in the file -- so that a doc is free to describe a
 * property in prose, a code block, or a table. The failure this guards against
 * is a property documented *nowhere*, which no phrasing choice can explain away.
 */

const root = process.cwd();
const srcDir = resolve(root, 'packages/components/src');

function kebab(name: string): string {
  return name.replace(/([A-Z])/g, m => `-${m.toLowerCase()}`);
}

/**
 * Public properties declared on the component's own element file. `private` and
 * `protected` reactive state (e.g. avatar's `imageError`) is internal and is
 * deliberately absent from the docs.
 */
function publicProps(dir: string, name: string): string[] {
  const main = join(dir, `snice-${name}.ts`);
  if (!existsSync(main)) return [];
  const src = readFileSync(main, 'utf8');

  const decl = /@property\(([^)]*)\)\s*(?:\n\s*)?(private\s+|protected\s+)?(?:accessor\s+)?([a-zA-Z][a-zA-Z0-9]*)/g;
  return [...new Set([...src.matchAll(decl)].filter(m => !m[2]).map(m => m[3]))];
}

describe('every public property is documented', () => {
  it('no @property is missing from the human or AI doc', () => {
    const offenders: string[] = [];

    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const props = publicProps(join(srcDir, entry.name), entry.name);
      if (props.length === 0) continue;

      for (const doc of [`docs/components/${entry.name}.md`, `docs/ai/components/${entry.name}.md`]) {
        const path = resolve(root, doc);
        if (!existsSync(path)) continue;
        const text = readFileSync(path, 'utf8').toLowerCase();

        for (const prop of props) {
          if (text.includes(prop.toLowerCase())) continue;
          if (text.includes(kebab(prop).toLowerCase())) continue;
          offenders.push(`${doc}: \`${prop}\` is declared @property but appears nowhere`);
        }
      }
    }

    expect(offenders, 'document the property in both trees').toEqual([]);
  });
});
