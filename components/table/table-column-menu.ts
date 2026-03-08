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
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const actions: ColumnMenuAction[] = [];

    if (options?.sortable !== false) {
      actions.push({ label: 'Sort Ascending', icon: '\u2191', action: 'sort-asc' });
      actions.push({ label: 'Sort Descending', icon: '\u2193', action: 'sort-desc' });
      actions.push({ label: '', action: '', separator: true });
    }

    if (options?.filterable !== false) {
      actions.push({ label: 'Filter...', icon: '\u2AE7', action: 'filter' });
    }

    if (options?.hideable !== false) {
      actions.push({ label: 'Hide Column', icon: '\uD83D\uDC41', action: 'hide' });
    }

    if (options?.pinnable !== false) {
      if (options?.pinned) {
        actions.push({ label: 'Unpin', icon: '\uD83D\uDCCC', action: 'unpin' });
      } else {
        actions.push({ label: 'Pin Left', icon: '\u21E4', action: 'pin-left' });
        actions.push({ label: 'Pin Right', icon: '\u21E5', action: 'pin-right' });
      }
    }

    actions.push({ label: '', action: '', separator: true });
    actions.push({ label: 'Auto-size', icon: '\u2194', action: 'autosize' });

    for (const action of actions) {
      if (action.separator) {
        const sep = document.createElement('div');
        sep.className = 'column-menu-separator';
        menu.appendChild(sep);
        continue;
      }

      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'column-menu-item';
      item.innerHTML = `${action.icon ? `<span class="column-menu-icon">${action.icon}</span>` : ''}<span>${action.label}</span>`;
      item.addEventListener('click', () => {
        this.handleAction(action.action);
        this.hide();
      });

      if (action.disabled) {
        item.disabled = true;
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
        const path = e.composedPath();
        if (!path.includes(menu)) this.hide();
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
