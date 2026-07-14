import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

// Theme 6: media players. Icon-only control buttons must have an
// aria-label, not just a tooltip-triggering `title`, so SRs announce them.

const PLAYERS = [
  { tag: 'snice-video-player',   path: '../../packages/components/src/video-player/snice-video-player',   setup: (el: any) => { el.src = 'about:blank'; } },
  { tag: 'snice-music-player',   path: '../../packages/components/src/music-player/snice-music-player',   setup: () => {} },
  { tag: 'snice-podcast-player', path: '../../packages/components/src/podcast-player/snice-podcast-player', setup: () => {} },
  { tag: 'snice-audio-recorder', path: '../../packages/components/src/audio-recorder/snice-audio-recorder', setup: () => {} },
];

for (const spec of PLAYERS) {
  describe(`${spec.tag}: control buttons have aria-label`, () => {
    it('every button inside shadow root has either aria-label, aria-labelledby, or non-empty text', async () => {
      await import(spec.path);
      const el = document.createElement(spec.tag) as any;
      spec.setup(el);
      document.body.appendChild(el);
      await el.ready;
      await wait(40);

      const buttons = Array.from(el.shadowRoot.querySelectorAll('button')) as HTMLButtonElement[];
      const unnamed = buttons.filter(b => {
        const hasAriaLabel = !!b.getAttribute('aria-label');
        const hasAriaLabelledby = !!b.getAttribute('aria-labelledby');
        const hasText = !!b.textContent?.trim();
        return !hasAriaLabel && !hasAriaLabelledby && !hasText;
      });

      if (unnamed.length > 0) {
        const html = unnamed.map(b => b.outerHTML.slice(0, 120)).join('\n');
        throw new Error(`${unnamed.length} unnamed button(s) in ${spec.tag}:\n${html}`);
      }
      expect(unnamed.length).toBe(0);
    });
  });
}
