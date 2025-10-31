import { element, property, styles, ready, dispose, css } from 'snice';
import cssContent from './snice-doc.css?inline';

/**
 * snice-doc - Simple document editor
 */
@element('snice-doc')
export class SniceDoc extends HTMLElement {
  @property({ type: String })
  placeholder: string = 'Start typing...';

  @property({ type: Boolean })
  readonly: boolean = false;

  private editor!: HTMLDivElement;
  private showFormatToolbar: boolean = false;
  private formatToolbarPosition: { top: number; left: number } | null = null;
  private savedSelection: Range | null = null;

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    this.initializeDOM();
    document.addEventListener('selectionchange', this.handleSelectionChange);

    // Save selection whenever editor loses focus
    this.editor.addEventListener('blur', this.saveCurrentSelection);
  }

  @dispose()
  cleanup() {
    document.removeEventListener('selectionchange', this.handleSelectionChange);
    this.editor.removeEventListener('blur', this.saveCurrentSelection);
  }

  private initializeDOM() {
    if (!this.shadowRoot) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'doc-wrapper';

    // Create toolbar
    const toolbar = this.createToolbar();
    wrapper.appendChild(toolbar);

    // Create editor
    this.editor = document.createElement('div');
    this.editor.className = 'doc-editor';
    this.editor.contentEditable = String(!this.readonly);
    this.editor.setAttribute('data-placeholder', this.placeholder);

    // Add default paragraph
    const p = document.createElement('p');
    p.innerHTML = '<br>'; // Placeholder for empty paragraph
    this.editor.appendChild(p);

    this.editor.addEventListener('paste', this.handlePaste);
    this.editor.addEventListener('keyup', this.saveCurrentSelection);
    this.editor.addEventListener('mouseup', this.saveCurrentSelection);
    this.editor.addEventListener('click', this.saveCurrentSelection);
    wrapper.appendChild(this.editor);
    this.shadowRoot.appendChild(wrapper);
  }

  private createToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';

    const tools = [
      { cmd: 'bold', label: 'B', title: 'Bold (Ctrl+B)' },
      { cmd: 'italic', label: 'I', title: 'Italic (Ctrl+I)' },
      { cmd: 'underline', label: 'U', title: 'Underline (Ctrl+U)' },
      { cmd: 'strikeThrough', label: 'S', title: 'Strikethrough' },
      { cmd: 'divider' },
      { cmd: 'formatBlock', value: 'h1', label: 'H1', title: 'Heading 1' },
      { cmd: 'formatBlock', value: 'h2', label: 'H2', title: 'Heading 2' },
      { cmd: 'formatBlock', value: 'h3', label: 'H3', title: 'Heading 3' },
      { cmd: 'formatBlock', value: 'p', label: 'P', title: 'Paragraph' },
      { cmd: 'divider' },
      { cmd: 'insertUnorderedList', label: '•', title: 'Bullet List' },
      { cmd: 'insertOrderedList', label: '1.', title: 'Numbered List' },
      { cmd: 'divider' },
      { cmd: 'createLink', label: '🔗', title: 'Insert Link' },
      { cmd: 'insertImage', label: '🖼', title: 'Insert Image' },
      { cmd: 'insertTable', label: '📊', title: 'Insert Table' },
      { cmd: 'insertDivider', label: '―', title: 'Insert Divider' },
    ];

    tools.forEach(tool => {
      if (tool.cmd === 'divider') {
        const divider = document.createElement('div');
        divider.className = 'toolbar-divider';
        toolbar.appendChild(divider);
      } else {
        const btn = document.createElement('button');
        btn.className = 'toolbar-btn';
        btn.textContent = tool.label || '';
        btn.title = tool.title || '';
        btn.addEventListener('click', () => this.execCommand(tool.cmd, tool.value));
        toolbar.appendChild(btn);
      }
    });

    toolbar.addEventListener('mousedown', this.saveSelectionBeforeAction);
    return toolbar;
  }

  private execCommand(cmd: string, value?: string) {
    this.editor.focus();

    switch (cmd) {
      case 'createLink':
        this.showLinkDialog();
        break;
      case 'insertImage':
        this.insertImage();
        break;
      case 'insertTable':
        this.insertTable();
        break;
      case 'insertDivider':
        this.insertDivider();
        break;
      default:
        document.execCommand(cmd, false, value);
        break;
    }
  }

  private showLinkDialog() {
    const dialog = document.createElement('snice-modal');
    dialog.setAttribute('title', 'Insert Link');

    const content = document.createElement('div');
    content.style.padding = '20px';

    const input = document.createElement('snice-input') as any;
    input.setAttribute('label', 'URL');
    input.setAttribute('placeholder', 'https://example.com');
    input.style.width = '100%';
    content.appendChild(input);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '10px';
    actions.style.justifyContent = 'flex-end';
    actions.style.marginTop = '20px';

    const cancelBtn = document.createElement('snice-button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.setAttribute('variant', 'secondary');
    cancelBtn.addEventListener('click', () => {
      dialog.remove();
    });
    actions.appendChild(cancelBtn);

    const insertBtn = document.createElement('snice-button');
    insertBtn.textContent = 'Insert';
    insertBtn.addEventListener('click', () => {
      const url = input.value;
      if (url) {
        this.restoreSelection();
        document.execCommand('createLink', false, url);
      }
      dialog.remove();
    });
    actions.appendChild(insertBtn);

    content.appendChild(actions);
    dialog.appendChild(content);

    document.body.appendChild(dialog);

    // Wait for components to be ready, then show modal
    customElements.whenDefined('snice-modal').then(() => {
      requestAnimationFrame(() => {
        (dialog as any).show();
        setTimeout(() => input.focus(), 100);
      });
    });
  }

  private insertImage() {
    this.showImageDialog();
  }

  private showImageDialog() {
    const dialog = document.createElement('snice-modal');
    dialog.setAttribute('title', 'Insert Image');

    const content = document.createElement('div');
    content.style.padding = '20px';

    const input = document.createElement('snice-input') as any;
    input.setAttribute('label', 'Image URL');
    input.setAttribute('placeholder', 'https://example.com/image.jpg');
    input.style.width = '100%';
    content.appendChild(input);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '10px';
    actions.style.justifyContent = 'flex-end';
    actions.style.marginTop = '20px';

    const cancelBtn = document.createElement('snice-button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.setAttribute('variant', 'secondary');
    cancelBtn.addEventListener('click', () => {
      dialog.remove();
    });
    actions.appendChild(cancelBtn);

    const insertBtn = document.createElement('snice-button');
    insertBtn.textContent = 'Insert';
    insertBtn.addEventListener('click', () => {
      const url = input.value;
      if (url) {
        this.doInsertImage(url);
      }
      dialog.remove();
    });
    actions.appendChild(insertBtn);

    content.appendChild(actions);
    dialog.appendChild(content);

    document.body.appendChild(dialog);

    // Wait for components to be ready, then show modal
    customElements.whenDefined('snice-modal').then(() => {
      requestAnimationFrame(() => {
        (dialog as any).show();
        setTimeout(() => input.focus(), 100);
      });
    });
  }

  private doInsertImage(url: string) {
    this.restoreSelection();
    this.editor.focus();

    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '10px 0';

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      if (!this.editor.contains(range.commonAncestorContainer)) {
        this.editor.appendChild(img);
      } else {
        range.insertNode(img);
        range.setStartAfter(img);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else {
      this.editor.appendChild(img);
    }
  }

  private insertTable() {
    this.showTableDialog();
  }

  private showTableDialog() {
    const dialog = document.createElement('snice-modal');
    dialog.setAttribute('title', 'Insert Table');

    const content = document.createElement('div');
    content.style.padding = '20px';

    const rowsInput = document.createElement('snice-input') as any;
    rowsInput.setAttribute('label', 'Rows');
    rowsInput.setAttribute('type', 'number');
    rowsInput.setAttribute('value', '3');
    rowsInput.style.width = '100%';
    rowsInput.style.marginBottom = '15px';
    content.appendChild(rowsInput);

    const colsInput = document.createElement('snice-input') as any;
    colsInput.setAttribute('label', 'Columns');
    colsInput.setAttribute('type', 'number');
    colsInput.setAttribute('value', '3');
    colsInput.style.width = '100%';
    content.appendChild(colsInput);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '10px';
    actions.style.justifyContent = 'flex-end';
    actions.style.marginTop = '20px';

    const cancelBtn = document.createElement('snice-button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.setAttribute('variant', 'secondary');
    cancelBtn.addEventListener('click', () => {
      dialog.remove();
    });
    actions.appendChild(cancelBtn);

    const insertBtn = document.createElement('snice-button');
    insertBtn.textContent = 'Insert';
    insertBtn.addEventListener('click', () => {
      const rows = parseInt(rowsInput.value) || 3;
      const cols = parseInt(colsInput.value) || 3;
      this.doInsertTable(rows, cols);
      dialog.remove();
    });
    actions.appendChild(insertBtn);

    content.appendChild(actions);
    dialog.appendChild(content);

    document.body.appendChild(dialog);

    // Wait for components to be ready, then show modal
    customElements.whenDefined('snice-modal').then(() => {
      // Use connectedCallback to ensure the component is fully initialized
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          (dialog as any).open = true;
          setTimeout(() => rowsInput.focus(), 100);
        });
      });
    });
  }

  private doInsertTable(rows: number, cols: number) {
    this.restoreSelection();
    this.editor.focus();

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.margin = '10px 0';

    for (let i = 0; i < rows; i++) {
      const tr = document.createElement('tr');
      for (let j = 0; j < cols; j++) {
        const td = document.createElement('td');
        td.style.border = '1px solid #ddd';
        td.style.padding = '8px';
        td.innerHTML = '<br>';
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      if (!this.editor.contains(range.commonAncestorContainer)) {
        this.editor.appendChild(table);
      } else {
        range.insertNode(table);
        range.setStartAfter(table);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else {
      this.editor.appendChild(table);
    }
  }

  private insertDivider() {
    this.restoreSelection();
    this.editor.focus();

    const hr = document.createElement('hr');
    hr.style.margin = '20px 0';
    hr.style.border = 'none';
    hr.style.borderTop = '1px solid #e1e4e8';

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // Check if the range is within the editor
      if (!this.editor.contains(range.commonAncestorContainer)) {
        this.editor.appendChild(hr);
      } else {
        range.insertNode(hr);
        range.setStartAfter(hr);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else {
      this.editor.appendChild(hr);
    }
  }

  private handlePaste = (e: ClipboardEvent) => {
    if (this.readonly) return;

    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = (event.target?.result as string) || null;
              if (!dataUrl) return;
              const img = document.createElement('img');
              img.src = dataUrl;
              img.style.maxWidth = '100%';
              img.style.height = 'auto';

              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.insertNode(img);
                range.setStartAfter(img);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
              }
            };
            reader.readAsDataURL(blob);
          }
          return;
        }
      }
    }
  };

  private saveCurrentSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // Just save it - we'll validate when restoring
      this.savedSelection = range.cloneRange();
    }
  };

  private saveSelectionBeforeAction = (e: MouseEvent) => {
    // Save selection before clicking toolbar/sidebar buttons
    this.saveCurrentSelection();
  };

  private restoreSelection() {
    if (this.savedSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(this.savedSelection);
      }
    }
  }

  private handleSelectionChange = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return;
    }

    // Check if selection is within our editor
    const range = selection.getRangeAt(0);
    if (!this.editor.contains(range.commonAncestorContainer)) {
      return;
    }

    // Could add floating toolbar here if desired
  };

  /**
   * Get document HTML
   */
  getHTML(): string {
    return this.editor.innerHTML;
  }

  /**
   * Set document HTML
   */
  setHTML(html: string) {
    this.editor.innerHTML = html;
  }

  /**
   * Clear document
   */
  clear() {
    this.editor.innerHTML = '<p><br></p>';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-doc': SniceDoc;
  }
}
