# Date Range Picker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build `<snice-date-range-picker>` — two connected date inputs with a shared calendar dropdown, range highlighting, hover preview, and optional presets.

**Architecture:** New component in `components/date-range-picker/`. Reuses date parsing/formatting logic from `components/date-picker/snice-date-picker.ts` (copy, don't import — components are independent). Two-input UI with shared calendar popup. Selection is a two-click flow: start, then end. Presets are `attribute: false` JS-only property.

**Tech Stack:** Snice decorators (`@element`, `@property`, `@query`, `@watch`, `@dispatch`, `@ready`, `@render`, `@styles`), CSS with theme tokens, Vitest for tests.

**Reference files:**
- Existing date-picker: `components/date-picker/snice-date-picker.ts` (patterns, date parsing)
- Date-picker CSS: `components/date-picker/snice-date-picker.css` (calendar styles to adapt)
- Date-picker types: `components/date-picker/snice-date-picker.types.ts` (type patterns)
- Date-picker tests: `tests/components/date-picker.test.ts` (test patterns)
- Test utils: `tests/components/test-utils.ts` (`createComponent`, `queryShadow`, `wait`)
- Coding standards: `.ai/coding-standards.md` (decorator patterns, CSS token rules)
- Component checklist: `.ai/component-checklist.md` (completion criteria)
- Design doc: `docs/plans/2026-03-06-date-range-picker-design.md`

---

### Task 1: Add to WIP list and create directory

**Files:**
- Modify: `components/.wip`
- Create: `components/date-range-picker/` (directory)

**Step 1: Add to .wip**

Add `date-range-picker` to `components/.wip` so it's excluded from builds while in development:

```
date-range-picker
```

Append it after the last entry.

**Step 2: Create directory**

```bash
mkdir -p components/date-range-picker
```

**Step 3: Commit**

```bash
git add components/.wip
git commit -m "chore: add date-range-picker to WIP list"
```

---

### Task 2: Types file

**Files:**
- Create: `components/date-range-picker/snice-date-range-picker.types.ts`

**Step 1: Write the types file**

Reference `components/date-picker/snice-date-picker.types.ts` for the pattern. Import `DateFormat` type definition inline (don't import from date-picker).

```typescript
export type DateRangePickerSize = 'small' | 'medium' | 'large';
export type DateRangePickerVariant = 'outlined' | 'filled' | 'underlined';
export type DateRangeFormat = 'yyyy-mm-dd' | 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy/mm/dd' | 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'mmmm dd, yyyy';

export interface DateRangePreset {
  label: string;
  start: Date | string;
  end: Date | string;
}

export interface SniceDateRangePickerElement extends HTMLElement {
  start: string;
  end: string;
  size: DateRangePickerSize;
  variant: DateRangePickerVariant;
  format: DateRangeFormat;
  label: string;
  helperText: string;
  errorText: string;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  invalid: boolean;
  clearable: boolean;
  min: string;
  max: string;
  name: string;
  columns: 1 | 2;
  firstDayOfWeek: number;
  presets: DateRangePreset[];
  showCalendar: boolean;

  focus(): void;
  blur(): void;
  clear(): void;
  open(): void;
  close(): void;
  selectRange(start: Date, end: Date): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
}

export interface DateRangeChangeDetail {
  start: string;
  end: string;
  startDate: Date | null;
  endDate: Date | null;
  startIso: string;
  endIso: string;
  dateRangePicker: SniceDateRangePickerElement;
}

export interface DateRangeInputDetail {
  value: string;
  field: 'start' | 'end';
  dateRangePicker: SniceDateRangePickerElement;
}

export interface DateRangePresetDetail {
  label: string;
  start: string;
  end: string;
  dateRangePicker: SniceDateRangePickerElement;
}

export interface DateRangePickerEventDetail {
  dateRangePicker: SniceDateRangePickerElement;
}
```

**Step 2: Commit**

```bash
git add components/date-range-picker/snice-date-range-picker.types.ts
git commit -m "feat(date-range-picker): add type definitions"
```

---

### Task 3: CSS file

**Files:**
- Create: `components/date-range-picker/snice-date-range-picker.css`

**Step 1: Write the CSS**

Base calendar styles on `components/date-picker/snice-date-picker.css`. Key additions:
- `.input-group` — shared border container for two inputs
- `.input--start` / `.input--end` — the two inputs (no individual border, shared container provides it)
- `.separator` — visual dash/arrow between inputs
- `.calendar--dual` — two-column calendar grid
- `.day--range-start`, `.day--range-end`, `.day--in-range`, `.day--range-preview` — range highlighting
- `.presets` — preset button list
- `.calendar-body` — flex container for presets + calendar grid(s)

All CSS must use `var(--snice-*, fallback)` pattern. Spacing in rem, borders in px. See `.ai/coding-standards.md` for full token reference.

```css
/* Date Range Picker Component Styles */
:host {
  display: block;
  position: relative;
  font-family: var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
  font-size: var(--snice-font-size-sm, 0.875rem);
  line-height: var(--snice-line-height-normal, 1.5);
}

/* Wrapper */
.date-range-picker-wrapper {
  display: flex;
  flex-direction: column;
}

/* Label */
.label {
  font-size: var(--snice-font-size-sm, 0.875rem);
  font-weight: var(--snice-font-weight-medium, 500);
  line-height: var(--snice-line-height-normal, 1.5);
  color: var(--snice-color-text);
  margin-bottom: var(--snice-spacing-2xs, 0.25rem);
}

.label--required::after {
  content: '*';
  color: var(--snice-color-danger);
  margin-left: var(--snice-spacing-2xs, 0.25rem);
}

/* Input Group — shared container for start + end */
.input-group {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid var(--snice-color-border);
  border-radius: var(--snice-border-radius-lg, 6px);
  background: var(--snice-color-background-input);
  transition: border-color var(--snice-transition-fast, 0.15s) ease, box-shadow var(--snice-transition-fast, 0.15s) ease;
}

.input-group:focus-within {
  border-color: var(--snice-color-border-focus);
  box-shadow: 0 0 0 var(--snice-focus-ring-width, 3px) var(--snice-focus-ring-color);
}

.input-group--invalid {
  border-color: var(--snice-color-danger);
}

.input-group--invalid:focus-within {
  border-color: var(--snice-color-danger);
  box-shadow: 0 0 0 3px var(--snice-color-danger-alpha, hsl(var(--snice-color-red-500) / 0.1));
}

.input-group--filled {
  background: var(--snice-color-background-secondary);
  border: 1px solid transparent;
}

.input-group--underlined {
  border: none;
  border-bottom: 1px solid var(--snice-color-border);
  border-radius: 0;
  background: transparent;
}

.input-group--disabled {
  background: var(--snice-color-background-secondary);
  cursor: not-allowed;
}

/* Individual Inputs */
.input {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  min-height: 2.5rem;
  border: none;
  background: transparent;
  padding: var(--snice-spacing-xs, 0.5rem) var(--snice-spacing-sm, 0.75rem);
  font-size: inherit;
  font-family: inherit;
  line-height: var(--snice-line-height-normal, 1.5);
  color: var(--snice-color-text);
  outline: none;
}

.input::placeholder {
  color: var(--snice-color-text-tertiary);
}

.input:disabled {
  color: var(--snice-color-text-tertiary);
  cursor: not-allowed;
}

.input:not(:disabled):not([readonly]) {
  cursor: pointer;
}

.input--end {
  padding-right: 3rem;
}

/* Separator between inputs */
.separator {
  color: var(--snice-color-text-tertiary);
  font-size: 0.875rem;
  flex-shrink: 0;
  user-select: none;
  padding: 0 0.125rem;
}

/* Size variants for inputs */
.input--small {
  padding: 0.375rem 0.625rem;
  font-size: 0.875rem;
}

.input--large {
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

/* Button Styles */
.calendar-toggle,
.clear-button {
  position: absolute;
  right: 0.5rem;
  padding: 0.25rem;
  border: none;
  background: transparent;
  color: var(--snice-color-text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.15s ease, background-color 0.15s ease;
  flex-shrink: 0;
}

.calendar-toggle {
  right: 0.5rem;
}

.clear-button {
  right: 2.5rem;
}

.calendar-toggle:hover,
.clear-button:hover {
  color: var(--snice-color-text);
  background: var(--snice-color-background-tertiary);
}

.calendar-toggle:disabled,
.clear-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading State */
.spinner {
  position: absolute;
  right: 3rem;
  width: 1em;
  height: 1em;
  pointer-events: none;
}

.spinner::after {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Calendar Popup */
.calendar {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: var(--snice-z-index-dropdown, 1000);
  background: var(--snice-color-background-element);
  border: 1px solid var(--snice-color-border);
  border-radius: var(--snice-border-radius-lg, 8px);
  box-shadow: var(--snice-shadow-lg);
  margin-top: var(--snice-spacing-3xs, 0.125rem);
  padding: var(--snice-spacing-md, 1rem);
  min-width: 280px;
}

.calendar[hidden] {
  display: none;
}

/* Calendar Body — contains presets and month grid(s) */
.calendar-body {
  display: flex;
  gap: var(--snice-spacing-md, 1rem);
}

/* Presets panel */
.presets {
  display: flex;
  flex-direction: column;
  gap: var(--snice-spacing-2xs, 0.25rem);
  min-width: 8rem;
  border-right: 1px solid var(--snice-color-border);
  padding-right: var(--snice-spacing-md, 1rem);
}

.preset-button {
  background: none;
  border: none;
  padding: var(--snice-spacing-2xs, 0.25rem) var(--snice-spacing-xs, 0.5rem);
  font-size: var(--snice-font-size-sm, 0.875rem);
  font-family: inherit;
  color: var(--snice-color-text);
  cursor: pointer;
  border-radius: var(--snice-border-radius-md, 4px);
  text-align: left;
  transition: background-color var(--snice-transition-fast, 0.15s) ease;
  white-space: nowrap;
}

.preset-button:hover {
  background: var(--snice-color-background-tertiary);
}

.preset-button--active {
  background: var(--snice-color-primary-subtle);
  color: var(--snice-color-primary);
  font-weight: var(--snice-font-weight-medium, 500);
}

/* Month grids container */
.months {
  display: flex;
  gap: var(--snice-spacing-md, 1rem);
  flex: 1;
}

.month {
  flex: 1;
  min-width: 240px;
}

/* Calendar Header */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.calendar-title {
  flex: 1;
  text-align: center;
}

.month-label {
  font-size: var(--snice-font-size-md, 1rem);
  font-weight: var(--snice-font-weight-semibold, 600);
  color: var(--snice-color-text);
}

.nav-button {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--snice-color-text-secondary);
  border-radius: 4px;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.nav-button:hover {
  color: var(--snice-color-text);
  background: var(--snice-color-background-tertiary);
}

/* Hide inner nav buttons in dual mode — outer buttons control both */
.nav-button--hidden {
  visibility: hidden;
}

/* Calendar Grid */
.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.weekday {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--snice-color-text-secondary);
  padding: 0.5rem 0.25rem;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}

/* Day cells */
.day {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--snice-border-radius-md, 4px);
  font-size: var(--snice-font-size-sm, 0.875rem);
  color: var(--snice-color-text);
  transition: background-color var(--snice-transition-fast, 0.15s) ease, color var(--snice-transition-fast, 0.15s) ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day:hover:not(.day--disabled):not(.day--empty) {
  background: var(--snice-color-background-tertiary);
}

.day--today {
  background: var(--snice-color-primary-subtle);
  color: var(--snice-color-primary);
  font-weight: var(--snice-font-weight-semibold, 600);
}

.day--disabled {
  color: var(--snice-color-text-disabled);
  cursor: not-allowed;
}

.day--empty {
  cursor: default;
}

/* Range highlighting */
.day--range-start {
  background: var(--snice-color-primary);
  color: var(--snice-color-text-inverse);
  font-weight: var(--snice-font-weight-semibold, 600);
  border-radius: var(--snice-border-radius-md, 4px) 0 0 var(--snice-border-radius-md, 4px);
}

.day--range-end {
  background: var(--snice-color-primary);
  color: var(--snice-color-text-inverse);
  font-weight: var(--snice-font-weight-semibold, 600);
  border-radius: 0 var(--snice-border-radius-md, 4px) var(--snice-border-radius-md, 4px) 0;
}

.day--range-start.day--range-end {
  border-radius: var(--snice-border-radius-md, 4px);
}

.day--in-range {
  background: var(--snice-color-primary-subtle);
  color: var(--snice-color-primary);
  border-radius: 0;
}

.day--range-preview {
  background: var(--snice-color-primary-subtle);
  opacity: 0.6;
  border-radius: 0;
}

/* Calendar Footer */
.calendar-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--snice-color-border);
  display: flex;
  justify-content: center;
}

/* Helper/Error Text */
.helper-text,
.error-text {
  font-size: var(--snice-font-size-sm, 0.875rem);
  margin-top: var(--snice-spacing-2xs, 0.25rem);
}

.helper-text {
  color: var(--snice-color-text-secondary);
}

.error-text {
  color: var(--snice-color-danger);
}

/* Size variants */
:host([size="small"]) .calendar {
  min-width: 240px;
  padding: 0.75rem;
}

:host([size="small"]) .day {
  width: 28px;
  height: 28px;
  font-size: 0.8125rem;
}

:host([size="large"]) .calendar {
  min-width: 320px;
  padding: 1.25rem;
}

:host([size="large"]) .day {
  width: 36px;
  height: 36px;
  font-size: 0.9375rem;
}

/* Responsive */
@media (max-width: 640px) {
  .calendar-body {
    flex-direction: column;
  }

  .presets {
    flex-direction: row;
    flex-wrap: wrap;
    border-right: none;
    border-bottom: 1px solid var(--snice-color-border);
    padding-right: 0;
    padding-bottom: var(--snice-spacing-sm, 0.75rem);
    margin-bottom: var(--snice-spacing-sm, 0.75rem);
    min-width: unset;
  }

  .months {
    flex-direction: column;
  }
}
```

**Step 2: Commit**

```bash
git add components/date-range-picker/snice-date-range-picker.css
git commit -m "feat(date-range-picker): add component styles"
```

---

### Task 4: Component implementation

**Files:**
- Create: `components/date-range-picker/snice-date-range-picker.ts`

**Step 1: Write the component**

This is the largest task. Reference `components/date-picker/snice-date-picker.ts` for date parsing/formatting logic — copy the `parseDate`, `formatDate`, `getPlaceholderForFormat`, `isCompleteDate` methods. Key differences from date-picker:

1. **Two inputs** (`startInput`, `endInput`) instead of one
2. **Selection state machine**: `idle` → click → `selecting` (start chosen, waiting for end) → click → `idle` (range complete)
3. **Range highlighting** in `getDaysGrid()`: compute `day--range-start`, `day--range-end`, `day--in-range`, `day--range-preview`
4. **Hover tracking**: `private hoverDate: Date | null` for preview highlight
5. **Dual month**: when `columns === 2`, render two `month` divs, second month is `viewDate + 1 month`
6. **Presets**: render in `.presets` panel, each calls `selectRange()`
7. **`@property({ type: Array, attribute: false }) presets`** — no DOM attribute reflection
8. **Form**: `internals.setFormValue()` with `FormData` containing `{name}-start` and `{name}-end`

Key implementation notes:
- Use `@element('snice-date-range-picker', { formAssociated: true })`
- `@property()` for all string/boolean/number attributes
- `@property({ type: Array, attribute: false })` for `presets`
- `@property({ type: Number })` for `columns` and `firstDayOfWeek`
- `@query` for DOM element references
- `@dispatch` for all events
- `@watch` for property change handlers
- `@ready` for initialization
- Navigation: in dual-column mode, prev/next advances both months. Left month shows `viewDate`, right shows `viewDate + 1 month`.
- The `selectRange(start, end)` method should normalize order (ensure start <= end).
- Import css with `?inline` suffix: `import cssContent from './snice-date-range-picker.css?inline';`

Write the full component file. It will be ~500-600 lines following the date-picker pattern.

**Step 2: Commit**

```bash
git add components/date-range-picker/snice-date-range-picker.ts
git commit -m "feat(date-range-picker): add component implementation"
```

---

### Task 5: Write tests

**Files:**
- Create: `tests/components/date-range-picker.test.ts`

**Step 1: Write the test file**

Follow the pattern in `tests/components/date-picker.test.ts`. Use `createComponent`, `removeComponent`, `queryShadow`, `wait` from `tests/components/test-utils.ts`.

Test groups:

1. **Basic functionality** — renders, has default properties, renders two inputs, renders calendar toggle
2. **Size variants** — small/medium/large apply correct classes
3. **Variant styles** — outlined/filled/underlined apply correct classes on `.input-group`
4. **Date formats** — start/end formatted correctly for mm/dd/yyyy, dd/mm/yyyy, yyyy-mm-dd
5. **Disabled state** — both inputs disabled, calendar toggle disabled
6. **Readonly state** — both inputs readonly
7. **Required state** — required attribute on inputs, label shows required indicator
8. **Calendar functionality** — open/close, renders calendar days grid, renders dual months when columns=2
9. **Range selection** — selectRange() sets start and end, clicking start then end in calendar
10. **Clearable** — clear button visible when has values, clear() resets both
11. **Events** — daterange-change, daterange-open, daterange-close, daterange-clear, daterange-preset
12. **API methods** — focus, blur, open, close, clear, selectRange
13. **Presets** — renders preset buttons, clicking preset selects range
14. **Label and helper/error text** — renders correctly

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/date-range-picker/snice-date-range-picker';
import type { SniceDateRangePickerElement } from '../../components/date-range-picker/snice-date-range-picker.types';

describe('snice-date-range-picker', () => {
  let picker: SniceDateRangePickerElement;

  afterEach(() => {
    if (picker) removeComponent(picker as HTMLElement);
  });

  describe('basic functionality', () => {
    it('should render element', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      expect(picker).toBeTruthy();
      expect(picker.tagName).toBe('SNICE-DATE-RANGE-PICKER');
    });

    it('should have default properties', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      expect(picker.start).toBe('');
      expect(picker.end).toBe('');
      expect(picker.size).toBe('medium');
      expect(picker.variant).toBe('outlined');
      expect(picker.format).toBe('mm/dd/yyyy');
      expect(picker.disabled).toBe(false);
      expect(picker.readonly).toBe(false);
      expect(picker.required).toBe(false);
      expect(picker.invalid).toBe(false);
      expect(picker.clearable).toBe(false);
      expect(picker.columns).toBe(1);
      expect(picker.showCalendar).toBe(false);
      expect(picker.presets).toEqual([]);
    });

    it('should render two input elements', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      await wait(50);
      const startInput = queryShadow(picker as HTMLElement, '.input--start');
      const endInput = queryShadow(picker as HTMLElement, '.input--end');
      expect(startInput?.tagName).toBe('INPUT');
      expect(endInput?.tagName).toBe('INPUT');
    });

    it('should render calendar toggle button', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      await wait(50);
      const toggle = queryShadow(picker as HTMLElement, '.calendar-toggle');
      expect(toggle?.tagName).toBe('BUTTON');
    });
  });

  // ... additional test groups follow the same pattern
  // Each group tests one concern as described above
});
```

Write full tests for all 14 groups listed above. Approximately 30-40 individual test cases.

**Step 2: Run tests to verify they fail**

```bash
npm run test:src -- --run tests/components/date-range-picker.test.ts
```

Expected: tests fail because component doesn't render correctly yet / needs iteration.

**Step 3: Iterate until tests pass**

Fix any issues in the component or tests until all pass.

**Step 4: Commit**

```bash
git add tests/components/date-range-picker.test.ts
git commit -m "test(date-range-picker): add unit tests"
```

---

### Task 6: Demo page

**Files:**
- Create: `components/date-range-picker/demo.html`

**Step 1: Write the demo**

Follow the pattern in `components/date-picker/demo.html`. Include sections for:
- Basic usage
- Different formats
- Sizes and variants
- With constraints (min/max)
- States (required, error, disabled, readonly)
- Dual column mode
- With presets (Last 7 days, Last 30 days, This month, Last month, This year)
- Loading state

Use theme tokens in demo styles, not hard-coded colors. Test in both light and dark modes.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Date Range Picker Demo</title>
    <link rel="stylesheet" href="../theme/theme.css">
    <style>
        body {
            font-family: var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
            padding: var(--snice-spacing-xl, 2rem);
            background: var(--snice-color-background);
            color: var(--snice-color-text, #374151);
        }
        .container { max-width: 800px; margin: 0 auto; }
        .test-section {
            margin-bottom: var(--snice-spacing-xl, 2rem);
            padding: var(--snice-spacing-lg, 1.5rem);
            border: 1px solid var(--snice-color-border, #e5e7eb);
            border-radius: var(--snice-border-radius-lg, 6px);
            background: var(--snice-color-background-secondary, #f9fafb);
        }
        .test-section h3 {
            margin: 0 0 var(--snice-spacing-md, 1rem) 0;
            font-weight: var(--snice-font-weight-semibold, 600);
        }
        .form-grid { display: grid; gap: var(--snice-spacing-md, 1rem); }
    </style>
</head>
<body>
    <div class="container">
        <h1>Date Range Picker Demo</h1>

        <div class="test-section">
            <h3>Basic</h3>
            <div class="form-grid">
                <snice-date-range-picker label="Select Date Range" clearable></snice-date-range-picker>
            </div>
        </div>

        <div class="test-section">
            <h3>Dual Column</h3>
            <div class="form-grid">
                <snice-date-range-picker label="Booking Dates" columns="2" clearable></snice-date-range-picker>
            </div>
        </div>

        <div class="test-section">
            <h3>With Presets</h3>
            <div class="form-grid">
                <snice-date-range-picker id="preset-picker" label="Report Period" columns="2" clearable></snice-date-range-picker>
            </div>
        </div>

        <div class="test-section">
            <h3>Sizes</h3>
            <div class="form-grid">
                <snice-date-range-picker label="Small" size="small"></snice-date-range-picker>
                <snice-date-range-picker label="Medium" size="medium"></snice-date-range-picker>
                <snice-date-range-picker label="Large" size="large"></snice-date-range-picker>
            </div>
        </div>

        <div class="test-section">
            <h3>Variants</h3>
            <div class="form-grid">
                <snice-date-range-picker label="Outlined" variant="outlined"></snice-date-range-picker>
                <snice-date-range-picker label="Filled" variant="filled"></snice-date-range-picker>
                <snice-date-range-picker label="Underlined" variant="underlined"></snice-date-range-picker>
            </div>
        </div>

        <div class="test-section">
            <h3>States</h3>
            <div class="form-grid">
                <snice-date-range-picker label="Required" required helper-text="This field is required"></snice-date-range-picker>
                <snice-date-range-picker label="Error" invalid error-text="Invalid date range"></snice-date-range-picker>
                <snice-date-range-picker label="Disabled" disabled start="2026-03-01" end="2026-03-15"></snice-date-range-picker>
                <snice-date-range-picker label="Readonly" readonly start="2026-03-01" end="2026-03-15"></snice-date-range-picker>
            </div>
        </div>
    </div>

    <script type="module">
        import './snice-date-range-picker.ts';

        const presetPicker = document.getElementById('preset-picker');
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

        presetPicker.presets = [
            { label: 'Last 7 days', start: new Date(Date.now() - 7 * 86400000), end: today },
            { label: 'Last 30 days', start: new Date(Date.now() - 30 * 86400000), end: today },
            { label: 'This month', start: startOfMonth, end: endOfMonth },
            { label: 'Last month', start: startOfLastMonth, end: endOfLastMonth },
        ];

        document.addEventListener('daterange-change', (e) => {
            console.log('Range changed:', e.detail);
        });
    </script>
</body>
</html>
```

