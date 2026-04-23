import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-action-bar';
import '../button/snice-button';
import type { ActionBarPosition, ActionBarSize, ActionBarVariant } from './snice-action-bar.types';

type Args = {
  position?: ActionBarPosition;
  size?: ActionBarSize;
  variant?: ActionBarVariant;
  open?: boolean;
  noAnimation?: boolean;
};

const POSITIONS: ActionBarPosition[] = ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
const SIZES: ActionBarSize[] = ['small', 'medium'];
const VARIANTS: ActionBarVariant[] = ['default', 'pill'];

function makeCard(label: string, height = '9rem', width = '14rem') {
  const card = document.createElement('div');
  card.style.cssText = `position:relative;width:${width};height:${height};background:var(--snice-color-background-element,#fcfbf9);border:1px solid var(--snice-color-border,#e2e2e2);border-radius:0.5rem;padding:1rem;display:flex;align-items:center;justify-content:center;color:var(--snice-color-text-secondary,#525252);font-size:0.75rem;`;
  card.textContent = label;
  return card;
}

function makeBtn(emoji: string, variant = 'text') {
  const btn = document.createElement('snice-button');
  btn.setAttribute('variant', variant);
  btn.toggleAttribute('circle', true);
  btn.setAttribute('size', 'small');
  btn.textContent = emoji;
  return btn;
}

function makeActionBar(attrs: Record<string, string | boolean> = {}, ...buttons: HTMLElement[]) {
  const bar = document.createElement('snice-action-bar');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) bar.toggleAttribute(k, true); }
    else bar.setAttribute(k, v);
  }
  buttons.forEach(b => bar.appendChild(b));
  return bar;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:1.5rem;flex-wrap:wrap;align-items:flex-start;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'ActionBar',
  component: 'snice-action-bar',
  tags: ['autodocs'],
  argTypes: {
    position:    { control: 'select', options: POSITIONS },
    size:        { control: 'select', options: SIZES },
    variant:     { control: 'select', options: VARIANTS },
    open:        { control: 'boolean' },
    noAnimation: { control: 'boolean' },
  },
  render: (args) => {
    const card = makeCard('Hover or use controls');
    const bar = makeActionBar({
      position:    args.position    ?? 'bottom',
      size:        args.size        ?? 'medium',
      variant:     args.variant     ?? 'default',
      ...(args.open        ? { open: true }         : {}),
      ...(args.noAnimation ? { 'no-animation': true }: {}),
    }, makeBtn('✏️'), makeBtn('📋'), makeBtn('🗑️', 'danger'));
    if (!args.open) {
      card.addEventListener('mouseenter', () => (bar as any).show?.());
      card.addEventListener('mouseleave', () => (bar as any).hide?.());
    }
    card.appendChild(bar);
    return card;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { position: 'bottom', size: 'medium', variant: 'default' } };

// h2: Variants
export const Variants: Story = {
  render: () => {
    const wrap = row();
    for (const variant of VARIANTS) {
      const card = makeCard(variant);
      const bar = makeActionBar({ position: 'bottom', variant }, makeBtn('✏️'), makeBtn('📋'), makeBtn('🗑️', 'danger'));
      card.addEventListener('mouseenter', () => (bar as any).show?.());
      card.addEventListener('mouseleave', () => (bar as any).hide?.());
      card.appendChild(bar);
      const col = document.createElement('div');
      const lbl = document.createElement('div');
      lbl.style.cssText = 'text-align:center;font-size:0.65rem;color:#888;margin-top:0.25rem;';
      lbl.textContent = variant;
      col.appendChild(card);
      col.appendChild(lbl);
      wrap.appendChild(col);
    }
    return wrap;
  },
};

