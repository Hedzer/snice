import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  element, property, ready, render, html,
  controller, attachController, detachController, getController,
  useNativeElementControllers, cleanupNativeElementControllers,
  PENDING_CONTROLLER_BINDING
} from './test-imports';

/**
 * controller=${ControllerClass} — direct class binding.
 *
 * The @controller('name') decorator remains REQUIRED on every controller
 * class (it registers, marks, and flushes pending attachments). The class
 * binding only changes the attach side: pass the decorated class itself
 * instead of its registry name. Strings remain fully supported and are the
 * only channel for raw HTML markup.
 */

let uid = 0;
const uniqueTag = (prefix: string) => `${prefix}-${++uid}`;
const tick = (ms = 20) => new Promise(resolve => setTimeout(resolve, ms));

// Shared child element used by all snice-element binding tests. Tag names in
// snice templates are static, so every host template references this one tag.
const CHILD_TAG = 'class-bind-child-el';

@element(CHILD_TAG)
class ClassBindChild extends HTMLElement {}

function makeControllerClass() {
  const attachSpy = vi.fn();
  const detachSpy = vi.fn();
  const registeredName = `class-bind-registered-${++uid}`;

  @controller(registeredName)
  class TestController {
    element: HTMLElement | null = null;
    async attach(el: HTMLElement) { this.element = el; attachSpy(el); }
    async detach(el: HTMLElement) { this.element = null; detachSpy(el); }
  }

  return { TestController, registeredName, attachSpy, detachSpy };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  cleanupNativeElementControllers();
});

// ---------------------------------------------------------------------------
// A. Imperative attachController(el, Class)
// ---------------------------------------------------------------------------

