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
  title: 'Estimate',
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

// CSS Parts: base, header, logo, title, meta, status, expiry, expiry-date, parties, party,
//            party-name, party-label, party-detail, table, table-header, table-row, table-cell,
//            item-toggle, discount-row, tax-row, subtotal, summary, total, comparison, option,
//            option-button, notes, notes-label, notes-content, terms, qr, qr-container,
//            accept-button, decline-button, actions, footer
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; }
      .parts-demo snice-estimate { max-width: 680px; display: block; }
      .parts-demo .label { font: 700 11px/1 sans-serif; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }

      /* Vibrant agency theme */
      .parts-demo .styled::part(base) { background: #f8faff; border: 2px solid #6366f1; border-radius: 16px; overflow: hidden; }
      .parts-demo .styled::part(header) { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 1.5rem; }
      .parts-demo .styled::part(logo) { border-radius: 8px; border: 2px solid rgba(255,255,255,0.3); }
      .parts-demo .styled::part(title) { color: #fff; font-size: 1.5rem; font-weight: 900; letter-spacing: 1px; }
      .parts-demo .styled::part(meta) { color: rgba(255,255,255,0.8); font-size: 0.85rem; }
      .parts-demo .styled::part(status) { background: rgba(255,255,255,0.2); color: #fff; border-radius: 20px; padding: 2px 12px; font-size: 0.8rem; font-weight: 700; backdrop-filter: blur(4px); }
      .parts-demo .styled::part(expiry) { background: #fef3c7; padding: 0.5rem 1.25rem; border-bottom: 1px solid #fde68a; }
      .parts-demo .styled::part(expiry-date) { color: #92400e; font-weight: 700; }
      .parts-demo .styled::part(parties) { padding: 1.5rem; display: grid; gap: 1rem; }
      .parts-demo .styled::part(party) { background: #fff; border: 1px solid #e0e7ff; border-radius: 10px; padding: 1rem; box-shadow: 0 1px 3px rgba(99,102,241,0.1); }
      .parts-demo .styled::part(party-name) { color: #1e1b4b; font-weight: 700; }
      .parts-demo .styled::part(party-label) { color: #6366f1; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
      .parts-demo .styled::part(party-detail) { color: #6b7280; font-size: 0.85rem; }
      .parts-demo .styled::part(table) { width: 100%; }
      .parts-demo .styled::part(table-header) { background: #6366f1; color: #fff; padding: 0.5rem 1rem; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
      .parts-demo .styled::part(table-row) { border-bottom: 1px solid #e0e7ff; }
      .parts-demo .styled::part(table-row):hover { background: #f0f4ff; }
      .parts-demo .styled::part(table-cell) { color: #374151; padding: 0.75rem 1rem; }
      .parts-demo .styled::part(item-toggle) { accent-color: #6366f1; }
      .parts-demo .styled::part(discount-row) { color: #059669; }
      .parts-demo .styled::part(tax-row) { color: #d97706; }
      .parts-demo .styled::part(subtotal) { color: #374151; font-weight: 600; }
      .parts-demo .styled::part(summary) { background: #f0f4ff; border-top: 2px solid #6366f1; padding: 1rem 1.5rem; }
      .parts-demo .styled::part(total) { color: #6366f1; font-size: 1.3rem; font-weight: 900; }
      .parts-demo .styled::part(notes) { padding: 1rem 1.5rem; background: #fff; border-top: 1px solid #e0e7ff; }
      .parts-demo .styled::part(notes-label) { color: #6366f1; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; }
      .parts-demo .styled::part(notes-content) { color: #6b7280; font-size: 0.9rem; font-style: italic; }
      .parts-demo .styled::part(terms) { color: #9ca3af; font-size: 0.8rem; padding: 0.5rem 1.5rem; background: #f8faff; border-top: 1px solid #e0e7ff; }
      .parts-demo .styled::part(actions) { padding: 1rem 1.5rem; display: flex; gap: 0.75rem; background: #f0f4ff; border-top: 2px solid #6366f1; }
      .parts-demo .styled::part(accept-button) { background: #6366f1; color: #fff; border: none; border-radius: 8px; padding: 0.75rem 1.5rem; font-weight: 700; cursor: pointer; }
      .parts-demo .styled::part(decline-button) { background: #fff; color: #6b7280; border: 1px solid #d1d5db; border-radius: 8px; padding: 0.75rem 1.5rem; cursor: pointer; }
      .parts-demo .styled::part(qr-container) { background: #fff; border-radius: 8px; border: 1px solid #e0e7ff; display: inline-block; padding: 0.5rem; }
      .parts-demo .styled::part(footer) { background: #6366f1; color: rgba(255,255,255,0.7); font-size: 0.8rem; padding: 0.75rem 1.5rem; }
    `;

    const FROM = { name: 'Studio Indigo Design', address: '300 Creative District, Portland, OR', email: 'hello@studioindigo.io', phone: '(503) 555-0177' };
    const TO = { name: 'Startup Ventures Inc.', address: '88 Innovation Blvd, Seattle, WA', email: 'ceo@startupventures.co' };
    const ITEMS = [
      { description: 'Brand Identity Package', quantity: 1, unitPrice: 4500, optional: false, included: true },
      { description: 'Website Design (8 pages)', quantity: 1, unitPrice: 6000, optional: false, included: true },
      { description: 'Social Media Kit', quantity: 1, unitPrice: 1200, optional: true, included: true },
      { description: 'Brand Video (60s)', quantity: 1, unitPrice: 3500, optional: true, included: false },
    ];

    const makeEstimate = (cls: string) => {
      const el = document.createElement('snice-estimate');
      if (cls) el.classList.add(cls);
      el.setAttribute('estimate-number', 'EST-2026-0077');
      el.setAttribute('date', '2026-04-09');
      el.setAttribute('expiry-date', '2026-05-09');
      el.setAttribute('status', 'sent');
      el.setAttribute('currency', 'USD');
      el.setAttribute('tax-rate', '0');
      el.setAttribute('discount', '500');
      el.setAttribute('notes', 'Prices valid for 30 days. 50% deposit required to start.');
      el.setAttribute('terms', 'Net 30 — payment via wire transfer or credit card.');
      (el as any).from = FROM;
      (el as any).to = TO;
      (el as any).items = ITEMS;
      el.style.cssText = 'display:block;max-width:680px;';
      return el;
    };

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-demo');

    const col1 = document.createElement('div');
    const lbl1 = document.createElement('div'); lbl1.className = 'label'; lbl1.textContent = 'Default';
    col1.appendChild(lbl1); col1.appendChild(makeEstimate(''));

    const col2 = document.createElement('div');
    const lbl2 = document.createElement('div'); lbl2.className = 'label'; lbl2.textContent = 'Agency Theme via ::part()';
    col2.appendChild(lbl2); col2.appendChild(makeEstimate('styled'));

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
      .parts-adv snice-estimate { max-width: 680px; display: block; }

      /* Executive monochrome theme */
      .parts-adv .exec::part(base) { background: #fff; border: 1px solid #000; border-radius: 0; font-family: 'Times New Roman', serif; }
      .parts-adv .exec::part(header) { background: #000; padding: 2rem; }
      .parts-adv .exec::part(title) { color: #fff; font-size: 2rem; font-weight: 400; letter-spacing: 4px; text-transform: uppercase; font-style: italic; }
      .parts-adv .exec::part(meta) { color: rgba(255,255,255,0.6); font-size: 0.85rem; letter-spacing: 1px; }
      .parts-adv .exec::part(status) { background: #fff; color: #000; font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; padding: 2px 10px; border-radius: 0; }
      .parts-adv .exec::part(expiry) { background: #f9f9f9; border-bottom: 1px solid #000; padding: 0.5rem 1.5rem; }
      .parts-adv .exec::part(expiry-date) { color: #000; font-weight: 700; font-style: italic; }
      .parts-adv .exec::part(party) { border: none; border-left: 3px solid #000; padding-left: 1rem; }
      .parts-adv .exec::part(party-name) { font-size: 1.1rem; font-weight: 700; }
      .parts-adv .exec::part(party-label) { color: #000; font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; }
      .parts-adv .exec::part(party-detail) { color: #444; font-size: 0.875rem; }
      .parts-adv .exec::part(table-header) { background: #000; color: #fff; padding: 0.5rem 1rem; font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase; }
      .parts-adv .exec::part(table-row) { border-bottom: 1px solid #e0e0e0; }
      .parts-adv .exec::part(table-cell) { padding: 0.75rem 1rem; color: #222; }
      .parts-adv .exec::part(item-toggle) { accent-color: #000; }
      .parts-adv .exec::part(discount-row) { color: #1a7a1a; }
      .parts-adv .exec::part(tax-row) { color: #555; }
      .parts-adv .exec::part(summary) { background: #f9f9f9; border-top: 2px solid #000; padding: 1rem 1.5rem; }
      .parts-adv .exec::part(total) { color: #000; font-size: 1.5rem; font-weight: 900; letter-spacing: 1px; border-top: 2px solid #000; }
      .parts-adv .exec::part(notes-label) { letter-spacing: 2px; text-transform: uppercase; font-size: 0.75rem; font-weight: 700; }
      .parts-adv .exec::part(notes-content) { font-style: italic; color: #444; }
      .parts-adv .exec::part(terms) { color: #888; font-size: 0.8rem; border-top: 1px solid #ddd; }
      .parts-adv .exec::part(actions) { background: #000; padding: 1rem 1.5rem; }
      .parts-adv .exec::part(accept-button) { background: #fff; color: #000; border: none; border-radius: 0; padding: 0.875rem 2rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; }
      .parts-adv .exec::part(decline-button) { background: transparent; color: #888; border: 1px solid #555; border-radius: 0; padding: 0.875rem 1.5rem; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; }
      .parts-adv .exec::part(footer) { background: #f9f9f9; border-top: 1px solid #000; color: #666; font-size: 0.75rem; letter-spacing: 1px; }
    `;

    const FROM = { name: 'Blackwood & Associates', address: '1 Wall Street, Floor 42, New York, NY 10005', email: 'proposals@blackwood.law', phone: '+1 (212) 555-0042' };
    const TO = { name: 'Meridian Capital Group', address: '500 Park Avenue, New York, NY 10022', email: 'cfo@meridiancapital.com' };
    const ITEMS = [
      { description: 'M&A Due Diligence', quantity: 120, unitPrice: 800, optional: false, included: true },
      { description: 'Regulatory Filing (SEC)', quantity: 1, unitPrice: 45000, optional: false, included: true },
      { description: 'Escrow Management', quantity: 1, unitPrice: 12000, optional: true, included: true },
      { description: 'Arbitration Reserve', quantity: 1, unitPrice: 25000, optional: true, included: false },
    ];

    const el = document.createElement('snice-estimate');
    el.classList.add('exec');
    el.setAttribute('estimate-number', 'BWA-2026-0012');
    el.setAttribute('date', '2026-04-09');
    el.setAttribute('expiry-date', '2026-04-23');
    el.setAttribute('status', 'sent');
    el.setAttribute('currency', 'USD');
    el.setAttribute('tax-rate', '0');
    el.setAttribute('discount', '5000');
    el.setAttribute('notes', 'All fees subject to New York State Bar fee schedule. Retainer of $50,000 required upon acceptance.');
    el.setAttribute('terms', 'Payment due upon receipt. Overdue balances accrue interest at 18% per annum.');
    (el as any).from = FROM;
    (el as any).to = TO;
    (el as any).items = ITEMS;
    el.style.cssText = 'display:block;max-width:700px;';

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-adv');

    const col = document.createElement('div');
    const lbl = document.createElement('div');
    lbl.style.cssText = 'font:700 11px/1 sans-serif;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;';
    lbl.textContent = 'Executive Monochrome Theme via ::part()';
    col.appendChild(lbl);
    col.appendChild(el);
    wrap.appendChild(col);
    return wrap;
  },
};
