import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-kanban';

type Args = {
  allowDragDrop?: boolean;
  showCardCount?: boolean;
};

const basicColumns = [
  { id: 'todo', title: 'To Do', cards: [
    { id: 'c1', title: 'Research competitors', description: 'Analyze top 5 competitors.' },
    { id: 'c2', title: 'Write user stories', description: 'Document requirements.' },
  ]},
  { id: 'progress', title: 'In Progress', cards: [
    { id: 'c3', title: 'Design mockups', description: 'Create Figma prototypes.', assignee: 'Alice' },
  ]},
  { id: 'done', title: 'Done', cards: [
    { id: 'c4', title: 'Set up repository', description: 'Initialize Git repo and CI.' },
  ]},
];

const labelColumns = [
  { id: 'backlog', title: 'Backlog', color: '#6b7280', cards: [
    { id: 'l1', title: 'Implement auth', labels: ['Backend', 'Security'], assignee: 'Bob' },
    { id: 'l2', title: 'Add dark mode', labels: ['Frontend', 'UI'] },
  ]},
  { id: 'active', title: 'Active', color: '#2563eb', cards: [
    { id: 'l3', title: 'API endpoints', labels: [
      { text: 'Backend', color: '#fff', background: '#2563eb' },
      { text: 'Priority', color: '#fff', background: '#dc2626', icon: '!', iconPosition: 'left' },
    ], assignee: 'Carol' },
  ]},
  { id: 'review', title: 'Review', color: '#f59e0b', cards: [
    { id: 'l4', title: 'Code review PR #42', labels: [
      { text: 'Review', color: '#92400e', background: '#fef3c7' },
    ]},
  ]},
  { id: 'complete', title: 'Complete', color: '#16a34a', cards: [
    { id: 'l5', title: 'Database schema', labels: ['Backend'], assignee: 'Dave' },
  ]},
];

const colorCards = [
  { id: 'col1', title: 'Sprint', cards: [
    { id: 'cc1', title: 'Bug fix #123', color: '#dc2626' },
    { id: 'cc2', title: 'Feature request', color: '#2563eb' },
    { id: 'cc3', title: 'Refactor', color: '#16a34a' },
    { id: 'cc4', title: 'Documentation', color: '#9333ea' },
  ]},
  { id: 'col2', title: 'Next', cards: [] },
];

const emptyColumns = [
  { id: 'e1', title: 'Open', cards: [] },
  { id: 'e2', title: 'In Progress', cards: [] },
  { id: 'e3', title: 'Done', cards: [] },
];

const manyCards = [
  { id: 'mc1', title: 'Backlog', cards: Array.from({ length: 8 }, (_, i) => ({
    id: `m${i}`, title: `Task ${i + 1}`, description: `Description for task ${i + 1}.`,
    assignee: ['Alice', 'Bob', 'Carol', 'Dave'][i % 4],
    labels: i % 2 === 0 ? ['Important'] : [],
  }))},
  { id: 'mc2', title: 'Active', cards: [
    { id: 'm10', title: 'Current task', assignee: 'Eve' },
  ]},
];

const meta: Meta<Args> = {
  title: 'Specialty/Kanban',
  component: 'snice-kanban',
  tags: ['autodocs'],
  argTypes: {
    allowDragDrop: { control: 'boolean' },
    showCardCount: { control: 'boolean' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-kanban');
    if (args.allowDragDrop === false) el.setAttribute('allow-drag-drop', 'false');
    if (args.showCardCount === false) el.setAttribute('show-card-count', 'false');
    (el as any).columns = basicColumns;
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { allowDragDrop: true, showCardCount: true } };

// h2: Basic Kanban (allow-drag-drop, show-card-count)
export const BasicKanban: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-kanban');
    (el as any).columns = basicColumns;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Cards with Labels (string + object labels with colors/icons)
export const CardsWithLabels: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-kanban');
    (el as any).columns = labelColumns;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Card Colors (border-left accent)
export const CardColors: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-kanban');
    (el as any).columns = colorCards;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: allow-drag-drop: false
export const AllowDragDropFalse: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-kanban');
    el.setAttribute('allow-drag-drop', 'false');
    (el as any).columns = basicColumns;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: show-card-count: false
export const ShowCardCountFalse: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-kanban');
    el.setAttribute('show-card-count', 'false');
    (el as any).columns = basicColumns;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: allow-drag-drop: false + show-card-count: false
export const AllowDragDropFalseShowCardCountFalse: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-kanban');
    el.setAttribute('allow-drag-drop', 'false');
    el.setAttribute('show-card-count', 'false');
    (el as any).columns = basicColumns;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Empty Columns
export const EmptyColumns: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-kanban');
    (el as any).columns = emptyColumns;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Many Cards (overflow)
export const ManyCards: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-kanban');
    (el as any).columns = manyCards;
    wrap.appendChild(el);
    return wrap;
  },
};
