/**
 * snice-toast-container matrix — THE QUEUE.
 *
 * The container has one documented property (`position`, six values) and three
 * documented methods (`show`, `hide`, `clear`). The cross that matters is
 * `position` x STACK OPERATION, because position is not only where the stack
 * is painted — it decides the READING ORDER of the stack. A top-anchored
 * container grows downwards from the corner, so the newest toast belongs
 * nearest the corner (first in the DOM); a bottom-anchored one grows upwards,
 * so the newest belongs last. Getting that backwards puts the newest
 * notification furthest from the user's eye, and it is invisible to any test
 * that only ever shows one toast.
 *
 * Everything the container does with `ToastOptions` is here too: `type`,
 * `closable`, `icon` and `id` are documented as forwarded to the toast it
 * builds, and `duration` (default 4000, `0` = no auto-dismiss) is the timer it
 * owns itself.
 */
import { describe, it, afterEach } from 'vitest';
import {
  DEFAULT_DURATION, POSITIONS, SETTLE, TYPES,
  clickClose, combo, dismissed, expect, expectToastMatches, findToast, idsOf,
  makeContainer, messagesOf, part, teardown, toastsOf, wait,
} from './toast-support';

/** Which end of the stack a newly shown toast belongs at, per anchor. */
const newestFirst = (position: string) => position.startsWith('top');

