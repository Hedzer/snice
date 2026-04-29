import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-link-preview';

type Args = {
  variant?: 'vertical' | 'horizontal';
  size?: 'small' | 'medium' | 'large';
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
};

const meta: Meta<Args> = {
  title: 'LinkPreview',
  component: 'snice-link-preview',
  tags: ['autodocs'],
  argTypes: {
    variant:     { control: 'select', options: ['vertical', 'horizontal'] },
    size:        { control: 'select', options: ['small', 'medium', 'large'] },
    url:         { control: 'text' },
    title:       { control: 'text' },
    description: { control: 'text' },
    image:       { control: 'text' },
    siteName:    { control: 'text' },
    favicon:     { control: 'text' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-link-preview');
    el.style.maxWidth = '360px';
    if (args.variant     !== undefined) el.setAttribute('variant',   args.variant);
    if (args.size        !== undefined) el.setAttribute('size',      args.size);
    if (args.url         !== undefined) el.setAttribute('url',       args.url);
    if (args.title       !== undefined) (el as any).title = args.title;
    if (args.description !== undefined) el.setAttribute('description', args.description);
    if (args.image       !== undefined) el.setAttribute('image',     args.image);
    if (args.siteName    !== undefined) el.setAttribute('site-name', args.siteName);
    if (args.favicon     !== undefined) el.setAttribute('favicon',   args.favicon);
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

function makeLp(attrs: Record<string, string> = {}) {
  const el = document.createElement('snice-link-preview');
  el.style.maxWidth = '360px';
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:flex-start;gap:.75rem;flex-wrap:wrap;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

export const Default: Story = {
  args: {
    variant: 'vertical',
    size: 'medium',
    url: 'https://example.com/article',
    title: 'How to Build Web Components',
    description: 'A comprehensive guide to creating reusable custom elements with modern web standards.',
    image: 'https://picsum.photos/seed/lp1/600/300',
    siteName: 'Example Blog',
    favicon: 'https://www.google.com/favicon.ico',
  },
};

// h2: Variant: vertical (default)
export const VariantVertical: Story = {
  render: () => makeLp({
    url: 'https://example.com/article',
    title: 'How to Build Web Components',
    description: 'A comprehensive guide to creating reusable custom elements with modern web standards.',
    image: 'https://picsum.photos/seed/lp1/600/300',
    'site-name': 'Example Blog',
    favicon: 'https://www.google.com/favicon.ico',
  }),
};

// h2: Variant: horizontal
export const VariantHorizontal: Story = {
  render: () => makeLp({
    variant: 'horizontal',
    url: 'https://example.com/news',
    title: 'Breaking: Web Components Adoption Surges',
    description: 'New survey shows 65% of developers now use web components in production.',
    image: 'https://picsum.photos/seed/lp2/600/300',
    'site-name': 'Tech News',
    favicon: 'https://www.google.com/favicon.ico',
  }),
};

// h2: Size: small
export const SizeSmall: Story = {
  render: () => row(
    makeLp({ size: 'small', url: 'https://example.com', title: 'Small Vertical', description: 'Brief description.', image: 'https://picsum.photos/seed/lp3/600/300', 'site-name': 'Site' }),
    makeLp({ variant: 'horizontal', size: 'small', url: 'https://example.com', title: 'Small Horizontal', description: 'Brief description.', image: 'https://picsum.photos/seed/lp4/600/300', 'site-name': 'Site' }),
  ),
};

// h2: Size: medium (default)
export const SizeMedium: Story = {
  render: () => row(
    makeLp({ size: 'medium', url: 'https://example.com', title: 'Medium Vertical', description: 'Medium-length description of the linked content.', image: 'https://picsum.photos/seed/lp5/600/300', 'site-name': 'Site' }),
    makeLp({ variant: 'horizontal', size: 'medium', url: 'https://example.com', title: 'Medium Horizontal', description: 'Medium-length description of the linked content.', image: 'https://picsum.photos/seed/lp6/600/300', 'site-name': 'Site' }),
  ),
};

// h2: Size: large
export const SizeLarge: Story = {
  render: () => row(
    makeLp({ size: 'large', url: 'https://example.com', title: 'Large Vertical', description: 'A much longer description that demonstrates how the large size accommodates more text content in the preview card.', image: 'https://picsum.photos/seed/lp7/600/300', 'site-name': 'Site' }),
    makeLp({ variant: 'horizontal', size: 'large', url: 'https://example.com', title: 'Large Horizontal', description: 'A much longer description that demonstrates how the large size accommodates more text content in the preview card.', image: 'https://picsum.photos/seed/lp8/600/300', 'site-name': 'Site' }),
  ),
};

// h2: No image (placeholder icon)
export const NoImage: Story = {
  render: () => row(
    makeLp({ url: 'https://example.com', title: 'No Image Provided', description: 'This preview has no image, showing the link placeholder icon.', 'site-name': 'Example' }),
    makeLp({ variant: 'horizontal', url: 'https://example.com', title: 'No Image Horizontal', description: 'Horizontal variant with placeholder.', 'site-name': 'Example' }),
  ),
};

// h2: No description
export const NoDescription: Story = {
  render: () => makeLp({ url: 'https://example.com', title: 'Title Only, No Description', image: 'https://picsum.photos/seed/lp9/600/300', 'site-name': 'Example' }),
};

// h2: No title
export const NoTitle: Story = {
  render: () => makeLp({ url: 'https://example.com', description: 'This preview has a description but no title.', image: 'https://picsum.photos/seed/lp10/600/300', 'site-name': 'Example' }),
};

// h2: No site-name (domain extracted from URL)
export const NoSiteName: Story = {
  render: () => makeLp({ url: 'https://developer.mozilla.org/en-US/docs/Web/API', title: 'Web APIs', description: 'Web APIs documentation on MDN.', image: 'https://picsum.photos/seed/lp11/600/300' }),
};

// h2: With favicon, no site-name
export const WithFaviconNoSiteName: Story = {
  render: () => makeLp({ url: 'https://github.com/example', title: 'GitHub Repository', description: 'Open source project.', favicon: 'https://github.com/favicon.ico' }),
};

// h2: With site-name and favicon
export const WithSiteNameAndFavicon: Story = {
  render: () => makeLp({ url: 'https://example.com', title: 'Full Footer Info', description: 'Both site name and favicon displayed in footer.', image: 'https://picsum.photos/seed/lp12/600/300', 'site-name': 'My Blog', favicon: 'https://www.google.com/favicon.ico' }),
};

// h2: Long title and description (clamping)
export const LongTitleAndDescriptionClamping: Story = {
  render: () => makeLp({
    url: 'https://example.com',
    title: 'This is a very long title that should be clamped to two lines to prevent the card from becoming too tall and breaking the layout',
    description: 'This is a very long description that should be clamped to three lines. It contains enough text to demonstrate the line clamping behavior of the description element within the link preview card component.',
    image: 'https://picsum.photos/seed/lp13/600/300',
    'site-name': 'Example',
    favicon: 'https://www.google.com/favicon.ico',
  }),
};

// h2: Minimal (url only)
export const MinimalUrlOnly: Story = {
  render: () => makeLp({ url: 'https://example.com' }),
};

// h2: Empty (no props)
export const EmptyNoProps: Story = {
  render: () => makeLp(),
};

// h2: Variant x Size matrix
export const VariantXSizeMatrix: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:.75rem;';

    const vertRow = row(
      makeLp({ variant: 'vertical', size: 'small',  url: 'https://example.com', title: 'V+S', description: 'Vertical small',  image: 'https://picsum.photos/seed/m1/600/300' }),
      makeLp({ variant: 'vertical', size: 'medium', url: 'https://example.com', title: 'V+M', description: 'Vertical medium', image: 'https://picsum.photos/seed/m2/600/300' }),
      makeLp({ variant: 'vertical', size: 'large',  url: 'https://example.com', title: 'V+L', description: 'Vertical large',  image: 'https://picsum.photos/seed/m3/600/300' }),
    );
    const horizRow = row(
      makeLp({ variant: 'horizontal', size: 'small',  url: 'https://example.com', title: 'H+S', description: 'Horizontal small',  image: 'https://picsum.photos/seed/m4/600/300' }),
      makeLp({ variant: 'horizontal', size: 'medium', url: 'https://example.com', title: 'H+M', description: 'Horizontal medium', image: 'https://picsum.photos/seed/m5/600/300' }),
      makeLp({ variant: 'horizontal', size: 'large',  url: 'https://example.com', title: 'H+L', description: 'Horizontal large',  image: 'https://picsum.photos/seed/m6/600/300' }),
    );

    wrap.appendChild(vertRow);
    wrap.appendChild(horizRow);
    return wrap;
  },
};

// h2: CSS Parts Styling
// Parts: base, content, title
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo--lp-styled snice-link-preview::part(base) {
        border: 2px solid #7c3aed;
        border-radius: 12px;
        background: linear-gradient(135deg, #1e1035, #2d1b69);
        box-shadow: 0 4px 24px rgba(124,58,237,0.25);
      }
      .parts-demo--lp-styled snice-link-preview::part(content) {
        padding: 1.25rem 1.5rem;
        background: rgba(124,58,237,0.1);
      }
      .parts-demo--lp-styled snice-link-preview::part(title) {
        color: #c4b5fd;
        font-size: 1.1rem;
        font-weight: 700;
        letter-spacing: 0.01em;
        text-decoration: underline;
        text-decoration-color: rgba(196,181,253,0.4);
      }
    `;
    wrap.appendChild(style);

    const attrs = {
      url: 'https://example.com',
      title: 'Link Preview with Part Styling',
      description: 'Styled via ::part(base), ::part(content), and ::part(title) selectors.',
      image: 'https://picsum.photos/seed/lp-parts/600/300',
      'site-name': 'example.com',
    };

    const defaultBox = document.createElement('div');
    defaultBox.className = 'parts-demo';
    const defaultLabel = document.createElement('p');
    defaultLabel.style.cssText = 'margin:0 0 .5rem;font-size:.75rem;color:#888;text-transform:uppercase;letter-spacing:.05em;';
    defaultLabel.textContent = 'Default (no ::part() styles)';
    defaultBox.appendChild(defaultLabel);
    defaultBox.appendChild(makeLp(attrs));

    const styledBox = document.createElement('div');
    styledBox.className = 'parts-demo parts-demo--lp-styled';
    const styledLabel = document.createElement('p');
    styledLabel.style.cssText = defaultLabel.style.cssText;
    styledLabel.textContent = 'Styled via ::part(base · content · title)';
    styledBox.appendChild(styledLabel);
    styledBox.appendChild(makeLp(attrs));

    wrap.appendChild(defaultBox);
    wrap.appendChild(styledBox);
    return wrap;
  },
};
