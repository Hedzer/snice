/**
 * snice-modal feature-combination matrix.
 *
 * Dimensions (docs/ai/components/modal.md + the .types.ts contract):
 *
 *   size x the 2^3 chrome vectors      4 x 8 = 32  structure
 *   the open/close lifecycle                =  8  events, scroll lock, aria
 *   dismissal routes                        = 10  backdrop / Escape / button
 *   the focus contract                      =  6  trap, first focus, restore
 *   runtime reconfiguration                 =  4
 *   top-layer popover path + fallback       =  5  Popover API stubbed
 *   container: inset mechanism + teardown   =  6  mechanism, not pixels
 *   public contract (topLayer, container)   =  1
 *                                          ───────────────────────────────
 *                                             72 combos
 *
 * "The 2^3 chrome vectors" are all combinations of `no-header`, `no-footer`
 * and `no-close-button` — the three switches that decide which documented
 * regions exist. The other three (`no-backdrop-dismiss`, `no-escape-dismiss`,
 * `no-focus-trap`) change BEHAVIOUR rather than structure, so they are crossed
 * against the routes they govern instead of against the layout.
 *
 * Sized to the component: a modal is a backdrop, a panel, three sections and
 * six switches. Seventy-two combos exhaust that. The four SIZES are paint,
 * and the one claim nothing here can see — that the backdrop really covers
 * the page — belongs to the visual tier (tests/live/matrix/modal/).
 */
import { describe, it, afterEach, beforeEach, vi } from 'vitest';
import {
  Problems, captureEvents, click, cross, expectClean, removeComponent, wait,
} from '../matrix-kit';
import {
  BODY_TEXT, SIZES,
  type ModalSpec, backdropPart, bodyScrollLocked, checkModal, closePart, dialogOf,
  focusables, footerPart, headerPart, makeModal, panelPart, pressKey, projected,
  releaseBodyScroll, spec,
} from './modal-support';
import '../../../packages/components/src/modal/snice-modal';

let el: HTMLElement | null = null;
afterEach(() => {
  if (el) { removeComponent(el); el = null; }
  // A modal that never closed would leave the page unscrollable for the next
  // combo; the component clears this itself on dispose, and this is the guard
  // that a failure in one combo cannot silently poison the next.
  releaseBodyScroll();
  document.body.innerHTML = '';
});

async function mountModal(s: ModalSpec): Promise<HTMLElement> {
  el = await makeModal(s);
  return el;
}

// ── Structure: size x the three chrome switches ─────────────────────────────

describe('modal matrix: structure', () => {
  for (const combo of cross({ size: SIZES, chrome: [0, 1, 2, 3, 4, 5, 6, 7] })) {
    const noHeader = !!(combo.chrome & 1);
    const noFooter = !!(combo.chrome & 2);
    const noCloseButton = !!(combo.chrome & 4);
    const id = `${combo.size}/${['no-header', 'no-footer', 'no-close-button']
      .filter((_, i) => combo.chrome & (1 << i)).join('+') || 'full-chrome'}`;

    it(id, async () => {
      const s = spec({ size: combo.size, noHeader, noFooter, noCloseButton });
      const modal = await mountModal(s);
      const problems = new Problems();

      checkModal(modal, s, problems);

      expectClean(problems, id);
    });
  }
});

// ── The open/close lifecycle ────────────────────────────────────────────────

