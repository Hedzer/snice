import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const publicDir = join(root, 'public');
const standaloneDir = join(root, 'dist/standalone');

describe('Website Build', () => {
  beforeAll(() => {
    execSync('npm run website:build', { cwd: root, stdio: 'pipe' });
  });

  it('should create public directory', () => {
    expect(existsSync(publicDir)).toBe(true);
  });

  it('should create all pages', () => {
    expect(existsSync(join(publicDir, 'index.html'))).toBe(true);
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
    let standaloneComponents: string[];
    let copiedComponents: string[];
    let componentsHtml: string;

    beforeAll(() => {
      standaloneComponents = readdirSync(standaloneDir).sort();
      copiedComponents = readdirSync(join(publicDir, 'components'))
        .map(f => f.replace('snice-', '').replace('.min.js', ''))
        .sort();
      componentsHtml = readFileSync(join(publicDir, 'components.html'), 'utf-8');
    });

    it('should copy all standalone components', () => {
      const missing = standaloneComponents.filter(c => !copiedComponents.includes(c));
      expect(missing).toEqual([]);
    });

    it('should list all components in the component list', () => {
      const missingFromList: string[] = [];
      for (const comp of standaloneComponents) {
        if (!componentsHtml.includes(`snice-${comp}<`)) {
          missingFromList.push(comp);
        }
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
        '@element', '@page', '@controller', '@property', '@watch',
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

  describe('Styles', () => {
    it('should use theme variables in styles.css', () => {
      const stylesCss = readFileSync(join(publicDir, 'styles.css'), 'utf-8');
      expect(stylesCss).toContain('--snice-color-');
      expect(stylesCss).toContain('--snice-font-family');
    });
  });
});
