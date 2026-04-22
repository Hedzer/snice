import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router, element, render, html } from '../src/index';

/**
 * When a second navigate() fires while the first's transition is still running,
 * the first transition must not modify the DOM after the second has taken over.
 *
 * Today, my earlier navGeneration guard only guards navigate() up to the point
 * renderPage() starts. Once the transition is underway it runs to completion,
 * leaving both the previous page and the current page in the container after
 * back-to-back navigations.
 */

describe('router: rapid navigation does not leave stale pages in container', () => {
  let container: HTMLElement;
  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'router-abort-container';
    document.body.appendChild(container);
  });
  afterEach(() => { container.remove(); });

  it('after rapid navigate(a) then navigate(b), container holds only the final page', async () => {
    @element('stale-page-a')
    class A extends HTMLElement {
      @render() r() { return html`<div class="a">A</div>`; }
    }
    @element('stale-page-b')
    class B extends HTMLElement {
      @render() r() { return html`<div class="b">B</div>`; }
    }

    const router = Router({ target: '#router-abort-container', type: 'hash' });
    router.page({
      tag: 'stale-page-a',
      routes: ['/a'],
      transition: { inDuration: 200, outDuration: 200, mode: 'sequential' as any },
    })(A);
    router.page({
      tag: 'stale-page-b',
      routes: ['/b'],
      transition: { inDuration: 200, outDuration: 200, mode: 'sequential' as any },
    })(B);

    router.initialize();

    // Navigate to /a first so the container has an "old" element to transition away from
    await router.navigate('/a');
    await new Promise(r => setTimeout(r, 10));

    // Now fire two rapid navigations. The first (/b) starts a transition away from a.
    // Before it completes, the second (/b again with different path) starts.
    const p1 = router.navigate('/b');
    // Small gap so transition 1 is mid-flight
    await new Promise(r => setTimeout(r, 20));
    // Navigate back to /a during transition — simulates rapid user clicks
    const p2 = router.navigate('/a');
    await Promise.all([p1, p2]);
    // Wait for all in-flight transitions to fully settle
    await new Promise(r => setTimeout(r, 500));

    // Container must contain exactly ONE page element (only the latest nav's target)
    const pages = Array.from(container.children).filter(el =>
      el.tagName === 'STALE-PAGE-A' || el.tagName === 'STALE-PAGE-B'
    );
    expect(pages.length).toBe(1);
  });
});
