/**
 * snice-file-gallery matrix — badges and custom actions.
 *
 * Documented surface:
 *   · `setFileBadge(fileId, badge, position?)` / `removeFileBadge(fileId)` with
 *     `FileGalleryContent = string | UnsafeHTML` — "Strings are escaped text.
 *     Rich badge/SVG composition requires the explicit `unsafeHTML()` wrapper";
 *   · `addCustomAction(icon, text): string`, `removeCustomAction(actionId)`,
 *     `clearCustomActions()`, the `customActions` getter and
 *     `getCustomAction(actionId)`;
 *   · `custom-action-click` → `{ actionId, component }`.
 *
 * 22 combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unsafeHTML } from 'snice';
import {
  FILES,
  addButtons, checkChrome, combo, expectNoProblems, itemFor, makeGallery,
  record, text, typesOf, unmountGalleries, wait,
} from './file-gallery-support';

const POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;

const click = (node: Element | null) =>
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

describe('file-gallery matrix — file badges', () => {
  afterEach(() => unmountGalleries());

  for (const position of POSITIONS) {
    it(`setFileBadge places a badge ${position}`, async () => {
      const el = await makeGallery(combo());
      el.addFiles([FILES.image()]);
      await wait(30);
      const id = el.files[0].id;

      el.setFileBadge(id, 'New', position);
      await wait(30);
      expect(el.getFile(id)!.badge).toBe('New');
      expect(el.getFile(id)!.badgePosition).toBe(position);

      const badge = itemFor(el, id)!.querySelector('.gallery-item-badge');
      expect(badge, 'no badge rendered').not.toBeNull();
      expect(badge!.classList.contains(`gallery-item-badge--${position}`),
        `badge not placed ${position} (${badge!.className})`).toBe(true);
      expect(text(badge)).toBe('New');
    });
  }

  it('setFileBadge defaults to top-right', async () => {
    const el = await makeGallery(combo());
    el.addFiles([FILES.image()]);
    await wait(30);
    const id = el.files[0].id;
    el.setFileBadge(id, 'New');
    await wait(30);
    expect(el.getFile(id)!.badgePosition).toBe('top-right');
  });

  it('a string badge is rendered as escaped text', async () => {
    const el = await makeGallery(combo());
    el.addFiles([FILES.image()]);
    await wait(30);
    const id = el.files[0].id;
    el.setFileBadge(id, '<img src=x onerror="window.__xss=1">');
    await wait(30);

    const badge = itemFor(el, id)!.querySelector('.gallery-item-badge')!;
    expect(badge.querySelector('img'), 'a string badge was parsed as markup').toBeNull();
    expect(text(badge)).toBe('<img src=x onerror="window.__xss=1">');
    expect((window as any).__xss).toBeUndefined();
  });

  it('an unsafeHTML() badge composes real markup', async () => {
    const el = await makeGallery(combo());
    el.addFiles([FILES.image()]);
    await wait(30);
    const id = el.files[0].id;
    el.setFileBadge(id, unsafeHTML('<span class="trusted-badge">HOT</span>'));
    await wait(30);

    const badge = itemFor(el, id)!.querySelector('.gallery-item-badge')!;
    expect(badge.querySelector('.trusted-badge'), 'unsafeHTML badge was escaped').not.toBeNull();
    expect(text(badge)).toBe('HOT');
  });

  it('removeFileBadge takes the badge away again', async () => {
    const el = await makeGallery(combo());
    el.addFiles([FILES.image()]);
    await wait(30);
    const id = el.files[0].id;
    el.setFileBadge(id, 'New', 'bottom-left');
    await wait(30);
    el.removeFileBadge(id);
    await wait(30);

    expect(el.getFile(id)!.badge).toBeUndefined();
    expect(itemFor(el, id)!.querySelector('.gallery-item-badge')).toBeNull();
  });

  it('badging an unknown file changes nothing', async () => {
    const el = await makeGallery(combo());
    el.addFiles([FILES.image()]);
    await wait(30);
    el.setFileBadge('file-nope', 'New');
    await wait(20);
    expect(el.files[0].badge).toBeUndefined();
  });
});

describe('file-gallery matrix — custom actions', () => {
  afterEach(() => unmountGalleries());

  for (const showAddButton of [false, true]) {
    for (const count of [1, 3]) {
      const c = combo({ showAddButton });
      it(`${count} custom action(s) with show-add-button=${showAddButton}`, async () => {
        const el = await makeGallery(c);
        const ids = Array.from({ length: count }, (_, i) => el.addCustomAction('📷', `Action ${i}`));
        await wait(30);

        expect(el.customActions.map((action: any) => action.id)).toEqual(ids);
        for (const [index, id] of ids.entries()) {
          expect(el.getCustomAction(id)!.text).toBe(`Action ${index}`);
        }
        // Each action renders a tile, alongside the add-files tile when asked for.
        expect(addButtons(el)).toHaveLength(count + (showAddButton ? 1 : 0));
        expectNoProblems(checkChrome(el, c), `${count} actions/add=${showAddButton}`);
      });
    }
  }

  it('addCustomAction returns a distinct id per action', async () => {
    const el = await makeGallery(combo());
    const first = el.addCustomAction('📷', 'Camera');
    const second = el.addCustomAction('🎤', 'Record');
    expect(first).not.toBe(second);
    expect(el.customActions).toHaveLength(2);
  });

  it('a custom action tile shows its icon and text', async () => {
    const el = await makeGallery(combo());
    el.addCustomAction('📷', 'Camera');
    await wait(30);
    const tile = addButtons(el)[0];
    expect(text(tile)).toContain('Camera');
    expect(text(tile)).toContain('📷');
  });

  it('an unsafeHTML() icon composes real markup', async () => {
    const el = await makeGallery(combo());
    el.addCustomAction(unsafeHTML('<svg class="trusted-icon"></svg>'), 'Camera');
    await wait(30);
    expect(addButtons(el)[0].querySelector('.trusted-icon'), 'unsafeHTML icon was escaped')
      .not.toBeNull();
  });

  it('a string icon is rendered as escaped text', async () => {
    const el = await makeGallery(combo());
    el.addCustomAction('<svg class="injected"></svg>', 'Camera');
    await wait(30);
    const tile = addButtons(el)[0];
    expect(tile.querySelector('.injected'), 'a string icon was parsed as markup').toBeNull();
    expect(text(tile)).toContain('<svg class="injected"></svg>');
  });

  it('clicking a custom action reports custom-action-click', async () => {
    const el = await makeGallery(combo());
    const id = el.addCustomAction('📷', 'Camera');
    await wait(30);
    const events = record(el);
    click(addButtons(el)[0]);
    await wait(20);

    const clicks = typesOf(events, 'custom-action-click');
    expect(clicks, 'custom-action-click').toHaveLength(1);
    expect(clicks[0].detail).toEqual({ actionId: id, component: el });
  });

  it('removeCustomAction and clearCustomActions take the tiles away', async () => {
    const el = await makeGallery(combo());
    const first = el.addCustomAction('📷', 'Camera');
    el.addCustomAction('🎤', 'Record');
    await wait(30);

    el.removeCustomAction(first);
    await wait(30);
    expect(el.customActions.map((action: any) => action.text)).toEqual(['Record']);
    expect(addButtons(el)).toHaveLength(1);
    expect(el.getCustomAction(first)).toBeUndefined();

    el.clearCustomActions();
    await wait(30);
    expect(el.customActions).toHaveLength(0);
    expect(addButtons(el)).toHaveLength(0);
  });

  it('the customActions getter hands back a copy', async () => {
    const el = await makeGallery(combo());
    el.addCustomAction('📷', 'Camera');
    const taken = el.customActions;
    taken.push({ id: 'x', icon: 'x', text: 'x' });
    expect(el.customActions).toHaveLength(1);
  });

  it('the files getter hands back a copy', async () => {
    const el = await makeGallery(combo());
    el.addFiles([FILES.text()]);
    await wait(30);
    const taken = el.files;
    taken.pop();
    expect(el.files).toHaveLength(1);
  });
});
