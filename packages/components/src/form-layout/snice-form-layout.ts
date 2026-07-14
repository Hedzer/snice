import { element, property, watch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-form-layout.css?inline';
import type { FormLayoutLabelPosition, FormLayoutGap, FormLayoutVariant, SniceFormLayoutElement } from './snice-form-layout.types';

@element('snice-form-layout')
export class SniceFormLayout extends HTMLElement implements SniceFormLayoutElement {
  @property({ type: Number })
  columns = 1;

  @property({ attribute: 'label-position' })
  labelPosition: FormLayoutLabelPosition = 'top';

  @property({ attribute: 'label-width' })
  labelWidth = '8rem';

  @property()
  gap: FormLayoutGap = 'medium';

  @property()
  variant: FormLayoutVariant = 'default';

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @render()
  renderContent() {
    const classes = [
      'form-layout',
      `form-layout--gap-${this.gap}`,
      `form-layout--${this.variant}`,
      `form-layout--labels-${this.labelPosition}`,
    ].join(' ');

    return html/*html*/`
      <div class="${classes}" part="base"
        style="--form-columns: ${this.columns}; --form-label-width: ${this.labelWidth};">
        <slot></slot>
      </div>
    `;
  }

  @ready()
  init() {
    this.applyColumnStyles();
  }

  @watch('columns')
  handleColumnsChange() {
    this.applyColumnStyles();
  }

  @watch('label-width')
  handleLabelWidthChange() {
    this.applyColumnStyles();
  }

  private applyColumnStyles() {
    const base = this.shadowRoot?.querySelector('.form-layout') as HTMLElement;
    if (base) {
      base.style.setProperty('--form-columns', String(this.columns));
      base.style.setProperty('--form-label-width', this.labelWidth);
    }
  }
}
