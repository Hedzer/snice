import { element, property, watch, ready, query } from 'snice';
import css from './snice-cell.css?inline';
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

  @property({ type: Object })
  column: ColumnDefinition = {
    key: '',
    label: '',
    type: 'progress',
    align: 'left'
  };

  @property({ type: Object })
  rowData: any = null;

  @query('.cell-content')
  contentElement?: HTMLElement;

  html() {
    return `
      <div class="cell-content cell-content--progress" part="content">
        <!-- Progress component will be created here -->
      </div>
    `;
  }

  css() {
    return css;
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
    
    // Create progress element
    const progress = document.createElement('snice-progress') as any;
    progress.value = Number(this.value) || 0;
    
    // Apply format from column
    const format: ProgressFormat = this.column.progressFormat || {};
    progress.max = format.max ?? 100;
    progress.color = format.color ?? '#3b82f6';
    progress.backgroundColor = format.backgroundColor ?? '#e5e7eb';
    progress.height = format.height ?? '0.5rem';
    progress.showPercentage = format.showPercentage ?? false;
    
    this.contentElement.appendChild(progress);
  }
}