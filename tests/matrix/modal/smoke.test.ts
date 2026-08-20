/**
 * Smoke slice of the snice-modal matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/modal/, 72 combos) is excluded from the default
 * Vitest include and runs via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and every assertion routes through the
 * matrix's own oracle.
 *
 * The marquee: the fully-chromed dialog, the open/close lifecycle with its two
 * events and its scroll lock, the three dismissal routes, and the focus trap.
 *
 * BUDGET: under 1s.
 */
import { describe, it, afterEach, beforeEach } from 'vitest';
import {
  Problems, captureEvents, click, expectClean, removeComponent, wait,
} from '../matrix-kit';
import {
  backdropPart, bodyScrollLocked, checkModal, closePart, dialogOf, focusables,
  makeModal, pressKey, releaseBodyScroll, spec,
} from './modal-support';
import '../../../packages/components/src/modal/snice-modal';

let el: HTMLElement | null = null;
afterEach(() => {
  if (el) { removeComponent(el); el = null; }
  releaseBodyScroll();
  document.body.innerHTML = '';
});

describe('modal matrix smoke', () => {
  it('a fully-chromed dialog renders every documented region', async () => {
    const s = spec({ size: 'large' });
    el = await makeModal(s);
    const problems = new Problems();

    checkModal(el, s, problems);

    expectClean(problems, 'smoke/full');
  });

  it('show() and close() announce themselves and move the scroll lock', async () => {
    el = await makeModal(spec());
    const problems = new Problems();
    const opened = captureEvents<{ modal: HTMLElement }>(el, 'modal-open');
    const closed = captureEvents<{ modal: HTMLElement }>(el, 'modal-close');

    (el as any).show();
    await wait(30);
    problems.equal(opened.length, 1, 'modal-open count');
    problems.equal(opened[0]?.modal, el, 'modal-open detail.modal');
    problems.check(bodyScrollLocked(), 'an open modal did not lock body scroll');
    problems.equal(dialogOf(el)?.getAttribute('aria-hidden'), 'false', 'aria-hidden');

    (el as any).close();
    await wait(30);
    problems.equal(closed.length, 1, 'modal-close count');
    problems.check(!bodyScrollLocked(), 'a closed modal left body scroll locked');

    expectClean(problems, 'smoke/lifecycle');
  });

  it('the backdrop, Escape and the close button all dismiss', async () => {
    const problems = new Problems();

    for (const route of ['backdrop', 'escape', 'button'] as const) {
      if (el) { removeComponent(el); el = null; }
      releaseBodyScroll();
      el = await makeModal(spec({ open: true }));

      if (route === 'backdrop') click(backdropPart(el));
      else if (route === 'escape') pressKey(el, 'Escape');
      else click(closePart(el));
      await wait(30);

      problems.equal((el as any).open, false, `the ${route} route did not close the modal`);
    }

    expectClean(problems, 'smoke/dismiss');
  });

  it('the no-* switches block the routes they name', async () => {
    const problems = new Problems();

    el = await makeModal(spec({ open: true, noBackdropDismiss: true, noEscapeDismiss: true }));
    click(backdropPart(el));
    pressKey(el, 'Escape');
    await wait(30);
    problems.equal((el as any).open, true, 'a blocked modal was dismissed anyway');

    expectClean(problems, 'smoke/blocked');
  });

  it('Tab wraps inside the trap, and no-focus-trap lets it go', async () => {
    const problems = new Problems();

    el = await makeModal(spec({ open: true }));
    let nodes = focusables(el);
    nodes[nodes.length - 1]?.focus();
    pressKey(el, 'Tab');
    await wait(30);
    let active = (el.shadowRoot as any)?.activeElement ?? document.activeElement;
    problems.equal(active, nodes[0], 'Tab did not wrap to the first focusable');

    removeComponent(el);
    releaseBodyScroll();
    el = await makeModal(spec({ open: true, noFocusTrap: true }));
    nodes = focusables(el);
    nodes[nodes.length - 1]?.focus();
    pressKey(el, 'Tab');
    await wait(30);
    active = (el.shadowRoot as any)?.activeElement ?? document.activeElement;
    problems.equal(active, nodes[nodes.length - 1], 'no-focus-trap moved focus anyway');

    expectClean(problems, 'smoke/focus');
  });

  // ── the new feature families, one combo each ──────────────────────────────
  //
  // The matrix's top-layer block stubs `showPopover`/`hidePopover` onto
  // `HTMLElement.prototype`; the smoke slice needs the same seam in
  // miniature. The component feature-detects PER OVERLAY at show time
  // (`typeof overlay.showPopover !== 'function'` in showOverlay), so a
  // prototype stub present when the modal opens exercises the real
  // top-layer branch. Removed again in the afterEach below.
  let smokeShowCalls = 0;
  let smokeHideCalls = 0;
  let smokeStubInstalled = false;

  function installPopoverStub() {
    if (smokeStubInstalled) return;
    smokeStubInstalled = true;
    smokeShowCalls = 0;
    smokeHideCalls = 0;
    const proto = HTMLElement.prototype as Record<string, unknown>;
    proto.showPopover = function (this: HTMLElement) {
      smokeShowCalls++;
      (this as Record<string, unknown>)._popoverOpen = true;
    };
    proto.hidePopover = function (this: HTMLElement) {
      smokeHideCalls++;
      (this as Record<string, unknown>)._popoverOpen = false;
    };
  }

  function removePopoverStub() {
    if (!smokeStubInstalled) return;
    smokeStubInstalled = false;
    smokeShowCalls = 0;
    smokeHideCalls = 0;
    const proto = HTMLElement.prototype as Record<string, unknown>;
    delete proto.showPopover;
    delete proto.hidePopover;
  }

  beforeEach(installPopoverStub);
  afterEach(removePopoverStub);

  it('top-layer lifts the overlay via showPopover() and defers hidePopover() past the close transition', async () => {
    el = await makeModal(spec({ topLayer: true, open: true }));
    const problems = new Problems();
    const overlay = dialogOf(el);

    problems.equal(smokeShowCalls, 1, 'showPopover() on an authored-open modal');
    problems.equal(overlay?.getAttribute('popover'), 'manual', 'popover attribute');
    problems.check((overlay as any)?._popoverOpen === true, 'the overlay is not flagged open');

    (el as any).close();
    await wait(40);
    problems.equal(smokeHideCalls, 0, 'hidePopover() ran before the transition');
    problems.check((overlay as any)?._popoverOpen === true, 'the overlay was hidden before the transition');

    await wait(400);
    problems.equal(smokeHideCalls, 1, 'hidePopover() never ran after the transition');
    problems.check((overlay as any)?._popoverOpen === false, 'the overlay is still flagged open after the deferred hide');

    expectClean(problems, 'smoke/top-layer');
  });

  it('container pins the overlay to the selector box and clears it only after the close transition', async () => {
    // happy-dom does no layout, so give the container a KNOWN rect and assert
    // the MECHANISM — the exact inset string the formula encodes — as the
    // matrix does. Geometry truth is the visual tier's job.
    const box = document.createElement('div');
    box.id = 'smoke-main';
    const rect = { top: 40, right: 400, bottom: 300, left: 20, width: 380, height: 260, x: 20, y: 40, toJSON: () => ({}) };
    box.getBoundingClientRect = (() => rect) as unknown as HTMLElement['getBoundingClientRect'];
    document.body.appendChild(box);
    const inset = `${rect.top}px ${window.innerWidth - rect.right}px ${window.innerHeight - rect.bottom}px ${rect.left}px`;

    el = await makeModal(spec({ container: '#smoke-main' }));
    const problems = new Problems();
    const overlay = dialogOf(el);

    (el as any).show();
    await wait(40);
    problems.equal(overlay?.style.inset, inset, 'inset on open');
    problems.check(overlay?.classList.contains('modal--container'), 'no modal--container class');

    (el as any).close();
    await wait(40);
    // The geometry survives the exit window so the panel cannot re-center
    // mid-fade (F1) — only the deferred half clears it afterwards.
    problems.equal(overlay?.style.inset, inset, 'inset cleared before the exit transition');
    problems.check(overlay?.classList.contains('modal--container'), 'modal--container dropped before the exit transition');

    await wait(400);
    problems.equal(overlay?.style.inset, '', 'inset left after the exit transition');
    problems.check(overlay?.classList.contains('modal--container') === false, 'modal--container left after the exit transition');

    expectClean(problems, 'smoke/container');
  });
});
