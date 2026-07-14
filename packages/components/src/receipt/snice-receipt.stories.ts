import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-receipt';

const MERCHANT = { name: 'Coffee House', address: '123 Brew St, Portland OR', phone: '555-0100', email: 'hello@coffee.com', website: 'coffee.com' };
const ITEMS = [
  { name: 'Cappuccino', quantity: 2, price: 4.50 },
  { name: 'Croissant', quantity: 1, price: 3.75 },
  { name: 'Espresso', quantity: 3, price: 3.00 },
];
const DETAILED_ITEMS = [
  { name: 'Cappuccino', quantity: 2, price: 4.50, sku: 'CAP-001', note: 'Oat milk' },
  { name: 'Croissant', quantity: 1, price: 3.75, sku: 'CRO-002', discount: 0.50 },
];

function setup(el: HTMLElement, extra: Record<string, unknown> = {}) {
  (el as any).merchant = extra.merchant ?? MERCHANT;
  (el as any).items = extra.items ?? ITEMS;
  (el as any).tax = extra.tax !== undefined ? extra.tax : 1.87;
  if (extra.tip !== undefined) (el as any).tip = extra.tip;
  if (extra.discount !== undefined) (el as any).discount = extra.discount;
  if (extra.taxes !== undefined) (el as any).taxes = extra.taxes;
  (el as any).receiptNumber = extra.receiptNumber ?? 'REC-4521';
  (el as any).date = extra.date ?? '2026-03-06 14:30';
  return el;
}

type Args = {
  variant?: string;
  currency?: string;
  receiptNumber?: string;
  date?: string;
};

const meta: Meta<Args> = {
  title: 'Receipt',
  component: 'snice-receipt',
  tags: ['autodocs'],
  argTypes: {
    variant:       { control: 'select', options: ['standard', 'thermal', 'modern', 'minimal', 'detailed'] },
    currency:      { control: 'text' },
    receiptNumber: { control: 'text' },
    date:          { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-receipt');
    if (args.variant) el.setAttribute('variant', args.variant);
    if (args.currency) el.setAttribute('currency', args.currency);
    setup(el);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { variant: 'standard' },
};

// h2: Variant: standard (default)
export const VariantStandard: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    return setup(el);
  },
};

// h2: Variant: thermal
export const VariantThermal: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'thermal');
    return setup(el);
  },
};

// h2: Variant: modern
export const VariantModern: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'modern');
    return setup(el);
  },
};

// h2: Variant: minimal
export const VariantMinimal: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'minimal');
    return setup(el);
  },
};

// h2: Variant: detailed
export const VariantDetailed: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'detailed');
    return setup(el, { items: DETAILED_ITEMS });
  },
};

// h2: All variants side by side
export const AllVariantsSideBySide: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:flex-start;gap:1.5rem;flex-wrap:wrap;';
    for (const variant of ['standard', 'thermal', 'modern', 'minimal']) {
      const el = document.createElement('snice-receipt');
      el.setAttribute('variant', variant);
      setup(el);
      wrap.appendChild(el);
    }
    return wrap;
  },
};

// h2: With tip
export const WithTip: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    return setup(el, { tip: 3.00 });
  },
};

// h2: With discount
export const WithDiscount: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    el.setAttribute('discount-label', 'Promo Code');
    return setup(el, { discount: 2.50 });
  },
};

// h2: Multiple tax lines
export const MultipleTaxLines: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    return setup(el, { tax: 0, taxes: [{ label: 'State Tax', rate: 6, amount: 1.12 }, { label: 'City Tax', rate: 2, amount: 0.37 }] });
  },
};

// h2: Payment method
export const PaymentMethod: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    el.setAttribute('payment-method', 'Visa **** 4242');
    el.setAttribute('payment-details', 'Auth: 892341');
    return setup(el);
  },
};

// h2: Custom thank-you message
export const CustomThankYouMessage: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    el.setAttribute('thank-you', 'We appreciate your business!');
    return setup(el);
  },
};

// h2: Empty thank-you (hidden)
export const EmptyThankYouHidden: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    el.setAttribute('thank-you', '');
    return setup(el);
  },
};

