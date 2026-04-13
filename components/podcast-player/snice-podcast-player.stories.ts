import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-podcast-player';

type Args = {
  src?: string;
  title?: string;
  show?: string;
  description?: string;
  artwork?: string;
  skipBack?: number;
  skipForward?: number;
  playbackRate?: number;
  volume?: number;
  muted?: boolean;
};

const SRC1 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
const SRC2 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';
const SRC3 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3';

function makePlayer(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-podcast-player');
  el.style.cssText = 'display:block;max-width:480px;';
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

const meta: Meta<Args> = {
  title: 'Media/PodcastPlayer',
  component: 'snice-podcast-player',
  tags: ['autodocs'],
  argTypes: {
    src:         { control: 'text' },
    title:       { control: 'text' },
    show:        { control: 'text' },
    description: { control: 'text' },
    artwork:     { control: 'text' },
    skipBack:    { control: 'number' },
    skipForward: { control: 'number' },
    playbackRate:{ control: 'number' },
    volume:      { control: 'number' },
    muted:       { control: 'boolean' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    const el = document.createElement('snice-podcast-player');
    el.style.cssText = 'display:block;max-width:480px;';
    if (args.src !== undefined) el.setAttribute('src', args.src);
    if (args.title !== undefined) el.setAttribute('title', args.title);
    if (args.show !== undefined) el.setAttribute('show', args.show);
    if (args.description !== undefined) el.setAttribute('description', args.description);
    if (args.artwork !== undefined) el.setAttribute('artwork', args.artwork);
    if (args.skipBack !== undefined) el.setAttribute('skip-back', String(args.skipBack));
    if (args.skipForward !== undefined) el.setAttribute('skip-forward', String(args.skipForward));
    if (args.playbackRate !== undefined) el.setAttribute('playback-rate', String(args.playbackRate));
    if (args.volume !== undefined) el.setAttribute('volume', String(args.volume));
    if (args.muted) el.toggleAttribute('muted', true);
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { src: SRC1, title: 'Episode 1: Getting Started', show: 'Tech Talks' },
};

// h2: Direct src with metadata
export const DirectSrcWithMetadata: Story = {
  render: () => row(makePlayer({
    src: SRC1,
    title: 'Episode 1: Getting Started',
    show: 'Tech Talks',
    description: 'An introduction to web components and modern development.',
  })),
};

// h2: With artwork
export const WithArtwork: Story = {
  render: () => row(makePlayer({
    src: SRC2,
    title: 'Episode 2: Deep Dive',
    show: 'Tech Talks',
    artwork: 'https://picsum.photos/seed/podcast/300/300',
    description: 'A deep dive into component architecture.',
  })),
};

// h2: Custom skip intervals (skip-back="10" skip-forward="60")
export const CustomSkipIntervals: Story = {
  render: () => row(makePlayer({
    src: SRC3,
    title: 'Custom Skip Intervals',
    show: 'Demo Show',
    'skip-back': 10,
    'skip-forward': 60,
  })),
};

// h2: Custom playback-rate="1.5"
export const CustomPlaybackRate: Story = {
  render: () => row(makePlayer({
    src: SRC1,
    title: '1.5x Speed',
    show: 'Speed Test',
    'playback-rate': 1.5,
  })),
};

// h2: volume="0.5"
export const Volume05: Story = {
  render: () => row(makePlayer({
    src: SRC2,
    title: 'Half Volume',
    show: 'Volume Test',
    volume: 0.5,
  })),
};

// h2: muted
export const Muted: Story = {
  render: () => row(makePlayer({
    src: SRC3,
    title: 'Muted Player',
    show: 'Mute Test',
    muted: true,
  })),
};

// h2: With episodes list
export const WithEpisodesList: Story = {
  render: () => {
    const el = makePlayer({ show: 'Multi-Episode Show' });
    (el as any).episodes = [
      { title: 'Ep 1: Introduction', src: SRC1, duration: 375, pubDate: 'Jan 15, 2026' },
      { title: 'Ep 2: Deep Dive', src: SRC2, duration: 420, pubDate: 'Jan 22, 2026', artwork: 'https://picsum.photos/seed/ep2/100/100' },
      { title: 'Ep 3: Advanced Topics', src: SRC3, duration: 510, pubDate: 'Jan 29, 2026' },
      { title: 'Ep 4: Q&A Session', src: SRC1, duration: 280, pubDate: 'Feb 5, 2026' },
    ];
    return row(el);
  },
};

// h2: With chapters
export const WithChapters: Story = {
  render: () => {
    const el = makePlayer({ show: 'Chapter Demo' });
    (el as any).episodes = [
      {
        title: 'Chaptered Episode',
        src: SRC1,
        duration: 375,
        chapters: [
          { title: 'Intro', startTime: 0 },
          { title: 'Main Topic', startTime: 60 },
          { title: 'Deep Dive', startTime: 180 },
          { title: 'Wrap Up', startTime: 300 },
        ],
      },
    ];
    return row(el);
  },
};

// h2: No src (empty state)
export const NoSrc: Story = {
  render: () => row(makePlayer({ title: '', show: '' })),
};

// h2: Title only, no show name
export const TitleOnlyNoShow: Story = {
  render: () => row(makePlayer({
    src: SRC1,
    title: 'Standalone Episode',
  })),
};

// h2: Long title and description
export const LongTitleAndDescription: Story = {
  render: () => row(makePlayer({
    src: SRC2,
    title: 'This Is a Very Long Episode Title That Should Test How the Component Handles Overflow and Text Wrapping in Limited Space',
    show: 'The Verbosity Podcast',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  })),
};

// h2: CSS Parts Styling
// Available parts: base, info, controls
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-pp-default snice-podcast-player { display:block;max-width:480px; }
      .parts-demo-pp-styled snice-podcast-player { display:block;max-width:480px; }
      .parts-demo-pp-styled snice-podcast-player::part(base) {
        background: #0c0a09;
        border: 2px solid #d97706;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 32px rgba(217,119,6,0.25);
      }
      .parts-demo-pp-styled snice-podcast-player::part(info) {
        background: linear-gradient(135deg, #1c1917 0%, #292524 100%);
        padding: 20px 20px 16px;
        border-bottom: 1px solid rgba(217,119,6,0.2);
      }
      .parts-demo-pp-styled snice-podcast-player::part(controls) {
        background: #1c1917;
        padding: 16px 20px;
        gap: 12px;
        border-top: 1px solid rgba(217,119,6,0.15);
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

    const defaultEl = document.createElement('snice-podcast-player');
    defaultEl.setAttribute('src', SRC1);
    defaultEl.setAttribute('title', 'Getting Started with Web Components');
    defaultEl.setAttribute('show', 'Dev Talks');
    wrap.appendChild(section('Default (no ::part() styles)', 'parts-demo-pp-default', defaultEl));

    const styledEl = document.createElement('snice-podcast-player');
    styledEl.setAttribute('src', SRC1);
    styledEl.setAttribute('title', 'Getting Started with Web Components');
    styledEl.setAttribute('show', 'Dev Talks');
    wrap.appendChild(section(
      'Styled: ::part(base) — dark amber border  |  ::part(info) — stone gradient header  |  ::part(controls) — dark controls bar',
      'parts-demo-pp-styled',
      styledEl,
    ));

    return wrap;
  },
};
