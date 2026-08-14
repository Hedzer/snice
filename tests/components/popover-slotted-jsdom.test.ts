// @vitest-environment jsdom
// Slotted-trigger regression for <snice-popover>: the trigger handlers
// delegate to the shadow `.popover__trigger` wrapper, and clicks land on
// light-DOM content slotted into it. happy-dom cannot propagate events across
// slot boundaries, so this suite runs under jsdom.
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/popover/snice-popover';
import type { SnicePopoverElement } from '../../packages/components/src/popover/snice-popover.types';

describe('snice-popover slotted trigger (jsdom)', () => {
  let popover: SnicePopoverElement;

  afterEach(() => {
    if (popover) removeComponent(popover as HTMLElement);
  });

  it('toggles when clicking slotted trigger content', async () => {
    popover = await createComponent<SnicePopoverElement>('snice-popover');
    const slotted = document.createElement('button');
    slotted.slot = 'trigger';
    (popover as HTMLElement).appendChild(slotted);
    await wait(20);

    slotted.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(50);
    expect(popover.open).toBe(true);

    slotted.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(50);
    expect(popover.open).toBe(false);
  });
});
