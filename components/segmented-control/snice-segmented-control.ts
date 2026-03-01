import { element, property, query, queryAll, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-segmented-control.css?inline';
import type { SegmentedControlSize, SegmentedControlOption, SniceSegmentedControlElement } from './snice-segmented-control.types';

@element('snice-segmented-control')
export class SniceSegmentedControl extends HTMLElement implements SniceSegmentedControlElement {
  @property()
  value = '';

  @property({ type: Array, attribute: false })
  options: SegmentedControlOption[] = [];

  @property()
  size: SegmentedControlSize = 'medium';

  @property({ type: Boolean })
  disabled = false;

  @query('.segmented-control__indicator')
  indicator?: HTMLElement;

  @query('.segmented-control')
  container?: HTMLElement;

  @queryAll('.segmented-control__segment')
  segments?: HTMLElement[];

  @render()
  render() {
    return html/*html*/`
      <div class="segmented-control segmented-control--${this.size}"
           role="radiogroup"
           part="base">
        <div class="segmented-control__indicator" part="indicator"></div>
        ${this.options.map((opt, index) => {
          const isSelected = opt.value === this.value;
          const classes = [
            'segmented-control__segment',
            isSelected ? 'segmented-control__segment--selected' : '',
            opt.disabled ? 'segmented-control__segment--disabled' : ''
          ].filter(Boolean).join(' ');

          return html/*html*/`
            <button
              type="button"
              class="${classes}"
              role="radio"
              aria-checked="${isSelected}"
              aria-disabled="${opt.disabled || false}"
              ?disabled="${opt.disabled || this.disabled}"
              data-value="${opt.value}"
              data-index="${index}"
              part="segment"
              @click="${() => this.handleSegmentClick(opt)}">
              <if ${opt.icon}>
                <img class="segmented-control__icon" src="${opt.icon || ''}" alt="" />
              </if>
              <span class="segmented-control__label">${opt.label}</span>
            </button>
          `;
        })}
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    // If no value set, select first non-disabled option
    if (!this.value && this.options.length > 0) {
      const firstEnabled = this.options.find(opt => !opt.disabled);
      if (firstEnabled) {
        this.value = firstEnabled.value;
      }
    }

    requestAnimationFrame(() => {
      this.updateIndicator();
    });
  }

  private handleSegmentClick(option: SegmentedControlOption) {
    if (option.disabled || this.disabled) return;
    if (option.value === this.value) return;

    const previousValue = this.value;
    this.value = option.value;
    this.dispatchValueChangeEvent(previousValue, option);
  }

  @watch('value')
  handleValueChange() {
    requestAnimationFrame(() => {
      this.updateIndicator();
    });
  }

  @watch('options')
  handleOptionsChange() {
    // If no value set, select first non-disabled option
    if (!this.value && this.options.length > 0) {
      const firstEnabled = this.options.find(opt => !opt.disabled);
      if (firstEnabled) {
        this.value = firstEnabled.value;
      }
    }
    requestAnimationFrame(() => {
      this.updateIndicator();
    });
  }

  private updateIndicator() {
    if (!this.indicator || !this.segments || this.segments.length === 0) return;

    const selectedIndex = this.options.findIndex(opt => opt.value === this.value);
    if (selectedIndex < 0) {
      this.indicator.style.opacity = '0';
      return;
    }

    const selectedSegment = this.segments[selectedIndex];
    if (!selectedSegment) return;

    this.indicator.style.opacity = '1';
    this.indicator.style.width = `${selectedSegment.offsetWidth}px`;
    this.indicator.style.transform = `translateX(${selectedSegment.offsetLeft - 3}px)`;
  }

  @dispatch('value-change', { bubbles: true, composed: true })
  private dispatchValueChangeEvent(previousValue: string, option: SegmentedControlOption) {
    return {
      value: this.value,
      previousValue,
      option,
      control: this
    };
  }
}
