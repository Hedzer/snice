/**
 * Matrix slice RECIPE / INTERACTION — checking ingredients, completing steps,
 * running per-step timers, and the documented `reset()`.
 *
 * Contract (docs/ai/components/recipe.md § Methods, § Events, § Accessibility):
 *   · `recipe-ingredient-check` -> `{ ingredientIndex, checked, ingredient }`,
 *     where `ingredient` is the entry from the `ingredients` array at that
 *     index — so the index is an index INTO THE INPUT ARRAY, not into the
 *     grouped rendering order.
 *   · `recipe-step-complete` -> `{ stepIndex, completed }`, a toggle.
 *   · "per-step timers": a step with `time` (minutes) can be timed.
 *   · `reset()` — "Reset checked ingredients, completed steps, timers,
 *     servings".
 *   · "Keyboard accessible checkboxes, step toggles, and timer buttons."
 *
 * Dimensions: ingredient index (5, across three groups) x check/uncheck, step
 * index (4) x complete/uncomplete, timer lifecycle, and reset from a fully
 * dirtied state.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount, unmountAll, captureEvents, click, wait } from '../matrix-utils';
import {
  recipe, attrsOf, propsOf, recipeProblems, readIngredients, readSteps, readControls,
  expectedRows, GROUPED_INGREDIENTS, CLEAN_INGREDIENTS, STEPS, EVENTS,
  type RecipeCombo,
} from './recipe-support';

const mountRecipe = (c: RecipeCombo) =>
  mount<HTMLElement>('snice-recipe', attrsOf(c), '', propsOf(c));

/** Rendering position of the ingredient at input index `index`. */
const rowOf = (index: number) =>
  expectedRows(GROUPED_INGREDIENTS).filter(r => r.kind === 'ingredient').findIndex(r => r.index === index);

