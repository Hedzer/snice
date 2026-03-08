import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait, trackRenders } from './test-utils';
import '../../components/drawer/snice-drawer';
import '../../components/drawer/snice-drawer-target';
import type { SniceDrawerElement, SniceDrawerTargetElement } from '../../components/drawer/snice-drawer.types';

describe('drawer-target push property', () => {
  const elements: HTMLElement[] = [];

  function track<T extends HTMLElement>(el: T): T {
    elements.push(el);
    return el;
  }

  afterEach(() => {
    elements.forEach(el => el.remove());
    elements.length = 0;
  });

  async function createTarget() {
    const target = await createComponent<SniceDrawerTargetElement>('snice-drawer-target');
    track(target as unknown as HTMLElement);
    return target;
  }

  // ─── push property basics ───

  it('push defaults to empty string', async () => {
    const target = await createTarget();
    expect(target.push).toBe('');
  });

  it('setting push applies transform', async () => {
    const target = await createTarget();
    const tracker = trackRenders(target as unknown as HTMLElement);

    target.push = '240px';
    await tracker.next();

    expect((target as unknown as HTMLElement).style.transform).toBe('translateX(240px)');
  });

  it('clearing push removes transform', async () => {
    const target = await createTarget();
    const tracker = trackRenders(target as unknown as HTMLElement);

    target.push = '240px';
    await tracker.next();
    expect((target as unknown as HTMLElement).style.transform).toBe('translateX(240px)');

    target.push = '';
    await tracker.next();
    expect((target as unknown as HTMLElement).style.transform).toBe('');
  });

  it('repeated push/clear does not accumulate', async () => {
    const target = await createTarget();
    const tracker = trackRenders(target as unknown as HTMLElement);

    for (let i = 0; i < 5; i++) {
      target.push = '240px';
      await tracker.next();
      target.push = '';
      await tracker.next();
    }

    expect((target as unknown as HTMLElement).style.transform).toBe('');
  });

  it('push works with rem values', async () => {
    const target = await createTarget();
    const tracker = trackRenders(target as unknown as HTMLElement);

    target.push = '15rem';
    await tracker.next();

    expect((target as unknown as HTMLElement).style.transform).toBe('translateX(15rem)');
  });

  it('push works with negative values (right drawer)', async () => {
    const target = await createTarget();
    const tracker = trackRenders(target as unknown as HTMLElement);

    target.push = '-240px';
    await tracker.next();

    expect((target as unknown as HTMLElement).style.transform).toBe('translateX(-240px)');
  });

  it('push resets parent scrollLeft after transform change', async () => {
    // Create a parent with overflow:hidden
    const parent = document.createElement('div');
    parent.style.overflow = 'hidden';
    parent.style.width = '300px';
    document.body.appendChild(parent);
    elements.push(parent);

    const target = await createComponent<SniceDrawerTargetElement>('snice-drawer-target');
    parent.appendChild(target as unknown as HTMLElement);
    track(target as unknown as HTMLElement);
    await wait(50);

    // Simulate browser scrolling the parent (as overflow:hidden does with transforms)
    target.push = '240px';
    await wait(50);
    parent.scrollLeft = 240; // simulate what the browser does

    target.push = '';
    await wait(50);

    expect(parent.scrollLeft).toBe(0);
  });
});

describe('drawer-target linked to drawer via for=', () => {
  const elements: HTMLElement[] = [];

  function track<T extends HTMLElement>(el: T): T {
    elements.push(el);
    return el;
  }

  afterEach(() => {
    elements.forEach(el => el.remove());
    elements.length = 0;
  });

  async function createPushSetup(opts: { position?: string; overflow?: string } = {}) {
    const container = track(document.createElement('div'));
    container.style.position = 'relative';
    container.style.width = '600px';
    container.style.height = '400px';
    if (opts.overflow) container.style.overflow = opts.overflow;
    document.body.appendChild(container);

    const drawer = document.createElement('snice-drawer') as SniceDrawerElement;
    drawer.id = 'test-push-drawer';
    drawer.setAttribute('position', opts.position || 'left');
    drawer.setAttribute('size', 'small');
    drawer.setAttribute('contained', '');
    drawer.setAttribute('push-content', '');
    container.appendChild(drawer);

    const target = document.createElement('snice-drawer-target') as SniceDrawerTargetElement;
    target.setAttribute('for', 'test-push-drawer');
    target.textContent = 'Target content';
    container.appendChild(target);

    track(drawer as unknown as HTMLElement);
    track(target as unknown as HTMLElement);

    await (drawer as any).ready;
    await (target as any).ready;
    await wait(50);

    return { container, drawer, target };
  }

  it('target push is empty when drawer is closed', async () => {
    const { target } = await createPushSetup();
    expect(target.push).toBe('');
  });

  it('target push is set when drawer opens', async () => {
    const { drawer, target } = await createPushSetup();

    drawer.show();
    await wait(200);

    // In jsdom, offsetWidth may be 0, so push could be "0px"
    // But the mechanism should have fired — push should be set to something
    expect(target.push).toMatch(/^\d+px$/);
  });

  it('target push is cleared when drawer closes', async () => {
    const { drawer, target } = await createPushSetup();

    drawer.show();
    await wait(200);

    drawer.hide();
    await wait(200);

    expect(target.push).toBe('');
  });

  it('target transform is cleared after close', async () => {
    const { drawer, target } = await createPushSetup();

    drawer.show();
    await wait(200);

    drawer.hide();
    await wait(200);

    expect((target as unknown as HTMLElement).style.transform).toBe('');
  });

  it('repeated open/close leaves target in clean state', async () => {
    const { drawer, target } = await createPushSetup();

    for (let i = 0; i < 3; i++) {
      drawer.show();
      await wait(200);
      drawer.hide();
      await wait(200);
    }

    expect(target.push).toBe('');
    expect((target as unknown as HTMLElement).style.transform).toBe('');
  });

  it('target push is cleared on disconnect', async () => {
    const { drawer, target } = await createPushSetup();

    drawer.show();
    await wait(200);

    // Remove target from DOM
    (target as unknown as HTMLElement).remove();
    await wait(50);

    // Re-add and check it's clean
    document.body.appendChild(target as unknown as HTMLElement);
    await wait(50);

    // push should be reset by dispose
    expect((target as unknown as HTMLElement).style.transform).toBe('');
  });

  // ─── overflow:hidden should not matter with transform + property approach ───

  it('transform returns to empty after close with overflow:hidden', async () => {
    const { drawer, target } = await createPushSetup({ overflow: 'hidden' });

    drawer.show();
    await wait(200);
    drawer.hide();
    await wait(200);

    expect(target.push).toBe('');
    expect((target as unknown as HTMLElement).style.transform).toBe('');
  });

  it('container scrollLeft stays 0 with overflow:hidden', async () => {
    const { container, drawer } = await createPushSetup({ overflow: 'hidden' });

    drawer.show();
    await wait(200);
    drawer.hide();
    await wait(200);

    expect(container.scrollLeft).toBe(0);
  });
});
