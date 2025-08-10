import { element } from '../../../src';

@element('app-nav')
export class AppNav extends HTMLElement {
  html() {
    const currentHash = window.location.hash || '#/';
    
    return /*html*/`
      <nav class="navbar">
        <div class="nav-container">
          <h1 class="nav-brand">Snice</h1>
          <ul class="nav-menu">
            <li><a href="#/" class="nav-link ${currentHash === '#/' ? 'active' : ''}">Home</a></li>
            <li><a href="#/todos" class="nav-link ${currentHash === '#/todos' ? 'active' : ''}">Todos</a></li>
            <li><a href="#/about" class="nav-link ${currentHash === '#/about' ? 'active' : ''}">About</a></li>
          </ul>
        </div>
      </nav>
    `;
  }
  
  css() {
    return /*css*/`
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
      }
      
      .nav-menu {
        display: flex;
        list-style: none;
        gap: 2rem;
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
    `;
  }
}