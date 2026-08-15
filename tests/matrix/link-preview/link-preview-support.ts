/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-link-preview matrix — fixtures and the documented-behaviour oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Read off `docs/ai/components/link-preview.md` and
 * `packages/components/src/link-preview/snice-link-preview.types.ts`:
 *
 *   · Properties `url`, `title`, `description`, `image`, `siteName` (attribute
 *     `site-name`), `favicon`, `variant` ('vertical' | 'horizontal', default
 *     'vertical'), `size` ('small' | 'medium' | 'large', default 'medium').
 *   · `title` is documented **JS-only**, with the reason spelled out in the doc
 *     itself: "a title attribute is the native tooltip, not this". So a `title`
 *     ATTRIBUTE must not become the preview's title — that is a contract, and
 *     the matrix asserts it in both directions.
 *   · Parts: `base` (outer card), `content` (text area: title, description,
 *     footer), `title` (title text element).
 *   · Event `link-click` -> `{ url: string }`.
 *
 * ── What is deliberately NOT asserted ───────────────────────────────────────
 *
 * The rendered footer also shows a host name derived from `url`, and the card
 * carries `role`/`tabindex`/`aria-label`. Neither is in the documentation, and
 * `.ai/fuzzing.md` binds expectations to the docs rather than to observed
 * output, so this oracle stays silent about them instead of freezing today's
 * rendering into a test. What IS documented about `url` — that clicking a
 * preview emits `link-click` carrying it — is asserted in full.
 */
import { shadow, text, part } from '../matrix-utils';
import '../../../packages/components/src/link-preview/snice-link-preview';
import type {
  LinkPreviewVariant, LinkPreviewSize,
} from '../../../packages/components/src/link-preview/snice-link-preview.types';

export type { LinkPreviewVariant, LinkPreviewSize };

// ── Documented value sets and defaults ──────────────────────────────────────

export const VARIANTS: readonly LinkPreviewVariant[] = ['vertical', 'horizontal'];
export const SIZES: readonly LinkPreviewSize[] = ['small', 'medium', 'large'];

export const DEFAULT_VARIANT: LinkPreviewVariant = 'vertical';
export const DEFAULT_SIZE: LinkPreviewSize = 'medium';

export interface PreviewCombo {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  favicon: string;
  variant: LinkPreviewVariant;
  size: LinkPreviewSize;
}

/** Documented defaults, every property at its documented initial value. */
export const DEFAULTS: PreviewCombo = {
  url: '',
  title: '',
  description: '',
  image: '',
  siteName: '',
  favicon: '',
  variant: DEFAULT_VARIANT,
  size: DEFAULT_SIZE,
};

export const preview = (overrides: Partial<PreviewCombo> = {}): PreviewCombo => ({
  ...DEFAULTS,
  ...overrides,
});

export const comboId = (c: PreviewCombo): string =>
  `${c.variant}/${c.size} image=${!!c.image} title=${!!c.title}`
  + ` desc=${!!c.description} site=${!!c.siteName} favicon=${!!c.favicon} url="${c.url}"`;

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Attribute payload. `site-name` is the documented attribute for `siteName`;
 * `title` is deliberately absent — the doc says it is JS-only, so it crosses
 * the property channel, and the ATTRIBUTE form gets its own test.
 */
export function attrsOf(c: PreviewCombo): Record<string, any> {
  const attrs: Record<string, any> = { variant: c.variant, size: c.size };
  if (c.url) attrs.url = c.url;
  if (c.description) attrs.description = c.description;
  if (c.image) attrs.image = c.image;
  if (c.siteName) attrs['site-name'] = c.siteName;
  if (c.favicon) attrs.favicon = c.favicon;
  return attrs;
}

export const propsOf = (c: PreviewCombo): Record<string, any> => ({ title: c.title });

// ── Oracle ──────────────────────────────────────────────────────────────────

export interface Reading {
  base: HTMLElement | null;
  content: HTMLElement | null;
  titlePart: HTMLElement | null;
  titleText: string;
  contentText: string;
  images: string[];
  faviconSrc: string | null;
  siteNameText: string | null;
  hostVariant: string | null;
  hostSize: string | null;
  nativeTitleAttribute: string | null;
}

