// @vitest-environment node
import { execFileSync } from 'child_process';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

/**
 * Type-checks tests/fixtures/react-ref-contract/ref-contract.tsx, which proves
 * the generated adapter ref contract at compile time:
 *
 * - `ref.current?.element.addEventListener(...)` compiles.
 * - `ref.current?.addEventListener(...)` is rejected.
 * - A form component ref exposes `.value`; a non-form ref does not.
 * - Invented handle members are rejected.
 * - Generated wrappers accept the correctly typed `ref` prop (and reject a
 *   wrong one, which `RefAttributes<any>` would silently allow).
 */
describe('React adapter ref type contract', () => {
  it('enforces the imperative handle shape at compile time', () => {
    const tsc = join(process.cwd(), 'node_modules', '.bin', 'tsc');
    const project = join('tests', 'fixtures', 'react-ref-contract', 'tsconfig.json');

    let status = 0;
    let output = '';
    try {
      execFileSync(tsc, ['-p', project], { stdio: 'pipe' });
    } catch (error: any) {
      status = error.status ?? 1;
      output = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
    }

    expect(status, output).toBe(0);
  });
});
