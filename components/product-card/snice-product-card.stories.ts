import type { Meta, StoryObj } from '@storybook/web-components-vite';
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
