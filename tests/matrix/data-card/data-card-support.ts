/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the snice-data-card matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything asserted here is read off `docs/ai/components/data-card.md` and
 * `snice-data-card.types.ts`. The doc, condensed to the contract this file
 * encodes:
 *
 *   fields: DataCardField[]                   one `field` per entry, in order
 *   DataCardField {
 *     label, value,
 *     type?: text|link|badge|date|currency    default 'text'
 *     editable?: boolean                      per-field edit override
 *     group?: string                          section grouping
 *     icon?: string                           icon prefix
 *     href?: string                           type='link'; EXTERNAL origin →
 *                                             target="_blank" rel="noopener",
 *                                             SAME origin → navigates in place
 *     badgeVariant?: default|primary|success|warning|danger
 *   }
 *   editable: boolean = false                 global edit mode toggle
 *   variant: default|horizontal|compact       presentation only
 *   parts: container, header, title, edit-toggle, group, group-title,
 *          field, field-icon, field-label, field-value, field-input,
 *          field-save, field-edit
 *   getValues() → { label: value }            setValues(data) updates by label
 *   events: field-change {field,value,previousValue}, field-save {field,value}
 *   a11y: Enter saves, Escape cancels; the edit toggle is hidden when no field
 *         is editable
 *
 * Two readings the oracle pins down, because the doc states them in two places:
 *
 *   · the a11y bullet "Links use rel=noopener and target=_blank" is the
 *     shorthand; the `href` line in the property table is the SPECIFIC rule
 *     (external origin opens a tab, same origin navigates in place) and is what
 *     is asserted. A blanket `_blank` would strand in-app routing, which is the
 *     exact case the specific line was written to cover.
 *   · "editable" for a field means `field.editable !== false` — the doc calls
 *     the field flag an OVERRIDE of the global toggle, so an unset flag inherits
 *     the global one rather than opting out.
 */
import { Problems, sr, text } from '../matrix-kit';
import { exactPart, exactPartIn, exactParts, exactPartsIn } from '../part-exact';
import type {
  DataCardField, DataCardFieldType, DataCardVariant,
} from '../../../packages/components/src/data-card/snice-data-card.types';

export type { DataCardField, DataCardFieldType, DataCardVariant };

/** The documented variants — presentation only, so structure must not move. */
export const VARIANTS: DataCardVariant[] = ['default', 'horizontal', 'compact'];

/** The documented value types. */
export const FIELD_TYPES: DataCardFieldType[] = ['text', 'link', 'badge', 'date', 'currency'];

export const BADGE_VARIANTS = ['default', 'primary', 'success', 'warning', 'danger'] as const;

/** An href the page's own origin owns — documented to navigate IN PLACE. */
export const SAME_ORIGIN_HREF = '/team/john-doe';
/** A foreign origin — documented to open in a new tab, with rel="noopener". */
export const EXTERNAL_HREF = 'https://example.test/profile/john-doe';

/**
 * One field shape per documented optional-field combination worth crossing.
 * The names double as combo id fragments.
 */
export interface FieldShape {
  name: string;
  field: DataCardField;
}

export const SHAPES: FieldShape[] = [
  { name: 'text', field: { label: 'Name', value: 'John Doe' } },
  { name: 'text+icon', field: { label: 'Name', value: 'John Doe', type: 'text', icon: 'user' } },
  { name: 'text+locked', field: { label: 'Name', value: 'John Doe', editable: false } },
  { name: 'number', field: { label: 'Seats', value: 42, type: 'text' } },
  { name: 'link-external', field: { label: 'Site', value: 'example.test', type: 'link', href: EXTERNAL_HREF } },
  { name: 'link-internal', field: { label: 'Profile', value: 'John Doe', type: 'link', href: SAME_ORIGIN_HREF } },
  { name: 'link-nohref', field: { label: 'Profile', value: 'John Doe', type: 'link' } },
  { name: 'badge-success', field: { label: 'Status', value: 'Active', type: 'badge', badgeVariant: 'success' } },
  { name: 'badge-default', field: { label: 'Status', value: 'Active', type: 'badge' } },
  { name: 'date', field: { label: 'Joined', value: '2024-01-15', type: 'date', icon: 'calendar' } },
  { name: 'currency', field: { label: 'Balance', value: '$1,250.00', type: 'currency' } },
  { name: 'currency+locked', field: { label: 'Balance', value: '$1,250.00', type: 'currency', editable: false } },
];

/**
 * A dataset built around one shape. The shape sits in the MIDDLE so a renderer
 * that leaks an icon, a badge class, or an edit affordance onto a neighbour is
 * caught rather than hidden by a uniform dataset.
 */
export function datasetFor(shape: FieldShape): DataCardField[] {
  return [
    { label: 'Reference', value: 'REF-001' },
    { ...shape.field },
    { label: 'Owner', value: 'Ada Lovelace' },
  ];
}

