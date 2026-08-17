/**
 * snice-toast matrix — THE STATIC API.
 *
 * `Toast.success / error / warning / info / show` are documented as the way a
 * page raises a notification without owning a container at all: the first call
 * creates one, every later call reuses it, and each returns a `Promise<string>`
 * id that `Toast.hide(id)` accepts.
 *
 * The cross is ENTRY POINT x OPTIONS. The four typed helpers are documented as
 * `show` with a fixed `type`, so each must (a) produce that type and (b) still
 * honour every other option — a helper implemented by overwriting the whole
 * options object instead of merging into it silently drops `duration`, `id`,
 * `closable` and `icon`, and that is exactly the shape of bug this cross is
 * for.
 */
import { describe, it, afterEach } from 'vitest';
import {
  SETTLE, TYPES,
  Toast, combo, dismissed, expect, expectToastMatches, findToast, globalContainer,
  messagesOf, teardown, toastsOf, wait,
} from './toast-support';

/** The five documented entry points, and the type each is documented to give. */
const ENTRIES: Array<{ name: string; call: (m: string, o?: any) => Promise<string>; type: string }> = [
  { name: 'Toast.success', call: (m, o) => Toast.success(m, o), type: 'success' },
  { name: 'Toast.error', call: (m, o) => Toast.error(m, o), type: 'error' },
  { name: 'Toast.warning', call: (m, o) => Toast.warning(m, o), type: 'warning' },
  { name: 'Toast.info', call: (m, o) => Toast.info(m, o), type: 'info' },
  { name: 'Toast.show', call: (m, o) => Toast.show(m, o), type: 'info' },
];

