import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-binpack';

type Args = {
  gap?: string;
  horizontal?: boolean;
  columnWidth?: number;
  rowHeight?: number;
  originLeft?: boolean;
  draggable?: boolean;
  transitionDuration?: string;
  stagger?: number;
};

const COLORS = [
  'var(--snice-color-primary,#2563eb)',
  'var(--snice-color-success,#16a34a)',
  'var(--snice-color-danger,#dc2626)',
  'rgb(139 92 246)',
  'rgb(234 179 8)',
  'rgb(236 72 153)',
  'rgb(20 184 166)',
  'rgb(249 115 22)',
];

function makeItem(label: string, width: string, height: string, colorIdx = 0) {
  const el = document.createElement('div');
  el.style.cssText = `display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:.75rem;font-weight:600;color:white;user-select:none;width:${width};height:${height};background:${COLORS[colorIdx % COLORS.length]};`;
  el.textContent = label;
  return el;
}

function makeBinpack(attrs: Record<string, string | boolean>, items: HTMLElement[]) {
  const el = document.createElement('snice-binpack');
  el.style.cssText = 'border:1px solid var(--snice-color-border,rgb(60 60 60));border-radius:6px;';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  items.forEach(i => el.appendChild(i));
  return el;
}

const meta: Meta<Args> = {
  title: 'Layout/Binpack',
  component: 'snice-binpack',
  tags: ['autodocs'],
  argTypes: {
    gap:               { control: 'text' },
    horizontal:        { control: 'boolean' },
    columnWidth:       { control: 'number' },
    rowHeight:         { control: 'number' },
    originLeft:        { control: 'boolean' },
    draggable:         { control: 'boolean' },
    transitionDuration:{ control: 'text' },
    stagger:           { control: 'number' },
  },
  render: (args) => {
    const attrs: Record<string, string | boolean> = {};
    if (args.gap               !== undefined) attrs['gap']                = args.gap;
    if (args.horizontal)                      attrs['horizontal']         = true;
    if (args.columnWidth       !== undefined) attrs['column-width']       = String(args.columnWidth);
    if (args.rowHeight         !== undefined) attrs['row-height']         = String(args.rowHeight);
    if (args.originLeft        === false)     attrs['origin-left']        = 'false';
    if (args.draggable)                       attrs['draggable']          = true;
    if (args.transitionDuration !== undefined) attrs['transition-duration']= args.transitionDuration;
    if (args.stagger            !== undefined) attrs['stagger']            = String(args.stagger);
    return makeBinpack(attrs, [
      makeItem('1', '6rem', '6rem', 0),
      makeItem('2', '8rem', '4rem', 1),
      makeItem('3', '5rem', '8rem', 2),
      makeItem('4', '7rem', '5rem', 3),
    ]);
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { gap: '0.5rem' } };

// h2: Draggable dashboard — drag widgets to rearrange
export const DraggableDashboard: Story = {
  render: () => {
    const bp = document.createElement('snice-binpack');
    bp.setAttribute('draggable', '');
    bp.setAttribute('gap', '8px');
    bp.setAttribute('column-width', '80');
    bp.setAttribute('row-height', '80');
    bp.style.cssText = 'border:1px solid var(--snice-color-border,rgb(60 60 60));border-radius:6px;';

    const widgets: Array<[string, string, string, string, string]> = [
      ['Revenue', 'c1', '168px', '168px', '$48.2k'],
      ['Users',   'c2', '80px',  '80px',  '3,842'],
      ['CPU',     'c3', '80px',  '80px',  '74%'],
      ['Uptime',  'c8', '80px',  '80px',  '99.9%'],
    ];

    const gradients: Record<string, string> = {
      c1: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
      c2: 'linear-gradient(135deg,#134e4a,#14b8a6)',
      c3: 'linear-gradient(135deg,#3b1764,#8b5cf6)',
      c8: 'linear-gradient(135deg,#1a2e05,#65a30d)',
    };

    for (const [name, cls, w, h, val] of widgets) {
      const widget = document.createElement('div');
      widget.style.cssText = `border-radius:8px;font-size:.7rem;color:#e0e0e0;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 2px 8px rgba(0,0,0,0.3);user-select:none;width:${w};height:${h};background:${gradients[cls]};`;
      widget.setAttribute('name', name.toLowerCase());
      const hdr = document.createElement('div');
      hdr.style.cssText = 'padding:.4rem .6rem;font-weight:600;font-size:.6rem;text-transform:uppercase;letter-spacing:.04em;opacity:.7;';
      hdr.textContent = name;
      const body = document.createElement('div');
      body.style.cssText = 'flex:1;padding:.2rem .6rem .5rem;display:flex;flex-direction:column;justify-content:center;';
      const big = document.createElement('div');
      big.style.cssText = 'font-size:1.2rem;font-weight:700;color:#fff;line-height:1.1;';
      big.textContent = val;
      body.appendChild(big); widget.appendChild(hdr); widget.appendChild(body);
      bp.appendChild(widget);
    }
    return bp;
  },
};

// h2: Default vertical packing
export const DefaultVerticalPacking: Story = {
  render: () => makeBinpack({ gap: '0.5rem' }, [
    makeItem('1', '6rem', '6rem', 0),
    makeItem('2', '8rem', '4rem', 1),
    makeItem('3', '5rem', '8rem', 2),
    makeItem('4', '10rem','5rem', 3),
    makeItem('5', '7rem', '7rem', 4),
    makeItem('6', '4rem', '4rem', 5),
    makeItem('7', '9rem', '3rem', 6),
    makeItem('8', '6rem', '5rem', 7),
  ]),
};

// h2: Horizontal packing
export const HorizontalPacking: Story = {
  render: () => {
    const el = makeBinpack({ gap: '8px', horizontal: true }, [
      makeItem('1', '80px', '100px', 0),
      makeItem('2', '80px', '60px',  1),
      makeItem('3', '80px', '80px',  2),
      makeItem('4', '80px', '120px', 3),
      makeItem('5', '80px', '70px',  4),
      makeItem('6', '80px', '90px',  5),
      makeItem('7', '80px', '60px',  6),
      makeItem('8', '80px', '100px', 7),
    ]);
    el.style.cssText += 'height:220px;overflow-x:auto;';
    return el;
  },
};

// h2: Grid-snapped layout
export const GridSnappedLayout: Story = {
  render: () => {
    const el = makeBinpack({ gap: '8px', 'column-width': '100', 'row-height': '100' }, [
      makeItem('1', '100px', '100px', 0),
      makeItem('2', '208px', '100px', 1),
      makeItem('3', '100px', '208px', 2),
      makeItem('4', '100px', '100px', 3),
      makeItem('5', '100px', '100px', 4),
      makeItem('6', '208px', '100px', 5),
      makeItem('7', '100px', '100px', 6),
      makeItem('8', '100px', '100px', 7),
    ]);
    el.style.cssText += 'max-width:440px;';
    return el;
  },
};

// h2: Origin direction
export const OriginDirection: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:2rem;flex-wrap:wrap;';

    const items1 = () => [
      makeItem('1', '6rem', '4rem', 0),
      makeItem('2', '8rem', '4rem', 1),
      makeItem('3', '5rem', '6rem', 2),
      makeItem('4', '7rem', '3rem', 3),
    ];

    const col1 = document.createElement('div');
    const lbl1 = document.createElement('div'); lbl1.style.cssText = 'font-size:.7rem;color:#888;margin-bottom:.25rem;'; lbl1.textContent = 'origin-left (default)';
    col1.appendChild(lbl1); col1.appendChild(makeBinpack({ gap: '0.5rem' }, items1()));

    const col2 = document.createElement('div');
    const lbl2 = document.createElement('div'); lbl2.style.cssText = 'font-size:.7rem;color:#888;margin-bottom:.25rem;'; lbl2.textContent = 'origin-left="false" (RTL)';
    col2.appendChild(lbl2); col2.appendChild(makeBinpack({ gap: '0.5rem', 'origin-left': 'false' }, items1()));

    wrap.appendChild(col1); wrap.appendChild(col2);
    return wrap;
  },
};

