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
  ItemToggleDetail
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
  variant: EstimateVariant = 'standard';

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
      subtotal: this.getSubtotal(),
      discountAmount: this.getDiscountAmount(),
      taxAmount: this.getTaxAmount(),
      total: this.getTotal()
    };
  }

  private renderParty(party: EstimateParty | null, label: string): unknown {
    if (!party) return '';

    return html/*html*/`
      <div class="est__party" part="party">
        <span class="est__party-label">${label}</span>
        <span class="est__party-name">${party.name}</span>
        <if ${party.address}>
          <span class="est__party-detail">${party.address}</span>
        </if>
        <if ${party.phone}>
          <span class="est__party-detail">${party.phone}</span>
        </if>
        <if ${party.email}>
          <span class="est__party-detail">${party.email}</span>
        </if>
      </div>
    `;
  }

  private renderHeader(): unknown {
    return html/*html*/`
      <div class="est__header" part="header">
        <div class="est__header-left">
          <h2 class="est__title" part="title">Estimate ${this.estimateNumber ? '#' + this.estimateNumber : ''}</h2>
          <if ${this.date}>
            <span class="est__subtitle" part="date">${this.date}</span>
          </if>
        </div>
        <div class="est__header-right">
          <span class="est__badge est__status--${this.status}" part="status">${this.status}</span>
          <if ${this.expiryDate}>
            <span class="est__expiry" part="expiry">Valid until ${this.expiryDate}</span>
          </if>
        </div>
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

  private renderStandardItems(): unknown {
    if (this.items.length === 0) return '';

    return html/*html*/`
      <div class="est__section" part="items-section">
        <table class="est__items-table" part="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${this.items.map((item, index) => {
              const isOptional = item.optional === true;
              const isIncluded = !isOptional || item.included !== false;
              const rowClasses = [
                'est__item-row',
                isOptional ? 'est__item-row--optional' : '',
                isIncluded ? 'est__item-row--included' : ''
              ].filter(Boolean).join(' ');

              return html/*html*/`
                <tr class="${rowClasses}">
                  <td>
                    ${item.description}
                    <if ${isOptional}>
                      <span class="est__item-optional-tag">optional</span>
                    </if>
                  </td>
                  <td>${item.quantity}</td>
                  <td>${this.formatCurrency(item.unitPrice)}</td>
                  <td>${this.formatCurrency(item.quantity * item.unitPrice)}</td>
                  <td>
                    <if ${isOptional}>
                      <button
                        class="est__toggle ${isIncluded ? 'est__toggle--active' : ''}"
                        @click=${() => this.handleItemToggle(index)}
                        aria-label="${isIncluded ? 'Exclude item' : 'Include item'}"
                        part="item-toggle">
                      </button>
                    </if>
                  </td>
                </tr>
              `;
            })}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderTotals(): unknown {
    const subtotal = this.getSubtotal();
    const discountAmount = this.getDiscountAmount();
    const taxAmount = this.getTaxAmount();
    const total = this.getTotal();

    return html/*html*/`
      <div class="est__totals" part="totals">
        <div class="est__totals-inner">
          <div class="est__total-row">
            <span>Subtotal</span>
            <span>${this.formatCurrency(subtotal)}</span>
          </div>
          <if ${this.discount > 0}>
            <div class="est__total-row">
              <span>Discount (${this.discount}%)</span>
              <span>-${this.formatCurrency(discountAmount)}</span>
            </div>
          </if>
          <if ${this.taxRate > 0}>
            <div class="est__total-row">
              <span>Tax (${this.taxRate}%)</span>
              <span>${this.formatCurrency(taxAmount)}</span>
            </div>
          </if>
          <div class="est__total-row est__total-row--grand">
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
      <div class="est__section" part="notes-section">
        <h3 class="est__section-title">Notes</h3>
        <p class="est__notes" part="notes">${this.notes}</p>
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

  private renderComparisonView(): unknown {
    // In comparison mode, each item is treated as a separate option
    // Group items by their description prefix or render each as an option card
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

  private renderStandardView(): unknown {
    return html/*html*/`
      ${this.renderStandardItems()}
      ${this.renderTotals()}
      ${this.renderNotes()}
      ${this.renderActions()}
    `;
  }

  @render()
  renderContent() {
    const isComparison = this.variant === 'comparison';

    return html/*html*/`
      <div class="est" part="base">
        ${this.renderHeader()}
        ${this.renderParties()}
        <if ${isComparison}>
          ${this.renderComparisonView()}
        </if>
        <if ${!isComparison}>
          ${this.renderStandardView()}
        </if>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
