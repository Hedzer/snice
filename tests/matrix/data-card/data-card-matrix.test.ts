/**
 * snice-data-card feature-combination matrix.
 *
 * Dimensions (docs/ai/components/data-card.md + snice-data-card.types.ts):
 *
 *   variant x editable x field shape        3 x 2 x 12 = 72  structural
 *   grouping layout x editable              6 x 2      = 12  grouping
 *   value type x commit path                5 x 3      = 15  edit lifecycle
 *   edit-toggle visibility                              4    toggle
 *   getValues / setValues                                6   value API
 *                                                    ─────────────────
 *                                                       109 combos
 *
 * `variant` is documented as presentation only, so it is crossed against every
 * field shape precisely to assert that it changes NOTHING structural. Its paint
 * is the visual tier's job (tests/live/matrix/data-card/).
 *
 * Sized to the component: a data-card is a field list with five value types,
 * two edit channels and two events. A hundred combos exhaust that surface; the
 * table's thousand would be padding.
 */
import { describe, it, afterEach } from 'vitest';
import {
  Problems, captureEvents, click, cross, expectClean, mount, press, removeComponent, wait,
} from '../matrix-kit';
import {
  FIELD_TYPES, GROUP_LAYOUTS, SHAPES, VARIANTS,
  checkField, checkGroups, checkStructure, datasetFor, editButtonOf, editToggleOf,
  expectedValues, fieldsOf, groupsOf, inputOf, rowFor, saveButtonOf, structuralFinding, typeInto, valueOf,
  type DataCardField, type DataCardFieldType,
} from './data-card-support';
import { exactPartIn } from '../part-exact';
import '../../../packages/components/src/data-card/snice-data-card';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

async function mountCard(
  variant: string,
  editable: boolean,
  fields: DataCardField[],
): Promise<HTMLElement> {
  el = await mount('snice-data-card', { variant, ...(editable ? { editable: true } : {}) }, { fields });
  return el;
}

// ── Structure: variant x editable x field shape ─────────────────────────────

describe('data-card matrix: structure', () => {
  for (const combo of cross({ variant: VARIANTS, editable: [false, true], shape: SHAPES })) {
    const known = structuralFinding(combo.shape, combo.editable);
    const run = known ? it.fails : it;
    run(known ? `${combo.id} — ${known}` : combo.id, async () => {
      const fields = datasetFor(combo.shape);
      const card = await mountCard(combo.variant, combo.editable, fields);
      const problems = new Problems();

      checkStructure(card, fields, combo.editable, problems);
      checkGroups(card, fields, problems);

      expectClean(problems, combo.id);
    });
  }
});

// ── Grouping: every documented layout, in both edit modes ───────────────────

describe('data-card matrix: grouping', () => {
  for (const combo of cross({ layout: GROUP_LAYOUTS, editable: [false, true] })) {
    it(combo.id, async () => {
      const card = await mountCard('default', combo.editable, combo.layout.fields);
      const problems = new Problems();

      checkStructure(card, combo.layout.fields, combo.editable, problems);
      checkGroups(card, combo.layout.fields, problems);
      // The layout's own declared expectation, independent of the derivation —
      // a second opinion on the same promise.
      problems.equal(
        groupsOf(card).map(section => {
          const title = exactPartIn(section, 'group-title');
          return title ? (title.textContent ?? '').trim() : null;
        }),
        combo.layout.groups,
        'group titles in render order',
      );

      expectClean(problems, combo.id);
    });
  }
});

// ── Edit lifecycle: type x commit path ──────────────────────────────────────
//
// Documented: Enter saves, Escape cancels, and the `field-save` part commits.
// Both events carry the documented details.

