import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-invoice';

const FROM = { name: 'Acme Corp', address: '123 Business Ave, Suite 100, New York, NY 10001', email: 'billing@acme.com', phone: '(555) 123-4567' };
const TO = { name: 'Client Industries', address: '456 Oak Street, Chicago, IL 60601', email: 'ap@client.com', phone: '(555) 987-6543' };
const ITEMS = [
  { description: 'Web Development', quantity: 40, unitPrice: 150 },
  { description: 'UI/UX Design', quantity: 20, unitPrice: 120 },
  { description: 'Hosting (annual)', quantity: 1, unitPrice: 500 },
];

function makeInvoice(attrs: Record<string, string> = {}, withData = true) {
  const el = document.createElement('snice-invoice');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (withData) {
    (el as any).from = FROM;
    (el as any).to = TO;
    (el as any).items = ITEMS;
  }
  el.style.cssText = 'display:block;max-width:700px;';
  return el;
}

type Args = {
  invoiceNumber?: string;
  date?: string;
  dueDate?: string;
  status?: string;
  currency?: string;
  variant?: string;
  taxRate?: number;
  discount?: number;
  notes?: string;
};

const meta: Meta<Args> = {
  title: 'Commerce/Invoice',
  component: 'snice-invoice',
  tags: ['autodocs'],
  argTypes: {
    invoiceNumber: { control: 'text' },
    date:          { control: 'text' },
    dueDate:       { control: 'text' },
    status:        { control: 'select', options: ['draft', 'sent', 'paid', 'overdue', 'cancelled'] },
    currency:      { control: 'text' },
    variant:       { control: 'select', options: ['standard', 'modern', 'classic', 'minimal', 'detailed'] },
    taxRate:       { control: 'number' },
    discount:      { control: 'number' },
    notes:         { control: 'text' },
  },
  render: (args) => {
    const el = makeInvoice({
      'invoice-number': args.invoiceNumber ?? 'INV-001',
      date: args.date ?? '2026-03-01',
      ...(args.dueDate ? { 'due-date': args.dueDate } : {}),
      status: args.status ?? 'draft',
      currency: args.currency ?? 'USD',
      variant: args.variant ?? 'standard',
      ...(args.taxRate !== undefined ? { 'tax-rate': String(args.taxRate) } : {}),
      ...(args.discount !== undefined ? { discount: String(args.discount) } : {}),
      ...(args.notes ? { notes: args.notes } : {}),
    });
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { invoiceNumber: 'INV-001', date: '2026-03-01', status: 'draft', currency: 'USD', variant: 'standard' },
};

// h2: Status: draft
export const StatusDraft: Story = {
  render: () => makeInvoice({ 'invoice-number': 'INV-001', date: '2026-03-01', status: 'draft' }),
};

// h2: Status: sent
export const StatusSent: Story = {
  render: () => makeInvoice({ 'invoice-number': 'INV-002', date: '2026-03-01', 'due-date': '2026-04-01', status: 'sent' }),
};

// h2: Status: paid
export const StatusPaid: Story = {
  render: () => makeInvoice({ 'invoice-number': 'INV-003', date: '2026-02-01', status: 'paid' }),
};

// h2: Status: overdue
export const StatusOverdue: Story = {
  render: () => makeInvoice({ 'invoice-number': 'INV-004', date: '2026-01-01', 'due-date': '2026-02-01', status: 'overdue' }),
};

// h2: Status: cancelled
export const StatusCancelled: Story = {
  render: () => makeInvoice({ 'invoice-number': 'INV-005', date: '2026-01-15', status: 'cancelled' }),
};

// h2: Variant: standard (default)
export const VariantStandard: Story = {
  render: () => makeInvoice({ 'invoice-number': 'INV-010', date: '2026-03-06', variant: 'standard' }),
};

// h2: Variant: modern
export const VariantModern: Story = {
  render: () => makeInvoice({ 'invoice-number': 'INV-011', date: '2026-03-06', variant: 'modern' }),
};

// h2: Variant: classic
export const VariantClassic: Story = {
  render: () => makeInvoice({ 'invoice-number': 'INV-012', date: '2026-03-06', variant: 'classic' }),
};

// h2: Variant: minimal
export const VariantMinimal: Story = {
  render: () => makeInvoice({ 'invoice-number': 'INV-013', date: '2026-03-06', variant: 'minimal' }),
};

// h2: Variant: detailed
export const VariantDetailed: Story = {
  render: () => makeInvoice({ 'invoice-number': 'INV-014', date: '2026-03-06', variant: 'detailed' }),
};

// h2: Tax Rate (8%) + Discount (10%)
export const TaxRateDiscount: Story = {
  render: () => makeInvoice({ 'invoice-number': 'INV-020', date: '2026-03-06', 'tax-rate': '8', discount: '10' }),
};

// h2: Notes
export const Notes: Story = {
  render: () => makeInvoice({ 'invoice-number': 'INV-021', date: '2026-03-06', notes: 'Payment is due within 30 days. Late payments incur a 1.5% monthly fee.' }),
};

// h2: QR Position: top-right
export const QrPositionTopRight: Story = {
  render: () => {
    const el = makeInvoice({ 'invoice-number': 'INV-030', date: '2026-03-06', 'show-qr': '', 'qr-position': 'top-right' });
    const qr = document.createElement('div');
    qr.setAttribute('slot', 'qr');
    qr.style.cssText = 'width:80px;height:80px;background:#ddd;display:flex;align-items:center;justify-content:center;font-size:0.7rem;border-radius:4px;';
    qr.textContent = 'QR';
    el.appendChild(qr);
    return el;
  },
};

// h2: QR Position: bottom-right
export const QrPositionBottomRight: Story = {
  render: () => {
    const el = makeInvoice({ 'invoice-number': 'INV-031', date: '2026-03-06', 'show-qr': '', 'qr-position': 'bottom-right' });
    const qr = document.createElement('div');
    qr.setAttribute('slot', 'qr');
    qr.style.cssText = 'width:80px;height:80px;background:#ddd;display:flex;align-items:center;justify-content:center;font-size:0.7rem;border-radius:4px;';
    qr.textContent = 'QR';
    el.appendChild(qr);
    return el;
  },
};

// h2: QR Position: bottom-left
export const QrPositionBottomLeft: Story = {
  render: () => {
    const el = makeInvoice({ 'invoice-number': 'INV-032', date: '2026-03-06', 'show-qr': '', 'qr-position': 'bottom-left' });
    const qr = document.createElement('div');
    qr.setAttribute('slot', 'qr');
    qr.style.cssText = 'width:80px;height:80px;background:#ddd;display:flex;align-items:center;justify-content:center;font-size:0.7rem;border-radius:4px;';
    qr.textContent = 'QR';
    el.appendChild(qr);
    return el;
  },
};

// h2: QR Position: footer
export const QrPositionFooter: Story = {
  render: () => {
    const el = makeInvoice({ 'invoice-number': 'INV-033', date: '2026-03-06', 'show-qr': '', 'qr-position': 'footer' });
    const qr = document.createElement('div');
    qr.setAttribute('slot', 'qr');
    qr.style.cssText = 'width:80px;height:80px;background:#ddd;display:flex;align-items:center;justify-content:center;font-size:0.7rem;border-radius:4px;';
    qr.textContent = 'QR';
    el.appendChild(qr);
    return el;
  },
};

// h2: Currency: GBP
export const CurrencyGbp: Story = {
  render: () => makeInvoice({ 'invoice-number': 'INV-040', date: '2026-03-06', currency: 'GBP' }),
};

// h2: Due Date
export const DueDate: Story = {
  render: () => makeInvoice({ 'invoice-number': 'INV-050', date: '2026-03-01', 'due-date': '2026-04-15', status: 'sent' }),
};

// h2: Slot: Default (footer content)
export const SlotDefaultFooterContent: Story = {
  render: () => {
    const el = makeInvoice({ 'invoice-number': 'INV-060', date: '2026-03-06' });
    const footer = document.createElement('div');
    footer.style.cssText = 'text-align:center;font-size:0.75rem;color:var(--snice-color-text-tertiary);padding:1rem 0;';
    footer.textContent = 'Thank you for your business! Contact billing@acme.com for questions.';
    el.appendChild(footer);
    return el;
  },
};

// h2: Edge: No Parties
export const EdgeNoParties: Story = {
  render: () => {
    const el = document.createElement('snice-invoice');
    el.setAttribute('invoice-number', 'INV-070');
    el.setAttribute('date', '2026-03-06');
    (el as any).items = ITEMS;
    el.style.cssText = 'display:block;max-width:700px;';
    return el;
  },
};

// h2: Edge: No Items
export const EdgeNoItems: Story = {
  render: () => {
    const el = document.createElement('snice-invoice');
    el.setAttribute('invoice-number', 'INV-071');
    el.setAttribute('date', '2026-03-06');
    (el as any).from = FROM;
    (el as any).to = TO;
    (el as any).items = [];
    el.style.cssText = 'display:block;max-width:700px;';
    return el;
  },
};
