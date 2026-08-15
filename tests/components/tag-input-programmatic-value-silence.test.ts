import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/tag-input/snice-tag-input';
import '../../packages/components/src/input/snice-input';
import type { SniceTagInputElement } from '../../packages/components/src/tag-input/snice-tag-input.types';

/**
 * Defect guard: `snice-tag-input` must be SILENT for programmatic `value`
 * assignment. `tag-change` is a user-intent event — typing, pasting, removing a
 * chip — exactly like `input`/`change` on `snice-input`.
 *
 * When the setter emits, a framework `.value` binding that re-applies component
 * state from the event payload feeds itself and never settles, so the loop case
 * below is asserted directly alongside the plain assignment paths (setter,
 * clear(), and an equal-but-new array).
 */
describe('snice-tag-input - programmatic value assignment is silent', () => {
  let el: HTMLElement | undefined;

  afterEach(() => {
    if (el && el.isConnected) removeComponent(el);
    el = undefined;
  });

  // Plain setter: assigning, then emptying, must not emit at all.
  it('does not emit tag-change for programmatic value assignment', async () => {
    const tagInput = document.createElement('snice-tag-input') as SniceTagInputElement;
    document.body.appendChild(tagInput);
    el = tagInput as unknown as HTMLElement;
    await (tagInput as any).ready;

    const events: string[][] = [];
    tagInput.addEventListener('tag-change', (e) => {
      events.push([...(e as CustomEvent<{ value: string[] }>).detail.value]);
    });

    tagInput.value = ['X'];
    await (tagInput as any).rendered;
    tagInput.value = [];
    await (tagInput as any).rendered;
    await wait(20);

    expect(tagInput.value).toEqual([]);
    expect(events).toEqual([]);
  });

  // clear() routes through the same value setter, so it must stay silent too.
  it('does not emit tag-change when clear() empties a programmatically set list', async () => {
    const tagInput = await createComponent<SniceTagInputElement>('snice-tag-input');
    el = tagInput as unknown as HTMLElement;

    const seen: string[] = [];
    tagInput.addEventListener('tag-change', () => seen.push('tag-change'));

    tagInput.value = ['A', 'B'];
    await (tagInput as any).rendered;
    tagInput.clear();
    await (tagInput as any).rendered;
    await wait(20);

    expect(tagInput.value).toEqual([]);
    expect(seen).toEqual([]);
  });

  // A value that differs only in array identity must not re-enter the watch —
  // otherwise a `.value` binding fed by the event re-fires indefinitely.
  it('does not re-emit tag-change when an equal array is reassigned', async () => {
    const tagInput = await createComponent<SniceTagInputElement>('snice-tag-input');
    el = tagInput as unknown as HTMLElement;

    tagInput.value = ['X'];
    await (tagInput as any).rendered;
    await wait(20);

    const seen: string[] = [];
    tagInput.addEventListener('tag-change', () => seen.push('tag-change'));

    tagInput.value = ['X'];
    await (tagInput as any).rendered;
    await wait(20);

    expect(seen).toEqual([]);
  });

  // The feedback loop itself: a listener mirroring the event payload back onto
  // `.value` must terminate (here: never start).
  it('a .value binding driven by tag-change does not loop', async () => {
    const tagInput = await createComponent<SniceTagInputElement>('snice-tag-input');
    el = tagInput as unknown as HTMLElement;

    let echoes = 0;
    tagInput.addEventListener('tag-change', (e) => {
      echoes++;
      if (echoes > 25) return;
      // Mirrors a framework `.value` binding re-applying component state.
      tagInput.value = [...(e as CustomEvent<{ value: string[] }>).detail.value];
    });

    tagInput.value = ['X'];
    await (tagInput as any).rendered;
    await wait(50);

    expect(echoes).toBe(0);
  });

  // Contrast: real user interaction must still emit.
  it('still emits tag-change when the user types a tag', async () => {
    const tagInput = await createComponent<SniceTagInputElement>('snice-tag-input');
    el = tagInput as unknown as HTMLElement;

    const seen: string[][] = [];
    tagInput.addEventListener('tag-change', (e) => {
      seen.push([...(e as CustomEvent<{ value: string[] }>).detail.value]);
    });

    const field = (tagInput as unknown as HTMLElement)
      .shadowRoot!.querySelector('.tag-input-field') as HTMLInputElement;
    field.value = 'typed';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await (tagInput as any).rendered;
    await wait(20);

    expect(tagInput.value).toEqual(['typed']);
    expect(seen).toEqual([['typed']]);
  });

  // Contrast: the sibling form control whose convention this mirrors.
  it('snice-input stays silent for programmatic value assignment', async () => {
    const input = await createComponent<HTMLElement & { value: string }>('snice-input');
    el = input;

    const seen: string[] = [];
    for (const type of ['input', 'change']) {
      input.addEventListener(type, () => seen.push(type));
    }

    input.value = 'X';
    await (input as any).rendered;
    input.value = '';
    await (input as any).rendered;
    await wait(20);

    expect(input.value).toBe('');
    expect(seen).toEqual([]);
  });
});
