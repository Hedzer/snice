/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the snice-tabs matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything asserted here is read off `docs/ai/components/tabs.md` and
 * `snice-tabs.types.ts`:
 *
 *   snice-tabs        selected: number = 0
 *                     placement: top|bottom|start|end = 'top'
 *                     noScrollControls: boolean = false   (attr: no-scroll-controls)
 *                     transition: string = 'none'
 *   snice-tab         disabled: boolean, closable: boolean
 *   snice-tab-panel   name: string
 *   methods           selectTab(index), show(index), getTab(index), getPanel(index)
 *   events            tab-change → { index, oldIndex, tab, panel }
 *                     tab-select → { tab }
 *                     tab-close  → { tab }
 *   slots             `nav` (snice-tab elements), (default) (snice-tab-panel elements)
 *   parts             label, close, base, nav-container, nav, indicator,
 *                     scroll-button, scroll-button-start, scroll-button-end, panels
 *
 * ── A deliberate boundary ───────────────────────────────────────────────────
 *
 * `docs/ai/components/tabs.md` has NO accessibility section and NO keyboard
 * section — unlike, say, modal.md, which promises `role="dialog"`, a focus trap
 * and an Escape key. So this oracle asserts nothing about `role="tablist"`,
 * `aria-selected`, `aria-controls`, the roving `tabindex`, or arrow-key
 * navigation. The component implements all of it, and a matrix that asserted it
 * anyway would be deriving expectations from observed output, which
 * `.ai/fuzzing.md` forbids. (Those claims ARE asserted for the components whose
 * docs make them.) If the doc grows an accessibility section, this oracle is
 * where the assertions belong.
 *
 * The `indicator` bar, the four placements' geometry and the scroll buttons'
 * overflow behaviour are PAINT, and belong to the visual tier
 * (tests/live/matrix/tabs/).
 */
import { Problems, text } from '../matrix-kit';
import { exactPart, exactParts } from '../part-exact';
import type { TabsPlacement } from '../../../packages/components/src/tabs/snice-tabs.types';

export type { TabsPlacement };

export const PLACEMENTS: TabsPlacement[] = ['top', 'bottom', 'start', 'end'];

/** One tab/panel pair a combo authors. */
export interface TabSpec {
  label: string;
  content: string;
  disabled?: boolean;
  closable?: boolean;
  name?: string;
}

export interface TabsSpec {
  placement: TabsPlacement;
  selected: number;
  noScrollControls: boolean;
  transition: string;
  tabs: TabSpec[];
}

export const THREE_TABS: TabSpec[] = [
  { label: 'Overview', content: 'The overview panel.', name: 'overview' },
  { label: 'Details', content: 'The details panel.', name: 'details' },
  { label: 'History', content: 'The history panel.', name: 'history' },
];

export const FIVE_TABS: TabSpec[] = [
  ...THREE_TABS,
  { label: 'Settings', content: 'The settings panel.', name: 'settings' },
  { label: 'Danger', content: 'The danger panel.', name: 'danger' },
];

export function spec(overrides: Partial<TabsSpec> = {}): TabsSpec {
  return {
    placement: 'top',
    selected: 0,
    noScrollControls: false,
    transition: 'none',
    tabs: THREE_TABS,
    ...overrides,
  };
}

/**
 * Mount a combo the way the doc's own example authors it: `<snice-tab
 * slot="nav">` buttons and `<snice-tab-panel>` panels as light-DOM children,
 * in place BEFORE connection.
 *
 * The order matters — the container reads its tabs and panels on `@ready` and
 * wires the selection from there. A page delivers the children with the
 * element, and so does this.
 */
