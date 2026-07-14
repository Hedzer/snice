import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

// chat: previously returned `new CustomEvent` from @dispatch methods → detail.detail
describe('chat: dispatch detail is flat (not double-wrapped)', () => {
  it('message-send event detail has { message, attachments } directly', async () => {
    await import('../../packages/components/src/chat/snice-chat');
    const el = document.createElement('snice-chat') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    const detailHistory: any[] = [];
    el.addEventListener('message-send', (e: CustomEvent) => detailHistory.push(e.detail));

    el.emitMessageSend('hello', []);
    await wait(10);

    expect(detailHistory.length).toBe(1);
    // With the bug: detail = CustomEvent; detail.detail.message = 'hello'
    // With the fix: detail.message = 'hello'
    expect(detailHistory[0].message).toBe('hello');
  });
});

// link: previously used @dispatch('click') on the click handler, causing
// each click to fire twice (native bubble + synthetic re-dispatch)
describe('link: click fires exactly once', () => {
  it('clicking the anchor fires a single click event on the host', async () => {
    await import('../../packages/components/src/link/snice-link');
    const el = document.createElement('snice-link') as any;
    el.href = '#x';
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    let clicks = 0;
    el.addEventListener('click', () => clicks++);

    const anchor = el.shadowRoot.querySelector('a') as HTMLAnchorElement;
    expect(anchor).toBeTruthy();
    anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
    await wait(20);

    expect(clicks).toBe(1);
  });
});
