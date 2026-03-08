import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/drawer/snice-drawer';
import type { SniceDrawerElement } from '../../components/drawer/snice-drawer.types';

describe('bottom drawer scroll bug in overflow:hidden container', () => {
  const elements: HTMLElement[] = [];

  function track<T extends HTMLElement>(el: T): T {
    elements.push(el);
    return el;
  }

  afterEach(() => {
    elements.forEach(el => el.remove());
    elements.length = 0;
  });

  async function createContainedBottomDrawer() {
    const container = track(document.createElement('div'));
    container.style.position = 'relative';
    container.style.width = '600px';
    container.style.height = '400px';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);

    const drawer = document.createElement('snice-drawer') as SniceDrawerElement;
    drawer.setAttribute('position', 'bottom');
    drawer.setAttribute('size', 'small');
    drawer.setAttribute('contained', '');
    container.appendChild(drawer);

    track(drawer as unknown as HTMLElement);
    await (drawer as any).ready;
    await wait(50);

    return { container, drawer };
  }

  it('container scrollTop should be 0 before opening', async () => {
    const { container } = await createContainedBottomDrawer();
    expect(container.scrollTop).toBe(0);
  });

  it('container scrollTop should remain 0 after opening bottom drawer', async () => {
    const { container, drawer } = await createContainedBottomDrawer();

    drawer.show();
    await wait(200);

    // This is the hypothesis: overflow:hidden container auto-scrolls
    // when the bottom drawer panel transitions from translateY(100%) to translateY(0)
    expect(container.scrollTop).toBe(0);
  });

  it('container scrollTop should remain 0 after closing bottom drawer', async () => {
    const { container, drawer } = await createContainedBottomDrawer();

    drawer.show();
    await wait(200);
    drawer.hide();
    await wait(200);

    expect(container.scrollTop).toBe(0);
  });

  it('container scrollLeft should remain 0 for bottom drawer', async () => {
    const { container, drawer } = await createContainedBottomDrawer();

    drawer.show();
    await wait(200);

    expect(container.scrollLeft).toBe(0);
  });

  it('repeated open/close should not accumulate scroll', async () => {
    const { container, drawer } = await createContainedBottomDrawer();

    for (let i = 0; i < 3; i++) {
      drawer.show();
      await wait(200);
      drawer.hide();
      await wait(200);
    }

    expect(container.scrollTop).toBe(0);
    expect(container.scrollLeft).toBe(0);
  });

  // Same test for top drawer for completeness
  it('top drawer: container scrollTop should remain 0 after open/close', async () => {
    const container = track(document.createElement('div'));
    container.style.position = 'relative';
    container.style.width = '600px';
    container.style.height = '400px';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);

    const drawer = document.createElement('snice-drawer') as SniceDrawerElement;
    drawer.setAttribute('position', 'top');
    drawer.setAttribute('size', 'small');
    drawer.setAttribute('contained', '');
    container.appendChild(drawer);

    track(drawer as unknown as HTMLElement);
    await (drawer as any).ready;
    await wait(50);

    drawer.show();
    await wait(200);
    drawer.hide();
    await wait(200);

    expect(container.scrollTop).toBe(0);
  });
});
