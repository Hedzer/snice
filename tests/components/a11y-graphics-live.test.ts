import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

describe('terminal: output is a live log region', () => {
  it('terminal-output has role=log and aria-live=polite', async () => {
    await import('../../components/terminal/snice-terminal');
    const el = document.createElement('snice-terminal') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    const output = el.shadowRoot.querySelector('.terminal-output');
    expect(output?.getAttribute('role')).toBe('log');
    expect(output?.getAttribute('aria-live')).toBe('polite');
  });
});

describe('draw: canvas has role=img and aria-label', () => {
  it('canvas exposes role and label for screen readers', async () => {
    await import('../../components/draw/snice-draw');
    const el = document.createElement('snice-draw') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    const canvas = el.shadowRoot.querySelector('canvas');
    expect(canvas?.getAttribute('role')).toBe('img');
    expect(canvas?.getAttribute('aria-label')).toBe('Drawing canvas');
  });
});

describe('paint: canvas has role=img and aria-label', () => {
  it('canvas exposes role and label for screen readers', async () => {
    await import('../../components/paint/snice-paint');
    const el = document.createElement('snice-paint') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    const canvas = el.shadowRoot.querySelector('.paint-canvas');
    expect(canvas?.getAttribute('role')).toBe('img');
    expect(canvas?.getAttribute('aria-label')).toBe('Paint canvas');
  });
});

describe('audio-recorder: status region is live', () => {
  it('recorder-status has role=status and aria-live=polite', async () => {
    await import('../../components/audio-recorder/snice-audio-recorder');
    const el = document.createElement('snice-audio-recorder') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    const status = el.shadowRoot.querySelector('.recorder-status');
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.getAttribute('aria-live')).toBe('polite');
  });
});

describe('qr-code: container has role=img and aria-label with encoded value', () => {
  it('container exposes role and value-bearing label', async () => {
    await import('../../components/qr-code/snice-qr-code');
    const el = document.createElement('snice-qr-code') as any;
    el.value = 'hello-world';
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    const container = el.shadowRoot.querySelector('.qr-container');
    expect(container?.getAttribute('role')).toBe('img');
    expect(container?.getAttribute('aria-label')).toContain('hello-world');
  });
});

describe('heatmap: container has role=img and aria-label', () => {
  it('heatmap exposes role and accessible name', async () => {
    await import('../../components/heatmap/snice-heatmap');
    const el = document.createElement('snice-heatmap') as any;
    el.data = [{ date: '2024-01-01', value: 1 }];
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    const container = el.shadowRoot.querySelector('.heatmap');
    expect(container?.getAttribute('role')).toBe('img');
    expect(container?.getAttribute('aria-label')).toBeTruthy();
  });
});

