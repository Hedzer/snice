/**
 * Shared harness for the snice-segmented-control feature-combination matrix.
 *
 * Every combo routes through ONE oracle, `expectRender`, whose expectations are
 * derived from docs/ai/components/segmented-control.md — never from observed
 * output:
 *
 *   · the root carries `part="base"` and `role="radiogroup"`, plus the
 *     size modifier class for the declared `size`;
 *   · a sliding `part="indicator"` element exists;
 *   · there is exactly one `part="segment"` button per option, in order, each
 *     with `role="radio"`, its option label as text, and `data-value` /
 *     `data-index` naming its option;
 *   · `aria-checked` is true on exactly the option whose value equals the
 *     control's `value`, false everywhere else;
 *   · `aria-disabled` mirrors the OPTION's own `disabled` flag, while the
 *     native `disabled` attribute is the OR of the option's flag and the
 *     control's `disabled` — the option flag is about that option, the host
 *     flag is about the whole control;
 *   · an option with an `icon` renders an <img> for it, and one without
 *     renders none;
 *   · "First non-disabled option selected if no value set" — the documented
 *     auto-selection rule, asserted by `expectedInitialValue`.
 *
 * Problems are COLLECTED and asserted as one array so a failing combo reports
 * everything wrong with it at once instead of one violation per re-run.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';
import '../../../packages/components/src/segmented-control/snice-segmented-control';
import type {
  SniceSegmentedControlElement,
  SegmentedControlOption,
  SegmentedControlSize,
} from '../../../packages/components/src/segmented-control/snice-segmented-control.types';

export { wait };
export type { SegmentedControlOption, SegmentedControlSize, SniceSegmentedControlElement };

// ── Dimensions ──────────────────────────────────────────────────────────────

export const SIZES: SegmentedControlSize[] = ['small', 'medium', 'large'];
export const HOST_DISABLED = [false, true];

/**
 * Option-set shapes. Each one puts the disabled flag somewhere that changes a
 * DIFFERENT documented answer:
 *
 *  · `plain`        — nothing disabled; the baseline.
 *  · `first-off`    — the auto-selection rule must skip the first option.
 *  · `middle-off`   — a disabled option that is NOT the auto-selection
 *                     candidate, so `aria-disabled` and the auto-selection
 *                     rule cannot be confused for each other.
 *  · `all-off`      — no enabled option exists, so there is nothing to
 *                     auto-select and `value` must stay empty.
 *  · `iconed`       — icons on a subset, so the <img> assertion is a real
 *                     discriminator rather than "always" or "never".
 */
export const SHAPES = ['plain', 'first-off', 'middle-off', 'all-off', 'iconed'] as const;
export type Shape = typeof SHAPES[number];

export function optionsFor(shape: Shape): SegmentedControlOption[] {
  switch (shape) {
    case 'plain':
      return [
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
      ];
    case 'first-off':
      return [
        { value: 'day', label: 'Day', disabled: true },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
      ];
    case 'middle-off':
      return [
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week', disabled: true },
        { value: 'month', label: 'Month' },
      ];
    case 'all-off':
      return [
        { value: 'day', label: 'Day', disabled: true },
        { value: 'week', label: 'Week', disabled: true },
      ];
    case 'iconed':
      return [
        { value: 'day', label: 'Day', icon: '/icons/day.svg' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month', icon: '/icons/month.svg' },
      ];
  }
}

/**
 * Initial `value` dimension:
 *  · `unset`   — empty, so the auto-selection rule fires;
 *  · `valid`   — names an existing option (the last one, so it can never be
 *                confused with the auto-selection answer);
 *  · `unknown` — names no option at all. The docs auto-select only when NO
 *                value is set, so an unknown value must survive verbatim and
 *                leave every segment unchecked.
 */
export const VALUE_KINDS = ['unset', 'valid', 'unknown'] as const;
export type ValueKind = typeof VALUE_KINDS[number];

export function initialValue(kind: ValueKind, options: SegmentedControlOption[]): string {
  if (kind === 'unset') return '';
  if (kind === 'unknown') return 'nope';
  return options[options.length - 1].value;
}

// ── Oracle ──────────────────────────────────────────────────────────────────

/**
 * The documented auto-selection rule: "First non-disabled option selected if no
 * value set." An authored value — even one naming no option — is left alone,
 * and a set with no enabled option has nothing to select.
 */
export function expectedInitialValue(
  authored: string,
  options: SegmentedControlOption[],
): string {
  if (authored) return authored;
  return options.find(opt => !opt.disabled)?.value ?? '';
}

export interface Combo {
  id: string;
  size: SegmentedControlSize;
  hostDisabled: boolean;
  shape: Shape;
  valueKind: ValueKind;
}

export function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const size of SIZES) {
    for (const hostDisabled of HOST_DISABLED) {
      for (const shape of SHAPES) {
        for (const valueKind of VALUE_KINDS) {
          combos.push({
            id: `${size}/${hostDisabled ? 'disabled' : 'enabled'}/${shape}/${valueKind}`,
            size, hostDisabled, shape, valueKind,
          });
        }
      }
    }
  }
  return combos;
}

