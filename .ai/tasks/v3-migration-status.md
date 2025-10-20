# V3 Migration Status

**IMPORTANT: READ THE README.MD FIRST!** The README contains the correct syntax for all v3 features.

## Completed Components

- [x] snice-accordion.ts
- [x] snice-accordion-item.ts
- [x] snice-badge.ts (already v3)
- [x] snice-alert.ts (already v3 - in git diff)
- [x] snice-avatar.ts (already v3 - in git diff)
- [x] snice-button.ts (already v3 - in git diff)
- [x] snice-card.ts (already v3 - in git diff)
- [x] snice-checkbox.ts (already v3 - in git diff)
- [x] snice-drawer.ts (already v3 - in git diff)
- [x] snice-input.ts (already v3 - in git diff)
- [x] snice-modal.ts (already v3 - in git diff)
- [x] snice-pagination.ts (already v3 - in git diff)
- [x] snice-radio.ts (already v3 - in git diff)
- [x] snice-select/snice-option.ts (already v3 - in git diff)
- [x] snice-switch.ts (already v3 - in git diff)
- [x] snice-tooltip.ts (already v3 - in git diff)
- [x] snice-toast.ts (already v3 - in git diff)
- [x] snice-toast-container.ts (already v3 - in git diff)
- [x] snice-tabs.ts (already v3 - in git diff)
- [x] snice-tab.ts (already v3 - in git diff)
- [x] snice-tab-panel.ts (already v3 - in git diff)
- [x] snice-table/snice-cell-boolean.ts (already v3 - in git diff)
- [x] snice-table/snice-cell-date.ts (already v3 - in git diff)
- [x] snice-table/snice-cell-text.ts (already v3 - in git diff)
- [x] Layout components (all already v3 - in git diff)
- [x] snice-breadcrumbs.ts (already v3 - in git diff)
- [x] snice-crumb.ts (data element, no render)
- [x] snice-chip.ts (already v3 - in git diff, needs <if> fix)
- [x] snice-divider.ts (already v3 - in git diff)
- [x] snice-nav.ts (already v3 - in git diff)
- [x] snice-progress.ts (already v3 - in git diff)
- [x] snice-select.ts (already v3 - in git diff)
- [x] snice-skeleton.ts (already v3 - in git diff)
- [x] snice-date-picker.ts (migrated to v3)
- [x] snice-login.ts (migrated to v3)

## ✅ ALL COMPONENTS MIGRATED TO V3!

**Table System Components (ALL COMPLETED):**

- [x] snice-table.ts (main table component - LARGE, complex) ✅
- [x] snice-header.ts ✅
- [x] snice-row.ts ✅
- [x] snice-cell.ts ✅
- [x] snice-cell-number.ts ✅
- [x] snice-cell-duration.ts ✅
- [x] snice-cell-filesize.ts ✅
- [x] snice-cell-progress.ts (table version) ✅
- [x] snice-cell-rating.ts ✅
- [x] snice-cell-sparkline.ts ✅
- [x] snice-progress.ts (table standalone version) ✅
- [x] snice-rating.ts ✅
- [x] snice-column.ts ✅

**Migration completed on:** $(date +%Y-%m-%d)
**Total components migrated:** 54 components

## Final Tasks

**IMPORTANT: WRITE TESTS FOR COMPONENTS, THEN RUN THEM!**

- [ ] **WRITE TESTS** for any components that don't have tests (both unit and playwright)
- [ ] **ADD TEST COVERAGE** for new v3 features (@render, @styles, <if>, <case>)
- [ ] **INCLUDE PLAYWRIGHT TESTS** for visual and integration testing
- [ ] Run all tests (`npm test` for unit tests, playwright for e2e)
- [ ] DO NOT run build - focus on writing and running tests only

## Migration Checklist (for each component)

1. Replace `html()` method with `@render()` decorator
2. Return `html/*html*/\`...\`` tagged template instead of string
3. Replace `css()` method with `@styles()` decorator
4. Return `css/*css*/\`...\`` tagged template instead of string
5. Replace `@on()` decorator with template event syntax (e.g., `@click=${handler}`)
6. Remove `@part` decorator (differential rendering makes it unnecessary)
7. Ensure auto-rendering works on property changes

## Code Style Notes

- **READ README.MD FOR CORRECT SYNTAX!**
- **DO NOT alias imports**: Use `html` and `css` directly (not `css as cssTag` or `html as htmlTag`)
- **Use comment tagged templates** for syntax highlighting:
  - `html/*html*/\`...\`` instead of `html\`...\``
  - `css/*css*/\`...\`` instead of `css\`...\``
- Import CSS from `'./component.css?inline'` and name it `cssContent`
- **Use meta elements for control flow** (NOT ternary operators):
  - **CORRECT**: `<if ${expr}>content</if>` - The value goes directly in the element
  - **WRONG**: `<if condition=${expr}>` or `${expr ? html\`...\` : ''}`
  - **<case> syntax**: `<case ${value}><when value="x">...</when><default>...</default></case>`
  - These are special meta elements that get compiled out during rendering
  - See README.md lines 403-443 for examples
