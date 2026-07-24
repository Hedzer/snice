// GENERATED FILE — DO NOT EDIT.
// Source: components/banner/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Banner component
 */
export interface BannerProps extends SniceBaseProps {
  variant?: any;
  position?: any;
  message?: any;
  dismissible?: any;
  icon?: any;
  actionText?: any;
  open?: any;
  label?: any;
  duration?: any;
  onBannerOpen?: (event: any) => void;
  onBannerClose?: (event: any) => void;
  onBannerAction?: (event: any) => void;
}

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
export const Banner: SniceReactComponent<BannerProps, SniceComponentRef> = createReactAdapter<BannerProps, false>({
  tagName: 'snice-banner',
  properties: ["variant","position","message","dismissible","icon","actionText","open","label","duration"],
  events: {"banner-open":"onBannerOpen","banner-close":"onBannerClose","banner-action":"onBannerAction"},
  formAssociated: false
});
