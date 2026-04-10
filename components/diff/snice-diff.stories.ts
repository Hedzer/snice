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
  title: 'Specialty/Diff',
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
