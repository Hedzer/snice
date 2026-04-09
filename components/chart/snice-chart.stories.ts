import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-chart';

type Args = {
  type?: string;
  height?: number;
  width?: number;
};

const meta: Meta<Args> = {
  title: 'Charts/Chart',
  component: 'snice-chart',
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['line', 'bar', 'area', 'pie', 'donut', 'scatter', 'radar', 'mixed'] },
    height: { control: 'number' },
    width: { control: 'number' },
  },
  render: (args) => {
    const el = document.createElement('snice-chart');
    if (args.type !== undefined) el.setAttribute('type', String(args.type));
    if (args.height !== undefined) el.setAttribute('height', String(args.height));
    if (args.width !== undefined) el.setAttribute('width', String(args.width));
    (el as any).labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    (el as any).datasets = [{ label: 'Sales', data: [30, 45, 35, 50, 40], borderColor: '#2196f3', backgroundColor: '#2196f3' }];
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { type: 'line', height: 250 } };

// h2: type="line" (default)
export const TypeLine: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const el = document.createElement('snice-chart');
    el.setAttribute('type', 'line');
    el.setAttribute('height', '250');
    (el as any).labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    (el as any).datasets = [{ label: 'Series 1', data: [12, 19, 15, 25, 22, 30, 28], borderColor: '#2196f3', backgroundColor: '#2196f3' }];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: type="line" — multiple datasets
export const TypeLineMultipleDatasets: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const el = document.createElement('snice-chart');
    el.setAttribute('type', 'line');
    el.setAttribute('height', '250');
    (el as any).labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    (el as any).datasets = [
      { label: 'Sales', data: [12, 19, 15, 25, 22, 30, 28], borderColor: '#2196f3', backgroundColor: '#2196f3' },
      { label: 'Revenue', data: [7, 11, 13, 18, 16, 27, 25], borderColor: '#4caf50', backgroundColor: '#4caf50' },
    ];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: type="bar" — per-bar colors
