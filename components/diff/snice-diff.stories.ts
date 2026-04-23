import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-diff';

type Args = {
  mode?: 'unified' | 'split';
  lineNumbers?: boolean;
  markers?: boolean;
  contextLines?: number;
};

const OLD_CODE = `function greet(name) {
  console.log('Hello, ' + name);
  return true;
}

const x = 1;
const y = 2;
const z = x + y;`;

const NEW_CODE = `function greet(name, greeting) {
  console.log(greeting + ', ' + name);
  return greeting !== '';
}

const x = 1;
const y = 2;
const sum = x + y;
const product = x * y;`;

const meta: Meta<Args> = {
  title: 'Diff',
  component: 'snice-diff',
  tags: ['autodocs'],
  argTypes: {
    mode:         { control: 'select', options: ['unified', 'split'] },
    lineNumbers:  { control: 'boolean' },
    markers:      { control: 'boolean' },
    contextLines: { control: 'number' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-diff') as any;
    if (args.mode !== undefined) el.setAttribute('mode', args.mode);
    if (args.lineNumbers === false) el.setAttribute('line-numbers', 'false');
    if (args.markers === false) el.setAttribute('markers', 'false');
    if (args.contextLines !== undefined) el.setAttribute('context-lines', String(args.contextLines));
    wrap.appendChild(el);
    customElements.whenDefined('snice-diff').then(() => {
      el.oldText = OLD_CODE;
      el.newText = NEW_CODE;
    });
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { mode: 'unified' },
};

function makeDiff(oldText: string, newText: string, attrs: Record<string, string> = {}) {
  const el = document.createElement('snice-diff') as any;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  customElements.whenDefined('snice-diff').then(() => {
    el.oldText = oldText;
    el.newText = newText;
  });
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

// h2: mode="unified" (default)
export const ModeUnified: Story = {
  render: () => col(makeDiff(OLD_CODE, NEW_CODE, { mode: 'unified' })),
};

// h2: mode="split" (side-by-side)
export const ModeSplit: Story = {
  render: () => col(makeDiff(OLD_CODE, NEW_CODE, { mode: 'split' })),
};

// h2: line-numbers="false"
export const LineNumbersFalse: Story = {
  render: () => col(makeDiff(OLD_CODE, NEW_CODE, { 'line-numbers': 'false' })),
};

// h2: markers="false"
export const MarkersFalse: Story = {
  render: () => col(makeDiff(OLD_CODE, NEW_CODE, { markers: 'false' })),
};

// h2: line-numbers="false" + markers="false"
export const LineNumbersFalsePlusMarkersFalse: Story = {
  render: () => col(makeDiff(OLD_CODE, NEW_CODE, { 'line-numbers': 'false', markers: 'false' })),
};

// h2: context-lines="0" (changes only)
export const ContextLines0: Story = {
  render: () => col(makeDiff(OLD_CODE, NEW_CODE, { 'context-lines': '0' })),
};

// h2: context-lines="1"
export const ContextLines1: Story = {
  render: () => col(makeDiff(OLD_CODE, NEW_CODE, { 'context-lines': '1' })),
};

// h2: context-lines="10" (show all)
export const ContextLines10: Story = {
  render: () => col(makeDiff(OLD_CODE, NEW_CODE, { 'context-lines': '10' })),
};

// h2: Identical texts (no changes)
export const IdenticalTexts: Story = {
  render: () => col(makeDiff('Same\nContent\nHere', 'Same\nContent\nHere')),
};

// h2: Edge: empty old (all additions)
export const EdgeEmptyOldAllAdditions: Story = {
  render: () => col(makeDiff('', 'New line 1\nNew line 2\nNew line 3')),
};

// h2: Edge: empty new (all deletions)
export const EdgeEmptyNewAllDeletions: Story = {
  render: () => col(makeDiff('Old line 1\nOld line 2', '')),
};

// h2: Edge: both empty
export const EdgeBothEmpty: Story = {
  render: () => col(makeDiff('', '')),
};

// h2: Single line change
export const SingleLineChange: Story = {
  render: () => col(makeDiff('hello world', 'hello there')),
};

// h2: Large diff (50 lines, scattered changes)
export const LargeDiff50LinesScatteredChanges: Story = {
  render: () => {
    const oldLines = Array.from({ length: 50 }, (_, i) => `line ${i + 1}: original content`);
    const newLines = [...oldLines];
    newLines[5] = 'line 6: MODIFIED';
    newLines[25] = 'line 26: CHANGED';
    newLines.splice(40, 0, 'line 40.5: INSERTED');
    return col(makeDiff(oldLines.join('\n'), newLines.join('\n'), { 'context-lines': '2' }));
  },
};

// h2: CSS Parts Styling
// Parts: base, header, content
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; font-family: sans-serif; }
      .parts-demo .label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 0.5rem; }
      .parts-demo .row { display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start; }

      /* Default (unstyled) */
      .parts-demo .demo-default snice-diff::part(base) {}

      /* Styled: base — outermost container */
      .parts-demo .demo-styled snice-diff::part(base) {
        border: 2px solid #4ade80;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(74, 222, 128, 0.2);
      }
      /* Styled: header — filename / meta bar */
      .parts-demo .demo-styled snice-diff::part(header) {
        background: linear-gradient(90deg, #14532d, #166534);
        color: #bbf7d0;
        padding: 8px 16px;
        font-weight: 700;
        font-size: 0.85rem;
        border-bottom: 1px solid #4ade80;
      }
      /* Styled: content — diff lines area */
      .parts-demo .demo-styled snice-diff::part(content) {
        background: #0a1a0a;
        padding: 0.5rem 0;
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
      }
    `;

    const oldCode = 'const x = 1;\nconst y = 2;\nconsole.log(x + y);';
    const newCode = 'const x = 10;\nconst y = 2;\nconst z = x * y;\nconsole.log(z);';

    const defaultEl = makeDiff(oldCode, newCode);
    const styledEl = makeDiff(oldCode, newCode);

    const defaultWrap = document.createElement('div');
    defaultWrap.className = 'demo-default';
    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'label';
    defaultLabel.textContent = 'Default';
    defaultWrap.appendChild(defaultLabel);
    defaultWrap.appendChild(defaultEl);

    const styledWrap = document.createElement('div');
    styledWrap.className = 'demo-styled';
    const styledLabel = document.createElement('div');
    styledLabel.className = 'label';
    styledLabel.textContent = 'Styled (::part(base, header, content))';
    styledWrap.appendChild(styledLabel);
    styledWrap.appendChild(styledEl);

    const row = document.createElement('div');
    row.className = 'row';
    row.appendChild(defaultWrap);
    row.appendChild(styledWrap);

    const wrap = document.createElement('div');
    wrap.className = 'parts-demo';
    wrap.appendChild(style);
    wrap.appendChild(row);
    return wrap;
  },
};