describe('modal matrix: lifecycle', () => {
  for (const combo of cross({ route: ['show()', 'open=true'] as const })) {
    it(`${combo.id} opens the modal and announces it`, async () => {
      const modal = await mountModal(spec());
      const problems = new Problems();
      const opened = captureEvents<{ modal: HTMLElement }>(modal, 'modal-open');
      const closed = captureEvents<{ modal: HTMLElement }>(modal, 'modal-close');

      problems.check(!bodyScrollLocked(), 'a closed modal has already locked the page');

      if (combo.route === 'show()') (modal as any).show(); else (modal as any).open = true;
      await wait(30);

      problems.equal((modal as any).open, true, 'open property');
      // Documented: `modal-open` → `{ modal: SniceModalElement }`.
      problems.equal(opened.length, 1, 'modal-open event count');
      problems.equal(opened[0]?.modal, modal, 'modal-open detail.modal');
      problems.equal(closed.length, 0, 'modal-close events from an opening modal');
      // Documented: "Body scroll locked while open."
      problems.check(bodyScrollLocked(), 'an open modal did not lock body scroll');
      problems.equal(dialogOf(modal)?.getAttribute('aria-hidden'), 'false', 'aria-hidden');

      expectClean(problems, `${combo.id}/open`);
    });

    it(`${combo.id === 'route=show()' ? 'close()' : 'open=false'} closes it again`, async () => {
      const modal = await mountModal(spec({ open: true }));
      const problems = new Problems();
      const closed = captureEvents<{ modal: HTMLElement }>(modal, 'modal-close');

      if (combo.route === 'show()') (modal as any).close(); else (modal as any).open = false;
      await wait(30);

      problems.equal((modal as any).open, false, 'open property');
      problems.equal(closed.length, 1, 'modal-close event count');
      problems.equal(closed[0]?.modal, modal, 'modal-close detail.modal');
      // Documented: the lock belongs to the open state.
      problems.check(!bodyScrollLocked(), 'a closed modal left body scroll locked');
      problems.equal(dialogOf(modal)?.getAttribute('aria-hidden'), 'true', 'aria-hidden');

      expectClean(problems, `${combo.id}/close`);
    });
  }

  it('a modal authored open starts open and locked', async () => {
    const s = spec({ open: true });
    const modal = await mountModal(s);
    const problems = new Problems();

    checkModal(modal, s, problems);
    problems.check(bodyScrollLocked(), 'a modal authored open did not lock body scroll');

    expectClean(problems, 'authored open');
  });

  it('closing a modal that is already closed announces nothing', async () => {
    const modal = await mountModal(spec());
    const problems = new Problems();
    const closed = captureEvents(modal, 'modal-close');

    (modal as any).close();
    await wait(30);

    problems.equal(closed.length, 0, 'modal-close events from an already-closed modal');

    expectClean(problems, 'redundant close');
  });

  it('opening a modal that is already open announces nothing', async () => {
    const modal = await mountModal(spec({ open: true }));
    const problems = new Problems();
    const opened = captureEvents(modal, 'modal-open');

    (modal as any).show();
    await wait(30);

    problems.equal(opened.length, 0, 'modal-open events from an already-open modal');

    expectClean(problems, 'redundant open');
  });

  it('a full open/close/open round trip repeats exactly', async () => {
    const modal = await mountModal(spec());
    const problems = new Problems();
    const opened = captureEvents(modal, 'modal-open');
    const closed = captureEvents(modal, 'modal-close');

    for (let i = 0; i < 2; i++) {
      (modal as any).show();
      await wait(30);
      problems.check(bodyScrollLocked(), `round ${i}: open did not lock body scroll`);
      (modal as any).close();
      await wait(30);
      problems.check(!bodyScrollLocked(), `round ${i}: close did not release body scroll`);
      problems.equal(projected(modal), BODY_TEXT, `round ${i}: the body survived`);
    }

    problems.equal(opened.length, 2, 'modal-open count over two round trips');
    problems.equal(closed.length, 2, 'modal-close count over two round trips');

    expectClean(problems, 'round trips');
  });

  it('removing an open modal releases the page', async () => {
    const modal = await mountModal(spec({ open: true }));
    const problems = new Problems();
    problems.check(bodyScrollLocked(), 'an open modal did not lock body scroll');

    removeComponent(modal);
    el = null;
    await wait(30);

    problems.check(!bodyScrollLocked(), 'removing an open modal left the page unscrollable');

    expectClean(problems, 'teardown');
  });
});

// ── Dismissal ───────────────────────────────────────────────────────────────

