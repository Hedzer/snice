import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

/**
 * A documented event payload must list the keys the component actually
 * dispatches.
 *
 * Every `snice-draw` event returns `{ draw: this, ... }`, but four of them were
 * documented as carrying no payload at all and the fifth omitted `draw`. Nothing
 * caught it, because no test compares documented `detail` shapes against the
 * `@dispatch` methods that produce them.
 */

const root = process.cwd();
const srcDir = resolve(root, 'packages/components/src');

/** Top-level keys of an object literal body, tolerating `,`/`;` and `key?:`. */
function keysOf(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let buf = '';

  for (const ch of body) {
    if ('{[('.includes(ch)) depth++;
    else if ('}])'.includes(ch)) depth--;
    if ((ch === ',' || ch === ';') && depth === 0) { parts.push(buf); buf = ''; }
    else buf += ch;
  }
  parts.push(buf);

  const keys: string[] = [];
  for (const raw of parts) {
    const part = raw.trim();
    if (!part || part.startsWith('...')) continue;
    const m = part.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\??\s*:/) ?? part.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\??$/);
    if (m) keys.push(m[1]);
  }
  return [...new Set(keys)].sort();
}

/** event name -> dispatched payload keys, for one component directory. */
function dispatchedPayloads(dir: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const files = readdirSync(dir).filter(
    f => f.startsWith('snice-') && f.endsWith('.ts') && !f.endsWith('.types.ts') && !f.endsWith('.stories.ts')
  );

  for (const file of files) {
    const src = readFileSync(join(dir, file), 'utf8');
    const decl = /@dispatch\(\s*['"]([a-z0-9-]+)['"][^)]*\)\s*\n\s*(?:private\s+)?[a-zA-Z][a-zA-Z0-9]*\s*\([^)]*\)[^{]*\{([\s\S]*?)(?:\n  \}|\}\s*\n)/g;

    for (const m of src.matchAll(decl)) {
      const ret = m[2].match(/return\s*\{([\s\S]*)\}\s*;/);
      if (!ret) continue;
      // A spread merges keys we cannot resolve statically.
      if (ret[1].includes('...')) continue;
      const keys = keysOf(ret[1]);
      if (keys.length) out.set(m[1], keys);
    }
  }

  return out;
}

describe('documented event payloads match dispatch', () => {
  it('every documented detail shape lists the keys the component dispatches', () => {
    const offenders: string[] = [];

    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const payloads = dispatchedPayloads(join(srcDir, entry.name));
      if (payloads.size === 0) continue;

      for (const doc of [`docs/components/${entry.name}.md`, `docs/ai/components/${entry.name}.md`]) {
        const path = resolve(root, doc);
        if (!existsSync(path)) continue;

        for (const line of readFileSync(path, 'utf8').split('\n')) {
          const s = line.trim();

          // A row declaring no payload at all, for an event that carries one.
          const none = s.match(/^\|\s*`([a-z0-9-]+)`\s*\|\s*(?:--|—)\s*\|/);
          if (none) {
            const carried = payloads.get(none[1]);
            if (carried) {
              offenders.push(`${doc} ${none[1]}: documented as no payload but dispatches {${carried.join(', ')}}`);
            }
            continue;
          }

          // Only a real event row: `| \`name\` | \`{...}\` |` or `- \`name\` … \`{...}\``
          const m = s.match(/^\|\s*`([a-z0-9-]+)`\s*\|\s*`?\{([^}]*)\}/)
                 ?? s.match(/^-\s*`([a-z0-9-]+)`[^`]*`?\{([^}]*)\}/);
          if (!m) continue;

          const expected = payloads.get(m[1]);
          if (!expected) continue;
          const documented = keysOf(m[2]);
          if (documented.length === 0) continue;

          const missing = expected.filter(k => !documented.includes(k));
          const extra = documented.filter(k => !expected.includes(k));
          if (missing.length || extra.length) {
            offenders.push(
              `${doc} ${m[1]}: documented {${documented.join(', ')}} but dispatches {${expected.join(', ')}}`
            );
          }
        }
      }
    }

    expect([...new Set(offenders)], 'the detail shape in the docs does not match what is dispatched').toEqual([]);
  });
});