// h2: Stagger animation
export const StaggerAnimation: Story = {
  render: () => makeBinpack({ gap: '0.5rem', 'transition-duration': '0.6s', stagger: '50' }, [
    makeItem('1', '6rem', '5rem', 0),
    makeItem('2', '7rem', '4rem', 1),
    makeItem('3', '5rem', '7rem', 2),
    makeItem('4', '8rem', '4rem', 3),
    makeItem('5', '6rem', '6rem', 4),
    makeItem('6', '4rem', '4rem', 5),
    makeItem('7', '9rem', '3rem', 6),
    makeItem('8', '5rem', '5rem', 7),
  ]),
};

// h2: Dynamic items
export const DynamicItems: Story = {
  render: () => {
    const wrap = document.createElement('div');
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:.5rem;margin-bottom:.75rem;';

    const bp = makeBinpack({ gap: '0.5rem', 'transition-duration': '0.4s', stagger: '30' }, [
      makeItem('1', '6rem', '5rem', 0),
      makeItem('2', '7rem', '4rem', 1),
      makeItem('3', '5rem', '6rem', 2),
    ]);

    let count = 4;
    const makeBtn = (label: string, handler: () => void) => {
      const btn = document.createElement('button');
      btn.style.cssText = 'padding:.35rem .7rem;border:1px solid var(--snice-color-border,rgb(60 60 60));border-radius:6px;background:var(--snice-color-background-element);color:var(--snice-color-text);cursor:pointer;font-size:.75rem;';
      btn.textContent = label;
      btn.addEventListener('click', handler);
      return btn;
    };

    btnRow.appendChild(makeBtn('+ Add item', () => {
      const w = `${4 + Math.floor(Math.random() * 6)}rem`;
      const h = `${3 + Math.floor(Math.random() * 5)}rem`;
      bp.appendChild(makeItem(String(count++), w, h, count % COLORS.length));
    }));
    btnRow.appendChild(makeBtn('- Remove last', () => {
      const children = bp.children;
      if (children.length > 0) bp.removeChild(children[children.length - 1]);
    }));

    wrap.appendChild(btnRow); wrap.appendChild(bp);
    return wrap;
  },
};

