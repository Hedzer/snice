import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-doc';

type Args = {
  placeholder?: string;
  readonly?: boolean;
  icons?: string;
};

const meta: Meta<Args> = {
  title: 'Doc',
  component: 'snice-doc',
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    readonly:    { control: 'boolean' },
    icons:       { control: 'select', options: ['default', 'material', 'fontawesome'] },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-doc');
    el.style.cssText = 'border:1px solid rgba(128,128,128,0.2);border-radius:8px;min-height:200px;';
    if (args.placeholder !== undefined) el.setAttribute('placeholder', args.placeholder);
    if (args.readonly)    el.toggleAttribute('readonly', true);
    if (args.icons !== undefined) el.setAttribute('icons', args.icons);
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { placeholder: 'Start typing...', icons: 'default' },
};

// h2: Default (empty, icons="default")
export const DefaultEmptyIconsDefault: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-doc');
    el.style.cssText = 'border:1px solid rgba(128,128,128,0.2);border-radius:8px;min-height:200px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Custom placeholder
export const CustomPlaceholder: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-doc');
    el.style.cssText = 'border:1px solid rgba(128,128,128,0.2);border-radius:8px;min-height:200px;';
    el.setAttribute('placeholder', 'Write your story here...');
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Pre-filled content (setHTML)
export const PreFilledContent: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-doc') as any;
    el.style.cssText = 'border:1px solid rgba(128,128,128,0.2);border-radius:8px;min-height:200px;';
    wrap.appendChild(el);
    customElements.whenDefined('snice-doc').then(() => {
      if (typeof el.setHTML === 'function') {
        el.setHTML(`
          <h1>Document Title</h1>
          <p>This is a paragraph with <b>bold</b>, <i>italic</i>, and <u>underlined</u> text.</p>
          <h2>Section Heading</h2>
          <p>A paragraph under a subheading with a <a href="https://example.com">link</a>.</p>
          <ul>
            <li>Bullet item one</li>
            <li>Bullet item two</li>
          </ul>
          <ol>
            <li>Numbered item one</li>
            <li>Numbered item two</li>
          </ol>
          <hr>
          <p>Content after a divider.</p>
        `);
      }
    });
    return wrap;
  },
};

// h2: readonly
export const Readonly: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-doc');
    el.style.cssText = 'border:1px solid rgba(128,128,128,0.2);border-radius:8px;min-height:200px;';
    el.toggleAttribute('readonly', true);
    el.setAttribute('placeholder', 'Cannot edit this');
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: icons="default" (text/emoji icons)
export const IconsDefault: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-doc');
    el.style.cssText = 'border:1px solid rgba(128,128,128,0.2);border-radius:8px;min-height:200px;';
    el.setAttribute('icons', 'default');
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: icons="material" (Material Symbols - requires font loaded)
export const IconsMaterial: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-doc');
    el.style.cssText = 'border:1px solid rgba(128,128,128,0.2);border-radius:8px;min-height:200px;';
    el.setAttribute('icons', 'material');
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: icons="fontawesome" (Font Awesome - requires font loaded)
export const IconsFontawesome: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-doc');
    el.style.cssText = 'border:1px solid rgba(128,128,128,0.2);border-radius:8px;min-height:200px;';
    el.setAttribute('icons', 'fontawesome');
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: CSS Parts Styling
// Parts: base, toolbar, editor, icon
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; font-family: sans-serif; }
      .parts-demo .label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 0.5rem; }
      .parts-demo .row { display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start; }

      /* Default (unstyled) */
      .parts-demo .demo-default snice-doc::part(base) {}
      .parts-demo .demo-default snice-doc::part(toolbar) {}
      .parts-demo .demo-default snice-doc::part(editor) {}

      /* Styled: base — overall container */
      .parts-demo .demo-styled snice-doc::part(base) {
        border: 2px solid #0ea5e9;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(14, 165, 233, 0.25);
      }
      /* Styled: toolbar — format toolbar strip */
      .parts-demo .demo-styled snice-doc::part(toolbar) {
        background: linear-gradient(90deg, #0ea5e9, #6366f1);
        padding: 6px 12px;
        gap: 6px;
      }
      /* Styled: editor — editable content area */
      .parts-demo .demo-styled snice-doc::part(editor) {
        background: #0f172a;
        color: #e2e8f0;
        padding: 1.25rem 1.5rem;
        min-height: 140px;
        font-family: 'Georgia', serif;
        font-size: 1rem;
        line-height: 1.7;
      }
    `;

    const defaultEl = document.createElement('snice-doc');
    defaultEl.style.cssText = 'border:1px solid rgba(128,128,128,0.2);border-radius:8px;min-height:180px;width:400px;';

    const styledEl = document.createElement('snice-doc');
    styledEl.style.cssText = 'min-height:180px;width:400px;display:block;';

    const defaultWrap = document.createElement('div');
    defaultWrap.className = 'demo-default';
    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'label';
    defaultLabel.textContent = 'Default';
    defaultWrap.appendChild(defaultLabel);
    defaultWrap.appendChild(defaultEl);

    const styledWrap = document.createElement('div');
    styledWrap.className = 'demo-styled';
    const styledLabel = document.createElement('div');
    styledLabel.className = 'label';
    styledLabel.textContent = 'Styled (::part(base, toolbar, editor))';
    styledWrap.appendChild(styledLabel);
    styledWrap.appendChild(styledEl);

    const row = document.createElement('div');
    row.className = 'row';
    row.appendChild(defaultWrap);
    row.appendChild(styledWrap);

    const wrap = document.createElement('div');
    wrap.className = 'parts-demo';
    wrap.appendChild(style);
    wrap.appendChild(row);
    return wrap;
  },
};
