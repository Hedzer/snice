import { element, property, watch, dispatch, ready } from 'snice';
import cssContent from './snice-tree-item.css?inline';
import type { TreeNode } from './snice-tree.types';
import type { SniceTreeItemElement, TreeItemToggleDetail, TreeItemSelectDetail, TreeItemCheckDetail } from './snice-tree-item.types';
import '../checkbox/snice-checkbox';
import '../spinner/snice-spinner';

@element('snice-tree-item')
export class SniceTreeItem extends HTMLElement implements SniceTreeItemElement {
  private _node: TreeNode = { id: '', label: '' };
  private _level = 0;

  @property({ type: Number })
  private _version = 0;

  @property({ type: Boolean })
  expanded = false;

  @property({ type: Boolean })
  selected = false;

  @property({ type: Boolean })
  checked = false;

  @property({ type: Boolean, attribute: 'show-checkbox' })
  showCheckbox = false;

  @property({ type: Boolean, attribute: 'show-icon' })
  showIcon = true;

  @property({ type: Boolean })
  loading = false;

  @property({ type: Boolean })
  indeterminate = false;

  get node(): TreeNode {
    return this._node;
  }

  get level(): number {
    return this._level;
  }

  get hasChildren(): boolean {
    return !!(this._node.children && this._node.children.length > 0) || !!this._node.lazy;
  }

