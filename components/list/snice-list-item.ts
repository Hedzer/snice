import { element, property, render, styles, html, css } from 'snice';
import cssContent from './snice-list-item.css?inline';

@element('snice-list-item')
export class SniceListItem extends HTMLElement {
  @property()
  heading = '';

  @property()
  description = '';

  @property({ type: Boolean })
  selected = false;

  @property({ type: Boolean })
  disabled = false;

  @render()
  render() {
    const classes = ['list-item'];
    if (this.selected) classes.push('list-item--selected');
    if (this.disabled) classes.push('list-item--disabled');

    return html/*html*/`
      <div class="${classes.join(' ')}">
        <slot name="before"></slot>
        <div class="list-item__content">
          <if ${this.heading}>
            <div class="list-item__heading">${this.heading}</div>
            <if ${this.description}>
              <div class="list-item__description">${this.description}</div>
            </if>
          </if>
          <slot></slot>
        </div>
        <slot name="after"></slot>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }
}
