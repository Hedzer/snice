/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-recipe TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/recipe, `npm run test:matrix`) owns value truth:
 * which regions render, how amounts scale with `setServings`, which events the
 * checkboxes and step toggles emit, what `reset()` undoes. What it cannot own
 * is the documented difference between the component's two variants —
 *
 *     variant: 'card' | 'full'
 *
 * — because in the DOM both emit the identical region order and only a browser
 * resolves `grid-template-columns: 1fr 2fr` into "ingredients BESIDE steps"
 * versus the card's single column. The same goes for every documented part:
 * `hero`, `meta`, `nutrition` and `controls` are claims about a visible panel,
 * and a panel can exist in the shadow root at zero height.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · every documented part that the combo asks for has a real, visible box,
 *     and every part it does not ask for is absent rather than collapsed;
 *   · the regions stack downward — hero, header, meta, content, controls —
 *     without overlapping, each contained by `[part="container"]`;
 *   · `full` lays ingredients and steps side by side; `card` stacks them;
 *   · ingredient rows and step rows descend inside their own sections and stay
 *     inside them, and a row's checkbox never sits on its text;
 *   · nothing escapes the 900px stage, however long the strings are.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   "A checked ingredient looks checked" and "a completed step looks completed"
 *   are pixel claims: the `--checked` / `--completed` classes can apply
 *   perfectly while painting a colour nobody can see. Decoded in-browser.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/recipe/matrix.html';

type Variant = 'card' | 'full';
type Shape = 'both' | 'ingredients-only' | 'steps-only' | 'neither';

const HERO = 'data:image/svg+xml;utf8,'
  + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">'
    + '<rect width="16" height="16" fill="#166534"/></svg>');
const HERO_RGB: RGB = [22, 101, 52];

const INGREDIENTS = [
  { name: 'Spaghetti', amount: 400, unit: 'g' },
  { name: 'Pancetta', amount: 200, unit: 'g' },
  { name: 'Eggs', amount: 4, unit: '', group: 'Sauce' },
  { name: 'Parmesan', amount: 100, unit: 'g', group: 'Sauce' },
];
const STEPS = [
  { text: 'Boil pasta in salted water.', time: 10 },
  { text: 'Fry pancetta until crispy.', tip: 'Use medium heat.' },
  { text: 'Mix eggs and parmesan.' },
  { text: 'Combine all ingredients off heat.' },
];
const NUTRITION = { calories: 650, protein: 28, carbs: 72, fat: 24 };

interface Combo {
  id: string;
  variant: Variant;
  shape: Shape;
  hasNutrition: boolean;
  hasHero: boolean;
  title: string;
  description: string;
  author: string;
  cuisine: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number;
  cookTime: number;
  servings: number;
  image: string;
  ingredients: typeof INGREDIENTS;
  steps: typeof STEPS;
  nutrition: typeof NUTRITION | null;
  tags: string[];
}

