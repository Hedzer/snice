import type { SniceBaseProps } from './types';
/**
 * Props for the Testimonial component
 */
export interface TestimonialProps extends SniceBaseProps {
    quote?: any;
    author?: any;
    avatar?: any;
    role?: any;
    company?: any;
    rating?: any;
    variant?: any;
}
/**
 * Testimonial - React adapter for snice-testimonial
 *
 * This is an auto-generated React wrapper for the Snice testimonial component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/testimonial';
 * import { Testimonial } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Testimonial />;
 * }
 * ```
 */
export declare const Testimonial: import("react").ForwardRefExoticComponent<Omit<TestimonialProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=testimonial.d.ts.map