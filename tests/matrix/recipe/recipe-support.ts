/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-recipe matrix — fixtures and the documented-behaviour oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Read off `docs/ai/components/recipe.md` and
 * `packages/components/src/recipe/snice-recipe.types.ts`:
 *
 *   · Documented parts: `container`, `hero`, `header`, `meta`, `content`,
 *     `ingredients`, `steps`, `nutrition`, `controls` — each described by what
 *     it holds, which is what the oracle checks it holds.
 *   · `image` is the "Hero image URL", so the hero region exists exactly when
 *     there is an image to put in it.
 *   · `cuisine` is documented as "Shown as tag", alongside the `tags` array.
 *   · The meta bar holds "times, servings, difficulty"; `prepTime`/`cookTime`
 *     are in MINUTES, so a zero has no time to show.
 *   · `RecipeIngredient.group?` groups the ingredient list; ingredients with no
 *     group stay in the ungrouped run, and a named group is introduced by its
 *     name — groups appear in first-appearance order, the only order the input
 *     array defines.
 *   · `setServings(count)` "Adjust serving count (scales ingredients)": the
 *     displayed amount of each ingredient is `amount * servings / base`, where
 *     `base` is the `servings` the recipe was authored with.
 *   · `reset()` "Reset checked ingredients, completed steps, timers, servings".
 *   · `RecipeStep.time` is minutes and drives a per-step timer.
 *   · `nutrition` is nullable; `calories`/`protein`/`carbs`/`fat` are required
 *     and `fiber`/`sodium` optional, so the optional pair shows only when given.
 *   · Events `recipe-serving-change`, `recipe-step-complete`,
 *     `recipe-ingredient-check` with the exact detail shapes in the types file.
 *   · Accessibility: "Serving adjuster buttons have aria-labels".
 *
 * ── On amount FORMATTING ────────────────────────────────────────────────────
 *
 * The docs promise scaling, not a spelling. So the oracle decodes whatever
 * numeric form is rendered — a plain number, a vulgar fraction, or a decimal —
 * and compares the DECODED value to the documented scaled amount. An exact
 * string is demanded only when the scaled amount is a whole number, where no
 * rendering choice exists. This asserts the documented behaviour without
 * freezing an undocumented format into a test.
 */
import { shadow, text, part } from '../matrix-utils';
import '../../../packages/components/src/recipe/snice-recipe';
import type {
  RecipeIngredient, RecipeStep, RecipeNutrition, RecipeDifficulty, RecipeVariant,
} from '../../../packages/components/src/recipe/snice-recipe.types';

export type { RecipeIngredient, RecipeStep, RecipeNutrition, RecipeDifficulty, RecipeVariant };

// ── Documented value sets and defaults ──────────────────────────────────────

export const DIFFICULTIES: readonly RecipeDifficulty[] = ['easy', 'medium', 'hard'];
export const VARIANTS: readonly RecipeVariant[] = ['card', 'full'];
export const DEFAULT_VARIANT: RecipeVariant = 'full';
export const DEFAULT_DIFFICULTY: RecipeDifficulty = 'medium';
export const DEFAULT_SERVINGS = 4;

export const EVENTS = [
  'recipe-serving-change', 'recipe-step-complete', 'recipe-ingredient-check',
] as const;

export interface RecipeCombo {
  title: string;
  description: string;
  image: string;
  author: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: RecipeDifficulty;
  cuisine: string;
  variant: RecipeVariant;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutrition: RecipeNutrition | null;
  tags: string[];
}

/** Every documented property at its documented default. */
export const DEFAULTS: RecipeCombo = {
  title: '',
  description: '',
  image: '',
  author: '',
  prepTime: 0,
  cookTime: 0,
  servings: DEFAULT_SERVINGS,
  difficulty: DEFAULT_DIFFICULTY,
  cuisine: '',
  variant: DEFAULT_VARIANT,
  ingredients: [],
  steps: [],
  nutrition: null,
  tags: [],
};

