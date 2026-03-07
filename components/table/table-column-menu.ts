/**
 * Column menu for snice-table.
 * Right-click or menu icon on header — sort, filter, hide, pin, autosize.
 */

export interface ColumnMenuAction {
  label: string;
  icon?: string;
  action: string;
  disabled?: boolean;
  separator?: boolean;
}

export class TableColumnMenu {
  private menuEl: HTMLElement | null = null;
  private activeColumn: string | null = null;
  private tableElement: HTMLElement | null = null;
  private outsideClickHandler: ((e: MouseEvent) => void) | null = null;

  // Callbacks
  onSortAsc: ((column: string) => void) | null = null;
  onSortDesc: ((column: string) => void) | null = null;
  onFilter: ((column: string) => void) | null = null;
  onHide: ((column: string) => void) | null = null;
  onPinLeft: ((column: string) => void) | null = null;
  onPinRight: ((column: string) => void) | null = null;
  onUnpin: ((column: string) => void) | null = null;
  onAutoSize: ((column: string) => void) | null = null;

  attach(tableEl: HTMLElement) {
    this.tableElement = tableEl;
  }

  /** Show column menu at the given position */
  show(columnKey: string, x: number, y: number, options?: {
    sortable?: boolean;
    filterable?: boolean;
    hideable?: boolean;
    pinnable?: boolean;
    pinned?: 'left' | 'right' | false;
  }) {
    this.hide(); // Close any existing menu
    this.activeColumn = columnKey;

    const menu = document.createElement('div');
    menu.className = 'table-column-menu';
    menu.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      z-index: 10001;
      min-width: 10rem;
      background: var(--snice-color-background-element, rgb(252 251 249));
      border: 1px solid var(--snice-color-border, rgb(226 226 226));
      border-radius: var(--snice-border-radius-md, 0.25rem);
      box-shadow: var(--snice-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
      padding: 4px;
      animation: columnMenuIn 0.15s ease;
    `;

    const actions: ColumnMenuAction[] = [];

    if (options?.sortable !== false) {
      actions.push({ label: 'Sort Ascending', icon: '↑', action: 'sort-asc' });
      actions.push({ label: 'Sort Descending', icon: '↓', action: 'sort-desc' });
      actions.push({ label: '', action: '', separator: true });
    }

    if (options?.filterable !== false) {
      actions.push({ label: 'Filter...', icon: '⫧', action: 'filter' });
    }

    if (options?.hideable !== false) {
      actions.push({ label: 'Hide Column', icon: '👁', action: 'hide' });
    }

    if (options?.pinnable !== false) {
      if (options?.pinned) {
        actions.push({ label: 'Unpin', icon: '📌', action: 'unpin' });
      } else {
        actions.push({ label: 'Pin Left', icon: '⇤', action: 'pin-left' });
        actions.push({ label: 'Pin Right', icon: '⇥', action: 'pin-right' });
      }
    }

    actions.push({ label: '', action: '', separator: true });
    actions.push({ label: 'Auto-size', icon: '↔', action: 'autosize' });

    for (const action of actions) {
      if (action.separator) {
        const sep = document.createElement('div');
        sep.style.cssText = 'height: 1px; background: var(--snice-color-border, rgb(226 226 226)); margin: 4px 0;';
        menu.appendChild(sep);
        continue;
      }

      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'column-menu-item';
      item.innerHTML = `${action.icon ? `<span style="width:1.25rem;text-align:center;display:inline-block">${action.icon}</span>` : ''}<span>${action.label}</span>`;
      item.style.cssText = `
        display: flex; align-items: center; gap: 0.5rem; width: 100%;
        padding: 0.375rem 0.625rem; border: none; border-radius: 3px;
        background: transparent; color: var(--snice-color-text, rgb(23 23 23));
        font-size: var(--snice-font-size-sm, 0.875rem); font-family: inherit;
        cursor: pointer; text-align: left; white-space: nowrap;
      `;
      item.addEventListener('mouseenter', () => { item.style.background = 'var(--snice-color-background-secondary, rgb(245 245 245))'; });
      item.addEventListener('mouseleave', () => { item.style.background = 'transparent'; });
      item.addEventListener('click', () => {
        this.handleAction(action.action);
        this.hide();
      });

      if (action.disabled) {
        item.disabled = true;
        item.style.opacity = '0.5';
        item.style.cursor = 'not-allowed';
      }

      menu.appendChild(item);
    }

    // Add to shadow root or document
    const shadowRoot = this.tableElement?.shadowRoot;
    if (shadowRoot) {
      shadowRoot.appendChild(menu);
    } else {
      document.body.appendChild(menu);
    }
    this.menuEl = menu;

    // Close on outside click (delay to avoid immediate close)
    setTimeout(() => {
      this.outsideClickHandler = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node)) this.hide();
      };
      document.addEventListener('click', this.outsideClickHandler, { capture: true });
    }, 0);

    // Close on Escape
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.hide();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  private handleAction(action: string) {
    if (!this.activeColumn) return;
    switch (action) {
      case 'sort-asc': this.onSortAsc?.(this.activeColumn); break;
      case 'sort-desc': this.onSortDesc?.(this.activeColumn); break;
      case 'filter': this.onFilter?.(this.activeColumn); break;
      case 'hide': this.onHide?.(this.activeColumn); break;
      case 'pin-left': this.onPinLeft?.(this.activeColumn); break;
      case 'pin-right': this.onPinRight?.(this.activeColumn); break;
      case 'unpin': this.onUnpin?.(this.activeColumn); break;
      case 'autosize': this.onAutoSize?.(this.activeColumn); break;
    }
  }

  /** Hide the column menu */
  hide() {
    if (this.menuEl) {
      this.menuEl.remove();
      this.menuEl = null;
    }
    if (this.outsideClickHandler) {
      document.removeEventListener('click', this.outsideClickHandler, { capture: true } as EventListenerOptions);
      this.outsideClickHandler = null;
    }
    this.activeColumn = null;
  }

  isOpen(): boolean {
    return this.menuEl !== null;
  }
}
