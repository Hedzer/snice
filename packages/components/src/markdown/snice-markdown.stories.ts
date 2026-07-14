import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-markdown';

type Args = {
  theme?: string;
  sanitize?: boolean;
  content?: string;
};

const meta: Meta<Args> = {
  title: 'Markdown',
  component: 'snice-markdown',
  tags: ['autodocs'],
  argTypes: {
    theme:    { control: 'select', options: ['default', 'github'] },
    sanitize: { control: 'boolean' },
    content:  { control: 'text' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-markdown');
    el.style.cssText = 'display:block;max-width:700px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;padding:1rem;';
    if (args.theme !== undefined) el.setAttribute('theme', args.theme);
    if (args.sanitize === false) el.setAttribute('sanitize', 'false');
    else if (args.sanitize) el.toggleAttribute('sanitize', true);
    el.textContent = args.content ?? '# Hello\n\nA paragraph with **bold** and *italic* text.';
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: {
    theme: 'default',
    content: '# Hello\n\nA paragraph with **bold** and *italic* text.',
  },
};

function md(content: string, attrs: Record<string, string> = {}) {
  const el = document.createElement('snice-markdown');
  el.style.cssText = 'display:block;max-width:700px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;padding:1rem;';
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.textContent = content;
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

// h2: Theme: default
export const ThemeDefault: Story = {
  render: () => col(
    md('# Heading 1\n## Heading 2\n### Heading 3\n\nA paragraph with **bold**, *italic*, and ~~strikethrough~~ text.', { theme: 'default' }),
  ),
};

// h2: Theme: github
export const ThemeGithub: Story = {
  render: () => col(
    md('# GitHub Theme\n## Subheading\n\nThis uses the GitHub-style rendering theme.\n\n- List item one\n- List item two', { theme: 'github' }),
  ),
};

// h2: Headings (h1-h6)
export const HeadingsH1H6: Story = {
  render: () => col(
    md('# Heading 1\n## Heading 2\n### Heading 3\n#### Heading 4\n##### Heading 5\n###### Heading 6'),
  ),
};

// h2: Bold, italic, bold-italic
export const BoldItalicBoldItalic: Story = {
  render: () => col(
    md('**Bold text** and *italic text* and ***bold italic text***.\n\nAlso __bold__ and _italic_ and ___bold italic___.'),
  ),
};

// h2: Strikethrough
export const Strikethrough: Story = {
  render: () => col(
    md('This is ~~deleted text~~ with strikethrough.'),
  ),
};

// h2: Unordered list
export const UnorderedList: Story = {
  render: () => col(
    md('- First item\n- Second item\n- Third item\n  - Nested item\n- Fourth item'),
  ),
};

// h2: Ordered list
export const OrderedList: Story = {
  render: () => col(
    md('1. First item\n2. Second item\n3. Third item\n4. Fourth item'),
  ),
};

// h2: Task list
export const TaskList: Story = {
  render: () => col(
    md('- [x] Completed task\n- [x] Another completed\n- [ ] Pending task\n- [ ] Another pending'),
  ),
};

// h2: Blockquote
export const Blockquote: Story = {
  render: () => col(
    md('> This is a blockquote.\n> It can span multiple lines.\n> And contain **formatting**.'),
  ),
};

// h2: Inline code
export const InlineCode: Story = {
  render: () => col(
    md('Use `const x = 42` for inline code. Also `Array.from()` and `document.querySelector()`.'),
  ),
};

// h2: Code block
export const CodeBlock: Story = {
  render: () => col(
    md('```javascript\nfunction hello(name) {\n  console.log(`Hello, ${name}!`);\n  return true;\n}\n```'),
  ),
};

// h2: Code block (no language)
export const CodeBlockNoLanguage: Story = {
  render: () => col(
    md('```\nplain code block\nno language specified\n```'),
  ),
};

// h2: Code block (multiple languages)
export const CodeBlockMultipleLanguages: Story = {
  render: () => col(
    md('```typescript\nconst greeting: string = \'Hello\';\n```\n\n```python\ngreeting = "Hello"\nprint(greeting)\n```\n\n```css\n.container {\n  display: flex;\n  gap: 1rem;\n}\n```'),
  ),
};

// h2: Links
export const Links: Story = {
  render: () => col(
    md('[Link text](https://example.com) and another [link](https://example.org).\n\nAutolink: https://example.com/autolinked'),
  ),
};

// h2: Images
export const Images: Story = {
  render: () => col(
    md('![Alt text](https://picsum.photos/seed/md1/300/150)\n\nText after image.'),
  ),
};

// h2: Horizontal rule
export const HorizontalRule: Story = {
  render: () => col(
    md('Content above\n\n---\n\nContent below\n\n***\n\nMore content\n\n___\n\nEnd'),
  ),
};

// h2: Table (GFM)
export const TableGfm: Story = {
  render: () => col(
    md('| Name | Age | Role |\n|------|-----|------|\n| Alice | 30 | Engineer |\n| Bob | 25 | Designer |\n| Charlie | 35 | Manager |'),
  ),
};

// h2: Combined formatting
export const CombinedFormatting: Story = {
  render: () => col(
    md('# Project README\n\nA **full-featured** project with *multiple* features.\n\n## Features\n\n- [x] Markdown rendering\n- [x] GFM tables\n- [ ] Custom themes\n- [ ] Plugin system\n\n## Code Example\n\n```javascript\nimport { render } from \'snice\';\nrender(document.body, template);\n```\n\n> **Note:** This is just an example.\n\n---\n\n| Feature | Status |\n|---------|--------|\n| Tables | Done |\n| Lists | Done |\n| Code | Done |\n\nVisit [our docs](https://example.com) for more.'),
  ),
};

// h2: Sanitize: true (default)
export const SanitizeTrue: Story = {
  render: () => col(
    md('Safe content with **bold** and a [link](https://example.com).', { sanitize: '' }),
  ),
};

// h2: Sanitize: false
export const SanitizeFalse: Story = {
  render: () => col(
    md('Content with sanitization disabled. **Bold** still works.', { sanitize: 'false' }),
  ),
};

// h2: Programmatic setContent
export const ProgrammaticSetContent: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-markdown') as any;
    el.style.cssText = 'display:block;max-width:700px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;padding:1rem;';
    wrap.appendChild(el);
    customElements.whenDefined('snice-markdown').then(() => {
      if (typeof el.setContent === 'function') {
        el.setContent('## Dynamic Content\n\nSet via `setContent()` method.\n\n- Item A\n- Item B');
      }
    });
    return wrap;
  },
};

// h2: Empty content
export const EmptyContent: Story = {
  render: () => col(md('')),
};

// h2: Long paragraph (wrapping)
export const LongParagraphWrapping: Story = {
  render: () => col(
    md('This is a very long paragraph that contains enough text to demonstrate how the markdown renderer handles text wrapping within the container. It should wrap naturally at the container boundaries without overflowing. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'),
  ),
};

// h2: Nested formatting in lists
export const NestedFormattingInLists: Story = {
  render: () => col(
    md('- **Bold item** with extra text\n- *Italic item* with `inline code`\n- ~~Struck item~~ replaced\n- [Link item](https://example.com)'),
  ),
};

// h2: Mixed block elements
export const MixedBlockElements: Story = {
  render: () => col(
    md('## Section\n\nParagraph text.\n\n> A quote\n\n- A list item\n\n```\nA code block\n```\n\nAnother paragraph.\n\n| Col A | Col B |\n|-------|-------|\n| 1 | 2 |'),
  ),
};

// h2: CSS Parts Styling
// Parts: base
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; font-family: sans-serif; }
      .parts-demo .label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 0.5rem; }
      .parts-demo .row { display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start; }

      /* Default (unstyled) */
      .parts-demo .demo-default snice-markdown::part(base) {}

      /* Styled: base — custom background, border, border-radius, padding */
      .parts-demo .demo-styled snice-markdown::part(base) {
        background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
        border: 2px solid #7c3aed;
        border-radius: 16px;
        padding: 2rem;
        color: #e2d9f3;
        box-shadow: 0 0 32px rgba(124, 58, 237, 0.4);
      }
    `;

    const content = '# Styled Markdown\n\nThis content is rendered inside a **custom-styled** shadow part.\n\n- Item one\n- Item two\n\n> A blockquote inside the styled part.';

    const defaultEl = document.createElement('snice-markdown');
    defaultEl.style.cssText = 'display:block;max-width:480px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;padding:1rem;';
    defaultEl.textContent = content;

    const styledEl = document.createElement('snice-markdown');
    styledEl.style.cssText = 'display:block;max-width:480px;';
    styledEl.textContent = content;

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
    styledLabel.textContent = 'Styled (::part(base))';
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
