export type TestimonialVariant = 'card' | 'minimal' | 'featured';

export interface SniceTestimonialElement extends HTMLElement {
  quote: string;
  author: string;
  avatar: string;
  role: string;
  company: string;
  rating: number;
  variant: TestimonialVariant;
}
