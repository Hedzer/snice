import { page } from '../router';

@page({ tag: 'not-found-page', routes: ['/404'] })
export class NotFoundPage extends HTMLElement {
  html() {
    return /*html*/`
      <div class="container">
        <h1>404</h1>
        <p>Page not found</p>
        <a href="#/" class="btn">Go Home</a>
      </div>
    `;
  }

  css() {
    return /*css*/`
      .container {
        padding: 3rem;
        text-align: center;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      
      h1 {
        font-size: 4rem;
        color: var(--primary-color);
        margin-bottom: 1rem;
      }
      
      p {
        color: var(--text-light);
        margin-bottom: 2rem;
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