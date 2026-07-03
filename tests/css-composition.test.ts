import { describe, it, expect } from 'vitest';
import { css } from '../src/index';

// A css`` result interpolated inside another css`` must inline its cssText, not
// stringify to "[object Object]". This is how shared style fragments compose.
describe('css composition', () => {
  it('inlines a nested css result, not [object Object]', () => {
    const base = css`color: red;`;
    const combined = css`:host { ${base} }`;

    expect(combined.cssText).toContain('color: red');
    expect(combined.cssText).not.toContain('[object Object]');
  });

  it('composes multiple css fragments', () => {
    const a = css`color: red;`;
    const b = css`background: blue;`;
    const combined = css`:host { ${a} ${b} }`;

    expect(combined.cssText).toContain('color: red');
    expect(combined.cssText).toContain('background: blue');
    expect(combined.cssText).not.toContain('[object Object]');
  });

  it('still interpolates plain string/number values', () => {
    const size = 8;
    const combined = css`:host { padding: ${size}px; margin: ${'1rem'}; }`;

    expect(combined.cssText).toContain('padding: 8px');
    expect(combined.cssText).toContain('margin: 1rem');
  });

  it('the composed stylesheet reflects the inlined text', () => {
    const base = css`color: green;`;
    const combined = css`:host { ${base} }`;

    // If a constructable stylesheet was built, it must contain the inlined rule.
    if (combined.styleSheet) {
      const text = Array.from(combined.styleSheet.cssRules).map(r => r.cssText).join(' ');
      expect(text).toContain('green');
    }
  });
});
