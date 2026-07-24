import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../packages/components/src/podcast-player/snice-podcast-player';
import type { SnicePodcastPlayerElement } from '../../packages/components/src/podcast-player/snice-podcast-player.types';

const cssPath = resolve(process.cwd(), 'packages/components/src/podcast-player/snice-podcast-player.css');

describe('snice-podcast-player', () => {
  let player: SnicePodcastPlayerElement;

  afterEach(() => {
    if (player) removeComponent(player as HTMLElement);
  });

  describe('basic functionality', () => {
    it('should be defined', () => {
      expect(customElements.get('snice-podcast-player')).toBeDefined();
    });

    it('has sensible defaults', async () => {
      player = await createComponent<SnicePodcastPlayerElement>('snice-podcast-player');
      expect(player.src).toBe('');
      expect(player.playbackRate).toBe(1);
      expect(player.skipForward).toBe(30);
      expect(player.skipBack).toBe(15);
      expect(player.currentTime).toBe(0);
    });

    it('renders the player shell', async () => {
      player = await createComponent<SnicePodcastPlayerElement>('snice-podcast-player');
      await wait(50);

      expect(queryShadow(player as HTMLElement, '.podcast-progress')).toBeTruthy();
    });

    it('binds the episode-title attribute to the title property', async () => {
      // title cannot use the global title attribute (attribute: false), so the
      // component must expose episode-title for declarative authoring.
      const observed = (customElements.get('snice-podcast-player') as any).observedAttributes as string[];
      expect(observed).toContain('episode-title');

      player = await createComponent<SnicePodcastPlayerElement>('snice-podcast-player', {
        'episode-title': 'Episode 1: Getting Started',
      });
      await wait(50);

      expect(player.title).toBe('Episode 1: Getting Started');
      expect(queryShadow(player as HTMLElement, '.podcast-title')?.textContent).toContain('Episode 1: Getting Started');
    });

    it('binds kebab-case skip attributes', async () => {
      player = await createComponent<SnicePodcastPlayerElement>('snice-podcast-player', {
        'skip-forward': 45,
        'skip-back': 10,
      });
      expect(player.skipForward).toBe(45);
      expect(player.skipBack).toBe(10);
    });
  });

  describe('public seek API', () => {
    it('seekTo updates currentTime', async () => {
      player = await createComponent<SnicePodcastPlayerElement>('snice-podcast-player');
      await wait(50);

      player.seekTo(120);
      expect(player.currentTime).toBe(120);
    });

    it('doSkipBack clamps at zero', async () => {
      player = await createComponent<SnicePodcastPlayerElement>('snice-podcast-player');
      await wait(50);

      player.seekTo(5);
      player.doSkipBack();
      expect(player.currentTime).toBe(0);
    });
  });

  describe('seek bar accessibility', () => {
    it('exposes the progress bar as a focusable slider', async () => {
      player = await createComponent<SnicePodcastPlayerElement>('snice-podcast-player');
      await wait(50);

      const progress = queryShadow(player as HTMLElement, '.podcast-progress');
      expect(progress?.getAttribute('role')).toBe('slider');
      expect(progress?.getAttribute('tabindex')).toBe('0');
      expect(progress?.getAttribute('aria-label')).toBeTruthy();
      expect(progress?.getAttribute('aria-valuemin')).toBe('0');
      expect(progress?.hasAttribute('aria-valuenow')).toBe(true);
    });

    it('seeks forward with ArrowRight', async () => {
      player = await createComponent<SnicePodcastPlayerElement>('snice-podcast-player');
      await wait(50);

      const progress = queryShadow(player as HTMLElement, '.podcast-progress');
      progress?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await wait(50);

      expect(player.currentTime).toBeGreaterThan(0);
    });

    it('seeks back to the start with Home', async () => {
      player = await createComponent<SnicePodcastPlayerElement>('snice-podcast-player');
      await wait(50);

      player.seekTo(90);
      const progress = queryShadow(player as HTMLElement, '.podcast-progress');
      progress?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await wait(50);

      expect(player.currentTime).toBe(0);
    });
  });

  describe('layout', () => {
    it('places the volume control inline with the duration bar', async () => {
      player = await createComponent<SnicePodcastPlayerElement>('snice-podcast-player');
      await wait(50);

      const inlineVolume = queryShadow(player as HTMLElement, '.podcast-progress-container .podcast-volume');
      expect(inlineVolume).toBeTruthy();
    });
  });

  describe('control accessibility', () => {
    it('labels every control button', async () => {
      player = await createComponent<SnicePodcastPlayerElement>('snice-podcast-player');
      await wait(50);

      const buttons = Array.from(queryShadowAll(player as HTMLElement, 'button'));
      expect(buttons.length).toBeGreaterThan(0);
      for (const btn of buttons) {
        expect(btn.getAttribute('aria-label'), `button ${btn.className}`).toBeTruthy();
      }
    });
  });

  describe('stylesheet contracts', () => {
    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(cssPath, 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      const css = readFileSync(cssPath, 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});
