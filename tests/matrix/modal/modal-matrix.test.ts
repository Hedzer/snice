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
 *                                          ───────────────────────────────
 *                                             60 combos
 *
 * "The 2^3 chrome vectors" are all combinations of `no-header`, `no-footer`
 * and `no-close-button` — the three switches that decide which documented
 * regions exist. The other three (`no-backdrop-dismiss`, `no-escape-dismiss`,
 * `no-focus-trap`) change BEHAVIOUR rather than structure, so they are crossed
 * against the routes they govern instead of against the layout.
 *
 * Sized to the component: a modal is a backdrop, a panel, three sections and
 * six switches. Sixty combos exhaust that. The four SIZES are paint, and the
 * one claim nothing here can see — that the backdrop really covers the page —
 * belongs to the visual tier (tests/live/matrix/modal/).
 */
import { describe, it, afterEach } from 'vitest';
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