/** Grouping layouts: the doc's `group?: string` section grouping. */
export interface GroupLayout {
  name: string;
  fields: DataCardField[];
  /** Group titles in render order; `null` is the untitled (ungrouped) section. */
  groups: (string | null)[];
}

export const GROUP_LAYOUTS: GroupLayout[] = [
  {
    name: 'ungrouped',
    fields: [
      { label: 'A', value: '1' },
      { label: 'B', value: '2' },
    ],
    groups: [null],
  },
  {
    name: 'one-group',
    fields: [
      { label: 'A', value: '1', group: 'Personal' },
      { label: 'B', value: '2', group: 'Personal' },
    ],
    groups: ['Personal'],
  },
  {
    name: 'two-groups',
    fields: [
      { label: 'A', value: '1', group: 'Personal' },
      { label: 'B', value: '2', group: 'Account' },
    ],
    groups: ['Personal', 'Account'],
  },
  {
    name: 'mixed',
    fields: [
      { label: 'A', value: '1' },
      { label: 'B', value: '2', group: 'Account' },
    ],
    groups: [null, 'Account'],
  },
  {
    // A group whose members are not adjacent is still ONE section: the doc
    // calls `group` a section name, not a run marker.
    name: 'interleaved',
    fields: [
      { label: 'A', value: '1', group: 'Personal' },
      { label: 'B', value: '2', group: 'Account' },
      { label: 'C', value: '3', group: 'Personal' },
    ],
    groups: ['Personal', 'Account'],
  },
  {
    name: 'empty',
    fields: [],
    groups: [],
  },
];

// ── Readers ─────────────────────────────────────────────────────────────────

export const fieldsOf = (el: HTMLElement): HTMLElement[] => exactParts(el, 'field');
export const groupsOf = (el: HTMLElement): HTMLElement[] => exactParts(el, 'group');
export const editToggleOf = (el: HTMLElement): HTMLElement | null => exactPart(el, 'edit-toggle');

const valueOf = (row: Element): HTMLElement | null => exactPartIn<HTMLElement>(row, 'field-value');
const inputOf = (row: Element): HTMLInputElement | null => exactPartIn<HTMLInputElement>(row, 'field-input');
const editButtonOf = (row: Element): HTMLElement | null => exactPartIn<HTMLElement>(row, 'field-edit');
const saveButtonOf = (row: Element): HTMLElement | null => exactPartIn<HTMLElement>(row, 'field-save');
const labelOf = (row: Element): HTMLElement | null => exactPartIn<HTMLElement>(row, 'field-label');
const iconOf = (row: Element): HTMLElement | null => exactPartIn<HTMLElement>(row, 'field-icon');

export { labelOf, iconOf };

export { valueOf, inputOf, editButtonOf, saveButtonOf };

/** The documented per-field edit verdict: global mode ON and no field opt-out. */
export const canEdit = (field: DataCardField, editable: boolean): boolean =>
  editable && field.editable !== false;

/** The documented toggle-visibility rule: hidden when NO field is editable. */
export const toggleVisible = (fields: DataCardField[]): boolean =>
  fields.some(field => field.editable !== false);

// ── The structural oracle ───────────────────────────────────────────────────

/**
 * Header, edit toggle, and the field rows — every documented promise about a
 * mounted data-card that does not require an interaction.
 */
export function checkStructure(
  el: HTMLElement,
  fields: DataCardField[],
  editable: boolean,
  problems: Problems,
): void {
  problems.check(exactPart(el, 'container') !== null, 'no [part="container"]');
  problems.check(exactPart(el, 'header') !== null, 'no [part="header"]');
  problems.check(exactPart(el, 'title') !== null, 'no [part="title"]');

  // The edit toggle: present in the tree either way, but display:none when the
  // card has nothing editable at all.
  const toggle = editToggleOf(el);
  if (problems.check(toggle !== null, 'no [part="edit-toggle"]')) {
    const hidden = (toggle!.getAttribute('style') ?? '').includes('display: none');
    problems.equal(
      !hidden, toggleVisible(fields),
      `edit toggle visibility (style="${toggle!.getAttribute('style') ?? ''}")`,
    );
  }

  const rows = fieldsOf(el);
  if (!problems.equal(rows.length, fields.length, 'rendered field count')) return;

  // Rows are grouped, so the flat row order is the order the GROUPS impose:
  // first-seen group order, fields in declaration order within a group.
  const expectedOrder = expectedFieldOrder(fields);
  problems.equal(
    rows.map(row => text(labelOf(row))),
    expectedOrder.map(field => field.label),
    'field order',
  );

  rows.forEach((row, i) => {
    const field = expectedOrder[i];
    if (!field) return;
    checkField(row, field, editable, problems);
  });
}

/**
 * Grouping order, per the doc: one `group` section per distinct `group` value in
 * first-appearance order, ungrouped fields in their own untitled section.
 */
