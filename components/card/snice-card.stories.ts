import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-card';
import type { CardVariant, CardSize } from './snice-card.types';

type Args = {
  variant?: CardVariant;
  size?: CardSize;
  clickable?: boolean;
  selected?: boolean;
  disabled?: boolean;
};

const VARIANTS: CardVariant[] = ['elevated', 'bordered', 'flat'];
const SIZES: CardSize[] = ['small', 'medium', 'large'];

function makeCard(text: string, attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-card');
  el.style.maxWidth = '280px';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  const p = document.createElement('p');
  p.textContent = text;
  el.appendChild(p);
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:flex-start;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Layout/Card',
  component: 'snice-card',
  tags: ['autodocs'],
  argTypes: {
    variant:   { control: 'select', options: VARIANTS },
    size:      { control: 'select', options: SIZES },
    clickable: { control: 'boolean' },
    selected:  { control: 'boolean' },
    disabled:  { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-card');
    el.style.maxWidth = '280px';
    if (args.variant  !== undefined) el.setAttribute('variant', args.variant);
    if (args.size     !== undefined) el.setAttribute('size',    args.size);
    if (args.clickable) el.toggleAttribute('clickable', true);
    if (args.selected)  el.toggleAttribute('selected',  true);
    if (args.disabled)  el.toggleAttribute('disabled',  true);
    const p = document.createElement('p');
    p.textContent = 'Card content goes here.';
    el.appendChild(p);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { variant: 'elevated', size: 'medium' } };

// h2: All variants
export const AllVariants: Story = {
  render: () => row(
    makeCard('Elevated variant (default). Has a shadow.', { variant: 'elevated' }),
    makeCard('Bordered variant. Has a border, no shadow.', { variant: 'bordered' }),
    makeCard('Flat variant. No shadow, no border.', { variant: 'flat' }),
  ),
};

// h2: All sizes
export const AllSizes: Story = {
  render: () => row(
    makeCard('Small card.', { size: 'small' }),
    makeCard('Medium card (default).', { size: 'medium' }),
    makeCard('Large card.', { size: 'large' }),
  ),
};

// h2: Variant x Size matrix
export const VariantXSizeMatrix: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:auto repeat(3,1fr);gap:.75rem;align-items:start;';
    for (const size of SIZES) {
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:.7rem;color:#888;text-align:right;padding-right:.5rem;padding-top:.75rem;';
      lbl.textContent = size;
      grid.appendChild(lbl);
      for (const variant of VARIANTS) {
        const el = makeCard(`${variant[0].toUpperCase() + variant.slice(1)} ${size}`, { variant, size });
        el.style.maxWidth = '';
        grid.appendChild(el);
      }
    }
    return grid;
  },
};

// h2: Clickable
export const Clickable: Story = {
  render: () => row(
    makeCard('Clickable elevated card. Click to toggle selected.', { variant: 'elevated', clickable: true }),
    makeCard('Clickable bordered card.', { variant: 'bordered', clickable: true }),
    makeCard('Clickable flat card.', { variant: 'flat', clickable: true }),
  ),
};

// h2: Selected
export const Selected: Story = {
  render: () => row(
    makeCard('Selected elevated.', { variant: 'elevated', selected: true }),
    makeCard('Selected bordered.', { variant: 'bordered', selected: true }),
  ),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => row(
    makeCard('Disabled elevated card.', { variant: 'elevated', disabled: true }),
    makeCard('Disabled + clickable bordered card.', { variant: 'bordered', clickable: true, disabled: true }),
  ),
};

// h2: With header slot
export const WithHeaderSlot: Story = {
  render: () => {
    const wrap = row();
    for (const [variant, headerText, bodyText] of [
      ['elevated', 'Card Title', 'Body content below the header.'],
      ['bordered', 'Header Text', 'Bordered with header.'],
    ] as [CardVariant, string, string][]) {
      const el = document.createElement('snice-card');
      el.style.maxWidth = '280px';
      el.setAttribute('variant', variant);
      const hdr = document.createElement('span');
      hdr.slot = 'header';
      const strong = document.createElement('strong');
      strong.textContent = headerText;
      hdr.appendChild(strong);
      el.appendChild(hdr);
      const p = document.createElement('p'); p.textContent = bodyText;
      el.appendChild(p);
      wrap.appendChild(el);
    }
    return wrap;
  },
};

