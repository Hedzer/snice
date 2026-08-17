/**
 * Smoke slice of the snice-tabs matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/tabs/, 61 combos) is excluded from the default
 * Vitest include and runs via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and every assertion routes through the
 * matrix's own oracle.
 *
 * The marquee: the three-element trio wired up, the selection contract, the
 * three documented events, the disabled lock, and the four methods.
 *
 * BUDGET: under 1s.
 */
import { describe, it, afterEach } from 'vitest';
import {
  Problems, captureEvents, expectClean, removeComponent, wait,
} from '../matrix-kit';
import {
  THREE_TABS, checkTabs, clickClose, clickTab, makeTabs, panelsOf, spec, tabsOf, visiblePanels,
} from './tabs-support';
import '../../../packages/components/src/tabs/snice-tabs';
import '../../../packages/components/src/tabs/snice-tab';
import '../../../packages/components/src/tabs/snice-tab-panel';

let el: HTMLElement | null = null;
afterEach(() => {
  if (el) { removeComponent(el); el = null; }
  document.body.innerHTML = '';
});

describe('tabs matrix smoke', () => {
  it('a three-tab interface renders every documented region', async () => {
    const s = spec({ selected: 1 });
    el = await makeTabs(s);
    const problems = new Problems();

    checkTabs(el, s, problems);

    expectClean(problems, 'smoke/structure');
  });

  it('exactly one panel shows, and it follows the selection', async () => {
    el = await makeTabs(spec());
    const problems = new Problems();

    problems.equal(visiblePanels(el), [0], 'the visible panel at rest');
    (el as any).selectTab(2);
    await wait(40);
    problems.equal(visiblePanels(el), [2], 'the visible panel after selectTab(2)');
    (el as any).show(1);
    await wait(40);
    problems.equal(visiblePanels(el), [1], 'the visible panel after show(1)');

    expectClean(problems, 'smoke/selection');
  });

  it('clicking a tab emits tab-select and tab-change with their details', async () => {
    el = await makeTabs(spec());
    const problems = new Problems();
    const selects = captureEvents<{ tab: HTMLElement }>(el, 'tab-select');
    const changes = captureEvents<any>(el, 'tab-change');

    clickTab(tabsOf(el)[2]);
    await wait(40);

    problems.equal(selects.length, 1, 'tab-select count');
    problems.equal(selects[0]?.tab, tabsOf(el)[2], 'tab-select detail.tab');
    problems.equal(changes[0]?.index, 2, 'tab-change detail.index');
    problems.equal(changes[0]?.oldIndex, 0, 'tab-change detail.oldIndex');
    problems.equal(changes[0]?.panel, panelsOf(el)[2], 'tab-change detail.panel');

    expectClean(problems, 'smoke/events');
  });

  it('a closable tab emits tab-close without selecting itself', async () => {
    el = await makeTabs(spec({
      tabs: THREE_TABS.map((t, i) => (i === 2 ? { ...t, closable: true } : t)),
    }));
    const problems = new Problems();
    const closes = captureEvents<{ tab: HTMLElement }>(el, 'tab-close');

    clickClose(tabsOf(el)[2]);
    await wait(40);

    problems.equal(closes.length, 1, 'tab-close count');
    problems.equal(closes[0]?.tab, tabsOf(el)[2], 'tab-close detail.tab');
    problems.equal((el as any).selected, 0, 'the close button moved the selection');

    expectClean(problems, 'smoke/close');
  });

  it('a disabled tab is inert', async () => {
    el = await makeTabs(spec({
      tabs: THREE_TABS.map((t, i) => (i === 1 ? { ...t, disabled: true } : t)),
    }));
    const problems = new Problems();
    const selects = captureEvents(el, 'tab-select');

    clickTab(tabsOf(el)[1]);
    await wait(40);

    problems.equal(selects.length, 0, 'tab-select events from a disabled tab');
    problems.equal(visiblePanels(el), [0], 'a disabled tab moved the panel');

    expectClean(problems, 'smoke/disabled');
  });

  it('getTab and getPanel address the right elements', async () => {
    el = await makeTabs(spec());
    const problems = new Problems();

    problems.equal((el as any).getTab(1), tabsOf(el)[1], 'getTab(1)');
    problems.equal((el as any).getPanel(1), panelsOf(el)[1], 'getPanel(1)');
    problems.equal((el as any).getTab(9), undefined, 'getTab(9)');

    expectClean(problems, 'smoke/accessors');
  });
});
