/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the snice-product-card matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation below is read off `docs/ai/components/product-card.md` and
 * `snice-product-card.types.ts`. Nothing here was derived from what the
 * component happens to render.
 *
 *   name          string = ''                 → [part=title]
 *   price         number = 0                  → [part=price-current] (or -original on sale)
 *   salePrice     number|null = null          → sale pricing + [part=discount]
 *   currency      string = '$'                → prefixes every price
 *   images        string[] = []               → [part=gallery] / [part=image]
 *   rating        number = 0    0-5, half stars → [part=rating] / [part=stars]
 *   reviewCount   number = 0                  → the "(n)" beside the stars
 *   variants      ProductVariant[] = []       → [part=variants] / -group / -option
 *   inStock       boolean = true              → [part=stock], disables [part=cta]
 *   variant       vertical|horizontal|compact|featured|minimal|grid
 *   badge         string = ''                 → [part=badge]
 *   badgeVariant  sale|new|featured
 *   loading       boolean = false             → skeleton
 *   favorite      boolean = false             → [part=favorite-btn] toggle
 *   stockCount    number = -1  (-1 hidden, <5 urgency)
 *
 * Two deliberate boundaries:
 *
 *   · the doc gives no formatting grammar for prices beyond "currency +
 *     number", so the oracle reads the number back out of the rendered string
 *     and compares NUMBERS. Asserting a thousands separator would be asserting
 *     a locale the doc never promised;
 *   · `variant` is documented as six layouts. A layout is paint, and paint is
 *     the visual tier's job (tests/live/matrix/product-card/). Here the variant
 *     may only be held to "it changes nothing about which documented regions
 *     exist" — which is exactly the regression a layout switch tends to cause.
 */
import { Problems, text } from '../matrix-kit';
import { exactPart, exactParts } from '../part-exact';
import type {
  BadgeVariant, ProductCardVariant, ProductVariant,
} from '../../../packages/components/src/product-card/snice-product-card.types';

export type { BadgeVariant, ProductCardVariant, ProductVariant };

export const VARIANTS: ProductCardVariant[] = [
  'vertical', 'horizontal', 'compact', 'featured', 'minimal', 'grid',
];
export const BADGE_VARIANTS: BadgeVariant[] = ['sale', 'new', 'featured'];

export const IMAGE_SETS: Record<string, string[]> = {
  none: [],
  one: ['/img/shoe-1.png'],
  three: ['/img/shoe-1.png', '/img/shoe-2.png', '/img/shoe-3.png'],
};

export const SIZE_VARIANT: ProductVariant = { type: 'Size', options: ['S', 'M', 'L'] };
export const COLOR_VARIANT: ProductVariant = { type: 'Color', options: ['#1a1a2e', '#e94560'] };

export const NAME = 'Trail Runner 3000';

/** The full feature vector a combo mounts with. */
export interface CardSpec {
  name: string;
  price: number;
  salePrice: number | null;
  currency: string;
  images: string[];
  rating: number;
  reviewCount: number;
  variants: ProductVariant[];
  inStock: boolean;
  variant: ProductCardVariant;
  badge: string;
  badgeVariant: BadgeVariant;
  loading: boolean;
  favorite: boolean;
  stockCount: number;
}

/** A neutral, fully specified card; every suite overrides only what it tests. */
export function spec(overrides: Partial<CardSpec> = {}): CardSpec {
  return {
    name: NAME,
    price: 129.99,
    salePrice: null,
    currency: '$',
    images: [],
    rating: 0,
    reviewCount: 0,
    variants: [],
    inStock: true,
    variant: 'vertical',
    badge: '',
    badgeVariant: 'sale',
    loading: false,
    favorite: false,
    stockCount: -1,
    ...overrides,
  };
}

// ── Documented derivations ──────────────────────────────────────────────────

/** Documented: `price-original` is the strikethrough shown ON SALE. */
export const onSale = (s: CardSpec): boolean =>
  s.salePrice !== null && s.salePrice < s.price;

/** The price the shopper pays — the one `price-current` names. */
export const currentPrice = (s: CardSpec): number => (onSale(s) ? s.salePrice! : s.price);

