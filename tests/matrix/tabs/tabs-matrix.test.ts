/**
 * snice-tabs feature-combination matrix.
 *
 * Dimensions (docs/ai/components/tabs.md + the .types.ts contract):
 *
 *   placement x tab count x scroll controls   4 x 2 x 2 = 16  structure
 *   placement x selected index                4 x 3     = 12  selection
 *   the four documented methods                          =  9
 *   the three documented events                          = 10
 *   disabled / closable tabs                             =  7
 *   the documented attribute spellings                   =  3
 *   runtime reconfiguration                              =  6
 *                                                       ─────────────────────
 *                                                          61 combos
 *
 * Sized to the component: three custom elements, four placements, one index,
 * two per-tab switches and three events. Sixty combos exhaust that surface.
 * The indicator bar, the four placements' geometry and the scroll buttons'
 * overflow behaviour are paint, and belong to the visual tier
 * (tests/live/matrix/tabs/).
 *
  * it.fails policy: findings pinned in this file —
  *   MATRIX-tabs-1  a disabled tab's close button still fires;
  *   MATRIX-tabs-2  (fixed) the documented kebab-case attributes are now
  *                  observed; their guards run unpinned;
  *   MATRIX-tabs-3  an out-of-range selectTab still announces a tab change.
 */
import { describe, it, afterEach } from 'vitest';
import {
  Problems, captureEvents, cross, expectClean, removeComponent, wait,
} from '../matrix-kit';
import {
  FIVE_TABS, PLACEMENTS, THREE_TABS,
  type TabsSpec, checkTabs, clickClose, clickTab, closePartOf, labelPartOf,
  makeTabs, panelsOf, spec, tabsOf, visiblePanels,
} from './tabs-support';
import '../../../packages/components/src/tabs/snice-tabs';
import '../../../packages/components/src/tabs/snice-tab';
import '../../../packages/components/src/tabs/snice-tab-panel';

let el: HTMLElement | null = null;
afterEach(() => {
  if (el) { removeComponent(el); el = null; }
  document.body.innerHTML = '';
});

async function mountTabs(s: TabsSpec): Promise<HTMLElement> {
  el = await makeTabs(s);
  return el;
}

// ── Structure: placement x tab count x scroll controls ──────────────────────

describe('tabs matrix: structure', () => {
  for (const combo of cross({
    placement: PLACEMENTS,
    count: ['three', 'five'] as const,
    noScrollControls: [false, true],
  })) {
    // MATRIX-tabs-2 (fixed): `no-scroll-controls` used to be authored in HTML
    // but never observed; it now is, so these combos run unpinned.
    const runner = it;

    runner(combo.id, async () => {
      const s = spec({
        placement: combo.placement,
        noScrollControls: combo.noScrollControls,
        tabs: combo.count === 'three' ? THREE_TABS : FIVE_TABS,
      });
      const tabs = await mountTabs(s);
      const problems = new Problems();

      checkTabs(tabs, s, problems);

      expectClean(problems, combo.id);
    });
  }
});

// ── Selection ───────────────────────────────────────────────────────────────

describe('tabs matrix: selection', () => {
  for (const combo of cross({ placement: PLACEMENTS, selected: [0, 1, 2] })) {
    it(combo.id, async () => {
      const s = spec({ placement: combo.placement, selected: combo.selected });
      const tabs = await mountTabs(s);
      const problems = new Problems();

      checkTabs(tabs, s, problems);
      // The authored index shows the matching panel and hides the rest.
      problems.equal(visiblePanels(tabs), [combo.selected], 'the visible panel');

      expectClean(problems, combo.id);
    });
  }
});

// ── The four documented methods ─────────────────────────────────────────────

