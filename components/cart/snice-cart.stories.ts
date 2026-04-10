import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-cart';

type Args = {
  currency?: string;
  taxRate?: number;
  discount?: number;
  couponCode?: string;
};

const meta: Meta<Args> = {
  title: 'Commerce/Cart',
  component: 'snice-cart',
  tags: ['autodocs'],
  argTypes: {
    currency:   { control: 'text' },
    taxRate:    { control: 'number' },
    discount:   { control: 'number' },
    couponCode: { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-cart');
    if (args.currency !== undefined) el.setAttribute('currency', args.currency);
    if (args.taxRate !== undefined) el.setAttribute('tax-rate', String(args.taxRate));
    if (args.discount !== undefined) (el as any).discount = args.discount;
    if (args.couponCode !== undefined) el.setAttribute('coupon-code', args.couponCode);
    (el as any).items = [
      { id: '1', name: 'Widget', price: 9.99, quantity: 1 },
    ];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:500px;';
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { currency: '$', taxRate: 0, discount: 0 },
};

// h2: Empty cart
export const EmptyCart: Story = {
  render: () => {
    const el = document.createElement('snice-cart');
    (el as any).items = [];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:500px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Single item, no image, no tax, no discount
export const SingleItemNoImageNoTaxNoDiscount: Story = {
  render: () => {
    const el = document.createElement('snice-cart');
    (el as any).items = [{ id: '1', name: 'Widget', price: 9.99, quantity: 1 }];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:500px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Multiple items with images and variants
export const MultipleItemsWithImagesAndVariants: Story = {
  render: () => {
    const el = document.createElement('snice-cart');
    (el as any).items = [
      { id: '1', name: 'Premium Running Shoes', image: 'https://picsum.photos/seed/shoe1/100/100', price: 89.99, quantity: 1, variant: 'Size: M, Color: Black' },
      { id: '2', name: 'Classic Watch', image: 'https://picsum.photos/seed/watch1/100/100', price: 249.00, quantity: 2 },
      { id: '3', name: 'Wireless Earbuds', price: 59.99, quantity: 3, variant: 'White' },
    ];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:500px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: tax-rate="8.5"
export const TaxRate85: Story = {
  render: () => {
    const el = document.createElement('snice-cart');
    (el as any).items = [
      { id: '1', name: 'Laptop', price: 999.00, quantity: 1 },
      { id: '2', name: 'Mouse', price: 29.99, quantity: 1 },
    ];
    (el as any).taxRate = 8.5;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:500px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: discount + coupon-code + tax-rate
export const DiscountCouponCodeTaxRate: Story = {
  render: () => {
    const el = document.createElement('snice-cart');
    (el as any).items = [
      { id: '1', name: 'Shirt', price: 45.00, quantity: 2 },
      { id: '2', name: 'Pants', price: 65.00, quantity: 1 },
    ];
    (el as any).discount = 15.50;
    el.setAttribute('coupon-code', 'SAVE15');
    (el as any).taxRate = 7;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:500px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: currency="€" (Euro)
export const CurrencyEuro: Story = {
  render: () => {
    const el = document.createElement('snice-cart');
    el.setAttribute('currency', '€');
    (el as any).items = [
      { id: '1', name: 'Baguette', price: 2.50, quantity: 3 },
      { id: '2', name: 'Croissant', price: 1.80, quantity: 6 },
    ];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:500px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: currency="£" (Pound)
export const CurrencyPound: Story = {
  render: () => {
    const el = document.createElement('snice-cart');
    el.setAttribute('currency', '£');
    (el as any).items = [{ id: '1', name: 'Tea Set', price: 34.99, quantity: 1 }];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:500px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Edge: long name, high quantity, large price, low price, discount, tax
export const EdgeLongNameHighQuantity: Story = {
  render: () => {
    const el = document.createElement('snice-cart');
    (el as any).items = [
      { id: '1', name: 'Extraordinarily Long Product Name That Should Wrap Gracefully in the Cart Item Layout', price: 12345.67, quantity: 99 },
      { id: '2', name: 'X', price: 0.01, quantity: 1 },
    ];
    (el as any).taxRate = 10;
    (el as any).discount = 100;
    el.setAttribute('coupon-code', 'BIG');
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:500px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: All features: images, variants, tax, discount, coupon
export const AllFeaturesImageVariantsTaxDiscountCoupon: Story = {
  render: () => {
    const el = document.createElement('snice-cart');
    (el as any).items = [
      { id: '1', name: 'Item A', image: 'https://picsum.photos/seed/a/100/100', price: 50.00, quantity: 1, variant: 'Red' },
      { id: '2', name: 'Item B', image: 'https://picsum.photos/seed/b/100/100', price: 75.00, quantity: 2, variant: 'Large' },
      { id: '3', name: 'Item C', price: 25.00, quantity: 1 },
    ];
    (el as any).taxRate = 9.25;
    (el as any).discount = 20;
    el.setAttribute('coupon-code', 'COMBO20');
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:500px;';
    wrap.appendChild(el);
    return wrap;
  },
};
