import { element, property, render, styles, html, css } from 'snice';
import type { SniceActivityItemElement } from './snice-activity-feed.types';

/**
 * Declarative data carrier for snice-activity-feed. Never rendered directly —
 * the parent feed reads its attributes and renders the entry itself, the same
 * way snice-table consumes snice-column definitions.
 */
@element('snice-activity-item')
export class SniceActivityItem extends HTMLElement implements SniceActivityItemElement {
  @property({ attribute: 'item-id' }) itemId = '';
  @property({ attribute: 'actor-name' }) actorName = '';
  @property({ attribute: 'actor-avatar' }) actorAvatar = '';
  @property() action = '';
  @property() target = '';
  @property() timestamp = '';
  @property() icon = '';
  @property() type = '';

  @render()
  renderContent() {
    return html``;
  }

  @styles()
  componentStyles() {
    return css`:host { display: none; }`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-activity-item': SniceActivityItem;
  }
}
