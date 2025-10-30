import { page } from '../router';
import { render, styles, html, css } from 'snice';
import type { Placard } from 'snice';

const placard: Placard = {
  name: 'feed',
  title: 'Feed',
  icon: '🏠',
  show: true,
  order: 1
};

@page({ tag: 'feed-page', routes: ['/'], placard })
export class FeedPage extends HTMLElement {
  @render()
  renderContent() {
    return html/*html*/`
      <div class="container">
        <h1>Your Feed</h1>

        <snice-card class="post">
          <div class="post-header">
            <snice-avatar
              name="Sarah Chen"
              size="48"
              src="https://i.pravatar.cc/150?img=1">
            </snice-avatar>
            <div class="post-author">
              <span class="post-name">Sarah Chen</span>
              <span class="post-time">2 hours ago</span>
            </div>
            <snice-badge variant="success">Following</snice-badge>
          </div>
          <div class="post-content">
            Just launched our new product! 🚀 Check it out and let me know what you think.
            Really excited to share this with the community.
          </div>
          <div class="post-actions">
            <snice-button variant="text" size="small">👍 Like (24)</snice-button>
            <snice-button variant="text" size="small">💬 Comment (5)</snice-button>
            <snice-button variant="text" size="small">🔗 Share</snice-button>
          </div>
        </snice-card>

        <snice-card class="post">
          <div class="post-header">
            <snice-avatar
              name="Mike Johnson"
              size="48"
              src="https://i.pravatar.cc/150?img=12">
            </snice-avatar>
            <div class="post-author">
              <span class="post-name">Mike Johnson</span>
              <span class="post-time">5 hours ago</span>
            </div>
            <snice-badge variant="primary">Developer</snice-badge>
          </div>
          <div class="post-content">
            Working on a new open source project. Looking for contributors!
            If you're interested in web components, reach out.
          </div>
          <div class="post-actions">
            <snice-button variant="text" size="small">👍 Like (42)</snice-button>
            <snice-button variant="text" size="small">💬 Comment (12)</snice-button>
            <snice-button variant="text" size="small">🔗 Share</snice-button>
          </div>
        </snice-card>

        <snice-card class="post">
          <div class="post-header">
            <snice-avatar
              name="Emma Davis"
              size="48"
              src="https://i.pravatar.cc/150?img=5">
            </snice-avatar>
            <div class="post-author">
              <span class="post-name">Emma Davis</span>
              <span class="post-time">1 day ago</span>
            </div>
            <snice-badge variant="warning">Designer</snice-badge>
          </div>
          <div class="post-content">
            New design system is live! 🎨 We've updated our color palette and typography.
            Feedback welcome!
          </div>
          <div class="post-actions">
            <snice-button variant="text" size="small">👍 Like (67)</snice-button>
            <snice-button variant="text" size="small">💬 Comment (18)</snice-button>
            <snice-button variant="text" size="small">🔗 Share</snice-button>
          </div>
        </snice-card>
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
