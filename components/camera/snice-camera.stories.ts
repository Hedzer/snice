import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-camera';

type Args = {
  autoStart?: boolean;
  facingMode?: 'user' | 'environment';
  mirror?: boolean;
  showControls?: boolean;
  controlsPosition?: string;
  objectFit?: 'cover' | 'contain';
  width?: number;
  height?: number;
};

function makeCamera(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-camera');
  el.style.cssText = 'display:block;width:320px;height:240px;';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (!v) el.setAttribute(k, 'false'); else el.setAttribute(k, 'true'); }
    else el.setAttribute(k, String(v));
  }
  return el;
}

function note(text: string) {
  const p = document.createElement('p');
  p.style.cssText = 'font-size:.75rem;color:#888;margin:0 0 .5rem;';
  p.textContent = text;
  return p;
}

const meta: Meta<Args> = {
  title: 'Media/Camera',
  component: 'snice-camera',
  tags: ['autodocs'],
  argTypes: {
    autoStart:        { control: 'boolean' },
    facingMode:       { control: 'select', options: ['user', 'environment'] },
    mirror:           { control: 'boolean' },
    showControls:     { control: 'boolean' },
    controlsPosition: { control: 'select', options: ['auto', 'bottom', 'right', 'left', 'top', 'bottom-left', 'bottom-right', 'top-left', 'top-right'] },
    objectFit:        { control: 'select', options: ['cover', 'contain'] },
    width:            { control: 'number' },
    height:           { control: 'number' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    wrap.appendChild(note('Camera requires user activation. The component will prompt for permission when mounted.'));
    const el = document.createElement('snice-camera');
    el.style.cssText = 'display:block;width:320px;height:240px;';
    if (args.autoStart !== undefined) el.setAttribute('auto-start', String(args.autoStart));
    if (args.facingMode !== undefined) el.setAttribute('facing-mode', args.facingMode);
    if (args.mirror !== undefined) el.setAttribute('mirror', String(args.mirror));
    if (args.showControls !== undefined) el.setAttribute('show-controls', String(args.showControls));
    if (args.controlsPosition !== undefined) el.setAttribute('controls-position', args.controlsPosition);
    if (args.objectFit !== undefined) el.setAttribute('object-fit', args.objectFit);
    if (args.width !== undefined) el.setAttribute('width', String(args.width));
    if (args.height !== undefined) el.setAttribute('height', String(args.height));
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { facingMode: 'user', mirror: true, showControls: true } };

// h2: Default (auto-start, facing-mode=user, mirror=true, show-controls=true)
export const DefaultAutoStart: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    wrap.appendChild(note('Default: auto-start, facing-mode=user, mirror=true, show-controls=true'));
    wrap.appendChild(makeCamera({}));
    return wrap;
  },
};

// h2: auto-start: false
export const AutoStartFalse: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    wrap.appendChild(note('auto-start=false: camera does not start automatically'));
    wrap.appendChild(makeCamera({ 'auto-start': false }));
    return wrap;
  },
};

// h2: facing-mode: user vs environment
export const FacingMode: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    wrap.appendChild(note('facing-mode: user (front) vs environment (rear)'));
    const user = makeCamera({ 'facing-mode': 'user' });
    const env = makeCamera({ 'facing-mode': 'environment' });
    wrap.appendChild(user);
    wrap.appendChild(env);
    return wrap;
  },
};

// h2: mirror: true vs false
export const Mirror: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    wrap.appendChild(note('mirror=true (default) vs mirror=false'));
    wrap.appendChild(makeCamera({ mirror: true }));
    wrap.appendChild(makeCamera({ mirror: false }));
    return wrap;
  },
};

// h2: show-controls: true vs false
export const ShowControls: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    wrap.appendChild(note('show-controls=true vs show-controls=false'));
    wrap.appendChild(makeCamera({ 'show-controls': true }));
    wrap.appendChild(makeCamera({ 'show-controls': false }));
    return wrap;
  },
};

// h2: All controls-position values
export const AllControlsPositions: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    wrap.appendChild(note('controls-position: auto, bottom, right, left, top'));
    for (const pos of ['auto', 'bottom', 'right', 'left', 'top']) {
      wrap.appendChild(makeCamera({ 'controls-position': pos }));
    }
    return wrap;
  },
};

// h2: object-fit: cover vs contain
export const ObjectFit: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    wrap.appendChild(note('object-fit: cover (default) vs contain'));
    wrap.appendChild(makeCamera({ 'object-fit': 'cover' }));
    wrap.appendChild(makeCamera({ 'object-fit': 'contain' }));
    return wrap;
  },
};

// h2: Custom resolution: width/height
export const CustomResolution: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    wrap.appendChild(note('Custom resolution: width=640 height=480 vs width=1920 height=1080'));
    wrap.appendChild(makeCamera({ width: 640, height: 480 }));
    wrap.appendChild(makeCamera({ width: 1920, height: 1080 }));
    return wrap;
  },
};

// h2: Custom controls slot
export const CustomControlsSlot: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    wrap.appendChild(note('Custom controls slot — slot="controls" child replaces default capture button'));
    const el = makeCamera({ 'show-controls': false });
    const btn = document.createElement('button');
    btn.slot = 'controls';
    btn.textContent = 'Custom Capture';
    btn.style.cssText = 'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);padding:4px 12px;border-radius:4px;border:none;background:white;cursor:pointer;';
    el.appendChild(btn);
    wrap.appendChild(el);
    return wrap;
  },
};
