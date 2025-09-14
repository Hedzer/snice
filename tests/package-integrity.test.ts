import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Package Integrity', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

  it('should have main entry point that exists', () => {
    const mainFile = packageJson.main;
    expect(mainFile).toBeDefined();
    expect(existsSync(mainFile)).toBe(true);
  });

  it('should have module entry point that exists', () => {
    const moduleFile = packageJson.module;
    expect(moduleFile).toBeDefined();
    expect(existsSync(moduleFile)).toBe(true);
  });

  it('should have types entry point that exists', () => {
    const typesFile = packageJson.types;
    expect(typesFile).toBeDefined();
    expect(existsSync(typesFile)).toBe(true);
  });

  it('should have binary that exists', () => {
    const binFile = packageJson.bin?.snice;
    expect(binFile).toBeDefined();
    expect(existsSync(binFile)).toBe(true);
  });

  it('should have all files listed in "files" array exist', () => {
    const files = packageJson.files || [];

    files.forEach((filePattern: string) => {
      // Skip negated patterns (starting with !)
      if (filePattern.startsWith('!')) return;

      // For simple directory/file patterns, check existence
      if (!filePattern.includes('*')) {
        expect(existsSync(filePattern)).toBe(true);
      }
    });
  });

  it('should be able to import main exports', async () => {
    const mainFile = packageJson.main;

    // Test that the main file can be imported without error
    const module = await import(join(process.cwd(), mainFile));

    // Verify key exports exist
    expect(module.element).toBeDefined();
    expect(module.Router).toBeDefined();
    expect(module.controller).toBeDefined();
    expect(module.on).toBeDefined();
    expect(module.dispatch).toBeDefined();
  });

  it('should have consistent entry points (main, module, types should point to same base)', () => {
    const main = packageJson.main;
    const module = packageJson.module;
    const types = packageJson.types;

    // Extract base paths (without extensions)
    const mainBase = main?.replace(/\.(js|mjs)$/, '');
    const moduleBase = module?.replace(/\.(js|mjs)$/, '');
    const typesBase = types?.replace(/\.d\.ts$/, '');

    expect(mainBase).toBe(moduleBase);
    expect(mainBase).toBe(typesBase);
  });
});