export function expectedGroupTitles(fields: DataCardField[]): (string | null)[] {
  const seen: (string | null)[] = [];
  for (const field of fields) {
    const group = field.group || null;
    if (!seen.includes(group)) seen.push(group);
  }
  return seen;
}

export function expectedFieldOrder(fields: DataCardField[]): DataCardField[] {
  return expectedGroupTitles(fields)
    .flatMap(group => fields.filter(field => (field.group || null) === group));
}

export function checkGroups(el: HTMLElement, fields: DataCardField[], problems: Problems): void {
  const expected = expectedGroupTitles(fields);
  const sections = groupsOf(el);
  if (!problems.equal(sections.length, expected.length, 'group section count')) return;

  sections.forEach((section, i) => {
    const title = exactPartIn(section, 'group-title');
    const want = expected[i];
    if (want === null) {
      problems.check(title === null, `section ${i} is ungrouped but renders a group title`);
    } else if (problems.check(title !== null, `section ${i} should be titled "${want}"`)) {
      problems.equal(text(title), want, `section ${i} group title`);
    }
    const members = exactPartsIn(section, 'field');
    const wantMembers = fields.filter(field => (field.group || null) === want);
    problems.equal(members.length, wantMembers.length, `section ${i} ("${want}") field count`);
  });
}

/** One field row against its documented type behaviour. */
export function checkField(
  row: HTMLElement,
  field: DataCardField,
  editable: boolean,
  problems: Problems,
): void {
  const where = `field "${field.label}"`;
  const type = field.type ?? 'text';

  problems.equal(text(labelOf(row)), field.label, `${where} label`);

  const icon = iconOf(row);
  if (field.icon) {
    problems.check(icon !== null, `${where} declares icon "${field.icon}" but renders none`);
  } else {
    problems.check(icon === null, `${where} has no icon but rendered a [part="field-icon"]`);
  }

  const value = valueOf(row);
  if (!problems.check(value !== null, `${where} renders no [part="field-value"]`)) return;
  problems.equal(text(value), String(field.value), `${where} value text`);

  if (type === 'link') {
    const anchor = value as HTMLElement;
    if (!problems.equal(anchor.tagName, 'A', `${where} type="link" element`)) return;
    // `href: '#'` is the documented-by-omission fallback: a link field with no
    // href still has to be a link, and '#' is same-origin, so it stays in place.
    const href = field.href ?? '#';
    problems.equal(anchor.getAttribute('href'), href, `${where} href`);
    const external = isExternal(href);
    problems.equal(anchor.getAttribute('target'), external ? '_blank' : null, `${where} target`);
    problems.equal(anchor.getAttribute('rel'), external ? 'noopener' : null, `${where} rel`);
  } else {
    problems.check(
      (value as HTMLElement).tagName !== 'A',
      `${where} type="${type}" rendered an anchor`,
    );
  }

  if (type === 'badge') {
    const variant = field.badgeVariant ?? 'default';
    const classes = value!.getAttribute('class') ?? '';
    problems.check(
      classes.includes('badge'),
      `${where} type="badge" value classes "${classes}" carry no badge marker`,
    );
    problems.check(
      classes.includes(variant),
      `${where} badgeVariant="${variant}" never reaches the value classes ("${classes}")`,
    );
  }

  // The edit affordance: exactly when the field is editable in the doc's sense.
  const wantEdit = canEdit(field, editable);
  problems.equal(editButtonOf(row) !== null, wantEdit, `${where} edit affordance present`);
  // Nothing is in edit mode until it is asked for.
  problems.check(inputOf(row) === null, `${where} renders a [part="field-input"] before any edit`);
}

/**
 * Known divergences from the doc, keyed by the combo that exposes them.
 *
 * `.ai/fuzzing.md`: the assertion above is NOT weakened and the component is NOT
 * touched. The combos listed here are declared with `it.fails`, so the day the
 * component is fixed the suite turns red and the finding can be closed.
 *
 * MATRIX-data-card-1 (fixed) — a `type: 'link'` field used to render no edit
 *   affordance. The doc marks `editable` a per-field OVERRIDE of the global
 *   edit mode and exempts no value type, and lists `field-edit` as a part of
 *   every field. Link fields now render their `field-edit` button like every
 *   other type; no findings are currently pinned.
 */

/** The documented same-origin test — `new URL(href, page)` against this origin. */
export function isExternal(href: string): boolean {
  try {
    return new URL(href, location.href).origin !== location.origin;
  } catch {
    return false;
  }
}

/** The row whose label matches, from a mounted card. */
export function rowFor(el: HTMLElement, label: string): HTMLElement | null {
  return fieldsOf(el).find(row => text(labelOf(row)) === label) ?? null;
}

/** Every value the card reports, as `getValues()` documents it. */
export function expectedValues(fields: DataCardField[]): Record<string, string | number> {
  const values: Record<string, string | number> = {};
  for (const field of fields) values[field.label] = field.value;
  return values;
}

/** Type into a live `field-input`, the way a user's keystrokes would. */
export function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

export const shadowOf = sr;
