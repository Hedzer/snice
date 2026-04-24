// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('commit hygiene', () => {
  it('no commits should contain a Co-Authored-By trailer', () => {
    // Match only the actual git trailer form (line starts with "Co-Authored-By:"),
    // not prose mentions of the phrase in commit bodies.
    const result = execSync(
      'git log --format="%H %s" --grep="^Co-Authored-By: " --extended-regexp 2>/dev/null',
      { encoding: 'utf8' }
    ).trim();
    expect(result).toBe('');
  });
});
