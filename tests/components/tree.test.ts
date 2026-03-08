import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait, trackRenders } from './test-utils';
import '../../components/tree/snice-tree';
import '../../components/tree/snice-tree-item';
import type { SniceTreeElement, TreeNode } from '../../components/tree/snice-tree.types';

describe('snice-tree', () => {
  let tree: SniceTreeElement;

  const getSampleData = (): TreeNode[] => JSON.parse(JSON.stringify([
    {
      id: 'root',
      label: 'Root',
      expanded: true,
      children: [
        { id: 'child1', label: 'Child 1' },
        {
          id: 'child2',
          label: 'Child 2',
          children: [
            { id: 'grandchild1', label: 'Grandchild 1' }
          ]
        }
      ]
    }
  ]));

  afterEach(() => {
    if (tree) {
      removeComponent(tree as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render tree element', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      expect(tree).toBeTruthy();
      expect(tree.tagName.toLowerCase()).toBe('snice-tree');
    });

    it('should have default properties', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      expect(tree.selectionMode).toBe('single');
      expect(tree.showCheckboxes).toBe(false);
      expect(tree.showIcons).toBe(true);
      expect(tree.expandOnClick).toBe(false);
    });

    it('should display empty state when no nodes', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      expect(tree.nodes.length).toBe(0);
    });
  });

  describe('nodes', () => {
    it('should render nodes', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);
      expect(tree.nodes.length).toBe(1);
      expect(tree.nodes[0].label).toBe('Root');
    });

    it('should render hierarchical nodes', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);
      expect(tree.nodes[0].children?.length).toBe(2);
    });
  });

  describe('selection mode', () => {
    it('should support single selection', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree', {
        selectionMode: 'single'
      });
      expect(tree.selectionMode).toBe('single');
    });

    it('should support multiple selection', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree', {
        selectionMode: 'multiple'
      });
      expect(tree.selectionMode).toBe('multiple');
    });

    it('should support no selection', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree', {
        selectionMode: 'none'
      });
      expect(tree.selectionMode).toBe('none');
    });
  });

  describe('checkboxes', () => {
    it('should hide checkboxes by default', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      expect(tree.showCheckboxes).toBe(false);
    });

    it('should show checkboxes when enabled', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree', {
        showCheckboxes: true
      });
      expect(tree.showCheckboxes).toBe(true);
    });
  });

  describe('icons', () => {
    it('should show icons by default', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      expect(tree.showIcons).toBe(true);
    });

    it('should hide icons when disabled', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree', {
        showIcons: false
      });
      expect(tree.showIcons).toBe(false);
    });
  });

  describe('expand/collapse', () => {
    it('should expand node', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);
      tree.expandNode('root');
      await wait(50);
      const node = tree.getNode('root');
      expect(node?.expanded).toBe(true);
    });

    it('should collapse node', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);
      tree.collapseNode('root');
      await wait(50);
      const node = tree.getNode('root');
      expect(node?.expanded).toBe(false);
    });

    it('should toggle node', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);
      const initialState = tree.getNode('root')?.expanded;
      tree.toggleNode('root');
      await wait(50);
      const node = tree.getNode('root');
      expect(node?.expanded).toBe(!initialState);
    });

    it('should expand all nodes', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);
      tree.expandAll();
      await wait(50);
      const root = tree.getNode('root');
      const child2 = tree.getNode('child2');
      expect(root?.expanded).toBe(true);
      expect(child2?.expanded).toBe(true);
    });

    it('should collapse all nodes', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);
      tree.collapseAll();
      await wait(50);
      const node = tree.getNode('root');
      expect(node?.expanded).toBe(false);
    });
  });

  describe('selection', () => {
    it('should select node', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);
      tree.selectNode('child1');
      await wait(50);
      expect(tree.selectedNodes).toContain('child1');
    });

    it('should deselect node', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      tree.selectedNodes = ['child1'];
      await wait(50);
      tree.deselectNode('child1');
      await wait(50);
      expect(tree.selectedNodes).not.toContain('child1');
    });

    it('should toggle selection', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);
      tree.toggleSelection('child1');
      await wait(50);
      expect(tree.selectedNodes).toContain('child1');
      tree.toggleSelection('child1');
      await wait(50);
      expect(tree.selectedNodes).not.toContain('child1');
    });

    it('should support single selection (deselect others)', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree', {
        selectionMode: 'single'
      });
      tree.nodes = getSampleData();
      await wait(50);
      tree.selectNode('child1');
      await wait(50);
      tree.selectNode('child2');
      await wait(50);
      expect(tree.selectedNodes).toEqual(['child2']);
      expect(tree.selectedNodes).not.toContain('child1');
    });

    it('should support multiple selection', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree', {
        selectionMode: 'multiple'
      });
      tree.nodes = getSampleData();
      await wait(50);
      tree.selectNode('child1');
      await wait(50);
      tree.selectNode('child2');
      await wait(50);
      expect(tree.selectedNodes).toContain('child1');
      expect(tree.selectedNodes).toContain('child2');
    });
  });

  describe('checkboxes', () => {
    it('should check node', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);
      tree.checkNode('child1');
      await wait(50);
      expect(tree.checkedNodes).toContain('child1');
    });

    it('should uncheck node', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      tree.checkedNodes = ['child1'];
      await wait(50);
      tree.uncheckNode('child1');
      await wait(50);
      expect(tree.checkedNodes).not.toContain('child1');
    });

    it('should toggle check', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);
      tree.toggleCheck('child1');
      await wait(50);
      expect(tree.checkedNodes).toContain('child1');
      tree.toggleCheck('child1');
      await wait(50);
      expect(tree.checkedNodes).not.toContain('child1');
    });
  });

  describe('node updates', () => {
    it('should update node via updateNode', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);
      tree.updateNode('child1', { label: 'Updated Child 1' });
      await wait(50);
      const node = tree.getNode('child1');
      expect(node?.label).toBe('Updated Child 1');
    });

    it('should handle selectedNodes property change via @watch', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree', {
        selectionMode: 'multiple'
      });
      tree.nodes = getSampleData();
      await wait(50);
      // Directly set selectedNodes property (triggers @watch handler)
      tree.selectedNodes = ['child1', 'child2'];
      await wait(50);
      const selected = tree.getSelectedNodes();
      expect(selected.length).toBe(2);
      expect(selected.map(n => n.id)).toContain('child1');
      expect(selected.map(n => n.id)).toContain('child2');
    });

    it('should handle checkedNodes property change via @watch', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);
      // Directly set checkedNodes property (triggers @watch handler)
      tree.checkedNodes = ['child1'];
      await wait(50);
      const checked = tree.getCheckedNodes();
      expect(checked.length).toBe(1);
      expect(checked[0].id).toBe('child1');
    });
  });

  describe('API methods', () => {
    it('should get node by id', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);
      const node = tree.getNode('child1');
      expect(node).toBeTruthy();
      expect(node?.label).toBe('Child 1');
    });

    it('should get selected nodes', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      tree.selectedNodes = ['child1', 'child2'];
      await wait(50);
      const selected = tree.getSelectedNodes();
      expect(selected.length).toBe(2);
      expect(selected[0].id).toBe('child1');
      expect(selected[1].id).toBe('child2');
    });

    it('should get checked nodes', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      tree.checkedNodes = ['child1', 'child2'];
      await wait(50);
      const checked = tree.getCheckedNodes();
      expect(checked.length).toBe(2);
      expect(checked[0].id).toBe('child1');
      expect(checked[1].id).toBe('child2');
    });
  });

  describe('events', () => {
    it('should emit @snice/tree-node-expand event', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);

      let eventFired = false;
      tree.addEventListener('tree-node-expand', () => {
        eventFired = true;
      });

      tree.expandNode('child2');
      await wait(50);
      expect(eventFired).toBe(true);
    });

    it('should emit @snice/tree-node-collapse event', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);

      let eventFired = false;
      tree.addEventListener('tree-node-collapse', () => {
        eventFired = true;
      });

      tree.collapseNode('root');
      await wait(50);
      expect(eventFired).toBe(true);
    });

    it('should emit @snice/tree-node-select event', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);

      let eventDetail: any = null;
      tree.addEventListener('tree-node-select', (e: Event) => {
        eventDetail = (e as CustomEvent).detail;
      });

      tree.selectNode('child1');
      await wait(50);
      expect(eventDetail).toBeTruthy();
      expect(eventDetail.nodeId).toBe('child1');
    });

    it('should emit @snice/tree-node-check event', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = getSampleData();
      await wait(50);

      let eventDetail: any = null;
      tree.addEventListener('tree-node-check', (e: Event) => {
        eventDetail = (e as CustomEvent).detail;
      });

      tree.checkNode('child1');
      await wait(50);
      expect(eventDetail).toBeTruthy();
      expect(eventDetail.nodeId).toBe('child1');
      expect(eventDetail.checked).toBe(true);
    });
  });
});
