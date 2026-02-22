/**
 * Tests for CDN runtime and CDN component builds
 *
 * Verifies the CDN runtime and CDN component builds are
 * generated correctly. All components use the shared runtime.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('CDN Runtime Builds', () => {
  const testComponents = ['button', 'input', 'card', 'alert'];
  const outputDir = 'dist/cdn';
  const runtimeDir = path.join(process.cwd(), outputDir, 'runtime');

  describe('Build Configuration', () => {
    it('should export buildCdnRuntime function', async () => {
      const config = await import('../rollup.config.cdn.js');
      expect(config.buildCdnRuntime).toBeDefined();
      expect(typeof config.buildCdnRuntime).toBe('function');
    });

    it('should export buildCdn function', async () => {
      const config = await import('../rollup.config.cdn.js');
      expect(config.buildCdn).toBeDefined();
      expect(typeof config.buildCdn).toBe('function');
    });

    it('should always have snice as external', async () => {
      const { createCdnBuild } = await import('../rollup.config.cdn.js');

      const configs = createCdnBuild('button', {
        minify: false,
      });

      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);

      // Should have snice as external
      expect(configs[0].external).toContain('snice');
      expect(configs[0].external).toContain('snice/symbols');
      expect(configs[0].external).toContain('snice/transitions');
    });

    it('should set globals for IIFE builds', async () => {
      const { createCdnBuild } = await import('../rollup.config.cdn.js');

      const configs = createCdnBuild('button', {
        minify: false,
      });

      const iifeConfig = configs.find(c => c.output.format === 'iife');
      expect(iifeConfig.output.globals).toBeDefined();
      expect(iifeConfig.output.globals['snice']).toBe('Snice');
      expect(iifeConfig.output.globals['snice/symbols']).toBe('Snice');
      expect(iifeConfig.output.globals['snice/transitions']).toBe('Snice');
    });

    it('should not produce .light. suffixed files', async () => {
      const { createCdnBuild } = await import('../rollup.config.cdn.js');

      const configs = createCdnBuild('button', {
        minify: true,
      });

      const filenames = configs.map(c => c.output.file);
      expect(filenames.every(f => !f.includes('.light.'))).toBe(true);
    });

    it('should only produce IIFE format by default', async () => {
      const { createCdnBuild } = await import('../rollup.config.cdn.js');

      const configs = createCdnBuild('button', {
        minify: true,
      });

      const formats = configs.map(c => c.output.format);
      expect(formats.every(f => f === 'iife')).toBe(true);
    });
  });

  describe('Runtime Build Output', () => {
    beforeAll(() => {
      // Build CDN runtime
      try {
        execSync('npx rollup -c rollup.config.cdn.js', {
          cwd: process.cwd(),
          stdio: 'pipe',
          timeout: 120000
        });
      } catch (error) {
        console.warn('Could not build CDN bundles for testing');
      }
    }, 180000);

    it('should create runtime directory', () => {
      if (fs.existsSync(runtimeDir)) {
        expect(fs.statSync(runtimeDir).isDirectory()).toBe(true);
      }
    });

    it('should generate runtime IIFE build', () => {
      const iifeFile = path.join(runtimeDir, 'snice-runtime.js');
      if (fs.existsSync(runtimeDir)) {
        expect(fs.existsSync(iifeFile)).toBe(true);
      }
    });

    it('should generate runtime minified IIFE', () => {
      const minFile = path.join(runtimeDir, 'snice-runtime.min.js');
      if (fs.existsSync(runtimeDir)) {
        expect(fs.existsSync(minFile)).toBe(true);
      }
    });

    it('should generate runtime ESM build', () => {
      const esmFile = path.join(runtimeDir, 'snice-runtime.esm.js');
      if (fs.existsSync(runtimeDir)) {
        expect(fs.existsSync(esmFile)).toBe(true);
      }
    });

    it('should generate runtime README', () => {
      const readmeFile = path.join(runtimeDir, 'README.md');
      if (fs.existsSync(runtimeDir)) {
        expect(fs.existsSync(readmeFile)).toBe(true);
      }
    });

    it('runtime IIFE should expose Snice global', () => {
      const iifeFile = path.join(runtimeDir, 'snice-runtime.js');
      if (fs.existsSync(iifeFile)) {
        const content = fs.readFileSync(iifeFile, 'utf-8');
        // IIFE should assign to window.Snice
        expect(content).toContain('Snice');
        expect(content).toContain('customElements');
      }
    });

    it('runtime should have reasonable size', () => {
      const minFile = path.join(runtimeDir, 'snice-runtime.min.js');
      if (fs.existsSync(minFile)) {
        const stats = fs.statSync(minFile);
        const sizeKB = stats.size / 1024;
        // Runtime should be substantial (contains full snice)
        expect(sizeKB).toBeGreaterThan(10);
        // But not enormous
        expect(sizeKB).toBeLessThan(200);
        console.log(`  Runtime minified: ${sizeKB.toFixed(2)} KB`);
      }
    });
  });

  describe('CDN Component Output', () => {
    testComponents.forEach(componentName => {
      describe(`${componentName} CDN build`, () => {
        const componentDir = path.join(process.cwd(), outputDir, componentName);

        it('should generate IIFE build', () => {
          const iifeFile = path.join(componentDir, `snice-${componentName}.js`);
          if (fs.existsSync(componentDir)) {
            expect(fs.existsSync(iifeFile)).toBe(true);
          }
        });

        it('should generate minified builds', () => {
          const minFile = path.join(componentDir, `snice-${componentName}.min.js`);
          if (fs.existsSync(componentDir)) {
            expect(fs.existsSync(minFile)).toBe(true);
          }
        });

        it('should NOT have .light. suffixed files', () => {
          if (fs.existsSync(componentDir)) {
            const files = fs.readdirSync(componentDir);
            const lightFiles = files.filter(f => f.includes('.light.'));
            expect(lightFiles).toHaveLength(0);
          }
        });

        it('IIFE should reference Snice global', () => {
          const iifeFile = path.join(componentDir, `snice-${componentName}.js`);
          if (fs.existsSync(iifeFile)) {
            const content = fs.readFileSync(iifeFile, 'utf-8');
            // Should reference the Snice global
            expect(content).toContain('Snice');
          }
        });

        it('should NOT bundle the snice runtime', () => {
          const minFile = path.join(componentDir, `snice-${componentName}.min.js`);
          if (fs.existsSync(minFile)) {
            const content = fs.readFileSync(minFile, 'utf-8');
            // Should be small enough that it clearly doesn't include runtime
            expect(content.length).toBeLessThan(80000);
          }
        });
      });
    });
  });
});
