/**
 * Shared harness for the snice-banner feature-combination matrix.
 *
 * The table matrix oracle pattern (tests/matrix/table/matrix-utils.ts):
 * one function derives the whole expectation from the DOCUMENTED contract, one
 * reads the rendered tree back, and a combo reports EVERY divergence at once.
 *
 * Everything asserted here comes from docs/ai/components/banner.md — never from
 * watching the component run:
 *
 *   · PARTS — "banner, icon, message, action, close". `action` exists exactly
 *     when `actionText` is set; `close` exactly when `dismissible` (default
 *     TRUE, which is unusual and worth crossing everywhere).
 *   · ACCESSIBILITY — the doc's own Accessibility section: `role="alert"` on the
 *     banner container and `aria-label="Close"` on the dismiss button. The
 *     accessible name of the region comes from `label`, "falls back to
 *     '<variant> banner'".
 *   · ICON PRECEDENCE — "icon — emoji, URL, image file" as a property, and the
 *     `icon` SLOT which "overrides the `icon` property AND the default variant
 *     icons". So there are three sources with a documented order: slot > icon
 *     property > per-variant default.
 *   · OPEN / POSITION — `:host([open])` and `:host([position="bottom"])` are the
 *     entire show/hide and placement contract in snice-banner.css, so those two
 *     properties MUST reach their attributes; an unreflected `open` is a banner
 *     that never appears.
 *   · EVENTS — `banner-open`, `banner-close`, `banner-action`, each with
 *     `{ banner }`; `show()`, `hide()`, `toggle()` are the documented methods.
 *   · DURATION — "ms until auto-dismiss once open, 0 = off; pauses on hover".
 */
import { expect } from 'vitest';
import { wait } from '../../components/test-utils';
import '../../../packages/components/src/banner/snice-banner';

export { wait };

export type Variant = 'info' | 'success' | 'warning' | 'error';
export type Position = 'top' | 'bottom';
/** Where the icon comes from — the three documented sources plus "none". */
export type IconMode = 'default' | 'emoji' | 'image' | 'slot';

export interface BannerCombo {
  id: string;
  variant: Variant;
  position: Position;
  dismissible: boolean;
  actionText: string;
  iconMode: IconMode;
  message: string;
  label: string;
  open: boolean;
}

/** The documented defaults, straight out of docs/ai/components/banner.md. */
export const DEFAULTS = {
  variant: 'info' as Variant,
  position: 'top' as Position,
  message: '',
  dismissible: true,
  icon: '',
  actionText: '',
  open: false,
  label: '',
  duration: 0,
};

export const VARIANTS: Variant[] = ['info', 'success', 'warning', 'error'];
export const POSITIONS: Position[] = ['top', 'bottom'];
export const ICON_MODES: IconMode[] = ['default', 'emoji', 'image', 'slot'];

export const CUSTOM_EMOJI = '🎉';
export const ICON_URL = '/icons/update.svg';
export const SLOT_ICON_TEXT = 'update';

/** The `icon` property a combo asks for, per its icon mode. */
export function iconFor(mode: IconMode): string {
  switch (mode) {
    case 'emoji': return CUSTOM_EMOJI;
    case 'image': return ICON_URL;
    // 'default' uses the per-variant built-in; 'slot' leaves the property
    // empty so the slot is genuinely overriding the DEFAULT icon, which is the
    // documented claim ("overrides `icon` property and the default variant
    // icons").
    default: return '';
  }
}

/**
 * The cross: variant x icon-source x dismissible = 4 * 4 * 2 = 32 combos, with
 * `position`, `action-text`, a custom `label` and `open` rotated across them.
 * That covers every documented variant against every documented icon source and
 * both states of the one property whose default is TRUE — which is where a
 * banner's render function actually branches. 32 sits in the "mid" band
 * .ai/fuzzing.md describes; the full product would be 512 for a component that
 * renders five nodes in a row.
 */
export function generateCombos(): BannerCombo[] {
  const combos: BannerCombo[] = [];
  let n = 0;
  for (const variant of VARIANTS) {
    for (const iconMode of ICON_MODES) {
      for (const dismissible of [true, false]) {
        const position: Position = n % 2 === 0 ? 'top' : 'bottom';
        const actionText = n % 3 === 1 ? 'Update Now' : '';
        const label = n % 5 === 2 ? 'Deployment status' : '';
        const open = n % 2 === 1;
        combos.push({
          id: `${variant}/icon:${iconMode}/${position}`
            + `/[${dismissible ? 'dismissible' : 'not-dismissible'}`
            + `${actionText ? ',action' : ''}${label ? ',label' : ''}`
            + `${open ? ',open' : ''}]`,
          variant, position, dismissible, actionText, iconMode,
          message: `${variant} message`, label, open,
        });
        n++;
      }
    }
  }
  return combos;
}