// h2: Cashier + terminal
export const CashierTerminal: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    el.setAttribute('cashier', 'Alice');
    el.setAttribute('terminal-id', 'POS-03');
    return setup(el);
  },
};

// h2: QR position: top
export const QrPositionTop: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    el.toggleAttribute('show-qr', true);
    el.setAttribute('qr-position', 'top');
    return setup(el);
  },
};

// h2: QR position: bottom
export const QrPositionBottom: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    el.toggleAttribute('show-qr', true);
    el.setAttribute('qr-position', 'bottom');
    return setup(el);
  },
};

// h2: QR position: footer
export const QrPositionFooter: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    el.toggleAttribute('show-qr', true);
    el.setAttribute('qr-position', 'footer');
    return setup(el);
  },
};

// h2: Currency: EUR
export const CurrencyEur: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    el.setAttribute('currency', 'EUR');
    return setup(el);
  },
};

// h2: Currency: GBP
export const CurrencyGbp: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    el.setAttribute('currency', 'GBP');
    return setup(el);
  },
};

// h2: Currency: JPY
export const CurrencyJpy: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    el.setAttribute('currency', 'JPY');
    return setup(el);
  },
};

// h2: Barcode slot
export const BarcodeSlot: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    setup(el);
    const barcode = document.createElement('div');
    barcode.setAttribute('slot', 'barcode');
    barcode.style.cssText = 'text-align:center;padding:0.5rem;font-family:monospace;font-size:0.7rem;letter-spacing:0.2em;';
    barcode.textContent = '||||| |||| ||||| |||| |||||';
    el.appendChild(barcode);
    return el;
  },
};

// h2: Default slot (footer content)
export const DefaultSlotFooterContent: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    setup(el);
    const footer = document.createElement('p');
    footer.style.cssText = 'text-align:center;font-size:0.75rem;margin:0.5rem 0 0;';
    footer.textContent = 'Returns accepted within 30 days with receipt.';
    el.appendChild(footer);
    return el;
  },
};

// h2: No items (empty receipt)
export const NoItemsEmptyReceipt: Story = {
  render: () => {
    const el = document.createElement('snice-receipt');
    el.setAttribute('variant', 'standard');
    el.setAttribute('receipt-number', 'REC-000');
    el.setAttribute('date', '2026-03-06');
    (el as any).merchant = { name: 'Empty Store' };
    (el as any).items = [];
    return el;
  },
};

