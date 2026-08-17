/**
 * snice-pagination matrix — THE NAVIGATION CHROME.
 *
 * Four independent visibility switches (`show-first`, `show-prev`,
 * `show-next`, `show-last`, all documented as defaulting to true) crossed with
 * the three positions where the documented "Disabled state for boundary
 * buttons" changes: the first page, a middle page, and the last page. 2^4 x 3
 * = 48 combos.
 *
 * Both halves of that cross earn their place. The switches are independent, so
 * only the full 2^4 proves that turning one off does not take a neighbour with
 * it — `show-first` and `show-prev` render adjacent buttons from near-identical
 * markup, and so do `show-next` and `show-last`. The three positions are where
 * `disabled` flips, and a component that disabled the wrong pair would still
 * look correct at exactly one of them.
 *
 * The presentation dimensions (`size` x `variant`) are here too: both are
 * documented as pure CSS hooks, so a DOM tier can only assert that they reach
 * the host where `:host([size])` / `:host([variant])` can see them. What they
 * PAINT is the visual tier's question.
 */
import { describe, it, afterEach } from 'vitest';
import {
  DEFAULTS, NAV_BUTTONS, SIZES, SWITCHES, VARIANTS, type SwitchName,
  combo, expect, expectChromeMatches, expectWindowMatches, makePagination, part, parts, teardown,
} from './pagination-support';

const SWITCH_NAMES = Object.keys(SWITCHES) as SwitchName[];
const TOTAL = 10;

describe('snice-pagination matrix — controls', () => {
  afterEach(teardown);

  // ── 2^4 switches x 3 boundary positions ──────────────────────────────────
  for (let bits = 0; bits < (1 << SWITCH_NAMES.length); bits++) {
    const vector = {} as Record<SwitchName, boolean>;
    SWITCH_NAMES.forEach((name, i) => { vector[name] = !((bits >> i) & 1); });

    for (const current of [1, 5, TOTAL]) {
      const c = combo({ ...vector, current, total: TOTAL });
      it(`chrome: ${c.id}`, async () => {
        const el = await makePagination(c);
        expectChromeMatches(el, c);
        // The switches must not disturb the window they sit around.
        expectWindowMatches(el, c);
      });
    }
  }

  // ── each switch is exactly one button ────────────────────────────────────
  for (const name of SWITCH_NAMES) {
    it(`${SWITCHES[name]}="false" removes only ${NAV_BUTTONS[name].part}`, async () => {
      const c = combo({ [name]: false, current: 5, total: TOTAL } as any);
      const el = await makePagination(c);
      expect(part(el, NAV_BUTTONS[name].part), 'the named button is gone').toBeNull();
      for (const other of SWITCH_NAMES) {
        if (other === name) continue;
        expect(part(el, NAV_BUTTONS[other].part), `${NAV_BUTTONS[other].part} survives`)
          .not.toBeNull();
      }
    });
  }

  it('all four switches off leaves the nav, the pages and nothing else', async () => {
    const c = combo({
      showFirst: false, showPrev: false, showNext: false, showLast: false,
      current: 5, total: TOTAL,
    });
    const el = await makePagination(c);
    expectChromeMatches(el, c);
    expect(part(el, 'base'), 'the nav container stays').not.toBeNull();
    expect(part(el, 'pages'), 'the page list stays').not.toBeNull();
    expect(parts(el, 'button').length, 'no shared button parts left').toBe(0);
  });

  // ── boundary disabling ───────────────────────────────────────────────────
  it('first and prev are disabled on page 1, next and last are not', async () => {
    const el = await makePagination(combo({ current: 1, total: TOTAL }));
    expect(part(el, 'first-button')!.hasAttribute('disabled')).toBe(true);
    expect(part(el, 'prev-button')!.hasAttribute('disabled')).toBe(true);
    expect(part(el, 'next-button')!.hasAttribute('disabled')).toBe(false);
    expect(part(el, 'last-button')!.hasAttribute('disabled')).toBe(false);
  });

  it('next and last are disabled on the final page, first and prev are not', async () => {
    const el = await makePagination(combo({ current: TOTAL, total: TOTAL }));
    expect(part(el, 'first-button')!.hasAttribute('disabled')).toBe(false);
    expect(part(el, 'prev-button')!.hasAttribute('disabled')).toBe(false);
    expect(part(el, 'next-button')!.hasAttribute('disabled')).toBe(true);
    expect(part(el, 'last-button')!.hasAttribute('disabled')).toBe(true);
  });

  it('a single-page range disables every boundary button at once', async () => {
    const c = combo({ current: 1, total: 1 });
    const el = await makePagination(c);
    expectChromeMatches(el, c);
    for (const name of SWITCH_NAMES) {
      expect(part(el, NAV_BUTTONS[name].part)!.hasAttribute('disabled'),
        `${NAV_BUTTONS[name].part} at both boundaries`).toBe(true);
    }
  });

  it('the disabled state follows current at runtime', async () => {
    const el = await makePagination(combo({ current: 1, total: TOTAL }));
    el.current = 5;
    await new Promise(resolve => setTimeout(resolve, 20));
    expectChromeMatches(el, combo({ current: 5, total: TOTAL }));

    el.current = TOTAL;
    await new Promise(resolve => setTimeout(resolve, 20));
    expectChromeMatches(el, combo({ current: TOTAL, total: TOTAL }));
  });

  // ── size x variant ───────────────────────────────────────────────────────
  for (const size of SIZES) {
    for (const variant of VARIANTS) {
      it(`presentation reaches the host: ${size}/${variant}`, async () => {
        const c = combo({ size, variant, current: 5, total: TOTAL });
        const el = await makePagination(c);
        expect(el.size).toBe(size);
        expect(el.variant).toBe(variant);
        // `:host([size="small"])` / `:host([variant="rounded"])` are the only
        // consumers, so the reflected attribute IS the contract.
        expect(el.getAttribute('size'), 'host [size]').toBe(size);
        expect(el.getAttribute('variant'), 'host [variant]').toBe(variant);
        expectChromeMatches(el, c);
      });
    }
  }

  // ── documented defaults ──────────────────────────────────────────────────
  it('an attribute-free pagination carries every documented default', async () => {
    const el = await makePagination(combo({
      current: DEFAULTS.current, total: DEFAULTS.total, siblings: DEFAULTS.siblings,
      size: DEFAULTS.size, variant: DEFAULTS.variant,
    }));
    expect({
      current: el.current, total: el.total, siblings: el.siblings,
      showFirst: el.showFirst, showLast: el.showLast,
      showPrev: el.showPrev, showNext: el.showNext,
      size: el.size, variant: el.variant,
    }).toEqual(DEFAULTS);
  });

  it('every navigation button carries the shared part="button" as well', async () => {
    const el = await makePagination(combo({ current: 5, total: TOTAL }));
    expect(parts(el, 'button').length, 'all four share the button part').toBe(4);
    for (const name of SWITCH_NAMES) {
      const button = part(el, NAV_BUTTONS[name].part)!;
      expect(button.getAttribute('part')!.split(/\s+/), `${NAV_BUTTONS[name].part} parts`)
        .toContain('button');
    }
  });
});