describe('attachController with a class reference', () => {
  it('can attach to its own host from an @ready handler without deadlocking', async () => {
    const { TestController, attachSpy } = makeControllerClass();
    const hostTag = uniqueTag('class-bind-ready-self');

    @element(hostTag)
    class ReadySelfHost extends HTMLElement {
      @ready()
      async initializeController() {
        await attachController(this, TestController);
      }
    }

    const host = document.createElement(hostTag) as any;
    document.body.append(host);
    const outcome = await Promise.race([
      host.ready.then(() => 'ready'),
      tick(100).then(() => 'timeout')
    ]);
    host.remove();

    expect(outcome).toBe('ready');
    expect(attachSpy).toHaveBeenCalledWith(host);
  });

  it('attaches a decorated class to a plain element', async () => {
    const { TestController, registeredName, attachSpy } = makeControllerClass();
    const div = document.createElement('div');

    await attachController(div, TestController);

    expect(attachSpy).toHaveBeenCalledWith(div);
    expect(getController(div)).toBeInstanceOf(TestController);
    expect(div.getAttribute('controller')).toBe(registeredName);
  });

  it('rejects an undecorated class with an error mentioning @controller', async () => {
    class Undecorated {
      element: HTMLElement | null = null;
      async attach() {}
      async detach() {}
    }
    const div = document.createElement('div');

    await expect(attachController(div, Undecorated as any))
      .rejects.toThrow(/@controller/);
    expect(getController(div)).toBeUndefined();
  });

  it('rejects a controller instance (classes only)', async () => {
    const { TestController } = makeControllerClass();
    const instance = new (TestController as any)();
    const div = document.createElement('div');

    await expect(attachController(div, instance))
      .rejects.toThrow(/class/i);
    expect(getController(div)).toBeUndefined();
  });

  it('re-attaching the same class is a no-op (reference dedupe)', async () => {
    const { TestController, attachSpy, detachSpy } = makeControllerClass();
    const div = document.createElement('div');

    await attachController(div, TestController);
    await attachController(div, TestController);

    expect(attachSpy).toHaveBeenCalledTimes(1);
    expect(detachSpy).not.toHaveBeenCalled();
  });

  it('removes the reflected class name on detach', async () => {
    const { TestController, registeredName } = makeControllerClass();
    const div = document.createElement('div');

    await attachController(div, TestController);
    expect(div.getAttribute('controller')).toBe(registeredName);

    await detachController(div);
    expect(div.hasAttribute('controller')).toBe(false);
  });

  it('does not claim the element when a class constructor throws', async () => {
    @controller(`class-bind-throwing-${++uid}`)
    class ThrowingController {
      element: HTMLElement | null = null;
      constructor() { throw new Error('constructor failed'); }
      async attach() {}
      async detach() {}
    }
    const div = document.createElement('div');

    await expect(attachController(div, ThrowingController)).rejects.toThrow('constructor failed');
    expect(div.hasAttribute('controller')).toBe(false);

    const fallback = makeControllerClass();
    await attachController(div, fallback.TestController);
    expect(fallback.attachSpy).toHaveBeenCalledWith(div);
    expect(div.getAttribute('controller')).toBe(fallback.registeredName);
  });

  it('swapping class A -> class B detaches A and attaches B', async () => {
    const a = makeControllerClass();
    const b = makeControllerClass();
    const div = document.createElement('div');

    await attachController(div, a.TestController);
    await attachController(div, b.TestController);

    expect(a.detachSpy).toHaveBeenCalledWith(div);
    expect(b.attachSpy).toHaveBeenCalledWith(div);
    expect(getController(div)).toBeInstanceOf(b.TestController);
  });

  it('dedupes overlapping requests for the same replacement class', async () => {
    @controller(`class-bind-slow-detach-${++uid}`)
    class SlowDetachController {
      element: HTMLElement | null = null;
      async attach(element: HTMLElement) { this.element = element; }
      async detach() {
        await tick(15);
        this.element = null;
      }
    }
    const replacement = makeControllerClass();
    const div = document.createElement('div');

    await attachController(div, SlowDetachController);
    const first = attachController(div, replacement.TestController);
    const second = attachController(div, replacement.TestController);
    await Promise.all([first, second]);

    expect(replacement.attachSpy).toHaveBeenCalledTimes(1);
    expect(getController(div)).toBeInstanceOf(replacement.TestController);
    expect(div.getAttribute('controller')).toBe(replacement.registeredName);
  });

  it('swapping between a registered string and a class works both directions', async () => {
    const { TestController, attachSpy, detachSpy } = makeControllerClass();
    const stringAttach = vi.fn();
    @controller(`class-bind-string-leg-${++uid}`)
    class StringLeg {
      element: HTMLElement | null = null;
      async attach(el: HTMLElement) { stringAttach(el); }
      async detach() {}
    }
    const stringName = `class-bind-string-leg-${uid}`;
    const div = document.createElement('div');

    await attachController(div, stringName);
    expect(stringAttach).toHaveBeenCalledTimes(1);

    await attachController(div, TestController);
    expect(attachSpy).toHaveBeenCalledTimes(1);
    expect(getController(div)).toBeInstanceOf(TestController);

    await attachController(div, stringName);
    expect(detachSpy).toHaveBeenCalledTimes(1);
    expect(stringAttach).toHaveBeenCalledTimes(2);
  });

  it('controller-attached event fires with the class name and instance', async () => {
    const { TestController } = makeControllerClass();
    const div = document.createElement('div');
    const events: any[] = [];
    div.addEventListener('controller-attached', (e: any) => events.push(e.detail));

    await attachController(div, TestController);

    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('TestController');
    expect(events[0].controller).toBeInstanceOf(TestController);
  });

  it('controller-detached event fires with the class name', async () => {
    const { TestController } = makeControllerClass();
    const div = document.createElement('div');
    const events: any[] = [];
    div.addEventListener('controller-detached', (e: any) => events.push(e.detail));

    await attachController(div, TestController);
    await detachController(div);

    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('TestController');
  });
});

// ---------------------------------------------------------------------------
// B. Snice elements: template binding + property assignment
// ---------------------------------------------------------------------------

