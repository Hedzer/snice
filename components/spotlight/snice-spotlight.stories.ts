import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-spotlight';

type Args = Record<string, never>;

const meta: Meta<Args> = {
  title: 'Specialty/Spotlight',
  component: 'snice-spotlight',
  tags: ['autodocs'],
  argTypes: {},
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';

    const demoArea = document.createElement('div');
    demoArea.style.cssText = 'border:1px solid rgba(128,128,128,0.3);border-radius:8px;padding:1.5rem;';

    const t1 = document.createElement('div');
    t1.id = 'sp-default-t1';
    t1.style.cssText = 'display:inline-block;padding:.5rem 1rem;border:1px solid rgba(128,128,128,0.3);border-radius:4px;margin:.5rem;';
    t1.textContent = 'Step 1 Target';

    const t2 = document.createElement('div');
    t2.id = 'sp-default-t2';
    t2.style.cssText = t1.style.cssText;
    t2.textContent = 'Step 2 Target';

    const btn = document.createElement('button');
    btn.style.cssText = 'padding:.5rem 1rem;background:#2563eb;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:.875rem;margin-top:.75rem;display:block;';
    btn.textContent = 'Start Tour';

    const spotlight = document.createElement('snice-spotlight');
    spotlight.id = 'sp-default';

    demoArea.appendChild(t1);
    demoArea.appendChild(t2);
    demoArea.appendChild(btn);
    wrap.appendChild(demoArea);
    wrap.appendChild(spotlight);

    btn.onclick = () => (spotlight as any).start();
    setTimeout(() => {
      (spotlight as any).steps = [
        { target: '#sp-default-t1', title: 'First Step', description: 'This is the first element.' },
        { target: '#sp-default-t2', title: 'Second Step', description: 'This is the second element.' },
      ];
    }, 0);

    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

function makeDemoArea(id: string, targets: Array<{ id: string; label: string; style?: string }>, btnLabel: string) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';

  const area = document.createElement('div');
  area.style.cssText = 'border:1px solid rgba(128,128,128,0.3);border-radius:8px;padding:1.5rem;';

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;';

  for (const t of targets) {
    const el = document.createElement('div');
    el.id = t.id;
    el.style.cssText = (t.style ?? '') + 'display:inline-block;padding:.5rem 1rem;border:1px solid rgba(128,128,128,0.3);border-radius:4px;';
    el.textContent = t.label;
    row.appendChild(el);
  }

  const btn = document.createElement('button');
  btn.style.cssText = 'padding:.5rem 1rem;background:#2563eb;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:.875rem;margin-top:.75rem;display:block;';
  btn.textContent = btnLabel;

  area.appendChild(row);
  area.appendChild(btn);

  const spotlight = document.createElement('snice-spotlight');
  spotlight.id = id;

  wrap.appendChild(area);
  wrap.appendChild(spotlight);

  btn.onclick = () => (spotlight as any).start();

  return { wrap, spotlight };
}

export const Default: Story = {
  render: () => {
    const { wrap, spotlight } = makeDemoArea(
      'sp-story-default',
      [
        { id: 'sp-story-t1', label: 'Step 1' },
        { id: 'sp-story-t2', label: 'Step 2' },
      ],
      'Start Tour',
    );
    setTimeout(() => {
      (spotlight as any).steps = [
        { target: '#sp-story-t1', title: 'First', description: 'Highlighting step 1.' },
        { target: '#sp-story-t2', title: 'Second', description: 'Highlighting step 2.' },
      ];
    }, 0);
    return wrap;
  },
};

// h2: Basic Tour (3 Steps)
export const BasicTour3Steps: Story = {
  render: () => {
    const { wrap, spotlight } = makeDemoArea(
      'sp-basic',
      [
        { id: 'sp-b1', label: 'Step 1 Target' },
        { id: 'sp-b2', label: 'Step 2 Target' },
        { id: 'sp-b3', label: 'Step 3 Target' },
      ],
      'Start Basic Tour',
    );
    setTimeout(() => {
      (spotlight as any).steps = [
        { target: '#sp-b1', title: 'First Step',  description: 'This is the first element in the tour.' },
        { target: '#sp-b2', title: 'Second Step', description: 'Now highlighting the second element.' },
        { target: '#sp-b3', title: 'Third Step',  description: 'The final element in this tour.' },
      ];
    }, 0);
    return wrap;
  },
};

