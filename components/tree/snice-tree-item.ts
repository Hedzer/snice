import { element, property, watch, dispatch, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-tree-item.css?inline';
import type { TreeNode } from './snice-tree.types';
import type { SniceTreeItemElement, TreeItemToggleDetail, TreeItemSelectDetail, TreeItemCheckDetail } from './snice-tree-item.types';
import '../checkbox/snice-checkbox';

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

  get node(): TreeNode {
    return this._node;
  }

  get level(): number {
    return this._level;
  }

  get hasChildren(): boolean {
    return !!(this._node.children && this._node.children.length > 0);
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

    // Trigger re-render by updating reactive property
    this._version++;

    // Update child tree items after render completes
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.updateChildTreeItems();
      });
    });
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

  @render()
  render() {
    const contentClasses = [
      'tree-item__content',
      this.selected ? 'tree-item__content--selected' : '',
      this.node.disabled ? 'tree-item__content--disabled' : ''
    ].filter(Boolean).join(' ');

    const expanderClasses = [
      'tree-item__expander',
      this.expanded ? 'tree-item__expander--expanded' : '',
      !this.hasChildren ? 'tree-item__expander--hidden' : ''
    ].filter(Boolean).join(' ');

    const childrenClasses = [
      'tree-item__children',
      this.expanded ? 'tree-item__children--expanded' : ''
    ].filter(Boolean).join(' ');

    const chevronIcon = `<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>`;

    return html/*html*/`
      <div class="tree-item" style="--tree-level: ${this.level}">
        <div
          class="${contentClasses}"
          part="content"
          role="treeitem"
          tabindex="${this.node.disabled ? -1 : 0}"
          aria-selected="${this.selected}"
          aria-expanded="${this.hasChildren ? this.expanded : undefined}"
          aria-disabled="${this.node.disabled || false}"
          @click="${(e: MouseEvent) => this.handleContentClick(e)}"
          @keydown="${(e: KeyboardEvent) => this.handleKeydown(e)}">

          <div
            class="${expanderClasses}"
            part="expander"
            @click="${(e: MouseEvent) => this.handleExpanderClick(e)}">
            ${unsafeHTML(chevronIcon)}
          </div>

          <if ${this.showCheckbox}>
            <div class="tree-item__checkbox" part="checkbox">
              <snice-checkbox
                .checked=${this.checked}
                .disabled=${this.node.disabled || false}
                size="small"
                @change=${(e: CustomEvent) => this.handleCheckboxChange(e)}>
              </snice-checkbox>
            </div>
          </if>

          <if ${this.showIcon && (this.node.icon || this.node.iconImage)}>
            <div class="tree-item__icon" part="icon">
              <if ${this.node.iconImage}>
                <img
                  class="tree-item__icon-image"
                  src="${this.node.iconImage}"
                  alt=""
                  part="icon-image" />
              </if>
              <if ${!this.node.iconImage && this.node.icon}>
                <span part="icon-text">${this.node.icon}</span>
              </if>
            </div>
          </if>

          <div class="tree-item__label" part="label">${this.node.label}</div>
        </div>

        <if ${this.hasChildren}>
          <div class="${childrenClasses}" part="children" role="group">
            ${this.node.children?.map(child => html`
              <snice-tree-item
                ?show-checkbox=${this.showCheckbox}
                ?show-icon=${this.showIcon}>
              </snice-tree-item>
            `)}
          </div>
        </if>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  private handleExpanderClick(e: MouseEvent) {
    e.stopPropagation();
    this.toggle();
  }

  private handleContentClick(e: MouseEvent) {
    if (this.node.disabled) return;
    this.select();
  }

  private handleKeydown(e: KeyboardEvent) {
    if (this.node.disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.select();
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

  private handleCheckboxChange(e: CustomEvent) {
    e.stopPropagation();
    this.checked = e.detail.checked;
    this.dispatchCheckEvent();
  }

  // Public API
  expand() {
    if (!this.hasChildren || this.expanded) return;

    // If lazy load, dispatch event before expanding
    if (this.node.lazy && (!this.node.children || this.node.children.length === 0)) {
      this.dispatchLazyLoadEvent();
    }

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
    this.dispatchSelectEvent();
  }

  deselect() {
    this.selected = false;
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
