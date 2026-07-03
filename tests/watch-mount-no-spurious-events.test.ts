import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './components/test-utils';
import '../components/menu/snice-menu';
import '../components/tag-input/snice-tag-input';
import '../components/command-palette/snice-command-palette';
import '../components/banner/snice-banner';
import '../components/action-bar/snice-action-bar';
import '../components/invoice/snice-invoice';

// A watcher that dispatches an event must not fire on mount (it would emit a
// phantom open/close/change for an element that never changed). Those watchers
// carry { immediate: false }. This guards against regressions in that opt-out.
async function mountAndCaptureEvents(tag: string, eventNames: string[]): Promise<string[]> {
  const captured: string[] = [];
  const listeners = eventNames.map(name => {
    const fn = () => captured.push(name);
    document.addEventListener(name, fn);
    return { name, fn };
  });

  const el = document.createElement(tag);
  document.body.appendChild(el);
  await (el as any).ready;
  await wait(20);

  for (const { name, fn } of listeners) document.removeEventListener(name, fn);
  el.remove();
  return captured;
}

describe('dispatch-on-change watchers do not fire on mount', () => {
  it('snice-menu emits no menu-open/menu-close on mount', async () => {
    expect(await mountAndCaptureEvents('snice-menu', ['menu-open', 'menu-close'])).toEqual([]);
  });

  it('snice-tag-input emits no tag-change on mount', async () => {
    expect(await mountAndCaptureEvents('snice-tag-input', ['tag-change'])).toEqual([]);
  });

  it('snice-command-palette emits no open/close on mount', async () => {
    expect(await mountAndCaptureEvents('snice-command-palette', ['command-palette-open', 'command-palette-close'])).toEqual([]);
  });

  it('snice-banner emits no banner-open/banner-close on mount', async () => {
    expect(await mountAndCaptureEvents('snice-banner', ['banner-open', 'banner-close'])).toEqual([]);
  });

  it('snice-action-bar emits no action-bar-open/action-bar-close on mount', async () => {
    expect(await mountAndCaptureEvents('snice-action-bar', ['action-bar-open', 'action-bar-close'])).toEqual([]);
  });

  it('snice-invoice emits no invoice-item-change on mount', async () => {
    expect(await mountAndCaptureEvents('snice-invoice', ['invoice-item-change'])).toEqual([]);
  });
});