export const recipe = (overrides: Partial<RecipeCombo> = {}): RecipeCombo => ({
  ...DEFAULTS,
  ...overrides,
});

// ── Fixtures ────────────────────────────────────────────────────────────────

/**
 * Amounts chosen so `amount * servings / 4` stays a whole number for the
 * serving counts the matrix uses — the scaling assertion is then exact, with no
 * rendering choice to allow for.
 */
export const CLEAN_INGREDIENTS: RecipeIngredient[] = [
  { name: 'Spaghetti', amount: 400, unit: 'g' },
  { name: 'Pancetta', amount: 200, unit: 'g' },
];

export const GROUPED_INGREDIENTS: RecipeIngredient[] = [
  { name: 'Spaghetti', amount: 400, unit: 'g' },
  { name: 'Pancetta', amount: 200, unit: 'g' },
  { name: 'Eggs', amount: 4, unit: '', group: 'Sauce' },
  { name: 'Parmesan', amount: 100, unit: 'g', group: 'Sauce' },
  { name: 'Pepper', amount: 8, unit: 'g', group: 'Season' },
];

export const STEPS: RecipeStep[] = [
  { text: 'Boil pasta in salted water.', time: 10 },
  { text: 'Fry pancetta until crispy.', tip: 'Use medium heat.' },
  { text: 'Mix eggs and parmesan.', image: '/images/step3.jpg' },
  { text: 'Combine all ingredients off heat.' },
];

export const NUTRITION_MIN: RecipeNutrition = { calories: 650, protein: 28, carbs: 72, fat: 24 };
export const NUTRITION_FULL: RecipeNutrition = { ...NUTRITION_MIN, fiber: 4, sodium: 820 };

// ── Mounting ────────────────────────────────────────────────────────────────

/** Documented attribute names for the scalar half of the property set. */
export function attrsOf(c: RecipeCombo): Record<string, any> {
  const attrs: Record<string, any> = {
    servings: c.servings,
    difficulty: c.difficulty,
    variant: c.variant,
    'prep-time': c.prepTime,
    'cook-time': c.cookTime,
  };
  if (c.title) attrs.title = c.title;
  if (c.description) attrs.description = c.description;
  if (c.image) attrs.image = c.image;
  if (c.author) attrs.author = c.author;
  if (c.cuisine) attrs.cuisine = c.cuisine;
  return attrs;
}

/** The four documented JS-only properties. */
export const propsOf = (c: RecipeCombo): Record<string, any> => ({
  ingredients: c.ingredients,
  steps: c.steps,
  nutrition: c.nutrition,
  tags: c.tags,
});

export const comboId = (c: RecipeCombo): string =>
  `${c.variant} image=${!!c.image} desc=${!!c.description} author=${!!c.author}`
  + ` cuisine="${c.cuisine}" tags=${c.tags.length} nutrition=${c.nutrition ? (c.nutrition.fiber !== undefined ? 'full' : 'min') : 'null'}`;

// ── Documented derivations ──────────────────────────────────────────────────

/** The ordered ingredient layout the `group?` field describes. */
export interface GroupedRow {
  kind: 'group' | 'ingredient';
  name: string;
  index: number;
}

export function expectedRows(ingredients: RecipeIngredient[]): GroupedRow[] {
  const order: string[] = [];
  const byGroup = new Map<string, Array<{ ingredient: RecipeIngredient; index: number }>>();
  ingredients.forEach((ingredient, index) => {
    const group = ingredient.group ?? '';
    if (!byGroup.has(group)) { byGroup.set(group, []); order.push(group); }
    byGroup.get(group)!.push({ ingredient, index });
  });

  const rows: GroupedRow[] = [];
  for (const group of order) {
    if (group) rows.push({ kind: 'group', name: group, index: -1 });
    for (const { ingredient, index } of byGroup.get(group)!) {
      rows.push({ kind: 'ingredient', name: ingredient.name, index });
    }
  }
  return rows;
}

