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

- `base` - Outer container
- `cards` - Cards layout container
- `card` - Individual plan card
- `cta` - Call-to-action button
- `toggle` - Billing toggle switch area
- `table-wrapper` - Table layout wrapper
- `table` - Comparison table element

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
