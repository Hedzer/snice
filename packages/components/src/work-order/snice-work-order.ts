import { element, property, render, styles, html, css, dispatch, watch } from 'snice';
import cssContent from './snice-work-order.css?inline';
import type {
  SniceWorkOrderElement,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderVariant,
  WorkOrderCustomer,
  WorkOrderTask,
  WorkOrderPart,
  WorkOrderAsset,
  WorkOrderJSON,
  TaskToggleDetail,
  StatusChangeDetail,
  WorkOrderSignDetail,
  QrPosition
} from './snice-work-order.types';

@element('snice-work-order')
export class SniceWorkOrder extends HTMLElement implements SniceWorkOrderElement {
  @property()
  woNumber = '';

  @property()
  date = '';

  @property()
  dueDate = '';

  @property()
  priority: WorkOrderPriority = 'medium';

  @property()
  status: WorkOrderStatus = 'open';

  @property({ type: Object, attribute: false })
  customer: WorkOrderCustomer | null = null;

  @property()
  description = '';

  @property({ type: Array, attribute: false })
  tasks: WorkOrderTask[] = [];

  @property({ type: Array, attribute: false })
  parts: WorkOrderPart[] = [];

  @property({ type: Object, attribute: false })
  asset: WorkOrderAsset | null = null;

  @property({ type: Number })
  laborRate = 0;

  @property()
  notes = '';

  @property()
  variant: WorkOrderVariant = 'standard';

  @property({ type: Boolean })
  showQr = false;

  @property()
  qrData = '';

  @property()
  qrPosition: QrPosition = 'top-right';

  @dispatch('task-toggle', { bubbles: true, composed: true })
  private emitTaskToggle(detail?: TaskToggleDetail): TaskToggleDetail {
    return detail!;
  }

  @dispatch('status-change', { bubbles: true, composed: true })
  private emitStatusChange(detail?: StatusChangeDetail): StatusChangeDetail {
    return detail!;
  }

  @dispatch('wo-sign', { bubbles: true, composed: true })
  private emitWoSign(detail?: WorkOrderSignDetail): WorkOrderSignDetail {
    return detail!;
  }

  @watch('status')
  handleStatusChange(oldVal: WorkOrderStatus, newVal: WorkOrderStatus) {
    if (oldVal && oldVal !== newVal) {
      this.emitStatusChange({ previousStatus: oldVal, status: newVal });
    }
  }

  @watch('tasks')
  handleTasksChange() {
    // Re-render on tasks change
  }

  @watch('parts')
  handlePartsChange() {
    // Re-render on parts change
  }

  private handleTaskToggle(index: number) {
    const task = this.tasks[index];
    if (!task) return;

    const updatedTasks = [...this.tasks];
    updatedTasks[index] = { ...task, completed: !task.completed };
    this.tasks = updatedTasks;

    this.emitTaskToggle({
      index,
      task: updatedTasks[index],
      completed: updatedTasks[index].completed!
    });
  }

  private handleSign() {
    this.emitWoSign({
      woNumber: this.woNumber,
      timestamp: new Date().toISOString()
    });
  }

  getTotalPartsCost(): number {
    return this.parts.reduce((sum, part) => sum + (part.quantity * part.unitCost), 0);
  }

  getTotalLaborHours(): number {
    return this.tasks.reduce((sum, task) => sum + (task.hours || 0), 0);
  }

  getTotalLaborCost(): number {
    return this.getTotalLaborHours() * this.laborRate;
  }

  getTotalCost(): number {
    return this.getTotalPartsCost() + this.getTotalLaborCost();
  }

  private formatCurrency(amount: number): string {
    return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  }

  print() {
    window.print();
  }

  toJSON(): WorkOrderJSON {
    return {
      woNumber: this.woNumber,
      date: this.date,
      dueDate: this.dueDate,
      priority: this.priority,
      status: this.status,
      customer: this.customer,
      description: this.description,
      tasks: [...this.tasks],
      parts: [...this.parts],
      asset: this.asset,
      laborRate: this.laborRate,
      notes: this.notes,
      variant: this.variant,
      totalPartsCost: this.getTotalPartsCost(),
      totalLaborHours: this.getTotalLaborHours(),
      totalLaborCost: this.getTotalLaborCost(),
      totalCost: this.getTotalCost()
    };
  }

