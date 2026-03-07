/**
 * Tree data engine for snice-table.
 * Hierarchical rows with indent levels, expand/collapse nodes.
 */

export interface TreeRow {
  /** Path array defining hierarchy. e.g. ['US', 'CA', 'LA'] */
  path: string[];
  /** The original row data */
  data: any;
  /** Depth level (0-based) */
  depth: number;
  /** Whether this node has children */
  hasChildren: boolean;
  /** Whether this node is expanded */
  expanded: boolean;
  /** Unique key derived from path */
  key: string;
  /** Whether this is a gap node (auto-generated for missing parents) */
  isGap: boolean;
}

export interface TreeDataOptions {
  /** Function to get the path array from a row */
  getPath: (row: any) => string[];
  /** Default expansion depth. -1 = all collapsed, Infinity = all expanded */
  defaultExpansionDepth?: number;
  /** Group column key (where expand/collapse controls appear) */
  groupColumn?: string;
}

export class TableTreeData {
  private options: TreeDataOptions | null = null;
  private expandedKeys: Set<string> = new Set();
  private flatRows: TreeRow[] = [];
  private enabled = false;

  attach(options: TreeDataOptions) {
    this.options = options;
    this.enabled = true;

    // Pre-expand to default depth
    if (options.defaultExpansionDepth !== undefined && options.defaultExpansionDepth >= 0) {
      this.defaultDepth = options.defaultExpansionDepth;
    }
  }

  private defaultDepth = 0;

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Process raw data into a flat tree structure.
   * Returns only visible rows (respecting expand/collapse state).
   */
  processData(data: any[]): TreeRow[] {
    if (!this.options) return [];

    // Build tree from path arrays
    const nodeMap = new Map<string, { data: any; children: Set<string>; depth: number; isGap: boolean }>();

    for (const row of data) {
      const path = this.options.getPath(row);
      const key = path.join('/');

      nodeMap.set(key, {
        data: row,
        children: new Set(),
        depth: path.length - 1,
        isGap: false,
      });

      // Ensure all ancestors exist (gap nodes)
      for (let i = 1; i < path.length; i++) {
        const ancestorPath = path.slice(0, i);
        const ancestorKey = ancestorPath.join('/');
        if (!nodeMap.has(ancestorKey)) {
          nodeMap.set(ancestorKey, {
            data: { [this.options.groupColumn || 'name']: ancestorPath[ancestorPath.length - 1] },
            children: new Set(),
            depth: i - 1,
            isGap: true,
          });
        }
      }

      // Register as child of parent
      if (path.length > 1) {
        const parentKey = path.slice(0, -1).join('/');
        const parent = nodeMap.get(parentKey);
        if (parent) parent.children.add(key);
      }
    }

    // Find root nodes (depth 0)
    const rootKeys: string[] = [];
    for (const [key, node] of nodeMap) {
      if (node.depth === 0) rootKeys.push(key);
    }
    rootKeys.sort();

    // Auto-expand to default depth on first process
    if (this.expandedKeys.size === 0 && this.defaultDepth > 0) {
      for (const [key, node] of nodeMap) {
        if (node.depth < this.defaultDepth && node.children.size > 0) {
          this.expandedKeys.add(key);
        }
      }
    }

    // Flatten tree respecting expand/collapse
    this.flatRows = [];
    const flatten = (key: string) => {
      const node = nodeMap.get(key);
      if (!node) return;

      const hasChildren = node.children.size > 0;
      const expanded = this.expandedKeys.has(key);

      this.flatRows.push({
        path: key.split('/'),
        data: node.data,
        depth: node.depth,
        hasChildren,
        expanded,
        key,
        isGap: node.isGap,
      });

      if (expanded) {
        const childKeys = Array.from(node.children).sort();
        for (const childKey of childKeys) {
          flatten(childKey);
        }
      }
    };

    for (const rootKey of rootKeys) {
      flatten(rootKey);
    }

    return this.flatRows;
  }

  /** Get the current flat rows */
  getFlatRows(): TreeRow[] {
    return this.flatRows;
  }

  /** Toggle node expansion */
  toggle(key: string) {
    if (this.expandedKeys.has(key)) {
      this.expandedKeys.delete(key);
    } else {
      this.expandedKeys.add(key);
    }
  }

  /** Expand a node */
  expand(key: string) {
    this.expandedKeys.add(key);
  }

  /** Collapse a node */
  collapse(key: string) {
    this.expandedKeys.delete(key);
  }

  /** Expand all nodes */
  expandAll(data: any[]) {
    if (!this.options) return;
    for (const row of data) {
      const path = this.options.getPath(row);
      // Expand all ancestor paths
      for (let i = 1; i <= path.length; i++) {
        this.expandedKeys.add(path.slice(0, i).join('/'));
      }
    }
  }

  /** Collapse all nodes */
  collapseAll() {
    this.expandedKeys.clear();
  }

  /** Check if a node is expanded */
  isExpanded(key: string): boolean {
    return this.expandedKeys.has(key);
  }

  /** Create the expand/collapse toggle for a tree node */
  createToggle(treeRow: TreeRow): HTMLElement {
    const container = document.createElement('span');
    container.style.cssText = `
      display: inline-flex;
      align-items: center;
      padding-left: ${treeRow.depth * 1.5}rem;
    `;

    if (treeRow.hasChildren) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tree-toggle';
      btn.style.cssText = `
        background: none; border: none; cursor: pointer; padding: 0.125rem;
        color: inherit; font-size: 0.7rem; line-height: 1; width: 1.25rem;
        display: inline-flex; align-items: center; justify-content: center;
      `;
      btn.textContent = treeRow.expanded ? '▼' : '▶';
      btn.setAttribute('aria-expanded', String(treeRow.expanded));
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle(treeRow.key);
        // Dispatch on the button — it'll bubble up to the table
        btn.dispatchEvent(new CustomEvent('tree-toggle', {
          detail: { key: treeRow.key, expanded: this.isExpanded(treeRow.key) },
          bubbles: true,
          composed: true,
        }));
      });
      container.appendChild(btn);
    } else {
      // Spacer for leaf nodes (align with siblings)
      const spacer = document.createElement('span');
      spacer.style.cssText = 'display: inline-block; width: 1.25rem;';
      container.appendChild(spacer);
    }

    return container;
  }

  getGroupColumn(): string {
    return this.options?.groupColumn || '';
  }
}
