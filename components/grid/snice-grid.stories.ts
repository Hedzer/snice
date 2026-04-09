import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-grid';

type Args = {
  gap?: string;
  columnWidth?: number;
  rowHeight?: number;
  columns?: number;
  rows?: number;
  draggable?: boolean;
  transitionDuration?: string;
  stagger?: number;
};

const FLAT_COLORS = [
  'var(--snice-color-primary,#2563eb)',
  'var(--snice-color-success,#16a34a)',
  'var(--snice-color-danger,#dc2626)',
  'rgb(139 92 246)',
  'rgb(234 179 8)',
  'rgb(236 72 153)',
  'rgb(20 184 166)',
  'rgb(249 115 22)',
];

function makeGridItem(label: string, colorIdx: number, attrs: Record<string, string> = {}) {
  const el = document.createElement('div');
  el.style.cssText = `display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:.75rem;font-weight:600;color:white;user-select:none;background:${FLAT_COLORS[colorIdx % FLAT_COLORS.length]};`;
  el.textContent = label;
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

function makeGrid(attrs: Record<string, string | boolean>, items: HTMLElement[]) {
  const el = document.createElement('snice-grid');
  el.style.cssText = 'border:1px solid var(--snice-color-border,rgb(60 60 60));border-radius:6px;';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  items.forEach(i => el.appendChild(i));
  return el;
}

const meta: Meta<Args> = {
  title: 'Layout/Grid',
  component: 'snice-grid',
  tags: ['autodocs'],
  argTypes: {
    gap:               { control: 'text' },
    columnWidth:       { control: 'number' },
    rowHeight:         { control: 'number' },
    columns:           { control: 'number' },
    rows:              { control: 'number' },
    draggable:         { control: 'boolean' },
    transitionDuration:{ control: 'text' },
    stagger:           { control: 'number' },
  },
  render: (args) => {
    const attrs: Record<string, string | boolean> = {
      gap:          args.gap          ?? '8px',
      'column-width': String(args.columnWidth ?? 80),
      'row-height':   String(args.rowHeight   ?? 80),
    };
    if (args.columns           !== undefined) attrs['columns']            = String(args.columns);
    if (args.rows              !== undefined) attrs['rows']               = String(args.rows);
    if (args.draggable)                       attrs['draggable']          = true;
    if (args.transitionDuration !== undefined) attrs['transition-duration']= args.transitionDuration;
    if (args.stagger            !== undefined) attrs['stagger']            = String(args.stagger);
    return makeGrid(attrs, [
      makeGridItem('A', 0, { 'grid-col': '0', 'grid-row': '0' }),
      makeGridItem('B', 1, { 'grid-col': '1', 'grid-row': '0' }),
      makeGridItem('C', 2, { 'grid-col': '2', 'grid-row': '0' }),
      makeGridItem('D', 3, { 'grid-col': '0', 'grid-row': '1' }),
      makeGridItem('E', 4, { 'grid-col': '2', 'grid-row': '1' }),
    ]);
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { gap: '8px', columnWidth: 80, rowHeight: 80 } };

// h2: Basic grid — items at explicit positions
export const BasicGridItemsAtExplicitPositions: Story = {
  render: () => makeGrid({ gap: '8px', 'column-width': '80', 'row-height': '80' }, [
    makeGridItem('A', 0, { 'grid-col': '0', 'grid-row': '0' }),
    makeGridItem('B', 1, { 'grid-col': '1', 'grid-row': '0' }),
    makeGridItem('C', 2, { 'grid-col': '2', 'grid-row': '0' }),
    makeGridItem('D', 3, { 'grid-col': '0', 'grid-row': '1' }),
    makeGridItem('E', 4, { 'grid-col': '2', 'grid-row': '1' }),
    makeGridItem('F', 5, { 'grid-col': '1', 'grid-row': '2' }),
    makeGridItem('G', 6, { 'grid-col': '3', 'grid-row': '0' }),
    makeGridItem('H', 7, { 'grid-col': '3', 'grid-row': '2' }),
  ]),
};

// h2: Spanning — items across multiple cells
export const SpanningItemsAcrossMultipleCells: Story = {
  render: () => makeGrid({ gap: '8px', 'column-width': '80', 'row-height': '80' }, [
    makeGridItem('2x2', 0, { 'grid-col': '0', 'grid-row': '0', 'grid-colspan': '2', 'grid-rowspan': '2' }),
    makeGridItem('3x1', 1, { 'grid-col': '2', 'grid-row': '0', 'grid-colspan': '3' }),
    makeGridItem('1x2', 2, { 'grid-col': '2', 'grid-row': '1', 'grid-rowspan': '2' }),
    makeGridItem('1x1', 3, { 'grid-col': '3', 'grid-row': '1' }),
    makeGridItem('1x1', 4, { 'grid-col': '4', 'grid-row': '1' }),
    makeGridItem('2x1', 5, { 'grid-col': '0', 'grid-row': '2', 'grid-colspan': '2' }),
    makeGridItem('2x1', 6, { 'grid-col': '3', 'grid-row': '2', 'grid-colspan': '2' }),
  ]),
};

// h2: Collision resolution — overlapping items push right then down
export const CollisionResolution: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:2rem;flex-wrap:wrap;';

    const col1 = document.createElement('div');
    const lbl1 = document.createElement('div'); lbl1.style.cssText = 'font-size:.6rem;color:#888;margin-bottom:.35rem;'; lbl1.textContent = 'All items at (0,0)';
    const g1 = makeGrid({ gap: '8px', 'column-width': '80', 'row-height': '80', columns: '4' }, [
      makeGridItem('1', 0, { 'grid-col': '0', 'grid-row': '0' }),
      makeGridItem('2', 1, { 'grid-col': '0', 'grid-row': '0' }),
      makeGridItem('3', 2, { 'grid-col': '0', 'grid-row': '0' }),
      makeGridItem('4', 3, { 'grid-col': '0', 'grid-row': '0' }),
      makeGridItem('5', 4, { 'grid-col': '0', 'grid-row': '0' }),
      makeGridItem('6', 5, { 'grid-col': '0', 'grid-row': '0' }),
      makeGridItem('7', 6, { 'grid-col': '0', 'grid-row': '0' }),
      makeGridItem('8', 7, { 'grid-col': '0', 'grid-row': '0' }),
    ]);
    col1.appendChild(lbl1); col1.appendChild(g1);

    const col2 = document.createElement('div');
    const lbl2 = document.createElement('div'); lbl2.style.cssText = 'font-size:.6rem;color:#888;margin-bottom:.35rem;'; lbl2.textContent = 'Mixed collisions with spans';
    const g2 = makeGrid({ gap: '8px', 'column-width': '80', 'row-height': '80', columns: '4' }, [
      makeGridItem('2x2',   0, { 'grid-col': '0', 'grid-row': '0', 'grid-colspan': '2', 'grid-rowspan': '2' }),
      makeGridItem('pushed',3, { 'grid-col': '0', 'grid-row': '0' }),
      makeGridItem('pushed',4, { 'grid-col': '1', 'grid-row': '0' }),
      makeGridItem('pushed',5, { 'grid-col': '0', 'grid-row': '0', 'grid-colspan': '2' }),
    ]);
    col2.appendChild(lbl2); col2.appendChild(g2);

    wrap.appendChild(col1); wrap.appendChild(col2);
    return wrap;
  },
};

