import { element, property, styles, ready, dispose, css } from 'snice';
import cssContent from './snice-doc.css?inline';

type IconSet = 'default' | 'material' | 'fontawesome';

interface ToolDef {
  cmd: string;
  value?: string;
  icon?: string;
  title?: string;
}

const ICON_MAP: Record<IconSet, Record<string, string>> = {
  default: {
    bold: 'B', italic: 'I', underline: 'U', strikethrough: 'S',
    h1: 'H1', h2: 'H2', h3: 'H3', paragraph: 'P',
    'bullet-list': '•', 'numbered-list': '1.',
    link: '🔗', image: '🖼', table: '📊', divider: '―', download: '⬇'
  },
  material: {
    bold: 'format_bold', italic: 'format_italic', underline: 'format_underlined', strikethrough: 'strikethrough_s',
    h1: 'looks_one', h2: 'looks_two', h3: 'looks_3', paragraph: 'notes',
    'bullet-list': 'format_list_bulleted', 'numbered-list': 'format_list_numbered',
    link: 'link', image: 'image', table: 'table_chart', divider: 'horizontal_rule', download: 'download'
  },
  fontawesome: {
    bold: 'fa-bold', italic: 'fa-italic', underline: 'fa-underline', strikethrough: 'fa-strikethrough',
    h1: 'fa-heading', h2: 'fa-heading', h3: 'fa-heading', paragraph: 'fa-paragraph',
    'bullet-list': 'fa-list-ul', 'numbered-list': 'fa-list-ol',
    link: 'fa-link', image: 'fa-image', table: 'fa-table', divider: 'fa-minus', download: 'fa-download'
  }
};

const ICON_STYLESHEETS: Record<string, string> = {
  material: 'https://fonts.googleapis.com/icon?family=Material+Icons',
  fontawesome: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css'
};

/**
 * snice-doc - Simple document editor
 */
@element('snice-doc')
export class SniceDoc extends HTMLElement {
  @property({ type: String })
  placeholder: string = 'Start typing...';

  @property({ type: Boolean })
  readonly: boolean = false;

  @property({ type: String })
  icons: IconSet = 'default';

