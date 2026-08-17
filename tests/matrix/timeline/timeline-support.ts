/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the <snice-timeline> feature matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation below is read off `docs/ai/components/timeline.md` and
 * `snice-timeline.types.ts`, never off rendered output:
 *
 *   · four properties — `orientation` ('vertical'|'horizontal'),
 *     `position` ('left'|'right'|'alternate'), `items` (TimelineItem[]) and
 *     `reverse` (boolean). The first three are enumerations with a documented
 *     default; `reverse` is the one switch.
 *   · `reverse` is documented as `<snice-timeline reverse>` — a rendering
 *     order claim: the newest event first. The ITEMS PROPERTY is the caller's
 *     array and must not be mutated by the component to achieve it.
 *   · eight documented CSS parts: `container`, `item`, `marker`, `icon`,
 *     `content`, `timestamp`, `title`, `description`. `timestamp`,
 *     `description` and `icon` are optional fields of `TimelineItem`, so the
 *     parts that display them exist exactly when their field is non-empty —
 *     `title` is the only REQUIRED field, so its part is always present.
 *   · `variant` is documented per ITEM ('default'|'success'|'warning'|
 *     'error'|'info'), defaulting to 'default' when omitted. It is a marker
 *     styling claim, so it must reach the DOM as a class on the item.
 *   · `orientation` and `position` are host-level layout claims, so they must
 *     reach the DOM on the container.
 *
 * The component ships no attribute form for `items` (`attribute: false`), so
 * `items` crosses the property channel; `orientation`, `position` and
 * `reverse` are documented as attributes in the usage block and cross the
 * ATTRIBUTE channel here — `matrix-kit`'s `mount` drives both at once.
 */
import {
  Problems, all, cross, label, mount, one, part, parts, sr, text,
  type Combo, type Dimensions,
} from '../matrix-kit';
import { exactParts, hasPart } from '../part-exact';
import { ICONS as ICON_CATALOGUE } from '../../../packages/components/src/icons';
import '../../../packages/components/src/timeline/snice-timeline';

export type { Combo, Dimensions };

export const ORIENTATIONS = ['vertical', 'horizontal'] as const;
export const POSITIONS = ['left', 'right', 'alternate'] as const;
export const VARIANTS = ['default', 'success', 'warning', 'error', 'info'] as const;

export type Orientation = typeof ORIENTATIONS[number];
export type Position = typeof POSITIONS[number];
export type Variant = typeof VARIANTS[number];

export interface TimelineItem {
  timestamp?: string;
  title: string;
  description?: string;
  icon?: string;
  variant?: Variant;
}

/**
 * The doc's own example items, kept verbatim so the matrix measures the
 * timeline the documentation describes rather than one invented for testing.
 */
export const DOC_ITEMS: TimelineItem[] = [
  { timestamp: '2024-01-15', title: 'Created', description: 'Project started', variant: 'success' },
  { timestamp: '2024-02-01', title: 'Review', description: 'In review', variant: 'warning', icon: '!' },
  { timestamp: '2024-03-01', title: 'Launch', description: 'Deployed', variant: 'info' },
];

/**
 * Field shapes. `title` is the only required field of `TimelineItem`, so the
 * three optional ones are each independently present or absent — these are the
 * shapes that decide which of the optional parts must exist.
 */
export const SHAPES = {
  /** Everything the interface offers. */
  full: (n: number): TimelineItem => ({
    timestamp: `2024-0${n + 1}-01`, title: `Event ${n}`,
    description: `Detail ${n}`, icon: '★', variant: 'info',
  }),
  /** Only the required field. */
  bare: (n: number): TimelineItem => ({ title: `Event ${n}` }),
  /** Timestamped but undescribed. */
  stamped: (n: number): TimelineItem => ({ timestamp: `2024-0${n + 1}-01`, title: `Event ${n}` }),
  /** Described but undated. */
  described: (n: number): TimelineItem => ({ title: `Event ${n}`, description: `Detail ${n}` }),
} as const;

export type ShapeName = keyof typeof SHAPES;
export const SHAPE_NAMES = Object.keys(SHAPES) as ShapeName[];

/** `count` items of one shape. */
export function itemsOf(shape: ShapeName, count = 3): TimelineItem[] {
  return Array.from({ length: count }, (_, n) => SHAPES[shape](n));
}

export interface MountOptions {
  orientation?: Orientation;
  position?: Position;
  reverse?: boolean;
  items: TimelineItem[];
  /** Drive orientation/position/reverse as properties instead of attributes. */
  viaProperty?: boolean;
}