export async function makeTabs(s: TabsSpec): Promise<HTMLElement> {
  const el = document.createElement('snice-tabs');
  el.setAttribute('placement', s.placement);
  el.setAttribute('selected', String(s.selected));
  if (s.noScrollControls) el.setAttribute('no-scroll-controls', '');
  if (s.transition !== 'none') el.setAttribute('transition', s.transition);

  el.innerHTML = [
    ...s.tabs.map(tab => `<snice-tab slot="nav"${tab.disabled ? ' disabled' : ''}`
      + `${tab.closable ? ' closable' : ''}>${tab.label}</snice-tab>`),
    ...s.tabs.map(tab => `<snice-tab-panel${tab.name ? ` name="${tab.name}"` : ''}>`
      + `${tab.content}</snice-tab-panel>`),
  ].join('');

  document.body.appendChild(el);
  await (el as any).ready;
  // Every tab and panel is its own custom element; wait for all of them before
  // asking the container what it wired up.
  await Promise.all([...el.children].map(child => (child as any).ready ?? Promise.resolve()));
  await new Promise(resolve => setTimeout(resolve, 40));
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export const basePart = (el: HTMLElement) => exactPart(el, 'base');
export const navPart = (el: HTMLElement) => exactPart(el, 'nav');
export const navContainerPart = (el: HTMLElement) => exactPart(el, 'nav-container');
export const indicatorPart = (el: HTMLElement) => exactPart(el, 'indicator');
export const panelsPart = (el: HTMLElement) => exactPart(el, 'panels');
export const scrollButtons = (el: HTMLElement) => exactParts(el, 'scroll-button');
export const scrollButtonStart = (el: HTMLElement) => exactPart(el, 'scroll-button-start');
export const scrollButtonEnd = (el: HTMLElement) => exactPart(el, 'scroll-button-end');

/** The `<snice-tab>` elements, in document order. */
export const tabsOf = (el: HTMLElement): HTMLElement[] =>
  [...el.querySelectorAll<HTMLElement>('snice-tab[slot="nav"]')];

/** The `<snice-tab-panel>` elements, in document order. */
export const panelsOf = (el: HTMLElement): HTMLElement[] =>
  [...el.querySelectorAll<HTMLElement>('snice-tab-panel')];

/** A tab's own `label` part — the region the doc names for its text. */
export const labelPartOf = (tab: HTMLElement) => exactPart(tab, 'label');

/** A tab's own `close` part — present only on a closable tab. */
export const closePartOf = (tab: HTMLElement) => exactPart(tab, 'close');

/** Which panels are currently showing, by index. */
export const visiblePanels = (el: HTMLElement): number[] =>
  panelsOf(el).flatMap((panel, i) => ((panel as any).hidden ? [] : [i]));

/** Click a tab the way a pointer does — on the tab's own base region. */
export function clickTab(tab: HTMLElement): void {
  const base = exactPart(tab, 'base') ?? tab;
  base.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

/** Click a closable tab's close button. */
export function clickClose(tab: HTMLElement): void {
  const close = closePartOf(tab);
  close?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

// ── The structural oracle ───────────────────────────────────────────────────

export function checkTabs(el: HTMLElement, s: TabsSpec, problems: Problems): void {
  // ── The regions the doc lists as parts ───────────────────────────────────
  problems.check(basePart(el) !== null, 'no [part="base"]');
  problems.check(navContainerPart(el) !== null, 'no [part="nav-container"]');
  problems.check(navPart(el) !== null, 'no [part="nav"]');
  problems.check(indicatorPart(el) !== null, 'no [part="indicator"]');
  problems.check(panelsPart(el) !== null, 'no [part="panels"]');

  // Documented: `noScrollControls` takes the scroll arrows away.
  problems.equal(scrollButtons(el).length, s.noScrollControls ? 0 : 2, '[part="scroll-button"] count');
  problems.equal(scrollButtonStart(el) !== null, !s.noScrollControls, '[part="scroll-button-start"]');
  problems.equal(scrollButtonEnd(el) !== null, !s.noScrollControls, '[part="scroll-button-end"]');

  // ── The tabs and their labels ────────────────────────────────────────────
  const tabs = tabsOf(el);
  problems.equal(tabs.length, s.tabs.length, 'tab count');
  tabs.forEach((tab, i) => {
    const documented = s.tabs[i];
    if (!documented) return;
    // The doc names `label` as the tab's text region; the text itself is
    // slotted, so the region has to project it.
    const label = labelPartOf(tab);
    if (problems.check(label !== null, `tab ${i} has no [part="label"]`)) {
      const slot = label!.querySelector('slot') as HTMLSlotElement | null;
      const projected = (slot?.assignedNodes({ flatten: false }) ?? [])
        .map(node => node.textContent ?? '').join('').replace(/\s+/g, ' ').trim();
      problems.equal(projected, documented.label, `tab ${i} label`);
    }
    // Documented: `closable` renders the `close` part, and nothing else does.
    problems.equal(closePartOf(tab) !== null, !!documented.closable, `tab ${i} [part="close"]`);
    problems.equal((tab as any).disabled, !!documented.disabled, `tab ${i} disabled property`);
  });

  // ── The panels ───────────────────────────────────────────────────────────
  const panels = panelsOf(el);
  problems.equal(panels.length, s.tabs.length, 'panel count');
  panels.forEach((panel, i) => {
    const documented = s.tabs[i];
    if (!documented) return;
    if (documented.name !== undefined) {
      problems.equal((panel as any).name, documented.name, `panel ${i} name`);
    }
    problems.check(text(panel).includes(documented.content), `panel ${i} content`);
  });

  // Exactly one panel is showing, and it is the selected one. That is the
  // whole point of "Tabbed interface with tab buttons and content panels".
  problems.equal(visiblePanels(el), [s.selected], 'the visible panel');

  problems.equal((el as any).selected, s.selected, 'selected property');
  problems.equal((el as any).placement, s.placement, 'placement property');
}
