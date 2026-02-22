# Component Checklist

Every component must satisfy ALL items before considered complete.

## Pre-Implementation
- [ ] Read `theme.css` — understand available CSS custom properties
- [ ] Read `.ai/coding-standards.md` — understand patterns, fallbacks, units

## Implementation
- [ ] Component file: `components/<name>/snice-<name>.ts`
- [ ] Types file: `components/<name>/snice-<name>.types.ts` (interfaces, event maps)
- [ ] Styles file: `components/<name>/snice-<name>.css`
- [ ] All CSS uses `var(--snice-property, fallback)` pattern
- [ ] Spacing/typography in rem, borders/shadows in px
- [ ] Uses snice decorators (`@query`, `@on`, `@dispatch`, `@ready`, `@dispose`, `@observe`, `@watch`)
- [ ] Exported from `src/index.ts`

## Testing
- [ ] Unit tests: `tests/components/<name>.test.ts` — all passing
- [ ] CDN build test: component included in `tests/cdn-builds.test.ts`
- [ ] CDN runtime test: component works with shared runtime
- [ ] React adapter test: `tests/react-adapters/<name>.test.tsx`
- [ ] Light mode: component renders correctly
- [ ] Dark mode: component renders correctly (`[data-theme="dark"]`)
- [ ] Without theme: component works with fallback values only
- [ ] Focus states: visible and meet contrast standards

## React Adapter
- [ ] Metadata added to `scripts/generate-react-adapters.js`
- [ ] Generated adapter: `adapters/react/<name>.tsx`
- [ ] Exported from `adapters/react/index.ts`
- [ ] Test config added to `scripts/generate-react-tests.js`
- [ ] Run: `npm run generate:react-adapters`
- [ ] Run: `npm run generate:react-tests`

## CDN Build
- [ ] Build: `npm run build:core && npm run build:cdn`
- [ ] Output: `dist/cdn/<name>/snice-<name>.min.js`
- [ ] Works with shared runtime (`snice-runtime.min.js`)

## Documentation
- [ ] Human docs: `docs/<name>.md` — detailed, with examples and explanations
- [ ] AI docs: `docs/ai/components/<name>.md` — LOW TOKEN, concise: type signatures, bullets, code over prose, no tutorials, pure reference
- [ ] Demo page: `components/<name>/demo.html`
- [ ] Demo uses theme tokens (not hard-coded colors/spacing)
- [ ] Demo works in both light and dark modes

## Website Integration
- [ ] Showcase fragment: `public/showcases/<name>.html`
- [ ] Added to `public/showcases/manifest.json`
- [ ] Script tag in `public/showcases/_footer.html`
- [ ] Component tag in `public/showcases/_footer.html` comp-list
- [ ] Rebuild: `node public/build-showcases.js`
- [ ] Copy CDN builds: `node scripts/build-website.js`

## Final Verification
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all tests pass
- [ ] Update `.ai/tasks.md` — mark component complete
