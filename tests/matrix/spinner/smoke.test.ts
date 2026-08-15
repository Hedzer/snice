/**
 * Smoke slice of the snice-spinner matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full spinner matrix (36 combos) runs only via
 * `npm run test:matrix`. This file deliberately lives at `smoke.test.ts` so
 * it stays collected.
 *
 * What it covers — one marquee combo per family:
 *   · variants — each of the five renders ITS wrapper part and no other;
 *   · caption  — the label part and the announcement;
 *   · slot     — the documented "stray slotted text never renders";
 *   · size     — the scale reaches the rendered geometry.
 *
 * Every assertion routes through the matrix's own oracle (`expectedShape` /
 * `readShape` in matrix/spinner/spinner-support.ts).
 *
 * BUDGET: under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, expectShape } from '../matrix-utils';
import {
  VARIANTS, expectedShape, readShape, renderedSize,
} from './spinner-support';

afterEach(unmountAll);

describe('snice-spinner matrix smoke', () => {
  for (const variant of VARIANTS) {
    it(`${variant}: renders its own wrapper part and nothing else`, async () => {
      const el = await mount('snice-spinner', { variant });
      expectShape(readShape(el), expectedShape({
        variant, size: 'medium', color: 'primary', label: '',
      }), variant);
    });
  }

  it('caption: the label renders and announces', async () => {
    const el = await mount('snice-spinner', { label: 'Loading…' }, 'stray text');
    expectShape(readShape(el), expectedShape({
      variant: 'arc', size: 'medium', color: 'primary', label: 'Loading…',
    }), 'labelled');
  });

  it('size: the scale reaches the rendered geometry', async () => {
    const small = await mount('snice-spinner', { size: 'small' });
    const xl = await mount('snice-spinner', { size: 'xl' });
    expect(renderedSize(xl, 'arc')).toBeGreaterThan(renderedSize(small, 'arc'));
  });
});
