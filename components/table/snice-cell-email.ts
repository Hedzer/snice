import { element, property, watch, ready, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-cell-email.css?inline';
import type { SniceCellElement, ColumnDefinition } from './snice-table.types';

@element('snice-cell-email')
export class SniceCellEmail extends HTMLElement implements SniceCellElement {
  @property({ type: String })
  value: string = '';

  @property({ type: String })
  email: string = '';

  @property({ type: String })
  displayText: string = '';

  @property({ type: Boolean })
  showIcon: boolean = true;

  @property({ type: Object, attribute: false })
  column: ColumnDefinition | null = null;

  @property({ type: Object, attribute: false })
  rowData: any = null;

  @property({ type: String })
  align: 'left' | 'center' | 'right' = 'left';

  @property({ type: String })
  type: string = 'email';

  @render()
  render() {
    const emailAddress = this.email || this.value;
    const displayName = this.displayText || emailAddress;
    const iconHTML = this.showIcon ? '<span class="email-icon">✉</span>' : '';

    if (!emailAddress) {
      return html/*html*/`
        <div class="cell-content cell-content--email" part="content">
          <span class="email-empty"></span>
        </div>
      `;
    }

    return html/*html*/`
      <div class="cell-content cell-content--email" part="content">
        ${unsafeHTML(iconHTML)}
        <a href="mailto:${emailAddress}" class="email-link" part="link">
          ${displayName}
        </a>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    this.updateEmailAttributes();
  }

  @watch('value', 'column')
  updateEmailAttributes() {
    if (this.column?.emailFormat) {
      const format = this.column.emailFormat;
      this.email = format.email || this.value;
      this.displayText = format.displayText || '';
      this.showIcon = format.showIcon ?? true;
    }
  }
}
