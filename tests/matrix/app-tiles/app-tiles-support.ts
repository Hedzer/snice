/**
 * Per-component oracle for the snice-app-tiles matrix.
 *
 * snice-app-tiles is a launcher grid: its contract is "render the authored
 * tile set with the right icon treatment, carry the style axes, and report
 * clicks". Everything encoded here comes from docs/ai/components/app-tiles.md,
 * snice-app-tiles.types.ts, snice-app-tiles.css, and the framework property
 * contract in docs/ai/properties.md:
 *
 *   · Two authoring channels, both documented as first-class in the doc's
 *     Basic Usage: DECLARATIVE (`<snice-app-tile name=… icon=… color=…
 *     href=… badge=…>` children, "Declarative child element. Attributes:
 *     name, icon, color, href, badge") and PROGRAMMATIC (`tiles: AppTile[]`,
 *     "Programmatic tile data (set via JS)" — `attribute: false` in the
 *     source, so it has no attribute form at all).
 *   · Documented defaults: `tiles = []`, `columns = 4`,
 *     `size: 'sm'|'md'|'lg'|'xl'|'2xl' = 'md'`,
 *     `variant: 'grid'|'list'|'compact' = 'grid'`.
 *   · Icon Resolution (doc, verbatim ladder): 1. no icon → letter fallback
 *     (first char of name, colored circle); 2. `img://` prefix or URL/path →
 *     `<img>`; 3. emoji (no ASCII letters) → emoji display; 4. ASCII text →
 *     Material Symbols ligature. CSS Parts names `icon` as "Material Symbols
 *     ligature icon span" — the part belongs to the ligature span ONLY; no
 *     other icon kind exposes it.
 *   · `color?: string; // Background color for letter/ligature fallback` —
 *     the doc scopes color to the letter and ligature treatments.
 *   · `badge?: string; // Badge content (uses snice-badge)` — a badged tile
 *     wraps its icon in a snice-badge carrying the badge content.
 *   · `tile-click -> { tile: AppTile, index: number }` is the component's
 *     only event; `href?: string; // Navigate on click` adds navigation on
 *     top of it (a safe href is opened in '_self').
 *   · variant/columns are NOT `:host([...])` axes: rebuild() paints them as
 *     a container modifier class (`tiles--list` / `tiles--compact`) and the
 *     `--tiles-columns` inline custom property that
 *     `grid-template-columns: repeat(var(--tiles-columns, 4), 1fr)` consumes
 *     (snice-app-tiles.css). `size` IS a `:host([size=…])` axis, so in this
 *     layout-free tier its observable contract is the attribute channel.
 *   · docs/ai/properties.md: "Reflect property setter changes to
 *     corresponding attributes unless `reflect: false`" and "Initial field
 *     values (defaults) are NOT reflected". A property assignment equal to
 *     the default is a setter no-op (no reflection); `false` booleans
 *     REMOVE their attribute. Hence: an authored attribute is always
 *     present, and a property assignment reflects exactly when it differs
 *     from the documented default (and is not boolean-false).
 */
import { mount, one, shadow, settle, type Shape } from '../matrix-utils';

export const VARIANTS = ['grid', 'list', 'compact'] as const;
export const SIZES = ['sm', 'md', 'lg', 'xl', '2xl'] as const;
export const COLUMNS_AXIS = [1, 2, 3, 5, 6, 8] as const;
export const CHANNELS = ['declarative', 'programmatic'] as const;
export const ICON_KINDS = ['letter', 'url', 'imgScheme', 'emoji', 'ligature'] as const;

export type Variant = typeof VARIANTS[number];
export type Size = typeof SIZES[number];
export type Channel = typeof CHANNELS[number];
export type IconKind = typeof ICON_KINDS[number];

import type { AppTile } from '../../../packages/components/src/app-tiles/snice-app-tiles.types';

/** Documented defaults, from docs/ai/components/app-tiles.md Properties. */
export const DEFAULTS = {
  columns: 4,
  size: 'md' as Size,
  variant: 'grid' as Variant,
};

