import { element, property, render, styles, dispatch, watch, ready, on, html, css, unsafeHTML } from 'snice';
import type { MarkdownTheme, SniceMarkdownElement } from './snice-markdown.types';
import markdownStyles from './snice-markdown.css?inline';

// Sanitization: strip dangerous tags/attributes
const DANGEROUS_TAGS = /^(script|iframe|object|embed|form|input|button|select|textarea|link|meta|style|applet|base|basefont|bgsound|blink|body|frame|frameset|head|html|isindex|ilayer|layer|marquee|param|plaintext|title|xml)$/i;
const DANGEROUS_ATTRS = /^(on\w+|style|srcdoc|action|formaction|data-bind|xmlns)$/i;
const DANGEROUS_PROTOCOLS = /^(javascript|vbscript|data):/i;

function sanitizeHtml(html: string): string {
  // Pre-strip script/style tags before DOMParser to prevent execution in some environments
  const preStripped = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<(script|style)\b[^>]*\/?>/gi, '');
  const parser = new DOMParser();
  const doc = parser.parseFromString(preStripped, 'text/html');

  const walk = (node: Element) => {
    const children = Array.from(node.children);
    for (const child of children) {
      if (DANGEROUS_TAGS.test(child.tagName)) {
        child.remove();
        continue;
      }
      const attrs = Array.from(child.attributes);
      for (const attr of attrs) {
        if (DANGEROUS_ATTRS.test(attr.name)) {
          child.removeAttribute(attr.name);
        }
        if (attr.name === 'href' || attr.name === 'src') {
          if (DANGEROUS_PROTOCOLS.test(attr.value.trim())) {
            child.removeAttribute(attr.name);
          }
        }
      }
      walk(child);
    }
  };

  walk(doc.body);
  return doc.body.innerHTML;
}

