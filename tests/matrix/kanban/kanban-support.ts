/**
 * Per-component oracle for the snice-kanban matrix.
 *
 * snice-kanban is a data-driven board: everything it renders derives from the
 * `columns` array, and its whole documented surface is "render the declared
 * board, manage it through the declared methods, and report the declared
 * events". Everything encoded here comes from docs/ai/components/kanban.md,
 * docs/components/kanban.md, and snice-kanban.types.ts — never from observed
 * output:
 *
 *   · Properties: `columns: KanbanColumn[] = []` (`attribute: false` — the
 *     types and both docs spell it "set via JavaScript", so the PROPERTY
 *     channel is the only authoring channel for data), `allowDragDrop` (attr
 *     `allow-drag-drop`, default `true`, "Enable drag and drop"), and
 *     `showCardCount` (attr `show-card-count`, default `true`, "Show card
 *     count per column").
 *   · CSS Parts: `base` (board container), `column-header` ("Column header
 *     with title and card count"), `column-cards` ("Card list area within a
 *     column") — one header and one card list per column, in every combo.
 *   · Cards are the unit of the two documented events, and "Keyboard
 *     navigation for cards" (Accessibility) is why every card is a focusable
 *     `role="button"`. `allowDragDrop` is the drag affordance switch, and a
 *     card's `draggable` attribute is where that switch lands in the DOM.
 *   · `iconPosition: 'left' | 'right'` is documented as "Icon placement" on
 *     KanbanLabel — the icon glyph renders before the label text (left) or
 *     after it (right).
 *   · Reflection follows docs/ai/properties.md: authored attributes are
 *     always present; property assignments reflect only when the value
 *     differs from the documented default; defaults never reflect.
 */
import { mount, shadow, settle, text, type Shape } from '../matrix-utils';
import { exactPart, exactParts } from '../part-exact';
import type { KanbanColumn } from '../../../packages/components/src/kanban/snice-kanban.types';

export const CHANNELS = ['attr', 'prop'] as const;
export type Channel = typeof CHANNELS[number];

/** Documented defaults, from docs/ai/components/kanban.md. */
export const DEFAULTS = {
  columns: [] as KanbanColumn[],
  allowDragDrop: true,
  showCardCount: true,
};

export interface KanbanCombo {
  family: string;
  showCardCount: boolean;
  allowDragDrop: boolean;
  channel: Channel;
}

// ── Board families ──────────────────────────────────────────────────────────
//
// One builder per documented data shape, each returning a FRESH deep copy so a
// combo's mutations cannot leak into the next one. The families cross the
// documented KanbanColumn/KanbanCard fields: empty boards, empty columns,
// titles-only cards, cards with description/assignee, string labels, rich
// labels with colors/icons/positions, column and card colors, and both id
// spellings the types allow (`string | number`).

export const BOARD_FAMILIES: Record<string, () => KanbanColumn[]> = {
  'no-columns': () => [],
  'one-empty-column': () => [
    { id: 'todo', title: 'To Do', cards: [] },
  ],
  'three-empty-columns': () => [
    { id: 'a', title: 'Backlog', cards: [] },
    { id: 'b', title: 'Doing', cards: [] },
    { id: 'c', title: 'Done', cards: [] },
  ],
  'titled-cards': () => [
    { id: 'todo', title: 'To Do', cards: [
      { id: 1, title: 'Research' },
      { id: 2, title: 'Write stories', description: 'Document requirements.' },
      { id: 3, title: 'Design mockups', description: 'Create prototypes.', assignee: 'Alice' },
    ] },
    { id: 'done', title: 'Done', cards: [
      { id: 4, title: 'Set up repository' },
    ] },
  ],
  'labelled-cards': () => [
    { id: 'todo', title: 'To Do', cards: [
      { id: 1, title: 'Implement auth', labels: ['Backend', 'Security'], assignee: 'Bob' },
      { id: 2, title: 'API endpoints', labels: [
        { text: 'Backend', color: '#fff', background: '#2563eb' },
        { text: 'Priority', color: '#fff', background: '#dc2626', icon: '!', iconPosition: 'left' },
        { text: 'Late', icon: 'text://z', iconPosition: 'right' },
      ], assignee: 'Carol' },
    ] },
    { id: 'review', title: 'Review', cards: [
      { id: 3, title: 'Code review PR #42', labels: [{ text: 'Review', color: '#92400e', background: '#fef3c7' }] },
    ] },
  ],
  'colored-board': () => [
    { id: 'todo', title: 'To Do', color: '#f44336', cards: [
      { id: 'cc1', title: 'Bug fix', color: '#dc2626' },
      { id: 'cc2', title: 'Feature', color: '#2563eb' },
    ] },
    { id: 'done', title: 'Done', color: '#4caf50', cards: [] },
  ],
  'collapsed-mixed': () => [
    { id: 'todo', title: 'To Do', cards: [{ id: 1, title: 'Task' }], collapsed: true },
    { id: 'done', title: 'Done', cards: [{ id: 2, title: 'Shipped' }] },
  ],
};

