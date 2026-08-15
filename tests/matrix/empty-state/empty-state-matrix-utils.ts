/**
 * Shared harness for the snice-empty-state feature-combination matrix.
 *
 * The table matrix oracle pattern (tests/matrix/table/matrix-utils.ts):
 * one function derives the whole expectation from the DOCUMENTED contract, one
 * reads the rendered tree back, and a combo reports EVERY divergence at once.
 *
 * Everything asserted here comes from docs/ai/components/empty-state.md — never
 * from watching the component run:
 *
 *   · PARTS — "container, icon, title, description, action". The conditional
 *     ones are conditional on their own property: `description` exists when
 *     `description` is set, `action` when `actionText` is set.
 *   · ACTION SHAPE — the documented examples show `action-text` alone giving a
 *     button and `action-text` + `action-href` giving a link ("With link").
 *     A link must carry the href it was given.
 *   · EVENT — "`empty-state-action` → `{ emptyState: SniceEmptyStateElement }`",
 *     fired from the action, whichever shape it took.
 *   · SLOTS — "`icon` — Custom icon content (OVERRIDES the `icon` property)" and
 *     "(default) — Custom content below the action button". A slotted icon must
 *     therefore win, and default-slot content must be projected.
 *   · SIZE — `size: 'small'|'medium'|'large'`, which snice-empty-state.css
 *     implements as the `empty-state--<size>` class on the container (it has no
 *     `:host([size])` rules at all), so the class is the styling contract.
 */
import { expect } from 'vitest';
import { wait } from '../../components/test-utils';
import '../../../packages/components/src/empty-state/snice-empty-state';

export { wait };

export type Size = 'small' | 'medium' | 'large';
/** none: no action at all · button: action-text only · link: + action-href. */
export type Action = 'none' | 'button' | 'link';
/**
 * How the icon is supplied. The docs give four shapes: the default emoji, a
 * custom emoji, an image URL ("emoji, URL, image file" — the banner's wording,
 * and the shared `renderIcon` utility this component uses), and the `icon`
 * SLOT, which is documented as overriding the property.
 */
export type IconMode = 'default' | 'emoji' | 'image' | 'slot';

export interface EmptyStateCombo {
  id: string;
  size: Size;
  action: Action;
  iconMode: IconMode;
  title: string;
  description: string;
  actionText: string;
  actionHref: string;
  /** Light-DOM content for the default slot. */
  extra: string;
}

/** The documented defaults, straight out of docs/ai/components/empty-state.md. */
export const DEFAULTS = {
  size: 'medium' as Size,
  icon: '📭',
  title: 'No data',
  description: '',
  actionText: '',
  actionHref: '',
};

export const SIZES: Size[] = ['small', 'medium', 'large'];
export const ACTIONS: Action[] = ['none', 'button', 'link'];
export const ICON_MODES: IconMode[] = ['default', 'emoji', 'image', 'slot'];

export const CUSTOM_EMOJI = '🔍';
export const ICON_URL = '/icons/empty.svg';
export const SLOT_ICON_TEXT = 'search_off';

/** The `icon` property value a combo asks for, per its icon mode. */
export function iconFor(mode: IconMode): string {
  switch (mode) {
    case 'default': return DEFAULTS.icon;
    case 'emoji': return CUSTOM_EMOJI;
    case 'image': return ICON_URL;
    // The property is left at its default so the SLOT override is what is
    // actually being tested: a slot that only wins over an empty property
    // would not be an override at all.
    case 'slot': return DEFAULTS.icon;
  }
}

/**
 * The cross: size x action-shape x icon-source = 3 * 3 * 4 = 36 combos, with
 * `description`, a custom `title` and default-slot content rotated across them.
 * That is the whole render function — every `<if>` and `<case>` branch it has,
 * against every documented value of the properties that drive them. 36 is the
 * "mid" band .ai/fuzzing.md describes; the full product with every title and
 * description variant would be several hundred for a component that renders
 * five nodes.
 */
export function generateCombos(): EmptyStateCombo[] {
  const combos: EmptyStateCombo[] = [];
  let n = 0;
  for (const size of SIZES) {
    for (const action of ACTIONS) {
      for (const iconMode of ICON_MODES) {
        const description = n % 2 === 0 ? '' : 'Try adjusting your search';
        const title = n % 3 === 2 ? 'No results found' : DEFAULTS.title;
        const extra = n % 4 === 1 ? '<span class="extra">extra content</span>' : '';
        const actionText = action === 'none' ? '' : 'Clear Search';
        const actionHref = action === 'link' ? '/home' : '';
        combos.push({
          id: `${size}/${action}/icon:${iconMode}`
            + `/[${description ? 'description' : 'no-description'}`
            + `${title !== DEFAULTS.title ? ',custom-title' : ''}`
            + `${extra ? ',slotted-extra' : ''}]`,
          size, action, iconMode, title, description, actionText, actionHref, extra,
        });
        n++;
      }
    }
  }
  return combos;
}

