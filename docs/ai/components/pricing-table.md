# snice-pricing-table

Pricing comparison with cards or table layout, monthly/annual toggle, and declarative child elements.

## Properties

```typescript
plans: PricingPlan[] = [];                           // attr: none (JS only)
variant: 'cards'|'table' = 'cards';
annual: boolean = false;                             // Show annual pricing
```

## Components

**`<snice-plan>`** - Declarative plan child element.
Attributes: `name`, `price`, `annual-price`, `period`, `currency`, `description`, `cta`, `cta-variant`, `highlighted` (boolean), `badge`

**`<snice-feature>`** - Declarative feature child element.
Attributes: `excluded` (boolean), `value` (string for custom display)

## Events

- `plan-select` → `{ plan: PricingPlan, index: number, billing: 'monthly'|'annual' }` - CTA clicked

## CSS Parts

- `base` - The outer container
- `toggle` - Billing toggle switch area
- `toggle-button` - Monthly or annual billing button
- `toggle-button-active` - Added to `toggle-button` for the selected billing period
- `cards` - The cards layout container
- `card` - Individual plan card
- `card-highlighted` - Added to `card` for a highlighted plan
- `badge` - Plan badge
- `plan-header` - Plan name and description wrapper
- `plan-name` - Plan name heading
- `plan-description` - Plan description text
- `price` - Card price block
- `currency` - Currency symbol
- `amount` - Formatted price amount; in the table variant it also includes the currency symbol
- `period` - Billing period suffix
- `features` - Card feature list
- `feature` - Individual feature row
- `feature-excluded` - Added to `feature` when the plan excludes it
- `feature-icon` - Included or excluded feature glyph
- `feature-icon-included` - Added to `feature-icon` for an included feature
- `feature-icon-excluded` - Added to `feature-icon` for an excluded feature
- `feature-name` - Feature label wrapper inside a feature row
- `feature-value` - Value text for a non-boolean feature
- `cta` - Call-to-action button
- `table-wrapper` - Table layout wrapper
- `table` - The comparison table element
- `table-header` - Comparison table header section
- `table-body` - Comparison table body section
- `table-row` - Any comparison table row
- `table-cell` - Any comparison table cell
- `header-cell` - Added to `table-cell` on header cells
- `header-cell-highlighted` - Added to `header-cell` for a highlighted plan column
- `table-cell-highlighted` - Added to `table-cell` for a highlighted plan column

## Basic Usage

```html
<snice-pricing-table>
  <snice-plan name="Free" price="0" cta="Get Started">
    <snice-feature>5 projects</snice-feature>
    <snice-feature excluded>API access</snice-feature>
  </snice-plan>
  <snice-plan name="Pro" price="29" annual-price="24" highlighted badge="Popular" cta="Start Trial">
    <snice-feature>Unlimited projects</snice-feature>
    <snice-feature>API access</snice-feature>
  </snice-plan>
</snice-pricing-table>
```

```typescript
import 'snice/components/pricing-table/snice-pricing-table';

table.addEventListener('plan-select', (e) => {
  console.log(`Selected ${e.detail.plan.name} (${e.detail.billing})`);
});
```

## Accessibility

- Tab through plans and activate CTA buttons with Enter/Space
- Billing toggle is keyboard accessible with `role="radiogroup"`
- Highlighted plans are visually distinguished

## Types

```typescript
interface PricingPlan {
  name: string; price: number; annualPrice?: number; period?: string;
  currency?: string; description?: string; features: PricingFeature[];
  cta: string; ctaVariant?: 'primary'|'secondary'|'outline';
  highlighted?: boolean; badge?: string;
}
interface PricingFeature { name: string; included: boolean | string; }
```