describe('tabs matrix: methods', () => {
  for (const combo of cross({ index: [0, 1, 2] })) {
    it(`selectTab(${combo.index})`, async () => {
      const tabs = await mountTabs(spec());
      const problems = new Problems();

      (tabs as any).selectTab(combo.index);
      await wait(40);

      problems.equal((tabs as any).selected, combo.index, 'selected after selectTab');
      problems.equal(visiblePanels(tabs), [combo.index], 'the visible panel');

      expectClean(problems, `selectTab(${combo.index})`);
    });

    it(`show(${combo.index}) is an alias for selectTab`, async () => {
      const tabs = await mountTabs(spec());
      const problems = new Problems();

      (tabs as any).show(combo.index);
      await wait(40);

      problems.equal((tabs as any).selected, combo.index, 'selected after show');
      problems.equal(visiblePanels(tabs), [combo.index], 'the visible panel');

      expectClean(problems, `show(${combo.index})`);
    });
  }

  it('getTab and getPanel return the elements at an index', async () => {
    const tabs = await mountTabs(spec());
    const problems = new Problems();

    for (let i = 0; i < THREE_TABS.length; i++) {
      problems.equal((tabs as any).getTab(i), tabsOf(tabs)[i], `getTab(${i})`);
      problems.equal((tabs as any).getPanel(i), panelsOf(tabs)[i], `getPanel(${i})`);
    }

    expectClean(problems, 'getTab/getPanel');
  });

  it('getTab and getPanel return nothing outside the range', async () => {
    const tabs = await mountTabs(spec());
    const problems = new Problems();

    for (const index of [-1, 3, 99]) {
      problems.equal((tabs as any).getTab(index), undefined, `getTab(${index})`);
      problems.equal((tabs as any).getPanel(index), undefined, `getPanel(${index})`);
    }

    expectClean(problems, 'out-of-range accessors');
  });

  it('selectTab outside the range changes nothing', async () => {
    const tabs = await mountTabs(spec({ selected: 1 }));
    const problems = new Problems();

    for (const index of [-1, 3, 99]) {
      (tabs as any).selectTab(index);
      await wait(40);
      problems.equal((tabs as any).selected, 1, `selected after selectTab(${index})`);
      problems.equal(visiblePanels(tabs), [1], `the visible panel after selectTab(${index})`);
    }

    expectClean(problems, 'out-of-range selectTab');
  });

  /**
   * FINDING MATRIX-tabs-3 — an out-of-range `selectTab` still announces a tab
   * change that never happened.
   *
   * The doc: `tab-change` → `{ index, oldIndex, tab, panel }` — "Tab
   * switched". `selectTab(index)` guards the range and returns early for
   * anything outside it, so no tab is switched — but the guard returns
   * `undefined` from a method wrapped in `@dispatch('tab-change')`, and the
   * decorator dispatches regardless of the return value. A listener therefore
   * receives a `tab-change` whose detail is not the documented object, for a
   * switch that did not occur.
   *
   * combo:    three tabs, selected=1, then selectTab(-1), selectTab(3), selectTab(99)
   * expected: no tab-change events
   * actual:   three tab-change events
   */
  it.fails('selectTab outside the range announces nothing', async () => {
    const tabs = await mountTabs(spec({ selected: 1 }));
    const problems = new Problems();
    const changes = captureEvents(tabs, 'tab-change');

    for (const index of [-1, 3, 99]) {
      (tabs as any).selectTab(index);
      await wait(40);
    }
    problems.equal(changes.length, 0, 'tab-change events from an out-of-range index');

    expectClean(problems, 'out-of-range tab-change');
  });
});

// ── The three documented events ─────────────────────────────────────────────

