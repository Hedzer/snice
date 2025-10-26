import { element, property, watch, ready, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-cell-phone.css?inline';
import type { SniceCellElement, ColumnDefinition } from './snice-table.types';

@element('snice-cell-phone')
export class SniceCellPhone extends HTMLElement implements SniceCellElement {
  @property({ type: String })
  value: string = '';

  @property({ type: String })
  phone: string = '';

  @property({ type: String })
  displayText: string = '';

  @property({ type: Boolean })
  showIcon: boolean = true;

  @property({ type: Boolean })
  format: boolean = true;

  @property({ type: String })
  country: string = 'US';

  @property({ type: Object })
  column: ColumnDefinition | null = null;

  @property({ type: Object })
  rowData: any = null;

  @property({ type: String })
  align: 'left' | 'center' | 'right' = 'left';

  @property({ type: String })
  type: string = 'phone';

  @render()
  render() {
    const phoneNumber = this.phone || this.value;
    const displayText = this.displayText || (this.format ? this.formatPhoneNumber(phoneNumber) : phoneNumber);
    const iconHTML = this.showIcon ? '<span class="phone-icon">📞</span>' : '';

    if (!phoneNumber) {
      return html/*html*/`
        <div class="cell-content cell-content--phone" part="content">
          <span class="phone-empty"></span>
        </div>
      `;
    }

    return html/*html*/`
      <div class="cell-content cell-content--phone" part="content">
        ${unsafeHTML(iconHTML)}
        <a href="tel:${phoneNumber}" class="phone-link" part="link">
          ${displayText}
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
    this.updatePhoneAttributes();
  }

  @watch('value', 'column')
  updatePhoneAttributes() {
    if (this.column?.phoneFormat) {
      const format = this.column.phoneFormat;
      this.phone = format.phone || this.value;
      this.displayText = format.displayText || '';
      this.showIcon = format.showIcon ?? true;
      this.format = format.format ?? true;
      this.country = format.country || 'US';
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Format US phone numbers (10 digits)
    if (this.country === 'US' && cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    // Format US phone numbers with country code (11 digits starting with 1)
    if (this.country === 'US' && cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }

    // For other formats, just return the original value
    return phone;
  }
}