/** The documented scaled amount: `amount * servings / base`. */
export const scaled = (amount: number, servings: number, base: number): number =>
  base === 0 ? amount : (amount * servings) / base;

/** The meta bar holds "times, servings, difficulty" — it exists if any exists. */
export const expectsMeta = (c: RecipeCombo): boolean =>
  c.prepTime > 0 || c.cookTime > 0 || c.servings > 0 || c.difficulty.length > 0;

// ── Reading the rendered recipe ─────────────────────────────────────────────

const FRACTIONS: Record<string, number> = {
  '¼': 0.25, '⅓': 1 / 3, '½': 0.5, '⅔': 2 / 3, '¾': 0.75,
};

/**
 * Decode a rendered amount into a number, whatever numeric form it took.
 * Returns NaN when nothing numeric is there at all — a real failure, not a
 * formatting difference.
 */
export function decodeAmount(rendered: string): number {
  const trimmed = rendered.trim();
  if (trimmed === '') return NaN;
  const match = /^(\d*)([¼⅓½⅔¾])$/.exec(trimmed);
  if (match) return (match[1] ? Number(match[1]) : 0) + FRACTIONS[match[2]];
  const plain = Number(trimmed);
  return Number.isNaN(plain) ? NaN : plain;
}

export interface RenderedIngredient {
  name: string;
  amountText: string;
  unitText: string;
  amount: number;
  checked: boolean;
  node: HTMLElement;
  checkbox: HTMLInputElement | null;
}

export interface RenderedStep {
  text: string;
  tip: string | null;
  imageSrc: string | null;
  timerButton: HTMLElement | null;
  activeTimer: HTMLElement | null;
  timerCancel: HTMLElement | null;
  completed: boolean;
  numberNode: HTMLElement | null;
  node: HTMLElement;
}

const cls = (node: Element | null | undefined, name: string): boolean =>
  !!node?.classList.contains(name);

export function readIngredients(el: HTMLElement): RenderedIngredient[] {
  return [...shadow(el).querySelectorAll<HTMLElement>('.recipe__ingredient')].map(node => {
    const amountNode = node.querySelector('.recipe__ingredient-amount');
    const raw = text(amountNode);
    // The amount cell holds "<amount> <unit>"; the unit may be empty.
    const [amountText, ...unit] = raw.split(' ');
    return {
      name: text(node.querySelector('.recipe__ingredient-text')),
      amountText,
      unitText: unit.join(' '),
      amount: decodeAmount(amountText),
      checked: cls(node, 'recipe__ingredient--checked'),
      node,
      checkbox: node.querySelector<HTMLInputElement>('.recipe__ingredient-checkbox'),
    };
  });
}

/** The ingredient list as documented rows: group titles interleaved with items. */
export function readRows(el: HTMLElement): GroupedRow[] {
  const list = shadow(el).querySelector('.recipe__ingredients-list');
  if (!list) return [];
  const rows: GroupedRow[] = [];
  let index = 0;
  for (const child of list.children) {
    if (child.classList.contains('recipe__ingredient-group-title')) {
      rows.push({ kind: 'group', name: text(child), index: -1 });
    } else if (child.classList.contains('recipe__ingredient')) {
      rows.push({ kind: 'ingredient', name: text(child.querySelector('.recipe__ingredient-text')), index: index++ });
    }
  }
  return rows;
}

export function readSteps(el: HTMLElement): RenderedStep[] {
  return [...shadow(el).querySelectorAll<HTMLElement>('.recipe__step')].map(node => {
    const image = node.querySelector('.recipe__step-image');
    return {
      text: text(node.querySelector('.recipe__step-text')),
      tip: node.querySelector('.recipe__step-tip') ? text(node.querySelector('.recipe__step-tip')) : null,
      imageSrc: image ? image.getAttribute('src') : null,
      timerButton: node.querySelector<HTMLElement>('.recipe__step-timer-btn'),
      activeTimer: node.querySelector<HTMLElement>('.recipe__active-timer'),
      timerCancel: node.querySelector<HTMLElement>('.recipe__timer-cancel'),
      completed: cls(node, 'recipe__step--completed'),
      numberNode: node.querySelector<HTMLElement>('.recipe__step-number'),
      node,
    };
  });
}

