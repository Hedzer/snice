import type { Meta, StoryObj } from '@storybook/html-vite';
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
  title: 'Countdown',
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

// h2: CSS Parts Styling
// Parts: base, segment, value, label, separator
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      /* snice-countdown exposes the following CSS parts:
         ::part(base)      — the root countdown container
         ::part(segment)   — each time segment wrapper (days/hrs/min/sec)
         ::part(value)     — the numeric value span inside each segment
         ::part(label)     — the unit label span inside each segment
         ::part(separator) — the colon separator between segments */
      .parts-demo .styled-cd::part(base) {
        background: #0f172a;
        border-radius: 12px;
        padding: 16px 20px;
        border: 1px solid #334155;
        display: inline-flex;
        gap: 4px;
      }
      .parts-demo .styled-cd::part(segment) {
        background: #1e293b;
        border-radius: 8px;
        padding: 8px 14px;
        border: 1px solid #475569;
        min-width: 56px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .parts-demo .styled-cd::part(value) {
        font-size: 2rem;
        font-weight: 900;
        color: #38bdf8;
        font-variant-numeric: tabular-nums;
        text-shadow: 0 0 12px #38bdf888;
      }
      .parts-demo .styled-cd::part(label) {
        font-size: .6rem;
        text-transform: uppercase;
        letter-spacing: .1em;
        color: #94a3b8;
        font-weight: 600;
      }
      .parts-demo .styled-cd::part(separator) {
        color: #38bdf8;
        font-size: 2rem;
        font-weight: 900;
        align-self: flex-start;
        padding-top: 8px;
        text-shadow: 0 0 8px #38bdf8;
      }
    `;

    const futureTarget = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000 + 42 * 60 * 1000 + 17000).toISOString();

    const wrap = document.createElement('div');
    wrap.className = 'parts-demo';
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';

    const lbl1 = document.createElement('p');
    lbl1.textContent = 'Default (no ::part() overrides)';
    lbl1.style.cssText = 'margin:0;font-size:.75rem;opacity:.6;';
    const defaultCd = makeCountdown({ format: 'dhms', variant: 'simple', target: futureTarget });

    const lbl2 = document.createElement('p');
    lbl2.textContent = 'Styled via ::part(base/segment/value/label/separator) — dark sci-fi theme';
    lbl2.style.cssText = 'margin:0;font-size:.75rem;opacity:.6;';
    const styledCd = makeCountdown({ format: 'dhms', variant: 'simple', target: futureTarget });
    styledCd.className = 'styled-cd';

    wrap.appendChild(style);
    wrap.appendChild(lbl1);
    wrap.appendChild(defaultCd);
    wrap.appendChild(lbl2);
    wrap.appendChild(styledCd);
    return wrap;
  },
};
