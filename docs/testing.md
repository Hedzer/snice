<!-- AI: For the AI-optimized version of this doc, see docs/ai/testing.md -->
# Testing

Snice elements are custom elements, so they test in any DOM-capable runner. The only Snice-specific part is knowing when an element is ready to assert against.

## The Two Promises

Rendering is asynchronous and batched, so assertions must wait.

| Promise | Await it | Resolves when |
|---|---|---|
| `el.ready` | after mounting, before the first assertion | the first render is done and every `@ready()` handler has finished |
| `el.rendered` | after writing a reactive property | the render queued by that write has been applied |

```typescript
import { describe, it, expect } from 'vitest';
import './my-counter';

describe('my-counter', () => {
  it('renders its initial count', async () => {
    const el = document.createElement('my-counter');
    document.body.appendChild(el);
    await el.ready;

    expect(el.shadowRoot.querySelector('button').textContent).toBe('0');
  });

  it('re-renders when the count changes', async () => {
    const el = document.createElement('my-counter');
    document.body.appendChild(el);
    await el.ready;

    el.count = 5;
    await el.rendered;

    expect(el.shadowRoot.querySelector('button').textContent).toBe('5');
  });
});
```

Awaiting `ready` on an element that never connects will hang; append it to the document first.

## Reading the DOM

Use the element's render root directly:

```typescript
el.shadowRoot.querySelector('.label');
```

For components whose render root may be closed or light, use `@query` inside the component and assert against the property, or select from `el` rather than `el.shadowRoot`. See [Queries](./queries.md).

## Events

Snice events carry their payload in `detail`, so type handlers as `CustomEvent`:

```typescript
const seen: string[] = [];
el.addEventListener('status-changed', (e: CustomEvent) => seen.push(e.detail.value));

el.shadowRoot.querySelector('input').click();
await el.rendered;

expect(seen).toEqual(['done']);
```

Assert on `e.detail`, not `e.target.value`.

## Controllers

A controller attaches asynchronously, so wait for the element before asserting on its effects:

```typescript
import { attachController } from 'snice';

const el = document.createElement('user-list');
document.body.appendChild(el);
await attachController(el, UserController);
```

Swapping a controller is the supported way to test an element in isolation: attach a fixture controller that responds on the same channel the production controller uses, and the element itself never changes. See [Request / Response](./request-response.md) and [Controllers](./controllers.md).

## Validating Source

Beyond unit tests, the analyzer catches Snice-specific mistakes that still compile:

```bash
npx snice validate
npx snice check --json
```

See [CLI](./cli.md).
