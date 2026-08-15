// Shared spec table for the `typed-cells` matrix slice.
//
// Slice: typed cells (number, currency, date, boolean, status, tag, progress,
// rating, link) crossed with the valueGetter / valueFormatter / formatter
// pipeline, local vs remote delivery, and initial vs re-delivery vs mutated
// re-delivery.
//
// EVERY expectation below is derived from docs/ai/components/table.md, cited
// inline. Nothing here is derived from observed component output.
//
// The contract this slice asserts is table.md:81, quoted in full because every
// assertion in these files hangs off one of its clauses:
//
//   "Display pipeline: `valueGetter` -> `formatter` (wins) -> `valueFormatter`
//    (fallback), on every path — cells, aggregate footers, `<snice-row>`,
//    CSV/clipboard export; a column declaring either formatter renders through
//    `snice-cell-text` (keeping its type's alignment) and the cell's `value`
//    property/attribute IS the display value. An empty row value (null, or a
//    field the row never carried) falls back to the typed cell's own empty
//    value — `false` boolean, `0` rating/progress/duration/filesize, `null`
//    JSON, `''` otherwise — so an absent boolean never reads as `true` and an
//    absent progress never reads as `{}`."
//
// So there is ONE value contract, not two competing ones:
//
//   * with a declared formatter/valueFormatter — the host element is
//     `snice-cell-text`, its `align` is still the type's documented alignment
//     (table.md:35), and BOTH the `value` property and the `value` attribute
//     carry the formatter output, which is also what the `content` part renders
//     (table.md:129 lists `content` as the cells' CSS part);
//   * with no declared formatter — the host is the type's own `snice-cell-*`
//     element (table.md:7, classes at table.md:38-48), its `value` is the
//     working value (the raw row field, or the valueGetter result —
//     "valueGetter?:(value,row)=>any; /* runs for display, sort, aggregation */",
//     table.md:55), and the type's own rendering produces the `content` part.
//
// matrix-utils' `cellText()` reads the `value` attribute and its
// `expectedCellText()` oracle encodes the same precedence, so the shared oracle
// and this slice's assertions must agree — and both files assert that they do.
import { expect } from 'vitest';
import { dataRows, cellText, wait, type MatrixColumn } from './matrix-utils';

export { wait };

/** The cell element the table put inside a `td` (`createCellElement`, table.md:89). */
export function cellHost(td: HTMLElement): any {
  return td.querySelector('[value]');
}

