/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-split-button matrix — fixtures and the documented-behaviour oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Read off `docs/ai/components/split-button.md` and
 * `packages/components/src/split-button/snice-split-button.types.ts`:
 *
 *   · `label` with the doc's own caveat — "slotted content wins:
 *     `<snice-split-button>Text</snice-split-button>`".
 *   · `actions: SplitButtonAction[]`, each `{ label, value, icon?, disabled? }`,
 *     and the doc's note that actions are "set via JS property (array), not
 *     child elements".
 *   · `variant` (5 values), `size` (3), `disabled`, `loading`, `outline`,
 *     `pill`, `icon` ("URL, image file, or emoji"), `iconPlacement`
 *     ('start' | 'end', attribute `icon-placement`).
 *   · Events: `primary-click` -> `{ button }`, `action-click` ->
 *     `{ value, action, button }`.
 *   · Parts: `spinner`, `base`, `primary`, `divider`, `toggle`, `menu`,
 *     `menu-items`, `action`.
 *   · Accessibility: "Menu closes on action click, outside click, or Escape
 *     key".
 *
 * ── On class names ──────────────────────────────────────────────────────────
 *
 * `variant`, `size`, `outline` and `pill` have no other observable consequence
 * in a DOM tier: the stylesheet selects on the root's modifier classes, so the
 * class set IS the mechanism by which a documented value reaches paint. The
 * oracle checks that the documented value produced its hook; what the hook
 * PAINTS belongs to the visual tier.
 */
import { shadow, text, part } from '../matrix-utils';
import '../../../packages/components/src/split-button/snice-split-button';
import type {
  SplitButtonAction, SplitButtonVariant, SplitButtonSize,
} from '../../../packages/components/src/split-button/snice-split-button.types';

export type { SplitButtonAction, SplitButtonVariant, SplitButtonSize };

// ── Documented value sets and defaults ──────────────────────────────────────

export const VARIANTS: readonly SplitButtonVariant[] =
  ['default', 'primary', 'success', 'warning', 'danger'];
export const SIZES: readonly SplitButtonSize[] = ['small', 'medium', 'large'];
export const PLACEMENTS = ['start', 'end'] as const;

export const DEFAULT_VARIANT: SplitButtonVariant = 'default';
export const DEFAULT_SIZE: SplitButtonSize = 'medium';

export const EVENTS = ['primary-click', 'action-click'] as const;

/** Every documented part that exists regardless of state. */
export const ALWAYS_PARTS = ['base', 'primary', 'divider', 'toggle', 'menu', 'menu-items'] as const;

export interface SplitButtonCombo {
  label: string;
  actions: SplitButtonAction[];
  variant: SplitButtonVariant;
  size: SplitButtonSize;
  disabled: boolean;
  loading: boolean;
  outline: boolean;
  pill: boolean;
  icon: string;
  iconPlacement: 'start' | 'end';
}

export const DEFAULTS: SplitButtonCombo = {
  label: '',
  actions: [],
  variant: DEFAULT_VARIANT,
  size: DEFAULT_SIZE,
  disabled: false,
  loading: false,
  outline: false,
  pill: false,
  icon: '',
  iconPlacement: 'start',
};

export const splitButton = (overrides: Partial<SplitButtonCombo> = {}): SplitButtonCombo => ({
  ...DEFAULTS,
  ...overrides,
});

/** The doc's own example action list, including its disabled entry. */
export const ACTIONS: SplitButtonAction[] = [
  { value: 'save-draft', label: 'Save as Draft' },
  { value: 'save-template', label: 'Save as Template' },
  { value: 'discard', label: 'Discard', disabled: true },
];

export function attrsOf(c: SplitButtonCombo): Record<string, any> {
  const attrs: Record<string, any> = {
    variant: c.variant,
    size: c.size,
    'icon-placement': c.iconPlacement,
  };
  if (c.label) attrs.label = c.label;
  if (c.disabled) attrs.disabled = true;
  if (c.loading) attrs.loading = true;
  if (c.outline) attrs.outline = true;
  if (c.pill) attrs.pill = true;
  if (c.icon) attrs.icon = c.icon;
  return attrs;
}

export const propsOf = (c: SplitButtonCombo): Record<string, any> => ({ actions: c.actions });

