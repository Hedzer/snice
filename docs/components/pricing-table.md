[//]: # (AI: For a low-token version of this doc, use docs/ai/components/pricing-table.md instead)

# Pricing Table Component

The pricing table component displays plan comparisons in a card or table layout, with support for monthly/annual billing toggle, highlighted plans, badges, and declarative child elements.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Child Elements](#child-elements)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

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

```typescript
import 'snice/components/pricing-table/snice-pricing-table';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `plans` | `PricingPlan[]` | `[]` | Plan data array (for programmatic usage) |
| `variant` | `'cards' \| 'table'` | `'cards'` | Layout variant |
| `annual` | `boolean` | `false` | Whether to show annual pricing |

### PricingPlan Interface

```typescript
interface PricingPlan {
  name: string;
  price: number;
  annualPrice?: number;        // Enables the billing toggle when set
  period?: string;             // e.g. '/mo' (default: '/mo')
  currency?: string;           // e.g. '$' (default: '$')
  description?: string;
  features: PricingFeature[];
  cta: string;                 // Call-to-action button text
  ctaVariant?: 'primary' | 'secondary' | 'outline';
  highlighted?: boolean;       // Emphasize this plan
  badge?: string;              // e.g. 'Popular', 'Best Value'
}

interface PricingFeature {
  name: string;
  included: boolean | string;  // true/false for check/x, string for custom value
}
```

## Child Elements

The pricing table supports declarative usage via `<snice-plan>` and `<snice-feature>` child elements as an alternative to setting the `plans` property.

### `<snice-plan>`

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

| Attribute | Type | Description |
|-----------|------|-------------|
| `excluded` | `boolean` | Mark feature as not included (shows X instead of check) |
| `value` | `string` | Custom display value (e.g. '1GB', '100GB') |

The text content of `<snice-feature>` is used as the feature name.

## Events

#### `plan-select`
Fired when a plan's call-to-action button is clicked.

**Event Detail:**
```typescript
{
  plan: PricingPlan;           // The selected plan object
  index: number;               // Plan index (0-based)
  billing: 'monthly' | 'annual';  // Current billing period
}
```

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer container |
| `cards` | The cards layout container |
| `card` | Individual plan card |
| `cta` | Call-to-action button |
| `toggle` | Billing toggle switch area |
| `table-wrapper` | Table layout wrapper |
| `table` | The comparison table element |

## Examples

### Cards Layout with Billing Toggle

Use `annual-price` on plans to enable the monthly/annual billing toggle.

```html
<snice-pricing-table>
  <snice-plan name="Starter" price="0" cta="Get Started">
    <snice-feature>5 projects</snice-feature>
    <snice-feature value="1GB">Storage</snice-feature>
    <snice-feature excluded>Priority support</snice-feature>
    <snice-feature excluded>API access</snice-feature>
  </snice-plan>
  <snice-plan name="Pro" price="29" annual-price="24" highlighted badge="Popular" cta="Start Trial" cta-variant="primary">
    <snice-feature>Unlimited projects</snice-feature>
    <snice-feature value="100GB">Storage</snice-feature>
    <snice-feature>Priority support</snice-feature>
    <snice-feature>API access</snice-feature>
  </snice-plan>
  <snice-plan name="Enterprise" price="99" annual-price="79" cta="Contact Sales">
    <snice-feature>Unlimited projects</snice-feature>
    <snice-feature value="Unlimited">Storage</snice-feature>
    <snice-feature>Priority support</snice-feature>
    <snice-feature>API access</snice-feature>
  </snice-plan>
</snice-pricing-table>
```

### Table Layout

Use the `variant="table"` attribute for a comparison table view.

```html
<snice-pricing-table variant="table">
  <snice-plan name="Basic" price="9" cta="Choose Basic">
    <snice-feature>10 users</snice-feature>
    <snice-feature value="5GB">Storage</snice-feature>
    <snice-feature excluded>Analytics</snice-feature>
  </snice-plan>
  <snice-plan name="Business" price="49" cta="Choose Business" highlighted badge="Best Value" cta-variant="primary">
    <snice-feature>50 users</snice-feature>
    <snice-feature value="50GB">Storage</snice-feature>
    <snice-feature>Analytics</snice-feature>
  </snice-plan>
</snice-pricing-table>
```

### Programmatic Usage

Set plans via JavaScript for dynamic pricing data.

```html
<snice-pricing-table id="pricing"></snice-pricing-table>

<script type="module">
  import 'snice/components/pricing-table/snice-pricing-table';

  const table = document.getElementById('pricing');
  table.plans = [
    {
      name: 'Free',
      price: 0,
      cta: 'Get Started',
      features: [
        { name: '5 projects', included: true },
        { name: 'API access', included: false },
        { name: 'Storage', included: '1GB' }
      ]
    },
    {
      name: 'Pro',
      price: 29,
      annualPrice: 24,
      cta: 'Start Trial',
      ctaVariant: 'primary',
      highlighted: true,
      badge: 'Popular',
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
</script>
```

### Handling Plan Selection

```html
<snice-pricing-table id="plans">
  <snice-plan name="Monthly" price="15" cta="Subscribe" cta-variant="primary">
    <snice-feature>All features included</snice-feature>
    <snice-feature>Email support</snice-feature>
  </snice-plan>
  <snice-plan name="Annual" price="12" cta="Save 20%" cta-variant="primary" highlighted badge="Save 20%">
    <snice-feature>All features included</snice-feature>
    <snice-feature>Priority support</snice-feature>
  </snice-plan>
</snice-pricing-table>

<script type="module">
  const table = document.getElementById('plans');
  table.addEventListener('plan-select', (e) => {
    const { plan, billing } = e.detail;
    // Navigate to checkout
    window.location.href = `/checkout?plan=${plan.name.toLowerCase()}&billing=${billing}`;
  });
</script>
```

## Accessibility

- **Keyboard support**: Tab through plans and activate CTA buttons with Enter or Space
- **Screen readers**: Plan names, prices, and feature inclusion states are announced
- **Highlighted plans**: Visually emphasized plans are distinguishable through styling, not color alone
- **Billing toggle**: The monthly/annual toggle is keyboard accessible

## Best Practices

1. **Highlight the recommended plan**: Use `highlighted` and `badge` to draw attention to the best-value option
2. **Keep plans comparable**: Use consistent feature lists across plans for easy comparison
3. **Show savings**: When using annual pricing, the toggle makes savings obvious
4. **Use the table variant for many features**: Cards work well for 3-5 features; tables scale better for detailed comparisons
5. **Provide clear CTAs**: Button text should indicate the action (e.g. "Start Trial", "Contact Sales")