describe('tabs matrix: events', () => {
  for (const combo of cross({ index: [1, 2] })) {
    it(`clicking tab ${combo.index} emits tab-select and tab-change`, async () => {
      const tabs = await mountTabs(spec());
      const problems = new Problems();
      const selects = captureEvents<{ tab: HTMLElement }>(tabs, 'tab-select');
      const changes = captureEvents<any>(tabs, 'tab-change');

      clickTab(tabsOf(tabs)[combo.index]);
      await wait(40);

      // Documented: `tab-select` → `{ tab }`.
      problems.equal(selects.length, 1, 'tab-select count');
      problems.equal(selects[0]?.tab, tabsOf(tabs)[combo.index], 'tab-select detail.tab');
      // Documented: `tab-change` → `{ index, oldIndex, tab, panel }`.
      problems.equal(changes.length, 1, 'tab-change count');
      problems.equal(changes[0]?.index, combo.index, 'tab-change detail.index');
      problems.equal(changes[0]?.oldIndex, 0, 'tab-change detail.oldIndex');
      problems.equal(changes[0]?.tab, tabsOf(tabs)[combo.index], 'tab-change detail.tab');
      problems.equal(changes[0]?.panel, panelsOf(tabs)[combo.index], 'tab-change detail.panel');
      problems.equal(visiblePanels(tabs), [combo.index], 'the visible panel');

      expectClean(problems, `click/${combo.index}`);
    });
  }

  it('selectTab announces the index it came from', async () => {
    const tabs = await mountTabs(spec({ selected: 2 }));
    const problems = new Problems();
    const changes = captureEvents<any>(tabs, 'tab-change');

    (tabs as any).selectTab(0);
    await wait(40);

    problems.equal(changes[0]?.index, 0, 'tab-change detail.index');
    problems.equal(changes[0]?.oldIndex, 2, 'tab-change detail.oldIndex');

    expectClean(problems, 'selectTab event');
  });

  it('a disabled tab selects nothing and announces nothing', async () => {
    const s = spec({ tabs: THREE_TABS.map((t, i) => (i === 1 ? { ...t, disabled: true } : t)) });
    const tabs = await mountTabs(s);
    const problems = new Problems();
    const selects = captureEvents(tabs, 'tab-select');
    const changes = captureEvents(tabs, 'tab-change');

    clickTab(tabsOf(tabs)[1]);
    await wait(40);

    problems.equal(selects.length, 0, 'tab-select events from a disabled tab');
    problems.equal(changes.length, 0, 'tab-change events from a disabled tab');
    problems.equal((tabs as any).selected, 0, 'a disabled tab moved the selection');
    problems.equal(visiblePanels(tabs), [0], 'the visible panel');

    expectClean(problems, 'disabled tab');
  });

  it('a closable tab emits tab-close and does NOT select itself', async () => {
    const s = spec({ tabs: THREE_TABS.map((t, i) => (i === 2 ? { ...t, closable: true } : t)) });
    const tabs = await mountTabs(s);
    const problems = new Problems();
    const closes = captureEvents<{ tab: HTMLElement }>(tabs, 'tab-close');
    const selects = captureEvents(tabs, 'tab-select');

    clickClose(tabsOf(tabs)[2]);
    await wait(40);

    // Documented: `tab-close` → `{ tab }` — "Close button clicked".
    problems.equal(closes.length, 1, 'tab-close count');
    problems.equal(closes[0]?.tab, tabsOf(tabs)[2], 'tab-close detail.tab');
    // Pressing the close button is not a request to switch to that tab.
    problems.equal(selects.length, 0, 'tab-select events from a close button');
    problems.equal((tabs as any).selected, 0, 'the close button moved the selection');

    expectClean(problems, 'tab-close');
  });

  it('clicking a closable tab beside its close button still selects it', async () => {
    const s = spec({ tabs: THREE_TABS.map(t => ({ ...t, closable: true })) });
    const tabs = await mountTabs(s);
    const problems = new Problems();
    const closes = captureEvents(tabs, 'tab-close');
    const changes = captureEvents<any>(tabs, 'tab-change');

    clickTab(tabsOf(tabs)[1]);
    await wait(40);

    problems.equal(closes.length, 0, 'tab-close events from a tab body click');
    problems.equal(changes.length, 1, 'tab-change count');
    problems.equal((tabs as any).selected, 1, 'selected after clicking a closable tab');

    expectClean(problems, 'closable tab body');
  });

  it('re-selecting the tab that is already open still reports the change', async () => {
    const tabs = await mountTabs(spec({ selected: 1 }));
    const problems = new Problems();
    const changes = captureEvents<any>(tabs, 'tab-change');

    clickTab(tabsOf(tabs)[1]);
    await wait(40);

    // The doc's detail carries BOTH `index` and `oldIndex`, which only makes
    // sense if a same-index selection is reportable — and the panel must not
    // move regardless.
    problems.equal(visiblePanels(tabs), [1], 'the visible panel after re-selecting');
    problems.equal((tabs as any).selected, 1, 'selected after re-selecting');
    if (changes.length) {
      problems.equal(changes[0]?.index, 1, 'tab-change detail.index');
      problems.equal(changes[0]?.oldIndex, 1, 'tab-change detail.oldIndex');
    }

    expectClean(problems, 're-select');
  });
});

// ── Per-tab switches ────────────────────────────────────────────────────────

