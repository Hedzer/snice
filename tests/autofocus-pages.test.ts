import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router, element, layout, render, ready, query, html } from 'snice';
import { fadeTransition } from 'snice/transitions';
import '../packages/components/src/input/snice-input';
import '../packages/components/src/textarea/snice-textarea';

async function flushAutofocus(): Promise<void> {
  await new Promise<void>(r => queueMicrotask(r));
  await new Promise<void>(r => setTimeout(r, 40));
  await new Promise<void>(r => setTimeout(r, 40));
}

function getDeepActive(doc: Document = document): Element | null {
  let active: Element | null = doc.activeElement;
  while (active && active.shadowRoot && active.shadowRoot.activeElement) {
    const next = active.shadowRoot.activeElement;
    if (next === active) break;
    active = next;
  }
  return active;
}

describe('autofocus in pages and nested custom elements', () => {
  let root: HTMLElement;
  let extraNodes: HTMLElement[];

  beforeEach(() => {
    root = document.createElement('div');
    root.id = 'autofocus-pages-app';
    document.body.appendChild(root);
    extraNodes = [];
    window.location.hash = '';
  });

  afterEach(() => {
    root.remove();
    for (const node of extraNodes) node.remove();
    extraNodes = [];
    window.location.hash = '';
    if (document.activeElement && (document.activeElement as HTMLElement).blur) {
      (document.activeElement as HTMLElement).blur();
    }
  });

  it('focuses nested <snice-input autofocus> and <snice-textarea autofocus> on initial render without poisoning', async () => {
    @element('af-nested-input-host')
    class NestedInputHost extends HTMLElement {
      @render()
      template() {
        return html`
          <div>
            <snice-input id="first-input" autofocus placeholder="Search"></snice-input>
            <input id="second-native" autofocus />
          </div>
        `;
      }
    }

    const host = document.createElement('af-nested-input-host') as any;
    root.appendChild(host);
    await host.ready;
    const sniceInput = host.shadowRoot!.querySelector('#first-input') as any;
    await sniceInput.ready;
    await flushAutofocus();

    const innerInput = sniceInput.shadowRoot!.querySelector('input');
    expect(innerInput).toBeTruthy();
    const active = getDeepActive();
    expect(active === innerInput || sniceInput.shadowRoot!.activeElement === innerInput).toBe(true);

    // Clean up and test snice-textarea autofocus as well
    host.remove();
    if ((document.activeElement as HTMLElement)?.blur) (document.activeElement as HTMLElement).blur();

    @element('af-nested-textarea-host')
    class NestedTextareaHost extends HTMLElement {
      @render()
      template() {
        return html`<snice-textarea id="notes" autofocus></snice-textarea>`;
      }
    }

    const host2 = document.createElement('af-nested-textarea-host') as any;
    root.appendChild(host2);
    await host2.ready;
    const sniceTextarea = host2.shadowRoot!.querySelector('#notes') as any;
    await sniceTextarea.ready;
    await flushAutofocus();

    const innerTextarea = sniceTextarea.shadowRoot!.querySelector('textarea');
    expect(innerTextarea).toBeTruthy();
    expect(getDeepActive() === innerTextarea || sniceTextarea.shadowRoot!.activeElement === innerTextarea).toBe(true);
  });

  it('focuses nested custom Snice control without delegatesFocus via fallback child', async () => {
    @element('af-custom-control')
    class CustomControl extends HTMLElement {
      @render()
      template() {
        return html`<div class="wrap"><input class="inner" type="text" /></div>`;
      }
    }

    @element('af-custom-control-parent')
    class CustomControlParent extends HTMLElement {
      @render()
      template() {
        return html`<af-custom-control id="ctrl" autofocus></af-custom-control>`;
      }
    }

    const parent = document.createElement('af-custom-control-parent') as any;
    root.appendChild(parent);
    await parent.ready;
    const ctrl = parent.shadowRoot!.querySelector('#ctrl') as any;
    await ctrl.ready;
    await flushAutofocus();

    const inner = ctrl.shadowRoot!.querySelector('input.inner');
    expect(inner).toBeTruthy();
    expect(getDeepActive() === inner || ctrl.shadowRoot!.activeElement === inner).toBe(true);
  });

  it('defers without poisoning when nested custom element has async @ready()', async () => {
    @element('af-slow-child')
    class SlowChild extends HTMLElement {
      @ready()
      async init() {
        await new Promise(r => setTimeout(r, 30));
      }

      @render()
      template() {
        return html`<input class="slow-input" type="text" />`;
      }
    }

    @element('af-slow-parent')
    class SlowParent extends HTMLElement {
      @render()
      template() {
        return html`
          <af-slow-child id="slow" autofocus></af-slow-child>
          <input id="later" autofocus />
        `;
      }
    }

    const parent = document.createElement('af-slow-parent') as any;
    root.appendChild(parent);
    await parent.ready;
    const child = parent.shadowRoot!.querySelector('#slow') as any;
    await child.ready;
    await flushAutofocus();

    const slowInput = child.shadowRoot!.querySelector('input.slow-input');
    expect(slowInput).toBeTruthy();
    expect(getDeepActive() === slowInput || child.shadowRoot!.activeElement === slowInput).toBe(true);
  });

  it('falls through to a later autofocus candidate when an earlier nested control is disabled', async () => {
    @element('af-disabled-fallback-parent')
    class DisabledFallbackParent extends HTMLElement {
      @render()
      template() {
        return html`
          <snice-input id="disabled-first" autofocus disabled></snice-input>
          <input id="enabled-second" autofocus />
        `;
      }
    }

    const parent = document.createElement('af-disabled-fallback-parent') as any;
    root.appendChild(parent);
    await parent.ready;
    const first = parent.shadowRoot!.querySelector('#disabled-first') as any;
    await first.ready;
    await flushAutofocus();

    const second = parent.shadowRoot!.querySelector('#enabled-second');
    expect(getDeepActive() === second || parent.shadowRoot!.activeElement === second).toBe(true);
  });

  it('hands off focus on route navigation from a persistent layout button and across back-and-forth visits', async () => {
    const router = Router({
      target: '#autofocus-pages-app',
      type: 'hash',
      layout: 'af-persistent-layout'
    });

    @layout('af-persistent-layout')
    class PersistentLayout extends HTMLElement {
      @render()
      template() {
        return html`
          <nav>
            <button id="nav-native" @click=${() => router.navigate('/native')}>Native</button>
            <button id="nav-snice" @click=${() => router.navigate('/snice')}>Snice</button>
          </nav>
          <main><slot name="page"></slot></main>
        `;
      }
    }

    @router.page({ tag: 'af-native-page', routes: ['/', '/native'] })
    class NativePage extends HTMLElement {
      @render()
      template() {
        return html`<input id="native-field" autofocus type="text" />`;
      }
    }

    @router.page({ tag: 'af-snice-page', routes: ['/snice'] })
    class SnicePage extends HTMLElement {
      @render()
      template() {
        return html`<snice-input id="snice-field" autofocus></snice-input>`;
      }
    }

    router.initialize();
    await flushAutofocus();

    const shell = root.querySelector('af-persistent-layout') as any;
    await shell.ready;

    // Initial page focus
    let nativePage = shell.querySelector('af-native-page') as any;
    await nativePage.ready;
    await flushAutofocus();
    const firstNativeInput = nativePage.shadowRoot!.querySelector('#native-field');
    expect(getDeepActive() === firstNativeInput || nativePage.shadowRoot!.activeElement === firstNativeInput).toBe(true);

    // Focus layout button and navigate to /snice
    const navSnice = shell.shadowRoot!.querySelector('#nav-snice') as HTMLButtonElement;
    navSnice.focus();
    navSnice.click();
    await flushAutofocus();

    const snicePage = shell.querySelector('af-snice-page') as any;
    expect(snicePage).toBeTruthy();
    await snicePage.ready;
    const sniceField = snicePage.shadowRoot!.querySelector('#snice-field') as any;
    await sniceField.ready;
    await flushAutofocus();
    const innerInput = sniceField.shadowRoot!.querySelector('input');
    expect(getDeepActive() === innerInput || sniceField.shadowRoot!.activeElement === innerInput).toBe(true);

    // Focus layout button again and navigate back to /native
    const navNative = shell.shadowRoot!.querySelector('#nav-native') as HTMLButtonElement;
    navNative.focus();
    navNative.click();
    await flushAutofocus();

    nativePage = shell.querySelector('af-native-page') as any;
    expect(nativePage).toBeTruthy();
    await nativePage.ready;
    await flushAutofocus();
    const secondNativeInput = nativePage.shadowRoot!.querySelector('#native-field');
    expect(getDeepActive() === secondNativeInput || nativePage.shadowRoot!.activeElement === secondNativeInput).toBe(true);
  });

  it('hands off focus when navigating from an external button outside #app and during route transitions', async () => {
    const quickTransition = { ...fadeTransition, outDuration: 40, inDuration: 40 };
    const router = Router({
      target: '#autofocus-pages-app',
      type: 'hash',
      transition: quickTransition
    });

    @router.page({ tag: 'af-trans-a', routes: ['/', '/trans-a'] })
    class TransA extends HTMLElement {
      @render()
      template() {
        return html`<input id="a-input" autofocus />`;
      }
    }

    @router.page({ tag: 'af-trans-b', routes: ['/trans-b'] })
    class TransB extends HTMLElement {
      @render()
      template() {
        return html`<snice-input id="b-snice" autofocus></snice-input>`;
      }
    }

    const extBtn = document.createElement('button');
    extBtn.id = 'external-nav-btn';
    extBtn.textContent = 'Go B';
    document.body.appendChild(extBtn);
    extraNodes.push(extBtn);

    router.initialize();
    await flushAutofocus();

    // Click external button (retains document.activeElement outside #app)
    extBtn.focus();
    expect(document.activeElement).toBe(extBtn);
    await router.navigate('/trans-b');
    await flushAutofocus();

    const pageB = root.querySelector('af-trans-b') as any;
    expect(pageB).toBeTruthy();
    await pageB.ready;
    const sniceInput = pageB.shadowRoot!.querySelector('#b-snice') as any;
    await sniceInput.ready;
    await flushAutofocus();

    const innerB = sniceInput.shadowRoot!.querySelector('input');
    expect(getDeepActive() === innerB || sniceInput.shadowRoot!.activeElement === innerB).toBe(true);

    // Navigate back while focus is still inside outgoing page B during transition
    await router.navigate('/trans-a');
    await flushAutofocus();
    const pageA = root.querySelector('af-trans-a') as any;
    expect(pageA).toBeTruthy();
    await pageA.ready;
    await flushAutofocus();
    const inputA = pageA.shadowRoot!.querySelector('#a-input');
    expect(getDeepActive() === inputA || pageA.shadowRoot!.activeElement === inputA).toBe(true);
  });

  it('preserves explicit focus set inside incoming page @ready() over [autofocus]', async () => {
    const router = Router({
      target: '#autofocus-pages-app',
      type: 'hash'
    });

    @router.page({ tag: 'af-explicit-start', routes: ['/'] })
    class StartPage extends HTMLElement {
      @render()
      template() {
        return html`<button id="start-btn">Start</button>`;
      }
    }

    @router.page({ tag: 'af-explicit-target', routes: ['/explicit'] })
    class ExplicitTargetPage extends HTMLElement {
      @query('#explicit-input')
      explicitInput?: HTMLInputElement;

      @ready()
      async focusExplicit() {
        await Promise.resolve();
        this.explicitInput?.focus();
      }

      @render()
      template() {
        return html`
          <snice-input id="auto-snice" autofocus></snice-input>
          <input id="explicit-input" type="text" />
        `;
      }
    }

    router.initialize();
    await flushAutofocus();

    const extTrigger = document.createElement('button');
    document.body.appendChild(extTrigger);
    extraNodes.push(extTrigger);
    extTrigger.focus();

    await router.navigate('/explicit');
    const targetPage = root.querySelector('af-explicit-target') as any;
    await targetPage.ready;
    const autoSnice = targetPage.shadowRoot!.querySelector('#auto-snice') as any;
    await autoSnice.ready;
    await flushAutofocus();

    const explicitInput = targetPage.shadowRoot!.querySelector('#explicit-input');
    expect(getDeepActive() === explicitInput || targetPage.shadowRoot!.activeElement === explicitInput).toBe(true);
  });

  it('preserves non-router standalone autofocus first-wins when existing focus is present', async () => {
    const existing = document.createElement('button');
    existing.textContent = 'Existing';
    document.body.appendChild(existing);
    extraNodes.push(existing);
    existing.focus();
    expect(document.activeElement).toBe(existing);

    @element('af-standalone-respects-focus')
    class StandaloneHost extends HTMLElement {
      @render()
      template() {
        return html`<snice-input autofocus></snice-input>`;
      }
    }

    const host = document.createElement('af-standalone-respects-focus') as any;
    root.appendChild(host);
    await host.ready;
    await flushAutofocus();

    expect(document.activeElement).toBe(existing);
  });
});