// h2: Sizes
export const Sizes: Story = {
  render: () => {
    const wrap = row();
    for (const size of SIZES) {
      const card = makeCard(size);
      const bar = makeActionBar({ position: 'bottom', variant: 'pill', size }, makeBtn('⭐'), makeBtn('📤'), makeBtn('🔖'));
      card.addEventListener('mouseenter', () => (bar as any).show?.());
      card.addEventListener('mouseleave', () => (bar as any).hide?.());
      card.appendChild(bar);
      const col = document.createElement('div');
      const lbl = document.createElement('div');
      lbl.style.cssText = 'text-align:center;font-size:0.65rem;color:#888;margin-top:0.25rem;';
      lbl.textContent = size;
      col.appendChild(card);
      col.appendChild(lbl);
      wrap.appendChild(col);
    }
    return wrap;
  },
};

// h2: All positions (hover to reveal)
export const AllPositions: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
    const positions: ActionBarPosition[] = ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
    for (const pos of positions) {
      const card = makeCard(pos);
      const bar = makeActionBar({ position: pos, size: 'small', variant: 'pill' }, makeBtn('📌'));
      card.addEventListener('mouseenter', () => (bar as any).show?.());
      card.addEventListener('mouseleave', () => (bar as any).hide?.());
      card.appendChild(bar);
      const col = document.createElement('div');
      const lbl = document.createElement('div');
      lbl.style.cssText = 'text-align:center;font-size:0.65rem;color:#888;margin-top:0.25rem;';
      lbl.textContent = pos;
      col.appendChild(card);
      col.appendChild(lbl);
      wrap.appendChild(col);
    }
    return wrap;
  },
};

// h2: Always visible (no-animation)
export const AlwaysVisible: Story = {
  render: () => {
    const wrap = row();
    const card1 = makeCard('Always visible');
    card1.appendChild(makeActionBar({ position: 'top-right', size: 'small', 'no-animation': true }, makeBtn('✏️'), makeBtn('🗑️', 'danger')));
    const lbl1 = document.createElement('div');
    lbl1.style.cssText = 'text-align:center;font-size:0.65rem;color:#888;margin-top:0.25rem;';
    lbl1.textContent = 'no-animation';
    const col1 = document.createElement('div');
    col1.appendChild(card1); col1.appendChild(lbl1);

    const card2 = makeCard('Pill always visible');
    card2.appendChild(makeActionBar({ position: 'bottom', variant: 'pill', 'no-animation': true }, makeBtn('💾'), makeBtn('📤')));
    const lbl2 = document.createElement('div');
    lbl2.style.cssText = 'text-align:center;font-size:0.65rem;color:#888;margin-top:0.25rem;';
    lbl2.textContent = 'no-animation + pill';
    const col2 = document.createElement('div');
    col2.appendChild(card2); col2.appendChild(lbl2);

    wrap.appendChild(col1); wrap.appendChild(col2);
    return wrap;
  },
};

// h2: Keyboard navigation
export const KeyboardNavigation: Story = {
  render: () => {
    const card = makeCard('Focus a button, then use arrow keys\n(Escape closes the bar)', '12rem', '20rem');
    const bar = makeActionBar({ open: true, position: 'bottom', variant: 'pill' },
      makeBtn('⭐'), makeBtn('💬'), makeBtn('🔁'), makeBtn('🔖'));
    card.appendChild(bar);
    return card;
  },
};

