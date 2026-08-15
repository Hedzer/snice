/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-popover — matrix oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Derived from `docs/ai/components/popover.md` and `snice-popover.types.ts`:
 *
 *   · `open`, `placement` (12 values, default `bottom-end`), `distance` (px gap
 *     from the trigger), `no-outside-dismiss`, `no-escape-dismiss`;
 *   · `show()` / `hide()` / `toggle()`;
 *   · `popover-open` / `popover-close` → `{ popover }`;
 *   · slots `trigger` ("The element that toggles the panel (required)") and the
 *     default panel content;
 *   · CSS parts `trigger`, `panel`, `content`;
 *   · a11y: 'Trigger is `role="button"` with `aria-haspopup="dialog"` and
 *     reflective `aria-expanded`', 'Panel is `role="dialog"`, opens via the
 *     platform `popover="manual"` API', 'Outside-click and Escape close by
 *     default; opt out with `no-outside-dismiss` / `no-escape-dismiss`',
 *     'Focus is restored to the trigger when the panel closes via Escape'.
 *
 * `placement` and `distance` decide WHERE the panel lands, which happy-dom
 * cannot answer (it performs no layout, so every rect reads 0). The DOM tier
 * asserts that the placement reaches the rendered panel; the geometry it implies
 * belongs to `tests/live/matrix/popover`.
 */
import { mount, one, part, wait, expectNoProblems } from '../matrix-utils';
import '../../../packages/components/src/popover/snice-popover';

export { wait, expectNoProblems, one, part };

/** Every documented placement, default first. */
export const PLACEMENTS = [
  'bottom-end', 'bottom', 'bottom-start',
  'top', 'top-start', 'top-end',
  'left', 'left-start', 'left-end',
  'right', 'right-start', 'right-end',
] as const;

export type Placement = typeof PLACEMENTS[number];

export const TRIGGER_HTML = '<button slot="trigger" id="trigger">Open</button>';
export const PANEL_HTML = '<div id="panel-content"><h4>Filters</h4><input id="field"></div>';

export interface PopoverCombo {
  open: boolean;
  placement: Placement;
  distance?: number;
  noOutsideDismiss: boolean;
  noEscapeDismiss: boolean;
}

export function combo(over: Partial<PopoverCombo> = {}): PopoverCombo {
  return {
    open: false,
    placement: 'bottom-end',
    noOutsideDismiss: false,
    noEscapeDismiss: false,
    ...over,
  };
}

export function comboName(c: PopoverCombo): string {
  const flags = [
    c.open ? 'open' : 'closed',
    ...(c.noOutsideDismiss ? ['no-outside-dismiss'] : []),
    ...(c.noEscapeDismiss ? ['no-escape-dismiss'] : []),
  ];
  return `${c.placement}${c.distance !== undefined ? `/d${c.distance}` : ''}/[${flags.join(',')}]`;
}

export async function makePopover(c: PopoverCombo): Promise<any> {
  const el = await mount<any>('snice-popover', {
    placement: c.placement,
    ...(c.distance !== undefined ? { distance: c.distance } : {}),
    ...(c.open ? { open: true } : {}),
    ...(c.noOutsideDismiss ? { 'no-outside-dismiss': true } : {}),
    ...(c.noEscapeDismiss ? { 'no-escape-dismiss': true } : {}),
  }, `${TRIGGER_HTML}${PANEL_HTML}`);
  await wait(30);
  return el;
}

// ── Reading the rendered popover ────────────────────────────────────────────

export function trigger(el: HTMLElement): HTMLElement | null {
  return part<HTMLElement>(el, 'trigger');
}

export function panel(el: HTMLElement): HTMLElement | null {
  return part<HTMLElement>(el, 'panel');
}

export function content(el: HTMLElement): HTMLElement | null {
  return part<HTMLElement>(el, 'content');
}

export function slotted(el: HTMLElement, name?: string): string[] {
  const slot = one<HTMLSlotElement>(el, name ? `slot[name="${name}"]` : 'slot:not([name])');
  if (!slot) return ['∅ no slot'];
  return (slot.assignedElements({ flatten: true }) as HTMLElement[]).map(node => node.id);
}

