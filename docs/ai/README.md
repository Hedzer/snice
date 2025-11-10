# AI-Optimized Documentation

Token-efficient reference docs for AI assistants. Same content as human docs, minimal verbosity.

**Format:**
- Type signatures over prose
- Bullet points over paragraphs
- Code over explanations
- No tutorials, pure reference

**Files:**
- `api.md` - Complete API reference
- `patterns.md` - Common usage patterns
- `architecture.md` - System design
- `components/*.md` - Component reference (DO NOT read all upfront - read only as needed)

Read these instead of `/docs/*.md` for faster context loading.

## Available Components

**IMPORTANT:** Do NOT read all component docs. Only read a component's doc when you need to use or reference it.

**Implemented Components:**
- accordion, accordion-item, alert, avatar, badge, banner, breadcrumbs, button, card, checkbox, chip, color-display, color-picker, date-picker, divider, drawer, empty-state, file-gallery, file-upload, image, input, login, modal, nav, progress, qr-code, qr-reader, radio, select, skeleton, slider, spinner, switch, table, tabs, tab, textarea, timeline, tooltip

**To use a component:** Read `docs/ai/components/{component-name}.md` only when needed.

## Standalone Builds & React Adapters

### Standalone Builds
Build components as standalone bundles with full Snice runtime:

```bash
snice build-component button [--output=dir] [--format=esm,umd,iife] [--with-theme]
npm run build:standalone  # Build all components
```

Outputs: ESM, UMD, IIFE + minified versions. Size: ~20-40KB min, ~10-20KB gzip.

### React Adapters
All components have React adapters (React 17+):

```tsx
import { Button, Input } from 'snice/react';
<Button variant="primary" onClick={handler}>Text</Button>
<Input value={v} onChange={(e) => setV(e.detail.value)} />
```

Features: prop mapping, event callbacks, ref forwarding, form integration.

**Component Requirements:**
1. Must support standalone builds
2. Must have React adapter compatibility
3. Must be tested in both scenarios
