import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { wait } from './test-utils';

// Component bug audit: batch 3. Each test is expected to FAIL today
// (`.fails`) and will flip to red once someone fixes the bug.

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  const locks = (globalThis as any)[Symbol.for('snice:modal-body-locks')];
  if (locks?.clear) locks.clear();
  const scrollLock = (globalThis as any)[Symbol.for('snice:body-scroll-lock')];
  if (scrollLock?.clear) scrollLock.clear();
});

// ---------------------------------------------------------------------------
// app-tiles: window.open(tile.href) trusts raw href → javascript: URL runs.
// ---------------------------------------------------------------------------

describe('app-tiles: javascript: URLs are not executed', () => {
  it('clicking a tile with href="javascript:..." does not invoke window.open with it', async () => {
    await import('../../packages/components/src/app-tiles/snice-app-tiles');

    const opens: string[] = [];
    const origOpen = window.open;
    window.open = ((url: string) => {
      opens.push(String(url));
      return null;
    }) as any;

    try {
      const el = document.createElement('snice-app-tiles') as any;
      el.tiles = [{ id: 'x', name: 'Pwn', icon: '', href: 'javascript:window.__pwn=1' }];
      document.body.appendChild(el);
      await el.ready;
      await wait(30);

      const tile = el.shadowRoot.querySelector('.tile') as HTMLElement;
      expect(tile).toBeTruthy();
      tile.click();
      await wait(30);

      // Either window.open was not called, or it was called with a sanitized URL
      const unsafe = opens.some(u => u.toLowerCase().startsWith('javascript:'));
      expect(unsafe).toBe(false);
    } finally {
      window.open = origOpen;
    }
  });
});

// ---------------------------------------------------------------------------
// network-graph: node.label interpolated into SVG innerHTML without escaping.
// ---------------------------------------------------------------------------

