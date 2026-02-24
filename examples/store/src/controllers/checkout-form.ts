import { controller, on } from 'snice';

@controller('checkout-form')
class CheckoutFormController {
  element!: HTMLFormElement;

  async attach(el: HTMLElement) {
    this.element = el as HTMLFormElement;
  }

  async detach() {}

  @on('submit')
  handleSubmit(e: Event) {
    e.preventDefault();
    const form = this.element;
    const data = new FormData(form);
    const values = Object.fromEntries(data.entries());

    form.dispatchEvent(
      new CustomEvent('form-submit', {
        bubbles: true,
        composed: true,
        detail: values,
      })
    );
  }

  @on('input', 'input')
  handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.validity.valid) {
      input.classList.add('invalid');
    } else {
      input.classList.remove('invalid');
    }
  }
}

export { CheckoutFormController };
