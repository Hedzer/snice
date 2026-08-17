/**
 * Smoke slice of the snice-toast matrix — the everyday-loop tier.
 *
 * One combo per feature family, so a family that breaks cannot hide:
 *
 *   · element   — the three documented parts, the type modifier and the
 *                 live-region pairing;
 *   · chrome    — `closable` and `icon` each remove exactly their own child;
 *   · queue     — a top-anchored container stacks newest-first, ids address
 *                 toasts, and `clear()` dismisses them all;
 *   · duration  — `0` never auto-dismisses, a short one does;
 *   · close     — the button dismisses its own toast through the container;
 *   · static    — `Toast.success` creates the container, returns an id, and
 *                 `Toast.hide(id)` takes it back.
 *
 * Structure routes through the matrix oracle (`expectToastMatches`).
 *
 * BUDGET: under 1s. New combos go in the matrix, never here.
 */
import { describe, it, afterEach } from 'vitest';
import {
  SETTLE,
  Toast, clickClose, closeButton, combo, dismissed, expect, expectToastMatches,
  findToast, globalContainer, makeContainer, makeToast, messagesOf, part,
  teardown, toastsOf, wait,
} from './toast-support';

describe('toast matrix smoke', () => {
  afterEach(teardown);

  it('element: parts, type modifier and the assertive live region', async () => {
    const c = combo({ type: 'error', message: 'Failed to load' });
    const el = await makeToast(c);
    expectToastMatches(el, c);
    expect(part(el, 'base')!.getAttribute('role')).toBe('alert');
  });

  it('chrome: closable and icon each remove exactly their own child', async () => {
    const c = combo({ type: 'success', closable: false, icon: false });
    const el = await makeToast(c);
    expectToastMatches(el, c);
    expect(part(el, 'icon')).toBeNull();
    expect(closeButton(el)).toBeNull();
    expect(part(el, 'content'), 'the message survives').not.toBeNull();
  });

  it('queue: a top container stacks newest-first and clear() empties it', async () => {
    const container = await makeContainer('top-right');
    container.show('first', { duration: 0 });
    container.show('second', { duration: 0 });
    await wait(SETTLE);
    expect(messagesOf(container)).toEqual(['second', 'first']);

    container.clear();
    await wait(SETTLE);
    expect(toastsOf(container).map(dismissed)).toEqual([true, true]);
  });

  it('duration: 0 sticks, a short one dismisses itself', async () => {
    const container = await makeContainer();
    const sticky = container.show('sticky', { duration: 0 });
    const brief = container.show('brief', { duration: 30 });
    await wait(100);

    expect(dismissed(findToast(container, sticky))).toBe(false);
    expect(dismissed(findToast(container, brief))).toBe(true);
  });

  it('close: the button dismisses its own toast and leaves the rest', async () => {
    const container = await makeContainer();
    const a = container.show('a', { duration: 0 });
    const b = container.show('b', { duration: 0 });
    await wait(SETTLE);

    clickClose(findToast(container, b));
    await wait(SETTLE);

    expect(dismissed(findToast(container, b))).toBe(true);
    expect(dismissed(findToast(container, a))).toBe(false);
  });

  it('static: Toast.success creates a container and Toast.hide takes it back', async () => {
    const id = await Toast.success('Saved successfully', { duration: 0 });
    await wait(SETTLE);

    const container = globalContainer();
    expect(container, 'a container was created').not.toBeNull();
    expectToastMatches(findToast(container, id), combo({
      type: 'success', message: 'Saved successfully',
    }));

    Toast.hide(id);
    await wait(SETTLE);
    expect(dismissed(findToast(container, id))).toBe(true);
  });
});
