import { element, property, dispatch, render, styles, html, css } from 'snice';
import cssContent from './snice-code-block.css?inline';
import type { CodeLanguage, SniceCodeBlockElement, CodeCopyDetail } from './snice-code-block.types';

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

  private copied = false;

  @dispatch('@snice/code-copy', { bubbles: true, composed: true })
  private dispatchCopyEvent(): CodeCopyDetail {
    return { code: this.code, codeBlock: this };
  }

  @render()
  render() {
    const lines = this.code.split('\n');
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
          <pre class="code-block__pre" part="pre"><code class="code-block__code language-${this.language}" part="code">${lines.map((line, index) => {
            const lineNumber = this.startLine + index;
            const isHighlighted = this.highlightLines.includes(lineNumber);
            const lineClasses = [
              'code-block__line',
              isHighlighted ? 'code-block__line--highlight' : ''
            ].filter(Boolean).join(' ');

            return html/*html*/`<span class="${lineClasses}"><if ${this.showLineNumbers}><span class="code-block__line-number">${lineNumber}</span></if>${line}
</span>`;
          })}</code></pre>
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
}
