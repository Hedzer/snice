import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, trackRenders, wait } from './test-utils';
import '../../components/recipe/snice-recipe';
import type { SniceRecipe } from '../../components/recipe/snice-recipe';

describe('SniceRecipe', () => {
  let recipe: SniceRecipe;

  const sampleIngredients = [
    { name: 'Flour', amount: 2, unit: 'cups' },
    { name: 'Sugar', amount: 1, unit: 'cup' },
    { name: 'Eggs', amount: 3, unit: '' },
    { name: 'Butter', amount: 0.5, unit: 'cup', group: 'Wet' },
  ];

  const sampleSteps = [
    { text: 'Preheat oven to 350F' },
    { text: 'Mix dry ingredients', tip: 'Sift the flour first' },
    { text: 'Bake for 25 minutes', time: 25 },
    { text: 'Let cool', image: 'cool.jpg' },
  ];

  const sampleNutrition = {
    calories: 250,
    protein: 5,
    carbs: 35,
    fat: 10,
    fiber: 2,
    sodium: 150,
  };

  afterEach(() => {
    if (recipe) removeComponent(recipe as HTMLElement);
  });

  describe('Basic rendering', () => {
    it('should be defined as custom element', () => {
      expect(customElements.get('snice-recipe')).toBeDefined();
    });

    it('should render with default properties', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      expect(recipe.variant).toBe('full');
      expect(recipe.difficulty).toBe('medium');
      expect(recipe.servings).toBe(4);
    });

    it('should render title', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.title = 'Test Recipe';
      await tracker.next();
      const title = queryShadow(recipe, '.recipe__title');
      expect(title?.textContent).toBe('Test Recipe');
    });

    it('should render description', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.description = 'A delicious test recipe';
      await tracker.next();
      const desc = queryShadow(recipe, '.recipe__description');
      expect(desc?.textContent).toBe('A delicious test recipe');
    });

    it('should render author', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.author = 'Chef Test';
      await tracker.next();
      const author = queryShadow(recipe, '.recipe__author');
      expect(author?.textContent).toContain('Chef Test');
    });

    it('should render hero image when provided', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.image = 'test.jpg';
      recipe.title = 'Test';
      await tracker.next();
      const img = queryShadow<HTMLImageElement>(recipe, '.recipe__hero img');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('src')).toBe('test.jpg');
    });
  });

  describe('Meta bar', () => {
    it('should display prep time', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.prepTime = 15;
      await tracker.next();
      const meta = queryShadow(recipe, '.recipe__meta');
      expect(meta?.textContent).toContain('15 min');
    });

    it('should display cook time', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.cookTime = 30;
      await tracker.next();
      const meta = queryShadow(recipe, '.recipe__meta');
      expect(meta?.textContent).toContain('30 min');
    });

    it('should display total time', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.prepTime = 15;
      recipe.cookTime = 45;
      await tracker.next();
      const meta = queryShadow(recipe, '.recipe__meta');
      expect(meta?.textContent).toContain('1h');
    });

    it('should display difficulty', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.difficulty = 'easy';
      await tracker.next();
      const diff = queryShadow(recipe, '.recipe__difficulty--easy');
      expect(diff).toBeTruthy();
      expect(diff?.textContent).toBe('easy');
    });
  });

  describe('Ingredients', () => {
    it('should render ingredients list', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.ingredients = sampleIngredients;
      await tracker.next();
      const items = queryShadowAll(recipe, '.recipe__ingredient');
      expect(items?.length).toBe(4);
    });

    it('should display ingredient amounts and names', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.ingredients = [{ name: 'Flour', amount: 2, unit: 'cups' }];
      await tracker.next();
      const item = queryShadow(recipe, '.recipe__ingredient');
      expect(item).toBeTruthy();
      expect(item?.textContent).toContain('2');
      expect(item?.textContent).toContain('cups');
      expect(item?.textContent).toContain('Flour');
    });

    it('should toggle ingredient checked state on click', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.ingredients = sampleIngredients;
      await tracker.next();

      const handler = vi.fn();
      recipe.addEventListener('recipe-ingredient-check', handler);

      const item = queryShadow<HTMLElement>(recipe, '.recipe__ingredient');
      item?.click();
      await tracker.next();

      expect(handler).toHaveBeenCalled();
    });

    it('should show group titles', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.ingredients = sampleIngredients;
      await tracker.next();
      const group = queryShadow(recipe, '.recipe__ingredient-group-title');
      expect(group?.textContent).toBe('Wet');
    });
  });

  describe('Steps', () => {
    it('should render steps', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.steps = sampleSteps;
      await tracker.next();
      const steps = queryShadowAll(recipe, '.recipe__step');
      expect(steps?.length).toBe(4);
    });

    it('should show step tips', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.steps = sampleSteps;
      await tracker.next();
      const tip = queryShadow(recipe, '.recipe__step-tip');
      expect(tip?.textContent).toBe('Sift the flour first');
    });

    it('should show timer buttons for steps with time', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.steps = sampleSteps;
      await tracker.next();
      const timerBtn = queryShadow(recipe, '.recipe__step-timer-btn');
      expect(timerBtn).toBeTruthy();
      expect(timerBtn?.textContent).toContain('25 min');
    });

    it('should show step images', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.steps = sampleSteps;
      await tracker.next();
      const img = queryShadow<HTMLImageElement>(recipe, '.recipe__step-image');
      expect(img?.getAttribute('src')).toBe('cool.jpg');
    });

    it('should mark step as completed when number is clicked', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.steps = sampleSteps;
      await tracker.next();

      const handler = vi.fn();
      recipe.addEventListener('recipe-step-complete', handler);

      const number = queryShadow<HTMLElement>(recipe, '.recipe__step-number');
      number?.click();
      await tracker.next();

      expect(handler).toHaveBeenCalled();
      const detail = handler.mock.calls[0][0].detail;
      expect(detail.stepIndex).toBe(0);
      expect(detail.completed).toBe(true);
    });
  });

  describe('Serving adjuster', () => {
    it('should display serving adjuster', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.ingredients = sampleIngredients;
      recipe.servings = 4;
      await tracker.next();
      const adjuster = queryShadow(recipe, '.recipe__servings-adjuster');
      expect(adjuster).toBeTruthy();
    });

    it('should scale ingredients when servings change', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.servings = 4;
      recipe.ingredients = [{ name: 'Flour', amount: 2, unit: 'cups' }];
      await tracker.next();

      recipe.setServings(8);
      await tracker.next();

      const amount = queryShadow(recipe, '.recipe__ingredient-amount');
      expect(amount).toBeTruthy();
      expect(amount?.textContent).toContain('4');
    });

    it('should emit recipe-serving-change event', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.servings = 4;
      recipe.ingredients = sampleIngredients;
      await tracker.next();

      const handler = vi.fn();
      recipe.addEventListener('recipe-serving-change', handler);

      recipe.setServings(6);
      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].detail.servings).toBe(6);
      expect(handler.mock.calls[0][0].detail.previousServings).toBe(4);
    });

    it('should not go below 1 serving', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.servings = 2;
      recipe.ingredients = sampleIngredients;
      await tracker.next();

      recipe.setServings(1);
      await tracker.next();

      // setServings(0) is a no-op (guard prevents < 1), so no render triggered
      recipe.setServings(0);
      await wait(50);

      const count = queryShadow(recipe, '.recipe__servings-count');
      expect(count?.textContent).toBe('1');
    });

    it('should increment servings via button', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.servings = 4;
      recipe.ingredients = sampleIngredients;
      await tracker.next();

      const buttons = queryShadowAll<HTMLElement>(recipe, '.recipe__servings-btn');
      buttons?.[1]?.click();
      await tracker.next();

      const count = queryShadow(recipe, '.recipe__servings-count');
      expect(count?.textContent).toBe('5');
    });
  });

  describe('Nutrition panel', () => {
    it('should render nutrition facts when provided', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.nutrition = sampleNutrition;
      await tracker.next();
      const nutrition = queryShadow(recipe, '.recipe__nutrition');
      expect(nutrition).toBeTruthy();
      expect(nutrition?.textContent).toContain('250');
      expect(nutrition?.textContent).toContain('Calories');
    });

    it('should not render nutrition when null', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      recipe.nutrition = null;
      await wait(50);
      const nutrition = queryShadow(recipe, '.recipe__nutrition');
      expect(nutrition).toBeNull();
    });

    it('should show optional nutrition fields', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.nutrition = sampleNutrition;
      await tracker.next();
      const items = queryShadowAll(recipe, '.recipe__nutrition-item');
      expect(items?.length).toBe(6);
    });
  });

  describe('Step-by-step mode', () => {
    it('should enter step-by-step mode', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.steps = sampleSteps;
      await tracker.next();

      const stepBtn = Array.from(queryShadowAll(recipe, '.recipe__step-controls button'))
        .find(b => b.textContent?.includes('Step-by-Step')) as HTMLElement;
      stepBtn?.click();
      await tracker.next();

      const activeStep = queryShadow(recipe, '.recipe__step--active');
      expect(activeStep).toBeTruthy();
    });
  });

  describe('Tags', () => {
    it('should render tags', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.tags = ['vegetarian', 'gluten-free'];
      await tracker.next();
      const tags = queryShadowAll(recipe, '.recipe__tag');
      expect(tags?.length).toBe(2);
    });

    it('should render cuisine as tag', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.cuisine = 'Italian';
      recipe.tags = ['quick'];
      await tracker.next();
      const tags = queryShadowAll(recipe, '.recipe__tag');
      expect(tags?.length).toBe(2);
      expect(tags?.[0]?.textContent).toBe('Italian');
    });
  });

  describe('Variants', () => {
    it('should default to full variant', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      expect(recipe.variant).toBe('full');
    });

    it('should accept card variant', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe', { variant: 'card' });
      expect(recipe.getAttribute('variant')).toBe('card');
    });
  });

  describe('Methods', () => {
    it('should reset all state', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.servings = 4;
      recipe.ingredients = sampleIngredients;
      recipe.steps = sampleSteps;
      await tracker.next();

      recipe.setServings(8);
      await tracker.next();

      recipe.reset();
      await tracker.next();

      const count = queryShadow(recipe, '.recipe__servings-count');
      expect(count?.textContent).toBe('4');
    });

    it('should call window.print on print()', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
      recipe.print();
      expect(printSpy).toHaveBeenCalled();
      printSpy.mockRestore();
    });
  });

  describe('Timer functionality', () => {
    it('should start a timer for a step', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.steps = [{ text: 'Bake', time: 5 }];
      await tracker.next();

      const timerBtn = queryShadow<HTMLElement>(recipe, '.recipe__step-timer-btn');
      timerBtn?.click();
      await tracker.next();

      const activeTimer = queryShadow(recipe, '.recipe__active-timer');
      expect(activeTimer).toBeTruthy();
      expect(activeTimer?.textContent).toContain('5:00');
    });

    it('should cancel a timer', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.steps = [{ text: 'Bake', time: 5 }];
      await tracker.next();

      const timerBtn = queryShadow<HTMLElement>(recipe, '.recipe__step-timer-btn');
      timerBtn?.click();
      await tracker.next();

      const cancelBtn = queryShadow<HTMLElement>(recipe, '.recipe__timer-cancel');
      cancelBtn?.click();
      await tracker.next();

      const activeTimer = queryShadow(recipe, '.recipe__active-timer');
      expect(activeTimer).toBeNull();
    });
  });

  describe('Fraction display', () => {
    it('should display fractions for common amounts', async () => {
      recipe = await createComponent<SniceRecipe>('snice-recipe');
      const tracker = trackRenders(recipe);
      recipe.servings = 4;
      recipe.ingredients = [{ name: 'Butter', amount: 0.5, unit: 'cup' }];
      await tracker.next();

      const amount = queryShadow(recipe, '.recipe__ingredient-amount');
      expect(amount).toBeTruthy();
      expect(amount?.textContent).toContain('\u00BD');
    });
  });
});
