import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Window } from 'happy-dom';
import {
  Router,
  TemplateInstance,
  captureRenderHostIdentity,
  element,
  html,
  layout,
  property,
  render,
  renderElementNow,
  setStrictRenderErrors,
} from './test-imports';

const malformedOpeningTag = () => html`<button ${'unsupported'}>bad</button>`;
const malformedConditional = () => html`<else>bad</else>`;
const sharedAsyncShell = (value: unknown) => html`<section>${value}</section>`;

function containsDomReference(value: unknown, seen = new WeakSet<object>()): boolean {
  if (!value || typeof value !== 'object') return false;
  if (value instanceof Node) return true;
  if (seen.has(value as object)) return false;
  seen.add(value as object);
  return Reflect.ownKeys(value as object).some(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value as object, key);
    return descriptor && 'value' in descriptor && containsDomReference(descriptor.value, seen);
  });
}

describe('template authoring error context', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  afterEach(() => {
    setStrictRenderErrors(false);
    container.remove();
    vi.restoreAllMocks();
  });

  it('logs the host tag, class, and nearby template for a top-level parser error', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    @element('test-context-top-level')
    class ContextTopLevelElement extends HTMLElement {
      @render() template() {
        return html`<article ${'unsupported'}>bad</article>`;
      }
    }

    const host = document.createElement('test-context-top-level') as ContextTopLevelElement;
    container.append(host);
    await host.ready;

    const logged = errors.mock.calls.find(call => call[0] === 'Error rendering element:')?.[1];
    expect(logged).toBeInstanceOf(Error);
    expect((logged as Error).message).toContain('<test-context-top-level>');
    expect((logged as Error).message).toContain('ContextTopLevelElement');
    expect((logged as Error).message).toContain('Near "<article ${…}>bad</article>"');
    expect(Object.keys(logged as Error)).not.toContain('host');
    expect(String(logged)).not.toContain('ownerDocument');
    expect(containsDomReference(logged)).toBe(false);
  });

  it('does not retain a render host on template instances or node parts', () => {
    const host = document.createElement('div');
    const identity = captureRenderHostIdentity(host);
    const instance = new TemplateInstance(html`<main>${'value'}</main>`, identity);
    instance.renderFragment();

    expect((instance as any).renderHost).toBeUndefined();
    expect((instance as any).renderIdentity).toBeUndefined();
    expect(Object.keys(instance)).not.toContain('renderHost');
    expect(Reflect.ownKeys(instance)).not.toContain('renderIdentity');
    const nodePart = instance.parts.find(part => part.type === 'node') as any;
    expect(nodePart.renderHost).toBeUndefined();
    expect(nodePart.renderIdentity).toBeUndefined();
    expect(Object.keys(nodePart)).not.toContain('renderHost');
    expect(Reflect.ownKeys(nodePart)).not.toContain('renderIdentity');
    expect(instance.getRenderHostIdentity()).toBe(identity);
    expect(Object.isFrozen(identity)).toBe(true);
    expect(Object.values(identity).some(value => value instanceof Node)).toBe(false);
  });

  it('ignores spoofed or throwing host identity getters and wraps once', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    let invalid = false;

    @element('test-context-spoof-proof')
    class ContextSpoofProofElement extends HTMLElement {
      @render({ sync: true }) template() {
        return html`<main>${invalid ? malformedConditional() : 'fine'}</main>`;
      }
    }

    const host = document.createElement('test-context-spoof-proof') as ContextSpoofProofElement;
    container.append(host);
    await host.ready;
    let constructorReads = 0;
    let tagReads = 0;
    const originalTagName = Object.getOwnPropertyDescriptor(host, 'tagName');
    Object.defineProperty(host, 'constructor', {
      configurable: true,
      get() { constructorReads++; throw new Error('spoofed constructor'); },
    });
    Object.defineProperty(host, 'tagName', {
      configurable: true,
      get() { tagReads++; return tagReads % 2 ? 'FIRST-SPOOF' : 'SECOND-SPOOF'; },
    });

    invalid = true;
    renderElementNow(host);
    const logged = errors.mock.calls.find(call => call[0] === 'Error rendering element:')?.[1] as Error;
    expect(logged.message).toContain('<test-context-spoof-proof>');
    expect(logged.message).not.toContain('SPOOF');
    expect(logged.message.match(/snice: render failed for/g)).toHaveLength(1);
    expect(constructorReads).toBe(0);
    expect(tagReads).toBe(0);
    delete (host as any).constructor;
    if (originalTagName) Object.defineProperty(host, 'tagName', originalTagName);
    else delete (host as any).tagName;
  });

  it('uses the registered tag when a minified constructor has no class name', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    class ContextMinifiedNameElement extends HTMLElement {
      @render() template() { return malformedOpeningTag(); }
    }
    Object.defineProperty(ContextMinifiedNameElement, 'name', { value: '', configurable: true });
    element('test-context-minified-name')(
      ContextMinifiedNameElement,
      { kind: 'class', name: '', metadata: undefined } as any,
    );

    const host = document.createElement('test-context-minified-name') as ContextMinifiedNameElement;
    container.append(host);
    await host.ready;

    const logged = errors.mock.calls.find(call => call[0] === 'Error rendering element:')?.[1] as Error;
    expect(logged.message).toContain('render failed for <test-context-minified-name>:');
    expect(logged.message).not.toContain('<test-context-minified-name> (');
  });

  it('attributes alternate-realm Router pages through their owning registry', () => {
    const alternate = new Window();
    const target = alternate.document.createElement('div');
    target.id = 'app';
    alternate.document.body.append(target);
    const router = Router({
      target: '#app',
      type: 'hash',
      window: alternate as unknown as Window & typeof globalThis,
      document: alternate.document as unknown as Document,
    });
    const original = new Error('alternate realm render failed');

    class AltPage extends alternate.HTMLElement {
      @render({ sync: true }) template() { throw original; }
    }
    router.page({ tag: 'test-context-alt-page', routes: ['/'] })(
      AltPage as unknown as typeof HTMLElement,
      { kind: 'class', name: 'AltPage', metadata: undefined } as any,
    );

    expect(alternate.customElements.get('test-context-alt-page')).toBe(AltPage);
    expect(customElements.get('test-context-alt-page')).toBeUndefined();
    const host = alternate.document.createElement('test-context-alt-page') as HTMLElement;
    expect(host.isConnected).toBe(false);
    expect(captureRenderHostIdentity(host).label).toMatch(
      /^<test-context-alt-page>( \(AltPage\))?$/,
    );

    setStrictRenderErrors(true);
    let thrown: Error | undefined;
    try {
      renderElementNow(host);
    } catch (error) {
      thrown = error as Error;
    }
    expect(thrown?.message).toMatch(
      /^snice: render failed for <test-context-alt-page>( \(AltPage\))?: alternate realm render failed$/,
    );
    expect(thrown?.message.match(/snice: render failed for/g)).toHaveLength(1);
    expect(thrown?.cause).toBe(original);

    document.adoptNode(host);
    expect(host.ownerDocument).toBe(document);
    expect(captureRenderHostIdentity(host).label).toMatch(
      /^<test-context-alt-page>( \(AltPage\))?$/,
    );
    alternate.document.adoptNode(host);
    expect(captureRenderHostIdentity(host).label).toMatch(
      /^<test-context-alt-page>( \(AltPage\))?$/,
    );

    const ownerDocument = Object.getOwnPropertyDescriptor(host, 'ownerDocument');
    let ownerDocumentReads = 0;
    Object.defineProperty(host, 'ownerDocument', {
      configurable: true,
      get() { ownerDocumentReads++; throw new Error('spoofed ownerDocument'); },
    });
    expect(captureRenderHostIdentity(host).label).toMatch(
      /^<test-context-alt-page>( \(AltPage\))?$/,
    );
    expect(ownerDocumentReads).toBe(0);
    if (ownerDocument) Object.defineProperty(host, 'ownerDocument', ownerDocument);

    const defaultView = Object.getOwnPropertyDescriptor(alternate.document, 'defaultView');
    let defaultViewReads = 0;
    Object.defineProperty(alternate.document, 'defaultView', {
      configurable: true,
      get() { defaultViewReads++; throw new Error('spoofed defaultView'); },
    });
    expect(captureRenderHostIdentity(host).label).toMatch(
      /^<test-context-alt-page>( \(AltPage\))?$/,
    );
    expect(defaultViewReads).toBe(0);
    if (defaultView) Object.defineProperty(alternate.document, 'defaultView', defaultView);

    const registry = Object.getOwnPropertyDescriptor(alternate, 'customElements');
    let registryReads = 0;
    Object.defineProperty(alternate, 'customElements', {
      configurable: true,
      get() { registryReads++; throw new Error('spoofed customElements'); },
    });
    expect(captureRenderHostIdentity(host).label).toMatch(
      /^<test-context-alt-page>( \(AltPage\))?$/,
    );
    expect(registryReads).toBe(0);
    if (registry) Object.defineProperty(alternate, 'customElements', registry);
  });

  it('ignores poisoned realm Object prototypes while resolving both registries', () => {
    @element('test-context-primary-poison')
    class PrimaryPoisonElement extends HTMLElement {}
    const primaryHost = document.createElement('test-context-primary-poison');

    const alternate = new Window();
    const target = alternate.document.createElement('div');
    target.id = 'app';
    alternate.document.body.append(target);
    const router = Router({
      target: '#app',
      type: 'hash',
      window: alternate as unknown as Window & typeof globalThis,
      document: alternate.document as unknown as Document,
    });
    class AltPoisonPage extends alternate.HTMLElement {}
    router.page({ tag: 'test-context-alt-poison', routes: ['/'] })(
      AltPoisonPage as unknown as typeof HTMLElement,
      { kind: 'class', name: 'AltPoisonPage', metadata: undefined } as any,
    );
    const alternateHost = alternate.document.createElement('test-context-alt-poison');

    const reads = { ownerDocument: 0, defaultView: 0, customElements: 0 };
    const roots = new Set<object>([Object.prototype, alternate.Object.prototype]);
    try {
      for (const root of roots) {
        for (const key of Object.keys(reads) as Array<keyof typeof reads>) {
          Object.defineProperty(root, key, {
            configurable: true,
            get() { reads[key]++; throw new Error(`poisoned ${key}`); },
          });
        }
      }

      const primaryLabel = captureRenderHostIdentity(primaryHost).label;
      const alternateLabel = captureRenderHostIdentity(alternateHost as HTMLElement).label;
      expect(primaryLabel).toMatch(/^<test-context-primary-poison>/);
      expect(alternateLabel).toMatch(/^<test-context-alt-poison>/);
      expect(reads).toEqual({ ownerDocument: 0, defaultView: 0, customElements: 0 });
    } finally {
      for (const root of roots) {
        delete (root as any).ownerDocument;
        delete (root as any).defaultView;
        delete (root as any).customElements;
      }
    }
  });

  it('uses only an exact registered immediate prototype and never invokes prototype accessors', () => {
    @element('test-context-exact-base')
    class ExactBaseElement extends HTMLElement {}

    class UndecoratedSubclass extends ExactBaseElement {}
    customElements.define('test-context-undecorated-subclass', UndecoratedSubclass);
    const subclassHost = document.createElement('test-context-undecorated-subclass');
    expect(captureRenderHostIdentity(subclassHost).label).toBe('<element>');

    const host = document.createElement('test-context-exact-base');
    const prototype = Object.getPrototypeOf(host);
    const originalConstructor = Object.getOwnPropertyDescriptor(prototype, 'constructor')!;
    let constructorReads = 0;
    Object.defineProperty(prototype, 'constructor', {
      configurable: true,
      get() { constructorReads++; throw new Error('hostile prototype constructor'); },
    });
    try {
      expect(captureRenderHostIdentity(host).label).toBe('<element>');
      expect(constructorReads).toBe(0);
    } finally {
      Object.defineProperty(prototype, 'constructor', originalConstructor);
    }
  });

  it('ignores DOM-shaped prototype pollution without losing exact registration identity', () => {
    @element('test-context-interface-shape')
    class InterfaceShapeElement extends HTMLElement {}

    const host = document.createElement('test-context-interface-shape');
    const prototype = Object.getPrototypeOf(host);
    const added = ['ownerDocument', 'defaultView', 'customElements', 'contains', 'getRootNode', 'cloneNode'] as const;
    const reads = { ownerDocument: 0, defaultView: 0, customElements: 0 };
    try {
      for (const key of ['ownerDocument', 'defaultView', 'customElements'] as const) {
        Object.defineProperty(prototype, key, {
          configurable: true,
          get() { reads[key]++; throw new Error(`hostile ${key}`); },
        });
      }
      for (const key of ['contains', 'getRootNode', 'cloneNode'] as const) {
        Object.defineProperty(prototype, key, { configurable: true, value() {} });
      }

      expect(captureRenderHostIdentity(host).label).toMatch(/^<test-context-interface-shape>/);
      expect(reads).toEqual({ ownerDocument: 0, defaultView: 0, customElements: 0 });
    } finally {
      for (const key of added) delete (prototype as any)[key];
    }
  });

  it('records identity only after successful or exact existing registration', () => {
    @layout('test-context-registered-layout')
    class RegisteredLayoutElement extends HTMLElement {}
    expect(captureRenderHostIdentity(document.createElement('test-context-registered-layout')).label)
      .toMatch(/^<test-context-registered-layout>/);

    class ExistingExactElement extends HTMLElement {}
    customElements.define('test-context-existing-exact', ExistingExactElement);
    element('test-context-existing-exact')(
      ExistingExactElement,
      { kind: 'class', name: 'ExistingExactElement', metadata: undefined } as any,
    );
    expect(captureRenderHostIdentity(document.createElement('test-context-existing-exact')).label)
      .toMatch(/^<test-context-existing-exact>/);

    class ExistingConflictElement extends HTMLElement {}
    customElements.define('test-context-existing-conflict', ExistingConflictElement);
    class ConflictingElement extends HTMLElement {}
    element('test-context-existing-conflict')(
      ConflictingElement,
      { kind: 'class', name: 'ConflictingElement', metadata: undefined } as any,
    );
    expect(captureRenderHostIdentity(new ConflictingElement()).label).toBe('<element>');

    class FailedElement extends HTMLElement {}
    const define = vi.spyOn(customElements, 'define').mockImplementationOnce(() => {
      throw new Error('registration failed');
    });
    expect(() => element('test-context-failed-registration')(
      FailedElement,
      { kind: 'class', name: 'FailedElement', metadata: undefined } as any,
    )).toThrow('registration failed');
    define.mockRestore();
    expect(captureRenderHostIdentity(new FailedElement()).label).toBe('<element>');
  });

  it('preserves cause and stack while strict mode rethrows nested parser errors', async () => {
    @element('test-context-strict-nested')
    class ContextStrictNestedElement extends HTMLElement {
      @property({ attribute: false }) invalid = false;

      @render({ sync: true }) template() {
        return html`<main>${this.invalid ? malformedConditional() : 'fine'}</main>`;
      }
    }

    const host = document.createElement('test-context-strict-nested') as ContextStrictNestedElement;
    container.append(host);
    await host.ready;
    setStrictRenderErrors(true);

    let thrown: Error | undefined;
    try {
      host.invalid = true;
    } catch (error) {
      thrown = error as Error;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect(thrown?.message).toContain('<test-context-strict-nested>');
    expect(thrown?.message).toContain('ContextStrictNestedElement');
    expect(thrown?.message).toContain('<else> must be a direct child of <if>');
    expect(thrown?.message).toContain('Near "<else>bad</else>"');
    expect(thrown?.cause).toBeInstanceOf(Error);
    expect((thrown?.cause as Error).stack).toContain('prepareTemplate');
    expect(thrown?.stack).toContain('ContextStrictNestedElement');
  });

  it('keeps async parser errors tied to their open, closed, and light-DOM hosts', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    let resolveOpen!: (value: unknown) => void;
    let resolveClosed!: (value: unknown) => void;
    let resolveLight!: (value: unknown) => void;

    @element('test-context-async-open')
    class ContextAsyncOpenElement extends HTMLElement {
      value = new Promise(resolve => { resolveOpen = resolve; });
      @render() template() { return sharedAsyncShell(this.value); }
    }

    @element('test-context-async-closed', { shadow: 'closed' })
    class ContextAsyncClosedElement extends HTMLElement {
      value = new Promise(resolve => { resolveClosed = resolve; });
      @render() template() { return sharedAsyncShell(this.value); }
    }

    @element('test-context-async-light', { renderRoot: 'light' })
    class ContextAsyncLightElement extends HTMLElement {
      value = new Promise(resolve => { resolveLight = resolve; });
      @render() template() { return sharedAsyncShell(this.value); }
    }

    const hosts = [
      document.createElement('test-context-async-open') as ContextAsyncOpenElement,
      document.createElement('test-context-async-closed') as ContextAsyncClosedElement,
      document.createElement('test-context-async-light') as ContextAsyncLightElement,
    ];
    container.append(...hosts);
    await Promise.all(hosts.map(host => host.ready));

    // Resolve out of declaration order to catch accidental shared/current-host
    // context and exercise the same cached outer template across instances.
    // Deferred failures remain logged because there is no synchronous caller
    // to receive a strict-mode throw once a promise settles.
    setStrictRenderErrors(true);
    resolveLight(malformedOpeningTag());
    resolveOpen(malformedOpeningTag());
    resolveClosed(malformedOpeningTag());

    await vi.waitFor(() => {
      expect(errors.mock.calls.filter(call => call[0] === 'snice: promise template value failed:')).toHaveLength(3);
    });

    const messages = errors.mock.calls
      .filter(call => call[0] === 'snice: promise template value failed:')
      .map(call => String((call[1] as Error).message));
    expect(messages).toEqual(expect.arrayContaining([
      expect.stringContaining('<test-context-async-open> (ContextAsyncOpenElement)'),
      expect.stringContaining('<test-context-async-closed> (ContextAsyncClosedElement)'),
      expect.stringContaining('<test-context-async-light> (ContextAsyncLightElement)'),
    ]));
    expect(messages.every(message => message.includes('Near "<button ${…}>bad</button>"'))).toBe(true);
  });

  it('carries host context into async-iterable template emissions', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    async function* values() {
      await Promise.resolve();
      yield malformedConditional();
    }

    @element('test-context-async-iterable')
    class ContextAsyncIterableElement extends HTMLElement {
      stream = values();
      @render() template() { return html`<main>${this.stream}</main>`; }
    }

    const host = document.createElement('test-context-async-iterable') as ContextAsyncIterableElement;
    container.append(host);
    await host.ready;

    await vi.waitFor(() => {
      expect(errors).toHaveBeenCalledWith(
        'snice: async iterable template value failed:',
        expect.objectContaining({
          message: expect.stringContaining(
            '<test-context-async-iterable> (ContextAsyncIterableElement)'
          ),
        }),
      );
    });
  });

  it('keeps a generic nearby-template error when no render host exists', () => {
    expect(() => new TemplateInstance(malformedOpeningTag())).toThrowError(
      /^snice: expressions directly in opening tags are not supported;[\s\S]*Near "<button \$\{…\}>bad<\/button>"\.$/
    );

    try {
      new TemplateInstance(malformedOpeningTag());
    } catch (error) {
      expect((error as Error).message).not.toContain('render failed for');
      expect((error as Error).message).not.toContain('HTMLElement');
    }
  });
});
