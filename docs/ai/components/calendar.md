# snice-calendar

Calendar with date selection and event support.

## Properties

```typescript
value: Date | string = new Date();
view: 'month'|'week'|'day' = 'month';
events: CalendarEvent[] = [];
minDate: Date | string = '';
maxDate: Date | string = '';
disabledDates: (Date | string)[] = [];
highlightToday: boolean = true;
showWeekNumbers: boolean = false;
firstDayOfWeek: number = 0; // 0=Sun, 1=Mon
locale: string = 'en-US';
```

## CalendarEvent

```typescript
interface CalendarEvent {
  id: string | number;
  title: string;
  start: Date | string;
  end?: Date | string;
  color?: string;
  data?: any;
}
```

## Methods

```typescript
goToToday(): void
goToDate(date: Date | string): void
previousMonth(): void
nextMonth(): void
previousWeek(): void
nextWeek(): void
previousDay(): void
nextDay(): void
getDisplayedMonth(): { month: number; year: number }
getEventsForDate(date: Date | string): CalendarEvent[]
```

## Events

- `calendar-change` - Date selected (detail: { value, calendar })
- `calendar-event-click` - Event clicked (detail: { event, calendar })

## Usage

```html
<snice-calendar></snice-calendar>

<!-- With events -->
<snice-calendar></snice-calendar>
```

```typescript
calendar.events = [
  { id: 1, title: 'Meeting', start: new Date(), color: '#2196f3' }
];
```

```html
<!-- With restrictions -->
<snice-calendar
  min-date="2024-01-01"
  max-date="2024-12-31"
  first-day-of-week="1"
  locale="fr-FR">
</snice-calendar>
```

```typescript
// Programmatic control
calendar.goToToday();
calendar.previousMonth();
calendar.nextMonth();
calendar.goToDate(new Date(2024, 5, 15));
```

**CSS Parts:**
- `base` - Main calendar container
- `header` - Header with title and navigation buttons
- `grid` - Day cells grid

## Features

- Month/week/day views
- Event display with colors
- Date restrictions (min/max/disabled)
- Locale support
- Week starting day configuration
- Week numbers (optional)
- Keyboard navigation
- Event click handling
- Programmatic navigation
- Multi-event days
- Today highlighting
