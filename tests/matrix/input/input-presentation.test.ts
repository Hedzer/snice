/**
 * Matrix slice INPUT / PRESENTATION — the appearance axes and the regions they
 * must never disturb.
 *
 * Dimensions (docs/ai/components/input.md):
 *   variant x size x labelled            3 x 3 x 2 = 18
 *   support text x labelled              4 x 2     =  8
 *   icon channels x type                 5 x 2     = 10
 *                                                  ──────
 *                                                    36 combos
 *
 * Documented contract under test:
 *   · `variant: outlined|filled|underlined` and `size: small|medium|large` are
 *     appearance only — the stylesheet selects on them, and neither may add,
 *     remove or rename one of the eleven documented CSS parts;
 *   · `label` renders a label BOUND to the real input (the doc's a11y section
 *     turns on that binding);
 *   · `helperText` / `errorText` are the described-by target;
 *   · the two icon channels: `prefix-icon`/`suffix-icon` ATTRIBUTES for emoji
 *     and URLs, and the slots that "override the property".
 *
 * it.fails policy: one finding is pinned in this file, MATRIX-input-1.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  ICON_MODES, SIZES, SUFFIX_ICON, SUPPORT_TEXTS, VARIANTS,
  combo, comboId, expectInputMatches, makeInput, partOf, readFacts,
} from './input-support';

afterEach(() => { document.body.innerHTML = ''; });

describe('input matrix: appearance', () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const labelled of [false, true]) {
        const c = combo({ variant, size, labelled, placeholder: true });
        it(comboId(c), async () => {
          const el = await makeInput(c);
          expectInputMatches(el, c);
        });
      }
    }
  }
});

describe('input matrix: supporting text', () => {
  for (const support of SUPPORT_TEXTS) {
    for (const labelled of [false, true]) {
      const c = combo({ support, labelled });
      it(comboId(c), async () => {
        const el = await makeInput(c);
        expectInputMatches(el, c);

        // Documented: the support text is what `aria-describedby` points at.
        // A described-by that resolves to nothing is a promise to a screen
        // reader that the component does not keep.
        const facts = readFacts(el);
        expect(facts.describedByResolves, `combo ${comboId(c)} described-by`)
          .toBe(support !== 'none');
      });
    }
  }
});

describe('input matrix: icon channels', () => {
  for (const icons of ICON_MODES) {
    for (const type of ['text', 'search'] as const) {
      const c = combo({ icons, type, placeholder: true });
      it(comboId(c), async () => {
        const el = await makeInput(c);
        expectInputMatches(el, c);
      });
    }
  }

  /**
   * FINDING MATRIX-input-1 — the password toggle deletes the suffix icon.
   *
   * `suffixIcon` and `password` are documented as independent properties, with
   * `suffix-icon` listed as one of eleven CSS parts and `password` described
   * only as the toggle switch. The template renders the suffix-icon region
   * inside `<if ${!(type === 'password' && password)}>`, so a password field
   * with a reveal toggle silently loses its documented suffix icon — the part
   * is not merely empty, it does not exist.
   *
   * combo:    type="password" password suffix-icon="✔"
   * expected: [part="suffix-icon"] presents "✔", alongside the toggle
   * actual:   no [part="suffix-icon"] at all
   */
  it.fails('MATRIX-input-1: a password toggle keeps the documented suffix icon', async () => {
    const c = combo({ type: 'password', password: true, icons: 'suffix' });
    const el = await makeInput(c);

    expect(partOf(el, 'suffix-icon'), 'no [part="suffix-icon"] beside the password toggle')
      .not.toBe(null);
    expect(readFacts(el).suffixIcon).toBe(SUFFIX_ICON);
  });

  it('a password toggle without a suffix icon still renders its toggle', async () => {
    const c = combo({ type: 'password', password: true });
    const el = await makeInput(c);
    expectInputMatches(el, c);
  });
});

describe('input matrix: the eleven documented parts survive every axis', () => {
  // The parts a control renders unconditionally, per the doc's CSS Parts list.
  const ALWAYS = ['wrapper', 'container', 'input', 'prefix-icon', 'clear'];

  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      it(`${variant}/${size}/parts`, async () => {
        const c = combo({ variant, size, labelled: true, support: 'both', clearable: true });
        const el = await makeInput(c);
        const missing = ALWAYS.filter(name => partOf(el, name) === null);
        expect(missing, `combo ${comboId(c)} lost documented parts`).toEqual([]);
        // The conditional ones, at the axis where each is documented to appear.
        expect(partOf(el, 'label'), 'no [part="label"] for a labelled control').not.toBe(null);
        expect(partOf(el, 'error-text'), 'no [part="error-text"] for an errored control').not.toBe(null);
      });
    }
  }
});