/**
 * Build a banner the way a page authors one: the light DOM is in place BEFORE
 * the element connects, then non-default PROPERTIES are assigned. Only
 * non-defaults, because the documented reflection rule is that untouched
 * defaults are not reflected — and `dismissible` defaults to TRUE, so "not
 * dismissible" is the value that has to travel.
 */
export async function makeBanner(combo: Partial<BannerCombo> & { duration?: number }): Promise<any> {
  const el = document.createElement('snice-banner') as any;
  if (combo.iconMode === 'slot') {
    el.innerHTML = `<span slot="icon" class="slotted-icon">${SLOT_ICON_TEXT}</span>`;
  }
  document.body.appendChild(el);
  await el.ready;

  const props: Record<string, unknown> = {
    variant: combo.variant,
    position: combo.position,
    message: combo.message,
    dismissible: combo.dismissible,
    actionText: combo.actionText,
    label: combo.label,
    duration: combo.duration,
    open: combo.open,
  };
  if (combo.iconMode !== undefined) props.icon = iconFor(combo.iconMode);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    if ((DEFAULTS as any)[key] === value) continue;
    el[key] = value;
  }
  await wait(20);
  return el;
}

export function partsNamed(el: any, name: string): HTMLElement[] {
  const sr = el.shadowRoot as ShadowRoot;
  return [...sr.querySelectorAll('[part]')].filter(node =>
    (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];
}

const textOf = (node: Element | null | undefined) =>
  (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

/** Attribute name for each documented property. */
const ATTRIBUTE_OF: Record<string, string> = {
  variant: 'variant',
  position: 'position',
  message: 'message',
  dismissible: 'dismissible',
  actionText: 'action-text',
  open: 'open',
  label: 'label',
};

export interface OracleOptions {
  fresh?: boolean;
}

/** Every divergence from the documented contract, collected at once. */
export function bannerProblems(
  el: any,
  combo: BannerCombo,
  { fresh = true }: OracleOptions = {},
): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);
  const sr = el.shadowRoot as ShadowRoot | null;
  if (!sr) return ['no shadow root'];

  const banners = partsNamed(el, 'banner');
  if (banners.length !== 1) {
    say(`${banners.length} elements carry part="banner", expected exactly 1`);
    return problems;
  }
  const banner = banners[0];

  // ── Accessibility, straight from the doc's own section ───────────────────
  if (banner.getAttribute('role') !== 'alert') {
    say(`part="banner" role is "${banner.getAttribute('role')}",`
      + ' documented as role="alert"');
  }
  // "label — accessible region name; falls back to '<variant> banner'"
  const wantLabel = combo.label || `${combo.variant} banner`;
  if (banner.getAttribute('aria-label') !== wantLabel) {
    say(`banner aria-label is "${banner.getAttribute('aria-label')}",`
      + ` expected "${wantLabel}"`);
  }

  // ── variant: the documented paint hook ──────────────────────────────────
  const classes = (banner.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  if (!classes.includes(`banner--${combo.variant}`)) {
    say(`variant="${combo.variant}" but the banner carries [${classes.join(' ')}]`);
  }
  for (const other of VARIANTS.filter(v => v !== combo.variant)) {
    if (classes.includes(`banner--${other}`)) {
      say(`variant="${combo.variant}" but banner--${other} is also applied`);
    }
  }

  // ── part="message" ──────────────────────────────────────────────────────
  const messages = partsNamed(el, 'message');
  if (messages.length !== 1) {
    say(`${messages.length} elements carry part="message", expected exactly 1`);
  } else if (textOf(messages[0]) !== combo.message) {
    say(`part="message" reads "${textOf(messages[0])}", expected "${combo.message}"`);
  }

  // ── part="icon": the documented three-source precedence ─────────────────
  const iconWrapper = [...banner.children].find(child =>
    (child.getAttribute('part') ?? '').split(/\s+/).includes('icon')) as HTMLElement | undefined;
  if (!iconWrapper) {
    say('no part="icon" wrapper inside part="banner"');
  } else {
    const slot = iconWrapper.querySelector('slot[name="icon"]') as HTMLSlotElement | null;
    if (!slot) {
      say('the icon wrapper has no <slot name="icon"> — the documented icon slot'
        + ' cannot be filled');
    } else {
      const assigned = slot.assignedNodes({ flatten: false })
        .map(node => (node.textContent ?? '').trim()).filter(Boolean);
      if (combo.iconMode === 'slot') {
        if (!assigned.includes(SLOT_ICON_TEXT)) {
          say(`a [slot="icon"] child was authored but the slot projects`
            + ` ${JSON.stringify(assigned)}`);
        }
        // The override is real only if everything it overrides — the icon
        // property's glyph AND the per-variant default — is fallback content
        // of that same slot, which a browser hides once the slot is filled.
        const outsideSlot = [...iconWrapper.childNodes]
          .filter(node => node !== slot)
          .map(node => (node.textContent ?? '').trim()).filter(Boolean).join(' ');
        if (outsideSlot || [...iconWrapper.children].some(c => c !== slot)) {
          say('the default/property icon is rendered OUTSIDE <slot name="icon">,'
            + ' so a slotted icon cannot override it');
        }
      } else {
        if (assigned.length) {
          say(`no [slot="icon"] child was authored, yet the slot projects`
            + ` ${JSON.stringify(assigned)}`);
        }
        if (combo.iconMode === 'image') {
          const img = iconWrapper.querySelector('img');
          if (!img) say(`icon="${ICON_URL}" is a URL but no <img> was rendered`);
          else if (img.getAttribute('src') !== ICON_URL) {
            say(`icon <img> src is "${img.getAttribute('src')}", expected "${ICON_URL}"`);
          }
        } else if (combo.iconMode === 'emoji') {
          if (!textOf(iconWrapper).includes(CUSTOM_EMOJI)) {
            say(`icon="${CUSTOM_EMOJI}" but the icon wrapper reads`
              + ` "${textOf(iconWrapper)}"`);
          }
        } else {
          // 'default': the documented per-variant icon. Every variant has one,
          // and it must be an SVG rather than nothing.
          if (!iconWrapper.querySelector('svg')) {
            say(`variant="${combo.variant}" with no icon property rendered no`
              + ' default variant icon');
          }
        }
      }
    }
  }

  // ── part="action": conditional on action-text ───────────────────────────
  const actions = partsNamed(el, 'action');
  if (combo.actionText) {
    if (actions.length !== 1) {
      say(`action-text set but ${actions.length} elements carry part="action"`);
    } else {
      if (textOf(actions[0]) !== combo.actionText) {
        say(`part="action" reads "${textOf(actions[0])}", expected "${combo.actionText}"`);
      }
      if (actions[0].getAttribute('type') !== 'button') {
        say(`the action button type is "${actions[0].getAttribute('type')}",`
          + ' expected "button"');
      }
    }
  } else if (actions.length !== 0) {
    say(`no action-text, yet ${actions.length} elements carry part="action"`);
  }

  // ── part="close": conditional on dismissible (which defaults TRUE) ──────
  const closes = partsNamed(el, 'close');
  if (combo.dismissible) {
    if (closes.length !== 1) {
      say(`dismissible but ${closes.length} elements carry part="close"`);
    } else if (closes[0].getAttribute('aria-label') !== 'Close') {
      say(`the close button aria-label is "${closes[0].getAttribute('aria-label')}",`
        + ' documented as "Close"');
    }
  } else if (closes.length !== 0) {
    say(`dismissible=false, yet ${closes.length} elements carry part="close"`);
  }

  // ── The default slot: "Additional content after the message" ───────────
  const defaultSlot = sr.querySelector('slot:not([name])');
  if (!defaultSlot) {
    say('no default <slot> — documented additional content has nowhere to go');
  } else if (messages.length === 1
    && !(messages[0].compareDocumentPosition(defaultSlot) & Node.DOCUMENT_POSITION_FOLLOWING)) {
    say('the default slot is rendered BEFORE the message, documented as after it');
  }

  // ── Reflection: `open` and `position` ARE the show/hide contract ────────
  for (const [key, attribute] of Object.entries(ATTRIBUTE_OF)) {
    const value = (combo as any)[key];
    if (value === undefined) continue;
    const isDefault = (DEFAULTS as any)[key] === value;
    const present = el.hasAttribute(attribute);
    if (isDefault) {
      if (present && fresh && typeof value !== 'boolean') {
        say(`${key} left at its default but [${attribute}]`
          + `="${el.getAttribute(attribute)}" was written anyway`);
      }
      if (present && !fresh && typeof value !== 'boolean'
        && el.getAttribute(attribute) !== String(value)) {
        say(`[${attribute}] still reads "${el.getAttribute(attribute)}" after`
          + ` ${key} returned to its default ${JSON.stringify(value)}`);
      }
      continue;
    }
    if (typeof value === 'boolean') {
      // `open` and `dismissible` are boolean attributes: present means true.
      if (value && !present) {
        say(`${key}=true assigned but [${attribute}] never reflected —`
          + ' :host([open]) is the whole show/hide rule');
      }
      if (!value && present && el.getAttribute(attribute) !== 'false') {
        say(`${key}=false but [${attribute}] is present as`
          + ` "${el.getAttribute(attribute)}"`);
      }
      continue;
    }
    if (!present) {
      say(`${key}=${JSON.stringify(value)} assigned as a property but`
        + ` [${attribute}] never reflected`);
      continue;
    }
    if (el.getAttribute(attribute) !== String(value)) {
      say(`[${attribute}] reflected "${el.getAttribute(attribute)}",`
        + ` expected "${String(value)}"`);
    }
  }

  return problems;
}

/** Assert one combo against the oracle. */
export function expectBanner(el: any, combo: BannerCombo, options?: OracleOptions): void {
  expect(bannerProblems(el, combo, options), `combo ${combo.id}`).toEqual([]);
}
