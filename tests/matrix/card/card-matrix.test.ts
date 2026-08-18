/**
 * snice-card feature-combination matrix.
 *
 * Dimensions (docs/ai/components/card.md + the .types.ts contract):
 *
 *   variant x size x slot set        3 x 3 x 4 = 36  structure
 *   all 2^3 state vectors                      =  8  role / tabindex / aria
 *   activation routes                          =  9  click, Enter, Space
 *   accent                                     =  6  the attribute-only axis
 *   runtime reconfiguration                    =  5
 *                                             ────────────────────────────
 *                                                64 combos
 *
 * Sized to the component: a card is a box with four slots and one switch that
 * turns it into a button. Sixty-four combos exhaust that surface — the six
 * paint axes (three variants, three sizes, five accents, and the ±3° cursor
 * tilt) are the visual tier's job (tests/live/matrix/card/).
 */
import { describe, it, afterEach } from 'vitest';
import {
  Problems, captureEvents, click, cross, expectClean, press, removeComponent, wait,
} from '../matrix-kit';
import {
  ACCENTS, SIZES, SLOT_SETS, VARIANTS,
  type CardSpec, basePart, bodyPart, checkCard, expectedRole, expectedTabIndex,
  footerPart, headerPart, makeCard, projected, shown, spec,
} from './card-support';
import '../../../packages/components/src/card/snice-card';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

async function mountCard(s: CardSpec, extra: Record<string, string> = {}): Promise<HTMLElement> {
  el = await makeCard(s, extra);
  return el;
}

// ── Structure: variant x size x slots ───────────────────────────────────────

describe('card matrix: structure', () => {
  for (const combo of cross({ variant: VARIANTS, size: SIZES, slots: SLOT_SETS })) {
    it(combo.id, async () => {
      const s = spec({ variant: combo.variant, size: combo.size, slots: combo.slots });
      const card = await mountCard(s);
      const problems = new Problems();

      checkCard(card, s, problems);
      // Appearance is presentation only: it may not add, remove or rename a
      // documented region.
      problems.equal((card as any).variant, combo.variant, 'variant property');
      problems.equal((card as any).size, combo.size, 'size property');

      expectClean(problems, combo.id);
    });
  }
});

// ── The three state switches, all 2^3 vectors ───────────────────────────────

describe('card matrix: states', () => {
  for (let bits = 0; bits < 8; bits++) {
    const s = spec({
      clickable: !!(bits & 1),
      selected: !!(bits & 2),
      disabled: !!(bits & 4),
      slots: 'all',
      image: true,
    });
    const id = ['clickable', 'selected', 'disabled']
      .filter((_, i) => bits & (1 << i)).join('+') || 'plain';

    it(id, async () => {
      const card = await mountCard(s);
      const problems = new Problems();

      checkCard(card, s, problems);
      problems.equal((card as any).clickable, s.clickable, 'clickable property');
      problems.equal((card as any).selected, s.selected, 'selected property');
      problems.equal((card as any).disabled, s.disabled, 'disabled property');

      expectClean(problems, id);
    });
  }

  /**
   * FINDING MATRIX-card-1 (fixed) — a plain card used to be dressed as a
   * button it is not.
   *
   * The doc's accessibility section promises "ARIA roles and states for
   * INTERACTIVE cards", and a card that is not `clickable` is documented as a
   * "Container for grouped content". The template nevertheless rendered
   * `aria-pressed="false"` on every card, including the ones whose role is
   * `article` — and `aria-pressed` is defined only for `button`,
   * `menuitemcheckbox`, `option`, `radio`, `switch` and `tab`. A screen reader
   * meeting an article that reports a pressed state announces a toggle nobody
   * can toggle. The attribute is now gated on `clickable`; the assertion runs
   * unpinned as a regression guard.
   */
  it('MATRIX-card-1 (fixed): a plain card carries no button-only ARIA state', async () => {
    const card = await mountCard(spec());
    const problems = new Problems();

    const base = basePart(card)!;
    problems.equal(base.getAttribute('role'), 'article', 'role');
    problems.check(
      !base.hasAttribute('aria-pressed'),
      `a role="article" card reports aria-pressed="${base.getAttribute('aria-pressed')}"`,
    );

    expectClean(problems, 'plain/aria');
  });
});

// ── Activation: the documented click and keyboard routes ────────────────────

describe('card matrix: activation', () => {
  for (const combo of cross({ route: ['click', 'Enter', ' '] as const })) {
    it(`${combo.id} toggles a clickable card`, async () => {
      const card = await mountCard(spec({ clickable: true }));
      const problems = new Problems();
      const seen = captureEvents<{ selected: boolean }>(card, 'card-click');
      const base = basePart(card);

      if (combo.route === 'click') click(base); else press(base, combo.route);
      await wait(30);

      // Documented: `card-click` → `{ selected: boolean }`.
      problems.equal(seen, [{ selected: true }], 'card-click detail');
      problems.equal((card as any).selected, true, 'selected after activation');
      problems.equal(basePart(card)?.getAttribute('aria-pressed'), 'true', 'aria-pressed');

      // …and activating again toggles back.
      if (combo.route === 'click') click(basePart(card)); else press(basePart(card), combo.route);
      await wait(30);
      problems.equal(seen.length, 2, 'card-click event count after two activations');
      problems.equal(seen[1], { selected: false }, 'the second card-click detail');
      problems.equal((card as any).selected, false, 'selected after the second activation');

      expectClean(problems, `${combo.id}/toggle`);
    });

    it(`${combo.id} does nothing to a disabled card`, async () => {
      const card = await mountCard(spec({ clickable: true, disabled: true }));
      const problems = new Problems();
      const seen = captureEvents(card, 'card-click');

      if (combo.route === 'click') click(basePart(card)); else press(basePart(card), combo.route);
      await wait(30);

      problems.equal(seen.length, 0, 'card-click events from a disabled card');
      problems.equal((card as any).selected, false, 'a disabled card changed its selection');
      // Documented: a disabled card is not keyboard reachable.
      problems.equal(basePart(card)?.getAttribute('tabindex'), '-1', 'tabindex');

      expectClean(problems, `${combo.id}/disabled`);
    });

    it(`${combo.id} does nothing to a plain card`, async () => {
      const card = await mountCard(spec());
      const problems = new Problems();
      const seen = captureEvents(card, 'card-click');

      if (combo.route === 'click') click(basePart(card)); else press(basePart(card), combo.route);
      await wait(30);

      problems.equal(seen.length, 0, 'card-click events from a card that is not clickable');
      problems.equal((card as any).selected, false, 'a plain card changed its selection');

      expectClean(problems, `${combo.id}/plain`);
    });
  }
});

