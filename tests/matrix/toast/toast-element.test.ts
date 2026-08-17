/**
 * snice-toast matrix — THE TOAST ELEMENT.
 *
 * The full 4 x 2 x 2 cross of `type` x `closable` x `icon` — sixteen combos,
 * which is the whole of the element's documented surface. It is worth taking
 * whole because all three feed the SAME render: the type picks both the base
 * modifier class and the glyph inside the icon wrapper, and the two switches
 * each add or remove a child of that same row. A component that dropped the
 * icon wrapper but kept its glyph, or that rendered the info glyph for a
 * warning, is only visible when every corner is rendered.
 *
 * The ARIA half is crossed with type for a reason the doc states in prose: a
 * "Temporary notification" that a user must not miss (error, warning) is an
 * assertive `alert`, and the rest are polite `status` updates. Getting that
 * pair backwards is silent in every visual check and loud for a screen-reader
 * user.
 */
import { describe, it, afterEach } from 'vitest';
import {
  TOAST_DEFAULTS, TOAST_PARTS, TYPES,
  clickClose, closeButton, combo, expect, expectToastMatches, expectedLiveRegion,
  makeToast, part, parts, recordClose, teardown, wait,
} from './toast-support';

describe('snice-toast matrix — element', () => {
  afterEach(teardown);

  // ── type x closable x icon ───────────────────────────────────────────────
  for (const type of TYPES) {
    for (const closable of [true, false]) {
      for (const icon of [true, false]) {
        const c = combo({ type, closable, icon });
        it(`renders the documented shape: ${c.id}`, async () => {
          const el = await makeToast(c);
          expectToastMatches(el, c);
        });
      }
    }
  }

  // ── the four types get four distinct glyphs ──────────────────────────────
  it('each type renders its own icon glyph', async () => {
    const shapes: string[] = [];
    for (const type of TYPES) {
      const el = await makeToast(combo({ type }));
      const path = part(el, 'icon')!.querySelector('path');
      shapes.push(path?.getAttribute('d') ?? '∅');
      await teardown();
    }
    expect(shapes.filter(Boolean).length, 'every type draws something').toBe(TYPES.length);
    expect(new Set(shapes).size, 'and each draws something different').toBe(TYPES.length);
  });

  // ── the documented live-region pairing ───────────────────────────────────
  for (const type of TYPES) {
    it(`type="${type}" announces itself as the right kind of notification`, async () => {
      const el = await makeToast(combo({ type }));
      const expected = expectedLiveRegion(type);
      const base = part(el, 'base')!;
      expect(base.getAttribute('role'), 'role').toBe(expected.role);
      expect(base.getAttribute('aria-live'), 'aria-live').toBe(expected.live);
    });
  }

  // ── defaults ─────────────────────────────────────────────────────────────
  it('a bare toast carries every documented default', async () => {
    const el = await makeToast(combo({ type: 'info', message: '' }));
    expect({
      type: el.type, message: el.message, closable: el.closable, icon: el.icon,
    }).toEqual(TOAST_DEFAULTS);
  });

  it('a default toast still renders its three documented parts', async () => {
    const el = await makeToast(combo());
    for (const name of TOAST_PARTS) {
      expect(parts(el, name).length, `part="${name}"`).toBe(1);
    }
  });

  // ── the message ──────────────────────────────────────────────────────────
  it('the message lands in part="content" and nowhere else', async () => {
    const el = await makeToast(combo({ message: 'Failed to load' }));
    expect((part(el, 'content')!.textContent ?? '').trim()).toBe('Failed to load');
    expect((part(el, 'icon')!.textContent ?? '').trim(), 'not in the icon').toBe('');
  });

  it('an empty message renders an empty content part, not a missing one', async () => {
    const c = combo({ message: '' });
    const el = await makeToast(c);
    expectToastMatches(el, c);
    expect(part(el, 'content'), 'the part survives an empty message').not.toBeNull();
  });

  it('the message is re-rendered when it changes', async () => {
    const el = await makeToast(combo({ message: 'Loading…' }));
    el.message = 'Done';
    await wait(20);
    expect((part(el, 'content')!.textContent ?? '').trim()).toBe('Done');
  });

  it('the type modifier is re-rendered when the type changes', async () => {
    const el = await makeToast(combo({ type: 'info' }));
    el.type = 'error';
    await wait(20);
    const c = combo({ type: 'error' });
    expectToastMatches(el, c);
  });

  it('text longer than a line is not truncated in the DOM', async () => {
    // Clipping is a paint decision (the visual tier's); the DOM must still
    // carry the whole message for a screen reader to read out.
    const message = 'A very long notification message '.repeat(8).trim();
    const el = await makeToast(combo({ message }));
    expect((part(el, 'content')!.textContent ?? '').trim()).toBe(message);
  });

  // ── the close button and its event ───────────────────────────────────────
  it('close-toast carries { id } taken from the toast-id attribute', async () => {
    const el = await makeToast(combo());
    el.setAttribute('toast-id', 'toast-42');
    const seen = recordClose(el);

    expect(clickClose(el), 'the button is there to click').toBe(true);
    await wait(20);

    expect(seen).toEqual([{ id: 'toast-42' }]);
  });

  it('a toast with no id still announces its close', async () => {
    const el = await makeToast(combo());
    const seen = recordClose(el);
    clickClose(el);
    await wait(20);
    expect(seen.length, 'the click is never swallowed').toBe(1);
  });

  it('closable=false removes the button, so nothing can be clicked', async () => {
    const el = await makeToast(combo({ closable: false }));
    const seen = recordClose(el);
    expect(closeButton(el), 'no close button').toBeNull();
    expect(clickClose(el)).toBe(false);
    await wait(20);
    expect(seen).toEqual([]);
  });

  it('hide() marks the toast for departure without removing it itself', async () => {
    // The container owns removal (after the slide-out animation); the toast's
    // documented `hide()` is the mark that starts it.
    const el = await makeToast(combo());
    expect(el.classList.contains('hiding')).toBe(false);
    el.hide();
    await wait(20);
    expect(el.classList.contains('hiding'), 'marked').toBe(true);
    expect(el.isConnected, 'still in the tree until the animation ends').toBe(true);
  });

  it('the switches are independent of each other', async () => {
    const iconOnly = await makeToast(combo({ closable: false, icon: true }));
    expect(part(iconOnly, 'icon')).not.toBeNull();
    expect(closeButton(iconOnly)).toBeNull();
    await teardown();

    const closeOnly = await makeToast(combo({ closable: true, icon: false }));
    expect(part(closeOnly, 'icon')).toBeNull();
    expect(closeButton(closeOnly)).not.toBeNull();
  });
});
