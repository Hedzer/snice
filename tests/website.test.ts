import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { getWipComponents } from '../scripts/wip-components.js';

const root = process.cwd();
const publicDir = join(root, 'public');
const cdnDir = join(root, 'dist/cdn');
const wip = getWipComponents();

describe('Website Build', () => {
  beforeAll(() => {
    execSync('npm run website:build', { cwd: root, stdio: 'pipe' });
  });

  it('should create public directory', () => {
    expect(existsSync(publicDir)).toBe(true);
  });

  it('should create all pages', () => {
    expect(existsSync(join(publicDir, 'index.html'))).toBe(true);
    expect(existsSync(join(publicDir, 'guide.html'))).toBe(true);
    expect(existsSync(join(publicDir, 'docs.html'))).toBe(true);
    expect(existsSync(join(publicDir, 'decorators.html'))).toBe(true);
    expect(existsSync(join(publicDir, 'components.html'))).toBe(true);
  });

  it('should create styles.css', () => {
    expect(existsSync(join(publicDir, 'styles.css'))).toBe(true);
  });

  it('should copy theme.css', () => {
    expect(existsSync(join(publicDir, 'theme/theme.css'))).toBe(true);
  });

  describe('Component Coverage', () => {
    let cdnComponents: string[];
    let copiedComponents: string[];
    let componentsHtml: string;

    beforeAll(() => {
      cdnComponents = readdirSync(cdnDir).filter(c => c !== 'runtime' && !wip.has(c)).sort();
      copiedComponents = readdirSync(join(publicDir, 'components'))
        .map(f => f.replace('snice-', '').replace('.min.js', ''))
        .sort();
      componentsHtml = readFileSync(join(publicDir, 'components.html'), 'utf-8');
    });

    it('should copy all CDN components', () => {
      const missing = cdnComponents.filter(c => !copiedComponents.includes(c));
      expect(missing).toEqual([]);
    });

    it('should list all components in the component list', () => {
      // Check each CDN component is either used as a tag (`<snice-xxx>`) or
      // referenced in the in-page navigation (`#comp-xxx`). The page groups
      // some related components under a shared heading (e.g. "Chart &
      // Sparkline" shares a nav anchor), so we also accept the component
      // name appearing anywhere in the HTML as a last-resort signal.
      const missingFromList: string[] = [];
      for (const comp of cdnComponents) {
        const used = componentsHtml.includes(`<snice-${comp}`)
          || componentsHtml.includes(`#comp-${comp}`)
          || componentsHtml.includes(`snice-${comp}.min.js`);
        if (!used) missingFromList.push(comp);
      }
      expect(missingFromList).toEqual([]);
    });

    it('should include version from package.json', () => {
      const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));
      const indexHtml = readFileSync(join(publicDir, 'index.html'), 'utf-8');
      expect(indexHtml).toContain(`v${pkg.version}`);
    });
  });

  describe('Decorators Page', () => {
    let decoratorsHtml: string;

    beforeAll(() => {
      decoratorsHtml = readFileSync(join(publicDir, 'decorators.html'), 'utf-8');
    });

    it('should include all decorator documentation', () => {
      const decorators = [
        '@element', '@page', '@controller', '@property', '@state', '@watch',
        '@render', '@styles', '@ready', '@dispose', '@query', '@queryAll',
        '@on', '@dispatch', '@context', '@request', '@respond'
      ];
      for (const dec of decorators) {
        expect(decoratorsHtml).toContain(dec);
      }
    });

    it('should include doc links', () => {
      expect(decoratorsHtml).toContain('gitlab.com/Hedzer/snice/-/blob/main/docs/');
    });
  });

  describe('Declarative Rendering Documentation', () => {
    it('publishes every major rendering capability in the guide', () => {
      const guide = readFileSync(join(publicDir, 'guide.html'), 'utf-8');
      const sectionIds = [
        'state', 'deep-state', 'roots',
        'bindings', 'forms', 'spreads',
        'conditionals', 'lists', 'async',
        'ready', 'dispose'
      ];
      for (const id of sectionIds) expect(guide).toContain(`id="${id}"`);

      const APIs = [
        '@state', 'Proxy', 'Reflect', 'SniceElement',
        '...props', '...attrs', '...events', 'repeat(',
        '@input=${this.updateQuery}', '@ready', '@dispose'
      ];
      for (const api of APIs) expect(guide).toContain(api);
      expect(guide).toContain('href="docs.html#bindings"');
      for (const collapsed of [
        'Bindings &amp; element actions',
        'Async content, portals &amp; motion',
        'Ready &amp; Dispose',
        'Internal &amp; deep state'
      ]) {
        expect(guide).not.toContain(collapsed);
      }
      for (const removed of [
        'renderToString', 'renderElementToString', 'hydrate(', 'HydrationError',
        'SSR &amp; hydration', 'data-snice-hydrate',
        'bind(', 'createRef', 'ref(', '${use(', "import { use } from 'snice'", 'UseResult', 'UseContext', '&lt;component ${',
        'resource(', 'portal(', 'transition(', 'props(object)', 'attrs(object)', 'events(object)',
        'Element refs', 'Element actions', 'Dynamic elements', 'Portals', 'Transitions'
      ]) {
        expect(guide).not.toContain(removed);
      }
    });

    it('generates the complete rendering reference', () => {
      const docs = readFileSync(join(publicDir, 'docs.html'), 'utf-8');
      expect(docs).toContain('<section class="doc-file" id="rendering">');
      expect(docs).toContain('href="#rendering"');
      expect(docs).toContain('id="rendering-form-controls"');
      expect(docs).toContain('<section class="doc-file" id="bindings">');
      expect(docs).toContain('href="#bindings"');
      for (const id of [
        'bindings-channel-chooser',
        'bindings-node-content',
        'bindings-attributes',
        'bindings-properties',
        'bindings-boolean-attributes',
        'bindings-class-and-style',
        'bindings-events',
        'bindings-named-spreads',
        'bindings-keyed-identity',
        'bindings-comment-interpolation',
        'bindings-sentinel-matrix',
        'bindings-form-data-flow',
        'bindings-invalid-placements-and-diagnostics'
      ]) {
        expect(docs).toContain(`id="${id}"`);
      }
      expect(docs).toContain('custom-elements.json');
      for (const removed of [
        'renderToString', 'renderElementToString', 'hydrate(', 'HydrationError',
        'Server rendering and hydration', 'data-snice-hydrate',
        'bind(', 'createRef', 'ref(', '${use(', "import { use } from 'snice'", 'UseResult', 'UseContext', '&lt;component ${',
        'resource(', 'portal(', 'transition(', 'DirectivePart', 'Directive protocol'
      ]) {
        expect(docs).not.toContain(removed);
      }
    });

    it('surfaces the expanded declarative feature set on the homepage', () => {
      const homepage = readFileSync(join(publicDir, 'index.html'), 'utf-8');
      expect(homepage).toContain('@state &amp; templates');
      expect(homepage).toContain('Deep state, explicit bindings, keyed flow, and async values');
    });
  });

  describe('Styles', () => {
    it('should use theme variables in styles.css', () => {
      const stylesCss = readFileSync(join(publicDir, 'styles.css'), 'utf-8');
      expect(stylesCss).toContain('--snice-color-');
      expect(stylesCss).toContain('--snice-font-family');
    });
  });
});
