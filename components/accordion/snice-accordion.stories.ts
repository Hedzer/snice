import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-accordion';
import './snice-accordion-item';

type AccordionVariant = 'bordered' | 'elevated';

type Args = {
  variant?: AccordionVariant;
  multiple?: boolean;
};

const VARIANTS: AccordionVariant[] = ['bordered', 'elevated'];

function makeAccordion(items: Array<{ id: string; header: string; content: string; open?: boolean; disabled?: boolean }>, attrs: Record<string, string | boolean> = {}) {
  const acc = document.createElement('snice-accordion');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) acc.toggleAttribute(k, true); }
    else acc.setAttribute(k, v);
  }
  for (const item of items) {
    const el = document.createElement('snice-accordion-item');
    el.setAttribute('item-id', item.id);
    if (item.open)     el.toggleAttribute('open',     true);
    if (item.disabled) el.toggleAttribute('disabled', true);
    const hdr = document.createElement('span'); hdr.slot = 'header'; hdr.textContent = item.header;
    el.appendChild(hdr);
    const p = document.createElement('p'); p.textContent = item.content;
    el.appendChild(p);
    acc.appendChild(el);
  }
  return acc;
}

const meta: Meta<Args> = {
  title: 'Layout/Accordion',
  component: 'snice-accordion',
  tags: ['autodocs'],
  argTypes: {
    variant:  { control: 'select', options: VARIANTS },
    multiple: { control: 'boolean' },
  },
  render: (args) => {
    const attrs: Record<string, string | boolean> = {};
    if (args.variant  !== undefined) attrs['variant'] = args.variant;
    if (args.multiple) attrs['multiple'] = true;
    return makeAccordion([
      { id: 'p1', header: 'First Item (open)', content: 'Content of the first item.', open: true },
      { id: 'p2', header: 'Second Item',       content: 'Content of the second item.' },
      { id: 'p3', header: 'Third Item',        content: 'Content of the third item.' },
    ], attrs);
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { variant: 'bordered', multiple: false } };

// h2: Variant: bordered (default)
export const VariantBordered: Story = {
  render: () => makeAccordion([
    { id: 'b1', header: 'First Item (open)', content: 'Content of the first item, initially expanded.', open: true },
    { id: 'b2', header: 'Second Item',       content: 'Content of the second item.' },
    { id: 'b3', header: 'Third Item',        content: 'Content of the third item.' },
  ], { variant: 'bordered' }),
};

// h2: Variant: elevated
export const VariantElevated: Story = {
  render: () => makeAccordion([
    { id: 'e1', header: 'Elevated First',  content: 'Elevated style content.',     open: true },
    { id: 'e2', header: 'Elevated Second', content: 'Another elevated item.' },
  ], { variant: 'elevated' }),
};

// h2: Multiple mode (multiple items open simultaneously)
export const MultipleMode: Story = {
  render: () => makeAccordion([
    { id: 'm1', header: 'Item A (open)', content: 'Multiple items can be open at once.', open: true },
    { id: 'm2', header: 'Item B (open)', content: 'This is also open by default.',       open: true },
    { id: 'm3', header: 'Item C',        content: 'Click to expand.' },
  ], { multiple: true }),
};

// h2: Single mode (default, only one open at a time)
export const SingleMode: Story = {
  render: () => makeAccordion([
    { id: 's1', header: 'Alpha', content: 'Opening another will close this.' },
    { id: 's2', header: 'Beta',  content: 'Single expansion mode.' },
    { id: 's3', header: 'Gamma', content: 'Third option.' },
  ]),
};

// h2: Disabled items
export const DisabledItems: Story = {
  render: () => makeAccordion([
    { id: 'd1', header: 'Enabled Item',        content: 'This item can be toggled.' },
    { id: 'd2', header: 'Disabled Item',        content: 'This content should not be reachable.', disabled: true },
    { id: 'd3', header: 'Another Enabled Item', content: 'This item can be toggled.' },
  ]),
};

// h2: Variant x Multiple matrix
export const VariantXMultipleMatrix: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;';

    const bs = makeAccordion([
      { id: 'bs1', header: 'Open',   content: 'Bordered single.', open: true },
      { id: 'bs2', header: 'Closed', content: 'Content.' },
    ], { variant: 'bordered' });

    const em = makeAccordion([
      { id: 'em1', header: 'Open A', content: 'Elevated multiple.', open: true },
      { id: 'em2', header: 'Open B', content: 'Both open.',         open: true },
    ], { variant: 'elevated', multiple: true });

    const lbl1 = document.createElement('div');
    lbl1.style.cssText = 'font-size:.7rem;color:#888;margin-bottom:.25rem;';
    lbl1.textContent = 'bordered + single';
    const col1 = document.createElement('div');
    col1.appendChild(lbl1); col1.appendChild(bs);

    const lbl2 = document.createElement('div');
    lbl2.style.cssText = 'font-size:.7rem;color:#888;margin-bottom:.25rem;';
    lbl2.textContent = 'elevated + multiple';
    const col2 = document.createElement('div');
    col2.appendChild(lbl2); col2.appendChild(em);

    wrap.appendChild(col1); wrap.appendChild(col2);
    return wrap;
  },
};

