// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('commit hygiene', () => {
  it('no commits should contain Co-Authored-By', () => {
    const result = execSync('git log --format="%H %s" --grep="Co-Authored-By" 2>/dev/null', { encoding: 'utf8' }).trim();
    expect(result).toBe('');
  });
});