// h2: Single Step
export const SingleStep: Story = {
  render: () => {
    const { wrap, spotlight } = makeDemoArea(
      'sp-single',
      [{ id: 'sp-single-t', label: 'Single Target' }],
      'Start Single Step',
    );
    setTimeout(() => {
      (spotlight as any).steps = [
        { target: '#sp-single-t', title: 'Only Step', description: 'This tour has just one step.' },
      ];
    }, 0);
    return wrap;
  },
};

// h2: Positions (top, bottom, left, right)
export const Positions: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';

    const area = document.createElement('div');
    area.style.cssText = 'border:1px solid rgba(128,128,128,0.3);border-radius:8px;padding:1.5rem;';

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:2rem;padding:3rem;';

    const positions = [
      { id: 'sp-pos-top',    label: 'Top Position',    pos: 'top' },
      { id: 'sp-pos-bottom', label: 'Bottom Position', pos: 'bottom' },
      { id: 'sp-pos-left',   label: 'Left Position',   pos: 'left' },
      { id: 'sp-pos-right',  label: 'Right Position',  pos: 'right' },
    ];

    for (const p of positions) {
      const el = document.createElement('div');
      el.id = p.id;
      el.style.cssText = 'padding:.5rem 1rem;border:1px solid rgba(128,128,128,0.3);border-radius:4px;justify-self:center;';
      el.textContent = p.label;
      grid.appendChild(el);
    }

    const btn = document.createElement('button');
    btn.style.cssText = 'padding:.5rem 1rem;background:#2563eb;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:.875rem;margin-top:.75rem;display:block;';
    btn.textContent = 'Start Position Tour';

    area.appendChild(grid);
    area.appendChild(btn);

    const spotlight = document.createElement('snice-spotlight');
    spotlight.id = 'sp-positions';

    wrap.appendChild(area);
    wrap.appendChild(spotlight);

    btn.onclick = () => (spotlight as any).start();
    setTimeout(() => {
      (spotlight as any).steps = positions.map(p => ({
        target: '#' + p.id,
        title: p.label,
        description: `Popover appears at ${p.pos}.`,
        position: p.pos,
      }));
    }, 0);

    return wrap;
  },
};

// h2: Auto Position
export const AutoPosition: Story = {
  render: () => {
    const { wrap, spotlight } = makeDemoArea(
      'sp-auto',
      [{ id: 'sp-auto-t', label: 'Auto Position' }],
      'Start Auto Tour',
    );
    setTimeout(() => {
      (spotlight as any).steps = [
        { target: '#sp-auto-t', title: 'Auto Position', description: 'The popover automatically picks the best position.', position: 'auto' },
      ];
    }, 0);
    return wrap;
  },
};

// h2: Many Steps Tour
export const ManyStepsTour: Story = {
  render: () => {
    const { wrap, spotlight } = makeDemoArea(
      'sp-many',
      [
        { id: 'sp-m1', label: 'Step 1' },
        { id: 'sp-m2', label: 'Step 2' },
        { id: 'sp-m3', label: 'Step 3' },
        { id: 'sp-m4', label: 'Step 4' },
        { id: 'sp-m5', label: 'Step 5' },
      ],
      'Start 5-Step Tour',
    );
    setTimeout(() => {
      (spotlight as any).steps = [
        { target: '#sp-m1', title: 'Step 1 of 5', description: 'First element.' },
        { target: '#sp-m2', title: 'Step 2 of 5', description: 'Second element.' },
        { target: '#sp-m3', title: 'Step 3 of 5', description: 'Third element.' },
        { target: '#sp-m4', title: 'Step 4 of 5', description: 'Fourth element.' },
        { target: '#sp-m5', title: 'Step 5 of 5', description: 'Fifth and final element.' },
      ];
    }, 0);
    return wrap;
  },
};