export interface TilesCombo {
  variant: Variant;
  size: Size;
  columns: number;
  /** How the tile DATA is authored; style axes ride the matching channel. */
  channel: Channel;
}

/**
 * The canonical tile per documented icon treatment, named after the doc's own
 * examples (Chrome/Slack image icons, Mail ligature, letter fallback).
 */
export const KIND_TILES: Record<IconKind, AppTile> = {
  letter: { id: 'letter', name: 'Slack', icon: '' },
  url: { id: 'chrome', name: 'Chrome', icon: 'https://example.com/chrome.svg' },
  imgScheme: { id: 'slack', name: 'Slack', icon: 'img://https://example.com/slack.svg' },
  emoji: { id: 'star', name: 'Star', icon: '⭐' },
  ligature: { id: 'mail', name: 'Mail', icon: 'mail' },
};

/** The `<img>` src a kind paints: `img://` is a treatment marker, not a URL. */
export function expectedImgSrc(kind: IconKind): string | null {
  if (kind === 'url') return KIND_TILES.url.icon;
  if (kind === 'imgScheme') return KIND_TILES.imgScheme.icon.slice('img://'.length);
  return null;
}

/** Declarative markup for one tile, authored the way the doc's example does. */
export function tileMarkup(tile: AppTile): string {
  const attrs = [
    `name="${tile.name}"`,
    tile.icon !== undefined ? `icon="${tile.icon}"` : '',
    tile.color ? `color="${tile.color}"` : '',
    tile.href ? `href="${tile.href}"` : '',
    tile.badge ? `badge="${tile.badge}"` : '',
  ].filter(Boolean).join(' ');
  return `<snice-app-tile ${attrs}></snice-app-tile>`;
}

/**
 * Mount a combo through its own authoring channel.
 *
 * Declarative: `<snice-app-tile>` children AND style-axis attributes are in
 * place before connection (the doc authors it that way). Programmatic: the
 * bare element connects, then `tiles` and the style axes cross the property
 * channel — the channel the doc's "set via JS" note describes.
 */
export async function mountTiles(
  combo: TilesCombo,
  tiles: AppTile[] = [],
): Promise<HTMLElement> {
  const attrs: Record<string, any> = {};
  const props: Record<string, any> = {};
  const axes: Record<string, any> = {
    columns: combo.columns,
    size: combo.size,
    variant: combo.variant,
  };
  if (combo.channel === 'declarative') Object.assign(attrs, axes);
  else Object.assign(props, axes);

  const innerHTML = combo.channel === 'declarative' ? tiles.map(tileMarkup).join('') : '';
  const el = await mount<HTMLElement>('snice-app-tiles', attrs, innerHTML);
  if (combo.channel === 'programmatic') {
    const target = el as any;
    target.tiles = tiles;
    for (const [key, value] of Object.entries(props)) target[key] = value;
    await settle(el, 30);
  }
  return el;
}

// ── Structural readers ──────────────────────────────────────────────────────

export function tilesContainer(el: HTMLElement): HTMLElement {
  return one<HTMLElement>(el, '.tiles')!;
}

export function tileButtons(el: HTMLElement): HTMLButtonElement[] {
  return [...shadow(el).querySelectorAll<HTMLButtonElement>('button.tile')];
}

/** The modifier class rebuild() paints for the variant (snice-app-tiles.css). */
export function variantClass(variant: Variant): string | null {
  if (variant === 'list') return 'tiles--list';
  if (variant === 'compact') return 'tiles--compact';
  return null; // grid is the absence of a modifier — the stylesheet default
}

/**
 * The DOCUMENTED icon shape of one rendered tile — the "expected" side of the
 * icon oracle. `color` is the authored tile color (or null).
 */
