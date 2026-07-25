# Testing

Public human reference: `docs/testing.md`.

Snice elements are custom elements — test in any DOM-capable runner. The only Snice-specific part: knowing when an element is ready to assert against.

## Two promises

| Promise | Await it | Resolves when |
|---|---|---|
| `el.ready` | after mounting, before the first assertion | first render done + every `@ready()` handler finished |
| `el.rendered` | after writing a reactive property | render queued by that write applied |

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

Gotcha: awaiting `ready` on an element that never connects hangs — append it to the document first.

## Reading the DOM

```typescript
el.shadowRoot.querySelector('.label');
```

Closed or light render root: use `@query` inside the component and assert against the property, or select from `el` rather than `el.shadowRoot`. See queries.md.

## Events

Payload lives in `detail` — type handlers as `CustomEvent`:

```typescript
const seen: string[] = [];
el.addEventListener('status-changed', (e: CustomEvent) => seen.push(e.detail.value));

el.shadowRoot.querySelector('input').click();
await el.rendered;

expect(seen).toEqual(['done']);
```

Assert on `e.detail`, not `e.target.value`.

## Controllers

Attaches asynchronously — wait for the element before asserting on its effects:

```typescript
import { attachController } from 'snice';

const el = document.createElement('user-list');
document.body.appendChild(el);
await attachController(el, UserController);
```

To test an element in isolation, swap in a fixture controller that responds on the same channel the production controller uses; the element itself never changes. See request-response.md, controllers.md.

## Validating source

```bash
npx snice validate
npx snice check --json
```

See `docs/ai/cli.md`.
