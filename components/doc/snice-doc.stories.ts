import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-doc';

type Args = {
  placeholder?: string;
  readonly?: boolean;
  icons?: string;
};

const meta: Meta<Args> = {
  title: 'Specialty/Doc',
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
