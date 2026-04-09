import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-org-chart';

type Args = {
  direction?: 'top-down' | 'left-right';
  compact?: boolean;
};

const fullData = {
  id: 'ceo', name: 'Sarah Johnson', title: 'CEO',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  children: [
    {
      id: 'cto', name: 'Michael Chen', title: 'CTO',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      children: [
        { id: 'dev1', name: 'Emily Davis', title: 'Dev Lead', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
          children: [
            { id: 'd1', name: 'Alex Smith', title: 'Engineer' },
            { id: 'd2', name: 'Jordan Lee', title: 'Engineer' },
          ],
        },
        { id: 'qa1', name: 'Riley Wilson', title: 'QA Lead' },
      ],
    },
    {
      id: 'cfo', name: 'David Martinez', title: 'CFO',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      children: [
        { id: 'acc1', name: 'Lisa Anderson', title: 'Accountant' },
      ],
    },
    { id: 'cmo', name: 'Jessica White', title: 'CMO' },
  ],
};

const noAvatarData = {
  id: 'r', name: 'Root Node', title: 'Director',
  children: [
    { id: 'a', name: 'Alice', title: 'Manager', children: [
      { id: 'a1', name: 'Bob', title: 'Engineer' },
      { id: 'a2', name: 'Carol', title: 'Designer' },
    ]},
    { id: 'b', name: 'Dan', title: 'Manager' },
  ],
};

const meta: Meta<Args> = {
  title: 'Specialty/OrgChart',
  component: 'snice-org-chart',
  tags: ['autodocs'],
  argTypes: {
    direction: { control: 'select', options: ['top-down', 'left-right'] },
    compact:   { control: 'boolean' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-org-chart');
    if (args.direction !== undefined) el.setAttribute('direction', args.direction);
    if (args.compact) el.toggleAttribute('compact', true);
    (el as any).data = fullData;
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { direction: 'top-down', compact: false } };

// h2: Direction: top-down (default)
export const DirectionTopDownDefault: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-org-chart');
    (el as any).data = fullData;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Direction: left-right
export const DirectionLeftRight: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-org-chart');
    el.setAttribute('direction', 'left-right');
    (el as any).data = fullData;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Compact: false (default)
export const CompactFalseDefault: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-org-chart');
    (el as any).data = fullData;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Compact: true
export const CompactTrue: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-org-chart');
    el.toggleAttribute('compact', true);
    (el as any).data = fullData;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Compact + left-right
export const CompactLeftRight: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-org-chart');
    el.setAttribute('direction', 'left-right');
    el.toggleAttribute('compact', true);
    (el as any).data = fullData;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: With avatars
export const WithAvatars: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-org-chart');
    (el as any).data = fullData;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Without avatars (initials)
export const WithoutAvatarsInitials: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-org-chart');
    (el as any).data = noAvatarData;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Nodes with title
export const NodesWithTitle: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-org-chart');
    (el as any).data = {
      id: '1', name: 'Jane Doe', title: 'VP of Engineering',
      children: [
        { id: '2', name: 'John Smith', title: 'Staff Engineer' },
        { id: '3', name: 'Mary Jones', title: 'Senior Engineer' },
      ],
    };
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Nodes without title
export const NodesWithoutTitle: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-org-chart');
    (el as any).data = {
      id: '1', name: 'Team Alpha',
      children: [
        { id: '2', name: 'Squad 1' },
        { id: '3', name: 'Squad 2' },
        { id: '4', name: 'Squad 3' },
      ],
    };
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Single node (no children)
export const SingleNodeNoChildren: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-org-chart');
    (el as any).data = { id: 'solo', name: 'Standalone Node', title: 'Only member' };
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Deep hierarchy (4 levels)
export const DeepHierarchy4Levels: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-org-chart');
    (el as any).data = {
      id: 'l0', name: 'Level 0', title: 'Root',
      children: [{
        id: 'l1', name: 'Level 1', title: 'Child',
        children: [{
          id: 'l2', name: 'Level 2', title: 'Grandchild',
          children: [{
            id: 'l3', name: 'Level 3', title: 'Great-grandchild',
            children: [
              { id: 'l4a', name: 'Level 4a', title: 'Leaf' },
              { id: 'l4b', name: 'Level 4b', title: 'Leaf' },
            ],
          }],
        }],
      }],
    };
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Wide hierarchy (many siblings)
export const WideHierarchyManySiblings: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-org-chart');
    (el as any).data = {
      id: 'boss', name: 'Manager', title: 'Team Lead',
      children: Array.from({ length: 8 }, (_, i) => ({
        id: `w${i}`, name: `Employee ${i + 1}`, title: `Role ${i + 1}`,
      })),
    };
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: No data
export const NoData: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-org-chart');
    wrap.appendChild(el);
    return wrap;
  },
};
