import { element, property, render, styles, dispatch, query, watch, html, css } from 'snice';
import type {
  DocBlock,
  BlockType,
  InlineFormat,
  EditorSelection,
  BlockMenuItem,
  SniceDocElement,
  SniceDocEventMap,
} from './snice-doc.types';
import cssContent from './snice-doc.css?inline';

/**
 * Generate unique ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Block menu items
 */
const BLOCK_MENU_ITEMS: BlockMenuItem[] = [
  {
    type: 'paragraph',
    label: 'Paragraph',
    icon: '¶',
    keywords: ['text', 'paragraph', 'p'],
  },
  {
    type: 'heading-1',
    label: 'Heading 1',
    icon: 'H1',
    keywords: ['h1', 'heading', 'title'],
  },
  {
    type: 'heading-2',
    label: 'Heading 2',
    icon: 'H2',
    keywords: ['h2', 'heading', 'subtitle'],
  },
  {
    type: 'heading-3',
    label: 'Heading 3',
    icon: 'H3',
    keywords: ['h3', 'heading'],
  },
  {
    type: 'bulleted-list',
    label: 'Bulleted List',
    icon: '•',
    keywords: ['ul', 'list', 'bullet'],
  },
  {
    type: 'numbered-list',
    label: 'Numbered List',
    icon: '1.',
    keywords: ['ol', 'list', 'number'],
  },
  {
    type: 'todo',
    label: 'To-do List',
    icon: '☐',
    keywords: ['todo', 'checkbox', 'task'],
  },
  {
    type: 'code',
    label: 'Code Block',
    icon: '</>',
    keywords: ['code', 'snippet'],
  },
  {
    type: 'quote',
    label: 'Quote',
    icon: '"',
    keywords: ['quote', 'blockquote'],
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: '―',
    keywords: ['divider', 'separator', 'hr'],
  },
];

/**
 * snice-doc - Document editor component
 *
 * A Notion-like document editor with block-based editing
 *
 * @element snice-doc
 *
 * @fires {CustomEvent<{ blocks: DocBlock[] }>} doc-change - Fires when document changes
 * @fires {CustomEvent<{ blockId: string }>} doc-focus - Fires when a block receives focus
 * @fires {CustomEvent<{ blockId: string }>} doc-blur - Fires when a block loses focus
 */
@element('snice-doc')
export class SniceDoc extends HTMLElement implements SniceDocElement {
  @property({ type: Array, attribute: false })
  blocks: DocBlock[] = [{ id: generateId(), type: 'paragraph', content: '', formats: [] }];

  @property({ type: String })
  placeholder: string = "Type '/' for commands...";

  @property({ type: Boolean })
  readonly: boolean = false;

  @query('.doc-container')
  private container!: HTMLElement;

  private selection: EditorSelection | null = null;
  private draggedBlock: string | null = null;
  private showBlockMenu: boolean = false;
  private blockMenuFilter: string = '';
  private blockMenuSelectedIndex: number = 0;
  private blockMenuBlockId: string = '';

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  connectedCallback() {
    super.connectedCallback?.();
    this.addEventListener('keydown', this.handleKeyDown);
    this.addEventListener('paste', this.handlePaste);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    this.removeEventListener('keydown', this.handleKeyDown);
    this.removeEventListener('paste', this.handlePaste);
  }

  @watch('blocks', { waitUntilFirstUpdate: true })
  private blocksChanged() {
    this.emitChange();
  }

  @dispatch('doc-change')
  private emitChange(): CustomEvent<{ blocks: DocBlock[] }> {
    return new CustomEvent('doc-change', {
      detail: { blocks: this.blocks },
      bubbles: true,
      composed: true,
    });
  }

  @dispatch('doc-focus')
  private emitFocus(blockId: string): CustomEvent<{ blockId: string }> {
    return new CustomEvent('doc-focus', {
      detail: { blockId },
      bubbles: true,
      composed: true,
    });
  }

