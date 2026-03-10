<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/pricing-table.md -->

# Pricing Table
`<snice-pricing-table>`

A pricing comparison component with cards or table layout, monthly/annual billing toggle, highlighted plans, badges, and declarative child elements.

## Table of Contents
- [Properties](#properties)
- [Components](#components)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Data Types](#data-types)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `plans` | `PricingPlan[]` | `[]` | Plan data array (set via JS for programmatic usage) |
| `variant` | `'cards' \| 'table'` | `'cards'` | Layout variant |
| `annual` | `boolean` | `false` | Whether to show annual pricing |

## Components

### `<snice-plan>`

Declarative child element for defining plans.

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Plan name |
| `price` | `string` | Monthly price |
| `annual-price` | `string` | Annual price (enables billing toggle) |
| `period` | `string` | Billing period label (default: '/mo') |
| `currency` | `string` | Currency symbol (default: '$') |
| `description` | `string` | Plan description |
| `cta` | `string` | Call-to-action button text |
| `cta-variant` | `'primary' \| 'secondary' \| 'outline'` | Button variant |
| `highlighted` | `boolean` | Emphasize this plan |
| `badge` | `string` | Badge text (e.g. 'Popular') |

### `<snice-feature>`

Declarative child element for defining plan features.

| Attribute | Type | Description |
|-----------|------|-------------|
| `excluded` | `boolean` | Mark feature as not included (shows X instead of check) |
| `value` | `string` | Custom display value (e.g. '1GB', '100GB') |

The text content of `<snice-feature>` is used as the feature name.

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `plan-select` | `{ plan: PricingPlan, index: number, billing: 'monthly' \| 'annual' }` | Fired when a plan's CTA button is clicked |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer container |
| `cards` | `<div>` | The cards layout container |
| `card` | `<div>` | Individual plan card |
| `cta` | `<button>` | Call-to-action button |
| `toggle` | `<div>` | Billing toggle switch area |
| `table-wrapper` | `<div>` | Table layout wrapper |
| `table` | `<table>` | The comparison table element |

## Basic Usage

```typescript
import 'snice/components/pricing-table/snice-pricing-table';
```

```html
<snice-pricing-table>
  <snice-plan name="Free" price="0" cta="Get Started">
    <snice-feature>5 projects</snice-feature>
    <snice-feature excluded>API access</snice-feature>
  </snice-plan>
  <snice-plan name="Pro" price="29" cta="Start Trial" highlighted>
    <snice-feature>Unlimited projects</snice-feature>
    <snice-feature>API access</snice-feature>
  </snice-plan>
</snice-pricing-table>
```

## Examples

### Cards with Billing Toggle

Use `annual-price` on plans to enable the monthly/annual billing toggle.

```html
<snice-pricing-table>
  <snice-plan name="Starter" price="0" cta="Get Started">
    <snice-feature>5 projects</snice-feature>
    <snice-feature value="1GB">Storage</snice-feature>
    <snice-feature excluded>Priority support</snice-feature>
  </snice-plan>
  <snice-plan name="Pro" price="29" annual-price="24" highlighted badge="Popular" cta="Start Trial" cta-variant="primary">
    <snice-feature>Unlimited projects</snice-feature>
    <snice-feature value="100GB">Storage</snice-feature>
    <snice-feature>Priority support</snice-feature>
  </snice-plan>
  <snice-plan name="Enterprise" price="99" annual-price="79" cta="Contact Sales">
    <snice-feature>Unlimited projects</snice-feature>
    <snice-feature value="Unlimited">Storage</snice-feature>
    <snice-feature>Priority support</snice-feature>
  </snice-plan>
</snice-pricing-table>
```

### Table Layout

Use `variant="table"` for a feature comparison table view.

```html
<snice-pricing-table variant="table">
  <snice-plan name="Basic" price="9" cta="Choose Basic">
    <snice-feature>10 users</snice-feature>
    <snice-feature value="5GB">Storage</snice-feature>
    <snice-feature excluded>Analytics</snice-feature>
  </snice-plan>
  <snice-plan name="Business" price="49" cta="Choose Business" highlighted badge="Best Value">
    <snice-feature>50 users</snice-feature>
    <snice-feature value="50GB">Storage</snice-feature>
    <snice-feature>Analytics</snice-feature>
  </snice-plan>
</snice-pricing-table>
```

### Programmatic Usage

Set plans via JavaScript for dynamic pricing data.

```typescript
table.plans = [
  {
    name: 'Free', price: 0, cta: 'Get Started',
    features: [
      { name: '5 projects', included: true },
      { name: 'API access', included: false },
      { name: 'Storage', included: '1GB' }
    ]
  },
  {
    name: 'Pro', price: 29, annualPrice: 24, cta: 'Start Trial',
    ctaVariant: 'primary', highlighted: true, badge: 'Popular',
    features: [
      { name: 'Unlimited projects', included: true },
      { name: 'API access', included: true },
      { name: 'Storage', included: '100GB' }
    ]
  }
];

table.addEventListener('plan-select', (e) => {
  console.log(`Selected: ${e.detail.plan.name} (${e.detail.billing})`);
});
```

## Accessibility

- Tab through plans and activate CTA buttons with Enter or Space
- Plan names, prices, and feature inclusion states are announced to screen readers
- The billing toggle is keyboard accessible with `role="radiogroup"`
- Highlighted plans are visually distinguished through styling

## Data Types

```typescript
interface PricingPlan {
  name: string;
  price: number;
  annualPrice?: number;            // Enables billing toggle when set
  period?: string;                 // e.g. '/mo' (default: '/mo')
  currency?: string;               // e.g. '$' (default: '$')
  description?: string;
  features: PricingFeature[];
  cta: string;                     // Button text
  ctaVariant?: 'primary' | 'secondary' | 'outline';
  highlighted?: boolean;
  badge?: string;
}

interface PricingFeature {
  name: string;
  included: boolean | string;      // true/false for check/x, string for custom value
}
```
