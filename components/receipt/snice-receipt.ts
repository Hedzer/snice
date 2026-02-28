import { element, property, render, styles, html, css } from 'snice';
import cssContent from './snice-receipt.css?inline';
import type {
  SniceReceiptElement,
  ReceiptVariant,
  ReceiptMerchant,
  ReceiptItem,
  ReceiptTaxLine,
  QrPosition
} from './snice-receipt.types';

@element('snice-receipt')
export class SniceReceipt extends HTMLElement implements SniceReceiptElement {
  @property()
  receiptNumber = '';

  @property()
  date = '';

  @property()
  currency = 'USD';

  @property()
  locale = '';

  @property({ type: Object })
  merchant: ReceiptMerchant = { name: '' };

  @property({ type: Array })
  items: ReceiptItem[] = [];

  @property({ type: Number })
  tax = 0;

  @property({ type: Array })
  taxes: ReceiptTaxLine[] = [];

  @property({ type: Number })
  subtotal = 0;

  @property({ type: Number })
  total = 0;

  @property({ type: Number })
  tip = 0;

  @property({ type: Number })
  discount = 0;

  @property()
  discountLabel = 'Discount';

  @property()
  paymentMethod = '';

  @property()
  paymentDetails = '';

  @property()
  variant: ReceiptVariant = 'standard';

  @property({ type: Boolean })
  showQr = false;

  @property()
  qrData = '';

  @property()
  qrPosition: QrPosition = 'bottom';

  @property()
  thankYou = 'Thank you for your purchase!';

  @property()
  cashier = '';

  @property()
  terminalId = '';

