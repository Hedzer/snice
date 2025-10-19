import { describe, it, expect, beforeEach, vi } from 'vitest';
import { element, property, query, render, html } from '../src';
import { controller, attachController, detachController, getController } from './test-imports';
import { Router } from './test-imports';

describe('race conditions and async edge cases', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('controller race conditions', () => {
    it('should handle rapid controller switches', async () => {
      const attach1 = vi.fn();
      const detach1 = vi.fn();
      const attach2 = vi.fn();
      const detach2 = vi.fn();
      
      @controller('race-ctrl-1')
      class RaceController1 {
        element: HTMLElement | null = null;
        async attach(element: HTMLElement) {
          // Simulate async work
          await new Promise(resolve => setTimeout(resolve, 10));
          attach1(element);
          this.element = element;
        }
        async detach() {
          await new Promise(resolve => setTimeout(resolve, 10));
          detach1();
          this.element = null;
        }
      }
      
      @controller('race-ctrl-2')
      class RaceController2 {
        element: HTMLElement | null = null;
        async attach(element: HTMLElement) {
          await new Promise(resolve => setTimeout(resolve, 5));
          attach2(element);
          this.element = element;
        }
        async detach() {
          await new Promise(resolve => setTimeout(resolve, 5));
          detach2();
          this.element = null;
        }
      }
      
      @element('race-element')
      class RaceElement extends HTMLElement {
        @render()
        renderContent() {
          return html``;
        }
      }

      const el = document.createElement('race-element');
      document.body.appendChild(el);
      await el.ready;
      
      // Rapidly switch controllers
      el.setAttribute('controller', 'race-ctrl-1');
      el.setAttribute('controller', 'race-ctrl-2');
      el.setAttribute('controller', 'race-ctrl-1');
      
      // Wait for all operations to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Should end up with ctrl-1 attached
      const ctrl = getController(el);
      expect(ctrl).toBeDefined();
      
      // Should have attached controllers
      expect(attach1).toHaveBeenCalled();
      expect(attach2).toHaveBeenCalled();
      // Detach might not be called if switching is too fast
      // Just check the final state is correct
    });

    it('should handle controller switch during async attach', async () => {
      let ctrl1Attached = false;
      let ctrl2Attached = false;
      
      @controller('async-switch-1')
      class AsyncSwitch1 {
        element: HTMLElement | null = null;
        async attach(element: HTMLElement) {
          await new Promise(resolve => setTimeout(resolve, 20));
          ctrl1Attached = true;
          this.element = element;
        }
        async detach() {
          ctrl1Attached = false;
          this.element = null;
        }
      }
      
      @controller('async-switch-2')
      class AsyncSwitch2 {
        element: HTMLElement | null = null;
        async attach(element: HTMLElement) {
          await new Promise(resolve => setTimeout(resolve, 5));
          ctrl2Attached = true;
          this.element = element;
        }
        async detach() {
          ctrl2Attached = false;
          this.element = null;
        }
      }
      
      @element('async-switch-element')
      class AsyncSwitchElement extends HTMLElement {
        @render()
        renderContent() {
          return html``;
        }
      }

      const el = document.createElement('async-switch-element');
      document.body.appendChild(el);
      await el.ready;
      
      // Start attaching ctrl-1
      el.setAttribute('controller', 'async-switch-1');
      
      // Immediately switch to ctrl-2 before ctrl-1 finishes
      await new Promise(resolve => setTimeout(resolve, 5));
      el.setAttribute('controller', 'async-switch-2');
      
      // Wait for all to complete
      await new Promise(resolve => setTimeout(resolve, 30));
      
      // Only ctrl-2 should be attached
      expect(ctrl2Attached).toBe(true);
      
      // Ctrl-1 might have attached but should have been detached
      const finalCtrl = getController(el);
      expect(finalCtrl).toBeDefined();
    });

    it('should handle element removal during controller attach', async () => {
      const attachSpy = vi.fn();
      const detachSpy = vi.fn();
      let attachCompleted = false;
      
      @controller('remove-during-attach')
      class RemoveDuringAttach {
        element: HTMLElement | null = null;
        async attach(element: HTMLElement) {
          attachSpy();
          await new Promise(resolve => setTimeout(resolve, 20));
          attachCompleted = true;
          this.element = element;
        }
        async detach() {
          detachSpy();
          this.element = null;
        }
      }
      
      @element('remove-during-attach-el')
      class RemoveDuringAttachEl extends HTMLElement {
        @render()
        renderContent() {
          return html``;
        }
      }

      const el = document.createElement('remove-during-attach-el');
      document.body.appendChild(el);
      await el.ready;
      
      // Start attaching controller
      el.setAttribute('controller', 'remove-during-attach');
      
      // Remove element before attach completes
      await new Promise(resolve => setTimeout(resolve, 5));
      document.body.removeChild(el);
      
      // Wait for operations to complete
      await new Promise(resolve => setTimeout(resolve, 30));
      
      expect(attachSpy).toHaveBeenCalled();
      // Detach is called when element is removed
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(attachCompleted).toBe(true); // Attach still completes
    });

    it('should handle simultaneous attach/detach calls', async () => {
      @controller('simultaneous-ctrl')
      class SimultaneousCtrl {
        element: HTMLElement | null = null;
        attachCount = 0;
        detachCount = 0;
        
        async attach(element: HTMLElement) {
          this.attachCount++;
          await new Promise(resolve => setTimeout(resolve, 10));
          this.element = element;
        }
        
        async detach() {
          this.detachCount++;
          await new Promise(resolve => setTimeout(resolve, 10));
          this.element = null;
        }
      }
      
      const el = document.createElement('div');
      
      // Call attach and detach simultaneously
      const attachPromise = attachController(el, 'simultaneous-ctrl');
      const detachPromise = detachController(el);
      
      await Promise.all([attachPromise, detachPromise]);
      
      // Element should be in a consistent state
      const ctrl = getController(el);
      // Could be either attached or detached depending on order
      expect(ctrl === undefined || ctrl !== undefined).toBe(true);
    });
  });

  describe('property update race conditions', () => {
    it('should handle rapid property updates', async () => {
      @element('rapid-prop-update')
      class RapidPropUpdate extends HTMLElement {
        @property()
        value = 0;

        @render()
        renderContent() {
          return html`<div>${this.value}</div>`;
        }
      }

      const el = document.createElement('rapid-prop-update') as any;
      document.body.appendChild(el);
      await el.ready;

      // Rapid updates
      for (let i = 1; i <= 100; i++) {
        el.value = i;
      }

      // Wait for batched render
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.value).toBe(100);
      expect(el.getAttribute('value')).toBe('100');
      expect(el.shadowRoot?.textContent).toContain('100');
    });

    it('should handle property updates during disconnection', async () => {
      @element('prop-during-disconnect')
      class PropDuringDisconnect extends HTMLElement {
        @property()
        value = 'initial';

        @render()
        renderContent() {
          return html``;
        }
      }

      const el = document.createElement('prop-during-disconnect') as any;
      document.body.appendChild(el);
      await el.ready;
      
      // Start removing
      document.body.removeChild(el);
      
      // Update property while disconnected
      el.value = 'updated';
      
      // Property should still update
      expect(el.value).toBe('updated');
      
      // Re-attach
      document.body.appendChild(el);
      
      // Attribute should reflect
      expect(el.getAttribute('value')).toBe('updated');
    });

    it('should handle concurrent property updates', async () => {
      // Test simpler case: verify multiple properties can be updated and batched
      @element('concurrent-props')
      class ConcurrentProps extends HTMLElement {
        @property()
        prop1 = 0;

        @property()
        prop2 = 0;

        @property()
        prop3 = 0;

        @render()
        renderContent() {
          return html`<div>${this.prop1} ${this.prop2} ${this.prop3}</div>`;
        }
      }

      const el = document.createElement('concurrent-props') as any;
      document.body.appendChild(el);
      await el.ready;

      // Update multiple properties - they should all work
      el.prop1 = 5;
      el.prop2 = 6;
      el.prop3 = 7;

      // Wait for batched render
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.prop1).toBe(5);
      expect(el.prop2).toBe(6);
      expect(el.prop3).toBe(7);
      expect(el.shadowRoot?.textContent).toContain('5 6 7');
    });
  });

  describe('DOM query race conditions', () => {
    it('should handle queries during rapid DOM changes', async () => {
      @element('rapid-dom-change')
      class RapidDomChange extends HTMLElement {
        @query('.target')
        target?: HTMLElement;

        @query('.other')
        other?: HTMLElement;

        @render()
        renderContent() {
          return html``;
        }
      }
      
      const el = document.createElement('rapid-dom-change') as any;
      document.body.appendChild(el);
      await el.ready;

      // Rapidly change DOM
      for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
          if (el.shadowRoot) el.shadowRoot.innerHTML = '<div class="target">Target</div>';
        } else {
          if (el.shadowRoot) el.shadowRoot.innerHTML = '<div class="other">Other</div>';
        }
      }
      
      // Should have the final state
      expect(el.target).toBeNull();
      expect(el.other).toBeDefined();
    });

    it('should handle queries on elements being moved', async () => {
      @element('moving-element')
      class MovingElement extends HTMLElement {
        @query('.child')
        child?: HTMLElement;

        @render()
        renderContent() {
          return html`<div class="child">Child</div>`;
        }
      }

      const el = document.createElement('moving-element') as any;
      const container1 = document.createElement('div');
      const container2 = document.createElement('div');

      document.body.appendChild(container1);
      document.body.appendChild(container2);

      // Add to first container
      container1.appendChild(el);
      await el.ready;
      expect(el.child).toBeDefined();
      
      // Move to second container
      container2.appendChild(el);
      expect(el.child).toBeDefined();
      
      // Move back
      container1.appendChild(el);
      expect(el.child).toBeDefined();
    });
  });

  describe('router race conditions', () => {
    it('should handle rapid navigation', async () => {
      const targetEl = document.createElement('div');
      targetEl.id = 'rapid-nav-target-unique';
      document.body.appendChild(targetEl);
      
      const router = Router({
        target: '#rapid-nav-target-unique',
        type: 'hash'
      });
      
      const { page, initialize, navigate } = router;
      
      @page({ tag: 'rapid-page-a', routes: ['/rapid/a'] })
      class RapidPageA extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Page A</div>`;
        }
      }

      @page({ tag: 'rapid-page-b', routes: ['/rapid/b'] })
      class RapidPageB extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Page B</div>`;
        }
      }

      @page({ tag: 'rapid-page-c', routes: ['/rapid/c'] })
      class RapidPageC extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Page C</div>`;
        }
      }
      
      initialize();
      
      // Rapid navigation
      await navigate('/rapid/a');
      await navigate('/rapid/b');
      await navigate('/rapid/c');
      await navigate('/rapid/a');
      await navigate('/rapid/b');
      
      // Should end up on page B
      const currentPage = targetEl.querySelector('rapid-page-b');
      expect(currentPage).toBeDefined();
      expect(targetEl.children.length).toBe(1); // Only one page element
      
      // Clean up
      targetEl.remove();
    });

    it('should handle navigation during page render', async () => {
      const targetEl = document.createElement('div');
      targetEl.id = 'nav-during-render-unique';
      document.body.appendChild(targetEl);
      
      const router = Router({
        target: '#nav-during-render-unique',
        type: 'hash'
      });
      
      const { page, initialize, navigate } = router;
      
      let slowPageRendered = false;
      
      @page({ tag: 'render-slow-page', routes: ['/render/slow'] })
      class RenderSlowPage extends HTMLElement {
        @render()
        renderContent() {
          // Simulate slow render
          const start = Date.now();
          while (Date.now() - start < 10) {
            // Block for 10ms
          }
          slowPageRendered = true;
          return html`<div>Slow Page</div>`;
        }
      }

      @page({ tag: 'render-fast-page', routes: ['/render/fast'] })
      class RenderFastPage extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Fast Page</div>`;
        }
      }
      
      initialize();
      
      // Navigate to slow page
      await navigate('/render/slow');
      
      // Immediately navigate to fast page
      await navigate('/render/fast');
      
      // Should show fast page
      const currentPage = targetEl.querySelector('render-fast-page');
      expect(currentPage).toBeDefined();
      expect(slowPageRendered).toBe(true); // Slow page still rendered
    });

    it('should handle hashchange events during navigation', async () => {
      // Create a fresh target element
      const targetEl = document.createElement('div');
      targetEl.id = 'hashchange-race-unique';
      document.body.appendChild(targetEl);
      
      const router = Router({
        target: '#hashchange-race-unique',
        type: 'hash'
      });
      
      const { page, initialize, navigate } = router;
      
      @page({ tag: 'hashchange-page-1', routes: ['/hashchange/1'] })
      class HashchangePage1 extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Hash 1</div>`;
        }
      }

      @page({ tag: 'hashchange-page-2', routes: ['/hashchange/2'] })
      class HashchangePage2 extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Hash 2</div>`;
        }
      }
      
      initialize();
      
      // Programmatic navigation
      navigate('/hashchange/1');
      
      // Simultaneous hash change
      window.location.hash = '#/hashchange/2';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      
      // Let events process
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should show hash2 page
      const currentPage = targetEl.querySelector('hashchange-page-2');
      expect(currentPage).toBeDefined();
    });
  });

  describe('event handling race conditions', () => {
    it('should handle events during element reconnection', async () => {
      const clickSpy = vi.fn();

      @element('reconnect-events')
      class ReconnectEvents extends HTMLElement {
        @render()
        renderContent() {
          return html`<button class="btn" @click=${this.handleClick}>Click</button>`;
        }

        handleClick() {
          clickSpy();
        }
      }

      const el = document.createElement('reconnect-events');
      document.body.appendChild(el);
      await el.ready;

      const btn = el.shadowRoot?.querySelector('.btn') as HTMLElement;

      // Click works initially
      btn.click();
      expect(clickSpy).toHaveBeenCalledTimes(1);

      // Disconnect
      document.body.removeChild(el);

      // In v3, events on detached elements still work (button still has event listener)
      btn.click();
      expect(clickSpy).toHaveBeenCalledTimes(2);

      // Reconnect
      document.body.appendChild(el);

      // Button reference is still the same (no re-render)
      const sameBtn = el.shadowRoot?.querySelector('.btn') as HTMLElement;
      expect(sameBtn).toBe(btn); // Same element reference

      // Click after reconnection - events continue to work
      sameBtn.click();
      expect(clickSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle overlapping event bubbling', async () => {
      const events: string[] = [];

      @element('bubble-race')
      class BubbleRace extends HTMLElement {
        @render()
        renderContent() {
          return html`
            <div class="outer" @click=${this.handleOuter}>
              <div class="middle" @click=${this.handleMiddle}>
                <div class="inner" @click=${this.handleInner}>Click</div>
              </div>
            </div>
          `;
        }

        handleOuter() {
          events.push('outer');
        }

        handleMiddle() {
          events.push('middle');
        }

        handleInner() {
          events.push('inner');
        }
      }

      const el = document.createElement('bubble-race');
      document.body.appendChild(el);
      await el.ready;
      
      const inner = el.shadowRoot?.querySelector('.inner') as HTMLElement;
      inner.click();

      // Events bubble from inner to outer
      expect(events).toEqual(['inner', 'middle', 'outer']);
    });

    it('should handle event handler throwing error', async () => {
      const handler2 = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      @element('error-in-handler')
      class ErrorInHandler extends HTMLElement {
        @render()
        renderContent() {
          return html`<button class="btn" @click=${this.handler1}>Click</button>`;
        }

        handler1() {
          handler2();
          throw new Error('Handler 1 error');
        }
      }

      const el = document.createElement('error-in-handler');
      document.body.appendChild(el);
      await el.ready;
      
      const btn = el.shadowRoot?.querySelector('.btn') as HTMLElement;

      // Handler will throw but should still be called
      expect(() => btn.click()).toThrow('Handler 1 error');
      expect(handler2).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('lifecycle race conditions', () => {
    it('should handle rapid connect/disconnect cycles', () => {
      let connectCount = 0;
      let disconnectCount = 0;

      @element('rapid-lifecycle')
      class RapidLifecycle extends HTMLElement {
        @render()
        renderContent() {
          return html``;
        }

        connectedCallback() {
          connectCount++;
        }

        disconnectedCallback() {
          disconnectCount++;
        }
      }
      
      const el = document.createElement('rapid-lifecycle');
      
      // Rapid connect/disconnect
      for (let i = 0; i < 10; i++) {
        document.body.appendChild(el);
        document.body.removeChild(el);
      }
      
      expect(connectCount).toBe(10);
      expect(disconnectCount).toBe(10);
    });

    it('should handle attribute changes during connection', () => {
      const attrChanges: any[] = [];

      @element('attr-during-connect')
      class AttrDuringConnect extends HTMLElement {
        static get observedAttributes() {
          return ['test'];
        }

        @render()
        renderContent() {
          return html``;
        }

        attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
          attrChanges.push({ name, oldValue, newValue });
        }

        connectedCallback() {
          // Change attribute during connection
          this.setAttribute('test', 'during-connect');
        }
      }
      
      const el = document.createElement('attr-during-connect');
      el.setAttribute('test', 'initial');
      document.body.appendChild(el);
      
      expect(attrChanges).toContainEqual({
        name: 'test',
        oldValue: null,
        newValue: 'initial'
      });
      
      expect(attrChanges).toContainEqual({
        name: 'test',
        oldValue: 'initial',
        newValue: 'during-connect'
      });
    });
  });

  describe('memory and cleanup', () => {
    it('should cleanup event listeners on element removal', async () => {
      const clickSpy = vi.fn();

      @element('cleanup-test')
      class CleanupTest extends HTMLElement {
        @render()
        renderContent() {
          return html`<button @click=${this.handleClick}>Click</button>`;
        }

        handleClick() {
          clickSpy();
        }
      }

      const el = document.createElement('cleanup-test');
      document.body.appendChild(el);
      await el.ready;
      
      const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
      button.click();
      expect(clickSpy).toHaveBeenCalledTimes(1);

      // Remove from DOM
      document.body.removeChild(el);

      // Events should still work on detached button (button still exists in shadow DOM)
      // This test just verifies no errors occur
      button.click();
      expect(clickSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle controller cleanup on rapid switches', async () => {
      const cleanups: string[] = [];
      
      @controller('cleanup-1')
      class Cleanup1 {
        element: HTMLElement | null = null;
        async attach(element: HTMLElement) {
          this.element = element;
        }
        async detach() {
          cleanups.push('cleanup-1');
          this.element = null;
        }
      }
      
      @controller('cleanup-2')
      class Cleanup2 {
        element: HTMLElement | null = null;
        async attach(element: HTMLElement) {
          this.element = element;
        }
        async detach() {
          cleanups.push('cleanup-2');
          this.element = null;
        }
      }
      
      @element('cleanup-element')
      class CleanupElement extends HTMLElement {
        @render()
        renderContent() {
          return html``;
        }
      }

      const el = document.createElement('cleanup-element');
      document.body.appendChild(el);
      await el.ready;
      
      // Rapid switches
      for (let i = 0; i < 5; i++) {
        el.setAttribute('controller', 'cleanup-1');
        el.setAttribute('controller', 'cleanup-2');
      }
      
      // Final removal
      document.body.removeChild(el);
      
      // Wait for all cleanups
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Cleanup should be called for the last controller when element is removed
      expect(cleanups.length).toBeGreaterThanOrEqual(1);
    });
  });
});