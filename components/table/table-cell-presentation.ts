import type { ColumnDefinition, CellStyle } from './snice-table.types';

const presentationProperties: Array<keyof CellStyle> = [
  'backgroundColor',
  'color',
  'fontWeight',
  'fontStyle',
  'fontSize',
  'textDecoration',
];

const installed = new WeakMap<HTMLElement, MutationObserver>();
const appliedClasses = new WeakMap<HTMLElement, string[]>();

/**
 * Give every standalone specialized table cell the common ColumnDefinition
 * presentation contract. The observer reapplies after Snice's differential
 * renderer changes shadow content; equality guards prevent mutation loops.
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

      if (formatterOverride || column.valueFormatter) {
        const formatter = formatterOverride
          ? (column.formatter || column.valueFormatter)
          : column.valueFormatter;
        const content = host.shadowRoot?.querySelector('[part~="content"]') as HTMLElement | null;
        if (formatter && content) {
          const value = String(formatter(host.value, host.rowData) ?? '');
          if (content.textContent !== value || content.childElementCount > 0) content.textContent = value;
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
