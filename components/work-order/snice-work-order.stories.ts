import type { Meta, StoryObj } from '@storybook/html-vite';
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
