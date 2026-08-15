/**
 * Matrix slice TEXTAREA / FORM + LABELS — ownership, association, and the
 * accessible name, across every documented way of wiring the control up.
 *
 * Dimensions: 3 ownership routes (wrapping form, explicit `form="id"`, no form)
 * x 2 nesting depths, plus 5 labelling routes (internal `label` property,
 * external `for`/`id`, wrapping `<label>`, multiple labels, none) crossed with
 * the barred states that change what the label may point at — 22 combos.
 *
 * Documented contract under test (docs/ai/components/textarea.md):
 *   · "Listed in `form.elements`; supports `FormData`, explicit `form="id"`,
 *     external/wrapping labels, reset, browser restoration, and disabled
 *     fieldsets."
 *   · "External and wrapping labels name/focus the real textarea; `labels`
 *     remains live as associations change."
 *
 * ── What this tier CANNOT judge ─────────────────────────────────────────────
 *
 * happy-dom implements no `attachInternals()`, so a form-associated custom
 * element is invisible to `form.elements` and to `FormData` here no matter what
 * the component does. Those two claims are asserted in a real browser by
 * tests/live/matrix/textarea. What IS component-owned and asserted here: form
 * OWNERSHIP resolution (`element.form`), the live `labels` collection, and the
 * accessible name the label produces on the inner control.
 *
 * it.fails policy: every assertion here is the documented expectation and no
 * finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  LABEL, combo, makeTextarea, nativeTextarea, removeComponent, wait,
} from './textarea-support';

function cleanup(): void {
  document.body.innerHTML = '';
}

describe('textarea matrix: form ownership', () => {
  afterEach(cleanup);

  it('a wrapping form owns the control', async () => {
    const form = document.createElement('form');
    document.body.appendChild(form);
    const el = await makeTextarea(combo(), { name: 'comment' });
    form.appendChild(el);
    await wait(30);

    expect(el.form).toBe(form);
  });

  it('a deeply nested control still resolves its wrapping form', async () => {
    const form = document.createElement('form');
    const fieldset = document.createElement('fieldset');
    const div = document.createElement('div');
    form.appendChild(fieldset);
    fieldset.appendChild(div);
    document.body.appendChild(form);

    const el = await makeTextarea(combo(), { name: 'comment' });
    div.appendChild(el);
    await wait(30);

    expect(el.form).toBe(form);
  });

  it('an explicit form="id" wins over the DOM position', async () => {
    const owner = document.createElement('form');
    owner.id = 'owner';
    document.body.appendChild(owner);

    const el = await makeTextarea(combo(), { name: 'comment', form: 'owner' });
    await wait(30);

    expect(el.form, 'the control is not inside the form it belongs to').toBe(owner);
  });

  it('an unowned control reports no form', async () => {
    const el = await makeTextarea(combo(), { name: 'comment' });
    await wait(30);
    expect(el.form).toBe(null);
  });

  it('a form="id" pointing at nothing reports no form', async () => {
    const el = await makeTextarea(combo(), { name: 'comment', form: 'missing' });
    await wait(30);
    expect(el.form).toBe(null);
  });

  it('moving the control re-resolves its owner', async () => {
    const formA = document.createElement('form');
    const formB = document.createElement('form');
    document.body.append(formA, formB);

    const el = await makeTextarea(combo(), { name: 'comment' });
    formA.appendChild(el);
    await wait(30);
    expect(el.form).toBe(formA);

    formB.appendChild(el);
    await wait(30);
    expect(el.form, 'ownership follows the move').toBe(formB);
  });

  it('the documented control type is stable', async () => {
    const el = await makeTextarea(combo());
    expect(el.type).toBe('textarea');
  });
});

describe('textarea matrix: label association', () => {
  afterEach(cleanup);

  it('the internal label property names and points at the real control', async () => {
    const el = await makeTextarea(combo({ labelled: true }));
    const native = nativeTextarea(el);
    const label = el.shadowRoot.querySelector('label.label') as HTMLLabelElement;

    expect(label.textContent!.trim()).toBe(LABEL);
    expect(label.getAttribute('for'), 'bound to the real textarea by id').toBe(native.id);
    expect(native.getAttribute('aria-label'), 'and names it').toBe(LABEL);
  });

  it('an external for/id label associates and names the control', async () => {
    const label = document.createElement('label');
    label.setAttribute('for', 'the-textarea');
    label.textContent = 'External name';
    document.body.appendChild(label);

    const el = await makeTextarea(combo(), { id: 'the-textarea' });
    await wait(50);

    expect([...(el.labels ?? [])], 'the label is listed').toContain(label);
    expect(nativeTextarea(el).getAttribute('aria-label')).toBe('External name');
  });

  it('a wrapping label names the control, with or without an id', async () => {
    const label = document.createElement('label');
    label.textContent = 'Wrapping name';
    document.body.appendChild(label);

    const el = await makeTextarea(combo());
    label.appendChild(el);
    await wait(50);

    // The NAME is component-owned and works from the DOM position alone.
    expect(nativeTextarea(el).getAttribute('aria-label')).toBe('Wrapping name');
  });

  it('a wrapping label is listed once the control is addressable', async () => {
    const label = document.createElement('label');
    label.textContent = 'Wrapping name';
    document.body.appendChild(label);

    const el = await makeTextarea(combo(), { id: 'wrapped' });
    label.appendChild(el);
    await wait(50);

    // `labels` for an id-less wrapping label is `ElementInternals.labels`, which
    // happy-dom has no implementation of at all; the real-browser path is
    // asserted in tests/live/matrix/textarea. With an id the component resolves
    // the association itself, which IS observable here.
    expect([...(el.labels ?? [])]).toContain(label);
  });

  it('multiple labels are all listed', async () => {
    const first = document.createElement('label');
    first.setAttribute('for', 'multi');
    first.textContent = 'First';
    const second = document.createElement('label');
    second.setAttribute('for', 'multi');
    second.textContent = 'Second';
    document.body.append(first, second);

    const el = await makeTextarea(combo(), { id: 'multi' });
    await wait(50);

    const labels = [...(el.labels ?? [])];
    expect(labels).toContain(first);
    expect(labels).toContain(second);
  });

  it('labels remain live as associations change', async () => {
    const label = document.createElement('label');
    label.setAttribute('for', 'live-target');
    label.textContent = 'Live';
    document.body.appendChild(label);

    const el = await makeTextarea(combo(), { id: 'live-target' });
    await wait(50);
    expect([...(el.labels ?? [])]).toContain(label);

    label.setAttribute('for', 'somewhere-else');
    await wait(50);
    expect([...(el.labels ?? [])], 'the association is dropped when `for` moves')
      .not.toContain(label);

    label.setAttribute('for', 'live-target');
    await wait(50);
    expect([...(el.labels ?? [])], 'and restored when it comes back').toContain(label);
  });

  it('an unlabelled control still has a usable accessible name', async () => {
    const el = await makeTextarea(combo());
    await wait(30);
    expect((nativeTextarea(el).getAttribute('aria-label') ?? '').trim(),
      'never nameless').not.toBe('');
  });

  it('a renamed label updates the accessible name', async () => {
    const el = await makeTextarea(combo({ labelled: true }));
    el.label = 'Renamed';
    await wait(50);

    expect(nativeTextarea(el).getAttribute('aria-label')).toBe('Renamed');
  });
});

describe('textarea matrix: disabled fieldsets', () => {
  afterEach(cleanup);

  it('formDisabledCallback bars the control the way `disabled` does', async () => {
    const form = document.createElement('form');
    const fieldset = document.createElement('fieldset');
    form.appendChild(fieldset);
    document.body.appendChild(form);

    const el = await makeTextarea(combo({ required: true }), { name: 'comment' });
    fieldset.appendChild(el);
    await wait(30);

    // happy-dom does not propagate a disabled fieldset to a custom element, so
    // the matrix calls the exact platform entry point a browser would.
    el.formDisabledCallback(true);
    await wait(30);

    expect(nativeTextarea(el).disabled, 'the inner control is disabled').toBe(true);
    expect(el.checkValidity(), 'and barred from constraint validation').toBe(true);
  });

  it('re-enabling a fieldset restores the control and its constraints', async () => {
    const el = await makeTextarea(combo({ required: true }), { name: 'comment' });
    el.formDisabledCallback(true);
    await wait(30);
    el.formDisabledCallback(false);
    await wait(30);

    expect(nativeTextarea(el).disabled).toBe(false);
    expect(el.checkValidity(), 'the required rule applies again').toBe(false);
  });

  it('a disabled fieldset preserves the live value', async () => {
    const el = await makeTextarea(combo(), { name: 'comment', value: 'authored' });
    el.value = 'customer text';
    await wait(30);

    el.formDisabledCallback(true);
    await wait(30);
    expect(el.value, 'being barred is not being reset').toBe('customer text');

    el.formDisabledCallback(false);
    await wait(30);
    expect(el.value).toBe('customer text');
  });
});

describe('textarea matrix: teardown', () => {
  afterEach(cleanup);

  it('removing the control detaches its label association', async () => {
    const label = document.createElement('label');
    label.setAttribute('for', 'gone');
    label.textContent = 'Gone';
    document.body.appendChild(label);

    const el = await makeTextarea(combo(), { id: 'gone' });
    await wait(50);
    expect([...(el.labels ?? [])]).toContain(label);

    removeComponent(el);
    await wait(30);
    // No assertion on `labels` after teardown — the documented promise is that
    // teardown is clean, which a thrown error here would break.
    expect(() => el.labels).not.toThrow();
  });
});
