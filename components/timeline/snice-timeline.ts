import { element, property, render, styles, html, css } from 'snice';
import cssContent from './snice-timeline.css?inline';
import type { TimelineOrientation, TimelinePosition, TimelineItem, SniceTimelineElement } from './snice-timeline.types';

@element('snice-timeline')
export class SniceTimeline extends HTMLElement implements SniceTimelineElement {
  @property({  })
  orientation: TimelineOrientation = 'vertical';

  @property({  })
  position: TimelinePosition = 'left';

  @property({ type: Array })
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
    const icon = item.icon || this.getDefaultIcon(variant);

    const itemClasses = [
      'timeline-item',
      `timeline-item--${variant}`
    ].join(' ');

    return html/*html*/`
      <div class="${itemClasses}" part="item">
        <div class="timeline-item__marker" part="marker">
          <span class="timeline-item__icon" part="icon">${icon}</span>
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

  private getDefaultIcon(variant: string): string {
    const icons: Record<string, string> = {
      default: '●',
      success: '✓',
      warning: '⚠',
      error: '✕',
      info: 'ⓘ'
    };
    return icons[variant] || icons.default;
  }
}
