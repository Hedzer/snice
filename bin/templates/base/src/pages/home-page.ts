import { page } from '../router';
import type { Placard } from 'snice';

const placard: Placard = {
  name: 'home',
  title: 'Home',
  icon: '🏠',
  show: true,
  order: 1
};

@page({ tag: 'home-page', routes: ['/'], placard })
export class HomePage extends HTMLElement {
  html() {
    return /*html*/`
      <div class="container">
        <h1>Welcome to {{projectName}}</h1>
        <p>Built with Snice</p>
        
        <div class="demo-section">
          <h2>Interactive Counter Demo</h2>
          <p>This counter persists its state using a controller:</p>
          <counter-button controller="counter"></counter-button>
        </div>
        
        <div class="nav">
          <a href="#/about" class="btn">About</a>
        </div>
      </div>
    `;
  }

  css() {
    return /*css*/`
      .container {
        padding: 3rem;
        text-align: center;
        max-width: 800px;
        margin: 0 auto;
      }
      
      h1 {
        color: var(--primary-color);
        margin-bottom: 1rem;
        font-size: 2.5rem;
      }
      
      h2 {
        color: var(--primary-color);
        margin-bottom: 1rem;
        font-size: 1.5rem;
      }
      
      p {
        color: var(--text-light);
        margin-bottom: 2rem;
      }
      
      .demo-section {
        margin: 3rem 0;
        padding: 2rem;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
        transition: background 0.3s ease;
      }
      
      .btn:hover {
        background: var(--secondary-color);
      }
    `;
  }
}