export interface Controls {
  decrement: HTMLElement | null;
  increment: HTMLElement | null;
  servingsCount: string;
  print: HTMLElement | null;
  reset: HTMLElement | null;
}

export function readControls(el: HTMLElement): Controls {
  const root = shadow(el);
  const buttons = [...root.querySelectorAll<HTMLElement>('[part~="controls"] button')];
  const label = (node: Element) => text(node).toLowerCase();
  return {
    decrement: root.querySelector('[aria-label="Decrease servings"]'),
    increment: root.querySelector('[aria-label="Increase servings"]'),
    servingsCount: text(root.querySelector('.recipe__servings-count')),
    print: buttons.find(b => label(b) === 'print') ?? null,
    reset: buttons.find(b => label(b) === 'reset') ?? null,
  };
}

/** Text of the meta bar row whose label is `name`, or null if there is no such row. */
export function metaValue(el: HTMLElement, name: string): string | null {
  const meta = part(el, 'meta');
  if (!meta) return null;
  for (const item of meta.querySelectorAll('.recipe__meta-item')) {
    if (text(item.querySelector('.recipe__meta-label')) === name) {
      return text(item.querySelector('.recipe__meta-value'));
    }
  }
  return null;
}

/** The rendered tag strings, in document order. */
export const readTags = (el: HTMLElement): string[] =>
  [...shadow(el).querySelectorAll('.recipe__tag')].map(node => text(node));

/** The nutrition panel as label -> value, or null when there is no panel. */
export function readNutrition(el: HTMLElement): Record<string, string> | null {
  const panel = part(el, 'nutrition');
  if (!panel) return null;
  const out: Record<string, string> = {};
  for (const item of panel.querySelectorAll('.recipe__nutrition-item')) {
    out[text(item.querySelector('.recipe__nutrition-label'))] = text(item.querySelector('.recipe__nutrition-value'));
  }
  return out;
}

// ── Oracle ──────────────────────────────────────────────────────────────────

/**
 * Every documented consequence of `c`, as a problem list. `servings` is the
 * CURRENT serving count (equal to `c.servings` on a freshly mounted recipe, and
 * whatever `setServings` last set thereafter).
 */
