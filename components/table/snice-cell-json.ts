import { element, property, watch, ready, render, styles, html, css, unsafeHTML, on } from 'snice';
import cssContent from './snice-cell-json.css?inline';
import type { SniceCellElement, ColumnDefinition } from './snice-table.types';

@element('snice-cell-json')
export class SniceCellJson extends HTMLElement implements SniceCellElement {
  @property({ type: String })
  value: any = null;

  @property({ type: Boolean })
  collapsed: boolean = true;

  @property({ type: Number })
  maxDepth: number = 3;

  @property({ type: Boolean })
  showToggle: boolean = true;

  @property({ type: Object })
  column: ColumnDefinition | null = null;

  @property({ type: Object })
  rowData: any = null;

  @property({ type: String })
  align: 'left' | 'center' | 'right' = 'left';

  @property({ type: String })
  type: string = 'json';

  @render()
  renderContent() {
    const jsonValue = typeof this.value === 'string' ? this.tryParseJson(this.value) : this.value;

    if (jsonValue === null || jsonValue === undefined) {
      return html/*html*/`
        <div class="cell-content cell-content--json" part="content">
          <span class="json-empty">null</span>
        </div>
      `;
    }

    const toggleHTML = this.showToggle
      ? `<button class="json-toggle" part="toggle" aria-label="${this.collapsed ? 'Expand' : 'Collapse'}">${this.collapsed ? '▶' : '▼'}</button>`
      : '';

    const jsonHTML = this.collapsed
      ? this.renderCollapsed(jsonValue)
      : this.renderExpanded(jsonValue);

    return html/*html*/`
      <div class="cell-content cell-content--json" part="content">
        ${unsafeHTML(toggleHTML)}
        <div class="json-viewer ${this.collapsed ? 'json-viewer--collapsed' : 'json-viewer--expanded'}">
          ${unsafeHTML(jsonHTML)}
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
    this.updateJsonAttributes();
  }

  @watch('value', 'column')
  updateJsonAttributes() {
    if (this.column?.jsonFormat) {
      const format = this.column.jsonFormat;
      this.collapsed = format.collapsed ?? true;
      this.maxDepth = format.maxDepth ?? 3;
      this.showToggle = format.showToggle ?? true;
    }
  }

  @on('click', '.json-toggle')
  handleToggle() {
    this.collapsed = !this.collapsed;
  }

  private tryParseJson(str: string): any {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  }

  private renderCollapsed(json: any): string {
    if (typeof json === 'object' && json !== null) {
      if (Array.isArray(json)) {
        return `<span class="json-preview">[${json.length} items]</span>`;
      }
      const keys = Object.keys(json);
      return `<span class="json-preview">{${keys.length} keys}</span>`;
    }
    return this.renderValue(json);
  }

  private renderExpanded(json: any, depth: number = 0): string {
    if (depth >= this.maxDepth) {
      return this.renderCollapsed(json);
    }

    if (typeof json === 'object' && json !== null) {
      if (Array.isArray(json)) {
        const items = json.map((item, i) => {
          const value = this.renderExpanded(item, depth + 1);
          return `<div class="json-line"><span class="json-key">${i}:</span> ${value}</div>`;
        }).join('');
        return `<div class="json-object">[${items}]</div>`;
      }

      const entries = Object.entries(json).map(([key, value]) => {
        const renderedValue = this.renderExpanded(value, depth + 1);
        return `<div class="json-line"><span class="json-key">${key}:</span> ${renderedValue}</div>`;
      }).join('');
      return `<div class="json-object">{${entries}}</div>`;
    }

    return this.renderValue(json);
  }

  private renderValue(value: any): string {
    if (value === null) return '<span class="json-null">null</span>';
    if (value === undefined) return '<span class="json-undefined">undefined</span>';
    if (typeof value === 'boolean') return `<span class="json-boolean">${value}</span>`;
    if (typeof value === 'number') return `<span class="json-number">${value}</span>`;
    if (typeof value === 'string') return `<span class="json-string">"${value}"</span>`;
    return String(value);
  }
}
