import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-spreadsheet';

type Args = {
  readonly?: boolean;
};

const meta: Meta<Args> = {
  title: 'Data/Spreadsheet',
  component: 'snice-spreadsheet',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    readonly: { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-spreadsheet') as any;
    if (args.readonly) el.toggleAttribute('readonly', true);
    el.style.cssText = 'height:250px;border:1px solid rgba(128,128,128,0.2);border-radius:6px;overflow:hidden;display:block;';
    el.columns = [{ header: 'Name' }, { header: 'Age', type: 'number' }, { header: 'Department' }];
    el.data = [
      ['Alice', 30, 'Engineering'],
      ['Bob', 25, 'Marketing'],
      ['Charlie', 35, 'Sales'],
    ];
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: {} };

// h2: Basic (No Columns Defined)
export const BasicNoColumnsDefined: Story = {
  render: () => {
    const el = document.createElement('snice-spreadsheet') as any;
    el.style.cssText = 'height:250px;border:1px solid rgba(128,128,128,0.2);border-radius:6px;overflow:hidden;display:block;';
    el.data = [
      ['Alice', 30, 'Engineering'],
      ['Bob', 25, 'Marketing'],
      ['Charlie', 35, 'Sales'],
      ['Diana', 28, 'Engineering'],
    ];
    return el;
  },
};

// h2: With Column Definitions
export const WithColumnDefinitions: Story = {
  render: () => {
    const el = document.createElement('snice-spreadsheet') as any;
    el.style.cssText = 'height:250px;border:1px solid rgba(128,128,128,0.2);border-radius:6px;overflow:hidden;display:block;';
    el.columns = [
      { header: 'Name' },
      { header: 'Age', type: 'number' },
      { header: 'Department' },
      { header: 'Active', type: 'boolean' },
    ];
    el.data = [
      ['Alice', 30, 'Engineering', true],
      ['Bob', 25, 'Marketing', false],
      ['Charlie', 35, 'Sales', true],
      ['Diana', 28, 'Design', true],
    ];
    return el;
  },
};

// h2: Column Types: Text, Number, Date, Boolean
export const ColumnTypesTextNumberDateBoolean: Story = {
  render: () => {
    const el = document.createElement('snice-spreadsheet') as any;
    el.style.cssText = 'height:250px;border:1px solid rgba(128,128,128,0.2);border-radius:6px;overflow:hidden;display:block;';
    el.columns = [
      { header: 'Employee', type: 'text' },
      { header: 'Salary', type: 'number' },
      { header: 'Start Date', type: 'date' },
      { header: 'Full-time', type: 'boolean' },
    ];
    el.data = [
      ['Alice Johnson', 85000, '2022-03-15', true],
      ['Bob Smith', 72000, '2023-01-10', true],
      ['Charlie Brown', 45000, '2023-06-01', false],
      ['Diana Prince', 95000, '2021-11-20', true],
    ];
    return el;
  },
};

// h2: Column Type: Select
export const ColumnTypeSelect: Story = {
  render: () => {
    const el = document.createElement('snice-spreadsheet') as any;
    el.style.cssText = 'height:200px;border:1px solid rgba(128,128,128,0.2);border-radius:6px;overflow:hidden;display:block;';
    el.columns = [
      { header: 'Task' },
      { header: 'Status', type: 'select', options: ['To Do', 'In Progress', 'Done', 'Blocked'] },
      { header: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
    ];
    el.data = [
      ['Fix login bug', 'In Progress', 'High'],
      ['Update docs', 'To Do', 'Low'],
      ['Deploy v2.0', 'Done', 'Critical'],
    ];
    return el;
  },
};

// h2: Custom Column Widths
export const CustomColumnWidths: Story = {
  render: () => {
    const el = document.createElement('snice-spreadsheet') as any;
    el.style.cssText = 'height:200px;border:1px solid rgba(128,128,128,0.2);border-radius:6px;overflow:hidden;display:block;';
    el.columns = [
      { header: 'ID', width: 60 },
      { header: 'Description', width: 300 },
      { header: 'Amount', type: 'number', width: 120 },
    ];
    el.data = [
      [1, 'Office supplies', 150.50],
      [2, 'Software license renewal', 2400.00],
      [3, 'Team lunch', 89.99],
    ];
    return el;
  },
};

// h2: Readonly
export const Readonly: Story = {
  render: () => {
    const el = document.createElement('snice-spreadsheet') as any;
    el.style.cssText = 'height:200px;border:1px solid rgba(128,128,128,0.2);border-radius:6px;overflow:hidden;display:block;';
    el.toggleAttribute('readonly', true);
    el.columns = [{ header: 'Metric' }, { header: 'Value', type: 'number' }];
    el.data = [['Revenue', 125000], ['Expenses', 87000], ['Profit', 38000]];
    return el;
  },
};

// h2: Empty Spreadsheet
export const EmptySpreadsheet: Story = {
  render: () => {
    const el = document.createElement('snice-spreadsheet') as any;
    el.style.cssText = 'height:150px;border:1px solid rgba(128,128,128,0.2);border-radius:6px;overflow:hidden;display:block;';
    return el;
  },
};

// h2: With Formulas
export const WithFormulas: Story = {
  render: () => {
    const el = document.createElement('snice-spreadsheet') as any;
    el.style.cssText = 'height:250px;border:1px solid rgba(128,128,128,0.2);border-radius:6px;overflow:hidden;display:block;';
    el.columns = [
      { header: 'Item' },
      { header: 'Q1', type: 'number' },
      { header: 'Q2', type: 'number' },
      { header: 'Q3', type: 'number' },
      { header: 'Q4', type: 'number' },
      { header: 'Total', type: 'number' },
    ];
    el.data = [
      ['Product A', 100, 150, 200, 180, '=SUM(B1:E1)'],
      ['Product B', 80, 120, 90, 110, '=SUM(B2:E2)'],
      ['Product C', 200, 180, 220, 250, '=SUM(B3:E3)'],
      ['Average', '=AVG(B1:B3)', '=AVG(C1:C3)', '=AVG(D1:D3)', '=AVG(E1:E3)', ''],
    ];
    return el;
  },
};

// h2: Large Dataset
export const LargeDataset: Story = {
  render: () => {
    const el = document.createElement('snice-spreadsheet') as any;
    el.style.cssText = 'height:300px;border:1px solid rgba(128,128,128,0.2);border-radius:6px;overflow:hidden;display:block;';
    el.columns = [
      { header: '#', type: 'number', width: 50 },
      { header: 'Name' },
      { header: 'Score', type: 'number' },
      { header: 'Grade' },
    ];
    const grades = ['A', 'B', 'C', 'D', 'F'];
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank', 'Ivy', 'Jack'];
    el.data = Array.from({ length: 50 }, (_: unknown, i: number) => [
      i + 1,
      names[i % names.length] + ' ' + (Math.floor(i / names.length) + 1),
      Math.floor(50 + (i * 7 % 50)),
      grades[(i * 3) % grades.length],
    ]);
    return el;
  },
};

// h2: Single Row
export const SingleRow: Story = {
  render: () => {
    const el = document.createElement('snice-spreadsheet') as any;
    el.style.cssText = 'height:120px;border:1px solid rgba(128,128,128,0.2);border-radius:6px;overflow:hidden;display:block;';
    el.columns = [{ header: 'A' }, { header: 'B' }, { header: 'C' }];
    el.data = [['Only', 'One', 'Row']];
    return el;
  },
};

// h2: Single Column
export const SingleColumn: Story = {
  render: () => {
    const el = document.createElement('snice-spreadsheet') as any;
    el.style.cssText = 'height:200px;border:1px solid rgba(128,128,128,0.2);border-radius:6px;overflow:hidden;display:block;';
    el.columns = [{ header: 'Values', type: 'number' }];
    el.data = [[10], [20], [30], [40], [50]];
    return el;
  },
};

// h2: CSS Parts Styling
// Parts available: base, formula-bar, status-bar, context-menu
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'ss-parts-demo';

    const style = document.createElement('style');
    style.textContent = `
      .ss-parts-demo { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
      .ss-parts-demo .demo-label {
        font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.06em; color: #888; margin-bottom: 0.4rem;
      }

      /* Styled: base, formula-bar, status-bar */
      .ss-parts-demo .styled-ss::part(base) {
        background: #0d1117;
        border: 2px solid #238636;
        border-radius: 8px;
      }
      .ss-parts-demo .styled-ss::part(formula-bar) {
        background: #161b22;
        border-bottom: 2px solid #238636;
        color: #58a6ff;
        font-family: 'Fira Code', monospace;
        font-size: 0.85rem;
        padding: 0.35rem 0.75rem;
      }
      .ss-parts-demo .styled-ss::part(status-bar) {
        background: #1c2128;
        border-top: 1px solid #30363d;
        color: #8b949e;
        font-size: 0.72rem;
        padding: 0.25rem 0.75rem;
      }
    `;
    wrap.appendChild(style);

    const makeDemo = (label: string, cls: string): HTMLElement => {
      const box = document.createElement('div');
      const lbl = document.createElement('div');
      lbl.className = 'demo-label';
      lbl.textContent = label;
      box.appendChild(lbl);
      const el = document.createElement('snice-spreadsheet') as any;
      el.style.cssText = 'height:220px;display:block;';
      if (cls) el.classList.add(cls);
      el.columns = [{ header: 'Item' }, { header: 'Q1', type: 'number' }, { header: 'Q2', type: 'number' }];
      el.data = [['Revenue', 120000, 145000], ['Expenses', 87000, 92000], ['Profit', 33000, 53000]];
      box.appendChild(el);
      return box;
    };

    wrap.appendChild(makeDemo('Default (no ::part() styles)', ''));
    wrap.appendChild(makeDemo('Styled via ::part() — base, formula-bar, status-bar', 'styled-ss'));

    return wrap;
  },
};
