import { element, property } from '../../src/index';
import type { SniceCrumbElement } from './snice-breadcrumbs.types';

@element('snice-crumb')
export class SniceCrumb extends HTMLElement implements SniceCrumbElement {
  @property({ reflect: true })
  label = '';

  @property({ reflect: true })
  href = '';

  @property({ reflect: true })
  icon = '';

  @property({ attribute: 'icon-image', reflect: true })
  iconImage = '';

  @property({ type: Boolean, reflect: true })
  active = false;

  // No shadow DOM - this is a data element
  connectedCallback() {
    // Hide the element as it's only for data
    this.style.display = 'none';
  }
}