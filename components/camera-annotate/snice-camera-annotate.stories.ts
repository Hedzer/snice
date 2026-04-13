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

// h2: CSS Parts Styling
// Available parts: base, canvas, sidebar, toolbar
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-ca-default snice-camera-annotate { display:block;width:100%;max-width:700px;height:420px; }
      .parts-demo-ca-styled snice-camera-annotate { display:block;width:100%;max-width:700px;height:420px; }
      .parts-demo-ca-styled snice-camera-annotate::part(base) {
        border: 3px solid #10b981;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(16,185,129,0.2);
      }
      .parts-demo-ca-styled snice-camera-annotate::part(canvas) {
        background: #0f172a;
      }
      .parts-demo-ca-styled snice-camera-annotate::part(sidebar) {
        background: #1e293b;
        border-left: 2px solid #10b981;
        min-width: 140px;
      }
      .parts-demo-ca-styled snice-camera-annotate::part(toolbar) {
        background: #10b981;
        gap: 8px;
        padding: 8px 12px;
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

    const defaultEl = document.createElement('snice-camera-annotate');
    wrap.appendChild(section('Default (no ::part() styles)', 'parts-demo-ca-default', defaultEl));

    const styledEl = document.createElement('snice-camera-annotate');
    wrap.appendChild(section(
      'Styled: ::part(base) — green border  |  ::part(canvas) — dark bg  |  ::part(sidebar) — slate panel  |  ::part(toolbar) — green bar',
      'parts-demo-ca-styled',
      styledEl,
    ));

    const n = document.createElement('p');
    n.style.cssText = 'font-size:.75rem;color:#888;margin:0;';
    n.textContent = 'Camera-annotate requires user permission. Capture a frame to enter annotate mode where sidebar and toolbar are visible.';
    wrap.appendChild(n);

    return wrap;
  },
};
