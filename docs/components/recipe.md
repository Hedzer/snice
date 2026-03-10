<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/recipe.md -->

# Recipe

An interactive recipe card with ingredient scaling, step-by-step mode with per-step timers, ingredient checkboxes, and optional nutrition facts.

## Table of Contents

- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | `''` | Recipe title |
| `description` | `string` | `''` | Short description |
| `image` | `string` | `''` | Hero image URL |
| `author` | `string` | `''` | Recipe author name |
| `prepTime` (attr: `prep-time`) | `number` | `0` | Prep time in minutes |
| `cookTime` (attr: `cook-time`) | `number` | `0` | Cook time in minutes |
| `servings` | `number` | `4` | Base serving count |
| `difficulty` | `'easy' \| 'medium' \| 'hard'` | `'medium'` | Difficulty level |
| `cuisine` | `string` | `''` | Cuisine type (displayed as a tag) |
| `variant` | `'card' \| 'full'` | `'full'` | Display variant |
| `ingredients` | `RecipeIngredient[]` | `[]` | Ingredient list (JS only) |
| `steps` | `RecipeStep[]` | `[]` | Instruction steps (JS only) |
| `nutrition` | `RecipeNutrition \| null` | `null` | Nutrition facts per serving (JS only) |
| `tags` | `string[]` | `[]` | Recipe tags (JS only) |

### Type Interfaces

```typescript
interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  group?: string;   // Group header (e.g. 'Sauce', 'Dough')
}

interface RecipeStep {
  text: string;
  image?: string;   // Step photo URL
  tip?: string;     // Pro tip text
  time?: number;    // Timer duration in minutes
}

interface RecipeNutrition {
  calories: number;
  protein: number;   // grams
  carbs: number;     // grams
  fat: number;       // grams
  fiber?: number;    // grams
  sodium?: number;   // mg
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `setServings()` | `count: number` | Adjust serving count; all ingredient quantities scale proportionally |
| `print()` | — | Open a print-friendly view |
| `reset()` | — | Reset checked ingredients, completed steps, timers, and serving count |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `recipe-serving-change` | `{ servings: number, previousServings: number }` | Serving count changed |
| `recipe-step-complete` | `{ stepIndex: number, completed: boolean }` | Step marked complete or incomplete |
| `recipe-ingredient-check` | `{ ingredientIndex: number, checked: boolean, ingredient: RecipeIngredient }` | Ingredient checkbox toggled |

## CSS Parts

| Part | Description |
|------|-------------|
| `container` | The outer recipe container |
| `hero` | The hero image area |
| `header` | Title, description, and author section |
| `meta` | Metadata bar (prep time, cook time, servings, difficulty) |
| `content` | Main content area (ingredients + steps) |
| `ingredients` | Ingredients section |
| `steps` | Steps/instructions section |
| `nutrition` | Nutrition facts panel |
| `controls` | Bottom control buttons (step-by-step, print, reset) |

## Basic Usage

```typescript
import 'snice/components/recipe/snice-recipe';
```

```html
<snice-recipe id="my-recipe"></snice-recipe>
```

```typescript
const recipe = document.getElementById('my-recipe');
recipe.title = 'Pasta Carbonara';
recipe.prepTime = 10;
recipe.cookTime = 20;
recipe.servings = 4;
recipe.ingredients = [
  { name: 'Spaghetti', amount: 400, unit: 'g' },
  { name: 'Pancetta', amount: 200, unit: 'g' }
];
recipe.steps = [
  { text: 'Boil pasta in salted water.', time: 10 },
  { text: 'Fry pancetta until crispy.' }
];
```

## Examples

### Full Recipe with All Features

Set all properties for a complete recipe with grouped ingredients, step tips, timers, and nutrition.

```typescript
recipe.title = 'Pasta Carbonara';
recipe.description = 'Classic Italian pasta with a creamy egg and cheese sauce.';
recipe.image = '/images/carbonara.jpg';
recipe.author = 'Chef Maria';
recipe.prepTime = 10;
recipe.cookTime = 20;
recipe.servings = 4;
recipe.difficulty = 'medium';
recipe.cuisine = 'Italian';
recipe.tags = ['pasta', 'italian', 'quick'];
recipe.ingredients = [
  { name: 'Spaghetti', amount: 400, unit: 'g' },
  { name: 'Pancetta', amount: 200, unit: 'g' },
  { name: 'Eggs', amount: 4, unit: '', group: 'Sauce' },
  { name: 'Parmesan', amount: 100, unit: 'g', group: 'Sauce' },
  { name: 'Black pepper', amount: 2, unit: 'tsp', group: 'Sauce' }
];
recipe.steps = [
  { text: 'Boil pasta in salted water.', time: 10 },
  { text: 'Fry pancetta until crispy.', tip: 'Use medium heat to render fat slowly.' },
  { text: 'Mix eggs and parmesan in a bowl.' },
  { text: 'Combine all ingredients off heat.', tip: 'The residual heat cooks the egg without scrambling.' }
];
recipe.nutrition = { calories: 650, protein: 28, carbs: 72, fat: 24, fiber: 3 };
```

### Card Variant

Use `variant="card"` for a compact card display.

```html
<snice-recipe id="salad" variant="card"></snice-recipe>
```

### Grouped Ingredients

Use the `group` property on ingredients to create sections.

```typescript
recipe.ingredients = [
  { name: 'Bread flour', amount: 300, unit: 'g', group: 'Dough' },
  { name: 'Yeast', amount: 7, unit: 'g', group: 'Dough' },
  { name: 'Tomatoes', amount: 400, unit: 'g', group: 'Topping' },
  { name: 'Mozzarella', amount: 200, unit: 'g', group: 'Topping' }
];
```

### Event Handling

Listen for events to track user interaction with the recipe.

```typescript
recipe.addEventListener('recipe-serving-change', (e) => {
  console.log(`Servings: ${e.detail.previousServings} -> ${e.detail.servings}`);
});

recipe.addEventListener('recipe-ingredient-check', (e) => {
  console.log(`${e.detail.ingredient.name}: ${e.detail.checked ? 'checked' : 'unchecked'}`);
});

recipe.addEventListener('recipe-step-complete', (e) => {
  console.log(`Step ${e.detail.stepIndex}: ${e.detail.completed ? 'done' : 'undone'}`);
});
```

### Print

Use `print()` to open a print-friendly view.

```typescript
recipe.print();
```

## Accessibility

- Ingredient checkboxes and step toggles are keyboard accessible
- Serving size +/- buttons have `aria-label` attributes
- Step numbers announce completion state
- Timer buttons are keyboard focusable
- Print view produces a clean layout
