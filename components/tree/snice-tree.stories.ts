import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-tree';

type Args = {
  selectionMode?: 'single' | 'multiple' | 'none';
  showCheckboxes?: boolean;
  showIcons?: boolean;
  expandOnClick?: boolean;
};

const fileTree = [
  {
    id: 'src', label: 'src', icon: '📁', expanded: true,
    children: [
      { id: 'index.ts', label: 'index.ts', icon: '📄' },
      { id: 'main.ts', label: 'main.ts', icon: '📄' },
      {
        id: 'components', label: 'components', icon: '📁',
        children: [
          { id: 'button.ts', label: 'button.ts', icon: '📄' },
          { id: 'input.ts', label: 'input.ts', icon: '📄' },
          { id: 'modal.ts', label: 'modal.ts', icon: '📄' },
        ],
      },
    ],
  },
  {
    id: 'tests', label: 'tests', icon: '📁',
    children: [
      { id: 'button.test.ts', label: 'button.test.ts', icon: '📄' },
      { id: 'input.test.ts', label: 'input.test.ts', icon: '📄' },
    ],
  },
  { id: 'package.json', label: 'package.json', icon: '📄' },
  { id: 'README.md', label: 'README.md', icon: '📄' },
];

function makeTree(attrs: Record<string, boolean | string> = {}, nodes = fileTree): HTMLElement {
  const box = document.createElement('div');
  box.style.cssText = 'max-width:400px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;padding:1rem;';
  const tree = document.createElement('snice-tree') as any;
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) tree.toggleAttribute(k, true); }
    else tree.setAttribute(k, String(v));
  }
  tree.nodes = JSON.parse(JSON.stringify(nodes));
  box.appendChild(tree);
  return box;
}

const meta: Meta<Args> = {
  title: 'Tree',
  component: 'snice-tree',
  tags: ['autodocs'],
  argTypes: {
    selectionMode:  { control: 'select', options: ['single', 'multiple', 'none'] },
    showCheckboxes: { control: 'boolean' },
    showIcons:      { control: 'boolean' },
    expandOnClick:  { control: 'boolean' },
  },
  render: (args) => {
    const box = document.createElement('div');
    box.style.cssText = 'max-width:400px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;padding:1rem;';
    const tree = document.createElement('snice-tree') as any;
    if (args.selectionMode !== undefined) tree.setAttribute('selection-mode', String(args.selectionMode));
    if (args.showCheckboxes) tree.toggleAttribute('show-checkboxes', true);
    if (args.showIcons)      tree.toggleAttribute('show-icons', true);
    if (args.expandOnClick)  tree.toggleAttribute('expand-on-click', true);
    tree.nodes = JSON.parse(JSON.stringify(fileTree));
    box.appendChild(tree);
    return box;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { selectionMode: 'single' },
};

// h2: Selection Mode: single (default)
export const SelectionModeSingleDefault: Story = {
  render: () => makeTree({ 'selection-mode': 'single' }),
};

// h2: Selection Mode: multiple
export const SelectionModeMultiple: Story = {
  render: () => makeTree({ 'selection-mode': 'multiple' }),
};

// h2: Selection Mode: none
export const SelectionModeNone: Story = {
  render: () => makeTree({ 'selection-mode': 'none' }),
};

// h2: Show Checkboxes
export const ShowCheckboxes: Story = {
  render: () => makeTree({ 'show-checkboxes': true, 'selection-mode': 'multiple' }),
};

// h2: Show Icons: true (default) vs false
export const ShowIconsTrueDefaultVsFalse: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:1.5rem;';

    const box1 = document.createElement('div');
    box1.style.cssText = 'border:1px solid rgba(128,128,128,0.2);border-radius:8px;padding:1rem;';
    const lbl1 = document.createElement('div');
    lbl1.style.cssText = 'font-size:0.7rem;color:#888;margin-bottom:0.5rem;';
    lbl1.textContent = 'show-icons (default)';
    const tree1 = document.createElement('snice-tree') as any;
    tree1.toggleAttribute('show-icons', true);
    tree1.nodes = JSON.parse(JSON.stringify(fileTree));
    box1.appendChild(lbl1);
    box1.appendChild(tree1);

    const box2 = document.createElement('div');
    box2.style.cssText = 'border:1px solid rgba(128,128,128,0.2);border-radius:8px;padding:1rem;';
    const lbl2 = document.createElement('div');
    lbl2.style.cssText = 'font-size:0.7rem;color:#888;margin-bottom:0.5rem;';
    lbl2.textContent = 'show-icons=false';
    const tree2 = document.createElement('snice-tree') as any;
    const noIcons = JSON.parse(JSON.stringify(fileTree));
    const stripIcons = (nodes: any[]) => nodes.forEach((n: any) => { delete n.icon; if (n.children) stripIcons(n.children); });
    stripIcons(noIcons);
    tree2.nodes = noIcons;
    box2.appendChild(lbl2);
    box2.appendChild(tree2);

    wrap.appendChild(box1);
    wrap.appendChild(box2);
    return wrap;
  },
};

