import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-gantt';

type Args = {
  zoom?: 'day' | 'week' | 'month';
  showDependencies?: boolean;
};

const baseTasks = [
  { id: 't1', name: 'Planning', start: '2026-03-01', end: '2026-03-10', progress: 100 },
  { id: 't2', name: 'Design', start: '2026-03-08', end: '2026-03-20', progress: 75 },
  { id: 't3', name: 'Development', start: '2026-03-18', end: '2026-04-15', progress: 30 },
  { id: 't4', name: 'Testing', start: '2026-04-10', end: '2026-04-25', progress: 0 },
  { id: 't5', name: 'Launch', start: '2026-04-25', end: '2026-04-30', progress: 0 },
];

const coloredTasks = [
  { id: 'c1', name: 'Backend API', start: '2026-03-01', end: '2026-03-20', color: '#2563eb', progress: 60 },
  { id: 'c2', name: 'Frontend UI', start: '2026-03-10', end: '2026-03-30', color: '#9333ea', progress: 40 },
  { id: 'c3', name: 'Database', start: '2026-03-05', end: '2026-03-15', color: '#16a34a', progress: 90 },
  { id: 'c4', name: 'Deployment', start: '2026-03-28', end: '2026-04-05', color: '#ea580c', progress: 0 },
];

const groupedTasks = [
  { id: 'g1', name: 'Requirements', start: '2026-03-01', end: '2026-03-10', group: 'Phase 1', progress: 100 },
  { id: 'g2', name: 'Architecture', start: '2026-03-05', end: '2026-03-15', group: 'Phase 1', progress: 80 },
  { id: 'g3', name: 'Sprint 1', start: '2026-03-15', end: '2026-03-28', group: 'Phase 2', progress: 50 },
  { id: 'g4', name: 'Sprint 2', start: '2026-03-28', end: '2026-04-10', group: 'Phase 2', progress: 10 },
  { id: 'g5', name: 'QA', start: '2026-04-05', end: '2026-04-20', group: 'Phase 3' },
  { id: 'g6', name: 'Release', start: '2026-04-18', end: '2026-04-25', group: 'Phase 3' },
];

const depTasks = [
  { id: 'd1', name: 'Task A', start: '2026-03-01', end: '2026-03-10', dependencies: [] },
  { id: 'd2', name: 'Task B', start: '2026-03-10', end: '2026-03-20', dependencies: ['d1'] },
  { id: 'd3', name: 'Task C', start: '2026-03-20', end: '2026-04-01', dependencies: ['d2'] },
];

const meta: Meta<Args> = {
  title: 'Specialty/Gantt',
  component: 'snice-gantt',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    zoom: { control: 'select', options: ['day', 'week', 'month'] },
    showDependencies: { control: 'boolean' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-gantt');
    el.style.cssText = 'display:block;min-height:300px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;';
    if (args.zoom !== undefined) el.setAttribute('zoom', args.zoom);
    if (args.showDependencies === false) el.setAttribute('show-dependencies', 'false');
    (el as any).tasks = baseTasks;
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { zoom: 'week', showDependencies: true } };

// h2: Zoom: day
export const ZoomDay: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    
    el.style.cssText = 'display:block;min-height:300px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;';
    el.setAttribute('zoom', 'day');
    (el as any).tasks = baseTasks;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Zoom: week (default)
export const ZoomWeekDefault: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    
    el.style.cssText = 'display:block;min-height:300px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;';
    el.setAttribute('zoom', 'week');
    (el as any).tasks = baseTasks;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Zoom: month
export const ZoomMonth: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    
    el.style.cssText = 'display:block;min-height:300px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;';
    el.setAttribute('zoom', 'month');
    (el as any).tasks = baseTasks;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: show-dependencies: true (default)
export const ShowDependenciesTrue: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    
    el.style.cssText = 'display:block;min-height:300px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;';
    el.toggleAttribute('show-dependencies', true);
    (el as any).tasks = depTasks;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: show-dependencies: false
export const ShowDependenciesFalse: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    
    el.style.cssText = 'display:block;min-height:300px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;';
    el.setAttribute('show-dependencies', 'false');
    (el as any).tasks = depTasks;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Custom Task Colors
export const CustomTaskColors: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    
    el.style.cssText = 'display:block;min-height:300px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;';
    el.setAttribute('zoom', 'week');
    (el as any).tasks = coloredTasks;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Task Progress (bars show completion)
export const TaskProgress: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    
    el.style.cssText = 'display:block;min-height:300px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;';
    el.setAttribute('zoom', 'week');
    (el as any).tasks = baseTasks;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Grouped Tasks
export const GroupedTasks: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    
    el.style.cssText = 'display:block;min-height:300px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;';
    el.setAttribute('zoom', 'week');
    (el as any).tasks = groupedTasks;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Same Data at All Zoom Levels
export const SameDataAtAllZoomLevels: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    for (const zoom of ['day', 'week', 'month']) {
      
    el.style.cssText = 'display:block;min-height:300px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;';
      el.setAttribute('zoom', zoom);
      (el as any).tasks = baseTasks;
      wrap.appendChild(el);
    }
    return wrap;
  },
};

// h2: CSS Parts Styling
// Available parts: base, header, controls, body, task-list, timeline
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    // Default
    const defaultLabel = document.createElement('h3');
    defaultLabel.textContent = 'Default';
    defaultLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    const defaultEl = document.createElement('snice-gantt');
    defaultEl.setAttribute('zoom', 'week');
    (defaultEl as any).tasks = baseTasks;
    wrap.appendChild(defaultLabel);
    wrap.appendChild(defaultEl);

    // Styled with ::part()
    const styledSection = document.createElement('div');
    styledSection.className = 'parts-demo-gantt';

    const styledLabel = document.createElement('h3');
    styledLabel.textContent = 'Styled with ::part()';
    styledLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    styledSection.appendChild(styledLabel);

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-gantt snice-gantt::part(base) {
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      }
      .parts-demo-gantt snice-gantt::part(header) {
        background: #161b22;
        border-bottom: 1px solid #21262d;
        padding: 0.5rem 1rem;
      }
      .parts-demo-gantt snice-gantt::part(controls) {
        gap: 0.5rem;
        background: #1f2937;
        border-radius: 6px;
        padding: 0.25rem;
      }
      .parts-demo-gantt snice-gantt::part(body) {
        background: #0d1117;
      }
      .parts-demo-gantt snice-gantt::part(task-list) {
        background: #161b22;
        border-right: 2px solid #58a6ff;
        font-family: 'Courier New', monospace;
        font-size: 0.8rem;
      }
      .parts-demo-gantt snice-gantt::part(timeline) {
        background: repeating-linear-gradient(
          90deg,
          transparent,
          transparent 39px,
          rgba(88,166,255,0.08) 39px,
          rgba(88,166,255,0.08) 40px
        );
      }
    `;
    styledSection.appendChild(style);

    const styledEl = document.createElement('snice-gantt');
    styledEl.setAttribute('zoom', 'week');
    (styledEl as any).tasks = coloredTasks;
    styledSection.appendChild(styledEl);
    wrap.appendChild(styledSection);

    return wrap;
  },
};
