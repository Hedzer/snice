import { page } from '../router';
import { render, styles, html, css } from 'snice';
import type { Placard } from 'snice';

const placard: Placard = {
  name: 'messages',
  title: 'Messages',
  icon: '💬',
  show: true,
  order: 3
};

@page({ tag: 'messages-page', routes: ['/messages'], placard })
export class MessagesPage extends HTMLElement {
  @render()
  renderContent() {
    return html/*html*/`
      <div class="container">
        <h1>Messages</h1>

        <snice-card>
          <div class="message-item">
            <snice-avatar
              name="Sarah Chen"
              size="48"
              src="https://i.pravatar.cc/150?img=1">
            </snice-avatar>
            <div class="message-content">
              <div class="message-name">Sarah Chen</div>
              <div class="message-preview">Thanks for the feedback! Let's discuss...</div>
            </div>
            <snice-badge variant="primary">2</snice-badge>
          </div>

          <div class="message-item">
            <snice-avatar
              name="Mike Johnson"
              size="48"
              src="https://i.pravatar.cc/150?img=12">
            </snice-avatar>
            <div class="message-content">
              <div class="message-name">Mike Johnson</div>
              <div class="message-preview">Can we schedule a call tomorrow?</div>
            </div>
          </div>

          <div class="message-item">
            <snice-avatar
              name="Emma Davis"
              size="48"
              src="https://i.pravatar.cc/150?img=5">
            </snice-avatar>
            <div class="message-content">
              <div class="message-name">Emma Davis</div>
              <div class="message-preview">The new designs look great! 🎨</div>
            </div>
          </div>

          <div class="message-item">
            <snice-avatar
              name="John Smith"
              size="48"
              src="https://i.pravatar.cc/150?img=13">
            </snice-avatar>
            <div class="message-content">
              <div class="message-name">John Smith</div>
              <div class="message-preview">Meeting confirmed for 3pm</div>
            </div>
          </div>

          <div class="message-item">
            <snice-avatar
              name="Lisa Brown"
              size="48"
              src="https://i.pravatar.cc/150?img=9">
            </snice-avatar>
            <div class="message-content">
              <div class="message-name">Lisa Brown</div>
              <div class="message-preview">Thanks for your help!</div>
            </div>
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
