import {
  element,
  property,
  state,
  watch,
  dispatch,
  ready,
  render,
  styles,
  html,
  css,
  nothing,
  repeat,
  isSafeUrl
} from 'snice';
import cssContent from './snice-tree-item.css?inline';
import type { TreeNode } from './snice-tree.types';
import type {
  SniceTreeItemElement,
  TreeItemToggleDetail,
  TreeItemSelectDetail,
  TreeItemCheckDetail
} from './snice-tree-item.types';
import '../checkbox/snice-checkbox';
import '../spinner/snice-spinner';

const SAFE_RASTER_DATA_IMAGE = /^data:image\/(?:avif|bmp|gif|jpeg|png|webp|x-icon)(?:;base64)?,/i;
const EMPTY_TREE_NODE: TreeNode = { id: '', label: '' };

function normalizeIconImageSource(value: unknown): string {
  if (typeof value !== 'string') return '';

  const source = value.trim();
  if (!source) return '';
  // URLs must encode delimiters rather than carrying raw markup/attribute
  // characters. Property binding already prevents attribute injection, but
  // rejecting malformed input gives iconImage an unambiguous URL contract.
  if (/[\u0000-\u0020\u007f"'<>`]/.test(source)) return '';
  if (source.toLowerCase().startsWith('data:')) {
    return SAFE_RASTER_DATA_IMAGE.test(source) ? source : '';
  }

  return isSafeUrl(source, { allowed: ['http:', 'https:', 'blob:'] }) ? source : '';
}

@element('snice-tree-item')
export class SniceTreeItem extends HTMLElement implements SniceTreeItemElement {
  @state()
  private nodeData: TreeNode = EMPTY_TREE_NODE;

  @state()
  private levelDepth = 0;

  @state()
  private posInSet = 1;

  @state()
  private setSize = 1;

  @state()
  private version = 0;

  private inheritedRevision = -1;

  @state()
  private failedIconImage = '';

  private lastIconImageValue: unknown = '';

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
    return this.nodeData ?? EMPTY_TREE_NODE;
  }

  get level(): number {
    return this.levelDepth;
  }

  get hasChildren(): boolean {
    return Boolean(this.node.children?.length) || Boolean(this.node.lazy);
  }

  // Template property names are parsed through HTML and therefore lowercase
  // in browsers. These internal adapters keep the recursive handoff explicit
  // while preserving the component's camel-cased implementation fields.
  private set treeitemnode(node: TreeNode) {
    this.nodeData = node;
  }

  private set treeitemlevel(level: number) {
    this.levelDepth = level;
  }

  private set treeitemposition(position: number) {
    this.posInSet = position;
  }

  private set treeitemsize(size: number) {
    this.setSize = size;
  }

  private set treeitemcheckbox(show: boolean) {
    this.showCheckbox = show;
  }

  private set treeitemicon(show: boolean) {
    this.showIcon = show;
  }

  private set treeitemrevision(revision: number) {
    if (revision === this.inheritedRevision) return;
    this.inheritedRevision = revision;
    this.version++;
  }

  @ready()
  private adoptPreUpgradeBindings() {
    // A recursively parsed custom element can receive property bindings before
    // its class upgrades. Those values are own properties and would otherwise
    // shadow the prototype setters above. Lift them into reactive state once.
    const takeOwn = (name: string): unknown => {
      if (!Object.prototype.hasOwnProperty.call(this, name)) return undefined;
      const value = (this as any)[name];
      delete (this as any)[name];
      return value;
    };

    const node = takeOwn('treeitemnode');
    const level = takeOwn('treeitemlevel');
    const position = takeOwn('treeitemposition');
    const size = takeOwn('treeitemsize');
    const checkbox = takeOwn('treeitemcheckbox');
    const icon = takeOwn('treeitemicon');
    const revision = takeOwn('treeitemrevision');

    if (node && typeof node === 'object') this.treeitemnode = node as TreeNode;
    if (typeof level === 'number') this.treeitemlevel = level;
    if (typeof position === 'number') this.treeitemposition = position;
    if (typeof size === 'number') this.treeitemsize = size;
    if (typeof checkbox === 'boolean') this.treeitemcheckbox = checkbox;
    if (typeof icon === 'boolean') this.treeitemicon = icon;
    if (typeof revision === 'number') this.treeitemrevision = revision;
  }

  setNode(node: TreeNode, level: number, posInSet: number = 1, setSize: number = 1) {
    const sameNode = this.nodeData === node;
    this.levelDepth = level;
    this.posInSet = posInSet;
    this.setSize = setSize;
    this.nodeData = node;

    // A caller can mutate an existing node object and pass it to setNode()
    // again. Preserve that supported workflow even though the object identity
    // did not change and the reactive property correctly skipped its setter.
    if (sameNode) {
      this.syncNodeState(node);
      this.version++;
    }
  }

  @watch('nodeData')
  private handleNodeDataChange(_oldNode: TreeNode | undefined, node: TreeNode) {
    this.syncNodeState(node);
  }

  private syncNodeState(node: TreeNode) {
    if (!node || typeof node !== 'object') return;
    if (node.iconImage !== this.lastIconImageValue) {
      this.failedIconImage = '';
      this.lastIconImageValue = node.iconImage;
    }

    this.expanded = node.expanded ?? false;
    this.selected = node.selected ?? false;
    this.checked = node.checked ?? false;
    this.indeterminate = node.indeterminate ?? false;
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

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @render()
  renderTreeItem() {
    const children = this.node.children ?? [];
    const hasChildren = this.hasChildren;
    const safeImageSource = normalizeIconImageSource(this.node.iconImage);
    const showImage = this.showIcon && Boolean(safeImageSource) && this.failedIconImage !== safeImageSource;
    const showTextIcon = this.showIcon && !showImage && Boolean(this.node.icon);
    const showAnyIcon = showImage || showTextIcon;
    const ariaExpanded = hasChildren ? this.expanded.toString() : nothing;

    return html`
      <div class="tree-item" style:--tree-level=${this.level.toString()}>
        <div
          class="tree-item__content"
          class:tree-item__content--selected=${this.selected}
          class:tree-item__content--disabled=${Boolean(this.node.disabled)}
          part="content"
          role="treeitem"
          tabindex=${this.node.disabled ? '-1' : '0'}
          aria-selected=${this.selected.toString()}
          aria-disabled=${Boolean(this.node.disabled).toString()}
          aria-busy=${this.loading.toString()}
          aria-level=${String(this.level + 1)}
          aria-setsize=${String(this.setSize)}
          aria-posinset=${String(this.posInSet)}
          aria-expanded=${ariaExpanded}
          @click=${this.handleContentClick}
          @keydown=${this.handleKeydown}
        >
          <div
            class="tree-item__loading"
            part="loading"
            style:display=${this.loading ? 'inline-flex' : 'none'}
          >
            <snice-spinner size="small"></snice-spinner>
          </div>

          <div
            class="tree-item__expander"
            class:tree-item__expander--expanded=${this.expanded}
            class:tree-item__expander--hidden=${!hasChildren}
            part="expander"
            style:display=${this.loading ? 'none' : nothing}
            @click|stop=${this.handleExpanderClick}
          >
            <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>
          </div>

          <div
            class="tree-item__checkbox"
            part="checkbox"
            style:display=${this.showCheckbox ? nothing : 'none'}
            @click|stop=${this.handleCheckboxClick}
          >
            <snice-checkbox
              size="small"
              .checked=${this.checked}
              .indeterminate=${this.indeterminate}
              .disabled=${Boolean(this.node.disabled)}
              @checkbox-change=${this.handleCheckboxChangeEvent}
            ></snice-checkbox>
          </div>

          <div
            class="tree-item__icon"
            part="icon"
            style:display=${showAnyIcon ? nothing : 'none'}
          >
            <if ${showImage}>
              <img
                class="tree-item__icon-image"
                .src=${safeImageSource}
                alt=""
                aria-hidden="true"
                part="icon-image"
                @error=${this.handleIconImageError}
              />
              <else-if ${showTextIcon}>
                <span part="icon-text">${this.node.icon}</span>
              </else-if>
            </if>
          </div>

          <div class="tree-item__label" part="label">${this.node.label || ''}</div>
        </div>

        <div
          class="tree-item__children"
          class:tree-item__children--expanded=${this.expanded}
          part="children"
          role="group"
        >
          ${repeat(children, {
            key: child => child.id,
            render: (child, index) => html`
              <snice-tree-item
                .treeitemnode=${child}
                .treeitemlevel=${this.level + 1}
                .treeitemposition=${index + 1}
                .treeitemsize=${children.length}
                .treeitemcheckbox=${this.showCheckbox}
                .treeitemicon=${this.showIcon}
                .treeitemrevision=${this.version}
              ></snice-tree-item>
            `
          })}
        </div>
      </div>
    `;
  }

  private handleIconImageError() {
    this.failedIconImage = normalizeIconImageSource(this.node.iconImage);
  }

  private handleExpanderClick() {
    this.toggle();
  }

  private handleContentClick() {
    if (this.node.disabled) return;
    if (this.selected) this.deselect();
    else this.select();
  }

  private handleCheckboxClick() {
    // Checkbox activation is independent from row selection. Stopping the
    // native click here also prevents a row render from resetting the input
    // before its native input/change sequence completes.
  }

  private handleKeydown(e: KeyboardEvent) {
    if (this.node.disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (this.selected) this.deselect();
      else this.select();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (this.hasChildren && !this.expanded) this.expand();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (this.hasChildren && this.expanded) this.collapse();
    }
  }

  private handleCheckboxChangeEvent(e: CustomEvent) {
    e.stopPropagation();
    this.checked = Boolean(e.detail.checked);
    this.node.checked = this.checked;
    this.dispatchCheckEvent();
  }

  expand() {
    if (!this.hasChildren || this.expanded) return;

    if (this.node.lazy && !this.node.children?.length) {
      this.loading = true;
      this.dispatchLazyLoadEvent();
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
    if (this.expanded) this.collapse();
    else this.expand();
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
