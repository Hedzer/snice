import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-tooltip';

type Args = {
  content?: string;
  position?: string;
  trigger?: 'hover' | 'click' | 'focus' | 'manual';
  arrow?: boolean;
  delay?: number;
  hideDelay?: number;
  offset?: number;
  maxWidth?: number;
  strictPositioning?: boolean;
  open?: boolean;
};

const POSITIONS = ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'left', 'left-start', 'left-end', 'right', 'right-start', 'right-end'];

function makeBtn(label: string): HTMLElement {
  const btn = document.createElement('button');
  btn.style.cssText = 'padding:0.5rem 1rem;border:1px solid rgba(128,128,128,0.2);border-radius:6px;background:transparent;cursor:pointer;font-size:0.8rem;';
  btn.textContent = label;
  return btn;
}

function makeTooltip(content: string, attrs: Record<string, string | boolean | number>, targetEl: HTMLElement): HTMLElement {
  const tt = document.createElement('snice-tooltip');
  tt.setAttribute('content', content);
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) tt.toggleAttribute(k, true); else tt.setAttribute(k, 'false'); }
    else tt.setAttribute(k, String(v));
  }
  tt.appendChild(targetEl);
  return tt;
}

function row(...els: HTMLElement[]): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;padding:2rem 0;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Tooltip',
  component: 'snice-tooltip',
  tags: ['autodocs'],
  argTypes: {
    content:           { control: 'text' },
    position:          { control: 'select', options: POSITIONS },
    trigger:           { control: 'select', options: ['hover', 'click', 'focus', 'manual'] },
    arrow:             { control: 'boolean' },
    delay:             { control: 'number' },
    hideDelay:         { control: 'number' },
    offset:            { control: 'number' },
    maxWidth:          { control: 'number' },
    strictPositioning: { control: 'boolean' },
    open:              { control: 'boolean' },
  },
  render: (args) => {
    const tt = document.createElement('snice-tooltip');
    if (args.content !== undefined)           tt.setAttribute('content', args.content);
    if (args.position !== undefined)          tt.setAttribute('position', args.position);
    if (args.trigger !== undefined)           tt.setAttribute('trigger', args.trigger);
    if (args.delay !== undefined)             tt.setAttribute('delay', String(args.delay));
    if (args.hideDelay !== undefined)         tt.setAttribute('hide-delay', String(args.hideDelay));
    if (args.offset !== undefined)            tt.setAttribute('offset', String(args.offset));
    if (args.maxWidth !== undefined)          tt.setAttribute('max-width', String(args.maxWidth));
    if (args.arrow !== undefined) {
      if (args.arrow) tt.toggleAttribute('arrow', true);
      else tt.setAttribute('arrow', 'false');
    }
    if (args.strictPositioning) tt.toggleAttribute('strict-positioning', true);
    if (args.open) tt.toggleAttribute('open', true);
    tt.appendChild(makeBtn('Hover me'));
    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding:4rem;display:flex;';
    wrap.appendChild(tt);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { content: 'Tooltip content', position: 'top', trigger: 'hover' },
};

// h2: Position: All 12 Positions
export const PositionAll12Positions: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:1rem;padding:3rem;';
    const positions = [
      ['top', 'Top'],
      ['top-start', 'top-start'],
      ['top-end', 'top-end'],
      ['bottom', 'Bottom'],
      ['bottom-start', 'bottom-start'],
      ['bottom-end', 'bottom-end'],
      ['left', 'Left'],
      ['left-start', 'left-start'],
      ['left-end', 'left-end'],
      ['right', 'Right'],
      ['right-start', 'right-start'],
      ['right-end', 'right-end'],
    ];
    positions.forEach(([pos, label]) => {
      grid.appendChild(makeTooltip(label.charAt(0).toUpperCase() + label.slice(1), { position: pos }, makeBtn(label)));
    });
    return grid;
  },
};

// h2: Trigger: hover (default), click, focus, manual
export const TriggerHoverDefaultClickFocusManual: Story = {
  render: () => {
    const wrap = row(
      makeTooltip('Hover trigger (default)', { trigger: 'hover' }, makeBtn('Hover me')),
      makeTooltip('Click trigger', { trigger: 'click' }, makeBtn('Click me')),
    );
    // Focus trigger with input
    const focusTip = document.createElement('snice-tooltip');
    focusTip.setAttribute('content', 'Focus trigger');
    focusTip.setAttribute('trigger', 'focus');
    const input = document.createElement('input');
    input.style.cssText = 'padding:0.5rem 1rem;border:1px solid rgba(128,128,128,0.2);border-radius:6px;background:transparent;font-size:0.8rem;width:120px;';
    input.placeholder = 'Focus me';
    focusTip.appendChild(input);
    wrap.appendChild(focusTip);
    // Manual trigger
    const manualTip = document.createElement('snice-tooltip') as any;
    manualTip.setAttribute('content', 'Manual trigger');
    manualTip.setAttribute('trigger', 'manual');
    const toggleBtn = makeBtn('Toggle manual');
    toggleBtn.addEventListener('click', () => { manualTip.open = !manualTip.open; });
    manualTip.appendChild(toggleBtn);
    wrap.appendChild(manualTip);
    return wrap;
  },
};