/** Documented: `discount` is the percentage off, as a badge. */
export const discountPercent = (s: CardSpec): number =>
  (onSale(s) ? Math.round(((s.price - s.salePrice!) / s.price) * 100) : 0);

/** Documented: rating 0-5 with half stars. Five stars, always, once shown. */
export type StarKind = 'filled' | 'half' | 'empty';
export function expectedStars(rating: number): StarKind[] {
  const stars: StarKind[] = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) stars.push('filled');
    else if (i - 0.5 <= rating) stars.push('half');
    else stars.push('empty');
  }
  return stars;
}

/** Documented: `-1` hides the count; anything below five is an urgency nudge. */
export const showsUrgency = (stockCount: number): boolean =>
  stockCount !== -1 && stockCount < 5;

// ── Readers ─────────────────────────────────────────────────────────────────

export const partOf = (el: HTMLElement, name: string) => exactPart(el, name);
export const partsOf = (el: HTMLElement, name: string) => exactParts(el, name);

/**
 * The number a price region names, with the currency and any grouping
 * separators removed. The doc promises "currency + number", not a locale.
 */
export function priceNumber(node: Element | null, currency: string): number | null {
  if (!node) return null;
  const raw = text(node);
  if (!raw.startsWith(currency)) return NaN;
  const digits = raw.slice(currency.length).replace(/[^\d.]/g, '');
  return digits === '' ? NaN : Number(digits);
}

/** Which star kind an `<svg>` inside `[part=stars]` renders. */
export function starKinds(el: HTMLElement): StarKind[] {
  const stars = partOf(el, 'stars');
  if (!stars) return [];
  return [...stars.querySelectorAll('svg')].map((svg) => {
    const klass = svg.getAttribute('class') ?? '';
    if (klass.includes('--filled')) return 'filled';
    if (klass.includes('--half')) return 'half';
    return 'empty';
  });
}

/** The option buttons of one documented `variant-group`, in order. */
export function optionsOf(group: Element): HTMLElement[] {
  return [...group.querySelectorAll('[part]')]
    .filter(node => (node.getAttribute('part') ?? '').split(/\s+/).includes('variant-option')) as HTMLElement[];
}

// ── The structural oracle ───────────────────────────────────────────────────

/**
 * Judge one mounted card against its spec. Collects EVERY violation so a single
 * run tells the whole story.
 */
