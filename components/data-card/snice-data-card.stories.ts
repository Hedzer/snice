import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-data-card';
import type { DataCardVariant, DataCardField } from './snice-data-card.types';

type Args = {
  editable?: boolean;
  variant?: DataCardVariant;
};

const VARIANTS: DataCardVariant[] = ['default', 'horizontal', 'compact'];

function makeCard(fields: DataCardField[], attrs: Record<string, string | boolean> = {}): HTMLElement {
  const el = document.createElement('snice-data-card');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  (el as any).fields = fields;
  return el;
}

const meta: Meta<Args> = {
  title: 'DataCard',
  component: 'snice-data-card',
  tags: ['autodocs'],
  argTypes: {
    editable: { control: 'boolean' },
    variant:  { control: 'select', options: VARIANTS },
  },
  render: (args) => {
    const el = document.createElement('snice-data-card');
    if (args.variant !== undefined) el.setAttribute('variant', args.variant);
    if (args.editable) el.toggleAttribute('editable', true);
    (el as any).fields = [
      { label: 'Name',  value: 'John Doe' },
      { label: 'Email', value: 'john@example.com' },
      { label: 'Role',  value: 'Administrator' },
    ];
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { variant: 'default' } };

// h2: Basic (text fields)
export const BasicTextFields: Story = {
  render: () => makeCard([
    { label: 'Name',  value: 'John Doe' },
    { label: 'Email', value: 'john@example.com' },
    { label: 'Role',  value: 'Administrator' },
  ]),
};

// h2: All field types: text, link, badge (5 variants), date, currency
export const AllFieldTypesTextLinkBadgeDateCurrency: Story = {
  render: () => makeCard([
    { label: 'Text',             value: 'Plain text value',   type: 'text' },
    { label: 'Link',             value: 'example.com',        type: 'link', href: 'https://example.com' },
    { label: 'Badge (default)',  value: 'Default',            type: 'badge', badgeVariant: 'default' },
    { label: 'Badge (primary)',  value: 'Primary',            type: 'badge', badgeVariant: 'primary' },
    { label: 'Badge (success)',  value: 'Active',             type: 'badge', badgeVariant: 'success' },
    { label: 'Badge (warning)',  value: 'Pending',            type: 'badge', badgeVariant: 'warning' },
    { label: 'Badge (danger)',   value: 'Overdue',            type: 'badge', badgeVariant: 'danger' },
    { label: 'Date',             value: '2026-03-06',         type: 'date' },
    { label: 'Currency',         value: '$1,250.00',          type: 'currency' },
  ]),
};

// h2: Grouped fields with icons
export const GroupedFieldsWithIcons: Story = {
  render: () => makeCard([
    { label: 'First Name', value: 'John',        group: 'Personal', icon: '👤' },
    { label: 'Last Name',  value: 'Doe',         group: 'Personal', icon: '👤' },
    { label: 'Email',      value: 'john@acme.com', group: 'Contact', icon: '✉️' },
    { label: 'Phone',      value: '555-0123',    group: 'Contact', icon: '📞' },
    { label: 'Address',    value: '123 Main St', group: 'Location', icon: '📍' },
  ]),
};

// h2: editable (click Edit toggle)
export const EditableClickEditToggle: Story = {
  render: () => makeCard([
    { label: 'Title',  value: 'Website Redesign' },
    { label: 'Status', value: 'In Progress', type: 'badge', badgeVariant: 'primary', editable: false },
    { label: 'Budget', value: '$50,000', type: 'currency' },
    { label: 'Notes',  value: 'Click edit to modify' },
  ], { editable: true }),
};

// h2: variant="default"
export const VariantDefault: Story = {
  render: () => makeCard([
    { label: 'ID',     value: '#12345' },
    { label: 'Type',   value: 'Invoice' },
    { label: 'Amount', value: '$500.00', type: 'currency' },
  ], { variant: 'default' }),
};

// h2: variant="horizontal"
export const VariantHorizontal: Story = {
  render: () => makeCard([
    { label: 'ID',     value: '#12345' },
    { label: 'Type',   value: 'Invoice' },
    { label: 'Amount', value: '$500.00', type: 'currency' },
  ], { variant: 'horizontal' }),
};

// h2: variant="compact"
export const VariantCompact: Story = {
  render: () => makeCard([
    { label: 'OS',     value: 'Ubuntu 22.04' },
    { label: 'CPU',    value: '8 cores' },
    { label: 'RAM',    value: '16 GB' },
    { label: 'Disk',   value: '500 GB SSD' },
    { label: 'Status', value: 'Healthy', type: 'badge', badgeVariant: 'success' },
  ], { variant: 'compact' }),
};

// h2: With header slot
export const WithHeaderSlot: Story = {
  render: () => {
    const el = makeCard([
      { label: 'Name',     value: 'Alice', icon: '👤' },
      { label: 'Email',    value: 'alice@test.com', icon: '✉️' },
      { label: 'Phone',    value: '555-1234', icon: '📞' },
      { label: 'Location', value: 'NYC', icon: '📍' },
      { label: 'Role',     value: 'Admin', icon: '🔑' },
    ]);
    const title = document.createElement('span');
    title.slot = 'title';
    title.textContent = 'User Details';
    el.appendChild(title);
    return el;
  },
};

// h2: Empty (no fields)
export const EmptyNoFields: Story = {
  render: () => makeCard([]),
};

// h2: Single field
export const SingleField: Story = {
  render: () => makeCard([
    { label: 'Status', value: 'Online', type: 'badge', badgeVariant: 'success' },
  ]),
};

// h2: Edge: long value + single character
export const EdgeLongValueSingleCharacter: Story = {
  render: () => makeCard([
    { label: 'Description', value: 'This is an extremely long value that should wrap properly within the data card field layout without breaking the visual structure of the component' },
    { label: 'X', value: 'Y' },
  ]),
};

// h2: CSS Parts Styling
// Parts: container, header, title, edit-toggle, group, group-title,
//        field, field-icon, field-label, field-value, field-input, field-save, field-edit
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; padding: 1rem; max-width: 900px; }
      .parts-demo .item { display: flex; flex-direction: column; gap: .4rem; }
      .parts-demo .label { font-size: .65rem; color: #888; font-weight: 600; text-transform: uppercase; }

      /* ::part(container) — outer card shell */
      .parts-demo snice-data-card.styled::part(container) {
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,.4);
      }

      /* ::part(header) — header bar */
      .parts-demo snice-data-card.styled::part(header) {
        background: #1e293b;
        border-bottom: 1px solid #6366f1;
        padding: .75rem 1rem;
        border-radius: 16px 16px 0 0;
      }

      /* ::part(title) — the title slot */
      .parts-demo snice-data-card.styled::part(title) {
        color: #f1f5f9;
        font-size: 1.1rem;
        font-weight: 800;
        letter-spacing: -.02em;
      }

      /* ::part(group) — field group wrapper */
      .parts-demo snice-data-card.styled::part(group) {
        border-left: 3px solid #6366f1;
        margin-left: .5rem;
        padding-left: .75rem;
      }

      /* ::part(group-title) — group heading */
      .parts-demo snice-data-card.styled::part(group-title) {
        color: #818cf8;
        font-size: .7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .1em;
      }

      /* ::part(field) — each field row */
      .parts-demo snice-data-card.styled::part(field) {
        border-bottom: 1px solid #1e293b;
        padding: .4rem 0;
      }

      /* ::part(field-icon) — icon prefix in field */
      .parts-demo snice-data-card.styled::part(field-icon) {
        color: #6366f1;
        font-size: 1rem;
      }

      /* ::part(field-label) — label text */
      .parts-demo snice-data-card.styled::part(field-label) {
        color: #64748b;
        font-size: .7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: .06em;
        min-width: 90px;
      }

      /* ::part(field-value) — value display */
      .parts-demo snice-data-card.styled::part(field-value) {
        color: #f1f5f9;
        font-weight: 500;
      }
    `;

    const sampleFields: DataCardField[] = [
      { label: 'Name',     value: 'Alice Chen',        icon: '👤' },
      { label: 'Email',    value: 'alice@example.com', type: 'link', href: 'mailto:alice@example.com', icon: '✉️' },
      { label: 'Status',   value: 'Active',            type: 'badge', badgeVariant: 'success' },
      { label: 'Joined',   value: '2024-01-15',        type: 'date' },
      { label: 'Balance',  value: '$1,200.00',         type: 'currency' },
    ];

    const wrap = document.createElement('div');
    wrap.appendChild(style);

    const demo = document.createElement('div');
    demo.className = 'parts-demo';

    const makeItem = (label: string, el: HTMLElement) => {
      const item = document.createElement('div');
      item.className = 'item';
      const lbl = document.createElement('div');
      lbl.className = 'label';
      lbl.textContent = label;
      item.appendChild(lbl);
      item.appendChild(el);
      return item;
    };

    const def = makeCard(sampleFields);
    const defTitle = document.createElement('span');
    defTitle.slot = 'title';
    defTitle.textContent = 'User Profile';
    def.appendChild(defTitle);
    demo.appendChild(makeItem('default (no ::part overrides)', def));

    const styled = makeCard(sampleFields);
    styled.className = 'styled';
    const styledTitle = document.createElement('span');
    styledTitle.slot = 'title';
    styledTitle.textContent = 'User Profile';
    styled.appendChild(styledTitle);
    demo.appendChild(makeItem('dark themed via ::part() selectors', styled));

    wrap.appendChild(demo);
    return wrap;
  },
};

// h2: CSS Parts Advanced
// Demonstrates: field-input, field-save, field-edit (editable mode parts)
export const CSSPartsAdvanced: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-adv { padding: 1rem; max-width: 480px; }
      .parts-adv .label { font-size: .65rem; color: #888; font-weight: 600; text-transform: uppercase; margin-bottom: .5rem; }

      /* ::part(edit-toggle) — pencil/edit button in header */
      .parts-adv snice-data-card.adv::part(edit-toggle) {
        background: #6366f1;
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: .25rem .6rem;
        font-size: .75rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(99,102,241,.4);
      }

      /* ::part(field-edit) — edit icon button per field */
      .parts-adv snice-data-card.adv::part(field-edit) {
        background: transparent;
        color: #6366f1 !important;
        border: 2px solid #6366f1 !important;
        border-radius: 6px;
        padding: .15rem .4rem;
        font-size: .75rem;
        cursor: pointer;
        transition: background .15s;
      }
      .parts-adv snice-data-card.adv::part(field-edit):hover {
        background: #6366f1;
        color: #fff !important;
      }

      /* ::part(field-input) — text input in edit mode */
      .parts-adv snice-data-card.adv::part(field-input) {
        border: 2px solid #6366f1;
        border-radius: 6px;
        background: #eef2ff;
        color: #1e1b4b;
        font-size: .85rem;
        outline: none;
        padding: .25rem .5rem;
      }

      /* ::part(field-save) — save button in edit mode */
      .parts-adv snice-data-card.adv::part(field-save) {
        background: #6366f1;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: .25rem .6rem;
        font-size: .75rem;
        font-weight: 700;
        cursor: pointer;
      }
    `;

    const wrap = document.createElement('div');
    wrap.appendChild(style);

    const demo = document.createElement('div');
    demo.className = 'parts-adv';

    const lbl = document.createElement('div');
    lbl.className = 'label';
    lbl.textContent = 'Editable fields — ::part(edit-toggle), ::part(field-edit), ::part(field-input), ::part(field-save)';
    demo.appendChild(lbl);

    const editableFields: DataCardField[] = [
      { label: 'Name',  value: 'Alice Chen',        editable: true },
      { label: 'Email', value: 'alice@example.com', editable: true },
      { label: 'Role',  value: 'Engineer',           editable: true },
    ];

    const el = makeCard(editableFields, { editable: true });
    el.className = 'adv';
    const title = document.createElement('span');
    title.slot = 'title';
    title.textContent = 'Editable Card';
    el.appendChild(title);
    demo.appendChild(el);

    wrap.appendChild(demo);
    return wrap;
  },
};
