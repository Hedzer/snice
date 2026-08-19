/**
 * snice-select clear-button matrix — the display contract.
 *
 * The clear button paints exactly when `clearable` meets a selection, and
 * disappears when the control is disabled, readonly, or loading. While it
 * paints, the trigger carries `select-trigger--clear-visible`, which widens
 * the trigger's right padding so the absolute icon block (clear + chevron)
 * fits outside the value area — the visual tier measures that geometry in a
 * real browser; this tier pins the display/class contract engine-independently.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll, one } from '../matrix-utils';
import { combo, makeSelect, clearButton } from './select-support';

describe('select matrix — clear button display', () => {
  afterEach(() => unmountAll());

  const triggerOf = (el: HTMLElement) =>
    el.shadowRoot!.querySelector('.select-trigger') as HTMLElement;
  const shown = (el: HTMLElement) => {
    const btn = clearButton(el);
    return !!btn && btn.style.display !== 'none';
  };
  const classOn = (el: HTMLElement) =>
    triggerOf(el).classList.contains('select-trigger--clear-visible');

  for (const source of ['array', 'children'] as const) {
    it(`${source}: clearable + a selection shows the button and widens the trigger`, async () => {
      const el = await makeSelect(combo({ source, clearable: true, value: 'apple' }));
      expect(shown(el)).toBe(true);
      expect(classOn(el)).toBe(true);
    });

    it(`${source}: clearable without a selection paints neither`, async () => {
      const el = await makeSelect(combo({ source, clearable: true }));
      expect(shown(el)).toBe(false);
      expect(classOn(el)).toBe(false);
    });

    it(`${source}: a non-clearable selection never paints the button`, async () => {
      const el = await makeSelect(combo({ source, value: 'apple' }));
      expect(shown(el)).toBe(false);
      expect(classOn(el)).toBe(false);
    });

    for (const flag of ['disabled', 'readonly', 'loading'] as const) {
      it(`${source}: ${flag} hides a would-be clear button`, async () => {
        const el = await makeSelect(combo({ source, clearable: true, value: 'apple', [flag]: true } as any));
        expect(shown(el)).toBe(false);
        expect(classOn(el)).toBe(false);
      });
    }

    it(`${source}: a multiple selection shows exactly one clear button`, async () => {
      const el = await makeSelect(combo({ source, clearable: true, multiple: true, value: 'apple,cherry' }));
      expect(shown(el)).toBe(true);
      expect(classOn(el)).toBe(true);
      expect(one(el, '.select-clear')).not.toBeNull();
      expect(el.shadowRoot!.querySelectorAll('.select-clear').length).toBe(1);
    });
  }

  it('clearing the selection hides the button and the class again', async () => {
    const el = await makeSelect(combo({ clearable: true, value: 'apple' }));
    expect(shown(el)).toBe(true);
    expect(classOn(el)).toBe(true);
    el.clear();
    expect(shown(el)).toBe(false);
    expect(classOn(el)).toBe(false);
  });
});
