import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-flip-card';

type FlipCardDirection = 'horizontal' | 'vertical';

type Args = {
  direction?: FlipCardDirection;
  flipped?: boolean;
  clickToFlip?: boolean;
  duration?: number;
};

const DIRECTIONS: FlipCardDirection[] = ['horizontal', 'vertical'];

function makeFace(label: string, bg: string) {
  const face = document.createElement('div');
  face.style.cssText = `display:flex;align-items:center;justify-content:center;width:200px;height:140px;border-radius:8px;font-weight:600;background:${bg};color:white;`;
  face.textContent = label;
  return face;
}

function makeFlipCard(attrs: Record<string, string | boolean>, frontBg: string, frontLabel: string, backBg: string, backLabel: string) {
  const card = document.createElement('snice-flip-card');
  card.style.cssText = 'display:inline-block;width:200px;height:140px;';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) card.toggleAttribute(k, true); }
    else card.setAttribute(k, v);
  }
  const front = makeFace(frontLabel, frontBg); front.slot = 'front';
  const back  = makeFace(backLabel,  backBg);  back.slot  = 'back';
  card.appendChild(front); card.appendChild(back);
  return card;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:flex-start;gap:1.5rem;flex-wrap:wrap;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const BLUE   = 'var(--snice-color-primary,#2563eb)';
const GREEN  = 'var(--snice-color-success,#16a34a)';
const RED    = 'var(--snice-color-danger,#dc2626)';
const PURPLE = '#9333ea';

const meta: Meta<Args> = {
  title: 'FlipCard',
  component: 'snice-flip-card',
  tags: ['autodocs'],
  argTypes: {
    direction:  { control: 'select', options: DIRECTIONS },
    flipped:    { control: 'boolean' },
    clickToFlip:{ control: 'boolean' },
    duration:   { control: 'number' },
  },
  render: (args) => {
    const attrs: Record<string, string | boolean> = {
      direction: args.direction ?? 'horizontal',
    };
    if (args.flipped)     attrs['flipped'] = true;
    if (args.clickToFlip) attrs['click-to-flip'] = true;
    if (args.duration !== undefined) attrs['duration'] = String(args.duration);
    return makeFlipCard(attrs, BLUE, 'Front', GREEN, 'Back');
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { direction: 'horizontal', clickToFlip: true } };

// h2: Direction: horizontal (default)
export const DirectionHorizontal: Story = {
  render: () => row(makeFlipCard({ direction: 'horizontal' }, BLUE, 'Front (horizontal)', GREEN, 'Back (horizontal)')),
};

// h2: Direction: vertical
export const DirectionVertical: Story = {
  render: () => row(makeFlipCard({ direction: 'vertical' }, BLUE, 'Front (vertical)', GREEN, 'Back (vertical)')),
};

// h2: Direction Comparison
export const DirectionComparison: Story = {
  render: () => row(
    makeFlipCard({ direction: 'horizontal' }, BLUE,  'Horizontal', GREEN,  'Flipped'),
    makeFlipCard({ direction: 'vertical' },   RED,   'Vertical',   PURPLE, 'Flipped'),
  ),
};

// h2: click-to-flip: true (default)
export const ClickToFlipTrue: Story = {
  render: () => row(makeFlipCard({ 'click-to-flip': true }, BLUE, 'Click me', GREEN, 'Click again')),
};

// h2: click-to-flip: false (programmatic only)
export const ClickToFlipFalseProgrammatic: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;';
    const card = makeFlipCard({ 'click-to-flip': 'false' }, BLUE, 'No click flip', GREEN, 'Programmatic');
    const btnCol = document.createElement('div');
    btnCol.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;';

    const makeBtn = (label: string, handler: () => void) => {
      const btn = document.createElement('button');
      btn.style.cssText = 'padding:.4rem .8rem;border:1px solid var(--snice-color-border);border-radius:4px;background:var(--snice-color-background-element);color:var(--snice-color-text);cursor:pointer;font-size:.8rem;';
      btn.textContent = label;
      btn.addEventListener('click', handler);
      return btn;
    };

    btnCol.appendChild(makeBtn('flip()',          () => (card as any).flip?.()));
    btnCol.appendChild(makeBtn("flipTo('front')", () => (card as any).flipTo?.('front')));
    btnCol.appendChild(makeBtn("flipTo('back')",  () => (card as any).flipTo?.('back')));

    wrap.appendChild(card); wrap.appendChild(btnCol);
    return wrap;
  },
};

// h2: flipped: true (starts showing back)
export const FlippedTrue: Story = {
  render: () => row(makeFlipCard({ flipped: true }, BLUE, 'Front', GREEN, 'Started Flipped')),
};

// h2: Duration: 200ms (fast)
export const Duration200ms: Story = {
  render: () => row(makeFlipCard({ duration: '200' }, BLUE, '200ms', GREEN, 'Fast')),
};

// h2: Duration: 600ms (default)
export const Duration600ms: Story = {
  render: () => row(makeFlipCard({ duration: '600' }, BLUE, '600ms', GREEN, 'Default')),
};

// h2: Duration: 1500ms (slow)
export const Duration1500ms: Story = {
  render: () => row(makeFlipCard({ duration: '1500' }, BLUE, '1500ms', GREEN, 'Slow')),
};

// h2: Duration Comparison
export const DurationComparison: Story = {
  render: () => row(
    makeFlipCard({ duration: '100' },  BLUE, '100ms',  GREEN, '100ms'),
    makeFlipCard({ duration: '400' },  BLUE, '400ms',  GREEN, '400ms'),
    makeFlipCard({ duration: '800' },  BLUE, '800ms',  GREEN, '800ms'),
    makeFlipCard({ duration: '2000' }, BLUE, '2000ms', GREEN, '2000ms'),
  ),
};

