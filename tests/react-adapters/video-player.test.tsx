/**
 * React Adapter Test for VideoPlayer
 */

import { describe, it, expect } from 'vitest';
import { testComponent } from './test-helpers';
import { VideoPlayer } from '../../adapters/react/video-player';

describe('VideoPlayer React Adapter', () => {
  testComponent({
    name: 'VideoPlayer',
    Component: VideoPlayer,
    properties: [
      { name: 'src', value: '', type: 'string' },
      { name: 'poster', value: '', type: 'string' },
      { name: 'autoplay', value: false, type: 'boolean' },
      { name: 'muted', value: false, type: 'boolean' },
      { name: 'loop', value: false, type: 'boolean' },
      { name: 'controls', value: true, type: 'boolean' },
      { name: 'playbackRate', value: 1, type: 'number' },
      { name: 'currentTime', value: 0, type: 'number' },
      { name: 'volume', value: 1, type: 'number' },
      { name: 'variant', value: 'default', type: 'string' }
    ],
    events: [
      { name: 'onVideoPlay', trigger: 'video-play' },
      { name: 'onVideoPause', trigger: 'video-pause' },
      { name: 'onVideoEnded', trigger: 'video-ended' },
      { name: 'onVideoTimeUpdate', trigger: 'video-time-update' },
      { name: 'onVideoVolumeChange', trigger: 'video-volume-change' },
      { name: 'onVideoFullscreenChange', trigger: 'video-fullscreen-change' }
    ],
    defaultProps: {}
  });
});
