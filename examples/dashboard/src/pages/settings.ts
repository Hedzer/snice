import { page } from '../router';
import { render, styles, html, css, property, context, dispatch } from 'snice';
import type { Placard, Context } from 'snice';
import type { DashboardAppContext } from '../types/app';

const placard: Placard = {
  name: 'settings',
  title: 'Settings',
  icon: '\u{2699}\u{FE0F}',
  show: true,
  order: 3,
};

type DateRangeOption = '7' | '14' | '30' | '90';
type RefreshOption = '10000' | '30000' | '60000' | '0';

@page({ tag: 'settings-page', routes: ['/settings'], placard })
export class SettingsPage extends HTMLElement {
  @property() dateRange: DateRangeOption = '30';
  @property() refreshInterval: RefreshOption = '30000';
  @property() userName = '';
  @property() userEmail = '';
  @property({ type: Boolean }) saved = false;

  private ctx?: Context;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
    const app = ctx.application as DashboardAppContext;
    if (app.user) {
      this.userName = app.user.name;
      this.userEmail = app.user.email;
    }
    this.refreshInterval = String(app.refreshInterval || 30000) as RefreshOption;
  }

  @dispatch('settings-saved')
  saveSettings() {
    if (!this.ctx) return {};
    const app = this.ctx.application as DashboardAppContext;
    const days = parseInt(this.dateRange);
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days);

    app.dateRange = { start, end: now };
    app.refreshInterval = parseInt(this.refreshInterval);
    if (app.user) {
      app.user.name = this.userName;
      app.user.email = this.userEmail;
    }

    this.ctx.update();
    this.saved = true;
    setTimeout(() => { this.saved = false; }, 2000);
    return { dateRange: this.dateRange, refreshInterval: this.refreshInterval };
  }

  @render()
  renderContent() {
    return html`
      <div class="page">
        <div class="page-header">
          <div>
            <h1 class="page-title">Settings</h1>
            <p class="page-subtitle">Configure your dashboard preferences</p>
          </div>
        </div>

        <div class="sections">
          <section class="section">
            <h2 class="section-title">Profile</h2>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Name</label>
                <input
                  class="form-input"
                  type="text"
                  .value=${this.userName}
                  @input=${(e: Event) => { this.userName = (e.target as HTMLInputElement).value; }}
                />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input
                  class="form-input"
                  type="email"
                  .value=${this.userEmail}
                  @input=${(e: Event) => { this.userEmail = (e.target as HTMLInputElement).value; }}
                />
              </div>
            </div>
          </section>

          <section class="section">
            <h2 class="section-title">Dashboard</h2>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Date Range</label>
                <select
                  class="form-input"
                  .value=${this.dateRange}
                  @change=${(e: Event) => { this.dateRange = (e.target as HTMLSelectElement).value as DateRangeOption; }}
                >
                  <option value="7">Last 7 days</option>
                  <option value="14">Last 14 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Auto-refresh</label>
                <select
                  class="form-input"
                  .value=${this.refreshInterval}
                  @change=${(e: Event) => { this.refreshInterval = (e.target as HTMLSelectElement).value as RefreshOption; }}
                >
                  <option value="10000">Every 10 seconds</option>
                  <option value="30000">Every 30 seconds</option>
                  <option value="60000">Every 60 seconds</option>
                  <option value="0">Disabled</option>
                </select>
              </div>
            </div>
          </section>

          <div class="actions">
            <button class="btn-primary" @click=${() => this.saveSettings()}>Save Changes</button>
            <if ${this.saved}>
              <span class="saved-msg">Settings saved!</span>
            </if>
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

      .page {
        padding: 1.5rem;
        max-width: 800px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: 1.5rem;
      }

      .page-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--dash-text, #f1f5f9);
        margin: 0 0 0.25rem 0;
      }

      .page-subtitle {
        font-size: 0.875rem;
        color: var(--dash-text-secondary, #94a3b8);
        margin: 0;
      }

      .sections {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .section {
        background: var(--dash-surface, #1e293b);
        border: 1px solid var(--dash-border, #334155);
        border-radius: var(--dash-radius-lg, 12px);
        padding: 1.25rem;
      }

      .section-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--dash-text, #f1f5f9);
        margin: 0 0 1rem 0;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--dash-border, #334155);
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .form-label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--dash-text-secondary, #94a3b8);
      }

      .form-input {
        background: var(--dash-bg, #0f172a);
        border: 1px solid var(--dash-border, #334155);
        border-radius: var(--dash-radius, 8px);
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        color: var(--dash-text, #f1f5f9);
        outline: none;
        transition: border-color 0.15s ease;
        font-family: inherit;
      }

      .form-input:focus {
        border-color: var(--dash-primary, #6366f1);
      }

      select.form-input {
        cursor: pointer;
        appearance: auto;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .btn-primary {
        background: var(--dash-primary, #6366f1);
        color: white;
        border: none;
        padding: 0.625rem 1.5rem;
        border-radius: var(--dash-radius, 8px);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.15s ease;
      }

      .btn-primary:hover {
        opacity: 0.9;
      }

      .saved-msg {
        font-size: 0.8125rem;
        color: var(--dash-success, #10b981);
        font-weight: 500;
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
  }
}