// h2: Expand on Click
export const ExpandOnClick: Story = {
  render: () => makeTree({ 'expand-on-click': true }),
};

// h2: Show Checkboxes + Show Icons + Expand on Click
export const ShowCheckboxesShowIconsExpandOnClick: Story = {
  render: () => makeTree({ 'show-checkboxes': true, 'show-icons': true, 'expand-on-click': true, 'selection-mode': 'multiple' }),
};

// h2: Pre-expanded Nodes
export const PreExpandedNodes: Story = {
  render: () => {
    const expanded = JSON.parse(JSON.stringify(fileTree));
    expanded[0].expanded = true;
    expanded[0].children[2].expanded = true;
    expanded[1].expanded = true;
    return makeTree({}, expanded);
  },
};

// h2: Disabled Nodes
export const DisabledNodes: Story = {
  render: () => {
    const nodes = JSON.parse(JSON.stringify(fileTree));
    nodes[0].children[1].disabled = true;
    nodes[0].children[2].children[0].disabled = true;
    return makeTree({ 'show-checkboxes': true }, nodes);
  },
};

// h2: Custom Icons (emoji)
export const CustomIconsEmoji: Story = {
  render: () => {
    const customNodes = [
      { id: '1', label: 'Documents', icon: '📚', expanded: true, children: [
        { id: '2', label: 'Resume.pdf', icon: '📃' },
        { id: '3', label: 'Photo.jpg', icon: '🖼️' },
        { id: '4', label: 'Music.mp3', icon: '🎵' },
      ]},
      { id: '5', label: 'Settings', icon: '⚙️', children: [
        { id: '6', label: 'Profile', icon: '👤' },
        { id: '7', label: 'Security', icon: '🔒' },
      ]},
      { id: '8', label: 'Trash', icon: '🗑️' },
    ];
    return makeTree({}, customNodes);
  },
};

// h2: Deeply Nested (4 levels)
export const DeeplyNested4Levels: Story = {
  render: () => {
    const deepNodes = [
      { id: 'l1', label: 'Level 1', icon: '📁', expanded: true, children: [
        { id: 'l2', label: 'Level 2', icon: '📁', expanded: true, children: [
          { id: 'l3', label: 'Level 3', icon: '📁', expanded: true, children: [
            { id: 'l4a', label: 'Level 4 - File A', icon: '📄' },
            { id: 'l4b', label: 'Level 4 - File B', icon: '📄' },
          ]},
          { id: 'l3b', label: 'Level 3 sibling', icon: '📄' },
        ]},
      ]},
    ];
    return makeTree({}, deepNodes);
  },
};

// h2: Flat (no children)
export const FlatNoChildren: Story = {
  render: () => {
    const flatNodes = [
      { id: 'a', label: 'Item A', icon: '📄' },
      { id: 'b', label: 'Item B', icon: '📄' },
      { id: 'c', label: 'Item C', icon: '📄' },
      { id: 'd', label: 'Item D', icon: '📄' },
    ];
    return makeTree({}, flatNodes);
  },
};

// h2: Single Node
export const SingleNode: Story = {
  render: () => makeTree({}, [{ id: 'only', label: 'Only Node', icon: '📄' }]),
};

