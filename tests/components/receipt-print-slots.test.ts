import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

describe('receipt: print() includes slotted content', () => {
  it('slotted QR code / barcode child appears in print output', async () => {
    await import('../../packages/components/src/receipt/snice-receipt');

    let captured = '';
    const origOpen = window.open;
    window.open = (() => {
      const fakeDoc = {
        buffer: '',
        write(s: string) { fakeDoc.buffer += s; },
        close() {},
      };
      const fake = {
        document: fakeDoc,
        print() { captured = fakeDoc.buffer; },
        close() {},
      };
      return fake as any;
    }) as any;

    try {
      const el = document.createElement('snice-receipt') as any;
      el.items = [{ name: 'Coffee', price: 3 }];
      el.innerHTML = `<div slot="qr" data-marker="SLOTTED-QR">QR-HERE</div>`;
      document.body.appendChild(el);
      await el.ready;
      await wait(30);

      el.print();

      // With the bug: captured only contains shadow HTML; slotted marker missing.
      // With the fix: slotted content is included in print output.
      expect(captured).toContain('SLOTTED-QR');
    } finally {
      window.open = origOpen;
    }
  });
});
