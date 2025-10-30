import { page } from '../router';
import { render, styles, html, css } from 'snice';
import type { Placard } from 'snice';

const placard: Placard = {
  name: 'profile',
  title: 'Profile',
  icon: '👤',
  show: true,
  order: 2
};

@page({ tag: 'profile-page', routes: ['/profile'], placard })
export class ProfilePage extends HTMLElement {
  @render()
  renderContent() {
    return html/*html*/`
      <div class="container">
        <snice-card>
          <div class="profile-header">
            <snice-avatar
              name="Alex Morgan"
              size="120"
              src="https://i.pravatar.cc/150?img=8">
            </snice-avatar>
            <h1 class="profile-name">Alex Morgan</h1>
            <p class="profile-bio">Full-stack developer | Web components enthusiast | Coffee addict ☕</p>
          </div>

          <div class="stats-grid">
            <snice-stat
              label="Posts"
              value="142">
            </snice-stat>
            <snice-stat
              label="Followers"
              value="1.2k">
            </snice-stat>
            <snice-stat
              label="Following"
              value="384">
            </snice-stat>
          </div>

          <snice-tabs>
            <snice-tab slot="tab" panel="posts" active>Posts</snice-tab>
            <snice-tab slot="tab" panel="about">About</snice-tab>
            <snice-tab slot="tab" panel="activity">Activity</snice-tab>

            <snice-tab-panel slot="panel" name="posts">
              <div style="padding: 1rem;">
                <p>Your recent posts will appear here.</p>
                <br>
                <snice-button variant="primary">Create Post</snice-button>
              </div>
            </snice-tab-panel>

            <snice-tab-panel slot="panel" name="about">
              <div style="padding: 1rem;">
                <h3>About Me</h3>
                <p style="margin-top: 1rem;">
                  Passionate about building modern web applications with
                  cutting-edge technologies. Love sharing knowledge and
                  collaborating with the community.
                </p>
                <br>
                <h3>Skills</h3>
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
                  <snice-badge>JavaScript</snice-badge>
                  <snice-badge>TypeScript</snice-badge>
                  <snice-badge>Web Components</snice-badge>
                  <snice-badge>CSS</snice-badge>
                  <snice-badge>Node.js</snice-badge>
                </div>
              </div>
            </snice-tab-panel>

            <snice-tab-panel slot="panel" name="activity">
              <div style="padding: 1rem;">
                <p>Recent activity will be shown here.</p>
              </div>
            </snice-tab-panel>
          </snice-tabs>
        </snice-card>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`
      .container {
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem 1rem;
      }
    `;
  }
}