describe('recipe matrix: interaction', () => {
  afterEach(() => unmountAll());

  // ── Checking ingredients ─────────────────────────────────────────────────

  for (let index = 0; index < GROUPED_INGREDIENTS.length; index++) {
    const ingredient = GROUPED_INGREDIENTS[index];
    const id = `checking "${ingredient.name}" (input index ${index}, group ${ingredient.group ?? 'none'})`;

    it(id, async () => {
      const c = recipe({ title: 'Checks', ingredients: GROUPED_INGREDIENTS });
      const el = await mountRecipe(c);
      const recorder = captureEvents(el, [...EVENTS]);
      const row = rowOf(index);

      click(readIngredients(el)[row].node);
      await (el as any).rendered;

      expect(recorder.types(), id).toEqual(['recipe-ingredient-check']);
      expect(recorder.events[0].detail, id)
        .toEqual({ ingredientIndex: index, checked: true, ingredient });
      expect(readIngredients(el)[row].checked, `${id}: rendered state`).toBe(true);
      expect(readIngredients(el).filter(i => i.checked), 'only one ingredient checked').toHaveLength(1);

      // …and back off again: the doc calls it a checkbox, so it toggles.
      click(readIngredients(el)[row].node);
      await (el as any).rendered;

      expect(recorder.events[1].detail, `${id}: uncheck`)
        .toEqual({ ingredientIndex: index, checked: false, ingredient });
      expect(readIngredients(el)[row].checked).toBe(false);
    });
  }

  it('the checkbox itself toggles the same ingredient', async () => {
    const c = recipe({ title: 'Checkbox', ingredients: CLEAN_INGREDIENTS });
    const el = await mountRecipe(c);
    const recorder = captureEvents(el, [...EVENTS]);

    const checkbox = readIngredients(el)[1].checkbox!;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await (el as any).rendered;

    expect(recorder.types()).toEqual(['recipe-ingredient-check']);
    expect(recorder.events[0].detail.ingredientIndex).toBe(1);
    expect(recorder.events[0].detail.ingredient).toEqual(CLEAN_INGREDIENTS[1]);
    expect(readIngredients(el)[1].checked).toBe(true);
  });

  // ── Completing steps ─────────────────────────────────────────────────────

  for (let index = 0; index < STEPS.length; index++) {
    const id = `completing step ${index}`;

    it(id, async () => {
      const c = recipe({ title: 'Steps', steps: STEPS });
      const el = await mountRecipe(c);
      const recorder = captureEvents(el, [...EVENTS]);

      click(readSteps(el)[index].numberNode);
      await (el as any).rendered;

      expect(recorder.types(), id).toEqual(['recipe-step-complete']);
      expect(recorder.events[0].detail, id).toEqual({ stepIndex: index, completed: true });
      expect(readSteps(el)[index].completed, `${id}: rendered state`).toBe(true);
      expect(readSteps(el).filter(s => s.completed), 'only one step completed').toHaveLength(1);

      click(readSteps(el)[index].numberNode);
      await (el as any).rendered;

      expect(recorder.events[1].detail, `${id}: uncomplete`).toEqual({ stepIndex: index, completed: false });
      expect(readSteps(el)[index].completed).toBe(false);
    });
  }

  // ── Per-step timers ──────────────────────────────────────────────────────

  it('only a step with a documented time offers a timer', async () => {
    const c = recipe({ title: 'Timers', steps: STEPS });
    const el = await mountRecipe(c);
    const offered = readSteps(el).map(s => !!s.timerButton);
    expect(offered).toEqual(STEPS.map(s => s.time !== undefined));
  });

  it('starting a timer replaces the button with a running countdown', async () => {
    const c = recipe({ title: 'Timers', steps: STEPS });
    const el = await mountRecipe(c);

    click(readSteps(el)[0].timerButton);
    await (el as any).rendered;

    const running = readSteps(el)[0];
    expect(running.activeTimer, 'no running timer appeared').not.toBeNull();
    expect(running.timerButton, 'the start button is still offered while running').toBeNull();
    expect(running.timerCancel, 'a running timer cannot be cancelled').not.toBeNull();
  });

  it('cancelling a timer restores the start affordance', async () => {
    const c = recipe({ title: 'Timers', steps: STEPS });
    const el = await mountRecipe(c);

    click(readSteps(el)[0].timerButton);
    await (el as any).rendered;
    click(readSteps(el)[0].timerCancel);
    await (el as any).rendered;

    expect(readSteps(el)[0].activeTimer).toBeNull();
    expect(readSteps(el)[0].timerButton).not.toBeNull();
  });

  it('a timer counts down', async () => {
    const c = recipe({ title: 'Timers', steps: [{ text: 'Rest', time: 1 }] });
    const el = await mountRecipe(c);

    click(readSteps(el)[0].timerButton);
    await (el as any).rendered;
    const before = readSteps(el)[0].activeTimer!.textContent ?? '';

    // The countdown ticks on a real one-second interval, and Vitest's fake
    // timers deadlock the component's own render scheduling, so this one case
    // pays for a real tick rather than asserting nothing.
    await wait(1200);
    await (el as any).rendered;
    const after = readSteps(el)[0].activeTimer!.textContent ?? '';

    expect(after, `timer did not advance (still "${before.trim()}")`).not.toBe(before);
  });

  // ── reset() ──────────────────────────────────────────────────────────────

  it('reset() clears checked ingredients, completed steps, timers, and servings', async () => {
    const c = recipe({
      title: 'Dirty', servings: 4, ingredients: GROUPED_INGREDIENTS, steps: STEPS,
    });
    const el = await mountRecipe(c);

    click(readIngredients(el)[0].node);
    click(readIngredients(el)[3].node);
    click(readSteps(el)[1].numberNode);
    click(readSteps(el)[0].timerButton);
    (el as any).setServings(9);
    await (el as any).rendered;

    // Everything the doc says reset() undoes is currently done.
    expect(readIngredients(el).filter(i => i.checked)).toHaveLength(2);
    expect(readSteps(el).filter(s => s.completed)).toHaveLength(1);
    expect(readSteps(el)[0].activeTimer).not.toBeNull();
    expect(readControls(el).servingsCount).toBe('9');

    (el as any).reset();
    await (el as any).rendered;

    expect(readIngredients(el).filter(i => i.checked), 'checked ingredients survived reset()').toHaveLength(0);
    expect(readSteps(el).filter(s => s.completed), 'completed steps survived reset()').toHaveLength(0);
    expect(readSteps(el)[0].activeTimer, 'a timer survived reset()').toBeNull();
    expect(readControls(el).servingsCount, 'servings survived reset()').toBe('4');
    expect(recipeProblems(el, c, 4)).toEqual([]);
  });

  it('reset() emits none of the documented change events', async () => {
    // The three documented events announce a USER action. `reset()` is the
    // caller's own action, so it has nothing to announce back to the caller.
    const c = recipe({ title: 'Quiet', ingredients: CLEAN_INGREDIENTS, steps: STEPS });
    const el = await mountRecipe(c);
    click(readIngredients(el)[0].node);
    await (el as any).rendered;

    const recorder = captureEvents(el, [...EVENTS]);
    (el as any).reset();
    await (el as any).rendered;

    expect(recorder.types()).toEqual([]);
  });

  // ── print() ──────────────────────────────────────────────────────────────

  it('print() and the Print control both ask the browser to print', async () => {
    const printed = vi.fn();
    vi.stubGlobal('print', printed);
    const c = recipe({ title: 'Printable', ingredients: CLEAN_INGREDIENTS, steps: STEPS });
    const el = await mountRecipe(c);

    (el as any).print();
    click(readControls(el).print);

    expect(printed).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
});
