import { createReactAdapter } from './wrapper';
/**
 * Recipe - React adapter for snice-recipe
 *
 * This is an auto-generated React wrapper for the Snice recipe component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/recipe';
 * import { Recipe } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Recipe />;
 * }
 * ```
 */
export const Recipe = createReactAdapter({
    tagName: 'snice-recipe',
    properties: ["title", "description", "image", "author", "prepTime", "cookTime", "servings", "difficulty", "cuisine", "variant", "ingredients", "steps", "nutrition", "tags", "currentServings", "checkedIngredients", "completedSteps", "activeStep", "timerVersion"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=recipe.js.map