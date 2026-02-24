import type { Product } from '../types/store';

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Wireless Noise-Cancelling Headphones',
    description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and ultra-comfortable memory foam ear cushions.',
    price: 249.99,
    image: 'https://picsum.photos/seed/headphones/400/400',
    category: 'Electronics',
    rating: 4.7,
    reviews: 2341,
    inStock: true,
    tags: ['audio', 'wireless', 'noise-cancelling'],
  },
  {
    id: '2',
    name: 'Mechanical Keyboard',
    description: 'Hot-swappable mechanical keyboard with RGB backlighting, PBT keycaps, and customizable macros.',
    price: 149.99,
    image: 'https://picsum.photos/seed/keyboard/400/400',
    category: 'Electronics',
    rating: 4.5,
    reviews: 1823,
    inStock: true,
    tags: ['peripherals', 'mechanical', 'rgb'],
  },
  {
    id: '3',
    name: 'Ultrawide Monitor 34"',
    description: '34-inch curved ultrawide monitor with 144Hz refresh rate, 1ms response time, and HDR support.',
    price: 599.99,
    image: 'https://picsum.photos/seed/monitor/400/400',
    category: 'Electronics',
    rating: 4.8,
    reviews: 956,
    inStock: true,
    tags: ['display', 'ultrawide', 'gaming'],
  },
  {
    id: '4',
    name: 'Running Shoes Pro',
    description: 'Lightweight running shoes with responsive cushioning, breathable mesh upper, and durable rubber outsole.',
    price: 129.99,
    image: 'https://picsum.photos/seed/shoes/400/400',
    category: 'Sports',
    rating: 4.4,
    reviews: 3102,
    inStock: true,
    tags: ['running', 'athletic', 'lightweight'],
  },
  {
    id: '5',
    name: 'Yoga Mat Premium',
    description: 'Extra thick 6mm yoga mat with non-slip surface, alignment guides, and carrying strap.',
    price: 49.99,
    image: 'https://picsum.photos/seed/yogamat/400/400',
    category: 'Sports',
    rating: 4.6,
    reviews: 1567,
    inStock: true,
    tags: ['yoga', 'fitness', 'mat'],
  },
  {
    id: '6',
    name: 'Smart Watch Series X',
    description: 'Advanced smartwatch with health monitoring, GPS, NFC payments, and 5-day battery life.',
    price: 349.99,
    image: 'https://picsum.photos/seed/smartwatch/400/400',
    category: 'Electronics',
    rating: 4.3,
    reviews: 4521,
    inStock: true,
    tags: ['wearable', 'smart', 'fitness'],
  },
  {
    id: '7',
    name: 'Ceramic Coffee Mug Set',
    description: 'Set of 4 handcrafted ceramic mugs in earth tones, microwave and dishwasher safe.',
    price: 34.99,
    image: 'https://picsum.photos/seed/mugs/400/400',
    category: 'Home',
    rating: 4.9,
    reviews: 892,
    inStock: true,
    tags: ['kitchen', 'ceramic', 'handcrafted'],
  },
  {
    id: '8',
    name: 'Standing Desk Converter',
    description: 'Adjustable sit-stand desk converter with dual monitor support and keyboard tray.',
    price: 279.99,
    image: 'https://picsum.photos/seed/desk/400/400',
    category: 'Home',
    rating: 4.2,
    reviews: 673,
    inStock: false,
    tags: ['office', 'ergonomic', 'standing'],
  },
  {
    id: '9',
    name: 'Leather Backpack',
    description: 'Genuine leather backpack with padded laptop compartment, water-resistant lining, and brass hardware.',
    price: 189.99,
    image: 'https://picsum.photos/seed/backpack/400/400',
    category: 'Accessories',
    rating: 4.6,
    reviews: 1204,
    inStock: true,
    tags: ['leather', 'laptop', 'travel'],
  },
  {
    id: '10',
    name: 'Wireless Charging Pad',
    description: 'Fast wireless charging pad compatible with all Qi-enabled devices, LED indicator, and anti-slip surface.',
    price: 29.99,
    image: 'https://picsum.photos/seed/charger/400/400',
    category: 'Electronics',
    rating: 4.1,
    reviews: 5678,
    inStock: true,
    tags: ['charging', 'wireless', 'accessories'],
  },
  {
    id: '11',
    name: 'Stainless Steel Water Bottle',
    description: 'Double-wall vacuum insulated water bottle, keeps drinks cold 24hrs or hot 12hrs.',
    price: 24.99,
    image: 'https://picsum.photos/seed/bottle/400/400',
    category: 'Sports',
    rating: 4.7,
    reviews: 3456,
    inStock: true,
    tags: ['hydration', 'insulated', 'eco-friendly'],
  },
  {
    id: '12',
    name: 'Minimalist Desk Lamp',
    description: 'LED desk lamp with adjustable color temperature, brightness levels, and USB charging port.',
    price: 59.99,
    image: 'https://picsum.photos/seed/lamp/400/400',
    category: 'Home',
    rating: 4.5,
    reviews: 789,
    inStock: true,
    tags: ['lighting', 'led', 'office'],
  },
];

export function getAllProducts(): Product[] {
  return PRODUCTS;
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find(p => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  return PRODUCTS.filter(p => p.category === category);
}

export function getCategories(): string[] {
  return [...new Set(PRODUCTS.map(p => p.category))];
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return PRODUCTS.filter(
    p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q))
  );
}