describe('snice-toast matrix — static API', () => {
  afterEach(teardown);

  // ── entry point: the type it promises ────────────────────────────────────
  for (const entry of ENTRIES) {
    it(`${entry.name} raises a ${entry.type} toast and returns its id`, async () => {
      const id = await entry.call('Message', { duration: 0 });
      await wait(SETTLE);

      const container = globalContainer();
      expect(container, 'a container was created for us').not.toBeNull();
      expect(typeof id).toBe('string');
      expectToastMatches(
        findToast(container, id),
        combo({ type: entry.type as any, message: 'Message' }),
      );
    });

    // ── entry point x every other option ───────────────────────────────────
    it(`${entry.name} still honours closable, icon and id`, async () => {
      const id = await entry.call('Message', {
        duration: 0, closable: false, icon: false, id: 'pinned',
      });
      await wait(SETTLE);

      expect(id, 'the explicit id survives the helper').toBe('pinned');
      expectToastMatches(
        findToast(globalContainer(), 'pinned'),
        combo({ type: entry.type as any, message: 'Message', closable: false, icon: false }),
      );
    });

    it(`${entry.name} still honours duration`, async () => {
      const id = await entry.call('Message', { duration: 30 });
      await wait(100);
      expect(dismissed(findToast(globalContainer(), id)),
        'the helper did not drop the timer').toBe(true);
    });
  }

  // ── show() honours an explicit type ──────────────────────────────────────
  for (const type of TYPES) {
    it(`Toast.show honours options.type="${type}"`, async () => {
      const id = await Toast.show('Custom', { type, duration: 0 });
      await wait(SETTLE);
      expectToastMatches(
        findToast(globalContainer(), id),
        combo({ type, message: 'Custom' }),
      );
    });
  }

  // ── the container is created once and reused ─────────────────────────────
  it('the first call creates a container, later calls reuse it', async () => {
    await Toast.info('one', { duration: 0 });
    await wait(SETTLE);
    expect(document.body.querySelectorAll('snice-toast-container').length).toBe(1);

    await Toast.success('two', { duration: 0 });
    await Toast.error('three', { duration: 0 });
    await wait(SETTLE);

    expect(document.body.querySelectorAll('snice-toast-container').length,
      'still exactly one container').toBe(1);
    expect(messagesOf(globalContainer()).sort()).toEqual(['one', 'three', 'two']);
  });

  it('options.position moves the shared container to that corner', async () => {
    await Toast.info('one', { duration: 0, position: 'top-right' });
    await wait(SETTLE);
    expect(globalContainer().position).toBe('top-right');

    await Toast.info('two', { duration: 0, position: 'bottom-left' });
    await wait(SETTLE);
    expect(globalContainer().position, 'the option is honoured').toBe('bottom-left');
    expect(document.body.querySelectorAll('snice-toast-container').length,
      'without spawning a second container').toBe(1);
  });

  it('an existing page-authored container is adopted rather than duplicated', async () => {
    // `<snice-toast-container position="bottom-center">` is documented markup;
    // the static API must not build a rival stack next to it.
    const authored = document.createElement('snice-toast-container') as any;
    authored.setAttribute('position', 'top-center');
    document.body.appendChild(authored);
    await authored.ready;
    await wait(SETTLE);

    const id = await Toast.success('Saved', { duration: 0 });
    await wait(SETTLE);

    expect(document.body.querySelectorAll('snice-toast-container').length).toBe(1);
    expect(findToast(authored, id)?.message, 'the toast went to the authored container')
      .toBe('Saved');
  });

  // ── hide / clear through the static API ──────────────────────────────────
  it('Toast.hide(id) dismisses the toast that id names', async () => {
    const keep = await Toast.info('keep', { duration: 0 });
    const drop = await Toast.info('drop', { duration: 0 });
    await wait(SETTLE);

    Toast.hide(drop);
    await wait(SETTLE);

    const container = globalContainer();
    expect(dismissed(findToast(container, drop))).toBe(true);
    expect(dismissed(findToast(container, keep))).toBe(false);
  });

  it('Toast.clear() dismisses everything on screen', async () => {
    await Toast.info('a', { duration: 0 });
    await Toast.warning('b', { duration: 0 });
    await Toast.error('c', { duration: 0 });
    await wait(SETTLE);

    Toast.clear();
    await wait(SETTLE);

    expect(toastsOf(globalContainer()).map(dismissed)).toEqual([true, true, true]);
  });

  it('Toast.hide and Toast.clear are safe before anything has been shown', async () => {
    expect(() => Toast.hide('nothing')).not.toThrow();
    expect(() => Toast.clear()).not.toThrow();
    expect(document.body.querySelector('snice-toast-container'),
      'and they do not conjure a container').toBeNull();
  });

  // ── the documented async shape ───────────────────────────────────────────
  it('every entry point returns a promise, as the documented signature says', async () => {
    for (const entry of ENTRIES) {
      const result = entry.call('m', { duration: 0 });
      expect(typeof (result as any).then, `${entry.name} returns a thenable`).toBe('function');
      await result;
      await teardown();
    }
  });

  it('the doc\'s own await-then-hide pattern works end to end', async () => {
    // `const id = await Toast.info('Loading...', { duration: 0 }); … Toast.hide(id)`
    const id = await Toast.info('Loading...', { duration: 0 });
    await wait(SETTLE);
    expect(dismissed(findToast(globalContainer(), id))).toBe(false);

    Toast.hide(id);
    await wait(SETTLE);
    expect(dismissed(findToast(globalContainer(), id))).toBe(true);
  });

  /**
   * MATRIX-toast-1.
   *
   * Documented: `<snice-toast-container>` "Positions and manages toasts" — one
   * stack — and `Toast.show()` returns a `Promise<string>` id that
   * `Toast.hide(id)` accepts. Nothing in the API is documented as
   * single-flight, and a promise-returning API invites `Promise.all`.
   *
   * Actual: `Toast.show` creates its container synchronously but only registers
   * it globally when that container becomes ready, so every call made before
   * the first one settles builds ANOTHER container. Four concurrent calls
   * produce four stacked containers, each holding one toast and each starting
   * its own id counter — so all four ids come back as `"toast-1"`, and
   * `Toast.hide("toast-1")` can only ever reach whichever container won the
   * global slot. The other three toasts are unreachable by the documented API.
   *
   * Combo: `Promise.all(['a','b','c','d'].map(m => Toast.show(m, {duration: 0})))`.
   * Expected: 4 distinct ids, 1 container, 4 toasts in it.
   * Actual:   `["toast-1","toast-1","toast-1","toast-1"]`, 4 containers,
   *           1 toast in each.
   */
  it.fails('MATRIX-toast-1: a burst of toasts all land in the one stack', async () => {
    const ids = await Promise.all(
      ['a', 'b', 'c', 'd'].map(message => Toast.show(message, { duration: 0 })),
    );
    await wait(SETTLE);

    expect(document.body.querySelectorAll('snice-toast-container').length,
      'one stack, as the container documents').toBe(1);
    expect(new Set(ids).size, 'unique ids').toBe(4);
    expect(toastsOf(globalContainer()).length).toBe(4);
  });

  it('sequential shows all land in the one stack with distinct ids', async () => {
    const ids: string[] = [];
    for (const message of ['a', 'b', 'c', 'd']) {
      ids.push(await Toast.show(message, { duration: 0 }));
    }
    await wait(SETTLE);

    expect(document.body.querySelectorAll('snice-toast-container').length).toBe(1);
    expect(new Set(ids).size, 'unique ids').toBe(4);
    expect(toastsOf(globalContainer()).length).toBe(4);
  });
});
