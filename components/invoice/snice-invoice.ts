import { element, property, watch, dispatch, render, styles, html, css } from 'snice';
import cssContent from './snice-invoice.css?inline';
import type {
  SniceInvoiceElement,
  InvoiceStatus,
  InvoiceVariant,
  InvoiceParty,
  InvoiceItem,
  InvoiceItemChangeDetail,
  InvoiceStatusChangeDetail,
  QrPosition
} from './snice-invoice.types';

@element('snice-invoice')
export class SniceInvoice extends HTMLElement implements SniceInvoiceElement {
  @property()
  invoiceNumber = '';

  @property()
  date = '';

  @property()
  dueDate = '';

  @property()
  status: InvoiceStatus = 'draft';

  @property()
  currency = 'USD';

  @property({ type: Number })
  taxRate = 0;

  @property({ type: Number })
  discount = 0;

  @property({ type: Object })
  from: InvoiceParty = { name: '' };

  @property({ type: Object })
  to: InvoiceParty = { name: '' };

  @property({ type: Array })
  items: InvoiceItem[] = [];

  @property()
  notes = '';

  @property()
  variant: InvoiceVariant = 'standard';

  @property({ type: Boolean })
  showQr = false;

  @property()
  qrData = '';

  @property()
  qrPosition: QrPosition = 'bottom-right';

  @watch('status')
  handleStatusChange(oldVal: InvoiceStatus, newVal: InvoiceStatus) {
    if (oldVal && oldVal !== newVal) {
      this.emitStatusChange({ oldStatus: oldVal, newStatus: newVal });
    }
  }

  @watch('items')
  handleItemsChange() {
    this.emitItemChange({
      items: this.items,
      subtotal: this.getSubtotal(),
      tax: this.getTaxAmount(),
      total: this.getTotal()
    });
  }

  @dispatch('invoice-item-change', { bubbles: true, composed: true })
  private emitItemChange(detail?: InvoiceItemChangeDetail): InvoiceItemChangeDetail {
    return detail!;
  }

  @dispatch('invoice-status-change', { bubbles: true, composed: true })
  private emitStatusChange(detail?: InvoiceStatusChangeDetail): InvoiceStatusChangeDetail {
    return detail!;
  }

  private getItemAmount(item: InvoiceItem): number {
    if (item.amount !== undefined) return item.amount;
    return item.quantity * item.unitPrice;
  }

  private getSubtotal(): number {
    return this.items.reduce((sum, item) => sum + this.getItemAmount(item), 0);
  }

  private getTaxAmount(): number {
    const subtotal = this.getSubtotal();
    const afterDiscount = subtotal - this.getDiscountAmount();
    return afterDiscount * (this.taxRate / 100);
  }

  private getDiscountAmount(): number {
    return this.getSubtotal() * (this.discount / 100);
  }

  private getTotal(): number {
    const subtotal = this.getSubtotal();
    const discountAmt = this.getDiscountAmount();
    const taxAmt = (subtotal - discountAmt) * (this.taxRate / 100);
    return subtotal - discountAmt + taxAmt;
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
    window.print();
  }

  toJSON(): object {
    return {
      invoiceNumber: this.invoiceNumber,
      date: this.date,
      dueDate: this.dueDate,
      status: this.status,
      currency: this.currency,
      taxRate: this.taxRate,
      discount: this.discount,
      from: { ...this.from },
      to: { ...this.to },
      items: this.items.map(i => ({ ...i })),
      notes: this.notes,
      variant: this.variant,
      showQr: this.showQr,
      qrData: this.qrData,
      qrPosition: this.qrPosition,
      subtotal: this.getSubtotal(),
      tax: this.getTaxAmount(),
      discount_amount: this.getDiscountAmount(),
      total: this.getTotal()
    };
  }

  private renderParty(label: string, party: InvoiceParty): unknown {
    const hasContent = party.name || party.address || party.email || party.phone;
    if (!hasContent) return html``;

    return html/*html*/`
      <div class="invoice__party" part="party">
        <div class="invoice__party-label" part="party-label">${label}</div>
        <if ${party.name}>
          <div class="invoice__party-name" part="party-name">${party.name}</div>
        </if>
        <if ${party.address}>
          <div class="invoice__party-detail" part="party-detail">${party.address}</div>
        </if>
        <if ${party.email}>
          <div class="invoice__party-detail" part="party-detail">${party.email}</div>
        </if>
        <if ${party.phone}>
          <div class="invoice__party-detail" part="party-detail">${party.phone}</div>
        </if>
      </div>
    `;
  }

