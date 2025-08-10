import { page } from '../router';

@page({ tag: 'about-page', routes: ['/about'] })
export class AboutPage extends HTMLElement {
  html() {
    return /*html*/`
      <app-nav></app-nav>
      <div class="container">
        <div class="about-content">
          <h1>About Dark-TS</h1>
          
          <section>
            <h2>What is Dark-TS?</h2>
            <p>Dark-TS is a lightweight TypeScript framework for building web applications using Web Components and decorators. It provides a simple, intuitive API inspired by Lit but with a focus on simplicity.</p>
          </section>
          
          <section>
            <h2>Features</h2>
            <ul>
              <li><strong>@element</strong> - Define custom elements with a simple decorator</li>
              <li><strong>@property</strong> - Reactive properties with type safety</li>
              <li><strong>@query</strong> - Easy DOM queries</li>
              <li><strong>@on</strong> - Event handling with proper context binding</li>
              <li><strong>@controller</strong> - Reusable behavior controllers</li>
              <li><strong>Built-in Router</strong> - Simple hash or pushstate routing</li>
            </ul>
          </section>
          
          <section>
            <h2>Why Dark-TS?</h2>
            <p>We built Dark-TS to provide a simpler alternative to existing frameworks while maintaining the power of decorators and TypeScript. No virtual DOM, no complex build steps, just clean, readable code.</p>
          </section>
          
          <section>
            <h2>Get Started</h2>
            <pre><code>npm install dark-ts
            
@element('my-element')
class MyElement extends HTMLElement {
  html() {
    return \`&lt;h1&gt;Hello World&lt;/h1&gt;\`;
  }
}</code></pre>
          </section>
        </div>
      </div>
    `;
  }

  css() {
    return /*css*/`
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
      }
      
      .about-content {
        background: white;
        padding: 3rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .about-content h1 {
        color: #333;
        margin-bottom: 2rem;
        font-size: 2.5rem;
      }
      
      .about-content h2 {
        color: #667eea;
        margin-top: 2rem;
        margin-bottom: 1rem;
      }
      
      .about-content p {
        line-height: 1.6;
        color: #666;
        margin-bottom: 1rem;
      }
      
      .about-content ul {
        margin-left: 2rem;
        line-height: 1.8;
        color: #666;
      }
      
      .about-content pre {
        background: #f7fafc;
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
      }
      
      .about-content code {
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
      }
      
      section {
        margin-bottom: 2rem;
      }
    `;
  }
}