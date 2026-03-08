# snice-pricing-table

Pricing comparison with cards or table layout, monthly/annual toggle, and declarative child elements.

## Properties

```ts
plans: PricingPlan[]                     // Plan data array
variant: 'cards' | 'table'              // Layout variant (default: 'cards')
annual: boolean                          // Show annual pricing (default: false)
```

### Types

```ts
interface PricingPlan {
  name: string;
  price: number;
  annualPrice?: number;                  // Annual price (enables billing toggle)
  period?: string;                       // e.g. '/mo' (default: '/mo')
  currency?: string;                     // e.g. '$' (default: '$')
  description?: string;
  features: PricingFeature[];
  cta: string;                           // Button text
  ctaVariant?: 'primary' | 'secondary' | 'outline';
  highlighted?: boolean;                 // Emphasize this plan
  badge?: string;                        // e.g. 'Popular'
}

interface PricingFeature {
  name: string;
  included: boolean | string;            // true/false for check/x, string for custom value
}
```

## Child Elements

Supports declarative usage via `<snice-plan>` and `<snice-feature>`:

**`<snice-plan>`** attributes: `name`, `price`, `annual-price`, `period`, `currency`, `description`, `cta`, `cta-variant`, `highlighted` (boolean), `badge`

**`<snice-feature>`** attributes: `excluded` (boolean), `value` (string for custom display)

## Events

- `plan-select` -> `{ plan: PricingPlan; index: number; billing: 'monthly' | 'annual' }` -- CTA button clicked

## CSS Parts

`base`, `cards`, `card`, `cta`, `toggle`, `table-wrapper`, `table`

## Usage

```html
<!-- Declarative -->
<snice-pricing-table>
  <snice-plan name="Free" price="0" cta="Get Started">
    <snice-feature>5 projects</snice-feature>
    <snice-feature excluded>API access</snice-feature>
    <snice-feature value="1GB">Storage</snice-feature>
  </snice-plan>
  <snice-plan name="Pro" price="29" annual-price="24" highlighted badge="Popular" cta="Start Trial">
    <snice-feature>Unlimited projects</snice-feature>
    <snice-feature>API access</snice-feature>
    <snice-feature value="100GB">Storage</snice-feature>
  </snice-plan>
</snice-pricing-table>
```

```typescript
table.plans = [
  { name: 'Free', price: 0, cta: 'Get Started', features: [
    { name: '5 projects', included: true },
    { name: 'API access', included: false }
  ]},
  { name: 'Pro', price: 29, annualPrice: 24, cta: 'Start Trial', highlighted: true, badge: 'Popular', features: [
    { name: 'Unlimited projects', included: true },
    { name: 'API access', included: true }
  ]}
];

table.addEventListener('plan-select', (e) => {
  console.log(`Selected ${e.detail.plan.name} (${e.detail.billing})`);
});
```