/** Mount a control for a combo, with options delivered the documented way (JS). */
export async function mount(combo: Combo): Promise<SniceSegmentedControlElement> {
  const options = optionsFor(combo.shape);
  const attrs: Record<string, any> = { size: combo.size };
  if (combo.hostDisabled) attrs.disabled = true;
  const authored = initialValue(combo.valueKind, options);
  if (authored) attrs.value = authored;

  const el = await createComponent<SniceSegmentedControlElement>(
    'snice-segmented-control', attrs,
  );
  el.options = options;
  await wait(30);
  return el;
}

export function segments(el: SniceSegmentedControlElement): HTMLButtonElement[] {
  return [...el.shadowRoot!.querySelectorAll('[part="segment"]')] as HTMLButtonElement[];
}

export function base(el: SniceSegmentedControlElement): HTMLElement | null {
  return el.shadowRoot!.querySelector('[part="base"]');
}

export function segmentLabel(button: HTMLElement): string {
  return button.querySelector('.segmented-control__label')?.textContent?.trim()
    ?? button.textContent?.trim() ?? '';
}

/**
 * The oracle. `expectedValue` is the value the control is expected to hold at
 * this point (the auto-selection answer on mount, or whatever the interaction
 * under test should have produced).
 */
export function renderProblems(
  el: SniceSegmentedControlElement,
  options: SegmentedControlOption[],
  expectedValue: string,
  combo: Pick<Combo, 'size' | 'hostDisabled'>,
): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);

  if (el.value !== expectedValue) say(`value "${el.value}" != "${expectedValue}"`);

  const root = base(el);
  if (!root) { say('no [part="base"]'); return problems; }
  if (root.getAttribute('role') !== 'radiogroup') {
    say(`base role "${root.getAttribute('role')}" != "radiogroup"`);
  }
  if (!root.classList.contains(`segmented-control--${combo.size}`)) {
    say(`base missing size class segmented-control--${combo.size} (has "${root.className}")`);
  }
  if (!el.shadowRoot!.querySelector('[part="indicator"]')) say('no [part="indicator"]');

  const buttons = segments(el);
  if (buttons.length !== options.length) {
    say(`${buttons.length} segments, expected ${options.length}`);
  }

  options.forEach((opt, index) => {
    const button = buttons[index];
    if (!button) { say(`option ${index} (${opt.value}): no segment rendered`); return; }

    const where = `option ${index} (${opt.value})`;
    if (button.getAttribute('role') !== 'radio') {
      say(`${where}: role "${button.getAttribute('role')}" != "radio"`);
    }
    if (button.getAttribute('data-value') !== opt.value) {
      say(`${where}: data-value "${button.getAttribute('data-value')}" != "${opt.value}"`);
    }
    if (button.getAttribute('data-index') !== String(index)) {
      say(`${where}: data-index "${button.getAttribute('data-index')}" != "${index}"`);
    }
    if (segmentLabel(button) !== opt.label) {
      say(`${where}: label "${segmentLabel(button)}" != "${opt.label}"`);
    }

    const checked = String(opt.value === expectedValue);
    if (button.getAttribute('aria-checked') !== checked) {
      say(`${where}: aria-checked "${button.getAttribute('aria-checked')}" != "${checked}"`);
    }

    const ariaDisabled = String(opt.disabled ?? false);
    if (button.getAttribute('aria-disabled') !== ariaDisabled) {
      say(`${where}: aria-disabled "${button.getAttribute('aria-disabled')}" != "${ariaDisabled}"`);
    }

    // The native flag is the OR: an option is unusable when it says so, and
    // every option is unusable when the CONTROL says so.
    const nativeDisabled = Boolean(opt.disabled) || combo.hostDisabled;
    if (button.disabled !== nativeDisabled) {
      say(`${where}: disabled ${button.disabled} != ${nativeDisabled}`);
    }

    const img = button.querySelector('img');
    if (opt.icon && !img) say(`${where}: icon "${opt.icon}" declared but no <img>`);
    if (!opt.icon && img) say(`${where}: no icon declared but an <img> rendered`);
    if (opt.icon && img && img.getAttribute('src') !== opt.icon) {
      say(`${where}: icon src "${img.getAttribute('src')}" != "${opt.icon}"`);
    }
  });

  // Exactly one checked segment whenever the current value names an option.
  const checkedCount = buttons.filter(b => b.getAttribute('aria-checked') === 'true').length;
  const shouldBeChecked = options.some(o => o.value === expectedValue) ? 1 : 0;
  if (checkedCount !== shouldBeChecked) {
    say(`${checkedCount} checked segments, expected ${shouldBeChecked}`);
  }

  return problems;
}

/** Assert the oracle, reporting every violation of a combo at once. */
export function expectRender(
  el: SniceSegmentedControlElement,
  options: SegmentedControlOption[],
  expectedValue: string,
  combo: Pick<Combo, 'size' | 'hostDisabled'> & { id?: string },
): void {
  expect(renderProblems(el, options, expectedValue, combo), combo.id ?? 'render').toEqual([]);
}

/** Capture `value-change` details for the assertions about the event contract. */
export function recordValueChange(el: SniceSegmentedControlElement): any[] {
  const seen: any[] = [];
  el.addEventListener('value-change', (e: any) => seen.push(e.detail));
  return seen;
}
