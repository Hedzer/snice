import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-video-player';

type Args = {
  src?: string;
  variant?: 'default' | 'minimal' | 'cinema';
  controls?: boolean;
  poster?: string;
  muted?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  playbackRate?: number;
  volume?: number;
};

const VIDEO_SRC = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const POSTER_SRC = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg';

function makeVideo(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-video-player');
  el.style.cssText = 'display:block;max-width:640px;';
  if (!attrs.src) el.setAttribute('src', VIDEO_SRC);
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, String(v));
  }
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function label(text: string) {
  const lbl = document.createElement('div');
  lbl.style.cssText = 'font-size:.7rem;color:#888;margin-bottom:.25rem;';
  lbl.textContent = text;
  return lbl;
}

function cell(labelText: string, el: HTMLElement) {
  const div = document.createElement('div');
  div.appendChild(label(labelText));
  div.appendChild(el);
  return div;
}

const meta: Meta<Args> = {
  title: 'VideoPlayer',
  component: 'snice-video-player',
  tags: ['autodocs'],
  argTypes: {
    src:         { control: 'text' },
    variant:     { control: 'select', options: ['default', 'minimal', 'cinema'] },
    controls:    { control: 'boolean' },
    poster:      { control: 'text' },
    muted:       { control: 'boolean' },
    loop:        { control: 'boolean' },
    autoplay:    { control: 'boolean' },
    playbackRate:{ control: 'number' },
    volume:      { control: 'number' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    const el = document.createElement('snice-video-player');
    el.style.cssText = 'display:block;max-width:640px;';
    el.setAttribute('src', args.src ?? VIDEO_SRC);
    if (args.variant !== undefined) el.setAttribute('variant', args.variant);
    if (args.controls) el.toggleAttribute('controls', true);
    if (args.poster !== undefined) el.setAttribute('poster', args.poster);
    if (args.muted) el.toggleAttribute('muted', true);
    if (args.loop) el.toggleAttribute('loop', true);
    if (args.autoplay) el.toggleAttribute('autoplay', true);
    if (args.playbackRate !== undefined) el.setAttribute('playback-rate', String(args.playbackRate));
    if (args.volume !== undefined) el.setAttribute('volume', String(args.volume));
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { src: VIDEO_SRC, variant: 'default', controls: true } };

// h2: Variant: default
export const VariantDefault: Story = {
  render: () => row(makeVideo({ variant: 'default', controls: true, poster: POSTER_SRC })),
};

// h2: Variant: minimal
export const VariantMinimal: Story = {
  render: () => row(makeVideo({ variant: 'minimal', controls: true, poster: POSTER_SRC })),
};

// h2: Variant: cinema
export const VariantCinema: Story = {
  render: () => row(makeVideo({ variant: 'cinema', controls: true, poster: POSTER_SRC })),
};

// h2: Controls: true (default) vs false
export const ControlsTrueVsFalse: Story = {
  render: () => row(
    cell('controls=true', makeVideo({ controls: true })),
    cell('controls=false', makeVideo({})),
  ),
};

// h2: Poster
export const Poster: Story = {
  render: () => row(
    cell('With poster', makeVideo({ controls: true, poster: POSTER_SRC })),
    cell('No poster', makeVideo({ controls: true })),
  ),
};

// h2: Muted
export const Muted: Story = {
  render: () => row(makeVideo({ muted: true, controls: true })),
};

// h2: Loop
export const Loop: Story = {
  render: () => row(makeVideo({ loop: true, controls: true })),
};

// h2: Autoplay (muted required by browsers)
export const AutoplayMuted: Story = {
  render: () => row(makeVideo({ autoplay: true, muted: true, controls: true })),
};

// h2: Playback Rate (initial)
export const PlaybackRate: Story = {
  render: () => row(
    cell('playback-rate=0.5', makeVideo({ 'playback-rate': 0.5, controls: true })),
    cell('playback-rate=2', makeVideo({ 'playback-rate': 2, controls: true })),
  ),
};

// h2: Volume
export const Volume: Story = {
  render: () => row(
    cell('volume=0.25', makeVideo({ volume: 0.25, controls: true })),
    cell('volume=1 (default)', makeVideo({ volume: 1, controls: true })),
  ),
};

// h2: Slot: Multiple Sources
export const SlotMultipleSources: Story = {
  render: () => {
    const el = document.createElement('snice-video-player');
    el.style.cssText = 'display:block;max-width:640px;';
    el.setAttribute('poster', POSTER_SRC);
    el.toggleAttribute('controls', true);
    const source = document.createElement('source');
    source.setAttribute('src', VIDEO_SRC);
    source.setAttribute('type', 'video/mp4');
    el.appendChild(source);
    return el;
  },
};

// h2: Combination: muted + loop + autoplay
export const CombinationMutedLoopAutoplay: Story = {
  render: () => row(makeVideo({ muted: true, loop: true, autoplay: true, controls: true })),
};

// h2: No Source (empty)
export const NoSource: Story = {
  render: () => {
    const el = document.createElement('snice-video-player');
    el.style.cssText = 'display:block;max-width:640px;';
    el.toggleAttribute('controls', true);
    return el;
  },
};

// h2: CSS Parts Styling
// Available parts: base, video, controls, progress
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-vp-default snice-video-player { display:block;max-width:560px; }
      .parts-demo-vp-styled snice-video-player { display:block;max-width:560px; }
      .parts-demo-vp-styled snice-video-player::part(base) {
        border: 3px solid #06b6d4;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 0 0 6px rgba(6,182,212,0.15), 0 8px 32px rgba(6,182,212,0.2);
        background: #000;
      }
      .parts-demo-vp-styled snice-video-player::part(video) {
        border-radius: 0;
      }
      .parts-demo-vp-styled snice-video-player::part(controls) {
        background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%);
        padding: 16px 20px 12px;
        gap: 12px;
      }
      .parts-demo-vp-styled snice-video-player::part(progress) {
        height: 5px;
        border-radius: 3px;
        background: rgba(6,182,212,0.3);
        cursor: pointer;
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

    const defaultEl = document.createElement('snice-video-player');
    defaultEl.setAttribute('src', VIDEO_SRC);
    defaultEl.setAttribute('poster', POSTER_SRC);
    defaultEl.toggleAttribute('controls', true);
    wrap.appendChild(section('Default (no ::part() styles)', 'parts-demo-vp-default', defaultEl));

    const styledEl = document.createElement('snice-video-player');
    styledEl.setAttribute('src', VIDEO_SRC);
    styledEl.setAttribute('poster', POSTER_SRC);
    styledEl.toggleAttribute('controls', true);
    wrap.appendChild(section(
      'Styled: ::part(base) — cyan border + glow  |  ::part(controls) — gradient overlay  |  ::part(progress) — tinted track',
      'parts-demo-vp-styled',
      styledEl,
    ));

    return wrap;
  },
};

// h2: Keyboard Shortcuts Reference
export const KeyboardShortcutsReference: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;flex-direction:column;';
    const info = document.createElement('div');
    info.style.cssText = 'font-size:.8rem;color:#888;line-height:1.8;';
    info.textContent = 'Space/K: Play/Pause | F: Fullscreen | M: Mute | Left/Right: Seek 5s | Up/Down: Volume 10%';
    wrap.appendChild(info);
    wrap.appendChild(makeVideo({ controls: true, poster: POSTER_SRC }));
    return wrap;
  },
};