export function read(el: HTMLElement): Reading {
  const root = shadow(el);
  const titlePart = part(el, 'title');
  const favicon = root.querySelector('.link-preview__favicon');
  const siteName = root.querySelector('.link-preview__site-name');
  return {
    base: part(el, 'base'),
    content: part(el, 'content'),
    titlePart,
    titleText: text(titlePart),
    contentText: text(part(el, 'content')),
    images: [...root.querySelectorAll('img')]
      .filter(img => !img.classList.contains('link-preview__favicon'))
      .map(img => img.getAttribute('src') ?? ''),
    faviconSrc: favicon ? favicon.getAttribute('src') : null,
    siteNameText: siteName ? text(siteName) : null,
    hostVariant: el.getAttribute('variant'),
    hostSize: el.getAttribute('size'),
    nativeTitleAttribute: el.getAttribute('title'),
  };
}

/**
 * Every documented consequence of `c`, as a problem list. `[]` means the
 * rendered card matches its documentation.
 */
export function previewProblems(el: HTMLElement, c: PreviewCombo): string[] {
  const problems: string[] = [];
  const say = (message: string) => problems.push(message);
  const r = read(el);

  // ── Documented parts ──────────────────────────────────────────────────────
  if (!r.base) say('no [part="base"] card container');
  if (!r.content) say('no [part="content"] text area');

  // ── title: the documented title text element ─────────────────────────────
  if (c.title) {
    if (!r.titlePart) say(`title "${c.title}" set but no [part="title"] element`);
    else if (r.titleText !== c.title) say(`[part="title"] reads "${r.titleText}", expected "${c.title}"`);
  } else if (r.titleText !== '') {
    say(`title is empty but [part="title"] reads "${r.titleText}"`);
  }

  // ── description and site name live inside the documented content area ────
  if (c.description && !r.contentText.includes(c.description)) {
    say(`description "${c.description}" is not inside [part="content"] ("${r.contentText}")`);
  }
  if (c.siteName) {
    if (r.siteNameText === null) say(`siteName "${c.siteName}" set but not rendered`);
    else if (r.siteNameText !== c.siteName) say(`site name reads "${r.siteNameText}", expected "${c.siteName}"`);
    if (!r.contentText.includes(c.siteName)) {
      say(`siteName "${c.siteName}" is not inside [part="content"] — the doc places the footer there`);
    }
  } else if (r.siteNameText !== null && r.siteNameText !== '') {
    say(`siteName is empty but a site name "${r.siteNameText}" is rendered`);
  }

  // ── image and favicon ────────────────────────────────────────────────────
  if (c.image) {
    if (!r.images.includes(c.image)) say(`image "${c.image}" set but rendered images are ${JSON.stringify(r.images)}`);
  } else if (r.images.length > 0) {
    say(`no image set but ${JSON.stringify(r.images)} rendered`);
  }

  if (c.favicon) {
    if (r.faviconSrc === null) say(`favicon "${c.favicon}" set but not rendered`);
    else if (r.faviconSrc !== c.favicon) say(`favicon src "${r.faviconSrc}" != "${c.favicon}"`);
  } else if (r.faviconSrc !== null) {
    say(`no favicon set but "${r.faviconSrc}" rendered`);
  }

  // ── Presentation hooks the stylesheet selects on ─────────────────────────
  //
  // `variant` and `size` are documented as attribute-driven, so the stylesheet's
  // `:host([variant=…])` / `:host([size=…])` rules need the value on the host.
  // A component whose stylesheet also carries a `:not()` twin may leave the
  // DEFAULT off; any other value must be named.
  const hostAttribute = (name: string, got: string | null, want: string, isDefault: boolean) => {
    if (got === want) return;
    if (isDefault && got === null) return;
    say(`host ${name} is "${got}", expected "${want}"`
      + `${isDefault ? ' (or absent, covered by the default rule)' : ''}`);
  };
  hostAttribute('variant', r.hostVariant, c.variant, c.variant === DEFAULT_VARIANT);
  hostAttribute('size', r.hostSize, c.size, c.size === DEFAULT_SIZE);

  // ── The documented JS-only title ─────────────────────────────────────────
  //
  // "a title attribute is the native tooltip, not this": setting the property
  // must not leak into the host's native `title` attribute.
  if (r.nativeTitleAttribute !== null) {
    say(`the title property reflected to a native title attribute ("${r.nativeTitleAttribute}"),`
      + ' which the docs reserve for the browser tooltip');
  }

  return problems;
}