  @dispatch('doc-blur')
  private emitBlur(blockId: string): CustomEvent<{ blockId: string }> {
    return new CustomEvent('doc-blur', {
      detail: { blockId },
      bubbles: true,
      composed: true,
    });
  }

  /**
   * Get current blocks
   */
  getBlocks(): DocBlock[] {
    return [...this.blocks];
  }

  /**
   * Set blocks
   */
  setBlocks(blocks: DocBlock[]): void {
    this.blocks = blocks.map((b) => ({ ...b }));
  }

  /**
   * Export as JSON
   */
  toJSON(): string {
    return JSON.stringify(this.blocks, null, 2);
  }

  /**
   * Import from JSON
   */
  fromJSON(json: string): void {
    try {
      const blocks = JSON.parse(json);
      if (Array.isArray(blocks)) {
        this.blocks = blocks;
      }
    } catch (error) {
      console.error('Failed to parse JSON:', error);
    }
  }

  /**
   * Export as Markdown
   */
  toMarkdown(): string {
    return this.blocks
      .map((block) => {
        switch (block.type) {
          case 'heading-1':
            return `# ${block.content}`;
          case 'heading-2':
            return `## ${block.content}`;
          case 'heading-3':
            return `### ${block.content}`;
          case 'bulleted-list':
            return `- ${block.content}`;
          case 'numbered-list':
            return `1. ${block.content}`;
          case 'todo':
            return `- [${block.checked ? 'x' : ' '}] ${block.content}`;
          case 'code':
            return `\`\`\`\n${block.content}\n\`\`\``;
          case 'quote':
            return `> ${block.content}`;
          case 'divider':
            return '---';
          default:
            return block.content;
        }
      })
      .join('\n\n');
  }

  /**
   * Export as HTML
   */
  toHTML(): string {
    return this.blocks
      .map((block) => {
        const content = this.escapeHtml(block.content);
        switch (block.type) {
          case 'heading-1':
            return `<h1>${content}</h1>`;
          case 'heading-2':
            return `<h2>${content}</h2>`;
          case 'heading-3':
            return `<h3>${content}</h3>`;
          case 'bulleted-list':
            return `<ul><li>${content}</li></ul>`;
          case 'numbered-list':
            return `<ol><li>${content}</li></ol>`;
          case 'todo':
            return `<input type="checkbox" ${block.checked ? 'checked' : ''}>${content}`;
          case 'code':
            return `<pre><code>${content}</code></pre>`;
          case 'quote':
            return `<blockquote>${content}</blockquote>`;
          case 'divider':
            return '<hr>';
          default:
            return `<p>${content}</p>`;
        }
      })
      .join('\n');
  }

  /**
   * Focus the editor
   */
  focus(): void {
    const firstBlock = this.shadowRoot?.querySelector('.block-content') as HTMLElement;
    firstBlock?.focus();
  }

  /**
   * Clear all content
   */
  clear(): void {
    this.blocks = [{ id: generateId(), type: 'paragraph', content: '', formats: [] }];
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.readonly) return;

    const target = e.target as HTMLElement;
    if (!target.classList.contains('block-content')) return;

    const blockId = target.dataset.blockId!;
    const block = this.blocks.find((b) => b.id === blockId);
    if (!block) return;

    // Handle block menu navigation
    if (this.showBlockMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.blockMenuSelectedIndex = Math.min(
          this.blockMenuSelectedIndex + 1,
          this.getFilteredBlockMenuItems().length - 1
        );
        ;
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.blockMenuSelectedIndex = Math.max(this.blockMenuSelectedIndex - 1, 0);
        ;
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const items = this.getFilteredBlockMenuItems();
        if (items[this.blockMenuSelectedIndex]) {
          this.selectBlockType(this.blockMenuBlockId, items[this.blockMenuSelectedIndex].type);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.hideBlockMenu();
        return;
      }
    }

