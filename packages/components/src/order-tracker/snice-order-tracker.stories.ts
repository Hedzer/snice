import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-order-tracker';

const standardSteps = [
  { label: 'Ordered', status: 'completed', timestamp: 'Feb 20, 2026' },
  { label: 'Confirmed', status: 'completed', timestamp: 'Feb 20, 2026' },
  { label: 'Shipped', status: 'active', timestamp: 'Feb 22, 2026' },
  { label: 'Out for Delivery', status: 'pending' },
  { label: 'Delivered', status: 'pending' },
];

type Args = {
  variant?: string;
  trackingNumber?: string;
  carrier?: string;
};

const meta: Meta<Args> = {
  title: 'OrderTracker',
  component: 'snice-order-tracker',
  tags: ['autodocs'],
  argTypes: {
    variant:        { control: 'select', options: ['horizontal', 'vertical'] },
    trackingNumber: { control: 'text' },
    carrier:        { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', args.variant ?? 'horizontal');
    if (args.trackingNumber) el.setAttribute('tracking-number', args.trackingNumber);
    if (args.carrier) el.setAttribute('carrier', args.carrier);
    (el as any).steps = standardSteps;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:700px;';
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { variant: 'horizontal' },
};

// h2: Variant: horizontal (default)
export const VariantHorizontal: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'horizontal');
    (el as any).steps = standardSteps;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:700px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Variant: vertical
export const VariantVertical: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'vertical');
    (el as any).steps = standardSteps;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:400px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Step status: all completed
export const StepStatusAllCompleted: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'horizontal');
    (el as any).steps = standardSteps.map(s => ({ ...s, status: 'completed', timestamp: 'Feb 25, 2026' }));
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:700px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Step status: all pending
export const StepStatusAllPending: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'horizontal');
    (el as any).steps = standardSteps.map(s => ({ ...s, status: 'pending', timestamp: undefined }));
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:700px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Step status: mixed (completed, active, pending)
export const StepStatusMixed: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'horizontal');
    (el as any).steps = standardSteps;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:700px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Step status: first active
export const StepStatusFirstActive: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'horizontal');
    (el as any).steps = standardSteps.map((s, i) => ({ ...s, status: i === 0 ? 'active' : 'pending', timestamp: i === 0 ? 'Feb 20, 2026' : undefined }));
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:700px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Step status: last active
export const StepStatusLastActive: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'horizontal');
    (el as any).steps = standardSteps.map((s, i) => ({
      ...s,
      status: i < standardSteps.length - 1 ? 'completed' : 'active',
      timestamp: `Feb ${20 + i}, 2026`,
    }));
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:700px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: With tracking number
export const WithTrackingNumber: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'horizontal');
    el.setAttribute('tracking-number', '1Z999AA10123456784');
    (el as any).steps = standardSteps;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:700px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: With carrier
export const WithCarrier: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'horizontal');
    el.setAttribute('carrier', 'UPS');
    (el as any).steps = standardSteps;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:700px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: With tracking number + carrier
export const WithTrackingNumberCarrier: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'horizontal');
    el.setAttribute('tracking-number', '1Z999AA10123456784');
    el.setAttribute('carrier', 'UPS');
    (el as any).steps = standardSteps;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:700px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Vertical + tracking info
export const VerticalTrackingInfo: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'vertical');
    el.setAttribute('tracking-number', '9400111899562834567890');
    el.setAttribute('carrier', 'USPS');
    (el as any).steps = standardSteps;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:400px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: With timestamps
export const WithTimestamps: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'horizontal');
    (el as any).steps = standardSteps;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:700px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: With descriptions
export const WithDescriptions: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'vertical');
    (el as any).steps = [
      { label: 'Order Placed', status: 'completed', timestamp: 'Feb 20, 2026', description: 'Your order has been received and confirmed.' },
      { label: 'Processing', status: 'completed', timestamp: 'Feb 21, 2026', description: 'Items picked and packed at warehouse.' },
      { label: 'Shipped', status: 'active', timestamp: 'Feb 22, 2026', description: 'Package left the warehouse via FedEx Ground.' },
      { label: 'In Transit', status: 'pending', description: 'Package is on its way to your area.' },
      { label: 'Delivered', status: 'pending', description: 'Package will be left at your door.' },
    ];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:400px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: With timestamps + descriptions
