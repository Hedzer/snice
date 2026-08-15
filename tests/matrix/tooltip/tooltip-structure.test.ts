/**
 * Matrix slice TOOLTIP / STRUCTURE — the twelve documented positions crossed
 * with the arrow switch, plus the portal each of them opens.
 *
 * Dimensions: position (12) x arrow (2) = 24 combos, with `maxWidth`/`zIndex`
 * rotated across them so the two numeric properties are exercised against every
 * placement rather than only the default one.
 *
 * Documented contract under test (docs/ai/components/tooltip.md):
 *   · CSS Parts — `trigger` ("Wrapper around the slot/trigger content"),
 *     `tooltip` ("The tooltip popup div"), `content` ("Text content inside
 *     tooltip"), `arrow` ("Arrow element");
 *   · `position` — one of twelve, which the popup must carry so its arrow and
 *     entrance transform can be placed;
 *   · `arrow: boolean = true`;
 *   · `maxWidth: number = 250`, `zIndex: number = 10000`;
 *   · slot `(default)` — "Trigger element the tooltip attaches to".
 *
 * Where the tooltip actually LANDS is not judgeable here: happy-dom performs no
 * layout, so every rect the positioner reads is 0. Placement and auto-flipping
 * are owned by tests/live/matrix/tooltip.
 *
 * it.fails policy: every assertion here is the documented expectation. One
 * finding is pinned at the end of this file — see MATRIX-tooltip-1.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  POSITIONS, CONTENT, TRIGGER_TEXT,
  combo, comboId, makeTooltip, expectTooltipMatches, readPortal, teardown, wait,
} from './tooltip-support';

describe('tooltip matrix: shadow structure', () => {
  let el: any;
  afterEach(() => { teardown(el); el = null; });

  let n = 0;
  for (const position of POSITIONS) {
    for (const arrow of [true, false]) {
      const c = combo({
        position, arrow,
        maxWidth: n % 3 === 0 ? 320 : 250,
        zIndex: n % 4 === 0 ? 42 : 10000,
      });
      n++;

      it(`${comboId(c)}: renders the documented parts`, async () => {
        el = await makeTooltip(c);
        expectTooltipMatches(el, c);
      });
    }
  }
});

describe('tooltip matrix: the portal the customer sees', () => {
  let el: any;
  afterEach(() => { teardown(el); el = null; });

  // `strictPositioning` is the documented switch that "disables auto-flip", so
  // it is the only vector in which the REQUESTED placement is also the FINAL
  // placement. Without it the component is allowed — and required — to move the
  // popup when it would not fit, and happy-dom reports every rect as 0, which
  // is a viewport in which nothing fits anywhere. Flipping is asserted for what
  // it is (a documented feature) rather than pinned to a geometry this
  // environment cannot produce; tests/live/matrix/tooltip owns the real one.
  for (const position of POSITIONS) {
    const c = combo({ position, trigger: 'manual', strictPositioning: true });

    it(`${comboId(c)}: opens a portal carrying its position`, async () => {
      el = await makeTooltip(c);
      el.show();
      await wait(20);

      const portal = readPortal();
      expect(portal.exists, 'show() portals the popup into the document').toBe(true);
      expect(portal.visible).toBe(true);
      expect(portal.text, 'the popup says what `content` says').toBe(CONTENT);
      expect(portal.role, 'and announces itself as a tooltip').toBe('tooltip');
      expect(portal.positionClass,
        'strict-positioning keeps the requested placement').toBe(`snice-tooltip--${position}`);
    });

    it(`${comboId(combo({ position, trigger: 'manual' }))}: without strict positioning it still lands somewhere documented`, async () => {
      el = await makeTooltip(combo({ position, trigger: 'manual' }));
      el.show();
      await wait(20);

      const landed = readPortal().positionClass ?? '';
      expect(POSITIONS.map(p => `snice-tooltip--${p}`),
        `auto-flip moved the popup to "${landed}", which is not a documented position`)
        .toContain(landed);
    });
  }

  for (const arrow of [true, false]) {
    it(`arrow=${arrow}: the popup ${arrow ? 'draws' : 'omits'} its arrow`, async () => {
      el = await makeTooltip(combo({ arrow, trigger: 'manual' }));
      el.show();
      await wait(20);

      const portal = readPortal();
      expect(portal.arrowShown, `docs: arrow: boolean = true`).toBe(arrow);
    });
  }

  it('maxWidth and zIndex reach the popup', async () => {
    el = await makeTooltip(combo({ trigger: 'manual', maxWidth: 180, zIndex: 55 }));
    el.show();
    await wait(20);

    const portal = readPortal();
    expect(portal.maxWidth).toBe('180px');
    expect(portal.zIndex).toBe('55');
  });

  it('only ONE portal exists however many times the tooltip opens', async () => {
    el = await makeTooltip(combo({ trigger: 'manual' }));
    for (let i = 0; i < 5; i++) { el.show(); el.hide(); await wait(5); }
    el.show();
    await wait(20);

    expect(document.body.querySelectorAll('.snice-tooltip'),
      'a re-show reuses the portal rather than leaking a new one').toHaveLength(1);
  });

  it('the portal leaves with its host', async () => {
    el = await makeTooltip(combo({ trigger: 'manual' }));
    el.show();
    await wait(20);
    expect(readPortal().exists).toBe(true);

    el.remove();
    await wait(30);
    expect(document.body.querySelector('.snice-tooltip'),
      'teardown must not leave a floating popup behind').toBe(null);
    el = null;
  });

  it('an empty content never opens anything', async () => {
    el = await makeTooltip(combo({ content: '', trigger: 'manual' }));
    el.show();
    await wait(20);

    expect(readPortal().exists, 'there is nothing to say, so nothing is shown').toBe(false);
  });

  it('a content change reaches an already-open popup', async () => {
    el = await makeTooltip(combo({ trigger: 'manual' }));
    el.show();
    await wait(20);
    expect(readPortal().text).toBe(CONTENT);

    el.content = 'Updated text';
    await wait(30);
    el.show();
    await wait(20);

    expect(readPortal().text).toBe('Updated text');
  });

  it('the slotted trigger content is left alone', async () => {
    el = await makeTooltip(combo(), { triggerHtml: '<button type="button">Save</button>' });
    const button = el.querySelector('button') as HTMLButtonElement;

    expect(button, 'the trigger element stays in the light DOM').toBeTruthy();
    expect(button.textContent).toBe(TRIGGER_TEXT);
  });
});

/**
 * MATRIX-tooltip-1.
 *
 * Documented CSS Parts: "`tooltip` - The tooltip popup div", "`content` - Text
 * content inside tooltip", "`arrow` - Arrow element". A CSS part is a STYLING
 * HOOK: `snice-tooltip::part(tooltip) { … }` is the documented way to restyle
 * the popup.
 *
 * The shadow nodes carrying those three parts exist and are the ones the oracle
 * above asserts — but they are never what the customer sees. `show()` builds a
 * SEPARATE `div.snice-tooltip` and appends it to `document.body`, and that
 * portal carries no `part` attribute at all, so `::part(tooltip)` reaches only
 * the permanently-`hidden` shadow copy. Every documented part-based style is
 * therefore inert for the visible popup.
 *
 * Per .ai/fuzzing.md the assertion stays at full strength and the component is
 * NOT changed: this test fails the day the portal exposes the documented parts,
 * which is how the finding gets closed.
 */
describe('tooltip matrix: documented CSS parts reach the visible popup', () => {
  let el: any;
  afterEach(() => { teardown(el); el = null; });

  it.fails(
    'MATRIX-tooltip-1: the portalled popup exposes the documented tooltip/content/arrow parts',
    async () => {
      el = await makeTooltip(combo({ trigger: 'manual' }));
      el.show();
      await wait(20);

      const portal = document.body.querySelector('.snice-tooltip') as HTMLElement;
      expect(portal, 'the popup is portalled to the body').toBeTruthy();

      const partsOn = (node: Element | null) =>
        (node?.getAttribute('part') ?? '').split(/\s+/).filter(Boolean);

      expect(partsOn(portal), 'docs: part `tooltip` is "The tooltip popup div"')
        .toContain('tooltip');
      expect(partsOn(portal.querySelector('.snice-tooltip__content')),
        'docs: part `content` is "Text content inside tooltip"').toContain('content');
      expect(partsOn(portal.querySelector('.snice-tooltip__arrow')),
        'docs: part `arrow` is "Arrow element"').toContain('arrow');
    },
  );
});
