import { element, property, render, styles, html, css, dispatch, watch } from 'snice';
import cssContent from './snice-estimate.css?inline';
import type {
  SniceEstimateElement,
  EstimateStatus,
  EstimateVariant,
  EstimateParty,
  EstimateItem,
  EstimateJSON,
  EstimateAcceptDetail,
  EstimateDeclineDetail,
  ItemToggleDetail,
  QrPosition
} from './snice-estimate.types';

@element('snice-estimate')
export class SniceEstimate extends HTMLElement implements SniceEstimateElement {
  @property()
  estimateNumber = '';

  @property()
  date = '';

  @property()
  expiryDate = '';

  @property()
  status: EstimateStatus = 'draft';

  @property({ type: Object })
  from: EstimateParty | null = null;

  @property({ type: Object })
  to: EstimateParty | null = null;

  @property({ type: Array })
  items: EstimateItem[] = [];

  @property()
  currency = '$';

  @property({ type: Number })
  taxRate = 0;

  @property({ type: Number })
  discount = 0;

  @property()
  notes = '';

  @property()
  terms = '';

  @property()
  variant: EstimateVariant = 'standard';

  @property({ type: Boolean })
  showQr = false;

  @property()
  qrData = '';

  @property()
  qrPosition: QrPosition = 'top-right';

  @dispatch('estimate-accept', { bubbles: true, composed: true })
  private emitEstimateAccept(detail?: EstimateAcceptDetail): EstimateAcceptDetail {
    return detail!;
  }

  @dispatch('estimate-decline', { bubbles: true, composed: true })
  private emitEstimateDecline(detail?: EstimateDeclineDetail): EstimateDeclineDetail {
    return detail!;
  }

  @dispatch('item-toggle', { bubbles: true, composed: true })
  private emitItemToggle(detail?: ItemToggleDetail): ItemToggleDetail {
    return detail!;
  }

  @watch('items')
  handleItemsChange() {
    // Re-render on items change
  }

  private handleItemToggle(index: number) {
    const item = this.items[index];
    if (!item || !item.optional) return;

    const updatedItems = [...this.items];
    const newIncluded = !(item.included !== false);
    updatedItems[index] = { ...item, included: newIncluded };
    this.items = updatedItems;

    this.emitItemToggle({
      index,
      item: updatedItems[index],
      included: newIncluded
    });
  }

  private handleAccept() {
    this.emitEstimateAccept({
      estimateNumber: this.estimateNumber,
      items: this.getIncludedItems(),
      total: this.getTotal()
    });
  }

  private handleDecline() {
    this.emitEstimateDecline({
      estimateNumber: this.estimateNumber
    });
  }

  private getIncludedItems(): EstimateItem[] {
    return this.items.filter(item => !item.optional || item.included !== false);
  }

  private getSubtotal(): number {
    return this.getIncludedItems().reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }

  private getDiscountAmount(): number {
    return this.getSubtotal() * (this.discount / 100);
  }

  private getTaxableAmount(): number {
    return this.getSubtotal() - this.getDiscountAmount();
  }

  private getTaxAmount(): number {
    return this.getTaxableAmount() * (this.taxRate / 100);
  }

  private getTotal(): number {
    return this.getTaxableAmount() + this.getTaxAmount();
  }