    // Enter - create new block
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.createNewBlock(blockId);
      return;
    }

    // Backspace on empty block - remove block
    if (e.key === 'Backspace' && block.content === '' && this.blocks.length > 1) {
      e.preventDefault();
      this.removeBlock(blockId);
      return;
    }

    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        this.toggleFormat('bold');
      } else if (e.key === 'i') {
        e.preventDefault();
        this.toggleFormat('italic');
      } else if (e.key === 'u') {
        e.preventDefault();
        this.toggleFormat('underline');
      }
    }
  };

  private handlePaste = (e: ClipboardEvent) => {
    if (this.readonly) return;
    // Allow default paste behavior for now
    // Could add special handling for HTML/markdown paste
  };

  private handleInput(blockId: string, e: Event) {
    if (this.readonly) return;

    const target = e.target as HTMLElement;
    const content = target.textContent || '';

    const blockIndex = this.blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;

    // Check for block menu trigger
    if (content.startsWith('/')) {
      this.showBlockMenuFor(blockId, content.slice(1));
    } else {
      this.hideBlockMenu();
    }

    // Update block content
    this.blocks = this.blocks.map((b) =>
      b.id === blockId ? { ...b, content: content } : b
    );
  }

  private handleFocus(blockId: string) {
    this.emitFocus(blockId);
  }

  private handleBlur(blockId: string) {
    this.emitBlur(blockId);
  }

  private createNewBlock(afterBlockId: string) {
    const index = this.blocks.findIndex((b) => b.id === afterBlockId);
    if (index === -1) return;

    const newBlock: DocBlock = {
      id: generateId(),
      type: 'paragraph',
      content: '',
      formats: [],
    };

    this.blocks = [
      ...this.blocks.slice(0, index + 1),
      newBlock,
      ...this.blocks.slice(index + 1),
    ];

    // Focus new block
    setTimeout(() => {
      const el = this.shadowRoot?.querySelector(
        `[data-block-id="${newBlock.id}"]`
      ) as HTMLElement;
      el?.focus();
    });
  }

  private removeBlock(blockId: string) {
    const index = this.blocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;

    this.blocks = this.blocks.filter((b) => b.id !== blockId);

    // Focus previous block
    if (index > 0) {
      setTimeout(() => {
        const prevBlock = this.blocks[index - 1];
        const el = this.shadowRoot?.querySelector(
          `[data-block-id="${prevBlock.id}"]`
        ) as HTMLElement;
        el?.focus();
      });
    }
  }

  private toggleFormat(format: InlineFormat) {
    // TODO: Implement inline formatting
    console.log('Toggle format:', format);
  }

  private showBlockMenuFor(blockId: string, filter: string) {
    this.showBlockMenu = true;
    this.blockMenuBlockId = blockId;
    this.blockMenuFilter = filter;
    this.blockMenuSelectedIndex = 0;
    ;
  }

  private hideBlockMenu() {
    this.showBlockMenu = false;
    this.blockMenuFilter = '';
    this.blockMenuSelectedIndex = 0;
    ;
  }

  private getFilteredBlockMenuItems(): BlockMenuItem[] {
    if (!this.blockMenuFilter) return BLOCK_MENU_ITEMS;
    const filter = this.blockMenuFilter.toLowerCase();
    return BLOCK_MENU_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(filter) ||
        item.keywords.some((k) => k.includes(filter))
    );
  }

  private selectBlockType(blockId: string, type: BlockType) {
    this.blocks = this.blocks.map((b) =>
      b.id === blockId ? { ...b, type, content: '' } : b
    );
    this.hideBlockMenu();

    // Focus the block
    setTimeout(() => {
      const el = this.shadowRoot?.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
      el?.focus();
    });
  }

  private handleBlockMenuItemClick(blockId: string, type: BlockType) {
    this.selectBlockType(blockId, type);
  }

  private handleTodoToggle(blockId: string) {
    if (this.readonly) return;
    this.blocks = this.blocks.map((b) =>
      b.id === blockId ? { ...b, checked: !b.checked } : b
    );
  }

  private handleDragStart(blockId: string, e: DragEvent) {
    if (this.readonly) return;
    this.draggedBlock = blockId;
    e.dataTransfer!.effectAllowed = 'move';
  }

  private handleDragOver(blockId: string, e: DragEvent) {
    if (this.readonly) return;
    if (!this.draggedBlock || this.draggedBlock === blockId) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
  }

  private handleDrop(blockId: string, e: DragEvent) {
    if (this.readonly) return;
    e.preventDefault();

    if (!this.draggedBlock || this.draggedBlock === blockId) return;

    const draggedIndex = this.blocks.findIndex((b) => b.id === this.draggedBlock);
    const targetIndex = this.blocks.findIndex((b) => b.id === blockId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newBlocks = [...this.blocks];
    const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, draggedBlock);

    this.blocks = newBlocks;
    this.draggedBlock = null;
  }

  private handleDragEnd() {
    this.draggedBlock = null;
  }

  @render()
  render() {
    return html`
      <div class="doc-container">
        ${this.blocks.map((block, index) => this.renderBlock(block, index))}
        ${this.showBlockMenu ? this.renderBlockMenu() : ''}
      </div>
    `;
  }

  private renderBlock(block: DocBlock, index: number) {
    const placeholder = index === 0 && !block.content ? this.placeholder : "Type '/' for commands";
    const isDivider = block.type === 'divider';

    if (isDivider) {
      return html`
        <div class="doc-block block-divider" data-block-id="${block.id}">
          <div
            class="block-handle"
            draggable="${!this.readonly}"
            @dragstart="${(e: DragEvent) => this.handleDragStart(block.id, e)}"
            @dragend="${() => this.handleDragEnd()}"
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <circle cx="3" cy="3" r="1.5" />
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="3" cy="8" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="3" cy="13" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </div>
        </div>
      `;
    }

    const isTodo = block.type === 'todo';
    const isNumberedList = block.type === 'numbered-list';

    return html`
      <div
        class="doc-block block-${block.type} ${block.checked ? 'checked' : ''} ${this
          .draggedBlock === block.id
          ? 'dragging'
          : ''}"
        data-block-id="${block.id}"
        @dragover="${(e: DragEvent) => this.handleDragOver(block.id, e)}"
        @drop="${(e: DragEvent) => this.handleDrop(block.id, e)}"
        data-number="${isNumberedList ? index + 1 : ''}"
      >
        <div
          class="block-handle"
          draggable="${!this.readonly}"
          @dragstart="${(e: DragEvent) => this.handleDragStart(block.id, e)}"
          @dragend="${() => this.handleDragEnd()}"
        >
          <svg viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3" cy="3" r="1.5" />
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="3" cy="13" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </div>
        ${isTodo
          ? html`<input
              type="checkbox"
              class="todo-checkbox"
              ?checked="${block.checked}"
              @change="${() => this.handleTodoToggle(block.id)}"
            />`
          : ''}
        <div
          class="block-content"
          contenteditable="${!this.readonly}"
          data-block-id="${block.id}"
          data-placeholder="${placeholder}"
          @input="${(e: Event) => this.handleInput(block.id, e)}"
          @focus="${() => this.handleFocus(block.id)}"
          @blur="${() => this.handleBlur(block.id)}"
        >
          ${block.content}
        </div>
      </div>
    `;
  }

  private renderBlockMenu() {
    const items = this.getFilteredBlockMenuItems();

    return html`
      <div class="block-menu">
        ${items.map(
          (item, index) => html`
            <div
              class="block-menu-item ${index === this.blockMenuSelectedIndex ? 'selected' : ''}"
              @click="${() => this.handleBlockMenuItemClick(this.blockMenuBlockId, item.type)}"
            >
              <div class="block-menu-icon">${item.icon}</div>
              <div class="block-menu-label">${item.label}</div>
            </div>
          `
        )}
        ${items.length === 0
          ? html`<div class="block-menu-item">
              <div class="block-menu-label">No results</div>
            </div>`
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-doc': SniceDoc;
  }
  interface HTMLElementEventMap extends SniceDocEventMap {}
}