export const LABELLED_FAMILY = 'labelled-cards';
export const TITLED_FAMILY = 'titled-cards';

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Mount a combo through its own authoring channel.
 *
 * The two booleans are the only attribute-expressible properties. The ATTR
 * channel authors them as markup (`allow-drag-drop="false"` is the docs' own
 * example spelling, so `false` crosses as a string the Boolean converter
 * parses); the PROP channel assigns typed booleans once the element is ready.
 * `columns` is documented `attribute: false` and only ever crosses as a
 * property, in both channels.
 */
export async function mountKanban(combo: KanbanCombo): Promise<HTMLElement> {
  if (combo.channel === 'attr') {
    return mount<HTMLElement>('snice-kanban', {
      'allow-drag-drop': String(combo.allowDragDrop),
      'show-card-count': String(combo.showCardCount),
    });
  }
  const el = await mount<HTMLElement>('snice-kanban', {});
  const target = el as any;
  target.allowDragDrop = combo.allowDragDrop;
  target.showCardCount = combo.showCardCount;
  await settle(el, 5);
  return el;
}

/** Assign a board's columns and let the render settle. */
export async function setBoard(el: HTMLElement, columns: KanbanColumn[]): Promise<void> {
  (el as any).columns = columns;
  await settle(el, 20);
}

// ── Readers ─────────────────────────────────────────────────────────────────

/**
 * The card element for `cardId`, the unit every documented kanban event and
 * affordance hangs off. `data-card-id` is how the board addresses its own
 * cards (focus management), and ids are unique per board by contract.
 */
export function cardEl(el: HTMLElement, cardId: string | number): HTMLElement | null {
  return shadow(el).querySelector(`[data-card-id="${cardId}"]`);
}

export function cardEls(el: HTMLElement): HTMLElement[] {
  return [...shadow(el).querySelectorAll<HTMLElement>('.card')];
}

export function columnEls(el: HTMLElement): HTMLElement[] {
  return [...shadow(el).querySelectorAll<HTMLElement>('.column')];
}

// ── The shape oracle ────────────────────────────────────────────────────────

function labelInfo(label: string | { text: string; icon?: string; iconPosition?: 'left' | 'right' }) {
  const obj = typeof label === 'string' ? null : label;
  return {
    text: typeof label === 'string' ? label : label.text,
    // "icon?: string; // Registry name ('fire'), URL, or text" — an icon is
    // present only when the label object carries a non-empty one, and
    // "iconPosition // Icon placement" defaults to left when unspecified.
    icon: obj?.icon ? (obj.iconPosition ?? 'left') : null,
  };
}

/**
 * The DOCUMENTED shape for a combo's board — the "expected" side of the
 * oracle. One flat key per claim so a failing combo reports every divergence.
 */
export function expectedShape(combo: KanbanCombo, board: KanbanColumn[]): Shape {
  const shape: Shape = {
    hasBasePart: true,
    columnCount: board.length,
  };
  board.forEach((column, i) => {
    shape[`col:${i}.headerPart`] = true;
    shape[`col:${i}.headerText`] = column.title;
    // "showCardCount — Show card count per column": the badge carries the
    // column's card count and exists exactly when the switch is on.
    shape[`col:${i}.countBadge`] = combo.showCardCount ? String(column.cards.length) : null;
    shape[`col:${i}.cardsPart`] = true;
    shape[`col:${i}.cardCount`] = column.cards.length;
    column.cards.forEach((card, j) => {
      const p = `col:${i}.card:${j}`;
      shape[`${p}.id`] = String(card.id);
      shape[`${p}.columnId`] = String(column.id);
      // "Keyboard navigation for cards" — a card is a focusable button.
      shape[`${p}.role`] = 'button';
      shape[`${p}.tabindex`] = '0';
      shape[`${p}.ariaLabelHasTitle`] = true;
      // "allowDragDrop — Enable drag and drop" lands on each card.
      shape[`${p}.draggable`] = String(combo.allowDragDrop);
      shape[`${p}.title`] = card.title;
      shape[`${p}.description`] = card.description ?? null;
      shape[`${p}.assignee`] = card.assignee ?? null;
      shape[`${p}.labelTexts`] = (card.labels ?? []).map(l => labelInfo(l).text);
      shape[`${p}.labelIcons`] = (card.labels ?? []).map(l => labelInfo(l).icon);
    });
  });
  return shape;
}

/**
 * The header's own title text, without the count badge that lives inside the
 * same `.column__title` element — the title is the interpolated text node,
 * the badge is an element child.
 */
