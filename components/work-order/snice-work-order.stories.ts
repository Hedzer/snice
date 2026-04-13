import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-work-order';

const CUSTOMER = { name: 'Acme Corp', address: '123 Main St, Suite 200', phone: '+1 555-1234', email: 'ops@acme.com' };
const ASSET = { id: 'HVAC-301', name: 'Rooftop Unit #3', location: '3rd Floor', serial: 'SN-2019-4521', lastService: '2024-01-15' };
const TASKS = [
  { description: 'Inspect unit', assignee: 'John', completed: true, hours: 1 },
  { description: 'Replace filters', assignee: 'John', completed: true, hours: 0.5 },
  { description: 'Test operation', assignee: 'Jane', completed: false, hours: 1 },
  { description: 'Document findings', assignee: 'Jane', completed: false, hours: 0.5 },
];
const PARTS = [
  { name: 'Air Filter (20x20)', partNumber: 'AF-2020', quantity: 4, unitCost: 12.50 },
  { name: 'Belt (V-type)', partNumber: 'BLT-V42', quantity: 1, unitCost: 28.00 },
  { name: 'Refrigerant R-410A', partNumber: 'REF-410', quantity: 2, unitCost: 75.00 },
];

type Args = {
  woNumber?: string;
  date?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  description?: string;
  variant?: string;
};

const meta: Meta<Args> = {
  title: 'Commerce/WorkOrder',
  component: 'snice-work-order',
  tags: ['autodocs'],
  argTypes: {
    woNumber:    { control: 'text' },
    date:        { control: 'text' },
    dueDate:     { control: 'text' },
    priority:    { control: 'select', options: ['low', 'medium', 'high', 'urgent'] },
    status:      { control: 'select', options: ['open', 'in-progress', 'completed', 'cancelled'] },
    description: { control: 'text' },
    variant:     { control: 'select', options: ['standard', 'compact', 'field-service', 'maintenance', 'detailed'] },
  },
  render: (args) => {
    const el = document.createElement('snice-work-order');
    if (args.woNumber) el.setAttribute('wo-number', args.woNumber);
    if (args.date) el.setAttribute('date', args.date);
    if (args.dueDate) el.setAttribute('due-date', args.dueDate);
    if (args.priority) el.setAttribute('priority', args.priority);
    if (args.status) el.setAttribute('status', args.status);
    if (args.description) el.setAttribute('description', args.description);
    if (args.variant) el.setAttribute('variant', args.variant);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { woNumber: 'WO-001', date: '2024-03-01', priority: 'medium', status: 'open', description: 'General maintenance task' },
};

// h2: Priority: all values
export const PriorityAllValues: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(500px,1fr));gap:1.5rem;';
    const priorities = [
      ['WO-001', 'low', 'Low priority task'],
      ['WO-002', 'medium', 'Medium priority task'],
      ['WO-003', 'high', 'High priority task'],
      ['WO-004', 'urgent', 'Urgent priority task'],
    ] as [string, string, string][];
    for (const [num, priority, desc] of priorities) {
      const el = document.createElement('snice-work-order');
      el.setAttribute('wo-number', num);
      el.setAttribute('date', '2024-03-01');
      el.setAttribute('priority', priority);
      el.setAttribute('status', 'open');
      el.setAttribute('description', desc);
      wrap.appendChild(el);
    }
    return wrap;
  },
};

// h2: Status: all values
export const StatusAllValues: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(500px,1fr));gap:1.5rem;';
    const statuses = [
      ['WO-010', 'open', 'Open status'],
      ['WO-011', 'in-progress', 'In progress status'],
      ['WO-012', 'completed', 'Completed status'],
      ['WO-013', 'cancelled', 'Cancelled status'],
    ] as [string, string, string][];
    for (const [num, status, desc] of statuses) {
      const el = document.createElement('snice-work-order');
      el.setAttribute('wo-number', num);
      el.setAttribute('date', '2024-03-01');
      el.setAttribute('priority', 'medium');
      el.setAttribute('status', status);
      el.setAttribute('description', desc);
      wrap.appendChild(el);
    }
    return wrap;
  },
};

