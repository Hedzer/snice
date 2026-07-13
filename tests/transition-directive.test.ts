import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Directive, directive, element, html, property, render, repeat, svg, transition } from './test-imports';

describe('transition directive', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    container.remove();
  });

  it('mounts without a wrapper and updates the same keyed template in place', async () => {
    @element('test-transition-stable')
    class TestTransitionStable extends HTMLElement {
      @property({ attribute: false }) label = 'one';

      @render()
      template() {
        return html`${transition(html`<p>${this.label}</p>`, { key: 'stable' })}`;
      }
    }

    const el = document.createElement('test-transition-stable') as TestTransitionStable;
    container.appendChild(el);
    await el.ready;
    const paragraph = el.shadowRoot?.querySelector('p');
    expect(paragraph?.textContent).toBe('one');

    el.label = 'two';
    await el.rendered;
    expect(el.shadowRoot?.querySelector('p')).toBe(paragraph);
    expect(paragraph?.textContent).toBe('two');
    expect(el.shadowRoot?.querySelector('[data-snice-transition]')).toBeNull();
  });

  it('runs simultaneous transitions and restores authored inline styles', async () => {
    const start = vi.fn();
    const complete = vi.fn();

    @element('test-transition-simultaneous')
    class TestTransitionSimultaneous extends HTMLElement {
      @property({ attribute: false }) page = 'first';

      @render()
      template() {
        const content = this.page === 'first'
          ? html`<section class="first" style="color: red">first</section>`
          : html`<section class="second" style="color: blue">second</section>`;
        return html`${transition(content, {
          key: this.page,
          mode: 'simultaneous',
          outDuration: 20,
          inDuration: 30,
          onStart: start,
          onComplete: complete
        })}`;
      }
    }

    const el = document.createElement('test-transition-simultaneous') as TestTransitionSimultaneous;
    container.appendChild(el);
    await el.ready;
    el.page = 'second';
    await el.rendered;
    expect(start).toHaveBeenCalledTimes(1);
    expect(el.shadowRoot?.querySelector('.first')).not.toBeNull();
    expect(el.shadowRoot?.querySelector('.second')).not.toBeNull();

    await vi.advanceTimersByTimeAsync(30);
    expect(el.shadowRoot?.querySelector('.first')).toBeNull();
    const second = el.shadowRoot?.querySelector('.second') as HTMLElement;
    expect(second.textContent).toBe('second');
    expect(second.style.color).toBe('blue');
    expect(second.style.position).toBe('');
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('runs sequential out and in phases', async () => {
    @element('test-transition-sequential')
    class TestTransitionSequential extends HTMLElement {
      @property({ attribute: false }) page = 1;

      @render()
      template() {
        return html`${transition(
          this.page === 1 ? html`<div class="old">old</div>` : html`<div class="new">new</div>`,
          { key: this.page, outDuration: 10, inDuration: 15, mode: 'sequential' }
        )}`;
      }
    }

    const el = document.createElement('test-transition-sequential') as TestTransitionSequential;
    container.appendChild(el);
    await el.ready;
    el.page = 2;
    await el.rendered;

    await vi.advanceTimersByTimeAsync(10);
    expect(el.shadowRoot?.querySelector('.old')).not.toBeNull();
    expect((el.shadowRoot?.querySelector('.new') as HTMLElement).style.opacity).toBe('1');

    await vi.advanceTimersByTimeAsync(15);
    expect(el.shadowRoot?.querySelector('.old')).toBeNull();
    expect(el.shadowRoot?.querySelector('.new')?.textContent).toBe('new');
  });

  it('queues rapid changes and settles on the latest key', async () => {
    @element('test-transition-queue')
    class TestTransitionQueue extends HTMLElement {
      @property({ attribute: false }) page = 1;

      @render()
      template() {
        return html`${transition(html`<div data-page=${this.page}>${this.page}</div>`, {
          key: this.page,
          mode: 'simultaneous',
          outDuration: 10,
          inDuration: 10
        })}`;
      }
    }

    const el = document.createElement('test-transition-queue') as TestTransitionQueue;
    container.appendChild(el);
    await el.ready;
    el.page = 2;
    await el.rendered;
    el.page = 3;
    await el.rendered;

    await vi.advanceTimersByTimeAsync(10);
    await vi.advanceTimersByTimeAsync(10);
    expect(el.shadowRoot?.querySelectorAll('[data-page]')).toHaveLength(1);
    expect(el.shadowRoot?.querySelector('[data-page]')?.getAttribute('data-page')).toBe('3');
  });

  it('transitions conditional branches and keyed list groups', async () => {
    type Item = { id: number; label: string };

    @element('test-transition-control-flow')
    class TestTransitionControlFlow extends HTMLElement {
      @property({ attribute: false }) visible = true;
      @property({ attribute: false }) items: Item[] = [{ id: 1, label: 'one' }];

      @render()
      template() {
        const conditional = html`
          <if ${this.visible}><p class="shown">shown</p><else><p class="hidden">hidden</p></else></if>
        `;
        const list = repeat(this.items, {
          key: item => item.id,
          render: item => html`<li>${item.label}</li>`
        });
        return html`
          ${transition(conditional, { key: this.visible, outDuration: 0, inDuration: 0 })}
          <ul>${transition(list, { key: list.keys, outDuration: 0, inDuration: 0 })}</ul>
        `;
      }
    }

    const el = document.createElement('test-transition-control-flow') as TestTransitionControlFlow;
    container.appendChild(el);
    await el.ready;
    el.visible = false;
    el.items = [{ id: 2, label: 'two' }];
    await el.rendered;
    await vi.runAllTimersAsync();
    await Promise.resolve();
    expect(el.shadowRoot?.querySelector('.hidden')?.textContent).toBe('hidden');
    expect(el.shadowRoot?.querySelector('li')?.textContent).toBe('two');
  });

  it('settles an active transition immediately when disconnected', async () => {
    @element('test-transition-disconnect')
    class TestTransitionDisconnect extends HTMLElement {
      @property({ attribute: false }) page = 1;

      @render()
      template() {
        return html`${transition(html`<p>${this.page}</p>`, {
          key: this.page,
          outDuration: 1000,
          inDuration: 1000
        })}`;
      }
    }

    const el = document.createElement('test-transition-disconnect') as TestTransitionDisconnect;
    container.appendChild(el);
    await el.ready;
    el.page = 2;
    await el.rendered;
    el.remove();
    expect(el.shadowRoot?.querySelectorAll('p')).toHaveLength(1);
    expect(el.shadowRoot?.querySelector('p')?.textContent).toBe('2');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('respects reduced motion without scheduling duration timers', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));

    @element('test-transition-reduced-motion')
    class TestTransitionReducedMotion extends HTMLElement {
      @property({ attribute: false }) page = 1;

      @render()
      template() {
        return html`${transition(String(this.page), {
          key: this.page,
          outDuration: 10_000,
          inDuration: 10_000
        })}`;
      }
    }

    const el = document.createElement('test-transition-reduced-motion') as TestTransitionReducedMotion;
    container.appendChild(el);
    await el.ready;
    el.page = 2;
    await el.rendered;
    await Promise.resolve();
    await Promise.resolve();
    expect(el.shadowRoot?.textContent).toContain('2');
    expect(el.shadowRoot?.textContent).not.toContain('1');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('handles text-only content and isolates callback failures', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const completed = vi.fn(() => { throw new Error('complete failed'); });

    @element('test-transition-text-callbacks')
    class TestTransitionTextCallbacks extends HTMLElement {
      @property({ attribute: false }) page = 'first';

      @render()
      template() {
        return html`${transition(this.page, {
          key: this.page,
          mode: 'simultaneous',
          outDuration: 5,
          inDuration: 5,
          onStart: () => { throw new Error('start failed'); },
          onComplete: completed
        })}`;
      }
    }

    const el = document.createElement('test-transition-text-callbacks') as TestTransitionTextCallbacks;
    container.appendChild(el);
    await el.ready;
    el.page = 'second';
    await el.rendered;
    await vi.advanceTimersByTimeAsync(5);
    expect(el.shadowRoot?.textContent).toContain('second');
    expect(el.shadowRoot?.textContent).not.toContain('first');
    expect(completed).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith(
      'snice: transition onStart failed:',
      expect.objectContaining({ message: 'start failed' })
    );
    expect(error).toHaveBeenCalledWith(
      'snice: transition onComplete failed:',
      expect.objectContaining({ message: 'complete failed' })
    );
    error.mockRestore();
  });

  it('animates SVG roots and applies authored kebab-case CSS properties', async () => {
    @element('test-transition-svg')
    class TestTransitionSvg extends HTMLElement {
      @property({ attribute: false }) page = 1;

      @render()
      template() {
        return html`<svg viewBox="0 0 20 20">${transition(
          this.page === 1
            ? svg`<circle class="old" cx="5" cy="5" r="4" style="fill: red"></circle>`
            : svg`<circle class="new" cx="15" cy="15" r="4" style="fill: blue"></circle>`,
          {
            key: this.page,
            mode: 'simultaneous',
            out: 'opacity: 0; stroke-width: 2px',
            in: 'opacity: 1; stroke-width: 4px',
            outDuration: 10,
            inDuration: 10
          }
        )}</svg>`;
      }
    }

    const el = document.createElement('test-transition-svg') as TestTransitionSvg;
    container.appendChild(el);
    await el.ready;
    el.page = 2;
    await el.rendered;

    const oldCircle = el.shadowRoot!.querySelector('.old') as SVGCircleElement;
    const newCircle = el.shadowRoot!.querySelector('.new') as SVGCircleElement;
    expect(oldCircle.style.opacity).toBe('0');
    expect(oldCircle.style.getPropertyValue('stroke-width')).toBe('2px');
    expect(newCircle.style.opacity).toBe('1');
    expect(newCircle.style.getPropertyValue('stroke-width')).toBe('4px');

    await vi.advanceTimersByTimeAsync(10);
    expect(el.shadowRoot!.querySelector('.old')).toBeNull();
    expect(newCircle.style.fill).toBe('blue');
    expect(newCircle.style.opacity).toBe('');
    expect(newCircle.style.getPropertyValue('stroke-width')).toBe('');
  });

  it('keeps the current region and remains usable when replacement preparation fails', async () => {
    class Invalid extends Directive {
      render() { return 'invalid element result'; }
    }
    const invalid = directive<Invalid, readonly []>(Invalid);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    @element('test-transition-invalid-replacement')
    class TestTransitionInvalidReplacement extends HTMLElement {
      @property({ attribute: false }) page = 0;
      @render() template() {
        const content = this.page === 0
          ? html`<p class="first">first</p>`
          : this.page === 1
            ? html`<section ${invalid()}>invalid</section>`
            : html`<p class="second">second</p>`;
        return html`${transition(content, { key: this.page, outDuration: 0, inDuration: 0 })}`;
      }
    }

    const el = document.createElement('test-transition-invalid-replacement') as TestTransitionInvalidReplacement;
    container.appendChild(el);
    await el.ready;
    const first = el.shadowRoot!.querySelector('.first');
    el.page = 1;
    await el.rendered;
    await Promise.resolve();
    expect(el.shadowRoot!.querySelector('.first')).toBe(first);
    expect(el.shadowRoot!.querySelector('section')).toBeNull();
    expect(error.mock.calls.some(call => String(call[1]).includes('element directive must return'))).toBe(true);

    el.page = 2;
    await el.rendered;
    await Promise.resolve();
    await Promise.resolve();
    expect(el.shadowRoot!.querySelector('.second')?.textContent).toBe('second');
    error.mockRestore();
  });
});
