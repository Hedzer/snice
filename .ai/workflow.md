# Workflow

## Agent Dispatch Workflow

Rules for when and how the main AI session delegates work to subagents.

### Research → dispatch tiered subagents

Self-contained research questions (repo archaeology, "how is X wired",
doc sweeps, sizing/feasibility checks) go to subagents, not the main
session. Pick the model tier by the rigor the answer needs:

| Tier | Use for |
|--------|---------------------------------------------------------------|
| haiku | Mechanical lookups: grep-style questions, file inventories, counting things |
| sonnet | Standard tracing and summarizing: build pipelines, config chains, API surfaces |
| opus | High-rigor analysis where a wrong conclusion is expensive: migrations, security, architecture calls |

#### Model names per harness

The tier names above are the Claude Code names. When the session runs in a
different harness, substitute the equivalent model for the same tier:

| Tier (Claude Code) | OpenAI Codex | Kimi |
|--------------------|--------------|--------|
| fable (main session / visuals) | sol | k3 |
| sonnet (standard tracing) | terra | kimi 2 |
| haiku (mechanical lookups) | lina | kimi 2 |

Tiers without a stated equivalent in a harness fall back to that harness's
strongest listed model.

- Run independent questions in **parallel** (one message, multiple dispatches).
- Subagents return **conclusions**, not file dumps; only conclusions enter the main thread.
- Every subagent prompt that touches Snice development work must instruct:
  "read all `.ai/` files first".
- Research subagents are read-only: no edits, no commits, no deploys.

### Visuals → never delegated

Anything that requires eyes on rendered UI is done directly by the main
session (the strongest model available — Fable), never by a subagent:

- Screenshots and component appearance review
- Dark/light mode verification
- Design judgment, polish calls, "does this look right"

Rationale: visual judgment quality tracks model tier, and the user wants
the top-tier model's eyes on anything visual.

### Fixes and features → main session

Implementation follows the normal rules (`style.md`,
the Component Checklist below, test-first bug discipline). Subagents may be used
for mechanical fan-out (e.g. the same one-line change across many files),
but design decisions and visual verification stay in the main session.

## Component Checklist

Every component must satisfy ALL items before considered complete.

### Pre-Implementation
- [ ] Read `theme.css` — understand available CSS custom properties
- [ ] Read `.ai/style.md` — understand patterns, fallbacks, units
- [ ] If not ready for release, add directory name to `packages/components/.wip` (excludes from all builds)

### Implementation
- [ ] Component file: `packages/components/src/<name>/snice-<name>.ts`
- [ ] Types file: `packages/components/src/<name>/snice-<name>.types.ts` (interfaces, event maps)
- [ ] Styles file: `packages/components/src/<name>/snice-<name>.css`
- [ ] All CSS uses `var(--snice-property, fallback)` pattern — fallback must be the exact default value from `theme.css`, not an arbitrary value
- [ ] Spacing/typography in rem, borders/shadows in px
- [ ] Uses snice decorators (`@query`, `@on`, `@dispatch`, `@ready`, `@dispose`, `@observe`, `@watch`)
- [ ] Responsive design using container queries (not media queries) for layout breakpoints
- [ ] Storybook stories: `packages/components/src/<name>/snice-<name>.stories.ts`

### Testing
- [ ] Unit tests: `tests/components/<name>.test.ts` — all passing
- [ ] CDN build test: component included in `tests/cdn-builds.test.ts`
- [ ] CDN runtime test: component works with shared runtime
- [ ] React adapter test: `tests/react-adapters/<name>.test.tsx`
- [ ] Light mode: component renders correctly
- [ ] Dark mode: component renders correctly (`[data-theme="dark"]`)
- [ ] Without theme: component works with fallback values only
- [ ] Focus states: visible and meet contrast standards

### React Adapter
- [ ] Any adapter type overrides added to `tooling/generators/generate-react-adapters.js`
- [ ] Generated adapter: `adapters/react/<name>.tsx`
- [ ] Exported from `adapters/react/index.ts`
- [ ] Test config added to `tooling/generators/generate-react-tests.js`
- [ ] Run: `npm run generate:react-adapters`
- [ ] Run: `npm run generate:react-tests`

### CDN Build
- [ ] Build: `npm run build:distribution && npm run build:cdn`
- [ ] Output: `dist/cdn/<name>/snice-<name>.min.js`
- [ ] Works with shared runtime (`snice-runtime.min.js`)

### Documentation
- [ ] Human docs: `docs/components/<name>.md` — detailed, with examples and explanations
- [ ] AI docs: `docs/ai/components/<name>.md` — LOW TOKEN, concise: type signatures, bullets, code over prose, no tutorials, pure reference
- [ ] Both docs follow the **standard section order** (see below)
- [ ] Both docs are **verified accurate** against source code (properties, methods, events, slots, CSS parts)
- [ ] Full showcase: `website/showcases/<name>/full.html`
- [ ] Demo uses theme tokens (not hard-coded colors/spacing)
- [ ] Demo works in both light and dark modes

#### Standard Docs Section Order

Both human and AI docs MUST follow this section order. Omit sections that don't apply.

```
<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/<name>.md -->

# Component Name

Description paragraph.

## Table of Contents        ← links to all sections below
## Components               ← only if multi-element (e.g. accordion + accordion-item)
## Properties               ← table format in human docs, code block in AI docs
## Methods
## Events
## Slots
## CSS Parts                ← or "## CSS Custom Properties" if applicable
## Basic Usage              ← simplest example + import statement
## Examples
## Keyboard Navigation      ← only if applicable
## Accessibility
```

**Rules:**
- TOC anchor links: lowercase, spaces→hyphens (e.g. `[CSS Parts](#css-parts)`)
- No `## Importing` section (merge imports into Basic Usage)
- No `## Browser Support` or `## Common Patterns` sections
- AI docs use same order, low-token format: type signatures in code blocks, bullets, arrow notation for events
- AI comment is an invisible HTML comment `<!-- AI: ... -->`

### AI Docs Catalogue
- [ ] AI docs file exists at `docs/ai/components/<name>.md` — this directory is the component reference the skill loads from
- [ ] Listed in the components inventory in `docs/ai/README.md`

### Website Integration
- [ ] Showcase card: `website/showcases/<name>/card.html`
- [ ] Fragment starts with `<div class="comp-section">` and has `<h3>Component Name</h3>` as first child
- [ ] Added to `website/showcases/shared/manifest.json` (under correct category)
- [ ] Script tag in `website/showcases/shared/_footer.html`
- [ ] Search aliases added to `SEARCH_ALIASES` in `website/showcases/shared/_footer.html` (e.g. "dropdown" → "select")
- [ ] Rebuild: `npm run build:website` (assembles the components page and compatibility fragments)
- [ ] Full asset build: `npm run build:website:full`

### Final Verification
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all tests pass
- [ ] Remove from `packages/components/.wip` if previously listed
