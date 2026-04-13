import type { Meta, StoryObj } from '@storybook/html-vite';
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

// h2: CSS Parts Styling
// Available parts: base, title, empty, rows, row, key-input, value-input, description-input,
//                  delete-button, view-row, view-key, view-value, view-desc, copy-button
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; padding: 1.5rem; font-family: sans-serif; }
      .parts-demo__section { display: flex; flex-direction: column; gap: 0.75rem; }
      .parts-demo__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 0.25rem; }

      /* Styled: HTTP headers inspector */
      .parts-demo__http snice-key-value::part(base) {
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      }
      .parts-demo__http snice-key-value::part(title) {
        color: #58a6ff;
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        border-bottom: 1px solid #21262d;
        padding-bottom: 0.5rem;
      }
      .parts-demo__http snice-key-value::part(row) {
        background: #161b22;
        border: 1px solid #21262d;
        border-radius: 6px;
        margin-bottom: 4px;
      }
      .parts-demo__http snice-key-value::part(key-input) {
        background: transparent;
        color: #79c0ff;
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
        border: none;
        font-weight: 600;
      }
      .parts-demo__http snice-key-value::part(value-input) {
        background: transparent;
        color: #a5d6a7;
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
        border: none;
      }
      .parts-demo__http snice-key-value::part(delete-button) {
        color: #f85149;
        background: rgba(248,81,73,0.1);
        border: 1px solid rgba(248,81,73,0.2);
        border-radius: 4px;
      }
      .parts-demo__http snice-key-value::part(view-row) {
        background: #161b22;
        border: 1px solid #21262d;
        border-radius: 6px;
        padding: 0.4rem 0.75rem;
      }
      .parts-demo__http snice-key-value::part(view-key) {
        color: #79c0ff;
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .parts-demo__http snice-key-value::part(view-value) {
        color: #a5d6a7;
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
      }
      .parts-demo__http snice-key-value::part(copy-button) {
        color: #8b949e;
        background: rgba(139,148,158,0.1);
        border: 1px solid rgba(139,148,158,0.2);
        border-radius: 4px;
      }

      /* Styled: spreadsheet / excel */
      .parts-demo__sheet snice-key-value::part(base) {
        background: #fff;
        border: 1px solid #d0d7de;
        border-radius: 4px;
        font-family: 'Segoe UI', Arial, sans-serif;
      }
      .parts-demo__sheet snice-key-value::part(title) {
        background: #217346;
        color: #fff;
        font-weight: 700;
        font-size: 0.85rem;
        padding: 0.5rem 0.75rem;
        border-radius: 3px 3px 0 0;
      }
      .parts-demo__sheet snice-key-value::part(row) {
        border-bottom: 1px solid #d0d7de;
        border-radius: 0;
        background: #fff;
      }
      .parts-demo__sheet snice-key-value::part(row):nth-child(even) {
        background: #f6f8fa;
      }
      .parts-demo__sheet snice-key-value::part(key-input) {
        background: transparent;
        color: #24292f;
        font-size: 0.85rem;
        border: none;
        font-weight: 600;
        border-right: 1px solid #d0d7de;
      }
      .parts-demo__sheet snice-key-value::part(value-input) {
        background: transparent;
        color: #24292f;
        font-size: 0.85rem;
        border: none;
      }
      .parts-demo__sheet snice-key-value::part(delete-button) {
        color: #cf222e;
        background: transparent;
        border: none;
      }
      .parts-demo__sheet snice-key-value::part(empty) {
        color: #8c959f;
        font-style: italic;
        font-size: 0.85rem;
      }
    `;

    const container = document.createElement('div');
    container.className = 'parts-demo';
    container.appendChild(style);

    // Default section
    const defaultSection = document.createElement('div');
    defaultSection.className = 'parts-demo__section';
    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'parts-demo__label';
    defaultLabel.textContent = 'Default (no ::part() styles)';
    defaultSection.appendChild(defaultLabel);
    defaultSection.appendChild(makeKv({ label: 'Key-Value Pairs' }));
    container.appendChild(defaultSection);

    // HTTP section
    const httpSection = document.createElement('div');
    httpSection.className = 'parts-demo__section parts-demo__http';
    const httpLabel = document.createElement('div');
    httpLabel.className = 'parts-demo__label';
    httpLabel.textContent = '::part(base/title/row/key-input/value-input/delete-button/view-row/view-key/view-value/copy-button) — GitHub dark';
    httpSection.appendChild(httpLabel);
    httpSection.appendChild(makeKv({ label: 'HTTP Headers', 'show-copy': true }));
    container.appendChild(httpSection);

    // Spreadsheet section
    const sheetSection = document.createElement('div');
    sheetSection.className = 'parts-demo__section parts-demo__sheet';
    const sheetLabel = document.createElement('div');
    sheetLabel.className = 'parts-demo__label';
    sheetLabel.textContent = '::part(base/title/row/key-input/value-input/delete-button/empty) — Spreadsheet';
    sheetSection.appendChild(sheetLabel);
    sheetSection.appendChild(makeKv({ label: 'Configuration' }));
    container.appendChild(sheetSection);

    return container;
  },
};

// h2: CSS Parts Advanced
// Demonstrates view-mode parts: view-row, view-key, view-value, view-desc, copy-button
export const CSSPartsAdvanced: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-adv { display: flex; flex-direction: column; gap: 2rem; padding: 1.5rem; font-family: sans-serif; }
      .parts-adv__section { display: flex; flex-direction: column; gap: 0.75rem; }
      .parts-adv__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 0.25rem; }

      /* View mode: badge-style key/value */
      .parts-adv__badge snice-key-value::part(base) {
        background: #fafafa;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
      }
      .parts-adv__badge snice-key-value::part(title) {
        color: #212121;
        font-weight: 700;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        border-bottom: 2px solid #e0e0e0;
        padding-bottom: 0.5rem;
        margin-bottom: 0.5rem;
      }
      .parts-adv__badge snice-key-value::part(view-row) {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        padding: 0.35rem 0;
        border-bottom: 1px dashed #eee;
      }
      .parts-adv__badge snice-key-value::part(view-key) {
        background: #e3f2fd;
        color: #1565c0;
        border-radius: 999px;
        padding: 0.15rem 0.65rem;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        min-width: 80px;
        text-align: center;
      }
      .parts-adv__badge snice-key-value::part(view-value) {
        background: #f3e5f5;
        color: #4a148c;
        border-radius: 999px;
        padding: 0.15rem 0.65rem;
        font-size: 0.72rem;
        font-weight: 600;
      }
      .parts-adv__badge snice-key-value::part(view-desc) {
        color: #9e9e9e;
        font-style: italic;
        font-size: 0.7rem;
        padding: 0 0.65rem;
      }
      .parts-adv__badge snice-key-value::part(copy-button) {
        background: #e8f5e9;
        color: #2e7d32;
        border: 1px solid rgba(46,125,50,0.3);
        border-radius: 999px;
        padding: 0.15rem 0.5rem;
        font-size: 0.7rem;
        cursor: pointer;
      }
    `;

    const container = document.createElement('div');
    container.className = 'parts-adv';
    container.appendChild(style);

    const badgeSection = document.createElement('div');
    badgeSection.className = 'parts-adv__section parts-adv__badge';
    const badgeLabel = document.createElement('div');
    badgeLabel.className = 'parts-adv__label';
    badgeLabel.textContent = '::part(view-row/view-key/view-value/view-desc/copy-button) — Badge pill style (view mode)';
    badgeSection.appendChild(badgeLabel);
    const kv = makeKv({ label: 'Metadata', mode: 'view', 'show-copy': true, 'show-description': true });
    badgeSection.appendChild(kv);
    container.appendChild(badgeSection);

    return container;
  },
};
