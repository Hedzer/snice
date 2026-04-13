import type { Meta, StoryObj } from '@storybook/web-components-vite';
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

// CSS Parts: base, header, items, item, coupon, summary, checkout, empty
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; }
      .parts-demo snice-cart { max-width: 460px; }
      .parts-demo .label { font: 700 11px/1 sans-serif; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }

      .parts-demo .styled::part(base) { background: #1a1a2e; border: 2px solid #e94560; border-radius: 16px; overflow: hidden; }
      .parts-demo .styled::part(header) { background: #e94560; color: #fff; padding: 1rem 1.25rem; font-weight: 900; font-size: 1.1rem; }
      .parts-demo .styled::part(items) { padding: 0.5rem 0; }
      .parts-demo .styled::part(item) { border-bottom: 1px solid rgba(233,69,96,0.3); padding: 0.75rem 1.25rem; color: #f5f5f5; }
      .parts-demo .styled::part(coupon) { background: rgba(233,69,96,0.1); border-top: 1px dashed #e94560; padding: 0.75rem 1.25rem; }
      .parts-demo .styled::part(summary) { background: #16213e; padding: 1rem 1.25rem; color: #f5f5f5; border-top: 2px solid #e94560; }
      .parts-demo .styled::part(checkout) { background: #e94560; color: #fff; border: none; font-weight: 900; font-size: 1rem; border-radius: 0; padding: 1rem; width: 100%; cursor: pointer; }
      .parts-demo .styled::part(empty) { color: #888; padding: 2rem; text-align: center; }
    `;

    const makeCart = (cls: string, items: object[]) => {
      const el = document.createElement('snice-cart');
      if (cls) el.classList.add(cls);
      (el as any).items = items;
      (el as any).taxRate = 8.5;
      (el as any).discount = 10;
      el.setAttribute('coupon-code', 'SAVE10');
      return el;
    };

    const ITEMS = [
      { id: '1', name: 'Running Shoes', image: 'https://picsum.photos/seed/shoe1/100/100', price: 89.99, quantity: 1, variant: 'Size M' },
      { id: '2', name: 'Smart Watch', image: 'https://picsum.photos/seed/watch1/100/100', price: 149.99, quantity: 2 },
    ];

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-demo');

    const col1 = document.createElement('div');
    const lbl1 = document.createElement('div'); lbl1.className = 'label'; lbl1.textContent = 'Default';
    col1.appendChild(lbl1); col1.appendChild(makeCart('', ITEMS));

    const col2 = document.createElement('div');
    const lbl2 = document.createElement('div'); lbl2.className = 'label'; lbl2.textContent = 'Styled via ::part()';
    col2.appendChild(lbl2); col2.appendChild(makeCart('styled', ITEMS));

    wrap.appendChild(col1);
    wrap.appendChild(col2);
    return wrap;
  },
};