describe('network-graph: node labels are escaped', () => {
  it('a node label containing HTML is rendered as text, not elements', async () => {
    await import('../../packages/components/src/network-graph/snice-network-graph');
    const el = document.createElement('snice-network-graph') as any;
    el.data = {
      nodes: [{ id: 'a', label: '<img src=x onerror="window.__pwn=1">' }],
      edges: [],
    };
    document.body.appendChild(el);
    await el.ready;
    await wait(100);

    const injectedImg = el.shadowRoot.querySelector('img');
    expect(injectedImg).toBeNull();
    expect((window as any).__pwn).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// checkbox: native change + host click both toggle → event fires twice.
// ---------------------------------------------------------------------------

describe('checkbox: click does not fire change twice', () => {
  it('clicking the host toggles state exactly once', async () => {
    await import('../../packages/components/src/checkbox/snice-checkbox');
    const el = document.createElement('snice-checkbox') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    let fireCount = 0;
    el.addEventListener('checkbox-change', () => { fireCount++; });

    el.click();
    await wait(30);
    expect(fireCount).toBe(1);
    expect(el.checked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// modal: focus trap only queries shadow tree — slotted elements unreachable.
// ---------------------------------------------------------------------------

describe('modal: focus trap includes slotted elements', () => {
  it('Tab on the last focusable wraps back to the first across shadow + light DOM', async () => {
    await import('../../packages/components/src/modal/snice-modal');
    const el = document.createElement('snice-modal') as any;
    el.open = true;
    el.innerHTML = `<input class="slotted-input" /><button class="slotted-btn">Save</button>`;
    document.body.appendChild(el);
    await el.ready;
    await wait(50);

    const slottedBtn = el.querySelector('.slotted-btn') as HTMLButtonElement;
    const shadowCloseBtn = (el.shadowRoot as Element).querySelector('button') as HTMLButtonElement;
    expect(slottedBtn).toBeTruthy();
    expect(shadowCloseBtn).toBeTruthy();

    // Focus the LAST focusable (slotted "Save" button). With the fix, the
    // trap's focusable set is [shadowCloseBtn, slotted-input, slotted-btn],
    // so Tab should wrap forward to shadowCloseBtn. With the bug, slotted
    // elements aren't in the set — only shadowCloseBtn — and the check
    // `active === lastFocusable` fails because slottedBtn isn't the tracked
    // last, so no wrap happens.
    slottedBtn.focus();
    const panel = el.shadowRoot.querySelector('[part="panel"]') ?? el.shadowRoot.querySelector('.modal__panel');
    panel?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    await wait(30);

    const active = (el.shadowRoot as any).activeElement ?? document.activeElement;
    expect(active).toBe(shadowCloseBtn);
  });
});

// ---------------------------------------------------------------------------
// input: formAssociated but no formResetCallback — reset does not clear value.
// ---------------------------------------------------------------------------

describe('input: form.reset() clears the value', () => {
  it('resetting the parent form empties snice-input value', async () => {
    await import('../../packages/components/src/input/snice-input');
    const form = document.createElement('form');
    const el = document.createElement('snice-input') as any;
    form.appendChild(el);
    document.body.appendChild(form);
    await el.ready;
    await wait(30);

    el.value = 'hello';
    // Happy-dom doesn't always call formResetCallback automatically on
    // form.reset(); invoke it directly to verify the element's own logic.
    if (typeof el.formResetCallback === 'function') {
      el.formResetCallback();
    } else {
      form.reset();
    }
    await wait(30);
    expect(el.value).toBe('');
  });
});

// ---------------------------------------------------------------------------
// countdown: invalid target string → renders "NaN" forever.
// ---------------------------------------------------------------------------

describe('countdown: invalid target does not render NaN', () => {
  it('setting target to an unparseable string does not produce NaN in the DOM', async () => {
    await import('../../packages/components/src/countdown/snice-countdown');
    const el = document.createElement('snice-countdown') as any;
    el.target = 'tomorrow'; // unparseable
    document.body.appendChild(el);
    await el.ready;
    await wait(50);

    const text = el.shadowRoot.textContent || '';
    expect(text).not.toContain('NaN');
  });
});

// ---------------------------------------------------------------------------
// image: imageLoaded flag not reset on src change.
// ---------------------------------------------------------------------------

describe('image: changing src resets loaded state', () => {
  it('changing src hides the previous loaded image until the new one loads', async () => {
    await import('../../packages/components/src/image/snice-image');
    const el = document.createElement('snice-image') as any;
    el.src = 'about:blank';
    el.placeholder = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
    document.body.appendChild(el);
    await el.ready;

    // simulate first image finishing load
    (el as any).imageLoaded = true;
    await wait(30);

    // change src — bug: imageLoaded stays true, placeholder does not reappear
    el.src = 'about:blank?second';
    await wait(30);

    expect((el as any).imageLoaded).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// drawer: body scroll lock not cleared in @dispose when drawer is open.
// ---------------------------------------------------------------------------

describe('drawer: body scroll lock is released on disconnect', () => {
  it('removing an open drawer restores document.body overflow', async () => {
    await import('../../packages/components/src/drawer/snice-drawer');
    // Render the drawer already-open by setting the attribute BEFORE attach.
    // @ready's init() reads `this.open` and calls handleOpen() when true, which
    // is the same real-world flow as an initially-open drawer in markup.
    const el = document.createElement('snice-drawer') as any;
    el.setAttribute('open', '');
    document.body.appendChild(el);
    await el.ready;
    await wait(30);
    // happy-dom has a quirk where `document.body.style.overflow` returns ''
    // even after assignment; the inline `style` attribute does reflect the
    // change, so we read that instead.
    expect(document.body.getAttribute('style') || '').toContain('overflow: hidden');

    el.remove();
    await wait(30);
    expect(document.body.getAttribute('style') || '').not.toContain('overflow: hidden');
  });
});

// ---------------------------------------------------------------------------
// grid: transitionDuration parsed wrong for ms values.
// ---------------------------------------------------------------------------

describe('grid: transition-duration parsing handles ms and s units', () => {
  it('"200ms" parses to 200 (not 200000) via parseDuration', async () => {
    const { parseDuration } = await import('../../packages/core/src/index');
    expect(parseDuration('200ms').milliseconds()).toBe(200);
    expect(parseDuration('0.4s').milliseconds()).toBe(400);
  });
});
