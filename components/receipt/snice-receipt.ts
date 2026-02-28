import { element, property, render, styles, html, css } from 'snice';
import cssContent from './snice-receipt.css?inline';
import type {
  SniceReceiptElement,
  ReceiptVariant,
  ReceiptMerchant,
  ReceiptItem
} from './snice-receipt.types';

@element('snice-receipt')
export class SniceReceipt extends HTMLElement implements SniceReceiptElement {
  @property()
  receiptNumber = '';

  @property()
  date = '';

  @property()
  currency = 'USD';

  @property({ type: Object })
  merchant: ReceiptMerchant = { name: '' };

  @property({ type: Array })
  items: ReceiptItem[] = [];

  @property({ type: Number })
  tax = 0;

  @property({ type: Number })
  subtotal = 0;

  @property({ type: Number })
  total = 0;

  @property()
  paymentMethod = '';

  @property()
  variant: ReceiptVariant = 'standard';

  private getComputedSubtotal(): number {
    if (this.subtotal > 0) return this.subtotal;
    return this.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }

  private getComputedTotal(): number {
    if (this.total > 0) return this.total;
    return this.getComputedSubtotal() + this.tax;
  }

  private formatCurrency(amount: number): string {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: this.currency
      }).format(amount);
    } catch {
      return `${this.currency} ${amount.toFixed(2)}`;
    }
  }

  print(): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = this.shadowRoot?.innerHTML || '';
    const styles = Array.from(this.shadowRoot?.querySelectorAll('style') || [])
      .map(s => s.textContent)
      .join('\n');

    printWindow.document.write(`<!DOCTYPE html><html><head><style>${styles}</style></head><body>${content}</body></html>`);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  }

  private renderItem(item: ReceiptItem): unknown {
    const lineTotal = item.quantity * item.price;
    return html/*html*/`
      <div class="receipt__item" part="item">
        <span class="receipt__item-name">${item.name}</span>
        <if ${item.quantity > 1}>
          <span class="receipt__item-qty">x${item.quantity}</span>
        </if>
        <span class="receipt__item-price">${this.formatCurrency(lineTotal)}</span>
      </div>
    `;
  }

  @render()
  renderContent() {
    const computedSubtotal = this.getComputedSubtotal();
    const computedTotal = this.getComputedTotal();
    const hasMerchant = this.merchant.name;
    const hasTax = this.tax > 0;

    return html/*html*/`
      <div class="receipt" part="base">
        <if ${hasMerchant}>
          <div class="receipt__header" part="header">
            <if ${this.merchant.logo}>
              <img class="receipt__logo" src="${this.merchant.logo}" alt="${this.merchant.name}" part="logo" />
            </if>
            <div class="receipt__merchant-name" part="merchant-name">${this.merchant.name}</div>
            <if ${this.merchant.address}>
              <div class="receipt__merchant-address">${this.merchant.address}</div>
            </if>
          </div>
        </if>

        <div class="receipt__meta" part="meta">
          <if ${this.receiptNumber}>
            <div class="receipt__meta-item">
              <span class="receipt__meta-label">Receipt #</span>
              <span class="receipt__meta-value">${this.receiptNumber}</span>
            </div>
          </if>
          <if ${this.date}>
            <div class="receipt__meta-item">
              <span class="receipt__meta-label">Date</span>
              <span class="receipt__meta-value">${this.date}</span>
            </div>
          </if>
        </div>

        <if ${this.items.length > 0}>
          <div class="receipt__items" part="items">
            ${this.items.map(item => this.renderItem(item))}
          </div>
        </if>

        <div class="receipt__totals" part="totals">
          <div class="receipt__total-row">
            <span>Subtotal</span>
            <span>${this.formatCurrency(computedSubtotal)}</span>
          </div>
          <if ${hasTax}>
            <div class="receipt__total-row">
              <span>Tax</span>
              <span>${this.formatCurrency(this.tax)}</span>
            </div>
          </if>
          <div class="receipt__total-row receipt__total-row--grand" part="total">
            <span>Total</span>
            <span>${this.formatCurrency(computedTotal)}</span>
          </div>
        </div>

        <if ${this.paymentMethod}>
          <div class="receipt__payment" part="payment">
            Paid with <span class="receipt__payment-method">${this.paymentMethod}</span>
          </div>
        </if>

        <div class="receipt__footer" part="footer">
          <slot>Thank you for your purchase!</slot>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