  setNode(node: TreeNode, level: number) {
    this._node = node;
    this._level = level;

    // Sync internal state
    if (node.expanded !== undefined) {
      this.expanded = node.expanded;
    }
    if (node.selected !== undefined) {
      this.selected = node.selected;
    }
    if (node.checked !== undefined) {
      this.checked = node.checked;
    }
    if (node.indeterminate !== undefined) {
      this.indeterminate = node.indeterminate;
    }

    // Update DOM
    this.updateDOM();

    // Update child tree items after render completes
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.updateChildTreeItems();
      });
    });
  }

  @watch('expanded')
  handleExpandedChange() {
    if (this.shadowRoot) this.updateExpandedState();
  }

  @watch('selected')
  handleSelectedChange() {
    if (this.shadowRoot) this.updateSelectedState();
  }

  @watch('checked')
  handleCheckedChange() {
    if (this.shadowRoot) this.updateCheckboxState();
  }

  @watch('indeterminate')
  handleIndeterminateChange() {
    if (this.shadowRoot) this.updateCheckboxState();
  }

  @watch('loading')
  handleLoadingChange() {
    if (this.shadowRoot) this.updateLoadingState();
  }

  private updateChildTreeItems() {
    if (!this.shadowRoot || !this.hasChildren) return;

    const childItems = this.shadowRoot.querySelectorAll('.tree-item__children > snice-tree-item');
    this.node.children?.forEach((child, index) => {
      if (childItems[index] && (childItems[index] as any).setNode) {
        (childItems[index] as any).setNode(child, this.level + 1);
      }
    });
  }

  @dispatch('tree-item-toggle', { bubbles: true, composed: true })
  private dispatchToggleEvent(): TreeItemToggleDetail {
    return { nodeId: this.node.id, expanded: this.expanded };
  }

  @dispatch('tree-item-select', { bubbles: true, composed: true })
  private dispatchSelectEvent(): TreeItemSelectDetail {
    return { nodeId: this.node.id, selected: this.selected };
  }

  @dispatch('tree-item-check', { bubbles: true, composed: true })
  private dispatchCheckEvent(): TreeItemCheckDetail {
    return { nodeId: this.node.id, checked: this.checked };
  }

  @dispatch('tree-item-lazy-load', { bubbles: true, composed: true })
  private dispatchLazyLoadEvent() {
    return { nodeId: this.node.id, node: this.node };
  }

  // NOTE: We don't use @render() here because it causes full re-renders
  // which destroys the tree structure when properties change. Instead, we
  // manually manipulate the shadow DOM for better performance and stability.

  @ready()
  init() {
    this.renderTemplate();
    this.updateDOM();
  }

  private renderTemplate() {
    const template = `
      <style>${cssContent}</style>
      <div class="tree-item">
        <div
          class="tree-item__content"
          part="content"
          role="treeitem"
          tabindex="0">

          <div class="tree-item__loading" part="loading" style="display: none;">
            <snice-spinner size="small"></snice-spinner>
          </div>

          <div class="tree-item__expander" part="expander">
            <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>
          </div>

          <div class="tree-item__checkbox" part="checkbox" style="display: none;">
            <snice-checkbox size="small"></snice-checkbox>
          </div>

          <div class="tree-item__icon" part="icon" style="display: none;"></div>

          <div class="tree-item__label" part="label"></div>
        </div>

        <div class="tree-item__children" part="children" role="group"></div>
      </div>
    `;

    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = template;
    } else {
      this.attachShadow({ mode: 'open' }).innerHTML = template;
    }

    // Attach event listeners
    const content = this.shadowRoot!.querySelector('.tree-item__content');
    const expander = this.shadowRoot!.querySelector('.tree-item__expander');

    content?.addEventListener('click', (e) => this.handleContentClick(e as MouseEvent));
    content?.addEventListener('keydown', (e) => this.handleKeydown(e as KeyboardEvent));
    expander?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Attach checkbox listener after element is defined
    requestAnimationFrame(() => {
      const checkbox = this.shadowRoot!.querySelector('snice-checkbox');
      checkbox?.addEventListener('checkbox-change', (e) => this.handleCheckboxChangeEvent(e as CustomEvent));
    });
  }

  private updateDOM() {
    if (!this.shadowRoot) return;

    const container = this.shadowRoot.querySelector('.tree-item');
    const content = this.shadowRoot.querySelector('.tree-item__content');
    const label = this.shadowRoot.querySelector('.tree-item__label');
    const icon = this.shadowRoot.querySelector('.tree-item__icon');

    // Update level
    if (container) {
      (container as HTMLElement).style.setProperty('--tree-level', this.level.toString());
    }

    // Update label
    if (label) {
      label.textContent = this.node.label || '';
    }

    // Update icon
    if (icon && this.showIcon) {
      if (this.node.iconImage) {
        icon.innerHTML = `<img class="tree-item__icon-image" src="${this.node.iconImage}" alt="" part="icon-image">`;
        (icon as HTMLElement).style.display = '';
      } else if (this.node.icon) {
        icon.innerHTML = `<span part="icon-text">${this.node.icon}</span>`;
        (icon as HTMLElement).style.display = '';
      } else {
        (icon as HTMLElement).style.display = 'none';
      }
    } else if (icon) {
      (icon as HTMLElement).style.display = 'none';
    }

    // Update ARIA attributes
    if (content) {
      content.setAttribute('tabindex', this.node.disabled ? '-1' : '0');
      content.setAttribute('aria-selected', this.selected.toString());
      content.setAttribute('aria-disabled', (this.node.disabled || false).toString());
      content.setAttribute('aria-busy', this.loading.toString());

      if (this.hasChildren) {
        content.setAttribute('aria-expanded', this.expanded.toString());
      } else {
        content.removeAttribute('aria-expanded');
      }
    }

    this.updateExpandedState();
    this.updateSelectedState();
    this.updateCheckboxState();
    this.updateLoadingState();
    this.updateChildrenDOM();
  }

  private updateExpandedState() {
    if (!this.shadowRoot) return;

    const expander = this.shadowRoot.querySelector('.tree-item__expander');
    const children = this.shadowRoot.querySelector('.tree-item__children');
    const content = this.shadowRoot.querySelector('.tree-item__content');

    if (expander) {
      expander.classList.toggle('tree-item__expander--expanded', this.expanded);
      expander.classList.toggle('tree-item__expander--hidden', !this.hasChildren);
    }

    if (children) {
      children.classList.toggle('tree-item__children--expanded', this.expanded);
    }

    if (content && this.hasChildren) {
      content.setAttribute('aria-expanded', this.expanded.toString());
    }
  }

  private updateSelectedState() {
    if (!this.shadowRoot) return;

    const content = this.shadowRoot.querySelector('.tree-item__content');
    if (content) {
      content.classList.toggle('tree-item__content--selected', this.selected);
      content.setAttribute('aria-selected', this.selected.toString());
    }
  }

  private updateCheckboxState() {
    if (!this.shadowRoot) return;

    const checkboxContainer = this.shadowRoot.querySelector('.tree-item__checkbox') as HTMLElement;
    const checkbox = this.shadowRoot.querySelector('snice-checkbox') as any;

    if (checkboxContainer) {
      checkboxContainer.style.display = this.showCheckbox ? '' : 'none';
    }

    if (checkbox) {
      // Use requestAnimationFrame to ensure checkbox component is ready
      requestAnimationFrame(() => {
        checkbox.checked = this.checked;
        checkbox.indeterminate = this.indeterminate;
        checkbox.disabled = this.node.disabled || false;
      });
    }
  }

  private updateLoadingState() {
    if (!this.shadowRoot) return;

    const loadingContainer = this.shadowRoot.querySelector('.tree-item__loading') as HTMLElement;
    const expander = this.shadowRoot.querySelector('.tree-item__expander') as HTMLElement;

    if (loadingContainer && expander) {
      loadingContainer.style.display = this.loading ? '' : 'none';
      expander.style.display = this.loading ? 'none' : '';
    }
  }

  private updateChildrenDOM() {
    if (!this.shadowRoot || !this.hasChildren) return;

    const childrenContainer = this.shadowRoot.querySelector('.tree-item__children');
    if (!childrenContainer) return;

    // Clear existing children
    childrenContainer.innerHTML = '';

    // Create child tree items
    this.node.children?.forEach(child => {
      const item = document.createElement('snice-tree-item') as any;
      if (this.showCheckbox) item.setAttribute('show-checkbox', '');
      if (this.showIcon) item.setAttribute('show-icon', '');
      childrenContainer.appendChild(item);
    });

    // Update child nodes after they're added to DOM
    requestAnimationFrame(() => {
      this.updateChildTreeItems();
    });
  }

  private handleContentClick(e: MouseEvent) {
    if (this.node.disabled) return;
    // Toggle selection instead of always selecting
    if (this.selected) {
      this.deselect();
    } else {
      this.select();
    }
  }

  private handleKeydown(e: KeyboardEvent) {
    if (this.node.disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Toggle selection instead of always selecting
      if (this.selected) {
        this.deselect();
      } else {
        this.select();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (this.hasChildren && !this.expanded) {
        this.expand();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (this.hasChildren && this.expanded) {
        this.collapse();
      }
    }
  }

  private handleCheckboxChangeEvent(e: CustomEvent) {
    e.stopPropagation();
    const newChecked = e.detail.checked;

    // Update local state
    this.checked = newChecked;

    // Update node state
    this.node.checked = newChecked;

    // Manually dispatch event to parent tree
    this.dispatchEvent(new CustomEvent('tree-item-check', {
      bubbles: true,
      composed: true,
      detail: {
        nodeId: this.node.id,
        checked: this.checked
      }
    }));
  }

  // Public API
  expand() {
    if (!this.hasChildren || this.expanded) return;

    // If lazy load, set loading state and dispatch event
    if (this.node.lazy && (!this.node.children || this.node.children.length === 0)) {
      this.loading = true;
      this.dispatchLazyLoadEvent();
      // Parent will set loading=false after loading children
      return;
    }

    this.expanded = true;
    this.dispatchToggleEvent();
  }

  finishLoading() {
    this.loading = false;
    this.expanded = true;
    this.dispatchToggleEvent();
  }

  collapse() {
    if (!this.hasChildren || !this.expanded) return;
    this.expanded = false;
    this.dispatchToggleEvent();
  }

  toggle() {
    if (this.expanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  select() {
    if (this.node.disabled) return;
    this.selected = true;
    // Don't modify node.selected here - let the parent tree handle it
    this.updateSelectedState();
    this.dispatchSelectEvent();
  }

  deselect() {
    this.selected = false;
    // Don't modify node.selected here - let the parent tree handle it
    this.updateSelectedState();
    this.dispatchSelectEvent();
  }

  check() {
    if (this.node.disabled) return;
    this.checked = true;
    this.dispatchCheckEvent();
  }

  uncheck() {
    this.checked = false;
    this.dispatchCheckEvent();
  }
}
