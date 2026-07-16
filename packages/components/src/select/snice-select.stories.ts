import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-select';
import '../button/snice-button';
import type { SelectSize, SelectOption } from './snice-select.types';

type Args = {
  size?: SelectSize;
  value?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  readonly?: boolean;
  loading?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  editable?: boolean;
  allowFreeText?: boolean;
};

const SIZES: SelectSize[] = ['small', 'medium', 'large'];

const SAMPLE_OPTIONS: SelectOption[] = [
  { value: 'apple',      label: 'Apple'      },
  { value: 'banana',     label: 'Banana'     },
  { value: 'cherry',     label: 'Cherry'     },
  { value: 'date',       label: 'Date'       },
  { value: 'elderberry', label: 'Elderberry', disabled: true },
];

function makeSelect(attrs: Record<string, string | boolean> = {}, options: SelectOption[] = SAMPLE_OPTIONS) {
  const el = document.createElement('snice-select');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  (el as any).options = options;
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;width:280px;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function grid(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem;width:100%;max-width:900px;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Select',
  component: 'snice-select',
  tags: ['autodocs'],
  argTypes: {
    size:       { control: 'select', options: SIZES },
    value:      { control: 'text' },
    label:      { control: 'text' },
    helperText: { control: 'text' },
    errorText:  { control: 'text' },
    placeholder:{ control: 'text' },
    disabled:   { control: 'boolean' },
    required:   { control: 'boolean' },
    invalid:    { control: 'boolean' },
    readonly:   { control: 'boolean' },
    loading:    { control: 'boolean' },
    multiple:   { control: 'boolean' },
    searchable: { control: 'boolean' },
    clearable:  { control: 'boolean' },
    editable:   { control: 'boolean' },
    allowFreeText: { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-select');
    if (args.size        !== undefined) el.setAttribute('size',        String(args.size));
    if (args.value       !== undefined) el.setAttribute('value',       String(args.value));
    if (args.label       !== undefined) el.setAttribute('label',       String(args.label));
    if (args.helperText  !== undefined) el.setAttribute('helper-text', String(args.helperText));
    if (args.errorText   !== undefined) el.setAttribute('error-text',  String(args.errorText));
    if (args.placeholder !== undefined) el.setAttribute('placeholder', String(args.placeholder));
    if (args.disabled)   el.toggleAttribute('disabled',   true);
    if (args.required)   el.toggleAttribute('required',   true);
    if (args.invalid)    el.toggleAttribute('invalid',    true);
    if (args.readonly)   el.toggleAttribute('readonly',   true);
    if (args.loading)    el.toggleAttribute('loading',    true);
    if (args.multiple)   el.toggleAttribute('multiple',   true);
    if (args.searchable) el.toggleAttribute('searchable', true);
    if (args.clearable)  el.toggleAttribute('clearable',  true);
    if (args.editable)   el.toggleAttribute('editable',   true);
    if (args.allowFreeText) el.toggleAttribute('allow-free-text', true);
    (el as any).options = SAMPLE_OPTIONS;
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { placeholder: 'Select an option', size: 'medium', label: 'Fruit' },
};

// h2: Sizes
export const Sizes: Story = {
  render: () => col(
    makeSelect({ size: 'small',  label: 'Small',  placeholder: 'Small select'  }),
    makeSelect({ size: 'medium', label: 'Medium', placeholder: 'Medium select' }),
    makeSelect({ size: 'large',  label: 'Large',  placeholder: 'Large select'  }),
  ),
};

// h2: Boolean States
export const BooleanStates: Story = {
  render: () => grid(
    makeSelect({ label: 'Default'  }),
    makeSelect({ label: 'Disabled', disabled: true }),
    makeSelect({ label: 'Readonly', readonly: true }),
    makeSelect({ label: 'Required', required: true }),
    makeSelect({ label: 'Invalid',  invalid:  true }),
    makeSelect({ label: 'Loading',  loading:  true }),
  ),
};

// h2: Clearable
export const Clearable: Story = {
  render: () => col(
    makeSelect({ label: 'Clearable (no value)', clearable: true }),
    makeSelect({ label: 'Clearable (with value)', clearable: true, value: 'apple' }),
  ),
};

// h2: Searchable
export const Searchable: Story = {
  render: () => col(makeSelect({ label: 'Searchable', searchable: true, placeholder: 'Search fruits...' })),
};

// h2: Multiple Selection
export const MultipleSelection: Story = {
  render: () => col(makeSelect({ label: 'Multiple', multiple: true, placeholder: 'Select multiple fruits' })),
};

// h2: Multiple + Pre-selected
export const MultiplePreselected: Story = {
  render: () => col(makeSelect({ label: 'Multiple + Pre-selected', multiple: true, value: 'apple,banana' })),
};

// h2: Disabled Options
export const DisabledOptions: Story = {
  render: () => {
    const opts: SelectOption[] = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B (disabled)', disabled: true },
      { value: 'c', label: 'Option C' },
      { value: 'd', label: 'Option D (disabled)', disabled: true },
      { value: 'e', label: 'Option E' },
    ];
    return col(makeSelect({ label: 'With disabled options' }, opts));
  },
};

// h2: Options with Icons
export const OptionsWithIcons: Story = {
  render: () => {
    const opts: SelectOption[] = [
      { value: 'us', label: 'United States', icon: 'https://flagcdn.com/w20/us.png' },
      { value: 'gb', label: 'United Kingdom', icon: 'https://flagcdn.com/w20/gb.png' },
      { value: 'de', label: 'Germany', icon: 'https://flagcdn.com/w20/de.png' },
    ];
    return col(makeSelect({ label: 'Country', placeholder: 'Select country' }, opts));
  },
};

// h2: Editable (Combobox)
export const EditableCombobox: Story = {
  render: () => col(makeSelect({ label: 'Editable', editable: true, placeholder: 'Type or select...' })),
};

// h2: Pre-selected Value
export const PreselectedValue: Story = {
  render: () => col(makeSelect({ label: 'Pre-selected', value: 'banana' })),
};

// h2: Programmatic Options (via JS)
export const ProgrammaticOptions: Story = {
  render: () => {
    const opts: SelectOption[] = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3' },
    ];
    return col(makeSelect({ label: 'Programmatic', placeholder: 'Options set via JS' }, opts));
  },
};

// h2: Empty Options
export const EmptyOptions: Story = {
  render: () => col(makeSelect({ label: 'No options', placeholder: 'Nothing to select' }, [])),
};

// h2: Sizes x States Matrix
export const AllVariants: Story = {
  render: () => grid(
    makeSelect({ size: 'small',  label: 'Small Default'   }),
    makeSelect({ size: 'medium', label: 'Medium Default'  }),
    makeSelect({ size: 'large',  label: 'Large Default'   }),
    makeSelect({ size: 'small',  label: 'Small Disabled',  disabled: true }),
    makeSelect({ size: 'medium', label: 'Medium Disabled', disabled: true }),
    makeSelect({ size: 'large',  label: 'Large Disabled',  disabled: true }),
  ),
};

// h2: External label lifecycle
export const ExternalLabelLifecycle: Story = {
  render: () => {
    const demo = document.createElement('section');
    demo.id = 'select-label-story';
    demo.dataset.contract = 'external-label-lifecycle';
    demo.style.cssText = 'display:grid;gap:1.25rem;width:min(100%,46rem);';

    const style = document.createElement('style');
    style.textContent = `
      #select-label-story .label-example {
        display: grid;
        gap: .45rem;
        min-width: 0;
      }
      #select-label-story .label-line {
        align-items: baseline;
        display: flex;
        flex-wrap: wrap;
        gap: .35rem;
        font-weight: 600;
      }
      #select-label-story .secondary-label {
        color: var(--snice-color-text-secondary);
        font-size: .8rem;
        font-weight: 500;
      }
      #select-label-story .wrapping-label {
        display: grid;
        gap: .45rem;
      }
      #select-label-story .wrapping-label > :first-child { font-weight: 600; }
      #select-label-story snice-select { width: min(100%, 22rem); }
      #select-label-story .story-actions {
        display: flex;
        flex-wrap: wrap;
        gap: .5rem;
      }
      #select-label-story output {
        color: var(--snice-color-text-secondary);
        overflow-wrap: anywhere;
      }
    `;

    const intro = document.createElement('p');
    intro.textContent = 'External labels name and focus the real shadow control. Change or remove them to exercise live reassociation.';
    intro.style.cssText = 'margin:0;color:var(--snice-color-text-secondary);';

    const explicitExample = document.createElement('div');
    explicitExample.className = 'label-example';
    const labelLine = document.createElement('div');
    labelLine.className = 'label-line';
    const primaryLabel = document.createElement('label');
    primaryLabel.htmlFor = 'select-story-standard';
    primaryLabel.textContent = 'Shipping country';
    const secondaryLabel = document.createElement('label');
    secondaryLabel.className = 'secondary-label';
    secondaryLabel.htmlFor = 'select-story-standard';
    secondaryLabel.setAttribute('aria-label', 'required');
    secondaryLabel.textContent = '(required)';
    labelLine.append(primaryLabel, secondaryLabel);
    const standard = makeSelect({
      id: 'select-story-standard',
      name: 'shipping-country',
      required: true,
      'helper-text': 'Used to calculate delivery options.',
      placeholder: 'Choose a country',
    });
    explicitExample.append(labelLine, standard);

    const wrappingLabel = document.createElement('label');
    wrappingLabel.className = 'wrapping-label';
    const wrappingCaption = document.createElement('span');
    wrappingCaption.textContent = 'Editable destination';
    wrappingLabel.append(wrappingCaption);
    const editable = makeSelect({
      id: 'select-story-editable',
      editable: true,
      'allow-free-text': true,
      'helper-text': 'Choose a suggestion or type a destination.',
      placeholder: 'Type or select',
    });
    wrappingLabel.append(editable);

    const disabledExample = document.createElement('div');
    disabledExample.className = 'label-example';
    const disabledLabel = document.createElement('label');
    disabledLabel.htmlFor = 'select-story-disabled';
    disabledLabel.textContent = 'Unavailable destination';
    const disabled = makeSelect({ id: 'select-story-disabled', disabled: true, value: 'apple' });
    disabledExample.append(disabledLabel, disabled);

    const actions = document.createElement('div');
    actions.className = 'story-actions';
    const changeLabel = document.createElement('snice-button');
    changeLabel.textContent = 'Change label';
    const toggleLabels = document.createElement('snice-button');
    toggleLabels.textContent = 'Remove external labels';
    const toggleError = document.createElement('snice-button');
    toggleError.textContent = 'Show error';
    actions.append(changeLabel, toggleLabels, toggleError);

    const status = document.createElement('output');
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Accessible name: Shipping country required';

    let billing = false;
    changeLabel.addEventListener('button-click', () => {
      billing = !billing;
      primaryLabel.textContent = billing ? 'Billing country' : 'Shipping country';
      status.textContent = `Accessible name: ${primaryLabel.textContent} required`;
    });

    let associated = true;
    toggleLabels.addEventListener('button-click', () => {
      associated = !associated;
      for (const label of [primaryLabel, secondaryLabel]) {
        if (associated) label.htmlFor = standard.id;
        else label.removeAttribute('for');
      }
      toggleLabels.textContent = associated ? 'Remove external labels' : 'Restore external labels';
      status.textContent = associated
        ? `Accessible name: ${primaryLabel.textContent} required`
        : 'Accessible name fallback: Select';
    });

    let showingError = false;
    toggleError.addEventListener('button-click', () => {
      showingError = !showingError;
      (standard as any).invalid = showingError;
      (standard as any).errorText = showingError ? 'Choose an available country.' : '';
      toggleError.textContent = showingError ? 'Clear error' : 'Show error';
      status.textContent = showingError
        ? 'Error replaces the helper description.'
        : 'Helper description restored.';
    });

    demo.append(style, intro, explicitExample, wrappingLabel, disabledExample, actions, status);
    return demo;
  },
};

// Available CSS Parts: label, input, arrow, trigger, value, spinner, dropdown, search, search-input, options, option, helper-text, error-text
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const defaultSection = document.createElement('div');
    const defaultLabel = document.createElement('h3');
    defaultLabel.textContent = 'Default';
    defaultLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    defaultSection.appendChild(defaultLabel);
    defaultSection.appendChild(col(makeSelect({ label: 'Fruit', placeholder: 'Select a fruit' })));
    wrap.appendChild(defaultSection);

    const styledSection = document.createElement('div');
    styledSection.className = 'parts-demo-select';
    const styledLabel = document.createElement('h3');
    styledLabel.textContent = 'Styled with ::part()';
    styledLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    styledSection.appendChild(styledLabel);

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-select snice-select::part(label) {
        color: #10b981;
        font-weight: 700;
        font-size: 0.78rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .parts-demo-select snice-select::part(trigger) {
        background: linear-gradient(135deg, #064e3b, #065f46);
        border: 2px solid #10b981;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
      }
      .parts-demo-select snice-select::part(value) {
        color: #a7f3d0;
        font-weight: 600;
        font-size: 0.9rem;
      }
      .parts-demo-select snice-select::part(arrow) {
        color: #10b981;
        font-size: 1.1em;
      }
      .parts-demo-select snice-select::part(spinner) {
        border-color: rgba(16, 185, 129, 0.3);
        border-top-color: #10b981;
      }
    `;
    styledSection.appendChild(style);
    styledSection.appendChild(col(makeSelect({ label: 'Styled Select', placeholder: 'Pick an option' })));
    wrap.appendChild(styledSection);

    return wrap;
  },
};

export const CSSPartsAdvanced: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const label = document.createElement('h3');
    label.textContent = 'Dropdown, options, and search parts';
    label.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    wrap.appendChild(label);

    const styledSection = document.createElement('div');
    styledSection.className = 'parts-demo-select-adv';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-select-adv snice-select::part(dropdown) {
        background: #1e1b4b;
        border: 2px solid #6366f1;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(99, 102, 241, 0.4);
        padding: 4px;
      }
      .parts-demo-select-adv snice-select::part(options) {
        padding: 2px 0;
      }
      .parts-demo-select-adv snice-select::part(option) {
        color: #c7d2fe;
        border-radius: 8px;
        margin: 2px 4px;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        transition: background 0.1s;
      }
      .parts-demo-select-adv snice-select::part(option):hover {
        background: rgba(99, 102, 241, 0.3);
        color: #e0e7ff;
      }
      .parts-demo-select-adv snice-select::part(search) {
        padding: 0.4rem 0.5rem;
        border-bottom: 1px solid rgba(99, 102, 241, 0.3);
      }
      .parts-demo-select-adv snice-select::part(search-input) {
        background: rgba(99, 102, 241, 0.15);
        border: 1px solid #6366f1;
        border-radius: 6px;
        color: #e0e7ff;
        font-size: 0.85rem;
        padding: 0.3rem 0.5rem;
      }
      .parts-demo-select-adv snice-select::part(trigger) {
        background: linear-gradient(135deg, #1e1b4b, #2d2b6b);
        border: 2px solid #6366f1;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
      }
      .parts-demo-select-adv snice-select::part(value) {
        color: #c7d2fe;
        font-weight: 500;
      }
      .parts-demo-select-adv snice-select::part(arrow) {
        color: #818cf8;
      }
      .parts-demo-select-adv snice-select::part(label) {
        color: #818cf8;
        font-weight: 600;
        font-size: 0.8rem;
        letter-spacing: 0.06em;
      }
    `;
    styledSection.appendChild(style);
    styledSection.appendChild(col(makeSelect({ label: 'Advanced Parts', placeholder: 'Open to see styled dropdown', searchable: true })));
    wrap.appendChild(styledSection);

    return wrap;
  },
};
