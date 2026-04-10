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
  title: 'Commerce/Booking',
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