// h2: Stamp — layout around a fixed element
export const StampLayoutAroundFixed: Story = {
  render: () => {
    const el = document.createElement('snice-binpack');
    el.setAttribute('gap', '0.5rem');
    el.style.cssText = 'border:1px solid var(--snice-color-border,rgb(60 60 60));border-radius:6px;';

    const stamped = document.createElement('div');
    stamped.style.cssText = 'display:flex;align-items:center;justify-content:center;width:10rem;height:10rem;border-radius:6px;font-size:.75rem;font-weight:600;color:white;user-select:none;background:rgba(255,255,255,0.08);border:2px dashed rgba(255,255,255,0.2);color:#888;';
    stamped.textContent = 'FIXED';

    const items = [
      makeItem('1', '5rem', '5rem', 0),
      makeItem('2', '6rem', '4rem', 1),
      makeItem('3', '4rem', '6rem', 2),
      makeItem('4', '7rem', '3rem', 3),
      makeItem('5', '4rem', '4rem', 5),
    ];

    el.appendChild(stamped);
    items.forEach(i => el.appendChild(i));
    return el;
  },
};

// h2: CSS Parts Styling
export const CSSPartsStyling: Story = {
  render: () => {
    // Parts: base
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start; }
      .parts-demo-label { font-size: 0.65rem; color: #888; margin-bottom: 0.25rem; }
      .styled-binpack::part(base) {
        background: linear-gradient(160deg, #1e1b4b 0%, #1e293b 100%);
        border: 2px solid #6366f1;
        border-radius: 0.75rem;
        padding: 0.75rem;
        box-shadow: 0 4px 24px rgba(99, 102, 241, 0.3);
      }
    `;
    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.className = 'parts-demo';

    const items = () => [
      makeItem('A', '6rem', '5rem', 0),
      makeItem('B', '8rem', '4rem', 1),
      makeItem('C', '5rem', '7rem', 2),
      makeItem('D', '7rem', '4rem', 3),
    ];

    const g1 = document.createElement('div');
    const l1 = document.createElement('div'); l1.className = 'parts-demo-label'; l1.textContent = 'default';
    g1.appendChild(l1); g1.appendChild(makeBinpack({ gap: '0.5rem' }, items())); wrap.appendChild(g1);

    const g2 = document.createElement('div');
    const l2 = document.createElement('div'); l2.className = 'parts-demo-label'; l2.textContent = '::part(base) → gradient container';
    const styled = makeBinpack({ gap: '0.5rem' }, items());
    styled.className = 'styled-binpack'; styled.style.border = 'none';
    g2.appendChild(l2); g2.appendChild(styled); wrap.appendChild(g2);

    return wrap;
  },
};

// h2: fit() — position a specific item
export const FitPositionASpecificItem: Story = {
  render: () => {
    const wrap = document.createElement('div');
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:.5rem;margin-bottom:.75rem;flex-wrap:wrap;';

    const bp = document.createElement('snice-binpack');
    bp.setAttribute('gap', '0.5rem');
    bp.style.cssText = 'border:1px solid var(--snice-color-border,rgb(60 60 60));border-radius:6px;';

    const target = makeItem('1', '6rem', '6rem', 5);
    bp.appendChild(target);
    [makeItem('2', '8rem', '4rem', 1), makeItem('3', '5rem', '8rem', 2), makeItem('4', '10rem', '5rem', 3)]
      .forEach(i => bp.appendChild(i));

    const makeBtn = (label: string, x: number, y: number) => {
      const btn = document.createElement('button');
      btn.style.cssText = 'padding:.35rem .7rem;border:1px solid var(--snice-color-border,rgb(60 60 60));border-radius:6px;background:var(--snice-color-background-element);color:var(--snice-color-text);cursor:pointer;font-size:.75rem;';
      btn.textContent = label;
      btn.addEventListener('click', () => (bp as any).fit?.(target, x, y));
      return btn;
    };

    btnRow.appendChild(makeBtn('Fit #1 → (0, 0)',     0,   0));
    btnRow.appendChild(makeBtn('Fit #1 → (200, 0)',   200, 0));
    btnRow.appendChild(makeBtn('Fit #1 → (100, 100)', 100, 100));

    wrap.appendChild(btnRow); wrap.appendChild(bp);
    return wrap;
  },
};
