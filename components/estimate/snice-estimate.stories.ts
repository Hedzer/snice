import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-estimate';

const FROM = { name: 'Acme Corp', address: '123 Business Ave, Suite 100', email: 'billing@acme.com', phone: '(555) 123-4567' };
const TO = { name: 'Client LLC', address: '456 Oak St', email: 'finance@client.com', phone: '(555) 987-6543' };
const ITEMS = [
  { description: 'Website Design', quantity: 1, unitPrice: 5000 },
  { description: 'Development (per hour)', quantity: 40, unitPrice: 150 },
  { description: 'Hosting (annual)', quantity: 1, unitPrice: 500 },
];

function makeEstimate(attrs: Record<string, string> = {}, withData = true) {
  const el = document.createElement('snice-estimate');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (withData) {
    (el as any).from = FROM;
    (el as any).to = TO;
    (el as any).items = ITEMS;
  }
  el.style.cssText = 'max-width:700px;display:block;';
  return el;
}

type Args = {
  estimateNumber?: string;
  date?: string;
  expiryDate?: string;
  status?: string;
  variant?: string;
  currency?: string;
  taxRate?: number;
  discount?: number;
  notes?: string;
  terms?: string;
};

const meta: Meta<Args> = {
  title: 'Commerce/Estimate',
  component: 'snice-estimate',
  tags: ['autodocs'],
  argTypes: {
    estimateNumber: { control: 'text' },
    date:           { control: 'text' },
    expiryDate:     { control: 'text' },
    status:         { control: 'select', options: ['draft', 'sent', 'accepted', 'declined', 'expired'] },
    variant:        { control: 'select', options: ['standard', 'professional', 'creative', 'minimal', 'comparison'] },
    currency:       { control: 'text' },
    taxRate:        { control: 'number' },
    discount:       { control: 'number' },
    notes:          { control: 'text' },
    terms:          { control: 'text' },
  },
  render: (args) => {
    return makeEstimate({
      'estimate-number': args.estimateNumber ?? 'EST-001',
      date: args.date ?? '2026-03-01',
      status: args.status ?? 'draft',
      variant: args.variant ?? 'standard',
      ...(args.expiryDate ? { 'expiry-date': args.expiryDate } : {}),
      ...(args.currency ? { currency: args.currency } : {}),
      ...(args.taxRate !== undefined ? { 'tax-rate': String(args.taxRate) } : {}),
      ...(args.discount !== undefined ? { discount: String(args.discount) } : {}),
      ...(args.notes ? { notes: args.notes } : {}),
      ...(args.terms ? { terms: args.terms } : {}),
    });
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { estimateNumber: 'EST-001', date: '2026-03-01', status: 'draft', variant: 'standard' },
};

// h2: Status: draft
export const StatusDraft: Story = {
  render: () => makeEstimate({ 'estimate-number': 'EST-001', date: '2026-03-01', status: 'draft' }),
};

// h2: Status: sent
export const StatusSent: Story = {
  render: () => makeEstimate({ 'estimate-number': 'EST-002', date: '2026-03-01', status: 'sent', 'expiry-date': '2026-04-01' }),
};

// h2: Status: accepted
export const StatusAccepted: Story = {
  render: () => makeEstimate({ 'estimate-number': 'EST-003', date: '2026-03-01', status: 'accepted' }),
};

// h2: Status: declined
export const StatusDeclined: Story = {
  render: () => makeEstimate({ 'estimate-number': 'EST-004', date: '2026-03-01', status: 'declined' }),
};

// h2: Status: expired
export const StatusExpired: Story = {
  render: () => makeEstimate({ 'estimate-number': 'EST-005', date: '2026-01-01', status: 'expired', 'expiry-date': '2026-02-01' }),
};

// h2: Variant: standard (default)
export const VariantStandard: Story = {
  render: () => makeEstimate({ 'estimate-number': 'EST-010', date: '2026-03-06', variant: 'standard' }),
};

// h2: Variant: professional
export const VariantProfessional: Story = {
  render: () => makeEstimate({ 'estimate-number': 'EST-011', date: '2026-03-06', variant: 'professional' }),
};

// h2: Variant: creative
export const VariantCreative: Story = {
  render: () => makeEstimate({ 'estimate-number': 'EST-012', date: '2026-03-06', variant: 'creative' }),
};

// h2: Variant: minimal
export const VariantMinimal: Story = {
  render: () => makeEstimate({ 'estimate-number': 'EST-013', date: '2026-03-06', variant: 'minimal' }),
};

// h2: Variant: comparison
export const VariantComparison: Story = {
  render: () => {
    const el = makeEstimate({ 'estimate-number': 'EST-014', date: '2026-03-06', variant: 'comparison', status: 'sent' }, false);
    (el as any).from = FROM;
    (el as any).to = TO;
    (el as any).items = [
      { description: 'Basic Package', quantity: 1, unitPrice: 5000 },
      { description: 'Professional Package', quantity: 1, unitPrice: 12000 },
      { description: 'Enterprise Package', quantity: 1, unitPrice: 25000 },
    ];
    return el;
  },
};

// h2: Tax Rate (10%) + Discount (5%)
export const TaxRateDiscount: Story = {
  render: () => makeEstimate({ 'estimate-number': 'EST-020', date: '2026-03-06', 'tax-rate': '10', discount: '5', status: 'sent' }),
};

// h2: Optional Items (toggleable)
export const OptionalItemsToggleable: Story = {
  render: () => {
    const el = makeEstimate({ 'estimate-number': 'EST-021', date: '2026-03-06', status: 'sent' }, false);
    (el as any).from = FROM;
    (el as any).to = TO;
    (el as any).items = [
      { description: 'Website Design', quantity: 1, unitPrice: 5000 },
      { description: 'SEO Optimization', quantity: 1, unitPrice: 2000, optional: true, included: true },
      { description: 'Monthly Maintenance', quantity: 12, unitPrice: 200, optional: true, included: false },
    ];
    return el;
  },
};

// h2: Notes + Terms
export const NotesTerms: Story = {
  render: () => makeEstimate({
    'estimate-number': 'EST-022',
    date: '2026-03-06',
    notes: 'Payment is due within 30 days of acceptance.',
    terms: 'All work is subject to our standard terms of service. Changes to scope may affect pricing.',
  }),
};

// h2: QR Position: top-right
export const QrPositionTopRight: Story = {
  render: () => {
    const el = makeEstimate({ 'estimate-number': 'EST-030', date: '2026-03-06', 'show-qr': '', 'qr-position': 'top-right' });
    const qr = document.createElement('div');
    qr.setAttribute('slot', 'qr');
    qr.style.cssText = 'width:80px;height:80px;background:#ddd;display:flex;align-items:center;justify-content:center;font-size:0.7rem;border-radius:4px;';
    qr.textContent = 'QR Code';
    el.appendChild(qr);
    return el;
  },
};

// h2: QR Position: bottom-right
export const QrPositionBottomRight: Story = {
  render: () => {
    const el = makeEstimate({ 'estimate-number': 'EST-031', date: '2026-03-06', 'show-qr': '', 'qr-position': 'bottom-right' });
    const qr = document.createElement('div');
    qr.setAttribute('slot', 'qr');
    qr.style.cssText = 'width:80px;height:80px;background:#ddd;display:flex;align-items:center;justify-content:center;font-size:0.7rem;border-radius:4px;';
    qr.textContent = 'QR Code';
    el.appendChild(qr);
    return el;
  },
};

// h2: QR Position: footer
export const QrPositionFooter: Story = {
  render: () => {
    const el = makeEstimate({ 'estimate-number': 'EST-032', date: '2026-03-06', 'show-qr': '', 'qr-position': 'footer' });
    const qr = document.createElement('div');
    qr.setAttribute('slot', 'qr');
    qr.style.cssText = 'width:80px;height:80px;background:#ddd;display:flex;align-items:center;justify-content:center;font-size:0.7rem;border-radius:4px;';
    qr.textContent = 'QR Code';
    el.appendChild(qr);
    return el;
  },
};

// h2: Expiry Date
export const ExpiryDate: Story = {
  render: () => makeEstimate({ 'estimate-number': 'EST-040', date: '2026-03-01', 'expiry-date': '2026-04-15', status: 'sent' }),
};

// h2: Currency: EUR
export const CurrencyEur: Story = {
  render: () => makeEstimate({ 'estimate-number': 'EST-050', date: '2026-03-06', currency: 'EUR' }),
};

// h2: Slot: footer
export const SlotFooter: Story = {
  render: () => {
    const el = makeEstimate({ 'estimate-number': 'EST-060', date: '2026-03-06' });
    const footer = document.createElement('div');
    footer.setAttribute('slot', 'footer');
    footer.style.cssText = 'text-align:center;font-size:0.75rem;color:var(--snice-color-text-tertiary);';
    footer.textContent = 'Thank you for your business. Questions? Contact us at support@acme.com';
    el.appendChild(footer);
    return el;
  },
};

// h2: Edge: No Parties (from/to not set)
export const EdgeNoParties: Story = {
  render: () => {
    const el = document.createElement('snice-estimate');
    el.setAttribute('estimate-number', 'EST-070');
    el.setAttribute('date', '2026-03-06');
    (el as any).items = ITEMS;
    el.style.cssText = 'max-width:700px;display:block;';
    return el;
  },
};

// h2: Edge: No Items
export const EdgeNoItems: Story = {
  render: () => {
    const el = document.createElement('snice-estimate');
    el.setAttribute('estimate-number', 'EST-071');
    el.setAttribute('date', '2026-03-06');
    (el as any).from = FROM;
    (el as any).to = TO;
    (el as any).items = [];
    el.style.cssText = 'max-width:700px;display:block;';
    return el;
  },
};
