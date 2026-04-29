import { describe, it, expect, afterEach } from 'vitest';
import { queryShadow, removeComponent } from './test-utils';
import '../../components/select/snice-select';
import '../../components/select/snice-option';
import type { SniceSelectElement } from '../../components/select/snice-select.types';

/**
 * AUDIT FINDING (`.research/bug-audit-2026-04-29.md`):
 * snice-select's document-level `globalKeyHandler` runs whenever the
 * dropdown is open AND `editable` is false. When `searchable` is true and
 * the user focuses the search input, pressing Space is `preventDefault`'d
 * by the global handler and used to select the focused option, instead of
 * inserting a space character into the search query.
 *
 * This test exists to PROVE the bug. It is expected to FAIL until the
 * global Space handling bails when the search input is the active element.
 */
describe('snice-select — Space inside search input (currently broken)', () => {
  let container: HTMLElement;

  afterEach(() => {
    if (container) removeComponent(container);
  });

  it('inserts a space character when the search input is focused', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const select = document.createElement('snice-select') as SniceSelectElement;
    select.searchable = true;

    for (const v of ['hello world', 'hello there', 'goodbye']) {
      const opt = document.createElement('snice-option');
      opt.setAttribute('value', v);
      opt.setAttribute('label', v);
      select.appendChild(opt);
    }

    container.appendChild(select);
    await (select as any).ready;
    await new Promise(r => setTimeout(r, 30));

    select.open = true;
    await new Promise(r => setTimeout(r, 30));

    const searchInput = queryShadow<HTMLInputElement>(select as HTMLElement, '.select-search-input');
    expect(searchInput).toBeTruthy();

    searchInput!.focus();
    searchInput!.value = 'hello';
    searchInput!.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    // Press Space — this should add a space to the search input, not commit
    // the focused option.
    const spaceEvent = new KeyboardEvent('keydown', {
      key: ' ',
      code: 'Space',
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    searchInput!.dispatchEvent(spaceEvent);

    // Expectation: the global handler should not have eaten the Space.
    expect(spaceEvent.defaultPrevented).toBe(false);
  });
});
