/**
 * Smoke slice of the snice-form-layout matrix — the everyday-loop tier.
 *
 * The full cross lives in `tests/matrix/form-layout/`, excluded from the
 * default Vitest include. This file stays collected and buys the marquee only:
 *
 *   · the documented defaults, in one render;
 *   · one combo per feature family — a multi-column grid, each label position,
 *     the compact and inline variants;
 *   · the two documented custom properties, which are the whole DOM-visible
 *     surface of a layout-only component;
 *   · the slot, which must hold the author's own fields in the author's order.
 *
 * Structural assertions route through the matrix's own `layoutProblems`
 * oracle. BUDGET: well under 1s. The grid itself is a picture — it is measured
 * in `tests/live/matrix/form-layout/`.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  layout, comboId, mountLayout, layoutProblems, read, type LayoutCombo,
} from './form-layout-support';

describe('form-layout matrix smoke', () => {
  afterEach(() => unmountAll());

  const marquee: LayoutCombo[] = [
    layout(),
    layout({ columns: 2, fields: 4 }),
    layout({ labelPosition: 'left', labelWidth: '10rem' }),
    layout({ labelPosition: 'right' }),
    layout({ variant: 'compact', gap: 'small', columns: 3, fields: 3 }),
    layout({ variant: 'inline', gap: 'large' }),
  ];

  for (const c of marquee) {
    it(comboId(c), async () => {
      const el = await mountLayout(c);
      expect(layoutProblems(el, c), comboId(c)).toEqual([]);
    });
  }

  it('the two documented custom properties carry their two properties', async () => {
    const c = layout({ columns: 3, labelWidth: '12rem', labelPosition: 'left', fields: 3 });
    const el = await mountLayout(c);
    const r = read(el);
    expect(r.columnsVariable).toBe('3');
    expect(r.labelWidthVariable).toBe('12rem');
  });

  it('the fields stay the author\'s own children, in the author\'s order', async () => {
    const c = layout({ columns: 2, fields: 4 });
    const el = await mountLayout(c);
    expect(read(el).assigned).toEqual(['0', '1', '2', '3']);
    expect(el.children.length, 'the layout moved or copied its children').toBe(4);
  });
});