describe('controller=${Class} on snice elements', () => {
  function makeHost() {
    const hostTag = uniqueTag('class-bind-host');

    @element(hostTag)
    class Host extends HTMLElement {
      @property({ attribute: false }) ctrl: any = null;
      @property() label = '';

      @render()
      template() {
        return html`<class-bind-child-el controller=${this.ctrl} data-label="${this.label}"></class-bind-child-el>`;
      }
    }

    const host = document.createElement(hostTag) as any;
    document.body.appendChild(host);
    return host;
  }

  const childOf = (host: any) =>
    host.shadowRoot!.querySelector(CHILD_TAG)! as HTMLElement;

  it('attaches the class to the child element', async () => {
    const { TestController, attachSpy } = makeControllerClass();
    const host = makeHost();

    host.ctrl = TestController;
    await tick();

    expect(attachSpy).toHaveBeenCalledWith(childOf(host));
    expect(getController(childOf(host))).toBeInstanceOf(TestController);
  });

  it('reflects the decorator name for class bindings', async () => {
    const { TestController, registeredName } = makeControllerClass();
    const host = makeHost();

    host.ctrl = TestController;
    await tick();

    expect(childOf(host).getAttribute('controller')).toBe(registeredName);
  });

  it('re-render with the same class ref does not detach/re-attach', async () => {
    const { TestController, attachSpy, detachSpy } = makeControllerClass();
    const host = makeHost();

    host.ctrl = TestController;
    await tick();
    host.label = 'changed-1';
    await tick();
    host.label = 'changed-2';
    await tick();

    expect(attachSpy).toHaveBeenCalledTimes(1);
    expect(detachSpy).not.toHaveBeenCalled();
  });

  it('swapping bound class A -> B detaches A and attaches B', async () => {
    const a = makeControllerClass();
    const b = makeControllerClass();
    const host = makeHost();

    host.ctrl = a.TestController;
    await tick();
    host.ctrl = b.TestController;
    await tick();

    expect(a.detachSpy).toHaveBeenCalledWith(childOf(host));
    expect(b.attachSpy).toHaveBeenCalledWith(childOf(host));
  });

  it('binding null detaches the class controller', async () => {
    const { TestController, attachSpy, detachSpy } = makeControllerClass();
    const host = makeHost();

    host.ctrl = TestController;
    await tick();
    expect(attachSpy).toHaveBeenCalledTimes(1);

    host.ctrl = null;
    await tick();

    expect(detachSpy).toHaveBeenCalledWith(childOf(host));
    expect(getController(childOf(host))).toBeUndefined();
  });

  it('dynamic STRING values still flow through the attribute channel', async () => {
    const stringAttach = vi.fn();
    @controller(`class-bind-dynamic-string-${++uid}`)
    class DynController {
      element: HTMLElement | null = null;
      async attach(el: HTMLElement) { stringAttach(el); }
      async detach() {}
    }
    const name = `class-bind-dynamic-string-${uid}`;
    const host = makeHost();

    host.ctrl = name;
    await tick(30);

    expect(childOf(host).getAttribute('controller')).toBe(name);
    expect(stringAttach).toHaveBeenCalledWith(childOf(host));
  });

  it('swapping string -> class updates the diagnostic attribute and swaps controllers', async () => {
    const stringAttach = vi.fn();
    const stringDetach = vi.fn();
    @controller(`class-bind-swap-out-${++uid}`)
    class SwapOut {
      element: HTMLElement | null = null;
      async attach(el: HTMLElement) { stringAttach(el); }
      async detach(el: HTMLElement) { stringDetach(el); }
    }
    const name = `class-bind-swap-out-${uid}`;
    const { TestController, registeredName, attachSpy } = makeControllerClass();
    const host = makeHost();

    host.ctrl = name;
    await tick(30);
    expect(stringAttach).toHaveBeenCalledTimes(1);

    host.ctrl = TestController;
    await tick(30);

    expect(stringDetach).toHaveBeenCalledWith(childOf(host));
    expect(attachSpy).toHaveBeenCalledWith(childOf(host));
    expect(childOf(host).getAttribute('controller')).toBe(registeredName);
  });

  it('swapping class -> string detaches the class and attaches by name', async () => {
    const stringAttach = vi.fn();
    @controller(`class-bind-swap-in-${++uid}`)
    class SwapIn {
      element: HTMLElement | null = null;
      async attach(el: HTMLElement) { stringAttach(el); }
      async detach() {}
    }
    const name = `class-bind-swap-in-${uid}`;
    const { TestController, detachSpy } = makeControllerClass();
    const host = makeHost();

    host.ctrl = TestController;
    await tick();

    host.ctrl = name;
    await tick(30);

    expect(detachSpy).toHaveBeenCalledWith(childOf(host));
    expect(stringAttach).toHaveBeenCalledWith(childOf(host));
    expect(childOf(host).getAttribute('controller')).toBe(name);
  });

  it('direct property assignment el.controller = Class attaches', async () => {
    const { TestController, registeredName, attachSpy } = makeControllerClass();
    const el = document.createElement(CHILD_TAG) as any;
    document.body.appendChild(el);
    await tick();

    el.controller = TestController;
    await tick();

    expect(attachSpy).toHaveBeenCalledWith(el);
    expect(el.controller).toBe(TestController);
    expect(el.getAttribute('controller')).toBe(registeredName);
  });

  it('assigning the same class twice attaches once', async () => {
    const { TestController, attachSpy } = makeControllerClass();
    const el = document.createElement(CHILD_TAG) as any;
    document.body.appendChild(el);
    await tick();

    el.controller = TestController;
    await tick();
    el.controller = TestController;
    await tick();

    expect(attachSpy).toHaveBeenCalledTimes(1);
  });

  it('keeps the reflected class name authoritative without re-attaching', async () => {
    const { TestController, registeredName, attachSpy, detachSpy } = makeControllerClass();
    const el = document.createElement(CHILD_TAG) as any;
    document.body.appendChild(el);
    await tick();

    el.controller = TestController;
    await tick();
    el.setAttribute('controller', 'not-the-attached-controller');
    expect(el.getAttribute('controller')).toBe(registeredName);
    el.removeAttribute('controller');
    expect(el.getAttribute('controller')).toBe(registeredName);
    await tick();

    expect(getController(el)).toBeInstanceOf(TestController);
    expect(attachSpy).toHaveBeenCalledTimes(1);
    expect(detachSpy).not.toHaveBeenCalled();
  });

  it('an undecorated class bound in a template reports an error and does not attach', async () => {
    class Undecorated {
      element: HTMLElement | null = null;
      async attach() {}
      async detach() {}
    }
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const host = makeHost();

    host.ctrl = Undecorated;
    await tick(30);

    expect(getController(childOf(host))).toBeUndefined();
    expect(errorSpy.mock.calls.some(args => args.join(' ').includes('@controller')
      || args.some(a => a instanceof Error && /@controller/.test(a.message)))).toBe(true);
    errorSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// C. Native elements in templates + MutationObserver interplay
// ---------------------------------------------------------------------------

describe('controller=${Class} on native elements', () => {
  function makeNativeHost(renderRoot: 'shadow' | 'light' = 'shadow') {
    const hostTag = uniqueTag('class-bind-native-host');

    @element(hostTag, { renderRoot })
    class Host extends HTMLElement {
      @property({ attribute: false }) ctrl: any = null;
      @property({ type: Boolean, attribute: false }) showDiv = true;
      @property() label = '';

      @render()
      template() {
        const inner = this.showDiv
          ? html`<div class="target" controller=${this.ctrl}></div>`
          : html``;
        return html`<section data-label="${this.label}">${inner}</section>`;
      }
    }

    const host = document.createElement(hostTag) as any;
    document.body.appendChild(host);
    return host;
  }

  const targetOf = (host: any) =>
    (host.shadowRoot ?? host).querySelector('.target')! as HTMLElement;

  it('attaches the class to a native div inside a template', async () => {
    const { TestController, registeredName, attachSpy } = makeControllerClass();
    const host = makeNativeHost();

    host.ctrl = TestController;
    await tick();

    expect(attachSpy).toHaveBeenCalledWith(targetOf(host));
    expect(getController(targetOf(host))).toBeInstanceOf(TestController);
    expect(targetOf(host).getAttribute('controller')).toBe(registeredName);
  });

  it('does not double-mount when the native MutationObserver is active', async () => {
    useNativeElementControllers();
    const { TestController, registeredName, attachSpy, detachSpy } = makeControllerClass();
    const host = makeNativeHost('light');

    host.ctrl = TestController;
    await tick(30);

    expect(attachSpy).toHaveBeenCalledTimes(1);
    expect(detachSpy).not.toHaveBeenCalled();
    expect(targetOf(host).getAttribute('controller')).toBe(registeredName);
  });

  it('MutationObserver does not detach a class-attached controller on DOM insertion', async () => {
    useNativeElementControllers();
    const { TestController, registeredName, attachSpy, detachSpy } = makeControllerClass();

    // Imperative class attach on a detached native element, then insert it.
    const div = document.createElement('div');
    await attachController(div, TestController);
    expect(attachSpy).toHaveBeenCalledTimes(1);

    document.body.appendChild(div);
    await tick(30);

    expect(detachSpy).not.toHaveBeenCalled();
    expect(getController(div)).toBeInstanceOf(TestController);
    expect(div.getAttribute('controller')).toBe(registeredName);
  });

  it('a later controller attribute write does not stomp a template class binding', async () => {
    useNativeElementControllers();
    const stringAttach = vi.fn();
    @controller(`class-bind-stomp-${++uid}`)
    class Stomper {
      element: HTMLElement | null = null;
      async attach(el: HTMLElement) { stringAttach(el); }
      async detach() {}
    }
    const name = `class-bind-stomp-${uid}`;
    const { TestController, registeredName, detachSpy } = makeControllerClass();
    const host = makeNativeHost('light');

    host.ctrl = TestController;
    await tick(30);

    targetOf(host).setAttribute('controller', name);
    await tick(30);

    expect(stringAttach).not.toHaveBeenCalled();
    expect(detachSpy).not.toHaveBeenCalled();
    expect(getController(targetOf(host))).toBeInstanceOf(TestController);
    expect(targetOf(host).getAttribute('controller')).toBe(registeredName);
  });

  it('restores a removed diagnostic attribute without re-attaching', async () => {
    useNativeElementControllers();
    const { TestController, registeredName, attachSpy, detachSpy } = makeControllerClass();
    const host = makeNativeHost('light');

    host.ctrl = TestController;
    await tick(30);
    targetOf(host).removeAttribute('controller');
    await tick(30);

    expect(targetOf(host).getAttribute('controller')).toBe(registeredName);
    expect(attachSpy).toHaveBeenCalledTimes(1);
    expect(detachSpy).not.toHaveBeenCalled();
  });

  it('binding null detaches the native class controller', async () => {
    const { TestController, detachSpy } = makeControllerClass();
    const host = makeNativeHost();

    host.ctrl = TestController;
    await tick();
    const target = targetOf(host);
    host.ctrl = null;
    await tick();

    expect(detachSpy).toHaveBeenCalledWith(target);
    expect(getController(target)).toBeUndefined();
    expect(target.hasAttribute('controller')).toBe(false);
  });

  it('removing the bound subtree detaches the native class controller', async () => {
    const { TestController, attachSpy, detachSpy } = makeControllerClass();
    const host = makeNativeHost();

    host.ctrl = TestController;
    await tick();
    expect(attachSpy).toHaveBeenCalledTimes(1);

    host.showDiv = false;
    await tick();

    expect(detachSpy).toHaveBeenCalledTimes(1);
  });

  it('host disconnect detaches, host reconnect re-attaches', async () => {
    const { TestController, attachSpy, detachSpy } = makeControllerClass();
    const host = makeNativeHost();

    host.ctrl = TestController;
    await tick();
    expect(attachSpy).toHaveBeenCalledTimes(1);

    host.remove();
    await tick();
    expect(detachSpy).toHaveBeenCalledTimes(1);

    document.body.appendChild(host);
    await tick(30);
    expect(attachSpy).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// D. String path stays intact
// ---------------------------------------------------------------------------

describe('string controller path remains intact', () => {
  it('static controller="name" in a template still attaches', async () => {
    const stringAttach = vi.fn();
    @controller(`class-bind-static-${++uid}`)
    class StaticController {
      element: HTMLElement | null = null;
      async attach(el: HTMLElement) { stringAttach(el); }
      async detach() {}
    }
    const name = `class-bind-static-${uid}`;
    const hostTag = uniqueTag('class-bind-static-host');

    @element(hostTag)
    class Host extends HTMLElement {
      @property() ctrlName = name;

      @render()
      template() {
        return html`<class-bind-child-el controller="${this.ctrlName}"></class-bind-child-el>`;
      }
    }

    const host = document.createElement(hostTag) as any;
    document.body.appendChild(host);
    await tick(30);

    const child = host.shadowRoot!.querySelector(CHILD_TAG)!;
    expect(stringAttach).toHaveBeenCalledWith(child);
  });

  it('interpolated controller="prefix-${x}" still behaves as a string attribute', async () => {
    const stringAttach = vi.fn();
    @controller(`class-bind-interp-${++uid}`)
    class InterpController {
      element: HTMLElement | null = null;
      async attach(el: HTMLElement) { stringAttach(el); }
      async detach() {}
    }
    const fullName = `class-bind-interp-${uid}`;
    const suffix = String(uid);
    const hostTag = uniqueTag('class-bind-interp-host');

    @element(hostTag)
    class Host extends HTMLElement {
      @property() suffix = suffix;

      @render()
      template() {
        return html`<class-bind-child-el controller="class-bind-interp-${this.suffix}"></class-bind-child-el>`;
      }
    }

    const host = document.createElement(hostTag) as any;
    document.body.appendChild(host);
    await tick(30);

    const child = host.shadowRoot!.querySelector(CHILD_TAG)!;
    expect(child.getAttribute('controller')).toBe(fullName);
    expect(stringAttach).toHaveBeenCalledWith(child);
  });
});

// ---------------------------------------------------------------------------
// E. Late-defined (pre-upgrade) snice elements
// ---------------------------------------------------------------------------

describe('class binding on not-yet-upgraded custom elements', () => {
  // Real browsers keep node identity across a late customElements.define()
  // and run connectedCallback on the original node, which consumes the
  // parked class. happy-dom replaces the node on late define, so the two
  // halves of that flow are verified separately here.

  it('parks the class on an undefined custom element without attaching or erroring', async () => {
    const { TestController, attachSpy } = makeControllerClass();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const hostTag = uniqueTag('class-bind-late-host');

    @element(hostTag)
    class Host extends HTMLElement {
      @property({ attribute: false }) ctrl: any = TestController;

      @render()
      template() {
        return html`<class-bind-late-child-el controller=${this.ctrl}></class-bind-late-child-el>`;
      }
    }

    const host = document.createElement(hostTag) as any;
    document.body.appendChild(host);
    await tick(30);

    const child = host.shadowRoot!.querySelector('class-bind-late-child-el') as any;
    expect(attachSpy).not.toHaveBeenCalled();
    expect(child[PENDING_CONTROLLER_BINDING]).toBe(TestController);
    expect(child.hasAttribute('controller')).toBe(false);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('connectedCallback picks up a parked class and attaches it', async () => {
    const { TestController, registeredName, attachSpy } = makeControllerClass();

    // Simulate what a template binding does for an element that upgrades
    // later: park the class before the element ever connects.
    const el = document.createElement(CHILD_TAG) as any;
    el[PENDING_CONTROLLER_BINDING] = TestController;

    document.body.appendChild(el);
    await tick(30);

    expect(attachSpy).toHaveBeenCalledWith(el);
    expect(getController(el)).toBeInstanceOf(TestController);
    expect(el[PENDING_CONTROLLER_BINDING]).toBeUndefined();
    expect(el.controller).toBe(TestController);
    expect(el.getAttribute('controller')).toBe(registeredName);
  });
});