**Step 2: Manual verification**

```bash
npm run dev:framework
```

Open `http://localhost:5566/components/date-range-picker/demo.html`. Verify:
- Both inputs render with correct placeholders
- Calendar opens with correct month(s)
- Range selection works (click start, click end)
- Range highlighting shows correctly
- Presets work
- Dual column shows two months
- Light/dark mode both look correct

**Step 3: Commit**

```bash
git add components/date-range-picker/demo.html
git commit -m "feat(date-range-picker): add demo page"
```

---

### Task 7: Export from src/index.ts

**Files:**
- Modify: `src/index.ts`

**Step 1: Check current exports**

Read `src/index.ts` and find the section where components are exported. Add:

```typescript
export { SniceDateRangePicker } from '../components/date-range-picker/snice-date-range-picker';
```

Follow the alphabetical or categorical order established in the file.

**Step 2: Verify build**

```bash
npm run build:core
```

Expected: succeeds.

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat(date-range-picker): export from index"
```

---

### Task 8: Full build and test verification

**Step 1: Run all tests**

```bash
npm test
```

Expected: all pass including the new date-range-picker tests.

**Step 2: Run full build**

```bash
npm run build
```

Expected: succeeds. The component won't appear in CDN or React builds yet because it's in `.wip`.

**Step 3: Commit any fixes**

If anything failed, fix and commit.

---

### Task 9: Documentation

**Files:**
- Create: `docs/components/date-range-picker.md` (human docs)
- Create: `docs/ai/components/date-range-picker.md` (AI docs)

**Step 1: Write human docs**

Follow the format in `.ai/component-docs-guide.md`. Section order: Title, Description, Basic Usage, Importing, Examples (basic, formats, sizes, variants, dual column, presets, constraints, states), Slots, Properties, Events, Methods, CSS Custom Properties.

**Step 2: Write AI docs**

Concise reference format. TypeScript property signatures, bullets for slots/events/methods, one usage block.

**Step 3: Commit**

```bash
git add docs/components/date-range-picker.md docs/ai/components/date-range-picker.md
git commit -m "docs(date-range-picker): add human and AI documentation"
```

---

### Task 10: Remove from WIP and final verification

**Files:**
- Modify: `components/.wip` (remove `date-range-picker` line)

**Step 1: Remove from .wip**

Delete the `date-range-picker` line from `components/.wip`.

**Step 2: Full build**

```bash
npm run build
```

Now the component will be included in CDN and React adapter builds.

**Step 3: Generate React adapter**

```bash
npm run generate:react-adapters
npm run generate:react-tests
```

**Step 4: Run full test suite**

```bash
npm test
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(date-range-picker): remove from WIP, complete release"
```

---

### Task 11: Website showcase

**Files:**
- Create: `public/showcases/date-range-picker.html`
- Modify: `public/showcases/manifest.json` (add under correct category)
- Modify: `public/showcases/_footer.html` (script tag + comp-list entry + search aliases)

**Step 1: Write showcase fragment**

Must start with `<div class="comp-section">` and `<h3>Date Range Picker</h3>`. Follow the pattern of other showcase fragments in `public/showcases/`. Use `comp-split` for side-by-side demo + code.

**Step 2: Add to manifest.json**

Add `"date-range-picker"` under the appropriate category (likely "Form" or "Input").

**Step 3: Update _footer.html**

- Add `<script>` tag for `snice-date-range-picker.min.js`
- Add to `comp-list`
- Add search aliases (e.g., "daterange" -> "date-range-picker", "range picker" -> "date-range-picker")

**Step 4: Rebuild**

```bash
node public/build-showcases.js
npm run build:core && npm run build:cdn
node scripts/build-website.js
```

**Step 5: Verify**

```bash
npm run website:dev
```

Open `http://localhost:52891/components.html` and verify the date range picker appears.

**Step 6: Commit**

```bash
git add public/showcases/date-range-picker.html public/showcases/manifest.json public/showcases/_footer.html
git commit -m "feat(date-range-picker): add website showcase"
```

---

### Task 12: Update task tracking

**Files:**
- Modify: `.ai/tasks.md` (add completed entry or note)

**Step 1: Update tasks**

Add the date-range-picker to the appropriate section as completed.

**Step 2: Commit**

```bash
git add .ai/tasks.md
git commit -m "chore: mark date-range-picker as complete in task tracker"
```
