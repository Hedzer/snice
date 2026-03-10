# {{projectName}}

A React application built with [Snice](https://github.com/sniceio/snice).

## Features

- **JWT Authentication** - Token-based auth with automatic refresh and middleware
- **Protected Routes** - Guards with `(context, params) => boolean` signature
- **Middleware Pattern** - Composable fetch middleware (auth headers, error handling, retry)
- **Live Notifications** - WebSocket daemon with real-time updates and badge counter
- **Theme Switching** - Light, dark, and system theme with persistence
- **Data Listing** - Filterable table with debounced search
- **Snice Components** - Pre-built UI adapters (Card, Alert, Avatar, Switch, Badge, Divider, Login)
- **React Hooks** - `useSniceContext()`, `useNavigate()`, `useParams()`, `useRoute()`
- **Type-Safe** - Full TypeScript support
- **Fast Build** - Vite + React

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

# Run tests
npm run test
```

## Demo Credentials

- **Email:** demo@example.com
- **Password:** demo

## Project Structure

```
src/
  components/     # React components
    AppHeader.tsx       # Nav bar with user avatar, menu, notifications
    AppLayout.tsx       # Layout wrapper with header
    NotificationBadge.tsx # Notification count badge
    SearchBar.tsx       # Debounced search input
  pages/          # Page components (rendered by routes)
    LoginPage.tsx       # Login form using Snice Login adapter
    DashboardPage.tsx   # Stats cards, feature lists
    ProfilePage.tsx     # User profile with avatar
    NotificationsPage.tsx # Live notification feed with filters
    SettingsPage.tsx    # Theme, profile editing, notifications toggle
    DataPage.tsx        # Data table with search and status filters
  services/       # Business logic (auth, storage, jwt)
  middleware/      # Fetch middleware (auth, error, retry)
  daemons/        # Lifecycle-managed classes (notifications WebSocket)
  guards/         # Route guards (auth)
  types/          # TypeScript types
  styles/         # Global styles with snice theme variables
```

## Snice React Integration

- `<SniceRouter>` - Root provider with URL routing, context, and layout
- `<Route>` - Route definitions with guards, placards, and layout override
- `useSniceContext()` - Access application context (`{ application, navigation, navigate }`)
- `useNavigate()` - Programmatic navigation
- `useParams()` - Current route parameters
- `useRoute()` - Current route pattern
- Snice component adapters: `Card`, `Button`, `Input`, `Alert`, `Avatar`, `Badge`, `Spinner`, `Switch`, `Divider`, `EmptyState`, `Layout`, `Login`, `Tabs`

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

## Learn More

- [Snice Documentation](https://sniceio.github.io/snice)
- [React Documentation](https://react.dev)

## License

MIT