  private renderItemRow(item: InvoiceItem, index: number): unknown {
    const amount = this.getItemAmount(item);
    const hasItemTax = item.tax !== undefined;

    return html/*html*/`
      <tr part="table-row">
        <td class="invoice__col-line" part="table-cell">
          <span class="invoice__item-line-num">${index + 1}</span>
        </td>
        <td part="table-cell">
          ${item.description}
          <if ${hasItemTax}>
            <span class="invoice__item-tax">Tax: ${item.tax}%</span>
          </if>
        </td>
        <td class="invoice__col-qty" part="table-cell">${item.quantity}</td>
        <td class="invoice__col-price" part="table-cell">${this.formatCurrency(item.unitPrice)}</td>
        <td part="table-cell">${this.formatCurrency(amount)}</td>
      </tr>
    `;
  }

  private renderQr(position: QrPosition): unknown {
    if (!this.showQr) return html``;

    return html/*html*/`
      <div class="invoice__qr invoice__qr--${position}" part="qr-container">
        <div part="qr">
          <slot name="qr">
            <div class="invoice__qr-placeholder">QR</div>
          </slot>
        </div>
      </div>
    `;
  }

  @render()
  renderContent() {
    const subtotal = this.getSubtotal();
    const discountAmt = this.getDiscountAmount();
    const taxAmt = this.getTaxAmount();
    const total = this.getTotal();
    const hasDiscount = this.discount > 0;
    const hasTax = this.taxRate > 0;
    const hasFrom = this.from.name || this.from.address;
    const hasTo = this.to.name || this.to.address;
    const hasParties = hasFrom || hasTo;
    const isDetailed = this.variant === 'detailed';
    const isQrTopRight = this.showQr && this.qrPosition === 'top-right';
    const isQrBottomRight = this.showQr && this.qrPosition === 'bottom-right';
    const isQrBottomLeft = this.showQr && this.qrPosition === 'bottom-left';
    const isQrFooter = this.showQr && this.qrPosition === 'footer';

    return html/*html*/`
      <div class="invoice" part="base">
        <div class="invoice__header" part="header">
          <div class="invoice__header-left">
            <if ${this.from.logo}>
              <img class="invoice__logo" src="${this.from.logo}" alt="${this.from.name}" part="logo" />
            </if>
            <h2 class="invoice__title" part="title">Invoice</h2>
            <span class="invoice__status invoice__status--${this.status}" part="status">${this.status}</span>
          </div>
          <div class="invoice__meta" part="meta">
            <if ${this.invoiceNumber}>
              <div>
                <span class="invoice__meta-label">Invoice # </span>
                <span class="invoice__meta-value">${this.invoiceNumber}</span>
              </div>
            </if>
            <if ${this.date}>
              <div>
                <span class="invoice__meta-label">Date: </span>
                <span class="invoice__meta-value">${this.date}</span>
              </div>
            </if>
            <if ${this.dueDate}>
              <div>
                <span class="invoice__meta-label">Due Date: </span>
                <span class="invoice__meta-value">${this.dueDate}</span>
              </div>
            </if>
          </div>
          <if ${isQrTopRight}>
            ${this.renderQr('top-right')}
          </if>
        </div>

        <if ${hasParties}>
          <div class="invoice__parties" part="parties">
            ${this.renderParty('From', this.from)}
            ${this.renderParty('Bill To', this.to)}
          </div>
        </if>

        <if ${this.items.length > 0}>
          <table class="invoice__table" part="table">
            <thead part="table-header">
              <tr>
                <if ${isDetailed}>
                  <th class="invoice__col-line">#</th>
                </if>
                <th>Description</th>
                <th class="invoice__col-qty">Qty</th>
                <th class="invoice__col-price">Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${this.items.map((item, i) => this.renderItemRow(item, i))}
            </tbody>
          </table>
        </if>

        <div class="invoice__summary" part="summary">
          <div class="invoice__summary-table">
            <div class="invoice__summary-row" part="summary-row">
              <span part="summary-label">Subtotal</span>
              <span part="summary-value">${this.formatCurrency(subtotal)}</span>
            </div>
            <if ${hasDiscount}>
              <div class="invoice__summary-row invoice__summary-row--discount" part="discount-row">
                <span part="summary-label">Discount (${this.discount}%)</span>
                <span part="summary-value">-${this.formatCurrency(discountAmt)}</span>
              </div>
            </if>
            <if ${hasTax}>
              <div class="invoice__summary-row" part="tax-row">
                <span part="summary-label">Tax (${this.taxRate}%)</span>
                <span part="summary-value">${this.formatCurrency(taxAmt)}</span>
              </div>
            </if>
            <div class="invoice__summary-row invoice__summary-row--total" part="total">
              <span part="summary-label">Total</span>
              <span part="summary-value">${this.formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <if ${this.notes}>
          <div class="invoice__notes" part="notes">
            <div class="invoice__notes-label" part="notes-label">Notes</div>
            <div part="notes-content">${this.notes}</div>
          </div>
        </if>

        <if ${isQrBottomRight}>
          ${this.renderQr('bottom-right')}
        </if>
        <if ${isQrBottomLeft}>
          ${this.renderQr('bottom-left')}
        </if>
        <if ${isQrFooter}>
          ${this.renderQr('footer')}
        </if>

        <div class="invoice__footer" part="footer">
          <slot></slot>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
