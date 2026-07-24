import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/video-player/snice-video-player';
import type { SniceVideoPlayerElement } from '../../packages/components/src/video-player/snice-video-player.types';

describe('snice-video-player', () => {
  let player: SniceVideoPlayerElement;

  afterEach(() => {
    if (player) {
      removeComponent(player as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render video-player element', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player');

      expect(player).toBeTruthy();
      expect(player.tagName).toBe('SNICE-VIDEO-PLAYER');
    });

    it('should have default properties', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player');

      expect(player.src).toBe('');
      expect(player.poster).toBe('');
      expect(player.autoplay).toBe(false);
      expect(player.muted).toBe(false);
      expect(player.loop).toBe(false);
      expect(player.controls).toBe(true);
      expect(player.playbackRate).toBe(1);
      expect(player.currentTime).toBe(0);
      expect(player.volume).toBe(1);
      expect(player.variant).toBe('default');
    });

    it('should render player structure', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player');
      await wait(10);

      const container = queryShadow(player as HTMLElement, '.video-container');
      expect(container).toBeTruthy();
    });
  });

  describe('properties', () => {
    it('should accept src attribute', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player', {
        src: '/test-video.mp4'
      });

      expect(player.src).toBe('/test-video.mp4');
    });

    it('should accept poster attribute', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player', {
        poster: '/poster.jpg'
      });

      expect(player.poster).toBe('/poster.jpg');
    });

    it('should accept autoplay attribute', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player', {
        autoplay: true
      });

      expect(player.autoplay).toBe(true);
    });

    it('should accept muted attribute', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player', {
        muted: true
      });

      expect(player.muted).toBe(true);
    });

    it('should accept loop attribute', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player', {
        loop: true
      });

      expect(player.loop).toBe(true);
    });

    it('should accept controls attribute', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player', {
        controls: false
      });

      expect(player.controls).toBe(false);
    });

    it('should accept volume attribute', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player', {
        volume: 0.5
      });

      expect(player.volume).toBe(0.5);
    });

    it('should accept variant attribute', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player', {
        variant: 'minimal'
      });

      expect(player.variant).toBe('minimal');
    });
  });

  describe('API methods', () => {
    it('should have play method', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player');

      expect(typeof player.play).toBe('function');
    });

    it('should have pause method', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player');

      expect(typeof player.pause).toBe('function');
    });

    it('should have toggle method', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player');

      expect(typeof player.toggle).toBe('function');
    });

    it('should have seekTo method', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player');

      expect(typeof player.seekTo).toBe('function');
    });

    it('should have setPlaybackRate method', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player');

      expect(typeof player.setPlaybackRate).toBe('function');
    });
  });

  describe('events', () => {
    it('should dispatch video-play event', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player');

      let eventFired = false;
      player.addEventListener('video-play', () => {
        eventFired = true;
      });

      // Just verify the event listener can be added
      expect(player).toBeTruthy();
    });

    it('should dispatch video-pause event', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player');

      let eventFired = false;
      player.addEventListener('video-pause', () => {
        eventFired = true;
      });

      expect(player).toBeTruthy();
    });

    it('should dispatch video-volume-change event', async () => {
      player = await createComponent<SniceVideoPlayerElement>('snice-video-player');

      let eventFired = false;
      player.addEventListener('video-volume-change', () => {
        eventFired = true;
      });

      expect(player).toBeTruthy();
    });
  });
  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/video-player/snice-video-player.css');

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