describe('modal matrix: dismissal', () => {
  for (const combo of cross({ blocked: [false, true] })) {
    it(`backdrop click${combo.blocked ? ' with no-backdrop-dismiss' : ''}`, async () => {
      const modal = await mountModal(spec({ open: true, noBackdropDismiss: combo.blocked }));
      const problems = new Problems();
      const closed = captureEvents(modal, 'modal-close');

      click(backdropPart(modal));
      await wait(30);

      // Documented: the backdrop dismisses, unless `no-backdrop-dismiss`.
      problems.equal((modal as any).open, combo.blocked, 'open after a backdrop click');
      problems.equal(closed.length, combo.blocked ? 0 : 1, 'modal-close count');

      expectClean(problems, `backdrop/${combo.blocked}`);
    });

    it(`Escape${combo.blocked ? ' with no-escape-dismiss' : ''}`, async () => {
      const modal = await mountModal(spec({ open: true, noEscapeDismiss: combo.blocked }));
      const problems = new Problems();
      const closed = captureEvents(modal, 'modal-close');

      pressKey(modal, 'Escape');
      await wait(30);

      // Documented: "Escape closes (unless `no-escape-dismiss`)".
      problems.equal((modal as any).open, combo.blocked, 'open after Escape');
      problems.equal(closed.length, combo.blocked ? 0 : 1, 'modal-close count');

      expectClean(problems, `escape/${combo.blocked}`);
    });
  }

  it('the close button closes the modal', async () => {
    const modal = await mountModal(spec({ open: true }));
    const problems = new Problems();
    const closed = captureEvents(modal, 'modal-close');

    click(closePart(modal));
    await wait(30);

    problems.equal((modal as any).open, false, 'open after the close button');
    problems.equal(closed.length, 1, 'modal-close count');

    expectClean(problems, 'close button');
  });

  it('a click on the panel does not dismiss the modal', async () => {
    const modal = await mountModal(spec({ open: true }));
    const problems = new Problems();
    const closed = captureEvents(modal, 'modal-close');

    click(panelPart(modal));
    await wait(30);

    // The doc's dismissal is the BACKDROP, not the dialog itself: a click on
    // the content the user came for must not throw it away.
    problems.equal((modal as any).open, true, 'a panel click closed the modal');
    problems.equal(closed.length, 0, 'modal-close events from a panel click');

    expectClean(problems, 'panel click');
  });

  it('Escape on a closed modal does nothing', async () => {
    const modal = await mountModal(spec());
    const problems = new Problems();
    const closed = captureEvents(modal, 'modal-close');

    pressKey(modal, 'Escape');
    await wait(30);

    problems.equal(closed.length, 0, 'modal-close events from a closed modal');

    expectClean(problems, 'escape/closed');
  });

  it('an unrelated key never dismisses the modal', async () => {
    const modal = await mountModal(spec({ open: true }));
    const problems = new Problems();
    const closed = captureEvents(modal, 'modal-close');

    for (const key of ['Enter', ' ', 'a', 'ArrowDown']) pressKey(modal, key);
    await wait(30);

    problems.equal(closed.length, 0, 'modal-close events from unrelated keys');
    problems.equal((modal as any).open, true, 'an unrelated key closed the modal');

    expectClean(problems, 'unrelated keys');
  });

  it('a modal with no close button can still be dismissed the documented ways', async () => {
    const modal = await mountModal(spec({ open: true, noCloseButton: true }));
    const problems = new Problems();

    problems.check(closePart(modal) === null, 'no-close-button rendered a close button');
    pressKey(modal, 'Escape');
    await wait(30);
    problems.equal((modal as any).open, false, 'Escape did not close a button-less modal');

    expectClean(problems, 'no close button');
  });
});

// ── The focus contract ──────────────────────────────────────────────────────

describe('modal matrix: focus', () => {
  it('opening focuses the first focusable element inside the modal', async () => {
    const modal = await mountModal(spec());
    const problems = new Problems();

    (modal as any).show();
    // The focus pass is scheduled on a frame, so this waits past one.
    await wait(60);

    const first = focusables(modal)[0];
    problems.check(first !== undefined, 'the modal contains nothing focusable');
    if (first) {
      const active = (modal.shadowRoot as any)?.activeElement ?? document.activeElement;
      problems.check(
        active === first || first.contains(active as Node),
        `focus landed on <${(active as Element)?.tagName?.toLowerCase() ?? 'nothing'}>`
        + ` instead of the first focusable <${first.tagName.toLowerCase()}>`,
      );
    }

    expectClean(problems, 'first focus');
  });

  it('closing restores the focus the opener had', async () => {
    const opener = document.createElement('button');
    opener.textContent = 'Open';
    document.body.appendChild(opener);
    const modal = await mountModal(spec());
    const problems = new Problems();

    opener.focus();
    problems.equal(document.activeElement, opener, 'the opener did not take focus');

    (modal as any).show();
    await wait(60);
    (modal as any).close();
    await wait(60);

    // Documented: "previous focus restored on close".
    problems.equal(document.activeElement, opener, 'focus was not restored to the opener');

    expectClean(problems, 'focus restore');
  });

  for (const combo of cross({ noFocusTrap: [false, true], shift: [false, true] })) {
    it(`Tab${combo.shift ? '+Shift' : ''}${combo.noFocusTrap ? ' with no-focus-trap' : ''}`, async () => {
      const modal = await mountModal(spec({ open: true, noFocusTrap: combo.noFocusTrap }));
      const problems = new Problems();

      const nodes = focusables(modal);
      problems.check(nodes.length >= 2, `the modal has ${nodes.length} focusable nodes`);
      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      // Park focus on the edge the trap is supposed to wrap FROM.
      (combo.shift ? first : last)?.focus();
      pressKey(modal, 'Tab', { shiftKey: combo.shift });
      await wait(30);

      const active = (modal.shadowRoot as any)?.activeElement ?? document.activeElement;
      if (combo.noFocusTrap) {
        // Documented: `no-focus-trap` DISABLES the trap, so nothing is moved.
        problems.equal(active, combo.shift ? first : last, 'no-focus-trap moved focus anyway');
      } else {
        // Documented: "Tab/Shift+Tab cycle focus within modal".
        problems.equal(active, combo.shift ? last : first, 'the trap did not wrap focus');
      }

      expectClean(problems, `tab/${combo.id}`);
    });
  }
});