// h2: Variant: standard (default)
export const VariantStandard: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('variant', 'standard');
    el.setAttribute('wo-number', 'WO-V-STANDARD');
    el.setAttribute('date', '2024-03-15');
    el.setAttribute('due-date', '2024-03-20');
    el.setAttribute('priority', 'high');
    el.setAttribute('status', 'in-progress');
    el.setAttribute('description', 'Annual HVAC maintenance and filter replacement');
    (el as any).customer = CUSTOMER;
    (el as any).tasks = JSON.parse(JSON.stringify(TASKS));
    (el as any).parts = JSON.parse(JSON.stringify(PARTS));
    (el as any).asset = ASSET;
    (el as any).laborRate = 75;
    el.setAttribute('notes', 'Customer prefers morning appointments');
    return el;
  },
};

// h2: Variant: compact
export const VariantCompact: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('variant', 'compact');
    el.setAttribute('wo-number', 'WO-V-COMPACT');
    el.setAttribute('date', '2024-03-15');
    el.setAttribute('priority', 'high');
    el.setAttribute('status', 'in-progress');
    el.setAttribute('description', 'Annual HVAC maintenance');
    (el as any).customer = CUSTOMER;
    return el;
  },
};

// h2: Variant: field-service
export const VariantFieldService: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('variant', 'field-service');
    el.setAttribute('wo-number', 'WO-V-FIELD');
    el.setAttribute('date', '2024-03-15');
    el.setAttribute('priority', 'high');
    el.setAttribute('status', 'in-progress');
    el.setAttribute('description', 'Annual HVAC maintenance and filter replacement');
    (el as any).customer = CUSTOMER;
    (el as any).tasks = JSON.parse(JSON.stringify(TASKS));
    (el as any).asset = ASSET;
    return el;
  },
};

// h2: Variant: maintenance
export const VariantMaintenance: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('variant', 'maintenance');
    el.setAttribute('wo-number', 'WO-V-MAINT');
    el.setAttribute('date', '2024-03-15');
    el.setAttribute('priority', 'high');
    el.setAttribute('status', 'in-progress');
    el.setAttribute('description', 'Annual HVAC maintenance and filter replacement');
    (el as any).customer = CUSTOMER;
    (el as any).parts = JSON.parse(JSON.stringify(PARTS));
    (el as any).asset = ASSET;
    return el;
  },
};

// h2: Variant: detailed
export const VariantDetailed: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('variant', 'detailed');
    el.setAttribute('wo-number', 'WO-V-DETAILED');
    el.setAttribute('date', '2024-03-15');
    el.setAttribute('due-date', '2024-03-20');
    el.setAttribute('priority', 'high');
    el.setAttribute('status', 'in-progress');
    el.setAttribute('description', 'Annual HVAC maintenance and filter replacement');
    (el as any).customer = CUSTOMER;
    (el as any).tasks = JSON.parse(JSON.stringify(TASKS));
    (el as any).parts = JSON.parse(JSON.stringify(PARTS));
    (el as any).asset = ASSET;
    (el as any).laborRate = 75;
    return el;
  },
};

// h2: With Customer
export const WithCustomer: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('wo-number', 'WO-020');
    el.setAttribute('date', '2024-03-10');
    el.setAttribute('priority', 'high');
    el.setAttribute('status', 'open');
    el.setAttribute('description', 'HVAC repair needed');
    (el as any).customer = CUSTOMER;
    return el;
  },
};

// h2: With Asset
export const WithAsset: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('wo-number', 'WO-021');
    el.setAttribute('date', '2024-03-10');
    el.setAttribute('priority', 'medium');
    el.setAttribute('status', 'in-progress');
    el.setAttribute('description', 'Annual maintenance');
    (el as any).asset = ASSET;
    return el;
  },
};

// h2: With Tasks
export const WithTasks: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('wo-number', 'WO-022');
    el.setAttribute('date', '2024-03-12');
    el.setAttribute('priority', 'high');
    el.setAttribute('status', 'in-progress');
    el.setAttribute('description', 'Replace air handler unit');
    (el as any).tasks = JSON.parse(JSON.stringify(TASKS));
    return el;
  },
};

// h2: With Parts
export const WithParts: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('wo-number', 'WO-023');
    el.setAttribute('date', '2024-03-12');
    el.setAttribute('priority', 'medium');
    el.setAttribute('status', 'open');
    el.setAttribute('description', 'Electrical panel upgrade');
    (el as any).parts = JSON.parse(JSON.stringify(PARTS));
    return el;
  },
};

