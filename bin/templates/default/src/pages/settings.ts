import { page } from '../router';
import { render, styles, context, dispatch, on, html, css } from 'snice';
import type { Placard, Context } from 'snice';
import { isAuthenticated } from '../guards/auth';
import type { Principal } from '../types/auth';

const placard: Placard = {
  name: 'settings',
  title: 'Settings',
  icon: '\u2699\ufe0f',
  show: true,
  order: 4
};

@page({ tag: 'settings-page', routes: ['/settings'], guards: [isAuthenticated], placard })
export class SettingsPage extends HTMLElement {
  private ctx?: Context;
  displayName = '';
  email = '';
  theme: 'light' | 'dark' | 'system' = 'system';
  notificationsEnabled = true;
  saved = false;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
    const principal = ctx.application.principal as Principal | undefined;
    const user = principal?.user;
    this.displayName = user?.name || '';
    this.email = user?.email || '';

    const storedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | 'system' | null;
    this.theme = storedTheme || 'system';

    this.notificationsEnabled = localStorage.getItem('notifications-enabled') !== 'false';
  }

  handleNameInput(e: Event) {
    this.displayName = (e.target as HTMLInputElement).value;
  }

  handleEmailInput(e: Event) {
    this.email = (e.target as HTMLInputElement).value;
  }

  setTheme(theme: 'light' | 'dark' | 'system') {
    this.theme = theme;
    localStorage.setItem('app-theme', theme);
    this.applyTheme(theme);
  }

  toggleNotifications() {
    this.notificationsEnabled = !this.notificationsEnabled;
    localStorage.setItem('notifications-enabled', String(this.notificationsEnabled));
  }

  private applyTheme(theme: string) {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  @on('keydown:ctrl+s')
  preventDefaultSave(e: Event) {
    e.preventDefault();
    this.saveSettings();
  }

  @dispatch('settings-saved')
  saveSettings() {
    if (this.ctx) {
      const principal = this.ctx.application.principal as Principal;
      if (principal.user) {
        principal.user.name = this.displayName;
        principal.user.email = this.email;
      }
      this.ctx.update();
    }

    this.saved = true;
    setTimeout(() => { this.saved = false; }, 2000);

    return { displayName: this.displayName, email: this.email, theme: this.theme };
  }

  @render()
  renderContent() {
    return html`
      <div class="container">
        <h1>Settings</h1>
        <p class="hint">Press Ctrl+S to save</p>

        <if ${this.saved}>
          <snice-alert variant="success" dismissible>
            Settings saved successfully!
          </snice-alert>
        </if>

        <snice-card class="section">
          <h3>Profile</h3>
          <div class="form-group">
            <label>Display Name</label>
            <snice-input
              .value=${this.displayName}
              @input=${this.handleNameInput}
              placeholder="Your name"
            ></snice-input>
          </div>
          <div class="form-group">
            <label>Email</label>
            <snice-input
              .value=${this.email}
              @input=${this.handleEmailInput}
              placeholder="your@email.com"
            ></snice-input>
          </div>
        </snice-card>

        <snice-card class="section">
          <h3>Appearance</h3>
          <div class="theme-options">
            <button
              class="theme-btn ${this.theme === 'light' ? 'active' : ''}"
              @click=${() => this.setTheme('light')}
            >
              <span class="theme-icon">&#9728;&#65039;</span>
              Light
            </button>
            <button
              class="theme-btn ${this.theme === 'dark' ? 'active' : ''}"
              @click=${() => this.setTheme('dark')}
            >
              <span class="theme-icon">&#127769;</span>
              Dark
            </button>
            <button
              class="theme-btn ${this.theme === 'system' ? 'active' : ''}"
              @click=${() => this.setTheme('system')}
            >
              <span class="theme-icon">&#128187;</span>
              System
            </button>
          </div>
        </snice-card>

        <snice-card class="section">
          <h3>Notifications</h3>
          <div class="toggle-row">
            <div>
              <p class="toggle-label">Push Notifications</p>
              <p class="toggle-desc">Receive real-time notification alerts</p>
            </div>
            <snice-switch
              ?checked=${this.notificationsEnabled}
              @change=${this.toggleNotifications}
            ></snice-switch>
          </div>
        </snice-card>

        <div class="actions">
          <snice-button variant="primary" @click=${this.saveSettings}>
            Save Settings
          </snice-button>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      .container {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
      }

      h1 {
        margin: 0 0 0.25rem 0;
        color: var(--primary-color);
      }

      .hint {
        margin: 0 0 2rem 0;
        font-size: 0.8125rem;
        color: var(--text-light);
      }

      .section {
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }

      h3 {
        margin: 0 0 1.25rem 0;
        color: var(--primary-color);
      }

      .form-group {
        margin-bottom: 1rem;
      }

      .form-group:last-child {
        margin-bottom: 0;
      }

      label {
        display: block;
        margin-bottom: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-color);
      }

      snice-input {
        width: 100%;
      }

      .theme-options {
        display: flex;
        gap: 0.75rem;
      }

      .theme-btn {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        background: var(--bg-secondary);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-md);
        cursor: pointer;
        color: var(--text-color);
        font-size: 0.875rem;
        transition: border-color 0.2s;
      }

      .theme-btn:hover {
        border-color: var(--primary-color);
      }

      .theme-btn.active {
        border-color: var(--primary-color);
        background: color-mix(in srgb, var(--primary-color) 10%, transparent);
      }

      .theme-icon {
        font-size: 1.5rem;
      }

      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .toggle-label {
        margin: 0;
        font-weight: 500;
        color: var(--text-color);
      }

      .toggle-desc {
        margin: 0.25rem 0 0 0;
        font-size: 0.8125rem;
        color: var(--text-light);
      }

      .actions {
        display: flex;
        justify-content: flex-end;
      }

      snice-alert {
        margin-bottom: 1.5rem;
      }

      @media (max-width: 640px) {
        .theme-options {
          flex-direction: column;
        }
      }
    `;
  }
}
