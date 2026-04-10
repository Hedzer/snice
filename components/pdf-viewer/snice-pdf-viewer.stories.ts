import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-pdf-viewer';

const SAMPLE_PDF = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

type Args = {
  src?: string;
  fit?: string;
  zoom?: number;
  page?: number;
};

const meta: Meta<Args> = {
  title: 'Specialty/PdfViewer',
  component: 'snice-pdf-viewer',
  tags: ['autodocs'],
  argTypes: {
    src:  { control: 'text' },
    fit:  { control: 'select', options: ['width', 'height', 'page'] },
    zoom: { control: 'number' },
    page: { control: 'number' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-pdf-viewer') as any;
    el.style.cssText = 'display:block;height:500px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;';
    if (args.fit !== undefined) el.setAttribute('fit', args.fit);
    if (args.zoom !== undefined) el.setAttribute('zoom', String(args.zoom));
    if (args.page !== undefined) el.setAttribute('page', String(args.page));
    if (args.src !== undefined) el.src = args.src;
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { src: SAMPLE_PDF, fit: 'width' },
};

function viewer(attrs: Record<string, string | number> = {}, src?: string) {
  const el = document.createElement('snice-pdf-viewer') as any;
  el.style.cssText = 'display:block;height:500px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;';
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (src !== undefined) {
    customElements.whenDefined('snice-pdf-viewer').then(() => { el.src = src; }).catch(() => { el.src = src; });
    el.src = src;
  }
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

// h2: Fit: width (default)
export const FitWidth: Story = {
  render: () => col(viewer({ fit: 'width' }, SAMPLE_PDF)),
};

// h2: Fit: height
export const FitHeight: Story = {
  render: () => col(viewer({ fit: 'height' }, SAMPLE_PDF)),
};

// h2: Fit: page
export const FitPage: Story = {
  render: () => col(viewer({ fit: 'page' }, SAMPLE_PDF)),
};

// h2: Zoom: 0.5
export const Zoom05: Story = {
  render: () => col(viewer({ zoom: 0.5, fit: 'width' }, SAMPLE_PDF)),
};

// h2: Zoom: 1.5
export const Zoom15: Story = {
  render: () => col(viewer({ zoom: 1.5, fit: 'width' }, SAMPLE_PDF)),
};

// h2: Zoom: 2
export const Zoom2: Story = {
  render: () => col(viewer({ zoom: 2, fit: 'width' }, SAMPLE_PDF)),
};

// h2: Page: 1 (default)
export const Page1Default: Story = {
  render: () => col(viewer({ page: 1 }, SAMPLE_PDF)),
};

// h2: No src (empty state)
export const NoSrcEmptyState: Story = {
  render: () => col(viewer()),
};

// h2: Invalid src (error state)
export const InvalidSrcErrorState: Story = {
  render: () => col(viewer({ src: '/nonexistent.pdf' })),
};