// h2: Lazy Loading
export const LazyLoading: Story = {
  render: () => {
    const box = document.createElement('div');
    box.style.cssText = 'max-width:400px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;padding:1rem;';
    const lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:0.7rem;color:#888;margin-bottom:0.5rem;';
    lbl.textContent = 'Expand "Lazy Folder" to trigger lazy-load event';
    const tree = document.createElement('snice-tree') as any;
    tree.nodes = [
      { id: 'eager', label: 'Eager Folder', icon: '📁', children: [
        { id: 'file1', label: 'file1.ts', icon: '📄' },
      ]},
      { id: 'lazy', label: 'Lazy Folder', icon: '📁', lazy: true, children: [] },
    ];
    tree.addEventListener('tree-node-lazy-load', (e: CustomEvent) => {
      setTimeout(() => {
        tree.updateNode(e.detail.nodeId, {
          lazy: false,
          children: [
            { id: 'loaded1', label: 'Loaded File 1', icon: '📄' },
            { id: 'loaded2', label: 'Loaded File 2', icon: '📄' },
          ],
        });
      }, 1000);
    });
    box.appendChild(lbl);
    box.appendChild(tree);
    return box;
  },
};

// h2: Selectable: false
export const SelectableFalse: Story = {
  render: () => {
    const box = document.createElement('div');
    box.style.cssText = 'max-width:400px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;padding:1rem;';
    const lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:0.7rem;color:#888;margin-bottom:0.5rem;';
    lbl.textContent = 'selectable=false (clicking does not select)';
    const tree = document.createElement('snice-tree') as any;
    (tree as any).selectable = false;
    tree.nodes = JSON.parse(JSON.stringify(fileTree));
    box.appendChild(lbl);
    box.appendChild(tree);
    return box;
  },
};

// h2: CSS Parts Styling
// Parts available on snice-tree: container, content
// Parts available on snice-tree-item: content, loading, expander, checkbox, icon, label, children, icon-image, icon-text
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'tree-parts-demo';

    const style = document.createElement('style');
    style.textContent = `
      .tree-parts-demo { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start; }
      .tree-parts-demo .demo-label {
        font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.06em; color: #888; margin-bottom: 0.4rem;
      }

      /* Styled tree parts */
      .tree-parts-demo .styled-tree snice-tree::part(container) {
        background: #0a0f1e;
        border-radius: 10px;
        padding: 0.5rem;
        border: 1px solid #1e3356;
      }
      .tree-parts-demo .styled-tree snice-tree::part(content) {
        padding: 0.25rem 0;
      }
      .tree-parts-demo .styled-tree snice-tree-item::part(content) {
        border-radius: 6px;
        padding: 0.3rem 0.5rem;
        margin: 1px 0;
        transition: background 0.15s;
      }
      .tree-parts-demo .styled-tree snice-tree-item::part(content):hover {
        background: rgba(56, 139, 253, 0.12);
      }
      .tree-parts-demo .styled-tree snice-tree-item::part(expander) {
        color: #388bfd;
        font-size: 0.8rem;
        width: 1.2rem;
      }
      .tree-parts-demo .styled-tree snice-tree-item::part(label) {
        color: #c9d1d9;
        font-size: 0.875rem;
        font-family: 'Fira Code', monospace;
      }
      .tree-parts-demo .styled-tree snice-tree-item::part(icon) {
        font-size: 0.9rem;
        margin-right: 0.25rem;
      }
      .tree-parts-demo .styled-tree snice-tree-item::part(children) {
        border-left: 1px dashed #1e3356;
        margin-left: 0.5rem;
        padding-left: 0.5rem;
      }
    `;
    wrap.appendChild(style);

    const makeDemo = (label: string, cls: string): HTMLElement => {
      const box = document.createElement('div');
      const lbl = document.createElement('div');
      lbl.className = 'demo-label';
      lbl.textContent = label;
      box.appendChild(lbl);
      const outer = document.createElement('div');
      outer.style.cssText = 'max-width:360px;';
      if (cls) outer.classList.add(cls);
      const tree = document.createElement('snice-tree') as any;
      tree.toggleAttribute('show-icons', true);
      tree.nodes = JSON.parse(JSON.stringify(fileTree));
      outer.appendChild(tree);
      box.appendChild(outer);
      return box;
    };

    wrap.appendChild(makeDemo('Default (no ::part() styles)', ''));
    wrap.appendChild(makeDemo('Styled via ::part() — container, content, expander, label, icon, children', 'styled-tree'));

    return wrap;
  },
};
