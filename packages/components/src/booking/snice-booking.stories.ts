import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-booking';

// Fixed base date so stories are deterministic
const BASE = new Date('2026-04-20');
const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dates = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(BASE);
  d.setDate(BASE.getDate() + i);
  return fmt(d);
});
const makeSlots = (dateStr: string, times: string[], duration = 30) =>
  times.map(t => ({ date: dateStr, time: t, duration }));
const basicSlots = dates.slice(0, 7).flatMap(d =>
  makeSlots(d, ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'])
);

type Args = {
  variant?: string;
  duration?: number;
};

const meta: Meta<Args> = {
  title: 'Booking',
  component: 'snice-booking',
  tags: ['autodocs'],
  argTypes: {
    variant:  { control: 'select', options: ['stepper', 'inline'] },
    duration: { control: 'number' },
  },
  render: (args) => {
    const el = document.createElement('snice-booking');
    if (args.variant) el.setAttribute('variant', args.variant);
    if (args.duration !== undefined) el.setAttribute('duration', String(args.duration));
    (el as any).availableDates = dates.slice(0, 7);
    (el as any).availableSlots = basicSlots;
    el.style.cssText = 'max-width:500px;display:block;';
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { variant: 'stepper' },
};

// h2: Variant: stepper (default)
export const VariantStepper: Story = {
  render: () => {
    const el = document.createElement('snice-booking');
    el.setAttribute('variant', 'stepper');
    (el as any).availableDates = dates.slice(0, 7);
    (el as any).availableSlots = basicSlots;
    el.style.cssText = 'max-width:500px;display:block;';
    return el;
  },
};

// h2: Variant: inline
export const VariantInline: Story = {
  render: () => {
    const el = document.createElement('snice-booking');
    el.setAttribute('variant', 'inline');
    (el as any).availableDates = dates.slice(0, 7);
    (el as any).availableSlots = basicSlots;
    el.style.cssText = 'max-width:500px;display:block;';
    return el;
  },
};

// h2: Both variants side by side
export const BothVariantsSideBySide: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;';
    for (const variant of ['stepper', 'inline'] as const) {
      const el = document.createElement('snice-booking');
      el.setAttribute('variant', variant);
      (el as any).availableDates = dates.slice(0, 5);
      (el as any).availableSlots = basicSlots.slice(0, 12);
      wrap.appendChild(el);
    }
    return wrap;
  },
};

// h2: With custom fields
export const WithCustomFields: Story = {
  render: () => {
    const el = document.createElement('snice-booking');
    el.setAttribute('variant', 'stepper');
    (el as any).availableDates = dates.slice(0, 7);
    (el as any).availableSlots = basicSlots;
    (el as any).fields = [
      { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'john@example.com' },
      { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 555-0123' },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any special requirements?' },
    ];
    el.style.cssText = 'max-width:500px;display:block;';
    return el;
  },
};

// h2: With duration=60
export const WithDuration60: Story = {
  render: () => {
    const el = document.createElement('snice-booking');
    el.setAttribute('variant', 'stepper');
    el.setAttribute('duration', '60');
    (el as any).availableDates = dates.slice(0, 5);
    const hourSlots = dates.slice(0, 5).flatMap(d =>
      makeSlots(d, ['09:00', '10:00', '11:00', '13:00', '14:00'], 60)
    );
    (el as any).availableSlots = hourSlots;
    el.style.cssText = 'max-width:500px;display:block;';
    return el;
  },
};

// h2: No available slots (empty)
export const NoAvailableSlotsEmpty: Story = {
  render: () => {
    const el = document.createElement('snice-booking');
    el.setAttribute('variant', 'stepper');
    (el as any).availableDates = [];
    (el as any).availableSlots = [];
    el.style.cssText = 'max-width:500px;display:block;';
    return el;
  },
};

// h2: Many time slots
export const ManyTimeSlots: Story = {
  render: () => {
    const el = document.createElement('snice-booking');
    el.setAttribute('variant', 'inline');
    (el as any).availableDates = dates;
    const manySlots = dates.flatMap(d => {
      const times: string[] = [];
      for (let h = 8; h < 18; h++) {
        times.push(`${String(h).padStart(2, '0')}:00`);
        times.push(`${String(h).padStart(2, '0')}:30`);
      }
      return makeSlots(d, times);
    });
    (el as any).availableSlots = manySlots;
    el.style.cssText = 'max-width:500px;display:block;';
    return el;
  },
};

// CSS Parts: none — snice-booking does not expose shadow parts.
// Host-level styling is applied directly to the element.
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; }
      .parts-demo .label { font: 700 11px/1 sans-serif; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
      /* snice-booking has no exposed ::part() selectors.
         Style the host element directly using CSS custom properties or class-based selectors. */
      .parts-demo .styled { --color-primary: #7c3aed; border: 2px solid #7c3aed; border-radius: 12px; overflow: hidden; }
    `;

    const BASE = new Date('2026-04-20');
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const dates = Array.from({ length: 7 }, (_, i) => { const d = new Date(BASE); d.setDate(BASE.getDate() + i); return fmt(d); });
    const slots = dates.flatMap(d =>
      ['09:00', '10:00', '11:00', '14:00', '15:00'].map(t => ({ date: d, time: t, duration: 30 }))
    );

    const makeBooking = (cls: string) => {
      const el = document.createElement('snice-booking');
      if (cls) el.classList.add(cls);
      (el as any).availableDates = dates;
      (el as any).availableSlots = slots;
      el.style.cssText = 'display:block;max-width:420px;';
      return el;
    };

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-demo');

    const col1 = document.createElement('div');
    const lbl1 = document.createElement('div'); lbl1.className = 'label'; lbl1.textContent = 'Default';
    col1.appendChild(lbl1); col1.appendChild(makeBooking(''));

    const col2 = document.createElement('div');
    const lbl2 = document.createElement('div'); lbl2.className = 'label'; lbl2.textContent = 'Host Styled (no ::part() available)';
    col2.appendChild(lbl2); col2.appendChild(makeBooking('styled'));

    wrap.appendChild(col1);
    wrap.appendChild(col2);
    return wrap;
  },
};
