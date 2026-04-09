import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-key-value';
import type { KeyValueVariant, KeyValueMode } from './snice-key-value.types';

type Args = {
  label?: string;
  autoExpand?: boolean;
  rows?: number;
  showDescription?: boolean;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  name?: string;
  variant?: KeyValueVariant;
  mode?: KeyValueMode;
  showCopy?: boolean;
};

const VARIANTS: KeyValueVariant[] = ['default', 'compact'];
const MODES: KeyValueMode[] = ['edit', 'view'];

function makeKv(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-key-value');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, String(v));
  }
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;width:100%;max-width:560px;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:1.5rem;flex-wrap:wrap;align-items:flex-start;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function makeKvWithPairs(attrs: Record<string, string | boolean | number> = {}, pairs: Array<{ key: string; value: string; description?: string }>) {
  const el = makeKv(attrs);
  for (const pair of pairs) {
    const pairEl = document.createElement('snice-kv-pair');
    pairEl.setAttribute('pair-key', pair.key);
    pairEl.setAttribute('pair-value', pair.value);
    if (pair.description) pairEl.setAttribute('description', pair.description);
    el.appendChild(pairEl);
  }
  return el;
}

const meta: Meta<Args> = {
  title: 'Form/KeyValue',
  component: 'snice-key-value',
  tags: ['autodocs'],
  argTypes: {
    label:            { control: 'text' },
    autoExpand:       { control: 'boolean' },
    rows:             { control: 'number' },
    showDescription:  { control: 'boolean' },
    keyPlaceholder:   { control: 'text' },
    valuePlaceholder: { control: 'text' },
    disabled:         { control: 'boolean' },
    readonly:         { control: 'boolean' },
    name:             { control: 'text' },
    variant:          { control: 'select', options: VARIANTS },
    mode:             { control: 'select', options: MODES },
    showCopy:         { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-key-value');
    if (args.label            !== undefined) el.setAttribute('label',             String(args.label));
    if (args.rows             !== undefined) el.setAttribute('rows',              String(args.rows));
    if (args.keyPlaceholder   !== undefined) el.setAttribute('key-placeholder',   String(args.keyPlaceholder));
    if (args.valuePlaceholder !== undefined) el.setAttribute('value-placeholder', String(args.valuePlaceholder));
    if (args.name             !== undefined) el.setAttribute('name',              String(args.name));
    if (args.variant          !== undefined) el.setAttribute('variant',           String(args.variant));
    if (args.mode             !== undefined) el.setAttribute('mode',              String(args.mode));
    if (args.autoExpand === false) el.setAttribute('auto-expand', 'false');
    if (args.disabled)        el.toggleAttribute('disabled',          true);
    if (args.readonly)        el.toggleAttribute('readonly',          true);
    if (args.showDescription) el.toggleAttribute('show-description',  true);
    if (args.showCopy)        el.toggleAttribute('show-copy',         true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { label: 'Key / Value', variant: 'default', mode: 'edit' },
};

// h2: Mode: edit (default, empty)
export const ModeEditEmpty: Story = {
  render: () => col(makeKv({ label: 'Configuration', mode: 'edit' })),
};

// h2: Mode: edit (pre-populated)
export const ModeEditPrePopulated: Story = {
  render: () => {
    const el = makeKv({ label: 'Environment', mode: 'edit' });
    (el as any).setItems([
      { key: 'NODE_ENV', value: 'production' },
      { key: 'PORT', value: '3000' },
      { key: 'API_URL', value: 'https://api.example.com' },
    ]);
    return col(el);
  },
};

// h2: Mode: view
export const ModeView: Story = {
  render: () => {
    const el = makeKv({ label: 'Metadata', mode: 'view' });
    (el as any).setItems([
      { key: 'Author', value: 'Jane Doe' },
      { key: 'Version', value: '1.0.0' },
      { key: 'License', value: 'MIT' },
    ]);
    return col(el);
  },
};

// h2: Variant: default
export const VariantDefault: Story = {
  render: () => col(makeKv({ label: 'Default Variant', variant: 'default' })),
};

// h2: Variant: compact
export const VariantCompact: Story = {
  render: () => col(makeKv({ label: 'Compact Variant', variant: 'compact' })),
};

// h2: Variant Comparison
export const VariantComparison: Story = {
  render: () => row(
    makeKv({ label: 'Default', variant: 'default' }),
    makeKv({ label: 'Compact', variant: 'compact' }),
  ),
};

// h2: auto-expand: true (default)
export const AutoExpandTrue: Story = {
  render: () => col(makeKv({ label: 'Auto Expand (default)' })),
};

// h2: auto-expand: false
export const AutoExpandFalse: Story = {
  render: () => col(makeKv({ label: 'No Auto Expand', 'auto-expand': 'false' })),
};

// h2: Rows: 3 (fixed)
export const Rows3: Story = {
  render: () => col(makeKv({ label: 'Fixed 3 rows', rows: 3 })),
};

// h2: Rows: 5 (fixed)
export const Rows5: Story = {
  render: () => col(makeKv({ label: 'Fixed 5 rows', rows: 5 })),
};

// h2: show-description: true
export const ShowDescriptionTrue: Story = {
  render: () => col(makeKv({ label: 'With Descriptions', 'show-description': true })),
};

// h2: show-description: true (view mode)
export const ShowDescriptionTrueViewMode: Story = {
  render: () => {
    const el = makeKv({ label: 'Docs', mode: 'view', 'show-description': true });
    (el as any).setItems([
      { key: 'Name', value: 'Snice', description: 'The component library name' },
      { key: 'Version', value: '4.x', description: 'Current major version' },
    ]);
    return col(el);
  },
};

// h2: Custom Placeholders (key-placeholder, value-placeholder)
export const CustomPlaceholders: Story = {
  render: () => col(makeKv({ label: 'Custom Placeholders', 'key-placeholder': 'Header name', 'value-placeholder': 'Header value' })),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => {
    const el = makeKv({ label: 'Disabled', disabled: true });
    (el as any).setItems([{ key: 'HOST', value: 'localhost' }]);
    return col(el);
  },
};

// h2: Readonly
export const Readonly: Story = {
  render: () => {
    const el = makeKv({ label: 'Readonly', readonly: true });
    (el as any).setItems([{ key: 'ENV', value: 'production' }]);
    return col(el);
  },
};

// h2: show-copy: true
export const ShowCopyTrue: Story = {
  render: () => {
    const el = makeKv({ label: 'Copyable', 'show-copy': true });
    (el as any).setItems([
      { key: 'API_KEY', value: 'abc123xyz' },
      { key: 'SECRET', value: 'sup3rs3cret' },
    ]);
    return col(el);
  },
};

// h2: No Label
export const NoLabel: Story = {
  render: () => col(makeKv({})),
};

// h2: Declarative API (snice-kv-pair children)
export const DeclarativeApiSniceKvPairChildren: Story = {
  render: () => {
    return col(makeKvWithPairs({ label: 'Declarative Pairs' }, [
      { key: 'Name', value: 'Alice' },
      { key: 'Role', value: 'Admin' },
      { key: 'Email', value: 'alice@example.com' },
    ]));
  },
};

// h2: Compact + Fixed Rows + Descriptions + Disabled
export const CompactFixedRowsDescriptionsDisabled: Story = {
  render: () => {
    const el = makeKv({ label: 'Readonly Config', variant: 'compact', rows: 3, 'show-description': true, disabled: true });
    (el as any).setItems([
      { key: 'HOST', value: 'prod.server.com', description: 'Production hostname' },
      { key: 'PORT', value: '443', description: 'HTTPS port' },
      { key: 'REGION', value: 'us-east-1', description: 'AWS region' },
    ]);
    return col(el);
  },
};

// h2: View Mode + Copy + No Label
export const ViewModeCopyNoLabel: Story = {
  render: () => {
    const el = makeKv({ mode: 'view', 'show-copy': true });
    (el as any).setItems([
      { key: 'TOKEN', value: 'eyJhbGci...' },
      { key: 'EXPIRES', value: '3600' },
    ]);
    return col(el);
  },
};

// h2: Name (form integration)
export const NameFormIntegration: Story = {
  render: () => col(makeKv({ name: 'headers', label: 'HTTP Headers (name=headers)' })),
};
