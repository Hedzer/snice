import { element, property, render, styles, html, css, unsafeHTML } from 'snice';
import { renderIcon } from '../utils';
import {
  CIRCLE_SOLID,
  CHECK_CIRCLE_SOLID,
  EXCLAMATION_TRIANGLE_SOLID,
  X_CIRCLE_SOLID,
  INFO_CIRCLE_SOLID,
} from '../icons';
import cssContent from './snice-timeline.css?inline';
import type { TimelineOrientation, TimelinePosition, TimelineItem, SniceTimelineElement } from './snice-timeline.types';

const DEFAULT_TIMELINE_ICONS: Record<string, string> = {
  default: CIRCLE_SOLID,
  success: CHECK_CIRCLE_SOLID,
  warning: EXCLAMATION_TRIANGLE_SOLID,
  error: X_CIRCLE_SOLID,
  info: INFO_CIRCLE_SOLID,
};

@element('snice-timeline')
export class SniceTimeline extends HTMLElement implements SniceTimelineElement {
  @property({  })
  orientation: TimelineOrientation = 'vertical';

  @property({  })
  position: TimelinePosition = 'left';

  @property({ type: Array, attribute: false })
  items: TimelineItem[] = [];

  @property({ type: Boolean })
  reverse = false;

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @render()
  render() {
    const timelineClasses = [
      'timeline',
      `timeline--${this.orientation}`,
      `timeline--${this.position}`,
      this.reverse ? 'timeline--reverse' : ''
    ].filter(Boolean).join(' ');

    const itemsToRender = this.reverse ? [...this.items].reverse() : this.items;

    return html/*html*/`
      <div class="${timelineClasses}" part="container">
        ${itemsToRender.map((item, index) => this.renderItem(item, index))}
      </div>
    `;
  }

  private renderItem(item: TimelineItem, index: number) {
    const variant = item.variant || 'default';

    const itemClasses = [
      'timeline-item',
      `timeline-item--${variant}`
    ].join(' ');

    // Priority: consumer-supplied `item.icon` (URL / emoji / text → renderIcon)
    // → default variant SVG from the central icons module.
    const consumerIcon = item.icon ? renderIcon(item.icon, 'timeline-item__icon-content') : null;
    const defaultSvg = DEFAULT_TIMELINE_ICONS[variant] || DEFAULT_TIMELINE_ICONS.default;

    return html/*html*/`
      <div class="${itemClasses}" part="item">
        <div class="timeline-item__marker" part="marker">
          <span class="timeline-item__icon" part="icon">
            <if ${consumerIcon}>${consumerIcon}</if>
            <if ${!consumerIcon}>${unsafeHTML(defaultSvg)}</if>
          </span>
        </div>
        <div class="timeline-item__content" part="content">
          <if ${item.timestamp}>
            <div class="timeline-item__timestamp" part="timestamp">${item.timestamp}</div>
          </if>
          <div class="timeline-item__title" part="title">${item.title}</div>
          <if ${item.description}>
            <div class="timeline-item__description" part="description">${item.description}</div>
          </if>
        </div>
      </div>
    `;
  }
}