export async function mountTimeline(options: MountOptions): Promise<HTMLElement> {
  const { orientation, position, reverse, items, viaProperty } = options;
  const settings: Record<string, any> = {};
  if (orientation !== undefined) settings.orientation = orientation;
  if (position !== undefined) settings.position = position;
  if (reverse) settings.reverse = true;

  return viaProperty
    ? mount<HTMLElement>('snice-timeline', {}, { ...settings, items })
    : mount<HTMLElement>('snice-timeline', settings, { items });
}

/** Documented defaults, applied when a combo leaves a dimension unset. */
export function resolved(options: MountOptions): {
  orientation: Orientation; position: Position; reverse: boolean;
} {
  return {
    orientation: options.orientation ?? 'vertical',
    position: options.position ?? 'left',
    reverse: options.reverse ?? false,
  };
}

/** The order the doc promises: `reverse` shows the array back-to-front. */
export function expectedOrder(items: TimelineItem[], reverse: boolean): TimelineItem[] {
  return reverse ? [...items].reverse() : items;
}

/** Class tokens of a node. happy-dom's `classList` is not iterable. */
export function classesOf(node: Element | null | undefined): string[] {
  return (node?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

/**
 * The documented icon resolution order (docs/ai/components/icons.md):
 *
 *   `img://` / `text://` override → URL or path (https://, /, ./, ../, data:)
 *   → image filename with optional query → built-in catalogue name (inline
 *   SVG) → text (emoji, ligature)
 *
 * Written out here rather than imported from `renderIcon`, so the oracle
 * states the documented rule instead of echoing the implementation. The
 * catalogue itself is a documented public export (`snice/components/icons`),
 * so its NAMES are read from there — nothing else is.
 */
export function resolveIcon(icon: string): { kind: 'img' | 'svg' | 'text'; value: string } {
  if (icon.startsWith('img://')) return { kind: 'img', value: icon.slice(6) };
  if (icon.startsWith('text://')) return { kind: 'text', value: icon.slice(7) };
  if (/^(https?:\/\/|\/|\.\/|\.\.\/|data:)/.test(icon)) return { kind: 'img', value: icon };
  if (/\.(svg|png|jpe?g|gif|webp|avif|ico|bmp|tiff?)(\?.*)?$/i.test(icon)) {
    return { kind: 'img', value: icon };
  }
  if (Object.prototype.hasOwnProperty.call(ICON_CATALOGUE, icon)) {
    return { kind: 'svg', value: icon };
  }
  return { kind: 'text', value: icon };
}

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * Judge one mounted timeline against the documented contract. Collects EVERY
 * violation so a failing combo tells its whole story in one run.
 */
export function checkTimeline(el: HTMLElement, options: MountOptions): Problems {
  const problems = new Problems();
  const { orientation, position, reverse } = resolved(options);
  const expectedItems = expectedOrder(options.items, reverse);

  // ── container: the host-level layout claims must reach the DOM ────────────
  const container = part(el, 'container');
  if (!problems.check(!!container, 'no part="container"')) return problems;

  const classes = classesOf(container);
  problems.check(classes.includes('timeline'), `container classes ${classes.join(' ')} lack "timeline"`);
  problems.check(
    classes.includes(`timeline--${orientation}`),
    `orientation="${orientation}" did not reach the container (classes: ${classes.join(' ')})`,
  );
  problems.check(
    classes.includes(`timeline--${position}`),
    `position="${position}" did not reach the container (classes: ${classes.join(' ')})`,
  );
  problems.equal(
    classes.includes('timeline--reverse'), reverse,
    `container carries timeline--reverse (classes: ${classes.join(' ')})`,
  );
  // Exactly one orientation and one position class — a stale class from a
  // previous value would style the timeline as both at once.
  problems.equal(
    ORIENTATIONS.filter(o => classes.includes(`timeline--${o}`)).length, 1,
    'orientation classes on the container',
  );
  problems.equal(
    POSITIONS.filter(p => classes.includes(`timeline--${p}`)).length, 1,
    'position classes on the container',
  );

  // ── items: one part="item" per entry, in the documented order ─────────────
  const itemNodes = exactParts(el, 'item');
  if (!problems.equal(itemNodes.length, expectedItems.length, 'rendered item count')) {
    return problems;
  }
  itemNodes.forEach((node, index) => {
    checkItem(node, expectedItems[index], index, problems);
  });

  // `reverse` is a RENDERING claim; the caller's array is theirs.
  problems.equal(
    ((el as any).items as TimelineItem[]).map(item => item.title),
    options.items.map(item => item.title),
    'the items property after render (the component mutated the caller\'s array)',
  );

  return problems;
}

/** One item's documented anatomy. */
function checkItem(
  node: HTMLElement, item: TimelineItem, index: number, problems: Problems,
): void {
  const where = `item[${index}] "${item.title}"`;
  const variant = item.variant ?? 'default';

  const classes = classesOf(node);
  problems.check(
    classes.includes('timeline-item'),
    `${where}: classes ${classes.join(' ')} lack "timeline-item"`,
  );
  problems.check(
    classes.includes(`timeline-item--${variant}`),
    `${where}: variant "${variant}" did not reach the item (classes: ${classes.join(' ')})`,
  );
  problems.equal(
    VARIANTS.filter(v => classes.includes(`timeline-item--${v}`)).length, 1,
    `${where}: variant classes on the item`,
  );

  // ── marker + icon ────────────────────────────────────────────────────────
  const marker = [...node.querySelectorAll('[part]')].find(n => hasPart(n, 'marker'));
  problems.check(!!marker, `${where}: no part="marker"`);
  const icon = marker
    ? [...marker.querySelectorAll('[part]')].find(n => hasPart(n, 'icon'))
      ?? (hasPart(marker, 'icon') ? marker : undefined)
    : undefined;
  problems.check(!!icon, `${where}: no part="icon" inside the marker`);
  if (icon) {
    // Every variant has a documented marker glyph (docs/ai/components/icons.md
    // lists the timeline marker among the components with built-in defaults),
    // so an empty icon box is always wrong.
    const painted = icon.childElementCount > 0 || text(icon).length > 0;
    problems.check(painted, `${where}: the marker icon rendered nothing`);

    if (item.icon) {
      // The consumer icon wins over the variant default, resolved by the
      // documented precedence in docs/ai/components/icons.md:
      //   img:// / text:// override → URL or path → image filename →
      //   built-in catalogue name (inline SVG) → text (emoji, ligature)
      const resolution = resolveIcon(item.icon);
      if (resolution.kind === 'img') {
        const img = icon.querySelector('img');
        problems.check(!!img, `${where}: icon "${item.icon}" resolves to an <img>, none rendered`);
        if (img) problems.equal(img.getAttribute('src'), resolution.value, `${where}: icon src`);
      } else if (resolution.kind === 'svg') {
        problems.check(
          !!icon.querySelector('svg'),
          `${where}: catalogue icon "${item.icon}" did not render its inline SVG`,
        );
      } else {
        problems.equal(text(icon), resolution.value, `${where}: icon text`);
      }
    } else {
      // No consumer icon: the variant's own default glyph, which the catalogue
      // ships as inline SVG.
      problems.check(
        !!icon.querySelector('svg'),
        `${where}: variant "${variant}" rendered no default marker glyph`,
      );
    }
  }

  // ── content: timestamp?, title, description? ─────────────────────────────
  const content = [...node.querySelectorAll('[part]')].find(n => hasPart(n, 'content'));
  if (!problems.check(!!content, `${where}: no part="content"`)) return;

  const find = (name: string) =>
    [...content!.querySelectorAll('[part]')].find(n => hasPart(n, name)) as HTMLElement | undefined;

  const timestamp = find('timestamp');
  problems.equal(!!timestamp, !!item.timestamp, `${where}: part="timestamp" present`);
  if (item.timestamp && timestamp) {
    problems.equal(text(timestamp), item.timestamp, `${where}: timestamp text`);
  }

  const title = find('title');
  problems.check(!!title, `${where}: no part="title" — title is a required field`);
  if (title) problems.equal(text(title), item.title, `${where}: title text`);

  const description = find('description');
  problems.equal(!!description, !!item.description, `${where}: part="description" present`);
  if (item.description && description) {
    problems.equal(text(description), item.description, `${where}: description text`);
  }

  // Order inside the content box: timestamp, then title, then description.
  const order = [timestamp, title, description].filter(Boolean) as HTMLElement[];
  for (let i = 1; i < order.length; i++) {
    const before = order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING;
    problems.check(!!before, `${where}: content parts are out of document order`);
  }
}

// ── Dimension helpers re-exported so suites stay declarative ────────────────
export { Problems, all, cross, label, one, part, parts, sr, text };
