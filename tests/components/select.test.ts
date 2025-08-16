import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../components/select/snice-select';
import '../../components/select/snice-option';

describe('snice-select component', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('initialization', () => {
    it('should register the custom element', () => {
      const el = document.createElement('snice-select');
      expect(el).toBeInstanceOf(HTMLElement);
      expect(el.constructor.name).toBe('SniceSelect');
    });

    it('should render shadow DOM content', async () => {
      container.innerHTML = `
        <snice-select>
          <snice-option value="1" label="Option 1"></snice-option>
          <snice-option value="2" label="Option 2"></snice-option>
        </snice-select>
      `;
      
      const select = container.querySelector('snice-select') as any;
      
      // Wait for ready
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(select.shadowRoot).toBeTruthy();
      expect(select.shadowRoot.querySelector('.select-wrapper')).toBeTruthy();
      expect(select.shadowRoot.querySelector('.select-trigger')).toBeTruthy();
      expect(select.shadowRoot.querySelector('.select-dropdown')).toBeTruthy();
    });

    it('should render component with proper structure', async () => {
      const select = document.createElement('snice-select') as any;
      container.appendChild(select);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Check if the component has a css method
      expect(typeof select.css).toBe('function');
      
      // Verify shadow DOM structure is created
      const wrapper = select.shadowRoot.querySelector('.select-wrapper');
      expect(wrapper).toBeTruthy();
      
      // Verify core elements exist
      const trigger = select.shadowRoot.querySelector('.select-trigger');
      expect(trigger).toBeTruthy();
      
      const dropdown = select.shadowRoot.querySelector('.select-dropdown');
      expect(dropdown).toBeTruthy();
      
      // Component renders with default size
      expect(select.size).toBe('medium');
    });
  });

  describe('options handling', () => {
    it('should read options from child elements', async () => {
      container.innerHTML = `
        <snice-select>
          <snice-option value="apple" label="Apple"></snice-option>
          <snice-option value="banana" label="Banana"></snice-option>
          <snice-option value="cherry" label="Cherry"></snice-option>
        </snice-select>
      `;
      
      const select = container.querySelector('snice-select') as any;
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check if options were read
      expect(select.options).toBeDefined();
      expect(select.options.length).toBe(3);
      expect(select.options[0].value).toBe('apple');
      expect(select.options[0].label).toBe('Apple');
      expect(select.options[1].value).toBe('banana');
      expect(select.options[2].value).toBe('cherry');
    });

    it('should handle disabled options', async () => {
      container.innerHTML = `
        <snice-select>
          <snice-option value="1" label="Enabled"></snice-option>
          <snice-option value="2" label="Disabled" disabled></snice-option>
        </snice-select>
      `;
      
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(select.options[0].disabled).toBe(false);
      expect(select.options[1].disabled).toBe(true);
    });

    it('should handle selected options', async () => {
      container.innerHTML = `
        <snice-select>
          <snice-option value="1" label="Not Selected"></snice-option>
          <snice-option value="2" label="Selected" selected></snice-option>
        </snice-select>
      `;
      
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(select.options[0].selected).toBe(false);
      expect(select.options[1].selected).toBe(true);
    });

    it('should update when child options change', async () => {
      container.innerHTML = `
        <snice-select>
          <snice-option value="1" label="Initial"></snice-option>
        </snice-select>
      `;
      
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(select.options.length).toBe(1);
      
      // Add a new option
      const newOption = document.createElement('snice-option');
      newOption.setAttribute('value', '2');
      newOption.setAttribute('label', 'Added');
      select.appendChild(newOption);
      
      // Wait for mutation observer
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(select.options.length).toBe(2);
      expect(select.options[1].value).toBe('2');
      expect(select.options[1].label).toBe('Added');
    });
  });

  describe('dropdown interaction', () => {
    it('should open dropdown on click', async () => {
      container.innerHTML = `
        <snice-select>
          <snice-option value="1" label="Option 1"></snice-option>
        </snice-select>
      `;
      
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const trigger = select.shadowRoot.querySelector('.select-trigger');
      expect(trigger).toBeTruthy();
      
      // Initially closed
      expect(select.open).toBe(false);
      
      // Click to open
      trigger.click();
      expect(select.open).toBe(true);
      
      // Click again to close
      trigger.click();
      expect(select.open).toBe(false);
    });

    it('should close dropdown when clicking outside', async () => {
      container.innerHTML = `
        <snice-select>
          <snice-option value="1" label="Option 1"></snice-option>
        </snice-select>
      `;
      
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Open dropdown
      select.openDropdown();
      expect(select.open).toBe(true);
      
      // Click outside
      document.body.click();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(select.open).toBe(false);
    });

    it('should select option on click', async () => {
      container.innerHTML = `
        <snice-select>
          <snice-option value="apple" label="Apple"></snice-option>
          <snice-option value="banana" label="Banana"></snice-option>
        </snice-select>
      `;
      
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Open dropdown
      select.openDropdown();
      
      // Click on second option
      const options = select.shadowRoot.querySelectorAll('.select-option');
      expect(options.length).toBe(2);
      
      (options[1] as HTMLElement).click();
      
      expect(select.value).toBe('banana');
      expect(select.open).toBe(false);
    });
  });

  describe('properties', () => {
    it('should handle disabled property', async () => {
      container.innerHTML = `<snice-select disabled></snice-select>`;
      const select = container.querySelector('snice-select') as any;
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(select.disabled).toBe(true);
      
      const trigger = select.shadowRoot.querySelector('.select-trigger');
      expect(trigger.disabled).toBe(true);
    });

    it('should handle multiple property', async () => {
      container.innerHTML = `
        <snice-select multiple>
          <snice-option value="1" label="One"></snice-option>
          <snice-option value="2" label="Two"></snice-option>
        </snice-select>
      `;
      
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(select.multiple).toBe(true);
      
      // Select first option
      select.selectOption('1');
      expect(select.value).toBe('1');
      
      // Select second option (should add, not replace)
      select.selectOption('2');
      expect(select.value).toBe('1,2');
    });

    it('should handle searchable property', async () => {
      // Create element programmatically to ensure proper initialization
      const select = document.createElement('snice-select') as any;
      select.setAttribute('searchable', '');
      
      const option = document.createElement('snice-option');
      option.setAttribute('value', '1');
      option.setAttribute('label', 'Option 1');
      select.appendChild(option);
      
      container.appendChild(select);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(select.searchable).toBe(true);
      
      // Search input should be in the dropdown
      const searchContainer = select.shadowRoot.querySelector('.select-search');
      expect(searchContainer).toBeTruthy();
      
      const searchInput = select.shadowRoot.querySelector('.select-search-input');
      expect(searchInput).toBeTruthy();
    });

    it('should handle clearable property', async () => {
      container.innerHTML = `
        <snice-select clearable value="test">
          <snice-option value="test" label="Test"></snice-option>
        </snice-select>
      `;
      
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(select.clearable).toBe(true);
      
      // Clear button should exist (visibility is controlled by CSS)
      const clearButton = select.shadowRoot.querySelector('.select-clear');
      expect(clearButton).toBeTruthy();
    });
  });

  describe('search functionality', () => {
    it('should filter options based on search input', async () => {
      const select = document.createElement('snice-select') as any;
      select.setAttribute('searchable', '');
      
      const options = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'apricot', label: 'Apricot' }
      ];
      
      options.forEach(opt => {
        const option = document.createElement('snice-option');
        option.setAttribute('value', opt.value);
        option.setAttribute('label', opt.label);
        select.appendChild(option);
      });
      
      container.appendChild(select);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      select.openDropdown();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const searchInput = select.shadowRoot.querySelector('.select-search-input') as HTMLInputElement;
      
      // Check that search input exists
      expect(searchInput).toBeTruthy();
      
      if (searchInput) {
        // Type "ap" to filter
        searchInput.value = 'ap';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        expect(select.filteredOptions.length).toBe(2);
        expect(select.filteredOptions[0].label).toBe('Apple');
        expect(select.filteredOptions[1].label).toBe('Apricot');
      }
    });
  });

  describe('events', () => {
    it('should dispatch change event when selection changes', async () => {
      container.innerHTML = `
        <snice-select>
          <snice-option value="1" label="One"></snice-option>
          <snice-option value="2" label="Two"></snice-option>
        </snice-select>
      `;
      
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      let changeEvent: any = null;
      select.addEventListener('@snice/select-change', (e: any) => {
        changeEvent = e;
      });
      
      select.selectOption('2');
      
      expect(changeEvent).toBeTruthy();
      expect(changeEvent.detail.value).toBe('2');
      expect(changeEvent.detail.option.label).toBe('Two');
    });

    it('should dispatch open event', async () => {
      container.innerHTML = `<snice-select></snice-select>`;
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      let openEvent: any = null;
      select.addEventListener('@snice/select-open', (e: any) => {
        openEvent = e;
      });
      
      select.openDropdown();
      
      expect(openEvent).toBeTruthy();
      expect(openEvent.detail.select).toBe(select);
    });

    it('should dispatch close event', async () => {
      container.innerHTML = `<snice-select></snice-select>`;
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      let closeEvent: any = null;
      select.addEventListener('@snice/select-close', (e: any) => {
        closeEvent = e;
      });
      
      select.openDropdown();
      select.closeDropdown();
      
      expect(closeEvent).toBeTruthy();
      expect(closeEvent.detail.select).toBe(select);
    });
  });

  describe('keyboard navigation', () => {
    it('should open dropdown with Enter key', async () => {
      container.innerHTML = `
        <snice-select>
          <snice-option value="1" label="One"></snice-option>
        </snice-select>
      `;
      
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const trigger = select.shadowRoot.querySelector('.select-trigger');
      
      // Simulate Enter key with bubbles for event delegation
      const event = new KeyboardEvent('keydown', { 
        key: 'Enter',
        bubbles: true,
        cancelable: true
      });
      trigger.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(select.open).toBe(true);
    });

    it('should close dropdown with Escape key', async () => {
      container.innerHTML = `
        <snice-select>
          <snice-option value="1" label="One"></snice-option>
        </snice-select>
      `;
      
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 50));
      
      select.openDropdown();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Simulate Escape key - global handler listens on document
      const event = new KeyboardEvent('keydown', { 
        key: 'Escape',
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(select.open).toBe(false);
    });
  });

  describe('public API', () => {
    it('should expose focus method', async () => {
      container.innerHTML = `<snice-select></snice-select>`;
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(typeof select.focus).toBe('function');
      select.focus();
    });

    it('should expose blur method', async () => {
      container.innerHTML = `<snice-select></snice-select>`;
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(typeof select.blur).toBe('function');
      select.blur();
    });

    it('should expose clear method', async () => {
      container.innerHTML = `
        <snice-select value="test">
          <snice-option value="test" label="Test"></snice-option>
        </snice-select>
      `;
      
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(select.value).toBe('test');
      
      select.clear();
      
      expect(select.value).toBe('');
    });

    it('should expose selectOption method', async () => {
      container.innerHTML = `
        <snice-select>
          <snice-option value="a" label="A"></snice-option>
          <snice-option value="b" label="B"></snice-option>
        </snice-select>
      `;
      
      const select = container.querySelector('snice-select') as any;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      select.selectOption('b');
      
      expect(select.value).toBe('b');
    });
  });
});