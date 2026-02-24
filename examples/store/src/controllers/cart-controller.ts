import { controller, respond, context } from 'snice';
import type { Context } from 'snice';
import type { StoreAppContext, Product, CartItem } from '../types/store';
import { addToCart, removeFromCart, updateQuantity, getCartTotal, getCartCount } from '../services/cart';

@controller('cart-controller')
class CartController {
  element!: HTMLElement;
  private ctx!: Context;

  async attach(el: HTMLElement) {
    this.element = el;
  }

  async detach() {}

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
  }

  @respond('add-to-cart')
  handleAddToCart(payload: { product: Product; quantity: number }): CartItem[] {
    const app = this.ctx.application as StoreAppContext;
    app.cart = addToCart(app.cart, payload.product, payload.quantity);
    app.cartTotal = getCartTotal(app.cart);
    app.cartCount = getCartCount(app.cart);
    this.ctx.update();
    return app.cart;
  }

  @respond('remove-from-cart')
  handleRemoveFromCart(payload: { productId: string }): CartItem[] {
    const app = this.ctx.application as StoreAppContext;
    app.cart = removeFromCart(app.cart, payload.productId);
    app.cartTotal = getCartTotal(app.cart);
    app.cartCount = getCartCount(app.cart);
    this.ctx.update();
    return app.cart;
  }

  @respond('update-cart-quantity')
  handleUpdateQuantity(payload: { productId: string; quantity: number }): CartItem[] {
    const app = this.ctx.application as StoreAppContext;
    app.cart = updateQuantity(app.cart, payload.productId, payload.quantity);
    app.cartTotal = getCartTotal(app.cart);
    app.cartCount = getCartCount(app.cart);
    this.ctx.update();
    return app.cart;
  }

  @respond('get-cart')
  handleGetCart(): { items: CartItem[]; total: number; count: number } {
    const app = this.ctx.application as StoreAppContext;
    return { items: app.cart, total: app.cartTotal, count: app.cartCount };
  }
}

export { CartController };
