import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-file-upload';
import type { FileUploadSize, FileUploadVariant } from './snice-file-upload.types';

type Args = {
  size?: FileUploadSize;
  variant?: FileUploadVariant;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  label?: string;
  helperText?: string;
  errorText?: string;
  maxSize?: number;
  maxFiles?: number;
  name?: string;
  dragDrop?: boolean;
  showPreview?: boolean;
};

const SIZES: FileUploadSize[] = ['small', 'medium', 'large'];
const VARIANTS: FileUploadVariant[] = ['outlined', 'filled'];

function makeUpload(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-file-upload');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, String(v));
  }
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;width:100%;max-width:480px;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:flex-start;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'FileUpload',
  component: 'snice-file-upload',
  tags: ['autodocs'],
  argTypes: {
    size:        { control: 'select', options: SIZES },
    variant:     { control: 'select', options: VARIANTS },
    accept:      { control: 'text' },
    multiple:    { control: 'boolean' },
    disabled:    { control: 'boolean' },
    required:    { control: 'boolean' },
    invalid:     { control: 'boolean' },
    label:       { control: 'text' },
    helperText:  { control: 'text' },
    errorText:   { control: 'text' },
    maxSize:     { control: 'number' },
    maxFiles:    { control: 'number' },
    name:        { control: 'text' },
    dragDrop:    { control: 'boolean' },
    showPreview: { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-file-upload');
    if (args.size       !== undefined) el.setAttribute('size',         String(args.size));
    if (args.variant    !== undefined) el.setAttribute('variant',      String(args.variant));
    if (args.accept     !== undefined) el.setAttribute('accept',       String(args.accept));
    if (args.label      !== undefined) el.setAttribute('label',        String(args.label));
    if (args.helperText !== undefined) el.setAttribute('helper-text',  String(args.helperText));
    if (args.errorText  !== undefined) el.setAttribute('error-text',   String(args.errorText));
    if (args.maxSize    !== undefined) el.setAttribute('max-size',     String(args.maxSize));
    if (args.maxFiles   !== undefined) el.setAttribute('max-files',    String(args.maxFiles));
    if (args.name       !== undefined) el.setAttribute('name',         String(args.name));
    if (args.multiple)    el.toggleAttribute('multiple',     true);
    if (args.disabled)    el.toggleAttribute('disabled',     true);
    if (args.required)    el.toggleAttribute('required',     true);
    if (args.invalid)     el.toggleAttribute('invalid',      true);
    if (args.dragDrop === false) el.setAttribute('drag-drop', 'false');
    if (args.showPreview === false) el.setAttribute('show-preview', 'false');
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { label: 'Upload File', size: 'medium', variant: 'outlined' },
};

// h2: Size: small
export const SizeSmall: Story = {
  render: () => col(makeUpload({ size: 'small', label: 'Small Upload' })),
};

// h2: Size: medium (default)
export const SizeMedium: Story = {
  render: () => col(makeUpload({ size: 'medium', label: 'Medium Upload (default)' })),
};

// h2: Size: large
export const SizeLarge: Story = {
  render: () => col(makeUpload({ size: 'large', label: 'Large Upload' })),
};

// h2: All Sizes Compared
export const AllSizesCompared: Story = {
  render: () => col(
    makeUpload({ size: 'small', label: 'Small' }),
    makeUpload({ size: 'medium', label: 'Medium' }),
    makeUpload({ size: 'large', label: 'Large' }),
  ),
};

// h2: Variant: outlined (default)
export const VariantOutlined: Story = {
  render: () => col(makeUpload({ variant: 'outlined', label: 'Outlined (default)' })),
};

// h2: Variant: filled
export const VariantFilled: Story = {
  render: () => col(makeUpload({ variant: 'filled', label: 'Filled' })),
};

// h2: Size x Variant Matrix
export const SizeXVariantMatrix: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;max-width:900px;';
    for (const size of SIZES) {
      for (const variant of VARIANTS) {
        grid.appendChild(makeUpload({ size, variant, label: `${size} / ${variant}` }));
      }
    }
    return grid;
  },
};

// h2: Multiple: true
export const MultipleTrue: Story = {
  render: () => col(makeUpload({ multiple: true, label: 'Multiple Files' })),
};

// h2: Multiple: false (default, single file)
export const MultipleFalse: Story = {
  render: () => col(makeUpload({ label: 'Single File (default)' })),
};

// h2: Accept: image/*
export const AcceptImages: Story = {
  render: () => col(makeUpload({ accept: 'image/*', label: 'Images Only' })),
};

// h2: Accept: .pdf,.doc,.docx
export const AcceptDocuments: Story = {
  render: () => col(makeUpload({ accept: '.pdf,.doc,.docx', label: 'Documents (.pdf, .doc, .docx)' })),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => col(makeUpload({ disabled: true, label: 'Disabled' })),
};

// h2: Required
export const Required: Story = {
  render: () => col(makeUpload({ required: true, label: 'Required' })),
};

// h2: Invalid
export const Invalid: Story = {
  render: () => col(makeUpload({ invalid: true, label: 'Invalid' })),
};

// h2: Helper Text
export const HelperText: Story = {
  render: () => col(makeUpload({ label: 'Resume', 'helper-text': 'Upload your resume in PDF or Word format' })),
};

// h2: Error Text
export const ErrorText: Story = {
  render: () => col(makeUpload({ label: 'Avatar', invalid: true, 'error-text': 'File size exceeds the maximum allowed limit' })),
};

// h2: Max Size: 5MB
export const MaxSize5MB: Story = {
  render: () => col(makeUpload({ 'max-size': 5242880, label: 'Max 5MB' })),
};

// h2: Max Files: 3
export const MaxFiles3: Story = {
  render: () => col(makeUpload({ multiple: true, 'max-files': 3, label: 'Max 3 files' })),
};

