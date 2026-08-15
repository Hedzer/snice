/**
 * Matrix slice TEXTAREA / PRESENTATION — the three appearance axes crossed.
 *
 * Dimensions: variant (3) x size (3) x resize (4) = 36 combos, with `label`,
 * `placeholder` and the supporting-text source rotated across the product so
 * none of them is only ever seen next to one appearance value.
 *
 * Documented contract under test (docs/ai/components/textarea.md):
 *   · `variant`, `size`, `resize` are documented properties, and the stylesheet
 *     selects on the classes they generate — so a documented value must reach
 *     the rendered control;
 *   · `label: string` — "External and wrapping labels name/focus the real
 *     textarea", which an INTERNAL label can only do through `for`/`id`;
 *   · `helperText`/`errorText` — "error replaces helper", on "one stable
 *     aria-describedby target";
 *   · CSS parts `textarea`, `helper-text`, `error-text`.
 *
 * Whether the three axes actually PAINT differently is the visual tier's job
 * (tests/live/matrix/textarea); this slice proves no appearance combination can
 * break the structure or the label/description wiring.
 *
 * it.fails policy: every assertion here is the documented expectation and no
 * finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  VARIANTS, SIZES, RESIZES, SUPPORT_TEXTS, HELPER, ERROR,
  combo, comboId, makeTextarea, expectTextareaMatches, readFacts, removeComponent,
} from './textarea-support';

describe('textarea matrix: presentation axes', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  let n = 0;
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const resize of RESIZES) {
        const c = combo({
          variant, size, resize,
          labelled: n % 2 === 0,
          placeholder: n % 3 !== 0,
          support: SUPPORT_TEXTS[n % SUPPORT_TEXTS.length],
        });
        n++;

        it(`${comboId(c)}: renders the documented structure`, async () => {
          el = await makeTextarea(c);
          expectTextareaMatches(el, c);
        });
      }
    }
  }
});

describe('textarea matrix: supporting text precedence', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  it('errorText replaces helperText when both are set', async () => {
    const c = combo({ support: 'both' });
    el = await makeTextarea(c);
    const facts = readFacts(el);

    expect(facts.supportKind, 'the error wins').toBe('error');
    expect(facts.supportText).toBe(ERROR);
    expect(el.shadowRoot.querySelector('[part~="helper-text"]'),
      'the helper is not also rendered — it would be announced twice').toBe(null);
  });

  it('helper and error share one stable aria-describedby target', async () => {
    const c = combo({ support: 'helper' });
    el = await makeTextarea(c);
    const withHelper = readFacts(el);
    expect(withHelper.supportText).toBe(HELPER);
    expect(withHelper.describedByResolves).toBe(true);

    el.errorText = ERROR;
    await new Promise(r => setTimeout(r, 30));
    const withError = readFacts(el);

    expect(withError.supportText).toBe(ERROR);
    expect(withError.describedByResolves, 'the id still resolves after the swap').toBe(true);
    expect(withError.describedBy, 'the target id is STABLE across the swap')
      .toBe(withHelper.describedBy);
  });

  it('no supporting text means no dangling aria-describedby', async () => {
    const c = combo({ support: 'none' });
    el = await makeTextarea(c);
    const facts = readFacts(el);

    expect(facts.supportKind).toBe('none');
    expect(facts.describedBy, 'never points at an element that does not exist').toBe('');
  });
});
