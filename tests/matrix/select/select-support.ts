/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-select — matrix oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Derived from `docs/ai/components/select.md`, `snice-select.types.ts` and
 * `snice-option.types.ts`. The documented surface this oracle encodes:
 *
 *   · presentation — `size`, `label`, `helperText`, `errorText` ("wins over
 *     helperText"), `placeholder`, and the parts `label`, `trigger`, `value`,
 *     `input`, `arrow`, `spinner`, `dropdown`, `search`, `search-input`,
 *     `options`, `option`, `helper-text`, `error-text`;
 *   · modes — `editable` ("Text input trigger instead of button"), `multiple`,
 *     `searchable`, `clearable`, `loading`, `disabled`, `readonly`, `required`,
 *     `invalid`;
 *   · options — the `options` array and `<snice-option>` children, with
 *     "Children take precedence over `options` array"; an option's `value`
 *     "Falls back to label" and its `label` "Falls back to textContent";
 *   · value — "`value` is live; `defaultValue` reflects the host `value`
 *     attribute", "comma-separated for multiple";
 *   · events — `select-change` → `{ value, option?, select }`, `select-open`
 *     and `select-close` → `{ select }`;
 *   · a11y — the trigger is a `listbox` opener with reflective `aria-expanded`,
 *     the dropdown is a `listbox`, each option a `role="option"` with
 *     `aria-selected`/`aria-disabled`, "One helper/error description, with
 *     error precedence", "Arrow keys, Enter, Escape for keyboard navigation".
 */
import { mount, one, all, part, text, wait, expectNoProblems } from '../matrix-utils';
import type { SelectOption } from '../../../packages/components/src/select/snice-select.types';
import '../../../packages/components/src/select/snice-select';
import '../../../packages/components/src/select/snice-option';

export { wait, expectNoProblems, one, all, part, text };

export const SIZES = ['small', 'medium', 'large'] as const;

/** The option set most combos use. */
export const FRUITS: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

export const WITH_EXTRAS: SelectOption[] = [
  { value: 'apple', label: 'Apple', icon: '/icons/apple.svg' },
  { value: 'banana', label: 'Banana', disabled: true },
  { value: 'cherry', label: 'Cherry' },
];

export type OptionSource = 'array' | 'children' | 'both';

export interface SelectCombo {
  size: 'small' | 'medium' | 'large';
  editable: boolean;
  multiple: boolean;
  searchable: boolean;
  clearable: boolean;
  disabled: boolean;
  readonly: boolean;
  loading: boolean;
  required: boolean;
  invalid: boolean;
  allowFreeText: boolean;
  label: string;
  helperText: string;
  errorText: string;
  placeholder?: string;
  name: string;
  value?: string;
  options: SelectOption[];
  source: OptionSource;
}

export function combo(over: Partial<SelectCombo> = {}): SelectCombo {
  return {
    size: 'medium',
    editable: false,
    multiple: false,
    searchable: false,
    clearable: false,
    disabled: false,
    readonly: false,
    loading: false,
    required: false,
    invalid: false,
    allowFreeText: false,
    label: '',
    helperText: '',
    errorText: '',
    name: 'fruit',
    options: FRUITS,
    source: 'array',
    ...over,
  };
}

export function comboName(c: SelectCombo): string {
  const flags = [
    ...(c.editable ? ['editable'] : []),
    ...(c.multiple ? ['multiple'] : []),
    ...(c.searchable ? ['searchable'] : []),
    ...(c.clearable ? ['clearable'] : []),
    ...(c.disabled ? ['disabled'] : []),
    ...(c.readonly ? ['readonly'] : []),
    ...(c.loading ? ['loading'] : []),
    ...(c.required ? ['required'] : []),
    ...(c.invalid ? ['invalid'] : []),
  ];
  const text = [c.label && 'label', c.helperText && 'helper', c.errorText && 'error']
    .filter(Boolean).join('+');
  return `${c.size}/${c.source}/[${flags.join(',') || 'plain'}]${text ? `/${text}` : ''}`;
}

function childMarkup(options: SelectOption[]): string {
  return options.map(option => {
    const attrs = [
      `value="${option.value}"`,
      option.disabled ? 'disabled' : '',
      option.icon ? `icon="${option.icon}"` : '',
    ].filter(Boolean).join(' ');
    return `<snice-option ${attrs}>${option.label}</snice-option>`;
  }).join('');
}

export async function makeSelect(c: SelectCombo): Promise<any> {
  const attrs: Record<string, any> = {
    size: c.size,
    name: c.name,
    ...(c.label ? { label: c.label } : {}),
    ...(c.helperText ? { 'helper-text': c.helperText } : {}),
    ...(c.errorText ? { 'error-text': c.errorText } : {}),
    ...(c.placeholder !== undefined ? { placeholder: c.placeholder } : {}),
    ...(c.value !== undefined ? { value: c.value } : {}),
    ...(c.editable ? { editable: true } : {}),
    ...(c.multiple ? { multiple: true } : {}),
    ...(c.searchable ? { searchable: true } : {}),
    ...(c.clearable ? { clearable: true } : {}),
    ...(c.disabled ? { disabled: true } : {}),
    ...(c.readonly ? { readonly: true } : {}),
    ...(c.loading ? { loading: true } : {}),
    ...(c.required ? { required: true } : {}),
    ...(c.invalid ? { invalid: true } : {}),
    ...(c.allowFreeText ? { 'allow-free-text': true } : {}),
  };
  const markup = c.source === 'array' ? '' : childMarkup(c.options);
  const el = await mount<any>('snice-select', attrs, markup);
  if (c.source !== 'children') el.options = c.options.map(option => ({ ...option }));
  await wait(40);
  return el;
}

// ── Documented derivations ──────────────────────────────────────────────────

/**
 * The option list the dropdown is documented to show: "Children take precedence
 * over `options` array", so when both are supplied the children win.
 */
export function expectedOptions(c: SelectCombo): SelectOption[] {
  return c.options;
}

/** The values a `value` string selects: "comma-separated for multiple". */
export function selectedValuesOf(value: string, multiple: boolean): string[] {
  if (!value) return [];
  return multiple ? value.split(',').map(part => part.trim()).filter(Boolean) : [value];
}

// ── Reading the rendered select ─────────────────────────────────────────────

/**
 * Exact CSS-part lookup.
 *
 * `[part~="input"]` is the right selector, but happy-dom's `~=` matching is not
 * reliable enough to distinguish `part="input"` from `part="search-input"` —
 * and this component ships both. The matrix splits the attribute itself so a
 * part assertion cannot pass on a near-miss.
 */
export function partOf<T extends HTMLElement = HTMLElement>(el: HTMLElement, name: string): T | null {
  return partsOf<T>(el, name)[0] ?? null;
}

export function partsOf<T extends HTMLElement = HTMLElement>(el: HTMLElement, name: string): T[] {
  return all<T>(el, '[part]').filter(node =>
    (node.getAttribute('part') ?? '').split(/\s+/).includes(name));
}

export function triggerEl(el: HTMLElement): HTMLElement | null {
  return partOf(el, 'trigger');
}

export function inputEl(el: HTMLElement): HTMLInputElement | null {
  return partOf<HTMLInputElement>(el, 'input');
}

/** Whichever of trigger/input this mode renders — the focusable control. */
export function control(el: HTMLElement): HTMLElement | null {
  return triggerEl(el) ?? inputEl(el);
}

export function dropdown(el: HTMLElement): HTMLElement | null {
  return partOf(el, 'dropdown');
}

export function optionEls(el: HTMLElement): HTMLElement[] {
  return partsOf(el, 'option');
}

export function optionValues(el: HTMLElement): string[] {
  return optionEls(el).map(option => option.getAttribute('data-value') ?? '');
}

export function optionLabels(el: HTMLElement): string[] {
  return optionEls(el).map(option => text(option.querySelector('.select-option-label')));
}

export function selectedOptionValues(el: HTMLElement): string[] {
  return optionEls(el)
    .filter(option => option.getAttribute('aria-selected') === 'true')
    .map(option => option.getAttribute('data-value') ?? '');
}

export function valueDisplay(el: HTMLElement): string {
  return text(partOf(el, 'value'));
}

export function searchInput(el: HTMLElement): HTMLInputElement | null {
  return partOf<HTMLInputElement>(el, 'search-input');
}

export function clearButton(el: HTMLElement): HTMLElement | null {
  return one<HTMLElement>(el, '.select-clear');
}

/**
 * The oracle every structural combo runs through.
 */
export function checkSelect(el: HTMLElement, c: SelectCombo): string[] {
  const problems: string[] = [];
  const state = el as any;

  // ── Mode: exactly one trigger surface ────────────────────────────────────
  const button = triggerEl(el);
  const input = inputEl(el);
  if (c.editable) {
    if (!input) problems.push('editable but no part="input"');
    if (button) problems.push('editable but a button trigger was rendered too');
  } else {
    if (!button) problems.push('no part="trigger"');
    if (input) problems.push('a text input was rendered outside editable mode');
  }

  // ── Documented parts that exist in every mode ────────────────────────────
  for (const name of ['label', 'dropdown', 'options', 'arrow']) {
    if (name === 'arrow' && !c.editable) continue; // the button renders its own chevron
    if (!partOf(el, name)) problems.push(`part="${name}" missing`);
  }

  // ── The label part carries `label`, and hides when there is none ─────────
  const labelPart = partOf(el, 'label');
  if (labelPart) {
    if (text(labelPart) !== c.label) {
      problems.push(`label reads "${text(labelPart)}", expected "${c.label}"`);
    }
    if (labelPart.hasAttribute('hidden') === Boolean(c.label)) {
      problems.push(`label ${c.label ? 'hidden with' : 'shown without'} a label`);
    }
  }

  // ── One description, error first ─────────────────────────────────────────
  const errorPart = partOf(el, 'error-text');
  const helperPart = partOf(el, 'helper-text');
  if (c.errorText) {
    if (!errorPart) problems.push('errorText set but no part="error-text"');
    else if (text(errorPart) !== c.errorText) {
      problems.push(`error-text reads "${text(errorPart)}", expected "${c.errorText}"`);
    }
    if (helperPart) problems.push('helper-text rendered alongside error-text — errorText wins');
  } else if (c.helperText) {
    if (!helperPart) problems.push('helperText set but no part="helper-text"');
    else if (text(helperPart) !== c.helperText) {
      problems.push(`helper-text reads "${text(helperPart)}", expected "${c.helperText}"`);
    }
    if (errorPart) problems.push('error-text rendered with no errorText');
  } else {
    if (errorPart || helperPart) problems.push('a description was rendered with neither text set');
  }

  // exactly one aria-describedby target
  const described = control(el)?.getAttribute('aria-describedby') ?? '';
  const wantDescribed = Boolean(c.errorText || c.helperText);
  if (Boolean(described) !== wantDescribed) {
    problems.push(`aria-describedby="${described}" with ${wantDescribed ? 'a' : 'no'} description`);
  }
  if (described && described.split(/\s+/).length !== 1) {
    problems.push(`aria-describedby names ${described.split(/\s+/).length} targets, expected exactly 1`);
  }

  // ── aria-invalid follows `invalid` (or a calculated invalid state) ───────
  const ariaInvalid = control(el)?.getAttribute('aria-invalid');
  if (c.invalid && ariaInvalid !== 'true') {
    problems.push(`aria-invalid="${ariaInvalid}" with invalid set`);
  }

  // ── Dropdown a11y ────────────────────────────────────────────────────────
  const list = dropdown(el);
  if (list && list.getAttribute('role') !== 'listbox') {
    problems.push(`dropdown role="${list.getAttribute('role')}", expected "listbox"`);
  }
  const expanded = control(el)?.getAttribute('aria-expanded');
  if (expanded !== String(state.isOpen)) {
    problems.push(`aria-expanded="${expanded}", expected "${state.isOpen}"`);
  }

  // ── Search field: only when searchable, and never in editable mode ───────
  const search = partOf(el, 'search');
  const wantSearch = c.searchable && !c.editable;
  if (search && search.hasAttribute('hidden') === wantSearch) {
    problems.push(`search field ${wantSearch ? 'hidden' : 'shown'} for searchable=${c.searchable}/editable=${c.editable}`);
  }

  // ── Loading renders the spinner instead of the chevron ───────────────────
  if (!c.editable) {
    const spinner = partOf(el, 'spinner');
    if (c.loading && !spinner) problems.push('loading but no part="spinner"');
    if (!c.loading && spinner) problems.push('spinner rendered while not loading');
  }

  // ── The rendered options are the documented option list ──────────────────
  const want = expectedOptions(c);
  const gotValues = optionValues(el);
  if (gotValues.join(',') !== want.map(option => option.value).join(',')) {
    problems.push(`options [${gotValues.join(',')}] != [${want.map(o => o.value).join(',')}]`);
  }
  const gotLabels = optionLabels(el);
  if (gotLabels.join('|') !== want.map(option => option.label).join('|')) {
    problems.push(`option labels [${gotLabels.join(',')}] != [${want.map(o => o.label).join(',')}]`);
  }
  for (const [index, option] of optionEls(el).entries()) {
    const documented = want[index];
    if (!documented) continue;
    if (option.getAttribute('role') !== 'option') {
      problems.push(`option ${index} role="${option.getAttribute('role')}"`);
    }
    if (option.getAttribute('aria-disabled') !== String(Boolean(documented.disabled))) {
      problems.push(`option "${documented.value}" aria-disabled="${option.getAttribute('aria-disabled')}",`
        + ` expected "${Boolean(documented.disabled)}"`);
    }
  }

  // ── Selection is what `value` says it is ─────────────────────────────────
  const wantSelected = selectedValuesOf(state.value ?? '', c.multiple)
    .filter(value => want.some(option => option.value === value));
  const gotSelected = selectedOptionValues(el);
  if (gotSelected.sort().join(',') !== [...wantSelected].sort().join(',')) {
    problems.push(`selected [${gotSelected.join(',')}] != [${wantSelected.join(',')}]`);
  }

  // ── The property vector the element reports back ─────────────────────────
  const expectations: Array<[string, unknown]> = [
    ['size', c.size], ['editable', c.editable], ['multiple', c.multiple],
    ['searchable', c.searchable], ['clearable', c.clearable], ['disabled', c.disabled],
    ['readonly', c.readonly], ['loading', c.loading], ['required', c.required],
    ['invalid', c.invalid], ['allowFreeText', c.allowFreeText], ['name', c.name],
  ];
  for (const [property, value] of expectations) {
    if (state[property] !== value) {
      problems.push(`${property}=${JSON.stringify(state[property])}, expected ${JSON.stringify(value)}`);
    }
  }
  if (state.type !== (c.multiple ? 'select-multiple' : 'select-one')) {
    problems.push(`type="${state.type}", expected "${c.multiple ? 'select-multiple' : 'select-one'}"`);
  }

  return problems;
}

// ── Interaction ─────────────────────────────────────────────────────────────

export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

export function press(node: EventTarget | null | undefined, key: string): void {
  node?.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
}

export function clickOption(el: HTMLElement, value: string): void {
  click(one(el, `[part~="option"][data-value="${value}"]`));
}

export function typeInto(input: HTMLInputElement | null, value: string): void {
  if (!input) throw new Error('no input to type into');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

export interface Recorded { type: string; detail: any }

export function record(el: HTMLElement): Recorded[] {
  const seen: Recorded[] = [];
  for (const type of ['select-change', 'select-open', 'select-close']) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

export function typesOf(events: Recorded[], type: string): Recorded[] {
  return events.filter(event => event.type === type);
}
