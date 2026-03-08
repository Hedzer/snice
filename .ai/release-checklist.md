# Release Checklist

## Automated (via semantic-release pipeline)
These happen automatically during `npm run release`:
- [ ] Version bump in package.json
- [ ] CHANGELOG.md updated
- [ ] Template package.json versions synced
- [ ] llms.txt + llms-full.txt version and component count updated (`scripts/update-llms.js`)
- [ ] Website rebuilt (`npm run website:build:full`)
- [ ] React adapters committed
- [ ] npm publish
- [ ] Git tag + commit

## Manual Review Before Release
- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] New components: removed from `components/.wip`
- [ ] New components: docs, showcases, React adapters all complete (see `component-checklist.md`)

## Manual Review After Release
- [ ] Website live at snice.dev with correct version
- [ ] CDN bundles accessible at cdn.snice.dev
- [ ] npm package published with correct version
- [ ] llms.txt component count and version are correct

## When to Manually Update llms.txt / llms-full.txt
The version and component count update automatically. But these require manual edits:
- New decorator or API change → update llms-full.txt API reference
- New usage mode (e.g., new adapter) → update both files
- Architecture change → update both files
- New website pages → update llms.txt "Where to Find Information" section
- Component list reorganization → update category lists in both files
