// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const manifest = JSON.parse(read('website/guide/manifest.json'));
const builder = read('tooling/website/build-website.js');
const guideHtml = read('website/public/guide.html');

const sections = manifest.groups.flatMap((group: any) =>
  group.sections.map((section: any) => ({ ...section, group: group.title }))
);

/** Doc ids published on docs.html, parsed from the builder's docsManifest. */
const publishedDocs = new Map<string, string>(
  Array.from(
    builder.matchAll(/\{\s*id:\s*'([\w-]+)',\s*file:\s*'([\w.-]+)',\s*title:\s*'[^']*'\s*\}/g)
  ).map(match => [match[1], match[2]])
);

describe('Guide is generated, not hand-edited', () => {
  it('carries the generated-file marker naming its source', () => {
    expect(guideHtml.startsWith('<!-- GENERATED FILE')).toBe(true);
    expect(guideHtml.split('\n')[0]).toContain('tooling/website/build-website.js');
  });

  it('is written by the website builder', () => {
    expect(builder).toContain("writeFileSync(join(out, 'guide.html'), guideHtml)");
  });

  it('names the fragment directory as the content source', () => {
    expect(builder).toContain("join(root, 'website', 'guide')");
  });
});

describe('Guide manifest integrity', () => {
  it('has at least one group and no empty groups', () => {
    expect(manifest.groups.length).toBeGreaterThan(0);
    for (const group of manifest.groups) {
      expect(group.sections.length, `group ${group.title}`).toBeGreaterThan(0);
    }
  });

  it('every section has a fragment file on disk', () => {
    for (const section of sections) {
      expect(
        existsSync(join(root, 'website/guide', `${section.id}.html`)),
        `missing fragment website/guide/${section.id}.html`
      ).toBe(true);
    }
  });

  it('section ids are unique', () => {
    const ids = sections.map((s: any) => s.id);
    expect(new Set(ids).size, `duplicate id in ${ids.join(', ')}`).toBe(ids.length);
  });

  it('every section declares a docs anchor explicitly (null allowed, omitted is not)', () => {
    for (const section of sections) {
      expect(
        Object.prototype.hasOwnProperty.call(section, 'docs'),
        `section "${section.id}" is missing a docs key`
      ).toBe(true);
    }
  });
});

describe('Guide sections resolve to real documentation', () => {
  it('every non-null docs anchor is a published docs page', () => {
    for (const section of sections) {
      if (section.docs === null) continue;
      expect(
        publishedDocs.has(section.docs),
        `section "${section.id}" links to docs.html#${section.docs}, which is not in docsManifest`
      ).toBe(true);
    }
  });

  it('every published docs page has a source file in docs/', () => {
    expect(publishedDocs.size).toBeGreaterThan(0);
    for (const [id, file] of publishedDocs) {
      expect(existsSync(join(root, 'docs', file)), `docs/${file} (id ${id}) does not exist`).toBe(true);
    }
  });

  it('renders a documentation link for every section that declares one', () => {
    for (const section of sections) {
      if (section.docs === null) continue;
      expect(
        guideHtml.includes(`href="docs.html#${section.docs}"`),
        `guide.html has no link to docs.html#${section.docs} for section "${section.id}"`
      ).toBe(true);
    }
  });
});

describe('Guide covers the framework surface', () => {
  // These are the subsystems a reader cannot ship without. Before this suite
  // existed the guide silently omitted routing, request/respond, and observers.
  const requiredSections = [
    'controllers', 'request-respond', 'observe',
    'pages', 'guards',
    'bindings', 'events', 'ai',
  ];

  it.each(requiredSections)('includes a "%s" section', (id) => {
    expect(sections.some((s: any) => s.id === id)).toBe(true);
  });

  it('renders every manifest section into the page', () => {
    for (const section of sections) {
      expect(
        guideHtml.includes(`id="${section.id}"`),
        `section "${section.id}" is in the manifest but not in guide.html`
      ).toBe(true);
    }
  });

  it('renders a sidebar entry for every section', () => {
    for (const section of sections) {
      expect(
        guideHtml.includes(`href="#${section.id}"`),
        `section "${section.id}" has no sidebar link`
      ).toBe(true);
    }
  });
});

describe('Guide examples dogfood the framework', () => {
  // Imperative in Snice means YOU drive the DOM updates — via @query/@watch —
  // not that you drop into native JS. Event wiring, observers, lifecycle and
  // dispatch stay on decorators in both modes. See .ai/coding-standards.md.
  const banned: Array<[string, RegExp, string]> = [
    ['addEventListener', /\baddEventListener\s*\(/, 'use @on'],
    ['removeEventListener', /\bremoveEventListener\s*\(/, '@on cleans up automatically'],
    ['shadowRoot.querySelector', /shadowRoot\s*\.\s*querySelectorAll?\s*\(/, 'use @query / @queryAll'],
    ['new MutationObserver', /new\s+MutationObserver\s*\(/, 'use @observe'],
    ['new IntersectionObserver', /new\s+IntersectionObserver\s*\(/, "use @observe('intersection')"],
    ['new ResizeObserver', /new\s+ResizeObserver\s*\(/, "use @observe('resize')"],
    ['dispatchEvent(new CustomEvent', /dispatchEvent\s*\(\s*new\s+CustomEvent/, 'use @dispatch'],
    ['document.createElement', /document\s*\.\s*createElement\s*\(/, 'render through a template'],
  ];

  /** Code inside <snice-code-block>, which is what readers copy. */
  const codeOf = (html: string) =>
    Array.from(html.matchAll(/<snice-code-block[^>]*>([\s\S]*?)<\/snice-code-block>/g))
      .map(match => match[1])
      .join('\n');

  const guideCode = codeOf(guideHtml);

  it.each(banned)('never demonstrates %s in a code block', (name, pattern, remedy) => {
    expect(pattern.test(guideCode), `guide code uses ${name} — ${remedy}`).toBe(false);
  });

  it('writes every imperative panel with @render({ once: true })', () => {
    const panels = Array.from(
      guideHtml.matchAll(/<snice-code-block[^>]*data-panel="imperative"[^>]*>([\s\S]*?)<\/snice-code-block>/g)
    ).map(match => match[1]);

    expect(panels.length, 'no imperative panels found').toBeGreaterThan(0);
    for (const panel of panels) {
      expect(panel, 'imperative panel without @render({ once: true })').toMatch(/@render\(\{\s*once:\s*true\s*\}\)/);
    }
  });

  it('pairs every imperative panel with a declarative one', () => {
    const declarative = (guideHtml.match(/data-panel="declarative"/g) ?? []).length;
    const imperative = (guideHtml.match(/data-panel="imperative"/g) ?? []).length;
    expect(imperative).toBe(declarative);
  });
});

describe('Guide code tabs', () => {
  const tabGroups = guideHtml.match(/<div class="code-tabgroup">/g) ?? [];

  it('scopes the switcher per group rather than page-wide', () => {
    // The home page toggles every .code-tab on the page; the guide has many
    // groups, so its script must query within each group.
    expect(builder).toContain("document.querySelectorAll('.code-tabgroup')");
    expect(builder).toContain("group.querySelectorAll('.code-tab')");
  });

  it('gives every tab group exactly one active tab and one active panel', () => {
    for (const block of guideHtml.split('<div class="code-tabgroup">').slice(1)) {
      const group = block.split('</div>')[0] + block.split('</div>').slice(1).join('</div>').split('<div class="dec-section"')[0];
      const activeTabs = (group.match(/class="code-tab active"/g) ?? []).length;
      const activePanels = (group.match(/class="code-panel active"/g) ?? []).length;
      if (tabGroups.length === 0) continue;
      expect(activeTabs).toBeGreaterThanOrEqual(1);
      expect(activePanels).toBeGreaterThanOrEqual(1);
    }
  });
});
