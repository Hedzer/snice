import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

/**
 * A property declared `@property({ attribute: false })` has no HTML attribute.
 * Markup that sets one is inert -- it does nothing, silently.
 *
 * Both doc trees have advertised attributes that do not exist (`highlight-lines`
 * on code-block, `disabled-dates` on calendar, `selected-nodes`/`checked-nodes`
 * on tree, `presets` on color-picker, `title` on leaderboard and link-preview),
 * complete with copy-pasteable examples. Nothing caught it, because no test
 * compares documented attributes against the source declarations.
 */

const root = process.cwd();
const srcDir = resolve(root, 'packages/components/src');

/** camelCase -> kebab-case, matching the framework's implicit attribute name. */
function kebab(name: string): string {
  return name.replace(/([A-Z])/g, m => `-${m.toLowerCase()}`);
}

/** Properties declared with `attribute: false`, per component directory. */
function jsOnlyProps(dir: string): string[] {
  const names: string[] = [];
  const files = readdirSync(dir).filter(
    f => f.startsWith('snice-') && f.endsWith('.ts') && !f.endsWith('.types.ts') && !f.endsWith('.stories.ts')
  );

  for (const file of files) {
    const src = readFileSync(join(dir, file), 'utf8');
    // Handles both `@property({...})\n  name` and same-line `@property({...}) name`.
    const decl = /@property\(([^)]*)\)\s*(?:\n\s*)?(?:accessor\s+)?([a-zA-Z][a-zA-Z0-9]*)/g;
    for (const m of src.matchAll(decl)) {
      if (m[1].includes('attribute: false')) names.push(m[2]);
    }
  }

  return [...new Set(names)];
}

describe('documented attributes exist in source', () => {
  const components = readdirSync(srcDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  it('no doc advertises an attribute for a JS-only property', () => {
    const offenders: string[] = [];

    for (const name of components) {
      const jsOnly = jsOnlyProps(join(srcDir, name));
      if (jsOnly.length === 0) continue;

      for (const doc of [`docs/components/${name}.md`, `docs/ai/components/${name}.md`]) {
        const path = resolve(root, doc);
        if (!existsSync(path)) continue;
        const text = readFileSync(path, 'utf8');

        for (const prop of jsOnly) {
          const attr = kebab(prop);
          // "(attr: `foo-bar`)" in the human property table
          if (new RegExp(`\\(attr:\\s*\`${attr}\`\\)`).test(text)) {
            offenders.push(`${doc}: documents attr \`${attr}\` for JS-only \`${prop}\``);
          }
          // "// attribute: foo-bar" trailing an AI-doc property line
          if (new RegExp(`//[^\\n]*\\battr(?:ibute)?:\\s*${attr}\\b`).test(text)) {
            offenders.push(`${doc}: comments attr \`${attr}\` for JS-only \`${prop}\``);
          }
          // an example that sets it as an attribute on a snice-* element
          if (new RegExp(`<snice-[a-z0-9-]*\\s[^>]*(?<![a-z-])${attr}\\s*=`).test(text)) {
            offenders.push(`${doc}: example sets inert attribute \`${attr}\` (\`${prop}\` is JS-only)`);
          }
        }
      }
    }

    expect(offenders, 'set these in JavaScript instead -- the attribute has no effect').toEqual([]);
  });

});
