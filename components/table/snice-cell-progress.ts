import { element, property, watch, ready, query, render, styles, html, css } from 'snice';
import cssContent from './snice-cell.css?inline';
import type { ProgressFormat, SniceCellElement, ColumnType, ColumnAlign, ColumnDefinition } from './snice-table.types';
import './snice-progress';

@element('snice-cell-progress')
export class SniceCellProgress extends HTMLElement implements SniceCellElement {
  @property({  })
  align: ColumnAlign = 'left';

  @property({  })
  type: ColumnType = 'progress';

  @property({  })
  value: any = 0;

  @property({ type: Object, attribute: false })
  column: ColumnDefinition = {
    key: '',
    label: '',
    type: 'progress',
    align: 'left'
  };

  @property({ type: Object, attribute: false })
  rowData: any = null;

  @query('.cell-content')
  contentElement?: HTMLElement;

  @render()
  render() {
    return html/*html*/`
      <div class="cell-content cell-content--progress" part="content">
        <!-- Progress component will be created here -->
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    this.applyAlignment();
    this.createProgressElement();
  }

  private applyAlignment() {
    this.style.textAlign = this.align;
  }

  @watch('align')
  updateAlignment() {
    this.applyAlignment();
  }

  @watch('value', 'column')
  updateContent() {
    this.createProgressElement();
  }

  private createProgressElement() {
    if (!this.contentElement) return;

    // Clear existing content
    this.contentElement.innerHTML = '';

    // Support per-row object value: { value: 92, color: '#22c55e' }
    let numValue: number;
    let rowColor: string | null = null;
    if (this.value && typeof this.value === 'object') {
      numValue = Number(this.value.value) || 0;
      rowColor = this.value.color || null;
    } else if (typeof this.value === 'string' && this.value.startsWith('{')) {
      try {
        const parsed = JSON.parse(this.value);
        numValue = Number(parsed.value) || 0;
        rowColor = parsed.color || null;
      } catch { numValue = Number(this.value) || 0; }
    } else {
      numValue = Number(this.value) || 0;
    }

    // Create progress element
    const progress = document.createElement('snice-progress') as any;
    progress.value = numValue;

    // Apply format from column
    const format: ProgressFormat = this.column.progressFormat || {};
    const max = format.max ?? 100;
    progress.max = max;
    progress.backgroundColor = format.backgroundColor ?? getComputedStyle(this).getPropertyValue('--snice-color-border').trim();
    progress.height = format.height ?? '0.5rem';
    progress.showPercentage = format.showPercentage ?? false;

    // Color: per-row override > colorize (auto by value) > column format > theme primary
    if (rowColor) {
      progress.color = rowColor;
    } else if (format.colorize) {
      const pct = (numValue / max) * 100;
      if (pct >= 70) progress.color = '#22c55e';
      else if (pct >= 40) progress.color = '#eab308';
      else progress.color = '#ef4444';
    } else {
      progress.color = format.color ?? getComputedStyle(this).getPropertyValue('--snice-color-primary').trim();
    }

    this.contentElement.appendChild(progress);
  }
}