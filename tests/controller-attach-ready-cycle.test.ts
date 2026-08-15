import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  element, controller, render, html, ready, request, respond, getController,
  attachController, daemon, provideContext,
  type Response,
} from '../packages/core/src/index';

/**
 * Defect guard: the attach/respond ordering cycle between a controller and a
 * child element that requests at mount time.
 *
 * Minimal cycle:
 *   host element  -> carries the controller, its @ready gates on the child
 *   child element -> fires a mount-time @request
 *   controller    -> @responds to that request
 *
 * attachController awaits the host's `ready` (packages/core/src/controller.ts:316-341)
 * and only installs the controller's @respond handlers afterwards
 * (packages/core/src/controller.ts:382). The child's mount-time request therefore
 * dispatches into a DOM where the only responder is still blocked behind the very
 * `ready` promise the child gates. Nothing can break the cycle except a timeout:
 * the request's discovery timeout, or — when discovery is longer than 30s — the
 * 30s ATTACH_DEADLINE_MS in attachController. The controller then fails to attach.
 *
 * Elements do NOT have this problem: an element installs its own @respond handlers
 * synchronously in connectedCallback (packages/core/src/element.ts:348), long before
 * `ready`. The last test in this file is the passing contrast that pins that down.
 */
describe('controller attach vs. child mount-time @request', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  // Expected: the controller answers the child's mount-time request.
  it('answers a child @request fired while the host ready gates on that child', async () => {
    @controller('fr4-ctrl')
    class Fr4Controller {
      element: HTMLElement | null = null;
      attach(el: HTMLElement) { this.element = el; }
      detach() { this.element = null; }

      @respond('fr4-need')
      handleNeed(payload: { id: string }) {
        return { id: payload.id, name: 'answered' };
      }
    }

    @element('fr4-child')
    class Fr4Child extends HTMLElement {
      value: any = null;
      error = '';

      @request('fr4-need')
      async *load(): Response<void> {
        this.value = await (yield { id: 'x1' });
      }

      @ready()
      async onReady() {
        try {
          await (this as any).load();
        } catch (err: any) {
          this.error = err?.message ?? String(err);
        }
      }

      @render()
      renderContent() { return html`<span>child</span>`; }
    }

    @element('fr4-host')
    class Fr4Host extends HTMLElement {
      @ready()
      async onReady() {
        const child = this.shadowRoot!.querySelector('fr4-child') as any;
        await child.ready;
      }

      @render()
      renderContent() { return html`<fr4-child></fr4-child>`; }
    }

    const host = document.createElement('fr4-host') as any;
    host.setAttribute('controller', 'fr4-ctrl');
    container.appendChild(host);

    await host.ready;
    await new Promise(r => setTimeout(r, 150));

    const child = host.shadowRoot.querySelector('fr4-child') as any;
    expect(child.error).toBe('');
    expect(child.value).toEqual({ id: 'x1', name: 'answered' });
  });

  // Expected: the cycle resolves and the controller ends up attached.
  it('attaches the controller instead of deadlocking host ready against the child request', async () => {
    @controller('fr4-ctrl-2')
    class Fr4Controller2 {
      element: HTMLElement | null = null;
      attach(el: HTMLElement) { this.element = el; }
      detach() { this.element = null; }

      @respond('fr4-need-2')
      handleNeed() { return { ok: true }; }
    }

    @element('fr4-child-2')
    class Fr4Child2 extends HTMLElement {
      value: any = null;

      // A generous discovery window: the responder is not merely "late", it is
      // structurally unreachable for as long as the host's ready is pending.
      @request('fr4-need-2', { discoveryTimeout: 400 })
      async *load(): Response<void> {
        this.value = await (yield { id: 'x2' });
      }

      @ready()
      async onReady() { await (this as any).load(); }

      @render()
      renderContent() { return html`<span>child</span>`; }
    }

    @element('fr4-host-2')
    class Fr4Host2 extends HTMLElement {
      @ready()
      async onReady() {
        const child = this.shadowRoot!.querySelector('fr4-child-2') as any;
        await child.ready;
      }

      @render()
      renderContent() { return html`<fr4-child-2></fr4-child-2>`; }
    }

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const host = document.createElement('fr4-host-2') as any;
      host.setAttribute('controller', 'fr4-ctrl-2');
      container.appendChild(host);

      await host.ready.catch(() => {});
      await new Promise(r => setTimeout(r, 700));

      const attachFailures = errorSpy.mock.calls.filter(c =>
        String(c[0]).includes('Failed to attach controller')
      );
      expect(attachFailures).toEqual([]);
      expect(getController(host)).toBeTruthy();
      expect((host.shadowRoot.querySelector('fr4-child-2') as any).value).toEqual({ ok: true });
    } finally {
      errorSpy.mockRestore();
    }
  });

  // Contrast (passing guard): the identical cycle with the responder living on the
  // HOST ELEMENT works, because elements install @respond in connectedCallback,
  // before `ready`. This is the ordering controllers are missing.
  it('an element-hosted @respond answers the same mount-time child request', async () => {
    @element('fr4-child-3')
    class Fr4Child3 extends HTMLElement {
      value: any = null;
      error = '';

      @request('fr4-need-3')
      async *load(): Response<void> {
        this.value = await (yield { id: 'x3' });
      }

      @ready()
      async onReady() {
        try {
          await (this as any).load();
        } catch (err: any) {
          this.error = err?.message ?? String(err);
        }
      }

      @render()
      renderContent() { return html`<span>child</span>`; }
    }

    @element('fr4-host-3')
    class Fr4Host3 extends HTMLElement {
      @respond('fr4-need-3')
      handleNeed(payload: { id: string }) {
        return { id: payload.id, name: 'answered' };
      }

      @ready()
      async onReady() {
        const child = this.shadowRoot!.querySelector('fr4-child-3') as any;
        await child.ready;
      }

      @render()
      renderContent() { return html`<fr4-child-3></fr4-child-3>`; }
    }

    const host = document.createElement('fr4-host-3') as any;
    container.appendChild(host);

    await host.ready;

    const child = host.shadowRoot.querySelector('fr4-child-3') as any;
    expect(child.error).toBe('');
    expect(child.value).toEqual({ id: 'x3', name: 'answered' });
  });

  // Guard for the fix itself: moving @respond registration ahead of the
  // readiness gate must not break `@respond({ daemon })`, whose target is
  // resolved through the host's app context. Attaching before the host is
  // appended leaves that context unreachable at registration time, so the
  // daemon responder has to be picked up by the later pass instead of being
  // warned about and dropped.
  it('keeps a daemon-scoped @respond alive when attached before the host is connected', async () => {
    @daemon
    class Fr4Service {
      @request<string>('fr4-daemon-need')
      async *ask(): Response<string> { return yield { q: 1 }; }
    }

    @controller('fr4-ctrl-4')
    class Fr4Controller4 {
      element: HTMLElement | null = null;
      attach(el: HTMLElement) { this.element = el; }
      detach() { this.element = null; }

      @respond('fr4-daemon-need', { daemon: 'service' })
      answer() { return 'answered'; }
    }

    @element('fr4-host-4')
    class Fr4Host4 extends HTMLElement {
      @render()
      renderContent() { return html`<span>host</span>`; }
    }

    const service = new Fr4Service();
    const release = provideContext(container, { daemons: { service } });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const host = document.createElement('fr4-host-4') as any;
      // Attach first, append second — the order the attach deadline's own
      // "did you forget to appendChild it?" message anticipates.
      const attaching = attachController(host, 'fr4-ctrl-4');
      container.appendChild(host);
      await attaching;

      await expect((service as any).ask()).resolves.toBe('answered');
      expect(warnSpy.mock.calls.map(c => String(c[0]))).toEqual([]);
    } finally {
      warnSpy.mockRestore();
      release();
    }
  });
});
