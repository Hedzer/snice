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
  title: 'Commerce/Receipt',
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
