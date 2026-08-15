/**
 * Matrix slice SPLIT-BUTTON / PRESENTATION — every documented presentation
 * property crossed against the others.
 *
 * Dimensions (docs/ai/components/split-button.md § Properties):
 *   variant (5) x size (3) x outline (2) x pill (2) = 60 combos, plus the
 *   state cross (loading x disabled x actions = 8), the icon cross
 *   (icon source x placement x loading = 12), and the label/slot rule.
 *
 * All judged by `splitButtonProblems`.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, product, part } from '../matrix-utils';
import {
  VARIANTS, SIZES, PLACEMENTS, ACTIONS, splitButton, attrsOf, propsOf, comboId,
  splitButtonProblems, read, type SplitButtonCombo,
} from './split-button-support';

const mountButton = (c: SplitButtonCombo, html = '') =>
  mount<HTMLElement>('snice-split-button', attrsOf(c), html, propsOf(c));

describe('split-button matrix: presentation', () => {
  afterEach(() => unmountAll());

  // ── variant x size x outline x pill ──────────────────────────────────────

  for (const point of product({
    variant: VARIANTS,
    size: SIZES,
    outline: [false, true],
    pill: [false, true],
  })) {
    const c = splitButton({ ...point, label: 'Save', actions: ACTIONS });

    it(comboId(c), async () => {
      const el = await mountButton(c);
      expect(splitButtonProblems(el, c), `combo ${comboId(c)}`).toEqual([]);
    });
  }

  // ── loading x disabled x actions ─────────────────────────────────────────

  for (const point of product({
    loading: [false, true],
    disabled: [false, true],
    withActions: [false, true],
  })) {
    const c = splitButton({
      label: 'Save',
      loading: point.loading,
      disabled: point.disabled,
      actions: point.withActions ? ACTIONS : [],
    });

    it(comboId(c), async () => {
      const el = await mountButton(c);
      expect(splitButtonProblems(el, c), `combo ${comboId(c)}`).toEqual([]);
      expect(!!part(el, 'spinner'), 'spinner part follows loading').toBe(point.loading);
    });
  }

  // ── icon x placement x loading ───────────────────────────────────────────

  for (const point of product({
    icon: ['', '💾', '/icons/save.png'],
    iconPlacement: PLACEMENTS,
    loading: [false, true],
  })) {
    const c = splitButton({
      label: 'Save',
      icon: point.icon,
      iconPlacement: point.iconPlacement,
      loading: point.loading,
      actions: ACTIONS,
    });

    it(comboId(c), async () => {
      const el = await mountButton(c);
      expect(splitButtonProblems(el, c), `combo ${comboId(c)}`).toEqual([]);
    });
  }

  // ── label vs slotted content ─────────────────────────────────────────────

  it('the label property becomes the button text', async () => {
    const c = splitButton({ label: 'Save', actions: ACTIONS });
    const el = await mountButton(c);
    expect(read(el).visibleLabel).toBe('Save');
    expect(splitButtonProblems(el, c)).toEqual([]);
  });

  it('slotted content wins over the label property', async () => {
    // The doc says so in the property list itself: "slotted content wins".
    const c = splitButton({ label: 'Ignored', actions: ACTIONS });
    const el = await mountButton(c, 'Publish');
    expect(read(el).slottedLabel).toBe('Publish');
    expect(read(el).visibleLabel).toBe('Publish');
    expect(read(el).labelText, 'the label property is still the slot fallback').toBe('Ignored');
    expect(splitButtonProblems(el, c)).toEqual([]);
  });

  it('slotted content works with no label property at all', async () => {
    const c = splitButton({ actions: ACTIONS });
    const el = await mountButton(c, 'Publish');
    expect(read(el).visibleLabel).toBe('Publish');
    expect(splitButtonProblems(el, c)).toEqual([]);
  });

  it('no label and no slot leaves the button text empty', async () => {
    const c = splitButton({ actions: ACTIONS });
    const el = await mountButton(c);
    expect(read(el).visibleLabel).toBe('');
    expect(splitButtonProblems(el, c)).toEqual([]);
  });

  // ── actions ──────────────────────────────────────────────────────────────

  const actionShapes: Array<[string, SplitButtonCombo['actions']]> = [
    ['no actions', []],
    ['one action', [{ value: 'a', label: 'Alpha' }]],
    ['a disabled action', [{ value: 'a', label: 'Alpha', disabled: true }]],
    ['an action with an icon', [{ value: 'a', label: 'Alpha', icon: '/icons/a.png' }]],
    ['the documented example', ACTIONS],
    ['every shape at once', [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta', icon: '/icons/b.png' },
      { value: 'c', label: 'Gamma', disabled: true },
      { value: 'd', label: 'Delta', icon: '/icons/d.png', disabled: true },
    ]],
  ];

  for (const [id, actions] of actionShapes) {
    it(`actions: ${id}`, async () => {
      const c = splitButton({ label: 'Save', actions });
      const el = await mountButton(c);
      expect(splitButtonProblems(el, c), id).toEqual([]);
      expect(read(el).actions.map(a => a.value), id).toEqual(actions.map(a => a.value));
    });
  }

  it('replacing the actions array re-renders the menu', async () => {
    const c = splitButton({ label: 'Save', actions: ACTIONS });
    const el = await mountButton(c);
    expect(read(el).actions).toHaveLength(3);

    const replaced = splitButton({ label: 'Save', actions: [{ value: 'x', label: 'Only' }] });
    (el as any).actions = replaced.actions;
    await (el as any).rendered;

    expect(splitButtonProblems(el, replaced)).toEqual([]);
    expect(read(el).actions.map(a => a.value)).toEqual(['x']);
  });

  it('clearing the actions array empties the menu', async () => {
    const c = splitButton({ label: 'Save', actions: ACTIONS });
    const el = await mountButton(c);

    const cleared = splitButton({ label: 'Save', actions: [] });
    (el as any).actions = [];
    await (el as any).rendered;

    expect(splitButtonProblems(el, cleared)).toEqual([]);
    expect(read(el).actions).toEqual([]);
  });
});