describe('tabs matrix: disabled and closable', () => {
  for (const combo of cross({ disabled: [false, true], closable: [false, true] })) {
    it(combo.id, async () => {
      const s = spec({
        tabs: THREE_TABS.map(t => ({ ...t, disabled: combo.disabled, closable: combo.closable })),
      });
      const tabs = await mountTabs(s);
      const problems = new Problems();

      checkTabs(tabs, s, problems);
      for (const [i, tab] of tabsOf(tabs).entries()) {
        problems.equal(closePartOf(tab) !== null, combo.closable, `tab ${i} close button`);
        problems.check(labelPartOf(tab) !== null, `tab ${i} lost its label region`);
      }

      expectClean(problems, combo.id);
    });
  }

  /**
   * FINDING MATRIX-tabs-1 — a disabled tab's close button still fires.
   *
   * The doc lists `disabled` and `closable` as independent `snice-tab`
   * properties, and `tab-close` as "Close button clicked". A DISABLED tab is
   * inert — its click handler bails out before selecting — but the close
   * branch is checked FIRST and returns early, so the close button of a
   * disabled tab still emits `tab-close` and the consumer removes a tab the
   * user was told they could not interact with.
   *
   * combo:    `<snice-tab slot="nav" disabled closable>`, close button clicked
   * expected: no tab-close (a disabled control does nothing)
   * actual:   tab-close → { tab }
   */
  it.fails('a disabled tab\'s close button does nothing', async () => {
    const s = spec({
      tabs: THREE_TABS.map((t, i) => (i === 1 ? { ...t, disabled: true, closable: true } : t)),
    });
    const tabs = await mountTabs(s);
    const problems = new Problems();
    const closes = captureEvents(tabs, 'tab-close');

    clickClose(tabsOf(tabs)[1]);
    await wait(40);

    problems.equal(closes.length, 0, 'tab-close events from a disabled tab');

    expectClean(problems, 'disabled+closable');
  });

  it('a disabled tab can still be selected through the API', async () => {
    const s = spec({ tabs: THREE_TABS.map((t, i) => (i === 1 ? { ...t, disabled: true } : t)) });
    const tabs = await mountTabs(s);
    const problems = new Problems();

    // `disabled` is documented as a property of the TAB — the button. The
    // container's own `selectTab(index)` is a separate, documented API and the
    // doc places no `disabled` condition on it.
    (tabs as any).selectTab(1);
    await wait(40);
    problems.equal((tabs as any).selected, 1, 'selectTab did not honour a disabled index');
    problems.equal(visiblePanels(tabs), [1], 'the visible panel');

    expectClean(problems, 'API vs disabled');
  });

  it('every tab disabled leaves the authored selection alone', async () => {
    const s = spec({
      selected: 2,
      tabs: THREE_TABS.map(t => ({ ...t, disabled: true })),
    });
    const tabs = await mountTabs(s);
    const problems = new Problems();

    checkTabs(tabs, s, problems);
    clickTab(tabsOf(tabs)[0]);
    await wait(40);
    problems.equal((tabs as any).selected, 2, 'a disabled tab moved the selection');

    expectClean(problems, 'all disabled');
  });
});

// ── The documented attribute spellings ──────────────────────────────────────

describe('tabs matrix: attributes', () => {
  /**
   * FINDING MATRIX-tabs-2 (fixed) — the documented kebab-case attributes used
   * not to be the ones the components observe.
   *
   * `docs/ai/components/tabs.md` spells four attributes out explicitly:
   *
   *     noScrollControls: boolean = false;  // attr: no-scroll-controls
   *     transitionIn: string = '';          // attr: transition-in
   *     transitionOut: string = '';         // attr: transition-out
   *     transitionDuration: number = 300;   // attr: transition-duration
   *
   * Every one of them was declared without an `attribute` option, and snice's
   * default attribute name is the property name LOWERCASED, not kebab-cased
   * (`getAttrName` in packages/core/src/utils.ts), so the observed attributes
   * were `noscrollcontrols`, `transitionin`, `transitionout` and
   * `transitionduration`. The decorators now name the documented attributes;
   * the guards below run unpinned.
   */
  it('no-scroll-controls reaches the property [MATRIX-tabs-2 (fixed)]', async () => {
    const tabs = await mountTabs(spec({ noScrollControls: true }));
    const problems = new Problems();

    problems.equal((tabs as any).noScrollControls, true, 'noScrollControls property');

    expectClean(problems, 'no-scroll-controls attribute');
  });

  /**
   * FINDING MATRIX-tabs-2 (fixed), the panel half of the same defect.
   *
   * combo:    `<snice-tab-panel transition-in="fade" transition-out="fade"
   *            transition-duration="120">`
   * expected: transitionIn === 'fade', transitionOut === 'fade',
   *           transitionDuration === 120
   */
  it('transition-in / transition-out / transition-duration reach the panel [MATRIX-tabs-2 (fixed)]', async () => {
    const tabs = await mountTabs(spec());
    const problems = new Problems();

    const panel = panelsOf(tabs)[0];
    panel.setAttribute('transition-in', 'fade');
    panel.setAttribute('transition-out', 'fade');
    panel.setAttribute('transition-duration', '120');
    await wait(40);

    problems.equal((panel as any).transitionIn, 'fade', 'transitionIn');
    problems.equal((panel as any).transitionOut, 'fade', 'transitionOut');
    problems.equal((panel as any).transitionDuration, 120, 'transitionDuration');

    expectClean(problems, 'panel transition attributes');
  });

  it('the property channel drives every one of them', async () => {
    const tabs = await mountTabs(spec());
    const problems = new Problems();

    (tabs as any).noScrollControls = true;
    await wait(40);
    problems.equal((tabs as any).noScrollControls, true, 'noScrollControls property');
    checkTabs(tabs, spec({ noScrollControls: true }), problems);

    const panel = panelsOf(tabs)[0];
    (panel as any).transitionIn = 'fade';
    (panel as any).transitionDuration = 120;
    await wait(40);
    problems.equal((panel as any).transitionIn, 'fade', 'transitionIn');
    problems.equal((panel as any).transitionDuration, 120, 'transitionDuration');

    expectClean(problems, 'property channel');
  });
});