describe('data-card matrix: edit lifecycle', () => {
  const COMMITS = ['Enter', 'save-button', 'Escape'] as const;

  for (const combo of cross({ type: FIELD_TYPES, commit: COMMITS })) {
    const isLink = combo.type === 'link';
    // MATRIX-data-card-1 again, from the interaction side: with no edit
    // affordance a link field cannot enter edit mode at all.
    const run = isLink ? it.fails : it;
    const title = isLink
      ? `${combo.id} — MATRIX-data-card-1: a type="link" field cannot enter edit mode`
      : combo.id;

    run(title, async () => {
      const fields: DataCardField[] = [
        { label: 'Reference', value: 'REF-001' },
        { label: 'Subject', value: 'before', type: combo.type as DataCardFieldType, href: '/subject' },
        { label: 'Owner', value: 'Ada Lovelace' },
      ];
      const card = await mountCard('default', true, fields);
      const problems = new Problems();
      const changes = captureEvents<{ field: DataCardField; value: string | number; previousValue: string | number }>(card, 'field-change');
      const saves = captureEvents<{ field: DataCardField; value: string | number }>(card, 'field-save');

      const row = rowFor(card, 'Subject');
      if (!problems.check(row !== null, 'no row labelled "Subject"')) {
        expectClean(problems, combo.id);
        return;
      }

      const editButton = editButtonOf(row!);
      if (!problems.check(editButton !== null, 'editable field renders no [part="field-edit"]')) {
        expectClean(problems, combo.id);
        return;
      }
      click(editButton);
      await wait(30);

      const live = rowFor(card, 'Subject')!;
      const input = inputOf(live);
      if (!problems.check(input !== null, 'edit mode renders no [part="field-input"]')) {
        expectClean(problems, combo.id);
        return;
      }
      // The input opens on the field's CURRENT value, not empty.
      problems.equal(input!.value, 'before', 'edit input seed value');
      problems.check(saveButtonOf(live) !== null, 'edit mode renders no [part="field-save"]');
      problems.check(valueOf(live) === null, 'edit mode still renders the read-only value');

      typeInto(input!, 'after');
      if (combo.commit === 'Enter') press(input!, 'Enter');
      else if (combo.commit === 'Escape') press(input!, 'Escape');
      else click(saveButtonOf(live));
      await wait(30);

      const settled = rowFor(card, 'Subject')!;
      problems.check(inputOf(settled) === null, 'the editor is still open after the commit');

      if (combo.commit === 'Escape') {
        // Cancel: the value is untouched and neither event fires.
        problems.equal((card as any).getValues().Subject, 'before', 'Escape reverted value');
        problems.equal(changes.length, 0, 'field-change count after Escape');
        problems.equal(saves.length, 0, 'field-save count after Escape');
      } else {
        problems.equal((card as any).getValues().Subject, 'after', 'committed value');
        problems.equal(changes.length, 1, 'field-change count');
        problems.equal(saves.length, 1, 'field-save count');
        if (changes.length === 1) {
          problems.equal(changes[0].value, 'after', 'field-change value');
          problems.equal(changes[0].previousValue, 'before', 'field-change previousValue');
          problems.equal(changes[0].field.label, 'Subject', 'field-change field label');
        }
        if (saves.length === 1) {
          problems.equal(saves[0].value, 'after', 'field-save value');
          problems.equal(saves[0].field.label, 'Subject', 'field-save field label');
        }
        // The committed value has to be what the row now SHOWS, not just what
        // the property holds.
        checkField(settled, { label: 'Subject', value: 'after', type: combo.type as DataCardFieldType, href: '/subject' }, true, problems);
      }

      // Neighbours never enter edit mode with the subject.
      for (const label of ['Reference', 'Owner']) {
        problems.check(inputOf(rowFor(card, label)!) === null, `${label} entered edit mode too`);
      }

      expectClean(problems, combo.id);
    });
  }

  it('clicking a text value starts edit only when the card is editable', async () => {
    const problems = new Problems();
    const fields: DataCardField[] = [{ label: 'Name', value: 'John Doe' }];
    const card = await mountCard('default', false, fields);

    click(valueOf(rowFor(card, 'Name')!));
    await wait(30);
    problems.check(inputOf(rowFor(card, 'Name')!) === null, 'a read-only card entered edit mode');

    (card as any).editable = true;
    await wait(30);
    click(valueOf(rowFor(card, 'Name')!));
    await wait(30);
    problems.check(inputOf(rowFor(card, 'Name')!) !== null, 'an editable card did not enter edit mode');

    expectClean(problems, 'value-click gating');
  });
});

// ── The edit toggle ─────────────────────────────────────────────────────────

describe('data-card matrix: edit toggle', () => {
  const CASES = [
    { name: 'all-editable', fields: [{ label: 'A', value: '1' }, { label: 'B', value: '2' }], visible: true },
    { name: 'some-locked', fields: [{ label: 'A', value: '1', editable: false }, { label: 'B', value: '2' }], visible: true },
    { name: 'all-locked', fields: [{ label: 'A', value: '1', editable: false }, { label: 'B', value: '2', editable: false }], visible: false },
    { name: 'no-fields', fields: [], visible: false },
  ] as const;

  for (const testCase of CASES) {
    it(testCase.name, async () => {
      const card = await mountCard('default', false, [...testCase.fields] as DataCardField[]);
      const problems = new Problems();

      const toggle = editToggleOf(card);
      if (!problems.check(toggle !== null, 'no [part="edit-toggle"]')) {
        expectClean(problems, testCase.name);
        return;
      }
      const hidden = (toggle!.getAttribute('style') ?? '').includes('display: none');
      problems.equal(!hidden, testCase.visible, 'edit toggle visible');

      if (testCase.visible) {
        // Clicking it flips the documented global edit mode, and the fields the
        // doc says are editable gain their affordance.
        click(toggle);
        await wait(30);
        problems.equal((card as any).editable, true, 'editable after first toggle');
        const expectedAffordances = testCase.fields.filter(f => (f as any).editable !== false).length;
        problems.equal(
          fieldsOf(card).filter(row => editButtonOf(row) !== null).length,
          expectedAffordances,
          'edit affordances after toggling on',
        );
        click(editToggleOf(card));
        await wait(30);
        problems.equal((card as any).editable, false, 'editable after second toggle');
        problems.equal(
          fieldsOf(card).filter(row => editButtonOf(row) !== null).length,
          0,
          'edit affordances after toggling off',
        );
      }

      expectClean(problems, testCase.name);
    });
  }
});

// ── getValues / setValues ───────────────────────────────────────────────────

describe('data-card matrix: value API', () => {
  for (const combo of cross({ shape: [SHAPES[0], SHAPES[3], SHAPES[7]], variant: ['default', 'compact'] })) {
    it(`${combo.id}/getValues`, async () => {
      const fields = datasetFor(combo.shape);
      const card = await mountCard(combo.variant, false, fields);
      const problems = new Problems();

      problems.equal((card as any).getValues(), expectedValues(fields), 'getValues() map');

      // setValues updates BY LABEL, leaves unnamed fields alone, and repaints.
      (card as any).setValues({ [fields[1].label]: 'updated' });
      await wait(30);
      problems.equal(
        (card as any).getValues(),
        { ...expectedValues(fields), [fields[1].label]: 'updated' },
        'getValues() after setValues()',
      );
      problems.equal(
        (valueOf(rowFor(card, fields[1].label)!)?.textContent ?? '').trim(),
        'updated',
        'rendered value after setValues()',
      );
      // An unknown label is a no-op, not a new field.
      (card as any).setValues({ 'Not A Field': 'x' });
      await wait(30);
      problems.equal(fieldsOf(card).length, fields.length, 'field count after an unknown setValues() key');

      expectClean(problems, `${combo.id}/getValues`);
    });
  }
});
