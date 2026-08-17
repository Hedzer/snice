/**
 * Smoke slice of the snice-modal matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/modal/, 60 combos) is excluded from the default
 * Vitest include and runs via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and every assertion routes through the
 * matrix's own oracle.
 *
 * The marquee: the fully-chromed dialog, the open/close lifecycle with its two
 * events and its scroll lock, the three dismissal routes, and the focus trap.
 *
 * BUDGET: under 1s.
 */
import { describe, it, afterEach } from 'vitest';
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
});
