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

// CSS Parts: base, header, logo, title, meta, status, parties, party, party-name, party-label,
//            party-detail, table, table-header, table-row, table-cell, discount-row, tax-row,
//            summary, summary-row, summary-label, summary-value, total, notes, notes-label,
//            notes-content, qr, qr-container, footer
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; }
      .parts-demo snice-invoice { max-width: 640px; display: block; }
      .parts-demo .label { font: 700 11px/1 sans-serif; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }

      .parts-demo .styled::part(base) { background: #0d1117; border: 2px solid #58a6ff; border-radius: 12px; overflow: hidden; font-family: 'Courier New', monospace; }
      .parts-demo .styled::part(header) { background: #161b22; border-bottom: 2px solid #58a6ff; padding: 1.5rem; }
      .parts-demo .styled::part(logo) { border-radius: 8px; }
      .parts-demo .styled::part(title) { color: #58a6ff; font-size: 1.5rem; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
      .parts-demo .styled::part(meta) { color: #8b949e; font-size: 0.85rem; }
      .parts-demo .styled::part(status) { background: #1f6feb; color: #fff; border-radius: 4px; padding: 2px 10px; font-weight: 700; font-size: 0.8rem; letter-spacing: 1px; }
      .parts-demo .styled::part(parties) { display: grid; gap: 1.5rem; background: #0d1117; padding: 1.25rem; }
      .parts-demo .styled::part(party) { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1rem; }
      .parts-demo .styled::part(party-name) { color: #e6edf3; font-weight: 700; font-size: 1rem; }
      .parts-demo .styled::part(party-label) { color: #58a6ff; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
      .parts-demo .styled::part(party-detail) { color: #8b949e; font-size: 0.85rem; }
      .parts-demo .styled::part(table) { width: 100%; border-collapse: collapse; }
      .parts-demo .styled::part(table-header) { background: #161b22; color: #58a6ff; padding: 0.5rem 1rem; text-align: left; border-bottom: 1px solid #30363d; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
      .parts-demo .styled::part(table-row) { border-bottom: 1px solid #21262d; }
      .parts-demo .styled::part(table-cell) { color: #e6edf3; padding: 0.75rem 1rem; }
      .parts-demo .styled::part(discount-row) { color: #3fb950; }
      .parts-demo .styled::part(tax-row) { color: #d29922; }
      .parts-demo .styled::part(summary) { background: #161b22; border-top: 2px solid #30363d; padding: 1rem 1.5rem; }
      .parts-demo .styled::part(summary-row) { display: flex; justify-content: space-between; padding: 0.25rem 0; }
      .parts-demo .styled::part(summary-label) { color: #8b949e; }
      .parts-demo .styled::part(summary-value) { color: #e6edf3; font-weight: 600; }
      .parts-demo .styled::part(total) { color: #58a6ff; font-size: 1.2rem; font-weight: 900; border-top: 1px solid #58a6ff; margin-top: 0.5rem; padding-top: 0.5rem; }
      .parts-demo .styled::part(notes) { background: #0d1117; padding: 1rem 1.5rem; border-top: 1px solid #30363d; }
      .parts-demo .styled::part(notes-label) { color: #58a6ff; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
      .parts-demo .styled::part(notes-content) { color: #8b949e; font-size: 0.9rem; font-style: italic; }
      .parts-demo .styled::part(qr-container) { padding: 1rem; background: #fff; border-radius: 8px; display: inline-block; }
      .parts-demo .styled::part(footer) { background: #161b22; border-top: 1px solid #30363d; padding: 0.75rem 1.5rem; color: #8b949e; font-size: 0.8rem; }
    `;

    const FROM = { name: 'GitCorp Solutions', address: '1 Developer Way, San Francisco, CA', email: 'billing@gitcorp.io' };
    const TO = { name: 'Enterprise Client', address: '100 Business Blvd, Austin, TX', email: 'accounts@enterprise.com' };
    const ITEMS = [
      { description: 'Platform License (annual)', quantity: 1, unitPrice: 4800 },
      { description: 'Support Package', quantity: 12, unitPrice: 200 },
      { description: 'Onboarding Services', quantity: 8, unitPrice: 150 },
    ];

    const makeInvoice = (cls: string) => {
      const el = document.createElement('snice-invoice');
      if (cls) el.classList.add(cls);
      el.setAttribute('invoice-number', 'INV-2026-0042');
      el.setAttribute('date', '2026-04-01');
      el.setAttribute('due-date', '2026-04-30');
      el.setAttribute('status', 'sent');
      el.setAttribute('currency', 'USD');
      el.setAttribute('tax-rate', '8.25');
      el.setAttribute('discount', '500');
      el.setAttribute('notes', 'Thank you for your business. Payment due within 30 days.');
      (el as any).from = FROM;
      (el as any).to = TO;
      (el as any).items = ITEMS;
      el.style.cssText = 'display:block;max-width:640px;';
      return el;
    };

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-demo');

    const col1 = document.createElement('div');
    const lbl1 = document.createElement('div'); lbl1.className = 'label'; lbl1.textContent = 'Default';
    col1.appendChild(lbl1); col1.appendChild(makeInvoice(''));

    const col2 = document.createElement('div');
    const lbl2 = document.createElement('div'); lbl2.className = 'label'; lbl2.textContent = 'Styled via ::part() — Developer Theme';
    col2.appendChild(lbl2); col2.appendChild(makeInvoice('styled'));

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
      .parts-adv snice-invoice { display: block; max-width: 620px; }

      /* Corporate theme */
      .parts-adv .corp::part(base) { background: #fff; border: 1px solid #d0d5dd; border-radius: 8px; font-family: Arial, sans-serif; }
      .parts-adv .corp::part(header) { background: #1d3557; padding: 1.5rem; }
      .parts-adv .corp::part(title) { color: #fff; font-size: 1.75rem; font-weight: 400; letter-spacing: 3px; text-transform: uppercase; }
      .parts-adv .corp::part(meta) { color: rgba(255,255,255,0.7); font-size: 0.85rem; }
      .parts-adv .corp::part(status) { background: #e63946; color: #fff; border-radius: 3px; padding: 2px 8px; font-weight: 700; font-size: 0.75rem; }
      .parts-adv .corp::part(parties) { padding: 1.5rem; }
      .parts-adv .corp::part(party) { border-left: 3px solid #1d3557; padding-left: 1rem; }
      .parts-adv .corp::part(party-name) { color: #1d3557; font-weight: 700; }
      .parts-adv .corp::part(party-label) { color: #6b7280; font-size: 0.75rem; text-transform: uppercase; }
      .parts-adv .corp::part(party-detail) { color: #374151; font-size: 0.875rem; }
      .parts-adv .corp::part(table-header) { background: #1d3557; color: #fff; padding: 0.625rem 1rem; }
      .parts-adv .corp::part(table-row) { border-bottom: 1px solid #e5e7eb; }
      .parts-adv .corp::part(table-cell) { color: #374151; padding: 0.625rem 1rem; }
      .parts-adv .corp::part(discount-row) { color: #059669; }
      .parts-adv .corp::part(tax-row) { color: #d97706; }
      .parts-adv .corp::part(summary) { background: #f9fafb; border-top: 2px solid #1d3557; padding: 1rem 1.5rem; }
      .parts-adv .corp::part(summary-label) { color: #6b7280; }
      .parts-adv .corp::part(summary-value) { color: #111827; font-weight: 600; }
      .parts-adv .corp::part(total) { color: #1d3557; font-weight: 900; font-size: 1.1rem; }
      .parts-adv .corp::part(notes-label) { color: #1d3557; font-weight: 700; }
      .parts-adv .corp::part(notes-content) { color: #6b7280; }
      .parts-adv .corp::part(footer) { background: #1d3557; color: rgba(255,255,255,0.7); font-size: 0.8rem; padding: 0.75rem 1.5rem; }
    `;

    const FROM = { name: 'Meridian Partners LLC', address: '500 Park Avenue, New York, NY 10022', email: 'finance@meridian.com', phone: '+1 (212) 555-0100' };
    const TO = { name: 'Global Ventures Inc.', address: '1200 Corporate Drive, Chicago, IL 60601', email: 'ap@globalventures.com' };
    const ITEMS = [
      { description: 'Strategic Consulting (Q1)', quantity: 80, unitPrice: 350, tax: 0 },
      { description: 'Market Research Report', quantity: 1, unitPrice: 12000 },
      { description: 'Executive Workshop (2 days)', quantity: 2, unitPrice: 5000 },
    ];

    const el = document.createElement('snice-invoice');
    el.classList.add('corp');
    el.setAttribute('invoice-number', 'MP-2026-0099');
    el.setAttribute('date', '2026-04-09');
    el.setAttribute('due-date', '2026-05-09');
    el.setAttribute('status', 'overdue');
    el.setAttribute('currency', 'USD');
    el.setAttribute('tax-rate', '8.875');
    el.setAttribute('discount', '2000');
    el.setAttribute('notes', 'Wire transfers only. Include invoice number as reference. Late payments subject to 1.5% monthly interest.');
    (el as any).from = FROM;
    (el as any).to = TO;
    (el as any).items = ITEMS;
    el.style.cssText = 'display:block;max-width:640px;';

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-adv');

    const col = document.createElement('div');
    const lbl = document.createElement('div');
    lbl.style.cssText = 'font:700 11px/1 sans-serif;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;';
    lbl.textContent = 'Corporate Theme via ::part()';
    col.appendChild(lbl);
    col.appendChild(el);
    wrap.appendChild(col);
    return wrap;
  },
};
