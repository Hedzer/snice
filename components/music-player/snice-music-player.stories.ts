import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-music-player';

type Args = {
  compact?: boolean;
  showPlaylist?: boolean;
  showControls?: boolean;
  showVolume?: boolean;
  showArtwork?: boolean;
  showTrackInfo?: boolean;
  shuffle?: boolean;
  repeat?: 'all' | 'one' | 'off';
  muted?: boolean;
  volume?: number;
  autoplay?: boolean;
};

const SAMPLE_TRACKS = [
  { id: '1', title: 'Ambient Dreams', artist: 'Synthwave', album: 'Chill Vibes', duration: 245, src: '' },
  { id: '2', title: 'Electric Sunset', artist: 'Neon Pulse', album: 'Night Drive', duration: 198, src: '' },
  { id: '3', title: 'Ocean Breeze', artist: 'Wave Rider', album: 'Beach Sessions', duration: 312, src: '' },
  { id: '4', title: 'Mountain Echo', artist: 'Alpine Sound', album: 'Nature', duration: 180, src: '' },
];

const ARTWORK_TRACKS = SAMPLE_TRACKS.map((t, i) => ({
  ...t,
  artwork: `https://picsum.photos/seed/track${i}/120/120`,
}));

function makePlayer(attrs: Record<string, string | boolean> = {}, tracks = SAMPLE_TRACKS) {
  const el = document.createElement('snice-music-player');
  el.style.cssText = 'display:block;max-width:500px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); else el.setAttribute(k, 'false'); }
    else el.setAttribute(k, v);
  }
  (el as any).tracks = tracks;
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Media/MusicPlayer',
  component: 'snice-music-player',
  tags: ['autodocs'],
  argTypes: {
    compact:      { control: 'boolean' },
    showPlaylist: { control: 'boolean' },
    showControls: { control: 'boolean' },
    showVolume:   { control: 'boolean' },
    showArtwork:  { control: 'boolean' },
    showTrackInfo:{ control: 'boolean' },
    shuffle:      { control: 'boolean' },
    repeat:       { control: 'select', options: ['all', 'one', 'off'] },
    muted:        { control: 'boolean' },
    volume:       { control: 'number' },
    autoplay:     { control: 'boolean' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    const el = document.createElement('snice-music-player');
    el.style.cssText = 'display:block;max-width:500px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    if (args.compact) el.toggleAttribute('compact', true);
    if (args.showPlaylist !== undefined) el.setAttribute('show-playlist', String(args.showPlaylist));
    if (args.showControls !== undefined) el.setAttribute('show-controls', String(args.showControls));
    if (args.showVolume !== undefined) el.setAttribute('show-volume', String(args.showVolume));
    if (args.showArtwork !== undefined) el.setAttribute('show-artwork', String(args.showArtwork));
    if (args.showTrackInfo !== undefined) el.setAttribute('show-track-info', String(args.showTrackInfo));
    if (args.shuffle) el.toggleAttribute('shuffle', true);
    if (args.repeat !== undefined) el.setAttribute('repeat', args.repeat);
    if (args.muted) el.toggleAttribute('muted', true);
    if (args.volume !== undefined) el.setAttribute('volume', String(args.volume));
    if (args.autoplay) el.toggleAttribute('autoplay', true);
    (el as any).tracks = SAMPLE_TRACKS;
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: {} };

// h2: Default (all features visible)
export const DefaultAllVisible: Story = {
  render: () => row(makePlayer({})),
};

// h2: Compact mode
export const CompactMode: Story = {
  render: () => row(makePlayer({ compact: true })),
};

// h2: Show playlist: false
export const ShowPlaylistFalse: Story = {
  render: () => row(makePlayer({ 'show-playlist': 'false' })),
};

// h2: Show controls: false
export const ShowControlsFalse: Story = {
  render: () => row(makePlayer({ 'show-controls': 'false' })),
};

// h2: Show volume: false
export const ShowVolumeFalse: Story = {
  render: () => row(makePlayer({ 'show-volume': 'false' })),
};

// h2: Show artwork: false
export const ShowArtworkFalse: Story = {
  render: () => row(makePlayer({ 'show-artwork': 'false' })),
};

// h2: Show track info: false
export const ShowTrackInfoFalse: Story = {
  render: () => row(makePlayer({ 'show-track-info': 'false' })),
};

// h2: Compact + no playlist
export const CompactNoPlaylist: Story = {
  render: () => row(makePlayer({ compact: true, 'show-playlist': 'false' })),
};

// h2: No artwork + no volume
export const NoArtworkNoVolume: Story = {
  render: () => row(makePlayer({ 'show-artwork': 'false', 'show-volume': 'false' })),
};

// h2: Shuffle enabled
export const ShuffleEnabled: Story = {
  render: () => row(makePlayer({ shuffle: true })),
};

// h2: Repeat: all
export const RepeatAll: Story = {
  render: () => row(makePlayer({ repeat: 'all' })),
};

// h2: Repeat: one
export const RepeatOne: Story = {
  render: () => row(makePlayer({ repeat: 'one' })),
};

// h2: Repeat: off (default)
export const RepeatOff: Story = {
  render: () => row(makePlayer({ repeat: 'off' })),
};

// h2: Muted
export const Muted: Story = {
  render: () => row(makePlayer({ muted: true })),
};

// h2: Volume: 0.5
export const Volume05: Story = {
  render: () => row(makePlayer({ volume: '0.5' })),
};

// h2: Volume: 0
export const Volume0: Story = {
  render: () => row(makePlayer({ volume: '0' })),
};

// h2: Autoplay
export const Autoplay: Story = {
  render: () => row(makePlayer({ autoplay: true })),
};

// h2: Single track
export const SingleTrack: Story = {
  render: () => row(makePlayer({}, [SAMPLE_TRACKS[0]])),
};

// h2: No tracks (empty)
export const NoTracks: Story = {
  render: () => {
    const el = document.createElement('snice-music-player');
    el.style.cssText = 'display:block;max-width:500px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    return el;
  },
};

// h2: Many tracks
export const ManyTracks: Story = {
  render: () => {
    const el = document.createElement('snice-music-player');
    el.style.cssText = 'display:block;max-width:500px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    (el as any).tracks = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      title: `Track ${i + 1}`,
      artist: `Artist ${String.fromCharCode(65 + (i % 26))}`,
      duration: 120 + i * 30,
      src: '',
    }));
    return el;
  },
};

