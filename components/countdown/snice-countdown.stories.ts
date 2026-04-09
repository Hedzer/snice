import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-countdown';
import type { CountdownFormat, CountdownVariant } from './snice-countdown.types';

type Args = {
  target?: string;
  format?: CountdownFormat;
  variant?: CountdownVariant;
};

const FORMATS: CountdownFormat[] = ['dhms', 'hms', 'ms'];
const VARIANTS: CountdownVariant[] = ['simple', 'flip', 'circular'];

// Fixed future target ~45 days ahead (static for stories)
const FUTURE_TARGET = new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString();
// Past target for completed state
const PAST_TARGET = new Date(Date.now() - 60000).toISOString();
// Next New Year
const NEXT_NEW_YEAR = (() => {
  const now = new Date();
  return new Date(now.getFullYear() + 1, 0, 1).toISOString();
})();

function makeCountdown(attrs: Record<string, string> = {}) {
  const el = document.createElement('snice-countdown');
  if (!attrs.target) el.setAttribute('target', FUTURE_TARGET);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:2rem;flex-wrap:wrap;align-items:center;justify-content:center;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1.5rem;align-items:center;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Feedback/Countdown',
  component: 'snice-countdown',
  tags: ['autodocs'],
  argTypes: {
    target:  { control: 'text' },
    format:  { control: 'select', options: FORMATS },
    variant: { control: 'select', options: VARIANTS },
  },
  render: (args) => {
    const el = document.createElement('snice-countdown');
    el.setAttribute('target', args.target ?? FUTURE_TARGET);
    if (args.format  !== undefined) el.setAttribute('format',  String(args.format));
    if (args.variant !== undefined) el.setAttribute('variant', String(args.variant));
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;justify-content:center;padding:1rem;';
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { target: FUTURE_TARGET, format: 'dhms', variant: 'simple' },
};

// h2: format="dhms" (Days, Hours, Min, Sec)
export const FormatDhms: Story = {
  render: () => row(makeCountdown({ format: 'dhms', variant: 'simple', target: FUTURE_TARGET })),
};

// h2: format="hms" (Hours, Min, Sec)
export const FormatHms: Story = {
  render: () => row(makeCountdown({ format: 'hms', variant: 'simple', target: FUTURE_TARGET })),
};

// h2: format="ms" (Min, Sec)
export const FormatMs: Story = {
  render: () => row(makeCountdown({ format: 'ms', variant: 'simple', target: FUTURE_TARGET })),
};

// h2: variant="simple" (default)
export const VariantSimple: Story = {
  render: () => row(makeCountdown({ variant: 'simple', format: 'dhms', target: FUTURE_TARGET })),
};

// h2: variant="flip"
export const VariantFlip: Story = {
  render: () => row(makeCountdown({ variant: 'flip', format: 'dhms', target: FUTURE_TARGET })),
};

// h2: variant="circular"
export const VariantCircular: Story = {
  render: () => row(makeCountdown({ variant: 'circular', format: 'hms', target: FUTURE_TARGET })),
};

// h2: variant="flip" x format="dhms"
export const VariantFlipXFormatDhms: Story = {
  render: () => row(makeCountdown({ variant: 'flip', format: 'dhms', target: FUTURE_TARGET })),
};

// h2: variant="flip" x format="ms"
export const VariantFlipXFormatMs: Story = {
  render: () => row(makeCountdown({ variant: 'flip', format: 'ms', target: FUTURE_TARGET })),
};

// h2: variant="circular" x format="dhms"
export const VariantCircularXFormatDhms: Story = {
  render: () => row(makeCountdown({ variant: 'circular', format: 'dhms', target: FUTURE_TARGET })),
};

// h2: variant="circular" x format="hms"
export const VariantCircularXFormatHms: Story = {
  render: () => row(makeCountdown({ variant: 'circular', format: 'hms', target: FUTURE_TARGET })),
};

// h2: Completed (past target)
export const Completed: Story = {
  render: () => col(
    makeCountdown({ variant: 'simple', format: 'dhms', target: PAST_TARGET }),
    makeCountdown({ variant: 'flip',   format: 'dhms', target: PAST_TARGET }),
  ),
};

// h2: 10-second countdown (will complete)
export const TenSecondCountdown: Story = {
  render: () => {
    const target = new Date(Date.now() + 10000).toISOString();
    return row(makeCountdown({ format: 'ms', variant: 'simple', target }));
  },
};

// h2: Long-term: next New Year
export const LongTermNextNewYear: Story = {
  render: () => row(makeCountdown({ format: 'dhms', variant: 'flip', target: NEXT_NEW_YEAR })),
};
