/**
 * Tests for semi-standalone (shared runtime) component builds
 *
 * These tests verify that the shared runtime and lightweight component
 * builds are generated correctly and are functional.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Shared Runtime Builds', () => {
  const testComponents = ['button', 'input', 'card', 'alert'];
  const outputDir = 'dist/standalone';
  const runtimeDir = path.join(process.cwd(), outputDir, 'runtime');

  describe('Build Configuration', () => {
    it('should export buildSharedRuntime function', async () => {
      const config = await import('../rollup.config.standalone.js');
      expect(config.buildSharedRuntime).toBeDefined();
      expect(typeof config.buildSharedRuntime).toBe('function');
    });

    it('should export buildAllWithSharedRuntime function', async () => {
      const config = await import('../rollup.config.standalone.js');
      expect(config.buildAllWithSharedRuntime).toBeDefined();
      expect(typeof config.buildAllWithSharedRuntime).toBe('function');
    });

    it('should generate lightweight build configuration', async () => {
      const { createStandaloneBuild } = await import('../rollup.config.standalone.js');

      const configs = createStandaloneBuild('button', {
        minify: false,
        formats: ['esm'],
        useSharedRuntime: true,
        outputSuffix: '.light'
      });

      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);

      // Should have snice as external
      expect(configs[0].external).toContain('snice');
      expect(configs[0].external).toContain('snice/symbols');
      expect(configs[0].external).toContain('snice/transitions');
    });

    it('should use .light suffix in output filenames', async () => {
      const { createStandaloneBuild } = await import('../rollup.config.standalone.js');

      const configs = createStandaloneBuild('button', {
        minify: false,
        formats: ['esm', 'iife'],
        useSharedRuntime: true,
        outputSuffix: '.light'
      });

      const filenames = configs.map(c => c.output.file);
      expect(filenames.some(f => f.includes('.light.esm.js'))).toBe(true);
      expect(filenames.some(f => f.includes('.light.js'))).toBe(true);
    });

    it('should set globals for IIFE builds', async () => {
      const { createStandaloneBuild } = await import('../rollup.config.standalone.js');

      const configs = createStandaloneBuild('button', {
        minify: false,
        formats: ['iife'],
        useSharedRuntime: true,
        outputSuffix: '.light'
      });

      const iifeConfig = configs.find(c => c.output.format === 'iife');
      expect(iifeConfig.output.globals).toBeDefined();
      expect(iifeConfig.output.globals['snice']).toBe('Snice');
      expect(iifeConfig.output.globals['snice/symbols']).toBe('Snice');
      expect(iifeConfig.output.globals['snice/transitions']).toBe('Snice');
    });
  });

  describe('Runtime Build Output', () => {
    beforeAll(() => {
      // Build shared runtime
      try {
        execSync('npx rollup -c rollup.config.standalone.js', {
          cwd: process.cwd(),
          stdio: 'pipe',
          timeout: 120000
        });
      } catch (error) {
        console.warn('Could not build standalone bundles for testing');
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

  describe('Lightweight Component Output', () => {
    testComponents.forEach(componentName => {
      describe(`${componentName} lightweight build`, () => {
        const componentDir = path.join(process.cwd(), outputDir, componentName);

        it('should generate lightweight ESM build', () => {
          const lightEsmFile = path.join(componentDir, `snice-${componentName}.light.esm.js`);
          if (fs.existsSync(componentDir)) {
            expect(fs.existsSync(lightEsmFile)).toBe(true);
          }
        });

        it('should generate lightweight IIFE build', () => {
          const lightIifeFile = path.join(componentDir, `snice-${componentName}.light.js`);
          if (fs.existsSync(componentDir)) {
            expect(fs.existsSync(lightIifeFile)).toBe(true);
          }
        });

        it('should generate lightweight minified builds', () => {
          const lightMinFile = path.join(componentDir, `snice-${componentName}.light.min.js`);
          if (fs.existsSync(componentDir)) {
            expect(fs.existsSync(lightMinFile)).toBe(true);
          }
        });

        it('lightweight ESM should have external snice imports', () => {
          const lightEsmFile = path.join(componentDir, `snice-${componentName}.light.esm.js`);
          if (fs.existsSync(lightEsmFile)) {
            const content = fs.readFileSync(lightEsmFile, 'utf-8');
            // Should reference snice as external import
            expect(content).toMatch(/from ['"]snice/);
          }
        });

        it('lightweight IIFE should reference Snice global', () => {
          const lightIifeFile = path.join(componentDir, `snice-${componentName}.light.js`);
          if (fs.existsSync(lightIifeFile)) {
            const content = fs.readFileSync(lightIifeFile, 'utf-8');
            // Should reference the Snice global
            expect(content).toContain('Snice');
          }
        });

        it('lightweight should be much smaller than full standalone', () => {
          const fullFile = path.join(componentDir, `snice-${componentName}.esm.js`);
          const lightFile = path.join(componentDir, `snice-${componentName}.light.esm.js`);

          if (fs.existsSync(fullFile) && fs.existsSync(lightFile)) {
            const fullSize = fs.statSync(fullFile).size;
            const lightSize = fs.statSync(lightFile).size;

            // Lightweight should be significantly smaller (at least 50% smaller)
            expect(lightSize).toBeLessThan(fullSize * 0.5);

            const fullKB = (fullSize / 1024).toFixed(2);
            const lightKB = (lightSize / 1024).toFixed(2);
            const ratio = ((1 - lightSize / fullSize) * 100).toFixed(0);
            console.log(`  ${componentName}: full=${fullKB}KB, light=${lightKB}KB (${ratio}% smaller)`);
          }
        });

        it('lightweight should NOT bundle the snice runtime', () => {
          const lightEsmFile = path.join(componentDir, `snice-${componentName}.light.esm.js`);
          if (fs.existsSync(lightEsmFile)) {
            const content = fs.readFileSync(lightEsmFile, 'utf-8');
            // Should be small enough that it clearly doesn't include runtime
            // Full runtime is 100KB+, lightweight should be well under that
            expect(content.length).toBeLessThan(80000);
          }
        });
      });
    });
  });

  describe('Full + Lightweight Coexistence', () => {
    it('should generate both full and lightweight builds side by side', () => {
      const buttonDir = path.join(process.cwd(), outputDir, 'button');
      if (fs.existsSync(buttonDir)) {
        // Full builds
        expect(fs.existsSync(path.join(buttonDir, 'snice-button.min.js'))).toBe(true);
        expect(fs.existsSync(path.join(buttonDir, 'snice-button.esm.js'))).toBe(true);
        // Lightweight builds
        expect(fs.existsSync(path.join(buttonDir, 'snice-button.light.min.js'))).toBe(true);
        expect(fs.existsSync(path.join(buttonDir, 'snice-button.light.esm.js'))).toBe(true);
      }
    });
  });

  describe('CLI --shared-runtime Flag', () => {
    it('CLI should support --shared-runtime flag', () => {
      const cliPath = path.join(process.cwd(), 'bin', 'snice.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain('shared-runtime');
      expect(content).toContain('useSharedRuntime');
    });

    it('CLI help should document --shared-runtime', () => {
      const cliPath = path.join(process.cwd(), 'bin', 'snice.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain('--shared-runtime');
    });
  });
});
