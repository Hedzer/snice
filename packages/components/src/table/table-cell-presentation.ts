import type { ColumnDefinition, CellStyle } from './snice-table.types';

const presentationProperties: Array<keyof CellStyle> = [
  'backgroundColor',
  'color',
  'fontWeight',
  'fontStyle',
  'fontSize',
  'textDecoration',
];

/** The alignment a column type renders with when the column declares none. */
export function defaultCellAlign(type?: string): 'left' | 'center' | 'right' {
  if (['number', 'currency', 'percent', 'percentage', 'duration', 'filesize',
       'accounting', 'scientific', 'fraction'].includes(type || '')) return 'right';
  if (['boolean', 'rating', 'image'].includes(type || '')) return 'center';
  return 'left';
}

/**
 * The value a typed cell holds when the row has nothing to show — the row field
 * is null, or the row never carried the field at all.
 *
 * Each typed cell owns its value semantics: `false` for boolean, `0` for
 * rating/progress/duration/filesize, `null` for JSON, `''` for the text-shaped
 * rest. Handing every empty value the same `''` instead lets the cell's typed
 * attribute converter re-read that empty string as a value of the wrong
 * meaning — `''` on a Boolean property is an attribute that is *present*, i.e.
 * `true`, and `''` on an Object property parses to `{}`.
 */
export function emptyCellValue(type?: string): any {
  switch (type) {
    case 'boolean': return false;
    case 'rating':
    case 'progress':
    case 'duration':
    case 'filesize': return 0;
    case 'json': return null;
    default: return '';
  }
}

const installed = new WeakMap<HTMLElement, MutationObserver>();
const appliedClasses = new WeakMap<HTMLElement, string[]>();

/**
 * Give every standalone specialized table cell the common ColumnDefinition
 * presentation contract. The observer reapplies after Snice's differential
 * renderer changes shadow content; equality guards prevent mutation loops.
 *
 * Display formatters
 * ------------------
 * `formatter` is the column's display formatter and `valueFormatter` its
 * fallback, so `formatter` wins. `formatterOverride` says the cell does NOT
 * apply `column.formatter` itself, so this module owns both formatters for it.
 *
 * Table-rendered cells never arrive here with a formatter: `createCellElement`
 * resolves the pipeline once and hands the text cell the formatted string. This
 * path serves the declarative and standalone cells, which own a full column.
 */
export function installCellPresentation(
  host: HTMLElement & { column?: ColumnDefinition | null; value?: any; rowData?: any },
  formatterOverride = false,
) {
  if (installed.has(host)) return;
  let observer: MutationObserver | null = null;
  let syncing = false;

  const sync = () => {
    if (syncing) return;
    syncing = true;
    observer?.disconnect();
    try {
      const column = host.column;
      for (const className of appliedClasses.get(host) || []) host.classList.remove(className);
      appliedClasses.set(host, []);
      for (const property of presentationProperties) (host.style as any)[property] = '';
      host.removeAttribute('title');
      if (!column) return;

      const applyStyle = (style?: CellStyle) => {
        if (!style) return;
        for (const property of presentationProperties) {
          const value = style[property];
          if (value) (host.style as any)[property] = value;
        }
      };

      applyStyle(column.style);
      for (const rule of column.conditionalFormats || []) {
        if (!rule.condition(host.value, host.rowData)) continue;
        applyStyle(rule.style);
        if (rule.className) {
          host.classList.add(rule.className);
          appliedClasses.set(host, [rule.className]);
        }
        break;
      }

      if (column.tooltip) {
        host.title = typeof column.tooltip === 'function'
          ? column.tooltip(host.value, host.rowData)
          : (host.value == null ? '' : String(host.value));
      }

      // `formatter` beats `valueFormatter`. A cell that applies `formatter`
      // itself has already painted it, so the fallback must not overwrite that
      // content — only a formatter-less column falls through to valueFormatter.
      const formatter = column.formatter
        ? (formatterOverride ? column.formatter : null)
        : column.valueFormatter;
      if (formatter) {
        const display = String(formatter(host.value, host.rowData) ?? '');
        const content = host.shadowRoot?.querySelector('[part~="content"]') as HTMLElement | null;
        if (content && (content.textContent !== display || content.childElementCount > 0)) {
          content.textContent = display;
        }
      }
    } finally {
      syncing = false;
      if (observer && host.shadowRoot) {
        observer.observe(host.shadowRoot, { childList: true, subtree: true, characterData: true });
      }
    }
  };

  observer = new MutationObserver(sync);
  if (host.shadowRoot) observer.observe(host.shadowRoot, { childList: true, subtree: true, characterData: true });
  installed.set(host, observer);
  queueMicrotask(sync);
}