// CSS Parts: base, header, logo, merchant-name, merchant-address, merchant-contact, meta,
//            receipt-number, date, divider, items, items-header, item, item-name, item-qty,
//            item-price, item-sku, totals, subtotal-row, discount-row, tax-row, tip-row,
//            total-row, payment, payment-method, payment-details, barcode-area, qr-container,
//            thank-you, footer
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; }
      .parts-demo snice-receipt { max-width: 360px; display: block; }
      .parts-demo .label { font: 700 11px/1 sans-serif; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }

      /* Retro diner theme */
      .parts-demo .styled::part(base) { background: #fdf6e3; border: 3px solid #8b4513; font-family: 'Courier New', monospace; border-radius: 0; }
      .parts-demo .styled::part(header) { background: #8b4513; color: #fdf6e3; padding: 1rem; text-align: center; }
      .parts-demo .styled::part(logo) { border-radius: 50%; border: 2px solid #fdf6e3; }
      .parts-demo .styled::part(merchant-name) { color: #fdf6e3; font-size: 1.4rem; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
      .parts-demo .styled::part(merchant-address) { color: #f5deb3; font-size: 0.8rem; }
      .parts-demo .styled::part(merchant-contact) { color: #f5deb3; font-size: 0.8rem; }
      .parts-demo .styled::part(meta) { padding: 0.5rem 1rem; background: #fdf6e3; }
      .parts-demo .styled::part(receipt-number) { color: #8b4513; font-weight: 700; }
      .parts-demo .styled::part(date) { color: #6b4423; }
      .parts-demo .styled::part(divider) { border-top: 2px dashed #8b4513; margin: 0.5rem 1rem; }
      .parts-demo .styled::part(items) { padding: 0 1rem; }
      .parts-demo .styled::part(items-header) { color: #8b4513; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; border-bottom: 1px solid #8b4513; padding-bottom: 4px; }
      .parts-demo .styled::part(item) { border-bottom: 1px dotted #c9a87c; padding: 4px 0; color: #3d2b1f; }
      .parts-demo .styled::part(item-name) { font-weight: 700; }
      .parts-demo .styled::part(item-qty) { color: #8b4513; }
      .parts-demo .styled::part(item-price) { color: #3d2b1f; font-weight: 700; }
      .parts-demo .styled::part(item-sku) { color: #a0856a; font-size: 0.75rem; }
      .parts-demo .styled::part(totals) { padding: 0.5rem 1rem; }
      .parts-demo .styled::part(subtotal-row) { color: #5a3e28; }
      .parts-demo .styled::part(discount-row) { color: #2d7a2d; font-weight: 600; }
      .parts-demo .styled::part(tax-row) { color: #8b4513; }
      .parts-demo .styled::part(tip-row) { color: #8b4513; }
      .parts-demo .styled::part(total-row) { color: #8b4513; font-size: 1.2rem; font-weight: 900; border-top: 3px double #8b4513; margin-top: 0.25rem; padding-top: 0.25rem; }
      .parts-demo .styled::part(payment) { padding: 0.5rem 1rem; background: #f5e6cc; border-top: 1px dashed #8b4513; }
      .parts-demo .styled::part(payment-method) { color: #8b4513; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; }
      .parts-demo .styled::part(payment-details) { color: #6b4423; font-size: 0.8rem; }
      .parts-demo .styled::part(barcode-area) { padding: 0.5rem 1rem; text-align: center; }
      .parts-demo .styled::part(qr-container) { background: #fff; padding: 0.5rem; border: 1px solid #c9a87c; display: inline-block; }
      .parts-demo .styled::part(thank-you) { color: #8b4513; font-style: italic; font-size: 1.1rem; font-weight: 700; text-align: center; padding: 0.75rem; }
      .parts-demo .styled::part(footer) { background: #8b4513; color: #f5deb3; text-align: center; padding: 0.75rem; font-size: 0.8rem; }
    `;

    const MERCHANT = { name: "Mama Rosa's Diner", address: '42 Main Street, Brooklyn, NY', phone: '(718) 555-0199', email: 'hello@mamarosa.com' };
    const ITEMS = [
      { name: 'Pancake Stack', quantity: 2, price: 12.99, sku: 'FOOD-001' },
      { name: 'Fresh OJ', quantity: 2, price: 4.50 },
      { name: 'Bacon (extra)', quantity: 1, price: 3.99, sku: 'FOOD-042', discount: 1.00 },
      { name: 'Coffee Refills', quantity: 3, price: 1.50 },
    ];

    const makeReceipt = (cls: string) => {
      const el = document.createElement('snice-receipt');
      if (cls) el.classList.add(cls);
      el.setAttribute('receipt-number', 'RCT-20260409-0042');
      el.setAttribute('date', '2026-04-09T08:30:00');
      el.setAttribute('payment-method', 'Cash');
      el.setAttribute('payment-details', 'Tendered: $50.00 | Change: $13.53');
      el.setAttribute('thank-you', 'Come back soon! Breakfast served all day!');
      (el as any).merchant = MERCHANT;
      (el as any).items = ITEMS;
      (el as any).tax = 0.08875;
      (el as any).tip = 5.00;
      (el as any).discount = 2.00;
      (el as any).discountLabel = 'Loyalty Reward';
      el.style.cssText = 'display:block;max-width:360px;';
      return el;
    };

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-demo');

    const col1 = document.createElement('div');
    const lbl1 = document.createElement('div'); lbl1.className = 'label'; lbl1.textContent = 'Default';
    col1.appendChild(lbl1); col1.appendChild(makeReceipt(''));

    const col2 = document.createElement('div');
    const lbl2 = document.createElement('div'); lbl2.className = 'label'; lbl2.textContent = 'Retro Diner Theme via ::part()';
    col2.appendChild(lbl2); col2.appendChild(makeReceipt('styled'));

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
      .parts-adv snice-receipt { max-width: 360px; display: block; }

      /* Luxury boutique theme */
      .parts-adv .boutique::part(base) { background: #0a0a0a; border: 1px solid #d4af37; font-family: 'Georgia', serif; }
      .parts-adv .boutique::part(header) { background: #0a0a0a; border-bottom: 1px solid #d4af37; padding: 2rem; text-align: center; }
      .parts-adv .boutique::part(merchant-name) { color: #d4af37; font-size: 1.2rem; letter-spacing: 4px; text-transform: uppercase; font-weight: 400; }
      .parts-adv .boutique::part(merchant-address) { color: #888; font-size: 0.75rem; letter-spacing: 1px; }
      .parts-adv .boutique::part(merchant-contact) { color: #888; font-size: 0.75rem; }
      .parts-adv .boutique::part(receipt-number) { color: #d4af37; font-size: 0.75rem; letter-spacing: 2px; }
      .parts-adv .boutique::part(date) { color: #666; font-size: 0.75rem; }
      .parts-adv .boutique::part(divider) { border-color: #d4af37; opacity: 0.3; }
      .parts-adv .boutique::part(items-header) { color: #d4af37; font-size: 0.7rem; letter-spacing: 3px; text-transform: uppercase; }
      .parts-adv .boutique::part(item) { border-color: rgba(212,175,55,0.15); color: #e0e0e0; }
      .parts-adv .boutique::part(item-name) { color: #f0f0f0; font-style: italic; }
      .parts-adv .boutique::part(item-qty) { color: #888; }
      .parts-adv .boutique::part(item-price) { color: #d4af37; }
      .parts-adv .boutique::part(item-sku) { color: #555; }
      .parts-adv .boutique::part(discount-row) { color: #4ade80; }
      .parts-adv .boutique::part(tax-row) { color: #888; font-size: 0.85rem; }
      .parts-adv .boutique::part(tip-row) { color: #60a5fa; }
      .parts-adv .boutique::part(total-row) { color: #d4af37; font-size: 1.15rem; border-color: #d4af37; }
      .parts-adv .boutique::part(payment) { background: #111; border-color: rgba(212,175,55,0.3); }
      .parts-adv .boutique::part(payment-method) { color: #d4af37; }
      .parts-adv .boutique::part(payment-details) { color: #888; font-size: 0.8rem; }
      .parts-adv .boutique::part(thank-you) { color: #d4af37; font-style: italic; letter-spacing: 1px; }
      .parts-adv .boutique::part(footer) { background: #111; color: #555; border-top: 1px solid rgba(212,175,55,0.2); font-size: 0.7rem; letter-spacing: 1px; }
      .parts-adv .boutique::part(qr-container) { background: #fff; border: 1px solid #d4af37; }
    `;

    const MERCHANT = { name: 'MAISON ÉLITE', address: '9 Rue du Faubourg Saint-Honoré, Paris', phone: '+33 1 42 55 01 00', website: 'maisonelite.com' };
    const ITEMS = [
      { name: 'Silk Evening Gown', quantity: 1, price: 2400.00, sku: 'GWN-SE-001' },
      { name: 'Pearl Earrings', quantity: 1, price: 850.00, sku: 'JWL-PE-019' },
      { name: 'Cashmere Wrap', quantity: 1, price: 480.00, sku: 'ACC-CW-007', discount: 48.00 },
    ];

    const el = document.createElement('snice-receipt');
    el.classList.add('boutique');
    el.setAttribute('receipt-number', 'ME-2026-00042');
    el.setAttribute('date', '2026-04-09T14:15:00');
    el.setAttribute('payment-method', 'Amex Centurion');
    el.setAttribute('payment-details', '**** **** **** 0001');
    el.setAttribute('thank-you', 'Merci. À bientôt.');
    (el as any).merchant = MERCHANT;
    (el as any).items = ITEMS;
    (el as any).tax = 0.20;
    (el as any).tip = 0;
    (el as any).discount = 48.00;
    (el as any).discountLabel = 'Member Discount 10%';
    (el as any).showQr = true;
    el.style.cssText = 'display:block;max-width:360px;';

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-adv');

    const col = document.createElement('div');
    const lbl = document.createElement('div');
    lbl.style.cssText = 'font:700 11px/1 sans-serif;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;';
    lbl.textContent = 'Luxury Boutique Theme via ::part()';
    col.appendChild(lbl);
    col.appendChild(el);
    wrap.appendChild(col);
    return wrap;
  },
};
