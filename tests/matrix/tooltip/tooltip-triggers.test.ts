/**
 * Matrix slice TOOLTIP / TRIGGERS — the four documented trigger modes crossed
 * with every interaction that must or must not open the popup.
 *
 * Dimensions: trigger (4) x interaction (4: hover, focus, click, manual API) =
 * 16 combos, each asserting BOTH directions — the interaction its mode owns
 * opens the tooltip, and the three it does not own leave it shut. Asserting only
 * the positive direction is how a trigger that responds to everything passes.
 * The delay channels add 8 more.
 *
 * Documented contract under test (docs/ai/components/tooltip.md):
 *   · `trigger: 'hover'|'click'|'focus'|'manual' = 'hover'`;
 *   · `open: boolean = false` and the `tip.open = true` example — the manual
 *     channel;
 *   · `delay: number = 0` / `hideDelay: number = 0`;
 *   · Methods `show()`, `hide()`, `toggle()`.
 *
 * it.fails policy: every assertion here is the documented expectation and no
 * finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  TRIGGERS,
  combo, makeTooltip, isShowing, readPortal, teardown, wait,
  hover, focusEvent, clickHost, clickOutside, pressEscape,
} from './tooltip-support';

/** Every interaction the component listens for, and the mode that owns it. */
const INTERACTIONS = {
  hover: (el: HTMLElement) => hover(el, 'mouseenter'),
  focus: (el: HTMLElement) => focusEvent(el, 'focusin'),
  click: (el: HTMLElement) => clickHost(el),
} as const;

const DISMISS = {
  hover: (el: HTMLElement) => hover(el, 'mouseleave'),
  focus: (el: HTMLElement) => focusEvent(el, 'focusout'),
  click: (el: HTMLElement) => clickHost(el),
} as const;

describe('tooltip matrix: each trigger answers only its own interaction', () => {
  let el: any;
  afterEach(() => { teardown(el); el = null; });

  for (const trigger of TRIGGERS) {
    for (const [interaction, act] of Object.entries(INTERACTIONS)) {
      const owns = trigger === interaction;

      it(`trigger=${trigger} + ${interaction}: ${owns ? 'opens' : 'stays shut'}`, async () => {
        el = await makeTooltip(combo({ trigger }));
        act(el);
        await wait(30);

        expect(isShowing(),
          owns ? `docs: trigger="${trigger}" opens on ${interaction}`
               : `docs: trigger="${trigger}" must ignore ${interaction}`)
          .toBe(owns);
      });
    }

    it(`trigger=${trigger}: the show() method always works`, async () => {
      el = await makeTooltip(combo({ trigger }));
      el.show();
      await wait(20);

      expect(isShowing(), 'show() is documented as unconditional').toBe(true);
    });
  }
});

describe('tooltip matrix: dismissal', () => {
  let el: any;
  afterEach(() => { teardown(el); el = null; });

  for (const trigger of ['hover', 'focus', 'click'] as const) {
    it(`trigger=${trigger}: its own interaction closes it again`, async () => {
      el = await makeTooltip(combo({ trigger }));
      INTERACTIONS[trigger](el);
      await wait(30);
      expect(isShowing()).toBe(true);

      DISMISS[trigger](el);
      await wait(30);
      expect(isShowing(), `${trigger} toggles/dismisses on its own interaction`).toBe(false);
    });
  }

  it('trigger=click: a click outside closes the tooltip', async () => {
    el = await makeTooltip(combo({ trigger: 'click' }));
    clickHost(el);
    await wait(30);
    expect(isShowing()).toBe(true);

    clickOutside();
    await wait(30);
    expect(isShowing(), 'a click elsewhere dismisses a click-triggered tooltip').toBe(false);
  });

  for (const trigger of ['click', 'focus', 'manual'] as const) {
    it(`trigger=${trigger}: Escape closes the tooltip`, async () => {
      el = await makeTooltip(combo({ trigger }));
      el.show();
      await wait(30);
      expect(isShowing()).toBe(true);

      pressEscape();
      await wait(30);
      expect(isShowing(), 'a keyboard user can always dismiss a non-hover tooltip').toBe(false);
    });
  }

  it('hide() closes whatever opened it', async () => {
    el = await makeTooltip(combo({ trigger: 'hover' }));
    hover(el, 'mouseenter');
    await wait(30);

    el.hide();
    await wait(30);
    expect(isShowing()).toBe(false);
  });

  it('toggle() alternates', async () => {
    el = await makeTooltip(combo({ trigger: 'manual' }));

    el.toggle();
    await wait(20);
    expect(isShowing()).toBe(true);

    el.toggle();
    await wait(20);
    expect(isShowing()).toBe(false);

    el.toggle();
    await wait(20);
    expect(isShowing()).toBe(true);
  });
});

