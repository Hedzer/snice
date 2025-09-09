# Snice Date Picker

A comprehensive calendar-based date selection component built with Snice framework.

## Features

- ✅ **Calendar-based date selection** with month navigation
- ✅ **Multiple date formats** (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.)
- ✅ **Keyboard navigation** and accessibility support
- ✅ **Min/max date constraints** for date range validation
- ✅ **Multiple sizes** (small, medium, large) and variants (outlined, filled, underlined)
- ✅ **Input validation** with custom error messages
- ✅ **Clearable** with optional clear button
- ✅ **Imperative API** for programmatic control
- ✅ **Custom events** for integration with forms and controllers

## Basic Usage

```html
<snice-date-picker 
  label="Select Date" 
  placeholder="Choose a date"
  clearable>
</snice-date-picker>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size of the component |
| `variant` | `'outlined' \| 'filled' \| 'underlined'` | `'outlined'` | Visual style variant |
| `value` | `string` | `''` | Current date value (in specified format) |
| `format` | `'mm/dd/yyyy' \| 'dd/mm/yyyy' \| 'yyyy-mm-dd' \| etc.` | `'mm/dd/yyyy'` | Date display format |
| `placeholder` | `string` | `''` | Input placeholder text |
| `label` | `string` | `''` | Input label |
| `helper-text` | `string` | `''` | Helper text below input |
| `error-text` | `string` | `''` | Error message (shows when invalid=true) |
| `disabled` | `boolean` | `false` | Disable the component |
| `readonly` | `boolean` | `false` | Make input read-only |
| `required` | `boolean` | `false` | Mark as required field |
| `invalid` | `boolean` | `false` | Show error state |
| `clearable` | `boolean` | `false` | Show clear button |
| `min` | `string` | `''` | Minimum allowed date (YYYY-MM-DD) |
| `max` | `string` | `''` | Maximum allowed date (YYYY-MM-DD) |
| `name` | `string` | `''` | Form field name |
| `first-day-of-week` | `number` | `0` | First day of week (0=Sunday, 1=Monday, etc.) |

## Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `focus()` | - | Focus the input field |
| `blur()` | - | Blur the input field |
| `clear()` | - | Clear the selected date |
| `open()` | - | Open the calendar popup |
| `close()` | - | Close the calendar popup |
| `selectDate(date)` | `Date` | Select a specific date |
| `goToMonth(year, month)` | `number, number` | Navigate to specific month |
| `goToToday()` | - | Select today's date |
| `checkValidity()` | - | Check if current value is valid |
| `reportValidity()` | - | Report validity state |
| `setCustomValidity(message)` | `string` | Set custom validation message |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `@snice/datepicker-change` | `{ value, date, formatted, iso, datePicker }` | Fired when date value changes |
| `@snice/datepicker-input` | `{ value, datePicker }` | Fired on input changes |
| `@snice/datepicker-select` | `{ date, formatted, iso, datePicker }` | Fired when date is selected from calendar |
| `@snice/datepicker-focus` | `{ datePicker }` | Fired when input gains focus |
| `@snice/datepicker-blur` | `{ datePicker }` | Fired when input loses focus |
| `@snice/datepicker-open` | `{ datePicker }` | Fired when calendar opens |
| `@snice/datepicker-close` | `{ datePicker }` | Fired when calendar closes |
| `@snice/datepicker-clear` | `{ datePicker }` | Fired when date is cleared |

## Examples

### Different Formats

```html
<!-- US Format -->
<snice-date-picker 
  label="US Date" 
  format="mm/dd/yyyy">
</snice-date-picker>

<!-- European Format -->
<snice-date-picker 
  label="European Date" 
  format="dd/mm/yyyy">
</snice-date-picker>

<!-- ISO Format -->
<snice-date-picker 
  label="ISO Date" 
  format="yyyy-mm-dd">
</snice-date-picker>
```

### With Constraints

```html
<snice-date-picker 
  label="Date Range" 
  min="2024-01-01" 
  max="2024-12-31"
  helper-text="Select a date in 2024">
</snice-date-picker>
```

### Different Sizes and Variants

```html
<!-- Small filled -->
<snice-date-picker 
  size="small" 
  variant="filled" 
  label="Small Date">
</snice-date-picker>

<!-- Large underlined -->
<snice-date-picker 
  size="large" 
  variant="underlined" 
  label="Large Date">
</snice-date-picker>
```

### Form Integration

```html
<form>
  <snice-date-picker 
    name="startDate"
    label="Start Date" 
    required
    min="2024-01-01">
  </snice-date-picker>
  
  <snice-date-picker 
    name="endDate"
    label="End Date" 
    required>
  </snice-date-picker>
</form>
```

### Event Handling

```javascript
// Listen for date changes
document.addEventListener('@snice/datepicker-change', (e) => {
  console.log('New date:', e.detail.date);
  console.log('Formatted:', e.detail.formatted);
  console.log('ISO:', e.detail.iso);
});

// Programmatic control
const datePicker = document.querySelector('snice-date-picker');
datePicker.selectDate(new Date(2024, 11, 25)); // Select Christmas
datePicker.goToToday(); // Jump to today
```

### With Controllers

```typescript
import { controller, on } from 'snice';

@controller('date-form')
class DateFormController {
  element!: HTMLElement;
  
  @on('@snice/datepicker-change')
  handleDateChange(e: CustomEvent) {
    const { date, formatted } = e.detail;
    console.log(`Date changed to: ${formatted}`);
    
    // Validate date range, update other fields, etc.
    this.validateDateRange();
  }
  
  private validateDateRange() {
    const startPicker = this.element.querySelector('[name="startDate"]');
    const endPicker = this.element.querySelector('[name="endDate"]');
    // Add validation logic
  }
}
```

## Accessibility

The date picker includes comprehensive accessibility support:

- **ARIA labels** for all interactive elements
- **Keyboard navigation** (Tab, Enter, Escape, Arrow keys)
- **Screen reader** announcements
- **Focus management** within calendar
- **Semantic HTML** structure

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate between elements |
| `Enter` / `Space` | Open calendar or select date |
| `Escape` | Close calendar |
| `Arrow Keys` | Navigate calendar days |
| `Page Up/Down` | Navigate months |
| `Home/End` | Go to start/end of week |

## Customization

The component uses CSS custom properties for easy theming:

```css
snice-date-picker {
  --border-color: #e5e7eb;
  --focus-color: #2563eb;
  --background: white;
  --text-color: #374151;
  --error-color: #ef4444;
}
```

## Browser Support

- ✅ Chrome/Edge 88+
- ✅ Firefox 87+
- ✅ Safari 14+
- ✅ iOS Safari 14+
- ✅ Chrome Android 88+