// ── Runtime reconfiguration ─────────────────────────────────────────────────

describe('modal matrix: reconfiguration', () => {
  it('switching size keeps every documented region', async () => {
    const s = spec({ open: true });
    const modal = await mountModal(s);
    const problems = new Problems();

    for (const size of SIZES) {
      (modal as any).size = size;
      await wait(30);
      checkModal(modal, { ...s, size }, problems);
    }

    expectClean(problems, 'size switching');
  });

  it('turning no-header on takes the header and its close button away', async () => {
    const modal = await mountModal(spec({ open: true }));
    const problems = new Problems();

    problems.check(headerPart(modal) !== null, 'no header to begin with');
    problems.check(closePart(modal) !== null, 'no close button to begin with');

    (modal as any).noHeader = true;
    await wait(30);
    problems.check(headerPart(modal) === null, 'no-header left the header behind');
    problems.check(closePart(modal) === null, 'a header-less modal still paints a close button');

    (modal as any).noHeader = false;
    await wait(30);
    problems.check(headerPart(modal) !== null, 'the header did not come back');
    problems.check(closePart(modal) !== null, 'the close button did not come back');

    expectClean(problems, 'no-header toggling');
  });

  it('turning no-footer on and off takes the footer and gives it back', async () => {
    const modal = await mountModal(spec({ open: true }));
    const problems = new Problems();

    problems.check(footerPart(modal) !== null, 'no footer to begin with');
    (modal as any).noFooter = true;
    await wait(30);
    problems.check(footerPart(modal) === null, 'no-footer left the footer behind');
    (modal as any).noFooter = false;
    await wait(30);
    problems.check(footerPart(modal) !== null, 'the footer did not come back');

    expectClean(problems, 'no-footer toggling');
  });

  it('changing the label moves the accessible name', async () => {
    const modal = await mountModal(spec({ open: true }));
    const problems = new Problems();

    (modal as any).label = 'Delete everything?';
    await wait(30);
    problems.equal(dialogOf(modal)?.getAttribute('aria-label'), 'Delete everything?', 'aria-label');

    // Documented: a non-empty accessible name, always — even with no label.
    (modal as any).label = '';
    await wait(30);
    problems.check(
      (dialogOf(modal)?.getAttribute('aria-label') ?? '').length > 0,
      'clearing the label left the dialog with no accessible name',
    );

    expectClean(problems, 'label changes');
  });
});

// ── top-layer: the Popover API path ─────────────────────────────────────────

// happy-dom (the matrix environment) predates the Popover API, so
// `showPopover`/`hidePopover` are stubbed ONTO `HTMLElement.prototype` for this
// block only. The component feature-detects PER OVERLAY at show time
// (`typeof overlay.showPopover !== 'function'` in showOverlay), so a prototype
// stub present when the modal opens exercises the real top-layer branch — the
// import order does not matter. The stub records calls and flips a
// `_popoverOpen` flag on the overlay so the tests can watch the show/hide
// sequence, and it is deleted again in `afterEach` so the fallback path below
// runs on the happy-dom-natural ground.
let popoverShowCalls = 0;
let popoverHideCalls = 0;
let popoverStubInstalled = false;

function installPopoverStub() {
  if (popoverStubInstalled) return;
  popoverStubInstalled = true;
  popoverShowCalls = 0;
  popoverHideCalls = 0;
  const proto = HTMLElement.prototype as Record<string, unknown>;
  proto.showPopover = function (this: HTMLElement) {
    popoverShowCalls++;
    (this as Record<string, unknown>)._popoverOpen = true;
  };
  proto.hidePopover = function (this: HTMLElement) {
    popoverHideCalls++;
    (this as Record<string, unknown>)._popoverOpen = false;
  };
}