// Escape HTML special characters
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Lightweight GFM-compatible markdown parser
function parseMarkdown(md: string): string {
  if (!md) return '';

  let result = md;

  // Normalize line endings
  result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Extract code blocks first to protect them from parsing
  const codeBlocks: string[] = [];
  result = result.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const escaped = escapeHtml(code.replace(/\n$/, ''));
    const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : '';
    codeBlocks.push(`<pre><code${langAttr}>${escaped}</code></pre>`);
    return `\x00CB${codeBlocks.length - 1}\x00`;
  });

  // Extract inline code
  const inlineCodes: string[] = [];
  result = result.replace(/`([^`\n]+)`/g, (_match, code) => {
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
    return `\x00IC${inlineCodes.length - 1}\x00`;
  });

  // Horizontal rules (before list processing)
  result = result.replace(/^([-*_]){3,}\s*$/gm, '<hr>');

  // Headings
  result = result.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  result = result.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  result = result.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  result = result.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  result = result.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  result = result.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Blockquotes
  result = result.replace(/^((?:>\s?.*\n?)+)/gm, (match) => {
    const content = match.replace(/^>\s?/gm, '').trim();
    return `<blockquote>${content}</blockquote>`;
  });

  // Tables (GFM)
  result = result.replace(/^(\|.+\|)\n(\|[-:\s|]+\|)\n((?:\|.+\|\n?)*)/gm, (_match, headerRow, _separator, bodyRows) => {
    const headers = headerRow.split('|').filter((c: string) => c.trim()).map((c: string) => `<th>${c.trim()}</th>`).join('');
    const rows = bodyRows.trim().split('\n').map((row: string) => {
      const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Task lists (before regular lists)
  result = result.replace(/^(\s*)- \[x\]\s+(.+)$/gm, '$1<li class="task-list-item"><input type="checkbox" checked disabled> $2</li>');
  result = result.replace(/^(\s*)- \[ \]\s+(.+)$/gm, '$1<li class="task-list-item"><input type="checkbox" disabled> $2</li>');

  // Unordered lists
  result = result.replace(/^((?:\s*[-*+]\s+.+\n?)+)/gm, (match) => {
    const items = match.trim().split('\n').map(line => {
      const content = line.replace(/^\s*[-*+]\s+/, '');
      if (content.startsWith('<li class="task-list-item">')) return content;
      return `<li>${content}</li>`;
    }).join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  result = result.replace(/^((?:\s*\d+\.\s+.+\n?)+)/gm, (match) => {
    const items = match.trim().split('\n').map(line => {
      const content = line.replace(/^\s*\d+\.\s+/, '');
      return `<li>${content}</li>`;
    }).join('');
    return `<ol>${items}</ol>`;
  });

  // Images
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Links
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Autolinks (GFM)
  result = result.replace(/(^|[^"(])(https?:\/\/[^\s<>]+)/g, '$1<a href="$2">$2</a>');

  // Bold and italic (process bold first)
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  result = result.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/_(.+?)_/g, '<em>$1</em>');

  // Strikethrough (GFM)
  result = result.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Paragraphs: wrap standalone text lines
  result = result.replace(/^(?!<[a-z/]|$|\x00)(.+)$/gm, '<p>$1</p>');

  // Clean up double paragraphs / empty paragraphs
  result = result.replace(/<p><\/p>/g, '');
  result = result.replace(/(<\/(?:ul|ol|blockquote|table|pre|h[1-6]|hr)>)\s*<p>/g, '$1\n<p>');

  // Restore inline codes
  result = result.replace(/\x00IC(\d+)\x00/g, (_match, idx) => inlineCodes[parseInt(idx)]);

  // Restore code blocks
  result = result.replace(/(?:<p>)?\x00CB(\d+)\x00(?:<\/p>)?/g, (_match, idx) => codeBlocks[parseInt(idx)]);

  return result.trim();
}

@element('snice-markdown')
export class SniceMarkdown extends HTMLElement implements SniceMarkdownElement {
  content: string = '';

  @property({ type: Boolean }) sanitize: boolean = true;
  @property() theme: MarkdownTheme = 'default';

  @property({ attribute: false }) private renderedHtml: string = '';

  @styles()
  componentStyles() {
    return css/*css*/`${markdownStyles}`;
  }

  @ready()
  init() {
    if (!this.content) {
      this.readSlottedContent();
    }
    if (this.content) {
      this.renderMarkdown();
    }
  }

  @on('slotchange', { target: 'slot' })
  handleSlotChange() {
    this.readSlottedContent();
  }

  private readSlottedContent() {
    const text = this.textContent?.trim();
    if (text) {
      this.content = text;
      this.renderMarkdown();
    }
  }

  @watch('sanitize')
  handleSanitizeChange() {
    this.renderMarkdown();
  }

  private renderMarkdown() {
    let parsed = parseMarkdown(this.content);
    if (this.sanitize) {
      parsed = sanitizeHtml(parsed);
    }
    this.renderedHtml = parsed;
    this.emitRender();
  }

  @on('click', { target: 'a' })
  handleLinkClick(e: Event) {
    const anchor = e.target as HTMLAnchorElement;
    if (anchor?.tagName === 'A') {
      e.preventDefault();
      this.emitLinkClick(anchor.getAttribute('href') || '', anchor.textContent || '');
    }
  }

  @dispatch('markdown-render', { bubbles: true, composed: true })
  private emitRender() {
    return { html: this.renderedHtml };
  }

  @dispatch('link-click', { bubbles: true, composed: true })
  private emitLinkClick(href: string, text: string) {
    return { href, text };
  }

  /** Set content programmatically and re-render */
  setContent(markdown: string) {
    this.content = markdown;
    this.renderMarkdown();
  }

  @render()
  renderContent() {
    return html/*html*/`
      <slot style="display:none"></slot>
      <div class="markdown-body" part="base">${unsafeHTML(this.renderedHtml)}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-markdown': SniceMarkdown;
  }
}