// h2: With Labor Rate + Tasks (cost calculation)
export const WithLaborRateTasksCostCalculation: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('wo-number', 'WO-024');
    el.setAttribute('date', '2024-03-15');
    el.setAttribute('priority', 'medium');
    el.setAttribute('status', 'in-progress');
    el.setAttribute('description', 'Plumbing repair');
    (el as any).tasks = JSON.parse(JSON.stringify(TASKS));
    (el as any).laborRate = 85;
    return el;
  },
};

// h2: With Notes
export const WithNotes: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('wo-number', 'WO-025');
    el.setAttribute('date', '2024-03-15');
    el.setAttribute('priority', 'low');
    el.setAttribute('status', 'open');
    el.setAttribute('description', 'General inspection');
    el.setAttribute('notes', 'Customer prefers morning appointments. Access code: 1234. Park in visitor lot.');
    return el;
  },
};

// h2: With Due Date
export const WithDueDate: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('wo-number', 'WO-026');
    el.setAttribute('date', '2024-03-15');
    el.setAttribute('due-date', '2024-03-20');
    el.setAttribute('priority', 'urgent');
    el.setAttribute('status', 'open');
    el.setAttribute('description', 'Emergency boiler repair');
    return el;
  },
};

// h2: QR Code: show-qr with positions
export const QrCodeShowQrWithPositions: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(500px,1fr));gap:1.5rem;';
    const positions = [
      ['top-right', 'WO-030'],
      ['header', 'WO-031'],
      ['footer', 'WO-032'],
    ] as [string, string][];
    for (const [pos, num] of positions) {
      const el = document.createElement('snice-work-order');
      el.setAttribute('wo-number', num);
      el.setAttribute('date', '2024-03-15');
      el.setAttribute('priority', 'medium');
      el.setAttribute('status', 'open');
      el.toggleAttribute('show-qr', true);
      el.setAttribute('qr-position', pos);
      el.setAttribute('qr-data', `https://app.example.com/wo/${num}`);
      el.setAttribute('description', `QR at ${pos}`);
      const qr = document.createElement('div');
      qr.setAttribute('slot', 'qr');
      qr.style.cssText = 'width:4rem;height:4rem;background:var(--snice-color-border,#444);display:flex;align-items:center;justify-content:center;font-size:0.6rem;border-radius:4px;';
      qr.textContent = 'QR';
      el.appendChild(qr);
      wrap.appendChild(el);
    }
    return wrap;
  },
};

// h2: Slots: signature and footer
export const SlotsSignatureAndFooter: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('wo-number', 'WO-040');
    el.setAttribute('date', '2024-03-18');
    el.setAttribute('priority', 'medium');
    el.setAttribute('status', 'completed');
    el.setAttribute('description', 'Completed work with signature');
    const sig = document.createElement('div');
    sig.setAttribute('slot', 'signature');
    sig.style.cssText = 'padding:0.5rem;font-style:italic;color:var(--snice-color-text-secondary);';
    sig.textContent = 'Digital signature placeholder';
    const footer = document.createElement('div');
    footer.setAttribute('slot', 'footer');
    footer.style.cssText = 'font-size:0.75rem;color:var(--snice-color-text-tertiary);text-align:center;padding:0.5rem;';
    footer.textContent = 'Generated by WorkOrder System v2.0';
    el.appendChild(sig);
    el.appendChild(footer);
    return el;
  },
};

// h2: Default Slot (additional content)
export const DefaultSlotAdditionalContent: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('wo-number', 'WO-041');
    el.setAttribute('date', '2024-03-18');
    el.setAttribute('priority', 'low');
    el.setAttribute('status', 'open');
    el.setAttribute('description', 'Work order with extra content');
    const extra = document.createElement('div');
    extra.style.cssText = 'padding:1rem;border-top:1px solid var(--snice-color-border);font-size:0.8rem;color:var(--snice-color-text-secondary);';
    extra.textContent = 'Custom slotted content appears at the bottom of the work order.';
    el.appendChild(extra);
    return el;
  },
};