function titleText(titleEl: Element | null): string {
  if (!titleEl) return '';
  return [...titleEl.childNodes]
    .filter(node => node.nodeType === Node.TEXT_NODE)
    .map(node => node.textContent ?? '')
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A label's TEXT, without the icon glyph that may sit inside the same
 * `.card__label` element — the text is the interpolated text node, an icon is
 * an element child (renderIcon wraps registry/URL/text icons in a span).
 */
function labelTextOf(labelEl: Element): string {
  return [...labelEl.childNodes]
    .filter(node => node.nodeType === Node.TEXT_NODE)
    .map(node => node.textContent ?? '')
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Where a label's icon sits: "left" renders the glyph before the label text,
 * "right" after it. Judged by whether any earlier sibling already carried the
 * text (comments from the template's `<if>` markers don't count).
 */
function labelIconPosition(labelEl: Element): 'left' | 'right' | null {
  const icon = labelEl.querySelector('.card__label-icon');
  if (!icon) return null;
  // Comments from the template's `<if>` markers surround the glyph in BOTH
  // positions; only a TEXT node before the icon means the label text led.
  const before = [...labelEl.childNodes]
    .slice(0, [...labelEl.childNodes].indexOf(icon))
    .some(node => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0);
  return before ? 'right' : 'left';
}

/** The same description, read back off the rendered element. */
export function readShape(el: HTMLElement): Shape {
  const sr = shadow(el);
  const shape: Shape = {
    hasBasePart: !!exactPart(el, 'base'),
    columnCount: columnEls(el).length,
  };
  columnEls(el).forEach((column, i) => {
    const header = column.querySelector<HTMLElement>('.column__header');
    const count = column.querySelector<HTMLElement>('.column__count');
    const cardsPart = exactParts(el, 'column-cards')
      .find(part => column.contains(part)) ?? null;
    const cards = [...column.querySelectorAll<HTMLElement>('.card')];
    shape[`col:${i}.headerPart`] = !!header && header.getAttribute('part') === 'column-header';
    shape[`col:${i}.headerText`] = titleText(header?.querySelector('.column__title') ?? null);
    shape[`col:${i}.countBadge`] = count ? text(count) : null;
    shape[`col:${i}.cardsPart`] = !!cardsPart;
    shape[`col:${i}.cardCount`] = cards.length;
    cards.forEach((card, j) => {
      const p = `col:${i}.card:${j}`;
      shape[`${p}.id`] = card.getAttribute('data-card-id');
      shape[`${p}.columnId`] = card.getAttribute('data-column-id');
      shape[`${p}.role`] = card.getAttribute('role');
      shape[`${p}.tabindex`] = card.getAttribute('tabindex');
      shape[`${p}.ariaLabelHasTitle`] = (card.getAttribute('aria-label') ?? '')
        .includes(text(card.querySelector('.card__title')));
      shape[`${p}.draggable`] = card.getAttribute('draggable');
      shape[`${p}.title`] = text(card.querySelector('.card__title'));
      shape[`${p}.description`] = card.querySelector('.card__description')
        ? text(card.querySelector('.card__description')) : null;
      shape[`${p}.assignee`] = card.querySelector('.card__assignee')
        ? text(card.querySelector('.card__assignee')) : null;
      shape[`${p}.labelTexts`] = [...card.querySelectorAll('.card__label')]
        .map(label => labelTextOf(label));
      shape[`${p}.labelIcons`] = [...card.querySelectorAll('.card__label')].map(label =>
        labelIconPosition(label));
    });
  });
  void sr;
  return shape;
}

/**
 * The DOCUMENTED axis state: property truth for both booleans, plus the
 * attribute each is documented under. docs/ai/properties.md: authored
 * attributes are always present, and a boolean property reflection writes
 * presence for `true` and absence for `false` — so through the PROPERTY
 * channel the observable is "an authored attribute carries the value" and
 * through the property channel only a reflected `true` can add one. (Both
 * kanban booleans default to `true`, so assigning the default is not a change
 * and reflects nothing — the default never reflecting is the documented rule.)
 */
export function expectedAxes(combo: KanbanCombo): Shape {
  return {
    'prop.allowDragDrop': combo.allowDragDrop,
    'prop.showCardCount': combo.showCardCount,
    'attr.allow-drag-drop': combo.channel === 'attr' ? combo.allowDragDrop : undefined,
    'attr.show-card-count': combo.channel === 'attr' ? combo.showCardCount : undefined,
  };
}

export function readAxes(el: HTMLElement): Shape {
  // An authored attribute keeps its authored spelling ("true"/"false" — the
  // docs' own `allow-drag-drop="false"` example), and both parse exactly as
  // the property did.
  const attrBoolean = (name: string): boolean | undefined => {
    if (!el.hasAttribute(name)) return undefined;
    return el.getAttribute(name) !== 'false';
  };
  return {
    'prop.allowDragDrop': (el as any).allowDragDrop,
    'prop.showCardCount': (el as any).showCardCount,
    'attr.allow-drag-drop': attrBoolean('allow-drag-drop'),
    'attr.show-card-count': attrBoolean('show-card-count'),
  };
}

/** The column ids holding each card id — the one-line board summary. */
export function boardMap(board: KanbanColumn[]): Array<[string, string[]]> {
  return board.map(column => [
    String(column.id),
    column.cards.map(card => String(card.id)),
  ]);
}

/** Fresh board data for a family name. */
export function board(family: string): KanbanColumn[] {
  const builder = BOARD_FAMILIES[family];
  if (!builder) throw new Error(`unknown board family ${family}`);
  return builder();
}
