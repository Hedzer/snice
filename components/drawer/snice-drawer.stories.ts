import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-drawer';
import './snice-drawer-target';
import type { DrawerPosition, DrawerSize } from './snice-drawer.types';

type Args = {
  position?: DrawerPosition;
  size?: DrawerSize;
  open?: boolean;
  contained?: boolean;
  noHeader?: boolean;
  noFooter?: boolean;
  noBackdrop?: boolean;
  persistent?: boolean;
  inline?: boolean;
};

const POSITIONS: DrawerPosition[] = ['left', 'right', 'top', 'bottom'];
const SIZES: DrawerSize[] = ['small', 'medium', 'large', 'full'];

function makeBox(height = '200px') {
  const box = document.createElement('div');
  box.style.cssText = `position:relative;border:1px solid var(--snice-color-border,#e2e2e2);border-radius:8px;overflow:hidden;height:${height};background:color-mix(in srgb,var(--snice-color-background,#fff) 90%,var(--snice-color-text,#000) 10%);`;
  return box;
}

function makeNav(...items: string[]) {
  const nav = document.createElement('nav');
  nav.style.cssText = 'display:flex;flex-direction:column;padding:0.5rem;';
  for (const item of items) {
    const a = document.createElement('a');
    a.href = '#';
    a.style.cssText = 'display:block;padding:0.4rem 0.75rem;font-size:0.8rem;color:var(--snice-color-text-secondary,#666);text-decoration:none;border-radius:4px;';
    a.textContent = item;
    nav.appendChild(a);
  }
  return nav;
}

function makeDrawer(attrs: Record<string, string | boolean>, ...children: HTMLElement[]) {
  const drawer = document.createElement('snice-drawer');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) drawer.toggleAttribute(k, true); }
    else drawer.setAttribute(k, v);
  }
  children.forEach(c => drawer.appendChild(c));
  return drawer;
}

