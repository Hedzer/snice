/**
 * snice-drawer matrix — STRUCTURE.
 *
 * Two crosses, both taken whole because both are cheap and both guard a
 * failure mode that a spot check cannot see:
 *
 *   · `position` (4) x `size` (7) = 28. Neither has a rendered observable —
 *     the component reflects both onto the HOST and the stylesheet keys off
 *     `:host([position][size])`. In a layout-free tier the reflected attribute
 *     IS the contract, and a drawer that reflects one but not the other is a
 *     silently default-sized panel in every real browser.
 *
 *   · the chrome flags `no-header` x `no-footer` x `persistent` = 8. These
 *     three decide which of the seven documented parts exist, and they
 *     interact: `persistent` is documented as hiding the close button, which
 *     lives INSIDE the header that `no-header` removes. Only the cross says
 *     what happens when both are set.
 *
 * Every combo is judged by the whole oracle — parts, ARIA, slots, reflected
 * attributes and each documented boolean's round-trip through its kebab
 * attribute.
 */
import { describe, it, afterEach } from 'vitest';
import {
  BOOLEAN_ATTRS, DEFAULTS, PARTS, POSITIONS, SIZES,
  combo, expect, expectDrawerMatches, expectedParts, makeDrawer, part, parts, teardown,
} from './drawer-support';

describe('snice-drawer matrix — structure', () => {
  afterEach(teardown);

  // ── position x size ──────────────────────────────────────────────────────
  for (const position of POSITIONS) {
    for (const size of SIZES) {
      const c = combo({ position, size });
      it(`reflects the documented geometry: ${position}/${size}`, async () => {
        const el = await makeDrawer(c);
        expectDrawerMatches(el, c);
      });
    }
  }

  // ── no-header x no-footer x persistent ───────────────────────────────────
  for (const noHeader of [false, true]) {
    for (const noFooter of [false, true]) {
      for (const persistent of [false, true]) {
        const c = combo({ noHeader, noFooter, persistent });
        it(`renders the documented chrome: ${c.id}`, async () => {
          const el = await makeDrawer(c);
          expectDrawerMatches(el, c);

          // The doc's own words, asserted directly rather than only through
          // the oracle's part list, so a regression names the promise it broke.
          expect(!!part(el, 'header'), 'no-header removes the header').toBe(!noHeader);
          expect(!!part(el, 'footer'), 'no-footer removes the footer').toBe(!noFooter);
          expect(!!part(el, 'close'), 'persistent hides the close button')
            .toBe(!persistent && !noHeader);
        });
      }
    }
  }

  // ── documented defaults ──────────────────────────────────────────────────
  it('an attribute-free drawer carries every documented default', async () => {
    const el = await makeDrawer(combo());
    const read: Record<string, unknown> = {
      open: el.open, position: el.position, size: el.size, breakpoint: el.breakpoint,
    };
    for (const property of Object.keys(BOOLEAN_ATTRS)) read[property] = el[property];
    expect(read).toEqual(DEFAULTS);
  });

  it('a bare drawer renders all seven documented parts exactly once', async () => {
    const el = await makeDrawer(combo());
    expect(PARTS.filter(name => parts(el, name).length === 1).slice().sort())
      .toEqual([...PARTS].sort());
  });

  // ── each boolean crosses its documented kebab attribute ──────────────────
  for (const [property, attribute] of Object.entries(BOOLEAN_ATTRS)) {
    it(`${attribute} is the documented attribute for ${property}`, async () => {
      const el = await makeDrawer(combo({ [property]: true } as any));
      expect(el[property], `${property} from [${attribute}]`).toBe(true);
      expect(el.hasAttribute(attribute), `[${attribute}] present`).toBe(true);

      // …and every OTHER documented boolean stays at its default. One attribute
      // must not be able to switch on a neighbour it merely resembles
      // (`no-backdrop` vs `no-backdrop-dismiss`).
      for (const other of Object.keys(BOOLEAN_ATTRS)) {
        if (other === property) continue;
        expect(el[other], `${other} must stay false`).toBe(false);
      }
    });
  }

  // ── the title/footer slots follow their chrome ───────────────────────────
  it('the title slot lives in the header and the footer slot in the footer', async () => {
    const el = await makeDrawer(combo());
    expect(part(el, 'header')!.querySelector('slot[name="title"]'), 'title slot in header')
      .not.toBeNull();
    expect(part(el, 'footer')!.querySelector('slot[name="footer"]'), 'footer slot in footer')
      .not.toBeNull();
    expect(part(el, 'body')!.querySelector('slot:not([name])'), 'default slot in body')
      .not.toBeNull();
  });

  it('the title part is the h2 the doc describes and owns the dialog name', async () => {
    const el = await makeDrawer(combo());
    const title = part(el, 'title')!;
    expect(title.tagName).toBe('H2');
    // "role=dialog … aria-labelledby the title" — the dialog must be named.
    expect(part(el, 'base')!.getAttribute('aria-labelledby')).toBe(title.id);
    expect(title.id, 'the title carries an id to be referenced by').not.toBe('');
  });

  it('a header-less drawer still names its dialog', async () => {
    const el = await makeDrawer(combo({ noHeader: true }));
    const base = part(el, 'base')!;
    const named = (base.getAttribute('aria-label') ?? '') !== ''
      || (base.getAttribute('aria-labelledby') ?? '') !== '';
    expect(named, 'a dialog must never be announced without a name').toBe(true);
  });

  it('expectedParts is exhaustive — every doc part is accounted for', () => {
    // Guards the oracle itself: a part added to the doc but not to the
    // expectation table would otherwise silently stop being checked.
    const union = new Set<string>();
    for (const noHeader of [false, true]) {
      for (const noFooter of [false, true]) {
        for (const persistent of [false, true]) {
          for (const name of expectedParts(combo({ noHeader, noFooter, persistent }))) {
            union.add(name);
          }
        }
      }
    }
    expect([...union].sort()).toEqual([...PARTS].sort());
  });
});
