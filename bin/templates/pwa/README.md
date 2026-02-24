# {{projectName}}

A Progressive Web App (PWA) built with [Snice](https://github.com/sniceio/snice).

## Features

- **JWT Authentication** - Token-based auth with automatic refresh and middleware
- **Protected Routes** - Guards with `(context, params) => boolean` signature
- **Middleware Pattern** - Composable fetch middleware (auth headers, error handling, retry)
- **PWA Ready** - Service worker, offline support, installable
- **Live Notifications** - WebSocket daemon with real-time updates and badge counter
- **Theme Switching** - Light, dark, and system theme with persistence
- **Data Listing** - Filterable table with debounced search
- **Controllers** - Notification controller with `@respond` pattern
- **Native Element Controllers** - Attach controllers to any HTML element
- **Imperative Rendering** - `@render({ once: true })` with `@watch` + `@query`
- **Observers** - `@observe('resize')`, `@observe('media:(...)')` for responsive behavior
- **Keyboard Shortcuts** - Ctrl+S to save settings, Ctrl+Backspace to clear notifications, Escape to close menus
- **Snice Components** - Pre-built UI (cards, alerts, avatars, switches, badges, dividers, tabs)
- **Type-Safe** - Full TypeScript support
- **Fast Build** - Vite + SWC

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check
```

## Demo Credentials

- **Email:** demo@example.com
- **Password:** demo

## Project Structure

```
src/
  components/     # @element decorated UI components
    app-header.ts       # Nav bar with user avatar, menu, @context
    search-bar.ts       # Debounced search with @on('input', { debounce: 300 })
    notification-badge.ts # Imperative rendering with @render({ once: true })
  controllers/    # @controller decorated behavior modules
    notification-controller.ts  # @respond('get-notifications')
  pages/          # Routable pages (@page decorator)
    login.ts            # Login form with @respond('login-user')
    dashboard.ts        # Stats, @observe('media:...'), notification counter
    profile.ts          # User info, @dispatch, @observe, <case>/<when>
    notifications.ts    # Live feed, filters, @watch, keyboard shortcuts
    settings.ts         # Theme toggle, form bindings, @context, Ctrl+S save
    data.ts             # Data table, search-bar, @observe('resize'), filters
  services/       # Business logic (auth, storage, jwt)
  middleware/      # Fetch middleware (auth, error, retry)
  daemons/        # Lifecycle-managed classes (notifications WebSocket)
  guards/         # Route guards (auth)
  types/          # TypeScript types
  styles/         # Global styles with dark/light theme support
```

## Snice Features Demonstrated

### Decorators

| Decorator | Used In |
|-----------|---------|
| `@page` | All pages |
| `@element` | app-header, search-bar, notification-badge |
| `@controller` | notification-controller |
| `@property` | Multiple components |
| `@render` | All components |
| `@render({ once: true })` | notification-badge (imperative) |
| `@styles` | All components |
| `@context` | dashboard, profile, settings, app-header |
| `@watch` | notification-badge, notifications page |
| `@query` | notification-badge, app-header |
| `@on` | search-bar, settings, notifications, app-header |
| `@dispatch` | search-bar, profile, settings, app-header |
| `@respond` | login page, notification-controller |
| `@observe` | dashboard (media), profile (media), data (resize) |
| `@ready` | dashboard, notifications, notification-badge |
| `@dispose` | dashboard, notifications, notification-badge |

### Template Features

| Feature | Used In |
|---------|---------|
| `<if>` conditionals | dashboard, notifications, data, app-header |
| `<case>/<when>/<default>` | profile, notifications, data |
| `.prop` binding | search-bar, settings |
| `?attr` boolean binding | settings (switch) |
| `@event` binding | All components |
| `@keydown:modifier` | settings (Ctrl+S), app-header (Escape), notifications (Ctrl+Backspace) |
| `key` attribute | notifications list, data table |

### Architecture Patterns

- **Context-Aware Fetcher** with auth, error, and retry middleware
- **Daemons** for WebSocket lifecycle management
- **Guards** with `(context, params) => boolean` signature
- **Request/Response** for element-to-controller communication
- **Native Element Controllers** via `useNativeElementControllers()`

## Customization

### Replace Mock API

Update `src/services/auth.ts` to call your real API:

```typescript
export async function login(credentials: LoginCredentials) {
  const response = await fetch('https://your-api.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  const data = await response.json();
  setToken(data.token);
  setUser(data.user);
  return data;
}
```

### Enable Real WebSocket

Update `src/daemons/notifications.ts`:

```typescript
// Replace startMockNotifications() with:
this.connect();
```

### Configure Environment

Create `.env` file:

```
VITE_API_URL=https://your-api.com
VITE_WS_URL=wss://your-ws.com
```

### Update Icons

Replace placeholder icons in `public/icons/`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

## Learn More

- [Snice Documentation](https://sniceio.github.io/snice)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

## License

MIT
