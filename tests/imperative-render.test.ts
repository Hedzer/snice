import { describe, it, expect, afterEach } from 'vitest';
import { element, property, render, html, query, watch } from '../src/index';

describe('Home page examples', () => {
  let container: HTMLElement;

  afterEach(() => {
    if (container) {
      container.remove();
    }
  });

  // Declarative - exactly as shown on website
  it('declarative style', async () => {
    @element('test-user-card-dec')
    class UserCard extends HTMLElement {
      @property() name = '';
      @property() role = '';

      @render()
      template() {
        return html`
          <div class="card">
            <h3>${this.name}</h3>
            <span>${this.role}</span>
          </div>
        `;
      }
    }

    container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = '<test-user-card-dec name="Alice" role="Engineer"></test-user-card-dec>';

    const el = container.querySelector('test-user-card-dec') as any;
    await el.ready;

    expect(el.shadowRoot.querySelector('h3').textContent).toBe('Alice');
    expect(el.shadowRoot.querySelector('span').textContent).toBe('Engineer');
  });

  // Imperative - initial values via interpolation, @watch for updates
  it('imperative style', async () => {
    @element('test-user-card-imp')
    class UserCard extends HTMLElement {
      @property() name = '';
      @property() role = '';

      @query('.name') $name!: HTMLElement;
      @query('.role') $role!: HTMLElement;

      @render({ once: true })
      template() {
        return html`
          <div class="card">
            <h3 class="name">${this.name}</h3>
            <span class="role">${this.role}</span>
          </div>
        `;
      }

      @watch('name', 'role')
      update() {
        if (!this.$name) return;
        this.$name.textContent = this.name;
        this.$role.textContent = this.role;
      }
    }

    container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = '<test-user-card-imp name="Alice" role="Engineer"></test-user-card-imp>';

    const el = container.querySelector('test-user-card-imp') as any;
    await el.ready;

    expect(el.$name.textContent).toBe('Alice');
    expect(el.$role.textContent).toBe('Engineer');

    // Test that @watch handles updates
    el.name = 'Bob';
    await new Promise(r => setTimeout(r, 10));
    expect(el.$name.textContent).toBe('Bob');
  });
});
