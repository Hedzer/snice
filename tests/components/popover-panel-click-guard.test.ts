// @vitest-environment jsdom
// <snice-popover> must NOT close when its own panel — the default-slot,
// light-DOM content — is clicked. Only the trigger toggles it, and only a click
// genuinely outside the host dismisses it.
//
// Two independent guards keep that true, and both are asserted here:
//   - the toggle path delegates through `@on('click', { target: '.popover__trigger' })`
//     (packages/core/src/on.ts:366-382), which only matches nodes whose
//     getRootNode() equals the listener root's tree scope — light-DOM default
//     content never matches the shadow `.popover__trigger` wrapper;
//   - the dismiss path (packages/components/src/popover/snice-popover.ts:141-153)
//     bails out whenever composedPath() contains the host, which it always does
//     for slotted panel content.
//
// A regression in either guard makes the panel un-clickable (buttons, inputs and
// links inside it would slam the popover shut on first press), so the cases below
// cover every way panel content can be authored: markup, nested elements, the
// authored `open` attribute, post-upgrade appends, and a nested shadow root.
//
// jsdom (not the default happy-dom) because the behavior is specifically about
// LIGHT-DOM default-slot content: happy-dom cannot propagate events across slot
// boundaries, so it cannot exercise the composedPath/delegation logic under
// test. Same rationale as tests/components/popover-slotted-jsdom.test.ts.
import { describe, it, expect, afterEach } from 'vitest';
import '../../packages/components/src/popover/snice-popover';
import type { SnicePopoverElement } from '../../packages/components/src/popover/snice-popover.types';

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** A real pointer interaction: mousedown (dismiss path) then click (toggle path). */
function userClick(el: Element) {
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

async function mount(markup: string): Promise<SnicePopoverElement> {
  document.body.innerHTML = markup;
  const popover = document.querySelector('snice-popover') as SnicePopoverElement;
  await (popover as any).ready;
  await wait(20);
  return popover;
}

describe('snice-popover — panel (default-slot) clicks must not dismiss', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps the popover open when the panel itself is clicked', async () => {
    const popover = await mount(
      '<snice-popover><button slot="trigger">T</button><div id="panel">PANEL</div></snice-popover>'
    );

    userClick(popover.querySelector('button[slot="trigger"]')!);
    await wait(20);
    expect(popover.open).toBe(true);

    userClick(document.getElementById('panel')!);
    await wait(20);
    expect(popover.open).toBe(true);
  });

  it('stays open across repeated panel clicks', async () => {
    const popover = await mount(
      '<snice-popover><button slot="trigger">T</button><div id="panel">PANEL</div></snice-popover>'
    );
    userClick(popover.querySelector('button[slot="trigger"]')!);
    await wait(20);
    expect(popover.open).toBe(true);

    const panel = document.getElementById('panel')!;
    for (let i = 0; i < 3; i++) {
      userClick(panel);
      await wait(20);
      expect(popover.open).toBe(true);
    }
  });

  it('stays open when a nested element inside the panel is clicked', async () => {
    const popover = await mount(
      '<snice-popover><button slot="trigger">T</button>' +
      '<div id="panel"><button id="inner">x</button></div></snice-popover>'
    );
    userClick(popover.querySelector('button[slot="trigger"]')!);
    await wait(20);
    expect(popover.open).toBe(true);

    userClick(document.getElementById('inner')!);
    await wait(20);
    expect(popover.open).toBe(true);
  });

  it('stays open on a panel click when opened by the authored open attribute', async () => {
    const popover = await mount(
      '<snice-popover open><button slot="trigger">T</button><div id="panel">PANEL</div></snice-popover>'
    );
    expect(popover.open).toBe(true);

    userClick(document.getElementById('panel')!);
    await wait(20);
    expect(popover.open).toBe(true);
  });

  it('stays open on a panel click when slot content is appended after upgrade', async () => {
    document.body.innerHTML = '';
    const popover = document.createElement('snice-popover') as SnicePopoverElement;
    document.body.appendChild(popover);
    await (popover as any).ready;

    const trigger = document.createElement('button');
    trigger.slot = 'trigger';
    trigger.textContent = 'T';
    const panel = document.createElement('div');
    panel.id = 'panel';
    panel.textContent = 'PANEL';
    popover.appendChild(trigger);
    popover.appendChild(panel);
    await wait(20);

    userClick(trigger);
    await wait(20);
    expect(popover.open).toBe(true);

    userClick(panel);
    await wait(20);
    expect(popover.open).toBe(true);
  });

  it('stays open on a panel click when the popover lives in another shadow root', async () => {
    document.body.innerHTML = '<div id="wrap"></div>';
    const shadow = document.getElementById('wrap')!.attachShadow({ mode: 'open' });
    shadow.innerHTML =
      '<snice-popover><button slot="trigger">T</button><div id="panel">PANEL</div></snice-popover>';
    const popover = shadow.querySelector('snice-popover') as SnicePopoverElement;
    await (popover as any).ready;
    await wait(20);

    userClick(shadow.querySelector('button[slot="trigger"]')!);
    await wait(20);
    expect(popover.open).toBe(true);

    userClick(shadow.querySelector('#panel')!);
    await wait(20);
    expect(popover.open).toBe(true);
  });

  it('still toggles shut from the trigger, and still dismisses on a true outside click', async () => {
    const popover = await mount(
      '<snice-popover><button slot="trigger">T</button><div id="panel">PANEL</div></snice-popover>' +
      '<div id="outside">OUTSIDE</div>'
    );
    const trigger = popover.querySelector('button[slot="trigger"]')!;

    userClick(trigger);
    await wait(20);
    expect(popover.open).toBe(true);

    userClick(trigger);
    await wait(20);
    expect(popover.open).toBe(false);

    userClick(trigger);
    await wait(20);
    expect(popover.open).toBe(true);

    userClick(document.getElementById('outside')!);
    await wait(20);
    expect(popover.open).toBe(false);
  });
});