// ── The attribute-only accent axis ──────────────────────────────────────────

describe('card matrix: accent', () => {
  for (const combo of cross({ accent: [undefined, ...ACCENTS] as const })) {
    it(`accent=${combo.accent ?? 'none'}`, async () => {
      const s = spec({ slots: 'all' });
      const card = await mountCard(s, combo.accent ? { accent: combo.accent } : {});
      const problems = new Problems();

      // Documented as an attribute-only presentation switch: it adds a rule
      // along the top edge and touches nothing else.
      checkCard(card, s, problems);
      problems.equal(card.getAttribute('accent'), combo.accent ?? null, 'accent attribute');

      expectClean(problems, `accent=${combo.accent ?? 'none'}`);
    });
  }
});

// ── Runtime reconfiguration ─────────────────────────────────────────────────

describe('card matrix: reconfiguration', () => {
  it('turning clickable on promotes the card to a control, and off demotes it', async () => {
    const card = await mountCard(spec({ slots: 'all' }));
    const problems = new Problems();

    problems.equal(basePart(card)?.getAttribute('role'), 'article', 'role while plain');

    (card as any).clickable = true;
    await wait(30);
    problems.equal(basePart(card)?.getAttribute('role'), 'button', 'role after clickable=true');
    problems.equal(basePart(card)?.getAttribute('tabindex'), '0', 'tabindex after clickable=true');

    (card as any).clickable = false;
    await wait(30);
    problems.equal(basePart(card)?.getAttribute('role'), 'article', 'role after clickable=false');
    problems.equal(basePart(card)?.getAttribute('tabindex'), '-1', 'tabindex after clickable=false');

    expectClean(problems, 'clickable toggling');
  });

  it('disabling a clickable card takes it out of the tab order and back', async () => {
    const card = await mountCard(spec({ clickable: true }));
    const problems = new Problems();
    const s = spec({ clickable: true });

    problems.equal(basePart(card)?.getAttribute('tabindex'), expectedTabIndex(s), 'tabindex');

    (card as any).disabled = true;
    await wait(30);
    problems.equal(basePart(card)?.getAttribute('tabindex'), '-1', 'tabindex while disabled');
    problems.equal(basePart(card)?.getAttribute('aria-disabled'), 'true', 'aria-disabled');

    (card as any).disabled = false;
    await wait(30);
    problems.equal(basePart(card)?.getAttribute('tabindex'), '0', 'tabindex after re-enabling');
    problems.equal(basePart(card)?.getAttribute('aria-disabled'), 'false', 'aria-disabled');

    expectClean(problems, 'disabled toggling');
  });

  it('setting selected from script moves the announced state', async () => {
    const card = await mountCard(spec({ clickable: true }));
    const problems = new Problems();
    const seen = captureEvents(card, 'card-click');

    (card as any).selected = true;
    await wait(30);
    problems.equal(basePart(card)?.getAttribute('aria-pressed'), 'true', 'aria-pressed');
    // A script assignment is not a user click and must not be reported as one.
    problems.equal(seen.length, 0, 'card-click events from a script assignment');

    expectClean(problems, 'selected assignment');
  });

  /**
   * The arrival of a header or footer AFTER connection is deliberately not
   * driven here: the card learns about it from `slotchange`, and happy-dom does
   * not emit `slotchange` for children appended to an already-connected host.
   * Driving the component's own slot pass by hand would be asserting the test's
   * own call rather than the platform's, so the dynamic case is asserted in a
   * real browser by tests/live/matrix/card. What IS component-owned and
   * asserted here: a card with no header content shows no header band.
   */
  it('a card with no header or footer content shows neither band', async () => {
    const card = await mountCard(spec({ slots: 'body' }));
    const problems = new Problems();

    problems.check(!shown(headerPart(card)), 'a card with no header content shows a header band');
    problems.check(!shown(footerPart(card)), 'a card with no footer content shows a footer band');
    problems.equal(projected(card, 'header'), '', 'the header slot projects nothing');
    problems.equal(projected(card, 'footer'), '', 'the footer slot projects nothing');

    expectClean(problems, 'empty bands');
  });

  it('switching every appearance axis keeps the regions intact', async () => {
    const s = spec({ slots: 'all', clickable: true, image: true });
    const card = await mountCard(s);
    const problems = new Problems();

    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        (card as any).variant = variant;
        (card as any).size = size;
        await wait(30);
        checkCard(card, { ...s, variant, size }, problems);
        problems.check(bodyPart(card) !== null, `[part="body"] lost at ${variant}/${size}`);
        problems.equal(basePart(card)?.getAttribute('role'), expectedRole(s),
          `role at ${variant}/${size}`);
      }
    }

    expectClean(problems, 'appearance switching');
  });
});
