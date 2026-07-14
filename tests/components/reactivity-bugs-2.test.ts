import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { wait } from './test-utils';

// Non-reactive state sweep — second pass. Template-read fields not decorated
// with @property silently fail to trigger re-renders.

afterEach(() => { document.body.innerHTML = ''; });

// ---------------------------------------------------------------------------
// video-player: playing/loading/showPoster/controlsVisible/bufferedPercent/
// isSeeking/duration are plain fields read in @render()
// ---------------------------------------------------------------------------

describe('video-player: setting `playing` updates the play/pause icon', () => {
  it('toggling playing flips visual state of the center play button', async () => {
    await import('../../packages/components/src/video-player/snice-video-player');
    const el = document.createElement('snice-video-player') as any;
    el.src = 'about:blank';
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const before = el.shadowRoot.innerHTML;
    (el as any).playing = true;
    await wait(30);
    const after = el.shadowRoot.innerHTML;
    expect(after).not.toBe(before);
  });
});

// ---------------------------------------------------------------------------
// command-palette: typing in the search box does not filter
// ---------------------------------------------------------------------------

describe('command-palette: searchQuery/activeIndex are reactive', () => {
  it('typing a query filters the rendered commands', async () => {
    await import('../../packages/components/src/command-palette/snice-command-palette');
    const el = document.createElement('snice-command-palette') as any;
    el.commands = [
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Beta' },
      { id: 'c', label: 'Carol' },
    ];
    el.open = true;
    document.body.appendChild(el);
    await el.ready;
    await wait(40);

    const input = el.shadowRoot.querySelector('input');
    expect(input).toBeTruthy();
    input.value = 'alp';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(50);

    // With the bug, all 3 commands still render. With the fix, only 'Alpha'.
    const items = el.shadowRoot.querySelectorAll('.command-palette__item');
    expect(items.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// camera-annotate: active color highlight updates after click
// ---------------------------------------------------------------------------

describe('camera-annotate: activeColor is reactive', () => {
  it('calling setActiveColor changes the rendered active swatch class', async () => {
    // happy-dom needs canvas getContext
    (HTMLCanvasElement.prototype as any).getContext = () => ({
      drawImage: () => {}, clearRect: () => {}, fillRect: () => {},
      beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {},
      save: () => {}, restore: () => {}, scale: () => {}, setTransform: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray(4) }), putImageData: () => {},
      set strokeStyle(_v: any) {}, set fillStyle(_v: any) {}, set lineWidth(_v: any) {},
      set lineCap(_v: any) {}, set lineJoin(_v: any) {}, set globalCompositeOperation(_v: any) {},
    });
    // happy-dom has no navigator.mediaDevices, so the component's camera-mode
    // handler always fails getUserMedia and logs it via console.error. That's
    // expected in this environment and unrelated to what's under test here.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await import('../../packages/components/src/camera-annotate/snice-camera-annotate');
      const el = document.createElement('snice-camera-annotate') as any;
      document.body.appendChild(el);
      await el.ready;
      await wait(40);

      const before = el.shadowRoot.innerHTML;
      // Try to change activeColor via public method/property (any shape)
      if (typeof el.setActiveColor === 'function') el.setActiveColor('#ff0000');
      else (el as any).activeColor = '#ff0000';
      await wait(30);
      const after = el.shadowRoot.innerHTML;
      expect(after).not.toBe(before);
      expect(errorSpy).toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });
});

// ---------------------------------------------------------------------------
// comments: clicking Reply opens the reply textarea (replyingTo reactive)
// ---------------------------------------------------------------------------

describe('comments: replyingTo is reactive', () => {
  it('setting replyingTo renders the reply textarea', async () => {
    await import('../../packages/components/src/comments/snice-comments');
    const el = document.createElement('snice-comments') as any;
    el.comments = [{ id: 'c1', author: 'a', content: 'hi' }];
    el.allowReplies = true;
    el.currentUser = 'me';
    document.body.appendChild(el);
    await el.ready;
    await wait(40);

    (el as any).replyingTo = 'c1';
    await wait(30);

    // A safe fixed impl re-renders and exposes a reply textarea
    const replyArea = el.shadowRoot.querySelector('.comment__reply-form textarea, .comment__reply textarea, textarea[placeholder*="rep" i]');
    expect(replyArea).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// chip: hasIconSlot reactive — async slot change re-renders icon wrapper
// ---------------------------------------------------------------------------

describe('chip: hasIconSlot is reactive for async slot assignment', () => {
  it('adding an icon via <slot name="icon"> after mount shows the icon wrapper', async () => {
    await import('../../packages/components/src/chip/snice-chip');
    const el = document.createElement('snice-chip') as any;
    el.label = 'Hi';
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    // Initially no icon
    expect(el.shadowRoot.querySelector('.chip-icon-slot')).toBeFalsy();

    // Simulate what slotchange does: flip hasIconSlot to true. With the fix
    // this triggers a re-render via the @property decorator. With the bug,
    // the DOM stays the same.
    (el as any).hasIconSlot = true;
    await wait(30);

    expect(el.shadowRoot.querySelector('.chip-icon-slot')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// file-upload: selectedFiles reactive — file list renders on change
// ---------------------------------------------------------------------------

describe('file-upload: selectedFiles is reactive', () => {
  it('setting selectedFiles renders the file list in the shadow', async () => {
    await import('../../packages/components/src/file-upload/snice-file-upload');
    const el = document.createElement('snice-file-upload') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    (el as any).selectedFiles = [new File(['x'], 'a.txt', { type: 'text/plain' })];
    await wait(30);

    const items = el.shadowRoot.querySelectorAll('.file-item, [part="file-item"]');
    expect(items.length).toBeGreaterThan(0);
  });
});
