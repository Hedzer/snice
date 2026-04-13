import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-carousel';

type Args = {
  loop?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  activeIndex?: number;
  autoplay?: boolean;
  autoplayInterval?: number;
  autoplayDirection?: 'forward' | 'backward';
  slidesPerView?: number;
  spaceBetween?: number;
};

const SLIDE_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444'];

function makeSlide(label: string, colorIdx: number) {
  const el = document.createElement('div');
  el.style.cssText = `height:200px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:bold;color:white;border-radius:8px;background:${SLIDE_COLORS[colorIdx % SLIDE_COLORS.length]};`;
  el.textContent = label;
  return el;
}

function makeCarousel(attrs: Record<string, string | boolean>, slides: HTMLElement[]) {
  const el = document.createElement('snice-carousel');
  el.style.marginBottom = '1rem';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') {
      if (v) el.toggleAttribute(k, true);
      else el.setAttribute(k, 'false');
    } else {
      el.setAttribute(k, v);
    }
  }
  slides.forEach(s => el.appendChild(s));
  return el;
}

function makeSlides(count: number) {
  return Array.from({ length: count }, (_, i) => makeSlide(String(i + 1), i));
}

const meta: Meta<Args> = {
  title: 'Layout/Carousel',
  component: 'snice-carousel',
  tags: ['autodocs'],
  argTypes: {
    loop:             { control: 'boolean' },
    showControls:     { control: 'boolean' },
    showIndicators:   { control: 'boolean' },
    activeIndex:      { control: 'number' },
    autoplay:         { control: 'boolean' },
    autoplayInterval: { control: 'number' },
    autoplayDirection:{ control: 'select', options: ['forward', 'backward'] },
    slidesPerView:    { control: 'number' },
    spaceBetween:     { control: 'number' },
  },
  render: (args) => {
    const attrs: Record<string, string | boolean> = {};
    if (args.loop             === false) attrs['loop']              = false;
    if (args.showControls     === false) attrs['show-controls']     = false;
    if (args.showIndicators   === false) attrs['show-indicators']   = false;
    if (args.activeIndex      !== undefined) attrs['active-index']  = String(args.activeIndex);
    if (args.autoplay)                   attrs['autoplay']          = true;
    if (args.autoplayInterval !== undefined) attrs['autoplay-interval']  = String(args.autoplayInterval);
    if (args.autoplayDirection !== undefined) attrs['autoplay-direction'] = args.autoplayDirection;
    if (args.slidesPerView    !== undefined) attrs['slides-per-view']    = String(args.slidesPerView);
    if (args.spaceBetween     !== undefined) attrs['space-between']      = String(args.spaceBetween);
    return makeCarousel(attrs, makeSlides(5));
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: {} };

// h2: Default (all defaults: loop, controls, indicators, 1 slide per view)
export const DefaultAllDefaults: Story = {
  render: () => makeCarousel({}, makeSlides(5)),
};

// h2: show-controls="false"
export const ShowControlsFalse: Story = {
  render: () => makeCarousel({ 'show-controls': false }, makeSlides(3)),
};

// h2: show-indicators="false"
export const ShowIndicatorsFalse: Story = {
  render: () => makeCarousel({ 'show-indicators': false }, makeSlides(3)),
};

// h2: show-controls="false" show-indicators="false"
export const ShowControlsFalseShowIndicatorsFalse: Story = {
  render: () => makeCarousel({ 'show-controls': false, 'show-indicators': false }, makeSlides(3)),
};

// h2: loop="false"
export const LoopFalse: Story = {
  render: () => makeCarousel({ 'loop': false }, makeSlides(3)),
};

// h2: active-index="2" (start on slide 3)
export const ActiveIndex2: Story = {
  render: () => makeCarousel({ 'active-index': '2' }, makeSlides(4)),
};

// h2: autoplay, autoplay-interval="2000", autoplay-direction="forward"
export const AutoplayForward: Story = {
  render: () => makeCarousel({ autoplay: true, 'autoplay-interval': '2000', 'autoplay-direction': 'forward' }, makeSlides(3)),
};

// h2: autoplay, autoplay-direction="backward"
export const AutoplayBackward: Story = {
  render: () => makeCarousel({ autoplay: true, 'autoplay-interval': '2500', 'autoplay-direction': 'backward' }, makeSlides(3)),
};

// h2: slides-per-view="2"
export const SlidesPerView2: Story = {
  render: () => makeCarousel({ 'slides-per-view': '2' }, makeSlides(5)),
};

// h2: slides-per-view="3", space-between="16"
export const SlidesPerView3SpaceBetween16: Story = {
  render: () => makeCarousel({ 'slides-per-view': '3', 'space-between': '16' }, makeSlides(6)),
};

// h2: slides-per-view="4", space-between="8"
export const SlidesPerView4SpaceBetween8: Story = {
  render: () => makeCarousel({ 'slides-per-view': '4', 'space-between': '8' }, makeSlides(6)),
};

// h2: Single slide
export const SingleSlide: Story = {
  render: () => makeCarousel({}, [makeSlide('Only Slide', 0)]),
};

// h2: Two slides, loop="false"
export const TwoSlidesLoopFalse: Story = {
  render: () => makeCarousel({ loop: false }, [makeSlide('First', 0), makeSlide('Second', 1)]),
};

// h2: CSS Parts Styling
export const CSSPartsStyling: Story = {
  render: () => {
    // Parts: viewport, slides-container, container, controls, button-prev, button-next, indicators, indicator
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; }
      .parts-demo-label { font-size: 0.65rem; color: #888; margin-bottom: 0.25rem; }
      .styled-carousel::part(container) {
        background: #0f0a1e;
        border: 2px solid #6366f1;
        border-radius: 1rem;
        overflow: hidden;
      }
      .styled-carousel::part(viewport) {
        border-radius: 0.85rem 0.85rem 0 0;
      }
      .styled-carousel::part(controls) {
        background: rgba(15, 10, 30, 0.9);
        padding: 0.5rem;
        border-top: 1px solid #4338ca;
      }
      .styled-carousel::part(button-prev),
      .styled-carousel::part(button-next) {
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        color: white;
        border: none;
        border-radius: 50%;
        width: 2.25rem;
        height: 2.25rem;
        box-shadow: 0 2px 12px rgba(99, 102, 241, 0.5);
        cursor: pointer;
      }
      .styled-carousel::part(indicators) {
        gap: 0.5rem;
        padding: 0.5rem 0;
        background: rgba(15, 10, 30, 0.9);
        border-top: 1px solid #4338ca;
        justify-content: center;
      }
      .styled-carousel::part(indicator) {
        background: #4338ca;
        border-radius: 50%;
        width: 0.5rem;
        height: 0.5rem;
        border: none;
        cursor: pointer;
      }
    `;
    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.className = 'parts-demo';

    const l1 = document.createElement('div'); l1.className = 'parts-demo-label'; l1.textContent = 'default';
    const c1 = makeCarousel({}, makeSlides(4));
    const g1 = document.createElement('div'); g1.appendChild(l1); g1.appendChild(c1); wrap.appendChild(g1);

    const l2 = document.createElement('div'); l2.className = 'parts-demo-label'; l2.textContent = '::part(container|viewport|controls|button-prev|button-next|indicators|indicator)';
    const c2 = makeCarousel({}, makeSlides(4));
    c2.className = 'styled-carousel';
    const g2 = document.createElement('div'); g2.appendChild(l2); g2.appendChild(c2); wrap.appendChild(g2);

    return wrap;
  },
};

// h2: slides-per-view="2", space-between="32", autoplay
export const SlidesPerView2SpaceBetween32Autoplay: Story = {
  render: () => makeCarousel({ 'slides-per-view': '2', 'space-between': '32', autoplay: true, 'autoplay-interval': '3000' }, [
    makeSlide('A', 0), makeSlide('B', 1), makeSlide('C', 2), makeSlide('D', 3),
  ]),
};