/** Rendered text of the cell's `content` part (table.md:129), whitespace-collapsed. */
export function displayText(td: HTMLElement): string {
  const host = cellHost(td);
  if (!host) return (td.textContent ?? '').replace(/\s+/g, ' ').trim();
  const content = host.shadowRoot?.querySelector('[part~="content"]');
  return String(content?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Rendered markup of the cell's `content` part, with the renderer's comment
 * markers and whitespace normalised away. Typed cells such as progress and
 * rating render elements rather than text, so text alone cannot tell "rendered
 * correctly" from "rendered blank".
 */
export function contentMarkup(td: HTMLElement): string {
  const host = cellHost(td);
  const content = host?.shadowRoot?.querySelector('[part~="content"]');
  return String(content?.innerHTML ?? '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The cell's `content` part element (table.md:129). */
export function contentEl(td: HTMLElement): any {
  return cellHost(td)?.shadowRoot?.querySelector('[part~="content"]') ?? null;
}

/** An element inside the cell's content part. */
export function innerValued(td: HTMLElement, selector: string): any {
  return contentEl(td)?.querySelector(selector) ?? null;
}

/**
 * The single element a non-textual typed cell (progress, rating) renders inside
 * its content part, together with its value. The value is read from the
 * property, not the attribute: a value equal to the sub-component's default is
 * not reflected as an attribute, which says nothing about what is rendered.
 */
export function renderedValueElement(td: HTMLElement): { el: any; value: any } | null {
  const child = contentEl(td)?.firstElementChild ?? null;
  return child ? { el: child, value: child.value } : null;
}

export function tdFor(table: any, rowIndex: number, key: string): HTMLElement {
  const rows = dataRows(table);
  const tr = rows[rowIndex];
  expect(tr, `no rendered data row at index ${rowIndex} (got ${rows.length} rows)`).toBeTruthy();
  const td = tr.querySelector(`td[data-key="${key}"]`) as HTMLElement | null;
  expect(td, `no td[data-key="${key}"] in row ${rowIndex}`).toBeTruthy();
  return td!;
}

// ── documented display formats ──────────────────────────────────────────────

/** NumberFormat {decimals, thousandsSeparator, negativeStyle:'minus'} — table.md:65, table.md:38. */
export function docNumber(value: number, decimals: number): string {
  const fixed = Math.abs(value).toFixed(decimals);
  const [int, frac] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${value < 0 ? '-' : ''}${grouped}${frac ? `.${frac}` : ''}`;
}

/** CurrencyCell {currency:'USD', currencyDisplay:'symbol', locale:'en-US', decimals:2} — table.md:39, table.md:73. */
export function docCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', currencyDisplay: 'symbol',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);
}

/** DateCell {dateFormat:'short', locale:'en-US'} — table.md:40. */
export function docDateShort(value: Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(value);
}

// ── type specs ──────────────────────────────────────────────────────────────

export interface TypeSpec {
  /** ColumnType (table.md:50). */
  type: string;
  /** Row field holding the raw value. */
  field: string;
  /** Declared format alias for the column (table.md:59-75). */
  format: Record<string, any>;
  /** Initial value and the value used for mutated re-delivery. */
  value: any;
  value2: any;
  /** The type's own runtime cell element (table.md:7, classes table.md:38-48). */
  tag: string;
  /**
   * Documented alignment for the type: "right number/currency/percentage/
   * duration/filesize, center boolean/rating/image, left otherwise"
   * (table.md:35) — kept even when a formatter swaps the host for
   * `snice-cell-text` (table.md:81).
   */
  align: 'left' | 'center' | 'right';
  /**
   * The typed cell's own empty value for a null/absent row field: "`false`
   * boolean, `0` rating/progress/duration/filesize, `null` JSON, `''`
   * otherwise" (table.md:81, table.md:35). Compared by identity, so `false`
   * and `0` cannot be satisfied by `''`.
   */
  emptyValue: any;
  /**
   * Exact documented rendering with NO formatter/valueFormatter in play.
   * `value` is the working value (post-valueGetter).
   */
  plainAssert(td: HTMLElement, value: any): void;
  /**
   * Exact documented rendering of the EMPTY value (the `emptyValue` above),
   * asserted on the rendered `content` part so that "renders the documented
   * empty value" cannot be satisfied by a cell that failed to render at all.
   */
  emptyAssert(td: HTMLElement): void;
}

export const TYPE_SPECS: TypeSpec[] = [
  {
    type: 'number', field: 'amount',
    // NumberFormat (table.md:65); NumberCell defaults decimals:0 (table.md:38).
    format: { numberFormat: { decimals: 2, thousandsSeparator: true } },
    value: 1234.5, value2: -9876,
    tag: 'snice-cell-number', align: 'right', emptyValue: '',
    plainAssert(td, value) {
      expect(displayText(td)).toBe(docNumber(value, 2));
    },
    emptyAssert(td) {
      // '' otherwise (table.md:81) — there is no number to format, so the
      // content part carries no text.
      expect(displayText(td)).toBe('');
    },
  },
  {
    type: 'currency', field: 'price',
    // CurrencyFormat (table.md:73); "Currency uses `snice-cell-currency`" (table.md:81).
    format: { currencyFormat: { currency: 'USD', locale: 'en-US', decimals: 2, thousandsSeparator: true } },
    value: 99.9, value2: 1500,
    tag: 'snice-cell-currency', align: 'right', emptyValue: '',
    plainAssert(td, value) {
      expect(cellHost(td).tagName.toLowerCase()).toBe('snice-cell-currency'); // table.md:81
      expect(displayText(td)).toBe(docCurrency(value));
    },
    emptyAssert(td) {
      // '' otherwise (table.md:81): an empty currency is not $0.00.
      expect(displayText(td)).toBe('');
    },
  },
  {
    type: 'date', field: 'created',
    // DateCell {dateFormat:'short', locale:'en-US'} defaults (table.md:40).
    format: {},
    value: new Date(2024, 2, 5), value2: new Date(2023, 11, 25),
    tag: 'snice-cell-date', align: 'left', emptyValue: '',
    plainAssert(td, value) {
      expect(displayText(td)).toBe(docDateShort(value));
    },
    emptyAssert(td) {
      // '' otherwise (table.md:81): no date, so no formatted date — in
      // particular not the epoch or "Invalid Date".
      expect(displayText(td)).toBe('');
    },
  },
  {
    type: 'boolean', field: 'active',
    // BooleanFormat {trueValue, falseValue, useSymbols} (table.md:66, table.md:41).
    format: { booleanFormat: { trueValue: 'Yes', falseValue: 'No', useSymbols: false } },
    value: true, value2: false,
    tag: 'snice-cell-boolean', align: 'center', emptyValue: false,
    plainAssert(td, value) {
      expect(displayText(td)).toBe(value ? 'Yes' : 'No');
    },
    emptyAssert(td) {
      // `false` boolean (table.md:81) rendered through the declared
      // BooleanFormat falseValue (table.md:66) — "an absent boolean never
      // reads as `true`", so the cell must read "No", not "Yes".
      expect(displayText(td)).toBe('No');
      expect(contentMarkup(td), 'an empty boolean still renders its false state').not.toBe('');
    },
  },
  {
    type: 'status', field: 'state',
    // StatusCell {status, label, showDot} (table.md:44) / StatusFormat (table.md:69):
    // with no declared label the cell's value is the status shown.
    format: {},
    value: 'active', value2: 'offline',
    tag: 'snice-cell-status', align: 'left', emptyValue: '',
    plainAssert(td, value) {
      expect(displayText(td)).toBe(String(value));
    },
    emptyAssert(td) {
      // '' otherwise (table.md:81): no status text is shown, and no other
      // row's status may leak in.
      expect(displayText(td)).toBe('');
    },
  },
  {
    type: 'tag', field: 'label',
    // TagCell {tags:string[], variant} (table.md:44); `tag` is a CSS part (table.md:129).
    format: {},
    value: 'alpha', value2: 'beta',
    tag: 'snice-cell-tag', align: 'left', emptyValue: '',
    plainAssert(td, value) {
      const tag = innerValued(td, '[part~="tag"]');
      expect(tag, 'tag cell must expose a `tag` part (table.md:129)').toBeTruthy();
      expect(String(tag.textContent).replace(/\s+/g, ' ').trim()).toBe(String(value));
      expect(displayText(td)).toBe(String(value));
    },
    emptyAssert(td) {
      // '' otherwise (table.md:81): TagCell holds `tags:string[]=[]`
      // (table.md:44), so an empty value renders no tag chip at all.
      expect(innerValued(td, '[part~="tag"]'), 'an empty tag cell renders no tag').toBeNull();
      expect(displayText(td)).toBe('');
    },
  },
  {
    type: 'progress', field: 'done',
    // ProgressFormat {max, showPercentage} (table.md:67); the progress cell renders
    // a progress element rather than text, and 0 is its documented empty value
    // ("`0` rating/progress/duration/filesize", table.md:81, table.md:35).
    format: { progressFormat: { max: 100 } },
    value: 42, value2: 7,
    tag: 'snice-cell-progress', align: 'left', emptyValue: 0,
    plainAssert(td, value) {
      const rendered = renderedValueElement(td);
      expect(rendered, 'progress cell must render a progress element').toBeTruthy();
      expect(Number(rendered!.value)).toBe(Number(value));
    },
    emptyAssert(td) {
      // `0` progress (table.md:81) — "an absent progress never reads as `{}`",
      // so the rendered progress element must sit at 0, not be missing.
      const rendered = renderedValueElement(td);
      expect(rendered, 'an empty progress cell still renders a progress element').toBeTruthy();
      expect(Number(rendered!.value ?? 0)).toBe(0);
    },
  },
  {
    type: 'rating', field: 'stars',
    // RatingFormat {max, symbol, ...} (table.md:66); rating renders symbols, and 0
    // is its documented empty value (table.md:81, table.md:35).
    format: { ratingFormat: { max: 5 } },
    value: 3, value2: 5,
    tag: 'snice-cell-rating', align: 'center', emptyValue: 0,
    plainAssert(td, value) {
      const rendered = renderedValueElement(td);
      expect(rendered, 'rating cell must render a rating element').toBeTruthy();
      expect(Number(rendered!.value)).toBe(Number(value));
    },
    emptyAssert(td) {
      // `0` rating (table.md:81): a rendered rating element showing no stars.
      const rendered = renderedValueElement(td);
      expect(rendered, 'an empty rating cell still renders a rating element').toBeTruthy();
      expect(Number(rendered!.value ?? 0)).toBe(0);
    },
  },
  {
    type: 'link', field: 'url',
    // LinkCell {href, target, external, icon, text} (table.md:45); link cells
    // expose a `link` CSS part (table.md:129). With no linkFormat the cell's
    // value is both the href and the link text.
    format: {},
    value: 'https://example.com/a', value2: 'https://example.org/b',
    tag: 'snice-cell-link', align: 'left', emptyValue: '',
    plainAssert(td, value) {
      const anchor = innerValued(td, '[part~="link"]');
      expect(anchor, 'link cell must expose a `link` part (table.md:129)').toBeTruthy();
      expect(anchor.getAttribute('href')).toBe(String(value));
      const text = anchor.querySelector('.link-text');
      expect(String(text?.textContent ?? anchor.textContent).replace(/\s+/g, ' ').trim())
        .toBe(String(value));
    },
    emptyAssert(td) {
      // '' otherwise (table.md:81) with LinkCell's own `href:string=''`
      // default (table.md:45): the anchor is still rendered, pointing nowhere
      // and carrying no borrowed text.
      const anchor = innerValued(td, '[part~="link"]');
      expect(anchor, 'an empty link cell still exposes its `link` part').toBeTruthy();
      expect(anchor.getAttribute('href')).toBe('');
      expect(displayText(td)).toBe('');
    },
  },
];

// ── pipeline dimension ──────────────────────────────────────────────────────

export type Pipeline =
  | 'no-pipeline'
  | 'valueGetter'
  | 'valueFormatter'
  | 'valueGetter+valueFormatter'
  | 'formatter'
  | 'valueGetter+formatter';

/**
 * Every pipeline shape table.md:55 allows a ColumnDefinition to declare:
 * `valueGetter`, `formatter`, `valueFormatter`, alone and paired. The audit
 * found `valueGetter+formatter` missing from this list even though other matrix
 * slices (sorting-local, sorting-delivery) treat it as its own pipeline, so it
 * is crossed here like the rest instead of living in a bolt-on describe.
 */
export const PIPELINES: Pipeline[] = [
  'no-pipeline',
  'valueGetter',
  'valueFormatter',
  'valueGetter+valueFormatter',
  'formatter',
  'valueGetter+formatter',
];

/**
 * The key used when the column key is NOT a row field — the remote shape from
 * the field report: server sort-whitelist keys bridged to row fields by
 * valueGetter (table.md:55, "runs for display, sort, aggregation").
 */
export const DERIVED_KEY = 'serverSortKey';

export const VF = (v: any) => `VF[${String(v)}]`;
export const FMT = (v: any) => `F[${String(v)}]`;

export function buildColumn(spec: TypeSpec, pipeline: Pipeline): MatrixColumn {
  const base: MatrixColumn = { key: spec.field, label: spec.type, type: spec.type, ...spec.format };
  const getter = (_v: any, row: any) => row[spec.field];
  switch (pipeline) {
    case 'no-pipeline':
      return base;
    case 'valueGetter':
      return { ...base, key: DERIVED_KEY, valueGetter: getter };
    case 'valueFormatter':
      return { ...base, valueFormatter: (v: any) => VF(v) };
    case 'valueGetter+valueFormatter':
      return { ...base, key: DERIVED_KEY, valueGetter: getter, valueFormatter: (v: any) => VF(v) };
    case 'formatter':
      return { ...base, formatter: (v: any) => FMT(v) };
    case 'valueGetter+formatter':
      return { ...base, key: DERIVED_KEY, valueGetter: getter, formatter: (v: any) => FMT(v) };
  }
}

/** Does this pipeline replace the type's rendering with formatter output? */
export function pipelineDisplay(pipeline: Pipeline, value: any): string | null {
  // "Formatter/valueFormatter ... work across Table/declarative/standalone
  // paths" (table.md:81); formatter wins over valueFormatter, which is the
  // precedence encoded by the shared oracle in matrix-utils' expectedCellText.
  if (pipeline === 'formatter' || pipeline === 'valueGetter+formatter') return FMT(value);
  if (pipeline === 'valueFormatter' || pipeline === 'valueGetter+valueFormatter') return VF(value);
  return null;
}

/**
 * Assert the full documented rendering of one typed cell: which element the
 * table built, its alignment, the `value` property AND attribute, and the
 * rendered `content` part. `value` is the working value (post-valueGetter) the
 * cell must be displaying.
 */
export function assertTypedCell(td: HTMLElement, spec: TypeSpec, pipeline: Pipeline, value: any) {
  const formatted = pipelineDisplay(pipeline, value);
  const where = `${spec.type}/${pipeline}`;

  const host = cellHost(td);
  expect(host, `no rendered cell element for ${where}`).toBeTruthy();

  // HOST: "a column declaring either formatter renders through
  // `snice-cell-text` (keeping its type's alignment)" (table.md:81); with no
  // declared formatter the type's own cell element renders (table.md:7,
  // classes table.md:38-48, "Currency uses `snice-cell-currency`" table.md:81).
  expect(host.tagName.toLowerCase(), `cell element for ${where}`)
    .toBe(formatted === null ? spec.tag : 'snice-cell-text');
  // Alignment survives the formatter swap (table.md:35, table.md:81); `align`
  // is a documented cell property (`CellProps {align:...}`, table.md:36).
  expect(host.align, `alignment for ${where}`).toBe(spec.align);

  // VALUE: "the cell's `value` property/attribute IS the display value"
  // (table.md:81) when a formatter is declared; otherwise it is the working
  // value the type renders from (table.md:36, post-valueGetter table.md:55).
  const expectedValue = formatted ?? String(value);
  expect(cellText(td), `value attribute for ${where}`).toBe(expectedValue);
  expect(String(host.value), `value property for ${where}`).toBe(expectedValue);

  // CONTENT: the rendered `content` part (table.md:129). A cell that renders
  // nothing is the customer's blank-cell symptom, so a present value must
  // always leave markup behind.
  if (formatted === null) spec.plainAssert(td, value);
  else expect(displayText(td), `display channel for ${where}`).toBe(formatted);
  expect(contentMarkup(td), `${where} rendered an empty content part`).not.toBe('');
}

/**
 * Assert the documented rendering of a typed cell whose row value is empty
 * (null, or a field the row never carried): "falls back to the typed cell's own
 * empty value — `false` boolean, `0` rating/progress/duration/filesize, `null`
 * JSON, `''` otherwise" (table.md:81, table.md:35).
 *
 * Deliberately checks the value PROPERTY by identity and the rendered content,
 * not just the `value` attribute: a stringified attribute of '' is what any
 * nullish value produces, so an attribute-only assertion cannot tell a
 * correctly-empty cell from a cell that never rendered.
 */
export function assertEmptyCell(td: HTMLElement, spec: TypeSpec) {
  const host = cellHost(td);
  expect(host, `no rendered cell element for empty ${spec.type}`).toBeTruthy();
  expect(host.tagName.toLowerCase(), `cell element for empty ${spec.type}`).toBe(spec.tag);
  expect(host.align, `alignment for empty ${spec.type}`).toBe(spec.align);

  // Identity comparison: `false` and `0` are the documented empty values for
  // boolean and rating/progress and may NOT be satisfied by '' — nor by the
  // `true` / `{}` the coercion path used to produce.
  expect(host.value, `value property for empty ${spec.type}`).toBe(spec.emptyValue);
  expect(cellText(td), `value attribute for empty ${spec.type}`).toBe(String(spec.emptyValue));

  spec.emptyAssert(td);
}

/** A single-row dataset for a spec. */
export function rowFor(spec: TypeSpec, value = spec.value): any {
  return { id: 1, [spec.field]: value };
}
