export type CarouselAutoplayDirection = 'forward' | 'backward';

export interface SniceCarouselElement extends HTMLElement {
  activeIndex: number;
  autoplay: boolean;
  autoplayInterval: number;
  autoplayDirection: CarouselAutoplayDirection;
  loop: boolean;
  showControls: boolean;
  showIndicators: boolean;
  slidesPerView: number;
  spaceBetween: number;

  next(): void;
  prev(): void;
  goToSlide(index: number): void;
  play(): void;
  pause(): void;
}

export interface CarouselSlideChangeDetail {
  activeIndex: number;
  previousIndex: number;
  carousel: SniceCarouselElement;
}
