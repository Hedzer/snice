import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Publish Validation', () => {
  let tempDir: string;
  let packagedFiles: string[];

  beforeAll(() => {
    // Create temporary directory
    tempDir = mkdtempSync(join(tmpdir(), 'snice-publish-test-'));

    try {
      // Simulate npm pack to see what would be published
      const packResult = execSync('npm pack --dry-run --json', {
        encoding: 'utf8',
        cwd: process.cwd()
      });

      const packData = JSON.parse(packResult);
      packagedFiles = packData[0].files.map((f: any) => f.path);
    } catch (error) {
      console.warn('Could not run npm pack dry-run, falling back to files list check');
      packagedFiles = [];
    }

    return () => {
      // Cleanup
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    };
  });

  it('should include all required entry point files in published package', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

    const requiredFiles = [
      packageJson.main,
      packageJson.module,
      packageJson.types,
      packageJson.bin?.snice
    ].filter(Boolean);

    if (packagedFiles.length > 0) {
      // If we have npm pack results, use those
      // npm pack removes leading "./" from paths
      requiredFiles.forEach(file => {
        const normalizedFile = file.startsWith('./') ? file.slice(2) : file;
        expect(packagedFiles).toContain(normalizedFile);
      });
    } else {
      // Fallback: check files exist locally
      requiredFiles.forEach(file => {
        expect(existsSync(file)).toBe(true);
      });
    }
  });

  it('should test published package structure matches package.json files array', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const declaredFiles = packageJson.files || [];

    // Verify all non-negated files in "files" array exist
    declaredFiles
      .filter((file: string) => !file.startsWith('!'))
      .forEach((file: string) => {
        if (!file.includes('*')) {
          expect(existsSync(file)).toBe(true);
        }
      });
  });

  it('should be able to simulate package installation and import', async () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

    // Test importing from the declared main entry point
    const mainPath = join(process.cwd(), packageJson.main);
    expect(existsSync(mainPath)).toBe(true);

    try {
      const module = await import(mainPath);

      // Test that key exports are available (as they would be for consumers)
      expect(module.element).toBeDefined();
      expect(module.Router).toBeDefined();
      expect(module.controller).toBeDefined();
      expect(module.on).toBeDefined();
      expect(module.dispatch).toBeDefined();
      expect(module.observe).toBeDefined();

    } catch (error) {
      throw new Error(`Failed to import main entry point: ${error}`);
    }
  });

  it('should validate components directory structure for published package', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

    if (packageJson.files?.includes('components')) {
      expect(existsSync('components')).toBe(true);

      // Check if component files can be imported as consumers would
      // Test a few key components that are likely to be used
      const componentsToTest = [
        'components/login/snice-login.js',
        'components/login/snice-login.d.ts'
      ];

      componentsToTest.forEach(componentPath => {
        if (existsSync(componentPath)) {
          // Just verify the file exists and is readable
          expect(() => readFileSync(componentPath, 'utf8')).not.toThrow();
        }
      });
    }
  });

  it('should validate prepublishOnly would catch missing files', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

    // Simulate what would happen in prepublishOnly
    const requiredPaths = [
      packageJson.main,
      packageJson.types,
    ];

    requiredPaths.forEach(path => {
      if (path) {
        expect(existsSync(path)).toBe(true);
      }
    });
  });
});