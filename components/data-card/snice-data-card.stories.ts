import type { Meta, StoryObj } from '@storybook/web-components-vite';
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
  title: 'Data/DataCard',
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
