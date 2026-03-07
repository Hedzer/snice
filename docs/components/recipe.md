<!-- AI: For a low-token version of this doc, use docs/ai/components/recipe.md instead -->

# Recipe Component

The recipe component displays an interactive recipe card with a hero image, ingredient scaling based on serving size, step-by-step mode with per-step timers, ingredient checkboxes, and optional nutrition facts.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```html
<snice-recipe id="my-recipe"></snice-recipe>

<script type="module">
  import 'snice/components/recipe/snice-recipe';

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
</script>
```

```typescript
import 'snice/components/recipe/snice-recipe';
```

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
| `ingredients` | `RecipeIngredient[]` | `[]` | Ingredient list |
| `steps` | `RecipeStep[]` | `[]` | Instruction steps |
| `nutrition` | `RecipeNutrition \| null` | `null` | Nutrition facts per serving |
| `tags` | `string[]` | `[]` | Recipe tags |

### RecipeIngredient Interface

```typescript
interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  group?: string;   // Group header for ingredient sections (e.g. 'Sauce', 'Dough')
}
```

### RecipeStep Interface

```typescript
interface RecipeStep {
  text: string;
  image?: string;   // Step photo URL
  tip?: string;     // Pro tip text
  time?: number;    // Timer duration in minutes (shows inline timer button)
}
```

### RecipeNutrition Interface

```typescript
interface RecipeNutrition {
  calories: number;
  protein: number;   // in grams
  carbs: number;     // in grams
  fat: number;       // in grams
  fiber?: number;    // in grams
  sodium?: number;   // in mg
}
```

## Methods

#### `setServings(count: number): void`
Adjust the serving count. All ingredient quantities scale proportionally.

```typescript
recipe.setServings(8); // Doubles ingredients for a 4-serving base recipe
```

#### `print(): void`
Open a print-friendly view of the recipe.

```typescript
recipe.print();
```

#### `reset(): void`
Reset all checked ingredients, completed steps, running timers, and serving count back to defaults.

```typescript
recipe.reset();
```

## Events

#### `recipe-serving-change`
Fired when the serving count changes.

**Event Detail:**
```typescript
{
  servings: number;          // New serving count
  previousServings: number;  // Previous serving count
}
```

#### `recipe-step-complete`
Fired when a step is marked as complete or incomplete.

**Event Detail:**
```typescript
{
  stepIndex: number;    // Zero-based step index
  completed: boolean;   // Whether the step is now completed
}
```

#### `recipe-ingredient-check`
Fired when an ingredient checkbox is toggled.

**Event Detail:**
```typescript
{
  ingredientIndex: number;         // Zero-based ingredient index
  checked: boolean;                // Whether the ingredient is now checked
  ingredient: RecipeIngredient;    // The ingredient object
}
```

## CSS Parts

| Part | Description |
|------|-------------|
| `container` | The outer recipe container |
| `hero` | The hero image area |
| `header` | Title and description section |
| `meta` | Metadata bar (prep time, cook time, servings, difficulty) |
| `content` | Main content area (ingredients + steps) |
| `ingredients` | Ingredients section |
| `steps` | Steps/instructions section |
| `nutrition` | Nutrition facts panel |
| `controls` | Serving size controls |

## Examples

### Full Recipe with All Features

```html
<snice-recipe id="carbonara"></snice-recipe>

<script type="module">
  const recipe = document.getElementById('carbonara');
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
</script>
```

### Card Variant

Use `variant="card"` for a compact card display.

```html
<snice-recipe id="salad" variant="card"></snice-recipe>

<script type="module">
  const recipe = document.getElementById('salad');
  recipe.title = 'Caesar Salad';
  recipe.image = '/images/caesar-salad.jpg';
  recipe.prepTime = 15;
  recipe.cookTime = 0;
  recipe.servings = 2;
  recipe.difficulty = 'easy';
  recipe.cuisine = 'American';
  recipe.ingredients = [
    { name: 'Romaine lettuce', amount: 1, unit: 'head' },
    { name: 'Croutons', amount: 100, unit: 'g' },
    { name: 'Parmesan', amount: 50, unit: 'g' },
    { name: 'Caesar dressing', amount: 60, unit: 'ml' }
  ];
  recipe.steps = [
    { text: 'Wash and chop the romaine lettuce.' },
    { text: 'Toss with dressing, croutons, and shaved parmesan.' }
  ];
</script>
```

