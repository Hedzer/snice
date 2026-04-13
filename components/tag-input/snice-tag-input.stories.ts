import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-tag-input';

type Args = {
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  label?: string;
  maxTags?: number;
  allowDuplicates?: boolean;
};

function makeTI(attrs: Record<string, string | boolean | number> = {}, value?: string[], suggestions?: string[]) {
  const el = document.createElement('snice-tag-input');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, String(v));
  }
  if (value)       (el as any).value = value;
  if (suggestions) (el as any).suggestions = suggestions;
  el.style.maxWidth = '400px';
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const LANGS = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java', 'C#', 'Ruby', 'Swift', 'Kotlin'];

const meta: Meta<Args> = {
  title: 'Form/TagInput',
  component: 'snice-tag-input',
  tags: ['autodocs'],
  argTypes: {
    placeholder:     { control: 'text' },
    disabled:        { control: 'boolean' },
    readonly:        { control: 'boolean' },
    label:           { control: 'text' },
    maxTags:         { control: 'number' },
    allowDuplicates: { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-tag-input');
    if (args.placeholder !== undefined) el.setAttribute('placeholder', String(args.placeholder));
    if (args.label       !== undefined) el.setAttribute('label',       String(args.label));
    if (args.maxTags     !== undefined) el.setAttribute('max-tags',    String(args.maxTags));
    if (args.disabled)        el.toggleAttribute('disabled',         true);
    if (args.readonly)        el.toggleAttribute('readonly',         true);
    if (args.allowDuplicates) el.setAttribute('allow-duplicates',   'true');
    el.style.maxWidth = '400px';
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { placeholder: 'Add a tag...' },
};

// h2: Default (Empty)
export const DefaultEmpty: Story = {
  render: () => makeTI({ placeholder: 'Add a tag...' }),
};

// h2: With Label
export const WithLabel: Story = {
  render: () => makeTI({ label: 'Skills', placeholder: 'Add skills...' }),
};

// h2: Pre-populated Tags
export const PrePopulatedTags: Story = {
  render: () => makeTI({ label: 'Technologies' }, ['JavaScript', 'TypeScript', 'React']),
};

// h2: With Suggestions
export const WithSuggestions: Story = {
  render: () => makeTI({ label: 'Programming Languages', placeholder: 'Type to see suggestions...' }, [], LANGS),
};

// h2: Max Tags (3)
export const MaxTagsThree: Story = {
  render: () => col(
    makeTI({ label: 'Max 3 tags', 'max-tags': '3', placeholder: 'Max 3 tags...' }),
    makeTI({ label: 'At max (3/3)', 'max-tags': '3' }, ['Tag 1', 'Tag 2', 'Tag 3']),
  ),
};

// h2: Max Tags (1)
export const MaxTagsOne: Story = {
  render: () => makeTI({ label: 'Max 1 tag', 'max-tags': '1', placeholder: 'Only one tag...' }),
};

// h2: Allow Duplicates
export const AllowDuplicates: Story = {
  render: () => makeTI({ label: 'Duplicates allowed', 'allow-duplicates': true, placeholder: 'Duplicates OK...' }),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => makeTI({ label: 'Disabled', disabled: true }, ['Tag 1', 'Tag 2']),
};

// h2: Readonly
export const Readonly: Story = {
  render: () => makeTI({ label: 'Readonly', readonly: true }, ['Read', 'Only', 'Tags']),
};

// h2: Custom Placeholder
export const CustomPlaceholder: Story = {
  render: () => makeTI({ placeholder: 'Enter keywords separated by comma...' }),
};

// h2: Named (Form Integration)
export const NamedFormIntegration: Story = {
  render: () => makeTI({ name: 'tags', label: 'Form tags (name=tags)', placeholder: 'Add tags...' }),
};

// h2: No Label
export const NoLabel: Story = {
  render: () => makeTI({ placeholder: 'No label tag input...' }),
};

// h2: With Suggestions + Pre-populated
export const WithSuggestionsPrePopulated: Story = {
  render: () => makeTI({ label: 'Frameworks', placeholder: 'Add frameworks...' }, ['React', 'Vue'], ['React', 'Vue', 'Angular', 'Svelte', 'Solid']),
};

// h2: Many Tags
export const ManyTags: Story = {
  render: () => makeTI({ label: 'Many tags' }, ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta']),
};

export const AllVariants: Story = {
  render: () => col(
    makeTI({ label: 'Default (empty)', placeholder: 'Add a tag...' }),
    makeTI({ label: 'With suggestions', placeholder: 'Type to filter...' }, [], LANGS),
    makeTI({ label: 'Pre-populated' }, ['Tag A', 'Tag B', 'Tag C']),
    makeTI({ label: 'Max 2 tags', 'max-tags': '2' }),
    makeTI({ label: 'Disabled', disabled: true }, ['Tag 1', 'Tag 2']),
    makeTI({ label: 'Readonly', readonly: true }, ['Read', 'Only']),
  ),
};

// Available CSS Parts: base, label, container, tag, tag-text, input, suggestions
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const defaultSection = document.createElement('div');
    const defaultLabel = document.createElement('h3');
    defaultLabel.textContent = 'Default';
    defaultLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    defaultSection.appendChild(defaultLabel);
    defaultSection.appendChild(makeTI({ label: 'Skills', placeholder: 'Add a tag...' }, ['TypeScript', 'React']));
    wrap.appendChild(defaultSection);

    const styledSection = document.createElement('div');
    styledSection.className = 'parts-demo-tag-input';
    const styledLabel = document.createElement('h3');
    styledLabel.textContent = 'Styled with ::part()';
    styledLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    styledSection.appendChild(styledLabel);

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-tag-input snice-tag-input::part(label) {
        color: #e879f9;
        font-weight: 700;
        font-size: 0.78rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .parts-demo-tag-input snice-tag-input::part(container) {
        background: linear-gradient(135deg, #1a0033, #2d0057);
        border: 2px solid #c026d3;
        border-radius: 12px;
        box-shadow: 0 0 16px rgba(192, 38, 211, 0.3);
        padding: 0.4rem 0.6rem;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .parts-demo-tag-input snice-tag-input::part(tag) {
        background: linear-gradient(135deg, #86198f, #a21caf);
        border: 1px solid #e879f9;
        border-radius: 20px;
        box-shadow: 0 2px 8px rgba(168, 28, 175, 0.5);
        padding: 0.15rem 0.55rem;
      }
      .parts-demo-tag-input snice-tag-input::part(tag-text) {
        color: #fae8ff;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.04em;
      }
      .parts-demo-tag-input snice-tag-input::part(input) {
        background: transparent;
        color: #f0abfc;
        font-size: 0.875rem;
        caret-color: #e879f9;
        min-width: 80px;
      }
      .parts-demo-tag-input snice-tag-input::part(input)::placeholder {
        color: rgba(232, 121, 249, 0.4);
        font-style: italic;
      }
      .parts-demo-tag-input snice-tag-input::part(suggestions) {
        background: #1a0033;
        border: 2px solid #c026d3;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(192, 38, 211, 0.4);
      }
    `;
    styledSection.appendChild(style);

    const ti = makeTI({ label: 'Styled Tags', placeholder: 'Add tags...' }, ['TypeScript', 'React'], LANGS);
    styledSection.appendChild(ti);
    wrap.appendChild(styledSection);

    return wrap;
  },
};
