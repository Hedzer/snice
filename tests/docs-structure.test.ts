// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

/**
 * Structural invariants for the documentation set:
 *   - every human page is published and reachable
 *   - every human page has an AI counterpart (the trees map closely)
 *   - cross-links between docs resolve
 *   - no topic is owned by two pages
 *
 * Rendering of these pages is asserted in tests/live/docs-site.spec.ts.
 */

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8');

const humanDocs = readdirSync(join(root, 'docs'))
  .filter(f => f.endsWith('.md') && f !== 'STORYBOOK.md');
const aiDocs = readdirSync(join(root, 'docs/ai')).filter(f => f.endsWith('.md'));
const builder = read('tooling/website/build-website.js');

const manifestEntries = Array.from(
  builder.matchAll(/\{\s*id:\s*'([\w-]+)',\s*file:\s*'([\w.-]+)',\s*title:\s*'([^']*)'\s*\}/g)
).map(m => ({ id: m[1], file: m[2], title: m[3] }));

const groups = Array.from(builder.matchAll(/\{\s*group:\s*'(\w[\w /]*)'/g)).map(m => m[1]);

describe('Docs manifest', () => {
  it('publishes every human doc page', () => {
    const published = new Set(manifestEntries.map(e => e.file));
    // docs/ is the framework reference; every page in it is published.
    // Component pages live in docs/components/ and are served by components.html.
    for (const file of humanDocs) {
      expect(published.has(file), `docs/${file} exists but is not published on docs.html`).toBe(true);
    }
  });

  it('references only files that exist', () => {
    for (const entry of manifestEntries) {
      expect(existsSync(join(root, 'docs', entry.file)), `manifest lists missing docs/${entry.file}`).toBe(true);
    }
  });

  it('has unique ids', () => {
    const ids = manifestEntries.map(e => e.id);
    expect(new Set(ids).size, `duplicate id among ${ids.join(', ')}`).toBe(ids.length);
  });

  it('orders Core so routing comes last and properties follow elements', () => {
    const order = manifestEntries.map(e => e.id);
    const at = (id: string) => order.indexOf(id);
    expect(at('elements')).toBeLessThan(at('properties'));
    expect(at('properties')).toBeLessThan(at('rendering'));
    expect(at('bindings')).toBeLessThan(at('events'));
    expect(at('controllers')).toBeLessThan(at('routing'));
  });

  it('exposes the Styling and Tooling groups', () => {
    expect(groups).toContain('Styling');
    expect(groups).toContain('Tooling');
  });
});

describe('Human and AI trees map to each other', () => {
  it('every human doc has an AI counterpart', () => {
    const missing: string[] = [];
    for (const file of humanDocs) {
      const name = basename(file, '.md');
      const direct = aiDocs.includes(file);
      const nested = existsSync(join(root, 'docs/ai/components', file));
      if (!direct && !nested) missing.push(name);
    }
    expect(missing, `human docs without an AI mirror: ${missing.join(', ')}`).toEqual([]);
  });

  it('every human doc points at an AI file that exists', () => {
    for (const file of humanDocs) {
      const content = read(`docs/${file}`);
      const match = /<!-- AI:.*see\s+(\S+)\s/.exec(content);
      expect(match, `docs/${file} has no AI banner`).toBeTruthy();
      expect(existsSync(join(root, match![1])), `docs/${file} points at missing ${match![1]}`).toBe(true);
    }
  });
});

describe('docs/ holds framework reference only', () => {
  // A single component page published beside the framework docs read as a
  // "Components" category of one, implying coverage that lives elsewhere.
  // theme.md exists in both trees. There is no <snice-theme> element — theme
  // is a CSS-only module — so these are the same subject, split by role:
  // docs/theme.md explains the system, docs/components/theme.md is the
  // exhaustive token table that components.html serves.
  const sameSubjectAsComponent = (file: string) => file !== 'theme.md';

  it('has no per-component page', () => {
    const componentPages = humanDocs
      .filter(sameSubjectAsComponent)
      .filter(f => existsSync(join(root, 'docs/components', f)));
    expect(
      componentPages,
      `these belong in docs/components/: ${componentPages.join(', ')}`
    ).toEqual([]);
  });

  it('does not duplicate the token table across the two theme docs', () => {
    const guide = read('docs/theme.md');
    const reference = read('docs/components/theme.md');

    // The exhaustive list lives in one place, and the guide points at it.
    const countTokens = (doc: string) => (doc.match(/--snice-[\w-]+/g) ?? []).length;
    expect(countTokens(reference), 'the reference should hold the full token list')
      .toBeGreaterThan(countTokens(guide) * 2);
    expect(guide, 'docs/theme.md should defer to the token reference')
      .toContain('components/theme.md');
  });

  it('still documents the code-block component, in docs/components', () => {
    const doc = read('docs/components/code-block.md');
    for (const section of ['Grammar System', 'Highlighter API', 'Token CSS Classes', 'Fetch Mode']) {
      expect(doc, `docs/components/code-block.md lost "${section}"`).toContain(section);
    }
  });
});

describe('The AI index lists what exists', () => {
  // docs/ai/README.md is what an agent reads to decide which page to open.
  // A mirror missing from it is a mirror that never gets read.
  it('names every AI reference page', () => {
    const index = read('docs/ai/README.md');
    const missing = aiDocs
      .filter(f => !['README.md', 'DEVELOPMENT.md', 'STORYBOOK.md'].includes(f))
      .filter(f => !index.includes(`\`${f}\``));
    expect(missing, `docs/ai/README.md does not list: ${missing.join(', ')}`).toEqual([]);
  });

  it('lists no page that does not exist', () => {
    const index = read('docs/ai/README.md');
    const listed = Array.from(index.matchAll(/^- `([\w-]+\.md)`/gm)).map(m => m[1]);
    const phantom = listed.filter(f => !existsSync(join(root, 'docs/ai', f)));
    expect(phantom, `docs/ai/README.md lists missing files: ${phantom.join(', ')}`).toEqual([]);
  });
});

describe('Cross-links resolve', () => {
  it('every relative doc link points at a real file', () => {
    const broken: string[] = [];
    for (const file of humanDocs) {
      const content = read(`docs/${file}`);
      for (const match of content.matchAll(/\]\((\.\/[\w-]+\.md)(#[\w-]+)?\)/g)) {
        const target = match[1].replace('./', '');
        if (!existsSync(join(root, 'docs', target))) broken.push(`docs/${file} → ${match[1]}`);
      }
    }
    expect(broken, `broken links: ${broken.join(', ')}`).toEqual([]);
  });

  it('README links to every published doc page', () => {
    const readme = read('README.md');
    const missing = manifestEntries
      .filter(e => !readme.includes(`./docs/${e.file}`))
      .map(e => e.file);
    expect(missing, `README does not link: ${missing.join(', ')}`).toEqual([]);
  });
});

describe('Tables of contents stay in step with their headings', () => {
  const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const withToc = humanDocs.filter(f => read(`docs/${f}`).includes('## Table of Contents'));

  it('finds the docs that carry one', () => {
    expect(withToc.length).toBeGreaterThan(0);
  });

  it.each(withToc)('%s lists exactly its own H2 headings, in order', (file) => {
    const md = read(`docs/${file}`);
    const block = /## Table of Contents\n((?:- \[[^\]]*\]\([^)]*\)\n)*)/.exec(md);
    expect(block, `${file} has a ToC heading but no entries`).toBeTruthy();

    const listed = Array.from(block![1].matchAll(/\(#([\w-]+)\)/g)).map(m => m[1]);
    const headings = Array.from(md.matchAll(/^## (.+)$/gm))
      .map(m => m[1].trim())
      .filter(h => h !== 'Table of Contents');

    expect(listed, `${file}: table of contents drifted from its headings`).toEqual(headings.map(slugify));
  });
});

describe('Rendered documentation has no dead in-page links', () => {
  // Headings render as `<docId>-<slug>`, so a bare `#slug` from a doc's own
  // table of contents is dead unless the builder scopes it.
  it('every #anchor on docs.html points at an element that exists', () => {
    const html = read('website/public/docs.html');
    const ids = new Set(Array.from(html.matchAll(/id="([\w-]+)"/g)).map(m => m[1]));
    const links = Array.from(html.matchAll(/href="#([\w-]+)"/g)).map(m => m[1]);

    expect(links.length, 'no in-page links found — did the page render?').toBeGreaterThan(50);
    const dead = [...new Set(links.filter(l => !ids.has(l)))];
    expect(dead, `dead anchors: ${dead.join(', ')}`).toEqual([]);
  });
});

describe('One topic, one owner', () => {
  const owns = (file: string, heading: RegExp) => heading.test(read(`docs/${file}`));

  it('elements.md no longer holds the split-out subsystems', () => {
    const elements = read('docs/elements.md');
    expect(elements).not.toMatch(/^## Properties$/m);
    expect(elements).not.toMatch(/^## Queries$/m);
    expect(elements).not.toMatch(/^## Styling$/m);
    expect(elements).not.toMatch(/^## Template Events$/m);
  });

  it('each split-out subsystem has exactly one owning page', () => {
    expect(owns('properties.md', /^## Basic Properties$/m)).toBe(true);
    expect(owns('queries.md', /^## Single Element Query$/m)).toBe(true);
    expect(owns('styling.md', /^## Scoped Styles$/m)).toBe(true);
    expect(owns('lifecycle.md', /^## Lifecycle Decorators$/m)).toBe(true);
  });

  it('render roots are documented once, and rendering.md defers to elements.md', () => {
    expect(read('docs/elements.md')).toMatch(/^## Render Roots and Shadow DOM$/m);
    expect(read('docs/rendering.md')).toMatch(/elements\.md#render-roots/);
  });

  it('elements.md signposts where the moved topics went', () => {
    const elements = read('docs/elements.md');
    for (const target of ['properties.md', 'lifecycle.md', 'queries.md', 'styling.md', 'events.md']) {
      expect(elements, `elements.md does not point at ${target}`).toContain(target);
    }
  });
});

describe('AI mirrors carry the same API surface', () => {
  // The AI tree is denser, not smaller in coverage: whatever a human page
  // owns must be findable in its mirror.
  const surface: Record<string, string[]> = {
    elements: ['@element', 'shadow', 'light', 'extends'],
    properties: ['@property', '@state', 'reflect', 'attribute', 'converter', 'deep'],
    lifecycle: ['@ready', '@dispose', '@watch', 'ready'],
    queries: ['@query', '@queryAll', 'light'],
    styling: ['@styles', 'css', ':host'],
    controllers: ['@controller', 'attach', 'detach', 'attachController'],
    'request-response': ['@request', '@respond', 'yield'],
    observe: ['@observe', 'intersection', 'resize', 'media', 'mutation'],
    routing: ['@page', 'Router', 'guards', 'layout'],
    events: ['@on', '@dispatch', 'keydown'],
    fetcher: ['fetch'],
    placards: ['placard'],
    cli: ['create-app', 'init-ai', 'doctor', 'validate', 'mcp'],
    testing: ['ready', 'rendered'],
    theme: ['data-theme', '--snice-color-primary'],
  };

  for (const [page, tokens] of Object.entries(surface)) {
    it(`docs/ai/${page}.md covers what docs/${page}.md documents`, () => {
      const aiPath = join(root, 'docs/ai', `${page}.md`);
      expect(existsSync(aiPath), `docs/ai/${page}.md is missing`).toBe(true);

      const human = read(`docs/${page}.md`);
      const ai = readFileSync(aiPath, 'utf8');

      for (const token of tokens) {
        if (!human.includes(token)) continue; // human page does not claim it either
        expect(ai, `docs/ai/${page}.md never mentions "${token}"`).toContain(token);
      }
    });
  }

  it('mirrors do not carry the human-only AI banner', () => {
    for (const page of Object.keys(surface)) {
      const aiPath = join(root, 'docs/ai', `${page}.md`);
      if (!existsSync(aiPath)) continue;
      expect(readFileSync(aiPath, 'utf8')).not.toContain('<!-- AI:');
    }
  });
});

describe('Every public export is documented', () => {
  // Framework internals with no user-facing story. Anything not listed here
  // must appear somewhere in docs/ — adding an export means documenting it.
  const internals = new Set([
    'applyElementFunctionality', // internal: applies element behaviour to a class
    'contextProperty',           // deprecated in favour of the @context decorator
    'getSymbol',                 // symbol registry helper
    'IS_CONTROLLER_INSTANCE',    // marker symbol
  ]);

  const exported = (() => {
    const index = read('packages/core/src/index.ts');
    const names = new Set<string>();
    for (const match of index.matchAll(/export \{([^}]+)\} from/g)) {
      for (let name of match[1].split(',')) {
        name = name.trim().replace(/^type\s+/, '').split(' as ').pop()!.trim();
        if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
      }
    }
    return [...names];
  })();

  const allDocs = humanDocs.map(f => read(`docs/${f}`)).join('\n');

  it('finds the public surface', () => {
    expect(exported.length).toBeGreaterThan(40);
  });

  it('documents every export that is not an internal', () => {
    const undocumented = exported.filter(name => !internals.has(name) && !allDocs.includes(name));
    expect(
      undocumented,
      `undocumented public exports: ${undocumented.join(', ')}`
    ).toEqual([]);
  });

  it('keeps the internals list honest', () => {
    // A name listed as internal that no longer exists means the list is stale.
    for (const name of internals) {
      expect(exported, `"${name}" is listed as internal but is not exported`).toContain(name);
    }
  });
});

describe('New pages carry real content', () => {
  it('cli.md documents every shipped command', () => {
    const cli = read('docs/cli.md');
    const help = read('bin/snice.js');
    for (const command of ['create-app', 'init-ai', 'check', 'doctor', 'validate', 'build-component']) {
      expect(help, `bin/snice.js no longer mentions ${command}`).toContain(command);
      expect(cli, `docs/cli.md is missing ${command}`).toContain(command);
    }
  });

  it('documents no command the CLI does not ship', () => {
    const help = read('bin/snice.js');
    const documented = Array.from(read('docs/cli.md').matchAll(/^\| `([a-z][\w-]*)[^`]*` \|/gm))
      .map(m => m[1]);
    expect(documented.length).toBeGreaterThan(3);
    for (const command of documented) {
      expect(help, `docs/cli.md documents "${command}", which the CLI does not implement`).toContain(command);
    }
  });

  it('has no lingering reference to the removed MCP server', () => {
    const surfaces = [
      'bin/snice.js', 'package.json', 'docs/cli.md', 'docs/ai/cli.md',
      'docs/ai/README.md', 'README.md', 'llms.txt', 'llms-full.txt',
      'bin/templates/AI_GUIDANCE.md', 'website/guide/ai.html',
    ];
    for (const file of surfaces) {
      expect(read(file).toLowerCase(), `${file} still references the MCP server`).not.toMatch(/\bmcp\b/);
    }
    expect(existsSync(join(root, 'bin/mcp-server.js')), 'bin/mcp-server.js still exists').toBe(false);
  });

  it('testing.md documents both readiness promises', () => {
    const testing = read('docs/testing.md');
    expect(testing).toContain('el.ready');
    expect(testing).toContain('el.rendered');
  });

  it('theme.md documents dark mode and token overriding', () => {
    const theme = read('docs/theme.md');
    expect(theme).toContain('data-theme');
    expect(theme).toMatch(/--snice-color-primary/);
  });
});
