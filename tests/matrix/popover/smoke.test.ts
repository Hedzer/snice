/**
 * Smoke slice of the snice-popover matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/popover) is excluded from the default
 * Vitest include and runs via `npm run test:matrix`. This file samples one combo
 * per feature family:
 *   · structure — parts, ARIA, placement on the panel, both slots;
 *   · trigger   — a click on the trigger opens and reports `popover-open`;
 *   · keyboard  — Enter on the trigger toggles;
 *   · outside   — a press elsewhere closes, `no-outside-dismiss` pins;
 *   · escape    — Escape closes, `no-escape-dismiss` pins.
 *
 * Every assertion routes through the matrix oracle (`checkPopover`).
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  checkPopover, click, clickOutside, combo, expectNoProblems, makePopover,
  press, record, trigger, wait,
} from './popover-support';

describe('popover matrix smoke', () => {
  afterEach(() => unmountAll());

  it('structure: an open top-start popover renders the documented panel', async () => {
    const c = combo({ placement: 'top-start', open: true, distance: 12 });
    const el = await makePopover(c);
    expectNoProblems(checkPopover(el, c), 'top-start/open');
  });

  it('trigger: a click opens the panel and reports popover-open', async () => {
    const el = await makePopover(combo());
    const events = record(el);
    click(trigger(el));
    await wait(30);
    expect((el as any).open).toBe(true);
    expect(events.map(event => event.type)).toEqual(['popover-open']);
    expect(events[0].detail.popover).toBe(el);
  });

  it('keyboard: Enter on the trigger toggles the panel', async () => {
    const el = await makePopover(combo());
    press(trigger(el)!, 'Enter');
    await wait(30);
    expect((el as any).open).toBe(true);
    press(trigger(el)!, 'Enter');
    await wait(30);
    expect((el as any).open).toBe(false);
  });

  it('outside: a press elsewhere closes, unless no-outside-dismiss', async () => {
    const dismissible = await makePopover(combo({ open: true }));
    clickOutside();
    await wait(30);
    expect((dismissible as any).open).toBe(false);

    const pinned = await makePopover(combo({ open: true, noOutsideDismiss: true }));
    clickOutside();
    await wait(30);
    expect((pinned as any).open).toBe(true);
  });

  it('escape: closes, unless no-escape-dismiss', async () => {
    const dismissible = await makePopover(combo({ open: true }));
    press(document, 'Escape');
    await wait(30);
    expect((dismissible as any).open).toBe(false);

    const pinned = await makePopover(combo({ open: true, noEscapeDismiss: true }));
    press(document, 'Escape');
    await wait(30);
    expect((pinned as any).open).toBe(true);
  });
});