  private getComputedSubtotal(): number {
    if (this.subtotal > 0) return this.subtotal;
    return this.items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.price;
      const itemDiscount = item.discount || 0;
      return sum + lineTotal - itemDiscount;
    }, 0);
  }

  private getComputedTax(): number {
    if (this.taxes.length > 0) {
      return this.taxes.reduce((sum, t) => sum + t.amount, 0);
    }
    return this.tax;
  }

  private getComputedTotal(): number {
    if (this.total > 0) return this.total;
    const sub = this.getComputedSubtotal();
    const taxAmt = this.getComputedTax();
    return sub + taxAmt - this.discount + this.tip;
  }

  private formatCurrency(amount: number): string {
    const loc = this.locale || undefined;
    try {
      return new Intl.NumberFormat(loc, {
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
    const stylesText = Array.from(this.shadowRoot?.querySelectorAll('style') || [])
      .map(s => s.textContent)
      .join('\n');

    printWindow.document.write(
      `<!DOCTYPE html><html><head><style>${stylesText}</style></head><body>${content}</body></html>`
    );
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  }

  private renderDivider(): unknown {
    return html/*html*/`<hr class="receipt__divider" part="divider" />`;
  }

  private renderQrSlot(): unknown {
    const showSlot = this.showQr;
    if (!showSlot) return '';
    return html/*html*/`
      <div class="receipt__qr" part="qr-container">
        <slot name="qr"></slot>
      </div>
    `;
  }

  private renderItem(item: ReceiptItem): unknown {
    const lineTotal = item.quantity * item.price;
    const hasDiscount = (item.discount || 0) > 0;
    const showQty = item.quantity !== 1;
    const isDetailed = this.variant === 'detailed';
    const hasSku = isDetailed && item.sku;
    const hasNote = isDetailed && item.note;

    return html/*html*/`
      <div class="receipt__item" part="item">
        <div class="receipt__item-info">
          <span class="receipt__item-name" part="item-name">${item.name}</span>
          <if ${hasSku}>
            <span class="receipt__item-sku" part="item-sku">${item.sku}</span>
          </if>
          <if ${hasNote}>
            <span class="receipt__item-note">${item.note}</span>
          </if>
          <if ${hasDiscount}>
            <span class="receipt__item-discount">-${this.formatCurrency(item.discount || 0)}</span>
          </if>
        </div>
        <if ${showQty}>
          <span class="receipt__item-qty" part="item-qty">x${item.quantity}</span>
        </if>
        <span class="receipt__item-price" part="item-price">${this.formatCurrency(lineTotal)}</span>
      </div>
    `;
  }

  private renderMerchantContact(): unknown {
    const m = this.merchant;
    const hasPhone = m.phone;
    const hasEmail = m.email;
    const hasWebsite = m.website;
    const hasTaxId = m.taxId;
    const hasAny = hasPhone || hasEmail || hasWebsite || hasTaxId;
    if (!hasAny) return '';

    const parts: string[] = [];
    if (m.phone) parts.push(m.phone);
    if (m.email) parts.push(m.email);
    if (m.website) parts.push(m.website);
    if (m.taxId) parts.push(`Tax ID: ${m.taxId}`);

    return html/*html*/`
      <div class="receipt__merchant-contact" part="merchant-contact">${parts.join(' | ')}</div>
    `;
  }

  @render()
  renderContent() {
    const computedSubtotal = this.getComputedSubtotal();
    const computedTotal = this.getComputedTotal();
    const computedTax = this.getComputedTax();
    const hasMerchant = this.merchant.name;
    const hasTax = computedTax > 0;
    const hasMultipleTaxes = this.taxes.length > 0;
    const hasTip = this.tip > 0;
    const hasDiscount = this.discount > 0;
    const hasItems = this.items.length > 0;
    const hasMeta = this.receiptNumber || this.date || this.cashier || this.terminalId;
    const hasPayment = this.paymentMethod;
    const qrTop = this.showQr && this.qrPosition === 'top';
    const qrBottom = this.showQr && this.qrPosition === 'bottom';
    const qrFooter = this.showQr && this.qrPosition === 'footer';

    return html/*html*/`
      <div class="receipt" part="base">

        <if ${qrTop}>
          ${this.renderQrSlot()}
          ${this.renderDivider()}
        </if>

        <if ${hasMerchant}>
          <div class="receipt__header" part="header">
            <if ${this.merchant.logo}>
              <img class="receipt__logo" src="${this.merchant.logo}" alt="${this.merchant.name}" part="logo" />
            </if>
            <div class="receipt__merchant-name" part="merchant-name">${this.merchant.name}</div>
            <if ${this.merchant.address}>
              <div class="receipt__merchant-address" part="merchant-address">${this.merchant.address}</div>
            </if>
            ${this.renderMerchantContact()}
          </div>
          ${this.renderDivider()}
        </if>

        <if ${hasMeta}>
          <div class="receipt__meta" part="meta">
            <if ${this.receiptNumber}>
              <div class="receipt__meta-item">
                <span class="receipt__meta-label">Receipt #</span>
                <span class="receipt__meta-value" part="receipt-number">${this.receiptNumber}</span>
              </div>
            </if>
            <if ${this.date}>
              <div class="receipt__meta-item">
                <span class="receipt__meta-label">Date</span>
                <span class="receipt__meta-value" part="date">${this.date}</span>
              </div>
            </if>
            <if ${this.cashier}>
              <div class="receipt__meta-item">
                <span class="receipt__meta-label">Cashier</span>
                <span class="receipt__meta-value">${this.cashier}</span>
              </div>
            </if>
            <if ${this.terminalId}>
              <div class="receipt__meta-item">
                <span class="receipt__meta-label">Terminal</span>
                <span class="receipt__meta-value">${this.terminalId}</span>
              </div>
            </if>
          </div>
          ${this.renderDivider()}
        </if>

        <if ${hasItems}>
          <div class="receipt__items-header" part="items-header">
            <span>Item</span>
            <span>Amount</span>
          </div>
          <div class="receipt__items" part="items">
            ${this.items.map(item => this.renderItem(item))}
          </div>
          ${this.renderDivider()}
        </if>

        <div class="receipt__totals" part="totals">
          <div class="receipt__total-row" part="subtotal-row">
            <span>Subtotal</span>
            <span>${this.formatCurrency(computedSubtotal)}</span>
          </div>

          <if ${hasDiscount}>
            <div class="receipt__total-row receipt__total-row--discount" part="discount-row">
              <span>${this.discountLabel}</span>
              <span>-${this.formatCurrency(this.discount)}</span>
            </div>
          </if>

          <if ${hasTax && !hasMultipleTaxes}>
            <div class="receipt__total-row" part="tax-row">
              <span>Tax</span>
              <span>${this.formatCurrency(this.tax)}</span>
            </div>
          </if>

          <if ${hasMultipleTaxes}>
            ${this.taxes.map(t => {
              const label = t.rate ? `${t.label} (${t.rate}%)` : t.label;
              return html/*html*/`
                <div class="receipt__total-row" part="tax-row">
                  <span>${label}</span>
                  <span>${this.formatCurrency(t.amount)}</span>
                </div>
              `;
            })}
          </if>

          <if ${hasTip}>
            <div class="receipt__total-row" part="tip-row">
              <span>Tip</span>
              <span>${this.formatCurrency(this.tip)}</span>
            </div>
          </if>

          <div class="receipt__total-row receipt__total-row--grand" part="total-row">
            <span>Total</span>
            <span>${this.formatCurrency(computedTotal)}</span>
          </div>
        </div>

        <if ${hasPayment}>
          ${this.renderDivider()}
          <div class="receipt__payment" part="payment">
            <span>Paid with </span>
            <span class="receipt__payment-method" part="payment-method">${this.paymentMethod}</span>
            <if ${this.paymentDetails}>
              <div class="receipt__payment-details" part="payment-details">${this.paymentDetails}</div>
            </if>
          </div>
        </if>

        <if ${qrBottom}>
          ${this.renderDivider()}
          ${this.renderQrSlot()}
        </if>

        <div class="receipt__barcode" part="barcode-area">
          <slot name="barcode"></slot>
        </div>

        ${this.renderDivider()}
        <div class="receipt__footer" part="footer">
          <if ${this.thankYou}>
            <div class="receipt__thank-you" part="thank-you">${this.thankYou}</div>
          </if>
          <slot></slot>
          <if ${qrFooter}>
            ${this.renderQrSlot()}
          </if>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
