import { page } from '../router';
import { render, styles, property, context, on, watch, dispatch, html, css } from 'snice';
import type { Placard, Context } from 'snice';
import type { AppContext } from '../router';
import type { Principal } from '../types/auth';
import { isAuthenticated } from '../guards/auth';

const placard: Placard = {
  name: 'settings',
  title: 'Settings',
  icon: '\u2699',
  show: true,
  order: 2,
};

@page({ tag: 'settings-page', routes: ['/settings'], guards: [isAuthenticated], placard })
class SettingsPage extends HTMLElement {
  @property() theme: 'light' | 'dark' = 'light';
  @property() userName = '';
  @property() userEmail = '';
  @property({ type: Boolean }) saved = false;

  private ctx?: Context;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
    const app = ctx.application as unknown as AppContext;
    this.theme = app.theme;
    const principal = app.principal as Principal;
    if (principal.user) {
      this.userName = principal.user.name;
      this.userEmail = principal.user.email;
    }
  }

  @on('change', '.theme-select')
  handleThemeChange(e: Event) {
    const newTheme = (e.target as HTMLSelectElement).value as 'light' | 'dark';
    this.theme = newTheme;
    if (this.ctx) {
      const app = this.ctx.application as unknown as AppContext;
      app.theme = newTheme;
      localStorage.setItem('task-manager-theme', newTheme);
      this.ctx.update();
    }
  }

  @on('click', '.save-btn')
  handleSave() {
    if (this.ctx) {
      const app = this.ctx.application as unknown as AppContext;
      if (app.principal.user) {
        app.principal.user.name = this.userName;
        this.ctx.update();
      }
    }
    this.saved = true;
    setTimeout(() => { this.saved = false; }, 2000);
  }

  @on('click', '.clear-data-btn')
  handleClearData() {
    localStorage.removeItem('task-manager-tasks');
    window.location.reload();
  }

  @render()
  renderContent() {
    return html`
      <div class="settings-page">
        <h1 class="page-title">Settings</h1>

        <div class="section">
          <h2 class="section-title">Profile</h2>
          <div class="card">
            <div class="form-group">
              <label class="label">Display Name</label>
              <input
                class="input"
                type="text"
                .value=${this.userName}
                @input=${(e: Event) => { this.userName = (e.target as HTMLInputElement).value; }}
              />
            </div>
            <div class="form-group">
              <label class="label">Email</label>
              <input
                class="input"
                type="email"
                .value=${this.userEmail}
                ?disabled=${true}
              />
              <span class="hint">Email cannot be changed in this demo</span>
            </div>
            <div class="form-actions">
              <button class="save-btn" @click=${this.handleSave}>
                Save Profile
              </button>
              <if ${this.saved}>
                <span class="saved-msg">Saved!</span>
              </if>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Appearance</h2>
          <div class="card">
            <div class="form-group">
              <label class="label">Theme</label>
              <select class="input theme-select" .value=${this.theme}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Data</h2>
          <div class="card">
            <p class="description">Reset all tasks back to the default demo data. This cannot be undone.</p>
            <button class="clear-data-btn">Reset Task Data</button>
          </div>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      :host {
        display: block;
      }

      .settings-page {
        max-width: 40rem;
        margin: 0 auto;
        padding: 1.5rem;
      }

      .page-title {
        font-size: 1.375rem;
        font-weight: 800;
        color: var(--snice-color-text, rgb(15 23 42));
        margin: 0 0 1.5rem;
      }

      .section {
        margin-bottom: 1.5rem;
      }

      .section-title {
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--snice-color-text, rgb(15 23 42));
        margin: 0 0 0.75rem;
      }

      .card {
        background: var(--snice-color-background-element, rgb(255 255 255));
        border: 1px solid var(--snice-color-border, rgb(226 232 240));
        border-radius: 10px;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--snice-color-text-secondary, rgb(100 116 139));
      }

      .input {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--snice-color-border, rgb(226 232 240));
        border-radius: 6px;
        font-size: 0.875rem;
        font-family: inherit;
        color: var(--snice-color-text, rgb(15 23 42));
        background: var(--snice-color-background-element, rgb(255 255 255));
        outline: none;
        transition: border-color 150ms ease;
      }

      .input:focus {
        border-color: var(--snice-color-primary, rgb(99 102 241));
        box-shadow: 0 0 0 3px rgb(99 102 241 / 0.1);
      }

      .input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .hint {
        font-size: 0.75rem;
        color: var(--snice-color-text-tertiary, rgb(148 163 184));
      }

      .form-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .save-btn {
        padding: 0.5rem 1.25rem;
        background: var(--snice-color-primary, rgb(99 102 241));
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: background 150ms ease;
      }

      .save-btn:hover {
        background: rgb(79 70 229);
      }

      .saved-msg {
        font-size: 0.8125rem;
        color: var(--snice-color-success, rgb(34 197 94));
        font-weight: 600;
      }

      .description {
        font-size: 0.875rem;
        color: var(--snice-color-text-secondary, rgb(100 116 139));
        margin: 0;
        line-height: 1.5;
      }

      .clear-data-btn {
        align-self: flex-start;
        padding: 0.5rem 1rem;
        background: transparent;
        color: var(--snice-color-danger, rgb(239 68 68));
        border: 1px solid var(--snice-color-danger, rgb(239 68 68));
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: all 150ms ease;
      }

      .clear-data-btn:hover {
        background: var(--snice-color-danger, rgb(239 68 68));
        color: white;
      }
    `;
  }
}