### Handling Serving Size Changes

```html
<snice-recipe id="recipe-interactive"></snice-recipe>

<script type="module">
  const recipe = document.getElementById('recipe-interactive');
  recipe.title = 'Chocolate Chip Cookies';
  recipe.servings = 24;
  recipe.difficulty = 'easy';
  recipe.ingredients = [
    { name: 'All-purpose flour', amount: 280, unit: 'g' },
    { name: 'Butter', amount: 230, unit: 'g' },
    { name: 'Sugar', amount: 200, unit: 'g' },
    { name: 'Chocolate chips', amount: 340, unit: 'g' },
    { name: 'Eggs', amount: 2, unit: '' }
  ];
  recipe.steps = [
    { text: 'Cream butter and sugar together.' },
    { text: 'Add eggs and mix until combined.' },
    { text: 'Fold in flour and chocolate chips.' },
    { text: 'Scoop onto baking sheet and bake.', time: 12 }
  ];

  recipe.addEventListener('recipe-serving-change', (e) => {
    console.log(`Servings changed: ${e.detail.previousServings} -> ${e.detail.servings}`);
  });

  recipe.addEventListener('recipe-ingredient-check', (e) => {
    console.log(`${e.detail.ingredient.name}: ${e.detail.checked ? 'checked' : 'unchecked'}`);
  });
</script>
```

### Recipe with Grouped Ingredients

```html
<snice-recipe id="pizza"></snice-recipe>

<script type="module">
  const recipe = document.getElementById('pizza');
  recipe.title = 'Margherita Pizza';
  recipe.prepTime = 30;
  recipe.cookTime = 15;
  recipe.servings = 2;
  recipe.difficulty = 'medium';
  recipe.ingredients = [
    { name: 'Bread flour', amount: 300, unit: 'g', group: 'Dough' },
    { name: 'Yeast', amount: 7, unit: 'g', group: 'Dough' },
    { name: 'Water', amount: 200, unit: 'ml', group: 'Dough' },
    { name: 'Olive oil', amount: 2, unit: 'tbsp', group: 'Dough' },
    { name: 'San Marzano tomatoes', amount: 400, unit: 'g', group: 'Topping' },
    { name: 'Fresh mozzarella', amount: 200, unit: 'g', group: 'Topping' },
    { name: 'Fresh basil', amount: 10, unit: 'leaves', group: 'Topping' }
  ];
  recipe.steps = [
    { text: 'Mix flour, yeast, water, and olive oil. Knead for 10 minutes.', time: 10 },
    { text: 'Let dough rise for 1 hour.', time: 60, tip: 'Cover with a damp cloth in a warm spot.' },
    { text: 'Crush tomatoes and spread on stretched dough.' },
    { text: 'Add torn mozzarella and bake at 250C.', time: 15 },
    { text: 'Add fresh basil after baking.' }
  ];
</script>
```

### Print a Recipe

```html
<snice-recipe id="printable-recipe"></snice-recipe>
<button onclick="document.getElementById('printable-recipe').print()">Print Recipe</button>
```

## Accessibility

- **Keyboard support**: Ingredient checkboxes and step toggles are keyboard accessible
- **Serving adjuster**: The serving size controls are operable via keyboard
- **Screen readers**: Step numbers, ingredient amounts, and completion states are announced
- **Timer buttons**: Inline timer buttons on steps with a `time` value are keyboard focusable
- **Print view**: The `print()` method produces a clean layout for printing

## Best Practices

1. **Include all metadata**: Prep time, cook time, difficulty, and cuisine help users plan
2. **Group related ingredients**: Use the `group` property to organize ingredients into logical sections
3. **Add tips to tricky steps**: Use `step.tip` for pro tips that help less experienced cooks
4. **Use timers on timed steps**: Steps with a `time` value show inline timer buttons for convenience
5. **Provide nutrition facts**: Include nutrition data when available for health-conscious users
6. **Use the card variant for lists**: When displaying multiple recipes in a grid, use `variant="card"`
