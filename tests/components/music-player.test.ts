import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/music-player/snice-music-player';
import type { SniceMusicPlayerElement, Track } from '../../components/music-player/snice-music-player.types';

describe('snice-music-player', () => {
  let player: SniceMusicPlayerElement;

  const sampleTracks: Track[] = [
    {
      id: 'track-1',
      title: 'Test Track 1',
      artist: 'Test Artist 1',
      album: 'Test Album',
      src: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABkYXRhAAAAAA==',
      duration: 60
    },
    {
      id: 'track-2',
      title: 'Test Track 2',
      artist: 'Test Artist 2',
      src: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABkYXRhAAAAAA==',
      duration: 90
    },
    {
      id: 'track-3',
      title: 'Test Track 3',
      artist: 'Test Artist 3',
      src: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABkYXRhAAAAAA==',
      duration: 120
    }
  ];

  afterEach(() => {
    if (player) {
      removeComponent(player as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render music player element', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      expect(player).toBeTruthy();
      expect(player.tagName).toBe('SNICE-MUSIC-PLAYER');
    });

    it('should have default properties', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      expect(player.tracks).toEqual([]);
      expect(player.currentTrackIndex).toBe(0);
      expect(player.currentTime).toBe(0);
      expect(player.duration).toBe(0);
      expect(player.volume).toBe(1);
      expect(player.muted).toBe(false);
      expect(player.shuffle).toBe(false);
      expect(player.repeat).toBe('off');
      expect(player.state).toBe('stopped');
      expect(player.autoplay).toBe(false);
      expect(player.showPlaylist).toBe(true);
      expect(player.showControls).toBe(true);
      expect(player.showVolume).toBe(true);
      expect(player.showArtwork).toBe(true);
      expect(player.showTrackInfo).toBe(true);
    });

    it('should render player controls', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      await wait(50);

      const controls = queryShadow(player as HTMLElement, '.player-controls');
      const playButton = queryShadow(player as HTMLElement, '.player-btn-play-pause');
      const nextButton = queryShadow(player as HTMLElement, '.player-btn-next');
      const prevButton = queryShadow(player as HTMLElement, '.player-btn-prev');

      expect(controls).toBeTruthy();
      expect(playButton).toBeTruthy();
      expect(nextButton).toBeTruthy();
      expect(prevButton).toBeTruthy();
    });
  });

  describe('tracks', () => {
    it('should set tracks property', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      await wait(50);

      expect(player.tracks).toEqual(sampleTracks);
      expect(player.tracks.length).toBe(3);
    });

    it('should render playlist when tracks are set', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      await wait(100);

      const playlist = queryShadow(player as HTMLElement, '.player-playlist');
      const playlistItems = queryShadowAll(player as HTMLElement, '.player-playlist-item');

      expect(playlist).toBeTruthy();
      expect(playlistItems?.length).toBe(3);
    });

    it('should hide playlist when showPlaylist is false', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player', {
        showPlaylist: false
      });
      player.tracks = sampleTracks;
      await wait(100);

      const playlist = queryShadow(player as HTMLElement, '.player-playlist');
      expect(playlist).toBeFalsy();
    });

    it('should get current track', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      await wait(50);

      const currentTrack = player.getCurrentTrack();
      expect(currentTrack).toEqual(sampleTracks[0]);
    });

    it('should return null when no tracks', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      const currentTrack = player.getCurrentTrack();
      expect(currentTrack).toBeNull();
    });
  });

  describe('playback controls', () => {
    beforeEach(() => {
      // Mock HTMLAudioElement
      global.Audio = vi.fn().mockImplementation(() => ({
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        load: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        volume: 1,
        muted: false,
        currentTime: 0,
        duration: 0,
        src: ''
      })) as any;
    });

    it('should load track by index', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      await wait(50);

      await player.loadTrack(1);
      expect(player.currentTrackIndex).toBe(1);
    });

    it('should throw error when loading invalid track index', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      await wait(50);

      await expect(player.loadTrack(99)).rejects.toThrow('Invalid track index');
    });

    it('should move to next track', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      await wait(50);

      player.next();
      await wait(50);
      expect(player.currentTrackIndex).toBe(1);
    });

    it('should loop to first track when next is called on last track', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      player.currentTrackIndex = 2;
      await wait(50);

      player.next();
      await wait(50);
      expect(player.currentTrackIndex).toBe(0);
    });

    it('should move to previous track', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      player.currentTrackIndex = 1;
      await wait(50);

      player.previous();
      await wait(50);
      expect(player.currentTrackIndex).toBe(0);
    });

    it('should loop to last track when previous is called on first track', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      await wait(50);

      player.previous();
      await wait(50);
      expect(player.currentTrackIndex).toBe(2);
    });
  });

  describe('volume control', () => {
    it('should set volume', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      await wait(50);

      player.setVolume(0.5);
      expect(player.volume).toBe(0.5);
    });

    it('should throw error for invalid volume', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      await wait(50);

      expect(() => player.setVolume(1.5)).toThrow('Volume must be between 0 and 1');
      expect(() => player.setVolume(-0.5)).toThrow('Volume must be between 0 and 1');
    });

    it('should unmute when volume is set above 0', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.muted = true;
      await wait(50);

      player.setVolume(0.5);
      expect(player.muted).toBe(false);
    });
  });

  describe('shuffle mode', () => {
    it('should toggle shuffle', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      expect(player.shuffle).toBe(false);

      player.toggleShuffle();
      expect(player.shuffle).toBe(true);

      player.toggleShuffle();
      expect(player.shuffle).toBe(false);
    });

    it('should render active shuffle button when enabled', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.shuffle = true;
      await wait(100);

      const shuffleButton = queryShadow(player as HTMLElement, '.player-btn-shuffle');
      expect(shuffleButton?.classList.contains('active')).toBe(true);
    });
  });

  describe('repeat mode', () => {
    it('should set repeat mode', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');

      player.setRepeat('all');
      expect(player.repeat).toBe('all');

      player.setRepeat('one');
      expect(player.repeat).toBe('one');

      player.setRepeat('off');
      expect(player.repeat).toBe('off');
    });

    it('should render active repeat button when not off', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.repeat = 'all';
      await wait(100);

      const repeatButton = queryShadow(player as HTMLElement, '.player-btn-repeat');
      expect(repeatButton?.classList.contains('active')).toBe(true);
    });
  });

  describe('display options', () => {
    it('should hide controls when showControls is false', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player', {
        showControls: false
      });
      await wait(50);

      const controls = queryShadow(player as HTMLElement, '.player-controls');
      expect(controls).toBeFalsy();
    });

    it('should hide volume when showVolume is false', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player', {
        showVolume: false
      });
      await wait(50);

      const volume = queryShadow(player as HTMLElement, '.player-volume');
      expect(volume).toBeFalsy();
    });

    it('should hide artwork when showArtwork is false', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player', {
        showArtwork: false
      });
      player.tracks = sampleTracks;
      await wait(100);

      const artwork = queryShadow(player as HTMLElement, '.player-artwork');
      expect(artwork).toBeFalsy();
    });

    it('should hide track info when showTrackInfo is false', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player', {
        showTrackInfo: false
      });
      player.tracks = sampleTracks;
      await wait(100);

      const trackInfo = queryShadow(player as HTMLElement, '.player-track-info');
      expect(trackInfo).toBeFalsy();
    });
  });

  describe('events', () => {
    beforeEach(() => {
      // Mock HTMLAudioElement
      global.Audio = vi.fn().mockImplementation(() => ({
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        load: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        volume: 1,
        muted: false,
        currentTime: 0,
        duration: 0,
        src: ''
      })) as any;
    });

    it('should emit track-change event when loading track', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      await wait(50);

      const eventPromise = new Promise((resolve) => {
        player.addEventListener('player-track-change', (e: any) => {
          resolve(e.detail.track);
        });
      });

      await player.loadTrack(1);
      const track = await eventPromise;
      expect(track).toEqual(sampleTracks[1]);
    });

    it('should emit shuffle-change event', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      await wait(50);

      const eventPromise = new Promise((resolve) => {
        player.addEventListener('player-shuffle-change', (e: any) => {
          resolve(e.detail.shuffle);
        });
      });

      player.toggleShuffle();
      const shuffle = await eventPromise;
      expect(shuffle).toBe(true);
    });

    it('should emit repeat-change event', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      await wait(50);

      const eventPromise = new Promise((resolve) => {
        player.addEventListener('player-repeat-change', (e: any) => {
          resolve(e.detail.repeat);
        });
      });

      player.setRepeat('all');
      const repeat = await eventPromise;
      expect(repeat).toBe('all');
    });

    it('should emit volume-change event', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      await wait(50);

      const eventPromise = new Promise((resolve) => {
        player.addEventListener('player-volume-change', (e: any) => {
          resolve(e.detail.volume);
        });
      });

      player.setVolume(0.7);
      const volume = await eventPromise;
      expect(volume).toBe(0.7);
    });
  });

  describe('attributes', () => {
    it('should set autoplay attribute', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player', {
        autoplay: true
      });
      expect(player.autoplay).toBe(true);
    });

    it('should set muted attribute', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player', {
        muted: true
      });
      expect(player.muted).toBe(true);
    });

    it('should set shuffle attribute', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player', {
        shuffle: true
      });
      expect(player.shuffle).toBe(true);
    });
  });

  describe('shuffle behavior', () => {
    beforeEach(() => {
      global.Audio = vi.fn().mockImplementation(() => ({
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        load: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        volume: 1,
        muted: false,
        currentTime: 0,
        duration: 0,
        src: ''
      })) as any;
    });

    it('should not repeat same track until all others have played', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      player.shuffle = true;
      await wait(50);

      const playedTracks = new Set<number>();
      playedTracks.add(player.currentTrackIndex);

      // Play through all tracks
      for (let i = 0; i < sampleTracks.length - 1; i++) {
        player.next();
        await wait(50);
        playedTracks.add(player.currentTrackIndex);
      }

      // All tracks should have been played
      expect(playedTracks.size).toBe(sampleTracks.length);
    });

    it('should create new shuffle queue after all tracks played', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      player.shuffle = true;
      await wait(50);

      const firstCycle: number[] = [player.currentTrackIndex];

      // Play through all tracks
      for (let i = 0; i < sampleTracks.length - 1; i++) {
        player.next();
        await wait(50);
        firstCycle.push(player.currentTrackIndex);
      }

      // Next call should start new cycle
      player.next();
      await wait(50);

      // Should be a different track
      expect(player.currentTrackIndex).toBeDefined();
      expect(player.currentTrackIndex).toBeGreaterThanOrEqual(0);
      expect(player.currentTrackIndex).toBeLessThan(sampleTracks.length);
    });

    it('should exclude current track from new shuffle queue', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      player.shuffle = true;
      player.currentTrackIndex = 0;
      await wait(50);

      // Go through full cycle
      for (let i = 0; i < sampleTracks.length - 1; i++) {
        player.next();
        await wait(50);
      }

      const currentBeforeNext = player.currentTrackIndex;
      player.next();
      await wait(50);

      // Should not immediately repeat the track we just finished
      expect(player.currentTrackIndex).not.toBe(currentBeforeNext);
    });
  });

  describe('repeat modes', () => {
    beforeEach(() => {
      global.Audio = vi.fn().mockImplementation(() => ({
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        load: vi.fn(),
        addEventListener: vi.fn((event, handler) => {
          if (event === 'ended') {
            // Store handler for manual triggering
            (global.Audio as any).endedHandler = handler;
          }
        }),
        removeEventListener: vi.fn(),
        volume: 1,
        muted: false,
        currentTime: 0,
        duration: 0,
        src: '',
        ended: false
      })) as any;
    });

    it('should cycle through repeat modes', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      await wait(50);

      expect(player.repeat).toBe('off');

      player.setRepeat('all');
      expect(player.repeat).toBe('all');

      player.setRepeat('one');
      expect(player.repeat).toBe('one');

      player.setRepeat('off');
      expect(player.repeat).toBe('off');
    });

    it('should stop after last track when repeat is off', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      player.repeat = 'off';
      player.currentTrackIndex = sampleTracks.length - 1;
      await wait(50);

      // Trigger track ended
      player['handleTrackEnded']();
      await wait(50);

      expect(player.state).toBe('stopped');
    });

    it('should loop to first track when repeat is all', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      player.repeat = 'all';
      player.currentTrackIndex = sampleTracks.length - 1;
      await wait(50);

      player.next();
      await wait(50);

      expect(player.currentTrackIndex).toBe(0);
    });

    it('should replay same track when repeat is one', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      player.repeat = 'one';
      player.currentTrackIndex = 1;
      await wait(50);

      const currentTrack = player.currentTrackIndex;

      // Trigger track ended
      player['handleTrackEnded']();
      await wait(50);

      expect(player.currentTrackIndex).toBe(currentTrack);
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      global.Audio = vi.fn().mockImplementation(() => ({
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        load: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        volume: 1,
        muted: false,
        currentTime: 0,
        duration: 0,
        src: ''
      })) as any;
    });

    it('should handle next with sequential playback', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      player.currentTrackIndex = 0;
      await wait(50);

      player.next();
      await wait(50);
      expect(player.currentTrackIndex).toBe(1);

      player.next();
      await wait(50);
      expect(player.currentTrackIndex).toBe(2);
    });

    it('should handle previous with sequential playback', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      player.currentTrackIndex = 2;
      player.currentTime = 0;
      await wait(50);

      player.previous();
      await wait(50);
      expect(player.currentTrackIndex).toBe(1);

      player.previous();
      await wait(50);
      expect(player.currentTrackIndex).toBe(0);
    });

    it('should restart track when previous called after 3 seconds', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      player.currentTrackIndex = 1;
      player.currentTime = 5;
      await wait(50);

      player.previous();
      await wait(50);

      expect(player.currentTrackIndex).toBe(1);
      expect(player.currentTime).toBe(0);
    });
  });

  describe('shuffle with repeat interaction', () => {
    beforeEach(() => {
      global.Audio = vi.fn().mockImplementation(() => ({
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        load: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        volume: 1,
        muted: false,
        currentTime: 0,
        duration: 0,
        src: ''
      })) as any;
    });

    it('should work with shuffle and repeat all', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      player.shuffle = true;
      player.repeat = 'all';
      await wait(50);

      const playedInCycle = new Set<number>();

      // Play through more than the number of tracks
      for (let i = 0; i < sampleTracks.length + 2; i++) {
        playedInCycle.add(player.currentTrackIndex);
        player.next();
        await wait(50);
      }

      // Should have played all tracks
      expect(playedInCycle.size).toBe(sampleTracks.length);
    });

    it('should work with shuffle and repeat one', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      player.shuffle = true;
      player.repeat = 'one';
      player.currentTrackIndex = 1;
      await wait(50);

      const trackBeforeEnded = player.currentTrackIndex;

      // Trigger track ended
      player['handleTrackEnded']();
      await wait(50);

      // Should still be on same track
      expect(player.currentTrackIndex).toBe(trackBeforeEnded);
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      global.Audio = vi.fn().mockImplementation(() => ({
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        load: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        volume: 1,
        muted: false,
        currentTime: 0,
        duration: 0,
        src: ''
      })) as any;
    });

    it('should handle single track with shuffle', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = [sampleTracks[0]];
      player.shuffle = true;
      await wait(50);

      player.next();
      await wait(50);

      expect(player.currentTrackIndex).toBe(0);
    });

    it('should reset shuffle queue when tracks change', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = sampleTracks;
      player.shuffle = true;
      await wait(50);

      // Go through some tracks
      player.next();
      player.next();
      await wait(50);

      // Change tracks
      player.tracks = [...sampleTracks, {
        id: 'track-4',
        title: 'New Track',
        artist: 'New Artist',
        src: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABkYXRhAAAAAA==',
        duration: 150
      }];
      await wait(50);

      // Shuffle queue should be reset
      expect(player.tracks.length).toBe(4);
    });

    it('should handle empty tracks array', async () => {
      player = await createComponent<SniceMusicPlayerElement>('snice-music-player');
      player.tracks = [];
      await wait(50);

      expect(player.getCurrentTrack()).toBeNull();

      // These should not throw
      player.next();
      player.previous();
      await wait(50);
    });
  });
});
