import { debounce, dispatch, element, html, live, property, render, styles, css } from 'snice';

@element('search-bar')
export class SearchBar extends HTMLElement {
  @property() value = '';
  @property() placeholder = 'Search...';

  handleInput(e: CustomEvent<{ value: string }>) {
    this.value = e.detail.value;
    this.queueSearch();
  }

  clearSearch() {
    this.value = '';
    this.dispatchSearch();
  }

  @debounce(300)
  queueSearch() {
    this.dispatchSearch();
  }

  @dispatch('search')
  dispatchSearch() {
    return { query: this.value };
  }

  @render()
  renderContent() {
    return html`
      <snice-input
        type="search"
        clearable
        prefix-icon="🔍"
        .value=${live(this.value)}
        placeholder="${this.placeholder}"
        @input-input=${this.handleInput}
        @keydown.escape=${this.clearSearch}
      ></snice-input>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      :host {
        display: block;
      }

      snice-input {
        width: 100%;
      }
    `;
  }
}
