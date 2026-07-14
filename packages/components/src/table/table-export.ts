/**
 * Export and clipboard functionality for snice-table.
 * Handles: CSV export, print, clipboard copy.
 */
import type { ColumnDefinition } from './snice-table.types';

export interface CSVExportOptions {
  /** CSV delimiter. Default: ',' */
  delimiter?: string;
  /** Filename for download. Default: 'export.csv' */
  filename?: string;
  /** Include column headers. Default: true */
  includeHeaders?: boolean;
  /** Export only selected rows. Default: false */
  selectedOnly?: boolean;
  /** Specific column keys to export. Default: all visible */
  columns?: string[];
  /** Add UTF-8 BOM for Excel compatibility. Default: true */
  utf8BOM?: boolean;
}

export interface PrintOptions {
  /** Hide footer in print. Default: false */
  hideFooter?: boolean;
  /** Hide toolbar in print. Default: false */
  hideToolbar?: boolean;
  /** Include selection checkboxes. Default: false */
  includeCheckboxes?: boolean;
  /** Custom page CSS. */
  pageStyles?: string;
}

export interface ClipboardOptions {
  /** Delimiter for copied cells. Default: '\t' */
  delimiter?: string;
  /** Use formatted values or raw. Default: true (formatted) */
  useFormatted?: boolean;
}

