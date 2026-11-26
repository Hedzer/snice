// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, rm, readFile, readdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

describe('CLI create-app command', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    // Create a temporary directory for the test
    tempDir = await mkdtemp(join(tmpdir(), 'snice-test-'));
  });
  
  afterEach(async () => {
    // Clean up the temporary directory
    if (tempDir && existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
  
  it('should create a new app with the binary', async () => {
    const appName = 'test-app';
    const appPath = join(tempDir, appName);
    
    // Run the create-app command
    const { stdout, stderr } = await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName}`,
      { cwd: tempDir }
    );
    
    // Check that the command succeeded
    expect(stderr).toBe('');
    expect(stdout).toContain('Creating Snice app');
    
    // Verify the project structure was created
    expect(existsSync(appPath)).toBe(true);
    expect(existsSync(join(appPath, 'package.json'))).toBe(true);
    expect(existsSync(join(appPath, 'tsconfig.json'))).toBe(true);
    expect(existsSync(join(appPath, 'vite.config.ts'))).toBe(true);
    expect(existsSync(join(appPath, 'index.html'))).toBe(true);
    expect(existsSync(join(appPath, 'src'))).toBe(true);
    expect(existsSync(join(appPath, 'src/main.ts'))).toBe(true);
    
    // Verify package.json has correct name and uses snice/vite instead of unplugin-swc
    const packageJson = JSON.parse(
      await readFile(join(appPath, 'package.json'), 'utf-8')
    );
    expect(packageJson.name).toBe(appName);
    expect(packageJson.devDependencies).not.toHaveProperty('unplugin-swc');
    expect(packageJson.devDependencies).toHaveProperty('terser');

    const viteCfg = await readFile(join(appPath, 'vite.config.ts'), 'utf-8');
    const vitestCfg = await readFile(join(appPath, 'vitest.config.ts'), 'utf-8');
    expect(viteCfg).toContain("import snice from 'snice/vite'");
    expect(viteCfg).toContain('snice()');
    expect(viteCfg).toContain('VitePWA(');
    expect(viteCfg).toContain("minify: 'terser'");
    expect(viteCfg).toContain('sourcemap: true');
    expect(viteCfg).not.toContain('unplugin-swc');
    expect(viteCfg).not.toContain("target: 'es2015'");
    expect(viteCfg).not.toContain('manualChunks');
    expect(vitestCfg).toContain("import snice from 'snice/vite'");
    expect(vitestCfg).toContain('snice()');
    expect(vitestCfg).not.toContain('unplugin-swc');
    
    // Verify main.ts doesn't have template placeholders
    const mainTs = await readFile(join(appPath, 'src/main.ts'), 'utf-8');
    expect(mainTs).not.toContain('{{');
    expect(mainTs).not.toContain('}}');
  }, 30000); // 30 second timeout for creating project
  
  it('should build the created app successfully', async () => {
    const appName = 'build-test-app';
    const appPath = join(tempDir, appName);
    
    // Create the app
    await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName}`,
      { cwd: tempDir }
    );
    
    // Install dependencies
    console.log('Installing dependencies...');
    await execAsync(`npm install --no-save --package-lock=false ${process.cwd()}`, {
      cwd: appPath,
      // Source and built mirrors intentionally exercise this customer install
      // together in the release gate. Local npm packing can exceed one minute
      // while every artifact and browser matrix is under load.
      timeout: 120000
    });
    
    await execAsync('npm run type-check', {
      cwd: appPath,
      timeout: 30000
    });

    await execAsync('npm test', {
      cwd: appPath,
      timeout: 60000
    });

    const validation = await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} check . --json`,
      { cwd: appPath, timeout: 30000 }
    );
    const validationResult = JSON.parse(validation.stdout);
    expect(validationResult.ok).toBe(true);
    expect(validationResult.issues).toEqual([]);

    // Build the app
    console.log('Building app...');
    await execAsync('npm run build', { 
      cwd: appPath,
      timeout: 30000 // 30 second timeout for build
    });
    
    // Check that build succeeded (vite may output to stderr even on success)
    expect(existsSync(join(appPath, 'dist'))).toBe(true);
    expect(existsSync(join(appPath, 'dist/index.html'))).toBe(true);
    
    // Verify volatility-tiered caching chunks and zero SWC inline decorator helpers
    const assetsDir = join(appPath, 'dist/assets');
    const assetFiles = await readdir(assetsDir);
    const jsAssets = assetFiles.filter((f) => f.endsWith('.js'));
    expect(jsAssets.some((f) => f.startsWith('snice-runtime-'))).toBe(true);
    for (const file of jsAssets) {
      const text = await readFile(join(assetsDir, file), 'utf-8');
      expect(text).not.toContain('applyDecs2203RFactory');
    }
  }, 240000);
  
  it('should reject invalid app names', async () => {
    // Test with invalid characters
    try {
      await execAsync(
        `node ${join(process.cwd(), 'bin/snice.js')} create-app "invalid name"`,
        { cwd: tempDir }
      );
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.stderr || error.message).toBeTruthy();
    }
    
    // Test with no name
    try {
      await execAsync(
        `node ${join(process.cwd(), 'bin/snice.js')} create-app`,
        { cwd: tempDir }
      );
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.stderr || error.message).toBeTruthy();
    }
  });
  
  it('should not overwrite existing directory', async () => {
    const appName = 'existing-app';
    const appPath = join(tempDir, appName);

    // Create the app first time
    await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName}`,
      { cwd: tempDir }
    );

    // Try to create again with same name
    try {
      await execAsync(
        `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName}`,
        { cwd: tempDir }
      );
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.stderr || error.message).toContain('not empty');
    }
  });

  it('should include concise agent pointers and the version-matched skill', async () => {
    const appName = 'test-claude-base';
    const appPath = join(tempDir, appName);

    await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName}`,
      { cwd: tempDir }
    );

    expect(existsSync(join(appPath, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(appPath, 'AGENTS.md'))).toBe(true);
    expect(existsSync(join(appPath, '.agents/skills/snice/SKILL.md'))).toBe(true);
    expect(existsSync(join(appPath, '.agents/skills/snice/references/core-kitchen-sink.ts'))).toBe(true);

    const claudeMd = await readFile(join(appPath, 'CLAUDE.md'), 'utf-8');
    const agentsMd = await readFile(join(appPath, 'AGENTS.md'), 'utf-8');
    const skill = await readFile(join(appPath, '.agents/skills/snice/SKILL.md'), 'utf-8');
    expect(claudeMd).toBe(agentsMd);
    expect(claudeMd).toContain('.agents/skills/snice/SKILL.md');
    expect(claudeMd).toContain('node_modules/snice/docs/ai/');
    expect(claudeMd).not.toContain('No `@state()`');
    expect(skill).toContain('references/core-kitchen-sink.ts');
  }, 30000);

  it('should support updating AI files explicitly', async () => {
    const appName = 'test-claude-default';
    const appPath = join(tempDir, appName);

    await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName}`,
      { cwd: tempDir }
    );

    await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} init-ai . --force`,
      { cwd: appPath }
    );

    const claudeMd = await readFile(join(appPath, 'CLAUDE.md'), 'utf-8');
    expect(claudeMd).toContain('Snice Project Agent Guide');
  }, 30000);

  it('should make the canonical check fail when a declared Snice install is missing', async () => {
    const appName = 'unchecked-app';
    const appPath = join(tempDir, appName);

    await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName}`,
      { cwd: tempDir }
    );

    try {
      await execAsync(
        `node ${join(process.cwd(), 'bin/snice.js')} check . --json`,
        { cwd: appPath }
      );
      expect.fail('check should fail before dependencies are installed');
    } catch (error: any) {
      const result = JSON.parse(error.stdout);
      expect(result.ok).toBe(false);
      expect(result.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ code: 'snice-install', severity: 'error' })
      ]));
    }
  }, 30000);

  it('should create a react app from template', async () => {
    const appName = 'test-react-app';
    const appPath = join(tempDir, appName);

    const { stdout, stderr } = await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName} --template=react`,
      { cwd: tempDir }
    );

    expect(stderr).toBe('');
    expect(stdout).toContain('Creating Snice app');

    // Verify the project structure was created
    expect(existsSync(appPath)).toBe(true);
    expect(existsSync(join(appPath, 'package.json'))).toBe(true);
    expect(existsSync(join(appPath, 'tsconfig.json'))).toBe(true);
    expect(existsSync(join(appPath, 'vite.config.ts'))).toBe(true);
    expect(existsSync(join(appPath, 'index.html'))).toBe(true);
    expect(existsSync(join(appPath, 'src'))).toBe(true);
    expect(existsSync(join(appPath, 'src/main.tsx'))).toBe(true);
    expect(existsSync(join(appPath, 'src/App.tsx'))).toBe(true);

    // Verify package.json has correct name and React deps
    const packageJson = JSON.parse(
      await readFile(join(appPath, 'package.json'), 'utf-8')
    );
    expect(packageJson.name).toBe(appName);
    expect(packageJson.dependencies).toHaveProperty('react');
    expect(packageJson.dependencies).toHaveProperty('react-dom');
    expect(packageJson.dependencies).toHaveProperty('snice');

    // Verify vite.config.ts uses snice() alongside react()
    const reactViteCfg = await readFile(join(appPath, 'vite.config.ts'), 'utf-8');
    expect(reactViteCfg).toContain("import snice from 'snice/vite'");
    expect(reactViteCfg).toContain('plugins: [react(), snice()]');
    expect(reactViteCfg).not.toContain("target: 'es2015'");
    expect(reactViteCfg).not.toContain('manualChunks');

    // Verify tsconfig has JSX config
    const tsconfig = JSON.parse(
      await readFile(join(appPath, 'tsconfig.json'), 'utf-8')
    );
    expect(tsconfig.compilerOptions.jsx).toBe('react-jsx');
  }, 30000);

  it('should build the react template app successfully', async () => {
    const appName = 'build-test-react';
    const appPath = join(tempDir, appName);

    await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName} --template=react`,
      { cwd: tempDir }
    );

    // Install dependencies
    await execAsync(`npm install --no-save --package-lock=false ${process.cwd()}`, {
      cwd: appPath,
      timeout: 120000
    });

    await execAsync('npm run type-check', {
      cwd: appPath,
      timeout: 30000
    });

    await execAsync('npm test', {
      cwd: appPath,
      timeout: 60000
    });

    const validation = await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} check . --json`,
      { cwd: appPath, timeout: 30000 }
    );
    expect(JSON.parse(validation.stdout).ok).toBe(true);

    // Build the app
    await execAsync('npm run build', {
      cwd: appPath,
      timeout: 30000
    });

    // Check that build succeeded
    expect(existsSync(join(appPath, 'dist'))).toBe(true);
    expect(existsSync(join(appPath, 'dist/index.html'))).toBe(true);

    // Verify volatility-tiered chunks (vendor-react + snice-runtime) and zero SWC inline helpers
    const assetsDir = join(appPath, 'dist/assets');
    const assetFiles = await readdir(assetsDir);
    const jsAssets = assetFiles.filter((f) => f.endsWith('.js'));
    expect(jsAssets.some((f) => f.startsWith('vendor-react-'))).toBe(true);
    expect(jsAssets.some((f) => f.startsWith('snice-runtime-'))).toBe(true);
    for (const file of jsAssets) {
      const text = await readFile(join(assetsDir, file), 'utf-8');
      expect(text).not.toContain('applyDecs2203RFactory');
    }
  }, 240000);

  it('should include the skill in the react template', async () => {
    const appName = 'test-claude-react';
    const appPath = join(tempDir, appName);

    await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName} --template=react`,
      { cwd: tempDir }
    );

    expect(existsSync(join(appPath, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(appPath, 'AGENTS.md'))).toBe(true);
    expect(existsSync(join(appPath, '.agents/skills/snice/SKILL.md'))).toBe(true);
  }, 30000);

  it('should include react-specific files in react template', async () => {
    const appName = 'test-react-structure';
    const appPath = join(tempDir, appName);

    await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName} --template=react`,
      { cwd: tempDir }
    );

    // Verify React-specific project structure
    expect(existsSync(join(appPath, 'src/components'))).toBe(true);
    expect(existsSync(join(appPath, 'src/pages'))).toBe(true);
    expect(existsSync(join(appPath, 'vitest.config.ts'))).toBe(true);

    // Verify main.tsx doesn't have template placeholders
    const mainTsx = await readFile(join(appPath, 'src/main.tsx'), 'utf-8');
    expect(mainTsx).not.toContain('{{');
    expect(mainTsx).not.toContain('}}');
  }, 30000);
});
