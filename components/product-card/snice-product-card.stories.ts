import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-product-card';

const IMG1 = ['https://picsum.photos/seed/shoe/400/400'];
const IMGS = [
  'https://picsum.photos/seed/prod1/400/400',
  'https://picsum.photos/seed/prod2/400/400',
  'https://picsum.photos/seed/prod3/400/400',
];

type Args = {
  name?: string;
  price?: number;
  salePrice?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  variant?: string;
  badge?: string;
  badgeVariant?: string;
  loading?: boolean;
  favorite?: boolean;
  stockCount?: number;
};

const meta: Meta<Args> = {
  title: 'Commerce/ProductCard',
  component: 'snice-product-card',
  tags: ['autodocs'],
  argTypes: {
    name:         { control: 'text' },
    price:        { control: 'number' },
    salePrice:    { control: 'number' },
    currency:     { control: 'text' },
    rating:       { control: 'number' },
    reviewCount:  { control: 'number' },
    inStock:      { control: 'boolean' },
    variant:      { control: 'select', options: ['vertical', 'horizontal', 'compact', 'featured'] },
    badge:        { control: 'text' },
    badgeVariant: { control: 'select', options: ['sale', 'new', 'hot', 'limited'] },
    loading:      { control: 'boolean' },
    favorite:     { control: 'boolean' },
    stockCount:   { control: 'number' },
  },
  render: (args) => {
    const el = document.createElement('snice-product-card');
    el.setAttribute('name', args.name ?? 'Classic Sneakers');
    el.setAttribute('price', String(args.price ?? 129.99));
    if (args.salePrice !== undefined) el.setAttribute('sale-price', String(args.salePrice));
    if (args.currency !== undefined) el.setAttribute('currency', args.currency);
    if (args.rating !== undefined) el.setAttribute('rating', String(args.rating));
    if (args.reviewCount !== undefined) el.setAttribute('review-count', String(args.reviewCount));
    if (args.variant !== undefined) el.setAttribute('variant', args.variant);
    if (args.badge !== undefined) el.setAttribute('badge', args.badge);
    if (args.badgeVariant !== undefined) el.setAttribute('badge-variant', args.badgeVariant);
    if (args.stockCount !== undefined) el.setAttribute('stock-count', String(args.stockCount));
    if (args.inStock !== false) el.toggleAttribute('in-stock', true);
    if (args.loading) el.toggleAttribute('loading', true);
    if (args.favorite) el.toggleAttribute('favorite', true);
    (el as any).images = IMG1;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;max-width:320px;';
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { name: 'Classic Sneakers', price: 129.99, rating: 4.5, reviewCount: 342, inStock: true },
};

// h2: Variant: vertical (default)
export const VariantVertical: Story = {
  render: () => {
    const el = document.createElement('snice-product-card');
    el.setAttribute('name', 'Classic Sneakers');
    el.setAttribute('price', '129.99');
    el.setAttribute('rating', '4.5');
    el.setAttribute('review-count', '342');
    el.toggleAttribute('in-stock', true);
    (el as any).images = IMG1;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:320px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Variant: horizontal
export const VariantHorizontal: Story = {
  render: () => {
    const el = document.createElement('snice-product-card');
    el.setAttribute('variant', 'horizontal');
    el.setAttribute('name', 'Wireless Headphones');
    el.setAttribute('price', '199.99');
    el.setAttribute('rating', '4');
    el.setAttribute('review-count', '128');
    el.toggleAttribute('in-stock', true);
    (el as any).images = IMG1;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:600px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Variant: compact
export const VariantCompact: Story = {
  render: () => {
    const el = document.createElement('snice-product-card');
    el.setAttribute('variant', 'compact');
    el.setAttribute('name', 'USB Cable');
    el.setAttribute('price', '9.99');
    el.setAttribute('rating', '3.5');
    el.setAttribute('review-count', '56');
    el.toggleAttribute('in-stock', true);
    (el as any).images = IMG1;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:240px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Variant: featured
export const VariantFeatured: Story = {
  render: () => {
    const el = document.createElement('snice-product-card');
    el.setAttribute('variant', 'featured');
    el.setAttribute('name', 'Pro Laptop');
    el.setAttribute('price', '1499');
    el.setAttribute('rating', '5');
    el.setAttribute('review-count', '1024');
    el.toggleAttribute('in-stock', true);
    (el as any).images = IMGS;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:320px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Sale price
export const SalePrice: Story = {
  render: () => {
    const el = document.createElement('snice-product-card');
    el.setAttribute('name', 'Winter Jacket');
    el.setAttribute('price', '199.99');
    el.setAttribute('sale-price', '139.99');
    el.setAttribute('rating', '4');
    el.setAttribute('review-count', '87');
    el.toggleAttribute('in-stock', true);
    (el as any).images = IMG1;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:320px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Badge: sale
export const BadgeSale: Story = {
  render: () => {
    const el = document.createElement('snice-product-card');
    el.setAttribute('name', 'Sale Item');
    el.setAttribute('price', '50');
    el.setAttribute('sale-price', '29.99');
    el.setAttribute('badge', '30% OFF');
    el.setAttribute('badge-variant', 'sale');
    el.toggleAttribute('in-stock', true);
    (el as any).images = IMG1;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:320px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Badge: new
export const BadgeNew: Story = {
  render: () => {
    const el = document.createElement('snice-product-card');
    el.setAttribute('name', 'New Arrival');
    el.setAttribute('price', '79.99');
    el.setAttribute('badge', 'New');
    el.setAttribute('badge-variant', 'new');
    el.toggleAttribute('in-stock', true);
    (el as any).images = IMG1;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:320px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Badge: hot
export const BadgeHot: Story = {
  render: () => {
    const el = document.createElement('snice-product-card');
    el.setAttribute('name', 'Trending Item');
    el.setAttribute('price', '45');
    el.setAttribute('badge', 'Hot');
    el.setAttribute('badge-variant', 'hot');
    el.toggleAttribute('in-stock', true);
    (el as any).images = IMG1;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:320px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Badge: limited
export const BadgeLimited: Story = {
  render: () => {
    const el = document.createElement('snice-product-card');
    el.setAttribute('name', 'Limited Edition');
    el.setAttribute('price', '299');
    el.setAttribute('badge', 'Limited');
    el.setAttribute('badge-variant', 'limited');
    el.toggleAttribute('in-stock', true);
    (el as any).images = IMG1;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:320px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Out of stock
export const OutOfStock: Story = {
  render: () => {
    const el = document.createElement('snice-product-card');
    el.setAttribute('name', 'Sold Out Widget');
    el.setAttribute('price', '59.99');
    (el as any).images = IMG1;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:320px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Low stock (stock-count="3")
export const LowStock: Story = {
  render: () => {
    const el = document.createElement('snice-product-card');
    el.setAttribute('name', 'Almost Gone');
    el.setAttribute('price', '39.99');
    el.setAttribute('stock-count', '3');
    el.toggleAttribute('in-stock', true);
    (el as any).images = IMG1;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:320px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Favorite toggled
export const FavoriteToggled: Story = {
  render: () => {
    const el = document.createElement('snice-product-card');
    el.setAttribute('name', 'Favorited Item');
    el.setAttribute('price', '24.99');
    el.toggleAttribute('favorite', true);
    el.toggleAttribute('in-stock', true);
    (el as any).images = IMG1;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:320px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Loading (skeleton)
export const LoadingSkeleton: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    const el1 = document.createElement('snice-product-card');
    el1.toggleAttribute('loading', true);
    el1.style.cssText = 'max-width:320px;';
    const el2 = document.createElement('snice-product-card');
    el2.toggleAttribute('loading', true);
    el2.setAttribute('variant', 'horizontal');
    el2.style.cssText = 'max-width:600px;';
    wrap.appendChild(el1);
    wrap.appendChild(el2);
    return wrap;
  },
};

// h2: Rating values: 0, 1, 2.5, 3, 4.5, 5
export const RatingValues: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    const ratings = [
      [0, '0 Stars', 0],
      [1, '1 Star', 2],
      [2.5, '2.5 Stars', 15],
      [3, '3 Stars', 30],
      [4.5, '4.5 Stars', 200],
      [5, '5 Stars', 500],
    ] as [number, string, number][];
    for (const [r, name, count] of ratings) {
      const el = document.createElement('snice-product-card');
      el.setAttribute('name', name);
      el.setAttribute('price', '10');
      el.setAttribute('rating', String(r));
      if (count > 0) el.setAttribute('review-count', String(count));
      el.toggleAttribute('in-stock', true);
      (el as any).images = IMG1;
      el.style.cssText = 'max-width:200px;';
      wrap.appendChild(el);
    }
    return wrap;
  },
};

// h2: Custom currency
export const CustomCurrency: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    const currencies = [
      ['EUR', '49.99', 'Euro Product'],
      ['GBP', '39.99', 'Pound Product'],
      ['JPY', '5000', 'Yen Product'],
    ] as [string, string, string][];
    for (const [currency, price, name] of currencies) {
      const el = document.createElement('snice-product-card');
      el.setAttribute('name', name);
      el.setAttribute('price', price);
      el.setAttribute('currency', currency);
      el.toggleAttribute('in-stock', true);
      el.style.cssText = 'max-width:240px;';
      wrap.appendChild(el);
    }
    return wrap;
  },
};

// h2: With variants (size + color)
export const WithVariants: Story = {
  render: () => {
    const el = document.createElement('snice-product-card');
    el.setAttribute('name', 'Customizable Shirt');
    el.setAttribute('price', '34.99');
    el.setAttribute('rating', '4');
    el.setAttribute('review-count', '67');
    el.toggleAttribute('in-stock', true);
    (el as any).images = IMG1;
    (el as any).variants = [
      { type: 'Size', options: ['XS', 'S', 'M', 'L', 'XL'] },
      { type: 'Color', options: ['#1a1a2e', '#e94560', '#0f3460', '#f5f5f5'] },
    ];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:320px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Multiple images (gallery)
export const MultipleImagesGallery: Story = {
  render: () => {
    const el = document.createElement('snice-product-card');
    el.setAttribute('name', 'Multi-Image Product');
    el.setAttribute('price', '89.99');
    el.setAttribute('rating', '4.5');
    el.setAttribute('review-count', '150');
    el.toggleAttribute('in-stock', true);
    (el as any).images = IMGS;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:320px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: No images
export const NoImages: Story = {
  render: () => {
    const el = document.createElement('snice-product-card');
    el.setAttribute('name', 'No Image Product');
    el.setAttribute('price', '19.99');
    el.toggleAttribute('in-stock', true);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:320px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// CSS Parts: base, badge, gallery, image, body, title, rating, stars, price, price-original,
//            price-current, discount, stock, variants, variant-group, variant-option,
//            favorite-btn, cta
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; }
      .parts-demo snice-product-card { max-width: 280px; }
      .parts-demo .label { font: 700 11px/1 sans-serif; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }

      /* Default (unstyled) card is the first one */

      /* Styled card */
      .parts-demo .styled::part(base) { background: #1a1a2e; border: 2px solid #e94560; border-radius: 16px; overflow: hidden; }
      .parts-demo .styled::part(gallery) { background: #0f3460; }
      .parts-demo .styled::part(image) { opacity: 0.9; }
      .parts-demo .styled::part(badge) { background: #e94560; color: #fff; font-weight: 900; border-radius: 0 0 8px 0; }
      .parts-demo .styled::part(body) { padding: 1.25rem; background: #16213e; }
      .parts-demo .styled::part(title) { color: #f5f5f5; font-size: 1.1rem; font-weight: 700; }
      .parts-demo .styled::part(rating) { color: #f5c518; }
      .parts-demo .styled::part(stars) { filter: hue-rotate(30deg) saturate(2); }
      .parts-demo .styled::part(price) { margin-top: 0.5rem; }
      .parts-demo .styled::part(price-current) { color: #e94560; font-size: 1.4rem; font-weight: 900; }
      .parts-demo .styled::part(price-original) { color: #888; text-decoration: line-through; }
      .parts-demo .styled::part(discount) { background: #e94560; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; }
      .parts-demo .styled::part(stock) { color: #4ade80; font-weight: 600; }
      .parts-demo .styled::part(variants) { border-top: 1px solid #e94560; padding-top: 0.5rem; margin-top: 0.5rem; }
      .parts-demo .styled::part(variant-group) { margin-bottom: 0.5rem; }
      .parts-demo .styled::part(variant-option) { background: #0f3460; border: 1px solid #e94560; color: #f5f5f5; border-radius: 4px; cursor: pointer; }
      .parts-demo .styled::part(favorite-btn) { background: rgba(233,69,96,0.15); border: 1px solid #e94560; border-radius: 50%; }
      .parts-demo .styled::part(cta) { background: #e94560; color: #fff; border: none; font-weight: 700; border-radius: 8px; cursor: pointer; width: 100%; padding: 0.75rem; }
    `;

    const makeCard = (cls: string) => {
      const el = document.createElement('snice-product-card');
      if (cls) el.classList.add(cls);
      el.setAttribute('name', 'Premium Sneakers');
      el.setAttribute('price', '189.99');
      el.setAttribute('sale-price', '139.99');
      el.setAttribute('rating', '4.5');
      el.setAttribute('review-count', '312');
      el.setAttribute('badge', '26% OFF');
      el.setAttribute('badge-variant', 'sale');
      el.setAttribute('stock-count', '5');
      el.toggleAttribute('in-stock', true);
      (el as any).images = ['https://picsum.photos/seed/sneaker/400/400'];
      (el as any).variants = [
        { type: 'Size', options: ['S', 'M', 'L'] },
        { type: 'Color', options: ['#1a1a2e', '#e94560'] },
      ];
      return el;
    };

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-demo');

    const col1 = document.createElement('div');
    const lbl1 = document.createElement('div'); lbl1.className = 'label'; lbl1.textContent = 'Default';
    col1.appendChild(lbl1); col1.appendChild(makeCard(''));

    const col2 = document.createElement('div');
    const lbl2 = document.createElement('div'); lbl2.className = 'label'; lbl2.textContent = 'Styled via ::part()';
    col2.appendChild(lbl2); col2.appendChild(makeCard('styled'));

    wrap.appendChild(col1);
    wrap.appendChild(col2);
    return wrap;
  },
};

export const CSSPartsAdvanced: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-adv { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; }
      .parts-adv snice-product-card { max-width: 280px; }

      /* Luxury theme */
      .parts-adv .luxury::part(base) { background: linear-gradient(160deg, #1c1c1c 0%, #2a2a2a 100%); border: 1px solid #c9a84c; border-radius: 12px; }
      .parts-adv .luxury::part(gallery) { border-bottom: 1px solid #c9a84c; }
      .parts-adv .luxury::part(badge) { background: #c9a84c; color: #1c1c1c; font-weight: 900; letter-spacing: 1px; }
      .parts-adv .luxury::part(body) { padding: 1.5rem; }
      .parts-adv .luxury::part(title) { color: #f0e6c8; font-family: Georgia, serif; font-size: 1.15rem; }
      .parts-adv .luxury::part(price-current) { color: #c9a84c; font-size: 1.5rem; }
      .parts-adv .luxury::part(price-original) { color: #666; }
      .parts-adv .luxury::part(stock) { color: #c9a84c; font-style: italic; }
      .parts-adv .luxury::part(cta) { background: #c9a84c; color: #1c1c1c; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; border-radius: 0; border: none; width: 100%; padding: 0.875rem; }
      .parts-adv .luxury::part(favorite-btn) { border: 1px solid #c9a84c; border-radius: 4px; }
      .parts-adv .luxury::part(variant-option) { background: #1c1c1c; border: 1px solid #c9a84c; color: #c9a84c; }

      /* Minimal/flat theme */
      .parts-adv .minimal::part(base) { background: #fafafa; border: 1px solid #e0e0e0; border-radius: 4px; }
      .parts-adv .minimal::part(gallery) { border-bottom: 1px solid #e0e0e0; }
      .parts-adv .minimal::part(badge) { background: #111; color: #fff; border-radius: 0; font-size: 0.65rem; letter-spacing: 2px; text-transform: uppercase; }
      .parts-adv .minimal::part(title) { color: #111; font-size: 0.95rem; font-weight: 400; }
      .parts-adv .minimal::part(price-current) { color: #111; font-weight: 700; }
      .parts-adv .minimal::part(price-original) { color: #999; }
      .parts-adv .minimal::part(discount) { background: #111; color: #fafafa; }
      .parts-adv .minimal::part(stock) { color: #555; font-size: 0.8rem; }
      .parts-adv .minimal::part(cta) { background: #111; color: #fff; border-radius: 2px; border: none; width: 100%; padding: 0.75rem; }
      .parts-adv .minimal::part(favorite-btn) { border: 1px solid #ddd; border-radius: 2px; }
    `;

    const makeCard = (cls: string, badge: string) => {
      const el = document.createElement('snice-product-card');
      if (cls) el.classList.add(cls);
      el.setAttribute('name', 'Limited Edition Watch');
      el.setAttribute('price', '599.00');
      el.setAttribute('sale-price', '449.00');
      el.setAttribute('rating', '5');
      el.setAttribute('review-count', '88');
      el.setAttribute('badge', badge);
      el.setAttribute('badge-variant', 'limited');
      el.setAttribute('stock-count', '2');
      el.toggleAttribute('in-stock', true);
      el.toggleAttribute('favorite', true);
      (el as any).images = ['https://picsum.photos/seed/watch99/400/400'];
      (el as any).variants = [
        { type: 'Band', options: ['Black', 'Brown', 'Silver'] },
      ];
      return el;
    };

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-adv');

    const themes = [
      { cls: 'luxury', label: 'Luxury Theme', badge: 'EXCLUSIVE' },
      { cls: 'minimal', label: 'Minimal Theme', badge: 'NEW' },
    ];
    for (const { cls, label, badge } of themes) {
      const col = document.createElement('div');
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font:700 11px/1 sans-serif;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;';
      lbl.textContent = label;
      col.appendChild(lbl);
      col.appendChild(makeCard(cls, badge));
      wrap.appendChild(col);
    }
    return wrap;
  },
};
