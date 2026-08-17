/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-file-upload TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/file-upload, `npm run test:matrix`) owns the
 * selection pipeline: which files survive `max-size` and `max-files`, what the
 * two events carry, what the parts render, and how the presentational flags
 * behave. It structurally cannot own the HALF OF THIS COMPONENT'S DOCUMENTATION
 * that is form association — "Form-associated custom element. Works with native
 * `<form>` and `FormData`", the reset/restore lifecycle, disabled fieldsets,
 * and the barring rules — because happy-dom implements no `ElementInternals` at
 * all, and the component silently falls back to the native input it renders.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the drop zone really fills its host and really is the element under the
 *     pointer, so a drop can land on it;
 *   · the native input is really hidden behind the styled zone rather than
 *     painted twice;
 *   · a chosen file's entry really has a box, inside the control, not
 *     overlapping the description text;
 *   · `size` and `variant` really change the painted box.
 *
 * ── Layer 1b: the form contract the DOM tier cannot reach ──────────────────
 *   Real `<form>`, real `FormData`, real `reset()`, real disabled fieldsets.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   An image preview that "has an <img>" and an image preview that PAINTED are
 *   different claims; so are "the invalid class is on the box" and "the box
 *   looks different".
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/file-upload/matrix.html';

const KB = 1024;

interface Combo {
  id: string;
  size: 'small' | 'medium' | 'large';
  variant: 'outlined' | 'filled';
  multiple: boolean;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  label: string;
  helperText: string;
  errorText: string;
  showPreview: boolean;
  name: string;
  stageWidth: number;
  files: Array<{ name: string; bytes: number; type?: string }>;
}

const FILE_SETS: Array<Array<{ name: string; bytes: number; type?: string }>> = [
  [],
  [{ name: 'notes.txt', bytes: 32 }],
  [
    { name: 'notes.txt', bytes: 32 },
    { name: 'report.pdf', bytes: 64, type: 'application/pdf' },
    { name: 'archive.zip', bytes: 128, type: 'application/zip' },
  ],
];

/**
 * The cross: `size` (3) x `variant` (2) x selection (3) x `disabled` (2) = 36
 * combos, with `multiple`, `required`, `invalid`, the description text and the
 * stage width rotated across them.
 */