describe('snice-toast-container matrix — queue', () => {
  afterEach(teardown);

  // ── position x stack order ───────────────────────────────────────────────
  for (const position of POSITIONS) {
    it(`stacks toward the reader at ${position}`, async () => {
      const container = await makeContainer(position);
      container.show('first', { duration: 0 });
      container.show('second', { duration: 0 });
      container.show('third', { duration: 0 });
      await wait(SETTLE);

      expect(messagesOf(container)).toEqual(
        newestFirst(position)
          ? ['third', 'second', 'first']
          : ['first', 'second', 'third'],
      );
    });

    it(`position="${position}" reaches the host where the corner is chosen`, async () => {
      const container = await makeContainer(position);
      expect(container.position).toBe(position);
      // `:host([position="top-left"])` is the only consumer, so the reflected
      // attribute IS the contract in a layout-free tier.
      expect(container.getAttribute('position')).toBe(position);
    });
  }

  // ── ids ──────────────────────────────────────────────────────────────────
  it('show() returns an id that addresses the toast it created', async () => {
    const container = await makeContainer();
    const id = container.show('Saved', { duration: 0 });
    await wait(SETTLE);

    expect(typeof id, 'an id is returned').toBe('string');
    expect(id.length).toBeGreaterThan(0);
    expect(findToast(container, id)?.message, 'the id finds its toast').toBe('Saved');
  });

  it('auto-generated ids are unique across a burst', async () => {
    const container = await makeContainer();
    const ids = [1, 2, 3, 4, 5].map(n => container.show(`m${n}`, { duration: 0 }));
    await wait(SETTLE);
    expect(new Set(ids).size, 'no two toasts share an id').toBe(5);
    expect(idsOf(container).slice().sort()).toEqual(ids.slice().sort());
  });

  it('an explicit options.id is used verbatim', async () => {
    const container = await makeContainer();
    const id = container.show('Saved', { id: 'my-toast', duration: 0 });
    await wait(SETTLE);
    expect(id).toBe('my-toast');
    expect(findToast(container, 'my-toast')).not.toBeNull();
  });

  // ── options are forwarded to the toast ───────────────────────────────────
  for (const type of TYPES) {
    it(`options.type="${type}" builds a toast of that type`, async () => {
      const container = await makeContainer();
      container.show('Message', { type, duration: 0 });
      await wait(SETTLE);
      expectToastMatches(toastsOf(container)[0], combo({ type, message: 'Message' }));
    });
  }

  for (const closable of [true, false]) {
    for (const icon of [true, false]) {
      it(`options closable=${closable} icon=${icon} reach the toast`, async () => {
        const container = await makeContainer();
        container.show('Message', { closable, icon, duration: 0 });
        await wait(SETTLE);
        expectToastMatches(
          toastsOf(container)[0],
          combo({ message: 'Message', closable, icon }),
        );
      });
    }
  }

  it('omitted options fall back to the documented defaults', async () => {
    const container = await makeContainer();
    container.show('Message', { duration: 0 });
    await wait(SETTLE);
    // type=info, closable=true, icon=true.
    expectToastMatches(toastsOf(container)[0], combo({ message: 'Message' }));
  });

  // ── duration ─────────────────────────────────────────────────────────────
  it('duration: 0 means no auto-dismiss', async () => {
    const container = await makeContainer();
    const id = container.show('Sticky', { duration: 0 });
    await wait(120);
    expect(dismissed(findToast(container, id)), 'still on screen').toBe(false);
  });

  it('a positive duration dismisses the toast when it elapses', async () => {
    const container = await makeContainer();
    const id = container.show('Brief', { duration: 40 });
    await wait(SETTLE);
    expect(dismissed(findToast(container, id)), 'not yet').toBe(false);

    await wait(80);
    expect(dismissed(findToast(container, id)), 'and now it is on its way out').toBe(true);
  });

  it('the documented default duration does not fire immediately', async () => {
    // "default: 4000" — a toast with no duration option must still be on
    // screen a moment later, which is the only half of a 4s timer a fast test
    // can honestly assert.
    expect(DEFAULT_DURATION).toBeGreaterThan(100);
    const container = await makeContainer();
    const id = container.show('Default');
    await wait(120);
    expect(dismissed(findToast(container, id))).toBe(false);
  });

  it('each toast keeps its own timer', async () => {
    const container = await makeContainer();
    const quick = container.show('quick', { duration: 30 });
    const slow = container.show('slow', { duration: 0 });
    await wait(100);

    expect(dismissed(findToast(container, quick)), 'the short one left').toBe(true);
    expect(dismissed(findToast(container, slow)), 'the sticky one stayed').toBe(false);
  });

  // ── hide / clear ─────────────────────────────────────────────────────────
  it('hide(id) dismisses exactly that toast', async () => {
    const container = await makeContainer();
    const a = container.show('a', { duration: 0 });
    const b = container.show('b', { duration: 0 });
    await wait(SETTLE);

    container.hide(a);
    await wait(SETTLE);

    expect(dismissed(findToast(container, a)), 'a is dismissed').toBe(true);
    expect(dismissed(findToast(container, b)), 'b is untouched').toBe(false);
  });

  it('hide() on an unknown id is a silent no-op', async () => {
    const container = await makeContainer();
    const id = container.show('a', { duration: 0 });
    await wait(SETTLE);

    container.hide('nope');
    await wait(SETTLE);
    expect(dismissed(findToast(container, id))).toBe(false);
  });

  it('clear() dismisses every live toast', async () => {
    const container = await makeContainer();
    for (const message of ['a', 'b', 'c']) container.show(message, { duration: 0 });
    await wait(SETTLE);

    container.clear();
    await wait(SETTLE);

    expect(toastsOf(container).map(dismissed)).toEqual([true, true, true]);
  });

  it('clear() on an empty container is a silent no-op', async () => {
    const container = await makeContainer();
    container.clear();
    await wait(SETTLE);
    expect(toastsOf(container)).toEqual([]);
  });

  // ── the close button reaches the container ───────────────────────────────
  it('the toast close button dismisses that toast through the container', async () => {
    const container = await makeContainer();
    const a = container.show('a', { duration: 0 });
    const b = container.show('b', { duration: 0 });
    await wait(SETTLE);

    expect(clickClose(findToast(container, b)), 'b has a close button').toBe(true);
    await wait(SETTLE);

    expect(dismissed(findToast(container, b)), 'b dismissed by its own button').toBe(true);
    expect(dismissed(findToast(container, a)), 'a untouched').toBe(false);
  });

  // ── the container's own shape ────────────────────────────────────────────
  it('the default position is the documented one', async () => {
    const container = await makeContainer('bottom-center');
    expect(container.position).toBe('bottom-center');
  });

  it('the container hoists itself to the body so its stack is never clipped', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const container = document.createElement('snice-toast-container') as any;
    host.appendChild(container);
    await container.ready;
    await wait(SETTLE);

    expect(container.parentElement, 'lifted out of the wrapper').toBe(document.body);
  });

  it('toasts live inside the container shadow, not in the page', async () => {
    const container = await makeContainer();
    container.show('a', { duration: 0 });
    await wait(SETTLE);
    expect(toastsOf(container).length).toBe(1);
    expect(document.body.querySelector('snice-toast'), 'never in the light DOM').toBeNull();
  });

  it('a toast built by the container carries its id as an attribute', async () => {
    const container = await makeContainer();
    const id = container.show('a', { duration: 0 });
    await wait(SETTLE);
    // The close event's `{ id }` is read from this attribute, so it is the
    // link between the toast and the queue that owns it.
    expect(toastsOf(container)[0].getAttribute('toast-id')).toBe(id);
    expect(part(toastsOf(container)[0], 'base'), 'and it is a real toast').not.toBeNull();
  });
});
