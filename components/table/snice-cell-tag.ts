import { element, property, watch, ready, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-cell-tag.css?inline';
import type { SniceCellElement, ColumnDefinition } from './snice-table.types';

@element('snice-cell-tag')
export class SniceCellTag extends HTMLElement implements SniceCellElement {
  @property({ type: Array })
  tags: string[] = [];

  @property({ type: String })
  value: string = '';

  @property({ type: String })
  variant: string = 'default';

  @property({ type: Object })
  column: ColumnDefinition | null = null;

  @property({ type: Object })
  rowData: any = null;

  @property({ type: String })
  align: 'left' | 'center' | 'right' = 'left';

  @property({ type: String })
  type: string = 'tag';

  @render()
  renderContent() {
    const tagList = this.tags.length > 0 ? this.tags : this.parseValue();

    return html/*html*/`
      <div class="cell-content cell-content--tag" part="content">
        <div class="tags-container">
          ${tagList.map(tag => this.renderTag(tag))}
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    this.extractTagsFromColumn();
  }

  @watch('value', 'column')
  extractTagsFromColumn() {
    if (this.column?.tagFormat) {
      this.variant = this.column.tagFormat.variant || 'default';
    }
  }

  private parseValue(): string[] {
    if (!this.value) return [];
    if (Array.isArray(this.value)) return this.value;
    if (typeof this.value === 'string') {
      // Try parsing as JSON array first
      try {
        const parsed = JSON.parse(this.value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      // Otherwise split by comma
      return this.value.split(',').map(t => t.trim()).filter(t => t);
    }
    return [String(this.value)];
  }

  private renderTag(tag: string) {
    return html/*html*/`
      <span class="tag tag--${this.variant}" part="tag">
        ${tag}
      </span>
    `;
  }
}
