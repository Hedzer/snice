import { page } from '../router';
import { render, styles, html, css } from 'snice';
import type { Placard } from 'snice';

const placard: Placard = {
  name: 'about',
  title: 'About',
  icon: 'ℹ️',
  show: true,
  order: 2
};

@page({ tag: 'about-page', routes: ['/about'], placard })
export class AboutPage extends HTMLElement {
  @render()
  renderContent() {
    return html/*html*/`
      <div class="container">
        <h1>About</h1>
        <p>This app was built with Snice, a modern web components framework.</p>
        <p>Version 1.0.0</p>

        <div class="nav">
          <a href="#/" class="btn">Back to Home</a>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`
      .container {
        padding: 3rem;
        max-width: 800px;
        margin: 0 auto;
        text-align: center;
      }
      
      h1 {
        color: var(--primary-color);
        margin-bottom: 1rem;
      }
      
      p {
        color: var(--text-light);
        margin-bottom: 1rem;
      }
      
      .nav {
        margin-top: 3rem;
      }
      
      .btn {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background: var(--primary-color);
        color: white;
        text-decoration: none;
        border-radius: 6px;
      }
      
      .btn:hover {
        background: var(--secondary-color);
      }
    `;
  }
}