function grid(...boxes: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem;';
  boxes.forEach(b => wrap.appendChild(b));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Layout/Drawer',
  component: 'snice-drawer',
  tags: ['autodocs'],
  argTypes: {
    position:   { control: 'select', options: POSITIONS },
    size:       { control: 'select', options: SIZES },
    open:       { control: 'boolean' },
    contained:  { control: 'boolean' },
    noHeader:   { control: 'boolean' },
    noFooter:   { control: 'boolean' },
    noBackdrop: { control: 'boolean' },
    persistent: { control: 'boolean' },
    inline:     { control: 'boolean' },
  },
  render: (args) => {
    const box = makeBox('200px');
    const drawer = makeDrawer({
      position:   args.position ?? 'left',
      size:       args.size     ?? 'small',
      contained:  true,
      open:       args.open     ?? true,
      'no-backdrop': true,
      'no-escape-dismiss': true,
      ...(args.noHeader   ? { 'no-header': true }   : {}),
      ...(args.noFooter   ? { 'no-footer': true }   : {}),
      ...(args.noBackdrop ? { 'no-backdrop': true }  : {}),
      ...(args.persistent ? { persistent: true }     : {}),
      ...(args.inline     ? { inline: true }         : {}),
    }, makeNav('Dashboard', 'Projects', 'Settings', 'Profile'));
    box.appendChild(drawer);
    return box;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { position: 'left', size: 'small', open: true } };

// h2: Positions
export const Positions: Story = {
  render: () => {
    const wrap = grid();
    const posConfigs: [DrawerPosition, string[]][] = [
      ['left',   ['Dashboard', 'Projects', 'Settings', 'Profile']],
      ['right',  ['Details', 'Activity', 'Comments', 'History']],
      ['top',    ['Home', 'Products', 'Pricing', 'About']],
      ['bottom', ['Save', 'Share', 'Export', 'Delete']],
    ];
    for (const [pos, items] of posConfigs) {
      const box = makeBox('200px');
      const lbl = document.createElement('span');
      lbl.style.cssText = 'position:absolute;top:.5rem;right:.5rem;font-size:.65rem;text-transform:uppercase;letter-spacing:.05em;color:var(--snice-color-text-tertiary,#888);z-index:9999;background:color-mix(in srgb,var(--snice-color-background,#fff) 90%,var(--snice-color-text,#000) 10%);padding:.15rem .4rem;border-radius:4px;pointer-events:none;';
      lbl.textContent = pos;
      const nav = pos === 'top' || pos === 'bottom'
        ? (() => {
            const d = document.createElement('div');
            d.style.cssText = 'display:flex;gap:1rem;justify-content:center;align-items:center;padding:.75rem;font-size:.8rem;color:var(--snice-color-text-secondary)';
            items.forEach(t => { const s = document.createElement('span'); s.textContent = t; d.appendChild(s); });
            return d;
          })()
        : makeNav(...items);
      const drawer = makeDrawer({ position: pos, size: 'small', contained: true, open: true, 'no-backdrop': true, 'no-escape-dismiss': true, 'no-header': true, 'no-footer': true }, nav);
      box.appendChild(lbl); box.appendChild(drawer);
      wrap.appendChild(box);
    }
    return wrap;
  },
};

// h2: Sizes
export const Sizes: Story = {
  render: () => {
    const wrap = grid();
    for (const size of SIZES) {
      const box = makeBox('200px');
      const lbl = document.createElement('span');
      lbl.style.cssText = 'position:absolute;top:.5rem;right:.5rem;font-size:.65rem;text-transform:uppercase;letter-spacing:.05em;color:var(--snice-color-text-tertiary,#888);z-index:9999;background:color-mix(in srgb,var(--snice-color-background,#fff) 90%,var(--snice-color-text,#000) 10%);padding:.15rem .4rem;border-radius:4px;pointer-events:none;';
      lbl.textContent = size;
      const drawer = makeDrawer({ position: 'left', size, contained: true, open: true, 'no-backdrop': true, 'no-escape-dismiss': true, 'no-header': true, 'no-footer': true }, makeNav('Home', 'Search', 'Saved'));
      box.appendChild(lbl); box.appendChild(drawer);
      wrap.appendChild(box);
    }
    return wrap;
  },
};

// h2: Features
export const Features: Story = {
  render: () => {
    const wrap = grid();

    // with header
    const box1 = makeBox('200px');
    const lbl1 = document.createElement('span');
    lbl1.style.cssText = 'position:absolute;top:.5rem;right:.5rem;font-size:.65rem;text-transform:uppercase;letter-spacing:.05em;color:var(--snice-color-text-tertiary,#888);z-index:9999;background:color-mix(in srgb,var(--snice-color-background,#fff) 90%,var(--snice-color-text,#000) 10%);padding:.15rem .4rem;border-radius:4px;pointer-events:none;';
    lbl1.textContent = 'with header';
    const title1 = document.createElement('span'); title1.slot = 'title'; title1.textContent = 'Navigation';
    const d1 = makeDrawer({ position: 'left', size: 'small', contained: true, open: true, 'no-backdrop': true, 'no-escape-dismiss': true, 'no-footer': true }, title1, makeNav('Dashboard', 'Projects', 'Settings'));
    box1.appendChild(lbl1); box1.appendChild(d1); wrap.appendChild(box1);

    // persistent
    const box2 = makeBox('200px');
    const lbl2 = document.createElement('span');
    lbl2.style.cssText = 'position:absolute;top:.5rem;right:.5rem;font-size:.65rem;text-transform:uppercase;letter-spacing:.05em;color:var(--snice-color-text-tertiary,#888);z-index:9999;background:color-mix(in srgb,var(--snice-color-background,#fff) 90%,var(--snice-color-text,#000) 10%);padding:.15rem .4rem;border-radius:4px;pointer-events:none;';
    lbl2.textContent = 'persistent';
    const title2 = document.createElement('span'); title2.slot = 'title'; title2.textContent = 'Persistent';
    const d2 = makeDrawer({ position: 'left', size: 'small', contained: true, open: true, 'no-backdrop': true, 'no-escape-dismiss': true, persistent: true, 'no-footer': true }, title2, makeNav('Home', 'Browse', 'Help'));
    box2.appendChild(lbl2); box2.appendChild(d2); wrap.appendChild(box2);

    // with footer
    const box3 = makeBox('200px');
    const lbl3 = document.createElement('span');
    lbl3.style.cssText = 'position:absolute;top:.5rem;right:.5rem;font-size:.65rem;text-transform:uppercase;letter-spacing:.05em;color:var(--snice-color-text-tertiary,#888);z-index:9999;background:color-mix(in srgb,var(--snice-color-background,#fff) 90%,var(--snice-color-text,#000) 10%);padding:.15rem .4rem;border-radius:4px;pointer-events:none;';
    lbl3.textContent = 'with footer';
    const ftrDiv = document.createElement('div'); ftrDiv.slot = 'footer'; ftrDiv.style.cssText = 'display:flex;gap:.5rem;justify-content:flex-end';
    const cancelBtn = document.createElement('button'); cancelBtn.style.cssText = 'padding:.25rem .75rem;border:1px solid var(--snice-color-border);border-radius:4px;background:var(--snice-color-background);color:var(--snice-color-text);cursor:pointer;font-size:.8rem'; cancelBtn.textContent = 'Cancel';
    const saveBtn = document.createElement('button'); saveBtn.style.cssText = 'padding:.25rem .75rem;border:none;border-radius:4px;background:var(--snice-color-primary,#2563eb);color:white;cursor:pointer;font-size:.8rem'; saveBtn.textContent = 'Save';
    ftrDiv.appendChild(cancelBtn); ftrDiv.appendChild(saveBtn);
    const d3 = makeDrawer({ position: 'left', size: 'small', contained: true, open: true, 'no-backdrop': true, 'no-escape-dismiss': true, 'no-header': true }, makeNav('General', 'Account'), ftrDiv);
    box3.appendChild(lbl3); box3.appendChild(d3); wrap.appendChild(box3);

    // no-backdrop
    const box4 = makeBox('200px');
    const lbl4 = document.createElement('span');
    lbl4.style.cssText = 'position:absolute;top:.5rem;right:.5rem;font-size:.65rem;text-transform:uppercase;letter-spacing:.05em;color:var(--snice-color-text-tertiary,#888);z-index:9999;background:color-mix(in srgb,var(--snice-color-background,#fff) 90%,var(--snice-color-text,#000) 10%);padding:.15rem .4rem;border-radius:4px;pointer-events:none;';
    lbl4.textContent = 'no-backdrop';
    const content4 = document.createElement('div'); content4.style.cssText = 'padding:1rem;font-size:.8rem;color:var(--snice-color-text-secondary)'; content4.textContent = 'Content visible behind';
    const d4 = makeDrawer({ position: 'right', size: 'small', contained: true, open: true, 'no-backdrop': true, 'no-escape-dismiss': true, 'no-header': true, 'no-footer': true }, makeNav('Info', 'Files', 'Tags'));
    box4.appendChild(lbl4); box4.appendChild(d4); box4.appendChild(content4); wrap.appendChild(box4);

    return wrap;
  },
};

// h2: Push Content
export const PushContent: Story = {
  render: () => {
    const box = makeBox('280px');
    const drawer = document.createElement('snice-drawer');
    drawer.id = 'd-push-story';
    drawer.setAttribute('push-content', '');
    drawer.setAttribute('contained', '');
    drawer.setAttribute('position', 'left');
    drawer.setAttribute('size', 'small');
    drawer.toggleAttribute('open', true);
    drawer.toggleAttribute('no-backdrop', true);
    drawer.toggleAttribute('no-escape-dismiss', true);
    drawer.toggleAttribute('no-footer', true);
    const title = document.createElement('span'); title.slot = 'title'; title.textContent = 'Navigation';
    drawer.appendChild(title);
    drawer.appendChild(makeNav('Dashboard', 'Projects', 'Team', 'Reports', 'Settings'));

    const target = document.createElement('snice-drawer-target');
    target.setAttribute('for', 'd-push-story');
    target.style.cssText = 'padding:1rem';
    const p = document.createElement('p'); p.style.cssText = 'font-size:.85rem;color:var(--snice-color-text-secondary);margin:0 0 .75rem'; p.textContent = 'This content shifts when the drawer opens.';
    const toggleBtn = document.createElement('button');
    toggleBtn.style.cssText = 'padding:.4rem .85rem;border:1px solid var(--snice-color-border);border-radius:6px;background:var(--snice-color-background-element);color:var(--snice-color-text);cursor:pointer;font-size:.8rem';
    toggleBtn.textContent = 'Toggle Push Drawer';
    toggleBtn.addEventListener('click', () => (drawer as any).toggle?.());
    target.appendChild(p); target.appendChild(toggleBtn);

    box.appendChild(drawer); box.appendChild(target);
    return box;
  },
};

// h2: Inline Mode
export const InlineMode: Story = {
  render: () => {
    const box = makeBox('280px');
    box.style.display = 'flex';
    const drawer = document.createElement('snice-drawer');
    drawer.toggleAttribute('inline', true);
    drawer.toggleAttribute('open', true);
    drawer.setAttribute('contained', '');
    drawer.setAttribute('position', 'left');
    drawer.setAttribute('size', 'small');
    drawer.toggleAttribute('no-footer', true);
    const title = document.createElement('span'); title.slot = 'title'; title.textContent = 'Sidebar';
    drawer.appendChild(title);
    drawer.appendChild(makeNav('Home', 'Explore', 'Notifications', 'Messages', 'Settings'));
    const main = document.createElement('div');
    main.style.cssText = 'flex:1;padding:1rem;font-size:.85rem;color:var(--snice-color-text-secondary)';
    main.textContent = 'Main content beside inline drawer. No backdrop, no focus trap.';
    box.appendChild(drawer); box.appendChild(main);
    return box;
  },
};

// h2: Position + Size Combos
export const PositionSizeCombos: Story = {
  render: () => {
    const wrap = grid();
    const combos: [DrawerPosition, DrawerSize, string][] = [
      ['right',  'small', 'right + small'],
      ['top',    'small', 'top + small'],
      ['bottom', 'small', 'bottom + small'],
      ['left',   'large', 'left + large'],
    ];
    for (const [pos, size, labelText] of combos) {
      const box = makeBox('200px');
      const lbl = document.createElement('span');
      lbl.style.cssText = 'position:absolute;top:.5rem;right:.5rem;font-size:.65rem;text-transform:uppercase;letter-spacing:.05em;color:var(--snice-color-text-tertiary,#888);z-index:9999;background:color-mix(in srgb,var(--snice-color-background,#fff) 90%,var(--snice-color-text,#000) 10%);padding:.15rem .4rem;border-radius:4px;pointer-events:none;';
      lbl.textContent = labelText;
      let content: HTMLElement;
      if (pos === 'top' || pos === 'bottom') {
        content = document.createElement('div');
        content.style.cssText = 'display:flex;gap:1.5rem;justify-content:center;align-items:center;padding:.75rem;font-size:.8rem';
        ['Overview', 'Analytics', 'Reports'].forEach(t => { const s = document.createElement('span'); s.textContent = t; content.appendChild(s); });
      } else {
        content = makeNav('Filters', 'Sort', 'Group');
      }
      const drawer = makeDrawer({ position: pos, size, contained: true, open: true, 'no-backdrop': true, 'no-escape-dismiss': true, 'no-header': true, 'no-footer': true }, content);
      box.appendChild(lbl); box.appendChild(drawer);
      wrap.appendChild(box);
    }
    return wrap;
  },
};
