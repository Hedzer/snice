// @vitest-environment node
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * What ships is not what is on disk. npm strips some files (notably
 * `.gitignore`) from every tarball, so a file the CLI reads at runtime can be
 * present locally and missing for every installed user. This packs the real
 * tarball and asserts the CLI's runtime dependencies survive it.
 *
 * Caught in 7.0.0: `create-app` read `bin/templates/.gitignore`, which npm had
 * stripped, so `--template=react` failed with ENOENT before writing
 * AGENTS.md, CLAUDE.md, or the skill.
 */

const root = process.cwd();
let entries: string[] = [];
let workDir: string;

beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), 'snice-pack-'));
  const packed = execFileSync('npm', ['pack', '--pack-destination', workDir], {
    cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  }).trim().split('\n').pop()!;

  entries = execFileSync('tar', ['-tzf', join(workDir, packed)], { encoding: 'utf8' })
    .split('\n').filter(Boolean).map(line => line.replace(/^package\//, ''));
}, 600_000);

const has = (path: string) => entries.includes(path);

describe('Published package contents', () => {
  it('packs a non-trivial file list', () => {
    expect(entries.length).toBeGreaterThan(100);
  });

  it('ships every file the CLI reads at runtime', () => {
    // Each of these is read by bin/snice.js while scaffolding or installing.
    for (const file of [
      'bin/snice.js',
      'bin/postinstall.js',
      'bin/component-scaffold.js',
      'bin/project-analyzer.js',
      'bin/templates/AI_GUIDANCE.md',
      'bin/templates/gitignore',
      'bin/templates/default/package.json',
      'bin/templates/react/package.json',
    ]) {
      expect(has(file), `${file} is missing from the tarball`).toBe(true);
    }
  });

  it('ships the agent skill that init-ai installs', () => {
    expect(has('.agents/skills/snice/SKILL.md'), 'the skill is missing from the tarball').toBe(true);
  });

  it('ships the AI docs the skill reads from node_modules', () => {
    const aiDocs = entries.filter(e => e.startsWith('docs/ai/') && e.endsWith('.md'));
    expect(aiDocs.length, 'docs/ai is missing from the tarball').toBeGreaterThan(10);
  });

  it('references no dotfile that npm would strip', () => {
    // npm always excludes .gitignore; reading one at runtime is a trap.
    // Writing `.gitignore` into the user's project is correct; *reading* one
    // out of the package is the trap, since npm strips it.
    const cli = readFileSync(join(root, 'bin/snice.js'), 'utf8');
    const reads = Array.from(cli.matchAll(/readFileSync\(([^)]*)\)/g)).map(m => m[1]);
    for (const call of reads) {
      expect(call, `bin/snice.js reads a dotfile npm strips: readFileSync(${call})`)
        .not.toMatch(/'\.gitignore'|'\.npmignore'/);
    }
  });

  it('pins the templates to the package major', () => {
    const major = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version.split('.')[0];
    for (const template of ['default', 'react']) {
      const pkg = JSON.parse(readFileSync(join(root, `bin/templates/${template}/package.json`), 'utf8'));
      expect(pkg.dependencies.snice, `${template} template does not target major ${major}`)
        .toBe(`^${major}.0.0`);
    }
  });

  it('exposes only the snice binary', () => {
    const bin = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).bin;
    expect(Object.keys(bin)).toEqual(['snice']);
    expect(has(bin.snice.replace('./', '')), 'the bin entry is not in the tarball').toBe(true);
  });

  it('ships and runs the AI-guidance install recommendation', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    expect(pkg.scripts.postinstall).toBe('node ./bin/postinstall.js');
    expect(has('bin/postinstall.js'), 'the postinstall notifier is missing from the tarball').toBe(true);

    const output = execFileSync(process.execPath, [join(root, 'bin/postinstall.js')], {
      encoding: 'utf8',
      env: { ...process.env, CI: 'true' },
    });
    expect(output).toContain('npx snice init-ai');
  });
});

afterAll(() => {
  if (workDir && existsSync(workDir)) rmSync(workDir, { recursive: true, force: true });
});
