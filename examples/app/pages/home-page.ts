import { page } from '../router';
import { containerStyles } from '../styles/shared';

@page({ tag: 'home-page', routes: ['/'] })
export class HomePage extends HTMLElement {
  html() {
    return /*html*/`
      <app-nav></app-nav>
      <div class="container">
        <div class="hero">
          <h1>Welcome to Dark-TS</h1>
          <p class="subtitle">A simple, decorator-based framework for building web applications</p>
          <div class="features">
            <div class="feature">
              <h3>🎯 Simple</h3>
              <p>Clean API with decorators for elements, properties, and events</p>
            </div>
            <div class="feature">
              <h3>🚀 Fast</h3>
              <p>Lightweight with no virtual DOM overhead</p>
            </div>
            <div class="feature">
              <h3>🔧 Flexible</h3>
              <p>Built-in routing and controller system</p>
            </div>
          </div>
          <div class="cta">
            <a href="#/todos" class="btn btn-primary">Try Todo App</a>
            <a href="#/about" class="btn btn-secondary">Learn More</a>
          </div>
        </div>
      </div>
    `;
  }

  css() {
    // Return array of CSS strings - shared + component-specific
    return [
      containerStyles,
      /*css*/`
        .container {
          min-height: calc(100vh - 60px);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 0;
        }
        
        .hero {
          text-align: center;
          padding: 5rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .hero h1 {
          font-size: 3.5rem;
          font-weight: 800;
          color: white;
          margin-bottom: 1.5rem;
          text-shadow: 0 2px 10px rgba(0,0,0,0.2);
          letter-spacing: -1px;
        }
        
        .subtitle {
          font-size: 1.4rem;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 4rem;
          font-weight: 400;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }
        
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin: 4rem 0;
          padding: 0 1rem;
        }
        
        .feature {
          background: white;
          padding: 2.5rem;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .feature:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.2);
        }
        
        .feature h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #333;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .feature p {
          color: #666;
          line-height: 1.7;
          font-size: 1.05rem;
        }
        
        .cta {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          margin-top: 4rem;
          flex-wrap: wrap;
        }
        
        .btn {
          padding: 1rem 2.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          display: inline-block;
        }
        
        .btn-primary {
          background: white;
          color: #667eea;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.25);
        }
        
        .btn-secondary {
          background: transparent;
          color: white;
          border: 2px solid white;
        }
        
        .btn-secondary:hover {
          background: white;
          color: #667eea;
          transform: translateY(-2px);
        }
        
        @media (max-width: 768px) {
          .hero h1 {
            font-size: 2.5rem;
          }
          
          .subtitle {
            font-size: 1.2rem;
          }
          
          .features {
            grid-template-columns: 1fr;
            padding: 0;
          }
        }
      `
    ];
  }
}