/**
 * Build an empty state the way a page authors one: the light DOM is in place
 * BEFORE the element connects (a slot that is filled after the first render is
 * a different, un-authored first paint), then non-default PROPERTIES are
 * assigned. Only non-defaults, because the documented reflection rule is that
 * untouched defaults are not reflected.
 */
export async function makeEmptyState(combo: Partial<EmptyStateCombo>): Promise<any> {
  const el = document.createElement('snice-empty-state') as any;
  const light: string[] = [];
  if (combo.iconMode === 'slot') {
    light.push(`<span slot="icon" class="slotted-icon">${SLOT_ICON_TEXT}</span>`);
  }
  if (combo.extra) light.push(combo.extra);
  if (light.length) el.innerHTML = light.join('');
  document.body.appendChild(el);
  await el.ready;

  const props: Record<string, unknown> = {
    size: combo.size,
    title: combo.title,
    description: combo.description,
    actionText: combo.actionText,
    actionHref: combo.actionHref,
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

/** Every element carrying the given part name, in document order. */
export function partsNamed(el: any, name: string): HTMLElement[] {
  const sr = el.shadowRoot as ShadowRoot;
  return [...sr.querySelectorAll('[part]')].filter(node =>
    (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];
}

const textOf = (node: Element | null | undefined) =>
  (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

/** Every divergence from the documented contract, collected at once. */
export function emptyStateProblems(el: any, combo: EmptyStateCombo): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);
  const sr = el.shadowRoot as ShadowRoot | null;
  if (!sr) return ['no shadow root'];

  const containers = partsNamed(el, 'container');
  if (containers.length !== 1) {
    say(`${containers.length} elements carry part="container", expected exactly 1`);
    return problems;
  }
  const container = containers[0];

  // ── size: the documented modifier class ─────────────────────────────────
  const classes = (container.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  if (!classes.includes(`empty-state--${combo.size}`)) {
    say(`size="${combo.size}" but the container carries [${classes.join(' ')}] —`
      + ` empty-state--${combo.size} is the only rule the stylesheet has for it`);
  }
  const otherSizes = SIZES.filter(s => s !== combo.size)
    .filter(s => classes.includes(`empty-state--${s}`));
  if (otherSizes.length) {
    say(`size="${combo.size}" but the container also carries`
      + ` ${otherSizes.map(s => `empty-state--${s}`).join(', ')}`);
  }

  // ── part="icon": the wrapper, per "icon — Icon wrapper" ──────────────────
  // The shared renderIcon utility re-exposes `part="icon"` on the glyph it
  // builds, so the WRAPPER is identified structurally (the container's own
  // child) rather than by being the only match.
  const iconWrapper = [...container.children].find(child =>
    (child.getAttribute('part') ?? '').split(/\s+/).includes('icon')) as HTMLElement | undefined;
  if (!iconWrapper) {
    say('no part="icon" wrapper inside part="container"');
  } else {
    const slot = iconWrapper.querySelector('slot[name="icon"]') as HTMLSlotElement | null;
    if (!slot) {
      say('the icon wrapper has no <slot name="icon"> — the documented icon slot'
        + ' cannot be filled');
    } else {
      const assigned = slot.assignedNodes({ flatten: false })
        .map(node => (node.textContent ?? '').trim())
        .filter(Boolean);
      if (combo.iconMode === 'slot') {
        // "icon — Custom icon content (overrides the `icon` property)"
        if (!assigned.includes(SLOT_ICON_TEXT)) {
          say(`a [slot="icon"] child was authored but the slot projects`
            + ` ${JSON.stringify(assigned)}`);
        }
        // The override is only real if the property's glyph is FALLBACK content
        // of that same slot — a browser hides a slot's fallback the moment the
        // slot has assigned nodes. A glyph rendered as a SIBLING of the slot
        // would paint next to the slotted icon forever, which is the failure
        // this checks for. (Reading "is the fallback painted?" directly is not
        // possible here: happy-dom performs no layout, so the visual tier owns
        // that half of the claim.)
        const outsideSlot = [...iconWrapper.childNodes]
          .filter(node => node !== slot)
          .map(node => (node.textContent ?? '').trim())
          .filter(Boolean)
          .join(' ');
        if (outsideSlot) {
          say(`the icon property's glyph is rendered OUTSIDE <slot name="icon">`
            + ` ("${outsideSlot}"), so a slotted icon cannot override it`);
        }
      } else {
        if (assigned.length) {
          say(`no [slot="icon"] child was authored, yet the slot projects`
            + ` ${JSON.stringify(assigned)}`);
        }
        const icon = iconFor(combo.iconMode);
        if (combo.iconMode === 'image') {
          // renderIcon's documented rule: a URL or image filename becomes an
          // <img>, everything else becomes text.
          const img = iconWrapper.querySelector('img');
          if (!img) say(`icon="${icon}" is a URL but no <img> was rendered`);
          else if (img.getAttribute('src') !== icon) {
            say(`icon <img> src is "${img.getAttribute('src')}", expected "${icon}"`);
          }
        } else if (!textOf(iconWrapper).includes(icon)) {
          say(`icon="${icon}" but the icon wrapper reads "${textOf(iconWrapper)}"`);
        }
      }
    }
  }

  // ── part="title": always present, reading the title property ────────────
  const titles = partsNamed(el, 'title');
  if (titles.length !== 1) {
    say(`${titles.length} elements carry part="title", expected exactly 1`);
  } else if (textOf(titles[0]) !== combo.title) {
    say(`part="title" reads "${textOf(titles[0])}", expected "${combo.title}"`);
  }

  // ── part="description": conditional on the property ─────────────────────
  const descriptions = partsNamed(el, 'description');
  if (combo.description) {
    if (descriptions.length !== 1) {
      say(`description set but ${descriptions.length} elements carry part="description"`);
    } else if (textOf(descriptions[0]) !== combo.description) {
      say(`part="description" reads "${textOf(descriptions[0])}",`
        + ` expected "${combo.description}"`);
    }
  } else if (descriptions.length !== 0) {
    say(`no description, yet ${descriptions.length} elements carry part="description"`);
  }

  // ── part="action": conditional, and shaped by action-href ───────────────
  const actions = partsNamed(el, 'action');
  if (combo.action === 'none') {
    if (actions.length !== 0) {
      say(`no action-text, yet ${actions.length} elements carry part="action"`);
    }
  } else if (actions.length !== 1) {
    say(`action-text set but ${actions.length} elements carry part="action"`);
  } else {
    const action = actions[0];
    if (textOf(action) !== combo.actionText) {
      say(`part="action" reads "${textOf(action)}", expected "${combo.actionText}"`);
    }
    if (combo.action === 'link') {
      if (action.tagName !== 'A') {
        say(`action-href set but part="action" is <${action.tagName.toLowerCase()}>,`
          + ' documented as a link');
      } else if (action.getAttribute('href') !== combo.actionHref) {
        say(`action link href is "${action.getAttribute('href')}",`
          + ` expected "${combo.actionHref}"`);
      }
    } else if (action.tagName !== 'BUTTON') {
      say(`no action-href, so part="action" should be a button, found`
        + ` <${action.tagName.toLowerCase()}>`);
    } else if (action.getAttribute('type') !== 'button') {
      // A bare <button> inside a form would submit it; the documented action is
      // an action, not a submit.
      say(`the action button type is "${action.getAttribute('type')}", expected "button"`);
    }
  }

  // ── The default slot: "Custom content below the action button" ──────────
  const defaultSlot = sr.querySelector('slot:not([name])') as HTMLSlotElement | null;
  if (!defaultSlot) {
    say('no default <slot> — documented custom content has nowhere to go');
  } else {
    // Nodes carrying a `slot` attribute belong to a NAMED slot and are excluded
    // here. A browser never assigns them to the default slot; happy-dom does
    // (it assigns a `slot="icon"` child to both), and that environment defect
    // must not be reported as a component finding. The visual tier asserts the
    // real assignment, where the browser's own slotting algorithm runs.
    const projected = defaultSlot.assignedNodes({ flatten: false })
      .filter(node => !(node instanceof Element && node.hasAttribute('slot')))
      .map(node => (node.textContent ?? '').trim()).filter(Boolean).join(' ');
    if (combo.extra && !projected.includes('extra content')) {
      say(`default-slot content was authored but the slot projects "${projected}"`);
    }
    if (!combo.extra && projected) {
      say(`nothing was authored for the default slot, yet it projects "${projected}"`);
    }
    // "below the action button" — ordering is part of the documented contract.
    if (actions.length === 1 && !(actions[0].compareDocumentPosition(defaultSlot)
      & Node.DOCUMENT_POSITION_FOLLOWING)) {
      say('the default slot is rendered ABOVE the action, documented as below it');
    }
  }

  return problems;
}

/** Assert one combo against the oracle. */
export function expectEmptyState(el: any, combo: EmptyStateCombo): void {
  expect(emptyStateProblems(el, combo), `combo ${combo.id}`).toEqual([]);
}
