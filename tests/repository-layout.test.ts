import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

describe('repository layout', () => {
  it('keeps canonical sources in their owned top-level areas', () => {
    for (const path of [
      'packages/core/src',
      'packages/components/src',
      'packages/react/src',
      'website/public',
      'website/showcases',
      'examples',
      'tooling/build',
      'tooling/generators',
      'tooling/testing',
      'tooling/website',
    ]) {
      expect(existsSync(resolve(root, path)), path).toBe(true);
    }

    for (const obsolete of ['src', 'components', 'public', 'scripts', 'apps/examples']) {
      expect(existsSync(resolve(root, obsolete)), obsolete).toBe(false);
    }
  });

  it('retains the published compatibility surfaces', () => {
    for (const path of [
      'adapters/react/index.js',
      'adapters/react/index.d.ts',
      'bin/snice.js',
      'bin/mcp-server.js',
      'bin/templates/default',
      'bin/templates/react',
    ]) {
      expect(existsSync(resolve(root, path)), path).toBe(true);
    }
  });

  it('exposes the clear canonical command taxonomy', () => {
    for (const name of [
      'build:distribution',
      'build:testing',
      'build:website',
      'build:website:full',
      'test:source',
      'test:distribution',
      'test:cdn:artifacts',
      'test:cdn:runtime',
      'test:react',
      'test:browser:framework',
      'test:browser:website',
      'release:dry-run',
      'deploy:website',
    ]) {
      expect(scripts[name], name).toBeTypeOf('string');
    }
  });

  it('keeps every former public command as a compatibility alias', () => {
    for (const name of [
      'build:core',
      'build:test',
      'test:src',
      'test:built',
      'test:cdn-runtime',
      'test:react-adapters',
      'test:all',
      'website:build',
      'website:build:full',
      'website:dev',
      'website:deploy',
      'website:test',
      'website:test:render',
      'website:test:render:built',
      'release:dry',
    ]) {
      expect(scripts[name], name).toBeTypeOf('string');
    }
  });

  it('does not leave package scripts pointing at moved Node entry points', () => {
    for (const [name, command] of Object.entries(scripts)) {
      for (const match of command.matchAll(/(?:^|&&\s*)node\s+([^\s]+)/g)) {
        const entry = match[1];
        expect(existsSync(resolve(root, entry)), `${name}: ${entry}`).toBe(true);
      }
    }
  });
});
