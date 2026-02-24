import type { CartItem, Product } from '../types/store';

const CART_KEY = 'snice-store-cart';

export function loadCart(): CartItem[] {
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(cart: CartItem[], product: Product, quantity = 1): CartItem[] {
  const existing = cart.find(item => item.product.id === product.id);
  let updated: CartItem[];
  if (existing) {
    updated = cart.map(item =>
      item.product.id === product.id
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  } else {
    updated = [...cart, { product, quantity }];
  }
  saveCart(updated);
  return updated;
}

export function removeFromCart(cart: CartItem[], productId: string): CartItem[] {
  const updated = cart.filter(item => item.product.id !== productId);
  saveCart(updated);
  return updated;
}

export function updateQuantity(cart: CartItem[], productId: string, quantity: number): CartItem[] {
  if (quantity <= 0) return removeFromCart(cart, productId);
  const updated = cart.map(item =>
    item.product.id === productId ? { ...item, quantity } : item
  );
  saveCart(updated);
  return updated;
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

export function getCartCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}