function removePopoverStub() {
  if (!popoverStubInstalled) return;
  popoverStubInstalled = false;
  popoverShowCalls = 0;
  popoverHideCalls = 0;
  const proto = HTMLElement.prototype as Record<string, unknown>;
  delete proto.showPopover;
  delete proto.hidePopover;
}

describe('modal matrix: top-layer — popover path', () => {
  beforeEach(installPopoverStub);
  afterEach(removePopoverStub);

  it('opening lifts the overlay into the top layer via showPopover()', async () => {
    const modal = await mountModal(spec({ topLayer: true }));
    const problems = new Problems();
    const overlay = dialogOf(modal);

    (modal as any).show();
    await wait(40);

    // Documented: with `top-layer` the overlay is a native manual popover.
    problems.equal(overlay?.getAttribute('popover'), 'manual', 'popover attribute');
    problems.equal(popoverShowCalls, 1, 'showPopover() calls');
    problems.check(
      (overlay as any)?._popoverOpen === true,
      'the overlay is not flagged open after showPopover()',
    );
    problems.check(bodyScrollLocked(), 'a top-layer open did not lock body scroll');

    expectClean(problems, 'top-layer/open');
  });

  it('closing defers hidePopover() until the close transition has run', async () => {
    const modal = await mountModal(spec({ topLayer: true, open: true }));
    const problems = new Problems();
    const overlay = dialogOf(modal);

    problems.equal(popoverShowCalls, 1, 'showPopover() calls on an authored-open modal');

    (modal as any).close();
    await wait(30);
    // The UA applies display:none to a hidden popover, which would kill the
    // fade/scale-out transition, so the hide waits out the transition
    // duration (default `--modal-transition-duration: 260ms` + 80ms delay)
    // first.
    problems.equal(popoverHideCalls, 0, 'hidePopover() ran before the transition');
    problems.check(
      (overlay as any)?._popoverOpen === true,
      'the overlay was hidden before the transition',
    );

    await wait(400);
    problems.equal(popoverHideCalls, 1, 'hidePopover() never ran after the transition');
    problems.check(
      (overlay as any)?._popoverOpen === false,
      'the overlay is still flagged open after the deferred hide',
    );

    expectClean(problems, 'top-layer/close');
  });

  it('open→close→open cycles repeat exactly: events, scroll lock, focus', async () => {
    const opener = document.createElement('button');
    opener.textContent = 'Open';
    document.body.appendChild(opener);
    const modal = await mountModal(spec({ topLayer: true }));
    const problems = new Problems();
    const opened = captureEvents<{ modal: HTMLElement }>(modal, 'modal-open');
    const closed = captureEvents<{ modal: HTMLElement }>(modal, 'modal-close');

    opener.focus();
    for (let i = 0; i < 2; i++) {
      (modal as any).show();
      await wait(40);
      problems.equal(popoverShowCalls, i + 1, `round ${i}: showPopover() count`);
      problems.check(bodyScrollLocked(), `round ${i}: open did not lock body scroll`);
      (modal as any).close();
      await wait(400);
      problems.equal(popoverHideCalls, i + 1, `round ${i}: hidePopover() count`);
      problems.check(!bodyScrollLocked(), `round ${i}: close did not release body scroll`);
    }

    problems.equal(opened.length, 2, 'modal-open count over two round trips');
    problems.equal(closed.length, 2, 'modal-close count over two round trips');
    // Documented: previous focus restored on close.
    problems.equal(document.activeElement, opener, 'focus was not restored to the opener');

    expectClean(problems, 'top-layer/cycles');
  });

  it('a reopen inside the transition window cancels the deferred hide', async () => {
    const modal = await mountModal(spec({ topLayer: true }));
    const problems = new Problems();
    const overlay = dialogOf(modal);

    (modal as any).show();
    await wait(40);
    (modal as any).close();
    (modal as any).show(); // back inside the 260ms + 80ms transition window
    await wait(400);

    // The deferred hide checks `open` again before hiding — a modal that
    // reopens mid-transition must stay visible.
    problems.equal(popoverShowCalls, 2, 'showPopover() count across the reopen');
    problems.equal(popoverHideCalls, 0, 'the deferred hide fired on a reopened modal');
    problems.check(
      (overlay as any)?._popoverOpen === true,
      'the reopened overlay was hidden',
    );

    (modal as any).close();
    await wait(400);
    problems.equal(popoverHideCalls, 1, 'the final close never hid the popover');
    problems.check(
      (overlay as any)?._popoverOpen === false,
      'the overlay is still flagged open after the final close',
    );

    expectClean(problems, 'top-layer/reopen');
  });
});

// ── top-layer: the class-only fallback (the happy-dom-natural path) ─────────

