import { describe, expect, it } from 'vitest';
import inputStyles from '../packages/components/src/input/snice-input.css?inline';

describe('Vitest CSS module fidelity', () => {
  it('loads real ?inline stylesheet text instead of an empty test stub', () => {
    expect(inputStyles.length).toBeGreaterThan(100);
    expect(inputStyles).toContain(':host');
  });
});
