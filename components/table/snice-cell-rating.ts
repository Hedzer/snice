import { element, property, watch, ready, query, render, styles, html, css } from 'snice';
import cssContent from './snice-cell.css?inline';
import type { RatingFormat, SniceCellElement, ColumnType, ColumnAlign, ColumnDefinition } from './snice-table.types';
import './snice-rating';

@element('snice-cell-rating')
export class SniceCellRating extends HTMLElement implements SniceCellElement {
  @property({  })
  align: ColumnAlign = 'center';

  @property({  })
  type: ColumnType = 'rating';

  @property({  })
  value: any = 0;

  @property({ type: Object, attribute: false })
  column: ColumnDefinition = {
    key: '',
    label: '',
    type: 'rating',
    align: 'center'
  };

  @property({ type: Object, attribute: false })
  rowData: any = null;

  @query('.cell-content')
  contentElement?: HTMLElement;

  @render()
  render() {
    return html/*html*/`
      <div class="cell-content cell-content--rating" part="content">
        <!-- Rating component will be created here -->
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
    this.createRatingElement();
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
    this.createRatingElement();
  }

  private createRatingElement() {
    if (!this.contentElement) return;
    
    // Clear existing content
    this.contentElement.innerHTML = '';
    
    // Create rating element
    const rating = document.createElement('snice-rating') as any;
    rating.value = Number(this.value) || 0;
    
    // Apply format from column
    const format: RatingFormat = this.column.ratingFormat || {};
    rating.max = format.max ?? 5;
    rating.symbol = format.symbol ?? '★';
    rating.emptySymbol = format.emptySymbol ?? '☆';
    rating.color = format.color ?? getComputedStyle(this).getPropertyValue('--snice-color-warning').trim();

    this.contentElement.appendChild(rating);
  }
}