// No popover stub here: with `showPopover`/`hidePopover` absent from
// `HTMLElement.prototype` the component must degrade to exactly today's
// behavior — the class toggle alone, no popover attribute, no exceptions. That
// is the path every pre-Popover engine runs, and the path a `top-layer`-less
// modal runs on every engine.
describe('modal matrix: top-layer — class-only fallback', () => {
  it('opens and closes via the class toggle when the popover API is missing', async () => {
    const modal = await mountModal(spec({ topLayer: true }));
    const problems = new Problems();
    const overlay = dialogOf(modal);
    const opened = captureEvents(modal, 'modal-open');
    const closed = captureEvents(modal, 'modal-close');

    (modal as any).show();
    await wait(40);
    problems.check(
      overlay?.classList.contains('modal--open') === true,
      'the overlay did not gain modal--open',
    );
    problems.equal(overlay?.getAttribute('popover'), null, 'a popover attribute was set without the API');
    problems.check(bodyScrollLocked(), 'a fallback open did not lock body scroll');
    problems.equal(opened.length, 1, 'modal-open count');

    (modal as any).close();
    await wait(40);
    problems.check(
      overlay?.classList.contains('modal--open') === false,
      'the overlay kept modal--open after the fallback close',
    );
    problems.check(!bodyScrollLocked(), 'a fallback close did not release body scroll');
    problems.equal(closed.length, 1, 'modal-close count');
    problems.equal(popoverShowCalls, 0, 'the popover stub leaked into the fallback path');
    problems.equal(popoverHideCalls, 0, 'the popover stub leaked into the fallback path');

    expectClean(problems, 'top-layer/fallback');
  });
});

// ── container: pinning the overlay to a container's box ─────────────────────

// happy-dom does no layout, so every `getBoundingClientRect` reads zero unless
// the test supplies a rect. These tests give the container a KNOWN rect and
// assert the MECHANISM — the inset string the overlay gets (and the formula it
// encodes), the `.modal--container` class, which listeners are attached and
// detached — never pixel truth. Real geometry is the visual tier's job
// (tests/live/matrix/modal/).
//
// One timing note that shapes the class assertions below: snice runs property
// watchers synchronously and commits the re-render on a microtask
// (packages/core/src/element.ts). The `modal--container` class is part of the
// template class computation (a `containerActive` property), so it lands with
// the open render's commit — a microtask after `show()` — and is durable after
// re-renders and re-measures (resize/scroll/container-change). The class is
// therefore asserted after a settle wait. The inset is template-owned by
// neither side; `measureContainerBounds` applies it synchronously, so it is
// asserted right after `show()` and again after settle.
interface BoxRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

function makeContainer(id: string, r: BoxRect): HTMLElement {
  const box = document.createElement('div');
  box.id = id;
  box.getBoundingClientRect = (() => ({
    top: r.top, right: r.right, bottom: r.bottom, left: r.left,
    width: r.right - r.left, height: r.bottom - r.top, x: r.left, y: r.top,
    toJSON: () => ({}),
  })) as unknown as HTMLElement['getBoundingClientRect'];
  document.body.appendChild(box);
  return box;
}

function setRect(el: HTMLElement, r: BoxRect): void {
  el.getBoundingClientRect = (() => ({
    top: r.top, right: r.right, bottom: r.bottom, left: r.left,
    width: r.right - r.left, height: r.bottom - r.top, x: r.left, y: r.top,
    toJSON: () => ({}),
  })) as unknown as HTMLElement['getBoundingClientRect'];
}

/** The viewport-edge distances `measureContainerBounds` must encode. */
function expectedInset(r: BoxRect): string {
  return `${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px`;
}

