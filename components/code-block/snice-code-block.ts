import { element, property, watch, request, dispatch, styles, render, html, css, query, ready, on } from 'snice';
import { highlightCode } from './highlighter';
import cssContent from './snice-code-block.css?inline';
import type { GrammarDefinition } from './highlighter';
import {
  LOAD_GRAMMAR_REQUEST,
  type FetchMode,
  type CodeLanguage,
  type SniceCodeBlockElement,
  type CodeCopyDetail,
  type CodeHighlightDetail,
  type GrammarRequestDetail,
  type HighlighterFunction
} from './snice-code-block.types';

@element('snice-code-block')
export class SniceCodeBlock extends HTMLElement implements SniceCodeBlockElement {
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

  @property({  })
  grammar = '';

  @property({ attribute: 'fetch-mode' })
  fetchMode: FetchMode = 'native';

  public highlighter?: HighlighterFunction;

  private copied = false;
  private highlightedCode = '';
  private loadedGrammar: GrammarDefinition | null = null;
  private loadedGrammarUrl: string | null = null;
  private highlightVersion = 0;

  @query('.code-block__code')
  private codeEl!: HTMLElement;

  @query('.code-block__header')
  private headerEl!: HTMLElement;

  @query('.code-block__filename')
  private filenameEl!: HTMLElement;

  @query('.code-block__copy')
  private copyBtn!: HTMLButtonElement;

  @dispatch('code-copy', { bubbles: true, composed: true })
  private dispatchCopyEvent(): CodeCopyDetail {
    return { code: this.code, codeBlock: this };
  }

  @dispatch('code-before-highlight', { bubbles: true, composed: true })
  private dispatchBeforeHighlightEvent(): CodeHighlightDetail {
    return { code: this.code, language: this.language, codeBlock: this };
  }

  @dispatch('code-after-highlight', { bubbles: true, composed: true })
  private dispatchAfterHighlightEvent(): CodeHighlightDetail {
    return { code: this.code, language: this.language, codeBlock: this };
  }

  @dispatch('grammar-request', { bubbles: true, composed: true })
  private dispatchGrammarRequestEvent(): GrammarRequestDetail {
    return { url: this.grammar, language: this.language, codeBlock: this };
  }

  @request(LOAD_GRAMMAR_REQUEST)
  async *requestGrammar(url: string): any {
    const grammar: GrammarDefinition = await (yield { url });
    return grammar;
  }

  @render({ once: true })
  template() {
    return html/*html*/`
      <slot style="display:none"></slot>
      <div class="code-block" part="container">
        <div class="code-block__header" part="header">
          <div class="code-block__filename" part="filename">${this.filename}</div>
          <button
            class="code-block__copy"
            part="copy-button"
            @click="${() => this.copy()}">
            Copy
          </button>
        </div>
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

  @ready()
  async onReady() {
    this.updateHeader();
    if (!this.code) {
      this.readSlottedContent();
    }
    if (this.code) {
      await this.highlight();
    }
  }

  @on('slotchange', { target: 'slot' })
  handleSlotChange() {
    this.readSlottedContent();
  }

  private readSlottedContent() {
    const text = this.textContent?.trim();
    if (text) {
      this.code = text;
      this.highlight();
    }
  }

  @watch('grammar')
  onGrammarChange() {
    this.loadedGrammar = null;
    this.loadedGrammarUrl = null;
    if (this.code) {
      this.highlight();
    }
  }

  @watch('fetchMode')
  onFetchModeChange() {
    this.loadedGrammar = null;
    this.loadedGrammarUrl = null;
    if (this.code) {
      this.highlight();
    }
  }

  @watch('filename', 'copyable')
  updateHeader() {
    if (!this.headerEl) return;
    const show = this.filename || this.copyable;
    this.headerEl.style.display = show ? '' : 'none';
    if (this.filenameEl) this.filenameEl.textContent = this.filename;
    if (this.copyBtn) this.copyBtn.style.display = this.copyable ? '' : 'none';
  }

  @watch('language')
  onLanguageChange() {
    if (!this.codeEl) return;
    this.codeEl.className = `code-block__code language-${this.language}`;
    this.codeEl.setAttribute('data-language', this.language);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private updateCodeDisplay() {
    if (!this.codeEl) return;

    const codeToRender = this.highlightedCode || this.escapeHtml(this.code);

    if (this.showLineNumbers || this.highlightLines.length > 0) {
      const lines = codeToRender.split('\n');
      const markup = lines.map((line, index) => {
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

      this.codeEl.innerHTML = markup;
    } else {
      this.codeEl.innerHTML = codeToRender;
    }
  }

  async copy() {
    try {
      await navigator.clipboard.writeText(this.code);
      this.copied = true;
      this.dispatchCopyEvent();
      if (this.copyBtn) this.copyBtn.textContent = 'Copied!';

      setTimeout(() => {
        this.copied = false;
        if (this.copyBtn) this.copyBtn.textContent = 'Copy';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }

  setHighlighter(highlighter: HighlighterFunction) {
    this.highlighter = highlighter;
  }

  setGrammar(grammar: GrammarDefinition) {
    this.loadedGrammar = grammar;
    this.loadedGrammarUrl = null;
    if (this.code) {
      this.highlight();
    }
  }

  private async resolveGrammar(): Promise<GrammarDefinition | null> {
    if (this.loadedGrammar) return this.loadedGrammar;
    if (!this.grammar) return null;

    try {
      switch (this.fetchMode) {
        case 'native': {
          const response = await fetch(this.grammar);
          const grammar: GrammarDefinition = await response.json();
          if (grammar) {
            this.loadedGrammar = grammar;
            this.loadedGrammarUrl = this.grammar;
          }
          return grammar;
        }
        case 'virtual': {
          const grammar = await this.requestGrammar(this.grammar);
          if (grammar) {
            this.loadedGrammar = grammar;
            this.loadedGrammarUrl = this.grammar;
          }
          return grammar;
        }
        case 'event': {
          this.dispatchGrammarRequestEvent();
          return null;
        }
        default:
          return null;
      }
    } catch (error) {
      console.error(`Failed to load grammar from ${this.grammar}:`, error);
      return null;
    }
  }

  async highlight() {
    if (!this.code) return;

    const version = ++this.highlightVersion;

    this.dispatchBeforeHighlightEvent();

    try {
      if (this.highlighter) {
        const escapedCode = this.escapeHtml(this.code);
        const lines = escapedCode.split('\n');
        const highlightedLines = await Promise.all(
          lines.map(line => this.highlighter!(line, this.language))
        );
        if (version !== this.highlightVersion) return;
        this.highlightedCode = highlightedLines.join('\n');
      } else {
        const grammarObj = await this.resolveGrammar();
        if (version !== this.highlightVersion) return;
        this.highlightedCode = highlightCode(this.code, grammarObj || this.language);
      }

      this.updateCodeDisplay();
      this.dispatchAfterHighlightEvent();
    } catch (error) {
      console.error('Syntax highlighting failed:', error);
    }
  }
}