// h2: Fixed grid size — columns and rows attributes
export const FixedGridSizeColumnsAndRows: Story = {
  render: () => makeGrid({ gap: '8px', 'column-width': '80', 'row-height': '80', columns: '5', rows: '3' }, [
    makeGridItem('1', 0, { 'grid-col': '0', 'grid-row': '0' }),
    makeGridItem('2', 1, { 'grid-col': '1', 'grid-row': '0', 'grid-colspan': '2' }),
    makeGridItem('3', 2, { 'grid-col': '3', 'grid-row': '0', 'grid-rowspan': '2' }),
    makeGridItem('4', 3, { 'grid-col': '4', 'grid-row': '0' }),
    makeGridItem('5', 4, { 'grid-col': '0', 'grid-row': '1', 'grid-colspan': '3' }),
    makeGridItem('6', 5, { 'grid-col': '4', 'grid-row': '1' }),
    makeGridItem('7', 6, { 'grid-col': '0', 'grid-row': '2', 'grid-colspan': '2' }),
    makeGridItem('8', 7, { 'grid-col': '2', 'grid-row': '2', 'grid-colspan': '3' }),
  ]),
};

// h2: Draggable — drag items to rearrange with snap-to-grid
export const DraggableDragItemsToRearrange: Story = {
  render: () => makeGrid({ gap: '8px', 'column-width': '100', 'row-height': '100', draggable: true }, [
    makeGridItem('alpha',   0, { name: 'alpha',   'grid-col': '0', 'grid-row': '0', 'grid-colspan': '2' }),
    makeGridItem('beta',    1, { name: 'beta',    'grid-col': '2', 'grid-row': '0' }),
    makeGridItem('gamma',   2, { name: 'gamma',   'grid-col': '0', 'grid-row': '1' }),
    makeGridItem('delta',   3, { name: 'delta',   'grid-col': '1', 'grid-row': '1', 'grid-colspan': '2' }),
    makeGridItem('epsilon', 4, { name: 'epsilon', 'grid-col': '0', 'grid-row': '2', 'grid-colspan': '3' }),
  ]),
};