describe('modal matrix: container', () => {
  afterEach(() => vi.restoreAllMocks());

  it('a string selector pins the overlay to the container box', async () => {
    makeContainer('main', { top: 40, right: 400, bottom: 300, left: 20 });
    const modal = await mountModal(spec({ container: '#main' }));
    const problems = new Problems();
    const overlay = dialogOf(modal);

    problems.equal((modal as any).container, '#main', 'container read back');

    (modal as any).show();
    problems.check(overlay !== null, 'no overlay to pin');
    if (overlay) {
      // Synchronous watcher output: the inset is applied by
      // `measureContainerBounds` before the open render commits; the
      // `modal--container` class is template-owned and lands with the commit.
      problems.equal(overlay.style.inset, expectedInset({ top: 40, right: 400, bottom: 300, left: 20 }), 'inset');
    }
    await wait(40);
    problems.check(overlay?.classList.contains('modal--container'), 'no modal--container class');
    problems.check(bodyScrollLocked(), 'a container open did not lock body scroll');
    problems.equal(
      overlay?.style.inset, expectedInset({ top: 40, right: 400, bottom: 300, left: 20 }),
      'inset after settle',
    );

    expectClean(problems, 'container/selector');
  });

  it('an Element value pins the overlay to that element box', async () => {
    const box = makeContainer('zone', { top: 0, right: 512, bottom: 384, left: 0 });
    const modal = await mountModal(spec());
    const problems = new Problems();
    const overlay = dialogOf(modal);

    (modal as any).container = box;
    problems.equal((modal as any).container, box, 'container read back');

    (modal as any).show();
    if (overlay) {
      problems.equal(overlay.style.inset, expectedInset({ top: 0, right: 512, bottom: 384, left: 0 }), 'inset');
    }
    await wait(40);
    problems.check(overlay?.classList.contains('modal--container'), 'no modal--container class');
    problems.equal(
      overlay?.style.inset, expectedInset({ top: 0, right: 512, bottom: 384, left: 0 }),
      'inset after settle',
    );

    expectClean(problems, 'container/element');
  });

  it('an unresolvable selector warns and falls back to the viewport', async () => {
    const modal = await mountModal(spec({ container: '#missing' }));
    const problems = new Problems();
    const overlay = dialogOf(modal);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    (modal as any).show();
    await wait(40);

    problems.equal(warn.mock.calls.length, 1, 'console.warn count');
    problems.equal(
      warn.mock.calls[0]?.[0],
      'snice-modal: container "#missing" not found; falling back to the viewport',
      'the warning message',
    );
    // Falsy: happy-dom reads an unassigned inline style as `undefined`,
    // browsers as `''` — both mean "spans the viewport".
    problems.check(!overlay?.style.inset, 'an inset was applied to a viewport-fallback overlay');
    problems.check(
      overlay?.classList.contains('modal--container') === false,
      'modal--container on a viewport-fallback overlay',
    );
    problems.check(bodyScrollLocked(), 'a viewport-fallback open did not lock body scroll');
    warn.mockRestore();

    expectClean(problems, 'container/unresolved');
  });

  it('window resize, container scroll and container change re-measure while open', async () => {
    const box = makeContainer('live', { top: 10, right: 500, bottom: 400, left: 30 });
    const modal = await mountModal(spec());
    const problems = new Problems();
    const overlay = dialogOf(modal);

    (modal as any).container = box;
    (modal as any).show();
    await wait(40);

    // A window resize re-measures; with no pending render the class survives —
    // the durable form of the mechanism.
    setRect(box, { top: 0, right: 900, bottom: 700, left: 0 });
    window.dispatchEvent(new Event('resize'));
    await wait(30);
    problems.equal(
      overlay?.style.inset, expectedInset({ top: 0, right: 900, bottom: 700, left: 0 }),
      'inset after a window resize',
    );
    problems.check(
      overlay?.classList.contains('modal--container') === true,
      'no modal--container after a resize re-measure',
    );

    // Scrolling the container re-measures (the listener is capture-phase).
    setRect(box, { top: 40, right: 400, bottom: 300, left: 20 });
    box.dispatchEvent(new Event('scroll', { bubbles: true }));
    await wait(30);
    problems.equal(
      overlay?.style.inset, expectedInset({ top: 40, right: 400, bottom: 300, left: 20 }),
      'inset after a container scroll',
    );
    problems.check(
      overlay?.classList.contains('modal--container') === true,
      'no modal--container after a scroll re-measure',
    );

    // Re-pointing `container` while open re-observes and re-measures.
    const other = makeContainer('other', { top: 100, right: 800, bottom: 600, left: 100 });
    (modal as any).container = other;
    await wait(30);
    problems.equal((modal as any).container, other, 'container read back after change');
    problems.equal(
      overlay?.style.inset, expectedInset({ top: 100, right: 800, bottom: 600, left: 100 }),
      'inset after a container change',
    );
    problems.check(
      overlay?.classList.contains('modal--container') === true,
      'no modal--container after a container change',
    );

    expectClean(problems, 'container/re-measure');
  });

  it('container tracking is torn down on close', async () => {
    const box = makeContainer('tracked', { top: 0, right: 512, bottom: 384, left: 0 });
    const modal = await mountModal(spec());
    const problems = new Problems();
    const overlay = dialogOf(modal);

    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect');
    const windowAdd = vi.spyOn(window, 'addEventListener');
    const windowRemove = vi.spyOn(window, 'removeEventListener');
    const boxAdd = vi.spyOn(box, 'addEventListener');
    const boxRemove = vi.spyOn(box, 'removeEventListener');

    (modal as any).container = box;
    (modal as any).show();
    await wait(40);

    const resizeAdds = windowAdd.mock.calls.filter(call => call[0] === 'resize').length;
    const scrollAdds = boxAdd.mock.calls.filter(call => call[0] === 'scroll').length;
    problems.check(resizeAdds >= 1, 'no window resize listener while open');
    problems.check(scrollAdds >= 1, 'no container scroll listener while open');
    problems.check(
      boxAdd.mock.calls.every(call => call[0] !== 'scroll' || call[2] === true),
      'the scroll listener is not capture-phase',
    );
    problems.equal(observe.mock.calls[0]?.[0], box, 'the container was not observed');

    (modal as any).close();
    await wait(40);

    // Teardown is IMMEDIATE only for the listeners and the observer — they
    // must never fire mid-transition — while the container geometry (inline
    // inset + `.modal--container`) survives the whole exit window so the
    // overlay stays pinned to the container's box and the panel cannot
    // re-center mid-fade (F1).
    problems.equal(
      overlay?.style.inset, expectedInset({ top: 0, right: 512, bottom: 384, left: 0 }),
      'inset cleared before the exit transition',
    );
    problems.check(
      overlay?.classList.contains('modal--container') === true,
      'modal--container dropped before the exit transition',
    );
    problems.check(
      windowRemove.mock.calls.filter(call => call[0] === 'resize').length >= resizeAdds,
      'the window resize listener was not removed',
    );
    problems.check(
      boxRemove.mock.calls.filter(call => call[0] === 'scroll').length >= scrollAdds,
      'the container scroll listener was not removed',
    );
    problems.check(disconnect.mock.calls.length >= 1, 'the ResizeObserver was not disconnected');

    // Only after the transition window does the deferred half land.
    await wait(400);
    problems.equal(overlay?.style.inset, '', 'inset left on the closed overlay');
    problems.check(
      overlay?.classList.contains('modal--container') === false,
      'modal--container left on the closed overlay',
    );

    expectClean(problems, 'container/teardown');
  });

  it('a container adopted while closed applies on the next open', async () => {
    const box = makeContainer('later', { top: 20, right: 600, bottom: 500, left: 40 });
    const modal = await mountModal(spec());
    const problems = new Problems();
    const overlay = dialogOf(modal);

    (modal as any).container = box;
    await wait(30);
    // Falsy: happy-dom reads an unassigned inline style as `undefined`,
    // browsers as `''` — both mean "no constraint while closed".
    problems.check(!overlay?.style.inset, 'an inset was applied while closed');

    (modal as any).show();
    if (overlay) {
      problems.check(
        overlay.classList.contains('modal--container') === false,
        'modal--container before the open render commit',
      );
    }
    await wait(40);
    problems.check(overlay?.classList.contains('modal--container'), 'no modal--container class after commit');
    problems.equal(
      overlay?.style.inset, expectedInset({ top: 20, right: 600, bottom: 500, left: 40 }),
      'inset on open',
    );

    expectClean(problems, 'container/late-adoption');
  });
});

