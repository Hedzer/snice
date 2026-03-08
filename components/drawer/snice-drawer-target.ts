import { element, property, watch, ready, dispose, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-drawer-target.css?inline';
import type { SniceDrawerTargetElement } from './snice-drawer.types';

@element('snice-drawer-target')
export class SniceDrawerTarget extends HTMLElement implements SniceDrawerTargetElement {
  @property({ attribute: 'for' })
  for = '';

  @property()
  push = '';

  private drawerEl: HTMLElement | null = null;
  private observer: MutationObserver | null = null;

  @render()
  renderContent() {
    return html`<slot></slot>`;
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }

  @ready()
  init() {
    this.connectDrawer();
  }

  @watch('for')
  handleForChange() {
    this.disconnectDrawer();
    this.connectDrawer();
  }

  @watch('push')
  handlePushChange() {
    if (this.push) {
      this.style.transform = `translateX(${this.push})`;
    } else {
      this.style.transform = '';
    }
    // overflow:hidden containers scroll when transforms change — reset it
    const parent = this.parentElement;
    if (parent) {
      parent.scrollLeft = 0;
      parent.scrollTop = 0;
    }
  }

  private connectDrawer() {
    if (!this.for) return;

    this.drawerEl = document.getElementById(this.for);
    if (!this.drawerEl) return;

    this.sync();

    this.observer = new MutationObserver(() => this.sync());
    this.observer.observe(this.drawerEl, { attributes: true, attributeFilter: ['open'] });
  }

  private disconnectDrawer() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.drawerEl = null;
    this.push = '';
  }

  private sync() {
    if (!this.drawerEl) return;

    const isOpen = this.drawerEl.hasAttribute('open');
    const hasPush = this.drawerEl.hasAttribute('push-content');

    if (!hasPush || !isOpen) {
      this.push = '';
      return;
    }

    // Measure the drawer panel directly
    const panel = this.drawerEl.shadowRoot?.querySelector('.drawer') as HTMLElement | null;
    if (!panel) return;

    const position = this.drawerEl.getAttribute('position') || 'left';
    if (position === 'top' || position === 'bottom') {
      this.push = panel.offsetHeight + 'px';
    } else {
      this.push = panel.offsetWidth + 'px';
    }
  }

  @dispose()
  cleanup() {
    this.disconnectDrawer();
  }
}
