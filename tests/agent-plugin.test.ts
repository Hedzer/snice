// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * Snice is installable two ways, and both have to keep working:
 *
 *   npx snice init-ai            per project, from npm  → .agents/skills/snice
 *   /plugin install, agy, …      per harness, from repo → skills/snice
 *
 * The plugin manifests are what the repository install reads. The two skill
 * copies serve different consumers but must carry identical content.
 */

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8');
const json = (p: string) => JSON.parse(read(p));
const pkg = json('package.json');

describe('Plugin manifests exist and are well formed', () => {
  const manifests = [
    '.claude-plugin/plugin.json',
    '.claude-plugin/marketplace.json',
    '.agents/plugins/marketplace.json',
    'gemini-extension.json',
  ];

  it.each(manifests)('%s is valid JSON', (file) => {
    expect(existsSync(join(root, file)), `${file} is missing`).toBe(true);
    expect(() => json(file), `${file} is not valid JSON`).not.toThrow();
  });

  it('names the plugin consistently across manifests', () => {
    expect(json('.claude-plugin/plugin.json').name).toBe('snice');
    expect(json('.claude-plugin/marketplace.json').name).toBe('snice');
    expect(json('.agents/plugins/marketplace.json').name).toBe('snice');
    expect(json('gemini-extension.json').name).toBe('snice');
  });

  it('points every marketplace entry at this repository root', () => {
    const claude = json('.claude-plugin/marketplace.json');
    expect(claude.plugins).toHaveLength(1);
    expect(claude.plugins[0].source).toBe('./');

    const agents = json('.agents/plugins/marketplace.json');
    expect(agents.plugins).toHaveLength(1);
    expect(agents.plugins[0].source.url).toBe('./');
  });

  it('declares the Snice version, matching package.json', () => {
    expect(json('.claude-plugin/plugin.json').version).toBe(pkg.version);
    expect(json('gemini-extension.json').version).toBe(pkg.version);
  });

  it('keeps manifest versions in the release sync script', () => {
    // Otherwise a release ships a plugin advertising a stale version.
    const sync = read('tooling/generators/sync-template-versions.js');
    expect(sync).toContain('.claude-plugin/plugin.json');
    expect(sync).toContain('gemini-extension.json');
  });

  it('provides the context file the Gemini manifest names', () => {
    const contextFile = json('gemini-extension.json').contextFileName;
    expect(contextFile).toBeTruthy();
    expect(existsSync(join(root, contextFile)), `${contextFile} is missing`).toBe(true);
  });
});

describe('Both skill copies stay identical', () => {
  const npmSkill = '.agents/skills/snice';
  const pluginSkill = 'skills/snice';

  const walk = (dir: string): string[] =>
    readdirSync(join(root, dir)).flatMap(entry => {
      const rel = join(dir, entry);
      return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel];
    });

  it('both locations exist', () => {
    expect(existsSync(join(root, npmSkill)), 'npm-shipped skill is missing').toBe(true);
    expect(existsSync(join(root, pluginSkill)), 'plugin-facing skill is missing').toBe(true);
  });

  it('contain the same files', () => {
    const a = walk(npmSkill).map(f => relative(npmSkill, f)).sort();
    const b = walk(pluginSkill).map(f => relative(pluginSkill, f)).sort();
    expect(b, `${pluginSkill} has drifted from ${npmSkill}`).toEqual(a);
  });

  it('every file matches byte for byte', () => {
    for (const file of walk(npmSkill)) {
      const counterpart = join(pluginSkill, relative(npmSkill, file));
      expect(
        read(counterpart),
        `${counterpart} has drifted from ${file} — they must carry the same skill`
      ).toBe(read(file));
    }
  });

  it('declares the skill name and a description agents can match on', () => {
    const skill = read(join(npmSkill, 'SKILL.md'));
    expect(skill.startsWith('---'), 'SKILL.md has no frontmatter').toBe(true);
    expect(skill).toMatch(/^name:\s*snice$/m);
    expect(skill).toMatch(/^description:\s*\S/m);
  });
});

describe('Install paths are documented', () => {
  it('docs/cli.md covers both the npm and repository installs', () => {
    const cli = read('docs/cli.md');
    expect(cli).toContain('npx snice init-ai');
    expect(cli).toContain('/plugin marketplace add');
    expect(cli).toContain('gemini extensions install');
  });

  it('every documented repository install points at the real repo', () => {
    const cli = read('docs/cli.md');
    const urls = Array.from(cli.matchAll(/https:\/\/gitlab\.com\/[\w/-]+/g)).map(m => m[0]);
    expect(urls.length, 'no repository install commands documented').toBeGreaterThan(3);
    for (const url of urls) {
      expect(url).toBe('https://gitlab.com/Hedzer/snice');
    }
  });

  it('the guide offers the same two paths', () => {
    const guide = read('website/guide/ai.html');
    expect(guide).toContain('npx snice init-ai');
    expect(guide).toContain('gitlab.com/Hedzer/snice');
    expect(guide).toContain('code-tabgroup');
  });
});