// ── public contract: the two new members ────────────────────────────────────

// The DOM matrix guards the VALUE truth of the documented surface. These two
// members are new, so the contract itself gets a guard: the element must
// expose `topLayer: boolean` and `container?: string | Element` exactly as
// `snice-modal.types.ts` declares them.
describe('modal matrix: public contract', () => {
  it('the element exposes topLayer and container per the types contract', async () => {
    const modal = await mountModal(spec());
    const problems = new Problems();

    problems.check('topLayer' in modal, "'topLayer' is not on the element");
    problems.equal(typeof (modal as any).topLayer, 'boolean', 'topLayer type');
    problems.check('container' in modal, "'container' is not on the element");
    problems.check(
      (modal as any).container === undefined,
      'container default is not the documented empty value',
    );

    // The attribute spellings the docs promise: `top-layer` and `container`.
    const attrModal = document.createElement('snice-modal');
    attrModal.setAttribute('top-layer', '');
    attrModal.setAttribute('container', '.main');
    document.body.appendChild(attrModal);
    await (attrModal as any).ready;
    await wait(30);
    problems.equal((attrModal as any).topLayer, true, 'top-layer attribute');
    problems.equal((attrModal as any).container, '.main', 'container attribute');

    expectClean(problems, 'contract');
  });
});
