import { element, property, render, styles, on, dispatch, html, css } from 'snice';

@element('search-bar')
export class SearchBar extends HTMLElement {
  @property() value = '';
  @property() placeholder = 'Search...';

  @on('input', 'input', { debounce: 300 })
  handleInput(e: Event) {
    this.value = (e.target as HTMLInputElement).value;
    this.dispatchSearch();
  }

  @on('keydown:Escape', 'input')
  clearSearch(e: Event) {
    this.value = '';
    (e.target as HTMLInputElement).value = '';
    this.dispatchSearch();
  }

  @dispatch('search')
  dispatchSearch() {
    return { query: this.value };
  }

  @render()
  renderContent() {
    return html`
      <div class="search-container">
        <span class="icon">&#128269;</span>
        <input
          type="text"
          .value=${this.value}
          placeholder="${this.placeholder}"
        />
        <if ${this.value.length > 0}>
          <button class="clear" @click=${() => { this.value = ''; this.dispatchSearch(); }}>&#10005;</button>
        </if>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      :host {
        display: block;
      }

      .search-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: var(--snice-color-background);
        border: 1px solid var(--snice-color-border);
        border-radius: var(--snice-border-radius-lg);
      }

      .search-container:focus-within {
        border-color: var(--snice-color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--snice-color-primary) 15%, transparent);
      }

      .icon {
        color: var(--snice-color-text-secondary);
        font-size: 0.875rem;
      }

      input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        font-size: 0.875rem;
        color: var(--snice-color-text);
      }

      input::placeholder {
        color: var(--snice-color-text-secondary);
      }

      .clear {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--snice-color-text-secondary);
        font-size: 0.75rem;
        padding: 0.125rem 0.25rem;
        border-radius: var(--snice-border-radius-md);
      }

      .clear:hover {
        background: var(--snice-color-background-secondary);
        color: var(--snice-color-text);
      }
    `;
  }
}