// h2: Arrow: true (default) vs false
export const ArrowTrueDefaultVsFalse: Story = {
  render: () => row(
    makeTooltip('With arrow', { arrow: true }, makeBtn('Arrow on')),
    makeTooltip('No arrow', { arrow: 'false' as any }, makeBtn('Arrow off')),
  ),
};

// h2: Delay & Hide Delay
export const DelayHideDelay: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;padding:2rem 0;';
    const r1 = row(
      makeTooltip('No delay (default)', { delay: '0' }, makeBtn('0ms delay')),
      makeTooltip('200ms delay', { delay: '200' }, makeBtn('200ms delay')),
      makeTooltip('500ms delay', { delay: '500' }, makeBtn('500ms delay')),
      makeTooltip('1000ms delay', { delay: '1000' }, makeBtn('1s delay')),
    );
    r1.style.padding = '0';
    const r2 = row(
      makeTooltip('No hide delay', { 'hide-delay': '0' }, makeBtn('0ms hide')),
      makeTooltip('300ms hide delay', { 'hide-delay': '300' }, makeBtn('300ms hide')),
      makeTooltip('1000ms hide delay', { 'hide-delay': '1000' }, makeBtn('1s hide')),
    );
    r2.style.padding = '0';
    wrap.appendChild(r1);
    wrap.appendChild(r2);
    return wrap;
  },
};

// h2: Offset Values
export const OffsetValues: Story = {
  render: () => row(
    makeTooltip('offset=4', { offset: '4' }, makeBtn('4px')),
    makeTooltip('offset=12 (default)', { offset: '12' }, makeBtn('12px')),
    makeTooltip('offset=24', { offset: '24' }, makeBtn('24px')),
    makeTooltip('offset=40', { offset: '40' }, makeBtn('40px')),
  ),
};

// h2: Max Width
export const MaxWidth: Story = {
  render: () => row(
    makeTooltip('Short', { 'max-width': '100' }, makeBtn('100px max')),
    makeTooltip('Default max width is 250px for tooltip content', { 'max-width': '250' }, makeBtn('250px (default)')),
    makeTooltip('This tooltip has a wider max width of 400px, allowing for more content', { 'max-width': '400' }, makeBtn('400px max')),
  ),
};

// h2: Strict Positioning (no auto-flip)
export const StrictPositioningNoAutoFlip: Story = {
  render: () => row(
    makeTooltip('Will not flip', { position: 'top', 'strict-positioning': true }, makeBtn('Strict top')),
    makeTooltip('Will auto-flip if needed', { position: 'top' }, makeBtn('Auto-flip top')),
  ),
};

// h2: Long Content
export const LongContent: Story = {
  render: () => row(
    makeTooltip('This is a very long tooltip message that demonstrates how the tooltip handles word wrapping and longer text content within the defined max-width constraint.', {}, makeBtn('Long text')),
    makeTooltip('Short', {}, makeBtn('Short text')),
  ),
};

// h2: Attribute-Based Tooltips (tooltip attribute)
export const AttributeBasedTooltipsTooltipAttribute: Story = {
  render: () => {
    const wrap = row();
    const items = [
      { label: 'tooltip attr', tooltip: 'Save changes' },
      { label: 'Bottom via CSS var', tooltip: 'Delete item' },
      { label: 'Click trigger via CSS', tooltip: 'Click tooltip' },
      { label: '500ms delay via CSS', tooltip: 'Delayed' },
      { label: 'No arrow via CSS', tooltip: 'No arrow' },
    ];
    items.forEach(item => {
      const btn = makeBtn(item.label);
      btn.setAttribute('tooltip', item.tooltip);
      wrap.appendChild(btn);
    });
    return wrap;
  },
};

// h2: Trigger x Position Combinations
export const TriggerXPositionCombinations: Story = {
  render: () => row(
    makeTooltip('Hover + Bottom', { trigger: 'hover', position: 'bottom' }, makeBtn('Hover bottom')),
    makeTooltip('Click + Left', { trigger: 'click', position: 'left' }, makeBtn('Click left')),
  ),
};

