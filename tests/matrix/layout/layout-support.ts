/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-layout (and the twelve shell siblings) — matrix oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `docs/ai/components/layout.md` documents the family as a table of shells,
 * each with a fixed SLOT SET and a small option set:
 *
 *   · `snice-layout`               — brand, page, footer
 *   · `snice-layout-sidebar`       — brand, header, sidebar, page, footer
 *   · `snice-layout-dashboard`     — brand, header, toolbar, sidebar, page,
 *                                    right-sidebar
 *   · `snice-layout-blog`          — brand, nav, page, sidebar, footer
 *   · `snice-layout-centered`      — brand, page, footer   (width sm|md|lg|xl)
 *   · `snice-layout-split`         — left, right           (direction, ratio)
 *   · `snice-layout-landing`       — brand, nav, cta, hero, page, footer
 *                                    (use-nav)
 *   · `snice-layout-card`          — header, page, footer  (columns, gap)
 *   · `snice-layout-minimal`       — page
 *   · `snice-layout-fullscreen`    — background, overlay, page, controls
 *                                    (overlay)
 *   · `snice-layout-master-detail` — brand, header, list, detail, empty
 *                                    (selected; back emits `detail-closed`)
 *   · `snice-layout-docs`          — brand, header, sidebar, page, toc, footer
 *   · `snice-layout-auth-split`    — brand, page, footer, panel
 *                                    (panel-position end|start)
 *
 * plus two claims made about the family as a whole:
 *
 *   · "All regions are slots; all still take router `update()`."
 *   · "`contained` on any shell → sizes to parent instead."
 *
 * and the CSS parts the doc names: `base`, `header`, `brand`, `main`, `footer`,
 * `scrim` ("Overlay backdrop for the mobile sidebar"), `prose` ("Measured
 * article column (docs shell)") and `form` ("Form column (auth-split shell)").
 */
import { mount, one, all, wait, expectNoProblems } from '../matrix-utils';
import '../../../packages/components/src/layout/snice-layout';
import '../../../packages/components/src/layout/snice-layout-sidebar';
import '../../../packages/components/src/layout/snice-layout-dashboard';
import '../../../packages/components/src/layout/snice-layout-blog';
import '../../../packages/components/src/layout/snice-layout-centered';
import '../../../packages/components/src/layout/snice-layout-split';
import '../../../packages/components/src/layout/snice-layout-landing';
import '../../../packages/components/src/layout/snice-layout-card';
import '../../../packages/components/src/layout/snice-layout-minimal';
import '../../../packages/components/src/layout/snice-layout-fullscreen';
import '../../../packages/components/src/layout/snice-layout-master-detail';
import '../../../packages/components/src/layout/snice-layout-docs';
import '../../../packages/components/src/layout/snice-layout-auth-split';

export { wait, expectNoProblems, one, all };

export interface ShellSpec {
  tag: string;
  /** The documented slot set, in documentation order. */
  slots: string[];
  /** Documented option -> the documented default and the documented values. */
  options?: Record<string, { attribute: string; values: unknown[]; default: unknown }>;
  /** CSS parts the docs name for this shell specifically. */
  parts?: string[];
}

export const SHELLS: ShellSpec[] = [
  {
    tag: 'snice-layout',
    slots: ['brand', 'page', 'footer'],
    parts: ['base', 'header', 'brand', 'main', 'footer'],
  },
  {
    tag: 'snice-layout-sidebar',
    slots: ['brand', 'header', 'sidebar', 'page', 'footer'],
    parts: ['header', 'sidebar', 'scrim', 'main', 'footer'],
    options: {
      collapsed: { attribute: 'collapsed', values: [false, true], default: false },
      collapseMode: { attribute: 'collapse-mode', values: ['rail', 'offcanvas', 'none'], default: 'rail' },
    },
  },
  {
    tag: 'snice-layout-dashboard',
    slots: ['brand', 'header', 'toolbar', 'sidebar', 'page', 'right-sidebar'],
    parts: ['header', 'toolbar', 'sidebar', 'right-sidebar', 'scrim', 'main'],
    options: {
      collapsed: { attribute: 'collapsed', values: [false, true], default: false },
    },
  },
  { tag: 'snice-layout-blog', slots: ['brand', 'nav', 'page', 'sidebar', 'footer'] },
  {
    tag: 'snice-layout-centered',
    slots: ['brand', 'page', 'footer'],
    options: {
      width: { attribute: 'width', values: ['sm', 'md', 'lg', 'xl'], default: 'md' },
    },
  },
  {
    tag: 'snice-layout-split',
    slots: ['left', 'right'],
    options: {
      direction: { attribute: 'direction', values: ['horizontal', 'vertical'], default: 'horizontal' },
      ratio: { attribute: 'ratio', values: ['50-50', '60-40', '70-30', '33-67', '67-33'], default: '50-50' },
    },
  },
  {
    tag: 'snice-layout-landing',
    slots: ['brand', 'nav', 'cta', 'hero', 'page', 'footer'],
    options: {
      useNav: { attribute: 'use-nav', values: [false, true], default: false },
    },
  },
  {
    tag: 'snice-layout-card',
    slots: ['header', 'page', 'footer'],
    options: {
      columns: { attribute: 'columns', values: ['1', '2', '3', '4', '6'], default: '3' },
      gap: { attribute: 'gap', values: ['sm', 'md', 'lg', 'xl'], default: 'md' },
    },
  },
  { tag: 'snice-layout-minimal', slots: ['page'] },
  {
    tag: 'snice-layout-fullscreen',
    slots: ['background', 'overlay', 'page', 'controls'],
    options: {
      overlay: { attribute: 'overlay', values: [false, true], default: false },
    },
  },
  {
    tag: 'snice-layout-master-detail',
    slots: ['brand', 'header', 'list', 'detail', 'empty'],
    parts: ['header', 'list', 'detail', 'empty'],
    options: {
      selected: { attribute: 'selected', values: [false, true], default: false },
    },
  },
  {
    tag: 'snice-layout-docs',
    slots: ['brand', 'header', 'sidebar', 'page', 'toc', 'footer'],
    parts: ['header', 'sidebar', 'prose', 'toc', 'scrim', 'main', 'footer'],
  },
  {
    tag: 'snice-layout-auth-split',
    slots: ['brand', 'page', 'footer', 'panel'],
    parts: ['brand', 'page', 'footer', 'panel', 'form'],
    options: {
      panelPosition: { attribute: 'panel-position', values: ['end', 'start'], default: 'end' },
    },
  },
];

export function shell(tag: string): ShellSpec {
  const found = SHELLS.find(spec => spec.tag === tag);
  if (!found) throw new Error(`no documented shell "${tag}"`);
  return found;
}

/** Light DOM filling every documented region of a shell, one marker each. */
export function regionMarkup(spec: ShellSpec): string {
  return spec.slots
    .map(name => `<div slot="${name}" id="region-${name}">${name} region</div>`)
    .join('');
}

export async function makeShell(
  spec: ShellSpec,
  attrs: Record<string, any> = {},
  markup = regionMarkup(spec),
): Promise<any> {
  const el = await mount<any>(spec.tag, attrs, markup);
  await wait(30);
  return el;
}

// ── Oracle ──────────────────────────────────────────────────────────────────

/** The `<slot name="X">` for a documented region. */
export function slotFor(el: HTMLElement, name: string): HTMLSlotElement | null {
  return one<HTMLSlotElement>(el, `slot[name="${name}"]`);
}

/** The ids a region's slot actually projects. */
export function projectedIn(el: HTMLElement, name: string): string[] {
  const slot = slotFor(el, name);
  if (!slot) return [];
  return (slot.assignedElements({ flatten: true }) as HTMLElement[]).map(node => node.id);
}

/**
 * The oracle every shell combo runs through: every documented region is a slot,
 * every region projects the content authored into it, and every CSS part the
 * docs name for this shell exists.
 */
export function checkShell(el: HTMLElement, spec: ShellSpec): string[] {
  const problems: string[] = [];

  for (const name of spec.slots) {
    const slot = slotFor(el, name);
    if (!slot) {
      problems.push(`region "${name}" has no <slot name="${name}">`);
      continue;
    }
    const projected = projectedIn(el, name);
    if (!projected.includes(`region-${name}`)) {
      problems.push(`region "${name}" projects [${projected.join(',')}], not its authored content`);
    }
  }

  // No stray regions: a shell that renders a slot the docs never promised is a
  // documentation divergence just as much as a missing one.
  const rendered = all<HTMLSlotElement>(el, 'slot[name]')
    .map(slot => slot.getAttribute('name')!)
    .filter((name, index, list) => list.indexOf(name) === index);
  for (const name of rendered) {
    if (!spec.slots.includes(name)) problems.push(`undocumented region "${name}" rendered`);
  }

  for (const name of spec.parts ?? []) {
    if (!one(el, `[part~="${name}"]`)) problems.push(`part="${name}" missing`);
  }

  return problems;
}

// ── Interaction ─────────────────────────────────────────────────────────────

export function press(target: EventTarget, key: string, init: KeyboardEventInit = {}): void {
  target.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true, ...init,
  }));
}

export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

export function record(el: HTMLElement, types: string[]): Array<{ type: string; detail: any }> {
  const seen: Array<{ type: string; detail: any }> = [];
  for (const type of types) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}
