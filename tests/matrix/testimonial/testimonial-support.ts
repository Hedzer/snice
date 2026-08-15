/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Per-component oracle for the snice-testimonial matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * snice-testimonial is a display-only card: no interaction, no data pipeline,
 * no delivery modes. Its entire contract is "given this property vector, what
 * is in the shadow tree and what does it say", so the oracle here is a
 * description of that tree derived — line by line — from
 * docs/ai/components/testimonial.md and snice-testimonial.types.ts:
 *
 *   · `quote: string`      — rendered in `part="quote"`.
 *   · `author: string`     — rendered inside `part="author"`.
 *   · `avatar: string`     — "URL for author avatar image". An <img> for it
 *                            appears inside `part="author"` only when the URL
 *                            is non-empty; its `alt` names the author, which is
 *                            the only accessible name the image can have.
 *   · `role` / `company`   — "e.g. 'CEO'" / "e.g. 'Acme Inc' (renders as
 *                            'role at company')". So: both -> "role at company",
 *                            one -> that one alone, neither -> no role line.
 *   · `rating: number`     — "0-5 star rating (0 = hidden)". A rating above 0
 *                            renders `part="stars"` holding FIVE glyphs, of
 *                            which the first `rating` are filled and the rest
 *                            are outlines — that is what a 5-star rating of `n`
 *                            means. A rating of 0 renders no stars part at all.
 *   · `variant`            — 'card' | 'minimal' | 'featured'. Pure style: the
 *                            stylesheet selects it as `:host([variant=…])`, so
 *                            its observable contract in a layout-free DOM is
 *                            the attribute, per docs/ai/properties.md
 *                            ("Reflect property setter changes to corresponding
 *                            attributes"; "Initial field values (defaults) are
 *                            NOT reflected").
 *
 * The star glyphs are the framework's own registry icons (`star`,
 * `star-outline`), so "filled" is not read off a class name the component
 * happens to use — it is read off the SVG the registry publishes for that name.
 */
import { mount, part, shadow, settle, type Shape } from '../matrix-utils';
import { ICONS } from '../../../packages/components/src/icons';

export const VARIANTS = ['card', 'minimal', 'featured'] as const;
export const RATINGS = [0, 3, 5] as const;
export const AVATARS = ['', '/avatars/jane.png'] as const;
export const CHANNELS = ['attr', 'prop'] as const;

export type Variant = typeof VARIANTS[number];
/** How a combo is authored: markup attributes, or post-connect JS assignment. */
export type Channel = typeof CHANNELS[number];

/** role/company shapes — the four states of the documented "role at company". */
export const ROLE_SHAPES = ['none', 'role', 'company', 'both'] as const;
export type RoleShape = typeof ROLE_SHAPES[number];

export interface RoleFields { role: string; company: string }

export function roleFields(shape: RoleShape): RoleFields {
  switch (shape) {
    case 'none': return { role: '', company: '' };
    case 'role': return { role: 'CTO', company: '' };
    case 'company': return { role: '', company: 'Acme Corp' };
    case 'both': return { role: 'CTO', company: 'Acme Corp' };
  }
}

/**
 * The documented join: "company … (renders as 'role at company')". With only
 * one of the two present there is nothing to join, and with neither there is no
 * line to render.
 */
export function expectedRoleLine(fields: RoleFields): string | null {
  const pieces = [fields.role, fields.company].filter(Boolean);
  return pieces.length ? pieces.join(' at ') : null;
}

/** Documented defaults, from docs/ai/components/testimonial.md. */
export const DEFAULTS = {
  quote: '',
  author: '',
  avatar: '',
  role: '',
  company: '',
  rating: 0,
  variant: 'card' as Variant,
};

export const QUOTE = 'This product changed my workflow completely.';
export const AUTHOR = 'Jane Doe';

export interface TestimonialCombo {
  id: string;
  variant: Variant;
  rating: number;
  avatar: string;
  roleShape: RoleShape;
  channel: Channel;
  quote?: string;
  author?: string;
}

export function comboFields(combo: TestimonialCombo) {
  return {
    quote: combo.quote ?? QUOTE,
    author: combo.author ?? AUTHOR,
    avatar: combo.avatar,
    rating: combo.rating,
    variant: combo.variant,
    ...roleFields(combo.roleShape),
  };
}