// h2: Full Work Order (all sections populated)
export const FullWorkOrderAllSectionsPopulated: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('variant', 'standard');
    el.setAttribute('wo-number', 'WO-2024-FULL');
    el.setAttribute('date', '2024-03-15');
    el.setAttribute('due-date', '2024-03-22');
    el.setAttribute('priority', 'high');
    el.setAttribute('status', 'in-progress');
    el.setAttribute('description', 'Complete HVAC system overhaul including compressor replacement, duct cleaning, and thermostat upgrade for the third floor office suite.');
    el.setAttribute('notes', 'Access through loading dock. Security escort required after 6 PM. Customer has approved overtime if needed.');
    (el as any).customer = CUSTOMER;
    (el as any).tasks = JSON.parse(JSON.stringify(TASKS));
    (el as any).parts = JSON.parse(JSON.stringify(PARTS));
    (el as any).asset = ASSET;
    (el as any).laborRate = 95;
    return el;
  },
};

// h2: Minimal (just WO number)
export const MinimalJustWoNumber: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('wo-number', 'WO-099');
    return el;
  },
};

// h2: No WO Number
export const NoWoNumber: Story = {
  render: () => {
    const el = document.createElement('snice-work-order');
    el.setAttribute('status', 'open');
    el.setAttribute('priority', 'medium');
    el.setAttribute('description', 'Work order without a number');
    return el;
  },
};

// h2: Priority x Status Matrix
export const PriorityXStatusMatrix: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;font-size:0.7rem;';
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const statuses = ['open', 'in-progress', 'completed', 'cancelled'];
    for (const priority of priorities) {
      for (const status of statuses) {
        const el = document.createElement('snice-work-order');
        const p = priority.charAt(0).toUpperCase();
        const s = status.charAt(0).toUpperCase();
        el.setAttribute('wo-number', `${p}-${s}`);
        el.setAttribute('priority', priority);
        el.setAttribute('status', status);
        wrap.appendChild(el);
      }
    }
    return wrap;
  },
};

