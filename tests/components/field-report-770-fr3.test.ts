import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/tag-input/snice-tag-input';
import '../../packages/components/src/input/snice-input';
import type { SniceTagInputElement } from '../../packages/components/src/tag-input/snice-tag-input.types';

/**
 * Field report FR3 against released 7.7.0:
 *   `snice-tag-input` emits `tag-change` for programmatic `value` assignment.
 *   Expected: programmatic assignment is silent; only user actions emit.
 */
describe('field report 7.7.0 / FR3 - snice-tag-input programmatic value assignment', () => {
  let el: HTMLElement | undefined;

  afterEach(() => {
    if (el && el.isConnected) removeComponent(el);
    el = undefined;
  });

  // FR3: bug confirmed - programmatic assignment emits tag-change twice.
  it('does not emit tag-change for programmatic value assignment (exact repro)', async () => {
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

  // FR3: same defect reached through clear(), which routes through the value setter.
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

  // FR3: assigning a value that differs only in identity still re-enters the
  // watch, so a `.value` binding fed by the event re-fires indefinitely.
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

  // Regression guard: the loop the customer describes. A listener that mirrors
  // the event payload back onto `.value` must terminate.
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

  // Passing guard: user interaction must still emit.
  it('still emits tag-change when the customer types a tag', async () => {
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

  // Passing guard: the sibling form control's convention this report cites.
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
