import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-availability';

const BUSINESS_HOURS = Array.from({ length: 5 }, (_, day) => ({ day, start: '09:00', end: '17:00' }));
const MIXED_HOURS = [
  { day: 0, start: '09:00', end: '12:00' },
  { day: 0, start: '13:00', end: '17:00' },
  { day: 1, start: '09:00', end: '17:00' },
  { day: 2, start: '10:00', end: '16:00' },
  { day: 3, start: '09:00', end: '17:00' },
  { day: 4, start: '09:00', end: '15:00' },
];

type Args = {
  format?: string;
  granularity?: number;
  startHour?: number;
  endHour?: number;
  readonly?: boolean;
};

const meta: Meta<Args> = {
  title: 'Availability',
  component: 'snice-availability',
  tags: ['autodocs'],
  argTypes: {
    format:      { control: 'select', options: ['12h', '24h'] },
    granularity: { control: 'number' },
    startHour:   { control: 'number' },
    endHour:     { control: 'number' },
    readonly:    { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-availability');
    if (args.format) el.setAttribute('format', args.format);
    if (args.granularity !== undefined) el.setAttribute('granularity', String(args.granularity));
    if (args.startHour !== undefined) el.setAttribute('start-hour', String(args.startHour));
    if (args.endHour !== undefined) el.setAttribute('end-hour', String(args.endHour));
    if (args.readonly) el.toggleAttribute('readonly', true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: {},
};

// h2: Default (24h range, 60min granularity, 12h format)
export const DefaultConfig: Story = {
  render: () => document.createElement('snice-availability'),
};

// h2: Format: 24h
export const Format24h: Story = {
  render: () => {
    const el = document.createElement('snice-availability');
    el.setAttribute('format', '24h');
    return el;
  },
};

// h2: Format: 12h vs 24h side by side
export const Format12hVs24hSideBySide: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;';
    for (const format of ['12h', '24h']) {
      const el = document.createElement('snice-availability');
      el.setAttribute('format', format);
      el.setAttribute('start-hour', '8');
      el.setAttribute('end-hour', '18');
      wrap.appendChild(el);
    }
    return wrap;
  },
};

// h2: Granularity: 30 minutes
export const Granularity30Minutes: Story = {
  render: () => {
    const el = document.createElement('snice-availability');
    el.setAttribute('granularity', '30');
    el.setAttribute('start-hour', '9');
    el.setAttribute('end-hour', '17');
    return el;
  },
};

// h2: Granularity: 15 minutes
export const Granularity15Minutes: Story = {
  render: () => {
    const el = document.createElement('snice-availability');
    el.setAttribute('granularity', '15');
    el.setAttribute('start-hour', '9');
    el.setAttribute('end-hour', '12');
    return el;
  },
};

// h2: Custom hour range: start-hour=8, end-hour=18
export const CustomHourRange8To18: Story = {
  render: () => {
    const el = document.createElement('snice-availability');
    el.setAttribute('start-hour', '8');
    el.setAttribute('end-hour', '18');
    return el;
  },
};

// h2: Narrow range: start-hour=12, end-hour=14
export const NarrowRange12To14: Story = {
  render: () => {
    const el = document.createElement('snice-availability');
    el.setAttribute('start-hour', '12');
    el.setAttribute('end-hour', '14');
    el.setAttribute('granularity', '30');
    return el;
  },
};

// h2: Readonly
export const Readonly: Story = {
  render: () => {
    const el = document.createElement('snice-availability');
    el.toggleAttribute('readonly', true);
    el.setAttribute('start-hour', '8');
    el.setAttribute('end-hour', '18');
    (el as any).value = BUSINESS_HOURS;
    return el;
  },
};

// h2: Pre-populated with business hours
export const PrePopulatedWithBusinessHours: Story = {
  render: () => {
    const el = document.createElement('snice-availability');
    el.setAttribute('start-hour', '6');
    el.setAttribute('end-hour', '22');
    (el as any).value = MIXED_HOURS;
    return el;
  },
};

// h2: Full day range (0-24)
export const FullDayRange024: Story = {
  render: () => {
    const el = document.createElement('snice-availability');
    el.setAttribute('start-hour', '0');
    el.setAttribute('end-hour', '24');
    return el;
  },
};

// CSS Parts: none — snice-availability does not expose shadow parts.
// Host-level styling is applied directly to the element.
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; }
      .parts-demo .label { font: 700 11px/1 sans-serif; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
      /* snice-availability has no exposed ::part() selectors.
         Style the host element directly or use CSS custom properties. */
      .parts-demo .styled { --color-primary: #10b981; border: 2px solid #10b981; border-radius: 12px; overflow: hidden; }
    `;

    const RANGES = Array.from({ length: 5 }, (_, day) => ({ day, start: '09:00', end: '17:00' }));

    const makeAvail = (cls: string) => {
      const el = document.createElement('snice-availability');
      if (cls) el.classList.add(cls);
      (el as any).value = RANGES;
      el.style.cssText = 'display:block;';
      return el;
    };

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-demo');

    const col1 = document.createElement('div');
    const lbl1 = document.createElement('div'); lbl1.className = 'label'; lbl1.textContent = 'Default';
    col1.appendChild(lbl1); col1.appendChild(makeAvail(''));

    const col2 = document.createElement('div');
    const lbl2 = document.createElement('div'); lbl2.className = 'label'; lbl2.textContent = 'Host Styled (no ::part() available)';
    col2.appendChild(lbl2); col2.appendChild(makeAvail('styled'));

    wrap.appendChild(col1);
    wrap.appendChild(col2);
    return wrap;
  },
};
