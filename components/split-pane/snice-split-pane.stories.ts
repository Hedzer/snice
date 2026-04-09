import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-split-pane';

type SplitPaneDirection = 'horizontal' | 'vertical';

type Args = {
  direction?: SplitPaneDirection;
  primarySize?: number;
  minPrimarySize?: number;
  minSecondarySize?: number;
  snapSize?: number;
  disabled?: boolean;
};

function makeSplitPane(attrs: Record<string, string | boolean>, primaryContent: string, secondaryContent: string, style = 'height:200px;width:100%;') {
  const pane = document.createElement('snice-split-pane');
  pane.style.cssText = style + 'border:1px solid var(--snice-color-border,#e2e2e2);border-radius:6px;overflow:hidden;';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) pane.toggleAttribute(k, true); }
    else pane.setAttribute(k, v);
  }
  const primary = document.createElement('div');
  primary.slot = 'primary';
  primary.style.cssText = 'padding:1rem;display:flex;align-items:center;justify-content:center;height:100%;color:var(--snice-color-text-secondary,#525252);font-size:.875rem;background:var(--snice-color-background-element,#fcfbf9);';
  primary.textContent = primaryContent;
  pane.appendChild(primary);

  const secondary = document.createElement('div');
  secondary.slot = 'secondary';
  secondary.style.cssText = 'padding:1rem;display:flex;align-items:center;justify-content:center;height:100%;color:var(--snice-color-text-secondary,#525252);font-size:.875rem;';
  secondary.textContent = secondaryContent;
  pane.appendChild(secondary);

  return pane;
}

const meta: Meta<Args> = {
  title: 'Layout/SplitPane',
  component: 'snice-split-pane',
  tags: ['autodocs'],
  argTypes: {
    direction:        { control: 'select', options: ['horizontal', 'vertical'] },
    primarySize:      { control: 'number' },
    minPrimarySize:   { control: 'number' },
    minSecondarySize: { control: 'number' },
    snapSize:         { control: 'number' },
    disabled:         { control: 'boolean' },
  },
  render: (args) => {
    const attrs: Record<string, string | boolean> = {
      direction: args.direction ?? 'horizontal',
    };
    if (args.primarySize      !== undefined) attrs['primary-size']      = String(args.primarySize);
    if (args.minPrimarySize   !== undefined) attrs['min-primary-size']  = String(args.minPrimarySize);
    if (args.minSecondarySize !== undefined) attrs['min-secondary-size']= String(args.minSecondarySize);
    if (args.snapSize         !== undefined) attrs['snap-size']         = String(args.snapSize);
    if (args.disabled) attrs['disabled'] = true;
    return makeSplitPane(attrs, 'Primary Pane', 'Secondary Pane');
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { direction: 'horizontal' } };

// h2: Direction: Horizontal (default)
export const DirectionHorizontal: Story = {
  render: () => makeSplitPane({ direction: 'horizontal' }, 'Primary Pane', 'Secondary Pane'),
};

// h2: Direction: Vertical
export const DirectionVertical: Story = {
  render: () => makeSplitPane({ direction: 'vertical' }, 'Primary (Top)', 'Secondary (Bottom)', 'height:300px;width:100%;'),
};

// h2: Custom Primary Size (30%)
export const CustomPrimarySize30: Story = {
  render: () => makeSplitPane({ direction: 'horizontal', 'primary-size': '30' }, '30%', '70%', 'height:150px;width:100%;'),
};

// h2: Custom Primary Size (70%)
export const CustomPrimarySize70: Story = {
  render: () => makeSplitPane({ direction: 'horizontal', 'primary-size': '70' }, '70%', '30%', 'height:150px;width:100%;'),
};

// h2: Min Primary Size (20%)
export const MinPrimarySize20: Story = {
  render: () => makeSplitPane({ direction: 'horizontal', 'min-primary-size': '20' }, 'Min 20%', 'Secondary', 'height:150px;width:100%;'),
};

// h2: Min Secondary Size (30%)
export const MinSecondarySize30: Story = {
  render: () => makeSplitPane({ direction: 'horizontal', 'min-secondary-size': '30' }, 'Primary', 'Min 30%', 'height:150px;width:100%;'),
};

// h2: Both Min Sizes (min-primary=25, min-secondary=25)
export const BothMinSizes: Story = {
  render: () => makeSplitPane({ direction: 'horizontal', 'min-primary-size': '25', 'min-secondary-size': '25' }, 'Min 25%', 'Min 25%', 'height:150px;width:100%;'),
};

// h2: Snap Size (10%)
export const SnapSize10: Story = {
  render: () => makeSplitPane({ direction: 'horizontal', 'snap-size': '10' }, 'Snaps to 10%', 'Secondary', 'height:150px;width:100%;'),
};

// h2: Snap Size (25%)
export const SnapSize25: Story = {
  render: () => makeSplitPane({ direction: 'horizontal', 'snap-size': '25' }, 'Snaps to 25%', 'Secondary', 'height:150px;width:100%;'),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => makeSplitPane({ direction: 'horizontal', disabled: true }, 'Disabled', 'Cannot resize', 'height:150px;width:100%;'),
};

// h2: Vertical + Disabled
export const VerticalDisabled: Story = {
  render: () => makeSplitPane({ direction: 'vertical', disabled: true }, 'Disabled', 'Cannot resize', 'height:250px;width:100%;'),
};

// h2: Nested Split Panes
export const NestedSplitPanes: Story = {
  render: () => {
    const outer = document.createElement('snice-split-pane');
    outer.setAttribute('direction', 'horizontal');
    outer.style.cssText = 'height:300px;width:100%;border:1px solid var(--snice-color-border,#e2e2e2);border-radius:6px;overflow:hidden;';

    const primaryWrap = document.createElement('div');
    primaryWrap.slot = 'primary';
    primaryWrap.style.height = '100%';

    const inner = document.createElement('snice-split-pane');
    inner.setAttribute('direction', 'vertical');
    inner.style.cssText = 'height:100%;border:none;border-radius:0;';

    const topLeft = document.createElement('div');
    topLeft.slot = 'primary';
    topLeft.style.cssText = 'padding:1rem;display:flex;align-items:center;justify-content:center;height:100%;color:var(--snice-color-text-secondary,#525252);font-size:.875rem;background:var(--snice-color-background-element,#fcfbf9);';
    topLeft.textContent = 'Top-Left';

    const bottomLeft = document.createElement('div');
    bottomLeft.slot = 'secondary';
    bottomLeft.style.cssText = 'padding:1rem;display:flex;align-items:center;justify-content:center;height:100%;color:var(--snice-color-text-secondary,#525252);font-size:.875rem;';
    bottomLeft.textContent = 'Bottom-Left';

    inner.appendChild(topLeft); inner.appendChild(bottomLeft);
    primaryWrap.appendChild(inner);

    const right = document.createElement('div');
    right.slot = 'secondary';
    right.style.cssText = 'padding:1rem;display:flex;align-items:center;justify-content:center;height:100%;color:var(--snice-color-text-secondary,#525252);font-size:.875rem;';
    right.textContent = 'Right';

    outer.appendChild(primaryWrap); outer.appendChild(right);
    return outer;
  },
};
