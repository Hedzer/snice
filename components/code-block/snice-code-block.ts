import { element, property, dispatch, render, styles, html, css, query, ready } from 'snice';
import cssContent from './snice-code-block.css?inline';
import { highlightCode } from './highlighter';
import type {
  CodeLanguage,
  SniceCodeBlockElement,
  CodeCopyDetail,
  CodeHighlightDetail,
  HighlighterFunction
} from './snice-code-block.types';

@element('snice-code-block')
export class SniceCodeBlock extends HTMLElement implements SniceCodeBlockElement {
  @property({  })
  code = '';

  @property({  })
  language: CodeLanguage = 'plaintext';

  @property({ type: Boolean, attribute: 'show-line-numbers' })
  showLineNumbers = false;

  @property({ type: Number, attribute: 'start-line' })
  startLine = 1;

  @property({ type: Array, attribute: 'highlight-lines' })
  highlightLines: number[] = [];

  @property({ type: Boolean })
  copyable = true;

  @property({  })
  filename = '';

  public highlighter?: HighlighterFunction;

  private copied = false;
  private highlightedCode = '';

  @query('.code-block__code')
  private codeElement?: HTMLElement;

  // Global highlighter shared by all instances
  private static globalHighlighter?: HighlighterFunction;

  @dispatch('@snice/code-copy', { bubbles: true, composed: true })
  private dispatchCopyEvent(): CodeCopyDetail {
    return { code: this.code, codeBlock: this };
  }

  @dispatch('@snice/code-before-highlight', { bubbles: true, composed: true })
  private dispatchBeforeHighlightEvent(): CodeHighlightDetail {
    return { code: this.code, language: this.language, codeBlock: this };
  }

  @dispatch('@snice/code-after-highlight', { bubbles: true, composed: true })
  private dispatchAfterHighlightEvent(): CodeHighlightDetail {
    return { code: this.code, language: this.language, codeBlock: this };
  }

  // Static method to set global highlighter
  static setGlobalHighlighter(highlighter: HighlighterFunction) {
    SniceCodeBlock.globalHighlighter = highlighter;
  }

  @ready()
  async onReady() {
    // Wait for next frame to ensure DOM is ready
    await new Promise(resolve => requestAnimationFrame(resolve));

    if (this.code) {
      await this.highlight();
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private updateCodeDisplay() {
    if (!this.codeElement) {
      console.warn('Code element not found');
      return;
    }

    const codeToRender = this.highlightedCode || this.escapeHtml(this.code);

    if (this.showLineNumbers || this.highlightLines.length > 0) {
      // Split into lines and wrap with line numbers/highlighting
      const lines = codeToRender.split('\n');
      const html = lines.map((line, index) => {
        const lineNumber = this.startLine + index;
        const isHighlighted = this.highlightLines.includes(lineNumber);
        const lineClasses = [
          'code-block__line',
          isHighlighted ? 'code-block__line--highlight' : ''
        ].filter(Boolean).join(' ');

        const lineNumberHtml = this.showLineNumbers
          ? `<span class="code-block__line-number">${lineNumber}</span>`
          : '';

        return `<span class="${lineClasses}">${lineNumberHtml}${line}\n</span>`;
      }).join('');

      this.codeElement.innerHTML = html;
    } else {
      // No line numbers or highlighting - just set innerHTML directly
      this.codeElement.innerHTML = codeToRender;
    }
  }

  @render()
  render() {
    const showHeader = this.filename || this.copyable;

    return html/*html*/`
      <div class="code-block" part="container">
        <if ${showHeader}>
          <div class="code-block__header" part="header">
            <if ${this.filename}>
              <div class="code-block__filename" part="filename">${this.filename}</div>
            </if>
            <if ${!this.filename}>
              <div></div>
            </if>
            <if ${this.copyable}>
              <button
                class="code-block__copy ${this.copied ? 'code-block__copy--copied' : ''}"
                part="copy-button"
                @click="${() => this.copy()}">
                ${this.copied ? 'Copied!' : 'Copy'}
              </button>
            </if>
          </div>
        </if>

        <div class="code-block__content" part="content">
          <pre class="code-block__pre" part="pre"><code class="code-block__code language-${this.language}" part="code" data-language="${this.language}"></code></pre>
        </div>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  // Public API
  async copy() {
    try {
      await navigator.clipboard.writeText(this.code);
      this.copied = true;
      this.dispatchCopyEvent();

      setTimeout(() => {
        this.copied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }

  /**
   * Set highlighter for this instance
   */
  setHighlighter(highlighter: HighlighterFunction) {
    this.highlighter = highlighter;
  }

  /**
   * Manually trigger syntax highlighting
   */
  async highlight() {
    if (!this.code) return;

    const externalHighlighter = this.highlighter || SniceCodeBlock.globalHighlighter;

    // Dispatch before event
    this.dispatchBeforeHighlightEvent();

    try {
      if (externalHighlighter) {
        // External highlighters expect escaped HTML
        const escapedCode = this.escapeHtml(this.code);
        const lines = escapedCode.split('\n');
        const highlightedLines = await Promise.all(
          lines.map(line => externalHighlighter(line, this.language))
        );
        this.highlightedCode = highlightedLines.join('\n');
      } else {
        // Built-in highlighter handles escaping internally
        this.highlightedCode = highlightCode(this.code, this.language);
      }

      // Update display with highlighted code
      this.updateCodeDisplay();

      // Dispatch after event
      this.dispatchAfterHighlightEvent();
    } catch (error) {
      console.error('Syntax highlighting failed:', error);
    }
  }
}