function generateCombos(): Combo[] {
  const widths = [360, 560, 800];
  const combos: Combo[] = [];
  let n = 0;
  for (const size of ['small', 'medium', 'large'] as const) {
    for (const variant of ['outlined', 'filled'] as const) {
      for (const files of FILE_SETS) {
        for (const disabled of [false, true]) {
          combos.push({
            id: `size=${size}/variant=${variant}/files=${files.length}/disabled=${disabled}`
              + `/[width=${widths[n % 3]}]`,
            size, variant, disabled, files,
            multiple: files.length > 1 || n % 2 === 0,
            required: n % 3 === 0,
            invalid: n % 4 === 0,
            label: n % 2 === 0 ? 'Attachments' : '',
            helperText: n % 3 === 1 ? 'PNG or JPG, up to 5MB' : '',
            errorText: n % 5 === 0 ? 'That did not work' : '',
            showPreview: true,
            name: 'attachment',
            stageWidth: widths[n % 3],
          });
          n++;
        }
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const pick = (name: string) => [...sr.querySelectorAll('[part]')]
      .find(n => (n.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement | undefined;

    const area = pick('upload-area');
    const input = pick('input');
    if (!area || !input) { say('a documented part is missing'); return problems; }

    const hostBox = host.getBoundingClientRect();
    const areaBox = area.getBoundingClientRect();

    if (getComputedStyle(host).visibility !== 'visible') say('host is not visible');
    if (areaBox.width < 1 || areaBox.height < 1) {
      say(`the drop zone is ${areaBox.width}x${areaBox.height}`);
      return problems;
    }

    // ── The drop zone fills the control ──────────────────────────────────
    if (areaBox.width < hostBox.width - 4) {
      say(`the drop zone is ${areaBox.width.toFixed(1)}px wide inside a`
        + ` ${hostBox.width.toFixed(1)}px control`);
    }
    if (areaBox.left < hostBox.left - EPS || areaBox.right > hostBox.right + EPS) {
      say('the drop zone overflows its own control horizontally');
    }

    // ── The native input is hidden behind the styled zone ────────────────
    // The doc's parts list gives the input its own name so it can be reached,
    // but a file input painted next to a styled drop zone is two controls
    // where the doc describes one.
    const inputStyle = getComputedStyle(input);
    const inputBox = input.getBoundingClientRect();
    const hiddenSomehow = inputStyle.opacity === '0'
      || inputStyle.visibility === 'hidden'
      || inputStyle.display === 'none'
      || inputStyle.clip !== 'auto'
      || inputBox.width < 2 || inputBox.height < 2;
    if (!hiddenSomehow) {
      say(`the native file input is painted at ${inputBox.width.toFixed(1)}x`
        + `${inputBox.height.toFixed(1)} with opacity ${inputStyle.opacity} —`
        + ' the styled drop zone is the documented surface');
    }

    // ── The drop zone is what a pointer hits ─────────────────────────────
    // A drop zone the pointer cannot reach cannot receive a drop, whatever its
    // listeners say.
    const probe = { x: areaBox.left + areaBox.width / 2, y: areaBox.top + 6 };
    if (probe.y >= 0 && probe.y <= window.innerHeight && probe.x <= window.innerWidth) {
      const hit = document.elementFromPoint(probe.x, probe.y);
      if (hit !== host && !host.contains(hit)) {
        say(`the drop zone hit-tests as <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    // ── Every chosen file has a real, non-overlapping entry ──────────────
    const items = [...sr.querySelectorAll('[part="file-item"]')] as HTMLElement[];
    if (items.length !== combo.files.length) {
      say(`${items.length} file entries for ${combo.files.length} chosen files`);
    }
    const itemBoxes = items.map(item => item.getBoundingClientRect());
    itemBoxes.forEach((box, i) => {
      if (box.width < 1 || box.height < 1) say(`file entry ${i} has no box`);
      if (box.left < hostBox.left - EPS || box.right > hostBox.right + EPS) {
        say(`file entry ${i} overflows the control`);
      }
      // The file name must be readable, not clipped to nothing.
      const name = items[i].querySelector('.file-name') as HTMLElement | null;
      if (!name || name.getBoundingClientRect().width < 1) {
        say(`file entry ${i} shows no readable file name`);
      }
    });
    for (let i = 1; i < itemBoxes.length; i++) {
      if (itemBoxes[i].top < itemBoxes[i - 1].bottom - EPS) {
        say(`file entries ${i - 1} and ${i} overlap`);
      }
    }

    // ── The description sits below everything it describes ──────────────
    const description = pick('error-text') ?? pick('helper-text');
    if (description) {
      const box = description.getBoundingClientRect();
      const last = itemBoxes[itemBoxes.length - 1] ?? areaBox;
      if (box.top < last.bottom - EPS) {
        say('the helper/error text overlaps the control it describes');
      }
    }

    // ── `size` and `variant` are real ───────────────────────────────────
    // Recorded rather than compared here: the cross-size comparison needs two
    // mounts and lives in its own test below. What this checks is that the zone
    // has a sane painted box at every size.
    if (areaBox.height < 24) {
      say(`the ${combo.size} drop zone is only ${areaBox.height.toFixed(1)}px tall`);
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('file-upload visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.size).toBe(combo.size);
      expect(mounted.type).toBe('file');
      if (combo.files.length) {
        // A disabled control refuses a choice, so the files go on first.
        if (combo.disabled) {
          await page.evaluate(() => { (document.getElementById('subject') as any).disabled = false; });
        }
        await page.evaluate(f => (window as any).matrix.choose(f), combo.files as any);
        if (combo.disabled) {
          await page.evaluate(() => { (document.getElementById('subject') as any).disabled = true; });
          await page.waitForTimeout(40);
        }
      }
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('file-upload visual matrix: size and variant really change the box', () => {
  const boxFor = async (size: string, variant: string) => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      size, variant, stageWidth: 560, name: 'attachment',
    } as any);
    return page.evaluate(() => (window as any).matrix.boxes());
  };

  test('a large drop zone is taller than a small one', async () => {
    const small = await boxFor('small', 'outlined');
    const medium = await boxFor('medium', 'outlined');
    const large = await boxFor('large', 'outlined');
    expect(medium.area.height, `small ${small.area.height}, medium ${medium.area.height}`)
      .toBeGreaterThan(small.area.height);
    expect(large.area.height, `medium ${medium.area.height}, large ${large.area.height}`)
      .toBeGreaterThan(medium.area.height);
  });
});

// ── LAYER 1b: the form contract ─────────────────────────────────────────────
//
// "Form-associated custom element. Works with native `<form>` and `FormData`."
// Everything below is documented in the doc's "Form lifecycle" block and is
// unreachable from happy-dom, which implements no ElementInternals.

test.describe('file-upload visual matrix: form participation', () => {
  const mountInForm = async (extra: Record<string, unknown> = {}) => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      inForm: true, name: 'attachment', stageWidth: 560, size: 'medium',
      variant: 'outlined', ...extra,
    } as any);
  };

  test('an empty selection submits nothing', async () => {
    // Documented: "empty selection submits nothing".
    await mountInForm();
    expect(await page.evaluate(() => (window as any).matrix.formEntries())).toEqual([]);
  });

  test('one file submits one entry under its name', async () => {
    await mountInForm();
    await page.evaluate(() => (window as any).matrix.choose([{ name: 'a.txt', bytes: 8 }]));
    const entries = await page.evaluate(() => (window as any).matrix.formEntries());
    expect(entries).toEqual([{ name: 'attachment', file: 'a.txt', text: null }]);
  });

  test('multiple files submit as repeated entries under the same name', async () => {
    // Documented: "Multiple files submit as repeated entries under `name`".
    await mountInForm({ multiple: true });
    await page.evaluate(() => (window as any).matrix.choose([
      { name: 'a.txt', bytes: 8 }, { name: 'b.txt', bytes: 8 }, { name: 'c.txt', bytes: 8 },
    ]));
    const entries = await page.evaluate(() => (window as any).matrix.formEntries());
    expect(entries).toEqual([
      { name: 'attachment', file: 'a.txt', text: null },
      { name: 'attachment', file: 'b.txt', text: null },
      { name: 'attachment', file: 'c.txt', text: null },
    ]);
  });

  test('a disabled control is omitted from the form', async () => {
    // Documented: "Disabled controls are omitted and barred."
    await mountInForm({ multiple: true });
    await page.evaluate(() => (window as any).matrix.choose([{ name: 'a.txt', bytes: 8 }]));
    expect(await page.evaluate(() => (window as any).matrix.formEntries())).toHaveLength(1);

    await page.evaluate(() => { (document.getElementById('subject') as any).disabled = true; });
    await page.waitForTimeout(60);

    expect(await page.evaluate(() => (window as any).matrix.formEntries()),
      'a disabled upload still contributed a form entry').toEqual([]);
    const validity = await page.evaluate(() => (window as any).matrix.validity());
    expect(validity.willValidate, 'a disabled upload still validates').toBe(false);
  });

  test('a control with no name contributes nothing', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      inForm: true, name: '', stageWidth: 560,
    } as any);
    await page.evaluate(() => (window as any).matrix.choose([{ name: 'a.txt', bytes: 8 }]));
    const entries = await page.evaluate(() => (window as any).matrix.formEntries());
    expect(entries.filter((e: any) => e.name === 'attachment')).toEqual([]);
  });

  test('form reset silently clears the selection', async () => {
    // Documented: "Reset silently clears files, previews, and form value".
    await mountInForm({ multiple: true });
    await page.evaluate(() => (window as any).matrix.choose([
      { name: 'a.txt', bytes: 8 }, { name: 'b.png', bytes: 8, type: 'image/png' },
    ]));
    expect(await page.evaluate(() => (window as any).matrix.boxes())).toMatchObject({
      items: [expect.anything(), expect.anything()],
    });

    let changes = 0;
    await page.exposeFunction('__countChange', () => { changes++; }).catch(() => {});
    await page.evaluate(() => {
      document.getElementById('subject')!
        .addEventListener('file-upload-change', () => (window as any).__countChange());
    });

    await page.evaluate(() => (window as any).matrix.resetForm());
    await page.waitForTimeout(80);

    const after = await page.evaluate(() => (window as any).matrix.boxes());
    expect(after.items, 'reset left file entries behind').toEqual([]);
    expect(after.previews, 'reset left an image preview behind').toBe(0);
    expect(await page.evaluate(() => (window as any).matrix.formEntries()),
      'reset left a form value behind').toEqual([]);
    expect(changes, 'reset is documented as silent but emitted file-upload-change').toBe(0);
  });

  test('a disabled fieldset bars the control without rewriting `disabled`', async () => {
    // Documented: "Disabled fieldsets make choose/drop/remove paths inert
    // without rewriting authored `disabled`."
    await page.evaluate(c => (window as any).matrix.mount(c), {
      inForm: true, inFieldset: true, name: 'attachment', multiple: true, stageWidth: 560,
    } as any);
    await page.evaluate(() => (window as any).matrix.choose([{ name: 'a.txt', bytes: 8 }]));

    await page.evaluate(() => (window as any).matrix.setFieldsetDisabled(true));
    await page.waitForTimeout(60);

    const state = await page.evaluate(() => ({
      authored: (document.getElementById('subject') as any).disabled,
      validity: (window as any).matrix.validity(),
      entries: (window as any).matrix.formEntries(),
      dropped: null,
    }));
    expect(state.authored, 'the fieldset rewrote the authored `disabled`').toBe(false);
    expect(state.validity.willValidate, 'a fieldset-disabled upload still validates').toBe(false);
    expect(state.entries, 'a fieldset-disabled upload still contributed a form entry').toEqual([]);

    // "…make choose/drop/remove paths inert".
    const afterDrop = await page.evaluate(() =>
      (window as any).matrix.drop([{ name: 'sneaky.txt', bytes: 8 }]));
    expect(afterDrop, 'a drop landed on a fieldset-disabled upload').toEqual(['a.txt']);
  });

  test('an empty required selection reports valueMissing and blocks submission', async () => {
    // Documented: "Empty `required` selection reports `valueMissing`."
    await mountInForm({ required: true });
    const empty = await page.evaluate(() => (window as any).matrix.validity());
    expect(empty.valueMissing).toBe(true);
    expect(empty.valid).toBe(false);
    expect(empty.willValidate).toBe(true);
    expect(empty.validationMessage, 'no message to show the user').not.toBe('');

    await page.evaluate(() => (window as any).matrix.choose([{ name: 'a.txt', bytes: 8 }]));
    const filled = await page.evaluate(() => (window as any).matrix.validity());
    expect(filled.valueMissing).toBe(false);
    expect(filled.valid).toBe(true);
  });

  test('a disabled required control with nothing chosen is barred, not invalid', async () => {
    // The claim the DOM tier cannot make: happy-dom reports `valueMissing` on a
    // disabled required input, where a real engine bars it from validation
    // entirely. "Disabled controls are omitted and barred."
    await mountInForm({ required: true, disabled: true });
    const validity = await page.evaluate(() => (window as any).matrix.validity());
    expect(validity.willValidate).toBe(false);
    expect(validity.valid, 'a barred control reported itself invalid').toBe(true);
    expect(validity.valueMissing, 'a barred control reported valueMissing').toBe(false);
  });
});

test.describe('file-upload visual matrix: dropping files', () => {
  test('a drop on the zone selects the dropped files', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      name: 'attachment', multiple: true, stageWidth: 560,
    } as any);
    const names = await page.evaluate(() => (window as any).matrix.drop([
      { name: 'dropped-a.txt', bytes: 8 }, { name: 'dropped-b.txt', bytes: 8 },
    ]));
    expect(names).toEqual(['dropped-a.txt', 'dropped-b.txt']);
  });

  test('drag-drop off makes the zone refuse a drop', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      name: 'attachment', multiple: true, dragDrop: false, stageWidth: 560,
    } as any);
    const names = await page.evaluate(() => (window as any).matrix.drop([
      { name: 'dropped.txt', bytes: 8 },
    ]));
    expect(names, 'a drop landed on a zone with drag-drop off').toEqual([]);
  });

  test('a disabled zone refuses a drop', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      name: 'attachment', multiple: true, disabled: true, stageWidth: 560,
    } as any);
    const names = await page.evaluate(() => (window as any).matrix.drop([
      { name: 'dropped.txt', bytes: 8 },
    ]));
    expect(names, 'a drop landed on a disabled zone').toEqual([]);
  });

  test('max-size still applies to a dropped file', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      name: 'attachment', multiple: true, maxSize: 1 * 1024, stageWidth: 560,
    } as any);
    const names = await page.evaluate(() => (window as any).matrix.drop([
      { name: 'small.txt', bytes: 16 }, { name: 'huge.bin', bytes: 8 * 1024 },
    ]));
    expect(names).toEqual(['small.txt']);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('file-upload visual matrix: marquee pixels', () => {
  test('an image preview really decodes and paints a thumbnail', async () => {
    // The DOM tier can only see that an `<img>` exists with a blob: URL. Only a
    // browser can say whether that URL decoded into pixels.
    await page.evaluate(c => (window as any).matrix.mount(c), {
      name: 'attachment', stageWidth: 560, showPreview: true,
    } as any);
    // A real 2x2 PNG, so the decode has something to decode. Well-formed on
    // purpose: the first bytes tried here failed the IDAT CRC, which Chromium
    // and WebKit decode anyway while Firefox fires `error` and decodes
    // nothing — an engine-lenience lottery, not a decode test. The decode is
    // asynchronous and untimed — Firefox routinely needs longer than one
    // 60ms nap — so poll the image instead of sampling it once.
    await page.evaluate(async () => {
      const png = Uint8Array.from(atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAE0lEQVR4AWP8z8DwnwEImBigAAAfFwICgH3ifwAAAABJRU5ErkJggg=='), c => c.charCodeAt(0));
      const el = document.getElementById('subject') as any;
      const input = el.shadowRoot.querySelector('input[type="file"]');
      const transfer = new DataTransfer();
      transfer.items.add(new File([png], 'pixel.png', { type: 'image/png' }));
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const deadline = performance.now() + 4000;
      while (performance.now() < deadline) {
        const img = el.shadowRoot.querySelector('img');
        if (img && img.complete && img.naturalWidth > 0) return;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    });

    const decoded = await page.evaluate(() => (window as any).matrix.previewDecoded());
    expect(decoded, 'showPreview rendered no <img> for an image file').not.toBeNull();
    expect(decoded!.src, 'the preview is not a blob URL').toBe('blob:');
    expect(decoded!.complete, 'the preview never finished loading').toBe(true);
    expect(decoded!.width, 'the preview decoded to a zero-width bitmap').toBeGreaterThan(0);
  });

  test('the invalid state really repaints the drop zone', async () => {
    const shot = async (invalid: boolean) => {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        name: 'attachment', stageWidth: 560, size: 'large', invalid,
      } as any);
      // Probe the drop zone's border, which is what the invalid state changes.
      // The border is 2px DASHED, so a single centre-x probe lands on a dash
      // or in a gap depending on each engine's dash phase — walk the top
      // border row and the whole edge speaks.
      return capture(
        page, '#subject', `file-upload-${invalid ? 'invalid' : 'valid'}`,
        `(host) => {
          const area = host.shadowRoot.querySelector('[part="upload-area"]').getBoundingClientRect();
          const points = [];
          for (let x = 2; x < area.width - 2; x += 3) {
            points.push({ x: area.x + x, y: area.y + 1 });
          }
          return points;
        }`,
      );
    };

    const valid = await shot(false);
    const invalid = await shot(true);
    expect(valid.length, 'the drop zone is too small to walk').toBeGreaterThan(4);
    const differs = (invalid as RGB[]).some((p, i) => !sameColor(p, valid[i] as RGB));
    expect(differs,
      `the invalid drop zone painted rgb(${invalid[0].join(',')} everywhere the valid one did`)
      .toBe(true);
  });

  test('the filled variant really paints a different surface', async () => {
    const shot = async (variant: 'outlined' | 'filled') => {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        name: 'attachment', stageWidth: 560, size: 'large', variant,
      } as any);
      const [surface] = await capture(
        page, '#subject', `file-upload-${variant}`,
        `(host) => {
          const area = host.shadowRoot.querySelector('[part="upload-area"]').getBoundingClientRect();
          return [{ x: area.x + 8, y: area.y + area.height - 8 }];
        }`,
      );
      return surface;
    };

    const outlined = await shot('outlined');
    const filled = await shot('filled');
    expect(sameColor(outlined, filled),
      `the filled variant painted rgb(${filled.join(',')}), the same as outlined`).toBe(false);
  });
});