// h2: Stagger animation — cascade delay
export const StaggerAnimationCascadeDelay: Story = {
  render: () => makeGrid({ gap: '8px', 'column-width': '80', 'row-height': '80', 'transition-duration': '0.6s', stagger: '50' }, [
    makeGridItem('1', 0, { 'grid-col': '0', 'grid-row': '0' }),
    makeGridItem('2', 1, { 'grid-col': '1', 'grid-row': '0' }),
    makeGridItem('3', 2, { 'grid-col': '2', 'grid-row': '0' }),
    makeGridItem('4', 3, { 'grid-col': '3', 'grid-row': '0' }),
    makeGridItem('5', 4, { 'grid-col': '0', 'grid-row': '1' }),
    makeGridItem('6', 5, { 'grid-col': '1', 'grid-row': '1' }),
    makeGridItem('7', 6, { 'grid-col': '2', 'grid-row': '1' }),
    makeGridItem('8', 7, { 'grid-col': '3', 'grid-row': '1' }),
    makeGridItem('9', 0, { 'grid-col': '0', 'grid-row': '2', 'grid-colspan': '2' }),
    makeGridItem('10',3, { 'grid-col': '2', 'grid-row': '2', 'grid-colspan': '2' }),
  ]),
};

// h2: getLayout() / setLayout() — persist and restore
export const GetLayoutSetLayout: Story = {
  render: () => {
    const wrap = document.createElement('div');
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:.5rem;margin-bottom:.75rem;flex-wrap:wrap;';
    const output = document.createElement('div');
    output.style.cssText = 'background:var(--snice-color-background-element,rgb(20 20 20));border:1px solid var(--snice-color-border,rgb(60 60 60));border-radius:6px;padding:.75rem;font-family:monospace;font-size:.65rem;line-height:1.5;color:var(--snice-color-text-secondary,rgb(180 180 180));max-height:10rem;overflow-y:auto;white-space:pre;margin-top:.5rem;';
    output.textContent = '// Click getLayout() to see the layout object';

    const grid = makeGrid({ gap: '8px', 'column-width': '80', 'row-height': '80', draggable: true }, [
      makeGridItem('alpha',   0, { name: 'alpha',   'grid-col': '0', 'grid-row': '0', 'grid-colspan': '2' }),
      makeGridItem('beta',    1, { name: 'beta',    'grid-col': '2', 'grid-row': '0' }),
      makeGridItem('gamma',   2, { name: 'gamma',   'grid-col': '3', 'grid-row': '0', 'grid-rowspan': '2' }),
      makeGridItem('delta',   3, { name: 'delta',   'grid-col': '0', 'grid-row': '1', 'grid-colspan': '2', 'grid-rowspan': '2' }),
      makeGridItem('epsilon', 4, { name: 'epsilon', 'grid-col': '2', 'grid-row': '1' }),
    ]);

    let capturedLayout: unknown = null;

    const makeBtn = (label: string, handler: () => void) => {
      const btn = document.createElement('button');
      btn.style.cssText = 'padding:.35rem .7rem;border:1px solid var(--snice-color-border,rgb(60 60 60));border-radius:6px;background:var(--snice-color-background-element);color:var(--snice-color-text);cursor:pointer;font-size:.75rem;';
      btn.textContent = label;
      btn.addEventListener('click', handler);
      return btn;
    };

    btnRow.appendChild(makeBtn('getLayout()', () => {
      capturedLayout = (grid as any).getLayout?.();
      output.textContent = JSON.stringify(capturedLayout, null, 2);
    }));
    btnRow.appendChild(makeBtn('setLayout()', () => {
      if (!capturedLayout) { output.textContent = '// Capture a layout first'; return; }
      (grid as any).setLayout?.(capturedLayout);
      output.textContent = '// Layout restored!\n' + JSON.stringify(capturedLayout, null, 2);
    }));

    wrap.appendChild(btnRow); wrap.appendChild(grid); wrap.appendChild(output);
    return wrap;
  },
};

