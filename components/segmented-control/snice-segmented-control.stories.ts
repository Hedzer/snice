import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-segmented-control';
import type { SegmentedControlSize, SegmentedControlOption } from './snice-segmented-control.types';

type Args = {
  size?: SegmentedControlSize;
  value?: string;
  disabled?: boolean;
};

const SIZES: SegmentedControlSize[] = ['small', 'medium', 'large'];

const VIEW_OPTS: SegmentedControlOption[] = [
  { value: 'day',   label: 'Day'   },
  { value: 'week',  label: 'Week'  },
  { value: 'month', label: 'Month' },
];

const TWO_OPTS: SegmentedControlOption[] = [
  { value: 'on',  label: 'On'  },
  { value: 'off', label: 'Off' },
];

const FOUR_OPTS: SegmentedControlOption[] = [
  { value: 'all',      label: 'All'      },
  { value: 'active',   label: 'Active'   },
  { value: 'draft',    label: 'Draft'    },
  { value: 'archived', label: 'Archived' },
];

const FIVE_OPTS: SegmentedControlOption[] = [
  { value: 'sun', label: 'Sun' },
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
];

function makeSC(options: SegmentedControlOption[], attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-segmented-control');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  (el as any).options = options;
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'SegmentedControl',
  component: 'snice-segmented-control',
  tags: ['autodocs'],
  argTypes: {
    size:     { control: 'select', options: SIZES },
    value:    { control: 'text' },
    disabled: { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-segmented-control');
    if (args.size  !== undefined) el.setAttribute('size',  String(args.size));
    if (args.value !== undefined) el.setAttribute('value', String(args.value));
    if (args.disabled) el.toggleAttribute('disabled', true);
    (el as any).options = VIEW_OPTS;
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { size: 'medium', value: 'day' },
};

// h2: All sizes
export const AllSizes: Story = {
  render: () => col(
    makeSC(VIEW_OPTS, { size: 'small',  value: 'day' }),
    makeSC(VIEW_OPTS, { size: 'medium', value: 'day' }),
    makeSC(VIEW_OPTS, { size: 'large',  value: 'day' }),
  ),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => makeSC(VIEW_OPTS, { disabled: true, value: 'week' }),
};

// h2: Individual option disabled
export const IndividualOptionDisabled: Story = {
  render: () => makeSC([
    { value: 'day',   label: 'Day'   },
    { value: 'week',  label: 'Week',  disabled: true },
    { value: 'month', label: 'Month' },
  ], { value: 'day' }),
};

// h2: Two options
export const TwoOptions: Story = {
  render: () => makeSC(TWO_OPTS, { value: 'on' }),
};

// h2: Three options
export const ThreeOptions: Story = {
  render: () => makeSC(VIEW_OPTS, { value: 'week' }),
};

// h2: Four options
export const FourOptions: Story = {
  render: () => makeSC(FOUR_OPTS, { value: 'active' }),
};

// h2: Five options
export const FiveOptions: Story = {
  render: () => makeSC(FIVE_OPTS, { value: 'wed' }),
};

// h2: Pre-selected value
export const PreselectedValue: Story = {
  render: () => makeSC(VIEW_OPTS, { value: 'month' }),
};

// h2: Long labels
export const LongLabels: Story = {
  render: () => makeSC([
    { value: 'all',     label: 'All Items'       },
    { value: 'active',  label: 'Currently Active' },
    { value: 'archive', label: 'Archived Items'   },
  ], { value: 'all' }),
};

// h2: Short labels
export const ShortLabels: Story = {
  render: () => makeSC([
    { value: 'h', label: 'H' },
    { value: 'd', label: 'D' },
    { value: 'w', label: 'W' },
    { value: 'm', label: 'M' },
  ], { value: 'd' }),
};

// h2: Size x Option count matrix
export const SizeXOptionCountMatrix: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:.75rem;';

    const combos: [SegmentedControlSize, SegmentedControlOption[]][] = [
      ['small',  TWO_OPTS   ],
      ['small',  VIEW_OPTS  ],
      ['medium', TWO_OPTS   ],
      ['medium', VIEW_OPTS  ],
      ['large',  TWO_OPTS   ],
      ['large',  VIEW_OPTS  ],
    ];

    for (const [size, opts] of combos) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:.75rem;align-items:center;';
      row.appendChild(makeSC(opts, { size, value: opts[0].value }));
      const lbl = document.createElement('span');
      lbl.style.cssText = 'font-size:.7rem;color:#888;';
      lbl.textContent = `${size} / ${opts.length} opts`;
      row.appendChild(lbl);
      wrap.appendChild(row);
    }
    return wrap;
  },
};

export const AllVariants: Story = {
  render: () => col(
    makeSC(VIEW_OPTS, { value: 'day' }),
    makeSC(VIEW_OPTS, { value: 'day', disabled: true }),
    makeSC([
      { value: 'day',  label: 'Day'  },
      { value: 'week', label: 'Week', disabled: true },
      { value: 'month',label: 'Month' },
    ], { value: 'day' }),
    makeSC(FOUR_OPTS, { value: 'active' }),
  ),
};

// Available CSS Parts: base, indicator, segment
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const defaultSection = document.createElement('div');
    const defaultLabel = document.createElement('h3');
    defaultLabel.textContent = 'Default';
    defaultLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    defaultSection.appendChild(defaultLabel);
    defaultSection.appendChild(col(
      makeSC(VIEW_OPTS, { value: 'day' }),
      makeSC(FOUR_OPTS, { value: 'active' }),
    ));
    wrap.appendChild(defaultSection);

    const styledSection = document.createElement('div');
    styledSection.className = 'parts-demo-segmented';
    const styledLabel = document.createElement('h3');
    styledLabel.textContent = 'Styled with ::part()';
    styledLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    styledSection.appendChild(styledLabel);

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-segmented snice-segmented-control::part(base) {
        background: #0c0a1e;
        border: 2px solid #4f46e5;
        border-radius: 14px;
        box-shadow: 0 4px 20px rgba(79, 70, 229, 0.35);
        padding: 3px;
        gap: 2px;
      }
      .parts-demo-segmented snice-segmented-control::part(indicator) {
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        border-radius: 10px;
        box-shadow: 0 2px 12px rgba(79, 70, 229, 0.6);
      }
      .parts-demo-segmented snice-segmented-control::part(segment) {
        color: #6366f1;
        font-weight: 600;
        font-size: 0.82rem;
        letter-spacing: 0.04em;
        border-radius: 10px;
        padding: 0.35rem 1rem;
        transition: color 0.2s;
      }
      .parts-demo-segmented snice-segmented-control [aria-selected="true"]::part(segment) {
        color: #ffffff;
        text-shadow: 0 1px 3px rgba(0,0,0,0.3);
      }
    `;
    styledSection.appendChild(style);

    styledSection.appendChild(col(
      makeSC(VIEW_OPTS, { value: 'week' }),
      makeSC(FOUR_OPTS, { value: 'draft' }),
    ));
    wrap.appendChild(styledSection);

    return wrap;
  },
};
