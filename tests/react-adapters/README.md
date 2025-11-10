# React Adapter Tests

Comprehensive test suite for Snice React adapters. Tests verify that all components work correctly when wrapped for React usage.

## Structure

```
tests/react-adapters/
├── README.md                 # This file
├── index.test.tsx           # Main test suite entry point
├── test-helpers.tsx         # Reusable test utilities
└── components/              # Individual component tests (auto-generated)
    ├── button.test.tsx
    ├── input.test.tsx
    ├── card.test.tsx
    └── ...64 total test files
```

## Running Tests

```bash
# Run all React adapter tests
npm run test:react-adapters

# Run specific component test
npm test tests/react-adapters/components/button.test.tsx

# Run tests in watch mode
npm run test:watch -- tests/react-adapters

# Run tests with UI
npm run test:ui
```

## Generating Tests

Component tests are auto-generated from component metadata:

```bash
# Regenerate all component test files
npm run generate:react-tests

# This will create/update test files in components/ directory
```

## Test Coverage

Each component test covers:

### Basic Functionality
- Component is defined
- Display name is correct
- Accepts ref
- Accepts children
- Can be rendered

### Properties
- All documented properties are accepted
- Properties have correct types
- Multiple properties work together

### Events
- All event callbacks are accepted
- Event handlers are properly typed
- Multiple events can be handled

### Form Components (if applicable)
- Accepts `value` property
- Accepts `name`, `disabled`, `required` properties
- Handles `onChange` callback
- Value type is correct

### Variants (if applicable)
- All variant values are accepted
- Variant property works correctly

### Sizes (if applicable)
- All size values are accepted
- Size property works correctly

## Test Helpers

The `test-helpers.tsx` file provides utilities for component testing:

### `testComponent(config)`
Complete test suite for a component. Runs all relevant tests based on config.

```tsx
testComponent({
  name: 'Button',
  Component: Button,
  properties: [
    { name: 'disabled', value: true },
    { name: 'loading', value: false }
  ],
  events: [
    { name: 'onClick' }
  ],
  variants: ['primary', 'secondary', 'danger'],
  sizes: ['small', 'medium', 'large']
});
```

### Individual Test Functions
- `testComponentBasics(name, Component, defaultProps)` - Basic rendering tests
- `testComponentProperties(name, Component, properties)` - Property tests
- `testComponentEvents(name, Component, events)` - Event handler tests
- `testFormComponent(name, Component, options)` - Form integration tests
- `testComponentVariants(name, Component, variants)` - Variant tests
- `testComponentSizes(name, Component, sizes)` - Size tests

## Adding Tests for New Components

1. Add component metadata to `scripts/generate-react-tests.js`:

```javascript
const componentTestConfig = {
  'my-component': {
    isForm: true,  // if it's a form component
    valueType: 'string',
    properties: ['placeholder', 'maxlength'],
    events: ['onChange', 'onInput'],
    variants: ['outlined', 'filled'],
    sizes: ['small', 'medium', 'large']
  }
};
```

2. Regenerate tests:

```bash
npm run generate:react-tests
```

3. Run the new tests:

```bash
npm test tests/react-adapters/components/my-component.test.tsx
```

## Integration Testing

For full integration tests with actual React rendering, add them to individual component test files:

```tsx
import { render, fireEvent } from '@testing-library/react';
import { Button } from '../../../adapters/react/button';

describe('Button - Integration', () => {
  it('should handle clicks', () => {
    const handleClick = vi.fn();
    const { getByText } = render(
      <Button onClick={handleClick}>Click me</Button>
    );

    fireEvent.click(getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Requirements

- React 17, 18, or 19
- React DOM
- Vitest
- @testing-library/react (for integration tests)

## Troubleshooting

### "React adapter not built"

Run the build command before testing:

```bash
npm run build:react
npm run test:react-adapters
```

### Type errors

Ensure TypeScript compilation is successful:

```bash
tsc --project adapters/react/tsconfig.json
```

### Component not found

Verify the component exists and adapter was generated:

```bash
npm run generate:react-adapters
```

## CI/CD Integration

Include React adapter tests in your CI pipeline:

```yaml
# .gitlab-ci.yml or .github/workflows/test.yml
test:
  script:
    - npm install
    - npm run build:react
    - npm run test:react-adapters
```
