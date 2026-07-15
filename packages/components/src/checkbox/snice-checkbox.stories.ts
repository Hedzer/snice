import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-checkbox';
import type { CheckboxSize, SniceCheckboxElement } from './snice-checkbox.types';

type Args = {
  size?: CheckboxSize;
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  invalid?: boolean;
  name?: string;
  value?: string;
  label?: string;
};

const SIZES: CheckboxSize[] = ['small', 'medium', 'large'];

function makeCB(attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-checkbox');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:.75rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Checkbox',
  component: 'snice-checkbox',
  tags: ['autodocs'],
  argTypes: {
    size:          { control: 'select', options: SIZES },
    checked:       { control: 'boolean', description: 'Live checked property' },
    defaultChecked:{ control: 'boolean', description: 'Reset default / checked attribute' },
    indeterminate: { control: 'boolean' },
    disabled:      { control: 'boolean' },
    loading:       { control: 'boolean' },
    required:      { control: 'boolean' },
    invalid:       { control: 'boolean' },
    name:          { control: 'text' },
    value:         { control: 'text' },
    label:         { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-checkbox') as SniceCheckboxElement;
    if (args.size  !== undefined) el.setAttribute('size', String(args.size));
    if (args.label !== undefined) el.setAttribute('label', String(args.label));
    if (args.name  !== undefined) el.name = args.name;
    if (args.value !== undefined) el.value = args.value;
    if (args.defaultChecked !== undefined) el.defaultChecked = args.defaultChecked;
    if (args.checked !== undefined) el.checked = args.checked;
    if (args.indeterminate) el.toggleAttribute('indeterminate', true);
    if (args.disabled)      el.toggleAttribute('disabled',      true);
    if (args.loading)       el.toggleAttribute('loading',       true);
    if (args.required)      el.toggleAttribute('required',      true);
    if (args.invalid)       el.toggleAttribute('invalid',       true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { label: 'Accept terms', size: 'medium' },
};

// h2: Default (unchecked)
export const Unchecked: Story = {
  render: () => col(makeCB({ label: 'Unchecked checkbox' })),
};

// h2: Checked
export const Checked: Story = {
  render: () => col(makeCB({ label: 'Checked checkbox', checked: true })),
};

// h2: Indeterminate
export const Indeterminate: Story = {
  render: () => col(makeCB({ label: 'Indeterminate', indeterminate: true })),
};

// h2: Sizes
export const Sizes: Story = {
  render: () => col(
    ...SIZES.map(size => makeCB({ size, label: `${size.charAt(0).toUpperCase() + size.slice(1)} checkbox` })),
  ),
};

// h2: Sizes x Checked
export const SizesXChecked: Story = {
  render: () => col(
    ...SIZES.map(size => makeCB({ size, label: `${size.charAt(0).toUpperCase() + size.slice(1)} (checked)`, checked: true })),
  ),
};

// h2: Sizes x Indeterminate
export const SizesXIndeterminate: Story = {
  render: () => col(
    ...SIZES.map(size => makeCB({ size, label: `${size.charAt(0).toUpperCase() + size.slice(1)} (indeterminate)`, indeterminate: true })),
  ),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => col(
    makeCB({ label: 'Disabled (unchecked)', disabled: true }),
    makeCB({ label: 'Disabled (checked)',   disabled: true, checked: true }),
  ),
};

// h2: Loading
export const Loading: Story = {
  render: () => col(
    makeCB({ label: 'Loading (unchecked)', loading: true }),
    makeCB({ label: 'Loading (checked)',   loading: true, checked: true }),
  ),
};

// h2: Loading x Sizes
export const LoadingXSizes: Story = {
  render: () => col(
    ...SIZES.map(size => makeCB({ size, label: `Loading ${size}`, loading: true })),
  ),
};

// h2: Required
export const Required: Story = {
  render: () => col(makeCB({ label: 'Required checkbox', required: true })),
};

// h2: Invalid
export const Invalid: Story = {
  render: () => col(makeCB({ label: 'Invalid checkbox', invalid: true })),
};

// h2: Required + Invalid
export const RequiredAndInvalid: Story = {
  render: () => col(makeCB({ label: 'Required + Invalid', required: true, invalid: true })),
};

// h2: No label
export const NoLabel: Story = {
  render: () => row(
    makeCB({ checked: true }),
    makeCB({ indeterminate: true }),
    makeCB({}),
  ),
};

// h2: Long label
export const LongLabel: Story = {
  render: () => col(
    makeCB({ label: 'I agree to the terms and conditions of service, privacy policy, and all associated legal documents as outlined in the user agreement' }),
  ),
};

// h2: Native form integration
export const FormIntegration: Story = {
  render: () => {
    const form = document.createElement('form');
    form.id = 'checkbox-story-form';
    form.style.cssText = 'display:flex;flex-direction:column;gap:.875rem;max-width:32rem;';
    form.innerHTML = `
      <snice-checkbox
        id="checkbox-story-terms"
        name="terms"
        value="accepted"
        label="Accept the terms"
        required
      ></snice-checkbox>
      <snice-checkbox
        id="checkbox-story-digest"
        name="digest"
        value="weekly"
        label="Weekly digest (checked by default)"
        checked
      ></snice-checkbox>
      <fieldset disabled style="display:flex;flex-direction:column;gap:.75rem;border:1px solid var(--snice-color-border, #475569);border-radius:.5rem;padding:.75rem;">
        <legend>
          Disabled fieldset
          <snice-checkbox
            id="checkbox-story-legend"
            name="legend-choice"
            value="kept"
            label="First legend remains enabled"
            checked
          ></snice-checkbox>
        </legend>
        <snice-checkbox
          id="checkbox-story-fieldset"
          name="disabled-choice"
          value="omitted"
          label="Descendant is effectively disabled"
          checked
        ></snice-checkbox>
      </fieldset>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
        <button type="submit">Submit</button>
        <button type="reset">Reset defaults</button>
      </div>
      <output aria-live="polite">Ready</output>
    `;

    const output = form.querySelector('output')!;
    const describeData = () => Array.from(new FormData(form).entries())
      .map(([name, value]) => `${name}=${String(value)}`)
      .join(', ') || '(empty)';
    form.addEventListener('submit', event => {
      event.preventDefault();
      output.textContent = `Submitted: ${describeData()}`;
    });
    form.addEventListener('reset', () => {
      requestAnimationFrame(() => { output.textContent = `Reset: ${describeData()}`; });
    });
    return form;
  },
};

export const AllVariants: Story = {
  render: () => col(
    makeCB({ label: 'Unchecked' }),
    makeCB({ label: 'Checked',       checked: true }),
    makeCB({ label: 'Indeterminate', indeterminate: true }),
    makeCB({ label: 'Disabled',      disabled: true }),
    makeCB({ label: 'Disabled + Checked', disabled: true, checked: true }),
    makeCB({ label: 'Invalid',       invalid: true }),
    makeCB({ label: 'Loading',       loading: true }),
    makeCB({ label: 'Required',      required: true }),
  ),
};

// Available CSS Parts: input, checkbox, spinner, label
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const defaultSection = document.createElement('div');
    const defaultLabel = document.createElement('h3');
    defaultLabel.textContent = 'Default';
    defaultLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    defaultSection.appendChild(defaultLabel);
    defaultSection.appendChild(col(
      makeCB({ label: 'Unchecked checkbox' }),
      makeCB({ label: 'Checked checkbox', checked: true }),
      makeCB({ label: 'Loading checkbox', loading: true }),
    ));
    wrap.appendChild(defaultSection);

    const styledSection = document.createElement('div');
    styledSection.className = 'parts-demo-checkbox';
    const styledLabel = document.createElement('h3');
    styledLabel.textContent = 'Styled with ::part()';
    styledLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    styledSection.appendChild(styledLabel);

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-checkbox snice-checkbox::part(checkbox) {
        background: linear-gradient(135deg, #2d1b69, #1a0a4a);
        border: 2px solid #7c3aed;
        border-radius: 8px;
        box-shadow: 0 0 8px rgba(124, 58, 237, 0.4);
        width: 22px;
        height: 22px;
        transition: box-shadow 0.2s, border-color 0.2s;
      }
      .parts-demo-checkbox snice-checkbox.styled-default-checked::part(checkbox) {
        background: linear-gradient(135deg, #7c3aed, #5b21b6);
        border-color: #a78bfa;
        box-shadow: 0 0 16px rgba(124, 58, 237, 0.7);
      }
      .parts-demo-checkbox snice-checkbox::part(label) {
        color: #c4b5fd;
        font-weight: 600;
        font-size: 0.9rem;
        letter-spacing: 0.02em;
      }
      .parts-demo-checkbox snice-checkbox::part(spinner) {
        border-color: rgba(167, 139, 250, 0.3);
        border-top-color: #a78bfa;
      }
    `;
    styledSection.appendChild(style);

    styledSection.appendChild(col(
      makeCB({ label: 'Styled unchecked', size: 'medium' }),
      makeCB({ class: 'styled-default-checked', label: 'Styled checked', checked: true, size: 'medium' }),
      makeCB({ label: 'Styled loading', loading: true, size: 'medium' }),
    ));
    wrap.appendChild(styledSection);

    return wrap;
  },
};
