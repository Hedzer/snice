import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-timeline';

type Args = {
  position?: 'left' | 'right' | 'alternate';
  orientation?: 'vertical' | 'horizontal';
  reverse?: boolean;
};

const baseItems = [
  { timestamp: '2024-01-10', title: 'Project Created', description: 'Initial project setup and planning phase', variant: 'success' },
  { timestamp: '2024-02-15', title: 'Design Review', description: 'UI/UX designs reviewed and approved', variant: 'info' },
  { timestamp: '2024-03-20', title: 'Development Started', description: 'Sprint 1 begins', variant: 'default' },
  { timestamp: '2024-04-05', title: 'Bug Found', description: 'Critical performance issue detected', variant: 'error' },
  { timestamp: '2024-05-01', title: 'Deadline Warning', description: 'Scope adjustments needed', variant: 'warning' },
];

function makeTimeline(attrs: Record<string, string | boolean>, items = baseItems): HTMLElement {
  const tl = document.createElement('snice-timeline') as any;
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) tl.toggleAttribute(k, true); }
    else tl.setAttribute(k, String(v));
  }
  tl.items = items;
  return tl;
}

const meta: Meta<Args> = {
  title: 'Data/Timeline',
  component: 'snice-timeline',
  tags: ['autodocs'],
  argTypes: {
    position:    { control: 'select', options: ['left', 'right', 'alternate'] },
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
    reverse:     { control: 'boolean' },
  },
  render: (args) => {
    const tl = document.createElement('snice-timeline') as any;
    if (args.position !== undefined)    tl.setAttribute('position', args.position);
    if (args.orientation !== undefined) tl.setAttribute('orientation', args.orientation);
    if (args.reverse) tl.toggleAttribute('reverse', true);
    tl.items = baseItems;
    return tl;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { position: 'left' },
};

// h2: Position: left (default)
export const PositionLeftDefault: Story = {
  render: () => makeTimeline({ position: 'left' }),
};

// h2: Position: right
export const PositionRight: Story = {
  render: () => makeTimeline({ position: 'right' }),
};

// h2: Position: alternate
export const PositionAlternate: Story = {
  render: () => makeTimeline({ position: 'alternate' }),
};

// h2: Orientation: horizontal
export const OrientationHorizontal: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.overflowX = 'auto';
    wrap.appendChild(makeTimeline({ orientation: 'horizontal' }));
    return wrap;
  },
};

// h2: Horizontal + Right
export const HorizontalRight: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.overflowX = 'auto';
    wrap.appendChild(makeTimeline({ orientation: 'horizontal', position: 'right' }));
    return wrap;
  },
};

// h2: Horizontal + Alternate
export const HorizontalAlternate: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.overflowX = 'auto';
    wrap.appendChild(makeTimeline({ orientation: 'horizontal', position: 'alternate' }));
    return wrap;
  },
};

// h2: Reverse Order
export const ReverseOrder: Story = {
  render: () => makeTimeline({ reverse: true }),
};

// h2: Reverse + Alternate
export const ReverseAlternate: Story = {
  render: () => makeTimeline({ reverse: true, position: 'alternate' }),
};

// h2: All Variants
export const AllVariants: Story = {
  render: () => makeTimeline({}, [
    { title: 'Default variant', description: 'variant: default', variant: 'default' },
    { title: 'Success variant', description: 'variant: success', variant: 'success' },
    { title: 'Warning variant', description: 'variant: warning', variant: 'warning' },
    { title: 'Error variant', description: 'variant: error', variant: 'error' },
    { title: 'Info variant', description: 'variant: info', variant: 'info' },
  ]),
};

// h2: Custom Emoji Icons
export const CustomEmojiIcons: Story = {
  render: () => makeTimeline({}, [
    { title: 'Rocket Launch', description: 'Deployed to production', icon: '🚀', variant: 'success' },
    { title: 'Code Review', description: 'Pull request reviewed', icon: '📋', variant: 'info' },
    { title: 'Bug Fix', description: 'Fixed memory leak', icon: '🐛', variant: 'error' },
    { title: 'Meeting', description: 'Sprint planning', icon: '📅', variant: 'default' },
    { title: 'Celebration', description: 'Milestone reached', icon: '🎉', variant: 'success' },
    { title: 'Warning Sign', description: 'Approaching limit', icon: '⚠️', variant: 'warning' },
  ]),
};

// h2: Minimal (title only)
export const MinimalTitleOnly: Story = {
  render: () => makeTimeline({}, [
    { title: 'Step 1' },
    { title: 'Step 2' },
    { title: 'Step 3' },
    { title: 'Step 4' },
  ]),
};

// h2: Single Item
export const SingleItem: Story = {
  render: () => makeTimeline({}, [
    { timestamp: '2024-01-01', title: 'Single Event', description: 'The only item', variant: 'info' },
  ]),
};

// h2: Many Items (12)
export const ManyItems12: Story = {
  render: () => makeTimeline({}, Array.from({ length: 12 }, (_: unknown, i: number) => ({
    timestamp: `2024-${String(i + 1).padStart(2, '0')}-01`,
    title: `Event ${i + 1}`,
    description: `Description for event ${i + 1}`,
    variant: (['default', 'success', 'warning', 'error', 'info'] as const)[i % 5],
  }))),
};

// h2: Mixed: some with/without description and timestamp
export const MixedSomeWithWithoutDescriptionAndTimestamp: Story = {
  render: () => makeTimeline({}, [
    { timestamp: '9:00 AM', title: 'Started work', variant: 'default' },
    { timestamp: '10:30 AM', title: 'Team standup', description: 'Discussed sprint goals and blockers', variant: 'info' },
    { title: 'Lunch break' },
    { timestamp: '2:00 PM', title: 'Deploy v2.1', description: 'Pushed release to staging', variant: 'success' },
    { title: 'End of day' },
  ]),
};

// h2: Empty Items Array
export const EmptyItemsArray: Story = {
  render: () => makeTimeline({}, []),
};
