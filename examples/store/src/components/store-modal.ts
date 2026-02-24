import { element, property, render, styles, html, css, on, dispatch } from 'snice';

@element('store-modal')
class StoreModal extends HTMLElement {
  @property({ type: Boolean }) open = false;
  @property() heading = '';

  @dispatch('modal-close')
  emitClose() {
    this.open = false;
    return {};
  }

  @on('keydown:Escape')
  handleEscape() {
    if (this.open) {
      this.emitClose();
    }
  }

  @render()
  template() {
    return html`
      <if ${this.open}>
        <div class="overlay" @click=${() => this.emitClose()}>
          <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
            <div class="header">
              <h2>${this.heading}</h2>
              <button class="close-btn" @click=${() => this.emitClose()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="body">
              <slot></slot>
            </div>
          </div>
        </div>
      </if>
    `;
  }

  @styles()
  modalStyles() {
    return css`
      :host {
        display: contents;
      }
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
        animation: fadeIn 0.15s ease-out;
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .modal {
        background: var(--snice-color-background, rgb(255 255 255));
        border-radius: 12px;
        box-shadow: var(--snice-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
        max-width: 32rem;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        animation: slideUp 0.2s ease-out;
      }
      @keyframes slideUp {
        from { transform: translateY(1rem); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--snice-color-border, rgb(226 226 226));
      }
      .header h2 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: var(--snice-font-weight-semibold, 600);
      }
      .close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border: none;
        background: none;
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
        cursor: pointer;
        border-radius: 6px;
        transition: background 0.15s;
      }
      .close-btn:hover {
        background: var(--snice-color-background-element, rgb(252 251 249));
      }
      .body {
        padding: 1.5rem;
      }
    `;
  }
}

export { StoreModal };