// h2: Different Trigger Elements
export const DifferentTriggerElements: Story = {
  render: () => {
    const wrap = row();
    const span1 = document.createElement('span');
    span1.style.cssText = 'text-decoration:underline;cursor:help;';
    span1.textContent = 'Underlined text';
    wrap.appendChild(makeTooltip('Tooltip on a span', {}, span1));

    const span2 = document.createElement('span');
    span2.style.cssText = 'font-size:1.5rem;cursor:help;';
    span2.textContent = 'ℹ';
    wrap.appendChild(makeTooltip('Tooltip on an icon', {}, span2));

    const div = document.createElement('div');
    div.style.cssText = 'width:80px;height:40px;background:rgba(59,130,246,0.1);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;cursor:help;';
    div.textContent = 'Div';
    wrap.appendChild(makeTooltip('Tooltip on a div', {}, div));

    return wrap;
  },
};

// h2: Open Attribute (manual control)
export const OpenAttributeManualControl: Story = {
  render: () => {
    const wrap = row();
    const tt = document.createElement('snice-tooltip');
    tt.setAttribute('content', 'Manually opened');
    tt.setAttribute('trigger', 'manual');
    tt.toggleAttribute('open', true);
    const span = makeBtn('Open by default');
    tt.appendChild(span);
    wrap.appendChild(tt);
    return wrap;
  },
};

// h2: CSS Parts Styling
// Parts available: trigger, tooltip, content, arrow
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'tt-parts-demo';

    const style = document.createElement('style');
    style.textContent = `
      .tt-parts-demo { display: flex; flex-direction: column; gap: 2rem; padding: 1rem; }
      .tt-parts-demo .demo-row { display: flex; align-items: center; gap: 2rem; padding: 1.5rem 0; }
      .tt-parts-demo .demo-label {
        font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.06em; color: #888; min-width: 160px;
      }

      /* Styled tooltip trigger */
      .tt-parts-demo .styled-tt::part(trigger) {
        outline: 2px dashed #f59e0b;
        outline-offset: 3px;
        border-radius: 4px;
      }
      /* Styled tooltip popup */
      .tt-parts-demo .styled-tt::part(tooltip) {
        background: linear-gradient(135deg, #1e3a5f, #0f2540);
        border: 1px solid #3b82f6;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
      }
      /* Styled tooltip content text */
      .tt-parts-demo .styled-tt::part(content) {
        color: #93c5fd;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.03em;
        padding: 0.4rem 0.8rem;
      }
      /* Styled arrow */
      .tt-parts-demo .styled-tt::part(arrow) {
        border-top-color: #3b82f6;
      }
    `;
    wrap.appendChild(style);

    const row1 = document.createElement('div');
    row1.className = 'demo-row';
    const lbl1 = document.createElement('div');
    lbl1.className = 'demo-label';
    lbl1.textContent = 'Default (hover to see)';
    row1.appendChild(lbl1);
    row1.appendChild(makeTooltip('Default tooltip', { arrow: true }, makeBtn('Hover me')));
    wrap.appendChild(row1);

    const row2 = document.createElement('div');
    row2.className = 'demo-row';
    const lbl2 = document.createElement('div');
    lbl2.className = 'demo-label';
    lbl2.textContent = 'Styled via ::part() (hover to see)';
    row2.appendChild(lbl2);
    const styledTt = document.createElement('snice-tooltip');
    styledTt.className = 'styled-tt';
    styledTt.setAttribute('content', 'Styled tooltip!');
    styledTt.toggleAttribute('arrow', true);
    styledTt.appendChild(makeBtn('Hover me'));
    row2.appendChild(styledTt);
    wrap.appendChild(row2);

    const row3 = document.createElement('div');
    row3.className = 'demo-row';
    const lbl3 = document.createElement('div');
    lbl3.className = 'demo-label';
    lbl3.textContent = 'Styled — open (always visible)';
    row3.appendChild(lbl3);
    const alwaysOpen = document.createElement('snice-tooltip');
    alwaysOpen.className = 'styled-tt';
    alwaysOpen.setAttribute('content', 'Always visible!');
    alwaysOpen.setAttribute('trigger', 'manual');
    alwaysOpen.toggleAttribute('open', true);
    alwaysOpen.toggleAttribute('arrow', true);
    alwaysOpen.appendChild(makeBtn('Trigger button'));
    row3.appendChild(alwaysOpen);
    wrap.appendChild(row3);

    return wrap;
  },
};
