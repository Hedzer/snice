import { element, property, render, styles, dispatch, watch, ready, html, css } from 'snice';
import type { OrgChartDirection, OrgChartNode, SniceOrgChartElement } from './snice-org-chart.types';
import chartStyles from './snice-org-chart.css?inline';

@element('snice-org-chart')
export class SniceOrgChart extends HTMLElement implements SniceOrgChartElement {
  @property({ type: Object, attribute: false })
  data: OrgChartNode | null = null;

  @property() direction: OrgChartDirection = 'top-down';

  @property({ type: Boolean })
  compact: boolean = false;

  // Track render version to force re-render on collapse/expand
  @property({ type: Number })
  private renderVersion = 0;

  private collapsedNodes: Set<string> = new Set();

  @ready()
  init() {
    // Ready
  }

  @watch('data')
  handleDataChange() {
    // Force re-render
    this.renderVersion++;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${chartStyles}`;
  }

  @render()
  renderChart() {
    const isLeftRight = this.direction === 'left-right';
    const hasData = !!this.data;
    // Reference renderVersion to ensure re-render on collapse/expand
    const _v = this.renderVersion;

    if (!hasData) {
      return html`
        <div class="org-container" part="base">
          <div style="text-align: center; color: var(--snice-color-text-tertiary, rgb(115 115 115)); padding: 2rem;">
            No data provided
          </div>
        </div>
      `;
    }

    // Build the tree HTML imperatively to avoid nested .map() template issues
    const treeHtml = this.buildNodeHtml(this.data!);

    return html`
      <div class="org-container" part="base">
        <div class="org-tree ${isLeftRight ? 'org-tree--left-right' : ''}" part="tree">
          ${treeHtml}
        </div>
      </div>
    `;
  }

  private buildNodeHtml(node: OrgChartNode): any {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = this.collapsedNodes.has(node.id);
    const initial = node.name.charAt(0).toUpperCase();
    const isCompact = this.compact;
    const hasAvatar = !!node.avatar;
    const hasTitle = !!node.title;
    const showChildren = hasChildren && !isCollapsed;

    // Pre-build children templates to avoid nested .map() in template
    const childTemplates: any[] = [];
    if (showChildren && node.children) {
      for (const child of node.children) {
        const childHtml = this.buildNodeHtml(child);
        childTemplates.push(html`<div class="org-branch">${childHtml}</div>`);
      }
    }

    const toggleIcon = isCollapsed
      ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`
      : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>`;

    const avatarHtml = hasAvatar
      ? html`<img class="org-avatar ${isCompact ? 'org-avatar--compact' : ''}" src="${node.avatar}" alt="${node.name}" />`
      : html`<div class="org-avatar-placeholder ${isCompact ? 'org-avatar-placeholder--compact' : ''}">${initial}</div>`;

    const titleHtml = hasTitle
      ? html`<span class="org-node-title">${node.title}</span>`
      : '';

    const toggleHtml = hasChildren
      ? html`<div class="org-toggle" @click=${(e: Event) => { e.stopPropagation(); this.toggleNode(node); }}>${toggleIcon}</div>`
      : '';

    const childrenHtml = showChildren
      ? html`<div class="org-children">${childTemplates}</div>`
      : '';

    return html`
      <div class="org-node-wrapper">
        <div class="org-node ${isCompact ? 'org-node--compact' : ''}" part="node" @click=${() => this.emitNodeClick(node)}>
          ${avatarHtml}
          <div class="org-node-info">
            <span class="org-node-name">${node.name}</span>
            ${titleHtml}
          </div>
          ${toggleHtml}
        </div>
        ${childrenHtml}
      </div>
    `;
  }

  // --- Public Methods ---

  collapseNode(id: string): void {
    const node = this.findNode(id);
    if (node) {
      this.collapsedNodes.add(id);
      this.renderVersion++;
      this.emitNodeCollapse(node);
    }
  }

  expandNode(id: string): void {
    const node = this.findNode(id);
    if (node) {
      this.collapsedNodes.delete(id);
      this.renderVersion++;
      this.emitNodeExpand(node);
    }
  }

  expandAll(): void {
    this.collapsedNodes = new Set();
    this.renderVersion++;
  }

  collapseAll(): void {
    if (!this.data) return;
    const ids = new Set<string>();
    this.collectNodeIds(this.data, ids);
    this.collapsedNodes = ids;
    this.renderVersion++;
  }

  // --- Private Methods ---

  private toggleNode(node: OrgChartNode): void {
    if (this.collapsedNodes.has(node.id)) {
      this.expandNode(node.id);
    } else {
      this.collapseNode(node.id);
    }
  }

  private findNode(id: string, root?: OrgChartNode): OrgChartNode | null {
    const node = root || this.data;
    if (!node) return null;
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNode(id, child);
        if (found) return found;
      }
    }
    return null;
  }

  private collectNodeIds(node: OrgChartNode, ids: Set<string>): void {
    if (node.children && node.children.length > 0) {
      ids.add(node.id);
      for (const child of node.children) {
        this.collectNodeIds(child, ids);
      }
    }
  }

  // --- Events ---

  @dispatch('node-click', { bubbles: true, composed: true })
  private emitNodeClick(node: OrgChartNode) {
    return { node };
  }

  @dispatch('node-expand', { bubbles: true, composed: true })
  private emitNodeExpand(node: OrgChartNode) {
    return { node };
  }

  @dispatch('node-collapse', { bubbles: true, composed: true })
  private emitNodeCollapse(node: OrgChartNode) {
    return { node };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-org-chart': SniceOrgChart;
  }
}
