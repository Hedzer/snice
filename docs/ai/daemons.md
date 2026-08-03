# Daemons

Human reference: `docs/daemons.md`.

Ordinary explicitly constructed stateful objects with app-owned lifecycles.
`@daemon` adds per-instance Snice communication; it never constructs, caches,
globally registers, starts, or stops an instance.

```typescript
@daemon
class SessionDaemon {
  session: Session | null = null;

  @respond('get-session')
  getSession() { return this.session; }

  @on('set-session')
  setSession(e: CustomEvent<Session>) {
    this.session = e.detail;
    this.changed();
  }

  @dispatch('session-changed')
  changed() { return this.session; }
}

const session = new SessionDaemon();
const release = provideContext(appRoot, { daemons: { session } });
```

Context contract:

```typescript
type DaemonMap = Readonly<Record<string, object>>;

interface AppContext {
  readonly daemons?: DaemonMap;
  [key: string]: unknown;
}
```

Extend `AppContext` to type application-specific fields; Snice assigns meaning
only to `daemons`.

Router automatically provides its `context` beneath `target`. Non-router apps
call `provideContext(root, context)`. `getContext(elementOrController)` returns
the raw visible app context.

Consumer; no daemon implementation import:

```typescript
@request<Session | null>('get-session', { daemon: 'session' })
async *load(): Response<Session | null> { return yield {}; }

@dispatch('set-session', { daemon: 'session' })
set(session: Session) { return session; }

@on('session-changed', { daemon: 'session' })
changed(e: CustomEvent<Session | null>) {}

@respond('confirm-logout', { daemon: 'session' })
confirm() { return true; }
```

Daemon methods without `{ daemon }` use that instance's private target.
Controllers resolve through their attached host.

Resolution: participant -> nearest provided app context ->
`context.daemons[name]` -> instance target. No globals, implicit construction,
fallback, scanning, or late binding.

Rules:
- Provide before element connect/controller attach (`@on`/`@respond` bind then).
- `@request`/`@dispatch` resolve at invocation.
- `daemon` and `scope` are mutually exclusive.
- No selector delegation on daemon targets.
- Release function is idempotent and makes daemon traffic inert.
- Multiple instances of the same class and same address under different roots
  are independent.
- Missing/undecorated/inactive entries fail explicitly.
