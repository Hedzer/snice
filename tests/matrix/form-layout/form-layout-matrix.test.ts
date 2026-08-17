/**
 * snice-form-layout feature matrix.
 *
 * Dimensions (docs/ai/components/form-layout.md § Properties):
 *   variant (3) x gap (3) x labelPosition (3) = 27 combos, plus the `columns`
 *   sweep, the `label-width` sweep, the slotting cases, and the documented
 *   "no events" clause.
 *
 * Every case is judged by `layoutProblems`, the one oracle for this component.
 *
 * This component is LAYOUT ONLY, so this tier is deliberately the smaller half
 * of its matrix: it owns the three things a DOM without layout can still see —
 * the class hooks, the two documented custom properties, and the slotted
 * fields — while the grid itself is measured in a real engine by
 * `tests/live/matrix/form-layout/form-layout-visual.spec.ts`.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll, product, captureEvents } from '../matrix-utils';
import {
  layout, comboId, mountLayout, layoutProblems, read, fieldsMarkup,
  LABEL_POSITIONS, GAPS, VARIANTS, DEFAULTS,
  type LayoutCombo, type FormLayoutGap, type FormLayoutVariant,
  type FormLayoutLabelPosition,
} from './form-layout-support';

describe('form-layout matrix', () => {
  afterEach(() => unmountAll());

  // ── The full presentation cross ──────────────────────────────────────────

  for (const point of product({
    variant: VARIANTS,
    gap: GAPS,
    labelPosition: LABEL_POSITIONS,
  })) {
    const c: LayoutCombo = layout({
      variant: point.variant as FormLayoutVariant,
      gap: point.gap as FormLayoutGap,
      labelPosition: point.labelPosition as FormLayoutLabelPosition,
      columns: 2,
    });

    it(comboId(c), async () => {
      const el = await mountLayout(c);
      expect(layoutProblems(el, c), comboId(c)).toEqual([]);
    });
  }

  // ── columns: "--form-columns — Number of grid columns (set from `columns`)" ─

  for (const columns of [1, 2, 3, 4, 6, 12]) {
    it(`columns=${columns} reaches --form-columns`, async () => {
      const c = layout({ columns, fields: columns });
      const el = await mountLayout(c);
      expect(read(el).columnsVariable).toBe(String(columns));
      expect(layoutProblems(el, c), comboId(c)).toEqual([]);
    });
  }

  it('columns changes at runtime follow the property', async () => {
    const c = layout({ columns: 1 });
    const el = await mountLayout(c);
    expect(read(el).columnsVariable).toBe('1');

    el.setAttribute('columns', '3');
    await (el as any).rendered;

    expect(read(el).columnsVariable, 'the custom property did not follow columns').toBe('3');
    expect(layoutProblems(el, layout({ ...c, columns: 3 }))).toEqual([]);
  });

  // ── label-width: "--form-label-width — Label width for left/right positions" ─

  for (const labelWidth of ['8rem', '10rem', '120px', '25%']) {
    it(`label-width="${labelWidth}" reaches --form-label-width`, async () => {
      const c = layout({ labelWidth, labelPosition: 'left' });
      const el = await mountLayout(c);
      expect(read(el).labelWidthVariable).toBe(labelWidth);
      expect(layoutProblems(el, c), comboId(c)).toEqual([]);
    });
  }

  it('the documented label-width default is published even when unauthored', async () => {
    const c = layout();
    const el = await mountLayout(c);
    expect(read(el).labelWidthVariable, 'the default label width is not published')
      .toBe(DEFAULTS.labelWidth);
  });

  it('a label-width change at runtime follows the property', async () => {
    const c = layout({ labelPosition: 'left' });
    const el = await mountLayout(c);
    el.setAttribute('label-width', '14rem');
    await (el as any).rendered;
    expect(read(el).labelWidthVariable).toBe('14rem');
  });

  // ── The default slot ─────────────────────────────────────────────────────

  for (const fields of [0, 1, 2, 5, 12]) {
    it(`${fields} slotted field(s) stay the author's own children, in order`, async () => {
      const c = layout({ fields, columns: 2 });
      const el = await mountLayout(c);
      expect(layoutProblems(el, c), comboId(c)).toEqual([]);
      expect(el.children.length, 'the layout moved or copied its children').toBe(fields);
    });
  }

  it('fields added after the first render are slotted too', async () => {
    const c = layout({ fields: 2 });
    const el = await mountLayout(c);
    el.insertAdjacentHTML('beforeend', '<div class="field" data-index="2">Field 3</div>');
    await (el as any).rendered;

    expect(read(el).assigned, 'a late field was not slotted').toEqual(['0', '1', '2']);
    expect(layoutProblems(el, layout({ ...c, fields: 3 }))).toEqual([]);
  });

  it('a field removed after the first render leaves the rest in order', async () => {
    const c = layout({ fields: 3 });
    const el = await mountLayout(c);
    el.querySelector('[data-index="1"]')!.remove();
    await (el as any).rendered;

    expect(read(el).assigned).toEqual(['0', '2']);
  });

  it('an authored grid-column span is left alone', async () => {
    // The docs' own escape hatch: "Span columns with CSS `grid-column` on a
    // slotted child". The layout must not overwrite it.
    const el = await mountLayout(layout({ columns: 2, fields: 0 }));
    el.innerHTML = fieldsMarkup(1)
      + '<div class="field" data-index="1" style="grid-column: 1 / -1">Wide</div>';
    await (el as any).rendered;

    const wide = el.querySelector('[data-index="1"]') as HTMLElement;
    expect(wide.style.gridColumn, 'the layout rewrote an authored span').toBe('1 / -1');
    expect(read(el).assigned).toEqual(['0', '1']);
  });

  // ── Defaults ─────────────────────────────────────────────────────────────

  it('an unconfigured layout takes every documented default', async () => {
    const el = await mountLayout(layout({
      columns: DEFAULTS.columns, gap: DEFAULTS.gap, variant: DEFAULTS.variant,
      labelPosition: DEFAULTS.labelPosition, labelWidth: DEFAULTS.labelWidth,
    }));
    const r = read(el);
    expect(r.columnsVariable).toBe('1');
    expect(r.labelWidthVariable).toBe('8rem');
    expect(r.classes.has('form-layout--gap-medium')).toBe(true);
    expect(r.classes.has('form-layout--default')).toBe(true);
    expect(r.classes.has('form-layout--labels-top')).toBe(true);
  });

  // ── "No events — layout-only component." ────────────────────────────────

  it('nothing the layout does emits an event', async () => {
    const el = await mountLayout(layout({ fields: 2 }));
    const heard: string[] = [];
    const listener = (e: Event) => heard.push(e.type);
    // A layout-only component has no documented event names to listen for, so
    // listen for every type it could plausibly invent.
    for (const type of ['change', 'input', 'form-layout-change', 'layout-change', 'resize']) {
      el.addEventListener(type, listener);
    }
    const recorder = captureEvents(el, ['change', 'input']);

    el.setAttribute('columns', '3');
    el.setAttribute('gap', 'large');
    el.setAttribute('variant', 'compact');
    el.setAttribute('label-position', 'left');
    el.insertAdjacentHTML('beforeend', '<div class="field" data-index="2">Field 3</div>');
    await (el as any).rendered;

    expect(heard, 'a layout-only component emitted an event').toEqual([]);
    expect(recorder.types()).toEqual([]);
  });
});