export const comboId = (c: SplitButtonCombo): string =>
  `${c.variant}/${c.size}`
  + `${c.outline ? '/outline' : ''}${c.pill ? '/pill' : ''}`
  + `${c.loading ? '/loading' : ''}${c.disabled ? '/disabled' : ''}`
  + ` actions=${c.actions.length} icon=${c.icon ? c.iconPlacement : 'none'}`;

// ── Documented derivations ──────────────────────────────────────────────────

/** The stylesheet hooks a documented property vector must produce. */
export function expectedClasses(c: SplitButtonCombo): Set<string> {
  const classes = new Set(['split-button', `split-button--${c.variant}`, `split-button--${c.size}`]);
  if (c.outline) classes.add('split-button--outline');
  if (c.pill) classes.add('split-button--pill');
  if (c.loading) classes.add('split-button--loading');
  return classes;
}

// ── Reading ─────────────────────────────────────────────────────────────────

export interface RenderedAction {
  value: string | null;
  label: string;
  disabled: boolean;
  iconSrc: string | null;
  iconHidden: boolean;
  node: HTMLElement;
}

export interface Reading {
  parts: string[];
  base: HTMLElement | null;
  primary: HTMLButtonElement | null;
  toggle: HTMLButtonElement | null;
  menu: HTMLElement | null;
  spinner: HTMLElement | null;
  classes: Set<string>;
  labelText: string;
  slottedLabel: string;
  /** What a reader actually sees: projected light DOM, else the slot fallback. */
  visibleLabel: string;
  hasLabelSlot: boolean;
  primaryDisabled: boolean;
  toggleDisabled: boolean;
  expanded: string | null;
  open: boolean;
  actions: RenderedAction[];
  iconNodes: Element[];
}

export function read(el: HTMLElement): Reading {
  const root = shadow(el);
  const base = root.querySelector<HTMLElement>('.split-button');
  const primary = root.querySelector<HTMLButtonElement>('.split-button__primary');
  const toggle = root.querySelector<HTMLButtonElement>('.split-button__toggle');
  const menu = root.querySelector<HTMLElement>('.split-button__menu');
  const slot = root.querySelector<HTMLSlotElement>('.split-button__label slot');
  const slottedText = (slot?.assignedNodes?.({ flatten: true }) ?? [])
    .map(node => node.textContent ?? '').join('').replace(/\s+/g, ' ').trim();
  return {
    parts: [...ALWAYS_PARTS, 'spinner', 'action'].filter(name => !!part(el, name)),
    base,
    primary,
    toggle,
    menu,
    spinner: root.querySelector<HTMLElement>('.split-button__spinner'),
    classes: new Set((base?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)),
    labelText: text(root.querySelector('.split-button__label')),
    slottedLabel: slottedText,
    // A `<slot>` PROJECTS light DOM rather than copying it, so the shadow
    // tree's own textContent only ever reports the slot's FALLBACK. What the
    // reader sees is the projection when there is one, and the fallback
    // otherwise — which is exactly the doc's "slotted content wins".
    visibleLabel: slottedText || text(root.querySelector('.split-button__label')),
    hasLabelSlot: !!slot,
    primaryDisabled: !!primary?.hasAttribute('disabled'),
    toggleDisabled: !!toggle?.hasAttribute('disabled'),
    expanded: toggle?.getAttribute('aria-expanded') ?? null,
    open: !!menu?.classList.contains('split-button__menu--open'),
    actions: [...root.querySelectorAll<HTMLElement>('.split-button__action')].map(node => {
      const image = node.querySelector('img');
      return {
        value: node.getAttribute('data-value'),
        label: text(node.querySelector('.split-button__action-label')),
        disabled: node.hasAttribute('disabled'),
        iconSrc: image?.getAttribute('src') || null,
        iconHidden: !!image?.hasAttribute('hidden'),
        node,
      };
    }),
    iconNodes: [...root.querySelectorAll('.split-button__icon')],
  };
}

/** The rendered action carrying `value`, or null. */
export const actionByValue = (el: HTMLElement, value: string): RenderedAction | null =>
  read(el).actions.find(a => a.value === value) ?? null;

// ── Oracle ──────────────────────────────────────────────────────────────────