// h2: With footer slot
export const WithFooterSlot: Story = {
  render: () => {
    const wrap = row();
    for (const [variant, bodyText, footerText] of [
      ['elevated', 'Body content.', 'Footer text or actions'],
      ['bordered', 'Content here.', 'More info'],
    ] as [CardVariant, string, string][]) {
      const el = document.createElement('snice-card');
      el.style.maxWidth = '280px';
      el.setAttribute('variant', variant);
      const p = document.createElement('p'); p.textContent = bodyText;
      el.appendChild(p);
      const ftr = document.createElement('span');
      ftr.slot = 'footer'; ftr.textContent = footerText;
      el.appendChild(ftr);
      wrap.appendChild(el);
    }
    return wrap;
  },
};

// h2: With header + footer + body
export const WithHeaderFooterBody: Story = {
  render: () => {
    const el = document.createElement('snice-card');
    el.setAttribute('variant', 'elevated');
    el.style.maxWidth = '320px';
    const hdr = document.createElement('span'); hdr.slot = 'header';
    const strong = document.createElement('strong'); strong.textContent = 'Full Card';
    hdr.appendChild(strong); el.appendChild(hdr);
    const p = document.createElement('p');
    p.textContent = 'This card has a header, body content, and a footer. All three slots populated.';
    el.appendChild(p);
    const ftr = document.createElement('span'); ftr.slot = 'footer'; ftr.textContent = 'Footer content goes here';
    el.appendChild(ftr);
    return el;
  },
};

// h2: With image slot
export const WithImageSlot: Story = {
  render: () => {
    const wrap = row();
    for (const [variant, seed, headerText, bodyText] of [
      ['elevated', 1, 'Image Card', 'Card with an image at the top.'],
      ['bordered', 2, '',           'Bordered card with image.'],
    ] as [CardVariant, number, string, string][]) {
      const el = document.createElement('snice-card');
      el.style.maxWidth = '280px';
      el.setAttribute('variant', variant);
      const img = document.createElement('img');
      img.slot = 'image';
      img.src = `https://picsum.photos/280/160?random=${seed}`;
      img.alt = 'Sample';
      img.style.cssText = 'width:100%;display:block;';
      el.appendChild(img);
      if (headerText) {
        const hdr = document.createElement('span'); hdr.slot = 'header';
        const strong = document.createElement('strong'); strong.textContent = headerText;
        hdr.appendChild(strong); el.appendChild(hdr);
      }
      const p = document.createElement('p'); p.textContent = bodyText;
      el.appendChild(p);
      wrap.appendChild(el);
    }
    return wrap;
  },
};

// h2: Clickable + Selected + Disabled combinations
export const ClickableSelectedDisabledCombinations: Story = {
  render: () => row(
    makeCard('Clickable only', { clickable: true }),
    makeCard('Clickable + Selected', { clickable: true, selected: true }),
    makeCard('Clickable + Disabled', { clickable: true, disabled: true }),
    makeCard('Clickable + Selected + Disabled', { clickable: true, selected: true, disabled: true }),
    makeCard('Selected (not clickable)', { selected: true }),
    makeCard('Disabled (not clickable)', { disabled: true }),
  ),
};

// h2: Edge case: empty card
export const EdgeCaseEmptyCard: Story = {
  render: () => {
    const el = document.createElement('snice-card');
    el.setAttribute('variant', 'elevated');
    return el;
  },
};

// h2: Edge case: very long content
export const EdgeCaseVeryLongContent: Story = {
  render: () => {
    const el = document.createElement('snice-card');
    el.setAttribute('variant', 'bordered');
    el.style.maxWidth = '320px';
    const hdr = document.createElement('span'); hdr.slot = 'header';
    const strong = document.createElement('strong'); strong.textContent = 'Long Content';
    hdr.appendChild(strong); el.appendChild(hdr);
    const p = document.createElement('p');
    p.textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';
    el.appendChild(p);
    const ftr = document.createElement('span'); ftr.slot = 'footer'; ftr.textContent = 'End of content';
    el.appendChild(ftr);
    return el;
  },
};

// h2: Edge case: single character content
export const EdgeCaseSingleCharacterContent: Story = {
  render: () => {
    const el = document.createElement('snice-card');
    el.setAttribute('variant', 'elevated');
    el.textContent = 'X';
    return el;
  },
};
