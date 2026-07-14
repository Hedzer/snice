import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { wait } from './test-utils';

// Reactivity regression tests: fields read in @render() templates must be
// decorated with @property (or trigger a reactive mutation) or the DOM does
// not update. Fixed by adding @property({ attribute: false }) on internal
// state fields. These tests verify DOM updates after state mutation.

afterEach(() => { document.body.innerHTML = ''; });

// ---------------------------------------------------------------------------
// kanban — filterByLabels / search reassign `this.columns = this.columns`
// which is a reference-equal assignment; setter short-circuits; no re-render.
// ---------------------------------------------------------------------------

describe('reactivity bug: kanban filter/search does not re-render', () => {
  beforeEach(async () => { await import('../../packages/components/src/kanban/snice-kanban'); });

  it('search("...") updates rendered cards', async () => {
    const el = document.createElement('snice-kanban') as any;
    el.columns = [{
      id: 'c1', title: 'Todo',
      cards: [
        { id: '1', title: 'Alpha' },
        { id: '2', title: 'Beta' },
      ],
    }];
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const countBefore = el.shadowRoot.querySelectorAll('.card').length;
    el.search('Alpha');
    await wait(30);
    const countAfter = el.shadowRoot.querySelectorAll('.card').length;

    expect(countAfter).toBe(1);
    expect(countAfter).toBeLessThan(countBefore);
  });

  it('filterByLabels(...) updates rendered cards', async () => {
    const el = document.createElement('snice-kanban') as any;
    el.columns = [{
      id: 'c1', title: 'Todo',
      cards: [
        { id: '1', title: 'A', labels: [{ text: 'bug', color: '#f00' }] },
        { id: '2', title: 'B', labels: [] },
      ],
    }];
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    el.filterByLabels(['bug']);
    await wait(30);
    const count = el.shadowRoot.querySelectorAll('.card').length;
    expect(count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// key-value — copyFeedback toggled by handleCopy, not @property, not reactive
// ---------------------------------------------------------------------------

describe('reactivity bug: key-value copy feedback does not render', () => {
  beforeEach(async () => { await import('../../packages/components/src/key-value/snice-key-value'); });

  it('clicking copy shows the copied checkmark', async () => {
    // Stub clipboard for happy-dom (read-only in some envs)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => {} },
    });

    const el = document.createElement('snice-key-value') as any;
    el.items = [{ key: 'a', value: '1' }];
    el.showCopy = true;
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const copyBtn = el.shadowRoot.querySelector('.kv__copy') as HTMLElement;
    expect(copyBtn).toBeTruthy();
    copyBtn.click();
    await wait(50);

    expect(copyBtn.classList.contains('kv__copy--copied')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// paint — _tool mutated by toggleEraser, not @property, not reactive
// ---------------------------------------------------------------------------

describe('reactivity bug: paint eraser button highlight does not toggle', () => {
  beforeEach(async () => {
    // happy-dom doesn't implement HTMLCanvasElement.getContext; stub it.
    (HTMLCanvasElement.prototype as any).getContext = () => ({
      clearRect: () => {}, fillRect: () => {}, beginPath: () => {}, moveTo: () => {},
      lineTo: () => {}, stroke: () => {}, fill: () => {}, save: () => {}, restore: () => {},
      scale: () => {}, setTransform: () => {}, drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: () => {}, createLinearGradient: () => ({ addColorStop: () => {} }),
      set strokeStyle(_v: any) {}, set fillStyle(_v: any) {}, set lineWidth(_v: any) {},
      set lineCap(_v: any) {}, set lineJoin(_v: any) {}, set globalCompositeOperation(_v: any) {},
    });
    await import('../../packages/components/src/paint/snice-paint');
  });

  it('clicking eraser toolbar button adds .active class', async () => {
    const el = document.createElement('snice-paint') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const eraserBtn = Array.from(el.shadowRoot.querySelectorAll('.paint-btn'))
      .find((b: any) => b.title?.toLowerCase().includes('eraser') || b.getAttribute('data-tool') === 'eraser') as HTMLElement;
    expect(eraserBtn).toBeTruthy();
    eraserBtn.click();
    await wait(30);

    expect(eraserBtn.classList.contains('active')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// tag-input — inputValue/showSuggestions/filteredSuggestions not reactive
// ---------------------------------------------------------------------------

describe('reactivity bug: tag-input suggestion dropdown does not appear', () => {
  beforeEach(async () => { await import('../../packages/components/src/tag-input/snice-tag-input'); });

  it('typing a matching string shows the suggestions dropdown', async () => {
    const el = document.createElement('snice-tag-input') as any;
    el.suggestions = ['apple', 'apricot', 'banana'];
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const input = el.shadowRoot.querySelector('input') as HTMLInputElement;
    expect(input).toBeTruthy();
    input.value = 'ap';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(50);

    const suggestions = el.shadowRoot.querySelector('[part="suggestions"]');
    expect(suggestions).toBeTruthy();
    const items = el.shadowRoot.querySelectorAll('.tag-suggestion-item');
    expect(items.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// music-player — currentTime / duration are not @property, not reactive
// ---------------------------------------------------------------------------

describe('reactivity bug: music-player clock does not update', () => {
  beforeEach(async () => { await import('../../packages/components/src/music-player/snice-music-player'); });

  it('setting currentTime updates the rendered "current time" label', async () => {
    const el = document.createElement('snice-music-player') as any;
    el.tracks = [{ id: '1', title: 'Track', src: 'about:blank' }];
    document.body.appendChild(el);
    await el.ready;
    await wait(50);

    el.currentTime = 125; // 2:05
    await wait(30);

    const label = el.shadowRoot.querySelector('.player-time-current') as HTMLElement;
    expect(label).toBeTruthy();
    expect(label.textContent?.trim()).toBe('2:05');
  });
});

// ---------------------------------------------------------------------------
// podcast-player — state field read in template but mutated non-reactively
// ---------------------------------------------------------------------------

describe('reactivity bug: podcast-player state does not update UI', () => {
  beforeEach(async () => { await import('../../packages/components/src/podcast-player/snice-podcast-player'); });

  it('setting state flips isPlaying-dependent UI', async () => {
    const el = document.createElement('snice-podcast-player') as any;
    el.episodes = [{ id: '1', title: 'Ep1', audioSrc: 'about:blank' }];
    document.body.appendChild(el);
    await el.ready;
    await wait(50);

    // Capture a snapshot of the DOM before state change
    const beforeHtml = el.shadowRoot.innerHTML;
    el.state = 'playing';
    await wait(30);
    const afterHtml = el.shadowRoot.innerHTML;

    expect(afterHtml).not.toBe(beforeHtml);
  });
});
