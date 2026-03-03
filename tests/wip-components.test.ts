/**
 * Tests for the WIP component exclusion mechanism.
 *
 * components/.wip lists component directory names to exclude from all builds:
 * core (rollup.config.js), CDN (rollup.config.cdn.js), React adapters.
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseWipFile } from '../scripts/wip-components.js';

const WIP_FILE = path.resolve(process.cwd(), 'components/.wip');

function writeTmp(content: string): string {
  const tmp = path.join(os.tmpdir(), `wip-test-${Date.now()}.txt`);
  fs.writeFileSync(tmp, content);
  return tmp;
}

const tmpFiles: string[] = [];
afterEach(() => {
  for (const f of tmpFiles) { try { fs.unlinkSync(f); } catch {} }
  tmpFiles.length = 0;
});

function parse(content: string): Set<string> {
  const tmp = writeTmp(content);
  tmpFiles.push(tmp);
  return parseWipFile(tmp);
}

describe('WIP Components', () => {
  describe('parseWipFile()', () => {
    it('should return a Set', () => {
      expect(parse('')).toBeInstanceOf(Set);
    });

    it('should parse component names', () => {
      const result = parse('alpha\nbeta\ngamma\n');
      expect(result.size).toBe(3);
      expect(result.has('alpha')).toBe(true);
      expect(result.has('beta')).toBe(true);
      expect(result.has('gamma')).toBe(true);
    });

    it('should ignore comments and blank lines', () => {
      const result = parse('# comment\n\nalpha\n  \n# another comment\nbeta\n');
      expect(result.size).toBe(2);
      expect(result.has('alpha')).toBe(true);
      expect(result.has('beta')).toBe(true);
    });

    it('should trim whitespace', () => {
      const result = parse('  alpha  \n  beta\n');
      expect(result.has('alpha')).toBe(true);
      expect(result.has('beta')).toBe(true);
    });

    it('should return empty set for comments-only file', () => {
      expect(parse('# just comments\n# nothing else\n').size).toBe(0);
    });

    it('should return empty set for missing file', () => {
      expect(parseWipFile('/tmp/nonexistent-wip-file').size).toBe(0);
    });
  });

  describe('.wip file integrity', () => {
    it('should exist at components/.wip', () => {
      expect(fs.existsSync(WIP_FILE)).toBe(true);
    });

    it('should reference existing component directories', () => {
      const names = parseWipFile(WIP_FILE);
      for (const name of names) {
        const dir = path.join(process.cwd(), 'components', name);
        expect(fs.existsSync(dir), `"${name}" in .wip has no components/${name}/ directory`).toBe(true);
      }
    });
  });

  describe('CDN build exclusion', () => {
    it('should exclude WIP components from CDN discovery', async () => {
      const wipNames = parseWipFile(WIP_FILE);
      if (wipNames.size === 0) return;

      const { default: buildCdn } = await import('../rollup.config.cdn.js');
      const configs = buildCdn();

      for (const name of wipNames) {
        const found = configs.some((c: any) => {
          const input = typeof c.input === 'string' ? c.input : '';
          return input.includes(`/${name}/`);
        });
        expect(found, `WIP component "${name}" should not appear in CDN configs`).toBe(false);
      }
    });
  });

  describe('Core build exclusion', () => {
    it('should exclude WIP components from core build inputs', async () => {
      const wipNames = parseWipFile(WIP_FILE);
      if (wipNames.size === 0) return;

      const { default: configs } = await import('../rollup.config.js');
      const componentConfig = configs[configs.length - 1];
      const inputKeys = Object.keys(componentConfig.input || {});

      for (const name of wipNames) {
        const found = inputKeys.some((k: string) => k.startsWith(`${name}/`));
        expect(found, `WIP component "${name}" should not appear in core build inputs`).toBe(false);
      }
    });
  });
});
