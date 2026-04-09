import type { Meta, StoryObj } from '@storybook/web-components-vite';
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
