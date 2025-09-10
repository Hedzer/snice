import { layout } from '../../../src/index';

@layout('app-layout')
export class AppLayout extends HTMLElement {
  html() {
    return /*html*/`
      <nav class="navbar">
        <div class="nav-container">
          <h1 class="nav-brand">Snice</h1>
          <ul class="nav-menu">
            <li><a href="#/" class="nav-link">Home</a></li>
            <li><a href="#/todos" class="nav-link">Todos</a></li>
            <li><a href="#/about" class="nav-link">About</a></li>
          </ul>
        </div>
      </nav>
      
      <main class="main-content">
        <slot name="page"></slot>
      </main>
    `;
  }

  css() {
    return /*css*/`
      :host {
        display: block;
        min-height: 100vh;
      }
      
      .navbar {
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        position: sticky;
        top: 0;
        z-index: 100;
      }
      
      .nav-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .nav-brand {
        font-size: 1.5rem;
        color: #333;
        margin: 0;
      }
      
      .nav-menu {
        display: flex;
        list-style: none;
        gap: 2rem;
        margin: 0;
        padding: 0;
      }
      
      .nav-link {
        color: #666;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.3s;
      }
      
      .nav-link:hover {
        color: #667eea;
      }
      
      .nav-link.active {
        color: #667eea;
      }
      
      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      @media (max-width: 768px) {
        .nav-container {
          flex-direction: column;
          gap: 1rem;
          text-align: center;
        }
        
        .nav-menu {
          gap: 1rem;
        }
      }
    `;
  }
}