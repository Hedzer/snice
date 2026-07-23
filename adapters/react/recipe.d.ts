import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Recipe component
 */
export interface RecipeProps extends SniceBaseProps {
    title?: any;
    description?: any;
    image?: any;
    author?: any;
    prepTime?: any;
    cookTime?: any;
    servings?: any;
    difficulty?: any;
    cuisine?: any;
    variant?: any;
    ingredients?: any;
    steps?: any;
    nutrition?: any;
    tags?: any;
    onRecipeServingChange?: (event: any) => void;
    onRecipeStepComplete?: (event: any) => void;
    onRecipeIngredientCheck?: (event: any) => void;
}
/**
 * Recipe - React adapter for snice-recipe
 *
 * This is an auto-generated React wrapper for the Snice recipe component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/recipe/snice-recipe';
 * import { Recipe } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Recipe />;
 * }
 * ```
 */
export declare const Recipe: SniceReactComponent<RecipeProps, SniceComponentRef>;
//# sourceMappingURL=recipe.d.ts.map