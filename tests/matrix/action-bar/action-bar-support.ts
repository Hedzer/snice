/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-action-bar — matrix oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Derived from `docs/ai/components/action-bar.md` and
 * `snice-action-bar.types.ts`:
 *
 *   · `open`, `position` (8 values), `size` (small|medium),
 *     `variant` (default|pill), `label` ("accessible name announced for the
 *     toolbar", default "Actions"), `no-animation`, `no-escape-dismiss`.
 *   · `show()` / `hide()` / `toggle()`.
 *   · `action-bar-open` / `action-bar-close` → `{ actionBar }`.
 *   · default slot — "Action content (buttons, icons, etc.)".
 *   · CSS part `base` — "The inner toolbar container".
 *   · Keyboard: "Arrow keys navigate focusable children (roving tabindex)",
 *     "`Escape` closes unless `no-escape-dismiss`", "`Home`/`End` jump to
 *     first/last", `role="toolbar"` with `aria-label`.
 */
import { mount, one, all, part, wait, expectNoProblems } from '../matrix-utils';
import '../../../packages/components/src/action-bar/snice-action-bar';

export { wait, expectNoProblems };

/** Every documented `position`. */
export const POSITIONS = [
  'top', 'bottom', 'left', 'right',
  'top-left', 'top-right', 'bottom-left', 'bottom-right',
] as const;

export const SIZES = ['small', 'medium'] as const;
export const VARIANTS = ['default', 'pill'] as const;

export type Position = typeof POSITIONS[number];

/** Light-DOM action sets — "buttons, icons, etc." */
export const CONTENT = {
  three: '<button id="a">Edit</button><button id="b">Copy</button><button id="c">Delete</button>',
  one: '<button id="a">Edit</button>',
  none: '',
  withDisabled: '<button id="a">Edit</button><button id="b" disabled>Copy</button><button id="c">Delete</button>',
  mixed: '<button id="a">Edit</button><a id="b" href="#x">Open</a><span id="c">Label</span><input id="d">',
} as const;

export interface ActionBarCombo {
  open: boolean;
  position: Position;
  size: 'small' | 'medium';
  variant: 'default' | 'pill';
  label?: string;
  noAnimation: boolean;
  noEscapeDismiss: boolean;
  content: keyof typeof CONTENT;
}

export function combo(over: Partial<ActionBarCombo> = {}): ActionBarCombo {
  return {
    open: false,
    position: 'bottom',
    size: 'medium',
    variant: 'default',
    noAnimation: false,
    noEscapeDismiss: false,
    content: 'three',
    ...over,
  };
}

export function comboName(c: ActionBarCombo): string {
  const flags = [
    c.open ? 'open' : 'closed',
    ...(c.noAnimation ? ['no-animation'] : []),
    ...(c.noEscapeDismiss ? ['no-escape-dismiss'] : []),
  ];
  return `${c.position}/${c.size}/${c.variant}/${c.content}/[${flags.join(',')}]`;
}

export async function makeActionBar(c: ActionBarCombo): Promise<any> {
  const el = await mount<any>('snice-action-bar', {
    position: c.position,
    size: c.size,
    variant: c.variant,
    ...(c.label !== undefined ? { label: c.label } : {}),
    ...(c.open ? { open: true } : {}),
    ...(c.noAnimation ? { 'no-animation': true } : {}),
    ...(c.noEscapeDismiss ? { 'no-escape-dismiss': true } : {}),
  }, CONTENT[c.content]);
  // `@ready` arms the roving tabindex and flips the transition guard on a 10ms
  // timer; every documented keyboard behaviour depends on that having run.
  await wait(40);
  return el;
}

// ── Documented derivations ──────────────────────────────────────────────────

/**
 * The children the roving tabindex is documented to walk: "focusable children".
 * A `disabled` control is not focusable, and a plain `<span>` is not either.
 */
export function expectedFocusables(content: keyof typeof CONTENT): string[] {
  switch (content) {
    case 'three': return ['a', 'b', 'c'];
    case 'one': return ['a'];
    case 'none': return [];
    case 'withDisabled': return ['a', 'c'];
    case 'mixed': return ['a', 'b', 'd'];
  }
}

// ── Reading the rendered bar ────────────────────────────────────────────────

export function toolbar(el: HTMLElement): HTMLElement | null {
  return part<HTMLElement>(el, 'base');
}

export function projected(el: HTMLElement): HTMLElement[] {
  const slot = one<HTMLSlotElement>(el, 'slot');
  return slot ? (slot.assignedElements({ flatten: true }) as HTMLElement[]) : [];
}

/** The `id`s carrying `tabindex="0"` — the single roving stop. */
export function rovingStops(el: HTMLElement): string[] {
  return [...el.children]
    .filter(child => child.getAttribute('tabindex') === '0')
    .map(child => child.id);
}

export function tabindexOf(el: HTMLElement, id: string): string | null {
  return el.querySelector(`#${id}`)?.getAttribute('tabindex') ?? null;
}

/**
 * The oracle every structural combo runs through.
 */
export function checkBar(el: HTMLElement, c: ActionBarCombo): string[] {
  const problems: string[] = [];

  const base = toolbar(el);
  if (!base) {
    problems.push('part="base" missing');
    return problems;
  }
  if (base.getAttribute('role') !== 'toolbar') {
    problems.push(`role="${base.getAttribute('role')}", expected "toolbar"`);
  }
  const wantLabel = c.label ?? 'Actions';
  if (base.getAttribute('aria-label') !== wantLabel) {
    problems.push(`aria-label "${base.getAttribute('aria-label')}", expected "${wantLabel}"`);
  }

  // The property vector the element reports back.
  const state = el as any;
  if (state.open !== c.open) problems.push(`open=${state.open}, expected ${c.open}`);
  if (state.position !== c.position) problems.push(`position="${state.position}", expected "${c.position}"`);
  if (state.size !== c.size) problems.push(`size="${state.size}", expected "${c.size}"`);
  if (state.variant !== c.variant) problems.push(`variant="${state.variant}", expected "${c.variant}"`);
  if (state.noAnimation !== c.noAnimation) {
    problems.push(`noAnimation=${state.noAnimation}, expected ${c.noAnimation}`);
  }
  if (state.noEscapeDismiss !== c.noEscapeDismiss) {
    problems.push(`noEscapeDismiss=${state.noEscapeDismiss}, expected ${c.noEscapeDismiss}`);
  }
  if (el.hasAttribute('open') !== c.open) {
    problems.push(`host [open]=${el.hasAttribute('open')}, expected ${c.open}`);
  }

  // The default slot projects the action content.
  const wantChildren = [...el.children].map(child => child.id).filter(Boolean);
  const gotChildren = projected(el).map(child => child.id).filter(Boolean);
  if (gotChildren.join(',') !== wantChildren.join(',')) {
    problems.push(`slotted [${gotChildren.join(',')}] != authored [${wantChildren.join(',')}]`);
  }
  if (all(el, 'slot').length !== 1) {
    problems.push(`${all(el, 'slot').length} slots, expected 1 default slot`);
  }

  // Roving tabindex: exactly one focusable child is the tab stop.
  const focusables = expectedFocusables(c.content);
  const stops = rovingStops(el);
  if (focusables.length === 0) {
    if (stops.length) problems.push(`tabindex="0" on [${stops.join(',')}] with no focusable children`);
  } else if (stops.length !== 1) {
    problems.push(`${stops.length} roving tab stops ([${stops.join(',')}]), expected exactly 1`);
  } else if (!focusables.includes(stops[0])) {
    problems.push(`roving tab stop is "${stops[0]}", not a focusable child`);
  }
  for (const id of focusables) {
    const value = tabindexOf(el, id);
    if (value !== '0' && value !== '-1') {
      problems.push(`focusable child "${id}" has tabindex="${value}" — outside the roving pair`);
    }
  }

  return problems;
}

// ── Interaction ─────────────────────────────────────────────────────────────

export function press(el: HTMLElement, key: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
}

export interface Recorded { type: string; detail: any }

export function record(el: HTMLElement): Recorded[] {
  const seen: Recorded[] = [];
  for (const type of ['action-bar-open', 'action-bar-close']) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

export function focusChild(el: HTMLElement, id: string): void {
  el.querySelector<HTMLElement>(`#${id}`)?.focus();
}

export function activeId(): string {
  return (document.activeElement as HTMLElement | null)?.id ?? '';
}
