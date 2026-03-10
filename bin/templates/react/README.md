# {{projectName}}

A React + Snice application

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Project Structure

- `src/pages/` - Page components (rendered by routes)
- `src/components/` - Reusable React components
- `src/guards/` - Route guard functions
- `src/styles/` - Global styles
- `src/App.tsx` - Router and route definitions
- `src/main.tsx` - Application entry point

## Snice React Integration

This template uses Snice's React integration for routing, guards, layouts, and context.

- `<SniceRouter>` - Root provider with URL routing
- `<Route>` - Route definitions with guards and layouts
- `useSniceContext()` - Access application context
- `useNavigate()` - Programmatic navigation
- `useParams()` - Current route parameters
- `useRequestHandler()` - Handle requests from Snice web components

See the [Snice React docs](https://github.com/niceDev0908/snice) for full documentation.

Built with [Snice](https://github.com/niceDev0908/snice) + [React](https://react.dev)
