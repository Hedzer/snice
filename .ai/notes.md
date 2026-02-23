# Project Organization Notes

## Customer-Facing vs Internal

**Customer-facing** = things a user of Snice sees, reads, or interacts with:
- `docs/components/` — Component docs users read to learn the API
- `docs/ai/components/` — Same docs, token-efficient format for AI consumers
- `public/` — The website users browse

**Internal** = things that guide development of Snice itself:
- `.ai/` — Instructions for how WE build, write, and maintain Snice

**The rule:** If a user of Snice would never read it, it's internal → `.ai/`. The output goes in `docs/` or `public/`.

## File Naming

- Use lowercase filenames, not ALLCAPS

## Components Page

- The tagline under the component count should match the homepage hero messaging
- Don't use generic/corporate language like "Pre-built UI components. Use standalone or with React/Vue/Angular."

## Camera Components

- Never auto-request camera permission on page load
- Camera components in showcases must be lazy-created inside modals (don't put the element in the DOM until the modal opens)

## Timers

- Don't auto-start timers in the showcase