// h2: Direction x Duration Combinations
export const DirectionXDurationCombinations: Story = {
  render: () => row(
    makeFlipCard({ direction: 'horizontal', duration: '300' },  BLUE, 'H + 300ms',  GREEN,  'Flipped'),
    makeFlipCard({ direction: 'vertical',   duration: '300' },  RED,  'V + 300ms',  PURPLE, 'Flipped'),
    makeFlipCard({ direction: 'horizontal', duration: '1000' }, BLUE, 'H + 1000ms', GREEN,  'Flipped'),
    makeFlipCard({ direction: 'vertical',   duration: '1000' }, RED,  'V + 1000ms', PURPLE, 'Flipped'),
  ),
};

// h2: Rich Slot Content
export const RichSlotContent: Story = {
  render: () => {
    const card = document.createElement('snice-flip-card');
    card.style.cssText = 'display:inline-block;width:250px;height:180px;';
    const front = document.createElement('div');
    front.slot = 'front';
    front.style.cssText = 'width:250px;height:180px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:8px;';
    const emoji = document.createElement('div'); emoji.style.fontSize = '2rem'; emoji.textContent = '📦';
    const title = document.createElement('div'); title.style.cssText = 'font-weight:600;margin-top:.5rem;'; title.textContent = 'Product Card';
    const hint  = document.createElement('div'); hint.style.cssText = 'font-size:.75rem;opacity:.8;'; hint.textContent = 'Click to see details';
    front.appendChild(emoji); front.appendChild(title); front.appendChild(hint);

    const back = document.createElement('div');
    back.slot = 'back';
    back.style.cssText = 'width:250px;height:180px;background:white;color:#333;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:8px;border:1px solid #ddd;padding:1rem;box-sizing:border-box;';
    const btitle = document.createElement('div'); btitle.style.fontWeight = '600'; btitle.textContent = 'Product Details';
    const bdesc  = document.createElement('div'); bdesc.style.cssText = 'font-size:.8rem;margin-top:.5rem;text-align:center;'; bdesc.textContent = 'High-quality widget with premium features. $29.99';
    back.appendChild(btitle); back.appendChild(bdesc);

    card.appendChild(front); card.appendChild(back);
    return row(card);
  },
};

// h2: CSS Parts Styling
export const CSSPartsStyling: Story = {
  render: () => {
    // Parts: base, front, back
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; }
      .parts-demo-col { display: flex; flex-direction: column; gap: 0.5rem; align-items: center; }
      .parts-demo-label { font-size: 0.65rem; color: #888; }
      .styled-flip::part(base) {
        border-radius: 1.25rem;
        box-shadow: 0 8px 32px rgba(99, 102, 241, 0.4);
      }
      .styled-flip::part(front) {
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        border-radius: 1.25rem;
        border: 3px solid #a78bfa;
      }
      .styled-flip::part(back) {
        background: linear-gradient(135deg, #0f172a, #1e293b);
        border-radius: 1.25rem;
        border: 3px solid #38bdf8;
      }
    `;
    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.className = 'parts-demo';

    // Default
    const col1 = document.createElement('div'); col1.className = 'parts-demo-col';
    const d = makeFlipCard({ 'click-to-flip': true }, BLUE, 'Front', GREEN, 'Back');
    const l1 = document.createElement('div'); l1.className = 'parts-demo-label'; l1.textContent = 'default (click to flip)';
    col1.appendChild(d); col1.appendChild(l1); wrap.appendChild(col1);

    // Styled
    const col2 = document.createElement('div'); col2.className = 'parts-demo-col';
    const front2 = document.createElement('div');
    front2.slot = 'front'; front2.style.cssText = 'display:flex;align-items:center;justify-content:center;width:200px;height:140px;color:white;font-weight:700;font-size:1rem;';
    front2.textContent = 'FRONT';
    const back2 = document.createElement('div');
    back2.slot = 'back'; back2.style.cssText = 'display:flex;align-items:center;justify-content:center;width:200px;height:140px;color:#38bdf8;font-weight:700;font-size:1rem;';
    back2.textContent = 'BACK';
    const stCard = document.createElement('snice-flip-card');
    stCard.className = 'styled-flip'; stCard.style.cssText = 'display:inline-block;width:200px;height:140px;';
    stCard.toggleAttribute('click-to-flip', true);
    stCard.appendChild(front2); stCard.appendChild(back2);
    const l2 = document.createElement('div'); l2.className = 'parts-demo-label'; l2.textContent = '::part(base|front|back) (click to flip)';
    col2.appendChild(stCard); col2.appendChild(l2); wrap.appendChild(col2);

    return wrap;
  },
};

// h2: Edge: Starts Flipped + No Click Flip
export const EdgeStartsFlippedNoClickFlip: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;';
    const card = makeFlipCard({ flipped: true, 'click-to-flip': 'false' }, BLUE, 'Front', GREEN, 'Starts on back');
    const btn = document.createElement('button');
    btn.style.cssText = 'padding:.4rem .8rem;border:1px solid var(--snice-color-border);border-radius:4px;background:var(--snice-color-background-element);color:var(--snice-color-text);cursor:pointer;font-size:.8rem;';
    btn.textContent = 'Toggle';
    btn.addEventListener('click', () => (card as any).flip?.());
    wrap.appendChild(card); wrap.appendChild(btn);
    return wrap;
  },
};