describe('tooltip matrix: the manual channel', () => {
  let el: any;
  afterEach(() => { teardown(el); el = null; });

  it('open=true on a manual tooltip shows it at mount', async () => {
    el = await makeTooltip(combo({ trigger: 'manual' }), { open: true });
    await wait(30);

    expect(isShowing(), 'the documented `<snice-tooltip open trigger="manual">`').toBe(true);
  });

  it('assigning open drives the tooltip both ways', async () => {
    el = await makeTooltip(combo({ trigger: 'manual' }));

    el.open = true;
    await wait(30);
    expect(isShowing(), 'docs: `tip.open = true`').toBe(true);

    el.open = false;
    await wait(30);
    expect(isShowing()).toBe(false);
  });

  for (const trigger of ['hover', 'click', 'focus'] as const) {
    it(`open has no effect on a ${trigger} tooltip`, async () => {
      el = await makeTooltip(combo({ trigger }));
      el.open = true;
      await wait(30);

      expect(isShowing(), '`open` is documented alongside trigger="manual"').toBe(false);
    });
  }
});

describe('tooltip matrix: delays', () => {
  let el: any;
  afterEach(() => { teardown(el); el = null; });

  it('delay postpones the show by the documented number of milliseconds', async () => {
    el = await makeTooltip(combo({ trigger: 'hover', delay: 60 }));
    hover(el, 'mouseenter');

    await wait(20);
    expect(isShowing(), 'nothing appears before the delay elapses').toBe(false);

    await wait(90);
    expect(isShowing(), 'and it appears after').toBe(true);
  });

  it('hideDelay postpones the hide', async () => {
    el = await makeTooltip(combo({ trigger: 'hover', hideDelay: 60 }));
    hover(el, 'mouseenter');
    await wait(30);
    expect(isShowing()).toBe(true);

    hover(el, 'mouseleave');
    await wait(20);
    expect(isShowing(), 'the tooltip lingers for hideDelay').toBe(true);

    await wait(90);
    expect(isShowing()).toBe(false);
  });

  it('leaving before the show delay elapses cancels the show entirely', async () => {
    el = await makeTooltip(combo({ trigger: 'hover', delay: 80 }));
    hover(el, 'mouseenter');
    await wait(20);
    hover(el, 'mouseleave');

    await wait(120);
    expect(isShowing(), 'a cancelled intent must not fire late').toBe(false);
  });

  it('re-entering before the hide delay elapses cancels the hide', async () => {
    el = await makeTooltip(combo({ trigger: 'hover', hideDelay: 80 }));
    hover(el, 'mouseenter');
    await wait(30);
    hover(el, 'mouseleave');
    await wait(20);
    hover(el, 'mouseenter');

    await wait(120);
    expect(isShowing(), 'the tooltip the pointer came back to stays open').toBe(true);
  });

  it('delay = 0 shows synchronously enough to be indistinguishable', async () => {
    el = await makeTooltip(combo({ trigger: 'hover', delay: 0 }));
    hover(el, 'mouseenter');
    await wait(5);

    expect(isShowing(), 'the documented default is no delay at all').toBe(true);
  });

  it('a torn-down tooltip never fires a pending delayed show', async () => {
    el = await makeTooltip(combo({ trigger: 'hover', delay: 60 }));
    hover(el, 'mouseenter');
    await wait(10);
    el.remove();

    await wait(120);
    expect(readPortal().exists, 'no popup from an element that is gone').toBe(false);
    el = null;
  });
});
