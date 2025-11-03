import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, rm, readFile } from 'fs/promises';
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
    
    // Verify package.json has correct name
    const packageJson = JSON.parse(
      await readFile(join(appPath, 'package.json'), 'utf-8')
    );
    expect(packageJson.name).toBe(appName);
    
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
    await execAsync('npm install', { 
      cwd: appPath,
      timeout: 60000 // 60 second timeout for npm install
    });
    
    // Link local snice package for testing
    await execAsync(`npm link ${process.cwd()}`, {
      cwd: appPath
    });
    
    // Build the app
    console.log('Building app...');
    const { stderr } = await execAsync('npm run build', { 
      cwd: appPath,
      timeout: 30000 // 30 second timeout for build
    });
    
    // Check that build succeeded (vite may output to stderr even on success)
    expect(existsSync(join(appPath, 'dist'))).toBe(true);
    expect(existsSync(join(appPath, 'dist/index.html'))).toBe(true);
    
    // Verify the build output contains the compiled JS
    const distFiles = await execAsync('ls -la dist/assets/', { cwd: appPath });
    expect(distFiles.stdout).toContain('.js');
  }, 120000); // 2 minute timeout for the full build test
  
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

  it('should include CLAUDE.md in base template', async () => {
    const appName = 'test-claude-base';
    const appPath = join(tempDir, appName);

    await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName}`,
      { cwd: tempDir }
    );

    // Verify CLAUDE.md exists
    expect(existsSync(join(appPath, 'CLAUDE.md'))).toBe(true);

    // Verify it has content
    const claudeMd = await readFile(join(appPath, 'CLAUDE.md'), 'utf-8');
    expect(claudeMd).toContain('Snice Project - AI Assistant Guide');
    expect(claudeMd).toContain('node_modules/snice/docs/ai/');
    expect(claudeMd).toContain('Decorators');
  }, 30000);

  it('should include CLAUDE.md in pwa template', async () => {
    const appName = 'test-claude-pwa';
    const appPath = join(tempDir, appName);

    await execAsync(
      `node ${join(process.cwd(), 'bin/snice.js')} create-app ${appName} --template=pwa`,
      { cwd: tempDir }
    );

    // Verify CLAUDE.md exists
    expect(existsSync(join(appPath, 'CLAUDE.md'))).toBe(true);

    // Verify it has content
    const claudeMd = await readFile(join(appPath, 'CLAUDE.md'), 'utf-8');
    expect(claudeMd).toContain('Snice Project - AI Assistant Guide');
    expect(claudeMd).toContain('node_modules/snice/docs/ai/');
    expect(claudeMd).toContain('Decorators');
  }, 30000);
});