export function checkCard(el: HTMLElement, s: CardSpec, problems: Problems): void {
  const base = partOf(el, 'base');
  if (!problems.check(base !== null, 'no [part="base"]')) return;

  // ── The skeleton: documented as "Skeleton loading state" ──────────────────
  if (s.loading) {
    problems.check(partOf(el, 'gallery') !== null, 'a loading card has no [part="gallery"]');
    problems.check(partOf(el, 'body') !== null, 'a loading card has no [part="body"]');
    return;
  }

  problems.check(partOf(el, 'gallery') !== null, 'no [part="gallery"]');
  problems.check(partOf(el, 'body') !== null, 'no [part="body"]');

  // ── Title ────────────────────────────────────────────────────────────────
  problems.equal(text(partOf(el, 'title')), s.name, '[part="title"] text');

  // ── Gallery ──────────────────────────────────────────────────────────────
  const images = partsOf(el, 'image');
  problems.equal(images.length, s.images.length, '[part="image"] count');
  images.forEach((img, i) => {
    problems.equal(img.getAttribute('src'), s.images[i], `image ${i} src`);
    // Documented alt text is the product's own name — an unnamed product image
    // is the classic accessibility gap for a shopping card.
    problems.equal(img.getAttribute('alt'), s.name, `image ${i} alt`);
  });

  // ── Badge ────────────────────────────────────────────────────────────────
  const badge = partOf(el, 'badge');
  problems.equal(badge !== null, s.badge !== '', '[part="badge"] present');
  if (badge) problems.equal(text(badge), s.badge, '[part="badge"] text');

  // ── Favorite ─────────────────────────────────────────────────────────────
  const favorite = partOf(el, 'favorite-btn');
  if (problems.check(favorite !== null, 'no [part="favorite-btn"]')) {
    problems.check(
      (favorite!.getAttribute('aria-label') ?? '').length > 0,
      'the favorite button has no aria-label',
    );
  }

  // ── Price ────────────────────────────────────────────────────────────────
  problems.check(partOf(el, 'price') !== null, 'no [part="price"]');
  const current = partOf(el, 'price-current');
  if (problems.check(current !== null, 'no [part="price-current"]')) {
    problems.equal(priceNumber(current, s.currency), currentPrice(s), '[part="price-current"] value');
  }

  const original = partOf(el, 'price-original');
  problems.equal(original !== null, onSale(s), '[part="price-original"] present');
  if (original) problems.equal(priceNumber(original, s.currency), s.price, '[part="price-original"] value');

  const discount = partOf(el, 'discount');
  problems.equal(discount !== null, onSale(s), '[part="discount"] present');
  if (discount) problems.equal(text(discount), `-${discountPercent(s)}%`, '[part="discount"] text');

  // ── Rating ───────────────────────────────────────────────────────────────
  const rating = partOf(el, 'rating');
  if (s.rating > 0) {
    if (problems.check(rating !== null, `rating=${s.rating} rendered no [part="rating"]`)) {
      const stars = partOf(el, 'stars');
      if (problems.check(stars !== null, 'no [part="stars"]')) {
        // Documented: "Star rating has aria-label with numeric rating".
        const label = stars!.getAttribute('aria-label') ?? '';
        problems.check(
          label.includes(String(s.rating)),
          `[part="stars"] aria-label "${label}" does not name the rating ${s.rating}`,
        );
        problems.equal(starKinds(el), expectedStars(s.rating), 'star kinds');
      }
      if (s.reviewCount > 0) {
        problems.check(
          text(rating).includes(String(s.reviewCount)),
          `the rating area does not show the review count ${s.reviewCount}`,
        );
      }
    }
  }

  // ── Stock ────────────────────────────────────────────────────────────────
  const stock = partOf(el, 'stock');
  if (problems.check(stock !== null, 'no [part="stock"]')) {
    const label = text(stock!);
    if (showsUrgency(s.stockCount)) {
      problems.check(
        label.includes(String(s.stockCount)),
        `stock-count=${s.stockCount} is below five but the stock area says "${label}"`,
      );
    } else {
      problems.equal(label, s.inStock ? 'In Stock' : 'Out of Stock', '[part="stock"] text');
    }
  }

  // ── Variant selectors ────────────────────────────────────────────────────
  const variantsArea = partOf(el, 'variants');
  problems.equal(variantsArea !== null, s.variants.length > 0, '[part="variants"] present');
  const groups = partsOf(el, 'variant-group');
  problems.equal(groups.length, s.variants.length, '[part="variant-group"] count');
  groups.forEach((group, i) => {
    const documented = s.variants[i];
    if (!documented) return;
    // Documented: "Variant selectors use role=radiogroup / role=radio with aria-checked".
    const radiogroup = group.querySelector('[role="radiogroup"]');
    if (!problems.check(radiogroup !== null, `variant group "${documented.type}" has no role="radiogroup"`)) return;
    problems.equal(
      radiogroup!.getAttribute('aria-label'), documented.type,
      `radiogroup aria-label for "${documented.type}"`,
    );
    const options = optionsOf(group);
    problems.equal(options.length, documented.options.length, `option count for "${documented.type}"`);
    options.forEach((option, j) => {
      problems.equal(option.getAttribute('role'), 'radio', `option ${j} role in "${documented.type}"`);
      const checked = option.getAttribute('aria-checked');
      problems.check(
        checked === 'true' || checked === 'false',
        `option ${j} in "${documented.type}" has aria-checked="${checked}"`,
      );
    });
    // A radiogroup with nothing checked has no state to announce.
    const checkedCount = options.filter(o => o.getAttribute('aria-checked') === 'true').length;
    problems.equal(checkedCount, 1, `checked options in "${documented.type}"`);
  });

  // ── Call to action ───────────────────────────────────────────────────────
  const cta = partOf(el, 'cta');
  if (problems.check(cta !== null, 'no [part="cta"]')) {
    // Documented: "Out-of-stock disables CTA button".
    problems.equal(
      (cta as HTMLButtonElement).disabled, !s.inStock,
      `[part="cta"] disabled for inStock=${s.inStock}`,
    );
    problems.check(text(cta!).length > 0, 'the CTA button has no label');
  }
}
