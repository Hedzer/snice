/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Per-component oracle for the snice-avatar-group matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * snice-avatar-group is a display component with exactly one piece of
 * arithmetic — "Max visible before +N" — and two documented ways to be fed.
 * Everything encoded here is transcribed from
 * docs/ai/components/avatar-group.md, docs/components/avatar-group.md and
 * snice-avatar-group.types.ts:
 *
 *   · `avatars: AvatarGroupItem[] = []  // Array of avatar data (set via JS)`
 *     — a JS-only property, so there is no attribute channel for it;
 *   · `max: number = 5  // Max visible before "+N"` — so the first `max` items
 *     are rendered and the rest become one overflow button reading `+N`;
 *   · `size: 'small'|'medium'|'large'` and `overlap: number = 8  // Overlap in
 *     px` — style axes whose observable DOM contract is the attribute and the
 *     custom property the component writes for its own stylesheet;
 *   · the item shape: `src` ("Image URL"), `initials` ("Fallback initials"),
 *     `name` ("Name (used for initials/color/title)"), `color` ("Custom
 *     background color");
 *   · CSS parts `base`, `avatar`, `overflow`;
 *   · "role=`group` with aria-label=`Avatar group`" and "Each avatar is a
 *     `<button>` with title and aria-label";
 *   · `avatar-click -> { avatar, index }` and
 *     `overflow-click -> { remaining, avatars }`;
 *   · the default slot takes `<snice-avatar>` children for declarative mode.
 */
import { mount, shadow, settle, type Shape } from '../matrix-utils';
import { exactPart, exactParts, partTokens } from '../part-exact';
import type { AvatarGroupItem } from
  '../../../packages/components/src/avatar-group/snice-avatar-group.types';

export type { AvatarGroupItem };

export const SIZES = ['small', 'medium', 'large'] as const;
export type Size = typeof SIZES[number];

/** Documented defaults, from the property block in both doc versions. */
export const DEFAULTS = {
  avatars: [] as AvatarGroupItem[],
  max: 5,
  size: 'medium' as Size,
  overlap: 8,
};

export const DOCUMENTED_PARTS = ['base', 'avatar', 'overflow'];

// ── The documented item model ───────────────────────────────────────────────

/**
 * "`name` … used for INITIALS" — the initials a name produces when the item
 * carries none of its own: the first letter of a single-word name, or the
 * first letters of the first two words, upper-cased.
 */
export function initialsFromName(name: string): string {
  if (!name) return '';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** "`initials` — Fallback initials" wins; a name supplies them otherwise. */
export function expectedInitials(item: AvatarGroupItem): string {
  return item.initials || initialsFromName(item.name ?? '');
}

/**
 * What one avatar button renders INSIDE itself. The docs give three item
 * shapes and they are mutually exclusive in that order: an image URL is an
 * image, initials (given or derived) are a monogram, and an item that supplies
 * neither still has to be a visible avatar — the fallback glyph.
 */
export type AvatarContent = 'image' | 'initials' | 'fallback';

export function expectedContent(item: AvatarGroupItem): AvatarContent {
  if (item.src) return 'image';
  if (expectedInitials(item)) return 'initials';
  return 'fallback';
}

/** "Max visible before `+N`": the items that are rendered as avatars. */
export function visibleItems(avatars: AvatarGroupItem[], max: number): AvatarGroupItem[] {
  return avatars.slice(0, max);
}

/** The items the `+N` button stands for. */
export function hiddenItems(avatars: AvatarGroupItem[], max: number): AvatarGroupItem[] {
  return avatars.slice(max);
}

/** `N` in `+N`, or 0 when nothing overflows. */
export function overflowCount(total: number, max: number): number {
  return Math.max(0, total - max);
}

// ── Fixtures ────────────────────────────────────────────────────────────────

/** One item per documented shape, so a cross can name the shape it is using. */
export const ITEM_SHAPES = {
  /** `src` — an image URL, with a name for the alt text and the title. */
  image: { name: 'Bob Smith', src: '/avatars/bob.jpg' },
  /** `initials` given explicitly, overriding anything a name would derive. */
  initials: { name: 'Alice Johnson', initials: 'AJ' },
  /** `name` alone — initials, colour and title all derive from it. */
  named: { name: 'Carol Williams' },
  /** `color` — a custom background instead of the hashed one. */
  colored: { name: 'Dan', color: '#7c3aed' },
  /** Nothing at all: still an avatar, still a button. */
  anonymous: {},
} satisfies Record<string, AvatarGroupItem>;

export type ShapeName = keyof typeof ITEM_SHAPES;

/** `count` distinct people, so an index is always readable in a failure. */
export function people(count: number): AvatarGroupItem[] {
  const names = [
    'Alice Johnson', 'Bob Smith', 'Carol Williams', 'Dan Brown', 'Erin Davis',
    'Frank Miller', 'Grace Lee', 'Hank Moody', 'Ivy Chen', 'Jack Ryan',
  ];
  return Array.from({ length: count }, (_, i) => ({ name: names[i % names.length] }));
}

// ── Mounting ────────────────────────────────────────────────────────────────

export interface AvatarGroupVector {
  avatars?: AvatarGroupItem[];
  max?: number;
  size?: Size;
  overlap?: number;
}

/**
 * Mount a group the way the docs show one.
 *
 * `max`, `size` and `overlap` are authored as ATTRIBUTES (that is how both doc
 * versions spell them, and `:host([size=…])` is the only thing the stylesheet
 * can see). `avatars` is documented "set via JS", so it has no attribute form
 * and is assigned after the element is ready. Slotted `<snice-avatar>` children
 * are placed BEFORE connection, because the component decides declarative mode
 * during its first ready pass.
 */
export async function mountAvatarGroup(
  vector: AvatarGroupVector = {}, children = '',
): Promise<any> {
  const attrs: Record<string, any> = {};
  if (vector.max !== undefined) attrs.max = vector.max;
  if (vector.size !== undefined) attrs.size = vector.size;
  if (vector.overlap !== undefined) attrs.overlap = vector.overlap;

  const el = await mount<HTMLElement>('snice-avatar-group', attrs, children);
  if (vector.avatars !== undefined) (el as any).avatars = vector.avatars;
  await settle(el, 10);
  return el;
}

/** Let a mutation observer pass and the render it schedules land. */
export async function tick(el: any): Promise<void> {
  await settle(el, 10);
}

// ── Readers ─────────────────────────────────────────────────────────────────

export const basePart = (el: HTMLElement) => exactPart<HTMLElement>(el, 'base');
export const avatarButtons = (el: HTMLElement) => exactParts<HTMLButtonElement>(el, 'avatar');
export const overflowButton = (el: HTMLElement) => exactPart<HTMLButtonElement>(el, 'overflow');

export function partNames(el: HTMLElement): string[] {
  return [...new Set([...shadow(el).querySelectorAll('[part]')]
    .flatMap(node => partTokens(node)))].sort();
}

/** What one rendered avatar button is showing. */
export function readContent(button: HTMLButtonElement): AvatarContent | 'empty' {
  if (button.querySelector('img')) return 'image';
  if (button.querySelector('.avatar-initials')) return 'initials';
  if (button.querySelector('svg')) return 'fallback';
  return 'empty';
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/** The DOCUMENTED shadow shape of a group rendering `avatars` under `max`. */
export function expectedShape(vector: AvatarGroupVector): Shape {
  const avatars = vector.avatars ?? DEFAULTS.avatars;
  const max = vector.max ?? DEFAULTS.max;
  const visible = visibleItems(avatars, max);
  const remaining = overflowCount(avatars.length, max);

  return {
    hasBase: true,
    role: 'group',
    ariaLabel: 'Avatar group',
    avatarCount: visible.length,
    // "Each avatar is a `<button>` with title and aria-label."
    tags: visible.map(() => 'button'),
    titles: visible.map(item => item.name ?? ''),
    ariaLabels: visible.map(item => item.name || 'Avatar'),
    contents: visible.map(expectedContent),
    // "`src` — Image URL": the image names its person, which is the only
    // accessible name an avatar image can have.
    imageSources: visible.filter(item => item.src).map(item => item.src),
    imageAlts: visible.filter(item => item.src).map(item => item.name ?? ''),
    initials: visible.filter(item => !item.src && expectedInitials(item))
      .map(expectedInitials),
    // "`+N` overflow indicator", present only when something overflows.
    hasOverflow: remaining > 0,
    overflowText: remaining > 0 ? `+${remaining}` : null,
    overflowLabel: remaining > 0 ? `${remaining} more` : null,
    // "`color` — Custom background color", applied to that avatar only.
    customBackgrounds: visible.map(item => item.color ?? null),
  };
}

/** The same description, read back off the rendered element. */
export function readShape(el: HTMLElement): Shape {
  const base = basePart(el);
  const buttons = avatarButtons(el);
  const overflow = overflowButton(el);
  return {
    hasBase: !!base,
    role: base?.getAttribute('role') ?? null,
    ariaLabel: base?.getAttribute('aria-label') ?? null,
    avatarCount: buttons.length,
    tags: buttons.map(button => button.tagName.toLowerCase()),
    titles: buttons.map(button => button.getAttribute('title') ?? ''),
    ariaLabels: buttons.map(button => button.getAttribute('aria-label') ?? ''),
    contents: buttons.map(readContent),
    imageSources: buttons
      .map(button => button.querySelector('img')?.getAttribute('src'))
      .filter((src): src is string => !!src),
    imageAlts: buttons
      .filter(button => button.querySelector('img'))
      .map(button => button.querySelector('img')?.getAttribute('alt') ?? ''),
    initials: buttons
      .map(button => button.querySelector('.avatar-initials')?.textContent ?? '')
      .filter(Boolean),
    hasOverflow: !!overflow,
    overflowText: overflow ? (overflow.textContent ?? '').trim() : null,
    overflowLabel: overflow?.getAttribute('aria-label') ?? null,
    customBackgrounds: buttons.map(button => readCustomBackground(button)),
  };
}

/**
 * The custom background an item asked for, read off the inline style ATTRIBUTE
 * rather than the parsed `style` object: a CSSOM implementation is free to
 * re-serialise `#7c3aed`, and the claim under test is that the author's own
 * colour string reached the paint.
 */
function readCustomBackground(button: HTMLElement): string | null {
  const declaration = /(?:^|;)\s*background:\s*([^;]*)/i.exec(button.getAttribute('style') ?? '');
  return declaration ? declaration[1].trim() : null;
}

/** The style axes, and the custom property the component writes for its CSS. */
export function expectedAxes(vector: AvatarGroupVector): Shape {
  const size = vector.size ?? DEFAULTS.size;
  const overlap = vector.overlap ?? DEFAULTS.overlap;
  return {
    'prop.max': vector.max ?? DEFAULTS.max,
    'prop.size': size,
    'prop.overlap': overlap,
    // An AUTHORED attribute is present for every value, defaults included.
    'attr.size': vector.size === undefined ? null : size,
    // "`overlap: number = 8  // Overlap in px`", written for the stylesheet as
    // a NEGATIVE margin in rem — 8px on a 16px root is 0.5rem.
    'css.overlap': `-${overlap / 16}rem`,
  };
}

export function readAxes(el: HTMLElement): Shape {
  return {
    'prop.max': (el as any).max,
    'prop.size': (el as any).size,
    'prop.overlap': (el as any).overlap,
    'attr.size': el.getAttribute('size'),
    'css.overlap': el.style.getPropertyValue('--avatar-group-overlap'),
  };
}

// ── Interaction ─────────────────────────────────────────────────────────────

export interface CapturedAvatarEvent { type: string; detail: any }

/** Record the two documented events in dispatch order. */
export function recordEvents(el: HTMLElement): CapturedAvatarEvent[] {
  const seen: CapturedAvatarEvent[] = [];
  for (const type of ['avatar-click', 'overflow-click']) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}
