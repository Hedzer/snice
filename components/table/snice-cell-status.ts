import { element, property, watch, ready, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-cell-status.css?inline';
import type { SniceCellElement, ColumnDefinition } from './snice-table.types';

@element('snice-cell-status')
export class SniceCellStatus extends HTMLElement implements SniceCellElement {
  @property({ type: String })
  value: string = '';

  @property({ type: String })
  status: string = '';

  @property({ type: String })
  label: string = '';

  @property({ type: Boolean })
  showDot: boolean = true;

  @property({ type: String })
  variant: 'online' | 'offline' | 'busy' | 'away' | 'custom' = 'custom';

  @property({ type: Object })
  column: ColumnDefinition | null = null;

  @property({ type: Object })
  rowData: any = null;

  @property({ type: String })
  align: 'left' | 'center' | 'right' = 'left';

  @property({ type: String })
  type: string = 'status';

  @render()
  renderContent() {
    const statusValue = this.status || this.value;
    const statusLabel = this.label || statusValue;
    const statusVariant = this.getStatusVariant(statusValue);
    const dotHTML = this.showDot ? `<span class="status-dot status-dot--${statusVariant}"></span>` : '';

    return html/*html*/`
      <div class="cell-content cell-content--status" part="content">
        ${unsafeHTML(dotHTML)}
        <span class="status-label status-label--${statusVariant}">${statusLabel}</span>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    this.updateStatusAttributes();
  }

  @watch('value', 'column')
  updateStatusAttributes() {
    if (this.column?.statusFormat) {
      const format = this.column.statusFormat;
      this.status = format.status || this.value;
      this.label = format.label || this.value;
      this.showDot = format.showDot ?? true;
      this.variant = format.variant || 'custom';
    }
  }

  private getStatusVariant(status: string): string {
    if (this.variant !== 'custom') {
      return this.variant;
    }

    // Auto-detect common status values
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'online' || lowerStatus === 'active' || lowerStatus === 'available') {
      return 'online';
    }
    if (lowerStatus === 'offline' || lowerStatus === 'inactive' || lowerStatus === 'unavailable') {
      return 'offline';
    }
    if (lowerStatus === 'busy' || lowerStatus === 'dnd' || lowerStatus === 'do not disturb') {
      return 'busy';
    }
    if (lowerStatus === 'away' || lowerStatus === 'idle') {
      return 'away';
    }
    return 'custom';
  }
}
