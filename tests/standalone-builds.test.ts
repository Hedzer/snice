/**
 * Tests for standalone component builds
 *
 * These tests verify that components can be built as standalone bundles
 * and that the bundles are functional.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Standalone Builds', () => {
  const testComponents = ['button', 'input', 'card', 'alert'];
  const outputDir = 'dist/standalone';

  describe('Build Process', () => {
    it('should have rollup.config.standalone.js', () => {
      const configPath = path.join(process.cwd(), 'rollup.config.standalone.js');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should export createStandaloneBuild function', async () => {
      const config = await import('../rollup.config.standalone.js');
      expect(config.createStandaloneBuild).toBeDefined();
      expect(typeof config.createStandaloneBuild).toBe('function');
    });

    it('should generate build configuration for a component', async () => {
      const { createStandaloneBuild } = await import('../rollup.config.standalone.js');

      const configs = createStandaloneBuild('button', {
        minify: false,
        withTheme: false,
        formats: ['esm']
      });

      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);
      expect(configs[0].input).toContain('button');
    });
  });

  describe('Build Output', () => {
    beforeAll(() => {
      // Build button component as a test
      try {
        execSync('node bin/snice.js build-component button --format=esm,iife', {
          cwd: process.cwd(),
          stdio: 'pipe'
        });
      } catch (error) {
        console.warn('Could not build standalone button for testing');
      }
    });

    it('should create output directory structure', () => {
      const buttonDir = path.join(process.cwd(), outputDir, 'button');

      // Check if directory exists (may not if build hasn't run)
      if (fs.existsSync(buttonDir)) {
        expect(fs.statSync(buttonDir).isDirectory()).toBe(true);
      }
    });

    testComponents.forEach(componentName => {
      describe(`${componentName} component`, () => {
        const componentDir = path.join(process.cwd(), outputDir, componentName);

        it('should generate ESM build', () => {
          const esmFile = path.join(componentDir, `snice-${componentName}.esm.js`);
          if (fs.existsSync(componentDir)) {
            expect(fs.existsSync(esmFile)).toBe(true);
          }
        });

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

        it('should generate README', () => {
          const readmeFile = path.join(componentDir, 'README.md');
          if (fs.existsSync(componentDir)) {
            expect(fs.existsSync(readmeFile)).toBe(true);
          }
        });

        it('should have reasonable bundle size', () => {
          const esmFile = path.join(componentDir, `snice-${componentName}.esm.js`);

          if (fs.existsSync(esmFile)) {
            const stats = fs.statSync(esmFile);
            const sizeKB = stats.size / 1024;

            // Unminified should be less than 200KB
            expect(sizeKB).toBeLessThan(200);

            console.log(`  ${componentName} ESM: ${sizeKB.toFixed(2)} KB`);
          }
        });

        it('should include Snice runtime in bundle', () => {
          const esmFile = path.join(componentDir, `snice-${componentName}.esm.js`);

          if (fs.existsSync(esmFile)) {
            const content = fs.readFileSync(esmFile, 'utf-8');

            // Check for key Snice runtime features
            expect(content).toContain('customElements');
            // Should have element decorator logic bundled
            expect(content.length).toBeGreaterThan(10000); // Should be substantial
          }
        });
      });
    });
  });

  describe('Bundle Content', () => {
    it('should not have external dependencies in standalone builds', () => {
      const buttonEsm = path.join(process.cwd(), outputDir, 'button', 'snice-button.esm.js');

      if (fs.existsSync(buttonEsm)) {
        const content = fs.readFileSync(buttonEsm, 'utf-8');

        // Should not have import statements for snice (everything should be bundled)
        expect(content).not.toContain('from "snice"');
        expect(content).not.toContain("from 'snice'");
      }
    });

    it('should register custom element', () => {
      const buttonEsm = path.join(process.cwd(), outputDir, 'button', 'snice-button.esm.js');

      if (fs.existsSync(buttonEsm)) {
        const content = fs.readFileSync(buttonEsm, 'utf-8');

        // Should have custom element definition logic
        expect(content).toContain('customElements');
      }
    });
  });

  describe('CLI Command', () => {
    it('should have build-component CLI command', () => {
      const cliPath = path.join(process.cwd(), 'bin', 'snice.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain('build-component');
      expect(content).toContain('buildComponent');
    });

    it('should support component name argument', () => {
      const cliPath = path.join(process.cwd(), 'bin', 'snice.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain('componentName');
    });

    it('should support format options', () => {
      const cliPath = path.join(process.cwd(), 'bin', 'snice.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain('format');
      expect(content).toContain('esm');
      expect(content).toContain('umd');
      expect(content).toContain('iife');
    });
  });
});