export function expectedIconShape(kind: IconKind, color: string | null): Shape {
  const modifier = kind === 'letter' ? 'text' : kind;
  const shape: Shape = {
    iconClass: kind === 'url' || kind === 'imgScheme'
      ? 'tile__icon'
      : `tile__icon tile__icon--${modifier}`,
    hasImg: kind === 'url' || kind === 'imgScheme',
    imgSrc: expectedImgSrc(kind),
    imgAlt: kind === 'url' || kind === 'imgScheme' ? KIND_TILES[kind].name : null,
    // letter: "first char of name"; emoji/ligature: the authored text itself;
    // img kinds carry an <img> and no text at all.
    iconText: kind === 'letter' ? KIND_TILES[kind].name.charAt(0).toUpperCase()
      : kind === 'emoji' || kind === 'ligature' ? KIND_TILES[kind].icon
      : '',
    hasIconPart: kind === 'ligature',
    // "colored circle": the letter treatment always paints a background —
    // the authored color when present, the built-in palette otherwise (the
    // palette's exact values are not part of the documented contract, so
    // only non-emptiness is asserted when no color is authored).
    backgroundNonEmpty: kind === 'letter' || ((kind === 'ligature') && color !== null),
  };
  if ((kind === 'letter' || kind === 'ligature') && color !== null) {
    shape.backgroundValue = color;
  }
  return shape;
}

/** The same description, read back off the first rendered tile. */
export function readIconShape(el: HTMLElement): Shape {
  const button = tileButtons(el)[0];
  const icon = button?.querySelector<HTMLElement>('.tile__icon') ?? null;
  const img = icon?.querySelector<HTMLImageElement>('img') ?? null;
  const ligatureSpan = icon?.querySelector<HTMLElement>('span[part="icon"]') ?? null;
  const background = icon?.getAttribute('style')
    ?.match(/background\s*:\s*([^;]*)/)?.[1]?.trim() ?? null;
  return {
    iconClass: icon?.getAttribute('class') ?? null,
    hasImg: !!img,
    imgSrc: img?.getAttribute('src') ?? null,
    imgAlt: img?.getAttribute('alt') ?? null,
    iconText: ligatureSpan
      ? ligatureSpan.textContent ?? null
      : (icon?.textContent ?? null)?.trim() ?? null,
    hasIconPart: !!ligatureSpan,
    backgroundNonEmpty: background !== null && background !== '',
    backgroundValue: background,
  };
}

/**
 * The DOCUMENTED axis state: property truth for every axis plus the attribute
 * the stylesheet can select on. `size` is the `:host([size=…])` axis; variant
 * and columns reach the stylesheet through the container class/inline var.
 */
export function expectedAxes(combo: TilesCombo): Shape {
  const reflected = (value: unknown, fallback: unknown, text: string) =>
    (combo.channel === 'declarative' || value !== fallback) ? text : undefined;
  return {
    'prop.columns': combo.columns,
    'prop.size': combo.size,
    'prop.variant': combo.variant,
    'attr.columns': reflected(combo.columns, DEFAULTS.columns, String(combo.columns)),
    'attr.size': reflected(combo.size, DEFAULTS.size, combo.size),
    'attr.variant': reflected(combo.variant, DEFAULTS.variant, combo.variant),
    containerVariantClass: variantClass(combo.variant),
    columnsVar: String(combo.columns),
  };
}

export function readAxes(el: HTMLElement, combo: TilesCombo): Shape {
  const any = el as any;
  const container = tilesContainer(el);
  const demanded = (value: unknown, fallback: unknown, name: string) =>
    (combo.channel === 'declarative' || value !== fallback)
      ? el.getAttribute(name) : undefined;
  const classes = new Set((container.getAttribute('class') ?? '').split(/\s+/).filter(Boolean));
  return {
    'prop.columns': any.columns,
    'prop.size': any.size,
    'prop.variant': any.variant,
    'attr.columns': demanded(combo.columns, DEFAULTS.columns, 'columns'),
    'attr.size': demanded(combo.size, DEFAULTS.size, 'size'),
    'attr.variant': demanded(combo.variant, DEFAULTS.variant, 'variant'),
    containerVariantClass: classes.has('tiles--list') ? 'tiles--list'
      : classes.has('tiles--compact') ? 'tiles--compact'
      : null,
    columnsVar: container.style.getPropertyValue('--tiles-columns').trim(),
  };
}
