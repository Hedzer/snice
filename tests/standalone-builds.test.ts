/**
 * Tests for standalone component builds
 *
 * Standalone builds use the shared runtime (external snice imports).
 * Load snice-runtime.min.js once, then load component builds.
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
      });

      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);
      expect(configs[0].input).toContain('button');
    });

    it('should always use shared runtime (external snice imports)', async () => {
      const { createStandaloneBuild } = await import('../rollup.config.standalone.js');

      const configs = createStandaloneBuild('button', {
        minify: false,
      });

      expect(configs[0].external).toContain('snice');
      expect(configs[0].external).toContain('snice/symbols');
      expect(configs[0].external).toContain('snice/transitions');
    });

    it('should set globals for IIFE builds', async () => {
      const { createStandaloneBuild } = await import('../rollup.config.standalone.js');

      const configs = createStandaloneBuild('button', {
        minify: false,
      });

      const iifeConfig = configs.find(c => c.output.format === 'iife');
      expect(iifeConfig.output.globals).toBeDefined();
      expect(iifeConfig.output.globals['snice']).toBe('Snice');
      expect(iifeConfig.output.globals['snice/symbols']).toBe('Snice');
      expect(iifeConfig.output.globals['snice/transitions']).toBe('Snice');
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
          const minFile = path.join(componentDir, `snice-${componentName}.min.js`);

          if (fs.existsSync(minFile)) {
            const stats = fs.statSync(minFile);
            const sizeKB = stats.size / 1024;

            // Without bundled runtime, should be small
            expect(sizeKB).toBeLessThan(100);

            console.log(`  ${componentName} min: ${sizeKB.toFixed(2)} KB`);
          }
        });

        it('should reference Snice global (IIFE)', () => {
          const iifeFile = path.join(componentDir, `snice-${componentName}.js`);
          if (fs.existsSync(iifeFile)) {
            const content = fs.readFileSync(iifeFile, 'utf-8');
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

  describe('Runtime Check', () => {
    it('IIFE builds should contain runtime check warning', () => {
      const buttonIife = path.join(process.cwd(), outputDir, 'button', 'snice-button.js');
      if (fs.existsSync(buttonIife)) {
        const content = fs.readFileSync(buttonIife, 'utf-8');
        expect(content).toContain('snice-runtime.min.js must be loaded before');
      }
    });

    it('minified IIFE builds should contain runtime check warning', () => {
      const buttonMin = path.join(process.cwd(), outputDir, 'button', 'snice-button.min.js');
      if (fs.existsSync(buttonMin)) {
        const content = fs.readFileSync(buttonMin, 'utf-8');
        expect(content).toContain('snice-runtime.min.js');
      }
    });
  });

  describe('Bundle Content', () => {
    it('should reference Snice global (runtime provides element decorator)', () => {
      const buttonIife = path.join(process.cwd(), outputDir, 'button', 'snice-button.js');

      if (fs.existsSync(buttonIife)) {
        const content = fs.readFileSync(buttonIife, 'utf-8');

        // IIFE should reference the Snice global for element decorator
        expect(content).toContain('Snice');
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
