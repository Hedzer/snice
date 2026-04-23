import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-time-range-picker';
import type { TimeRangeGranularity, TimeFormat } from './snice-time-range-picker.types';

type Args = {
  granularity?: TimeRangeGranularity;
  startTime?: string;
  endTime?: string;
  value?: string;
  disabledRanges?: string;
  format?: TimeFormat;
  multiple?: boolean;
  readonly?: boolean;
  disabled?: boolean;
};

const FORMATS: TimeFormat[] = ['24h', '12h'];
const GRANULARITIES: TimeRangeGranularity[] = [1, 5, 10, 15, 30];

function makePicker(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-time-range-picker');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, String(v));
  }
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:flex-start;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'TimeRangePicker',
  component: 'snice-time-range-picker',
  tags: ['autodocs'],
  argTypes: {
    granularity:    { control: 'select', options: GRANULARITIES },
    startTime:      { control: 'text' },
    endTime:        { control: 'text' },
    value:          { control: 'text' },
    disabledRanges: { control: 'text' },
    format:         { control: 'select', options: FORMATS },
    multiple:       { control: 'boolean' },
    readonly:       { control: 'boolean' },
    disabled:       { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-time-range-picker');
    if (args.granularity    !== undefined) el.setAttribute('granularity',     String(args.granularity));
    if (args.startTime      !== undefined) el.setAttribute('start-time',      String(args.startTime));
    if (args.endTime        !== undefined) el.setAttribute('end-time',        String(args.endTime));
    if (args.value          !== undefined) el.setAttribute('value',           String(args.value));
    if (args.disabledRanges !== undefined) el.setAttribute('disabled-ranges', String(args.disabledRanges));
    if (args.format         !== undefined) el.setAttribute('format',          String(args.format));
    if (args.multiple)  el.toggleAttribute('multiple',  true);
    if (args.readonly)  el.toggleAttribute('readonly',  true);
    if (args.disabled)  el.toggleAttribute('disabled',  true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { granularity: 15, format: '24h', startTime: '08:00', endTime: '18:00' },
};

// h2: Default (full day, 15-min granularity, 24h)
export const DefaultFullDay: Story = {
  render: () => row(makePicker({ granularity: 15 })),
};

// h2: Granularity Values
export const GranularityValues: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1.5rem;flex-wrap:wrap;';
    for (const g of [15, 30, 60]) {
      const label = document.createElement('div');
      label.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;align-items:center;';
      const txt = document.createElement('span');
      txt.style.cssText = 'font-size:.7rem;color:#888;';
      txt.textContent = `${g}min`;
      label.appendChild(txt);
      label.appendChild(makePicker({ granularity: g, 'start-time': '09:00', 'end-time': '12:00' }));
      wrap.appendChild(label);
    }
    return wrap;
  },
};

// h2: Start/End Time Constraints
export const StartEndTimeConstraints: Story = {
  render: () => row(
    makePicker({ 'start-time': '09:00', 'end-time': '17:00', granularity: 30 }),
  ),
};

// h2: Format: 24h vs 12h
export const FormatComparison: Story = {
  render: () => row(
    makePicker({ format: '24h', 'start-time': '08:00', 'end-time': '12:00', granularity: 30 }),
    makePicker({ format: '12h', 'start-time': '08:00', 'end-time': '12:00', granularity: 30 }),
  ),
};

// h2: Multiple Selection
export const MultipleSelection: Story = {
  render: () => row(
    makePicker({ multiple: true, 'start-time': '08:00', 'end-time': '18:00', granularity: 30 }),
  ),
};

// h2: Disabled Ranges
export const DisabledRanges: Story = {
  render: () => row(
    makePicker({
      'start-time': '08:00',
      'end-time': '18:00',
      granularity: 30,
      'disabled-ranges': JSON.stringify([{ start: '12:00', end: '13:00' }]),
    }),
  ),
};

// h2: Pre-selected Value
export const PreSelectedValue: Story = {
  render: () => row(
    makePicker({
      'start-time': '08:00',
      'end-time': '18:00',
      granularity: 30,
      value: JSON.stringify([{ start: '10:00', end: '11:30' }]),
    }),
  ),
};

