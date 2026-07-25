import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { transform } from 'esbuild';
import * as snice from './test-imports';

/**
 * Every code example in the guide is verified in a context where it is
 * legitimately valid. Examples are deliberately snippets — a section showing
 * one decorator should not have to ship a whole component — so each block is
 * classified and checked accordingly:
 *
 *   shell       npm/npx/claude commands            → not code, skipped
 *   markup      HTML/CDN script tags               → tag balance
 *   jsx         React usage                        → compiled as .tsx
 *   snippet     class members / loose statements   → compiled inside a shell
 *   module      complete component                 → compiled, defined, mounted
 *
 * A guide example that cannot be made to work is a documentation bug.
 * Source: website/guide/*.html
 */

const guideDir = join(process.cwd(), 'website/guide');

const unescapeHtml = (s: string) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&ndash;/g, '-').replace(/&deg;/g, '°')
  .replace(/&euro;/g, '€').replace(/&pound;/g, '£').replace(/&yen;/g, '¥')
  .replace(/&amp;/g, '&');

type Kind = 'shell' | 'markup' | 'jsx' | 'snippet' | 'module';

interface Example {
  file: string;
  index: number;
  panel: string;
  code: string;
  kind: Kind;
}

function classify(code: string): Kind {
  const lines = code.split('\n').filter(l => l.trim());
  if (lines.every(l => /^\s*(#|npm\b|npx\b|claude\b)/.test(l))) return 'shell';
  if (/from '[^']*snice\/react'/.test(code) || /^\s*function App\(/m.test(code)) return 'jsx';
  if (/^\s*</.test(code) && !/@\w+\(/.test(code)) return 'markup';
  if (/@(element|page|layout)\s*\(/.test(code) && /\bclass\s+\w+/.test(code)) return 'module';
  return 'snippet';
}

const examples: Example[] = [];
for (const file of readdirSync(guideDir).filter(f => f.endsWith('.html')).sort()) {
  const html = readFileSync(join(guideDir, file), 'utf8');
  let index = 0;
  for (const match of html.matchAll(/<snice-code-block([^>]*)>([\s\S]*?)<\/snice-code-block>/g)) {
    const code = unescapeHtml(match[2]);
    examples.push({
      file,
      index: index++,
      panel: /data-panel="([^"]+)"/.exec(match[1])?.[1] ?? 'single',
      code,
      kind: classify(code),
    });
  }
}

const label = (e: Example) => `${e.file}#${e.index}${e.panel === 'single' ? '' : ` (${e.panel})`}`;
const byKind = (kind: Kind) => examples.filter(e => e.kind === kind);

const compile = (code: string, loader: 'ts' | 'tsx' = 'ts') => transform(code, {
  loader,
  target: 'es2022',
  tsconfigRaw: { compilerOptions: { experimentalDecorators: false, useDefineForClassFields: false } },
});

/** Strip imports (single- and multi-line) so the harness can inject real exports. */
const stripImports = (code: string) =>
  code.replace(/^\s*import\s+[\s\S]*?from\s*'[^']*';?[ \t]*\n?/gm, '')
      .replace(/^\s*import\s*'[^']*';?[ \t]*\n?/gm, '');

/** Named bindings an example imports, e.g. `import { SniceInput } from '…'`. */
function importedNames(code: string): string[] {
  const names: string[] = [];
  for (const match of code.matchAll(/^\s*import\s+([\s\S]*?)\s+from\s*'[^']*';?/gm)) {
    const clause = match[1];
    const braced = /\{([\s\S]*?)\}/.exec(clause);
    for (const part of (braced ? braced[1] : clause).split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (name && /^[A-Za-z_$][\w$]*$/.test(name)) names.push(name);
    }
  }
  return names;
}

/**
 * Contexts a snippet may legitimately live in. A snippet passes if it compiles
 * in at least one — that is what "this is a valid excerpt" means.
 */
function candidates(code: string): string[] {
  const forms = [
    code,                                                        // module scope
    `class __Shell extends HTMLElement {\n${code}\n}`,           // class members
    `class __Shell extends HTMLElement {\n  __body() {\n${code}\n  }\n}`, // method body
    `function __body() {\n${code}\n}`,                           // statements
  ];

  // Members first, then usage statements (declare state, then assign it).
  // The split point is not guessable by pattern, so every line boundary at
  // brace depth zero is a candidate.
  const lines = code.split('\n');
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    for (const char of lines[i]) {
      if (char === '{') depth++;
      else if (char === '}') depth--;
    }
    if (depth !== 0 || i === lines.length - 1) continue;
    const members = lines.slice(0, i + 1).join('\n');
    const rest = lines.slice(i + 1).join('\n');
    if (!rest.trim()) continue;
    forms.push(`class __Shell extends HTMLElement {\n${members}\n  __body() {\n${rest}\n  }\n}`);
  }

  return forms;
}

async function compilesSomehow(code: string, loader: 'ts' | 'tsx' = 'ts') {
  const errors: string[] = [];
  for (const form of candidates(code)) {
    try {
      await compile(form, loader);
      return { ok: true as const, errors };
    } catch (error: any) {
      const detail = error?.errors?.[0];
      errors.push(detail ? `${detail.text} (${detail.location?.lineText?.trim() ?? ''})` : String(error));
    }
  }
  return { ok: false as const, errors: [...new Set(errors)] };
}

describe('Guide examples', () => {
  it('extracts examples from the guide fragments', () => {
    expect(examples.length).toBeGreaterThan(20);
    expect(new Set(examples.map(e => e.file)).size).toBeGreaterThan(15);
  });

  it('classifies every example into a known kind', () => {
    for (const example of examples) {
      expect(['shell', 'markup', 'jsx', 'snippet', 'module']).toContain(example.kind);
    }
    // The guide must keep teaching with real components, not only fragments.
    expect(byKind('module').length, 'no complete component examples').toBeGreaterThan(5);
  });

  describe('markup examples are well formed', () => {
    const markup = byKind('markup');
    it.each(markup.map(e => [label(e), e] as const))('%s has balanced tags', (_name, example) => {
      const opened = example.code.match(/<([a-z][\w-]*)(?![^>]*\/>)[^>]*>/g) ?? [];
      const closed = example.code.match(/<\/([a-z][\w-]*)>/g) ?? [];
      const voids = new Set(['link', 'meta', 'img', 'br', 'hr', 'input', 'source']);
      const openNames = opened
        .map(t => /^<([a-z][\w-]*)/.exec(t)![1])
        .filter(n => !voids.has(n));
      expect(openNames.length, `${label(example)} tag mismatch`).toBe(closed.length);
    });
  });

  describe('code examples compile', () => {
    const compilable = examples.filter(e => e.kind !== 'shell' && e.kind !== 'markup');

    it.each(compilable.map(e => [label(e), e] as const))('%s compiles', async (_name, example) => {
      const loader = example.kind === 'jsx' ? 'tsx' : 'ts';
      const result = await compilesSomehow(stripImports(example.code), loader);
      expect(
        result.ok,
        `${label(example)} does not compile in any valid context.\n  ${result.errors.join('\n  ')}`
      ).toBe(true);
    });
  });

  describe('component examples define and mount', () => {
    const modules = byKind('module');

    beforeAll(() => { document.body.innerHTML = ''; });

    it.each(modules.map(e => [label(e), e] as const))('%s mounts', async (_name, example) => {
      // Unique tags so repeated names across the guide never collide.
      const suffix = `-ex${modules.indexOf(example)}`;
      const tags: string[] = [];
      const code = stripImports(example.code).replace(
        /@(element|page|layout)\(\s*'([\w-]+)'/g,
        (_m, decorator, tag) => {
          const unique = `${tag}${suffix}`;
          tags.push(unique);
          return `@${decorator}('${unique}'`;
        }
      );

      const { code: js } = await compile(code);
      const names = Object.keys(snice).filter(k => /^[a-zA-Z_$][\w$]*$/.test(k));
      const values: any[] = names.map(k => (snice as any)[k]);

      // Symbols the example imports from elsewhere (a component base class,
      // a sibling controller). Supply a stand-in so the example runs on its
      // own terms instead of being excused from the check.
      // A stand-in base class: an example may extend a shipped component, so
      // the lifecycle hooks it calls through with super.* have to exist.
      class StubBase extends HTMLElement {
        connectedCallback() {}
        disconnectedCallback() {}
        attributeChangedCallback() {}
      }

      // `page` comes from Router(), not the root exports.
      names.push('page');
      values.push(() => (target: any) => target);

      for (const name of importedNames(example.code)) {
        if (names.includes(name)) continue;
        names.push(name);
        values.push(/^[A-Z]/.test(name) ? StubBase : () => {});
      }

      const factory = new Function(...names, `"use strict";\n${js}`);

      expect(() => factory(...values), `${label(example)} threw while defining`).not.toThrow();

      const tag = tags.find(t => customElements.get(t));
      if (!tag) return; // @page/@layout register through the router, not the registry

      const el = document.createElement(tag);
      document.body.appendChild(el);

      // A hang here means the element never finished connecting — report that
      // rather than letting the runner time out with no explanation.
      const ready = await Promise.race([
        Promise.resolve((el as any).ready).then(() => 'ready'),
        new Promise(resolve => setTimeout(() => resolve('timeout'), 2000)),
      ]);
      expect(ready, `${label(example)} never became ready after mounting`).toBe('ready');
      expect((el as any).shadowRoot ?? el, `${label(example)} has no render root`).toBeTruthy();
      el.remove();
    });
  });
});
