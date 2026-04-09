import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-audio-recorder';

type Args = {
  showControls?: boolean;
  showVisualizer?: boolean;
  showTimer?: boolean;
  showPlayback?: boolean;
  maxDuration?: number;
  bitrate?: number;
};

function note(text: string) {
  const p = document.createElement('p');
  p.style.cssText = 'font-size:.75rem;color:#888;margin:0 0 .5rem;';
  p.textContent = text;
  return p;
}

function makeRecorder(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-audio-recorder');
  el.style.cssText = 'display:block;width:360px;';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') el.setAttribute(k, String(v));
    else el.setAttribute(k, String(v));
  }
  return el;
}

function wrap(...els: HTMLElement[]) {
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
  els.forEach(el => div.appendChild(el));
  return div;
}

const meta: Meta<Args> = {
  title: 'Media/AudioRecorder',
  component: 'snice-audio-recorder',
  tags: ['autodocs'],
  argTypes: {
    showControls:   { control: 'boolean' },
    showVisualizer: { control: 'boolean' },
    showTimer:      { control: 'boolean' },
    showPlayback:   { control: 'boolean' },
    maxDuration:    { control: 'number' },
    bitrate:        { control: 'number' },
  },
  render: (args) => {
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    div.appendChild(note('Audio recorder requires microphone permission. Permission prompt appears on recording start.'));
    const el = document.createElement('snice-audio-recorder');
    el.style.cssText = 'display:block;width:360px;';
    if (args.showControls !== undefined) el.setAttribute('show-controls', String(args.showControls));
    if (args.showVisualizer !== undefined) el.setAttribute('show-visualizer', String(args.showVisualizer));
    if (args.showTimer !== undefined) el.setAttribute('show-timer', String(args.showTimer));
    if (args.showPlayback !== undefined) el.setAttribute('show-playback', String(args.showPlayback));
    if (args.maxDuration !== undefined) el.setAttribute('max-duration', String(args.maxDuration));
    if (args.bitrate !== undefined) el.setAttribute('bitrate', String(args.bitrate));
    div.appendChild(el);
    return div;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { showControls: true, showVisualizer: true, showTimer: true, showPlayback: true } };

// h2: Default (all options on)
export const DefaultAllOn: Story = {
  render: () => wrap(note('Default: show-controls, show-visualizer, show-timer, show-playback all true'), makeRecorder({})),
};

// h2: show-controls: false
export const ShowControlsFalse: Story = {
  render: () => wrap(note('show-controls=false'), makeRecorder({ 'show-controls': false })),
};

// h2: show-visualizer: false
export const ShowVisualizerFalse: Story = {
  render: () => wrap(note('show-visualizer=false'), makeRecorder({ 'show-visualizer': false })),
};

// h2: show-timer: false
export const ShowTimerFalse: Story = {
  render: () => wrap(note('show-timer=false'), makeRecorder({ 'show-timer': false })),
};

// h2: show-playback: false
export const ShowPlaybackFalse: Story = {
  render: () => wrap(note('show-playback=false'), makeRecorder({ 'show-playback': false })),
};

// h2: All display options off
export const AllDisplayOptionsOff: Story = {
  render: () => wrap(
    note('All display options off'),
    makeRecorder({ 'show-controls': false, 'show-visualizer': false, 'show-timer': false, 'show-playback': false }),
  ),
};

// h2: max-duration: 10 (seconds)
export const MaxDuration10: Story = {
  render: () => wrap(note('max-duration=10 seconds'), makeRecorder({ 'max-duration': 10 })),
};

// h2: max-duration: 5
export const MaxDuration5: Story = {
  render: () => wrap(note('max-duration=5 seconds'), makeRecorder({ 'max-duration': 5 })),
};

// h2: max-duration: 0 (unlimited, default)
export const MaxDurationUnlimited: Story = {
  render: () => wrap(note('max-duration=0 (unlimited, default)'), makeRecorder({ 'max-duration': 0 })),
};

// h2: Bitrate: 64000
export const Bitrate64000: Story = {
  render: () => wrap(note('bitrate=64000 (low quality)'), makeRecorder({ bitrate: 64000 })),
};

// h2: Bitrate: 256000
export const Bitrate256000: Story = {
  render: () => wrap(note('bitrate=256000 (high quality)'), makeRecorder({ bitrate: 256000 })),
};

// h2: Boolean combinations matrix
export const BooleanCombinationsMatrix: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(2,auto);gap:1rem;';

    const label = (text: string) => {
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:.7rem;color:#888;margin-bottom:.25rem;';
      lbl.textContent = text;
      return lbl;
    };

    const makeCell = (text: string, attrs: Record<string, string | boolean | number>) => {
      const cell = document.createElement('div');
      cell.appendChild(label(text));
      cell.appendChild(makeRecorder(attrs));
      return cell;
    };

    grid.appendChild(makeCell('controls + visualizer, no timer/playback', { 'show-timer': false, 'show-playback': false }));
    grid.appendChild(makeCell('controls + timer, no visualizer/playback', { 'show-visualizer': false, 'show-playback': false }));
    grid.appendChild(makeCell('visualizer + timer, no controls/playback', { 'show-controls': false, 'show-playback': false }));
    grid.appendChild(makeCell('All on (default)', {}));

    return grid;
  },
};
