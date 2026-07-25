import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../packages/components/src/table/snice-cell-link';
import '../../packages/components/src/table/snice-cell-actions';

/**
 * Table cells take an icon from the consumer. They must resolve it the same
 * way every other component does — through renderIcon — rather than splicing
 * the raw string into markup, which both drops registry/image support and
 * turns a data field into an HTML injection point.
 */

let host: HTMLElement;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
});
afterEach(() => host.remove());

const mount = async <T extends HTMLElement>(tag: string, setup: (el: any) => void): Promise<T> => {
  const el = document.createElement(tag) as any;
  setup(el);
  host.appendChild(el);
  await el.ready;
  await el.rendered;
  return el as T;
};

describe('snice-cell-link icons', () => {
  it('does not execute markup supplied as an icon', async () => {
    const el = await mount('snice-cell-link', (e) => {
      e.value = 'https://example.com';
      e.text = 'Example';
      e.icon = '<img src=x onerror="globalThis.__cellLinkXss = true">';
    });

    expect((globalThis as any).__cellLinkXss, 'icon string was executed as HTML').toBeUndefined();
    expect(el.shadowRoot!.querySelector('img[onerror]'), 'icon injected raw markup').toBeNull();
  });

  it('resolves a registry icon name to inline SVG', async () => {
    const el = await mount('snice-cell-link', (e) => {
      e.value = 'https://example.com';
      e.icon = 'search';
    });

    expect(el.shadowRoot!.querySelector('svg'), 'registry icon did not resolve').toBeTruthy();
  });

  it('renders an image path as an image', async () => {
    const el = await mount('snice-cell-link', (e) => {
      e.value = 'https://example.com';
      e.icon = '/icons/link.svg';
    });

    const img = el.shadowRoot!.querySelector('img');
    expect(img, 'image icon did not render as <img>').toBeTruthy();
    expect(img!.getAttribute('src')).toBe('/icons/link.svg');
  });

  it('still renders an emoji as text', async () => {
    const el = await mount('snice-cell-link', (e) => {
      e.value = 'https://example.com';
      e.icon = '🔗';
    });

    expect(el.shadowRoot!.textContent).toContain('🔗');
  });
});

describe('snice-cell-actions icons', () => {
  const actions = (icon: string) => [{ action: 'edit', label: 'Edit', icon }];

  it('does not execute markup supplied as an icon', async () => {
    const el = await mount('snice-cell-actions', (e) => {
      e.actions = actions('<img src=x onerror="globalThis.__cellActionsXss = true">');
    });

    expect((globalThis as any).__cellActionsXss, 'icon string was executed as HTML').toBeUndefined();
    expect(el.shadowRoot!.querySelector('img[onerror]'), 'icon injected raw markup').toBeNull();
  });

  it('resolves a registry icon name to inline SVG', async () => {
    const el = await mount('snice-cell-actions', (e) => { e.actions = actions('search'); });
    expect(el.shadowRoot!.querySelector('svg'), 'registry icon did not resolve').toBeTruthy();
  });

  it('renders a relative image path as an image', async () => {
    // The hand-rolled check missed `../` paths, data: URIs and bare filenames.
    const el = await mount('snice-cell-actions', (e) => { e.actions = actions('../icons/edit.png'); });

    const img = el.shadowRoot!.querySelector('img');
    expect(img, 'relative image path did not render as <img>').toBeTruthy();
    expect(img!.getAttribute('src')).toBe('../icons/edit.png');
  });

  it('still renders an emoji as text', async () => {
    const el = await mount('snice-cell-actions', (e) => { e.actions = actions('✏️'); });
    expect(el.shadowRoot!.textContent).toContain('✏️');
  });
});
