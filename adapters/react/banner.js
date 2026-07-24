// GENERATED FILE — DO NOT EDIT.
// Source: components/banner/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Banner - React adapter for snice-banner
 *
 * This is an auto-generated React wrapper for the Snice banner component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/banner/snice-banner';
 * import { Banner } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Banner />;
 * }
 * ```
 */
export const Banner = createReactAdapter({
    tagName: 'snice-banner',
    properties: ["variant", "position", "message", "dismissible", "icon", "actionText", "open", "label", "duration"],
    events: { "banner-open": "onBannerOpen", "banner-close": "onBannerClose", "banner-action": "onBannerAction" },
    formAssociated: false
});
//# sourceMappingURL=banner.js.map