/**
 * variant (2) x shape (4) x nutrition (2) x hero (2) = 32 combos.
 *
 * `shape` is the axis that decides which halves of `[part="content"]` exist —
 * and therefore whether "side by side" is even a question; `nutrition` and
 * `hero` switch the two optional documented parts on and off. Sized to a
 * component with nine documented parts and one layout switch: the point is
 * that each part is really painted in each layout, not that the product is big.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of ['full', 'card'] as Variant[]) {
    for (const shape of ['both', 'ingredients-only', 'steps-only', 'neither'] as Shape[]) {
      for (const hasNutrition of [true, false]) {
        for (const hasHero of [true, false]) {
          combos.push({
            id: `${variant}/${shape}/nutrition=${hasNutrition}/hero=${hasHero}`,
            variant, shape, hasNutrition, hasHero,
            title: 'Pasta Carbonara',
            description: 'A Roman classic built from very few ingredients.',
            author: 'Nonna',
            cuisine: 'Italian',
            difficulty: 'medium',
            prepTime: 10,
            cookTime: 20,
            servings: 4,
            image: hasHero ? HERO : '',
            ingredients: shape === 'both' || shape === 'ingredients-only' ? INGREDIENTS : [],
            steps: shape === 'both' || shape === 'steps-only' ? STEPS : [],
            nutrition: hasNutrition ? NUTRITION : null,
            tags: ['Quick', 'Weeknight'],
          });
        }
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** LAYER 1. One evaluate per combo, returning every violation at once. */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partOf = (name: string) => sr.querySelector(`[part="${name}"]`) as HTMLElement | null;
    const hostBox = rect(host);

    const container = partOf('container');
    if (!container) { say('no [part="container"]'); return problems; }
    const containerBox = rect(container);

    const within = (inner: DOMRect, outer: DOMRect, what: string, of: string) => {
      if (inner.left < outer.left - 1 || inner.right > outer.right + 1
        || inner.top < outer.top - 1 || inner.bottom > outer.bottom + 1) {
        say(`${what} (${inner.left.toFixed(0)},${inner.top.toFixed(0)}`
          + `,${inner.right.toFixed(0)},${inner.bottom.toFixed(0)}) escapes ${of}`
          + ` (${outer.left.toFixed(0)},${outer.top.toFixed(0)}`
          + `,${outer.right.toFixed(0)},${outer.bottom.toFixed(0)})`);
      }
    };

    // ── Which documented parts this combo has asked for ─────────────────────
    const hasContent = combo.shape !== 'neither';
    const expected: Record<string, boolean> = {
      container: true,
      hero: combo.hasHero,
      header: true,
      meta: true,
      content: hasContent,
      ingredients: combo.shape === 'both' || combo.shape === 'ingredients-only',
      steps: combo.shape === 'both' || combo.shape === 'steps-only',
      nutrition: combo.hasNutrition,
      // The controls strip is the step-by-step/print/reset bar the docs
      // describe as "bottom control buttons"; the DOM oracle already ties it to
      // the presence of steps, and this tier keeps the same contract rather
      // than inventing a stricter one the documentation does not state.
      controls: combo.shape === 'both' || combo.shape === 'steps-only',
    };

    for (const [name, wanted] of Object.entries(expected)) {
      const node = partOf(name);
      if (!wanted) {
        if (node && rect(node).height > 0) {
          say(`[part="${name}"] is painted ${rect(node).height.toFixed(1)}px tall`
            + ' for a combo that does not include it');
        }
        continue;
      }
      if (!node) { say(`no [part="${name}"]`); continue; }
      const b = rect(node);
      const cs = getComputedStyle(node);
      if (b.width <= 0 || b.height <= 0) say(`[part="${name}"] renders at ${b.width}x${b.height}`);
      if (cs.visibility !== 'visible') say(`[part="${name}"] visibility "${cs.visibility}"`);
      if (Number(cs.opacity) <= 0) say(`[part="${name}"] opacity "${cs.opacity}"`);
      if (name !== 'container') within(b, containerBox, `[part="${name}"]`, '[part="container"]');
    }
    within(containerBox, hostBox, '[part="container"]', 'the host');

    // ── The regions stack downward, in documented reading order ─────────────
    const order = ['hero', 'header', 'meta', 'content', 'controls']
      .filter(name => expected[name])
      .map(name => [name, partOf(name)] as [string, HTMLElement | null])
      .filter(([, node]) => node) as [string, HTMLElement][];
    for (let i = 1; i < order.length; i++) {
      const [aboveName, aboveNode] = order[i - 1];
      const [belowName, belowNode] = order[i];
      const above = rect(aboveNode);
      const below = rect(belowNode);
      if (below.top < above.bottom - 1) {
        say(`[part="${belowName}"] (top ${below.top.toFixed(1)}) overlaps`
          + ` [part="${aboveName}"] (bottom ${above.bottom.toFixed(1)})`);
      }
    }

    // ── The variant is a claim about the content grid ───────────────────────
    const ingredients = partOf('ingredients');
    const steps = partOf('steps');
    if (combo.shape === 'both' && ingredients && steps) {
      const ib = rect(ingredients);
      const sb = rect(steps);
      if (combo.variant === 'full') {
        if (!(ib.right <= sb.left + 1)) {
          say(`full: ingredients right ${ib.right.toFixed(1)} is not left of`
            + ` steps left ${sb.left.toFixed(1)} — the two-column grid did not apply`);
        }
      } else if (!(ib.bottom <= sb.top + 1)) {
        say(`card: ingredients bottom ${ib.bottom.toFixed(1)} is not above`
          + ` steps top ${sb.top.toFixed(1)} — the card stacks its sections`);
      }
    }

    // ── Rows descend inside their own section and never leave it ────────────
    const rowsIn = (section: HTMLElement | null, selector: string, label: string) => {
      if (!section) return;
      const rows = [...section.querySelectorAll(selector)] as HTMLElement[];
      const sectionBox = rect(section);
      for (const [i, row] of rows.entries()) {
        const b = rect(row);
        if (b.width <= 0 || b.height <= 0) say(`${label} ${i} renders at ${b.width}x${b.height}`);
        within(b, sectionBox, `${label} ${i}`, `[part="${label.split(' ')[0]}s"]`);
        if (i > 0) {
          const above = rect(rows[i - 1]);
          if (b.top < above.bottom - 1) {
            say(`${label} ${i} (top ${b.top.toFixed(1)}) overlaps ${label} ${i - 1}`
              + ` (bottom ${above.bottom.toFixed(1)})`);
          }
        }
      }
    };
    rowsIn(ingredients, '.recipe__ingredient', 'ingredient');
    rowsIn(steps, '.recipe__step', 'step');

    // ── An ingredient's checkbox does not sit on its text ───────────────────
    const firstIngredient = sr.querySelector('.recipe__ingredient') as HTMLElement | null;
    if (firstIngredient) {
      const box = firstIngredient.querySelector('.recipe__ingredient-checkbox') as HTMLElement | null;
      const label = firstIngredient.querySelector('.recipe__ingredient-text') as HTMLElement | null;
      if (!box) say('an ingredient row has no checkbox');
      if (box && label) {
        const cb = rect(box);
        const lb = rect(label);
        if (cb.width <= 0 || cb.height <= 0) say(`ingredient checkbox renders at ${cb.width}x${cb.height}`);
        if (!(cb.right <= lb.left + 1)) {
          say(`ingredient checkbox right ${cb.right.toFixed(1)} overlaps its text`
            + ` left ${lb.left.toFixed(1)}`);
        }
      }
    }

    // ── A step's number does not sit on its body ────────────────────────────
    const firstStep = sr.querySelector('.recipe__step') as HTMLElement | null;
    if (firstStep) {
      const number = firstStep.querySelector('.recipe__step-number') as HTMLElement | null;
      const body = firstStep.querySelector('.recipe__step-body') as HTMLElement | null;
      if (number && body) {
        const nb = rect(number);
        const bb = rect(body);
        if (nb.width <= 0 || nb.height <= 0) say(`step number renders at ${nb.width}x${nb.height}`);
        if (!(nb.right <= bb.left + 1)) {
          say(`step number right ${nb.right.toFixed(1)} overlaps its body left ${bb.left.toFixed(1)}`);
        }
      }
    }

    // ── The recipe fits the stage it was given ──────────────────────────────
    if (Math.round(hostBox.width) !== 900) {
      say(`host is ${hostBox.width.toFixed(1)}px wide; the stage is 900px`);
    }

    // ── The title survives a hit test through the shadow boundary ───────────
    const title = sr.querySelector('.recipe__title') as HTMLElement | null;
    if (title) {
      const b = rect(title);
      const x = b.left + Math.min(8, b.width / 2);
      const y = b.top + b.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`title: page hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>`);
      } else {
        const hit = (sr as any).elementFromPoint(x, y) as Element | null;
        if (hit !== title && !title.contains(hit as Node)) {
          say(`title is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}`
            + `${hit?.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
        }
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('recipe visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.ingredients, `combo ${combo.id}: ingredient rows`)
        .toBe(combo.ingredients.length);
      expect(mounted.steps, `combo ${combo.id}: step rows`).toBe(combo.steps.length);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── Documented interactions that only a browser can be asked about ──────────

test.describe('recipe visual matrix: live geometry', () => {
  const full = (): Combo => generateCombos()
    .find(c => c.id === 'full/both/nutrition=true/hero=true')!;

  test('scaling the servings does not disturb the ingredient layout', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), full() as any);
    const before = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      return [...sr.querySelectorAll('.recipe__ingredient')]
        .map(r => Math.round(r.getBoundingClientRect().left));
    });
    await page.evaluate(() => (window as any).matrix.setServings(12));
    const after = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const rows = [...sr.querySelectorAll('.recipe__ingredient')];
      return {
        lefts: rows.map(r => Math.round(r.getBoundingClientRect().left)),
        overflow: rows.some((r) => {
          const section = sr.querySelector('[part="ingredients"]')!.getBoundingClientRect();
          const b = r.getBoundingClientRect();
          return b.right > section.right + 1;
        }),
      };
    });
    expect(after.lefts, 'ingredient rows moved when the amounts were rescaled')
      .toEqual(before);
    expect(after.overflow, 'a rescaled amount pushed a row out of the ingredients section')
      .toBe(false);
  });

  test('completing a step keeps the step list stacked and inside its section', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), full() as any);
    await page.evaluate(() => (window as any).matrix.completeStep(1));
    expect(await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const section = sr.querySelector('[part="steps"]')!.getBoundingClientRect();
      const rows = [...sr.querySelectorAll('.recipe__step')].map(r => r.getBoundingClientRect());
      const problems: string[] = [];
      for (let i = 1; i < rows.length; i++) {
        if (rows[i].top < rows[i - 1].bottom - 1) problems.push(`step ${i} overlaps step ${i - 1}`);
      }
      for (const [i, b] of rows.entries()) {
        if (b.bottom > section.bottom + 1) problems.push(`step ${i} escapes the steps section`);
      }
      return problems;
    })).toEqual([]);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. Layer 1 already measured the model the browser built; these
// three exist because "a class was applied" and "a reader can see the change"
// are different claims, and only decoded pixels settle them.

test.describe('recipe visual matrix: marquee pixels', () => {
  const full = () => generateCombos().find(c => c.id === 'full/both/nutrition=true/hero=true')!;

  test('the hero image paints', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), full() as any);
    const [pixel] = await capture(
      page, '#subject', 'recipe-hero',
      `(host) => {
        const box = host.shadowRoot.querySelector('[part="hero"] img').getBoundingClientRect();
        return [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }];
      }`,
    );
    expect(sameColor(pixel, HERO_RGB as RGB),
      `hero painted ${pixel.join(',')}, expected ${HERO_RGB.join(',')}`).toBe(true);
  });

  test('a checked ingredient looks different from an unchecked one', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), full() as any);
    await page.evaluate(() => (window as any).matrix.checkIngredient(0));
    const [checked, plain] = await capture(
      page, '#subject', 'recipe-checked-ingredient',
      `(host) => {
        const rows = host.shadowRoot.querySelectorAll('.recipe__ingredient');
        // Probe the amount text of each row: the documented "checked" state is
        // carried by the row's own text treatment, not by the native checkbox.
        return [...rows].slice(0, 2).map(row => {
          const box = row.querySelector('.recipe__ingredient-amount').getBoundingClientRect();
          return { x: box.x + 3, y: box.y + box.height / 2 };
        });
      }`,
    );
    expect(sameColor(checked, plain),
      `the checked row painted ${checked.join(',')}, identical to the unchecked row`).toBe(false);
  });

  test('a completed step is visibly distinguished from a pending one', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), full() as any);
    await page.evaluate(() => (window as any).matrix.completeStep(0));
    const [done, pending] = await capture(
      page, '#subject', 'recipe-completed-step',
      `(host) => {
        const rows = host.shadowRoot.querySelectorAll('.recipe__step');
        // Probe the disc ABOVE the digit: the completed state repaints the
        // circle's background, while the numeral itself stays inverse-white in
        // both states and would read as "no change".
        return [...rows].slice(0, 2).map(row => {
          const box = row.querySelector('.recipe__step-number').getBoundingClientRect();
          return { x: box.x + box.width / 2, y: box.y + box.height * 0.2 };
        });
      }`,
    );
    expect(sameColor(done, pending),
      `the completed step's number painted ${done.join(',')}, identical to the pending one`)
      .toBe(false);
    expect(contrast(done, pending),
      `completed-vs-pending contrast is ${contrast(done, pending).toFixed(2)}:1`)
      .toBeGreaterThan(1.05);
  });
});
