import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-stepper';
import './snice-stepper-panel';
import type { StepperOrientation, Step } from './snice-stepper.types';

type Args = {
  currentStep?: number;
  orientation?: StepperOrientation;
  clickable?: boolean;
};

const ORIENTATIONS: StepperOrientation[] = ['horizontal', 'vertical'];

const steps3: Step[] = [
  { label: 'Account' },
  { label: 'Profile' },
  { label: 'Complete' },
];

const stepsWithDesc: Step[] = [
  { label: 'Account', description: 'Create your account' },
  { label: 'Profile', description: 'Set up your profile' },
  { label: 'Complete', description: 'Review and finish' },
];

function makeStepper(steps: Step[], attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-stepper');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  (el as any).steps = steps;
  return el;
}

const meta: Meta<Args> = {
  title: 'Navigation/Stepper',
  component: 'snice-stepper',
  tags: ['autodocs'],
  argTypes: {
    currentStep:  { control: 'number' },
    orientation:  { control: 'select', options: ORIENTATIONS },
    clickable:    { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-stepper');
    if (args.orientation !== undefined) el.setAttribute('orientation', args.orientation);
    if (args.currentStep !== undefined) el.setAttribute('current-step', String(args.currentStep));
    if (args.clickable) el.toggleAttribute('clickable', true);
    (el as any).steps = steps3;
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { currentStep: 0, orientation: 'horizontal' },
};

// h2: Orientation: Horizontal (default)
export const OrientationHorizontal: Story = {
  render: () => makeStepper(steps3, { orientation: 'horizontal' }),
};

// h2: Orientation: Vertical
export const OrientationVertical: Story = {
  render: () => makeStepper(steps3, { orientation: 'vertical' }),
};

// h2: Current Step: 0 (First)
export const CurrentStep0: Story = {
  render: () => makeStepper(steps3, { 'current-step': '0' }),
};

// h2: Current Step: 1 (Middle)
export const CurrentStep1: Story = {
  render: () => makeStepper(steps3, { 'current-step': '1' }),
};

// h2: Current Step: 2 (Last)
export const CurrentStep2: Story = {
  render: () => makeStepper(steps3, { 'current-step': '2' }),
};

// h2: Clickable Steps
export const ClickableSteps: Story = {
  render: () => makeStepper(steps3, { clickable: true, 'current-step': '1' }),
};

// h2: With Descriptions
export const WithDescriptions: Story = {
  render: () => makeStepper(stepsWithDesc),
};

// h2: Explicit Statuses (pending, active, completed, error)
export const ExplicitStatuses: Story = {
  render: () => makeStepper([
    { label: 'Completed', status: 'completed' },
    { label: 'Active',    status: 'active' },
    { label: 'Error',     status: 'error' },
    { label: 'Pending',   status: 'pending' },
  ]),
};

// h2: All Completed
export const AllCompleted: Story = {
  render: () => makeStepper(steps3, { 'current-step': '3' }),
};

// h2: Two Steps
export const TwoSteps: Story = {
  render: () => makeStepper([{ label: 'Start' }, { label: 'Finish' }], { 'current-step': '0' }),
};

// h2: Many Steps
export const ManySteps: Story = {
  render: () => makeStepper(
    Array.from({ length: 6 }, (_, i) => ({ label: `Step ${i + 1}` })),
    { 'current-step': '3' },
  ),
};

// h2: Single Step
export const SingleStep: Story = {
  render: () => makeStepper([{ label: 'Only Step' }], { 'current-step': '0' }),
};

// h2: Vertical + Clickable
export const VerticalClickable: Story = {
  render: () => makeStepper(steps3, { orientation: 'vertical', clickable: true, 'current-step': '1' }),
};

// h2: Vertical + Descriptions
export const VerticalDescriptions: Story = {
  render: () => makeStepper(stepsWithDesc, { orientation: 'vertical' }),
};

// h2: With Error Status
export const WithErrorStatus: Story = {
  render: () => makeStepper([
    { label: 'Info',    status: 'completed' },
    { label: 'Payment', status: 'error', description: 'Payment failed' },
    { label: 'Confirm', status: 'pending' },
  ]),
};

// h2: With Panels
export const WithPanels: Story = {
  render: () => {
    const el = document.createElement('snice-stepper');
    el.setAttribute('current-step', '0');
    (el as any).steps = steps3;
    const panels = [
      'Panel 1: Enter your personal information.',
      'Panel 2: Set up your account details.',
      'Panel 3: Review and confirm.',
    ];
    for (const text of panels) {
      const panel = document.createElement('snice-stepper-panel');
      panel.textContent = text;
      el.appendChild(panel);
    }
    return el;
  },
};

// h2: CSS Parts Styling
// Parts: container, step, step-indicator, step-content, step-label,
//        step-description, step-connector, panels
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'parts-demo';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; font-family: sans-serif; }
      .parts-demo .label { font-size: .7rem; color: #888; margin-bottom: .25rem; }

      /* Styled: container */
      .parts-demo .styled-container::part(container) {
        background: #1e293b;
        border-radius: 12px;
        padding: 1rem 1.5rem;
      }

      /* Styled: step-indicator (the circle/number) */
      .parts-demo .styled-indicator::part(step-indicator) {
        background: #7c3aed;
        color: #fff;
        border-color: #7c3aed;
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        font-weight: 900;
        box-shadow: 0 0 0 3px rgba(124,58,237,.3);
      }

      /* Styled: step-label */
      .parts-demo .styled-label::part(step-label) {
        color: #f97316;
        font-weight: 700;
        font-size: 1em;
        letter-spacing: .04em;
        text-transform: uppercase;
      }

      /* Styled: step-description */
      .parts-demo .styled-desc::part(step-description) {
        color: #94a3b8;
        font-style: italic;
        font-size: .85em;
      }

      /* Styled: step-connector */
      .parts-demo .styled-connector::part(step-connector) {
        background: linear-gradient(90deg, #7c3aed, #2563eb);
        height: 3px;
        border-radius: 2px;
      }

      /* Styled: step (entire step wrapper) */
      .parts-demo .styled-step::part(step) {
        background: rgba(99,102,241,0.06);
        border-radius: 8px;
        padding: .5rem .75rem;
      }

      /* Styled: panels area */
      .parts-demo .styled-panels::part(panels) {
        background: rgba(251,191,36,0.08);
        border-radius: 8px;
        padding: .75rem;
        border-left: 3px solid #fbbf24;
      }

      /* Combined */
      .parts-demo .styled-all::part(container) { background: #0f172a; border-radius: 12px; padding: 1rem 1.5rem; }
      .parts-demo .styled-all::part(step-indicator) { background: #059669; border-color: #059669; color: #fff; font-weight: 700; }
      .parts-demo .styled-all::part(step-label) { color: #e2e8f0; font-weight: 600; }
      .parts-demo .styled-all::part(step-description) { color: #64748b; font-size: .8em; }
      .parts-demo .styled-all::part(step-connector) { background: #334155; height: 2px; }
    `;
    wrap.appendChild(style);

    function row(lbl: string, cls: string, st: Step[] = steps3, attrs: Record<string, string | boolean> = {}) {
      const d = document.createElement('div');
      const l = document.createElement('div');
      l.className = 'label';
      l.textContent = lbl;
      const el = makeStepper(st, { 'current-step': '1', ...attrs });
      if (cls) el.classList.add(cls);
      d.appendChild(l);
      d.appendChild(el);
      return d;
    }

    wrap.appendChild(row('Default (no ::part styles)', ''));
    wrap.appendChild(row('::part(container) — dark container', 'styled-container'));
    wrap.appendChild(row('::part(step-indicator) — purple glowing circles', 'styled-indicator'));
    wrap.appendChild(row('::part(step-label) — orange uppercase labels', 'styled-label'));
    wrap.appendChild(row('::part(step-description) — muted italic descriptions', 'styled-desc', stepsWithDesc));
    wrap.appendChild(row('::part(step-connector) — gradient connector line', 'styled-connector'));
    wrap.appendChild(row('::part(step) — tinted step wrapper', 'styled-step'));

    // Panels row
    const panelsD = document.createElement('div');
    const panelsL = document.createElement('div');
    panelsL.className = 'label';
    panelsL.textContent = '::part(panels) — amber left-border panel area';
    const elWithPanels = document.createElement('snice-stepper');
    elWithPanels.setAttribute('current-step', '1');
    elWithPanels.classList.add('styled-panels');
    (elWithPanels as any).steps = steps3;
    for (const t of ['Step 1 content here.', 'Step 2 content here.', 'Step 3 content here.']) {
      const p = document.createElement('snice-stepper-panel');
      p.textContent = t;
      elWithPanels.appendChild(p);
    }
    panelsD.appendChild(panelsL);
    panelsD.appendChild(elWithPanels);
    wrap.appendChild(panelsD);

    wrap.appendChild(row('Combined: container + indicator + label + description + connector', 'styled-all', stepsWithDesc));

    return wrap;
  },
};