export const TypeBarPerBarColors: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const el = document.createElement('snice-chart');
    el.setAttribute('type', 'bar');
    el.setAttribute('height', '250');
    (el as any).labels = ['A', 'B', 'C', 'D', 'E'];
    (el as any).datasets = [{ label: 'Q1', data: [65, 59, 80, 81, 56], backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'] }];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: type="bar" — grouped (multiple datasets)
export const TypeBarGrouped: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const el = document.createElement('snice-chart');
    el.setAttribute('type', 'bar');
    el.setAttribute('height', '250');
    (el as any).labels = ['A', 'B', 'C', 'D', 'E'];
    (el as any).datasets = [
      { label: 'Q1', data: [65, 59, 80, 81, 56], backgroundColor: '#2196f3' },
      { label: 'Q2', data: [28, 48, 40, 19, 86], backgroundColor: '#ff9800' },
    ];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: type="area"
export const TypeArea: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const el = document.createElement('snice-chart');
    el.setAttribute('type', 'area');
    el.setAttribute('height', '250');
    (el as any).labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    (el as any).datasets = [{ label: 'Users', data: [30, 40, 35, 50, 49, 60, 70], borderColor: '#ff9800', backgroundColor: '#ff9800', fill: true }];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: type="pie"
export const TypePie: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const el = document.createElement('snice-chart');
    el.setAttribute('type', 'pie');
    el.setAttribute('height', '250');
    (el as any).labels = ['A', 'B', 'C', 'D', 'E'];
    (el as any).datasets = [{ label: 'Market Share', data: [30, 25, 20, 15, 10], backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'] }];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: type="donut"
export const TypeDonut: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const el = document.createElement('snice-chart');
    el.setAttribute('type', 'donut');
    el.setAttribute('height', '250');
    (el as any).labels = ['Electronics', 'Clothing', 'Food', 'Books'];
    (el as any).datasets = [{ label: 'Categories', data: [40, 30, 20, 10], backgroundColor: ['#2196f3', '#4caf50', '#ff9800', '#f44336'] }];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: type="scatter"
export const TypeScatter: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const el = document.createElement('snice-chart');
    el.setAttribute('type', 'scatter');
    el.setAttribute('height', '250');
    (el as any).datasets = [{
      label: 'Points',
      data: [{ x: 10, y: 20 }, { x: 15, y: 25 }, { x: 20, y: 22 }, { x: 25, y: 30 }, { x: 30, y: 28 }, { x: 35, y: 35 }],
      backgroundColor: '#9c27b0',
    }];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: type="radar"
export const TypeRadar: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const el = document.createElement('snice-chart');
    el.setAttribute('type', 'radar');
    el.setAttribute('height', '350');
    (el as any).labels = ['Speed', 'Strength', 'Agility', 'Defense', 'Skill'];
    (el as any).datasets = [
      { label: 'Team A', data: [80, 90, 70, 85, 75], borderColor: '#2196f3', backgroundColor: '#2196f3' },
      { label: 'Team B', data: [70, 85, 80, 75, 85], borderColor: '#4caf50', backgroundColor: '#4caf50' },
    ];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: type="mixed" (bar + line)
export const TypeMixed: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const el = document.createElement('snice-chart');
    el.setAttribute('type', 'mixed');
    el.setAttribute('height', '250');
    (el as any).labels = ['A', 'B', 'C', 'D', 'E'];
    (el as any).datasets = [
      { label: 'Bar', type: 'bar', data: [10, 20, 30, 40, 50], backgroundColor: '#2196f3' },
      { label: 'Line', type: 'line', data: [15, 25, 20, 35, 30], borderColor: '#4caf50', backgroundColor: '#4caf50' },
    ];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Grid disabled (xAxis.grid=false, yAxis.grid=false)
export const GridDisabled: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const el = document.createElement('snice-chart');
    el.setAttribute('type', 'line');
    el.setAttribute('height', '200');
    (el as any).labels = ['A', 'B', 'C', 'D', 'E'];
    (el as any).datasets = [{ label: 'Data', data: [5, 10, 8, 15, 12], borderColor: '#e91e63', backgroundColor: '#e91e63' }];
    (el as any).options = { xAxis: { grid: false }, yAxis: { grid: false } };
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Legend position="bottom", clickable
export const LegendPositionBottom: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const el = document.createElement('snice-chart');
    el.setAttribute('type', 'line');
    el.setAttribute('height', '250');
    (el as any).labels = ['X', 'Y', 'Z'];
    (el as any).datasets = [
      { label: 'A', data: [10, 20, 30], borderColor: '#f44336', backgroundColor: '#f44336' },
      { label: 'B', data: [30, 20, 10], borderColor: '#2196f3', backgroundColor: '#2196f3' },
    ];
    (el as any).options = { legend: { position: 'bottom', clickable: true } };
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Legend position="none"
export const LegendPositionNone: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const el = document.createElement('snice-chart');
    el.setAttribute('type', 'line');
    el.setAttribute('height', '200');
    (el as any).labels = ['A', 'B', 'C', 'D', 'E'];
    (el as any).datasets = [{ label: 'Hidden Legend', data: [5, 15, 10, 20, 18], borderColor: '#673ab7', backgroundColor: '#673ab7' }];
    (el as any).options = { legend: { position: 'none' } };
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Custom yAxis: min=0, max=100, ticks=10
export const CustomYAxis: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const el = document.createElement('snice-chart');
    el.setAttribute('type', 'line');
    el.setAttribute('height', '250');
    (el as any).labels = ['A', 'B', 'C', 'D', 'E'];
    (el as any).datasets = [{ label: 'Bounded', data: [25, 50, 75, 60, 90], borderColor: '#00bcd4', backgroundColor: '#00bcd4' }];
    (el as any).options = { yAxis: { min: 0, max: 100, ticks: 10 } };
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Single data point (bar)
export const SingleDataPoint: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const el = document.createElement('snice-chart');
    el.setAttribute('type', 'bar');
    el.setAttribute('height', '200');
    (el as any).labels = ['Only'];
    (el as any).datasets = [{ label: 'One', data: [42], backgroundColor: '#ff6384' }];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Empty (no datasets)
export const Empty: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const el = document.createElement('snice-chart');
    el.setAttribute('type', 'line');
    el.setAttribute('height', '150');
    (el as any).datasets = [];
    wrap.appendChild(el);
    return wrap;
  },
};