/** Mount a combo through its own authoring channel. */
export async function mountTestimonial(combo: TestimonialCombo): Promise<HTMLElement> {
  const fields = comboFields(combo);
  if (combo.channel === 'attr') {
    const attrs: Record<string, any> = {
      quote: fields.quote,
      author: fields.author,
      variant: fields.variant,
      rating: fields.rating,
    };
    if (fields.avatar) attrs.avatar = fields.avatar;
    if (fields.role) attrs.role = fields.role;
    if (fields.company) attrs.company = fields.company;
    return mount<HTMLElement>('snice-testimonial', attrs);
  }
  const el = await mount<HTMLElement>('snice-testimonial');
  Object.assign(el as any, fields);
  await settle(el, 5);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function starsPart(el: HTMLElement): HTMLElement | null {
  return part<HTMLElement>(el, 'stars');
}

export function starGlyphs(el: HTMLElement): HTMLElement[] {
  const stars = starsPart(el);
  return stars ? [...stars.querySelectorAll<HTMLElement>('.star-glyph')] : [];
}

/**
 * Which registry icon a glyph is painting. The filled and outline stars are two
 * different published SVGs, so the reading is an identity check against the
 * registry rather than a guess about class names.
 *
 * Both sides are normalised by round-tripping through the DOM: the rendered
 * glyph carries the template engine's marker comments and a re-serialised
 * `<path></path>`, so a raw string compare against the registry source would
 * differ on punctuation rather than on which star is painted.
 */
let REGISTRY_STARS: { filled: string; outline: string } | null = null;

function normalise(markup: string): string {
  const host = document.createElement('div');
  host.innerHTML = markup;
  return host.firstElementChild?.outerHTML ?? '';
}

function registryStars() {
  if (!REGISTRY_STARS) {
    REGISTRY_STARS = {
      filled: normalise(ICONS['star']),
      outline: normalise(ICONS['star-outline']),
    };
  }
  return REGISTRY_STARS;
}

export function glyphKind(glyph: HTMLElement): 'filled' | 'outline' | 'unknown' {
  const svg = glyph.querySelector('svg');
  if (!svg) return 'unknown';
  const markup = svg.outerHTML;
  const registry = registryStars();
  if (markup === registry.filled) return 'filled';
  if (markup === registry.outline) return 'outline';
  return 'unknown';
}

export function avatarImage(el: HTMLElement): HTMLImageElement | null {
  const author = part<HTMLElement>(el, 'author');
  return author?.querySelector<HTMLImageElement>('img.avatar') ?? null;
}

export function authorName(el: HTMLElement): string {
  const author = part<HTMLElement>(el, 'author');
  return author?.querySelector('.author-name')?.textContent?.trim() ?? '';
}

export function roleLine(el: HTMLElement): string | null {
  const author = part<HTMLElement>(el, 'author');
  const line = author?.querySelector('.author-role');
  return line ? (line.textContent ?? '').replace(/\s+/g, ' ').trim() : null;
}

// ── Oracle ──────────────────────────────────────────────────────────────────

/** The DOCUMENTED shadow shape for a combo — the "expected" side. */
export function expectedShape(combo: TestimonialCombo): Shape {
  const fields = comboFields(combo);
  const rated = fields.rating > 0;
  return {
    hasBase: true,
    hasQuotePart: true,
    quoteText: fields.quote,
    hasAuthorPart: true,
    authorName: fields.author,
    roleLine: expectedRoleLine(fields),
    hasAvatar: !!fields.avatar,
    avatarSrc: fields.avatar || null,
    avatarAlt: fields.avatar ? fields.author : null,
    hasStars: rated,
    starCount: rated ? 5 : 0,
    starKinds: rated
      ? Array.from({ length: 5 }, (_, i) => (i < fields.rating ? 'filled' : 'outline'))
      : [],
  };
}

/** The same description, read back off the rendered element. */
export function readShape(el: HTMLElement): Shape {
  const image = avatarImage(el);
  const glyphs = starGlyphs(el);
  return {
    hasBase: !!part(el, 'base'),
    hasQuotePart: !!part(el, 'quote'),
    quoteText: (part(el, 'quote')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
    hasAuthorPart: !!part(el, 'author'),
    authorName: authorName(el),
    roleLine: roleLine(el),
    hasAvatar: !!image,
    avatarSrc: image?.getAttribute('src') ?? null,
    avatarAlt: image?.getAttribute('alt') ?? null,
    hasStars: !!starsPart(el),
    starCount: glyphs.length,
    starKinds: glyphs.map(glyphKind),
  };
}

/**
 * The documented axis state. `variant` is the only style axis; the reflection
 * rule is the framework's: an authored attribute is always present, and a
 * property assignment reflects unless it is the documented default.
 */
export function expectedAxes(combo: TestimonialCombo): Shape {
  const fields = comboFields(combo);
  const reflects = combo.channel === 'attr' || fields.variant !== DEFAULTS.variant;
  return {
    'prop.variant': fields.variant,
    'prop.rating': fields.rating,
    'prop.quote': fields.quote,
    'prop.author': fields.author,
    'prop.avatar': fields.avatar,
    'prop.role': fields.role,
    'prop.company': fields.company,
    'attr.variant': reflects ? fields.variant : undefined,
  };
}

export function readAxes(el: HTMLElement, combo: TestimonialCombo): Shape {
  const any = el as any;
  const fields = comboFields(combo);
  const reflects = combo.channel === 'attr' || fields.variant !== DEFAULTS.variant;
  return {
    'prop.variant': any.variant,
    'prop.rating': any.rating,
    'prop.quote': any.quote,
    'prop.author': any.author,
    'prop.avatar': any.avatar,
    'prop.role': any.role,
    'prop.company': any.company,
    'attr.variant': reflects ? el.getAttribute('variant') : undefined,
  };
}

/** Every part the docs list, present in every combo that renders at all. */
export function documentedParts(el: HTMLElement): string[] {
  return [...shadow(el).querySelectorAll('[part]')]
    .flatMap(node => (node.getAttribute('part') ?? '').split(/\s+/))
    .filter(Boolean);
}