  private formatCurrency(amount: number): string {
    return this.currency + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  print() {
    window.print();
  }

  toJSON(): EstimateJSON {
    return {
      estimateNumber: this.estimateNumber,
      date: this.date,
      expiryDate: this.expiryDate,
      status: this.status,
      from: this.from,
      to: this.to,
      items: [...this.items],
      currency: this.currency,
      taxRate: this.taxRate,
      discount: this.discount,
      notes: this.notes,
      terms: this.terms,
      subtotal: this.getSubtotal(),
      discountAmount: this.getDiscountAmount(),
      taxAmount: this.getTaxAmount(),
      total: this.getTotal()
    };
  }

  private renderQr(position: QrPosition): unknown {
    if (!this.showQr) return '';

    const posClass = `est__qr est__qr--${position}`;
    return html/*html*/`
      <div class="${posClass}" part="qr-container">
        <slot name="qr" part="qr"></slot>
      </div>
    `;
  }

  private renderParty(party: EstimateParty | null, label: string): unknown {
    if (!party) return '';

    const address = party.address ? html/*html*/`<span class="est__party-detail" part="party-detail">${party.address}</span>` : '';
    const phone = party.phone ? html/*html*/`<span class="est__party-detail" part="party-detail">${party.phone}</span>` : '';
    const email = party.email ? html/*html*/`<span class="est__party-detail" part="party-detail">${party.email}</span>` : '';

    return html/*html*/`
      <div class="est__party" part="party">
        <span class="est__party-label" part="party-label">${label}</span>
        <span class="est__party-name" part="party-name">${party.name}</span>
        ${address}
        ${phone}
        ${email}
      </div>
    `;
  }

  private renderHeaderQr(): unknown {
    if (!this.showQr || this.qrPosition !== 'top-right') return '';
    return this.renderQr('top-right');
  }

  private renderDate(): unknown {
    if (!this.date) return '';
    return html/*html*/`<span class="est__meta" part="meta">${this.date}</span>`;
  }

  private renderExpiry(): unknown {
    if (!this.expiryDate) return '';
    return html/*html*/`<span class="est__expiry" part="expiry">Valid until <span class="est__expiry-date" part="expiry-date">${this.expiryDate}</span></span>`;
  }

  private renderHeader(): unknown {
    return html/*html*/`
      <div class="est__header" part="header">
        <div class="est__header-left">
          <slot name="logo" part="logo" class="est__logo"></slot>
          <h2 class="est__title" part="title">Estimate ${this.estimateNumber ? '#' + this.estimateNumber : ''}</h2>
          ${this.renderDate()}
        </div>
        <div class="est__header-right">
          <span class="est__badge est__status--${this.status}" part="status">${this.status}</span>
          ${this.renderExpiry()}
        </div>
        ${this.renderHeaderQr()}
      </div>
    `;
  }

  private renderParties(): unknown {
    if (!this.from && !this.to) return '';

    return html/*html*/`
      <div class="est__parties" part="parties">
        ${this.renderParty(this.from, 'From')}
        ${this.renderParty(this.to, 'To')}
      </div>
    `;
  }

  private renderTable(): unknown {
    if (this.items.length === 0) return '';

    return html/*html*/`
      <div class="est__table-section" part="table">
        <table class="est__table">
          <thead>
            <tr part="table-header">
              <th class="est__table-header">Description</th>
              <th class="est__table-header">Qty</th>
              <th class="est__table-header">Unit Price</th>
              <th class="est__table-header">Total</th>
              <th class="est__table-header"></th>
            </tr>
          </thead>
          <tbody>
            ${this.items.map((item, index) => {
              const isOptional = item.optional === true;
              const isIncluded = !isOptional || item.included !== false;
              const rowClasses = [
                isOptional ? 'est__row--optional' : '',
                isIncluded ? 'est__row--included' : ''
              ].filter(Boolean).join(' ');

              const optionalTag = isOptional ? html/*html*/`<span class="est__optional-tag">optional</span>` : '';
              const toggleBtn = isOptional ? html/*html*/`
                <button
                  class="est__toggle ${isIncluded ? 'est__toggle--active' : ''}"
                  @click=${() => this.handleItemToggle(index)}
                  aria-label="${isIncluded ? 'Exclude item' : 'Include item'}"
                  part="item-toggle">
                </button>
              ` : '';

              return html/*html*/`
                <tr class="${rowClasses}" part="table-row">
                  <td class="est__table-cell" part="table-cell">
                    ${item.description}
                    ${optionalTag}
                  </td>
                  <td class="est__table-cell" part="table-cell">${item.quantity}</td>
                  <td class="est__table-cell" part="table-cell">${this.formatCurrency(item.unitPrice)}</td>
                  <td class="est__table-cell" part="table-cell">${this.formatCurrency(item.quantity * item.unitPrice)}</td>
                  <td class="est__table-cell" part="table-cell">
                    ${toggleBtn}
                  </td>
                </tr>
              `;
            })}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderSummary(): unknown {
    const subtotal = this.getSubtotal();
    const discountAmount = this.getDiscountAmount();
    const taxAmount = this.getTaxAmount();
    const total = this.getTotal();

    const discountRow = this.discount > 0 ? html/*html*/`
      <div class="est__discount-row" part="discount-row">
        <span>Discount (${this.discount}%)</span>
        <span>-${this.formatCurrency(discountAmount)}</span>
      </div>
    ` : '';

    const taxRow = this.taxRate > 0 ? html/*html*/`
      <div class="est__tax-row" part="tax-row">
        <span>Tax (${this.taxRate}%)</span>
        <span>${this.formatCurrency(taxAmount)}</span>
      </div>
    ` : '';

    return html/*html*/`
      <div class="est__summary" part="summary">
        <div class="est__summary-inner">
          <div class="est__subtotal-row" part="subtotal">
            <span>Subtotal</span>
            <span>${this.formatCurrency(subtotal)}</span>
          </div>
          ${discountRow}
          ${taxRow}
          <div class="est__total-row" part="total">
            <span>Total</span>
            <span>${this.formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderNotes(): unknown {
    if (!this.notes) return '';

    return html/*html*/`
      <div class="est__notes-section" part="notes">
        <h3 class="est__notes-label" part="notes-label">Notes</h3>
        <p class="est__notes-content" part="notes-content">${this.notes}</p>
      </div>
    `;
  }

  private renderTerms(): unknown {
    if (!this.terms) return '';

    return html/*html*/`
      <div class="est__terms-section" part="terms">
        <h3 class="est__terms-label">Terms & Conditions</h3>
        <p class="est__terms-content">${this.terms}</p>
      </div>
    `;
  }

  private renderActions(): unknown {
    const isActionable = this.status === 'sent' || this.status === 'draft';
    if (!isActionable) return '';

    return html/*html*/`
      <div class="est__actions" part="actions">
        <button class="est__btn est__btn--decline" @click=${() => this.handleDecline()} part="decline-button">
          Decline
        </button>
        <button class="est__btn est__btn--accept" @click=${() => this.handleAccept()} part="accept-button">
          Accept Estimate
        </button>
      </div>
    `;
  }

  private renderFooter(): unknown {
    const hasFooterSlot = true; // Always render for slot availability
    return html/*html*/`
      <div class="est__footer" part="footer">
        <slot name="footer"></slot>
      </div>
    `;
  }

  private renderComparisonView(): unknown {
    return html/*html*/`
      <div class="est__comparison" part="comparison">
        ${this.items.map((item, index) => html/*html*/`
          <div class="est__option" part="option">
            <h3 class="est__option-title">${item.description}</h3>
            <div class="est__option-total">
              <span>Total</span>
              <span>${this.formatCurrency(item.quantity * item.unitPrice)}</span>
            </div>
            <button
              class="est__option-btn"
              @click=${() => {
                this.emitEstimateAccept({
                  estimateNumber: this.estimateNumber,
                  items: [item],
                  total: item.quantity * item.unitPrice
                });
              }}
              part="option-button">
              Select Option
            </button>
          </div>
        `)}
      </div>
    `;
  }

  private renderComparisonSection(): unknown {
    if (this.variant !== 'comparison') return '';
    return this.renderComparisonView();
  }

  private renderTableSection(): unknown {
    if (this.variant === 'comparison') return '';
    return this.renderTable();
  }

  private renderQrBottom(): unknown {
    if (!this.showQr || this.qrPosition !== 'bottom-right' || this.variant === 'comparison') return '';
    return this.renderQr('bottom-right');
  }

  private renderQrFooter(): unknown {
    if (!this.showQr || this.qrPosition !== 'footer' || this.variant === 'comparison') return '';
    return this.renderQr('footer');
  }

  private renderSummarySection(): unknown {
    if (this.variant === 'comparison') return '';
    return this.renderSummary();
  }

  @render()
  renderContent() {
    return html/*html*/`
      <div class="est" part="base">
        ${this.renderHeader()}
        ${this.renderParties()}
        ${this.renderComparisonSection()}
        ${this.renderTableSection()}
        ${this.renderSummarySection()}
        ${this.renderNotes()}
        ${this.renderTerms()}
        ${this.renderActions()}
        ${this.renderQrBottom()}
        ${this.renderQrFooter()}
        ${this.renderFooter()}
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