// h2: drag-drop: false
export const DragDropFalse: Story = {
  render: () => col(makeUpload({ 'drag-drop': 'false', label: 'No Drag & Drop' })),
};

// h2: show-preview: false
export const ShowPreviewFalse: Story = {
  render: () => col(makeUpload({ 'show-preview': 'false', label: 'No Preview' })),
};

// h2: No Label
export const NoLabel: Story = {
  render: () => col(makeUpload({})),
};

// h2: With Name (form integration)
export const WithNameFormIntegration: Story = {
  render: () => col(makeUpload({ name: 'avatar', label: 'Avatar (name=avatar)' })),
};

// h2: Required + Invalid + Error Text
export const RequiredInvalidErrorText: Story = {
  render: () => col(makeUpload({ required: true, invalid: true, 'error-text': 'Please upload a file', label: 'Required File' })),
};

// h2: Multiple + Accept + Max Size + Max Files
export const MultipleAcceptMaxSizeMaxFiles: Story = {
  render: () => col(makeUpload({
    multiple: true,
    accept: 'image/*',
    'max-size': 2097152,
    'max-files': 5,
    label: 'Images (max 5, max 2MB each)',
  })),
};

// h2: Disabled + Filled + Large
export const DisabledFilledLarge: Story = {
  render: () => col(makeUpload({ disabled: true, variant: 'filled', size: 'large', label: 'Disabled Filled Large' })),
};

// h2: CSS Parts Styling
// Available parts: upload-area, input, error-text, helper-text, file-item
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; padding: 1.5rem; font-family: sans-serif; }
      .parts-demo__section { display: flex; flex-direction: column; gap: 0.75rem; }
      .parts-demo__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 0.25rem; }

      /* Styled: dashed neon drop zone */
      .parts-demo__neon snice-file-upload::part(upload-area) {
        background: radial-gradient(ellipse at center, rgba(0,229,255,0.06) 0%, transparent 70%);
        border: 2px dashed #00e5ff;
        border-radius: 16px;
        box-shadow: 0 0 20px rgba(0,229,255,0.15), inset 0 0 20px rgba(0,229,255,0.05);
        cursor: pointer;
        transition: box-shadow 0.2s ease;
      }
      .parts-demo__neon snice-file-upload::part(upload-area):hover {
        box-shadow: 0 0 30px rgba(0,229,255,0.3), inset 0 0 30px rgba(0,229,255,0.1);
      }
      .parts-demo__neon snice-file-upload::part(file-item) {
        background: rgba(0,229,255,0.08);
        border: 1px solid rgba(0,229,255,0.3);
        border-radius: 8px;
        color: #00e5ff;
        box-shadow: 0 0 8px rgba(0,229,255,0.15);
      }
      .parts-demo__neon snice-file-upload::part(helper-text) {
        color: rgba(0,229,255,0.7);
        font-family: monospace;
        font-size: 0.72rem;
      }
      .parts-demo__neon snice-file-upload::part(error-text) {
        color: #ff1744;
        font-weight: 600;
      }

      /* Styled: warm receipt / paper theme */
      .parts-demo__paper snice-file-upload::part(upload-area) {
        background: repeating-linear-gradient(
          45deg,
          #fffde7,
          #fffde7 10px,
          #fff8e1 10px,
          #fff8e1 20px
        );
        border: 2px dashed #f9a825;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(249,168,37,0.15);
        cursor: pointer;
      }
      .parts-demo__paper snice-file-upload::part(file-item) {
        background: #fff8e1;
        border: 1px solid #f9a825;
        border-radius: 6px;
        color: #5d4037;
        font-family: 'Courier New', monospace;
        box-shadow: 0 2px 4px rgba(249,168,37,0.2);
      }
      .parts-demo__paper snice-file-upload::part(helper-text) {
        color: #795548;
        font-style: italic;
      }
      .parts-demo__paper snice-file-upload::part(error-text) {
        color: #bf360c;
        font-weight: 700;
        font-family: 'Courier New', monospace;
      }
    `;

    const container = document.createElement('div');
    container.className = 'parts-demo';
    container.appendChild(style);

    // Default section
    const defaultSection = document.createElement('div');
    defaultSection.className = 'parts-demo__section';
    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'parts-demo__label';
    defaultLabel.textContent = 'Default (no ::part() styles)';
    defaultSection.appendChild(defaultLabel);
    defaultSection.appendChild(makeUpload({ label: 'Upload File', 'helper-text': 'Drag & drop or click to browse' }));
    container.appendChild(defaultSection);

    // Neon section
    const neonSection = document.createElement('div');
    neonSection.className = 'parts-demo__section parts-demo__neon';
    const neonLabel = document.createElement('div');
    neonLabel.className = 'parts-demo__label';
    neonLabel.textContent = '::part(upload-area/file-item/helper-text/error-text) — Neon drop zone';
    neonSection.appendChild(neonLabel);
    neonSection.appendChild(makeUpload({ label: 'Upload Assets', 'helper-text': 'Drop files anywhere in the zone', multiple: true }));
    container.appendChild(neonSection);

    // Paper section
    const paperSection = document.createElement('div');
    paperSection.className = 'parts-demo__section parts-demo__paper';
    const paperLabel = document.createElement('div');
    paperLabel.className = 'parts-demo__label';
    paperLabel.textContent = '::part(upload-area/file-item/helper-text/error-text) — Paper receipt';
    paperSection.appendChild(paperLabel);
    paperSection.appendChild(makeUpload({ label: 'Attach Documents', 'helper-text': 'PDF, DOC, XLS accepted', accept: '.pdf,.doc,.xls' }));
    container.appendChild(paperSection);

    return container;
  },
};