export const WithTimestampsDescriptions: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'vertical');
    el.setAttribute('tracking-number', 'FEDEX-123456');
    el.setAttribute('carrier', 'FedEx');
    (el as any).steps = [
      { label: 'Order Placed', status: 'completed', timestamp: 'Feb 20, 2026', description: 'Your order has been received and confirmed.' },
      { label: 'Processing', status: 'completed', timestamp: 'Feb 21, 2026', description: 'Items picked and packed at warehouse.' },
      { label: 'Shipped', status: 'active', timestamp: 'Feb 22, 2026', description: 'Package left the warehouse via FedEx Ground.' },
      { label: 'In Transit', status: 'pending', description: 'Package is on its way to your area.' },
      { label: 'Delivered', status: 'pending', description: 'Package will be left at your door.' },
    ];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:400px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Two steps
export const TwoSteps: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'horizontal');
    (el as any).steps = [
      { label: 'Start', status: 'completed' },
      { label: 'End', status: 'active' },
    ];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:700px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Single step
export const SingleStep: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'horizontal');
    (el as any).steps = [{ label: 'Processing', status: 'active' }];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:700px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Many steps (7)
export const ManySteps7: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'horizontal');
    (el as any).steps = [
      { label: 'Order Placed', status: 'completed' },
      { label: 'Payment Confirmed', status: 'completed' },
      { label: 'Processing', status: 'completed' },
      { label: 'Quality Check', status: 'completed' },
      { label: 'Shipped', status: 'active' },
      { label: 'In Transit', status: 'pending' },
      { label: 'Delivered', status: 'pending' },
    ];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:700px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Many steps vertical
export const ManyStepsVertical: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'vertical');
    (el as any).steps = [
      { label: 'Order Placed', status: 'completed' },
      { label: 'Payment Confirmed', status: 'completed' },
      { label: 'Processing', status: 'completed' },
      { label: 'Quality Check', status: 'completed' },
      { label: 'Shipped', status: 'active' },
      { label: 'In Transit', status: 'pending' },
      { label: 'Delivered', status: 'pending' },
    ];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:400px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Empty (no steps)
export const EmptyNoSteps: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'horizontal');
    (el as any).steps = [];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:700px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: No tracking info (steps only)
export const NoTrackingInfoStepsOnly: Story = {
  render: () => {
    const el = document.createElement('snice-order-tracker');
    el.setAttribute('variant', 'horizontal');
    (el as any).steps = standardSteps;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:700px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// CSS Parts: base, steps, step, step-indicator, step-content, info
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; gap: 2rem; flex-direction: column; }
      .parts-demo .label { font: 700 11px/1 sans-serif; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }

      .parts-demo .styled::part(base) { background: #1a1a2e; border: 2px solid #4ade80; border-radius: 12px; padding: 1.5rem; }
      .parts-demo .styled::part(info) { color: #4ade80; font-weight: 700; margin-bottom: 1rem; font-size: 1rem; }
      .parts-demo .styled::part(steps) { gap: 0; }
      .parts-demo .styled::part(step) { color: #f5f5f5; }
      .parts-demo .styled::part(step-indicator) { background: #0f3460; border: 2px solid #4ade80; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: 900; }
      .parts-demo .styled::part(step-content) { padding-left: 0.75rem; }
    `;

    const STEPS = [
      { label: 'Order Placed', status: 'completed', timestamp: '2026-04-01 09:00', description: 'Your order has been confirmed.' },
      { label: 'Processing', status: 'completed', timestamp: '2026-04-01 11:30' },
      { label: 'Shipped', status: 'active', timestamp: '2026-04-02 08:00', description: 'Package in transit via FedEx.' },
      { label: 'Out for Delivery', status: 'pending' },
      { label: 'Delivered', status: 'pending' },
    ];

    const makeTracker = (cls: string) => {
      const el = document.createElement('snice-order-tracker');
      if (cls) el.classList.add(cls);
      el.setAttribute('tracking-number', 'TRK-2026-88321');
      el.setAttribute('carrier', 'FedEx');
      (el as any).steps = STEPS;
      el.style.cssText = 'display:block;max-width:480px;';
      return el;
    };

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-demo');

    const col1 = document.createElement('div');
    const lbl1 = document.createElement('div'); lbl1.className = 'label'; lbl1.textContent = 'Default';
    col1.appendChild(lbl1); col1.appendChild(makeTracker(''));

    const col2 = document.createElement('div');
    const lbl2 = document.createElement('div'); lbl2.className = 'label'; lbl2.textContent = 'Styled via ::part()';
    col2.appendChild(lbl2); col2.appendChild(makeTracker('styled'));

    wrap.appendChild(col1);
    wrap.appendChild(col2);
    return wrap;
  },
};
