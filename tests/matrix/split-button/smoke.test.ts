/**
 * Smoke slice of the snice-split-button matrix — the everyday-loop tier.
 *
 * The full cross lives in `tests/matrix/split-button/`, excluded
 * from the default Vitest include. This file stays collected and buys the
 * marquee:
 *
 *   · one populated button per state that changes the rendered tree (default,
 *     loading, disabled);
 *   · the doc's "slotted content wins" rule, the one property whose channel is
 *     spelled out;
 *   · both documented events, once each;
 *   · all three documented ways the menu closes.
 *
 * Structural assertions route through the matrix's own `splitButtonProblems`
 * oracle. BUDGET: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, captureEvents, click, key } from '../matrix-utils';
import {
  ACTIONS, EVENTS, splitButton, attrsOf, propsOf, comboId, splitButtonProblems,
  read, actionByValue, type SplitButtonCombo,
} from './split-button-support';

const mountButton = (c: SplitButtonCombo, html = '') =>
  mount<HTMLElement>('snice-split-button', attrsOf(c), html, propsOf(c));

describe('split-button matrix smoke', () => {
  afterEach(() => unmountAll());

  const marquee: SplitButtonCombo[] = [
    splitButton({ label: 'Save', variant: 'primary', actions: ACTIONS }),
    splitButton({ label: 'Save', variant: 'danger', size: 'large', outline: true, pill: true, actions: ACTIONS }),
    splitButton({ label: 'Save', loading: true, actions: ACTIONS }),
    splitButton({ label: 'Save', disabled: true, actions: ACTIONS }),
    splitButton({ label: 'Save', icon: '💾', iconPlacement: 'end', actions: ACTIONS }),
    splitButton({ label: 'Save', actions: [] }),
  ];

  for (const c of marquee) {
    it(comboId(c), async () => {
      const el = await mountButton(c);
      expect(splitButtonProblems(el, c), `combo ${comboId(c)}`).toEqual([]);
    });
  }

  it('slotted content wins over the label property', async () => {
    const c = splitButton({ label: 'Ignored', actions: ACTIONS });
    const el = await mountButton(c, 'Publish');
    expect(read(el).visibleLabel).toBe('Publish');
    expect(splitButtonProblems(el, c)).toEqual([]);
  });

  it('both documented events fire with their documented detail', async () => {
    const c = splitButton({ label: 'Save', actions: ACTIONS });
    const el = await mountButton(c);
    const recorder = captureEvents(el, [...EVENTS]);

    click(read(el).primary);
    click(read(el).toggle);
    await (el as any).rendered;
    click(actionByValue(el, 'save-draft')!.node);
    await (el as any).rendered;

    expect(recorder.types()).toEqual(['primary-click', 'action-click']);
    expect(recorder.events[0].detail).toEqual({ button: el });
    expect(recorder.events[1].detail).toEqual({
      value: 'save-draft', action: ACTIONS[0], button: el,
    });
  });

  it('the menu closes on action click, outside click, and Escape', async () => {
    const c = splitButton({ label: 'Save', actions: ACTIONS });
    const el = await mountButton(c);

    for (const close of [
      () => click(actionByValue(el, 'save-draft')!.node),
      () => click(document.body),
      () => key(document, 'Escape'),
    ]) {
      click(read(el).toggle);
      await (el as any).rendered;
      expect(read(el).open).toBe(true);

      close();
      await (el as any).rendered;
      expect(read(el).open).toBe(false);
    }
  });
});