// CSS Parts: base, header, wo-number, date, due-date, title, status, priority, description,
//            description-label, description-content, customer, customer-name, customer-address,
//            customer-contact, asset, asset-id, asset-name, tasks, task, task-checkbox,
//            task-description, task-assignee, parts, parts-table, parts-row, part-name,
//            part-number, part-qty, part-cost, parts-total, labor, labor-rate, labor-hours,
//            labor-total, costs, grand-total, notes, notes-label, notes-content, signature,
//            signature-line, signature-date, sign-button, qr-container, footer
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; }
      .parts-demo snice-work-order { max-width: 700px; display: block; }
      .parts-demo .label { font: 700 11px/1 sans-serif; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }

      /* Industrial theme */
      .parts-demo .styled::part(base) { background: #1c1c1c; border: 2px solid #f59e0b; border-radius: 8px; overflow: hidden; font-family: 'Courier New', monospace; }
      .parts-demo .styled::part(header) { background: #f59e0b; padding: 1rem 1.5rem; display: flex; align-items: center; gap: 1rem; }
      .parts-demo .styled::part(wo-number) { color: #1c1c1c; font-size: 1.1rem; font-weight: 900; letter-spacing: 2px; }
      .parts-demo .styled::part(date) { color: rgba(28,28,28,0.7); font-size: 0.85rem; }
      .parts-demo .styled::part(due-date) { color: #7f1d1d; font-weight: 700; font-size: 0.85rem; }
      .parts-demo .styled::part(title) { color: #fff; font-size: 1.15rem; font-weight: 700; padding: 0.75rem 1.5rem; background: #2d2d2d; border-bottom: 1px solid #f59e0b; }
      .parts-demo .styled::part(status) { background: #16a34a; color: #fff; border-radius: 4px; padding: 2px 10px; font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; }
      .parts-demo .styled::part(priority) { background: #dc2626; color: #fff; border-radius: 4px; padding: 2px 10px; font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; }
      .parts-demo .styled::part(description) { padding: 1rem 1.5rem; border-bottom: 1px solid #333; }
      .parts-demo .styled::part(description-label) { color: #f59e0b; font-size: 0.75rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
      .parts-demo .styled::part(description-content) { color: #d1d5db; }
      .parts-demo .styled::part(customer) { padding: 1rem 1.5rem; border-bottom: 1px solid #333; background: #252525; }
      .parts-demo .styled::part(customer-name) { color: #f59e0b; font-weight: 700; }
      .parts-demo .styled::part(customer-address) { color: #9ca3af; font-size: 0.85rem; }
      .parts-demo .styled::part(customer-contact) { color: #9ca3af; font-size: 0.85rem; }
      .parts-demo .styled::part(asset) { padding: 1rem 1.5rem; border-bottom: 1px solid #333; }
      .parts-demo .styled::part(asset-id) { color: #f59e0b; font-family: monospace; font-weight: 700; }
      .parts-demo .styled::part(asset-name) { color: #e5e7eb; }
      .parts-demo .styled::part(tasks) { padding: 0.5rem 1.5rem 1rem; border-bottom: 1px solid #333; }
      .parts-demo .styled::part(task) { border-bottom: 1px dotted #333; padding: 0.5rem 0; }
      .parts-demo .styled::part(task-checkbox) { accent-color: #f59e0b; width: 16px; height: 16px; }
      .parts-demo .styled::part(task-description) { color: #e5e7eb; }
      .parts-demo .styled::part(task-assignee) { color: #9ca3af; font-size: 0.8rem; }
      .parts-demo .styled::part(parts) { padding: 1rem 1.5rem; border-bottom: 1px solid #333; }
      .parts-demo .styled::part(parts-table) { width: 100%; }
      .parts-demo .styled::part(parts-row) { border-bottom: 1px solid #2d2d2d; }
      .parts-demo .styled::part(part-name) { color: #e5e7eb; }
      .parts-demo .styled::part(part-number) { color: #9ca3af; font-size: 0.8rem; font-family: monospace; }
      .parts-demo .styled::part(part-qty) { color: #f59e0b; font-weight: 700; text-align: center; }
      .parts-demo .styled::part(part-cost) { color: #e5e7eb; text-align: right; }
      .parts-demo .styled::part(parts-total) { color: #f59e0b; font-weight: 700; text-align: right; border-top: 1px solid #f59e0b; }
      .parts-demo .styled::part(labor) { padding: 1rem 1.5rem; border-bottom: 1px solid #333; background: #252525; }
      .parts-demo .styled::part(labor-rate) { color: #9ca3af; }
      .parts-demo .styled::part(labor-hours) { color: #f59e0b; font-weight: 700; }
      .parts-demo .styled::part(labor-total) { color: #f59e0b; font-weight: 700; }
      .parts-demo .styled::part(costs) { padding: 1rem 1.5rem; border-bottom: 1px solid #333; }
      .parts-demo .styled::part(grand-total) { color: #f59e0b; font-size: 1.4rem; font-weight: 900; border-top: 2px solid #f59e0b; padding-top: 0.5rem; }
      .parts-demo .styled::part(notes) { padding: 1rem 1.5rem; border-bottom: 1px solid #333; }
      .parts-demo .styled::part(notes-label) { color: #f59e0b; font-size: 0.75rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
      .parts-demo .styled::part(notes-content) { color: #9ca3af; font-style: italic; }
      .parts-demo .styled::part(signature) { padding: 1rem 1.5rem; background: #252525; border-bottom: 1px solid #333; }
      .parts-demo .styled::part(signature-line) { border-bottom: 2px solid #f59e0b; width: 200px; }
      .parts-demo .styled::part(signature-date) { color: #9ca3af; font-size: 0.8rem; }
      .parts-demo .styled::part(sign-button) { background: #f59e0b; color: #1c1c1c; border: none; border-radius: 4px; padding: 0.5rem 1rem; font-weight: 900; letter-spacing: 1px; cursor: pointer; text-transform: uppercase; }
      .parts-demo .styled::part(qr-container) { background: #fff; border-radius: 4px; padding: 0.5rem; display: inline-block; }
      .parts-demo .styled::part(footer) { background: #f59e0b; color: #1c1c1c; padding: 0.5rem 1.5rem; font-size: 0.8rem; font-weight: 700; letter-spacing: 1px; }
    `;

    const CUSTOMER = { name: 'Industrial Dynamics LLC', address: '5000 Factory Rd, Detroit, MI 48201', phone: '(313) 555-0188', email: 'maintenance@indynam.com' };
    const ASSET = { id: 'ASSET-3829', name: 'CNC Router Unit 4', location: 'Bay C', serial: 'CNC-2019-384', lastService: '2025-10-15' };
    const TASKS = [
      { description: 'Inspect spindle bearings and replace if worn', assignee: 'J. Martinez', completed: true, hours: 2 },
      { description: 'Recalibrate XY axis positioning', assignee: 'K. Chen', completed: true, hours: 1.5 },
      { description: 'Replace coolant filter and flush system', assignee: 'J. Martinez', completed: false, hours: 0.5 },
      { description: 'Update firmware to v3.2.1', assignee: 'K. Chen', completed: false, hours: 1 },
    ];
    const PARTS = [
      { name: 'Spindle Bearing Assembly', partNumber: 'SBA-440-C', quantity: 2, unitCost: 285.00 },
      { name: 'Coolant Filter (5-micron)', partNumber: 'CF-5M-20', quantity: 4, unitCost: 32.50 },
      { name: 'Coolant Concentrate (1gal)', partNumber: 'CC-SYNTH-1', quantity: 2, unitCost: 48.00 },
    ];

    const makeWO = (cls: string) => {
      const el = document.createElement('snice-work-order');
      if (cls) el.classList.add(cls);
      el.setAttribute('wo-number', 'WO-2026-0839');
      el.setAttribute('date', '2026-04-09');
      el.setAttribute('due-date', '2026-04-11');
      el.setAttribute('priority', 'high');
      el.setAttribute('status', 'in-progress');
      el.setAttribute('description', 'Scheduled quarterly maintenance on CNC Router Unit 4. Replace worn bearings, recalibrate axes, flush coolant system, and update control firmware.');
      el.setAttribute('labor-rate', '125');
      el.setAttribute('notes', 'Machine must be returned to service by Friday AM shift. Coordinate downtime with production supervisor Williams.');
      (el as any).customer = CUSTOMER;
      (el as any).asset = ASSET;
      (el as any).tasks = TASKS;
      (el as any).parts = PARTS;
      el.style.cssText = 'display:block;max-width:700px;';
      return el;
    };

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-demo');

    const col1 = document.createElement('div');
    const lbl1 = document.createElement('div'); lbl1.className = 'label'; lbl1.textContent = 'Default';
    col1.appendChild(lbl1); col1.appendChild(makeWO(''));

    const col2 = document.createElement('div');
    const lbl2 = document.createElement('div'); lbl2.className = 'label'; lbl2.textContent = 'Industrial Theme via ::part()';
    col2.appendChild(lbl2); col2.appendChild(makeWO('styled'));

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
      .parts-adv snice-work-order { max-width: 700px; display: block; }

      /* Field service theme — clean, mobile-friendly */
      .parts-adv .field::part(base) { background: #fff; border: 1px solid #d1d5db; border-radius: 12px; overflow: hidden; font-family: system-ui, sans-serif; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
      .parts-adv .field::part(header) { background: #0369a1; padding: 1.25rem 1.5rem; }
      .parts-adv .field::part(wo-number) { color: #fff; font-size: 1rem; font-weight: 700; }
      .parts-adv .field::part(date) { color: rgba(255,255,255,0.7); font-size: 0.8rem; }
      .parts-adv .field::part(due-date) { color: #fed7aa; font-weight: 700; font-size: 0.8rem; }
      .parts-adv .field::part(title) { color: #0c4a6e; font-size: 1.1rem; font-weight: 600; padding: 1rem 1.5rem; background: #f0f9ff; border-bottom: 1px solid #bae6fd; }
      .parts-adv .field::part(status) { background: #0369a1; color: #fff; border-radius: 20px; padding: 2px 12px; font-size: 0.75rem; font-weight: 600; }
      .parts-adv .field::part(priority) { background: #dc2626; color: #fff; border-radius: 20px; padding: 2px 12px; font-size: 0.75rem; font-weight: 600; }
      .parts-adv .field::part(description) { padding: 1rem 1.5rem; border-bottom: 1px solid #f3f4f6; }
      .parts-adv .field::part(description-label) { color: #0369a1; font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
      .parts-adv .field::part(description-content) { color: #374151; line-height: 1.6; }
      .parts-adv .field::part(customer-name) { color: #0c4a6e; font-weight: 700; }
      .parts-adv .field::part(customer-address) { color: #6b7280; font-size: 0.85rem; }
      .parts-adv .field::part(customer-contact) { color: #6b7280; font-size: 0.85rem; }
      .parts-adv .field::part(asset-id) { color: #0369a1; font-weight: 700; font-family: monospace; }
      .parts-adv .field::part(asset-name) { color: #374151; }
      .parts-adv .field::part(task-checkbox) { accent-color: #0369a1; width: 18px; height: 18px; }
      .parts-adv .field::part(task-description) { color: #111827; font-weight: 500; }
      .parts-adv .field::part(task-assignee) { color: #0369a1; font-size: 0.8rem; font-weight: 600; }
      .parts-adv .field::part(part-name) { color: #111827; }
      .parts-adv .field::part(part-number) { color: #6b7280; font-family: monospace; font-size: 0.8rem; }
      .parts-adv .field::part(part-qty) { color: #0369a1; font-weight: 700; }
      .parts-adv .field::part(part-cost) { color: #374151; }
      .parts-adv .field::part(parts-total) { color: #0369a1; font-weight: 700; }
      .parts-adv .field::part(labor-hours) { color: #0369a1; font-weight: 700; }
      .parts-adv .field::part(labor-total) { color: #0369a1; font-weight: 700; }
      .parts-adv .field::part(grand-total) { color: #0369a1; font-size: 1.25rem; font-weight: 900; }
      .parts-adv .field::part(notes-label) { color: #0369a1; font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
      .parts-adv .field::part(notes-content) { color: #6b7280; }
      .parts-adv .field::part(sign-button) { background: #0369a1; color: #fff; border: none; border-radius: 8px; padding: 0.625rem 1.25rem; font-weight: 600; cursor: pointer; }
      .parts-adv .field::part(signature-line) { border-bottom: 2px solid #0369a1; }
      .parts-adv .field::part(signature-date) { color: #6b7280; font-size: 0.8rem; }
      .parts-adv .field::part(footer) { background: #f0f9ff; border-top: 1px solid #bae6fd; color: #0369a1; font-size: 0.8rem; font-weight: 600; }
    `;

    const CUSTOMER = { name: 'Riverside Medical Center', address: '2100 Riverside Pkwy, Sacramento, CA 95818', phone: '(916) 555-0292', email: 'facilities@riversidemc.org' };
    const ASSET = { id: 'HVAC-BLDG-A-07', name: 'Air Handling Unit — Building A', location: 'Rooftop Level 4', serial: 'AHU-2021-0077', lastService: '2026-01-12' };
    const TASKS = [
      { description: 'Inspect and clean air filters (MERV-13)', assignee: 'T. Rodriguez', completed: true, hours: 1 },
      { description: 'Check refrigerant levels and test for leaks', assignee: 'T. Rodriguez', completed: true, hours: 1.5 },
      { description: 'Lubricate fan bearings', assignee: 'M. Okafor', completed: false, hours: 0.5 },
      { description: 'Test safety shutoffs and alarms', assignee: 'M. Okafor', completed: false, hours: 1 },
      { description: 'Submit compliance report to facilities manager', assignee: 'T. Rodriguez', completed: false, hours: 0.5 },
    ];
    const PARTS = [
      { name: 'MERV-13 Filter 20x20x4', partNumber: 'FLT-M13-2024', quantity: 6, unitCost: 42.00 },
      { name: 'Fan Bearing (2.5" bore)', partNumber: 'BRG-2.5-6205', quantity: 2, unitCost: 68.00 },
      { name: 'Refrigerant R-410A (10lb)', partNumber: 'REF-R410A-10', quantity: 1, unitCost: 185.00 },
    ];

    const el = document.createElement('snice-work-order');
    el.classList.add('field');
    el.setAttribute('wo-number', 'WO-2026-0412');
    el.setAttribute('date', '2026-04-09');
    el.setAttribute('due-date', '2026-04-09');
    el.setAttribute('priority', 'urgent');
    el.setAttribute('status', 'in-progress');
    el.setAttribute('description', 'Emergency HVAC preventive maintenance required before Joint Commission inspection on 04/11. All work must comply with ASHRAE 180-2018 standards.');
    el.setAttribute('labor-rate', '145');
    el.setAttribute('notes', 'Building A houses ICU and OR suites — coordinate with facilities to avoid disruption during 6-8 AM and 12-2 PM clinical peak hours.');
    (el as any).customer = CUSTOMER;
    (el as any).asset = ASSET;
    (el as any).tasks = TASKS;
    (el as any).parts = PARTS;
    el.style.cssText = 'display:block;max-width:700px;';

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-adv');

    const col = document.createElement('div');
    const lbl = document.createElement('div');
    lbl.style.cssText = 'font:700 11px/1 sans-serif;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;';
    lbl.textContent = 'Field Service Theme via ::part()';
    col.appendChild(lbl);
    col.appendChild(el);
    wrap.appendChild(col);
    return wrap;
  },
};
