import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-timer';

type Args = {
  mode?: 'stopwatch' | 'timer';
  initialTime?: number;
};

const meta: Meta<Args> = {
  title: 'Specialty/Timer',
  component: 'snice-timer',
  tags: ['autodocs'],
  argTypes: {
    mode:        { control: 'select', options: ['stopwatch', 'timer'] },
    initialTime: { control: 'number' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-timer');
    if (args.mode !== undefined) el.setAttribute('mode', args.mode);
    if (args.initialTime !== undefined) el.setAttribute('initial-time', String(args.initialTime));
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { mode: 'stopwatch' } };

// h2: Mode: stopwatch (default, counts up)
export const ModeStopwatchDefaultCountsUp: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-timer');
    el.setAttribute('mode', 'stopwatch');
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Mode: timer (countdown)
export const ModeTimerCountdown: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;';
    for (const [label, secs] of [
      ['10 seconds', 10],
      ['30 seconds', 30],
      ['60 seconds (1 minute)', 60],
      ['300 seconds (5 minutes)', 300],
      ['3600 seconds (1 hour)', 3600],
    ] as [string, number][]) {
      const cell = document.createElement('div');
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
      lbl.textContent = label;
      const el = document.createElement('snice-timer');
      el.setAttribute('mode', 'timer');
      el.setAttribute('initial-time', String(secs));
      cell.appendChild(lbl);
      cell.appendChild(el);
      wrap.appendChild(cell);
    }
    return wrap;
  },
};

// h2: Initial Time Values
export const InitialTimeValues: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;';
    for (const [label, secs] of [
      ['initial-time=0 (default)', 0],
      ['initial-time=5', 5],
      ['initial-time=90 (1:30)', 90],
      ['initial-time=7200 (2:00:00)', 7200],
    ] as [string, number][]) {
      const cell = document.createElement('div');
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
      lbl.textContent = label;
      const el = document.createElement('snice-timer');
      el.setAttribute('mode', 'timer');
      el.setAttribute('initial-time', String(secs));
      cell.appendChild(lbl);
      cell.appendChild(el);
      wrap.appendChild(cell);
    }
    return wrap;
  },
};

// h2: Multiple Stopwatches (independent)
export const MultipleStopwatchesIndependent: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;';
    for (const label of ['Stopwatch A', 'Stopwatch B']) {
      const cell = document.createElement('div');
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
      lbl.textContent = label;
      const el = document.createElement('snice-timer');
      el.setAttribute('mode', 'stopwatch');
      cell.appendChild(lbl);
      cell.appendChild(el);
      wrap.appendChild(cell);
    }
    return wrap;
  },
};

// h2: CSS Parts Reference
export const CSSPartsReference: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const note = document.createElement('div');
    note.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);';
    note.textContent = 'Parts: base (container), display (time text), controls (buttons)';
    const el = document.createElement('snice-timer');
    el.setAttribute('mode', 'stopwatch');
    wrap.appendChild(note);
    wrap.appendChild(el);
    return wrap;
  },
};
