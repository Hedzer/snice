import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-recipe';

type Args = {
  variant?: string;
  difficulty?: string;
  title?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  image?: string;
  author?: string;
  cuisine?: string;
};

const BASE_INGREDIENTS = [
  { name: 'Spaghetti', amount: 400, unit: 'g' },
  { name: 'Pancetta', amount: 200, unit: 'g' },
  { name: 'Eggs', amount: 4, unit: '' },
  { name: 'Parmesan', amount: 100, unit: 'g' },
  { name: 'Black pepper', amount: 2, unit: 'tsp' },
];

const BASE_STEPS = [
  { text: 'Bring a large pot of salted water to a boil. Cook spaghetti according to package directions.', time: 10 },
  { text: 'While pasta cooks, cut pancetta into small cubes and fry in a large skillet over medium heat until crispy.' },
  { text: 'In a bowl, whisk together eggs and grated Parmesan cheese.' },
  { text: 'Drain pasta, reserving 1 cup of pasta water. Immediately toss hot pasta with pancetta.' },
  { text: 'Remove from heat and pour egg mixture over pasta, tossing quickly. Add pasta water as needed.' },
];

const meta: Meta<Args> = {
  title: 'Specialty/Recipe',
  component: 'snice-recipe',
  tags: ['autodocs'],
  argTypes: {
    variant:    { control: 'select', options: ['full', 'card'] },
    difficulty: { control: 'select', options: ['easy', 'medium', 'hard'] },
    title:      { control: 'text' },
    prepTime:   { control: 'number' },
    cookTime:   { control: 'number' },
    servings:   { control: 'number' },
    image:      { control: 'text' },
    author:     { control: 'text' },
    cuisine:    { control: 'text' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-recipe') as any;
    el.style.cssText = 'display:block;max-width:700px;';
    el.title = args.title ?? 'Pasta Carbonara';
    el.prepTime = args.prepTime ?? 10;
    el.cookTime = args.cookTime ?? 20;
    el.servings = args.servings ?? 4;
    el.difficulty = args.difficulty ?? 'medium';
    el.ingredients = BASE_INGREDIENTS;
    el.steps = BASE_STEPS;
    if (args.variant !== undefined) el.variant = args.variant;
    if (args.image !== undefined) el.image = args.image;
    if (args.author !== undefined) el.author = args.author;
    if (args.cuisine !== undefined) el.cuisine = args.cuisine;
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { variant: 'full', difficulty: 'medium', title: 'Pasta Carbonara' },
};

function setup(overrides: Record<string, any> = {}) {
  const el = document.createElement('snice-recipe') as any;
  el.style.cssText = 'display:block;max-width:700px;';
  el.title = overrides.title ?? 'Pasta Carbonara';
  el.prepTime = overrides.prepTime !== undefined ? overrides.prepTime : 10;
  el.cookTime = overrides.cookTime !== undefined ? overrides.cookTime : 20;
  el.servings = overrides.servings ?? 4;
  el.difficulty = overrides.difficulty ?? 'medium';
  el.ingredients = overrides.ingredients ?? BASE_INGREDIENTS;
  el.steps = overrides.steps ?? BASE_STEPS;
  if (overrides.image) el.image = overrides.image;
  if (overrides.author) el.author = overrides.author;
  if (overrides.cuisine) el.cuisine = overrides.cuisine;
  if (overrides.variant) el.variant = overrides.variant;
  if (overrides.tags) el.tags = overrides.tags;
  if (overrides.nutrition) el.nutrition = overrides.nutrition;
  if (overrides.description) el.description = overrides.description;
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

// h2: Variant: full (default)
export const VariantFull: Story = {
  render: () => col(setup({ description: 'A classic Roman pasta dish with a creamy egg and cheese sauce.' })),
};

// h2: Variant: card
export const VariantCard: Story = {
  render: () => col(setup({ variant: 'card', image: 'https://picsum.photos/seed/pasta/700/400', description: 'Rich and creamy Italian classic.' })),
};

// h2: Difficulty: easy
export const DifficultyEasy: Story = {
  render: () => col(setup({ difficulty: 'easy', title: 'Simple Toast' })),
};

// h2: Difficulty: medium
export const DifficultyMedium: Story = {
  render: () => col(setup({ difficulty: 'medium' })),
};

// h2: Difficulty: hard
export const DifficultyHard: Story = {
  render: () => col(setup({ difficulty: 'hard', title: 'Beef Wellington', prepTime: 45, cookTime: 90 })),
};

// h2: With hero image
export const WithHeroImage: Story = {
  render: () => col(setup({ image: 'https://picsum.photos/seed/carbonara/700/400' })),
};

// h2: Without image
export const WithoutImage: Story = {
  render: () => col(setup()),
};

// h2: With nutrition facts
export const WithNutritionFacts: Story = {
  render: () => col(setup({ nutrition: { calories: 650, protein: 28, carbs: 72, fat: 24, fiber: 3, sodium: 890 } })),
};

// h2: With tags + cuisine
export const WithTagsPlusCuisine: Story = {
  render: () => col(setup({ cuisine: 'Italian', tags: ['Pasta', 'Quick', 'Comfort Food', 'Dinner'] })),
};

// h2: Grouped ingredients
export const GroupedIngredients: Story = {
  render: () => col(setup({
    ingredients: [
      { name: 'Spaghetti', amount: 400, unit: 'g', group: 'Pasta' },
      { name: 'Salt', amount: 1, unit: 'tbsp', group: 'Pasta' },
      { name: 'Eggs', amount: 4, unit: '', group: 'Sauce' },
      { name: 'Parmesan', amount: 100, unit: 'g', group: 'Sauce' },
      { name: 'Pancetta', amount: 200, unit: 'g', group: 'Toppings' },
      { name: 'Black pepper', amount: 2, unit: 'tsp', group: 'Toppings' },
    ],
  })),
};

// h2: Steps with timers
export const StepsWithTimers: Story = {
  render: () => col(setup({
    steps: [
      { text: 'Boil water and cook pasta.', time: 10 },
      { text: 'Fry pancetta until crispy.', time: 8 },
      { text: 'Mix eggs and cheese.' },
      { text: 'Combine everything off heat.' },
      { text: 'Let rest before serving.', time: 2 },
    ],
  })),
};

// h2: Steps with tips
export const StepsWithTips: Story = {
  render: () => col(setup({
    steps: [
      { text: 'Boil pasta in salted water.', tip: 'Use 1 tablespoon of salt per liter of water for best flavor.' },
      { text: 'Fry pancetta until crispy.', tip: 'Use medium-low heat to render the fat slowly for maximum crispness.' },
      { text: 'Mix eggs and Parmesan.', tip: 'Room temperature eggs emulsify better and reduce the risk of scrambling.' },
      { text: 'Toss everything together off heat.' },
    ],
  })),
};

// h2: Minimal (title + ingredients only)
export const MinimalTitleAndIngredientsOnly: Story = {
  render: () => col(setup({
    title: 'Quick Guacamole',
    prepTime: 5,
    cookTime: 0,
    difficulty: 'easy',
    ingredients: [
      { name: 'Avocado', amount: 2, unit: '' },
      { name: 'Lime juice', amount: 1, unit: 'tbsp' },
      { name: 'Salt', amount: 0.5, unit: 'tsp' },
    ],
    steps: [],
  })),
};

// h2: With author
export const WithAuthor: Story = {
  render: () => col(setup({ author: 'Chef Mario Rossi' })),
};

// h2: Many servings (12)
export const ManyServings12: Story = {
  render: () => col(setup({ servings: 12 })),
};

// h2: Long prep/cook times
export const LongPrepCookTimes: Story = {
  render: () => col(setup({ prepTime: 120, cookTime: 480, title: 'Slow-Cooked Brisket', difficulty: 'hard' })),
};

// h2: CSS Parts Styling
// Parts: container, hero, header, meta, content, ingredients, steps, nutrition, controls
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; font-family: sans-serif; }
      .parts-demo .label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 0.5rem; }
      .parts-demo .row { display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start; }

      /* Styled: container — outermost recipe wrapper */
      .parts-demo .demo-styled snice-recipe::part(container) {
        border: 2px solid #fb923c;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(251, 146, 60, 0.25);
        max-width: 480px;
      }
      /* Styled: hero — hero image area */
      .parts-demo .demo-styled snice-recipe::part(hero) {
        border-bottom: 3px solid #fb923c;
      }
      /* Styled: header — title + description section */
      .parts-demo .demo-styled snice-recipe::part(header) {
        background: linear-gradient(135deg, #7c2d12, #9a3412);
        color: #ffedd5;
        padding: 1.25rem;
      }
      /* Styled: meta — time / serving info strip */
      .parts-demo .demo-styled snice-recipe::part(meta) {
        background: #431407;
        border-top: 1px solid rgba(251, 146, 60, 0.4);
        border-bottom: 1px solid rgba(251, 146, 60, 0.4);
        color: #fed7aa;
        padding: 0.75rem 1.25rem;
      }
      /* Styled: content — main body area */
      .parts-demo .demo-styled snice-recipe::part(content) {
        background: #1c0a00;
        padding: 1.25rem;
        color: #fde8d0;
      }
      /* Styled: ingredients — ingredients list */
      .parts-demo .demo-styled snice-recipe::part(ingredients) {
        border-left: 4px solid #fb923c;
        padding-left: 1rem;
        margin-bottom: 1.5rem;
      }
      /* Styled: steps — steps list */
      .parts-demo .demo-styled snice-recipe::part(steps) {
        border-left: 4px solid #fcd34d;
        padding-left: 1rem;
      }
      /* Styled: nutrition — nutrition facts */
      .parts-demo .demo-styled snice-recipe::part(nutrition) {
        background: rgba(251, 146, 60, 0.1);
        border-top: 1px dashed #fb923c;
        padding: 0.75rem 1.25rem;
        color: #fed7aa;
      }
      /* Styled: controls — prev/next step buttons */
      .parts-demo .demo-styled snice-recipe::part(controls) {
        background: #431407;
        padding: 0.75rem 1.25rem;
        border-top: 1px solid rgba(251, 146, 60, 0.4);
      }
    `;

    const defaultEl = setup({ prepTime: 30, cookTime: 45, servings: 4, difficulty: 'medium' });
    defaultEl.style.cssText = 'display:block;max-width:480px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';

    const styledEl = setup({ prepTime: 30, cookTime: 45, servings: 4, difficulty: 'medium' });
    styledEl.style.cssText = 'display:block;max-width:480px;';

    const defaultWrap = document.createElement('div');
    defaultWrap.className = 'demo-default';
    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'label';
    defaultLabel.textContent = 'Default';
    defaultWrap.appendChild(defaultLabel);
    defaultWrap.appendChild(defaultEl);

    const styledWrap = document.createElement('div');
    styledWrap.className = 'demo-styled';
    const styledLabel = document.createElement('div');
    styledLabel.className = 'label';
    styledLabel.textContent = 'Styled (::part(container, hero, header, meta, content, ingredients, steps, nutrition, controls))';
    styledWrap.appendChild(styledLabel);
    styledWrap.appendChild(styledEl);

    const row = document.createElement('div');
    row.className = 'row';
    row.appendChild(defaultWrap);
    row.appendChild(styledWrap);

    const wrap = document.createElement('div');
    wrap.className = 'parts-demo';
    wrap.appendChild(style);
    wrap.appendChild(row);
    return wrap;
  },
};