/** Every documented consequence of `c`, as a problem list. */
export function splitButtonProblems(el: HTMLElement, c: SplitButtonCombo): string[] {
  const problems: string[] = [];
  const say = (message: string) => problems.push(message);
  const r = read(el);

  // ── Parts that exist regardless of state ─────────────────────────────────
  for (const name of ALWAYS_PARTS) {
    if (!part(el, name)) say(`no [part="${name}"]`);
  }

  // ── Stylesheet hooks for the documented presentation properties ─────────
  const want = expectedClasses(c);
  const missing = [...want].filter(name => !r.classes.has(name));
  const extra = [...r.classes].filter(name => name.startsWith('split-button') && !want.has(name));
  if (missing.length) say(`root is missing classes ${JSON.stringify(missing)}`);
  if (extra.length) say(`root carries unexpected classes ${JSON.stringify(extra)}`);

  // ── loading gates the documented spinner part ───────────────────────────
  if (c.loading && !r.spinner) say('loading is true but no [part="spinner"] is rendered');
  if (!c.loading && r.spinner) say('loading is false but a spinner is rendered');

  // ── disabled ────────────────────────────────────────────────────────────
  //
  // A disabled split button offers neither of its two buttons; the doc's
  // `loading` state is the same promise in a different word — there is no
  // action to take while one is in flight.
  const inert = c.disabled || c.loading;
  if (r.primaryDisabled !== inert) {
    say(`primary button disabled=${r.primaryDisabled}, expected ${inert}`
      + ` (disabled=${c.disabled} loading=${c.loading})`);
  }
  if (r.toggleDisabled !== inert) {
    say(`toggle button disabled=${r.toggleDisabled}, expected ${inert}`);
  }

  // ── The label, and the doc's "slotted content wins" rule ────────────────
  //
  // The label region must expose a `<slot>` at all — without one there is no
  // way for slotted content to win — and the string a reader sees must be the
  // projection when there is one, the `label` property otherwise.
  if (!r.hasLabelSlot) say('the label region exposes no <slot>, so slotted content can never win');
  const wantLabel = r.slottedLabel !== '' ? r.slottedLabel : c.label;
  if (r.visibleLabel !== wantLabel) {
    say(`visible label "${r.visibleLabel}" != "${wantLabel}"`
      + ` (label="${c.label}", slotted="${r.slottedLabel}")`);
  }

  // ── icon and iconPlacement ──────────────────────────────────────────────
  if (c.icon && !c.loading) {
    if (r.iconNodes.length !== 1) {
      say(`icon "${c.icon}" set but ${r.iconNodes.length} icon nodes rendered`);
    } else if (r.primary) {
      const label = r.primary.querySelector('.split-button__label');
      const iconNode = r.iconNodes[0];
      const iconFirst = !!label
        && (iconNode.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      const wantIconFirst = c.iconPlacement === 'start';
      if (iconFirst !== wantIconFirst) {
        say(`iconPlacement="${c.iconPlacement}" but the icon renders`
          + ` ${iconFirst ? 'before' : 'after'} the label`);
      }
    }
  } else if (r.iconNodes.length > 0) {
    say(`no icon expected (icon="${c.icon}" loading=${c.loading}) but ${r.iconNodes.length} rendered`);
  }

  // ── actions ─────────────────────────────────────────────────────────────
  if (r.actions.length !== c.actions.length) {
    say(`rendered ${r.actions.length} actions, expected ${c.actions.length}`);
  } else {
    c.actions.forEach((action, i) => {
      const got = r.actions[i];
      if (got.value !== action.value) say(`action #${i} value "${got.value}" != "${action.value}"`);
      if (got.label !== action.label) say(`action #${i} label "${got.label}" != "${action.label}"`);
      const wantDisabled = !!action.disabled;
      if (got.disabled !== wantDisabled) {
        say(`action #${i} disabled=${got.disabled}, expected ${wantDisabled}`);
      }
      if (action.icon) {
        if (got.iconSrc !== action.icon) say(`action #${i} icon "${got.iconSrc}" != "${action.icon}"`);
        if (got.iconHidden) say(`action #${i} has an icon but it is hidden`);
      } else if (!got.iconHidden) {
        say(`action #${i} has no icon but an image is shown`);
      }
    });
  }
  if (c.actions.length > 0 && !part(el, 'action')) {
    say('actions were supplied but no [part="action"] is exposed');
  }

  // ── The toggle's menu state ─────────────────────────────────────────────
  if (r.expanded !== String(r.open)) {
    say(`aria-expanded is "${r.expanded}" while the menu is ${r.open ? 'open' : 'closed'}`);
  }

  return problems;
}
