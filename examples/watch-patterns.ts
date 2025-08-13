import { element, property, query, watch } from '../src';

/**
 * Example showcasing the three @watch patterns:
 * 1. Watch specific properties
 * 2. Watch multiple properties with single decorator
 * 3. Watch all properties with wildcard
 */

@element('responsive-box')
export class ResponsiveBox extends HTMLElement {
  @property({ type: Number })
  width = 200;
  
  @property({ type: Number })
  height = 100;
  
  @property({ type: Number })
  depth = 50;
  
  @property()
  color = '#3498db';
  
  @property({ type: Number })
  opacity = 1;
  
  @property({ type: Number })
  borderWidth = 2;
  
  @property()
  borderColor = '#2c3e50';
  
  @query('.box')
  boxElement?: HTMLElement;
  
  @query('.info')
  infoElement?: HTMLElement;
  
  html() {
    return /*html*/`
      <div class="container">
        <div class="box"></div>
        <div class="info"></div>
      </div>
    `;
  }
  
  css() {
    return /*css*/`
      :host {
        display: block;
        padding: 20px;
      }
      .container {
        position: relative;
      }
      .box {
        transition: all 0.3s ease;
        position: relative;
      }
      .info {
        margin-top: 20px;
        font-family: monospace;
        font-size: 12px;
        color: #666;
      }
    `;
  }
  
  // Pattern 1: Watch specific properties together
  @watch('width', 'height', 'depth')
  updateDimensions() {
    if (!this.boxElement) return;
    
    // Update box dimensions
    this.boxElement.style.width = `${this.width}px`;
    this.boxElement.style.height = `${this.height}px`;
    
    // Simulate 3D with shadow
    const shadowDepth = this.depth / 10;
    this.boxElement.style.boxShadow = `${shadowDepth}px ${shadowDepth}px ${shadowDepth * 2}px rgba(0,0,0,0.2)`;
    
    this.updateInfo();
  }
  
  // Pattern 2: Watch appearance properties
  @watch('color', 'opacity')
  updateAppearance() {
    if (!this.boxElement) return;
    
    this.boxElement.style.backgroundColor = this.color;
    this.boxElement.style.opacity = String(this.opacity);
    
    this.updateInfo();
  }
  
  // Pattern 3: Watch border properties separately
  @watch('borderWidth')
  @watch('borderColor')
  updateBorder() {
    if (!this.boxElement) return;
    
    this.boxElement.style.border = `${this.borderWidth}px solid ${this.borderColor}`;
    
    this.updateInfo();
  }
  
  // Alternative: Watch ALL properties for debugging/logging
  @watch('*')
  logChanges(oldValue: any, newValue: any, propertyName: string) {
    console.log(`[ResponsiveBox] ${propertyName}: ${oldValue} → ${newValue}`);
  }
  
  updateInfo() {
    if (!this.infoElement) return;
    
    this.infoElement.innerHTML = /*html*/`
      <strong>Dimensions:</strong> ${this.width} × ${this.height} × ${this.depth}<br>
      <strong>Appearance:</strong> ${this.color} @ ${(this.opacity * 100).toFixed(0)}%<br>
      <strong>Border:</strong> ${this.borderWidth}px ${this.borderColor}
    `;
  }
  
  connectedCallback() {
    super.connectedCallback?.();
    
    // Initial setup
    this.updateDimensions();
    this.updateAppearance();
    this.updateBorder();
  }
}

// Usage example
@element('watch-demo')
export class WatchDemo extends HTMLElement {
  @query('responsive-box')
  box?: ResponsiveBox;
  
  html() {
    return /*html*/`
      <div>
        <h2>@watch Pattern Examples</h2>
        
        <responsive-box></responsive-box>
        
        <div class="controls">
          <h3>Controls</h3>
          
          <label>
            Width: <input type="range" min="100" max="400" value="200" data-prop="width">
            <span data-value="width">200</span>
          </label>
          
          <label>
            Height: <input type="range" min="50" max="300" value="100" data-prop="height">
            <span data-value="height">100</span>
          </label>
          
          <label>
            Depth: <input type="range" min="0" max="100" value="50" data-prop="depth">
            <span data-value="depth">50</span>
          </label>
          
          <label>
            Color: <input type="color" value="#3498db" data-prop="color">
          </label>
          
          <label>
            Opacity: <input type="range" min="0" max="100" value="100" data-prop="opacity">
            <span data-value="opacity">100%</span>
          </label>
          
          <label>
            Border Width: <input type="range" min="0" max="10" value="2" data-prop="borderWidth">
            <span data-value="borderWidth">2</span>
          </label>
          
          <label>
            Border Color: <input type="color" value="#2c3e50" data-prop="borderColor">
          </label>
        </div>
      </div>
    `;
  }
  
  css() {
    return /*css*/`
      :host {
        display: block;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .controls {
        margin-top: 30px;
        padding: 20px;
        background: #f5f5f5;
        border-radius: 8px;
      }
      label {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 10px 0;
      }
      input[type="range"] {
        flex: 1;
        max-width: 200px;
      }
      input[type="color"] {
        width: 50px;
        height: 30px;
      }
      span[data-value] {
        min-width: 50px;
        font-family: monospace;
      }
    `;
  }
  
  connectedCallback() {
    super.connectedCallback?.();
    
    // Set up control handlers
    this.shadowRoot?.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const prop = target.dataset.prop;
        if (!prop || !this.box) return;
        
        let value: any = target.value;
        
        // Convert to number for numeric properties
        if (target.type === 'range' && prop !== 'opacity') {
          value = Number(value);
        } else if (prop === 'opacity') {
          value = Number(value) / 100;
        }
        
        // Update the property
        (this.box as any)[prop] = value;
        
        // Update display value
        const display = this.shadowRoot?.querySelector(`span[data-value="${prop}"]`);
        if (display) {
          if (prop === 'opacity') {
            display.textContent = `${Math.round(value * 100)}%`;
          } else if (typeof value === 'number') {
            display.textContent = String(value);
          }
        }
      });
    });
  }
}