export function recipeProblems(el: HTMLElement, c: RecipeCombo, servings = c.servings): string[] {
  const problems: string[] = [];
  const say = (message: string) => problems.push(message);

  // ── Parts that always exist ──────────────────────────────────────────────
  if (!part(el, 'container')) say('no [part="container"]');
  if (!part(el, 'header')) say('no [part="header"]');

  // ── Hero ─────────────────────────────────────────────────────────────────
  const hero = part(el, 'hero');
  if (c.image) {
    if (!hero) say(`image "${c.image}" set but no [part="hero"]`);
    else {
      const src = hero.querySelector('img')?.getAttribute('src') ?? null;
      if (src !== c.image) say(`hero image src "${src}" != "${c.image}"`);
    }
  } else if (hero) {
    say('no image set but a [part="hero"] region is rendered');
  }

  // ── Header ───────────────────────────────────────────────────────────────
  const header = part(el, 'header');
  const headerText = text(header);
  if (c.title && !headerText.includes(c.title)) say(`title "${c.title}" missing from the header`);
  if (c.description && !headerText.includes(c.description)) say(`description missing from the header`);
  if (c.author && !headerText.includes(c.author)) say(`author "${c.author}" missing from the header`);

  // ── Tags: cuisine is "Shown as tag", then the tags array ─────────────────
  const wantTags = [...(c.cuisine ? [c.cuisine] : []), ...c.tags];
  const gotTags = readTags(el);
  if (JSON.stringify(gotTags) !== JSON.stringify(wantTags)) {
    say(`tags ${JSON.stringify(gotTags)} != expected ${JSON.stringify(wantTags)}`);
  }

  // ── Meta bar ─────────────────────────────────────────────────────────────
  const meta = part(el, 'meta');
  if (expectsMeta(c) && !meta) say('recipe has times/servings/difficulty but no [part="meta"]');
  if (!expectsMeta(c) && meta) say('nothing to show but a [part="meta"] bar is rendered');
  if (meta) {
    const prep = metaValue(el, 'Prep');
    if (c.prepTime > 0) {
      if (prep === null) say(`prepTime ${c.prepTime} set but no Prep row`);
      else if (!prep.includes(String(c.prepTime < 60 ? c.prepTime : Math.floor(c.prepTime / 60)))) {
        say(`Prep row "${prep}" does not report ${c.prepTime} minutes`);
      }
    } else if (prep !== null) {
      say(`prepTime is 0 but a Prep row reads "${prep}"`);
    }

    const cook = metaValue(el, 'Cook');
    if (c.cookTime > 0) {
      if (cook === null) say(`cookTime ${c.cookTime} set but no Cook row`);
    } else if (cook !== null) {
      say(`cookTime is 0 but a Cook row reads "${cook}"`);
    }

    const servingsRow = metaValue(el, 'Servings');
    if (servings > 0) {
      if (servingsRow !== String(servings)) say(`Servings row "${servingsRow}" != "${servings}"`);
    } else if (servingsRow !== null) {
      say(`servings is ${servings} but a Servings row reads "${servingsRow}"`);
    }

    const difficulty = metaValue(el, 'Difficulty');
    if (difficulty !== c.difficulty) say(`Difficulty row "${difficulty}" != "${c.difficulty}"`);
  }

  // ── Ingredients ──────────────────────────────────────────────────────────
  const ingredientsPart = part(el, 'ingredients');
  if (c.ingredients.length > 0) {
    if (!ingredientsPart) say(`${c.ingredients.length} ingredients but no [part="ingredients"]`);

    const wantRows = expectedRows(c.ingredients);
    const gotRows = readRows(el);
    if (JSON.stringify(gotRows.map(r => [r.kind, r.name])) !== JSON.stringify(wantRows.map(r => [r.kind, r.name]))) {
      say(`ingredient rows ${JSON.stringify(gotRows.map(r => `${r.kind}:${r.name}`))}`
        + ` != expected ${JSON.stringify(wantRows.map(r => `${r.kind}:${r.name}`))}`);
    }

    const rendered = readIngredients(el);
    const source = wantRows.filter(r => r.kind === 'ingredient').map(r => c.ingredients[r.index]);
    if (rendered.length === source.length) {
      source.forEach((ingredient, i) => {
        const got = rendered[i];
        const want = scaled(ingredient.amount, servings, c.servings);
        if (Number.isInteger(want)) {
          if (got.amountText !== String(want)) {
            say(`"${ingredient.name}" amount "${got.amountText}" != "${want}"`
              + ` (${ingredient.amount} scaled ${servings}/${c.servings})`);
          }
        } else if (!(Math.abs(got.amount - want) <= 0.05)) {
          say(`"${ingredient.name}" amount "${got.amountText}" decodes to ${got.amount},`
            + ` documented scaling gives ${want}`);
        }
        if (ingredient.unit && got.unitText !== ingredient.unit) {
          say(`"${ingredient.name}" unit "${got.unitText}" != "${ingredient.unit}"`);
        }
      });
    }
  } else if (ingredientsPart) {
    say('no ingredients but an [part="ingredients"] section is rendered');
  }

  // ── Steps ────────────────────────────────────────────────────────────────
  const stepsPart = part(el, 'steps');
  if (c.steps.length > 0) {
    if (!stepsPart) say(`${c.steps.length} steps but no [part="steps"]`);
    const rendered = readSteps(el);
    if (rendered.length !== c.steps.length) {
      say(`rendered ${rendered.length} steps, expected ${c.steps.length}`);
    } else {
      c.steps.forEach((step, i) => {
        const got = rendered[i];
        if (got.text !== step.text) say(`step ${i} text "${got.text}" != "${step.text}"`);
        if (step.tip) {
          if (got.tip !== step.tip) say(`step ${i} tip "${got.tip}" != "${step.tip}"`);
        } else if (got.tip !== null) {
          say(`step ${i} has no tip but "${got.tip}" is rendered`);
        }
        if (step.image) {
          if (got.imageSrc !== step.image) say(`step ${i} image "${got.imageSrc}" != "${step.image}"`);
        } else if (got.imageSrc !== null) {
          say(`step ${i} has no image but "${got.imageSrc}" is rendered`);
        }
        // A step with a documented `time` offers a timer to start; one without
        // has nothing to time.
        const hasTimerAffordance = !!got.timerButton || !!got.activeTimer;
        if (step.time !== undefined && !hasTimerAffordance) {
          say(`step ${i} has time=${step.time} but offers no timer`);
        }
        if (step.time === undefined && hasTimerAffordance) {
          say(`step ${i} has no time but offers a timer`);
        }
      });
    }
  } else if (stepsPart) {
    say('no steps but a [part="steps"] section is rendered');
  }

  // ── Content wrapper ──────────────────────────────────────────────────────
  const content = part(el, 'content');
  const wantContent = c.ingredients.length > 0 || c.steps.length > 0;
  if (wantContent && !content) say('ingredients or steps present but no [part="content"]');
  if (!wantContent && content) say('nothing to put in [part="content"] but it is rendered');

  // ── Nutrition ────────────────────────────────────────────────────────────
  const nutrition = readNutrition(el);
  if (c.nutrition) {
    if (!nutrition) say('nutrition set but no [part="nutrition"] panel');
    else {
      const want: Record<string, string> = {
        Calories: String(c.nutrition.calories),
        Protein: `${c.nutrition.protein}g`,
        Carbs: `${c.nutrition.carbs}g`,
        Fat: `${c.nutrition.fat}g`,
      };
      if (c.nutrition.fiber !== undefined) want.Fiber = `${c.nutrition.fiber}g`;
      if (c.nutrition.sodium !== undefined) want.Sodium = `${c.nutrition.sodium}mg`;
      if (JSON.stringify(nutrition) !== JSON.stringify(want)) {
        say(`nutrition panel ${JSON.stringify(nutrition)} != expected ${JSON.stringify(want)}`);
      }
    }
  } else if (nutrition) {
    say('nutrition is null but a [part="nutrition"] panel is rendered');
  }

  // ── Controls ─────────────────────────────────────────────────────────────
  const controls = part(el, 'controls');
  const readControlsNow = readControls(el);
  if (c.steps.length > 0) {
    if (!controls) say('steps present but no [part="controls"]');
    if (!readControlsNow.print) say('no Print control, though print() is documented');
    if (!readControlsNow.reset) say('no Reset control, though reset() is documented');
  }
  if (c.ingredients.length > 0) {
    // "Serving adjuster buttons have aria-labels" — documented accessibility.
    if (!readControlsNow.decrement) say('no serving-decrease button with an aria-label');
    if (!readControlsNow.increment) say('no serving-increase button with an aria-label');
    if (readControlsNow.servingsCount !== String(servings)) {
      say(`serving adjuster reads "${readControlsNow.servingsCount}", expected "${servings}"`);
    }
  }

  // ── Presentation hook ────────────────────────────────────────────────────
  const hostVariant = el.getAttribute('variant');
  if (hostVariant !== c.variant && !(c.variant === DEFAULT_VARIANT && hostVariant === null)) {
    say(`host variant is "${hostVariant}", expected "${c.variant}"`);
  }

  return problems;
}
