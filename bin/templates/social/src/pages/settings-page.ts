import { page } from '../router';
import { render, styles, html, css } from 'snice';
import type { Placard } from 'snice';

const placard: Placard = {
  name: 'settings',
  title: 'Settings',
  icon: '⚙️',
  show: true,
  order: 4
};

@page({ tag: 'settings-page', routes: ['/settings'], placard })
export class SettingsPage extends HTMLElement {
  @render()
  renderContent() {
    return html/*html*/`
      <div class="container">
        <h1>Settings</h1>

        <snice-card class="settings-section">
          <h2>Profile Settings</h2>
          <div class="settings-group">
            <snice-input
              label="Display Name"
              value="Alex Morgan"
              placeholder="Enter your name">
            </snice-input>

            <snice-input
              label="Email"
              type="email"
              value="alex.morgan@example.com"
              placeholder="Enter your email">
            </snice-input>

            <snice-textarea
              label="Bio"
              value="Full-stack developer | Web components enthusiast"
              placeholder="Tell us about yourself"
              rows="4">
            </snice-textarea>
          </div>
        </snice-card>

        <snice-card class="settings-section">
          <h2>Notifications</h2>
          <div class="settings-group">
            <div class="setting-item">
              <div class="setting-label">
                <span class="setting-title">Email Notifications</span>
                <span class="setting-description">Receive email updates about your activity</span>
              </div>
              <snice-switch checked></snice-switch>
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span class="setting-title">Push Notifications</span>
                <span class="setting-description">Receive push notifications on your device</span>
              </div>
              <snice-switch checked></snice-switch>
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span class="setting-title">Weekly Digest</span>
                <span class="setting-description">Get a weekly summary of your activity</span>
              </div>
              <snice-switch></snice-switch>
            </div>
          </div>
        </snice-card>

        <snice-card class="settings-section">
          <h2>Privacy</h2>
          <div class="settings-group">
            <div class="setting-item">
              <div class="setting-label">
                <span class="setting-title">Private Profile</span>
                <span class="setting-description">Make your profile visible to followers only</span>
              </div>
              <snice-switch></snice-switch>
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span class="setting-title">Show Activity Status</span>
                <span class="setting-description">Let others see when you're online</span>
              </div>
              <snice-switch checked></snice-switch>
            </div>
          </div>
        </snice-card>

        <div style="display: flex; gap: 1rem;">
          <snice-button variant="primary">Save Changes</snice-button>
          <snice-button variant="secondary">Cancel</snice-button>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1rem;
      }

      h1 {
        margin-bottom: 2rem;
        color: var(--text-color);
      }
    `;
  }
}