  private renderCheckSvg(): unknown {
    return html/*html*/`
      <svg viewBox="0 0 12 12" fill="currentColor">
        <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  private renderQr(position: QrPosition): unknown {
    if (!this.showQr) return '';
    if (this.qrPosition !== position) return '';

    return html/*html*/`
      <div class="wo__qr wo__qr--${position}" part="qr-container">
        <slot name="qr"></slot>
      </div>
    `;
  }

  private renderHeader(): unknown {
    const hasQrTopRight = this.showQr && this.qrPosition === 'top-right';
    const hasQrHeader = this.showQr && this.qrPosition === 'header';

    return html/*html*/`
      <div class="wo__header" part="header">
        <div class="wo__header-left">
          <span class="wo__title" part="title">Work Order</span>
          <h2 class="wo__number" part="wo-number">${this.woNumber || '---'}</h2>
          <div class="wo__dates">
            <if ${this.date}>
              <div class="wo__date-item">
                <span class="wo__date-label">Date</span>
                <span class="wo__date-value" part="date">${this.date}</span>
              </div>
            </if>
            <if ${this.dueDate}>
              <div class="wo__date-item">
                <span class="wo__date-label">Due</span>
                <span class="wo__date-value" part="due-date">${this.dueDate}</span>
              </div>
            </if>
          </div>
        </div>
        <div class="wo__header-right">
          <span class="wo__badge wo__priority--${this.priority}" part="priority">${this.priority}</span>
          <span class="wo__badge wo__status--${this.status}" part="status">${this.status.replace('-', ' ')}</span>
        </div>
        <if ${hasQrTopRight}>
          ${this.renderQr('top-right')}
        </if>
        <if ${hasQrHeader}>
          ${this.renderQr('header')}
        </if>
      </div>
    `;
  }

  private renderCustomer(): unknown {
    if (!this.customer) return '';

    return html/*html*/`
      <div class="wo__section" part="customer">
        <h3 class="wo__section-title">Customer</h3>
        <div class="wo__customer">
          <div class="wo__customer-field">
            <span class="wo__customer-label">Name</span>
            <span class="wo__customer-value" part="customer-name">${this.customer.name}</span>
          </div>
          <if ${this.customer.address}>
            <div class="wo__customer-field">
              <span class="wo__customer-label">Address</span>
              <span class="wo__customer-value" part="customer-address">${this.customer.address}</span>
            </div>
          </if>
          <if ${this.customer.phone}>
            <div class="wo__customer-field">
              <span class="wo__customer-label">Phone</span>
              <span class="wo__customer-value" part="customer-contact">${this.customer.phone}</span>
            </div>
          </if>
          <if ${this.customer.email}>
            <div class="wo__customer-field">
              <span class="wo__customer-label">Email</span>
              <span class="wo__customer-value">${this.customer.email}</span>
            </div>
          </if>
        </div>
      </div>
    `;
  }

  private renderAsset(): unknown {
    if (!this.asset) return '';

    return html/*html*/`
      <div class="wo__section" part="asset">
        <h3 class="wo__section-title">Equipment / Asset</h3>
        <div class="wo__asset">
          <div class="wo__asset-field">
            <span class="wo__asset-label">Asset ID</span>
            <span class="wo__asset-value" part="asset-id">${this.asset.id}</span>
          </div>
          <div class="wo__asset-field">
            <span class="wo__asset-label">Name</span>
            <span class="wo__asset-value" part="asset-name">${this.asset.name}</span>
          </div>
          <if ${this.asset.location}>
            <div class="wo__asset-field">
              <span class="wo__asset-label">Location</span>
              <span class="wo__asset-value">${this.asset.location}</span>
            </div>
          </if>
          <if ${this.asset.serial}>
            <div class="wo__asset-field">
              <span class="wo__asset-label">Serial #</span>
              <span class="wo__asset-value">${this.asset.serial}</span>
            </div>
          </if>
          <if ${this.asset.lastService}>
            <div class="wo__asset-field">
              <span class="wo__asset-label">Last Service</span>
              <span class="wo__asset-value">${this.asset.lastService}</span>
            </div>
          </if>
        </div>
      </div>
    `;
  }

  private renderDescription(): unknown {
    if (!this.description) return '';

    return html/*html*/`
      <div class="wo__section" part="description">
        <h3 class="wo__section-title" part="description-label">Scope of Work</h3>
        <p class="wo__description" part="description-content">${this.description}</p>
      </div>
    `;
  }

  private renderTasks(): unknown {
    if (this.tasks.length === 0) return '';

    return html/*html*/`
      <div class="wo__section" part="tasks">
        <h3 class="wo__section-title">Tasks</h3>
        <ul class="wo__tasks">
          ${this.tasks.map((task, index) => {
            const isCompleted = task.completed === true;
            const hasHours = task.hours !== undefined && task.hours !== null;
            return html/*html*/`
              <li class="wo__task ${isCompleted ? 'wo__task--completed' : ''}" part="task">
                <button
                  class="wo__task-checkbox ${isCompleted ? 'wo__task-checkbox--checked' : ''}"
                  @click=${() => this.handleTaskToggle(index)}
                  aria-label="${isCompleted ? 'Mark incomplete' : 'Mark complete'}"
                  part="task-checkbox">
                  ${this.renderCheckSvg()}
                </button>
                <div class="wo__task-content">
                  <span class="wo__task-description" part="task-description">${task.description}</span>
                  <div class="wo__task-meta">
                    <if ${task.assignee}>
                      <span class="wo__task-assignee" part="task-assignee">${task.assignee}</span>
                    </if>
                    <if ${hasHours}>
                      <span class="wo__task-hours">${task.hours}h</span>
                    </if>
                  </div>
                </div>
              </li>
            `;
          })}
        </ul>
      </div>
    `;
  }

  private renderParts(): unknown {
    if (this.parts.length === 0) return '';

    const totalPartsCost = this.getTotalPartsCost();

    return html/*html*/`
      <div class="wo__section" part="parts">
        <h3 class="wo__section-title">Parts & Materials</h3>
        <table class="wo__parts-table" part="parts-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Part #</th>
              <th>Qty</th>
              <th>Unit Cost</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${this.parts.map(part => html/*html*/`
              <tr part="parts-row">
                <td part="part-name">${part.name}</td>
                <td part="part-number">${part.partNumber || '---'}</td>
                <td part="part-qty">${part.quantity}</td>
                <td part="part-cost">${this.formatCurrency(part.unitCost)}</td>
                <td>${this.formatCurrency(part.quantity * part.unitCost)}</td>
              </tr>
            `)}
          </tbody>
        </table>
        <div class="wo__parts-total" part="parts-total">
          <span>Parts Total:</span>
          <span>${this.formatCurrency(totalPartsCost)}</span>
        </div>
      </div>
    `;
  }

  private renderLabor(): unknown {
    const totalHours = this.getTotalLaborHours();
    const hasTimeData = totalHours > 0 || this.laborRate > 0;

    if (!hasTimeData) return '';

    const laborRateGtZero = this.laborRate > 0;

    return html/*html*/`
      <div class="wo__section" part="labor">
        <h3 class="wo__section-title">Labor</h3>
        <div class="wo__labor">
          <div class="wo__labor-field">
            <span class="wo__labor-label">Total Hours</span>
            <span class="wo__labor-value" part="labor-hours">${totalHours}h</span>
          </div>
          <if ${laborRateGtZero}>
            <div class="wo__labor-field">
              <span class="wo__labor-label">Rate</span>
              <span class="wo__labor-value" part="labor-rate">${this.formatCurrency(this.laborRate)}/hr</span>
            </div>
            <div class="wo__labor-field">
              <span class="wo__labor-label">Labor Cost</span>
              <span class="wo__labor-value" part="labor-total">${this.formatCurrency(this.getTotalLaborCost())}</span>
            </div>
          </if>
        </div>
      </div>
    `;
  }

  private renderNotes(): unknown {
    if (!this.notes) return '';

    return html/*html*/`
      <div class="wo__section" part="notes">
        <h3 class="wo__section-title" part="notes-label">Notes</h3>
        <p class="wo__notes" part="notes-content">${this.notes}</p>
      </div>
    `;
  }

  private renderSignature(): unknown {
    return html/*html*/`
      <div class="wo__section wo__signature" part="signature">
        <h3 class="wo__section-title">Sign-Off</h3>
        <slot name="signature"></slot>
        <div class="wo__signature-lines">
          <div class="wo__signature-field">
            <div class="wo__signature-line" part="signature-line"></div>
            <span class="wo__signature-label">Signature</span>
          </div>
          <div class="wo__signature-field">
            <div class="wo__signature-line" part="signature-date"></div>
            <span class="wo__signature-label">Date</span>
          </div>
        </div>
        <button class="wo__sign-btn" @click=${() => this.handleSign()} part="sign-button">
          Sign Work Order
        </button>
      </div>
    `;
  }

  private renderCosts(): unknown {
    const hasParts = this.parts.length > 0;
    const hasLabor = this.getTotalLaborHours() > 0 && this.laborRate > 0;
    const hasCosts = hasParts || hasLabor;

    if (!hasCosts) return '';

    return html/*html*/`
      <div class="wo__costs" part="costs">
        <div class="wo__costs-table">
          <if ${hasParts}>
            <div class="wo__cost-row">
              <span>Parts</span>
              <span part="parts-total">${this.formatCurrency(this.getTotalPartsCost())}</span>
            </div>
          </if>
          <if ${hasLabor}>
            <div class="wo__cost-row">
              <span>Labor (${this.getTotalLaborHours()}h)</span>
              <span part="labor-total">${this.formatCurrency(this.getTotalLaborCost())}</span>
            </div>
          </if>
          <div class="wo__cost-row wo__cost-row--grand">
            <span>Total</span>
            <span part="grand-total">${this.formatCurrency(this.getTotalCost())}</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderFooter(): unknown {
    const hasQrFooter = this.showQr && this.qrPosition === 'footer';

    return html/*html*/`
      <div class="wo__footer" part="footer">
        <slot name="footer"></slot>
        <if ${hasQrFooter}>
          ${this.renderQr('footer')}
        </if>
      </div>
    `;
  }

  @render()
  renderContent() {
    return html/*html*/`
      <div class="wo" part="base">
        ${this.renderHeader()}
        ${this.renderCustomer()}
        ${this.renderAsset()}
        ${this.renderDescription()}
        ${this.renderTasks()}
        ${this.renderParts()}
        ${this.renderLabor()}
        ${this.renderNotes()}
        ${this.renderSignature()}
        ${this.renderCosts()}
        ${this.renderFooter()}
        <slot></slot>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