// h2: CSS Parts Styling
export const CSSPartsStyling: Story = {
  render: () => {
    // Parts: base
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start; }
      .parts-demo-col { display: flex; flex-direction: column; gap: 0.5rem; align-items: center; }
      .parts-demo-label { font-size: 0.65rem; color: #888; text-align: center; }
      .styled-action-bar::part(base) {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border-radius: 2rem;
        box-shadow: 0 4px 24px rgba(99, 102, 241, 0.5);
        padding: 0.25rem;
        border: 2px solid #a78bfa;
      }
    `;
    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.className = 'parts-demo';

    // Default
    const col1 = document.createElement('div'); col1.className = 'parts-demo-col';
    const card1 = document.createElement('div');
    card1.style.cssText = 'position:relative;width:12rem;height:8rem;background:var(--snice-color-background-element,#fcfbf9);border:1px solid var(--snice-color-border,#e2e2e2);border-radius:0.5rem;display:flex;align-items:center;justify-content:center;font-size:.75rem;color:#888;';
    card1.textContent = 'Default ::part(base)';
    const bar1 = document.createElement('snice-action-bar');
    bar1.setAttribute('position', 'bottom'); bar1.toggleAttribute('no-animation', true);
    const b1a = document.createElement('snice-button'); b1a.setAttribute('variant', 'text'); b1a.toggleAttribute('circle', true); b1a.setAttribute('size', 'small'); b1a.textContent = '✏️';
    const b1b = document.createElement('snice-button'); b1b.setAttribute('variant', 'text'); b1b.toggleAttribute('circle', true); b1b.setAttribute('size', 'small'); b1b.textContent = '📋';
    bar1.appendChild(b1a); bar1.appendChild(b1b); card1.appendChild(bar1);
    const lbl1 = document.createElement('div'); lbl1.className = 'parts-demo-label'; lbl1.textContent = 'default';
    col1.appendChild(card1); col1.appendChild(lbl1); wrap.appendChild(col1);

    // Styled
    const col2 = document.createElement('div'); col2.className = 'parts-demo-col';
    const card2 = document.createElement('div');
    card2.style.cssText = 'position:relative;width:12rem;height:8rem;background:var(--snice-color-background-element,#fcfbf9);border:1px solid var(--snice-color-border,#e2e2e2);border-radius:0.5rem;display:flex;align-items:center;justify-content:center;font-size:.75rem;color:#888;';
    card2.textContent = 'Styled ::part(base)';
    const bar2 = document.createElement('snice-action-bar');
    bar2.className = 'styled-action-bar';
    bar2.setAttribute('position', 'bottom'); bar2.toggleAttribute('no-animation', true);
    const b2a = document.createElement('snice-button'); b2a.setAttribute('variant', 'text'); b2a.toggleAttribute('circle', true); b2a.setAttribute('size', 'small'); b2a.textContent = '⭐';
    const b2b = document.createElement('snice-button'); b2b.setAttribute('variant', 'text'); b2b.toggleAttribute('circle', true); b2b.setAttribute('size', 'small'); b2b.textContent = '💾';
    bar2.appendChild(b2a); bar2.appendChild(b2b); card2.appendChild(bar2);
    const lbl2 = document.createElement('div'); lbl2.className = 'parts-demo-label'; lbl2.textContent = '::part(base) → gradient + glow';
    col2.appendChild(card2); col2.appendChild(lbl2); wrap.appendChild(col2);

    return wrap;
  },
};

// h2: Programmatic control
export const ProgrammaticControl: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.cssText = 'display:flex;flex-direction:column;gap:0.75rem;';

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:0.5rem;';

    const card = makeCard('', '12rem', '20rem');
    const bar = makeActionBar({ position: 'bottom', variant: 'pill' },
      makeBtn('👍'), makeBtn('👎'), makeBtn('↩️'));
    card.appendChild(bar);

    const showBtn = document.createElement('snice-button');
    showBtn.setAttribute('size', 'small'); showBtn.textContent = 'show()';
    showBtn.addEventListener('click', () => (bar as any).show?.());

    const hideBtn = document.createElement('snice-button');
    hideBtn.setAttribute('size', 'small'); hideBtn.textContent = 'hide()';
    hideBtn.addEventListener('click', () => (bar as any).hide?.());

    const toggleBtn = document.createElement('snice-button');
    toggleBtn.setAttribute('size', 'small'); toggleBtn.textContent = 'toggle()';
    toggleBtn.addEventListener('click', () => (bar as any).toggle?.());

    btnRow.appendChild(showBtn); btnRow.appendChild(hideBtn); btnRow.appendChild(toggleBtn);
    container.appendChild(btnRow); container.appendChild(card);
    return container;
  },
};