  @property({ type: String, attribute: 'icon-stylesheet' })
  iconStylesheet: string = '';

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
    this.editor.addEventListener('blur', this.saveCurrentSelection);
  }

  @dispose()
  cleanup() {
    document.removeEventListener('selectionchange', this.handleSelectionChange);
    this.editor.removeEventListener('blur', this.saveCurrentSelection);
  }

  private initializeDOM() {
    if (!this.shadowRoot) return;

    this.injectIconStylesheet();

    const wrapper = document.createElement('div');
    wrapper.className = 'doc-wrapper';

    const toolbar = this.createToolbar();
    wrapper.appendChild(toolbar);

    this.editor = document.createElement('div');
    this.editor.className = 'doc-editor';
    this.editor.contentEditable = String(!this.readonly);
    this.editor.setAttribute('data-placeholder', this.placeholder);

    const p = document.createElement('p');
    p.innerHTML = '<br>';
    this.editor.appendChild(p);

    this.editor.addEventListener('paste', this.handlePaste);
    this.editor.addEventListener('keyup', this.saveCurrentSelection);
    this.editor.addEventListener('mouseup', this.saveCurrentSelection);
    this.editor.addEventListener('click', this.saveCurrentSelection);
    wrapper.appendChild(this.editor);
    this.shadowRoot.appendChild(wrapper);
  }

  private injectIconStylesheet() {
    if (this.icons === 'default' || !this.shadowRoot) return;
    const url = this.iconStylesheet || ICON_STYLESHEETS[this.icons];
    if (!url) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    this.shadowRoot.prepend(link);
  }

  private createToolbarButton(icon: string, title: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'toolbar-btn';
    btn.title = title;

    const map = ICON_MAP[this.icons];
    const iconValue = map[icon] || icon;

    if (this.icons === 'material') {
      const span = document.createElement('span');
      span.className = 'material-icons';
      span.textContent = iconValue;
      btn.appendChild(span);
    } else if (this.icons === 'fontawesome') {
      const i = document.createElement('i');
      i.className = `fa-solid ${iconValue}`;
      btn.appendChild(i);
    } else {
      btn.textContent = iconValue;
    }

    return btn;
  }

  private createToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';

    const tools: ToolDef[] = [
      { cmd: 'bold', icon: 'bold', title: 'Bold (Ctrl+B)' },
      { cmd: 'italic', icon: 'italic', title: 'Italic (Ctrl+I)' },
      { cmd: 'underline', icon: 'underline', title: 'Underline (Ctrl+U)' },
      { cmd: 'strikeThrough', icon: 'strikethrough', title: 'Strikethrough' },
      { cmd: 'divider' },
      { cmd: 'formatBlock', value: 'h1', icon: 'h1', title: 'Heading 1' },
      { cmd: 'formatBlock', value: 'h2', icon: 'h2', title: 'Heading 2' },
      { cmd: 'formatBlock', value: 'h3', icon: 'h3', title: 'Heading 3' },
      { cmd: 'formatBlock', value: 'p', icon: 'paragraph', title: 'Paragraph' },
      { cmd: 'divider' },
      { cmd: 'insertUnorderedList', icon: 'bullet-list', title: 'Bullet List' },
      { cmd: 'insertOrderedList', icon: 'numbered-list', title: 'Numbered List' },
      { cmd: 'divider' },
      { cmd: 'createLink', icon: 'link', title: 'Insert Link' },
      { cmd: 'insertImage', icon: 'image', title: 'Insert Image' },
      { cmd: 'insertTable', icon: 'table', title: 'Insert Table' },
      { cmd: 'insertDivider', icon: 'divider', title: 'Insert Divider' },
      { cmd: 'divider' },
      { cmd: 'download', icon: 'download', title: 'Download' },
    ];

    tools.forEach(tool => {
      if (tool.cmd === 'divider') {
        const divider = document.createElement('div');
        divider.className = 'toolbar-divider';
        toolbar.appendChild(divider);
      } else {
        const btn = this.createToolbarButton(tool.icon!, tool.title!);
        btn.addEventListener('click', () => this.execCommand(tool.cmd, tool.value));
        toolbar.appendChild(btn);
      }
    });

    toolbar.addEventListener('mousedown', this.saveSelectionBeforeAction);
    return toolbar;
  }

  private execCommand(cmd: string, value?: string) {
    if (cmd === 'download') {
      this.showDownloadMenu();
      return;
    }

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

  private showDownloadMenu() {
    const existing = this.shadowRoot?.querySelector('.download-menu');
    if (existing) { existing.remove(); return; }

    const menu = document.createElement('div');
    menu.className = 'download-menu';

    const formats: { format: 'html' | 'markdown' | 'text'; label: string }[] = [
      { format: 'html', label: 'HTML (.html)' },
      { format: 'markdown', label: 'Markdown (.md)' },
      { format: 'text', label: 'Plain Text (.txt)' },
    ];

    formats.forEach(f => {
      const item = document.createElement('button');
      item.className = 'download-menu-item';
      item.textContent = f.label;
      item.addEventListener('click', () => {
        this.downloadAs(f.format);
        menu.remove();
      });
      menu.appendChild(item);
    });

    const toolbar = this.shadowRoot?.querySelector('.toolbar');
    if (toolbar) {
      toolbar.appendChild(menu);
    }

    const closeHandler = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
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

    customElements.whenDefined('snice-modal').then(() => {
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
      this.savedSelection = range.cloneRange();
    }
  };

  private saveSelectionBeforeAction = (e: MouseEvent) => {
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

    const range = selection.getRangeAt(0);
    if (!this.editor.contains(range.commonAncestorContainer)) {
      return;
    }
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
   * Get document as plain text
   */
  getText(): string {
    return this.editor.innerText || '';
  }

  /**
   * Get document as markdown
   */
  getMarkdown(): string {
    return this.nodeToMarkdown(this.editor).trim() + '\n';
  }

  /**
   * Download document in specified format
   */
  downloadAs(format: 'html' | 'markdown' | 'text', filename?: string) {
    let content: string;
    let mimeType: string;
    let ext: string;

    switch (format) {
      case 'html':
        content = this.getHTML();
        mimeType = 'text/html';
        ext = 'html';
        break;
      case 'markdown':
        content = this.getMarkdown();
        mimeType = 'text/markdown';
        ext = 'md';
        break;
      case 'text':
        content = this.getText();
        mimeType = 'text/plain';
        ext = 'txt';
        break;
    }

    const name = filename || `document.${ext}`;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Clear document
   */
  clear() {
    this.editor.innerHTML = '<p><br></p>';
  }

  private nodeToMarkdown(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).map(n => this.nodeToMarkdown(n)).join('');

    switch (tag) {
      case 'h1': return `# ${children.trim()}\n\n`;
      case 'h2': return `## ${children.trim()}\n\n`;
      case 'h3': return `### ${children.trim()}\n\n`;
      case 'h4': return `#### ${children.trim()}\n\n`;
      case 'h5': return `##### ${children.trim()}\n\n`;
      case 'h6': return `###### ${children.trim()}\n\n`;
      case 'p': return `${children.trim()}\n\n`;
      case 'br': return '\n';
      case 'b': case 'strong': return `**${children}**`;
      case 'i': case 'em': return `*${children}*`;
      case 'u': return `<u>${children}</u>`;
      case 's': case 'strike': case 'del': return `~~${children}~~`;
      case 'a': return `[${children}](${(el as HTMLAnchorElement).href})`;
      case 'img': return `![${(el as HTMLImageElement).alt || ''}](${(el as HTMLImageElement).src})`;
      case 'ul': return this.listToMarkdown(el, false);
      case 'ol': return this.listToMarkdown(el, true);
      case 'li': return children.trim();
      case 'hr': return '---\n\n';
      case 'code': return `\`${children}\``;
      case 'blockquote': return children.split('\n').filter(l => l.trim()).map(line => `> ${line}`).join('\n') + '\n\n';
      case 'table': return this.tableToMarkdown(el);
      case 'div': return children;
      default: return children;
    }
  }

  private listToMarkdown(el: HTMLElement, ordered: boolean): string {
    let result = '';
    const items = el.querySelectorAll(':scope > li');
    items.forEach((li, i) => {
      const prefix = ordered ? `${i + 1}. ` : '- ';
      const content = this.nodeToMarkdown(li);
      result += `${prefix}${content}\n`;
    });
    return result + '\n';
  }

  private tableToMarkdown(el: HTMLElement): string {
    const rows = el.querySelectorAll('tr');
    if (rows.length === 0) return '';

    let result = '';
    let isFirst = true;

    rows.forEach(row => {
      const cells = row.querySelectorAll('td, th');
      const cellTexts = Array.from(cells).map(cell => this.nodeToMarkdown(cell).trim());
      result += `| ${cellTexts.join(' | ')} |\n`;

      if (isFirst) {
        result += `| ${cellTexts.map(() => '---').join(' | ')} |\n`;
        isFirst = false;
      }
    });

    return result + '\n';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-doc': SniceDoc;
  }
}
