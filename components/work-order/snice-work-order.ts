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
  WorkOrderJSON,
  TaskToggleDetail,
  StatusChangeDetail,
  WorkOrderSignDetail
} from './snice-work-order.types';

@element('snice-work-order')
export class SniceWorkOrder extends HTMLElement implements SniceWorkOrderElement {
  @property()
  woNumber = '';

  @property()
  date = '';

  @property()
  priority: WorkOrderPriority = 'medium';

  @property()
  status: WorkOrderStatus = 'open';

  @property({ type: Object })
  customer: WorkOrderCustomer | null = null;

  @property()
  description = '';

  @property({ type: Array })
  tasks: WorkOrderTask[] = [];

  @property({ type: Array })
  parts: WorkOrderPart[] = [];

  @property({ type: Number })
  laborRate = 0;

  @property()
  notes = '';

  @property()
  variant: WorkOrderVariant = 'standard';

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

  private getTotalPartsCost(): number {
    return this.parts.reduce((sum, part) => sum + (part.quantity * part.unitCost), 0);
  }

  private getTotalLaborHours(): number {
    return this.tasks.reduce((sum, task) => sum + (task.hours || 0), 0);
  }

  private getTotalLaborCost(): number {
    return this.getTotalLaborHours() * this.laborRate;
  }

  private getTotalCost(): number {
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
      priority: this.priority,
      status: this.status,
      customer: this.customer,
      description: this.description,
      tasks: [...this.tasks],
      parts: [...this.parts],
      laborRate: this.laborRate,
      notes: this.notes,
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

  private renderHeader(): unknown {
    return html/*html*/`
      <div class="wo__header" part="header">
        <div class="wo__header-left">
          <h2 class="wo__number" part="wo-number">WO# ${this.woNumber || '---'}</h2>
          <if ${this.date}>
            <span class="wo__date" part="date">${this.date}</span>
          </if>
        </div>
        <div class="wo__header-right">
          <span class="wo__badge wo__priority--${this.priority}" part="priority">${this.priority}</span>
          <span class="wo__badge wo__status--${this.status}" part="status">${this.status.replace('-', ' ')}</span>
        </div>
      </div>
    `;
  }

  private renderCustomer(): unknown {
    if (!this.customer) return '';

    return html/*html*/`
      <div class="wo__section" part="customer-section">
        <h3 class="wo__section-title">Customer</h3>
        <div class="wo__customer" part="customer">
          <div class="wo__customer-field">
            <span class="wo__customer-label">Name</span>
            <span class="wo__customer-value">${this.customer.name}</span>
          </div>
          <if ${this.customer.address}>
            <div class="wo__customer-field">
              <span class="wo__customer-label">Address</span>
              <span class="wo__customer-value">${this.customer.address}</span>
            </div>
          </if>
          <if ${this.customer.phone}>
            <div class="wo__customer-field">
              <span class="wo__customer-label">Phone</span>
              <span class="wo__customer-value">${this.customer.phone}</span>
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

  private renderDescription(): unknown {
    if (!this.description) return '';

    return html/*html*/`
      <div class="wo__section" part="description-section">
        <h3 class="wo__section-title">Scope of Work</h3>
        <p class="wo__description" part="description">${this.description}</p>
      </div>
    `;
  }

  private renderTasks(): unknown {
    if (this.tasks.length === 0) return '';

    return html/*html*/`
      <div class="wo__section" part="tasks-section">
        <h3 class="wo__section-title">Tasks</h3>
        <ul class="wo__tasks">
          ${this.tasks.map((task, index) => {
            const isCompleted = task.completed === true;
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
                  <span class="wo__task-description">${task.description}</span>
                  <div class="wo__task-meta">
                    <if ${task.assignee}>
                      <span>${task.assignee}</span>
                    </if>
                    <if ${task.hours !== undefined && task.hours !== null}>
                      <span>${task.hours}h</span>
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
      <div class="wo__section" part="parts-section">
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
              <tr>
                <td>${part.name}</td>
                <td>${part.partNumber || '---'}</td>
                <td>${part.quantity}</td>
                <td>${this.formatCurrency(part.unitCost)}</td>
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

  private renderTimeTracking(): unknown {
    const totalHours = this.getTotalLaborHours();
    const hasTimeData = totalHours > 0 || this.laborRate > 0;

    if (!hasTimeData) return '';

    return html/*html*/`
      <div class="wo__section" part="time-section">
        <h3 class="wo__section-title">Time Tracking</h3>
        <div class="wo__time" part="time">
          <div class="wo__time-field">
            <span class="wo__time-label">Total Hours</span>
            <span class="wo__time-value">${totalHours}h</span>
          </div>
          <if ${this.laborRate > 0}>
            <div class="wo__time-field">
              <span class="wo__time-label">Labor Rate</span>
              <span class="wo__time-value">${this.formatCurrency(this.laborRate)}/hr</span>
            </div>
            <div class="wo__time-field">
              <span class="wo__time-label">Labor Cost</span>
              <span class="wo__time-value">${this.formatCurrency(this.getTotalLaborCost())}</span>
            </div>
          </if>
        </div>
      </div>
    `;
  }

  private renderNotes(): unknown {
    if (!this.notes) return '';

    return html/*html*/`
      <div class="wo__section" part="notes-section">
        <h3 class="wo__section-title">Notes</h3>
        <p class="wo__notes" part="notes">${this.notes}</p>
      </div>
    `;
  }

  private renderSignature(): unknown {
    return html/*html*/`
      <div class="wo__section wo__signature" part="signature-section">
        <h3 class="wo__section-title">Sign-Off</h3>
        <slot name="signature"></slot>
        <button class="wo__sign-btn" @click=${() => this.handleSign()} part="sign-button">
          Sign Work Order
        </button>
      </div>
    `;
  }

  private renderFooter(): unknown {
    const hasCosts = this.parts.length > 0 || (this.getTotalLaborHours() > 0 && this.laborRate > 0);

    if (!hasCosts) return '';

    return html/*html*/`
      <div class="wo__footer" part="footer">
        <div class="wo__totals" part="totals">
          <if ${this.parts.length > 0}>
            <div class="wo__total-row">
              <span>Parts</span>
              <span>${this.formatCurrency(this.getTotalPartsCost())}</span>
            </div>
          </if>
          <if ${this.getTotalLaborHours() > 0 && this.laborRate > 0}>
            <div class="wo__total-row">
              <span>Labor (${this.getTotalLaborHours()}h)</span>
              <span>${this.formatCurrency(this.getTotalLaborCost())}</span>
            </div>
          </if>
          <div class="wo__total-row wo__total-row--grand">
            <span>Total</span>
            <span>${this.formatCurrency(this.getTotalCost())}</span>
          </div>
        </div>
      </div>
    `;
  }

  @render()
  renderContent() {
    return html/*html*/`
      <div class="wo" part="base">
        ${this.renderHeader()}
        ${this.renderCustomer()}
        ${this.renderDescription()}
        ${this.renderTasks()}
        ${this.renderParts()}
        ${this.renderTimeTracking()}
        ${this.renderNotes()}
        ${this.renderSignature()}
        ${this.renderFooter()}
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
