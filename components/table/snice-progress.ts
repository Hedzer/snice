import { element, property } from '../../src/index';

@element('snice-progress')
export class SniceProgress extends HTMLElement {
  @property({ type: Number })
  value = 0;
  
  @property({ type: Number })
  max = 100;
  
  @property()
  color = '#3b82f6';
  
  @property()
  backgroundColor = '#e5e7eb';
  
  @property()
  height = '0.5rem'; /* 8px */
  
  @property({ type: Boolean })
  showPercentage = false;

  html() {
    const percentage = Math.min(100, (this.value / this.max) * 100);
    
    return `
      <div class="progress-container">
        <div class="progress-bar" style="width: ${percentage}%"></div>
      </div>
      ${this.showPercentage ? `
        <span class="percentage">${percentage.toFixed(0)}%</span>
      ` : ''}
    `;
  }

  css() {
    return `
      :host {
        display: inline-flex;
        align-items: center;
        width: 100%;
        gap: 0.5rem; /* 8px */
      }
      
      .progress-container {
        flex: 1;
        height: ${this.height};
        background: ${this.backgroundColor};
        border-radius: 0.25rem; /* 4px */
        overflow: hidden;
      }
      
      .progress-bar {
        height: 100%;
        background: ${this.color};
        transition: width 0.3s ease;
      }
      
      .percentage {
        font-size: 0.875rem; /* 14px */
        color: #6b7280;
        min-width: 2.1875rem; /* 35px */
      }
    `;
  }
}