export class TableExport {
  /**
   * Export data to CSV and trigger download.
   */
  exportCSV(
    data: any[],
    columns: { key: string; label: string; exportable?: boolean }[],
    options: CSVExportOptions = {}
  ) {
    const {
      delimiter = ',',
      filename = 'export.csv',
      includeHeaders = true,
      columns: columnKeys,
      utf8BOM = true,
    } = options;

    // Filter columns
    let exportColumns = columns.filter(c => (c as any).exportable !== false);
    if (columnKeys) {
      exportColumns = exportColumns.filter(c => columnKeys.includes(c.key));
    }

    const rows: string[] = [];

    // Header row
    if (includeHeaders) {
      rows.push(exportColumns.map(c => this.escapeCSV(c.label, delimiter)).join(delimiter));
    }

    // Data rows
    for (const row of data) {
      const cells = exportColumns.map(c => {
        const value = row[c.key];
        return this.escapeCSV(value == null ? '' : String(value), delimiter);
      });
      rows.push(cells.join(delimiter));
    }

    const csv = rows.join('\n');
    const bom = utf8BOM ? '\ufeff' : '';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });

    // Download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Open browser print dialog with table content.
   */
  print(
    tableElement: HTMLElement,
    options: PrintOptions = {}
  ) {
    const {
      hideFooter = false,
      hideToolbar = false,
      includeCheckboxes = false,
      pageStyles = '',
    } = options;

    // Clone the table content
    const shadowRoot = tableElement.shadowRoot;
    if (!shadowRoot) return;

    const table = shadowRoot.querySelector('table');
    if (!table) return;

    const tableClone = table.cloneNode(true) as HTMLTableElement;

    // Shadow-root cell contents are not included by outerHTML. Flatten each
    // rendered custom cell into plain print text so the printout contains what
    // the user actually sees rather than empty custom-element tags.
    const originalCells = Array.from(table.querySelectorAll('snice-cell, [in-table], snice-checkbox'));
    const clonedCells = Array.from(tableClone.querySelectorAll('snice-cell, [in-table], snice-checkbox'));
    originalCells.forEach((original: any, index) => {
      const clone = clonedCells[index] as HTMLElement | undefined;
      if (!clone) return;
      if (original.localName === 'snice-checkbox') {
        clone.replaceWith(document.createTextNode(original.checked ? '☑' : '☐'));
        return;
      }
      const content = original.shadowRoot?.querySelector('[part~="content"]');
      clone.replaceWith(document.createTextNode((content?.textContent || original.textContent || '').trim()));
    });

    if (!includeCheckboxes) {
      tableClone.querySelectorAll('.select-column').forEach((cell) => cell.remove());
    }

    const plainSection = (selector: string, className: string): string => {
      const source = shadowRoot.querySelector(selector);
      if (!source) return '';
      const clone = source.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('style').forEach((style) => style.remove());
      clone.querySelectorAll('button').forEach((button) => {
        if (!button.textContent?.trim()) button.textContent = button.getAttribute('aria-label') || '';
      });
      const text = clone.textContent?.replace(/\s+/g, ' ').trim();
      return text ? `<div class="${className}">${this.escapeHTML(text)}</div>` : '';
    };
    const toolbarHTML = hideToolbar ? '' : plainSection('.table-controls-container', 'print-toolbar');
    const footerHTML = hideFooter ? '' : plainSection('.table-pagination-container', 'print-footer');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; margin: 1rem; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px 12px; border: 1px solid #ddd; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          .print-toolbar, .print-footer { margin: 0 0 0.75rem; color: #444; }
          .print-footer { margin: 0.75rem 0 0; }
          @media print {
            body { margin: 0; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
          }
          ${pageStyles}
        </style>
      </head>
      <body>
        ${toolbarHTML}
        ${tableClone.outerHTML}
        ${footerHTML}
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }

  /**
   * Copy cells to clipboard as tab-separated text.
   */
  async copyToClipboard(
    data: any[],
    columns: ColumnDefinition[],
    options: ClipboardOptions = {}
  ): Promise<boolean> {
    const { delimiter = '\t', useFormatted = true } = options;
    const rows = data;

    if (rows.length === 0) return false;

    const text = rows.map(row =>
      columns.map(c => {
        const value = row[c.key];
        return useFormatted ? this.formatValue(value, row, c) : this.rawValue(value);
      }).join(delimiter)
    ).join('\n');

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;left:-9999px;';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  }

  private escapeCSV(value: string, delimiter: string): string {
    if (value.includes(delimiter) || value.includes('"') || value.includes('\n') || value.includes('\r')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private rawValue(value: any): string {
    if (value == null) return '';
    if (typeof value === 'object') {
      try { return JSON.stringify(value); } catch { return String(value); }
    }
    return String(value);
  }

  private formatValue(value: any, row: any, column: ColumnDefinition): string {
    const override = column.formatter || column.valueFormatter;
    if (override) return String(override(value, row) ?? '');
    if (value == null) return '';

    const num = Number(value);
    switch (column.type) {
      case 'number':
      case 'accounting': {
        if (!Number.isFinite(num)) return this.rawValue(value);
        const format = column.numberFormat || {};
        const decimals = format.decimals ?? (column.type === 'accounting' ? 2 : 0);
        const grouped = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
          useGrouping: format.thousandsSeparator ?? false,
        }).format(Math.abs(num));
        let output = num < 0 && (format.negativeStyle === 'parentheses' || column.type === 'accounting')
          ? `(${grouped})`
          : `${num < 0 ? '-' : ''}${grouped}`;
        if (format.prefix) output = format.prefix + output;
        if (format.suffix) output += format.suffix;
        return output;
      }
      case 'currency': {
        if (!Number.isFinite(num)) return this.rawValue(value);
        const format = column.currencyFormat || {};
        const decimals = format.decimals ?? 2;
        const display = format.currencyDisplay || format.display || 'symbol';
        const output = new Intl.NumberFormat(format.locale || 'en-US', {
          style: 'currency',
          currency: format.currency || 'USD',
          currencyDisplay: display,
          useGrouping: format.thousandsSeparator ?? true,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(Math.abs(num));
        if (num >= 0) return output;
        return format.negativeStyle === 'parentheses' ? `(${output})` : `-${output}`;
      }
      case 'percent':
      case 'percentage': {
        if (!Number.isFinite(num)) return this.rawValue(value);
        return `${num.toFixed(column.percentageFormat?.decimals ?? 2)}%`;
      }
      case 'date': {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return this.rawValue(value);
        const format = column.dateFormat || {};
        const dateStyle = format.format === 'custom' ? undefined : (format.format || 'short');
        return new Intl.DateTimeFormat(format.locale || 'en-US', dateStyle ? { dateStyle } : {}).format(date);
      }
      case 'boolean': {
        const format = column.booleanFormat || {};
        const truthy = value === true || String(value) === String(format.trueValue ?? 'true');
        return truthy ? (format.trueSymbol || format.trueValue || 'true') : (format.falseSymbol || format.falseValue || 'false');
      }
      case 'scientific':
        return Number.isFinite(num) ? num.toExponential(column.numberFormat?.decimals ?? 2) : this.rawValue(value);
      default:
        return this.rawValue(value);
    }
  }

  private escapeHTML(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
