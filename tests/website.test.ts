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
      const sectionIds = ['state', 'roots', 'bindings', 'conditionals', 'lists', 'async', 'ssr'];
      for (const id of sectionIds) expect(guide).toContain(`id="${id}"`);

      const APIs = [
        '@state', 'Proxy', 'Reflect', 'SniceElement', 'bind(', 'ref(', 'use(',
        'repeat(', 'resource(', 'portal(', 'transition(', 'renderToStringAsync(',
        'hydrate('
      ];
      for (const api of APIs) expect(guide).toContain(api);
    });

    it('generates the complete reference and escapes virtual tags as text', () => {
      const docs = readFileSync(join(publicDir, 'docs.html'), 'utf-8');
      expect(docs).toContain('<section class="doc-file" id="rendering">');
      expect(docs).toContain('href="#rendering"');
      expect(docs).toContain('<code>&lt;component&gt;</code>');
      expect(docs).not.toMatch(/<code>\s*<component(?:\s|>)/);
      expect(docs).toContain('renderElementToStringAsync');
      expect(docs).toContain('custom-elements.json');
    });

    it('surfaces the expanded declarative feature set on the homepage', () => {
      const homepage = readFileSync(join(publicDir, 'index.html'), 'utf-8');
      expect(homepage).toContain('@state &amp; directives');
      expect(homepage).toContain('Deep state, bindings, keyed flow, async UI, and portals');
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
