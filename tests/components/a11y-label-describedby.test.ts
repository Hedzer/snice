import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

// Theme 2: label + aria-describedby wiring. Inputs must have an id that
// their <label for="..."> points to, and any rendered error/helper text must
// be referenced via aria-describedby.

const SPECS = [
  { tag: 'snice-input',    path: '../../components/input/snice-input' },
  { tag: 'snice-textarea', path: '../../components/textarea/snice-textarea' },
];

for (const { tag, path } of SPECS) {
  describe(`${tag}: label and helper/error are properly associated`, () => {
    it('label for= links to input id', async () => {
      await import(path);
      const el = document.createElement(tag) as any;
      el.label = 'Email';
      document.body.appendChild(el);
      await el.ready;
      await wait(30);

      const label = el.shadowRoot.querySelector('label');
      const input = el.shadowRoot.querySelector('input, textarea');
      expect(label).toBeTruthy();
      expect(input).toBeTruthy();
      expect(input.id).toBeTruthy();
      expect(label.getAttribute('for')).toBe(input.id);
    });

    it('aria-describedby points to rendered helper text', async () => {
      await import(path);
      const el = document.createElement(tag) as any;
      el.label = 'Email';
      el.helperText = 'We will not share';
      document.body.appendChild(el);
      await el.ready;
      await wait(30);

      const input = el.shadowRoot.querySelector('input, textarea');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      const helper = el.shadowRoot.getElementById(describedBy!);
      expect(helper?.textContent).toContain('We will not share');
    });

    it('aria-describedby points to rendered error text', async () => {
      await import(path);
      const el = document.createElement(tag) as any;
      el.label = 'Email';
      el.errorText = 'Required';
      document.body.appendChild(el);
      await el.ready;
      await wait(30);

      const input = el.shadowRoot.querySelector('input, textarea');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      const err = el.shadowRoot.getElementById(describedBy!);
      expect(err?.textContent).toContain('Required');
    });

    it('aria-invalid reflects invalid prop', async () => {
      await import(path);
      const el = document.createElement(tag) as any;
      el.invalid = true;
      document.body.appendChild(el);
      await el.ready;
      await wait(30);

      const input = el.shadowRoot.querySelector('input, textarea');
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });
  });
}
