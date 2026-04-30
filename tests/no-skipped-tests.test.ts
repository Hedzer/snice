/**
 * Meta-test: no test in this repo may be silently skipped.
 *
 * Skipping a test hides a regression. If a test is broken, fix it. If a feature
 * is gone, delete the test. If a test is genuinely conditional on environment
 * (e.g. browser-only API not available in happy-dom), use a runtime
 * `if (!cond) return;` early-return INSIDE the test body — the test then runs
 * and passes trivially in environments where it can't exercise the feature,
 * which is honest. Don't use `it.skip` / `describe.skip` / `xit` / `xdescribe`.
 *
 * Allowed exception: TEST FILES living under `tests/react-adapters/components/`
 * — those are auto-generated stubs that skip when their adapter isn't built.
 * The skip is a build-pipeline artifact, not a hidden bug. They're whitelisted
 * here so we don't break the generator's output. EVERYTHING ELSE: zero skips.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const TESTS_ROOT = join(__dirname);
const REPO_ROOT = join(__dirname, '..');

// Whitelisted directories where skips are tolerated (auto-generated).
const ALLOWED_SKIP_DIRS = [
  'react-adapters/components', // generator emits skip stubs for unbuilt adapters
];

// Patterns that constitute a skip. Match common forms only — comments / strings
// inside test bodies are tolerated by checking the patterns appear at a call
// site (preceded by whitespace or start-of-line, followed by an open paren).
const SKIP_PATTERNS = [
  /\bit\.skip\s*\(/g,
  /\bdescribe\.skip\s*\(/g,
  /\btest\.skip\s*\(/g,
  /\bxit\s*\(/g,
  /\bxdescribe\s*\(/g,
];

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) continue;
      walk(full, files);
    } else if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function isAllowed(filePath: string): boolean {
  const rel = relative(REPO_ROOT, filePath).replace(/\\/g, '/');
  return ALLOWED_SKIP_DIRS.some(dir => rel.startsWith(`tests/${dir}/`));
}

describe('repo hygiene: no skipped tests', () => {
  it('every test in tests/ runs (no it.skip / describe.skip / xit / xdescribe)', () => {
    const offenders: { file: string; line: number; match: string }[] = [];
    const files = walk(TESTS_ROOT);

    // Don't audit this very file (it contains the patterns as data).
    const selfPath = __filename;

    for (const file of files) {
      if (file === selfPath) continue;
      if (isAllowed(file)) continue;

      const content = readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        for (const pat of SKIP_PATTERNS) {
          // Reset regex lastIndex (g-flag persists state across calls)
          pat.lastIndex = 0;
          if (pat.test(line)) {
            offenders.push({ file: relative(REPO_ROOT, file), line: i + 1, match: line.trim() });
            break;
          }
        }
      });
    }

    if (offenders.length > 0) {
      const lines = offenders.map(o => `  ${o.file}:${o.line}  ${o.match}`).join('\n');
      const banner = [
        '',
        '═══════════════════════════════════════════════════════════════════════════',
        '  STOP. READ THIS.',
        '',
        '  THERE IS NO SUCH THING AS A "PRE-EXISTING SKIP" IN THIS REPO.',
        '  THERE IS NO SUCH THING AS A "PRE-EXISTING FAILURE" IN THIS REPO.',
        '',
        '  If a test is skipped or failing right now, IT IS YOUR FAULT.',
        '  You either:',
        '    (a) wrote a skip and need to delete the skip and fix the test, or',
        '    (b) broke something in source and need to fix source, or',
        '    (c) are looking at a test for a feature that no longer exists',
        '        and you need to delete the test entirely.',
        '',
        '  Do NOT report this as "pre-existing".',
        '  Do NOT report this as "out of scope".',
        '  Do NOT add another skip or filter the run to make this go away.',
        '  Fix every offender below before reporting the work as done.',
        '═══════════════════════════════════════════════════════════════════════════',
        '',
        `Found ${offenders.length} skipped test(s):`,
        lines,
        '',
      ].join('\n');
      throw new Error(banner);
    }
    expect(offenders.length).toBe(0);
  });
});
