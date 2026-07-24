import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait, trackRenders } from './test-utils';
import '../../packages/components/src/tree/snice-tree';
import '../../packages/components/src/tree/snice-tree-item';
import type { SniceTreeElement, TreeNode } from '../../packages/components/src/tree/snice-tree.types';

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

    it('renders markup-looking icon strings as literal text', async () => {
      const icon = '<img data-tree-injected="image" src="missing.png" onerror="globalThis.__treeInjected++"><svg data-tree-injected="svg" onload="globalThis.__treeInjected++"><script>globalThis.__treeInjected++</script></svg>';
      (globalThis as any).__treeInjected = 0;
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = [{ id: 'unsafe-icon', label: 'Safe node', icon }];
      await wait(50);

      const item = tree.shadowRoot!.querySelector('snice-tree-item') as any;
      const iconContainer = item.shadowRoot.querySelector('.tree-item__icon') as HTMLElement;
      const iconText = iconContainer.querySelector('[part="icon-text"]');

      expect(iconText?.textContent).toBe(icon);
      expect(iconContainer.querySelector('img')).toBeNull();
      expect(iconContainer.querySelector('svg')).toBeNull();
      expect(iconContainer.querySelector('script')).toBeNull();
      expect(iconContainer.querySelector('[data-tree-injected]')).toBeNull();
      expect((globalThis as any).__treeInjected).toBe(0);
    });

    it('assigns valid image sources through the image src property', async () => {
      const iconImage = 'https://cdn.example.test/icons/folder.png?label=%22quoted%22&mode=tree';
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = [{ id: 'image-icon', label: 'Image node', icon: 'fallback', iconImage }];
      await wait(50);

      const item = tree.shadowRoot!.querySelector('snice-tree-item') as any;
      const image = item.shadowRoot.querySelector('.tree-item__icon-image') as HTMLImageElement;

      expect(image).toBeTruthy();
      expect(image.getAttribute('src')).toBe(iconImage);
      expect(image.getAttribute('onerror')).toBeNull();
      expect(image.getAttribute('data-tree-injected')).toBeNull();
      expect(image.alt).toBe('');
    });

    it('supports relative, blob, and raster data image sources', async () => {
      const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mNk+M8AAAICAQB7CYcKAAAAAElFTkSuQmCC';
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = [
        { id: 'relative', label: 'Relative', iconImage: '/assets/folder.png' },
        { id: 'blob', label: 'Blob', iconImage: 'blob:https://example.test/1234' },
        { id: 'data', label: 'Data', iconImage: png }
      ];
      await wait(50);

      const items = Array.from(tree.shadowRoot!.querySelectorAll('snice-tree-item')) as any[];
      const sources = items.map(item => (item.shadowRoot.querySelector('img') as HTMLImageElement)?.getAttribute('src'));

      expect(sources[0]).toBe('/assets/folder.png');
      expect(sources[1]).toBe('blob:https://example.test/1234');
      expect(sources[2]).toBe(png);
    });

    it.each([
      ['javascript scheme', 'javascript:globalThis.__treeInjected++'],
      ['vbscript scheme', 'vbscript:msgbox(1)'],
      ['HTML data payload', 'data:text/html,<img src=x onerror=globalThis.__treeInjected++>'],
      ['SVG data payload', 'data:image/svg+xml,<svg onload=globalThis.__treeInjected++></svg>'],
      ['quoted attribute payload', 'missing.png" onerror="globalThis.__treeInjected++" data-tree-injected="image'],
      ['malformed absolute URL', 'http://[']
    ])('rejects an unsafe iconImage with a %s', async (_caseName, iconImage) => {
      const fallback = '<svg data-tree-injected="fallback" onload="globalThis.__treeInjected++"></svg>';
      (globalThis as any).__treeInjected = 0;
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = [{ id: 'unsafe-image', label: 'Still intact', icon: fallback, iconImage }];
      await wait(50);

      const item = tree.shadowRoot!.querySelector('snice-tree-item') as any;
      const iconContainer = item.shadowRoot.querySelector('.tree-item__icon') as HTMLElement;

      expect(iconContainer.querySelector('img')).toBeNull();
      expect(iconContainer.querySelector('svg')).toBeNull();
      expect(iconContainer.querySelector('[data-tree-injected]')).toBeNull();
      expect(iconContainer.textContent?.trim()).toBe(fallback);
      expect(item.shadowRoot.querySelector('.tree-item__label')?.textContent).toBe('Still intact');
      expect((globalThis as any).__treeInjected).toBe(0);
    });

    it('hides an invalid image channel when no text fallback is supplied', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = [{ id: 'invalid-only', label: 'No icon', iconImage: 'javascript:alert(1)' }];
      await wait(50);

      const item = tree.shadowRoot!.querySelector('snice-tree-item') as any;
      const iconContainer = item.shadowRoot.querySelector('.tree-item__icon') as HTMLElement;

      expect(iconContainer.querySelector('img')).toBeNull();
      expect(iconContainer.style.display).toBe('none');
      expect(item.shadowRoot.querySelectorAll('.tree-item__content').length).toBe(1);
      expect(item.shadowRoot.querySelector('.tree-item__label')?.textContent).toBe('No icon');
    });

    it('falls back to text after an image error and retries a changed source', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = [{ id: 'fallback', label: 'Fallback', icon: '📄', iconImage: '/missing.png' }];
      await wait(50);

      const firstItem = tree.shadowRoot!.querySelector('snice-tree-item') as any;
      const firstImage = firstItem.shadowRoot.querySelector('img') as HTMLImageElement;
      firstImage.dispatchEvent(new Event('error'));
      await firstItem.rendered;

      expect(firstItem.shadowRoot.querySelector('img')).toBeNull();
      expect(firstItem.shadowRoot.querySelector('[part="icon-text"]')?.textContent).toBe('📄');

      tree.updateNode('fallback', { iconImage: '/replacement.png' });
      await wait(50);
      const replacementItem = tree.shadowRoot!.querySelector('snice-tree-item') as any;
      const replacementImage = replacementItem.shadowRoot.querySelector('img') as HTMLImageElement;
      expect(replacementImage.getAttribute('src')).toBe('/replacement.png');
    });

    it('keeps nested adversarial icons inert without damaging siblings or hierarchy', async () => {
      const maliciousIcon = '<svg data-tree-injected="nested"><script>globalThis.__treeInjected++</script></svg>';
      const maliciousImage = 'x" onerror="globalThis.__treeInjected++" data-tree-injected="nested-image';
      (globalThis as any).__treeInjected = 0;
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = [{
        id: 'root', label: 'Root', icon: '📁', expanded: true, children: [
          { id: 'branch', label: 'Branch', icon: '📁', expanded: true, children: [
            { id: 'leaf', label: 'Leaf', icon: maliciousIcon, iconImage: maliciousImage },
            { id: 'sibling', label: 'Sibling', icon: '📄' }
          ] }
        ]
      }];
      await wait(100);

      const root = tree.shadowRoot!.querySelector('snice-tree-item') as any;
      const branch = root.shadowRoot.querySelector('.tree-item__children > snice-tree-item') as any;
      const leaves = branch.shadowRoot.querySelectorAll('.tree-item__children > snice-tree-item');
      const leaf = leaves[0] as any;
      const sibling = leaves[1] as any;

      expect(leaves.length).toBe(2);
      expect(leaf.shadowRoot.querySelector('.tree-item__label')?.textContent).toBe('Leaf');
      expect(leaf.shadowRoot.querySelector('[part="icon-text"]')?.textContent).toBe(maliciousIcon);
      expect(leaf.shadowRoot.querySelector('.tree-item__icon img')).toBeNull();
      expect(leaf.shadowRoot.querySelector('[data-tree-injected]')).toBeNull();
      expect(sibling.shadowRoot.querySelector('.tree-item__label')?.textContent).toBe('Sibling');
      expect(root.expanded).toBe(true);
      expect(branch.expanded).toBe(true);
      expect((globalThis as any).__treeInjected).toBe(0);
    });

    it('preserves keyed child identity and safe rendering across same-object rerenders', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      const nodes = [{
        id: 'root', label: 'Root', expanded: true, children: [
          { id: 'alpha', label: 'Alpha', icon: 'A' },
          { id: 'beta', label: 'Beta', icon: 'B' }
        ]
      }];
      tree.nodes = nodes;
      await wait(50);

      const root = tree.shadowRoot!.querySelector('snice-tree-item') as any;
      const before = Array.from(root.shadowRoot.querySelectorAll('.tree-item__children > snice-tree-item')) as any[];
      const alpha = before[0];
      const beta = before[1];
      nodes[0].children.reverse();
      nodes[0].children[0].icon = '<img data-tree-injected="rerender" src=x>';
      root.setNode(nodes[0], 0, 1, 1);
      await root.rendered;
      await wait(20);

      const after = Array.from(root.shadowRoot.querySelectorAll('.tree-item__children > snice-tree-item')) as any[];
      expect(after[0]).toBe(beta);
      expect(after[1]).toBe(alpha);
      expect(after[0].shadowRoot.querySelector('[part="icon-text"]')?.textContent).toBe('<img data-tree-injected="rerender" src=x>');
      expect(after[0].shadowRoot.querySelector('[data-tree-injected]')).toBeNull();
      expect(after[1].shadowRoot.querySelector('.tree-item__label')?.textContent).toBe('Alpha');
    });

    it('reacts to runtime showIcons changes throughout nested nodes', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = [{ id: 'root', label: 'Root', icon: '📁', expanded: true, children: [
        { id: 'child', label: 'Child', icon: '📄' }
      ] }];
      await wait(50);

      const root = tree.shadowRoot!.querySelector('snice-tree-item') as any;
      const child = root.shadowRoot.querySelector('.tree-item__children > snice-tree-item') as any;
      tree.showIcons = false;
      await wait(30);
      expect((root.shadowRoot.querySelector('.tree-item__icon') as HTMLElement).style.display).toBe('none');
      expect((child.shadowRoot.querySelector('.tree-item__icon') as HTMLElement).style.display).toBe('none');

      tree.showIcons = true;
      await wait(30);
      expect((root.shadowRoot.querySelector('.tree-item__icon') as HTMLElement).style.display).toBe('');
      expect((child.shadowRoot.querySelector('.tree-item__icon') as HTMLElement).style.display).toBe('');
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

  describe('registry icons', () => {
    it('should render registry icon names as SVGs', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = [{ id: 'settings', label: 'Settings', icon: 'cog-6-tooth' }];
      await wait(80);

      const item = tree.shadowRoot!.querySelector('snice-tree-item') as any;
      const iconText = item.shadowRoot.querySelector('[part="icon-text"]');
      expect(iconText?.querySelector('svg')).toBeTruthy();
      expect(iconText?.textContent?.trim()).not.toBe('cog-6-tooth');
    });

    it('should still render plain text icons as text', async () => {
      tree = await createComponent<SniceTreeElement>('snice-tree');
      tree.nodes = [{ id: 'txt', label: 'Text icon', icon: '📄' }];
      await wait(80);

      const item = tree.shadowRoot!.querySelector('snice-tree-item') as any;
      expect(item.shadowRoot.querySelector('[part="icon-text"]')?.textContent).toContain('📄');
    });
  });
});
