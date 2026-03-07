/**
 * Export and clipboard functionality for snice-table.
 * Handles: CSV export, print, clipboard copy.
 */

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
      pageStyles = '',
    } = options;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Clone the table content
    const shadowRoot = tableElement.shadowRoot;
    if (!shadowRoot) return;

    const table = shadowRoot.querySelector('table');
    if (!table) return;

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
          ${hideFooter ? '.pagination { display: none; }' : ''}
          ${hideToolbar ? '.table-controls { display: none; }' : ''}
          @media print {
            body { margin: 0; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
          }
          ${pageStyles}
        </style>
      </head>
      <body>
        ${table.outerHTML}
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
    columns: { key: string; label: string }[],
    selectedRowIndices: number[],
    options: ClipboardOptions = {}
  ): Promise<boolean> {
    const { delimiter = '\t' } = options;

    const rows = selectedRowIndices.length > 0
      ? selectedRowIndices.map(i => data[i]).filter(Boolean)
      : data;

    if (rows.length === 0) return false;

    const text = rows.map(row =>
      columns.map(c => {
        const value = row[c.key];
        return value == null ? '' : String(value);
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
}