// h2: Boolean States
export const BooleanStates: Story = {
  render: () => row(
    makePicker({ disabled: true, 'start-time': '08:00', 'end-time': '12:00', granularity: 30 }),
    makePicker({ readonly: true, 'start-time': '08:00', 'end-time': '12:00', granularity: 30, value: JSON.stringify([{ start: '09:00', end: '10:00' }]) }),
  ),
};

// h2: Combination: 12h + multiple + disabled ranges + granularity 30
export const Combination12hMultipleDisabledRangesGranularity30: Story = {
  render: () => row(
    makePicker({
      format: '12h',
      multiple: true,
      granularity: 30,
      'start-time': '08:00',
      'end-time': '18:00',
      'disabled-ranges': JSON.stringify([{ start: '12:00', end: '13:00' }]),
    }),
  ),
};

// h2: Edge Cases
export const EdgeCases: Story = {
  render: () => row(
    makePicker({ granularity: 60, 'start-time': '00:00', 'end-time': '23:00' }),
    makePicker({ granularity: 15, 'start-time': '09:00', 'end-time': '09:45' }),
  ),
};

// h2: CSS Parts Styling
// Available parts: base, header, slots
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; padding: 1.5rem; font-family: sans-serif; }
      .parts-demo__section { display: flex; flex-direction: column; gap: 0.75rem; }
      .parts-demo__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 0.25rem; }

      /* Styled: teal data-viz theme */
      .parts-demo__teal snice-time-range-picker::part(base) {
        background: #0a1628;
        border: 1px solid #00bcd4;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,188,212,0.2);
        padding: 0.5rem;
      }
      .parts-demo__teal snice-time-range-picker::part(header) {
        background: linear-gradient(135deg, #006064, #00838f);
        color: #e0f7fa;
        border-radius: 8px 8px 0 0;
        padding: 0.5rem 1rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        border-bottom: 1px solid rgba(0,188,212,0.3);
      }
      .parts-demo__teal snice-time-range-picker::part(slots) {
        background: rgba(0,188,212,0.05);
        border-radius: 0 0 8px 8px;
        gap: 2px;
      }

      /* Styled: warm papaya */
      .parts-demo__papaya snice-time-range-picker::part(base) {
        background: #fff8f0;
        border: 2px solid #ff8f00;
        border-radius: 14px;
        box-shadow: 0 4px 16px rgba(255,143,0,0.15);
      }
      .parts-demo__papaya snice-time-range-picker::part(header) {
        background: linear-gradient(135deg, #ff6f00, #ffa000);
        color: #fff;
        border-radius: 10px 10px 0 0;
        padding: 0.5rem 1rem;
        font-weight: 700;
      }
      .parts-demo__papaya snice-time-range-picker::part(slots) {
        background: #fffde7;
        border-radius: 0 0 10px 10px;
        padding: 0.25rem;
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
    defaultSection.appendChild(makePicker({ 'start-time': '09:00', 'end-time': '17:00', granularity: 60 }));
    container.appendChild(defaultSection);

    // Teal section
    const tealSection = document.createElement('div');
    tealSection.className = 'parts-demo__section parts-demo__teal';
    const tealLabel = document.createElement('div');
    tealLabel.className = 'parts-demo__label';
    tealLabel.textContent = '::part(base/header/slots) — Teal data-viz';
    tealSection.appendChild(tealLabel);
    tealSection.appendChild(makePicker({ 'start-time': '09:00', 'end-time': '17:00', granularity: 60 }));
    container.appendChild(tealSection);

    // Papaya section
    const papayaSection = document.createElement('div');
    papayaSection.className = 'parts-demo__section parts-demo__papaya';
    const papayaLabel = document.createElement('div');
    papayaLabel.className = 'parts-demo__label';
    papayaLabel.textContent = '::part(base/header/slots) — Warm papaya';
    papayaSection.appendChild(papayaLabel);
    papayaSection.appendChild(makePicker({ 'start-time': '08:00', 'end-time': '12:00', granularity: 30 }));
    container.appendChild(papayaSection);

    return container;
  },
};
