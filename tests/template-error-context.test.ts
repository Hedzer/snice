import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TemplateInstance,
  element,
  html,
  property,
  render,
  setStrictRenderErrors,
} from './test-imports';

const malformedOpeningTag = () => html`<button ${'unsupported'}>bad</button>`;
const malformedConditional = () => html`<else>bad</else>`;
const sharedAsyncShell = (value: unknown) => html`<section>${value}</section>`;

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
