import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-paint';

type Args = {
  controls?: string;
  strokeWidth?: number;
  minStrokeWidth?: number;
  maxStrokeWidth?: number;
  backgroundColor?: string;
  color?: string;
  colorSelects?: number;
  disabled?: boolean;
};

const meta: Meta<Args> = {
  title: 'Specialty/Paint',
  component: 'snice-paint',
  tags: ['autodocs'],
  argTypes: {
    controls:       { control: 'text' },
    strokeWidth:    { control: 'number' },
    minStrokeWidth: { control: 'number' },
    maxStrokeWidth: { control: 'number' },
    backgroundColor:{ control: 'color' },
    color:          { control: 'color' },
    colorSelects:   { control: 'number' },
    disabled:       { control: 'boolean' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-paint');
    el.style.cssText = 'height:250px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;';
    if (args.controls        !== undefined) el.setAttribute('controls',         args.controls);
    if (args.strokeWidth     !== undefined) el.setAttribute('stroke-width',     String(args.strokeWidth));
    if (args.minStrokeWidth  !== undefined) el.setAttribute('min-stroke-width', String(args.minStrokeWidth));
    if (args.maxStrokeWidth  !== undefined) el.setAttribute('max-stroke-width', String(args.maxStrokeWidth));
    if (args.backgroundColor !== undefined) el.setAttribute('background-color', args.backgroundColor);
    if (args.color           !== undefined) el.setAttribute('color',            args.color);
    if (args.colorSelects    !== undefined) el.setAttribute('color-selects',    String(args.colorSelects));
    if (args.disabled) el.toggleAttribute('disabled', true);
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

function makePaint(attrs: Record<string, string | boolean> = {}, slotContent?: (el: HTMLElement) => void) {
  const el = document.createElement('snice-paint');
  el.style.cssText = 'height:250px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  if (slotContent) slotContent(el);
  return el;
}

function section(el: HTMLElement) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
  wrap.appendChild(el);
  return wrap;
}

export const Default: Story = {
  args: {},
};

// h2: Default (all controls)
export const DefaultAllControls: Story = {
  render: () => section(makePaint()),
};

// h2: Controls: colors only
export const ControlsColorsOnly: Story = {
  render: () => section(makePaint({ controls: 'colors' })),
};

// h2: Controls: size only
export const ControlsSizeOnly: Story = {
  render: () => section(makePaint({ controls: 'size' })),
};

// h2: Controls: eraser only
export const ControlsEraserOnly: Story = {
  render: () => section(makePaint({ controls: 'eraser' })),
};

// h2: Controls: undo,redo
export const ControlsUndoRedo: Story = {
  render: () => section(makePaint({ controls: 'undo,redo' })),
};

// h2: Controls: clear only
export const ControlsClearOnly: Story = {
  render: () => section(makePaint({ controls: 'clear' })),
};

// h2: Controls: none (empty string)
export const ControlsNone: Story = {
  render: () => section(makePaint({ controls: '' })),
};

// h2: Custom colors
export const CustomColors: Story = {
  render: () => section(makePaint({ colors: '["#ff0000","#00ff00","#0000ff","#ffff00","#ff00ff"]' })),
};

// h2: color-selects="2" (extra color pickers)
export const ColorSelects2: Story = {
  render: () => section(makePaint({ 'color-selects': '2' })),
};

// h2: color-selects="4"
export const ColorSelects4: Story = {
  render: () => section(makePaint({ 'color-selects': '4' })),
};

// h2: stroke-width="1"
export const StrokeWidth1: Story = {
  render: () => section(makePaint({ 'stroke-width': '1' })),
};

// h2: stroke-width="10"
export const StrokeWidth10: Story = {
  render: () => section(makePaint({ 'stroke-width': '10' })),
};

// h2: stroke-width="20"
export const StrokeWidth20: Story = {
  render: () => section(makePaint({ 'stroke-width': '20' })),
};

// h2: min-stroke-width="5" max-stroke-width="50"
export const MinMaxStrokeWidth: Story = {
  render: () => section(makePaint({ 'min-stroke-width': '5', 'max-stroke-width': '50' })),
};

// h2: background-color="#f0f0f0"
export const BackgroundColorLight: Story = {
  render: () => section(makePaint({ 'background-color': '#f0f0f0' })),
};

// h2: background-color="#1a1a2e"
export const BackgroundColorDark: Story = {
  render: () => section(makePaint({ 'background-color': '#1a1a2e', color: '#ffffff' })),
};

// h2: disabled
export const Disabled: Story = {
  render: () => section(makePaint({ disabled: true })),
};

// h2: Slot: toolbar-start
export const SlotToolbarStart: Story = {
  render: () => section(makePaint({}, (el) => {
    const span = document.createElement('span');
    span.slot = 'toolbar-start';
    span.style.cssText = 'font-size:.75rem;padding:0 .5rem;color:#666;';
    span.textContent = 'Custom Start';
    el.appendChild(span);
  })),
};

// h2: Slot: toolbar-end
export const SlotToolbarEnd: Story = {
  render: () => section(makePaint({}, (el) => {
    const btn = document.createElement('button');
    btn.slot = 'toolbar-end';
    btn.style.cssText = 'padding:.25rem .5rem;font-size:.75rem;cursor:pointer;';
    btn.textContent = 'Save';
    btn.onclick = () => (el as any).download?.();
    el.appendChild(btn);
  })),
};

// h2: Slot: tools (custom tool buttons)
export const SlotTools: Story = {
  render: () => section(makePaint({}, (el) => {
    for (const label of ['Rect', 'Circle']) {
      const btn = document.createElement('button');
      btn.slot = 'tools';
      btn.style.cssText = 'padding:.25rem .5rem;font-size:.75rem;cursor:pointer;';
      btn.textContent = label;
      el.appendChild(btn);
    }
  })),
};

// h2: Slot: colors (replace default swatches)
export const SlotColors: Story = {
  render: () => section(makePaint({}, (el) => {
    const input = document.createElement('input');
    input.slot = 'colors';
    input.type = 'color';
    input.value = '#3b82f6';
    input.style.cssText = 'width:2rem;height:2rem;border:none;cursor:pointer;';
    input.onchange = () => { (el as any).color = input.value; };
    el.appendChild(input);
  })),
};