/**
 * The oracle every structural combo runs through.
 */
export function checkPopover(el: HTMLElement, c: PopoverCombo): string[] {
  const problems: string[] = [];

  const triggerEl = trigger(el);
  const panelEl = panel(el);
  const contentEl = content(el);

  if (!triggerEl) problems.push('part="trigger" missing');
  if (!panelEl) problems.push('part="panel" missing');
  if (!contentEl) problems.push('part="content" missing');
  if (!triggerEl || !panelEl) return problems;

  // Trigger a11y contract.
  if (triggerEl.getAttribute('role') !== 'button') {
    problems.push(`trigger role="${triggerEl.getAttribute('role')}", expected "button"`);
  }
  if (triggerEl.getAttribute('aria-haspopup') !== 'dialog') {
    problems.push(`trigger aria-haspopup="${triggerEl.getAttribute('aria-haspopup')}", expected "dialog"`);
  }
  if (triggerEl.getAttribute('aria-expanded') !== String(c.open)) {
    problems.push(`trigger aria-expanded="${triggerEl.getAttribute('aria-expanded')}", expected "${c.open}"`);
  }
  if (triggerEl.getAttribute('tabindex') === null) {
    problems.push('trigger is not focusable — no tabindex');
  }

  // Panel a11y contract.
  if (panelEl.getAttribute('role') !== 'dialog') {
    problems.push(`panel role="${panelEl.getAttribute('role')}", expected "dialog"`);
  }
  if (panelEl.getAttribute('popover') !== 'manual') {
    problems.push(`panel popover="${panelEl.getAttribute('popover')}", expected "manual"`);
  }

  // The placement must reach the rendered panel — the stylesheet is keyed off it.
  const className = panelEl.getAttribute('class') ?? '';
  if (!className.split(/\s+/).includes(`popover__panel--${c.placement}`)) {
    problems.push(`panel does not carry placement "${c.placement}" (class "${className}")`);
  }
  // …and only that one.
  const others = PLACEMENTS.filter(placement => placement !== c.placement)
    .filter(placement => className.split(/\s+/).includes(`popover__panel--${placement}`));
  if (others.length) problems.push(`panel also carries placement(s) ${others.join(',')}`);

  // Slots project what was authored into them.
  const triggerSlot = slotted(el, 'trigger');
  if (!triggerSlot.includes('trigger')) {
    problems.push(`trigger slot projects [${triggerSlot.join(',')}]`);
  }
  const panelSlot = slotted(el);
  if (!panelSlot.includes('panel-content')) {
    problems.push(`panel slot projects [${panelSlot.join(',')}]`);
  }

  // The property vector the element reports back.
  const state = el as any;
  if (state.open !== c.open) problems.push(`open=${state.open}, expected ${c.open}`);
  if (state.placement !== c.placement) problems.push(`placement="${state.placement}", expected "${c.placement}"`);
  if (c.distance !== undefined && state.distance !== c.distance) {
    problems.push(`distance=${state.distance}, expected ${c.distance}`);
  }
  if (state.noOutsideDismiss !== c.noOutsideDismiss) {
    problems.push(`noOutsideDismiss=${state.noOutsideDismiss}, expected ${c.noOutsideDismiss}`);
  }
  if (state.noEscapeDismiss !== c.noEscapeDismiss) {
    problems.push(`noEscapeDismiss=${state.noEscapeDismiss}, expected ${c.noEscapeDismiss}`);
  }

  return problems;
}

// ── Interaction ─────────────────────────────────────────────────────────────

export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, cancelable: true }));
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

/** A pointer press somewhere else on the page — the outside-dismiss gesture. */
export function clickOutside(): void {
  const elsewhere = document.createElement('div');
  elsewhere.id = 'elsewhere';
  document.body.appendChild(elsewhere);
  elsewhere.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, cancelable: true }));
  elsewhere.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

export function press(node: EventTarget, key: string): void {
  node.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
}

export interface Recorded { type: string; detail: any }

export function record(el: HTMLElement): Recorded[] {
  const seen: Recorded[] = [];
  for (const type of ['popover-open', 'popover-close']) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}
