import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-camera-annotate';

type Args = {
  autoRotateColors?: boolean;
  showLabelsPanel?: boolean;
};

function makeAnnotate(attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-camera-annotate');
  el.style.cssText = 'display:block;width:100%;max-width:800px;height:500px;';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') el.setAttribute(k, String(v));
    else el.setAttribute(k, v);
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
  title: 'Media/CameraAnnotate',
  component: 'snice-camera-annotate',
  tags: ['autodocs'],
  argTypes: {
    autoRotateColors: { control: 'boolean' },
    showLabelsPanel:  { control: 'boolean' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    wrap.appendChild(note('Camera annotate requires user activation. Permission prompt appears on mount.'));
    const el = document.createElement('snice-camera-annotate');
    el.style.cssText = 'display:block;width:100%;max-width:800px;height:500px;';
    if (args.autoRotateColors !== undefined) el.setAttribute('auto-rotate-colors', String(args.autoRotateColors));
    if (args.showLabelsPanel !== undefined) el.setAttribute('show-labels-panel', String(args.showLabelsPanel));
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { autoRotateColors: true, showLabelsPanel: true } };

// h2: Default (camera mode, auto-rotate-colors=true, show-labels-panel=true)
export const DefaultCameraMode: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    wrap.appendChild(note('Default: camera mode, auto-rotate-colors=true, show-labels-panel=true'));
    wrap.appendChild(makeAnnotate({}));
    return wrap;
  },
};

// h2: auto-rotate-colors: false
export const AutoRotateColorsFalse: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    wrap.appendChild(note('auto-rotate-colors=false: pen color stays fixed'));
    wrap.appendChild(makeAnnotate({ 'auto-rotate-colors': false }));
    return wrap;
  },
};

// h2: show-labels-panel: false
export const ShowLabelsPanelFalse: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    wrap.appendChild(note('show-labels-panel=false: annotation label panel hidden'));
    wrap.appendChild(makeAnnotate({ 'show-labels-panel': false }));
    return wrap;
  },
};

// h2: Both options off
export const BothOptionsOff: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    wrap.appendChild(note('auto-rotate-colors=false + show-labels-panel=false'));
    wrap.appendChild(makeAnnotate({ 'auto-rotate-colors': false, 'show-labels-panel': false }));
    return wrap;
  },
};

// h2: Mode: camera (default) vs annotate
export const ModeCameraVsAnnotate: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    wrap.appendChild(note('Mode: camera (default) — capture an image to switch to annotate mode'));
    wrap.appendChild(makeAnnotate({}));
    return wrap;
  },
};