// h2: Dashboard example — drag widgets to rearrange
export const DashboardExample: Story = {
  render: () => {
    const gradients = [
      'linear-gradient(135deg,#1e3a5f,#2563eb)',
      'linear-gradient(135deg,#134e4a,#14b8a6)',
      'linear-gradient(135deg,#3b1764,#8b5cf6)',
      'linear-gradient(135deg,#4a1d2e,#e11d48)',
      'linear-gradient(135deg,#1a3320,#16a34a)',
      'linear-gradient(135deg,#431407,#ea580c)',
      'linear-gradient(135deg,#1e293b,#334155)',
      'linear-gradient(135deg,#1a2e05,#65a30d)',
    ];

    function makeWidget(name: string, title: string, value: string, gradIdx: number, gridAttrs: Record<string, string>) {
      const w = document.createElement('div');
      w.style.cssText = `border-radius:8px;font-size:.7rem;color:#e0e0e0;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 2px 8px rgba(0,0,0,0.3);user-select:none;background:${gradients[gradIdx]};`;
      w.setAttribute('name', name);
      for (const [k, v] of Object.entries(gridAttrs)) w.setAttribute(k, v);
      const hdr = document.createElement('div'); hdr.style.cssText = 'padding:.4rem .6rem;font-weight:600;font-size:.6rem;text-transform:uppercase;letter-spacing:.04em;opacity:.7;'; hdr.textContent = title;
      const body = document.createElement('div'); body.style.cssText = 'flex:1;padding:.2rem .6rem .5rem;display:flex;flex-direction:column;justify-content:center;';
      const big = document.createElement('div'); big.style.cssText = 'font-size:1.2rem;font-weight:700;color:#fff;line-height:1.1;'; big.textContent = value;
      body.appendChild(big); w.appendChild(hdr); w.appendChild(body);
      return w;
    }

    const grid = makeGrid({ gap: '8px', 'column-width': '80', 'row-height': '80', draggable: true }, [
      makeWidget('revenue', 'Revenue', '$48.2k', 0, { 'grid-col': '0', 'grid-row': '0', 'grid-colspan': '2', 'grid-rowspan': '2' }),
      makeWidget('users',   'Users',   '3,842',  1, { 'grid-col': '2', 'grid-row': '0' }),
      makeWidget('cpu',     'CPU',     '74%',    2, { 'grid-col': '3', 'grid-row': '0' }),
      makeWidget('orders',  'Orders',  '284',    3, { 'grid-col': '2', 'grid-row': '1', 'grid-colspan': '2' }),
      makeWidget('memory',  'Mem',     '61%',    4, { 'grid-col': '3', 'grid-row': '2' }),
      makeWidget('uptime',  'Uptime',  '99.9%',  7, { 'grid-col': '2', 'grid-row': '3' }),
    ]);
    return grid;
  },
};
