import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-file-gallery';

type Args = {
  view?: 'grid' | 'list';
  multiple?: boolean;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  showProgress?: boolean;
  allowPause?: boolean;
  allowDelete?: boolean;
  autoUpload?: boolean;
  showDropzone?: boolean;
  showAddButton?: boolean;
  showHeader?: boolean;
};

function makeGallery(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-file-gallery');
  el.style.cssText = 'display:block;';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); else el.setAttribute(k, 'false'); }
    else el.setAttribute(k, String(v));
  }
  return el;
}

function box(el: HTMLElement) {
  const div = document.createElement('div');
  div.style.cssText = 'border:1px solid rgba(128,128,128,0.2);border-radius:8px;padding:1rem;margin-bottom:1rem;';
  div.appendChild(el);
  return div;
}

const meta: Meta<Args> = {
  title: 'Media/FileGallery',
  component: 'snice-file-gallery',
  tags: ['autodocs'],
  argTypes: {
    view:          { control: 'select', options: ['grid', 'list'] },
    multiple:      { control: 'boolean' },
    accept:        { control: 'text' },
    maxSize:       { control: 'number' },
    maxFiles:      { control: 'number' },
    disabled:      { control: 'boolean' },
    showProgress:  { control: 'boolean' },
    allowPause:    { control: 'boolean' },
    allowDelete:   { control: 'boolean' },
    autoUpload:    { control: 'boolean' },
    showDropzone:  { control: 'boolean' },
    showAddButton: { control: 'boolean' },
    showHeader:    { control: 'boolean' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    const el = document.createElement('snice-file-gallery');
    el.style.cssText = 'display:block;';
    if (args.view !== undefined) el.setAttribute('view', args.view);
    if (args.multiple !== undefined) el.setAttribute('multiple', String(args.multiple));
    if (args.accept !== undefined) el.setAttribute('accept', args.accept);
    if (args.maxSize !== undefined) el.setAttribute('max-size', String(args.maxSize));
    if (args.maxFiles !== undefined) el.setAttribute('max-files', String(args.maxFiles));
    if (args.disabled) el.toggleAttribute('disabled', true);
    if (args.showProgress !== undefined) el.setAttribute('show-progress', String(args.showProgress));
    if (args.allowPause !== undefined) el.setAttribute('allow-pause', String(args.allowPause));
    if (args.allowDelete !== undefined) el.setAttribute('allow-delete', String(args.allowDelete));
    if (args.autoUpload !== undefined) el.setAttribute('auto-upload', String(args.autoUpload));
    if (args.showDropzone !== undefined) el.setAttribute('show-dropzone', String(args.showDropzone));
    if (args.showAddButton) el.toggleAttribute('show-add-button', true);
    if (args.showHeader !== undefined) el.setAttribute('show-header', String(args.showHeader));
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { view: 'grid' } };

// h2: View: grid (default)
export const ViewGrid: Story = {
  render: () => box(makeGallery({ view: 'grid' })),
};

// h2: View: list
export const ViewList: Story = {
  render: () => box(makeGallery({ view: 'list' })),
};

// h2: Multiple: true (default)
export const MultipleTrue: Story = {
  render: () => box(makeGallery({ multiple: true })),
};

// h2: Multiple: false (single file)
export const MultipleFalse: Story = {
  render: () => box(makeGallery({ multiple: false })),
};

// h2: Accept: images only
export const AcceptImagesOnly: Story = {
  render: () => box(makeGallery({ accept: 'image/*' })),
};

// h2: Accept: PDFs only
export const AcceptPdfsOnly: Story = {
  render: () => box(makeGallery({ accept: '.pdf' })),
};

// h2: Accept: images + PDFs
export const AcceptImagesPdfs: Story = {
  render: () => box(makeGallery({ accept: 'image/*,.pdf' })),
};

// h2: Max Size: 1MB
export const MaxSize1MB: Story = {
  render: () => box(makeGallery({ 'max-size': 1048576 })),
};

// h2: Max Files: 3
export const MaxFiles3: Story = {
  render: () => box(makeGallery({ 'max-files': 3 })),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => box(makeGallery({ disabled: true })),
};

// h2: show-progress: false
export const ShowProgressFalse: Story = {
  render: () => box(makeGallery({ 'show-progress': false })),
};

// h2: allow-pause: false
export const AllowPauseFalse: Story = {
  render: () => box(makeGallery({ 'allow-pause': false })),
};

// h2: allow-delete: false
export const AllowDeleteFalse: Story = {
  render: () => box(makeGallery({ 'allow-delete': false })),
};

// h2: auto-upload: false
export const AutoUploadFalse: Story = {
  render: () => box(makeGallery({ 'auto-upload': false })),
};

// h2: show-dropzone: false
export const ShowDropzoneFalse: Story = {
  render: () => box(makeGallery({ 'show-dropzone': false, 'show-add-button': true })),
};

// h2: show-add-button: true
export const ShowAddButtonTrue: Story = {
  render: () => box(makeGallery({ 'show-add-button': true })),
};

// h2: show-header: false
export const ShowHeaderFalse: Story = {
  render: () => box(makeGallery({ 'show-header': false })),
};

// h2: Grid + Max 5 Files + Images Only + 2MB Max
export const GridMax5ImagesOnly2MB: Story = {
  render: () => box(makeGallery({ view: 'grid', 'max-files': 5, accept: 'image/*', 'max-size': 2097152 })),
};

// h2: List + No Dropzone + Add Button + No Auto Upload
export const ListNoDropzoneAddButtonNoAutoUpload: Story = {
  render: () => box(makeGallery({ view: 'list', 'show-dropzone': false, 'show-add-button': true, 'auto-upload': false })),
};

// h2: Single File + No Delete + No Pause
export const SingleFileNoDeleteNoPause: Story = {
  render: () => box(makeGallery({ multiple: false, 'allow-delete': false, 'allow-pause': false })),
};

// h2: CSS Parts Styling
// Available parts: base, dropzone, gallery
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-fg-default snice-file-gallery { display:block; }
      .parts-demo-fg-styled snice-file-gallery { display:block; }
      .parts-demo-fg-styled snice-file-gallery::part(base) {
        background: #0f172a;
        border: 2px solid #22d3ee;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(34,211,238,0.15);
      }
      .parts-demo-fg-styled snice-file-gallery::part(dropzone) {
        border: 2px dashed #22d3ee;
        border-radius: 12px;
        margin: 16px;
        background: rgba(34,211,238,0.05);
        transition: background 0.2s;
      }
      .parts-demo-fg-styled snice-file-gallery::part(gallery) {
        padding: 12px 16px 16px;
        gap: 12px;
        background: rgba(0,0,0,0.2);
      }
    `;
    wrap.appendChild(style);

    function section(title: string, className: string, el: HTMLElement) {
      const sec = document.createElement('div');
      sec.className = className;
      const h = document.createElement('div');
      h.style.cssText = 'font-size:.7rem;color:#888;margin-bottom:.5rem;font-family:monospace;';
      h.textContent = title;
      sec.appendChild(h);
      sec.appendChild(el);
      return sec;
    }

    const defaultEl = document.createElement('snice-file-gallery');
    wrap.appendChild(section('Default (no ::part() styles)', 'parts-demo-fg-default', defaultEl));

    const styledEl = document.createElement('snice-file-gallery');
    wrap.appendChild(section(
      'Styled: ::part(base) — dark cyan border  |  ::part(dropzone) — dashed cyan zone  |  ::part(gallery) — semi-transparent grid',
      'parts-demo-fg-styled',
      styledEl,
    ));

    return wrap;
  },
};