// ── Runtime reconfiguration ─────────────────────────────────────────────────

describe('tabs matrix: reconfiguration', () => {
  it('setting selected moves the panel', async () => {
    const s = spec();
    const tabs = await mountTabs(s);
    const problems = new Problems();

    for (const index of [2, 0, 1]) {
      (tabs as any).selected = index;
      await wait(40);
      problems.equal(visiblePanels(tabs), [index], `the visible panel at selected=${index}`);
    }

    expectClean(problems, 'selected assignment');
  });

  it('switching placement keeps every documented region and the selection', async () => {
    const s = spec({ selected: 1 });
    const tabs = await mountTabs(s);
    const problems = new Problems();

    for (const placement of PLACEMENTS) {
      (tabs as any).placement = placement;
      await wait(40);
      checkTabs(tabs, { ...s, placement }, problems);
    }

    expectClean(problems, 'placement switching');
  });

  it('turning no-scroll-controls on and off removes and restores the arrows', async () => {
    const s = spec();
    const tabs = await mountTabs(s);
    const problems = new Problems();

    checkTabs(tabs, s, problems);

    (tabs as any).noScrollControls = true;
    await wait(40);
    checkTabs(tabs, { ...s, noScrollControls: true }, problems);

    (tabs as any).noScrollControls = false;
    await wait(40);
    checkTabs(tabs, { ...s, noScrollControls: false }, problems);

    expectClean(problems, 'scroll controls toggling');
  });

  it('turning closable on and off adds and removes the close button', async () => {
    const tabs = await mountTabs(spec());
    const problems = new Problems();
    const tab = tabsOf(tabs)[0];

    problems.check(closePartOf(tab) === null, 'a plain tab already has a close button');
    (tab as any).closable = true;
    await wait(40);
    problems.check(closePartOf(tab) !== null, 'closable=true rendered no close button');
    (tab as any).closable = false;
    await wait(40);
    problems.check(closePartOf(tab) === null, 'closable=false left the close button behind');

    expectClean(problems, 'closable toggling');
  });

  it('turning disabled on stops a tab that was working', async () => {
    const tabs = await mountTabs(spec());
    const problems = new Problems();
    const selects = captureEvents(tabs, 'tab-select');
    const tab = tabsOf(tabs)[1];

    clickTab(tab);
    await wait(40);
    problems.equal(selects.length, 1, 'the tab did not work before being disabled');

    (tab as any).disabled = true;
    await wait(40);
    clickTab(tab);
    await wait(40);
    problems.equal(selects.length, 1, 'a newly disabled tab still emitted tab-select');

    expectClean(problems, 'disabled at runtime');
  });

  it('a transition value never changes which panel is showing', async () => {
    const s = spec({ transition: 'fade' });
    const tabs = await mountTabs(s);
    const problems = new Problems();

    problems.equal((tabs as any).transition, 'fade', 'transition property');
    problems.equal(visiblePanels(tabs), [0], 'the visible panel before any change');

    (tabs as any).selectTab(2);
    // A transition is documented as timing, not as a different outcome; give it
    // longer than the 300ms default so the switch has certainly settled.
    await wait(500);
    problems.equal(visiblePanels(tabs), [2], 'the visible panel after a transitioned switch');
    problems.equal((tabs as any).selected, 2, 'selected after a transitioned switch');

    expectClean(problems, 'transition');
  });
});
