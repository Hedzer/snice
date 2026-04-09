import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-qr-reader';

type Args = {
  camera?: 'back' | 'front';
  pickFirst?: boolean;
  manualSnap?: boolean;
  tapStart?: boolean;
  scanSpeed?: number;
};

function note(text: string) {
  const p = document.createElement('p');
  p.style.cssText = 'font-size:.75rem;color:#888;margin:0 0 .5rem;';
  p.textContent = text;
  return p;
}

function makeReader(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-qr-reader');
  el.style.cssText = 'display:block;width:320px;height:280px;';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
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
  title: 'Media/QrReader',
  component: 'snice-qr-reader',
  tags: ['autodocs'],
  argTypes: {
    camera:    { control: 'select', options: ['back', 'front'] },
    pickFirst: { control: 'boolean' },
    manualSnap:{ control: 'boolean' },
    tapStart:  { control: 'boolean' },
    scanSpeed: { control: 'number' },
  },
  render: (args) => {
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    div.appendChild(note('QR reader requires camera permission. The component will prompt when mounted.'));
    const el = document.createElement('snice-qr-reader');
    el.style.cssText = 'display:block;width:320px;height:280px;';
    if (args.camera !== undefined) el.setAttribute('camera', args.camera);
    if (args.pickFirst) el.toggleAttribute('pick-first', true);
    if (args.manualSnap) el.toggleAttribute('manual-snap', true);
    if (args.tapStart) el.toggleAttribute('tap-start', true);
    if (args.scanSpeed !== undefined) el.setAttribute('scan-speed', String(args.scanSpeed));
    div.appendChild(el);
    return div;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { camera: 'back' } };

// h2: Default (manual start, continuous scan)
export const DefaultManualStart: Story = {
  render: () => {
    const div = wrap(note('Default: manual start, continuous scan'), makeReader({}));
    return div;
  },
};

// h2: Camera: back (default)
export const CameraBack: Story = {
  render: () => wrap(note('camera=back (rear camera, default)'), makeReader({ camera: 'back' })),
};

// h2: Camera: front
export const CameraFront: Story = {
  render: () => wrap(note('camera=front (selfie camera)'), makeReader({ camera: 'front' })),
};

// h2: pick-first (scan until first hit, then stop)
export const PickFirst: Story = {
  render: () => wrap(note('pick-first: stops scanning after first successful decode'), makeReader({ 'pick-first': true })),
};

// h2: manual-snap (photo snapshot mode)
export const ManualSnap: Story = {
  render: () => wrap(note('manual-snap: takes a snapshot on demand instead of continuous video'), makeReader({ 'manual-snap': true })),
};

// h2: tap-start (tap viewport to toggle)
export const TapStart: Story = {
  render: () => wrap(note('tap-start: tap the viewport to start/stop scanning'), makeReader({ 'tap-start': true })),
};

// h2: scan-speed="1" (slow)
export const ScanSpeedSlow: Story = {
  render: () => wrap(note('scan-speed=1: slowest scan rate'), makeReader({ 'scan-speed': 1 })),
};

// h2: scan-speed="5" (medium)
export const ScanSpeedMedium: Story = {
  render: () => wrap(note('scan-speed=5: medium scan rate'), makeReader({ 'scan-speed': 5 })),
};

// h2: scan-speed="10" (fast)
export const ScanSpeedFast: Story = {
  render: () => wrap(note('scan-speed=10: fastest scan rate'), makeReader({ 'scan-speed': 10 })),
};

// h2: Combinations: pick-first + front camera
export const PickFirstFrontCamera: Story = {
  render: () => wrap(
    note('pick-first + camera=front'),
    makeReader({ 'pick-first': true, camera: 'front' }),
  ),
};

// h2: Combinations: manual-snap + tap-start
export const ManualSnapTapStart: Story = {
  render: () => wrap(
    note('manual-snap + tap-start'),
    makeReader({ 'manual-snap': true, 'tap-start': true }),
  ),
};