// h2: Tracks without artwork
export const TracksWithoutArtwork: Story = {
  render: () => row(makePlayer({}, SAMPLE_TRACKS)),
};

// h2: Tracks with artwork
export const TracksWithArtwork: Story = {
  render: () => row(makePlayer({}, ARTWORK_TRACKS)),
};

// h2: All visibility flags off
export const AllVisibilityFlagsOff: Story = {
  render: () => row(makePlayer({
    'show-playlist': 'false',
    'show-controls': 'false',
    'show-volume': 'false',
    'show-artwork': 'false',
    'show-track-info': 'false',
  })),
};

// h2: Shuffle + Repeat all + Compact
export const ShuffleRepeatAllCompact: Story = {
  render: () => row(makePlayer({ shuffle: true, repeat: 'all', compact: true, 'show-playlist': 'false' })),
};

// h2: CSS Parts Styling
// Available parts: base, controls, playlist
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-mp-default snice-music-player { display:block;max-width:500px; }
      .parts-demo-mp-styled snice-music-player { display:block;max-width:500px; }
      .parts-demo-mp-styled snice-music-player::part(base) {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #7c3aed;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(124,58,237,0.3);
      }
      .parts-demo-mp-styled snice-music-player::part(controls) {
        background: rgba(124,58,237,0.15);
        border-top: 1px solid rgba(124,58,237,0.3);
        padding: 16px 20px;
        gap: 16px;
      }
      .parts-demo-mp-styled snice-music-player::part(playlist) {
        background: rgba(0,0,0,0.3);
        border-top: 1px solid rgba(124,58,237,0.2);
        max-height: 200px;
        overflow-y: auto;
      }
    `;
    wrap.appendChild(style);

    function section(title: string, className: string, el: HTMLElement) {
      const sec = document.createElement('div');
      sec.className = className;
      const h = document.createElement('div');
      h.style.cssText = 'font-size:.7rem;color:#888;margin-bottom:.5rem;font-family:monospace;';
      h.textContent = title;
      sec.appendChild(h);
      sec.appendChild(el);
      return sec;
    }

    const defaultEl = document.createElement('snice-music-player');
    (defaultEl as any).tracks = SAMPLE_TRACKS;
    wrap.appendChild(section('Default (no ::part() styles)', 'parts-demo-mp-default', defaultEl));

    const styledEl = document.createElement('snice-music-player');
    (styledEl as any).tracks = SAMPLE_TRACKS;
    wrap.appendChild(section(
      'Styled: ::part(base) — purple gradient  |  ::part(controls) — tinted panel  |  ::part(playlist) — semi-transparent list',
      'parts-demo-mp-styled',
      styledEl,
    ));

    return wrap;
  },
};
