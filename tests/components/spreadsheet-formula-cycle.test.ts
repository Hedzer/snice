import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

describe('spreadsheet: formula cycle guard', () => {
  it('does not stack-overflow when A1 refs A2 and A2 refs A1', async () => {
    await import('../../packages/components/src/spreadsheet/snice-spreadsheet');
    const el = document.createElement('snice-spreadsheet') as any;
    el.columns = [{ key: 'a' }, { key: 'b' }];
    el.data = [
      ['=SUM(A2:A2)'],
      ['=SUM(A1:A1)'],
    ];
    document.body.appendChild(el);
    await el.ready;
    await wait(40);

    // Directly exercise the resolution via resolveValue through evaluateFormula.
    // With the bug: this throws RangeError (stack) or hangs.
    // With the fix: returns 0 or a stable value without throwing.
    expect(() => {
      // Call the cell's value resolution path.
      (el as any).resolveValue('=SUM(A2:A2)');
      (el as any).resolveValue('=SUM(A1:A1)');
    }).not.toThrow();
  });
});