// h2: Edge case: single item
export const EdgeCaseSingleItem: Story = {
  render: () => makeAccordion([
    { id: 'solo', header: 'Only Item', content: 'Accordion with a single item.' },
  ]),
};

// h2: Edge case: very long header text
export const EdgeCaseVeryLongHeaderText: Story = {
  render: () => makeAccordion([
    { id: 'long1', header: 'This is an extremely long header text that should demonstrate how the accordion handles overflow when the header content is much longer than typical usage would require in a normal interface', content: 'Short content.' },
  ]),
};

// h2: Edge case: rich content inside
export const EdgeCaseRichContentInside: Story = {
  render: () => {
    const acc = document.createElement('snice-accordion');
    const item = document.createElement('snice-accordion-item');
    item.setAttribute('item-id', 'rich1');
    item.toggleAttribute('open', true);
    const hdr = document.createElement('span'); hdr.slot = 'header'; hdr.textContent = 'Rich Content';
    item.appendChild(hdr);
    const p1 = document.createElement('p'); p1.textContent = 'Paragraph one.'; item.appendChild(p1);
    const p2 = document.createElement('p');
    p2.innerHTML = 'Paragraph two with <strong>bold</strong> and <em>italic</em> text.';
    item.appendChild(p2);
    const ul = document.createElement('ul');
    ['List item one', 'List item two', 'List item three'].forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
    item.appendChild(ul);
    const p3 = document.createElement('p'); p3.textContent = 'Final paragraph after a list.'; item.appendChild(p3);
    acc.appendChild(item);
    return acc;
  },
};

// h2: Edge case: empty content
export const EdgeCaseEmptyContent: Story = {
  render: () => {
    const acc = document.createElement('snice-accordion');
    const item = document.createElement('snice-accordion-item');
    item.setAttribute('item-id', 'empty1');
    const hdr = document.createElement('span'); hdr.slot = 'header'; hdr.textContent = 'Empty Body';
    item.appendChild(hdr);
    acc.appendChild(item);
    return acc;
  },
};

// h2: All items open with multiple
export const AllItemsOpenWithMultiple: Story = {
  render: () => makeAccordion([
    { id: 'ao1', header: 'All Open 1', content: 'First.',  open: true },
    { id: 'ao2', header: 'All Open 2', content: 'Second.', open: true },
    { id: 'ao3', header: 'All Open 3', content: 'Third.',  open: true },
  ], { multiple: true }),
};

// h2: CSS Parts Styling
export const CSSPartsStyling: Story = {
  render: () => {
    // Parts on snice-accordion-item: header, icon, title, content, content-inner
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
      .parts-demo-label { font-size: 0.65rem; color: #888; margin-bottom: 0.25rem; }
      .styled-acc snice-accordion-item::part(header) {
        background: linear-gradient(90deg, #1e1b4b, #312e81);
        color: #a5b4fc;
        border-bottom: 1px solid #4338ca;
        padding: 0.875rem 1rem;
      }
      .styled-acc snice-accordion-item::part(title) {
        font-weight: 700;
        font-size: 0.9rem;
        letter-spacing: 0.04em;
      }
      .styled-acc snice-accordion-item::part(icon) {
        color: #6366f1;
        width: 1.25rem;
        height: 1.25rem;
      }
      .styled-acc snice-accordion-item::part(content) {
        background: linear-gradient(160deg, #1e1b4b 0%, #1e293b 100%);
      }
      .styled-acc snice-accordion-item::part(content-inner) {
        color: #c7d2fe;
        border-left: 3px solid #6366f1;
        margin: 0.5rem 1rem;
        padding: 0.5rem 0.75rem;
        background: rgba(99, 102, 241, 0.08);
        border-radius: 0 0.5rem 0.5rem 0;
      }
    `;
    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.className = 'parts-demo';

    const l1 = document.createElement('div'); l1.className = 'parts-demo-label'; l1.textContent = 'default';
    const a1 = makeAccordion([
      { id: 'cp1', header: 'First Item', content: 'Default styles, no ::part() overrides.', open: true },
      { id: 'cp2', header: 'Second Item', content: 'Another item.' },
    ]);
    const col1 = document.createElement('div'); col1.appendChild(l1); col1.appendChild(a1); wrap.appendChild(col1);

    const l2 = document.createElement('div'); l2.className = 'parts-demo-label'; l2.textContent = '::part(header|icon|title|content|content-inner)';
    const a2 = makeAccordion([
      { id: 'sp1', header: 'Styled Header', content: 'Content with gradient background and indigo left border.', open: true },
      { id: 'sp2', header: 'Another Item', content: 'All parts styled with indigo/violet theme.' },
    ]);
    a2.className = 'styled-acc';
    const col2 = document.createElement('div'); col2.appendChild(l2); col2.appendChild(a2); wrap.appendChild(col2);

    return wrap;
  },
};

// h2: Mixed: disabled + open + normal
export const MixedDisabledOpenNormal: Story = {
  render: () => makeAccordion([
    { id: 'mix1', header: 'Open & Enabled',    content: 'Expanded and interactive.',    open: true },
    { id: 'mix2', header: 'Disabled',           content: 'Cannot be toggled.',           disabled: true },
    { id: 'mix3', header: 'Closed & Enabled',   content: 'Collapsed but interactive.' },
  ], { multiple: true }),
};
